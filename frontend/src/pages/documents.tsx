import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileStack, Upload, Search, Trash2, FileText, FileType, RefreshCcw, X, CircleAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/badges';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/shared/skeleton';
import { api, ApiError } from '@/lib/api';
import { useData } from '@/lib/data-context';
import { useActivity } from '@/lib/activity-context';
import { cn, formatBytes, formatDate, iconNameForFilename } from '@/lib/utils';
import type { DocumentStatus, ProactiveAlert } from '@/lib/types';

type StatusFilter = 'all' | DocumentStatus;

export default function DocumentsPage() {
  const { documents, refreshDocuments, refreshEntities } = useData();
  const { logEvent } = useActivity();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReindexing, setIsReindexing] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ alert: ProactiveAlert; filename: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = (documents ?? []).filter((d) => {
    const matchesSearch = d.filename.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFile = useCallback(
    async (file: File) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!['.pdf', '.txt'].includes(ext)) {
        setUploadError(`${ext} isn't supported. Upload a PDF or plain text file.`);
        return;
      }
      if (file.size / (1024 * 1024) > 15) {
        setUploadError('That file is larger than 15 MB.');
        return;
      }
      setUploadError(null);
      setUploadingName(file.name);
      setUploadProgress(0);
      try {
        const result = await api.uploadDocument(file, setUploadProgress);
        await refreshDocuments();
        await refreshEntities();
        logEvent({
          type: 'upload',
          title: 'Document ingested',
          description: `${result.entities_extracted.length} entities extracted from ${file.name}`,
        });
        if (result.proactive_alert.triggered) {
          setActiveAlert({ alert: result.proactive_alert, filename: file.name });
          logEvent({
            type: 'alert',
            title: 'Proactive recall triggered',
            description: result.proactive_alert.message ?? `${file.name} shares an entity with a prior document`,
          });
        }
      } catch (err) {
        setUploadError(err instanceof ApiError ? err.message : 'Upload failed. Try again.');
      } finally {
        setUploadingName(null);
        setUploadProgress(0);
      }
    },
    [refreshDocuments, refreshEntities, logEvent]
  );

  async function handleDelete(id: string, filename: string) {
    setDeletingId(id);
    try {
      await api.deleteDocument(id);
      await refreshDocuments();
      await refreshEntities();
      logEvent({ type: 'delete', title: 'Document removed', description: filename });
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Could not delete document.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReindex() {
    setIsReindexing(true);
    try {
      const result = await api.reindex();
      await refreshDocuments();
      logEvent({
        type: 'upload',
        title: 'Reindex complete',
        description: `${result.documents_ingested} document(s), ${result.chunks_loaded} chunks rebuilt`,
      });
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Reindex failed.');
    } finally {
      setIsReindexing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Document Library"
        description="Upload equipment manuals, maintenance logs, and incident reports. Each upload is chunked and indexed immediately."
        icon={FileStack}
        meta={[{ label: 'Total', value: String(documents?.length ?? 0) }]}
        actions={
          <Button variant="outline" size="sm" className="gap-2" onClick={handleReindex} disabled={isReindexing}>
            <RefreshCcw className={cn('h-4 w-4', isReindexing && 'animate-spin')} />
            {isReindexing ? 'Reindexing…' : 'Reindex from disk'}
          </Button>
        }
      />

      <AnimatePresence>
        {activeAlert && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="rounded-lg border border-copper/30 bg-gradient-to-br from-copper/10 to-transparent overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-copper/40 bg-surface text-copper"><CircleAlert className="h-4 w-4" /></span>
                <div>
                  <p className="text-sm font-medium text-foreground">Proactive recall — related entity found</p>
                  <p className="mt-0.5 text-sm text-muted">{activeAlert.alert.message}</p>
                </div>
              </div>
              <button onClick={() => setActiveAlert(null)} className="shrink-0 rounded-md p-1 text-muted hover:bg-surface-2 hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            {activeAlert.alert.matches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-copper/20 bg-surface/40 px-5 py-3">
                {activeAlert.alert.matches.map((m) => (
                  <div key={m.entity} className="flex items-center gap-2 font-mono text-xs">
                    <span className="rounded-md border border-border bg-surface-2 px-2 py-1 text-foreground-2">{activeAlert.filename}</span>
                    <span className="text-copper">↔ {m.entity} ↔</span>
                    <span className="rounded-md border border-border bg-surface-2 px-2 py-1 text-foreground-2">{m.previously_found_in.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging ? 'border-copper bg-copper/5' : 'border-border bg-surface'
        )}
      >
        <Upload className="mb-3 h-8 w-8 text-muted" strokeWidth={1.5} />
        <p className="text-sm text-foreground-2">
          Drag a document here, or{' '}
          <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-copper hover:underline">browse files</button>
        </p>
        <p className="mt-1 font-mono text-xs text-muted">PDF or TXT, up to 15 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        {uploadingName && (
          <div className="mt-4 w-full max-w-xs">
            <div className="flex items-center justify-between text-xs text-copper mb-1"><span>Uploading {uploadingName}</span><span>{uploadProgress}%</span></div>
            <div className="h-1.5 w-full rounded-full bg-surface-2 overflow-hidden"><motion.div className="h-full bg-copper" animate={{ width: `${uploadProgress}%` }} /></div>
          </div>
        )}
      </div>
      {uploadError && <p role="alert" className="text-sm text-danger">{uploadError}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'ingested', 'uploaded', 'failed'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                statusFilter === s ? 'border-copper/40 bg-copper/10 text-copper' : 'border-border bg-surface text-muted hover:text-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {documents === null ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <SkeletonRow key={i} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/50 p-16 text-center">
          <FileStack className="mx-auto h-8 w-8 text-muted-2 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">{documents.length === 0 ? 'No documents yet' : 'No documents match your filters'}</p>
          <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
            {documents.length === 0
              ? 'Upload an equipment manual, maintenance log, or incident report to get started.'
              : 'Try a different search term or status filter.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface font-mono text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Document</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Entities</th>
                <th className="px-4 py-3 font-medium">Chunks</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const Icon = iconNameForFilename(doc.filename) === 'FileType' ? FileType : FileText;
                return (
                  <tr key={doc.id} className="border-b border-border/60 last:border-0 hover:bg-surface-2/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-2 border border-border text-copper"><Icon className="h-4 w-4" /></div>
                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate font-medium text-foreground" title={doc.filename}>{doc.filename}</p>
                          <p className="font-mono text-xs text-muted">{formatBytes(doc.size_bytes)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3 font-mono text-foreground-2">{doc.entity_count}</td>
                    <td className="px-4 py-3 font-mono text-foreground-2">{doc.chunk_count}</td>
                    <td className="px-4 py-3 text-muted">{formatDate(doc.uploaded_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(doc.id, doc.filename)}
                        disabled={deletingId === doc.id}
                        className="rounded-md p-1.5 text-muted-2 transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                        aria-label={`Delete ${doc.filename}`}
                        title="Delete document"
                      >
                        {deletingId === doc.id ? (
                          <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, FileStack, Network, MessagesSquare, Gauge,
  Cpu, Activity, Upload, Sparkles, ArrowUpRight, ChevronRight,
  LogIn, Trash2, CircleAlert, FileText, FileType,
} from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/badges';
import { useData } from '@/lib/data-context';
import { useActivity } from '@/lib/activity-context';
import { useAuth } from '@/lib/auth-context';
import { cn, timeAgo, iconNameForFilename, formatBytes } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const activityIcon = { login: LogIn, upload: Upload, alert: CircleAlert, query: MessagesSquare, delete: Trash2 } as const;
const activityColor = { login: 'text-info', upload: 'text-copper', alert: 'text-warning', query: 'text-success', delete: 'text-danger' } as const;

export default function DashboardPage() {
  const { documents, totalChunks, entities, crossReferencedCount, health, isHealthy } = useData();
  const { events, queries } = useActivity();
  const { username } = useAuth();

  const docCount = documents?.length ?? 0;
  const ingestedCount = documents?.filter((d) => d.status === 'ingested').length ?? 0;
  const entityCount = entities?.length ?? 0;

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-8 space-y-8">
      <PageHeader
        title="Industrial Knowledge Intelligence"
        description="Transform industrial documents into searchable knowledge with AI-powered reasoning and proactive operational intelligence."
        icon={LayoutDashboard}
        meta={[
          { label: 'Documents', value: String(docCount) },
          { label: 'Chunks indexed', value: String(totalChunks) },
          { label: 'This session', value: `${queries.length} question${queries.length === 1 ? '' : 's'}` },
        ]}
        actions={
          <>
            <Link to="/documents" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}><Upload className="h-4 w-4" /> Upload</Link>
            <Link to="/chat" className={buttonVariants({ size: 'sm', className: 'gap-2' })}><Sparkles className="h-4 w-4" /> Ask IKIP AI</Link>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-2 relative overflow-hidden rounded-lg border border-border bg-surface p-8"
        >
          <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-copper/40 via-copper/10 to-transparent" />
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-copper">
            <span className={cn('h-1.5 w-1.5 rounded-full bg-copper', isHealthy && 'animate-pulse')} />
            {isHealthy ? 'AI Engine Operational' : 'AI Engine Unreachable'}
          </div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight text-foreground max-w-xl leading-tight">
            Welcome back, {username}.
          </h2>
          <p className="mt-3 text-sm text-muted max-w-2xl leading-relaxed">
            {docCount === 0
              ? 'No documents ingested yet — upload your first equipment manual, maintenance log, or incident report to get started.'
              : `${entityCount} entities are tracked across ${docCount} document${docCount === 1 ? '' : 's'} (${ingestedCount} fully ingested). ${crossReferencedCount} entit${crossReferencedCount === 1 ? 'y appears' : 'ies appear'} in more than one document.`}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/chat" className={buttonVariants({ size: 'sm', className: 'gap-2' })}><MessagesSquare className="h-4 w-4" /> Start reasoning session</Link>
            <Link to="/entities" className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-2' })}><Gauge className="h-4 w-4" /> View entity intelligence</Link>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05, ease: [0.16, 1, 0.3, 1] }} className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-md border', isHealthy ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20')}><Cpu className={cn('h-4 w-4', isHealthy ? 'text-success' : 'text-danger')} strokeWidth={1.75} /></div>
              <div><p className="text-sm font-medium text-foreground">API Status</p><p className="text-[11px] text-muted">{health?.llm_model ?? 'connecting…'}</p></div>
            </div>
            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded', isHealthy ? 'text-success bg-success/10' : 'text-danger bg-danger/10')}>{isHealthy ? 'Healthy' : 'Offline'}</span>
          </div>
          <div className="mt-5 space-y-3.5">
            {[
              { label: 'Documents ingested', value: `${ingestedCount} / ${docCount || 0}` },
              { label: 'Chunks indexed', value: String(totalChunks) },
              { label: 'Entities tracked', value: String(entityCount) },
              { label: 'Cross-referenced', value: String(crossReferencedCount) },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-[11px]">
                <span className="text-muted">{s.label}</span>
                <span className="font-medium text-foreground tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Documents" value={docCount} icon={FileStack} accent="copper" sublabel={`${ingestedCount} fully ingested`} index={0} />
        <StatCard label="Entities Tracked" value={entityCount} icon={Network} accent="info" sublabel="extracted & deduplicated" index={1} />
        <StatCard label="Chunks Indexed" value={totalChunks} icon={MessagesSquare} accent="success" sublabel="available to retrieval" index={2} />
        <StatCard label="Cross-Referenced" value={crossReferencedCount} icon={Gauge} accent="warning" sublabel="entities in 2+ documents" index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2"><FileStack className="h-4 w-4 text-copper" strokeWidth={1.75} /> Recent Documents</h3>
            <Link to="/documents" className="text-xs text-copper hover:text-copper-hover flex items-center gap-1">View all <ChevronRight className="h-3 w-3" /></Link>
          </div>
          {docCount === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/50 p-10 text-center">
              <p className="text-sm text-muted">No documents yet. <Link to="/documents" className="text-copper hover:underline">Upload one to get started.</Link></p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {(documents ?? []).slice(0, 4).map((doc, i) => {
                const Icon = iconNameForFilename(doc.filename) === 'FileType' ? FileType : FileText;
                return (
                  <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} whileHover={{ y: -2 }} className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-copper/30 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-2 border border-border text-copper"><Icon className="h-5 w-5" strokeWidth={1.75} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" title={doc.filename}>{doc.filename}</p>
                        <p className="text-[11px] text-muted mt-0.5">{formatBytes(doc.size_bytes)}</p>
                        <div className="mt-2 flex items-center gap-2"><StatusBadge status={doc.status} /><span className="text-[11px] text-muted">{doc.entity_count} entities · {doc.chunk_count} chunks</span></div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2"><Activity className="h-4 w-4 text-copper" strokeWidth={1.75} /> This Session</h3>
          <div className="rounded-lg border border-border bg-surface p-4">
            {events.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">Nothing yet — upload a document or ask a question.</p>
            ) : (
              <div className="relative space-y-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                {events.slice(0, 6).map((a, i) => {
                  const Icon = activityIcon[a.type];
                  const color = activityColor[a.type];
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} className="relative flex gap-3">
                      <div className="relative z-10 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-surface border border-border mt-1"><Icon className={cn('h-3 w-3', color)} strokeWidth={2} /></div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-sm font-medium text-foreground leading-snug">{a.title}</p>
                        <p className="text-[11px] text-muted leading-snug mt-0.5">{a.description}</p>
                        <p className="text-[10px] text-muted-2 mt-1">{timeAgo(a.timestamp)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2"><Network className="h-4 w-4 text-copper" strokeWidth={1.75} /> Tracked Entities</h3>
          <Link to="/entities" className="text-xs text-copper hover:text-copper-hover flex items-center gap-1">Entity intelligence <ChevronRight className="h-3 w-3" /></Link>
        </div>
        {entityCount === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface/50 p-10 text-center">
            <p className="text-sm text-muted">No entities extracted yet. Upload documents that share equipment tags to see cross-references appear here.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(entities ?? []).slice(0, 4).map((e, i) => (
              <motion.div key={e.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} whileHover={{ y: -2 }} className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-copper/30 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div><p className="text-sm font-medium text-foreground">{e.name}</p><p className="text-[11px] text-muted mt-0.5">{e.mention_count} mentions</p></div>
                  {e.cross_referenced && <span className="inline-flex items-center rounded border border-copper/20 bg-copper/10 px-2 py-0.5 text-[11px] font-medium text-copper">Cross-ref</span>}
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] text-muted"><FileStack className="h-3 w-3" /> {e.documents.length} document{e.documents.length === 1 ? '' : 's'}<ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-copper" /></div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

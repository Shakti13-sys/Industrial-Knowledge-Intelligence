import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Search, FileStack, Link2, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { SkeletonCard } from '@/components/shared/skeleton';
import { Input } from '@/components/ui/input';
import { useData } from '@/lib/data-context';
import type { EntitySummary } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';

type Filter = 'all' | 'cross-referenced';

export default function EntitiesPage() {
  const { entities, crossReferencedCount, documents } = useData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = (entities ?? []).filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || e.cross_referenced;
    return matchesSearch && matchesFilter;
  });

  const selectedEntity = entities?.find((e) => e.name === selected) ?? null;

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Entity Intelligence"
        description="Every entity extracted across your documents, with real cross-document relationships — no fabricated risk scores, just what the corpus actually shows."
        icon={Network}
        meta={[{ label: 'Tracked', value: String(entities?.length ?? 0) }]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Entities" value={entities?.length ?? 0} icon={Network} accent="copper" index={0} />
        <StatCard label="Cross-Referenced" value={crossReferencedCount} icon={Link2} accent="warning" sublabel="appear in 2+ documents" index={1} />
        <StatCard label="Documents Indexed" value={documents?.length ?? 0} icon={FileStack} accent="info" index={2} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entities…" className="pl-9" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'cross-referenced'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                filter === f ? 'border-copper/40 bg-copper/10 text-copper' : 'border-border bg-surface text-muted hover:text-foreground'
              )}
            >
              {f === 'all' ? 'All' : 'Cross-referenced only'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {entities === null ? (
            <div className="grid sm:grid-cols-2 gap-4">{[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface/50 p-16 text-center">
              <Network className="mx-auto h-8 w-8 text-muted-2 mb-3" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">{entities.length === 0 ? 'No entities extracted yet' : 'No entities match your filters'}</p>
              <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
                {entities.length === 0
                  ? 'Upload documents and IKIP will extract equipment tags, incident IDs, and regulatory references automatically.'
                  : 'Try a different search term or filter.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {filtered.map((e, i) => (
                <motion.button
                  key={e.name}
                  onClick={() => setSelected(e.name === selected ? null : e.name)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={cn(
                    'text-left rounded-lg border bg-surface p-4 transition-colors hover:border-copper/30 hover:shadow-md',
                    selected === e.name ? 'border-copper/50 bg-copper/5' : 'border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-sm font-medium text-foreground">{e.name}</p>
                    {e.cross_referenced && (
                      <span className="inline-flex items-center rounded border border-copper/20 bg-copper/10 px-2 py-0.5 text-[10px] font-medium text-copper shrink-0">Cross-ref</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted">{e.mention_count} mentions · {e.documents.length} document{e.documents.length === 1 ? '' : 's'}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {e.documents.slice(0, 3).map((d) => (
                      <span key={d} className="rounded bg-surface-2 border border-border px-1.5 py-0.5 text-[10px] text-foreground-2 truncate max-w-[110px]">{d}</span>
                    ))}
                    {e.documents.length > 3 && <span className="text-[10px] text-muted-2 self-center">+{e.documents.length - 3} more</span>}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <EntityDetailPanel entity={selectedEntity} />
        </div>
      </div>
    </div>
  );
}

function EntityDetailPanel({ entity }: { entity: EntitySummary | null }) {
  if (!entity) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center">
        <Network className="mx-auto h-6 w-6 text-muted-2 mb-2" strokeWidth={1.5} />
        <p className="text-sm text-muted">Select an entity to see its documents, related entities, and timeline.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-copper/30 bg-surface p-5 space-y-4 sticky top-20">
      <div>
        <p className="font-mono text-base font-semibold text-foreground">{entity.name}</p>
        <p className="text-[11px] text-muted mt-0.5">{entity.mention_count} mentions across {entity.documents.length} document{entity.documents.length === 1 ? '' : 's'}</p>
      </div>

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted mb-2 flex items-center gap-1.5"><FileStack className="h-3 w-3" /> Found in</p>
        <div className="space-y-1">
          {entity.documents.map((d) => (
            <p key={d} className="text-xs text-foreground-2 truncate rounded bg-surface-2 border border-border px-2 py-1.5">{d}</p>
          ))}
        </div>
      </div>

      {entity.related.length > 0 && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted mb-2 flex items-center gap-1.5"><Link2 className="h-3 w-3" /> Co-occurs with</p>
          <div className="flex flex-wrap gap-1.5">
            {entity.related.map((r) => (
              <span key={r} className="rounded-full border border-copper/20 bg-copper/10 px-2 py-0.5 font-mono text-[11px] text-copper">{r}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted mb-2 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Timeline</p>
        <div className="flex items-center justify-between text-xs text-foreground-2">
          <span>First seen</span><span className="font-medium">{formatDate(entity.first_seen)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-foreground-2 mt-1">
          <span>Last seen</span><span className="font-medium">{formatDate(entity.last_seen)}</span>
        </div>
      </div>
    </motion.div>
  );
}

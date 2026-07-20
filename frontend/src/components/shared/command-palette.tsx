import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileStack, MessagesSquare, Upload, Settings, LayoutDashboard,
  Network, Gauge, CornerDownLeft, FileText, FileType, Sparkles, Clock,
} from 'lucide-react';
import { cn, iconNameForFilename } from '@/lib/utils';
import { useData } from '@/lib/data-context';

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Search;
  group: string;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const { documents } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const navigateTo = useCallback(
    (href: string) => {
      close();
      navigate(href);
    },
    [close, navigate]
  );

  const items: CommandItem[] = useMemo(() => {
    const nav: CommandItem[] = [
      { id: 'nav-dash', label: 'Dashboard', hint: 'Overview & status', icon: LayoutDashboard, group: 'Navigation', action: () => navigateTo('/'), keywords: 'home overview' },
      { id: 'nav-docs', label: 'Documents', hint: 'Upload & ingest', icon: FileStack, group: 'Navigation', action: () => navigateTo('/documents'), keywords: 'files upload' },
      { id: 'nav-chat', label: 'AI Chat', hint: 'Ask & reason', icon: MessagesSquare, group: 'Navigation', action: () => navigateTo('/chat'), keywords: 'ask ai reasoning' },
      { id: 'nav-ent', label: 'Entity Intelligence', hint: 'Knowledge graph', icon: Network, group: 'Navigation', action: () => navigateTo('/entities'), keywords: 'entities equipment' },
      { id: 'nav-know', label: 'Knowledge Dashboard', hint: 'Metrics & coverage', icon: Gauge, group: 'Navigation', action: () => navigateTo('/knowledge'), keywords: 'metrics coverage' },
      { id: 'nav-set', label: 'Settings', hint: 'Configuration', icon: Settings, group: 'Navigation', action: () => navigateTo('/settings'), keywords: 'preferences configuration' },
    ];
    const actions: CommandItem[] = [
      { id: 'act-ask', label: 'Ask IKIP AI', hint: 'Start a reasoning session', icon: Sparkles, group: 'Quick Actions', action: () => navigateTo('/chat'), keywords: 'query question' },
      { id: 'act-upload', label: 'Upload Document', hint: 'Drag & drop PDF/TXT', icon: Upload, group: 'Quick Actions', action: () => navigateTo('/documents'), keywords: 'add file' },
      { id: 'act-search', label: 'Search Documents', hint: 'Find by name, equipment, tag', icon: Search, group: 'Quick Actions', action: () => navigateTo('/documents'), keywords: 'find' },
    ];
    const recent: CommandItem[] = (documents ?? []).slice(0, 5).map((d) => ({
      id: `doc-${d.id}`,
      label: d.filename,
      hint: `${d.status} · ${d.entity_count} entities`,
      icon: iconNameForFilename(d.filename) === 'FileType' ? FileType : FileText,
      group: 'Recent Documents',
      action: () => navigateTo('/documents'),
      keywords: d.filename,
    }));
    return [...nav, ...actions, ...recent];
  }, [navigateTo, documents]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (it) =>
        it.label.toLowerCase().includes(q) ||
        it.hint?.toLowerCase().includes(q) ||
        it.group.toLowerCase().includes(q) ||
        it.keywords?.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        close();
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('ikip:open-command', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('ikip:open-command', onOpen);
    };
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        filtered[activeIndex]?.action();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, activeIndex]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((it) => {
      if (!map.has(it.group)) map.set(it.group, []);
      map.get(it.group)!.push(it);
    });
    return Array.from(map.entries());
  }, [filtered]);

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
        >
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl rounded-lg border border-border-strong bg-surface shadow-lg overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search className="h-4 w-4 text-muted" strokeWidth={1.75} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents, actions, pages…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-2 outline-none"
              />
              <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-surface-2 px-1.5 text-[10px] text-muted">ESC</kbd>
            </div>
            <div ref={listRef} className="max-h-[52vh] overflow-y-auto scrollbar-thin p-2">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Search className="h-7 w-7 text-muted-2" strokeWidth={1.5} />
                  <p className="mt-2 text-sm text-muted">No results for &ldquo;{query}&rdquo;</p>
                </div>
              )}
              {grouped.map(([group, list]) => (
                <div key={group} className="mb-2">
                  <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-2">{group}</p>
                  {list.map((it) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const active = idx === activeIndex;
                    const Icon = it.icon;
                    return (
                      <button
                        key={it.id}
                        data-idx={idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={it.action}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors',
                          active ? 'bg-copper/10' : 'hover:bg-surface-2'
                        )}
                      >
                        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md border', active ? 'bg-copper/15 border-copper/30 text-copper' : 'bg-surface-2 border-border text-muted')}>
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-foreground truncate">{it.label}</span>
                          {it.hint && <span className="block text-[11px] text-muted truncate">{it.hint}</span>}
                        </span>
                        {active && <CornerDownLeft className="h-3.5 w-3.5 text-muted" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[10px] text-muted-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-surface-2 px-1">↑</kbd><kbd className="rounded border border-border bg-surface-2 px-1">↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="rounded border border-border bg-surface-2 px-1">↵</kbd> select</span>
              </div>
              <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> IKIP Command</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

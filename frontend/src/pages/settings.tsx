import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Cpu, Palette, Sun, Moon, LogOut } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useData } from '@/lib/data-context';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'engine' | 'appearance';

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'engine', label: 'AI Engine', icon: Cpu },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const { username, logout } = useAuth();
  const { health, isHealthy } = useData();
  const { theme, toggle } = useTheme();

  return (
    <div className="mx-auto max-w-[1000px] px-4 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Settings"
        description="This is a single-account demo build — see below for what's real and what's intentionally out of scope."
        icon={SettingsIcon}
      />

      <div className="flex gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-copper text-copper' : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-copper/15 text-lg font-semibold text-copper border border-copper/20">
              {(username ?? '?').slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">{username}</p>
              <p className="text-xs text-muted">Demo account</p>
            </div>
          </div>
          <div className="rounded-md border border-border bg-surface-2 p-4">
            <p className="text-xs text-muted leading-relaxed">
              This build uses a single shared demo account rather than per-user profiles or multi-tenant
              auth — a deliberate scope decision documented in the project PRD. Profile editing, avatars,
              and multi-user permissions aren't implemented.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </motion.div>
      )}

      {tab === 'engine' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-surface p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', isHealthy ? 'bg-success' : 'bg-danger')} />
            <p className="text-sm font-medium text-foreground">{isHealthy ? 'Backend reachable' : 'Backend unreachable'}</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'Language model', value: health?.llm_model ?? '—' },
              { label: 'Retrieval method', value: 'TF-IDF (cosine similarity)' },
              { label: 'Chunks retrieved per query', value: String(health?.retrieval_top_k ?? '—') },
              { label: 'Chunk size', value: health ? `${health.chunk_size} characters` : '—' },
            ].map((f) => (
              <div key={f.label} className="rounded-md border border-border bg-surface-2 p-3">
                <p className="text-[11px] text-muted">{f.label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5 font-mono">{f.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-2">
            Read-only — this reflects the backend's actual configuration (set via environment variables),
            not editable fields that would silently do nothing.
          </p>
        </motion.div>
      )}

      {tab === 'appearance' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted mt-0.5">Switch between dark and light mode.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={toggle}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

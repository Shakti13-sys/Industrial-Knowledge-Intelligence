import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Bell, Menu, Hexagon, ChevronRight, CircleAlert,
  CheckCircle2, Info, Upload as UploadIcon, MessagesSquare, LogIn, Trash2,
  X, Sun, Moon, LogOut,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { useActivity } from '@/lib/activity-context';
import { useData } from '@/lib/data-context';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/documents': 'Documents',
  '/chat': 'AI Chat',
  '/entities': 'Entity Intelligence',
  '/knowledge': 'Knowledge Overview',
  '/settings': 'Settings',
  '/support': 'Help & About',
};

const iconByType = { login: LogIn, upload: UploadIcon, alert: CircleAlert, query: MessagesSquare, delete: Trash2 } as const;
const colorByType = { login: 'text-info', upload: 'text-copper', alert: 'text-warning', query: 'text-success', delete: 'text-danger' } as const;

export function Header() {
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();
  const { username, logout } = useAuth();
  const { events, unreadCount, markAllRead, dismissEvent } = useActivity();
  const { isHealthy } = useData();
  const [open, setOpen] = useState<'notif' | 'profile' | null>(null);
  const currentLabel = routeLabels[pathname] ?? 'Workspace';
  const initials = (username ?? '?').slice(0, 2).toUpperCase();

  useEffect(() => { setOpen(null); }, [pathname]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6">
      <button className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted">
        <Menu className="h-4 w-4" />
      </button>
      <nav className="hidden sm:flex items-center gap-1.5 text-sm">
        <Link to="/" className="text-muted hover:text-foreground transition-colors">IKIP</Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-2" />
        <span className="font-medium text-foreground">{currentLabel}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => window.dispatchEvent(new Event('ikip:open-command'))}
          className="hidden md:flex items-center h-9 w-64 rounded-md border border-border bg-surface-2 px-3 gap-2 hover:border-copper/40 transition-colors text-left"
        >
          <Search className="h-4 w-4 text-muted" />
          <span className="flex-1 text-sm text-muted-2">Search documents, pages…</span>
          <kbd className="hidden lg:inline-flex h-5 items-center rounded border border-border bg-surface px-1.5 text-[10px] text-muted">⌘K</kbd>
        </button>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="relative">
          <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => setOpen(open === 'notif' ? null : 'notif')}>
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 text-[10px] font-semibold text-copper-foreground">{unreadCount}</span>}
          </Button>
          <AnimatePresence>
            {open === 'notif' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(null)} />
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-lg border border-border-strong bg-surface shadow-lg overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div><p className="text-sm font-semibold text-foreground">This session</p><p className="text-[11px] text-muted">{unreadCount} unread</p></div>
                    <button onClick={markAllRead} className="text-[11px] text-copper hover:text-copper-hover">Mark all read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto scrollbar-thin">
                    {events.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Nothing yet this session.</p>}
                    {events.map((n) => {
                      const Icon = iconByType[n.type];
                      return (
                        <div key={n.id} className={cn('group relative flex gap-3 border-b border-border/60 px-4 py-3 hover:bg-surface-2 transition-colors')}>
                          <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', colorByType[n.type])} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug text-foreground">{n.title}</p>
                            <p className="text-[11px] text-muted leading-snug mt-0.5">{n.description}</p>
                            <p className="text-[10px] text-muted-2 mt-1">{timeAgo(n.timestamp)}</p>
                          </div>
                          <button onClick={() => dismissEvent(n.id)} className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 text-muted hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button onClick={() => setOpen(open === 'profile' ? null : 'profile')} className="flex items-center gap-2 rounded-md border border-border bg-surface-2 pl-1.5 pr-2.5 h-9 hover:border-copper/30 transition-colors">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-copper/15 text-[11px] font-semibold text-copper border border-copper/20">{initials}</span>
            <span className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-xs font-medium text-foreground">{username}</span>
              <span className="text-[10px] text-muted">Demo session</span>
            </span>
          </button>
          <AnimatePresence>
            {open === 'profile' && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(null)} />
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.15, ease: 'easeOut' }} className="absolute right-0 top-12 z-50 w-60 rounded-lg border border-border-strong bg-surface shadow-lg overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-copper/15 text-sm font-semibold text-copper border border-copper/20">{initials}</span>
                    <div><p className="text-sm font-semibold text-foreground">{username}</p><p className="text-[11px] text-muted">Demo account</p></div>
                  </div>
                  <div className="p-1.5">
                    <Link to="/settings" className="block w-full text-left rounded-md px-3 py-2 text-sm text-foreground-2 hover:bg-surface-2 hover:text-foreground transition-colors">Settings</Link>
                    <div className="my-1 h-px bg-border" />
                    <button onClick={logout} className="w-full flex items-center gap-2 text-left rounded-md px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className={cn('hidden xl:flex items-center gap-2 rounded-md border px-2.5 h-9', isHealthy ? 'border-success/30 bg-success/10' : 'border-danger/30 bg-danger/10')}>
          <Hexagon className={cn('h-3.5 w-3.5', isHealthy ? 'text-success' : 'text-danger')} strokeWidth={2} />
          <span className={cn('text-[11px] font-medium', isHealthy ? 'text-success' : 'text-danger')}>{isHealthy ? 'API Online' : 'API Unreachable'}</span>
        </div>
      </div>
    </header>
  );
}

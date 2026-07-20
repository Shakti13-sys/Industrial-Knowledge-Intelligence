import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileStack, MessagesSquare, Network, Gauge,
  Settings, LifeBuoy, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useData } from '@/lib/data-context';

// Icon with Only Outer Rounded Border (Transparent Background)
function BrandMark() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 transition-transform duration-200 hover:scale-105">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rotate-180"
      >
        {/* Isometric Cube Outer Hexagon Frame */}
        <path
          d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"
          stroke="#B87333"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Inner Connecting Y-Node Backbone Lines */}
        <path
          d="M12 3V12M12 12L20 16.5M12 12L4 16.5"
          stroke="#B87333"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Node Vertex Dots */}
        <circle cx="12" cy="12" r="1.5" fill="#E09F67" />
        <circle cx="12" cy="3" r="1" fill="#E09F67" />
        <circle cx="20" cy="16.5" r="1" fill="#E09F67" />
        <circle cx="4" cy="16.5" r="1" fill="#E09F67" />
      </svg>
    </div>
  );
}

const nav = [
  {
    section: 'Workspace',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & status' },
      { href: '/documents', label: 'Documents', icon: FileStack, desc: 'Upload & ingest' },
      { href: '/chat', label: 'AI Chat', icon: MessagesSquare, desc: 'Ask & reason' },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { href: '/entities', label: 'Entity Intelligence', icon: Network, desc: 'Knowledge graph' },
      { href: '/knowledge', label: 'Knowledge Dashboard', icon: Gauge, desc: 'Metrics & coverage' },
    ],
  },
];

const footerNav = [
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/support', label: 'Support', icon: LifeBuoy },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { isHealthy, health } = useData();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex shrink-0 flex-col border-r border-border bg-background-2 overflow-hidden"
    >
      {/* BRAND HEADER */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-border">
        <BrandMark />
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col leading-none min-w-0"
            >
              <span className="text-sm font-bold tracking-wider text-foreground">
                IKIP <span className="text-copper">AI</span>
              </span>
              <span className="text-[9px] font-medium leading-tight text-muted tracking-tight mt-0.5 truncate">
                Industrial Knowledge Intelligence
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:text-foreground hover:bg-surface transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-5 space-y-7">
        {nav.map((group) => (
          <div key={group.section} className="space-y-1">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-2"
                >
                  {group.section}
                </motion.p>
              )}
            </AnimatePresence>
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group relative flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors',
                    collapsed && 'justify-center px-0',
                    active ? 'bg-copper/10 text-foreground' : 'text-foreground-2 hover:bg-surface hover:text-foreground'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-copper"
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                    />
                  )}
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors', active ? 'bg-copper/15 text-copper' : 'bg-surface-2 text-muted group-hover:text-foreground')}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.2 }} className="flex flex-col min-w-0">
                        <span className="text-sm font-medium leading-tight">{item.label}</span>
                        <span className="text-[11px] text-muted leading-tight mt-0.5">{item.desc}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3 space-y-1">
        {footerNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} to={item.href} title={collapsed ? item.label : undefined} className={cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors', collapsed && 'justify-center px-0', active ? 'bg-copper/10 text-copper' : 'text-muted hover:text-foreground hover:bg-surface')}>
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.2 }}>{item.label}</motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-2 rounded-md border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <span className={cn('h-2 w-2 rounded-full', isHealthy ? 'bg-success' : 'bg-danger')} />
                <span className="text-[11px] font-medium text-foreground-2">{isHealthy ? 'API Online' : 'API Unreachable'}</span>
              </div>
              <p className="mt-1.5 text-[10px] text-muted leading-snug">
                {health ? `${health.llm_model} · TF-IDF retrieval` : 'Waiting for backend…'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusConfig = {
  ingested: { label: 'Ingested', dot: 'bg-success', text: 'text-success', bg: 'bg-success/10' },
  uploaded: { label: 'Uploaded', dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning/10' },
  failed: { label: 'Failed', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger/10' },
} as const;

const riskConfig = {
  low: { label: 'Low', cls: 'text-success bg-success/10 border-success/20' },
  medium: { label: 'Medium', cls: 'text-warning bg-warning/10 border-warning/20' },
  high: { label: 'High', cls: 'text-warning bg-warning/10 border-warning/20' },
  critical: { label: 'Critical', cls: 'text-danger bg-danger/10 border-danger/20' },
} as const;

const severityConfig = {
  low: { label: 'Low', cls: 'text-success bg-success/10 border-success/20' },
  medium: { label: 'Medium', cls: 'text-warning bg-warning/10 border-warning/20' },
  high: { label: 'High', cls: 'text-warning bg-warning/10 border-warning/20' },
  critical: { label: 'Critical', cls: 'text-danger bg-danger/10 border-danger/20' },
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const c = statusConfig[status];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium', c.bg, c.text)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot, status === 'uploaded' && 'animate-pulse')} />
      {c.label}
    </motion.span>
  );
}

export function RiskBadge({ risk }: { risk: keyof typeof riskConfig }) {
  const c = riskConfig[risk];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium', c.cls)}
    >
      {c.label}
    </motion.span>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  const cls = value >= 90 ? 'text-success bg-success/10 border-success/20' : value >= 75 ? 'text-copper bg-copper/10 border-copper/20' : 'text-warning bg-warning/10 border-warning/20';
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium tabular-nums', cls)}
    >
      {value}% conf.
    </motion.span>
  );
}

export function SeverityBadge({ severity }: { severity: keyof typeof severityConfig }) {
  const c = severityConfig[severity];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium', c.cls)}
    >
      {c.label}
    </motion.span>
  );
}

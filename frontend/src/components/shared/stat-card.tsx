import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatedCounter } from '@/components/shared/animated-counter';

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  delta?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  accent?: 'copper' | 'success' | 'warning' | 'danger' | 'info';
  sublabel?: string;
  index?: number;
}

const accentMap = {
  copper: 'text-copper bg-copper/10 border-copper/20',
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  danger: 'text-danger bg-danger/10 border-danger/20',
  info: 'text-info bg-info/10 border-info/20',
};

const trendColor = {
  up: 'text-success bg-success/10',
  down: 'text-danger bg-danger/10',
  neutral: 'text-muted bg-surface-2',
};

export function StatCard({
  label,
  value,
  suffix = '',
  prefix = '',
  delta,
  trend = 'neutral',
  icon: Icon,
  accent = 'copper',
  sublabel,
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      whileTap={{ scale: 0.99 }}
      className="group relative rounded-lg border border-border bg-surface p-6 shadow-sm transition-colors hover:border-copper/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-md border', accentMap[accent])}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        {delta && (
          <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded', trendColor[trend])}>{delta}</span>
        )}
      </div>
      <div className="mt-5">
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {prefix}
          <AnimatedCounter value={value} />
          {suffix}
        </p>
        <p className="mt-1.5 text-sm text-foreground-2">{label}</p>
        {sublabel && <p className="mt-1 text-xs text-muted">{sublabel}</p>}
      </div>
    </motion.div>
  );
}

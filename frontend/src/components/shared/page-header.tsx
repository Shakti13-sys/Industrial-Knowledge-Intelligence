import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
  meta?: { label: string; value: string }[];
}

export function PageHeader({ title, description, icon: Icon, actions, meta }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-copper/20 bg-copper/10 text-copper">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted max-w-2xl leading-relaxed">{description}</p>
          {meta && (
            <div className="mt-3 flex flex-wrap gap-2">
              {meta.map((m) => (
                <span
                  key={m.label}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11px]"
                >
                  <span className="text-muted">{m.label}</span>
                  <span className="font-medium text-foreground">{m.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}

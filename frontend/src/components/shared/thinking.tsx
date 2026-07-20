import { motion } from 'framer-motion';

export function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-copper"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export function ThinkingPanel() {
  const steps = ['Searching ingested documents', 'Ranking relevant passages', 'Reasoning with the language model', 'Preparing a cited answer'];
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 space-y-2.5">
      <div className="flex items-center gap-2 text-xs text-muted">
        <ThinkingDots />
        <span>IKIP AI is reasoning…</span>
      </div>
      <div className="space-y-1.5">
        {steps.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.25 }}
            className="flex items-center gap-2 text-[11px] text-muted"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-copper/60" />
            {s}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

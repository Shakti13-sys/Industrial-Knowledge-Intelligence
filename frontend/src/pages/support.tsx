import { motion } from 'framer-motion';
import { LifeBuoy, Github, BookOpen, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { useData } from '@/lib/data-context';
import { cn } from '@/lib/utils';

// Update this to your actual repository once published.
const REPO_URL = 'https://github.com/your-org/ikip';

const FAQ = [
  {
    q: 'What file types can I upload?',
    a: 'PDF and plain text (.txt) only. Scanned or image-based PDFs are not supported yet — there is no OCR pipeline in this build, only typed/extractable text.',
  },
  {
    q: 'How does retrieval work?',
    a: 'Documents are split into overlapping chunks and ranked against your question using TF-IDF cosine similarity — no vector database or embeddings model. This is a deliberate scope decision for a corpus this size; the retrieval layer is written behind an interface so it can be swapped for a real vector index later without changing the rest of the app.',
  },
  {
    q: 'How is the confidence score calculated?',
    a: 'The language model scores its own answer from 0–100 based on how well the retrieved context supports it, and is asked to explicitly recommend human verification whenever that score is below 70.',
  },
  {
    q: 'What happens when I upload a document that shares an entity with an earlier one?',
    a: 'The backend checks every newly extracted entity (equipment tag, incident ID, regulation reference) against everything already stored. If it finds a match in a different document, it surfaces a Proactive Alert immediately — before you ask a question.',
  },
  {
    q: 'Is my data shared with other users?',
    a: 'No — this build uses a single shared demo account with one in-memory document corpus. There is no multi-tenant isolation because the PRD explicitly scopes that out for this build.',
  },
];

export default function SupportPage() {
  const { isHealthy, health } = useData();

  return (
    <div className="mx-auto max-w-[900px] px-4 lg:px-8 py-8 space-y-8">
      <PageHeader title="Help & About" description="How IKIP actually works, and where to report an issue." icon={LifeBuoy} />

      <div className="rounded-lg border border-border bg-surface p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-md border', isHealthy ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20')}>
            <ShieldCheck className={cn('h-4 w-4', isHealthy ? 'text-success' : 'text-danger')} />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{isHealthy ? 'All systems operational' : 'Backend unreachable'}</p>
            <p className="text-xs text-muted">{health ? `${health.llm_model} · ${health.environment}` : 'Checking status…'}</p>
          </div>
        </div>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground-2 hover:border-copper/40 hover:text-copper transition-colors">
          <Github className="h-3.5 w-3.5" /> Report an issue
        </a>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><BookOpen className="h-4 w-4 text-copper" /> Frequently asked questions</h3>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <motion.div key={item.q} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-medium text-foreground">{item.q}</p>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{item.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border p-5 text-center">
        <p className="text-xs text-muted">
          Full architecture notes, setup instructions, and honest limitations are documented in the repository README.
        </p>
      </div>
    </div>
  );
}

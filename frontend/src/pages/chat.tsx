import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessagesSquare, Send, ChevronRight, FileText, FileType, ShieldAlert, Clock, Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ConfidenceBadge } from '@/components/shared/badges';
import { ThinkingPanel } from '@/components/shared/thinking';
import { StreamingText } from '@/components/shared/streaming-text';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';
import { useActivity } from '@/lib/activity-context';
import { cn, iconNameForFilename } from '@/lib/utils';
import type { QueryResponse, SessionQuery } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  response?: QueryResponse;
  latencyMs?: number;
  streamed?: boolean;
}

const SUGGESTIONS = [
  'What is the recommended bearing inspection interval for PUMP-204?',
  'Was there an incident involving PUMP-204? What was the root cause?',
  'Which regulatory standard applies to PUMP-204?',
  'What safety training is required for Unit 4 operations staff?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionQueries, setSessionQueries] = useState<SessionQuery[]>([]);
  const { logEvent } = useActivity();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function ask(question: string) {
    if (!question.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const startedAt = performance.now();
    try {
      const result = await api.query(question);
      const latencyMs = Math.round(performance.now() - startedAt);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.answer,
          response: result,
          latencyMs,
        },
      ]);
      const q: SessionQuery = {
        id: crypto.randomUUID(),
        question,
        confidence: result.confidence,
        sourceCount: result.sources.length,
        latencyMs,
        timestamp: new Date().toISOString(),
      };
      setSessionQueries((prev) => [q, ...prev].slice(0, 15));
      logEvent({
        type: 'query',
        title: 'Question answered',
        description: `${result.confidence}% confidence · ${result.sources.length} source${result.sources.length === 1 ? '' : 's'}`,
      });
    } catch (err) {
      const detail = err instanceof ApiError ? err.message : 'Something went wrong answering that.';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: detail, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="AI Chat"
        description="Ask cross-document questions. Every answer shows its reasoning trace, cites its sources, and reports an honest confidence score."
        icon={MessagesSquare}
        meta={[{ label: 'This session', value: `${sessionQueries.length} question${sessionQueries.length === 1 ? '' : 's'}` }]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col rounded-lg border border-border bg-surface min-h-[560px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-copper/10 border border-copper/20 text-copper mb-4"><Sparkles className="h-6 w-6" strokeWidth={1.5} /></div>
                <p className="text-sm font-medium text-foreground">Ask IKIP anything about your plant documents</p>
                <p className="mt-1 text-sm text-muted max-w-sm">Every answer shows its reasoning, cites its sources, and tells you honestly when it isn't sure.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs text-foreground-2 transition-colors hover:border-copper/40 hover:text-copper">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => <MessageBubble key={m.id} message={m} isLatest={idx === messages.length - 1} />)
            )}

            {isLoading && (
              <div className="flex justify-start"><div className="max-w-[85%] sm:max-w-[70%]"><ThinkingPanel /></div></div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="flex items-end gap-2 border-t border-border p-4"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="Ask a question about your industrial documents…"
              rows={1}
              className="flex-1 max-h-32"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="gap-2 shrink-0">
              <Send className="h-4 w-4" /> Ask
            </Button>
          </form>
        </div>

        <div className="space-y-4 hidden lg:block">
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-3">Session history</p>
            {sessionQueries.length === 0 ? (
              <p className="text-xs text-muted">Questions you ask will appear here.</p>
            ) : (
              <div className="space-y-3">
                {sessionQueries.map((q) => (
                  <div key={q.id} className="border-b border-border/60 pb-3 last:border-0 last:pb-0">
                    <p className="text-xs text-foreground-2 leading-snug line-clamp-2">{q.question}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
                      <span>{q.confidence}% conf.</span>
                      <span>·</span>
                      <span>{q.sourceCount} source{q.sourceCount === 1 ? '' : 's'}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{(q.latencyMs / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isLatest }: { message: ChatMessage; isLatest: boolean }) {
  const isUser = message.role === 'user';
  const [expanded, setExpanded] = useState(false);
  const [streamDone, setStreamDone] = useState(!isLatest);

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3',
          isUser
            ? 'bg-copper text-copper-foreground rounded-br-sm'
            : message.isError
            ? 'border border-danger/30 bg-danger/10 text-foreground rounded-bl-sm'
            : 'border border-border bg-surface text-foreground rounded-bl-sm'
        )}
      >
        {!isUser && !message.isError && message.response && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ConfidenceBadge value={message.response.confidence} />
            {message.response.needs_verification && (
              <span className="inline-flex items-center gap-1.5 rounded border border-warning/30 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                <ShieldAlert className="h-3 w-3" /> Verify with a human
              </span>
            )}
            {typeof message.latencyMs === 'number' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted"><Clock className="h-2.5 w-2.5" />{(message.latencyMs / 1000).toFixed(1)}s</span>
            )}
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {!isUser && isLatest && !streamDone ? (
            <StreamingText text={message.content} onDone={() => setStreamDone(true)} />
          ) : (
            message.content
          )}
        </div>

        {!isUser && message.response?.confidence_note && (
          <p className="mt-1.5 text-xs italic text-muted">{message.response.confidence_note}</p>
        )}

        {!isUser && message.response && message.response.reasoning_trace.length > 0 && (
          <div className="mt-3">
            <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-muted transition-colors hover:text-copper">
              <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
              How I found this
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.ol initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 space-y-1.5 border-l border-border pl-4 overflow-hidden">
                  {message.response.reasoning_trace.map((step, i) => (
                    <li key={i} className="text-sm leading-relaxed text-foreground-2">
                      <span className="mr-1.5 font-mono text-xs text-muted-2">{String(i + 1).padStart(2, '0')}</span>
                      {step}
                    </li>
                  ))}
                </motion.ol>
              )}
            </AnimatePresence>
          </div>
        )}

        {!isUser && message.response && message.response.sources.length > 0 && (
          <div className="mt-3 space-y-1.5 border-t border-border pt-3">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Sources</p>
            {message.response.sources.map((s, i) => {
              const Icon = iconNameForFilename(s.doc_name) === 'FileType' ? FileType : FileText;
              return (
                <div key={i} className="rounded-lg border border-border bg-surface-2 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate font-mono text-xs text-foreground-2"><Icon className="h-3 w-3 shrink-0" />{s.doc_name}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-2">match {Math.round(s.relevance_score * 100)}%</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">{s.excerpt}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

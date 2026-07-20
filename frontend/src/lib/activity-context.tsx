import { createContext, useCallback, useContext, useState } from 'react';
import type { SessionEvent, SessionQuery } from './types';

interface ActivityContextValue {
  events: SessionEvent[];
  queries: SessionQuery[];
  unreadCount: number;
  logEvent: (event: Omit<SessionEvent, 'id' | 'timestamp'>) => void;
  logQuery: (query: Omit<SessionQuery, 'id' | 'timestamp'>) => void;
  markAllRead: () => void;
  dismissEvent: (id: string) => void;
}

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

/**
 * Replaces the mock `activity` / `notifications` arrays with a genuine,
 * in-session log of things that actually happened this session (logins,
 * uploads, proactive alerts, questions asked). It intentionally does not
 * pretend to be a persistent, multi-day activity history -- that would
 * require a backend event log the PRD explicitly scopes out for this build.
 * Labelled "This session" everywhere it's shown, honestly.
 */
export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const [queries, setQueries] = useState<SessionQuery[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const logEvent = useCallback((event: Omit<SessionEvent, 'id' | 'timestamp'>) => {
    const full: SessionEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setEvents((prev) => [full, ...prev].slice(0, 30));
  }, []);

  const logQuery = useCallback((query: Omit<SessionQuery, 'id' | 'timestamp'>) => {
    const full: SessionQuery = { ...query, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setQueries((prev) => [full, ...prev].slice(0, 20));
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds(new Set(events.map((e) => e.id)));
  }, [events]);

  const dismissEvent = useCallback((id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const unreadCount = events.filter((e) => !readIds.has(e.id)).length;

  return (
    <ActivityContext.Provider
      value={{ events, queries, unreadCount, logEvent, logQuery, markAllRead, dismissEvent }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}

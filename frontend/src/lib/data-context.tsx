import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from './api';
import type { DocumentSummary, EntitySummary, HealthResponse } from './types';
import { useAuth } from './auth-context';

interface DataContextValue {
  documents: DocumentSummary[] | null;
  totalChunks: number;
  entities: EntitySummary[] | null;
  crossReferencedCount: number;
  health: HealthResponse | null;
  isHealthy: boolean;
  refreshDocuments: () => Promise<void>;
  refreshEntities: () => Promise<void>;
  refreshHealth: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { username } = useAuth();
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [totalChunks, setTotalChunks] = useState(0);
  const [entities, setEntities] = useState<EntitySummary[] | null>(null);
  const [crossReferencedCount, setCrossReferencedCount] = useState(0);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isHealthy, setIsHealthy] = useState(false);

  const refreshDocuments = useCallback(async () => {
    try {
      const result = await api.listDocuments();
      setDocuments(result.documents);
      setTotalChunks(result.total_chunks);
    } catch {
      // Keep existing documents on transient error instead of resetting to []
      setDocuments((prev) => (prev === null ? [] : prev));
    }
  }, []);

  const refreshEntities = useCallback(async () => {
    try {
      const result = await api.listEntities();
      setEntities(result.entities);
      setCrossReferencedCount(result.cross_referenced_count);
    } catch {
      setEntities((prev) => (prev === null ? [] : prev));
    }
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const result = await api.health();
      setHealth(result);
      setIsHealthy(true);
    } catch (err) {
      setIsHealthy(false);
      if (!(err instanceof ApiError)) throw err;
    }
  }, []);

  useEffect(() => {
    if (!username) return;
    refreshDocuments();
    refreshEntities();
    refreshHealth();
    
    // Refresh health check periodically without wiping document data
    const interval = setInterval(refreshHealth, 60_000);
    return () => clearInterval(interval);
  }, [username, refreshDocuments, refreshEntities, refreshHealth]);

  return (
    <DataContext.Provider
      value={{
        documents,
        totalChunks,
        entities,
        crossReferencedCount,
        health,
        isHealthy,
        refreshDocuments,
        refreshEntities,
        refreshHealth,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
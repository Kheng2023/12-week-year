import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { initDatabase, exportDbFile, importDbFile } from './database';
import * as queries from './queries';

interface DatabaseContextType {
  ready: boolean;
  error: string | null;
  queries: typeof queries;
  exportDb: () => void;
  importDb: (file: File) => Promise<void>;
  refresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    initDatabase()
      .then(() => setReady(true))
      .catch((err) => setError(String(err)));
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const handleImport = useCallback(async (file: File) => {
    await importDbFile(file);
    refresh();
  }, [refresh]);

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#d32f2f' }}>
        <h2>Database Error</h2>
        <p>{error}</p>
        <p>Try clearing your browser data and reloading.</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p>Loading database...</p>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider
      value={{
        ready,
        error,
        queries,
        exportDb: exportDbFile,
        importDb: handleImport,
        refresh,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}

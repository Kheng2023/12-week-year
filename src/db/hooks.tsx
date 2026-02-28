import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Box, Skeleton, Grid } from '@mui/material';
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
      <Box sx={{ p: { xs: 2, sm: 3 }, ml: { md: '260px' } }}>
        {/* Skeleton title */}
        <Skeleton variant="text" width={220} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={160} height={20} sx={{ mb: 3 }} />
        {/* Skeleton stat cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        {/* Skeleton chart */}
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={2}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Grid size={{ xs: 6, sm: 4, md: 2 }} key={i}>
              <Skeleton variant="rounded" height={60} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
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

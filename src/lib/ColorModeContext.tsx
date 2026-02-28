import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { ThemeProvider, type PaletteMode } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme';

interface ColorModeContextType {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
});

const STORAGE_KEY = '12wy-color-mode';

function getInitialMode(): PaletteMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // localStorage unavailable
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getInitialMode);

  const toggleColorMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* noop */ }
      return next;
    });
  };

  // Sync with system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly chosen
      if (!localStorage.getItem(STORAGE_KEY)) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const ctx = useMemo(() => ({ mode, toggleColorMode }), [mode]);

  return (
    <ColorModeContext.Provider value={ctx}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}

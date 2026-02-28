import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { ColorModeProvider } from './lib/ColorModeContext';
import { DatabaseProvider } from './db/hooks';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <ColorModeProvider>
        <DatabaseProvider>
          <App />
        </DatabaseProvider>
      </ColorModeProvider>
    </HashRouter>
  </StrictMode>,
);

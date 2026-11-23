import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/caveat/600.css';
import '@fontsource/caveat/700.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/themes.css';
import './styles/base.css';
import { SettingsProvider } from './state/settings';
import { ProgressProvider } from './state/progress';
import { App } from './App';
import { registerOffline } from './state/offline';

registerOffline();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <ProgressProvider>
        <App />
      </ProgressProvider>
    </SettingsProvider>
  </StrictMode>,
);

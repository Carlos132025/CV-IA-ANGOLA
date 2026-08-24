import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker, logPWADiagnostics } from './utils/serviceWorker.ts';

// 1. Run and log PWA Diagnostics to console on startup
// Checks: Service Worker status, Standalone mode, and Viewport-fit=cover
logPWADiagnostics();

// 2. Register PWA Service Worker with Stale-While-Revalidate & Network-First caching
registerServiceWorker();

// Gracefully handle benign Vite HMR WebSocket connection notices in sandboxed preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      (event.reason.message?.includes('WebSocket') ||
        event.reason.toString?.().includes('WebSocket') ||
        event.reason.message?.includes('failed to connect to websocket'))
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

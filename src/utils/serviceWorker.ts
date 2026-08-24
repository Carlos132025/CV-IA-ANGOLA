// Service Worker registration and PWA diagnostic logger utility

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(canInstall: boolean) => void>();

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - iOS specific standalone detection
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
}

/**
 * Diagnostic logger that checks and prints:
 * 1. Service Worker registration status
 * 2. Standalone mode (PWA installed status)
 * 3. Viewport meta tag configuration including viewport-fit=cover
 */
export function logPWADiagnostics(): void {
  if (typeof window === 'undefined') return;

  const hasServiceWorker = 'serviceWorker' in navigator;
  const standaloneMode = isStandalone();
  
  // Check viewport meta tag for viewport-fit=cover
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  const viewportContent = viewportMeta?.getAttribute('content') || '';
  const hasViewportFitCover = viewportContent.includes('viewport-fit=cover');

  console.group('%c🚀 [CV IA Angola] PWA & Environment Diagnostics', 'background: #2563eb; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
  console.log(
    `%c1. Service Worker Suportado:%c ${hasServiceWorker ? '✅ Sim (serviceWorker API disponível)' : '❌ Não suportado'}`,
    'font-weight: bold;',
    hasServiceWorker ? 'color: #16a34a;' : 'color: #dc2626;'
  );
  console.log(
    `%c2. Standalone Mode (PWA Aberta do Ecrã):%c ${standaloneMode ? '✅ Sim (Modo Standalone / Janela Própria)' : 'ℹ️ Browser Tab (Modo Navegador Web)'}`,
    'font-weight: bold;',
    standaloneMode ? 'color: #16a34a;' : 'color: #0284c7;'
  );
  console.log(
    `%c3. Viewport-fit=cover Configurado:%c ${hasViewportFitCover ? '✅ Sim (Ajuste perfeito para ecrãs com notch/safe-areas)' : '⚠️ Não detetado em meta[name="viewport"]'}`,
    'font-weight: bold;',
    hasViewportFitCover ? 'color: #16a34a;' : 'color: #d97706;'
  );
  console.log('%cViewport Content:%c ' + viewportContent, 'font-weight: bold;', 'color: #64748b;');
  console.groupEnd();
}

export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registado com sucesso no âmbito:', reg.scope);

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] Nova versão disponível do CV IA Angola.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Falha ao registar Service Worker:', err);
        });
    });
  }
}

// Global listener for beforeinstallprompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((callback) => callback(true));
    console.log('[PWA] Evento beforeinstallprompt capturado com sucesso.');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((callback) => callback(false));
    console.log('[PWA] Aplicação CV IA Angola instalada com sucesso no ecrã inicial.');
  });
}

export function subscribeInstallPrompt(callback: (canInstall: boolean) => void): () => void {
  listeners.add(callback);
  callback(!!deferredPrompt || (!isStandalone() && isIOS()));
  return () => {
    listeners.delete(callback);
  };
}

export async function promptPWAInstall(): Promise<'accepted' | 'dismissed' | 'manual_guide'> {
  if (deferredPrompt) {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        listeners.forEach((callback) => callback(false));
      }
      return choice.outcome;
    } catch (err) {
      console.warn('[PWA] Erro ao disparar prompt de instalação:', err);
      return 'manual_guide';
    }
  }
  return 'manual_guide';
}

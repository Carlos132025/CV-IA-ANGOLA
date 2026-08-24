// CV IA Angola - Service Worker v1.3.0 (High Performance Mobile)
// Otimizado para redes móveis em Angola (Unitel / Africell / Movicel):
// 1. 'Network-First' com fallback instantâneo de cache para HTML
// 2. 'Stale-While-Revalidate' para CSS/JS/Imagens estáticas com limite de armazenamento
// 3. 'Network-Only' para APIs (/api/*)

const CACHE_VERSION = 'cvia-angola-v1.3.0';
const STATIC_CACHE = `cvia-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `cvia-dynamic-${CACHE_VERSION}`;

// Apenas os recursos essenciais do shell leve inicial
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/logo-full.svg',
  '/favicon-32x32.png',
  '/favicon.ico',
  '/pwa-192x192.png'
];

// Install Event - Pre-cache minimal core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[SW] Non-blocking cache prefill notice:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up older cache namespaces
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] Limpeza de cache antiga:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Network-Only para APIs e mutações de dados
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // 2. Network-First com Cache Fallback para navegação e HTML principal
  // Garante que o utilizador recebe sempre a versão mais recente quando online,
  // mas nunca fica sem app se a rede falhar.
  const isNavigationRequest =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) ||
    url.pathname === '/' ||
    url.pathname === '/index.html';

  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[SW] Rede indisponível. A servir página principal a partir da cache.');
          const cache = await caches.open(STATIC_CACHE);
          const cachedIndex = (await cache.match('/index.html')) || (await cache.match('/'));
          return (
            cachedIndex ||
            new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><title>CV IA Angola - Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:40px;"><h2>Modo Offline</h2><p>Sem conexão de rede no momento. A tentar reconectar...</p></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 }
            )
          );
        })
    );
    return;
  }

  // 3. Stale-While-Revalidate para ficheiros estáticos (CSS, JS, fontes, imagens)
  const isStaticAsset =
    url.origin === location.origin ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2?|ttf|ico)$/i) ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('unsplash.com') ||
    url.hostname.includes('googleusercontent.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone()).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Retorna imediatamente da cache se existir, atualizando em background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Estratégia por defeito: Network com fallback para Cache
  event.respondWith(
    fetch(event.request).catch(async () => {
      return caches.match(event.request);
    })
  );
});

// Listener para atualização imediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

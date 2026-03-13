// StreamVault Service Worker
// Minimal SW to enable PWA install on Samsung TV, Fire Stick, mobile, etc.
// Does NOT cache aggressively — streaming content should always be live.

const CACHE_NAME = 'streamvault-shell-v6';
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache API calls or stream URLs — always network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/stream/')) {
    return;
  }

  // For navigation requests, try network first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // For static assets, try cache first, then network, then offline fallback
  event.respondWith(
    caches.match(request).then((cached) =>
      cached || fetch(request).catch(() => new Response('', { status: 408, statusText: 'Offline' }))
    )
  );
});

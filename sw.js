// ━━━ PHANTOM Service Worker ━━━
// Caches the app shell for offline use.
// API calls (Anthropic) always go to network — never cached.
//
// ⚠️  BUMP CACHE_NAME ON EVERY MEANINGFUL PUSH ⚠️
// The activate handler only cleans caches whose name ≠ CACHE_NAME.
// If you forget to bump, old cache survives + APP_SHELL re-install no-ops,
// AND offline-day-zero users keep getting stale assets. This is the v3
// failure pattern. Don't repeat history. Bump v1.1 → v1.2 → v1.3 every push.

const CACHE_NAME = 'phantom-v1.2';
const APP_SHELL = [
  './',
  './dct-ios.html',
  './manifest.json',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
  './favicon-16.png',
  './favicon-32.png',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@500;700;900&family=JetBrains+Mono:wght@400;500&family=Pathway+Gothic+One&display=swap',
];

// ── INSTALL: Cache app shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(APP_SHELL).catch(err => {
        console.log('SW: Some resources failed to cache (non-critical):', err);
      });
    })
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── ACTIVATE: Clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ── FETCH: Network-first for API, cache-first for app shell ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // NEVER cache API calls — always go to network
  if (url.hostname === 'api.anthropic.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // NEVER cache CDN scripts loaded on demand (html5-qrcode, pdf.js)
  if (url.hostname === 'cdnjs.cloudflare.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // For everything else: try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // If we got a good response, cache it for next time
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // If it's a navigation request and nothing in cache, return the main page
          if (event.request.mode === 'navigate') {
            return caches.match('./dct-ios.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

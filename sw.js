// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHANTOM — Service Worker
// v1.5.0 (Reference dashboard — globe, ghost wave, glass cards, rack ISO)
//
// CACHE VERSION BUMP RATIONALE:
//   v1.5.0 adds Canvas 2D globe (boot screen), Ghost Echo plasma wave banner,
//   glass card CSS system, and rack ISO viewer to dct-ios.html. PWA users
//   cached on v1.4.2 must evict and re-fetch to see any of these additions.
//
//   Cross-origin requests (e.g. the Cloudflare Worker proxy to Anthropic
//   API at phantom-api.wfj6t2fk7w.workers.dev) BYPASS the cache entirely.
//   Only same-origin assets are cached.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CACHE_VERSION = 'phantom-v1.5.0';

// Assets to precache on install. Keep this minimal — single-file PWA means
// most of PHANTOM is in dct-ios.html itself.
const PRECACHE_URLS = [
  './',
  'dct-ios.html'
];

// ── INSTALL ───────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())  // activate immediately on next reload
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────
// Evict ALL caches whose name doesn't match the current version. This is
// what forces iOS PWA users off v1.4.1 cached HTML and onto v1.4.2.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────
// Cache-first for same-origin. Cross-origin (e.g. CF Worker proxy) bypasses
// cache entirely so live API calls always hit the network.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cross-origin bypass — Anthropic API proxy, fonts CDN, etc.
  if (url.origin !== self.location.origin) {
    return;  // let the browser handle it normally
  }

  // Same-origin cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache successful GETs of same-origin assets
        if (
          event.request.method === 'GET' &&
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Network failure — return whatever's in cache (may be undefined)
        return caches.match(event.request);
      });
    })
  );
});

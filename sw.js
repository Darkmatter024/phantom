// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHANTOM — Service Worker
// v1.6.28 (Step 1.5 — lz-string persistence for Master parser)
//
// CACHE VERSION BUMP RATIONALE:
//   v1.6.28 vendors lz-string v1.5.0 at vendor/lz-string.min.js and adds
//   PHANTOM_MASTER_STORE persistence on top of v1.6.26's Master parser.
//   The new vendor file must be precached so the warm-store hydration
//   on cold boot works offline. PWA users on prior CACHE_VERSION must
//   evict to pick up the new code and the vendor file.
//
//   v1.6.27 carried over: explicit http(s) scheme guard at the top of
//   the fetch handler; activate-handler cache eviction from v1.5.0.
//
//   Cross-origin requests (e.g. the Cloudflare Worker proxy to Anthropic
//   API at phantom-api.wfj6t2fk7w.workers.dev) BYPASS the cache entirely.
//   Only same-origin assets are cached.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CACHE_VERSION = 'phantom-v1.6.28';

// Assets to precache on install. Keep this minimal — single-file PWA means
// most of PHANTOM is in dct-ios.html itself.
const PRECACHE_URLS = [
  './',
  'dct-ios.html',
  'version.json',
  'vendor/zxing.min.js',
  'vendor/xlsx.full.min.js',
  'vendor/lz-string.min.js'
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

  // v1.6.27: Only handle http(s) requests. Skip chrome-extension://, data:,
  // blob:, file:, and any other scheme the Cache API rejects. Cache.put on
  // these schemes throws TypeError("Request scheme '...' is unsupported"),
  // which floods the console for users with extensions installed.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;  // browser handles non-http(s) natively
  }

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

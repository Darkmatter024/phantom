// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHANTOM — Service Worker
// v1.6.29 (Robustness — resilient precache, scheme guard helper, skipWaiting)
//
// CACHE VERSION BUMP RATIONALE:
//   v1.6.28 deploy testing exposed a chronic chain: one bad entry in
//   PRECACHE_URLS ('./' returned 404 from GitHub Pages with no lowercase
//   index.html in the repo) caused cache.addAll() to reject atomically.
//   Install never completed → activate never fired → old caches stayed
//   on disk → broken SW kept control → LZString and PHANTOM_MASTER_STORE
//   showed up undefined despite valid <script> tags. Field techs were
//   forced to manually unregister SW + nuke caches to recover.
//
//   v1.6.29 makes install resilient: switches to Promise.allSettled per-
//   URL so a single failed precache entry no longer aborts everything.
//   Removes the broken './' entry (Pages serves dct-ios.html directly,
//   not the directory root). Extracts isCacheableScheme(req) as a single
//   source of truth used at both the fetch top-guard and the cache.put
//   call site (defense in depth against chrome-extension:// errors).
//   skipWaiting carries over from v1.6.28 so upgrades activate promptly.
//
//   Activate handler from v1.5.0 (cache eviction + clients.claim) is
//   already correct — left untouched.
//
//   Cross-origin requests (e.g. the Cloudflare Worker proxy to Anthropic
//   API at phantom-api.wfj6t2fk7w.workers.dev) BYPASS the cache entirely.
//   Only same-origin assets are cached.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CACHE_VERSION = 'phantom-v1.6.44';

// Assets to precache on install. Keep this minimal — single-file PWA means
// most of PHANTOM is in dct-ios.html itself.
const PRECACHE_URLS = [
  'dct-ios.html',
  'version.json',
  'vendor/zxing.min.js',
  'vendor/xlsx.full.min.js',
  'vendor/lz-string.min.js'
];

// v1.6.29: One source of truth for "is this Request URL cacheable?".
// Used by both the fetch top-guard and the cache.put call site. The Cache
// API rejects non-http(s) schemes (chrome-extension://, data:, blob:,
// file:) with TypeError("Request scheme '...' is unsupported"), so we
// short-circuit them everywhere they could reach a put.
function isCacheableScheme(req) {
  return req.url.startsWith('http://') || req.url.startsWith('https://');
}

// ── INSTALL ───────────────────────────────────────────────────────────
// v1.6.29: Per-URL adds via Promise.allSettled. One failing URL no longer
// aborts the entire install — failed entries are logged but tolerated.
// skipWaiting() at the end so upgrades activate immediately on next page
// load (no waiting for all tabs to close).
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const results = await Promise.allSettled(
      PRECACHE_URLS.map((url) => cache.add(url))
    );
    const failed = results
      .map((r, i) => r.status === 'rejected' ? { url: PRECACHE_URLS[i], reason: String(r.reason) } : null)
      .filter(Boolean);
    if (failed.length) {
      console.warn('[PHANTOM SW] Precache: ' + failed.length + ' of ' +
                   PRECACHE_URLS.length + ' URLs failed to cache:', failed);
    } else {
      console.log('[PHANTOM SW] Precache: all ' + PRECACHE_URLS.length +
                  ' URLs cached for ' + CACHE_VERSION);
    }
    await self.skipWaiting();
  })());
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
  // v1.6.29: Scheme guard via helper. Skip non-http(s) schemes entirely —
  // chrome-extension://, data:, blob:, file:. The browser handles them
  // natively. Cache.put on these throws TypeError; never let them through.
  if (!isCacheableScheme(event.request)) {
    return;
  }

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
        // Only cache successful GETs of same-origin assets. Scheme check
        // re-verified here as defense-in-depth — paranoid but cheap, and
        // mirrors the v1.6.29 doctrine of one source of truth.
        if (
          event.request.method === 'GET' &&
          response &&
          response.status === 200 &&
          response.type === 'basic' &&
          isCacheableScheme(event.request)
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

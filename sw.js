// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHANTOM SERVICE WORKER
// Offline-first PWA cache for the single-file dct-ios.html
//
// CRITICAL: Bump CACHE_VERSION on every deployment that changes
// onclick-referenced function names or core JS structure. Stale caches
// serving new HTML that references removed functions = silent UI breakage
// (the v3 regression class).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const CACHE_VERSION = 'phantom-v1.4.1';

// Critical assets to precache on install. Relative paths — SW scope is /phantom/.
// Other assets (icons, manifest, etc.) get cached on first network hit via the
// fetch handler below.
const PRECACHE_URLS = [
  './',
  'dct-ios.html'
];

// ── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function(err) {
        console.warn('[PHANTOM SW] Precache partial fail (non-fatal):', err);
      });
    }).then(function() {
      // Take control immediately on first install
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE — clean up stale caches ──────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_VERSION; })
             .map(function(n) {
               console.log('[PHANTOM SW] Purging stale cache:', n);
               return caches.delete(n);
             })
      );
    }).then(function() {
      // Take control of all open clients without requiring full reload
      return self.clients.claim();
    })
  );
});

// ── FETCH — cache-first with network fallback ─────────────────────────────
self.addEventListener('fetch', function(event) {
  // Only handle GET (POSTs and others pass straight to network)
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests — let Anthropic API (via Cloudflare Worker
  // proxy) and any other third-party calls bypass the SW entirely.
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // Cache hit — serve immediately (offline-survivable)
      if (cached) return cached;

      // Cache miss — fetch from network and opportunistically cache for next time
      return fetch(event.request).then(function(response) {
        // Only cache successful same-origin responses
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE_VERSION).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // Network failed AND no cache hit — serve the app shell so the user
        // at least lands on PHANTOM rather than a browser error page.
        return caches.match('dct-ios.html');
      });
    })
  );
});

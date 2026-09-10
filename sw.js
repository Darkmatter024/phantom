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

// v1.6.66: HTML navigations are now network-first (see fetch handler) so the
// live landing always wins online; cache bumped to evict any poisoned root.
// v1.13.3 repo sync (2026-06-13): dct-ios.html was replaced wholesale with the
// external build line (this repo had been at v1.7.6). CACHE_VERSION is lifted to
// a clean v1.13.3 — dropping the prior -N cache-iteration suffix — so this real
// version bump busts every client's cache and the three stamps (app const /
// version.json / this key) line up again. Patch bumps continue from here.
const CACHE_VERSION = 'phantom-v1.14.587';

// Assets to precache on install. Keep this minimal — single-file PWA means
// most of PHANTOM is in dct-ios.html itself.
const PRECACHE_URLS = [
  'dct-ios.html',
  'version.json',
  'vendor/zxing.min.js',
  'vendor/xlsx.full.min.js',
  'vendor/qrcode.min.js',
  'vendor/sha256.min.js',
  'vendor/lz-string.min.js',
  'vendor/three.min.js',
  // v1.14.399 (M1-c / audit 04 ST5): PDF import was the only ONLINE-ONLY vendor path in an
  // offline-first field app. Both files sit in vendor/ and were loaded at runtime via
  // loadScript() but were never precached, so an offline import failed with "Check connection
  // and retry" — honest, and wrong for the product. +1.5 MB on install (pdf.worker is 1.1 MB of
  // it), paid once on a good connection, so a tech in an aisle with no signal can still import.
  'vendor/pdf.min.js',
  'vendor/pdf.worker.min.js',
  'phantom-ghost-v2.webp',
  'phantom-ghost-v3.webp',
  'phantom-lockup.png',
  'cc-ghost.webp',
  'cc-wordmark.png',
  'phantom-prism.png',
  'phantom-shield.png',
  'icons/phantom-shield-256.webp',
  // v1.14.364 CLEANUP (owner-approved): 20 dead entries purged from this list — every one
  // was on disk but referenced by NOTHING in any consumer (dct-ios.html, index.html,
  // forge.html, manifest.json, the docs shell). 228.4 KB that every cold install was
  // fetching and storing for nothing. Superseded families removed here: the .132 nav-96
  // glyphs (replaced by the .323 -v2-256 set below), the mode-256 trio, the status-96 trio,
  // the dom-256 pair, crashcart (RETIRED by owner), assistant-mark + ui-assistant-v2, the
  // blocker/issues-alert actions, and the four tiles the .359 banner rows orphaned.
  // Four of those FILES were deleted in the same commit (the .359 orphans); the rest stay
  // on disk, orphaned-but-retained per repo precedent — only their precache entry went.
  // v1.14.323: glass WebP nav icons (pnav look) — Home/Build/Tools/Exit bottom nav.
  // v1.14.528: the whole -v2 four are GONE from this list. .525 kept them because #cs-side
  // (desktop side nav) was still drawing all four; that surface now draws the same art as the
  // dock, so nothing in any consumer references them. Files stay on disk, orphaned-but-retained
  // per repo precedent — only the precache entry goes, exactly as the .364 cleanup did.
  // v1.14.525 — re-cut nav art (reflections keyed out, brightness matched, transparent).
  // The dock AND the side nav both draw these now. scan/shift -v3 ship on disk for the M4
  // five-pillar nav but stay OUT of this list until a consumer draws them (the .364 cleanup
  // purged 20 entries that were exactly that mistake).
  'icons/phantom-nav-command-v3-256.webp',
  'icons/phantom-nav-build-v3-256.webp',
  'icons/phantom-nav-tools-v4-256.webp',   // v1.14.527: the wrench rotated 40deg. v3 is superseded and referenced by nothing; the rename is mandatory because overwriting a precached asset in place serves the old bytes from cache
  // v1.14.526 — EXIT re-cut into the same set: reflection keyed out of the alpha, brightness
  // pulled to 226 (the set runs 223-234). Longest side is capped at 180/256, NOT the 226/256 its
  // three siblings use: EXIT is the only portrait glyph in the row, so fitting it like the others
  // rendered it half again as tall as BUILD. 180 brings it to 38px against BUILD's 30px at a 54px
  // box. (.526 noted exit-v2 stayed for #cs-side; .528 moved that surface across, so it went.)
  'icons/phantom-nav-exit-v3-256.webp',
  // v1.14.462 — HOME CARD ART (owner directive 2026-08-14). Both feature heroes replaced with the
  // approved photographic direction: a real technician, a real datacenter, rugged field hardware.
  // ⛔ NEITHER CARRIES READABLE TEXT. The handoff art they replace shipped baked SOURCE_SYNC 88% /
  // STEP 4 OF 9 under a 2026-07-21 override; the new directive retires it, so that override is
  // spent. The Site Profile slot previously showed the PLATFORMS art, which described a sub-section
  // of the sheet rather than the sheet.
  // Precached FILES (owner ruled files-not-inline 2026-07-21) so both stay offline-first.
  'icons/phantom-feat-siteprofile-960.webp',
  'icons/phantom-feat-handoff-v3.webp',
  // ⚠ phantom-feat-platforms-720.webp and phantom-feat-handoff-v2.webp are NOT deleted — repo
  // precedent is orphaned-but-retained on disk, only the precache entry goes. That also keeps the
  // ?legacy rip cord byte-compatible if it ever reaches for them.
  'icons/phantom-ref-optics-768.webp',
  'icons/phantom-ref-cli-768.webp',
  'icons/phantom-ref-hwref-768.webp',
  'icons/phantom-ref-know-768.webp',
  'icons/phantom-ref-compass-768.webp',
  'icons/phantom-ref-ghostecho-768.webp',
  'icons/phantom-ref-hardware-768.webp',
  'icons/phantom-optic-om3-256.webp',
  'icons/phantom-optic-om4-256.webp',
  'icons/phantom-optic-om5-256.webp',
  'icons/phantom-optic-os2-256.webp',
  'icons/phantom-optic-lc-256.webp',
  'icons/phantom-optic-iec-256.webp',
  'icons/phantom-tool-manifest-768.webp',
  'icons/phantom-tool-portmap-768.webp',
  'icons/phantom-tool-rackmap-768.webp',
  'icons/phantom-tool-sops-768.webp',
  'icons/phantom-tool-bom-768.webp',
  'icons/phantom-tool-power-768.webp',
  'icons/phantom-tool-burndown-768.webp',
  'icons/phantom-tool-audits-768.webp',
  'icons/phantom-tool-isolate-768.webp',
  'icons/phantom-iso-downlink-768.webp',
  'icons/phantom-iso-noboot-768.webp',
  'icons/phantom-iso-layers-768.webp',
  'icons/phantom-iso-inspect-768.webp',
  'icons/phantom-iso-connect-768.webp',
  'icons/phantom-iso-packet-768.webp',
// v1.14.175: R-3b platform-first icon batch (5 GPU platforms + SHARED)
  'icons/phantom-plat-h100-256.webp',
  'icons/phantom-plat-h200-256.webp',
  'icons/phantom-plat-b200-256.webp',
  'icons/phantom-plat-gb200-256.webp',
  'icons/phantom-plat-gb300-256.webp',
  'icons/phantom-plat-shared-256.webp',
  'icons/SCAN-phone@3x.webp',
  'icons/MASTER-phone@3x.webp',
  'icons/OPS-phone@3x.webp',
  'icons/DEPLOY-phone@3x.webp',
  // v1.14.456: HANDOFF card art replaced. The old raster baked readable status text
  // ("RACK BUILD Complete", "CABLE REPORT Complete", "POWER CHECK Complete",
  // "INTAKE SYNC Complete", "READY FOR HANDOFF") into the image - fabricated status
  // presented as real, which is a Contract 10 violation that had been living behind an
  // owner override. The replacement carries no readable text and no logo, so the
  // override is retired rather than renewed. New -v2 filename because overwriting a
  // precached asset in place serves the old bytes from cache; the previous file stays
  // on disk, orphaned-but-retained per repo precedent.
  'icons/HANDOFF-phone@3x-v2.webp'
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
self.addEventListener('install', (event) => {
  // ⛔ v1.14.513 — skipWaiting() IS CALLED HERE ON PURPOSE, AND IT OVERTURNS v1.14.458.
  // .458 removed this call as its P0 fix: activating immediately meant no worker ever reached
  // `waiting`, so the SW UPDATE badge had nothing to promote. .513 then found the OPPOSITE
  // failure on the device — iOS Safari does not reliably process message-based skipWaiting(),
  // so a worker that waits for a badge tap can wait forever. Calling it directly here is what
  // makes an upgrade actually land on the phone.
  //
  // ⚠ THE TRADE, STATED PLAINLY: the phone AUTO-UPDATES on install. The badge no longer owns
  // promotion. That is a behaviour decision, not a regression.
  //
  // ⭐ OWNER RULING 2026-09-05 — .513 STANDS. test/e2e/39-sw-update-path.spec.js pins the .458
  // assertion with this reason. If that test ever reports "expected to fail but passed", this
  // call has gone and the ruling needs revisiting.
  //
  // The message handler below still exists and still promotes on SKIP_WAITING: .513 changed WHO
  // triggers activation, not whether the message door works.
  self.skipWaiting();
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
  })());
});

// ── MESSAGE ───────────────────────────────────────────────────────────
// v1.14.458 — the receiving half of the activation contract. It did not exist: the app had been
// posting SKIP_WAITING into a worker with no message listener since the feature shipped, which is
// why the tap could never promote anything. ONE message type, no parallel handler.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  // ── NAVIGATIONS (HTML documents): NETWORK-FIRST ──────────────────────
  // v1.6.66: HTML page-loads (the bare /phantom/ root, index.html, and
  // dct-ios.html) go network-first so a fresh deploy ALWAYS wins while
  // online — no stale cached shell can sit in front of the live landing.
  // This is what makes the bare /phantom/ root render index.html (the
  // landing) instead of the app's built-in boot screen. Offline, fall back
  // to the precached shell: the directory root maps to the landing
  // (index.html); any other document maps to the app (dct-ios.html).
  if (event.request.mode === 'navigate') {
    // ⛔ v1.14.458 — `cache: 'reload'` ADDED, and its absence was half the P0. A plain
    // fetch(event.request) uses the DEFAULT http cache mode, so the browser's own HTTP cache can
    // satisfy it — GitHub Pages serves these with a max-age — and the "network-first" navigation
    // then returns the OLD shell while reporting success. The reload appeared to work and the
    // version never moved. 'reload' forces the request past the HTTP cache to the origin; the
    // offline fallback below is untouched, so a genuinely offline device still gets its shell.
    event.respondWith(
      fetch(event.request, { cache: 'reload' })
        .catch(function () { return fetch(event.request); })
        .catch(function () { return caches.match('dct-ios.html'); })
    );
    return;
  }

  // ── version.json: NETWORK-FIRST ──────────────────────────────────────
  // ⛔ v1.14.458 — version.json was served CACHE-FIRST from PRECACHE_URLS, which broke the very
  // backstop that exists to catch stalled SW detection. phantom_versionFileBackstop() fetches it
  // with `cache: 'no-store'`, but that is an HTTP-cache directive and does NOT bypass a service
  // worker — so the check that asks "is there a newer build?" was answered out of the old build's
  // own cache. It must come from the network when the network is there.
  if (url.pathname.endsWith('/version.json') || url.pathname === '/version.json') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_VERSION).then(function (c) { c.put(event.request, copy); }).catch(function () {});
          }
          return res;
        })
        .catch(function () { return caches.match(event.request); })
    );
    return;
  }

  // Same-origin cache-first (static assets: JS, fonts, vendors, version.json)
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

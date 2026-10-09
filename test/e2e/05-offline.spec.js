// ─────────────────────────────────────────────────────────────────────────────
// OFFLINE CONTRACT
//
// PHANTOM's whole premise is a gloved tech in a cold aisle with no signal. This
// spec asserts the parts of that promise a headless browser can actually see:
//   · sw.js precaches everything it claims to, and every entry really serves
//   · every script the app pulls at RUNTIME is in that precache (the pdf.min.js
//     class of bug — a loadScript target that only exists on the network)
//   · one online load, then offline, and the shell is still reachable + bootable
//   · offline is REPORTED, not silently degraded
//   · work written offline survives an offline reload AND the return to network
//
// ⚠ THREE HARNESS TRUTHS — READ BEFORE TRUSTING A GREEN RUN
//
// 1. THE APP NEVER REGISTERS A SERVICE WORKER HERE. dct-ios.html :12517 gates
//    registration on `location.protocol === 'https:'`. The harness serves
//    http://127.0.0.1, so that call site is unreachable locally. Every offline
//    test below registers ./sw.js by hand (installSW) — which exercises sw.js's
//    real contract, but proves nothing about the app's own register() call. The
//    one test that asserts self-registration self-skips with that reason printed.
//
// 2. WEBKIT CANNOT SERVE A NAVIGATION FROM A SERVICE WORKER WHILE
//    context.setOffline(true) IS SET. page.goto dies with "WebKit encountered an
//    internal error" even though the SW is installed, controlling, and holding
//    the document in cache. Chromium does it correctly. So the offline-navigation
//    assertions are capability-gated: every browser proves the shell bytes are
//    cache-reachable (offlineShellReachable), and only browsers that can actually
//    navigate offline go on to assert the boot. phone-webkit therefore SKIPS the
//    strongest tests in this file. iOS Safari is not affected — this is a
//    Playwright WebKit build limitation, not app behaviour — but that means the
//    offline boot on the field device is verified by NOTHING here.
//
// 3. navigator.onLine DOES NOT SURVIVE AN EMULATED-OFFLINE NAVIGATION in
//    Chromium: the network stays cut (proven per-test) but the freshly navigated
//    document reads navigator.onLine === true. The app reads exactly that value
//    at launch() :18412, so "cold offline boot badges itself" cannot be judged
//    here and self-skips rather than fake a verdict.
//
// LOCAL HELPERS (defined in this file, NOT in the shared fixture, per the brief):
//   readServed · parsePrecache · parseRuntimeScripts · installSW · offlineState ·
//   assertNetworkIsCut · offlineShellReachable · swServesOfflineOrSkip ·
//   bootOfflineOrSkip
//
// COVERAGE BY TIER (measured, not assumed):
//   phone-webkit      7 pass / 7 skip — everything that does not need the SW to
//                     answer a request while offline (truth 2)
//   desktop-chromium 11 pass / 1 expected-fail / 2 skip — the full offline path
// ─────────────────────────────────────────────────────────────────────────────

const { test, expect, gotoMode } = require('./fixtures');

// Chromium-only BROWSER POLICY message, emitted at console.error level by the
// browser itself, not by app code. Chromium refuses navigator.vibrate on a frame
// with no user activation. launch() (:18383) calls haptic(15) at :18390, and
// launch also runs on the phantom_seen_boot fast path where no tap has happened,
// so it appears once per boot. iOS Safari has no navigator.vibrate at all, so the
// guard at :16398 short-circuits and there is nothing to see on the field device.
// Deliberately NOT added to the shared BENIGN_CONSOLE allowlist (forbidden, and
// it would also hide it from 00-boot.spec, which already fails on it under
// desktop-chromium). Filtered locally, counted, printed, and reported instead.
const CHROMIUM_VIBRATE_POLICY = /Blocked call to navigator\.vibrate/i;

// ── local helpers ────────────────────────────────────────────────────────────

/** Fetch a repo file through the harness static server (what the SW would cache). */
async function readServed(page, path) {
  const res = await page.request.get(path);
  expect(res.status(), `${path} did not serve 200`).toBe(200);
  return res.text();
}

/**
 * Pull PRECACHE_URLS + CACHE_VERSION out of sw.js source.
 * Line comments are stripped FIRST — the array block carries prose containing
 * quoted strings (the v1.14.326 owner-override note quotes 'no use it'), and a
 * naive string scrape turns that comment into a phantom precache entry.
 */
function parsePrecache(swSource) {
  const block = swSource.match(/const PRECACHE_URLS\s*=\s*\[([\s\S]*?)\n\];/);
  if (!block) throw new Error('sw.js: PRECACHE_URLS array not found — this parser is stale');
  const code = block[1]
    .split(/\r?\n/)
    .map((l) => l.replace(/\/\/.*$/, ''))
    .join('\n');
  const urls = [...code.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  const ver = swSource.match(/const CACHE_VERSION\s*=\s*'([^']+)'/);
  if (!ver) throw new Error('sw.js: CACHE_VERSION not found — this parser is stale');

  return { urls, cacheVersion: ver[1] };
}

/**
 * Every same-origin script dct-ios.html pulls in at RUNTIME, with its call class.
 * Four mechanisms exist in the file and all four must be precached to work offline:
 *   loadScript('./vendor/x.js')    loader at :48294; call sites :20966 :22112 :31609 :42181 :48231
 *   <script src="./vendor/x.js">   static tags :16387 :16389 :16391 :16393
 *   GlobalWorkerOptions.workerSrc  :48232 — pdf.js spawns this as a Worker
 *   document.write('<script src=…')  :25634 — QR popup, url assembled at :25626
 *
 * Two traps this parser has to survive, both real in this file:
 *  · HTML comments carry dead markup (the ART-376 <img> fallback rows). Stripped.
 *  · The QR popup's tag is BUILT from a concatenation, so a loose src="([^"]+)"
 *    scrape yields the literal string `' + _qrLibUrl + '`. The src pattern is
 *    therefore restricted to path characters, and the QR case is matched on its
 *    own literal fragment instead.
 */
function parseRuntimeScripts(html) {
  const live = html.replace(/<!--[\s\S]*?-->/g, '');
  const norm = (s) => s.replace(/^\.\//, '');
  const out = [];
  const push = (kind, raw) => out.push({ kind, url: norm(raw) });

  for (const m of live.matchAll(/loadScript\(\s*'([^']+)'/g)) push('loadScript', m[1]);
  for (const m of live.matchAll(/<script src="((?:\.\/)?[A-Za-z0-9._@\-/]+\.js)"/g)) push('script-tag', m[1]);
  for (const m of live.matchAll(/workerSrc\s*=\s*'([^']+)'/g)) push('worker', m[1]);
  for (const m of live.matchAll(/_qrLibUrl\s*=[^;]*?\+\s*'([^']+\.js)'/g)) push('document.write', m[1]);

  const seen = new Set();
  return out.filter((e) => {
    const k = e.kind + '|' + e.url;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Register ./sw.js by hand and wait until it CONTROLS this page.
 * navigator.serviceWorker.ready resolving means install()'s waitUntil settled —
 * i.e. the precache pass finished (allSettled, so it settles even on failures).
 * sw.js calls skipWaiting() + clients.claim(), so controllerchange is the honest
 * "this SW owns the next navigation" signal.
 */
async function installSW(page) {
  return page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return { ok: false, reason: 'navigator.serviceWorker absent' };
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true });
          setTimeout(resolve, 10000);
        });
      }
      return { ok: !!navigator.serviceWorker.controller, scope: reg.scope };
    } catch (e) {
      return { ok: false, reason: String((e && e.message) || e) };
    }
  });
}

/** The app's own offline surface, read as data. Every binding is set in one
 *  place: phantomUpdateNetPill() :50954. */
async function offlineState(page) {
  return page.evaluate(() => {
    const banner = document.getElementById('offline-banner');
    const lbl = document.getElementById('net-label');
    return {
      onLine: navigator.onLine,
      bodyNet: document.body.dataset.net || null,
      bannerDisplay: banner ? banner.style.display : null,
      bannerText: banner ? (banner.textContent || '').trim() : null,
      netLabel: lbl ? (lbl.textContent || '').trim() : null,
    };
  });
}

/** Prove the network really is gone before crediting the SW for anything.
 *  A never-cached, never-existing URL: cache miss -> fetch -> reject -> the SW's
 *  own catch re-matches the cache -> undefined -> the request errors out. */
async function assertNetworkIsCut(page) {
  const alive = await page.evaluate(() =>
    fetch('/__phantom_e2e_uncached__' + Date.now())
      .then((r) => r.ok)
      .catch(() => false),
  );
  expect(alive, 'context.setOffline(true) did not actually cut the network').toBe(false);
}

/** Can the app shell be read back through the SW's fetch handler with no network? */
async function offlineShellReachable(page) {
  return page.evaluate(async () => {
    try {
      const res = await fetch('dct-ios.html');
      if (!res || !res.ok) return { ok: false, status: res ? res.status : 0 };
      const body = await res.text();
      return { ok: true, bytes: body.length, isApp: body.includes('PHANTOM_APP_VERSION') };
    } catch (e) {
      return { ok: false, reason: String((e && e.message) || e) };
    }
  });
}

/**
 * Gate every "with the network cut" assertion on the browser actually consulting
 * the service worker for page requests.
 *
 * The discriminator that keeps this honest: Cache Storage is checked FIRST and
 * asserted hard. If dct-ios.html is not in the cache, the offline shell does not
 * exist and that is an APP failure — loud, no skip. Only when the bytes are
 * provably cached AND a plain same-origin fetch still dies does this skip, because
 * that combination can only mean the browser bypassed the SW.
 *
 * Playwright's WebKit build does exactly that: context.setOffline(true) cuts the
 * network underneath the service worker, so a registered, controlling SW holding
 * the document in cache never sees the request ("Load failed"). Chromium routes it
 * correctly. iOS Safari is not implicated either way — nothing here says anything
 * about the device.
 */
async function swServesOfflineOrSkip(page) {
  const held = await page.evaluate(() => caches.match('dct-ios.html').then((r) => !!r));
  expect(held, 'dct-ios.html is NOT in the service-worker cache — there is no offline shell at all').toBe(true);

  const shell = await offlineShellReachable(page);
  test.skip(
    !shell.ok,
    'this browser build does not route page requests through a registered service worker while ' +
      'context.setOffline(true) is active — dct-ios.html IS in Cache Storage (asserted one line ' +
      'above) yet a same-origin fetch still fails, so the SW was bypassed, not broken. ' +
      `Underlying error: ${shell.reason || shell.status}. Verify the offline path on the device.`,
  );

  expect(shell.isApp, 'the bytes served with no network are not the app').toBe(true);
  expect(shell.bytes, 'the offline shell is truncated').toBeGreaterThan(1_000_000);
  return shell;
}

/**
 * Attempt a real cold boot with the network cut.
 * Precondition already asserted by the caller: the SW holds dct-ios.html in cache
 * and hands it over on a plain fetch. So if the NAVIGATION still dies at the
 * browser layer, that is the browser's offline emulation refusing to consult the
 * service worker — not the app failing — and the test skips loudly rather than
 * scoring a browser limitation as an app defect. Anything else rethrows.
 */
async function bootOfflineOrSkip(phantom, page) {
  try {
    await phantom.boot();
  } catch (e) {
    const m = String((e && e.message) || e);
    const browserLevel = /internal error|ERR_INTERNET_DISCONNECTED|ERR_FAILED|ERR_NAME_NOT_RESOLVED|NS_ERROR_|Could not connect/i.test(m);
    test.skip(
      browserLevel,
      'this browser build will not let a service worker answer a NAVIGATION while ' +
        'context.setOffline(true) is set — the shell is proven cache-reachable one line above, ' +
        'so the failure is the offline emulation, not the app. Verify the offline boot on the ' +
        `device. Underlying error: ${m}`,
    );
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('offline contract', () => {
  // ── 1. THE P0 HUNT: runtime scripts vs the precache list ───────────────────
  test('every script the app loads at runtime is in the SW precache list', async ({ page }) => {
    const [swSrc, appSrc] = await Promise.all([readServed(page, '/sw.js'), readServed(page, '/dct-ios.html')]);
    const { urls } = parsePrecache(swSrc);
    const runtime = parseRuntimeScripts(appSrc);

    // Guard the parser itself: if it stops finding call sites it is lying, not passing.
    const byKind = (k) => runtime.filter((r) => r.kind === k);
    expect(byKind('loadScript').length, 'parser found no loadScript() targets — parser is stale').toBeGreaterThan(0);
    expect(byKind('script-tag').length, 'parser found no <script src> tags — parser is stale').toBeGreaterThan(0);
    expect(byKind('worker').length, 'parser found no workerSrc — parser is stale').toBeGreaterThan(0);
    expect(byKind('document.write').length, 'parser found no QR popup script — parser is stale').toBeGreaterThan(0);

    const missing = runtime.filter((r) => !urls.includes(r.url));
    expect(
      missing,
      'runtime scripts absent from sw.js PRECACHE_URLS (P0 — unreachable offline):\n' +
        missing.map((m) => `  [${m.kind}] ${m.url}`).join('\n'),
    ).toEqual([]);
  });

  test('no runtime script is loaded from a third-party origin', async ({ page }) => {
    // Offline-first has a hard prerequisite: nothing the app needs may live on a
    // CDN, because a service worker will not cache an opaque cross-origin script
    // and sw.js explicitly bypasses cross-origin entirely (:183). CDN_SRI (:48292)
    // is an empty scaffold kept for a future CDN load — this test is what keeps it
    // empty in practice.
    const appSrc = await readServed(page, '/dct-ios.html');
    const offsite = parseRuntimeScripts(appSrc).filter((r) => /^https?:\/\/|^\/\//i.test(r.url));
    expect(offsite, `third-party script sources found: ${offsite.map((o) => o.url).join(', ')}`).toEqual([]);
  });

  test('every PRECACHE_URL actually serves — a 404 entry installs silently broken', async ({ page }) => {
    // install() uses Promise.allSettled (sw.js :137) precisely so one bad entry
    // cannot abort the whole install. The price of that resilience is that a dead
    // entry is INVISIBLE at runtime — it warns to the SW console and the asset is
    // simply absent offline. This test is the only place that failure is loud.
    // Exactly the shape of the v1.6.28 outage recorded in sw.js's own header.
    const { urls } = parsePrecache(await readServed(page, '/sw.js'));
    expect(urls.length, 'PRECACHE_URLS is suspiciously short — parser may be stale').toBeGreaterThan(20);

    const dead = [];
    for (const u of urls) {
      const res = await page.request.get('/' + u);
      if (res.status() !== 200) dead.push(`${u} -> ${res.status()}`);
    }
    expect(dead, `PRECACHE_URLS entries that do not serve:\n  ${dead.join('\n  ')}`).toEqual([]);
  });

  test('the three cache stamps agree — a drifted CACHE_VERSION never evicts', async ({ page }) => {
    // Offline correctness depends on this. activate() (sw.js :157) deletes every
    // cache whose name !== CACHE_VERSION, and phantom_versionFileBackstop()
    // (:12564) compares version.json against PHANTOM_APP_VERSION. Drift means
    // either a stale shell survives eviction or the update banner nags forever.
    const swSrc = await readServed(page, '/sw.js');
    const appSrc = await readServed(page, '/dct-ios.html');
    const verJson = JSON.parse(await readServed(page, '/version.json'));
    const { cacheVersion } = parsePrecache(swSrc);
    const appVer = appSrc.match(/const PHANTOM_APP_VERSION\s*=\s*'([^']+)'/);
    expect(appVer, 'PHANTOM_APP_VERSION not found in dct-ios.html').not.toBeNull();

    expect(cacheVersion, 'sw.js CACHE_VERSION != app PHANTOM_APP_VERSION').toBe(appVer[1]);
    expect(verJson.version, 'version.json != app PHANTOM_APP_VERSION').toBe(appVer[1]);
  });

  // ── 2. REGISTRATION ────────────────────────────────────────────────────────
  test('the app registers a service worker on first load', async ({ phantom, page }) => {
    await phantom.boot();
    const proto = await page.evaluate(() => location.protocol);

    // dct-ios.html :12517 — `if ('serviceWorker' in navigator && location.protocol === 'https:')`.
    // That is narrower than the platform rule: 127.0.0.1 IS a secure context and
    // WILL accept a registration (installSW proves it in the tests below). On
    // GitHub Pages the app is always https so there is no field impact, but it
    // means the app's own registration call site is unreachable from any local or
    // LAN harness. Reported as a P2 finding.
    test.skip(
      proto !== 'https:',
      'app gates SW registration on location.protocol === "https:" (dct-ios.html :12517); ' +
        `harness serves ${proto}//127.0.0.1 so the app never calls register(). ` +
        'Only an https origin — i.e. the device — can verify this call site.',
    );

    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r)), {
        message: 'app did not register ./sw.js on load',
      })
      .toBe(true);
  });

  test('sw.js precaches its whole manifest once registered', async ({ phantom, page }) => {
    test.setTimeout(90_000); // 56 entries, ~5MB including pdf.worker (1.1MB) and three.js.
    await phantom.boot();

    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    const { urls, cacheVersion } = parsePrecache(await readServed(page, '/sw.js'));

    const names = await page.evaluate(() => caches.keys());
    expect(names, `cache "${cacheVersion}" was never opened; caches present: ${names.join(', ')}`).toContain(cacheVersion);

    const missing = await page.evaluate(async (list) => {
      const out = [];
      for (const u of list) {
        if (!(await caches.match(u))) out.push(u);
      }
      return out;
    }, urls);

    expect(
      missing,
      `precache entries that never landed in the cache (install tolerates this silently, sw.js :137):\n  ${missing.join('\n  ')}`,
    ).toEqual([]);
  });

  // ── 3. THE PROMISE: no network, still usable ───────────────────────────────
  //
  // Split deliberately in two. The FIRST test asserts what every browser build can
  // see — the offline shell and all eight vendor bundles are physically in Cache
  // Storage. The SECOND asserts that the SW actually hands them over with the
  // network cut, which Playwright's WebKit cannot exercise (see swServesOfflineOrSkip).
  // Keeping them apart means phone-webkit still gets a real, hard assertion instead
  // of a blanket skip.
  test('the offline shell and every vendor bundle are physically in the SW cache', async ({ phantom, page }) => {
    test.setTimeout(90_000);
    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    await page.context().setOffline(true);
    await assertNetworkIsCut(page);

    const need = [
      'dct-ios.html',
      'version.json',
      'vendor/three.min.js',
      'vendor/xlsx.full.min.js',
      'vendor/zxing.min.js',
      'vendor/lz-string.min.js',
      'vendor/sha256.min.js',
      'vendor/qrcode.min.js',
      'vendor/pdf.min.js',
      'vendor/pdf.worker.min.js',
    ];
    const absent = await page.evaluate(async (list) => {
      const out = [];
      for (const u of list) {
        if (!(await caches.match(u))) out.push(u);
      }
      return out;
    }, need);
    expect(absent, `not in Cache Storage after install — unreachable in the aisle:\n  ${absent.join('\n  ')}`).toEqual([]);

    // The cached shell is the whole app, not a stub or a truncated write.
    const cachedShell = await page.evaluate(async () => {
      const r = await caches.match('dct-ios.html');
      const t = await r.text();
      return { bytes: t.length, isApp: t.includes('PHANTOM_APP_VERSION') };
    });
    expect(cachedShell.isApp, 'the cached dct-ios.html is not the app').toBe(true);
    expect(cachedShell.bytes, 'the cached shell is truncated').toBeGreaterThan(1_000_000);

    await page.context().setOffline(false);
  });

  test('with the network cut, the service worker actually serves the shell and vendors', async ({ phantom, page }) => {
    test.setTimeout(90_000);
    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    await page.context().setOffline(true);
    await assertNetworkIsCut(page);
    await swServesOfflineOrSkip(page);

    const vendors = ['vendor/three.min.js', 'vendor/xlsx.full.min.js', 'vendor/zxing.min.js', 'vendor/lz-string.min.js', 'vendor/sha256.min.js', 'vendor/qrcode.min.js', 'vendor/pdf.min.js', 'vendor/pdf.worker.min.js'];
    const unreachable = await page.evaluate(async (list) => {
      const out = [];
      for (const u of list) {
        try {
          const r = await fetch(u);
          if (!r || !r.ok) out.push(u + ' -> ' + (r ? r.status : 'no response'));
        } catch (e) {
          out.push(u + ' -> ' + String((e && e.message) || e));
        }
      }
      return out;
    }, vendors);
    expect(unreachable, `vendor bundles not fetchable with the network cut:\n  ${unreachable.join('\n  ')}`).toEqual([]);

    await page.context().setOffline(false);
  });

  test('after one online load, an offline reload still boots to a usable shell', async ({ phantom, page }) => {
    test.setTimeout(90_000);
    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    await page.context().setOffline(true);
    await assertNetworkIsCut(page);
    await swServesOfflineOrSkip(page);

    await bootOfflineOrSkip(phantom, page);

    await expect(page.locator('#app')).toHaveClass(/visible/);
    await expect(page.locator('#boot')).toBeHidden();
    await expect.poll(() => phantom.isRedesign(), { message: 'offline boot did not reach body.rd' }).toBe(true);

    // "Usable shell" means the doors are there, not merely that pixels painted.
    for (const id of ['#rd-botnav', '#bn-command', '#bn-work', '#bn-ref', '#rd-exit', '#pg-cmd']) {
      await expect(page.locator(id), `${id} missing after an offline boot`).toBeAttached();
    }
    await phantom.assertNoHorizontalOverflow();

    await page.context().setOffline(false);
  });

  test('an offline boot raises no uncaught exception and no same-origin request failure', async ({ phantom, page }) => {
    test.setTimeout(90_000);

    // Attach before any navigation: with the network cut, NOTHING same-origin may
    // fail. Everything the app needs is precached, so a same-origin requestfailed
    // is the sharpest possible offline defect signal — sharper than console text,
    // because it names the exact asset the SW did not cover.
    const failedRequests = [];
    page.on('requestfailed', (r) => failedRequests.push(r.url()));

    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    await page.context().setOffline(true);
    await assertNetworkIsCut(page);
    await swServesOfflineOrSkip(page);

    failedRequests.length = 0; // only judge the offline boot itself
    await bootOfflineOrSkip(phantom, page);

    // Wait on an observable end state, not a sleep: phantomDeferredInit fires 500ms
    // after launch (:18245) and its last act is phantomCheckApi(), which drives
    // #hs-api-val from '' -> 'CHECKING' -> a settled verdict. Polling that makes the
    // error window identical on every run — otherwise this test silently samples a
    // different slice of boot each time and goes flaky.
    await expect
      .poll(
        () => page.evaluate(() => {
          const el = document.getElementById('hs-api-val');
          return el ? (el.textContent || '').trim() : '';
        }),
        { message: 'deferred init never settled — the error window is not comparable', timeout: 25_000 },
      )
      .not.toMatch(/^(|CHECKING)$/);

    const origin = new URL(page.url()).origin;
    const sameOriginFailures = failedRequests.filter((u) => u.startsWith(origin));
    expect(
      sameOriginFailures,
      `same-origin requests FAILED during an offline boot — the SW does not cover them:\n  ${sameOriginFailures.join('\n  ')}`,
    ).toEqual([]);
    const crossOriginFailures = failedRequests.filter((u) => !u.startsWith(origin));

    // Uncaught exceptions are absolute — nothing is filtered from this one.
    const pageErrors = phantom.hardErrors().filter((e) => e.type === 'pageerror');
    expect(
      pageErrors,
      `uncaught exceptions on an OFFLINE boot:\n${pageErrors.map((e) => `  ${e.text}`).join('\n')}`,
    ).toEqual([]);

    // Console errors, minus two documented HARNESS classes. Both are printed, never
    // hidden, and neither is added to the shared BENIGN_CONSOLE allowlist:
    //  1. the Chromium navigator.vibrate policy message (see the note at the top);
    //  2. the cross-origin AI proxy. phantomCheckApi() (:50945) pings
    //     https://phantom-api…workers.dev on every boot from phantomDeferredInit
    //     (:18248) with NO navigator.onLine pre-check. From 127.0.0.1 that request
    //     can never succeed — the Worker's CORS allowlist is the Pages origin — so
    //     it is unconditional harness noise. The generic
    //     "Failed to load resource: net::ERR_FAILED" lines carry no URL, so they are
    //     dropped ONLY while zero same-origin requests failed (asserted above),
    //     which is the only condition under which they cannot be an app defect.
    const PROXY = /phantom-api\.wfj6t2fk7w\.workers\.dev/i;
    const GENERIC_NET_FAIL = /^Failed to load resource: net::ERR_FAILED$/;
    const consoleErrors = phantom.hardErrors().filter((e) => e.type === 'error');
    const filtered = consoleErrors.filter((e) => {
      if (CHROMIUM_VIBRATE_POLICY.test(e.text)) return false;
      if (PROXY.test(e.text)) return false;
      if (GENERIC_NET_FAIL.test(e.text) && sameOriginFailures.length === 0) return false;
      return true;
    });
    const dropped = consoleErrors.length - filtered.length;
    if (dropped) {
      console.log(
        `[05-offline] ${dropped} harness-class console error(s) filtered on the offline boot ` +
          `(Chromium navigator.vibrate policy at dct-ios.html:18390; cross-origin AI proxy probe at :50945/:18248). ` +
          `cross-origin request failures seen: ${crossOriginFailures.length}. Both reported as findings, neither allowlisted.`,
      );
    }
    expect(
      filtered,
      `console errors on an OFFLINE boot:\n${filtered.map((e) => `  [${e.type}] ${e.text}`).join('\n')}`,
    ).toEqual([]);

    await page.context().setOffline(false);
  });

  // ── 4. HONEST OFFLINE STATE, not a generic failure ─────────────────────────
  test('losing the network is reported on the running app, not swallowed', async ({ phantom, page }) => {
    await phantom.boot();

    const before = await offlineState(page);
    expect(before.bodyNet, 'body[data-net] not set while online (phantomUpdateNetPill :50954)').toBe('online');

    await page.context().setOffline(true);

    // window 'offline' -> phantomUpdateNetPill(false, true) at :50969.
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.net || null), {
        message: 'window "offline" never reached phantomUpdateNetPill — the app went offline silently',
      })
      .toBe('offline');

    const after = await offlineState(page);
    expect(after.onLine, 'navigator.onLine still true after setOffline(true)').toBe(false);
    expect(after.bannerDisplay, '#offline-banner stayed hidden on network loss').toBe('block');
    // Honest, not generic: the banner names WHAT stopped working, and says the
    // rest of the app has not.
    expect(after.bannerText).toMatch(/OFFLINE/i);
    expect(after.bannerText, 'the offline banner does not say what became unavailable').toMatch(/unavailable/i);
    expect(after.netLabel).toBe('OFFLINE');

    // On screen, not merely in the DOM behind the redesign shell.
    await expect(page.locator('#offline-banner')).toBeVisible();

    // ⛔ PUT A REAL GATED CONTROL ON SCREEN FIRST. The connectivity gate (:11424) covers
    // [data-requires-net="1"] and .va-btn, and the app carries EXACTLY ONE tagged element:
    // #deploy-ai-review-btn (:37944), emitted by deploy_showDetail (:37829). A plain boot never
    // renders it, so the assertion below could only ever fail - it asserted app-wide what is only
    // true on one deep surface. Seeding a deployment and opening its detail makes the gate
    // testable on the control it actually governs.
    await page.evaluate(() => {
      const now = 1750000000000;
      localStorage.setItem('phantom_deployments_v1', JSON.stringify([{
        id: 'dep_offline_gate', name: 'OFFLINE GATE', status: 'active', buildLead: 'E2E',
        created: now, updated: now, createdAt: now, updatedAt: now, rackCount: 0, phaseCount: 0,
      }]));
      if (typeof deploy_showDetail === 'function') deploy_showDetail('dep_offline_gate');
    });
    await page.locator('#deploy-ai-review-btn')
      .waitFor({ state: 'attached', timeout: 10000 })
      .catch(() => {});   // swallowed: the assertion below reports WHY, with its own message

    // Net-dependent controls are gated by CSS, not left tappable-but-dead
    // (connectivity gate, :11069). Assert the computed effect, not the rule text.
    const gated = await page.evaluate(() => {
      const el = document.querySelector('[data-requires-net="1"]');
      if (!el) return { found: false };
      const cs = getComputedStyle(el);
      return { found: true, pointerEvents: cs.pointerEvents, opacity: Number(cs.opacity) };
    });
    expect(gated.found, 'no [data-requires-net="1"] element in the DOM — the connectivity gate has nothing to gate').toBe(true);
    expect(gated.pointerEvents, 'net-dependent control still tappable while offline').toBe('none');
    expect(gated.opacity, 'net-dependent control not visibly dimmed while offline').toBeLessThan(0.6);

    // And the AI door itself fails fast rather than burning ~23s of retries
    // (phantomAI offline pre-check, :17779).
    const ai = await page.evaluate(async () => {
      if (typeof phantomAI !== 'function') return { absent: true };
      const r = await phantomAI('test', 'sys', 'hello');
      const j = await r.json();
      return { ok: r.ok, offline: r.offline, errType: j && j.error && j.error.type };
    });
    if (!ai.absent) {
      expect(ai.ok, 'phantomAI did not refuse while offline').toBe(false);
      expect(ai.offline, 'phantomAI refusal is not flagged as an offline refusal').toBe(true);
      expect(ai.errType).toBe('offline');
    }

    // Recovery is symmetric — 'online' at :50968.
    await page.context().setOffline(false);
    await expect
      .poll(() => page.evaluate(() => document.body.dataset.net || null), { message: 'app never recovered to online' })
      .toBe('online');
    const back = await offlineState(page);
    expect(back.bannerDisplay).toBe('none');
    expect(back.netLabel).toBe('ONLINE');
  });

  test('a cold offline boot reports offline at first paint', async ({ phantom, page }) => {
    test.setTimeout(90_000);
    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    await page.context().setOffline(true);
    await assertNetworkIsCut(page);
    await swServesOfflineOrSkip(page);

    await bootOfflineOrSkip(phantom, page);

    // The network is still cut for the freshly-navigated document…
    await assertNetworkIsCut(page);
    const st = await offlineState(page);

    // …but Chromium's offline emulation does not carry navigator.onLine across
    // the navigation: the new document reads true. launch() :18412 calls
    // phantomUpdateNetPill(navigator.onLine), so the app is being told it is
    // online and behaves correctly for the value it was given. Judging the app on
    // that would be judging the emulator, so skip and say so.
    test.skip(
      st.onLine !== false,
      'navigator.onLine reads true on a document navigated while context.setOffline(true) ' +
        'is set (the network IS cut — asserted one line above — and the shell came from the ' +
        'service worker). The app reads navigator.onLine at launch() :18412, so its ' +
        'first-paint offline badge cannot be judged in this harness. Verify on device: ' +
        'airplane mode, cold launch, expect #offline-banner up before any interaction.',
    );

    expect(st.bodyNet, 'cold offline boot did not tag body[data-net="offline"]').toBe('offline');
    expect(st.bannerDisplay, 'cold offline boot did not raise #offline-banner').toBe('block');
    await expect(page.locator('#offline-banner')).toBeVisible();

    await page.context().setOffline(false);
  });

  // v1.14.427 — THE SAME QUESTION, ASKED IN A WAY THIS HARNESS CAN ANSWER.
  //
  // The test above skips because Chromium does not carry navigator.onLine across a navigation, so
  // a cold-booted document reads `true` while the network is genuinely cut. That is a limitation of
  // the EMULATOR, and the note correctly refused to judge the app on it — but it left the app's
  // actual contract untested and pushed it onto the owner as a device pass.
  //
  // The app's contract is narrow and testable: launch() (:18412) calls
  // phantomUpdateNetPill(navigator.onLine), so the requirement is "when the platform says offline
  // at first paint, the app says offline at first paint". Forcing that one platform signal BEFORE
  // any app script runs tests exactly that, and tests the APP rather than the emulator. The network
  // is cut as well, so the shell still has to come from the service worker — this does not become a
  // pure-mock test.
  //
  // What it deliberately does NOT claim: that real iOS reports onLine correctly in an installed
  // Home-Screen PWA. That is genuinely hardware (owner ruling 2026-08-10) and stays on the device.
  test('the app REPORTS offline at first paint when the platform says so — signal forced, network still cut', async ({ phantom, page }) => {
    test.setTimeout(90_000);
    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    // Before any app script of the NEXT navigation. This is the one value launch() reads.
    await page.addInitScript(() => {
      try { Object.defineProperty(navigator, 'onLine', { get: function () { return false; }, configurable: true }); } catch (_) {}
    });

    await page.context().setOffline(true);
    await assertNetworkIsCut(page);
    await swServesOfflineOrSkip(page);
    await bootOfflineOrSkip(phantom, page);
    await assertNetworkIsCut(page);          // the shell came from the SW, not the network

    const st = await offlineState(page);
    expect(st.onLine, 'the forced platform signal did not survive into the booted document').toBe(false);
    expect(st.bodyNet, 'the platform said offline at first paint and the app did not tag body[data-net="offline"]').toBe('offline');
    expect(st.bannerDisplay, 'the platform said offline at first paint and #offline-banner never came up').toBe('block');
    await expect(page.locator('#offline-banner')).toBeVisible();

    await page.context().setOffline(false);
  });

  // ── 5. WORK WRITTEN OFFLINE SURVIVES ───────────────────────────────────────
  test('work saved while offline survives an offline reload and the return to network', async ({ phantom, page }) => {
    test.setTimeout(120_000);
    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    await page.context().setOffline(true);
    await assertNetworkIsCut(page);
    await swServesOfflineOrSkip(page);

    await bootOfflineOrSkip(phantom, page);

    // A real app write path, not a synthetic localStorage poke: phantomRackLog()
    // (:44900) appends a rack-change entry through safeStore() into
    // 'phantom_rack_history' — the same door every rack edit goes through.
    const RACK = 'E2E-OFFLINE-RACK';
    const DETAIL = 'written with no signal';
    const wrote = await page.evaluate(
      ([rack, detail]) => {
        if (typeof phantomRackLog !== 'function') return 'phantomRackLog absent';
        phantomRackLog(rack, 'E2E offline write', detail);
        const all = safeGet('phantom_rack_history', {});
        return Array.isArray(all[rack]) && all[rack].length === 1 ? 'ok' : 'not persisted in-session';
      },
      [RACK, DETAIL],
    );
    // phantomRackLog swallows every error (`catch(e){}` :44910), so an in-session
    // read-back is the only way a failed offline write is visible at all.
    expect(wrote, 'the offline write never landed in localStorage').toBe('ok');

    // Survives a reload that is itself served entirely from cache.
    await bootOfflineOrSkip(phantom, page);
    const afterOfflineReload = await page.evaluate((rack) => {
      const e = (safeGet('phantom_rack_history', {})[rack] || [])[0];
      return e ? { action: e.action, detail: e.detail } : null;
    }, RACK);
    expect(afterOfflineReload, 'offline-saved work lost across an offline reload').not.toBeNull();
    expect(afterOfflineReload.detail).toBe(DETAIL);

    // Restoring the network must not clobber it. Reconnect + a fresh shell is
    // exactly the moment a naive "re-hydrate from the server" would wipe local work.
    await page.context().setOffline(false);
    await phantom.boot();
    await expect.poll(() => page.evaluate(() => document.body.dataset.net || null)).toBe('online');

    const afterOnline = await page.evaluate((rack) => {
      const list = safeGet('phantom_rack_history', {})[rack] || [];
      const e = list[0];
      return e ? { action: e.action, detail: e.detail, count: list.length } : null;
    }, RACK);
    expect(afterOnline, 'offline-saved work lost when the network came back').not.toBeNull();
    expect(afterOnline.detail).toBe(DETAIL);
    expect(afterOnline.count, 'the offline entry was duplicated or dropped on reconnect').toBe(1);
  });

  // ── 6. KNOWN DEFECT: offline PDF import is blocked by a stale guard ─────────
  test('offline PDF import uses the precached vendor bytes', async ({ phantom, page }) => {
    test.setTimeout(120_000);
    await phantom.boot();
    const reg = await installSW(page);
    test.skip(!reg.ok, `service worker could not be installed in this browser: ${reg.reason || 'unknown'}`);

    // NO NAVIGATION in this test, deliberately. The defect turns on
    // navigator.onLine, and navigator.onLine does not survive an emulated-offline
    // navigation (harness truth 3). Cutting the network on the LIVE document is the
    // one place the harness reports offline the way the device does — proven by
    // waiting for the app's own body[data-net] flip below.
    await page.context().setOffline(true);
    await assertNetworkIsCut(page);
    await swServesOfflineOrSkip(page);

    await expect
      .poll(() => page.evaluate(() => document.body.dataset.net || null), {
        message: 'the app never registered the network loss — precondition for this test',
      })
      .toBe('offline');
    expect(await page.evaluate(() => navigator.onLine), 'navigator.onLine did not go false').toBe(false);

    // Precondition: the 1.5MB v1.14.399 paid for really is offline-reachable.
    const cachedBytes = await page.evaluate(async () => ({
      lib: !!(await caches.match('vendor/pdf.min.js')),
      worker: !!(await caches.match('vendor/pdf.worker.min.js')),
    }));
    expect(cachedBytes.lib, 'vendor/pdf.min.js not in cache — precondition failed').toBe(true);
    expect(cachedBytes.worker, 'vendor/pdf.worker.min.js not in cache — precondition failed').toBe(true);

    // ⛔ DEFECT — dct-ios.html :48227.
    //   extractPdfText() opens with
    //       if (!navigator.onLine) throw new Error('PDF parsing needs a one-time
    //       online load. Connect to network once and re-import this PDF…')
    //   BEFORE it ever tries loadScript('./vendor/pdf.min.js').
    // That guard was correct until v1.14.399, which added BOTH vendor/pdf.min.js
    // and vendor/pdf.worker.min.js to PRECACHE_URLS (sw.js :50-56) for the stated
    // reason "so a tech in an aisle with no signal can still import" — 1.5MB paid
    // on every single install. The bytes are in the cache (asserted above); the
    // guard still refuses to look at them and tells the operator to go find signal
    // for a library the device is already holding.
    // FIX: delete the navigator.onLine pre-check and let loadScript fail honestly —
    // the existing catch at :48233 already produces the right message when the
    // vendor file genuinely cannot be had.
    // Declared here, AFTER the capability skips, so a browser that cannot serve
    // from the SW while offline reports SKIPPED rather than scoring its own
    // limitation as this defect.
    test.fail();

    const outcome = await page.evaluate(async () => {
      if (typeof extractPdfText !== 'function') return 'extractPdfText absent';
      const f = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'probe.pdf', { type: 'application/pdf' });
      try {
        await extractPdfText(f);
        return 'RESOLVED';
      } catch (e) {
        return String((e && e.message) || e);
      }
    });

    // A parse failure on a 4-byte probe file is fine and expected. What must NOT
    // happen is the app refusing on connectivity grounds for a cached library.
    expect(
      outcome,
      'extractPdfText refuses offline even though pdf.min.js is precached (dct-ios.html :48227)',
    ).not.toMatch(/one-time online load|Connect to network/i);

    await page.context().setOffline(false);
  });
});

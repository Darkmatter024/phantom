// ─────────────────────────────────────────────────────────────────────────────
// 56 — UPDATE COORDINATION: ONE DETECTOR, ONE APPLIER
//
// ⛔ THE DEFECT THIS PINS. dct-ios.html carried THREE independent reactions to one signal
// ("version.json does not match the shell I am running"):
//
//   1. :12880  a parse-time IIFE that called window.location.reload(true) on mismatch.
//   2. :12897  a second parse-time IIFE that called reg.unregister() and THEN reloaded.
//   3. :13024  phantom_versionFileBackstop(), which does the correct thing — it asks the worker
//              to re-check (reg.update()) and lets the normal updatefound → waiting → badge → tap
//              path raise the badge.
//
// (1) and (2) bypassed the protection v1.14.458 built on purpose. That ship added a
// controllerchange listener gated on `_swUpdating` precisely so the page reloads only when the
// TECHNICIAN asked for an update — its own comment says an ungated reload is "an app that reboots
// itself under a technician's hands for no reason they can see". (1) and (2) did exactly that, on
// a version mismatch alone, which the same file calls out as NOT an actionable update. They also
// raced each other: both fetched version.json on the same load, so which one won was undefined.
//
// ⭐ MEASURED, NOT ARGUED: against the unfixed file, the mismatch case below could not finish
// booting at all — the reloader cannot fix the condition it fires on, so it fired again on the
// next load. A boot loop is the worst possible cold-aisle outcome.
//
// ⭐ WHY (2) WAS THE DANGEROUS ONE. reg.unregister() destroys the registration, so the reload
// behind it has no controller and no cached shell. On marginal signal that turns a working
// offline app into one that cannot boot — the exact capability the app exists to have. A stale
// shell was already handled properly in sw.js: navigations are network-first with cache:'reload'.
//
// ⚠ AND THEY RAN WHERE THE REAL MACHINERY DOES NOT. The canonical registration block is gated
// `location.protocol === 'https:'`. (1) had no guard at all and (2) guarded only on
// 'serviceWorker' in navigator — so on any non-https origin the two reloaders ran while the path
// they were shadowing was switched off. On the http projects that is still the case, which is why
// the backstop is exercised there by DIRECT CALL: it is a top-level function, so it is reachable
// even when its https-gated caller is not.
//
// ⭐ ON sw-https-chromium THE CALLER ITSELF RUNS. That project serves a real secure origin, so the
// app registers its own worker and the whole path — register → updatefound → backstop → badge —
// executes for real. The same tests then mean strictly more there. Run both.
//
// THE FIX IS SUBTRACTION, NOT ANOTHER GUARD. (1) and (2) are deleted. Detection stays in one place
// (the backstop); application stays in one place (phantom_swApplyUpdate → SKIP_WAITING →
// controllerchange → exactly one reload).
//
// RUN STANDALONE:
//   cd test && npx playwright test e2e/56-update-coordination.spec.js --project=phone-webkit
//   cd test && npx playwright test e2e/56-update-coordination.spec.js --project=sw-https-chromium
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const { test, expect } = require('./fixtures');

const MISMATCH = 'phantom-v9.99.999';
const LIVE_VERSION = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../version.json'), 'utf8')
).version;

/** Source with block comments and // lines stripped — the same treatment spec 39 uses. */
function strip(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
}

/**
 * ⭐ THE RELOAD DETECTOR, AND WHY IT IS NOT page.on('framenavigated').
 * A first cut counted framenavigated events and reported TWO for a single clean load on
 * phone-webkit — WebKit emits a second event for one document. Probed it: the init script below
 * ran once and performance navigation type was "navigate", so the app had not reloaded and the
 * detector was lying. addInitScript runs exactly once per real document load, so counting there
 * counts documents, which is the thing under test.
 */
async function armLoadCounter(page) {
  await page.addInitScript(() => {
    try {
      const n = Number(sessionStorage.getItem('__phantom_loads') || '0') + 1;
      sessionStorage.setItem('__phantom_loads', String(n));
    } catch (_) { /* storage disabled — the read below reports 0 and the test says so */ }
  });
}

/** Tolerant read: a page caught mid-reload destroys the execution context. Retry, don't crash. */
async function readLoads(page) {
  for (let i = 0; i < 5; i++) {
    try {
      return await page.evaluate(() => Number(sessionStorage.getItem('__phantom_loads') || '0'));
    } catch (_) {
      await page.waitForTimeout(300);
    }
  }
  return -1; // -1 means "could not be read at all", which is itself a reload-loop symptom.
}

/**
 * Answer the app's version.json probe with a chosen version — or with a failure.
 *
 * ⛔ THIS USED TO BE page.route('**‍/version.json*'), AND ON A REAL SERVICE WORKER THAT SILENTLY
 * DID NOTHING. When a worker controls the page, the app's fetch goes to the worker first and the
 * worker's own outbound fetch is not a page request, so page.route never sees it. Caught the day
 * the sw-https-chromium project was added: the detector test failed with "the detector saw a
 * mismatch and said nothing" because it had been handed the REAL version.json, which of course
 * matched. The three sibling tests did not fail — they had quietly degraded into tautologies,
 * asserting "no reload happened" in a run where no mismatch was ever presented.
 *
 * ⭐ A FIXTURE THAT PASSES BY NOT APPLYING IS WORSE THAN ONE THAT SKIPS. Overriding window.fetch
 * in an init script intercepts the app's own call site directly, so it behaves identically with a
 * worker and without one — the same fixture on all projects, one mechanism, no silent hole. The
 * network layer is not what these tests are about; the app's reaction to a version is.
 */
async function stubVersion(page, version) {
  await page.addInitScript((v) => {
    const orig = window.fetch.bind(window);
    window.fetch = function (input, init) {
      let url = '';
      try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch (_) {}
      if (/version\.json/.test(url)) {
        // v === null means "the probe is unanswerable" — the offline shape.
        if (v === null) return Promise.reject(new TypeError('Failed to fetch'));
        return Promise.resolve(new Response(
          JSON.stringify({ version: v, released: '2099-01-01', notes: 'harness fixture' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ));
      }
      return orig(input, init);
    };
  }, version);
}

// ═══ STRUCTURE ═══════════════════════════════════════════════════════════════════
// Browser-independent, and they need no boot — the invariant is about the served bytes. Using the
// request context instead of a page keeps the whole describe under a second.
test.describe('update coordination — structure', () => {

  test('⛔ exactly ONE place asks the server what version it is serving', async ({ request }) => {
    const code = strip(await (await request.get('/dct-ios.html')).text());
    const asks = (code.match(/fetch\(\s*'\.\/version\.json/g) || []).length;
    // 3 was the defect: two parse-time reloaders plus the backstop, all reacting to one signal.
    expect(asks,
      `${asks} sites fetch version.json — exactly 1 detector is correct. More than one means ` +
      `competing reactions to a single signal, and which one wins is a race.`).toBe(1);
  });

  test('⛔ no startup path unregisters the service worker — offline startup is not negotiable', async ({ request }) => {
    const code = strip(await (await request.get('/dct-ios.html')).text());
    // RackEngine.unregister() is the WebGL mount registry and has nothing to do with workers.
    const swUnregisters = (code.replace(/RackEngine\.unregister\s*\(/g, '').match(/\.unregister\s*\(/g) || []).length;
    expect(swUnregisters,
      '⛔ the app shell unregisters its service worker. The reload behind an unregister has no ' +
      'controller and therefore no cached shell — on marginal signal the app cannot boot at all. ' +
      "Recovering from a stale shell is the fetch handler's job (network-first navigations with " +
      "cache:'reload'), not a sledgehammer at parse time.").toBe(0);
  });

  test('⛔ the only automatic reload is the one the technician asked for', async ({ request }) => {
    const code = strip(await (await request.get('/dct-ios.html')).text());

    const cc = (code.match(/addEventListener\(\s*'controllerchange'/g) || []).length;
    expect(cc, `${cc} controllerchange listeners — exactly 1 is correct`).toBe(1);

    // ⭐ THE GATE ITSELF. Without `if (!_swUpdating) return;` a first install's clients.claim()
    // fires controllerchange and reboots the app on its very first load — the .458 regression.
    const ccStart = code.indexOf("addEventListener('controllerchange'");
    expect(/_swUpdating/.test(code.slice(ccStart, ccStart + 400)),
      '⛔ the controllerchange reload is no longer gated on _swUpdating — a first-install ' +
      'clients.claim() will reboot the app under the technician.').toBe(true);

    // The shape of the deleted defect: compare a version, then reload, with nothing in between
    // asking the technician.
    expect(/PHANTOM_APP_VERSION\s*\)[\s\S]{0,200}?location\.reload/.test(code),
      '⛔ a version comparison reloads the page directly. A mismatch is evidence the worker has ' +
      'not noticed yet — the honest response is to make it look, not to reboot.').toBe(false);
  });

  test('update availability survives: the detector and the single activation door are both intact', async ({ request }) => {
    const code = strip(await (await request.get('/dct-ios.html')).text());

    // Deleting the reloaders must not delete the ability to NOTICE a new build.
    expect(/function\s+phantom_versionFileBackstop\s*\(/.test(code),
      '⛔ the version detector is gone — the app can no longer notice a new build').toBe(true);
    const bStart = code.indexOf('function phantom_versionFileBackstop');
    const bBody = code.slice(bStart, code.indexOf('\n}', bStart));
    expect(/reg\.update\s*\(/.test(bBody),
      '⛔ the backstop no longer asks the worker to re-check').toBe(true);
    expect(/location\.reload/.test(bBody),
      '⛔ the backstop reloads on mismatch — that is the defect moving house').toBe(false);

    expect(/function\s+phantom_swApplyUpdate\s*\(/.test(code),
      '⛔ the single activation door is gone').toBe(true);
    const posts = (code.match(/type:\s*'SKIP_WAITING'/g) || []).length;
    expect(posts, `${posts} SKIP_WAITING post sites — exactly 1 canonical door is correct`).toBe(1);
  });
});

// ═══ BEHAVIOUR ═══════════════════════════════════════════════════════════════════
// phone-webkit is the primary field device and installs no service worker, so the page-level
// reloaders are isolated here with nothing in front of them.
test.describe('update coordination — behaviour', () => {

  test('⛔ sw-https-chromium really is a secure origin with a live worker', async ({ phantom, page }, testInfo) => {
    // Other projects serve http on purpose and have nothing to prove here.
    test.skip(testInfo.project.name !== 'sw-https-chromium',
      'this guard belongs to the secure-origin project only');

    // ⛔ THIS TEST EXISTS TO MAKE A VACUOUS GREEN IMPOSSIBLE. 05-offline's registration test
    // self-skips when the origin is not https — correct there, but it means a dead https listener
    // would turn this whole project into a suite that SKIPS the thing it exists to check and
    // reports success. Everything below is a hard assertion: no skip, no poll-and-shrug.
    await phantom.boot();

    const state = await page.evaluate(async () => {
      // The registration is async off window 'load'; give it a bounded chance to appear.
      for (let i = 0; i < 40 && !navigator.serviceWorker.controller; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return {
        protocol: location.protocol,
        secure: window.isSecureContext,
        controller: !!navigator.serviceWorker.controller,
        regs: (await navigator.serviceWorker.getRegistrations()).length,
        appHandle: typeof PHANTOM_SW_REG !== 'undefined' ? !!PHANTOM_SW_REG : false,
      };
    });

    expect(state.protocol, 'this project is not on https — server.js did not start its TLS listener').toBe('https:');
    expect(state.secure, 'the origin is not a secure context').toBe(true);
    expect(state.regs, 'no service worker registration exists').toBeGreaterThan(0);
    // ⭐ THE ONE THAT MATTERS: the APP registered it, not the test harness by hand.
    expect(state.appHandle,
      '⛔ PHANTOM_SW_REG is unset — the app did not register its own worker. Either the https gate ' +
      'is failing or the SW script fetch was rejected (ignoreHTTPSErrors does NOT cover that fetch; ' +
      'the project passes --ignore-certificate-errors for exactly this reason).').toBe(true);
    expect(state.controller, 'the worker never took control of the page').toBe(true);
  });

  test('⛔ a version MISMATCH alone does not reload the app', async ({ phantom, page }) => {
    await armLoadCounter(page);
    await stubVersion(page, MISMATCH);

    // Against the unfixed file this threw (the reload loop tore down every boot). Catch it so the
    // load count below is what reports the failure, rather than an opaque boot timeout.
    let bootErr = null;
    try { await phantom.boot(); } catch (e) { bootErr = e; }

    // ⚠ A BOUNDED WINDOW IS UNAVOIDABLE: this asserts the ABSENCE of an event, and there is no
    // state to wait on for something that must never happen. Both deleted reloaders fired from a
    // two-hop promise chain off a fetch that resolves during boot, so they are long past by now —
    // this window is slack, not the mechanism.
    await page.waitForTimeout(1200);

    const loads = await readLoads(page);
    expect(loads,
      `the app loaded the document ${loads} times on a version mismatch. A mismatch alone must ` +
      `never reload: it interrupts whatever the technician was doing, and because the reload ` +
      `cannot fix the mismatch it fires again on the next load.`).toBe(1);

    if (bootErr) throw bootErr;
    await expect(page.locator('#app')).toHaveClass(/visible/);
  });

  test('⛔ a version mismatch alone does not destroy saved technician data', async ({ phantom, page }) => {
    await armLoadCounter(page);
    await stubVersion(page, MISMATCH);

    await phantom.boot({
      seed: {
        phantom_deploy_racks_v1: JSON.stringify([{ id: 'rack-KEEPME' }]),
        phantom_event_log_v1: JSON.stringify([{ ts: 1, msg: 'KEEPME' }]),
      },
    });
    await page.waitForTimeout(1200);

    const kept = await page.evaluate(() => ({
      racks: localStorage.getItem('phantom_deploy_racks_v1'),
      log: localStorage.getItem('phantom_event_log_v1'),
      profile: localStorage.getItem('phantom_site_profile_v1'),
    }));
    expect(kept.racks, '⛔ rack data did not survive a version mismatch').toContain('rack-KEEPME');
    expect(kept.log, '⛔ the event log did not survive a version mismatch').toContain('KEEPME');
    expect(kept.profile, '⛔ the site profile did not survive a version mismatch').toContain('Harness Facility');
  });

  test('⭐ the canonical detector REPORTS a mismatch and does not act on it', async ({ phantom, page }) => {
    await armLoadCounter(page);
    // ⚠ BEFORE boot(), not after. addInitScript applies to the NEXT navigation, so stubbing a
    // page that has already loaded installs nothing — which is exactly what happened when this
    // was converted from page.route (immediate) and the test went red on both projects.
    await stubVersion(page, MISMATCH);
    await phantom.boot();

    // Direct call, so the assertion does not depend on whether this project's origin lets the
    // https-gated caller run. On sw-https-chromium it also runs on its own during boot.
    const warns = await page.evaluate(async () => {
      const seen = [];
      const orig = console.warn;
      console.warn = function () { seen.push(Array.from(arguments).join(' ')); orig.apply(console, arguments); };
      try {
        phantom_versionFileBackstop();
        await new Promise((r) => setTimeout(r, 800));
      } finally { console.warn = orig; }
      return seen;
    });

    // Contract 14: it must SAY something. Silence on a real mismatch is the failure.
    expect(warns.some((w) => /version\.json reports/i.test(w)),
      `the detector saw a mismatch and said nothing — got ${JSON.stringify(warns)}`).toBe(true);

    await page.waitForTimeout(600);
    expect(await readLoads(page),
      '⛔ the detector reloaded the page. Detection reports; only an update the technician asked ' +
      'for applies.').toBe(1);
    await expect(page.locator('#app')).toHaveClass(/visible/);
  });

  test('a MATCHING version is silent — no reload, no noise', async ({ phantom, page }) => {
    await armLoadCounter(page);
    await stubVersion(page, LIVE_VERSION);

    await phantom.boot();
    await page.waitForTimeout(1200);

    expect(await readLoads(page), 'the app reloaded on a MATCHING version').toBe(1);
    await expect(page.locator('#app')).toHaveClass(/visible/);
    expect(phantom.hardErrors(), 'a matching version produced console errors').toEqual([]);
  });

  test('offline startup: the app boots when version.json cannot be reached', async ({ phantom, page }) => {
    await armLoadCounter(page);
    // The offline shape: the document is served, the version probe is not answerable.
    await stubVersion(page, null);

    await phantom.boot();
    await page.waitForTimeout(1200);

    await expect(page.locator('#app')).toHaveClass(/visible/);
    expect(await readLoads(page),
      'an unanswerable version probe must be a no-op, never a reboot').toBe(1);
  });
});

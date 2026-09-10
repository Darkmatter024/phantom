// Shared PHANTOM test fixture. Every spec imports { test, expect } from here.
//
// Design rules for this file:
//  1. No sleeps. Every wait is on an observable state the app actually reaches.
//  2. The console-error allowlist is NARROW and each entry carries the reason it is
//     benign. An allowlist that grows to keep the suite green is how a real regression
//     ships. If a new pattern needs adding, it needs a written reason here.
//  3. Seeding is explicit. A test that needs a confirmed site profile says so; it does
//     not inherit one from a previous spec.

const base = require('@playwright/test');

const expect = base.expect;

// ── Storage seeds ────────────────────────────────────────────────────────────────
// The first-run confirm gate (firstRun_show, :25882) fires over the app whenever
// siteProfile_isConfirmed() (:25741) is false — i.e. on every fresh browser profile.
// Tests that want to reach a real surface seed past it. Tests that assert the gate
// itself pass { confirmProfile: false }.
const SITE_PROFILE_KEY = 'phantom_site_profile_v1';

const SEEDED_PROFILE = {
  schemaVersion: 2,
  facilityId: 'TEST-01',
  facilityName: 'Harness Facility',
  operator: 'E2E',
  confirmedAt: 1750000000000,
  lastUpdated: 1750000000000,
};

// ── Console-error allowlist ──────────────────────────────────────────────────────
// Each entry MUST state why it is not a defect. Empty by intent: we start strict and
// only add with evidence, so the first run tells us the honest baseline.
const BENIGN_CONSOLE = [
  // Playwright's WebKit build reports this for the SW's opaque cross-origin probe on
  // some runs; it is a harness artifact, not app behaviour. Verified: no equivalent
  // entry appears in Safari on device.
  /Failed to load resource: the server responded with a status of 404 .*favicon/i,
];

function isBenign(text) {
  return BENIGN_CONSOLE.some((re) => re.test(text));
}

// ── The AI-proxy health probe, answered locally ──────────────────────────────────
// Owner ruling 2026-09-10 (OWNER-RULINGS.md, INTEL-DOCK item 4): fix the harness CORS red with
// a ROUTE INTERCEPT, never by widening BENIGN_CONSOLE above.
//
// WHAT IT FIXES. phantomDeferredInit fires phantomCheckApi() on every boot, an OPTIONS probe at
// PHANTOM_PROXY_URL. That Worker enforces a real Origin allowlist — measured 2026-09-09 with a
// read-only preflight: https://phantom-staging.wfj6t2fk7w.workers.dev and
// https://darkmatter024.github.io are echoed and allowed; http://127.0.0.1:4317 is refused, and
// so is a bogus control origin. The Worker is CORRECT; the harness is simply not one of the two
// real origins and must not be added as a third. WebKit then emits THREE entries for that one
// request (two console errors and a stack-less pageerror), which is what has been reddening
// `00-boot.spec.js:18`.
//
// ⚠ IT IS A RACE, NOT A STEADY RED, WHICH IS WHY IT HAD TO BE REMOVED RATHER THAN TOLERATED.
// The same commit that landed .586 failed that test inside a heavily loaded 430-test run and
// PASSED it on an idle box. A failure that depends on whether the refusal lands inside the
// assertion window is the kind that appears on a busy day, gets blamed on whatever shipped that
// morning, and then vanishes on the re-run meant to confirm it.
//
// WHY FULFIL RATHER THAN ABORT. Answering 204 with permissive CORS puts the app on the SAME code
// path it takes from the allowlisted production origin, so the harness tests what Pages runs. An
// abort would only trade a CORS error for a network error and would keep the API dot permanently
// red — and a red API dot pins the SYS aggregate to 'offline', which is exactly what would make
// INTEL-DOCK's lit ghost untestable.
//
// LIFTED, NOT INVENTED: `02-build-forge.spec.js` and `08-forge-layout.spec.js` already carried
// byte-identical local copies of this stub. Theirs still run and are harmless — a later route
// wins, and both fulfil identically — but they are now redundant and are candidates for deletion
// in a cleanup ship, not this one.
//
// TO OVERRIDE in a spec that genuinely needs the probe to fail, register your own handler after
// boot-time setup; the later route takes precedence:
//     await page.route(PROXY_ROUTE, (r) => r.abort());
const PROXY_ROUTE = /phantom-api\.[a-z0-9]+\.workers\.dev/;

async function stubHealthProbe(page) {
  await page.route(PROXY_ROUTE, (route) =>
    route.fulfill({
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': '*',
      },
      body: '',
    }));
}

// ── The fixture ──────────────────────────────────────────────────────────────────
const test = base.test.extend({
  phantom: async ({ page }, use) => {
    // FIRST, and before anything can navigate: answer the AI-proxy health probe locally so it
    // never leaves the harness. See stubHealthProbe above for the ruling and the measurements.
    await stubHealthProbe(page);

    /** @type {{type:string, text:string}[]} */
    const errors = [];

    page.on('console', (msg) => {
      const type = msg.type();
      if (type !== 'error' && type !== 'warning') return;
      const text = msg.text();
      if (type === 'error' && !isBenign(text)) errors.push({ type, text });
      // Warnings are collected but not fatal — PHANTOM uses console.warn deliberately
      // as its no-silent-failure channel, so a warn is a signal, not a failure.
      if (type === 'warning') errors.push({ type, text });
    });

    page.on('pageerror', (err) => {
      errors.push({ type: 'pageerror', text: String(err && err.message ? err.message : err) });
    });

    const api = {
      page,
      errors,

      /** Console entries of type 'error' or an uncaught exception. Warnings excluded. */
      hardErrors() {
        return errors.filter((e) => e.type === 'error' || e.type === 'pageerror');
      },

      /** console.warn entries — PHANTOM's intentional no-silent-failure channel. */
      warnings() {
        return errors.filter((e) => e.type === 'warning');
      },

      /**
       * Cold-boot the app and enter past the splash.
       * @param {{query?:string, confirmProfile?:boolean, seed?:Record<string,string>}} [opts]
       */
      async boot(opts = {}) {
        const { query = '', confirmProfile = true, seed = {} } = opts;

        const seeds = { ...seed };
        if (confirmProfile) seeds[SITE_PROFILE_KEY] = JSON.stringify(SEEDED_PROFILE);

        // Runs before any application script on every navigation of this page.
        await page.addInitScript((payload) => {
          try {
            for (const [k, v] of Object.entries(payload)) window.localStorage.setItem(k, v);
          } catch (_) {
            /* quota or disabled storage — the app's own guards are what we're testing */
          }
        }, seeds);

        await page.goto('/dct-ios.html' + query, { waitUntil: 'domcontentloaded' });

        // The splash is a tap-anywhere gate (:12900). #pe-tapcatch is a real <button>.
        //
        // 2026-08-28: this used to wait for 'attached' and click with { force: true }, and it
        // failed EVERY spec in the suite. 'attached' means present in the DOM, not able to
        // receive events, and dct-ios.html is a ~3.7MB single file: domcontentloaded fires well
        // before the document is hit-testable. force:true then SKIPS the actionability wait that
        // would have caught exactly that, so the click dispatched into a document where
        // elementFromPoint still returned <html> and the splash handler never ran. The app was
        // fine the whole time - it becomes hit-testable about a second later.
        //
        // Wait for 'visible' and let actionability do its job. Never re-add force:true here: it
        // converts a timing failure into a silent no-op that looks like a dead tap target.
        const tap = page.locator('#pe-tapcatch');
        await tap.waitFor({ state: 'visible', timeout: 20_000 });
        // Best-effort: on a SECOND boot in the same page the v1.14.474 return-visit skip
        // (phantom_seen_boot) auto-fires after 400ms and the splash is already dissolving, so a
        // click that waits for actionability can never land. The click is not the gate - the
        // boot condition below is. Try to tap, and let the auto-fire win the race if it does.
        await tap.click({ timeout: 10_000 }).catch(() => {});

        // launch() reveals #app then hides #boot on the next frame (:18383).
        // Wait on the end state, never on the animation duration.
        await page.waitForFunction(() => {
          const boot = document.getElementById('boot');
          const app = document.getElementById('app');
          return !!app && app.classList.contains('visible') && !!boot && boot.style.display === 'none';
        }, undefined, { timeout: 25_000 });

        // Entry failure is reported on the splash itself (:12878), not only in console.
        const hint = await page.locator('#pe-taphint').textContent().catch(() => '');
        expect(hint || '', 'boot entry reported a failure on the splash').not.toMatch(/ENTRY FAILED/i);

        return api;
      },

      /** The version the running app reports, read from its own service-worker manifest. */
      async liveVersion() {
        const res = await page.request.get('/version.json');
        const json = await res.json();
        return json.version;
      },

      /**
       * Unregister the service worker and delete every cache.
       * A URL cache-buster does NOT bypass a registered SW — this is the only reliable
       * way to guarantee the next boot serves the working tree.
       */
      async clearServiceWorker() {
        await page.evaluate(async () => {
          if (navigator.serviceWorker) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
          if (window.caches) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        });
      },

      /** True when the redesign house is active (bare URL default since v1.14.101). */
      async isRedesign() {
        return page.evaluate(() => document.body.classList.contains('rd'));
      },

      /** Assert the document never exceeds the viewport horizontally (Design Rule 1). */
      async assertNoHorizontalOverflow() {
        const over = await page.evaluate(() => {
          const de = document.documentElement;
          return {
            scrollW: de.scrollWidth,
            clientW: de.clientWidth,
            offenders: Array.from(document.querySelectorAll('body *'))
              .filter((el) => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && r.right > de.clientWidth + 1;
              })
              .slice(0, 8)
              .map((el) => `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`),
          };
        });
        expect(over.scrollW, `horizontal overflow: ${over.offenders.join(' | ')}`).toBeLessThanOrEqual(over.clientW + 1);
      },
    };

    await use(api);
  },
});

// ── v1.14.412 — ONE DOOR PER MODE, WHATEVER THE TIER ────────────────────────
// PHANTOM has two navigation organs now. Below 1024 it is the bottom nav
// (#bn-command / #bn-work / #bn-ref); at 1024 and up the desktop shell replaces
// it with a left rail (#cs-nav-cmd / #cs-nav-bld / #cs-nav-tls). Both call the
// same showMode(), so this is one door with two handles.
//
// Every spec that navigated by clicking #bn-* was really saying "go to Build" —
// it just had only one way to say it when the phone layout was the only layout.
// Those specs were not testing the bottom nav; 01-nav is where the bottom nav
// itself is under test.
//
// CHOSEN BY WHAT IS ON SCREEN, NOT BY WIDTH. The tests must not carry their own
// copy of the 1024 breakpoint — that is the app's number, declared once in CSS,
// and a second copy here would go stale the moment it moved. Asking which organ
// is actually visible also means these specs keep passing if the boundary is
// ever retuned.
const MODE_DOORS = {
  command: { nav: '#bn-command', rail: '#cs-nav-cmd' },
  work:    { nav: '#bn-work',    rail: '#cs-nav-bld' },
  ref:     { nav: '#bn-ref',     rail: '#cs-nav-tls' },
};

async function railIsUp(page) {
  return page.evaluate(() => {
    const r = document.querySelector('#cs-nav-cmd');
    return !!r && r.getBoundingClientRect().height > 0;
  });
}

async function gotoMode(page, mode) {
  const door = MODE_DOORS[mode];
  if (!door) throw new Error(`gotoMode: unknown mode "${mode}"`);
  const sel = (await railIsUp(page)) ? door.rail : door.nav;
  await page.locator(sel).click();
  return sel;
}

module.exports = { test, expect, SITE_PROFILE_KEY, SEEDED_PROFILE, gotoMode, railIsUp, MODE_DOORS };

// ─────────────────────────────────────────────────────────────────────────────
// 57 — NAVIGATION RECOVERY: VALIDATE BEFORE YOU DEACTIVATE
//
// ⛔ THE DEFECT THIS PINS (source-confirmed, and see the REACHABILITY note below).
// showPage() cleared every .page and every .tn-item FIRST, and only then looked for
// #pg-<id>. A missing target therefore could not merely fail to navigate — it left the app on
// NO ACTIVE PAGE AT ALL. v1.14.548 recognised that and bolted on a recovery branch:
//
//     var _homeId = redesign_isOn() ? 'pg-cmd' : 'pg-triage';
//
// ...and the legacy half of that ternary named a page v1.14.555 had DELETED. getElementById
// returned null, the guarded assignment did nothing, and that branch landed on exactly the blank
// screen it existed to prevent. A recovery branch is a second mechanism papering over an ordering
// bug; the ordering was the defect.
//
// ⚠ REACHABILITY — STATED PLAINLY, BECAUSE IT CHANGES WHAT THIS FIX IS.
// redesign_isOn() (:19355) is now a hard `return true` (LEGACY-RETIRE Stage 7a), so:
//   · the ternary's 'pg-triage' half was DEAD CODE — it could never be selected; and
//   · the .181 guard (:24691) intercepts every id outside ['cmd','work','ref','master'] before
//     the page-swap code runs, and all four of those pages exist in the markup.
// So the inverted ordering was NOT reachable through any ordinary showPage() call, and no
// blank screen could be produced against this checkout. This is a LATENT-defect fix, not a
// field-bug fix. It is worth having because LEGACY-RETIRE deletes a page per ship: the moment
// any whitelisted id loses its page, the old ordering blanks the app with no warning.
//
// ⭐ WHICH IS WHY THE BEHAVIOURAL TESTS USE A CONTROLLED FIXTURE. The condition cannot be
// produced by navigating, so it is produced directly — a real whitelisted page is renamed out
// from under a real showPage() call. That exercises the actual code path rather than a
// simulation of it.
//
// THREE SYMPTOMS, ONE CAUSE. Returning before the swap also stops the nav indicator lighting a
// tab whose page is not showing, and stops nav_push() recording a dead id that a later back
// gesture or session restore would replay into the same failure.
//
// ⚠ ONE UI MODE EXISTS. ?legacy=1 is inert (01-nav.spec.js:385 pins that), so "each supported
// interface mode" is the redesign house plus the guard that stands in front of it. Both are
// covered below.
//
// RUN STANDALONE:
//   cd test && npx playwright test e2e/57-nav-recovery.spec.js --project=phone-webkit
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

/**
 * Source with comments stripped — spec 39's treatment, plus HTML comments.
 * ⚠ THE HTML-COMMENT PASS IS NOT OPTIONAL HERE. dct-ios.html is one document, so a scan for a
 * deleted id also sees the markup. :16375 is the <!-- --> note recording that pg-triage was
 * deleted in v1.14.555 — exactly the historical record this repo keeps on purpose, and not a
 * live reference. Without this pass the "no live code reference" test fails on its own evidence.
 */
function strip(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
}

/** Run fn in the page with console.warn captured. */
const withWarns = (body) => `async () => {
  const seen = [];
  const orig = console.warn;
  console.warn = function () { seen.push(Array.from(arguments).join(' ')); orig.apply(console, arguments); };
  try { ${body} } finally { console.warn = orig; }
}`;

// ═══ STRUCTURE ═══════════════════════════════════════════════════════════════════
test.describe('navigation recovery — structure', () => {

  test('⛔ the destination is validated BEFORE anything is deactivated', async ({ request }) => {
    const code = strip(await (await request.get('/dct-ios.html')).text());

    const fn = code.slice(code.indexOf('function showPage(id, tnEl, opsTab)'));
    const body = fn.slice(0, fn.indexOf('\nfunction '));

    const lookup = body.indexOf("document.getElementById('pg-' + id)");
    const bail = body.indexOf('return;', lookup);
    const deactivate = body.indexOf("querySelectorAll('.page')");

    expect(lookup, 'showPage no longer looks up #pg-<id> at all').toBeGreaterThan(-1);
    expect(deactivate, 'showPage no longer deactivates pages — the function has changed shape').toBeGreaterThan(-1);

    // ⭐ THE WHOLE FIX IN ONE ASSERTION.
    expect(lookup,
      '⛔ showPage deactivates every .page before it validates the destination. A missing target ' +
      'then strands the app on no active page at all — a blank screen with nothing thrown.')
      .toBeLessThan(deactivate);
    expect(bail).toBeGreaterThan(-1);
    expect(bail,
      '⛔ the early return for a missing destination does not sit before the deactivation sweep')
      .toBeLessThan(deactivate);
  });

  test('⛔ no live code reference to a deleted page', async ({ request }) => {
    const code = strip(await (await request.get('/dct-ios.html')).text());
    // pg-triage was deleted in v1.14.555. Comments may still discuss it — code may not name it.
    expect(/pg-triage/.test(code),
      '⛔ code still references pg-triage, which v1.14.555 deleted. A recovery target that does ' +
      'not exist is not a recovery. Delete the reference; do not restore the screen.').toBe(false);
  });

  test('the failure still surfaces — no silent return on a missing destination', async ({ request }) => {
    const code = strip(await (await request.get('/dct-ios.html')).text());
    const fn = code.slice(code.indexOf('function showPage(id, tnEl, opsTab)'));
    const body = fn.slice(0, fn.indexOf('\nfunction '));
    const lookup = body.indexOf("document.getElementById('pg-' + id)");
    const guard = body.slice(lookup, body.indexOf('return;', lookup));

    // Contract 14: fail loudly. A bare `if (!x) return;` on a user-facing path is the violation.
    expect(/console\.warn/.test(guard), '⛔ the missing-destination path logs nothing').toBe(true);
    expect(/phantomToast/.test(guard), '⛔ the missing-destination path tells the technician nothing').toBe(true);
  });
});

// ═══ BEHAVIOUR ═══════════════════════════════════════════════════════════════════
test.describe('navigation recovery — behaviour', () => {

  test('⛔ a navigation to a missing page RETAINS the page already showing', async ({ phantom, page }) => {
    await phantom.boot();

    const before = await page.evaluate(() => Array.from(document.querySelectorAll('.page.active')).map((p) => p.id));
    expect(before, 'fixture invalid — the app did not start on exactly one active page').toHaveLength(1);

    const r = await page.evaluate(new Function('return ' + withWarns(`
      // CONTROLLED FIXTURE: rename a real, whitelisted page out from under a real showPage() call.
      // 'work' passes the .181 redesign guard, so this reaches the validation under test.
      const victim = document.getElementById('pg-work');
      victim.id = 'pg-work-RENAMED';
      try {
        showPage('work');
      } finally {
        victim.id = 'pg-work';
      }
      return {
        warns: seen,
        active: Array.from(document.querySelectorAll('.page.active')).map((p) => p.id),
      };
    `))());

    expect(r.active,
      `⛔ the app was left on ${r.active.length} active pages after navigating to a missing ` +
      `destination. Zero means a blank screen: every page was deactivated before the target was ` +
      `checked.`).toEqual(before);

    expect(r.warns.some((w) => /\[nav\] showPage/.test(w)),
      `⛔ the missing destination was not reported — got ${JSON.stringify(r.warns)}`).toBe(true);
  });

  test('⛔ a missing destination is not pushed into nav state', async ({ phantom, page }) => {
    await phantom.boot();

    const r = await page.evaluate(() => {
      const stateBefore = JSON.stringify(history.state);
      const victim = document.getElementById('pg-work');
      victim.id = 'pg-work-RENAMED';
      try { showPage('work'); } finally { victim.id = 'pg-work'; }
      return { stateBefore, stateAfter: JSON.stringify(history.state) };
    });

    // nav_push sits at the END of showPage. Reaching it with a dead id records a destination the
    // app cannot honour, which a back gesture or session restore then replays into the same failure.
    expect(r.stateAfter,
      '⛔ nav state recorded a destination that does not exist. Back or session-restore will ' +
      'replay it straight back into this failure.').toBe(r.stateBefore);
    expect(r.stateAfter, 'nav state now names the missing page').not.toContain('work-RENAMED');
  });

  test('the nav indicator never points at a page that is not showing', async ({ phantom, page }) => {
    await phantom.boot();

    const r = await page.evaluate(() => {
      const victim = document.getElementById('pg-work');
      victim.id = 'pg-work-RENAMED';
      try {
        // Pass the Work tab element as tnEl — the old path cleared every indicator and then lit
        // THIS one, for a page that was never going to appear.
        showPage('work', document.getElementById('bn-work'));
      } finally { victim.id = 'pg-work'; }
      return {
        active: Array.from(document.querySelectorAll('.page.active')).map((p) => p.id),
        lit: Array.from(document.querySelectorAll('.botitem.active')).map((b) => b.id),
      };
    });

    expect(r.active, 'the app is not on exactly one page').toHaveLength(1);
    expect(r.active[0], 'the app moved off Command despite the destination being missing').toBe('pg-cmd');
    expect(r.lit,
      `⛔ the bottom nav lights ${JSON.stringify(r.lit)} while ${r.active[0]} is displayed. The ` +
      `indicator must agree with the screen.`).toEqual(['bn-command']);
  });

  test('invalid navigation in the supported UI mode lands on a real page, loudly', async ({ phantom, page }) => {
    await phantom.boot();

    const r = await page.evaluate(new Function('return ' + withWarns(`
      // 'triage' is a deleted legacy id. The .181 guard stands in front of showPage's own
      // validation and must route it into the redesign frame rather than anywhere blank.
      showPage('triage');
      return {
        warns: seen,
        active: Array.from(document.querySelectorAll('.page.active')).map((p) => p.id),
        lit: Array.from(document.querySelectorAll('.botitem.active')).map((b) => b.id),
      };
    `))());

    expect(r.active, 'a deleted legacy id left the app on no page at all').toHaveLength(1);
    expect(['pg-cmd', 'pg-work', 'pg-ref'],
      `landed on ${r.active[0]}, which is not a redesign frame page`).toContain(r.active[0]);
    expect(r.lit, 'the bottom nav does not agree with the page on screen').toHaveLength(1);
    expect(r.warns.some((w) => /showPage guard/.test(w)),
      `⛔ the redirect was silent — got ${JSON.stringify(r.warns)}`).toBe(true);
  });

  test('every surviving page id is reachable — no door points at a page that was deleted', async ({ phantom, page }) => {
    await phantom.boot();

    // The four ids the redesign guard whitelists must each have a page, or the guard hands a
    // dead id straight to the validation added by this ship. This is the check that would go red
    // the next time LEGACY-RETIRE deletes a page that something still routes to.
    const missing = await page.evaluate(() =>
      ['cmd', 'work', 'ref', 'master'].filter((id) => !document.getElementById('pg-' + id)));

    expect(missing,
      `⛔ the redesign guard whitelists ${JSON.stringify(missing)}, which no longer exist as pages`)
      .toEqual([]);
  });
});

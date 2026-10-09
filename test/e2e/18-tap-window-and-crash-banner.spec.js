// ─────────────────────────────────────────────────────────────────────────────
// 18 — THE 340ms TAP WINDOW (.416) AND THE CRASH BANNER (.406)
//
// BATCH-VERIFY items 11 and 14, automated. Neither depends on iOS hardware
// (owner ruling 2026-08-10, "the owner is not the test harness"): item 11 is a
// hit-testing question and item 14 is a console/DOM question, and a harness
// answers both better than a person can — a human cannot reliably tap inside a
// 340ms window, which is precisely why the defect survived to the field.
//
// ⚠ ITEMS 12, 13 AND 13a ARE NOT HERE ON PURPOSE — they were ALREADY automated and
// were being asked of the owner anyway:
//   12  (.422 staging)        → 14-master-staging: counts racks/hosts/cables from the
//                               candidate · staging does NOT make a candidate active ·
//                               "THE HARD GUARANTEE: discarding leaves the current site
//                               completely unchanged" · activateStaged is the ONLY way a
//                               candidate becomes active, and it binds the profile.
//   13  (.417–.421)           → 10-site-profile-root (identity, describe(), the divergence
//                               record), 11-event-log (chain verifies end to end — the
//                               deploy_verifyAuditChain read), 12-blockers (a pre-existing
//                               blocker is adopted, note intact — the PHANTOM_BLOCKERS.open
//                               read), 13-phase-model.
//   13a (.423 restore)        → 14-master-staging: "restore hands control back to the boot
//                               state machine instead of asking the operator to" and "a boot
//                               after a restored snapshot ends with memory and storage
//                               AGREEING".
// Asking a person to read those out of a console was duplicated work, not verification.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect, gotoMode } = require('./fixtures');

const OVERLAYS = ['detail-panel', 'picker', 'search-overlay'];

// ── Environment noise, PARTITIONED LOCALLY and REPORTED — never allowlisted ──────────────────
// The AI proxy probe (phantomCheckApi :50945, fired from init :18248) is CROSS-ORIGIN to a
// Cloudflare Worker that enforces an origin allowlist. On this runner WebKit surfaces the refusal
// as a pageerror. It is an environment difference between the runner and the field device, not an
// app fault — and 05-offline already reports it the same way rather than widening the shared
// BENIGN_CONSOLE list, because every entry added there weakens every spec in the suite.
// SAME-ORIGIN errors are never filtered: those are the ones that mean something.
const CROSS_ORIGIN_PROBE = /phantom-api[^\s]*\.workers\.dev|access control checks/i;
const partitionErrors = (all) => ({
  real: all.filter((m) => !CROSS_ORIGIN_PROBE.test(m)),
  crossOrigin: all.filter((m) => CROSS_ORIGIN_PROBE.test(m)),
});

/** Open the aisle through a real door and wait for the sheet. */
async function openAisle(page) {
  await page.evaluate(() => { try { forge3d_open(); } catch (_) {} });
  await page.waitForFunction(() => {
    const s = document.getElementById('forge3d-sheet');
    return !!s && s.classList.contains('open');
  }, null, { timeout: 20_000 });
}

/**
 * THE REAL QUESTION: is the button reachable by a TAP, not is it painted somewhere.
 * elementFromPoint at the button's own centre answers exactly what a finger would hit.
 */
const hitTest = (page, id) => page.evaluate((btnId) => {
  const el = document.getElementById(btnId);
  if (!el) return { present: false };
  const r = el.getBoundingClientRect();
  const x = Math.round(r.x + r.width / 2), y = Math.round(r.y + r.height / 2);
  const hit = document.elementFromPoint(x, y);
  return {
    present: true,
    box: { w: Math.round(r.width), h: Math.round(r.height) },
    pointerEvents: getComputedStyle(el).pointerEvents,
    hitsSelf: !!(hit && (hit === el || el.contains(hit))),
    hitTag: hit ? (hit.id || hit.className || hit.tagName) : null,
  };
}, id);

test.describe('the 340ms tap window and the crash banner', () => {

  test('AT REST the scene-utils buttons are real, tappable controls', async ({ phantom, page }) => {
    await phantom.boot();
    await openAisle(page);
    for (const id of ['loadoutBtn', 'searchBtn']) {
      const h = await hitTest(page, id);
      expect(h.present, `${id} is missing`).toBe(true);
      // A control that renders but cannot be tapped is a dead control. Both directions of that
      // rule are asserted in this file; this is the half that keeps the .416 fix from over-firing.
      expect(h.hitsSelf, `${id} is not tappable at rest — hit ${h.hitTag}`).toBe(true);
      expect(h.pointerEvents, `${id} is inert at rest`).not.toBe('none');
    }
  });

  test('THE TAP WINDOW: with an overlay open, the buttons are NOT tappable — for every overlay', async ({ phantom, page }) => {
    await phantom.boot();
    await openAisle(page);

    // Drive the SAME class the app's five call sites toggle (openDetail :20591, closeDetail,
    // openSearch, closeSearch, picker). The .416 fix is keyed on that class rather than on
    // geometry, and THAT is the property under test: a geometry-keyed guard is only correct once
    // the overlay has finished travelling, which is exactly the third of a second the defect
    // lived in. A human cannot reliably tap inside a 340ms window; this asserts the whole window.
    for (const cls of OVERLAYS) {
      const applied = await page.evaluate((c) => {
        const sheet = document.getElementById('forge3d-sheet');
        let el = sheet.querySelector('.' + c);
        if (!el) { el = document.createElement('div'); el.className = c; sheet.appendChild(el); el.dataset.e2eSynthetic = '1'; }
        el.classList.add('open');
        return !!el;
      }, cls);
      expect(applied, `could not open overlay .${cls}`).toBe(true);

      for (const id of ['loadoutBtn', 'searchBtn']) {
        const h = await hitTest(page, id);
        expect(h.pointerEvents, `.${cls} is open and ${id} is still hit-testable — the .416 rule did not fire`).toBe('none');
        expect(h.hitsSelf, `.${cls} is open and a tap at ${id} still reaches it (hit ${h.hitTag})`).toBe(false);
      }

      // AND IT MUST COME BACK. An inert control that stays inert is the defect wearing the
      // other hat — the cluster is only allowed to be dead while its overlay is on screen.
      // ⚠ A REAL overlay slides BACK over 340ms, so the recovery has to be polled, not sampled:
      // reading immediately measures the panel still physically covering the buttons and reports
      // a permanently dead control that is merely mid-animation. (Caught here on the first run.)
      await page.evaluate((c) => {
        const el = document.querySelector('#forge3d-sheet .' + c);
        if (!el) return;
        if (el.dataset.e2eSynthetic) el.remove(); else el.classList.remove('open');
      }, cls);
      for (const id of ['loadoutBtn', 'searchBtn']) {
        await expect
          .poll(async () => (await hitTest(page, id)).hitsSelf,
            { timeout: 5_000, message: `${id} stayed dead after .${cls} closed — the cluster never recovered` })
          .toBe(true);
      }
    }
  });

  test('the guard is GEOMETRY-INDEPENDENT — it holds even with the overlay parked off-screen', async ({ phantom, page }) => {
    await phantom.boot();
    await openAisle(page);
    // The .416 defect in one assertion: the panel SLIDES, and mid-slide its own box is not yet
    // over these buttons. Parking the overlay far off-screen reproduces "open but not covering",
    // which is what every frame of that transition looks like.
    await page.evaluate(() => {
      const sheet = document.getElementById('forge3d-sheet');
      const el = document.createElement('div');
      el.className = 'detail-panel open';
      el.dataset.e2eSynthetic = '1';
      el.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px';
      sheet.appendChild(el);
    });
    for (const id of ['loadoutBtn', 'searchBtn']) {
      const h = await hitTest(page, id);
      expect(h.hitsSelf,
        `${id} was tappable while a detail panel was OPEN but not yet covering it — this is the ` +
        'exact 340ms window .416 closed, and a stacking-order fix would not survive it').toBe(false);
    }
  });

  test('ITEM 14 — a normal session raises NO crash banner', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e && e.message)));

    await phantom.boot();
    const banner = () => page.evaluate(() => {
      const b = document.getElementById('crash-banner');
      return { display: b ? getComputedStyle(b).display : 'absent', text: b ? (b.textContent || '').trim().slice(0, 120) : '' };
    });

    expect((await banner()).display, 'a crash banner was up on a FRESH boot').toBe('none');

    // Walk the app the way a shift does: Build, the aisle, out to Tools, back again.
    await gotoMode(page, 'work');
    await page.waitForTimeout(1200);
    await openAisle(page);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { try { forge3d_close(); } catch (_) {} });
    await page.waitForTimeout(800);
    await gotoMode(page, 'ref');
    await page.waitForTimeout(800);
    await gotoMode(page, 'work');
    await page.waitForTimeout(1200);

    const after = await banner();
    // The banner is the app's own verdict on itself. .406 exists because lifecycle TRACE entries
    // were reaching it, so a completely healthy Open Aisle raised "JS ERROR" — the instrument
    // accusing the app of a fault it did not have.
    expect(after.display, `a healthy session raised the crash banner: "${after.text}"`).toBe('none');
    const p1 = partitionErrors(pageErrors);
    if (p1.crossOrigin.length) console.log('[18] ' + p1.crossOrigin.length + ' cross-origin AI-proxy probe error(s) filtered and reported, not allowlisted.');
    expect(p1.real, `same-origin uncaught errors during a normal session: ${JSON.stringify(p1.real)}`).toEqual([]);
  });

  // ⛔ REWRITTEN v1.14.553 (Stage 7a): there is no legacy half any more. The value of this walk is
  // now that the INERT ?legacy=1 URL — still on fielded devices, bookmarks and home-screen shortcuts
  // — boots the redesign and raises nothing. A URL that used to switch houses must not now throw.
  test('ITEM 14, inert URL — ?legacy=1 walks clean with no uncaught errors', async ({ phantom, page }) => {
    test.setTimeout(120_000);
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(String(e && e.message)));

    await phantom.boot({ query: '?legacy=1' });
    expect(await phantom.isRedesign(), '?legacy=1 suppressed body.rd — the switch is back').toBe(true);
    await page.waitForTimeout(2500);

    // ⚠ The banner MUTATION is redesign-gated (:18075) so legacy stays byte-identical, which is
    // why this half asserts uncaught errors rather than the banner. Asserting the banner here
    // would be asserting a thing the legacy house deliberately never does.
    const p2 = partitionErrors(pageErrors);
    if (p2.crossOrigin.length) console.log('[18] legacy: ' + p2.crossOrigin.length + ' cross-origin AI-proxy probe error(s) filtered and reported.');
    expect(p2.real, `same-origin uncaught errors in the legacy house: ${JSON.stringify(p2.real)}`).toEqual([]);
  });
});

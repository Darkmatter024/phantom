// Bottom nav + routing.
//
// Every selector, class and function name below was read out of dct-ios.html, not guessed:
//   #rd-botnav markup ...................... :16030-16051
//   #bn-rail / .botitem ..................... :16610-16630
//   #rd-exit (hold-to-exit, NOT a tab) ...... :16046-16050, wiring rd_initExit :18751
//   showMode() .............................. :18786  (map {command:'cmd', work:'work', ref:'ref'})
//   showPage() adds .active to #pg-<id> ..... :22558-22569
//   nav_push()/popstate/history ............. :18443, :18602, :18610
//   redesign_initToggle adds body.rd ........ :18888-18903
//   #bn-core retired outright (v1.14.563) ... gone
//   body.rd.mode-ref .search-wrap ........... :9619  (the ONLY body.mode-* class in the file)
//   #rd-botnav{display:none} base ........... :9564   / body.rd #rd-botnav{display:grid} :9653
//   body.rd .tab-nav{display:none} .......... :9607
//
// LOCAL HELPERS ONLY — fixtures.js is shared and was not touched.

const { test, expect, gotoMode, railIsUp } = require('./fixtures');

// ── local helpers (declared here on purpose; fixtures.js is shared and off-limits) ──

const PAGES = { command: 'pg-cmd', work: 'pg-work', ref: 'pg-ref' };
const SLOTS = { command: 'bn-command', work: 'bn-work', ref: 'bn-ref' };

/** Tap the NAVIGATION DOOR for a mode. click() (not tap()) so the same spec runs on non-touch
 *  projects. v1.14.412: below 1024 that door is the bottom-nav slot; at 1024 and up the
 *  desktop shell replaces the bottom nav with a left rail, and gotoMode() picks whichever
 *  organ is actually on screen. The ROUTING tests below are about showMode() landing on the
 *  right page — they are not about which organ was tapped, so they must run at every tier.
 *  The tests that ARE about the bottom nav as an object guard with needsBottomNav(). */
async function tapSlot(page, mode) {
  await gotoMode(page, mode);
}

/** Skip when the bottom nav is not the composed navigation organ at this tier. */
async function needsBottomNav(page) {
  const rail = await railIsUp(page);
  test.skip(rail, 'the desktop shell composes a left rail at this width; the bottom nav is a phone/tablet organ and is not on screen here');
}

/** Which of the three redesign pages currently carry .active. Truth, not a guess. */
function activePages(page) {
  return page.evaluate((ids) =>
    Object.entries(ids)
      .filter(([, id]) => {
        const el = document.getElementById(id);
        return !!el && el.classList.contains('active');
      })
      .map(([mode]) => mode), PAGES);
}

/** Which of the three nav slots currently carry .botitem.active. */
function activeSlots(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('#rd-botnav .botitem.active')).map((el) => el.id));
}

/** Every body class that starts with mode-. showMode only ever sets one of these (:18831). */
function modeClasses(page) {
  return page.evaluate(() =>
    Array.from(document.body.classList).filter((c) => c.indexOf('mode-') === 0));
}

test.describe('bottom nav — structure', () => {
  // ── PINS THE PRE-M4 NAV. THIS IS A CHECKPOINT, NOT A SPECIFICATION. ──────────────
  // The shipped nav is three slots plus EXIT. The APPROVED nav is five slots and no
  // EXIT: Command · Build · Scan · Tools · Shift (owner ruling R-02, blueprint §3.4),
  // delivered at M4. So this test is currently green against a state the product has
  // already ruled against — it exists to catch DRIFT before M4, not to defend 3+EXIT.
  //
  // It is deliberately NOT a test.fail(): the current nav is correct FOR NOW, and
  // marking it as a defect would make the baseline lie in the other direction.
  //
  // WHEN M4 LANDS this test must be rewritten, not deleted — to five slots, no EXIT,
  // and with hold-to-freeze re-homed inside Shift rather than removed (R-02a).
  // Scan and Shift are BOTH absent today; the nav is two pillars short, not one.
  // Full reasoning: PHANTOM_CURRENT_STATE.md, defect D-1.
  // ────────────────────────────────────────────────────────────────────────────────
  // ⛔ REWRITTEN v1.14.588, WHICH IS WHAT THIS BLOCK'S OWN HEADER INSTRUCTED. It said the shape
  // must be "rewritten, not deleted" when the nav changes. INTEL-DOCK Ship 1 changed it — but NOT
  // to the M4 five-pillar shape the header anticipated. Owner ruling 2026-09-10 chose Option A:
  // FOUR slots, COMMAND / BUILD / TOOLS / GHOST, with EXIT (hold) re-homed to the last row of SYS.
  // Option B (five slots, SHIFT restored) was REJECTED because three of SHIFT's nine questions
  // still have no data source — D-1 stands, and the nav is still short of the approved M4 IA.
  // ⭐ So this remains a CHECKPOINT, NOT A SPECIFICATION, exactly as before: it catches drift
  // between here and M4, and at M4 it gets rewritten again. A8's own words cover the change —
  // "removing that slot removes the slot, not the feature".
  test('the nav pins the post-INTEL-DOCK shape: four slots ending in the ghost, EXIT re-homed', async ({ phantom, page }) => {
    await phantom.boot();

    const census = await page.evaluate(() => ({
      items: Array.from(document.querySelectorAll('#rd-botnav .botitem')).map((el) => ({
        id: el.id,
        label: (el.querySelector('.blabel') || {}).textContent || '',
        onclick: el.getAttribute('onclick') || '',
      })),
      exit: !!document.getElementById('rd-exit'),
      exitInDock: !!document.querySelector('#rd-botnav #rd-exit'),
      exitIsBotitem: !!document.querySelector('#rd-exit.botitem'),
    }));

    expect(census.items.map((i) => i.id)).toEqual(['bn-command', 'bn-work', 'bn-ref', 'bn-ghost']);
    expect(census.items.map((i) => i.label)).toEqual(['Command', 'Build', 'Tools', 'Assist']);
    expect(census.items.map((i) => i.onclick)).toEqual([
      "showMode('command')", "showMode('work')", "showMode('ref')", "openVaSheet('intent')",
    ]);
    // EXIT MOVED — it must still EXIST. Deleting it would remove hold-to-freeze entirely, which is
    // a feature, not a slot. Its new home is pinned in 55-intel-dock.spec.js.
    expect(census.exit, '#rd-exit vanished — the control must move, never be deleted').toBe(true);
    expect(census.exitInDock, '#rd-exit is still in the dock — the ghost cannot have its cell').toBe(false);
    // Still never a landable tab, wherever it lives.
    expect(census.exitIsBotitem, '#rd-exit must never be a .botitem').toBe(false);
  });

  test('every nav control meets the 44px gloved-hand minimum', async ({ phantom, page }) => {
    await phantom.boot();
    await needsBottomNav(page);

    // ⛔ v1.14.588 — 'rd-exit' LEFT THIS LIST because it left the dock, not because its floor
    // stopped mattering. It is now a SYS row, measured inside an open panel by
    // 55-intel-dock.spec.js; measuring it here would measure a closed popover and report 0x0.
    const rects = await page.evaluate(() =>
      ['bn-command', 'bn-work', 'bn-ref', 'bn-ghost'].map((id) => {
        const el = document.getElementById(id);
        const r = el.getBoundingClientRect();
        return { id, w: Math.round(r.width), h: Math.round(r.height) };
      }));

    for (const r of rects) {
      expect(r.w, `${r.id} width ${r.w}px < 44px touch minimum`).toBeGreaterThanOrEqual(44);
      expect(r.h, `${r.id} height ${r.h}px < 44px touch minimum`).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('bottom nav — routing', () => {
  test('each slot activates its own page and deactivates the other two', async ({ phantom, page }) => {
    await phantom.boot();

    // redesign_initToggle lands on Command (:18899).
    await expect.poll(() => activePages(page)).toEqual(['command']);

    for (const mode of ['work', 'ref', 'command', 'ref', 'work']) {
      await tapSlot(page, mode);
      await expect
        .poll(() => activePages(page), { message: `tapping ${SLOTS[mode]} did not leave exactly ${PAGES[mode]} active` })
        .toEqual([mode]);
    }
  });

  test('.botitem.active mirrors the visible page', async ({ phantom, page }) => {
    await phantom.boot();
    await expect.poll(() => activeSlots(page)).toEqual(['bn-command']);

    for (const mode of ['work', 'ref', 'command']) {
      await tapSlot(page, mode);
      await expect
        .poll(() => activeSlots(page), { message: `nav highlight did not follow to ${mode}` })
        .toEqual([SLOTS[mode]]);
      // The highlight and the page must never disagree — but they do not land in the SAME FRAME,
      // and this read used to assume they did. ⛔ MEASURED at both `.556` and `.562`, identically:
      // the nav highlight is synchronous (correct at +0ms) while the page's .active class lands
      // between +150ms and +400ms. Reading activePages without polling caught the app mid-swap and
      // reported `command` when the tech had tapped BUILD. THE APP WAS CORRECT AND SETTLED; the
      // test was racing it, which is why the sibling routing test above — which polls — passes on
      // the same code. ⭐ Poll for CONVERGENCE, then assert. The invariant is unchanged: the two
      // must agree once the swap completes, and a genuine disagreement still fails here.
      await expect
        .poll(() => activePages(page), { message: `the page never became ${mode} while the nav said it had` })
        .toEqual([mode]);
      // And they must still agree AFTER settling — a highlight that drifts back is a real defect.
      expect(await activeSlots(page), `the highlight left ${SLOTS[mode]} after the page settled`).toEqual([SLOTS[mode]]);
    }
  });

  test('#bn-core is gone, and the nav still resolves to exactly four grid items', async ({ phantom, page }) => {
    await phantom.boot();
    await needsBottomNav(page);

    // v1.14.563 retired the last of the .159 reactor rail: the <span id="bn-core">, its
    // #bn-core{display:none} rule, and showMode's dead `left = index * 33.333%` write. The
    // predecessor of this test asserted that dead write still tracked the active slot, with an
    // honest note that it painted nothing. There is nothing left to track.
    const present = await page.evaluate(() => !!document.getElementById('bn-core'));
    expect(present, '#bn-core was retired at .563 — if it is back, the dead thirds-math write probably came back with it').toBe(false);

    // ⚠ WHY THE SECOND ASSERTION EXISTS. #bn-rail is display:contents, so its children are
    // promoted into #rd-botnav's grid-template-columns:repeat(4,1fr). #bn-core stayed out of
    // that count ONLY because it was display:none — the rule was load-bearing while the span
    // existed, and removing the rule alone would have made it a fifth grid item and collapsed
    // the nav. This pins the count so that class of mistake fails loudly instead of visually.
    const cells = await page.evaluate(() =>
      Array.from(document.getElementById('rd-botnav').children)
        .flatMap((el) => (getComputedStyle(el).display === 'contents' ? Array.from(el.children) : [el]))
        .filter((el) => getComputedStyle(el).display !== 'none').length);
    expect(cells, '#rd-botnav must resolve to exactly four grid items').toBe(4);
  });

  test('body.mode-ref is set on Tools only — it is the sole mode-* class the app owns', async ({ phantom, page }) => {
    await phantom.boot();

    // :18831 toggles ONLY mode-ref (it gates .search-wrap, :9619). There is no
    // mode-command / mode-work class anywhere in the file — verified by grep, asserted here.
    expect(await modeClasses(page), 'Command should carry no mode-* class').toEqual([]);

    await tapSlot(page, 'work');
    await expect.poll(() => modeClasses(page), { message: 'Build should carry no mode-* class' }).toEqual([]);

    await tapSlot(page, 'ref');
    await expect.poll(() => modeClasses(page), { message: 'Tools must set body.mode-ref' }).toEqual(['mode-ref']);

    await tapSlot(page, 'command');
    await expect.poll(() => modeClasses(page), { message: 'leaving Tools must clear body.mode-ref' }).toEqual([]);
  });

  test('cycling all three slots raises no console error and no uncaught exception', async ({ phantom, page }) => {
    // ── Two PLATFORM artifacts fire at BOOT (before any nav tap) and are tolerated here,
    // locally and by named cause. fixtures.js BENIGN_CONSOLE was NOT touched.
    //
    // 1) The boot pipeline pings the Cloudflare Worker for AI reachability
    //    (:18248 -> phantomCheckApi :50947). That Worker enforces an Origin allowlist
    //    (:17655) and answers http://127.0.0.1:4317 with a 204 carrying no
    //    Access-Control-Allow-Origin. WebKit emits THREE entries for that one request
    //    (2 console errors + a stack-less 'pageerror' — verified by probe: empty stack,
    //    WebKit network text, not a JS throw); Chromium emits a bare
    //    "Failed to load resource: net::ERR_FAILED" that names no host. The app itself is
    //    correct: .catch (:50952) paints an honest verdict. The generic Chromium string is
    //    only tolerated once the requestfailed census below proves the ONLY failed request
    //    in the whole run was that one third-party host.
    // 2) Chromium-only: haptic() (:16397) calls navigator.vibrate, and redesign_initToggle
    //    -> showMode('command') -> showPage -> haptic(4) (:22617) runs at DOMContentLoaded,
    //    before any user gesture, so Chromium refuses it with a console error. iOS Safari
    //    has NO navigator.vibrate, so haptic() short-circuits and the field platform never
    //    sees this. Zero occurrences on phone-webkit.
    const BOOT_PLATFORM_NOISE = [
      /phantom-api\.wfj6t2fk7w\.workers\.dev/i,
      /Access-Control-Allow-Origin/i,
      /Failed to load resource: net::ERR_FAILED/i,
      /Blocked call to navigator\.vibrate/i,
    ];

    // Network census — attached before boot so nothing is missed. This is what makes the
    // generic ERR_FAILED string above safe to tolerate.
    const failedRequests = [];
    page.on('requestfailed', (r) => failedRequests.push(r.url()));

    await phantom.boot();

    // Wait on the probe's own observable end state instead of a sleep, so that noise lands
    // before the nav cycle rather than in the middle of it.
    await expect
      .poll(() => page.locator('#hs-api-val').textContent(),
        { message: 'the boot API-reachability probe never reported a verdict' })
      .not.toMatch(/^(—|CHECKING)$/);

    for (const mode of ['work', 'ref', 'command', 'work', 'ref']) {
      await tapSlot(page, mode);
      await expect.poll(() => activePages(page)).toEqual([mode]);
    }

    const unexpectedRequests = failedRequests.filter((u) => !/phantom-api\.wfj6t2fk7w\.workers\.dev/i.test(u));
    expect(unexpectedRequests, `requests failed that are not the origin-gated AI proxy:\n  ${unexpectedRequests.join('\n  ')}`).toEqual([]);

    const unexplained = phantom.hardErrors().filter((e) => !BOOT_PLATFORM_NOISE.some((re) => re.test(e.text)));
    expect(unexplained, `console errors while navigating:\n${unexplained.map((e) => `  [${e.type}] ${e.text}`).join('\n')}`).toEqual([]);
  });

  test('none of the three pages overflows the viewport horizontally', async ({ phantom, page }) => {
    await phantom.boot();
    for (const mode of ['command', 'work', 'ref']) {
      await tapSlot(page, mode);
      await expect.poll(() => activePages(page)).toEqual([mode]);
      await phantom.assertNoHorizontalOverflow();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// v1.14.562 — THE NAV BLOCKER BADGE. Addendum A3. The desktop shell has carried this count
// since .383 (#cs-tnotif/.cs-tbadge); the phone nav never did, so the number a technician most
// needs was visible only on the composition they are NOT holding in an aisle.
// ⭐ THE TAP-TARGET ASSERTION IS THE LOAD-BEARING ONE. A badge pinned over a nav item is a
// classic way to eat the tap it decorates, and this app's whole Cold Aisle Filter is about
// gloved hands hitting what they aim at. pointer-events:none is the fix; this pins it.
// ─────────────────────────────────────────────────────────────────────────────
test.describe('nav blocker badge', () => {
  const readBadge = (page) => page.evaluate(() => {
    const b = document.getElementById('bn-work-n');
    const item = document.getElementById('bn-work');
    if (!b || !item) return { present: false };
    const cs = getComputedStyle(b);
    const r = b.getBoundingClientRect(), ir = item.getBoundingClientRect();
    return { present: true, text: b.textContent.trim(), display: cs.display,
      pointerEvents: cs.pointerEvents, shown: cs.display !== 'none' && r.width > 0,
      hasClass: item.classList.contains('has'),
      inside: r.left >= ir.left - 2 && r.right <= ir.right + 2 };
  });

  test('⛔ it is HIDDEN at zero — an always-on badge is a lie about the shift', async ({ phantom, page }) => {
    await phantom.boot();
    await page.waitForTimeout(1000);
    const b = await readBadge(page);
    expect(b.present, 'the nav badge node is gone from #bn-work').toBe(true);
    expect(b.shown, `the badge shows with no blockers (text="${b.text}") — Contract B10, do not label absent trouble`).toBe(false);
  });

  test('⛔ it NEVER eats the tap it decorates — Cold Aisle floor', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => {
      const i = document.getElementById('bn-work'), n = document.getElementById('bn-work-n');
      if (i && n) { n.textContent = '3'; i.classList.add('has'); }
    });
    await page.waitForTimeout(300);
    const b = await readBadge(page);
    expect(b.shown, 'the badge did not appear when blockers exist').toBe(true);
    expect(b.inside, 'the badge renders outside its nav item — it will overlap a neighbour').toBe(true);
    expect(b.pointerEvents, 'the badge accepts pointer events and can swallow a BUILD tap').toBe('none');
    const hit = await page.evaluate(() => {
      const i = document.getElementById('bn-work');
      const r = i.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { h: Math.round(r.height), hitsItem: !!el && (el === i || i.contains(el)) };
    });
    expect(hit.hitsItem, 'a centre tap on BUILD no longer lands on BUILD').toBe(true);
    expect(hit.h, `BUILD is ${hit.h}px tall — under the 44px gloved floor`).toBeGreaterThanOrEqual(44);
  });
});

test.describe('browser back', () => {
  // ⛔ KNOWN DEFECT H1 — showMode() sets _navInternalCall = true around its showPage()
  // call (:18810-18811), and nav_push() early-returns on that flag (:18444). So a
  // bottom-nav tap pushes NOTHING to history. The only history write in the whole boot
  // path is the seed replaceState({p:'triage', root:true}) at :18610, which REPLACES
  // rather than pushes.
  //
  // MEASURED on phone-webkit, not inferred:
  //   history.length before nav taps = 2 · after Home->Build->Tools = 2  (nothing pushed)
  //   page.goBack() after those taps => url becomes about:blank — the app is GONE, not
  //   stepped back one destination.
  // Field consequence: one iOS edge-swipe-back from Tools drops a technician out of
  // PHANTOM mid-shift; there is no in-app way back, only a relaunch.
  //
  // The assertions below state the CORRECT behaviour, so this test turns green — and the
  // .fail() annotation turns red — the day H1 is fixed. The history-length assertion is
  // deliberately FIRST so the expected failure fires before goBack() can strand the page.
  test.fail();
  test('back after nav taps returns to the previous destination', async ({ phantom, page }) => {
    await phantom.boot();

    const before = await page.evaluate(() => history.length);

    await tapSlot(page, 'work');
    await expect.poll(() => activePages(page)).toEqual(['work']);
    await tapSlot(page, 'ref');
    await expect.poll(() => activePages(page)).toEqual(['ref']);

    const after = await page.evaluate(() => history.length);
    expect(after, `nav taps pushed no history entries (length stayed ${before}) — showMode suppresses nav_push at :18810`)
      .toBeGreaterThan(before);

    await page.goBack();
    expect(await activePages(page), 'back from Tools should land on Build').toEqual(['work']);
  });
});

test.describe('house selection', () => {
  test('a bare URL boots the redesign house with the 3-slot nav visible', async ({ phantom, page }) => {
    await phantom.boot();
    await needsBottomNav(page);

    expect(await phantom.isRedesign(), 'bare URL must boot body.rd (default since v1.14.101)').toBe(true);
    await expect(page.locator('#rd-botnav')).toBeVisible();
    // ⛔ v1.14.554: this asserted the legacy 5-tab nav was HIDDEN. It is now DELETED, and
    // toBeHidden() passes for an element that does not exist — a vacuous assertion that would keep
    // passing if the nav came back and were merely display:none. Assert absence instead.
    await expect(page.locator('.tab-nav')).toHaveCount(0);
    expect(await activePages(page)).toEqual(['command']);
  });

  // ⛔ REWRITTEN v1.14.553 (LEGACY-RETIRE Stage 7a). These two pinned the rip-cord: that ?legacy=1
  // booted a second house, and that the choice survived a reload. The switch is deleted, so both
  // behaviours are gone BY DESIGN. What needs pinning now is the opposite, and it matters more:
  // the URL is INERT. Fielded devices, bookmarks and saved home-screen shortcuts still carry
  // ?legacy=1, and every one of them must land in the redesign rather than on an empty shell.
  test('?legacy=1 is INERT — the redesign loads anyway', async ({ phantom, page }) => {
    await phantom.boot({ query: '?legacy=1' });
    await needsBottomNav(page);   // the desktop shell swaps the bottom nav for a rail at >=1024

    expect(await phantom.isRedesign(), '?legacy=1 still suppresses body.rd — the switch is back').toBe(true);
    await expect(page.locator('#rd-botnav')).toBeVisible();
    expect(await activePages(page)).toEqual(['command']);

    // And it must not persist. redesign_isOn() clears the flag from BOTH storages on boot, so a
    // device that pinned it under .465/.468 comes home by itself instead of needing a magic URL.
    expect(await page.evaluate(() => sessionStorage.getItem('phantom_legacy')), 'the opt-out was persisted again').toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('phantom_legacy')), 'a stale localStorage flag survived boot').toBeNull();
  });

  test('?legacy=1 does not stick across a reload', async ({ phantom, page }) => {
    await phantom.boot({ query: '?legacy=1' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#pe-tapcatch').click({ force: true });
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return !!app && app.classList.contains('visible');
    }, undefined, { timeout: 25_000 });

    expect(await phantom.isRedesign(), 'a reload resurrected the legacy house').toBe(true);
  });
});

// ⛔ v1.14.588 — EXIT MOVED OUT OF THE DOCK INTO SYS (INTEL-DOCK Ship 1, owner ruling 2026-09-10),
// so these two tests have to OPEN the panel before they can reach it. Nothing about what they
// assert changed: the gesture is still hold-only and the hold still freezes. Only the reach moved.
// The real user path is the SYS pill; hdr_aggToggle is its handler, so it is called directly rather
// than hunting a pill whose label changes with health state (SYS / OFFLINE / STORAGE n%).
async function openSysPanel(page) {
  await page.evaluate(() => {
    try { if (typeof hdr_aggToggle === 'function') hdr_aggToggle(); } catch (_) { /* fall through */ }
    const p = document.getElementById('hdr-agg-panel');
    if (p && getComputedStyle(p).display === 'none') p.style.display = 'block';
  });
  await page.locator('#rd-exit').waitFor({ state: 'visible', timeout: 5_000 });
}

test.describe('#rd-exit is hold-only', () => {
  test('a plain tap on EXIT does not navigate and does not freeze', async ({ phantom, page }) => {
    await phantom.boot();
    await needsBottomNav(page);
    await tapSlot(page, 'work');
    await expect.poll(() => activePages(page)).toEqual(['work']);
    await openSysPanel(page);

    await page.locator('#rd-exit').click();

    // Nothing moved: same page, same highlight, EXIT never becomes a tab.
    expect(await activePages(page), 'a tap on EXIT navigated').toEqual(['work']);
    expect(await activeSlots(page), 'a tap on EXIT stole the nav highlight').toEqual(['bn-work']);

    const state = await page.evaluate(() => ({
      curtainUp: document.getElementById('rd-freeze-curtain').classList.contains('up'),
      arming: document.getElementById('rd-exit').classList.contains('arming'),
      freezeMark: localStorage.getItem('phantom_freeze_v1'),
    }));
    expect(state.curtainUp, 'a plain tap raised the freeze curtain — the hold gate failed open').toBe(false);
    expect(state.arming, '#rd-exit stayed armed after a quick release').toBe(false);
    expect(state.freezeMark, 'a plain tap wrote the freeze marker').toBeNull();
  });

  test('holding EXIT past RD_HOLD_MS freezes to the sleep curtain', async ({ phantom, page }) => {
    await phantom.boot();
    await needsBottomNav(page);
    await openSysPanel(page);

    // rd_holdGesture (:18721) arms on mousedown/touchstart and fires after RD_HOLD_MS
    // (850ms, :18720). No sleep: press, then poll the observable end state.
    const box = await page.locator('#rd-exit').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    try {
      await expect
        .poll(() => page.evaluate(() => document.getElementById('rd-freeze-curtain').classList.contains('up')),
          { message: 'holding EXIT never raised the freeze curtain', timeout: 5_000 })
        .toBe(true);
    } finally {
      await page.mouse.up();
    }

    // rd_freeze (:18740) stamps the VIEW to return to, never the data.
    const mark = await page.evaluate(() => JSON.parse(localStorage.getItem('phantom_freeze_v1') || 'null'));
    expect(mark && mark.mode, 'freeze marker must record the mode to return to').toBe('command');
  });
});

// ═══════════════════════════════════════
// showPage — a missing page must never blank the app (v1.14.548)
// ═══════════════════════════════════════
//
// ⛔ THE SHAPE THIS PINS. showPage deactivates EVERY .page and EVERY .tn-item before it activates
// the target. The activation was a bare `if (target)` with no else, so an id with no page left the
// app on NO ACTIVE PAGE AT ALL — a blank screen, silently. LEGACY-RETIRE made that reachable: each
// Stage 6 ship deletes a legacy page while doors to it survive in legacy chrome and in the search
// index, which routes by page id when redesign_isOn() is false.
test.describe('showPage — a missing page never blanks the app', () => {

  test('an unknown page id leaves exactly one page active', async ({ phantom, page }) => {
    await phantom.boot();

    // ⛔ MUST navigate AWAY from the home page first. Landing on pg-cmd is the FIX's behaviour,
    // but it is also the boot default — asserting it from a standing start passes even when the
    // fallback is deleted. Proven: a first cut of these tests stayed green with it neutered.
    // ⚠ v1.14.553: this used showPage('sop'), but 'sop' is a LEGACY id — the guard redirects it to
    // showWorkTab and returns BEFORE the page swap, so it never moved the active page. 'work' is a
    // redesign id and actually navigates.
    await page.evaluate(() => showPage('work'));
    await expect.poll(async () => await page.evaluate(() => {
      const a = document.querySelector('.page.active'); return a ? a.id : null;
    }), { message: 'never navigated to pg-work', timeout: 8_000 }).toBe('pg-work');

    // ⚠ _pageSwitch runs inside document.startViewTransition, so the swap is ASYNC. A synchronous
    // read after showPage() sees the PREVIOUS page still active. Poll, never read once.
    await page.evaluate(() => showPage('definitely-not-a-page'));
    await expect.poll(async () => await page.evaluate(() => {
      const a = document.querySelectorAll('.page.active');
      return a.length === 1 ? a[0].id : ('count=' + a.length);
    }), { message: 'showPage left the app blank (count=0) or on the wrong page', timeout: 8_000 })
      .toBe('pg-cmd');
  });

  test('a page deleted by LEGACY-RETIRE routes somewhere real, not nowhere', async ({ phantom, page }) => {
    await phantom.boot();
    expect(await page.evaluate(() => !document.getElementById('pg-cli')),
      'pg-cli is back — v1.14.547 deleted it').toBe(true);

    await page.evaluate(() => showPage('work'));
    await expect.poll(async () => await page.evaluate(() => {
      const a = document.querySelector('.page.active'); return a ? a.id : null;
    }), { message: 'never navigated to pg-work', timeout: 8_000 }).toBe('pg-work');

    // 'cli' had a real page until v1.14.547 decoupled it; legacy doors to it still exist.
    await page.evaluate(() => showPage('cli'));
    await expect.poll(async () => await page.evaluate(() => {
      const a = document.querySelectorAll('.page.active');
      return a.length === 1 ? a[0].id : ('count=' + a.length);
    }), { message: 'a decoupled page id blanked the app', timeout: 8_000 }).toBe('pg-ref');
    // ⭐ pg-ref, NOT the pg-cmd fallback, and that is the better outcome: showPage's guard
    // recognises 'cli' as a legacy id with a redesign home and redirects to showRefTab('rf-cli')
    // before the missing-page path is ever reached. The .548 fallback is the net under that, for
    // ids with no home at all — which the sibling test above exercises. Both matter: this one
    // proves a decoupled surface still ROUTES, that one proves an unknown id never blanks.
  });

  test('the redesign lands on its OWN home, never pg-triage', async ({ phantom, page }) => {
    await phantom.boot();
    // Under body.rd the upstream guard redirects legacy ids, so this exercises the fallback
    // directly. It must never activate the legacy NOW dashboard inside the redesign frame.
    await page.evaluate(() => showPage('definitely-not-a-page'));
    // Give the view transition the same room the legacy cases get, then assert the house rule.
    await expect.poll(async () => await page.evaluate(() => {
      const a = document.querySelectorAll('.page.active');
      return a.length === 1 ? a[0].id : ('count=' + a.length);
    }), { message: 'the redesign was left blank by an unknown page id', timeout: 8_000 })
      .toBe('pg-cmd');

    expect(await page.evaluate(() => {
      const t = document.getElementById('pg-triage');
      return !!(t && t.classList.contains('active'));
    }), 'the redesign activated the legacy pg-triage — house leak').toBe(false);
  });

});

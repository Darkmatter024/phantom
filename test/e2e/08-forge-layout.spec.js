// ─────────────────────────────────────────────────────────────────────────────
// 08 — THE FORGE BOTTOM CONTROL STACK (v1.14.407)
//
// WHY THIS SPEC EXISTS
// The bottom stack of #forge3d-sheet shipped with its geometry undeclared. .hudbtn
// (:9125 today) carried a width and NO height, so both utility buttons were sized by
// align-items:stretch off a SIBLING — the pill strip. With no Master the strip is
// empty, so there was nothing to stretch against and the two buttons measured
// 46 x 24.5, against the app's own published 44px gloved floor (--tap-s, :150).
// Populated they measured 46 x 35. Neither cleared the floor, and NOTHING in the
// suite would have said so, because the row rendered, painted and looked plausible.
//
// Alongside it: .chips declared overflow-x only, and css-overflow-3 blockifies the
// omitted axis, so the scroller clipped VERTICALLY without saying so and amputated
// the active pill's glow; and .hint was pinned to the viewport at a hard-coded
// `bottom: calc(safe + 92px)` describing the height of a strip that declared no
// height, so a fourth layer was drawn INTO the control row.
//
// WHAT THIS SPEC PINS — the shape of the fix, not its pixel values:
//   1. every control in the row consumes the tap token as its OWN height, in every
//      chip state INCLUDING EMPTY (the state that collapsed);
//   2. the three layers — pill strip, utility buttons, status row — never intersect;
//   3. .chips declares its clip on both axes and reserves the glow's own room INSIDE
//      that clip, derived from the same token that draws the glow;
//   4. the hint's clearance is STRUCTURAL: the stack is GROWN at runtime, twice, by
//      two different mechanisms, and the gap must hold. A constant cannot survive
//      that test. This is the repo's own durable rule (v1.14.341 --tabnav-h,
//      v1.14.351 phase dock) made enforceable instead of remembered.
//
// WHAT IT CANNOT PIN — stated, never faked:
//   env(safe-area-inset-bottom) resolves to 0.00px on WebKit-for-Windows, so real
//   iPhone home-indicator clearance is verified by NOTHING here (see the last test,
//   which skips with that reason rather than asserting a proxy and calling it proof).
//   backdrop-filter compositing and iOS momentum scrolling also differ. The physical
//   iPhone gate still owns all three.
//
// TIER AWARENESS
// Runs on phone-webkit (390x844) and tablet-webkit (834x1194). Nothing branches on a
// hard-coded breakpoint: whether the five-pill loadout fits is MEASURED
// (scrollWidth vs clientWidth) and the tier-appropriate invariant is asserted from
// that measurement.
//
// LOCAL HELPERS ONLY. fixtures.js and playwright.config.js are shared and were not
// touched; nothing was added to BENIGN_CONSOLE.
// ─────────────────────────────────────────────────────────────────────────────

const { test, expect } = require('./fixtures');

// ── The door ─────────────────────────────────────────────────────────────────
// forge3d_open() (:19238) is a top-level declaration and therefore a real global;
// it is also what the Build workspace's "Open aisle" button calls. The BUTTON door
// itself is already pinned by 02-build-forge ("the aisle opens over Build and
// closing it returns to Build with #bw-mount intact"), so this spec opens through
// the global and spends its boots on geometry instead of re-testing that door. The
// CLOSE side still goes through the real control (.rd-sheet-close, onclick at
// :13172) so a dead close button fails here too.
async function openAisle(page) {
  const isRd = await page.evaluate(() => document.body.classList.contains('rd'));
  expect(isRd, '#forge3d-sheet is body.rd-gated (:9040); this surface does not exist without it').toBe(true);

  await page.evaluate(() => {
    if (typeof window.forge3d_open !== 'function') throw new Error('forge3d_open is not a global — the aisle has no door');
    window.forge3d_open();
  });
  await page.waitForSelector('#forge3d-sheet.open', { timeout: 20_000 });
  await expect(page.locator('#forge3d-sheet')).toBeVisible();
  await settle(page);
}

/** Two frames, never a sleep (fixtures.js design rule 1). */
async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/**
 * Wait until an element's transform has actually STOPPED MOVING.
 *
 * settle() is two animation frames (~32ms). It is the right wait for an instant change
 * — .picker and .search-overlay are display:none -> flex and need nothing more. It is
 * the WRONG wait for anything transitioned: #forge3d-sheet .detail-panel (:9316) slides
 * `transform` over .34s, so a probe taken after settle() alone samples it MID-SLIDE.
 *
 * That is not hypothetical. It made the overlay-layering test below pass on four
 * projects and fail on the fifth, with an IDENTICAL app: measured at the assertion, the
 * panel had 9.4px left to travel on phone-webkit (99% arrived, covers the buttons, green)
 * and 241.4px on reduced-motion (26% arrived, does not cover, red). reduced-motion has no
 * competing animations, so its frames pace faster and two rAF land earlier in the slide.
 * The four greens were frame-timing luck with about 1% of margin, not correctness — at
 * rest the invariant holds everywhere.
 *
 * This is the repo's own v1.14.408 lesson — "a rect measured in the same turn a transition
 * starts samples MID-FLIGHT; settle per element, before measuring" — which this spec was
 * written after and did not apply. Condition-based, not a fixed timeout: it polls per frame
 * until the computed transform is unchanged, so it costs one frame when nothing is moving
 * and exactly as long as the real transition when something is.
 */
async function settleTransform(page, selector) {
  // Clear any marker from a previous call, or a second call on the same element would
  // compare against the OLD value, match immediately, and return before the new transition
  // has even started — reintroducing the very race this exists to close.
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) delete el.__tfPrev;
  }, selector);
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    if (!el) return true;                       // absent element is not a moving one
    const now = getComputedStyle(el).transform;
    const prev = el.__tfPrev;
    el.__tfPrev = now;
    return prev !== undefined && prev === now;  // stable across two consecutive frames
  }, selector, { timeout: 5000, polling: 'raf' });
}

// ── Chip markup ──────────────────────────────────────────────────────────────
// Copied VERBATIM from the app's own emitter, buildChips() at dct-ios.html
// :20149-20151, including the .active class that updateChips() (:20169) toggles and
// whose box-shadow is the ink being clipped. Nothing here is fabricated as app DATA:
// #chips is populated only when racks resolve from a Master, and this spec measures
// CSS GEOMETRY, so the markup is a fixture for the layout and the ids are
// placeholders. No rack, count or percentage below is claimed to be real.
const CHIP_IDS = ['a:01', 'a:02', 'a:03', 'a:04', 'a:05'];   // the LOADOUT cap is 5 (:19962 RUN.slice(0,5))

async function setChips(page, n) {
  await page.evaluate(({ ids, count }) => {
    const mk = (id, pct, active) =>
      '<div class="chip' + (active ? ' active' : '') + '" data-rack="' + id + '">' +
      '<div class="cid">' + id + '</div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div>';
    document.getElementById('chips').innerHTML =
      ids.slice(0, count).map((id, i) => mk(id, 20 + i * 15, i === 0)).join('');
  }, { ids: CHIP_IDS, count: n });
  await settle(page);
}

// v1.14.409 — PUT THE DOCK IN ITS POPULATED COMPOSITION.
// Two members of the dock are CONDITIONAL by design and are absent in the zero state:
//   • #hint — the instruction caption. deploy_forge_zeroState() hides it, because the zero-state
//     message goes to the status row and the caption used to render a byte-identical copy of it
//     ~20px above, in a second type treatment. The hint is the INSTRUCTION surface; the status row
//     is the STATE surface. One sentence, one home.
//   • .st-id — the rack-id pill. With no focused rack it would read `● —`: a dot, a dash and no
//     information, so writeStatusMessage() hides it and writeStatusPills() reveals it again.
// The harness cannot load a Master, so the app sits in the zero state and any test asserting the
// POPULATED geometry has to say so. This helper does exactly what the app's own populated path
// does — it invents no data, and the pill text is the owner's own example.
// The conditional behaviour itself is pinned separately, by the zero-state test below, so hiding
// it here can never hide a regression.
async function populateDock(page) {
  await page.evaluate(() => {
    const hint = document.getElementById('hint');
    if (hint) { hint.hidden = false; hint.textContent = 'TAP A RACK TO FOCUS · ⊞ PICK UP TO 5 FOR THE 3D'; }
    const id = document.getElementById('tagId');
    if (id && id.parentElement) { id.parentElement.hidden = false; id.textContent = 's3:171'; }
    const st = document.getElementById('tagState');
    if (st) st.textContent = '0/0 RACKED';
    const wk = document.getElementById('tagWalk');
    if (wk) { wk.hidden = false; wk.textContent = 'TAP FLANKS TO WALK'; }
  });
  await settle(page);
}

// Every chip state the surface actually has: the honest no-Master zero state, a
// partial loadout, and the real 5-rack cap.
const CHIP_STATES = [0, 1, 3, 5];

// ── One atomic snapshot ──────────────────────────────────────────────────────
// Every rect, computed style and hit test is read inside ONE page.evaluate, so the
// comparisons are self-consistent even if the scene mutates a frame later. Reading
// rects one round-trip at a time is how a layout test measures two different layouts
// and reports a defect that never existed.
const SNAPSHOT = () => {
  const q = (s) => document.querySelector('#forge3d-sheet ' + s);
  const rect = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return {
      t: +b.top.toFixed(2), b: +b.bottom.toFixed(2), l: +b.left.toFixed(2),
      r: +b.right.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
    };
  };
  const EPS = 0.5;   // sub-pixel rounding is not an overlap
  const hit = (a, c) => !!(a && c) &&
    (Math.min(a.b, c.b) - Math.max(a.t, c.t) > EPS) &&
    (Math.min(a.r, c.r) - Math.max(a.l, c.l) > EPS);
  const name = (el) => el
    ? el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
      (el.className && typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/)[0] : '')
    : 'null';
  const topAt = (x, y) => name(document.elementFromPoint(x, y));

  const strip = q('.hud-bottom'), row = q('.toprow'), chips = q('.chips');
  const statrow = q('.statrow'), hint = q('.hint'), toast = q('.toast'), active = q('.chip.active');
  const lo = document.getElementById('loadoutBtn'), se = document.getElementById('searchBtn');

  const csChips = getComputedStyle(chips);
  const csStrip = getComputedStyle(strip);
  const num = (v) => parseFloat(v) || 0;

  // The blur radius the browser will actually paint, read off .chip.active's own
  // computed shadow: "rgb(...) 0px 0px 14px 0px". Third length = blur.
  let paintedGlow = null;
  if (active) {
    const m = /(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(getComputedStyle(active).boxShadow || '');
    if (m) paintedGlow = parseFloat(m[3]);
  }

  const R = {
    strip: rect(strip), row: rect(row), chips: rect(chips), statrow: rect(statrow),
    hint: rect(hint), toast: rect(toast), lo: rect(lo), se: rect(se), active: rect(active),
  };

  // Is a control the TOPMOST element at its own corners and centre? A control that
  // renders but does not hit-test is a dead control, which is the class this sheet
  // already shipped once (the invisible toast over the pill strip).
  const probe = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return [
      topAt(b.left + 4, b.top + 4),
      topAt(b.right - 4, b.bottom - 4),
      topAt(b.left + b.width / 2, b.top + b.height / 2),
    ];
  };

  // Every chip whose box is not fully inside the clip box of the scroller.
  const clipped = Array.from(document.querySelectorAll('#forge3d-sheet .chip'))
    .filter((c) => {
      const b = c.getBoundingClientRect();
      return R.chips && (b.left < R.chips.l - 0.5 || b.right > R.chips.r + 0.5);
    })
    .map((c) => c.dataset.rack);

  // env(safe-area-inset-bottom) as this browser resolves it. 0 on WebKit-for-Windows.
  const probeEl = document.createElement('div');
  probeEl.style.cssText = 'position:fixed;left:-9999px;height:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probeEl);
  const safeInset = +probeEl.getBoundingClientRect().height.toFixed(2);
  probeEl.remove();

  return {
    rects: R,
    tokens: {
      tap: csStrip.getPropertyValue('--forge-tap').trim(),
      glow: csStrip.getPropertyValue('--forge-glow').trim(),
      gutter: csStrip.getPropertyValue('--forge-gutter').trim(),
      padX: csStrip.getPropertyValue('--forge-pad-x').trim(),
      tapS: getComputedStyle(document.documentElement).getPropertyValue('--tap-s').trim(),
    },
    chipsCss: {
      overflowX: csChips.overflowX, overflowY: csChips.overflowY,
      padTop: num(csChips.paddingTop), padBottom: num(csChips.paddingBottom),
      scrollH: chips.scrollHeight, clientH: chips.clientHeight,
      scrollW: chips.scrollWidth, clientW: chips.clientWidth,
    },
    stripCss: { padBottom: num(csStrip.paddingBottom), padLeft: num(csStrip.paddingLeft) },
    rowMinHeight: num(getComputedStyle(row).minHeight),
    hintCss: {
      position: getComputedStyle(hint).position,
      whiteSpace: getComputedStyle(hint).whiteSpace,
      offsetParent: name(hint.offsetParent),
    },
    toastPointerEvents: getComputedStyle(toast).pointerEvents,
    paintedGlow,
    chipCount: document.querySelectorAll('#forge3d-sheet .chip').length,
    clippedChips: clipped,
    safeInset,
    // The point the hidden toast used to swallow: the dead centre of the pill strip.
    stripCentreHit: R.chips ? topAt((R.chips.l + R.chips.r) / 2, (R.chips.t + R.chips.b) / 2) : null,
    hitLoadout: probe(lo),
    hitSearch: probe(se),
    // v1.14.454 — DERIVED FROM THE DOM, not hand-listed. `lo` and `se` above are named one by one,
    // so every control added to this cluster has to be REMEMBERED into this file — and .397/.398 is
    // the standing lesson that a hand-listed registry drifts. It drifted immediately: .454 added a
    // third button (#walkBtn) to the same cluster and neither named assertion could see it, on the
    // one surface that has already shipped a sub-44px control. This asks the cluster what is in it,
    // so the button the NEXT ship adds is covered by the floor and hit-test checks for free.
    utils: Array.from(document.querySelectorAll('#forge3d-sheet .scene-utils .hudbtn')).map((el) => ({
      id: el.id || '(unnamed)',
      rect: rect(el),
      hits: probe(el),
    })),
    // The layer-separation matrix, computed in-page against one set of rects.
    intersects: {
      chips_loadout: hit(R.chips, R.lo),
      chips_search: hit(R.chips, R.se),
      loadout_search: hit(R.lo, R.se),
      statrow_row: hit(R.statrow, R.row),
      statrow_chips: hit(R.statrow, R.chips),
      statrow_loadout: hit(R.statrow, R.lo),
      statrow_search: hit(R.statrow, R.se),
      hint_row: hit(R.hint, R.row),
      hint_chips: hit(R.hint, R.chips),
      hint_loadout: hit(R.hint, R.lo),
      hint_search: hit(R.hint, R.se),
      hint_statrow: hit(R.hint, R.statrow),
    },
  };
};

async function snapshot(page) {
  return page.evaluate(SNAPSHOT);
}

// ── Environment noise: named, partitioned LOCALLY, reported ──────────────────
// Identical reasoning to 02-build-forge. NOTHING was added to the shared
// BENIGN_CONSOLE — every entry there weakens every spec in the suite.
//  1. The cross-origin API health probe (phantomCheckApi :50945) against the
//     Cloudflare Worker, whose Origin allowlist is the Pages origin BY DESIGN. It is
//     stubbed at the network layer below so the app takes its production path; the
//     text pattern stays only as a backstop for a preflight the router misses.
//  2. navigator.vibrate — a mobile-only API Chromium implements and then blocks
//     without a gesture. iOS Safari does not implement it at all, so on the field
//     device haptic() (:16397) is a no-op.
const ENV_NOISE = [
  /phantom-api\.[a-z0-9]+\.workers\.dev|Access-Control-Allow-Origin|access control checks|net::ERR_FAILED/i,
  /Blocked call to navigator\.vibrate/i,
];
const isEnvNoise = (t) => ENV_NOISE.some((re) => re.test(t));

async function stubHealthProbe(page) {
  await page.route(/phantom-api\.[a-z0-9]+\.workers\.dev/, (route) =>
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

test.describe('Forge bottom control stack', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // A · THE TAP FLOOR — the assertion that would have caught the original bug
  // ───────────────────────────────────────────────────────────────────────────

  test('both utility buttons clear 44x44 in EVERY chip state, including the empty zero state', async ({ phantom, page }, testInfo) => {
    await phantom.boot();
    await openAisle(page);

    const seen = [];
    for (const n of CHIP_STATES) {
      await setChips(page, n);
      const m = await snapshot(page);
      const tag = `[${testInfo.project.name} · ${n} chip${n === 1 ? '' : 's'}]`;

      // The app's OWN published floor, read live off :root (:150), not a number this
      // suite imported. If the token ever drops below 44 the test says so here.
      const tapS = parseFloat(m.tokens.tapS);
      expect(tapS, `${tag} --tap-s no longer resolves to a length: "${m.tokens.tapS}"`).toBeGreaterThan(0);
      expect(tapS, `${tag} the app's own gloved floor --tap-s (:150) dropped below 44px`).toBeGreaterThanOrEqual(44);

      // n === 0 IS THE ORIGINAL DEFECT. With #chips empty there is no sibling to
      // stretch against; before v1.14.407 both buttons measured 46 x 24.5 here.
      expect(m.chipCount, `${tag} chip fixture did not apply`).toBe(n);
      expect(m.rects.lo.h, `${tag} #loadoutBtn is ${m.rects.lo.h}px tall, under the ${tapS}px gloved floor`).toBeGreaterThanOrEqual(tapS);
      expect(m.rects.se.h, `${tag} #searchBtn is ${m.rects.se.h}px tall, under the ${tapS}px gloved floor`).toBeGreaterThanOrEqual(tapS);
      expect(m.rects.lo.w, `${tag} #loadoutBtn is ${m.rects.lo.w}px wide, under ${tapS}px`).toBeGreaterThanOrEqual(tapS);
      expect(m.rects.se.w, `${tag} #searchBtn is ${m.rects.se.w}px wide, under ${tapS}px`).toBeGreaterThanOrEqual(tapS);

      // Visually balanced: the two controls are a matched pair, not two accidents
      // that happen to both clear the floor.
      expect(m.rects.lo.h, `${tag} the utility buttons are different heights`).toBe(m.rects.se.h);
      expect(m.rects.lo.w, `${tag} the utility buttons are different widths`).toBe(m.rects.se.w);

      // The pills are tap targets too — .chip carries a click handler (:20154).
      if (n > 0) {
        expect(m.rects.active.h, `${tag} .chip is ${m.rects.active.h}px tall, under the ${tapS}px floor — the pills are controls (click handler :20154)`).toBeGreaterThanOrEqual(tapS);
      }

      // Rendering is not reaching: a control that draws but does not hit-test is a
      // dead control. This sheet already shipped one (the invisible toast).
      for (const h of m.hitLoadout) expect(h, `${tag} #loadoutBtn is covered — elementFromPoint returned ${h}`).toMatch(/loadoutBtn/);
      for (const h of m.hitSearch) expect(h, `${tag} #searchBtn is covered — elementFromPoint returned ${h}`).toMatch(/searchBtn|svg|circle|line/);
      expect(m.stripCentreHit, `${tag} something invisible is over the pill strip: ${m.stripCentreHit}`).not.toMatch(/toast/i);
      expect(m.toastPointerEvents, `${tag} the hidden .toast is hit-testable again (:9218) — it swallows pill taps silently`).toBe('none');

      // v1.14.454 — the same two questions, asked of EVERY control the cluster actually contains
      // rather than of the two this file happens to name. The floor is law for a gloved hand, so
      // the assertion has to follow the controls, not the other way round.
      expect(m.utils.length, `${tag} the utility cluster reported no controls — the sweep is measuring nothing`)
        .toBeGreaterThanOrEqual(2);
      for (const u of m.utils) {
        expect(u.rect.h, `${tag} #${u.id} is ${u.rect.h}px tall, under the ${tapS}px gloved floor`).toBeGreaterThanOrEqual(tapS);
        expect(u.rect.w, `${tag} #${u.id} is ${u.rect.w}px wide, under ${tapS}px`).toBeGreaterThanOrEqual(tapS);
        for (const h of u.hits) {
          expect(h, `${tag} #${u.id} is covered — elementFromPoint returned ${h}. A control that draws but does not hit-test is a dead control`)
            .toMatch(new RegExp(`${u.id}|svg|circle|line|path`));
        }
      }

      seen.push(`${n}:${m.rects.lo.w}x${m.rects.lo.h}`);
    }

    testInfo.annotations.push({ type: 'tap-floor', description: `loadoutBtn per chip state — ${seen.join(' ')}` });
  });

  test('every control in the row consumes the tap token as its OWN height, not a sibling\'s', async ({ phantom, page }, testInfo) => {
    // THE ROOT CAUSE, pinned as a behaviour rather than as a number. Before the fix
    // .hudbtn had no height at all and inherited the row's stretch, so its size
    // tracked whatever the CHIPS happened to be. Move the one declared knob and every
    // control must follow it. If someone reinstates align-items:stretch and deletes
    // the declared heights, the buttons stop tracking --forge-tap and this fails —
    // even though a static "is it >= 44" assertion would still pass.
    await phantom.boot();
    await openAisle(page);
    await setChips(page, 3);

    const base = await snapshot(page);
    const tap0 = parseFloat(base.tokens.tap);
    expect(tap0, `--forge-tap does not resolve to a length: "${base.tokens.tap}"`).toBeGreaterThanOrEqual(44);
    expect(base.rects.lo.h, '#loadoutBtn does not equal --forge-tap at rest').toBe(tap0);
    expect(base.rects.se.h, '#searchBtn does not equal --forge-tap at rest').toBe(tap0);
    expect(base.rects.active.h, '.chip does not equal --forge-tap at rest').toBe(tap0);

    // One knob, turned. --forge-tap is declared on #forge3d-sheet (:9075) so an
    // inline property on the sheet is the same cascade level the app uses.
    const TAP2 = tap0 + 20;
    await page.evaluate((v) => document.getElementById('forge3d-sheet').style.setProperty('--forge-tap', v + 'px'), TAP2);
    await settle(page);
    const moved = await snapshot(page);

    expect(parseFloat(moved.tokens.tap), 'the token did not take — this test would be vacuous').toBe(TAP2);
    expect(moved.rects.lo.h, `#loadoutBtn ignored --forge-tap (${TAP2}px) — it is being sized by something else`).toBe(TAP2);
    expect(moved.rects.se.h, `#searchBtn ignored --forge-tap (${TAP2}px) — it is being sized by something else`).toBe(TAP2);
    expect(moved.rects.active.h, `.chip ignored --forge-tap (${TAP2}px)`).toBe(TAP2);
    // and the row's own declared height moved with it (--forge-row-h = tap + glow).
    expect(moved.rowMinHeight, '.toprow min-height did not follow --forge-tap — the row height is emergent again')
      .toBe(TAP2 + parseFloat(moved.tokens.glow));

    await page.evaluate(() => document.getElementById('forge3d-sheet').style.removeProperty('--forge-tap'));
    await settle(page);
    const back = await snapshot(page);
    expect(back.rects.lo.h, 'the strip did not return to its declared height').toBe(tap0);

    testInfo.annotations.push({ type: 'one-knob', description: `--forge-tap ${tap0} -> ${TAP2} -> ${tap0}; row min-height ${base.rowMinHeight} -> ${moved.rowMinHeight}` });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // B · THE THREE LAYERS
  // ───────────────────────────────────────────────────────────────────────────

  test('the pill strip, the utility buttons and the status row never intersect', async ({ phantom, page }, testInfo) => {
    // The owner's report was "the rack pills and the right-side utility buttons are
    // fighting the focus card below" (the card is now .statrow, v1.14.409). Separation is
    // state, in both directions — never by eye. The hint is included because the
    // caption was the fourth, uninvited layer that was actually inside the row.
    await phantom.boot();
    await openAisle(page);

    for (const n of CHIP_STATES) {
      await setChips(page, n);
      const m = await snapshot(page);
      const tag = `[${testInfo.project.name} · ${n} chips]`;
      const box = (k) => JSON.stringify(m.rects[k]);

      expect(m.intersects.chips_loadout, `${tag} the pill strip overlaps #loadoutBtn — chips ${box('chips')} vs ${box('lo')}`).toBe(false);
      expect(m.intersects.chips_search, `${tag} the pill strip overlaps #searchBtn — chips ${box('chips')} vs ${box('se')}`).toBe(false);
      expect(m.intersects.loadout_search, `${tag} the two utility buttons overlap each other`).toBe(false);

      // Requirement 4, verbatim: the status row must not overlap the control row.
      expect(m.intersects.statrow_row, `${tag} .statrow overlaps .toprow — statrow ${box('statrow')} vs row ${box('row')}`).toBe(false);
      expect(m.intersects.statrow_chips, `${tag} .statrow overlaps the pill strip`).toBe(false);
      expect(m.intersects.statrow_loadout, `${tag} .statrow overlaps #loadoutBtn`).toBe(false);
      expect(m.intersects.statrow_search, `${tag} .statrow overlaps #searchBtn`).toBe(false);

      // The caption is a layer too, and it is the one that was drawing on the pills.
      expect(m.intersects.hint_row, `${tag} .hint is drawn INSIDE the control row — hint ${box('hint')} vs row ${box('row')}`).toBe(false);
      expect(m.intersects.hint_chips, `${tag} .hint overlaps the pill strip`).toBe(false);
      expect(m.intersects.hint_loadout, `${tag} .hint overlaps #loadoutBtn`).toBe(false);
      expect(m.intersects.hint_search, `${tag} .hint overlaps #searchBtn`).toBe(false);
      expect(m.intersects.hint_statrow, `${tag} .hint overlaps the status row`).toBe(false);

      // Stacking ORDER, not just non-overlap: hint above the strip, status row below
      // the control row, everything inside the bottom strip.
      expect(m.rects.hint.b, `${tag} .hint's bottom edge is below the strip's top edge`).toBeLessThanOrEqual(m.rects.strip.t + 0.5);
      expect(m.rects.row.b, `${tag} the control row does not sit above the status row`).toBeLessThanOrEqual(m.rects.statrow.t + 0.5);
      expect(m.rects.statrow.b, `${tag} the status row escapes the bottom of its own strip`).toBeLessThanOrEqual(m.rects.strip.b + 0.5);

      // No control is pushed off the bottom of the viewport by the safe-area padding.
      const vh = await page.evaluate(() => window.innerHeight);
      expect(m.rects.statrow.b, `${tag} the status row is below the fold (viewport ${vh}px)`).toBeLessThanOrEqual(vh + 0.5);
      expect(m.rects.hint.t, `${tag} .hint is off the top of the viewport`).toBeGreaterThanOrEqual(0);
    }
  });

  test('the caption stays readable and inside the viewport at every chip state', async ({ phantom, page }, testInfo) => {
    // The 92px pin came with white-space:nowrap, which forced the app's own 59-char
    // zero-state string (deploy_forge_zeroState :19945) to 472.7px inside a 390px
    // viewport — 41px cut off each end. The caption is now allowed to wrap, so the
    // pin is: whatever string the app writes, the box stays on screen.
    await phantom.boot();
    await openAisle(page);
    await populateDock(page);   // conditional members — see the helper

    const ZERO_STATE = 'NO MASTER LOADED · LOAD A MASTER FILE TO BUILD YOUR LOADOUT';   // :19945, verbatim
    await page.evaluate((s) => { document.getElementById('hint').textContent = s; }, ZERO_STATE);
    await setChips(page, 0);

    const m = await snapshot(page);
    const vw = await page.evaluate(() => window.innerWidth);
    const tag = `[${testInfo.project.name}]`;

    expect(m.hintCss.whiteSpace, `${tag} .hint is nowrap again — the app's own zero-state string does not fit at ${vw}px`).not.toBe('nowrap');
    expect(m.rects.hint.l, `${tag} .hint runs off the left edge: ${JSON.stringify(m.rects.hint)}`).toBeGreaterThanOrEqual(0);
    expect(m.rects.hint.r, `${tag} .hint runs off the right edge: ${JSON.stringify(m.rects.hint)}`).toBeLessThanOrEqual(vw + 0.5);
    expect(m.rects.hint.h, `${tag} .hint collapsed to zero height — the caption is gone`).toBeGreaterThan(0);
    // It is bounded by the SAME inset as the controls it describes (--forge-pad-x).
    expect(m.stripCss.padLeft, `${tag} the strip's inset is not --forge-pad-x (${m.tokens.padX})`).toBe(parseFloat(m.tokens.padX));

    await phantom.assertNoHorizontalOverflow();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // C · THE CLIP
  // ───────────────────────────────────────────────────────────────────────────

  test('the pill strip declares its clip on both axes and holds the glow\'s own room inside it', async ({ phantom, page }, testInfo) => {
    await phantom.boot();
    await openAisle(page);
    await setChips(page, 5);

    const m = await snapshot(page);
    const tag = `[${testInfo.project.name}]`;

    // css-overflow-3 blockifies the omitted axis: declaring only overflow-x:auto
    // yields auto/auto and a SILENT vertical clip. Both axes must be declared.
    expect(m.chipsCss.overflowX, `${tag} .chips is no longer a horizontal scroller`).toBe('auto');
    expect(m.chipsCss.overflowY, `${tag} .chips overflow-y is "${m.chipsCss.overflowY}" — it must be DECLARED, not left to blockify (:9107)`).toBe('hidden');

    // A clip is honest only if the ink it clips has room reserved inside it. The room
    // is derived from the SAME token that draws the glow, so the two cannot drift:
    // a CSS box-shadow stays perceptible for about half its blur radius.
    const glow = parseFloat(m.tokens.glow);
    expect(glow, `${tag} --forge-glow does not resolve to a length: "${m.tokens.glow}"`).toBeGreaterThan(0);
    expect(m.paintedGlow, `${tag} .chip.active's painted blur (${m.paintedGlow}px) drifted from --forge-glow (${glow}px) — the glow and the room made for it are no longer the same number`).toBe(glow);

    const need = glow / 2;
    const above = +(m.rects.active.t - m.rects.chips.t).toFixed(2);
    const below = +(m.rects.chips.b - m.rects.active.b).toFixed(2);
    expect(above, `${tag} only ${above}px of room above the active pill for a ${glow}px glow — the top of the glow is amputated`).toBeGreaterThanOrEqual(need);
    expect(below, `${tag} only ${below}px of room below the active pill for a ${glow}px glow`).toBeGreaterThanOrEqual(need);
    expect(m.chipsCss.padTop, `${tag} the gutter is not the derived --forge-gutter (${m.tokens.gutter})`).toBe(need);
    expect(m.chipsCss.padBottom, `${tag} the gutter is asymmetric — the old padding-bottom-only hack is back`).toBe(m.chipsCss.padTop);

    // The room is PADDING, not overflow: a vertical scroll region inside a
    // horizontal scroller is a second clip nobody asked for.
    expect(m.chipsCss.scrollH, `${tag} .chips has a vertical scroll region (${m.chipsCss.scrollH} > ${m.chipsCss.clientH}) — content is being cut, not just ink`).toBe(m.chipsCss.clientH);

    // ── TIER-AWARE, and MEASURED rather than branched on a breakpoint ──────────
    const fits = m.chipsCss.scrollW <= m.chipsCss.clientW + 1;
    if (fits) {
      // Wide enough for the whole loadout: then every pill must be fully inside the
      // clip box. A pill half-eaten by the clip on a tier that has the room is a bug.
      expect(m.clippedChips, `${tag} the strip has room (scrollWidth ${m.chipsCss.scrollW} <= clientWidth ${m.chipsCss.clientW}) yet these pills are clipped: ${m.clippedChips.join(', ')}`).toEqual([]);
    } else {
      // Narrow tier: the strip is a scroller BY DESIGN, so pills off the edge are
      // reachable, not lost — and the overflow must stay inside the scroller and
      // never reach the document. What is NOT asserted here: that the operator can
      // SEE there is more to scroll. The scrollbar is suppressed (:9108/:9110) and
      // there is no edge fade, so at the 5-rack cap on a 390px phone two pills are
      // off-screen with no affordance. That is an open owner item (a fix is either a
      // smaller pill or a gradient — both restyles), reported, not asserted away.
      expect(m.chipsCss.scrollW, `${tag} the strip does not fit its pills but is not scrollable either`).toBeGreaterThan(m.chipsCss.clientW);
      testInfo.annotations.push({
        type: 'open-owner-item',
        description: `at ${await page.evaluate(() => window.innerWidth)}px the 5-pill loadout needs ${m.chipsCss.scrollW}px in a ${m.chipsCss.clientW}px strip; off-edge pills: ${m.clippedChips.join(', ') || 'none'} — no scroll affordance exists`,
      });
    }

    await phantom.assertNoHorizontalOverflow();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // D · THE DURABLE RULE, MADE ENFORCEABLE
  // ───────────────────────────────────────────────────────────────────────────

  test('the caption\'s clearance is DERIVED: move the stack and the gap holds', async ({ phantom, page }, testInfo) => {
    // THE ASSERTION THIS SPEC EXISTS FOR. .hint used to clear the stack with a
    // hard-coded `bottom: calc(safe + 92px)` (old :9202) while the stack itself
    // measured 108.5-137px and was data-driven. This repo has been bitten by exactly
    // that shape twice already (v1.14.341 --tabnav-h, v1.14.351 phase dock), and a
    // static "do they overlap today" assertion would have passed on all three.
    //
    // So the stack is MOVED at runtime — grown and shrunk, through both of its
    // independently-varying members — and the gap between the caption and the strip
    // must be the SAME number every time. A constant offset cannot do that.
    await phantom.boot();
    await openAisle(page);
    await populateDock(page);   // conditional members — see the helper
    await setChips(page, 3);

    const gapOf = (m) => +(m.rects.strip.t - m.rects.hint.b).toFixed(2);
    const tag = `[${testInfo.project.name}]`;

    // Structural, not incidental: the caption is positioned against the strip it must
    // clear, not against the viewport. That is what makes the gap survive.
    const rest = await snapshot(page);
    expect(rest.hintCss.position, `${tag} .hint is viewport-pinned again ("${rest.hintCss.position}") — a fixed caption needs a magic number to clear a stack whose height it cannot see`).not.toBe('fixed');
    expect(rest.hintCss.offsetParent, `${tag} .hint is not anchored to the bottom strip — its offsetParent is ${rest.hintCss.offsetParent}`).toMatch(/hud-bottom|hud/);

    // The two members are perturbed SEPARATELY, because they fail differently: the
    // control row is governed by a declared token, the status row by DATA. A
    // clearance derived from --forge-row-h alone would survive the first and still
    // slide under the second, which is the shape that actually shipped.
    //
    // STATUS-ROW strings, written into the STATE pill (#tagState). These are LAYOUT
    // fixtures for the box height, not claims about what any site reports.
    //
    // ⚠ v1.14.410 — THE OLD STATUS-ROW LEVER IS GONE, ON PURPOSE. This test used to
    // grow the status row by writing a very long string into #tagState and letting
    // .statrow WRAP. The owner's permanent-layout ruling made the three pills share
    // ONE baseline (.statrow is now flex-wrap:nowrap), so no string can grow that box
    // any more and the vacuity guard correctly reported that half of this test had
    // stopped proving anything. It was not silently deleted — it is REPLACED by a
    // lever that still varies the status row for a reason the app can actually
    // experience: the TYPE SCALE. The pills consume --fs-micro, so if that step ever
    // moves the clearance must still hold. Same shape of proof, live mechanism.
    // The one-baseline rule itself is now pinned by its own test further down.
    const setMicro = async (v) => {
      await page.evaluate((px) => {
        const s = document.getElementById('forge3d-sheet');
        if (px) s.style.setProperty('--fs-micro', px); else s.style.removeProperty('--fs-micro');
      }, v);
      await settle(page);
    };
    const setTap = async (v) => {
      await page.evaluate((px) => {
        const s = document.getElementById('forge3d-sheet');
        if (px) s.style.setProperty('--forge-tap', px); else s.style.removeProperty('--forge-tap');
      }, v);
      await settle(page);
    };

    const runs = [{ label: 'at rest', m: rest }];

    // (1) STATUS ROW, taller type — the pills consume --fs-micro, so this grows row 2.
    await setMicro('22px');
    runs.push({ label: 'status row at --fs-micro 22px', m: await snapshot(page) });

    // (2) STATUS ROW, taller still — a second distinct height for the same member.
    await setMicro('34px');
    runs.push({ label: 'status row at --fs-micro 34px', m: await snapshot(page) });

    // (3) CONTROL ROW, through its own declared token — a different member entirely.
    await setTap('76px');
    runs.push({ label: 'tall row2 + --forge-tap 76px', m: await snapshot(page) });

    // (4) Back to the declared row height, row 2 still tall.
    await setTap(null);
    runs.push({ label: 'tall row2 only', m: await snapshot(page) });

    // (5) Everything back to the declared scale — the stack must return to rest.
    await setMicro(null);
    runs.push({ label: 'back at rest', m: await snapshot(page) });

    const heights = runs.map((r) => r.m.rects.strip.h);
    const statHeights = runs.map((r) => r.m.rects.statrow.h);
    const rows = runs.map((r) => r.m.rects.row.h);
    const gaps = runs.map((r) => gapOf(r.m));
    // eslint-disable-next-line no-console
    console.log(`[08-forge-layout] ${tag} clearance under perturbation — ` +
      runs.map((r, i) => `${r.label}: stack ${heights[i]} (row ${rows[i]} + row2 ${statHeights[i]}), gap ${gaps[i]}`).join(' | '));

    // The defect signal first, so a real regression reports as a regression and not
    // as a broken test: at rest, does the caption already sit in the control row?
    expect(rest.intersects.hint_row, `${tag} at rest: .hint is drawn INSIDE the control row — hint ${JSON.stringify(rest.rects.hint)} vs row ${JSON.stringify(rest.rects.row)}`).toBe(false);

    // VACUITY GUARDS. If a member never actually changed height, every assertion
    // below is meaningless for that member and would pass on a hard-coded offset too.
    // Both are asserted SEPARATELY so a half-dead perturbation cannot hide behind the
    // other one — which is precisely the hole the first draft of this test had.
    const spread = (a) => Math.max(...a) - Math.min(...a);
    expect(spread(statHeights), `${tag} the STATUS ROW never changed height (${statHeights.join(', ')}) — this half of the test proved nothing; the pills have stopped consuming --fs-micro, so the type scale can move under the caption without this noticing`).toBeGreaterThan(5);
    expect(spread(rows), `${tag} the CONTROL ROW never changed height (${rows.join(', ')}) — the row no longer derives its height from --forge-tap`).toBeGreaterThan(5);
    expect(spread(heights), `${tag} the stack never changed height (${heights.join(', ')}) — this test proved nothing`).toBeGreaterThan(5);

    for (let i = 0; i < runs.length; i++) {
      const { label, m } = runs[i];
      // The caption clears the WHOLE stack, whatever the stack currently is.
      expect(m.intersects.hint_row, `${tag} ${label}: .hint slid into the control row at a stack height of ${m.rects.strip.h}px`).toBe(false);
      expect(m.intersects.hint_statrow, `${tag} ${label}: .hint slid into the status row`).toBe(false);
      expect(m.rects.hint.b, `${tag} ${label}: .hint's bottom (${m.rects.hint.b}) is not above the strip's top (${m.rects.strip.t})`).toBeLessThanOrEqual(m.rects.strip.t + 0.5);
      // And the clearance is the SAME every time: derived, not a constant that
      // happens to be big enough today.
      expect(gaps[i], `${tag} ${label}: the clearance changed to ${gaps[i]}px (was ${gaps[0]}px at rest) across stack heights ${heights.join(' / ')} — the caption is tracking something other than the stack`).toBeCloseTo(gaps[0], 1);
    }

    testInfo.annotations.push({
      type: 'derived-clearance',
      description: `stack ${heights.join(' / ')}px · status row ${statHeights.join(' / ')}px · row ${rows.join(' / ')}px · clearance ${gaps.join(' / ')}px (constant)`,
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // D2 · THE TOAST — v1.14.408, owner ruling "move it above the row"
  //
  // Two claims that were in DIRECT TENSION before this ship, which is why the toast
  // could not simply be moved:
  //   (1) it must clear the control row at ANY status-row height, and
  //   (2) it must still paint above the OPEN detail panel — the status-toggle handler
  //       fires with that panel up, so a toast sealed underneath it takes the UNDO
  //       affordance with it and the tech silently loses the ability to revert.
  // The lever that makes both true is `.hud` dropping position:fixed: a fixed element
  // ALWAYS establishes a stacking context and would cap the toast below the panel.
  // These tests pin the OUTCOME, so if anyone ever restores position:fixed (or gives
  // the strip a z-index) they fail here rather than in the aisle at 2AM.
  //
  // METHOD NOTE: .toast animates translateY(20px) -> 0 over 250ms. Measuring in the
  // same turn the class is added samples it MID-FLIGHT, up to 20px low — that produced
  // three false failures while this was being written. Always settle first.
  // ───────────────────────────────────────────────────────────────────────────

  async function raiseToast(page) {
    await page.evaluate(() => {
      const t = document.getElementById('toast');
      t.classList.remove('show');
      void t.offsetWidth;                                  // animate from rest every time
      document.getElementById('toastMsg').innerHTML = 'NODE-01 &rarr; RACKED';
      t.classList.add('show');                             // exactly what showToast() does
    });
    // showToast itself is IIFE-scoped and unreachable at page scope, hence the class.
    await page.waitForFunction(
      () => getComputedStyle(document.getElementById('toast')).opacity === '1',
      undefined, { timeout: 3000 },
    );
    await page.waitForTimeout(300);                        // past the 250ms transform
  }

  test('the toast clears the control row at every status-row height', async ({ phantom, page }) => {
    await phantom.boot();
    await openAisle(page);
    await setChips(page, 3);

    // The status row wraps and is data-driven — it is the term that moves the
    // whole stack, so it is the term worth perturbing. A constant offset (the old 96px)
    // cannot survive this; a bottom:100% anchor is exact at every height.
    for (const [label, sub] of [
      ['short', 'R-A01 · FOCUSED'],
      ['zero-state', 'NO MASTER LOADED · LOAD A MASTER FILE TO BUILD YOUR LOADOUT'],
      ['forced 3-line', 'NO MASTER LOADED · LOAD A MASTER FILE TO BUILD YOUR LOADOUT · AND THEN SOME MORE TEXT TO FORCE A THIRD LINE HERE'],
    ]) {
      await page.evaluate((s) => { document.getElementById('tagState').textContent = s; }, sub);
      await raiseToast(page);

      const m = await page.evaluate(() => {
        const g = (q) => { const b = document.querySelector(q).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, height: b.height }; };
        return { toast: g('#forge3d-sheet .toast'), row: g('#forge3d-sheet .toprow'), card: g('#forge3d-sheet .statrow'), vw: document.documentElement.clientWidth };
      });
      const overlaps = (a, b) => !(a.bottom <= b.top || a.top >= b.bottom || a.right <= b.left || a.left >= b.right);

      expect(overlaps(m.toast, m.row), `[${label}] the toast overlaps the control row — the 96px is back or the anchor broke`).toBe(false);
      expect(overlaps(m.toast, m.card), `[${label}] the toast overlaps the status row`).toBe(false);
      expect(m.toast.top, `[${label}] the toast is not ABOVE the row`).toBeLessThan(m.row.top);
      expect(m.toast.left, `[${label}] the toast runs off the left edge`).toBeGreaterThanOrEqual(0);
      expect(m.toast.right, `[${label}] the toast runs off the right edge`).toBeLessThanOrEqual(m.vw);
    }
  });

  test('the toast still beats the OPEN detail panel, so UNDO survives', async ({ phantom, page }) => {
    await phantom.boot();
    await openAisle(page);
    await page.evaluate(() => document.getElementById('detailPanel').classList.add('open'));
    await raiseToast(page);

    const layered = await page.evaluate(() => {
      const t = document.getElementById('toast').getBoundingClientRect();
      const topEl = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
      const u = document.getElementById('toastUndo').getBoundingClientRect();
      const topUndo = document.elementFromPoint(u.left + u.width / 2, u.top + u.height / 2);
      const inside = (el, id) => { while (el) { if (el.id === id) return true; el = el.parentElement; } return false; };
      return {
        topIsToast: inside(topEl, 'toast'),
        undoTappable: !!topUndo && topUndo.id === 'toastUndo',
        topTag: topEl ? (topEl.id || String(topEl.className)) : null,
        // The lever itself, asserted directly: a fixed strip re-seals the toast.
        stripPosition: getComputedStyle(document.querySelector('#forge3d-sheet .hud-bottom')).position,
        stripZ: getComputedStyle(document.querySelector('#forge3d-sheet .hud-bottom')).zIndex,
      };
    });

    expect(layered.stripPosition, 'the bottom strip went back to position:fixed — that ALWAYS makes a stacking context and re-seals the toast under the panel').not.toBe('fixed');
    expect(layered.stripZ, 'the bottom strip gained a z-index — that makes a stacking context and caps the toast below the panel').toBe('auto');
    expect(layered.topIsToast, `with the detail panel open the topmost element at the toast's own centre is ${layered.topTag}, not the toast — UNDO is unreachable`).toBe(true);
    expect(layered.undoTappable, 'UNDO is not hit-testable with the panel open — the status toggle can no longer be reverted').toBe(true);
  });

  test('the caption yields to the toast rather than stacking with it, and returns', async ({ phantom, page }) => {
    await phantom.boot();
    await openAisle(page);

    await raiseToast(page);
    const during = await page.evaluate(() => getComputedStyle(document.getElementById('hint')).opacity);
    expect(Number(during), 'the caption and the toast are stacked in the same slot above the strip').toBe(0);

    await page.evaluate(() => document.getElementById('toast').classList.remove('show'));
    await page.waitForTimeout(1000);   // .hint carries its OWN 800ms fade, not the toast's 250ms
    const after = await page.evaluate(() => getComputedStyle(document.getElementById('hint')).opacity);
    expect(Number(after), 'the caption never came back after the toast dismissed').toBe(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // D3 · THE STATUS ROW — v1.14.409, owner ruling "three compact pills on one row"
  //
  // The single .herotag card became #tagId / #tagState / #tagWalk. That is a
  // DECOMPOSITION of a string the app already built (deploy_forge_tagSub concatenated
  // `SITE · n/m RACKED [· ⚠k FLAGGED] · TAP FLANKS TO WALK`), so the risk here is not
  // "is the data real" — it is the two things a decomposition can silently get wrong:
  //   (1) a read-out that LOOKS tappable. Row 1 is controls and owes the 44px gloved
  //       floor; row 2 is read-outs and is exempt — but the exemption is only honest
  //       while the pills carry no handler, no role, no tabindex and no cursor. A
  //       gloved tap that lands on nothing and reports nothing is this app's own
  //       named defect class.
  //   (2) a clause that quietly changed meaning. `TAP FLANKS TO WALK` must not stand
  //       in an empty aisle instructing the tech to walk flanks that are not there —
  //       pre-.409 it could not, because the zero-state message replaced the WHOLE
  //       string. That property is now carried by an attribute and has to be pinned.
  // ───────────────────────────────────────────────────────────────────────────

  test('the three status pills are read-outs, not controls', async ({ phantom, page }, testInfo) => {
    await phantom.boot();
    await openAisle(page);
    await populateDock(page);   // conditional members — see the helper
    await setChips(page, 3);

    // The owner's own example, set directly on the slots. Nothing is invented: these
    // are the exact three clauses the concatenated string carried.
    await page.evaluate(() => {
      document.getElementById('tagId').textContent = 's3:171';
      document.getElementById('tagState').textContent = '0/0 RACKED';
      document.getElementById('tagWalk').hidden = false;
    });
    await settle(page);

    const m = await page.evaluate(() => {
      const pills = ['tagId', 'tagState', 'tagWalk'].map((id) => {
        const el = document.getElementById(id);
        // #tagId is the TEXT inside the id pill; the pill itself is the styled box.
        const box = el.closest('.statpill') || el;
        const b = box.getBoundingClientRect();
        const cs = getComputedStyle(box);
        const hitEl = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return {
          id, text: el.textContent.trim(),
          rect: { t: +b.top.toFixed(2), h: +b.height.toFixed(2), l: +b.left.toFixed(2), r: +b.right.toFixed(2) },
          // every affordance a control would carry
          cursor: cs.cursor,
          pointerEvents: cs.pointerEvents,
          fontSize: parseFloat(cs.fontSize),
          role: box.getAttribute('role'),
          tabindex: box.getAttribute('tabindex'),
          onclick: !!box.onclick || box.hasAttribute('onclick'),
          tag: box.tagName.toLowerCase(),
          // what a tap at the pill's centre actually reaches
          hit: hitEl ? (hitEl.id || String(hitEl.className || hitEl.tagName)) : null,
        };
      });
      const row = document.querySelector('#forge3d-sheet .statrow').getBoundingClientRect();
      const toprow = document.querySelector('#forge3d-sheet .toprow').getBoundingClientRect();
      return {
        pills,
        row: { t: +row.top.toFixed(2), h: +row.height.toFixed(2), l: +row.left.toFixed(2), r: +row.right.toFixed(2) },
        toprowH: +toprow.height.toFixed(2),
        vw: document.documentElement.clientWidth,
      };
    });

    const tag = `[${testInfo.project.name}]`;

    for (const p of m.pills) {
      // (1) NOT A CONTROL — asserted through every channel that could imply one.
      expect(p.tag, `${tag} #${p.id}'s pill is a <${p.tag}> — a button/anchor element IS an affordance`).toBe('span');
      expect(p.cursor, `${tag} #${p.id} has cursor:${p.cursor} — it advertises a tap it does not handle`).not.toBe('pointer');
      expect(p.role, `${tag} #${p.id} carries role="${p.role}"`).toBeNull();
      expect(p.tabindex, `${tag} #${p.id} carries tabindex="${p.tabindex}" — it is in the focus order`).toBeNull();
      expect(p.onclick, `${tag} #${p.id} has a click handler — then it is a control and owes the 44px floor`).toBe(false);
      expect(p.pointerEvents, `${tag} #${p.id} is hit-testable (pointer-events:${p.pointerEvents}) — a tap lands on it and nothing happens`).toBe('none');
      expect(p.hit, `${tag} a tap at #${p.id}'s centre is absorbed by the pill (${p.hit}) instead of passing through`).not.toMatch(/statpill|tag(Id|State|Walk)/);

      // (2) TYPE FLOOR. The app's hard floor is 10px (--fs-micro); .hint's 9px and
      // .chip .cid's 8.5px are pre-existing exceptions, and nothing NEW may join them.
      expect(p.fontSize, `${tag} #${p.id} renders at ${p.fontSize}px — below the app's 10px floor for new type`).toBeGreaterThanOrEqual(10);
    }

    // (3) ONE ROW at the owner's example data, and inside the viewport.
    const tops = m.pills.map((p) => p.rect.t);
    expect(Math.max(...tops) - Math.min(...tops), `${tag} the three pills are not on one row (tops ${tops.join(', ')}) with the owner's own example data`).toBeLessThanOrEqual(0.5);
    expect(m.row.l, `${tag} the status row runs off the left edge`).toBeGreaterThanOrEqual(0);
    expect(m.row.r, `${tag} the status row runs off the right edge (${m.row.r} > ${m.vw})`).toBeLessThanOrEqual(m.vw + 0.5);

    // (4) REDUCED BULK, made enforceable. The whole complaint was that the tertiary
    // layer was the tallest thing in the dock: the old card measured 56-74px under a
    // 58px control row. Row 2 must now be the SHORTER of the two.
    expect(m.row.h, `${tag} the status row (${m.row.h}px) is taller than the control row (${m.toprowH}px) — the tertiary layer is the bulkiest thing in the dock again`).toBeLessThan(m.toprowH);

    testInfo.annotations.push({
      type: 'status-row',
      description: `pills ${m.pills.map((p) => `${p.id} "${p.text}" ${p.rect.h}px`).join(' · ')} | row ${m.row.h}px vs control row ${m.toprowH}px`,
    });

    await phantom.assertNoHorizontalOverflow();
  });

  test('the zero state says its message ONCE and shows no empty id pill', async ({ phantom, page }) => {
    // v1.14.409. Two things this pins, both regressions that were LIVE for one build:
    //
    // 1. THE DOUBLED SENTENCE. deploy_forge_zeroState() used to write the same 59-character
    //    string into BOTH #hint and the status row. In the old design that read as a card with a
    //    small sub-line; once the herotag was decomposed into a full-width state pill the two
    //    copies sat ~20px apart in two type treatments and the dock looked broken. The .407
    //    comment in that function had ALREADY named this redundancy when it deleted the fourth
    //    copy (the error toast) — and the fourth was deleted while the second and third were left
    //    stacked. Division of labour: the HINT is the instruction surface, the STATUS ROW is the
    //    state surface. A zero state is a state.
    // 2. THE EMPTY ID PILL. With no focused rack the id pill rendered `● —`: a dot, a dash, and
    //    no information.
    //
    // Asserted on the aisle's REAL zero state — the harness has no Master, so this is simply what
    // the app does. That is also why populateDock() exists for the geometry tests, and why hiding
    // these members there cannot hide a regression: this test is the other half of that contract.
    await phantom.boot();
    await openAisle(page);

    const m = await page.evaluate(() => {
      const vis = (el) => !!el && el.getBoundingClientRect().height > 0;
      const idPill = document.querySelector('#forge3d-sheet .statpill.st-id');
      const state = document.getElementById('tagState');
      // Count only the LEAF carriers, so a wrapper is never counted as a second copy.
      const carriers = [...document.querySelectorAll('#forge3d-sheet *')]
        .filter((e) => /NO MASTER LOADED/i.test(e.textContent || '')
          && ![...e.children].some((c) => /NO MASTER LOADED/i.test(c.textContent || ''))
          && e.getBoundingClientRect().height > 0)
        .map((e) => e.id || String(e.className));
      return {
        carriers,
        idPillVisible: vis(idPill),
        stateText: state ? (state.textContent || '').trim() : null,
        stateVisible: vis(state),
      };
    });

    // The state must still be STATED — this is the no-silent-failure guarantee, not just tidiness.
    expect(m.stateVisible, 'the status row vanished in the zero state — the aisle now fails silently').toBe(true);
    expect(m.stateText).toMatch(/NO MASTER LOADED/i);

    // ...exactly once inside the dock. #forge3d-prov is the sheet HEADER (provenance), a different
    // surface with a different job, so it is excluded rather than counted as a duplicate.
    const inDock = m.carriers.filter((c) => !/forge3d-prov/.test(c));
    expect(inDock, `the zero-state message is rendered ${inDock.length} times inside the dock: ${JSON.stringify(inDock)}`).toHaveLength(1);

    expect(m.idPillVisible, 'the id pill is visible with no focused rack — it can only read "● —"').toBe(false);
  });

  test('the walk instruction leaves the row when there is no aisle to walk', async ({ phantom, page }, testInfo) => {
    // The zero state must not tell a tech to TAP FLANKS TO WALK an empty aisle. Before
    // .409 that was true for free (the message replaced the entire concatenated
    // string); now it is carried by writeStatusMessage() toggling [hidden], so it is a
    // real property that can regress. Driven through the DOM contract rather than the
    // internal helper, which is IIFE-scoped and unreachable from page scope.
    await phantom.boot();
    await openAisle(page);

    const read = () => page.evaluate(() => {
      const w = document.getElementById('tagWalk');
      return {
        hidden: w.hidden,
        display: getComputedStyle(w).display,
        inRow: w.getBoundingClientRect().width > 0,
        state: document.getElementById('tagState').textContent.trim(),
      };
    });

    // ZERO STATE, exactly as deploy_forge_zeroState writes it (:20050, verbatim).
    const ZERO = 'NO MASTER LOADED · LOAD A MASTER FILE TO BUILD YOUR LOADOUT';
    await page.evaluate((msg) => {
      document.getElementById('tagId').textContent = '—';
      document.getElementById('tagState').textContent = msg;
      document.getElementById('tagWalk').hidden = true;
    }, ZERO);
    await settle(page);

    const zero = await read();
    expect(zero.state, 'the zero-state message is not in the state pill').toBe(ZERO);
    expect(zero.hidden, 'the walk pill is still present in the zero state').toBe(true);
    // [hidden] is a UA rule that an author display:inline-flex overrides — the app has
    // to re-state it, and this is the assertion that says whether it did.
    expect(zero.display, 'the walk pill is [hidden] but still display:' + zero.display + ' — the author rule at :9145 is missing, so the empty aisle tells the tech to walk flanks that are not there').toBe('none');
    expect(zero.inRow, 'the walk pill still occupies width in the zero state').toBe(false);

    // FOCUSED: the instruction comes back.
    await page.evaluate(() => {
      document.getElementById('tagState').textContent = '0/0 RACKED';
      document.getElementById('tagWalk').hidden = false;
    });
    await settle(page);

    const live = await read();
    expect(live.hidden, 'the walk pill never returned when a rack was focused').toBe(false);
    expect(live.display, 'the walk pill is not displayed when focused').not.toBe('none');
    expect(live.inRow, 'the walk pill has zero width when focused').toBe(true);

    testInfo.annotations.push({ type: 'walk-pill', description: `zero: display ${zero.display} · focused: display ${live.display}` });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // E · THE SHEET AS A WHOLE
  // ───────────────────────────────────────────────────────────────────────────

  test('opening and closing the aisle raises no uncaught exception and never overflows horizontally', async ({ phantom, page }, testInfo) => {
    await stubHealthProbe(page);   // must precede boot() — see the ENV_NOISE block
    await phantom.boot();

    for (let i = 0; i < 2; i++) {
      await openAisle(page);
      await setChips(page, i === 0 ? 0 : 5);          // the two extremes of the row
      await phantom.assertNoHorizontalOverflow();     // Rule 1, with the aisle open

      // Close through the REAL control (onclick="forge3d_close()" :13172), so a dead
      // close button fails this test rather than being stepped around.
      await page.locator('#forge3d-sheet .rd-sheet-close').click();
      await expect(page.locator('#forge3d-sheet')).not.toHaveClass(/(^|\s)open(\s|$)/);
      await expect(page.locator('#forge3d-sheet')).toBeHidden();
      await phantom.assertNoHorizontalOverflow();     // and with it closed
    }

    const hard = phantom.hardErrors();
    const noise = hard.filter((e) => isEnvNoise(e.text));
    const app = hard.filter((e) => !isEnvNoise(e.text));
    if (noise.length) {
      // Printed every run so a partition can never quietly become the reason a real
      // error was missed.
      // eslint-disable-next-line no-console
      console.log(`[08-forge-layout] ${noise.length} ENVIRONMENT console entr${noise.length === 1 ? 'y' : 'ies'} partitioned locally (NOT allowlisted): ${JSON.stringify(noise.map((e) => e.text.slice(0, 120)))}`);
    }
    expect(app, `console errors on two aisle open/close round trips:\n${app.map((e) => `  [${e.type}] ${e.text}`).join('\n')}`).toEqual([]);

    // An uncaught EXCEPTION is never environmental. Asserted with no partition at
    // all, so no filter above can hide one.
    const thrown = hard.filter((e) => e.type === 'pageerror');
    expect(thrown, `uncaught exceptions across the aisle round trips:\n${thrown.map((e) => `  ${e.text}`).join('\n')}`).toEqual([]);

    testInfo.annotations.push({ type: 'console', description: `${app.length} app · ${noise.length} environment` });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // F · WHAT THIS HARNESS CANNOT ANSWER
  // ───────────────────────────────────────────────────────────────────────────

  test('the bottom strip clears the iPhone home indicator', async ({ phantom, page }, testInfo) => {
    await phantom.boot();
    await openAisle(page);
    const m = await snapshot(page);

    // MEASURED, not assumed. On WebKit-for-Windows env(safe-area-inset-bottom)
    // resolves to 0.00px, so there is no inset to clear and a "pass" here would be a
    // pass over nothing. The skip is the honest result: this requirement is owed to
    // the physical iPhone gate and to nothing in this suite.
    //
    // On a runner that DOES report an inset (a real device, or a future harness that
    // emulates one) this test stops skipping and asserts the real thing: the strip's
    // bottom padding must exceed the inset, because it is declared as
    // calc(env(safe-area-inset-bottom,0px) + 16px) at :9081.
    //
    // NOTE ON PROXIES. At a 0px inset NO assertion here can tell "the env() term is
    // present" from "the env() term was deleted" — both compute to the same 16px — so
    // none is offered. The one structural half that IS verifiable is asserted in the
    // derived-clearance test above: .hint is position:absolute and anchored to
    // .hud-bottom, which is what makes the strip the SINGLE owner of the safe-area
    // term (the caption used to carry its own copy). The magnitude is owed to the
    // device; the ownership is pinned here.
    testInfo.annotations.push({ type: 'safe-area', description: `env(safe-area-inset-bottom) = ${m.safeInset}px; .hud-bottom padding-bottom = ${m.stripCss.padBottom}px` });
    test.skip(m.safeInset === 0,
      'env(safe-area-inset-bottom) resolves to 0.00px on WebKit-for-Windows, so real iPhone ' +
      'notch/home-indicator clearance cannot be verified here. Owed to the physical iPhone gate. ' +
      `Measured: strip padding-bottom = ${m.stripCss.padBottom}px, which is the +16px term alone.`);

    expect(m.stripCss.padBottom, `.hud-bottom's bottom padding (${m.stripCss.padBottom}px) does not clear the ${m.safeInset}px inset`).toBeGreaterThan(m.safeInset);
    expect(m.rects.statrow.b, 'the status row sits inside the home-indicator inset')
      .toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight) - m.safeInset + 0.5);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // E · THE PERMANENT FORGE CONTROL PLACEMENT — v1.14.410 owner ruling
  //
  // "Grid and search are scene-level utilities. They do not belong beside rack
  // navigation." These pin the RULING, not the implementation: each asserts an
  // outcome the owner stated in words, so a future refactor that quietly puts a
  // utility back into the carousel row fails here instead of in the aisle.
  // ───────────────────────────────────────────────────────────────────────────

  test('the scene utilities live above the scene, not in the rack row', async ({ phantom, page }, testInfo) => {
    await phantom.boot();
    await openAisle(page);
    await populateDock(page);
    await setChips(page, 5);

    const m = await page.evaluate(() => {
      const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
        return { x:+b.x.toFixed(1), y:+b.y.toFixed(1), w:+b.width.toFixed(1), h:+b.height.toFixed(1), right:+b.right.toFixed(1), bottom:+b.bottom.toFixed(1) }; };
      const lo = document.getElementById('loadoutBtn'), se = document.getElementById('searchBtn');
      const row = document.querySelector('#forge3d-sheet .toprow');
      const dock = document.querySelector('#forge3d-sheet .hud-bottom');
      const hdr = document.querySelector('#forge3d-sheet .rd-sheet-hdr');
      const cs = lo ? getComputedStyle(lo) : null;
      return {
        lo: r(lo), se: r(se), row: r(row), dock: r(dock), hdr: r(hdr),
        loInRow: !!(row && lo && row.contains(lo)),
        seInRow: !!(row && se && row.contains(se)),
        loInDock: !!(dock && lo && dock.contains(lo)),
        seInDock: !!(dock && se && dock.contains(se)),
        loColour: cs && cs.color, loRing: cs && cs.borderTopColor,
        vw: document.documentElement.clientWidth,
      };
    });
    const tag = `[${testInfo.project.name}]`;

    // (1) They are OUT of the rack row and out of the bottom dock entirely.
    expect(m.loInRow, `${tag} the grid button is back inside .toprow — the carousel row must hold nothing else`).toBe(false);
    expect(m.seInRow, `${tag} the search button is back inside .toprow`).toBe(false);
    expect(m.loInDock, `${tag} the grid button is back inside the bottom dock`).toBe(false);
    expect(m.seInDock, `${tag} the search button is back inside the bottom dock`).toBe(false);

    // (2) Upper region, below the header, right-aligned — and the clearance is
    //     DERIVED from the header's own box, so a taller header pushes them down
    //     instead of drawing over them.
    expect(m.lo.y, `${tag} the utility cluster (y=${m.lo.y}) is not below the header (bottom=${m.hdr.bottom})`).toBeGreaterThanOrEqual(m.hdr.bottom);
    expect(m.lo.y, `${tag} the utility cluster has drifted into the lower half of the scene (y=${m.lo.y})`).toBeLessThan(m.dock.y / 2);
    expect(m.lo.right, `${tag} the cluster is not right-aligned with the search button`).toBeCloseTo(m.se.right, 1);
    expect(m.lo.right, `${tag} the cluster overhangs the viewport`).toBeLessThanOrEqual(m.vw);

    // (3) Same dimensions, and the gloved floor still holds in their new home.
    for (const [name, b] of [['grid', m.lo], ['search', m.se]]) {
      expect(b.w, `${tag} ${name} is ${b.w}px wide — under the 44px gloved floor`).toBeGreaterThanOrEqual(44);
      expect(b.h, `${tag} ${name} is ${b.h}px tall — under the 44px gloved floor`).toBeGreaterThanOrEqual(44);
    }
    expect(m.lo.w, `${tag} the two utilities are no longer the same width`).toBeCloseTo(m.se.w, 1);
    expect(m.lo.h, `${tag} the two utilities are no longer the same height`).toBeCloseTo(m.se.h, 1);

    // (4) NO AMBER. Gold is the attention channel; a view toggle needs no attention.
    //     Asserted on the resolved colour so re-adding the class OR hard-coding the
    //     hex both fail.
    const amber = /rgba?\(\s*255,\s*(203|214),/;
    expect(m.loColour, `${tag} the grid button is drawing amber text (${m.loColour}) — gold is reserved for warning/attention`).not.toMatch(amber);
    expect(m.loRing, `${tag} the grid button is drawing an amber ring (${m.loRing})`).not.toMatch(amber);

    testInfo.annotations.push({ type: 'scene-utils', description: `grid ${JSON.stringify(m.lo)} · search ${JSON.stringify(m.se)} · header bottom ${m.hdr.bottom}` });
  });

  test('every overlay covers the scene utilities — they are not a floating hit target', async ({ phantom, page }, testInfo) => {
    // v1.14.410 — THE REGRESSION THE MOVE INTRODUCED, AND WHY THE NUMBER IS LOAD-BEARING.
    // #forge3d-hud is position:absolute with z-index:5, so it ESTABLISHES A STACKING CONTEXT
    // and every z-index inside it — picker 55, search overlay 50, detail panel 40 — is flattened
    // to 5 at sheet level. The utility cluster lives OUTSIDE that context (the header is
    // position:relative/z-auto and makes none), so its own z-index competes with the whole HUD.
    // At 6 it painted OVER an open picker and elementFromPoint RETURNED IT: a tap while choosing
    // racks fired the loadout button instead. Screenshots caught this; the rect measurements did
    // not, because nothing moved — only the paint order changed.
    //
    // This asserts the OUTCOME, not the number: whatever z-index anyone chooses later, an open
    // overlay must own the pixels where these buttons are.
    await phantom.boot();
    await openAisle(page);
    await populateDock(page);

    // v1.14.454 — PROBED PER BUTTON, DERIVED FROM EACH BUTTON'S OWN RECT.
    // ⚠ This previously probed two FIXED points on the cluster box — top+22 and bottom-22 — and
    // called them "grid" and "search", which silently assumed the cluster holds exactly two
    // controls with search at the bottom. `.454` added a third (#walkBtn) and the assumption broke
    // immediately: at 44px tall with 10px gaps the cluster is 152px, so bottom-22 = 130 is the
    // THIRD button's centre, while search moved to 54..98 where nothing probed at all. The test
    // reported "search is not hit-testable (got walkBtn)" against a cluster where nothing overlaps
    // and every button is fine. It was measuring ordinal position, not the invariant.
    // The invariant is per control: on the bare scene each one owns its own pixels, and when an
    // overlay opens the overlay owns them. Ask each button where its own centre lands, so the
    // button the next ship adds is covered without editing this file.
    const topmostAtUtils = () => page.evaluate(() => {
      const su = document.getElementById('sceneUtils');
      if (!su) return null;
      const out = {};
      Array.from(su.querySelectorAll('.hudbtn')).forEach((btn) => {
        const b = btn.getBoundingClientRect();
        const e = document.elementFromPoint(Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2));
        // an <svg> or glyph child still means the button owns the pixel; .hudbtn resolves any of
        // them without naming ids one by one.
        const owner = e ? (e.closest('.hudbtn, #picker, .detail-panel, .search-overlay') || e) : null;
        out[btn.id || '(unnamed)'] = owner
          ? (owner.id || (typeof owner.className === 'string' ? owner.className.split(/\s+/)[0] : owner.tagName))
          : 'null';
      });
      return out;
    });
    const tag = `[${testInfo.project.name}]`;
    const ids = (m) => Object.keys(m || {});

    // (1) On the bare scene the utilities must be LIVE — the floor case, for EVERY control.
    const onScene = await topmostAtUtils();
    expect(onScene, `${tag} the utility cluster is missing entirely`).not.toBeNull();
    expect(ids(onScene).length, `${tag} the cluster reported no controls — this test would assert nothing`).toBeGreaterThanOrEqual(2);
    for (const id of ids(onScene)) {
      expect(onScene[id], `${tag} #${id} is not hit-testable on the open scene (got ${onScene[id]}) — a control that renders but cannot be tapped is a dead control`).toBe(id);
    }

    // (2) With the loadout picker open, the picker owns those pixels.
    await page.evaluate(() => document.getElementById('picker').classList.add('open'));
    await settle(page);
    const overPicker = await topmostAtUtils();
    for (const id of ids(overPicker)) {
      expect(overPicker[id], `${tag} #${id} is drawn OVER the open loadout picker — tapping while choosing racks would fire it (got ${overPicker[id]})`).toBe('picker');
    }
    await page.evaluate(() => document.getElementById('picker').classList.remove('open'));
    await settle(page);

    // (3) Same for the detail panel, which opens while a rack is focused.
    const hasPanel = await page.evaluate(() => {
      const dp = document.getElementById('detailPanel');
      if (!dp) return false;
      dp.classList.add('open');
      return true;
    });
    if (hasPanel) {
      // The panel SLIDES (transform .34s). Probing after settle() alone samples it mid-flight —
      // see settleTransform(). The invariant under test is about the overlay at REST.
      await settleTransform(page, '#forge3d-sheet .detail-panel');
      const overPanel = await topmostAtUtils();
      for (const id of ids(overPanel)) {
        expect(overPanel[id], `${tag} #${id} is drawn OVER the open detail panel (got ${overPanel[id]})`).not.toBe(id);
      }
      await page.evaluate(() => document.getElementById('detailPanel').classList.remove('open'));
      // The close slides too. Step (4) below asserts the buttons come BACK, and it was racing
      // the same 340ms in the other direction — passing only because a barely-started close
      // also leaves the probe point uncovered. Wait for the panel to be fully gone.
      await settleTransform(page, '#forge3d-sheet .detail-panel');
    }

    // (4) And they come back. A control permanently buried is the opposite failure.
    const back = await topmostAtUtils();
    for (const id of ids(back)) {
      expect(back[id], `${tag} #${id} never became tappable again after the overlays closed (got ${back[id]})`).toBe(id);
    }

    // (5) v1.14.416 — THE 340ms TAP WINDOW, pinned by sampling MID-SLIDE ON PURPOSE.
    // Every check above measures at rest, which is correct for a layering invariant. This one
    // is deliberately the opposite: it opens the panel and probes two frames later, while the
    // panel is still travelling. That window was real — the panel was open and visibly moving,
    // its box had not yet reached these buttons, and a tap fired the loadout button instead.
    // The fix is a :has() rule keyed to .open, so the cluster goes inert the instant an overlay
    // opens rather than when it finishes arriving. If someone later "simplifies" that rule away,
    // this is the test that says so.
    if (hasPanel) {
      // DETERMINISTIC, not a race. Sampling the real slide with rAF cannot pin this: how far the
      // panel has travelled after two frames depends on frame pacing, and it varies between the
      // first open and the second on the SAME machine (241px cold, 66px warm — measured). So this
      // reproduces the window's GEOMETRY directly: panel open, transition suspended, parked at a
      // position it genuinely occupies during the slide and which does NOT yet cover the buttons.
      // That is the exact state a tap could land in. Without the :has() rule the probe returns
      // loadoutBtn here; with it the cluster is inert the moment .open appears.
      const midSlide = await page.evaluate(() => {
        const dp = document.getElementById('detailPanel');
        const su = document.getElementById('sceneUtils');
        dp.classList.add('open');
        dp.style.transition = 'none';
        dp.style.transform = 'translateY(60%)';   // mid-slide: panel top ~506px, buttons ~112px
        void dp.offsetHeight;                      // force layout so the probe reads the new box
        // v1.14.454 — the TOPMOST control, taken from the cluster rather than assumed to be the
        // loadout button, so this keeps probing the right pixel if the order ever changes.
        const first = su.querySelector('.hudbtn');
        const fb = first.getBoundingClientRect();
        const cx = Math.round(fb.x + fb.width / 2);
        const py = Math.round(fb.y + fb.height / 2);
        const panelTop = dp.getBoundingClientRect().top;
        const e = document.elementFromPoint(cx, py);
        const owner = e ? (e.closest('.hudbtn, .detail-panel') || e) : null;
        const name = owner ? (owner.id || (typeof owner.className === 'string' ? owner.className.split(/\s+/)[0] : owner.tagName)) : 'null';
        dp.style.transition = ''; dp.style.transform = ''; dp.classList.remove('open');
        return { hit: name, first: first.id, panelTop: Math.round(panelTop), probeY: py, utilsPE: getComputedStyle(su).pointerEvents };
      });
      // Guard the fixture itself: if the parked panel already covered the probe point, this test
      // would pass for the wrong reason and pin nothing.
      expect(midSlide.panelTop,
        `${tag} fixture invalid — the parked panel already covers the probe point, so this asserts nothing`)
        .toBeGreaterThan(midSlide.probeY);
      expect(midSlide.hit,
        `${tag} #${midSlide.first} is hit-testable while the detail panel is OPEN but still sliding `
        + `(panel top ${midSlide.panelTop}px, probe ${midSlide.probeY}px, cluster pointer-events: ${midSlide.utilsPE}) `
        + `— a tap in that ~340ms window fires the button instead of the panel`)
        .not.toBe(midSlide.first);
      await settleTransform(page, '#forge3d-sheet .detail-panel');
    }

    testInfo.annotations.push({ type: 'utils-layering', description: `${ids(onScene).length} controls — scene ${ids(onScene).map((i) => onScene[i]).join('/')} · picker ${ids(overPicker).map((i) => overPicker[i]).join('/')} · restored ${ids(back).map((i) => back[i]).join('/')}` });
  });

  test('the carousel owns row 1 alone, and no chip hides under a control', async ({ phantom, page }, testInfo) => {
    await phantom.boot();
    await openAisle(page);
    await populateDock(page);
    await setChips(page, 5);

    const m = await page.evaluate(() => {
      const sheet = document.getElementById('forge3d-sheet');
      const row = sheet.querySelector('.toprow');
      const chips = sheet.querySelector('.chips');
      const rb = row.getBoundingClientRect(), cb = chips.getBoundingClientRect();
      // anything in row 1 that is not the scroller itself
      const strangers = [...row.children].filter((c) => c !== chips)
        .map((c) => c.id || c.className || c.tagName.toLowerCase());
      // does any chip sit under either utility?
      const util = [document.getElementById('loadoutBtn'), document.getElementById('searchBtn')]
        .filter(Boolean).map((e) => e.getBoundingClientRect());
      const buried = [];
      sheet.querySelectorAll('.chip').forEach((ch) => {
        const b = ch.getBoundingClientRect();
        util.forEach((u) => {
          if (Math.min(b.right, u.right) - Math.max(b.x, u.x) > 0.5 &&
              Math.min(b.bottom, u.bottom) - Math.max(b.y, u.y) > 0.5) buried.push(ch.textContent.trim());
        });
      });
      // setChips() marks the FIRST chip active, and a first chip can never centre —
      // it is already at scrollLeft 0. Move the active state to the middle rack, which
      // is the case the ruling is actually about, then drive the app's own centring
      // path (updateChips, :20405).
      sheet.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      const all = [...sheet.querySelectorAll('.chip')];
      const act = all[Math.floor(all.length / 2)];
      if (act) { act.classList.add('active'); act.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' }); }
      return {
        strangers, buried, chipCount: all.length,
        rowW: +rb.width.toFixed(1), chipsW: +cb.width.toFixed(1),
        chipsL: +cb.left.toFixed(1), chipsR: +cb.right.toFixed(1),
        rowL: +rb.left.toFixed(1), rowR: +rb.right.toFixed(1),
        scrollPad: parseFloat(getComputedStyle(chips).scrollPaddingInlineStart) || 0,
        scrollW: chips.scrollWidth, clientW: chips.clientWidth,
        vw: document.documentElement.clientWidth,
      };
    });
    await settle(page);
    const centred = await page.evaluate(() => {
      const sheet = document.getElementById('forge3d-sheet');
      const act = sheet.querySelector('.chip.active'); const sc = sheet.querySelector('.chips');
      if (!act) return null;
      const a = act.getBoundingClientRect(), s = sc.getBoundingClientRect();
      return +(((a.x + a.right) / 2) - ((s.x + s.right) / 2)).toFixed(1);
    });
    const tag = `[${testInfo.project.name}]`;

    expect(m.strangers, `${tag} row 1 holds something other than the carousel: ${m.strangers.join(', ')}`).toEqual([]);
    expect(m.chipsW, `${tag} the carousel (${m.chipsW}px) does not span its row (${m.rowW}px)`).toBeCloseTo(m.rowW, 1);
    expect(m.chipsL, `${tag} the carousel's left edge left the row gutter`).toBeCloseTo(m.rowL, 1);
    expect(m.chipsR, `${tag} the carousel's right edge left the row gutter`).toBeCloseTo(m.rowR, 1);
    expect(m.chipsR, `${tag} the carousel overhangs the viewport`).toBeLessThanOrEqual(m.vw);
    expect(m.buried, `${tag} a chip is drawn underneath a utility control: ${m.buried.join(', ')}`).toEqual([]);
    expect(m.scrollPad, `${tag} the carousel has no scroll padding, so the first and last racks can park flush against the edge`).toBeGreaterThan(0);

    // v1.14.412 — THE SCROLLING HALF ONLY APPLIES WHEN THE ROW ACTUALLY SCROLLS.
    // Five racks overflow a 390px row and genuinely fit at 834 and above, so on the wide
    // tiers there is nothing to scroll and nothing to centre — that is the correct answer,
    // not a failure. The structural claims above hold at every width and are asserted
    // unconditionally; these two are gated on the state they describe. The vacuity guard
    // survives as the gate itself: where the row DOES scroll, both must still hold.
    const scrollable = m.scrollW > m.clientW;
    if (scrollable) {
      // ⚠ Math.abs, not the raw delta. A bare `toBeLessThanOrEqual(1)` passes for EVERY
      // chip sitting left of centre (-139 <= 1), which made the first draft of this
      // assertion vacuous in exactly the case it was written to catch.
      expect(centred, `${tag} the focused rack did not centre itself — its centre is ${centred}px from the scroller's`).not.toBeNull();
      expect(Math.abs(centred), `${tag} the focused rack did not centre itself (off by ${centred}px)`).toBeLessThanOrEqual(1);
    } else {
      // If it does not scroll, every rack must be visible in the row — the loadout cap is
      // 5, so a non-scrolling row that hides a rack is a real defect at this tier.
      expect(m.chipCount, `${tag} the row does not scroll (scrollW ${m.scrollW} = clientW ${m.clientW}) yet does not show all 5 racks`).toBe(5);
    }

    testInfo.annotations.push({ type: 'carousel', description: `row ${m.rowL}..${m.rowR} · scroller ${m.chipsL}..${m.chipsR} · scrollW ${m.scrollW}/${m.clientW} · scrollable ${m.scrollW > m.clientW} · centring delta ${centred}` });
  });

  test('the three context pills hold ONE baseline inside the viewport', async ({ phantom, page }, testInfo) => {
    // This is the test the .409 probe should have had. populateDock() injected a
    // SHORTER id than setFocus actually writes, so the pills looked like they fitted
    // when the real strings overflowed to x=402 on a 390px screen. Here the id comes
    // from the app's own writer, and the assertion is the owner's words: one
    // baseline, consistent height, fits cleanly at 390.
    await phantom.boot();
    await openAisle(page);
    await populateDock(page);

    const m = await page.evaluate(() => {
      const sheet = document.getElementById('forge3d-sheet');
      const pills = [...sheet.querySelectorAll('.statpill')].filter((e) => !e.hidden && e.getBoundingClientRect().height > 0);
      const row = sheet.querySelector('.statrow');
      return {
        pills: pills.map((e) => { const b = e.getBoundingClientRect();
          return { txt: e.textContent.trim(), y: +b.y.toFixed(1), h: +b.height.toFixed(1), x: +b.x.toFixed(1), right: +b.right.toFixed(1) }; }),
        rowH: +row.getBoundingClientRect().height.toFixed(1),
        rowR: +row.getBoundingClientRect().right.toFixed(1),
        wrap: getComputedStyle(row).flexWrap,
        vw: document.documentElement.clientWidth,
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    const tag = `[${testInfo.project.name}]`;

    expect(m.pills.length, `${tag} expected three context pills, found ${m.pills.length}`).toBe(3);
    const ys = m.pills.map((p) => p.y), hs = m.pills.map((p) => p.h);
    expect(Math.max(...ys) - Math.min(...ys), `${tag} the pills are not on one baseline (tops ${ys.join(', ')}) — the row wrapped`).toBeLessThanOrEqual(0.5);
    expect(Math.max(...hs) - Math.min(...hs), `${tag} the pills are not the same height (${hs.join(', ')})`).toBeLessThanOrEqual(0.5);
    expect(m.wrap, `${tag} .statrow can wrap again, so a longer string will silently stack the pills`).toBe('nowrap');

    // THE ONE THAT ACTUALLY BROKE: the last pill must end inside the row, not past it.
    const last = m.pills[m.pills.length - 1];
    expect(last.right, `${tag} "${last.txt}" ends at x=${last.right}, past the row's right edge (${m.rowR}) — the pills no longer fit at ${m.vw}px`).toBeLessThanOrEqual(m.rowR + 0.5);
    expect(last.right, `${tag} "${last.txt}" runs off the ${m.vw}px viewport (ends at ${last.right})`).toBeLessThanOrEqual(m.vw);
    expect(m.docOverflow, `${tag} the pills pushed the document past the viewport`).toBe(0);

    testInfo.annotations.push({ type: 'context-pills', description: m.pills.map((p) => `"${p.txt}" ${p.x}..${p.right}`).join(' · ') + ` · row h${m.rowH}` });
  });
});

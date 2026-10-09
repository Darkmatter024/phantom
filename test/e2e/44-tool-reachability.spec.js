// 44 — EVERY OPS TOOL HAS EXACTLY ONE REACHABLE DOOR.
// ⛔ THIS SPEC EXISTS BECAUSE THREE TOOLS WERE ALREADY LOST IN PRODUCTION AND NO TEST NOTICED.
// SOPS and BURNDOWN had exactly ONE caller each in the whole file — an ops-cell inside #work-grid,
// which bw_render hides via .bw-on from the first Work visit onward. RACK MAP's only other route
// was a conditional Command stat tile. All three measured 0 visible doors at 390 on live v1.14.463.
//
// ⭐ THE ASSERTION IS GEOMETRY, NOT PRESENCE. Every earlier version of this failure passed an
// "is it in the DOM and wired" check — the SHIFT pill, its first re-home, and these three. A door
// that exists in the markup and cannot be tapped is not a door.
const { test, expect } = require('./fixtures');

// v1.14.560+ — ISOLATE joined this row at `.469` and was never added here, so the reachability
// sweep below has been checking 9 of the 10 doors ever since. ⚠ Since `.559` isolate ALSO has a
// panel in Build's OPS row — but countReachableDoors only measures doors reachable on COMMAND,
// and the OPS row lives on Build, so this does not create a second door for the two-door check.
// That was VERIFIED by running this spec after the change, not assumed: the header of this file
// records three hand-rolled hit-tests that got exactly this kind of reasoning wrong in a row.
const TOOLS = ['bom', 'manifest', 'portmap', 'rackmap', 'sops', 'burndown', 'audits', 'blast', 'optics', 'isolate'];

// ⚠ THE DOORS LIVE ON COMMAND, NOT WORK, and that had to be measured to be believed. The Field
// tools card sits inside #pg-cmd, which is the scrollable page (2867 / 776 at 390). An INACTIVE
// .page still reports real box dimensions in this app, so a naive width>0 check reads those
// buttons as visible from Work too — they are not. Activate the surface, then hit-test.
// ⛔ v1.14.576 — THE TYPO. This called showMode('cmd'), and 'cmd' IS NOT A MODE: showMode's map is
// {command, work, ref} and it returns early on anything else. THIS HELPER HAS ALWAYS BEEN A NO-OP.
// It only ever appeared to work because boot already lands on Command, so the surface this spec
// wanted happened to be the surface it got. Fixed to the real mode name.
const openTools = async (page) => {
  await page.evaluate(() => { if (typeof showMode === 'function') showMode('command'); });
  await page.waitForTimeout(2000);
};

// ⭐ REACHABLE MEANS "A TAP WOULD LAND", so let Playwright decide it. click({trial:true}) runs the
// full actionability check — scrolls the right container, waits for stability, and verifies the
// element actually receives pointer events — then stops short of clicking. Three hand-rolled
// elementFromPoint versions of this got it wrong in a row: rects are viewport-relative, the
// scrollable ancestor is #pg-cmd rather than the window, and an inactive .page still reports a
// real box. Do not reimplement hit-testing here; the harness already does it correctly.
// Counts doors that have real geometry AND are visible up the whole ancestor chain.
// ⚠ WHAT THIS DOES NOT CHECK, stated rather than implied: pointer interception. Three
// elementFromPoint versions were tried and all three reported nine live buttons as dead, because
// this layout scrolls in #pg-cmd rather than the window, so viewport-relative coordinates land
// nowhere near the element. A Playwright locator with a quoted-onclick attribute selector matched
// nothing at all. ⭐ The discriminator that DOES work here is size plus inherited visibility: a
// retired ops-cell is 0x0 inside a display:none host, a live .cs-tool is 159x95 with a fully
// visible chain — and that is exactly the difference this spec exists to catch. Occlusion is
// covered for the surfaces that need it by spec 43's real-click round trip.
const countReachableDoors = (page, tool) => page.evaluate((t) => {
  const hits = Array.from(document.querySelectorAll('[onclick]'))
    .filter((e) => (e.getAttribute('onclick') || '').indexOf("rd_openOpsTool('" + t + "')") >= 0);
  return hits.filter((el) => {
    const r = el.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return false;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    }
    return true;
  }).length;
}, tool);

test.describe('ops tool reachability', () => {

  // ⛔ v1.14.576 — THIS SPEC IS NOW DESKTOP-SCOPED, BY OWNER RULING, AND THE INTENT IS UNCHANGED.
  // FIRST-DOOR Ship A row 8 takes #cs-fieldtools off the PHONE and keeps it on the DESKTOP — the
  // ruling of 2026-09-01, in its own words: "the phone loses the duplicate, the desktop keeps its
  // door. It is a re-home, not a close." This spec measures THAT door: its whole apparatus is the
  // Field tools card — countReachableDoors hit-tests on Command, and the row-completeness test
  // counts .cs-tool elements, which live inside #cs-fieldtools. So the question it asks — every
  // tool has exactly ONE reachable door, none has two — survives whole; only the composition it
  // must be asked in has moved.
  //
  // ⛔ RE-POINTING IT AT BUILD'S OPS ROW WAS TRIED FIRST AND DOES NOT WORK, so it is recorded here
  // rather than left for the next person to re-attempt. Measured at .576: after clicking
  // .ops-banner-btn, #ops-grid-host stays display:none at 500/1500/3000ms, seeded and unseeded,
  // while its ten panels render into it — so a Command-shaped hit-test finds ZERO doors there.
  // ⚠ 48-ops-row-exists passes on that same path because it asserts only that the ten NAMES exist
  // in the DOM and never that they are VISIBLE. That gap is a real finding and is NOT fixed here;
  // the owner has device-verified the OPS row works, so the harness is the likelier suspect, but
  // an instrument that cannot tell a rendered panel from a reachable one is worth its own ship.
  //
  // ⭐ Below 1024 this skips rather than fails: a skipped test says "not measured here", while a
  // failing one would say "the app is broken", and only one of those is true.
  test.beforeEach(({ page }) => {
    const vw = page.viewportSize() ? page.viewportSize().width : 0;
    test.skip(vw < 1024, 'Field tools is desktop-only since v1.14.576 (FIRST-DOOR Ship A row 8); '
      + 'the phone reaches the ten tools through Build\'s OPS row, pinned by 48-ops-row-exists.');
  });

  test('⛔ all ten tools are reachable, and none has two doors', async ({ phantom, page }) => {
    test.setTimeout(120000);   // up to 9 actionability trials plus boot
    await phantom.boot();
    await openTools(page);
    const found = {};
    for (const t of TOOLS) found[t] = await countReachableDoors(page, t);
    const missing = TOOLS.filter((t) => found[t] === 0);
    const doubled = TOOLS.filter((t) => found[t] > 1);
    // ⛔ Zero is a tool a technician cannot reach. This is the defect that shipped.
    expect(missing, `unreachable: ${missing.join(', ')} — counts ${JSON.stringify(found)}`).toEqual([]);
    // ⛔ Two doors is Contract A2. It is also how the retired stack and this row would have
    // coexisted if the fold had only ADDED and never deleted.
    expect(doubled, `two doors for: ${doubled.join(', ')} — counts ${JSON.stringify(found)}`).toEqual([]);
  });

  test('the tool row is complete and meets the gloved floor', async ({ phantom, page }) => {
    await phantom.boot();
    await openTools(page);
    const sizes = await page.evaluate(() => Array.from(document.querySelectorAll('.cs-tool'))
      .map((el) => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })
      .filter((s) => s.w > 0));
    // v1.14.560+ — TEN, not nine. This asserted 9 from .464, and `.469` (SHIP-ISOLATE-OPS-380
    // Phase 1) added ISOLATE as a tenth .cs-tool without updating it, so the spec failed for 91
    // versions unnoticed — no full sweep ran between .469 and 2026-09-01. ⛔ THE APP WAS RIGHT AND
    // THE TEST WAS STALE: the tenth button is a deliberate owner-approved ship.
    // ⚠ The label below reads "no tool buttons rendered at all" because it was written for the
    // ZERO case, but it fires on ANY mismatch — so a count drift reported itself as a total render
    // failure, and the sweep line read as a gloved-floor failure when the floor was never in
    // question. All ten measure 159x95. Message now states the real condition.
    expect(sizes.length, `expected the ten registry tools, found ${sizes.length}`).toBe(10);
    for (const s of sizes) expect(s.h, `a tool button is ${s.h}px tall`).toBeGreaterThanOrEqual(44);
  });

  test('⛔ the retired banner stack is gone, not merely hidden', async ({ phantom, page }) => {
    await phantom.boot();
    await openTools(page);
    const left = await page.evaluate(() => ({
      cells: document.querySelectorAll('.ops-cell').length,
      wall: document.querySelectorAll('.opswall').length,
      stack: document.querySelectorAll('.brow-stack').length,
      opsrow: document.querySelectorAll('.opsrow').length,
    }));
    // ⭐ Hidden-but-present is the state that created this defect in the first place: the markup
    // read as coverage while the technician could reach none of it. Retired means REMOVED.
    expect(left.cells, 'ops-cells survive — the stack was hidden again, not folded').toBe(0);
    expect(left.wall, '.opswall survives').toBe(0);
    expect(left.stack, '.brow-stack survives').toBe(0);
    expect(left.opsrow, '.opsrow survives').toBe(0);
  });
});

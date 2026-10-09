// ─────────────────────────────────────────────────────────────────────────────
// 32 — LOD TIERS HOLD, AND SURFACES DO NOT LEAK (v1.14.448 · R6)
//
// R6 asked for detail tiers and for the five-rack foreground window to be confirmed canonical.
// MEASURED FIRST: both are already built, and this spec pins them rather than replacing them.
//   Tier A  selected rack          targetBright 1.0  + moving spot, hero glow, focused plate
//   Tier B  the other four slots   targetBright 0.55
//           empty pads             targetBright 0.32
//   Tier C  background dummies     bright 0.30 and 0.22 across two rear rows
// That ladder is section 21's "selected looks better than neighbours without becoming a glowing
// trophy", section 22's three tiers, and section 33's quiet background, already in the aisle.
//
// ⛔ SO THE GAP R6 ACTUALLY LEAVES IS MEASUREMENT (section 46). 02-build-forge already stresses
// Build <-> aisle for ten rounds and pins canvases at 5 and live contexts at 1. Nothing stresses
// the THREE-WAY cycle Build <-> rack detail <-> aisle — which is precisely where v1.14.441 found
// two surfaces fighting over the single context, with the detail losing every exchange and
// rendering nothing at all. This spec closes that.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_lod', RACK = 'rack_lod_0';
const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];
const S4 = [[46, 'SN2201', 'sw'], [42, 'PS-1RU-06', 'pwr'], [35, 'GPU-B300-01', 'gpu'],
  [32, 'GPU-B300-01', 'gpu'], [29, 'GPU-B300-01', 'gpu'], [9, 'PS-1RU-06', 'pwr'], [2, 'CDU', 'cdu']];

function seed() {
  const now = 1750000000000;
  const slots = S4.map(([u, model, type], i) => ({
    uStart: u, uEnd: u, type, name: model + '-' + i, dns: 's4-' + u, model, status: 'racked' }));
  return {
    phantom_deployments_v1: JSON.stringify([{ id: DEP, name: 'US-QRS03', status: 'active',
      buildLead: 'J. Hamilton', created: now, updated: now, createdAt: now, updatedAt: now,
      rackCount: 1, phaseCount: 5 }]),
    phantom_deploy_racks_v1: JSON.stringify([{ id: RACK, deploymentId: DEP, rackId: 's4:099',
      room: 'HALL-4', totalU: 48, slots, notes: '', powerCircuits: [], currentPhase: 'network',
      hosts: [{ dns: 's4-35', platform: 'GPU-B300', type: 'gpu', installed: true }] }]),
    phantom_deploy_phases_v1: JSON.stringify(PHASES.map((t, i) => ({
      id: 'phase_' + RACK + '_' + t, deploymentId: DEP, rackId: RACK, type: t, seqOrder: i + 1,
      status: i < 2 ? 'complete' : (i === 2 ? 'in_progress' : 'pending'),
      tasksTotal: 0, tasksDone: 0, signedOffBy: null, signedOffAt: null,
      _gateOverride: false, _notes: '' }))),
    phantom_active_deployment: DEP, phantom_manifest_last_deploy: DEP,
  };
}

// Live contexts and canvases, read straight off the DOM. getContext on an EXISTING canvas returns
// the context three.js already holds, so this is a read and never a second allocation.
const census = (page) => page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('canvas'));
  let live = 0;
  all.forEach((cv) => {
    try {
      // ⛔ 2D FIRST — getContext('webgl') ALLOCATES on a virgin canvas, so this filter used to
      // manufacture the context it was counting. #cs-ringc is a 2D readiness ring (dct-ios :23642 @ .571)
      // and is only claimed as 2D when Command renders; since v1.14.571 boot lands on the rack
      // picker and cmd_render no longer runs at launch, so it stays virgin. MEASURED at .570 and
      // .571 with 2D probed first: identical counts at every step. The bound is NOT weakened.
      try { if (cv.getContext('2d')) return false; } catch (_) {}
      const g = cv.getContext('webgl2') || cv.getContext('webgl');
      if (g && !g.isContextLost()) live++;
    } catch (_) {}
  });
  return { canvases: all.length, live };
});

test.describe('LOD tiers hold and surfaces do not leak', () => {

  test('the LOD ladder is intact — selected, neighbours, pads, background', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await page.evaluate(() => String(window.forge3d_render));
    // Pinned as VALUES, because the whole point of a tier ladder is that the steps stay distinct.
    // If a future ship flattens neighbours to match the selected rack, section 21 is gone and the
    // aisle stops telling a technician which rack they are on.
    expect(src, 'the five-rack foreground window is gone').toContain("buildRack('run'");
    expect(src, 'the background dummy rows are gone').toContain("buildRack('dummy'");
    expect(src, 'the selected rack no longer brightens above its neighbours').toContain('isF ? 1.0');
    expect(src, 'the neighbour tier value changed').toContain('0.55');
    expect(src, 'the empty-pad tier value changed').toContain('0.32');
  });

  test('⛔ THE THREE-WAY CYCLE DOES NOT LEAK A CONTEXT OR A CANVAS', async ({ phantom, page }) => {
    test.setTimeout(420_000);
    const errs = [];
    page.on('pageerror', (e) => { if (!/workers\.dev|access control/.test(e.message)) errs.push(e.message); });
    await phantom.boot({ seed: seed() });

    const cycle = async () => {
      await page.evaluate(() => showMode('work'));
      await page.waitForTimeout(1200);
      await page.evaluate((i) => deploy_showRackDetail(i.d, i.r), { d: DEP, r: RACK });
      await page.waitForTimeout(1400);
      await page.evaluate(() => { if (typeof forge3d_open === 'function') forge3d_open(); });
      await page.waitForTimeout(1800);
      await page.evaluate(() => { if (typeof forge3d_close === 'function') forge3d_close(); });
      await page.waitForTimeout(1400);
    };

    await cycle();                       // warm-up: first-run allocation is not a leak
    const base = await census(page);
    for (let i = 0; i < 3; i++) await cycle();
    const after = await census(page);

    // Contract A6 is the invariant: ONE live attachment, ever. Exact, not a bound — "at most one"
    // was the shape that let the .427 aisle defect (value 0) hide inside a green suite for months,
    // and zero live contexts here would mean every rack surface is blank.
    expect(base.live, 'no live WebGL context after the first cycle — nothing rendered at all').toBe(1);
    expect(after.live, 'live context count changed after three more cycles').toBe(1);
    // Canvases are recycled hosts, not per-visit allocations. Growth here is the leak signal.
    expect(after.canvases, `canvas count grew ${base.canvases} -> ${after.canvases} across three cycles`)
      .toBeLessThanOrEqual(base.canvases);
    expect(errs, 'the stress cycle raised page errors').toEqual([]);
  });

  test('every surface still renders after the cycle — no silent blank', async ({ phantom, page }) => {
    test.setTimeout(420_000);
    await phantom.boot({ seed: seed() });
    for (let i = 0; i < 2; i++) {
      await page.evaluate(() => showMode('work'));
      await page.waitForTimeout(1200);
      await page.evaluate((i2) => deploy_showRackDetail(i2.d, i2.r), { d: DEP, r: RACK });
      await page.waitForTimeout(1400);
      await page.evaluate(() => { if (typeof forge3d_close === 'function') forge3d_close(); });
      await page.waitForTimeout(800);
    }
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(3500);
    // The failure this catches is the one that started the whole renderer arc: a surface that is
    // structurally present, throws nothing, logs nothing, and draws nothing.
    const bw = await page.evaluate(() => {
      const m = document.getElementById('bw-mount');
      const cv = m && m.querySelector('canvas');
      if (!cv) return 'no-canvas';
      try {
        const g = cv.getContext('webgl2') || cv.getContext('webgl');
        return !g ? 'refused' : (g.isContextLost() ? 'lost' : 'live');
      } catch (_) { return 'threw'; }
    });
    expect(bw, 'Build came back from repeated surface cycling with a dead rack preview').toBe('live');
  });
});

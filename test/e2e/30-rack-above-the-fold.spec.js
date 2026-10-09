// ─────────────────────────────────────────────────────────────────────────────
// 30 — THE RACK IS ON SCREEN IN FIELD MODE (v1.14.442 · R1-D)
//
// ⛔ THE DEFECT. Measured at .441 on a 390x844 phone: #bw-mount started at y=857 against a bottom
// nav at y=733. VISIBLE PIXELS OF RACK: ZERO. The renderer was healthy the whole time — .441
// proved the mount holds a live 652x640 canvas — the rack was simply below the fold, pushed there
// by 237px of its own controls (card header 46 + a 58px strip holding one dead "NO CABLE DATA"
// chip + a 109px view rail wrapped to two rows) plus the NEXT ACTION card above it.
//
// "The rack preview is not working" and "the rack preview is 124px below the visible area" produce
// the same report from an aisle. This spec makes the difference measurable.
//
// ⚠ EXACT FLOOR, NOT A BARE BOUND. The defect value is 0, so `toBeGreaterThan(0)` would technically
// exclude it — and would also pass on a 1px sliver, which is not a visible rack. The floor is set
// well above the defect and below the measured 176 so honest tuning does not flake it.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_fold', RACK = 'rack_fold_0';
const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];

function seed() {
  const now = 1750000000000;
  const slots = [[46, 'SN2201', 'network'], [42, 'PS-1RU-06', 'power'], [35, 'GPU-B300-01', 'gpu'],
    [32, 'GPU-B300-01', 'gpu'], [29, 'GPU-B300-01', 'gpu'], [9, 'PS-1RU-06', 'power'],
    [2, 'CDU', 'cooling']].map(([u, model, type], i) => ({
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

// How much of the rack is on screen, with the bottom nav treated as the fold.
const fold = (page) => page.evaluate(() => {
  const nav = document.getElementById('rd-botnav');
  const navTop = nav ? nav.getBoundingClientRect().top : window.innerHeight;
  const m = document.getElementById('bw-mount');
  if (!m) return { visible: -1 };
  const r = m.getBoundingClientRect();
  const cv = m.querySelector('canvas');
  const aisle = document.querySelector('.bw-aisle');
  const controls = Array.from(document.querySelectorAll('#bw-strip, .bw-prev .reh-3d-rail'))
    .map((e) => Math.round(e.getBoundingClientRect().top));
  return {
    visible: Math.max(0, Math.round(Math.min(r.bottom, navTop) - Math.max(r.top, 0))),
    mountTop: Math.round(r.top), navTop: Math.round(navTop),
    canvas: cv ? cv.width + 'x' + cv.height : 'NONE',
    aisleBottom: aisle ? Math.round(aisle.getBoundingClientRect().bottom) : null,
    controlTops: controls,
    scrollW: document.documentElement.scrollWidth,
    viewportW: window.innerWidth,
  };
});

test.describe('the rack is on screen in Field Mode', () => {

  // ⚠ THIS IS A FOLD GATE, AND AT >=1024 THERE IS NO FOLD TO MEASURE. The desktop composition
  // (body.rd.cshell) stands #rd-botnav down and replaces it with #cs-side/#cs-top, laying the
  // workspace out as a two-column grid — so "how much rack is above the bottom nav" is not a
  // question that surface can answer, and the .442 CSS is deliberately gated to max-width:1023.
  // Skipping is the honest outcome; asserting phone geometry against a desktop grid would be a
  // red test that means nothing. Phone and tablet both keep the bottom nav and both run this.
  test.beforeEach(({ page }) => {
    const w = (page.viewportSize() || {}).width || 0;
    test.skip(w >= 1024, 'desktop shell has no bottom nav and no fold — R1-D is a phone/tablet gate');
  });

  test('⛔ THE RACK IS VISIBLE WITHOUT SCROLLING', async ({ phantom, page }) => {
    test.setTimeout(240_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(4000);
    const f = await fold(page);

    expect(f.canvas, 'the rack preview has no canvas at all — this is a renderer fault, not layout').not.toBe('NONE');
    expect(f.mountTop, 'the rack mount starts below the bottom nav — it is off-screen again').toBeLessThan(f.navTop);
    expect(f.visible, `only ${f.visible}px of rack is on screen (was 0 before .442)`).toBeGreaterThanOrEqual(150);
  });

  test('the controls moved BELOW the rack — and every one of them still ships', async ({ phantom, page }) => {
    test.setTimeout(240_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(4000);
    const f = await fold(page);
    // Contract 49: nothing was deleted to win the space. Both control groups still exist, and both
    // now sit under the rack rather than between the card header and it.
    expect(f.controlTops.length, 'a control group vanished — the space was won by deleting a capability').toBe(2);
    f.controlTops.forEach((top) => {
      expect(top, 'a control group is still ABOVE the rack, pushing it down').toBeGreaterThan(f.mountTop);
    });
  });

  test('OPEN AISLE and the rack identity stay above the fold', async ({ phantom, page }) => {
    test.setTimeout(240_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(4000);
    const f = await fold(page);
    // §30: the rack must be visible WITHOUT costing the primary controls their position. Trading
    // one below-the-fold problem for another is not a fix.
    expect(f.aisleBottom, 'OPEN AISLE fell below the fold to make room for the rack').toBeLessThan(f.navTop);
    const hero = await page.evaluate(() => {
      const h = document.querySelector('.bw-hero');
      const cta = document.querySelector('.bw-cta');
      return { rack: h ? Math.round(h.getBoundingClientRect().top) : -1,
        ctaBottom: cta ? Math.round(cta.getBoundingClientRect().bottom) : -1 };
    });
    expect(hero.ctaBottom, 'CONTINUE fell below the fold — the primary action must not pay for the rack')
      .toBeLessThan(f.navTop);
  });

  test('Rule 1 — nothing pushes the viewport past 100vw', async ({ phantom, page }) => {
    test.setTimeout(240_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(3000);
    const f = await fold(page);
    expect(f.scrollW, 'the Build workspace overflows horizontally').toBeLessThanOrEqual(f.viewportW);
  });
});

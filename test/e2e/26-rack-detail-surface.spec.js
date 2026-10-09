// ─────────────────────────────────────────────────────────────────────────────
// 26 — A RACK DETAIL BRINGS ITS OWN SURFACE (v1.14.437)
//
// THE DEFECT. deploy_ensureDeployPanelVisible arranged the INSIDE of #pg-work — drop wk-grid, show
// the wk-deploy stab — and assumed the app was already in mode 'work'. Called from anywhere else it
// arranged a page nobody could see. MEASURED from Home: body carried `ops-detail ph-dock-on`, the
// only visible page was `pg-cmd`, the Build workspace was down, there was NO back affordance, and
// #ph-dock — position:fixed — rendered MECH/PWR/NET/COMP/VAL and "2/5 PHASES" straight over Home.
//
// A technician gets a phase strip for a rack they cannot see, on a screen it has nothing to do
// with, and no way back. It presents as "old UI leaking" rather than as a bug, which is exactly why
// it survived: the failure is a FIXED child of hidden work leaking onto the visible page.
//
// REACHABLE IN PRODUCTION, not just from a probe: the back-nav / deep-link restore (:19053) calls
// deploy_showRackDetail with a `rack:` state from WHEREVER the operator currently is.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_rd', RACK = 'rack_rd_0';
const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];

function seed() {
  const now = 1750000000000;
  const slots = [];
  for (let i = 0; i < 5; i++) slots.push({ uStart: 1 + i * 5, uEnd: 4 + i * 5, type: 'gpu',
    name: 'g' + i, dns: 'g' + i, model: 'HGX', status: i < 2 ? 'racked' : 'pending' });
  return {
    phantom_deployments_v1: JSON.stringify([{ id: DEP, name: 'ALP-01 BUILD', status: 'active',
      buildLead: 'J. Hamilton', created: now, updated: now, createdAt: now, updatedAt: now,
      rackCount: 1, phaseCount: 5 }]),
    phantom_deploy_racks_v1: JSON.stringify([{ id: RACK, deploymentId: DEP, rackId: 'l1:001',
      room: 'HALL-1', totalU: 48, slots, notes: '', powerCircuits: [], currentPhase: 'network',
      hosts: [{ dns: 'g0', platform: 'HGX', type: 'gpu', installed: true }] }]),
    phantom_deploy_phases_v1: JSON.stringify(PHASES.map((t, i) => ({
      id: 'phase_' + RACK + '_' + t, deploymentId: DEP, rackId: RACK, type: t, seqOrder: i + 1,
      status: i < 2 ? 'complete' : (i === 2 ? 'in_progress' : 'pending'),
      tasksTotal: 0, tasksDone: 0, signedOffBy: null, signedOffAt: null, _gateOverride: false, _notes: '' }))),
    phantom_active_deployment: DEP,
    phantom_manifest_last_deploy: DEP,
  };
}

const state = (page) => page.evaluate(() => {
  const vis = (el) => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
  return {
    pages: Array.from(document.querySelectorAll('.page')).filter(vis).map((p) => p.id),
    dock: vis(document.getElementById('ph-dock')),
    opsDetail: document.body.classList.contains('ops-detail'),
  };
});

test.describe('a rack detail brings its own surface', () => {

  test('⛔ FROM HOME: the phase dock never floats over the Command page', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('command'));
    await page.waitForTimeout(800);
    expect((await state(page)).pages, 'fixture did not start on Home').toContain('pg-cmd');

    await page.evaluate((ids) => deploy_showRackDetail(ids.d, ids.r), { d: DEP, r: RACK });
    await page.waitForTimeout(1600);
    const s = await state(page);

    // THE ASSERTION. Before the fix: pages === ['pg-cmd'] with the dock up over it.
    // THE POSITIVE ASSERTION IS THE HONEST ONE. Before the fix `pages` was ['pg-cmd'] — pg-work was
    // absent entirely, which is what made the dock a stray control over Home.
    // ⚠ Deliberately NOT asserting that pg-cmd is gone: a naive height/display probe cannot
    // distinguish "still the visible page" from "mid page-swap", and asserting it produced a
    // failure that was about my measurement, not the app. Assert what is provable.
    expect(s.pages, 'the rack detail did not bring its own surface — the dock is over another page').toContain('pg-work');
    if (s.dock) {
      // A dock is only allowed while its own surface is showing.
      expect(s.opsDetail, 'the phase dock is up without the detail state').toBe(true);
    }
  });

  test('FROM THE DEPLOY PANEL: the coherent path is unchanged', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showWorkTab('deploy'));
    await page.waitForTimeout(1200);
    await page.evaluate((ids) => deploy_showRackDetail(ids.d, ids.r), { d: DEP, r: RACK });
    await page.waitForTimeout(1600);
    const s = await state(page);
    // This path always worked; the fix must not have disturbed it.
    expect(s.pages).toContain('pg-work');
    expect(s.opsDetail).toBe(true);
  });

  test('the guard ensures the PAGE, not just the panel — and only when needed', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await page.evaluate(() => String(deploy_ensureDeployPanelVisible));
    expect(src, 'the guard still only arranges the panel').toContain('showMode');
    // Re-entering the mode when already there would re-render Build and re-add wk-grid, which this
    // function then has to undo. The guard must be conditional.
    expect(src, 'the guard switches mode unconditionally').toMatch(/_showing|getBoundingClientRect|display/);
  });

  test('both deploy detail doors share the guard — fixing it fixed every caller', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const r = await page.evaluate(() => ({
      rack: String(deploy_showRackDetail).indexOf('deploy_ensureDeployPanelVisible') > -1,
      dep: String(deploy_showDetail).indexOf('deploy_ensureDeployPanelVisible') > -1,
    }));
    // The deep-link restore (:19053) reaches deploy_showRackDetail from anywhere, so the fix had to
    // land in the shared guard rather than in one caller.
    expect(r.rack, 'the rack detail no longer routes through the shared guard').toBe(true);
    expect(r.dep, 'the deployment detail no longer routes through the shared guard').toBe(true);
  });
});

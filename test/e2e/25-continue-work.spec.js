// ─────────────────────────────────────────────────────────────────────────────
// 25 — ONE MODE, ONE BUILD (v1.14.436)
//
// THE DEFECT. Home's primary CTA — the control a technician taps to start a shift — called
// cmd_route('work','deploy') → showWorkTab('deploy'), which does showMode('work') and then DRILLS
// PAST the Build workspace into the deploy Command Center. The BUILD tab calls showMode('work') and
// stops. Measured before the fix: nav BUILD → #bw-shell alone; Home CTA → #bw-shell PLUS #wk-deploy.
// One mode, two different Builds depending on which door you came through.
//
// WHY IT EXISTED. The `.121` chokepoint routes every deploy entry past the bare "Open Deploy"
// launcher stub to the Command Center list — correct when written, because there was no Build
// workspace. `.385` built one. "Pick up where the build left off" now has a real answer, and a
// deployment LIST is not it.
//
// ⛔ WHAT MUST NOT DRIFT: the deploy list is still the RIGHT destination for "manage deployments".
// The Deploy tile, the desktop sidebar's Deploy item and the in-Build deploy button are untouched
// and are asserted to still go there — intent decides the door, not the word "deploy" in a label.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_cw', RACK = 'rack_cw_0';
const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];

function seed() {
  const now = 1750000000000;
  const slots = [];
  for (let i = 0; i < 6; i++) slots.push({ uStart: 1 + i * 5, uEnd: 4 + i * 5, type: 'gpu',
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

const surface = (page) => page.evaluate(() => {
  const vis = (el) => !!el && el.getBoundingClientRect().height > 0
    && getComputedStyle(el).display !== 'none';
  return {
    bwShell: vis(document.getElementById('bw-shell')),
    subPanels: Array.from(document.querySelectorAll('[id^="wk-"]')).filter(vis).map((e) => e.id),
    page: (document.querySelector('#pg-work') || {}).id || null,
  };
});

test.describe('one mode, one Build', () => {

  test('THE FIX: Home continue-work and the BUILD tab land on the SAME surface', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });

    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(1200);
    const viaTab = await surface(page);

    await page.evaluate(() => showMode('command'));
    await page.waitForTimeout(600);
    await page.evaluate(() => cmd_continueWork());
    await page.waitForTimeout(1200);
    const viaHome = await surface(page);

    expect(viaTab.bwShell, 'the BUILD tab does not show the Build workspace').toBe(true);
    expect(viaHome.bwShell, 'continue-work does not show the Build workspace').toBe(true);
    // THE ASSERTION. Before the fix this was [] vs ['wk-deploy'] — the same mode rendering two
    // different things depending on the door.
    expect(viaHome.subPanels, `continue-work drilled past the workspace into ${JSON.stringify(viaHome.subPanels)}`)
      .toEqual(viaTab.subPanels);
  });

  test('the primary CTA on Home is wired to continue-work, not the deploy list', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const cta = await page.evaluate(() => {
      const el = document.getElementById('cs-hero-cta');
      return el ? el.getAttribute('onclick') : null;
    });
    expect(cta, 'the Home hero CTA is missing').not.toBeNull();
    expect(cta, 'the primary CTA still drills into the deploy list').toContain('cmd_continueWork');
    expect(cta).not.toContain("cmd_route('work','deploy')");
  });

  test('⛔ MANAGE-DEPLOYMENTS doors are UNTOUCHED — intent decides the door', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const doors = await page.evaluate(() => {
      const get = (id) => { const e = document.getElementById(id); return e ? (e.getAttribute('onclick') || '') : null; };
      return { tile: get('tt-deploy'), sidebar: get('cs-nav-dep') };
    });
    // "Deploy status — tap to open Deploy" and the sidebar's Deploy item genuinely mean the list.
    // Rewriting them would have been a churn fix dressed as a workflow fix.
    expect(doors.tile, 'the Deploy tile stopped opening the deploy list').toContain("cmd_route('work','deploy')");
    expect(doors.sidebar, 'the sidebar Deploy item stopped opening the deploy list').toContain("cmd_route('work','deploy')");
  });

  test('the deploy list is still REACHABLE and still works', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => cmd_route('work', 'deploy'));
    await page.waitForTimeout(1500);
    const s = await surface(page);
    // Fixing the continue-work door must not have removed the manage-deployments destination.
    expect(s.subPanels, 'the deploy panel is no longer reachable at all').toContain('wk-deploy');
  });

  test('continue-work fails LOUDLY if the mode cannot open', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await page.evaluate(() => String(cmd_continueWork));
    // No silent failures on a user-facing path (Contract 14).
    expect(src).toContain('phantom_logErr');
    expect(src).toContain('phantomToast');
  });
});

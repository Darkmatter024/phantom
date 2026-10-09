// ─────────────────────────────────────────────────────────────────────────────
// 50 — BUILD'S EXECUTION STRIP NEVER CLAIMS SYNCED
//      (v1.14.583, STATUS-HONESTY, SITE-SYNC ship 1, owner GO 2026-09-08)
//
// ⛔ WHY THIS EXISTS. The strip under Build's header read 'LOCAL ACTIVE | SYNCED' on every
// online phone. 'SYNCED' was written whenever navigator.onLine was not false and meant nothing
// more: there is no server holding site state, no sync queue (bw_hasPendingWrites is a
// placeholder returning false) and no other device to be in sync WITH. A technician reading
// SYNCED on a second phone would believe the first phone's work had reached it. It had not.
// Contract B10: never label a panel after a mechanism the app does not have.
//
// ⭐ THE ACCEPTANCE BAR: online the strip says the one thing it can prove — ON-DEVICE · SAVED —
// offline it still says ON-DEVICE · OFFLINE (unchanged), and the word SYNCED appears nowhere
// until SITE-SYNC ships a sync that can be true.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

function seed() {
  const now = 1750000000000, DEP = 'dep_sh', RACK = 'rack_sh_0';
  const P = ['mechanical', 'power', 'network', 'compute', 'validation'];
  return {
    phantom_master_v1: JSON.stringify({
      siteCode: 'US-QRS03', sourceFile: 'strip-fixture.xlsx', savedAt: now, ingestedAt: now,
      racksByCab: { 's1:001': { cabId: 's1:001', locode: 'US-QRS03', rows: [] } },
    }),
    phantom_deployments_v1: JSON.stringify([{
      id: DEP, name: 'US-QRS03 BUILD', status: 'active', buildLead: 'J. Hamilton',
      created: now, updated: now, createdAt: now, updatedAt: now, rackCount: 1, phaseCount: 5,
    }]),
    phantom_deploy_racks_v1: JSON.stringify([{
      id: RACK, deploymentId: DEP, rackId: 's1:001', room: 'HALL-1', totalU: 48,
      slots: [], notes: '', powerCircuits: [], currentPhase: 'mechanical', hosts: [],
    }]),
    phantom_deploy_phases_v1: JSON.stringify(P.map((ty, i) => ({
      id: 'phase_' + RACK + '_' + ty, deploymentId: DEP, rackId: RACK, type: ty, seqOrder: i + 1,
      status: 'pending', tasksTotal: 0, tasksDone: 0,
      signedOffBy: null, signedOffAt: null, _gateOverride: false, _notes: '',
    }))),
    phantom_active_deployment: DEP, phantom_manifest_last_deploy: DEP,
  };
}

// The strip is built by bw_render before any routing branch, so it exists on every Build state.
const strip = (page) => page.evaluate(() => {
  const el = document.querySelector('.bw-state');
  if (!el) return null;
  const spans = el.querySelectorAll('span');
  return {
    text: el.textContent.replace(/\s+/g, ' ').trim(),
    last: spans.length ? spans[spans.length - 1].textContent : '',
  };
});

async function openBuild(phantom, page, offline) {
  await phantom.boot({ seed: seed() });
  await page.evaluate((off) => {
    window._lastPhantomMaster = JSON.parse(localStorage.getItem('phantom_master_v1'));
    if (off) {
      // The strip reads navigator.onLine at render time; shadowing the getter on the instance is
      // deterministic where context.setOffline() is not guaranteed to flip onLine in every engine.
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    }
  }, !!offline);
  await page.locator('#bn-work').click();
  await page.waitForTimeout(800);
}

test.describe("Build's execution strip never claims SYNCED", () => {

  test('⛔ online: the strip reads ON-DEVICE · SAVED, and the word SYNCED is absent', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await openBuild(phantom, page, false);
    const s = await strip(page);
    console.log('[50] online ' + JSON.stringify(s));
    expect(s, 'the execution strip did not render on Build').not.toBeNull();
    expect(s.last).toBe('ON-DEVICE · SAVED');
    expect(s.text).not.toContain('SYNCED');
    expect(s.text).toContain('LOCAL ACTIVE');
  });

  test('offline: the strip still reads ON-DEVICE · OFFLINE, and the word SYNCED is absent', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await openBuild(phantom, page, true);
    const s = await strip(page);
    console.log('[50] offline ' + JSON.stringify(s));
    expect(s, 'the execution strip did not render on Build').not.toBeNull();
    expect(s.last).toBe('ON-DEVICE · OFFLINE');
    expect(s.text).not.toContain('SYNCED');
  });
});

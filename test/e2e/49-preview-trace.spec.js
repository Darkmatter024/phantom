// ─────────────────────────────────────────────────────────────────────────────
// 49 — THE RACK PREVIEW'S SILENT PATHS REACH A SURFACE THE OPERATOR CAN READ
//      (v1.14.582, RACK-PREVIEW-CONTEXT Phase 1, owner-ruled 2026-09-08)
//
// ⛔ WHY THIS EXISTS. On 2026-09-08 BUILD's rack preview was blank on device with a CANVAS
// PRESENT and NOTHING RECORDED anywhere the owner could read. Phase 0 had to narrow four
// candidates by reading source, because the app said nothing. Every silent path in bw_mount3D
// already composed a full diag() line — and handed it to console.warn. THERE IS NO CONSOLE IN
// A COLD AISLE.
//
// ⭐ THE ACCEPTANCE BAR IS NOT "THE CODE RUNS", IT IS "THE RECORD ARRIVES AND COSTS NOTHING":
//   1. a PREVIEW/ record actually lands in the phantom_crash_log ring, and
//   2. it is typed as a TRACE, so phantom_crashErrors() excludes it and no healthy device ever
//      shows a JS-ERROR banner because the preview reported on itself.
// (2) is the half that would turn a diagnostic into a field defect, so it is asserted hardest.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const CRASH_KEY = 'phantom_crash_log';

function seed() {
  const now = 1750000000000, DEP = 'dep_pv', RACK = 'rack_pv_0';
  const P = ['mechanical', 'power', 'network', 'compute', 'validation'];
  return {
    phantom_master_v1: JSON.stringify({
      siteCode: 'US-QRS03', sourceFile: 'trace-fixture.xlsx', savedAt: now, ingestedAt: now,
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

const ring = (page) => page.evaluate((k) => {
  let e = [];
  try { e = JSON.parse(localStorage.getItem(k) || '[]'); } catch (_) { e = []; }
  return Array.isArray(e) ? e : [];
}, CRASH_KEY);

async function openBuild(phantom, page) {
  await phantom.boot({ seed: seed() });
  await page.evaluate(() => {
    window._lastPhantomMaster = JSON.parse(localStorage.getItem('phantom_master_v1'));
    if (typeof showMode === 'function') showMode('work');
  });
  // The health snapshot fires 1200ms after a successful mount. Wait past it with margin.
  await page.waitForTimeout(3000);
}

test.describe('the rack preview records what it used to swallow', () => {

  test('⛔ a PREVIEW record reaches the ring the operator can actually read', async ({ phantom, page }) => {
    test.setTimeout(120000);
    await openBuild(phantom, page);
    const entries = await ring(page);
    const mine = entries.filter((e) => e && typeof e.ctx === 'string' && e.ctx.indexOf('PREVIEW/') === 0);
    console.log('[49] PREVIEW entries: ' + JSON.stringify(mine.map((e) => e.ctx)));
    expect(mine.length, 'the preview recorded nothing at all — the instrument does not reach the ring').toBeGreaterThan(0);
    // It must carry the version that produced it, or a field report cannot be anchored.
    expect(mine[0].v, 'the record does not name the version that produced it').toMatch(/^phantom-v1\.14\./);
  });

  test('⛔ every PREVIEW record is a TRACE — a healthy device must never show a JS-ERROR banner', async ({ phantom, page }) => {
    test.setTimeout(120000);
    await openBuild(phantom, page);

    const r = await page.evaluate((k) => {
      let entries = [];
      try { entries = JSON.parse(localStorage.getItem(k) || '[]'); } catch (_) {}
      const mine = entries.filter((e) => e && typeof e.ctx === 'string' && e.ctx.indexOf('PREVIEW/') === 0);
      const banner = document.getElementById('crash-banner');
      return {
        types: mine.map((e) => e.type),
        // THE predicate the banner, the boot banner and the SYS header count all share (.406).
        countedAsErrors: (typeof phantom_crashErrors === 'function')
          ? phantom_crashErrors(entries).filter((e) => e.ctx && e.ctx.indexOf('PREVIEW/') === 0).length
          : -1,
        bannerShown: !!(banner && banner.style.display === 'block'),
      };
    }, CRASH_KEY);
    console.log('[49] ' + JSON.stringify(r));

    for (const t of r.types) {
      expect(t, 'a preview record is typed as a fault, which would raise the crash banner').toBe('trace');
    }
    expect(r.countedAsErrors, 'phantom_crashErrors counts preview records as errors — the SYS header would over-report').toBe(0);
    expect(r.bannerShown, 'a healthy preview raised the JS-ERROR banner — the instrument became the defect').toBe(false);
  });

  // ⛔ THE PROPERTY THE FIRST CUT OF THIS SHIP CLAIMED AND DID NOT HAVE. It called
  // preview_trace('DEFERRED_…', diag()) immediately before the `return` that protects a live
  // aisle — and an argument is evaluated AT THE CALL SITE, outside the instrument's try. Inside a
  // block whose catch is EMPTY, a throw in diag() would have skipped that return, been swallowed,
  // and fallen through into rackElevation_render3D: Build re-acquiring and disposing the live
  // aisle, which is the .405 defect, re-created by the instrument built to diagnose it.
  // ⭐ The fix is structural — preview_trace takes a THUNK and evaluates it inside its own try —
  // so this test asserts the guarantee itself, not the three call sites that happened to need it.
  test('⛔ a throwing detail can never escape the instrument', async ({ phantom, page }) => {
    test.setTimeout(120000);
    await phantom.boot({ seed: seed() });
    const r = await page.evaluate((k) => {
      let escaped = false;
      try {
        preview_trace('PROBE_THROW_TEST', function () { throw new Error('boom'); });
      } catch (_) { escaped = true; }
      let ringParses = true;
      try { JSON.parse(localStorage.getItem(k) || '[]'); } catch (_) { ringParses = false; }
      // A plain string detail must still work — the thunk support is additive, not a replacement.
      let stringFormOk = true;
      try { preview_trace('PROBE_STRING_TEST', 'plain detail'); } catch (_) { stringFormOk = false; }
      return { escaped, ringParses, stringFormOk };
    }, CRASH_KEY);
    console.log('[49] ' + JSON.stringify(r));
    expect(r.escaped, 'a throwing detail escaped preview_trace — the instrument can alter the flow it measures').toBe(false);
    expect(r.ringParses, 'the ring was left unparseable').toBe(true);
    expect(r.stringFormOk, 'the plain-string detail form broke when thunk support was added').toBe(true);
  });

  test('the ring is not flooded — the healthy snapshot is recorded once, not once per visit', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await openBuild(phantom, page);
    // Bounce to Command and back to Build several times; each visit re-runs bw_render.
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => { if (typeof showMode === 'function') showMode('command'); });
      await page.waitForTimeout(400);
      await page.evaluate(() => { if (typeof showMode === 'function') showMode('work'); });
      await page.waitForTimeout(2000);
    }
    const entries = await ring(page);
    const live = entries.filter((e) => e && e.ctx === 'PREVIEW/MOUNT_LIVE');
    console.log('[49] MOUNT_LIVE after 4 Build visits: ' + live.length +
                ' | ring size: ' + entries.length);
    // ⛔ The ring holds 30 and is SHARED with real caught errors. A healthy line per visit would
    // flush the operator's genuine errors out to say nothing new.
    expect(live.length, 'the healthy snapshot repeated — it must be recorded once per page load').toBeLessThanOrEqual(1);
    expect(entries.length, 'the ring overflowed its 30-entry cap').toBeLessThanOrEqual(30);
  });
});

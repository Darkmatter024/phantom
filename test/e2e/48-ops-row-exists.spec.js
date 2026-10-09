// ─────────────────────────────────────────────────────────────────────────────
// 48 — BUILD'S TOOL DOOR EXISTS (v1.14.558)
//
// THE DEFECT. v1.14.473 (c199f43) removed the ops_init() call from showMode('work') and wrote that
// OPS "will be triggered on-demand when user taps the OPS control, not at boot time." That trigger
// was never wired. ops_init had ZERO callers for 85 versions, so the banner it builds was never
// inserted and the ten OPS tools it fronts had no door on Build — leaving the owner ruling of
// 2026-08-19 (Build's tool door IS the OPS row) not in effect on the shipped app.
//
// WHY IT HID. An intended deferral landed as a deletion. Nothing threw, nothing warned, and no test
// covered it, because the absence of a control is indistinguishable from a control you simply have
// not navigated to yet. Only measuring FOR it finds it — which is what this spec does.
//
// ⚠ THIS SPEC IS THE INSTRUMENT THAT WAS MISSING. It asserts the door EXISTS, not that some
// function is defined — a defined-but-uncalled function is exactly what shipped for 85 versions.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_ops', RACK = 'rack_ops_0';
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

async function gotoBuild(phantom, page) {
  await phantom.boot({ seed: seed() });
  await page.locator('#bn-work').click();
  // The row is inserted behind a double rAF so Build lays out first; wait on the end state.
  await page.waitForFunction(() => !!document.getElementById('ops-banner-container'), undefined,
    { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
}

test.describe("build's tool door exists", () => {

  test('⛔ THE DOOR: tapping BUILD produces a visible, tappable OPS control', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await gotoBuild(phantom, page);
    const door = await page.evaluate(() => {
      const btn = document.querySelector('.ops-banner-btn');
      if (!btn) return { present: false };
      const r = btn.getBoundingClientRect();
      const cs = getComputedStyle(btn);
      return { present: true, h: Math.round(r.height), w: Math.round(r.width),
               visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.height > 0,
               onScreen: r.top < innerHeight && r.bottom > 0 };
    });
    expect(door.present, 'no OPS control on Build — ops_init never ran (the .473 shape)').toBe(true);
    expect(door.visible, 'the OPS control exists but is not visible').toBe(true);
    // Cold Aisle Filter: gloved hands, 44px floor.
    expect(door.h, 'the OPS control is under the 44px tap floor — h=' + door.h).toBeGreaterThanOrEqual(44);
  });

  test('⛔ THE TOOLS: expanding the row reveals all TEN tools, correctly named', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await gotoBuild(phantom, page);
    await page.locator('.ops-banner-btn').click();
    await page.waitForTimeout(900);
    const panels = await page.evaluate(() => {
      const names = Array.from(document.querySelectorAll('#ops-grid-inner .ops-panel-name'))
        .map((n) => n.textContent.trim());
      const host = document.getElementById('ops-grid-host');
      return { names, hostDisplay: host ? getComputedStyle(host).display : '(absent)' };
    });
    expect(panels.names.length, 'the OPS row expanded but rendered no panels').toBeGreaterThan(0);

    // v1.14.559 — TEN, not nine. ISOLATE was in DEPLOY_TOOLS and in the Command Deck row but not in
    // OPS_PANELS_CONFIG, so when .558 made this row Build's tool door, nine tools came two taps
    // close and ISOLATE alone stayed ~2.9 screens down the Command Deck. Asserting the COUNT is
    // what catches the next tool that joins the registry and not the row.
    expect(panels.names.length, 'the OPS row does not carry all ten registry tools').toBe(10);
    expect(panels.names, 'ISOLATE is missing from the OPS row — the .558 gap has reopened').toContain('ISOLATE');

    // v1.14.559 — the deployment tool is OPTIC LEDGER; the fiber/MPO REFERENCE in Tools keeps
    // OPTICS. ⛔ Both assertions matter: the rename is only worth its ship if the two stop
    // colliding, so a bare OPTICS here would mean the collision is back.
    expect(panels.names, 'the deployment tool is not labelled OPTIC LEDGER').toContain('OPTIC LEDGER');
    expect(panels.names, 'a bare OPTICS is back in the OPS row — the name collision has returned').not.toContain('OPTICS');
  });

  // ── The other half of the split. Renaming the deployment tool is only correct if the REFERENCE
  // kept its own name; otherwise the ship traded one collision for a different confusion.
  test('⛔ THE SPLIT: the Tools reference card still reads OPTICS', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await phantom.boot({ seed: seed() });
    await page.locator('#bn-ref').click();
    await page.waitForTimeout(1200);
    const names = await page.evaluate(() => Array.from(
      document.querySelectorAll('#ref-grid .rf-card .rf-cname')).map((n) => n.textContent.trim()));
    expect(names, 'the Tools reference card lost its OPTICS name — the rename hit the wrong surface')
      .toContain('OPTICS');
    expect(names, 'OPTIC LEDGER leaked into the Tools reference bay; it is a deployment tool')
      .not.toContain('OPTIC LEDGER');
  });

  // ── CONTROL. The whole reason .473 pulled this call was that inserting the banner during
  // bw_render broke boot on phone-webkit. The deferral must not reintroduce that.
  test('CONTROL: Build still boots clean with the row armed — no console error, no overflow', async ({ phantom, page }) => {
    test.setTimeout(180000);
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await gotoBuild(phantom, page);

    // ⚠ ONE EXCLUSION, AND IT IS EVIDENCE-BACKED, NOT CONVENIENCE. phantomCheckApi() (:55227) fires
    // an OPTIONS probe at PHANTOM_PROXY_URL for the health strip; the harness origin is not on the
    // Worker's allowlist, so WebKit raises an access-control pageerror. MEASURED: the identical
    // error appears at .557 with ops_init NOT armed, all three stamps consistent — so it is
    // pre-existing and independent of this ship. That measurement is also what disproves .473's
    // claim that the OPS banner CAUSED the CORS errors: the banner was never the source.
    // ⛔ Do not widen this to keep the suite green. Anything else that throws is a real regression.
    const unexpected = errors.filter((e) => !/workers\.dev.*access control/i.test(e));
    expect(unexpected, 'the deferred ops_init reintroduced a boot exception').toEqual([]);
    await phantom.assertNoHorizontalOverflow();
  });

  // ── CONTROL. ops_renderPanels must stay lazy: a collapsed boot renders no panels. This is the
  // half of .473's own prescription ("re-enable when ops_renderPanels is deferred") that matters.
  test('CONTROL: a collapsed row renders no panels at boot', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await gotoBuild(phantom, page);
    const state = await page.evaluate(() => ({
      containerPresent: !!document.getElementById('ops-banner-container'),
      panelsRendered: document.querySelectorAll('#ops-grid-inner .ops-panel-name').length,
      gridDisplay: (() => { const h = document.getElementById('ops-grid-host');
        return h ? getComputedStyle(h).display : '(absent)'; })(),
    }));
    expect(state.containerPresent, 'the row did not arm at all').toBe(true);
    expect(state.panelsRendered, 'panels were rendered on a COLLAPSED boot — the lazy path broke').toBe(0);
  });
});

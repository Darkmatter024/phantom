// ─────────────────────────────────────────────────────────────────────────────
// 27 — THE RACK DETAIL'S CAPABILITIES COME HOME (v1.14.438 · merge step 2 of 4)
//
// Measured at .437: the rack-detail surface is a SECOND Build workspace. Both carry the current
// rack, the next action, OPEN AISLE, a rack elevation and phase state. The ONLY things that existed
// solely there were ASSIGN, QR and LOG NOTE — three capabilities a technician could reach only by
// leaving the operational centre for a parallel screen doing the same job. Contract A7: Build IS
// the operational centre.
//
// ⛔ ADDITIVE BY DESIGN. The rack detail keeps working and keeps its own buttons. Retiring it is the
// LAST step, after the phase dock moves, because the back-nav restore path lands there and .437
// only just made that landing coherent. This spec asserts BOTH halves of that.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_cap', RACK = 'rack_cap_0';
const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];

function seed() {
  const now = 1750000000000;
  const slots = [];
  for (let i = 0; i < 5; i++) slots.push({ uStart: 1 + i * 5, uEnd: 4 + i * 5, type: 'gpu',
    name: 'g' + i, dns: 'g' + i, model: 'HGX', status: i < 2 ? 'racked' : 'pending' });
  return {
    phantom_deployments_v1: JSON.stringify([{ id: DEP, name: 'ALP-01 BUILD', status: 'active',
      buildLead: 'J. Hamilton', created: now, updated: now, createdAt: now, updatedAt: now, rackCount: 1, phaseCount: 5 }]),
    phantom_deploy_racks_v1: JSON.stringify([{ id: RACK, deploymentId: DEP, rackId: 'l1:001', room: 'HALL-1',
      totalU: 48, slots, notes: '', powerCircuits: [], currentPhase: 'network',
      hosts: [{ dns: 'g0', platform: 'HGX', type: 'gpu', installed: true }] }]),
    phantom_deploy_phases_v1: JSON.stringify(PHASES.map((t, i) => ({
      id: 'phase_' + RACK + '_' + t, deploymentId: DEP, rackId: RACK, type: t, seqOrder: i + 1,
      status: i < 2 ? 'complete' : (i === 2 ? 'in_progress' : 'pending'),
      tasksTotal: 0, tasksDone: 0, signedOffBy: null, signedOffAt: null, _gateOverride: false, _notes: '' }))),
    phantom_active_deployment: DEP, phantom_manifest_last_deploy: DEP,
  };
}

const buildActions = (page) => page.evaluate(() =>
  Array.from(document.querySelectorAll('#bw-shell .bw-acts button'))
    .filter((b) => b.getBoundingClientRect().height > 0)
    .map((b) => (b.textContent || '').trim()));

test.describe('the rack capabilities live in Build', () => {

  test('ASSIGN, QR and LOG NOTE are reachable from the operational centre', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(1500);
    const acts = await buildActions(page);
    for (const label of ['Assign', 'QR', 'Log note']) {
      expect(acts, `${label} is still only on the rack-detail surface`).toContain(label);
    }
    // The ones that were already there must not have been displaced.
    expect(acts).toContain('Scan');
    expect(acts).toContain('Log blocker');
  });

  test('⛔ THEY ARE THE SAME DOORS, not copies — and all three are reachable', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const reachable = await page.evaluate(() => ({
      assign: typeof window.deploy_assignRack,
      qr: typeof window.deploy_generateRackQR,
      note: typeof window.stripeRack_logNote,
    }));
    // ⚠ Worth pinning: two of these are `async function` declarations, which a `^function` grep
    // misses. If any ever becomes IIFE-scoped, Build's buttons go dead — the exact trap that has
    // bitten this file before (showToast, deploy_forge_master, statusOf).
    expect(reachable.assign, 'deploy_assignRack is not reachable at page scope').toBe('function');
    expect(reachable.qr, 'deploy_generateRackQR is not reachable at page scope').toBe('function');
    expect(reachable.note, 'stripeRack_logNote is not reachable at page scope').toBe('function');
  });

  test('Contract 14 — with no rack resolved the buttons are ABSENT, not dead', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    // No deployment, no rack: there is nothing to assign, label or annotate.
    await phantom.boot();
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(1500);
    const acts = await buildActions(page);
    for (const label of ['Assign', 'QR', 'Log note']) {
      expect(acts, `${label} is offered with no rack to act on — a dead control`).not.toContain(label);
    }
  });

  test('ADDITIVE — the rack detail still works and still has its own buttons', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate((i) => deploy_showRackDetail(i.d, i.r), { d: DEP, r: RACK });
    await page.waitForTimeout(1600);
    const detail = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).filter((b) => b.getBoundingClientRect().height > 0)
        .map((b) => (b.textContent || '').trim().replace(/\s+/g, ' ')));
    // Retiring the detail is the LAST step of the merge, not this one. Deleting it here would strand
    // the back-nav restore path that .437 just made coherent.
    expect(detail.join(' '), 'the rack detail lost ASSIGN — this step is meant to be additive').toMatch(/ASSIGN/i);
    expect(detail.join(' '), 'the rack detail lost QR').toMatch(/\bQR\b/i);
    expect(detail.join(' '), 'the rack detail lost LOG NOTE').toMatch(/LOG NOTE/i);
  });

  test('the new buttons fail LOUDLY if a door goes missing', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await page.evaluate(() => String(bw_render));
    expect(src).toContain('phantom_logErr');
    expect(src).toContain('phantomToast');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // v1.14.439 — A DOOR THAT COMES HOME MUST ALSO COME BACK HOME.
  // `.438` moved ASSIGN into Build but deploy_assignRack's own tail still called
  // deploy_showRackDetail, so the save landed the technician on the surface the merge exists to
  // retire. Same wrong-landing shape as `.436`, one ship after `.436` fixed it.
  // ───────────────────────────────────────────────────────────────────────────

  // Count where a door's refresh lands. The stubs replace the GLOBAL bindings, which is what the
  // dispatcher's unqualified calls resolve to. `mode` selects the call under test — no eval, the
  // page's CSP would refuse it and a string call site is unreadable anyway.
  const landing = (page, mode) => page.evaluate(async (i) => {
    window.phantomPromptAsk = async () => 'A. Tech';
    const hits = { detail: 0, build: 0 };
    const realDetail = window.deploy_showRackDetail, realBuild = window.bw_render;
    window.deploy_showRackDetail = function () { hits.detail++; return realDetail.apply(this, arguments); };
    window.bw_render = function () { hits.build++; return realBuild.apply(this, arguments); };
    try {
      if (i.mode === 'build') await window.deploy_assignRack(i.d, i.r, 'build');
      else if (i.mode === 'default') await window.deploy_assignRack(i.d, i.r);
      else if (i.mode === 'baseline') window.deploy_showRackDetail(i.d, i.r);
      else window.phase_refreshSurface('nowhere', i.d, i.r);
    } finally {
      window.deploy_showRackDetail = realDetail; window.bw_render = realBuild;
    }
    return hits;
  }, { d: DEP, r: RACK, mode });

  test('⛔ ASSIGN from Build lands back on BUILD, not on the rack detail', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(1500);
    const hits = await landing(page, 'build');
    // Exact, not a bound: the defect value for `detail` is 1 and a `<= 1` would have admitted it.
    expect(hits.build, 'Build never re-rendered — the assignment is invisible where it was made').toBeGreaterThan(0);
    expect(hits.detail, '.438 shipped this: ASSIGN from Build threw the technician onto the rack detail').toBe(0);
  });

  test('the rack detail keeps its own landing — the default surface is unchanged', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    // ⚠ MEASURED, NOT ASSUMED — and measured from TWO COLD BOOTS, which is the part that bit.
    // A plain deploy_showRackDetail also re-renders Build on FIRST entry (its own nav path does
    // that, and did at .438); on a second call into an already-open detail it does not. So the two
    // measurements only compare if each starts from the same state. Sharing one page made the
    // baseline contaminate the reading and produced a red test against correct code.
    // The invariant is not "the default caller never touches Build" — it is "the default caller
    // does exactly what a direct detail render does, and nothing more."
    await phantom.boot({ seed: seed() });
    const base = await landing(page, 'baseline');

    // No third argument: exactly how the rack detail's own ASSIGN button calls it.
    await phantom.boot({ seed: seed() });
    const hits = await landing(page, 'default');
    expect(hits.detail, 'the pre-.439 caller stopped refreshing the detail — this was meant to be byte-identical').toBeGreaterThan(0);
    expect(hits.build, 'a caller that named no surface reached Build beyond what a detail render already does').toBe(base.build);
  });

  test('Contract 14 — an unknown surface says so and still lands somewhere', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    const warned = [];
    page.on('console', (m) => { if (m.type() === 'warning') warned.push(m.text()); });
    const hits = await landing(page, 'unknown');
    expect(hits.detail, 'an unknown surface refreshed NOTHING — a silent dead end').toBeGreaterThan(0);
    expect(warned.join(' '), 'an unknown surface was swallowed silently').toContain('unknown surface');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 34 — COOLANT PLUMBING NEEDS A SOURCE (v1.14.450, owner ruling 2026-08-12)
//
// ⛔ THE DEFECT. The rear assembly was ported from the mock and drawn on EVERY rack: a CDU
// cartridge, two coolant manifolds and three vertical coolant pipes. Those are LIQUID-COOLING
// hardware, and drawing them on an air-cooled cabinet asserts the rack is plumbed for liquid — a
// fact the Master never stated. Not a small claim on this fleet: ALP-01 is H100/H200 with no
// Blackwell on the floor, so the plumbing was fiction on every rack there. Contract 10, and §5's
// "never fabricate ... CDU".
//
// ⭐ THE TEST THIS SPEC ENCODES is the one the rails already pass: structure every cabinet
// physically has is honest to draw; hardware only SOME cabinets have is a claim and needs a source.
// Bus bars, cable arms and the rear door stay unconditional — every rack is powered, cabled and has
// a door. The cartridge, manifolds and pipes are gated on the Master placing a CDU in THIS rack.
//
// ⚠ AND THE HALF THAT KEEPS THIS HONEST IN BOTH DIRECTIONS: a rack that DOES declare a CDU must
// still get its plumbing. A spec that only checked for absence could be satisfied by deleting the
// rear assembly outright, which would be a different kind of lie.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];

// Two racks in one deployment: s4:099 declares a CDU at RU02, s1:002 is an air-cooled H100 rack.
const LIQUID = [[46, 'SN2201', 'sw'], [35, 'GPU-B300-01', 'gpu'], [32, 'GPU-B300-01', 'gpu'],
  [9, 'PS-1RU-06', 'pwr'], [2, 'CDU-4RU-03', 'cdu']];
const AIR = [[46, 'SN2201', 'sw'], [35, 'GPU-H100-01', 'gpu'], [32, 'GPU-H100-01', 'gpu'],
  [9, 'PS-1RU-06', 'pwr']];

const DEP = 'dep_plumb';
const mkSlots = (rows) => rows.map(([u, model, type], i) => ({
  uStart: u, uEnd: u, type, name: model + '-' + i, dns: 'd-' + u, model, status: 'racked' }));

function seed() {
  const now = 1750000000000;
  const racks = [
    { id: 'rack_liquid', deploymentId: DEP, rackId: 's4:099', room: 'HALL-4', totalU: 48,
      slots: mkSlots(LIQUID), notes: '', powerCircuits: [], currentPhase: 'network',
      hosts: [{ dns: 'd-35', platform: 'GPU-B300', type: 'gpu', installed: true }] },
    { id: 'rack_air', deploymentId: DEP, rackId: 's1:002', room: 'HALL-1', totalU: 48,
      slots: mkSlots(AIR), notes: '', powerCircuits: [], currentPhase: 'network',
      hosts: [{ dns: 'd-35', platform: 'GPU-H100', type: 'gpu', installed: true }] },
  ];
  const phases = [];
  racks.forEach((r) => PHASES.forEach((t, i) => phases.push({
    id: 'phase_' + r.id + '_' + t, deploymentId: DEP, rackId: r.id, type: t, seqOrder: i + 1,
    status: i < 2 ? 'complete' : (i === 2 ? 'in_progress' : 'pending'),
    tasksTotal: 0, tasksDone: 0, signedOffBy: null, signedOffAt: null,
    _gateOverride: false, _notes: '' })));
  return {
    phantom_deployments_v1: JSON.stringify([{ id: DEP, name: 'US-QRS03', status: 'active',
      buildLead: 'J. Hamilton', created: now, updated: now, createdAt: now, updatedAt: now,
      rackCount: 2, phaseCount: 10 }]),
    phantom_deploy_racks_v1: JSON.stringify(racks),
    phantom_deploy_phases_v1: JSON.stringify(phases),
    phantom_active_deployment: DEP, phantom_manifest_last_deploy: DEP,
  };
}

test.describe('coolant plumbing needs a source', () => {

  test('⛔ AN AIR-COOLED RACK GETS NO COOLANT PLUMBING', async ({ phantom, page }) => {
    test.setTimeout(240_000);
    await phantom.boot({ seed: seed() });
    const gated = await page.evaluate(() => {
      const src = String(window.rackGeometry_build);   // v1.14.451: the rear assembly lives here now
      return { hasGate: src.includes('_liquidCooled'), usesVocabulary: src.includes("=== 'cdu'") };
    });
    expect(gated.hasGate, 'the coolant plumbing is drawn unconditionally again').toBe(true);

    // Behavioural: the air-cooled rack's slots contain no cdu, so the gate must be false for it.
    const decide = await page.evaluate(() => {
      const air = deploy_loadRacksFor('dep_plumb').find((r) => r.id === 'rack_air');
      const liq = deploy_loadRacksFor('dep_plumb').find((r) => r.id === 'rack_liquid');
      const has = (rk) => (rk.slots || []).some((s) => Vocabulary.typeOf(s.type) === 'cdu');
      return { air: has(air), liquid: has(liq) };
    });
    expect(decide.air, 'an H100 rack with no CDU is being treated as liquid-cooled').toBe(false);
    expect(decide.liquid, 'a rack that DECLARES a CDU is not being treated as liquid-cooled').toBe(true);
  });

  test('a rack that DECLARES a CDU still gets its plumbing', async ({ phantom, page }) => {
    test.setTimeout(240_000);
    await phantom.boot({ seed: seed() });
    // The other half of the ruling. Deleting the rear assembly outright would satisfy an
    // absence-only check and would be its own fabrication — a liquid-cooled rack drawn as if it
    // were not plumbed.
    const src = await page.evaluate(() => String(window.rackGeometry_build));
    const gate = src.indexOf('if (_liquidCooled)');
    expect(gate, 'the gated branch is gone — a declared CDU would now render no plumbing').toBeGreaterThan(-1);
    const branch = src.slice(gate, gate + 1400);
    expect(branch, 'the cartridge no longer renders for a declared CDU').toContain('cartridgeMat');
    expect(branch, 'the manifolds no longer render for a declared CDU').toContain('manifoldMat');
  });

  test('structure stays unconditional — bus bars, cable arms and the rear door', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await page.evaluate(() => String(window.rackGeometry_build));
    const gate = src.indexOf('if (_liquidCooled)');
    const beforeGate = src.slice(0, gate);
    // Every rack is powered, cabled and has a door. Sweeping those into the gate would be the
    // opposite error: a real cabinet drawn as a bare frame.
    expect(beforeGate, 'bus bars fell inside the liquid-cooling gate — every rack is powered').toContain('busBarMat');
    const after = src.slice(gate);
    expect(after, 'the rear door is gone').toContain('rearDoorMat');
    expect(after, 'the cable arms are gone').toContain('cableArmMat');
  });
});

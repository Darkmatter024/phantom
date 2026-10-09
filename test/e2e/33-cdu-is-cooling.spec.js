// ─────────────────────────────────────────────────────────────────────────────
// 33 — A CDU IS COOLING, NOT POWER (v1.14.448, owner ruling 2026-08-12)
//
// ⛔ THE DEFECT. _TMAP bridged raw `cdu` onto the `pdu` DISPLAY key, so every CDU in every Master
// rendered gold, labelled itself PDU, and drew the power family's six-PSU face. S4:099 RU02 is the
// live example: a coolant distribution unit presented as a power shelf.
//
// ⭐ NO NEW COLOUR WAS INVENTED, and that is the point. The flat elevation has carried a ruled
// cooling channel all along — "cooling/fan/crah/crac keep GREEN — they are a different channel and
// were never in dispute" — and the same ruling pulled pdu OUT of that group and gave it gold.
// _TMAP was the one place that never got the memo. This aligns the bridge with the ruling.
//
// ⛔ AND NOTHING WAS FAKED TO ACHIEVE IT. No Master field, no normalized inventory value and no
// parser output changed — only the display key the raw code maps to. The CDU's service screen is
// deliberately DARK: PHANTOM receives no coolant temperature, no flow rate and no pump state, so
// the family carries no LED at all and its identity comes from form.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_cdu', RACK = 'rack_cdu_0';
const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];
// S4:099's real shape at the RUs the owner named: RU02 is the CDU, RU42/09 are power shelves.
const S4 = [[46, 'SN2201', 'sw'], [42, 'PS-1RU-06', 'pwr'], [35, 'GPU-B300-01', 'gpu'],
  [9, 'PS-1RU-06', 'pwr'], [2, 'CDU-4RU-03', 'cdu']];

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

test.describe('a CDU is cooling, not power', () => {

  test('⛔ THE VOCABULARY CLASSIFIES CDU AS ITS OWN CHANNEL', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const v = await page.evaluate(() => ({
      typeOf: Vocabulary.typeOf('cdu'),
      idempotent: Vocabulary.typeOf(Vocabulary.typeOf('cdu')),
      isKey: Vocabulary.isDisplayKey('cdu'),
      color: Vocabulary.colorOf('cdu'),
      label: Vocabulary.labelOf('cdu'),
      pduColor: Vocabulary.colorOf('pwr'),
      pduLabel: Vocabulary.labelOf('pwr'),
    }));
    expect(v.typeOf, 'a CDU still resolves to the power display key').toBe('cdu');
    // typeOf must survive being applied twice — the .397/.398 lesson about hand-listed registries.
    expect(v.idempotent, 'Vocabulary.typeOf is not idempotent for cdu').toBe('cdu');
    expect(v.isKey, 'cdu did not register as a display key — isDisplayKey derives from _TMAP').toBe(true);
    // The ruled cooling green, lifted not re-picked.
    expect(v.color, 'the CDU is not painted the ruled cooling green').toBe('#30d158');
    expect(v.label, 'the CDU still labels itself PDU').toBe('CDU');
    // ⚠ And the half that proves nothing else moved: power must be untouched.
    expect(v.pduColor, 'power lost its gold as collateral damage').toBe('#ffcb45');
    expect(v.pduLabel, 'power lost its label as collateral damage').toBe('PDU');
  });

  test('a CDU tallies as COOLING, where it used to fall through to OTHER', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    // The component tally in deploy_showRackDetail keys on RAW slot types and had no 'cdu' branch
    // at all, so a CDU was counted as an unclassified component long before it was ever
    // mis-coloured. That was a pre-existing miscount, not one caused by giving CDU a display key —
    // but giving it one without fixing this would have left the bug in place and looking deliberate.
    const src = await page.evaluate(() => String(window.deploy_showRackDetail));
    const line = src.split('\n').find((l) => l.includes('compTally.cooling++'));
    expect(line, 'the cooling tally branch is gone').toBeTruthy();
    expect(line.includes("'cdu'"), 'a CDU still falls through the tally to OTHER').toBe(true);
    // And power must still land in the same branch it always did.
    expect(line.includes("'pdu'"), 'power dropped out of the cooling tally as collateral damage').toBe(true);
  });

  test('the CDU carries NO status light — its identity is form, not telemetry', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await page.evaluate(() => String(window.rackGeometry_build));   // v1.14.451: families live here now
    const start = src.indexOf("kind === 'cooling'");
    const end = src.indexOf("kind === 'patch'");
    expect(start, 'the cooling family branch is missing').toBeGreaterThan(-1);
    expect(end, 'could not bound the cooling branch').toBeGreaterThan(start);
    const family = src.slice(start, end);
    // PHANTOM receives no coolant temperature, flow rate or pump state. A lit CDU would be a
    // reading, and section 15 says a dark inactive screen is the honest treatment.
    expect(family.includes('LedMat'), 'the CDU family grew a status LED — that would be a claim about coolant it cannot make').toBe(false);
    expect(family, 'the CDU lost its service screen').toContain('screen');
  });

  test('nothing was faked in the data to achieve the reclassification', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    // The stored rack must still say exactly what the Master said. Reclassification is a DISPLAY
    // mapping; if it ever reaches into the inventory, that is fabrication.
    const stored = await page.evaluate((i) => {
      const rack = deploy_loadRacksFor(i.d).find((r) => r.id === i.r);
      const cdu = (rack.slots || []).find((s) => s.uStart === 2);
      return { type: cdu.type, model: cdu.model, uStart: cdu.uStart, slots: rack.slots.length };
    }, { d: DEP, r: RACK });
    expect(stored.type, 'the stored slot type was rewritten — the Master is the truth, not the renderer').toBe('cdu');
    expect(stored.model, 'the stored model was rewritten').toBe('CDU-4RU-03');
    expect(stored.uStart, 'RU placement moved').toBe(2);
    expect(stored.slots, 'the component count changed').toBe(S4.length);
  });
});

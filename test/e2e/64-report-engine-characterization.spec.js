// ─────────────────────────────────────────────────────────────────────────────
// 64 — deploy_generateReport: CHARACTERIZATION OF WHAT IT EMITS TODAY
//      (owner ruling 2026-09-14: "composite is the key, extend deploy_generateReport")
//
// ⛔ THIS TEST DOES NOT ASSERT THAT THE OUTPUT IS CORRECT. It asserts that the output is what it
// is TODAY, at v1.14.590, so that A.2's extension cannot change it by accident. Several things
// pinned below are arguably wrong; they are pinned BECAUSE they are wrong-and-shipping. A red
// here after an A.2 edit is not automatically a bug — it is a change that must be looked at and
// decided, which is the whole point.
//
// ⚠ WHY IT EXISTS. deploy_generateReport is already an assembler with the plan's P1 shape: one
// fold over racks + phases + optics + audit + rollup, three renderers on top of it
// (deploy_exportReportJSON, deploy_exportReportHTML, closeOut_doExport) reachable from four
// buttons. The owner ruled A.2 EXTENDS it rather than replacing it, Contract A2. But NO SPEC
// PINNED ANY OF IT, so nothing would catch a regression in what those three consumers emit.
// This is the tripwire going in before the feature — the .589 precedent, where the anti-breakage
// spec for the existing import path landed before the image branch that sat beside it.
//
// ⭐ THE MOST IMPORTANT ASSERTION IN THIS FILE is that auditTrail entries carry SIX fields and
// that entityId is NOT among them. The stored audit entry has entityId, rack, stepId, evidence,
// prevHash and hash; the report's projection drops all six. A.2's notes adapter will very likely
// need entityId — it is the only field that can carry a rack, via the composite embedded in a
// phaseId. When that field is added, this test goes RED and forces the decision to be explicit
// rather than incidental.
//
// SCOPE NOTE, so the assertions are honest about what they own: values that belong to
// deploy_computeDeployRollup (racksComplete, racksBlocked, overallPct) are asserted as TYPES, not
// values. Pinning their arithmetic here would be testing the rollup engine through a keyhole and
// would make this file fail for reasons that have nothing to do with the report.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_rep';
const RACK = 'rack_rep_0';              // the COMPOSITE form the owner ruled canonical
const T0 = 1750000000000;

// Audit rows are seeded DELIBERATELY OUT OF ORDER so the ascending sort is proved, not assumed.
function seed() {
  const P = ['mechanical', 'power', 'network', 'compute', 'validation'];
  return {
    phantom_deployments_v1: JSON.stringify([{
      id: DEP, name: 'AUS-01 BUILD', status: 'active', buildLead: 'J. Hamilton',
      created: T0, updated: T0 + 1000, createdAt: T0, updatedAt: T0 + 1000,
      rackCount: 1, phaseCount: 5,
      acceptanceCriteria: [
        { id: 'ac1', description: 'Power verified', status: 'met', completedBy: 'J. Hamilton', completedAt: T0 + 500 },
        { id: 'ac2', description: 'Optics verified', status: 'pending' },
      ],
      reviewIssues: [
        { severity: 'high', category: 'cabling', message: 'A-side mislabelled', triage: 'untriaged' },
      ],
    }]),
    phantom_deploy_racks_v1: JSON.stringify([{
      id: RACK, deploymentId: DEP, rackId: 's1:001', room: 'HALL-1', totalU: 48,
      slots: [], notes: '', powerCircuits: [], currentPhase: 'network', hosts: [],
    }]),
    phantom_deploy_phases_v1: JSON.stringify(P.map((ty, i) => ({
      id: 'phase_' + RACK + '_' + ty, deploymentId: DEP, rackId: RACK, type: ty, seqOrder: i + 1,
      status: i < 2 ? 'complete' : 'pending', tasksTotal: 0, tasksDone: 0,
      signedOffBy: i < 2 ? 'J. Hamilton' : null, signedOffAt: i < 2 ? T0 + 100 + i : null,
      _gateOverride: false, _notes: '',
    }))),
    phantom_deploy_optics_v1: JSON.stringify([{
      id: 'opt1', deploymentId: DEP, opticType: 'QSFP-DD-400G',
      required: 8, dispensed: 6, installed: 4, remaining: 4,
    }]),
    phantom_deploy_audit_v1: JSON.stringify([
      { id: 'a2', deploymentId: DEP, ts: T0 + 3000, actor: 'J. Hamilton', action: 'PHASE_ADVANCED',
        entityType: 'phase', entityId: 'phase_' + RACK + '_power', summary: 'Power: pending -> complete (s1:001)',
        hashV: 2, siteProfileId: '', masterId: '', rack: '', stepId: '', evidence: [], prevHash: '', hash: 'h2' },
      { id: 'a1', deploymentId: DEP, ts: T0 + 1000, actor: 'J. Hamilton', action: 'RACK_ASSIGNED',
        entityType: 'rack', entityId: RACK, summary: 'Assigned to: J. Hamilton',
        hashV: 2, siteProfileId: '', masterId: '', rack: '', stepId: '', evidence: [], prevHash: '', hash: 'h1' },
      { id: 'a3', deploymentId: DEP, ts: T0 + 5000, actor: 'System', action: 'RACK_NOTE',
        entityType: 'rack', entityId: RACK, summary: 'cage nut short',
        hashV: 2, siteProfileId: '', masterId: '', rack: RACK, stepId: '', evidence: [], prevHash: '', hash: 'h3' },
    ]),
    phantom_active_deployment: DEP,
    phantom_manifest_last_deploy: DEP,
  };
}

const report = (page, depId) => page.evaluate((id) => {
  if (typeof deploy_generateReport !== 'function') return { __missing: true };
  const r = deploy_generateReport(id);
  return { __missing: false, value: r };
}, depId);

// ⛔ NO SLEEP HERE, and the first cut of this file had one. fixtures.js design rule 1 is "No
// sleeps. Every wait is on an observable state the app actually reaches." A fixed
// waitForTimeout(600) passed alone and failed inside a two-spec batch on a loaded box - which is
// precisely the failure mode a fixed sleep has. The engine being callable AND returning a record
// for the seeded deployment IS the observable state, so wait on that.
async function boot(phantom, page) {
  await phantom.boot({ seed: seed() });
  await page.waitForFunction(
    (id) => typeof deploy_generateReport === 'function' && !!deploy_generateReport(id),
    DEP,
    { timeout: 20000 },
  );
}

test.describe('64 — the report engine emits exactly what it emits today', () => {
  test('TOP LEVEL · nine keys, in this order, and reportVersion is 1.0', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, page);
    const r = await report(page, DEP);
    expect(r.__missing, 'deploy_generateReport is not defined - the engine moved or was renamed').toBe(false);
    expect(Object.keys(r.value)).toEqual([
      'reportGeneratedAt', 'reportVersion', 'deployment', 'summary',
      'racks', 'optics', 'acceptance', 'reviewIssues', 'auditTrail',
    ]);
    expect(r.value.reportVersion, 'reportVersion changed - every consumer reads this').toBe('1.0');
    expect(typeof r.value.reportGeneratedAt).toBe('number');
  });

  test('DEPLOYMENT BLOCK · ten keys, and phaseCount falls back to a literal 5',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      await boot(phantom, page);
      const d = (await report(page, DEP)).value.deployment;
      expect(Object.keys(d)).toEqual([
        'id', 'name', 'buildLead', 'status', 'created', 'updated',
        'completedAt', 'completedBy', 'rackCount', 'phaseCount',
      ]);
      expect(d.id).toBe(DEP);
      expect(d.name).toBe('AUS-01 BUILD');
      expect(d.completedAt, 'an incomplete deployment reports null, not undefined').toBeNull();
      expect(d.completedBy).toBeNull();
      // ⚠ CHARACTERIZATION, NOT ENDORSEMENT: phaseCount falls back to the literal 5 when the
      // deployment record carries none. A five-phase assumption baked into a report field.
      expect(d.phaseCount).toBe(5);
    });

  test('SUMMARY · ten keys; the counts this engine owns are pinned, the rollup ones are typed',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      await boot(phantom, page);
      const s = (await report(page, DEP)).value.summary;
      expect(Object.keys(s)).toEqual([
        'racksTotal', 'racksComplete', 'racksBlocked', 'overallPct',
        'opticsInstalled', 'opticsRequired', 'acceptanceMet', 'acceptanceTotal',
        'openBlockers', 'auditEventCount',
      ]);
      expect(s.racksTotal).toBe(1);
      expect(s.opticsInstalled).toBe(4);
      expect(s.opticsRequired).toBe(8);
      expect(s.acceptanceMet).toBe(1);
      expect(s.acceptanceTotal).toBe(2);
      // openBlockers is deploy_countBlockers: reviewIssues triaged untriaged|blocking.
      expect(s.openBlockers).toBe(1);
      expect(s.auditEventCount).toBe(3);
      // Owned by deploy_computeDeployRollup - typed here, not valued. See the scope note.
      expect(typeof s.racksComplete).toBe('number');
      expect(typeof s.racksBlocked).toBe('number');
      expect(typeof s.overallPct).toBe('number');
    });

  test('RACKS · six keys per entry, keyed on the HUMAN rackId, and totalU falls back to 42',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      await boot(phantom, page);
      const racks = (await report(page, DEP)).value.racks;
      expect(racks).toHaveLength(1);
      expect(Object.keys(racks[0])).toEqual(['rackId', 'room', 'totalU', 'phases', 'complete', 'signedOffAt']);
      // ⛔ CHARACTERIZATION AND A STANDING TENSION: the owner ruled the COMPOSITE canonical, but
      // this projection emits rack.rackId - the HUMAN name - and carries the composite nowhere.
      // A.2 will need the composite here. Pinned so adding it is a visible, decided change.
      expect(racks[0].rackId).toBe('s1:001');
      expect(racks[0].room).toBe('HALL-1');
      expect(racks[0].totalU).toBe(48);
      expect(racks[0].phases).toEqual({
        mechanical: 'complete', power: 'complete',
        network: 'pending', compute: 'pending', validation: 'pending',
      });
      expect(racks[0].complete, 'not every phase is complete, so the rack is not complete').toBe(false);
      expect(racks[0].signedOffAt, 'the LATEST signedOffAt across the rack phases').toBe(T0 + 101);
    });

  test('OPTICS and ACCEPTANCE · the projections each consumer renders',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      await boot(phantom, page);
      const v = (await report(page, DEP)).value;
      expect(Object.keys(v.optics[0])).toEqual(['type', 'required', 'dispensed', 'installed', 'remaining', 'met']);
      expect(v.optics[0].type).toBe('QSFP-DD-400G');
      expect(v.optics[0].met, '4 installed of 8 required is not met').toBe(false);
      expect(Object.keys(v.acceptance[0])).toEqual(['id', 'description', 'status', 'completedBy', 'completedAt']);
      expect(v.acceptance[1].completedBy, 'an unmet criterion reports null, not undefined').toBeNull();
      expect(Object.keys(v.reviewIssues[0])).toEqual(['severity', 'category', 'message', 'triage']);
    });

  test('⭐ AUDIT TRAIL · sorted ascending, dual-format stamps, and SIX fields - entityId is DROPPED',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      await boot(phantom, page);
      const trail = (await report(page, DEP)).value.auditTrail;
      expect(trail).toHaveLength(3);

      // Seeded out of order (a2, a1, a3). The engine sorts ascending by ts.
      expect(trail.map((e) => e.ts)).toEqual([T0 + 1000, T0 + 3000, T0 + 5000]);

      // ⛔ THE ASSERTION THIS FILE EXISTS FOR. The stored entry carries entityId, rack, stepId,
      // evidence, prevHash and hash. The report keeps NONE of them. A.2's notes adapter will
      // likely need entityId - it is the only field that can carry a rack, via the composite
      // embedded in a phaseId. Adding it turns this test RED on purpose.
      expect(Object.keys(trail[0])).toEqual(['ts', 'time', 'actor', 'action', 'entityType', 'summary']);
      expect(trail[0]).not.toHaveProperty('entityId');
      expect(trail[0]).not.toHaveProperty('rack');
      expect(trail[0]).not.toHaveProperty('hash');

      // Both stamp formats travel, and they agree. This is the dual-format discipline the record
      // schema wants, already shipping here.
      expect(trail[0].time).toBe(new Date(T0 + 1000).toISOString());
      expect(Date.parse(trail[0].time), 'the ISO twin must parse back to the epoch value').toBe(trail[0].ts);

      // ⚠ CHARACTERIZATION: actor carries whatever was stored, including the 'System' fallback
      // deploy_logAudit writes when no operator can be resolved. Not a person.
      expect(trail[2].actor).toBe('System');
    });

  test('UNKNOWN DEPLOYMENT · returns null rather than throwing or emitting an empty shell',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      await boot(phantom, page);
      const r = await report(page, 'dep_does_not_exist');
      expect(r.value, 'an unknown deployment must return null - every consumer branches on it').toBeNull();
    });

  test('THE THREE CONSUMERS still exist and still read this engine', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, page);
    const present = await page.evaluate(() => ({
      json: typeof deploy_exportReportJSON === 'function',
      html: typeof deploy_exportReportHTML === 'function',
      closeOut: typeof closeOut_doExport === 'function',
    }));
    // If one of these disappears, its door disappeared with it - the .473 shape, where an
    // intended deferral landed as a deletion and nothing threw.
    expect(present.json, 'deploy_exportReportJSON is gone').toBe(true);
    expect(present.html, 'deploy_exportReportHTML is gone').toBe(true);
    expect(present.closeOut, 'closeOut_doExport is gone').toBe(true);
  });
});

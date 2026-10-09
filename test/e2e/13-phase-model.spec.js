// ─────────────────────────────────────────────────────────────────────────────
// 13 — THE PHASE / STEP MODEL (v1.14.421, P3 of PHASE-ENGINE)
//
// WHY THIS SPEC EXISTS
// P3 is the only part of PHASE-ENGINE that adds genuinely new data rather than
// folding existing capability. Two things about it are easy to get wrong in ways
// that would not show up as a crash:
//
//   1. INVENTING A SECOND PHASE VOCABULARY. The app already has five phases —
//      DEPLOY_PHASE_TYPES — driving labels, colours, gating and the phase matrix.
//      Steps hang BENEATH those. A parallel P1..P5 taxonomy would be the
//      duplicate-concept failure this whole programme exists to delete, and it
//      would look perfectly fine in a screenshot.
//
//   2. FABRICATING PROCEDURE. Real per-platform commissioning steps are site
//      knowledge this code does not have. Thirty invented steps that LOOK
//      authoritative are fabricated telemetry wearing a checklist: the operator
//      would read procedure nobody wrote. The templates seed a placeholder per
//      phase and say so.
//
// And the invariant: spec §6.2 says a BLOCKED step REQUIRES a blockerId
// referencing a real record, and an invalid transition must be REJECTED — not
// written and repaired afterwards.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const MODEL_KEY = 'phantom_phase_model_v1';

const freshModel = (page, rack, platform) => page.evaluate(({ k, r, p }) => {
  localStorage.removeItem(k);
  localStorage.removeItem('phantom_blockers_v1');
  localStorage.removeItem('phantom_deploy_audit_v1');
  const prof = siteProfile_load();
  prof.facilityId = 'US-QRS03'; prof.operator = 'R. Vega'; prof.confirmedAt = Date.now();
  siteProfile_save(prof);
  return PHANTOM_PHASE_MODEL.forRack(r, p);
}, { k: MODEL_KEY, r: rack, p: platform });

test.describe('the phase model — built on the phases that already exist', () => {

  test('steps hang beneath the EXISTING five phases, not a new vocabulary', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(() => ({
      model: PHANTOM_PHASE_MODEL.template('H100'),
      appPhases: DEPLOY_PHASE_TYPES,
    }));
    // If these ever diverge, the app has two answers to "what is a phase".
    expect(out.model.phases.map((p) => p.id)).toEqual(out.appPhases);
    expect(out.model.phases.map((p) => p.id)).toEqual(
      ['mechanical', 'power', 'network', 'compute', 'validation']);
    // Step ids are namespaced to the phase they belong to.
    expect(out.model.phases[2].steps[0].id).toBe('network-S01');
  });

  test('all four platform templates exist, per owner ruling', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(() =>
      ['H100', 'H200', 'GB200', 'GB300'].map((p) => PHANTOM_PHASE_MODEL.template(p).rackType));
    expect(out).toEqual(['H100', 'H200', 'GB200', 'GB300']);
    const unknown = await page.evaluate(() => PHANTOM_PHASE_MODEL.template('NOT-A-PLATFORM').rackType);
    // An unrecognised platform is UNKNOWN, never silently coerced to a real one.
    expect(unknown).toBe('UNKNOWN');
  });

  test('PROVENANCE: the model says SITE_TEMPLATE and never claims the Master specified it', async ({ phantom, page }) => {
    await phantom.boot();
    const m = await page.evaluate(() => PHANTOM_PHASE_MODEL.template('GB200'));
    // The live parser reads cabs, hosts, cables and SITE-VARS — no step-level workflow at all.
    // So today every model is a site template, and it must be stored saying so.
    expect(m.source, 'a template must be labelled SITE_TEMPLATE, per spec §6.1').toBe('SITE_TEMPLATE');
    expect(m.source).not.toBe('MASTER');
  });

  test('the seeded step text is HONESTLY a placeholder, not invented procedure', async ({ phantom, page }) => {
    await phantom.boot();
    const labels = await page.evaluate(() =>
      PHANTOM_PHASE_MODEL.template('H200').phases.map((p) => p.steps[0].label));
    for (const l of labels) {
      expect(l, 'a seeded step must not read as real site procedure').toMatch(/not yet defined/i);
    }
    // And no scan expectation is guessed — a wrong expectScan misroutes a real scan.
    const expectScans = await page.evaluate(() =>
      PHANTOM_PHASE_MODEL.template('H200').phases.map((p) => p.steps[0].expectScan));
    expect(expectScans.every((e) => e === null), 'expectScan must be null, never a guess').toBe(true);
  });
});

test.describe('the step state machine (spec §6.2)', () => {

  test('states are the four named ones — no booleans', async ({ phantom, page }) => {
    await phantom.boot();
    const states = await page.evaluate(() => PHANTOM_PHASE_MODEL.STATES);
    expect(states).toEqual(['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETE']);
  });

  test('a normal transition moves the step and says where it came from', async ({ phantom, page }) => {
    await phantom.boot();
    await freshModel(page, 'u1:005', 'H100');
    const r = await page.evaluate(() =>
      PHANTOM_PHASE_MODEL.transition('u1:005', 'network-S01', 'IN_PROGRESS', { deploymentId: 'DEP-1' }));
    expect(r.ok).toBe(true);
    expect(r.from).toBe('NOT_STARTED');
    expect(r.to).toBe('IN_PROGRESS');
  });

  test('THE INVARIANT: BLOCKED without a Blocker record is REJECTED, not written', async ({ phantom, page }) => {
    await phantom.boot();
    await freshModel(page, 'u1:005', 'H100');
    const out = await page.evaluate(({ k }) => {
      const r = PHANTOM_PHASE_MODEL.transition('u1:005', 'network-S01', 'BLOCKED', { deploymentId: 'DEP-1' });
      const stored = JSON.parse(localStorage.getItem(k));
      return { r, state: stored['u1:005'].phases[2].steps[0].state };
    }, { k: MODEL_KEY });
    expect(out.r.ok, 'a blocked step with no record is an invalid state').toBe(false);
    expect(out.r.reason, 'the rejection must say WHY — "it did not work" is unactionable in an aisle')
      .toMatch(/requires a Blocker record/i);
    // Rejected means NOTHING was written — not written-then-repaired.
    expect(out.state, 'the step must not have moved').toBe('NOT_STARTED');
  });

  test('BLOCKED with a real record is accepted and links to it', async ({ phantom, page }) => {
    await phantom.boot();
    await freshModel(page, 'u1:005', 'H100');
    const out = await page.evaluate(() => {
      const bid = PHANTOM_BLOCKERS.create({ rack: 'u1:005', desc: 'Missing 12x LR4 optics', deploymentId: 'DEP-1' });
      const r = PHANTOM_PHASE_MODEL.transition('u1:005', 'network-S01', 'BLOCKED', { blockerId: bid, deploymentId: 'DEP-1' });
      return { r, bid, open: PHANTOM_BLOCKERS.open().length };
    });
    expect(out.r.ok).toBe(true);
    expect(out.r.step.blockerId, 'the step must reference the record').toBe(out.bid);
    expect(out.open).toBe(1);
  });

  test('clearing a block returns the step to IN_PROGRESS and CLOSES the record', async ({ phantom, page }) => {
    await phantom.boot();
    await freshModel(page, 'u1:005', 'H100');
    const out = await page.evaluate(() => {
      const bid = PHANTOM_BLOCKERS.create({ rack: 'u1:005', desc: 'PDU whip not landed' });
      PHANTOM_PHASE_MODEL.transition('u1:005', 'power-S01', 'BLOCKED', { blockerId: bid });
      const r = PHANTOM_PHASE_MODEL.transition('u1:005', 'power-S01', 'IN_PROGRESS', {});
      return { r, open: PHANTOM_BLOCKERS.open().length, all: PHANTOM_BLOCKERS.loadAll().length, rec: PHANTOM_BLOCKERS.byId(bid) };
    });
    expect(out.r.ok).toBe(true);
    expect(out.r.step.blockerId, 'the step no longer references a blocker').toBeNull();
    expect(out.open, 'the record is closed').toBe(0);
    expect(out.all, 'but not deleted — history is not erased').toBe(1);
    expect(out.rec.clearedAt).toBeTruthy();
  });

  test('COMPLETE credits the ACTOR from the profile', async ({ phantom, page }) => {
    await phantom.boot();
    await freshModel(page, 'u1:005', 'H100');
    const step = await page.evaluate(() =>
      PHANTOM_PHASE_MODEL.transition('u1:005', 'compute-S01', 'COMPLETE', {}).step);
    expect(step.doneBy, 'work is credited to whoever did it, never to the Site Lead').toBe('R. Vega');
    expect(step.doneAt).toBeTruthy();
  });

  test('an unknown state is rejected rather than stored', async ({ phantom, page }) => {
    await phantom.boot();
    await freshModel(page, 'u1:005', 'H100');
    const r = await page.evaluate(() => PHANTOM_PHASE_MODEL.transition('u1:005', 'network-S01', 'DONE-ISH', {}));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/unknown state/i);
  });

  test('every transition writes a STEP_STATE_CHANGE event carrying rack and step', async ({ phantom, page }) => {
    await phantom.boot();
    await freshModel(page, 'u1:005', 'H100');
    const ev = await page.evaluate(() => {
      PHANTOM_PHASE_MODEL.transition('u1:005', 'mechanical-S01', 'IN_PROGRESS', { deploymentId: 'DEP-EV' });
      const all = JSON.parse(localStorage.getItem('phantom_deploy_audit_v1') || '[]');
      return all.filter((e) => e.action === 'STEP_STATE_CHANGE').pop() || null;
    });
    expect(ev, 'a transition with no event is a step nobody can account for').toBeTruthy();
    expect(ev.rack).toBe('u1:005');
    expect(ev.stepId).toBe('mechanical-S01');
    expect(ev.summary).toMatch(/NOT_STARTED -> IN_PROGRESS/);
    expect(ev.hashV, 'and it is a v2 event with provenance').toBe(2);
  });

  test('the model store is CLASSIFIED for backup', async ({ phantom, page }) => {
    await phantom.boot();
    const known = await page.evaluate(() =>
      PHANTOM_BACKUP_EXTRA_KEYS.map((r) => r.k).concat(PHANTOM_BACKUP_NAMED_KEYS));
    expect(known, 'step state and evidence must travel in a backup').toContain('phantom_phase_model_v1');
  });
});

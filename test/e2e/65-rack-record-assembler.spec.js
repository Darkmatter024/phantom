// ─────────────────────────────────────────────────────────────────────────────
// 65 — RACK RECORD ASSEMBLER, SHIP 1: core + registry + identity and phases adapters + dev readout
//      (docs/SHIP-HANDOFF-A2-ASSEMBLER.md, GO 2026-09-15; rulings OWNER-RULINGS.md 2026-09-15 Q-1…Q-9)
//
// ⛔ EVERY EXPECTED VALUE BELOW IS DERIVED BY HAND FROM THE SEED, never from the assembler. The
// seed is built to catch the specific ways Phase 0 (docs/A2-SHIP1-PHASE0-EVIDENCE.md) says this
// can go wrong:
//   · the site profile is compared against EXACTLY what was stored — siteProfile_load would merge
//     SITE_PROFILE_DEFAULTS over it and backfill confirmedAt, and neither is a stored fact;
//   · the deployment id contains underscores, so parsing a deployment out of the composite with a
//     naive split would break;
//   · phase records are stored OUT of seqOrder, one phase that LEFT complete still carries a
//     signedOffAt (deploy_advancePhase never clears it), two completions share a millisecond, and
//     another rack's completed phase sits in the same store;
//   · empty and error are separate fixtures, because safeGet returns one fallback for absent,
//     unreadable and malformed storage — an adapter built on it would report empty for all three;
//   · pure read is proved by snapshotting ALL of localStorage around assembly, because safeGet
//     writes a quarantine record on malformed JSON.
//
// status.photoCount and photoBytes are asserted NULL: no photos adapter is registered yet, and a 0
// there would claim a measurement nobody made (Contract 10). They become numbers in Ship 4.
//
// SHIP 2 (docs/A2-SHIP2-PHASE0-EVIDENCE.md E-10; rulings OWNER-RULINGS.md 2026-09-17 Q-10…Q-17 and
// Q-A) adds the blockers adapter, the derived status.openBlockers, and the gaps list:
//   · openBlockers is a NUMBER once the blockers adapter has read the store — 0 when it reads empty,
//     null only when it reads error (Q-13);
//   · the blocker seed is stored out of time order, carries a closed record (S1), a migrated record
//     whose open time is untrustworthy (Q-11: counted, never on the timeline), another rack, a rack
//     whose composite merely STARTS WITH another rack's (rack_<dep>_10 vs rack_<dep>_1 — a prefix
//     match would claim it), an empty rack, and an opening that ties two phase completions to the ms;
//   · coverage is exactly one row per registered adapter; Ship 1's synthetic rack row lives in the
//     top-level gaps list, with its detail string unchanged (Q-A, Q-14).
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const T0 = 1750000000000;
const DEP = 'dep_1750000000000_ab12cd';      // the real id shape: 'dep_' + ms + '_' + rand6
const RACK = 'rack_' + DEP + '_0';            // the COMPOSITE, ruled canonical 2026-09-14
const OTHER = 'rack_' + DEP + '_1';
const PHASES_KEY = 'phantom_deploy_phases_v1';
const PROFILE_KEY = 'phantom_site_profile_v1';

const PROFILE = {
  schemaVersion: 2,
  id: 'site_e2e_01',
  facilityId: 'TEST-01',
  facilityName: 'Harness Facility',
  operator: 'E2E',
  siteLead: 'LEAD-X',
  confirmedAt: T0,
  lastUpdated: T0,
};

function phase(rackId, type, seqOrder, status, signedOffAt) {
  return {
    id: 'phase_' + rackId + '_' + type, deploymentId: DEP, rackId, type, seqOrder, status,
    tasksTotal: 0, tasksDone: 0,
    signedOffBy: signedOffAt === null ? null : 'E2E', signedOffAt,
    _gateOverride: false, _notes: '',
  };
}

// Stored order is deliberately NOT seqOrder.
const PHASES = [
  phase(RACK, 'validation', 5, 'pending', null),
  phase(RACK, 'power', 2, 'complete', T0 + 100),
  phase(RACK, 'network', 3, 'in_progress', T0 + 999),   // LEFT complete; its stamp was never cleared
  phase(RACK, 'mechanical', 1, 'complete', T0 + 300),
  phase(RACK, 'compute', 4, 'complete', T0 + 300),      // same millisecond as mechanical
  phase(OTHER, 'mechanical', 1, 'complete', T0 + 50),   // another rack — must not appear
];

function seed() {
  return {
    [PROFILE_KEY]: JSON.stringify(PROFILE),
    phantom_deployments_v1: JSON.stringify([{
      id: DEP, name: 'A2 SHIP1 E2E', status: 'active', buildLead: 'E2E',
      created: T0, updated: T0, rackCount: 2, phaseCount: 5,
    }]),
    phantom_deploy_racks_v1: JSON.stringify([
      { id: RACK, deploymentId: DEP, rackId: 's1:001', room: 'HALL-1', totalU: 48, slots: [], notes: '', powerCircuits: [], currentPhase: 'network' },
      { id: OTHER, deploymentId: DEP, rackId: 's1:002', room: 'HALL-1', totalU: 48, slots: [], notes: '', powerCircuits: [], currentPhase: 'power' },
    ]),
    [PHASES_KEY]: JSON.stringify(PHASES),
    phantom_active_deployment: DEP,
  };
}

// ── Ship 2: the blocker store (every field from docs/A2-SHIP2-PHASE0-EVIDENCE.md E-1b) ──────────
const BLOCKERS_KEY = 'phantom_blockers_v1';
const TEN = 'rack_' + DEP + '_10';            // starts with OTHER's composite — never OTHER's record
// Ship 1's exact string, carried into gaps unchanged (Q-14).
const RACK_GAP = 'no rack adapter in A.2: platform and masterPresent are not read, so both are null (ruling Q-2)';
const UNDATED_DETAIL = (n) => n + ' blocker(s) have no trustworthy time — counted, not on the timeline';

function blocker(blockerId, rack, over) {
  return Object.assign({
    blockerId, rack, stepId: '', phaseId: 'phase_' + rack + '_network', deploymentId: DEP,
    desc: 'note ' + blockerId, openedBy: 'E2E', openedAt: T0 + 1, clearedBy: null, clearedAt: null,
  }, over);
}

// Stored order is deliberately NOT time order.
const B_OPEN = blocker('blk_1750000000200_open', RACK, { openedAt: T0 + 200, desc: 'missing optic' });
const B_OTHER = blocker('blk_1750000000060_othr', OTHER, { openedAt: T0 + 60 });
// openedBy 'Unknown' is carried verbatim — the operator on this device is 'E2E' (I-6, Contract 9a).
const B_TIE = blocker('blk_1750000000300_tie0', RACK, { phaseId: 'phase_' + RACK + '_compute', openedAt: T0 + 300, openedBy: 'Unknown', desc: 'bent rail' });
const B_MIG = blocker('blk_migrated_phase_' + RACK + '_validation_0', RACK, {
  phaseId: 'phase_' + RACK + '_validation', migrated: true, openedAt: T0 + 999999,
  openedBy: 'Unknown (pre-v1.14.420)', desc: '(no description recorded before v1.14.420)',
});
const B_TEN = blocker('blk_1750000000070_ten0', TEN, { phaseId: 'phase_' + TEN + '_network', openedAt: T0 + 70 });
const B_EMPTY = blocker('blk_1750000000080_empt', '', { phaseId: '', openedAt: T0 + 80 });
const B_CLOSED = blocker('blk_1750000000050_clsd', RACK, {
  phaseId: 'phase_' + RACK + '_power', openedAt: T0 + 50, desc: 'bad PSU', clearedAt: T0 + 400, clearedBy: 'E2E-2',
});
const BLOCKERS = [B_OPEN, B_OTHER, B_TIE, B_MIG, B_TEN, B_EMPTY, B_CLOSED];

function seedWithBlockers() {
  return { ...seed(), [BLOCKERS_KEY]: JSON.stringify(BLOCKERS) };
}

const opened = (b) => ({ t: b.openedAt, type: 'blocker.opened', source: 'blockers',
  data: { blockerId: b.blockerId, phaseId: b.phaseId, desc: b.desc, openedBy: b.openedBy } });
const cleared = (b) => ({ t: b.clearedAt, type: 'blocker.cleared', source: 'blockers',
  data: { blockerId: b.blockerId, clearedBy: b.clearedBy } });
const phaseDone = (type, t) => ({ t, type: 'phase.completed', source: 'phases',
  data: { phaseId: 'phase_' + RACK + '_' + type, phaseType: type, signedOffBy: 'E2E' } });
const blockerEvents = (rec) => rec.timeline.filter((e) => e.source === 'blockers');

// confirmProfile:false — the fixture would otherwise overwrite PROFILE with its own SEEDED_PROFILE.
async function boot(phantom, opts = {}) {
  await phantom.boot({ confirmProfile: false, seed: seed(), ...opts });
}

const assemble = (page, rackId) => page.evaluate((id) => {
  if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR || typeof PHANTOM_RR.assemble !== 'function') {
    return { __missing: true };
  }
  return { __missing: false, value: PHANTOM_RR.assemble(id) };
}, rackId);

function present(r) {
  expect(r.__missing, 'PHANTOM_RR.assemble is not defined').toBe(false);
  return r.value;
}

const cov = (rec, name) => (rec.coverage || []).find((c) => c.adapter === name);

test.describe('65 — the Rack Record assembler (Ships 1–2)', () => {
  test('RECORD · rr-1 shape, identity facts exactly as stored, and no number for an unregistered adapter', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const rec = present(await assemble(page, RACK));

    // Q-A / Q-14: gaps is a top-level key AFTER coverage; the schema name does not move.
    expect(Object.keys(rec)).toEqual(['schema', 'assembledAt', 'site', 'rack', 'tech', 'status', 'timeline', 'evidence', 'coverage', 'gaps']);
    expect(rec.schema).toBe('rr-1');
    expect(typeof rec.assembledAt).toBe('number');

    expect(rec.site.siteId, 'siteId is the profile id, never facilityId (Q-7)').toBe('site_e2e_01');
    expect(rec.site.profile, 'profile carries stored values only: no defaults merged, no backfill').toEqual(PROFILE);

    expect(rec.rack).toEqual({ rackId: RACK, platform: null, masterPresent: null });
    expect(rec.tech, 'tech.identity is the ACTOR, never the site lead (Q-6)').toEqual({ identity: 'E2E' });

    // The seed has no blocker store: the blockers adapter read it and found nothing — a count of 0
    // that was actually taken, not a null (Q-13).
    expect(rec.status.openBlockers, 'the blockers adapter read an absent store: 0, not null (Q-13)').toBe(0);
    expect(rec.status.photoCount, 'no photos adapter is registered yet').toBeNull();
    expect(rec.status.photoBytes, 'no photos adapter is registered yet').toBeNull();
    expect(rec.evidence).toEqual({ photoIds: [] });

    // Q-A: exactly one coverage row per registered adapter, in registry order.
    expect(rec.coverage).toEqual([
      { adapter: 'identity', status: 'ok', events: 0 },
      { adapter: 'phases', status: 'ok', events: 3 },
      { adapter: 'blockers', status: 'empty', events: 0 },
    ]);
    // Q-2: platform and masterPresent are null "with a detail saying why". No rack adapter exists
    // in A.2, so the reason is a GAP, not a coverage row (Q-A), with Ship 1's string unchanged.
    expect(rec.gaps).toEqual([{ field: 'rack', detail: RACK_GAP }]);
    expect(rec.gaps[0].detail).toMatch(/platform/);
    expect(rec.gaps[0].detail).toMatch(/masterPresent/);
  });

  test('TIMELINE · completions only, ordered by time then seqOrder, this rack only, and a stale stamp is not a completion', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const rec = present(await assemble(page, RACK));

    expect(rec.timeline).toEqual([
      { t: T0 + 100, type: 'phase.completed', source: 'phases', data: { phaseId: 'phase_' + RACK + '_power', phaseType: 'power', signedOffBy: 'E2E' } },
      { t: T0 + 300, type: 'phase.completed', source: 'phases', data: { phaseId: 'phase_' + RACK + '_mechanical', phaseType: 'mechanical', signedOffBy: 'E2E' } },
      { t: T0 + 300, type: 'phase.completed', source: 'phases', data: { phaseId: 'phase_' + RACK + '_compute', phaseType: 'compute', signedOffBy: 'E2E' } },
    ]);

    // Current phase = first by seqOrder that is not complete: mechanical(1) and power(2) are, network(3) is not.
    expect(rec.status.phase).toEqual({ index: 2, of: 5, name: 'network' });
  });

  test('EMPTY · no phase data reports empty with no events — and assembly reads live storage every time', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);

    const out = await page.evaluate(({ key, rack, other }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const first = PHANTOM_RR.assemble(rack);
      const onlyOther = JSON.parse(localStorage.getItem(key)).filter((p) => p.rackId === other);
      localStorage.setItem(key, JSON.stringify(onlyOther));
      const noneForRack = PHANTOM_RR.assemble(rack);
      localStorage.removeItem(key);
      const absent = PHANTOM_RR.assemble(rack);
      return { __missing: false, first, noneForRack, absent };
    }, { key: PHASES_KEY, rack: RACK, other: OTHER });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    expect(out.first.coverage[1], 'baseline: the seeded store reads ok').toEqual({ adapter: 'phases', status: 'ok', events: 3 });
    for (const [label, rec] of [['store holds only another rack', out.noneForRack], ['key absent', out.absent]]) {
      expect(cov(rec, 'phases'), label).toEqual({ adapter: 'phases', status: 'empty', events: 0 });
      expect(rec.timeline, label).toEqual([]);
      expect(rec.status.phase, label + ' — no phases means no count (Q-4)').toEqual({ index: null, of: null, name: null });
    }
  });

  test('ERROR · malformed, wrong-shape and unreadable storage each report error with detail, and one failed adapter does not stop the next', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);

    const out = await page.evaluate(({ key, profileKey, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const good = localStorage.getItem(key);

      localStorage.setItem(key, '{not json');
      const malformed = PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, JSON.stringify({ rackId: rack }));
      const wrongShape = PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, good);
      const orig = Storage.prototype.getItem;
      let unreadable;
      try {
        Storage.prototype.getItem = function (k) {
          if (k === key) throw new Error('SecurityError: simulated unreadable storage');
          return orig.call(this, k);
        };
        unreadable = PHANTOM_RR.assemble(rack);
      } finally {
        Storage.prototype.getItem = orig;
      }

      const goodProfile = localStorage.getItem(profileKey);
      localStorage.setItem(profileKey, '{broken');
      const identityBroken = PHANTOM_RR.assemble(rack);
      localStorage.setItem(profileKey, goodProfile);

      return { __missing: false, malformed, wrongShape, unreadable, identityBroken };
    }, { key: PHASES_KEY, profileKey: PROFILE_KEY, rack: RACK });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    for (const [label, rec] of [['malformed JSON', out.malformed], ['not an array', out.wrongShape], ['getItem throws', out.unreadable]]) {
      const c = cov(rec, 'phases');
      expect(c.status, label + ' must be error, never empty (P3)').toBe('error');
      expect(c.events, label).toBe(0);
      expect(typeof c.detail === 'string' && c.detail.length > 0, label + ' carries a detail').toBe(true);
      expect(rec.timeline, label).toEqual([]);
    }

    const b = out.identityBroken;
    expect(cov(b, 'identity').status).toBe('error');
    expect(b.site.siteId, 'an unreadable profile yields no siteId').toBeNull();
    expect(b.tech.identity, 'an unreadable profile yields no identity, not an empty one').toBeNull();
    expect(cov(b, 'phases'), 'the identity failure is contained').toEqual({ adapter: 'phases', status: 'ok', events: 3 });
  });

  test('PURE READ · assembling over malformed storage writes nothing and raises no toast', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);

    const out = await page.evaluate(({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const snap = () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); }
        return o;
      };
      const toasts = () => (document.getElementById('toast-container') || { children: [] }).children.length;
      // All synchronous in one evaluate: nothing in the app can write between the two snapshots.
      localStorage.setItem(key, '{not json');
      const before = snap();
      const toastsBefore = toasts();
      const rec = PHANTOM_RR.assemble(rack);
      return { __missing: false, before, after: snap(), toastsBefore, toastsAfter: toasts(), status: rec.coverage[1].status };
    }, { key: PHASES_KEY, rack: RACK });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    expect(out.status, 'the fixture really is malformed').toBe('error');
    expect(out.after, 'assembly wrote to storage (a quarantine record is a write)').toEqual(out.before);
    expect(out.toastsAfter, 'assembly raised a toast').toBe(out.toastsBefore);
  });

  // ⚠ The next two were written AFTER the code, to cover branches the first cut left untested, and
  // each was mutation-checked (docs/A2-SHIP1-EVIDENCE.md §3) — a test written after passes on its
  // first run by construction, so that first green proves nothing on its own.
  test('STATUS · a rack with every phase complete reads of-of with no current phase name', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const out = await page.evaluate(({ key, rack, t0 }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const all = JSON.parse(localStorage.getItem(key)).map((p) => (p.rackId === rack
        ? Object.assign({}, p, { status: 'complete', signedOffBy: 'E2E', signedOffAt: t0 + 500 + p.seqOrder })
        : p));
      localStorage.setItem(key, JSON.stringify(all));
      return { __missing: false, rec: PHANTOM_RR.assemble(rack) };
    }, { key: PHASES_KEY, rack: RACK, t0: T0 });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);
    expect(out.rec.status.phase, 'all five complete: 5 of 5, and no phase is "current"').toEqual({ index: 5, of: 5, name: null });
    expect(out.rec.timeline.map((e) => e.data.phaseType)).toEqual(['mechanical', 'power', 'network', 'compute', 'validation']);
  });

  test('FOLD · an adapter that throws becomes one error row, and the adapters around it still run', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const out = await page.evaluate((rack) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const saved = PHANTOM_RR.registry;
      let rec;
      let threw = null;
      try {
        // Every registered adapter after the fault still runs — phases AND blockers.
        PHANTOM_RR.registry = [saved[0], { name: 'boom', schemaHandled: 'test fault', read() { throw new Error('kaboom'); } }, ...saved.slice(1)];
        rec = PHANTOM_RR.assemble(rack);
      } catch (e) {
        threw = String(e && e.message);
      } finally {
        PHANTOM_RR.registry = saved;
      }
      return { __missing: false, rec, threw };
    }, RACK);
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);
    expect(out.threw, 'a throwing adapter escaped assemble()').toBeNull();
    expect(out.rec.coverage.map((c) => [c.adapter, c.status, c.events]))
      .toEqual([['identity', 'ok', 0], ['boom', 'error', 0], ['phases', 'ok', 3], ['blockers', 'empty', 0]]);
    expect(out.rec.coverage[1].detail).toMatch(/kaboom/);
    expect(out.rec.timeline.length, 'the phases adapter after the fault still contributed').toBe(3);
    expect(out.rec.status.openBlockers, 'the blockers adapter after the fault still counted (Q-13)').toBe(0);
  });

  // ── SHIP 2 — the blockers adapter, derived openBlockers, and the gaps list ─────────────────────
  // Every expected value is derived by hand from BLOCKERS above and docs/A2-SHIP2-PHASE0-EVIDENCE.md
  // E-5 / E-6, never from the adapter.
  test('BLOCKERS · TIMELINE · opened and cleared merge by time with the phases, this rack only, no event for an untrustworthy open time', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithBlockers() });
    const rec = present(await assemble(page, RACK));

    // Ties at T0+300: both phase completions (registry position 2) sort before the blocker opening
    // (position 3). B_MIG (migrated), B_OTHER, B_TEN and B_EMPTY put nothing on this timeline.
    expect(rec.timeline).toEqual([
      opened(B_CLOSED),                  // T0+50
      phaseDone('power', T0 + 100),
      opened(B_OPEN),                    // T0+200
      phaseDone('mechanical', T0 + 300),
      phaseDone('compute', T0 + 300),
      opened(B_TIE),                     // T0+300, openedBy 'Unknown' verbatim
      cleared(B_CLOSED),                 // T0+400
    ]);
    for (const ev of rec.timeline) expect(typeof ev.t === 'number' && isFinite(ev.t), 'every event has a numeric t').toBe(true);
    // The phase derivation is untouched by the blocker events.
    expect(rec.status.phase).toEqual({ index: 2, of: 5, name: 'network' });
  });

  test('BLOCKERS · DERIVED · openBlockers counts open records from events plus the undated, and a prefix is not a match', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithBlockers() });
    const rec = present(await assemble(page, RACK));

    // B_OPEN + B_TIE (opened, never cleared) + B_MIG (undated, open). B_CLOSED is cleared.
    expect(rec.status.openBlockers, 'open = opened \\ cleared, plus undated-and-open (Q-11)').toBe(3);
    // 4 events: B_OPEN opened, B_TIE opened, B_CLOSED opened + cleared. B_MIG emits none (Q-11).
    // (Phase 0 E-10 test 2 wrote "events: 5"; its own test-1 timeline lists these four.)
    expect(cov(rec, 'blockers'), 'an ok read with one undated record says so (Q-11)').toEqual(
      { adapter: 'blockers', status: 'ok', events: 4, detail: UNDATED_DETAIL(1) });
    // Ship 1's rows keep their exact shape: no detail on an ok row that has nothing to say.
    expect(cov(rec, 'phases')).toEqual({ adapter: 'phases', status: 'ok', events: 3 });

    // rack_<dep>_1 must not claim rack_<dep>_10's record: whole-string equality, never a prefix.
    const other = present(await assemble(page, OTHER));
    expect(blockerEvents(other)).toEqual([opened(B_OTHER)]);
    expect(other.status.openBlockers).toBe(1);
    expect(cov(other, 'blockers')).toEqual({ adapter: 'blockers', status: 'ok', events: 1 });

    const ten = present(await assemble(page, TEN));
    expect(blockerEvents(ten)).toEqual([opened(B_TEN)]);
    expect(ten.status.openBlockers).toBe(1);

    // An empty rack field matches no rack — not even an empty rack id.
    const blank = present(await assemble(page, ''));
    expect(cov(blank, 'blockers'), "rack '' is not a rack").toEqual({ adapter: 'blockers', status: 'empty', events: 0 });
    expect(blank.status.openBlockers).toBe(0);
  });

  test('BLOCKERS · UNDATED · hand-edited shapes never reach the timeline without a numeric time, and are counted by the store\'s own open predicate', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    // E-5c rows, reachable only by restore or hand edit. JSON cannot carry NaN, so a missing
    // openedAt and a string openedAt stand for "not a number".
    const U_STR = blocker('blk_u1', RACK, { openedAt: '1750000000500' });                           // open
    const U_STR_CLR = blocker('blk_u2', RACK, { openedAt: 'yesterday', clearedAt: T0 + 600, clearedBy: 'E2E-3' });
    const U_CLR_STR = blocker('blk_u3', RACK, { openedAt: T0 + 700, clearedAt: '1750000000800' });  // truthy: not open
    const U_CLR_ZERO = blocker('blk_u4', RACK, { openedAt: T0 + 710, clearedAt: 0 });                 // falsy: open
    const U_NOID = blocker('', RACK, { openedAt: T0 + 720 });                                         // open
    const U_MIG_CLR = blocker('blk_u6', RACK, { migrated: true, openedAt: T0 + 730, clearedAt: T0 + 740, clearedBy: 'E2E-4' });
    const U_MISSING = blocker('blk_u7', RACK, {});
    delete U_MISSING.openedAt;                                                                      // open
    const store = [U_STR, U_STR_CLR, U_CLR_STR, U_CLR_ZERO, U_NOID, U_MIG_CLR, U_MISSING, null, RACK, 7];

    const out = await page.evaluate(({ key, rack, value }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      localStorage.setItem(key, value);
      return { __missing: false, value: PHANTOM_RR.assemble(rack) };
    }, { key: BLOCKERS_KEY, rack: RACK, value: JSON.stringify(store) });
    const rec = present(out);

    // Only a clear with a truthy finite clearedAt on a record with an id is on the timeline.
    expect(blockerEvents(rec)).toEqual([cleared(U_STR_CLR), cleared(U_MIG_CLR)]);
    for (const ev of rec.timeline) expect(typeof ev.t === 'number' && isFinite(ev.t), 'every event has a numeric t').toBe(true);
    // Open by the module's predicate !clearedAt: U_STR, U_CLR_ZERO, U_NOID, U_MISSING.
    expect(rec.status.openBlockers).toBe(4);
    // All seven records are undated; null, a bare string and a number match no rack (I-10).
    expect(cov(rec, 'blockers')).toEqual({ adapter: 'blockers', status: 'ok', events: 2, detail: UNDATED_DETAIL(7) });
  });

  test('BLOCKERS · EMPTY · absent, [] and other-racks-only each read empty with no events, and count 0', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);

    const out = await page.evaluate(({ key, rack, othersOnly }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      localStorage.removeItem(key);
      const absent = PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, '');
      const blankKey = PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, '[]');
      const emptyArray = PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, othersOnly);
      const othersOnlyRec = PHANTOM_RR.assemble(rack);
      return { __missing: false, absent, blankKey, emptyArray, othersOnlyRec };
    }, {
      key: BLOCKERS_KEY, rack: RACK,
      othersOnly: JSON.stringify([B_OTHER, B_TEN, B_EMPTY, null, RACK, 7]),
    });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    for (const [label, rec] of [['key absent', out.absent], ["key is ''", out.blankKey], ['[]', out.emptyArray], ['store holds only other racks', out.othersOnlyRec]]) {
      expect(cov(rec, 'blockers'), label).toEqual({ adapter: 'blockers', status: 'empty', events: 0 });
      expect(blockerEvents(rec), label).toEqual([]);
      expect(rec.status.openBlockers, label + ' — a count was taken and found nothing (Q-13)').toBe(0);
      expect(cov(rec, 'phases'), label).toEqual({ adapter: 'phases', status: 'ok', events: 3 });
    }
  });

  test('BLOCKERS · ERROR · malformed, wrong-shape and unreadable blocker storage report error with detail, count null, and leave the other adapters alone', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithBlockers() });

    const out = await page.evaluate(({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const good = localStorage.getItem(key);

      localStorage.setItem(key, '{not json');
      const malformed = PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, JSON.stringify({ rack }));
      const wrongShape = PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, good);
      const orig = Storage.prototype.getItem;
      let unreadable;
      try {
        Storage.prototype.getItem = function (k) {
          if (k === key) throw new Error('SecurityError: simulated unreadable storage');
          return orig.call(this, k);
        };
        unreadable = PHANTOM_RR.assemble(rack);
      } finally {
        Storage.prototype.getItem = orig;
      }
      return { __missing: false, malformed, wrongShape, unreadable };
    }, { key: BLOCKERS_KEY, rack: RACK });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    for (const [label, rec] of [['malformed JSON', out.malformed], ['not an array', out.wrongShape], ['getItem throws', out.unreadable]]) {
      const c = cov(rec, 'blockers');
      expect(c && c.status, label + ' must be error, never empty (P3)').toBe('error');
      expect(c.events, label).toBe(0);
      expect(typeof c.detail === 'string' && c.detail.length > 0, label + ' carries a detail').toBe(true);
      expect(blockerEvents(rec), label).toEqual([]);
      expect(rec.status.openBlockers, label + ' — no count was taken (Q-13)').toBeNull();
      expect(cov(rec, 'identity'), label).toEqual({ adapter: 'identity', status: 'ok', events: 0 });
      expect(cov(rec, 'phases'), label).toEqual({ adapter: 'phases', status: 'ok', events: 3 });
      expect(rec.timeline.length, label + ' — the phase events survive').toBe(3);
    }
    expect(cov(out.wrongShape, 'blockers').detail).toBe('blocker store is not an array');
  });

  test('BLOCKERS · PURE READ · assembling over a malformed blocker store writes nothing and raises no toast', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithBlockers() });

    const out = await page.evaluate(({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const snap = () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); }
        return o;
      };
      const toasts = () => (document.getElementById('toast-container') || { children: [] }).children.length;
      // All synchronous in one evaluate: nothing in the app can write between the two snapshots.
      localStorage.setItem(key, '{not json');
      const before = snap();
      const toastsBefore = toasts();
      const rec = PHANTOM_RR.assemble(rack);
      const row = (rec.coverage || []).find((c) => c.adapter === 'blockers');
      return { __missing: false, before, after: snap(), toastsBefore, toastsAfter: toasts(), status: row ? row.status : null };
    }, { key: BLOCKERS_KEY, rack: RACK });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    expect(out.status, 'the fixture really is malformed').toBe('error');
    expect(out.after, 'assembly wrote to storage (a quarantine record is a write)').toEqual(out.before);
    expect(out.toastsAfter, 'assembly raised a toast').toBe(out.toastsBefore);
  });

  test('GAPS · coverage is exactly the registry, and the rack gap is its own top-level list (Q-A)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithBlockers() });
    const out = await page.evaluate((rack) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      return { __missing: false, value: PHANTOM_RR.assemble(rack), names: PHANTOM_RR.registry.map((a) => a && a.name) };
    }, RACK);
    const rec = present(out);

    expect(out.names, 'the registry, in order').toEqual(['identity', 'phases', 'blockers']);
    expect(rec.coverage.map((c) => c.adapter), 'one coverage row per registered adapter, nothing else').toEqual(out.names);
    expect(rec.gaps).toEqual([{ field: 'rack', detail: RACK_GAP }]);
    const keys = Object.keys(rec);
    expect(keys[keys.length - 1]).toBe('gaps');
    expect(keys.indexOf('gaps'), 'gaps follows coverage').toBe(keys.indexOf('coverage') + 1);
    expect(rec.schema, 'the schema name does not move (Q-14)').toBe('rr-1');
  });

  test('READOUT · without ?rrdev=1 there is no trace of it', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const r = await assemble(page, RACK);
    expect(r.__missing, 'the assembler must exist even when the readout is off').toBe(false);
    // Flush a frame and a task — the mount path's own trigger — before asserting absence.
    await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0))));
    await expect(page.locator('#rr-dev')).toHaveCount(0);
  });

  test('READOUT · with ?rrdev=1 a picked rack shows its Record and a coverage line', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { query: '?rrdev=1' });

    const root = page.locator('#rr-dev');
    await expect(root).toBeVisible();
    await page.locator('#rr-dev-pick').selectOption(RACK);

    await expect(page.locator('#rr-dev-cov')).toContainText('identity ok');
    await expect(page.locator('#rr-dev-cov')).toContainText('phases ok');
    await expect(page.locator('#rr-dev-cov')).toContainText('blockers empty');
    // Q-A: the rack gap is on its own line, never in the coverage line.
    await expect(page.locator('#rr-dev-cov')).not.toContainText('rack empty');
    await expect(page.locator('#rr-dev-gaps')).toContainText('rack — ' + RACK_GAP);
    const json = JSON.parse(await page.locator('#rr-dev-json').textContent());
    expect(json.rack.rackId).toBe(RACK);
    expect(json.timeline.length).toBe(3);

    const close = await page.locator('#rr-dev-close').boundingBox();
    expect(close && close.height, 'close control meets the 44pt floor').toBeGreaterThanOrEqual(44);
    await page.locator('#rr-dev-close').click();
    await expect(root).toHaveCount(0);

    expect(phantom.hardErrors()).toEqual([]);
  });

  test('READOUT · with ?rrdev=1 and a blocker store, coverage gains the blockers row and gaps get their own line', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { query: '?rrdev=1', seed: seedWithBlockers() });

    await expect(page.locator('#rr-dev')).toBeVisible();
    await page.locator('#rr-dev-pick').selectOption(RACK);

    const covLine = page.locator('#rr-dev-cov');
    await expect(covLine).toHaveText('identity ok (0) · phases ok (3) · blockers ok (4) — ' + UNDATED_DETAIL(1));
    await expect(page.locator('#rr-dev-gaps')).toHaveText('gaps: rack — ' + RACK_GAP);
    const json = JSON.parse(await page.locator('#rr-dev-json').textContent());
    expect(typeof json.status.openBlockers, 'openBlockers is a number once the store is read').toBe('number');
    expect(json.status.openBlockers).toBe(3);
    expect(json.timeline.filter((e) => e.type === 'blocker.opened').map((e) => e.data.desc))
      .toEqual(['bad PSU', 'missing optic', 'bent rail']);

    // Back on the placeholder: both lines clear with the JSON.
    await page.locator('#rr-dev-pick').selectOption('');
    await expect(covLine).toHaveText('');
    await expect(page.locator('#rr-dev-gaps')).toHaveText('');
    await expect(page.locator('#rr-dev-json')).toHaveText('');

    expect(phantom.hardErrors()).toEqual([]);
  });

  test('READOUT · with ?rrdev=1 and no deployment racks it says so instead of showing nothing', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await phantom.boot({ query: '?rrdev=1', confirmProfile: false, seed: { [PROFILE_KEY]: JSON.stringify(PROFILE) } });
    await expect(page.locator('#rr-dev')).toBeVisible();
    await expect(page.locator('#rr-dev')).toContainText('NO RACKS');
    expect(phantom.hardErrors()).toEqual([]);
  });
});

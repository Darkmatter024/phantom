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
// status.photoCount and photoBytes were asserted NULL through Ship 3: no photos adapter was registered,
// and a 0 there would have claimed a measurement nobody made (Contract 10). From Ship 4a they are
// numbers once the photos adapter has read the store — 0 when it reads empty, null only on error.
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
//
// SHIP 3 (docs/A2-SHIP3-PHASE0-EVIDENCE.md E-10; rulings OWNER-RULINGS.md 2026-09-17 Q-18…Q-27)
// adds the notes adapter over the audit log:
//   · a note is RACK_NOTE + entityType 'rack' + entityId === rackId, all three (Q-18). The audit
//     log is ONE flat device-wide array, so the seed carries the other rack channels beside the
//     notes: RACK_ASSIGNED and a rack-typed voice note share entityType 'rack', BLOCKER_OPENED and
//     STEP_STATE_CHANGE carry the composite in their `rack` field, PHASE_COMPLETE and A_TEXT name
//     the rack in free text, and OMNI_NOTE is the deployment's own field note. None is this rack's
//     note, and each would be admitted by a filter that dropped one of the three tests;
//   · entityId matching is whole-string: rack_<dep>_1, rack_<dep>_10 and a rack of another
//     deployment each keep their own, and deploymentId is never compared or parsed (I-2);
//   · a ts that is not a finite number is COUNTED and never timed (I-6), like Ship 2's undated;
//   · a chainReset entry anywhere in the log — the 2,000-entry cap or a restore — is surfaced as a
//     notes-row detail, on an `empty` row as well as an `ok` one (Q-23), and the wording never
//     states how many entries were lost, because truncatedCount does not accumulate (lead L-7);
//   · status gains NO key: the note count is the notes coverage row's `events` (Q-22).
//
// SHIP 4a (docs/A2-SHIP4-PHASE0-EVIDENCE.md E-8; rulings OWNER-RULINGS.md 2026-10-15 Q-28…Q-38)
// adds the photos adapter over IndexedDB, and with it an ASYNC fold (Q-29):
//   · a fresh Playwright context is a fresh IndexedDB, so "a phone that never took a photo" is
//     literal. On it, assembly must read empty AND create no database — a version-less open would
//     leave an empty one behind, and the app's PHOTO button could never save again (Phase 0 §0.1);
//   · photo records are seeded through the app's own creator (photo_getDB) and then that
//     connection is closed, so a connection left open by the adapter is detectable (T8);
//   · records are matched on rackId whole-string, never siteId and never the byRack index (Q-31);
//     ids are chosen so the store's key order is NOT time order;
//   · the event payload is exactly { photoId, bytes } — a hand-edited caption, w and h never
//     surface (Q-33); an unusable capturedAt is counted and never timed; a missing size makes
//     photoBytes null, never a partial sum (Q-35).
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

// ── Ship 3: the audit log (docs/A2-SHIP3-PHASE0-EVIDENCE.md E-2b, E-10) ─────────────────────────
const AUDIT_KEY = 'phantom_deploy_audit_v1';
const FOREIGN = 'rack_dep_1750000009999_zz99zz_0';   // a composite from another deployment entirely
const NOTE_UNDATED_DETAIL = (n) => n + ' note(s) have no usable time — counted, not on the timeline';
const NOTE_RESET_DETAIL = 'the audit log carries a reset marker (2,000-entry cap or a restore) — notes older than its oldest surviving entry may be missing';

// Every entry carries all 16 fields deploy_logAudit writes, with rack: '' as the live RACK_NOTE
// writers store it. ⚠ Spec 64's fixture puts the composite in `rack` (64-…:76-77), a shape no live
// writer produces (lead L-16) — it is not copied here.
function aud(id, ts, action, entityType, entityId, summary, over) {
  return Object.assign({
    id, deploymentId: DEP, ts, actor: 'E2E', action, entityType, entityId, summary,
    hashV: 2, siteProfileId: 'site_e2e_01', masterId: '', rack: '', stepId: '',
    evidence: [], prevHash: '', hash: '',
  }, over);
}

// Stored order is deliberately NOT time order (the log is append-order, and a restore can carry
// anything). Numbering follows E-10's table.
const A_LATE = aud('audit_1750000000500_lat1', T0 + 500, 'RACK_NOTE', 'rack', RACK, 'cage nut short');
const A_ASSIGN = aud('audit_1750000000010_asgn', T0 + 10, 'RACK_ASSIGNED', 'rack', RACK, 'Assigned to: E2E');
const A_OTHER = aud('audit_1750000000030_othr', T0 + 30, 'RACK_NOTE', 'rack', OTHER, 'other rack note');
// BLOCKER_OPENED is the one live action that names the composite in `rack` — the blockers adapter's
// moment (Q-17). Matching on `rack` would admit it and double-show the blocker's own text.
const A_BLK = aud('audit_1750000000200_blk0', T0 + 200, 'BLOCKER_OPENED', 'phase', 'phase_' + RACK + '_network', 'missing optic', { rack: RACK });
const A_EARLY = aud('audit_1750000000020_earl', T0 + 20, 'RACK_NOTE', 'rack', RACK, 'rail kit missing', { actor: 'System' });
const A_TEN = aud('audit_1750000000040_ten0', T0 + 40, 'RACK_NOTE', 'rack', TEN, 'ten rack note');
const A_PHASE = aud('audit_1750000000101_phas', T0 + 101, 'PHASE_COMPLETE', 'phase', 'phase_' + RACK + '_power', 'Power: in_progress → complete (s1:001)');
// A chip label that reads like a state change, and a Build-Lead actor fallback: both verbatim (Q-25).
const A_TIE = aud('audit_1750000000300_tie0', T0 + 300, 'RACK_NOTE', 'rack', RACK, 'IN PROGRESS', { actor: 'LEAD-B' });
const A_OMNI = aud('audit_1750000000060_omni', T0 + 60, 'OMNI_NOTE', 'deployment', DEP, 'shift start');
const A_VA = aud('audit_1750000000070_va00', T0 + 70, 'VA_PHASE_NOTE', 'rack', 'S1:001', 'mechanical done on s1:001');
const A_STEP = aud('audit_1750000000090_step', T0 + 90, 'STEP_STATE_CHANGE', 'step', 'step_1', 'pending -> in_progress', { rack: RACK });
const A_TEXT = aud('audit_1750000000095_text', T0 + 95, 'RACK_NOTE', 'rack', OTHER, 'see s1:001 too');
const A_LATE2 = aud('audit_1750000000500_lat2', T0 + 500, 'RACK_NOTE', 'rack', RACK, 'cage nut replaced');
// JSON cannot carry NaN, so a string ts stands for "not a number". deploy_logAudit always writes
// Date.now(), so only a restore or a hand edit gets here.
const A_UNDATED = aud('audit_1750000000600_und0', '1750000000600', 'RACK_NOTE', 'rack', RACK, 'string time');
const A_FOREIGN = aud('audit_1750000000015_frgn', T0 + 15, 'RACK_NOTE', 'rack', FOREIGN, 'another deployment', { deploymentId: 'dep_1750000009999_zz99zz' });

const AUDIT = [A_LATE, A_ASSIGN, A_OTHER, A_BLK, A_EARLY, A_TEN, A_PHASE, A_TIE, A_OMNI, A_VA,
  A_STEP, A_TEXT, A_LATE2, A_UNDATED, A_FOREIGN, null, 7, 'RACK_NOTE'];

function seedWithNotes() {
  return { ...seedWithBlockers(), [AUDIT_KEY]: JSON.stringify(AUDIT) };
}

const logged = (e) => ({ t: e.ts, type: 'note.logged', source: 'notes',
  data: { auditId: e.id, text: e.summary, actor: e.actor } });
const noteEvents = (rec) => rec.timeline.filter((e) => e.source === 'notes');

// ── Ship 4a: the photo store (docs/A2-SHIP4-PHASE0-EVIDENCE.md E-2, E-8) ─────────────────────────
const PHOTO_DB = 'phantom-attachments';
const PHOTO_UNDATED_DETAIL = (n) => n + ' photo(s) have no usable time — counted, not on the timeline';
const PHOTO_UNSIZED_DETAIL = (n) => n + ' photo(s) have no stored size — the byte total is not taken';

// Every field photo_persist writes (E-2), siteId derived exactly as the writer derives it — the
// colon split of a colon-free composite, i.e. the whole rack key (the census refresh §5 defect).
function photo(id, rackId, capturedAt, bytes, over) {
  return Object.assign({ id, siteId: rackId.split(':')[0] || 'unknown', rackId, capturedAt, caption: '', bytes, w: 0, h: 0 }, over);
}

// Ids are chosen so the store's KEY order (early, late, site, tie) is not TIME order
// (early 150, site 250, tie 300, late 450): getAll() returns key order (Phase 0 probe P5).
const PH_EARLY = photo('ph_early0000', RACK, T0 + 150, 1000, { caption: 'never shown', w: 640, h: 480 });   // hand-edited: Q-33
const PH_LATE = photo('ph_late00000', RACK, T0 + 450, 3000);
const PH_SITE = photo('ph_site00000', RACK, T0 + 250, 500, { siteId: 'site_e2e_01' });   // siteId disagrees with the split (Q-31)
const PH_TIE = photo('ph_tie000000', RACK, T0 + 300, 2000);                               // ties the phases, B_TIE and A_TIE
const PH_OTHER = photo('ph_other0000', OTHER, T0 + 120, 111);
const PH_TEN = photo('ph_ten000000', TEN, T0 + 130, 222);                                 // rack_<dep>_10 starts with rack_<dep>_1
const PH_FOREIGN = photo('ph_foreign00', FOREIGN, T0 + 140, 333);
const PH_BLANK = photo('ph_blank0000', '', T0 + 160, 444);
// JSON-free IndexedDB could carry NaN, but a restore or a hand edit is what reaches these, so the
// shapes mirror Ships 2 and 3: a string time, and a size that is simply absent (A.1 oddity 7).
const PH_UNDATED = photo('ph_undated00', RACK, '1750000000600', 700);
const PH_NOSIZE = photo('ph_nosize000', RACK, T0 + 350, null, { __noBytes: true });

const PHOTOS = [PH_EARLY, PH_LATE, PH_SITE, PH_TIE, PH_OTHER, PH_TEN, PH_FOREIGN, PH_BLANK];
const RACK_PHOTOS_IN_TIME = [PH_EARLY, PH_SITE, PH_TIE, PH_LATE];

const captured = (p) => ({ t: p.capturedAt, type: 'photo.captured', source: 'photos',
  data: { photoId: p.id, bytes: (p.__noBytes ? null : p.bytes) } });
const photoEvents = (rec) => rec.timeline.filter((e) => e.source === 'photos');

// Seeds through the app's OWN creator, photo_getDB(), so the store, keyPath and indexes are the
// app's — then closes that connection and clears the module's cached handle, so the only
// connection left open afterwards is one the adapter leaked (T8). Blobs are real Blobs.
const seedPhotos = (page, recs) => page.evaluate(async (recs) => {
  const db = await photo_getDB();
  await new Promise((res, rej) => {
    const tx = db.transaction('photos', 'readwrite');
    const st = tx.objectStore('photos');
    for (const r of recs) {
      const rec = Object.assign({}, r);
      const noBytes = rec.__noBytes; delete rec.__noBytes;
      if (noBytes) delete rec.bytes;
      rec.blob = new Blob([new Uint8Array(noBytes ? 64 : Math.max(1, rec.bytes))], { type: 'image/jpeg' });
      st.put(rec);
    }
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
  db.close();
  _photoDB = null;
}, recs);

const photoDbs = (page) => page.evaluate(async (name) =>
  (await indexedDB.databases()).filter((d) => d.name === name).map((d) => d.version), PHOTO_DB);

// confirmProfile:false — the fixture would otherwise overwrite PROFILE with its own SEEDED_PROFILE.
async function boot(phantom, opts = {}) {
  await phantom.boot({ confirmProfile: false, seed: seed(), ...opts });
}

// SHIP 4a (Q-29): assemble returns a Promise. Promise.resolve() also takes the synchronous .594
// return value, so the same helper proves RED on .594 for the missing feature and nothing else.
const assemble = (page, rackId) => page.evaluate((id) => {
  if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR || typeof PHANTOM_RR.assemble !== 'function') {
    return { __missing: true };
  }
  return Promise.resolve(PHANTOM_RR.assemble(id)).then((value) => ({ __missing: false, value }));
}, rackId);

function present(r) {
  expect(r.__missing, 'PHANTOM_RR.assemble is not defined').toBe(false);
  return r.value;
}

const cov = (rec, name) => (rec.coverage || []).find((c) => c.adapter === name);

test.describe('65 — the Rack Record assembler (Ships 1–4a)', () => {
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
    // Ship 4a: this context never took a photo. The photos adapter read and found nothing — a count
    // that was taken (Q-13's rule), so 0 and 0, not null.
    expect(rec.status.photoCount, 'the photos adapter read a device with no photo store: 0, not null').toBe(0);
    expect(rec.status.photoBytes, 'the photos adapter read a device with no photo store: 0, not null').toBe(0);
    expect(rec.evidence).toEqual({ photoIds: [] });

    // Q-A: exactly one coverage row per registered adapter, in registry order.
    expect(rec.coverage).toEqual([
      { adapter: 'identity', status: 'ok', events: 0 },
      { adapter: 'phases', status: 'ok', events: 3 },
      { adapter: 'blockers', status: 'empty', events: 0 },
      // The seed has no audit key either: read, and nothing there — and no detail, because an
      // absent log carries no reset marker to report (Q-23).
      { adapter: 'notes', status: 'empty', events: 0 },
      // Ship 4a: no photo database exists in a fresh context — read, and nothing there.
      { adapter: 'photos', status: 'empty', events: 0 },
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

    const out = await page.evaluate(async ({ key, rack, other }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const first = await PHANTOM_RR.assemble(rack);
      const onlyOther = JSON.parse(localStorage.getItem(key)).filter((p) => p.rackId === other);
      localStorage.setItem(key, JSON.stringify(onlyOther));
      const noneForRack = await PHANTOM_RR.assemble(rack);
      localStorage.removeItem(key);
      const absent = await PHANTOM_RR.assemble(rack);
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

    const out = await page.evaluate(async ({ key, profileKey, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const good = localStorage.getItem(key);

      localStorage.setItem(key, '{not json');
      const malformed = await PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, JSON.stringify({ rackId: rack }));
      const wrongShape = await PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, good);
      const orig = Storage.prototype.getItem;
      let unreadable;
      try {
        Storage.prototype.getItem = function (k) {
          if (k === key) throw new Error('SecurityError: simulated unreadable storage');
          return orig.call(this, k);
        };
        unreadable = await PHANTOM_RR.assemble(rack);
      } finally {
        Storage.prototype.getItem = orig;
      }

      const goodProfile = localStorage.getItem(profileKey);
      localStorage.setItem(profileKey, '{broken');
      const identityBroken = await PHANTOM_RR.assemble(rack);
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

    const out = await page.evaluate(async ({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      // SHIP 4a: assembly now awaits IndexedDB, so app timers can run between the snapshots. The one
      // periodic localStorage writer is the multi-tab presence beacon (announce('here') every 30 s,
      // phantom_tab_presence_v1) — the app's, not assembly's — so it alone is left out of the compare.
      const snap = () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== 'phantom_tab_presence_v1') o[k] = localStorage.getItem(k); }
        return o;
      };
      const toasts = () => (document.getElementById('toast-container') || { children: [] }).children.length;
      localStorage.setItem(key, '{not json');
      const before = snap();
      const toastsBefore = toasts();
      const rec = await PHANTOM_RR.assemble(rack);
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
    const out = await page.evaluate(async ({ key, rack, t0 }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const all = JSON.parse(localStorage.getItem(key)).map((p) => (p.rackId === rack
        ? Object.assign({}, p, { status: 'complete', signedOffBy: 'E2E', signedOffAt: t0 + 500 + p.seqOrder })
        : p));
      localStorage.setItem(key, JSON.stringify(all));
      return { __missing: false, rec: await PHANTOM_RR.assemble(rack) };
    }, { key: PHASES_KEY, rack: RACK, t0: T0 });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);
    expect(out.rec.status.phase, 'all five complete: 5 of 5, and no phase is "current"').toEqual({ index: 5, of: 5, name: null });
    expect(out.rec.timeline.map((e) => e.data.phaseType)).toEqual(['mechanical', 'power', 'network', 'compute', 'validation']);
  });

  test('FOLD · an adapter that throws becomes one error row, and the adapters around it still run', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const out = await page.evaluate(async (rack) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const saved = PHANTOM_RR.registry;
      let rec;
      let threw = null;
      try {
        // Every registered adapter after the fault still runs — phases, blockers AND notes.
        PHANTOM_RR.registry = [saved[0], { name: 'boom', schemaHandled: 'test fault', read() { throw new Error('kaboom'); } }, ...saved.slice(1)];
        rec = await PHANTOM_RR.assemble(rack);
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
      .toEqual([['identity', 'ok', 0], ['boom', 'error', 0], ['phases', 'ok', 3], ['blockers', 'empty', 0], ['notes', 'empty', 0], ['photos', 'empty', 0]]);
    expect(out.rec.coverage[1].detail).toMatch(/kaboom/);
    expect(out.rec.timeline.length, 'the phases adapter after the fault still contributed').toBe(3);
    expect(out.rec.status.openBlockers, 'the blockers adapter after the fault still counted (Q-13)').toBe(0);
    expect(cov(out.rec, 'notes'), 'the notes adapter, last in the registry, still ran after the fault')
      .toEqual({ adapter: 'notes', status: 'empty', events: 0 });
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

    const out = await page.evaluate(async ({ key, rack, value }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      localStorage.setItem(key, value);
      return { __missing: false, value: await PHANTOM_RR.assemble(rack) };
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

    const out = await page.evaluate(async ({ key, rack, othersOnly }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      localStorage.removeItem(key);
      const absent = await PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, '');
      const blankKey = await PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, '[]');
      const emptyArray = await PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, othersOnly);
      const othersOnlyRec = await PHANTOM_RR.assemble(rack);
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

    const out = await page.evaluate(async ({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const good = localStorage.getItem(key);

      localStorage.setItem(key, '{not json');
      const malformed = await PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, JSON.stringify({ rack }));
      const wrongShape = await PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, good);
      const orig = Storage.prototype.getItem;
      let unreadable;
      try {
        Storage.prototype.getItem = function (k) {
          if (k === key) throw new Error('SecurityError: simulated unreadable storage');
          return orig.call(this, k);
        };
        unreadable = await PHANTOM_RR.assemble(rack);
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

    const out = await page.evaluate(async ({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      // SHIP 4a: assembly now awaits IndexedDB, so app timers can run between the snapshots. The one
      // periodic localStorage writer is the multi-tab presence beacon (announce('here') every 30 s,
      // phantom_tab_presence_v1) — the app's, not assembly's — so it alone is left out of the compare.
      const snap = () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== 'phantom_tab_presence_v1') o[k] = localStorage.getItem(k); }
        return o;
      };
      const toasts = () => (document.getElementById('toast-container') || { children: [] }).children.length;
      localStorage.setItem(key, '{not json');
      const before = snap();
      const toastsBefore = toasts();
      const rec = await PHANTOM_RR.assemble(rack);
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
    const out = await page.evaluate(async (rack) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      return { __missing: false, value: await PHANTOM_RR.assemble(rack), names: PHANTOM_RR.registry.map((a) => a && a.name) };
    }, RACK);
    const rec = present(out);

    expect(out.names, 'the registry, in order').toEqual(['identity', 'phases', 'blockers', 'notes', 'photos']);
    expect(rec.coverage.map((c) => c.adapter), 'one coverage row per registered adapter, nothing else').toEqual(out.names);
    expect(rec.gaps).toEqual([{ field: 'rack', detail: RACK_GAP }]);
    const keys = Object.keys(rec);
    expect(keys[keys.length - 1]).toBe('gaps');
    expect(keys.indexOf('gaps'), 'gaps follows coverage').toBe(keys.indexOf('coverage') + 1);
    expect(rec.schema, 'the schema name does not move (Q-14)').toBe('rr-1');
  });

  // ── SHIP 3 — the notes adapter ────────────────────────────────────────────────────────────────
  // Every expected value is derived by hand from AUDIT above and docs/A2-SHIP3-PHASE0-EVIDENCE.md
  // E-7 / E-10, never from the adapter. The four RACK notes and the one undated entry were counted
  // row by row before the code was written (Ship 2's D-1 lesson: the previous Phase 0 miscounted).
  test('NOTES · TIMELINE · note.logged merges by time with the phases and blockers, payload verbatim, and nothing in status moves', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });
    const rec = present(await assemble(page, RACK));

    // 3 phase + 4 blocker + 4 note = 11. Ties at T0+300 sort by registry position: phases (1)
    // before blockers (2) before notes (3). A_LATE and A_LATE2 share T0+500 and keep stored order
    // (indexes 0 and 12). A_UNDATED is counted, never here.
    expect(rec.timeline).toEqual([
      logged(A_EARLY),                   // T0+20  · actor 'System' carried verbatim (Q-25)
      opened(B_CLOSED),                  // T0+50
      phaseDone('power', T0 + 100),
      opened(B_OPEN),                    // T0+200 · A_BLK shares this ms and is never emitted (Q-18)
      phaseDone('mechanical', T0 + 300),
      phaseDone('compute', T0 + 300),
      opened(B_TIE),                     // T0+300
      logged(A_TIE),                     // T0+300 · last of the tie; actor 'LEAD-B' verbatim
      cleared(B_CLOSED),                 // T0+400
      logged(A_LATE),                    // T0+500 · stored index 0
      logged(A_LATE2),                   // T0+500 · stored index 12
    ]);
    for (const ev of rec.timeline) expect(typeof ev.t === 'number' && isFinite(ev.t), 'every event has a numeric t').toBe(true);
    for (const ev of noteEvents(rec)) {
      expect(Object.keys(ev.data), 'the payload is exactly { auditId, text, actor } (Q-21)').toEqual(['auditId', 'text', 'actor']);
    }
    expect(cov(rec, 'notes'), 'four notes, and the undated one says so').toEqual(
      { adapter: 'notes', status: 'ok', events: 4, detail: NOTE_UNDATED_DETAIL(1) });

    // Q-22: no new status key, and a note moves neither the phase nor the blocker count.
    expect(Object.keys(rec.status), 'rr-1 status keeps the shape the handoff fixed (Q-22)')
      .toEqual(['phase', 'openBlockers', 'photoCount', 'photoBytes']);
    expect(rec.status.phase).toEqual({ index: 2, of: 5, name: 'network' });
    expect(rec.status.openBlockers, 'a note never reaches the blocker derivation').toBe(3);
    // Ship 4a: no photo store in this context, so the photos adapter counted nothing — 0, not null.
    expect(rec.status.photoCount).toBe(0);
    expect(rec.status.photoBytes).toBe(0);
    // Ship 1's and Ship 2's rows are byte-for-byte what they were.
    expect(cov(rec, 'identity')).toEqual({ adapter: 'identity', status: 'ok', events: 0 });
    expect(cov(rec, 'phases')).toEqual({ adapter: 'phases', status: 'ok', events: 3 });
    expect(cov(rec, 'blockers')).toEqual({ adapter: 'blockers', status: 'ok', events: 4, detail: UNDATED_DETAIL(1) });
  });

  test('NOTES · SCOPING · whole-string equality on entityId: another rack, a prefix, another deployment and \'\' each keep their own', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });

    const other = present(await assemble(page, OTHER));
    // A_TEXT's text names RACK; it stays OTHER's note, because summary is never a match key.
    expect(noteEvents(other), 'rack_<dep>_1 never claims rack_<dep>_10\'s note').toEqual([logged(A_OTHER), logged(A_TEXT)]);
    expect(cov(other, 'notes'), 'an ok read with nothing to caveat carries no detail (I-11)')
      .toEqual({ adapter: 'notes', status: 'ok', events: 2 });

    const ten = present(await assemble(page, TEN));
    expect(noteEvents(ten)).toEqual([logged(A_TEN)]);
    expect(cov(ten, 'notes')).toEqual({ adapter: 'notes', status: 'ok', events: 1 });

    // deploymentId is neither compared nor parsed out of the composite (I-2): the entityId is the key.
    const foreign = present(await assemble(page, FOREIGN));
    expect(noteEvents(foreign)).toEqual([logged(A_FOREIGN)]);
    expect(cov(foreign, 'notes')).toEqual({ adapter: 'notes', status: 'ok', events: 1 });

    const blank = present(await assemble(page, ''));
    expect(cov(blank, 'notes'), "rack '' is not a rack (I-3)").toEqual({ adapter: 'notes', status: 'empty', events: 0 });
    expect(noteEvents(blank)).toEqual([]);
  });

  test('NOTES · EMPTY · absent, \'\', [] and a log where nothing is this rack\'s note each read empty with no events', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);

    const out = await page.evaluate(async ({ key, rack, nonMatching }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      localStorage.removeItem(key);
      const absent = await PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, '');
      const blankKey = await PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, '[]');
      const emptyArray = await PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, nonMatching);
      const noneMine = await PHANTOM_RR.assemble(rack);
      return { __missing: false, absent, blankKey, emptyArray, noneMine };
    }, {
      key: AUDIT_KEY,
      rack: RACK,
      // E-10 store 4: this rack's non-note actions (RACK_ASSIGNED, BLOCKER_OPENED, PHASE_COMPLETE,
      // STEP_STATE_CHANGE), other racks' notes, the deployment's field note, a voice note, and
      // members that are not objects. Dropping any one of the three filter tests admits one of these.
      nonMatching: JSON.stringify([A_ASSIGN, A_OTHER, A_BLK, A_TEN, A_PHASE, A_OMNI, A_VA, A_STEP, A_TEXT, A_FOREIGN, null, 7, 'RACK_NOTE']),
    });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    for (const [label, rec] of [['key absent', out.absent], ["key is ''", out.blankKey], ['[]', out.emptyArray], ['no entry is this rack\'s note', out.noneMine]]) {
      expect(cov(rec, 'notes'), label).toEqual({ adapter: 'notes', status: 'empty', events: 0 });
      expect(noteEvents(rec), label).toEqual([]);
      expect(cov(rec, 'phases'), label).toEqual({ adapter: 'phases', status: 'ok', events: 3 });
      expect(rec.status.openBlockers, label + ' — the blocker count is untouched').toBe(0);
    }
  });

  test('NOTES · ERROR · malformed, wrong-shape and unreadable audit storage report error with detail and leave the other adapters alone', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });

    const out = await page.evaluate(async ({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const good = localStorage.getItem(key);

      localStorage.setItem(key, '{not json');
      const malformed = await PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, JSON.stringify({ entityId: rack }));
      const wrongShape = await PHANTOM_RR.assemble(rack);

      localStorage.setItem(key, good);
      const orig = Storage.prototype.getItem;
      let unreadable;
      try {
        Storage.prototype.getItem = function (k) {
          if (k === key) throw new Error('SecurityError: simulated unreadable storage');
          return orig.call(this, k);
        };
        unreadable = await PHANTOM_RR.assemble(rack);
      } finally {
        Storage.prototype.getItem = orig;
      }
      return { __missing: false, malformed, wrongShape, unreadable };
    }, { key: AUDIT_KEY, rack: RACK });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    for (const [label, rec] of [['malformed JSON', out.malformed], ['not an array', out.wrongShape], ['getItem throws', out.unreadable]]) {
      const c = cov(rec, 'notes');
      expect(c && c.status, label + ' must be error, never empty (P3)').toBe('error');
      expect(c.events, label).toBe(0);
      expect(typeof c.detail === 'string' && c.detail.length > 0, label + ' carries a detail').toBe(true);
      expect(noteEvents(rec), label).toEqual([]);
      expect(cov(rec, 'identity'), label).toEqual({ adapter: 'identity', status: 'ok', events: 0 });
      expect(cov(rec, 'phases'), label).toEqual({ adapter: 'phases', status: 'ok', events: 3 });
      expect(cov(rec, 'blockers'), label).toEqual({ adapter: 'blockers', status: 'ok', events: 4, detail: UNDATED_DETAIL(1) });
      expect(rec.status.openBlockers, label + ' — a notes failure never moves the blocker count').toBe(3);
      expect(rec.timeline.length, label + ' — the phase and blocker events survive').toBe(7);
    }
    expect(cov(out.wrongShape, 'notes').detail).toBe('audit store is not an array');
  });

  test('NOTES · PURE READ · assembling over a malformed audit store writes nothing — no quarantine, no crash log — and raises no toast', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });

    const out = await page.evaluate(async ({ key, rack }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      // SHIP 4a: assembly now awaits IndexedDB, so app timers can run between the snapshots. The one
      // periodic localStorage writer is the multi-tab presence beacon (announce('here') every 30 s,
      // phantom_tab_presence_v1) — the app's, not assembly's — so it alone is left out of the compare.
      const snap = () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== 'phantom_tab_presence_v1') o[k] = localStorage.getItem(k); }
        return o;
      };
      const toasts = () => (document.getElementById('toast-container') || { children: [] }).children.length;
      localStorage.setItem(key, '{not json');
      const before = snap();
      const toastsBefore = toasts();
      const rec = await PHANTOM_RR.assemble(rack);
      const row = (rec.coverage || []).find((c) => c.adapter === 'notes');
      return { __missing: false, before, after: snap(), toastsBefore, toastsAfter: toasts(), status: row ? row.status : null };
    }, { key: AUDIT_KEY, rack: RACK });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    // ⛔ ORDER MATTERS HERE, and it is not the obvious one. The two write assertions run FIRST so
    // that a reader-regression is reported as the write it is: swap _rr_readKey for
    // deploy_loadAllAudit and the quarantine record shows up here, named. If the status check ran
    // first it would fail on 'empty' and the write would never be looked at — which is exactly
    // what happened under mutation M4 before this reorder (docs/A2-SHIP3-EVIDENCE.md D-3).
    expect(out.after, 'assembly wrote to storage (a quarantine record is a write)').toEqual(out.before);
    expect(out.toastsAfter, 'assembly raised a toast').toBe(out.toastsBefore);
    // ⛔ AND THE PRECONDITION IS STILL THE TEST. Without it the two assertions above pass vacuously
    // wherever no adapter reads the audit key at all — which is precisely the state on .593.
    expect(out.status, 'the fixture really is malformed and the notes adapter really read it').toBe('error');
  });

  test('NOTES · UNDATED · an unusable ts is counted and never timed, absent values are null, and notes with no usable time at all still read ok', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);

    const U_TS_STR = aud('audit_u1', '1750000000600', 'RACK_NOTE', 'rack', RACK, 'string time');
    const U_TS_NULL = aud('audit_u2', null, 'RACK_NOTE', 'rack', RACK, 'null time');
    const U_TS_GONE = aud('audit_u3', 0, 'RACK_NOTE', 'rack', RACK, 'no time at all');
    delete U_TS_GONE.ts;
    const U_NO_ID = aud('audit_u4', T0 + 800, 'RACK_NOTE', 'rack', RACK, 'no id');
    delete U_NO_ID.id;
    const U_NO_SUM = aud('audit_u5', T0 + 810, 'RACK_NOTE', 'rack', RACK, 'replaced below');
    delete U_NO_SUM.summary;
    const U_NO_ACTOR = aud('audit_u6', T0 + 820, 'RACK_NOTE', 'rack', RACK, 'no actor');
    delete U_NO_ACTOR.actor;
    const store = [U_TS_STR, U_TS_NULL, U_TS_GONE, U_NO_ID, U_NO_SUM, U_NO_ACTOR, null, 7, 'x'];

    const out = await page.evaluate(async ({ key, rack, value, undatedOnly }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      localStorage.setItem(key, value);
      const mixed = await PHANTOM_RR.assemble(rack);
      localStorage.setItem(key, undatedOnly);
      const allUndated = await PHANTOM_RR.assemble(rack);
      return { __missing: false, mixed, allUndated };
    }, {
      key: AUDIT_KEY, rack: RACK, value: JSON.stringify(store),
      undatedOnly: JSON.stringify([U_TS_STR, U_TS_NULL]),
    });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    // Three usable times; three unusable. An absent id, summary or actor is null, never omitted (I-8).
    expect(noteEvents(out.mixed)).toEqual([
      { t: T0 + 800, type: 'note.logged', source: 'notes', data: { auditId: null, text: 'no id', actor: 'E2E' } },
      { t: T0 + 810, type: 'note.logged', source: 'notes', data: { auditId: 'audit_u5', text: null, actor: 'E2E' } },
      { t: T0 + 820, type: 'note.logged', source: 'notes', data: { auditId: 'audit_u6', text: 'no actor', actor: null } },
    ]);
    for (const ev of out.mixed.timeline) expect(typeof ev.t === 'number' && isFinite(ev.t), 'every event has a numeric t').toBe(true);
    expect(cov(out.mixed, 'notes')).toEqual({ adapter: 'notes', status: 'ok', events: 3, detail: NOTE_UNDATED_DETAIL(3) });

    // A rack whose every note is undated HAS notes: ok with 0 events and a detail saying so is
    // honest; empty would deny them. Ship 2's blockers adapter draws the line the same way.
    expect(noteEvents(out.allUndated)).toEqual([]);
    expect(cov(out.allUndated, 'notes')).toEqual({ adapter: 'notes', status: 'ok', events: 0, detail: NOTE_UNDATED_DETAIL(2) });
  });

  test('NOTES · TRUNCATION · a reset marker anywhere in the log is reported, on an empty row too, and never as a count (Q-23)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);

    // The FIFO eviction marker, as deploy_logAudit writes it onto the new head. It belongs to
    // another deployment: the cap is device-wide, so the marker need not be this rack's entry.
    const HEAD = aud('audit_head', T0 + 5, 'OMNI_NOTE', 'deployment', 'dep_old', 'evicted head', {
      deploymentId: 'dep_old', chainReset: true, truncatedCount: 1, truncatedAt: T0 + 6, truncatedLastHash: 'h0',
    });
    // The restore marker: chainReset and truncatedAt, no count at all (:56975).
    const R_HEAD = aud('audit_rhead', T0 + 7, 'OMNI_NOTE', 'deployment', 'dep_old', 'restored head', {
      deploymentId: 'dep_old', chainReset: true, truncatedAt: T0 + 8,
    });

    const out = await page.evaluate(async ({ key, rack, stores }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const res = {};
      for (const name of Object.keys(stores)) {
        localStorage.setItem(key, stores[name]);
        res[name] = await PHANTOM_RR.assemble(rack);
      }
      return { __missing: false, res };
    }, {
      key: AUDIT_KEY, rack: RACK,
      stores: {
        truncated: JSON.stringify([HEAD, A_EARLY]),
        truncatedNoneLeft: JSON.stringify([HEAD]),
        restored: JSON.stringify([R_HEAD, A_EARLY]),
        clean: JSON.stringify([A_EARLY]),
        both: JSON.stringify([HEAD, A_EARLY, A_UNDATED]),
      },
    });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    expect(cov(out.res.truncated, 'notes'), 'an ok read of a truncated log says entries may be missing')
      .toEqual({ adapter: 'notes', status: 'ok', events: 1, detail: NOTE_RESET_DETAIL });
    // Q-23 is exactly this case: no surviving note for the rack, and a log that lost entries. The
    // fold has to pass detail on an empty row, or P3's "empty" is silently a lie.
    expect(cov(out.res.truncatedNoneLeft, 'notes'), 'an empty read of a truncated log still says so (Q-23)')
      .toEqual({ adapter: 'notes', status: 'empty', events: 0, detail: NOTE_RESET_DETAIL });
    expect(noteEvents(out.res.truncatedNoneLeft)).toEqual([]);
    expect(cov(out.res.restored, 'notes'), 'a restore marker carries no count and reads the same')
      .toEqual({ adapter: 'notes', status: 'ok', events: 1, detail: NOTE_RESET_DETAIL });
    // No marker, nothing to say: the row keeps Ship 1's exact three-key shape.
    expect(cov(out.res.clean, 'notes')).toEqual({ adapter: 'notes', status: 'ok', events: 1 });
    expect(Object.prototype.hasOwnProperty.call(cov(out.res.clean, 'notes'), 'detail'), 'no detail key at all on a clean read').toBe(false);
    // Both caveats, undated first, joined with '; '.
    expect(cov(out.res.both, 'notes')).toEqual(
      { adapter: 'notes', status: 'ok', events: 1, detail: NOTE_UNDATED_DETAIL(1) + '; ' + NOTE_RESET_DETAIL });
    // ⛔ L-7: truncatedCount reads 1 after every steady-state eviction, so it is not a loss count.
    // HEAD carries truncatedCount 1 and R_HEAD carries none, and the two produce the IDENTICAL
    // sentence — that identity is the proof the wording does not depend on the field.
    expect(cov(out.res.restored, 'notes').detail, 'a count-less marker and a counted one read alike (L-7)')
      .toBe(cov(out.res.truncated, 'notes').detail);
    for (const name of ['truncated', 'truncatedNoneLeft', 'restored', 'both']) {
      const d = cov(out.res[name], 'notes').detail;
      expect(d.endsWith(NOTE_RESET_DETAIL), name + ' — the reset sentence is the last thing said').toBe(true);
      expect(d, name + ' — truncatedCount is never surfaced').not.toMatch(/truncat/);
    }
  });

  test('NOTES · REGISTRY · notes is the fourth adapter, coverage is exactly the registry, and the gaps list does not move', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });
    const out = await page.evaluate(async (rack) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      return {
        __missing: false, value: await PHANTOM_RR.assemble(rack),
        names: PHANTOM_RR.registry.map((a) => a && a.name),
        schemas: PHANTOM_RR.registry.map((a) => a && a.schemaHandled),
      };
    }, RACK);
    const rec = present(out);

    expect(out.names, 'notes is registered fourth, after blockers (E-8b: the tie order); photos follows in Ship 4a').toEqual(['identity', 'phases', 'blockers', 'notes', 'photos']);
    expect(out.schemas[3], 'the notes adapter declares the one key it handles').toMatch(/phantom_deploy_audit_v1/);
    expect(rec.coverage.map((c) => c.adapter), 'one coverage row per registered adapter, nothing else').toEqual(out.names);
    expect(rec.gaps, 'a fourth adapter does not change the gaps list').toEqual([{ field: 'rack', detail: RACK_GAP }]);
    expect(Object.keys(rec), 'rr-1 keys do not move').toEqual(['schema', 'assembledAt', 'site', 'rack', 'tech', 'status', 'timeline', 'evidence', 'coverage', 'gaps']);
    expect(rec.schema, 'the schema name does not move (Q-22)').toBe('rr-1');
  });

  // ── SHIP 4a — the async fold and the photos adapter ───────────────────────────────────────────
  // Every expected value is derived by hand from PHOTOS above and docs/A2-SHIP4-PHASE0-EVIDENCE.md
  // E-5 / E-8, never from the adapter. Four RACK photos: early 150 (1000 B), site 250 (500 B),
  // tie 300 (2000 B), late 450 (3000 B) — 4 events, 6,500 bytes.
  test('ASYNC · assemble returns a Promise, the fold keeps registry order across an async adapter, and a rejection is one error row (Q-29)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const out = await page.evaluate(async (rack) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const plain = PHANTOM_RR.assemble(rack);
      const thenable = !!plain && typeof plain.then === 'function';
      await plain;
      const saved = PHANTOM_RR.registry;
      let rec, threw = null;
      try {
        // A slow async adapter BEFORE phases, and a rejecting one after it: order must hold and
        // every adapter after the rejection must still run.
        const slow = { name: 'slow', schemaHandled: 'test', read() { return new Promise((r) => setTimeout(() => r({ events: [], facts: {}, status: 'empty' }), 50)); } };
        const nope = { name: 'nope', schemaHandled: 'test', read() { return Promise.reject(new Error('rejected-here')); } };
        PHANTOM_RR.registry = [saved[0], slow, saved[1], nope, ...saved.slice(2)];
        rec = await PHANTOM_RR.assemble(rack);
      } catch (e) { threw = String(e && e.message); }
      finally { PHANTOM_RR.registry = saved; }
      return { __missing: false, thenable, rec, threw };
    }, RACK);
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);
    expect(out.thenable, 'assemble() must return a Promise (Q-29)').toBe(true);
    expect(out.threw, 'a rejecting adapter escaped assemble()').toBeNull();
    expect(out.rec.coverage.map((c) => [c.adapter, c.status]))
      .toEqual([['identity', 'ok'], ['slow', 'empty'], ['phases', 'ok'], ['nope', 'error'], ['blockers', 'empty'], ['notes', 'empty'], ['photos', 'empty']]);
    expect(out.rec.coverage[3].detail).toMatch(/rejected-here/);
    expect(out.rec.timeline.length, 'the phases adapter still contributed').toBe(3);
  });

  test('PHOTOS · FRESH DEVICE · no photo database reads empty, creates NO database, and the PHOTO path still saves afterwards (Q-28)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    expect(await photoDbs(page), 'precondition: a fresh context has no photo database').toEqual([]);

    const rec = present(await assemble(page, RACK));
    expect(cov(rec, 'photos'), 'no database: read, and nothing there').toEqual({ adapter: 'photos', status: 'empty', events: 0 });
    expect(rec.status.photoCount).toBe(0);
    expect(rec.status.photoBytes).toBe(0);
    expect(rec.evidence.photoIds).toEqual([]);
    // ⛔ THE TEST THAT KEEPS THE PHOTO BUTTON ALIVE. A version-less open would leave phantom-attachments
    // at version 1 with no store, and photo_getDB's upgrade would never run again (Phase 0 P2/P3).
    expect(await photoDbs(page), 'assembly created a photo database — the PHOTO button would now fail forever').toEqual([]);

    const after = await page.evaluate(async (rack) => {
      try {
        await photo_persist('dep_x', rack, new Blob([new Uint8Array(1234)], { type: 'image/jpeg' }));
        return { ok: true, n: await photo_getCountForRack(rack) };
      } catch (e) { return { ok: false, err: String((e && e.name) || e) + ': ' + String(e && e.message) }; }
    }, RACK);
    expect(after, 'the app saves and counts a photo after assembly').toEqual({ ok: true, n: 1 });
    const again = present(await assemble(page, RACK));
    expect(cov(again, 'photos')).toEqual({ adapter: 'photos', status: 'ok', events: 1 });
    expect(again.status.photoCount).toBe(1);
    expect(again.status.photoBytes).toBe(1234);
  });

  test('PHOTOS · TIMELINE · photo.captured merges by time with phases, blockers and notes; payload is exactly { photoId, bytes } (Q-33)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });
    const before = present(await assemble(page, RACK));
    await seedPhotos(page, PHOTOS);
    const rec = present(await assemble(page, RACK));

    expect(photoEvents(rec), 'this rack\'s four photos, in TIME order — not key order').toEqual(RACK_PHOTOS_IN_TIME.map(captured));
    for (const ev of photoEvents(rec)) {
      expect(Object.keys(ev.data), 'the payload is exactly { photoId, bytes } — no caption, w, h or siteId (Q-33)').toEqual(['photoId', 'bytes']);
    }
    for (let i = 1; i < rec.timeline.length; i++) {
      expect(rec.timeline[i].t >= rec.timeline[i - 1].t, 'the timeline is non-decreasing in t at ' + i).toBe(true);
    }
    // The tie at T0+300 sorts by registry position: phases, phases, blockers, notes, then photos (5th).
    expect(rec.timeline.filter((e) => e.t === T0 + 300).map((e) => e.source))
      .toEqual(['phases', 'phases', 'blockers', 'notes', 'photos']);
    // Photos perturb nothing else: drop them and the timeline is exactly what it was before seeding.
    expect(rec.timeline.filter((e) => e.source !== 'photos')).toEqual(before.timeline);
    expect(cov(rec, 'photos')).toEqual({ adapter: 'photos', status: 'ok', events: 4 });
    expect(rec.status.phase).toEqual({ index: 2, of: 5, name: 'network' });
    expect(rec.status.openBlockers, 'a photo never reaches the blocker derivation').toBe(3);
  });

  test('PHOTOS · SCOPING · rackId whole-string: another rack, a prefix, another deployment, \'\' and a disagreeing siteId each land where they belong (Q-31)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    await seedPhotos(page, PHOTOS);

    const rack = present(await assemble(page, RACK));
    expect(rack.evidence.photoIds, 'PH_SITE counts: rackId matches even though siteId does not').toEqual(RACK_PHOTOS_IN_TIME.map((p) => p.id));
    const other = present(await assemble(page, OTHER));
    expect(photoEvents(other), 'rack_<dep>_1 never claims rack_<dep>_10\'s photo').toEqual([captured(PH_OTHER)]);
    const ten = present(await assemble(page, TEN));
    expect(photoEvents(ten)).toEqual([captured(PH_TEN)]);
    const foreign = present(await assemble(page, FOREIGN));
    expect(photoEvents(foreign)).toEqual([captured(PH_FOREIGN)]);
    const blank = present(await assemble(page, ''));
    expect(cov(blank, 'photos'), "rack '' is not a rack, even with a photo stored under ''").toEqual({ adapter: 'photos', status: 'empty', events: 0 });
    expect(blank.status.photoCount).toBe(0);
  });

  test('PHOTOS · DERIVED · photoCount, photoBytes and photoIds come from the events plus the undated; an undated photo is counted, listed last, never timed (Q-34)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    await seedPhotos(page, [...PHOTOS, PH_UNDATED]);
    const rec = present(await assemble(page, RACK));

    expect(photoEvents(rec)).toEqual(RACK_PHOTOS_IN_TIME.map(captured));
    expect(rec.status.photoCount, '4 dated + 1 undated').toBe(5);
    expect(rec.status.photoBytes, '1000 + 500 + 2000 + 3000 + 700').toBe(7200);
    expect(rec.evidence.photoIds, 'dated in timeline order, then the undated').toEqual([...RACK_PHOTOS_IN_TIME.map((p) => p.id), PH_UNDATED.id]);
    expect(cov(rec, 'photos')).toEqual({ adapter: 'photos', status: 'ok', events: 4, detail: PHOTO_UNDATED_DETAIL(1) });
    for (const ev of rec.timeline) expect(typeof ev.t === 'number' && isFinite(ev.t), 'every event has a numeric t').toBe(true);
  });

  test('PHOTOS · SIZE MISSING · a record with no size makes photoBytes null, never a partial sum; the count is still taken (Q-35)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    await seedPhotos(page, [...PHOTOS, PH_NOSIZE]);
    const rec = present(await assemble(page, RACK));
    expect(photoEvents(rec), 'the unsized photo is still on the timeline, with bytes null')
      .toEqual([captured(PH_EARLY), captured(PH_SITE), captured(PH_TIE), captured(PH_NOSIZE), captured(PH_LATE)]);
    expect(rec.status.photoCount).toBe(5);
    expect(rec.status.photoBytes, '6,500 would understate a total that was not taken').toBeNull();
    expect(cov(rec, 'photos')).toEqual({ adapter: 'photos', status: 'ok', events: 5, detail: PHOTO_UNSIZED_DETAIL(1) });

    // Both caveats together: undated first, joined with '; ' — the notes adapter's order.
    await seedPhotos(page, [PH_UNDATED]);
    const both = present(await assemble(page, RACK));
    expect(cov(both, 'photos').detail).toBe(PHOTO_UNDATED_DETAIL(1) + '; ' + PHOTO_UNSIZED_DETAIL(1));
    expect(both.status.photoCount).toBe(6);
    expect(both.status.photoBytes).toBeNull();
  });

  test('PHOTOS · ERROR · no IndexedDB, a failed open, a database without its store, and an open that never answers each report error, count null, others untouched (Q-32)', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithBlockers() });

    const out = await page.evaluate(async ({ rack, dbName }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const ad = PHANTOM_RR.registry.find((a) => a && a.name === 'photos');
      if (!ad) return { __missing: false, noAdapter: true };
      const res = {};
      const desc = Object.getOwnPropertyDescriptor(window, 'indexedDB');
      // 1. No IndexedDB at all (some private modes).
      try {
        Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true, writable: true });
        res.none = await PHANTOM_RR.assemble(rack);
      } finally { if (desc) Object.defineProperty(window, 'indexedDB', desc); else delete window.indexedDB; }
      // 2. The open fails.
      const realOpen = IDBFactory.prototype.open;
      try {
        IDBFactory.prototype.open = function () {
          const req = {};
          setTimeout(() => { req.error = { name: 'UnknownError' }; if (req.onerror) req.onerror({ preventDefault() {}, target: req }); }, 0);
          return req;
        };
        res.failed = await PHANTOM_RR.assemble(rack);
      } finally { IDBFactory.prototype.open = realOpen; }
      // 3. The open never answers — the watchdog, shortened on the adapter, not by a sleep.
      const savedTimeout = ad.timeoutMs;
      try {
        IDBFactory.prototype.open = function () { return {}; };
        ad.timeoutMs = 300;
        res.hung = await PHANTOM_RR.assemble(rack);
      } finally { IDBFactory.prototype.open = realOpen; ad.timeoutMs = savedTimeout; }
      // 4. The broken state Phase 0 P2 produces: the database exists at version 1 with no store.
      await new Promise((r) => { const q = indexedDB.open(dbName); q.onsuccess = () => { q.result.close(); r(); }; q.onerror = () => r(); });
      res.storeless = await PHANTOM_RR.assemble(rack);
      return { __missing: false, res };
    }, { rack: RACK, dbName: PHOTO_DB });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);
    expect(out.noAdapter, 'no photos adapter is registered').toBeUndefined();

    const want = { none: /IndexedDB unavailable/, failed: /could not be opened.*UnknownError/, hung: /did not answer/, storeless: /without its photos store/ };
    for (const [label, rec] of Object.entries(out.res)) {
      const c = cov(rec, 'photos');
      expect(c && c.status, label + ' must be error, never empty (P3)').toBe('error');
      expect(c.events, label).toBe(0);
      expect(c.detail, label + ' carries the right detail').toMatch(want[label]);
      expect(rec.status.photoCount, label + ' — no count was taken').toBeNull();
      expect(rec.status.photoBytes, label + ' — no total was taken').toBeNull();
      expect(rec.evidence.photoIds, label).toEqual([]);
      expect(cov(rec, 'blockers'), label).toEqual({ adapter: 'blockers', status: 'ok', events: 4, detail: UNDATED_DETAIL(1) });
      expect(rec.status.openBlockers, label + ' — a photo failure never moves the blocker count').toBe(3);
    }
  });

  test('PHOTOS · PURE READ · assembly writes nothing to localStorage or IndexedDB, leaves no connection open, raises no toast, and never carries a blob', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });
    await seedPhotos(page, PHOTOS);

    const out = await page.evaluate(async ({ rack, dbName }) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      const snap = () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== 'phantom_tab_presence_v1') o[k] = localStorage.getItem(k); }
        return o;
      };
      const idbSnap = () => new Promise((r) => {
        const q = indexedDB.open(dbName);
        q.onsuccess = () => {
          const db = q.result;
          const tx = db.transaction('photos', 'readonly');
          const all = tx.objectStore('photos').getAll();
          let v = null;
          all.onsuccess = () => { v = all.result.map((p) => [p.id, p.rackId, p.siteId, p.capturedAt, p.bytes, p.caption, p.w, p.h, p.blob && p.blob.size]); };
          // Close on COMPLETE, so this helper's own connection is truly gone before the blocked check.
          tx.oncomplete = () => { db.close(); r({ version: db.version, rows: v }); };
        };
      });
      const toasts = () => (document.getElementById('toast-container') || { children: [] }).children.length;
      const before = snap(), idbBefore = await idbSnap(), toastsBefore = toasts();
      const rec = await PHANTOM_RR.assemble(rack);
      // IMMEDIATELY after assembly, before anything else touches the database: a versioned open fires
      // `blocked` if any connection is still open — including one whose close() is merely pending on a
      // transaction that has not finished (probe P10, docs/A2-SHIP4A-EVIDENCE.md). This open bumps the version, so the
      // store comparison below is on rows, not on version.
      const blocked = await new Promise((r) => {
        const q = indexedDB.open(dbName, idbBefore.version + 1);
        let saw = false;
        q.onblocked = () => { saw = true; };
        q.onupgradeneeded = () => {};
        q.onsuccess = () => { q.result.close(); r(saw); };
        q.onerror = () => r('error');
        setTimeout(() => r(saw ? true : 'timeout'), 3000);
      });
      const after = snap(), idbAfter = await idbSnap(), toastsAfter = toasts();
      let hasBlob = false;
      (function walk(v) { if (v && typeof v === 'object') { if (v instanceof Blob) hasBlob = true; else Object.values(v).forEach(walk); } })(rec);
      const row = (rec.coverage || []).find((c) => c.adapter === 'photos');
      return { __missing: false, before, after, idbBefore, idbAfter, toastsBefore, toastsAfter, blocked, hasBlob,
        json: JSON.stringify(rec), status: row ? row.status : null };
    }, { rack: RACK, dbName: PHOTO_DB });
    expect(out.__missing, 'PHANTOM_RR is not defined').toBe(false);

    expect(out.after, 'assembly wrote to localStorage').toEqual(out.before);
    expect(out.idbAfter.rows, 'assembly changed the photo store').toEqual(out.idbBefore.rows);
    expect(out.toastsAfter, 'assembly raised a toast').toBe(out.toastsBefore);
    expect(out.blocked, 'assembly left a connection to the photo database open').toBe(false);
    expect(out.hasBlob, 'a Blob reached the Record (handoff §3: refs only)').toBe(false);
    expect(out.json, 'no blob, caption, w or h key anywhere in the Record').not.toMatch(/"(blob|caption|w|h)":/);
    // The precondition is the test: the photos adapter really read the seeded store.
    expect(out.status).toBe('ok');
  });

  test('PHOTOS · REGISTRY · photos is the fifth adapter, coverage is exactly the registry, and rr-1 does not move', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { seed: seedWithNotes() });
    const out = await page.evaluate(async (rack) => {
      if (typeof PHANTOM_RR !== 'object' || !PHANTOM_RR) return { __missing: true };
      return {
        __missing: false, value: await PHANTOM_RR.assemble(rack),
        names: PHANTOM_RR.registry.map((a) => a && a.name),
        schemas: PHANTOM_RR.registry.map((a) => a && a.schemaHandled),
      };
    }, RACK);
    const rec = present(out);
    expect(out.names, 'photos is registered fifth, after notes').toEqual(['identity', 'phases', 'blockers', 'notes', 'photos']);
    expect(out.schemas[4], 'the photos adapter declares the one store it reads').toMatch(/phantom-attachments/);
    expect(rec.coverage.map((c) => c.adapter), 'one coverage row per registered adapter, nothing else').toEqual(out.names);
    expect(rec.gaps, 'a fifth adapter does not change the gaps list').toEqual([{ field: 'rack', detail: RACK_GAP }]);
    expect(Object.keys(rec), 'rr-1 keys do not move').toEqual(['schema', 'assembledAt', 'site', 'rack', 'tech', 'status', 'timeline', 'evidence', 'coverage', 'gaps']);
    expect(Object.keys(rec.status), 'status keeps the shape the handoff fixed').toEqual(['phase', 'openBlockers', 'photoCount', 'photoBytes']);
    expect(Object.keys(rec.evidence)).toEqual(['photoIds']);
  });

  test('READOUT · with ?rrdev=1 and photos stored, the coverage line ends with the photos row and the JSON carries counts and ids, never a blob', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { query: '?rrdev=1', seed: seedWithNotes() });
    await expect(page.locator('#rr-dev')).toBeVisible();
    await seedPhotos(page, PHOTOS);
    await page.locator('#rr-dev-pick').selectOption(RACK);

    await expect(page.locator('#rr-dev-cov')).toHaveText(
      'identity ok (0) · phases ok (3) · blockers ok (4) — ' + UNDATED_DETAIL(1)
      + ' · notes ok (4) — ' + NOTE_UNDATED_DETAIL(1) + ' · photos ok (4)');
    const json = JSON.parse(await page.locator('#rr-dev-json').textContent());
    expect(json.status.photoCount).toBe(4);
    expect(json.status.photoBytes).toBe(6500);
    expect(json.evidence.photoIds).toEqual(RACK_PHOTOS_IN_TIME.map((p) => p.id));
    expect(await page.locator('#rr-dev-json').textContent()).not.toMatch(/"(blob|caption|w|h)":/);
    expect(phantom.hardErrors()).toEqual([]);
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
    await expect(page.locator('#rr-dev-cov')).toContainText('notes empty');
    await expect(page.locator('#rr-dev-cov')).toContainText('photos empty');
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
    await expect(covLine).toHaveText('identity ok (0) · phases ok (3) · blockers ok (4) — ' + UNDATED_DETAIL(1) + ' · notes empty · photos empty');
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

  test('READOUT · with ?rrdev=1 and an audit store, the coverage line ends with the notes row and the JSON carries the note texts', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom, { query: '?rrdev=1', seed: seedWithNotes() });

    await expect(page.locator('#rr-dev')).toBeVisible();
    await page.locator('#rr-dev-pick').selectOption(RACK);

    // Exact text: the whole line, including Ship 2's blockers caveat, unchanged before the notes row.
    await expect(page.locator('#rr-dev-cov')).toHaveText(
      'identity ok (0) · phases ok (3) · blockers ok (4) — ' + UNDATED_DETAIL(1)
      + ' · notes ok (4) — ' + NOTE_UNDATED_DETAIL(1) + ' · photos empty');
    await expect(page.locator('#rr-dev-gaps')).toHaveText('gaps: rack — ' + RACK_GAP);

    const json = JSON.parse(await page.locator('#rr-dev-json').textContent());
    const notes = json.timeline.filter((e) => e.type === 'note.logged');
    expect(notes.map((e) => e.data.text), 'text is the stored summary, in timeline order')
      .toEqual(['rail kit missing', 'IN PROGRESS', 'cage nut short', 'cage nut replaced']);
    expect(notes.map((e) => e.data.actor), 'actor verbatim, fallbacks included (Q-25)')
      .toEqual(['System', 'LEAD-B', 'E2E', 'E2E']);
    expect(notes.every((e) => typeof e.t === 'number' && isFinite(e.t)), 'every note event has a numeric t').toBe(true);
    expect(json.status.openBlockers, 'a note never reaches the blocker derivation').toBe(3);
    expect(Object.keys(json.status), 'no noteCount key (Q-22)').toEqual(['phase', 'openBlockers', 'photoCount', 'photoBytes']);

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

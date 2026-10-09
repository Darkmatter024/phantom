// ─────────────────────────────────────────────────────────────────────────────
// 12 — THE BLOCKER RECORD (v1.14.420, P2 of PHASE-ENGINE)
//
// WHY THIS SPEC EXISTS
// Spec §6.2: a BLOCKED step REQUIRES a blockerId referencing a Blocker record, and
// a blocked step without one is an invalid state whose transition must be
// rejected. Before P2 a blocker was three fields ON a phase — blockerNote,
// blockedAt, status:'blocked' — which has no identity, so nothing can reference
// it and Shift cannot render descriptions instead of bare counts.
//
// THE FAILURE THIS SPEC IS REALLY GUARDING
// Enforcing that invariant on a device that ALREADY has blocked phases would
// retroactively declare every blocker the operator has logged to be illegal:
// their notes still on disk, their phases still blocked, and the app now calling
// that state invalid. The first test below is the one that matters — a
// pre-existing blocker is ADOPTED, with its note intact, and is never invented,
// discarded, or re-attributed to whoever happens to be holding the device.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const PHASES_KEY = 'phantom_deploy_phases_v1';
const BLOCKERS_KEY = 'phantom_blockers_v1';

/** A device that blocked a phase under the OLD model: a note, no record. */
const seedLegacyBlocked = (page) => page.evaluate(({ pk, bk }) => {
  localStorage.removeItem(bk);
  localStorage.setItem(pk, JSON.stringify([{
    id: 'PH-OLD', deploymentId: 'DEP-1', rackId: 'u1:007', type: 'rack',
    status: 'blocked', blockerNote: 'Missing 12x LR4 optics', blockedAt: 1750000000000,
  }]));
}, { pk: PHASES_KEY, bk: BLOCKERS_KEY });

test.describe('the Blocker record — adopting what is already there', () => {

  test('THE ONE THAT MATTERS: a pre-existing blocker is adopted, note intact', async ({ phantom, page }) => {
    await phantom.boot();
    await seedLegacyBlocked(page);
    const out = await page.evaluate(({ pk }) => {
      const made = PHANTOM_BLOCKERS.migrate();
      const phases = JSON.parse(localStorage.getItem(pk) || '[]');
      return { made, rec: PHANTOM_BLOCKERS.open()[0], phase: phases[0] };
    }, { pk: PHASES_KEY });

    expect(out.made, 'the pre-existing blocker was not adopted').toBe(1);
    // The note WAS the description all along — it just had no home.
    expect(out.rec.desc, 'the operator note must become the description, verbatim').toBe('Missing 12x LR4 optics');
    expect(out.rec.openedAt, 'the original timestamp must survive').toBe(1750000000000);
    expect(out.rec.rack).toBe('u1:007');
    expect(out.rec.migrated).toBe(true);
    // Never credit an old blocker to whoever happens to be holding the device now.
    expect(out.rec.openedBy, 'a migrated blocker must not be attributed to the current operator')
      .toMatch(/pre-v1\.14\.420/);
    // And the phase now satisfies §6.2 rather than being an illegal state.
    expect(out.phase.blockerId, 'the blocked phase must now reference its record').toBe(out.rec.blockerId);
    expect(out.phase.status).toBe('blocked');
    expect(out.phase.blockerNote, 'the original note is not destroyed').toBe('Missing 12x LR4 optics');
  });

  test('migration is IDEMPOTENT — a second boot adopts nothing', async ({ phantom, page }) => {
    await phantom.boot();
    await seedLegacyBlocked(page);
    const out = await page.evaluate(() => {
      const first = PHANTOM_BLOCKERS.migrate();
      const second = PHANTOM_BLOCKERS.migrate();
      return { first, second, count: PHANTOM_BLOCKERS.loadAll().length };
    });
    expect(out.first).toBe(1);
    expect(out.second, 'a second run must adopt nothing').toBe(0);
    expect(out.count, 'and must not duplicate the record').toBe(1);
  });

  test('a blocker with NO note still gets a record, and says so honestly', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(({ pk, bk }) => {
      localStorage.removeItem(bk);
      localStorage.setItem(pk, JSON.stringify([{ id: 'PH-BARE', deploymentId: 'DEP-1', rackId: 'u1:009', status: 'blocked' }]));
      PHANTOM_BLOCKERS.migrate();
      return PHANTOM_BLOCKERS.open()[0];
    }, { pk: PHASES_KEY, bk: BLOCKERS_KEY });
    // Never fabricate a description. Say that none was recorded.
    expect(out.desc).toMatch(/no description recorded/i);
  });
});

test.describe('the Blocker record — opening and clearing', () => {

  test('opening through the real door creates a record BEFORE the phase is blocked', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(({ pk, bk }) => {
      localStorage.removeItem(bk);
      localStorage.setItem(pk, JSON.stringify([{
        id: 'PH-NEW', deploymentId: 'DEP-1', rackId: 'u1:012', type: 'rack', status: 'pending',
      }]));
      const p = siteProfile_load();
      p.facilityId = 'US-QRS03'; p.operator = 'R. Vega'; p.confirmedAt = Date.now();
      siteProfile_save(p);
      blocker_save('DEP-1', 'u1:012', 'PH-NEW', 'PDU whip not landed');
      const phases = JSON.parse(localStorage.getItem(pk) || '[]');
      return { rec: PHANTOM_BLOCKERS.open()[0], phase: phases[0] };
    }, { pk: PHASES_KEY, bk: BLOCKERS_KEY });

    expect(out.rec, 'no Blocker record was created').toBeTruthy();
    expect(out.rec.desc).toBe('PDU whip not landed');
    expect(out.rec.openedBy, 'the record credits the ACTOR from the profile').toBe('R. Vega');
    expect(out.rec.clearedAt, 'a new blocker is open').toBeNull();
    // §6.2 — the invalid state (blocked with no record) must never exist on disk.
    expect(out.phase.blockerId, 'the phase must reference the record').toBe(out.rec.blockerId);
  });

  test('an open blocker writes a BLOCKER_OPENED event carrying the rack', async ({ phantom, page }) => {
    await phantom.boot();
    const ev = await page.evaluate(({ pk, bk }) => {
      localStorage.removeItem(bk);
      localStorage.removeItem('phantom_deploy_audit_v1');
      localStorage.setItem(pk, JSON.stringify([{ id: 'PH-EV', deploymentId: 'DEP-EV', rackId: 'u1:014', status: 'pending' }]));
      blocker_save('DEP-EV', 'u1:014', 'PH-EV', 'bent cage nut');
      const all = JSON.parse(localStorage.getItem('phantom_deploy_audit_v1') || '[]');
      return all.filter((e) => e.action === 'BLOCKER_OPENED')[0] || null;
    }, { pk: PHASES_KEY, bk: BLOCKERS_KEY });
    expect(ev, 'opening a blocker must write an event').toBeTruthy();
    expect(ev.rack, 'the event carries the rack through the new meta channel').toBe('u1:014');
    expect(ev.hashV, 'and it is a v2 event').toBe(2);
  });

  test('clearing records WHO cleared it and WHEN, and stops it being open', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(() => {
      localStorage.removeItem('phantom_blockers_v1');
      const p = siteProfile_load();
      p.facilityId = 'US-QRS03'; p.operator = 'A. Closer'; p.confirmedAt = Date.now();
      siteProfile_save(p);
      const id = PHANTOM_BLOCKERS.create({ rack: 'u1:020', desc: 'missing optic', deploymentId: 'DEP-C' });
      const openBefore = PHANTOM_BLOCKERS.open().length;
      const cleared = PHANTOM_BLOCKERS.clear(id);
      return { openBefore, cleared, openAfter: PHANTOM_BLOCKERS.open().length, all: PHANTOM_BLOCKERS.loadAll().length };
    });
    expect(out.openBefore).toBe(1);
    expect(out.cleared.clearedBy).toBe('A. Closer');
    expect(out.cleared.clearedAt).toBeTruthy();
    expect(out.openAfter, 'a cleared blocker is no longer open').toBe(0);
    // Append-only in spirit: clearing does not delete the record, it closes it.
    expect(out.all, 'the record must survive being cleared — history is not erased').toBe(1);
  });

  test('clearing an unknown or already-cleared blocker returns null rather than lying', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(() => {
      localStorage.removeItem('phantom_blockers_v1');
      const id = PHANTOM_BLOCKERS.create({ desc: 'x' });
      PHANTOM_BLOCKERS.clear(id);
      return { second: PHANTOM_BLOCKERS.clear(id), bogus: PHANTOM_BLOCKERS.clear('blk_nope') };
    });
    expect(out.second, 'clearing twice must not silently succeed').toBeNull();
    expect(out.bogus).toBeNull();
  });

  test('the new store is CLASSIFIED for backup — an unregistered key dies at export', async ({ phantom, page }) => {
    await phantom.boot();
    const known = await page.evaluate(() =>
      PHANTOM_BACKUP_EXTRA_KEYS.map((r) => r.k).concat(PHANTOM_BACKUP_NAMED_KEYS));
    // Open blockers are exactly what the next technician inherits (§9.3). A store that is not
    // in the registry is reported as an unclassified gap and never travels in a backup.
    expect(known, 'phantom_blockers_v1 is not classified for backup').toContain('phantom_blockers_v1');
  });
});

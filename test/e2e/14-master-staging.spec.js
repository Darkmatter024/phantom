// ─────────────────────────────────────────────────────────────────────────────
// 14 — MASTER STAGING AND THE VALIDATION SUMMARY (v1.14.422, workstream 2)
//
// WHY THIS SPEC EXISTS
// Until now a Master file became the site the moment it PARSED. That is how a
// Master carrying cables and no hosts became active silently, leaving Forge to
// report the emptiness days later in a cold aisle — the investigation that cost
// most of a session and ended with the honest answer being "look at column D".
//
// Spec §4.1/§4.2: a candidate parses into a staging object invisible to every
// technician surface, its counts are shown, and it becomes active only on a tap.
// A failed or cancelled import leaves the active Master untouched, and §4.2 calls
// that a HARD GUARANTEE rather than reassuring copy — so it is tested as one.
//
// ZERO HOSTS WARNS, IT DOES NOT REJECT (owner ruling). A cabled, unprovisioned
// row is legitimate data — established at v1.14.413, and the reason the earlier
// "0/0 RACKED" report turned out to be honest. PHANTOM reports what it found and
// lets the operator decide.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const master = (over) => Object.assign({
  racksByCab: { 'a:01': { hosts: [{ u: 1 }, { u: 2 }] }, 'a:02': { hosts: [{ u: 3 }] } },
  sourceFileHash: 'CAND-1', sourceFile: 'CANDIDATE.xlsx', siteCode: 'US-QRS03',
  stats: { totalCables: 68 },
}, over || {});

test.describe('validation summary — counts only, never a verdict about the floor', () => {

  test('counts racks, hosts and cables from the candidate', async ({ phantom, page }) => {
    await phantom.boot();
    const v = await page.evaluate((m) => PHANTOM_MASTER.validate(m), master());
    expect(v.ok).toBe(true);
    expect(v.counts).toEqual({ racks: 2, hosts: 3, cables: 68 });
    expect(v.warnings).toEqual([]);
  });

  test('ZERO HOSTS warns and stays activatable — a cabled unprovisioned row is legitimate', async ({ phantom, page }) => {
    await phantom.boot();
    const v = await page.evaluate((m) => PHANTOM_MASTER.validate(m),
      master({ racksByCab: { 'a:01': { hosts: [] }, 'a:02': { hosts: [] } } }));
    // The ruling is warn-and-accept. Rejecting here would make a legitimate import impossible.
    expect(v.ok, 'a host-less Master must remain activatable').toBe(true);
    expect(v.counts.hosts).toBe(0);
    expect(v.warnings.join(' '), 'and the operator must be told, at IMPORT, not in an aisle')
      .toMatch(/NO host\/device rows/i);
    expect(v.warnings.join(' '), 'the warning names where to look').toMatch(/SITE-HOSTS/);
  });

  test('a Master with no readable racks is NOT ok', async ({ phantom, page }) => {
    await phantom.boot();
    const v = await page.evaluate((m) => PHANTOM_MASTER.validate(m), master({ racksByCab: {} }));
    expect(v.ok).toBe(false);
    expect(v.warnings.join(' ')).toMatch(/cannot become the active Master/i);
  });

  test('an empty required sheet is surfaced in the summary', async ({ phantom, page }) => {
    await phantom.boot();
    const v = await page.evaluate((m) => PHANTOM_MASTER.validate(m),
      master({ stats: { totalCables: 68, sheetsEmpty: ['SITE-HOSTS'] } }));
    expect(v.warnings.join(' ')).toMatch(/SITE-HOSTS/);
  });
});

test.describe('staging — a candidate never participates in the UI', () => {

  test('staging does NOT make a candidate active', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((cand) => {
      PHANTOM_MASTER.adoptRestored({ racksByCab: { 'live:01': { hosts: [] } }, sourceFileHash: 'MASTER-LIVE', sourceFile: 'LIVE.xlsx' });
      PHANTOM_MASTER.stage(cand);
      return {
        activeId: PHANTOM_MASTER.id(),
        stagedFile: (PHANTOM_MASTER.staged() || {}).sourceFile,
        activeFile: (PHANTOM_MASTER.active() || {}).sourceFile,
      };
    }, master());
    expect(out.stagedFile, 'the candidate is staged').toBe('CANDIDATE.xlsx');
    // Nothing derives from a staged candidate — the live Master is untouched.
    expect(out.activeId).toBe('MASTER-LIVE');
    expect(out.activeFile).toBe('LIVE.xlsx');
  });

  test('THE HARD GUARANTEE: discarding leaves the current site completely unchanged', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((cand) => {
      PHANTOM_MASTER.adoptRestored({ racksByCab: { 'live:01': { hosts: [{ u: 1 }] } }, sourceFileHash: 'MASTER-LIVE', sourceFile: 'LIVE.xlsx' });
      const before = { id: PHANTOM_MASTER.id(), file: (PHANTOM_MASTER.active() || {}).sourceFile };
      PHANTOM_MASTER.stage(cand);
      PHANTOM_MASTER.discardStaged();
      return { before, afterId: PHANTOM_MASTER.id(), afterFile: (PHANTOM_MASTER.active() || {}).sourceFile, staged: PHANTOM_MASTER.staged() };
    }, master());
    expect(out.staged, 'the candidate is gone').toBeNull();
    expect(out.afterId, 'the active Master identity must not have moved').toBe(out.before.id);
    expect(out.afterFile).toBe(out.before.file);
  });

  test('activateStaged is the ONLY way a candidate becomes active, and it binds the profile', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((cand) => {
      const p = siteProfile_load();
      p.facilityId = 'US-QRS03'; p.operator = 'R. Vega'; p.confirmedAt = Date.now(); p.id = 'sp_stage';
      p.activeMasterId = 'MASTER-OLD'; siteProfile_save(p);
      PHANTOM_MASTER.adoptRestored({ racksByCab: { 'live:01': { hosts: [] } }, sourceFileHash: 'MASTER-OLD', sourceFile: 'OLD.xlsx' });
      PHANTOM_MASTER.stage(cand);
      const ok = PHANTOM_MASTER.activateStaged();
      return {
        ok, activeId: PHANTOM_MASTER.id(), staged: PHANTOM_MASTER.staged(),
        boundTo: siteProfile_load().activeMasterId,
        binding: PHANTOM_SITE.masterBinding().state,
      };
    }, master());
    expect(out.ok).toBe(true);
    expect(out.activeId, 'the candidate is now the active Master').toBe('CAND-1');
    expect(out.staged, 'staging is cleared on activation').toBeNull();
    // The profile must follow the Master it now operates against, or §10's identity check
    // would report a mismatch the moment the operator activated a file on purpose.
    expect(out.boundTo, 'the profile re-binds to the newly activated Master').toBe('CAND-1');
    expect(out.binding).toBe('match');
  });

  test('activating with nothing staged does not invent a Master', async ({ phantom, page }) => {
    await phantom.boot();
    const ok = await page.evaluate(() => { PHANTOM_MASTER.discardStaged(); return PHANTOM_MASTER.activateStaged(); });
    expect(ok).toBe(false);
  });
});

test.describe('the restore path — RECOVERY ONLY, never a door into a running app', () => {

  test('restore hands control back to the boot state machine instead of asking the operator to', async ({ phantom, page }) => {
    await phantom.boot();
    const shape = await page.evaluate(() => {
      const src = String(window.phantom_restoreComplete || '');
      return {
        exists: typeof window.phantom_restoreComplete === 'function',
        reloads: /location\.reload\(\)/.test(src),
        // The old copy told the operator to reload. That sentence WAS the split-brain,
        // handed over as a chore — if it comes back, so has the defect.
        asksTheOperator: /Reload the app to see restored data/.test(src),
      };
    });
    expect(shape.exists, 'both restore paths must converge on one door').toBe(true);
    expect(shape.reloads, 'a restore must re-enter boot, not return to a half-updated app').toBe(true);
    expect(shape.asksTheOperator, 'restoring must not leave consistency as a manual follow-up step').toBe(false);
  });

  test('a boot after a restored snapshot ends with memory and storage AGREEING', async ({ phantom, page }) => {
    await phantom.boot();
    // Simulate what a restore leaves behind: a Master snapshot written straight to storage,
    // with the running app never told. Then re-enter boot the way the reload does.
    await page.evaluate(() => {
      PHANTOM_MASTER.clear();
      PHANTOM_MASTER_STORE.save({
        racksByCab: { 'restored:01': { hosts: [{ u: 1 }] } },
        sourceFileHash: 'RESTORED-MASTER', sourceFile: 'FROM-BACKUP.xlsx',
        stats: { sourceFileHash: 'RESTORED-MASTER' },
      });
    });
    await page.reload();
    await page.waitForFunction(() => typeof window.PHANTOM_MASTER !== 'undefined', { timeout: 20_000 });

    const out = await page.evaluate(() => {
      const live = PHANTOM_MASTER.active();
      const stored = PHANTOM_MASTER_STORE.load();
      return {
        liveId: PHANTOM_MASTER.id(),
        storedId: PHANTOM_MASTER.idOf(stored),
        liveFile: (live || {}).sourceFile,
        restoredFlag: !!(live || {}).restoredFromStorage,
      };
    });
    // This is the assertion the whole SINGLE-MASTER ruling exists for: after recovery, the two
    // halves of "active" name the same Master. Before this ship they could not.
    expect(out.liveId, 'boot adopted the restored snapshot').toBe('RESTORED-MASTER');
    expect(out.storedId, 'and storage still holds it').toBe('RESTORED-MASTER');
    expect(out.liveId).toBe(out.storedId);
    expect(out.restoredFlag, 'adopted through the contract, not assigned raw').toBe(true);
  });
});

test.describe('the identity split reaches the assistant context', () => {

  test('the context block names authority and actor DISTINCTLY', async ({ phantom, page }) => {
    await phantom.boot();
    const block = await page.evaluate(() => {
      const p = siteProfile_load();
      p.facilityId = 'US-QRS03'; p.facilityName = 'Spokane';
      p.siteLead = 'J. Hamilton'; p.operator = 'R. Vega'; p.confirmedAt = Date.now();
      siteProfile_save(p);
      return siteProfile_getContextBlock();
    });
    // Before this, the one surface that tells the assistant who it is talking to knew only a
    // deployment-level buildLead — nothing about the site's authority or who is holding the phone.
    expect(block).toMatch(/Site lead \(authority\): J\. Hamilton/);
    expect(block).toMatch(/Current operator on this device \(the actor\): R\. Vega/);
  });
});

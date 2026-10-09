// ─────────────────────────────────────────────────────────────────────────────
// 11 — THE EVENT LOG (v1.14.419, P1 of PHASE-ENGINE)
//
// WHY THIS SPEC EXISTS
// The governing spec describes an append-only Event Log with no edits and no
// deletes. That log already existed as phantom_deploy_audit_v1, with the harder
// half already built: hash chaining and tamper evidence. P1 folds the spec's
// fields into it rather than building a second store.
//
// THE FAILURE THIS SPEC IS REALLY GUARDING
// The hash is taken over a FIXED FIELD LIST, and deploy_verifyAuditChain
// RE-HASHES each stored entry with that list before comparing to the digest the
// entry was written with. Appending five fields to that list would have re-hashed
// every pre-existing entry under a wider canonical form, produced a different
// digest for all of them, and made the chain report TAMPERING across the
// operator's entire history — on a device where nothing was wrong.
//
// A tamper-evident log that cries wolf is worse than not having one. So the
// canonical form is VERSIONED, and the first test below is the regression that
// matters: an entry written under v1 must still verify after P1 exists.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const AUDIT_KEY = 'phantom_deploy_audit_v1';

/** Build a v1-shaped entry exactly as pre-P1 code would have written it. */
const seedV1Entry = (page, overrides) => page.evaluate(({ key, ov }) => {
  const e = Object.assign({
    id: 'audit_legacy_1', deploymentId: 'DEP-LEGACY', ts: 1750000000000,
    actor: 'OLD TECH', action: 'RACK_ASSIGNED', entityType: 'rack',
    entityId: 'US-E2E-R01', summary: 'seeded under v1', prevHash: '',
  }, ov || {});
  // hashed WITHOUT hashV — the v1 canonical form
  e.hash = window.sha256(JSON.stringify(
    ['id','deploymentId','ts','actor','action','entityType','entityId','summary','prevHash']
      .reduce((o, k) => { o[k] = (e[k] === undefined || e[k] === null) ? '' : e[k]; return o; }, {})));
  localStorage.setItem(key, JSON.stringify([e]));
  return e;
}, { key: AUDIT_KEY, ov: overrides });

test.describe('the Event Log — folding without breaking the chain', () => {

  test('THE REGRESSION THAT MATTERS: a v1 entry still verifies after P1', async ({ phantom, page }) => {
    await phantom.boot();
    const seeded = await seedV1Entry(page);
    expect(seeded.hash, 'fixture: the seeded entry must carry a v1 digest').toBeTruthy();
    expect(seeded.hashV, 'fixture: a v1 entry has NO hashV').toBeUndefined();

    const chain = await page.evaluate(() => deploy_verifyAuditChain());
    // If the canonical form were not versioned, this entry would re-hash under the wider
    // v2 field set and report as tampered — every historical entry on the device would.
    expect(chain.brokenAt, 'a pre-P1 entry must NOT be reported as tampered').toBeNull();
    expect(chain.ok).toBe(true);
    expect(chain.hashed).toBe(1);
  });

  test('a new entry is v2 and carries the spec §6.3 fields', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((key) => {
      localStorage.removeItem(key);
      const p = siteProfile_load();
      p.facilityId = 'US-QRS03'; p.operator = 'R. Vega'; p.confirmedAt = Date.now();
      p.id = 'sp_test_1'; siteProfile_save(p);
      PHANTOM_MASTER.adoptRestored({ racksByCab: { 'e2e:01': { hosts: [] } }, sourceFileHash: 'MASTER-P1', sourceFile: 'P1.xlsx' });
      deploy_logAudit('DEP-P1', 'STEP_STATE_CHANGE', 'step', 'P4-S02', 'network step complete',
        { rack: 'u1:005', stepId: 'P4-S02', evidence: ['photo:abc'] });
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      return all[all.length - 1];
    }, AUDIT_KEY);

    expect(out.hashV, 'a new entry declares the canonical version it was hashed under').toBe(2);
    // PROVENANCE IS STAMPED, NOT PASSED — this is what makes the log survive a Master swap
    // with the truth-context that produced each entry (spec §4.3).
    expect(out.siteProfileId, 'siteProfileId is stamped automatically from the profile').toBe('sp_test_1');
    expect(out.masterId, 'masterId is stamped automatically from the LIVE Master').toBe('MASTER-P1');
    // Optional detail, supplied by the caller.
    expect(out.rack).toBe('u1:005');
    expect(out.stepId).toBe('P4-S02');
    expect(out.evidence).toEqual(['photo:abc']);
    expect(out.actor, 'and the actor still comes from the profile (P0)').toBe('R. Vega');
  });

  test('the 25 existing 5-arg callers still work — meta is optional', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((key) => {
      localStorage.removeItem(key);
      deploy_logAudit('DEP-OLD', 'OMNI_NOTE', 'deployment', 'DEP-OLD', 'a note');   // no meta
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      return { entry: all[all.length - 1], chain: deploy_verifyAuditChain() };
    }, AUDIT_KEY);
    expect(out.entry.summary).toBe('a note');
    expect(out.entry.rack, 'absent detail is empty, never undefined').toBe('');
    expect(out.entry.evidence).toEqual([]);
    expect(out.chain.ok, 'an entry written the old way still chains').toBe(true);
  });

  test('a MIXED chain — v1 then v2 — verifies end to end', async ({ phantom, page }) => {
    await phantom.boot();
    await seedV1Entry(page);
    const chain = await page.evaluate((key) => {
      // append a v2 entry on top of the legacy one, through the real door
      deploy_logAudit('DEP-MIX', 'SCAN_VERIFIED', 'optic', 'QSFP-1', 'verified', { rack: 'u1:007' });
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      return { verify: deploy_verifyAuditChain(), count: all.length, linked: all[1] && all[1].prevHash === all[0].hash };
    }, AUDIT_KEY);
    expect(chain.count).toBe(2);
    expect(chain.linked, 'the v2 entry must chain to the v1 entry it follows').toBe(true);
    expect(chain.verify.ok, 'a mixed-generation chain must verify').toBe(true);
    expect(chain.verify.brokenAt).toBeNull();
  });

  test('tampering with a v2-ONLY field is DETECTED — the new fields are really covered', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((key) => {
      localStorage.removeItem(key);
      deploy_logAudit('DEP-T', 'AS_BUILT_RECORDED', 'rack', 'u1:009', 'as-built', { rack: 'u1:009', stepId: 'P2-S01' });
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      const clean = deploy_verifyAuditChain();
      // rewrite history: change WHICH MASTER produced this event, leaving the digest alone
      all[0].masterId = 'A-DIFFERENT-MASTER';
      localStorage.setItem(key, JSON.stringify(all));
      return { clean: clean, tampered: deploy_verifyAuditChain() };
    }, AUDIT_KEY);
    expect(out.clean.ok, 'fixture: the entry verified before tampering').toBe(true);
    // If the five new fields were left out of the hashed set they would be silently editable —
    // provenance you cannot trust is worse than provenance you do not have.
    expect(out.tampered.ok, 'editing masterId after the fact must break the chain').toBe(false);
    expect(out.tampered.brokenAt).toBe(0);
  });

  test('§4.3 — the Event Log SURVIVES a Master swap, with masterId preserving the truth-context', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((key) => {
      localStorage.removeItem(key);
      const p = siteProfile_load();
      p.facilityId = 'US-QRS03'; p.operator = 'R. Vega'; p.confirmedAt = Date.now(); p.id = 'sp_swap';
      siteProfile_save(p);

      // work logged under Master A
      PHANTOM_MASTER.adoptRestored({ racksByCab: { 'a:01': { hosts: [] } }, sourceFileHash: 'MASTER-A', sourceFile: 'A.xlsx' });
      deploy_logAudit('DEP-S', 'STEP_STATE_CHANGE', 'step', 'network-S01', 'done under A', { rack: 'u1:001' });

      // ...then the operator swaps to Master B through the one door
      const swapped = PHANTOM_MASTER.replace({ racksByCab: { 'b:01': { hosts: [{ u: 1 }] } }, sourceFileHash: 'MASTER-B', sourceFile: 'B.xlsx' });
      deploy_logAudit('DEP-S', 'STEP_STATE_CHANGE', 'step', 'power-S01', 'done under B', { rack: 'u1:002' });

      const all = JSON.parse(localStorage.getItem(key) || '[]');
      return { swapped, all, chain: deploy_verifyAuditChain(), live: PHANTOM_MASTER.id() };
    }, AUDIT_KEY);

    expect(out.swapped, 'fixture: the swap must have happened').toBe(true);
    expect(out.live).toBe('MASTER-B');
    // §4.3 is explicit: events created under Master A REMAIN after B activates. "Helpfully"
    // clearing stale events during a swap would erase the operator's shift.
    expect(out.all.length, 'the pre-swap event was destroyed by the swap').toBe(2);
    expect(out.all[0].summary).toBe('done under A');
    // And each event still names the Master that produced it — that is what makes the surviving
    // history readable rather than merely present.
    expect(out.all[0].masterId, 'the old event must still name Master A').toBe('MASTER-A');
    expect(out.all[1].masterId, 'the new event names Master B').toBe('MASTER-B');
    expect(out.chain.ok, 'and the chain still verifies across the swap').toBe(true);
  });

  test('the truncation marker is still unhashed, so eviction does not read as tampering', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((key) => {
      localStorage.removeItem(key);
      deploy_logAudit('DEP-TR', 'BLOCKER_OPENED', 'step', 'P4-S02', 'missing optics');
      const all = JSON.parse(localStorage.getItem(key) || '[]');
      // the FIFO path mutates all[0] AFTER its hash was taken — those fields are deliberately
      // outside the hashed set, and P1's wider v2 set must not have swept them in.
      all[0].chainReset = true; all[0].truncatedCount = 12; all[0].truncatedAt = Date.now();
      localStorage.setItem(key, JSON.stringify(all));
      return deploy_verifyAuditChain();
    }, AUDIT_KEY);
    expect(out.ok, 'annotating an entry with truncation metadata must not break its digest').toBe(true);
  });
});

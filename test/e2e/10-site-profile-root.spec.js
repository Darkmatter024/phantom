// ─────────────────────────────────────────────────────────────────────────────
// 10 — ACTIVE_SITE_PROFILE, THE ROOT RECORD (v1.14.417, S0 of 4)
//
// WHY THIS SPEC EXISTS
// The owner ruling makes the Site Profile the root of the application, and stage 2
// of that ruling puts a GATE on boot: an invalid profile means SITE SETUP and no
// operational surface at all. A gate like that can lock an operator out of a
// working device in a cold aisle, and the only thing standing between those two
// outcomes is the migration in this spec — the code that turns a device which
// already has a confirmed profile and a loaded Master into one that carries a
// complete root record.
//
// So S0 ships alone, gating nothing, and these tests exist to prove the migration
// is safe BEFORE anything depends on it. The most important test here is not that
// migration fills fields. It is that it never overwrites one a human set, and that
// running it twice changes nothing.
//
// WHAT THIS SPEC DELIBERATELY DOES NOT ASSERT
// No surface reads the root record yet, so there is nothing visual to check. Any
// assertion about Home/Build/Forge consuming the profile belongs to S4, which the
// owner has explicitly NOT authorised. Writing it now would pin behaviour that
// does not exist.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const PROFILE_KEY = 'phantom_site_profile_v1';

/** Read the stored profile exactly as the app would see it. */
const readProfile = (page) => page.evaluate((k) => {
  const raw = localStorage.getItem(k);
  return raw ? JSON.parse(raw) : null;
}, PROFILE_KEY);

/** Seed a profile through localStorage, then reload so the app boots on top of it. */
async function seedProfile(page, profile) {
  await page.evaluate(({ k, p }) => localStorage.setItem(k, JSON.stringify(p)), { k: PROFILE_KEY, p: profile });
}

test.describe('ACTIVE_SITE_PROFILE — the contract', () => {

  test('PHANTOM_SITE exists and reports validity as a LIST OF REASONS, not a boolean', async ({ phantom, page }) => {
    await phantom.boot();
    const shape = await page.evaluate(() => ({
      exists: typeof window.PHANTOM_SITE === 'object' && window.PHANTOM_SITE !== null,
      fns: ['load', 'validity', 'isValid', 'currentOperator', 'siteLead', 'masterBinding', 'bindMaster', 'migrate', 'describe']
        .filter((f) => typeof (window.PHANTOM_SITE || {})[f] === 'function'),
      validity: window.PHANTOM_SITE ? window.PHANTOM_SITE.validity() : null,
    }));
    expect(shape.exists, 'PHANTOM_SITE is not defined — the root contract did not load').toBe(true);
    expect(shape.fns).toEqual(['load', 'validity', 'isValid', 'currentOperator', 'siteLead', 'masterBinding', 'bindMaster', 'migrate', 'describe']);
    // A technician cannot act on the word "invalid". S2's gate has to say what is missing.
    expect(Array.isArray(shape.validity.missing),
      'validity() must name what is missing so the setup screen can say it').toBe(true);
  });

  test('validity NAMES every missing requirement on a blank device', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate((k) => localStorage.removeItem(k), PROFILE_KEY);
    const v = await page.evaluate(() => window.PHANTOM_SITE.validity());
    expect(v.ok).toBe(false);
    // site / lead / operator / master / confirmation — the §3 setup inputs plus the gate stamp.
    for (const req of ['confirmation', 'site', 'site lead', 'current operator', 'master']) {
      expect(v.missing, `a blank device must report "${req}" as missing`).toContain(req);
    }
  });

  test('validity is COMPUTED, never a stored boolean', async ({ phantom, page }) => {
    await phantom.boot();
    // A profile carrying a stale "valid" claim must not be believed.
    await seedProfile(page, {
      facilityId: 'E2E-SITE', operator: 'E2E Lead', siteLead: 'J. Hamilton',
      confirmedAt: Date.now(), lastUpdated: Date.now(), schemaVersion: 2,
      valid: true, isValid: true,           // <- lies a stored flag could tell
      activeMasterId: null,
    });
    const v = await page.evaluate(() => window.PHANTOM_SITE.validity());
    expect(v.ok, 'a stored valid:true must not make an unbound profile valid').toBe(false);
    expect(v.missing, 'the real gap — no Master binding — must still be reported').toContain('master');
  });
});

test.describe('ACTIVE_SITE_PROFILE — migration is the thing that protects the operator', () => {

  // ⛔ RE-POINTED v1.14.587. THIS ASSERTED BEHAVIOUR THAT v1.14.538 DELETED ON PURPOSE, and it had
  // been red ever since — recorded at PHANTOM_CURRENT_STATE.md:1476 as "failing, not pinned, despite
  // the handoff calling it resolved", and confirmed a STANDING failure by the pinned baseline
  // (docs/PLAYWRIGHT-BASELINE.md). It was re-pointed, never loosened: the owner ruled the tolerance
  // question on the sibling defect the same day, and nothing here is relaxed to get green.
  //
  // WHAT CHANGED, AND WHY THE OLD ASSERTION WAS WRONG RATHER THAN UNLUCKY. Migration used to read
  //     if (!p.siteLead && p.operator) { p.siteLead = p.operator; filled.push('siteLead'); }
  // and dct-ios.html now carries "⛔ Do not restore it" where that line stood. The chain: v1.14.474's
  // two-field cold open removed Site Lead from Site Setup, so the migration's own escape clause —
  // "an unconfirmed profile gets nothing, it belongs in Site Setup, where a human states both" —
  // pointed at a door that no longer asked. The seed then quietly became THE ONLY WRITER OF SITE
  // AUTHORITY, granting it to whoever happened to set the device up, one boot after setup. v1.14.537
  // built the SITE/SYSTEM door Contract 9a always named. With somewhere to state it, inferring it is
  // a guess, and .418 already ruled that guessing here silently grants authority.
  //
  // ⭐ THE INTENT IS UNCHANGED — migration protects the operator. It now pins the STRONGER property:
  // migration completes the profile WITHOUT inventing authority, and the actor is still credited.
  test('migration completes the profile and does NOT invent site authority', async ({ phantom, page }) => {
    await phantom.boot();
    const confirmedAt = Date.now() - 86400000;
    await seedProfile(page, {
      facilityId: 'US-SPK03', facilityName: 'Spokane', operator: 'J. Hamilton',
      confirmedAt, lastUpdated: confirmedAt, schemaVersion: 2,
    });
    const res = await page.evaluate(() => window.PHANTOM_SITE.migrate());
    const after = await readProfile(page);
    const roles = await page.evaluate(() => ({
      lead: window.PHANTOM_SITE.siteLead(), actor: window.PHANTOM_SITE.currentOperator(),
    }));
    expect(res.migrated, 'migration did not run on a confirmed profile that still needs its id').toBe(true);
    expect(res.filled, 'the Event Log cannot bind without a stable profile id').toContain('id');
    // ⛔ THE ASSERTION THAT MATTERS NOW. Authority is stated by a human in SITE/SYSTEM, never
    // inferred from whoever set the device up (v1.14.538; .418 on guesses about authority).
    expect(res.filled, 'migration must not seed siteLead — .538 deleted that and said do not restore it')
      .not.toContain('siteLead');
    expect(after.siteLead || '', 'a migrated profile must carry NO site authority until a human states it')
      .toBe('');
    expect(roles.lead, 'siteLead() must report the absence honestly rather than borrowing the operator')
      .toBe('');
    // The ACTOR is still credited, and that half never changed: work belongs to the person holding
    // the device (Contract 9a), which is exactly what the old test was right to protect.
    expect(roles.actor).toBe('J. Hamilton');
    expect(after.id, 'profile id must be stable and present').toMatch(/^sp_usspk03_\d+$/);
    expect(after.rootMigratedAt, 'migration must stamp when it ran').toBeTruthy();
    expect(after.operator).toBe('J. Hamilton');
    expect(after.facilityId).toBe('US-SPK03');
    expect(after.confirmedAt).toBe(confirmedAt);
  });

  test('the actor is credited independently of authority — work is never auto-credited to the Site Lead', async ({ phantom, page }) => {
    await phantom.boot();
    await seedProfile(page, {
      facilityId: 'US-SPK03', siteLead: 'J. Hamilton', operator: 'R. Vega',   // night tech on this device
      confirmedAt: Date.now(), lastUpdated: Date.now(), schemaVersion: 2,
    });
    const who = await page.evaluate(() => ({
      lead: window.PHANTOM_SITE.siteLead(), actor: window.PHANTOM_SITE.currentOperator(),
    }));
    // Spec §2: every Event Log entry records the ACTOR. If these ever collapse to one value, a
    // second operator's completed step would be credited to the Site Lead who never touched it.
    expect(who.lead, 'authority').toBe('J. Hamilton');
    expect(who.actor, 'the person actually doing the work on this device').toBe('R. Vega');
    expect(who.actor).not.toBe(who.lead);
  });

  test('migration NEVER overwrites a value a human set', async ({ phantom, page }) => {
    await phantom.boot();
    await seedProfile(page, {
      facilityId: 'US-SPK03', operator: 'R. Vega', siteLead: 'A. Different Lead',
      activeMasterId: 'human-set-master-id', masterFile: 'THEIRS.xlsx',
      confirmedAt: Date.now(), lastUpdated: Date.now(), schemaVersion: 2,
    });
    await page.evaluate(() => window.PHANTOM_SITE.migrate());
    const after = await readProfile(page);
    // siteLead is already set and is NOT the operator — migration must not "correct" it.
    expect(after.siteLead, 'migration clobbered a Site Lead a human had set').toBe('A. Different Lead');
    expect(after.operator, 'migration clobbered the current operator').toBe('R. Vega');
    expect(after.activeMasterId, 'migration clobbered an existing Master binding').toBe('human-set-master-id');
    expect(after.masterFile).toBe('THEIRS.xlsx');
  });

  test('migration is IDEMPOTENT — the second run writes nothing', async ({ phantom, page }) => {
    await phantom.boot();
    await seedProfile(page, {
      facilityId: 'US-SPK03', operator: 'J. Hamilton',
      confirmedAt: Date.now(), lastUpdated: Date.now(), schemaVersion: 2,
    });
    const first = await page.evaluate(() => window.PHANTOM_SITE.migrate());
    const afterFirst = await readProfile(page);
    const second = await page.evaluate(() => window.PHANTOM_SITE.migrate());
    const afterSecond = await readProfile(page);
    expect(first.migrated).toBe(true);
    expect(second.migrated, 'a second migration must be a no-op').toBe(false);
    expect(second.reason).toBe('nothing to fill');
    // lastUpdated is stamped by siteProfile_save, so a no-op run must not have saved at all.
    expect(afterSecond.lastUpdated, 'the no-op run still wrote the record').toBe(afterFirst.lastUpdated);
  });

  test('an UNCONFIRMED profile is left COMPLETELY untouched — it belongs in Site Setup', async ({ phantom, page }) => {
    await phantom.boot();
    await seedProfile(page, { facilityId: '', operator: '', confirmedAt: null, schemaVersion: 2 });
    const res = await page.evaluate(() => window.PHANTOM_SITE.migrate());
    const after = await readProfile(page);
    expect(res.migrated, 'migration must not build half a profile in front of the flow that builds it').toBe(false);
    expect(res.reason).toContain('unconfirmed');
    // Not one field — not even the profile id, which is otherwise always filled.
    expect((after && after.siteLead) || '').toBe('');
    expect((after && after.id) || null, 'an unconfirmed device must not be given a profile id').toBeNull();
  });
});

test.describe('ONE ANSWER TO "WHO IS WORKING" (v1.14.418, P0 of PHASE-ENGINE)', () => {

  const LEGACY_KEY = 'phantom_current_user_v1';

  test('currentOperator is STRICT — an empty actor never inherits the Site Lead', async ({ phantom, page }) => {
    await phantom.boot();
    await seedProfile(page, {
      facilityId: 'US-SPK03', siteLead: 'J. Hamilton', operator: '',   // authority set, actor NOT
      confirmedAt: Date.now(), lastUpdated: Date.now(), schemaVersion: 2,
    });
    const out = await page.evaluate(() => ({
      actor: window.PHANTOM_SITE.currentOperator(),
      lead: window.PHANTOM_SITE.siteLead(),
    }));
    // This accessor also backs identity_getUser(), which gates LEAD-ONLY RBAC actions. A
    // read-time fallback to siteLead would hand those actions to whoever is holding a device
    // whose operator field happens to be empty. Spec §2's "defaults to Site Lead" is a value
    // WRITTEN at setup, not a coalesce evaluated on every read.
    expect(out.lead, 'fixture: authority is set').toBe('J. Hamilton');
    expect(out.actor, 'an unset actor must read as empty, never as the Site Lead').toBe('');
  });

  test('identity_getUser() resolves through the PROFILE, not the legacy key', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((lk) => {
      localStorage.setItem(lk, 'LEGACY NAME');
      const p = siteProfile_load();
      p.facilityId = 'US-SPK03'; p.operator = 'PROFILE NAME'; p.siteLead = 'J. Hamilton';
      p.confirmedAt = Date.now();
      siteProfile_save(p);
      return { who: identity_getUser(), legacyStillThere: localStorage.getItem(lk) };
    }, LEGACY_KEY);
    expect(out.who, 'the profile must win — it is the one owner of operator identity').toBe('PROFILE NAME');
    expect(out.legacyStillThere, 'the legacy key holds a name a human typed; it is not destroyed').toBe('LEGACY NAME');
  });

  test('identity_setUser() writes the PROFILE — the legacy key stops being a write target', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((lk) => {
      localStorage.removeItem(lk);
      const p = siteProfile_load();
      p.facilityId = 'US-SPK03'; p.confirmedAt = Date.now(); siteProfile_save(p);
      identity_setUser('R. Vega');
      return {
        profileOperator: siteProfile_load().operator,
        legacyWritten: localStorage.getItem(lk),
        readBack: identity_getUser(),
      };
    }, LEGACY_KEY);
    expect(out.profileOperator, 'setUser must write the profile').toBe('R. Vega');
    expect(out.legacyWritten, 'the legacy key must NOT be written any more').toBeNull();
    expect(out.readBack).toBe('R. Vega');
  });

  test('a legacy-only device is MIGRATED, so its operator keeps their attribution', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((lk) => {
      localStorage.setItem(lk, 'LEGACY TECH');
      const p = siteProfile_load();
      p.facilityId = 'US-SPK03'; p.operator = ''; p.siteLead = ''; p.confirmedAt = Date.now();
      siteProfile_save(p);
      const res = PHANTOM_SITE.migrate();
      return { res, after: siteProfile_load(), legacy: localStorage.getItem(lk) };
    }, LEGACY_KEY);
    // Dropping the legacy key silently would re-credit this person's past work to whatever the
    // profile happened to hold. Copied, never moved.
    expect(out.after.operator, 'the typed name must survive into the profile').toBe('LEGACY TECH');
    expect(out.legacy, 'copied, not moved — nothing is deleted').toBe('LEGACY TECH');
    expect(out.res.filled.join(','), 'migration must say what it carried across').toContain('legacy identity');
  });

  test('a DIVERGENCE between the two stores is recorded, not silently resolved', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((lk) => {
      localStorage.setItem(lk, 'OLD NAME');
      const p = siteProfile_load();
      p.facilityId = 'US-SPK03'; p.operator = 'NEW NAME'; p.siteLead = 'NEW NAME';
      p.confirmedAt = Date.now(); delete p.legacyOperatorDiverged;
      siteProfile_save(p);
      const res = PHANTOM_SITE.migrate();
      return { res, after: siteProfile_load(), actor: PHANTOM_SITE.currentOperator(), legacy: localStorage.getItem(lk) };
    }, LEGACY_KEY);
    // The profile wins by ruling — but this device HAS been crediting work to "OLD NAME", and
    // from now on it credits "NEW NAME". A silent switch of who gets credited is not something
    // this app does, so the divergence is recorded where it can be inspected and said.
    expect(out.actor, 'the profile is the owner').toBe('NEW NAME');
    expect(out.after.legacyOperatorDiverged, 'the superseded name must be recorded, not dropped').toBe('OLD NAME');
    expect(out.legacy, 'and the legacy key itself is still untouched on disk').toBe('OLD NAME');
    expect(out.res.filled.join(','), 'the migration must report that it saw a divergence').toContain('legacyOperatorDiverged');
  });

  test('THE POINT: the audit log credits the actor from the PROFILE', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate((lk) => {
      localStorage.setItem(lk, 'WRONG PERSON');       // the old source, deliberately different
      const p = siteProfile_load();
      p.facilityId = 'US-SPK03'; p.operator = 'R. Vega'; p.siteLead = 'J. Hamilton';
      p.confirmedAt = Date.now(); siteProfile_save(p);
      if (typeof deploy_logAudit !== 'function') return { skip: true };
      deploy_logAudit('e2e-dep-p0', 'STEP_STATE_CHANGE', 'step', 'P4-S02', 'e2e actor check');
      const all = (typeof deploy_loadAllAudit === 'function') ? deploy_loadAllAudit() : [];
      const mine = all.filter((e) => e && e.deploymentId === 'e2e-dep-p0');
      return { skip: false, last: mine[mine.length - 1] || null, count: mine.length };
    }, LEGACY_KEY);
    test.skip(out.skip, 'deploy_logAudit is not reachable at page scope in this build');
    expect(out.count, 'the audit entry was not written').toBeGreaterThan(0);
    // Before P0 this read WRONG PERSON, from a store the profile did not own.
    expect(out.last.actor, 'work must be credited to the profile actor, not a second identity store').toBe('R. Vega');
    expect(out.last.actor, 'and never to the Site Lead').not.toBe('J. Hamilton');
    // The chain must still verify — P0 changed who is named, not the append-only guarantees.
    const chain = await page.evaluate(() => (typeof deploy_verifyAuditChain === 'function') ? deploy_verifyAuditChain() : null);
    if (chain) expect(chain.brokenAt, 'P0 must not break the tamper-evident chain').toBeFalsy();
  });
});

test.describe('ACTIVE_SITE_PROFILE — the Master binding', () => {

  test('binding reports no-master / no-binding / match as DISTINCT states', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => { try { window.phantom_clearMaster(); } catch (_) {} });
    await seedProfile(page, {
      facilityId: 'US-SPK03', operator: 'J. Hamilton', siteLead: 'J. Hamilton',
      confirmedAt: Date.now(), lastUpdated: Date.now(), schemaVersion: 2,
    });

    const noMaster = await page.evaluate(() => window.PHANTOM_SITE.masterBinding());
    expect(noMaster.state, 'no Master loaded is not the same as a broken binding').toBe('no-master');

    // Adopt a Master through the one door, then bind.
    const bound = await page.evaluate(() => {
      const m = { racksByCab: { 'e2e:01': { hosts: [] } }, sourceFileHash: 'e2ehash001', sourceFile: 'E2E.xlsx' };
      PHANTOM_MASTER.adoptRestored(m);
      const before = PHANTOM_SITE.masterBinding().state;
      PHANTOM_SITE.bindMaster(PHANTOM_MASTER.active());
      return { before, after: PHANTOM_SITE.masterBinding() };
    });
    expect(bound.before, 'a live Master with no recorded binding is its own state').toBe('no-binding');
    expect(bound.after.state).toBe('match');
    expect(bound.after.recorded).toBe(bound.after.live);
  });

  test('a profile bound to a DIFFERENT Master reports mismatch — the §10 identity check', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(() => {
      PHANTOM_MASTER.adoptRestored({ racksByCab: { 'e2e:01': { hosts: [] } }, sourceFileHash: 'MASTER-B', sourceFile: 'B.xlsx' });
      const p = siteProfile_load();
      p.facilityId = 'US-SPK03'; p.operator = 'J. Hamilton'; p.siteLead = 'J. Hamilton';
      p.confirmedAt = Date.now();
      p.activeMasterId = 'MASTER-A';                 // set up against a different file
      siteProfile_save(p);
      return { binding: PHANTOM_SITE.masterBinding(), valid: PHANTOM_SITE.isValid() };
    });
    expect(out.binding.state, 'a profile pointing at a Master that is no longer live must say so').toBe('mismatch');
    expect(out.binding.recorded).toBe('MASTER-A');
    expect(out.binding.live).toBe('MASTER-B');
    // S0 records the mismatch; it does NOT gate on it. S2 owns that decision.
    expect(out.valid, 'S0 must not start rejecting profiles — recording only').toBe(true);
  });

  test('bindMaster is read-modify-write — it cannot wipe a field it has no input for', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(() => {
      const p = siteProfile_load();
      p.facilityId = 'US-SPK03'; p.operator = 'J. Hamilton'; p.siteLead = 'J. Hamilton';
      p.floorZones = 'CUSTOM ZONE TEXT'; p.pduType = 'CUSTOM PDU'; p.confirmedAt = Date.now();
      siteProfile_save(p);
      PHANTOM_MASTER.adoptRestored({ racksByCab: { 'e2e:01': { hosts: [] } }, sourceFileHash: 'bindhash', sourceFile: 'BIND.xlsx' });
      PHANTOM_SITE.bindMaster(PHANTOM_MASTER.active());
      return siteProfile_load();
    });
    // The v1.14.347 fresh-literal trap: a save path that rebuilds the object wipes what it
    // has no input for. bindMaster touches three fields and must leave everything else alone.
    expect(out.floorZones).toBe('CUSTOM ZONE TEXT');
    expect(out.pduType).toBe('CUSTOM PDU');
    expect(out.operator).toBe('J. Hamilton');
    expect(out.masterFile).toBe('BIND.xlsx');
  });

  test('S0 GATES NOTHING — the app still boots to its normal surface', async ({ phantom, page }) => {
    // The whole safety case for shipping S0 alone: an invalid profile must NOT yet change boot.
    await page.evaluate(() => { try { localStorage.removeItem('phantom_site_profile_v1'); } catch (_) {} });
    await phantom.boot();
    const state = await page.evaluate(() => ({
      valid: window.PHANTOM_SITE.isValid(),
      rdShell: document.body.classList.contains('rd'),
      navVisible: !!document.querySelector('#rd-botnav'),
    }));
    expect(state.valid, 'fixture check — this device should be invalid').toBe(false);
    expect(state.rdShell, 'S0 must not gate boot; the redesign shell must still come up').toBe(true);
    expect(state.navVisible, 'S0 must not remove the nav').toBe(true);
  });
});

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
// status.openBlockers, photoCount and photoBytes are asserted NULL: Ship 1 registers no blockers or
// photos adapter, and a 0 there would claim a measurement nobody made (Contract 10). They become
// numbers in the ships that register the adapters that own them.
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

test.describe('65 — the Rack Record assembler (Ship 1)', () => {
  test('RECORD · rr-1 shape, identity facts exactly as stored, and no number for an unregistered adapter', async ({ phantom, page }) => {
    test.setTimeout(180000);
    await boot(phantom);
    const rec = present(await assemble(page, RACK));

    expect(Object.keys(rec)).toEqual(['schema', 'assembledAt', 'site', 'rack', 'tech', 'status', 'timeline', 'evidence', 'coverage']);
    expect(rec.schema).toBe('rr-1');
    expect(typeof rec.assembledAt).toBe('number');

    expect(rec.site.siteId, 'siteId is the profile id, never facilityId (Q-7)').toBe('site_e2e_01');
    expect(rec.site.profile, 'profile carries stored values only: no defaults merged, no backfill').toEqual(PROFILE);

    expect(rec.rack).toEqual({ rackId: RACK, platform: null, masterPresent: null });
    expect(rec.tech, 'tech.identity is the ACTOR, never the site lead (Q-6)').toEqual({ identity: 'E2E' });

    expect(rec.status.openBlockers, 'no blockers adapter is registered in Ship 1').toBeNull();
    expect(rec.status.photoCount, 'no photos adapter is registered in Ship 1').toBeNull();
    expect(rec.status.photoBytes, 'no photos adapter is registered in Ship 1').toBeNull();
    expect(rec.evidence).toEqual({ photoIds: [] });

    // Q-2: platform and masterPresent are null "with a coverage detail saying why". No rack
    // adapter exists in A.2, so the reason is carried as its own row rather than left unsaid.
    expect(rec.coverage.slice(0, 2)).toEqual([
      { adapter: 'identity', status: 'ok', events: 0 },
      { adapter: 'phases', status: 'ok', events: 3 },
    ]);
    expect(rec.coverage.length).toBe(3);
    expect(rec.coverage[2].adapter).toBe('rack');
    expect(rec.coverage[2].status).toBe('empty');
    expect(rec.coverage[2].events).toBe(0);
    expect(rec.coverage[2].detail).toMatch(/platform/);
    expect(rec.coverage[2].detail).toMatch(/masterPresent/);
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
        PHANTOM_RR.registry = [saved[0], { name: 'boom', schemaHandled: 'test fault', read() { throw new Error('kaboom'); } }, saved[1]];
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
    expect(out.rec.coverage.slice(0, 3).map((c) => [c.adapter, c.status, c.events]))
      .toEqual([['identity', 'ok', 0], ['boom', 'error', 0], ['phases', 'ok', 3]]);
    expect(out.rec.coverage[1].detail).toMatch(/kaboom/);
    expect(out.rec.timeline.length, 'the phases adapter after the fault still contributed').toBe(3);
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
    const json = JSON.parse(await page.locator('#rr-dev-json').textContent());
    expect(json.rack.rackId).toBe(RACK);
    expect(json.timeline.length).toBe(3);

    const close = await page.locator('#rr-dev-close').boundingBox();
    expect(close && close.height, 'close control meets the 44pt floor').toBeGreaterThanOrEqual(44);
    await page.locator('#rr-dev-close').click();
    await expect(root).toHaveCount(0);

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

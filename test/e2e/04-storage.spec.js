// ─────────────────────────────────────────────────────────────────────────────────
// STORAGE INTEGRITY — the sacred layer.
//
// PHANTOM is offline-first. localStorage is not a cache here; it is the only copy of
// a technician's shift. Everything in this file asks one question: can the app lose
// a tech's work without telling them?
//
// What is asserted, and where it comes from (verified against dct-ios.html @ v1.14.405):
//   safeGet   :17053   read door — absent → fallback silently; corrupt → quarantine + toast
//   safeRemove:17071   delete door — returns false + warns instead of throwing
//   safeStore :17088   write door — returns false + toasts on quota
//   phantom_quarantine        :17019  · PHANTOM_QUARANTINE_KEY 'phantom_quarantine_v1' :17015
//   PHANTOM_BACKUP_EXTRA_KEYS :50576  (29 rows, each {k, why})
//   PHANTOM_BACKUP_PREFIXES   :50616  · NAMED :50628 · EXCLUDED :50633
//   phantom_backupCoverage    :50648  (M1-b — coverage MEASURED against live storage)
//   phantom_collectExtraKeys  :50668  · exportAllData :50688 · phantomImport :51168
//   DataStore                 :17526  (the load/save factory the app's own stores use)
//
// LOCAL HELPERS ONLY. fixtures.js is shared and was not touched; every helper this spec
// needs is defined below, in this file. BENIGN_CONSOLE was not extended.
//
// A NOTE ON CONSOLE ASSERTIONS: 00-boot.spec.js already owns "the app boots with a clean
// console". This spec runs long enough to reach phantomCheckApi's outbound fetch to the
// Cloudflare AI proxy (PHANTOM_PROXY_URL), which CORS-fails from 127.0.0.1 and logs an
// error + a pageerror. That is an environment artifact of running offline-first software
// with no network, NOT app behaviour, and it is NOT in the allowlist. So the assertions
// here are scoped to storage-shaped console output rather than to a blanket "no errors".
// ─────────────────────────────────────────────────────────────────────────────────

const { test, expect } = require('./fixtures');

// ── local helpers (this file only) ────────────────────────────────────────────────

/** Every localStorage key/value as a plain object, read in the page. */
const readAll = (page) => page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[k] = localStorage.getItem(k); }
  return out;
});

/** Text of every toast currently in #toast-container (:13059). Toasts self-remove at ~4.3s. */
const readToasts = (page) => page.evaluate(() =>
  Array.from(document.querySelectorAll('#toast-container div')).map((d) => d.textContent));

/**
 * Reset the two 10-second toast throttles (_safeStoreQuotaToastThrottle :17087,
 * _phQuarantineThrottle :17017) and clear the toast rail, so a "no toast appeared"
 * assertion cannot pass merely because an earlier toast was still inside its window.
 * Both are top-level `var`, therefore window properties.
 */
const armToastRail = (page) => page.evaluate(() => {
  window._safeStoreQuotaToastThrottle = 0;
  window._phQuarantineThrottle = 0;
  document.querySelectorAll('#toast-container div').forEach((d) => d.remove());
});

/**
 * Run `body` in the page with Storage.prototype.setItem throwing a real
 * QuotaExceededError, then restore it. Returns whatever body returns.
 * Simulating at the prototype means the app's own guards run unmodified — nothing
 * in dct-ios.html is stubbed.
 */
const underQuotaPressure = (page, body) => page.evaluate((src) => {
  const orig = Storage.prototype.setItem;
  try {
    Storage.prototype.setItem = function () {
      const e = new Error('QuotaExceededError: The quota has been exceeded.');
      e.name = 'QuotaExceededError'; e.code = 22;
      throw e;
    };
    // eslint-disable-next-line no-eval
    return (0, eval)('(' + src + ')')();
  } finally {
    Storage.prototype.setItem = orig;
  }
}, body.toString());

/**
 * Drive the app's REAL restore door (phantomImport :51168) with a bundle.
 * phantomImport builds a detached <input type=file> and clicks it, so Playwright's
 * filechooser event is the only way in — there is no DOM node to setInputFiles on.
 * Returns the dialogs the restore raised (it uses confirm()/alert(), not a custom sheet).
 */
async function driveRestore(page, jsonText) {
  const dialogs = [];
  const handler = (d) => { dialogs.push({ type: d.type(), message: d.message() }); d.accept().catch(() => {}); };
  page.on('dialog', handler);
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10_000 }),
      page.evaluate(() => phantomImport()),
    ]);
    await chooser.setFiles({
      name: 'phantom-full-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(jsonText, 'utf8'),
    });
    // The restore is FileReader-async and ends in an alert(). Wait on the alert, not a sleep.
    await expect.poll(() => dialogs.length, { timeout: 15_000, message: 'restore raised no dialog' })
      .toBeGreaterThan(0);
    await expect.poll(() => dialogs.some((d) => d.type === 'alert'), { timeout: 15_000 }).toBe(true);
  } finally {
    page.off('dialog', handler);
  }
  return dialogs;
}

/** Capture the bundle exportAllData() actually writes, via the real download. */
async function captureBackup(page) {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 20_000 }),
    page.evaluate(() => exportAllData()),
  ]);
  const path = await download.path();
  return { name: download.suggestedFilename(), text: require('fs').readFileSync(path, 'utf8') };
}

// A spread of real user data across all three coverage classes: NAMED bundle sections,
// registry rows (PHANTOM_BACKUP_EXTRA_KEYS), and a dynamic prefix key.
const FIELD_WORK = {
  // named sections — carry referential-integrity filtering, so the ids must line up
  'dct_sops_v1': JSON.stringify([{ id: 'SOP-E2E', title: 'Torque spec', body: 'to 8 Nm' }]),
  'dct_racks_v1': JSON.stringify([{ id: 'RM-E2E', name: 'R01', units: 48 }]),
  'phantom_deployments_v1': JSON.stringify([{ id: 'DEP-E2E', name: 'E2E Deployment', status: 'active' }]),
  'phantom_deploy_racks_v1': JSON.stringify([{ id: 'RK-E2E', deploymentId: 'DEP-E2E', rackId: 'US-E2E-R01' }]),
  'phantom_deploy_phases_v1': JSON.stringify([{ id: 'PH-E2E', deploymentId: 'DEP-E2E', rackId: 'RK-E2E', type: 'rack', status: 'pending' }]),
  'phantom_rack_history': JSON.stringify({ 'US-E2E-R01': [{ ts: 1750000000000, action: 'RACKED', detail: 'u12' }] }),
  // registry rows — real field work that the pre-M1 hand-listed export dropped
  'phantom_node_status_v1': JSON.stringify({ 'US-E2E-R01-U12': 'racked', 'US-E2E-R01-U14': 'pending' }),
  'phantom_discrepancies_v1': JSON.stringify([{ id: 'DSC-1', rack: 'US-E2E-R01', note: 'bent cage nut' }]),
  'phantom_deploy_issues_v1': JSON.stringify([{ id: 'ISS-1', severity: 'high', note: 'missing optic' }]),
  'phantom_audit_walk_v1': JSON.stringify({ walked: ['US-E2E-R01'], at: 1750000000000 }),
  'phantom_scan_collection': JSON.stringify(['SN-AAA111', 'SN-BBB222', 'SN-CCC333']),
  'phantom_classifier_overrides_v1': JSON.stringify({ 'QSFP-DD-400': 'optic' }),
  'phantom_current_user_v1': 'E2E-TECH',
  'deploy_forge_loadout_v1': JSON.stringify({ slots: [{ u: 1, sku: 'HGX-H100' }] }),
  'phantom_audits_v1': JSON.stringify([{ id: 'AUD-1', result: 'pass' }]),
  // dynamic prefix key — PHANTOM_BACKUP_PREFIXES sweep, unenumerable ahead of time
  'phantom_scaffold_v1::JOB-E2E': JSON.stringify({ steps: 4, done: 2 }),
};

// Leave nothing behind. Playwright already gives each test a fresh context (so storage
// is per-test), but this spec deliberately corrupts keys and stubs Storage.prototype —
// belt and braces so a future config change to context reuse cannot poison a neighbour.
test.afterEach(async ({ page }) => {
  await page.evaluate(() => {
    try { localStorage.clear(); } catch (_) { /* nothing to clean */ }
  }).catch(() => { /* page already closed — nothing to clean either */ });
  // Every Storage.prototype stub in this file is installed and removed inside a
  // try/finally in the SAME page.evaluate call, so no prototype patch can outlive a test
  // even if an assertion throws.
});

// ═════════════════════════════════════════════════════════════════════════════════
test.describe('the guarded storage doors', () => {

  test('safeGet, safeStore and safeRemove exist as the canonical doors', async ({ phantom, page }) => {
    await phantom.boot();
    const shape = await page.evaluate(() => ({
      safeGet: typeof safeGet,
      safeStore: typeof safeStore,
      safeRemove: typeof safeRemove,
      safeParse: typeof safeParse,
      quarantine: typeof phantom_quarantine,
      quarantineKey: PHANTOM_QUARANTINE_KEY,
      arity: [safeGet.length, safeStore.length, safeRemove.length],
    }));
    expect(shape.safeGet).toBe('function');
    expect(shape.safeStore).toBe('function');
    expect(shape.safeRemove).toBe('function');
    expect(shape.safeParse).toBe('function');
    expect(shape.quarantine).toBe('function');
    expect(shape.quarantineKey).toBe('phantom_quarantine_v1');
    expect(shape.arity, 'safeGet(key,fallback) safeStore(key,value) safeRemove(key)').toEqual([2, 2, 1]);
  });

  test('an absent key returns the fallback silently — absence is normal, not an event', async ({ phantom, page }) => {
    await phantom.boot();
    await armToastRail(page);
    const r = await page.evaluate(() => {
      localStorage.removeItem('phantom_quarantine_v1');
      const a = safeGet('phantom_no_such_key_v1', 'FALLBACK');
      const b = safeGet('phantom_no_such_key_v1', []);
      return { a, bIsArray: Array.isArray(b), quarantined: localStorage.getItem('phantom_quarantine_v1') };
    });
    expect(r.a).toBe('FALLBACK');
    expect(r.bIsArray).toBe(true);
    expect(r.quarantined, 'an absent key must never be quarantined').toBeNull();
    expect(await readToasts(page), 'an absent key must not toast at the operator').toEqual([]);
  });

  test('safeGet returns the fallback and warns when storage itself is unreadable', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      const orig = Storage.prototype.getItem;
      let out, threw = null;
      try {
        Storage.prototype.getItem = function () { throw new Error('SecurityError: storage disabled'); };
        out = safeGet('phantom_site_profile_v1', 'FALLBACK');
      } catch (e) { threw = String(e); } finally { Storage.prototype.getItem = orig; }
      return { out, threw };
    });
    expect(r.threw, 'safeGet must never throw into its caller').toBeNull();
    expect(r.out).toBe('FALLBACK');
    const warns = phantom.warnings().map((w) => w.text).join('\n');
    expect(warns, 'an unreadable store must be reported, not swallowed').toMatch(/safeGet: storage unreadable/);
  });

  test('safeRemove reports failure instead of throwing at a caller that assumed deletion', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      const orig = Storage.prototype.removeItem;
      let ok, threw = null;
      try {
        Storage.prototype.removeItem = function () { throw new Error('SecurityError: storage disabled'); };
        ok = safeRemove('phantom_anything_v1');
      } catch (e) { threw = String(e); } finally { Storage.prototype.removeItem = orig; }
      return { ok, threw };
    });
    expect(r.threw).toBeNull();
    expect(r.ok, 'safeRemove must return false, not silently claim success').toBe(false);
    expect(phantom.warnings().map((w) => w.text).join('\n')).toMatch(/safeRemove failed/);
  });

  test('a write over quota returns false, raises a toast and flags the app', async ({ phantom, page }) => {
    await phantom.boot();
    await armToastRail(page);
    const r = await underQuotaPressure(page, function () {
      window.__phantomStorageFull = undefined;
      const ok = safeStore('phantom_quota_probe_v1', 'x'.repeat(64));
      return {
        ok,
        flag: window.__phantomStorageFull,
        wrote: localStorage.getItem('phantom_quota_probe_v1'),
        toasts: Array.from(document.querySelectorAll('#toast-container div')).map((d) => d.textContent),
      };
    });
    expect(r.ok, 'safeStore must report a quota failure as false').toBe(false);
    expect(r.wrote, 'nothing may be half-written').toBeNull();
    expect(r.flag, '__phantomStorageFull must be raised (:17113)').toBe(true);
    expect(r.toasts.join(' | '), 'a quota failure must reach the operator, not just the console')
      .toMatch(/Storage full/i);
  });

  test("the app's own store factory reads and writes through the guarded doors", async ({ phantom, page }) => {
    // DataStore (:17526) is what loadSOPs/saveSOPs/loadOpticInventory are built from.
    // If the factory is guarded, ~every store in the app inherits it.
    await phantom.boot();
    await armToastRail(page);
    const corrupt = await page.evaluate(() => {
      localStorage.removeItem('phantom_quarantine_v1');
      localStorage.setItem('dct_sops_v1', '<<< not json at all >>>');
      let out, threw = null;
      try { out = loadSOPs(); } catch (e) { threw = String(e); }
      const q = localStorage.getItem('phantom_quarantine_v1');
      return {
        threw, out, isArray: Array.isArray(out),
        quarantined: q ? Object.keys(JSON.parse(q)) : [],
        bytesKept: localStorage.getItem('dct_sops_v1'),
      };
    });
    expect(corrupt.threw, 'a corrupt SOP store must not throw into the render path').toBeNull();
    expect(corrupt.isArray).toBe(true);
    expect(corrupt.out).toEqual([]);
    expect(corrupt.quarantined, "the app's reader must route through safeGet").toContain('dct_sops_v1');
    expect(corrupt.bytesKept, 'the damaged bytes must NOT be deleted').toBe('<<< not json at all >>>');

    await armToastRail(page);
    const full = await underQuotaPressure(page, function () {
      saveSOPs([{ id: 'S1' }]);
      return Array.from(document.querySelectorAll('#toast-container div')).map((d) => d.textContent);
    });
    expect(full.join(' | '), "the app's writer must surface a quota failure").toMatch(/Storage full/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════
test.describe('corrupt data quarantine', () => {

  test('a damaged blob is quarantined verbatim and the original bytes are preserved', async ({ phantom, page }) => {
    await phantom.boot();
    await armToastRail(page);
    const RAW = '{"deployments": [ THIS IS NOT JSON';
    const r = await page.evaluate((raw) => {
      localStorage.removeItem('phantom_quarantine_v1');
      localStorage.setItem('phantom_deployments_v1', raw);
      let out, threw = null;
      try { out = safeGet('phantom_deployments_v1', []); } catch (e) { threw = String(e); }
      const q = JSON.parse(localStorage.getItem('phantom_quarantine_v1') || '{}');
      return {
        threw, out,
        entry: q['phantom_deployments_v1'] || null,
        original: localStorage.getItem('phantom_deployments_v1'),
        toasts: Array.from(document.querySelectorAll('#toast-container div')).map((d) => d.textContent),
      };
    }, RAW);

    expect(r.threw, 'the read path must never throw').toBeNull();
    expect(r.out, 'the caller gets its honest fallback').toEqual([]);
    expect(r.entry, 'a corrupt read must produce a quarantine entry').not.toBeNull();
    expect(r.entry.raw, 'the bytes must be kept verbatim — this is the only surviving copy').toBe(RAW);
    expect(r.entry.bytes).toBe(RAW.length);
    expect(r.entry.truncated).toBe(false);
    expect(r.entry.error, 'the parse error is recorded, not discarded').toMatch(/./);
    expect(typeof r.entry.at).toBe('string');
    expect(r.original, 'quarantining must NOT delete the damaged key').toBe(RAW);
    expect(r.toasts.join(' | '), 'the operator must be told, not silently given a zero')
      .toMatch(/Damaged data.*quarantined, not deleted/i);
    expect(phantom.warnings().map((w) => w.text).join('\n')).toMatch(/QUARANTINED corrupt "phantom_deployments_v1"/);
  });

  test('a corrupt quarantine store does not recurse — it resets and still rescues the new blob', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      localStorage.setItem('phantom_quarantine_v1', 'THE QUARANTINE ITSELF IS GARBAGE');
      localStorage.setItem('phantom_victim_v1', '{oops');
      let out, threw = null;
      try { out = safeGet('phantom_victim_v1', 'FB'); } catch (e) { threw = String(e); }
      let keys;
      try { keys = Object.keys(JSON.parse(localStorage.getItem('phantom_quarantine_v1'))); }
      catch (e) { keys = 'STILL-CORRUPT'; }
      return { threw, out, keys };
    });
    expect(r.threw, 'a corrupt quarantine must not throw into a read path (:17045)').toBeNull();
    expect(r.out).toBe('FB');
    expect(r.keys, 'the quarantine is rebuilt, not left unusable').toEqual(['phantom_victim_v1']);
  });

  test('booting on top of a corrupt user-data key raises no storage exception', async ({ phantom, page }) => {
    const RAW = '[{ CORRUPT NOT JSON';
    await phantom.boot({ seed: { 'phantom_deployments_v1': RAW } });

    const storageFaults = phantom.hardErrors().filter((e) =>
      /json|parse|storage|localstorage|quota|undefined is not an object/i.test(e.text));
    expect(storageFaults, `storage-shaped exceptions on a corrupt cold boot:\n${storageFaults.map((e) => '  ' + e.text).join('\n')}`)
      .toEqual([]);

    const after = await page.evaluate(() => ({
      bytes: localStorage.getItem('phantom_deployments_v1'),
      q: JSON.parse(localStorage.getItem('phantom_quarantine_v1') || '{}'),
    }));
    expect(after.bytes, 'a cold boot must not destroy the damaged bytes').toBe(RAW);
    expect(Object.keys(after.q), 'the app read it during boot and rescued it')
      .toContain('phantom_deployments_v1');
  });

  test('the quarantine is itself in the backup registry — the only copy travels', async ({ phantom, page }) => {
    await phantom.boot();
    const row = await page.evaluate(() =>
      PHANTOM_BACKUP_EXTRA_KEYS.filter((r) => r.k === 'phantom_quarantine_v1')[0] || null);
    expect(row, 'phantom_quarantine_v1 must be a registry row (:50613)').not.toBeNull();
    expect(row.why).toMatch(/only surviving copy/i);

    const collected = await page.evaluate(() => {
      localStorage.setItem('phantom_quarantine_v1', JSON.stringify({ k: { raw: 'x' } }));
      return Object.keys(phantom_collectExtraKeys());
    });
    expect(collected).toContain('phantom_quarantine_v1');
  });

  // ── DEFECT ────────────────────────────────────────────────────────────────────
  // phantom_quarantine (:17019) re-writes the entry on EVERY read of the damaged key —
  // it never checks whether the identical bytes are already quarantined. safeGet is
  // called from render paths (a corrupt phantom_deployments_v1 produced six identical
  // QUARANTINED warnings during a single cold boot, i.e. six localStorage WRITES), so a
  // damaged key on a hot surface turns every read into a write. The console.warn is not
  // throttled either, only the toast is (:17036). Expected: rescue once, stay quiet.
  test.fail('reading a damaged key repeatedly does not re-write the quarantine every time', async ({ phantom, page }) => {
    await phantom.boot();
    const writes = await page.evaluate(() => {
      localStorage.removeItem('phantom_quarantine_v1');
      localStorage.setItem('phantom_victim_v1', '{oops');
      safeGet('phantom_victim_v1', null);          // first read — rescue is correct here
      const orig = Storage.prototype.setItem;
      let n = 0;
      try {
        Storage.prototype.setItem = function (k, v) { if (k === 'phantom_quarantine_v1') n++; return orig.call(this, k, v); };
        for (let i = 0; i < 5; i++) safeGet('phantom_victim_v1', null);
      } finally { Storage.prototype.setItem = orig; }
      return n;
    });
    expect(writes, 'five further reads of already-quarantined bytes rewrote the quarantine ' + writes + ' time(s) — dct-ios.html:17019 has no already-rescued check').toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════
test.describe('backup coverage is DERIVED, not a hand-list', () => {

  test('coverage is measured against live storage — a key nobody classified is reported', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      const before = phantom_backupCoverage();
      localStorage.setItem('phantom_a_key_no_registry_knows_v1', '{"work":true}');
      const during = phantom_backupCoverage();
      localStorage.removeItem('phantom_a_key_no_registry_knows_v1');
      const after = phantom_backupCoverage();
      return { before, during, after };
    });
    // THIS is the derived-vs-remembered proof: the function found a key that appears in
    // NO list in the source. A hand-authored inventory structurally cannot do that.
    expect(r.during, 'an unclassified key must be reported').toContain('phantom_a_key_no_registry_knows_v1');
    expect(r.after, 'and must stop being reported once it is gone').not.toContain('phantom_a_key_no_registry_knows_v1');
    expect(r.before, 'a clean seeded profile must be fully classified').toEqual([]);
  });

  test('classified keys and prefix-swept dynamic keys are not reported as gaps', async ({ phantom, page }) => {
    await phantom.boot({ seed: FIELD_WORK });
    const r = await page.evaluate(() => ({
      uncovered: phantom_backupCoverage(),
      collected: Object.keys(phantom_collectExtraKeys()),
      prefixes: PHANTOM_BACKUP_PREFIXES,
    }));
    expect(r.uncovered, `these live keys are in no registry: ${r.uncovered.join(', ')}`).toEqual([]);
    expect(r.prefixes).toContain('phantom_scaffold_v1::');
    expect(r.collected, 'a dynamic prefix key must be swept in, not enumerated')
      .toContain('phantom_scaffold_v1::JOB-E2E');
    expect(r.collected, 'registry rows are collected').toEqual(
      expect.arrayContaining(['phantom_node_status_v1', 'phantom_discrepancies_v1', 'phantom_scan_collection', 'phantom_audits_v1', 'deploy_forge_loadout_v1']));
    expect(r.collected, 'a NAMED section key must not be double-collected')
      .not.toContain('phantom_deployments_v1');
  });

  test('every registry row names a key and a reason, and the three registries are disjoint', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => ({
      extra: PHANTOM_BACKUP_EXTRA_KEYS,
      named: PHANTOM_BACKUP_NAMED_KEYS,
      excluded: PHANTOM_BACKUP_EXCLUDED_KEYS,
    }));
    // "RULE: a key that exists is in the backup unless it has a row here saying why not." (:50574)
    const bad = r.extra.filter((row) => !row || typeof row.k !== 'string' || !row.k || typeof row.why !== 'string' || !row.why.trim());
    expect(bad, `registry rows missing a key or a reason: ${JSON.stringify(bad)}`).toEqual([]);
    expect(r.extra.length).toBeGreaterThanOrEqual(29);

    const extraK = r.extra.map((x) => x.k);
    expect(new Set(extraK).size, 'no duplicate registry rows').toBe(extraK.length);
    // A key in two classes is a contradiction: it would be both copied and deliberately dropped.
    expect(extraK.filter((k) => r.named.includes(k)), 'EXTRA ∩ NAMED must be empty').toEqual([]);
    expect(extraK.filter((k) => r.excluded.includes(k)), 'EXTRA ∩ EXCLUDED must be empty').toEqual([]);
    expect(r.named.filter((k) => r.excluded.includes(k)), 'NAMED ∩ EXCLUDED must be empty').toEqual([]);
  });

  test('an unclassified key is recorded IN the exported bundle, never dropped in silence', async ({ phantom, page }) => {
    await phantom.boot({ seed: FIELD_WORK });
    await armToastRail(page);
    await page.evaluate(() => localStorage.setItem('phantom_unknown_future_key_v1', '{"shift":"work"}'));
    const { text } = await captureBackup(page);
    const bundle = JSON.parse(text);

    expect(bundle.unclassifiedKeys, 'the gap must be visible in the file itself (:50737)')
      .toContain('phantom_unknown_future_key_v1');
    expect(phantom.warnings().map((w) => w.text).join('\n')).toMatch(/unclassified key\(s\)/);
    expect((await readToasts(page)).join(' | '), 'and visible to the operator at export time')
      .toMatch(/unrecognised data key/i);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════
test.describe('export → clear → restore round trip', () => {

  test('a full backup restores every key it captured after localStorage is wiped', async ({ phantom, page }) => {
    await phantom.boot({ seed: FIELD_WORK });

    const before = await readAll(page);
    const { name, text } = await captureBackup(page);
    expect(name).toMatch(/^phantom-full-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const bundle = JSON.parse(text);
    expect(bundle.app).toMatch(/PHANTOM/);
    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.unclassifiedKeys, 'the seeded field work must be fully classified').toEqual([]);

    // Every seeded key must be somewhere in the bundle: a named section or bundle.keys.
    const capturedByRegistry = Object.keys(bundle.keys || {});
    const namedKeys = await page.evaluate(() => PHANTOM_BACKUP_NAMED_KEYS);
    for (const k of Object.keys(FIELD_WORK)) {
      const carried = capturedByRegistry.includes(k) || namedKeys.includes(k);
      expect(carried, `"${k}" is real field work and was captured by NOTHING in the bundle`).toBe(true);
    }

    // ── the wipe: simulate a new device / cleared browser.
    // Assert the precondition on the keys that MATTER rather than on an empty store: the
    // live app keeps writing while we work (phantom_brief_last_ts / the tab heartbeat can
    // land microseconds after clear()), and "no timer fired" is not the precondition the
    // restore needs. What it needs is that none of the operator's work is still there.
    await page.evaluate(() => localStorage.clear());
    const wiped = await readAll(page);
    const survivors = Object.keys(FIELD_WORK).concat(namedKeys).filter((k) => k in wiped);
    expect(survivors, `the wipe did not remove: ${survivors.join(', ')}`).toEqual([]);

    // ── the real restore door
    const dialogs = await driveRestore(page, text);
    expect(dialogs.map((d) => d.type)).toContain('confirm');
    expect(dialogs.find((d) => d.type === 'confirm').message, 'the operator is told what they are about to overwrite')
      .toMatch(/additional data keys/);
    expect(dialogs[dialogs.length - 1].message).toMatch(/Restore complete/);

    const after = await readAll(page);

    // 1. registry-derived keys come back BYTE-IDENTICAL (they travel as raw strings)
    for (const k of Object.keys(bundle.keys)) {
      expect(after[k], `registry key "${k}" did not survive the round trip byte-for-byte`).toBe(bundle.keys[k]);
      expect(after[k]).toBe(before[k]);
    }

    // 2. named sections come back with their content intact (re-serialized, so compare parsed)
    const named = ['dct_sops_v1', 'dct_racks_v1', 'phantom_deployments_v1', 'phantom_deploy_racks_v1',
      'phantom_deploy_phases_v1', 'phantom_rack_history', 'phantom_site_profile_v1'];
    for (const k of named) {
      expect(after[k], `named section "${k}" is missing after restore`).toBeTruthy();
      expect(JSON.parse(after[k]), `named section "${k}" lost content`).toEqual(JSON.parse(before[k]));
    }

    // 3. nothing the operator authored is missing. phantom_tab_presence_v1 / phantom_seen_boot
    //    are on PHANTOM_BACKUP_EXCLUDED_KEYS by design (session + device-local UI selection).
    const excluded = await page.evaluate(() => PHANTOM_BACKUP_EXCLUDED_KEYS);
    const lost = Object.keys(before).filter((k) => !(k in after) && !excluded.includes(k));
    expect(lost, `keys present before the backup and gone after the restore: ${lost.join(', ')}`).toEqual([]);

    // 4. and the app can read its own restored state back through the guarded door
    const readBack = await page.evaluate(() => ({
      profile: siteProfile_load(),
      sops: loadSOPs(),
      user: identity_getUser(),
    }));
    expect(readBack.profile.facilityId).toBe('TEST-01');
    expect(readBack.sops[0].title).toBe('Torque spec');

    // ── v1.14.418: THIS EXPECTATION CHANGED, AND THE CHANGE IS THE POINT. ──────────────
    // This fixture seeds TWO different operator identities — the profile carries
    // operator:'E2E' (fixtures.js) and phantom_current_user_v1 carries 'E2E-TECH'. That
    // divergence IS the defect P0 fixes: two persisted answers to "who is working", with
    // deploy_logAudit crediting work from the one the profile did not own.
    //
    // This test used to assert 'E2E-TECH' — the legacy key winning. From .418 the PROFILE
    // owns operator identity, so 'E2E' is correct. The assertion is not relaxed: it still
    // pins an exact name, and it still proves identity survives the round trip. What moved
    // is WHICH store is authoritative, by owner ruling.
    expect(readBack.user, 'the profile owns operator identity from v1.14.418').toBe('E2E');
    // And the legacy value must still be on disk — it is a name a human typed, so P0 stops
    // WRITING it, it does not destroy it. If this ever goes null, data was thrown away.
    expect(after['phantom_current_user_v1'],
      'the legacy identity key must survive the round trip — copied, never destroyed').toBe('E2E-TECH');
  });

  // ── HARNESS GAP, PROVEN NOT ASSUMED ───────────────────────────────────────────
  // downloadJSON (:50755) PREFERS navigator.share({files}) and only falls back to an
  // <a download> when the share sheet is unavailable (:50762). On a real iPhone the
  // share sheet is the branch every technician actually takes — the anchor fallback is
  // dead code there. Neither headless WebKit nor headless Chromium implements
  // navigator.share, so every round trip above went down the fallback. The share-sheet
  // branch, its .catch() re-fallback, and what iOS does with a 6MB JSON File are
  // UNVERIFIED by this suite. This test proves the API is absent, then skips.
  test('the iOS share-sheet export branch cannot be reached from this harness', async ({ phantom, page }) => {
    await phantom.boot();
    const cap = await page.evaluate(() => ({ share: typeof navigator.share, canShare: typeof navigator.canShare }));
    expect(cap.share, 'if navigator.share ever appears here, un-skip this and test the real branch').toBe('undefined');
    expect(cap.canShare).toBe('undefined');
    test.skip(true, 'navigator.share is absent: downloadJSON always takes the <a download> fallback here, never the iOS share sheet (:50762). Device gate only.');
  });

  test('a newer-schema bundle is refused before any destructive write', async ({ phantom, page }) => {
    await phantom.boot({ seed: FIELD_WORK });
    const before = await readAll(page);

    const future = JSON.stringify({
      app: 'PHANTOM — Field Intelligence System',
      schemaVersion: 99,
      sops: [{ id: 'FROM-THE-FUTURE' }],
      deployments: [{ id: 'DEP-FUTURE' }],
    });
    const dialogs = await driveRestore(page, future);

    expect(dialogs.length, 'exactly one dialog: the refusal. No confirm, because nothing is offered.').toBe(1);
    expect(dialogs[0].type).toBe('alert');
    expect(dialogs[0].message).toMatch(/NEWER PHANTOM version \(backup schema 99/);
    expect(dialogs[0].message).toMatch(/nothing was changed/i);

    // Compare the MATERIAL keys only. phantom_brief_last_ts (BRIEF_KEY :25335) and the
    // clone-war heartbeat are written by ambient timers that tick during the test window;
    // both sit on PHANTOM_BACKUP_EXCLUDED_KEYS precisely because they are the app talking
    // to itself, not the operator's work. Diffing them would assert "no timer fired",
    // which is not what "no destructive write" means.
    const excluded = await page.evaluate(() => PHANTOM_BACKUP_EXCLUDED_KEYS);
    const material = (snap) => Object.fromEntries(Object.entries(snap).filter(([k]) => !excluded.includes(k)));

    const after = await readAll(page);
    expect(material(after), 'a refused restore must leave every user-data key byte-identical (:51186)')
      .toEqual(material(before));
    // and specifically: nothing from the refused bundle landed
    expect(after['dct_sops_v1']).not.toMatch(/FROM-THE-FUTURE/);
    expect(after['phantom_deployments_v1']).not.toMatch(/DEP-FUTURE/);
  });
});

// ═════════════════════════════════════════════════════════════════════════════════
test.describe('durability across a reload', () => {

  // NOTE ON THE FIXTURE: phantom.boot() installs its seed with addInitScript, which runs
  // before app script on EVERY navigation of the page — including page.reload(). Seeding
  // the site profile and then asserting a post-reload edit to it therefore tests the
  // harness, not the app: the seed re-writes the key on the way back in. (My first draft
  // did exactly that and "failed".) So this test boots with confirmProfile:false and
  // authors the profile through the app's own door, which is the honest flow anyway:
  // first run → confirm → survives a cold reload without re-prompting.
  test('data written through the app survives a reload and reads back identically', async ({ phantom, page }) => {
    await phantom.boot({ confirmProfile: false });

    await page.evaluate(() => {
      // Use the app's OWN writers, not raw setItem — this is a durability test of the
      // real path, not of localStorage.
      const p = siteProfile_load();
      p.facilityId = 'TEST-01';
      p.facilityName = 'Cold Aisle 7';
      p.operator = 'J. FIELD';
      p.confirmedAt = Date.now();
      siteProfile_save(p);
      identity_setUser('J. FIELD');
      saveSOPs([{ id: 'SOP-DURABLE', title: 'Survives a reload', body: 'x' }]);
      safeStore('phantom_node_status_v1', JSON.stringify({ 'R01-U12': 'racked' }));
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    const tap = page.locator('#pe-tapcatch');
    await tap.waitFor({ state: 'attached', timeout: 20_000 });
    await tap.click({ force: true });
    await page.waitForFunction(() => {
      const b = document.getElementById('boot'), a = document.getElementById('app');
      return !!a && a.classList.contains('visible') && !!b && b.style.display === 'none';
    }, undefined, { timeout: 25_000 });

    const after = await page.evaluate(() => ({
      profile: siteProfile_load(),
      user: identity_getUser(),
      sops: loadSOPs(),
      nodes: safeGet('phantom_node_status_v1', null),
      confirmed: siteProfile_isConfirmed(),
    }));
    expect(after.profile.facilityName).toBe('Cold Aisle 7');
    expect(after.profile.operator, 'the operator name must survive — the .347 data-loss class').toBe('J. FIELD');
    expect(after.profile.facilityId, 'a save must not blank fields it has no input for').toBe('TEST-01');
    expect(after.user).toBe('J. FIELD');
    expect(after.sops).toEqual([{ id: 'SOP-DURABLE', title: 'Survives a reload', body: 'x' }]);
    expect(after.nodes).toEqual({ 'R01-U12': 'racked' });
    expect(after.confirmed, 'a confirmed profile must not re-trigger the first-run gate').toBe(true);
    await expect(page.locator('#fr-overlay')).toBeHidden();
  });
});

// ═════════════════════════════════════════════════════════════════════════════════
// WRITE PATHS THAT BYPASS THE GUARDED DOOR
// The two tests below FAIL on purpose. Each one is a real write path that loses the
// technician's data on a full disk WITHOUT telling them. They pass the moment the app
// routes through safeStore (or toasts on its own).
// ═════════════════════════════════════════════════════════════════════════════════
test.describe('unguarded write paths', () => {

  // ── FIXED in v1.14.406 — this test now GUARDS the fix. ────────────────────────
  // Was: PHANTOM_MASTER_STORE.save wrote with a raw localStorage.setItem whose quota
  // branch did a console.warn and returned false — no phantomToast, no haptic — and the
  // single caller discarded the return value entirely. On a full device the operator
  // loaded the Master, the parse succeeded, the UI reported success, and nothing was
  // persisted: silently gone at the next cold start. The Master is the largest payload
  // in the app and the one most likely to hit quota (a 4000-host site compresses to
  // ~6.5MB against a ~5MB Safari origin quota).
  // Now: both failure branches toast + haptic + raise __phantomStorageFull, and the
  // caller records a false return. If this ever goes red again, the operator has gone
  // blind on the single most expensive write in the app.
  test('a quota failure while saving the Master reaches the operator', async ({ phantom, page }) => {
    await phantom.boot();
    await armToastRail(page);
    const r = await underQuotaPressure(page, function () {
      const saved = PHANTOM_MASTER_STORE.save({
        racksByCab: { 'CAB-E2E': [{ u: 1, host: 'e2e-host-01' }] },
        siteCode: 'E2E',
        stats: { sourceFileHash: 'deadbeef' },
      });
      const afterMaster = Array.from(document.querySelectorAll('#toast-container div')).map((d) => d.textContent);
      // control: the guarded door under the identical failure, proving the rail works
      safeStore('phantom_control_probe_v1', 'x');
      const afterControl = Array.from(document.querySelectorAll('#toast-container div')).map((d) => d.textContent);
      return { saved, afterMaster, afterControl };
    });
    expect(r.saved, 'the save did fail').toBe(false);
    expect(r.afterControl.join(' | '), 'control: safeStore does toast under the same pressure').toMatch(/Storage full/i);
    expect(r.afterMaster.join(' | '),
      'dct-ios.html:31432 console.warns and returns false; the caller at :31840 drops the return value, so the operator is never told the Master did not persist')
      .toMatch(/Storage full|too large|not saved/i);
  });

  // ── FIXED in v1.14.406 — this test now GUARDS the fix. ────────────────────────
  // Was: shift_end_write was a raw localStorage.setItem inside a bare try{}catch(_){}.
  // On quota it threw nothing, warned nothing, toasted nothing and stored nothing — the
  // operator set their shift end, the UI accepted it, and the marker simply was not there.
  // phantom_shift_end is classified as user data in the backup registry (:50601), so this
  // is not ephemeral UI state. It directly contradicted the No-Silent-Failures rule.
  // Now: the write goes through safeStore, which owns the quota toast, the haptic and the
  // storage-full flag, and shift_end_write returns the outcome instead of swallowing it.
  test('a quota failure while writing the shift-end marker reaches the operator', async ({ phantom, page }) => {
    await phantom.boot();
    await armToastRail(page);
    const r = await underQuotaPressure(page, function () {
      let threw = null;
      try { shift_end_write(Date.now() + 3600000); } catch (e) { threw = String(e); }
      return {
        threw,
        stored: localStorage.getItem('phantom_shift_end'),
        toasts: Array.from(document.querySelectorAll('#toast-container div')).map((d) => d.textContent),
      };
    });
    expect(r.threw, 'it does not throw').toBeNull();
    expect(r.stored, 'and it did not store').toBeNull();
    const warns = phantom.warnings().map((w) => w.text).join('\n');
    expect(r.toasts.join(' | ') + '\n' + warns,
      'dct-ios.html:22385 swallows the quota error in a bare catch(_) — no toast, no warn, no signal of any kind')
      .toMatch(/Storage full|shift/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16 — A NORMALIZATION UPGRADE MIGRATES STORED DATA (v1.14.426, owner ruling)
//
// WHY THIS SPEC EXISTS — it pins a DEVICE VERIFY THAT FAILED.
// v1.14.424 taught the parser that CUTSHEET endpoints are Master data, and spec 15
// proves that works on import. On the owner's phone it did not work at all: `s4:099`
// still read "NO HOST DATA IN MASTER · 68 CABLES" against correct, served code. The
// served bytes were proven to contain the fix and all three stamps matched. The cause
// was not the code — the phone had a Master normalized by the OLDER normalizer and
// restored that derived inventory verbatim, forever.
//
// THE RULE (owner, 2026-08-09): *a parser/normalization upgrade must not require the
// user to manually re-upload the Master.* Derived caches are not permanent truth. If
// persisted data was built under an older normalization, detect it, rebuild the derived
// inventory with the current normalizer, and persist the upgrade atomically.
//
// WHAT MAKES THE REBUILD POSSIBLE. The raw workbook bytes are NOT retained anywhere. The
// normalizer does not need them: its only inputs are cable endpoints, and every cable
// object persists inside racksByCab carrying aLoc/aDns/aModel and zLoc/zDns/zModel. So
// everything .424 derives at import can be re-derived at boot from what is already on the
// device — which is the whole difference between a migration and a re-import.
//
// THE FIXTURE IS THE REAL FAILURE. It runs the production parser over the owner's real
// rows, then STRIPS the endpoint-derived components and the normVersion stamp before
// writing the payload straight to localStorage. That is byte-for-byte the shape a
// pre-.424 device holds — not an approximation of it.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');
const { SITE_HOSTS_ROWS, CUTSHEET_ROWS } = require('./data/us-qrs03-rows');

/**
 * Parse the real workbook, then write back a payload as the OLD normalizer would have
 * left it: SITE-HOSTS components only, cables intact, and no normVersion field.
 */
async function seedLegacyPayload(page) {
  return page.evaluate(async ({ H, C }) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const site = await phantom_parseMaster(out, { filename: 'MIGRATION-FIXTURE.xlsx' });

    // Roll the derived inventory back to what the pre-.424 normalizer produced: drop every
    // endpoint-derived component. Cables are left completely untouched — that is the point.
    const byCab = {};
    let stripped = 0;
    Object.keys(site.racksByCab).forEach((rid) => {
      const r = site.racksByCab[rid];
      const kept = (r.hosts || []).filter((h) => h.source !== 'CUTSHEET_ENDPOINT');
      stripped += (r.hosts || []).length - kept.length;
      byCab[rid] = Object.assign({}, r, { hosts: kept });
    });

    // Written DIRECTLY, not through save() — save() now stamps the current normVersion, so
    // it cannot produce a legacy payload. This is exactly the bytes an older build wrote.
    const legacy = {
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      sourceFileHash: site.stats.sourceFileHash,
      siteCode: site.siteCode,
      sourceFile: 'MIGRATION-FIXTURE.xlsx',
      siteVars: site.siteVars || null,
      totalHosts: Object.keys(byCab).reduce((a, k) => a + byCab[k].hosts.length, 0),
      totalCables: site.stats.totalCables,
      racksByCab: byCab,
      // NO normVersion — that field did not exist when this payload shape was written.
    };
    localStorage.setItem(PHANTOM_MASTER_STORE.KEY, LZString.compressToUTF16(JSON.stringify(legacy)));
    return { stripped, s4Before: byCab['s4:099'].hosts.length, cablesKept: (byCab['s4:099'].cablesIn || []).length + (byCab['s4:099'].cablesOut || []).length };
  }, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS });
}

async function reboot(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#pe-tapcatch').click({ force: true }).catch(() => {});
  await page.waitForFunction(() => {
    const a = document.getElementById('app');
    return a && getComputedStyle(a).visibility !== 'hidden' && a.offsetHeight > 0;
  }, null, { timeout: 20_000 });
}

const readState = (page) => page.evaluate(() => {
  const m = PHANTOM_MASTER.active();
  const s4 = (m.racksByCab['s4:099'] || {}).hosts || [];
  const s1 = (m.racksByCab['s1:001'] || {}).hosts || [];
  const stored = PHANTOM_MASTER_STORE.load();
  const models = {};
  s4.forEach((h) => { models[h.model] = (models[h.model] || 0) + 1; });
  return {
    migration: window.__phantomNormMigration || null,
    s4: s4.length, s1: s1.length, models,
    s4Rus: s4.map((h) => String(h.locCabRu).split(':')[2]).sort(),
    s1AllSiteHosts: s1.every((h) => h.source === 'SITE_HOSTS'),
    storedNorm: stored ? stored.normVersion : null,
    storedS4: stored ? (stored.racksByCab['s4:099'] || {}).hosts.length : -1,
    storedHash: stored ? stored.sourceFileHash : null,
    storedCables: stored ? stored.totalCables : null,
    liveCables: ((m.racksByCab['s4:099'] || {}).cablesIn || []).length + ((m.racksByCab['s4:099'] || {}).cablesOut || []).length,
  };
});

test.describe('a stored Master rebuilds itself when the normalizer moves on', () => {

  test('THE FAILED DEVICE VERIFY: a v1 payload restores as 0 components, then migrates to 19', async ({ phantom, page }) => {
    await phantom.boot();
    const seed = await seedLegacyPayload(page);
    // The fixture must actually reproduce the failure, or the rest proves nothing.
    expect(seed.s4Before, 's4:099 must start EMPTY, exactly as the phone showed it').toBe(0);
    expect(seed.cablesKept, 'the cables must survive the rollback — they are the rebuild input').toBeGreaterThan(0);

    await reboot(page);
    const st = await readState(page);

    expect(st.migration, 'the boot migration never ran').not.toBeNull();
    expect(st.migration.from, 'a payload with no normVersion is generation 1 by definition').toBe(1);
    expect(st.migration.status, 'the migration did not report a rebuild').toBe('migrated');
    expect(st.s4, 's4:099 must rebuild to its 19 real components with NO re-import').toBe(19);
  });

  test('the rebuilt inventory is the RIGHT inventory, not just the right count', async ({ phantom, page }) => {
    await phantom.boot();
    await seedLegacyPayload(page);
    await reboot(page);
    const st = await readState(page);
    expect(st.models['GPU-B300-01'], 'nine GPU nodes').toBe(9);
    expect(st.models['PS-1RU-06'], 'eight power shelves').toBe(8);
    expect(st.models['SN2201'], 'one leaf switch').toBe(1);
    expect(st.models['CDU-4RU-03'], 'one CDU').toBe(1);
    expect(st.s4Rus, 'the components must land at their explicit RUs').toEqual(
      ['02', '06', '07', '08', '09', '11', '14', '17', '20', '23', '26', '29', '32', '35', '39', '40', '41', '42', '46']
    );
  });

  test('SITE-HOSTS racks are NOT padded and NOT double-counted by the migration', async ({ phantom, page }) => {
    await phantom.boot();
    await seedLegacyPayload(page);
    await reboot(page);
    const st = await readState(page);
    // s1:001 is described by BOTH sheets. Rule 1 says SITE-HOSTS wins, on migration exactly
    // as on import — this is the assertion that catches a migration that appends blindly.
    expect(st.s1, 's1:001 must still hold its 8 SITE-HOSTS rows and nothing more').toBe(8);
    expect(st.s1AllSiteHosts, 'a SITE-HOSTS rack was padded with endpoint components').toBe(true);
    expect(st.migration.suppressed, 'suppression must fire on the migration path too').toBeGreaterThan(0);
  });

  test('THE UPGRADE IS PERSISTED — it is not re-derived in memory every boot', async ({ phantom, page }) => {
    await phantom.boot();
    await seedLegacyPayload(page);
    await reboot(page);
    const st = await readState(page);
    expect(st.storedNorm, 'storage must carry the new normalization stamp').toBe(2);
    expect(st.storedS4, 'the rebuilt components must be IN STORAGE, not only in memory').toBe(19);
  });

  test('THE ROUND TRIP KEEPS IDENTITY AND CABLES — re-saving a restored Master loses nothing', async ({ phantom, page }) => {
    await phantom.boot();
    await seedLegacyPayload(page);
    await reboot(page);
    const st = await readState(page);
    // save() reads these from `.stats`, which only a fresh parse has. Migrating a RESTORED
    // payload through it used to write null for both — losing the Master's identity and its
    // cable count as a side effect of fixing its components.
    expect(st.storedHash, 'the Master lost its source hash in the migration round trip').toBeTruthy();
    expect(st.storedCables, 'the Master lost its cable count in the migration round trip').toBeTruthy();
    expect(st.liveCables, 's4:099 must retain its cable data after migrating').toBeGreaterThan(0);
  });

  test('IDEMPOTENT: a second boot re-reads, it does not re-apply', async ({ phantom, page }) => {
    await phantom.boot();
    await seedLegacyPayload(page);
    await reboot(page);
    const first = await readState(page);
    expect(first.s4).toBe(19);

    await reboot(page);
    const second = await readState(page);
    expect(second.migration.status, 'the second boot must find the Master already current').toBe('current');
    expect(second.migration.from, 'the stamp did not persist — the migration would run forever').toBe(2);
    expect(second.s4, 'a second migration pass DUPLICATED the rebuilt components').toBe(19);
    expect(second.s1, 's1:001 drifted across boots').toBe(8);
  });

  test('a Master with no cables retained says so instead of silently doing nothing', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => {
      // A legacy payload whose racks kept no cable endpoints at all. The normalizer has no
      // input here, so a rebuild is genuinely impossible on device — and the app must be able
      // to say that rather than report a successful migration that changed nothing.
      const legacy = {
        schemaVersion: 1, savedAt: new Date().toISOString(), sourceFileHash: 'no-cables',
        siteCode: 'US-QRS03', sourceFile: 'NO-CABLES.xlsx', siteVars: null,
        totalHosts: 1, totalCables: 0,
        racksByCab: { 's9:001': { cabId: 's9:001', locode: 'US-QRS03', cablesOut: [], cablesIn: [],
          hosts: [{ locCabRu: 's9:001:10', dns: 'only-host', model: 'SN2201', source: 'SITE_HOSTS' }] } },
      };
      localStorage.setItem(PHANTOM_MASTER_STORE.KEY, LZString.compressToUTF16(JSON.stringify(legacy)));
    });
    await reboot(page);
    const r = await page.evaluate(() => ({
      m: window.__phantomNormMigration,
      stored: (function () { const s = PHANTOM_MASTER_STORE.load(); return s ? s.normVersion : null; })(),
      hosts: PHANTOM_MASTER_STORE.hostCount(PHANTOM_MASTER.active()),
    }));
    expect(r.m.status, 'a Master with no cable endpoints must report that it cannot be rebuilt').toBe('no-cables-retained');
    expect(r.stored, 'it must NOT stamp itself current — a re-import is the only path, so keep retrying').not.toBe(2);
    expect(r.hosts, 'the existing host must survive an impossible migration untouched').toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 17 — RE-IMPORTING THE SAME MASTER CHANGES NOTHING AND LOSES NOTHING
//
// This is BATCH-VERIFY item 7, automated. It was being asked of the owner as a
// manual device pass; none of it depends on iOS hardware (owner ruling 2026-08-10,
// "the owner is not the test harness"). Everything here is parser + storage +
// contract behaviour, which is exactly what a harness is for.
//
// WHAT IT PINS
//   · the parse is IDEMPOTENT — a second pass over the same bytes yields the same
//     counts. The endpoint normalizer added at .424 is the new surface that could
//     break this: a dedupe key that missed would inflate components the second time.
//   · MERGE, NEVER OVERWRITE (Law 11) — hand-entered data survives a Master replace.
//     This is the half that costs a shift if it is wrong.
//   · a FRESH import stamps normVersion, so the .426 boot migration finds nothing to
//     do. If it did not, an offline device would rebuild its Master on every launch.
//
// The rows are the owner's real workbook rows, shared with specs 15 and 16.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');
const { SITE_HOSTS_ROWS, CUTSHEET_ROWS } = require('./data/us-qrs03-rows');

/** Build the workbook in the page and run the PRODUCTION parser + the PRODUCTION replace door. */
async function importMaster(page, filename) {
  return page.evaluate(async ({ H, C, fn }) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const site = await phantom_parseMaster(out, { filename: fn });
    const accepted = PHANTOM_MASTER.replace(site);   // the one door: persists first, live second
    const m = PHANTOM_MASTER.active();
    let comps = 0;
    Object.keys(m.racksByCab).forEach((k) => { comps += (m.racksByCab[k].hosts || []).length; });
    return {
      accepted,
      racks: Object.keys(m.racksByCab).length,
      components: comps,
      s4: (m.racksByCab['s4:099'] || {}).hosts.length,
      s1: (m.racksByCab['s1:001'] || {}).hosts.length,
      fromSiteHosts: site.stats.hostsFromSiteHosts,
      fromCutsheet: site.stats.hostsFromCutsheet,
      normVersion: site.normVersion,
    };
  }, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS, fn: filename });
}

/** Hand-entered data, written through the app's own stores — never invented keys. */
async function writeOperatorData(page) {
  return page.evaluate(() => {
    const b = PHANTOM_BLOCKERS.create({
      rack: 's4:099', phase: 'mechanical',
      description: 'CDU leak — hand-typed by the operator, must survive a Master reload',
    });
    const p = siteProfile_load();
    p.facilityId = 'US-QRS03'; p.facilityName = 'QUARRY';
    p.operator = 'J. Hamilton'; p.siteLead = 'J. Hamilton'; p.confirmedAt = Date.now();
    siteProfile_save(p);
    return { blockerId: b && (b.id || b.blockerId) ? (b.id || b.blockerId) : null };
  });
}

const readOperatorData = (page) => page.evaluate(() => {
  const open = PHANTOM_BLOCKERS.open() || [];
  const p = siteProfile_load();
  return {
    blockers: open.length,
    descriptions: open.map((x) => x.description || ''),
    operator: p && p.operator,
    siteLead: p && p.siteLead,
    facility: p && p.facilityId,
  };
});

test.describe('re-importing the same Master is a no-op that loses nothing', () => {

  test('THE COUNTS ARE IDENTICAL — the parse is idempotent over the same bytes', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot();
    const first = await importMaster(page, 'US-QRS03.xlsx');
    expect(first.accepted, 'the first import was not accepted through PHANTOM_MASTER.replace').toBe(true);

    const second = await importMaster(page, 'US-QRS03.xlsx');
    expect(second.accepted, 'the second import was not accepted').toBe(true);

    // The whole point: a missed dedupe key in the endpoint normalizer would show up HERE as
    // components growing on the second pass, and nowhere else.
    expect(second.racks, 'rack count drifted on re-import').toBe(first.racks);
    expect(second.components, 'component count drifted on re-import — the endpoint dedupe is not idempotent').toBe(first.components);
    expect(second.s4, 's4:099 drifted on re-import').toBe(first.s4);
    expect(second.s1, 's1:001 drifted on re-import').toBe(first.s1);
    expect(second.fromSiteHosts + second.fromCutsheet, 'source coverage stopped summing to the total').toBe(second.components);
  });

  test('MERGE, NEVER OVERWRITE — hand-entered data survives a Master replace (Law 11)', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot();
    await importMaster(page, 'US-QRS03.xlsx');
    await writeOperatorData(page);
    const before = await readOperatorData(page);
    expect(before.blockers, 'the fixture did not actually write a blocker').toBeGreaterThan(0);

    await importMaster(page, 'US-QRS03.xlsx');
    const after = await readOperatorData(page);

    expect(after.blockers, 'a Master re-import destroyed the operator blockers').toBe(before.blockers);
    expect(after.descriptions, 'blocker text was lost or rewritten by a Master re-import').toEqual(before.descriptions);
    expect(after.operator, 'the operator identity was lost on re-import').toBe(before.operator);
    expect(after.siteLead, 'the site lead was lost on re-import').toBe(before.siteLead);
    expect(after.facility, 'the facility was lost on re-import').toBe(before.facility);
  });

  test('A FRESH IMPORT STAMPS normVersion — the boot migration finds nothing to do', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot();
    const r = await importMaster(page, 'US-QRS03.xlsx');
    expect(r.normVersion, 'the parser did not stamp the current normalizer generation').toBe(2);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('#pe-tapcatch').click({ force: true }).catch(() => {});
    await page.waitForFunction(() => {
      const a = document.getElementById('app');
      return a && getComputedStyle(a).visibility !== 'hidden' && a.offsetHeight > 0;
    }, null, { timeout: 20_000 });

    const state = await page.evaluate(() => ({
      migration: window.__phantomNormMigration,
      stored: (function () { const s = PHANTOM_MASTER_STORE.load(); return s ? s.normVersion : null; })(),
      s4: (PHANTOM_MASTER.active().racksByCab['s4:099'] || {}).hosts.length,
    }));

    // If this ever reads 'migrated', a device would rebuild its Master on EVERY launch —
    // including offline, where the write is the only thing standing between it and doing it again.
    expect(state.migration.status, 'a freshly imported Master triggered a migration — normVersion is not sticking').toBe('current');
    expect(state.stored, 'storage did not carry the normalizer stamp').toBe(2);
    expect(state.s4, 's4:099 changed across the reload').toBe(r.s4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15 — DUAL-SOURCE MASTER NORMALIZATION (v1.14.424, owner P0)
//
// WHY THIS SPEC EXISTS
// A cabinet that appears in CUTSHEET but has no SITE-HOSTS row rendered as ZERO
// COMPONENTS for the entire life of the product. Not a regression — git proves the
// host push has been byte-identical since v1.6.26, the first parser ever shipped,
// and cables only ever populated cablesOut/cablesIn. The capability never existed.
//
// In the owner's US-QRS03 Master that is not an edge case: SITE-HOSTS carries 4,143
// rows and NOT ONE is an s4 cab, while CUTSHEET names 98 s4 racks. 215 of 511 racks
// (42%) exist only as cable endpoints. For s4:099 the sheet explicitly holds nine
// GPU-B300 nodes, eight power shelves, an SN2201 and a CDU — with model, DNS and RU —
// and the phone said "NO HOST DATA IN MASTER · 0 COMPONENTS".
//
// THE DATA BELOW IS REAL. Every row is lifted verbatim from that workbook: 8 SITE-HOSTS
// rows from s1:001 and all 49 CUTSHEET rows touching s4:099. Nothing is fabricated,
// which is the only way this test can prove the contract it claims to.
//
// It runs the PRODUCTION phantom_parseMaster in the browser, not a reimplementation.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const { SITE_HOSTS_ROWS, CUTSHEET_ROWS } = require('./data/us-qrs03-rows');


/** Build a workbook IN THE PAGE from the real rows, then run the production parser on it. */
async function parseFixture(page) {
  return page.evaluate(async ({ H, C }) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
    const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    // THE PRODUCTION DOOR — not a copy of it.
    const site = await phantom_parseMaster(out, { filename: 'DUAL-SOURCE-FIXTURE.xlsx' });
    return {
      stats: site.stats,
      racks: Object.keys(site.racksByCab).sort(),
      s4: (site.racksByCab['s4:099'] || {}).hosts || [],
      s1: (site.racksByCab['s1:001'] || {}).hosts || [],
    };
  }, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS });
}

test.describe('the Master has TWO sources of component identity', () => {

  test('SITE-HOSTS still parses — the canonical source is untouched', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await parseFixture(page);
    // The regression guard the owner asked for: SITE-HOSTS must never normalize to 0.
    expect(r.stats.hostsFromSiteHosts, 'SITE-HOSTS normalized to zero — the parser is broken').toBe(8);
    expect(r.s1.length, 's1:001 must resolve its own SITE-HOSTS rows').toBe(8);
    expect(r.s1.every((h) => h.source === 'SITE_HOSTS'),
      'a SITE-HOSTS rack must not be padded with endpoint-derived components').toBe(true);
  });

  test('THE DEFECT: a CUTSHEET-only cabinet resolves its real inventory', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await parseFixture(page);
    // 68 endpoint references across 49 cable rows normalize to 19 physical components.
    // One component per cable would have invented 68 devices.
    expect(r.s4.length, 's4:099 must resolve 19 unique components, not 0 and not 68').toBe(19);
    expect(r.s4.every((h) => h.source === 'CUTSHEET_ENDPOINT'),
      'provenance must say these came from cable endpoints, never from SITE-HOSTS').toBe(true);
  });

  test('the nine GPU-B300 nodes land at their explicit RUs', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await parseFixture(page);
    const gpus = r.s4.filter((h) => /GPU-B300/i.test(h.model))
      .map((h) => parseInt(String(h.locCabRu).split(':')[2], 10)).sort((a, b) => b - a);
    expect(gpus, 'the GPU nodes must sit at the RUs the Master states').toEqual([35, 32, 29, 26, 23, 20, 17, 14, 11]);
    // and the rest of the explicit inventory
    const at = (ru) => (r.s4.find((h) => parseInt(String(h.locCabRu).split(':')[2], 10) === ru) || {}).model;
    expect(at(46), 'infra switch').toMatch(/SN2201/i);
    expect(at(2), 'CDU').toMatch(/CDU-4RU/i);
    expect(r.s4.filter((h) => /PS-1RU/i.test(h.model)).length, 'eight power shelves').toBe(8);
  });

  test('NOTHING IS DOUBLE-COUNTED — SITE-HOSTS wins where both sources describe a U', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await parseFixture(page);
    // totals must reconcile exactly; a component may be counted once, from one source.
    expect(r.stats.totalHosts).toBe(r.stats.hostsFromSiteHosts + r.stats.hostsFromCutsheet);
    const seen = {};
    for (const h of r.s1.concat(r.s4)) {
      const k = h.locCabRu + '|' + h.dns + '|' + h.model;
      expect(seen[k], 'duplicate component: ' + k).toBeUndefined();
      seen[k] = true;
    }
    expect(r.stats.endpointsSuppressedBySiteHosts,
      'endpoints landing on a U that SITE-HOSTS owns must be suppressed, not appended').toBeGreaterThan(0);
  });

  test('source coverage is reported SEPARATELY, never as one "0 hosts" summary', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await parseFixture(page);
    // The owner ruling: a Master must never be summarized as 0 hosts because ONE source
    // lacks ONE cabinet, and endpoint-derived components must not masquerade as SITE-HOSTS.
    expect(typeof r.stats.hostsFromSiteHosts).toBe('number');
    expect(typeof r.stats.hostsFromCutsheet).toBe('number');
    expect(r.stats.hostsFromCutsheet).toBeGreaterThan(0);
    expect(r.stats.totalCables, 'cable count stays honest and derived from CUTSHEET rows').toBe(57);
  });

  test('BUILD AND FORGE READ THE SAME INVENTORY — through one elevation door', async ({ phantom, page }) => {
    await phantom.boot();
    const out = await page.evaluate(async ({ H, C }) => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
      const site = await phantom_parseMaster(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), { filename: 'F.xlsx' });
      PHANTOM_MASTER.replace(site);
      // master_rackToElevation is the ONE door Build and Forge both consume.
      const elev = master_rackToElevation(PHANTOM_MASTER.active().racksByCab['s4:099'], 's4:099');
      return { slots: (elev.slots || []).length, unplaced: (elev.unplaced || []).length };
    }, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS });
    // Neither surface picks its own source: both read this.
    expect(out.slots, 'the elevation both surfaces consume must carry all 19 components').toBe(19);
    expect(out.unplaced, 'every component has an explicit RU, so none should be unplaced').toBe(0);
  });

  test('SAVE AND RELOAD PRESERVE THE SAME RESULT', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(async ({ H, C }) => {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
      const site = await phantom_parseMaster(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), { filename: 'F.xlsx' });
      PHANTOM_MASTER.replace(site);
    }, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS });

    await page.reload();
    await page.waitForFunction(() => typeof window.PHANTOM_MASTER !== 'undefined', { timeout: 20_000 });

    const after = await page.evaluate(() => {
      const m = PHANTOM_MASTER.active();
      const r = (m && m.racksByCab && m.racksByCab['s4:099']) || { hosts: [] };
      return { comps: r.hosts.length, gpus: r.hosts.filter((h) => /GPU-B300/i.test(h.model)).length,
               provenance: r.hosts.every((h) => h.source === 'CUTSHEET_ENDPOINT') };
    });
    // The storage whitelist persists racksByCab, so components AND their provenance must survive.
    expect(after.comps, 's4:099 lost its components across a reload').toBe(19);
    expect(after.gpus).toBe(9);
    expect(after.provenance, 'provenance must survive the round trip, or the summary lies later').toBe(true);
  });
});

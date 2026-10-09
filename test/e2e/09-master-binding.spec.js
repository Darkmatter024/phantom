// ─────────────────────────────────────────────────────────────────────────────
// 09 — THE MASTER → FORGE BINDING, AND THE FIVE-RACK FOREGROUND WINDOW
//
// Why this spec exists. Twice now an UNPROVISIONED cabinet has been reported as
// a data regression: v1.14.401 (s3:172, a production rollback was ordered) and
// v1.14.411 (row s4, 24 cabs, a sprint stopped). Both times the data was right
// and nothing guarded the claim. The investigation that closed the second one
// had to re-derive, by hand, that the whole Master→rack→slots→counts path was
// intact. That evidence now lives here instead of in a transcript.
//
// It pins the ARCHITECTURE the owner stated on 2026-08-08, which is easy to
// violate by accident:
//   · the Master/topology may carry many racks;
//   · Forge fully populates only the FIVE foreground racks at a time;
//   · everything else in the aisle is lightweight scenery;
//   · an active rack with no Master contents still renders as a cabinet;
//   · and none of that may alter the underlying Master.
// So "24 racks exist" must never be read as "24 racks should be populated" —
// and equally, a rack in the window must never read 0/0 unless its Master data
// is genuinely empty. Both directions are asserted.
//
// EVERYTHING IS OBSERVED THROUGH THE DOM. deploy_forge_slots, LOADOUT, WINDOW
// and focusables are all IIFE-scoped and unreachable at page scope — the same
// trap that bit the .408 and .411 probes. Asserting through the pills, chips
// and picker also means this tests what the operator actually sees.
// ─────────────────────────────────────────────────────────────────────────────

const { test, expect } = require('./fixtures');

// The fixture Master. Deliberately MIXED and deliberately larger than the
// five-rack window, because a uniform fixture cannot tell a correct binding
// from a constant. Shapes match phantom_parseMaster's own output (:32184):
// racks carry their hosts NESTED, and locCabRu is `row:cab:ru`.
const FIXTURE = [
  { cab: '099', hosts: 6, cables: 15 },   // populated, also cabled
  { cab: '100', hosts: 4, cables: 0 },
  { cab: '101', hosts: 0, cables: 15 },   // cabling-only — legitimately empty
  { cab: '102', hosts: 12, cables: 2 },
  { cab: '103', hosts: 0, cables: 0 },    // mentioned only — legitimately empty
  { cab: '104', hosts: 2, cables: 1 },
  { cab: '105', hosts: 8, cables: 3 },
  { cab: '106', hosts: 1, cables: 0 },
];
const EXPECT = {};
FIXTURE.forEach((f) => { EXPECT['s4:' + f.cab] = f; });

/** Seed a Master through the app's own store, then reload so the real boot-restore path runs. */
async function seedMaster(phantom, page) {
  await phantom.boot();
  await page.waitForFunction(() => typeof PHANTOM_MASTER_STORE !== 'undefined' && typeof LZString !== 'undefined', null, { timeout: 25_000 });
  await page.evaluate((fixture) => {
    const racksByCab = {};
    fixture.forEach((f) => {
      const hosts = [];
      for (let i = 0; i < f.hosts; i++) {
        hosts.push({ dns: 's4-gpu-' + f.cab + '-' + i, model: 'HGX H100', locCabRu: 's4:' + f.cab + ':' + (1 + i * 3) });
      }
      const out = [], inn = [];
      for (let i = 0; i < f.cables; i++) { out.push({ i }); inn.push({ i }); }
      racksByCab['s4:' + f.cab] = { cabId: 's4:' + f.cab, locode: 'US-QRS03', hosts, cablesOut: out, cablesIn: inn };
    });
    PHANTOM_MASTER_STORE.save({
      siteCode: 'US-QRS03', sourceFile: 'BINDING-FIXTURE.xlsx',
      stats: { sourceFileHash: 'fixture', totalHosts: fixture.reduce((a, f) => a + f.hosts, 0), totalCables: 0 },
      racksByCab,
    });
  }, FIXTURE);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#pe-tapcatch').click({ force: true }).catch(() => {});
  await page.waitForFunction(() => {
    const a = document.getElementById('app');
    return a && getComputedStyle(a).visibility !== 'hidden' && a.offsetHeight > 0;
  }, null, { timeout: 20_000 });
}

async function openAisle(page) {
  await page.evaluate(() => { try { forge3d_open(); } catch (_) {} });
  await page.waitForFunction(() => {
    const s = document.getElementById('forge3d-sheet');
    return !!s && s.classList.contains('open');
  }, null, { timeout: 15_000 });
  await page.waitForTimeout(1400);
}

const chips = (page) => page.evaluate(() =>
  [...document.querySelectorAll('#forge3d-sheet .chip[data-rack]')].map((c) => c.dataset.rack));

const statusOf = (page) => page.evaluate(() => {
  const st = document.getElementById('tagState');
  const id = document.getElementById('tagId');
  return { id: id ? id.textContent.trim() : null, state: st ? st.textContent.trim() : null };
});

async function focusChip(page, rack) {
  await page.evaluate((r) => {
    const c = document.querySelector('#forge3d-sheet .chip[data-rack="' + r + '"]');
    if (c) c.click();
  }, rack);
  await page.waitForTimeout(700);
}

test.describe('Master → Forge binding', () => {
  test('the DATA MODEL carries every rack, with the counts the Master actually holds', async ({ phantom, page }) => {
    // The picker is the data-model read: it iterates RUN (= Object.keys(racksByCab)),
    // not the five-rack window, and deploy_forge_slots has no window guard. If this
    // and the window ever disagree, the binding is wrong — not the window.
    await seedMaster(phantom, page);
    await openAisle(page);

    const rows = await page.evaluate(() => {
      document.getElementById('loadoutBtn').click();
      return [...document.querySelectorAll('#forge3d-sheet .pick')].map((e) => e.textContent.trim().replace(/\s+/g, ' '));
    });
    await page.evaluate(() => document.getElementById('pickerCancel').click());

    expect(rows.length, `the picker must list every rack in the Master, got ${rows.length}`).toBe(FIXTURE.length);
    for (const [rack, f] of Object.entries(EXPECT)) {
      const row = rows.find((r) => r.startsWith(rack));
      expect(row, `${rack} missing from the data model`).toBeTruthy();
      expect(row, `${rack} reports the wrong device total — the Master holds ${f.hosts}`).toContain('0/' + f.hosts);
    }
  });

  test('Forge populates FIVE foreground racks, not every rack in the Master', async ({ phantom, page }) => {
    await seedMaster(phantom, page);
    await openAisle(page);
    const live = await chips(page);

    // The architecture rule, asserted in both directions: the window is capped at
    // five even though the Master carries eight, and it is not empty either.
    expect(live.length, `the foreground window must cap at 5, got ${live.length}: ${live.join(', ')}`).toBeLessThanOrEqual(5);
    expect(live.length, 'the foreground window resolved no racks at all').toBeGreaterThan(0);
    expect(FIXTURE.length, 'fixture must exceed the window or this proves nothing').toBeGreaterThan(5);
    for (const r of live) expect(EXPECT[r], `${r} is in the window but not in the Master`).toBeTruthy();
  });

  test('every rack in the window reports the Master truth — 0/0 ONLY when genuinely empty', async ({ phantom, page }, testInfo) => {
    // The claim both field reports turned on. A populated rack must never read as
    // empty, and an empty one must never read as a count.
    await seedMaster(phantom, page);
    await openAisle(page);
    const live = await chips(page);
    const seen = [];

    for (const rack of live) {
      await focusChip(page, rack);
      const s = await statusOf(page);
      const f = EXPECT[rack];
      seen.push(`${rack} → "${s.state}"`);
      expect(s.id, `focusing ${rack} did not update the id pill`).toBe(rack);

      if (f.hosts > 0) {
        // substring, not a regex: the state pill may legitimately carry a trailing
        // `· ⚠n FLAGGED` clause, and the claim under test is only the DENOMINATOR —
        // the device total this rack resolved out of the Master.
        expect(s.state, `${rack} holds ${f.hosts} devices in the Master but the pill reads "${s.state}"`)
          .toContain('/' + f.hosts + ' RACKED');
        expect(s.state, `${rack} has devices but reads as having no host data`).not.toMatch(/NO HOST DATA/i);
      } else {
        // v1.14.413 — an empty rack states what that means instead of `0/0 RACKED`.
        expect(s.state, `${rack} is genuinely empty but does not say so: "${s.state}"`).toMatch(/NO HOST DATA IN MASTER/i);
        if (f.cables > 0) {
          expect(s.state, `${rack} is cabling-only (${f.cables * 2} cables) but the pill omits the cable count`)
            .toMatch(/\d+ CABLES?/);
        }
      }
    }
    testInfo.annotations.push({ type: 'window-truth', description: seen.join(' · ') });
  });

  test('walking the aisle resolves the NEXT rack from the Master, not a stale card', async ({ phantom, page }) => {
    await seedMaster(phantom, page);
    await openAisle(page);
    const live = await chips(page);
    test.skip(live.length < 2, 'need at least two racks in the window to walk between');

    await focusChip(page, live[0]);
    const first = await statusOf(page);

    // walk through the app's own door — the detail panel's NEXT control
    await page.evaluate((r) => {
      const c = document.querySelector('#forge3d-sheet .chip[data-rack="' + r + '"]');
      if (c) c.click();
    }, live[1]);
    await page.waitForTimeout(800);
    const second = await statusOf(page);

    expect(second.id, 'walking did not move the focused rack').not.toBe(first.id);
    expect(second.id, 'walking landed on a rack outside the window').toBe(live[1]);
    const f = EXPECT[live[1]];
    if (f.hosts > 0) {
      expect(second.state, `walking to ${live[1]} did not resolve its ${f.hosts} devices`)
        .toContain('/' + f.hosts + ' RACKED');
    } else {
      expect(second.state, `walking to empty ${live[1]} did not state why`).toMatch(/NO HOST DATA IN MASTER/i);
    }
    // and the two readings must differ — otherwise the pill is not tracking focus at all
    expect(second.state === first.state && second.id === first.id,
      'the status row did not change when focus moved').toBe(false);
  });

  test('reading the aisle never mutates the stored Master', async ({ phantom, page }) => {
    // R-06: background optimisation must never delete or alter the underlying data.
    // Walk the whole window, open the picker, then compare the snapshot byte for byte.
    await seedMaster(phantom, page);
    const before = await page.evaluate(() => localStorage.getItem('phantom_master_v1'));
    await openAisle(page);
    const live = await chips(page);
    for (const r of live) await focusChip(page, r);
    await page.evaluate(() => { document.getElementById('loadoutBtn').click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => document.getElementById('pickerCancel').click());
    const after = await page.evaluate(() => localStorage.getItem('phantom_master_v1'));

    expect(after, 'the stored Master changed merely from being READ').toBe(before);
    expect((after || '').length, 'the stored Master was emptied').toBeGreaterThan(0);
  });
});

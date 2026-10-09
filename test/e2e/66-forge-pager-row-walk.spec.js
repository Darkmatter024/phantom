// ─────────────────────────────────────────────────────────────────────────────
// 66 — FORGE DETAIL PAGER: PREV / NEXT WALK THE ROW THE HEADER COUNTS
//
// THE REPORT (staging, 2026-09-15): row C1, rack c1:005, header "ROW C1 · POS 5/18 · 0/9 RACKED",
// PREV enabled, NEXT dimmed — although the header itself says thirteen more racks follow.
//
// ROOT CAUSE, measured at .590 (docs/RACK-PAGER-NEXT-PHASE0-EVIDENCE.md, re-verified):
//   · POS reads ROWS[row] — every cab in the row, sorted (dct-ios.html refreshCounts / rowOf).
//   · PREV/NEXT read LOADOUT — the five-rack 3D bench, capped by setLoadout's .slice(0, 5)
//     (Contract A6: five foreground racks, one live WebGL attachment).
//   · The default bench is RUN.slice(0, 5); with c1:001…c1:018 in Master order that is
//     c1:001…c1:005, so c1:005 is the LAST bench slot and `idx >= LOADOUT.length - 1` dims NEXT.
//   Not a racked-count gate, not a sort mismatch: one modal, two lists.
//
// ⛔ WHY THE FIX IS NOT "point the predicate at the row". walk() only reaches racks that have a 3D
// slot, so enabling NEXT against the row without moving the bench makes a tap that does nothing —
// a Contract 14 dead control. The fix walks the row and, when the neighbour is off the bench,
// re-windows the bench through the existing setLoadout — still exactly five live racks.
//
// Master fixture seeded through PHANTOM_MASTER_STORE and a reload, so the real boot-restore path
// installs window._lastPhantomMaster (the pattern of 09-master-binding). No sleeps: every wait is
// on a state the app reaches (fixtures.js design rule 1).
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const C1 = Array.from({ length: 18 }, (_, i) => 'c1:' + String(i + 1).padStart(3, '0'));
const C2 = ['c2:001', 'c2:002', 'c2:003'];

const LOADOUT_KEY = 'deploy_forge_loadout_v1';
// A hand-built bench as the picker would leave it: cross-row, not a row window.
const HAND_PICKED = ['c2:001', 'c1:003', 'c1:005', 'c2:003', 'c1:010'];

async function seedMaster(phantom, page, opts = {}) {
  await phantom.boot();
  await page.waitForFunction(() => typeof PHANTOM_MASTER_STORE !== 'undefined', null, { timeout: 25_000 });
  if (opts.loadout) {
    await page.evaluate(({ key, v }) => localStorage.setItem(key, JSON.stringify(v)), { key: LOADOUT_KEY, v: opts.loadout });
  }
  await page.evaluate(({ c1, c2 }) => {
    const racksByCab = {};
    // Insertion order is the Master order, so RUN.slice(0, 5) — the default bench — is c1:001…c1:005.
    c1.concat(c2).forEach((cab) => {
      const hosts = [];
      for (let i = 0; i < 3; i++) hosts.push({ dns: cab.replace(':', '-') + '-gpu-' + i, model: 'HGX H100', locCabRu: cab + ':' + (2 + i * 8) });
      racksByCab[cab] = { cabId: cab, locode: 'US-TST99', hosts, cablesOut: [], cablesIn: [] };
    });
    PHANTOM_MASTER_STORE.save({
      siteCode: 'US-TST99', sourceFile: 'PAGER-FIXTURE.xlsx',
      stats: { sourceFileHash: 'pager-fixture', totalHosts: (c1.length + c2.length) * 3, totalCables: 0 },
      racksByCab,
    });
  }, { c1: C1, c2: C2 });

  await page.reload({ waitUntil: 'domcontentloaded' });
  // Second boot in the same page: the return-visit skip auto-fires the splash (fixtures.js :166).
  await page.locator('#pe-tapcatch').click({ timeout: 5_000 }).catch(() => {});
  await page.waitForFunction(() => {
    const app = document.getElementById('app');
    const boot = document.getElementById('boot');
    return !!app && app.classList.contains('visible') && !!boot && boot.style.display === 'none'
      && !!window._lastPhantomMaster && !!window._lastPhantomMaster.racksByCab;
  }, null, { timeout: 25_000 });
}

async function openAisleOn(page, rack) {
  await page.evaluate(() => { if (typeof forge3d_open !== 'function') throw new Error('forge3d_open is not a global'); forge3d_open(); });
  await page.waitForSelector('#forge3d-sheet.open', { timeout: 20_000 });
  // The bench is populated on hero-image decode, after the sheet opens — wait on the chip itself.
  const chip = page.locator('#forge3d-sheet .chip[data-rack="' + rack + '"]');
  await expect(chip, rack + ' never reached the bench').toHaveCount(1, { timeout: 20_000 });
  await chip.click();
  await expect(page.locator('#detailPanel')).toHaveClass(/\bopen\b/);
  await expect(page.locator('#detailTitle')).toHaveText(rack);
}

const bench = (page) => page.evaluate(() =>
  Array.from(document.querySelectorAll('#forge3d-sheet .chip[data-rack]')).map((c) => c.dataset.rack));

async function tap(page, id) {
  // The pager buttons are divs with click listeners; a disabled one has pointer-events:none, so a
  // real click on it would wait out its timeout — assert enabled first, then tap.
  await expect(page.locator('#' + id), id + ' is disabled').not.toHaveClass(/\bdisabled\b/);
  await page.locator('#' + id).click();
}

test.describe('66 — the Forge detail pager walks the row its header counts', () => {
  test('c1:005 · POS 5/18 · NEXT is enabled, and it walks off the five-rack bench to c1:006 and back', async ({ phantom, page }) => {
    test.setTimeout(240000);
    await seedMaster(phantom, page);
    await openAisleOn(page, 'c1:005');

    expect(await bench(page), 'the default bench is the first five racks of the Master').toEqual(C1.slice(0, 5));
    await expect(page.locator('#detailMeta')).toContainText('POS 5/18');
    await expect(page.locator('#navPrev'), 'PREV at POS 5').not.toHaveClass(/\bdisabled\b/);
    await expect(page.locator('#navNext'), 'NEXT at POS 5/18 — the reported defect').not.toHaveClass(/\bdisabled\b/);

    await tap(page, 'navNext');
    await expect(page.locator('#detailTitle'), 'NEXT from c1:005 lands on c1:006').toHaveText('c1:006');
    await expect(page.locator('#detailMeta')).toContainText('POS 6/18');
    const moved = await bench(page);
    expect(moved, 'c1:006 must be on the bench, or the tap focused nothing').toContain('c1:006');
    expect(moved.length, 'Contract A6 — never more than five live racks').toBeLessThanOrEqual(5);

    await tap(page, 'navPrev');
    await expect(page.locator('#detailTitle'), 'PREV from c1:006 returns to c1:005').toHaveText('c1:005');
    await expect(page.locator('#detailMeta')).toContainText('POS 5/18');

    expect(phantom.hardErrors()).toEqual([]);
  });

  test('the row ends are the only dead ends · every POS in order from c1:001 to c1:018, never into row c2', async ({ phantom, page }) => {
    test.setTimeout(300000);
    await seedMaster(phantom, page);
    await openAisleOn(page, 'c1:001');

    await expect(page.locator('#detailMeta')).toContainText('POS 1/18');
    await expect(page.locator('#navPrev'), 'PREV at the first rack of the row').toHaveClass(/\bdisabled\b/);
    await expect(page.locator('#navNext'), 'NEXT at the first rack of the row').not.toHaveClass(/\bdisabled\b/);

    for (let i = 1; i < C1.length; i++) {
      // Each step is named, so a stall reports WHERE in the row it happened, not just that it did.
      await test.step('NEXT ' + C1[i - 1] + ' → ' + C1[i], async () => {
        await tap(page, 'navNext');
        await expect(page.locator('#detailTitle'), 'step ' + i + ' skipped or stalled').toHaveText(C1[i]);
        await expect(page.locator('#detailMeta')).toContainText('POS ' + (i + 1) + '/18');
        expect((await bench(page)).length, 'Contract A6 at ' + C1[i]).toBeLessThanOrEqual(5);
      });
    }

    await expect(page.locator('#navNext'), 'NEXT at c1:018 — the true end of the row').toHaveClass(/\bdisabled\b/);
    await expect(page.locator('#navPrev'), 'PREV at c1:018').not.toHaveClass(/\bdisabled\b/);
    expect(phantom.hardErrors()).toEqual([]);
  });

  // ⛔ phantom-rd-reviewer P1 (Contract 11): setLoadout persists the bench to deploy_forge_loadout_v1,
  // registered as the "hand-built rack layout". Moving the bench because the tech paged past it is
  // navigation, not the tech building a bench, and must not overwrite what they built.
  test('DATA SAFETY · walking off a hand-picked bench moves the bench but never overwrites the saved loadout', async ({ phantom, page }) => {
    test.setTimeout(240000);
    await seedMaster(phantom, page, { loadout: HAND_PICKED });
    await openAisleOn(page, 'c1:005');
    expect(await bench(page), 'precondition: the restored bench is the hand-picked one').toEqual(HAND_PICKED);

    await tap(page, 'navNext');
    await expect(page.locator('#detailTitle'), 'NEXT from c1:005 lands on c1:006').toHaveText('c1:006');
    expect(await bench(page), 'the bench moved so c1:006 has a slot').toContain('c1:006');

    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), LOADOUT_KEY);
    expect(saved, 'paging overwrote the hand-built rack layout (deploy_forge_loadout_v1)').toEqual(HAND_PICKED);
    expect(phantom.hardErrors()).toEqual([]);
  });

  // phantom-rd-reviewer re-review (Contract 11, residual): a walk moves LOADOUT without saving it, and the
  // loadout picker seeded its checkboxes from LOADOUT — so opening the picker after a walk and tapping
  // APPLY without changing anything saved the walked row window over the hand-built bench, one screen
  // after the fix above. Apply has always sorted what it saves, so racks are compared as a set.
  test('DATA SAFETY · after a walk, an untouched loadout-picker APPLY keeps the hand-built bench', async ({ phantom, page }) => {
    test.setTimeout(240000);
    await seedMaster(phantom, page, { loadout: HAND_PICKED });
    await openAisleOn(page, 'c1:005');
    await tap(page, 'navNext');
    await expect(page.locator('#detailTitle')).toHaveText('c1:006');
    expect(await bench(page), 'precondition: the walk moved the bench off the hand-picked set').not.toEqual(HAND_PICKED);

    await page.locator('#navExit').click();
    await expect(page.locator('#detailPanel')).not.toHaveClass(/\bopen\b/);
    await page.locator('#loadoutBtn').click();
    await expect(page.locator('#picker')).toHaveClass(/\bopen\b/);
    await page.locator('#pickerApply').click();
    await expect(page.locator('#picker')).not.toHaveClass(/\bopen\b/);

    const asSet = (a) => (a || []).slice().sort();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), LOADOUT_KEY);
    expect(asSet(saved), 'an untouched APPLY saved the walked row window over the hand-built bench').toEqual(asSet(HAND_PICKED));
    expect(asSet(await bench(page)), 'after APPLY the bench is the hand-built set again').toEqual(asSet(HAND_PICKED));
    expect(phantom.hardErrors()).toEqual([]);
  });

  // Advisory from the same review: setLoadout's own "keep, else first slot" focus opened the WRONG rack
  // before walk corrected it — a second full panel, plate and texture pass on every off-bench walk. Both
  // passes run in one synchronous tick, so the observer reads each inserted text node's own value
  // rather than the element's final text.
  test('ONE FOCUS · a PREV walk that moves the bench opens only its target — no other rack flashes through the panel', async ({ phantom, page }) => {
    test.setTimeout(240000);
    await seedMaster(phantom, page);
    await openAisleOn(page, 'c1:005');
    await tap(page, 'navNext');
    await expect(page.locator('#detailTitle')).toHaveText('c1:006');
    expect(await bench(page), 'precondition: c1:005 is now OFF the bench').not.toContain('c1:005');

    await page.evaluate(() => {
      window.__pagerTitles = [];
      window.__pagerTitleObs = new MutationObserver((recs) => recs.forEach((r) =>
        r.addedNodes.forEach((n) => { if (n.nodeType === 3) window.__pagerTitles.push(n.data); })));
      window.__pagerTitleObs.observe(document.getElementById('detailTitle'), { childList: true });
    });
    await tap(page, 'navPrev');
    await expect(page.locator('#detailTitle'), 'PREV from c1:006 returns to c1:005').toHaveText('c1:005');
    const titles = await page.evaluate(() => { window.__pagerTitleObs.disconnect(); return window.__pagerTitles; });

    expect(titles.length, 'the walk must have opened the panel at least once').toBeGreaterThan(0);
    expect(titles.filter((t) => t !== 'c1:005'), 'another rack was opened in the panel before the target').toEqual([]);
    expect(phantom.hardErrors()).toEqual([]);
  });
});

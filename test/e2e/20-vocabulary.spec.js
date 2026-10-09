// ─────────────────────────────────────────────────────────────────────────────
// 20 — ONE COLOUR VOCABULARY (v1.14.429, spec §7 / I9)
//
// The flat elevation wrote the RAW master_hostType code into data-type while the CSS was keyed on
// DISPLAY keys, so 9 of 11 device codes matched no rule and painted grey on every Master rack.
// This pins the door that closes it, the routing, and — the part that actually needs a guard —
// that routing it did NOT change the legacy house.
//
// ⛔ THE CROSS-HOUSE TRAP THIS SPEC EXISTS FOR — called "the Rule 17 trap" until that contract was
// revoked 2026-08-29. The revocation frees legacy to CHANGE; it does not make an accidental,
// unnoticed repaint of both houses acceptable, so the trap below outlives the rule that named it.
// The base `.rack-canvas-block[data-type=...]` rules are
// NOT house-scoped and paint under ?legacy=1 too. Normalising the ATTRIBUTE changes what legacy
// MATCHES without touching one legacy rule: raw `stor` matches nothing and renders grey today,
// while normalised `storage` would hit the base rule and turn gold. A legacy behaviour change
// arrived at entirely through a redesign-house edit.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

// Every raw code master_hostType can emit, with the display key _TMAP maps it to.
// ⭐ `cdu` CHANGED FROM 'pdu' TO 'cdu' BY OWNER RULING 2026-08-12 (v1.14.448), and this table is
// updated deliberately rather than to make a red test green. The .429 ruling this spec was written
// against pulled pdu OUT of the cooling group and gave it gold, while explicitly leaving
// "cooling/fan/crah/crac ... GREEN — a different channel, never in dispute". _TMAP was the one
// place that never got the memo: it bridged raw `cdu` onto the `pdu` key, so every CDU rendered
// gold, labelled itself PDU and drew the power family's face. S4:099 RU02 was the live example.
// The owner ruled the CDU its own family; this row now matches the ruling it always should have.
const CODES = [
  ['gpu', 'gpu'], ['sw', 'switch'], ['pwr', 'pdu'], ['patch', 'patch'], ['stor', 'storage'],
  ['cpu', 'server'], ['server', 'server'], ['cdu', 'cdu'], ['fw', 'switch'], ['media', 'media'],
  ['other', 'unknown'],
];
// Owner ruling 2026-08-10 (bay wins) + the standing 2026-08-06 ruling (these three stay grey).
const GREY = ['patch', 'media', 'unknown'];

test.describe('the one colour vocabulary', () => {

  test('typeOf maps every raw code to its display key', async ({ phantom, page }) => {
    await phantom.boot();
    const got = await page.evaluate((codes) => codes.map(([raw]) => [raw, Vocabulary.typeOf(raw)]), CODES);
    expect(got).toEqual(CODES);
  });

  test('typeOf is IDEMPOTENT — normalising twice never erases a device class', async ({ phantom, page }) => {
    await phantom.boot();
    // typeOf(typeOf('sw')) must be 'switch', not 'unknown'. A naive `_TMAP[k] || 'unknown'` returns
    // 'unknown' on the second pass, so any path normalising twice would silently downgrade real
    // gear to unclassified. Three levels deep, every code.
    const bad = await page.evaluate((codes) => codes.map(([raw]) => {
      const a = Vocabulary.typeOf(raw), b = Vocabulary.typeOf(a), c = Vocabulary.typeOf(b);
      return (a === b && b === c) ? null : { raw, a, b, c };
    }).filter(Boolean), CODES);
    expect(bad, `typeOf is not idempotent for: ${JSON.stringify(bad)}`).toEqual([]);
  });

  test('an unmapped code is UNKNOWN, never BLANK', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => ({
      junk: Vocabulary.typeOf('definitely-not-a-code'),
      empty: Vocabulary.typeOf(''),
      nul: Vocabulary.typeOf(null),
    }));
    // 'blank' is a POSITIVE claim that the U is empty. A `|| 'blank'` fallback once rendered 459
    // real QUARRY devices as blanking panels — unknown means "real gear we could not classify".
    expect(r.junk).toBe('unknown');
    expect(r.empty).toBe('unknown');
    expect(r.nul).toBe('unknown');
  });

  test('THE POINT: the flat elevation now paints 8 of 11 codes, and the RIGHT colours', async ({ phantom, page }) => {
    test.setTimeout(120_000);
    await phantom.boot();

    const paints = await page.evaluate((codes) => {
      const host = document.createElement('div');
      host.className = 'rack-canvas';
      document.body.appendChild(host);
      const out = {};
      codes.forEach(([raw]) => {
        const key = Vocabulary.typeOf(raw);
        const el = document.createElement('div');
        el.className = 'rack-canvas-block';
        el.setAttribute('data-type', key);
        host.appendChild(el);
        const cs = getComputedStyle(el);
        out[raw] = { key, accent: cs.borderLeftColor, bg: cs.backgroundColor };
      });
      // And what the 3D tray would paint for the same key — the two must not contradict.
      out.__bay = {};
      codes.forEach(([raw]) => { out.__bay[raw] = Vocabulary.colorOf(raw); });
      host.remove();
      return out;
    }, CODES);

    const GREY_RGB = 'rgb(125, 147, 164)';        // #7d93a4
    const DEFAULT_ACCENT = 'rgba(180, 194, 208, 0.35)';
    const DARK_TRAY = 'rgba(9, 13, 20, 0.9)';
    let coloured = 0;
    for (const [raw, key] of CODES) {
      const p = paints[raw];
      expect(p.key, `${raw} normalised wrong`).toBe(key);

      // ⛔ THE GUARD .429 NEEDED AND DID NOT HAVE. The redesign house paints these as a DARK tray
      // body with a thin type-colour LEFT accent — a ruling (.229), after .228 "over-filled to a
      // solid slab that drowned the label". .429 put the bay colours in `background`, which
      // outranks the dark base, and re-created that slab. The colour belongs in the ACCENT.
      expect(p.bg, `${raw} (${key}) has a filled body — the .228 slab is back, colour belongs in the accent`).toBe(DARK_TRAY);

      if (GREY.indexOf(key) >= 0) {
        expect(p.accent, `${raw} (${key}) must stay GREY per the 2026-08-06 ruling`).toBe(GREY_RGB);
      } else {
        expect(p.accent, `${raw} (${key}) still has the DEFAULT accent — the routing did not reach it`).not.toBe(DEFAULT_ACCENT);
        expect(p.accent, `${raw} (${key}) is grey, so the routing did not reach it`).not.toBe(GREY_RGB);
        coloured++;
      }
    }
    // 2/11 before this ship, 8/11 after — the number the ruling was made against.
    expect(coloured, 'colour coverage is not 8 of 11 raw codes').toBe(8);
    console.log('[20] accent-coloured ' + coloured + '/11 · bay values: ' + JSON.stringify(paints.__bay));
  });

  // ⛔ RETIRED v1.14.553 (LEGACY-RETIRE Stage 7a), as this block's own note instructed: "retire it
  // in the stage that deletes rackElevation_buildHtml's legacy branch." The test was
  // 'legacy raw-code emission — leak guard'. It drove the real writer through ?legacy=1 and
  // asserted the legacy house kept emitting RAW device codes, so the base unscoped colour rules
  // could not start matching and repaint both houses.
  // ⭐ It cannot run any more: ?legacy=1 is inert, so the writer always takes the redesign path.
  // The branch itself still EXISTS inside rackElevation_buildHtml — unwrapping the 939 body.rd
  // gates is Stage 8, which the owner deferred permanently — but it is now unreachable, and a
  // test that cannot reach its subject proves nothing.
  // ⚠ The live half of the guard is untouched and still green: 'the redesign house DOES emit
  // normalised keys' below asserts the surviving direction of exactly this invariant.

  test('the redesign house DOES emit normalised keys — the other half of the same guard', async ({ phantom, page }) => {
    test.setTimeout(120_000);
    await phantom.boot();
    expect(await phantom.isRedesign()).toBe(true);
    const html = await page.evaluate(() => rackElevation_buildHtml({ totalU: 12, slots: [
      { uStart: 1, uEnd: 1, type: 'stor', name: 's', dns: 's', model: 'M', status: 'pending' },
      { uStart: 3, uEnd: 3, type: 'pwr', name: 'p', dns: 'p', model: 'M', status: 'pending' },
    ] }));
    expect(html, 'the redesign house is still emitting raw codes — the routing did not happen').toContain('data-type="storage"');
    expect(html).toContain('data-type="pdu"');
  });
});

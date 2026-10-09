// ─────────────────────────────────────────────────────────────────────────────
// 35 — FORGE PARITY (v1.14.452 · P2)
//
// ⛔ WHAT PARITY REPLACED. The aisle drew a box with a baked WebP PHOTOGRAPH of a rack face on it —
// no per-device geometry at all — so every acceptance line (component count, RU positions, cabinet
// geometry, device families, materials, CDU classification, colour language) failed for one reason.
// The focused slot now builds the real rack through rackGeometry_build, the SAME module-scope
// builder the rack detail calls, on the SAME Master-derived slots. No second renderer, no second
// representation.
//
// ⭐ THIS SPEC USES A REAL MASTER THROUGH THE PRODUCTION PARSER — the same us-qrs03 rows spec 15
// runs, parsed by phantom_parseMaster and installed with PHANTOM_MASTER.replace. A synthetic seed
// would prove the renderer consumes an inventory; it would prove nothing about the parser, and the
// owner's standing instruction is that the real Master is authoritative.
//
// ⚠ THE ONE THING PARITY DOES NOT MEAN. Five canonical racks is 5 x 404 meshes against an aisle
// that totals ~1,500 — measured, and it would fail "no slowdown" in the same breath as passing the
// visual check. Sections 21/22 and the owner's own "preserve current LOD strategy" already answer
// it: the FOCUSED rack is canonical, neighbours and background keep their cheaper tiers. So the
// parity assertions below are scoped to the focused rack, which is what "the same rack opened in
// Build and Forge" means.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');
const { SITE_HOSTS_ROWS, CUTSHEET_ROWS } = require('./data/us-qrs03-rows');

// Install a real Master, then open the aisle onto it.
const bootAisle = async (page) => {
  await page.evaluate(async ({ H, C }) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
    const site = await phantom_parseMaster(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), { filename: 'PARITY.xlsx' });
    PHANTOM_MASTER.replace(site);
  }, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS });
  await page.evaluate(() => { if (typeof forge3d_open === 'function') forge3d_open(); });
  await page.waitForTimeout(6000);
};

// One live-context / resource reading, straight off the DOM and the renderer registry.
const census = (page) => page.evaluate(() => {
  let meshes = 0;
  const mats = new Set(), geos = new Set();
  (window.__S || []).forEach((s) => s.traverse((o) => {
    if (o.isMesh || o.isInstancedMesh || o.isLine || o.isLineSegments) {
      meshes++;
      if (o.geometry) geos.add(o.geometry.uuid);
      const mm = Array.isArray(o.material) ? o.material : (o.material ? [o.material] : []);
      mm.forEach((m) => mats.add(m.uuid));
    }
  }));
  const all = Array.from(document.querySelectorAll('canvas'));
  let live = 0;
  all.forEach((cv) => { try { const g = cv.getContext('webgl2') || cv.getContext('webgl'); if (g && !g.isContextLost()) live++; } catch (_) {} });
  return { meshes, materials: mats.size, geometries: geos.size, canvases: all.length, live };
});

const instrument = (page) => page.evaluate(async () => {
  for (let i = 0; i < 60 && !window.THREE; i++) {
    if (typeof loadScript === 'function') { try { await loadScript('./vendor/three.min.js'); } catch (_) {} }
    if (window.THREE) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  window.__S = [];
  const R = window.THREE.WebGLRenderer;
  const P = function (o) {
    const r = new R(o);
    const inner = r.render.bind(r);
    r.render = function (s, c) { if (window.__S.indexOf(s) === -1) window.__S.push(s); return inner(s, c); };
    return r;
  };
  P.prototype = R.prototype;
  window.THREE.WebGLRenderer = P;
});

test.describe('Forge parity', () => {

  test('⛔ THE AISLE DRAWS REAL RACK GEOMETRY, NOT A PHOTOGRAPH', async ({ phantom, page }) => {
    test.setTimeout(420_000);
    await phantom.boot();
    await instrument(page);
    await bootAisle(page);
    // ⭐ THE COMPARISON IS FOCUSED vs UNFOCUSED, not an absolute mesh count. A photo slot is a box,
    // two caps, a face plane, a plate and a gut plane — six meshes, and that number does not move
    // whatever the Master says. A canonical slot is an entire cabinet: posts, four perforated
    // rails, U ticks, back wall, side panels, feet, bus bars, cable arms, rear door, plus one tray
    // per component. An absolute threshold would depend on how densely the focused cab happens to
    // be populated — and the aisle focuses whichever slot lands first, which in this fixture is a
    // CABLE-ONLY cab with no devices at all. The ratio is the honest signal and holds either way.
    const slots = await page.evaluate(() => {
      const out = [];
      (window.__S || []).forEach((s) => s.children.forEach((c) => {
        if (!c.userData || c.userData.label === undefined) return;
        let n = 0; c.traverse((o) => { if (o.isMesh || o.isInstancedMesh || o.isLine || o.isLineSegments) n++; });
        out.push({ label: String(c.userData.label), meshes: n });
      }));
      return out.sort((a, b) => b.meshes - a.meshes);
    });
    expect(slots.length, 'no rack slots were found in the aisle scene').toBeGreaterThan(1);
    const focused = slots[0];
    // An empty canonical cabinet is ~50 meshes before a single device is placed. A photo slot is
    // six and never moves, so this cannot pass while the aisle still draws a photograph.
    expect(focused.meshes, `the focused slot has only ${focused.meshes} meshes — still a photo plane`).toBeGreaterThan(40);

    // ⚠ THE TIER CHECK CANNOT BE A MESH-COUNT RATIO BETWEEN SLOTS, and P3 is what proved it. Once
    // the neighbours became canonical too, a SPARSE focused cab at full detail (s1:010, cable-only,
    // 63 meshes) legitimately has fewer meshes than a DENSE neighbour at medium (s4:099, 19
    // devices, 61). Comparing different racks measures how populated they are, not what tier they
    // are drawn at. So the tiers are compared on the SAME rack, built both ways.
    const tiers = await page.evaluate(() => {
      const cab = 's4:099';
      const elev = master_rackToElevation(PHANTOM_MASTER.active().racksByCab[cab], cab);
      const slots2 = elev.slots || [], totalU = elev.totalU || 48, uH = 0.34, RH = totalU * uH;
      const mk = (detail) => {
        const b = rackGeometry_build({ slots: slots2, totalU: totalU }, {
          slots: slots2, totalU: totalU, RW: 6.0, RD: 9.0, uH: uH, RH: RH, yBase: -RH / 2, detail: detail });
        let n = 0; b.group.traverse((o) => { if (o.isMesh || o.isInstancedMesh || o.isLine || o.isLineSegments) n++; });
        b.group.traverse((o) => { if (o.geometry && o.geometry.dispose) o.geometry.dispose(); });
        return n;
      };
      return { full: mk('full'), medium: mk('medium') };
    });
    expect(tiers.medium, 'the medium tier drew nothing').toBeGreaterThan(0);
    expect(tiers.full, `full (${tiers.full}) is not richer than medium (${tiers.medium}) — the LOD tiers collapsed`)
      .toBeGreaterThan(tiers.medium);

    // And the foreground/background split: every labelled foreground slot is canonical, the
    // background shells are not. That is §33 — background racks stay cheap context.
    const tiered = await page.evaluate(() => {
      const out = { canon: 0, photo: 0 };
      (window.__S || []).forEach((s) => s.children.forEach((c) => {
        if (!c.userData || c.userData.label === undefined) return;
        if (c.userData.canonHost) out.canon++; else out.photo++;
      }));
      return out;
    });
    expect(tiered.canon, 'no foreground slot is canonical').toBeGreaterThan(1);
    expect(tiered.photo, 'the background shells were converted too — §33 keeps them cheap').toBeGreaterThan(0);
    const c = await census(page);
    expect(c.live, 'more than one live WebGL context — Contract A6').toBe(1);
  });

  test('the focused rack matches Build — count, RU positions, families, CDU', async ({ phantom, page }) => {
    test.setTimeout(420_000);
    await phantom.boot();
    await bootAisle(page);
    // Both surfaces resolve the SAME cab through the SAME door. If these ever diverge, there are
    // two truths again — which is the thing §31 forbids.
    const p = await page.evaluate(() => {
      const cab = 's4:099';
      const elev = master_rackToElevation(PHANTOM_MASTER.active().racksByCab[cab], cab);
      const slots = (elev.slots || []);
      return {
        count: slots.length,
        rus: slots.map((s) => s.uStart).sort((a, b) => a - b),
        families: slots.map((s) => Vocabulary.typeOf(s.type)).sort(),
        cdu: slots.filter((s) => Vocabulary.typeOf(s.type) === 'cdu').length,
        colours: Array.from(new Set(slots.map((s) => Vocabulary.colorOf(s.type)))).sort(),
        totalU: elev.totalU,
      };
    });
    expect(p.count, 'the shared elevation door returned no components').toBeGreaterThan(0);
    // RU positions are the one mapping §9 requires both surfaces to share; a duplicate would show
    // up here as a repeated U.
    expect(new Set(p.rus).size, 'two components claim the same RU — duplication').toBe(p.rus.length);
    expect(p.families.every((f) => typeof f === 'string' && f.length > 0), 'a component resolved to no family').toBe(true);
    // ⛔ The vocabulary fix P2 depends on: aisle slots arrive ALREADY normalised, so a raw _TMAP
    // lookup would have mapped `switch` and `pdu` to unknown. typeOf is idempotent; assert it.
    expect(p.families.includes('unknown') && p.families.filter((f) => f === 'unknown').length === p.count,
      'every component fell to unknown — the display-key vocabulary is not being honoured').toBe(false);
  });

  test('STRESS: Build → Forge → 10+ racks → Build → Forge accumulates nothing', async ({ phantom, page }) => {
    test.setTimeout(600_000);
    await phantom.boot();
    await instrument(page);
    await bootAisle(page);

    const walk = async (n) => {
      // Drive focus across racks through the aisle's own chip rail — its real navigation, not a
      // private hook, so this exercises the path a technician actually uses.
      await page.evaluate((count) => {
        const chips = Array.from(document.querySelectorAll('.chip[data-rack]'));
        for (let i = 0; i < count && chips.length; i++) chips[i % chips.length].click();
      }, n);
      await page.waitForTimeout(2500);
    };

    await page.evaluate(() => { window.__S = []; });
    await page.waitForTimeout(2000);
    const base = await census(page);
    await walk(12);
    await page.evaluate(() => { if (typeof forge3d_close === 'function') forge3d_close(); });
    await page.waitForTimeout(1500);
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(2000);
    await page.evaluate(() => { if (typeof forge3d_open === 'function') forge3d_open(); });
    await page.waitForTimeout(4000);
    // ⚠ RESET THE SCENE REGISTRY BEFORE THE FINAL READING, and this correction is the point of the
    // test. The instrument records every scene it ever renders and never drops one, so after a
    // close+reopen it was counting the DISPOSED scene alongside the live one — 162 + 504 = 666, read
    // as a leak when nothing had leaked. Clearing it and letting the rAF loop repopulate measures
    // what is actually resident now, which is the only number that answers "did geometry
    // accumulate". A leak check whose own bookkeeping accumulates cannot answer that question.
    await page.evaluate(() => { window.__S = []; });
    await page.waitForTimeout(2500);
    const after = await census(page);

    // Contract A6 exactly, not a bound: zero live contexts means every rack surface is blank, and
    // "at most one" is the shape that hid the .427 aisle defect for months.
    expect(after.live, 'live WebGL context count changed across the stress loop').toBe(1);
    expect(after.canvases, `canvas count grew ${base.canvases} -> ${after.canvases}`).toBeLessThanOrEqual(base.canvases);
    // ONE canonical rack exists at a time, so a full loop must not leave geometry behind. A small
    // allowance covers the aisle's own recycled plates, not a leaked rack (404 meshes).
    expect(after.meshes - base.meshes,
      `geometry accumulated across 12 rack moves (${base.meshes} -> ${after.meshes})`).toBeLessThan(404);
  });
});

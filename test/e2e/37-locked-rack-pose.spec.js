// ─────────────────────────────────────────────────────────────────────────────
// 37 — LOCKED RACK MODE IS A CANONICAL FRONT ELEVATION (v1.14.455, owner ruling 2026-08-13)
//
// ⛔ WHAT .454 GOT WRONG. It locked the camera to the angles setFocus had always targeted —
// LOCK_YAW 0.10, LOCK_PITCH 0.08 — and called them canonical. That is 5.7° of yaw and 4.6° of
// nose-down pitch, so the "locked" view was a three-quarter shot held steady: the cabinet leaned,
// its rails converged, and the neighbour competed with it. There was also a bare `+ 0.4` on the
// camera's y with no matching target offset, which tilted the axis even at pitch 0. Locking the
// wrong pose is not the same as having a canonical one.
//
// ⭐ THE RULING. Locked mode must produce a deterministic FRONT ELEVATION derived from the
// SELECTED RACK'S OWN TRANSFORM — never from previous camera state, the previous rack, accumulated
// pan, or the aisle world origin. Rack A and rack B must look like the same rig physically moved in
// front of each cabinet.
//
// ⚠ THIS SPEC MEASURES THE CAMERA, NOT A SCREENSHOT. "Looks square" reduces to numbers: the
// forward vector's x and y components, the roll of the up/right vectors, and whether height and
// distance are identical across racks. A pixel diff would also pass on a scene that happened to
// look symmetric while pointing 3° off-axis.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');
const { SITE_HOSTS_ROWS, CUTSHEET_ROWS } = require('./data/us-qrs03-rows');

const openAisle = async (page) => {
  await page.evaluate(async ({ H, C }) => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
    const site = await phantom_parseMaster(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), { filename: 'RC.xlsx' });
    PHANTOM_MASTER.replace(site);
  }, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS });
  await page.evaluate(() => { if (typeof forge3d_open === 'function') forge3d_open(); });
  await page.waitForTimeout(7000);
};

// The camera is NOT a scene child, so traversing the scene finds nothing. Capture it from the
// render call — that is the camera actually being drawn.
const instrument = (page) => page.evaluate(async () => {
  for (let i = 0; i < 60 && !window.THREE; i++) {
    if (typeof loadScript === 'function') { try { await loadScript('./vendor/three.min.js'); } catch (_) {} }
    if (window.THREE) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  const R = window.THREE.WebGLRenderer;
  const P = function (o) {
    const r = new R(o);
    const inner = r.render.bind(r);
    r.render = function (s, c) { window.__cam = c; return inner(s, c); };
    return r;
  };
  P.prototype = R.prototype;
  window.THREE.WebGLRenderer = P;
});

const pose = (page) => page.evaluate(() => {
  const c = window.__cam;
  if (!c) return null;
  const THREE = window.THREE;
  const fwd = new THREE.Vector3(); c.getWorldDirection(fwd);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(c.quaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(c.quaternion);
  return {
    pos: { x: +c.position.x.toFixed(5), y: +c.position.y.toFixed(5), z: +c.position.z.toFixed(5) },
    fwd: { x: +fwd.x.toFixed(5), y: +fwd.y.toFixed(5), z: +fwd.z.toFixed(5) },
    rollX: +up.x.toFixed(6),
    rightY: +right.y.toFixed(6),
    fov: c.fov,
    hasOffset: !!c.view && !!c.view.enabled,
    offX: c.view ? +c.view.offsetX.toFixed(2) : null,
  };
});

// ⚠ POLL, DO NOT WAIT A FIXED PERIOD. The rack change eases per frame and this harness renders at
// ~2.7 fps, so a fixed wait samples mid-glide and measures the MACHINE. This is the same trap that
// made the .454 snap-back test fail against correct code; it is not repeated here.
const settle = async (page, budgetMs = 40000) => {
  let last = null, stable = 0, p = null;
  const t0 = Date.now();
  while (Date.now() - t0 < budgetMs) {
    await page.waitForTimeout(500);
    p = await pose(page);
    if (!p) continue;
    const key = `${p.pos.x}|${p.pos.y}|${p.pos.z}`;
    if (key === last) { if (++stable >= 2) return p; } else { stable = 0; last = key; }
  }
  return p;
};

// A chip tap on the ALREADY-focused rack opens the rack detail, which covers the scene. Close it.
const focusRack = async (page, id) => {
  await page.evaluate((rid) => {
    const chip = document.querySelector(`#forge3d-sheet .chip[data-rack="${rid}"]`);
    if (chip) chip.click();
  }, id);
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const dp = document.getElementById('detailPanel');
    if (dp && dp.classList.contains('open')) {
      const b = document.getElementById('detailClose');
      if (b) b.click(); else dp.classList.remove('open');
    }
  });
  await page.waitForTimeout(600);
};

test.describe('Locked rack mode is a canonical front elevation', () => {

  test('⛔ the locked pose is square to the rack — zero yaw, zero pitch, zero roll', async ({ phantom, page }) => {
    test.setTimeout(300_000);
    await phantom.boot();
    await instrument(page);
    await openAisle(page);
    const p = await settle(page);
    expect(p, 'no camera was captured — this test proved nothing').not.toBeNull();

    // ⭐ THE FAILURE VALUES ARE THE OLD CONSTANTS, and the bounds are chosen to exclude them.
    // LOCK_YAW 0.10 would put |fwd.x| near 0.0998; LOCK_PITCH 0.08 would put |fwd.y| near 0.0799.
    // 1e-4 admits neither, so this cannot pass on a rebuild of the .454 behaviour.
    expect(Math.abs(p.fwd.x), `camera is yawed off the rack's front normal (fwd.x ${p.fwd.x})`).toBeLessThan(1e-4);
    expect(Math.abs(p.fwd.y), `camera is pitched off horizontal (fwd.y ${p.fwd.y}) — vertical rails cannot project as vertical`).toBeLessThan(1e-4);
    expect(Math.abs(p.rollX), `camera is rolled (up.x ${p.rollX})`).toBeLessThan(1e-6);
    expect(Math.abs(p.rightY), `camera's right vector is not horizontal (right.y ${p.rightY}) — the cabinet will lean`).toBeLessThan(1e-6);
  });

  test('the frame is an inspection view, centred on the USABLE rect and not the raw canvas', async ({ phantom, page }) => {
    test.setTimeout(300_000);
    await phantom.boot();
    await instrument(page);
    await openAisle(page);
    const p = await settle(page);

    // A long lens, not the 46° cinematic aisle FOV that splayed the cabinet.
    expect(p.fov, `FOV ${p.fov} is too wide for a front elevation — perspective distortion returns`).toBeLessThanOrEqual(38);

    // The scene-utility rail eats the right of the canvas, so centring on the raw canvas centre
    // leaves the rack visibly shifted. The projection must be offset to the usable centre.
    expect(p.hasOffset, 'no view offset — the rack is centred on the raw canvas, so the utility rail shifts it').toBe(true);
    expect(Math.abs(p.offX), 'the horizontal view offset is zero — the right-hand control rail is not being compensated').toBeGreaterThan(1);
  });

  test('⭐ every rack lands on the SAME pose relative to itself, and the walk returns exactly', async ({ phantom, page }) => {
    test.setTimeout(600_000);
    await phantom.boot();
    await instrument(page);
    await openAisle(page);

    const chips = await page.evaluate(() => Array.from(document.querySelectorAll('#forge3d-sheet .chip')).map((c) => c.dataset.rack));
    expect(chips.length, 'fewer than two racks in the loadout — a drift test needs somewhere to drift').toBeGreaterThanOrEqual(2);

    const first = chips[0];
    await focusRack(page, first);
    const p0 = await settle(page);

    const seen = [];
    for (const id of chips.slice(0, 4)) {
      await focusRack(page, id);
      seen.push({ id, p: await settle(page) });
    }

    // ⛔ Height and distance are the drift channels. .455's first cut snapped on TOTAL distance, so
    // the large x delta of a rack change held the vector above threshold and y crept
    // 1.8869 → 1.8971 → 1.89925 across a walk — a camera height that depended on how many racks you
    // had visited. Only x may differ between racks; it is the rail the rig slides along.
    for (const s of seen) {
      expect(s.p.pos.y, `${s.id} sits at a different camera HEIGHT — the pose is accumulating`).toBeCloseTo(seen[0].p.pos.y, 5);
      expect(s.p.pos.z, `${s.id} sits at a different camera DISTANCE — the pose is accumulating`).toBeCloseTo(seen[0].p.pos.z, 5);
      expect(Math.abs(s.p.fwd.x), `${s.id} is yawed`).toBeLessThan(1e-4);
      expect(Math.abs(s.p.fwd.y), `${s.id} is pitched`).toBeLessThan(1e-4);
    }

    // Navigate back. The pose must be the one we started on, not merely near it.
    await focusRack(page, first);
    const back = await settle(page);
    expect(back.pos.x, 'the walk did not return to the first rack in x').toBeCloseTo(p0.pos.x, 5);
    expect(back.pos.y, 'the walk did not return to the first rack in y').toBeCloseTo(p0.pos.y, 5);
    expect(back.pos.z, 'the walk did not return to the first rack in z').toBeCloseTo(p0.pos.z, 5);
  });

  test('leaving WALK AISLE returns to a pose identical to selecting that rack normally', async ({ phantom, page }) => {
    test.setTimeout(300_000);
    await phantom.boot();
    await instrument(page);
    await openAisle(page);
    const locked = await settle(page);

    // Free the camera and move it somewhere it would never sit under lock.
    await page.evaluate(() => document.getElementById('walkBtn').click());
    await page.waitForTimeout(500);
    const box = await page.evaluate(() => {
      const cv = document.querySelector('#forge3d-mount canvas');
      const r = cv.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(box.x + (260 * i) / 6, box.y + (110 * i) / 6);
    await page.mouse.up();
    await page.waitForTimeout(1200);
    const wandered = await pose(page);
    expect(Math.abs(wandered.fwd.x) + Math.abs(wandered.fwd.y), 'walk mode did not actually free the camera').toBeGreaterThan(0.01);

    // Leave. The ruling: the pose landed on must be MATHEMATICALLY the canonical one.
    await page.evaluate(() => document.getElementById('walkBtn').click());
    const back = await settle(page);
    expect(Math.abs(back.fwd.x), `leaving walk left the camera yawed (fwd.x ${back.fwd.x})`).toBeLessThan(1e-4);
    expect(Math.abs(back.fwd.y), `leaving walk left the camera pitched (fwd.y ${back.fwd.y})`).toBeLessThan(1e-4);
    expect(back.pos.y, 'leaving walk did not restore the canonical height').toBeCloseTo(locked.pos.y, 5);
    expect(back.pos.z, 'leaving walk did not restore the canonical distance').toBeCloseTo(locked.pos.z, 5);
  });
});

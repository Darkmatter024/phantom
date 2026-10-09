// ─────────────────────────────────────────────────────────────────────────────
// 36 — FORGE IS RACK-CENTRIC (v1.14.454, owner ruling 2026-08-12)
//
// ⛔ WHAT IT WAS. A free orbit that happened to start pointed at a rack. Drag mutated yaw and pitch
// unconditionally, pinch mutated radius, and NOTHING ever put them back — so focusing the next rack
// only slid camX sideways and inherited whatever angle the last drag had left. Two technicians on
// the same floor could read the same cabinet from different places, and neither was the framing the
// rack was designed to be read from.
//
// ⭐ THE RULING. Opening Forge establishes a deterministic locked framing on the first rack. Rack
// navigation moves the camera BETWEEN canonical rack positions. Free movement is an explicit WALK
// AISLE mode, and leaving it snaps back to the nearest rack's locked framing. Camera-lock is NOT a
// setting — locked is the product's default behaviour.
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
  await page.waitForTimeout(6000);
};

// Drag across the canvas — the gesture a technician makes to look around.
const drag = async (page, dx, dy) => {
  const box = await page.evaluate(() => {
    const cv = document.querySelector('#forge3d-mount canvas');
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!box) return false;
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) await page.mouse.move(box.x + (dx * i) / 6, box.y + (dy * i) / 6);
  await page.mouse.up();
  await page.waitForTimeout(1200);
  return true;
};

// ⚠ ASSERT ON THE LOOK DIRECTION, NOT THE POSITION — and this took a measurement to learn.
// The aisle eases camX and radius toward their targets every frame, and the harness renders at a
// few frames per second, so the camera is STILL converging twelve seconds after open: sampled at
// 3s intervals it read x -1.00, -2.26, -2.93, -3.34. Any two position samples therefore differ
// whether or not a drag happened, which made a position assertion report a locked camera as moving.
// getWorldDirection is the unit vector from the camera toward its look target: it encodes yaw and
// pitch ONLY, and is unchanged by how far along the camX/radius ease the camera happens to be.
// That is exactly the invariant the ruling is about — which way the technician is looking.
// ⚠ Also: the camera is NOT a scene child (three.js does not require it), so traversing the scene
// finds nothing. It is captured from the render call, which is the camera actually being drawn.
const camPos = (page) => page.evaluate(() => {
  const c = window.__cam;
  if (!c) return { found: false };
  const v = new window.THREE.Vector3();
  c.getWorldDirection(v);
  return { found: true, x: +v.x.toFixed(4), y: +v.y.toFixed(4), z: +v.z.toFixed(4) };
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
    r.render = function (s, c) { if (window.__S.indexOf(s) === -1) window.__S.push(s); window.__cam = c; return inner(s, c); };
    return r;
  };
  P.prototype = R.prototype;
  window.THREE.WebGLRenderer = P;
});

test.describe('Forge is rack-centric', () => {

  test('⛔ LOCKED IS THE DEFAULT — a drag does not move the camera', async ({ phantom, page }) => {
    test.setTimeout(300_000);
    // 📌 v1.14.455 SIMPLIFIED THIS, and the reason is worth keeping. The two-boot control run below
    // existed because the .454 pose was never stable: camX and radius eased forever, so neither the
    // camera's position NOR its look direction was constant and a single before/after sample could
    // not tell "the drag moved it" from "it was always moving". The pose is now solved from the rack
    // and SNAPPED, so the locked direction is a constant — (0,0,-1) — and a drag either changes it
    // or does not. The control run is kept because it costs one boot and still proves the stronger
    // statement: two independent sessions land on the same place.
    // ⚠ THIS IS A CONTROL COMPARISON, and it has to be. The aisle eases camX and radius toward
    // their targets every frame and the harness renders at a few fps, so the camera is STILL
    // converging twelve seconds after open (sampled at 3s: x -1.00, -2.26, -2.93, -3.34). Neither
    // its position NOR its look direction is stable, because lookAt targets a point whose distance
    // is itself still easing. So a single before/after sample cannot tell "the drag moved it" from
    // "it was always moving" — an earlier draft of this test reported a correctly locked camera as
    // broken twice for exactly that reason.
    // The control run does the same open, waits the same time and performs a ZERO-delta drag, so it
    // travels the same easing curve through the same handlers. Locked, the two must land together.
    const run = async (dx, dy) => {
      await phantom.boot();
      await instrument(page);
      await openAisle(page);
      await drag(page, dx, dy);
      return camPos(page);
    };
    const control = await run(0, 0);
    const dragged = await run(220, 90);
    expect(control.found && dragged.found, 'no camera was captured — this test proved nothing').toBe(true);
    expect(dragged.y, 'a drag pitched the camera while locked').toBeCloseTo(control.y, 3);
    expect(dragged.x, 'a drag orbited the camera while locked').toBeCloseTo(control.x, 3);
    // v1.14.455 — and it is not merely UNCHANGED, it is SQUARE. A camera frozen at the wrong angle
    // would satisfy the two assertions above; .454 shipped exactly that. Spec 37 owns the full
    // front-elevation contract, but the cheap half is pinned here too so this file cannot go green
    // on a locked-but-crooked camera.
    expect(Math.abs(dragged.x), `locked but yawed off the rack normal (fwd.x ${dragged.x})`).toBeLessThan(1e-4);
    expect(Math.abs(dragged.y), `locked but pitched off horizontal (fwd.y ${dragged.y})`).toBeLessThan(1e-4);
  });

  test('WALK AISLE is an explicit mode, and it frees the camera', async ({ phantom, page }) => {
    test.setTimeout(300_000);
    await phantom.boot();
    await instrument(page);
    await openAisle(page);

    const btn = await page.evaluate(() => {
      const b = document.getElementById('walkBtn');
      return b ? { exists: true, pressed: b.getAttribute('aria-pressed') } : { exists: false };
    });
    expect(btn.exists, 'there is no WALK AISLE control').toBe(true);
    // Default OFF, and it announces its state rather than signalling only by colour.
    expect(btn.pressed, 'walk mode is engaged before the technician asked for it').toBe('false');

    const before = await camPos(page);
    await page.evaluate(() => document.getElementById('walkBtn').click());
    await page.waitForTimeout(600);
    await drag(page, 220, 90);
    const after = await camPos(page);
    expect(after.y, 'walk mode did not free the camera — a drag still changes nothing')
      .not.toBeCloseTo(before.y, 3);
    const on = await page.evaluate(() => document.getElementById('walkBtn').getAttribute('aria-pressed'));
    expect(on, 'the walk button does not report itself engaged').toBe('true');
  });

  test('leaving WALK snaps back to the canonical rack framing', async ({ phantom, page }) => {
    test.setTimeout(300_000);
    await phantom.boot();
    await instrument(page);
    await openAisle(page);
    const locked = await camPos(page);

    await page.evaluate(() => document.getElementById('walkBtn').click());
    await page.waitForTimeout(500);
    await drag(page, 300, 130);
    const wandered = await camPos(page);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    const away = dist(wandered, locked);
    expect(away, 'the camera never actually moved in walk mode').toBeGreaterThan(0.05);

    await page.evaluate(() => document.getElementById('walkBtn').click());
    // ⚠ POLLED, NOT A DEADLINE — and an earlier draft's fixed 3000ms wait is exactly why this test
    // failed against correct code. The ease is FRAME-based (0.12 per frame), so how long the snap
    // takes in wall-clock is a function of the harness frame rate, MEASURED here at 2.67 fps against
    // 60 on the device; this box's rate is documented as varying by orders of magnitude between
    // runs. The convergence curve on known-good code, sampled every second, was 0.833 · 0.582 ·
    // 0.354 · 0.214 · 0.146 · 0.088 · 0.060 of the original distance — so a 3000ms wait lands on
    // 0.354, sitting on top of its own 0.35 threshold and tipping either way on timing noise. That
    // measured the machine, not the product.
    // ⚠ Measured as CONVERGENCE, not equality. `locked` is sampled at open while radius is still
    // easing 13.5 → LOCK_RADIUS, so the direction the camera settles at is close to it but not
    // bit-identical; the curve above asymptotes near 0.05, never 0. What the ruling requires is that
    // leaving walk mode BRINGS IT BACK, so the assertion is that the angular distance collapses.
    // 0.20 is comfortably below every plateau a broken snap could produce (a camera that never
    // returned would hold near 1.0) and comfortably above that asymptote.
    const LIMIT = away * 0.20;
    let remaining = away;
    for (let waited = 0; waited < 30_000; waited += 1000) {
      await page.waitForTimeout(1000);
      remaining = dist(await camPos(page), locked);
      if (remaining < LIMIT) break;
    }
    const back = await camPos(page);
    expect(remaining, `leaving walk mode did not snap back (was ${away.toFixed(3)} away, still ${remaining.toFixed(3)} after 30s)`)
      .toBeLessThan(LIMIT);
    expect(back.found, 'no camera was captured — this test proved nothing').toBe(true);
    const off = await page.evaluate(() => document.getElementById('walkBtn').getAttribute('aria-pressed'));
    expect(off, 'the walk button still reports engaged after leaving').toBe('false');
  });

  test('⛔ camera-lock is NOT exposed as a setting', async ({ phantom, page }) => {
    await phantom.boot();
    // The ruling is explicit: locked is product behaviour, not a preference. A persisted or
    // configurable lock would let two technicians on the same floor see different aisles.
    const leaked = await page.evaluate(() => Object.keys(localStorage)
      .filter((k) => /camlock|cameralock|lockcam|walkmode|freecam/i.test(k)));
    expect(leaked, 'a camera-lock preference is being persisted').toEqual([]);
    const src = await page.evaluate(() => String(window.forge3d_render));
    expect(/store\.(set|get)\([^)]*walk/i.test(src),
      'walk mode is being persisted — it is a mode, not a setting').toBe(false);
  });
});

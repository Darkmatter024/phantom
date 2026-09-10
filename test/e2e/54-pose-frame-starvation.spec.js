// ────────────────────────────────────────────────────────────────────────────
// 54 — THE LOCKED POSE LANDS EXACTLY, HOWEVER FEW FRAMES ARRIVE
//      (owner ruling 2026-09-10: "rack pose: it's a real defect, the tolerance stands")
//
// ⭐ WHY THIS SPEC EXISTS, AND WHY IT IS NOT A COPY OF 37. Spec 37 asserts the same property, but
// it can only observe the defect when the machine happens to starve the render loop — which made it
// a COIN FLIP, not a test. Measured on an identical 18-spec prefix, the buggy code failed 37:179
// once and passed it once. A test that reproduces a real defect half the time cannot prove a fix:
// a green run is as likely to be luck as evidence.
//
// ⛔ THE FIX IS TO MAKE THE CONDITION, NOT TO WAIT FOR IT. The defect is not "sometimes the camera
// drifts". It is precisely: THE LANDING WAS FRAME-COUNTED, SO A STARVED FRAME BUDGET LEFT THE POSE
// SHORT. So this spec starves the frame budget on purpose, deterministically, and asserts the pose
// lands anyway. The machine's mood stops being a variable.
//
// THE MECHANISM IT PINS (dct-ios.html, _ease / placeCamera):
//   BEFORE v1.14.587 the ease moved a flat 0.14 PER FRAME and only set an axis exactly once the gap
//   fell under LOCK_SNAP (0.0009) — about 56 frames from a walk-exit gap. At 60fps that is under a
//   second and invisible. Below ~2fps, spec 37's settle() can see two consecutive identical samples
//   simply because NO FRAME RENDERED between them, return "converged", and measure a pose still in
//   flight. That is how the camera came to rest at -4.69565 against a canonical -4.7.
//   AFTER v1.14.587 the factor is time-based and a 1.6s deadline sets the pose exactly however few
//   frames arrived, so ONE frame at this rate is enough.
//
// ⚠ THE THROTTLE IS INSTALLED LATE, ON PURPOSE. Boot, the aisle, and the walk drag all need normal
// frames; only the walk EXIT is starved. Throttling from page start would fail setup and prove
// nothing about the pose.
// ────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');
const { SITE_HOSTS_ROWS, CUTSHEET_ROWS } = require('./data/us-spk03-rows');

// ── helpers, same shape as 37 so the two specs measure the same thing ──────────
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

// Capture the live camera by wrapping the renderer, exactly as 37 does.
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
  const fwd = new window.THREE.Vector3();
  c.getWorldDirection(fwd);
  return {
    pos: { x: +c.position.x.toFixed(5), y: +c.position.y.toFixed(5), z: +c.position.z.toFixed(5) },
    fwd: { x: +fwd.x.toFixed(5), y: +fwd.y.toFixed(5), z: +fwd.z.toFixed(5) },
    frames: window.__throttleFrames || 0,
  };
});

// Same stability rule as 37: two consecutive identical samples. Deliberately unchanged — this spec
// must be able to catch the SAME early-return that 37 hit, not paper over it.
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

/**
 * Replace requestAnimationFrame with a fixed-interval timer.
 *
 * ⭐ 1000ms is chosen, not guessed. settle() polls every 500ms and returns after TWO identical
 * samples, so a frame interval above 500ms guarantees poll pairs that span zero frames — which is
 * exactly the condition that let a mid-flight pose read as "converged" in the wild. It also makes
 * the two code paths diverge cleanly: the old frame-counted ease needs ~56 frames (~56s here, well
 * past settle's 40s budget), while the time-based ease plus its 1.6s deadline lands on the FIRST
 * frame. Deterministic in both directions.
 */
const starveFrames = (page, intervalMs = 1000) => page.evaluate((ms) => {
  if (window.__throttled) return;
  window.__throttled = true;
  window.__throttleFrames = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    return window.setTimeout(function () {
      window.__throttleFrames++;
      cb(performance.now());
    }, ms);
  };
  window.__restoreFrames = function () { window.requestAnimationFrame = raf; window.__throttled = false; };
}, intervalMs);

test.describe('the locked pose lands exactly, however few frames arrive', () => {

  test('⛔ leaving WALK with a starved frame budget still lands the canonical pose', async ({ phantom, page }) => {
    test.setTimeout(300_000);
    await phantom.boot();
    await instrument(page);
    await openAisle(page);

    const locked = await settle(page);
    expect(locked, 'the aisle never produced a camera to measure').not.toBeNull();

    // Free the camera and move it somewhere lock would never put it — normal frame rate, because
    // the drag needs frames to register.
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
    expect(Math.abs(wandered.fwd.x) + Math.abs(wandered.fwd.y),
      'walk mode did not actually free the camera, so the return proves nothing').toBeGreaterThan(0.01);

    // ── THE CONDITION UNDER TEST ──────────────────────────────────────────────
    await starveFrames(page, 1000);

    // Leave walk. From here the app gets roughly one frame per second.
    await page.evaluate(() => document.getElementById('walkBtn').click());
    const back = await settle(page);

    expect(back.frames,
      'the throttle never took effect, so the frame budget was never actually starved').toBeGreaterThan(0);

    // The ruling, unchanged and NOT loosened: the pose landed on must be the canonical one.
    expect(Math.abs(back.fwd.x),
      `starved of frames, leaving walk left the camera yawed (fwd.x ${back.fwd.x}, frames ${back.frames})`)
      .toBeLessThan(1e-4);
    expect(Math.abs(back.fwd.y),
      `starved of frames, leaving walk left the camera pitched (fwd.y ${back.fwd.y}, frames ${back.frames})`)
      .toBeLessThan(1e-4);
    expect(back.pos.y, 'starved of frames, the canonical height was not restored').toBeCloseTo(locked.pos.y, 5);
    expect(back.pos.z, 'starved of frames, the canonical distance was not restored').toBeCloseTo(locked.pos.z, 5);
  });
});

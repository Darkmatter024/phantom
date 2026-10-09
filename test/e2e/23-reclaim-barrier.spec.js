// ─────────────────────────────────────────────────────────────────────────────
// 23 — THE RECLAIM BARRIER (M2-b stage 2 · RACKENGINE-SPEC §6, invariant I6)
//
// "No context is acquired in the same task as a release." Not a retry, not a timeout — an
// ORDERING guarantee.
//
// WHAT WAS WRONG, read from the ordering rather than measured. Both renderers ACQUIRED before they
// RELEASED: rackElevation_render3D constructed its WebGLRenderer ~1200 lines before calling
// register(), and register() is what runs releaseOthers(). So on a cross-host handoff — Build →
// Aisle is exactly that shape — the new context was taken while the other host's was still live.
// I1 held AFTER register ran, never at the instant of acquisition.
//
// ⚠ CLAIM DISCIPLINE, kept in the test file because it is where someone will read it: the ordering
// is CERTAIN and is what this pins. A field failure caused by it is NOT proven — desktop tolerates
// two live contexts — and this must not be cited as the explanation for the historical blank-rack
// arcs. What is fixed here is a stated invariant that was not actually held.
//
// These tests drive the ENGINE directly rather than through a GPU renderer, on purpose: the
// ordering guarantee is engine behaviour and must be provable on a runner with no usable WebGL,
// where the renderer paths skip. The renderer wiring is asserted separately, from source.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const reset = (page) => page.evaluate(() => {
  RackEngine._barrier = false;
  RackEngine._pending = null;
  RackEngine._barrierStats = { armed: 0, deferred: 0, collapsed: 0 };
});

test.describe('the reclaim barrier', () => {

  test('with no barrier armed, an acquisition proceeds IMMEDIATELY', async ({ phantom, page }) => {
    await phantom.boot();
    await reset(page);
    const r = await page.evaluate(() => {
      let ran = false;
      const may = RackEngine.acquireOrDefer(() => { ran = true; });
      return { may, ran, report: RackEngine.barrierReport() };
    });
    // A cold device released nothing, so nothing waits. Arming unconditionally would put two
    // frames in front of every first render for a reclaim that never happened.
    expect(r.may, 'a cold acquisition was deferred').toBe(true);
    expect(r.report.armed).toBe(false);
    expect(r.report.counts.deferred).toBe(0);
  });

  test('once armed, an acquisition is DEFERRED and then runs on its own', async ({ phantom, page }) => {
    await phantom.boot();
    await reset(page);
    const deferred = await page.evaluate(() => {
      window.__ran = false;
      RackEngine._armBarrier();
      const may = RackEngine.acquireOrDefer(() => { window.__ran = true; });
      return { may, ranImmediately: window.__ran, armed: RackEngine.barrierReport().armed };
    });
    expect(deferred.may, 'the acquisition was allowed through an armed barrier').toBe(false);
    expect(deferred.ranImmediately, 'the deferred acquisition ran in the SAME task as the release').toBe(false);
    expect(deferred.armed).toBe(true);

    // …and it must actually happen, not be dropped. A barrier that strands work is worse than none.
    await expect
      .poll(async () => page.evaluate(() => window.__ran), { timeout: 5_000, message: 'the deferred acquisition never ran' })
      .toBe(true);
    const after = await page.evaluate(() => RackEngine.barrierReport());
    expect(after.armed, 'the barrier never came down').toBe(false);
    expect(after.pending, 'a pending acquisition was left behind').toBe(false);
  });

  test('⛔ ONLY ONE PENDING ACQUISITION — rapid navigation collapses to the LAST request', async ({ phantom, page }) => {
    await phantom.boot();
    await reset(page);
    // ⚠ Arm and defer, then RETURN — do not await inside the evaluate. rAF is throttled while a
    // page.evaluate is blocked, so waiting in-page never lets the barrier fire and the test
    // measures the harness rather than the engine. (Cost one failure to find.)
    const mid = await page.evaluate(() => {
      window.__order = [];
      RackEngine._armBarrier();
      RackEngine.acquireOrDefer(() => window.__order.push('first'));
      RackEngine.acquireOrDefer(() => window.__order.push('second'));
      RackEngine.acquireOrDefer(() => window.__order.push('third'));
      const rep = RackEngine.barrierReport();
      return { collapsed: rep.counts.collapsed, deferred: rep.counts.deferred };
    });
    await expect
      .poll(async () => page.evaluate(() => window.__order.length), { timeout: 5_000 })
      .toBeGreaterThan(0);

    // Queueing N allocations is how one refusal becomes a pile-up. Three requests, ONE acquisition.
    const order = await page.evaluate(() => window.__order);
    expect(order, 'the barrier queued acquisitions instead of collapsing them').toEqual(['third']);
    expect(mid.deferred).toBe(3);
    expect(mid.collapsed, 'collapsing was not recorded in the census').toBe(2);
  });

  test('the barrier takes TWO frames, not one — a single rAF can land in the same frame', async ({ phantom, page }) => {
    await phantom.boot();
    await reset(page);
    const frames = await page.evaluate(async () => {
      let n = 0, releasedAt = -1;
      const tick = () => { n++; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      await new Promise((r) => requestAnimationFrame(r));
      releasedAt = n;
      RackEngine._armBarrier();
      const ranAt = await new Promise((res) => { RackEngine.acquireOrDefer(() => res(n)); });
      return { releasedAt, ranAt };
    });
    // §6: on iOS the GPU-side reclaim from forceContextLoss() is asynchronous and one rAF can still
    // land in the same compositor frame. Two frames (~33ms) is a guarantee rather than a hope.
    expect(frames.ranAt - frames.releasedAt,
      `acquisition landed ${frames.ranAt - frames.releasedAt} frame(s) after the release — the spec requires two`)
      .toBeGreaterThanOrEqual(2);
  });

  test('releaseOthers REPORTS how many it released — the arm condition depends on it', async ({ phantom, page }) => {
    await phantom.boot();
    await reset(page);
    const r = await page.evaluate(() => {
      const mk = () => { const d = document.createElement('div'); document.body.appendChild(d); return d; };
      const a = mk(), b = mk(), c = mk();
      const noop = { dispose: function () {}, pause: function () {}, resume: function () {} };
      RackEngine.register(a, noop, 'rack');
      RackEngine.register(b, noop, 'rack');     // releases a
      const releasedNone = RackEngine.releaseOthers(b);   // b is the only one left
      RackEngine.register(c, noop, 'rack');
      const releasedOne = RackEngine.releaseOthers(a);    // c is live and is not `a`
      return { releasedNone, releasedOne };
    });
    expect(r.releasedNone, 'releaseOthers claimed a release that did not happen').toBe(0);
    expect(r.releasedOne, 'releaseOthers did not report the release it performed').toBe(1);
  });

  test('BOTH renderers release BEFORE they acquire — the ordering, asserted from source', async ({ phantom, page }) => {
    await phantom.boot();
    const src = await page.evaluate(() => ({
      bay: String(rackElevation_render3D),
      aisle: String(forge3d_render),
    }));
    for (const [name, s] of Object.entries(src)) {
      const release = s.indexOf('releaseOthers');
      const acquire = s.indexOf('new THREE.WebGLRenderer');
      expect(release, `${name}: no release before acquisition at all`).toBeGreaterThan(-1);
      expect(acquire, `${name}: could not find the acquisition`).toBeGreaterThan(-1);
      // THE WHOLE INVARIANT IN ONE COMPARISON. Before .434 this was the other way round in both.
      expect(release, `${name} ACQUIRES before it RELEASES — I6 is broken`).toBeLessThan(acquire);
      expect(s, `${name} does not gate its acquisition on the barrier`).toContain('acquireOrDefer');
    }
  });

  test('the barrier cannot deadlock a deferred acquisition', async ({ phantom, page }) => {
    await phantom.boot();
    await reset(page);
    // _armBarrier falls back to a timer when rAF is unavailable — a hidden tab never fires one, and
    // a barrier that strands the pending work forever is worse than no barrier at all.
    const src = await page.evaluate(() => String(RackEngine._armBarrier));
    expect(src, 'no fallback when requestAnimationFrame is unavailable').toContain('setTimeout');
    expect(src).toContain('requestAnimationFrame');
  });
});

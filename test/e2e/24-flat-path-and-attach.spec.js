// ─────────────────────────────────────────────────────────────────────────────
// 24 — THE FLAT PATH, DEMOTION, AND THE DOOR (M2-b stages 3a + 3b · §2 / §4 / §5)
//
// §4 has TWO axes: `mode` chooses the rig and which controls render; `interactive` chooses WebGL
// versus flat. "A bay that cannot get a context is still a bay, rendered flat, not an error
// screen." The engine had no flat path at all, which is why `map`, `review` and `hero` — all
// interactive:false by spec — were unrepresentable, and why §5's demote could not exist: there was
// nowhere to demote TO.
//
// ⛔ THIS SPEC ALSO PINS WHAT IS DELIBERATELY *NOT* BACKED, because a half-built door that claims
// more than it does is the failure this project keeps paying for:
//   · view state is NOT preserved across demote — the camera lives inside the disposed scene
//   · update() on an INTERACTIVE attachment refuses rather than silently rebuilding
//   · attach() will not create an interactive attachment; the renderers still own that
// Each of those is asserted as a REFUSAL, so the day one becomes real the test fails and says so.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const seed = (page) => page.evaluate(() => {
  const racks = {};
  for (let r = 1; r <= 3; r++) {
    const id = 'l1:' + String(r).padStart(3, '0');
    racks[id] = { cabId: id, locode: 'ALP-01', cablesOut: [], cablesIn: [], hosts: [
      { locCabRu: id + ':42', dns: id + '-sw', model: 'SN2201', source: 'SITE_HOSTS' },
      { locCabRu: id + ':35', dns: id + '-node', model: 'HGX-H100', source: 'SITE_HOSTS' } ] };
  }
  PHANTOM_MASTER.replace({ racksByCab: racks, siteCode: 'ALP-01', sourceFile: 'FLAT.xlsx',
    sourceFileHash: 'flat', stats: { sourceFileHash: 'flat', totalCables: 0 } });
  const h = document.createElement('div');
  h.id = 'flat-host'; h.style.cssText = 'width:320px;height:400px';
  document.body.appendChild(h);
});

const glCount = (page) => page.evaluate(() => Array.prototype.filter.call(
  document.querySelectorAll('canvas'), (cv) => {
    let g = null; try { g = window.phantom_readGL ? window.phantom_readGL(cv) : null; } catch (_) {}
    return !!g && !(g.isContextLost && g.isContextLost());
  }).length);

test.describe('the flat path, demotion, and the door', () => {

  test('3a — a rack renders FLAT with no GL context at all (I7)', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const before = await glCount(page);
    const r = await page.evaluate(() => {
      const host = document.getElementById('flat-host');
      const ok = RackEngine.renderFlat(host, 'l1:001');
      return { ok, html: host.innerHTML.length, canvases: host.querySelectorAll('canvas').length,
               rackId: host._rm3dRackId };
    });
    expect(r.ok, 'the flat renderer refused').toBe(true);
    expect(r.html, 'the flat renderer produced nothing').toBeGreaterThan(100);
    // I7 — a non-interactive presentation holds no WebGL context, EVER.
    expect(r.canvases, 'the flat path created a canvas').toBe(0);
    expect(await glCount(page), 'the flat path took a GL context').toBe(before);
    expect(r.rackId).toBe('l1:001');
  });

  test('3b — attach creates a FLAT attachment and the census says which rack and which mode', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const r = await page.evaluate(() => {
      const h = RackEngine.attach({ host: document.getElementById('flat-host'), rackId: 'l1:002', mode: 'map' });
      const rep = RackEngine.report().filter((a) => a.host === 'flat-host')[0];
      return { hasHandle: !!h, state: h && h.state, rep };
    });
    expect(r.hasHandle).toBe(true);
    expect(r.state.rackId).toBe('l1:002');
    expect(r.state.mode).toBe('map');
    expect(r.state.interactive, 'map is interactive:false by spec').toBe(false);
    // §10 — the census could say neither which rack nor whether a context was held. Now it can.
    expect(r.rep.rackId).toBe('l1:002');
    expect(r.rep.mode).toBe('map');
    expect(r.rep.interactive).toBe(false);
  });

  test('I2 — attach is IDEMPOTENT per host: same rackId returns the same attachment, no rebuild', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const r = await page.evaluate(() => {
      const host = document.getElementById('flat-host');
      RackEngine.attach({ host, rackId: 'l1:001', mode: 'map' });
      const first = RackEngine.report().filter((a) => a.host === 'flat-host').length;
      const marker = {}; RackEngine._find(host).__marker = marker;   // identity witness
      const h2 = RackEngine.attach({ host, rackId: 'l1:001', mode: 'review' });
      const att = RackEngine._find(host);
      return {
        count: RackEngine.report().filter((a) => a.host === 'flat-host').length,
        first, same: att.__marker === marker, mode: h2.state.mode,
      };
    });
    // The whole point of I2: a second attach must not allocate a second attachment.
    expect(r.count, 'attaching twice created two attachments').toBe(1);
    expect(r.first).toBe(1);
    expect(r.same, 'attach REBUILT the attachment instead of returning the existing one').toBe(true);
    expect(r.mode, 'changed params were not applied to the existing handle').toBe('review');
  });

  test('I2 — update() on a FLAT attachment re-renders and allocates NOTHING', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const before = await glCount(page);
    const r = await page.evaluate(() => {
      const host = document.getElementById('flat-host');
      const h = RackEngine.attach({ host, rackId: 'l1:001', mode: 'map' });
      const n1 = RackEngine.report().length;
      const ok = h.update();
      return { ok, n1, n2: RackEngine.report().length, html: host.innerHTML.length };
    });
    expect(r.ok, 'update refused on a flat attachment').toBe(true);
    expect(r.n2, 'update allocated a new attachment — a data change must never allocate').toBe(r.n1);
    expect(await glCount(page), 'update took a GL context').toBe(before);
    expect(r.html).toBeGreaterThan(100);
  });

  test('§5 — DEMOTION IS NOT DISPOSAL: the surface keeps rendering and stays in the census', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const r = await page.evaluate(() => {
      const host = document.getElementById('flat-host');
      // Stand in for an interactive attachment without needing a GPU on this runner.
      let disposed = false;
      RackEngine.register(host, {
        dispose: function () { disposed = true; RackEngine.unregister(host); },
        pause: function () {}, resume: function () {},
        reacquire: function () { window.__reacquired = true; }
      }, 'rack', 'l1:003');
      const ok = RackEngine.demote(host);
      const att = RackEngine._find(host);
      return { ok, disposed, present: !!att, interactive: att && att.interactive,
               rackId: att && att.rackId, html: host.innerHTML.length,
               barrierArmed: RackEngine.barrierReport().counts.armed > 0 };
    });
    expect(r.ok).toBe(true);
    expect(r.disposed, 'demote did not release the context').toBe(true);
    // Not disposal: the rack is still on screen and still in the census, just flat.
    expect(r.present, 'demote removed the attachment — the census lost a rack that is still visible').toBe(true);
    expect(r.interactive).toBe(false);
    expect(r.rackId).toBe('l1:003');
    expect(r.html, 'demote left an empty host').toBeGreaterThan(100);
    // I6 — a release ALWAYS arms the barrier, including this one.
    expect(r.barrierArmed, 'demote released a context without arming the barrier').toBe(true);
  });

  test('§5 — promote goes through the BARRIER, never around it', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const r = await page.evaluate(() => {
      const host = document.getElementById('flat-host');
      window.__reacquired = false;
      RackEngine._pushFlat(host, 'l1:001', 'bay', function () { window.__reacquired = true; });
      RackEngine._armBarrier();                     // pretend a release just happened
      const ok = RackEngine.promote(host);
      return { ok, immediately: window.__reacquired };
    });
    expect(r.ok).toBe(true);
    expect(r.immediately, 'promote re-acquired in the SAME task as a release — I6 broken').toBe(false);
    await expect.poll(async () => page.evaluate(() => window.__reacquired), { timeout: 5_000 }).toBe(true);
  });

  test('⛔ promote with no reacquire REFUSES VISIBLY rather than pretending', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const warns = [];
    page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()); });
    const ok = await page.evaluate(() => {
      const host = document.getElementById('flat-host');
      RackEngine._pushFlat(host, 'l1:001', 'bay', null);
      return RackEngine.promote(host);
    });
    // §9 — degrade visibly. A control that silently does nothing is the defect, not the guard.
    expect(ok).toBe(false);
    expect(warns.join(' '), 'promote failed silently').toMatch(/staying flat/i);
  });

  test('⛔ THE REFUSALS — what 3a/3b deliberately do NOT do', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const r = await page.evaluate(() => {
      const host = document.getElementById('flat-host');
      // 1. attach cannot CREATE an interactive attachment — the renderers still own that (3d).
      const interactive = RackEngine.attach({ host, rackId: 'l1:001', mode: 'bay', interactive: true });
      // 2. update() on an interactive attachment refuses rather than silently rebuilding, which
      //    would break I2 while appearing to honour it.
      RackEngine.register(host, { dispose: function () { RackEngine.unregister(host); },
        pause: function () {}, resume: function () {} }, 'rack', 'l1:001');
      const h = RackEngine._handle(RackEngine._find(host));
      return { interactive, updated: h.update() };
    });
    expect(r.interactive, 'attach created an interactive attachment it cannot build').toBeNull();
    expect(r.updated, 'update claimed to mutate an interactive scene in place').toBe(false);
  });
});

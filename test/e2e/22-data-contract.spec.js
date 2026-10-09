// ─────────────────────────────────────────────────────────────────────────────
// 22 — THE DATA CONTRACT (M2-b stage 1 · RACKENGINE-SPEC §7, invariants I8 + I9)
//
// "Callers pass rackId. The engine resolves."
//
// WHAT WAS WRONG. Six call sites each did their own `racksByCab[id]` lookup and handed a rack
// OBJECT to master_rackToElevation — and master_renderHit handed a hand-made `{ hosts: … }`
// instead of the record. Two shapes for one concept, with nothing forcing them to agree: the
// reshape divergence §7 exists to end.
//
// ⛔ SCOPE IS STAGE 1 ONLY. attach, the reclaim barrier (I6), modes and the §8 deletions are NOT
// here. §8 ends by deleting forge3d_render as a separate renderer, in the subsystem that cost
// eight ships to stabilise and where .427 fixed a live defect — that is not a same-ship change.
//
// ⭐ WHY NORMALISING IN THE RESOLVER IS SAFE AT ALL: Vocabulary.typeOf is IDEMPOTENT, pinned three
// levels deep for all eleven codes in spec 20. The flat writer already normalises at .429, so a
// value passing through both is unchanged. Without that guarantee this would double-map and
// silently downgrade real gear to 'unknown'.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const seed = (page) => page.evaluate(() => {
  const racks = {
    // populated, mixed RAW codes so normalisation is observable
    'l1:001': { cabId: 'l1:001', locode: 'ALP-01', cablesOut: [], cablesIn: [], hosts: [
      { locCabRu: 'l1:001:42', dns: 'sw-01',   model: 'SN2201',  source: 'SITE_HOSTS' },
      { locCabRu: 'l1:001:35', dns: 'node-01', model: 'HGX-H100', source: 'SITE_HOSTS' },
    ] },
    // present in the Master, no devices — the ~42% case before .424, and STILL a real rack
    'l1:002': { cabId: 'l1:002', locode: 'ALP-01', cablesOut: [], cablesIn: [], hosts: [] },
  };
  PHANTOM_MASTER.replace({ racksByCab: racks, siteCode: 'ALP-01', sourceFile: 'DC.xlsx',
    sourceFileHash: 'dc', stats: { sourceFileHash: 'dc', totalCables: 0 } });
});

test.describe('the data contract — callers pass a rackId', () => {

  test('I8 — _resolve takes an ID and returns the contract shape', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const r = await page.evaluate(() => RackEngine._resolve('l1:001'));
    expect(r.id).toBe('l1:001');
    expect(r.source).toBe('master');
    expect(r.dataState).toBe('populated');
    expect(r.units, 'units is the rack height in U').toBeGreaterThan(0);
    expect(Array.isArray(r.devices)).toBe(true);
    expect(r.devices.length).toBe(2);
    const d = r.devices[0];
    for (const k of ['u', 'height', 'type', 'label', 'hostname', 'status']) {
      expect(d, `the contract is missing ${k}`).toHaveProperty(k);
    }
  });

  test('I9 — no RAW code survives the resolver, checked against the vocabulary itself', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const bad = await page.evaluate(() =>
      RackEngine._resolve('l1:001').devices
        .map((d) => d.type)
        .filter((t) => !Vocabulary.isDisplayKey(t)));
    expect(bad, `RAW codes reached the contract: ${JSON.stringify(bad)}`).toEqual([]);
  });

  test('normalising twice is a no-op — the resolver and the .429 writer can both run', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const stable = await page.evaluate(() =>
      RackEngine._resolve('l1:001').devices.every((d) => Vocabulary.typeOf(d.type) === d.type));
    expect(stable, 'a resolved type changes when normalised again — double-mapping would erase device classes').toBe(true);
  });

  test('R-06 — an EMPTY rack and an UNKNOWN rack are different answers', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const r = await page.evaluate(() => ({
      empty: RackEngine._resolve('l1:002'),
      unknown: RackEngine._resolve('l9:999'),
    }));
    // A zero-component rack is a VALID rack state, not a missing-rack state. Collapsing these two
    // into one "nothing here" is what made an honest empty cab read as corruption twice.
    expect(r.empty.source).toBe('master');
    expect(r.empty.dataState).toBe('empty');
    expect(r.unknown.source).toBe('standalone');
    expect(r.unknown.dataState).toBe('unassigned');
  });

  test('⛔ .elevation is NEVER undefined — on any path', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    // Callers consume `_resolve(id).elevation` directly. Handing one of them undefined would be a
    // silent failure inside a renderer.
    const shapes = await page.evaluate(() => ['l1:001', 'l1:002', 'l9:999', '', null].map((id) => {
      const e = RackEngine._resolve(id).elevation;
      return { id: String(id), ok: !!e && Array.isArray(e.slots) };
    }));
    for (const s of shapes) expect(s.ok, `elevation was not an object for id "${s.id}"`).toBe(true);
  });

  test('THE RESHAPE DIVERGENCE IS GONE — master_renderHit asks for an id like everyone else', async ({ phantom, page }) => {
    await phantom.boot();
    const src = await page.evaluate(() => String(master_renderHit));
    expect(src, 'master_renderHit still hand-builds a rack object').not.toContain('{ hosts: mHit.hosts }');
    expect(src, 'master_renderHit does not go through the resolver').toContain('_resolve');
  });

  test('the resolver WRAPS the canonical shaper rather than re-implementing it', async ({ phantom, page }) => {
    await phantom.boot();
    const src = await page.evaluate(() => String(RackEngine._resolve));
    // Re-implementing U extraction, height-unknown stamping or the totalU floor here would be the
    // second-door mistake .431 already cost a ship to.
    expect(src, 'the resolver does not call master_rackToElevation').toContain('master_rackToElevation');
    expect(src, 'the resolver re-implements U extraction').not.toContain('master_extractRu');
    expect(src, 'the resolver re-implements height logic').not.toContain('master_nodeHeightInfo');
  });

  test('the routed call sites still render — the Command hero resolves by id', async ({ phantom, page }) => {
    await phantom.boot();
    await seed(page);
    const elev = await page.evaluate(() => {
      const m = PHANTOM_MASTER.active();
      const keys = Object.keys(m.racksByCab);
      return RackEngine._resolve(keys[0]).elevation;
    });
    expect(elev.id).toBe('l1:001');
    expect(elev.slots.length, 'the wrapped shaper stopped producing slots').toBe(2);
    expect(elev.totalU, 'the totalU floor was lost in the wrap').toBeGreaterThan(0);
  });
});

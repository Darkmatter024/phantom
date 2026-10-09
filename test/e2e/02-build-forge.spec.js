// Build workspace (#bw-shell / #bw-mount) and the Forge aisle (#forge3d-sheet).
//
// WHY THIS SPEC EXISTS
// The two most expensive field arcs of the last two months both lived here:
//   .337/.338  a display:contents ancestor made a JS-MEASURED WebGL mount invisible;
//   .390→.405  a bounded re-arm in bw_mount3D whose liveness guard asked "is my element
//              still in the DOM" instead of "am I still the visible surface", so a Build
//              retry re-registered and disposed the LIVE aisle through
//              RackEngine.releaseOthers (invariant I1).
// Neither reproduces on WebKit-for-Windows. What IS reproducible, and what this spec pins,
// is the structural layer under them: the host exists, the host MEASURES, repeated entry
// does not multiply hosts or canvases, the engine never holds more than one interactive
// attachment, and the aisle round trip leaves Build intact.
//
// GPU BRANCHING
// Every scene assertion branches on a MEASURED WebGL probe (webglProbe below) taken in the
// live page, per test — never on an assumption, and never on a module global (Playwright
// discards the worker after a failed test, which would silently reset one). Which branch
// ran is printed by the first test. On a runner with no context, the scene assertions skip
// with a stated reason and the app's HONEST FALLBACK is asserted instead — bw_mount3D's
// say() path, which states the failure on the card rather than leaving a blank box
// (dct-ios.html:20808).
//
// LOCAL HELPERS
// test/e2e/fixtures.js is shared and was NOT modified. Everything below — the deployment
// seed, the Build/Command entry helpers, the WebGL probe, the attachment census and the
// console-noise partition in the round-trip test — is defined in this file on purpose.

const { test, expect, gotoMode } = require('./fixtures');

// ── Storage seed ────────────────────────────────────────────────────────────────
// bw_render() (:20424) ROUTES before it ever builds the preview:
//   no master && no deployment -> "No Master loaded" card, RETURN  (no #bw-mount)
//   deployment but no rack     -> rack queue card, RETURN          (no #bw-mount)
//   an active rack             -> the full workspace, #bw-mount at :20579
// So a spec that wants the mount must seed a deployment WITH a rack. Key names and record
// shapes are copied from the app's own writers, never invented:
//   DEPLOY_KEY :22850 · DEPLOY_RACKS_KEY :22851 · DEPLOY_PHASES_KEY :22852
//   record shapes: deploy_seedRacksAndPhases() :29301
//   ACTIVE_DEPLOYMENT_KEY :27532 holds a RAW string (deploy_setActive :27562), not JSON.
const DEPLOY_KEY = 'phantom_deployments_v1';
const RACKS_KEY = 'phantom_deploy_racks_v1';
const PHASES_KEY = 'phantom_deploy_phases_v1';
const ACTIVE_KEY = 'phantom_active_deployment';

const DEP_ID = 'dep_e2e_build';
const RACK_ROW_ID = 'rack_e2e_build_0';
const PHASE_TYPES = ['mechanical', 'power', 'network', 'compute', 'validation']; // :28645

function buildSeed() {
  const now = 1750000000000;
  const dep = {
    id: DEP_ID, name: 'E2E BUILD', status: 'active', buildLead: 'E2E',
    created: now, updated: now, createdAt: now, updatedAt: now,
    rackCount: 1, phaseCount: PHASE_TYPES.length,
  };
  // rack.slots drives rackElevation_render3D's tray geometry (:35473). Eight 4U trays is
  // enough geometry to be a real scene without the seed becoming a fixture of its own.
  const slots = [];
  for (let i = 0; i < 8; i++) {
    slots.push({
      uStart: 1 + i * 5, uEnd: 4 + i * 5, type: 'gpu',
      name: 'e2e-gpu-' + (i + 1), dns: 'e2e-gpu-' + (i + 1), model: 'HGX', status: 'pending',
    });
  }
  const rack = {
    id: RACK_ROW_ID, deploymentId: DEP_ID, rackId: 'E2E-R01', room: 'HALL-1',
    totalU: 42, slots, notes: '', powerCircuits: [], currentPhase: 'mechanical',
    hosts: [{ dns: 'e2e-gpu-1', platform: 'HGX-E2E', type: 'gpu', installed: true }],
  };
  const phases = PHASE_TYPES.map((t, i) => ({
    id: 'phase_' + RACK_ROW_ID + '_' + t, deploymentId: DEP_ID, rackId: RACK_ROW_ID,
    type: t, seqOrder: i + 1,
    status: i === 0 ? 'in_progress' : 'pending',
    tasksTotal: 0, tasksDone: 0, signedOffBy: null, signedOffAt: null,
    _gateOverride: false, _notes: '',
  }));
  return {
    [DEPLOY_KEY]: JSON.stringify([dep]),
    [RACKS_KEY]: JSON.stringify([rack]),
    [PHASES_KEY]: JSON.stringify(phases),
    [ACTIVE_KEY]: DEP_ID,
    phantom_manifest_last_deploy: DEP_ID,
  };
}

// ── WebGL capability probe ───────────────────────────────────────────────────────
// Measured on a THROWAWAY canvas in the harness browser. The context is handed straight
// back via WEBGL_lose_context so the probe never competes with the app for the one context
// iOS grants — the same discipline the app itself applies in phantom_webglCapable (:35361).
// Taken PER TEST: a module-level cache would be silently reset by Playwright's post-failure
// worker restart, which would flip every branch to "no GPU" and fabricate skips.
// Two DIFFERENT questions, deliberately reported separately:
//   contextOk  — did getContext hand back a context at all? (what phantom_webglCapable
//                :35361 asks, and the only thing it asks)
//   rendererOk — can a real renderer be BUILT on it? three.js's WebGLCapabilities calls
//                getShaderPrecisionFormat(...).precision, and a GPU process that grants a
//                context it cannot service returns NULL there, so the THREE.WebGLRenderer
//                constructor throws. Measured on this runner: contextOk true, rendererOk
//                intermittently false. Asking only the first question is how you conclude
//                "the device supports WebGL" in the same breath as "context REFUSED".
async function webglProbe(page) {
  return page.evaluate(() => {
    const out = { contextOk: false, rendererOk: false, type: null, renderer: null, note: '' };
    try {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const gl = c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) { out.note = 'getContext returned null for webgl2, webgl and experimental-webgl'; return out; }
      out.contextOk = true;
      out.type = gl.constructor && gl.constructor.name;
      try {
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        out.renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      } catch (_) { /* the renderer string is a nicety, not the answer */ }
      try {
        const p = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
        out.rendererOk = !!(p && typeof p.precision === 'number' && p.precision > 0);
        if (!out.rendererOk) {
          out.note = 'context granted but getShaderPrecisionFormat(VERTEX_SHADER, HIGH_FLOAT) is ' +
            'unusable — THREE.WebGLRenderer cannot be constructed here';
        }
      } catch (e) { out.note = 'getShaderPrecisionFormat threw: ' + (e && e.message); }
      try { const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); } catch (_) {}
      c.width = 0; c.height = 0;
    } catch (e) { out.note = 'threw: ' + (e && e.message); }
    return out;
  });
}

// ── Terminal state of the Build rack preview ─────────────────────────────────────
// bw_mount3D has exactly two honest endings and no third:
//   'canvas'  the renderer built and a <canvas> is in #bw-mount
//   'stated'  say() (:20808) wiped the mount and wrote a message + a .bw-diag line
// Anything else — an empty box that never resolves — is the silent blank this whole
// subsystem exists to make impossible. Poll for a TERMINAL state, never for a duration.
async function buildPreviewOutcome(page, timeoutMs = 45_000) {
  let out = { state: 'pending' };
  await expect
    .poll(async () => {
      out = await page.evaluate(() => {
        const m = document.getElementById('bw-mount');
        if (!m) return { state: 'no-mount' };
        if (m.querySelector('canvas')) return { state: 'canvas' };
        const d = m.querySelector('.bw-diag');
        if (d) {
          const p = m.querySelector('.bw-zero-p');
          return { state: 'stated', diag: d.textContent || '', msg: (p && p.textContent) || '' };
        }
        return { state: 'pending' };
      });
      return out.state;
    }, {
      timeout: timeoutMs,
      message: '#bw-mount never reached a terminal state — no canvas and no stated failure, ' +
        'which is a SILENT BLANK: the exact symptom of the .390 blank-rack arc',
    })
    .not.toBe('pending');
  return out;
}

// Same terminal-state wait, but re-enters Build up to `attempts` times while the outcome is
// the stated FAILURE. This exists for one measured reason and no other: on this runner the
// GPU process reclaims a context ASYNCHRONOUSLY, so a scene test that runs immediately after
// another scene test can be refused a renderer that is available a few seconds later. It does
// not weaken anything — the assertions after it are unchanged, the honest-fallback assertions
// live in their own test that does NOT retry, and if every attempt fails the caller still
// skips with the app's own diagnostic rather than passing.
async function buildPreviewOutcomeWithReentry(page, attempts = 3) {
  let out = await buildPreviewOutcome(page);
  for (let i = 1; i < attempts && out.state === 'stated'; i++) {
    await enterCommand(page);
    await enterBuild(page);
    out = await buildPreviewOutcome(page);
  }
  return out;
}

// ── Doors ────────────────────────────────────────────────────────────────────────
// The real door: the bottom-nav Build slot, which calls showMode('work') (:18786), which
// calls bw_render() (:18815). Never call the function directly — a test that bypasses the
// door cannot catch a dead door.
async function enterBuild(page) {
  await gotoMode(page, 'work');   // bottom nav below 1024, desktop rail above - one door
  await expect(page.locator('#bw-shell')).toBeVisible();
  await page.locator('#bw-mount').waitFor({ state: 'visible', timeout: 15_000 });
}

async function enterCommand(page) {
  await gotoMode(page, 'command');
  await expect(page.locator('#pg-cmd')).toBeVisible();
}

// ── Attachment census ────────────────────────────────────────────────────────────
// Discovered by reading the app, not guessed. RackEngine (:35161) is the lifecycle owner
// since v1.14.401 and RackEngine.report() (:35245) returns
//   [{ host, kind, paused, connected }]
// PhantomGL (:35334) is the non-allocating observer that wraps it and also reports
// { canvases, owners, attachments }. Both are exported on window (:35252, :35349).
async function census(page) {
  return page.evaluate(() => {
    const out = { engineMissing: false, attachments: null, gl: null, err: null };
    try {
      if (typeof window.RackEngine !== 'object' || !window.RackEngine) { out.engineMissing = true; return out; }
      out.attachments = window.RackEngine.report();
      if (typeof window.PhantomGL === 'object' && window.PhantomGL) out.gl = window.PhantomGL.report();
    } catch (e) { out.err = String(e && e.message); }
    return out;
  });
}

// ── Environment noise: named, partitioned LOCALLY, and reported ──────────────────
// NOTHING was added to fixtures.js's shared BENIGN_CONSOLE. Every entry in that list weakens
// every spec in the suite; both entries below are environment differences between this runner
// and the field device, and both are reported to the owner rather than buried.
//
// 1. CROSS-ORIGIN API HEALTH PROBE. phantomCheckApi() (:50945) fires 500ms after init
//    (:18248) and OPTIONS-probes the Cloudflare Worker at :17657. The Worker enforces an
//    Origin allowlist that is the GitHub Pages origin BY DESIGN, so the 127.0.0.1 harness
//    origin is correctly rejected. WebKit reports it as a CORS console error; Chromium adds a
//    second, TEXTLESS line ("Failed to load resource: net::ERR_FAILED") for the same request.
//    A text pattern cannot safely match that second line, so the request is stubbed at the
//    network layer instead (stubHealthProbe below) — the environment difference is removed at
//    source rather than filtered after the fact. The text pattern stays as a backstop for
//    anything the route misses (e.g. a preflight the router does not intercept).
// 2. navigator.vibrate. haptic() (:16397) guards only on the API existing. iOS Safari does
//    not implement navigator.vibrate at all, so on the FIELD DEVICE this is a no-op. Desktop
//    Chromium implements it and then blocks it without a touch gesture, logging a console
//    error. It is a non-touch-tier artifact of a mobile-only API, and the pattern is specific
//    enough that it cannot hide any other regression.
const ENV_NOISE = [
  /phantom-api\.[a-z0-9]+\.workers\.dev|Access-Control-Allow-Origin|access control checks|net::ERR_FAILED/i,
  /Blocked call to navigator\.vibrate/i,
];
const isEnvNoise = (text) => ENV_NOISE.some((re) => re.test(text));

// Answer the health probe the way the ALLOWLISTED production origin does, so the app takes
// the same path here that it takes on Pages. Must be installed before boot() navigates.
async function stubHealthProbe(page) {
  await page.route(/phantom-api\.[a-z0-9]+\.workers\.dev/, (route) =>
    route.fulfill({
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': '*',
      },
      body: '',
    }));
}

test.describe('Build workspace + Forge aisle', () => {
  test('WebGL capability is MEASURED in this browser, not assumed', async ({ phantom, page }) => {
    await phantom.boot({ seed: buildSeed() });
    const gl = await webglProbe(page);

    // This test never fails on the answer — the answer is the input to every other test.
    // It fails only if the probe itself could not run.
    expect(gl, 'the WebGL probe returned nothing').toBeTruthy();
    const branch = gl.rendererOk ? 'GPU-PRESENT' : (gl.contextOk ? 'CONTEXT-ONLY' : 'NO-GPU');
    // eslint-disable-next-line no-console
    console.log(
      `[02-build-forge] WEBGL BRANCH = ${branch} | context=${gl.type} | renderer=${gl.renderer}` +
      (gl.note ? ` | ${gl.note}` : '')
    );
    test.info().annotations.push({
      type: 'webgl-branch',
      description: `${branch} ctx=${gl.type} renderer=${gl.renderer} ${gl.note}`,
    });

    // The app's own cached capability probe must agree with a raw CONTEXT probe. It asks
    // only "did getContext return something" (:35367), so it is compared with contextOk and
    // NOT with rendererOk — comparing it to the wrong question is precisely the .395/.396
    // confusion ("WebGL support: true" in the same breath as "context REFUSED").
    const appSays = await page.evaluate(() =>
      (typeof window.phantom_webglCapable === 'function' ? window.phantom_webglCapable() : 'absent'));
    expect(
      appSays,
      `the app's phantom_webglCapable() (:35361) says ${appSays} but a raw context probe says ${gl.contextOk}`
    ).toBe(gl.contextOk);
  });

  // ── STRUCTURE: true with or without a GPU ──────────────────────────────────────

  test('the Build slot mounts #bw-shell with the real workspace, not the legacy grid', async ({ phantom, page }) => {
    await phantom.boot({ seed: buildSeed() });
    await enterBuild(page);

    // bw_render() marks its own page (:20489) and the CSS that flows from it hides the
    // retired launcher (body.rd #pg-work.bw-on #work-grid{display:none} :54055). Without
    // bw-on the workspace and the launcher would render on top of one another.
    await expect(page.locator('#pg-work')).toHaveClass(/bw-on/);
    await expect(page.locator('#work-grid')).toBeHidden();

    // The workspace is REAL content driven by the seeded rack, not an empty div.
    await expect(page.locator('#bw-shell .bw-hd .bw-t1')).toHaveText('BUILD');
    await expect(page.locator('#bw-shell .bw-rack')).toHaveText('E2E-R01');
    // The aisle door exists and is a real <button> (:20569).
    await expect(page.locator('#bw-shell button.bw-aisle')).toHaveText('Open aisle');
  });

  test('#bw-mount exists and MEASURES non-zero — the display:contents / wiped-host guard', async ({ phantom, page }) => {
    await phantom.boot({ seed: buildSeed() });
    await enterBuild(page);

    const mount = page.locator('#bw-mount');
    await expect(mount).toHaveCount(1);

    // THE assertion. Every renderer in this app measures its host with clientWidth /
    // clientHeight (bw_mount3D :20945, rackElevation_render3D :35447) and draws nothing
    // when either is 0 — silently, with no exception and no console error. A
    // display:contents ancestor, a collapsed grid area and a wiped host class all present
    // as exactly this and as nothing else.
    const box = await page.evaluate(() => {
      const m = document.getElementById('bw-mount');
      const r = m.getBoundingClientRect();
      const cs = getComputedStyle(m);
      const parent = m.parentElement;
      return {
        w: Math.round(r.width), h: Math.round(r.height),
        clientW: m.clientWidth, clientH: m.clientHeight,
        display: cs.display, visibility: cs.visibility,
        offsetParentNull: m.offsetParent === null,
        parentDisplay: parent ? getComputedStyle(parent).display : null,
      };
    });
    expect(box.clientW, `#bw-mount clientWidth is 0 — nothing can draw into it. ${JSON.stringify(box)}`).toBeGreaterThan(0);
    expect(box.clientH, `#bw-mount clientHeight is 0 — nothing can draw into it. ${JSON.stringify(box)}`).toBeGreaterThan(0);
    // offsetParent is what rackElevation_render3D's retry gate reads (:35462). A null
    // offsetParent aborts the render even when the box measures.
    expect(box.offsetParentNull, `#bw-mount has a null offsetParent — render3D aborts on this. ${JSON.stringify(box)}`).toBe(false);
    // display:contents on the mount or its host erases the measured box on iOS (.337/.338).
    expect(box.display, 'the measured mount must be a real box').not.toBe('contents');
    expect(box.parentDisplay, 'the mount host must be a real box').not.toBe('contents');

    await phantom.assertNoHorizontalOverflow();
  });

  test('ten Build entries leave exactly one #bw-mount and do not multiply canvases', async ({ phantom, page }) => {
    // 20 full mode switches, each tearing down and rebuilding a WebGL scene, measured at
    // ~4s per Build/Command round on this runner. The 45s project default is a cold-boot
    // budget, not a 20-navigation budget. Raised here only, in this file, for this test.
    test.setTimeout(180_000);

    await phantom.boot({ seed: buildSeed() });
    await enterBuild(page);

    const after1 = await page.evaluate(() => ({
      mounts: document.querySelectorAll('#bw-mount').length,
      shellCanvases: document.querySelectorAll('#bw-shell canvas').length,
      docCanvases: document.querySelectorAll('canvas').length,
    }));

    for (let i = 0; i < 10; i++) {
      await enterCommand(page);
      await enterBuild(page);
    }

    const after10 = await page.evaluate(() => ({
      mounts: document.querySelectorAll('#bw-mount').length,
      shells: document.querySelectorAll('#bw-shell').length,
      shellCanvases: document.querySelectorAll('#bw-shell canvas').length,
      docCanvases: document.querySelectorAll('canvas').length,
      strips: document.querySelectorAll('#bw-strip').length,
    }));

    // bw_render() rebuilds the workspace from scratch on every entry (host.textContent = ''
    // :20434). A surviving stale mount would mean an orphaned rAF drawing into a detached
    // node for the rest of a shift — the drain RackEngine's I4 exists to stop.
    expect(after10.mounts, 'a repeated Build entry left more than one #bw-mount').toBe(1);
    expect(after10.shells, 'a repeated Build entry duplicated #bw-shell').toBe(1);
    expect(after10.strips, 'a repeated Build entry duplicated the #bw-strip control host').toBe(1);
    expect(
      after10.shellCanvases,
      `Build canvases grew across 10 entries: ${after1.shellCanvases} -> ${after10.shellCanvases}`
    ).toBeLessThanOrEqual(1);
    // Document-wide: the Command hero and the boot canvas may exist, but the count must not
    // TRACK the number of entries.
    expect(
      after10.docCanvases,
      `document canvas count grew with Build entries: ${after1.docCanvases} -> ${after10.docCanvases}`
    ).toBeLessThanOrEqual(after1.docCanvases + 1);

    // And the engine still holds at most one live attachment after 20 switches.
    const c = await census(page);
    expect(c.attachments.length, `I1 broken after 10 entries: ${JSON.stringify(c.attachments)}`).toBeLessThanOrEqual(1);
  });

  test('RackEngine never holds more than one interactive attachment', async ({ phantom, page }) => {
    await phantom.boot({ seed: buildSeed() });

    const engine = await page.evaluate(() => ({
      hasEngine: typeof window.RackEngine === 'object' && !!window.RackEngine,
      hasReport: !!(window.RackEngine && typeof window.RackEngine.report === 'function'),
      hasActive: !!(window.RackEngine && typeof window.RackEngine.active === 'function'),
      hasGL: typeof window.PhantomGL === 'object' && !!window.PhantomGL,
    }));
    // The census instrument is part of the contract (RACKENGINE-SPEC §5). If it disappears,
    // the app loses the only honest answer to "what is live right now".
    expect(engine.hasEngine, 'window.RackEngine is gone — the lifecycle owner (:35161)').toBe(true);
    expect(engine.hasReport, 'RackEngine.report() is gone — the attachment census (:35245)').toBe(true);
    expect(engine.hasActive, 'RackEngine.active() is gone (:35243)').toBe(true);
    expect(engine.hasGL, 'window.PhantomGL is gone — the non-allocating observer (:35334)').toBe(true);

    await enterBuild(page);
    let c = await census(page);
    expect(c.err, `RackEngine.report() threw: ${c.err}`).toBeNull();
    expect(c.attachments.length, `I1 broken in Build: ${JSON.stringify(c.attachments)}`).toBeLessThanOrEqual(1);

    // Build -> Command -> Build. Each renderer registers at the boundary that creates it and
    // registration itself releases the others (:35167), so the count is an INVARIANT, not a
    // convention. If it ever reads 2, two live GL contexts exist on a device that grants
    // one — the crash class M2 exists to close.
    for (let i = 0; i < 3; i++) {
      await enterCommand(page);
      c = await census(page);
      expect(c.attachments.length, `I1 broken on Command: ${JSON.stringify(c.attachments)}`).toBeLessThanOrEqual(1);
      await enterBuild(page);
      c = await census(page);
      expect(c.attachments.length, `I1 broken back in Build: ${JSON.stringify(c.attachments)}`).toBeLessThanOrEqual(1);
    }

    // WAIT FOR REGISTRATION TO SETTLE BEFORE ASSERTING LIVENESS.
    // Build re-entry builds a NEW #bw-mount every time - measured 2026-09-05 with the engine
    // instrumented: node#1 -> node#2 -> node#3 -> node#4, one per entry. RackEngine registers
    // the new node only after the RECLAIM BARRIER (I6): acquireOrDefer holds it two frames so
    // no context is acquired in the same task as a release. BETWEEN THOSE TWO POINTS the engine
    // legitimately still holds the previous, now-detached, mount.
    //
    // Measured: 3s after the last entry, with NO navigation at all, the census reads
    // connected:true on the current node unaided. Asserting the instant #bw-mount became
    // visible measured that deferral window, not a leak. Ten cycles never exceeded one
    // attachment, so I1 was never in question - only liveness was, and only transiently.
    //
    // NOT WEAKENED. The poll is bounded and its rejection swallowed ON PURPOSE: an attachment
    // that never reconnects falls through to the assertion below, which still fails and still
    // prints the offending attachment. A real detached-host leak is caught exactly as before.
    await page.waitForFunction(() => {
      const E = window.RackEngine;
      if (typeof E !== 'object' || !E) return false;
      return E.report().every((x) => x.connected);
    }, undefined, { timeout: 5000 }).catch(() => {});
    c = await census(page);

    // Every reported attachment must still be in the document. A registered attachment on a
    // detached host is a leak with a live rAF behind it.
    for (const a of c.attachments) {
      expect(a.connected, `RackEngine holds a DETACHED attachment: ${JSON.stringify(a)}`).toBe(true);
    }
  });

  test('the aisle opens over Build and closing it returns to Build with #bw-mount intact', async ({ phantom, page }) => {
    await phantom.boot({ seed: buildSeed() });
    await enterBuild(page);

    const sheet = page.locator('#forge3d-sheet');
    await expect(sheet).toBeHidden();

    await page.locator('#bw-shell button.bw-aisle').click();

    // forge3d_open() (:19146) adds .open; body.rd #forge3d-sheet.open{display:flex} (:9040).
    await expect(sheet).toHaveClass(/(^|\s)open(\s|$)/);
    await expect(sheet).toBeVisible();

    // The aisle is a full-screen sheet and a DIRECT CHILD OF #app — it does NOT remove
    // #bw-mount. That fact IS the .390->.405 arc: a DOM-presence guard in Build survives the
    // navigation, which is why the .391 re-arm could still fire and dispose the live aisle.
    // Pin the geometry the .405 fix depends on so it cannot drift unnoticed.
    await expect(page.locator('#bw-mount')).toHaveCount(1);
    const geometry = await page.evaluate(() => {
      const s = document.getElementById('forge3d-sheet');
      const m = document.getElementById('bw-mount');
      return {
        sheetParent: s.parentElement ? s.parentElement.id : null,
        mountStillInDom: document.body.contains(m),
        mountInsideSheet: s.contains(m),
      };
    });
    expect(geometry.mountStillInDom, 'opening the aisle removed #bw-mount from the DOM').toBe(true);
    expect(geometry.mountInsideSheet, '#bw-mount must not live inside the aisle sheet').toBe(false);
    expect(geometry.sheetParent, 'the aisle sheet is expected to be a direct child of #app').toBe('app');

    // Close through the sheet's own door (onclick="forge3d_close()" :13107).
    await page.locator('#forge3d-sheet .rd-sheet-close').click();
    await expect(sheet).not.toHaveClass(/(^|\s)open(\s|$)/);
    await expect(sheet).toBeHidden();

    // Back on Build, with a host that still measures.
    await expect(page.locator('#pg-work')).toBeVisible();
    await expect(page.locator('#bw-mount')).toHaveCount(1);
    const box = await page.evaluate(() => {
      const m = document.getElementById('bw-mount');
      return { w: m.clientWidth, h: m.clientHeight };
    });
    expect(box.w, 'after the aisle round trip #bw-mount no longer measures').toBeGreaterThan(0);
    expect(box.h, 'after the aisle round trip #bw-mount no longer measures').toBeGreaterThan(0);

    // And the single-context invariant survived the round trip.
    const c = await census(page);
    expect(c.attachments.length, `I1 broken after the aisle round trip: ${JSON.stringify(c.attachments)}`).toBeLessThanOrEqual(1);
  });

  test('no uncaught exception across the Build -> aisle -> Build round trip', async ({ phantom, page }) => {
    await stubHealthProbe(page);   // must precede boot() — see the ENV_NOISE block
    await phantom.boot({ seed: buildSeed() });
    await enterBuild(page);
    await page.locator('#bw-shell button.bw-aisle').click();
    await expect(page.locator('#forge3d-sheet')).toBeVisible();
    await page.locator('#forge3d-sheet .rd-sheet-close').click();
    await expect(page.locator('#forge3d-sheet')).toBeHidden();
    await enterCommand(page);
    await enterBuild(page);

    const hard = phantom.hardErrors();
    const app = hard.filter((e) => !isEnvNoise(e.text));
    const noise = hard.filter((e) => isEnvNoise(e.text));
    if (noise.length) {
      // Printed on every run so a partition can never quietly become the reason a real error
      // was missed. See the ENV_NOISE block for what each pattern is and why it is not in the
      // shared allowlist.
      // eslint-disable-next-line no-console
      console.log(
        `[02-build-forge] ${noise.length} ENVIRONMENT console entr${noise.length === 1 ? 'y' : 'ies'} ` +
        `partitioned locally (NOT allowlisted): ${JSON.stringify(noise.map((e) => e.text.slice(0, 120)))}`
      );
    }
    expect(
      app,
      `console errors / uncaught exceptions on the Build->aisle->Build round trip:\n${app.map((e) => `  [${e.type}] ${e.text}`).join('\n')}`
    ).toEqual([]);

    // An uncaught EXCEPTION is never environmental. Assert that channel with no partition at
    // all, so no filter above can ever hide one.
    const thrown = hard.filter((e) => e.type === 'pageerror');
    expect(
      thrown,
      `uncaught exceptions on the round trip:\n${thrown.map((e) => `  ${e.text}`).join('\n')}`
    ).toEqual([]);
  });

  test('the aisle states its zero-state instead of failing silently with no Master', async ({ phantom, page }) => {
    // The seed carries a deployment but no Master file, which is a REAL field state (a rack
    // traced on device before the Master lands). deploy_forge_rackList() (:19323) returns []
    // and deploy_forge_zeroState() (:19852) must SAY so — on the status row, the hint and the
    // console. A blank aisle with no statement is the defect class this app calls a silent
    // failure, and it is indistinguishable from the .390 blank-aisle bug by eye.
    await phantom.boot({ seed: buildSeed() });
    await enterBuild(page);
    await page.locator('#bw-shell button.bw-aisle').click();
    await expect(page.locator('#forge3d-sheet')).toBeVisible();

    await expect(page.locator('#forge3d-prov')).toHaveText(/NO MASTER LOADED/i);
    await expect
      // v1.14.409 — #tagSub became #tagState. The zero-state message goes into the STATE
      // pill; the walk pill is hidden alongside it (pinned in 08's D3 section).
      .poll(async () => (await page.locator('#forge3d-sheet #tagState').textContent()) || '',
        { timeout: 20_000, message: 'the aisle never stated its zero-state' })
      .toMatch(/NO MASTER LOADED/i);
  });

  test('opening the aisle does not tell the technician the app crashed', async ({ phantom, page }) => {
    // ── FIXED in v1.14.406 — this test now GUARDS the fix. ──────────────────────
    // Was: aisle_trace() routed NORMAL lifecycle events — OPEN_AISLE_CLICK,
    // AISLE_OPEN_REQUESTED, AISLE_HOST_CREATED, ENGINE_ATTACH_STARTED, ENGINE_ATTACHED —
    // through phantom_logErr(), which appends to the crash ring (fine, that is a debug
    // ledger) AND force-shows the shared #crash-banner reading "JS ERROR — tap to view
    // crash log (N entries)". A perfectly healthy aisle open raised a JS-ERROR banner over
    // the technician's screen and left it there: the instrument added to hunt the .403
    // blank aisle reported a crash on every SUCCESS.
    // Now: phantom_logErr takes an optional { trace: true }, which stores type:'trace' and
    // never raises the banner; phantom_crashErrors() is the single predicate the banner,
    // the boot banner and the SYS header count all use, so the number shown is a count of
    // real errors. The ERRORS sheet stays unfiltered — listing traces is the point of .403.

    await phantom.boot({ seed: buildSeed() });
    await enterBuild(page);
    // Baseline: a clean boot with a clean crash ring shows no banner.
    await expect(page.locator('#crash-banner')).toBeHidden();

    await page.locator('#bw-shell button.bw-aisle').click();
    await expect(page.locator('#forge3d-sheet')).toBeVisible();

    const shown = await page.evaluate(() => {
      const b = document.getElementById('crash-banner');
      return { display: b.style.display, text: (b.textContent || '').trim() };
    });

    // A successful aisle open must not raise the crash banner.
    await expect(
      page.locator('#crash-banner'),
      'a healthy aisle open raised the shared JS-ERROR banner (aisle_trace :19090 -> ' +
      `phantom_logErr :17639). The technician is shown: "${shown.text}"`
    ).toBeHidden();
  });

  // ── THE RENDERER: branched on a MEASURED capability, never on an assumption ─────

  test('the Build rack preview always reaches a STATED terminal state — never a silent blank', async ({ phantom, page }) => {
    // Runs on BOTH branches, and is the assertion that matters most on a GPU-less runner.
    // bw_mount3D either produces a canvas or calls say() (:20808), which wipes the mount and
    // writes a message plus a .bw-diag line. There is no third acceptable ending: an empty
    // measured box that never resolves is the .390 blank rack, and it throws nothing, logs no
    // console error, and looks exactly like "still loading" forever.
    test.setTimeout(120_000);

    await phantom.boot({ seed: buildSeed() });
    const gl = await webglProbe(page);
    await enterBuild(page);

    const outcome = await buildPreviewOutcome(page);
    // eslint-disable-next-line no-console
    console.log(
      `[02-build-forge] BUILD PREVIEW OUTCOME = ${outcome.state}` +
      (outcome.state === 'stated' ? ` | app said: "${outcome.msg}" | diag: ${outcome.diag}` : '')
    );
    expect(outcome.state, 'the Build preview host vanished').not.toBe('no-mount');
    expect(['canvas', 'stated']).toContain(outcome.state);

    if (outcome.state === 'stated') {
      // The honest fallback path. It must NAME the failure and carry the diagnostic — there
      // is no console in a cold aisle (:20805).
      expect(outcome.msg, 'say() fired with no message for the technician').toMatch(/Rack preview could not/i);
      expect(outcome.diag, 'say() fired with no diagnostic line').toContain('host=#bw-mount');
      // Probe agreement: if the app could not build a renderer, the raw probe must be able to
      // say why. A disagreement here means one of the two measurements is lying.
      expect(
        gl.contextOk,
        `the app failed to build a renderer while the probe reported ${JSON.stringify(gl)}`
      ).toBe(true);
    }

    // Either way the host must still MEASURE — a zero box on the failure path means the
    // stated message is itself invisible, which is the same defect wearing a different hat.
    const box = await page.evaluate(() => {
      const m = document.getElementById('bw-mount');
      return { w: m.clientWidth, h: m.clientHeight };
    });
    expect(box.w).toBeGreaterThan(0);
    expect(box.h).toBeGreaterThan(0);
  });

  test('with a usable renderer, the Build mount holds exactly ONE live WebGL canvas', async ({ phantom, page }) => {
    test.setTimeout(120_000);

    await phantom.boot({ seed: buildSeed() });
    const gl = await webglProbe(page);
    await enterBuild(page);
    const outcome = await buildPreviewOutcomeWithReentry(page);

    // HARNESS LIMITATION, DECIDED ON EVIDENCE FROM THE APP ITSELF — not on a guess and not on
    // a fabricated pass. This runner's WebKit grants a context and then fails inside three.js's
    // capabilities probe ("null is not an object (evaluating
    // 't.getShaderPrecisionFormat(35633,36338).precision')"), intermittently, once a few
    // contexts have been taken and not yet reclaimed. When that happens there is no scene to
    // assert, so the test skips carrying the app's own diagnostic as proof.
    test.skip(
      outcome.state !== 'canvas',
      'HARNESS LIMITATION: this browser could not build a THREE.WebGLRenderer, so no scene ' +
      `exists to assert. probe=${JSON.stringify(gl)} · app diagnostic: ${outcome.diag || '(none)'} ` +
      '· the app STATED the failure rather than blanking, which the terminal-state test above ' +
      'asserts. WebKit-on-Windows is not iOS Safari — the physical iPhone gate still owns this.'
    );

    await expect(page.locator('#bw-mount canvas')).toHaveCount(1);

    // A canvas is not a scene. three.js r128 creates a WebGL2 context, and asking that canvas
    // for 'webgl' returns null — the bug that made .396 condemn every working rack. Use the
    // app's own correct reader (phantom_readGL :35269); do not re-derive it here.
    const ctx = await page.evaluate(() => {
      const cv = document.querySelector('#bw-mount canvas');
      const g = window.phantom_readGL ? window.phantom_readGL(cv) : (cv.getContext('webgl2') || cv.getContext('webgl'));
      return {
        present: !!g,
        type: g && g.constructor ? g.constructor.name : null,
        lost: !!(g && g.isContextLost && g.isContextLost()),
        w: cv.width, h: cv.height,
      };
    });
    expect(ctx.present, 'the Build canvas holds no graphics context').toBe(true);
    expect(ctx.lost, 'the Build canvas context was granted then immediately lost').toBe(false);
    expect(ctx.w, 'the Build canvas has a zero-width drawing buffer').toBeGreaterThan(0);
    expect(ctx.h, 'the Build canvas has a zero-height drawing buffer').toBeGreaterThan(0);

    // And the engine agrees the Build mount is the one live attachment.
    const c = await census(page);
    expect(c.attachments.length).toBe(1);
    expect(c.attachments[0].host).toBe('bw-mount');
    expect(c.attachments[0].kind).toBe('rack');
    expect(c.attachments[0].connected).toBe(true);
  });

  test('with a usable renderer, opening the aisle TRANSFERS the single attachment and Build does not steal it back', async ({ phantom, page }) => {
    // Holds past Build's ~5s re-arm budget (12 x 400ms, :20852) on purpose.
    test.setTimeout(150_000);

    await phantom.boot({ seed: buildSeed() });
    const gl = await webglProbe(page);
    await enterBuild(page);
    const outcome = await buildPreviewOutcomeWithReentry(page);
    test.skip(
      outcome.state !== 'canvas',
      'HARNESS LIMITATION: no usable renderer on this runner, so neither surface registers an ' +
      `attachment and the transfer cannot be observed. probe=${JSON.stringify(gl)} · app ` +
      `diagnostic: ${outcome.diag || '(none)'}. THIS IS THE ASSERTION THAT WOULD HAVE CAUGHT ` +
      'THE .390->.405 BLANK AISLE, and it can only run on a GPU-capable runner or on the ' +
      'physical iPhone. Do not read a green suite as coverage of that defect.'
    );

    await page.locator('#bw-shell button.bw-aisle').click();
    await expect(page.locator('#forge3d-sheet')).toBeVisible();

    // The aisle registers with kind 'aisle' (:20324) and registration releases every other
    // attachment (:35167). Once the sheet is up, the ONE attachment must be the aisle.
    await expect
      .poll(async () => {
        const c = await census(page);
        return c.attachments.map((a) => `${a.kind}:${a.host}`).join(',');
      }, { timeout: 30_000, message: 'the aisle never became the single live attachment' })
      .toBe('aisle:forge3d-mount');

    // THE .405 REGRESSION GUARD. Build's bounded re-arm keeps firing for ~5s after the aisle
    // opens, and before .405 each retry re-registered #bw-mount and disposed the LIVE aisle
    // while the static HUD stayed perfect. Sample across that whole window: the aisle must own
    // the context at EVERY sample, not merely at the end.
    const samples = [];
    for (let i = 0; i < 8; i++) {
      const c = await census(page);
      samples.push(c.attachments.map((a) => `${a.kind}:${a.host}`).join('|') || '(none)');
      await page.waitForTimeout(800);
    }
    const stolen = samples.filter((s) => s !== 'aisle:forge3d-mount');
    expect(
      stolen,
      'Build re-acquired the context while the aisle owned the screen (the .390->.405 defect). ' +
      `samples over ~6.4s: ${JSON.stringify(samples)}`
    ).toEqual([]);

    // Closing returns the context to Build, or states why it could not. Never nothing.
    await page.locator('#forge3d-sheet .rd-sheet-close').click();
    await expect(page.locator('#forge3d-sheet')).toBeHidden();
    const after = await census(page);
    expect(
      after.attachments.length,
      `I1 broken after closing the aisle: ${JSON.stringify(after.attachments)}`
    ).toBeLessThanOrEqual(1);
  });

  // ── VERIFY ITEM 4, AUTOMATED (v1.14.426) ────────────────────────────────────────────────────
  // The test above proves the transfer works ONCE. Verify item 4 asks whether it survives TEN
  // round trips, and that question is different in kind: a transfer that leaks one context per
  // round trip passes a single-shot test perfectly and then dies on the device, which is exactly
  // how this class surfaced on the runner itself — Forge specs that pass alone and fail inside a
  // long sequential run, because contexts accumulated until WebKit refused a new one.
  //
  // ⚠ THIS DOES NOT REPLACE THE PHONE. A desktop GPU budget is far larger than iOS Safari's, so a
  // slow leak can survive ten round trips here and still exhaust a phone. What this CAN prove is
  // the mechanism: that exactly one attachment exists at every step, that the context comes home
  // to Build on every close, and that nothing accumulates in the DOM. A leak that shows here is
  // real; silence here is not proof of its absence.
  test('THE ROUND TRIP HOLDS x10 — the attachment comes home every time and nothing accumulates', async ({ phantom, page }) => {
    test.setTimeout(300_000);

    await phantom.boot({ seed: buildSeed() });
    const gl = await webglProbe(page);
    await enterBuild(page);
    const outcome = await buildPreviewOutcomeWithReentry(page);
    test.skip(
      outcome.state !== 'canvas',
      'HARNESS LIMITATION: no usable renderer on this runner, so there is no attachment to ' +
      `follow across round trips. probe=${JSON.stringify(gl)} · app diagnostic: ` +
      `${outcome.diag || '(none)'}. Verify item 4 on the physical iPhone still owns this.`
    );

    const surfaces = () => page.evaluate(() => ({
      canvases: document.querySelectorAll('canvas').length,
      live: Array.prototype.filter.call(document.querySelectorAll('canvas'), (cv) => {
        // ⛔ 2D FIRST, AND THE APP'S OWN LAW SAYS WHY. phantom_readGL's header (dct-ios :39260 @ .571)
        // states it: 'getContext() is only a READ on a canvas that ALREADY HAS that context. On a
        // canvas with no context it CREATES one' — so state is read back ONLY from tracked mounts.
        // This filter sweeps EVERY canvas, so it broke that rule and minted the contexts it counted.
        // #cs-ringc is a 2D readiness ring (dct-ios :23642 @ .571), claimed as 2D only when Command renders;
        // since v1.14.571 boot lands on the rack picker and cmd_render no longer runs at launch, so
        // it stays virgin. MEASURED at .570 and .571: identical counts once 2D is probed first.
        // ⚠ The bound is NOT weakened — a real context on a tracked mount is still counted.
        try { if (cv.getContext('2d')) return false; } catch (_) {}
        const g = window.phantom_readGL ? window.phantom_readGL(cv) : null;
        return !!g && !(g.isContextLost && g.isContextLost());
      }).length,
    }));

    const baseline = await surfaces();
    const trace = [];

    for (let i = 1; i <= 10; i++) {
      await page.locator('#bw-shell button.bw-aisle').click();
      await expect(page.locator('#forge3d-sheet')).toBeVisible();
      await expect
        .poll(async () => {
          const c = await census(page);
          return (c.attachments || []).map((a) => `${a.kind}:${a.host}`).join(',');
        }, { timeout: 30_000, message: `round ${i}: the aisle never became the single live attachment` })
        .toBe('aisle:forge3d-mount');
      const open = await surfaces();

      await page.locator('#forge3d-sheet .rd-sheet-close').click();
      await expect(page.locator('#forge3d-sheet')).toBeHidden();
      // THE ASSERTION ITEM 4 IS ACTUALLY ABOUT (restored at v1.14.427): the context must come
      // HOME. Until .427 this read `<= 1`, which 0 satisfies — and 0 was exactly the defect,
      // measured and owner-confirmed. A tolerant bound is not coverage.
      await expect
        .poll(async () => {
          const c = await census(page);
          return (c.attachments || []).map((a) => `${a.kind}:${a.host}`).join(',');
        }, { timeout: 30_000, message: `round ${i}: the context never returned to Build after close` })
        .toBe('rack:bw-mount');
      const closed = await surfaces();

      trace.push({ round: i, openCanvases: open.canvases, openLive: open.live, closedCanvases: closed.canvases, closedLive: closed.live });

      // One live attachment, always — asserted every round, not just at the end, so the round
      // number where it breaks is in the failure message.
      expect(open.live, `round ${i}: more than one live GL context while the aisle was open`).toBeLessThanOrEqual(1);
      expect(closed.live, `round ${i}: more than one live GL context after closing the aisle`).toBeLessThanOrEqual(1);
    }

    const last = trace[trace.length - 1];
    // THE LEAK DETECTOR. A per-round-trip leak shows as monotonic growth; comparing round 10 to
    // the baseline is what a single-shot test structurally cannot see.
    expect(
      last.closedCanvases - baseline.canvases,
      `canvases accumulated across 10 round trips — a per-trip leak. trace: ${JSON.stringify(trace)}`
    ).toBeLessThanOrEqual(1);
    console.log('[02] item-4 round-trip trace: ' + JSON.stringify(trace));
  });

  // ── THE HAND-BACK — a PINNED DEFECT at v1.14.426, FIXED at v1.14.427 ────────────────────────
  // Verify item 4 states the contract: "Open Aisle draws and holds; CLOSE RETURNS TO BUILD WITH
  // THE RACK STILL THERE." Until .427 the second half did not happen.
  //
  // WHAT WAS MEASURED AT .426, at 2.5s and again at 11s after close — past Build's ~5s re-arm:
  //   #bw-mount   visible, 326x320, a real box
  //   canvases in #bw-mount   0
  //   RackEngine.report()     []            <- no attachment anywhere
  // Owner confirmed the same on hardware: "rack is gone from build after close."
  //
  // WHY. forge3d_open registers the aisle, and registration releases every other attachment, so
  // Build's context is gone by design. forge3d_close then disposed the aisle and called
  // reh3d_activate3D() — the RACK-DETAIL surface. Its own comment says that is a no-op when no
  // #reh3dCanvasHost exists, which is exactly the case when the aisle was opened FROM BUILD. And
  // bw_mount3D has one caller, bw_render, so only a Build RE-RENDER could rebuild it. Nothing on
  // the close path re-rendered Build. The IntersectionObserver cannot help either: it pauses and
  // resumes an EXISTING attachment and cannot recreate a released one.
  //
  // WHY IT WAS NEVER CAUGHT: the round-trip test above asserted `attachments.length <= 1` after
  // close, which 0 satisfies. The spec header claimed "the aisle round trip leaves Build intact"
  // and no assertion ever checked it. A tolerant bound reads as coverage.
  //
  // THE FIX (.427): forge3d_open captures the attachment it is about to displace, and
  // forge3d_close hands the context back to THAT surface rather than to one hardcoded address.
  // This test carried test.fail() at .426 and flipped to "Expected to fail, but passed" the moment
  // the fix landed — that flip is why the pin was removed rather than edited to match.
  test('closing the aisle RETURNS the rack to Build — the context goes back to its lender', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: buildSeed() });
    const gl = await webglProbe(page);
    await enterBuild(page);
    const outcome = await buildPreviewOutcomeWithReentry(page);
    test.skip(
      outcome.state !== 'canvas',
      `HARNESS LIMITATION: no usable renderer. probe=${JSON.stringify(gl)} · ${outcome.diag || ''}`
    );

    await page.locator('#bw-shell button.bw-aisle').click();
    await expect(page.locator('#forge3d-sheet')).toBeVisible();
    await expect
      .poll(async () => (await census(page)).attachments.map((a) => `${a.kind}:${a.host}`).join(','),
        { timeout: 30_000 })
      .toBe('aisle:forge3d-mount');

    await page.locator('#forge3d-sheet .rd-sheet-close').click();
    await expect(page.locator('#forge3d-sheet')).toBeHidden();

    // Generous: far past the ~5s re-arm budget. Build is the operational centre — an empty,
    // correctly-sized box with no message is the silent blank this whole subsystem exists to
    // make impossible.
    await expect
      .poll(async () => (await census(page)).attachments.map((a) => `${a.kind}:${a.host}`).join(','),
        { timeout: 20_000, message: 'the context never came home to Build' })
      .toBe('rack:bw-mount');
  });
});



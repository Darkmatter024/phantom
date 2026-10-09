// ─────────────────────────────────────────────────────────────────────────────
// 31 — THE RENDERER DOES NOT INVENT STATE (v1.14.444 · R3)
//
// ⛔ WHAT THIS EXISTS TO CATCH. The switch family lit its ports with a random gate — roughly 60% of
// ports, reshuffled on EVERY re-render. PHANTOM knows nothing about which ports are populated or
// live, so a technician reading lit ports as connected ports was reading dice, and the same switch
// showed a different pattern each time the rack was drawn. Contract 10, and it shipped for months.
//
// Alongside it, every drive bay, storage blade, media brick and PSU carried a GREEN, BLINKING LED.
// Green is PHANTOM's success colour (§34) and a blink is the universal signal for live activity, so
// that was a per-device health claim against telemetry PHANTOM does not receive.
//
// ⭐ THE RULE, pinned here so a future family does not re-litigate it:
//    STATE colours (green/amber/red) may NOT be used decoratively.
//    ACCENT colours (cyan/violet/teal) MAY carry family identity.
//    Nothing blinks, whatever its colour.
//
// ⚠ AND THE LINE THIS SPEC IS CAREFUL ABOUT. "No randomness in the renderer" is the WRONG rule and
// the first draft of this spec got it wrong: the scene also scatters dust motes at random, which is
// atmosphere and claims nothing about the Master. Randomness is only a defect when it decides what
// the rack DEPICTS — devices, ports, LEDs, counts. So the assertion below is scoped to the device
// families, not to the whole function.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_hon', RACK = 'rack_hon_0';
const PHASES = ['mechanical', 'power', 'network', 'compute', 'validation'];

const S4 = [[46, 'SN2201', 'switch'], [42, 'PS-1RU-06', 'pdu'], [41, 'PS-1RU-06', 'pdu'],
  [35, 'GPU-B300-01', 'gpu'], [32, 'GPU-B300-01', 'gpu'], [29, 'GPU-B300-01', 'gpu'],
  [9, 'PS-1RU-06', 'pdu'], [2, 'CDU', 'cdu']];

function seed() {
  const now = 1750000000000;
  const slots = S4.map(([u, model, type], i) => ({
    uStart: u, uEnd: u, type, name: model + '-' + i, dns: 's4-' + u, model, status: 'racked' }));
  return {
    phantom_deployments_v1: JSON.stringify([{ id: DEP, name: 'US-QRS03', status: 'active',
      buildLead: 'J. Hamilton', created: now, updated: now, createdAt: now, updatedAt: now,
      rackCount: 1, phaseCount: 5 }]),
    phantom_deploy_racks_v1: JSON.stringify([{ id: RACK, deploymentId: DEP, rackId: 's4:099',
      room: 'HALL-4', totalU: 48, slots, notes: '', powerCircuits: [], currentPhase: 'network',
      hosts: [{ dns: 's4-35', platform: 'GPU-B300', type: 'gpu', installed: true }] }]),
    phantom_deploy_phases_v1: JSON.stringify(PHASES.map((t, i) => ({
      id: 'phase_' + RACK + '_' + t, deploymentId: DEP, rackId: RACK, type: t, seqOrder: i + 1,
      status: i < 2 ? 'complete' : (i === 2 ? 'in_progress' : 'pending'),
      tasksTotal: 0, tasksDone: 0, signedOffBy: null, signedOffAt: null,
      _gateOverride: false, _notes: '' }))),
    phantom_active_deployment: DEP, phantom_manifest_last_deploy: DEP,
  };
}

// Strip comments before grepping source. Non-negotiable here: the fix's own comments quote the
// removed code verbatim, so a naive grep fails against CORRECT code — which is what happened on the
// first run of this spec. Quote-aware, so a `//` inside a string literal survives.
const stripComments = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n')
  .map((line) => {
    let out = '', quote = null;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quote) { out += c; if (c === quote && line[i - 1] !== '\\') quote = null; continue; }
      if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
      if (c === '/' && line[i + 1] === '/') break;
      out += c;
    }
    return out;
  })
  .join('\n');

// ⚠ v1.14.451 (Forge parity P1): the rack geometry, the device families and the coolant gate
// moved OUT of rackElevation_render3D into the module-scope rackGeometry_build so a second
// renderer can build the same rack. These assertions are unchanged in substance — only the
// address they read. Both sources are concatenated, builder FIRST, so a slice that bounds a
// family branch still lands inside the builder while caller-side state (ledMats) stays visible.
const rendererSrc = (page) =>
  page.evaluate(() => String(window.rackGeometry_build) + '\n' + String(window.rackElevation_render3D))
    .then(stripComments);

test.describe('the renderer does not invent state', () => {

  test('⛔ NO RANDOMNESS DECIDES WHAT A DEVICE FAMILY DRAWS', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await rendererSrc(page);
    // Slice the device-family chain precisely — from the compute branch to the end of the blank
    // branch. Atmosphere outside this region (dust motes) is allowed to be random; anything that
    // draws a device, a port, a bay or an LED is not.
    const start = src.indexOf("kind === 'compute'");
    const end = src.indexOf("kind === 'blank'");
    expect(start, 'the compute family branch could not be located — this spec is checking nothing').toBeGreaterThan(-1);
    expect(end, 'the blank family branch could not be located — this spec is checking nothing').toBeGreaterThan(start);
    const families = src.slice(start, end);
    expect(families.includes('Math.random('),
      'a device family decides part of what it draws at random — that is fabricated telemetry').toBe(false);
  });

  // ⚠ HONEST ABOUT ITS OWN STRENGTH. This one is CORROBORATING, not the gate. It was verified by
  // re-injecting the random gate: the test above went red, this one stayed green, because
  // bw_render() re-DRAWS the existing scene rather than rebuilding the trays, so the object census
  // cannot vary between two calls. It still earns its place — it pins that a re-render neither
  // duplicates nor loses geometry — but the assertion that actually catches fabricated port state
  // is the source-slice test above. Recorded so nobody reads a green here as proof of determinism.
  test('a re-render neither duplicates nor loses rack geometry', async ({ phantom, page }) => {
    test.setTimeout(240_000);
    await phantom.boot({ seed: seed() });
    // Capture every scene the renderer draws, so the rack can be counted rather than guessed at.
    await page.evaluate(async () => {
      for (let i = 0; i < 60 && !window.THREE; i++) {
        if (typeof loadScript === 'function') { try { await loadScript('./vendor/three.min.js'); } catch (_) {} }
        if (window.THREE) break;
        await new Promise((r) => setTimeout(r, 200));
      }
      window.__scenes = [];
      const R = window.THREE.WebGLRenderer;
      const P = function (o) {
        const r = new R(o);
        const inner = r.render.bind(r);
        r.render = function (scene, cam) {
          if (window.__scenes.indexOf(scene) === -1) window.__scenes.push(scene);
          return inner(scene, cam);
        };
        return r;
      };
      P.prototype = R.prototype;
      window.THREE.WebGLRenderer = P;
    });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(1000);

    // Count only what the RACK contributes. The old defect changed the NUMBER of LED meshes between
    // draws of the same rack, so an object census is exactly the fingerprint that catches it.
    const census = async () => {
      await page.evaluate(() => { window.__scenes = []; if (typeof bw_render === 'function') bw_render(); });
      await page.waitForTimeout(3000);
      return page.evaluate(() => {
        let meshes = 0, instanced = 0;
        (window.__scenes || []).forEach((s) => s.traverse((o) => {
          if (o.isInstancedMesh) { instanced += (o.count || 0); meshes++; }
          else if (o.isMesh) meshes++;
        }));
        return { meshes, instanced };
      });
    };

    const a = await census();
    const b = await census();
    expect(a.meshes, 'no rack was drawn — this test measured nothing').toBeGreaterThan(0);
    // Exact equality. The defect value was "a different number every time", so any tolerance here
    // would admit precisely the bug this spec exists for.
    expect(b, 'the same rack drew a different number of objects on a second render').toEqual(a);
  });

  test('no LED blinks — a blink is an activity claim', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const src = await rendererSrc(page);
    // The blink drove shared LED materials from the animation loop via ledMats. Empty by design; it
    // also takes per-frame material writes out of the render loop (§36).
    expect(src, 'the LED blink list is no longer empty — LEDs may be pulsing again')
      .toContain('var ledMats = []');
  });

  test('state colours are not used decoratively on device LEDs', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const live = await rendererSrc(page);
    // 0x10b981 was the decorative green on drives, blades, media bricks and PSUs.
    expect(live.includes('0x10b981'), 'a decorative GREEN LED is back on a device chassis').toBe(false);
    // Violet is an accent and is allowed to stay — asserted so this spec can never be satisfied by
    // stripping every light off the rack and calling it honest.
    expect(live, 'the switch lost its violet accent — families must stay distinguishable').toContain('0xa855f7');
  });
});

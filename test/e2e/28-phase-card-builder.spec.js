// ─────────────────────────────────────────────────────────────────────────────
// 28 — THE PHASE CARD BUILDER (v1.14.440 · M2-b merge step 3b)
//
// The card loop was an IIFE inside deploy_showRackDetail. It is now
// deploy_buildPhaseCards(deployId, rackId, rackPhases, rack, surface, opts), so a second surface
// can ask for the same cards without re-entering the rack detail. Contract A2: ONE renderer.
//
// ⛔ WHAT THIS SPEC EXISTS TO CATCH. The lift is only half the job — the cards' ACTIONS were wired
// to re-render the rack detail in thirteen places, and nine of them are outside the loop: four
// resume after a modal, five are emitted into onclick attributes by the checklist strip and the
// stale badge. A miss on any one of them is INVISIBLE while the detail is the only surface, and
// becomes a technician mid-shift being thrown off Build the first time they tap that control.
// So the assertions here read the EMITTED MARKUP, not just the return value.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_pcb', RACK = 'rack_pcb_0';

// One phase per status, so every branch of the loop emits: pending+gated (OVERRIDE),
// pending (START), in_progress (COMPLETE + BLOCK), blocked (TROUBLESHOOT + UNBLOCK), complete.
const PHASES = [
  { type: 'mechanical', status: 'complete' },
  { type: 'power', status: 'in_progress' },
  { type: 'network', status: 'blocked' },
  { type: 'compute', status: 'pending' },
  { type: 'validation', status: 'pending' },
];

function seed() {
  const now = 1750000000000;
  const slots = [];
  for (let i = 0; i < 5; i++) slots.push({ uStart: 1 + i * 5, uEnd: 4 + i * 5, type: 'gpu',
    name: 'g' + i, dns: 'g' + i, model: 'HGX', status: i < 2 ? 'racked' : 'pending' });
  return {
    phantom_deployments_v1: JSON.stringify([{ id: DEP, name: 'ALP-01 BUILD', status: 'active',
      buildLead: 'J. Hamilton', created: now, updated: now, createdAt: now, updatedAt: now,
      rackCount: 1, phaseCount: 5 }]),
    phantom_deploy_racks_v1: JSON.stringify([{ id: RACK, deploymentId: DEP, rackId: 'l1:001',
      room: 'HALL-1', totalU: 48, slots, notes: '', powerCircuits: [], currentPhase: 'power',
      hosts: [{ dns: 'g0', platform: 'HGX', type: 'gpu', installed: true }] }]),
    phantom_deploy_phases_v1: JSON.stringify(PHASES.map((p, i) => ({
      id: 'phase_' + RACK + '_' + p.type, deploymentId: DEP, rackId: RACK, type: p.type,
      seqOrder: i + 1, status: p.status, tasksTotal: 0, tasksDone: 0,
      signedOffBy: p.status === 'complete' ? 'J. Hamilton' : null,
      signedOffAt: p.status === 'complete' ? now : null,
      blockerNote: p.status === 'blocked' ? 'waiting on optics' : '',
      _gateOverride: false, _notes: '' }))),
    phantom_active_deployment: DEP, phantom_manifest_last_deploy: DEP,
  };
}

// Build the cards for a given surface and hand back the raw markup.
const cardsFor = (page, surface) => page.evaluate((s) => {
  const phases = deploy_loadPhasesFor(s.d).filter((p) => p.rackId === s.r)
    .sort((a, b) => a.seqOrder - b.seqOrder);
  const rack = deploy_loadRacksFor(s.d).find((r) => r.id === s.r);
  return deploy_buildPhaseCards(s.d, s.r, phases, rack, s.surface);
}, { d: DEP, r: RACK, surface });

test.describe('the phase card builder', () => {

  test('it is reachable at page scope — the IIFE-scope trap that has bitten this file', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const t = await page.evaluate(() => ({
      builder: typeof window.deploy_buildPhaseCards,
      dispatch: typeof window.phase_refreshSurface,
    }));
    expect(t.builder, 'deploy_buildPhaseCards is not reachable at page scope').toBe('function');
    expect(t.dispatch, 'phase_refreshSurface is not reachable at page scope').toBe('function');
  });

  test('every branch of the loop still emits — the lift did not drop a status', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const html = await cardsFor(page, 'detail');
    // ⚠ MEASURED: with an incomplete predecessor, a PENDING phase renders GATED + OVERRIDE, not
    // START. deploy_isPhaseGated reads the stored phases, so the gate is a property of the seed,
    // not of the builder — which is why START gets its own seed below instead of being asserted
    // against data that cannot produce it.
    for (const label of ['COMPLETE', 'BLOCK', 'TROUBLESHOOT', 'UNBLOCK', 'Completed', 'GATED', 'OVERRIDE']) {
      expect(html, `the ${label} branch stopped emitting after the lift`).toContain(label);
    }
    // Five phases in, five cards out.
    expect((html.match(/class="hud-card/g) || []).length, 'the card count changed').toBe(5);
  });

  test('the ungated START branch still emits — the one the first seed cannot reach', async ({ phantom, page }) => {
    const s = seed();
    // Complete the first two phases so phase 3 is PENDING and UNGATED.
    s.phantom_deploy_phases_v1 = JSON.stringify(JSON.parse(s.phantom_deploy_phases_v1).map((p) =>
      (p.seqOrder <= 2 ? { ...p, status: 'complete', signedOffBy: 'J. Hamilton', signedOffAt: 1750000000000 }
        : (p.seqOrder === 3 ? { ...p, status: 'pending', blockerNote: '' } : p))));
    await phantom.boot({ seed: s });
    const html = await cardsFor(page, 'detail');
    expect(html, 'the START branch stopped emitting after the lift').toContain('START');
    expect(html, 'START does not route through the dispatcher').toMatch(
      /deploy_advancePhase\([^"]*'in_progress'[^"]*\);phase_refreshSurface\('detail'/);
  });

  test('⛔ NO ACTION STILL HARDCODES THE RACK DETAIL', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    for (const surface of ['detail', 'build']) {
      const html = await cardsFor(page, surface);
      // Exact, not a bound. Even ONE surviving hardcode is a control that lands the technician on
      // the wrong screen, and it would only show up on whichever card happens to be in that state.
      expect((html.match(/deploy_showRackDetail\(/g) || []).length,
        `a phase action still calls deploy_showRackDetail directly (surface=${surface})`).toBe(0);
    }
  });

  test('the cards carry the CALLER\'S surface through every hop', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });

    const detail = await cardsFor(page, 'detail');
    expect(detail).toContain("phase_refreshSurface('detail'");
    expect(detail, 'a detail-built card routes an action to Build').not.toContain("'build'");

    const build = await cardsFor(page, 'build');
    // Each hop is asserted by NAME, because each one is a separate place the threading can be
    // missed and every one of them was missed by the original 4-site inventory.
    expect(build, 'START / BLOCK / UNBLOCK / OVERRIDE do not refresh Build').toContain("phase_refreshSurface('build'");
    expect(build, 'COMPLETE does not carry the surface into ge_onCompleteTap').toMatch(/ge_onCompleteTap\([^)]*,'build'\)/);
    expect(build, 'TROUBLESHOOT does not carry the surface into ta_open').toMatch(/ta_open\([^)]*,'build'\)/);
    expect(build, 'the checklist EDIT control does not carry the surface').toMatch(/checklist_toggleEdit\([^)]*,'build'\)/);
    expect(build, 'the checklist ADD control does not carry the surface').toMatch(/checklist_addItem\([^)]*,'build'\)/);
  });

  test('the stale badge carries the surface three hops to FLAG FOR RE-VERIFY', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    // The badge only renders when audit events land AFTER signoff, so manufacture that condition
    // rather than asserting on a badge that never appears.
    const built = await page.evaluate((s) => {
      const phases = deploy_loadPhasesFor(s.d).filter((p) => p.rackId === s.r);
      const done = phases.find((p) => p.status === 'complete');
      const audit = [{ id: 'a1', deploymentId: s.d, action: 'CRITERION_RESET', entityType: 'phase',
        entityId: done.id, ts: done.signedOffAt + 60000, detail: 'reset after signoff' }];
      const rack = deploy_loadRacksFor(s.d).find((r) => r.id === s.r);
      return {
        badge: deploy_renderPhaseStaleBadge(done, audit, s.d, s.r, 'build'),
        cards: deploy_buildPhaseCards(s.d, s.r, phases, rack, 'build', { rackAudit: audit }),
      };
    }, { d: DEP, r: RACK });

    expect(built.badge, 'the stale badge never rendered — the test proves nothing').toContain('REVIEW');
    expect(built.badge, 'the badge drops the surface on the way to the drift modal')
      .toMatch(/deploy_openPhaseDriftModal\([^)]*,'build'\)/);
    expect(built.cards, 'the card did not pass its surface into the stale badge')
      .toMatch(/deploy_openPhaseDriftModal\([^)]*,'build'\)/);
  });

  test('the async legs store the surface — a closure would not survive the modal', async ({ phantom, page }) => {
    await phantom.boot({ seed: seed() });
    const stored = await page.evaluate((s) => {
      const phases = deploy_loadPhasesFor(s.d).filter((p) => p.rackId === s.r);
      const blocked = phases.find((p) => p.status === 'blocked');
      const running = phases.find((p) => p.status === 'in_progress');
      ta_open(s.d, s.r, blocked.id, 'build');
      const ta = _ta_ctx && _ta_ctx.surface;
      if (typeof ta_close === 'function') ta_close();
      ge_openCaptureModal(running.id, s.d, s.r, running.type, 'gpu', 'build');
      const ge = _geCaptureState && _geCaptureState.surface;
      return { ta, ge };
    }, { d: DEP, r: RACK });
    expect(stored.ta, 'ta_open did not capture the surface — TROUBLESHOOT resolve lands wrong').toBe('build');
    expect(stored.ge, 'ge_openCaptureModal did not capture the surface — COMPLETE lands wrong').toBe('build');
  });

  test('COMPLETE actually lands on the surface it was tapped from', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate(() => showMode('work'));
    await page.waitForTimeout(1200);
    const hits = await page.evaluate((s) => {
      const out = { detail: 0, build: 0 };
      const rd = window.deploy_showRackDetail, bw = window.bw_render;
      window.deploy_showRackDetail = function () { out.detail++; return rd.apply(this, arguments); };
      window.bw_render = function () { out.build++; return bw.apply(this, arguments); };
      try {
        const running = deploy_loadPhasesFor(s.d).filter((p) => p.rackId === s.r)
          .find((p) => p.status === 'in_progress');
        // The real COMPLETE path: open the quirk modal from Build, then skip the capture.
        ge_openCaptureModal(running.id, s.d, s.r, running.type, 'gpu', 'build');
        ge_captureSkip();
      } finally {
        window.deploy_showRackDetail = rd; window.bw_render = bw;
      }
      return out;
    }, { d: DEP, r: RACK });
    expect(hits.build, 'completing a phase from Build did not refresh Build').toBeGreaterThan(0);
    expect(hits.detail, 'completing a phase from Build threw the technician onto the rack detail').toBe(0);
  });

  test('the rack detail is unchanged — the lift is behaviour-preserving', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await page.evaluate((s) => deploy_showRackDetail(s.d, s.r), { d: DEP, r: RACK });
    await page.waitForTimeout(1600);
    // The dock is fed the builder's string. If the call site regressed, the dock renders nothing
    // and the technician loses START / COMPLETE / OVERRIDE with no error — the failure mode
    // phdock_render's own comment warns about.
    const dock = await page.evaluate(() => {
      const el = document.querySelector('.phs-inner') || document.getElementById('phase-sheet');
      return { cards: document.querySelectorAll('.hud-card').length, sheet: !!el };
    });
    expect(dock.cards, 'the rack detail rendered no phase cards after the lift').toBeGreaterThan(0);
  });
});

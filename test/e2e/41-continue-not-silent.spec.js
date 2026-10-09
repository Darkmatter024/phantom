// ─────────────────────────────────────────────────────────────────────────────
// 41 — BUILD'S CONTINUE NEVER FAILS SILENTLY (v1.14.461)
//
// ⛔ THE REPORT. On a real iPhone, CONTINUE on BUILD / FIELD MODE looked active and did nothing.
// State: rack s1:002, "Platform not in Master", Phase 1 of 5 MECHANICAL, 0%.
//
// ⚠ THE HONEST FINDING FIRST: that state REPRODUCES CLEANLY in this harness and CONTINUE works —
// the button measures 326x56, hit-tests to itself, calls deploy_showRackDetail without throwing,
// and the host renders 390px of content. So this spec does NOT claim to pin the owner's exact
// failure. What it pins is the thing that made the failure INVISIBLE, which is a defect in its own
// right and is provable here.
//
// ⭐ THE PATH HAD THREE SILENT EXITS. deploy_showRackDetail did `if (!c) return;` after having
// already set body.ops-detail, pushed nav state, moved the active context, set the stripe and
// evaluated the wake lock — so the app believed it had navigated somewhere it never drew, and the
// CTA's own try/catch could not help because nothing threw. deploy_ensureDeployPanelVisible gave
// up silently when the deploy sub-tab button was absent, leaving the host switched off. And a
// successful innerHTML into a hidden or zero-height host is this repo's recorded
// "silent success into a hidden node" class: the write succeeds and the screen stays blank.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP_ID = 'DEP-C41';
const RACK_ROW_ID = 'RK-C41';
const PHASE_TYPES = ['mechanical', 'electrical', 'network', 'validation', 'handoff'];

// The reported screen, rebuilt: a real deployment and rack row, NO hosts (so the platform cannot
// resolve — "Platform not in Master"), mechanical in progress, nothing done.
function seed() {
  const now = 1750000000000;
  return {
    phantom_deployments_v1: JSON.stringify([{
      id: DEP_ID, name: 'C41', status: 'active', buildLead: 'E2E',
      created: now, updated: now, createdAt: now, updatedAt: now, rackCount: 1, phaseCount: 5,
    }]),
    phantom_deploy_racks_v1: JSON.stringify([{
      id: RACK_ROW_ID, deploymentId: DEP_ID, rackId: 's1:002', room: 'HALL-1',
      totalU: 42, slots: [], notes: '', powerCircuits: [], currentPhase: 'mechanical', hosts: [],
    }]),
    phantom_deploy_phases_v1: JSON.stringify(PHASE_TYPES.map((t, i) => ({
      id: 'phase_' + RACK_ROW_ID + '_' + t, deploymentId: DEP_ID, rackId: RACK_ROW_ID,
      type: t, seqOrder: i + 1, status: i === 0 ? 'in_progress' : 'pending',
      tasksTotal: 0, tasksDone: 0, signedOffBy: null, signedOffAt: null,
      _gateOverride: false, _notes: '',
    }))),
    phantom_active_deployment: DEP_ID,
  };
}

const enterBuild = async (page) => {
  await page.evaluate(() => { if (typeof showMode === 'function') showMode('work'); });
  await page.waitForTimeout(3500);
};

test.describe('Build CONTINUE', () => {

  test('the reported state renders, and CONTINUE is a live, hit-testable control', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await enterBuild(page);
    const s = await page.evaluate(() => {
      const cta = document.querySelector('#bw-shell button.bw-cta');
      if (!cta) return { cta: null };
      const r = cta.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
      return {
        rack: (document.querySelector('#bw-shell .bw-rack') || {}).textContent,
        plat: (document.querySelector('#bw-shell .bw-plat') || {}).textContent,
        cta: { text: cta.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height),
               bound: typeof cta.onclick === 'function',
               pe: getComputedStyle(cta).pointerEvents,
               covered: hit ? !(hit === cta || cta.contains(hit)) : true,
               coveredBy: hit && !(hit === cta || cta.contains(hit)) ? (hit.id || hit.className || hit.tagName) : null },
      };
    });
    expect(s.cta, 'the Build hero has no CTA at all').not.toBeNull();
    expect(s.rack, 'the reported rack did not render').toBe('s1:002');
    expect(s.plat, 'the reported platform state did not render').toMatch(/not in Master/i);
    expect(s.cta.text, 'the CTA is not the CONTINUE branch').toMatch(/Continue/i);
    // ⛔ Check 3 from the report: is anything transparent sitting over it?
    expect(s.cta.covered, `CONTINUE is covered by ${s.cta.coveredBy} — a tap cannot reach it`).toBe(false);
    expect(s.cta.pe, 'CONTINUE has pointer-events disabled').not.toBe('none');
    expect(s.cta.bound, 'CONTINUE has no click handler').toBe(true);
    expect(s.cta.h, `CONTINUE is ${s.cta.h}px tall, under the 44px gloved floor`).toBeGreaterThanOrEqual(44);
  });

  test('one tap enters the rack workflow and the render lands somewhere VISIBLE', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await enterBuild(page);
    const r = await page.evaluate(async () => {
      document.querySelector('#bw-shell button.bw-cta').click();
      await new Promise((res) => setTimeout(res, 1200));
      const host = (typeof deploy_opsHost === 'function') ? deploy_opsHost() : null;
      const hr = host ? host.getBoundingClientRect() : null;
      return {
        opsDetail: document.body.classList.contains('ops-detail'),
        hostId: host ? host.id : null,
        hostH: hr ? Math.round(hr.height) : 0,
        hostDisplay: host ? getComputedStyle(host).display : null,
        hasContent: !!(host && host.innerHTML && host.innerHTML.length > 200),
        hasBack: !!(host && host.querySelector('button')),
      };
    });
    expect(r.opsDetail, 'the app did not enter rack-detail mode').toBe(true);
    expect(r.hasContent, 'the rack workflow rendered nothing').toBe(true);
    // ⭐ THE ASSERTION THAT WOULD HAVE CAUGHT A DEAD CONTINUE. A successful innerHTML into a
    // zero-height host is indistinguishable from success unless the height is measured.
    expect(r.hostH, `the rack workflow rendered into a ${r.hostH}px-tall host — the write succeeded and the screen stayed blank`).toBeGreaterThan(8);
    expect(r.hostDisplay, 'the rack-workflow host is display:none').not.toBe('none');
    expect(r.hasBack, 'the rack workflow has no way back').toBe(true);
  });

  test('⛔ with no host, CONTINUE reports the failure instead of swallowing it', async ({ phantom, page }) => {
    test.setTimeout(180_000);
    await phantom.boot({ seed: seed() });
    await enterBuild(page);
    const r = await page.evaluate(async () => {
      const warns = [], toasts = [];
      const ow = console.warn;
      console.warn = function () { warns.push(Array.from(arguments).join(' ')); ow.apply(console, arguments); };
      const ot = window.phantomToast;
      window.phantomToast = function (m, t) { toasts.push(String(m) + '|' + String(t)); };
      // Remove BOTH candidate hosts so deploy_opsHost() resolves null — the exact condition the
      // old `if (!c) return;` swallowed.
      const a = document.getElementById('wk-deploy'); const ap = a && a.parentNode; if (a) a.remove();
      const b = document.getElementById('ops-content'); const bp = b && b.parentNode; if (b) b.remove();
      document.body.classList.remove('ops-detail');
      try { deploy_showRackDetail('DEP-C41', 'RK-C41'); } catch (e) { warns.push('THREW: ' + e.message); }
      await new Promise((res) => setTimeout(res, 400));
      const left = document.body.classList.contains('ops-detail');
      if (a && ap) ap.appendChild(a); if (b && bp) bp.appendChild(b);
      console.warn = ow; window.phantomToast = ot;
      return { warns, toasts, left };
    });
    // ⛔ Contract 14. Silence here is the defect.
    expect(r.warns.some((w) => /no host|resolved neither/i.test(w)),
      `no diagnostic was logged for a missing host — got ${JSON.stringify(r.warns)}`).toBe(true);
    expect(r.toasts.length, 'the technician was told nothing — the tap looked like it worked').toBeGreaterThan(0);
    expect(r.toasts.join(' '), 'the toast does not name the problem').toMatch(/Build surface|not mounted/i);
    // ⭐ And it must not leave the app believing it navigated somewhere it never drew.
    expect(r.left, 'body was left in ops-detail after a failed render — the app thinks it navigated').toBe(false);
  });
});

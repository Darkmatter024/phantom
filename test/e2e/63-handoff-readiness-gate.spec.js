// ─────────────────────────────────────────────────────────────────────────────
// 63 — THE HANDOFF READINESS GATE REQUIRES A CURRENT-DEPLOYMENT HANDOFF
//      (v1.14.590, FIX-HANDOFF-READINESS-PREDICATE, external review Finding 3 / P1)
//
// ⛔ WHY THIS EXISTS. Command's `Handoff started` gate read:
//        handoffDraft = !!(hraw && JSON.parse(hraw))
//    over the raw `phantom_handoff_v1` value. ANY parseable JSON is truthy there — and `[]` is
//    parseable. So an empty list, a handoff belonging to a DIFFERENT deployment, and a handoff
//    saved months ago all read as a PASS. With the other gates met the card printed
//    "clear to hand off" having measured nothing. Displayed state stronger than measured state:
//    the same family as the blockers cell (.579) and the ungated cs-kpi-pct (queued).
//
// ⚠ WHAT THE STORE ACTUALLY HOLDS. handoff_generate returns a draft into the in-memory
//   _handoffDraft and writes nothing; the only writer of a record is handoff_saveRecord, which
//   sets status='saved' and savedAt before it unshifts. The key therefore holds COMPLETED
//   handoffs only, for every deployment, forever — nothing purges it at shift end and it has no
//   cap. That is why "any value here" could never have been the right question.
//
// ⭐ THE ACCEPTANCE BAR (the fix spec's four cases, plus the defensive-parse requirement):
//   empty list OPEN · foreign deployment OPEN · stale OPEN · fresh OK and OPEN again after a
//   deployment switch · malformed JSON OPEN rather than a throw or a pass.
//
// ⚠ EVERY CASE ASSERTS THE DOT AS WELL AS THE TEXT. .577's first cut of the neighbouring gate
//   passed its text assertions while the dot still rendered the green OK colour — the lie was in
//   a colour, and .578 exists because of it. Text alone is not evidence here.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const DEP = 'dep_hof_a';
const DEP_B = 'dep_hof_b';
const RACK = 'rack_hof_a_0';
const HOUR = 60 * 60 * 1000;

// Two ACTIVE deployments so the switch in case 4 is a real resolver change, not an empty list.
// phantom_active_deployment names which one is current; nowtab_resolveDep prefers it when it is
// in the active set, which both of these are.
function seed(extra) {
  const now = 1750000000000;
  const P = ['mechanical', 'power', 'network', 'compute', 'validation'];
  const base = {
    phantom_deployments_v1: JSON.stringify([
      { id: DEP, name: 'AUS-01 BUILD', status: 'active', buildLead: 'J. Hamilton',
        created: now, updated: now, createdAt: now, updatedAt: now, rackCount: 1, phaseCount: 5 },
      { id: DEP_B, name: 'AUS-02 BUILD', status: 'active', buildLead: 'J. Hamilton',
        created: now, updated: now, createdAt: now, updatedAt: now, rackCount: 0, phaseCount: 0 },
    ]),
    phantom_deploy_racks_v1: JSON.stringify([{ id: RACK, deploymentId: DEP, rackId: 's1:001',
      room: 'HALL-1', totalU: 48, slots: [], notes: '', powerCircuits: [], currentPhase: 'network', hosts: [] }]),
    phantom_deploy_phases_v1: JSON.stringify(P.map((ty, i) => ({
      id: 'phase_' + RACK + '_' + ty, deploymentId: DEP, rackId: RACK, type: ty, seqOrder: i + 1,
      status: i < 2 ? 'complete' : 'pending', tasksTotal: 0, tasksDone: 0,
      signedOffBy: null, signedOffAt: null, _gateOverride: false, _notes: '' }))),
    phantom_active_deployment: DEP,
    phantom_manifest_last_deploy: DEP,
  };
  return Object.assign(base, extra || {});
}

// A record shaped exactly as handoff_saveRecord writes one: generatedAt from handoff_generate,
// savedAt and status='saved' added on save. Nothing invented — an adapter-shaped fixture that
// did not match the writer would prove nothing.
function handoffRecord(deploymentId, stampMs, opts) {
  opts = opts || {};
  const rec = {
    id: 'hoff_' + stampMs + '_test',
    deploymentId: deploymentId,
    deploymentName: 'FIXTURE',
    generatedAt: stampMs,
    shiftDate: 'Sat, Sep 13',
    outgoingTech: 'J. Hamilton',
    incomingTech: 'Night Lead',
    status: 'saved',
    autoSummary: 'fixture',
    notes: '',
    completedItems: [], openItems: [], watchItems: [], opticSnapshot: [],
    phaseProgress: { racksComplete: 0, racksTotal: 1, racksBlocked: 0 },
    shiftEventCount: 0,
    savedAt: stampMs,
  };
  if (opts.dropSavedAt) delete rec.savedAt;
  return rec;
}

// Reads the gate row the way the .578 follow-up does: label, value text, the warn class, and the
// dot's own computed colour and glow. Site profile is the reference OK row — the fixture confirms
// a profile by default, so it is always a real pass to compare against.
const gateRow = (page) => page.evaluate(() => {
  const out = { rows: {}, count: null };
  Array.from(document.querySelectorAll('#cs-ready-rows .cs-rrow')).forEach((r) => {
    const s = r.querySelectorAll('span');
    const label = s[1] ? (s[1].textContent || '').trim() : null;
    if (!label) return;
    const dot = r.querySelector('.cs-hdot');
    const cs = dot ? getComputedStyle(dot) : null;
    out.rows[label] = {
      val: s[2] ? (s[2].textContent || '').trim() : null,
      warn: r.className.indexOf('warn') !== -1,
      na: r.className.indexOf('na') !== -1,
      bg: cs ? cs.backgroundColor : null,
    };
  });
  const k = document.getElementById('cs-ready-k');
  out.count = k ? (k.textContent || '').trim() : null;
  return out;
});

const render = (page) => page.evaluate(() => {
  if (typeof showMode === 'function') showMode('command');
  if (typeof cmd_render === 'function') cmd_render();
});

async function readGate(phantom, page, seeds) {
  await phantom.boot({ seed: seeds });
  await render(page);
  await page.waitForTimeout(1200);
  return gateRow(page);
}

function expectOpen(g, why) {
  const row = g.rows['Handoff started'];
  expect(row, 'the Handoff started row did not render at all').toBeTruthy();
  expect(row.val, why).toBe('OPEN');
  expect(row.warn, why + ' — the row did not take the warn treatment').toBe(true);
  // ⛔ The dot must not read as a pass while the text says OPEN. This is the .578 assertion.
  expect(row.bg, why + ' — the dot still renders the OK colour')
    .not.toBe(g.rows['Site profile'].bg);
}

test.describe('63 — the handoff gate answers "this deployment, this work period"', () => {
  test('CASE 1 · an EMPTY LIST is not a handoff — the gate reads OPEN', async ({ phantom, page }) => {
    test.setTimeout(180000);
    // ⛔ THE ORIGINAL DEFECT IN ONE LINE: JSON.parse('[]') is [], and !![] is TRUE.
    const g = await readGate(phantom, page, seed({ phantom_handoff_v1: '[]' }));
    console.log('63 case 1:', JSON.stringify(g.rows['Handoff started']));
    expectOpen(g, 'an empty handoff list satisfied the gate');
  });

  test('CASE 2 · a handoff for ANOTHER deployment never satisfies the gate', async ({ phantom, page }) => {
    test.setTimeout(180000);
    const fresh = Date.now();
    const g = await readGate(phantom, page, seed({
      phantom_handoff_v1: JSON.stringify([handoffRecord(DEP_B, fresh)]),
    }));
    console.log('63 case 2:', JSON.stringify(g.rows['Handoff started']));
    expectOpen(g, "another deployment's handoff satisfied the gate");
  });

  test('CASE 3 · a handoff OLDER than the work window does not satisfy the gate', async ({ phantom, page }) => {
    test.setTimeout(180000);
    // 13h against the 12h HANDOFF_WINDOW_MS — the same window handoff_generate builds from.
    const stale = Date.now() - (13 * HOUR);
    const g = await readGate(phantom, page, seed({
      phantom_handoff_v1: JSON.stringify([handoffRecord(DEP, stale)]),
    }));
    console.log('63 case 3:', JSON.stringify(g.rows['Handoff started']));
    expectOpen(g, 'a handoff older than the work window satisfied the gate');
  });

  test('CASE 4 · a FRESH handoff for the active deployment reads OK, and OPENs again after a switch',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      const fresh = Date.now() - (1 * HOUR);
      const g = await readGate(phantom, page, seed({
        phantom_handoff_v1: JSON.stringify([handoffRecord(DEP, fresh)]),
      }));
      console.log('63 case 4 before switch:', JSON.stringify(g.rows['Handoff started']));
      const row = g.rows['Handoff started'];
      // ⛔ The fix must not strand the gate as permanently unpassable — that is the opposite
      // dishonesty, and it is what an over-eager predicate produces.
      expect(row.val, 'a fresh handoff for the active deployment did NOT satisfy the gate').toBe('OK');
      expect(row.warn, 'a passing gate still took the warn treatment').toBe(false);
      expect(row.bg, 'a passing gate does not render the OK dot colour')
        .toBe(g.rows['Site profile'].bg);

      // Switch the active deployment. The handoff is untouched and still fresh — it simply
      // belongs to a deployment that is no longer the one on screen.
      await page.evaluate((id) => { localStorage.setItem('phantom_active_deployment', id); }, DEP_B);
      await render(page);
      await page.waitForTimeout(1200);
      const after = await gateRow(page);
      console.log('63 case 4 after switch:', JSON.stringify(after.rows['Handoff started']));
      expectOpen(after, 'the gate stayed OK after switching to a deployment with no handoff');
    });

  test('CASE 5 · MALFORMED JSON leaves the gate OPEN — it never throws and never passes',
    async ({ phantom, page }) => {
      test.setTimeout(180000);
      // handoff_loadAll goes through safeGet, which quarantines the bad blob and returns [].
      const g = await readGate(phantom, page, seed({ phantom_handoff_v1: '{not json at all' }));
      console.log('63 case 5:', JSON.stringify(g.rows['Handoff started']));
      expectOpen(g, 'a malformed handoff value satisfied the gate');
      // The card still rendered — a throw here would have taken the whole readiness block out.
      expect(g.rows['Site profile'], 'the readiness card did not survive a malformed handoff value')
        .toBeTruthy();
    });
});

# BATCH 2 — DATA-HONESTY-COMMAND · PHASE 0 RECON (read-only)

> **Provenance:** Phase 0 recon, 2026-09-08, read-only, against main @ 30f3822 (.582). Written by a fork agent under SHIP-HANDOFF-CLOSEOUT-BATCH.md section 2; six source claims spot-checked by the parent session (bw_hasPendingWrites :21640, SYNCED :22143, :contains CSS :59035, pct :23829, cmd_masterRackCount :23762). Nothing here is authorised; each ship needs its own GO (C-5).


**Baseline:** `main` @ `30f3822`, `dct-ios.html` stamped `phantom-v1.14.582`. All line numbers below are against that file; verbatim strings are the anchors.
**Nothing was edited, staged, or committed.**

**Prior decisions folded in** (no `SHIP-HANDOFF-DATA-HONESTY-COMMAND*.md` exists; the record is `PHANTOM-BOARD-NEXT-OPS-v2.md` Q-1 :30-42 and `PHANTOM_CURRENT_STATE.md` :129 `.579` row):
- 2026-09-04: hero blockers cell = **active deployment only**; aggregate never drives it (`.579`, asserted by `98-cmd-census` B4).
- 2026-09-04: readiness gate mixing aggregate/active — **report-only**, spec question: *adopt active-only, or widen the gate to any deployment?*
- 2026-09-04: fresh-device readiness **0% stands** (three gates answerable, count honest). Carried as a spec question only.
- 2026-09-05: **LABEL THE COUNTS — no fix now.** Flags = devices in this rack with a geometry problem, from the Master. Blockers = triaged review issues on this deployment.
- SITE-SYNC (`docs/SHIP-HANDOFF-SITE-SYNC.md` :5, :76, :113, :144): the SYNCED label *"lies today"*; ship order #1 **STATUS-HONESTY** — *"the strip says ON DEVICE / SAVED, never SYNCED, until sync exists. Ships now, no backend. One line."* Its E-4 prerequisite (find the exact line) is satisfied in §6 below.

---

## 0 · The template — the `.579` `na` / em-dash pattern

`cs_renderHero`, `:23823-23835`:
```
  var _blkOk = !!activeDep;
  var _blkN = 0;
  if (_blkOk && typeof deploy_countBlockers === 'function') {
    try { _blkN = deploy_countBlockers(activeDep.id) || 0; } catch (e) { phantom_logErr('cs_renderHero:blockers', e); }
  }
  E('cs-kpi-block').textContent = _blkOk ? String(_blkN) : '—';
  E('cs-kpi-pct').textContent = pct + '%';
  var bcell = E('cs-kpi-block-cell');
  bcell.classList.toggle('na', !_blkOk);
  bcell.title = _blkOk ? '' : 'No active deployment, so this cannot be answered.';
  if (_blkOk && _blkN > 0) bcell.classList.add('hot'); else bcell.classList.remove('hot');
```
CSS `:58973-58974`: `body.rd.cshell .cs-kpi.na { opacity: 0.55; }` · `body.rd.cshell .cs-kpi.na .cs-kpi-n { color: var(--slate); }`
Readiness third state `:23663-23676` (`null` → row `—`, class `na`, excluded from the denominator). Stat row rung-A form `:23522`: `['—', 'RACKS', 'racks', 1]`.
Spec template: `test/e2e/98-cmd-census.spec.js` :562-651 (`blockCell()` reads text + `na` + `hot` + computed slate + opacity 0.55; B1 cold, B2 Master-no-deployment, B3 earned zero, B4 active-only).

⚠ The template's markup has a **cell id** (`id="cs-kpi-block-cell"` :13860). The racks and pct cells do **not** (:13859, :13861 are bare `<div class="cs-kpi">`), so each fix below needs one markup edit to add a cell id, mirroring the blockers cell.

---

## 1 · `:23663-23667` readiness gate — aggregate count behind an active-only gate

**Code (verbatim):**
```
23663:  var hasDeployment = !!activeDep;
23664:  var gates = [
23665:    ['Site profile', !!confirmed],
23666:    ['Master loaded', !!masterLoaded],
23667:    ['No open blockers', hasDeployment ? !(blockerCount > 0) : null],
23668:    ['Handoff started', !!handoffDraft]
23669:  ];
```
`blockerCount` is the **aggregate** from `cmd_render` `:23443-23447` (`deploys.forEach … blockerCount += deploy_countBlockers(d.id)` over **every** deployment). `activeDep` is `nowtab_resolveDep()` `:23449` (newest active/paused/status-less; `deploy_getActive()` wins if in that set).

**Defect:** the gate is *answerable* only for the active deployment but *answers* with every deployment's count. Concrete divergence on one screen: active deployment with 0 blockers + a second deployment with 3 → hero cell (`.579`, active-only) reads **0**, readiness row reads **OPEN**, ring drops 25 points. Same shape as the `.581` Q-c rack-count split, and the `98-cmd-census` `blockerSeed()` fixture (2 on active, 3 on another) already builds this state. The handoff's other reading — deployments present but none active → `—` while blockers exist — is the *gate* being correct and the *count* being out of scope; the fix below makes both consistent.

**Proposed change (NOT applied):**
```
OLD:
  var hasDeployment = !!activeDep;
  var gates = [
NEW:
  var hasDeployment = !!activeDep;
  // v1.14.5xx — THE GATE AND THE COUNT NAME THE SAME DEPLOYMENT. The gate asks 'is there an active
  // deployment'; the count it scored was the AGGREGATE over every deployment (:23443), so the row
  // could read OPEN beside a hero cell reading 0. Same engine as the .579 hero cell: active only.
  // The aggregate `blockerCount` param is deliberately left unread here, as it is in cs_renderHero.
  var _rdyBlk = 0;
  if (hasDeployment && typeof deploy_countBlockers === 'function') {
    try { _rdyBlk = deploy_countBlockers(activeDep.id) || 0; } catch (e) { phantom_logErr('cs_renderReady:blockers', e); }
  }
  var gates = [

OLD:
    ['No open blockers', hasDeployment ? !(blockerCount > 0) : null],
NEW:
    ['No open blockers', hasDeployment ? !(_rdyBlk > 0) : null],
```
**Specs:** `98-cmd-census.spec.js` A-4 block (:446-540) asserts `—`/not-warn with no deployment and not-demoted with one — unchanged and still valid. **Add** one test with `blockerSeed()` modified to 0 on the active + 3 on the other: row must read `OK`, ring must not drop. `12-blockers.spec.js` re-run only (it covers the blocker record, not this row).
**Blast radius:** one function, one gate value; visible only in the divergent state. LOW.
**Owner ruling:** **YES, but a two-option one.** The board parked this as *"adopt active-only, or widen the gate to any deployment?"* Recommendation: **active-only** — Contract A2 (one engine), the hero cell is already ruled active-only, and readiness is the shift's instrument and the shift is the active deployment. Ships on a one-word GO.

---

## 2 · `:23829` `cs-kpi-pct` — an ungated percent

**Code (verbatim):**
```
23770:  var live = !!activeDep;
23771:  var pct = Math.max(0, Math.min(100, activePct || 0));
…
23812:  E('cs-hero-prog').style.display = live ? '' : 'none';
…
23829:  E('cs-kpi-pct').textContent = pct + '%';
```
Markup `:13861`: `<div class="cs-kpi"><div class="cs-kpi-n" id="cs-kpi-pct">0%</div><div class="cs-kpi-k">Complete</div></div>`

**Defect:** with no active deployment `pct` is 0 and the cell prints **"0% Complete"** — a measured-looking zero next to a blockers cell that already says `—`. The renderer's own comment `:23810-23811` already ruled the *bar* dishonest at zero (*"reads as started and stalled"*) and hides it; the number beside it still makes the claim. Exact `.578` class, different value.

**Proposed change (NOT applied):**
```
OLD (markup :13861):
            <div class="cs-kpi"><div class="cs-kpi-n" id="cs-kpi-pct">0%</div><div class="cs-kpi-k">Complete</div></div>
NEW:
            <div class="cs-kpi" id="cs-kpi-pct-cell"><div class="cs-kpi-n" id="cs-kpi-pct">0%</div><div class="cs-kpi-k">Complete</div></div>

OLD (:23829):
  E('cs-kpi-pct').textContent = pct + '%';
NEW:
  // v1.14.5xx — THE PERCENT STOPS CLAIMING A MEASUREMENT IT DOES NOT HAVE. The bar above already
  // hides at zero (:23812) because a 0% bar reads as 'started and stalled'; the number beside it
  // said 0% anyway. Same .579 treatment as the blockers cell: no active deployment, no answer.
  E('cs-kpi-pct').textContent = live ? (pct + '%') : '—';
  var pcell = E('cs-kpi-pct-cell');
  if (pcell) { pcell.classList.toggle('na', !live); pcell.title = live ? '' : 'No active deployment, so this cannot be answered.'; }
```
**Specs:** nothing asserts `cs-kpi-pct` today (grep: only `cs-kpi-block` in `98-cmd-census`). **Add** P1 cold → `—` + `na` + slate + 0.55; P2 `deploymentSeed()` → `NN%`, not `na`. Clone `blockCell()`.
**Blast radius:** one cell, one markup id. LOW.
**Owner ruling:** not needed — the `.579` ruling *"applies to every surface answering that question"* (state :129). Board said *"no ruling sought yet"*; handoff §2 lists it as pre-approved scope. **Ready on GO.**

---

## 3 · `cs-kpi-racks` — a counted "0" with no Master (two surfaces)

**Code (verbatim):**
```
23762:function cmd_masterRackCount() {
23763:  try {
23764:    var m = (typeof window !== 'undefined') ? window._lastPhantomMaster : null;
23765:    return (m && m.racksByCab && typeof m.racksByCab === 'object') ? Object.keys(m.racksByCab).length : 0;
23766:  } catch (_) { return 0; }
23767:}
…
23815:  E('cs-kpi-racks').textContent = String(cmd_masterRackCount());
```
and the Command Lens stat card, `:23519-23523`:
```
23519:  var _mrc = cmd_masterRackCount();
23521:  var stats = (rung === 'A')
23522:    ? [['—', 'RACKS', 'racks', 1], ['—', 'BLOCKERS', 'block', 1], ['—', 'DEPLOYS', 'dep', 1]]
23523:    : [[_cc_pad(_mrc), 'RACKS', 'racks', _mrc === 0], [_cc_pad(blockerCount), 'BLOCKERS', 'block', blockerCount === 0], [_cc_pad(deployCount), 'DEPLOYS', 'dep', deployCount === 0]];
```
Markup `:13859`: `<div class="cs-kpi"><div class="cs-kpi-n" id="cs-kpi-racks">0</div><div class="cs-kpi-k">Racks</div></div>`. `cmd_masterRackCount` has exactly **two** call sites (`:23519`, `:23815`; grep count 3 incl. the definition).

**Defect:** no Master → hero reads **"0 Racks"** under an eyebrow that says *"No Master"*, and the stat card reads **"00 RACKS"** (rung B/C; only rung A gets `—`). Zero racks is a real, honest floor state (Contract A4); *unknown because nothing is loaded* is not zero.

**Two shapes, pick one:**
- **(a) Gate on `masterLoaded` at both render sites** — cheapest, but `masterLoaded` (`:23453`, `master_hasMaster()`) and the count (`window._lastPhantomMaster`) are **two sources for one fact**; a Master the store knows but the window pointer lacks would render an earned-looking 0 behind a true gate. Split-brain shape.
- **(b) The engine says "unknown" — RECOMMENDED.** `cmd_masterRackCount` returns `null` when there is no Master object; both callers render `null` as `—`. One source decides both the gate and the number.

**Proposed change (b) (NOT applied):**
```
OLD (:23765-23766):
    return (m && m.racksByCab && typeof m.racksByCab === 'object') ? Object.keys(m.racksByCab).length : 0;
  } catch (_) { return 0; }
NEW:
    // v1.14.5xx — null, NOT 0, when there is no Master: zero racks is a real floor state, 'nothing
    // loaded' is not a count. Both callers (:23519 stat card, :23815 hero) render null as an em dash.
    return (m && m.racksByCab && typeof m.racksByCab === 'object') ? Object.keys(m.racksByCab).length : null;
  } catch (_) { return null; }

OLD (:23523):
    : [[_cc_pad(_mrc), 'RACKS', 'racks', _mrc === 0], …
NEW:
    : [[_mrc === null ? '—' : _cc_pad(_mrc), 'RACKS', 'racks', !_mrc], …

OLD (markup :13859):
            <div class="cs-kpi"><div class="cs-kpi-n" id="cs-kpi-racks">0</div><div class="cs-kpi-k">Racks</div></div>
NEW:
            <div class="cs-kpi" id="cs-kpi-racks-cell"><div class="cs-kpi-n" id="cs-kpi-racks">0</div><div class="cs-kpi-k">Racks</div></div>

OLD (:23815):
  E('cs-kpi-racks').textContent = String(cmd_masterRackCount());
NEW:
  var _mrcH = cmd_masterRackCount();
  E('cs-kpi-racks').textContent = (_mrcH === null) ? '—' : String(_mrcH);
  var rcell = E('cs-kpi-racks-cell');
  if (rcell) { rcell.classList.toggle('na', _mrcH === null); rcell.title = (_mrcH === null) ? 'No Master loaded, so this cannot be answered.' : ''; }
```
⛔ Trap: `_cc_pad(null)` prints `"0null"` — the stat-card caller **must** land in the same edit as the return change. Both callers are in the diff above; there are no others.
**Specs:** no spec references `cmd_masterRackCount` or `cs-kpi-racks`. **Add** R1 cold → hero `—` + `na`, stat card `—`; R2 `masterSeed()` + `window._lastPhantomMaster` set (the B2 recipe at :615-618) → real count on both. Existing `98-cmd-census` B1-B4 unaffected.
**Blast radius:** a shared helper with two callers, both in the diff. LOW-MED.
**Owner ruling:** not needed for the *fix* (same `.579` class, listed in handoff §2); the (a)/(b) choice is an engineering call, recommendation (b). **Ready on GO.**

---

## 4 · Label the counts — flags vs blockers

**Flags engine** `:20261-20267`:
```
  function deploy_forge_flagCount(id) {
    var n = 0;
    deploy_forge_slots(id).forEach(function (s) {
      if (s.conflict || s.overflow || s.hgtUnknown || s.stray) n++;
    });
    return n;
  }
```
= devices in **one rack** with a **Master-derived geometry** problem. Rendered at: forge3d state pill `deploy_forge_tagState` `:20161-20163` → `racked + '/' + total + ' RACKED' + (flags ? ' · ⚠' + flags + ' FLAGGED' : '')` (called `:20728`, `:21000`); rack chip `:21227-21229` → `(fl ? '⚠ ' : '') + id`.

**Blockers engine** `:42894-42900`:
```
function deploy_countBlockers(deploymentId) {
  var dep = deploy_getById(deploymentId);
  if (!dep || !Array.isArray(dep.reviewIssues)) return 0;
  return dep.reviewIssues.filter(function(i) {
    return i.triage === 'untriaged' || i.triage === 'blocking';
  }).length;
}
```
= review issues on a **deployment record** that are untriaged or ruled blocking. Rendered with the bare word at: hero caption `Blockers` (`:13860`), stat card `'BLOCKERS'` (`:23523`), NBA/assistant strings (`:23487`, `:23931`).

⚠ **Lead, not tasking (out of this item's scope, reported):** the word BLOCKERS is also painted by two *other* engines — Build metrics `['Blockers', m.blockers, …]` `:22353` fed by `bw_metrics` counting **phases with `status === 'blocked'`** (`:21664-21670`), and the Z3 vital `'BLOCKERS'` `:24200` fed by `cmd_rackBlockers` `:24166` (per-rack `r.blockers.length`). And the stat card's BLOCKERS is the **aggregate** while the hero's Blockers is **active-only** — if both paint on the phone that is Q-c again for blockers. **Measure which of these share a screen before choosing labels**; a label that names the source is only honest if the source named is the one feeding it.

**Proposal (wording — owner picks):**

| Surface | Today | Candidates | Recommend |
|---|---|---|---|
| forge3d state pill `:20163` | `⚠6 FLAGGED` | `⚠6 GEOMETRY` · `⚠6 MASTER FLAGS` · `⚠6 FIT` | `⚠6 GEOMETRY` — names what, not who; one word, ⚠ keeps the channel |
| hero caption `:13860` | `Blockers` | `Blockers` (keep) · `Review blockers` · `Open issues` | **keep `Blockers`** — the magenta BLOCKER identity is colour-locked (`:9784`, one colour one meaning); qualify the *scope* instead: title/aria `'Untriaged or blocking review issues on the active deployment'` |
| stat card `:23523` | `BLOCKERS` | `BLOCKERS` · `BLOCKERS · ALL` | depends on the measurement above |

⛔ **Width budget is measured, not assumed:** `:20690-20699` records the pill row clipping at 390 with `0/6 RACKED · ⚠6 FLAGGED`; any longer replacement must be re-measured at 390 in `phone-webkit` before it ships. `GEOMETRY` is one character longer than `FLAGGED`.
**Specs:** no spec matched the exact `FLAGGED` token in this pass, but the forge3d specs read the pill text — `06-composition`, `94-probe-badge` should be re-run.
**Blast radius:** string-only. LOW. **Owner ruling: YES (wording)** — parked.

---

## 5 · Readiness setup gates — "1 of 3 ready" (owner question, not decided)

**Code (verbatim) `:23639`, `:23663-23676`:** four gates — `Site profile`, `Master loaded`, `No open blockers` (`null` without a deployment), `Handoff started`. Denominator = answerable gates; `pct = null` → `—` when none answerable. Count line `:23685-23689` names its denominator: `met + ' of ' + answerable.length + ' ready' + (indet ? ' · ' + indet + ' not applicable yet' : '')`.

**The 33% state, exactly:** profile set, no Master, no deployment → profile ✓, Master ✗, blockers `—` (excluded), handoff ✗ → **"1 of 3 ready · 1 not applicable yet"**, ring 33%. The handoff's *"fresh device"* is really *"profile set, nothing else"*; a truly bare device reads 0 of 3 / 0%, which the owner ruled honest on 2026-09-04.

**The question for John:** is readiness a **shift-setup + floor** instrument (today: profile and Master count toward the ring), or a **floor-only** instrument that reads `—` / "not applicable until a Master loads" during setup?
- **Keep (A):** no change. The count line already says what is and is not applicable; setup steps genuinely stand between the tech and a ready shift; the hero/NBA point at the same next step.
- **Convert (B):** `Site profile` and `Master loaded` become `null` until a Master is loaded (or leave the ring entirely), so the ring stays `—` through setup. Touches `:23664-23669`; `98-cmd-census` A-4 tests (:446-540) assert the `No open blockers` row and `—`, unaffected; the "readiness still RENDERS" test (:389-404) expects `rowCount > 0` — fine either way.

**Recommendation to put in front of him:** **A**. The number is a real count of real gates and it names its own denominator; blanking it through setup removes the only surface that tells a tech *how many* setup steps remain. **Parked — owner rules.** LOW blast radius either way.

---

## 6 · The `SYNCED` label — pre-cleared honesty fix (SITE-SYNC E-4 answered)

**Code (verbatim) — `bw_render`, Build's local execution state strip, `:22130-22145`:**
```
22130:  var st = E('div', 'bw-state');
22131:  st.appendChild(E('span', 'bw-dot'));
22132:  st.appendChild(E('b', null, 'LOCAL ACTIVE'));
22133:  st.appendChild(E('span', 'bw-sep', '|'));
22134:
22135:  // Determine real execution state: network presence + pending writes + save status
22136:  var execState = 'ON-DEVICE';  // default: local operation is live
22137:  var onl = (typeof navigator === 'undefined') || navigator.onLine !== false;
22138:  if (!onl) {
22139:    execState = 'ON-DEVICE · OFFLINE';
22140:  } else if (typeof bw_hasPendingWrites === 'function' && bw_hasPendingWrites()) {
22141:    execState = 'PENDING CHANGES';
22142:  } else if (onl) {
22143:    execState = 'SYNCED';
22144:  }
22145:  st.appendChild(E('span', null, execState));
```
(`:22139` uses the literal escape `·` in source — a replacement string must use the same escape, not a raw `·`.)

`bw_hasPendingWrites` `:21640-21647` is a **placeholder that always returns `false`** (*"For now, this is a placeholder … Future: query the sync queue"*). So the exact condition for `SYNCED` is: **`navigator.onLine !== false`. Nothing else.** `PENDING CHANGES` is unreachable. The `else if (onl)` at `:22142` is always true when reached.
**No cross-device sync exists:** SITE-SYNC `:5` — *"the only network call is the AI proxy; there is no server holding site state"*; `bw_hasPendingWrites` confirms no queue. **Confirmed.**
⚠ Also dead, lead only: the CSS `:59034-59037` colours the dot by `:has(> span:last-child:contains("PENDING"))` — `:contains()` is not a CSS selector in any engine, so the gold/red variants never apply and the dot is **always green** (`--ok`, `:59032`). The strip therefore reads green-dot · `LOCAL ACTIVE` · `SYNCED` on every online phone. Not this ship; noted for the dead-CSS ledger.

**Is the wording already ruled?** Yes, direction is owner-approved: SITE-SYNC §7.1 *"the strip says ON DEVICE / SAVED, never SYNCED, until sync exists"*; §4 gives the *future* vocabulary (`ON DEVICE · OFFLINE` / `SYNCING n` / `SYNCED · time` / `SYNC FAILED · retrying`) which only applies once sync exists. Board :120-133 confirms it is a Contract B10 fix allowed out of order, and that E-4 (this section) was the only prerequisite.

**Proposed change (NOT applied) — one line:**
```
OLD:
  } else if (onl) {
    execState = 'SYNCED';
  }
NEW:
  } else {
    // v1.14.5xx — SITE-SYNC ship 1 (STATUS-HONESTY). 'SYNCED' meant 'online with no pending local
    // writes' and nothing else: there is no server, no queue, and no other phone to be synced with
    // (bw_hasPendingWrites is a placeholder returning false). The strip says what is true — the
    // work is saved on this device — and claims sync only when sync exists.
    execState = 'ON-DEVICE · SAVED';
  }
```
Candidates: `ON-DEVICE · SAVED` (recommended: the ruling's own words, matches the existing OFFLINE string's shape, is an execution-confidence claim not a network one) · `SAVED LOCALLY` · bare `ON-DEVICE`.
**Specs:** nothing asserts `SYNCED`, `bw-state`, `ON-DEVICE` or `PENDING CHANGES` (grep clean). **Add** one pinned test: Build renders, `.bw-state` last span never contains `SYNCED`; reads `ON-DEVICE · SAVED` online and `ON-DEVICE · OFFLINE` with `context.setOffline(true)`.
**Blast radius:** one string on one strip. LOWEST. **Owner ruling: already given (SITE-SYNC §7.1, board :120). Ready on GO — and pre-cleared to ship early.**

---

## Proposed ship split (one visible change each, in order)

| # | Ship | Item | Status |
|---|---|---|---|
| 1 | **STATUS-HONESTY** — strip reads `ON-DEVICE · SAVED`, never `SYNCED` | §6 | ready, pre-cleared, 1 line + 1 spec |
| 2 | **PCT-NA** — `Complete` cell reads `—` with no active deployment | §2 | ready on batch GO, 2 edits + spec |
| 3 | **RACKS-NA** — `cmd_masterRackCount` → `null`, hero + stat card read `—` with no Master | §3 | ready on batch GO, 4 edits + spec (both callers in one diff) |
| 4 | **READY-ACTIVE** — readiness blockers gate scores the active deployment only | §1 | needs one-word ruling (active-only vs widen); recommend active-only |
| 5 | **LABEL-COUNTS** — pill/caption wording | §4 | parked: owner wording + a 390px re-measure + the multi-engine BLOCKERS lead |
| — | Readiness setup gates | §5 | parked: owner question, recommendation A (keep) |

Ships 1-3 touch three different surfaces and different lines and can be built back-to-back on one GO; whether they may stack unverified is governed by the max-ONE-unverified-ship gate versus BATCH-OODA's in-force status — the parent's call, not this recon's.

**One line:** §6, §2, §3 are ready to build on GO; §1 needs a one-word ruling (recommend active-only); §4 and §5 are parked on owner wording/product rulings.

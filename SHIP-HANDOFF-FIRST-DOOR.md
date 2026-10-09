# SHIP-HANDOFF-FIRST-DOOR.md
**Ship A: the first screen answers one question. Ship B: one door per duplicated action. The two ships that change how PHANTOM feels this week.**

- **Status:** APPROVED — owner-directed. Two ships, sequenced A → B. Both are prerequisites that make IA-SHIFTNAV v2 Phase 1 land on a clean house.
- **Baseline:** v1.14.570 (live release, owner-walked). All anchors from verified source. No assumed anchors. Counts below are from a grep of the served file and are leads for Phase 0, not substitutes for it.
- **Governing docs:** SHIP-HANDOFF-IA-SHIFTNAV-v2.md §0 (rack is the unit of work) + Addendum A (door budget) + Addendum B (Build worked example). This spec does not change those rulings; it front-loads the two cheapest wins from them.
- **Owner statement (verbatim intent):** "We have all the pieces of furniture in the house but everything's not organized. Make the app as easy as possible. A tech opens it for the first time and has to know: what am I doing, where am I going."

---

## §0 · SESSION SETUP — DO THIS BEFORE READING FURTHER

1. **Activate graphify.** Run `graphify . --update`. Report the timestamp on `graphify-out/wiki/index.md`. If graphify did not run, **stop and say so** — do not proceed on a stale graph. (If `graphify claude install --project --strict` was not yet applied, apply it now so strict mode blocks raw source reads until the graph exists.)
2. **Confirm Playwright is live.** Run `/mcp` and report the `playwright` server status. List every tool named `mcp__playwright__*`. If none load, stop and report — the device-verify precheck below depends on them.
3. **Confirm the iPhone profile.** The Playwright server must have the `playwright-iphone` entry (`--browser webkit --device "iPhone 15"`). Default Chromium desktop is the wrong viewport and wrong engine; a checklist run there is a false pass. If the entry is missing, stop and report.
4. **Confirm state.** `PHANTOM_CURRENT_STATE.md` reads `.570 VERIFIED`. This spec, IA-SHIFTNAV v2 + Addendums A/B, PUNCHLIST-0901, and MASTER-TRUTH are in the repo. Import anything missing from Downloads verbatim with a byte/sha note.

**Then stop and report §0 results before any Phase 0 work.**

### Agents for this job

| Agent | Role on this spec | When |
|---|---|---|
| **Playwright Planner** | Build the stranger-test plan (§5) from the ship definitions — a structured list of "cold tech" tasks with expected tap counts. | Before Ship A patching |
| **Playwright Generator** | Turn the plan into runnable tests at iPhone 15 / WebKit against the live GitHub Pages URL: first-screen content, tap counts to reach a rack, one-door-per-action assertions. Runs the device-verify precheck **before** the owner's phone. | After each ship's edits, before handing to owner |
| **Playwright Healer** | Ship B deletes buttons and re-points handlers — selectors WILL move. Healer repairs tests whose selectors broke, but only after confirming the *intent* still holds (a test re-pointed to a weaker assertion is decoration, not a test). | During/after Ship B |
| **Claude Code (you)** | Evidence, patches, grep gates, lockstep stamping, door ledger. Browser tools stay with the Playwright agents — you do not drive the browser yourself. | Throughout |

Standing rule: Playwright agents get **browser tools only, no code access**. They observe and report; you edit.

---

## §1 · WHAT THE COLD WALK FOUND (context, not instructions)

Served file at .570: **68 distinct uppercase button labels**, 6 top-level page ids (`pg-cmd`, `pg-master`, `pg-work`, `pg-ref`, `pg-sop`, `page-search`), a 4-slot dock, sub-tabs, tool chips. The core working surface — a rack, once you're on it — is good. Everything *around* it has 3–7 entrances, and the first screen has zero answer to "what do I do."

Duplicated-action families observed in the served markup (button-text occurrences; Phase 0 verifies each):

| Family | Labels seen | Count |
|---|---|---|
| **Get data in** | LOAD MASTER FILE (1), LOAD MASTER (3), MASTER FILE (1), IMPORT FILE (2), IMPORT PORT LIST (1), IMPORT (3), CSV FILE (1), INGEST ANOTHER (2) | 14 buttons, ~8 labels |
| **Scan** | SCAN / ADD (1), SCAN (4), AI ID (1), ASSET (1) | 7 |
| **Print** | PRINT / SAVE AS PDF (1), PRINT / PDF (1), PRINT LABEL (1) | 3 |
| **Report a problem** | SAVE BLOCKER (1), BLOCKER (2), SAVE ISSUE (1), FORCE (1), OVERRIDE (1) | 6 (+ISOLATE, buried) |
| **Handoff** | HANDOFF button (fleet), Shift tab, "FROM LAST HANDOFF" card | 3 surfaces |
| **Profile / identity** | first-run nameplate + `set up profile` ×7 in source, 3 visible on first Command | 3 visible |

A tech's actual day, and how many entrances each step has today: (1) what's my assignment — **0**; (2) load/confirm Master — **~8**; (3) get to a rack — **5** (search, rack list, floor map, 3D aisle, chips); (4) work the rack — **1, good**; (5) something's wrong — **6**; (6) hand off — **3**.

---

## §2 · SHIP A — THE FIRST SCREEN ANSWERS ONE QUESTION

### Intent
After the name gate, the first thing a tech sees tells them exactly what to do next, in one sentence, with one tap. Nothing else competes for the eye above the fold.

### The rule
The first screen has exactly **two possible states** and shows exactly one of them:

- **No Master loaded:** one headline — `Load a Master to start.` — one full-width button `LOAD MASTER`. Below the fold: a one-line "what's a Master" note in aisle language. **Nothing else.** No readiness score, no profile nag, no clocks, no empty cards, no "continue deployment," no next-best-action.
- **Master loaded:** one headline — `N racks on <site>. Tap one.` (real N from the Master, real site) — followed immediately by the rack picker (the list; map/aisle are one tap further as *views of the picker*, not parallel destinations). Your assigned rack(s), if any, pinned to the top. Blockers count shown only if > 0.

Identity (name, shift, site) is **not** on the first screen. It lives under SYS (per IA-SHIFTNAV v2 §1, and P-6 for Master management). If site is unset, the "N racks on <site>" line reads `N racks · site not set` — honest, not nagging.

### Phase 0 — Evidence (read-only, report before patching)
- **A-E1.** Quote the current first-run sequence: globe → tap-to-enter → nameplate → Command. File:line for each transition and what state each writes. Confirm the tap gate stays (owner ruling: BOOT-TAPGATE stands).
- **A-E2.** Quote every element rendered on `pg-cmd` in the no-Master state, in DOM order, with the function that renders each. This is the list Ship A removes/moves. Include: Shift Readiness (%), "set up profile" (all 3 visible instances), NBA/next-best-action, Local System State card, build rail, Field Ops, tool chips, clocks.
- **A-E3.** Quote every element rendered on `pg-cmd` in the Master-loaded state, same format.
- **A-E4.** Where the rack picker lives today (rack list rendering, search, floor map) and whether it can be mounted on `pg-cmd` without duplicating its renderer. (One picker, one renderer — if `pg-cmd` and Build both need it, they call the same function.)
- **A-E5.** What `Shift Readiness %` computes from and who reads it. Owner ruling from DATA-HONESTY-COMMAND: a score for an unset state is not a number — it goes. Confirm nothing else depends on it.
- **A-E6.** Every existing test that asserts on first-screen content (Playwright e2e specs). List them — Healer will need this.

**Stop. Report. Owner reviews A-E2/A-E3 lists and confirms what moves where before patching.**

### Ship A edits (after owner confirms the lists)
- **A-S1.** `pg-cmd` no-Master state renders exactly the two-element layout above. Every other element from A-E2 is **removed from pg-cmd** — not hidden, removed — and either (a) re-homed where IA-SHIFTNAV v2 §1 says it belongs (identity → SYS; Field Ops/tools → the rack or Phase 1 ruling), or (b) deleted if it has no home (readiness score). Each removal is listed in the ship note with its destination or "deleted — no home."
- **A-S2.** `pg-cmd` Master-loaded state renders the headline + the rack picker (A-E4, same renderer as Build's). Assigned racks pinned. Blockers count conditional on > 0.
- **A-S3.** Nameplate/identity moves to SYS. The name gate still fires on first run (it's how the tech's name gets on the log) but it writes to SYS and lands on the two-state first screen, not on a nameplate hero.
- **A-S4.** `set up profile` appears **once**, under SYS, and never as a first-screen CTA.
- **A-S5.** Cold Aisle Filter: headline ≥ 20px, one button ≥ 56px tall full-width, rack picker rows ≥ 44px. Nothing requires precision.
- **A-S6.** Data honesty: real N, real site or "site not set," no fake readiness, no CTA that implies a job when there's no Master.
- Three-stamp lockstep. Grep gate: `Shift Readiness` = 0 on `pg-cmd`; `set up profile` = 1 in the whole file (SYS only); no `pg-cmd` element without a listed destination.

### Ship A door ledger
| Before | After |
|---|---|
| First screen: ~9 competing cards/CTAs, 0 clear next step | 1 headline + 1 action (no Master) / 1 headline + picker (Master) |
| Identity: nameplate hero + 3 profile CTAs | SYS, once |
| Readiness score | deleted |
Net: opens 0, closes ~8.

---

## §3 · SHIP B — ONE DOOR PER DUPLICATED ACTION

### Intent
Every action a tech performs has exactly one button, one label, one place. The function stays; the extra entrances go. This is mechanical — no new features, no redesign — which is why it can ship fast.

### The five families and the owner's ruling for each

**B-1 · Get data in → one door: `LOAD MASTER`**
- Lives under **SYS → MASTER** (this is P-6). Shows loaded Master name + saved date + source; actions: **Load / Replace** and **Delete (PIN)**.
- Every other entrance — LOAD MASTER FILE, MASTER FILE, IMPORT, IMPORT FILE, CSV FILE, INGEST ANOTHER — **closes**. If any of them imports something that is *not* a Master (e.g. IMPORT PORT LIST imports a port list), Phase 0 says so and it becomes a rack-scoped action on the rack that owns the port map, not a top-level button. Owner rules on any ambiguous one.
- Aisle label: `LOAD MASTER`. One string, everywhere it's referenced.

**B-2 · Scan → one door: `SCAN`**
- One scan affordance. It appears in exactly two contexts, same component: on the **rack picker** (scan a rack label to open it) and on the **rack** (scan a device into this rack). Same button, context decides what it does.
- SCAN / ADD, AI ID, ASSET **close** as separate buttons. If AI ID is "identify a device by photo," it becomes a *mode inside* SCAN, not a sibling. Phase 0 quotes what each does.

**B-3 · Print → one door: `PRINT`**
- One PRINT action per context that can print. PRINT / PDF and PRINT / SAVE AS PDF are the same action with two labels → one label. PRINT LABEL stays only if it prints something different (a rack/device label vs. a report); if so it's `PRINT` with a type chooser, not a separate button.

**B-4 · Report a problem → one door: `REPORT`**
- One affordance on the rack: `REPORT`. Inside it, the tech picks the type: **Blocker · Issue · Discrepancy**. SAVE BLOCKER / BLOCKER / SAVE ISSUE **close** as separate buttons.
- **FORCE and OVERRIDE are not "report a problem" — they are gate actions.** They stay on the phase gate where they live, but Phase 0 confirms they are (a) on the phase, not floating, and (b) visibly distinct from completing a phase cleanly (this is MASTER-TRUTH R-2's concern — coordinate, don't duplicate).
- **ISOLATE** is its own door on the rack (IA-SHIFTNAV v2 §1 ruling), red, full-width, confirm step. It is not inside REPORT and not in a tool row. Ship B does not move ISOLATE; it only confirms it isn't accidentally grouped with the report family.

**B-5 · Handoff → one door: `HANDOFF`**
- One fleet-level HANDOFF (the shift-level door IA-SHIFTNAV v2 §1 keeps). The "FROM LAST HANDOFF" card on the rack is *input* (what the previous tech left), not a second door — it stays as a read-only card. The Shift tab and the Build HANDOFF button are the same action; one survives, at the place Phase 0 shows techs actually reach it from.

### Phase 0 — Evidence (read-only, report before patching)
For **each family** above, produce a table: every button/label instance → file:line → the handler it calls → what that handler actually does. Group instances that call the same handler (true duplicates) vs. instances that do something different under a similar name (needs a ruling). Then:
- **B-E1.** For each family, name the **one surviving door**, its location, and its handler.
- **B-E2.** For each closing instance, confirm no other code path depends on its element id/class (grep). List any that do — those need re-pointing in the same edit.
- **B-E3.** Every Playwright test that clicks any of the closing buttons. Healer's worklist.
- **B-E4.** Any family member whose function is genuinely distinct (IMPORT PORT LIST, PRINT LABEL, AI ID) — quote it and propose where it lives under the rack model. Owner rules.

**Stop. Report. Owner rules on B-E4 before patching.**

### Ship B edits (after rulings)
Ship B is executed as **one ship per family** (B-1 through B-5), each its own version, each device-verified, in the order listed — smallest first is B-3 (print), then B-2, B-4, B-5, B-1 (Master, because it's coupled to P-6 and the PIN flow).
- Per family: delete the closing buttons (remove markup + dead handlers, not `display:none`), point any dependent code at the surviving door, single string for the surviving label.
- Grep gate per family: every closed label = 0 occurrences as visible button text; surviving label appears only at its one door (or its two contexts, for SCAN).
- Three-stamp lockstep per family ship. Door ledger per ship.
- Healer runs after each family ship; re-pointed tests are mutation-checked (suppress the surviving door → test must fail).

### Ship B door ledger (target)
| Family | Doors before | Doors after |
|---|---|---|
| Get data in | ~8 | 1 (SYS → MASTER) |
| Scan | 4 | 1 (two contexts) |
| Print | 3 | 1 |
| Report a problem | 6 | 1 REPORT (+ ISOLATE separate, FORCE/OVERRIDE on the gate) |
| Handoff | 3 | 1 (+ read-only card) |
| **Total** | **~24** | **5** |

---

## §4 · SEQUENCING

1. §0 setup → report.
2. Ship A Phase 0 → owner confirms lists → Ship A edits → Playwright Generator precheck at iPhone 15/WebKit → owner phone verify → stamp.
3. Ship B Phase 0 (all five families in one evidence pass) → owner rules B-E4 → family ships B-3, B-2, B-4, B-5, B-1 in that order, each stamped.
4. **MASTER-TRUTH Phase 0 runs in parallel** (separate handoff) — it is evidence-only and doesn't touch the same anchors. Do not interleave its patches with A/B.
5. IA-SHIFTNAV v2 Phase 1 starts only after A and B are stamped. Its §6 comprehension gate still applies.

No self-scheduling. Stop after each Phase 0 and after each ship. The owner promotes.

---

## §5 · THE STRANGER TEST (acceptance bar for A and B)

Planner builds these as a plan; Generator runs them at iPhone 15 / WebKit against the live URL; owner repeats them by hand on the phone. Each task records **taps** and **seconds**; the "after" column is the pass bar.

| # | Task (given to a tech who has never seen PHANTOM) | Today (measured in Phase 0) | Pass bar |
|---|---|---|---|
| T1 | Open the app for the first time. Without help, do the one thing the screen tells you to do. | — (no clear instruction) | ≤ 1 tap after the name gate; the screen names the action |
| T2 | With a Master loaded: get to rack S3:171. | measure | ≤ 2 taps from first screen |
| T3 | On rack S3:171, report that a device is missing. | measure | ≤ 2 taps from the rack; one REPORT door |
| T4 | Load a different Master. | measure | ≤ 3 taps; only one place to do it |
| T5 | Scan a device into the rack you're on. | measure | ≤ 1 tap from the rack; one SCAN |
| T6 | Print the rack report. | measure | ≤ 2 taps; one PRINT |
| T7 | Hand the shift off. | measure | ≤ 2 taps; one HANDOFF |
| T8 | (Carried from Addendum B) You're told S3:171 has been on POWER too long — get to that warning. | 4 screens | ≤ 2 taps |

A ship does not stamp if its task regresses. Ship A must clear T1 and T2. Each Ship B family must clear its own task.

---

## §6 · GUARDRAILS

- **Re-homing is not deleting.** Every closed door names the surviving door that now carries its function, in the ship note and the ledger. The only things deleted outright are things with no home (readiness score, duplicate labels for the same handler).
- **Remove, don't hide.** No `display:none` retirements. Markup and dead handlers go; grep gates prove it.
- **One string per action.** The surviving label is a single constant, referenced everywhere — no near-duplicate labels can grow back.
- **Cold Aisle Filter** on every surviving door: ≥ 44px targets, glove-readable text, no precision.
- **Data honesty** on the first screen: real numbers or an honest "not set"; no scores for unset state; no verbs implying a job that doesn't exist.
- **Evidence before patches. One visible change per ship. Surgical edits against verified anchors. Three-stamp lockstep. Owner promotes. iPhone verify gates every stamp. Playwright precheck runs before the owner's phone, never instead of it.**
- **Gauge rule:** a gauge that lies is worse than no gauge. **Door rule:** a ship that opens a door closes at least one; two paths to the same fact is a defect. **Master rule (from MASTER-TRUTH):** the Master is the single source of truth; nothing re-derives its own count.

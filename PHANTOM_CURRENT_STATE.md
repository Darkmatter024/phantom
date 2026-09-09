# PHANTOM — CURRENT STATE

⭐ **THE SINGLE SOURCE OF TRUTH FOR STATE.** Live version, milestone, defects and verify debt are
recorded here and **nowhere else**. Before this file took that role, five documents each claimed a
different live version and none of them was correct. If another doc disagrees with this one, that
doc is stale — fix the doc, do not fork the fact.

**Last updated: 2026-09-09, after `v1.14.585`.
✅ **ZERO UNVERIFIED SHIPS (2026-09-09).** `VERIFIED` = `main` = `release` = served = **`.585`** (`f95ece0`). ✅ **`.585` PASSED ON DEVICE 2026-09-09** — the RESTORE confirm read as designed (`Replaces on this device:` with per-section counts, ending `This will OVERWRITE current data.`), Cancel, nothing changed — and was adjudicated by **the owner with `verify.ps1 585 PASS`** (stamp `f95ece0` carrying `VERIFIED` alone, `release` level with `main`, `SERVED: phantom-v1.14.585`; confirmed from `origin` and the served stamps before this row was written). Ran under the **NAMED EXCEPTION** (`OWNER-RULINGS.md` 2026-09-09 PROMOTE ORDER): serve → see → verify one more time because no staging surface for `main` existed; **not precedent** — from here the canonical order is verify → stamp → promote, runnable once staging exists. ⚠ Two `verify.ps1 585 PASS` attempts before the promote were refused at NOT-SERVED and wrote nothing — the guard, not a fault. `.585` = RESTORE HONESTY (`3edf586`, Batch 2 P0 sub-ship 2; gate 7/7, review PASS, spec 52 8/8 RED→GREEN); evidence `docs/BATCH2-585-EVIDENCE.md`. ⛔ **NOTHING AFTER `.585` SHIPS UNTIL THE STAGING SURFACE EXISTS** (`docs/INFRA-STAGING-CLOUDFLARE-PAGES.md`, the owner's steps) — the tools and the doctrine would be wrong until the script-only follow-up lands. ✅ **`.584` PASSED ON DEVICE 2026-09-09, BOTH LOOKS** — dismissed sheet → the magenta `BACKUP NOT SAVED — share sheet dismissed — tap to retry` strip stays and no download prompt follows; retry → Save to Files → the strip clears and the toast names the time — and was adjudicated by **the owner with `verify.ps1 584 PASS`** (stamp `d02a081` carrying `VERIFIED` alone, promoted, `SERVED: phantom-v1.14.584`; confirmed from `origin` and the served `version.json` + `sw.js` before this row was written). `.584` = BACKUP HONESTY (`6439dbc`, DATA-HONESTY-COMMAND Batch 2 P0, owner GO 2026-09-09; `phantom-ship-gate` 7/7, `phantom-rd-reviewer` PASS after one red-vs-magenta correction, spec `51-backup-honesty` 6/6 RED→GREEN); evidence `docs/BATCH2-584-EVIDENCE.md`. **Nothing blocks a `.585` — the next ship needs an owner GO, not a gate (queue 1b, restore honesty).** ✅ **`.583` PASSED ON DEVICE 2026-09-09** — SYS reports `.583`, Build's strip reads `LOCAL ACTIVE | ON-DEVICE · SAVED` — and was adjudicated by **the owner, from his terminal, with the first live run of `tools/verify.ps1 583 PASS`** (stamp `b9d7de9` carrying `VERIFIED` alone, `release` `944ba1d → b9d7de9`, `SERVED: phantom-v1.14.583`; confirmed from `origin` and the served `version.json` + `sw.js` before this row was written). One keystroke where there were two commands and a push. ⚠ **THE SAME SESSION CAUGHT A FALSE PASS FIRST (D-1):** on 2026-09-08 a `.583` PASS was reported before any promote had run — `origin/release`, local `release`'s reflog, all three served stamps and this box's PowerShell history all still read `.582`, so nothing was stamped; the phone turned out to be on `.582`, whose strip cannot read SAVED. **A claim cannot outrank a mismatch, and the reading order is origin → Pages → then the report.** `.583` = STATUS-HONESTY, one string on Build's execution strip; evidence `docs/BATCH1-583-EVIDENCE.md`. **Nothing blocks a `.584` — the next ship needs an owner GO, not a gate.** *(Prior state of this row: `VERIFIED` = `.582` (`9a9d6db`); `.583` on `main` (`aa4d437`) awaited promote → device → verify.)* ✅ **`.582` PASSED ON DEVICE 2026-09-08** (*Active rack* card up, DIAGNOSTICS reads `PREVIEW/MOUNT_NOT_DRAWING` — candidate A on hardware, §8) and was stamped VERIFIED by **Claude Code running `tools/stamp.ps1` on the owner's explicit in-session instruction** after his reported pass — the doctrine's *"except when John says stamp it"* carve-out, recorded so the actor is credited (D-2); the owner's own stamp attempt earlier that hour had not written. `.582` was a DIAGNOSTICS-ONLY instrument (RACK-PREVIEW-CONTEXT Phase 1, Option 5 of `docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md`, owner-ruled 2026-09-08); its harness precheck is green (`49-preview-trace.spec.js` **4/4** on `phone-webkit`) and the mechanical ship gate is PASS. ⛔ **THE VERIFY ORDER THIS ROW STATED UNTIL 2026-09-08 WAS WRONG — `main` WAS NEVER SERVED.** Pages was traced to `release` by content match and by a last-modified six minutes after `release`'s own commit. *"Device-verify against `main` → stamp → promote"* was therefore unexecutable, and it is how `.581` came to be stamped VERIFIED off a dry-run misread with no phone having seen it. **Owner ruling C, 2026-09-08 (`30f3822`): the honest order is PROMOTE → device-verify on the Pages URL → STAMP either way**, and `tools/promote.ps1` Guard 4 now adjudicates the version the phone HAS — promoting `.583` while `.582` sits unruled is still refused. ⭐ **`.581` DID REACH A PHONE ON 2026-09-08 AND STAYS VERIFIED:** BUILD's rack preview was blank after a Master load with a canvas present and nothing recorded; the owner ruled it the iOS-WebKit async GPU-grant class, pre-existing since `.391`, with every function in the preview chain byte-identical `.580`→`.581`. ⛔ **`.582` MUST BE ADJUDICATED BEFORE ANY `.583` EXISTS**, and the gate is mechanical, not a promise: `phantom-guard.js` `checkVerifiedGate` compares `HEAD:version.json` against `VERIFIED`'s first token and refuses any `version.json` commit while they differ. ✅ *(The refusal that held `.581`'s false `version.json` sentence in place was lifted by the `.581` stamp; `.582`'s bump carries the corrected note.)* ⭐ **THE `.581` SHIP COMMIT IS MIS-TITLED IN HISTORY AND A READER MUST NOT CONCLUDE `.581` NEVER SHIPPED:** `f32e49a` reads *"stamp: phantom-v1.14.580 VERIFIED"* but carries the whole `.581` ship — `dct-ios.html +36/−9`, `sw.js`, `version.json` — because the old `stamp.ps1` committed everything staged. **Fixed forward by `694ef3b`** (*"stamp.ps1 commits the register file and nothing else"*), which also proved the partial-commit technique in a throwaway repo; the misleading commit stands because rewriting history is forbidden. `git log --oneline -- version.json` is therefore not a reliable ship ledger — **these rows are.** ⭐ **FIRST-DOOR Ship A is COMPLETE AND FULLY ADJUDICATED** across `.572`–`.578` (`.572` FAILED and was repaired by `.573`; `.576`, `.577` and `.578` each passed on device). **Nothing blocks a `.579`** — the next ship needs only an owner GO, not a gate. ⚠ **AND THE GATE HAD TO ENFORCE THAT ONCE ALREADY:** A-4 was BUILT on `.576` while `.576` was still unadjudicated — the stacking condition the rule exists to prevent. Nothing stacked in the repo because the guard refused the commit, but **the flag should have come from the session before starting, not from the hook after finishing.** ⭐ **`VERIFIED` IS TWO STAMPS BEHIND IN GIT** (`.576` committed vs `.578` in tree) — **committing it is the owner's, from a terminal**: the guard refuses `VERIFIED` on the agent path by design. **The working-tree file is what the guard reads, so ships are not blocked; the committed HISTORY is what lags.**
⛔ **`.577` NEVER REACHED THE `VERIFIED` FILE'S OWN HISTORY, AND A READER MUST NOT CONCLUDE IT WAS SKIPPED.** It was stamped into the working tree, it is what unblocked the `.578` commit, and it was then overwritten by the `.578` stamp before its commit was typed — so `git log VERIFIED` jumps **`.576` → `.578`** with no `.577` in between. ⭐ **The adjudication is NOT lost: `.577`'s device pass is committed in `91f8196`.** ⚠ **THE DURABLE POINT: `VERIFIED` IS A ONE-LINE GATE INPUT, NOT A PER-VERSION LEDGER.** It records the latest adjudication only, its history is lossy whenever two stamps land between commits, and **the ship rows in this file are the ledger.** Do not reconstruct verify history from that file alone.
device-verified in both houses as it landed. ⭐ **LEGACY-RETIRE IS COMPLETE** (owner ruling
2026-08-29): stages 0,1,2,3,4,6,7 shipped across `.533`–`.554`; stage 5 pulled to IA-SHIFTNAV;
stage 8 permanently deferred. ⭐ **FORGE-WORKER-CUTOVER IS COMPLETE** — forge.html holds no
credential and sends no key. ⭐ **Both standing findings that were open at `.554` are CLOSED**:
`.555` took the pg-triage writers, `.556` fixed the multi-tab warning.
⭐ **`.557` CLOSED THE RACK-DETAIL BUG HUNT** (board Q-1) — the aisle no longer takes the rack with
it. ⚠ **But the hunt's own honest bound stands and must not be lost:** `.557` fixes *a* defect that
emptied the elevation; it was **never proven to be the failure behind sandbox gate 2**. If the rack
still misbehaves on device, that is a SEPARATE hunt, not a regression of this ship.
⭐ **`.558` GAVE BUILD ITS TOOL DOOR BACK — it had not existed since `.473`, and nothing said so.**
`.473` removed the `ops_init()` call and wrote that OPS would be *"triggered on-demand when user
taps the OPS control"*; **that trigger was never wired**, so `ops_init` had ZERO callers for 85
versions and the owner ruling of 2026-08-19 (Build's tool door IS the OPS row) was silently not in
force. ⛔ **AN INTENDED DEFERRAL LANDED AS A DELETION.** ⭐ **THE SESSION'S DURABLE LESSON, TWICE
OVER:** `.531` and `.473` both had a stated intent their bytes did not carry, and **neither threw**.
The absence of a control is indistinguishable from a control you have not reached yet. Both were
found by MEASURING FOR the thing, never by waiting for a failure.
⭐ **`.559` IS IA-SHIFTNAV SHIP 1 — the tenth tool, and the name collision.** ISOLATE joins the OPS
row (it was in `DEPLOY_TOOLS` and the Command Deck but not in `OPS_PANELS_CONFIG`, so it was the one
tool the owner-accepted tap trade never paid off for), and the deployment-scoped optic surface
becomes **OPTIC LEDGER** while the Tools **reference** keeps **OPTICS**. ⛔ **SCOPE WAS CORRECTED BY
MEASUREMENT BEFORE ANY EDIT:** Phase 1 wrote Ship 1 as *"the ten OPS tools gain a findable entry
point"*, but `.558` had already delivered that for NINE — the row sits at `top:94px`, on-screen with
zero scrolling, and two taps produced nine panels at depth 0. **Re-shipping that would have been
churn**, so the ship was narrowed and the narrowing was reported rather than performed quietly.

⛔ **BOARD v2 IS IMPORTED, AND ONE OF ITS ITEMS IS DECLINED.** `PHANTOM-BOARD-NEXT-OPS-v2.md` is in the repo verbatim (5436 bytes, sha256 `ceaa1885…cccb3f`, commit `bbff526`) and is the owner queue of record. ⛔ **O-2c is DECLINED (owner, 2026-09-01).** It asked that ISOLATE get its own door because *"the dangerous tool doesn't live in a laundry row with Blast."* **ISOLATE was traced end to end and is not dangerous:** it writes to exactly one key (`safeStore(ISOLATE_KEY)` — the only such call in the whole `iso_*` family), performs no delete/clear/reset and touches no hardware. It is an 8-step OODA workflow that ends by producing a text escalation packet (`Build packet →`). It is the most **cautious** tool in the row, not the most dangerous — it blocks advancement without a location (`phantom_fatAck('blocked','LOCATION REQUIRED')`), it is explicitly *"READ ONLY from real stores… Never guess"*, and `iso_tierBlocksP2` records `not performed — tier P1` rather than silently omitting. ⭐ **The misread came from the label:** the tile reads `ISOLATE · DOWN-LINK`, which scans as verb-plus-object; it means *fault-isolation workflow, down-link class*. **The only genuinely destructive control nearby is `DELETE DEPLOYMENT` (`:37865`) — different surface, RBAC-locked to Build Lead, behind `deploy_confirmDelete()`, already correct.** ⛔ Styling ISOLATE as destructive was rejected as a data-honesty failure in the opposite direction. ⭐ **RE-RAISED AND RULED AGAIN, 2026-09-01.** `SHIP-HANDOFF-IA-SHIFTNAV-v2.md` §1 asserts ISOLATE *"is dangerous; it gets a deliberate affordance (confirm step, red, full-width)."* **OWNER RULING: ISOLATE STAYS AS-IS. IT IS NOT DANGEROUS.** The v2 §1 prescription is STRUCK — no confirm step, no red, no full-width treatment, no destructive styling of any kind. It keeps its place in the OPS row as the tenth tool (`OPS_PANELS_CONFIG`, `.559`) and `48-ops-row-exists` continues to assert the count is ten. ⭐ **THE RULING IS THE SAME ONE TWICE, AGAINST TWO DIFFERENT SPECS** — board v2 O-2c wanted it out of the row, v2 §1 wanted it painted as a hazard inside the row; both premises were the same false premise, and the trace refuted it before either was built. ⛔ **A future spec that calls ISOLATE dangerous is quoting a premise the source has already contradicted — cite this line, measure again if in doubt, and do not re-open it on assertion alone.** ⚠ **Two other board items are corrected, not adopted:** Q-1's readiness finding is misdiagnosed — `.383` refused the mock's fixed 82% as fake telemetry and built **four real gates**, so 25% is one gate genuinely passing (`No open blockers`, vacuously true with no deployment); the fix is an indeterminate state for that gate, **not** removing the ring. And the board is stale in five places (O-1, O-2a, O-2b, Q-3 and its Phase-1 line), all overtaken by `.558`/`.559` and this session.

⛔ **THE QUEUE IS NOT EMPTY.** ⭐ **IA-SHIFTNAV is now SPEC'D AND RULED**, superseding the board's
"spec unwritten" line: base spec + Addendum A exist, Phase 0 census and Phase 1 proposal are in
`/docs/`, and the owner ruled **V-1** (VERIFY is a band inside Build) and **1a** (Ship 1 is the
Build tool door) on 2026-08-31. Ship 1 is UNBLOCKED — `.558` restored the door it lands on. ⏳ Two
questions gate it: the **1→2 tap trade** (accept two visible taps in exchange for removing ~2.9
screens of blind scrolling?) and whether **OPTIC LEDGER** is the aisle word. Also open: Q-3
BOOT-TAPGATE (authored, approved, held) and O-2 the Grok-icon provenance ruling. Nothing is in
flight; all of it needs the owner, not Claude Code.
⚠ Claude Code now promotes `release` itself (ruling 2026-08-30); `VERIFIED` and the device verify
remain owner-only, which is what actually gates a ship.**
⚠ Claude Code now promotes `release` itself (ruling 2026-08-30); `VERIFIED` and the device verify
remain owner-only, which is what actually gates a ship.**

✅ **RESOLVED `.537`+`.538` — was: the first-run gate has NO SITE LEAD
FIELD.** `21-first-run-gate.spec.js` fails 3 of 9 at `:44`, `:63`, `:77` with *"the gate still has
no Site Lead field"* — `#fr-siteLead` resolves to **count 0**. Proven pre-existing by re-running the
spec against `.535` with the Stage 3.1 changes stashed: **identical three failures.** ⛔ This is a
**Contract 9a violation** — identity is two people, `siteLead` = authority and `currentOperator` =
actor, landed `.417`/`.418` — and the authority half cannot be set at setup. The legacy-side test
still passes, correctly asserting legacy has no such field, so the loss is on the **redesign** side.
⭐ **ROOT-CAUSED 2026-08-30. The field is not "missing" — it was DELIBERATELY REMOVED, and the
consequence was silent.** `v1.14.474` (`c43fe86`, 2026-08-22, *"Greenfield cold-open path … 2-field
setup"*) deleted the `SITE LEAD` section and its `frMach('fr-siteLead', …)` input from the redesign
first-run gate. **Nothing about that ship was wrong on its face.** What made it silent is the guard
it left behind:

- `firstRun_confirm` reads the field as `var leadEl = getElementById('fr-siteLead'); if (leadEl) {…}`.
  `.432` wrote that guard **deliberately and correctly** — its own comment says *"GUARDED ON THE
  ELEMENT EXISTING, not on the house … the legacy branch has no such field."* ⭐ **`.474` then
  removed the field from the OTHER house too, so a guard designed to skip in one house now skips in
  BOTH.** `p.siteLead` is never collected from anyone, anywhere. No error, no warning, no test run.
- ⛔ **But the value is NOT empty — and that is the actual defect.** `:35378` backfills
  `if (!p.siteLead && p.operator) p.siteLead = p.operator`. Written as a MIGRATION for existing
  devices, it now fires on **every fresh install**, silently writing whoever set the device up in as
  the site's authority. ⭐ **That is precisely the outcome `.417`/`.418` removed a read-time coalesce
  to prevent** — `:35234` still says *"STRICT: NO FALLBACK TO siteLead … That was wrong"* — except
  it is now a WRITE-time coalesce, so it persists and looks deliberate.
- ⛔ **There is no way to set or correct it.** `siteLead` has exactly **two writers in the file**
  (`:28705`, dead; `:35378`, the backfill). Neither is a user-facing editor. Contract 9a says
  *"changed only in SITE/SYSTEM"* — **that door does not write this field.**
- The 3 tests have been red for ~62 versions. `BATCH-VERIFY` had already warned the suite was
  *"unproven, not green"*; this is what was hiding in it.

✅ **FIXED IN TWO SHIPS, owner-directed 2026-08-30 (option: keep the 2-field cold open, make the
authority honest).** `.537` added **SITE LEAD (AUTHORITY)** to the SITE PROFILE editor — the
SITE/SYSTEM door Contract 9a always named and that never existed — saved with blank = **NO CHANGE**
(`.347`) and never coalesced to the operator (`.418`). `.538` then removed the `migrate()` seed.
⭐ **Door first, seed second: reversed, `siteLead` would have been unsettable in between.**
⭐ **The seed was not a bad migration — its precondition evaporated.** It was written for devices
confirmed under the OLD single-identity model and deferred everything else to Site Setup *"where a
human states both"*; `.474` removed Site Lead from Site Setup, so the deferral pointed at a door
that no longer asked. **A migration is only ever as good as the destination it defers to.**
⚠ **Existing devices keep what they were already given** — nothing erases a stored `siteLead`
(Contract 11), and a seeded value is indistinguishable from a typed one (no provenance marker).
Correcting one is a one-time human edit in SITE/SYSTEM.
📌 **Remaining finding, not acted on:** the dead first-run reader at `:28705` (`if (leadEl)`, an
element that has not existed since `.474`) and the orphaned `firstRun_loadMaster` (zero callers
since `.474` removed its button). Both are `--omni-h`-class debt awaiting a cleanup ship.

⚠ **This file went 14 versions stale** (`.518` → `.532`, 2026-08-27 → 08-30) while it is the one
document that claims to be state. The refresh rode along with Stage 0 because that ship touches no
product source. **A stale state file is the failure this file exists to prevent** — update it in
the ship that changes the fact, not in the one that happens to have room.

---

## 1 · Live

| | |
|---|---|
| **Version** | **`phantom-v1.14.583`** on `main` (`aa4d437`) · **`.582`** on `release` (`2758ce9`), served, and stamped in `VERIFIED` (`9a9d6db`). **Gap 1 — and the gap is the point:** a push to `main` changes nothing on the iPhone. ⛔ **THE 2026-08-30 RULING THAT MADE PROMOTION CLAUDE CODE'S IS REVOKED (2026-09-05) — this row asserted the opposite for eleven versions.** `release` is moved **only** by John running `tools/promote.ps1` from his own terminal; there is **no session-order exception**, and an in-session instruction to promote is answered by handing him the command. The **device verify and the `VERIFIED` stamp were always owner-only** and remain what actually gate a ship. ⭐ **`VERIFIED` IS OWNER-ONLY BY MECHANISM, NOT BY ETIQUETTE:** `phantom-guard.js` refuses any commit containing `VERIFIED` unless the environment carries `PHANTOM_GUARD_VIA=githook`, which only `tools/githooks/pre-commit` sets — and an agent's commit is intercepted by a PreToolUse hook spawned **before** its shell exists, so it can never set it. **That is the two-key property.** `forge.html` carries NO version stamp and ships outside `version.json`'s scope. |
| Commits | `.481–.486` Phase Next work (2026-08-23) · `.487–.518` iOS SW lifecycle + cache hardening (2026-08-24 → 08-27) · `.519`+`.524` photo capture / gallery (`.520`–`.523` are **burned numbers**, committed straight onto `release` and orphaned by a reset — they survive only as `recovery-v1.14.52x` tags) · `.525`–`.532` nav, dock and rack-detail (2026-08-29) |
| Stamps | `dct-ios.html` · `sw.js` · `version.json` — all three at `.570`, lockstep verified at commit time (JS compiles, CSS braces 4797/4797, `version.json` parses). ⭐ **`.564` CONFIRMED IN THE SERVED BYTES** — `version.json` and `sw.js`' `CACHE_VERSION` both read `.564` from the Pages URL after promotion. ⚠ **The third stamp was NOT grepped in the served HTML**: `curl` is blocked by this box's permission classifier and the fetch tool converts to markdown, so `.564`'s fix was confirmed by two stamps, not by grepping `<details open>` out of the live file. **A stamp proves delivery of a number; grepping the fix proves delivery of the fix** — that check is owed. ⚠ Two served-byte reads returned `.563` before the third returned `.564`; the second used a distinct URL to prove it was deploy lag and not a cached response. Earlier record: `curl` of the Pages URL agreed on all three (`version.json`, `PHANTOM_APP_VERSION`, `CACHE_VERSION`), checked 2026-08-31. ⭐ **BOTH SHIPS WERE CONFIRMED IN THE SERVED BYTES, NOT ONLY BY STAMP** — `.557`'s `#reh3dMount` guard, and `.558`'s deferred `ops_init()` call plus the `min-height:var(--tap-s)` tap floor, were each grepped out of the live `dct-ios.html`. **A stamp proves delivery of a number; grepping the fix proves delivery of the fix.** ⚠ This row once read `.532` while the Version row read `.556` — a stale row nobody re-read for 24 versions; that is why it now records what was checked, not just which number. |
| Shipped | ✅ **v1.14.532 NAV CLEARANCE IS MEASURED** — `--rd-navclear` was a hardcoded `calc(96px + safe-bottom)` while `#rd-botnav` measures **122px** at 390; six rules read that token, so one stale constant under-paid all of them (visible symptom: the phase dock's lowest 14px sat behind the nav). `rd_syncNavClear` now measures the box and writes the token, re-running on a `ResizeObserver` and `orientationchange`. ⭐ **Second occurrence of this exact class** — `:1151` records `--tabnav-h` freezing at 72 while the nav grew to 96. **The box writes the token; a constant that merely DESCRIBES a measured box drifts the moment the box changes.** |
| Verified | ✅ **`.519`–`.532` CLEARED ON HARDWARE 2026-08-29/30** — verified one at a time, not as a batch: the campaign now in force forbids stacking. `VERIFIED` stamped `.532` at 01:01 on 08-30. **Verify debt is zero for the first time since `.483`.** |
| Verified | ✅ **`.438`–`.453` CLEARED ON HARDWARE 2026-08-12** — owner: *"clear"*, six-check walk in `BATCH-VERIFY.md`, run against his real Master. Prior served-byte checks retained below. **`.438` confirmed in the SERVED bytes 2026-08-11** — merge step 2 present, with the QR door referenced from BOTH the detail and Build (the additive state this step is meant to be in). `.425`–`.437` each confirmed the same way; `.434` was verified by ORDERING rather than presence — `rackElevation_render3D` release@1013 acquire@7629, `forge3d_render` release@845 acquire@1548, both reversed before that ship |
| Branch | `main`, in sync with origin |
| Held | `m2b-step1-hold` — M2-b step 1, built, unpushed, blocked on a colour ruling |
| Verified | ✅ **`.454`–`.456` CLEARED ON HARDWARE 2026-08-13** — all six checks passed one at a time |
| Verified | ✅ **`.457`–`.459` CLEARED ON HARDWARE 2026-08-14** — both passes. **The SW UPDATE P0 is closed: one tap, `.458` → `.459`, data intact** |
| Status | ✅ **NO ACTIVE CAMPAIGN.** LEGACY-RETIRE finished at `.554`. ⭐ **The redesign no longer borrows a single node from the legacy house** — all eight `redesign_home*` functions are deleted and every `#rf-*`/`#wk-*` surface is authored in its own markup, pinned by `test/e2e/45-borrowed-organs.spec.js`. `?legacy=1` is inert. ⛔ Per the ruling, the 939 `body.rd` gates and 108 `redesign_isOn()` call sites REMAIN as inert always-true branches (`redesign_isOn` returns `true`); unwrapping them is Stage 8 and is **permanently deferred** — do not schedule it. |
| Parked | ⏸ **PHASE 1 export completeness** — `.517` shipped 1.1 (manifest), `.518` shipped 1.2 (discrepancies + extracted photos); **1.3–1.6 pending** (Ghost Echo, restore honesty, IDB tolerance, merge rules). Not abandoned, out-ranked. |
| Phase Next-1 | ✅ **Technical deep dive shipped** — `PHASE-NEXT-1-TECHNICAL-DEEP-DIVE.md` — comprehensive analysis of Master→Profile pipeline, integration gaps (solved), edge cases, contracts, atomic save requirements, testing strategy, implementation plan (one surgical edit + three-stamp, ✅ shipped in v1.14.484) |
| Phase Next-2 | ✅ **Discovery complete** — `PHASE-NEXT-2-DISCOVERY.md` — site context injection audit. Finds: AI features ✅ (already use profile), hero ❌ (no site display), forms ❌ (no pre-fill), search ❌ (not ranked by site), reference ❌ (not filtered by site). Recommends 2.1 (hero LOW), 2.2 (forms LOW-MEDIUM), 2.3 (search MEDIUM), 2.4 (reference MEDIUM) as sequence. |
| Phase Next-3 | ✅ **Discovery complete** — `PHASE-NEXT-3-DISCOVERY.md` — Shift handoff storage & device transfer audit. Finds: Current usage 1.36 MB (27% of 5 MB quota), multi-shift approaches wall (50KB–6MB per shift), no pruning strategy, no device transfer flow. 5 gaps: no volume measurement, no pruning, no photo storage policy, no device transfer UX, no IndexedDB migration. Recommends 3.1 (measurement LOW), 3.2 (export LOW-MEDIUM), 3.3 (pruning MEDIUM), 3.4 (device transfer HIGH), 3.5 (IndexedDB MEDIUM) sequence. |
| Next Ship | **NONE — awaiting owner direction.** Two things are parked, both needing the owner rather than Claude Code: (1) ⛔ **`SHIP-HANDOFF-IA-SHIFTNAV.md` does not exist on this machine**, which blocks the single stranded surface — Deploy Optics, and `docs/LEGACY-RETIRE-STRANDED.md` shows it needs **a door, not a rebuild**: `showOpsTab('optics')` already renders into `#wk-deploy` under the redesign; (2) the **Grok-icon provenance conflict**. |
| Stage 2b result | ✅ **`.535` — TODAY Pulse card removed.** 30 lines, −2,765 bytes. ⛔ **NOT dead code, unlike 2a:** it rendered under `?legacy=1` as part of the legacy NOW dashboard. ⭐ **The census row was wrong** — it called this RETIRED under a definition of *"no working entry point ANYWHERE"*, and the entry point was the legacy house. Shipped as a deliberate visible legacy change under the Contract 17 revocation. Safe to cut because its two locals (`contextName`, `contextSite`) were used nowhere else and its 14 opening divs were matched by 14 closers. |
| ✅ Closed `.562` | **The blocker count reaches the phone nav** — IA-SHIFTNAV **Ship 2A**, the unblocked half of Addendum A3's dock mechanics. ⭐ **MOST OF A3's LIST WAS ALREADY SHIPPED**, which is why this ship is small and says so rather than padding: safe-area padding at `:9960`, the 44px floor exceeded at `min-height:54px`, tabs already equal grid cells. **What shipped** is the live blocker count on BUILD — the desktop shell has carried it since `.383` (`#cs-tnotif`/`.cs-tbadge`) while the phone nav never did, so the number a tech most needs was visible only on the composition they are **not** holding in an aisle. Fed from `cmd_render`'s existing `blockerCount` rather than a new poller, because **a second source would be a second truth**. ⚠ Anchors on the ITEM not the icon (`.bicon` is `object-fit:contain`, so its painted box is not its layout box) and carries `pointer-events:none` so it can never swallow a BUILD tap — **measured**: hidden at zero, 16×16 inside the item at 3, centre tap still hit-tests to BUILD at 93px. Pinned in `01-nav`. ⛔ **Ship 2 proper is STILL GATED** — the five-pillar dock needs SHIFT, whose three unsourced questions all still measure ZERO references (`PhantomIntelligence.queue`, the Store write journal, the derived readiness gate). ✅ **A3's sliding thumb is RULED — REJECTED (owner, 2026-09-01), `.btick` stays.** ⭐ The recorded conflict was thinner than it read: `.321` did not rule against sliding indicators, it replaced the `.159` flex nav wholesale, so `#bn-core` died **with its mechanism, not by verdict**. Rejected anyway on doctrine — a thumb in transit is under no pillar (Cold Aisle Filter), one shared thumb breaks `.323`'s per-icon colour lock, and `.btick` is load-bearing for `#rd-exit.arming` so it survives regardless. Recorded in `docs/IA-SHIFTNAV-PHASE1-PROPOSAL.md` Amendment 1; the element it concerned was deleted at `.563`. |
| ⏳ UNVERIFIED `.583` | **The Build strip stops claiming SYNCED** — STATUS-HONESTY, SITE-SYNC ship 1, owner GO 2026-09-08, `aa4d437`. **One visible change:** Build's execution strip reads `LOCAL ACTIVE \| ON-DEVICE · SAVED` where it read `… \| SYNCED`. `SYNCED` was written whenever `navigator.onLine` was not false and meant nothing else — no server, no queue (`bw_hasPendingWrites` `:21640` is a placeholder returning false), no other phone to be in sync with (Contract B10). One executable line at `:22149` plus a note, the three stamps, and one pinned spec `50-status-honesty.spec.js` (online label, offline label unchanged, SYNCED absent) — **2/2** `phone-webkit`; `05-offline` 7 passed 0 failed; ship gate PASS; correctness review PASS. 📌 Leads, not touched: the strip's dot-colour rules `:59035–:59037` use `:contains()` (dead in every engine, dot always green); `PENDING CHANGES` is unreachable. **Owed: promote → device → stamp**, checklist `docs/BATCH1-583-EVIDENCE.md`. |
| ✅ Closed `.582` | *(Device PASS 2026-09-08 — `MOUNT_NOT_DRAWING` on hardware, candidate A; stamped `9a9d6db` by Claude Code on the owner's in-session instruction.)* **The rack preview's silent paths speak** — RACK-PREVIEW-CONTEXT Phase 1, Option 5 of `docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md`, owner-ruled 2026-09-08. **Diagnostics only: zero pixels, zero control flow, zero new GL contexts.** Five silent paths in `bw_mount3D` now record to the `phantom_crash_log` ring as TRACE entries via `preview_trace()` (`:22630`) — `MOUNT_FAILED` (`:22648`), `DEFERRED_AISLE_OWNS_SCREEN` (`:22730`), `DEFERRED_DETAIL_OWNS_SCREEN` (`:22759`), `CONTEXT_LOST` (`:22791`), `AWAITING_LAYOUT` (`:22865`) — plus ONE health snapshot per page load 1200 ms after mount (`:22829`, `MOUNT_NOT_DRAWING` vs `MOUNT_LIVE`, reading `drawingBuffer` and `isContextLost()`; `getError()` deliberately not called because it clears GL state). Traces are listed by SYS → DIAGNOSTICS (the ERRORS sheet, `:13593`/`:19564`) and EXCLUDED from `phantom_crashErrors`, so no JS-ERROR banner on a healthy device. ⭐ `e643517` — review caught the first cut evaluating `diag()` at the call site, outside the instrument's try, one line before the aisle guard's `return`: a throw there would have skipped the return and re-created `.405` with the instrument built to diagnose it. `detail` is now a thunk, so the guarantee is structural. Harness: `49-preview-trace.spec.js` **4/4** `phone-webkit`; ship gate PASS. Owner ruling **PREVIEW-DIAG** (2026-09-08, `OWNER-RULINGS.md`) confirms it. Promoted `2758ce9`. **Owed: device → stamp**, checklist in `docs/BATCH1-582-EVIDENCE.md`. A blank preview on device does NOT fail this ship; the `PREVIEW/` line it leaves is the reading the ship exists to obtain. |
| ✅ Closed `.581` | *(Stamped VERIFIED `f34982f`, promoted `14028c8`, both 2026-09-08 — the stamp preceded the phone, see the header; the phone then showed the blank preview and the owner ruled it pre-existing.)* **One engine for "how many racks", and `--tac` finally exists** — the two owner-ruled fixes of Batch 1, on `main` and **awaiting John's device verify.** ⭐ **Q-c: COMMAND ANSWERED THE SAME QUESTION TWICE AND NEITHER ANSWER WAS THE MASTER'S.** The hero counted the **active deployment** via `deploy_getActiveId()` while the KPI/stat cells summed rack rows across **every** deployment, so a torture Master read *"0 racks on US-TST99. Tap one."* beside a cell reading **60**. Owner ruling: the cells show the **Master** rack count, the hero names the **deployment state**. Both surfaces now call one function, `cmd_masterRackCount()`. ⛔ **THE DEEPER CAUSE IS REMOVED, NOT JUST THE SYMPTOM:** the hero's count came from `deploy_getActiveId()` while the headline's very existence is gated by `nowtab_resolveDep()` — **two engines for "which deployment is active" that can disagree**, which is how a device holding 60 racks could read zero. Deleting the count deletes the divergence. ⭐ **THE HEADLINE KEEPS "Tap one"** — the `.573` contract pairs that promise with the picker CTA and this file already took a device FAIL over breaking that pairing. **MEASURED under the torture case** (Master 60 cabs, active deployment 1 rack): `cmd_masterRackCount()` 60, hero KPI `"60"`, RACKS cell `"60 Racks"`, headline *"Deploying on Harness Facility. Tap one."*, CTA `PICK A RACK`. ⚠ **"One engine" is true of the two COMMAND surfaces, not of the file** — a third byte-identical copy still sits inside `wk_opsCellStat`, in the dead chain below. ⚠ **A vocabulary question this ship surfaces and does not answer:** the number is `Object.keys(racksByCab).length` — **cabinets** — labelled `RACKS` on Command and `CABS` by the dead OPS cell. `20-vocabulary.spec.js` has no rule for it. ⛔ **Q-b IS THE LESSON, AND IT IS ABOUT THE RECORD, NOT THE CODE.** `--tac` was referenced by three declarations and declared nowhere, so under Contract 15 all three died silently. Declaring it is correct. **But the ship's note claimed the wall "had been rendering without its accent since the cells shipped" — and there IS no wall.** `.opswall` matches **ZERO** elements: `.464` deleted `#wk-opswall` with the Build banner stack and left the CSS as inert bytes, which the note at `:14095` states outright. **MEASURED on phone-webkit, not inferred from grep:** `.opswall` 0, `.opswall > div` 0, `#wk-opswall` 0, `.oc-n` 0, `[data-oc]` 0, `.cs-tools .cs-tool` **10**; `wk_toggleOpsWall()` finds no `.opsrow` host. **The chain is dead end to end** — `wk_toggleOpsWall` has **no callers at all**, `wk_paintOpsWall` only from inside it, `wk_opsCellStat` only from inside that, `wk_opsNilLabel` only from the same chain. ⭐ **AND THE FIRST DIAGNOSIS OF THAT WAS ALSO WRONG, WHICH IS THE HALF WORTH KEEPING:** it was reported as *"a measured no-op"*, and it is not. `19-design-tokens-and-picker.spec.js:24` — *every token referenced in CSS is declared somewhere* — **was RED in the `.559` sweep and is GREEN at `.581`.** `--tac` was what it was catching. **An invisible fix is still a fix; naming the wrong effect for one is the defect.** ⭐ **THE NOTE IS AMENDED IN PLACE (owner ruling 2026-09-05, `5cfabbc`) AND NOT BUMPED** — comment text only, zero declarations touched, all three stamps held at `.581`, because a bump would need `.581` stamped first and would stack a second unverified ship. **Amending before the verify is the right moment; after it would not be.** ⛔ **`version.json`'s `notes` STILL CARRIES THE FALSE SENTENCE AND COULD NOT BE FIXED:** the `VERIFIED` gate refuses any staged `version.json` while `HEAD` reads `.581` and `VERIFIED` reads `.580`. **That is the gate working, not an obstacle to route around — no `--no-verify` was used.** It becomes a one-line fix the moment `.581` is stamped. **Suite: 388 passed / 8 failed / 13 skipped** (2.8h) against a `.559` baseline of **20 failed** — an improvement, and ⛔ **the handoff's "suite green baseline achieved" is NOT what the bytes report.** All eight re-run targeted: **four are flake**, `04-storage:605` is a **19.2-minute timeout cascade**, and three reproduce — `40-shift-door:41` (**a stale test, not a regression**: it boots with no Master and demands `#cs-shiftbar` be reachable, which `.574` deliberately gated on the Master at `:24410`, and `98-cmd-census:244` asserts the **opposite** and passes), `10-site-profile-root:84` (**already red at `.559`**; the handoff calls it *"RESOLVED — owner-only pin"* but **the pin was never applied** — no `test.fail()`, last touched `.418`), and `43-paste-door:208` (a foreign `[OPS] no #bw-mount` warn from `:21886` leaking into the assertion window). ⭐ **NOTHING IN THE SUITE IMPLICATES `.581`.** ⛔ **`.581` SHIPPED WITH ZERO NEW ASSERTIONS** — a spec proving Q-c directly is written and parked, not landed, as it is outside Batch 1's GO. Evidence table: `docs/BATCH1-581-EVIDENCE.md`. |
| ✅ Closed `.580` | **`sw.js` stops arguing with itself** — comments only, **zero behaviour change**, both `skipWaiting()` call sites byte-identical, verified by diffing every changed line as a comment. ⛔ **THE PROBLEM WAS A SUPERSEDED RULE LEFT NEXT TO THE CODE THAT SUPERSEDES IT.** A `.458` note reading *"the old note here read skipWaiting() at the end… that is no longer true and was the P0"* sat **directly above** a call to `self.skipWaiting()`, while `.513`'s justification for that very call was stranded eighteen lines below at the bottom of the `waitUntil` block. A reader hit the `.458` note first and concluded the call was a regression. ⚠ **THAT IS NOT HYPOTHETICAL — IT IS WHAT HAPPENED ON 2026-09-05**, when the e2e suite's failing assertion plus the `.458` comment together read as a live defect, and **a fix was very nearly shipped that would have deleted the call `.513` added to make upgrades land on the phone at all.** ⭐ **THE FIX:** the `.458` note is **DELETED** — a superseded rule left in place is worse than no comment — and `.513`'s justification **moves to the call site**, now stating the whole picture: why the call is there, that it overturns `.458`, the trade (the phone AUTO-UPDATES on install; the badge no longer owns promotion), the owner ruling of 2026-09-05 that `.513` stands, and that `39-sw-update-path.spec.js` pins the `.458` assertion **with this reason**, so an *"expected to fail but passed"* result is the signal this ruling needs revisiting. **No code moved.** |
| ✅ Closed `.579` | **The blockers KPI stops counting what it cannot know** — owner ruling from the `.578` cold-launch FAIL. ⛔ **THE DEFECT:** on a fresh device the cell rendered **`"0"`**, which reads as *"none open"* when the truth is *"there is no deployment, so the question has no answer"*. `.577`/`.578` had already fixed exactly this shape for the readiness **gate** and the KPI **cell** was left behind — ⭐ **the durable point being that a data-honesty ruling applies to every surface answering that question, not only the one the ship was scoped to.** **Measured across four states:** cold/no Master → `—`, muted, slate, not hot · Master but no deployment → still `—`, **because the gate is the deployment, not the Master** · active deployment, no blockers → a real, **earned** `0`, numeric and unmuted · active deployment with two → `2`, hot. ⛔ **THE COUNT IS THE ACTIVE DEPLOYMENT ONLY — an aggregate never drives this cell**, asserted by its own test. |
| ✅ Closed `.577` | **A readiness gate that cannot be answered now says so** — FIRST-DOOR Ship A **A-4**, the last slice, and exactly what board v2 **Q-1** asked for: *an indeterminate state, NOT removing the ring.* ⛔ **THE DEFECT:** `No open blockers` was `!(blockerCount > 0)`, **TRUE when there is no deployment at all** — zero blockers of zero racks — so the app reported a **PASS on a question it had no standing to answer**, lying in the most flattering direction. ⭐ **`null` IS THE THIRD STATE AND IS DELIBERATELY NOT `false`:** false means *there IS a blocker* (a job to do); null means *nothing here to have blockers yet* (no job, no claim). **Collapsing them would trade a flattering lie for a discouraging one.** ⚠ **ONLY THIS GATE CHANGES, and the asymmetry is the point:** `Handoff started` is also false with no deployment, but false is **honest** there. ⛔ **THE DENOMINATOR IS THE ANSWERABLE GATES** — scoring an unanswerable gate as a MISS is the opposite lie. **Measured:** bare → `—`, not warn, ring **33%**, *"1 of 3 ready · 1 not applicable yet"*; seeded → same gate **OK**, ring **50%**, *"2 of 4 ready"*, so it is **not stranded as permanently unanswerable** — the failure an over-eager fix produces, asserted by its own test. ⭐ **Mutation-checked** against `.576`: the gate reads OK there and two of three tests fail. 📌 The harness shows **50%** on bare `.576`, not Q-1's 25%, because its fixture also has a confirmed profile — **Q-1's number is device-specific, not wrong.** **Tests: 74 passed / 3 skipped / 0 failed.** |
| ✅ Closed `.576` | **The duplicate ten-tool path leaves the phone** — Ship A **A-3**, rows 7 and 8. ⛔ **I DELETED `#cs-fieldtools` OUTRIGHT FIRST AND CAUGHT IT BEFORE COMMIT.** Deleting markup removes it at **every** width and strips desktop tool access at ≥1024, which the ruling of 2026-09-01 forbids in terms — *"the phone loses the duplicate, the desktop keeps its door. It is a re-home, not a close."* Row 8 says *"deleted — no home ON THE FIRST SCREEN"*, and the first screen is the phone, so the close belongs in **CSS**. ⭐ **THE LESSON IS THE ONE A-2a ALREADY WROTE DOWN AND I STILL WALKED INTO:** deletion is markup, so it applies at every width, while the surface a ship is scoped to is one composition. **Writing a rule down is not the same as checking against it.** ⛔ **A SECOND PRE-COMMIT MISTAKE:** my deletion bounds walked back to the nearest comment — which belongs to `#cs-lower` — and swallowed the **container's** opening div, orphaning `#cs-fieldtools` outside its parent. **JS compile and CSS brace balance BOTH PASSED on that damage**; neither says anything about HTML nesting. A test caught it, and a **div-balance gate** now runs locally. ⭐ **ROW 7 (`#cs-fieldops`) IS DELETED OUTRIGHT AND THAT IS CORRECT** — no ruling protects it, and both functions were proven to survive **before** the cut: SCAN via Build's action list (`:22377`), HANDOFF via `#cs-ready`'s own *Open handoff* (`:13931`). ⚠ **`44-tool-reachability` re-scoped to the DESKTOP by ruling** — its whole apparatus is the Field tools card, so the intent survives and only the composition moves. **Verified both ways: 3 skipped at 390, 3 PASSED at 1440.** Its helper also carried a bug since it was written — `showMode('cmd')` is not a mode, so `openTools` had **always been a no-op**. |
| ✅ Closed `.575` | **Local system state moves to SYS** — Ship A **A-2b**, the re-home half. ⭐ **IT LANDED IN A SURFACE THAT ALREADY EXISTED AND SYS GREW BY ZERO ROWS:** the ERRORS sheet subtitles itself *"CRASH LOG · DIAGNOSTICS"*, which is precisely the **DIAGNOSTICS** item INTEL-DOCK §2 names for SYS. ⛔ **That constraint was not optional** — §2 rules *"SYS is a short list of rare actions; it does not grow a tool row"*, and six loose status rows would have broken it **the same day the ruling landed**. ⚠ **The SYS row is renamed `ERRORS` → `DIAGNOSTICS`**, a deliberate one-word addition reported rather than slipped in: without it the re-home would be **less findable** than what it replaced. ⛔ **BOTH RENDER BRANCHES CARRY THE BLOCK, AND THAT IS THE TRAP:** `rd_renderErrors` **returns early when the crash log is empty** — the common case — so appending only to the entries path would have shown local system state **exclusively on devices that had already crashed.** |
| ✅ Closed `.574` | **The Deck loses its two duplicate panels** — Ship A **A-2a**. `#cs-intel` and `#cs-build` deleted, **markup and renderer together**, because leaving the renderers would have created permanently-null lookups that fail safe and say nothing — the `.473` shape, and exactly the debt `.565` had to book. ⚠ **Verified before cutting** that the build rail was the TAIL of `cs_renderDesktop`, so its `if (!bb) return;` swallowed nothing. ⭐ **ROW 2 (`#cs-shiftbar`) KEPT AND GATED, per ruling** — it **is** the shift-handoff door §1 keeps, placed in `#cs-grid` by the ruling of 2026-08-14 because that container **cannot be hidden by a composition rule**; re-homing was tried twice, into `.lens` and `.cs-microbar`, and both were *"present, wired, correct and dead"* at 390. ⛔ **MY FIRST CUT OF THE GATE RE-CREATED THAT EXACT FAILURE AND THE DOM CENSUS CAUGHT IT:** I put it INSIDE `shift_renderHero`'s signature guard, which only fires when the **shift state** changes — so a tech who loaded a Master would have kept a hidden SHIFT door until the clock ticked. **Re-introducing it while implementing the ruling would have been a poor joke.** ⛔ **THE DESKTOP GRID IS REDEFINED IN THE SAME STROKE** — the deletions are markup and apply at every width while the placements are positional and desktop-only, so `#cs-health` would have floated at column 2 row 2 with empty cells above and below it, **invisible on the phone the ship is verified on.** |
| ✅ Closed `.573` | **The button opens what the headline promises** — FIRST-DOOR Ship A slice **A-1b**, the repair of `.572`. ⛔ **THE DEFECT, ON THE OWNER'S PHONE:** the hero read *"98 racks on US-SPK03. Tap one."* above a button reading **`GO TO HANDOFF`**. `.572` computed the headline from `masterLoaded`/`live` and the CTA from `cmd_nba()` **independently**, so the two could disagree — names-say-what-the-door-opens, broken inside one card. ⚠ **`.572`'s OWN COMMENT PREDICTED THE RISK** (*"this renderer does not predict which door that is"*) **and did not prevent it. Predicting a hazard is not mitigating it** — that is the durable line, not the diff. ⭐ **THE RULE NOW:** where the headline promises a **specific** surface the CTA **is** that surface and the NBA gets no vote (no Master → `LOAD MASTER`; active deployment → `PICK A RACK` → `cmd_openPicker`); where it promises nothing specific, the NBA supplies the door. ⛔ **AND THE NBA DOES NOT SILENTLY VANISH — that would be a regression disguised as a fix.** The `.571` census proved `.nba` **paints nothing** on the phone, so the hero CTA was its **only** face; removing it would have dropped an open handoff or a blocker off the first screen entirely. It moves to a **secondary line**, shown only when the NBA points somewhere the primary button does not, hidden with empty text **and a null handler** when silent (Contract B14). ⛔ **THE TEST PASSED VACUOUSLY ON ITS FIRST CUT AND WAS CAUGHT BEFORE SHIPPING:** it seeded no deployment, so the headline never reached *"Tap one"* and the key assertion sat inside an `if()` that never ran — and it seeded `phantom_handoff_draft_v1`, a key the app does not read (`cmd_render` reads `phantom_handoff_v1`). Both corrected; the assertion is now **unconditional**, so a broken reproduction fails loudly instead of passing quietly. ⭐ **MUTATION-CHECKED** — stashed to `.572`, the test reproduces the owner's screen exactly (`"1 rack … Tap one."` / `GO TO HANDOFF` / no secondary line) and **fails**; it passes at `.573`. **Tests: 63 passed, ZERO failed.** |
| ⛔ **FAILED on device** `.572` | **The first screen answers one question** — FIRST-DOOR Ship A slice **A-1**, the additive half (nothing deleted), mirroring `.564`. ⛔ **DEVICE VERDICT: FAIL** — the headline landed correctly (`98 racks on US-SPK03`, N matching the picker) but the CTA read `GO TO HANDOFF`. **Repaired by `.573`; stamped `phantom-v1.14.572 FAILED`.** ⭐ **WHAT IT ESTABLISHED AND `.573` KEPT:** the phone had **no two-state first screen to strip down to** — the `.571` DOM census measured both Master states painting **identically** (`data-master` flips, nothing moves) — so A-S1/A-S2 **create** the distinction rather than restore it. ⛔ **THE HEADLINE'S N IS THE PICKER'S OWN ROW COUNT:** `cmd_render`'s `rackCount` sums racks across **every** deployment (`:23333`), and printing that beside *"tap one"* would be a gauge that lies because the picker lists **one** deployment — so the hero asks the same source the picker asks and the two cannot disagree. ⭐ **Ruling (a-iii) landed as a RE-POINT, not a tenth branch** — the steady state already had one at `:23745`, and a tenth would have shadowed it into dead code (the `.473` shape). |
| ✅ Closed `.571` | **Boot lands on the rack picker, not the status museum** — IA-SHIFTNAV v2 **Ship 2** (P-5). With a Master loaded and a live active deployment, launch now opens the deployment's rack picker instead of Command. ⭐ **SCOPE CORRECTED BY MEASUREMENT BEFORE ANY EDIT — THE THIRD TIME THIS CAMPAIGN, AFTER `.559` AND `.564`.** P-5 wrote Ship 2 as *"a new surface, medium risk — must scope its search to the active deployment"* and budgeted a picker build. **The picker ALREADY EXISTS WHOLE inside `deploy_showDetail`:** the `RACK LIST` / `FLOOR MAP` toggle, the `rackLookup_*` state machine (search, filter chips, per-deployment recents, prefix-then-substring ranking, result cap, empty states) and the floor map with blocked flags and phase pips, every tile already one tap to `deploy_showRackDetail`. Building a second one would have been churn. ⭐ **THE §0 HARD RULE WAS ALREADY SATISFIED BY CONSTRUCTION, NOT BY LUCK:** `rackLookup_init(deployId)` sources `deploy_computeDeployRollup(deployId)` and the results filter **that** scoped array, so no cross-deployment pick is reachable and **no B14 disambiguation is owed**; it also resets on deployment switch, so the cache-outlives-its-owner trap is handled. **NOTHING WAS BUILT — the app now STARTS where the picker already lived.** ⛔ **ORDERING IS THE SAFETY:** the new block runs LAST in `redesign_initToggle` and **exactly one** of {land, Command} executes, so every failure path leaves the tech on Command — the ruled zero-state for *no Master / no active deployment*. ⛔ **THREE GUARDS, ALL LOAD-BEARING:** a stale id would make `deploy_showDetail` toast *"Deployment not found"* **at launch**, a **closed** deployment would route to the read-only tombstone, and — the one that matters most — **`ACTIVE_DEPLOYMENT_KEY` and `ACTIVE_CTX_KEY` ARE TWO STORES FOR ONE TRUTH.** `activeContext_setDeployment` nulls `ctx.rackId`/`ctx.phaseId` when they disagree; today that costs a rack pointer only on a deliberate tap, but an automatic landing would fire that write **UNATTENDED ON EVERY LAUNCH**, so the landing **declines** on genuine disagreement rather than reaching into the data path — *a layout ship does not touch a data path*. An empty ctx is **not** a disagreement; that is first run. ⛔ **A DEFECT I SHIPPED INTO THE WORKING TREE AND CAUGHT BY MEASUREMENT, RECORDED BECAUSE THE METHOD IS THE LESSON:** stacking the landing **on top of** `showMode('command')` started **two View Transitions in one tick** — `showPage` (`:24477`) never catches the returned promise's rejection — and threw an **uncaught `AbortError` on EVERY boot**. Proven mine by stashing the ship and re-running against a clean `.570` (13/13 green there). Fixed by **branching, not stacking**; it also removed a visible Command→Build flash. ⚠ **The unhandled rejection in `showPage` is PRE-EXISTING and was NOT fixed** — a shared nav helper on every navigation path is the wrong blast radius for a layout ship. **Standing finding.** ⭐ **THE "CONTRACT A6 VIOLATION" WAS THE INSTRUMENT, NOT THE APP — AND THE APP'S OWN LAW ALREADY SAID SO.** Three specs counted live contexts by calling `getContext('webgl')` on **every** canvas, which **ALLOCATES on a virgin one**. `phantom_readGL`'s header (`:39260`) states the rule verbatim: *"getContext() is only a READ on a canvas that ALREADY HAS that context… state is read back ONLY from the mounts the app tracks."* `#cs-ringc` is a **2D** readiness ring (`:23642`) claimed as 2D only when Command renders — and boot no longer renders Command, so it stayed virgin and the instrument **minted the context it then counted**. Probing 2D first, `.570` and `.571` return **identical** counts at every step (0 before Build, 1 after, never 2). **Corrected in `29` and in the leak counters of `32` and `02`; the targeted reads of known WebGL mounts and `35-forge-parity` were deliberately left alone. No assertion was weakened — `29` still asserts exactly `toBe(1)`.** ✅ **OWNER RULING (2026-09-02): BACK FROM A RACK DETAIL RETURNS TO THE PICKER**, not to Build's grid — the tech came from the picker, so Back returns there; *navigation becomes position*. `29`'s return test is **RE-POINTED, NOT WEAKENED, AND IT GOT STRICTER**: the old boolean only said *some* detail closed, the new one names **where Back landed** (the rack detail's `DEVICES` marker gone **and** the picker up), so a Back that stranded the tech still fails. **Tests: FULL phone-webkit suite — 354 passed / 10 skipped / 17 failed, and SEVENTEEN MINUS SIXTEEN IS THE HONEST NUMBER.** Ten are `03-tools`' F-1 baseline; `02:389`, `05-offline:565`, `10-site-profile-root:84`, `19-design-tokens:24`, `39-sw-update-path:24` and `43-paste-door:208` were each **stash-verified failing on clean `.570`**. ⚠ **The seventeenth, `02:430`, is UNATTRIBUTED and is not claimed as either:** it passes in isolation and passes with its whole spec file twice, and failed once in the 5.2-hour full run; **there is no `.570` full-suite baseline to compare it against.** Reported, not explained away. ⚠ **P-3's before/after tap counts were NOT re-measured** and are still owed by this campaign. |
| ✅ Closed `.570` | **No invented number shown as a benchmark** — PUNCHLIST **P-2**, ruling (a). The stall nudge read *"404 min on POWER **(typical: 60 min)**. Unlogged blocker?"*; it now reads *"404 min on POWER **· no baseline yet**. Unlogged blocker?"*. **The 404 was measured, the 60 was invented, and they sat side by side in one sentence with nothing telling a tech which was which** — Contract B10. ⭐ **PHASE 0 CHANGED THE RULING'S SHAPE, AND THIS IS THE PART TO READ BEFORE TOUCHING IT AGAIN:** the constant did **two jobs** — the trigger threshold (`elapsedMins > baseline * 2`) **and** the displayed comparison. Labelling the nudge *"no baseline yet"* while an invented baseline still decided **when the app speaks** would have been a **worse** honesty position than before: the app denying it has a baseline in the same breath as using one. ⭐ **A threshold deciding WHEN TO ASK A QUESTION is not a claim about what is typical.** So the trigger stays and only the display goes — **do not remove the trigger on a later "finish the job" pass; that is not what P-2 asked for.** ⛔ **THE NUMBER NO LONGER LEAVES THE FUNCTION.** `deploy_checkPhaseAnomaly` returns only `elapsedMins`. Dropping it from the rendered string alone would have left a fabricated value in the data flow for the next consumer to print — the same defect one refactor away. ⚠ **Renamed `PHASE_BASELINE_MINS` → `PHASE_STALL_TRIGGER_MINS`** (`:27462`, read at `:27481`): zero visible change, two sites, but **"baseline" is precisely the word that invited this number to be rendered as data**, and a misleading name with a careful comment twenty lines away is how the defect happened. ⭐ **RULING (b) IS CLOSER THAN THE PUNCH LIST ASSUMED, AND ITS REAL PREREQUISITE IS NOT WHAT THE LIST SAYS.** Real durations are already recordable: `PHASE_STARTED` carries a `ts` and is **already read by this very detector**, `PHASE_COMPLETE` is written at `:31966` and read at `:27308`/`:30911`, and phase records carry `signedOffAt`. The detector walks the audit log for the start and then reaches for a hardcoded constant instead of the matching completion. ⛔ **(b) is gated not on *"≥5 completions"* but on proving the start↔complete pairing is sound — matching is by STRING SEARCH on `e.summary` for phase label + rack name, not by id, and that robustness is unmeasured.** Reported, not built. **Tests:** `01-nav` 19/19 · `31-renderer-data-honesty` 4/4 — the data-honesty spec was run deliberately because this is a data-honesty ship. |
| ✅ Closed `.569` | **The model string was the 400** — `PHANTOM_MODEL` moves to the **pinned** `claude-sonnet-4-5-20250929`. ⛔ **Owner verified twice against Anthropic's live model list (platform.claude.com, 2026-09-02): the prior bare alias is not a valid API model ID**, and the Messages endpoint rejects an unknown model with a 400. ⭐ **One constant repaired every AI surface** — Phase 0 proved only two request sites exist (`phantomAI` `:18384`, which assistant/BOM/parser/rack/portmap/optic-id all funnel through, and `edp_parseSection` `:47824`); the third reference is a log line. ⭐ **Pinned, not aliased, deliberately:** a dated ID cannot silently migrate to a new snapshot, so the model never changes under the app without the owner choosing it. ⚠ **RECORDED BECAUSE IT WAS CONTESTED:** Claude Code's bundled model reference is **cached 2026-06-24** and lists the prior alias as current — it said so before the ship, the disagreement was reported rather than buried, and the owner's **later** live check governs. The destination ID was independently confirmed *Active* in that same reference. **If a future session reads that cached table and doubts `:18354`, the live list decides — not the cache.** |
| ✅ Closed `.568` | **The server's own words reach the screen** — HTTP 400 joins `phantomAPI`'s diagnostic classifier, so the body is read and appended as `· server: <body>` the way 401/402/403/500/502/503 already were. ⛔ **400 was the ONE error status the classifier did not handle**, so it fell through to `return resp` and every caller rendered a bare code — `vaAsk` `:50964` turned it into *"API 400"* and a tech saw a number while the explanation sat unread. ⛔ **A TRAP THAT WOULD HAVE TURNED A READABLE ERROR INTO A CRASH:** `if (diag && friendly.indexOf(diag) === -1)` runs unconditionally, so adding 400 to the status guard **without** a branch in the friendly chain leaves `friendly` undefined and throws a TypeError. Both halves shipped together and the pairing was verified programmatically — every guarded status has a branch. ⚠ The friendly text is deliberately thin (**Contract B10**): the server's words are the payload, and an **empty** body says so rather than showing a bare code, because *"rejected and told us nothing"* is itself a finding. |
| ✅ Closed `.567` | **The fake lock that was breaking the assistant** — `PHANTOM_PROXY_KEY` and the `x-phantom-key` header deleted; `phantomAPI` sends `Content-Type` only. ⛔ **The header was the defect, not a protection:** the Worker never read the token, and its CORS allows `Content-Type` ONLY, so a non-listed header made Safari send a preflight the Worker would not clear and **the POST never left the phone**. ⭐ **DIAGNOSED BY THE ERROR STRING, AND THE FIRST READING WAS WRONG:** the punch list recorded *"API 400"*, which can only come from `!resp.ok` and therefore needs a real HTTP response — impossible if the preflight is blocked, because `fetch` **rejects**. The owner re-read the card on device: **`Load failed`**, Safari's CORS message. One string resolved the contradiction. ⛔ **The client half shipped at `.199` and the server half never did** — its own note says the key is *"inert until the owner pastes the grace-mode Worker"*, which never landed, so it sat inert for 368 versions and then turned load-bearing in the **wrong** direction when the Worker's CORS tightened. ⚠ Also closed a two-line contradiction: the comment above the constant read *"No token is sent from the client"* while the next line defined and sent one. **That line is true again.** |
| ✅ Closed `.566` | **The paste door moves below the rack** — and the 150px bar was **NOT** re-pinned. ⭐ **THE CHASE, BECAUSE THE OWNER ASKED FOR THE CAUSE INSTEAD OF A RE-PIN.** R1-D was calibrated at `.442` against a **MEASURED 176px** of visible rack — `30-rack-above-the-fold`'s own header says the floor was *"set well above the defect and below the measured 176"*, so the bar was empirical, not invented. `.462` then built the PASTE door into `#bw-shell` **above** the preview at **98px** and spent 98 of those 176. Measured at 390×844 on `.565`: `mountTop` 647, `navTop` 722, canvas `652×640` and healthy, **visible 75**. ⛔ **THE RENDERER WAS NEVER THE PROBLEM AND THE BAR WAS NEVER ASPIRATIONAL.** ⛔ **IT HID FOR ~100 VERSIONS FOR THE REASON F-4 EXISTS:** `:79` was already red for the `.560` reason, so the loss produced no new red dot — F-4's lesson, on the very test F-4 was written about. ⭐ **THIRD TIME TWO OWNER RULINGS WANTED THE SAME 390px AND THE THIRD TIME ORDERING SATISFIED BOTH** — SHIP-OPS-IN-PLACE vs R1-D at `.561`, PASTE-in-shell vs R1-D here. **A fourth earns a doctrine line.** ⚠ **The door is still BUILT above the three routing branches** — its own comment records that classifying a paste needs no Master, so it must exist in the no-Master state; only its POSITION moves, and only on the branch that renders a rack. ⚠ **Anchored on the live `pv` reference**, not `.bw-card.bw-prev`: `.561` had to walk the DOM for the mount's ancestor because it runs later from `ops_init`; here the reference is in scope, so no class name can go stale. `ops_init` still lands the OPS row at the ancestor's `nextSibling`, so the order is **rack → OPS row → PASTE**. **Tests:** `30-rack-above-the-fold` **4/4, `:79` green for the first time since `.462`** · `48` + `44` + `01-nav` 27/27 · `29` + `47` 8/8 · `03-tools` at its F-1 ten. |
| ✅ Closed `.565` | **The drawings leave the default path** — RACK-ELEVATION-DEMOTE Ship 2, sliced **2a/2b** by owner ruling; this is 2a, the visible half. Rack detail no longer renders the elevation card or the minimap strip; `OPEN AISLE` is untouched and is now the only rack-picture door. ⭐ **THE INFORMATION STAYED AND SHIPPED FIRST** — `.564` put the U position on every DEVICES row, so the list carried the fact for one **verified** ship before the picture left. That overlap is the slicing working, and it is now spent. ⛔ **WHY 2a AND 2b ARE SEPARATE:** S-6 says *"no dead code left behind,"* but in one stroke that meant deleting four functions, a CSS block and resolving five external guards **in the same ship as a visible surface removal**, on a 60k-line file with no type checker. 2a is visible and trivially revertible; 2b has **no** visible change and is provable by grep. ⚠ **A SCOPE CORRECTION OWED AND RECORDED:** the 2a/2b boundary was proposed as *"markup plus three rAF calls, low blast radius"* — **wrong.** All four tests in `47-rack-detail-aisle-return` assert `flatVisible` and `29` asserts `#rackCanvas`; removing the elevation removes their instrument, so 2a necessarily carried test surgery. ⭐ **RE-POINTED, NOT RETIRED, AND THE DIFFERENCE IS THE RULE:** `03-tools`' pin was retired because its intent was superseded **and** the coverage already existed in `48`; here the intent survives whole and has no other home, so only the instrument moved — to the DEVICES list. `29`'s comment now records that this is the **second** time its instrument moved for the same reason (WebGL mount → `#rackCanvas` at `.531` → DEVICES list here). ⛔ **2b's DEBT IS IN THE SOURCE, NOT ONLY IN A DOC:** `rackHybrid_initSync` (`:38556`), `railSel_bindFlat` (`:41010`), `rackFlat_applyFit` (`:41037`) and `scrubbar_buildHtml` (`:41073`) are orphaned — each had exactly one caller and it was here — and `#reh3dCanvasHost` is gone from the DOM while **five** external paths still look it up (`:19619`, `:19650`, `:22189`, `:23719`, `:39244`), fail-safe but permanently null: the `.473` shape. ⚠ **NOT dead:** `rackElevation_buildHtml` stays live for the Command hero (`:23705`) and `RackEngine.renderFlat` (`:38841`, under R-05); both ride the `--u-h` **CSS default** the renderer emits at `:40927`, and `rackFlat_applyFit` only ever overrode it. **S-14's zero-reference gate is unreachable while those two exist and was not attempted.** ⭐ **S-8 is resolved by removal** and the clipped-`U48` attribution question is **moot** — both halves are gone. |
| ✅ Closed `.564` | **The devices list carries the U position** — RACK-ELEVATION-DEMOTE **Ship 1**, the additive half. ⭐ **SCOPE CORRECTED BY MEASUREMENT BEFORE ANY EDIT:** S-1 asked that every device row *gain* a U element, but `:41800` has emitted one since `v1.6.97` — re-shipping that would have been churn, so the ship narrowed to what was missing and said so (`.559`'s shape). **What shipped:** `DEVICES` opens by default (S-3, one attribute on a native `<details>`) · rows sort **U descending** (S-2) · the row clears the 44px floor via `min-height:var(--tap-s)` + border-box with the U value at 14px (S-4) · the label matches `rackElevation_buildHtml` (`:40944`) and `scrubbar_buildHtml` (`:41188`) **exactly** — en dash, U both ends — and an unrecorded position renders **`U —`** (S-1). ⛔ **CONTRACT B10 IS THE POINT OF THE LAST ONE:** an absent `uStart` used to render **nothing**, so *"no position recorded"* and *"this device has no U"* looked identical to a tech. **It is the only change in this ship that alters what a tech sees for existing data;** everything else reorders, resizes or expands what was already on screen. ⚠ **S-2 SORTS A COPY** — `rack.slots` is the persisted array off `deploy_loadRacksFor`, and sorting it in place would rewrite stored order as a side effect of rendering. It reuses `scrubbar_buildHtml`'s comparator at `:41086` rather than authoring a second ordering rule for one dataset. ⚠ **THE ROW STAYS NON-INTERACTIVE, DELIBERATELY:** S-4 also asked that the tap target be the full row, but the row has **no action defined** and Contract B14 forbids a control that does nothing. Sized to the floor, left non-tappable — **the ship that makes it tappable must first say what a tap does.** ⚠ Display stays **block**: the row's contents are concatenated inline, and a flex container would promote each fragment to its own flex item and stack them. 📌 The block's header comment read *"Device List (collapsed)"* and this ship made that false — corrected in the same stroke. **Tests:** `01-nav` 19/19 · `48-ops-row-exists` 5/5 · `26-rack-detail-surface` + `47-rack-detail-aisle-return` 8/8 · **`03-tools` 10 failed / 18 passed, byte-identical to `.563`** — F-1 neither closed nor worsened, and failures did not increase anywhere. ⭐ **Anchors were re-verified and RECORDED before the edit** (`docs/RACK-ELEVATION-PHASE0-EVIDENCE.md`, commit `9909919`), per the base spec's own bounds. |
| ✅ Closed `.563` | **The retired rail's last write.** ⭐ **`.321` retired the `.159` sliding reactor rail by HIDING it, not by removing it** — the `<span id="bn-core">` stayed in the markup under `#bn-core{display:none}`, and `showMode` kept writing `left = index * 33.333%` into it on **every mode change for 242 versions**. ⛔ **The number was also wrong for the future:** thirds math against a nav Contract A8 takes to five pillars, where the step is 20%. Inert, invisible, never throwing — **the `.473` shape**, and the third instance of that class recorded this session (`.473`, `.531`, this). ⭐ **FOUND BY READING, NOT BY FAILING** — no test was red and no user could see it; it surfaced while authoring the Phase 1 amendment. ⚠ **Order was the risk and it runs against intuition:** `#bn-rail` is `display:contents`, so its children are promoted into `#rd-botnav`'s `repeat(4,1fr)`; `#bn-core` stayed out of that count **only** because it was `display:none`, which made the rule **load-bearing while the span existed**. Dropping the rule alone would have made it a fifth grid item and collapsed the nav — span first, then rule, one atomic edit. **Tests:** `01-nav` 19/19, its dead-write test replaced by one pinning the ABSENCE **and** asserting `#rd-botnav` still resolves to exactly four grid items (that second assertion is the one that catches the ordering trap). `48-ops-row-exists` 5/5, still asserting ten. ⭐ **Neutrality proven: `03-tools` = 10 failed / 19 passed at `.563`, byte-identical to `.557`, `.558` and `.559`** — F-1 neither closed nor worsened. One historical mention of `bn-core` is kept in the reworded comment on purpose: it is how the next reader learns the element was **retired, not lost**. |
| ✅ Closed `.561` | **The rack comes back above the fold** — ⛔ **and this repaired a REGRESSION `.558` INTRODUCED.** `ops_ensureContainer` inserted the OPS banner as `bwShell.firstChild`, where at **69px** it pushed `#bw-mount` from top **647 → 731** against a nav top of **722**. Measured with one probe at both versions: `.556` = above the nav, **75px** of rack visible; `.560` = entirely behind the bottom nav, **0px**. A tech in Field Mode had to scroll to see the rack the shift is about — undoing **R1-D**, shipped deliberately at `.442`. ⭐ **TWO OWNER RULINGS COLLIDED and both still stand:** SHIP-OPS-IN-PLACE (Build's tool door IS the OPS row) and R1-D. **Ordering satisfies both** — the door now sits one scroll-free tap BELOW the rack. ⚠ The insertion anchors on `#bw-mount`'s own top-level ancestor, **not** on `.bw-card.bw-prev`, which is `bw_render`'s private markup and would break silently on the next reshape; with no rack it warns and falls back. **Tests:** `29-context-follows-surface`'s two failures were **stale, not defects** — they encoded the pre-`.531` design where the rack detail held a WebGL mount, and `.531` deleted `#reh3dMount` by owner-approved ship. Red since 2026-08-29. Now 4/4. |
| ✅ Closed `.560` | **Six silently dead declarations in the OPS row.** `--text-primary` and `--text-tertiary` are declared **nowhere** — zero occurrences — and **an undefined `var()` invalidates its whole declaration in silence**, so six `color` rules were inert and their elements inherited from the parent. ⛔ **NOT NEW, AND PROVEN SO:** the dead-token set is byte-identical at `.556`. ⭐ **What IS new is that anyone can see it, and that part is ours** — the rules shipped in `.465` and sat inert for 85 versions because `ops_init` never ran; `.558` restored the row and `.559` added a tenth panel. **The defect is old; the exposure is the last two ships'.** Owner ruling: `--white` ×4, `--slate-dim` ×2, **with `opacity` removed in the same stroke** — `--slate-dim` is already the palette's dim step, so `.6`/`.7` were dimming twice and computed to ~2.2:1 against `--surf-1` at 9–10px, under the Cold Aisle bar. ⚠ **SCOPE, so this is not misread:** it does **not** close `19-design-tokens` (still red on `--tac` in the retired `.opswall` CSS the file itself calls *"deliberately LEFT… inert"*), does **not** close `44-tool-reachability`'s gloved floor (geometry, not colour), and does **not** touch `06-composition`'s contrast floor (`#rd-botnav .blabel`, a different element). Browser-visible dead tokens 3 → 1. |
| ✅ Closed `.559` | **The tenth tool, and the name collision** (IA-SHIFTNAV Ship 1; rulings V-1, 1a, tap trade accepted, OPTIC LEDGER approved). ⛔ **SCOPE CORRECTED BY MEASUREMENT BEFORE ANY EDIT** — `.558` had already made nine of the ten tools two taps away with zero scrolling, so Ship 1 as written by Phase 1 would have re-delivered done work. **What remained was ISOLATE and the name.** ISOLATE was in `DEPLOY_TOOLS` (`:32176`) and the Command Deck row but **not** in `OPS_PANELS_CONFIG`, so when `.558` made that row Build's door, nine tools came close and ISOLATE alone stayed ~2.9 screens down — **the one tool the accepted trade never paid off for.** It joins in registry order, icon and accent taken from `DEPLOY_TOOLS` rather than invented. ⭐ **Its statistic is written out, not defaulted, and Contract B10 is why:** `0` = no open isolations (a measurement), `—` = not measured. Different facts; rendering the second as the first is fabricated telemetry. ⭐ **THE COLLISION:** two surfaces answered to *OPTICS* — this deployment scanner and the fiber/MPO **reference** in Tools — so a tester told to *find the optics tool* reached the reference and believed they had succeeded. Deployment tool → **OPTIC LEDGER** in three label sites; reference keeps **OPTICS**. ⛔ **Only labels moved** — the `optics` key, `OPS_TABS` entry and the single live `rd_openOpsTool('optics')` call are untouched; renaming the identifier would have broken every door at once. ⚠ **`#cs-fieldtools` deliberately LEFT** (D-1 default on an unruled question): both entry points call the one canonical door, so Contract A2 holds, and removing it would break `03-tools`' order-sensitive wall assertion **and** strip desktop tool access at ≥1024. Pinned by `48-ops-row-exists` (5/5), which now asserts the **count is ten** so the next tool that joins the registry and not the row is caught. ⭐ **Neutrality proven: `03-tools` = 10 failed / 19 passed at `.557`, `.558` AND `.559`.** |
| ✅ Closed `.558` | **Build's tool door comes back.** It had not existed since `.473`. That ship removed the `ops_init()` call from `showMode('work')` and wrote that OPS *"will be triggered on-demand when user taps the OPS control"* — ⛔ **that trigger was never wired.** `ops_init` had **ZERO callers for 85 versions**, so the banner was never inserted, the ten OPS tools it fronts had no door on Build, and the 2026-08-19 ruling was quietly not in effect. ⭐ **AN INTENDED DEFERRAL LANDED AS A DELETION**, and it hid perfectly: the absence of a control looks exactly like a control you have not navigated to yet — no throw, no warning, no failing test. The IA-SHIFTNAV Phase 0 census found it by measuring FOR the banner. ⚠ **`.473`'S OWN DIAGNOSIS WAS WRONG AND IS CORRECTED BY MEASUREMENT:** it blamed *"phantom-api CORS errors"*; inserting a DOM node cannot cause CORS. The identical access-control pageerror was measured at `.557` with `ops_init` NOT armed — it comes from `phantomCheckApi` (`:55227`), a health-strip OPTIONS probe. The real cause was the second half of `.473`'s own note: the banner went in as first child of `#bw-shell` while `bw_render`'s WebGL was still settling. **The fix is the timing `.473` prescribed and never applied** — a double `rAF`. 📌 **A second defect fell out of the new test:** the OPS button measured **28px**, under the 44px Cold Aisle floor; it shipped that way in `.465` and was never caught **because it never rendered for anything to measure**. Now `min-height:var(--tap-s)`. Pinned by `test/e2e/48-ops-row-exists.spec.js`, 4 tests, mutation-proven. ⭐ **Neutrality proven by direct comparison, not asserted:** `03-tools` returns **10 failed / 19 passed at BOTH `.557` and `.558`**. |
| ✅ Closed `.557` | **The rack comes back after the aisle** (board Q-1, RACK-DETAIL BUG HUNT). Reach a rack detail from anywhere Build's 3D preview never mounted — the deep-link/back-nav restore, which calls `deploy_showRackDetail` from wherever the operator is — then OPEN AISLE and close: the elevation was **gone**, a 51px control rail over an empty box. ⛔ **THE CAUSE IS A CALLER SHIP A DID NOT AUDIT.** `.531` deleted `#reh3dMount` and the `reh3d_restore` call inside `deploy_showRackDetail`, but `reh3d_activate3D` has a SECOND caller — `forge3d_close`'s no-lender branch at `:19693`. After `.531` the rack detail registers **nothing** with RackEngine (`rackElevation_render3D` `:40773` is the only non-aisle registrar and this page no longer calls it), so from Build a lender exists and close hands the context back — **it looks fine** — but from Home there is no lender, close falls through, and the old order added `.is-3d` **before** looking for the mount. `:11119` then hides the flat wrap, the only rack visual since `.531`. ⭐ **`.531`'s OWN COMMIT BODY PREDICTED THIS EXACT FAILURE** for the wrong fix; it removed the caller it could see. **The fix is the ORDER** — resolve the mount first, return if absent — which closes the CLASS, not the instance. ⚠ **Why it hid: nothing throws, and the `.461` instrument measures the OPS host, which survives at 51px, above its own 8px floor** — so the zero-size instrument watched the rack go to 0px and said nothing. It also self-heals on re-render, so it presented as intermittent. Pinned by `test/e2e/47-rack-detail-aisle-return.spec.js`, 4 tests, mutation-proven. ⛔ **HONEST BOUND: this fixes A defect that emptied the elevation, NOT provably the one behind sandbox gate 2.** Evidence in `docs/RACK-DETAIL-BUG-HUNT-EVIDENCE.md`. |
| 📌 `.557` measurement trap | ⛔ **`#rehFlatWrap` is `display: contents` (`:11117`) and therefore has NO BOX** — measuring it for height reports a **false zero even when the rack renders perfectly**. This failed the first probe of the bug and briefly looked like a much larger defect. The honest instrument is its child `#rackCanvas` (`:40794`). **Any future rack-elevation test or probe measures the child, never the wrapper.** Recorded because this is the second time the display:contents class has cost real time. |
| ✅ Closed `.556` | **The multi-tab warning now reaches the phone.** ⛔ **Two things had to be true at once, which is why it hid:** `#phantom-tab-pill` is hidden by `@media (max-width:480px){display:none !important}` — a deliberate `.391` call, the wordmark overlapped it by ~93px at 390 — and `tab_pillRefresh` set an **inline** `display:inline-flex`, which can never beat an `!important`. So on every iPhone it updated a chip nobody could see, while `showBanner()` only ever renders into `#boot .boot-items` and returns early after boot. The warning moved **off the pill onto a toast**, which has no viewport constraint; it latches on the 0→N transition so a new tab warns again but an open one never nags. The pill still works above 480. ⭐ **Corrects my own Stage 3.4 wording** — I had recorded "no in-app warning at all"; it was hidden only at ≤480px. Pinned by `test/e2e/46-multi-tab-warning.spec.js`, mutation-tested. |
| ✅ Closed `.555` | **The pg-triage writers are gone**, with the page itself — `today_render` (338 lines), `triage_renderDeployCard` (88), `firstRun_renderChip` (15), 10 call sites and the 97-line page. −569 lines. ⭐ **The find was a live bug, not the waste:** `_session_startFresh` called `showPage('triage')`, and **START FRESH is a real button** in the resume banner — since `.553` removed the switch, `'triage'` is not in the guard's whitelist, so every tap toasted *"Not in the new UI yet: TRIAGE"* before landing on Command anyway. ⛔ Safe to delete because **none of the three wrote storage** and each touched only elements inside `pg-triage`; had any carried a side effect the fix would have been to re-point. `deploy_quick` survives — the redesign reaches it through its own doors. |
| Stage 2a result | ✅ **`.534` — Crash-Cart Mode deleted.** Owner-killed 2026-07-02; `.248` removed both doors and left the body for "the LR-2 atomic sweep", which was this ship. 4 functions, 10 CSS rules, 1 overlay div: **188 lines, −6,724 bytes.** Dead in BOTH houses, so invisible under `?legacy=1` too. ⭐ **Re-verified before cutting rather than trusting the census:** zero callers, and **no `.crashcart-active` rule survived**, so the `display:none` layer could not have appeared even if one had. Incident Memory Engine (row 2) needed **no ship at all** — already gone, three comments left. |
| Stage 1 result | ✅ **`.533` — `--omni-h` removed.** Written on every phase-dock render, read by nothing since `.282` deleted its only consumer, 251 versions earlier. ⭐ **The reason it survived is the finding:** `.282` recorded the write as *"inert and left as-is"*, which reads as a decision, so every later reader treated it as one. **Dead code described as deliberate stops looking like dead code.** Byte delta **+290** — the explanatory notes exceed the deleted block, stated rather than buried. |
| Findings (leads, not tasking) | 📌 **25 further zero-consumer custom properties**, none of them legacy: the violet/glow ramps, the `--z-*` scale, the `--hud-*` radius/easing/edge set, `--glass`, `--fbg`. All are `:root` design-system entries and therefore `PHANTOM_DESIGN_SYSTEM.md` property, out of bounds under Contract 15's ⛔ R-E. **Not to be swept as part of LEGACY-RETIRE.** · 📌 **The graph is stale (2026-08-28) and does not index the monolith's internals** — it returned nothing for `--omni-h` or `phdock_render`. · 📌 **The global `npx playwright` collides with the repo-local install** and fails with a bogus *"test.describe() called here"* at spec load. Drive the suite with `./test/node_modules/.bin/playwright -c test/playwright.config.js`. · ⛔ **THE PROMOTE TRAP — cost five attempts on `.533`.** The promote line was written with `&&`, but this box's interactive shell is **Windows PowerShell 5.1, where `&&` is a parser error**, so the whole chain died before the first `git` ran and looked like nothing happening. ⭐ **And `.533` appeared to be live the whole time:** `raw.githubusercontent.com/.../main/version.json` and the working-tree `version.json` both read the NEW version, because `main` had it — only the Pages URL and `git show origin/release:version.json` report what the phone gets. **Confirm a promote with `git log origin/release -1` after a fetch, never with a curl that might resolve to `main`.** The `!` prefix runs **bash**, so use forward slashes or no `cd` at all. |
| Open defects | ⚠ **Carried from `.519`/`.524`, found in review, none blocking:** blob-handle leak (`URL.createObjectURL` per thumbnail, `revokeObjectURL` called **zero** times) · photo orientation not corrected on the compress path, so a portrait capture can land sideways · **a third photo store** — `.519` opens IndexedDB `phantom-attachments` while the A.1 census documents `phantom-photos`, which nothing opens, so **any adapter written against that census targets a database that is never used** · compress can resolve empty and the persist step stores it anyway (a save that reports success with no image behind it). |

Authoritative check: `curl -s https://darkmatter024.github.io/phantom/version.json`

## 1a · GOVERNING PROGRAMME — owner rulings 2026-08-08

📌 **THE SPEC IS IN THE REPO AS OF 2026-08-10.** It had lived only in `Downloads` — the document
`CLAUDE.md` names as the programme of record was outside version control, could not be diffed, and
was unreachable from any session that could not see that folder. Copied in **verbatim**:
**20,362 bytes · `sha256 50dad65a643a20bd…`**, byte-identical to the source at the time of import.
⚠ **It is FROZEN — a genuine contradiction gets REPORTED, never silently resolved, and never edited
into the file.** The hash is recorded so a future session can prove the repo copy is the one that
was frozen; if it ever fails to match, someone edited a frozen document and that is the finding.
*(Git stores it LF and checks it out CRLF under this repo's `autocrlf`, so compare the git blob, not
the working tree, if you re-verify.)*

⭐ **`SHIP-TECH-FLOW-V2-FROZEN.md` GOVERNS.** Owner ruled 2026-08-08: the frozen spec is the
programme of record. Its seven workstreams — PHASE-ENGINE → SITE-PROFILE → CONTEXT-CHIP →
NAV-LOCK → CONTEXTUAL-SCAN → HONEST-HANDOFF → FINISH-PASS — supersede the blueprint's M0→M6
ordering as the delivery sequence. **The blueprint is not retired**: its architecture rulings
(R-01…R-06, R-02a) and the RackEngine spec remain law. What changed is WHICH ORDER work lands in.
Where the two disagree on sequencing, the spec wins; where they disagree on architecture, the
owner rulings win and the conflict gets reported, never silently resolved.

⛔ **`?legacy=1`, the Cold Aisle Filter, Data Honesty, three-stamp lockstep and the iPhone gate
are unchanged** — the spec restates them as non-negotiable doctrine.

⭐ **SHIP GATE = THE COMMIT HOOK, NOT THE FOUR SUBAGENTS.** Owner ruled 2026-08-08. Spec §10
mandates passes from `lockstep-auditor`, `surgical-edit-reviewer`, `data-honesty-auditor` and
`cold-aisle-qa`. **Those four cannot run.** They exist as files in `nexus01/.claude/agents/`, but
the session CWD is the home directory, so they are not loadable — which is why `BATCH-VERIFY`
records *"Agents barred, equivalents run inline"* three separate times over ~40 ships. A gate that
has never executed is not a gate. **`tools/hooks/phantom-guard.js` replaces them** and blocks a
commit on broken three-stamp lockstep, a non-compiling inline script, brace imbalance, damaged
CRLF, or a backtick in a commit body. This is an amendment to a FROZEN spec and is logged here
rather than edited into the spec, per its own §10 "ambiguity resolutions must be logged".

📌 **Identity is TWO people (spec §2), not one.** `siteLead` = authority; `currentOperator` = the
actor doing the work on this device. Every Event Log entry credits the ACTOR — work is never
auto-credited to the Site Lead. Implemented `.417`/`.418`.

⭐ **RE-AFFIRMED 2026-08-09 — THE SPLIT HOLDS.** The SITE-PROFILE architecture reset was re-issued
verbatim, and its §8 reads *"name = configured Site Lead, role = Site Lead"* — a single identity.
That is **superseded** by the frozen spec's §2 and by this ruling. Owner confirmed when the
conflict was raised rather than resolved silently: **the split holds.** Reverting it would
re-break who gets credited for work, which is the one thing the Event Log exists to get right.
⛔ **Do not "restore" §8's single-identity wording from the reset document.** It is the older text.

✅ **`.425` IS DEVICE-VERIFIED AND RELEASED** — owner, 2026-08-09: *"command deck looks right on the
phone."* Verify item 15 and its three legs are ticked.

⭐ **`.426` — DERIVED CACHES ARE NOT PERMANENT TRUTH (owner ruling, 2026-08-09).** A
parser/normalization upgrade **must not require the user to re-upload the Master**. If persisted
data was built under an older normalization: detect it, preserve the source data, rebuild the
derived inventory with the current normalizer, and persist the upgrade atomically.

📌 **The failure that produced that rule, worth not repeating.** `.424` was correct and served —
three stamps matched and the bytes carried the normalization — and the device verify still FAILED
with `s4:099` at 0 components. ⛔ **`.424` derived components only inside `phantom_parseMaster`, so
the fix ran at IMPORT and nowhere else**; `adoptRestored` normalizes nothing, so a device that
already held a Master restored the old normalizer's output forever. Correct code in front of data
built by code that no longer exists. **The general shape: when a fix is proven present but absent
in behaviour, ask which generation of code built the DATA in front of it.** `schemaVersion` could
not answer that — it says whether a payload can be READ, never which normalizer BUILT it.
✅ **CLOSED ON HARDWARE THE SAME DAY — `.424` AND `.426` ARE RELEASED.** Owner: *"s4:099 shows 19
components now"* · *"19 after reload"* · *"0a and 0c pass"*. All four behavioural legs of verify
item 0 are green: the rebuild happens with no re-import, it is stamped so it does not re-apply
(19 and not 38), SITE-HOSTS racks are not padded, and the Master keeps its identity through the
re-save. **The P0 that blocked the entire verify list is done.**

✅✅ **THE BATCH IS RELEASED — `.385`–`.428` CLEARED 2026-08-10. CALL 0 CAP RESET TO 1 OF 6.**
Final hardware pass, owner: *"offline pass good, no notch issues"* — closing items 1 and 2, the last
legs that genuinely required real iOS. **The verify debt that stood at 30+ open ships is cleared.**
🟡 **One stated exception: `.413` is NOT released.** Item 8's empty half has no live example —
`.424` resolved every cabinet in this Master — so the CYAN-not-red check has nothing to run against.
Left open rather than ticked: a check that cannot be performed is not a check that passed.

⭐ **THE LESSON OF THE LAST STRETCH, worth more than the ships.** Two real defects were found by
AUTOMATING work that had been delegated to the owner, and both had lived inside green suites for
months: the **one-way aisle transfer** (`.427`) behind an assertion whose bound *permitted* the
defect, and the **dead `--alert` token** (`.428`) behind a failure class no gate could see. Neither
would have surfaced from another device pass. ⛔ **And the mistake that had been sending them to the
device: "the harness SKIPS this" was being read as "this needs hardware."** They are not the same —
`05-offline` skips on `phone-webkit` because that browser never installs a service worker, and the
same suite runs 13/15 on `desktop-chromium`. **Check another project before spending a device pass.**

✅ **WORKSTREAM 2 — SITE-PROFILE IS COMPLETE (2026-08-10, `.432`).** `.415` atomic swap · `.417`
root record + migration · `.418` identity split · `.422` staging + ACTIVATE SITE · `.423` restore
re-enters boot · **`.432` the first-run gate finally has a destination worth arriving at.**
⛔ **THE HELD "BOOT GATE" NEEDED NO NEW CODE, AND THE HOLD WAS DESCRIBING A RISK THAT WAS NEVER IN
THE SPEC.** It has been wired into `launch()` since `v1.6.70` (`!siteProfile_isConfirmed()` →
`firstRun_show()`). Two things were recorded wrongly and both are worth correcting here:
· The hold read *"invalid profile → SITE SETUP only"*. The spec §3 says **"no `ACTIVE_SITE_PROFILE`"**
  — ABSENCE, not invalidity. `validity()` fails on SIX conditions including a blank `operator`
  (which `.418` deliberately made possible) and a missing `activeMasterId`, so gating on
  `isValid()` would route a device carrying a working 4,143-host Master into setup. **That is the
  cold-aisle lockout the hold existed to prevent, and it came from the summary, not the spec.**
· What the gate actually lacked was a **Site Lead field** (it predates the identity split) and a
  **Master step** (it could pre-fill FROM a Master but never load one). Both folded in at `.432`.

⛔ **AND THE MISTAKE THAT COST A SHIP: `.431` BUILT A SECOND DOOR.** Asked for the gate, I searched
for the SPEC'S NAME (`siteSetup`, `SITE SETUP`) rather than the CONCEPT, found nothing, and reported
a whole feature missing. The feature is called `firstRun_*` and is built against an approved mock
with a legacy branch. `.431` shipped a parallel flow — a Contract A2 violation — and `.432` reverted
it (−225 lines net) and folded the two genuinely-missing pieces into the canonical door. ⭐ **Before
building any flow, read the function that runs at the moment that flow would start.** `launch()`
answered it in one line and was never opened. A name-based grep is evidence about NAMING, never
about EXISTENCE, and specs routinely rename what the code already has.

✅ **SECTION B — THE RENDERER TRIO IS CLOSED, 2026-08-10.** Verify items **3, 4 and 5** all pass on
hardware: *"rack holds all 10, no slowdown"* · *"rack stays in build after close, all 10"* ·
*"legacy rack renders flat, no errors, no heat."* **Releases `.390`–`.396`, `.401`, `.403`, `.404`,
`.405` and the `.402` legacy half.** This is the HIGH-risk section the CALL 0 cap exists for, and it
is the arc that cost eight ships to stabilise. ⚠ Item 4 only passed because `.427` fixed a defect
that section had been carrying unseen since the aisle shipped — see below.

⭐ **`.427` — THE AISLE GIVES THE CONTEXT BACK TO WHOEVER LENT IT.** Verify item 4 failed on
hardware at `.426` (*"rack is gone from build after close"*) and passes at `.427` (*"rack stays in
build after close, all 10"*). **Releases `.403`, `.404`, `.405`.** `forge3d_close` used to restore
ONE hardcoded surface (rack-detail, via a call that no-ops elsewhere by its own admission), so an
aisle opened from Build never gave the context back. Now `forge3d_open` captures the attachment it
is about to displace — **before** `releaseOthers` destroys it — and close hands it back to that
lender. The `reacquire` callback is generic because `rackElevation_render3D` is the one renderer
behind every rack surface.

⛔ **THE DURABLE LESSON IS NOT THE FIX — IT IS HOW IT HID.** The test covering this asserted
`attachments.length <= 1` after close, and the defect value is **0**. **A bound that PERMITS the
defect reads as coverage**, and the spec header claimed "the aisle round trip leaves Build intact"
while no assertion ever checked it. Months of green suites, on the operational centre. ⭐ **When an
assertion is a bound (`<=`, `>=`, `toBeTruthy`, `not.toBeNull`), ask what the FAILURE value is and
whether the bound admits it.** Prefer naming the expected thing (`toBe('rack:bw-mount')`) over
bounding it.

⚠ **HARNESS NOTE 2026-08-09 — 18 FAILURES IN THE `.426` FULL RUN WERE ENVIRONMENTAL, NOT CODE.**
The full phone-webkit suite (199 tests) reported 172 passed · 9 skipped · **18 failed**, all in
`02-build-forge` and `08-forge-layout`, and the run took **1.0h against 22.1min** for the same suite
earlier the same day. Cause: WebGL context exhaustion on a loaded box. **Proven three ways, not
assumed** — `08` re-ran alone on the identical bytes 17/17 green; `02` re-ran alone 12/12 green;
and `09-master-binding`, which had failed 5 in isolation earlier, PASSED inside this run. The set
of failures moves between runs, which is resource exhaustion, not a deterministic fault. Earlier
the same day a stash-and-rerun proved `09`'s failures reproduce identically on unmodified `.425`.
⭐ **Before treating a Forge/WebGL failure as a regression, re-run that spec ALONE.** A red full
run on this machine is not evidence by itself.

⚠ **Round-trip trap fixed in the same ship, and it generalises:** `PHANTOM_MASTER_STORE.save()` read
`sourceFileHash`/`totalCables` from `.stats`, which **only a fresh parse has** — a restored payload
carries them at top level. Re-saving a restored Master wrote `null` over both. Any code that feeds
a RESTORED Master back into a function written for a PARSED one must be checked field by field.

⭐ **OWNER OVERRIDE 2026-08-09 — COMMAND DECK LAYOUT (`.425`).** The approved Command Deck mock
was ported into the real app's Command page **ahead of NAV-LOCK**, an explicit override of the
sequencing rule that barred visual redesign before that workstream completes. ⛔ **The override is
scoped to the Command Deck layout and nothing else** — it did not authorise changes to the baked
percentage artwork ruling, data-honesty behaviour, navigation architecture, state logic, gates,
metadata, the 44px floor, or any other screen. Do not cite it to justify a second redesign.
**Two follow-on rulings in the same exchange:** the deck composes **single-column at tablet (834)**
as well as phone — laptop and desktop are unchanged two-column; and the port was authorised for
push after the phone screenshot was reviewed. `?cshell=0` remains the rip cord back to the older
phone Command page.

📌 **`.425` did not build a new layout.** `#cmd-shell` already carried the whole deck, gated
`@media (min-width:1024px)` since `.412` because no phone composition had ever been authored. The
ship opened that gate and added one `max-width:1023px` adaptation block. ⚠ **The trap it exposed,
worth remembering:** opening a desktop gate downward also imports that composition's *chrome
contract*. The desktop block stands `.app-header` and `#rd-botnav` down because `#cs-side`/`#cs-top`
replace them — organs that only exist at ≥1024 — so the phone briefly had **no navigation and no
version/SW/network pills**. Those rules are now sub-gated at their own source. Hiding chrome and
reclaiming the gutter it reserved are also two separate edits: the first alone left `.page` inset
246px and read as a broken layout, not as missing chrome.

## 1b · ⭐ RACK RENDERER PROGRAMME + FORGE PARITY — COMPLETE AND DEVICE-VERIFIED 2026-08-12

Governed by `reference/PHANTOM_RACK_RENDERER_UPGRADE.md` (owner directive, imported to the repo
with its mockup and both hashes recorded). Baseline, findings and the corrected reference analysis
are in `R1-RENDERER-BASELINE.md`; the parity staging is in `FORGE-PARITY-PLAN.md`.

**R1** baseline · **R1-D** `.442` the rack came above the fold (visible pixels 0 → 176) ·
**R2** `.443` cabinet depth RD 4.5→9.0 · **R3** `.444` families stop inventing state ·
**R4** `.445` material reuse + powder coat · **R5** `.446` light rig onto the palette ·
**R7** `.447` camera framing · **R6** `.448` LOD verified + CDU is cooling · **R8** `.449` polish ·
`.450` coolant plumbing gated · **P1** `.451` geometry extracted · **P2** `.452` focused aisle rack
canonical · **P3** `.453` whole foreground window canonical.

⭐ **MEASURED END TO END, like for like.** The pre-programme build (`.441`) was checked out and run
against the IDENTICAL 19-device s4:099 seed: meshes 1610→1416, geometries 1547→1353, materials
351→306, triangles 57,200→51,542, draw calls 484→417. **Every count went down** — the rack looks
substantially better and costs ~14% fewer draw calls than before the programme started.

⛔ **THE DURABLE FINDING, worth more than the visuals: the renderer had been asserting four things
the Master never said.** Fabricated switch-port state drawn with `Math.random()` and reshuffled
every render · green blinking LEDs claiming per-device health against telemetry PHANTOM does not
receive · a CDU rendered, labelled and tallied as a PDU · coolant manifolds and pipes on every rack
including air-cooled ones. All four are now gated on real data or removed, and each is pinned by a
spec that was proven to catch it.

⭐ **THE RULE THAT CAME OUT OF IT, now in the source:** STATE colours (green/amber/red) may NOT be
used decoratively; ACCENT colours (cyan/violet/teal) MAY carry family identity; nothing blinks,
whatever its colour. And randomness is a defect when it decides what the rack DEPICTS — never when
it places atmosphere.

📌 **What the programme did NOT do, deliberately.** §26's floor reflection was NOT actioned: the
floor is a `MeshBasicMaterial` taking no light, no env and no shadow because `receiveShadow` was
REMOVED to kill a sweeping specular pool, and the subtle reflection §26 asks for is the wet clone
that already ships. Adding a contact shadow would revert a documented fix. The baked aisle face
(`DEPLOY_FORGE_FACE_B64`) was NOT retired: it is still referenced by the thirteen background shells
and empty pads, which §33 rules should stay cheap context.

## 1c · ⭐ `.454` — FORGE IS RACK-CENTRIC (owner ruling 2026-08-12). AUTOMATION GREEN, HARDWARE OPEN

The aisle was a free orbit that happened to start pointed at a rack: drag mutated yaw and pitch,
pinch and wheel mutated radius, and **nothing ever put them back** — so focusing the next rack only
slid `camX` sideways and inherited whatever angle the last drag left. Two technicians on the same
floor could read the same cabinet from different places and neither was the framing the rack was
designed to be read from. `LOCK_YAW`/`LOCK_PITCH`/`LOCK_RADIUS` are now the canonical framing —
**the values `setFocus` was already targeting**, so the locked view IS the view the product already
chose; what changed is that every navigation restores it. `walk()` routes through `setFocus`, so
the arrows and flanks inherit it through the same door.

⭐ **WALK AISLE is a MODE, not a setting.** Default off, `aria-pressed`, lit cyan while engaged.
⛔ **Deliberately NOT persisted and NOT a preference** — a stored camera lock would make the aisle
behave differently for two technicians on the same floor. Leaving snaps back to the framing of the
rack the tech is **nearest to**, not the one focused on entry.

⛔ **THE DEFECT THIS SHIP FOUND IN ITS OWN FIRST CUT, and the file already had the rule.**
`setWalkMode` hand-wrote `#tagState`, which has **one writer per SHAPE** (`writeStatusPills`) — a
rule recorded there because a caller once put a concatenated string into a pill that owns a single
clause. Worse: **`setFocus` early-returns when the rack is already focused**, which is exactly what
a look-around-and-come-back lands in, so the *common* exit wrote the rack LABEL into the pill that
owns `n/m RACKED · ⚠n FLAGGED` — duplicating `#tagId` and dropping the flagged warning until the
next focus change. Fixed by lifting the write into `writeStatusForRack` and routing the mode banner
through `writeStatusMessage`.
⭐ **The generalisation, worth more than the fix: when you add a second caller to a function with an
early-return guard, work out which path is actually COMMON.** The guarded path was not the edge case.

📌 **Camera-target vars were authored ~500 lines below the two functions that write them**, safe only
because every caller runs async. Colocated with `camTargetX`/`radiusTarget` above both writers.

⚠ **DISCLOSED AND UNRULED — in locked mode a drag moves nothing**, and the hint still hides itself
on drag, so the gesture reads as dead. WALK AISLE is one tap away. Whether a locked drag should
*say* so is a product call and is **not** to be invented.

**Runs (phone-webkit, each spec ALONE):** `36-forge-rack-centric` 4 · `02-build-forge` 14 (incl. the
×10 round trip, one live context every round) · `08-forge-layout` 17 passed / 1 skipped.
**Gates:** `phantom-guard` exit 0 — three-stamp lockstep at `.454`, inline blocks compile,
`node --check sw.js`, valid JSON, brace balance, 0 bare LF.

## 1d · ⭐ `.455` — LOCKED RACK MODE IS A CANONICAL FRONT ELEVATION (owner ruling 2026-08-13)

⛔ **`.454` LOCKED THE WRONG POSE, and the owner caught it on hardware.** It froze the camera at the
angles `setFocus` had always targeted — `LOCK_YAW 0.10`, `LOCK_PITCH 0.08` — and called them
canonical. That is **5.7° of yaw and 4.6° of nose-down pitch**: a three-quarter shot held steady, so
the cabinet leaned, its rails converged and the neighbour competed with it. ⭐ **Locking a pose and
having a canonical one are different things, and "the values the product already used" was not
evidence that those values were right.** The owner's instruction was explicit and correct — fix the
MODEL, do not nudge world coordinates until one rack looks acceptable.

**Three more faults in the same function, all found by reading it rather than by the report:**
· a bare `+ 0.4` on the eye's y with **no matching target offset**, tilting the axis even at pitch 0,
so the rails could never project as vertical · the look target was `(camX, RH*0.5, 0)` — the eased
camera x plus the **hardcoded aisle origin**, i.e. derivation from world origin, not from the rack
· FOV **46°**, a cinematic aisle lens on what is an inspection surface.

**The model now.** Solved from the selected rack every frame and from nothing else:
`target` = rack world centre · `normal` = `(0,0,1)` through `getWorldQuaternion` (so a rotated slot
would still read square) · `position` = `target + normal * distance` · world up + `lookAt` ⇒ yaw,
pitch and roll zero by construction. ⭐ **`position.y === target.y` makes the axis HORIZONTAL, and
that is the entire reason vertical rails project as vertical lines.** No read of previous camera,
previous rack, accumulated pan, orbit state or origin.

📌 **The usable viewport is MEASURED.** The canvas is not the visible area — the scene-utility rail
hangs into its top-right and the bottom stack covers its foot. `lockUsableRect` reads both from the
DOM at the moment of use (`:13544` records what happens when that clearance becomes a constant), and
`setViewOffset` slides the **projection** onto the usable centre. ⛔ **Recentring by moving the
camera would reintroduce the exact yaw the mode exists to remove** — the projection is the only
honest lever. Same mechanism buys label headroom with **zero degrees of pitch**.

⛔ **THE DEFECT MEASUREMENT FOUND, and the durable shape of it.** The first cut snapped the ease on
**total 3-D distance**. Every rack shares one canonical y and z and only x differs, so the large x
delta held the whole vector above threshold: y and z never snapped and crept `1.8869 → 1.8971 →
1.89925` across a walk — **a camera height that depended on how many racks you had visited.**
⭐ **When several axes share one convergence test, the axis with the largest delta decides for all of
them.** Snap PER AXIS. The first lock is also instant now, because Forge opening must *present* the
canonical pose, not glide into it from wherever the camera was constructed.

**Measured at 390×844:** `s1:010 −4.70` · `s1:001 −2.35` · `s4:100 0` · `s4:099 +2.35`, every one at
**y 1.9, z 10.32353, forward (0,0,−1), roll 0**. The cycle out and back returns bit-identical.
Vertical framing corrected from a measurement, not by eye: at `LOCK_BIAS_Y 0.06` the shot had 63px
of slack above the label and 16 below the feet in a 620px band, so the cabinet stood on the bottom
edge with its base under the hint; `0.023` splits it 40/25.

📌 **Deliberately NOT done: orthographic.** The ruling permitted it. It would thread a second camera
type through RackEngine, the light rig and the fog — all under RACK SCENE LOCK, where **only the
`camera` term is open**. A 34° perspective already gives square verticals because the axis is exactly
horizontal and centred; the remaining convergence is on the NEIGHBOURS, which is honest depth, not
distortion of the selected rack. No second renderer.

🟡 **Known cleanup, deliberately not shipped.** The camera is still *constructed* at `46` and
reassigned to `LOCK_FOV` immediately after, so a stale literal survives in the source while the
runtime FOV is 34 (spec 37 asserts it). Fixing it is a pure refactor with no runtime effect and
would cost a version bump purely to keep version identity honest — it belongs to the next ship that
touches this function.

**Runs (phone-webkit, each spec ALONE):** `37-locked-rack-pose` 4 · `36-forge-rack-centric` 4 ·
`02-build-forge` 14 · `08-forge-layout` 17 + 1 skipped. **Gates:** `phantom-guard` exit 0.

## 1e · `.456` — THE HANDOFF CARD ART STOPS FABRICATING STATUS

The shipped raster baked readable status into the image: `RACK BUILD Complete`, `CABLE REPORT
Complete`, `POWER CHECK Complete`, `INTAKE SYNC Complete`, `READY FOR HANDOFF`. **None of that is
data PHANTOM has** — fabricated completion state rendered as real, on the card a tech taps to reach
the handoff flow. Contract 10, and it had been shipping behind an owner override of the
honesty-lock hold. The replacement carries no readable text and no logo, so **the override is
retired rather than renewed.**

⛔ **WHAT THIS SHIP DOES NOT CLAIM, recorded so nobody reads it as a completed brief.** The owner's
brief also asked for a ticked checklist, rack status blocks and a port-map detail on the tablet
screen, and for the exchange to read unmistakably as one hand releasing while the other receives.
**The delivered art has none of the three widgets and the grip still reads as two people holding.**
It shipped because the honesty fix is live-affecting while the rest is aesthetic refinement.

📌 **No image tooling on this box and none was installed** — no `cwebp`, `sharp` or ImageMagick.
Playwright's Chromium did the conversion via `canvas.toDataURL('image/webp', 0.86)`: 2172×724 /
1468 KB PNG → **1170×403 / 44 KB**, the 39px cover-crop taken entirely from the LEFT because a
centre crop would eat the receiving hand while the left is empty black by design. ⭐ **That is the
reusable raster path on this machine.**
⚠ New `-v2` filename because overwriting a precached asset in place serves the old bytes.
**Device verify needs the PWA removed and re-added, not a reload.**

## 1f · ⭐ SHIP-CONTEXT-INJECT-369 V3 — RESCOPED BY OWNER RULING 2026-08-13

The frozen spec (`Downloads/SHIP-CONTEXT-INJECT-369-V3-FROZEN.md`) was written without sight of
live code and **§1 and §6 describe building what already exists.** Owner ruled: execute the
INTENT against live code, report deviations. ⛔ **Do NOT build a second site-profile store.**

**Already built — do not rebuild:** `SITE_PROFILE_KEY = 'phantom_site_profile_v1'` :24091 (the
spec's exact key, on a **V2** schema via `siteProfile_migrateV1toV2` :27128, so §1.1's
`schemaVersion: 1` would REGRESS it) · `siteProfile_load/save/isConfirmed/resetToDefaults` ·
`siteProfile_getContextBlock()` :27548 = §1.2's `toPromptBlock()` · `siteProfile_showEditor()`
:29561 = §7's editor · **`activeContext_getContextBlock()` :27668 is already the single choke
point** and its own comment says so · **§6's call sites are already wired** at :36365, :46801,
:47812, :49064, :49465, :50000, :53042.

**The genuinely new ship:** the §3.1 honesty guard header (absent — the block starts straight into
`SITE PROFILE —`) · §3.2 token cap, boundary-only truncation, drop order · §3.3 deterministic
MASTER slice · §4 evidence discipline · §5 `AI_PERMISSION` + `assertAIPermission` (**confirmed
absent**) · §7 CONTEXT PREVIEW · and four JobState fields.

**§2.1 field mapping — the gate, answered:**
· **Already emitted:** SITE · DEPLOYMENT · ACTIVE RACK
· **INCLUDE (new):** PHASE (`phantom_phase_model_v1`; ⚠ emit state, never the placeholder step
prose) · AUDIT (`phantom_audits_v1`, `phantom_active_audit`, `phantom_deploy_audit_v1`) ·
LAST SCAN (`phantom_scan_collection` :23152) · SHIFT/OPERATOR (`phantom_current_user_v1`,
`phantom_identity` — **credit the ACTOR, Contract 9a**)
· **INCLUDE degraded:** MANIFEST — `phantom_manifest_last_deploy` :31880 holds a deployment **id
string only**, so a presence flag is all it can honestly say
· ⛔ **EXCLUDE:** BOM match % (no computed figure exists; §2.2's own condition unmet) · PORT MAP
(no persisted state key) · BURNDOWN (**no `phantom_burndown_*` key**)
⭐ **BURNDOWN is the honesty trap in this spec.** Open counts ARE derivable from
`phantom_deploy_issues_v1` / `phantom_discrepancies_v1` / `phantom_blockers_v1` — but labelling
that "BURNDOWN" binds a panel to a NAMED SOURCE rather than to the truth. It ships as
`OPEN ISSUES / BLOCKERS` or not at all. **Owner ruling still owed on the label.**

✅ **SHIPPED AS `.457` — 2026-08-13.** The device pass cleared, the hold was spent, and the owner
ruled the last open label (`OPEN ISSUES / BLOCKERS`). See §1g.

## 1g · ⭐ `.457` — THE CONTEXT ENGINE SHIPPED (369 V3, rescoped)

`buildContext()` is the single entry for all **7** AI calls. Honesty guard header first and
**never dropped**, then the existing site/deployment block, `jobState_snapshot()`, a deterministic
MASTER slice, then caller `extra` — under ~2200 tokens, truncating **only at line boundaries** with
`[+N more records omitted]`. ⭐ **A prompt cut mid-record hands the model half a fact that reads as
complete**, which is worse than omitting it. `AI_PERMISSION = 'READ'`; `assertAIPermission` runs at
the choke point; SUGGEST and CHANGE both throw and **CHANGE has no implementation path anywhere.**

⛔ **IT WRAPS THE EXISTING DOOR — there is no second site-profile store and no second choke point.**
Anyone reading the frozen spec later will find §1 and §6 describing work that was already done;
that is why §1f exists.

**Three honesty decisions inside the field set, all recorded because each one is a place the spec
asked for a number the app does not have:**
· **`OPEN ISSUES / BLOCKERS`** (owner ruling) — the counts are real; "BURNDOWN" is not a record
· **`AUDITS RECORDED`** — the spec asked for "N warnings"; **no warning count is computed anywhere**,
so emitting one would invent a figure
· **`MANIFEST`** degraded to a presence flag — its key holds a deployment id string and nothing else
· **BOM match % and PORT MAP excluded outright** for having no backing source

⛔ **THE PLACEHOLDER TRAP, and it would have been invisible.** `PHANTOM_PHASE_MODEL` seeds every
step with the label *"step not yet defined for this site"* because real commissioning procedure is
site knowledge the app does not have (§2). Emitting those labels would have fed a model fabricated
procedure wearing a checklist — and it would have READ as authoritative. **PHASE emits state only**,
and spec 38 pins that the placeholder string can reach neither the snapshot nor the prompt.

📌 **`OPERATOR` resolves through `identity_getUser()`, never `phantom_current_user_v1` directly.**
:24106 records that the raw key was a SECOND persisted answer to "who is working", demoted to a
migration fallback — reading it here would have resurrected the split-brain `.418` deleted.

📌 **CONTEXT PREVIEW is built by CALLING `buildContext`, not by describing it.** A preview from a
second code path would eventually disagree with what actually ships, which would make the one
surface built for debugging attribution the thing that lies to you.

⚠ **Deliberate deviation:** the callers' system prompts are NOT routed through `extra`. Each site
concatenates its whole feature prompt after the context block and `extra` is capped at 500 tokens,
so routing them would have silently truncated the instructions that make each feature work. **The
~2200 cap governs the context ENGINE's output; the feature prompt is separate and always was.**

**Runs:** spec 38 (7) · `10-site-profile-root` (18) · `03-tools` (28), each ALONE.

## 1h · ⛔ `.458`/`.459` — P0: THE SW UPDATE BUTTON DID NOT COMPLETE THE UPDATE

Reported on a real installed iPhone PWA at `.457`: the purple **SW UPDATE** control appeared and
tapping it did not move the app to the new build. Owner's **case C compounded with case F** — a
badge shown with no worker waiting, and a reload answerable by a stale shell.

⛔ **ROOT CAUSE: `sw.js` called `skipWaiting()` during INSTALL, so a worker NEVER reached
`waiting`.** Everything downstream was built on the assumption that it did, and each fault hid the
next: the app posted `SKIP_WAITING` only `if (reg.waiting)` — therefore never · **`sw.js` had no
`message` listener**, so the message had no receiver either way · **there was no `controllerchange`
listener anywhere in the app**; the reload was a blind **80ms `setTimeout`**, which on a real phone
always fires before a worker can take control · and `phantom_versionFileBackstop` forced the badge
on a `version.json` mismatch alone, so it could appear with nothing installing and nothing waiting.

⭐ **A SIXTH FAULT MADE THE RELOAD UNRELIABLE EVEN IF THE REST HAD WORKED.** Navigations were
*described* as network-first but called plain `fetch(event.request)`, which uses the **default HTTP
cache mode** — Pages serves these with a `max-age` — so the browser's own cache could return the OLD
shell **while reporting success**. Separately `version.json` was served **cache-first** from
`PRECACHE_URLS`, so the backstop meant to catch stalled detection was answered out of the old
build's own cache. ⭐ **`cache: 'no-store'` is an HTTP directive and does NOT bypass a service
worker** — that mistake is easy to repeat.

**The fix is one path:** install → **WAIT** → badge only if `phantom_swActionable()` finds a waiting
worker → one tap → `phantom_swApplyUpdate()` (the single door; the byte-identical copy inside
`sw_pillTap` is deleted) → `SKIP_WAITING` → the new message handler promotes it → activation →
**one gated `controllerchange`** → **one** reload. Navigations fetch `cache:'reload'`; `version.json`
is network-first. The control shows `UPDATING…`, ignores repeat taps, and on failure restores itself
and says why.

⛔ **TWO DEFECTS THE NEW SPEC CAUGHT INSIDE THIS SHIP, both mine, and the second is the one to
remember.** First: the failure path called `sw_pillRefresh` to restore the control, but the honesty
guard added in the same change refuses to paint UPDATE with nothing waiting **and** refuses to touch
a `busy` pill — so a failed activation left the button reading `UPDATING…` forever. *The guard
against dishonesty reintroduced exactly it.* Second, and worse: **the `controllerchange` listener
was ungated.** On a first load there is no controller, so `clients.claim()` moves the page from
uncontrolled to controlled and fires `controllerchange` by itself — **the app reloaded itself on
every first load.** `05-offline` caught it as a page silently resetting mid-test; in a cold aisle it
is an app rebooting under a technician's hands for no visible reason. The reload is now gated on
`_swUpdating`: it happens only as the completion of an update the technician asked for.
⭐ **Proven by stash-and-rerun** — baseline passed, the change failed, and after the gate `05-offline`
returned to its documented 13 passed / 2 skipped. **That is the technique for "is this mine?".**

📌 **`.459` is a NO-OP TEST PAYLOAD — three stamps, a two-line code diff, no behaviour change.** It
exists so the update mechanism can be verified with nothing else able to explain a version change.
⚠ **It only proves anything if the device is already RUNNING `.458`.** A device on `.457` is still on
the broken path and will jump straight to `.459` without exercising the fix.

**Runs:** spec 39 — **7 passed on desktop-chromium AND 7 on phone-webkit** · `05-offline` 13 passed /
2 skipped on desktop-chromium. ⭐ **The lifecycle is automatable because Chromium installs service
workers** — the standing lesson that "the harness skips it" is not "it needs hardware".

## 1i · ⭐ `.460` — THE SHIFT WALK: ITS DOOR WAS DEAD

Owner-queued 2026-08-11, walked 2026-08-14 by **opening the surfaces**, not reading their CSS.

⛔ **SHIFT WAS NOT UNDOORED — IT WAS DEAD-DOORED, and the record said otherwise.** D-1 read *"It
renders today as one pill on Command."* It rendered nowhere a technician could see.
`shift_openSheet` had **exactly one caller in the entire app** — an onclick on `#cc-shiftpill` —
and that pill measured **0×0, unreachable at 390 AND 1440**, because it sits inside `.lens` →
`#cc-center`, both `display:none`. `.lens` is the pre-`.425` phone composition the Command Deck
replaced; the pill was left inside it, in the retired `cc-` Crash-Cart namespace.
`shift_renderHero()` wrote into that hidden node successfully on **every clock tick** — no warn, no
toast, and **no way for a technician to set a shift end at all.**

⭐ **THE FIRST RE-HOME LANDED IN A SECOND HIDDEN NODE, and that is the durable part.** `.382` had
left a note saying the microbar slot `#cs-shift` was where "Phase 2 re-homes it properly", so that
is where it went — and **`.cs-microbar` is itself `display:none` at 390** (`:58507`, the same phone
rule that hides `.cs-hd`). Present, wired, correct and dead, exactly like the pill it replaced.
**Spec 40 caught it only because it measures GEOMETRY and hit-testing rather than presence.** A test
asking *"is the control there and wired"* would have passed through both defects.
📌 **The door is now `#cs-shiftbar`, a row in `#cs-grid` — the deck's own flow container — where
visibility is STRUCTURAL: it cannot be switched off by a composition rule without being visibly
removed.** The microbar keeps its clock and `cmd_clock` stays its only writer.

📌 **TWO THINGS ARE BOTH CALLED "SHIFT". Do not conflate them** (also corrected in D-1). What ships
is a **shift-END timer** — 6 AM / 6 PM / +12h / custom / clear, a healthy sheet, 6 controls all
≥44px. The **9-question SHIFT pillar** D-1 argues about is a different, larger concept. Making the
timer reachable does not advance the pillar.

✅ **SITE/SYSTEM PASSED ITS WALK AND NEEDED NO CODE.** 13 visible controls, **zero dead handlers,
nothing under 44px**, contents purely administrative. The brief's specific suspicion — operational
features misplaced on an administrative surface — was **unfounded**. The walk also confirmed `.457`
live there: honesty guard, evidence rule, SITE PROFILE block, `JOB STATE: OPERATOR`, token count.

⚠ **Disclosed, not fixed:** a `"Loading storage metrics…"` line that never resolved during the walk
(verify on device before calling it a defect) · `"CONTEXT INJECTION ACTIVE"` names **three** AI
surfaces when `.457` wired **seven** — understated rather than false, but now inaccurate copy on an
honesty-adjacent panel.

## 1j · `.461` — BUILD'S CONTINUE CAN NO LONGER FAIL SILENTLY

Reported: CONTINUE on BUILD / FIELD MODE looked active and did nothing. State `s1:002` ·
*Platform not in Master* · Phase 1 of 5 MECHANICAL · 0%.

⚠ **THE HONEST BOUND ON THIS SHIP: that state REPRODUCES CLEANLY in the harness and CONTINUE
WORKS.** 326×56, hit-tests to itself, `pointer-events: auto`, nothing covering it, calls
`deploy_showRackDetail` without throwing, host renders 390px with a back control. **This ship does
NOT claim to have fixed the reported failure and must not be read as having done so.** What it
fixes is why that failure was **invisible**.

⛔ **THREE SILENT EXITS ON ONE PATH:**
· `deploy_showRackDetail` held a bare `if (!c) return;` — **and bailed AFTER its side effects**:
`ops-detail` on `<body>`, `nav_push`, `activeContext_setRack`, `stripeView_setRack`,
`wakeLock_evaluate`. **The app believed it had navigated to a rack detail it never drew**, and the
CTA's own `try/catch` could not help because *nothing throws*.
· `deploy_ensureDeployPanelVisible` gave up silently when the deploy sub-tab button was absent,
leaving the host switched off for a caller about to render into it.
· **Nothing checked that the render landed anywhere visible.** `innerHTML` into a hidden or
zero-height host succeeds perfectly — the recorded *silent-success-into-a-hidden-node* class.

**Fixed surgically:** the missing-host return warns, toasts the reason, and **clears `ops-detail`**
so the app stops believing it navigated · the missing sub-tab warns · a **deferred `rAF`** measures
the host after `innerHTML` and reports a hidden or zero-height render.
⚠ **The `rAF` defer is load-bearing** — measuring synchronously at `innerHTML` reports a false zero
on a host that is about to lay out correctly.

⭐ **AN ENVIRONMENT ARTIFACT NEARLY PRODUCED A FIX FOR NOTHING.** The first diagnostic seeded storage
then reloaded **after** boot, which re-showed the splash and left `#pe-tapcatch` (its full-screen
`inset:0` catcher) over the page. `elementFromPoint` duly reported the splash intercepting CONTINUE
— **which looks exactly like the reported symptom.** Seeding through the fixture made it vanish.
**Prove an environment artifact is not the cause before fixing what it appears to show.**

## 1k · `.462` — HOME CARD ART: SHIFT HANDOFF AND SITE PROFILE (owner directive 2026-08-14)

Asset replacement, **not a redesign**. No logic, routing, Master state, handoff data, Site Profile
data or navigation changed.

**Was:** the stylised portal / transfer-machine panel `phantom-feat-handoff-v2.webp` on **two**
handoff surfaces — the Work→Handoff hero and the Command Deck FIELD OPERATIONS tile — and the
**PLATFORMS** art in the Site Profile sheet's hero slot, which described a sub-section of that sheet
rather than the sheet.
**Now:** `icons/phantom-feat-handoff-v3.webp` on **both** handoff surfaces (one canonical source)
and `icons/phantom-feat-siteprofile-960.webp` on the Site Profile hero.

⛔ **A STANDING OWNER OVERRIDE IS RETIRED, AND THAT IS RECORDED IN PLACE RATHER THAN DONE QUIETLY.**
The old handoff art shipped baked `SOURCE_SYNC 88% / STEP 4 OF 9` under an explicit **2026-07-21**
ruling whose comment read *"do NOT correct it back."* The new directive retires that image and
forbids baked labels, percentages and fake telemetry in this artwork. **The later ruling wins; the
override is spent, not ignored** — and the code comment now says so, so nobody restores the old art
citing the old permission. ⭐ **Neither replacement carries any readable text**, which also means
this art no longer needs an honesty-lock exception at all.

📌 **NO NEW DOORS.** §8 asked for the Site Profile artwork on a Site/System hero and forbade
creating a duplicate door to show it. **That hero slot already existed** — the asset swapped in
place and no surface was added.

**Sizing, and why the attributes moved.** Both are 960×540 — 3× the 320px `.pfeat__art` actually
renders at — and both keep the sources' native 16:9, so `height:auto` lays them out undistorted.
⚠ **The `width`/`height` attributes moved from `720×720` to `960×540`**: left square they would have
reserved the wrong box and shifted layout on load.

📌 **Converted through Playwright's Chromium canvas at q0.88** — the path proven at `.456`, since
there is no `cwebp`/`sharp`/ImageMagick here and none was installed. **238 KB JPG → 43 KB · 1822 KB
PNG → 56 KB.** The 1.8 MB source would otherwise have gone into `PRECACHE_URLS`. Both retired assets
stay on disk, orphaned-but-retained per repo precedent; only their precache entries went, which also
keeps the `?legacy` rip cord byte-compatible.

**Measured at 390×844:** Site Profile hero **320×180, ratio 1.778** — exactly the source aspect.
Command Deck tile **324×209** under `background-size:cover` with the tablet exchange centred, and
`.cs-op-scrim` already supplies the dark gradient the card text needs, so **no new overlay was
invented**. No failed image requests.

⚠ **NOT VERIFIED, and it is a device check:** the **Work→Handoff feature hero measured 0×0** in the
harness because that sub-surface did not come up from the automated door. The asset is wired and
loads; its on-screen framing is unconfirmed.

## 1l · `.463` — PASTE ANYTHING: SHIPPED 2026-08-19, DEVICE CHECK OWED

✅ **PUSHED AND CONFIRMED IN THE SERVED BYTES.** `33aa69d..e3e97e4`. Live `version.json` reads
`.463`, served `dct-ios.html` and `sw.js` both stamp `.463`, and the served HTML is **byte-identical
to the git blob** — carrying `function paste_classify`, `function paste_route`, `function
rd_openPaste`, `id="rd-paste-sheet"` and the `E('div', 'pasterow')` builder.
📌 `class="pasterow"` greps **0** in the served bytes and that is correct, not a miss — the row is
built in JS inside `bw_render`, so it exists in no static markup.
📌 Served 3,595,004 vs working tree 3,654,358: the gap is **exactly** the 59,354 CRLF line count.
Compare the **git blob**, never the working tree, or a clean deploy reads as a 59 KB discrepancy.

One door that does not make the technician name the format first. Paste a port map, elevation, CLI
output, BOM CSV or vendor EDP into one box; PHANTOM says which of the five it looks like, offers
**one** route, and opens that parser **with the text already in it**. ⛔ **It classifies and never
parses**, and every one of the five keeps the door it already had — no parser was modified, no
second engine added, no existing route removed (Contract A2).

⭐ **THE DURABLE FINDING — STRUCTURE SEPARATES A PASTE FROM A SENTENCE; VOCABULARY CANNOT.** Three
fix rounds each narrowed keyword rules and each was defeated by a fresh phrasing — *and* each
narrowing started refusing REAL pastes (a port map under a comment banner, a CLI echo behind a
capture timestamp). ⛔ **Prose can always contain the keywords, so that line has no good point on
it.** Real pastes are line-oriented, repetitive and delimited; prose is sentences. A structural gate
now runs ahead of all format scoring and carries the false-positive load, which is what lets the
format rules stay generous enough for messy real data. **A lone sentence cannot classify however
many trigger words it holds.**
📌 Round 4 applied that same principle to the one rule exempted from it: the EDP `^field:` anchor
was never the weak part — **the QUANTITY of evidence it was asked to carry was.** One field plus the
acronym is a status note *about* an EDP; fields are now counted.

⛔ **`bw-on` HIDES THE WHOLE WORK BANNER STACK, AND THIS SHIP ONLY DISCOVERED IT — IT DID NOT CAUSE
IT AND DID NOT FIX IT.** `bw_render()` adds `bw-on` to `#pg-work` in **all three** of its routing
branches and **nothing in the file ever removes it** (3 adds, 0 removes); it runs on every
`showMode('work')`. So `body.rd #pg-work.bw-on #work-grid { display:none }` (:58425) hides the
five-row stack — DEPLOY · SCAN · HANDOFF · MASTER FILE · **OPS and its nine tools** — from the first
Work visit onward. **OWNER RULING OWED:** was `#bw-shell` (`.385`) meant to supersede the banner
landing (`.359`)? The PASTE door was built inside `#bw-shell` because of it; a row in the stack
would have been present, wired, correct and **dead** — the SHIFT-pill defect a third time.
⭐ **How it was caught, and this is the reusable method: the row measured 0×0, and the SIBLINGS were
measured BEFORE the markup was touched.** All four shipped banners and the OPS row read 0×0 too,
which says *the container is hidden*, not *this control is broken*. **A 0×0 on a new control is only
evidence about that control once its neighbours are proven non-zero.**

⚠ **A STALE CLAIM WAS INHERITED AND REPEATED — RECORDED SO IT DIES HERE.** The session ledger said
`phone-webkit` was **down machine-wide** on a `libegl.dll` system-runtime gap, and that was carried
into three commit messages before anyone retested it. **It launches and runs green.** The ship is
verified on the primary gate after all: spec 42 (6), spec 43 (12), `03-tools` (28), `01-nav` (14) —
**60 passed on phone-webkit**. ⛔ **Retest an environment claim before inheriting it into a ship
record**; "the harness is broken" is exactly the kind of assertion that gets copied forward unread.

📌 **Deviations from the authored briefs, all found by reading live code first:** the tenth
`ops-cell` would have broken a 3×3 wall of exactly nine and falsified its own *"Nine tools on this
build"* copy · no shared sheet-positioning selector existed to join (profile and errors each held a
byte-identical copy, so one was extended rather than a third added) · a parse-time
`addEventListener` IIFE became an `oninput` attribute, since an ordering assumption is how controls
die · and the router's unconditional `box.value = text` now **states** an overwrite of hand-entered
content (Contract 11).
⚠ **`.bnr` cannot be used without art, deliberately** — its own background is the missing-raster
hatch, authored so a 404 "looks WRONG instead of empty". PASTE is a `.pasterow` control strip.

**Gates:** three stamps at `.463` · `phantom-guard` exit 0 · `node --check sw.js` · valid JSON ·
0 bare LF · 0 mojibake · inline blocks compile.

## 1m · ⭐ `.464` — THE BANNER STACK IS RETIRED, AND THREE LOST TOOLS COME BACK (owner ruling 2026-08-19)

⛔ **THE STACK WAS NOT REDUNDANT — IT WAS UNREACHABLE, AND IT HAD TAKEN THREE TOOLS WITH IT.**
`bw_render` adds `bw-on` to `#pg-work` in all three routing branches and nothing ever removed it;
it runs on every `showMode('work')`. `body.rd #pg-work.bw-on #work-grid` was therefore
`display:none` from the first Work visit onward. **RACK MAP, SOPS and BURNDOWN had no other
reachable door** — SOPS and BURNDOWN had **exactly one caller each in the whole file** and it was
the ops-cell inside that hidden container. Measured at 390 on phone-webkit against live `.463`:
**0 reachable doors** for those three against **1 each** for the six that also sit in the Command
Field tools row. A technician could not open SOPs or Burndown at all.

⭐ **SO THE FOLD WAS A RESTORE-THEN-DELETE.** The three went into the Field tools row FIRST (six →
nine), and only then was the stack removed. **Deleting first would have removed two tools from the
product permanently.** The row is in `DEPLOY_TOOLS` registry order — the same order the retired 3×3
wall used — so the layout the technician already learned survives the move, and `03-tools` pins that
order with an order-sensitive comparison. Art is the retired cells' own assets, already in
`PRECACHE_URLS`, so nothing was orphaned and the precache list did not move.

⛔ **THE PINNED TEST STAYS RED, DELIBERATELY, AND MUST NOT BE REPOINTED.** `03-tools` has carried an
expected-failure since `.385` asserting the ops tools are one tap from the **BUILD** landing,
quoting the wall's own shipped promise. The Field tools row lives in `#pg-cmd` — **Command, not
Build** — so every tool is reachable again while **Contract A7's operational-centre claim remains
unmet**. The pin was updated to name the new cause and left failing. Repointing it at Command would
be weakening a test to fit the code, which that block's own header forbids. **It flips when Build
has a door.** 🟡 **Owner call owed: does Build get its own tool door?**

📌 **CREDIT: THE HARNESS FOUND THIS FIRST.** The `bw-on` cause, the exact CSS rule and the hidden
wall were already written into that pinned test months ago. This ship rediscovered a defect the
suite had recorded and nobody had read. ⭐ **Before reporting a discovery, grep the suite for it.**

📌 **DELIBERATELY NOT DONE.** `#work-grid` and `#wk-job-host` stay — `wk_renderJob` writes into the
job host and `wk_showGrid` is still the BACK target from an open ops tool. The `.bnr`/`.opsrow`/
`.opswall` CSS stays: inert, and its `.rf-cname`/`.rf-cmeta`/`.chev` neighbours are **SHARED** —
`.pasterow` uses all three — so tidying there would risk a live door to delete bytes that cost
nothing. `wk_toggleOpsWall` and `wk_paintOpsWall` stay, inert with zero callers; deleting them
cascades into nine per-tool stat readers for no user benefit.

**Verified on phone-webkit, each spec ALONE:** `44-tool-reachability` 3 · `03-tools` 28 ·
`43-paste-door` 12 · `01-nav` 14 · `02-build-forge` 14 · `06-composition` 12 ·
`42-paste-classifier` 6 — **89 passed.** Gates: three stamps at `.464`, `phantom-guard` exit 0.

## 2 · Milestone

**Programme: `SHIP-TECH-FLOW-V2-FROZEN.md` (see §1a).**

✅ **Workstream 1 — PHASE-ENGINE: COMPLETE** (2026-08-09). P0 `.418` one operator identity ·
P1 `.419` the Event Log folded into the existing hash-chained audit log rather than built beside
it · P2 `.420` the Blocker record, adopting pre-existing blockers instead of invalidating them ·
P3 `.421` the step model, state machine and four platform templates.
⚠ **The step TEXT is a placeholder by design.** Real per-platform commissioning procedure is site
knowledge the code does not have, and inventing thirty authoritative-looking steps would be
fabricated telemetry wearing a checklist. **Filling those in is the owner's, and it is what
PHASE-ENGINE needs next to be useful to anyone.**

🔄 **Workstream 2 — SITE-PROFILE: substantially landed, one piece deliberately held.**
`.415` atomic swap · `.417` root record + migration · `.418` identity split · `.422` staging, the
validation summary and explicit ACTIVATE SITE, plus §4.3 proven (events survive a Master swap and
still name the Master that produced them) · `.423` the restore path re-enters boot instead of
returning to a half-updated app — the LAST split-brain door, now closed (§9 RECOVERY ONLY).
⛔ **HELD BY OWNER RULING — the boot gate** (invalid profile → SITE SETUP only). It is the single
riskiest change available: a misfire locks an operator out of a working app in a cold aisle. It
waits until after a physical device pass.

⚠ **Sequencing deviation, logged not resolved:** `.417` (workstream 2) landed before workstream 1.
Authorised directly by the owner before the spec arrived, and it is inert scaffolding rather than
UI — but the spec says each step gates the next, so it is recorded rather than argued away.

✅ **M2-b STAGE 1 LANDED (`.433`) — the data contract (§7, I8 + I9).** `RackEngine._resolve(rackId)`
returns `{id, label, units, devices, source, dataState}`, wraps `master_rackToElevation` rather than
re-implementing it, normalises every `type` through `Vocabulary`, and makes R-06 representable —
`empty` (Master holds the cab, no devices) and `unassigned` (Master never heard of it) are now
different answers. Three call sites routed, including the `master_renderHit` reshape. Spec 22.

✅ **M2-b STAGE 2 LANDED AND IS DEVICE-VERIFIED (`.434`) — the reclaim barrier (§6, I6).**
Owner on hardware 2026-08-10: *"rack holds, aisle opens same speed."* Verify items 3 and 4 still
hold under the restructure, and — the half the runner could not answer — **the two-frame barrier is
imperceptible on the device.** The spec claimed ~33ms would be; that is now measured by the only
instrument that counts.

**What shipped:** `releaseOthers` reports how many it released; both renderers release at the TOP,
before any renderer is constructed; the barrier arms ONLY on a real release (a cold first render is
not delayed for a reclaim that never happened); one pending acquisition, collapsing to the last
request; a timer fallback so a hidden tab cannot strand it. Verified in the SERVED bytes —
`rackElevation_render3D` release@1013 acquire@7629, `forge3d_render` release@845 acquire@1548.
Before `.434` both were the other way round.

⚠ **The claim discipline stands and is in the code:** the ordering was certain; a field failure
caused by it was never proven, and this must not be cited as the explanation for the historical
blank-rack arcs. A stated invariant simply was not being held, and now is.

⭐ **`.439` — THE REFRESH SURFACE IS NOW A PARAMETER, AND STEP 3a's INVENTORY WAS SHORT BY NINE.**
Found while scoping merge step 3b, and it corrects a number the plan is built on. The question
"what does the phase-card block contain" returns 4 refresh sites; the question **"which code
assumes the surface it refreshes is the rack detail"** returns **13**. The other nine are outside
the block 3b was scoped to lift: four resume **after a modal** (`ge_captureSkip`, `ge_captureSave`,
`ge_onCompleteTap`'s rack-missing fallback, `ta_resolveUnblock`) and five are emitted **inside the
card markup** (`checklist_addItem` / `_removeItem` / `_renameItem` / `_toggleEdit`,
`deploy_flagPhaseReverify`).
⛔ **So `onRefresh` as a CALLBACK cannot work** — nine of the thirteen run after the builder's scope
is gone. `phase_refreshSurface(surface, deployId, rackId)` takes a **string** key, which survives an
onclick attribute and a stored context object. `'detail'` is the default, so every pre-`.439` caller
is byte-identical.

📌 **It was a LIVE defect, not a hypothetical.** `.438` moved ASSIGN into Build; `deploy_assignRack`
still ended with `deploy_showRackDetail`, so Assign-from-Build saved and then threw the technician
onto the detail — `.436`'s wrong-landing, one ship after `.436` fixed it, introduced by the ship
that moved the control. QR and LOG NOTE have no refresh tail and were clean. ⭐ **A hardcoded
destination is invisible for exactly as long as there is only one destination** — every remaining
merge step adds a second one, so the other twelve sites are now the known work, not a surprise.

⚠ **And a test that failed against correct code, worth not repeating.** `deploy_showRackDetail`
**also re-renders Build on FIRST entry** via its own nav path — true at `.438` — and does not on a
second call into an already-open detail. Baseline and measurement therefore only compare from
**two cold boots**; sharing one page let the baseline contaminate the reading. The invariant is not
*"the default caller never touches Build"* but *"it does what a direct detail render does and
nothing more."*

⛔ **STAGE 3 IS WHAT REMAINS OF M2-b.** `attach` (BACKABLE SUBSET ONLY — see below), modes, and the
§8 deletions LAST. §8 ends by deleting `forge3d_render` as a separate renderer, which is the single
largest blast radius left in the file and wants its own ship with a device pass.
📌 **HISTORY — the finding that produced `.434`, kept because the reasoning is the durable part.**
**I1 does not hold at the INSTANT of acquisition.** Read from the ordering inside
`rackElevation_render3D`, not measured:

    :37719   new THREE.WebGLRenderer(...)          ← the new context is ACQUIRED
      …      (~1200 lines later, same function, SAME TASK)
    :38926   RackEngine.register(mountEl, …)  →  releaseOthers()   ← the old one is RELEASED

So on a cross-host handoff — Build → Aisle is exactly that shape — the new context is taken while
the other host's is still live. I1 holds *after* `register` runs, never at acquisition. That is
precisely what §6 exists to close: *"no context is acquired in the same task as a release."*
⚠ **Claim discipline: the ordering is certain; a field failure caused by it is NOT proven.** Desktop
tolerates two live contexts. Do not assert this explains the historical blank-rack arcs.

**Shape of the fix:** release → **double `rAF`** → acquire. §6 is explicit that a single `rAF` can
still land in the same compositor frame on iOS, and that two frames (~33ms) is a guarantee rather
than a hope. ⛔ **This inverts the order of the most fragile function in the file** and needs its own
ship plus a device pass on the ×10 Build and aisle round trips (verify items 3 and 4).

⛔ **WHAT `attach` CANNOT HONESTLY SHIP YET, so nobody re-scopes it by accident.** §5's `demote`
keeps an attachment's data and re-renders it **flat**, and no attachment has a flat render path
today. So `update`, `setView` and `promote`/`demote` cannot be backed — shipping them as stubs
would be dead controls (Contract 14). The backable subset is `attach` + `detach` / `suspend` /
`resume` / `state` / `setMode`, plus `RackEngine.interactive`.

**Carried from the blueprint (architecture, still law):** M2-b is owed — `RackEngine.attach`, the
reclaim barrier (I6), modes, the data contract, `Vocabulary` normalisation. M2-a ✅ (`.401`).

**Phase posture: no new features outside the governing spec.** Its add-nothing rule is stricter
than the previous wording: the ONLY permitted data additions are `PHASE_MODEL`, the Event Log and
the Blocker record. Everything else is routing, folding and relabeling of existing capability.

## 3 · Verify debt — ✅ **ZERO at `.585`** (2026-09-09). ⛔ This heading read *"ZERO at `.557`"* for 24 versions; the debt below `.557` is the historical record

✅ **CLOSED: `.585`.** Device PASS 2026-09-09 on the one look — the RESTORE confirm read as designed on iOS
(a ten-line `confirm()` and the Files picker), Cancel, nothing changed. Adjudicated by the owner with
`verify.ps1 585 PASS`: stamp `f95ece0` (`VERIFIED` alone), `release` level with `main`, `SERVED:
phantom-v1.14.585` — read back from `origin` and the served stamps before this row was written. Under the
named exception (serve → see → verify, no staging surface yet). Evidence `docs/BATCH2-585-EVIDENCE.md`.
✅ **CLOSED: `.584`.** Device PASS 2026-09-09, both looks — dismissed sheet → the magenta
`BACKUP NOT SAVED — share sheet dismissed — tap to retry` strip stays and no download prompt follows;
retry → Save to Files → the strip clears and the toast names the time. The real iOS share sheet, which
Playwright cannot see, did what the stub said it would. Adjudicated by the owner with
`verify.ps1 584 PASS`: stamp `d02a081` (`VERIFIED` alone), promoted, `SERVED: phantom-v1.14.584` — read
back from `origin` and the served stamps before this row was written. Evidence
`docs/BATCH2-584-EVIDENCE.md`.
✅ **CLOSED: `.583`.** Device PASS 2026-09-09 — SYS `.583`, Build's strip `LOCAL ACTIVE | ON-DEVICE ·
SAVED`. Adjudicated by the owner with the first live `tools/verify.ps1 583 PASS`: stamp `b9d7de9`
(`VERIFIED` alone), `release` `944ba1d → b9d7de9`, `SERVED: phantom-v1.14.583` — read back from `origin`
and the served stamps before this row was written. ⚠ Preceded on 2026-09-08 by a PASS reported before
the promote had run (the phone was on `.582`); caught by the mismatch, nothing written (§1, §8).
Evidence `docs/BATCH1-583-EVIDENCE.md`.
✅ **CLOSED: `.582`.** Device PASS 2026-09-08 — *Active rack* card up, DIAGNOSTICS reads
`PREVIEW/MOUNT_NOT_DRAWING` (§8). Stamped VERIFIED at `9a9d6db` **by Claude Code running
`tools/stamp.ps1` on the owner's explicit in-session instruction** (*"you do the powershell"*) after his
reported pass — the *"when John says stamp it"* carve-out, actor credited per D-2. ⚠ The owner's own
stamp attempt earlier that hour did not write: `VERIFIED`'s mtime, every ref on origin and the reflog
all proved it — the third *"failure that looks like success"* this month, cause not captured because
the terminal output was not. ⚠ First device pass (2026-09-08) read *"No errors
recorded"* with a Master loaded — **that is not a reading of the instrument.** Reproduced in the harness
with real taps (`docs/BATCH1-582-EVIDENCE.md` §"Device walk", 4/4): with a live rack the launch alone
leaves `DEFERRED_DETAIL_OWNS_SCREEN` and a BUILD tap leaves `MOUNT_LIVE`; with a deployment that has
no racks, or no deployment at all, Build shows *Build overview* and the sheet reads *No errors
recorded*. **An empty sheet on `.582` bytes means no active deployment with a blocked/active/pending
rack on that device** (or the phone was still on `.581`). ⛔ `35418c3`'s message said the `.571` launch
never runs `bw_render`; it does — the card is built behind the picker and the 3D defers. Re-check with
Build's first card reading *Active rack*.
⛔ **Not "verify on `main`'s URL" — `main` is not served (owner ruling C, 2026-09-08).** The checklist
is in `docs/BATCH1-582-EVIDENCE.md`; the one check that matters is that **SYS → DIAGNOSTICS lists a
`PREVIEW/…` line after a Build visit and no JS-ERROR banner appears** — and if the rack preview is
still blank, *which* line it is (`MOUNT_NOT_DRAWING` vs `MOUNT_LIVE` vs a `DEFERRED_*`) is the reading
the whole ship was flown to obtain. A blank preview does NOT fail `.582`; it is the `.391` class.
✅ **CLOSED: `.581`.** Stamped VERIFIED (`f34982f`) and promoted (`release` = `14028c8`), 2026-09-08.
⚠ The stamp preceded the phone (dry-run misread — see the header); the phone then showed the blank
preview and the owner ruled `.581` stays VERIFIED because the defect pre-dates it
(`docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md` §2).
⚠ **A stamp attempt was reported on 2026-09-05 and did not land** — `VERIFIED` line 1 still read
`.580`, the working tree was clean, and no stamp commit existed. ⭐ **`stamp.ps1`'s own header
records why that failure mode is expected and dangerous:** an earlier cut failed PARAMETER BINDING
before the body ran, wrote nothing, and emitted PowerShell binding noise that read as text rather
than as a refusal — *"a tool whose failure looks like success is worse than a strict one."*
**Verify the stamp by reading `VERIFIED` line 1, never by the absence of an error.** Eight
`dct-ios.html` copies exist on that box, so **cwd drift into a stale clone is the first thing to
rule out**; `-DryRun` prints the resulting file and writes nothing.

⚠ **This heading read *"`.460`–`.462` OPEN (3 of 6)"* until 2026-08-31, while §1's header two
screens above said *"NO VERIFY DEBT"*. Both could not be true.** `.460` and `.462` are marked
PASSED in this very section; only the `.461` CONTINUE **diagnostic** was ever outstanding, and a
diagnostic is not verify debt — it is an open question about a defect that never reproduced. The
count in the heading was never decremented as the passes landed. ⭐ **A stale summary line outlives
the correct detail underneath it, and the summary is what gets read.** Same class as the `.532`
stamps row in §1.

✅ **(a) `.460` — the SHIFT door. PASSED on hardware 2026-08-14.** The shift-end timer is reachable
in production for the first time; the row was confirmed rendering on the deck in the `.462` capture
too (`SET SHIFT END · "Not set — the countdown stays off until you do"`).

⏳ **(b) `.461` — CONTINUE on Build.** ⭐ **Every outcome is informative.** It opens → good. It says
*"Build surface is not mounted"* or *"drew off-screen"* → that names the cause. **It stays
completely silent → that rules out all three instrumented paths and points at pointer interception
on real iOS, which the harness cannot see.** Report which.

✅ **(c) `.462` — the Home card art. PASSED on hardware 2026-08-19.** All three surfaces carry the
new photographic art with no portal/machine panel surviving, **including the Work→Handoff hero —
the one leg automation could not reach.** ⭐ **§23 is proven with it:** the pass required updating
onto `.462` first, so a normal SW UPDATE demonstrably replaced the **cached** old artwork rather
than leaving the machine panel in place.

✅ **`.457`–`.459` RELEASED ON HARDWARE 2026-08-14.** Both passes cleared.

⭐ **THE SW UPDATE P0 IS CLOSED.** One tap took the installed iPhone PWA from `.458` to `.459` with
field data intact, no reinstall and no Safari cache clearing. **Delivery works again**, which is
the precondition for every ship after this one.

📌 **The test worked because `.459` was a deliberate no-op** — three stamps, a two-line code diff —
so nothing but the update mechanism could account for the version moving. ⭐ **To verify a delivery
mechanism, ship a payload that can prove nothing except the thing under test.**

✅ **`.454`–`.456` RELEASED ON HARDWARE 2026-08-13.** All six checks passed. Cap was reset to 0 of 6
and `.457` takes it to 1.

⚠ **`.455` exists because `.454` failed its device look** — the owner reported the locked rack
reading off-axis with the neighbour competing. **No assertion in `.454` could have caught it: every
one tested that the camera did not MOVE, never that it was SQUARE**, so a frozen crooked pose
satisfied all of them. Spec 37 now owns that contract with bounds that exclude the old constants.
⭐ **That is the durable shape — a suite can be fully green on a feature that is visibly wrong when
the assertions test the wrong property.**
Everything a suite could reach was proven first, per the standing rule that the owner is not the
test harness. What is left genuinely needs a real GPU and a real hand: whether every rack *arrives*
at the same framing across a walk, and whether "nearest rack" feels right on leaving WALK — the
latter is a product judgement, not an assertion.

### Historical — the batch before it

✅ **`.438`–`.453` RELEASED ON HARDWARE 2026-08-12.** Sixteen ships, ten past the cap: the
phase-card merge (`.439`/`.440`), the context fix (`.441`), the renderer programme R1-D→R8
(`.442`–`.450`) and Forge parity P1→P3 (`.451`–`.453`). **CALL 0 cap reset to 0 of 6.**

⭐ **What that pass uniquely bought, because it is the part no suite could reach:** real safe-area
(the harness resolves `env(safe-area-inset-top)` to 0, so the fold position was genuinely
unverified), the **asynchronous iOS GPU reclaim** behind `.441` — the whole reason a rack could be
live in one surface and blank in another — and sustained thermals across a ten-rack aisle walk.
Everything else in the batch was proven by automation first, per the standing rule that the owner
is not the test harness.

### Historical — the previous clearance

✅ **`.385`–`.428` RELEASED 2026-08-10.** The consolidated pass in `BATCH-VERIFY.md` is complete:
every item closed or automated. **CALL 0 cap reset to 1 of 6.** 🟡 One exception, open on purpose:
**`.413`** — item 8's empty half has no live example, because `.424` resolved every cabinet in this
Master. A check that cannot be performed is not a check that passed.

✅ **`.376`–`.384` RELEASED** by owner ruling 2026-08-08 (`.377`–`.384` superseded by the
`.385`→`.396` arc; `.376` closed by ruling because no checklist for it ever existed).

The automated baseline has already taken the `.401`/`.402` attachment behaviour, tier composition,
zero overflow and the 44px floors off the human list. What it structurally **cannot** do — and why
the pass survives — is the service worker (will not install in that webkit, 9 tests skip) and
`env(safe-area-inset-top)` (resolves to 0 in the harness).

## 3a · P0 — CLOSED IN CODE, OPEN ON HARDWARE (`v1.14.424`)

⛔ **The owner stop-condition stands: no other milestone resumes until `s4:099` populates on the
physical iPhone.** It is **item 0** of the pass.

**What was wrong.** SITE-HOSTS was the ONLY source of rack components since `v1.6.26` — the first
Master parser ever shipped. Git proves it: the line reading column D has exactly **one** real
commit (the one that wrote it), the host push is byte-identical today, and cables only ever
populated `cablesOut`/`cablesIn`. **This was never a regression — the capability never existed.**
`v1.6.61` even shipped a *host-less cab cabling list* around it.

**Why it mattered here.** In `MASTER-US-WEST-10A-US-SPK03-SPARKS.xlsx`, SITE-HOSTS carries 4,143
rows and **not one is an s4 cab**, while CUTSHEET names 98 s4 racks. **215 of 511 racks (42%) exist
only as cable endpoints.** `s4:099` explicitly holds nine GPU-B300 nodes, eight power shelves, an
SN2201 and a CDU — with model, DNS and RU — and the app said `NO HOST DATA IN MASTER`.

**The fix.** Cable endpoints carry `LOC:CAB:RU` + DNS + MODEL — explicit Master records — and are
normalised into the SAME inventory SITE-HOSTS feeds, so Build and Forge get identical data without
either choosing a source (both read `master_rackToElevation`). Three rules, in order:
**SITE-HOSTS wins** where both describe a U · **dedupe by identity, not by cable** (68 refs → 19
components; one-per-cable would have invented 68 devices) · **provenance kept**
(`SITE_HOSTS` / `CUTSHEET_ENDPOINT`).

**Measured through the real parser:** 511 racks · 7,574 components (4,143 + 3,431) · 28,264 cables ·
`s4:099` = 19 at the exact RUs · `s1:002` unchanged at 19, all SITE_HOSTS · compressed payload
1.36 MB against the ~5 MB quota.

⭐ **NEW STANDING RULE (owner).** Any change to Master parsing, the normalized rack inventory,
storage restoration, `ACTIVE_MASTER`, or RackEngine data binding must keep
`test/e2e/15-dual-source-master.spec.js` green **before it ships**. Its rows are lifted verbatim
from the real workbook and it runs the PRODUCTION parser, not a copy of it. The owner should never
again have to discover that a working rack went empty.

## 4 · Open defects

⏳ **F-1 · `03-tools` — ten OPS-door tests regressed between 2026-08-27 and `.557`. NOT user-
facing, NOT from `.558`, unexplained.** `{tool} mounts into a VISIBLE host` fails for all ten
tools, **identically at `.557` and `.558`**, so no recent ship owns it. They PASSED in
`test/full-test-output.log` (2026-08-27), so something in `.519`–`.557` changed how
`showMode('work')` settles. ⭐ **The failure is in the SYNTHETIC path only:** the spec calls
`rd_openOpsTool()` directly from a fresh boot without tapping anything, and in that path the mount
lands hidden. **The REAL tap path was measured and is fine** — `#ops-tool-host` renders 362×746,
visible, 1,619 chars, `pg-work` active. ⛔ Do not 'fix' the spec to green; the divergence between
the two paths is the finding.

✅ **F-2 · CLOSED 2026-09-01. THE FULL PHONE-WEBKIT SWEEP RAN** — first in 25 versions.
**349 passed · 20 failed · 10 skipped · 48/48 specs · 1.1 hours**, at `.559`. ⭐ **Every one of the
20 was baselined and NONE came from `.557`–`.559`.** What it bought is F-3 below: five app-level
failures nobody knew about. ⚠ **Run it as ONE uninterrupted job** — two Playwright instances race
the same origin, and a `| tail` pipe buffers the whole stream so nothing is inspectable until it
ends. Log: `test/sweep-559.log`.

✅ **F-7 · `01-nav`'s active-mirror failure was THE TEST RACING THE APP, closed 2026-09-01.**
One of the sweep's 20. **The app is correct.** Measured identically at `.556` and `.562`: after
tapping BUILD the nav highlight is right at **+0ms** while the page's `.active` lands between
**+150ms and +400ms**, then holds. The test polled `activeSlots` — already right — then read
`activePages` with a bare `expect`, catching the swap mid-flight and reporting `command` for a BUILD
tap. ⭐ **The tell was that the sibling routing test passes on the same code because it polls.**
Fixed at `79e5599` to poll for convergence **and** assert the highlight has not drifted back — the
assertion is now strictly STRONGER than before, not green-washed. ⚠ **Baselined before clearing my
own ships, per F-4** — the timing is byte-identical at `.556`, so neither `.558`'s deferred
`ops_init` nor `.562`'s badge is responsible.

⏳ **F-8 · THE SLIDING NAV INDICATOR — two owner decisions point opposite ways. Ruling needed.**
Addendum A3 adopts *"a sliding thumb indicator under the active pillar"*. `v1.14.321` **retired**
exactly that — `#bn-core{display:none}`, *"old sliding reactor rail retired"* — in a **wholesale
owner-approved nav replacement** (`HANDOFF-nav-option-C.md`, *"go" in chat*), five weeks before the
addendum. Today's `.btick` fades per-item instead. ⛔ **NOT built in `.562`**: re-introducing what an
approved ship deliberately removed is precisely how `.513` happened.

⛔ **F-4b · A CITATION CAN GO STALE BETWEEN READING IT AND WRITING IT DOWN.** Twice this session a `file:line` was correct when gathered and wrong when recorded, because ships landed in between. `iso_render` was cited at its pre-`.563` line hours after the offset table predicting that exact drift was written; P-2's table and reader were recorded as `:27403`/`:27422` on 2026-09-02 and were **already stale at the moment of writing**, drifted by `.567`–`.569` (correct: `:27451`/`:27470`, corrected in `.570`). ⭐ **THE DURABLE RULE: an anchor is only valid against a stamp, so cite the stamp with it — and re-verify every citation immediately before the write, not when the reading was taken.** ⚠ Hand-checking missed this both times; a programmatic sweep of every `:NNNNN` in a document against the live file caught it. Evidence documents in this repo carry an offset table for exactly this reason.

⛔ **F-4a · A TEST CAN PASS WITHOUT EVER TOUCHING ITS SUBJECT, AND THAT IS A DIFFERENT FAILURE FROM F-4.** F-4 is about a test that fails for the wrong reason. This is its mirror: `29-context-follows-surface`'s deferral test drove `bw_mount3D` with a global **set nowhere in the app or the suite**, so it always passed `null` — and `bw_mount3D`'s `if (!rack)` bail (`:22517`) returns **77 lines before** the ops-detail guard (`:22594`) it claimed to exercise. **The direct call could never reach the guard.** It passed anyway, for ~4 versions, on a coincidence: Build's own re-arm loop (`:22531`) fired a real-rack `draw()` inside the test's 400ms window while `ops-detail` was up, and the test took credit for that warning. `.566` made the mount measurable sooner, the re-arm resolved before the window, and the coincidence stopped — **so a green test went red without the app regressing.** ⭐ **THE GUARD WAS NEVER BROKEN:** the test's own `src`-contains assertion for it passed throughout, which is what proved the fault was in the driver. ⛔ **THE DURABLE LESSON: a passing test is not evidence its subject ran.** When a test drives a function directly, the arguments it passes are part of the assertion — a sentinel that is never assigned makes the call a no-op that no reviewer sees. Fixed in `.566` by passing a real rack, which is what the test's own block comment always claimed was happening.

⛔ **F-4 · A METHOD FAILURE, AND IT IS THE MOST IMPORTANT ENTRY IN THIS SECTION.**
**Comparing a test's PASS/FAIL STATUS across two versions is NOT comparing behaviour.**
`30-rack-above-the-fold` failed at both `.556` and `.560`, so the baseline reported it "pre-existing"
and cleared `.558` — **wrongly.** At `.556` it failed on `visible >= 150` (75px); at `.560` on the
**earlier** assertion `mountTop < navTop`. The app had materially degraded — 75px of rack to **zero**
— and the red dot looked identical. ⭐ **A TEST THAT FAILS AT BOTH VERSIONS CAN STILL HIDE A
REGRESSION. Compare the failing ASSERTION and its numbers, never the outcome.** The regression was
mine (`.558`), the clearance was mine, and the sweep caught what the review did not.

✅ **F-3 · CLOSED 3 OF 5, 2026-09-01.** Of the five the sweep found:
- ✅ `44-tool-reachability:69` — **stale test.** The row held ten `.cs-tool` buttons since `.469`
  (SHIP-ISOLATE-OPS-380 added ISOLATE); the test asserted nine. Red for **91 versions**. ⚠ Its
  label read *"no tool buttons rendered at all"* — written for the zero case — so a count drift
  reported itself as a render failure and the sweep line read as a **gloved-floor** failure. **The
  floor was never in question: all ten measure 159×95.** Fixed in two verified steps; the two-door
  sweep had been checking 9 of 10 doors and now checks all ten.
- ✅ `29-context-follows-surface:72` and `:128` — **stale tests**, retired design (see `.561`).
- ✅ `30-rack-above-the-fold:79` — **a real regression, mine, fixed in `.561`.** ⚠ Its ORIGINAL
  shortfall stands: the rack is above the fold again but still only **~75px** visible against a
  150px bar. That part is pre-existing and untouched.
- ⏳ `39-sw-update-path:24` — **OPEN, and it needs an owner ruling, not a patch.** See below.

⏳ **F-5 · THE SW UPDATE PATH: TWO SHIPS, OPPOSITE DESIGNS. Owner ruling required.**
`.458` removed `skipWaiting()` from install as an owner-directed P0 and **device-verified** it;
`.513` put it back. `sw.js:166-169` still explains why the line at `:171` must not exist.
⛔ **`.513`'s rationale — *"iOS Safari does not reliably process message-based skipWaiting"* —
contradicts Pass A in §8**, where one tap moved the installed PWA `.458`→`.459` on the owner's
phone. No device evidence is recorded for `.513`. ⭐ **The `.458` guards still hold**: on chromium
6 of 7 tests pass — the badge stays honest, failure is loud, user data untouched — **so the P0 has
not returned.** But the designed path is unreachable: nothing parks in `waiting`, `SKIP_WAITING`
has no live sender, and updates land automatically via `controllerchange`. ⚠ **An unannounced
reload can land mid-shift on a gloved tech entering data — a product decision never ruled.**
⛔ **The test is not wrong; it encodes the `.458` design.** If auto-update is ruled correct, the
test changes deliberately and the `.458` comments come out with it.
Full evidence: `docs/SW-UPDATE-PATH-HUNT-EVIDENCE.md`.

⏳ **F-6 · SHOULD AN OFF-SCREEN BUILD HOLD A GPU CONTEXT?** Opened by `.531` and never ruled.
`29:72` used to require Build to RELEASE its context to the rack detail; `.531` deleted what it
released to, so Build keeps it while the detail draws flat. **Deliberately NOT asserted either way**
— asserting the current behaviour would be rewriting a test to agree with the code. `29:129`'s own
comment records that the pre-`.441` defect value was also *"one — Build's — while the surface the
technician was looking at had none"*. Contract A6's bound still holds; whether the holder should be
an off-screen surface is the open question.

📌 **F-3 (historical) · the five as first found — all fail identically at `.556` and in isolation.**
Each fails **identically at `.556` and `.559`**, measured back-to-back in one job, and each also
fails **in isolation**, so they are real app failures and not accumulated-suite-state artifacts:
- `29-context-follows-surface:72` and `:128` — the one WebGL context following the visible surface.
- `30-rack-above-the-fold:79` — ⛔ the rack is visible without scrolling, in Field Mode.
- `39-sw-update-path:24` — ⛔ install must NOT `skipWaiting`.
- `44-tool-reachability:69` — the tool row meets the gloved floor. ⚠ **This one is about the OPS
  row** and `.560` does **not** fix it: that ship changed colour, this is geometry.
⭐ **The adjacency to recent work was checked, not assumed.** `29`/`30` sit in `.557`'s rack-detail
territory and `44` in `.558`/`.559`'s tool row; all five still fail three versions back, so the
overlap is coincidence. Log: `test/baseline-five-556.log`.

📌 **Also confirmed pre-existing by baseline, not new:** `19-design-tokens` (dead-token set
byte-identical at `.556`), `ACTIVE_SITE_PROFILE` migration, and the three `06-composition` floors —
which are **`test.fail()` pinned defects**, not new failures. ⚠ **A pinned failure renders with the
same `x` as a real one in the list reporter**; three were briefly mis-reported as new because the
markers were not checked first. **Check for `test.fail()` before calling an `x` a regression.**

⏳ **F-2 (historical) · NO FULL PHONE-WEBKIT SWEEP SINCE 2026-08-27 — twenty-four versions.** `.519`–`.558`
shipped and were device-verified against TARGETED specs only. That is precisely the condition that
let F-1 sit unseen. ⭐ **This should close before the sandbox hand-off**, because strangers are
exactly who find what a targeted suite does not. ⚠ A full sweep takes >10 minutes and must be run
as one uninterrupted job — two Playwright instances race the same origin and produce a false
baseline.

| # | Defect | Status |
|---|---|---|
| D-1 | **SHIFT is a pillar (Contract A8) but the nav does not carry it.** ✅ **SCOPED, NOT UNANSWERED — the resolution is owner ruling R-02 + R-02a, delivered at M4.** See below | **Scheduled (M4), not open** |
| D-2 | **`.412` was never stamped.** Its desktop-shell work (auto-desktop at ≥1024, notch pill, type sizes) shipped inside `.413`, so a live ship is filed under another ship's title | Live, unverified — pass item 10 |
| D-3 | ✅ **RESOLVED — verify the entry, not the memory.** The pdu/storage/server disagreements were settled by the `.429` bay-canonical ruling (pdu gold, storage pink, server light-blue) and are pinned green by `20-vocabulary` at 8 of 11 codes. The **cooling** half was the last open piece and is closed by the 2026-08-12 CDU ruling: `cdu` is its own display key on the ruled cooling green. patch/media/unknown still GREY per the standing 2026-08-06 ruling | **Closed 2026-08-12** |
| D-4 | Rack-preview control rail wraps 4-then-1 and carries REAR + EXPLODE, which the approved reference does not show | Disclosed `.391`, unruled |
| D-5 | Build metrics layout has never been seen against a populated rack | Disclosed `.391`, unruled |
| D-6 | `handoffDraft` truthiness bug at the `phantom_handoff_v1` read | Deferred to M4 with Shift |
| D-7 | Two RESERVED `.askrow` slots unnamed · `#ff8a00` AUDITS accent off-token · 2 icon assets with 0 refs · inert `.164 body.rd .ask` rule | Cosmetic residue |

### D-1 in full — SHIFT is scheduled, not unanswered

Scoped 2026-08-08 against the approved blueprint. **The nav is two pillars short, not one:** R-02 specifies
**Command · Build · Scan · Tools · Shift**, and *both* `Scan` and `Shift` have zero nav references today.
**`EXIT` is removed** — but per **R-02a**, hold-to-freeze **moves into Shift**; the slot goes, the feature does not.

⛔ **RECORD CORRECTED 2026-08-14 BY AN ACTUAL WALK — the sentence here was wrong, and it had been
informing this ruling.** It read *"It renders today as one pill on Command."* **It did not render
anywhere a technician could see.** `shift_openSheet` had exactly ONE caller in the whole app — an
onclick on `#cc-shiftpill` — and that pill measured **0×0 and was unreachable at every viewport,
390 and 1440 alike**, because it sits inside `.lens` → `#cc-center`, both `display:none`. `.lens` is
the pre-`.425` phone composition the Command Deck replaced; the pill was left inside it, and `cc-`
is the retired Crash-Cart namespace besides. `shift_renderHero()` wrote into that hidden node
successfully on every clock tick — no warn, no toast. **Fixed at `.460`: the door is `#cs-shiftbar`,
a row in the deck's own flow container.**

📌 **AND TWO THINGS ARE BOTH CALLED "SHIFT". Do not conflate them.** What ships is a **shift-END
timer** (6 AM / 6 PM / +12h / custom / clear) — a healthy sheet, 6 controls, all ≥44px. The
**9-question SHIFT pillar** this D-1 entry argues about is a different, larger concept. The timer
being reachable does not advance the pillar, and the pillar's data gaps do not affect the timer.

**SHIFT-the-pillar is undoored, not unbuilt** — `shift_*` functions, a sheet, a hero and
`phantom_shift_end` hardened through `safeStore` at `.406`.

**Why it cannot be pulled forward: 6 of Shift's 9 questions have sources, 3 have nothing** —
the `Store` write journal (§6.1), the derived readiness gate list, and `PhantomIntelligence.queue` (§7.5)
all measure **0 references** in the live file, and two of the three are **M3 deliverables.** Shift cannot
answer its own questions before M3 exists, which is why the blueprint puts it at M4. Current milestone is
M2, and the standing directive stops broad UI work until M2 passes on hardware.

**Geometry was never the constraint:** 390px − 12px padding ÷ 5 = **75.6px per slot** against a 44px floor.

⛔ **Do not "restore the nav slot" as a quick win.** A pillar door onto a modal that cannot answer 3 of its
9 questions is a dead door under Contract 14, and all of it would be rebuilt at M4.
`01-nav.spec.js:65` pins the **pre-M4** nav deliberately — it is a checkpoint, not a specification.

## 5 · Locks in force

⛔ **RACK SCENE LOCK.** The `camera` term is OPEN. Everything else — materials, the JOHN-LOCKED
light rig, fog, tone mapping, tray geometry/internals, type colours, bezel strips, **floor**,
reflection, boot — is **LOCKED**. No change without a new owner ruling; if a task would touch it,
STOP AND ASK. The floor is UNLIT BY RULING — any sheen/gloss ask is a P0 revert; the lever is the
tile paint, never the lights.

⛔ **DESIGN SYSTEM LOCK** — `PHANTOM_DESIGN_SYSTEM.md`, approved 2026-08-07. R-E: no mass refactor
of the 1116 literals; per-screen only.

⛔ **Legacy deletion (R1)** is gated on census sign-off — `PHANTOM-PUNCH-LIST.md` item 6.
Hide, never cold-delete. Crash-Cart Mode is RETIRED but not physically removed.

## 6 · Regression baseline

`test/e2e` — 9 specs, **128 tests**, `retries: 0`, 5 viewport projects.
Last full run against `.415`: **phone-webkit 119 passed / 9 skipped / 0 failed** (14.9 min).
Skips are environment gates (no service worker in that webkit, `navigator.share` absent, desktop
rail). No *"Expected to fail, but passed"* — every pinned defect still fails as pinned.

`phone-webkit` is the declared primary gate. The full matrix is 640 tests at `workers: 1` ≈ 4 hours.

## 7 · Deployment

GitHub Pages from **`release`**. ⛔ This line said `main` until 2026-09-08, when Pages was traced to `release` by content match and by a last-modified six minutes after `release`'s own commit (`30f3822`); a push to `main` reaches no phone. Intermittent failure mode of record: `build` ✅ but `deploy` ❌ while
githubstatus is all-green — a transient repo-side lock, **not code**. An empty commit re-triggers.

## 8 · Last physical-iPhone verification

✅ **2026-09-09, against `v1.14.585` (served, `f95ece0`).** One look, no write: header ⋯ → RESTORE → a
PHANTOM backup from Files → **the confirm reads `Replaces on this device:` with per-section device → backup
counts and ends `This will OVERWRITE current data.`, readable at 390** → Cancel. What the harness could not
judge — a ten-line native `confirm()` and the Files picker on iOS — read as designed. Owner adjudicated with
`tools/verify.ps1 585 PASS` (stamp `f95ece0`, `SERVED: phantom-v1.14.585`), under the named exception.

*(Prior:)* ✅ **2026-09-09, against `v1.14.584` (served, `d02a081`).** Two looks on the backup banner: header ⋯ →
BACKUP → dismiss the share sheet → **the magenta `BACKUP NOT SAVED — share sheet dismissed — tap to
retry` strip stays and no download prompt follows**; tap the strip → Save to Files → **the strip clears
and a toast reads `Backup exported HH:MM`**. This is the one class the harness cannot judge — the real
iOS share sheet's resolve and its `AbortError` on Cancel — and it behaved as the stubbed spec said.
Owner adjudicated with `tools/verify.ps1 584 PASS` (stamp `d02a081`, `SERVED: phantom-v1.14.584`).

*(Prior:)* ✅ **2026-09-09, against `v1.14.583` (served, `b9d7de9`).** SYS reports `.583`; BUILD's execution strip
reads **`LOCAL ACTIVE | ON-DEVICE · SAVED`** — the one visible change of STATUS-HONESTY, and the word
SYNCED is gone from Build. Owner adjudicated with `tools/verify.ps1 583 PASS` (first live run; stamp
`b9d7de9`, `SERVED: phantom-v1.14.583`). ⚠ **The first report of this pass, on 2026-09-08, came before
the promote and was refused on evidence:** `origin/release`, local `release`'s reflog, all three served
stamps and the PowerShell history still read `.582`, and the phone was on `.582`. The order that holds
is promote → phone → verify; the reading order is origin → Pages → report.

*(Prior:)* ✅ **2026-09-08, against `v1.14.582` (served, `2758ce9`).** BUILD with the *Active rack* card up; SYS →
DIAGNOSTICS reads **`PREVIEW/MOUNT_NOT_DRAWING`**. **The instrument works on hardware, and the reading
names candidate A** — the context object is granted, `isContextLost()` is false, and the drawing buffer
has no backing (`docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md` §3A) — on the same device class where the
harness reads `MOUNT_LIVE` at `652x640`. Owner stamping VERIFIED (stamp on the instrument, not the
preview). ⚠ **Payload still to be recorded verbatim** (`cvAttr` / `drawingBuffer` / `lost`): a
`drawingBuffer=0x0` with `lost=false` is the never-granted state; `lost=true` is a loss between mount
and probe; a `cvAttr=0x0` would point at the layout path instead. It decides the Phase 2 shape.

*(Prior:)* ⚠ **2026-09-08, against `v1.14.581` (served).** BUILD → RACK PREVIEW blank after a Master load
(US-SPK03), canvas present, `OPEN AISLE` and `CONTINUE` present, `0%`, nothing recorded. Owner ruled:
the iOS-WebKit async GPU-grant class, pre-existing since `.391`, not a `.581` regression; `.581` stays
VERIFIED. That unreadable state is what `.582` instruments. *(`.576`–`.578` each passed on device
2026-09-03/06 per the header; `.579`–`.580` are stamped VERIFIED.)*

*(Prior:)* ✅ **2026-09-01, against `v1.14.561`.** Owner cleared `.561` and directed the stamp; served bytes
were confirmed `.561` before the stamp was written, as at `.559`.

⚠ **`.560` was cleared in the same run.** Its check was a LOOK, not a tap — the OPS row's labels
reading in PHANTOM's own white and dim-slate rather than inheriting their surroundings.

### Historical

✅ **2026-09-01, against `v1.14.559`.** Owner confirmed the device carried `.559` and reported the
pass, then directed the stamp.

⚠ **A STAMP WAS REFUSED FIRST, AND THE REFUSAL IS THE RECORD WORTH KEEPING.** The first "stamp
verified" arrived while Pages was still serving `.558` — checked three times. Per the branch
ruling, Claude Code never stamps a version the served bytes have not carried, so whatever the phone
showed then was `.558`: nine tools in the row and a tile still reading OPTICS. The stamp was taken
only after `.559` was confirmed live **and** its two changes were grepped out of the served
`dct-ios.html`. ⭐ **Promote lag is not delivery.**

### Historical

✅ **2026-08-31, against `v1.14.558`.** Build's OPS control: present at the top of the Build
workspace, expands to the ten tools with OPTICS among them, tapped with gloves at its new 44px
height. Owner reported the pass and directed the `VERIFIED` stamp.

⚠ **What this pass establishes and does not.** It clears the door's EXISTENCE and its tap floor.
It does **not** clear the ten tools' own surfaces — each renders through `rd_openOpsTool`, and
only OPTICS was measured (visible host, 362×746, 1,619 chars). The other nine are unverified on
hardware.

### Historical

✅ **2026-08-31, against `v1.14.557`.** The rack-detail aisle return: rack detail opened **from
Home** (not from Build — the Build path never reproduced the defect), OPEN AISLE, close. The rack
elevation survives. Owner reported the pass and directed the `VERIFIED` stamp.

⚠ **What this pass does and does not establish.** It clears the `.557` fix on hardware. It does
**not** close sandbox gate 2 — the hunt never proved this defect was the failure that opened that
gate, and the state of the rack-detail surface under other entry paths is unmeasured. A later "the
rack is missing" report is a new hunt, not a `.557` regression.

### Historical

✅ **2026-08-14, against `v1.14.459`.** Both passes of the `.457`–`.459` batch. **Pass A closed the
SW UPDATE P0** — one tap moved the installed PWA from `.458` to `.459`, reloading once, clearing the
badge, and leaving Site Profile, Active Master and rack/work/event data intact; no reinstall, no
Safari cache clearing. **Pass B** cleared the context engine: every line of CONTEXT PREVIEW traced
to a real record, no blank-stubbed rows, no placeholder step text in the prompt.

⭐ **Pass A is the most load-bearing device verification in this file, because it verifies the
DELIVERY of every future one.** While it was broken, no ship could reach the phone by the intended
route. ⭐ And it was only conclusive because the payload was a no-op — nothing but the mechanism
could have moved the number.

✅ **2026-08-13, against `v1.14.456`.** All six checks of the `.454`–`.456` pass, reported one at a
time: the rack dead straight and square on S1:008 · no framing drift across ten racks · a locked
drag moving nothing · WALK AISLE lighting cyan and freeing the camera · leaving it snapping back
onto the nearest rack with its `n/m RACKED` count restored · and the HANDOFF card showing the new
art with no readable words after a PWA remove-and-re-add.

⭐ **Check 1 is the one that mattered most, because it was the owner's own defect report re-looked
at.** A camera that is mathematically square still has to LOOK square on a real panel. Check 5
confirmed a product judgement — that "nearest rack" feels right — and check 6 required a real iOS
PWA reinstall, because a precached raster does not yield to a reload.

### Historical

✅ **2026-08-12, against `v1.14.453` — owner: *"clear"*.** The consolidated six-check walk in
`BATCH-VERIFY.md` was run on the phone against his real Master and passed: the rack visible above
the fold without scrolling, reading as matte steel with real depth; the rack drawing on BOTH Build
and the rack detail across the round trip; a phase run end to end landing where it started; ASSIGN
from Build staying on Build; and the aisle front row all real cabinets across a ten-rack walk with
no slowdown and no heat spike.

⭐ **This is the pass the whole `.439`→`.453` arc was waiting on, and it is the first hardware
confirmation of the iOS-only behaviour nothing in the harness could reach** — real safe-area (the
harness resolves `env(safe-area-inset-top)` to 0), the asynchronous GPU reclaim behind `.441`, and
sustained thermals across a ten-rack aisle walk.

*(Prior: 2026-08-06 against `v1.14.405`, which established only that the aisle renders.)*

## 9 · Next action

✅ **`.585` CLOSED 2026-09-09 — device PASS on the one look, stamped `f95ece0`, promoted, `SERVED` (owner, `verify.ps1 585 PASS`, under the named exception).**
RESTORE HONESTY — Batch 2 P0 sub-ship 2, owner GO 2026-09-09. **Verify debt is ZERO.** ⛔ **BUT NOTHING
AFTER `.585` SHIPS UNTIL `main` HAS A SERVED SURFACE:** the canonical order is now verify → stamp → promote,
which the tools cannot run against `release`; the next things in order are (1) the owner's staging steps,
(2) the script-only follow-up that moves `verify.ps1` to staging and restores `promote.ps1`'s incoming
guard, then (3) RESTORE-UNDO once Q2 is picked and Q3's numbers exist, then (4) the rest of Batch 2.
*(`.584` closed the same day on two looks at `d02a081`; `.583` at `b9d7de9`.)* ⭐ **THE PROMOTE ORDER IS RULED (`OWNER-RULINGS.md` 2026-09-09 PROMOTE
ORDER):** *verify → stamp → promote* is canonical on the principle; on the mechanics it is **not runnable
until `main` has a served surface** — Pages serves `release` only (measured 14:26:54 GMT), so the owner's
first statement of the order could not run as written and he said so. The surface is an **infrastructure
task, not an app ship:** a Cloudflare Pages project pointed at `main` (`docs/INFRA-STAGING-CLOUDFLARE-PAGES.md`,
steps for the owner; pre-checked: every path is relative, so root-served `main` runs unchanged). **`.585`
runs serve → see → verify ONE MORE TIME as a NAMED EXCEPTION** (no staging surface existed yet) — not
precedent. Once staging exists: a script-only ship moves `verify.ps1` to the staging URL and takes the
promote out of its PASS path, `promote.ps1` Guard 4 goes back to requiring the incoming version adjudicated,
and `CLAUDE.md`'s ship loop is rewritten; until then nothing after `.585` ships. Ruling C (`30f3822`) and rev 2
§0's order are superseded for every version after `.585`. ✅ **The `.585` question is RULED — RESTORE-UNDO** (`OWNER-RULINGS.md` 2026-09-09): neither
*blank is never an erase* nor strict replace; the restore becomes undoable — snapshot before applying, one
revert. Own ship, evidence first: `docs/RESTORE-UNDO-PHASE0-EVIDENCE.md` + `docs/SHIP-HANDOFF-RESTORE-UNDO.md`
(Q1 ruled: refuse when the snapshot cannot be taken, one-line reason; Q2: placement options with tap counts
in the evidence §6, owner picks; Q3 expiry: parked until the storage budget is measured on the phone — the
harness engine returns `null` for `navigator.storage.estimate()`). ✅ **The boot-seed finding is CLASSIFIED
harness-only by app-path measurement, accepted by the owner, and PINNED as `test/e2e/53-restore-reload-honesty.spec.js`:**
a restore driven on a second page with no init script, then its reload, then every restored key compared
byte-for-byte — 21 same, 0 changed, 0 missing, 0 created by boot. `04-storage`'s round trip (`:461`) reads
after that reload with its seed armed and would pass even if the restore wrote nothing (lead). *(`.584` closed 2026-09-09: device PASS on both looks, stamped `d02a081`, `verify.ps1 584
PASS`; `.583` the same way at `b9d7de9`.)*
⭐ **Handoff rev 2 is in the repo** (`docs/SHIP-HANDOFF-VERIFY-AND-CLOSEOUT-rev2.md`, 10,269 bytes,
sha256 `e044f487…`, imported verbatim 2026-09-09). It folded in an external UI review's confirmed,
source-grounded findings and **rejected** that review's five-tab dock and rebuild program. Two things
it added to P0 were acted on: *"a browser download is NOT proof of a retained recoverable copy"* went
into `.584` before commit (the download path says *file prepared*, never *saved*), and restore-side
honesty became the next P0 sub-ship (1b below). ⛔ **BATCH-OODA IS NOT IN FORCE.** `OWNER-RULINGS.md` 2026-09-05 §"NOT YET IN
FORCE": spec §8 items 4 (`CLAUDE.md` still carries CALL 0), 6 (`stamp.ps1` has no batch syntax) and
7 (no batch run end to end) are unmet, so *"max ONE unverified ship"* governs, and
`SHIP-HANDOFF-CLOSEOUT-BATCH.md`'s *"run BATCH-OODA at full tilt"* cannot be honoured as written —
reported, not silently resolved. Phase 0 recon for Batches 2–4 ran read-only in parallel; nothing
ships until each batch's contents get a GO (C-5) — `.582` and `.583` are both ruled.

⭐ **`tools/verify.ps1` LANDED 2026-09-08 (`9856773`, scripts only, no version bump, no `VERIFIED` change) — the one-command adjudication from `SHIP-HANDOFF-VERIFY-AND-CLOSEOUT.md` §1.** `verify.ps1 <v> PASS` = stamp `VERIFIED` → push `main` → `promote.ps1` → `SERVED:`; `verify.ps1 <v> FAIL "reason"` = stamp `FAILED` → push `main`, `release` untouched. Every run ends on exactly one banner — `PROMOTED`, `RECORDED FAILED`, `REFUSED: <GUARD>`, or `STOPPED AT: <STEP>` — and it has **no `-DryRun`**, by design (`c6d4931`/`14028c8` are why). Ten guards run before any write. ⚠ **Two of them are not in the handoff, and that is a reported deviation from its §0 rail:** *"device-verify (main's live Pages URL) → stamp → promote"* is the order ruling C (`30f3822`) proved unexecutable, so the script enforces **promote → phone → verify** — `NOT-SERVED` (origin/release must carry the version, fetched now) and `SERVED-BYTES` (Pages must serve it now) are CLAUDE.md's *"never stamps a version the served bytes have not carried"* made mechanical. The two-key property is untouched: the script cannot see the phone, `PASS` is the owner's attestation, and there is no auto-pass. Fixture-tested by **`tools/verify-selftest.ps1`** (throwaway bare origin + clone, this repo never touched; **6/6** — four refusals each asserted to write nothing, the FAIL path, and the PASS path ending on `SERVED:`), which caught two bugs before anyone ran it live: a `"$var?cb="` interpolation (`?` is a legal variable-name character) that would have refused every real run, and child stdout leaking into the exit code so every real path stopped at STAMP. ⚠ **The handoff's DoD is moot:** *"John runs `verify.ps1 582 PASS`"* now refuses `ALREADY-ADJUDICATED`, correctly — `.582` was stamped last session. **First live use is `verify.ps1 583 PASS` (or `FAIL "reason"`) after `promote.ps1`.** Graph not updated — pinned per the handoff §0, and these docs would bill semantic extraction to the session.

**Queue as it stands 2026-09-09** *(items 1–2 of the `.581`-era queue below are DONE: `.581` was
stamped and promoted, and `.582`'s bump carries the corrected `version.json` note)*:
1. ✅ **`.583` DONE 2026-09-09** — device PASS, `verify.ps1 583 PASS` by the owner, stamp `b9d7de9`, served. *(`.582` closed 2026-09-08, stamped `9a9d6db`.)*
1a. ✅ **`.584` — Batch 2 P0 export honesty — DONE 2026-09-09: shipped `6439dbc`, device PASS on both looks, stamped `d02a081`, served.** `phantom-ship-gate` 7/7; `phantom-rd-reviewer` CHANGES-REQUESTED once (NOT SAVED painted `--alert` red — red is the owner-ruled EXIT exception, the fault channel is magenta `#ff2bd6` per `:9765`; fixed, plus its three advisories) → fresh review PASS; spec `test/e2e/51-backup-honesty.spec.js` 6/6, RED against `.583` then GREEN. Read-only trace 2026-09-08 that drove it: `phantomMarkBackupDone()` is the function's FIRST line, before the IndexedDB read and before `downloadJSON`, so `phantom_last_backup_ts` is written and the reminder banner hidden whether or not a file ever leaves the phone; both `GhostEchoDB` error paths (`req.onerror`, `getAll.onerror`) call `buildBundle([])`, which the manifest records as `included: true, recordCount: 0` — a failed read serialises as a clean store; `downloadJSON` never consults `navigator.share()`'s resolve/reject and `triggerDownload` is fire-and-forget, so *Saved on this device* is currently unknowable from the code. **Fix shape:** mark done only on share resolve (or after the anchor click as a weaker *handed to the browser* state), *Partial backup — review missing data* when any store read failed and persistent rather than a toast, never mark done on reject. ✅ The owner gave the GO per item (*"GO on .584 Batch 2 P0"*), which is C-5's shape; rev 2 restates Batch 2 as pre-approved scope, and each remaining item still gets its own one-word GO.
1b. ✅ **`.585` — Batch 2 P0 sub-ship 2, RESTORE honesty — DONE 2026-09-09: shipped `3edf586`, device PASS on the one look, stamped `f95ece0`, served (named exception).** `phantom-ship-gate` 7/7; `phantom-rd-reviewer` PASS (second attempt; the first stalled at the harness's ten-minute watchdog with no verdict, and its one open question — `key` in the preview's `siteProfile` branch — was checked and is not a bug); spec `52-restore-honesty` 8/8 RED→GREEN. Two harness lessons cost an hour and are recorded in the evidence table: a boot seed re-applies on the restore's reload, and **an own property on `window.indexedDB` vanishes within ~500 ms because WebKit does not keep an expando on a platform-object wrapper alive** — stub `IDBFactory.prototype` (spec 51's instance stub works only by timing; lead). What it was: show what will be replaced, validate the backup before applying, report partial or failed recovery honestly — the import side of the same surface (`phantomImport`, the `_bs` schema guard). `.584`'s bundle now carries `partial:true` + `readFailures` and `manifest[].included:false`, which is exactly what a validating restore reads. Not folded into `.584`: a different visible surface, one visible change per ship.
1c. **Then the rest of Batch 2, one version per phone pass, each on its own GO:** PCT-NA (the `Complete` cell reads `—` with no active deployment), then RACKS-NA (`cmd_masterRackCount` → `null`, hero + stat card read `—` with no Master) — `docs/DATA-HONESTY-COMMAND-PHASE0-EVIDENCE.md` §2–§3.
2. **RACK-PREVIEW-CONTEXT Phase 2 — needs an owner ruling, not built.** ⭐ **The `.582` device log
   NAMES CANDIDATE A** (`MOUNT_NOT_DRAWING`, §8), so Option 1 — a liveness probe that re-arms once,
   hard-capped, loud on final failure — is now the candidate that closes it, and it re-opens the `.394`
   pressure ruling; Options 2+3 remain cheap and additive but cannot see A. Phase 2 Phase 0 owes: the
   verbatim payload, then a design that allocates at most ONE extra context, never twelve.
3. **Batches 2–4 Phase 0 evidence** in `docs/`, each awaiting its own GO.
4. ✅ **PREVIEW-DIAG is in `OWNER-RULINGS.md` (2026-09-08)** — Option 5, instrumentation only,
   approved by the owner in session and labelled by him; the `.581`-stays-VERIFIED disposition is
   quoted verbatim in the same entry. **Still not separately registered:** the promote-order ruling
   recorded in `30f3822` and `tools/promote.ps1`'s header — owner to confirm it gets its own entry.

*(The `.581`-era queue, kept for the record:)*
1. ⏳ **`.581` device verify → `stamp.ps1` → `promote.ps1`.** All three are John's. Checklist in
   `docs/BATCH1-581-EVIDENCE.md`.
2. **One-line fix the stamp unblocks:** `version.json`'s `.581` `notes` still claims the OPS wall
   *"had been rendering without its accent"*. **It never rendered.** The `dct-ios.html` note is
   already corrected (`5cfabbc`); `version.json` is guard-blocked until `.581` is stamped.
3. **Three suite items, none of them `.581`'s doing** — `40-shift-door:41` is a stale test against
   the `.574` ruling and needs re-pointing at `98-cmd-census:244`'s contract; `10-site-profile-root:84`
   is **owner-only** under the `.474`/`.537` authority contract and is **failing, not pinned**, despite
   the handoff calling it resolved; `43-paste-door:208` needs its assertion window isolated from a
   foreign `[OPS]` warn.
4. **Then IA-SHIFTNAV v2 Phase 0**, which is spec'd but has **three open design questions the owner
   must rule before any build** (ghost glyph vs rendered character; ghost as fifth pillar vs SHIFT —
   ⛔ **the dock count is not to be assumed**; and what happens to the Next Action card on Build).

✅ **CLOSED 2026-09-06 — `webkit-2358` IS MOOT AND NO PLAYWRIGHT BUMP IS OWED.** Board v2 recorded
that Smart App Control blocked `webkit-2336`'s `libxslt.dll`, that *"every WebKit process dies at
launch"*, and — the line that matters to anyone reading this session's evidence — that **until a
devDependency bump landed, "any suite run is Chromium at 390×844 … SIGNAL, NOT THE PRIMARY GATE."**
⭐ **MEASURED, AND IT IS NOT TRUE ANY MORE:** `@playwright/test` is still **1.62.1** and still
launches **`webkit-2336`** (`executablePath` → `ms-playwright\webkit-2336\Playwright.exe`), and it
runs — a full 409-test sweep plus every targeted run this session went through it. The build
carries a `DEPENDENCIES_VALIDATED` marker dated **2026-09-04 21:48**, after the board note was
written. ⛔ **ENGINE IDENTITY WAS PROVEN BY FEATURE FORK, NOT BY THE PROJECT NAME OR THE UA STRING**
— `navigator.vendor` = **`Apple Computer, Inc.`**, `window.chrome` **undefined**,
`webkitConvertPointFromNodeToPage` **defined**, `GPUAdapter` **undefined**, `browser.version()`
**26.5**. A Chromium fallback would fail every one of those. ⭐ **SO THE `.581` SUITE EVIDENCE IS
STRONGER THAN THE BOARD WOULD LEAD A READER TO BELIEVE, NOT WEAKER** — it is real WebKit, and a ship
note reporting a phone-webkit run no longer has to caveat it as Chromium signal. ⚠ **UNCHANGED AND
NOT WEAKENED BY THIS:** WebKit-on-Windows is still not iOS Safari, `playwright.config.js`' own
header still governs, and **the physical iPhone gate stays mandatory.**

⚠ **`PHANTOM_CURRENT_STATE.md` WAS THREE SHIPS STALE WHEN THIS WAS WRITTEN** — it claimed `.578`
with zero unverified ships while `main` carried `.581`, and its Version row read `.570` and asserted
a promotion right that had been **revoked**. ⭐ **The file that calls itself the single source of
truth is the one most worth re-reading before trusting, and staleness here is not cosmetic:** its
Version row was telling any reader that Claude Code may move `release`.

⭐ **TWO PHASE-1 QUESTIONS RULED (owner, 2026-09-01).** **(1) `#cs-fieldtools` — THE DESKTOP KEEPS A PATH.** `.559` measured that deleting it outright would strip desktop tool access at ≥1024 and break `03-tools`' order-sensitive wall assertion. The ruling preserves desktop access: the phone loses the duplicate, the desktop keeps its door. ⛔ **It is a re-home, not a close** — Phase 1's door ledger scores it as one and the honest net drops from −2 to **−1**. ⭐ Contract A2 was never at risk either way: **both entry points already call the one canonical `rd_openOpsTool`, and two compositions reaching one door is not two doors.** **(2) `03-tools`' reachability pin is RETIRED, not re-pointed.** It asserted the ops tools were **one tap** from the Build landing and was an expected-failure at `.563` because the OPS row is collapsed at boot **by design** (`48-ops-row-exists:136`). The owner accepted the 1→2 tap trade at `.559`, so the pin encoded a superseded standard and would have stayed red forever describing intended behaviour. ⭐ **Retired rather than re-asserted because the accepted trade is already pinned canonically in `48-ops-row-exists`** (`:54` the door, `:72` the ten tools on expand, `:136` the collapsed-boot control) — re-asserting it in `03-tools` would have been a second test for one fact, the one-canonical violation in test form. ⚠ **The old test's own guard is honoured:** it read *"Do not repoint this at Command to make it green… weakening the test to fit the code."* Nothing was repointed and no assertion was weakened — **the standard changed by ruling, and the test holding the new standard already existed.** **Measured: `03-tools` 29 → 28 tests, 10 failed / 23 passed with `48` — the ten F-1 failures byte-for-byte unchanged.** A retirement comment block replaces the test in place, naming what was removed and where the coverage lives.

⭐ **MODEL DEPTH IS RULED — THE DEPLOYMENT STEP STAYS, THE PICKER RESOLVES IT (owner, 2026-09-01).** E-9 measured that a rack is only addressable as a **pair**: all thirteen entry paths reach `deploy_showRackDetail(deployId, rackId)` (`:41503`), and a rack is found by `deploy_loadRacksFor(deployId)` then `.find(r => r.id === rackId)`. §0 promises three moves; the code has four levels. **RULING: the four levels stay. The deployment is resolved BY THE PICKER, not by the technician** — §0's three moves remain true *for the tech*, and the picker is the thing that collapses them. ⛔ **`deploy_showRackDetail`'s signature does not change and no entry path is refactored** — all thirteen keep working exactly as measured. ⭐ **THE MECHANISM ALREADY EXISTS; THIS RULING NAMES IT RATHER THAN COMMISSIONING IT.** `ACTIVE_DEPLOYMENT_KEY = 'phantom_active_deployment'` (`:29686`) with `deploy_getActiveId()` (`:29688`, carrying a lazy migration from `phantom_manifest_last_deploy`) and `deploy_getActive()` (`:29702`). **And the resolution pattern is already written and working at `:24005`:** it takes the active id, scans that deployment's racks, matches `rs[i].rackId || rs[i].id`, and calls `deploy_showRackDetail(aid, rs[i].id)`. **The picker reuses that path; it does not author a second one** (Contract A2). ⚠ **TWO FIELDS, AND CONFUSING THEM IS THE TRAP.** `rackId` is the human label a tech reads and scans (`s4:099`); `id` is the record id `deploy_showRackDetail` matches on. `:24005` accepts **either** as input and passes **`r.id`** onward. A picker that passes the label straight through lands on "Rack not found". ⚠ **ONE RESIDUAL, FLAGGED FOR PHASE 1 AND NOT BLOCKING:** `deploy_getActiveId()` returns exactly one deployment, so a rack label present in more than one deployment resolves to the active one **silently**. Whether labels can collide across deployments is unmeasured. **If they can, the picker owes a disambiguation rather than a silent pick — Contract B14, no silent failures.** Phase 1 measures it before drawing the picker.

⭐ **P-1 / P-11 ARE CLOSED — THE ASSISTANT ANSWERS ON DEVICE (owner-verified, 2026-09-02).** ⛔ **IT WAS FOUR STACKED BUGS, NOT ONE, AND EACH HAD TO GO IN ORDER.** (1) `x-phantom-key` failed Safari's preflight so nothing reached the Worker — removed at `.567`. (2) The failure was illegible: 400 was the one status `phantomAPI` did not classify, so it rendered as a bare code — fixed at `.568`, and the Worker (v2.2) now also logs `[phantom-api] upstream <status>: <body>`. (3) The model string was invalid — pinned to `claude-sonnet-4-5-20250929` at `.569`. (4) **THE FOURTH FIX HAS NO COMMIT, AND THAT IS WHY THIS ENTRY EXISTS.**

⛔ **BUG 4 WAS FIXED OUT OF BAND AND LEAVES NO TRACE IN THE REPO.** The Anthropic key in the Worker was an **org / all-workspaces (identity-linked)** key, and Anthropic requires an `anthropic-workspace-id` header for that key class. The owner fixed it **outside the codebase**: he created a **Default-workspace-scoped key with no expiration** and swapped it into the Worker's `ANTHROPIC_API_KEY` secret. ⛔ **NO code change. NO header added. Nothing in `git log`.** ⚠ **A future session debugging a dead assistant will find `.569` as the last AI commit and conclude the model was the whole story. It was not.** If the assistant dies again, **check the Worker's key scope before touching `dct-ios.html`** — the client is not the only half of this system, and three of these four bugs were invisible from the client source. 📌 **Housekeeping owed:** the old all-workspaces key is still live and nothing uses it — the owner deletes it.

✅ **O-3 CLOSED** — the Worker's streaming pass-through (v2.1) is deployed and confirmed, so AI answers stream progressively rather than landing in one lump.

⛔ **STILL OPEN — RECORDED, NOT STARTED.** Nothing below is authorised; the owner sequences. **P-2** invented `PHASE_BASELINE_MINS` *"typical: 60 min"* shown as data — honesty fix: label *"no baseline yet"* or compute from real history (`:27462`, read at `:27481` — ⚠ **re-anchored TWICE. The `.565`-era `:27403`/`:27422` were already stale when recorded on 2026-09-02, drifted by `.567`–`.569`. Their replacement `:27451`/`:27470` was correct only until `.570`'s own comment block shifted the file — and was committed stale in the same commit that recorded F-4b. Corrected post-`.570` and swept. THIS IS THE THIRD DRIFT OF ONE CITATION; it is the reason F-4b exists.**). · **P-6** Master management is buried; wants **one door under SYS** (view / load / delete, delete PIN-gated). · **P-7** Cage Nut & RU Map screen — close it, duplicate rack picture. · **P-8** Rack Preview card on the BOM path — close it (empty card + duplicate OPEN AISLE + OPS drop-down). · **P-10** 3D aisle rack focus = full rack state, the *click one rack, do everything* model. · **P-12** `forge.html` carries **four** hardcoded `claude-sonnet-4-20250514` strings (`:4571`, `:4772`, `:6286`, `:9143`) that bypass `PHANTOM_MODEL` — that ID is **Deprecated**; same bug class as P-11, its own ship. · ⭐ **RACKHERO-RELOCATE** (owner, 2026-09-03) — `.cc-rackhero` (`:14020`) leaves the Command first screen for the **Forge 3D aisle view**, where the rack model says a rack picture belongs. ⛔ **It is NOT markup and must not be sliced as if it were:** `cmd_mountRackHero()` (`:23884`) mounts the INSPECT-3D WebGL scene and `showMode` disposes it at `:19258`–`:19260`, so the ship **carries the disposal path with it** — Contract A6, one live attachment ever. Split out of FIRST-DOOR Ship A precisely so a markup strip could not take a GL lifecycle with it by accident. · ⭐ **BUILD RACK-DETAIL STATUS WALL** (owner, 2026-09-03, from the `.572` device pass — **logged for IA-SHIFTNAV Phase 1, not scheduled**). Above the fold on the Build rack detail the owner counted **PASTE ANYTHING + four stat tiles + six buttons + chips** before any rack content. ⛔ **This is the same defect class FIRST-DOOR Ship A is fixing one screen over** — a surface that answers no single question because everything competes — and it is the rack screen, which under §0 is *the unit of work*. ⚠ **It is NOT a FIRST-DOOR item and must not be absorbed into Ship A:** A/B are scoped to the first screen and the duplicated-action families, and P-9 already assigns Build consolidation to IA-SHIFTNAV Phase 1. Recorded there so it is not re-discovered a third time. ⚠ **Counts are the owner's from the device and are NOT source-verified** — and the `.571` census is exactly why that distinction is now written down: a source census of this campaign was read wrong twice before the DOM settled it. **Whoever takes this measures the rendered rack detail before proposing anything.** · ⭐ **INTEL-DOCK GOVERNS THE DOCK** (owner ruling 2026-09-03). `SHIP-HANDOFF-INTEL-DOCK.md` is in the repo (8226 bytes, sha256 `f27b19c43d6948bf…`, commit `3033ecf`) and is **APPROVED**: the dock becomes `COMMAND · BUILD · TOOLS · GHOST` and EXIT moves to the last item of SYS. ⛔ **IA-SHIFTNAV v2 P-3's three-slot `RACKS · SHIFT · SYS` dock is SUPERSEDED** and struck in the proposal. ⚠ **THE RULING SETTLES THE DOCK, NOT THE PILLAR:** Contract A8 calls SHIFT a primary product pillar, and A8's own text separates the two — *"removing that slot removes the slot, not the feature"* — so **SHIFT keeps a door and loses a slot**, which is precisely what `.574` shipped (`#cs-shiftbar` in `#cs-grid`, gated on the Master, under the 2026-08-14 ruling). ⛔ **Sequenced, not started:** the document's own text is *"can ship as its own slice once Ship A completes"*, and Ship A has A-2b, A-3 and A-4 outstanding. ⚠ **Left open on purpose:** if M4 arrives wanting a SHIFT dock slot it collides with the ghost — a future ruling, recorded so it is not met as a surprise. · ⭐ **SITE-SYNC — PARKED** (owner, 2026-09-03). Architecture spec, **not a ship**; `docs/SHIP-HANDOFF-SITE-SYNC.md` imported verbatim at `44502bc` with `docs/PHANTOM-OVERVIEW.html`. ⛔ **Phase 0 NOT started and must not be.** Sequenced **after FIRST-DOOR and INTEL-DOCK complete**. ⭐ **One slice may move early — `STATUS-HONESTY`**, because the `SYNCED` label **lies today** and removing a false claim is a **Contract B10 honesty fix, not sync work**; the spec itself calls it *"ships now, no backend, one line"*. ⚠ Its Phase 0 **E-4** (find the label's exact logic) is still the prerequisite even for that one line. ⛔ **Everything else waits, and one slice shipping early is not the campaign starting early.** Full entry on the board. · **Ship 2b** dead-code cleanup — the four orphaned functions, the `.rack-hybrid*` CSS, and the five permanently-null `#reh3dCanvasHost` guards, all anchored in the source at `.565`. ⭐ **P-7, P-8 and P-10 all fold into `SHIP-HANDOFF-IA-SHIFTNAV-v2.md`** — the rack is the unit of work — and **§6's comprehension gate is required before any Phase 1 work.**

⭐ **E-8 IS RULED — THE TOOLS STAY DOORS, NO DATA CHANGE (owner, 2026-09-01).** `SHIP-HANDOFF-IA-SHIFTNAV-v2.md` §1 places seven tools inside the rack as *"rack-scoped views, not destinations."* Phase 0 measured that **only ISOLATE is rack-keyed** — the rest store against a deployment, a job, an audit, or nothing at all. **RULING: they stay doors, and no data-model change is authorised.** OPTIC LEDGER, AUDITS, BURNDOWN, BLAST RADIUS, MANIFEST, BOM, PORT MAP and SOPs keep their existing scope and their existing entry; §1's *"rack-scoped views"* wording is **STRUCK for those eight.** ⭐ **What is still rack-scoped at zero data cost, and it is not nothing:** ISOLATE (already carries `rackId` per session) · RACK MAP (rack-*addressed by input*, so it can be seeded with the current rack without touching a store) · devices + U positions, the five phases, assign, QR, log note, photos and flags (all already on the rack screen) · `SEE IN AISLE` (already exists at `:41699`). ⚠ **THIS NARROWS §0, AND §7 REQUIRES SAYING SO OUT LOUD RATHER THAN QUIETLY.** §0 promises the tech *"do not leave the rack to find a tool."* With eight of ten staying doors, they will. §7: *"If Phase 0 or Phase 1 finds that §0 cannot be honored for some surface, say so plainly with the reason. Do not quietly keep a door."* **This is that plain statement.** The reason is that the data is not keyed by rack and the owner has ruled against changing it — a real constraint, not a design failure. ⚠ **Phase 1's P-4 must be re-scoped or it will fail its own test.** P-4 requires the door ledger's net to go **down**; with the eight tool doors preserved, the closable set is duplicate *paths* (`#cs-fieldtools` versus the OPS row is the obvious one), not the tools themselves. **Phase 1 reports the achievable net and says what it could not close — it does not manufacture a number.** 📌 **The upside is real and should be said:** this makes the first ships small, reversible and free of storage migration, which is the opposite of the risk profile a seven-tool re-keying would have carried.

⭐ **SCAN IS RULED — v2 §2 WINS, THE BOARD LINE IS STALE (owner, 2026-09-01).** Three documents disagreed: `SHIP-HANDOFF-IA-SHIFTNAV-v2.md` §2 says SCAN is **not a dock destination** and lives where scanning happens — on the rack (scan a device into this rack) and on the picker (scan a rack label to open it); `PHANTOM-BOARD-NEXT-OPS-v2.md:40` says *"Scan gets a dock slot"*; `SHIP-HANDOFF-SCAN-PILLAR.md` is held for a five-pillar dock. **RULING: v2 §2 governs. The board line is STRUCK as stale** — it was written against the pre-v2 five-pillar model and is not the queue of record for nav. ⛔ **Do not build a SCAN dock slot.** The §3 requirement stands and is the real target: **scan reachable in ≤1 tap from wherever the tech is**, rack or picker — which a dock slot was only ever a means to. ⭐ **AND THE HANDOFF IS RETIRED (owner, 2026-09-01, on the follow-up ask).** `SHIP-HANDOFF-SCAN-PILLAR.md` is marked **RETIRED** in place. Its central premise — SCAN becomes a nav pillar — is what §2 refuses, and **its parent is gone independently: the file names `SHIP-HANDOFF-IA-SHIFTNAV.md` + Addendum A as its parent and v2 supersedes both in full.** ⛔ Nothing in it may be executed. 📌 **The file is NOT deleted, deliberately** — the measured material outlives the proposal: the ten routes at A-5, the `pg-scan` history (`.552` deleted it in Stage 6.7), `#wk-scan`, and the SCAN/SHIFT art provenance at `a328a10`. A future SCAN ship on the rack and picker reads it for anchors and re-verifies against the then-current stamp. ⚠ Its anchors are `.562`-era. The superseded hold, kept for the record: ⛔ **SCAN-PILLAR WAS HELD UNTIL M4 — owner ruling 2026-09-01.** `SHIP-HANDOFF-SCAN-PILLAR.md` is in
the repo, fully anchored, and does **not** authorise work. ⭐ **The reasoning is the useful part:**
ship one pillar now and **the nav changes twice** — once for SCAN, once at M4 when SHIFT arrives and
EXIT re-homes into it (R-02a) — giving two device verifies and an interim nav of five slots that are
**not R-02's five**. ⚠ **The ruling does NOT reject the pillar**, and does not settle whether SCAN
gets a real page or whether EXIT keeps its slot; both are answered when M4 is scheduled.
📌 **Recorded so it is not re-derived:** `pg-scan` existed and `.552` deleted it (Stage 6.7, the
eighth and last borrowed-organ re-home), so this ship would partially reverse a completed campaign ·
**TEN routes reach SCAN**, not the six a first grep suggests, `:24311` (deep-link/back-nav) among
them · the SCAN/SHIFT art is **the approved cut** and tracked (`a328a10`) but deliberately **not**
precached until a consumer exists, per the `.364` lesson.

⏳ **THREE OWNER QUESTIONS ARE OPEN, and none of them is a coding task:**
- **F-5 · the SW update path** — auto-update or user-controlled? ⭐ **The deciding fact is only
  answerable on the phone:** does iOS Safari honour message-based `skipWaiting`?
- **F-6 · should an off-screen Build hold a GPU context?**
- **`#cs-fieldtools`** — still defaulted (D-1) rather than ruled.

⏳ **QUEUED WORK, all owner-slotted:** IA-SHIFTNAV **Ship 2** (five-pillar dock — gated on SHIFT
data D-1/M3 and on confirming the SCAN/SHIFT art on disk is the approved cut) · **Ship 3** (the
VERIFY band in Build, per V-1) · **Q-3 BOOT-TAPGATE** (authored, approved, held) · **O-2** the
Grok-icon provenance ruling · **R1-D's remaining shortfall** (the rack is above the fold again but
still ~75px against a 150px bar).

⏳ **NEXT, none started, all owner-slotted:** **Ship 2** the five-pillar dock (gated on SHIFT having
data — D-1/M3 — and on confirming the SCAN/SHIFT art on disk is the approved cut) · **Ship 3** the
VERIFY band in Build per V-1 · **Q-3 BOOT-TAPGATE** (authored, approved, held) · **O-2** the
Grok-icon provenance ruling · **`#cs-fieldtools`**, still defaulted rather than ruled.

⭐ **THE NEXT SHIP IS IA-SHIFTNAV SHIP 1, and it is unblocked** — `.558` restored the Build door it
lands on. ⏳ It needs two owner answers first, neither of which gates anything else: the **1→2 tap
trade** and whether **OPTIC LEDGER** is the aisle word. See `docs/IA-SHIFTNAV-PHASE1-PROPOSAL.md`.

⭐ **THE QUEUE LIVES IN `PHANTOM-BOARD-NEXT-OPS.md`** (owner copy, `Downloads`), not here. Open at
`.557`, all three needing the owner rather than Claude Code:
- **Q-2 · `SHIP-HANDOFF-IA-SHIFTNAV.md`** — base spec **not yet written**, and it blocks the one
  stranded surface. `docs/LEGACY-RETIRE-STRANDED.md` shows Deploy Optics needs **a door, not a
  rebuild**. Say the word and the spec gets authored.
- **Q-3 · `SHIP-HANDOFF-BOOT-TAPGATE.md`** — authored, approved, **held**. Phase 0 evidence against
  current stamped source first, then one ship.
- **O-2 · Grok-icon provenance** — licensing/origin call. Until ruled, it ships nowhere new.

⚠ **SANDBOX GATE 2 IS NOT PROVEN CLOSED BY `.557`.** The board opened it as *"rack-detail visual
renders"*; `.557` fixed a defect that emptied the elevation but was never shown to be that one.
⛔ Before calling the gate closed, the rack detail wants a look on device from the paths the hunt
did **not** measure. And per the standing trap, an empty-rack report can be **data** — ~42% of cabs
are cable-only — so `0/0` with a real location is a DATA suspicion, not a code one.

⭐ **The `.461` CONTINUE diagnostic is still owed and is still informative** — the reported failure
never reproduced in the harness, so the useful outcome is *which* message appears, or that none
does. ⚠ `.557` sharpened why that matters: **that instrument measures the OPS host, not the
surface**, and it sat silent through a rack at 0px because the host held 51px. **Silence from it
rules out less than it appears to.**

Open, none started, all owner decisions:
- **The `"Loading storage metrics…"` line** and the **`CONTEXT INJECTION ACTIVE` copy naming 3 of 7
  AI surfaces** — both found in the `.460` walk, both disclosed and unfixed (§1i).
- **The locked drag says nothing** (§1c) · **the FOV literal** (§1d) · **the HANDOFF gesture** (§1e).
- **369 follow-ons:** the auto-detecting paste parser is the spec's own named next candidate; the
  EVIDENCE UI card waits for response formats. ⛔ Next-best-action, readiness scores, Rack
  Intelligence and auto-handoff each need data-reality scoping first — **the `.457` field inventory
  is the model for how to do that.**
- **The R1-D remainder** · **PHASE-ENGINE step text** · **M3 data sources**. ⛔ D-1 is the LAST
  domino — and note §1i corrected the sentence D-1 was partly resting on.

Open items, none started, all needing an owner decision first:
- **The locked drag says nothing** (§1c) — disclosed unruled since `.454`. ⛔ Do not invent a fix.
- **The FOV literal** (§1d) — pure refactor, no runtime effect; fold into the next ship that
  touches `placeCamera`.
- **The HANDOFF art gesture** (§1e) — the exchange still reads as two people holding rather than
  one releasing. Aesthetic, and the honesty fix already shipped.
- **369 follow-ons the spec itself listed as non-goals:** the auto-detecting paste parser is named
  the strongest NEXT candidate; the EVIDENCE UI card waits for response formats to stabilise.
  ⛔ Next-best-action, readiness scores, Rack Intelligence and auto-handoff each need their own
  data-reality scoping first — the `.457` field inventory is the model for that.
- **The R1-D remainder** (rack at 176px vs §30's 270–320) · **WALK SHIFT and SITE/SYSTEM**
  (owner-queued 2026-08-11, never started) · **PHASE-ENGINE step text** · **M3 data sources**.
  ⛔ D-1 is the LAST domino, not the first.

⚠ **One ruling is owed and it is small:** the locked drag does nothing and says nothing (§1c). It is
disclosed, not fixed, because the answer is a product call.

📌 **Owner-queued, not started — the HANDOFF feature-hero art.** An updated `icons/phantom-feat-
handoff-v*.webp` was briefed 2026-08-13 (unmistakable two-technician exchange; screen reads as a
deployment handoff package; no readable text). ⛔ **No image generation exists in this session** —
no `GEMINI_API_KEY`, and the `design` skill's generators emit SVG, not photoreal edits — so the
asset is the owner's to produce. When it lands: new `-vN` filename (overwriting in place serves
stale), move the `sw.js` PRECACHE entry (`:84`) to the new name, three-stamp bump, and iOS needs the
PWA removed and re-added to show it. ⭐ The brief's "no readable text" moves this art back INTO
data-honesty compliance — the current one ships baked decorative text under an owner override.

Open items, none of them started, all needing an owner decision first:
- **The R1-D remainder.** The rack sits at **176px** visible where the directive's §30 recommends
  270–320. The arithmetic is in `R1-RENDERER-BASELINE.md` §3: 651px of column above the fold, 475
  of it spent before the rack. The only block big enough is the hero, whose phase sub-block is the
  same fact already shown by NEXT ACTION *and* by the phase dock. Removing a triplicated fact is a
  product decision.
- **PHASE-ENGINE step text** — still placeholder by design; real per-platform commissioning
  procedure is site knowledge the code does not have. Owner's.
- **M3 data sources**, which gate Shift → the nav pillar → D-1. The nav complaint is the LAST
  domino, not the first.
- **The SHIFT and SITE/SYSTEM walks** — owner-queued 2026-08-11, never started. See the handoff.

## 10 · Instruction-surface compaction — 2026-08-08

Applied this session, per owner approval. Live corpus **218,086 → ~66,000 words**; always-loaded
context **5,479 → ~2,000 words**. Nothing deleted — superseded material is in `archive/2026-08-08/`
with a tombstone left at each original path so no reference dangles.

Structural changes worth knowing:
- **`CLAUDE.md` is now contracts + discipline only** (3,652 → 1,233 words). The 2,417-word
  current-state section that lived there — and was stale by seven ships — moved here.
- **Four prose rules became a hook.** `tools/hooks/phantom-guard.js` blocks a commit on broken
  lockstep, non-compiling script, brace imbalance, damaged CRLF, or a backtick in a commit body.
  It replaces a gate that said *"a ship is blocked until lockstep-auditor and data-honesty-auditor
  report PASS"* — **agents that were never loadable from this session's CWD**, which is why
  `BATCH-VERIFY` records *"Agents barred, equivalents run inline"* three times.
- **Memory 64 → 34 files**, merged by failure class.
- Six contradictions found; five resolved, D-1 (SHIFT) escalated to an owner product decision.

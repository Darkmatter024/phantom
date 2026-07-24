# BATCH-VERIFY — consolidated device checklist (CALL 0, DIRECTIVE 2026-07-06)
**Protocol:** ships stack; owner runs THIS list once per batch (cap: every 6 stacked ships or before
any HIGH-risk ship). Every ship keeps its own rollback line. Claude Code appends; owner checks off.
**Batches .192-.197, .198-.201, .202-.212, .213-.214, and .215: RELEASED by owner (.202-.212 verified 2026-07-08; .213 boot plate + .214 deploy-tap FIX verified 2026-07-09; .215 crash-log hardening verified "all good" 2026-07-09). Batch .340-.345: RELEASED 2026-07-23 ("340-345 good") — cleared the 6-ship count cap and the MASTER FULL-INGEST HIGH-risk prereq. Current batch: OPEN, starts at .346 (1 of 6) — see the last section of this file.** · Clear SW cache before the pass.

---

## v1.14.192 — G-1c2 `.gsk` inline plates (`d1758b6`) · rollback: revert commit
- [ ] Rack Map floor view: empty card + rows machined
- [ ] Rack detail: phase card + audit-scan mono row machined
- [ ] Handoff log record cards machined · Deploy audit log entries machined
- [ ] BOM analyze result rows machined · optic scan alternate-match card machined
- [ ] Tombstone modal UNCHANGED (deliberately skipped)
- [ ] `?legacy=1` rack detail/audit log: identical pixels

## v1.14.193 — A-1 ticket intake (`8a63726`) · rollback: revert commit (stateless)
- [ ] (superseded by A-2 UI — verify via the .194 flow below; A-1 plumbing items only:)
- [ ] Import a .txt → chip shows name/KB · oversized (>256KB) file binned with message
- [ ] Deny clipboard permission → machined textarea fallback appears, ATTACH works
- [ ] Close/reopen sheet → ticket gone (stateless) · offline → existing fail-fast unchanged

## v1.14.194 — A-2 intent flow, auto-mic killed (`0c1a5e4`) · rollback: revert commit
- [ ] Tap Ask card → sheet opens, NO mic indicator anywhere in Safari chrome
- [ ] Four machined intent cards render (SPEAK cyan / PASTE violet / TYPE gold / IMPORT teal)
- [ ] SPEAK → mic starts only now · CANCEL → menu, mic off
- [ ] TYPE OR PASTE → native paste works, no permission prompt → ASK PHANTOM → answer addresses it
- [ ] ‹ MENU back leaves nothing stale
- [ ] PASTE TICKET → chip mounts above menu, SPEAK subtitle = "Ask about the attached ticket"
- [ ] SPEAK with chip → answer references ticket · composer + chip → answer uses BOTH
- [ ] ✕ clears chip · `?legacy=1`: va sheet + triage "Ask Assistant" tile unchanged (old behavior intact)

## v1.14.195 — T3 ask-card saturation (`pending`) · rollback: delete the `filter:none` line
- [ ] Ask card on Command: prism art reads clean (was hot/oversaturated) — `.155` precedent value
- [ ] Card still glass (ring/well/violet tint) — only saturation changed

## v1.14.196 — M-1 .mach recipe (CALL 3) · rollback: revert commit
- [ ] Rack Map SCAN-OR-TYPE input: unchanged look (same recipe, now from the .mach block) + cyan focus
- [ ] A-1 clipboard-deny fallback textarea: unchanged look + placeholder legible
- [ ] Any regression on Rack Map search flow (submit still works)

## v1.14.197 — G-1c3 CALL-1 + inline plates (`pending`) · rollback: revert commit
- [ ] Deploy command center: phase-matrix rows machined; a COMPLETE row rings green, PAUSED gold, BLOCKED red, normal slate; phase cells (per-phase colors/glows) unchanged
- [ ] ?legacy=1 deploy list: phase matrix rows show the OLD flat tints (runtime-gated)
- [ ] Optic ledger summary card + Masterfile reconcile card: machined CYAN ring (violet gone — CALL 1)
- [ ] Issue detail cards, handoff record cards, BOM-ingest step cards, EDP parse status, preflight card, nvidia-smi telemetry card: machined
- [ ] BOM-ingest SUCCESS (green) cards + TODAY red blocker rows: UNCHANGED (semantic, deliberately skipped)
- [ ] .195 ask card + .196 inputs items above

## v1.14.198 — G-1d Command + pt-btn · rollback: revert commit (primary = one rule)
- [ ] Command: OPS SIGNAL rows, KPI tiles, header back chip machined; hero lens + stat trio glass w/ cyan glow intact
- [ ] Command QA tile grid: machined housings, per-tile glow/text hues still locate groups at arm length (border tints gone — JUDGE THIS)
- [ ] ⭐ PRIMARY BUTTONS fleet-wide (LOAD MASTER, parse, exports…): now dark cask w/ cyan text + ring (was solid cyan/black text) — JUDGE THE AFFORDANCE; veto = one-rule revert
- [ ] Ghost/secondary buttons machined incl. clip-notch corners; warning/destructive buttons UNCHANGED (semantic)
- [ ] Header ghost button machined; its amber alert state unchanged; shift pill (green) unchanged

## v1.14.199 — S-1 client proxy key · rollback: revert commit (Worker unaffected)
- [ ] Any AI feature (Ask PHANTOM) round-trips normally against the grace-mode Worker
- [ ] (After Worker paste) Cloudflare log shows x-phantom-key arriving; unkeyed count trends to 0

## v1.14.200 — P-2 New Device v2 + .mach true-up · rollback: revert commit
- [ ] Fresh device (cleared localStorage): v2 screen — machined fields w/ brush, comet ring rotating, spotlight follows touch
- [ ] Save minimal (name+site) -> enters app -> SYS > SITE PROFILE shows saved values; floor fields editable later
- [ ] EXISTING-profile device NEVER sees the screen (backfill contract)
- [ ] ?legacy=1 fresh device: the OLD gate, verbatim
- [ ] Rack-ID input + ticket fallback textarea: deeper well + brighter cyan focus (true-up) — still reads right

## v1.14.201 — D-1a stat faces pilot · rollback: revert commit
- [ ] Platforms drill-ins / POWER + COOLING cards: 11 faces render (values collapsed-visible, mono, cyan); 12 procedural cards deliberately faceless
- [ ] ⭐ DENSITY CALL at arm length (gates D-1b): too busy? want the scent line? faces on the right cards?
- [ ] H100 Common Faults card: XID tags w/ gold numbers
- [ ] Spot-audit any face value against the card body it fronts (they must match verbatim)
- [ ] ?legacy=1: cards show NO faces (guard) — pixel-identical to before

## v1.14.202 — P-3 law + G-1 residue · rollback: revert commit
- [ ] TODAY dashboard: cyan panels + chart card machined w/ cyan ring; violet KPI tile rings violet; RED blocker cards unchanged
- [ ] Profile editor: cyan card machined; ORANGE info card unchanged
- [ ] Platforms drill-in DLC chip still violet (law codified, no visual change intended anywhere else)

## v1.14.203 — D-1b fleet stat faces · rollback: revert commit
- [ ] Fiber cards (OM3/OM4/OM5/OS2): reach faces collapsed-visible and correct vs their tables
- [ ] LC/SC/DAC/AOC/QSFP/SFP/IB/OLTS/baud cards: faces match their bodies verbatim (spot-audit any)
- [ ] CLI / OOB / console / triage checklist cards: deliberately faceless (28 of 42 — procedure-heavy by design)
- [ ] ?legacy=1: no faces anywhere
- [ ] QUEUE IS DRAINED — this pass closes batches .198-.203

## v1.14.204 — web-Claude fix pass (SUPERSEDES the .195/.198/.201/.203 render items above) · rollback: git revert
- [ ] Command: Ask PHANTOM card now ACTUALLY shows the glass (was invisible border-box on device); prism + arrow intact
- [ ] #omni-bar (active-deployment capture band): opaque, no card text ghosting through it
- [ ] Primary buttons: even glow, no bottom-heavy tilt (T3 tune)
- [ ] Reference cards WITH stat faces: card TITLE reads full-width, stat row wraps to its OWN line below (not crushed into the title) — this is the D-1 layout fix; re-judge density now that layout is correct
- [ ] ⚠ Watch pt-btn-primary specifically: if it looks flat/materialless like the old ask card did, flag it (same raw-<button> border-box risk, left in scope for a follow-up)

## v1.14.205 — pt-btn-primary padding-box fix · rollback: revert the rule to .204
- [ ] Primary buttons (LOAD MASTER, EXPORT, parse CTAs, CONFIRM actions): now show the dark cask w/ cyan ring + glow + cyan text (was possibly flat/invisible border-box) — this REPLACES the .198 primary flag
- [ ] Ghost/secondary + qa-btn: unchanged from .198 (still border-box; flag if any reads flat vs primary now)

## v1.14.206 — A-2 assistant-sheet buttons padding-box fix · rollback: revert commit
- [ ] Tap Ask PHANTOM: the 4 intent cards (SPEAK/PASTE/TYPE/IMPORT) now show their machined ring + accent (were likely flat/edgeless border-box on device)
- [ ] Composer: ASK PHANTOM + MENU buttons show ring; Listening: DONE + CANCEL show ring
- [ ] Clipboard-deny fallback: ATTACH chip renders; ticket-attached chip lit cyan
- [ ] These were last device-touched in .194 before the border-box bug was known — this is the corrective

## v1.14.207 — FIX Command deploy tile clickable (laptop) · rollback: remove aspect-ratio:auto
- [ ] LAPTOP/desktop Chrome: Command page — the DEPLOY/SCANNED/HANDOFF tiles are compact (~96px, not giant); Deploy tile is on-screen and clicking it opens the deploy flow
- [ ] PHONE: same tiles now their designed compact height (slightly shorter than before) — deploy tile still taps through

## v1.14.208 — PHASE CHECKLIST (per-phase item lists) · rollback: git revert
- [ ] Work › Deploy › open a rack: each phase card shows a CHECKLIST strip; in_progress phase auto-expanded, others collapsed
- [ ] Tap items → green ring-check; count meter + bar update live WITHOUT collapsing the accordion
- [ ] wantNote rows (torque/serial/XID/leak) show note field open; type a value, leave + reopen rack → persists
- [ ] `+ note` on a plain row reveals an input · `+ ADD ITEM` → new row on THIS rack AND every other rack (site-scoped)
- [ ] EDIT → per-row red ✕ (default→removed, user item→deleted) + tap label to rename; DONE exits
- [ ] DLC rack (GB200/GB300/NVL72) shows the 2 extra mechanical DLC rows; H100/H200 does NOT; unknown-GPU rack shows them (fail-open)
- [ ] in_progress phase, unchecked items, tap COMPLETE → "N items unchecked — complete anyway?" soft confirm (last check does NOT auto-complete)
- [ ] Complete the deployment → checklist read-only, notes shown, no add/edit
- [ ] `?legacy=1`: rack detail has NO checklist strip, COMPLETE shows no checklist confirm (byte-identical)
- [ ] ⚠ 7th ship in this batch (one past the 6-cap) — owner stacked by decision 2026-07-08

## v1.14.209 — LOG NOTE QUICK CHIPS (tap/long-press, site-editable) · rollback: git revert
- [ ] Work › Deploy › rack › action stripe LOG NOTE: prompt shows a chip wrap row above the input
- [ ] TAP a chip → label fills the box, cursor at end, keyboard focus; tap a 2nd → appends with '; '
- [ ] LONG-PRESS ~0.5s → logs instantly (haptic + "Note logged to <rack>" toast), sheet closes, no typing
- [ ] ⚠ Audit trail shows exactly ONE RACK_NOTE per long-press (no double-log)
- [ ] Start a long-press then scroll/drag off the chip → nothing logs (no misfire)
- [ ] `+` → prompt adds a chip that appears here AND next open (site-scoped)
- [ ] EDIT → red ✕ removes (default hidden / user deleted), tap label renames; DONE exits
- [ ] Typed-note flow still works (type → OK → logs) — chips are additive
- [ ] `?legacy=1`: LOG NOTE prompt has NO chip row, behaves exactly as before
- [ ] ⚠ 8th ship in this batch (2 past the 6-cap) — owner continued the stack 2026-07-08

## v1.14.210 — LOGO-HOME (single-tap wordmark → Command) · rollback: git revert
- [ ] Single-tap the PHANTOM wordmark from a rack detail → lands on Command Center
- [ ] 5 rapid taps still triggers BOOT REPLAY (toast + reload) — dev hatch intact
- [ ] Focus a checklist note field, type text, single-tap logo → confirm() prompt; cancel keeps you on the rack
- [ ] No double navigation from a 5-tap burst (home timer cleared in the ≥5 branch)
- [ ] Already on Command → single tap does nothing (no flicker/re-render)
- [ ] `?legacy=1`: single tap does NOT jump home (unchanged), but 5-tap replay still works
- [ ] 9th ship in this batch — owner continued the stack 2026-07-08

<!-- AUTO-VERIFY 2026-07-08 (Claude Code, desktop Chrome automation + Node logic tests): .208 + .209
     FUNCTIONAL items ALL PASS — checklist toggle-without-collapse holds; note persists; site-scope
     works; .209 long-press logs EXACTLY ONCE (RACK_NOTE before 0 / after 1); both ?legacy=1 = no
     .pcl/.pql markup; no console errors; 24/24 resolver logic assertions pass. CAVEAT: user's Chrome
     had no deployment data → ran against SYNTHETIC data via overridden read-loaders (feature code NOT
     patched); organic master-seeded path not exercised in-browser. .202-.207 = visual/CSS, device-only.
     STILL OWED BY OWNER: on-device pass for haptics, iOS visual/aesthetic, PWA — none automatable. -->
## v1.14.211 — FLOOR MAP ACTIVE STRIP (auto-derived mid-flight row) · rollback: git revert
- [ ] Open a Deploy with ≥1 in-progress or blocked rack → ACTIVE strip appears ABOVE the grid, correct count
- [ ] Header reads `ACTIVE · N RACK(S)` cyan; `· M BLOCKED` appended in red when any blocked
- [ ] Strip order = BLOCKED first, then active
- [ ] A mid-flight rack shows in BOTH the strip AND its grid row (not deduped) — intended
- [ ] Tap a strip tile → opens that rack's detail
- [ ] Strip tiles look pixel-identical to grid tiles (shared `deploy_floorTileHtml`)
- [ ] Deploy with only complete/pending racks → NO strip (grid only)
- [ ] 8+ mid-flight → strip scrolls horizontally, scrollbar hidden, right-edge mask-fade
- [ ] `?legacy=1`: floor map shows NO strip; grid identical to before
- [ ] ⚠ 10th ship in this batch — well past the 6-cap; owner continued the stack 2026-07-08

## v1.14.212 — RECONCILE web-Claude .204 superset (B1 root fix + last-row clip + back-btn chip) · rollback: git revert
- [ ] Work › Deploy › STAGE SCOPE: tap cab rows → selection count increments (bar no longer eats taps); STAGE SCOPE SNAPSHOT enables
- [ ] Scroll to last cab row (e.g. dh6:050) → fully visible above the nav, not clipped (short viewport)
- [ ] Sticky action bar still pins directly above the bottom nav
- [ ] Every BACK button (Work tool, Crash Cart drill-in, Platforms drill-in) → smaller 34px rounded chip, slate chevron
- [ ] Press-and-hold a BACK button → chevron + chip border light cyan
- [ ] BACK still navigates correctly; 56px tap area still catches gloved taps
- [ ] `?legacy=1`: no functional regressions
- [ ] ⚠ 11th ship in this batch — owner-directed reconcile, stack continued 2026-07-08

## v1.14.213 — BOOT PLATE SWAP (portrait hero 1024→2048 + SW bump) · rollback: git revert
- [ ] Hard-refresh / remove+re-add the PWA (URL cache-bust does NOT bypass a registered SW — let the new SW activate)
- [ ] App version reads `v1.14.213` after the SW updates
- [ ] Boot hero is visibly CRISPER on iPhone (portrait)
- [ ] If it looks unchanged → the SW cache-key bump didn't take (check this first)
- [ ] Landscape/iPad boot still fine (plate-wide.webp untouched)
- [ ] First ship of a new batch (prior .202-.212 released 2026-07-08)

## v1.14.214 — FIX deploy scope-picker cab taps eaten (STAGE never enables) · rollback: git revert
- [ ] WORK › Deploy › NEW / SCOPE A JOB (Master loaded) → tap cab rows → selection counter climbs
- [ ] STAGE SCOPE SNAPSHOT button ENABLES once ≥1 cab selected
- [ ] Action bar sits just ABOVE the bottom nav — NOT floating over the cab list
- [ ] Scroll the cab list → last cab clears the bar (not clipped)
- [ ] Works on PHONE and LAPTOP (the reported-broken surface)
- [ ] `?legacy=1`: scope picker unaffected
- [ ] Root cause: .212 padding bump floated the sticky bar over the list; reverted. transform:none (irrelevant to sticky) deleted.

## v1.14.215 — CRASH-LOG HARDENING (copy-out + version stamp + real auto-clear) · rollback: git revert
- [ ] Force a `window.onerror` on device → orange crash banner appears
- [ ] Tap banner → toast/haptic fires; alert header shows `v1.14.215`; each entry line shows ` · v1.14.215`
- [ ] Paste clipboard into Notes/Messages → FULL log landed (not just the 1400-char preview), with header + stamps
- [ ] Stale-clear: `.215` entries survive a reboot (same version kept); (opt) hand-edit an entry `.v` to a fake older version → dropped on reload, `.215` stays
- [ ] iOS clipboard-deny path: if no "Copied" toast, alert still shows the trace to screenshot (no dead-end)
- [ ] If banner/version reads unchanged → SW cache-key bump didn't take (check first)
- [ ] First ship of a new batch (prior .213-.214 released 2026-07-09)

## ⏸ DORMANCY GAP — .216 → .329 not tracked here
- This file went dormant after .215 (2026-07-09). Ships **.216 → .329** were verified out-of-band (owner device passes + per-ship `version.json` notes + git log), NOT via this file. Absence of a block below does NOT mean a ship was unverified. Re-activated .330 on owner directive (2026-07-21). Source of truth for that gap = `version.json` history + memory `project_repo_sync_v1133.md`.

## v1.14.330 — INSPECT-3D landing: first Master rack live in the Command hero · rollback: `git revert 76375fb`
- [ ] Hard-refresh / clear SW cache first → version chip reads **v1.14.330**+ (else cached). Not in legacy (`?redesign=1` once if nav shows word-tabs — feature is redesign-only).
- [ ] **Load a real Master** → HOME (Command) auto-lands with the **first rack live in 3D** at the top, above the status pills / NEXT BEST ACTION; caption reads `RACK · <id>`.
- [ ] It's **live 3D on the phone** (pan/orbit responds) — not a flat image. Rack shown is a real rack from your loaded file (active-deployment lead rack, else first in Master).
- [ ] Leave HOME → BUILD/TOOLS → back to HOME: rack **re-appears** cleanly (no blank, no doubled scene). Phone shouldn't warm from a background render (teardown-on-leave).
- [ ] **Before any Master loaded** (fresh install): HOME looks **exactly like .329** — no rack slot, nothing shifted. Hero only appears once a Master is in.
- [ ] `?legacy=1` → old 5-tab app totally unaffected (no rack hero anywhere). No new console errors on load / entering HOME.
- [ ] If blank/wrong: report (a) caption present but no 3D, or (b) nothing at all, and (c) whether WebGL works elsewhere in the app.

## v1.14.331 — fold the 2 rd-review nits on the INSPECT-3D hero (polish) · rollback: `git revert f59c288`
- [ ] Folds into the .330 check — the hero should look **the same**: cyan frame / glow / caption on the rack landing (token swap is a negligible within-hue shift, corrected to the page's true `--cyan` #5cf2ff).
- [ ] No behavior change: rack still lands / tears down / re-mounts exactly as .330.
- [ ] (Diagnostic-only) if a D1 rack-resolution anomaly ever occurs it now logs to SYS › ERRORS instead of being swallowed — nothing to see unless it fires.
- [ ] Both P3 gate agents (`phantom-ship-gate` + `phantom-rd-reviewer`) returned PASS on f59c288 pre-push.

<!-- append new ships above this line; checkpoint when 6 deep or before HIGH-risk -->

---

## ⚠ FILE DRIFT NOTE (appended 2026-07-23)
Maintained through `.215`, then drifted. `.216–.339` verify status = git log + INTEGRATION-STATE, not here. Resuming batch tracking at `.340`.

## CURRENT BATCH TO RUN — `.340–.344` (5 ships stacked, unverified)
**Prep:** unregister SW + delete caches, reload, confirm top-right build badge = `v1.14.344` (hard-refresh alone will NOT bypass the SW). `?legacy=1` must stay pixel-identical throughout.

### v1.14.340 — device fix (OPEN BAY clip + back-to-Home, ghost, nav clearance) (`b02fec8`) · rollback: revert commit
- [ ] OPEN BAY: bay art not clipped at the edge
- [ ] Back from OPEN BAY returns cleanly to Home
- [ ] Assistant ghost present; content clears the bottom nav

### v1.14.341 — global nav clearance + ghost co-star (`24111f4`) · rollback: revert commit
- [ ] Scroll every page to the bottom — nothing hides behind the nav strip (`--rd-navclear`)
- [ ] Assistant ghost sits as co-star, not cropped

### v1.14.342 — device fix #3 (hero=bay truth, land-3D, nav-icon baseline, pills) (`f3bb9af`) · rollback: revert commit
- [ ] Hero rack shows the SAME rack as an OPEN BAY (one truth)
- [ ] Landing 3D intact · nav icons on baseline · pills sized right

### v1.14.343 — Home card-surface unification (`bbe0554`) · rollback: revert commit
- [ ] Every Home card = the same near-black as the 98 RACKS stat tile (assistant/quick-tools/suggestions/rackline no longer blue)
- [ ] Zero visual pop between cards

### v1.14.344 — assistant-card tap→openVaSheet (`d72e1c8`) · rollback: revert commit
- [ ] Home: tap AI ASSISTANT card ANYWHERE → Phantom assistant sheet opens
- [ ] `CHAT →` chip visible bottom-right of the card · sheet's own close returns to Home
- [ ] Desktop: card tap AND the CHAT WITH PHANTOM button both open the same sheet

**On release:** owner marks this batch RELEASED → clears the CALL-0 HIGH-risk gate for MASTER FULL-INGEST Phase 2.

### v1.14.345 — GHOST IS THE DOOR: assistant doors land on intent menu (`5a5dada`) · rollback: revert commit
**⚠ SUPERSEDES the .344 "tap card → sheet opens" item above — that door opened BLANK (bare openVaSheet()). .345 fixes it.**
- [ ] Tap AI ASSISTANT card (and desktop CHAT WITH PHANTOM) → the FOUR-DOOR intent menu opens EVERY time (SPEAK / PASTE TICKET / TYPE OR PASTE / IMPORT FILE), never blank
- [ ] CHAT chip → same menu · sheet's own close returns to Home
- [ ] SPEAK is the ONLY control that starts the mic (no surprise mic on any other tap)
- [ ] `?legacy=1` pixel-identical

**Batch is now `.340–.345` = 6 ships → at the CALL-0 count cap. Verify + release before the next ship.**

---
## ✅ BATCH `.340–.345` — RELEASED by owner 2026-07-23 ("340-345 good")
All 6 ships device-verified on iPhone. CALL-0 6-ship count cap **cleared** + the MASTER FULL-INGEST HIGH-risk prereq **cleared**. Next ship opens a new batch.

---

# ▶ OPEN BATCH — starts at `.346` (count 1 of 6)

## v1.14.346 — MASTER FULL-INGEST Phase 2: SITE-VARS (`38bb94a`) · rollback: revert commit
**HIGH-risk surface:** sacred parse path + a user-data write. Both gates PASS; 25/25 offline
assertions against `test/MASTER-US-CENTRAL-AUS03-TEST.xlsx` executing the shipped bytes.
**Clear the SW cache first, then load the AUS03 test Master.**

- [ ] Load the test Master → SITE PROFILE sheet shows a violet **FROM MASTER · SITE-VARS (18)** block, all 18 rows readable, nothing running off the right edge at phone width
- [ ] FACILITY ID / RACK NAMING / PDU TYPE / STANDARD OPTICS fill themselves **only if they were blank**
- [ ] Type your own value over PDU TYPE → save → load the Master again → **your value is still there** (merge, never overwrite)
- [ ] A Master with no SITE-VARS sheet still ingests normally; the FROM MASTER block simply does not render
- [ ] Console after a load: `stats.sheetsParsed` includes `SITE-VARS`, and it is gone from `sheetsSkipped`
- [ ] Force-quit and cold-start the app → the FROM MASTER block is still populated (siteVars survives the restore)
- [ ] `?legacy=1` → site profile editor and first-run gate look exactly as before

**Known deviation to rule on:** spec asked for a read-only setup screen (name-only editable).
Fields are pre-filled + provenance-tagged but left EDITABLE — a locked field with no override
strands you on a wrong Master. One-line change to lock if you want it locked.

**Separate pre-existing bug found, NOT fixed here (owns its own ship):** saving the SITE PROFILE
editor drops `operator` — your name is wiped from sign-offs and the editor has no field to put it
back. It also drops the new `sources` map, which makes Master-filled fields permanently
hand-entered after any editor save (fail-safe, never a clobber).

## v1.14.347 — OPERATOR WIPE fix: site-profile save destroyed your name (`09d142b`) · rollback: revert commit
**HIGH-risk surface:** user-data write path. Both gates PASS; 9/9 offline assertions on the shipped
save path, .346 suite still green. **This is a live bug that has been eating names — verify it first.**

- [ ] SITE PROFILE sheet → a **YOUR NAME** field now sits at the top, showing your operator name (blank if a past save already ate it — type it back in)
- [ ] Change PDU TYPE → SAVE PROFILE → reopen the sheet → **your name is still there** (before .347 it vanished silently)
- [ ] Clear the YOUR NAME box → SAVE → reopen → your name is **unchanged** (blank = no change, never an erase)
- [ ] Load the AUS03 Master again → the PDU TYPE you typed **survives**; fields you never touched still refresh from the Master
- [ ] Your name still appears on a sign-off / handoff after a profile save
- [ ] `?legacy=1` → profile editor looks exactly as before (no YOUR NAME field there — it is redesign-only)

**Note:** names already lost to a pre-.347 save are gone — localStorage was overwritten. The new
field is how you put yours back.

**Batch `.346–.347` = 2 of 6.**

## v1.14.348 — ASSIGN RACK destroyed other deployments' racks (`9d9b371`) · rollback: revert commit
**HIGH-risk surface:** deployment record storage. Both gates PASS; 10/10 offline assertions.
**Needs TWO deployments with racks to verify — with one deployment the bug was invisible.**

- [ ] Deployment A → open a rack → ASSIGN to a tech → then open deployment B: **all of B's racks are still there**, with their slots and phase state (pre-.348 they were silently deleted)
- [ ] The assignment itself still lands, and shows on the rack in A
- [ ] Unassign (blank name) still clears it, and still destroys nothing
- [ ] Single-deployment device: assign works exactly as before
- [ ] Phases/optics for B still line up with B's racks (nothing orphaned)

**Note:** racks already destroyed by this bug are gone — the key was overwritten. This stops the bleeding.

**Batch `.346–.348` = 3 of 6.**

## v1.14.349 — saver rename cleanup, all four now `deploy_saveAll*` (`b8a54fe`) · rollback: revert commit
**LOW risk — pure mechanical rename, zero behavior change**, proven: 15 sites, occurrence-count parity,
zero residue, and after excluding renamed identifiers the only changed lines are the version stamps.
Both gates PASS; all three prior suites re-run green. **Regression sweep only, no new feature to check.**

- [ ] Open a deployment → advance a phase → it sticks after closing and reopening
- [ ] Block a phase, add a blocker note → note persists
- [ ] Tick a phase-checklist item and add an item note → both persist
- [ ] Dispense / install an optic → counts persist and the ledger still adds up
- [ ] Audit trail still records each of the above
- [ ] Nothing visual changed anywhere

**Batch `.346–.349` = 4 of 6.**

## v1.14.350 — loader arity split, .347/.348 bug class made unrepresentable (`1734dc9`) · rollback: revert commit
**Larger diff (158/111) but no new feature — it splits each deployment loader into a scoped door and an
all door so a scoped read can never silently become a whole-store write.** Both gates PASS; new .350 suite
(20 assertions) + all prior suites green. Falsy-id branch is a dormant tripwire, unreachable through the app
today (rd-review traced every entry point to a guard). **Regression sweep — confirm nothing leaks between
deployments or vanishes.**

- [ ] TWO deployments loaded: open each and confirm its racks / phases / optics / audit are ITS OWN and complete
- [ ] Advance a phase, block one with a note, tick a checklist item, add a checklist item, dispense an optic, assign a rack — each in deployment A
- [ ] Reopen deployment B: everything still present and correct, nothing leaked in from A, nothing vanished
- [ ] Audit log for each deployment shows only its own events
- [ ] Nothing visual changed anywhere

**Batch `.346–.350` = 5 of 6. Next ship hits the CALL-0 count cap — verify + release this batch before or at .351.**

---
## ✅ BATCH `.346–.350` — CLEARED by owner 2026-07-24 ("all good moving on")
All 5 ships cleared in one call. CALL-0 count cap **reset** — the next ship opens a new batch at 1 of 6.

**Recorded honestly:** the owner cleared the batch in chat rather than checking the boxes above
item-by-item. The `.348` / `.350` two-deployment cross-contamination checks in particular were
**not reported back individually**. Both ships carry offline proof (10/10 and 20/20 assertions on
the shipped bytes, both gates PASS) and both are independently revertible by their own commit, so
this is a low-exposure clear — but if racks or phase state ever look wrong across two deployments,
**start here**: `git revert 9d9b371` (.348 data fix) and `git revert 1734dc9` (.350 split) are
independent of each other.

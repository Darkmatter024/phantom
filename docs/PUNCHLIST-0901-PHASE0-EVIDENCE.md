# BATCH 3 — PUNCHLIST-0901 REMAINDER · PHASE 0 EVIDENCE

> **Provenance:** Phase 0 recon, 2026-09-08, read-only, against main @ 30f3822 (.582). Written by a fork agent under SHIP-HANDOFF-CLOSEOUT-BATCH.md section 3; spot-checked by the parent session (ops_init wired at :19274, master_purgeCached :35009 confirms without PIN, the four forge.html model strings, the .569 pin at :18346, zero baseline survivals). Nothing here is authorised; each ship needs its own GO (C-5). The Purge-without-PIN finding is a destructive-path item and is escalated, not acted on (handoff section 5).


**Written:** 2026-09-08 · **Baseline:** `main` at `v1.14.582` (`30f3822`) · **Method:** direct grep + sed against the working tree. Read-only; nothing edited, staged, or committed. Every `:NNNNN` below is against `.582` bytes and goes stale on the next ship (F-4b).

**Governing rule (IA-SHIFTNAV v2 §0):** the rack is the unit of work; a ship that opens a door closes at least one; two paths to one fact is a defect.

---

## Status carried in from the annex (not re-litigated)

| Item | Status at `.582` |
|---|---|
| P-1 / P-11 assistant API 400 | CLOSED, owner-verified 2026-09-02 |
| P-2 fake baseline | CLOSED at `.570` — **re-verified below, item 1** |
| P-3 S-14 zero-reference | needs owner amendment; not a code item today |
| P-4 above-the-fold | CLOSED `.566` |
| P-5 restart/imports | CLOSED |
| P-8 BOM-path preview | annex says *"closes in FIRST-DOOR Ship A"* — **Ship A is complete (`.572`–`.578`) and the card is still there. See item 4.** |
| P-9 Build consolidation | assigned to IA-SHIFTNAV Phase 1 (Batch 4), not this batch |
| P-10 Forge focus = full rack state | IA-SHIFTNAV Phase 1, not this batch |

---

## 1 · `.570` baseline replacement — HELD ✅

| Check | Result |
|---|---|
| `typical:` in rendered strings | **0** in `dct-ios.html` and `forge.html`. Only survivals are the `.570` comment block (`:27730`) quoting the old text. |
| `PHASE_BASELINE_MINS` | **0** — renamed to `PHASE_STALL_TRIGGER_MINS` (`:27740`), read once at `:27759` |
| `deploy_checkPhaseAnomaly` return shape | `return { elapsedMins: elapsedMins };` (`:27768`) — the trigger value does not leave the function |
| Render site | `:56266` — `anomaly.elapsedMins + ' min on ' + … + ' · no baseline yet. Unlogged blocker?'` |
| `forge.html` | no baseline/typical strings of any kind |

**Verdict:** held, nothing to ship. Ruling (b) (compute from history) stays parked on the start↔complete pairing question.

---

## 2 · Master management needs one door (P-6)

### What exists today — every path to LOAD / REPLACE

| # | Surface | Control | Line | Calls |
|---|---|---|---|---|
| a | Command S0 (no Master) | `#cc-ingest-zone` **LOAD MASTER** | `:14009` | `cmd_loadMaster()` |
| b | Command hero CTA (A-S1, no Master) | **LOAD MASTER** | `:23850` (via `cmd_nba` `:23928`) | `cmd_loadMaster()` |
| c | Command Master-age chip | `#cc-agechip` *"tap to re-ingest or swap"* | `:13938` | `cmd_loadMaster()` |
| d | Desktop nav ≥1024 | `#cs-nav-mst` **LOAD MASTER** | `:16567` | `cmd_loadMaster()` |
| e | Build zero state | `.bw-cta` **LOAD MASTER** | `:22189` | `cmd_loadMaster()` |
| f | Master-scope sheet (mscope) | **OPEN MASTER FILE →** | `:36013` | `rd_openMasterFile()` → `showPage('master')` + `master_showSection('file')` (`:21580`) |
| g | Master-scope sheet | **LOAD MASTER** | `:36015` | `mscope_loadMaster()` (`:35971`) → `master_loadFromPicker({})` |
| h | Master-scope sheet | **RE-LOAD** | `:36053` | `mscope_loadMaster()` |
| i | Legacy `#pg-master` page | **LOAD MASTER FILE** | `:36577` | `master_loadFile()` (`:36467`) |

Nine tappable entrances, three call chains (`cmd_loadMaster` → `master_loadFile`; `mscope_loadMaster`; `rd_openMasterFile` → page). All converge on `master_loadFromPicker` — the *loader* is one engine (Contract A2 holds); the *doors* are nine.

### Every path to DELETE / EVICT

| # | Surface | Control | Line | Gate |
|---|---|---|---|---|
| j | `#pg-master` loaded banner (rd only) | **Purge cache** | `:37238-37241` → `master_purgeCached()` `:35009` | ⚠ **Two destructive confirms, NO PIN.** `deviceLead_requireForMaster` is not called on this path. |
| k | Replace-on-load (preCommit hook) | inside `master_loadFile` / `master_loadFromPicker` | `:37548-37568` | ✅ `deviceLead_requireForMaster()` when a PIN is set, else destructive confirm |
| l | Console only | `window.phantom_clearMaster` | `:35001` | none (not UI) |

`PHANTOM_MASTER.clear()` (`:34718`) is the one writer: nulls `_lastPhantomMaster`, clears `PHANTOM_MASTER_STORE`, fires cache invalidators. **It does not touch deployments** — see item 7.

### The SYS menu today

`SYS` top-right = `#hdr-agg-panel` (`hdr_aggToggle`) with rows NETWORK · API · SERVICE WORKER · STORAGE · **DIAGNOSTICS** (`:13570-13594`) and rd-gated actions BACKUP · RESTORE · SET IDENTITY (`:13598-13600`, `body.rd .hdr-agg-act{display:flex}` `:10087`) plus a profile row (`:9147`). A second legacy overflow menu `#hdr-overflow-menu` (`:13541-13550`: BACKUP · RESTORE · SET IDENTITY · HW REF · SITE PROFILE) is behind `#hdr-ghost-btn`. **There is no MASTER row in either.**

### Assessment

- **Cold Aisle:** the ruling's own words — *"finding it should not be."* Nine load doors and one buried purge on a legacy page fail it.
- **Blast radius:** MEDIUM. Adding a SYS → MASTER row is additive (one row, one sheet reusing `master_renderLoaded`'s name/date/source + `master_purgeCached` + `cmd_loadMaster`). **Removing the nine doors is the risky half:** (a), (b), (e) are the ruled zero-state CTAs from FIRST-DOOR A-S1 / `.410` and must stay (a no-Master screen with no LOAD MASTER is a dead end); (d) is the desktop path the 2026-09-01 ruling protects; (f)/(g)/(h) live in the mscope sheet which is the SELECT RACKS door; (i) is legacy.
- **Finding to escalate, not act on:** Purge (j) skips the PIN gate the ruling calls *"correct"*. P-6's verify script (*"Delete prompts PIN"*) will FAIL against current code unless the SYS→MASTER delete routes through `deviceLead_requireForMaster()`.

### Proposed minimal ship (two slices)

- **6a (additive):** SYS → MASTER row → sheet: filename · saved date · source (uploaded / restored-from-cache, already computed at `:37220-37236`) · **Load / Replace** (→ `cmd_loadMaster`) · **Delete (PIN)** (→ `deviceLead_requireForMaster()` then `master_purgeCached()`). Door ledger +1.
- **6b (subtractive, needs per-door ruling):** close (c) age-chip re-ingest, (f) OPEN MASTER FILE, (h) RE-LOAD, (i) legacy page CTA once `?legacy` retires. Keep (a)(b)(e) as zero-state CTAs (they are the *first move*, §1) and (d) desktop. Honest net after 6b: **+1 −4 = −3**, not −N.

---

## 3 · Cage-nut reference screen (P-7) — TWO candidates, the owner's quote matches the second

### Candidate A — the COMPASS (Reference → Hardware → Cage Nut)

- **Doors:** `pg-ref` COMPASS card `:14226` → `ref_openCompass()` `:19472`; Hardware subtab `#stab-pw-compass` `:15195`; `goCompass()` `:57357` has **zero callers** (dead).
- **Screen:** `#pw-compass` `:15722-16177` (~455 lines of authored markup since `.551`).
- **Renderer:** `compass_render()` `:57285`, state key `phantom_compass_last`.
- ⛔ **Shared organs inside the compass block — cannot delete wholesale:** `eia_holesForSpan()` `:57204` is the *one source of truth* for hole positions, consumed by the 3D rail dots (`:40686`), the flat U-map rail (`:41364`) and the compass itself (`:57323`). The `cn-*` CSS (`:6374`+, 49 refs) is reused by the Master elevation rail (`:37118` *"reuses the Cage Nut Compass cn-* visual"*) and the Rack Map floor (`:49453`).
- **Blast radius: HIGH** if removed as a block. LOW if only the card + subtab + `#pw-compass` markup + `compass_*` functions go and `eia_holesForSpan` + `cn-*` CSS stay.

### Candidate B — the Rack Map tool's generic floor ⭐ matches P-7's evidence verbatim

`rackViewer_renderFloor` `:49453-49482`: `var U = 24; // reference height — generic rail, not a real rack` → renders `REFERENCE · CAGE NUT &amp; RU MAP` + `Scan or type a rack ID to load a live elevation.` — the owner's quote is this string, and "Build → Reference" is the tech reading that header. Reached via Build → OPS row → RACK MAP (`OPS_TABS.rackmap` `:25069` → `:25132`), plus the Command racks stat (`:23528`), the deployment list button (`:32790`), the unknown-rack fallback (`:24314`) and search (`:24809`) — `rd_openOpsTool('rackmap'` has **6** literal call sites, the most of any tool.

- **Assessment:** this is the *fourth rack picture* and it draws a rack that does not exist. Contract B10. The platform-template floor (`_rackViewer_templateFloorHtml` `:49432`) is the same class one step less fake ("Skeleton geometry").
- **Blast radius: LOW.** One function, one call site; the RACK MAP door itself stays (E-8 ruling keeps it rack-addressed and seedable with the current rack).
- **Proposed:** replace both floors with an honest zero state — text only, no rail — *"No rack loaded. Scan or type a rack ID."* Door ledger: −1 picture, 0 paths. ⚠ **Deviates from P-7's literal "delete the screen, its entry path, and its renderer"** because the screen is the RACK MAP tool and E-8 kept it. Owner to confirm which candidate P-7 means before build; recommend B first, A as its own ship (keep-or-close ruling) since A has real cage-nut math the rack detail may want per P-10.

---

## 4 · Duplicate rack preview on the BOM path (P-8) — STILL OPEN, annex is stale

- `rd_openOpsTool(tab)` `:32721`: calls `showMode('work')` → `bw_render()` (`:19259`) which builds `.bw-card.bw-prev` (`:22296`) and calls `bw_mount3D` (`:22340`), **then** adds `body.ops-detail`, removes `wk-grid`, and renders the tool into `#wk-deploy`.
- DOM order in `#pg-work`: `#bw-shell` `:14054` **above** `#work-grid` `:14059` **above** `#wk-deploy` `:14105`.
- CSS: `body.rd #pg-work #bw-shell { display:block }` `:59007` — **no `ops-detail` override exists** (`:8700` only hides `#work-back`). So on the BOM path the tech scrolls past hero + RACK PREVIEW card + NEXT ACTION + OPS row + PASTE to reach the BOM.
- The 3D inside the card **defers** (`bw_mount3D` rack-detail guard `:22757` fires because `ops-detail` is set by the time `draw()` runs — the `.582` `DEFERRED_DETAIL_OWNS_SCREEN` trace will name this on device) — which is exactly the "~600px empty RACK PREVIEW card" the owner saw. Contract A6 is *not* violated (no second context); the *card* is duplicated, not the engine.
- The OPS drop-down P-8 mentions is `ops_init`'s row (`:21891`), rendered on the same shell.

**Minimal change:** one CSS rule `body.rd.ops-detail #pg-work #bw-shell { display:none }` — hides the whole Build shell whenever a tool owns the screen. ⚠ FIRST-DOOR §6 is *remove, do not hide* — but the shell is the legitimate Build landing and must exist for `showMode('work')`; hiding it *only while a tool is open* is presentation gating, not a hidden door. **Blast radius: LOW-MED** — every tool path (all 20 `rd_openOpsTool` sites) and Back (`wk_showGrid();…remove('ops-detail')`) pass through this state; verify Back restores the shell, and that `bw_mount3D`'s deferred re-arm on return still draws (the `.582` ring will show `AWAITING_LAYOUT`/`MOUNT_LIVE`). Alternative (right path): don't call `bw_render` on the tool path at all — larger change to `showMode`, touches every Build entry. Recommend the CSS gate, device-verified.

Door ledger: −1 card (on the tool path), −1 dup OPEN AISLE, −1 OPS row on the tool path. Matches P-8's stated −3.

---

## 5 · Boot has three curtains — measured: what actually stacks at launch

| # | Layer | Node | Shown by | Hidden by |
|---|---|---|---|---|
| 1 | Splash / TAP TO ENTER | `#boot` `:13390` + `#pe-tapcatch` `:13399` | markup, always | `launch()` `:18787` → `.collapsing` → `display:none` after 480 ms (60 ms fast) |
| 2 | Blowout flash | `#pe-flash` `:13234` | `fire()` `:13449` at +520 ms | `peExpose` 50 ms, snapped off in `launch()` |
| 3 | First-run gate | `#fr-overlay` `:13384` via `firstRun_show()` `:28157` | `launch()` `:18818` when `!siteProfile_isConfirmed()` | `firstRun_confirm()` |
| 4 | Resume banner | `#phantom-resume-banner` `:19080` | `_session_bootRestore` — **legacy only**, returns early under `redesign_isOn()` `:19067` | 8 s auto / START FRESH |
| 5 | Version-check reload | `:12867-12877` `fetch version.json` → `location.reload(true)` if stale, and a second SW self-heal reload `:12884-12895` | every boot with network | — |

**Reading:** on a confirmed device the three things a tech waits through are **(1) splash → tap, (2) the reload loop when a new version is served — which replays the splash, (3) `.571`'s Command→picker landing** (a curtain-like flash is what `.571` fixed by branching). On a fresh device, (3) is the first-run gate. The freeze curtain `#rd-freeze-curtain` `:10028` is **not** a boot layer — `rd_freezeBootRestore` `:19204` restores the *mode*, not the curtain.

**Assessment:** collapsing to one means: keep `#boot` + tap (it is the GPU warm-up / user-gesture gate iOS needs for audio/haptics/WebGL), fold the first-run form INTO the splash (one screen: profile fields + ENTER), and make the stale-version reload happen *before* the splash paints (or show one "updating" line on the splash instead of a double splash). ⚠ `#boot` CSS exists in **four** blocks (`:418`, `:714`, `:11834`, `:12021`) — 2026-era layering; touching it is a 60k-line-file CSS cascade job. **Blast radius: MED-HIGH** (boot path, SW update path, first-run data write). ⛔ Not a one-visible-change ship; needs a Phase 0 of its own with the actual device boot timeline recorded (which of 1–5 the owner is counting). **Park for ruling** — do not guess which three.

---

## 6 · ISOLATE tap depth — measured from a cold open

Cold open → tap splash (1) → lands on **rack picker** (`.571`, Master + active deployment) or **Command** (else) → dock **BUILD** (2) → **OPS** control, collapsed at boot by design (3, `48-ops-row-exists:136`) → **ISOLATE** panel (4) → tool opens on its session list; **NEW SESSION** (5). No confirm step anywhere.

- ISOLATE is the tenth `OPS_PANELS_CONFIG` entry `:21702`; row rendered by `ops_renderPanels` `:21721`; `ops_init` `:21891` **is wired** — `showMode` calls it `:19274-19276` (the annex's "ops_init is disabled" is stale since `.558`; what's true is the row *boots collapsed*).
- **From the rack detail (`deploy_showRackDetail` `:41866`): ZERO ISOLATE doors.** The only tool-ish controls in its 900 lines are four OPEN AISLE / `forge3d_open` sites. §3 hard requirement — *"ISOLATE reachable in ≤2 taps from the rack, never from a laundry row, always with a confirm"* — fails on all three clauses.
- E-8 ruling: ISOLATE is the **one** tool that is already rack-keyed (`rackId` per session), so re-homing it costs no data change.

**Proposed:** add one full-width red **ISOLATE** action on the rack detail (deliberate affordance + confirm sheet) seeded with the current rack, opening the existing `iso_render` host. Door ledger +1 on the rack; the OPS-row tile then becomes the second path to one fact → close it in the same ship (−1). **Blast radius: LOW-MED** (one new button in a 900-line renderer that already lays out OPEN AISLE; the ISOLATE engine is untouched). ⚠ Needs the owner's Phase-1 ruling on the ten-tool group (handoff §4) — this is the first tool re-home and sets the pattern; recommend it as the pilot.

---

## 7 · Empty CTAs on no-Master jobs — the `!master && dep` branch

`bw_ctx` `:21615` sets `master` from `master_hasMaster()` and `dep` from `nowtab_resolveDep()` **independently**; deployments live in their own store and `PHANTOM_MASTER.clear()` `:34718` does not touch them. So after a Purge/Delete the state `master=false, dep≠null` is normal — and `bw_render`'s guard is `if (!c.master && !c.dep)` `:22184`: **both** must be missing to reach the honest zero state. With a deployment present it falls through to:

| Rendered CTA | Line | What it does with no Master |
|---|---|---|
| **Open deployment** / **Start a deployment** | `:22206` | `cmd_route('work','deploy')` → deployment detail, racks from the deploy store (works, but every Master-sourced cell reads `—`/`NO MASTER`) |
| **Continue** / **Open blocked rack** | `:22261` | `deploy_showRackDetail` — renders; cable panel returns early `:40492` *"no Master → honest empty state"*, elevation resolve fails the same way |
| **Open aisle** | `:22300` | `forge3d_open()` `:19795` — no Master guard in its first 45 lines; aisle draws from deploy racks or nothing |
| RACK MAP tile stat | `:22972` | shows `NO MASTER` label but the tile still opens the tool → generic floor (item 3B) |
| Command hero | `:23791` | correct — `!masterLoaded` → LOAD MASTER only (A-S1) |
| `.571` landing | `:19361` block | **no Master check** in its three guards → boots straight to the picker of a Master-less deployment |

**Assessment:** Contract 14 is met in letter (the controls do things) but the tech is led into a rack whose every Master-derived surface is blank — a job that reads *"Platform not in Master"* (`:22224`) and empties. This is the P-6 verify criterion *"honest no-Master state with no fake CTAs"*.

**Proposed minimal change:** in `bw_render`, a new branch **before** the queue branch: `if (!c.master && c.dep)` → a card: *"Master missing for <site>. This deployment's racks come from the Master; load it to continue."* + **LOAD MASTER** + a ghost **Open deployment** (so a tech who only needs the phase checklist is not blocked). Data path untouched. **Blast radius: LOW** (one routing branch; the `.571` landing should add the same `master_hasMaster()` guard to fall back to Command — that is a second, one-line ship). ⚠ Whether Command's `.571` landing should still fire without a Master is an owner call — park the landing half.

---

## 8 · Doorway count — ledger state and recount at `.582`

- **Last recorded (FIRST-DOOR spec, served `.570`):** *68 distinct uppercase button labels · 6 top-level page ids · 4-slot dock.* Ship A's ledger closed the first screen from ~9 competing cards to 1 headline + 1 action (rows `.572`–`.578` in CURRENT STATE). Phase 1 proposal ledger (`docs/IA-SHIFTNAV-V2-PHASE1-PROPOSAL.md:209`) is a path table, not a number.
- **Recount at `.582` (same class of grep, exact method of the 68 not recorded, so treat as a new baseline, not a delta):**

| Metric | `.582` |
|---|---|
| Distinct uppercase `<button>` labels in markup (tags stripped) | **96** |
| Top-level `.page` ids | **5** — `pg-cmd pg-master pg-ref pg-sop pg-work` (`page-search` gone) |
| Dock slots | **3 + EXIT** — Command · Build · Tools · Hold-to-exit (`:16591`) |
| `rd_openOpsTool('…'` literal call sites | **20** (rackmap 6, portmap 3, optics 3, bom 2, seven tools ×1) |
| Master LOAD entrances (item 2) | **9** |
| Master DELETE entrances | **1** UI (+1 console) |

⚠ The 96 vs 68 is **not evidence of growth** — JS-built labels (`bw-cta`, `pt-btn` strings) are counted differently by the two methods. Recommend the ledger be re-based on the two countable, unambiguous metrics: tool-door call sites (20) and Master entrances (9), both of which every Batch 3 ship can move.

---

## 9 · `forge.html` P-12 — four deprecated model strings

| Line | Context | Call |
|---|---|---|
| `:4571` | `model: 'claude-sonnet-4-20250514'` | briefing, `max_tokens: 150` |
| `:4772` | same | terminal conv, `max_tokens: 300` |
| `:6286` | same | triage line, `max_tokens: 80`, stream |
| `:9143` | same | AI stream, `max_tokens: 1000`, stream |

All four POST to the same Worker (`phantom-api.wfj6t2fk7w.workers.dev`) with `Content-Type` as the only header (FORGE-WORKER-CUTOVER Ship 1). `forge.html` has **no** `PHANTOM_MODEL` constant; `dct-ios.html` pins `PHANTOM_MODEL = 'claude-sonnet-4-5-20250929'` (`:18346`, `.569`, owner live-checked 2026-09-02).

**Status of the IDs (claude-api skill, `shared/models.md`):** `claude-sonnet-4-20250514` = **Deprecated, retirement TBD** (same class as P-11 — will 400 on retirement). `claude-sonnet-4-5-20250929` = **Active**.

**Replacement:** one hoisted constant at the top of `forge.html`'s script — `const FORGE_MODEL = 'claude-sonnet-4-5-20250929';` — and the four literals read it. Recommended value is the **same pinned dated ID as `dct-ios.html`** so both surfaces move together and the `.569` note's "pinned, not aliased" posture holds. (The skill's own default for new code is `claude-opus-5`; that is a cost/quality upgrade the owner would choose, not a P-12 fix — Forge's calls are 80–1000-token briefing lines.) ⚠ The Worker may or may not accept a model override; P-11 proved it forwards the client's string. **Blast radius: LOW**, `forge.html` only, no lockstep stamp (it is not one of the three stamped files — confirm whether `sw.js` precaches `forge.html` before calling it "no bump"). The all-workspaces key deletion is John's console task; nothing in the repo references it.

---

## PROPOSED SHIP SPLIT — one visible change each, in order

| # | Ship | Item | Risk | Ready? |
|---|---|---|---|---|
| 1 | `forge.html` four model strings → `FORGE_MODEL` = Sonnet 4.5 pin | 9 | LOW | **GO-ready** (owner confirms model choice: match `.569` pin vs `claude-opus-5`) |
| 2 | Build shell hidden while a tool owns the screen (`body.rd.ops-detail #pg-work #bw-shell{display:none}`) | 4 / P-8 | LOW-MED | **GO-ready**; device-verify Back + preview re-arm |
| 3 | Rack Map generic/template floor → honest text-only zero state | 3B / P-7 | LOW | **needs one ruling:** is P-7 the Rack Map floor (recommended) or the Compass? |
| 4 | `bw_render` `!master && dep` branch → "Master missing" card + LOAD MASTER | 7 | LOW | **GO-ready**; `.571` landing guard split out as 4b (ruling) |
| 5 | SYS → MASTER row + sheet (Load/Replace · Delete-with-PIN) | 2 / P-6a | MED | GO-ready; **flags the Purge-without-PIN gap** |
| 6 | Close 4 duplicate Master doors (age-chip, OPEN MASTER FILE, RE-LOAD, legacy CTA) | 2 / P-6b | MED | **per-door ruling** — three zero-state CTAs + desktop stay |
| 7 | ISOLATE action on the rack detail (+confirm) and close the OPS-row tile | 6 | LOW-MED | **Batch 4 ruling** — first tool re-home, sets the pattern |
| — | Compass keep-or-close (with `eia_holesForSpan` + `cn-*` CSS carved out) | 3A | HIGH if wholesale | **parked** — owner rules after P-10 |
| — | Boot curtains collapse | 5 | MED-HIGH | **parked** — own Phase 0 with a device boot timeline; owner names which three |

**What I chose NOT to propose:** deleting `bw_render`'s call from the tool path (right-path for P-8 but touches `showMode` for every Build entry — the CSS gate gets the same pixel result for a fraction of the radius); removing the stall trigger (P-2 ruling forbids it); any `cn-*` CSS sweep (Contract 15 R-E).

**Owner questions parked (Q section):** (Q1) P-7 = Rack Map floor or Compass? (Q2) forge model: match `.569` pin or upgrade? (Q3) which of the nine Master doors close in 6b? (Q4) should the `.571` picker landing fire without a Master? (Q5) which three boot layers is "three curtains"?

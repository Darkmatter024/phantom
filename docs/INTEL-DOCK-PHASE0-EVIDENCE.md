# BATCH 4 — IA-SHIFTNAV v2 Phase 0 + ghost/EXIT restructure · PHASE 0 EVIDENCE

> **Provenance:** Phase 0 recon, 2026-09-08, read-only, source-only, against main @ 30f3822 (.582). Written by a fork agent under SHIP-HANDOFF-CLOSEOUT-BATCH.md section 4; anchors spot-checked by the parent session (dock :16591 with three .botitem plus #rd-exit, #cc-asst :13952, va_intentHtml :51178, phantomCheckApi :55696, SITE PROFILE as the last SYS row, 01-nav.spec.js:79). This is the INTEL-DOCK Phase 0 evidence the spec said had never been run; it carries IA-SHIFTNAV v2 Phase 0/1 forward rather than re-delivering them. The dock-count ruling in section 5 is framed with a recommendation and is NOT decided here; nothing is built until John answers.


**Written:** 2026-09-08 · **Baseline:** `main` @ `30f3822`, `phantom-v1.14.582` (unverified; `release` = `.581`) · **Mode:** READ-ONLY. Nothing edited, staged, or committed. Source-only — nothing was run in the harness or on a device.
**Every `:line` below was read against `.582` bytes. They are valid against this stamp only (F-4b).**

---

## ⛔ SCOPE CORRECTION — most of §4 already happened, and one premise is stale

The handoff's §4 describes IA-SHIFTNAV v2 Phase 0 as if it were unrun. It is not:

| Handoff §4 item | State at `.582` | Where |
|---|---|---|
| v2 Phase 0 (E-8 · E-9 · E-10) | **DONE at `.563`**, three owner rulings folded in (E-8 tools stay doors · E-9 four levels stay, picker resolves the deployment · SCAN not a dock slot) | `docs/IA-SHIFTNAV-V2-PHASE0-EVIDENCE.md` |
| v2 Phase 1 (P-1…P-5) | **DONE**, re-swept at `.570`; **P-3 dock proposal SUPERSEDED by INTEL-DOCK (owner, 2026-09-03)** | `docs/IA-SHIFTNAV-V2-PHASE1-PROPOSAL.md:139` |
| "Ship 1 findability of the ten-tool OPS group" | **SHIPPED.** `.558` restored Build's OPS row (9 tools, 2 taps, 0 scroll); `.559` added ISOLATE + OPTIC LEDGER rename | `PHANTOM_CURRENT_STATE.md:147-148` |
| "`ops_init` is disabled — its fate is John's first Phase-1 ruling" | ⛔ **STALE. `ops_init` is LIVE.** `.558` re-armed it behind a double rAF; E-10 quoted it verbatim; it has been rendering the row since | `dct-ios.html:19274-19278`, `:21891` |
| Boot on the rack picker (P-5 Ship 2) | **SHIPPED `.571`** | state row `:136` |
| `#cs-fieldtools` disposition | **RULED + SHIPPED `.576`** — phone loses the duplicate, desktop keeps its door | `:59806` |
| SYS → DIAGNOSTICS | **SHIPPED `.575`** (ERRORS sheet re-labelled, zero new SYS rows) | state row `:132` |

**What is genuinely NOT started:** `SHIP-HANDOFF-INTEL-DOCK.md` Phase 0 (E-1…E-6). Its own import note says *"No Phase 0 has been run."* **That is what this document is** — the INTEL-DOCK Phase 0 evidence, plus the dock-count ruling frame the handoff asks for. It does not re-deliver v2 Phase 0; it carries it forward.

---

## 1 · COMPREHENSION GATE (v2 §6, in my own words, 142 words)

**What John wants:** a gloved tech at one rack should never have to remember where a piece of that rack's information lives. Everything about *this* rack is on *this* rack's screen. Three moves: load Master → pick rack → work the rack. And the AI, which only matters when there is signal, should be one honest tap away from anywhere — lit when it can answer, visibly dim when it cannot.

**Why rack-as-unit gets there:** it turns navigation into position. On the rack, you are already where the answer is.

**Looks like progress, violates §0:** giving the ghost a dock slot *and* keeping the Command assistant card *and* the omni-bar keyword — three doors to one sheet. The reach goes up but the door count goes up with it.

**The one question I would ask:** is the 2026-09-03 four-slot ruling still the ruling, or does today's "do not assume the count" re-open it?

**What the intent demotes / keeps (against `.582`):**

| Surface | Under the intent |
|---|---|
| Command as a first screen | already demoted (`.571`, picker first) |
| `#cs-fieldtools` ten-tool row on phone | already re-homed off phone (`.576`) |
| EXIT as a dock slot | **demote → SYS last item** (INTEL-DOCK §2) |
| Command assistant card `#cc-asst` as the phone's assistant door | **demote → dock ghost** (needs a Master today; the dock does not) |
| Load/switch Master · rack picker · shift handoff · SYS · Exit-as-gesture | **keep** (v2 §1 short list) |
| OPTIC LEDGER, AUDITS, BURNDOWN, BLAST, MANIFEST, BOM, PORT MAP, SOPs | **keep as doors** (E-8 ruling 2026-09-01 — not rack-keyed, no data change) |
| ISOLATE, RACK MAP | rack-scopable at zero data cost (E-8), not this batch |

---

## 2 · CENSUS — verbatim, at `.582`

### 2a · The bottom dock (`#rd-botnav`) — INTEL-DOCK E-1

Markup `:16591-16616`:
```
:16591  <div class="botnav" id="rd-botnav">
:16592    <div id="bn-rail">                                        <- display:contents (:10019) -> its 3 tabs are direct grid cells
:16593      <div class="botitem active" id="bn-command" ... onclick="showMode('command')" aria-label="Command" style="--tc:#61efff">
:16597      <div class="botitem" id="bn-work" ... onclick="showMode('work')" aria-label="Build" style="--tc:#3d84ff">
:16606        <span class="bn-badge" id="bn-work-n" aria-hidden="true">0</span>      <- .562 live blocker count
:16608      <div class="botitem" id="bn-ref" ... onclick="showMode('ref')" aria-label="Tools" style="--tc:#cfe3ee">
:16611    <div id="rd-exit" role="button" aria-label="Hold to exit and freeze the app" tabindex="0" style="--tc:#ff4d4d">
:16612      <span class="rd-exit-charge"></span>
:16614      <span class="blabel">Exit</span><span style="order:4;font-size:9px;...">hold</span>
```
**Four controls, one grid:** `:9980` `#rd-botnav{...grid-template-columns:repeat(4,1fr)...padding:8px 6px calc(8px + var(--safe-bottom))...}`. `#rd-exit` is a **sibling of the rail, deliberately not a `.botitem`** — `01-nav.spec.js:101` pins `exitIsBotitem === false`. Slot 1 label reads "Command" (`.525` relabel from Home).

**Geometry (source-derived, E-5 NOT re-measured this pass):** at 390px, 4 cells of (390 − 12) / 4 ≈ **94px** wide; `.botitem` and `#rd-exit` `min-height:54px` (`:9985`), `#rd-exit` `min-width:56px;min-height:56px` (`:10020`); icons 54×54 (`:9986`). `.562` measured the floor at **54px** and `01-nav.spec.js:104` asserts every nav control ≥ 44px. **A ghost inheriting slot 4 inherits a glove-safe cell by construction.** ⚠ Desktop: `body.rd.cshell #rd-botnav{display:none!important}` (`:59567`) — the dock does not exist ≥1024; the desktop side nav carries its own EXIT (`#cs-nav-ext` `:16562`, see §6).

### 2b · EXIT (hold) — what "hold" does to app state

- Wiring: `rd_initExit()` `:19147-19156` → `rd_holdGesture(ex,'arming',rd_freeze)`; charge bar fills over **.85s** (`:10026`), gold arming state (`:10023`). Same helper wired onto `#rd-wake` and onto the desktop `#cs-nav-ext` (`:19153-19154`, *"the SAME control ... one engine, one door"*).
- `rd_freeze()` (`:19128-19141`): (1) blurs the active editor so an in-flight input flushes; (2) writes `phantom_freeze_v1 = {mode:_rdMode, ts}` via `safeStore` (`:19137`); (3) raises `#rd-freeze-curtain` (`:16618`, *"PHANTOM · FROZEN ... shift state saved · nothing lost"*). ⭐ **Nothing is cleared.** The app persists per-domain continuously; the marker only records the VIEW to return to.
- `rd_wake()` (`:19142-19146`): lowers the curtain, removes the marker.
- Boot restore `rd_freezeBootRestore` (`:19204-19215`): if the marker survived a Safari kill, `showMode(mark.mode)` after 720ms, marker cleared. `phantom_freeze_v1` is classed **session/ephemeral** (`:55292`, `:55306`).

**So "EXIT keeps the app on hold; state persists" is exactly the existing semantics.** Moving the control moves a gesture binding and a curtain trigger; the freeze/wake/restore functions do not need to change.

### 2c · The SYS menu — INTEL-DOCK E-2

`SYS` is the header aggregate pill `#hdr-agg-pill` (`:13564`); its label reads `SYS` when healthy or checking (`:55639`, `:55641`), otherwise `OFFLINE` / `API OFFLINE` / `SW ...` / `STORAGE n%`. Tap → `hdr_aggToggle` (`:55647`) → `#hdr-agg-panel` (`:13569`, `role="region"`). Items are **static markup, top to bottom**:

| # | line | item | opens |
|---|---|---|---|
| 1 | `:13570` | NETWORK | `hsDotTap('net')` |
| 2 | `:13575` | API | `hsDotTap('api')` + `phantomCheckApi()` |
| 3 | `:13580` | SERVICE WORKER | `hsDotTap('sw')` |
| 4 | `:13585` | STORAGE | `hsDotTap('store')` + `phantomStorageCheck()` |
| 5 | `:13591` | **DIAGNOSTICS** | `rd_openErrors()` `:19653` → `#rd-errors-sheet` `:13677` *"ERRORS · CRASH LOG · DIAGNOSTICS"* (`.575` home of local system state) |
| — | `:13597` | divider (`.hdr-agg-act`) | |
| 6 | `:13598` | Export all data | `exportAllData()` |
| 7 | `:13599` | Restore from backup | `phantomImport()` |
| 8 | `:13600` | Set identity | `identity_promptUser()` |
| 9 | `:13601` | Open hardware reference | `hwMatrix_open()` |
| 10 | `:13603` | Open Forge 3D *(v1.14.222 "PROVISIONAL door")* | `forge3d_open()` |
| 11 | `:13605-13609` | **SITE PROFILE · EDIT →** | `rd_openProfile()` `:19482` → `#rd-profile-sheet` `:13640` |

**Bottom edge:** the SITE PROFILE row at `:13605-13609` is the panel's last child; `</div>` closes the panel at `:13610`. **EXIT lands after `:13609`.** Items are added by editing this markup — there is no builder function.

⚠ **Against INTEL-DOCK §2's final shape (`MASTER · PROFILE · DIAGNOSTICS · EXIT`):** PROFILE exists (as SITE PROFILE, last), DIAGNOSTICS exists (`.575`), **MASTER is absent** (B-1 not shipped), **EXIT is absent**, and **nine items exist that §2 does not list** (four health rows + five actions). §2 says *"Nothing else moves into SYS in this ship"* — it does not say the extra actions leave. **Owner question, parked:** does the INTEL-DOCK ship leave items 1-4 and 6-10 in place (net SYS +1) or is a later SYS-trim ship owed? Not decided here.

### 2d · The DCT Assistant ("the ghost") — INTEL-DOCK E-3

**Two different things carry the ghost art, and neither is a dock slot:**

1. `#hdr-ghost-btn` (`:13537`, `class="hdr-ghost-btn"`, `aria-label="More actions"`) — the legacy header medallion. It toggles `#hdr-overflow-menu`, **not the assistant**, and its wrapper `#hdr-overflow-wrap` is `display:none !important` under `body.rd` (`:10066`, since `.156`). **On the phone it does not exist.**
2. `#cc-asst` (`:13952`, `onclick="openVaSheet('intent')"`) — the Command "AI ASSISTANT" card, ghost art `phantom-ghost-v3.webp` (`:13955`). On phone it renders in the Command flex flow at `order:2` (`:9873`, `@media (max-width:1023px)`); on desktop it is the rail (`:9890`). ⛔ **Hidden when no Master is loaded:** `#pg-cmd[data-master="0"] .cc-asst{display:none!important}` (`:9789`).

**Every opener of the assistant sheet today** (`openVaSheet` defined `:51136`):

| door | line | reaches it from | phone? |
|---|---|---|---|
| `#cc-asst` card | `:13952` | Command, **only with a Master** | yes (1 dock tap + 1) |
| `#cc-chat` "CHAT WITH PHANTOM" | `:13989` | desktop rail | no (base `display:none`) |
| omni-bar keywords `voice/ask/assistant/speak/question/help me` | `:48759` | anywhere the LOG bar is | yes |
| `vaStart()` re-entry | `:51127` | inside the sheet | — |

⚠ **Discrepancy with INTEL-DOCK §1/§7, recorded not resolved:** the spec says the assistant is *"reachable only from inside a rack screen"*. Source shows **no rack-screen opener** — the phone doors are the Command card and the omni keyword. Either way §7's conclusion holds (a dock slot raises reach), but the ledger's "before" row should read *Command card (Master required) + omni keyword*, not *rack screens only*. **Harness confirmation owed (E-3/E-5) before the ship's tests are written.**

⚠ **Data-honesty flag found in passing (Contract B10):** the card's eyebrow reads a **static** `AI ASSISTANT · ONLINE` (`:13956`) beside a **static** green dot (`:9814`, `.cc-asst-online`) regardless of `body[data-net]` or the API check. A gauge that says ONLINE while `phantomAI` will refuse at `:18367` is the *"gauge that lies"* INTEL-DOCK's closing line names. Reported to the parent; not acted on.

### 2e · The A-2 assistant sheet — exists, shipped `.194`

`#vaSheet` `:16670`, title `DCT ASSISTANT` `:16675`, body `#vaBody` `:16682`. `va_intentHtml()` `:51178` renders the four machined doors: **SPEAK** (`vaStart()`, `:51187`) · **PASTE TICKET** (`va_pasteTicket()`, `:51190`) · **TYPE OR PASTE** (`setVaBody('composer')`, `:51193`) · **IMPORT FILE** (`#vaTicketFile` click, `:51196-51198`, `.txt .log .json .eml .csv .md`). **Nothing to build here; the dock ghost re-homes an opener onto a sheet that already exists.**

### 2f · Connectivity the app already has — INTEL-DOCK E-4 (reuse, don't duplicate)

| mechanism | line | what it gives the ghost |
|---|---|---|
| `phantomUpdateNetPill(online)` | `:55705-55718` | sets `document.body.dataset.net` to `online` / `offline`; drives the CSS dim of `[data-requires-net="1"]` and `.va-btn` (`:11444-11480`) |
| `window` online / offline listeners | `:55719-55720` | the state changes without relaunch (§6 step 4) |
| **`phantomCheckApi()`** | `:55697-55704` | `fetch(PHANTOM_PROXY_URL,{method:'OPTIONS'})` → `REACH` / `HTTP n` / `UNREACHABLE` via `hsSet('api',...)` — ⭐ **this IS the "lightweight OPTIONS ping" §1 asks for; it exists** |
| aggregate state | `:55628-55637` | `'offline'` when net red **or** API red — the `.410` ruling that offline is quiet, not a fault |
| `phantomAI` offline pre-check | `:18367-18374` | fails fast on `navigator.onLine === false` |

**A ghost lit/dim state can bind to `body[data-net]` + the `api` health colour with zero new detection code.** What the census could not settle from source: whether `phantomCheckApi` runs on tab focus today (§1 asks for a ping on focus) — grep shows it wired to the SYS row tap and to `phantomHealthRefresh`; the focus trigger is a harness question.

### 2g · E-6 — every e2e spec that asserts on the dock or on EXIT (Healer's worklist)

| spec | hits | what it pins |
|---|---|---|
| `01-nav.spec.js` | 37 | `:79` **"the nav pins the pre-M4 shape: three slots plus EXIT"** — its own header (`:65-74`) says *"a CHECKPOINT, NOT A SPECIFICATION ... must be rewritten, not deleted"*; `:99` `#rd-exit` present; `:101` never a `.botitem`; `:104` 44px floor |
| `06-composition.spec.js` | 25 | dock geometry per tier |
| `03-tools.spec.js` | 5 | |
| `94-probe-badge.spec.js` | 5 | `#bn-work-n` badge |
| `30-rack-above-the-fold.spec.js` | 2 | nav clearance |
| `48-ops-row-exists.spec.js` | 2 | |
| `05-offline.spec.js` | 1 | |
| `10-site-profile-root.spec.js` | 1 | |

---

## 3 · THE TEN-TOOL OPS GROUP — where each is reachable, and `ops_init`

**Registry of record:** `OPS_PANELS_CONFIG` `:21681-21700` — `bom · manifest · portmap · rackmap · sops · burndown · audits · blast · optics ("OPTIC LEDGER") · isolate` (ten; ISOLATE appended `.559`). Title registry `DEPLOY_TOOLS` `:32606-32622` (same ten, same order — `03-tools:378` asserts order-sensitively).

| door | line | composition | taps from launch (phone) |
|---|---|---|---|
| Build → OPS control → row | `ops_init` `:21891` ← `showMode('work')` `:19274-19278` | phone + desktop | **2** (`.558` measured: control at `top:94px`, 44px, zero scroll; 9 panels at 0px scroll) |
| `#cs-fieldtools` `.cs-tool` ×10 | `:13892`, buttons `:13911-13920` | **desktop only** — `body.rd.cshell #cs-fieldtools{display:none}` `:59806` (`.576`) | n/a on phone |
| omni-bar keyword routes | e.g. `:48756` `goOpsTab('portmap')` | anywhere | 1 + typing |

Both doors call the one canonical `rd_openOpsTool` — Contract A2 intact.

**`ops_init` — NOT disabled.** The call site `:19274-19278`:
```js
if (mode === 'work' && typeof ops_init === 'function') {
  requestAnimationFrame(function () { requestAnimationFrame(function () {
    try { ops_init(); } catch (e) { phantom_logErr('showMode:ops_init', e); }
  }); });
}
```
The `.473` deferral it replaced is quoted in the comment above it (`:19260-19273`): *"`.473` (c199f43) removed this call and wrote that OPS 'will be triggered on-demand when user taps the OPS control'. ⛔ THAT TRIGGER WAS NEVER WIRED ... An intended DEFERRAL landed as a DELETION."* The function body `:21891-21899` initialises exactly three things: the `#bw-shell` liveness gate, `ops_ensureContainer()`, `ops_restoreState()` — E-10 already ruled on it. **There is no first Phase-1 ruling owed on `ops_init`; the handoff line predates `.558`.**

**Verify debt carried, not new:** `SHIP-HANDOFF-IA-SHIFTNAV-SHIP1.md` §"VERIFY DEBT" — only OPTIC LEDGER's rendered surface was measured on hardware; the other nine tools were opened by no device step. Still true at `.582`.

---

## 4 · DOOR LEDGER — method and baseline

**Method (repo of record):** `docs/IA-SHIFTNAV-V2-PHASE1-PROPOSAL.md:209` P-4 — a two-column table *path today → after*; a **re-home scores 0**, a close −1, a new door +1; the net is reported honestly even when smaller than the spec imagined (*"No number is manufactured to satisfy P-4's own rule"*). INTEL-DOCK §7 uses the same shape with a *Reach* row.

**Baseline at `.582` for the INTEL-DOCK ship:**

| door | today | after §5 | Δ |
|---|---|---|---|
| Dock controls | 4 (COMMAND · BUILD · TOOLS · EXIT-hold) | 4 (COMMAND · BUILD · TOOLS · GHOST) | 0 |
| EXIT in dock | 1 (`#rd-exit`) | 0 | −1 |
| EXIT in SYS | 0 | 1 (after `:13609`) | +1 |
| EXIT on desktop side nav | 1 (`#cs-nav-ext` `:16562`) | **unruled** — see §6 | ? |
| Assistant doors on phone | 2 (`#cc-asst` Master-only · omni keyword) | 3 if the card stays, 2 if it is retired | **+1 or 0** |
| SYS items | 11 | 12 | +1 (the moved EXIT) |
| **Net app** | | | **0 only if the Command card is retired or folded** — otherwise +1 |

⚠ **The §7 ledger says "Net app: 0". It reaches 0 only if the ship also removes (or re-homes onto the dock) the `#cc-asst` opener.** INTEL-DOCK §5's grep gate already implies this — *"assistant sheet has exactly one opener (the dock) plus any rack-contextual shortcut the owner keeps"* — so the card's fate is a ruling the ship needs before it is written, not after.

**Realised ledger for the campaign so far** (for the parent's running total): Command-first-screen closed (`.571`, −1) · `#cs-fieldtools` re-homed off phone (`.576`, 0) · EXIT slot still open (0 realised of the −1 projected). P-4's honest net of −1 is **already banked**; the INTEL-DOCK ship is net 0 by design.

---

## 5 · THE OPEN OWNER RULING — framed, not decided

**The collision, exactly:** Contract A8 / R-02 says the primary nav is `COMMAND · BUILD · SCAN · TOOLS · SHIFT`, five pillars, EXIT not a slot, **delivered at M4 and gated behind M3** (3 of SHIFT's 9 questions have no data — CLAUDE.md A8, `PHANTOM_CURRENT_STATE.md` D-1: *"Do not restore the slot early"*). INTEL-DOCK (owner ruling **2026-09-03**, the newest) says `COMMAND · BUILD · TOOLS · GHOST`, four slots, EXIT → SYS. SCAN's slot was **ruled away** on 2026-09-01 (v2 §2 governs). So the only live collision is **the fifth slot: SHIFT (at M4) vs the ghost**. The handoff re-opens the count today: *"do not assume."*

| | Option A — four slots, ghost is #4 (the 2026-09-03 ruling) | Option B — five slots now: + SHIFT | Option C — ghost does not take a slot (header/FAB); dock stays 3 + EXIT |
|---|---|---|---|
| Slot width at 390 | ~94px (today's) | ~75px | ~94px |
| Tap height | 54px (pinned ≥44) | 54px | 54px |
| Glance-readability | four icons + 8-10px Orbitron labels — proven today | `.530` label-risk returns (COMMAND→DECK was forced by width once); five icons at 75px | unchanged |
| Assistant tap depth | **1 from anywhere** | 1 | 2+ (and a header ghost is the `.156` medallion that was hidden for being dead) |
| Collides with A8/R-02? | **only at M4** — SHIFT keeps its door (`#cs-shiftbar` in `#cs-grid`, gated on Master), loses a slot it never had; A8's own words: *"removing that slot removes the slot, not the feature"* | **violates D-1 today** — restores SHIFT's slot with no data behind 3 of its 9 questions; nav would change twice (now, then at M4) → two device verifies of two nav shapes | no collision, but INTEL-DOCK's stated intent (*"put the ghost in that spot"*) is not served |
| Ledger | net 0, reach up (§7) | net +1 (a slot with no data) | net 0, reach flat |
| Risk | LOW-MED: one dock cell changes identity; `01-nav:79` re-pinned to 3+GHOST | MED-HIGH: two nav changes, art for SHIFT precache, data-honesty on an empty pillar | LOW, but does not do what the owner asked |

**Recommendation: Option A, re-confirmed rather than assumed.** It is the only approved dock shape, it is the newest ruling, it passes the Cold Aisle Filter on every row, and it is reconcilable with A8 exactly as the INTEL-DOCK import note already reconciles it (*a pillar slot and a door are not the same claim*). **What to put in front of John in one line:** *"Four slots, ghost fourth, EXIT last in SYS — as you ruled on 2026-09-03. If M4 later wants a SHIFT slot, that collides with the ghost and is ruled then, not now. Confirm?"* ⛔ Not built until he answers.

**Sub-rulings that ride with it (from `PHANTOM_CURRENT_STATE.md:1351-1352`), none decided here:**
1. **Ghost glyph vs rendered character** — art dependency. Existing dock icons are `icons/phantom-nav-*-v3-256.webp` (256px, `loading="eager"`); the only ghost raster is `phantom-ghost-v3.webp` (Command card, 107×122 box). A dock cut through the established art pipeline is a Phase 1 dependency — flag early, as Addendum A3 did for SCAN; do not precache until a consumer exists (`.364` lesson). Lit/dim must read at arm's length — *"dim means dim"*, glyph if opacity alone fails.
2. **What happens to the Command assistant card `#cc-asst`** when the dock owns the door (§4 above — decides whether the ledger is 0 or +1, and retires the static ONLINE gauge).
3. **The Next Action card on Build** — recorded as open; nothing in this census touches it.
4. **`#cs-nav-ext`** (desktop EXIT, §6) — INTEL-DOCK is silent on the desktop side nav.

---

## 6 · PROPOSED SHIP 1 for this batch — one visible change

**Not "findability of the OPS group"** — that shipped (`.558`/`.559`). The honest first ship is **INTEL-DOCK §5 as written: the dock's fourth slot changes identity.** EXIT (hold) leaves the dock for the last SYS item; the ghost takes slot 4 with two honest states.

**Visible change (one):** dock reads COMMAND · BUILD · TOOLS · [ghost]; SYS ends in EXIT (hold).

**Anchors it would cut (all re-verified at `.582`, re-sweep before edit):**
- `:16611-16616` `#rd-exit` block — **removed from the dock markup**, not hidden (§5 S-1 grep gate: Exit-hold markup in dock = 0).
- `:13609` — insert the EXIT row after SITE PROFILE (last child of `#hdr-agg-panel`); wire via the existing `rd_holdGesture(el,'arming',rd_freeze)` (`:19150` pattern). ⚠ The SYS panel closes on outside tap (`:55658`) — a .85s hold inside a popover that dismisses on document click needs the hold to survive the panel's own close path; measure, don't assume.
- `:16593-16610` — a fourth `.botitem` (`#bn-ghost`), `onclick="openVaSheet('intent')"` when `body[data-net="online"]` and API reachable, else a one-line sheet *"Assistant needs signal. Offline right now."* + back.
- `:55705` `phantomUpdateNetPill` / `:55697` `phantomCheckApi` — **reused as the state source**, not duplicated.
- `01-nav.spec.js:79-102` — re-pinned to *three tabs + ghost, no `#rd-exit` in dock, EXIT last in SYS*, per its own header.

**What it must NOT touch:**
- ⛔ `rd_freeze` / `rd_wake` / `rd_freezeBootRestore` (`:19128-19215`) — semantics stay byte-identical; only the trigger moves.
- ⛔ The NBA line under the hero (INTEL-DOCK §0 — *"don't move the NBA line"*).
- ⛔ `deploy_showRackDetail` signature, `OPS_PANELS_CONFIG`, `DEPLOY_TOOLS`, `#cs-fieldtools`, `ops_init` — none are in scope.
- ⛔ `#vaSheet` / `va_intentHtml` — the sheet is re-homed onto, not rebuilt.
- ⛔ SYS items 1-10 — *"Nothing else moves into SYS in this ship"*; MASTER (B-1) is a separate ship.
- ⚠ `#cs-nav-ext` (`:16562`, desktop side-nav EXIT, `.529` — *"the SAME control as the dock's"*) — INTEL-DOCK does not mention it. Leaving it makes the desktop keep an EXIT the phone lost (the `.576` pattern: *the phone loses the duplicate, the desktop keeps its door*); removing it widens the ship. **Ruling needed; default is leave it, per D-1 of the Ship 1 handoff.**

**Preconditions before this ship can be slotted:** `.582` adjudicated (the gate is at its limit) · Option A re-confirmed · `#cc-asst` fate ruled · ghost art cut approved · INTEL-DOCK E-5 dock capture and E-3 harness confirmation of the assistant's phone doors run (both are Playwright work, not device work) · tests written red first per §5 *"Tests before edit (Generator)"*.

**Device-verify (John, iPhone) — INTEL-DOCK §6, unchanged:** dock shows no EXIT; ghost lit online and opens from Command, from a rack, from the picker; airplane mode → ghost visibly dim, tap → one-line sheet, no spinner; back online → lights without relaunch; SYS bottom item EXIT (hold) → app on hold, relaunch lands on the same view. **The iOS PWA freeze/restore path is a hardware-only class** (installed-PWA lifecycle) — Playwright proves everything else first.

---

## BOUNDS

- ⛔ Source only. E-5 (dock capture at iPhone-15 WebKit) was **not run**; geometry above is derived from `:9980`/`:9985`/`:10020` and the `.562` measurement. E-3's phone-door claim is source-derived and contradicts the spec's wording — harness confirmation owed.
- ⛔ Nothing here is design or authorisation. The ruling in §5 is framed with a recommendation; John decides.
- 📌 Out of my directive, noted in one line each: the static `AI ASSISTANT · ONLINE` gauge (`:13956`) is a B10 item for the data-honesty batch; SYS carries a `v1.14.222` "PROVISIONAL" Forge 3D door (`:13603`) that was to be relocated "when the hero / rack-switch stages land" — `SEE IN AISLE` landed, so that door may now be a duplicate path for the ledger.

---

# ADDENDUM — 2026-09-09 · ANCHORS RE-SWEPT TO `.586`, AND A HARNESS FINDING THAT CHANGES HOW THE GHOST CAN BE TESTED

**Written:** 2026-09-09 · **Read against:** the working tree at `phantom-v1.14.586` (the ICON-REFRESH ship, uncommitted at the time of writing; nothing in it touches the dock, SYS, the assistant, or any anchor below) · **Mode:** READ-ONLY, source plus one read-only network probe. Nothing in the app was edited.
**Why this exists:** the census above is stamped *"valid against `.582` only (F-4b)"*. Four versions have landed since. Every anchor below was re-found **by verbatim string, not by line number**, so these numbers are measured rather than assumed.

## A1 · Every `.582` anchor still resolves. All shifted by exactly −1.

The uniform −1 has one cause, and it is not drift: `.586` deleted a single line from the `<head>` — the `favicon-16.png` icon link at `:28` — so everything below it moved up one. **No anchor moved relative to any other anchor. The dock, SYS and assistant structures are byte-for-byte the shapes section 2 described.**

| `.582` | `.586` | anchor |
|---|---|---|
| `:16591` | **`:16590`** | `<div class="botnav" id="rd-botnav">` |
| `:16592` | **`:16591`** | `<div id="bn-rail">` |
| `:16593` | **`:16592`** | `#bn-command` |
| `:16597` | **`:16596`** | `#bn-work` |
| `:16606` | **`:16603`** | `#bn-work-n` badge |
| `:16608` | **`:16605`** | `#bn-ref` |
| `:16611` | **`:16610`** | `#rd-exit` — still a sibling of the rail, still not a `.botitem` |
| `:16562` | **`:16561`** | `#cs-nav-ext` (desktop EXIT, still unruled) |
| `:13564` | **`:13563`** | `#hdr-agg-pill` |
| `:13569` | **`:13568`** | `#hdr-agg-panel` |
| `:13591` | **`:13590`** | DIAGNOSTICS row |
| `:13603` | **`:13602`** | Forge 3D "PROVISIONAL" door |
| `:13605` | **`:13604`** | SITE PROFILE row |
| `:13952` | **`:13951`** | `#cc-asst` |
| `:13956` | **`:13955`** | the static `AI ASSISTANT · ONLINE` eyebrow |
| `:13989` | **`:13988`** | `#cc-chat` |
| `:16670` | **`:16670`** | `#vaSheet` — unmoved; it sits far enough down that the deleted head line is absorbed by intervening edits |

Functions, re-found by declaration: `rd_holdGesture` **`:19116`** · `rd_freeze` **`:19128`** · `rd_wake` **`:19141`** · `rd_initExit` **`:19146`** · `rd_freezeBootRestore` **`:19203`** · `rd_openProfile` **`:19481`** · `rd_openErrors` **`:19652`** · `ops_init` **`:21890`** · `openVaSheet` **`:51141`** · `va_intentHtml` **`:51183`** · `phantomCheckApi` **`:55846`** · `phantomUpdateNetPill` **`:55855`**.

**Dock shape at `.586`, counted rather than assumed:** **three** `.botitem` inside `#bn-rail`, plus `#rd-exit` as the fourth grid cell. The icons are `icons/phantom-nav-command-v3-256.webp`, `-build-v3-`, `-tools-v4-` and `-exit-v3-`, every one `loading="eager"` at 256x256 — **the art pipeline a ghost cut has to match** (sub-ruling 1).

**The exact insertion point for EXIT-in-SYS, re-counted:** `:13604` opens the SITE PROFILE row, `:13605`-`:13607` are its dot, name and value, **`:13608` closes the row, and `:13609` closes `#hdr-agg-panel`.** The EXIT row goes **between `:13608` and `:13609`**. That confirms section 6's "insert after SITE PROFILE" against current bytes.

## A2 · NEW FINDING — the harness can never see the ghost lit, and that shapes the tests

Section 2f proposed binding the ghost's lit and dim states to `body[data-net]` plus the `api` health colour, "with zero new detection code". That reuse is still right. **But the API half of it cannot go green under Playwright, by design and permanently.**

Measured 2026-09-09 with a read-only `OPTIONS` preflight against `PHANTOM_PROXY_URL`, after the owner deployed Worker CORS **v2.3**:

| Origin | Preflight | `Access-Control-Allow-Origin` |
|---|---|---|
| `https://phantom-staging.wfj6t2fk7w.workers.dev` | 204 | **echoed — allowed** |
| `https://darkmatter024.github.io` | 204 | **echoed — allowed** |
| `http://127.0.0.1:4317` (the Playwright origin) | 204 | **absent — refused** |
| `https://evil.example.com` (control) | 204 | **absent — refused** |

**The Worker is behaving correctly.** It is a real allowlist: it echoes only the two genuine origins and refuses everything else, including a bogus control. The harness is simply not one of the two, and it should not be.

**Three consequences for this ship, none of them optional:**

1. **`phantomCheckApi()` always resolves to `UNREACHABLE` under Playwright**, so the SYS aggregate is always `offline` (section 2f: the aggregate is offline when net is red **or** api is red). A ghost bound to that aggregate **renders dim in every harness run, including runs where `navigator.onLine` is true.** A test asserting "the ghost is lit when online" against the live Worker would fail forever, and would be read as a product defect.
2. **The ship's tests must drive that state rather than observe it** — a `page.route` intercept on `PHANTOM_PROXY_URL` returning a permissive 204, or a stub on `phantomCheckApi`, established **before** the lit-state assertions are written (section 5, "Tests before edit"). The dim-state test needs no stub at all: it is the harness's natural condition, which makes the offline path the cheaper of the two to pin.
3. **It already costs a green board intermittently — and it is a RACE, not a hard red.** `00-boot.spec.js:18` ("boots with no uncaught exception and no console error") failed on exactly these three CORS entries — one `pageerror` and two `error` — during a full 430-test run at `.586` while the box was heavily loaded. ⭐ **Re-run on an idle box it PASSED** (42 passed / 8 skipped / 0 failed across `00-boot`, `01-nav`, `05-offline`, `06-composition`). **So whether it goes red depends on the refusal landing inside the assertion window**, which is worse than a steady failure: it is the kind of red that appears on a busy day, gets attributed to whatever shipped that morning, and disappears on the re-run that is supposed to confirm it. It is a documented harness artifact (`docs/BATCH1-582-EVIDENCE.md:111`), and `.584` filtered it **inside** the one spec that needed it, "with the reason, not added to the global allowlist" (`docs/BATCH2-584-EVIDENCE.md:32`). `fixtures.js`'s `BENIGN_CONSOLE` still filters **only** a favicon 404. **Not fixed here, and deliberately not by widening the allowlist** — CLAUDE.md's standing rule is "Never widen the console allow-list to get green." ✅ **RULED 2026-09-10: route intercept in the fixture**, so the probe never leaves the harness — it removes the race rather than tolerating it, and it is the option that also makes the ghost's lit state drivable. Harness ship, no app source; it should land before INTEL-DOCK's tests are written.

## A3 · What was blocking the build — ✅ ALL FOUR RULED 2026-09-10

Nothing in section 5 or section 6 above is superseded; section 5's Option A was **confirmed, not assumed**, which is exactly what it asked for. Full text in `OWNER-RULINGS.md` 2026-09-10 INTEL-DOCK.

| # | Question | Ruling |
|---|---|---|
| 1 | Dock count | ✅ **Option A.** Four slots `COMMAND · BUILD · TOOLS · GHOST`; EXIT (hold) → last row of SYS. B (five slots + SHIFT) and C (header/FAB ghost) both **rejected**. A SHIFT slot at M4 collides with the ghost and **is ruled then, not now**. |
| 2 | `#cc-asst`'s fate | ✅ **Retired** when the dock owns the door. Ledger is genuinely **net 0**; Contract A2 holds; the static `AI ASSISTANT · ONLINE` gauge at `:13955` **dies with the card** rather than needing its own B10 ship. |
| 3 | Ghost art | ✅ **Commission a matching cut** — `icons/phantom-nav-*-vN-256.webp`, 256×256, `loading="eager"`, with a dim state that reads at arm's length. Reusing `phantom-ghost-v3.webp` **rejected** (107×122 card art, never cut as a lit/dim pair). Web-Claude task, Phase 1 dependency, **no precache until a consumer exists**. |
| 4 | The harness CORS red (A2) | ✅ **Route intercept in the fixture.** Widening `BENIGN_CONSOLE` **rejected** — *"never widen the console allow-list to get green"*. The in-spec filter `.584` used is rejected as the general fix. Harness-only, no app source, may land **in parallel** with `.586`'s device verify. |

**Still NOT ruled, and must not be assumed:** `#cs-nav-ext`, the desktop side-nav EXIT at **`:16561`** — INTEL-DOCK is silent on it and **the default stands: leave it**, per the `.576` pattern · SYS's other nine items (section 2c) · the Next Action card on Build.

**And one gate that is not the owner's:** ship discipline allows only one unverified ship in flight. `.586` (ICON REFRESH) is built and unadjudicated, so INTEL-DOCK **cannot be built** until `.586` has been on the phone and ruled through `verify.ps1`. The rulings are banked; the harness ship in item 4 is the one piece that proceeds in parallel.

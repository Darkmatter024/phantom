# FIRST-DOOR · SHIP B FAMILY B-1 — PHASE 0 EVIDENCE ("Get data in")

**Commission:** `SHIP-HANDOFF-FIRST-DOOR.md` §3 **B-1**, which is also PUNCHLIST **P-6**.
**Baseline:** `main` @ `3f6ab08`, **`phantom-v1.14.571`** — ⛔ not the `.570` the spec was written against.
**Method:** direct grep against the verified working-tree source. No graph, no probe, no device.
**Status:** ⛔ **EVIDENCE ONLY. NOTHING SHIPS FROM THIS DOCUMENT.** Three rulings are owed before any patch.

---

## §0 · SETUP DEVIATIONS — REPORTED, NOT HIDDEN

`SHIP-HANDOFF-FIRST-DOOR.md` §0 requires a setup pass and says *"if graphify did not run, stop and say
so — do not proceed on a stale graph."* Three items deviate and are recorded rather than skipped
quietly:

| §0 item | Status |
|---|---|
| 0.1 `graphify . --update` | ⚠ **NOT RUN — the flag does not exist in this build.** `graphify --help` at 0.9.15 lists only `install / uninstall / path / explain / diagnose`; there is no `update` command and no `--update` flag. The existing `graphify-out/wiki/index.md` is stamped **2026-09-02 13:01**, which **predates `.571`**. ⭐ **Every anchor below therefore comes from direct source grep**, which is what the spec's own baseline line demands — *"all anchors from verified source, no assumed anchors"* — and is strictly stronger than the graph for this purpose. |
| 0.2 / 0.3 Playwright + iPhone profile | ⚠ **NOT CHECKED.** `mcp__playwright-iphone__*` is listed as available to the session but `/mcp` was not run. **Nothing in this Phase 0 depended on it** — B-1 Phase 0 is read-only. It gates the PATCHING phase, and must be confirmed before Ship B-1 edits. |
| 0.4 state + docs | ✅ **DONE, with one correction to the spec's expectation.** It reads *"`PHANTOM_CURRENT_STATE.md` reads `.570 VERIFIED`"*; state is now **`.571 VERIFIED`** (owner device pass, 2026-09-02). All four governing docs are in the repo: `SHIP-HANDOFF-FIRST-DOOR.md` and `SHIP-HANDOFF-MASTER-TRUTH.md` were **missing and were imported verbatim** at `ec8786d` (17631 bytes / `b007a49c…` and 7035 bytes / `f4593814…`). |

⛔ **EVERY `file:line` BELOW IS VALID AT `.571` AND NOWHERE ELSE.** F-4b: an anchor is only valid against
a stamp. `.571` inserted 46 lines at `:19392`, which moved everything after it. Re-sweep before use.

---

## §1 · THE FAMILY, ENUMERATED

Every button/label instance that plausibly belongs to *"get data in"*, with the handler it calls and
what that handler actually does.

### Loads a Master (six entrances, ONE function)

| Label | file:line | Handler | What it does |
|---|---|---|---|
| `LOAD MASTER` (Command ingest zone) | `:14029` `#cc-ingest-zone` (label `:14031`) | `cmd_loadMaster()` `:23754` | calls `master_loadFile()` then `cmd_render()` |
| `Load Master` (desktop shell nav) | `:16587` `#cs-nav-mst` | `cmd_loadMaster()` | same |
| `LOAD MASTER` (Build zero-state CTA) | `:22159` `.bw-cta` | `cmd_loadMaster()` | same |
| `LOAD MASTER FILE` (Master empty state) | `:36347` | `master_loadFile()` | **THE loader** — `async function` at `:36237` |
| `TRY AGAIN` (Master empty state) | `:36338` | `master_loadFile()` | same loader |
| `RE-IMPORT MASTER` (cable no-data card) | `:36872` | `master_loadFile()` | same loader |

⭐ **THE SINGLE MOST IMPORTANT FINDING, AND IT MAKES B-1 MUCH CHEAPER THAN THE SPEC ASSUMES.**
**There is already exactly one loader.** All six entrances converge on `master_loadFile()` (`:36237`,
exported at `:36268`) — three of them indirectly through `cmd_loadMaster()`. **B-1 is not untangling
six implementations of "load a Master"; it is removing five ENTRANCES to one function.** The spec's
*"~8 doors → 1"* framing counts labels, not implementations, and the implementation work is already
done. ⚠ **`RE-IMPORT MASTER` (`:36872`) is a sixth entrance that is NOT in the spec's list** — the
list names eight labels and misses this one, so any grep gate written from the spec alone would leave
it standing.

### Navigation to the Master surface, NOT a loader

| Label | file:line | Handler | What it does |
|---|---|---|---|
| `MASTER FILE` (Build row + back header) | `:16428`, `:14112` | `rd_openMasterFile()` `:21550` | `showPage('master')` + `master_showSection('file')` — **opens a screen, loads nothing** |

⚠ **This one is mis-classified by the spec's own table**, which counts `MASTER FILE` among the
data-in buttons. It is a door to the surface where the loader lives. Under B-1 it does not "close" —
it becomes the SYS → MASTER path, or it is removed as a duplicate of it. **That is a ruling, not a
mechanical deletion.**

### The Master banner's existing actions

| Label | file:line | Handler | What it does |
|---|---|---|---|
| `Replace` | `:37020` | `master_onReplaceTap()` `:37306` | opens picker, runs guard in `preCommit`, then `PHANTOM_MASTER.clear()` |
| `Purge cache` *(conditional)* | `:37010` | `master_purgeCached()` `:34779` | evicts the persisted snapshot; confirm-gated; *"Field-verify status is NOT touched"* |
| `Set PIN` / `PIN: ON` | `:37023` | `deviceLead_promptSetPin()` | sets/changes the gate itself |
| `SCOPE A JOB` | `:37027`–`:37029` (handler on `:37028`) | `mscope_open()` | unrelated function, shares the banner |

### Not a Master at all — the spec lists these, the source says otherwise

| Label | file:line | Handler | What it actually imports |
|---|---|---|---|
| `IMPORT PORT LIST` | `:52443` | `importFileToInput('bd-ports-input')` `:52729` | a port list, into a textarea |
| `CSV FILE` | `:45808` | `bomIngest_pickFile()` `:46566` | a BOM |
| `INGEST ANOTHER` ×2 | `:46089`, `:46118` | `bomIngest_startOver()` | resets the BOM ingest flow |
| `IMPORT FILE` (audit) | `:53921` | `AUDIT.importFile()` | an audit file |
| `IMPORT FILE` (assistant) | `:50968` | assistant attach | `.txt · .log · .json · .eml · .csv` into the assistant |

⛔ **NONE OF THESE FIVE LOADS A MASTER.** B-1's own text anticipates this — *"if any of them imports
something that is not a Master… it becomes a rack-scoped action on the rack that owns the port map,
not a top-level button"* — so they are **B-E4 material, not closable duplicates.** A grep gate that
drove every `IMPORT` label to zero would delete five working, distinct features.

---

## §2 · ⛔ TWO PREMISES THE SOURCE CONTRADICTS

These are recorded the way the ISOLATE premise was: **the spec asserts something the code does not
do, and the trace refutes it before anything is built.**

### C-1 · THERE IS NO "DELETE MASTER" TODAY

P-6 states *"Delete is PIN-gated (correct)"* and B-1 specifies the surviving door's actions as
**Load / Replace and Delete (PIN)**. **Neither exists as a Delete.** The Master banner offers
**Replace** (`:37020` — which loads a new Master OVER the old one) and, conditionally, **Purge cache**
(`:37010` — which evicts the persisted snapshot). Grep finds no delete-the-Master control.

⛔ **CONSEQUENCE: B-1 as written would ADD A NEW DESTRUCTIVE ACTION, not re-home an existing one.**
That is a different risk class from "close duplicate doors", and the spec's door ledger (`+1 SYS→MASTER,
−N old paths`) does not account for it. **Owner must rule** whether B-1 ships a real Delete or whether
the surviving door carries **Replace + Purge cache** and Delete is deferred to its own ship.

⚠ **This is the same question MASTER-TRUTH E-9 raises from the other side:** if `s1:002` is active
while the Master lacks its platform, then whatever clears or replaces a Master is already failing to
reconcile the active-rack pointers — and a NEW Delete would inherit that defect on day one.

### C-2 · THE PIN GATE IS CONDITIONAL AND OPT-IN, NOT STANDING

`deviceLead_requireForMaster()` (`:27315`) opens:

    if (!deviceLead_hasPin()) return true;

**On a device with no PIN set it returns true — it allows.** `master_onReplaceTap` then falls back to
a destructive confirm dialog (its own comment cites *"v1.6.71 option C"*), and `master_purgeCached`
(`:34779`) has **no PIN check at all** — only `phantomConfirmAsk`. The PIN is set by an opt-in button
on the same banner (`:37023`).

⛔ So *"Delete is PIN-gated (correct)"* is **not accurate as written**. The honest statement is: *a
destructive Master action is PIN-gated only on devices where a Lead PIN has been set; elsewhere it is
confirm-gated.* **Owner must rule** whether B-1 makes the gate standing (a PIN is required before any
destructive Master action, i.e. the flow forces one) or preserves today's opt-in behaviour.

---

## §3 · B-E1 — THE ONE SURVIVING DOOR

**SYS → MASTER**, per P-6 and B-1. Its handler is **already** `master_loadFile()` (`:36237`); no new
loader is written. The surviving label is the single string `LOAD MASTER`.

⚠ **What the surviving door must SHOW is not yet built.** P-6 requires *"loaded Master filename +
saved date + source (uploaded / restored from cache)"*. The banner today renders
`siteCode · totalRacks racks · loaded ts` (`:37017`, banner opens `:37015`) plus a provenance extra, and the Master object
carries `sourceFile`, `savedAt`/`ingestedAt` and `restoredFromStorage` (seen at `:34483`, `:34781`).
**The fields exist; the composition does not.** That is Ship work, not evidence, and it is flagged so
the ship is not scoped as "move a button".

---

## §4 · B-E2 — DEPENDENCIES ON THE CLOSING INSTANCES

| id / class | refs | Note |
|---|---|---|
| `master-banner-replace` | **6** | ⛔ **NOT a Replace-only class.** The same class is worn by **Replace, Set PIN and SCOPE A JOB** (`:37020`, `:37023`, `:37027`). Closing "Replace" by class would take three buttons with it. **Must be surgical, per-element.** |
| `bw-cta` | 12 | Shared Build CTA class, not Master-specific. Only the `:22159` instance is in scope. |
| `master-empty-retry` | 3 | `TRY AGAIN`, Master empty state. |
| `master-cbl-nd-btn` | 2 | `RE-IMPORT MASTER`, cable no-data card. |
| `cs-nav-mst` | 1 | Desktop shell nav — safe, single reference. |
| `cc-ingest-zone` | — | Command's full-height no-Master tap target; gated on `#pg-cmd[data-master="0"]`. ⚠ **Ship A also removes this** — coordinate, do not delete twice. |

---

## §5 · B-E3 — PLAYWRIGHT COVERAGE: ⛔ ZERO

Grep across `test/e2e/*.spec.js` for every label in §1 **and** for every handler
(`master_loadFile`, `cmd_loadMaster`, `rd_openMasterFile`, `master_onReplaceTap`,
`master_purgeCached`, `bomIngest_pickFile`, `importFileToInput`) returns **no matches**. The
Master-related specs (`09-master-binding`, `14-master-staging`, `15-dual-source-master`,
`16-normalization-migration`, `17-reimport-idempotence`, `22-data-contract`) seed storage directly
and never drive these controls.

⛔ **B-1 HAS NO TEST SAFETY NET.** This inverts the spec's expectation: §3 assigns the Healer to
"repair tests whose selectors broke", but **there are no such tests to break.** The risk is not
broken tests — it is an unguarded destructive path.

⭐ **Recommendation (owner rules):** the Playwright Generator writes coverage for the surviving door
**BEFORE** the B-1 edit, not after — at minimum: load a Master through SYS → MASTER; Replace with the
guard refusing; Replace with the guard passing; and, if C-1 rules a Delete in, the PIN path and the
wrong-PIN refusal. A ship that adds a destructive action to an untested family with no test written
first is the shape this repo has been bitten by.

---

## §6 · B-E4 — GENUINELY DISTINCT MEMBERS (OWNER RULES)

| Member | file:line | Proposed home under the rack model |
|---|---|---|
| `IMPORT PORT LIST` | `:52443` | **Rack-scoped action** on the rack that owns the port map — B-1's own text prescribes this. |
| `CSV FILE` (BOM ingest) | `:45808` | Stays with the BOM flow; it is a BOM door, not a Master door. |
| `INGEST ANOTHER` ×2 | `:46089`, `:46118` | Stays — it is a flow-reset control inside BOM ingest, not an entrance. ⚠ Two instances call one handler; if the owner wants it reduced it is a BOM-flow ship, not B-1. |
| `IMPORT FILE` (audit) | `:53921` | Stays with the audit surface. |
| `IMPORT FILE` (assistant) | `:50968` | Stays with the assistant attach flow. |
| `MASTER FILE` | `:16428` | ⚠ **Not distinct — it is the duplicate NAVIGATION door** to the same surface SYS → MASTER will be. Ruling: does the Build row close, or become the SYS path? |

---

## §7 · ✅ RULED BY THE OWNER, 2026-09-02 — B-1 IS UNBLOCKED

All three questions below were ruled the same day this document was written. **The rulings are
recorded verbatim in substance; the questions are kept so a later reader sees what was asked.**

### ✅ C-1 — REPLACE IS PRIMARY, DELETE IS SECONDARY. BOTH EXIST.

> **REPLACE (PIN) is the primary action** — purges old, loads new **in one motion**, because the real
> scenario is *"wrong Master at the site, corrected one ready."* **DELETE (PIN) is secondary**, for
> clearing a device. **Both under SYS → MASTER.**

⭐ **This answers C-1 in the affirmative and then some: Delete IS built, and it is a new action.** The
ship therefore adds a destructive control that did not exist, which is why §5's test ruling below is
not optional. ⚠ **REPLACE must stay ONE MOTION** — today `master_onReplaceTap` (`:37306`) already has
this shape (picker → guard → `PHANTOM_MASTER.clear()` → commit), so the ruling matches the existing
mechanism rather than asking for a new one. **Do not split it into delete-then-load**; a half-applied
replace is exactly the split-brain Contract A1 forbids.

### ✅ C-2 — THE PIN IS STANDING, NOT OPT-IN

> **PIN is STANDING, not opt-in.** Set on first use if none exists; **always required after.**
> **Protect it with the PIN, not by hiding it** — a tech with the PIN does replace in under 30
> seconds from any screen.

⛔ **THIS INVERTS `deviceLead_requireForMaster` (`:27315`).** It opens `if (!deviceLead_hasPin()) return
true;` — *no PIN means allow*. Under this ruling **no PIN means PROMPT TO SET ONE, then require it**.
The confirm-dialog fallback in `master_onReplaceTap` (its *"v1.6.71 option C"* branch) and the
unprotected `master_purgeCached` (`:34779`) both come under the gate.
⭐ **"Protect it with the PIN, not by hiding it" is a DISCOVERABILITY ruling as much as a security one**
— it forbids the tempting mitigation of burying the destructive action, and sets a **≤30s from any
screen** bar that the stranger test must measure, not assume.

### ✅ B-E4 — THE FIVE NON-MASTER IMPORTS GO RACK-SCOPED; THE BUILD ROW CLOSES

> The five non-Master imports are **rack-scoped** — they become actions on the rack that owns the
> data (port map, BOM). **Build `MASTER FILE` row closes; it becomes SYS → MASTER.**

⚠ **`IMPORT FILE` (audit, `:53921`) and `IMPORT FILE` (assistant, `:50968`) have no obvious rack that
"owns" them** — an audit is deployment-keyed (E-8 measured `phantom_audits_v1` carries no `rackId`)
and the assistant attach is conversational. **Flagged rather than assumed:** the ruling names port map
and BOM explicitly; those two are raised at design time rather than silently re-homed to a rack that
does not own them. This is the same flag Addendum B's guardrail requires.

### ✅ TWO PROCESS POINTS, ALSO RULED

- **Tests come FIRST.** *"Generator writes B-1's Playwright tests BEFORE the edit. A destructive path
  gets a guard before it exists."* ⭐ This closes §5's zero-coverage finding as a **requirement**, not
  a recommendation.
- **Ship A owns the shared elements.** `#cc-ingest-zone` (`:14029`) and the Build CTA (`:22159`)
  **belong to Ship A's removal list; B-1 does not touch them.** ⭐ This resolves the BOUNDS overlap at
  the foot of this document — **it is no longer unresolved.**
- **Order: Ship A first, then B-1.**

---

## §7a · THE ORIGINAL QUESTIONS, KEPT FOR THE RECORD

1. **C-1 — Delete.** Does B-1 ship a real `Delete (PIN)`, which is a NEW destructive action, or does the
   surviving door carry **Replace + Purge cache** with Delete deferred to its own ship?
2. **C-2 — the gate.** Standing PIN (forced before any destructive Master action) or today's opt-in,
   confirm-fallback behaviour?
3. **B-E4 homes** — §6's table, and specifically whether `MASTER FILE` (`:16428`) closes or becomes the
   SYS → MASTER path.

⚠ **Also owed, and not a ruling:** confirm §0.2/§0.3 (Playwright + iPhone profile) before edits, and
decide whether Generator writes B-1 coverage first per §5.

---

## BOUNDS

- ⛔ **Paper. No code, no anchors re-cut, nothing staged.**
- ⛔ **Every `file:line` is valid at `.571` only** and must be re-swept by the ship that uses it (F-4b).
- ⛔ **Counts in §1 are label instances found by grep of the working tree**, not a rendered-DOM census.
  A label that renders twice from one code path counts once here.
- ✅ **Ship A overlap — RULED 2026-09-02, no longer open. Ship A deletes them; B-1 does not touch them.** The finding as first written read: `#cc-ingest-zone` (`:14029`) and the Build CTA
  (`:22159`) are both on Ship A's removal list AND in this family. **A/B sequencing must decide which
  ship deletes them; deleting in both is a merge conflict waiting to happen.**

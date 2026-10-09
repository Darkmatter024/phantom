# PHANTOM — Duplicate & Conflicting Systems Audit
**Basis:** `dct-ios.html` @ v1.14.394 (`71d4279`). Specialist audit.
**⚠️ VERIFICATION STATUS:** unlike audits 01–06, the claims below were **not** independently re-verified by the Principal Integration Owner — context budget was exhausted. They are well-evidenced and internally consistent, but **every load-bearing claim must be re-confirmed before it drives an edit.** Treated as high-confidence leads, not settled fact.

---

## Q1 — The rack elevation has SEVEN render paths, not four

| # | Function | Line | Output | Colour source |
|---|---|---|---|---|
| 1 | `rackElevation_render3D` | 34923 | WebGL Inspection Bay | `TYPE_COLOR` JS @19056 |
| 2 | `forge3d_render` | 19066 | WebGL cold-aisle walk | `TYPE_COLOR` JS @19056 |
| 3 | `rackElevation_buildHtml` | 36204 | FLAT DOM, 44px/U | **CSS** @10439 / @10455 |
| 4 | `renderElevation` | 44865 | FLAT DOM, 22px/U, drag | `TYPE_COLORS` JS @44339 + `.rm-type-*` @2441 |
| 5 | `master_buildElevationRail` | 32893 | Master chassis faces | **CSS** `.mef-*` @6698 |
| 6 | `scrubbar_buildHtml` | 36361 | Minimap strip | CSS @10259 / @10637 |
| 7 | `cmd_rackHeroFlat` / `cmd_rackHero3D` | 21778 / 21790 | Command hero | delegates to #3 / #1 |

**No path is globally authoritative.** Renderer consolidation must cover 7 surfaces, not the 3 the renderer map could see from the WebGL side.

---

## Q2 — ⚠️ THE FLAT ELEVATION IS MONOCHROME FOR 9 OF 10 DEVICE TYPES

**This is the highest-impact field-visible defect in the audit set.**

`master_rackToElevation` @32613 emits **RAW** codes — `gpu · sw · pwr · patch · stor · cpu · cdu · fw · media · other`. `rackElevation_buildHtml` @36255 writes those RAW codes straight into `data-type`. But the CSS that colours them @10439 and @10455 is keyed on the **EDP** vocabulary (`switch`, `storage`, `cooling`, `server`, `network`, `compute`, `pdu`, …).

**Intersection = `{gpu}` only.** Every `sw`/`pwr`/`stor`/`cpu`/`cdu`/`fw`/`patch`/`media`/`other` device falls through to the base rule @10450 — uniform grey. Same defect in the minimap @36399.

It is acknowledged in-code at @19044 as "a PRE-EXISTING elevation bug, NOT introduced here; owed its own ship" — and never shipped. **A technician looking at a FLAT elevation sees one colour for nine different device classes.** Fix is one line: `_TMAP` the type before writing `data-type`, or add the RAW keys to the CSS.

---

## Q3 — ⚠️ SIX device-type colour vocabularies, ZERO rows in agreement

| Concept | `TYPE_COLOR` @19056 | `TYPE_COLORS` @44339 | FLAT rd @10455 | `.mef-*` @6698 | minimap @10637 |
|---|---|---|---|---|---|
| **GPU** | `#28e0ff` cyan | `#a855f7` **purple** | `#5cf2ff` | `#5cf2ff` | `#1fffd0` **teal** |
| Switch | `#8a4bff` | `#5cf2ff` | `#9b59ff` | `#9b59ff` | `#8a4bff` |
| PDU | `#ffcb45` gold | `#ffd60a` | `#30d158` **green** | `#ffd60a` | — |
| Patch | `#1fffd0` teal | `#a3a300` | — | `#7dd3fc` sky | — |
| Server | `#7fd0ff` | `#30d158` | `#8AAFBF` | `#60a5fa` | `#5d7488` |
| Storage | `#ff7bd0` pink | `#00bcd4` | `#ffd60a` | `#c084fc` | `#ffcb45` |
| CDU | →PDU gold | →**"Storage"** cyan | — | `#34d399` green | — |
| Firewall | →switch violet | →**"Other"** grey | — | `#ff7b54` orange | — |
| Unknown | `#ff2bd6` magenta | `#486070` | — | `#8AAFBF` slate | — |

**GPU has four different values.** The Rack Map paints GPUs *purple* while the 3D bay paints them cyan and the minimap paints them the colour the bay reserves for patch panels. PDU is gold in every JS map and **green** in the FLAT rd accent (grouped with cooling @10471).

Worse, three maps **disagree about what a device is**, not just its colour: `cdu` is a PDU in `_TMAP`, "Storage" in `TYPE_COLORS` @44358, and its own green on the Master rail. `fw` is a switch in `_TMAP`, "Firewall/grey" in `TYPE_COLORS` @44359, orange on the rail.

And `other`→`unknown` is **magenta** ("we could not classify this") in 3D but neutral **slate** on the Master rail — **inverting the honesty signal** that @19049 was written to protect.

**Ruling (mine):** `_TMAP` → `TYPE_COLOR` is the only map with a written provenance trail. It becomes the single source; the CSS is derived from it, not hand-maintained alongside it. Every future colour ruling currently has to be applied in six places or it drifts — that is not a maintainable product.

---

## Q4 — Phase label maps

- `DEPLOY_PHASE_LABELS` @28373 and `DEPLOY_PHASE_LABELS_FULL` @28374 are **byte-identical and both live** (~9 and ~24 call sites). Renaming one silently desyncs half the app. Delete one.
- `CS_STEP_SHORT` @21432 says `CPU`; `PHDOCK_SHORT` @36520 says `COMP` — same phase, two adjacent rails.
- `DEPLOY_PHASE_COLORS` @28375 maps `mechanical` and `power` **both to `var(--gold)`** — the only two-phases-one-colour collision.

---

## Q5 — Duplicate utilities

- **Four HTML escapers**: `escHtml` @16984, `master_escHtml` @32310, `master_escAttr` @32316, `_fesc` @19255. **Behaviour differs**: `escHtml(0)` → `''` (falsy guard erases legitimate zeros); `_fesc(0)` → `'0'`.
- **Two toasts**: `phantomToast` @50142 uses `textContent`; forge-local `showToast` @19940 uses **`innerHTML`** — different escaping posture for the same job.
- **Blocker/handoff picker family** @22796/@23106 etc. — `_blocker_listDeployments` and `_handoff_listDeployments` have **byte-identical bodies**; four render pairs differ only in a noun and an accent colour.
- **No shared `debounce()` helper.** Four independent debouncers: @43601, @33194, @44478, @22469.
- **No shared date formatter.** `formatDate` @45241 and `fmtTs` @46670, plus **34 hand-rolled `toLocale*` sites** with ≥6 option shapes.

---

## Q6 — Two Master search surfaces, confirmed

| | Master tab | Rack search |
|---|---|---|
| Handler | `master_onInput` @33195 → `master_runFilter` @33252 | `rmSearch_request` @44815 → `_rackResolve` @43988 |
| Resolver | direct `racksByCab` @33059 | 4-tier cascade @44051 |
| Renderer | @32348 / @32893 | @32752 → @44865 |
| Palette | `.mef-*` @6698 | `TYPE_COLORS` @44339 |

Same cabinet, two renderers, two palettes, two debouncers. `master_renderHit` @32754 also silently **reshapes** the rack where the other path passes the whole record.

---

## Q7 — Dead code (candidates, re-confirm before deleting)

**9 functions with zero references**: `bom_scope_listByDep` @39211, `bom_item_create` @39229, `bom_item_listByScope` @39262, `bom_classify_clearOverride` @39494, `bom_audit_listByDep` @39653, `progress_get` @39748, `progress_listByStatus` @39816, `deploy_activeRacks` @34091, `scrubbar_openSnapped` @36496. The BOM/progress cluster is a complete unused CRUD layer.

**DORMANT (a caller exists but is unreachable)** — distinct from dead:
- `cmd_rackHero3D` @21790 — welded shut by the bare `return` at @21875; everything after @21876 is unreachable. Owner-ruled "retained, unused."
- `DEPLOY_TOOLS[].img/.icon/.ac/.meta` @29493 — only `meta.name` is read. 9 webp paths + 9 SVG glyphs with no consumer.
- `OPS_TABS.sops` @22378 — a **live function writing into a hidden host**. Ships ≠ renders.

**~120 dead CSS classes** in clusters: `.eh-*` (14), `.ei-*` (20), `.intake-*` (~19), `.hud-*` (~13), `.is-state-*` (6), `.rd-*` (~18). **Caveat the specialist flagged:** classes added via `el.className = someVar` are invisible to their method. Re-run `node tools/inventory.js` per class before deleting anything.

**~850 KB of orphaned assets**: 21 unreferenced icons plus `plate.webp` (467 KB) and `plate-wide.webp` (383 KB) at repo root. Note the pattern — `phantom-nav-{build,exit,home,tools}-v2-256.webp` are live and their non-`v2` originals are orphaned. **Versioning-by-filename leaves the predecessor behind every time.** `phantom-ui-assistant-v2-256.webp` is now orphaned too, which means CLAUDE.md's current-state block is stale.

---

## Q8 — Conflicting CSS

**The `.310` SURFACE-GLOW block @53146** declares `background`, `border`, `box-shadow`, `filter` all `!important` over `.lens`, `.nba`, `.stat`, `.tile`, `.gx*`. It **silently voids four base card rules** at @9328, @9499, @9509, @9529. Because `--glow-a: 0%` @8842, the glow layer currently computes to transparent — so the block is doing nothing visible beyond forcing a neutral hairline, **while making every base rule inert.** Any future edit to those four base rules will not paint.

`.gsk` @11965 is documented as "the ONLY sanctioned `!important` in the glass system" — the `.310` block adds six more on overlapping elements.

Note a wrong comment: @12244 claims `#pg-cmd .sigrow` wins on "equal specificity, later source." It actually wins on the `#pg-cmd` **id**. The comment misstates the mechanism, which matters the next time someone reorders that file.

**Design-Law-5 token drift is live in both directions**: the mock hexes `#28e0ff`/`#8a4bff`/`#ffcb45`/`#1fffd0` appear **54 times** — hard-coded into `DEPLOY_TOOLS[].ac` @29493, the OPS-wall `--tac` @13482, the Work banners `--rfac` @13474, and all of `TYPE_COLOR` @19056 — while the live `:root` values appear 125/26/60 times. Both sets ship simultaneously.

---

## Priority ledger

| P | Item | Why |
|---|---|---|
| **P0** | Q2 — FLAT elevation monochrome for 9/10 types | Field-visible; a tech cannot distinguish device classes |
| **P0** | Q3 — six colour vocabularies, zero agreement; three disagree on device *identity* | Every colour ruling drifts across six places |
| **P1** | Q1 — 7 rack renderers | Sets the true scope of the `RackExperience` consolidation |
| **P1** | Q4 — `DEPLOY_PHASE_LABELS` / `_FULL` byte-identical, both live | Rename-desync trap |
| **P1** | Q8 — `.310` `!important` block voids 4 base rules | Silent no-op on future edits |
| **P2** | Q5 — escaper/toast/debounce/date duplication | `escHtml(0) → ''` is a real data bug |
| **P2** | Q7 — dead code + 850 KB orphaned assets | Re-confirm per item first |

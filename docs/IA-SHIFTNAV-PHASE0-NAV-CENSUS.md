# IA-SHIFTNAV — PHASE 0 NAV CENSUS

**Commission:** `SHIP-HANDOFF-IA-SHIFTNAV.md` Phase 0 (E-1…E-5), as amended by Addendum A.
**Baseline:** `main` @ `6554246`, `phantom-v1.14.557`, verified and stamped.
**Method:** verified source + graphify wiki (rebuilt this session, 1,846 nodes) + a throwaway
Playwright census probe run at **390×844 on phone-webkit**, since deleted.
**Status:** EVIDENCE ONLY — no design, no patches, nothing shipped. Phase 1 is not started.

---

## ⛔ HEADLINE: THE SPEC'S PREMISE IS WRONG, AND SHIP 1 AS WRITTEN WOULD BUILD A SECOND DOOR

> *"Deploy Optics currently has **no navigation path at all** — reachable only by URL/dev means."*
> — base spec, problem statement

**Measured at `.557` on a 390px phone: false.** Deploy Optics has a working redesign door at
`dct-ios.html:13914`:

```html
<button type="button" class="cs-tool" onclick="rd_openOpsTool('optics')" aria-label="Optics">
```

The probe scrolled to it, tapped it, and it opened: `currentOpsTab` became `"optics"`,
`document.body` gained `ops-detail`, and `#ops-tool-host` received **10,586 characters** of rendered
panel. `rd_openOpsTool` (`:32254`) calls `OPS_TABS[tab](sub2)` — the identical renderer
`showOpsTab('optics')` invokes. **It is the same surface through a different handle.**

**That door is not new.** `git log -S` puts it in **`v1.14.383`** (`52fb96d`, command shell desktop
composition), and **`v1.14.425`** (`OWNER OVERRIDE: the Command Deck composition renders at EVERY
width`) made it phone-visible. Both predate `.544`, when `docs/LEGACY-RETIRE-STRANDED.md` was
re-verified and concluded Optics' *"sole door"* was the legacy `.stab`. **The re-verification
searched `showOpsTab(` and missed `rd_openOpsTool(`** — the same entity behind a second name.

⭐ **This is the recorded lesson landing again: a name-based grep is evidence about NAMING, never
about EXISTENCE.** The `.544` note was careful, explicitly re-checked against source, and still
inherited a wrong verdict because it searched for one of the two spellings.

---

## THE REAL PROBLEM IS FINDABILITY, NOT STRANDING

Every Command Deck tool door sits **2.4–2.9 screens below the fold**, with no nav affordance
pointing at them. Measured, 390×844:

| Tool door | Offset from top of Command | Screens down |
|---|---|---|
| BOM · Manifest | 2003px | 2.4 |
| Port Map · Rack Map | 2107px | 2.5 |
| SOPs · Burndown | 2211px | 2.6 |
| Audits · Blast | 2315px | 2.7 |
| **Optics · Isolate** | **2419px** | **2.9** |

`#cmd-shell` is **390 × 2905px** at phone width; `#cs-fieldtools` starts at y≈1930. A tech must
scroll nearly three screens down Command, with nothing telling them to, to reach any tool.

**That is exactly the "couldn't find X" failure the spec exists to prevent** — but it is a
findability defect, not a missing door. **Ship 1 as written ("Deploy Optics gains a navigation
entry point") would add a SECOND door to a surface that already has one**, leaving nine sibling
tools equally buried. That is a one-surface patch on a ten-surface problem.

---

## E-1 · REACHABILITY MAP (390px, from cold launch)

| Surface | Entry point | Taps | Notes |
|---|---|---|---|
| Command (Command Deck) | launch default | 0 | `#cmd-shell`, 2905px tall |
| Build | `#bn-work` | 1 | `pg-work` |
| Tools | `#bn-ref` | 1 | `pg-ref` grid, 7 cards |
| Deploy / Scan / Handoff / Blockers | Build sub-tabs + Command actions | 1–2 | `cmd_route('work', …)` |
| Rack detail | Build → rack card | 2–3 | also deep-link/back-nav restore |
| Optics **reference** | Tools → OPTICS card | 2 | `showRefTab('rf-optics')` |
| Platforms / CLI·IB / Parts / Know / Compass / Ghost Echo | Tools grid | 2 | |
| **10 OPS tools** (BOM, Manifest, Port Map, Rack Map, SOPs, Burndown, Audits, Blast, **Optics**, **Isolate**) | Command → scroll 2.4–2.9 screens → tool tile | **1 tap + ~2.9 screens of scroll** | `#cs-fieldtools` |
| Master file | `#cs-nav-mst` / Tools | 1–2 | |

⚠ **Tap count alone flatters this app.** Every OPS tool is "one tap" and effectively unfindable.
Phase 1's P-3 table must carry a **scroll-depth column**, or it will report the IA as healthy.

---

## E-2 · STRANDED SURFACES — THE LIST IS EMPTY

`OPS_TABS` holds 11 keys: `blast, sops, portmap, rackmap, optics, burndown, audits, bom, deploy,
manifest, isolate`. Every one has a reachable door at 390px:

- 10 via `#cs-fieldtools` (measured, tapped, confirmed rendering).
- `deploy` via Build's own sub-tab.

**No OPS surface is stranded at `.557`.** Deploy Optics — the one row IA-SHIFTNAV was created to
unstrand — is reachable, and so is ISOLATE.

📌 **Two dead doors found, neither stranding anything:**

1. **The legacy `#ops-tab-strip`** (`:16353`, inside `pg-sop`) still carries ten `showOpsTab(…)`
   pills. `pg-sop` is never shown under the redesign; all ten measured 0×0. Inert, not reachable.
2. ⛔ **The Build OPS row does not exist at runtime.** `ops_init()` is **disabled** —
   `dct-ios.html:19204`: *"GATE: ops_init() disabled at boot time due to phone-webkit test
   failures."* The probe confirmed `#ops-banner-container` is absent after tapping BUILD.
   **`OPS_PANELS_CONFIG` (`:21514`, 9 tools) and `ops_renderPanels` are shipped but never run.**
   ⚠ This means the owner ruling of 2026-08-19 — *Build's tool door IS the OPS row per
   SHIP-OPS-IN-PLACE* — **is not in effect on the shipped app.** Recorded, not acted on.

---

## E-3 · NAV CHROME AT 390px

Persistent bottom nav `#rd-botnav` — **122px tall, `display:grid`**, four slots:

| Slot | id | Size | Label |
|---|---|---|---|
| Command | `bn-command` | 95×93 | Command |
| Build | `bn-work` | 95×93 | Build |
| Tools | `bn-ref` | 95×93 | Tools |
| Exit | `rd-exit` | 95×93 | Hold to exit and freeze the app |

All four clear the 44px floor comfortably. `#cs-side` (desktop rail) is `display:none` at 390 —
correct. `body.className` is **`"rd cshell"`**: the Command Deck composition is on at phone width by
the `.425` owner override, and the older phone Command composition does not paint (`.cc-hero` 0×0).

⭐ **Three pillars, not five.** SHIFT and SCAN are not pillars — Contract A8 / defect D-1, and
Addendum A3's five-tab dock is the intended end state. **Addendum A3's SCAN icon art dependency may
already be satisfied**: `icons/phantom-nav-scan-v3-256.webp` and `phantom-nav-shift-v3-256.webp`
exist on disk, untracked, and `sw.js` documents them as deliberately held out of `PRECACHE_URLS`
"until a consumer draws them". Flagging early, as A3 asks.

---

## E-4 · ISOLATE

**Tap path from cold launch: Command → scroll 2,419px (2.9 screens) → tap ISOLATE. One tap.**
Confirmed opening: `currentOpsTab` → `"isolate"`, 3,711 characters rendered.
Its only door is the `#cs-fieldtools` tile at `dct-ios.html:13915`.

⚠ **P-3 constraint:** the spec says ISOLATE must not get worse. Its current cost is *one tap plus
three screens of blind scrolling* — almost any explicit placement improves it, but the tap count
will not show that. Measure scroll depth or the improvement is invisible.

---

## E-5 · WHAT CARRIES OVER FROM LEGACY-RETIRE STAGE 5

From `docs/LEGACY-RETIRE-STRANDED.md` (listed, not acted on):

- **Deploy Optics** — the single inherited row. ⛔ **Superseded by this census: it is not stranded.**
- **pg-twin** — resolved; needs deletion, not a door. Stage 6/7 work.
- **pg-triage** — superseded by `pg-cmd`; building a door would restore the page the redesign replaced.
- 📌 **Three dead-render writers into `pg-triage`** (`firstRun_renderChip`, `#qa-deploy-card`,
  `today_render`). ⚠ **`today_render` and the `pg-triage` page were deleted in `.555`** — that entry
  is now partly historical; re-verify before anyone acts on it.

---

## WHAT PHASE 1 SHOULD BE TOLD, BEFORE IT DESIGNS

1. **Ship 1's stated job is already done.** Re-scope it, or the ship adds a redundant door.
   The smallest honest first ship is now a **findability** change, not a door.
2. **The problem is uniform across ten tools**, not special to Optics. A fix for one is a fix
   for none.
3. **Two "Optics" surfaces exist and collide by name** — Deploy Optics (`OPS_TABS.optics`, the
   scanner/inventory) and the Optics *reference* (`showRefTab('rf-optics')`, fiber/MPO). The
   reference is 2 taps and easy to find; the deployment tool is 3 screens down. **A tester told to
   "find the optics tool" will land on the reference and believe they succeeded.** Addendum A's
   "nav labels use aisle language" applies here as disambiguation, not just tone.
4. **`ops_init` is disabled**, so an owner ruling about Build's tool door is not in force. Phase 1
   should not design around the OPS row without deciding whether it comes back.

---

## HONEST BOUNDS

- ⛔ **Not device-verified.** All of this is phone-webkit at 390×844. WebKit-on-Windows is not iOS
  Safari, per the harness's own warning. The scroll depths are layout facts and should hold, but
  the owner's lived "I got lost" experience is the real signal and it is not reproduced here.
- ⛔ **Seeded fixture, one deployment, one rack.** A real Master may lengthen the Command Deck and
  push the tool row further down, or a zero-state may shorten it. **The 2.9-screen figure is one
  measurement, not a range.**
- ⛔ **E-1 is scoped to OPS tools and primary surfaces**, not every modal, sheet and drawer in the
  file. A full leaf-level surface census was not attempted and would be a larger job.
- ⛔ **I did not chase why `ops_init` is disabled** beyond reading its gate comment. Phase 0 is a
  census; that is a defect investigation.
- The claim that `.544`'s note "searched one spelling" is inferred from its own quoted evidence
  (it cites `showOpsTab` and the legacy `.stab` only). **I did not interview the process** — the
  conclusion is about the artifact, not the author.

# PHANTOM — Product Surface Architecture Audit
**Basis:** `dct-ios.html` @ v1.14.394 (`71d4279`). Specialist audit, **re-verified and partially CORRECTED by the Principal Integration Owner.**

---

## ⚠️ CORRECTION TO THE SPECIALIST FINDING — read this first

The audit reported as its P0 headline that *"the BUILD landing is dead under `body.rd`"* — that `.bw-on` latches and never clears, accidentally hiding `#work-grid`, and recommended scoping or clearing `.bw-on`.

**The mechanism is real. The diagnosis is wrong, and the recommendation would have reverted an intentional design decision.**

`.bw-on` is added at `:20236`, `:20249`, `:20267` and removed nowhere. `#work-grid` is hidden by `:53351`, which beats `:8759` on source order at identical specificity (0,2,2,1). All confirmed.

But `:53350` — the comment directly above the rule — states the intent:

```
/* the launcher stands down under the redesign — preserved for ?legacy=1 */
body.rd #pg-work.bw-on #work-grid { display: none; }
```

**Phase 2 deliberately retired the `#work-grid` launcher and replaced it with the `#bw-shell` Build workspace.** Clearing `.bw-on` would resurrect a surface the owner already stood down. That is an "adapt instead of execute" error and it is rejected.

**The real defect is migration debt, not a CSS accident:** the launcher was retired without re-homing everything that lived only on it.

---

## The actual finding: two tools were stranded, and the ops-tool Back target was never updated

### D1 — SOPs has no door at all on the redesign ⚠️ CONFIRMED

`#work-grid`'s OPS wall `:13486` was the **only** redesign door to SOPs. The desktop `cs-tool` strip `:13304`–`:13309` covers BOM, Manifest, Port Map, Audits, Blast, Optics — **there is no SOPs cell.** The Build workspace `bw-tabs` `:20410` exposes only four tools:

```
20410  [['Port map','portmap'], ['BOM','bom'], ['Manifest','manifest'], ['Rack map','rackmap']]
```

SOPs is unreachable in the redesign, on every screen size. Compounding it, the "Suggested SOPs" tap in rack detail `:37051` calls `goOpsTab('sops')`, and `goOpsTab` under redesign **discards its tab argument** `:43495` and opens the Deploy Command Center instead.

### D2 — Optics inventory has no phone door ⚠️ CONFIRMED

Only remaining door is `cs-tool` `:13309`, which requires `?cshell=1` **and** ≥851px (`:53719`, `:53826`). On the iPhone — the primary device — there is no way in.

### D3 — Burndown / Audits / Blast survive, but only through Deploy detail

`deploy_detailTool(id,'burndown'|'audits'|'blast')` `:33930`–`:33933` still reaches them, and that door correctly returns to the detail it came from `:29574`. Reachability is intact; discoverability is not.

### D4 — `rd_openOpsTool`'s default Back target strands the user ⚠️ CONFIRMED

`:29551` defaults the back action to `wk_showGrid()`, which adds `.wk-grid` — but `.bw-on` is still latched, so it lands on the **hidden** grid.

Callers that pass an explicit backAction are safe: `bw-tabs` `:20413` (`showMode('work')`), `cmd_openHeroBay` `:22052` (`nav_back()`).
Callers that rely on the default and therefore strand: `cs-tool` `:13304`–`:13309`, `nav_restore` `:18463`, the stats RACKS tile `:21397`, `showPage` guard `:22268`, search hit `:43692`.

**Ruling (mine):** the default back action becomes `showMode('work')` — return to the Build workspace, the surface that actually replaced the launcher. `wk_showGrid()` is retired with the launcher, not preserved as a target that leads nowhere.

---

## D5 — Renderers writing into hosts that are hidden under redesign

| Renderer | Host | Status |
|---|---|---|
| `showOpsTab('rackmap'\|'bom'\|'manifest'\|'portmap')` `:22551` | `#ops-content` inside `#pg-sop` | **Always hidden under rd** — `.page` `:1065`,`:1069`. `deploy_showList`'s Rack Map button `:29590` calls this → **silent dead tap.** CONFIRMED as the documented dead-render-host class. |
| every `rd_openOpsTool` tool | `#ops-tool-host` in `#wk-deploy` | Renders **below** `#bw-shell`, which is `display:block` for all of `#pg-work` `:53349` with no drill-in guard — so tools paint underneath a live WebGL rack. |
| `redesign_homeHWRef` `:21295` | `#rf-hwref` | Silent `return` if source missing; placeholder text `:13563` stays. Same silent-host shape at `:21017`, `:21035`, `:20991`, `:21052`, `:21065`, `:21249`. |
| `#cc-sugg` / `#cc-chat` / `#cc-aistat` / `#cc-foot` | `#pg-cmd` | `display:none` below 1024px `:9430`,`:9470`,`:9481` — `shiftReport_generate` and `brief_show` have **no phone door**. |

---

## D6 — "One door per feature" is broadly violated

| Surface | Doors | Lines |
|---|---|---|
| Rack Map | 8 | 13485, 20410, 21397, 22052, 22268, 18463, 15756, 29590 |
| Scan | 8 | 13287, 13363, 13411, 13419, 13475, 16020, 20398, 22080 |
| Handoff | 8 | 13293, 13320, 13420, 13476, 13517, 16019, 22079, 23080 |
| Deploy | 7 | 13245, 13277, 13418, 13474, 13505, 20257, 22635 |
| Master ingest | 3 | 13328, 13398, 20241 |
| Blocker capture | 4 | 13365, 13409, 20399, 29408 |
| Open Aisle | 3 | 13036, 20348, 36840 |

Rack Map at 8 doors across 4 different rendering surfaces is the worst, and it is the same surface the renderer consolidation targets — the two problems have one solution.

---

## D7 — A mislabeled door (gloved-hand hazard)

OPS cell `:13490` carries `aria-label="Optics — fiber, form factors and MPO"` — that is the **Reference** card's description — but routes to `rd_openOpsTool('optics')`, the **inventory scanner** `:47237`. Two unrelated surfaces share the name "Optics". A tech tapping the label gets the wrong tool.

**Ruling (mine):** the tool becomes OPTIC INVENTORY; "Fiber · Form factors · MPO" stays with the Ref card `:13539`.

---

## D8 — Duplicate and inert surfaces

- **`#cmd-shell` `:13217`** — a complete second Command implementation behind `?cshell=1`/`?shell=1` `:12772`, `display:none` otherwise `:53224`. Independent site/health/tool wiring. **Consolidate into `#pg-cmd`.**
- **`#wk-deploy` stub `:13502`–`:13507`** and **`#wk-handoff` stub `:13510`–`:13519`** — inert interstitials, both bypassed by their chokepoints (`:20730`, `:22079`). **Delete.**
- **Header "FORGE 3D" `:13036`** — self-described PROVISIONAL door into Open Aisle. **Delete** as part of the renderer consolidation.
- **`rd_openMasterFile()` `:20116`** — its only caller was banner row `:13477`; now doorless. Master survives via the Command ingest zone `:13398` and age chip `:13328`.
- **Shift** is split across 4 half-surfaces, two of them desktop-only `:22092`, `:13312`, `:17722`, `:25115`. `version.json` already flags the bottom-nav fourth item reading EXIT `:16039` where the reference shows SHIFT.
- **Burndown** `:47392` overlaps the newer deployment-scoped `bw-worklist` `:20423`–`:20497`. **Consolidate into the worklist.**

---

## D9 — Surfaces confirmed healthy (do not touch)

- **Ref / Tools landing** `:13524` — cleanest landing in the app.
- **Checklist worklist** in Build — writes through `checklist_toggle`/`checklist_setNote` only, never a new writer `:20420`.
- **`hwMatrix_open()` `:26824`** — correctly forks rd→tab / legacy→sheet. This is the pattern to copy for any dual-house door.
- **Build's three-tier degradation** `:20235` / `:20248` / `:20267` — honest empty states, no silent blanks.

---

## Priority ledger carried into the architecture

| P | Item | Why |
|---|---|---|
| **P0** | Restore a SOPs door (D1) | A whole tool is unreachable in the shipping UI |
| **P0** | Repoint `deploy_showList` Rack Map `:29590` → `rd_openOpsTool` (D5) | Silent dead tap |
| **P0** | Default ops-tool back → `showMode('work')` (D4) | Every default-back tool strands the tech |
| **P1** | Phone door for Optic Inventory (D2) | Primary device has none |
| **P1** | Hide `#bw-shell` on drill-in (D5) | Tools paint under a live WebGL rack — also a renderer-lifecycle concern |
| **P1** | Fix `goOpsTab` `:43495` to honour its argument, or delete it and repoint 4 callers | Silent wrong-surface |
| **P1** | Split OPTICS naming (D7) | Mislabeled door |
| **P2** | Consolidate: rack rendering → one controller; Burndown → worklist; `#cmd-shell` → `#pg-cmd`; Shift → one surface | Duplicate systems |
| **P2** | Delete inert markup (D8) | Dead weight |

**UNVERIFIED, needs closing:** whether `runPortMapDirect` `:22411` requires the network (the tool copy at `:22407` says "Claude validates" — if true, Port Map is not offline-capable and the copy must say so); BOM's exact storage key set; whether `mscope_open`'s `deploy_ensureDeployPanelVisible` `:31735` interacts with `.bw-on`.

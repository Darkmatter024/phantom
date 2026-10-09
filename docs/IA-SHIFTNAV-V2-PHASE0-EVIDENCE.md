# IA-SHIFTNAV v2 — PHASE 0 EVIDENCE (E-8 · E-9 · E-10)

**Commission:** `SHIP-HANDOFF-IA-SHIFTNAV-v2.md` §4. The v1 nav census stands and carries forward
by v2's own terms; this document adds only E-8, E-9 and E-10.
**Baseline:** `main` @ `bcd0205`, **`phantom-v1.14.563`** — ⛔ **not** the `.562` v2 names.
**Method:** verified source, direct grep against the live file. No graph, no probe, no device.
**Status:** EVIDENCE ONLY — no design, no patches, nothing shipped. Phase 1 is not started.

---

## §6 · COMPREHENSION GATE

*Required by v2 before any design. In my own words, 138 words.*

> **What he wants:** a gloved tech standing at one rack to stop hunting. Everything about *that*
> rack on *that* screen, without having to remember where each piece lives.
>
> **Why rack-as-unit gets there:** it converts navigation into position. If you are on the rack, you
> are already where the answer is — there is nothing left to navigate to.
>
> **Looks like progress, violates §0:** adding a tidy `TOOLS` band to the rack screen that lists all
> ten. That is the chip row relocated, not closed — still a menu standing between the tech and the
> fact.
>
> **My one question:** seven of the ten tools store nothing keyed to a rack. When BURNDOWN renders
> "for this rack," do you want it filtered to that rack's slice — or should it stay a door because
> its answer is genuinely deployment-wide?

---

## ⛔ HEADLINE: v2's CENTRAL MOVE IS BLOCKED BY DATA SHAPE, NOT BY UI

v2 §1 places seven tools inside the rack — *"Optics / audits / port map / power / burndown / BOM /
manifest — **as rack-scoped views, not destinations.** They render for *this* rack because the tech
is on *this* rack."*

**Only one of the ten tools is rack-keyed today.** The other nine store their records against a
deployment, a job, an audit, or nothing at all. Rendering them "for this rack" is a **data-model
change**, not an information-architecture move — which sits directly against §7's *"No rebuilds."*

✅ **RULED (owner, 2026-09-01): THE TOOLS STAY DOORS, NO DATA CHANGE.** §1's *"rack-scoped
views"* wording is **STRUCK** for OPTIC LEDGER, AUDITS, BURNDOWN, BLAST RADIUS, MANIFEST, BOM,
PORT MAP and SOPs — they keep their existing scope and entry. ⭐ Still rack-scoped at zero data
cost: **ISOLATE** (carries `rackId`), **RACK MAP** (rack-addressed by input, seedable with the
current rack), and everything already on the rack screen — devices + U, the five phases, assign,
QR, log note, photos, flags, and `SEE IN AISLE` at `:41699`.

⚠ **§7 REQUIRES THIS BE SAID PLAINLY, SO IT IS:** the ruling **keeps eight doors**, and §0
promises the tech does not leave the rack to find a tool. **§0 is narrowed, not honored, for
those eight** — because their data is not keyed by rack and re-keying is not authorised.

⚠ **Phase 1 P-4 consequence:** the closable set becomes duplicate *paths* (`#cs-fieldtools`
versus the OPS row), not the tools. **P-4 reports the achievable net and names what it could not
close.** It does not manufacture a number to satisfy its own rule.

That was the single fact most likely to change Phase 1's shape, and it was reported rather than
designed around.

---

## E-8 · WHAT EACH TOOL READS, AND WHETHER IT IS KEYED BY RACK

Registries: `OPS_PANELS_CONFIG` `:21555` (the ten) · `OPS_TABS` `:24679-24824` (the renderers).

| tool | reads | anchor | scope |
|---|---|---|---|
| **ISOLATE** | `phantom_isolate_v1`; each session carries `rackId`, seeded from `_ctx_activeRackId()` | `iso_render` `:21787` | ⭐ **RACK** |
| RACK MAP | `rackViewer_request(id)` — the tech types or scans an id | `:49103` | rack-**addressed by input**, not by context |
| OPTIC LEDGER | `DEPLOY_OPTICS_KEY` → `{id, deploymentId, opticType, required, dispensed, installed, remaining}` | `:24887`, shape at `:24817` | **deployment** — carries no `rackId` |
| BLAST RADIUS | `power_loadTopology(dep.id)` | `:56429` | **deployment** |
| MANIFEST | `deploy_loadAll()` | `:32720` | **all deployments** |
| BURNDOWN | `safeGet(BURNDOWN_KEY)`, `BURNDOWN_KEY = 'dct_burndown_v1'`; entered via `BD.openJob()` | `:51685`, `:48149` | **job** |
| AUDITS | `phantom_audits_v1`, `phantom_active_audit` — zero `rackId` references in the namespace | `AUDIT` `:53674` | **audit** |
| SOPs | SOP library + tag filter chips | `:24681` | **global reference** |
| PORT MAP | paste box → AI validate; **stores nothing** | `:24707` | **stateless** |
| BOM | `bomTab_render` → ingest / progress sub-tabs; zero rack references in the dispatcher | `:46661` | deployment — ⚠ the sub-renderers were **not** traced to their store; stated, not assumed |

📌 The `deploy` renderer documents the whole schema in-file at `:24811-24819`. Only two stores carry
a rack: `phantom_deploy_racks_v1` (`{id, deploymentId, rackId, …}`) and `phantom_deploy_tasks_v1`
(`{id, phaseId, rackId, …}`). **None of the tool stores reference either.**

### Desktop rail

Nine tabs: `cs-nav-cmd` · `bld` · `scn` · `tls` · `dep` · `hof` · `mst` · `prf` · `ext`.
§3 requires each to become a rack-scoped view on the phone or be ruled desktop-only. That ruling
depends on the table above, since a tab inherits the scope of the data behind it.

---

## E-9 · HOW RACK DETAIL IS ENTERED, AND WHAT STATE IT NEEDS

**One function, thirteen call sites.** `deploy_showRackDetail(deployId, rackId)` `:41503`.

| path | anchor |
|---|---|
| deep link `rack:<dep>:<rack>` | `:18944` |
| Build workspace — current / next rack | `:22133`, `:22162` |
| blocker row | `:22418` |
| queue | `:22673` |
| job rack (string-built onclick) | `:22908` |
| scan / context resolve (calls `showMode('work')` first) | `:24005` |
| active context | `:25829` |
| deployment detail rack tiles | `:37968` |
| wrappers / routers | `:38510`, `:41390` |
| sibling-rack chip strip *inside* rack detail | `:41578` |
| discovery-log, deferred 100 ms | `:54285`, `:54290` |

**Guards:** deployment missing → `phantomToast('Deployment not found')` + return. Rack missing →
toast + fall back to `deploy_showDetail(deployId)`.

### ⭐ THE CONTRACT IS A PAIR, NOT A RACK ID

A rack is only addressable **within a deployment**: `deploy_loadRacksFor(deployId)` then
`racks.find(r => r.id === rackId)`.

§0 states three moves — load Master → pick rack → work the rack. The code has four levels:
Master → deployment → rack → work.

✅ **RULED (owner, 2026-09-01): THE DEPLOYMENT STEP STAYS, THE PICKER RESOLVES IT.** §0's three
moves stay true *for the tech*; the picker collapses the fourth level. ⛔ `deploy_showRackDetail`'s
signature does not change and **no entry path is refactored** — all thirteen keep working.

⭐ **The mechanism exists and is already proven in-file, so the picker reuses it rather than
authoring a second (Contract A2):** `ACTIVE_DEPLOYMENT_KEY` `:29686` · `deploy_getActiveId()`
`:29688` · `deploy_getActive()` `:29702`. **The working precedent is `:24005`** — it takes the
active id, scans that deployment's racks, matches `rs[i].rackId || rs[i].id`, and calls
`deploy_showRackDetail(aid, rs[i].id)`.

⚠ **Two fields, and confusing them is the trap.** `rackId` is the human label a tech reads and
scans (`s4:099`); `id` is the record id the entry matches on. `:24005` accepts **either** and
passes **`r.id`** onward. A picker that forwards the label lands on *"Rack not found"*.

⚠ **Residual for Phase 1, not blocking:** `deploy_getActiveId()` returns one deployment, so a
label present in two resolves to the active one **silently**. Whether labels can collide is
**unmeasured**. If they can, the picker owes a disambiguation, not a silent pick — Contract B14.

---

## E-10 · WHAT `ops_init` INITIALIZED, VERBATIM

`:21765`:

```js
function ops_init() {
  // ⛔ GATE: Only initialize OPS if Build workspace has fully rendered.
  // Inserting the OPS banner too early (during bw_render) causes WebGL/layout
  // cascade failures on phone-webkit. Let the Build workspace settle first.
  var bwShell = document.getElementById('bw-shell');
  if (!bwShell || !document.body.contains(bwShell)) return;
  if (!ops_ensureContainer()) return;
  ops_restoreState();
}
```

**Exactly three things:** a liveness gate on `#bw-shell`, the OPS banner container, and the
expand/collapse state. Nothing else. Called from `showMode` `:19248` behind a double
`requestAnimationFrame`; the call was restored at `.558` after 85 versions with zero callers.

**Under the rack model it has nothing left to initialize** — if the tools move onto the rack, the
row it builds ceases to exist.

⚠ **But the gate is the reusable part, and it should outlive the function.** It encodes a measured
hazard: inserting into the Build shell before it settles causes WebGL/layout cascade failures on
phone-webkit. Whatever inserts rack-scoped tools will need the same guard. Deleting `ops_init`
without carrying that forward would re-open a defect that has already been paid for once.

---

## BOUNDS

- ⛔ **Source only.** Nothing was run, rendered, or measured on a device.
- ⚠ **BOM is the one soft cell in E-8.** The dispatcher has zero rack references; its ingest and
  progress sub-renderers were not traced to a store. Recorded as unverified rather than assumed.
- ⛔ **E-8 measures where data LIVES, not whether it COULD be filtered.** Several tools may be able
  to derive a rack slice by joining through `phantom_deploy_racks_v1`. Whether that join is honest
  for each tool is a Phase 1 question and an owner ruling, not a Phase 0 measurement.
- ⛔ **Nothing here is design.** Where v2 asks for something the data cannot currently support, the
  finding is reported for owner amendment — it is not narrowed, resequenced or rewritten.
- 📌 **Collisions with existing repo work are recorded in commit `bcd0205`**, not repeated here:
  COMMAND→DECK probably moot, and `SEE IN AISLE` already built at `:41699`.
- ✅ **SCAN IS RULED (owner, 2026-09-01): v2 §2 wins, the board line is STALE and STRUCK.** SCAN is
  **not** a dock destination; it lives on the rack and on the picker. ⛔ Phase 1 must not propose a
  SCAN dock slot — the target is §3's *scan reachable in ≤1 tap from wherever the tech is*, which
  a dock slot was only ever a means to. ✅ **`SHIP-HANDOFF-SCAN-PILLAR.md` is RETIRED** (owner,
  same day, on the follow-up ask) — marked in place, not deleted, because its anchors and the
  `pg-scan` history outlive the proposal. Nothing in it may be executed.
  See `PHANTOM_CURRENT_STATE.md`.
- ✅ **ONE COLLISION IS NOW CLOSED.** v2 §1's *"ISOLATE is dangerous"* was ruled against by the
  owner on 2026-09-01: **ISOLATE stays as-is, it is not dangerous, and §1's confirm/red/full-width
  prescription is STRUCK.** Recorded in `PHANTOM_CURRENT_STATE.md`. Phase 1 must not assign ISOLATE
  a destructive affordance.

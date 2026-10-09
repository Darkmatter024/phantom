# A0 — AISLE-TRACE CENSUS (partial: Q0-1, Q0-2)

**Spec:** `SHIP-HANDOFF-AISLE-TRACE.md` (Downloads, PARKED). **Scope of this pass:** Q0-1 and Q0-2 only,
by owner instruction 2026-09-30. Q0-3 to Q0-6 not started.
**Read-only.** No app code touched, no version bump. Source: `dct-ios.html` at `main` `139d77e`
(serving `v1.14.594`). Line numbers are hints; the quoted identifiers are the anchors.

## Deviations from spec §5

- **graphify not rebuilt.** `/graphify . --update` costs 350k–670k tokens on this repo (`CLAUDE.md`,
  graphify section) and this pass edits nothing. Every anchor below was read from source with grep/sed.
  Run the rebuild before any patch.
- **CRUCIBLE not on disk.** `MASTER-US-EAST-DLT03-CRUCIBLE.xlsx` is absent from Downloads, nexus01,
  Desktop and Documents. Q0-2 used every Master that is on disk: TORTURE, QUARRY, BRUTAL, ALP03-TEST.
- **The spec's door names do not exist.** No string `SEE IN AISLE` or `OPEN IN PHANTOM` appears in
  `dct-ios.html` or `forge.html`. See §3.

---

## Q0-1 — Same Master? **YES.**

There is one Master object. The Forge aisle and the rest of the app both read it.

| What | Where | Evidence |
|---|---|---|
| The one accessor | `PHANTOM_MASTER.active()` `:35112` | returns `window._lastPhantomMaster` |
| Only writers of that global | `PHANTOM_MASTER.replace` `:35149`, boot restore `:35223`, clear `:35229` | `:36267` records the removal of the last unguarded writer (v1.14.415) |
| Forge's reader | `deploy_forge_master()` `:20138` (inside `forge3d_render`) | reads `window._lastPhantomMaster` with the same usability test as `master_hasMaster()` `:37010` |
| Forge's per-rack devices | `deploy_forge_slots()` `:20242` → `master_rackToElevation(rack, id)` `:20253` | the same builder the rack-detail elevation uses: `master_renderElevationView` `:37699` |
| Forge cache identity | `_slotCacheEnsure()` `:20123` | stamped with `PHANTOM_MASTER.id()`, and also cleared by `PHANTOM_MASTER.onChange` `:20129` |

**One wrinkle, not a blocker.** Forge reads the global directly rather than calling
`PHANTOM_MASTER.active()`. It is the same object, so the value can't differ. A Ship 1 or Ship 2
patch should go through `PHANTOM_MASTER.active()` anyway; this pass doesn't change it.

**`forge.html` is a different thing.** That standalone page (9,471 lines) loads no Master at all:
no `_lastPhantomMaster`, no Master store key, no xlsx. Nothing in `dct-ios.html` links to it.
"Forge 3D Aisle" in the spec means `#forge3d-sheet` inside `dct-ios.html` (`:13715`), not `forge.html`.

→ **Q-1 (spec §9) does not trigger.** Nothing to fix before Ship 1.

---

## Q0-2 — What cable data exists?

### A. In the Master (parsed, persisted)

Parser: `:35924–35962`. One object per WIP/CUTSHEET row, pushed to the A-rack's `cablesOut` and the
Z-rack's `cablesIn`. `PHANTOM_MASTER_STORE.save` persists `racksByCab` whole (`:34994`), so every
field below survives a cold start. The whitelist trap from the MASTER full-ingest memory does not bite here.

| Field | Column | Meaning |
|---|---|---|
| `aLoc` / `zLoc` | 2 / 11 | `cab:ru` of each end |
| `aDns` / `zDns` | 3 / 12 | device name at each end |
| `aModel` / `zModel` | 4 / 13 | model |
| `aPort` / `zPort` | 5 / 14 | port |
| `aBreakoutCab` / `zBreakoutCab` | 6 / 15 | breakout `loc:cab:ru` |
| `aBreakoutSlotPort` / `zBreakoutSlotPort` | 7 / 16 | breakout `slot:port` |
| `aOptic` / `zOptic` | 8 / 17 | expected optic PN |
| `aPatch` / `zPatch` | 9 / 18 | patch panel `loc:cab:ru:port` |
| `cable` | 19 | cable ID or cable type (differs by site) |
| `source` | — | `WIP` or `CUTSHEET` |

**Not parsed:** column 0. In QUARRY that column is a real `STATUS` (`Cable Not Run` ×14,819,
`Addition` ×1,296). This is a lead for the Ship 1 color modes, not tasking.

### B. What the Masters on disk actually fill

Measured with the app's own `vendor/xlsx.full.min.js`, using the parser's row guard.

| Master | Cable rows | Patch A/Z | Breakout cab A/Z | Breakout slot:port A/Z | Optic A/Z | `cable` |
|---|---|---|---|---|---|---|
| **QUARRY** (US-QRS03, real-shaped) | 28,264 | **0 / 0** | 304 / 0 | 14,802 / 8,440 | 16,779 / 16,760 | 28,241 (a **type**: `LC-TO-LC SMF`, `CAT6a`, `MPO12-SMF`) |
| BRUTAL (BRV02) | 11,598 | 0 / 0 | 320 / 0 | 320 / 0 | 10,134 / 10,080 | 11,598 (an **ID**: `IB-c1001-R1`) |
| ALP03-TEST | 128 | 0 / 0 | 128 / 0 | 128 / 0 | 128 / 128 | 128 (an ID) |
| TORTURE (TST99) | 2,305 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 2,305 (an ID) |

**Chain test (QUARRY).** A patch panel can appear as a device rather than as a column, so every
endpoint was checked for panel-type model, port or name.

- Found: **1 of 56,528 endpoints** (`s3:171:45 → FDP · FDP1 Card A Port 1`).
- Panel devices that appear on both ends of different cables (a pass-through hop): **0**.

**Every Master cable is one point-to-point run:** device port → far device port, plus an optional
breakout position and the expected optic on each end. No Master on disk carries a panel → trunk →
panel path.

**BRUTAL, noted and not chased:** 812 endpoints where the same `dns|port` is the Z end of one cable
and the A end of another (for example `leaf-c1-002-a swp57`). That is a double-booked port, which is
PRE-FLIGHT's cable-double-book NO-GO class. It is not a path.

### C. Recorded locally by a tech

| Store | What it holds | Connection path? |
|---|---|---|
| `phantom_scan_collection` `:59599` | barcode scans `{id, value, type, ts, mm?}` | **No** port, no far end |
| `phantom_optic_score_history` `:58671` | OpticScore verdicts: switch, port, expected vs scanned optic | Port-level, but **expected comes from EDP `portMaps`** (`:58850`). `:58944` says Master-scoped deployments never carry `portMaps`, so it is **dead on a Master deployment** |
| `phantom_deploy_optics_v1` `:25326` | per-deployment optic ledger | optic records, **no** far end |
| `phantom_optic_inventory` `:52712` | optic scans | **No** far end |

No local store records a scanned far end, a scanned patch position or a cable ID.
**The expected-vs-scanned port table the spec names exists only on the EDP path, not the Master path.**

### D. Computed

| What | Where |
|---|---|
| Per-device connection rows (`port → farDns : farPort · optic`) | `_rmRenderConnections` `:50707`, fed by `window._rmConnHit` from `master_renderHit` `:37502` |
| Cabling list grouped by far-end cab | `master_renderCablingList` `:37587` |
| **In-rack runs already drawn in 3D** (both ends in this rack) | `rackElevation_render3D` `:40723`, block `:40995–41035`. External runs are only counted (`_cabExternal`) |
| Forge per-rack cable count | `deploy_forge_cableCount` `:20185` |
| PRE-FLIGHT cable findings | `_pf_collectCables` `:54503` |

---

## What this means for the rulings (evidence only; John rules)

- **Q-1:** does not trigger. One Master, one path.
- **Q-3:** the spec guessed that the Master carries no patch-panel data. On every Master on disk that
  is confirmed: 0 filled patch cells across 42,295 cable rows. The longest chain the data supports is:

  `device · port (optic) → [breakout cab · slot:port, A side only, when present] → far device · port (optic)`

  That is one hop, plus a breakout annotation on some rows. It is the same fact
  `_rmRenderConnections` already prints as text. What a Ship 2 trace would add over today is:
  1. the far rack lit in the aisle, which is a real saving (it removes "walk the aisle to find that rack"); and
  2. the breakout position.

  A multi-hop panel/trunk trace has **no data source** and can't be built without guessing.
- **Scan-mismatch color mode (Ship 1):** has **no Master-path source**. OpticScore verify reads EDP
  `portMaps` only. The mode would need a new source, which is its own ruling. **Blockers** mode has a
  source (the A.2 Rack Record, `status.openBlockers`).

## Leads (not tasking)

- **L-1.** Column 0 `STATUS` (`Cable Not Run` / `Addition`) is dropped by the parser. It is a
  per-cable build-state fact from the Master, and a real candidate for a color mode.
- **L-2.** `_rmRenderConnections` `:50711` and `:50715` `return` silently on no hit or no cables.
  This is a Contract 14 pattern, pre-existing, and outside this spec's scope.
- **L-3.** No door into the aisle carries a rack. `forge3d_open()` `:19833` takes no argument. Its
  three callers are the header menu `:13615`, Build "Open aisle" `:22376` and rack-detail
  "OPEN AISLE" `:42572`. The aisle opens on the saved loadout (`deploy_forge_loadout_v1`), not on the
  calling rack. Spec §3 ("SEE IN AISLE … now also carries a trace") assumes a rack-carrying door that
  does not exist. Ship 2 would have to add a parameter to the existing door, which is still zero new
  doors, but the spec should say so.

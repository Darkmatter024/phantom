# PHANTOM — Application State Audit
**Basis:** `dct-ios.html` @ v1.14.394 (`71d4279`). Specialist audit, **key claims independently re-verified by the Principal Integration Owner** — verification status noted per finding.

---

## Verdict: there is no single canonical source of truth for the three things PHANTOM is *about*

Active deployment has 3 stores. Active rack has 4. "Blocker" has 2 live stores plus 1 dead field. Each is independently writable, and each can be made to disagree by an ordinary user gesture.

---

## S1 — Active deployment: three stores, one of them silently drifts ⚠️ CONFIRMED

| Store | Accessors | Line |
|---|---|---|
| `ACTIVE_DEPLOYMENT_KEY` = `phantom_active_deployment` | `deploy_getActiveId` / `deploy_setActive` | 27259–27295 |
| `phantom_manifest_last_deploy` (legacy mirror) | kept in lockstep *by* `deploy_setActive`, lazy-migrated on read | 27266–27291 |
| `ACTIVE_CTX_KEY` = `phantom_active_context_v1` | `activeContext_load/save/setDeployment/setRack/get` — bundles `deploymentId`+`rackId`+`phaseId` | 25811–25881 |

Both #1 and #3 describe themselves in comments as *the* single source of truth.

**Divergence.** `deploy_setActive` has 7 call sites (30006, 40777, 41448, 44519, 44574, 44605, 48626). **Only 48626 also calls `activeContext_setDeployment`.** So the Rack Map bootstrap (44519) and the slot-swap flows (44574/44605) move the active deployment without moving the active context. `deploy_getActiveId()` then returns B while `activeContext_get()` still returns A.

**Ruling (mine):** `ACTIVE_DEPLOYMENT_KEY` is canonical for *which deployment*. `ACTIVE_CTX_KEY` becomes a derived projection of it — the relationship must be enforced in one writer, not by convention across 7 call sites.

---

## S2 — Active rack: four disjoint id spaces ⚠️ CONFIRMED

| # | Holder | Scope | Id space |
|---|---|---|---|
| 1 | `currentRackId` (44337, in-memory) | legacy standalone Rack Map, store `dct_racks_v1` | Rack-Map ids |
| 2 | `ACTIVE_CTX_KEY.rackId` via `activeContext_setRack` (36671) | deployment-scoped, store `phantom_deploy_racks_v1` | deployment-rack ids |
| 3 | `_cmdHeroRack` (21893, in-memory) | Command hero picker | **Master cab key** |
| 4 | `window._reh3dRack` (34874) | live 3D panel | rack object handle |

**These are three different id spaces, not three copies of one id.**

**Divergence — one tap sequence.** Command → hero rack picker (sets `_cmdHeroRack`) → OPEN BAY (`cmd_openHeroBay` @22036) resolves the Master cab id against `deploy_loadRacksFor()` @22049. If no deployment rack matches — which is exactly the documented host-less-cab case — it falls through @22052 to the *standalone* Rack Map, which runs on `currentRackId`. Three "current rack" values now point at three different racks.

**Ruling (mine):** `ACTIVE_CTX_KEY.rackId` is canonical. #1 is a legacy surface that must be consolidated, #3 and #4 become transient view parameters derived from the canonical value, never independent state.

---

## S3 — "Blocker" means two different things, and the number the owner sees is the wrong one ⚠️ CONFIRMED — HIGHEST PRODUCT SEVERITY

Two live, independent stores share one UI word:

1. **Field blocker** — `ph.status === 'blocked'` + `ph.blockerNote` + `ph.blockedAt` on `DEPLOY_PHASES_KEY`. Written by `blocker_save` @23029 and `deploy_advancePhase` @29104. Rolls up to `ru.isBlocked`, drives the Floor Map red strip @34166 and Work-grid badges @34514.
2. **Review issue** — `dep.reviewIssues[]` on the deployment object. Written by `deploy_saveReviewIssues` @37654.

`deploy_countBlockers()` @37696 reads **only** `dep.reviewIssues`:

```
37697   var dep = deploy_getById(deploymentId);
37698   if (!dep || !Array.isArray(dep.reviewIssues)) return 0;
37699   return dep.reviewIssues.filter(i => i.triage === 'untriaged' || i.triage === 'blocking').length;
```

**It has 13 live call sites** — 21319 (Command render), 24736, 25086, 25266, 28255, 29273 (fleet stats), 29302, 29670, 33771, 37710, 37768, 38034, 48839.

**Consequence:** a technician logs a blocker in the aisle → the Floor Map goes red → **Command Center reports 0 blockers.** Every one of those 13 surfaces is honest about `reviewIssues` and silent about field reality. This is the "never label absent telemetry" class, live in production.

**Ruling (mine):** these are two real and *different* concepts and must not be silently merged. `ph.status==='blocked'` is the operational blocker; `reviewIssues` is desk QA. The count function and every label must say which one it means, and Command must surface the field blocker — that is the one a human is standing in front of.

---

## S4 — Three counters that are structurally always zero ⚠️ CONFIRMED BY EXHAUSTIVE WRITER SEARCH

`activeContext_get()` @25867–25869 returns:
```
completeRacks = racks.filter(r => r.status === 'complete').length
blockedRacks  = racks.filter(r => r.status === 'blocked').length
activeRacks   = racks.filter(r => r.status === 'active').length
```

**`rack.status` is never written anywhere in the file.** I enumerated all 21 `.status = ` assignments (19208, 19787, 19792, 29104, 29175, 30701, 33991, 37819, 37820, 37839, 37841, 42370, 42379, 42393, 42398, 42433, 42450, 42460, 42474, 42486, 47462). Every one targets a *slot*, *phase*, *deployment*, *acceptance criterion*, *discrepancy record*, *search state*, or *port* — **none targets a rack object in `DEPLOY_RACKS_KEY`.**

All three counters are therefore permanently `0`. Two more consumers ride the same dead field:
- `cmd_rackBlockers` @21940 — falls back to `r.status === 'blocked' ? 1 : 0`. Its other branch reads `r.blockers`, and the only `.blockers` writer in the file is @20196 on a *different* object (`m.blockers`). **Both branches are dead → always 0.**
- Blocker rack-picker sort @22925 — `var blocked = r.status === 'blocked'` → always false, so the picker can never sort or mark a blocked rack.

**Ruling (mine):** delete the dead field and its readers, or wire a writer. Do not ship a counter that cannot count. Which of the two applies is a product call I'll make in the architecture doc, not a question for the owner.

---

## S5 — Camera / explode / cable visibility: ephemeral by design, resets with no warning

`setView` @35977, `_viewLock` @35959, `exploded` @36000, `cablesVisible` @35442 are **all local closures inside `rackElevation_render3D`** @34923. Nothing is persisted. Every rebuild resets to ISO / collapsed / cables-hidden.

Given §F3 in the renderer map — that `bw_render()` rebuilds the scene on every checklist tap — **this means ticking a checkbox silently throws away the technician's camera angle, explode state and cable view.** The two defects compound: the renderer churn is not only a WebGL problem, it is a *lost-work* problem.

**Ruling (mine):** view state becomes part of the rack controller's state, survives re-render, and is restored on return. This falls out for free once the scene stops being rebuilt.

---

## S6 — Clean subsystems (do not refactor these)

- **Checklist / evidence** — `ph.checks` / `ph.notes` on `DEPLOY_PHASES_KEY`, written by `checklist_toggle` @27605 and `checklist_setNote` @27631. Read-modify-write, single door, debounced, no arity trap. **This is the template** for new per-rack state. "Evidence" is not a separate store — it *is* the checklist note field; no separate evidence subsystem exists and none should be invented.
- **Deploy accessors** — the `loadAllX` / `loadXFor(id)` named-door split @27329–27334 already fixed the arity-shape trap. No live arity trap remains in that family.
- **Local save status** — `storageOk` is re-probed live on every render @21331 rather than cached, so it cannot go stale. Correct pattern.
- **No sync subsystem exists, by design.** PHANTOM is offline-first, single-device. "Pending synchronization" is absent-by-design, not missing. The nearest analogs are the cross-tab collision warning @50390–50491 and manual backup export/import @50032. **Nothing here needs building.**

---

## S7 — Smaller findings

- `window.__phantomStorageFull` @17032 is written on quota failure and **never read** anywhere. Dead signal.
- `window._rmConnHit` @32759 and `window._master_cblHit` @32845 are render-scoped hand-off globals with **no generation/ownership token**. Two lookups in quick succession can let a drill-down read the wrong lookup's data. UNVERIFIED on device; structurally plausible.
- `currentOpsTab` @22374 is in-memory only; its relationship to the nav-history `o:` field @18340 was not traced to completion. UNVERIFIED.
- `blocker_save` @23029 reaches `DEPLOY_PHASES_KEY` through a raw `localStorage` read/write rather than `deploy_loadAllPhases()`/`deploy_saveAllPhases()`. Same key, same shape — not a data-loss risk, but a second code path to a store that should have one door.

---

## Carried into the architecture

1. One canonical holder per concept: deployment → `ACTIVE_DEPLOYMENT_KEY`; rack → `ACTIVE_CTX_KEY.rackId`; phase → `ph.status` on `DEPLOY_PHASES_KEY`.
2. Every writer routes through one door per concept. The 7-call-site `deploy_setActive` drift (S1) is fixed by making the context projection automatic, not by adding a 7th reminder.
3. S3 and S4 are **honesty defects**, not architecture defects, and can be corrected independently and early.
4. S5 dissolves once the rack controller owns scene lifetime (renderer map §8.3).

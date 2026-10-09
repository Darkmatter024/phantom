# PHANTOM ARCHITECTURE BLUEPRINT

**Version:** 1.1 — **direction APPROVED by owner 2026-08-05.** Revised to incorporate owner rulings R-02 (Shift is a pillar) and R-03 (offline-first, not offline-only).
**Basis:** `dct-ios.html` @ v1.14.394 (`71d4279`), 54,045 lines · `sw.js` · `version.json`
**Evidence:** seven audits in `audit/00`–`audit/07`. Every claim below cites a line or an audit finding.
**Authority:** governing document for PHANTOM once approved. Supersedes ad-hoc practice; does not supersede `CLAUDE.md` hard rules or RACK SCENE LOCK, which it incorporates.
**Status:** NO PRODUCTION CODE HAS BEEN MODIFIED. Working tree clean at v1.14.394.

---

## §0 — How to read this

- **§1–§2** are the diagnosis and the shape of the fix. If you read nothing else, read these.
- **§3–§10** are the intended architecture, one section per area you named.
- **§11–§13** are how we get there and how we prove it.
- **§14** is the decisions register: what I decided under your delegation, and the four things I want your eyes on at verify time.

Anything marked **INVARIANT** is a structural rule the code must make unbreakable — not a convention to remember.

---

## §1 — Diagnosis: one defect, forty symptoms

PHANTOM's domain logic is sound. Its storage primitives are better than most field apps — `safeStore`'s quota classification (`:17007`), the transactional restore path (`:50577`), the real field migrations (`:25426`, `:25009`) are all correct and stay.

**The defect is that nothing owns anything.**

Every surface in PHANTOM is a free function that any caller may invoke. Lifecycle, state ownership, visibility, and history are enforced *by convention across call sites* instead of *by structure*. Convention holds until the call sites outnumber the author's memory. They did.

Every finding in the audit set is an instance of that one defect:

| Symptom | Because nothing owns… |
|---|---|
| WebGL context REFUSED on iPhone (`01` F3) | …the renderer. `bw_render()` `:20212` destroys `#bw-mount` and `rackElevation_render3D` `:35015` requests a new context microseconds after `forceContextLoss()` `:36184` |
| Rack keeps drawing after you leave Build (`06` R1) | …visibility. `showMode` `:18702` disposes one mount of two; `onVis` `:36154` only checks `document.hidden` |
| Command reports 0 blockers while the Floor Map is red (`02` S3) | …the word "blocker". Two stores, one label, 13 call sites |
| Three rack counters permanently zero (`02` S4) | …rack status. `rack.status` is read in 5 places and **written in none** of 21 `.status =` sites |
| Ticking a checkbox loses your camera angle (`02` S5) | …view state. Camera/explode/cables are closures inside the render function |
| Flat elevation is grey for 9 of 10 device types (`07` Q2) | …the device vocabulary. RAW codes `:36255` vs EDP-keyed CSS `:10439` — intersection `{gpu}` |
| Six colour maps, zero rows in agreement (`07` Q3) | …colour. GPU is four different values across five surfaces |
| Backup silently omits a third of user data (`04` ST7) | …the key registry. 63 keys, `exportAllData` `:50042` hand-lists 15 |
| Every SOP card tap does nothing (`06` A2) | …the tool host. `openSopDetail` `:45377` paints into `#ops-content`, unreachable under `body.rd` |
| Back is unpredictable app-wide (`06` H1–H4) | …history. `showMode` pushes nothing; the sheet registry covers 5 of 23 sheets |
| Desktop composition ships dead (`05` C1) | …the composition tier. `.cshell` gated on a URL flag |

**Therefore the remedy is not a rewrite and not a patch. It is the introduction of ownership boundaries** — a small number of named owners, each holding one resource behind one door, so the failure modes above become *unrepresentable* rather than *remembered*.

This is exactly your step 7: *replace weak ownership boundaries deliberately.*

---

## §2 — The intended architecture: seven owners

| # | Owner | Owns | Door | Replaces |
|---|---|---|---|---|
| **1** | `RackExperience` | WebGL context, scene, canvas, camera/explode/cable state, visibility policy | `mount · update · setMode · suspend · release` | 2 renderers across 7 render paths (`07` Q1) |
| **2** | `ActiveContext` | Which site / deployment / rack / phase is active | `get · set*` (single writer per concept) | 3 deployment stores, 4 rack id spaces (`02` S1/S2) |
| **3** | `Store` | All 63 localStorage keys, their shapes, migrations, and backup membership | `get · set · remove · registry` | 187 raw `localStorage` lines |
| **4** | `Router` | Which surface is visible, and the history stack | `navigate · back` | `showMode` / `showPage` / `showStab` / `showOpsTab` / `goOpsTab` / `nav_*` |
| **5** | `ToolHost` | Tool mounting, the back contract, one door per tool | `open(toolId, from)` | `rd_openOpsTool` + 4 competing entry mechanisms |
| **6** | `Vocabulary` | Device types and their colours, phase labels | `typeOf · colorOf · phaseLabel` | 6 colour maps, 2 byte-identical phase-label maps |
| **7** | `PhantomIntelligence` | Every AI-assisted capability: honest state, local-first fallback, queue, cache, provider abstraction | `request · state · queue · cache` | `phantomAPI` `:17580` + `phantomAI` `:17693` + 1 direct-call bypass `:42926` |

**What is NOT changing.** Domain logic — parsing, BOM classification, port validation, checklist semantics, phase advancement, master ingest, optic scoring, audit walks — is untouched. Per your directive: *do not rewrite stable domain logic simply because the presentation is changing.* The six owners are presentation, state, and lifecycle boundaries only.

**What the owners are not.** This is not a framework, not a build step, not a module system. PHANTOM stays a single file with no toolchain. Each owner is a plain IIFE-scoped object with a documented door, sitting where the scattered functions sit today.

---

## §3 — Product architecture

### 3.1 The surface tree

PHANTOM is three pages and one drill-in host. That is the whole shape, and every surface must have a place in it.

```
COMMAND  #pg-cmd     situational awareness — what is true right now
WORK     #pg-work    the job chain in execution order
  └─ Build workspace  #bw-shell        the active rack, live
  └─ Tool host        #ops-tool-host   one tool at a time, drilled in
REF      #pg-ref      zero-state reference — works with no deployment loaded
```

This is Design Law 1 and it is correct. The audits found no reason to change it.

### 3.2 Surface register

Purpose · required state · renderer · storage · door · back · offline · disposition.

| Surface | Required state | Renderer | Door (canonical) | Offline | Disposition |
|---|---|---|---|---|---|
| **Command** `#pg-cmd` | none (zero-state safe) | static art | bottom nav | ✅ full | **RETAIN** — single Command at every tier (§10.3) |
| **Build workspace** `#bw-shell` | active deployment + rack | `RackExperience` mode `bay` | `showMode('work')` | ✅ full | **RETAIN** — canonical rack surface |
| **Open Aisle** (Forge) | active rack | `RackExperience` mode `aisle` | `ToolHost` / rack detail | ✅ full | **RETAIN**, engine merged (§5.5). PROVISIONAL header door `:13036` **DELETE** |
| **Rack detail** `#reh3dMount` | rack | `RackExperience` mode `detail` | rack list | ✅ full | RETAIN |
| **Deploy** | — | — | `ToolHost` | ✅ full | RETAIN |
| **Master intake** | — | — | Command ingest `:13398` | ✅ full | RETAIN — 3 doors → 1 |
| **BOM** | deployment | — | `ToolHost` | ✅ full | RETAIN |
| **Manifest** | deployment | — | `ToolHost` | ✅ full | RETAIN |
| **Rack Map** | rack | flat DOM | `ToolHost` | ✅ full | RETAIN — **8 doors → 1** (`03` D6), worst in the app |
| **Port Map** | — | — | `ToolHost` | ⚠️ **ONLINE-ONLY** | RETAIN + honest marker (§7.3) |
| **Scan** | — | camera | `ToolHost` | ✅ full | RETAIN — 8 doors → 1 |
| **Handoff** | deployment | — | inside **Shift** | ✅ full | **ABSORBED into Shift** (R-02) — 8 doors → 1 |
| **SOPs** | none | — | `ToolHost` | ✅ full | **RESTORE** — currently no door *and* dead detail view (`03` D1, `06` A2) |
| **Audits** | deployment | — | `ToolHost` | ✅ full | RETAIN — needs a discoverable door |
| **Burndown** | deployment | — | `ToolHost` | ⚠️ AI-assisted | **CONSOLIDATE** into `bw-worklist` `:20423` |
| **Blast Radius** | deployment | — | `ToolHost` | ✅ full | RETAIN — `_br_target` global fixed (`06` R5) |
| **Optic Inventory** | none | — | `ToolHost` | ⚠️ AI-assisted ID | RETAIN + **phone door** (`03` D2); rename from OPTICS (`03` D7) |
| **References / Platforms** `#pg-ref` | none | — | bottom nav | ✅ full | RETAIN — cleanest landing in the app |
| **Shift** `#pg-shift` | deployment (degrades) | — | **primary nav slot 5** | ✅ full | **BUILD — a pillar** (R-02, §3.4). Today 4 half-surfaces, 2 desktop-only |
| `#cmd-shell` `:13217` | — | — | — | — | **DELETE** after capability port (§10.3) |
| `#wk-deploy` / `#wk-handoff` stubs | — | — | — | — | **DELETE** — inert, bypassed |
| `#work-grid` launcher | — | — | — | — | **RETIRED** already — do not resurrect (`03` correction) |

### 3.3 The one thing this register fixes structurally

Rack Map has eight doors across four rendering surfaces. Scan and Handoff have eight each. That is not a tidiness problem — it is why `rd_openMasterFile()` `:20116` cleans state that raw `showPage('master')` `:24349` does not, and why the Platforms detail `:21222` lands stale through 7 of its 8 doors (`06` R5).

**INVARIANT — one door per feature.** A tool is reachable through exactly one *function*. Every other entry point calls it. `ToolHost.open()` (§9) is that function. Enforced by a repo check, not by review.

**Read this correctly (R-05).** "One door" constrains the *implementation*, never the number of places a capability may be offered. A feature reachable from eight surfaces is good product design; eight *hand-built* entry points that clean up different state and diverge over time is the defect. The Rack Map's eight entries are not eight too many — they are eight that should funnel through one function. `audit/03` D6 framed the count as the problem and that framing is superseded.

### 3.4 SHIFT — the fifth pillar (OWNER RULING R-02)

**Primary navigation is five slots:** Command · Build · Scan · Tools · **Shift**.

`EXIT` `:16039` is removed from primary navigation. Leaving the app is a browser behaviour, not a PHANTOM workflow, and it currently occupies a pillar slot.

Shift is not a consolidation of the four existing half-surfaces (`:22092`, `:13312`, `:17722`, `:25115`) — it is one coherent surface built to answer nine questions, each backed by state that already exists:

| Shift answers | Source | Status today |
|---|---|---|
| What was completed? | `ph.status === 'complete'` on `DEPLOY_PHASES_KEY` | exists |
| What remains? | phases not complete | exists |
| What is blocked? | `ph.status === 'blocked'` — the **field** blocker (§4.4) | exists, mis-reported |
| What changed locally? | `Store` registry write journal | **new** (§6.1) |
| What evidence was added? | `ph.notes` `:27631` | exists |
| What must the next tech know? | handoff draft `phantom_handoff_v1` | exists, indicator broken `:21325` |
| Is the handoff ready? | derived gate list (below) | **new** |
| Can the report be generated offline? | `shiftReport_generate` — local template + `PhantomIntelligence` enhancement | exists, **no phone door** (`03` D5) |
| What is waiting to synchronize? | `PhantomIntelligence.queue` | **new** (§7.5) |

**Readiness is a gate list, never a score.** Per R-02 — *do not fabricate a readiness score; derive readiness from real local gates and show the underlying requirements clearly.* Shift renders the explicit gates (evidence present · blockers annotated · phases resolved or explained · handoff note written · queue reviewed), each one tappable to the thing it's about, with a count of gates met over gates total. No percentage that isn't a division of two real numbers. This is the standing *never label absent telemetry* rule applied at the pillar level.

**Degradation.** Shift with no deployment loaded is a zero-state surface, not an error: it shows the queue, local changes, and the last generated report. Design Law 2 holds.

**Absorbed surfaces:** Handoff (8 doors → inside Shift), shift notes, the desktop-only shift report `:22092`, and blockers-as-a-view (the store stays where it is — Shift reads, it does not become a second writer).

⚠ **Count re-measured 2026-08-08: Handoff is 14 `handoff_*` functions, not 8** (`close · exportHTML · gen · generate · launch · listDeployments · loadAll · loadForDeployment · log · pickDeployment · purge · quick · render · renderDeployPicker`). The absorption is larger than this section estimated. Note `handoff_gen` **and** `handoff_generate` both exist — resolve which is canonical before absorbing, or the merge carries a duplicate door through the one-door rule.

### 3.4a Hold-to-freeze re-homes into Shift (OWNER RULING R-02a, 2026-08-08)

R-02 removes `EXIT` from primary navigation because leaving the app is a browser behaviour. **That removes the slot, not the feature.** The control being removed does not actually exit — it calls `rd_freeze`, which raises `#rd-freeze-curtain`, a full-screen hold-to-wake lock whose own copy reads **"shift state saved · nothing lost."**

That is a shift-boundary action. A tech freezes the app when they step away or hand off, which is precisely Shift's moment. **`rd_freeze` / `rd_wake` / `#rd-freeze-curtain` / `rd_freezeBootRestore` move into Shift as an action; none of them is deleted with the slot.**

Two things for whoever lands this:

- **The freeze is a real safety affordance, not chrome.** Deleting the nav item without re-homing it would silently remove a working feature — the exact "silent success" failure class, arriving through a layout change.
- **`rd_freezeBootRestore` means the freeze has boot-time state.** Re-homing the trigger is not enough; the restore path has to keep working from whatever surface now owns it, or a device that was frozen at shutdown wakes into the wrong place.

---

## §4 — State architecture

### 4.1 Canonical holders

One row per concept you named. **Canonical** is the single writable truth. **Derived** must become a read-through projection with no independent writer.

| Concept | Canonical holder | Derived / retired |
|---|---|---|
| Active site | `siteProfile` + master `siteCode` | — |
| **Active deployment** | `phantom_active_deployment` `:27259` | `ACTIVE_CTX_KEY.deploymentId`, `phantom_manifest_last_deploy` — both become projections written by the one setter |
| **Active rack** | `ACTIVE_CTX_KEY.rackId` `:25811` | `currentRackId` `:44337`, `_cmdHeroRack` `:21893`, `window._reh3dRack` `:34874` → transient view params |
| **Current phase** | `ph.status` on `DEPLOY_PHASES_KEY` | — |
| Selected device / connection | render-scoped params | `window._rmConnHit` `:32759`, `window._master_cblHit` `:32845` → passed, not stashed |
| **Checklist** | `ph.checks` `:27605` | ✅ already canonical — **this is the template** |
| **Evidence** | `ph.notes` `:27631` — *the same store* | no separate evidence subsystem exists and none is to be invented |
| **Field blocker** | `ph.status === 'blocked'` | Floor-map strip `:34166`, Work badges `:34514` |
| **Review issue** | `dep.reviewIssues[]` `:37654` | desk-QA counts only |
| **Rack status** | **DERIVED from its phases — no stored field** (§4.3) | `rack.status` deleted |
| **Camera / explode / cables** | `RackExperience.state` (§5.3) | was closures `:35977`, `:36000`, `:35442` |
| Tool context | `Router` state | `currentOpsTab` `:22374` |
| Local save status | live probe `:21331` | ✅ correct — re-probed per render, cannot go stale |
| **Pending synchronization** | `PhantomIntelligence.queue` (§7.5) | ⚠️ **SUPERSEDED.** `audit/02` S6 concluded no sync subsystem exists *by design* and nothing needed building. That was true of the code as audited and is no longer true of the product: R-03 creates a real queue of deferred AI requests, and R-02 requires Shift to report it. It is a queue of *outbound enhancement requests*, not a data-sync engine — PHANTOM stays single-device and local-authoritative. |
| **Local change journal** | `Store` write journal (§6.1) | **new** — answers Shift's "what changed locally?" |

### 4.2 Why S1 drifts, and the structural fix

`deploy_setActive` has 7 call sites; **one** of them also calls `activeContext_setDeployment` (`02` S1). The fix is not a 7th reminder — it is that `activeContext` stops being independently writable for deployment. `deploy_setActive` becomes the only writer and updates the projection inside itself.

**INVARIANT — one writer per concept.** A concept with two setters has two truths.

### 4.3 Decision: rack status is derived, not stored

`rack.status` is read by five consumers and **written by none** — I enumerated all 21 `.status =` assignments (`02` S4). Three counters are structurally always zero; `cmd_rackBlockers` `:21940` is dead on both branches; the blocker picker `:22925` can never mark a blocked rack.

You said not to bring you routine calls, so: **derive it.**

```
rackStatus(rackId):
  phases = deploy_loadPhasesFor(rackId)
  if any phase.status === 'blocked'   → 'blocked'
  if all phases.status === 'complete' → 'complete'
  else                                → 'active'
```

This makes all five consumers real without adding a storage field, without a migration, and without a new writer that could drift. The alternative — wiring a writer — adds a field that must be kept in sync with the phases that already say the same thing. Deriving is strictly better and cheaper.

### 4.4 Decision: "blocker" is two words, not one

`deploy_countBlockers()` `:37696` reads only `dep.reviewIssues` and has 13 live call sites including Command `:21319` and fleet stats `:29273`. A technician logs a field blocker, the Floor Map goes red, **Command reports 0.** That is the *never label absent telemetry* class, live in production, on the number you look at first.

These are two real and different concepts. Merging them would be dishonest in the other direction.

- `deploy_countReviewIssues()` — renamed from `countBlockers`, same body, all 13 sites audited for which one they meant
- `deploy_countFieldBlockers()` — new, from `ph.status === 'blocked'`
- Every label states which. Command surfaces the **field** blocker, because that is the one a human is standing in front of.

---

## §5 — Renderer architecture & canonical rack ownership

### 5.1 What exists today

Two `new THREE.WebGLRenderer` sites (`01` §1) feeding **seven** render paths (`07` Q1). `rackElevation_render3D` `:34923` is already shared by three consumers — it is not three renderers, it is one function with no owner, and every invocation is a full teardown-and-rebuild.

**The canonical renderer already exists. It needs an owner and a lifecycle.**

### 5.2 `RackEngine` — the door (OWNER RULING R-05)

**Canonical means one engine, not one location.** The rack may legitimately appear in Build, Open Aisle, Rack Map, deployment review, a contextual detail workspace, and future approved views. No useful presentation is removed to satisfy a literal one-component rule.

```
RackEngine.attach({ host, rackId, mode, view, interactive, context })  // → handle
handle.update(patch)        // data changed → mutate in place, never re-create
handle.setView(view)        // camera / explode / cables
handle.suspend() / resume() // host not visible → stop work, decide on the context
handle.detach()             // release this attachment
RackEngine.report()         // the §5.4 census
```

| Param | Meaning |
|---|---|
| `host` | the element to render into |
| `rackId` | canonical, from `ACTIVE_CTX_KEY.rackId` |
| `mode` | `bay` · `aisle` · `map` · `review` · `detail` · `hero` |
| `view` | camera, exploded, cablesVisible — **persisted state, not a closure** |
| `interactive` | **true → owns a WebGL context. false → flat DOM from the same data.** |
| `context` | deployment / phase, for annotation and honesty |

**INVARIANT — many attachments, at most one interactive.** This is the reconciliation between the iOS single-context ceiling and the product's need to show racks in many places. A non-interactive attachment holds no context, costs nothing, and may exist many times at once. The lifecycle owner enforces that exactly one interactive attachment holds a context at any moment — and, per I6, never allocates one in the same task as a release.

**What this corrects in my own analysis.** `audit/07` Q1 counted seven rack render paths and I treated the *count* as the defect. It never was. Seven places rendering a rack is correct product behaviour. Seven *independent implementations* carrying six mutually-disagreeing colour vocabularies is the defect. The consolidation target is one engine with N attachments — not fewer places to see a rack.

It also fixes `audit/07` Q2 at the root: flat is a **mode of the engine**, so it consumes `Vocabulary` like every other mode. Nine of ten device types rendering monochrome stops being a CSS-keying bug and becomes impossible by construction.

`hero` is a **non-interactive** mode — Command's approved static presentation, per your earlier ruling, now expressed as `interactive: false` rather than as a separate code path. `cmd_rackHero3D` `:21790`, already welded shut by the bare `return` at `:21875`, is deleted.

### 5.3 Invariants

- **I1 — One context.** At most one WebGL context exists at any time, enforced *inside* the controller. Today the guard is asymmetric: `forge3d_render` `:19068` disposes only the Forge context, never the rack's — the cross-guard lives one level up in `forge3d_open`, so it is not enforced at the boundary that creates the renderer (`01` F2). Moving the guard into the allocator deletes F2 rather than patching it.
- **I2 — Create ≠ update.** `bw_render()` calls `update()`. It never creates. This is your ruling verbatim: *Build rerenders must update the existing scene and state — not create another renderer.*
- **I3 — Stable host.** `bw_render()` `:20212` must stop wiping `#bw-mount` `:20357` out of existence. The mount is built once and preserved across renders; only the panels around it re-render. This is the single edit that ends F3.
- **I4 — The controller owns visibility, not the router.** A scene whose host is not visible suspends itself. Implemented with `IntersectionObserver` + `visibilitychange`, not by a caller remembering to dispose. Today `showMode` `:18702` disposes one mount of two and `onVis` `:36154` misses `display:none` ancestors entirely, so leaving Build holds the context *and* runs the rAF at full rate on an invisible canvas (`06` R1).
- **I5 — No probe allocates.** `reh3d_webglOK()` `:34866` and `diag()` `:20597` each mint a canvas and take a real WebGL context that is never released. `diag()` runs *on the failure path* — it asks for a context at the exact moment the app is out of them, and that is why the device reported `WebGL support: true` in the same breath as `REFUSED`: the "true" came from a different, freshly-minted canvas (`01` F1). Capability is probed **once**, from a single retained module-scope canvas, and cached.
- **I6 — The reclaim barrier.** *This is the actual fix for the refusal.* On iOS WebKit, the GPU-side reclaim from `forceContextLoss()` is asynchronous. **After a release, no create may occur in the same task.** The controller defers allocation across a frame boundary if a release just happened.

  I6 is not a retry and not a timeout. You banned both, correctly. It is an **ordering guarantee**: we never ask for a context we just gave back in the same breath. Even with I2/I3 eliminating the churn, legitimate mode transitions still release and re-create, and without I6 those would fail the same way.

### 5.4 The device probe

Your fifteen questions need a runtime answer, and the probe must not itself allocate — that is the mistake I5 documents.

`RackExperience.report()` returns, using DOM inspection and read-back from **existing** canvases only:

```
canvasTotal · canvasVisible · canvasHidden
contextsLive · contextOwner · loopOwner · loopState
modeActive · rackId · hostConnected · hostRect
releasesArmed · lastReleaseAt · barrierDeferrals
```

Surfaced behind the existing diagnostic affordance. Ships in Stage 0, before any renderer change, so the before/after counts are measured on the same instrument.

**INVARIANT — instrumentation has an exit condition.** Diagnostics are temporary infrastructure in service of the product, never the product. Every instrument added to PHANTOM carries a written retirement condition at the moment it is added.

`diag()` `:20611` is the cautionary case and the reason this rule exists. It was added as a temporary diagnostic, was never given an end, became permanent, and by v1.14.394 was *allocating a WebGL context on the failure path* — actively worsening the fault it was built to describe. Instrumentation without an exit plan doesn't stay neutral; it decays into a defect.

| Instrument | Retires when | Becomes |
|---|---|---|
| `PhantomGL` (standalone) | M2 ships and passes device verify | absorbed into `RackEngine.report()`; the standalone object is **deleted** |
| `phantom_webglCapable()` | M2 | owned by `RackEngine`; callers stop asking directly |
| `diag()`'s census line | M2 | `RackEngine.report()` |
| `window._bootRaf` | permanent — it is a lifecycle handle, not an instrument | — |

M2's definition of done includes the deletion, not just the replacement. An instrument still present after its retirement condition is a defect on the next audit.

**And the wider rule this sits under:** once the architecture is correct, engine work stops. The measure of PHANTOM is a technician finishing a deployment faster at 2AM — not a perfectly observable renderer. Diagnostics that survive past their purpose are the same accretion as any other unowned code.

### 5.5 Staging

*Naming note: `RackExperience` is renamed `RackEngine` throughout, per R-05 — "experience" implied a single surface; "engine" is what it is.*

Merging Open Aisle into the same engine is correct and it is **not** Stage 2. The Forge scene has its own geometry and camera rig, and RACK SCENE LOCK covers materials, the §A light rig, fog, tone mapping, tray geometry, type colours, bezel strips, floor, reflection, and boot. Rushing the merge risks the locked scene for no gain on the blocking bug.

- **Stage 2a — Context Arbiter.** One owner of context allocation. Both existing renderers request through it. I1, I4, I5, I6 land. The refusal stops.
- **Stage 2b — Scene reuse.** I2, I3. `bw_render` updates instead of rebuilding. Camera/explode/cable state survives (`02` S5 dissolves for free).
- **Stage 6 — Engine merge.** `aisle` becomes a mode; `forge3d_render` `:19066` is deleted. Scene internals untouched — the lock holds.

---

## §6 — Storage architecture

### 6.1 The key registry

63 keys, 187 lines touching `localStorage`, and a backup that hand-lists 15 of them.

```
STORE_KEYS = {
  'phantom_node_status_v1': { owner:'fieldVerify', shape:'map', backup:true,  migrate:null },
  …one row per key…
}
```

**INVARIANT — `exportAllData` is derived from the registry, never hand-written.** A key that exists is in the backup unless its row says otherwise and gives a reason. This makes `04` ST7 — sixteen keys of real field work silently outside the backup, including issues, discrepancies, audits, walk results and the scan collection — structurally impossible to recur.

That finding is the most consequential in the storage audit: *a backup that omits a third of the app's user data is a backup the owner will trust and shouldn't.*

**Write journal.** Because `Store` is the only writer, it can record what changed this shift at no extra cost: `{key, owner, at, deploymentId}` per write, capped and pruned like the crash log `:17496`. This is what answers Shift's *"what changed locally?"* (§3.4) — derived from the write path rather than reconstructed by diffing, which would be guesswork.

### 6.2 Access discipline

- Every read/write/delete goes through `safeGet` / `safeStore` / `safeRemove`. Two of those three do not exist today — there is **no `safeGet` and no `safeRemove`**, so all 31 `removeItem` calls and every `getItem` are raw by construction (`04`).
- **No new raw persistence path**, per your directive. The six unreachable `else localStorage.setItem(…)` arms (`:18650`, `:44378`, `:51669`, `:52499`, `:52870`, `:52884`) are deleted — `safeStore` is declared top-level above all of them, so the raw arm can only ever serve to defeat the quota toast.
- `phantom_node_status_v1` `:19112` — per-node racked/pending state, **real work a technician did in the aisle** — currently writes through a private closure with a naked `catch(e){}` and is not in the backup. Highest data-loss exposure in the app. Routed through `safeStore`, added to the registry.
- The two unguarded `setItem` calls (`:39489`, `:39500`) get wrapped.

### 6.3 Read-modify-write, never fresh-literal

Two whitelists silently erase fields:

- `PHANTOM_MASTER_STORE.save` `:31122` persists 7 fields; the parse result carries more. `siteName`, the whole `stats` object, `legends`, and `ingestedAt` die at cold start. `hosts[]`/`cables[]` loss is documented and intentional; the rest is incidental.
- `ge_load` `:28400` rebuilds a fresh literal on the **read** side and drops every unknown key — the same defect class, on the side nobody is watching.

`JOBSNAP.save` `:31250` uses `Object.assign({}, snapshot, {schemaVersion:1})` and passes everything through. **That is the correct pattern**, and it is the counter-example proving the Master whitelist is a choice, not a constraint. Both whitelists become explicit merges with a documented drop list.

### 6.4 Corrupt data gets one honest path

Every parse failure in the app degrades silently to `null`/`{}`/`[]`. There is no corrupt-data toast, no quarantine, and no "your data looked damaged" path anywhere (`04` ST8). That contradicts the app's own first rule for the one case that *destroys* user data rather than merely hiding a surface.

One path: copy the damaged blob to `phantom_quarantine_v1`, toast honestly, continue with the fallback. The user keeps a recoverable artifact instead of a silent zero.

### 6.5 What stays untouched

Quota classification `:17011` · the 3.6 MB pre-flight `:33553` · scaffold LRU evict `:39989` · **the transactional restore path `:50577`** — byte pre-check, staged writes, full rollback on first failure, `alert()` naming the failing key. That is the pattern to copy, not to replace.

---

## §7 — Offline architecture

### 7.1 The core law (OWNER RULING R-03)

> **No essential field workflow may become unusable because the Anthropic proxy, internet connection, or external service is unavailable. AI augments the technician. It does not hold the technician hostage.**

**Offline-first, not offline-only.** The AI-assisted capabilities are retained and treated as first-class — Port Map intelligence, optic identification, burndown extraction, EDP parsing assistance, the PHANTOM assistant, Next Best Action, document interpretation. They are part of what makes PHANTOM exceptional. They are not permitted to be load-bearing.

Everything required to *complete a deployment* works with zero network: reference, checklists, evidence, phases, rack rendering, BOM, manifest, scan, audits, shift report. All local, all the time.

### 7.2 The precache is the manifest

`sw.js` `CACHE_VERSION` is in three-stamp lockstep and all 54 precache entries exist on disk with zero stale entries (`04` ST9). Healthy.

**INVARIANT — every `loadScript` target is in PRECACHE.** There are nine `loadScript` call sites covering three vendor bundles:

| Vendor | Sites | Precached? |
|---|---|---|
| `three.min.js` | `:20693`, `:21839`, `:34901` | ✅ |
| `xlsx.full.min.js` | `:31331`, `:41650`, `:47822` | ✅ |
| **`pdf.min.js` + `pdf.worker.min.js`** | `:47700`–`:47701` | ❌ **ABSENT** |

Both PDF files exist in `vendor/` and are simply not listed. The catch block `:47702` says *"Check connection and retry"* — honest, but in an offline-first field app. Two lines in the precache list.

### 7.3 `PhantomIntelligence` — one service boundary

Today the provider is reached from two places and bypassed from a third. `phantomAI` `:17693` is **correct** — it pre-checks `navigator.onLine`, toasts honestly, and returns a Response-shaped object so callers short-circuit instead of burning ~23s of timeout plus retries. But `edp_parseSection` `:42926` calls `phantomAPI` directly and skips all of it, and `PHANTOM_PROXY_URL` `:17576` is a module constant that any future caller can reach.

**INVARIANT — one intelligence boundary. No direct provider calls anywhere in the application.**

```
PhantomIntelligence.request({ capability, context, payload, privacyMode, cachePolicy })
PhantomIntelligence.state(capability)     → one of the six states below
PhantomIntelligence.queue                  → pending requests, user-controlled
PhantomIntelligence.cached(capability, key)→ result + provenance
```

This collapses `phantomAPI` + `phantomAI` into one door, makes the `:42926` bypass structurally impossible, and puts the provider behind an abstraction so a future replacement is a one-object change rather than a search-and-replace across six features.

### 7.4 Honest capability state — the six states

Every AI-dependent feature exposes exactly one of these. **Never a generic application failure.**

| State | Meaning | Surface obligation |
|---|---|---|
| `AI AVAILABLE` | live, will call | show it before the tap |
| `USING LOCAL DATA` | running the deterministic path | say which path |
| `CACHED RESULT` | prior AI output | show provenance (§7.6) |
| `REQUEST QUEUED` | deferred, awaiting user release | show what's pending |
| `CONNECTION REQUIRED` | needs signal for this specific action | offer the local alternative |
| `AI UNAVAILABLE — MANUAL WORKFLOW READY` | proxy down or offline | the manual path is one tap away |

The current failure text — *"API call failed"* `:43424` + *"Check API key and network connection"* — is replaced. There is no API key to check; the Worker holds it server-side `:17573`.

### 7.5 Local-first path, per capability

Each AI feature has a useful local path. This is the substance of R-03, and it is where most of the Stage-4 work is.

| Capability | Online | Offline / local |
|---|---|---|
| **Port Map** | AI parsing, validation, anomaly detection, recommendations | loaded port map · local search + filter · manual connection review · prior stored results · checklist + evidence actions |
| **Optic ID** | image/text identification, compatibility, deeper validation | local optic reference library · form-factor selection · known platform compatibility · manual serial/type entry · safe cached identifications |
| **Burndown** | auto-parse pasted or uploaded source | view prior burndown · manually add/edit/complete/filter connections · queue source for later parsing |
| **EDP parse** | AI interpretation and normalization | existing deterministic parser · previously loaded Master · manual correction and review · queue enhanced interpretation |
| **Assistant / NBA** | contextual reasoning, summaries, suggested actions, SOP guidance, deployment analysis | **deterministic Next Action from real local state** · local rules and references · cached SOPs · local deployment summaries · honest note that deeper assistance returns with connectivity |

Note the Assistant row: a deterministic Next Best Action derived from live phase, blocker and checklist state is *better* than an AI round-trip for the common case, and it works in the aisle. The AI path becomes the deeper-analysis tier, not the only tier.

### 7.6 Queue and cache

**Queue.** Persisted through `Store` (§6.1), so it inherits the registry, the quota toast, and backup membership.

- Never blocks the current workflow
- Shows exactly what is pending and why
- Deduplicated by payload hash — no double submission
- Cancellable
- Retries safely on reconnect, and records success or failure honestly
- **Requires explicit user release before transmitting.** Per R-03: *do not automatically upload data merely because a connection appears.* Reconnection enables the send; it does not perform it. `privacyMode` gates what may be included at all.

**Cache.** Durable outputs are cached — parsed document structure, confirmed optic ID, generated shift-summary draft, suggested SOP reference, validated port-map interpretation. Every cached entry carries and displays:

```
source · createdAt · deploymentId/rackId · sourceHash · revalidateRecommended
```

`sourceHash` is what makes staleness detectable: when the underlying source changes, the entry is marked for revalidation rather than silently re-served. **Cached AI output is never presented as current fact.**

### 7.7 Cost and dependency posture

The proxy `:17576` is an approved external dependency. Designed so that: calls are intentional (never on render, never on scroll) · repeated calls are minimized by cache-first + dedupe · token usage is bounded by the existing `AI_TOKENS` map `:17708` · sensitive-data handling is explicit via `privacyMode` · failure is graceful by construction · **core work stays local** · the provider is replaceable behind the boundary.

### 7.8 Offline startup

Navigations are network-first with a cached-shell fallback; install uses `allSettled` (non-fatal); activate deletes all non-current caches. All correct, all retained.

---

## §8 — Routing architecture

### 8.1 One door

```
Router.navigate({ surface, params, from })   // push is automatic
Router.back()
Router.current
```

Today there are six mechanisms — `showMode`, `showPage`, `showStab`, `showOpsTab`, `goOpsTab`, `nav_push`/`nav_restore` — and they disagree.

### 8.2 What that fixes structurally

- **H1 — `showMode` never pushes history.** `:18719` suppresses `showPage`'s push and pushes nothing of its own, so **every bottom-nav tap is invisible to history.** With push inside `navigate`, this is unrepresentable.
- **H2/H3 — class-only backs.** `wk_showGrid` `:20740`, `ref_showGrid` `:18853`, `#master-back` `:15838` move the screen without popping the stack. All become `Router.back()`.
- **H4 — the sheet registry covers 5 of 23 sheets** `:18372`, so back over an unregistered sheet pops nav *and* leaves the sheet up — the `.274` bug recurring for 18 more. Registry becomes **derived**: any open `[data-sheet]` closes first. Hand-maintained lists go stale; derived ones cannot.
- **D3 — `state.o` is silently discarded on every redesign restore.** `nav_restore` `:18432` passes it, `showPage` honours it only when `id === 'sop'` `:22305`, and under `body.rd` the page is always `'work'`. Every `{p:'work', o:'burndown'}` restores to a bare page with stale content. `params` are honoured unconditionally.
- **D4 — restore never syncs `_rdMode`**, so the nav highlight, the `#bn-core` slider and `body.mode-ref` drift from the visible page — and this poisons `rd_freeze()` `:18649`, which stamps `_rdMode`. A freeze taken in that state wakes on the wrong page.
- **D1 — scroll position.** `showPage` `:22285` zeroes `scrollTop` on *every* `.page`, not just the departing one. Nothing is preserved anywhere. `Router` retains per-surface scroll.
- **R4 — `goOpsTab` ignores its argument.** `:43491` always lands on Deploy under redesign; its own comment `:43492` says "no redesign home *until Stage 3*" and **Stage 3 shipped.** Five search intents — port map, SOP, rack map, triage, and the in-panel SOP link `:37051` — land on the wrong screen. Deleted; callers repointed to `ToolHost.open()`.

### 8.3 Dead doors

Under `body.rd`, `#pg-sop` can never become `.active` — the `showPage` guard `:22265` blocks it and `_session_bootRestore` early-returns `:18582`. So `#ops-content` `:15764` is permanently `display:none`, and every writer into it is a silent success into a hidden node.

| Door | Evidence | Fix |
|---|---|---|
| **Every SOP card tap** `:45325`/`:45357` → `openSopDetail` `:45377` | `const c = getElementById('ops-content'); if (!c) return;` — **no `redesign_isOn()` gate at all**, and `c` is non-null so the guard never fires | Route to `ToolHost` |
| Deployment-list **Rack Map** `:29590` → `showOpsTab('rackmap')` | reachable, paints nowhere | Repoint to `ToolHost.open('rackmap')` |
| `nav_restore` `d:'sop:<id>'` `:18493` | same root cause | falls out with the above |
| `deleteSOP()` `:45397` | repaints `#wk-deploy` wholesale, wiping the `‹ Back` chrome `:29550` while `body.ops-detail` stays set → **user stranded with no exit** | `Router.back()` |
| `siteProfile_showEditor()` no-arg `:27782` | silent host fallback into the legacy house — the exact pattern the hard rules forbid | warn + abort |

**A2 is the most severe routing finding.** SOPs already has no door (`03` D1); even reached via `?cshell=1`, every card tap paints nothing. The list renders correctly, so the tool *looks* alive.

### 8.4 Silent failures

21 sites catalogued (`06` R6). The `if (!x) return` on a user-facing path is a hard-rule violation and gets a `console.warn` + `phantomToast` in every case. The four that matter most: `showMode` `:18698` makes `showMode('build')` a completely dead button while the nav *labels* it BUILD; `cmd_render` `:18721` swallows a Command render failure into a blank Home with no console and no toast; `showRefTab`/`showWorkTab` `:18823`/`:20728` remove the grid *before* checking the stab exists, so a missing stab leaves a blank page.

Handlers that already get it right and set the standard: `wk_toggleOpsWall` `:20750`, `phdock_open` `:36592`, `cmd_route` `:22082`, `showPageSafe` `:22219`, `reh3d_fail` `:34911`, and the deploy branch `:20735` with its RETRY button.

---

## §9 — Tool ownership

**INVARIANT — every tool has exactly one row here, and the row is the contract.**

```
ToolHost.open(toolId, { from })     // the ONLY way a tool is mounted
```

| Tool | Host | Back target | Storage owner | Offline | Tiers |
|---|---|---|---|---|---|
| Deploy | `#ops-tool-host` | `showMode('work')` | `phantom_deployments_v1` | ✅ | all |
| Master intake | `#ops-tool-host` | caller | `PHANTOM_MASTER_STORE` | ✅ | all |
| BOM | `#ops-tool-host` | caller | `phantom_bom_*` | ✅ | all |
| Manifest | `#ops-tool-host` | caller | deployment record | ✅ | all |
| Port Map | `#ops-tool-host` | caller | — | ✅ local path §7.5 | all |
| Rack Map | `#ops-tool-host` | caller | `dct_racks_v1` → consolidate | ✅ | all |
| Scan | `#ops-tool-host` | caller | `phantom_scan_collection` | ✅ | all |
| Handoff | **inside Shift** | Shift | `phantom_handoff_v1` | ✅ | all |
| SOPs | `#ops-tool-host` | caller | `_sopStore` | ✅ | all — **restored** |
| Audits | `#ops-tool-host` | caller | `phantom_audits_v1` | ✅ | all |
| Burndown | → worklist | — | `dct_burndown_v1` | ✅ local path §7.5 | all |
| Blast Radius | `#ops-tool-host` | caller | render-scoped | ✅ | all |
| Optic Inventory | `#ops-tool-host` | caller | `_opticStore` | ✅ local path §7.5 | all — **phone door added** |
| **Shift** | `#pg-shift` | — (pillar) | reads only | ✅ | all — **nav slot 5** |

**Back contract.** `rd_openOpsTool` `:29551` currently defaults back to `wk_showGrid()`, which adds `.wk-grid` — but `.bw-on` is still latched, so it lands on the **hidden** launcher. Five call sites rely on that default and every one of them strands the tech (`03` D4).

The default becomes **the caller's surface**, recorded by `Router` at open time. `wk_showGrid()` was retired with the launcher and is not preserved as a target that leads nowhere.

**Drill-in guard.** Tools render *below* `#bw-shell`, which is `display:block` for all of `#pg-work` `:53349` with no guard — so a tool paints underneath a live WebGL rack (`03` D5). `ToolHost` hides `#bw-shell` on open and calls `RackExperience.suspend()`. Two defects, one owner.

**Naming.** OPS cell `:13490` carries `aria-label="Optics — fiber, form factors and MPO"` — the *Reference* card's description — but routes to the inventory scanner `:47237`. A tech tapping the label gets the wrong tool. The tool becomes **OPTIC INVENTORY**; "Fiber · Form factors · MPO" stays with the Ref card `:13539`. (`CLAUDE.md`: *names say what the door opens*.)

**Vocabulary.** `Vocabulary` (owner 6) resolves the six colour maps. Per RACK SCENE LOCK, type colours in the 3D scene are **locked** — so `TYPE_COLOR` `:19056` cannot move, and therefore it is canonical by construction. The other five maps come to it, and CSS is generated from it rather than hand-maintained alongside it. This also fixes the P0 in `07` Q2: the flat elevation writes RAW type codes `:36255` into `data-type` while the CSS `:10439` is keyed on the EDP vocabulary — intersection `{gpu}` — so **nine of ten device classes render as one grey.** `Vocabulary.typeOf()` normalises before the write.

---

## §10 — Responsive layouts and compositions

### 10.1 Three named tiers

| Tier | Width | Device | Chrome |
|---|---|---|---|
| **PHONE** | < 851px | iPhone — **the primary device** | bottom nav, single column |
| **LAPTOP** | 851 – 1519px | laptop, iPad landscape | `.cshell` sidebar + topbar, 2-region content |
| **DESKTOP** | ≥ 1520px | desk monitor | sidebar + 3-column grid |

851 is your ruling and matches every existing `.cshell` query (`:53527`, `:53620`, `:53719`, `:53996`).

**1520 is chosen deliberately.** `#cs-grid` `:54017` needs 1200px of column and gets `1500 − 246 sidebar − 56 padding = 1198px` — two pixels short — and `#cmd-shell{overflow-x:hidden}` `:53191` **clips** rather than scrolls. R-01 §5 required this fixed in the same ship. Making 1520 the tier boundary turns a magic-number patch into a structural boundary.

### 10.2 What ships per tier

| | PHONE | LAPTOP | DESKTOP |
|---|---|---|---|
| Command | flex column | 2-region grid | 3-column grid |
| Work | phone column | **capped + composed** (new) | capped + composed |
| Ref | 2 col | 3–4 col, capped | 4 col, capped 1080 |
| Nav | bottom nav | sidebar | sidebar |

**Ref genuinely composes today. Command composes at ≥1024. Work never composes** (`05` C2): `#bw-shell` has a `max-width` only under `.cshell` `:53628`, so at 1440px it runs ~1314px wide with `.bw-mx` as `repeat(4,1fr)` — four ~325px cells each holding an **8px** label `:53428` over a 17px number. `#bw-shell` gets a cap outside `.cshell`.

### 10.3 Decision: one Command, not two

R-01 says promote `.cshell` above 851px. Implemented literally — flip the gate — that ships `#cmd-shell` `:13217`, **a complete second Command implementation** with independent site, health and tool wiring (`03` D8), as the laptop and desktop experience. Two Commands both live means every future Command change lands twice or silently diverges. That is the defect this whole document exists to remove.

**Decision: `#pg-cmd` is the single Command at every tier.** The `.cshell` *chrome* — `#cs-side`, `#cs-top` — is promoted exactly as you ruled and wraps `#pg-cmd`. `#cmd-shell` is audited for any capability `#pg-cmd` lacks; anything unique is ported first; only then is it deleted (your step 8: *remove obsolete implementations only after replacements pass*).

This honours the intent of R-01 — the desktop composition ships — without shipping the duplicate. **It also makes R-01 a milestone rather than a flag flip**, and you should know that before you approve the schedule.

### 10.4 Binding constraints from R-01

Carried verbatim from `audit/00`:

1. 851px breakpoint — do not invent a new one ✅ §10.1
2. `?cshell=0` rip-cord, per-URL, **non-persisted** — the anti-pattern the `.380` trap identified is persistence, not the flag
3. Phone composition untouched below 851px
4. `?legacy=1` stays byte-identical — `.cshell` is a `body.rd` concern only
5. The 1500px clip fixed in the same ship ✅ §10.1
6. 136px of dead runway removed — nav is `display:none` under `.cshell` `:53807` but `.page` still carries `padding-bottom:calc(var(--rd-navclear)+20px)` `:1088`
7. Sidebar/topbar literals tokenised → `--cs-side-w` / `--cs-top-h`

### 10.5 Fixed-strip clearance

`#ph-dock` `:9247` derives its clearance from its own `min-height` token — **correct, and the model.** `#rd-botnav` `:9564` **declares no height at all** while `--rd-navclear` `:1087` hard-codes 96px to describe it. Current slack is ~6px and `.bicon` already grew from 46 to 54 in `.339`. This is the `.341` failure the comment at `:1097` documents, applied to one strip and not the other.

**One line:** `#rd-botnav { min-height: var(--rd-navclear); box-sizing: border-box; }` — closes the class permanently.

### 10.6 Zero horizontal overflow

Rule 1 holds and the global lock is real (`05` C4): 0 hits for `width:NNNpx ≥ 361`, 0 for `min-width ≥ 361`, 0 for `width:100vw`. Two risks retained as work items: `.dt` tables `:1203` across 80 call sites have `width:100%` with no `table-layout:fixed` and no scroll wrapper, so a long MPO trunk ID would be **clipped by the ancestor `overflow-x:hidden` — silently lost, not scrolled**; and there is no global `img{max-width:100%}`, so a future untagged image breaks Rule 1.

### 10.7 Accessibility floor

Gloved hands in aisle lighting, so these are correctness not polish:

- `#rd-botnav .blabel` `:9573` — `#4a565f` on `#030304` = **2.74:1** at **9px**, on the app's primary navigation. Worst pair in the file. → `--slate` at 10px.
- `--slate-dim` used as `color:` at `:9505`, `:9540`, `:9549` — **3.06:1**, and the token's own comment `:342` says *"borders/decoration only, NEVER text."* Three self-violations, all on Command.
- The 10px type guard `:10800` only matches inline `style` attributes, so all **86** sub-10px sizes declared in CSS rules bypass it.
- `.reh-3d-seg` `:10657` ≈22px — the rack view pills, raised to 46px only inside `.bw-prev` `:53583`. Standing owner item.
- Two **destructive** 28px targets: optic DELETE `:47186`, audit DELETE ENTRY `:49005`.

Already correct and retained: all 17 hover rules inside `@media (hover:hover)` · zero `title=` tooltips · a correct two-layer focus ring `:266`/`:3936` with no unreplaced `outline:none` across 49 occurrences.

### 10.8 Performance

- **Two boot rAF loops run for the entire session** `:12916`, `:12940` — no exit condition, no stored handle, no visibility guard. `launch()` `:18316` sets `boot.style.display='none'` and **`boot.remove()` appears 0 times in the file** (verified), so the closures hold live canvas references forever. `ef` costs ~20 `fillText` with a rebuilt font string per frame onto a canvas nobody sees. These are 2D contexts so they are **not** the refusal's root cause — but they are a continuous tax for a full shift on the primary device, and iOS WebKit sheds WebGL contexts under memory pressure. Store the handles, cancel in `launch()`. Zero visual change.
- Five `setInterval` timers tick while the screen is off `:18810`, `:18120`, `:50484`, `:50299`, `:50368`. The SW poll `:12536` is visibility-gated and is the pattern to copy.
- `rackFlat_applyFit` `:36325` reads a rect, writes `canvas.style.height` `:36343`, then reads again `:36346` — one forced reflow per call. Hoist the read.
- The `.310` SURFACE-GLOW block `:53146` declares `background`/`border`/`box-shadow`/`filter` all `!important` over `.lens`, `.nba`, `.stat`, `.tile`, `.gx*`, **silently voiding four base card rules** at `:9328`, `:9499`, `:9509`, `:9529`. Because `--glow-a: 0%` `:8842` it currently paints nothing visible — so it is doing no work while making every base rule inert. Any future edit to those four rules will not paint.

---

## §11 — Migration plan

Your ten steps, executed as eight stages. **Data safety comes before refactoring, not after.** Every stage is independently shippable, independently revertable, and ends at a device gate.

### Stage 0 — Instrument and stop the bleeding
*No visual change. No behavioural change except honesty.*

- `RackExperience.report()` — the non-allocating probe (§5.4)
- I5: probe canvases stop allocating (`01` F1)
- Cancel the two boot rAF loops in `launch()` (`05` C3)

**Exit:** your 15 questions answered on hardware. Renderer count **before** the correction, measured.
**Revert:** trivial — additive only.

### Stage 1 — Protect user data
*Your step 5. Nothing downstream may touch storage until this lands.*

- `Store` registry + `safeGet` / `safeRemove` (§6.1, §6.2)
- `exportAllData` derived — the 16 missing keys enter the backup (`04` ST7)
- `phantom_node_status_v1` through `safeStore` (`04` ST1)
- Wrap the two unguarded `setItem` (`04` ST2)
- `ge_load` read-modify-write (`04` ST3)
- Corrupt-data quarantine path (`04` ST8)
- Precache `pdf.min.js` + `pdf.worker.min.js` (`04` ST5)

**Exit:** export → wipe → restore round-trips **every** key with a real deployment loaded.
**Revert:** registry is additive; backup expansion is backward-compatible.

### Stage 2a — Context Arbiter
**This is the stage that closes the iPhone blocker.**

- `RackExperience` owns allocation; both renderers request through it
- I1 one context · I4 controller-owned visibility · I6 reclaim barrier

**Exit:** your full 12-step device sequence, ten Build entries, zero refusals, zero orphaned loops.
**Revert:** single controller object; callers restore to direct calls.

### Stage 2b — Scene reuse
- I2 create ≠ update · I3 stable `#bw-mount`
- `bw_render` splits: panels re-render, scene updates
- Camera / explode / cables survive (`02` S5)

**Exit:** checklist toggle, evidence save, phase complete — **zero** new contexts, camera angle preserved.

### Stage 3 — Honesty
- Field blockers vs review issues, both named (`02` S3)
- Rack status derived; three counters become real (`02` S4)
- `Vocabulary`: `TYPE_COLOR` canonical, CSS derived, flat elevation gets its nine colours back (`07` Q2/Q3)
- OPTIC INVENTORY rename (`03` D7)
- Silent failures on user-facing paths get warn + toast (`06` R6)
- `DEPLOY_PHASE_LABELS_FULL` deleted (byte-identical duplicate, both live)

**Exit:** every number on Command traceable to the store it claims to count.

### Stage 4 — `PhantomIntelligence` (R-03)
*The largest new build in the program. Depends on Stage 1 for queue persistence.*

- One service boundary; `phantomAPI` + `phantomAI` collapse into it; the `:42926` bypass deleted (§7.3)
- Six capability states replace generic failure (§7.4)
- **Local-first path for all five capability families** (§7.5) — this is the bulk of the stage
- Deterministic Next Best Action from live local state
- Queue: persisted, deduped, cancellable, **user-released** (§7.6)
- Cache with provenance and `sourceHash` staleness detection
- Provider behind the abstraction; `PHANTOM_PROXY_URL` no longer reachable from feature code

**Exit:** airplane mode on the phone — every AI feature reports an honest state and offers a working local path. Nothing says "API call failed."
**Revert:** boundary wraps the existing functions; feature code is repointed, not rewritten.

### Stage 5 — Doors and routing
- `ToolHost` + `Router`; `goOpsTab` deleted, 5 callers repointed
- SOPs door restored; `openSopDetail` repointed (`06` A2)
- Rack Map button `:29590` repointed (`06` A1)
- Default back → caller's surface (`03` D4); `deleteSOP` back control (`06` A4)
- Derived sheet registry (H4); `params` honoured on restore (D3); `_rdMode` synced (D4)
- Optic Inventory phone door (`03` D2)
- Drill-in guard: `#bw-shell` hidden + rack suspended on tool open

**Exit:** every door in §3.2 reachable and returning correctly, on the phone, offline.

### Stage 6 — SHIFT (R-02)
*Depends on Stage 3 (honest blockers), Stage 4 (queue state), Stage 5 (Router/ToolHost).*

- `#pg-shift` built to answer the nine questions (§3.4)
- **Primary nav becomes 5 slots; `EXIT` `:16039` removed from slot 4**
- Handoff absorbed; the 4 half-surfaces retired into it
- Readiness as an explicit gate list — **no fabricated score**
- Shift report generated locally, AI-enhanced when available and cached with provenance
- Queue and local change journal surfaced

**Exit:** a full simulated shift on the phone, offline, ending in a generated handoff.
**Revert:** additive surface; nav slot 4 restores to EXIT.

### Stage 7 — Composition
- `.cshell` default ≥851 with `?cshell=0` rip-cord (R-01)
- `#pg-cmd` composed into `.cshell` chrome; `#cmd-shell` capability port (§10.3)
- `#bw-shell` cap outside `.cshell` (`05` C2)
- 1520 tier boundary; dead runway removed; `--cs-side-w`/`--cs-top-h`
- `#rd-botnav{min-height}` (`05` C5)
- a11y floor: nav labels, `--slate-dim`, `.reh-3d-seg`, destructive targets (`05` C6)
- Visibility-gate the five always-on intervals (`05` C7)

**Exit:** the R-01 width matrix — 851 / 1024 / 1440 / **1500 / 1501** / 1600 — plus a phone pass proving nothing below 851 moved.

### Stage 8 — Consolidation
- Engine merge: `aisle` becomes a mode; `forge3d_render` deleted (§5.5)
- `#cmd-shell` deleted (its replacement now passes)
- Burndown → worklist
- Duplicate doors collapsed to one each (`03` D6)
- Shared `escHtml` / toast / `debounce` / date formatter (`07` Q5 — note `escHtml(0)` currently returns `''`, a live data bug)
- `.310` `!important` block resolved against the four base rules it voids

**Exit:** one implementation per feature. `tools/inventory.js` clean.

### Stage 9 — Removal
*Only after everything above passes on hardware.*

- Dead code (`07` Q7) — re-confirmed per item via `tools/inventory.js`, never bulk-deleted
- ~850 KB orphaned assets
- Legacy cold-delete pass — **gated on your census sign-off**, per standing `CLAUDE.md` rule 7. **Unruled as of this revision; parked, and nothing upstream depends on it.**

**Exit:** your signature.

---

## §12 — Milestone plan

| M | Stages | Deliverable | Gate |
|---|---|---|---|
| **M0** | 0 | Instrumented build; your 15 questions answered on hardware | Device probe report |
| **M1** | 1 | No user data can be silently lost | Backup round-trip on a real deployment |
| **M2** | 2a + 2b | **iPhone WebGL blocker closed** | Your 12-step sequence, ×10 Build entries |
| **M3** | 3 + 4 | Every number honest; AI never blocks the aisle | Airplane-mode pass — every AI feature has a working local path |
| **M4** | 5 + 6 | Every door works; **SHIFT ships as a pillar** | Full simulated shift, offline, phone, ending in a handoff |
| **M5** | 7 | One product across phone, laptop, desktop | R-01 width matrix + phone regression |
| **M6** | 8 + 9 | One implementation per feature | Inventory clean + your census sign-off |

**M2 is the unblock.** Phase 3 and broad UI work stay stopped until M2 passes on the physical iPhone, per your directive.

**M3 and M4 are where the product changes shape.** M3 is the larger build of the two — the local-first paths in §7.5 are five separate deterministic workflows, not five status labels.

---

## §13 — Verification plan

### 13.1 Mechanical gates — every ship, no exceptions

Unchanged from `CLAUDE.md`: OODA `curl` live main before any edit · surgical `str_replace` only · `node --check` ×3 · CSS brace balance · CRLF preserved · three-stamp lockstep · one ship per version · `?legacy=1` byte-identical. `phantom-ship-gate` and `phantom-rd-reviewer` run before every commit.

### 13.2 The renderer sequence (M2) — your 12 steps

Force-close → cold open → **Build first** → rack renders → Command and back → Open Aisle and back → toggle checklist → save evidence → complete a phase → Port Map and back → background/foreground → repeat Build entry ×10.

At every point, `RackExperience.report()` must show: **one** active interactive renderer · **one** rack canvas · zero context refusals · zero orphaned animation loops · zero duplicate canvases · active-rack state preserved · **zero new contexts during ordinary Build updates**.

Renderer count reported **before** (M0) and **after** (M2), from the same instrument.

### 13.3 Data gate (M1)

Load a real deployment with checklist state, evidence, field blockers, scan results and an audit walk → export → clear storage → restore → **every** value present. Repeat with the storage quota deliberately exhausted; confirm the toast fires and nothing is silently dropped.

### 13.4 Airplane-mode gate (M3) — the R-03 acceptance test

Phone in airplane mode, real deployment loaded. For **each** of the five capability families in §7.5:

- The feature opens and reports one of the six honest states — never "API call failed"
- The local path is reachable and **does useful work**
- Queuing, where offered, persists across a force-close and does **not** transmit on reconnect without an explicit tap
- Any cached result displays source, age, scope and whether revalidation is recommended

Then restore signal and confirm: nothing auto-uploaded, the queue flushes only when released, and outcomes are recorded honestly. **Zero direct provider calls** outside the boundary — verified by grep, not by review.

### 13.5 Door sweep and shift gate (M4)

Every row in §3.2 and §9, on the phone, offline: reachable in ≤3 taps from its page · renders · back returns to the caller · no dead tap · no silent failure. The five previously-dead doors (`06` A1–A4, `03` D1) are explicit line items.

Then a **full simulated shift**, offline, phone: open a deployment · complete phases · log a field blocker · add evidence · check Shift answers all nine questions from §3.4 · confirm readiness shows real gates with no fabricated score · generate the handoff · confirm the next-tech note is present. Primary nav shows five slots and no `EXIT`.

### 13.6 Composition matrix (M5)

851 · 1024 · 1440 · **1500** · **1501** · 1600 — plus a full phone pass proving nothing below 851px moved. Zero horizontal overflow at every width. `?cshell=0` returns the phone composition. `?legacy=1` byte-identical.

### 13.7 Regression corpus

Standing checks, run at every milestone, derived from bugs that already shipped once:

- No `var()` on a token undefined in the rendering tree (mock-token trap)
- No `position:fixed` child of a transformed host
- No `display:contents` ancestor over a JS-measured element
- Every fixed strip's clearance reads its own `min-height` token
- Every new field in a persisted object is in that store's save path
- No `if (!x) return` on a user-facing path
- Art `width`/`height` attribute matches the decoded aspect

---

## §14 — Decisions register

### 14.1 Decided under your delegation

| # | Decision | Rationale |
|---|---|---|
| D-01 | Seven ownership boundaries, not a rewrite | Domain logic is sound; the defect is ownership (§1) |
| D-02 | I6 reclaim barrier instead of retries | You banned retries; ordering is the correct fix (§5.3) |
| D-03 | Rack status **derived** from phases | No new field, no migration, no drift; five dead consumers become real (§4.3) |
| D-04 | Field blocker and review issue named separately | Two real concepts; merging is dishonest either way (§4.4) |
| D-05 | `TYPE_COLOR` canonical | RACK SCENE LOCK holds it fixed, so it is canonical by construction (§9) |
| D-06 | `#pg-cmd` is the only Command; `#cmd-shell` deleted after port | R-01 flipped literally ships two Commands (§10.3) |
| D-07 | 1520px is the DESKTOP boundary | Turns the R-01 §5 clip fix into a structural boundary (§10.1) |
| D-08 | ~~Port Map retained, marked online-required~~ → **superseded by R-03**: it gets a full local path, not a warning label | A marker was the minimum honest fix; the owner ruled for the stronger one (§7.5) |
| D-09 | Engine merge deferred to Stage 6 | Context arbiter delivers the unblock without risking the locked scene (§5.5) |
| D-10 | Backup membership derived from the key registry | A hand-maintained list is how 16 keys went missing (§6.1) |
| D-11 | Data safety (Stage 1) precedes all refactoring | Your step 5, ordered first (§11) |
| D-12 | Deterministic Next Best Action becomes the *primary* NBA; AI is the deeper tier | Better than a round-trip for the common case, and it works in the aisle (§7.5) |
| D-13 | Reconnection **enables** the queue; it never sends | R-03 forbids auto-upload on connection; the send needs a tap (§7.6) |
| D-14 | `sourceHash` on every cache entry | Without it, "has the source changed?" is unanswerable and stale AI output reads as fact (§7.6) |
| D-15 | Shift readiness is a gate list with a met/total count, never a percentage | R-03's *do not fabricate a score*, and the standing never-label-absent-telemetry rule (§3.4) |
| D-16 | `Store` gains a write journal | The only honest source for Shift's "what changed locally?" — diffing would be guesswork (§6.1) |
| D-17 | **Hold-to-freeze survives the EXIT slot and moves INTO Shift** (owner ruling 2026-08-08) | R-02 removes `EXIT` from primary nav as a browser behaviour, but the control it removes does not *leave* — it raises the freeze curtain, whose own copy reads **"shift state saved · nothing lost."** That is a shift-boundary action, not a browser action. Deleting the slot without re-homing `rd_freeze` would delete a real safety affordance by accident (§3.4a) |

### 14.2 Standing owner rulings, incorporated

- **R-01** — `.cshell` default above 851px, with all seven binding constraints (§10.4)
- **R-02** — **SHIFT is a real PHANTOM pillar.** Primary nav is Command · Build · Scan · Tools · Shift. `EXIT` must not occupy a primary slot. Handoff, shift notes, blockers, work completed/pending, evidence, synchronization state and report generation consolidate into one coherent Shift experience answering nine questions. **Readiness derives from real local gates; no fabricated score.** (§3.4, Stage 6)
- **R-02a — HOLD-TO-FREEZE MOVES INTO SHIFT** (owner ruling 2026-08-08, closing the one question R-02 left open). Removing `EXIT` from primary nav removes the **slot**, not the **feature**. `rd_freeze` / `rd_wake` / `#rd-freeze-curtain` are re-homed as a Shift action — ending a shift is exactly when a tech freezes the app, and the curtain already says *"shift state saved · nothing lost."* **The freeze must not be deleted alongside the slot.** See §3.4a.
- **R-03** — **PHANTOM is offline-first, not offline-only.** All AI capabilities retained and treated as first-class. Core law: *no essential field workflow may become unusable because the proxy, connection or external service is unavailable.* Six honest capability states; a local/manual path per capability; a persisted, user-released queue; cached results with provenance; one canonical `PhantomIntelligence` boundary with the provider replaceable behind it. The Anthropic proxy is an approved external dependency. (§7, Stage 4)
- **R-06 — PHYSICAL RACK TOPOLOGY EXISTS INDEPENDENTLY OF MASTER CONTENT.** (2026-08-06, from the `s3:172` field report.) PHANTOM must separate **physical rack topology** from **Master-provided rack contents**. Topology defines which cabinets exist and where they appear; the Master *enriches* them with devices, assignments, cabling and metadata. **The Master must not determine whether a physical cabinet exists.** A zero-component rack is a **valid rack state, not a missing-rack state.** Required rendering, per cabinet: full data → cabinet + all known devices · partial → cabinet + devices + honest missing-data states · no Master devices → **a complete empty 48U cabinet shell** · cabling-only → shell plus available cabling/assignment metadata · unknown assignment → shell marked unassigned/unknown, **never absent**. If the front rendering represents five cabinet positions, **all five always render.** Required data architecture: resolve the row topology and expected positions → create one canonical rack shell per expected position → merge Master records into the matching shell → **leave unmatched shells present as empty racks** → preserve stable IDs and ordering → render the row from that canonical topology. **Never build the row list by filtering to populated Master records.** Lands with `_resolve` at M2-b (RACKENGINE-SPEC §7/§7.1/§9).
- **RACK SCENE LOCK** — camera OPEN; materials, §A light rig, fog, tone mapping, tray geometry, type colours, bezel strips, floor, reflection, boot LOCKED. No stage touches these.
- **Legacy cold-delete** — gated on your census sign-off. Stage 7 only.
- **Command uses static artwork** — `cmd_rackHero3D` deleted, not revived.

### 14.3 Visible deltas — for the verify pass, not for approval

Decided. Listed so nothing surprises you on the device:

1. **Rack Map GPU goes purple → cyan** (D-05). Five surfaces converge on the locked 3D palette.
2. **Flat elevation gains nine colours** it does not have today (`07` Q2) — a large delta on a surface you read in the aisle.
3. **Laptop/desktop Command is `#pg-cmd`** in the `.cshell` chrome; `#cmd-shell` is ported then deleted (D-06).
4. **Primary nav loses `EXIT`, gains `SHIFT`** (R-02).

### 14.4 Open verification debt

Carried honestly rather than assumed:

- **`audit/07` was not independently re-verified** — context was exhausted. Its claims are well-evidenced and internally consistent, but every load-bearing item re-confirms before it drives an edit. Q2 and Q3 drive Stage 3, so they verify first.
- **`audit/02` S6 is superseded.** It concluded that no synchronization subsystem exists *by design* and that nothing there needed building. That was an accurate reading of the code and is no longer an accurate reading of the product: R-03 creates a real outbound queue and R-02 requires Shift to report it. PHANTOM remains single-device and local-authoritative — the queue carries deferred AI requests, not replicated data. (§4.1)
- **Decision 3 of the three I raised — legacy retirement — is unruled.** Stage 9 is parked. Nothing upstream depends on it, so the program runs to M5 without an answer.
- `font-size: revert !important` `:10811` — does the BLE-printer exception actually yield 8px? Needs a render check.
- BOM's exact storage key set.
- `mscope_open`'s `deploy_ensureDeployPanelVisible` `:31735` interaction with `.bw-on`.
- ~120 dead CSS class candidates — classes assigned via `el.className = someVar` are invisible to static scanning. `tools/inventory.js` per class before any deletion.

**Closed during blueprint authoring:** Port Map *is* network-dependent — `runPortMapDirect` `:43412` → `renderPortMapValidator` → `phantomAI('portmap')` `:45584` → the Anthropic proxy `:17576`. §7.3 is written on verified evidence. The ghost-FAB does not exist in this file; the `CLAUDE.md` backlog item has no code behind it.

---

## §15 — What this blueprint does not do

- It does not rewrite parsing, classification, validation, checklist, phase, ingest, optic or audit logic.
- It does not change the rack scene.
- It does not touch the phone composition below 851px.
- It does not break `?legacy=1`.
- It does not add a framework, a build step, a second file, or a runtime dependency.
- It does not delete anything before its replacement passes on hardware.

---

**Direction approved 2026-08-05. Starting M0.**

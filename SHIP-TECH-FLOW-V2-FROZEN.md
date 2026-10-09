# SHIP-TECH-FLOW v2 — FROZEN

**Status:** FROZEN SPECIFICATION — implement as written. Do not redesign, extend, or "improve" the product model. If a genuine contradiction is found, STOP and report it; do not resolve it silently.
**Merges:** Fable operating model (v1) + eight adversarial hardening changes + four contract closures.
**Repo:** darkmatter024/phantom · single file `dct-ios.html` (~51k lines) + `sw.js` + `version.json`
**Doctrine (non-negotiable):** Cold Aisle Filter (gloved use, ≥44pt targets) · Data Honesty (no fabricated telemetry, no unlabeled provenance) · Two-House (`body.rd` redesign + `?legacy=1` byte-identical rip-cord) · Three-Stamp Version Lockstep (dct-ios.html / sw.js / version.json) · Surgical str_replace-only edits · iPhone device-verify as hard ship gate · One emitter per screen · Canonical-module principle.

---

## 0. Thesis

PHANTOM has an **exposure problem, not a feature problem**. This milestone routes existing capability behind context instead of exposing it as parallel doors. Governing principles:

1. **Context can be wrong.** Every contextual assumption is visible and overridable in one gesture (Context Chip).
2. **Phase engine is milestone zero.** Contextual surfacing requires a machine-readable step model before any UI work.
3. **Data honesty extends to provenance and identity.** PHANTOM reports only what it observed, labels where every piece of data came from, and credits work to the person who did it.
4. **Scan is demoted in hierarchy, not in access.** Action, not destination.
5. **Add-nothing rule:** `PHASE_MODEL`, the Event Log, and the Blocker record are the ONLY permitted data additions. Everything else is routing, folding, and relabeling of existing capability.

**LOCKED: TAP TO ENTER stays.** The ghost splash is PHANTOM's identity anchor. It is upgraded to earn its tap (§3), never removed.

---

## 1. Milestone Sequence

Implement strictly in this order. Each step gates the next.

| # | Workstream | Gate to proceed |
|---|-----------|-----------------|
| 1 | **PHASE-ENGINE** — step/phase data model + Event Log + Blocker record | Model validates against a real Master; events append correctly |
| 2 | **SITE-PROFILE** — `ACTIVE_SITE_PROFILE` with Operator split (= SHIP-CONTEXT-INJECT-369) | Profile survives reload; injects via `buildContext()`; atomic Master swap verified |
| 3 | **CONTEXT-CHIP** — visible, overridable context | Any wrong assumption correctable in ≤2 taps |
| 4 | **NAV-LOCK** — four navigation states + Scan action | Legacy doors reachable only via SITE/SYSTEM; router has exactly 4 primary states |
| 5 | **CONTEXTUAL-SCAN** — context-routed scanning + mismatch flow | Scan routes correctly from any tab; as-built overlay audited |
| 6 | **HONEST-HANDOFF** — OBSERVED/REPORTED shift capture, scoped handoff object | Handoff renders from Event Log slice only; scope matches §8.3 exactly |
| 7 | **FINISH-PASS** — visual polish + SHIP-ART-PARITY-SWEEP lands here | iPhone device-verify on the complete flow |

**No visual redesign before step 4 completes.** Polishing a maze is wasted effort.

---

## 2. Identity Model — Site Lead ≠ Current Operator

```
ACTIVE_SITE_PROFILE = {
  id,                    // stable profile id
  site,                  // e.g. "BRV-01"
  siteLead,              // authority — set at Site Setup, changed only in SITE/SYSTEM
  currentOperator,       // the person doing the work RIGHT NOW on this device
  activeMasterId,        // exactly one
  createdAt, updatedAt
}
```

Rules:

- **Site Lead** = authority. **Current Operator** = actor. They are often the same person; the model never assumes it.
- Every Event Log entry records `actor = currentOperator` at time of the event. Work is NEVER auto-credited to the Site Lead.
- **Operator switching — no new surface.** Two existing surfaces carry it:
  1. **TAP TO ENTER:** current operator name renders under the ghost with a `NOT YOU?` tap target (≥44pt). Tapping opens a minimal name entry/select, then proceeds to enter.
  2. **Context Chip sheet (§5):** one row — `OPERATOR: <name>` — tappable to switch mid-shift.
- Switching operator writes an `OPERATOR_CHANGE` event to the Event Log. It does not touch Site Lead, Master, rack, or phase state.

---

## 3. TAP TO ENTER — Identity Gate (KEPT, upgraded)

The gate earns its tap by doing real work behind the ghost:

- **During splash render (before tap):** service worker registration/update check, `ACTIVE_SITE_PROFILE` hydration from localStorage, active Master cache warm, `navigator.storage.persist()` check.
- **On tap:** context already resolved → route to Home with zero post-entry loading state.
- **Ghost = loading indicator.** Subtle rim-light pulse (existing cyan/violet tokens) while hydration runs; steady glow when ready. Tap-before-ready holds on the ghost with pulse, then enters when hydration completes.
- **Operator line:** current operator name + `NOT YOU?` under the ghost (§2).
- **First run:** no `ACTIVE_SITE_PROFILE` → tap routes to Site Setup (§4) instead of Home.
- **Version stamp:** three-stamp version stays visible, small, bottom of splash. This is the ONE technician surface where internal machinery is permitted (support lifeline).

Do not add anything else to this screen. It is a favorite; treat it as locked art.

---

## 4. SITE-PROFILE, Site Setup, and ONE ACTIVE MASTER

### 4.1 First-run Site Setup flow

Welcome → Site → Site Lead → (Operator defaults to Site Lead, editable) → Choose Master file → parse → validation summary → `[ ACTIVATE SITE ]`.

Validation summary shows counts only:

```
BRV-01
MASTER VALIDATED
24 RACKS · 144 HOSTS · 68 CABLES
SITE LEAD  John Hamilton
[ ACTIVATE SITE ]
```

Parser diagnostics, sheet names, normalization detail: behind `[ VIEW DETAILS ]`, and only on failure.

### 4.2 ONE ACTIVE_SITE_PROFILE · ONE ACTIVE_MASTER

- Exactly one profile, exactly one active Master, at all times.
- **Candidate imports never participate in UI.** A Master being imported parses into a **staging object** invisible to every technician surface.
- Failed import: candidate is discarded; active Master untouched. UI guarantee: *"Your current site has not been changed."* This is a hard guarantee, not copy.
- Successful import: **atomic swap** — candidate becomes `activeMasterId`, derived caches rebuilt, staging cleared.
- Replace Master lives ONLY in SITE/SYSTEM and uses this same staged-swap path. No second write path to Master state anywhere in the file.

### 4.3 Event Log survives Master swap — EXPLICIT

The Event Log is **excluded from the derived-cache rebuild**. It is append-only, never rebuilt, never pruned, never cleared by a Master swap or profile edit. Events created under Master A remain after Master B activates; `masterId` on each event (§6) preserves which truth-context produced them. **Do not "helpfully" clear stale events during swap.**

---

## 5. CONTEXT-CHIP — Trust Through Visibility

Persistent chip at top of Home and Build:

```
[ BRV-01 · u1:005 · P4 NETWORK ]
```

- **Tap → bottom sheet:** rows for Rack (list from Master, current row first), Phase (from PHASE_MODEL), Operator (§2). One confirm. Any wrong assumption correctable in ≤2 taps.
- **Suggestions are confirmations, not assumptions.** Home's primary action reads `CONTINUE u1:005 · COMPUTE?` — question-mark posture. Accept = one tap; chip = escape hatch.
- **Per-device honesty:** the chip shows THIS device's context. PHANTOM never claims site-wide state it cannot observe.
- All targets ≥44pt (chip height, sheet rows, confirm).

---

## 6. PHASE-ENGINE (Milestone Zero)

### 6.1 PHASE_MODEL schema (localStorage, versioned)

```js
PHASE_MODEL = {
  version: 1,
  rackType: "COMPUTE",              // keyed by platform/rack type from Master
  source: "MASTER" | "SITE_TEMPLATE", // PROVENANCE — required, no default
  phases: [
    {
      id: "P4",
      name: "NETWORK",
      steps: [
        {
          id: "P4-S02",
          label: "Install/verify leaf uplink optics",
          requires: ["PORT_MAP"],       // tool surfaces to auto-open in Build
          expectScan: "OPTIC",          // what a scan during this step means
          expectMatch: "master.optics", // verification target in Master data
          state: "NOT_STARTED",         // see 6.2
          blockerId: null,              // set when state === "BLOCKED"
          doneAt: null, doneBy: null, evidence: []
        }
      ]
    }
  ]
}
```

**Provenance rules:**

- If the Master contains step-level workflow data → `source: "MASTER"`.
- If not, ship default per-platform templates (GB200 / GB300 / H100 / H200) → `source: "SITE_TEMPLATE"`, adjustable by Site Lead in SITE/SYSTEM.
- UI language must match provenance: a template workflow is described as *"your site template"* — NEVER phrased as if the customer Master specified it. Never store template-derived steps in a way indistinguishable from Master-derived steps. This is Data Honesty applied to provenance and matters if PHANTOM is ever audited.
- Never invent per-rack data.

### 6.2 Step state machine

```
NOT_STARTED → IN_PROGRESS → COMPLETE
                  ↓    ↑
                BLOCKED
```

- `NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `COMPLETE`. No booleans.
- `BLOCKED` REQUIRES a `blockerId` referencing a Blocker record (§6.4). A blocked step with no blocker record is an invalid state — reject the transition.
- `BLOCKED` preserves partial work: a rack halfway through Network with missing optics is BLOCKED-with-work-performed, not "incomplete."
- Every transition writes an Event Log entry.

### 6.3 Event Log (append-only)

```js
EVENT = {
  id,             // unique event id
  ts,             // ISO timestamp
  siteProfileId,  // binds to ACTIVE_SITE_PROFILE.id
  masterId,       // binds to the Master active WHEN THE EVENT OCCURRED
  rack,
  stepId,         // nullable for non-step events (OPERATOR_CHANGE, MASTER_SWAP, etc.)
  action,         // STEP_STATE_CHANGE | SCAN_VERIFIED | SCAN_MISMATCH | DISCREPANCY_LOGGED |
                  // AS_BUILT_RECORDED | BLOCKER_OPENED | BLOCKER_CLEARED | OPERATOR_CHANGE |
                  // MASTER_SWAP | HANDOFF_GENERATED
  actor,          // currentOperator at event time — never defaulted to Site Lead
  evidence        // array: photo refs, scan payloads, notes
}
```

- Append-only. No edits, no deletes. Corrections are new events referencing the old `id`.
- This log is the SOLE source for Shift capture (§8). Nothing renders in OBSERVED that lacks an event.

### 6.4 Blocker record

```js
BLOCKER = {
  blockerId,
  rack, stepId,
  desc,           // short technician-entered description, e.g. "Missing 12x LR4 optics"
  openedBy, openedAt,
  clearedBy: null, clearedAt: null
}
```

- Opening a blocker: writes `BLOCKER_OPENED` event + sets step `state: "BLOCKED"` + `blockerId`.
- Clearing: writes `BLOCKER_CLEARED` event, step returns to `IN_PROGRESS`.
- Shift's "N blockers open" derives from uncleared Blocker records — with descriptions, never bare counts alone.

### 6.5 Event Log growth policy

localStorage on a floor device that lives for months cannot grow unbounded:

- On every **Export Full Backup** (SITE/SYSTEM), events older than **14 shifts** (or 30 days, whichever is larger) are archived into the backup object and pruned from live localStorage ONLY after the backup write verifies (sha256 round-trip on the exported blob).
- Pruning without a verified backup is forbidden. If no backup has ever been taken, nothing prunes; instead surface a SITE/SYSTEM notice: `EVENT LOG LARGE — EXPORT BACKUP TO ARCHIVE`.
- Open blockers and open discrepancies are NEVER pruned regardless of age.

---

## 7. Navigation + Scan

### 7.1 Four navigation states — EXACTLY four

```
Router states: HOME · BUILD · TOOLS · SHIFT
```

- **Scan is an ACTION, not a destination.** Visually the scan button may sit center-nav:

  ```
  HOME   BUILD   [SCAN]   TOOLS   SHIFT
  ```

  but internally there are exactly FOUR navigation states. Tapping `[SCAN]` opens the scanner as an overlay/sheet on top of the current state and returns to it on dismiss. **It is not a route. Do not create a fifth route, a fifth history entry, or a `#scan` navigation state.** If you find yourself writing a Scan "page," stop — you are violating the spec.
- Deploy + Scan banner rows fold into BUILD. Handoff folds into SHIFT. Master + OPS fold into SITE/SYSTEM + contextual surfacing.
- **SITE/SYSTEM door:** small gear glyph, top-right of Home ONLY. Contents:
  - SITE PROFILE: Master, Site Lead, Replace Master, Site Template editing (§6.1)
  - SYSTEM: Export Full Backup, Restore, Storage, Offline Status
  - DIAGNOSTICS: Errors, Version, Developer
- NAV v2 glass glyphs remain locked/untouchable. Reuse; add none beyond the scan affordance.
- Scan affordance ≥44pt, glove-reachable (Cold Aisle Filter).

### 7.2 Contextual scan routing

- If current step has `expectScan` → verify scanned payload against `expectMatch` in active Master. Reuse the existing optic-verification flow (scan switch → port → scan optic → verify) as the canonical pattern.
- No step context → fall back to existing identify-and-route behavior.
- Every verification writes `SCAN_VERIFIED` or `SCAN_MISMATCH` to the Event Log.

### 7.3 Mismatch flow

```
MISMATCH DETECTED
EXPECTED  QSFP28-100G-SR4
SCANNED   QSFP28-100G-LR4
[ LOG DISCREPANCY ]     [ RECORD AS-BUILT ]
```

- `LOG DISCREPANCY` → existing Field Divergence workflow (category, severity, expected/actual, photo, audit), surfaced ONLY at the moment of mismatch — technicians never hunt for it.
- `RECORD AS-BUILT` → writes an **audited as-built overlay entry** (`AS_BUILT_RECORDED` event: who/when/what/evidence). **It never mutates Master truth.** Master = plan; overlay = reality. Any surface showing as-built values labels them as such.

---

## 8. Build, Forge, Tools

### 8.1 Build — primary workspace

Opening Build resolves current rack from context:

```
u1:005 · COMPUTE
PHASE 4 OF 5  ████████░░ 60%     ← source-labeled if SITE_TEMPLATE
NEXT  Install/verify leaf uplink optics
[ CONTINUE ]
RACK [ visualization ]   WORK 3 remaining   BLOCKERS 0
```

- Current step's `requires[]` drives contextual tool surfacing (Port Map for network steps, BOM where required). Technician does not manually choose these during guided flow.
- If `PHASE_MODEL.source === "SITE_TEMPLATE"`, the phase header carries a small `SITE TEMPLATE` tag (provenance, §6.1).

### 8.2 Forge — specialist view inside Build

- Entry: `OPEN AISLE` from Build. Auto-centers current rack ± 2 neighbors (five racks).
- Loadout picker moves under `••• → Customize View` (advanced use only).
- Forge v2.9.2 hybrid aisle build remains canonical. **This is an entry-point + default-loadout change ONLY — do not rebuild Forge internals, light rig, or view rail.**

### 8.3 Tools — reference library

- Single search + tile grid: OPTICS · PLATFORMS · CLI/IB · PARTS · KNOW · COMPASS · GHOST ECHO.
- ONE search surface — retire duplicates. No re-homing messages, no architecture terminology, no secondary nav.
- SHIP-ART-PARITY-SWEEP (glass-panel tile migration) lands with FINISH-PASS, not before.

---

## 9. HONEST-HANDOFF — Shift

### 9.1 Automatic capture

Shift accrues from the Event Log only. Nothing is manually re-entered that PHANTOM observed.

### 9.2 End-of-shift screen

```
SHIFT · 7h 43m · <CURRENT OPERATOR> · THIS DEVICE

OBSERVED  (logged by PHANTOM)
  5 racks touched · 18 steps completed · 27 scans verified
  1 discrepancy · 2 blockers open
    — u1:007 P4-S02: Missing 12x LR4 optics (opened 11:42)
    — u1:012 P2-S01: PDU whip not landed (opened 14:05)

REPORTED  (add anything PHANTOM didn't see)
  [ + verbal instructions, off-device work, site conditions ]

[ GENERATE HANDOFF ]
```

- **OBSERVED** renders exclusively from Event Log entries for this shift window. No inference, no fabrication. If it's not in the log, it does not appear.
- **REPORTED** is optional, technician-supplied, and permanently labeled as such.
- Blockers render with descriptions from Blocker records — never bare counts.
- Per-device, per-operator: the header states both.

### 9.3 Handoff object — SCOPED (≠ Full Backup)

The Shift Handoff and the Full Backup are **different objects with different paths**:

| | Shift Handoff (SHIFT tab) | Full Backup (SITE/SYSTEM) |
|---|---|---|
| Purpose | Tech-to-tech shift continuity | Disaster recovery |
| Scope | This shift only | Entire PHANTOM state |
| Risk | Low — shareable | High — internal state |

**Handoff contains EXACTLY:**

1. Shift metadata: site, operator, device, shift window, `siteProfileId`, `masterId`
2. This shift's Event Log slice
3. ALL open Blocker records (site-wide open, not just this shift — the next tech inherits them)
4. ALL open discrepancies
5. REPORTED notes
6. Human-readable summary (the §9.2 render)

**Nothing else.** No full Master payload, no caches, no settings, no identity store, no reference content, no other shifts' events. If it's not in the list above, it does not go in the handoff. Scope drift back toward full export is a spec violation.

### 9.4 Transport

- **If** the Web Share API export path already exists and is stable in the current build: use it for the handoff object (AirDrop).
- QR-chunked fallback: **use only if it already exists and is stable. Otherwise DEFER — do not build QR transport in this milestone.** (Add-nothing rule. A clever transport system is classic scope creep; the workflow comes first.)
- If no transport exists, minimum viable: handoff object downloads as a file the tech can share manually. Note the deferral in the ship report.
- Receiving a handoff merges blockers/discrepancies as OPEN items and files the event slice as an imported, source-labeled record — it never overwrites the receiving device's own Event Log or profile.
- Generation writes a `HANDOFF_GENERATED` event.

---

## 10. Guardrails & Ship Gates

- **Two-House:** all changes land in `body.rd`. `?legacy=1` remains a byte-identical rip-cord until FINISH-PASS device-verifies. Coordinate with AUDIT-LEGACY-PARAM-REPORT before touching ANY `?legacy=1`-gated code; if blast radius is unclear, stop and report.
- **Surgical edits only.** str_replace with verified-unique anchors. Use scope-index tooling before structural surgery in the ~51k-line file. No rewrites, no "cleanup while I'm here."
- **Per-milestone ship gates:** three-stamp lockstep bump → subagent passes (lockstep-auditor, surgical-edit-reviewer, data-honesty-auditor, cold-aisle-qa) → iPhone device-verify.
- **Add-nothing rule (final form):** permitted additions are `PHASE_MODEL`, Event Log, Blocker record, and the minimal UI defined in this spec. Anything else = folding/routing of existing capability. When in doubt: fold, don't build.
- **Frozen-spec rule:** genuine contradictions get reported, not silently resolved. Ambiguity resolutions must be logged in the ship report.

---

## 11. Acceptance — The Technician Test

Hand a never-seen-PHANTOM technician the phone at a rack. Without explanation they can answer:

- This is my rack. This is my phase. This is what's done.
- This is what's next. This is what I scan. This is what's wrong. This is how I complete it.

If they ask *"which of these doors do I use?"* — the milestone is not done.

Secondary acceptance checks:

- [ ] Router has exactly 4 navigation states; Scan is an overlay, not a route
- [ ] A second operator's completed step credits that operator in the Event Log
- [ ] A failed Master import leaves active Master byte-identical and visible everywhere
- [ ] A successful Master swap preserves the full Event Log with correct `masterId` on old events
- [ ] A BLOCKED step cannot exist without a Blocker record
- [ ] Handoff object contains §9.3's list exactly — verified by inspecting the payload
- [ ] SITE_TEMPLATE workflows are visually labeled and never phrased as Master-specified
- [ ] TAP TO ENTER: ghost pulses during hydration, operator line + NOT YOU? present, version stamp present, zero loading state after entry
- [ ] All new tap targets ≥44pt

---

*End of frozen specification. From here, intelligence goes into implementation quality — not product redesign.*

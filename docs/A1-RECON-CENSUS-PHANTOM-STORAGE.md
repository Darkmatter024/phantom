# PHANTOM STORAGE CENSUS — A.1 RECON
## Archaeological Survey of dct-ios.html Storage Shapes
**Date:** 2026-08-27 | **Baseline:** v1.14.xxx | **Scope:** All 11 Data Classes | **Access:** READ-ONLY

---

## 1. MASTER
**Archeological Status:** FOUNDATIONAL, ATOMIC SINGLE-ENTITY STORE

### Storage Location & Keys
- **localStorage key:** `phantom_master_v1` (LZ-string compressed UTF-16)
- **Schema version:** 1 (future revisions use `phantom_master_v2`, etc.)
- **Persistence:** ONE ACTIVE MASTER contract (owner ruling 2026-08-08); stored via PHANTOM_MASTER_STORE, never written directly

### Exact Record Shape
```javascript
// Persisted payload structure (lines 35023-35063)
{
  schemaVersion: 1,                    // number; validates schema on load
  savedAt: ISO_STRING,                 // ISO timestamp (new Date().toISOString())
  sourceFileHash: STRING | null,       // SHA-256 hex; identifies the Master for cache invalidation
  sourceFile: STRING | null,           // filename (v1.14.237+, optional, backfilled on restore)
  siteCode: STRING | null,             // site identifier from Master file
  siteVars: OBJECT | null,             // v1.14.346+; site variables map from Master SITE-VARS sheet
  totalHosts: NUMBER | null,           // v1.14.414+; count of device rows across all racks
  totalCables: NUMBER | null,          // v1.14.414+; cable row count from import
  normVersion: NUMBER,                 // v1.14.426+; normalizer generation that built racksByCab
  racksByCab: {                        // core structure; cabinet → racks
    "[cabRu_id]": {
      id: STRING,
      name: STRING,
      location: STRING,
      totalU: NUMBER,
      hosts: [ { id, name, model, serialNumber, rackU, ... }, ... ]
      // nested hosts[] retained on restore for site_derivePlatformsFromMaster()
    }
  }
}
```

### Timestamp Formats Found
- **SavedAt:** ISO string (`new Date().toISOString()` → `2026-08-27T14:32:45.123Z`)
- **Rack-ID form:** `"[cabcode]:[rack_number]:[slot]"` (regex: `/^[a-z0-9]+:[0-9]+:[0-9]+/`) or `"[cabcode]:[rack_number]"` for rack level

### Writers (Functions + Approximate Lines)
- **PHANTOM_MASTER_STORE.save()** [line 34987]: Takes parseResult, guards against host-less overwrites, writes compressed payload atomically. Returns boolean success. **ONLY writer of both shape halves.**
- **PHANTOM_MASTER.replace()** [line 35195]: Persists first via `.save()`, goes live second. Guards state atomicity; returns false if persistence fails and a prior Master exists (never splits).
- **PHANTOM_MASTER.adoptRestored()** [line 35292]: Adopts a snapshot from boot restore without re-persisting (payload already in storage).

### Readers (Functions + Approximate Lines)
- **PHANTOM_MASTER_STORE.load()** [line 35102]: Reads, decompresses, validates schema, returns null on parse error or schema mismatch. Checks `payload.schemaVersion !== 1` only.
- **PHANTOM_MASTER.active()** [line 35183]: Returns `window._lastPhantomMaster` (live in-memory pointer; 35 callers read this, not storage).
- **PHANTOM_MASTER_STORE.hostCount()** [line 34976]: Counts hosts in racksByCab[].hosts[] arrays; idempotent across both payload shapes (parse result and restored payload).
- **reconcile_run** [line 54122-54214]: Reads `PHANTOM_MASTER_STORE.load()` directly to audit Master against current state (only place reading store, not global).

### Oddities
1. **Two shapes in one store:** Fresh parse has `.stats` object (totalHosts inside); restored payload writes those at top level. v1.14.426 fix reads BOTH shapes so migrations don't lose identity/counts.
2. **Host-less protection (v1.14.414):** Incoming Master with 0 hosts refused if stored Master has >0 hosts. Operator must call `phantom_clearMaster()` to replace it. In-memory still accepts it for this session only.
3. **Quota trap (v1.14.406):** Large Masters (> 5MB compressed) fail to persist but go live anyway with `unpersisted=true` flag. Phone restarts lose it; re-import needed.
4. **Schema future-proofing:** Payloads from v1.14.237 and .346 that predate optional fields (sourceFile, siteVars) restore fine; readers do not assume presence.
5. **normVersion tracking:** v1.14.426+ tracks which normalizer generation built racksByCab. Older payloads treated as generation 1 (MASTER_NORM_VERSION constant applies by default).
6. **No flat hosts[] or cables[] in storage:** Only racksByCab with nested hosts retained. Flat arrays are derived at parse time, never persisted.

### Volume Estimate
- **Typical size:** Compressed 50–200 KB (UTF-16), decompresses to 300–600 KB JSON depending on host count
- **Records:** 1 (ONE ACTIVE MASTER, never multiple)
- **Bytes:** Largest single payload in the app; quota checks apply before save

### Status
- **WRITTEN AND READ:** Yes; live entire session
- **READS NEVER WRITTEN:** No
- **WRITTEN NEVER READ:** No (both shapes are read-capable)

---

## 2. PHASES
**Archeological Status:** ARRAY OF PHASE RECORDS PER DEPLOYMENT

### Storage Location & Keys
- **localStorage key:** `phantom_deploy_phases_v1`
- **Format:** JSON array; no compression
- **Load function:** `deploy_loadAllPhases()` [line 30884] → `safeGet(DEPLOY_PHASES_KEY, [])`
- **Save function:** `deploy_saveAllPhases(arr)` [line 30892] → `safeStore(DEPLOY_PHASES_KEY, JSON.stringify(arr))`

### Exact Record Shape
```javascript
// Phase record (lines 32751-32764)
{
  id: 'phase_' + rackId + '_' + type,     // string; composite: phase_[rackId]_[type]
  deploymentId: STRING,                   // deployment ID reference
  rackId: STRING,                         // rack ID reference (links to DEPLOY_RACKS_KEY)
  type: STRING,                           // enum: 'mechanical' | 'electrical' | 'networking' | 'staging' (DEPLOY_PHASE_TYPES)
  seqOrder: NUMBER,                       // sequence: 1=mechanical, 2=electrical, etc.
  status: STRING,                         // enum: 'pending' | 'in_progress' | 'blocked' | 'complete'
  tasksTotal: NUMBER,                     // checklist task count (Stage 3+)
  tasksDone: NUMBER,                      // completed checklist tasks
  signedOffBy: STRING | null,             // who completed it (identity_getUser() or buildLead)
  signedOffAt: NUMBER | null,             // epoch ms when completed
  _gateOverride: BOOLEAN,                 // true if phase gate was bypassed (v1.14.421+)
  _notes: STRING,                         // internal phase notes (appended [GATE OVERRIDE timestamp] on override)
  // v1.14.420 additions:
  blockerId: STRING | null,               // links to PHANTOM_BLOCKERS_KEY record if status='blocked'
  blockerNote: STRING,                    // legacy field; phase-level blocker description (pre-v1.14.420)
  blockedAt: NUMBER | null,               // epoch ms when blocked
  updatedAt: NUMBER | null                // last state change timestamp
}
```

### Timestamp Formats Found
- **signedOffAt, blockedAt, updatedAt:** epoch milliseconds (`Date.now()`)
- **_notes:** appended ISO timestamps on gate override `[GATE OVERRIDE 2026-08-27T14:32:45.123Z]`

### Rack-ID Form
- Combined form: `phase_[rackId]_[type]` (example: `phase_rack_deploy123_0_mechanical`)

### Writers (Functions + Approximate Lines)
- **deploy_seedRacksAndPhases()** [line 32727]: Creates initial phase records for seeded racks on deployment creation.
- **deploy_advancePhase()** [line 32783]: Mutates status, sets signedOffAt/signedOffBy when completing. Only writer of state transitions.
- **deploy_overrideGate()** [line 32867]: Sets _gateOverride=true, appends timestamp to _notes.
- **PHANTOM_BLOCKERS.migrate()** [line 26010]: Links phase to blockerId when adopting pre-v1.14.420 blocked phases (one-time migration).
- **blocker_save()** [line 26046]: Sets blockerId, blockerNote, blockedAt when blocking a phase.

### Readers (Functions + Approximate Lines)
- **deploy_loadPhasesFor(deployId)** [line 30888]: Returns phases for specific deployment.
- **deploy_isPhaseGated()** [line 32857]: Checks if previous phase is complete (guards sequential flow).
- **phdock_render()** [line 42242]: Renders phase cards; reads status to determine styling.
- **Multiple status checks** [lines 24154, 25722, 26012, 32624–32669]: Filtered by status='blocked', 'complete', 'in_progress'.

### Oddities
1. **Pre-v1.14.420 migration:** Phases with status='blocked' but no blockerId adopted into PHANTOM_BLOCKERS records; blockerId then linked back (lines 26010–26043).
2. **Composite ID form:** Phase ID builds from rackId (itself composite) + type, creating chains like `phase_rack_deploy123_0_electrical`.
3. **_notes accumulation:** Gate override appends timestamps; no clearing. Field is transient UI state, never cleared on re-read.
4. **Stage 3 fields (tasksTotal/tasksDone):** Only written by checklist; absent before Stage 3 ship. Readers handle undefined gracefully.
5. **signedOffBy fallback chain:** When phase completes, tries identity_getUser() first, then dep.buildLead, then hardcoded 'Tech' (line 32811).

### Volume Estimate
- **Typical count:** ~20–50 phases per deployment (6 racks × 3–8 phases each)
- **Per record:** ~180–250 bytes JSON
- **Total:** ~4–12 KB per deployment

### Status
- **WRITTEN AND READ:** Yes; phases live per deployment lifetime
- **READS NEVER WRITTEN:** No
- **WRITTEN NEVER READ:** _notes field mostly for audit trail; rarely read back

---

## 3. BLOCKERS
**Archeological Status:** DYNAMIC RECORD COLLECTION WITH LIFECYCLE

### Storage Location & Keys
- **localStorage key:** `phantom_blockers_v1`
- **Format:** JSON array; no compression
- **Load function:** `PHANTOM_BLOCKERS.loadAll()` [line 25960]
- **Save function:** `PHANTOM_BLOCKERS.saveAll(list)` [line 25964]

### Exact Record Shape
```javascript
// Blocker record (lines 25978–25986)
{
  blockerId: 'blk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
  rack: STRING,                  // rack ID or name (may be empty)
  stepId: STRING,                // step identifier (for future expansion; usually empty pre-M4)
  phaseId: STRING,               // phase ID (links to DEPLOY_PHASES_KEY)
  deploymentId: STRING,          // deployment ID
  desc: STRING,                  // blocker description/reason (user-entered text)
  openedBy: STRING,              // ACTOR who opened it (PHANTOM_SITE.currentOperator() or 'Unknown')
  openedAt: NUMBER,              // epoch ms; Date.now() at creation or inherited from phase.blockedAt
  clearedBy: STRING | null,      // who cleared it (only set when cleared)
  clearedAt: NUMBER | null,      // epoch ms when cleared (null = still open)
  // v1.14.420 migration flag:
  migrated: BOOLEAN              // true if adopted from pre-.420 phase.blockerNote (indicates legacy origin)
}
```

### Timestamp Formats Found
- **openedAt, clearedAt:** epoch milliseconds (`Date.now()`)

### Rack-ID Form
- Direct string (may be empty); not composite; human-readable (e.g., "R-01", "AIS-002", or "")

### Writers (Functions + Approximate Lines)
- **PHANTOM_BLOCKERS.create()** [line 25975]: Creates new record; generates blockerId, captures openedBy/openedAt; appends to array.
- **PHANTOM_BLOCKERS.clear()** [line 25992]: Sets clearedBy/clearedAt when blocker is resolved; does NOT remove record.
- **blocker_save()** [line 26046]: Creates blockerId if phase.status='blocked' and no blockerId exists; updates desc on subsequent calls.
- **PHANTOM_BLOCKERS.migrate()** [line 26010]: One-time migration from pre-.420 phase.blockerNote into full records (sets migrated=true).

### Readers (Functions + Approximate Lines)
- **PHANTOM_BLOCKERS.loadAll()** [line 25960]: Returns all blockers.
- **PHANTOM_BLOCKERS.open()** [line 25972]: Returns only blockers where !clearedAt (filters open ones).
- **PHANTOM_BLOCKERS.byId()** [line 25965]: Lookup by blockerId.
- **Various render functions** [lines 22028, 24154, 24341, 29192]: Count blockers per deployment/rack/phase for UI display.

### Oddities
1. **Records never deleted:** Only marked closed via clearedAt. Array grows indefinitely; no automatic pruning or archive.
2. **Non-mutating creation:** create() always appends new record; never modifies existing ones.
3. **Migrated flag origin:** v1.14.420 ship adopted pre-existing blockerNote from phases. Each migrated record captures original openedAt (from phase.blockedAt or phase.updatedAt or Date.now()).
4. **openedBy default:** Falls back to 'Unknown' if PHANTOM_SITE unavailable. PHANTOM_BLOCKERS contract says never auto-credit to site lead (spec 9a).
5. **Array order:** Unspecified; migration from phases preserves existing ordering; new records appended.

### Volume Estimate
- **Typical count:** 1–5 per deployment (minor operational tool)
- **Per record:** ~120–200 bytes JSON
- **Total:** <2 KB per deployment (residue accumulates over time)

### Status
- **WRITTEN AND READ:** Yes; live collection, growth-only
- **READS NEVER WRITTEN:** No
- **WRITTEN NEVER READ:** clearedBy/clearedAt unused by readers (only displayed)

---

## 4. LOG NOTES
**Archeological Status:** FRAGMENTED; MULTIPLE EPHEMERAL + PERSISTENT KEYS

### Storage Location & Keys
**Persistent log note storage:**
- `phantom_lognote_chips_v1` (LOGNOTE_CHIPS_KEY) [line 18317]: chip state for log notes
- `phantom_crash_log` (CRASH_KEY) [line 18431, 18516]: error/crash log entries (2 separate const definitions in different scopes)

**Event/Audit log (not in localStorage):**
- Audit events: `DEPLOY_AUDIT_KEY` = `phantom_deploy_audit_v1` [line 25334]
- Stored via `deploy_logAudit()` [line 31521]

**Legacy/Ephemeral:**
- `phantom_seen_boot` [line 13667]: ephemeral flag ("1" when boot screen seen)
- `phantom_freeze_v1` [line 19647]: hold-to-freeze mark (transient)
- Various router state keys (ACTIVE_CTX_KEY, ACTIVE_DEPLOYMENT_KEY, etc.)

### Exact Record Shapes
**CRASH_KEY entries (lines 18431–18472):**
```javascript
// Error log entry (appended by phantomErrorLog functions)
{
  // Implicitly structured from stack traces; fields vary
  timestamp: NUMBER,    // epoch ms
  type: STRING,         // error type
  message: STRING,      // error message
  stack: STRING | null, // stack trace (if available)
  context: OBJECT       // additional context (deployment, rack, phase, etc.)
}
// Stored as: localStorage.setItem(CRASH_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
// MAX_ENTRIES = 30 (line 18435)
```

**LOGNOTE_CHIPS_KEY (line 18317–18327):**
```javascript
// Log note chip (individual selectable categories)
{
  // Exact shape not explicitly defined in code; inferred:
  id: STRING,
  label: STRING,
  selected: BOOLEAN
}
// Stored as JSON.stringify(s) where s is a map or array
```

**DEPLOY_AUDIT_KEY entries (inferred from deploy_logAudit, lines 31521+):**
```javascript
{
  id: STRING,           // unique event ID
  deploymentId: STRING, // deployment reference
  action: STRING,       // action type (PHASE_STARTED, PHASE_COMPLETE, GATE_OVERRIDE, etc.)
  resource: STRING,     // 'phase' | 'rack' | 'deployment' | 'discrepancy' | etc.
  resourceId: STRING,   // ID of affected resource
  summary: STRING,      // human-readable event description
  actor: STRING,        // identity_getUser() → who did it
  ts: NUMBER            // epoch ms (Date.now())
}
```

### Timestamp Formats Found
- **ts, timestamp:** epoch milliseconds (`Date.now()`)

### Rack-ID Form
- Embedded in summary or resourceId; varies by action type

### Writers (Functions + Approximate Lines)
- **phantomErrorLog()** [lines 18431–18472]: Appends error entries to CRASH_KEY (hardened, quota-aware)
- **deploy_logAudit(deployId, action, resource, resourceId, summary)** [line 31521]: Writes audit events; called after every state change
- **discLog_writeAudit()** [line 34221]: Routes discrepancy events through deploy_logAudit
- **hold-to-freeze** [line 19647]: Writes phantom_freeze_v1 transient mark on hold-tap

### Readers (Functions + Approximate Lines)
- **Crash log:** read on app boot for error display/handoff; cleared on confirmation
- **Audit log:** rarely read directly; mostly for export/report generation
- **LOGNOTE_CHIPS:** read during log note rendering to show selected state

### Oddities
1. **Multiple CRASH_KEY definitions:** Two separate `var CRASH_KEY` in different scopes (lines 18431, 18516). No collision because they're locally scoped; both refer to same `'phantom_crash_log'` key.
2. **No schema:** CRASH_KEY entries vary by error type; no validation on load. Readers are defensive.
3. **MAX_ENTRIES truncation:** Crash log kept to 30 most recent entries; oldest silently dropped. No history past 30.
4. **Audit as audit trail:** deploy_logAudit is the ONLY writer of record-level changes (e.g., PHASE_STARTED, BLOCKER_OPENED, DISCREPANCY_LOGGED). Audit log is the ground truth for event history.
5. **Orphaned freeze key:** `phantom_freeze_v1` created by hold-to-freeze, never formally read back in main flow; ephemeral UI state.

### Volume Estimate
- **CRASH_KEY:** ~500 B–2 KB (30 entries × 17–70 B each)
- **LOGNOTE_CHIPS:** ~100 B
- **DEPLOY_AUDIT_KEY:** ~50–200 KB (1000+ audit events for long deployment)

### Status
- **WRITTEN AND READ:** Audit logs yes; crash log yes (read on boot); lognote chips minimal use
- **READS NEVER WRITTEN:** freeze_v1 (written, never read back)
- **WRITTEN NEVER READ:** Orphaned/legacy keys remain in localStorage

---

## 5. SCANS/EDP
**Archeological Status:** HYBRID STORAGE; INDEXEDDB + LOCALSTORAGE

### Storage Location & Keys
**IndexedDB (phantom-bom database, v1.14.xxx+):**
- **DB name:** `phantom-bom` [line 44786]
- **DB version:** Defined as BOM_DB_VERSION (not explicitly found; schema creates/checks 5 stores)
- **Stores:**
  - `bom_deployments` [line 44819]: Deployment-scoped BOM metadata
  - `bom_scopes` [line 44826]: EDP parse scope records
  - `bom_items` [line 44831]: Individual BOM line items (devices, optics, cables, etc.)
  - `bom_audit_events` [line 44840]: Parse/ingest audit trail
  - `deploy_progress` [line 44849]: Ingest progress checkpoint

**localStorage (legacy/transient):**
- `phantom_classifier_overrides_v1` (_BOM_CLASSIFIER_OVERRIDES_KEY) [line 45229]: User type overrides
- `phantom_edp_progress_v1` (PHANTOM_EDP_PROGRESS_KEY) [line 48691]: Ingest progress state
- `phantom_scaffold_v1::[deployment_id]` (PHANTOM_SCAFFOLD_KEY_PREFIX) [line 45740]: Deploy scaffold cache

### Exact Record Shapes

**bom_deployments store (inferred from write sites):**
```javascript
{
  deploymentId: STRING,       // unique key
  edpHash: STRING,            // SHA-256 of EDP file
  importedAt: NUMBER,         // epoch ms
  rackCount: NUMBER,
  deviceCount: NUMBER,
  status: STRING              // 'parsing' | 'ingested' | 'error'
}
```

**bom_items store (core BOM data, inferred):**
```javascript
{
  id: STRING,                 // composite: [deploymentId]_[lineNum] or SKU-based
  deploymentId: STRING,       // scope
  sku: STRING | null,         // if available
  partNumber: STRING | null,  // OEM part number
  category: STRING,           // 'host' | 'optic' | 'cable' | 'chassis' | etc.
  type: STRING,               // device classification (GPU, NIC, SWITCH, etc.)
  modelName: STRING,          // e.g., 'H100', 'H200'
  quantity: NUMBER,           // unit count
  serialNumber: STRING | null,
  status: STRING,             // 'available' | 'staged' | 'installed' | 'error'
  rackId: STRING | null,      // assignment (if present in EDP)
  rackU: NUMBER | null        // rack position
}
```

**deploy_progress store (ingest state):**
```javascript
{
  deploymentId: STRING,       // key
  stage: STRING,              // 'fetch' | 'parse' | 'classify' | 'validate' | 'ingest' | 'complete'
  progress: NUMBER,           // 0–100 percent
  itemsProcessed: NUMBER,
  totalItems: NUMBER,
  lastError: STRING | null,
  checkpoint: OBJECT          // resumption point for interruptible ingest
}
```

**localStorage phantom_edp_progress_v1 (ingest state snapshot):**
```javascript
{
  deploymentId: STRING,
  stage: STRING,
  progress: NUMBER,
  checkpoint: OBJECT,
  ts: NUMBER                  // epoch ms
}
```

### Timestamp Formats Found
- **importedAt, ts:** epoch milliseconds (`Date.now()`)
- **Progress updates:** recorded at checkpoints (not continuous)

### Rack-ID Form
- Direct string; human-entered in EDP sheet (e.g., "R-01", "AIS-03")

### Writers (Functions + Approximate Lines)
- **bom_parseAndIngest()** [line 46299]: Master parse → IndexedDB writer (Stage 4 INGEST)
- **_bomReqToPromise() + store.add/put** [lines 44938, 45002, 45033, 45051, 45244]: Low-level IndexedDB writes
- **bom_saveClassifierOverrides()** [line 45285]: Saves user type overrides to localStorage
- **edp_progressSave()** [line 48694]: Checkpoints ingest progress to localStorage

### Readers (Functions + Approximate Lines)
- **bom_parse()** [line 46299]: Reads IndexedDB bom_items to render BOM grid
- **deploy_forge_slots()** [line 21587]: Reads BOM items to compute slot status
- **wk_opsPaintBom()** [line 23261]: Async BOM reader; returns null for off-screen cells (IndexedDB async)
- **bom_classifyDevice()** [line 45258]: Reads classifier overrides when type-classifying items

### Oddities
1. **Async-first design:** BOM lives in IndexedDB (async), but writes block on quota error. Readers must handle null returns (cells painted '—' while loading).
2. **Parallel parsing:** EDP parse and BOM ingest are NOT atomic. Progress checkpoint allows interruption and resume.
3. **Classifier override persistence:** User type corrections override machine classification per item; stored separately in localStorage.
4. **Scaffold key prefix:** `phantom_scaffold_v1::[deploymentId]` creates per-deployment scaffold caches for EDP reconcile. Prefix allows bulk operations (lines 45831–45856).
5. **No schema versioning:** IndexedDB stores have no version field; schema changes require DB_VERSION bump.
6. **Mixed readers:** Some code reads IndexedDB directly; others go through parsed Master (PHANTOM_MASTER_STORE). Host slot status can come from either source depending on context.

### Volume Estimate
- **IndexedDB phantom-bom:** 500 KB–5 MB per large deployment (bom_items × quantity × ~100 B each)
- **localStorage progress:** ~200 B (checkpoint only)
- **localStorage classifiers:** ~1–5 KB (user overrides)
- **Scaffold caches:** ~50–200 KB per deployment (reconcile state)

### Status
- **WRITTEN AND READ:** Yes; BOM data lives through deployment
- **READS NEVER WRITTEN:** Audit events (written, never read back by business logic)
- **WRITTEN NEVER READ:** Progress checkpoint (written for resume; rarely consulted)

---

## 6. ISO SESSIONS (ISOLATE)
**Archeological Status:** ORDERED SESSION COLLECTION WITH STATE MACHINE

### Storage Location & Keys
- **localStorage key:** `phantom_isolate_v1` (ISOLATE_KEY) [line 25337]
- **Format:** JSON object; no compression
- **Load function:** `iso_load()` [line 25459]
- **Save function:** `iso_save(s)` [line 25460]

### Exact Record Shape
**Store (container):**
```javascript
{
  v: 1,                       // schema version
  tier: STRING,               // ISO_TIER: 'P0' | 'P1' | 'P2' | 'P3' (priority)
  sessions: [ /* session records */ ]
}
```

**Session record (lines 29253–29266):**
```javascript
{
  id: 'iso_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
  rackId: STRING,             // target rack for downlink session
  deploymentId: STRING,       // deployment scope
  step: NUMBER,               // current step index in downlink workflow
  status: STRING,             // 'open' | 'packet' | 'closed'
  trail: [                    // breadcrumb history
    { t: NUMBER, step: NUMBER, text: STRING },  // epoch ms, step index, step summary
    ...
  ],
  values: OBJECT,             // step field values: { fieldId: value, ... }
  sources: OBJECT,            // field provenance: { fieldId: 'tech' | 'data', ... }
  createdAt: NUMBER,          // epoch ms (Date.now())
  updatedAt: NUMBER,          // epoch ms (set on every iso_put)
  closedAt: NUMBER | null     // epoch ms when closed (null = open/active)
}
```

### Timestamp Formats Found
- **createdAt, updatedAt, closedAt:** epoch milliseconds (`Date.now()`)
- **trail[].t:** epoch milliseconds

### Rack-ID Form
- Direct string (e.g., "R-01", "AIS-03")

### Writers (Functions + Approximate Lines)
- **iso_newSession()** [line 29253]: Creates new session record; sets createdAt, generates id, initializes empty values/sources/trail.
- **iso_put()** [line 25462]: Mutates session in-memory, updates updatedAt, re-saves to localStorage. Session replaces earlier version at same id.
- **iso_renderStep()** [line 22284]: User input updates session.values[fieldId]; sets sources[fieldId]='tech'.
- **iso_renderPacket()** [line 22379]: Advances to 'packet' status; appends trail entry; saves.
- **hold-to-close** [line 22415]: Sets status='closed', closedAt=Date.now(); saves.

### Readers (Functions + Approximate Lines)
- **iso_load()** [line 25459]: Retrieves store; validates v=1 and sessions array; falls back to defaults if corrupt.
- **iso_get(id)** [line 25461]: Lookup session by id.
- **iso_tier()** [line 25468]: Read tier; determines P0–P3 blocking.
- **iso_sentence(sess)** [line 29269]: Renders human-readable summary of session (for clipboard/handoff).
- **iso_packet(sess)** [line 29284]: Formats packet for network-side review request.

### Oddities
1. **Sessions never deleted:** Only closed (closedAt set). Array grows; no auto-cleanup or archive.
2. **Status state machine:** Strict order: 'open' → 'packet' → 'closed'. No reverse transitions.
3. **Trail as audit:** Each step appends breadcrumb (timestamp + summary); full decision tree visible.
4. **Tier gates:** P0/P1 blocks P2 handoff; enforced by iso_tierBlocksP2() [line 25469] before downstream validation.
5. **Sources tracking:** Records fieldId origin ('tech' = hand-entered; 'data' = system-derived). Allows audit of human vs. auto-fill.
6. **No schema inside values:** Each step defines its own fields; iso_put() makes no assumptions about shape. Renders are step-aware; mutators are value-opaque.

### Volume Estimate
- **Typical count:** 2–10 sessions per shift (ISO is an advanced feature)
- **Per session:** ~300–600 B JSON (including trail)
- **Total:** ~3–6 KB per shift

### Status
- **WRITTEN AND READ:** Yes; live sessions throughout shift
- **READS NEVER WRITTEN:** trail (written as audit; read for display)
- **WRITTEN NEVER READ:** Closed sessions remain archived in array

---

## 7. DISCREPANCY LOG
**Archeological Status:** ARRAY OF ISSUE RECORDS; OPEN ↔ RESOLVED LIFECYCLE

### Storage Location & Keys
- **localStorage key:** `phantom_discrepancies_v1` (DISCREPANCY_KEY) [line 33868]
- **Format:** JSON array; no compression
- **Load function:** `discLog_loadAll(deployId)` [line 33879]
- **Save function:** `discLog_saveAll(arr)` [line 33886]

### Exact Record Shape
```javascript
// Discrepancy record (lines 34185–34200)
{
  id: 'disc_' + now + '_' + Math.random().toString(36).substr(2, 6),
  deploymentId: STRING,       // deployment reference
  ts: NUMBER,                 // epoch ms when logged (Date.now())
  loggedBy: STRING,           // ACTOR: dep.buildLead or 'Unassigned' (actor, not operator)
  category: STRING,           // enum: 'rack' | 'pdu' | 'optic' | 'fiber' | 'power' | 'other'
  severity: STRING,           // enum: 'hi' | 'med' | 'low' (default 'med')
  rackId: STRING,             // target rack (human-entered; may be empty string "")
  expected: STRING,           // what was supposed to be (required)
  actual: STRING,             // what was observed (required)
  note: STRING,               // additional context (optional; may be "")
  photo: STRING | null,       // data: URI (WebP blob) or null; stored in IndexedDB, referenced here
  photoMeta: OBJECT | null,   // { width, height, timestamp, ... } (stored with photo)
  status: STRING,             // enum: 'open' | 'resolved'
  resolution: {               // only set when status='resolved'
    resolvedBy: STRING,       // who resolved it
    resolvedAt: NUMBER,       // epoch ms
    resolutionText: STRING    // explanation of how it was resolved
  } | null
}
```

### Timestamp Formats Found
- **ts, resolvedAt:** epoch milliseconds (`Date.now()`)
- **photoMeta.timestamp:** epoch milliseconds (if present)

### Rack-ID Form
- Direct string, human-entered (e.g., "R-01", "AIS-03", or empty "")
- No validation; may contain typos or abbreviations

### Writers (Functions + Approximate Lines)
- **discLog_save()** [line 34165]: Creates new record; writes to array; calls discLog_saveAll().
- **disc_resolve()** [line 34539]: Sets status='resolved', populates resolution object; updates array.
- **discLog_writeAudit()** [line 34221]: Routes discrepancy events through deploy_logAudit() for audit log.

### Readers (Functions + Approximate Lines)
- **discLog_loadAll(deployId)** [line 33879]: Returns all discrepancies (filtered by deploymentId if provided).
- **disc_filteredList(deployId)** [line 34271]: Applies status/category filters; sorts newest-first.
- **disc_renderCard(rec)** [line 34376]: Renders HTML for discrepancy display.
- **Various counts** [line 34306, 29190]: Count open/resolved for UI badge.

### Oddities
1. **Records never deleted:** Only marked resolved. Array grows; no pruning or archival.
2. **Photo field is data: URI:** Full WebP blob embedded as string. Large field (100 KB+); stored inline, not as reference.
3. **rackId is freeform:** Not validated against Master racks. May be empty, may contain typos. Readers show as-is.
4. **loggedBy is not actor:** Field is `dep.buildLead` (fixed per deployment), NOT identity_getUser(). Anomaly: build lead is assigned, not the technician logging it.
5. **Resolution is all-or-nothing:** Once status='resolved', entire resolution object written atomically. No partial updates.
6. **No category enum validation:** User picks category via UI; code does not restrict to enum. Reader assumes category is one of known values but does not enforce.

### Volume Estimate
- **Typical count:** 2–20 per deployment (operational tool)
- **Per record (no photo):** ~250–400 B JSON
- **Per record (with photo):** ~100–150 KB (photo dominates)
- **Total:** ~2–3 MB if 50 photos logged

### Status
- **WRITTEN AND READ:** Yes; live collection, growth-only
- **READS NEVER WRITTEN:** Photo (written as data: URI; rendered, not parsed)
- **WRITTEN NEVER READ:** resolution (written when resolved; displayed, not read for logic)

---

## 8. PHOTOS / IndexedDB
**Archeological Status:** THREE STORES, NOT ONE - ONE LIVE, ONE DEAD, ONE IN localStorage

> **Rewritten 2026-08-28 against v1.14.524.** The prior text named three functions that do not exist
> in the file (`writePhotosToIndexedDB`, `loadPhotosFromIndexedDB`, `discLog_openCamera`), gave the
> wrong object-store name, and inverted the blob/data-URI relationship. Every symbol and line number
> below was read from `dct-ios.html` at v1.14.524 before being written here.

### Storage Location & Keys

Photos live in **three** places. An adapter must know which one it is touching.

| # | Where | Identifier | State |
|---|---|---|---|
| 1 | IndexedDB | DB `phantom-attachments`, store `photos`, keyPath `id` | **LIVE** - rack photos (v1.14.519+) |
| 2 | IndexedDB | DB `phantom-photos` (`PHOTO_DB_NAME` :33897), store `photos` (`PHOTO_STORE_NAME` :33898) | **DEAD** - see Oddity 1 |
| 3 | localStorage | `phantom_discrepancies_v1` (`DISCREPANCY_KEY` :33874), field `.photo` | **LIVE** - base64 data URL inline |

Store 1 declares two indexes at upgrade (`photo_getDB`): `bySite` on `siteId`, and `byRack` on the
compound `['siteId', 'rackId']`.

### Exact Record Shape

**Store 1 - `phantom-attachments` / `photos`** (written verbatim by `photo_persist`):
```javascript
{
  id:         STRING,   // 'ph_' + base36 random + base36 Date.now()
  siteId:     STRING,   // rackId.split(':')[0], or 'unknown'
  rackId:     STRING,   // Master rack form, e.g. 's1:001'
  capturedAt: NUMBER,   // epoch ms (Date.now())
  caption:    STRING,   // always '' on write; no UI writes it yet
  bytes:      NUMBER,   // blob.size
  w:          NUMBER,   // ALWAYS 0 - see Oddity 2
  h:          NUMBER,   // ALWAYS 0 - see Oddity 2
  blob:       BLOB      // image/jpeg, quality 0.70, longest side <= 1280
}
```

**Store 3 - the `.photo` field on a discrepancy record** (`discLog_save` :34191):
```javascript
{
  id: 'disc_<epoch>_<base36>', deploymentId, ts: NUMBER /* epoch ms */,
  loggedBy, category, severity, rackId, expected, actual, note,
  photo:     STRING|null,   // FULL base64 data: URL, inline in localStorage
  photoMeta: OBJECT|null,   // { capturedAt: formatted STRING, sizeKB: NUMBER }
  status: 'open'|'resolved', resolution: OBJECT|null
}
```

### Timestamp Formats Found
- Store 1 `capturedAt`: **epoch ms**.
- Store 3 `ts`: **epoch ms**.
- Store 3 `photoMeta.capturedAt` (:34072): a **formatted STRING**, not epoch ms. It is built by
  slicing an ISO string to 16 chars, replacing the `T` with a middot, and appending `Z`. The result
  is **not valid ISO-8601 and will not survive `Date.parse`**.
- Store 2's extraction record uses `extractedAt: new Date().toISOString()` (:33908) - a true ISO string.

⛔ This contradicts the census-wide claim that timestamps are all epoch ms with ISO strings confined
to the Master payload. Two of the four timestamps in this section are strings, and one is unparseable.

### Writers (Functions + Lines)
- **`photo_captureForRack(deployId, rackId)`** - injects the hidden `#photo-capture-input`
  (`accept="image/*" capture="environment"`), which is what opens the iOS camera.
- **`photo_handleCapture(input, deployId, rackId)`** - guards on `file.type.startsWith('image/')`,
  then compress -> persist -> toast. Quota failure is reported as `PHOTO NOT SAVED - STORAGE`.
- **`photo_compress(file)`** - FileReader -> `Image` -> canvas -> `canvas.toBlob(cb, 'image/jpeg', 0.70)`,
  longest side capped at 1280. **No EXIF orientation correction.**
- **`photo_persist(deployId, rackId, blob)`** - builds the Store 1 record above and `store.add`s it.
- **`discLog_save()` :34171** - writes `.photo` (base64) onto the discrepancy record, then
  `discLog_saveAll` -> `safeStore(DISCREPANCY_KEY, ...)`.
- **`photoStore_save(photos, callback)` :33923** - writes Store 2. **Never called.**

### Readers (Functions + Lines)
- **`photo_getAllForRack`**, **`photo_getCountForRack`** (v1.14.524) - read Store 1.
- **`photo_galleryOpen`**, **`photo_viewerOpen`** (v1.14.524) - render Store 1 blobs via `URL.createObjectURL`.
- **`photo_deletePhoto(photoId)`** - `store.delete(photoId)` on Store 1.
- **`disc_renderCard()` :34376** - renders `rec.photo` **directly as a CSS background-image URL**.
  It does not read IndexedDB at all.
- **`photoStore_load(callback)` :33947** - reads Store 2. **Never called.**

### Oddities
1. **Store 2 is dead code.** `photoStore_save` and `photoStore_load` are the only functions that open
   `phantom-photos`, and neither has a caller anywhere in the file. The one live member of that family
   is `photoStore_extractFromDiscrepancies` (:33899), called once at **:55989** in the backup builder.
   **An adapter written against `phantom-photos` would target a database the app never creates.**
2. **`w` and `h` are always 0.** `photo_persist` hardcodes them and nothing updates them afterward.
   Any consumer sizing a layout from these values gets zero.
3. **`deployId` is accepted and discarded.** `photo_persist(deployId, rackId, blob)` takes a deployment
   id and never stores it. Store 1 photos are scoped to site + rack only and **cannot be filtered by
   deployment.**
4. **The extraction is export-only; it migrates nothing.** `photoStore_extractFromDiscrepancies` returns
   `{discrepancies, photos}` in memory and the caller places them in the bundle as `discrepancies` /
   `discrepancyPhotos` (:56067-56068). The stripped copy is **never written back to localStorage** and
   **never written to any IndexedDB store**. The on-device record keeps its base64.
5. ⛔ **Contract B13 is violated on the live discrepancy path.** B13 reads "No base64 images in
   localStorage. Ephemeral or IndexedDB only." A discrepancy photo is a full base64 data URL persisted
   inside `phantom_discrepancies_v1`. Store 1 does this correctly with Blobs; the discrepancy path
   never received the same treatment.
6. **Blob URLs are never revoked.** The v1.14.524 gallery and viewer call `URL.createObjectURL` per
   image with no matching `URL.revokeObjectURL` anywhere in that path.
7. **`photo_compress` can resolve empty.** `canvas.toBlob` passes its result straight to `resolve` with
   no null check, so a failed encode resolves undefined; `photo_persist` then stores `bytes: undefined`
   and the caller still reports `PHOTO SAVED`.
8. **No pruning in either store.** Nothing ages out or caps by size.

### Volume Estimate
- Store 1: JPEG q0.70, longest side 1280 - roughly **80-250 KB** per photo, in IndexedDB and therefore
  outside the localStorage budget.
- Store 3: base64 inflates by roughly a third and lands **inside** the ~5 MB localStorage budget. This
  is the real quota risk. `discLog_save` already toasts "Storage write failed - discrepancy not saved"
  when `safeStore` returns false.

### Status
- **WRITTEN AND READ:** Store 1 (capture -> gallery / viewer / delete); Store 3 `.photo` (save -> card render).
- **WRITTEN NEVER READ:** `caption`, `w`, `h` on Store 1.
- **NEITHER WRITTEN NOR READ:** all of Store 2 (`phantom-photos`).
- **DOCUMENTED BUT ABSENT:** the previous revision's `writePhotosToIndexedDB`,
  `loadPhotosFromIndexedDB`, and `discLog_openCamera` exist at no line in the file.

---

## 9. PERSIST-KEYS (BACKUP / EXPORT STATE)
**Archeological Status:** HYBRID BACKUP SYSTEM; NAMED KEYS + EXCLUSION LISTS

### Storage Location & Keys
**Backup metadata keys:**
- `phantom_last_backup_ts` (BACKUP_TS_KEY) [line 56120]: epoch ms of last export
- `phantom_backup_interval_days` (BACKUP_INT_KEY) [line 56121]: days between suggested exports (default 7)
- `phantom_tab_presence_v1` (PRESENCE_KEY) [line 56409]: multi-tab presence heartbeat

**Named backup keys (lines 55909–55916):**
```javascript
PHANTOM_BACKUP_NAMED_KEYS = [
  'dct_sops_v1',              // SOP records
  'dct_racks_v1',             // Rack records (RM_KEY)
  'dct_burndown_v1',          // Burndown tracking
  'phantom_rack_history',     // RM_HIST_KEY
  'phantom_lognote_chips_v1', // LOGNOTE_CHIPS_KEY
  'phantom_deploy_issues_v1', // PHANTOM_ISSUES_KEY
  'phantom_quarantine_v1',    // PHANTOM_QUARANTINE_KEY
  'phantom_ghost_echo_v1',    // GHOST_ECHO_KEY
  // ... 20+ more named keys
];

PHANTOM_BACKUP_EXCLUDED_KEYS = [
  '_cc_probe',                // storage health probe (one-shot)
  '__phantom_health',         // storage test key
  'phantom_legacy',           // v1.14.468 migration flag
  'phantom_seen_boot',        // ephemeral boot state
  // ... others
];

PHANTOM_BACKUP_EXTRA_KEYS = [
  // Dynamically discovered keys starting with known prefixes:
  // PHANTOM_SCAFFOLD_KEY_PREFIX ('phantom_scaffold_v1::')
  // (discovered via prefix match in localStorage keys)
];
```

### Exact Record Shape
**Backup bundle (export format):**
```javascript
{
  version: STRING,            // semantic version (e.g., '1.0.0')
  exportedAt: NUMBER,         // epoch ms (Date.now())
  device: {                   // device metadata
    userAgent: STRING,
    locale: STRING
  },
  data: {                     // named backup of selected keys
    'dct_sops_v1': JSON_VALUE,
    'dct_racks_v1': JSON_VALUE,
    'phantom_deploy_issues_v1': JSON_VALUE,
    // ... all PHANTOM_BACKUP_NAMED_KEYS
  },
  ghostEcho: [ /* array of ghost records from IndexedDB */ ],
  // No Master, no BOM (too large; separate export)
}
```

### Timestamp Formats Found
- **exportedAt, BACKUP_TS_KEY, PRESENCE_KEY.ts:** epoch milliseconds (`Date.now()`)

### Writers (Functions + Approximate Lines)
- **backup_export()** [line 56024+]: Reads selected keys, constructs bundle, writes to file (blob download).
- **backup_import()** [line 56666+]: Reads bundle, validates, writes each key back to localStorage. On error, skips failed key; partial restore allowed.
- **BACKUP_TS_KEY update** [line 56142]: Timestamp written after successful export.

### Readers (Functions + Approximate Lines)
- **backup_shouldPrompt()** [line 56127]: Checks if (now - BACKUP_TS_KEY) > BACKUP_INT_KEY days.
- **discovery loop** [line 56120+]: Scans localStorage keys; populates covered[] set to identify orphans/new keys.

### Oddities
1. **Named keys are explicit whitelist:** Only PHANTOM_BACKUP_NAMED_KEYS and PHANTOM_BACKUP_EXTRA_KEYS are exported. New keys added without list update are NOT backed up.
2. **Prefix-based discovery:** PHANTOM_SCAFFOLD_KEY_PREFIX (`phantom_scaffold_v1::`) discovered dynamically; other prefixes hardcoded.
3. **Partial import on error:** If one key fails to restore, others proceed. No transaction; inconsistent state possible if many keys fail.
4. **GhostEcho special case:** IndexedDB ghosts exported separately (lines 55769–55781); not part of localStorage bundle.
5. **Master/BOM excluded:** Too large for routine backup (line 55953 note: "Master not in routine export"). Separate export or reimport needed.
6. **Orphan detection:** Discovery loop identifies keys in localStorage not on any whitelist (covered[] check, lines 55931–55935). Helps surface unexpected keys (possibly leaks).

### Volume Estimate
- **Backup bundle:** ~500 KB–5 MB (named keys + ghosts)
- **Metadata overhead:** ~200 B (timestamps, device info)
- **Excludes Master:** No single backup >10 MB typical

### Status
- **WRITTEN AND READ:** Metadata keys yes; data keys written to file/re-imported
- **READS NEVER WRITTEN:** orphan key detection (read for audit; never written back)
- **WRITTEN NEVER READ:** backup metadata (exported; not consulted by app)

---

## 10. SITE PROFILE
**Archeological Status:** SINGLETON RECORD WITH SCHEMA VERSIONING

### Storage Location & Keys
- **localStorage key:** `phantom_site_profile_v1` (SITE_PROFILE_KEY) [line 25335]
- **Format:** JSON object; no compression
- **Load function:** `siteProfile_load()` [line 28532]
- **Save function:** `siteProfile_save(profile)` [line 28558]

### Exact Record Shape
**SITE_PROFILE_DEFAULTS (baseline, lines 28454–28520):**
```javascript
{
  schemaVersion: 2,           // tracks profile shape version (migrated v1 → v2)
  facilityId: STRING,         // site code (e.g., 'BRV-07', 'ALP-01')
  facilityName: STRING,       // site name (e.g., 'Dallas DC1')
  operator: STRING,           // current device operator (this device, not build lead)
  buildLead: STRING,          // default build lead for deployments
  rackNamingConvention: STRING, // e.g., 'L-01 through R-08' (optional; for reference)
  pduType: STRING,            // e.g., 'Vertiv Geist 3-phase 208V' (optional)
  standardOptics: STRING,     // optical standard (optional; e.g., 'SM LC/UPC')
  platforms: [                // derived or entered platform list
    {
      id: STRING,
      display: STRING,        // human-readable (e.g., 'H100', 'ConnectX-7')
      role: STRING,           // device role (e.g., 'gpu', 'nic', 'switch', 'other')
      source: STRING          // 'master' = derived from loaded Master; 'user' = hand-entered
    }
  ],
  floorZones: [               // optional floor layout zones
    { id: STRING, label: STRING, ... }
  ],
  // Provenance tracking (v1.14.346+):
  sources: {                  // per-field origin (for fields copied from Master SITE-VARS)
    facilityId: 'master' | 'user',    // 'master' = from SITE-VARS sheet; 'user' = hand-entered
    pduType: 'master' | 'user',
    rackNamingConvention: 'master' | 'user',
    // ... others
  },
  // Timestamps:
  lastUpdated: NUMBER,        // epoch ms of last edit
  confirmedAt: NUMBER | null  // epoch ms when first-run gate confirmed (null = unconfirmed)
}
```

### Timestamp Formats Found
- **lastUpdated, confirmedAt:** epoch milliseconds (`Date.now()`)

### Rack-ID Form
- **facilityId:** site code (uppercase convention; e.g., "BRV-07", "ALP-01")
- **rackNamingConvention:** reference text; not parsed (e.g., "L-01 through R-08")

### Writers (Functions + Approximate Lines)
- **siteProfile_save(profile)** [line 28558]: Sets lastUpdated = Date.now(), schemaVersion = 2, writes via safeStore().
- **firstRun_confirm()** [line 28819+]: First-run gate; merges user input, sets confirmedAt.
- **siteProfile_edit()** [line 31451+]: Editor form; saves all fields, updates lastUpdated.
- **site_prefillProfileFromMaster()** [line 28660]: Writes SITE-VARS fields to profile (merge-never-overwrite); sets sources[] to 'master'.
- **site_derivePlatformsFromMaster()** [line 28585]: Derives platforms from loaded Master; marks all source='master'.
- **siteProfile_migrateV1toV2()** [line 28536]: One-time v1 → v2 migration (adds sources[], schemaVersion).

### Readers (Functions + Approximate Lines)
- **siteProfile_load()** [line 28532]: Loads, validates, merges with SITE_PROFILE_DEFAULTS, returns merged object.
- **siteProfile_isConfirmed()** [line 28554]: Returns !!confirmedAt.
- **phantom_siteLabel()** [line 28566]: Extracts facilityName || facilityId for display.
- **PHANTOM_SITE.currentOperator()** [line 35382+]: Returns operator field (v1.14.418 routing through profile, not legacy key).
- **getContextBlock()** [line 28268+]: Reads all fields for AI context; includes facility, PDU, rack naming, platforms.

### Oddities
1. **Schema versioning:** v1 → v2 migration adds sources[] for per-field provenance. Old v1 payloads accepted; schemaVersion=1 upgraded on load.
2. **Merge-never-overwrite:** site_prefillProfileFromMaster() only writes empty fields or fields with source='master'. Hand-entered values persist.
3. **Two identity sources:** `operator` (this device) vs. `buildLead` (default for deployments). Never assume they're the same.
4. **Confirmed gate:** First-run requires human confirmation (confirmedAt set). Unconfirmed profiles still load defaults but feed AI context as "unverified".
5. **Platform derivation:** site_derivePlatformsFromMaster() runs only if profile confirmed and no user-entered platforms exist. Prevents auto-generation on unconfirmed device.
6. **Atomic lastUpdated:** Every save updates timestamp, even if no fields changed (guards drift detection in multi-device setups).

### Volume Estimate
- **Profile size:** ~500 B–2 KB (minimal structured data)
- **Platforms array:** +100 B per platform (5–20 platforms typical)
- **Total:** ~1–3 KB

### Status
- **WRITTEN AND READ:** Yes; live singleton throughout session
- **READS NEVER WRITTEN:** sources[] (written for provenance; read but not modified)
- **WRITTEN NEVER READ:** confirmedAt (set once at first-run; never read for logic, only state check)

---

## 11. IDENTITY
**Archeological Status:** SIMPLE STRING KEY + ROUTING LAYER

### Storage Location & Keys
**Current implementation (v1.14.418+):**
- **Primary:** PHANTOM_SITE profile `.operator` field (site profile, not independent key)
- **Fallback:** `phantom_current_user_v1` (IDENTITY_USER_KEY) [line 25481] — legacy, read-only during migration

**Legacy pre-v1.14.418:**
- **Only source:** `phantom_current_user_v1` (direct localStorage string)

### Exact Record Shape
**Current (routed through PHANTOM_SITE):**
```javascript
// Stored as profile.operator string within SITE_PROFILE_KEY
SITE_PROFILE_KEY: {
  ...
  operator: STRING,   // name of current device operator (e.g., 'J. Hamilton')
  ...
}
```

**Legacy (direct localStorage):**
```javascript
// Direct string value in localStorage
localStorage.getItem('phantom_current_user_v1')  // → "J. Hamilton"
```

### Timestamp Formats Found
- No timestamps in identity storage; only created/updated timestamps on parent profile.

### Rack-ID Form
- Not applicable; identity is person-scoped, not rack-scoped.

### Writers (Functions + Approximate Lines)
- **identity_setUser(name)** [line 25508]: Tries PHANTOM_SITE.setCurrentOperator(name) first (v1.14.418+); falls back to legacy localStorage write if profile unavailable.
- **firstRun_confirm()** [line 28819+]: Writes operator field via profile save (new path).
- **PHANTOM_SITE.setCurrentOperator()** [line 35387+]: Sets profile.operator, triggers profile save.
- **legacy fallback** [line 25514]: safeStore(IDENTITY_USER_KEY, name) if profile write fails.

### Readers (Functions + Approximate Lines)
- **identity_getUser()** [line 25499]: Reads PHANTOM_SITE.currentOperator() first (v1.14.418+); falls back to localStorage.getItem(IDENTITY_USER_KEY) if profile unavailable.
- **PHANTOM_SITE.currentOperator()** [line 35382+]: Returns profile.operator.
- **deploy_logAudit()** [line 31598]: Uses identity_getUser() to credit work to ACTOR.
- **Identity refresh** [line 25534+]: identity_refreshOverflowLabels() updates UI with current user.

### Oddities
1. **Two-door routing (v1.14.418):** Writers try profile first, then fall back to legacy key. Readers do inverse (profile first, legacy second). Guarantees migration without data loss.
2. **Never deleted:** Legacy key persists after migration (no cleanup). Code checks legacy only if profile read fails.
3. **Split-brain risk (pre-.418):** Old code had identity_getUser() reading legacy key AND deploy_logAudit() reading a different source. v1.14.418 consolidation killed the split.
4. **Operator vs. build lead:** `operator` is "who is on THIS device NOW"; `buildLead` is "default person for deployment". Not the same, though often equal.
5. **No validation:** Name is freeform string. No uniqueness, no format checks.

### Volume Estimate
- **Stored value:** ~20–50 B (name string only)
- **Profile overhead:** Included in SITE_PROFILE_KEY (~1–3 KB total)

### Status
- **WRITTEN AND READ:** Yes; live for actor attribution
- **READS NEVER WRITTEN:** Only name; no secondary data
- **WRITTEN NEVER READ:** Legacy key (maintained, not consulted if profile present)

---

## 12. JOB SNAPSHOT (MASTER SCOPE FREEZE)
**Archeological Status:** LIVE, SECOND SOURCE OF TRUTH - ABSENT FROM EVERY PRIOR REVISION OF THIS CENSUS

> **Added 2026-08-28 against v1.14.524.** This data class was missing entirely. It is the frozen,
> selection-scoped copy of Master data that the deployment seeder reads INSTEAD of the live Master,
> so any adapter that reconciles deployment state against `PHANTOM_MASTER_STORE` alone is reading
> the wrong source. It is a backed-up key (`PHANTOM_BACKUP_NAMED_KEYS` :55916).

### Storage Location & Keys
- **Key:** `phantom_jobsnap_v1` (`PHANTOM_JOBSNAP_STORE.KEY` :35625)
- **Medium:** localStorage, **LZString `compressToUTF16`** (same encoding as `phantom_master_v1`)
- **Store object:** `PHANTOM_JOBSNAP_STORE` :35624 - `save` / `load` / `clear`
- **Console helper:** `window.phantom_clearJobSnap` :35679 - not wired to any UI

### Exact Record Shape
Built by `mscope_confirm()` :36713, persisted by `PHANTOM_JOBSNAP_STORE.save`:
```javascript
{
  schemaVersion:   1,          // the ONLY field load() validates
  stagedAt:        STRING,     // new Date().toISOString() - a true ISO string
  siteCode:        STRING|null,
  siteName:        STRING|null,
  sourceFileHash:  STRING|null, // Master identity, carried - see Oddity 2
  sourceRestored:  BOOLEAN,     // was the source Master itself restored from storage
  selectedCabIds:  [STRING],    // capturedIds, NOT the raw selection - see Oddity 5
  stats: { cabs: NUMBER, hosts: NUMBER, cables: NUMBER },
  cabs: {                       // keyed by cabId
    <cabId>: { cabId, locode, hosts: [...], cablesOut: [...], cablesIn: [...] }
  }
}
```
`save()` adds `schemaVersion: 1` itself via `Object.assign`, so a caller cannot override it.

### Timestamp Formats Found
- `stagedAt`: **ISO-8601 string**, not epoch ms.
- `snapshotConsumedAt` (written onto the DEPLOYMENT record, not the snapshot): **epoch ms**.

⛔ A second exception to the census-wide "epoch ms everywhere, ISO only inside the Master payload"
claim. `stagedAt` is an ISO string outside the Master payload, and it is load-bearing: it is
concatenated into the deployment's dedupe hash (`'mscope_' + sourceFileHash + '_' + stagedAt`).

### Writers (Functions + Lines)
- **`mscope_confirm()` :36713** - the only producer. Freezes the selected cabs out of the live Master.
- **`PHANTOM_JOBSNAP_STORE.save(snapshot)` :35626** - refuses a falsy snapshot, a non-object `cabs`,
  and a `cabs` with zero keys. Returns `true`/`false`.

### Readers (Functions + Lines)
- **`PHANTOM_JOBSNAP_STORE.load()` :35653** - validates `schemaVersion === 1` and nothing else.
- **:33385** - resume banner; reads the snapshot to show a staged-scope summary.
- **:36844** - the deployment creator; seeds racks from the snapshot via `mscope_buildRacksFromSnapshot`.
- **:36890** - `mscope_resumeStaged`, re-opens the staged screen from the persisted snapshot.
- **:36532** - existence probe only (`localStorage.getItem(KEY)`), warns that re-staging replaces it.

### Deleters
- **:36907** - cleared on the successful create path (snapshot consumed).
- **:38457** - cleared on a second settle path.
- On any create failure the snapshot **survives untouched**, which is deliberate and retry-safe.

### Oddities
1. **The header comment is stale.** :35652 reads "No Ship-1 caller - this is the designated read path
   for the Ship-2 seeder." Ship 2 has landed: `load()` now has three callers (:33385, :36844, :36890).
   The comment still describes the store as unread.
2. ⛔ **Carries Master identity but never checks it (contract A12).** The snapshot stores
   `sourceFileHash`, and the deployment record copies it forward, but **no reader ever compares it to
   the active Master.** A12 requires that a Master-derived cache "carries the Master's identity and is
   checked on read." A scope staged against Master A can be seeded after Master B has replaced it;
   `mscope_confirm` guards that window at STAGE time via `PHANTOM_MASTER.idOf` (:36720, the v1.14.415
   single-master fix) but nothing re-checks at CONSUME time.
3. ⛔ **No `normVersion`, and `load()` cannot detect a stale normalizer.** The block at :35700 records
   that derived caches must carry `MASTER_NORM_VERSION` (now 2) because a payload built by the old
   normalizer restores verbatim and renders wrong counts - the exact defect that failed a device
   verify, with `s4:099` showing 0 components / 68 cables. `phantom_master_v1` learned that lesson.
   **The job snapshot did not:** it has no `normVersion` field at all, and `load()` validates only
   `schemaVersion`. A snapshot frozen under normalizer 1 is indistinguishable from one frozen under 2.
4. **`save()` bypasses `safeStore()` and reports quota only to the console.** It calls
   `localStorage.setItem` directly and has its own quota branch, but that branch is
   `console.warn` only - no `phantomToast`. The caller `mscope_confirm` does toast on a `false`
   return, so the operator is warned in that path; any future caller that ignores the return value
   would fail silently, which is a B14 exposure. Note this also **falsifies prerequisite 10** as
   written ("All writes go through safeStore()").
5. **`selectedCabIds` is the captured set, not the selection.** Cabs missing from the confirm-time
   Master are silently skipped (`if (!src) return;`), so `selectedCabIds` and `stats` describe what was
   actually frozen. This is deliberate and documented in-file; an adapter must not assume it matches
   whatever the operator ticked.
6. **Shallow copies in memory, deep copy on disk.** `hosts` / `cablesOut` / `cablesIn` are `.slice()`
   copies that share element object references with the live Master; the PERSISTED form is a deep copy
   via `JSON.stringify`. The in-file comment flags this as safe only while the Master is
   replaced-not-mutated. **An adapter that mutates loaded host or cable objects in place breaks it.**
7. **Backup restore writes this key verbatim.** :56645 pushes `bundle.jobsnap` straight to
   `phantom_jobsnap_v1` as its raw compressed string, bypassing `save()` and its content-empty and
   shape guards - the same bypass documented for `phantom_master_v1`.

### Volume Estimate
- Scoped to selected cabs, not the whole site - explicitly to stay under budget.
- LZString UTF-16 compressed; `save()` logs the compressed size in KB on every write.
- **Typical:** a handful of cabs, tens to low hundreds of KB compressed. A wide selection on a large
  site is the quota risk, and it is the one case `save()` returns `false` for.

### Status
- **WRITTEN AND READ:** the whole record - staged by `mscope_confirm`, consumed by the deployment creator.
- **WRITTEN NEVER READ:** `sourceRestored`, `siteName`, and `stats.hosts` / `stats.cables`
  (`stats.cabs` is read at :33387 for the resume banner).
- **CARRIED BUT NEVER CHECKED:** `sourceFileHash` - see Oddity 2.
- **ABSENT AND NEEDED:** `normVersion` - see Oddity 3.

---

## 13. DEPLOYMENTS
**Archeological Status:** LIVE, ROOT RECORD - ABSENT FROM PRIOR REVISIONS

> **Added 2026-08-28 against v1.14.524.** Every other deployment-scoped class keys off
> `deployment.id`, so this is the parent record the census never documented.

### Storage Location & Keys
- **Key:** `phantom_deployments_v1` (`DEPLOY_KEY` :25336) - localStorage, plain JSON array.

### Exact Record Shape
```javascript
{
  id:         'dep_' + epochMs + '_' + base36,
  name:       STRING,
  edpHash:    STRING,      // content hash of the source EDP
  status:     'active' | 'complete',
  buildLead:  STRING,      // or 'Unassigned'
  created:    NUMBER,      // epoch ms
  updated:    NUMBER,      // epoch ms
  edpRaw:     STRING,      // the ENTIRE raw EDP text, inline
  edpParsed:  OBJECT,      // the ENTIRE parse result, inline
  rackCount:  NUMBER,
  phaseCount: 5,           // hardcoded literal
  scope:      OBJECT|null  // set from a job snapshot when created via mscope
}
```

### Writers / Readers
- **`deploy_saveAll(arr)` :30667** - `safeStore`, and bumps `_deployRollupGen` only on success.
- **`deploy_loadAll()` :30666** - `safeGet`, coerces a non-array to `[]`.
- Restore writes the key as a named bundle section (:56635).

### Oddities
1. ⛔ **`edpRaw` and `edpParsed` are stored inline on every deployment.** The full source text AND its
   full parse live inside the deployments array, which is loaded whole by `deploy_loadAll()` on every
   read. This is the single largest per-record payload in localStorage and the main quota driver.
   `deploy_validateStorageHeadroom(rackCount)` gates the *seed*, not this record.
2. **`phaseCount` is a hardcoded `5`,** not derived. It agrees with `PHASE_MODEL` today by
   coincidence of maintenance, not by construction.
3. **`updated` is not touched by every mutation path** - treat the audit log as the timing truth
   (prerequisite 6), not this field.

---

## 14. SHIFT HANDOFF
**Archeological Status:** LIVE - ABSENT FROM PRIOR REVISIONS

### Storage Location & Keys
- **Key:** `phantom_handoff_v1` (`HANDOFF_KEY` :25342) - localStorage, plain JSON array.

### Exact Record Shape
Generated at :31831, then mutated and persisted by `handoff_saveRecord` :43006.
```javascript
{
  id:              'hoff_' + epochMs + '_' + base36,
  deploymentId:    STRING,
  deploymentName:  STRING,
  generatedAt:     NUMBER,   // epoch ms
  shiftDate:       STRING,   // toLocaleDateString('en-US', ...) - see Oddity 1
  outgoingTech:    STRING,   // seeded from dep.buildLead
  incomingTech:    STRING,   // '' until saved
  status:          'unread' | 'saved',
  autoSummary:     STRING,
  notes:           STRING,
  completedItems:  ARRAY,
  openItems:       ARRAY,
  watchItems:      ARRAY,
  opticSnapshot:   OBJECT,
  rollup:          { racksTotal: NUMBER, racksBlocked: NUMBER },
  shiftEventCount: NUMBER,
  savedAt:         NUMBER    // epoch ms, added only by handoff_saveRecord
}
```

### Writers / Readers
- **`handoff_save(arr)` :31769** / **`handoff_loadAll()` :31766**.
- **`handoff_loadForDeployment(id)` :31772**, **`handoff_purge(id)` :31775**.
- **`handoff_saveRecord(deploymentId)` :43006** - the only producer of a persisted record.

### Oddities
1. ⛔ **`shiftDate` is a locale-formatted display string,** built with
   `toLocaleDateString('en-US', { weekday, month, day })`. It is **not sortable, not parseable, and
   locale-dependent**. Never key, sort, or range-filter on it - use `generatedAt`.
2. **The draft lives only in memory.** `_handoffDraft` (:42935) is a module variable; a reload
   mid-handoff loses it and the app says so ("Handoff draft lost - please regenerate"). Nothing
   about an unsaved handoff is on disk.
3. **Two status values, set in different places.** `'unread'` at generation, `'saved'` only via
   `handoff_saveRecord`. A record read at :28149 filters on status, so an adapter writing this class
   must set it explicitly.

---

## 15. OPTIC LEDGER (per-deployment)
**Archeological Status:** LIVE - ABSENT FROM PRIOR REVISIONS. NOT THE SAME CLASS AS SECTION 17.

### Storage Location & Keys
- **Key:** `phantom_deploy_optics_v1` (`DEPLOY_OPTICS_KEY` :25339) - localStorage, flat JSON array
  across ALL deployments, filtered by `deploymentId` on read.

### Exact Record Shape
Seeded by `deploy_seedOptics(deploymentId)`:
```javascript
{
  id:           'optic_' + deploymentId + '_' + index + '_' + epochMs,
  deploymentId: STRING,
  opticType:    STRING,   // op.type, or 'Unknown'
  required:     NUMBER,
  dispensed:    0,
  installed:    0,
  remaining:    NUMBER,   // seeded EQUAL to required - see Oddity 2
  notes:        ''
}
```

### Writers / Readers
- **`deploy_seedOptics(deploymentId)`** - seeds once; guarded by an `alreadySeeded` check so a
  re-seed is a no-op rather than a duplicate.
- **`deploy_saveAllOptics(arr)` :31191** - `safeStore`, bumps `_deployRollupGen` on success.
- **`deploy_loadAllOptics()` :31183**, **`deploy_loadOpticsFor(deployId)` :31187** - the latter
  refuses an empty id via `_deploy_loaderMisuse` and returns `[]` rather than the whole table.
- **`optic_autoCreditLedger(entry, matches)`** - credits from a scan; requires `score >= 80`, an
  active non-complete deployment, and exactly one normalized-type match. It **bumps `dispensed`
  before `installed`** deliberately, to satisfy an ordering guard.

### Oddities
1. **One flat array for every deployment.** Always filter by `deploymentId`; never assume the array
   is scoped.
2. ⛔ **`remaining` is a stored derived value.** It duplicates `required - installed` and can drift
   from it. An adapter must decide which is authoritative and must not update one without the other.
3. **`opticType` matching is normalized, not literal.** The credit path compares
   `String(x).toUpperCase().replace(/[^A-Z0-9]/g, '')`. String equality on the raw value will miss.

---

## 16. EDP PARSE CACHE
**Archeological Status:** LIVE, DERIVED CACHE - ABSENT FROM PRIOR REVISIONS

### Storage Location & Keys
- **Key:** `phantom_edp_cache_v1` (`DEPLOY_EDP_CACHE_KEY` :33531). The in-file comment marks the name
  as legacy - it now serves the vendor-reconcile parse cache - and says **do not rename**.

### Exact Record Shape
An object map, not an array:
```javascript
{
  <contentHash>: { parsed: OBJECT, cachedAt: NUMBER /* epoch ms */ }
}
```

### Writers / Readers
- **`deploy_setCachedParse(hash, parsed)` :33536** - caps the map at **10 entries** and evicts the
  oldest by `cachedAt` before inserting.
- **`deploy_getCachedParse(hash)` :33532** - returns the **wrapper** `{parsed, cachedAt}`, not the
  parse. The live consumer at :38194 correctly reads `cached.parsed`; any new caller must do the same.

### Oddities
1. ⛔ **`deploy_setCachedParse` ignores the `safeStore` return.** A quota failure is silent - no
   toast, no warn, no branch. The cache simply does not update and the next call re-parses. Benign
   for correctness, invisible for diagnosis, and a B14 exposure by the letter of the rule.
2. **Keyed by content hash, carrying no Master identity.** This is acceptable *because* the key IS
   the content identity of the parsed text - but it means the cache is not invalidated by a Master
   swap, only by different input. Do not extend it to hold Master-derived data without adding
   identity per contract A12.
3. **Eviction is by `cachedAt`, not by last use.** It is oldest-written, not least-recently-used.

---

## 17. OPTIC SCAN INVENTORY (device-local)
**Archeological Status:** LIVE - ABSENT FROM PRIOR REVISIONS. DISTINCT FROM SECTION 15.

### Storage Location & Keys
- **Key:** `phantom_optic_inventory` (`OPTIC_INV_KEY` :52674) - localStorage, plain JSON array.
- Accessed through the generic **`DataStore(key)`** wrapper (`_opticStore` :52684), whose `save()`
  toasts `'Storage full'` on a `false` return.

### Exact Record Shape
```javascript
{
  id:       'opt_' + epochMs,
  scanned:  STRING,        // raw barcode text
  ts:       NUMBER,        // epoch ms
  rack:     STRING,        // hand-typed rack tag, uppercased, '' when blank
  matched:  BOOLEAN,
  topMatch: {              // null when matched === false
    optic, platform, pn, fiber, connector, speed, cage, score
  },
  credit:   OBJECT|null    // NEVER PERSISTED - see Oddity 1
}
```

### Writers / Readers
- **`saveOpticInventory(inv)` :52686** / **`loadOpticInventory()` :52685**.
- **`deleteOpticEntry(id)` :53010** - filter-and-resave.
- **`clearOpticInventory()` :53017** - `localStorage.removeItem(OPTIC_INV_KEY)` **directly**,
  bypassing the `DataStore` wrapper.
- Read for the backup bundle at :56010 and for counts at :22162 / :23201.

### Oddities
1. ⛔ **`credit` is assigned AFTER the save and is never persisted.** The scan handler does
   `saveOpticInventory(inv)` and only then sets `entry.credit = optic_autoCreditLedger(...)`. No
   second save follows - the function ends with render and haptic. The credited state exists for the
   current render only and is **gone on reload**, while the ledger side of the credit (section 15)
   *was* persisted. **An adapter reconciling scans against the ledger cannot use `credit` as
   evidence that a credit happened; it will read `undefined` for every stored entry.**
   This is an ordering defect, not a shape defect: the fix is to save after the credit, not to add a field.
2. **`clearOpticInventory` bypasses the wrapper** - it removes the key rather than saving `[]`, so a
   subsequent `load()` relies on `safeGet`'s default.
3. **Both destructive paths use `confirm()`** - a blocking browser modal.
4. **`rack` is freeform**, uppercased, empty string when blank - the same reconciliation hazard as
   the discrepancy `rackId` (prerequisite 8).

---

## SUMMARY OF HAZARDS — RANKED BY RISK TO RACK RECORD TRUTHFULNESS

### CRITICAL (Data loss / split-brain)

**H1: Master persistence atomicity violation (PHANTOM_MASTER_STORE)**
- **Risk:** v1.14.414 and .406 partial failures allow candidate to go live without persisting. On restart, in-memory Master is lost, storage has stale Master. Operators see deployed hardware that never persisted.
- **Mitigation:** v1.14.415+ `replace()` enforces persist-first-go-live-second. But quota failures still land with `unpersisted=true` flag. Flag is visible to user; requires re-import after restart.
- **Detective:** Check for window.__phantomStorageFull or __phantomMasterOverwriteRefused flags; these indicate failure. Export backup before restart.

**H2: Blocker record creation without phase linkage (PHANTOM_BLOCKERS + DEPLOY_PHASES_KEY)**
- **Risk:** blocker_save() creates blockerId, then tries to link it to phase. If phase save fails, phase has no blockerId, blocker exists orphaned. Later reads of blockers report open issue; reads of phases don't.
- **Mitigation:** v1.14.420 enforces: phase move to 'blocked' only AFTER blockerId created and saved successfully. Two-step write with guard (lines 26061–26069).
- **Detective:** Query blockers where blockerId exists but no phase links to it. Discrepancy = incomplete migration or partial write.

**H3: Site profile identity split (identity_getUser + PHANTOM_SITE.currentOperator)**
- **Risk:** v1.14.418 transition routes through profile. If profile write fails (quota), fallback writes legacy key. Next read tries profile (unavailable), falls back to legacy. Works. BUT if profile read corrupts, then fallback + audit both credit 'Unknown'. Actors lost.
- **Mitigation:** identity_setUser() tries profile first; failure is caught and logged. Audit log records actor at time of action, not read time (safe).
- **Detective:** Search audit log for 'Unknown' actors; correlate with profile writes that failed (storage full toasts).

### HIGH (Repair or reconciliation needed)

**H4: Discrepancy photos embedded as data: URIs but stored in IndexedDB (DISCREPANCY_KEY + phantom-photos)**
- **Risk:** Discrepancy record embeds photo as data: URI for inline render. Actual blob stored in IndexedDB. If IndexedDB deleted manually (privacy tool), data: URIs become broken image links. No cascade delete.
- **Mitigation:** Photo data also stored as reference in discrepancy record. On restore from backup, blobs re-populate IndexedDB. Manual deletion is operator choice (privacy).
- **Detective:** Missing blob = missing photo in grid. Operator must re-import or use backup.

**H5: Blocker and phase records both track status='blocked' (PHANTOM_BLOCKERS + phase.status)**
- **Risk:** Blocker has status='open'/'resolved'. Phase has status='blocked'. Disagreement = botched transition. If phase.status='blocked' but no blockerId, blocker table never consulted by that phase.
- **Mitigation:** v1.14.420 enforces atomicity: if phase.status='blocked', then phase.blockerId must exist and must link to a record in blockers. Gate prevents 'blocked' without record.
- **Detective:** Query phases where status='blocked' and blockerId is null. Any hit = invariant violation (should never exist).

**H6: EDP parse and BOM ingest are asynchronous and not atomic (IndexedDB phantom-bom)**
- **Risk:** EDP parse to BOM ingest checkpoint, can be interrupted. If power lost mid-parse, deploy_progress saved but bom_items incomplete. Restart resumes from checkpoint but partial items linger.
- **Mitigation:** deploy_progress.checkpoint stores resumption point. Ingest resumes from last checkpoint; duplicate detection on item ID prevents double-entry.
- **Detective:** Query bom_items for duplicates (same deploymentId + sku/partNumber) with different timestamps. Count mismatch between bom_deployments.deviceCount and bom_items rows for that deployment.

**H7: Phases created but then seeding fails (deploy_seedRacksAndPhases)**
- **Risk:** deploy_seedRacksAndPhases() writes racks, then writes phases. If phase write fails (quota), racks created without phases. Build path reads phases, finds none, reports "no phases" even though racks exist.
- **Mitigation:** If either write fails, user is toasted ("Storage full") and deployment is in partial state. Operator must export backup and clear old data.
- **Detective:** Query deployments where DEPLOY_RACKS_KEY has records but DEPLOY_PHASES_KEY has none for that deployment ID. Any hit = seeding failed mid-flight.

### MEDIUM (Operator must reconcile)

**H8: Rack ID formats vary (RM_KEY vs. DEPLOY_RACKS_KEY vs. discrepancy rackId)**
- **Risk:** RM_KEY stores racks with `id` (e.g., "rack_deploy123_0"). DEPLOY_RACKS_KEY stores with `rackId` (human-entered, e.g., "R-01"). Discrepancy rackId is freeform (may be "R-01" or "r-1" or empty). Reconcile uses string match; case/format mismatches break linking.
- **Mitigation:** reconcile_run attempts exact match only. No fuzzy matching. Operator must enter matching rack IDs in Master file.
- **Detective:** Compare RM_KEY rackId values against DEPLOY_RACKS_KEY rackId values; check for case/whitespace drift. Discrepancies with rackId "" or mismatched case are unlinked (reconcile finds no host match).

**H9: Classifier overrides and BOM items may disagree on device type (bom_classifier_overrides + bom_items)**
- **Risk:** User overrides device type for an item (SKU or part number). Override stored in phantom_classifier_overrides_v1. Existing bom_items rows retain old type. New ingests use override. Type is inconsistent across time.
- **Mitigation:** Overrides are per-SKU, not per-row. All items with same SKU get same type. Old items are not retroactively reclassified (additive, not destructive).
- **Detective:** Export BOM; check for same SKU appearing with different type values in different rows or different ingest cycles. Indicates override applied mid-deployment.

**H10: Phases have _gateOverride and _notes fields that are UI-transient (DEPLOY_PHASES_KEY)**
- **Risk:** _gateOverride set true; _notes appended with timestamp. Neither field is read by state machine (only for audit display). If phase.status='in_progress' and _gateOverride=true, no one reads the flag to alert operator that sequence was violated.
- **Mitigation:** deploy_logAudit() records GATE_OVERRIDE action at time of override. Audit log is the truth; field is documentation. Operator sees warning toast.
- **Detective:** Query phases where _gateOverride=true. Audit log should contain corresponding GATE_OVERRIDE entries for that phase.

### LOW (Informational, unlikely to cause operational harm)

**H11: Master payload carries dual timestamp sources (savedAt + ingestedAt + sourceFile)**
- **Risk:** Restored payload may have savedAt (write time), ingestedAt (legacy), sourceFile (import time). No single source of truth for "when was this Master loaded on this device?" Multi-source timing can confuse cache identity.
- **Mitigation:** PHANTOM_MASTER.idOf() tries sourceFileHash first; falls back to composite (savedAt + cab count) only if hash missing. Cache identity is stable per Master.
- **Detective:** Inspect Master payload; if sourceFileHash present, that is the true identity. If absent, use fallback.

**H12: LOGNOTE_CHIPS_KEY shape undefined**
- **Risk:** LOGNOTE_CHIPS_KEY stored and read but shape is not documented in code. Renderer is defensive (treats as array or map). If schema drifts, reader gracefully degrades.
- **Mitigation:** LOGNOTE_CHIPS is ephemeral UI state, not critical data. Loss is tolerable (user re-selects).
- **Detective:** Not actionable; low risk. Monitoring: if LOGNOTE_CHIPS parse fails, app continues; user may need to re-select log note categories.

**H13: Backup discovery loop identifies orphan keys but does not delete them**
- **Risk:** New localStorage keys added by features but not added to PHANTOM_BACKUP_NAMED_KEYS are orphaned (not exported, not imported). They accumulate on device, wasting quota. But they do not corrupt data.
- **Mitigation:** orphan detection loop (lines 55931–55935) flags unexpected keys. Operator can manually clear via developer tools or "Clear old data" option.
- **Detective:** Log output shows "covered" keys vs. all localStorage keys. Any discrepancy = orphan. Operator action required; automated cleanup risks deleting intentional keys.

---

## MISSING DATA CLASSES OR RESIDUE

**Found but not primary:**
- `phantom_seen_boot` [line 13667]: Ephemeral flag; cleared on logout. No schema.
- `phantom_freeze_v1` [line 19647]: Transient hold-to-freeze mark; never read back. Can be orphaned.
- `ACTIVE_DEPLOYMENT_KEY` [line 30667]: Last-opened deployment ID; UI state, not data.
- Various GE_LAST_* keys [line 52320]: Ghost Echo context (last rack, last fault type); UI routing state.

**NOT persistent or documented as records:**
- Window globals (`window._lastPhantomMaster`, `window._mscopeState`, etc.): In-memory session state; volatile.
- CSS/DOM state: classes, active elements, scroll position; ephemeral.
- Service Worker cache: Assets, not data. Separate invalidation model.

---

## ADAPTER PREREQUISITES

> **Corrected 2026-08-28 against live v1.14.524.** The previous list had five items that were false
> as written (1, 2, 3, 7, 10) and one that was incomplete (4). Because this list is what an adapter
> author is told to *do*, a wrong item here is more dangerous than a missing section. Every claim
> below was executed or read against the file before being written; each carries its evidence.

**Before writing any adapter that reconciles two data classes:**

1. **KNOW EVERY WRITER, NOT JUST THE FRONT DOOR.** ~~PHANTOM_MASTER_STORE.save() is the only writer
   of both Master shapes. PHANTOM_BLOCKERS.create() is the only writer of blocker records.~~
   **Both halves of that were false.** Each class has a primary door plus known bypasses:
   - **Master:** `PHANTOM_MASTER_STORE.save()` is the primary writer and carries the
     refuse-to-overwrite guard (:35014). **The backup restore bypasses it** - :56644 pushes
     `bundle.master` straight to `phantom_master_v1` as a raw compressed string, and the generic
     `bundle.keys` passthrough (:56650-56659) can write arbitrary keys the same way. An adapter
     must not assume `save()`'s invariants hold for a value it reads back.
   - **Blockers:** `PHANTOM_BLOCKERS.create()` is one writer. **`PHANTOM_BLOCKERS.saveAll(list)`
     (:25970) rewrites the entire array** via `safeStore` and is called at :26086; `clear()` mutates
     at :32054.
   - **Job snapshot:** `PHANTOM_JOBSNAP_STORE.save()` is the only producer, but restore writes the
     key verbatim at :56645. See section 12.

2. **TIMESTAMPS ARE MIXED. CHECK THE FIELD, NOT THE RULE.** ~~All epoch ms; ISO strings only in
   Master payload.~~ **False.** Epoch ms is the majority, not the rule. Known string timestamps
   outside the Master payload:
   - `photoMeta.capturedAt` (:34072) - a **formatted string**, ISO sliced to 16 chars with the `T`
     replaced by a middot and `Z` appended. **Not valid ISO-8601; will not survive `Date.parse`.**
   - `extractedAt` (:33908) - a true ISO string.
   - `stagedAt` on the job snapshot (:36755) - a true ISO string, and load-bearing: it is
     concatenated into the deployment dedupe hash.
   Normalize per field. Never assume a timestamp is a number because a sibling field is.

3. **RACK-ID FORMS ARE NOT INTERCHANGEABLE - AND THERE ARE TWO MASTER REGEXES.** The previous
   revision paired the RACK example with the CAB regex, which rejects every real rack id.
   Both constants are adjacent at :34927-34928:
   - **Cab:** `_PHANTOM_MASTER_CAB_RE = /^[a-z0-9]+:[0-9]+:[0-9]+/` - three colon-separated parts.
   - **Rack:** `_PHANTOM_MASTER_RACK_RE = /^([a-z0-9]+:[0-9]+)(?::|$)/` - two parts. This is the one
     that matches `s1:001`, `s4:099`, `s1:010`.
   - **Verified:** `s1:001` and `s4:099` **fail** the cab regex. Using it to validate a rack id
     rejects everything.
   - **DEPLOY_RACKS_KEY:** `rack_deploymentId_index` - a composite key, not a Master form.
   - **Discrepancy `rackId`:** freeform - see item 8.

4. **A CACHE MUST CARRY MASTER IDENTITY *AND* BE CHECKED ON READ (contract A12).** Carrying it is
   not enough, and two live caches prove it:
   - **The hash lives in two places.** :35176-35181 documents the drift in the code itself: the
     parser writes `stats.sourceFileHash`, the payload writes it top-level, and readers compensate
     with `m.sourceFileHash || m.stats.sourceFileHash`. **That compensation IS the divergence.**
     Read both locations or you will miss half the cases.
   - **The job snapshot carries `sourceFileHash` and no reader ever compares it** to the active
     Master (section 12, Oddity 2). It also has **no `normVersion`**, so a snapshot frozen under
     normalizer 1 is indistinguishable from one frozen under 2 - the exact class of defect that
     failed a device verify (:35700).
   - `if (cache[id])` treats an empty array as a hit. Check identity, not truthiness.

5. **NEVER OVERWRITE, MERGE - AND MAINTAIN THE `sources` MAP.** Verified accurate, with the
   mechanism the prior text omitted. `site_prefillProfileFromMaster()` is gated on
   `siteProfile_isConfirmed()` and applies three guards per field:
   `if (!val) return;` (Master silent - leave empty, never guess), then
   `if (cur && sources[m.field] !== 'master') return;` (hand-entered wins), then
   `if (cur === val) return;`. Provenance lives in **`prof.sources[field]`**, set to `'master'` only
   for fields the Master filled. **An adapter that writes a profile field without updating that map
   will cause the next Master load to overwrite a hand-entered value.**

6. **AUDIT LOG IS THE TRUTH FOR TIMING - AND FOR WHO.** Verified, and stronger than stated.
   `deploy_logAudit()` writes to `DEPLOY_AUDIT_KEY` with `ts` (epoch ms), `actor`, `action`,
   `entityType`, `entityId`, `summary`, `hashV: 2`, `siteProfileId` (binds to ACTIVE_SITE_PROFILE)
   and the Master id. **Actor resolution is `identity_getUser() || dep.buildLead || 'System'`** -
   that fallback chain is contract A9a (the ACTOR is credited, never the Site Lead by default), so
   an adapter attributing work must read `actor` and not infer it from the deployment.

7. **IDENTITY HAS ONE DOOR AND ONE KNOWN LEGACY READER.** ~~identity_getUser() is the ONLY reader.~~
   **False as an absolute.** `identity_getUser()` (:25512) and `identity_setUser()` (:25520) are the
   door and should be the only ones an adapter uses. But :35501 reads
   `localStorage.getItem(IDENTITY_USER_KEY)` directly - a deliberate, commented legacy-identity
   migration that **copies, never moves**, leaving the legacy key on disk. Consequence an adapter
   must handle: **the legacy key survives and can disagree with the profile operator.** The code at
   :35502-35505 handles that disagreement explicitly rather than silently picking one.

8. **DISCREPANCY RACKID IS FREEFORM.** Verified. `discLog_save()` :34198 writes
   `rackId: (rackEl ? rackEl.value.trim().toUpperCase() : '')` - human-entered, uppercased, and
   **empty string when the field is blank** (not null). Reconcile via audit/operator context, never
   string match against a Master rack id.

9. **PHOTOS ARE IN THREE PLACES, AND THE OLD DESCRIPTION WAS INVERTED.** See **section 8**, which
   was rewritten from live code. Summary: `phantom-attachments` (LIVE,
   Blobs, rack photos), `phantom-photos` (**DEAD** - its only openers have no callers), and a
   **base64 data URL inline in localStorage** on the discrepancy record, which is a contract B13
   violation. The prior claim of "blob in IndexedDB, data: URI in the discrepancy record" described
   neither store correctly.

10. **QUOTA IS REAL - BUT NOT EVERY WRITE GOES THROUGH `safeStore()`.** ~~All writes go through
    safeStore(), which raises a user toast on failure.~~ **False on both clauses.**
    - `PHANTOM_JOBSNAP_STORE.save()` calls `localStorage.setItem` **directly** with its own quota
      branch, and that branch is `console.warn` only - **no toast** (section 12, Oddity 4).
      `PHANTOM_MASTER_STORE.save()` likewise manages its own persistence.
    - `safeStore()` returns `false` on **any** exception but **only toasts for quota errors**, and
      that toast is throttled to one per 10 seconds. A non-quota failure returns `false` silently.
    - **The rule that survives:** every write can fail, and the caller must handle a `false` return.
      Ask what the caller does with `false` - a partial refusal that the caller ignores is how
      split-brain state gets created.

## EXPORT / ARCHIVE RECOMMENDATIONS

**For this census to be actionable by an adapter:**

1. Create ADAPTER manifest naming each data class, its storage key, its write door, its read door, and timestamp contract.
2. For each pair of data classes this adapter reconciles, state the linking field (e.g., "phase.blockerId → blocker.blockerId").
3. Document conflicts resolution: if two classes write the same field (rate case), which is authoritative?
4. State whether the adapter reads Master (and thus needs cache invalidation).
5. List all audit log action types the adapter emits or responds to.

**This census is the input to the adapter design; the adapter is the first user of these field-level facts.**

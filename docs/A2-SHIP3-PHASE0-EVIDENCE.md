# A.2 SHIP 3 — PHASE 0 (notes adapter; read-only, nothing authorised to build)

**Written:** 2026-09-17 · **Mode:** EVIDENCE ONLY. No product source edited, no adapter written, no spec written, no version bump.
✅ **Q-18 … Q-27 RULED AS RECOMMENDED 2026-09-17** (`OWNER-RULINGS.md`) — the build is authorised as this document specifies it, and nothing more. The recommendation cells in the Q table are law; the leads are reported, not tasking.
**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md` §1 item 3 — *"**notes** (log notes)"*; §5 — *"Ship 3: notes adapter."*; §6 — John compares *"note count"* against what the app's existing surfaces show.
**Baseline:** `main` @ `4fbf5bf`, `dct-ios.html` at **`phantom-v1.14.593`** (`:12879` `const PHANTOM_APP_VERSION = 'phantom-v1.14.593';`), **60,979 lines**. `VERIFIED` line 1 reads `phantom-v1.14.593 VERIFIED`; `.593` is promoted. Every `:line` below was read against that tree. **Verbatim strings are the truth; line numbers are hints.**
**Rulings in force:** `OWNER-RULINGS.md` 2026-09-17 (**Ship 3 gated on Chromium**, entered by the parent session during this recon · Q-10…Q-17 · Q-A → separate `gaps` list, Ships 2–4 verified one at a time) · 2026-09-15 (Q-1…Q-9) · 2026-09-14 (the composite is the rack key).
**Builds on:** `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md` §4, §7, §14, *Adapter prerequisites* 6 · `docs/A1-CENSUS-REFRESH-TIER-A.md` §2, §4 · `docs/A2-ASSEMBLER-RECON.md` §1d · `docs/FIELD-REPORT-PHASE0-EVIDENCE.md` §3 · `docs/A2-SHIP1-EVIDENCE.md` · `docs/A2-SHIP2-PHASE0-EVIDENCE.md` (the template) · `docs/A2-SHIP2-EVIDENCE.md` (D-1…D-6).
**Live-behaviour evidence:** one throwaway **Chromium** probe (§Bounds). Every probe result below is marked **(probe)**.

---

## 0 · What decides Ship 3

1. ✅ **A NOTE CAN BE CREATED ON A DEVICE TODAY, THROUGH TWO LIVE REDESIGN DOORS, AND IT CARRIES THE RULED COMPOSITE.** Build's contextual action `'Log note'` (`:22479`, rendered `LOG NOTE`) and the rack detail's `LOG NOTE` button (`:42660`) both call `stripeRack_logNote(deployId, rackId)`, which writes `deploy_logAudit(deployId, 'RACK_NOTE', 'rack', rackId, note.slice(0, 500))` (`:57458`). The stored entry has `entityType: "rack"`, `entityId: "rack_dep_…_0"`, **`rack: ""`** **(probe)**. The rack is in `entityType`/`entityId` and **not** in the `rack` field. So the device look can show notes (§E-3, §E-9).
2. ⛔ **THE APP'S MOST VISIBLE NOTE DOOR NEVER REACHES A RACK.** Command's `LOG` verb (`:14003`, `:14051`) opens the *LOG ENTRY* sheet. Its `SEND` writes `OMNI_NOTE` with `entityType 'deployment'` (`:18747`). That note names no rack, so no rack record can ever contain it. The assistant's voice-to-audit notes carry a spoken, uppercased name as `entityId` (`:27941`), and that name matches no composite either. **Only `RACK_NOTE` is rack-attributable by field.** (§E-2c, **Q-18**, **Q-19**)
3. ⛔ **NO SURFACE SHOWS A PER-RACK NOTE COUNT, AND THE SURFACES THAT SHOW NOTES DISAGREE.** HISTORY (`deploy_showAuditLog`) lists the whole deployment. Each row reads `RACK_NOTE` and does not say which rack it belongs to. The rack detail's *RECENT ACTIVITY* only shows notes whose **text** contains the rack's name: after three notes it showed one **(probe)**. The shift report's *Field Notes* section counts only `OMNI_NOTE`. **The only honest on-device comparison is the HISTORY list in a one-rack deployment.** (§E-4, **Q-26**)
4. ⛔ **THE SOURCE LOSES ENTRIES, ACROSS ALL DEPLOYMENTS, AND ITS LOSS MARKER UNDERCOUNTS.**
   - **The cap:** the log holds at most 2,000 entries, device-wide. In steady state each eviction writes `truncatedCount: 1` onto the new head, so the count never builds up: `1, 1, 1` over three evictions **(probe)**.
   - **Restore:** a backup restore writes the same `chainReset` marker.
   - **Deletion:** deleting or closing out a deployment purges its entries and leaves **no** marker. After that, chain verification reports a break for the other deployments **(probe)**.
   - **What Ship 3 needs:** the notes row must say when a reset marker exists. Today's fold can attach a `detail` only to `ok` and `error` rows, never to `empty` ones. (§E-2f–g, **Q-23**)
5. ✅ **A PURE READ NEEDS NO NEW PRIMITIVE.** `_rr_readKey(DEPLOY_AUDIT_KEY)` serves the log unchanged. Every app-side audit loader goes through `safeGet`: over a malformed key, `deploy_loadAuditFor` writes a quarantine record **(probe)**, and `deploy_loadAuditFor('')` writes the crash log **(probe)**. (§E-8)
6. ⚠ **THE DOUBLE-COUNT HAZARD IS IN THE RACK CHANNELS THEMSELVES.**
   - `BLOCKER_OPENED` carries the composite in its `rack` field and the blocker's text in `summary`.
   - `PHASE_COMPLETE` is the same moment as the phase record's `signedOffAt`, and it names the rack only in free text.
   - An adapter that matched on "any rack channel" would count both twice. **Recommendation:** `RACK_NOTE` only, and `rack` is never a match key. (§E-5, **Q-18**)

---

## E-1 · WHAT IS A "NOTE"? EVERY NOTE-BEARING STORE IN THE FILE

### E-1a · The census of note-bearing writers and stores

Found by searching `dct-ios.html` for `note`, `notes`, `_notes`, `comment`, `memo`, `.notes[`, `.note =`, and for every `deploy_logAudit(` call site. The optic reference tables (`:16969-17240`, static `notes:` strings) and the OUI/prefix tables (`:53061-53080`) are reference data, not user notes, and are omitted.

| # | Store · key · shape | Writer(s) | Rack-key form written | Timestamp | Census row | Verdict for Ship 3 |
|---|---|---|---|---|---|---|
| **N-1** | **audit `RACK_NOTE`** · `phantom_deploy_audit_v1` · entry, note text in `summary` | `stripeRack_logNote` typed path `:57458`; chip-hold path `:57447` | **composite** in `entityId`; `rack: ''` | `ts` epoch ms `:31102` | refresh §4 (entry shape, `entityType`/`entityId`, *"The two rack-named note writers are `RACK_NOTE`"*) | ✅ **the class** |
| N-2 | audit `OMNI_NOTE` ("FIELD NOTE") · same key | `logSheet_send` `:18747` (Command `LOG` → `SEND`) | **none**: `entityType 'deployment'`, `entityId` = deployment id | `ts` | refresh §4 (entry shape) | ⛔ deployment-scoped (**Q-19**) |
| N-3 | audit `VA_BLOCKER_NOTE` / `VA_PHASE_NOTE` · same key | `va_confirmAuditLog` `:27941` (assistant answer → `LOG … on <rack>` button) | **spoken name**, uppercased (`'R-01'`, `'RACK X'`) from a regex `:27894-27901` | `ts` | refresh §4 (entry shape) | ⛔ never a composite (**STOP S-19**) |
| N-4 | audit `BLOCKER_OPENED` · same key · blocker text in `summary` | `blocker_save` `:26063-26064` | **composite in `rack`** (`{ rack: rackId, stepId: '' }`); `entityId` = phaseId | `ts` | refresh §4 | ⛔ blockers adapter's moment (Q-17) |
| N-5 | audit `PHASE_BLOCKER_NOTE` · same key · `'Blocker note updated (N chars)'` | `blocker_save` `:26088` | phaseId only | `ts` | refresh §4 | ⛔ carries no note text (**Q-18**) |
| N-6 | phase `notes: { itemId: string }` (checklist item notes) · `phantom_deploy_phases_v1` | `checklist_setNote` `:30517-30530` (phase card checklist `+ note` `:30638`, `note / value` input `:30636`); Build worklist `Evidence` `:22562` (**dead**, see E-3c) | composite via the phase record's `rackId` | **none** | ⛔ **refresh §2: "Undocumented fields"** | ⛔ **STOP S-7** (**Q-20**) |
| N-7 | phase `_notes` (string; gate-override stamps) | `deploy_overrideGate` `:32727` `'[GATE OVERRIDE ' + new Date().toISOString() + '] '`; seed `''` `:32609` | composite via `rackId` | ISO text **inside** a string | A.1 §2; refresh §2 | ⛔ phases class; the moment is also `GATE_OVERRIDE` in audit `:32743` (**S-8**) |
| N-8 | phase `blockerNote`; blocker `desc` | `blocker_save` `:26048`, `:26071`; `PHANTOM_BLOCKERS.create` | composite | none (desc edits carry no stamp) | A.1 §2/§3; refresh §3 | ⛔ blockers class, Ship 2 (**S-9**) |
| N-9 | rack record `notes` · `phantom_deploy_racks_v1` | seed `notes: sr.notes \|\| ''` `:32591`; MASTER SCOPE `rack.notes = 'UNPLACED (' + … ` `:36712` | the record **is** the composite | none | ⛔ racks store: no Tier-A census; Q-2 ruled no racks adapter | ⛔ **S-10** |
| N-10 | discrepancy `note`, `resolution.note` · `phantom_discrepancies_v1` | `discLog_save` `:34062`; `disc_resolve` `:34422` | **typed, uppercased** `rackId` `:34059`, or reconcile's lowercase Master colon id | `ts`, `resolvedAt` | A.1 §7 only (not refreshed). ⚠ A.1 §7 documents `resolutionText`; the code writes `note` (L-15) | ⛔ other class, never composite (**S-11**) |
| N-11 | handoff `notes` · `phantom_handoff_v1` | `handoff_generate` `notes: ''` `:31373`; the save path `draft.notes = notes.trim()` `:42859` | none (deployment-scoped) | `generatedAt`, `savedAt` | A.1 §14 | ⛔ **S-12** |
| N-12 | issue event `note_added` · `phantom_deploy_issues_v1` | `issue_addNote` `:26501-26505` → `issue_addEvent` `:26457` | **composite**: `rackId: (ctx && ctx.rack) ? ctx.rack.id : null` `:26887` | `ts` epoch ms | ⛔ **NOT IN CENSUS** (the key appears only in the A.1 backup-key list, `:715`, `:749` of that doc) | ⛔ **S-13** (**Q-27**) |
| N-13 | `phantom_lognote_chips_v1` · `{ added:[{id,label}], removed:[id], renamed:{id:label} }` `:17976` | `lognoteChips_add/remove/rename` `:18025-18056` | none | none | A.1 §4 (shape **wrong**, H12); A.2 recon §1d corrects it | ⛔ chip configuration, not notes (**S-14**) |
| N-14 | optic audit walk entry `notes`, `rack` | `saveEntryFromScan` `:54894` and its sibling `:54997` | typed, uppercased | `ts` | ⛔ not in census (`phantom_audit_walk_v1` is in A.2 recon §4's uncovered list) | ⛔ **S-15** |
| N-15 | Ghost Echo quirk `text` · `phantom_ghost_echo_v1` | Ghost Echo capture (`:31926-31938` shape comment) | none (hardware · phase · site) | `ts` | ⛔ not in census | ⛔ **S-16** |
| N-16 | optic ledger `notes` · `phantom_deploy_optics_v1` | seed `notes: ''` `:31406` | none (deployment) | none | A.1 §15 | ⛔ **S-17** |
| N-17 | crash log · `phantom_crash_log` | `phantomErrorLog` | none | ISO string (A.2 recon §1d) | A.1 §4 lists it under *LOG NOTES* | ⛔ an error log, not notes (**S-20**) |

⭐ **Only N-1 satisfies all four conditions.** It is census-documented, rack-attributable by a field (not by free text), carries the ruled composite, and has a real happened-at. N-12 meets the last three but has no census row.

### E-1b · STOP list — fields the adapter would want that the census does not document, or that belong to another class

Numbered after Ship 2's S-1…S-6.

| # | Wanted | Why it is not available | Consequence |
|---|---|---|---|
| **S-7** | checklist item notes `phase.notes[itemId]` | refresh §2 lists `notes: { itemId: string }` under *"Undocumented fields"*. It is also Ship 1's class, and it has no time | ⛔ never read (automatic reviewer FAIL) |
| **S-8** | `phase._notes` gate-override stamps | Phases class. The ISO time sits inside free text. The same moment is `GATE_OVERRIDE` in audit | ⛔ never read, never parsed |
| **S-9** | `phase.blockerNote`, blocker `desc` | Blockers class (Ship 2; Q-17) | ⛔ no cross-store read |
| **S-10** | rack record `notes` (`UNPLACED (n): …`) | Racks store: no census refresh; Q-2 ruled no racks adapter | ⛔ not read |
| **S-11** | discrepancy notes | Another class; `rackId` is typed text or a Master colon id, never the composite; A.1 §7 is unrefreshed and wrong on `resolution` | ⛔ not read |
| **S-12** | handoff `notes` | Another class; deployment-scoped | ⛔ not read |
| **S-13** | issue `note_added` events | **Not in any census.** Also another class | ⛔ not read (**Q-27**) |
| **S-14** | log-note chip store | Configuration; no rack and no time | ⛔ not read |
| **S-15**, **S-16**, **S-17** | audit-walk `notes`, Ghost Echo `text`, optic-ledger `notes` | Not censused, or not rack-scoped | ⛔ not read |
| **S-18** | Audit-entry parts that must not be read or parsed. **The `id` format:** `'audit_' + Date.now() + '_' + rand4` `:31100`; never take a time from it. **`delta`:** named only in the stale schema comment `:25257`, and no writer produces it. **The rack's name inside `summary`:** free text. **The deployment id inside the composite:** never parse it. **`hash` / `prevHash`:** not verified in A.2 (**Q-24**). **`truncatedCount` read as a loss count:** it is not one (L-7) | These parts are undocumented, or they are free text, or their meaning is not what the field name says | ⛔ design around none of them |
| **S-19** | VA note `entityId` (a spoken, uppercased name) | Translating a human name to a composite needs the racks store (Ship 2 S-5) | ⛔ the entry never matches |
| **S-20** | crash log | Not notes; the timestamp is an ISO string | ⛔ not read |

---

## E-2 · THE AUDIT LOG AS THE NOTES SOURCE (`DEPLOY_AUDIT_KEY`)

### E-2a · Key, container, loaders

```
:25327  const DEPLOY_AUDIT_KEY  = 'phantom_deploy_audit_v1';
:31007  function deploy_loadAllAudit() {
:31008    var all = safeGet(DEPLOY_AUDIT_KEY, []);
:31011  function deploy_loadAuditFor(deployId) {
:31012    if (!deployId) { _deploy_loaderMisuse('deploy_loadAuditFor'); return []; }
:31013    return deploy_loadAllAudit().filter(function(e) { return e.deploymentId === deployId; });
:31015  function deploy_saveAllAudit(arr) { return safeStore(DEPLOY_AUDIT_KEY, JSON.stringify(arr)); }
```

The log is **one flat JSON array for the whole device**, in append order (`all.push(_entry)` `:31120`). Deployments are told apart only by each entry's `deploymentId`. `:31013` would throw on a `null` array member (`e.deploymentId`). Census: refresh §4 *"**Key** `DEPLOY_AUDIT_KEY = 'phantom_deploy_audit_v1'`"*.

### E-2b · Entry shape as written — every field, with its census row

```
:31099      var _entry = {
:31100        id: 'audit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
:31101        deploymentId: deploymentId,
:31102        ts: Date.now(),
:31103        actor: actor,
:31104        action: action,
:31105        entityType: entityType,
:31106        entityId: entityId,
:31107        summary: summary || action,
:31109        hashV: 2,
:31110        siteProfileId: _sp || '',        // binds to ACTIVE_SITE_PROFILE.id
:31111        masterId: _mid || '',            // the Master active WHEN THE EVENT OCCURRED
:31112        rack: meta.rack || '',
:31113        stepId: meta.stepId || '',
:31114        evidence: Array.isArray(meta.evidence) ? meta.evidence : []
:31118      _entry.prevHash = (_prev && _prev.hash) ? _prev.hash : '';
:31119      _entry.hash = _audit_hashEntry(_entry);
```

A `RACK_NOTE` exactly as the Build door stored it **(probe)**. The key order matches the probe; the values are copied verbatim:
```
{"id":"audit_1789667234212_4u2i","deploymentId":"dep_1750000000000_ab12cd","ts":1789667234212,"actor":"E2E",
 "action":"RACK_NOTE","entityType":"rack","entityId":"rack_dep_1750000000000_ab12cd_0","summary":"RR PROBE typed",
 "hashV":2,"siteProfileId":"site_e2e_01","masterId":"","rack":"","stepId":"","evidence":[],"prevHash":"","hash":"c6a72ae0…3f39"}
```
The typed text `'  RR PROBE typed  '` was stored trimmed (`note = note.trim()` `:57455`).

| Field | Type as written | Census (quoted) | Adapter reads it? |
|---|---|---|---|
| `id` | string | refresh §4 *"`id` · `deploymentId` · `ts` · …"* | ✅ `data.auditId`, verbatim, never parsed |
| `deploymentId` | string | refresh §4 | ❌ (I-2) |
| `ts` | number, epoch ms | refresh §4 *"✅ `ts: Date.now()` is a reliable happened-at, append-only, never updated"* | ✅ `t` |
| `actor` | string | refresh §4 *"`actor` falls back `identity_getUser() \|\| dep.buildLead \|\| 'System'`"* | ✅ `data.actor`, verbatim |
| `action` | string | refresh §4 | ✅ the filter |
| `entityType` / `entityId` | strings | refresh §4 *"⛔ THE CENSUS DOCUMENTS `resource` / `resourceId`. THE CODE WRITES `entityType` / `entityId`"* | ✅ the filter |
| `summary` | string (`summary \|\| action`) | refresh §4 | ✅ `data.text` |
| `hashV`, `siteProfileId`, `masterId`, `stepId`, `evidence` | as above | refresh §4 entry-shape list | ❌ (I-9) |
| `rack` | string, `''` unless `meta.rack` | refresh §4 *"`rack: meta.rack \|\| ''` exists on every entry, but of 24 `deploy_logAudit` call sites, exactly two pass `meta.rack`"* | ❌ **never a match key** (E-2c) |
| `prevHash` / `hash` | strings | refresh §4 entry shape | ❌ (**Q-24**) |
| `chainReset` · `truncatedCount` · `truncatedAt` · `truncatedLastHash` | added to the **head** on eviction `:31129-31132`; `chainReset` and `truncatedAt` also written by restore `:56975` | refresh §4 *"FIFO cap at 2,000 entries, with `chainReset` / `truncatedCount` / `truncatedAt` / `truncatedLastHash` written onto the new head"* | ✅ `chainReset === true` only (E-2f); **`truncatedCount` is never shown as a number** (L-7) |

⛔ **Do not read the A.1 census's audit shape.** Its `resource` / `resourceId` fields read `undefined`, and its prerequisite 6 already uses the refreshed names. The in-file schema comment `:25257` lists a `delta` field that nothing writes (S-18).

### E-2c · The three rack channels, per call site

**24 call sites.** `grep "deploy_logAudit("` returns 26 lines. Two of them are not call sites: the comment `:18704` and the definition `:31089`.

| Line | `action` | `entityType` · `entityId` | `rack` | Rack's name in `summary`? |
|---|---|---|---|---|
| `:18747` | `OMNI_NOTE` | `deployment` · deployment id | `''` | free text only |
| `:26063` | `BLOCKER_OPENED` | `phase` · phaseId | **composite** (`{ rack: rackId, stepId: '' }` `:26064`) | no — the blocker text |
| `:26088` | `PHASE_BLOCKER_NOTE` | `phase` · phaseId | `''` | no |
| `:26443`, `:26493`, `:43336` | `ISSUE_CREATED`, `ISSUE_<STATUS>`, `ISSUE_TRIAGED` | `issue` · issue id | `''` | no |
| `:27791` | `RACK_ASSIGNED` | **`rack` · composite** | `''` | no (`'Assigned to: …'`) |
| `:27941` | `VA_BLOCKER_NOTE` / `VA_PHASE_NOTE` | **`rack` · spoken uppercase name** | `''` | the raw question, cut to 80 chars `:27932` |
| `:31245` | `PHASE_REVERIFY_FLAGGED` | `phase` · phaseId | `''` | no |
| `:31449` | `OPTIC_DISPENSED` / `OPTIC_INSTALLED` | `optic` · optic id | `''` | no |
| `:31602` | `STEP_STATE_CHANGE` | `step` · stepId | **composite** (`{ rack: rackId, … }` `:31603`) | no — ⛔ **dead**: inside `PHANTOM_PHASE_MODEL.transition`; `\.transition(` has 0 hits |
| `:32695` | `PHASE_STARTED` · `PHASE_COMPLETE` · `PHASE_BLOCKED` · `PHASE_UNBLOCKED` · `PHASE_ADVANCED` | `phase` · phaseId | `''` | **yes** — `' (' + rackDisplayName + ')'` `:32696` |
| `:32743` | `GATE_OVERRIDE` | `phase` · phaseId | `''` | **yes** `:32744` |
| `:34092`, `:34439`, `:54297`, `:54562` | `DISCREPANCY_LOGGED` / `_RESOLVED` | `discrepancy` · a `'disc-' + Date.now()` pseudo id (`:34091`) or the record id | `''` | the typed uppercase `rackId`, when there is one |
| `:43492` | `CRITERION_MET` / `_RESET` | `criterion` · id | `''` | no |
| `:43619`, `:44421`, `:54414` | `DEPLOYMENT_COMPLETE`, `ASBUILT_EXPORT`, `VENDOR_EDP_ATTACHED` | `deployment` · deployment id | `''` | no |
| **`:57447`, `:57458`** | **`RACK_NOTE`** | **`rack` · composite** | **`''`** | no — the note text |
| `:59689` | `scan_collect` | **the scan's type — may be `'rack'`** · the scan entry id | `''` | `'[SCAN-COLLECT] type=… value=…'` |

What the three channels mean for a notes adapter:
- **`entityType === 'rack'` alone is not "a note".** It is shared by `RACK_NOTE`, `RACK_ASSIGNED`, the VA notes and a rack-typed `scan_collect`. **The filter must test `action`.**
- **`rack` names the composite on exactly one live action, `BLOCKER_OPENED`**, the blockers adapter's moment (Q-17). `STEP_STATE_CHANGE` is the other writer, and it has no caller. **`rack` must never be a match key.** Matching on it admits the blocker's text as a "note" and adds nothing a live `RACK_NOTE` carries.
- **`summary` is free text.** The rack's *display name* inside it cannot be mapped to the composite without the racks store (S-10, S-18). It is also a substring hazard (L-12).

### E-2d · Rack-ID forms in `RACK_NOTE`, and how each maps to the ruled composite

| Form | Where it comes from | Maps to composite |
|---|---|---|
| **composite** `rack_<depId>_<idx>` in `entityId` | Build: `var _d = c.dep.id, _r = c.rack.id;` `:22475`, offered **only** `if (c.dep && c.dep.id && c.rack && c.rack.id)` `:22474`. `c.rack` is a record from `deploy_loadRacksFor(out.dep.id)` `:21690`. Rack detail: `onclick="stripeRack_logNote(\'' + deployId + '\',\'' + rackId + '\')"` `:42660`, reached only after `racks.find(function(r) { return r.id === rackId; })` succeeds `:42321-42322`. **(probe)** `"onclick":"stripeRack_logNote('dep_1750000000000_ab12cd','rack_dep_1750000000000_ab12cd_0')"` | **identity**, as an exact string match |
| `rack: ''` | `deploy_logAudit` default `:31112`; neither `RACK_NOTE` call passes `meta` | not a channel |
| empty or wrong `entityId` | **No live `RACK_NOTE` writer produces one.** Both callers guard (above). `stripeRack_logNote` itself does not validate `rackId` `:57427-57433`: an unknown id only falls back to the raw id for the prompt title. It could be reached only by a direct console call | a restore or hand edit could carry anything → whole-string equality simply fails to match |

Deployment ids contain underscores (`'dep_' + ms + '_' + rand6`). **Compare whole strings; never take a prefix and never parse** (Ship 2 E-1c). The composite is globally unique by construction. The comment `:27779` says so: *"Rack ids are globally unique ('rack_<deployId>_<idx>')"*.

### E-2e · How the adapter finds one rack's notes in a deployment-scoped log

- The log is keyed by `deploymentId`, so a rack's entries are not grouped anywhere. **The adapter scans the whole array** and keeps entries where `e && typeof e === 'object' && e.action === 'RACK_NOTE' && e.entityType === 'rack' && e.entityId === rackId`.
- **`deploymentId` is neither compared nor derived.** Deriving it would mean parsing the composite (S-18). The live writers always pass a matching pair (E-2d) (I-2).
- The live writer caps the array at 2,000 entries (E-2f). A restore writes whatever the backup held, uncapped, until the next append trims it. One linear pass per assembly is bounded either way.
- **The ruling-2026-09-14 route of recovering a rack from `phase.id` is not needed for notes.** `RACK_NOTE` carries the composite directly. That route matters only if phase-keyed actions are admitted (**Q-18** option B).

### E-2f · Truncation and restore — the spine is lossy, and its marker undercounts

```
:31124      if (all.length > 2000) {
:31125        var _evicted = all.slice(0, all.length - 2000);
:31126        all = all.slice(-2000);
:31129        all[0].chainReset = true;
:31130        all[0].truncatedCount = (all[0].truncatedCount || 0) + _evicted.length;
:31131        all[0].truncatedAt = Date.now();
:31132        all[0].truncatedLastHash = (_last && _last.hash) ? _last.hash : '';
```
```
:56975        if (cleanAudit.length) { cleanAudit[0] = cleanAudit[0] || {}; cleanAudit[0].chainReset = true; cleanAudit[0].truncatedAt = Date.now(); }
```

- **The cap is device-wide.** Any deployment's activity can evict this rack's oldest notes. The marker lands on `all[0]`, which may belong to a different deployment.
- ⛔ **`truncatedCount` does not build up.** In steady state each append evicts one entry, and that entry is the previous marker carrier. So the new head starts from `0` and reads `1`. **(probe)** Three appends onto a full log gave head `seed_1` → `seed_2` → `seed_3`, each with `truncatedCount: 1` and `resetMarkers: 1`. **A detail that prints the count would understate the loss** (L-7).
- **A restore writes the same marker**, without `truncatedCount`, on every non-empty restore. It does so whether or not anything was dropped. `phantom_restoreOrphans` drops entries whose `deploymentId` is not in the restored deployments (`:56776` `cleanAudit = audit.filter(function(a) { return a && a.deploymentId && validDepIds[a.deploymentId]; })`). A marker left by an older restore can remain mid-array.
- **What the adapter can say honestly:** a `chainReset === true` entry exists, so entries older than it were dropped or the log was replaced. It **cannot** say whether any dropped entry was this rack's, or how many were lost.
- ⚠ **Where it can say it:** only in its coverage row. Facts are kept only on `ok`, and a rack with no surviving notes reads `empty`. Today the fold attaches `detail` only on `error` and `ok` (`:31761-31762`). → **Q-23**

### E-2g · Purge — deletion and close-out

```
:31141  function deploy_purgeAudit(deploymentId) {
:31143    all = all.filter(function(e) { return e.deploymentId !== deploymentId; });
:42743    deploy_purgeAudit(deploymentId);            // inside deploy_purgeHeavyData :42726
:42769    deploy_purgeHeavyData(id);                  // deploy_confirmDelete
:44092    deploy_purgeHeavyData(deploymentId);        // deploy_closeOut — after the tombstone is saved
```
- The racks and phases are purged in the same call (`:42728-42736`), so the purged rack also leaves the `?rrdev=1` picker. Assembling it by id reads `empty` from every adapter, which is consistent. **No marker is left, and the adapter cannot tell "purged" from "never had notes."** Recommendation: no special handling (Interpretation I-12).
- Edge case: the racks write can fail (`'Storage error — rack cleanup incomplete'` `:42730`), and the purge continues. The result is a surviving rack whose notes are gone, with nothing recorded. It is rare, and it is not the adapter's to fix.
- ⛔ **Purge breaks chain verification for everyone else.** No `chainReset` is written, so the first surviving entry after the purged block fails the link check. **(probe)** Three entries (A, other deployment, A), then `deploy_purgeAudit(other)` → `deploy_verifyAuditChain()` went from `{ok: true}` to `{ok: false, brokenAt: 1}`. HISTORY's banner `CHAIN BROKEN at entry N — audit log may have been altered` (`:43044`) then appears after an ordinary delete or close-out (L-8).

### E-2h · The hash chain — does the adapter need it?

**Recommendation: no, in A.2 (Q-24).**
1. **Verification is device-wide, not per rack.** `deploy_verifyAuditChain` `:31061-31075` walks every entry.
2. **It is not a pure read.** It reads through `safeGet` (`:31062`).
3. **It needs `window.sha256`.**
4. **It is already wrong after a legitimate purge** (E-2g).
5. **Nothing in rr-1 has a place for it.**

The chain is the log's own tamper evidence, and HISTORY already shows it. Re-emitting `hash`/`prevHash` would add nothing a renderer could use honestly today.

### E-2i · Actor fallback and Contract 9a

```
:31092      var actor = identity_getUser() || (dep && dep.buildLead) || 'System';
:25497  function identity_getUser() {   … PHANTOM_SITE.currentOperator() … || (localStorage.getItem(IDENTITY_USER_KEY) || '').trim();
```
- With an operator set, `actor` is the operator **(probe: `"actor":"E2E"`)**.
- ⛔ **With no operator, the entry credits the deployment's Build Lead. (probe)** With the profile's `operator` set to `''` and no legacy key, a `RACK_NOTE` stored `"actor":"LEAD-B"`, the seeded `buildLead`. Contract 9a: *"Every Event Log entry credits the ACTOR"*. The A.1 census's prerequisite 6 describes this fallback as 9a-compliant. The Build Lead is not necessarily the actor (L-9).
- `'System'` appears only when there is no operator and no deployment (or no `buildLead`). **(probe)** An entry logged against an unknown deployment id still stored `"actor":"E2E"`, because the operator was set.
- **The adapter cannot tell a real actor from a fallback.** No stored field says which it is. **Recommendation:** carry `actor` verbatim (Ship 2 I-6), and give the writer defect to the owner (**Q-25**). The device look sets the operator first.

---

## E-3 · EVERY PATH THAT CREATES A RACK NOTE ON A DEVICE

### E-3a · Live doors that write `RACK_NOTE` (`body.rd`) — ✅ reachable, probe-proven

| Door | Where | Verbatim | What it writes |
|---|---|---|---|
| **Build contextual action** | Build workspace action row, below the rack card. Six buttons: `Scan`, `Log blocker`, `Assign`, `QR`, `Log note`, `Photo`. **(probe)** each is `54` px tall, `text-transform: uppercase` → reads **LOG NOTE** | `['Log note', 'stripeRack_logNote', null]` `:22479` | opens the prompt ↓ |
| **Rack detail button** | full-width, under `ASSIGNED TO:` / `ASSIGN` / `QR`; `redesign_isOn()` only (`:42659`). **(probe)** `"text":"LOG NOTE","h":44` | `' &nbsp;LOG NOTE</button>'` `:42660` | opens the prompt ↓ |
| **The prompt** | `phantomPromptAsk` overlay | title `'Log Note to ' + rackLabel` `:57435` (**probe:** `Log Note to s1:001`); subtitle `'Lands in the audit trail · max 500 chars'` `:57436`; placeholder `'What happened on this rack?'` `:57438`; `maxLength: 500` `:57439`; buttons `CANCEL` / `OK` `:17856-17857` | — |
| **Typed note → OK** | — | `if (!note) return;` `:57456` (empty or whitespace writes nothing); `deploy_logAudit(deployId, 'RACK_NOTE', 'rack', rackId, note.slice(0, 500));` `:57458`; toast `'Note logged to ' + rackLabel` `:57460` (**probe:** `Note logged to s1:001`) | one `RACK_NOTE`, trimmed text |
| **Chip HOLD (≥ 500 ms)** | 12 default chips `:17978-17991` plus `+` and `EDIT` (**probe:** all 12 listed) | `timer = setTimeout(function() { held = true; timer = null; fireHold(label); }, 500)` `:17927` → `deploy_logAudit(deployId, 'RACK_NOTE', 'rack', rackId, String(label).slice(0, 500));` `:57447`; then `cleanup(null)` `:17923` closes the prompt without saving any typed text | one `RACK_NOTE` whose text is the chip label. **(probe)** `"summary":"IN PROGRESS"`, prompt closed |
| Chip TAP | — | `doTap` `:17913-17920` only appends the label to the input | **nothing** on its own. **(probe)** input read `WAITING ON VENDOR`; `CANCEL` → still 2 entries |

⭐ **Loud answer to the brief's question:** yes, two live redesign doors create a `RACK_NOTE`, with the composite in `entityId`, and a third path (chip hold) inside the same prompt. **The legacy stripe is gone:** `:42655-42658` *"v1.14.540: THE LEGACY STRIPE IS GONE, and this door is now the ONLY one"*. The same comment goes on: *"this door and the rack-detail action list at :22570 both call it"*. That second caller is Build's action row, now at `:22479` (added in `.438`, per spec 27's header). The function name `stripeRack_logNote` survives only because both remaining doors call it. Under `?legacy=1`, both doors are absent: `bw_render` returns early (`:22182`), and the detail button is gated (`:42659`).

⚠ **The chip labels read like state changes:** `'BLOCKED — see ticket'`, `'PHASE COMPLETE — signed off'`, `'POWERED DOWN — do not energize'`. A hold writes a **note** only, with no blocker record and no phase change. The adapter must never interpret the text (I-4).

⚠ **Contract 14, found not worked:** `stripeRack_logNote`'s `catch` → `'Failed to log note'` (`:57461-57462`) cannot run. `deploy_logAudit` swallows every error (`:31135-31137`) and ignores `deploy_saveAllAudit`'s return (`:31134`). So a failed write still toasts `Note logged to …` (L-10).

### E-3b · Doors that write a note-like audit entry that is **not** a rack note

| Door | Verbatim | Writes | Rack-attributable? |
|---|---|---|---|
| Command **`LOG`** verb | `<button class="hverb" type="button" onclick="openLogSheet()" aria-label="Log a field note">LOG</button>` `:14051` (also the quick-tools `LOG` `:14003`) → sheet title `LOG ENTRY` `:16671`, destination `'Logging to ' + dest.name` `:18720`, **`SEND`** `:16681` | `OMNI_NOTE`, `entityType 'deployment'` `:18747`; toast `'Logged - ' + dest.name` `:18749` | ⛔ **no** — the active deployment only (`deploy_getActiveId()` `:18707`) |
| Assistant voice-to-audit | `' LOG BLOCKER on ' + intent.rack + …` / `' LOG PHASE NOTE: ' + … + ' on ' + intent.rack` `:27918-27920`, shown after an AI answer (`:51893-51894`; needs the network) | `VA_BLOCKER_NOTE` / `VA_PHASE_NOTE`, `entityId` = the spoken name uppercased, deployment = `deploys[0]` of an **unsorted** active/paused list `:27909-27911` | ⛔ **no** (S-19; L-14) |
| `Log blocker` / `SAVE BLOCKER` | Ship 2 E-9 | `BLOCKER_OPENED` (text in `summary`, composite in `rack`) + `PHASE_BLOCKED` | ⛔ the blockers adapter's moment (Q-17) |

### E-3c · Doors that write a note that is **not in the audit log**

| Door | Writes | Status |
|---|---|---|
| Phase-card checklist `+ note` → `note / value` input (`:30638`, `:30636`), inside the phase dock on the rack detail | `phase.notes[itemId]` via `checklist_setNote` (debounced 400 ms, overwrite in place, no time, no actor, return value ignored `:30528`) | live; S-7 (**Q-20**) |
| Build worklist `Evidence` (`:22554`) → `window.prompt('Evidence note for: …')` → `checklist_setNote` `:22562` | same | ⛔ **dead**: the worklist reads `curPhase.items` (`:22529`), which no phase writer produces (seed `:32596-32610`), so it always reads `'No checklist items defined for this phase.'` Already recorded: `test/FIXTURE-SHAPES.md:392` *"⛔ NO WRITER FOR phase.items."* |
| Issues → a note on an issue | `note_added` event (S-13) | live; not censused (**Q-27**) |
| Discrepancy sheet `dl-note`, resolve sheet `dr-resolve-note` | discrepancy `note` / `resolution.note` (S-11) | live; other class |
| Handoff generator notes | `draft.notes` `:42859` (S-12) | live; deployment-scoped |

---

## E-4 · EVERY SURFACE THAT SHOWS RACK NOTES OR A NOTE COUNT

| Surface | Line | What it shows | Per rack? | Note count? |
|---|---|---|---|---|
| **HISTORY → AUDIT TRAIL** (`deploy_showAuditLog`) — the `HISTORY` button on the deployment screen `:38632`, where the app lands on reload with an active deployment (`:19452`) | `:43007-43100` | Every entry for the deployment, newest first. The header reads `escHtml(dep.name) + ' · ' + entries.length + ' event' + …` `:43027`; a chain banner `:43038-43046`; each row shows the action label, `summary` and `actor`. `RACK_NOTE` has **no entry** in `actionLabels` `:43069-43086`, so the row prints the raw key `RACK_NOTE` in the fallback colour. **(probe)** `AUDIT TRAIL / A2 SHIP3 PROBE · 3 events / CHAIN VERIFIED — 3 sealed / … RACK_NOTE / RR PROBE s1:001 from detail / E2E / 12:47 PM / RACK_NOTE / IN PROGRESS / …` | ⛔ **no** — the row does not name the rack | ⛔ only by counting `RACK_NOTE` rows; the header counts **every** action |
| Rack detail NERVE card *RECENT ACTIVITY* (`nerve_buildRackCard` `:57118`) | `:57150-57154`, `:57241-57258` | the last **3** deployment entries whose `summary` **contains** `rack.rackId`: `return e.summary && e.summary.indexOf(rackName) !== -1;`. **(probe)** after 3 notes it showed only `E2E: RR PROBE s1:001 from detail` — the one note whose **text** names the rack. `PHASE_*` / `GATE_OVERRIDE` entries appear there because their summary carries `(rackDisplayName)` | ⚠ by text | ⛔ no; a subset |
| Shift report (Command suggestion `Summarize shift` `:14012` → `shiftReport_generate` `:18429`) | `:18460-18470`, `:18634`, `:18644` | *"Field Notes (N)"* = **`OMNI_NOTE` only**. `RACK_NOTE` appears only among *"Key Events"* (last 50) as the raw key. The report covers the most recently updated deployment | ⛔ | ⛔ its "Field Notes" count **excludes** rack notes |
| Handoff generator | `:31314-31384`, `:42807` | `draft.shiftEventCount + ' audit event' + …` — every entry in the last 12 h, notes included; **no note text** in the record (`completedItems` are `PHASE_COMPLETE` · `CRITERION_MET` · `OPTIC_INSTALLED` only `:31329`) | ⛔ | ⛔ |
| `deploy_generateReport` (JSON / PRINT REPORT / CSV / close-out) | `:43715-43724` | `auditTrail` rows `{ ts, time, actor, action, entityType, summary }` — **no `entityId`**, so a `RACK_NOTE` row cannot be tied to its rack; `summary.auditEventCount` = all entries | ⛔ | ⛔ |
| `brief_buildLiveContext` | `:27873-27883` | the last 5 entries, as AI prompt text | ⛔ not rendered | — |

### Do they agree?

- **No surface counts notes per rack.** Handoff §6's *"note count … must match what the app's existing surfaces show"* has no direct counterpart. The nearest honest one is **the number of `RACK_NOTE` rows in HISTORY for a deployment with one rack.**
- **NERVE vs HISTORY:** NERVE shows the subset whose text contains the rack's name, capped at 3. It disagrees by construction (1 of 3 in the probe).
- **Shift report vs HISTORY:** the report's word *"Field Notes"* means `OMNI_NOTE`, while the notes adapter means `RACK_NOTE`. This is the Q-16 pattern, one ship later: two engines behind one word.
- **HISTORY header vs note count:** `N events` counts every action.
- The in-file comment `:42653` — *"the note lands in the same audit trail the Handoff report reads"* — is true only of the storage. The handoff shows no note text (L-11).

⭐ **What John compares on device:** the readout's `notes ok (N)` against the `RACK_NOTE` rows in **HISTORY**, in a **one-rack** deployment (**Q-26**). A lower number on NERVE, a *Field Notes* count that ignores rack notes, and a higher `N events` header are **not** FAILs.

---

## E-5 · SCOPE — `RACK_NOTE` ONLY, OR EVERY RACK-ATTRIBUTABLE AUDIT ENTRY? (→ Q-18)

| Audit action | How it could be tied to a rack | Same moment already on the timeline? | Hazard if Ship 3 emits it |
|---|---|---|---|
| **`RACK_NOTE`** | `entityId` = composite | no — no other store holds it | ✅ none |
| `PHASE_COMPLETE` | phaseId (`'phase_' + rackId + '_' + type`, refresh §2) or `summary` text | **yes** — `signedOffAt`, a separate `Date.now()` in the same call (`:32656` vs `:31102`); Ship 1 emits `phase.completed` from it `:31680-31682` | ⛔ **double count**. And a `PHASE_COMPLETE` survives a phase that later left complete; Ship 1 deliberately drops that stale stamp (`:31677-31679`) |
| `PHASE_STARTED` · `PHASE_BLOCKED` · `PHASE_UNBLOCKED` · `PHASE_ADVANCED` · `GATE_OVERRIDE` · `PHASE_REVERIFY_FLAGGED` | phaseId | no — Ship 1 notes *"Start, block, unblock and gate override have no happened-at on this record at all — they live in the audit log"* `:31678-31679` | ⚠ not a double count, but these are **phase** events, not notes. They need phaseId → rack resolution, and they raise ownership questions: Q-17 said Ship 3 *"may"* emit `PHASE_BLOCKED`/`PHASE_UNBLOCKED`, and the P6 derivation reads only `phase.completed` (`:31781`) |
| `BLOCKER_OPENED` | `rack` field (composite) or phaseId | **yes** — the record's `openedAt` `:25976` | ⛔ **forbidden** (Q-17): a double count of `blocker.opened`, and a double show of the same text (`summary` = `desc`) |
| `PHASE_BLOCKER_NOTE` | phaseId | partly — the desc edit has no stamp in the blocker store (Ship 2 I-2) | ⚠ carries only `'Blocker note updated (N chars)'`, no text |
| `RACK_ASSIGNED` | `entityId` = composite | no | ⚠ not a note; an assignment event |
| `VA_*_NOTE` | spoken name | — | ⛔ never matches (S-19) |
| `OMNI_NOTE` | none | — | ⛔ multiplying one deployment note across every rack fabricates attribution (Contract 10) (**Q-19**) |
| `STEP_STATE_CHANGE` | `rack` field | — | dead writer |

**Recommendation (Q-18 option A): emit `RACK_NOTE` only.**
- **It is what the handoff names:** *"notes (log notes)"*, and it is what §6 counts.
- **It is the one action whose rack is a field and whose moment no other adapter owns.**
- **It keeps Ship 3 one visible change:** a `notes` row and `note.logged` events.
- **The derived status cannot be disturbed.** `openBlockers` consults only `ev.source !== 'blockers'` → return (`:31797`), and the phase derivation only `ev.type === 'phase.completed'` (`:31781`). Neither can see a `note.logged`.
- **What stays off the timeline:** the phase happened-ats (start / block / unblock / override / re-verify) remain absent in A.2 — the *"may"* of Q-17 is not exercised. Deciding which adapter owns them is **option B** of Q-18, and it would be its own ruling and ship.

---

## E-6 · CHECKLIST ITEM NOTES `phase.notes{itemId}` — IN OR OUT? (→ Q-20)

```
:30516  // Per-rack note — rides ph.notes; debounced ~400ms.
:30517  function checklist_setNote(deployId, phaseId, itemId, str) {
:30525      if (!ph.notes || typeof ph.notes !== 'object') ph.notes = {};
:30527      if (v) ph.notes[itemId] = v; else delete ph.notes[itemId];
:30528      deploy_saveAllPhases(all);
```
**Recommendation: out of Ship 3, and out of A.2 unless the owner rules otherwise.**
- **Scope:** it lives on the phase record, which is Ship 1's store. Handoff §4 says *"One adapter per data class. No 'while I'm here' reads of another store."*
- **Census:** refresh §2 lists `notes: { itemId: string }` as **undocumented** (and name-colliding with `_notes`). Adapter-reviewer: *"A field read that the census never documented is an assumed anchor — automatic FAIL."*
- **Time:** it has no timestamp and no actor, and it is overwritten in place (`:30527`). It could only be a fact, never an event, and P6's spine is events.
- **Semantics:** the placeholder says `note / value` `:30636`. It is often a reading (a torque value, a serial), not a log note.
- **If ever wanted:** first a census row, then either the phases adapter emits it as a fact (`facts.phases.itemNotes`), or an A.3 renderer reads it. Both are the owner's call.

---

## E-7 · PROPOSED EVENT MODEL — `RR_ADAPTER_NOTES` (subject to Q-18 … Q-23)

**Reads:** `phantom_deploy_audit_v1` only, through `_rr_readKey(DEPLOY_AUDIT_KEY)` (E-8).
**Filter:** `e && typeof e === 'object' && e.action === 'RACK_NOTE' && e.entityType === 'rack' && e.entityId === rackId` (I-1, I-2).

### E-7a · Adapter status

| Storage state | `status` | `events` | `facts` | `detail` |
|---|---|---|---|---|
| `rackId` not a non-empty string | `empty` | `[]` | `{}` | — (Ship 2 D-3 guard) |
| key absent or `''` | `empty` | `[]` | `{}` | — |
| valid array, no matching note (incl. `[]`, or only other actions/racks) | `empty` | `[]` | `{}` | reset text if a `chainReset === true` entry exists (**needs Q-23 A**) |
| `getItem` throws | `error` | `[]` | `{}` | from `_rr_readKey` |
| malformed JSON | `error` | `[]` | `{}` | from `_rr_readKey` |
| parses, not an array | `error` | `[]` | `{}` | `'audit store is not an array'` (mirrors `:31705`) |
| ≥ 1 matching note | `ok` | per E-7b | `{ undated: [...] }` | the undated text, then the reset text, whichever apply, joined with `'; '` |

### E-7b · Events — one per matching entry with a usable time

| Event | Emitted when | `t` | `data` (all census-documented, E-2b) |
|---|---|---|---|
| `note.logged` (**Q-21**) | `typeof e.ts === 'number' && isFinite(e.ts)` | `e.ts` | `{ auditId: e.id (string) or null, text: e.summary or null, actor: e.actor or null }` — verbatim (Ship 2 D-6) |

### E-7c · Undated and bad-shape entries — never assume a time

| Entry | Events | `facts.undated` entry | Reachable how |
|---|---|---|---|
| `ts` missing, `null`, a string, or any non-finite value | none | `{ auditId, reason: 'ts is not a number' }` | restore or hand edit only — `deploy_logAudit` always writes `Date.now()` |
| `id` missing | `note.logged` with `auditId: null` (I-7) | — | restore or hand edit only |
| `summary` / `actor` missing | `note.logged` with `null` there | — | restore or hand edit only |
| array member that is not an object (`null`, `7`, `'RACK_NOTE'`) | none, and not counted | — | never an `error` for the adapter (Ship 2 I-10) |

**Detail strings (proposed):**
- undated: `N + ' note(s) have no usable time — counted, not on the timeline'`
- reset: `'the audit log carries a reset marker (2,000-entry cap or a restore) — notes older than its oldest surviving entry may be missing'`

**The reset text never prints `truncatedCount`** (L-7).

**Never:** a default `t`, `Date.now()` in the adapter, `t: null` on the timeline, a placeholder event, a note made from `OMNI_NOTE` or `BLOCKER_OPENED`, text parsed for a rack name or a state, or a hash check.

### E-7d · Derived status — rr-1 has no note field (→ Q-22)

```
:31814      status: { phase: phase, openBlockers: openBlockers, photoCount: null, photoBytes: null },
```
Handoff §3 lists exactly `phase`, `openBlockers`, `photoCount`, `photoBytes`, with the instruction *"build exactly this"*.

**Recommendation: no new status field.** The note count on device is:
- **the notes coverage row's `events`** — the readout already prints it as `notes ok (N)` (`:31888`);
- **plus the undated count**, which the row's `detail` states.

It is not stored and not cached, and it is re-read on every assembly (P4). Adding a field (`status.noteCount`) would change a shape the handoff fixed. Q-14 shows that such a change needs an explicit owner ruling even without a schema bump, and no renderer needs it before A.3.

Ship 3 therefore does not touch `:31776-31804`. Note events cannot move `phase` or `openBlockers` (E-5).

### E-7e · Coverage row and facts

- **The row:** `{ adapter: 'notes', status, events }`, plus `detail` only when there is one (I-11).
- **Facts on `ok`:** `{ undated: [{ auditId, reason }] }`.
- **The reset marker lives in `detail`, not in facts.** An `empty` read keeps no facts (`:31759`), and that is exactly the case where the marker matters.

---

## E-8 · THE REGISTRY, THE FOLD, AND THE PURE READ

### E-8a · Pure read — every app-side audit reader writes on a bad day

| Reader | Goes through | Side effect | Adapter may use it? |
|---|---|---|---|
| `deploy_loadAllAudit` `:31007` | `safeGet` `:31008` | on malformed JSON: `phantom_quarantine` writes `phantom_quarantine_v1` and toasts (`:17594`, `:17601`). **(probe)** quarantine key written for `phantom_deploy_audit_v1` | ⛔ |
| `deploy_loadAuditFor` `:31011` | the above | the above, plus `_deploy_loaderMisuse` → `phantom_logErr` on an empty id. **(probe)** `crashLogChanged: true`. It also throws on a `null` member (`:31013`) | ⛔ |
| `deploy_verifyAuditChain` `:31061` | `safeGet` `:31062` | the quarantine write; plus sha256 over the whole log | ⛔ |
| **`_rr_readKey(DEPLOY_AUDIT_KEY)`** `:31629-31636` | raw `getItem` + `JSON.parse` in `try` | none | ✅ **unchanged** |

`DEPLOY_AUDIT_KEY` is a top-level `const` at `:25327`, in the same inline script as the assembler (`<script>` `:16928` … `</script>` `:59801`). It is initialised before `:31611` runs, so there is no TDZ at load or at `read()`.

### E-8b · Registry, placement, order

```
:31740  };                                   // end of RR_ADAPTER_BLOCKERS
:31742  var PHANTOM_RR = {
:31745    registry: [RR_ADAPTER_IDENTITY, RR_ADAPTER_PHASES, RR_ADAPTER_BLOCKERS],
```
**How to register:** declare `var RR_ADAPTER_NOTES = { name: 'notes', schemaHandled: 'phantom_deploy_audit_v1 (docs/A1-CENSUS-REFRESH-TIER-A.md §4)', read: function(siteId, rackId) { … } };` **between `:31740` and `:31742`**, and append it as the **fourth** registry entry.

- ⛔ **Placement trap:** Ship 2's M7 proved that a declaration below `var PHANTOM_RR` makes `registry[3]` `undefined`. `facts[ad.name]` (`:31759`) is outside the `try`, so `assemble()` throws. That mutation turned 17 of 18 tests red.
- **Tie order:** `merged.sort(… (a.ev.t - b.ev.t) || (a.order - b.order) || (a.i - b.i))` (`:31773`). On an equal `t`, phases sort before blockers, which sort before notes. Two notes with the same `ts` keep stored (append) order.
- ⛔ **Sort trap:** a non-number `t` makes the comparator `NaN`, which is why E-7b emits finite numbers only.

### E-8c · The fold — the one assembler line Q-23 would move

```
:31761      if (res.status === 'error') row.detail = String(res.detail || 'unknown error');
:31762      else if (res.status === 'ok' && res.detail) row.detail = String(res.detail);   // Q-11: an ok read may carry a caveat
```
**Under Q-23 option A,** `:31762` would also pass `detail` on `empty`: `else if (res.status !== 'error' && res.detail)`. That is the only line outside the new adapter and the registry that Ship 3 would touch.

- **Identity, phases and blockers never return a `detail` on `empty`**, so their rows keep today's exact shape.
- **Nothing else in `assemble()` moves.** The readout (`:31881-31894`) already prints any row's `detail`.

---

## E-9 · DEVICE LOOK FOR SHIP 3 (ruling Q-8: a Safari tab, not the icon)

**Where:** Safari → `https://phantom-staging.wfj6t2fk7w.workers.dev/dct-ios.html`, all in one tab. First confirm that SYS shows the Ship 3 version.

**Set-up:**
- **Reuse:** if the Ship 1/2 looks' TST99 deployment is still in this tab, reuse it. It holds **one** rack, which is what makes the count comparable (Q-26).
- **Otherwise:** Build → **＋ NEW** → **LOAD MASTER** (`MASTER-US-TST99-TORTURE-TEST.xlsx`) → select **one** cab (e.g. `s1:001`) → **STAGE SCOPE SNAPSHOT** → name it → **CREATE DEPLOYMENT**.
- **Operator:** make sure an operator name is set before logging, or the notes will credit the Build Lead (E-2i).

**The controls, from source:**
- Build's action row, button **LOG NOTE** (`'Log note'` `:22479`, uppercase by CSS).
- The rack detail's full-width **LOG NOTE** (`:42660`).
- The prompt, titled `Log Note to s1:001`, with **OK** / **CANCEL**.
- HISTORY on the deployment screen (`:38632`).
- To reach the rack detail from Build: **Continue** (`:22333`; it reads `Open blocked rack` if the Ship 2 blocker is still up) or the rack's queue row.

⛔ **Avoid for this look:**
- **Command's `LOG` → `SEND`.** It writes a deployment *FIELD NOTE* that no rack record can hold (Q-19), and it adds a `FIELD NOTE` row to HISTORY.
- **The assistant's `LOG … NOTE` buttons** (S-19).
- **The checklist `+ note`** (Q-20).
- **`Log blocker`.** It is excluded by design, but it changes the HISTORY count.

If any of these was used, the look is **not** failed. Count only `RACK_NOTE` rows.

**The look:**
1. **Before any note:** deployment screen → **HISTORY**. Write down the header's `N events` and the number of `RACK_NOTE` rows. It should be 0, or whatever an earlier try left. Then add `?rrdev=1` and pick the rack.
   - **PASS:** the coverage line ends `· notes empty` when HISTORY has no `RACK_NOTE` rows (`· notes ok (k)` when it has k of them), even when HISTORY lists the Ship 2 look's `BLOCKER_OPENED` / `BLOCKED` / `UNBLOCKED` entries. **That is the scope ruling working (Q-18).**
   - Every other part of the line is exactly as Ship 2 left it: `identity ok (0) · phases ok (0) · blockers …`.
   - The gold `gaps:` line is unchanged.
2. Reload **without** the param → **BUILD** → **LOG NOTE** → type `RR SHIP3 A` → **OK**.
   - **PASS:** the toast reads `Note logged to s1:001` (or the cab you scoped).
3. **Continue** (or the rack's row) → rack detail → **LOG NOTE** → type `RR SHIP3 B` → **OK**. **PASS:** the same toast.
4. **Optional, chip hold:** **LOG NOTE** again → press and hold the chip `IN PROGRESS` for about one second.
   - **PASS:** the prompt closes and the same toast appears.
   - If iOS does not fire the hold, the prompt stays open. Tap **CANCEL**. This is not a Ship 3 FAIL.
5. Deployment screen (reload lands there) → **HISTORY**.
   - **PASS:** the header reads `N+2 events` (`N+3` with step 4). The new rows each read `RACK_NOTE`, with your text and your operator name under it.
6. Add `?rrdev=1` → pick the rack.
   - **PASS:** the coverage line ends `· notes ok (M)`, where **M is the total number of `RACK_NOTE` rows HISTORY now lists**: 2 more than in step 1, or 3 more with step 4 (so `notes ok (2)` on a fresh deployment).
   - The JSON timeline holds `note.logged` events whose `data.text` read `RR SHIP3 A`, then `RR SHIP3 B` (then `IN PROGRESS`), with `data.actor` = your operator. Each has a numeric `t`, and they are the newest events, so they come last on the timeline.
   - `status` is exactly as before the notes: `phase` unchanged, `openBlockers` unchanged, `photoCount`/`photoBytes` `null`, and no `noteCount` key (Q-22).
7. Reload without the param: no trace of the readout.

**FAIL:**
- `notes` reads `error`.
- `notes ok (…)` with a number that does not match the new `RACK_NOTE` rows.
- `notes` counts a `BLOCKER_OPENED`, `BLOCKED`, `UNBLOCKED` or `FIELD NOTE` row.
- A `note.logged` whose text is a blocker description.
- Any event without a numeric `t`.
- `identity`, `phases` or `blockers` changed from Ship 2's values.
- `openBlockers` or `status.phase` moved because of a note.
- Any trace of the readout without the param.

**Not a FAIL (recorded disagreements, Q-26):**
- The rack detail's *RECENT ACTIVITY* shows none, or only some, of the notes. It shows a note only if the text contains the rack's name.
- The shift report's *Field Notes* count does not include rack notes.
- The HISTORY header counts every action.

⚠ **What the look cannot show:** truncation (the 2,000-entry cap is device-wide — do not try to fill it), the restore marker, undated entries, a malformed store, scoping between racks (HISTORY rows do not name their rack, so a two-rack deployment cannot be checked by eye), and VA notes. Spec 65 owns all of them (E-10).

---

## E-10 · TEST PLAN (spec 65 additions — RED first on `.593`)

**Gate engine:** `laptop-chromium`, per the owner ruling entered 2026-09-17 during this recon (*"A.2 SHIP 3 IS GATED ON CHROMIUM TOO"*). The Safari look (E-9) is the only WebKit gate.

**Fixture — a third seed, so the Ship 1/2 expectations stay byte-identical:** `seedWithNotes()` = `{ ...seedWithBlockers(), phantom_deploy_audit_v1: JSON.stringify(AUDIT) }`.

**The helper — every entry carries all 16 written fields (E-2b), `rack: ''` as the live writer stores it:**

```
aud(id, ts, action, entityType, entityId, summary, over) = Object.assign({
  id, deploymentId: DEP, ts, actor: 'E2E', action, entityType, entityId, summary,
  hashV: 2, siteProfileId: 'site_e2e_01', masterId: '', rack: '', stepId: '',
  evidence: [], prevHash: '', hash: '' }, over)
```

⚠ Spec 64's fixture `RACK_NOTE` carries `rack: RACK` (`64-…spec.js:76-77`), a shape no live writer produces. Do not copy it (L-16).

**`AUDIT` — the stored order is deliberately not time order.** `TEN = 'rack_' + DEP + '_10'` (already defined); `FOREIGN = 'rack_dep_1750000009999_zz99zz_0'`.

| # | Const | `ts` | `action` | `entityType` · `entityId` | `summary` · overrides | Proves |
|---|---|---|---|---|---|---|
| 1 | `A_LATE` | `T0+500` | `RACK_NOTE` | `rack` · `RACK` | `'cage nut short'` | a note |
| 2 | `A_ASSIGN` | `T0+10` | `RACK_ASSIGNED` | `rack` · `RACK` | `'Assigned to: E2E'` | entity match alone is not a note |
| 3 | `A_OTHER` | `T0+30` | `RACK_NOTE` | `rack` · `OTHER` | `'other rack note'` | another rack |
| 4 | `A_BLK` | `T0+200` | `BLOCKER_OPENED` | `phase` · `'phase_'+RACK+'_network'` | `'missing optic'`, `{ rack: RACK }` | `rack` is never a key; Q-17 |
| 5 | `A_EARLY` | `T0+20` | `RACK_NOTE` | `rack` · `RACK` | `'rail kit missing'`, `{ actor: 'System' }` | first event; actor verbatim |
| 6 | `A_TEN` | `T0+40` | `RACK_NOTE` | `rack` · `TEN` | `'ten rack note'` | a prefix is not a match |
| 7 | `A_PHASE` | `T0+101` | `PHASE_COMPLETE` | `phase` · `'phase_'+RACK+'_power'` | `'Power: in_progress → complete (s1:001)'` | no double count; summary text is not a key |
| 8 | `A_TIE` | `T0+300` | `RACK_NOTE` | `rack` · `RACK` | `'IN PROGRESS'`, `{ actor: 'LEAD-B' }` | ties two phases and `B_TIE` → sorts last; a chip label; a Build-Lead fallback carried verbatim |
| 9 | `A_OMNI` | `T0+60` | `OMNI_NOTE` | `deployment` · `DEP` | `'shift start'` | a field note is not a rack note (Q-19) |
| 10 | `A_VA` | `T0+70` | `VA_PHASE_NOTE` | `rack` · `'S1:001'` | `'mechanical done on s1:001'` | a spoken name never matches (S-19) |
| 11 | `A_STEP` | `T0+90` | `STEP_STATE_CHANGE` | `step` · `'step_1'` | `'pending -> in_progress'`, `{ rack: RACK }` | `rack` is never a key |
| 12 | `A_TEXT` | `T0+95` | `RACK_NOTE` | `rack` · `OTHER` | `'see s1:001 too'` | text naming `RACK` stays `OTHER`'s |
| 13 | `A_LATE2` | `T0+500` | `RACK_NOTE` | `rack` · `RACK` | `'cage nut replaced'` | same ms as `A_LATE` → stored order |
| 14 | `A_UNDATED` | `'1750000000600'` (string) | `RACK_NOTE` | `rack` · `RACK` | `'string time'` | counted, not timed |
| 15 | `A_FOREIGN` | `T0+15` | `RACK_NOTE` | `rack` · `FOREIGN` | `'another deployment'`, `{ deploymentId: 'dep_1750000009999_zz99zz' }` | another deployment |
| 16–18 | — | — | `null`, `7`, `'RACK_NOTE'` | — | — | ignored, never an error |

**Worked count for `RACK`, line by line** (the D-1 lesson):

| Entry | `action === 'RACK_NOTE'` | `entityType === 'rack'` | `entityId === RACK` | object | finite `ts` | Result |
|---|---|---|---|---|---|---|
| `A_LATE` | ✓ | ✓ | ✓ | ✓ | ✓ | **event 1 of 4** |
| `A_ASSIGN` | ✗ | ✓ | ✓ | ✓ | ✓ | excluded |
| `A_OTHER` | ✓ | ✓ | ✗ | ✓ | ✓ | excluded |
| `A_BLK` | ✗ | ✗ | ✗ | ✓ | ✓ | excluded |
| `A_EARLY` | ✓ | ✓ | ✓ | ✓ | ✓ | **event 2 of 4** |
| `A_TEN` | ✓ | ✓ | ✗ | ✓ | ✓ | excluded |
| `A_PHASE` | ✗ | ✗ | ✗ | ✓ | ✓ | excluded |
| `A_TIE` | ✓ | ✓ | ✓ | ✓ | ✓ | **event 3 of 4** |
| `A_OMNI` | ✗ | ✗ | ✗ | ✓ | ✓ | excluded |
| `A_VA` | ✗ | ✓ | ✗ | ✓ | ✓ | excluded |
| `A_STEP` | ✗ | ✗ | ✗ | ✓ | ✓ | excluded |
| `A_TEXT` | ✓ | ✓ | ✗ | ✓ | ✓ | excluded |
| `A_LATE2` | ✓ | ✓ | ✓ | ✓ | ✓ | **event 4 of 4** |
| `A_UNDATED` | ✓ | ✓ | ✓ | ✓ | ✗ | **undated 1** |
| `A_FOREIGN` | ✓ | ✓ | ✗ | ✓ | ✓ | excluded |
| `null`, `7`, `'RACK_NOTE'` | — | — | — | ✗ | — | skipped |

→ **notes row: `{ adapter: 'notes', status: 'ok', events: 4, detail: '1 note(s) have no usable time — counted, not on the timeline' }`**. For `OTHER`: `A_OTHER` and `A_TEXT` → `events: 2`, no detail. For `TEN`: `A_TEN` → 1. For `FOREIGN`: `A_FOREIGN` → 1. For `''`: `empty`.

**The full `RACK` timeline under `seedWithNotes()` — 3 phase + 4 blocker + 4 note = 11 events:**

| # | `t` | Event | Why here |
|---|---|---|---|
| 1 | `T0+20` | `note.logged` `A_EARLY` (`actor: 'System'`) | earliest |
| 2 | `T0+50` | `blocker.opened` `B_CLOSED` | |
| 3 | `T0+100` | `phase.completed` power | |
| 4 | `T0+200` | `blocker.opened` `B_OPEN` | `A_BLK` at the same ms is not emitted |
| 5 | `T0+300` | `phase.completed` mechanical | registry order 1, emitted first (seqOrder) |
| 6 | `T0+300` | `phase.completed` compute | order 1, emitted third |
| 7 | `T0+300` | `blocker.opened` `B_TIE` | order 2 |
| 8 | `T0+300` | `note.logged` `A_TIE` (`actor: 'LEAD-B'`) | order 3 — last of the tie |
| 9 | `T0+400` | `blocker.cleared` `B_CLOSED` | |
| 10 | `T0+500` | `note.logged` `A_LATE` | stored index 0 |
| 11 | `T0+500` | `note.logged` `A_LATE2` | stored index 12 |

`status` stays `{ phase: { index: 2, of: 5, name: 'network' }, openBlockers: 3, photoCount: null, photoBytes: null }`. Coverage: `identity ok 0` · `phases ok 3` · `blockers ok 4 + UNDATED_DETAIL(1)` · `notes ok 4 + the note detail`.

**Helper:** `const noteEvents = (rec) => rec.timeline.filter((e) => e.source === 'notes');`

**Tests to add:**
1. **NOTES · TIMELINE.** `seedWithNotes`; the timeline equals the 11 rows above. Payloads are exactly `{ auditId, text, actor }`, verbatim (`'System'`, `'LEAD-B'`). Every `t` is numeric. `status` is unchanged, and `Object.keys(rec.status)` still equals `['phase', 'openBlockers', 'photoCount', 'photoBytes']` (Q-22).
2. **NOTES · SCOPING.** The `RACK` notes row is as above. `noteEvents(OTHER)` equals `[A_OTHER, A_TEXT]`, with row `{ ok, 2 }` and no detail. `noteEvents(TEN)` equals `[A_TEN]`. `FOREIGN` → `[A_FOREIGN]`. `''` → `{ notes, empty, 0 }`.
3. **NOTES · EMPTY.** Four stores each read `{ adapter: 'notes', status: 'empty', events: 0 }`, with no note events and the other rows unchanged:
   - key absent;
   - `''`;
   - `'[]'`;
   - a store of every non-matching row above, 2–4, 6–7, 9–12, 15–18: other racks' notes plus this rack's non-note entries.
4. **NOTES · ERROR** (under `seedWithNotes`). `'{not json'`, `'{}'` (detail exactly `'audit store is not an array'`), and `getItem` throwing for this key only (the Ship 1 technique) each give `error` with a non-empty detail and no note events. Identity, phases and blockers rows are unchanged, `openBlockers` is still `3`, and the timeline length is `7`.
5. **NOTES · PURE READ.** A malformed audit key.
   - **Precondition first:** the notes row reads `error`, as Ship 2's test does. Without it the test passes vacuously on `.593`, where no adapter reads the key.
   - Then every localStorage key and value is identical before and after `assemble()`, and no toast is added.
   - This catches a regression to `deploy_loadAllAudit` / `deploy_loadAuditFor`: the quarantine, and the crash-log write.
6. **NOTES · UNDATED.** A store of:
   - `ts` as a string, `ts` missing, `ts: null` (undated × 3);
   - `id` missing, with `ts` `T0+800`;
   - `summary` missing, with `ts` `T0+810`;
   - `actor` missing, with `ts` `T0+820`;
   - `null`, `7`, `'x'`.

   → note events: 3, with `auditId: null`, `text: null`, `actor: null` respectively. Row `{ ok, 3, detail: '3 note(s) …' }`. Every `t` is numeric.
7. **NOTES · TRUNCATION** (Q-23 A). `HEAD = aud('audit_head', T0+5, 'OMNI_NOTE', 'deployment', 'dep_old', 's', { deploymentId: 'dep_old', chainReset: true, truncatedCount: 1, truncatedAt: T0+6, truncatedLastHash: 'h0' })`.
   - `[HEAD, A_EARLY]` → `ok 1`, with the reset detail.
   - `[HEAD]` → **`empty` with the reset detail**.
   - A restore-shaped head (`chainReset: true`, `truncatedAt`, no `truncatedCount`) plus `A_EARLY` → the same detail.
   - `[A_EARLY]` → `{ ok, 1 }` with **no** `detail` key.
   - The detail **equals** the proposed reset string exactly (E-7c), so a wording that prints `truncatedCount` goes red.
   - Both an undated note and `HEAD` present → the undated text, then the reset text, joined with `'; '`.
8. **GAPS.** Names equal `['identity', 'phases', 'blockers', 'notes']`. Coverage names equal the registry. `gaps` is unchanged.
9. **READOUT · notes.** `?rrdev=1` + `seedWithNotes`. `#rr-dev-cov` has exactly the text `'identity ok (0) · phases ok (3) · blockers ok (4) — ' + UNDATED_DETAIL(1) + ' · notes ok (4) — 1 note(s) have no usable time — counted, not on the timeline'`. The JSON's `note.logged` texts are `['rail kit missing', 'IN PROGRESS', 'cage nut short', 'cage nut replaced']`. No hard errors.

**RED expected on `.593`:** all nine new tests and the four edited assertions below fail because the `notes` row and `note.logged` events are missing, and for no other reason. Every other Ship 1/2 test passes unchanged.

**Existing assertions that change once a fourth adapter registers** (the base seeds have no audit key → `notes empty`):

| Line | Today | Becomes |
|---|---|---|
| `:175-179` RECORD | three coverage rows | + `{ adapter: 'notes', status: 'empty', events: 0 }` — ⛔ **breaks** otherwise |
| `:343-344` FOLD | `…, ['blockers', 'empty', 0]]` | + `['notes', 'empty', 0]` — ⛔ **breaks** otherwise. Add: the notes row still runs after the fault |
| `:544` GAPS | `['identity', 'phases', 'blockers']` | + `'notes'` — ⛔ **breaks** otherwise |
| `:597` READOUT · blocker store | exact `toHaveText('identity ok (0) · phases ok (3) · blockers ok (4) — ' + UNDATED_DETAIL(1))` | + `' · notes empty'` — ⛔ **breaks** otherwise |
| `:571-576` READOUT · picked rack | `toContainText` checks | still passes; add `toContainText('notes empty')` |
| `:1-33`, `:150` | header, `'Ships 1–2'` | comment/title update only |
| `:218`, `:294` | `coverage[1]` | **unchanged** (index 1 is still `phases`) |
| every `cov(rec, name)` lookup, every Ship 1/2 timeline equality, `:503` `toBe(3)` | — | **unchanged**: no audit key in `seed()` / `seedWithBlockers()`, and none is written at boot. **(probe)** `phantom_deploy_audit_v1` was `null` after booting the spec-65-shaped seed |

**Mutation checks to run after GREEN** (each must be caught by the named test, then reverted):

| # | Mutation | Must go red |
|---|---|---|
| M1 | drop the `action` test (`entityType` + `entityId` only) | TIMELINE (admits `A_ASSIGN`), EMPTY (store 4 reads `ok`) |
| M2 | also match `e.rack === rackId` | TIMELINE (admits `A_BLK`) |
| M3 | `String(e.entityId).indexOf(rackId) === 0` | SCOPING (`OTHER` claims `A_TEN`) |
| M4 | read through `deploy_loadAllAudit()` | ERROR, PURE READ |
| M5 | `t: Number(e.ts)`, or no finite check | UNDATED (a string-`t` or `NaN` event), TIMELINE (`A_UNDATED` lands on it) |
| M6 | a rack with no notes returns `ok` with 0 events | EMPTY |
| M7 | `RR_ADAPTER_NOTES` declared below `var PHANTOM_RR` | every assembling test (E-8b trap) |
| M8 | drop the reset detail | TRUNCATION |
| M9 | revert the fold to `ok`-only details (`:31762` as today) | TRUNCATION (`[HEAD]` case) |
| M10 | `actor: identity_getUser()` instead of verbatim | TIMELINE (`'System'`, `'LEAD-B'`) |
| M11 | register `notes` before `blockers` | TIMELINE (tie at `T0+300`) |
| M12 | print `truncatedCount` in the detail | TRUNCATION |

**Regression, each spec alone on `laptop-chromium`:**
- `64-report-engine-characterization` — **8/8**. This is handoff acceptance #3: Ship 3 must not move `deploy_generateReport`.
- `65`.
- `27-rack-capabilities-in-build` — the `Log note` door.
- `12-blockers`, `13-phase-model`, `00-boot`, `63-handoff-readiness-gate`.
- `04-storage` — baseline 20 passed, 1 skipped.
- `98-cmd-census` and `01-nav` — compare each against its own `.593` baseline on the same project, as Ship 2 did: each carries one pre-existing viewport failure on `laptop-chromium`.

---

## Interpretations — each is the owner's to strike (this document's own numbering)

- **I-1 What counts as a note.** A note is an audit entry with `action === 'RACK_NOTE'`, `entityType === 'rack'` and `entityId === rackId`, all three. `rack` and `summary` are never match keys.
- **I-2 Matching.** Whole-string equality on `entityId`. `deploymentId` is neither compared nor parsed out of the composite, which is unique by construction (`:27779`).
- **I-3 No rack.** A `rackId` that is not a non-empty string reads `empty` (Ship 2 D-3).
- **I-4 Text is verbatim.** `text` is `summary` as stored, including chip labels that name a state. The adapter never interprets note text.
- **I-5 Actor is verbatim.** `actor` is carried as stored, including `'System'` and a Build-Lead fallback (Contract 9a; Q-25).
- **I-6 Time.** `t` is `ts` only when it is a finite number, Ship 1's rule for `signedOffAt`. A `ts` of `0` would pass; no writer produces one.
- **I-7 No id.** An entry with no string `id` is still a note, with `auditId: null`. Nothing needs pairing.
- **I-8 Absent values.** They are `null`, not omitted (Ship 2 D-6).
- **I-9 Ignored fields.** `siteId` is ignored. `siteProfileId`, `masterId`, `hashV`, `stepId`, `evidence`, `hash` and `prevHash` are not emitted: none is needed to count or order notes, and each can be added later by ruling.
- **I-10 Non-objects.** Array members that are not objects are skipped, never an `error`.
- **I-11 Detail only when needed.** The notes row carries `detail` only when there is something to say. Other rows keep their exact shape.
- **I-12 Purge.** A purged rack reads `empty` like one that never had notes. No marker exists to tell them apart (E-2g).

---

## Q · Rulings owed before Ship 3 builds (numbered on from Q-17)

✅ **RULED 2026-09-17 — Q-18 … Q-27 AS RECOMMENDED** (`OWNER-RULINGS.md`). Every **Recommendation** cell below is now law for Ship 3. The owner was asked what *"next"* meant against this table and chose *"Build it as recommended"*.

| # | Question | Evidence | Options | Recommendation | Blocks |
|---|---|---|---|---|---|
| **Q-18** | **Scope: which audit entries are "notes" for a rack?** | E-2c, E-5 | **(A)** `RACK_NOTE` only. **(B)** A, plus phase happened-ats (`PHASE_STARTED/BLOCKED/UNBLOCKED/ADVANCED`, `GATE_OVERRIDE`, `PHASE_REVERIFY_FLAGGED`) resolved by constructed phase ids (`'phase_' + rackId + '_' + type` over `DEPLOY_PHASE_TYPES`) and emitted as `phase.*` events. **(C)** every entry with any rack channel | **(A).** It is what the handoff names and counts. It is the only action whose rack is a field and whose moment no other adapter owns. It cannot double-count `phase.completed` or `blocker.opened`, and it keeps Ship 3 one visible change. B is a later ruling and ship; C double-counts by construction | the adapter filter; E-10; E-9 |
| **Q-19** | **Deployment *FIELD NOTES* (Command `LOG` → `OMNI_NOTE`) in a rack's Record?** | E-3b | exclude · attach to every rack of the deployment · a `gaps` entry | **Exclude.** The note names no rack; copying it onto every rack fabricates attribution (Contract 10). The look tells John not to use `LOG` for this check | E-9 set-up |
| **Q-20** | **Checklist item notes `phase.notes{itemId}`, in Ship 3?** | E-6; refresh §2 | out · phases adapter as a fact · notes adapter | **Out of Ship 3 and A.2.** Wrong class, undocumented in the census (automatic FAIL), no time, often a value not a note. A census row comes first if it is ever wanted | Ship 3 scope |
| **Q-21** | **Event name and payload** | E-7b; toast `'Note logged to '` `:57460`; prompt `'Log Note to '` | `note.logged` · `note.added` · `rack.note`; payload `{ auditId, text, actor }` | **`note.logged`** — the app's own verb for this action — **with `{ auditId, text, actor }`**, values verbatim | spec expectations |
| **Q-22** | **"Note count": a new rr-1 status field?** | E-7d; handoff §3 *"build exactly this"* | no field; the count is the notes row's `events` (plus the undated count in `detail`) · add `status.noteCount` | **No field.** The readout already prints `notes ok (N)`. A new key changes a shape the handoff fixed, and no renderer needs it before A.3 | the assembler diff; E-9 PASS line; E-10 test 1 |
| **Q-23** | **How are truncation and restore markers surfaced?** | E-2f; `:31761-31762` | **(A)** a notes-row `detail` when any entry has `chainReset === true`, and the fold passes `detail` on `empty` rows too (one line). **(B)** detail on `ok` rows only; an `empty` rack in a truncated log says nothing. **(C)** a `gaps` entry — but only adapters read storage (P1), and the contract has no way for an adapter to return a gap | **(A)**, with wording that never states a loss count (L-7). An empty result from a lossy log is the case P3 exists for | the fold line; E-10 test 7; M8, M9 |
| **Q-24** | **Verify or emit the hash chain?** | E-2h | no · verify per assembly · emit `hash`/`prevHash` | **No, in A.2.** Verification is device-wide, not a pure read, needs sha256, and is already wrong after a purge (L-8). HISTORY shows the chain | nothing beyond the adapter |
| **Q-25** | **Actor fallback (`dep.buildLead`, `'System'`) vs Contract 9a** | E-2i (probe: `LEAD-B`) | carry verbatim and report the writer · substitute the current operator · drop the actor | **Carry verbatim.** The adapter cannot detect the fallback, and substituting would fabricate. The writer question (L-9) is the owner's to schedule outside A.2 (handoff §8). The look sets the operator first | E-9 set-up |
| **Q-26** | **Which surface does the look compare against?** | E-4 | HISTORY `RACK_NOTE` rows in a one-rack deployment · NERVE *RECENT ACTIVITY* · shift report *Field Notes* · handoff event count | **HISTORY, one-rack deployment.** Record that NERVE shows a text-matched subset, that *Field Notes* counts only `OMNI_NOTE`, and that the HISTORY header counts every action: none of these is a FAIL. The name clash between *Field Notes* and rack notes goes to A.3 with Q-16 | E-9 PASS lines |
| **Q-27** | **Other rack-attributable notes: issue `note_added`, discrepancy notes, VA notes** | E-1a N-3, N-10, N-12 | out of A.2 · census, then a later adapter · fold into Ship 3 | **Out of A.2.** Issue notes have a composite and a time but **no census row** (S-13). Discrepancy and VA notes never carry the composite. Whether the Record should hold them is an A.3 question, and a census pass comes first | confirms Q-18 A |

---

## STOP list (P2 — do not design around these)

**S-7** checklist item notes · **S-8** `phase._notes` · **S-9** `blockerNote` / `desc` · **S-10** rack `notes` · **S-11** discrepancy notes · **S-12** handoff `notes` · **S-13** issue `note_added` (not in census) · **S-14** chip store · **S-15** audit-walk notes · **S-16** Ghost Echo text · **S-17** optic-ledger notes · **S-18** the audit `id` format, `delta`, rack names inside `summary`, the deployment inside the composite, `hash`/`prevHash`, `truncatedCount` as a count · **S-19** VA spoken-name `entityId` · **S-20** crash log. Details in E-1b.

## Stop conditions — Ship 3 is unsafe to write as specified if any of these holds

1. **Q-18 is unruled.** The filter cannot be written.
2. **Q-23 is unruled.** Either an `empty` read of a lossy log stays silent, or the fold changes without a ruling.
3. **The adapter reads through `deploy_loadAllAudit`, `deploy_loadAuditFor` or `deploy_verifyAuditChain`.** Each is a quarantine write, and the second also writes a crash-log entry.
4. **The adapter reads any key other than `phantom_deploy_audit_v1`,** or any STOP field.
5. **The filter matches on `e.rack`, on `summary` text, on a prefix, or on a parse of the composite.**
6. **`RR_ADAPTER_NOTES` is declared below `var PHANTOM_RR`.**
7. **Any Ship 3 event comes from `BLOCKER_OPENED` or `PHASE_*`,** or any note event can reach the `openBlockers` or phase derivation.
8. **Any Ship 3 edit touches a fenced surface:** `stripeRack_logNote`, `deploy_logAudit`, `deploy_purgeAudit`, the FIFO block, the chain functions, the LOG sheet, HISTORY, the NERVE card, the shift report, the handoff generator or `deploy_generateReport`. Storage writers and renderers are fenced (handoff §8), and the defects in L-7…L-14 are reported here, not fixed.
9. **The look compares the readout with NERVE, the shift report's *Field Notes*, the handoff's event count, or the HISTORY header.** Each gives a guaranteed false FAIL.
10. **rr-1 `status` gains a key without a ruling** (Q-22).

---

## Leads — found, not worked (findings notes are leads, not tasking)

- **L-7 `truncatedCount` does not accumulate.** A steady-state eviction always writes `1` on the new head (`:31130`). **(probe)** `1, 1, 1`. The "tamper-evident truncation marker" therefore understates any real loss, and HISTORY's banner `CHAIN VERIFIED — N sealed · N truncation(s) recorded` (`:43042`) counts markers, not evictions. A restore writes `chainReset` and `truncatedAt` with no count (`:56975`), on every non-empty restore.
- **L-8 A purge breaks chain verification for everyone else.** `deploy_purgeAudit` (`:31141`; called from delete `:42769` and close-out `:44092`) writes no `chainReset`. `deploy_verifyAuditChain` then reports a break at the first surviving entry written after the purged ones. **(probe)** `{ok: true}` → `{ok: false, brokenAt: 1}`. HISTORY for any other deployment would then show `CHAIN BROKEN at entry N — audit log may have been altered` (`:43044`) after an ordinary delete or close-out: a false tamper alarm.
- **L-9 The Build Lead is credited when no operator is set.** `deploy_logAudit`'s actor chain `identity_getUser() || dep.buildLead || 'System'` (`:31092`) does this. **(probe)** `"actor":"LEAD-B"`. `deploy_advancePhase`'s `signedOffBy` (`:32657-32658`) and the discrepancy `loggedBy` / `resolvedBy` (`:34056`, `:34416`) do the same. Contract 9a says every Event Log entry credits the **actor**. A.1 census prerequisite 6 calls this chain 9a-compliant.
- **L-10 Note-save failures are silent.** `stripeRack_logNote`'s `'Failed to log note'` branch (`:57461-57462`, `:57450`) cannot run: `deploy_logAudit` swallows all errors and ignores `deploy_saveAllAudit`'s `false`. A failed write still toasts `Note logged to …` (Contract 14). A quota failure also shows `safeStore`'s own toast; a non-quota failure shows only the success toast. On a malformed log, `safeGet` quarantines, returns `[]`, and the next note replaces the whole log with one entry. The old bytes survive only in the quarantine.
- **L-11 Rack notes reach no report as text.** The comment at `:42653` (*"the note lands in the same audit trail the Handoff report reads"*) holds only for the storage: `handoff_generate` shows no note text (it only counts, `shiftEventCount`). The shift report's *Field Notes* are `OMNI_NOTE` only (`:18470`), and `RACK_NOTE` has no label in HISTORY's `actionLabels` (`:43069-43086`), so it prints as a raw key.
- **L-12 NERVE's activity filter is a text substring.** *RECENT ACTIVITY* filters with `e.summary.indexOf(rackName) !== -1` (`:57153`). A note that does not type the rack's name never appears. Any rack whose display name is a substring of another's (`R-1` / `R-10`) also claims that rack's entries.
- **L-13 A misreadable sentence in the census refresh.** Refresh §4 says *"The two rack-named note writers are `RACK_NOTE`"* next to *"exactly two pass `meta.rack`"*. The two `meta.rack` passers are `BLOCKER_OPENED` (`:26064`) and the dead `STEP_STATE_CHANGE` (`:31603`). `RACK_NOTE` stores `rack: ''` **(probe)**. The two sentences read as one claim, and it is not one.
- **L-14 VA notes can land on the wrong deployment and never map to a rack.** Voice-to-audit writes to `deploys[0]` of an **unsorted** active/paused list (`:27909-27911`), which may not be the rack's deployment, with a spoken, uppercased `entityId` that matches no composite. `discLog_writeAudit` passes a `'disc-' + Date.now()` pseudo id as the `entityId`, and as the `deploymentId` when none is set (`:34091-34092`), so those entries never point at the record, and restore drops them as orphans.
- **L-15 Census corrections outside Tier A.**
  - A.1 §7 documents discrepancy `resolution: { resolvedBy, resolvedAt, resolutionText }`; the code writes `{ resolvedAt, resolvedBy, note }` (`:34419-34422`), and the reconcile path writes `resolution: ''` (`:54290`, `:54555`).
  - A.1 §14 documents handoff `rollup: { racksTotal, racksBlocked }`; the code writes `phaseProgress: { racksComplete, racksTotal, racksBlocked }` (`:31378`).
  - The in-file schema comment `:25257` lists an audit `delta` that nothing writes.
  - `phantom_deploy_issues_v1` has no census section at all, although it carries composite-keyed, timestamped rack notes (`:26427`, `:26457`, `:26887`).
- **L-16 Spec 64's fixture shape is not the live one.** Its `RACK_NOTE` has `rack: RACK` (`64-…spec.js:76-77`), which no live writer produces. It is harmless to spec 64, and it is a trap for anyone copying it into spec 65.

(Build's dead worklist `Evidence` door, E-3c, is already recorded in `test/FIXTURE-SHAPES.md:392-393` and is not a new lead.)

---

## Bounds

**Source reading.**
- **Product:** `dct-ios.html` at `.593`.
- **Tests:** specs `65`, `64` (fixture block), `27`; `test/e2e/fixtures.js` (`boot`); `test/playwright.config.js`; `test/FIXTURE-SHAPES.md` (search only).
- **Docs:** the handoff; both census documents; the A.2 recon; `docs/FIELD-REPORT-PHASE0-EVIDENCE.md` §3; both Ship 1 evidence documents and both Ship 2 ones; `OWNER-RULINGS.md` (2026-09-14 … 2026-09-17, including the Ship 3 Chromium ruling the parent session entered during this recon); `CLAUDE.md`.

**Reachability claims** (*"no caller"*, *"no writer"*, *"24 call sites"*) are text searches of the single file. Dynamic dispatch could defeat them. The Build door is itself dispatched through `window[t[1]]` (`:22484`), and it was found because the name appears as a string.

**One Chromium probe, and nothing else executed.**
- **What ran:** a throwaway node script in the session scratchpad (`ship3p0/probe.js`), driving `@playwright/test`'s **Chromium** from `test/node_modules`, 390×844, in a fresh context. It ran against a read-only static server (`ship3p0/server.js`) serving the repo root on `127.0.0.1:4431`, which was stopped afterwards. The seed was spec-65-shaped (two racks, an active deployment, operator `E2E`, Build Lead `LEAD-B`).
- **What it proved:**
  - `body.rd` is on, and no audit key exists after boot.
  - Build's six actions render uppercase at 54 px; the rack detail's `LOG NOTE` is 44 px, and its `onclick` passes the composite.
  - The prompt's title, subtitle, 12 chips and buttons are as quoted above; the toast reads `Note logged to s1:001`.
  - The stored `RACK_NOTE` entry is as shown in E-2b. A chip hold writes its label and closes the prompt; a chip tap writes nothing.
  - NERVE showed 1 of 3 notes; HISTORY printed `RACK_NOTE` rows under `· 3 events`.
  - `deploy_loadAuditFor` quarantines a malformed key and writes the crash log on an empty id.
  - A purge breaks chain verification; `truncatedCount` stays `1`; an unset operator yields `actor: "LEAD-B"`.
- **Noise:** the only console errors were CORS refusals of the API probe from the `http://127.0.0.1` origin — environmental, and unrelated.

**What the probe is not.** It is not WebKit, not iOS Safari, and not a Playwright spec run. **No `npx playwright test` was run.** No device storage was inspected, and no adapter, spec or product line was written.

**Not reviewed** by `storage-archaeologist`, `adapter-reviewer` or `data-honesty-auditor`: none of them can be dispatched from a Claude Code session (refresh §0). The rulings in the Q table are the owner's.

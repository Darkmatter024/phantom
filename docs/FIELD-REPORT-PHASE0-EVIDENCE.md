# FIELD REPORT — PHASE 0 (assembler recon; read-only, nothing authorised to build)

**Written:** 2026-09-13 · **Mode:** EVIDENCE ONLY. No source edited, no adapter written, no version bump, no new file but this one.
**Question asked:** what already exists in the repo that the Field Report will need — data sources, where evidence lives, and what the report has to contain per the plan doc.
**Builds on:** `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md` (A.1 storage census) and `docs/A2-ASSEMBLER-RECON.md` (A.2, 2026-09-10, read at `.587`). This document re-tests both against `.589` and maps them onto the report.

---

## 0 · ANCHOR BASELINE — read this before following any line number

Every `:line` below was read against `dct-ios.html` on **`main` at `v1.14.589`, 60,582 lines** (`:12879` `PHANTOM_APP_VERSION`), which is `VERIFIED` = `release` = served.

⛔ **`docs/A2-ASSEMBLER-RECON.md`'s OWN ANCHOR NOTE IS NOW WRONG IN THE OPPOSITE DIRECTION, AND IT IS THE FIRST THING A READER WILL TRUST.** It says every anchor above ~`:21,400` is **40 lines LOWER on `main`**. That was true of `main` at `.586`. Three ships later the drift is **positive and region-dependent** — up to **+267**. A reader following that note in the photo region lands 300 lines away from the code it describes.

Measured, by verbatim string, A.2's cite → this baseline:

| Region | A.2 cite (`.587` branch) | `main` `.589` | Drift |
|---|---|---|---|
| blockers store | `:25899` | `:25905` | **+6** |
| audit entry | `:31048` | `:31055` | **+7** |
| rack/phase seed | `:32180` | `:32186` | **+6** |
| discrepancy capture | `:33522` | `:33528` | **+6** |
| Rack Manager `genId` | `:50378` | `:50384` | **+6** |
| reconcile / `_rec_norm` | `:53567` | `:53714` | **+147** |
| photo store | `:56977` | `:57244` | **+267** |

⭐ The `+147` and `+267` steps are `.588`/`.589` insertions (nav recovery, update coordination, image input). **There is no single offset. Re-anchor by verbatim string, per region, every time.**

---

## 1 · What the report has to contain — and where each field comes from today

⚠ **The plan doc is not in the repo.** `PHANTOM-INTELLIGENCE-CORE.md` lives only at `C:\Users\Darkm\Downloads\PHANTOM-INTELLIGENCE-CORE.md` — **14,749 bytes, `sha256 4ec40e5efcf12c2c…`, dated 2026-08-27**. Its §4 (`:86-94`) is the Field Report specification and its §3 (`:49-82`) is the record schema. This is the same failure class `CLAUDE.md` records for `SHIP-TECH-FLOW-V2` and the LEGACY-RETIRE ruling — *a document no session can see is not a programme of record*. ⛔ **It is also deliberate:** the doc's own line 2 says *"This is JOHN'S document — Claude Code never receives it whole."* **Reported, not resolved:** the import decision is the owner's, and the two rules point opposite ways.

§4 structure, mapped to source:

| Report element (plan §4) | Source at `.589` | Verdict |
|---|---|---|
| Report ID `FR-<site>-<rack>-<yyyymmdd-hhmm>` | no precedent; nearest is `prefix + '-' + dateStr` `:43336`, `:44079` | ⛔ **does not exist** |
| Prepared-by | `PHANTOM_SITE.currentOperator()` `:34851` | ✅ — and **STRICT, no coalesce to `siteLead`** `:34843` |
| Site / facility header | `SITE_PROFILE_DEFAULTS` `:27967`; `facilityId`/`facilityName` `:27968-27969` | ✅ (precedent `:18552`) |
| Rack identity | ⛔ **two live ids, no resolver** — §2 below | ⛔ **blocked** |
| OPEN BLOCKERS count, flagged red | `PHANTOM_BLOCKERS` `:25905`, `create` `:25922` | ✅ |
| Rack status (derived) | phases `:32199-32211` | ⚠ `tasksTotal`/`tasksDone` are literal `0` `:32207-32208`, never updated |
| WORK SUMMARY (John's words verbatim or omitted) | no field exists | ⛔ **does not exist** |
| **Unified timeline** (the differentiator) | audit `:31044`, blockers `:25931`/`:25944`, phases `signedOffAt` `:32259`, photos `:57246` | ⚠ **partly — see §3** |
| Per-class sections, `NONE RECORDED` when empty | `listHtml(items, emptyMsg)` `:42549`; `'No optic data'` `:42556`; `'NO DATA'` `:23018` | ✅ pattern exists, string is not standardised |
| Photo evidence: full-size, caption, phase-at-capture, timestamp | `photo_getAllForRack` `:57296` | ⚠ caption always `''` `:57247`; **no phase field**; `w:0,h:0` `:57249` |
| Projected file size (flag > 8 MB) | `bytes: blob.size` `:57248`, already summed `:57341` | ✅ |
| **Coverage footer** (`UNREADABLE — REPORT INCOMPLETE`) | `phantom_backupCoverage()` `:55512` | ⭐ **prior art exists — §4** |
| Provenance line | `:18670` *"Generated from local deployment data · No external sources"* | ✅ |
| Composer: photo scope from gallery multi-select | `photo_galleryOpen` `:57315`; `cell.onclick` opens the viewer `:57355` | ⛔ **no multi-select; it is Tier C.1, two tiers AFTER A.3** |

---

## 2 · The join key still does not exist at `.589` — but the picture is better than A.2 stated

A.2's §0 finding **reproduces exactly**. `deploy_seedRacksAndPhases` `:32176` writes both identifiers two lines apart:

```
:32186   var rackId = 'rack_' + deployment.id + '_' + idx;   // synthetic composite
:32188     id: rackId,                                        // ← composite
:32190     rackId: sr.name || ('Rack-' + (idx + 1)),          // ← the HUMAN name
```

⭐ **Traced to its origin, which A.2 did not state:** `srcRacks` is `deployment.edpParsed.racks` `:32177-32178` — the **vendor EDP parse**, not the Master. So the Master's `s1:001` form is never in scope at seed time and **no Master linkage is persisted at all**. That is why no resolver exists: there was never a moment where both forms were in hand.

⭐ **AND THREE OF THE FOUR TIER-A ADAPTERS ALREADY AGREE WITH EACH OTHER.** A.2 says *"no value exists today that returns the same rack from every adapter"* — true across **all** consumers, but the A.2 adapter set is narrower than that:

| A.2 adapter | Keys on | Evidence |
|---|---|---|
| phases | **composite** | `:32203`, and `phase.id` embeds it `:32201` |
| blockers | **composite** | `_blockerModal.rackId = ctx.rack.id` `:25626`, `:25635` → `blocker_save` `:25993` → `create({rack: rackId…})` `:26009` → `:25927` |
| photos | **composite** | `photo_handleCapture(this, c.dep.id, c.rack.id)` `:22470` → `:57245` |
| notes / audit | ⛔ **inconsistent** | §3 |

**So the composite is already the de-facto join key for three of four.** The divergent forms (Master colon, discrepancy human-uppercase `:53890`/`:54156`, Rack Manager base36 `:50384`) belong to classes that are **Tier B or outside the record entirely**. That narrows the ruling John is being asked for: it is not *"invent an identity"*, it is *"is the composite the canonical rack key, and what bridges it to the Master."* ⚠ Still an owner ruling. **This recon does not propose the design.**

⛔ **The shipped `siteId` bug reproduces — and it is SELF-CONSISTENT, which A.2 did not say and which changes how it can be fixed.**

```
:57244   siteId: rackId.split(':')[0] || 'unknown',
```
The caller passes the composite `:22470`, which has no colon, so `siteId` becomes the whole rack key. **But `photo_getCountForRack` `:57277` and `photo_getAllForRack` `:57296` recompute the identical split**, so reads and writes agree and photos are retrievable per rack today. ⚠ **The consequence: correcting the derivation without a migration orphans every existing photo** — the `byRack` compound index `:57269` would range-query a `siteId` no stored record carries. That is a Contract B11 hazard (*user data is preserved*), and it means the photo fix is not the one-liner it reads as.

⚠ `_rec_norm` `:53714` is the nearest normalizer and A.2 is right that it cannot bridge a colon form to a composite — it matches **name to name**, vendor EDP against the frozen Master snapshot `:53742`, `:53753`. ⭐ Worth knowing anyway: its own comment `:53735` already names *"rack-id-convention divergence"* as a thing that must surface rather than silently zero. The codebase has met this problem before and chose visibility.

---

## 3 · The timeline spine — the audit log is deployment-scoped, not rack-scoped

A.2 calls audit *"the best timeline spine available"*. Confirmed in shape: `ts: Date.now()` `:31057`, append-only, hash-chained `:31074`. ⛔ **But it cannot be filtered to a rack today, and the reason is countable.**

`deploy_logAudit` has a structured rack slot — `rack: meta.rack || ''` `:31067`. **Of 24 call sites, exactly two pass it:** `:26019` (BLOCKER_OPENED) and `:31514` (STEP_STATE_CHANGE). The other 22 write `''`.

⛔ **`PHASE_ADVANCED` — the single most important rack event in the report — puts the rack name only inside free-text `summary`:**
```
:32298   deploy_logAudit(deployId, actionMap[newStatus] || 'PHASE_ADVANCED', 'phase', phaseId,
:32299     (DEPLOY_PHASE_LABELS_FULL[phaseType] || phaseType) + ': ' + oldStatus + ' → ' + newStatus + ' (' + rackDisplayName + ')');
```

**Two ways to scope audit to a rack, and each collides with a locked rule:**
1. Join `entityId` (a `phaseId`) against `phantom_deploy_phases_v1` → ⛔ the adapter contract forbids it: `.claude/agents/adapter-reviewer.md` — *"SCOPE. One adapter per data class; fail cross-class reads."*
2. Parse the composite out of the phase id, which embeds it by construction `:32201` (`phase_<composite>_<type>`) → contract-legal, but an undocumented structural dependency on a synthetic id format.

⚠ **The plan's §3 registry models adapters as independent** (`read(siteId, rackId)`, *"a fold over registered adapters"*, `:80`). The notes adapter is not independent. That is an architecture question for the ruling, not a coding detail.

⛔ **A.2's severe finding reproduces verbatim:** the entry writes `entityType` `:31060` / `entityId` `:31061` while the A.1 census documents `resource`/`resourceId`. **Those names read `undefined` at `.589`.** An adapter written to the census and reviewed against the census passes review and returns empty forever.

⛔ **Two spine hazards A.2 did not quantify:**
- **FIFO cap 2,000 entries** `:31079`, with `chainReset` / `truncatedCount` / `truncatedAt` markers `:31084-31087`. A report generated after truncation is silently short unless those markers reach the coverage footer. Under P3 that is not optional.
- **`deploy_purgeAudit` `:31094` deletes every audit record for a deployment.** The spine is erasable wholesale.
- ⚠ `actor` falls back: `identity_getUser() || dep.buildLead || 'System'` `:31047`. An event credited to `'System'` on a provenance line is a Contract 9a question — the Event Log is supposed to credit the actor.

⛔ **The timestamp hazard is live.** The broken pseudo-ISO reproduces at `:33528` and `:33536`:
`new Date().toISOString().slice(0,16).replace('T',' · ') + 'Z'` — looks like ISO, `Date.parse` returns `NaN`, sorts to one end of any merge. Master `savedAt` is true ISO `:34495`; everything else in scope is epoch ms. **A.2's rule holds: normalize per FIELD, never per class.**

---

## 4 · ⭐ THE BIGGEST FINDING: the assembler is not greenfield, and neither is the renderer

**`deploy_generateReport(deploymentId)` `:43230` is already an assembler with the plan's exact P1 shape — one assembly, many renderings.** It folds five sources and emits a normalized structure:

```
:43234-43238   racks · phases · optics · audit (sorted by ts) · rollup
:43241-43257   per-rack phase summary, signedOffAt reduced to the latest
:43300-43311   summary block (racksTotal, openBlockers, auditEventCount …)
:43318-43327   auditTrail: { ts, time, actor, action, entityType, summary }
```

⭐ `:43320` emits **`time: new Date(e.ts).toISOString()` beside the epoch `ts`** — the dual-format discipline §3 asks for, already shipping.

**Three renderers already consume it:** `deploy_exportReportJSON` `:43332`, `deploy_exportReportHTML` `:43342`, and `closeOut_doExport` `:44064` (`:44071`). Reachable from four buttons: `:38222-38223`, `:43180-43181`, `:43186-43187`.

⛔ **Contract A2 — *one canonical engine per concept* — applies directly.** A Field Report assembler built beside this one is a second assembler. What it lacks against the plan is specific and short: it is **deployment-scoped not rack-scoped**, it has **no coverage manifest**, **no photos**, and **no adapter registry**.

**Four self-contained HTML-document generators already ship**, all white-document, print-CSS, `escHtml`-disciplined:

| Generator | Line | Print CSS | Delivery |
|---|---|---|---|
| `shiftReport_generate` | `:18429` | `:18514` `@page letter` | `win.document.write` |
| `deploy_generateRackQR` | `:27904` | `:27931` | new window |
| `handoff_exportHTML` | `:42542` | — | **Blob `:42597` → `window.open` `:42599` → `triggerDownload` fallback → revoke @30s `:42606`** |
| `deploy_exportReportHTML` | `:43342` | `:43449` page-break rules | Blob `:43507` → window `:43509` → revoke `:43517` |

⭐ Plus one in-app timeline renderer that is not a document: `deploy_showAuditLog` `:42610` (`innerHTML` `:42637`) already renders the audit trail as a browsable view.

⭐ **`handoff_exportHTML` `:42542` is the closest prior art to the Field Report renderer** and `shiftReport_generate` `:18429` is the closest prior art to its *content* — it already prints meta block, KPI row, phase breakdown, optics ledger, floor validation, open blockers, field notes, key events. ⚠ It has **one caller**, a suggestion chip `:14012`, and it **reads raw storage directly** — which is exactly what P1 forbids of a renderer.

⭐ **Open question 1 in the plan (`:161`, marked ⛔ blocking A.3) is partly answered by shipped code:** print-to-PDF from a generated HTML window is not a hope, it is four existing buttons labelled `PRINT REPORT`. The recipient question stays John's; the mechanism is proven.

---

## 5 · Coverage honesty (P3) — prior art exists and it is better than the plan's sketch

⭐ **`phantom_backupCoverage()` `:55512` already implements P3's doctrine**, and its comment `:55503-55509` states the principle the plan's P3 wants: a hand-authored registry *"has the same failure mode as the hand-written export it replaced: it is correct until someone adds a key"*, so **coverage is enumerated from live storage and anything unaccounted for is reported rather than silently dropped.**

⭐ **`PHANTOM_BACKUP_EXTRA_KEYS` `:55438` is a maintained, per-key, reason-annotated registry** — plus `PHANTOM_BACKUP_NAMED_KEYS` `:55494` and `PHANTOM_BACKUP_EXCLUDED_KEYS` `:55499` with a written rationale for every exclusion `:55481-55493`. Its stated rule `:55436`: *"a key that exists is in the backup unless it has a row here saying why not."*

⛔ **This bears directly on the census refresh owed at `PHANTOM_CURRENT_STATE.md` §9 item 3.** A.2 §4 lists **13 storage keys with zero A.1 census coverage**. **Twelve of those 13 are already enumerated and justified in shipped source** at `:55542-55558` — `phantom_power_topo_v1`, `phantom_audit_walk_v1`, `phantom_drift_ledger_v1`, `phantom_rack_recent_v1`, `phantom_reconcile_v1`, `phantom_preflight_v1`, `phantom_scan_collection`, `phantom_optic_score_history`, `phantom_audit_index_v1`, `phantom_compass_last`, `phantom_rack_viewer_last`, `phantom_checklist_site_v1`. Only `ge_last_rack` is absent from both. **The refresh has a machine-checkable starting point it has not been using.**

⭐ **`.584` BACKUP HONESTY already litigated P3's hardest case** — comment `:55552-55573`: a failed IndexedDB read must not serialise as *"a clean, empty store"*, and `navigator.share()`'s promise must be consulted because a dismissed sheet is not a success. That is exactly `status:"error"` vs `status:"empty"`, and `report-fidelity-auditor.md` repeats it (*"share completed ≠ share sheet opened"*). **Pinned by `test/e2e/51-backup-honesty.spec.js`.**

⛔ **The report-issued log (plan §6, `:112`) does not exist** — zero hits for any `phantom_report*` / `REPORT_KEY` / `reportIssued` key. **And it cannot be added silently:** a new persist key not added to `:55438` is flagged at runtime by `phantom_backupCoverage()` `:55512`, and under the rule at `:55436` that is a defect by construction. The plan's §6 says *"registered in the persist-key census"* for the mission object but says nothing about this for the report log.

---

## 6 · Delivery, embedding, and the size budget

**Share-sheet precedents, two shapes, one of them stale:**
- ⭐ `downloadJSON` `:55779` — the post-`.584` honest shape. `new File([blob], …)` `:55785`, `canShare({files})` `:55791`, and it **returns an outcome**: `downloaded` `:55788`, `shared` `:55793`, `cancelled` `:55795`, `failed` `:55799`. This is the shape the report must copy.
- ⚠ `downloadCSV` `:47955` is the **pre-`.584` shape** — `.catch()` swallows `:47963`, no outcome, a dismissed sheet falls silently through to a download. (Out of scope → Q.)

⚠ **No shipped path shares a `text/html` File.** `:47960` shares `text/csv`, `:55785` shares `application/json`; both HTML generators use `window.open` + download instead. **Whether iOS Safari's share sheet accepts a `text/html` File is unverified** — a genuine hardware question under ship discipline 4, not something automation can settle.

**Base64 embedding:**
- ⭐ `va_blobToBase64` `:51314` — shipped, returns raw base64 with the `data:` prefix stripped. The report needs the prefix kept; the encoder is the same.
- ⛔ **No mime field is stored on a photo record** `:57243-57252`. MIME is implicit in `canvas.toBlob(…, 'image/jpeg', …)`. A `data:` URI needs it stated.
- ⭐ **`.589` shipped `va_imageDims` `:57177`, which returns real `w`/`h` — and `photo_persist` still writes `w: 0, h: 0` `:57249`.** A working dimension reader now exists that the photo record does not use. (Contract A2 says the second one should not be built.)

⛔ **The 8 MB flag has a measured reference point `.589` produced.** `PHANTOM_API_MAX_BODY` is 300,000 and base64 inflates 4/3; measured, the app's own 1280/0.70 default produced **271,259 bytes from a 3000×2000 JPEG** (`version.json` notes; `VA_IMAGE_BUDGET_BYTES` `:57173`, ladder `:57174`). **At that size roughly 30 photos reaches 8 MB.** Projected size is computable before generation from `bytes` `:57248`, already summed at `:57341`.

⚠ **There is still no metadata-without-blob read path** — `photo_getAllForRack` `:57296` pushes whole records `:57308`; `photo_getCountForRack` `:57277` walks a cursor rather than `.count()`. A.2's mitigation holds (an IDB `Blob` is a lazy handle until `createObjectURL`), so *"evidence refs, blobs later"* works — by reading full records and discarding `blob` in the adapter.

⚠ `navigator.storage.estimate()` is already wired `:56023`, `:56072` — the §6 budget readout has a source.

---

## 7 · Gates this work must pass, and one that is mis-stated

The REVIEW MATRIX in `CLAUDE.md` binds:

| Touching | Required |
|---|---|
| assembler / adapter / registry | `adapter-reviewer` — **census must exist first** |
| any Record renderer (report, composer, gallery, coverage display) | `report-fidelity-auditor` · `data-honesty-auditor` |
| storage shape questions, before any adapter | `storage-archaeologist` census covering that class |

✅ **All three exist and are loadable from this CWD** — `.claude/agents/adapter-reviewer.md`, `report-fidelity-auditor.md`, `storage-archaeologist.md`, all dated 2026-08-28. ⚠ **This contradicts `CLAUDE.md`'s standing note that spec §10's subagents *"are not loadable from this session's CWD and have never once run."*** That note is about the four ship-discipline agents (`lockstep-auditor`, `surgical-edit-reviewer`, `data-honesty-auditor`, `cold-aisle-qa`) — three of which are also present in that directory. **The campaign agents are a different set and they are available.**

⛔ **`adapter-reviewer.md` makes the census refresh a hard prerequisite, not a nicety:** *"every field the adapter reads exists in the archaeologist's report for that class. A field read that the census never documented is an assumed anchor — automatic FAIL."* With the A.1 census wrong on `entityType`/`entityId` (§3), **the notes adapter would PASS review while reading `undefined`.** That is the `.579`-class failure — a gate that is green for the wrong reason.

**Test coverage that already pins report-adjacent behaviour:** `11-event-log.spec.js`, `12-blockers.spec.js`, `13-phase-model.spec.js`, `51-backup-honesty.spec.js`, `52-restore-honesty.spec.js`. ⚠ **There is no photo spec and no report spec** — `photo_persist` and all six HTML generators are unpinned.

---

## 8 · Sequencing consequences (evidence, not proposal)

1. ⛔ **The rack-identity ruling still gates everything** — `PHANTOM_CURRENT_STATE.md` §9 item 2. §2 narrows what is being asked but does not answer it.
2. ⛔ **The census refresh is a hard gate on adapters, not a nicety** — §7. §5 shows it has an unused machine-checkable starting point.
3. ⛔ **The composer's photo scope (plan §4, `:92`) depends on gallery multi-select, which is Tier C.1 — two tiers after A.3.** The plan sequences A.3 ahead of its own stated input.
4. ⛔ **A.2's scope note now cuts both ways:** *"A.2's first ship cannot be assembler core + four adapters."* §4 adds the other half — **an assembler already exists**, so the first ship is also not greenfield. Whether A.2 extends `deploy_generateReport` `:43230` or supersedes it is a Contract A2 question and an owner call.
5. ⚠ **The report needs two fields nothing writes:** a report ID and a WORK SUMMARY. Both are new storage, and §5 shows new storage has a registry obligation at `:55438`.

---

## 9 · Bounds

Source reading only, on `main` at `.589`, plus `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md`, `docs/A2-ASSEMBLER-RECON.md`, the three campaign agent definitions, and `PHANTOM-INTELLIGENCE-CORE.md` in `Downloads`. **Nothing was executed, no storage was inspected on a device, no adapter was written, and no design is proposed.** Every line cite was re-anchored by verbatim string against this baseline. Per the gate rules, the field report opens **HELD**.

---

## Q · Found, not worked (Hard Stop Rule — one line each, leads not tasking)

- `downloadCSV` `:47955` never got the `.584` share-outcome fix that `downloadJSON` `:55779` did — a dismissed sheet still silently falls through to a download.
- `escHtml` `:17552` returns `''` for `0` and `false` (`if (!str) return ''`) — an honest zero renders as blank in any surface that wraps a number in it.
- `photo_persist` `:57249` writes `w:0,h:0` while `va_imageDims` `:57177`, shipped in `.589`, returns the real values.
- `photo_getCountForRack` `:57277` walks a full cursor where `IDBIndex.count()` would do.
- Dead photo DB `phantom-photos` `:33361` still in the file beside the live `phantom-attachments` `:57263`.
- `:59292` passes `e.type || 'unknown'` as `entityType` to `deploy_logAudit` — a scan type in an entity-type slot, outside the documented value set.
- `shiftReport_generate` `:18429` has exactly one caller `:14012` and reads raw storage — a renderer that P1 would forbid.
- `test/e2e/54-pose-frame-starvation.spec.js` is referenced by `PHANTOM_CURRENT_STATE.md` but exists only on the parked branch, not on `main`.
- `PHANTOM-INTELLIGENCE-CORE.md` is outside version control; importing it collides with its own line 2. Owner's call.

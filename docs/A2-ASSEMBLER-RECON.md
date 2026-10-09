# A.2 — ASSEMBLER RECON (read-only; nothing authorised to build)

**Written:** 2026-09-10 · **Mode:** EVIDENCE ONLY. No source edited, no adapter written, no version bump.

> ⚠ **ANCHOR BASELINE — READ THIS BEFORE FOLLOWING A LINE NUMBER.**
> Every `:line` below was read against `dct-ios.html` at **v1.14.587, 60,315 lines — the working tree of branch `rack-pose-determinism`**, not `main`. That branch carries the pose-determinism fix, which adds 48 lines inside the forge3d region around `:21360-21420`.
> **On `main` at `.586`, every anchor below roughly `:21,400` is 40 lines LOWER.** Measured, not assumed: `var rackId = 'rack_' + deployment.id` is `:32180` on the branch and `:32140` on main; `siteId: rackId.split` is `:56977` on the branch and `:56937` on main. Anchors above the forge3d region are identical on both.
> The offset disappears the moment that branch merges. Until then: **verbatim strings are the truth, line numbers are hints** — re-anchor by string before editing anything.
**Question asked:** what a Rack Record needs to pull together, which data classes already have a shape it can read, and where the gaps are.
**Builds on:** `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md` (the A.1 storage census). This document does **not** re-deliver that census — it tests it against today's code and maps it onto the record.

---

## 0 · The finding that decides the sequence

> **The assembler's join key does not exist. One rack carries two live identifiers, written by the same function, on the same record — and nothing joins them.**

`deploy_seedRacksAndPhases` writes both, two lines apart:

```
:32180   var rackId = 'rack_' + deployment.id + '_' + idx;   // synthetic composite
:32183   id:     rackId                                       // ← composite
:32184   rackId: sr.name || ('Rack-' + (idx + 1))             // ← the HUMAN name
```

So a rack record's **`id`** is `rack_dep_1757…_0` and its **`rackId`** is `R-01`. Downstream features then pick whichever they happened to reach for:

| Consumer | Keys on | Evidence |
|---|---|---|
| Phases | the **composite** (`rackId:` field holds it) | `:32195`, `:32197` |
| Photos | the **composite** (`c.rack.id`) | `:22448` → `:56975` |
| Discrepancy log (typed) | human, uppercased | `:33656` |
| Discrepancy log (reconcile) | **lowercase Master colon form**, same array | `:53743`, `:54009` |
| Audit log | `entityId` composite **or** spoken text, plus a third slot `meta.rack` | `:27740`, `:27890`, `:31061` |
| Master | `s1:001` lowercase colon | `:34395`, persisted `:34489` |
| Rack Manager | base36 `genId()` | `:50378`, `:50462` |

**This is not a normalization inconvenience; it is the thing the assembler is for.** `read(siteId, rackId)` is the adapter contract's whole signature. Today there is no value that can be passed to all adapters and return the same rack's history from each. An in-memory normalizer exists — `_rec_norm`, uppercase and strip non-alphanumerics, `:53567` — but it is **never persisted**, so it cannot reconcile a colon form against a composite anyway.

⛔ **Consequence for sequencing:** A.2's first ship cannot be "assembler core + four adapters" as scoped. A rack-identity resolver has to exist first, or the four adapters will each be individually correct and collectively unable to describe one rack. **This is the single most valuable output of this recon.**

**And it is already producing a wrong value in shipped code.** `photo_persist` derives the site from a colon split:

```
:56977   siteId: rackId.split(':')[0] || 'unknown'
```

Its caller passes the composite (`:22448`), which contains **no colon**. So `siteId` is set to the entire rack key, and the `'unknown'` fallback is unreachable. Photo grouping by site is wrong today, silently. The `bySite` index (`:57001`) is built on that value.

---

## 1 · Class-by-class readiness for the four A.2 adapters

| Class | Verdict | What blocks it |
|---|---|---|
| **Blockers** | ✅ **ADAPTER-READY** | Nothing structural. Line cites stale ~55–60. |
| **Phases** | ⚠ DRIFTED | Undocumented `checks`/`notes`; a documented field with no writer; identity ambiguity above |
| **Identity** | ⚠ DRIFTED | Census documents 2 fields, code writes 10 |
| **Notes / audit** | ⛔ **DRIFTED SEVERELY** | Census field names read `undefined` today |
| **Photos** | ⚠ DRIFTED | Broken `siteId`; no metadata-only read path |

### 1a · Blockers — the one clean class

`phantom_blockers_v1` `:25899`. Every census-named writer exists: `loadAll` `:25901` · `saveAll` `:25905` · `create` `:25916` · `clear` `:25933` · `migrate` `:25951` · `blocker_save` `:25987`. `create()` `:25919-25927` writes **exactly** the documented shape, no undocumented field.

Two writers the census omits: `PHASE_STEPS.transition` auto-closes via `PHANTOM_BLOCKERS.clear(step.blockerId)` `:31491`, and bulk restore carries the key verbatim (`PHANTOM_BACKUP_EXTRA_KEYS`, `:55304`).

**Two real happened-at stamps** — `openedAt` `:25925` and `clearedAt` `:25938` — which is exactly what P6's event spine needs.
⚠ **One gap:** editing a blocker's description rewrites `desc` `:26020` and touches **no timestamp**. A re-note is therefore invisible to a timeline; the event will appear to have never changed.
⚠ Migrated records synthesize `openedAt: ph.blockedAt || ph.updatedAt || Date.now()` `:25966` — a **fallback to "now"**, so a migrated blocker can carry a fabricated open time. `.migrated:true` marks them, so an adapter can surface the provenance rather than assert it.

### 1b · Phases — drifted, with a name collision

Key intact `:25279`. All census writers present (line drift only). **Three writers the census omits:** `checklist_toggle` `:30440`, `checklist_setNote` `:30466`, `deploy_purgeHeavyData` `:42323`.

- **`checks: { itemId: true }` and `notes: { itemId: string }` are undocumented.** The header comment at `:30325` says they deliberately ride the phase record to avoid a new key.
- ⛔ **`notes` (object) collides by name with the census's documented `_notes` (string, `:32324`).** Two different fields, one name apart by an underscore, in the class an adapter reads first.
- ⛔ **`updatedAt` is documented but has NO WRITER.** It is only ever *read*, as a fallback at `:25966`. An adapter translating it faithfully would always find nothing. This is the census's "READ NEVER WRITTEN" state, undeclared.
- **`tasksTotal` / `tasksDone`** are written as literal `0` at seed `:32201-02` and never updated. The census's Oddity 4 claims the checklist writes them — **false**; the checklist writes `checks`/`notes`.

Timestamps are clean: epoch ms (`signedOffAt` `:32253`, `blockedAt` `:25998`), with ISO appearing only *inside* the `_notes` string `:32324`.

### 1c · Identity — drifted by omission

Keys intact (`IDENTITY_USER_KEY` `:25428`, `SITE_PROFILE_KEY` `:25282`). Writers present, one renamed: the census's `siteProfile_edit()` **does not exist**; today it is `siteProfile_saveFromEditor()` `:30882`.

Census documents `operator` / `buildLead`. Code also writes: **`siteLead`** `:27987` (sole writer `:30926`), `id`, `createdAt`, `activeMasterId`, `masterFile`, `masterBoundAt`, `rootMigratedAt` `:34905-07`, `:34964-65`, `:35020`, and `legacyOperatorDiverged` `:34986`.

⭐ The census also predates **`v1.14.538`, which deleted the siteLead seed** `:34996-35004`. That deletion is the same one whose stale test was re-pointed today (`92f6d37`). For the record: `tech.identity` is available, but **authority (`siteLead`) is legitimately absent on a migrated device** and the record must not infer it — `.418` already ruled that guessing here grants authority to whoever set the device up.

### 1d · Notes / audit — the census would mislead an adapter author

This is the most dangerous class, because the census is not merely incomplete here, it is **wrong in a way that fails silently**.

⛔ **The audit entry writes `entityType` / `entityId` `:31048-31063`. The census documents `resource` / `resourceId`.** Those names **read `undefined` today.** An adapter written to the census, reviewed against the census, would pass review and return empty events forever — honest emptiness that is actually blindness.

⛔ **The real log-note writer is absent from the census entirely:** `stripeRack_logNote` `:56883` → `deploy_logAudit(deployId,'RACK_NOTE','rack',rackId,note)` `:56914`, plus a chip-hold path `:56903`.

Undocumented fields written on every entry: `hashV`, `siteProfileId`, `masterId`, `rack`, `stepId`, `evidence` `:31058-31063`, plus a **hash chain** `prevHash` `:31067` / `hash` `:31068` and, on FIFO eviction, `chainReset` / `truncatedCount` / `truncatedAt` / `truncatedLastHash` `:31078-31081`. An adapter that re-emits audit events without understanding the chain could make a truncated log look continuous.

**Good news:** audit `ts: Date.now()` `:31051` is a reliable happened-at, append-only, never updated. **The audit log is the best timeline spine available** — if the rack-key problem in §0 is solved, since it carries *three* rack channels.

Crash log `ts` is an **ISO-8601 string**, not epoch ms `:18083`, `:18158`, `:48338`. Chips carry **no timestamp at all** and their real shape is `{added:[{id,label}], removed:[id], renamed:{id:label}}` `:17937`, `:17957-59`, not the census's `{id,label,selected}`.

### 1e · Photos — refs are achievable, cheaply is not

Live DB **`phantom-attachments`**, store `photos`, keyPath `id` `:56993-57000`; indexes `bySite` `:57001` and compound `byRack ['siteId','rackId']` `:57002`.
⚠ A **dead DB `phantom-photos`** is still in the file (`:33355-56`) with `photoStore_save` `:33381` and `photoStore_load` `:33405` at **zero callers**; only `photoStore_extractFromDiscrepancies` `:33357` is live.

Record `:56975-56984`: `id, siteId, rackId, capturedAt, caption:'', bytes, w:0, h:0, blob`.
- **No `phase` field.** §4 of the record spec wants "phase-at-capture" in the photo evidence section — **that data is not stored.** It could only be derived by correlating `capturedAt` against phase events, which is an inference, not a record.
- **No mime field**; MIME is implicit in `canvas.toBlob(…, 'image/jpeg', 0.70)` `:56960`.
- **`caption` is always `''`** — written empty, never updated by any path found.
- `bytes: blob.size` `:56981` **is** stored and already summed `:57074`, so **projected file size is achievable**. It can be `undefined` (`:56960` resolves with no null check).
- `capturedAt: Date.now()` `:56979` — clean epoch ms.

⛔ **There is no metadata-without-blob read path.** `photo_getAllForRack` `:57029` pushes whole records `:57041`; `photo_getCountForRack` `:57010` walks a full cursor rather than `.count()`; `photo_viewerOpen` uses `store.get` `:57116`. **Zero hits for `openKeyCursor` or `getAllKeys` in the entire file.** Mitigating (a platform fact, not a code fact): an IDB `Blob` returns as a lazy file-backed handle, so bytes are not materialized until `URL.createObjectURL` `:57089`, `:57139`. **So "evidence refs, blobs later" (P4/§3) is achievable — but only by reading full records and discarding `blob` in the adapter.** That satisfies the contract's letter; it is worth knowing it is not free.

---

## 2 · Timestamps — the merge hazard, with precedent

| Format | Where | Sortable? |
|---|---|---|
| epoch ms | audit `:31052`, blockers `:25925`, phases `:32253`, photos `:56979`, +8 more | ✅ |
| true ISO | Master `savedAt` `:34489`, job snapshot `stagedAt` `:36232`, `extractedAt` `:33366` | after parse |
| ⛔ **broken pseudo-ISO** | discrepancy `photoMeta.capturedAt` `:33522` **and** `:33530` | ❌ **never** |
| locale display string | handoff `shiftDate` `:31273` | ❌ |
| pre-formatted local | ZPL label / QR payload `:29978-81`, `:30013-15` | ❌ (leaves device) |

The broken one is `new Date().toISOString().slice(0,16).replace('T',' · ') + 'Z'` — it **looks** like ISO and will not survive `Date.parse`. Any photo event from the discrepancy path sorts to `NaN` and lands at one end of the timeline.

⭐ **This class of bug has already shipped once**, and the file says so at `:24179-81`: *"savedAt is an ISO STRING, so `Date.now() - ts` was NaN → 'MASTER · NaNd'"*. The string-vs-number confusion is the real hazard; there is **no** second-vs-millisecond writer anywhere (`/1000` and `*1000` occurrences are durations and lockouts only, `:27430`, `:27536`).

**Rule for every adapter: normalize per FIELD, never per class.** A sibling field being a number tells you nothing.

---

## 3 · Mapping the record schema to what exists

| Record field (schema `rr-1`) | Source available? | Note |
|---|---|---|
| `site.siteId` | ⛔ **broken in photos** | `:56977` colon-split of a colon-free value |
| `site.profile` | ✅ | site profile, richer than census documents |
| `rack.rackId` | ⛔ **ambiguous** | §0 — two live ids, no resolver |
| `rack.masterPresent` | ✅ | Master store |
| `tech.identity` | ✅ | operator; `siteLead` may be legitimately absent |
| `status.*` (derived) | ⚠ partly | phase derivable from `signedOffAt`; `tasksDone` is a permanent `0` |
| `timeline` | ⛔ **blocked** | needs §0 (key) and §2 (time) resolved first |
| `evidence.photoIds` | ✅ | ids + `bytes` present; full-record reads |
| `coverage` | ✅ | assembler-side; no storage dependency |

---

## 4 · Census health — it cannot yet be the adapter authority

The A.1 census is a genuinely good document: 17 classes against a brief of 11, a ranked hazard list, and an **adapter-prerequisites section corrected 2026-08-28 against v1.14.524 that openly retracts five earlier claims as false** — on the stated reasoning that a wrong instruction is more dangerous than a missing one. That instinct is right, and this section applies it again.

⚠ Its header baseline reads **`v1.14.xxx`** — a placeholder. The corrected section pins `.524`; the app is at `.587`.

**Thirteen storage keys have zero census coverage:** `phantom_power_topo_v1`, `phantom_audit_walk_v1`, `phantom_drift_ledger_v1`, `phantom_rack_recent_v1`, `phantom_reconcile_v1`, `phantom_preflight_v1`, `phantom_scan_collection`, `phantom_optic_score_history`, `phantom_audit_index_v1`, `phantom_compass_last`, `ge_last_rack`, `phantom_rack_viewer_last`, `phantom_checklist_site_v1`. `dct_racks_v1` and `phantom_rack_history` appear only inside a backup key list, never as classes.

**Three census claims that are false against `.587`:**
1. *"RM_KEY stores racks with `id` (e.g. `rack_deploy123_0`)"* — **false.** RM_KEY ids are base36 `genId()` `:50378`, `:50462`.
2. Discrepancy `rackId` described as human-entered/uppercased **only** — `:53743`, `:54009` write lowercase colon ids into the same array.
3. *"`phantom_freeze_v1` is never read back"* — it **is** read at `:19206`.

⛔ **The adapter-reviewer contract says a field an adapter reads that the census does not document is an automatic FAIL.** Under that rule, three of the four A.2 adapters cannot be written against this census today, and the notes adapter would *pass* review while reading `undefined`. **The census needs a refresh pass before it can gate adapters** — this document is not that refresh, it is the evidence that one is owed.

---

## 5 · What this recon does NOT say

- It does **not** propose a rack-identity design. That is a ruling, and it is the owner's.
- It does **not** rank the A.2 adapter order. The intelligence core's Tier A order stands until the owner changes it.
- It does **not** touch the open questions in that document, several of which block the renderer rather than the assembler.
- Nothing here is authorisation to build. Per the gate rules, A.2 opens HELD.

## 6 · Bounds

Source reading only, at `.587`, plus the A.1 census. **Nothing was executed, no storage was inspected on a device, and no adapter was written.** Every line cite is from the working tree at 60,315 lines; the class-level verification was performed by four independent read-only passes, and the rack-ID and timestamp tables are the union of those passes cross-checked against the census.

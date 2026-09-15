# A.1 CENSUS REFRESH — TIER A CLASSES ONLY (read-only; nothing authorised to build)

**Written:** 2026-09-14 · **Mode:** EVIDENCE ONLY. No source edited, no adapter written, no version bump.
**Baseline:** `dct-ios.html` on `main` at **`v1.14.590`**, 60,639 lines. ⛔ **`.590` is shipped but NOT stamped** — see `PHANTOM_CURRENT_STATE.md` header. Every `:line` below was read against that tree and re-anchored by verbatim string.
**Supersedes, for these five classes only:** the corresponding sections of `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md`. It does not replace that document.
**Why it exists:** `PHANTOM_CURRENT_STATE.md` §9 item 3 — *"Census refresh — owed regardless of how 2 is ruled."* `.claude/agents/adapter-reviewer.md` makes it a hard gate: *"A field read that the census never documented is an assumed anchor — automatic FAIL."*

---

## 0 · Scope, and what is deliberately NOT here

⭐ **Only the classes the A.2 adapters read: identity · phases · blockers · notes/audit · photos.** That is what gates A.2 and nothing more. The A.1 census covers 17 classes; re-censusing the other twelve would be building ahead of a ship that is not ruled on.

⛔ **THREE CAMPAIGN AGENTS THE REVIEW MATRIX NAMES ARE NOT LOADABLE IN THIS SESSION, AND A PRIOR NOTE OF MINE SAID OTHERWISE.** `.claude/agents/` in this repo holds `storage-archaeologist.md`, `adapter-reviewer.md` and `report-fidelity-auditor.md`, and `docs/HANDOFF-READINESS-PREDICATE-PHASE0-EVIDENCE.md` §7 concluded from their presence that they were available. **File existence is not loadability.** The agent types this session can actually dispatch are the **user-level** ones (`~/.claude/agents/`: `phantom-rd-reviewer`, `phantom-ship-gate`, `ship-verifier`); the repo-level campaign agents are not among them. CLAUDE.md's standing note is therefore right as written — *"Agents barred, equivalents run inline"* — and **this census is that inline equivalent.** ⚠ It has not been through `storage-archaeologist`, because it cannot be.

---

## 1 · IDENTITY

**Keys:** `SITE_PROFILE_KEY = 'phantom_site_profile_v1'` `:25296` · `IDENTITY_USER_KEY = 'phantom_current_user_v1'` `:25447` (legacy, migrated not abandoned).

| Role | Function | Line |
|---|---|---|
| defaults | `SITE_PROFILE_DEFAULTS` | `:27980` |
| read | `siteProfile_load()` | `:28058` |
| read | `siteProfile_isConfirmed()` | `:28080` |
| read | `identity_getUser()` | `:25465` |
| read | `PHANTOM_SITE.currentOperator()` / `.siteLead()` / `.masterBinding()` | `:34908` / `:34932` / `:34943` |
| **write** | `siteProfile_save(profile)` | `:28084` |
| **write** | `siteProfile_saveFromEditor()` | `:30901` |
| **write** | `PHANTOM_SITE.setCurrentOperator()` / `.bindMaster()` / `.migrate()` | `:34918` / `:34962` / `:35009` |

⛔ **The A.1 census documents two fields (`operator`, `buildLead`). The code writes twenty.** Declared in `SITE_PROFILE_DEFAULTS` `:27980-28012`: `facilityId` · `facilityName` · `platforms` · `standardOptics` · `rackNamingConvention` · `pduType` · `floorZones` · `buildLead` · `operator` · `confirmedAt` · `siteLead` · `id` · `createdAt` · `activeMasterId` · `masterFile` · `masterBoundAt` · `rootMigratedAt`. Written outside the defaults block: `lastUpdated` and `schemaVersion` by `siteProfile_save` `:28085-28086`, and **`legacyOperatorDiverged` by `PHANTOM_SITE.migrate()` `:35049`** — a field no default declares, so it appears only on migrated devices.

⚠ `:28013-28017` records a field **deliberately absent**: `activeDeploymentId`. The comment is explicit that copying it here would create a second writable source for "which deployment is active". **An adapter must not add it back**, and the two-resolver split that already exists (`nowtab_resolveDep` vs `deploy_getActiveId`) is the reason why.

⚠ The census's `siteProfile_edit()` **does not exist**; the editor writer is `siteProfile_saveFromEditor()` `:30901`.

**What an adapter must know:**
- ⛔ **`currentOperator` is STRICT — no coalesce to `siteLead`** `:34908`, and the comment above it records why (`.418`: guessing grants site authority to whoever set the device up). `siteLead` being empty is a legitimate state, not missing data.
- ⭐ **`confirmedAt` IS SYNTHESIZED AT READ TIME AND THAT IS NEW TO THIS CENSUS.** `siteProfile_load` `:28071` backfills `if (!stored.confirmedAt && stored.lastUpdated) stored.confirmedAt = stored.lastUpdated`. **An adapter treating `confirmedAt` as a real happened-at is reading a backfill** for any profile saved before the first-run gate existed. It is a flag, not a timestamp.
- `siteProfile_load` merges `DEFAULTS` over stored `:28073`, so **every field always appears present.** Absence is indistinguishable from default by reading the loaded object; only the raw stored value distinguishes them.

---

## 2 · PHASES

**Key:** `DEPLOY_PHASES_KEY = 'phantom_deploy_phases_v1'` `:25293`. Read `deploy_loadPhasesFor` `:30334`; write `deploy_saveAllPhases` `:30338` (also bumps `_deployRollupGen`, a cache generation counter).

**Seeded shape** — `deploy_seedRacksAndPhases` `:32233`, record `:32257-32270`:

`id` (`'phase_' + rackId + '_' + type`) · `deploymentId` · `rackId` · `type` · `seqOrder` · `status` · `tasksTotal` · `tasksDone` · `signedOffBy` · `signedOffAt` · `_gateOverride` · `_notes`

⭐ **`phase.id` EMBEDS THE COMPOSITE RACK ID** `:32258`. That is load-bearing: it is the only way an audit entry keyed on a `phaseId` can be resolved to a rack **without a cross-class read**, which the adapter contract forbids.

**Writers the A.1 census omits:** `checklist_toggle` `:30459` · `checklist_setNote` `:30485` · `deploy_purgeHeavyData` `:42386` · `blocker_save` `:26006` (writes `blockerId`, `blockerNote`, `blockedAt`).

**Undocumented fields:** `checks: { itemId: true }` and `notes: { itemId: string }`, both written by the checklist onto the phase record. ⛔ **`notes` (object) collides by name with the documented `_notes` (string, `:32269`)** — one underscore apart, in the class an adapter reads first.

⛔ **`updatedAt` is documented and has NO WRITER.** It is only ever read, as a fallback inside the blockers migration `:25986`. An adapter translating it faithfully finds nothing, forever.

⛔ **`tasksTotal` / `tasksDone` are written as literal `0` at seed `:32263-32264` and never updated.** The census's Oddity 4 says the checklist maintains them; it does not — the checklist writes `checks`/`notes`. Any "N of M tasks" derived from these is a fabricated zero.

---

## 3 · BLOCKERS — the one clean class, with two provenance traps

**Key** `:25918`, module `:25919`. `loadAll` `:25920` · `saveAll` `:25924` · `create` `:25935` · `clear` `:25952` · `migrate` `:25970`. Entry points `blocker_saveFromForm` `:25892` → `blocker_save` `:26006`.

**Record** (`create`, `:25939-25945`): `blockerId` · `rack` · `stepId` · `phaseId` · `deploymentId` · `desc` · `openedBy` · `openedAt` · `clearedBy` · `clearedAt`. `clear()` `:25952` sets `clearedBy` and `clearedAt`.

⭐ **`rack` carries the COMPOSITE**, not the human name — traced `ctx.rack.id` → `_blockerModal.rackId` → `blocker_save` → `create({rack: rackId})`. Same form as phases and photos.

**Two real happened-at stamps** — `openedAt` and `clearedAt` — which is exactly what P6's event spine needs.

⛔ **Two provenance traps in `migrate()` `:25970`, and both are handled honestly by the code — an adapter must not flatten them:**
- `openedAt: ph.blockedAt || ph.updatedAt || Date.now()` `:25986` — **a fallback to "now"**, so a migrated blocker can carry a fabricated open time. `migrated: true` marks it.
- `openedBy: 'Unknown (pre-v1.14.420)'` — the code **refuses to attribute** rather than crediting whoever holds the device. An adapter must carry that string through, not normalise it to an operator.

⚠ **One gap:** editing a blocker's description rewrites `desc` and touches **no timestamp**. A re-note is invisible to a timeline.

---

## 4 · NOTES / AUDIT — the class where the census is wrong, not merely thin

**Key** `DEPLOY_AUDIT_KEY = 'phantom_deploy_audit_v1'` `:25295`. `deploy_loadAllAudit` `:30975` · `deploy_loadAuditFor` `:30979` · `deploy_saveAllAudit` `:30983` · `deploy_logAudit` `:31057` · `deploy_purgeAudit` `:31109` · `_audit_hashEntry` `:31021` · `deploy_verifyAuditChain` `:31029`.

**Entry shape** (`:31068-31082`): `id` · `deploymentId` · `ts` · `actor` · `action` · **`entityType`** · **`entityId`** · `summary` · `hashV` · `siteProfileId` · `masterId` · `rack` · `stepId` · `evidence` · `prevHash` · `hash`.

⛔ **THE CENSUS DOCUMENTS `resource` / `resourceId`. THE CODE WRITES `entityType` / `entityId`.** Those census names read `undefined` at `.590`. **An adapter written to the census and reviewed against the census passes review and returns empty events forever** — honest-looking emptiness that is actually blindness. This is the single most dangerous line in the old census.

⛔ **The log is DEPLOYMENT-scoped, not rack-scoped, and the numbers say so.** `rack: meta.rack || ''` exists on every entry, but **of 24 `deploy_logAudit` call sites, exactly two pass `meta.rack`.** The other 22 write `''`. `PHASE_ADVANCED` — the most important rack event in any report — carries the rack name **only inside the free-text `summary`**. The two rack-named note writers are `RACK_NOTE` at `:57107` and `:57118`.

⛔ **The spine is lossy by design, and both mechanisms must reach a coverage manifest:**
- **FIFO cap at 2,000 entries**, with `chainReset` / `truncatedCount` / `truncatedAt` / `truncatedLastHash` written onto the new head. An adapter re-emitting events without these makes a truncated log look continuous.
- **`deploy_purgeAudit` `:31109` deletes every entry for a deployment.**

⚠ `actor` falls back `identity_getUser() || dep.buildLead || 'System'`. An event credited to `'System'` is a provenance statement, not a person — Contract 9a says the log credits the actor.

✅ `ts: Date.now()` is a reliable happened-at, append-only, never updated. **With the rack-key problem solved, this is still the best timeline spine available.**

---

## 5 · PHOTOS

**Live DB `phantom-attachments`**, store `photos`, keyPath `id`, opened by `photo_getDB` `:57317`. Indexes: `bySite` on `siteId`, `byRack` compound `['siteId','rackId']`. ⚠ **Dead DB `phantom-photos` `:33418` is still in the file.**

**Record** (`photo_persist` `:57294`, fields `:57299-57308`): `id` · `siteId` · `rackId` · `capturedAt` · `caption` · `bytes` · `w` · `h` · `blob`. Readers: `photo_getCountForRack` `:57334` · `photo_getAllForRack` `:57353` · `photo_deletePhoto` `:57513`.

⛔ **`siteId` IS DERIVED WRONG, AND IT IS SELF-CONSISTENT — which changes how it can ever be fixed.** `siteId: rackId.split(':')[0] || 'unknown'` `:57301`; the caller passes the composite, which has no colon, so `siteId` becomes the entire rack key and the `'unknown'` fallback is unreachable. **But both readers recompute the identical split**, so writes and reads agree and photos retrieve correctly per rack today. ⚠ **Correcting the derivation without a migration orphans every stored photo** against the `byRack` compound index — a Contract B11 hazard, not a one-liner.

**What an adapter must know:**
- **No `phase` field.** "Phase-at-capture" cannot be read; it could only be inferred by correlating `capturedAt` against phase events, which is an inference, not a record.
- **No mime field** — MIME is implicit in the `canvas.toBlob(…, 'image/jpeg', …)` that produced the blob.
- **`caption` is written `''` and never updated by any path**, though the viewer renders it when truthy. It will always be empty.
- **`w` and `h` are written `0` and never updated** — and `.589` shipped `va_imageDims`, which returns real dimensions and which `photo_persist` does not call.
- ✅ `bytes: blob.size` is real and already summed in the gallery, so **projected file size is achievable**.
- ⚠ **No metadata-without-blob read path exists** — `photo_getAllForRack` pushes whole records; there are zero uses of `openKeyCursor` or `getAllKeys` in the file. "Evidence refs, blobs later" works only by reading full records and discarding `blob` in the adapter.

---

## 6 · Corrections to `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md`

| # | Census says | Measured at `.590` |
|---|---|---|
| 1 | header baseline `v1.14.xxx` (placeholder); corrected section pins `.524` | ⛔ this refresh pins **`.590`** for the five classes above |
| 2 | audit entries carry `resource` / `resourceId` | ⛔ **`entityType` / `entityId`**; the census names read `undefined` |
| 3 | `RM_KEY` stores racks with ids like `rack_deploy123_0` | ⛔ false — Rack Manager ids are **base36 `genId()`** |
| 4 | discrepancy `rackId` is human-entered / uppercased only | ⛔ incomplete — the reconcile path writes **lowercase Master colon ids into the same array** |
| 5 | `phantom_freeze_v1` is never read back | ⛔ false — it **is** read |
| 6 | Oddity 4: the checklist maintains `tasksTotal`/`tasksDone` | ⛔ false — it writes `checks`/`notes`; those two stay `0` forever |
| 7 | identity writes `operator` / `buildLead` | ⛔ thin — **twenty** fields, listed in §1 |
| 8 | `siteProfile_edit()` is the editor writer | ⛔ renamed — `siteProfile_saveFromEditor()` `:30901` |

⭐ **THE THIRTEEN UNCOVERED KEYS HAVE A MACHINE-CHECKABLE SOURCE THE CENSUS NEVER USED.** `PHANTOM_BACKUP_EXTRA_KEYS` `:55495` is a maintained, per-key, reason-annotated registry, and **twelve of the thirteen keys A.2 flagged as having zero census coverage already appear in it with a written justification**; only `ge_last_rack` is in neither. Its companion `phantom_backupCoverage()` `:55569` enumerates **live storage** and reports anything unclassified, precisely because *"a registry that can only be verified by reading code has the same failure mode as the hand-written export it replaced."* **Any future census pass should start from that function's output, not from a hand-walk of the source.**

---

## 7 · Bounds

Source reading only, on `main` at `.590`, for **five classes**. ⛔ **Twelve other classes in the A.1 census are NOT refreshed and are not gated by this document** — an adapter for any of them still faces the original census. Nothing was executed, no storage was inspected on a device, no adapter was written, and no design is proposed. ⚠ **Not reviewed by `storage-archaeologist`** — §0 explains why it cannot be.

⛔ **This does not unblock A.2.** The rack-identity ruling is still owed (`PHANTOM_CURRENT_STATE.md` §9 item 2), and no version can ship until `.590` is adjudicated.

---

## Q · Found, not worked (Hard Stop Rule)

- `deploy_saveAllPhases` `:30338` bumps `_deployRollupGen` on every write — a cache generation an adapter must not assume it can ignore if it ever caches.
- The `phantom-photos` dead DB `:33418` still ships beside the live `phantom-attachments`.
- `va_imageDims` returns real `w`/`h` that `photo_persist` `:57299` does not use, while writing `0`.
- `identity_getUser()` still falls back to the legacy `phantom_current_user_v1` for unmigrated devices — a second identity source an adapter could read without noticing.
- `docs/HANDOFF-READINESS-PREDICATE-PHASE0-EVIDENCE.md` §7 asserts the campaign agents are loadable. **It is wrong and §0 above corrects it**; the doc itself is left as written history rather than edited after the fact.

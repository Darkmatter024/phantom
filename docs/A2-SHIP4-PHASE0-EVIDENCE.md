# A.2 SHIP 4 — PHASE 0 (photos adapter + readout removal; read-only, nothing authorised to build)

**Written:** 2026-10-15 · **Mode:** EVIDENCE ONLY. No product source edited, no adapter written, no spec written, no version bump.
**Status:** ⏳ **Q-28 … Q-38 are OWED.** Nothing below is authorised until the owner rules. The recommendation cells are recommendations, not law.
**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md` §1 item 4 — *"**photos** (IndexedDB refs only — blob IDs, never blob bytes)"*; §3 — *"`evidence.photoIds` are IndexedDB refs only. Blobs load at render time (A.3), never during assembly."*; §5 — *"Ship 4: photos adapter (refs + counts + bytes) **and removal of the dev readout in the same ship**"*; §6 — the readout is *"Removed entirely in Ship 4. A grep gate proves no `rrdev` remnant ships past this slice."*
**Baseline:** `main` @ `1313a07`, `dct-ios.html` at **`phantom-v1.14.594`** (`:12879` `const PHANTOM_APP_VERSION = 'phantom-v1.14.594';`), **61,040 lines**. `VERIFIED` line 1 reads `phantom-v1.14.593 VERIFIED`. Served, read 2026-10-15: staging `version.json` = `phantom-v1.14.594`, release `version.json` = `phantom-v1.14.593`. **`.594` is unadjudicated, so the guard refuses any `.595` bump regardless of these rulings.** Every `:line` below was read against that tree. **Verbatim strings are the truth; line numbers are hints.**
**Rulings in force:** `OWNER-RULINGS.md` 2026-09-17 (Q-10…Q-27, Q-A, *Ships 2–4 verified one at a time*, *Ship 4 probes `phone-webkit` first and comes back to the owner*) · 2026-09-15 (Q-1…Q-9) · 2026-09-14 (the composite is the rack key).
**Builds on:** `docs/A1-CENSUS-REFRESH-TIER-A.md` §5 (PHOTOS) · `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md` §8 · `docs/A2-ASSEMBLER-RECON.md` §1e · `docs/A2-SHIP3-PHASE0-EVIDENCE.md` (the template).
**Who wrote it, and on what:** a cloud Claude session, not the laptop's Claude Code. Its clone has no `core.hooksPath`, so `phantom-guard.js` did not run here — nothing here needed it: docs only. **Live-behaviour evidence:** two throwaway **Chromium** probes (Chromium 141 under Playwright 1.56.1, Linux). Every probe result is marked **(probe)**. ⛔ **WebKit could not be run here either** — the egress policy refuses `cdn.playwright.dev`, so the WebKit build cannot be downloaded. Neither machine that has worked on A.2 can run WebKit.

---

## 0 · What decides Ship 4

1. ⛔ **THE OBVIOUS PURE READ WOULD BREAK THE PHOTO BUTTON FOREVER, ON EVERY PHONE THAT HAS NEVER TAKEN A PHOTO.**
   - Nothing creates `phantom-attachments` until a technician taps PHOTO. A fresh boot has **no** IndexedDB database at all **(probe P1: `[]`)**.
   - A read-only, version-less `indexedDB.open('phantom-attachments')` — the pattern the backup uses for `GhostEchoDB` (`:56095`) — **creates** that database, empty, at version 1 **(probe P2: `{"version":1,"stores":[]}`)**.
   - The app's own opener asks for version 1 too (`photo_getDB` `:57721`, `indexedDB.open('phantom-attachments', 1)`). The version already matches, so its `onupgradeneeded` (`:57722-57729`) **never fires again** and the `photos` store is never created.
   - From then on `photo_persist` and `photo_getCountForRack` both throw `NotFoundError: … One of the specified object stores was not found` **(probe P3)**. The PHOTO action counts first (`photo_captureForRack` `:57529`), so **the button itself fails**, not only the save.
   - Reusing `photo_getDB()` avoids that, but it is a **write**: it creates the database and its store and indexes. Handoff §4: *"Pure read. An adapter never writes."*
   - ✅ **The recipe that is both safe and pure:** open version-less, and in `onupgradeneeded` with `oldVersion === 0` call `e.target.transaction.abort()`. The open fails with `AbortError`, **no database is left behind**, and the app then saves normally **(probe P4: databases `[]` after the abort; the next `photo_persist` stored the record)**. The adapter reads that as **`empty`**. (**Q-28**)
2. ⛔ **THE ADAPTER CONTRACT IS SYNCHRONOUS AND INDEXEDDB IS NOT.** `PHANTOM_RR.assemble(rackId)` (`:31807`) returns the Record, and every `read()` returns `{ events, facts, status }` directly (handoff §4). Browsers have no synchronous IndexedDB API. **No photos adapter can meet the contract as written.** The fold has to await. (**Q-29**) ✅ **It costs nothing in product code:** `assemble` has exactly **one** in-app caller, the readout (`:31948`), which this slice deletes.
3. ⛔ **SHIP 4 AS WRITTEN DELETES THE ONLY SURFACE ITS OWN ADAPTER COULD BE CHECKED ON.** The readout is how the owner has verified every adapter (§6). Ship 4 lands the photos adapter and removes the readout in one version, so the photos adapter would ship with **no device look at all**. This is the adapter whose behaviour is most WebKit-specific of the four — the only one on IndexedDB, and the one whose first-open behaviour (item 1) is a hazard — and **no harness that has touched A.2 can run WebKit.** The phone is the only WebKit gate there is. (**Q-30**: split it)
4. ✅ **THE RACK KEY NEEDS NO TRANSLATION.** Build's only photo door passes `c.rack.id` (`:22502`), the ruled composite, and the record stores it verbatim in `rackId` (`:57703`) **(probe P4: `rackId: "rack_dep_x_0"`)**. Whole-string equality on `rackId` finds the app's records and keeps `rack_<dep>_1` apart from `rack_<dep>_10` **(probe P5: `[300,100]` for `_1`, not the `_10` record)**. ⛔ The `byRack` index is keyed on `['siteId','rackId']`, and `siteId` is the known colon-split defect (`:57702`; census refresh §5). Using the index would bake that defect into the adapter. (**Q-31**)
5. ⚠ **A DELETED PHOTO LEAVES NO TRACE.** `photo_deletePhoto` (`:57914`) is a hard `store.delete`. No audit entry, no tombstone, no localStorage key **(probe P7: no new key, audit log unchanged, record gone)**. A deleted photo is indistinguishable from one never taken, so the adapter cannot say one was removed. (**Q-36**)
6. ⛔ **FOUND ON THE WAY, OUTSIDE A.2, LIVE IN THE PROMOTED APP: THE BACKUP BREAKS GHOST ECHO ON A PHONE THAT HAS NEVER USED IT.** Item 1's trap is already armed in shipped code, against a different database. `exportAllData` opens `GhostEchoDB` version-less (`:56095`). Ghost Echo's own `initDB` opens it at `DB_VERSION = 1` (`:52359`, `:52370`) and creates its `ghosts` store only in `onupgradeneeded`. On a fresh device, a first **BACKUP** leaves `GhostEchoDB@1` with **no stores**, and Ghost Echo's next transaction throws `NotFoundError` **(probe P8)**. The control order — Ghost Echo first — creates `["ghosts"]` normally **(probe P9)**. **Lead L-1. Reported, not worked, not A.2 work.**

---

## E-1 · EVERY PHOTO-BEARING STORE IN THE FILE

Found by searching `dct-ios.html` for `photo`, `Photo`, `PHOTO`, `attachments`, `indexedDB.open`, `evidence`, and every `photo_*` call site. CSS rules, photoreal-icon art, the optic `photodetector` reference strings and the rack-plate texture comments are not stores and are omitted.

| # | Store · key · shape | Writer(s) | Rack-key form | Happened-at | Census row | Verdict for Ship 4 |
|---|---|---|---|---|---|---|
| **PH-1** | **IndexedDB `phantom-attachments`, store `photos`, keyPath `id`** · indexes `bySite` (`siteId`), `byRack` (`['siteId','rackId']`) `:57722-57729` | `photo_persist` `:57695` (only writer); `photo_deletePhoto` `:57914` (only deleter) | **composite** in `rackId` | `capturedAt: Date.now()` `:57704` | refresh §5; A.1 §8 Store 1 | ✅ **the class** |
| PH-2 | IndexedDB `phantom-photos` (`PHOTO_DB_NAME` `:33820`, `PHOTO_STORE_NAME` `:33821`) | `photoStore_save` `:33846` — **zero callers** | — | — | A.1 §8 Store 2 (DEAD) | ⛔ never created by the app; reading it would create it (§0 item 1) |
| PH-3 | discrepancy `.photo`, base64 data URL **in localStorage** · `phantom_discrepancies_v1` | `discLog_save`; markup `ADD PHOTO` `:13347-13351` | typed/uppercased, or a lowercase Master colon id | `photoMeta.capturedAt` — a formatted string that does not survive `Date.parse` (A.2 recon §2) | A.1 §8 Store 3 | ⛔ discrepancy class, never the composite (**S-1**) |
| PH-4 | assistant image input | none — `VA` is in-memory and dies with the sheet (`.589` Phase 4 finding) | — | — | — | ⛔ nothing stored |
| PH-5 | phase-model step `evidence[]` `:31515`, `:31597` | `PHANTOM_PHASE_MODEL.transition(…, { evidence })` — **zero callers** of `.transition(` in the file | composite | `doneAt` | — | ⛔ unreachable; carries no photo id from any live path (**S-2**) |

⭐ **Only PH-1 is rack photo evidence.** One writer, one deleter, one database, created lazily by the first PHOTO tap.

---

## E-2 · THE RECORD AS WRITTEN — every field (`photo_persist` `:57700-57709`)

| Field | Written as | **(probe P4)** value | Adapter use |
|---|---|---|---|
| `id` | `'ph_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)` `:57699` | `ph_…` | ✅ the ref. ⛔ never parsed for a time (the base36 tail is a write-time clock, not a field) |
| `siteId` | `rackId.split(':')[0] \|\| 'unknown'` `:57702` | `"rack_dep_x_0"` — the whole composite | ⛔ the known defect (refresh §5). Never read (**Q-31**) |
| `rackId` | `rackId` verbatim | `"rack_dep_x_0"` | ✅ the match key, whole-string |
| `capturedAt` | `Date.now()` `:57704` | `number` | ✅ the happened-at |
| `caption` | `''` | `""` | ⛔ no writer ever sets it (the viewer renders it only when truthy, `:57869`) |
| `bytes` | `blob.size` | `2048` | ✅ the size. ⚠ A.1 oddity 7 (`toBlob` → `undefined`) is closed for new captures since `photo_encodeImage` rejects a null blob (`:57600`), but older records may still carry `bytes: undefined` (**Q-35**) |
| `w`, `h` | `0`, `0` | `0`, `0` | ⛔ never measured, never updated. `va_imageDims` exists and is not called here (**Q-33**) |
| `blob` | the JPEG `Blob` | `Blob` | ⛔ never placed in the Record (handoff §3). `getAll` returns the handle; nothing reads its bytes |
| *(deployId)* | accepted by `photo_persist(deployId, …)` and **discarded** | — | the composite already names the deployment; nothing to derive (as Ship 3 I-2) |

⚠ **`getAll()` returns records in key order, and the key is random.** `[300, 100]` came back for two `_1` records stored in the order 100, 300 **(probe P5)**. The adapter sorts by `capturedAt`; the fold's merge-sort already does.

---

## E-3 · EVERY PATH THAT CREATES, SHOWS OR DELETES A RACK PHOTO

| Path | Where | Reachable | Notes |
|---|---|---|---|
| Build → contextual action **Photo** | `:22479` → `photo_captureForRack(_d, _r)` `:57528` | ✅ `body.rd`, only when a deployment and a rack are resolved (`:22474`) | Counts first (`:57529`). `0` → clicks `#photo-capture-input`; `>0` → opens the gallery |
| hidden file input | `:22496-22503`, `accept='image/*'`, `capture='environment'` | ✅ | `onchange` → `photo_handleCapture(this, c.dep.id, c.rack.id)` → `photo_compress` (1280 / 0.70 JPEG) → `photo_persist` → toast `PHOTO SAVED · Rack <composite>` |
| gallery `+` cell | `:57808` | ✅ | the same input |
| gallery | `photo_galleryOpen` `:57773` | ✅ | ⭐ **the comparison surface:** title `'PHOTOS · ' + rackId + ' · ' + photos.length + ' · ' + totalMB + ' MB'` `:57801`, where `totalMB = (Σ (p.bytes \|\| 0) / 1024 / 1024).toFixed(1)` — a missing size silently counts as 0 |
| viewer | `photo_viewerOpen` `:57828` | ✅ | date and time from `capturedAt`; `DELETE` → `CONFIRM?` (2 s) → `photo_deletePhoto` `:57887-57904` |
| factory reset | `:30844-30850` | ✅ | deletes every IndexedDB database, photos included |

⛔ **No other surface shows a photo count or size.** The Build action is labelled `Photo` with no count. The gallery title is the only device-side truth to compare a readout against.

⚠ **Rack photos are not in the backup** (`exportAllData` `:56031`; the manifest `:56107-56145` names no `phantom-attachments` row), so a restore neither brings them back nor removes them. Survivors re-attach by composite when their deployment is restored. **Lead L-2.**

---

## E-4 · THE ASYNC QUESTION — what has to change, and what it costs (→ Q-29)

**What is synchronous today:**
- handoff §4: `read(siteId, rackId) → { events[], facts{}, status }`;
- `PHANTOM_RR.assemble` `:31807`: a `forEach` fold, `try { res = ad.read(siteId, rackId); }` `:31811`, and a synchronous `return { schema: 'rr-1', … }` `:31869`.

**Who calls `assemble`:** `grep -n "PHANTOM_RR" dct-ios.html` → the definition `:31802`, `window.PHANTOM_RR` `:31884`, and **one call**, the readout `:31948`. In tests, spec 65's `assemble` helper is the only caller. **After the readout is deleted, `PHANTOM_RR.assemble` has zero in-app callers until A.3**, which is async regardless (*"Blobs load at render time (A.3)"*).

**Options:**

| | Shape | Verdict |
|---|---|---|
| **A** | `assemble` returns a `Promise<Record>`. The fold runs adapters **sequentially in registry order** and `await`s each `read()`; a sync adapter's plain return value awaits unchanged. A rejection becomes one `error` row exactly as a throw does today. | ✅ **recommended.** Identity still runs first and hands `siteId` on. Four existing adapters untouched. |
| B | A synchronous localStorage index of photo refs, maintained beside `photo_persist` | ⛔ changes a storage writer (handoff §8 fence) and makes a second source of truth (Contract A2) |
| C | An async `prepare()` that snapshots refs into memory, then a sync `assemble` reads the snapshot | ⛔ a cache by another name (P4: *"never cached"*) |
| D | Keep sync `assemble`, add `assembleAsync` beside it | ⛔ two engines for one concept (Contract A2) |

**Test cost of A:** spec 65's helper returns `PHANTOM_RR.assemble(id).then(v => ({ __missing: false, value: v }))`. Playwright awaits a promise returned from `evaluate`, so **none of the 27 existing assertions change**. A new test pins that `assemble` returns a thenable.

---

## E-5 · PROPOSED ADAPTER — `RR_ADAPTER_PHOTOS` (subject to Q-28 … Q-36)

**Placement:** declared **above** `PHANTOM_RR` like blockers and notes (`:31692` and `:31744` record why: a `var` below the registry literal is `undefined` when it is built). Registry becomes `[IDENTITY, PHASES, BLOCKERS, NOTES, PHOTOS]`.

**`read(siteId, rackId)` — returns a Promise:**
1. `rackId` not a non-empty string → `empty` (the Ship 2 / Ship 3 guard).
2. `typeof indexedDB === 'undefined'` → `error`, `IndexedDB unavailable`.
3. `indexedDB.open('phantom-attachments')`, **no version** (Q-28):
   - `onupgradeneeded` with `oldVersion === 0` → `transaction.abort()` → `onerror` fires `AbortError` → `preventDefault()` → **`empty`**. No database is created.
   - any other `onerror` → `error`, with the error's `name`.
   - `onsuccess` and no `photos` store → `error`: *photo database exists without its photos store — this device cannot save photos*. ⚠ Unreachable today, because nothing but `photo_getDB` opens this name. But it is exactly the state item 1 produces, and it is not a clean empty store.
4. `readonly` transaction, `store.getAll()` — **no index** (Q-31). Keep `r.rackId === rackId`, whole-string. Then **`db.close()`**, so the adapter never holds a connection that could block a future upgrade.
5. A watchdog (Q-32) → `error`, `photo store did not answer in 15 s`, if the open or the read never settles. Precedent: `.584`'s 15 s watchdog on the backup's IndexedDB open (`:56026`).
6. Per matched record:
   - `capturedAt` a finite number → `{ t: capturedAt, type: 'photo.captured', source: 'photos', data: { photoId, bytes } }`, where `bytes` is a finite number or `null` (Q-33);
   - otherwise → `facts.undated.push({ photoId, reason })`, counted and never timed (Q-11's rule, carried as in Ships 2 and 3).
7. Status: `matched ? 'ok' : 'empty'`. `facts`: `{ undated, sizes }` — `sizes` lets `assemble` total bytes for undated records too, without a second read.

**Derived in `assemble`, in one place (P6), beside `openBlockers`:**
- photos row `error` → `photoCount: null`, `photoBytes: null` (no count was taken);
- photos row `empty` → `0` and `0` (a count was taken — Q-13's rule);
- photos row `ok` → `photoCount` = events + undated; `photoBytes` = the sum **only if every matched record has a finite size**, else `null` with a row detail naming how many lacked one (**Q-35**);
- `evidence.photoIds` = dated ids in timeline order, then undated ids (**Q-34**).

---

## E-6 · READOUT REMOVAL — the census the grep gate will check

| Location | What | Disposition |
|---|---|---|
| `dct-ios.html` `:31886-:31978` | `// ── A.2 DEV READOUT · rrdev · TEMPORARY` through `// ── END rrdev`, **93 lines**, the whole IIFE `rr_devReadout` | delete whole. All seven `rrdev` hits in the file are inside it (`:31886-31889`, `:31892`, `:31968`, `:31978`). It depends only on `deploy_loadAllRacks` and `PHANTOM_RR`; nothing depends on it |
| `sw.js` | — | no hit |
| `version.json` | `.594`'s notes text | replaced by the bump |
| `test/e2e/65-rack-record-assembler.spec.js` | 5 `READOUT ·` tests (`:932`, `:942`, `:969`, `:994`, `:1020`) and header comments | replaced by: `?rrdev=1` boots with no `#rr-dev` and no `[rrdev]` warning, and the **served** `/dct-ios.html` contains no `rrdev` |
| `docs/*`, `OWNER-RULINGS.md`, `PHANTOM_CURRENT_STATE.md` | history | kept: records are not remnants |
| ⚠ **`phantom-field-test.html`** (repo root) | **8,812,458 bytes, 48,664 lines, stamped `phantom-v1.14.593`, 7 `rrdev` hits**, served at the root of both origins | ⛔ **out of the slice's fence** (**Q-37**). Not in `sw.js`, named in no doc. Its history was lost in the 2026-10-08 squash. **Lead L-5** |

---

## E-7 · DEVICE LOOK — for Ship 4a if Q-30 splits the ship

A **Safari tab** on staging (ruling Q-8), never the icon. One rack, one deployment.

1. **Fresh-device check — the WebKit-only one.** Open staging in a **Private** tab, which has fresh storage, and load a Master to a one-rack deployment. Then:
   - open `?rrdev=1`, pick the rack → `… · notes … · photos empty`;
   - close the readout, go to Build → that rack → **Photo** → take one photo;
   - **PASS:** the toast reads `PHOTO SAVED`. This is §0 item 1 on real WebKit: the adapter's abort left nothing behind.
   - **FAIL:** any `PHOTO NOT SAVED`, or the Photo action doing nothing.
2. **Count and size.** Take a second photo, open the gallery, and note the title `PHOTOS · <rack> · 2 · X.X MB`. Re-open `?rrdev=1` and pick the rack:
   - **PASS:** `photos ok (2)`; JSON `status.photoCount` `2`; `status.photoBytes ÷ 1048576` rounds to the gallery's `X.X`; `evidence.photoIds` has 2 entries; two `photo.captured` events with numeric `t`; `phase`, `openBlockers` and the notes row unchanged.
3. **Delete.** Delete one photo in the viewer, then re-pick → `photos ok (1)`, `photoCount` `1`.
- **FAIL:** `photos error`; a count that differs from the gallery title; any `blob`, `w`, `h` or `caption` in the JSON; any event without a numeric `t`; any trace of the readout without the param.

**Ship 4b's look, if split:** the icon or a tab on staging with `?rrdev=1` shows the normal app with no readout; Build → Photo still saves.

---

## E-8 · TEST PLAN (spec 65 — RED first on `.594`; Chromium unless Q-38 says otherwise)

⭐ **The probe's own harness pattern is the fixture:** a fresh Playwright context is a fresh IndexedDB, so "a device that never took a photo" is literal, not simulated. Seeds write records straight into `phantom-attachments` with chosen `capturedAt`, because `photo_persist` stamps `Date.now()`.

| # | Test | Pins |
|---|---|---|
| T1 | **ASYNC** · `assemble` returns a thenable; registry order holds; a sync adapter still reads; a rejecting adapter is one `error` row and the rest still run | Q-29 |
| T2 | **PHOTOS · FRESH DEVICE** · no database → `photos empty`, `photoCount 0`, `photoBytes 0`, `photoIds []`; **`indexedDB.databases()` unchanged after assembly**; then `photo_persist` succeeds and `photo_getCountForRack` reads 1 | §0 item 1, Q-28 — **the test that keeps the photo button alive** |
| T3 | **PHOTOS · TIMELINE** · two of this rack's photos stored out of time order merge by time with phases, blockers and notes; payload exactly `{ photoId, bytes }` | Q-33 |
| T4 | **PHOTOS · SCOPING** · `rack_<dep>_1` vs `_10`, another deployment, `''`, and a record whose `siteId` disagrees with the split, each keep their own | Q-31 |
| T5 | **PHOTOS · DERIVED** · count, bytes, `photoIds` order; an undated record counted and listed, not timed | Q-34, Q-11 |
| T6 | **PHOTOS · SIZE MISSING** · one record with `bytes` absent → `photoBytes null`, count still taken, row detail names it | Q-35 |
| T7 | **PHOTOS · ERROR** · `indexedDB` undefined; open error; a version-1 database with no `photos` store; an open that never settles (watchdog shortened via an adapter property, not a sleep) — each one `error` row with detail, `photoCount null`, other adapters untouched | Q-32 |
| T8 | **PHOTOS · PURE READ** · localStorage snapshot identical; the IndexedDB record set identical; no database created; no toast; no blob in the Record | handoff §4 |
| T9 | **REGISTRY** · photos is the fifth adapter; coverage is exactly the registry; `gaps` unchanged | Q-A |
| T10 | **READOUT GONE** (4b) · `?rrdev=1` → no `#rr-dev`, no `[rrdev]` warning; the served `dct-ios.html` has no `rrdev` | Q-37 |
| — | regression: `64` (report output unchanged), `00-boot`, `63`, `12`, `13`, `27`, `04-storage` | handoff §7.3 |

**Planned mutations, each must turn a test red:**
- remove the `oldVersion === 0` abort → T2;
- read through `photo_getDB()` → T2 (a database created) and T8;
- match by `startsWith` → T4;
- use the `byRack` index with the split → T4;
- `bytes || 0` → T6;
- emit `w`, `h` or `caption` → T3;
- collapse `error` into `empty` → T7;
- drop the watchdog → T7;
- skip `db.close()` → a T8 check that a versioned open right after assembly does not fire `onblocked`;
- return the Record synchronously → T1.

---

## Q · Rulings owed before Ship 4 builds (numbered on from Q-27)

| Q | Question | Recommendation |
|---|---|---|
| **Q-28** | How does the adapter open `phantom-attachments` without creating it? | **Version-less open, abort the upgrade when `oldVersion === 0`, read as `empty`.** Never `photo_getDB()`, never a versioned open. Pinned by T2 |
| **Q-29** | `assemble` cannot stay synchronous. | **Option A:** `assemble` returns `Promise<Record>`, sequential `await` in registry order; `read()` may return a value or a Promise. Amends handoff §4's signature, and nothing else in it |
| **Q-30** | Ship 4 removes the readout the photos adapter would be checked on, and no harness can run WebKit. | **Split:** **4a** = photos adapter + async fold (the readout gains the photos row; look per E-7) → stamp → **4b** = readout removal + grep gate (look: no readout, Photo still saves). Contradicts handoff §5 *"in the same ship"*, hence a ruling. Alternative if one ship stands: Chromium-only proof plus E-7 step 1 run without a readout |
| **Q-31** | Match key | `rackId` whole-string over `store.getAll()`. Never `siteId`, never the `byRack` index. The `siteId` defect stays its own ship with its own migration (2026-09-14 ruling) |
| **Q-32** | A read that never settles | **15 s watchdog → `error`** (the `.584` precedent). A database without its `photos` store → `error`, never `empty` |
| **Q-33** | Event payload | **`{ photoId, bytes }` only.** `w`/`h` are always `0` and `caption` is always `''`: no writer sets them, and printing them claims a measurement. `siteId` is the defect |
| **Q-34** | `evidence.photoIds` order and membership | Every matched id: dated in timeline order, then undated in store order |
| **Q-35** | `photoBytes` when a record has no finite `bytes` | **`null`, with a row detail naming how many**; `photoCount` still counted. A partial sum presented as the total is the displayed-stronger-than-measured defect |
| **Q-36** | Deleted photos leave no trace | No standing caveat on every photos row (there is no marker to detect, so it would state nothing measured). Record the limit in the adapter comment; A.3's renderer footnotes it. The audit gap is lead L-3 |
| **Q-37** | Grep-gate scope | `dct-ios.html` and `sw.js` in the tree, plus the **served** `dct-ios.html` in T10. `phantom-field-test.html` is outside the fence (lead L-5) |
| **Q-38** | Gate engine | `laptop-chromium` again (WebKit blocked on the laptop by Smart App Control, and unavailable in cloud sessions by egress policy), with E-7 as the WebKit gate. The 2026-09-17 ruling asked Ship 4 to come back on this; this is it coming back |

## STOP list (P2 — do not design around these)

- **S-1** discrepancy photos (PH-3): another class, never the composite, a time that does not parse.
- **S-2** phase-model step `evidence[]` (PH-5): no live writer.
- **S-3** `siteId` on the photo record: the defect, not a field.
- **S-4** the base36 tail of `id`: a write-time clock, not a field.

## Stop conditions — Ship 4 is unsafe to write as specified if any of these holds

1. The adapter opens `phantom-attachments` with a version, or through `photo_getDB()`.
2. `assemble` stays synchronous and the photos read is made to "fit" through a cache, a snapshot, or a second index.
3. A `blob` reaches the Record, the readout, or a log line.
4. `photo_persist`, `photo_getDB`, `photo_deletePhoto`, the gallery or the viewer is edited (handoff §8: storage writers and renderers are fenced).

## Leads — found, not worked (findings notes are leads, not tasking)

- **L-1 ⛔ BACKUP BREAKS GHOST ECHO ON A FRESH DEVICE** (§0 item 6; probes P8, P9). Live in the promoted `.593`. The repair shape is plain and is the owner's to schedule:
  - the backup's version-less open (`:56095`, and `exportGhostEcho` `:55780`) takes the abort recipe;
  - `GE`'s `DB_VERSION` goes to 2, so devices already broken get their store on the next open.
  - ⚠ WebKit unproven — the IndexedDB spec says a version-less open of a missing database creates version 1, and WebKit implements the spec, but no harness here can show it.
- **L-2** Rack photos are **not in the backup**, and the manifest does not name the store. `.584` made a *failed* read honest; an *omitted* store still reads as a complete backup (Contracts B10, B11).
- **L-3** Photo deletion writes **no audit entry** (probe P7), so a removed evidence photo has no actor-credited record (Addendum A, D-2).
- **L-4** `w`/`h` written `0` while `va_imageDims` (`.589`) measures real dimensions (known; refresh §5).
- **L-5** `phantom-field-test.html` — 8.8 MB, stamped `.593`, carries the readout, served at both roots, named nowhere. Owner to classify: keep, retire, or document.
- **L-6** `04-storage` `:461` and `:605`, red on the laptop since 2026-09-21, **pass on clean Linux Chromium at `.594`** (20 passed, 1 skipped, 2026-10-15). That supports the state file's *"the environment changed, not the code"* — it is that box.
- **L-7** Spec 65, 64 and 00-boot reproduce **39/39** at `.594` on Linux Chromium (2026-10-15) — an independent box, the same green.
- **L-8** The 2026-10-08 history squash left `main` with three commits. Every commit hash cited in `PHANTOM_CURRENT_STATE.md`, `OWNER-RULINGS.md` and the evidence docs (e.g. `c24cf12`, `d73a0bb`) **no longer exists on `origin`**. A laptop clone made before 2026-10-08 does not share history with `origin/main`, and `verify.ps1` refuses when `HEAD` ≠ `origin/main`.

## Bounds

- **Read:** source on `main` @ `1313a07` (`.594`), the five docs named in the header, and the served `version.json` of both origins.
- **Executed:** two throwaway Chromium probes against `test/server.js`, kept outside the repo, nine checks P1–P9. No WebKit. No device.
- **Not done:** no repo file but this one was written; no adapter, test or spec was drafted into the tree.
- **Reviews:** `storage-archaeologist` and `adapter-reviewer` were not run; they are not loadable from this session.

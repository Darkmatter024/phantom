# RESTORE-UNDO — PHASE 0 EVIDENCE (read-only, nothing authorised to build)

**Written:** 2026-09-09 · **Baseline:** `.585` on `main` (`3edf586`), `.584` served · **Ruling:** `OWNER-RULINGS.md` 2026-09-09 RESTORE-UNDO — *"Snapshot current state before applying, offer one revert."*
**Purpose:** the facts a restore-undo has to be built on, measured from the source and the harness, before a spec. Every anchor is from the `.585` bytes.

---

## 1 · What a restore writes today

`phantomImport` (`dct-ios.html:56334`) builds ONE write set, `_writes`, and applies it with `safeStore` in a loop with a pre-flight headroom check and a full rollback on the first failed write (`:56437–56462`). The set:

| Written on every restore | Written only if the file has the section | Registry (`bundle.keys`) |
|---|---|---|
| `phantom_deploy_racks_v1` · `phantom_deploy_phases_v1` · `phantom_deploy_optics_v1` · `phantom_deploy_audit_v1` · `phantom_handoff_v1` — **written as `[]` when the file lacks them (the CLEARED case the ruling answers)** | `dct_sops_v1` · `dct_racks_v1` · `dct_burndown_v1` · `phantom_rack_history` · `phantom_optic_inventory` · `phantom_deployments_v1` · `phantom_site_profile_v1` · `phantom_edp_cache_v1` · `phantom_master_v1` · `phantom_jobsnap_v1` | every string-valued key in `bundle.keys` that does not collide with a named section — verbatim |

Outside `_writes`, two more writes happen after the loop:

- **Ghost Echo quirks** (`phantom_ghost_echo_v1`): **merged** by id into what is on the device via `ge_load` / `ge_save` (`:56466–56477`). Not in `_writes`, so **not covered by the in-restore rollback**.
- **`GhostEchoDB` / `ghosts` (IndexedDB):** `clear()` then `put()` each entry, **only when the file carries at least one ghost** (`:56489–56513`). An empty or declared-failed list leaves the store alone (`.585`: *KEPT*).

## 2 · What a restore does not touch

- IndexedDB `phantom-photos` / `photos` (`:33316`) — discrepancy photos; the restore does not write them (`.585` discloses it).
- IndexedDB `phantom-bom` (`:44189`).
- `PHANTOM_BACKUP_EXCLUDED_KEYS` (`:55311`) — session, presence, crash log, reminder timestamps.
- Everything in `localStorage` that is neither a named section nor in `bundle.keys`. **Measured on the app path 2026-09-09:** after a real restore and its reload, on a page with no harness script, all 21 restored keys read back byte-identical and the three untouched keys (`phantom_brief_last_ts`, `phantom_seen_boot`, `phantom_tab_presence_v1`) were carried, not rewritten. Boot does not re-seed restored data.

## 3 · The rollback that exists, and why it is not an undo

`_snapshot` (`:56437`) captures the previous value of every key in `_writes` **in memory, for the duration of the loop**. It is used only if a write fails mid-loop. Once the loop completes it is dropped, the quirks merge and the Ghost Echo rewrite run, `phantom_restoreComplete` alerts, and the page reloads. **After the reload there is no record of what the device held before.** That is the gap the ruling names: one copy of the deploy data, an unrecoverable clear.

## 4 · Where a persisted snapshot can live

| Store | Fits? | Why |
|---|---|---|
| `localStorage` | **No.** | The restore already refuses a payload over ~4.5 MB (`:56443`) because Safari's origin quota is ~5 MB. A snapshot of the same keys is the same order of size; two copies cannot coexist. |
| IndexedDB, a new store (e.g. `phantom-restore-undo` / `slot`, one record) | **Yes.** | Quota is hundreds of MB on iOS; the app already runs three IndexedDB databases; a single-record store with `{ takenAt, fromFile, version, keys: {…}, ghosts: […] \| null, quirks: … }` is the same shape as the bundle. |
| A downloaded file | No. | Rev 2: a browser download is not proof of a retained copy, and it puts the recovery in the Files app, not in the tool the tech is holding. |

**Not measured here:** real device sizes. `SYS → DIAGNOSTICS` shows storage %; a `.58x` backup on the owner's phone will give the working number. The stress fixture (`4000h/60000c`) compresses to ~6.5 MB, above the localStorage ceiling and far below IndexedDB's.

## 5 · What one revert must capture, exactly

1. **Every key in `_writes`, its value before the loop** — the same set `_snapshot` already reads (`null` = absent, so the revert removes it).
2. **`phantom_ghost_echo_v1` before the merge** — the merge is additive, so without this a revert would leave the file's quirks on the device.
3. **`GhostEchoDB` / `ghosts`, every record, only when the file carries ghosts** — otherwise the store is not touched and there is nothing to revert.
4. **Provenance:** when, from which file name, which app version, how many keys — so the undo band can say what it will put back.

Taken **before the first write**, in one IndexedDB transaction. If it cannot be taken (open error, quota, timeout), the restore must not proceed on the assumption that it can — see Q1.

## 6 · The door

A restore ends in a reload, so the completion alert cannot carry the undo. The undo has to be a **persistent band on boot while a slot exists**: `RESTORE APPLIED HH:MM · from <file> · UNDO | KEEP`. UNDO → a confirm built by the same `phantom_restorePreview` machinery (this time device → snapshot), then the snapshot written back through the same atomic loop and rollback, the slot deleted, reload. KEEP → the slot deleted, band gone. **One revert:** a single slot; a second restore before UNDO replaces it, and its confirm says so. 44 px targets; the band is a new surface — one door, no second restore path.

## 7 · Failure modes that must be loud

- Snapshot cannot be taken → refuse the restore with the reason (**Q1**).
- Revert write fails mid-loop → the existing rollback returns the device to the restored state; the slot is kept; the alert says so.
- Ghost Echo revert fails → report it the way `.585` reports the forward failure; keep the slot.
- Slot exists but is unreadable at boot → band says so, offers KEEP (delete) only.

## 8 · What a spec must pin (`test/e2e/53-restore-undo.spec.js`)

Snapshot exists before the first `safeStore` (stub `Storage.prototype.setItem` to observe order) · UNDO returns every `_writes` key and the quirks blob byte-identical, and the ghosts store record-for-record · the slot is gone after one UNDO · KEEP deletes the slot and changes nothing else · a second restore replaces the slot and its confirm says so · a snapshot failure refuses the restore with every key byte-identical · the band renders at 390 with two 44 px targets.

## 9 · Questions for the owner (park, don't guess)

- **Q1** — snapshot cannot be taken: refuse the restore, or proceed and say there will be no undo? (Recommendation: refuse. The ruling's premise is one copy.)
- **Q2** — does the band live in the shared header band cluster with `#storage-warn` / `#backup-remind`, or on SYS? (Recommendation: header — it must be seen without navigating.)
- **Q3** — expiry: never, until UNDO or KEEP? (Recommendation: never; the slot is one record.)

## 10 · Proposed ship

ONE ship, its own version after `.585` is adjudicated, per the ruling not inside `.585` or `.586`: the snapshot, the band, UNDO/KEEP, spec 53. Blast radius: the restore path (already touched by `.585`) plus one new IndexedDB store and one banner. Data path — the right path, not the cheap one.

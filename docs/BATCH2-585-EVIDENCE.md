# BATCH 2 — EVIDENCE TABLE · `phantom-v1.14.585`

**Written:** 2026-09-09 · **Ship commit:** `3edf586` · **Baseline:** `.584` VERIFIED (`d02a081`), served on `release` (`d02a081`), device PASS 2026-09-09 on both looks
**Status:** evidence delivered. **Runs serve → see → verify ONE MORE TIME as a NAMED EXCEPTION** (`OWNER-RULINGS.md` 2026-09-09 PROMOTE ORDER): verify → stamp → promote is canonical from here on, but no staging surface for `main` existed when `.585` landed, so `.585` alone goes `promote.ps1` → the look below on the release URL → `verify.ps1 585 PASS|FAIL`. Not precedent. The Q row below is answered: RESTORE-UNDO, own spec (`docs/SHIP-HANDOFF-RESTORE-UNDO.md`).

---

## Batch header

| Field | Result |
|---|---|
| Batch contents | ONE ship, `.585` — **RESTORE HONESTY**, DATA-HONESTY-COMMAND Batch 2 P0 sub-ship 2, owner GO 2026-09-09 (*"GO on .585 restore honesty"*), handoff rev 2 §1: *show what will be replaced, validate the backup before applying, report partial or failed recovery honestly.* |
| `VERIFIED` / version drift | `VERIFIED` head = `.584` (`d02a081`); tree = `.585`. **One unverified ship — the gate is AT its limit.** |
| `release` vs `main` | `release` = `d02a081` serving `.584`. `main` carries `.585` once pushed. The phone has `.584` until John promotes. |
| Targeted suite (`phone-webkit`) | `52-restore-honesty.spec.js` (new, 8 cases, RED then GREEN) — **8 / 8 pass.** `04-storage.spec.js` — **20 passed, 1 skipped, 1 `test.fail` pin failing as pinned (`:368`, unrelated)**; its own restore pins (round trip `:461`, newer-schema refusal `:561`) still hold on the new dialogs. `50-status-honesty.spec.js` — **2 / 2.** `51-backup-honesty.spec.js` (`.584`, adjacent code) — **6 / 6.** |
| Mechanical ship gate | see §Reviews below. |
| Correctness review | see §Reviews below. |

---

## Ship evidence — `phantom-v1.14.585`

| Field | Content |
|---|---|
| **Version** | `phantom-v1.14.585` |
| **Visible change** | **ONE.** The restore's two dialogs tell the truth. **Before any write:** a damaged file is refused (`Backup file is damaged — <reason>. Nothing was changed.`); the confirm reads, per section, `N on this device → M in backup`, names **CLEARED** (an always-written deploy section the file lacks), **kept** (an optional section the file lacks), the registry keys that overwrite keys already on the device, **DROPPED** orphans by kind, **PARTIAL BACKUP** with the store named and this device's Ghost Echo count **KEPT**, and photos the restore cannot carry. **After:** `Restore complete. N keys written (M from the registry). Dropped … Ghost Echo: restored K / KEPT this device's K — the backup had none readable / NOT restored (reason) — this device's entries are unchanged; everything else was restored.` Native `confirm()` / `alert()` are kept — the change is what they say, not the mechanism. |
| **Why** | `phantomImport()` confirmed by listing what was IN the file, never what is ON THIS DEVICE that the file overwrites or clears — and five deploy sections are written on every restore even when the file lacks them. Orphaned records were filtered out silently. A bundle whose manifest says a store failed to read (`included:false` / `partial:true`, the `.584` vocabulary) was offered as a normal restore. A structurally damaged file could reach the write set. Discrepancy photos are exported and never restored, and nothing said so. The completion alert said *Restore complete* whatever happened, and a Ghost Echo IndexedDB failure produced no report and no reload. Contracts B10 / B14. |
| **Anchors** | `dct-ios.html:12865` stamp · `:56126` `PHANTOM_RESTORE_SECTIONS` · `:56152` `phantom_restoreValidate` · `:56179` `phantom_restoreOrphans` · `:56205` `phantom_restoreCountNoun` · `:56210` `phantom_restoreDroppedParts` · `:56222` `phantom_restoreCountGhosts` (through `GE.init()`) · `:56243` `phantom_restorePreview` · `:56326` `phantom_restoreComplete(summary)` · `:56334` `phantomImport` (`:56364` validate · `:56377` async wrapper · `:56482` summary and the Ghost Echo tail) · `sw.js:37` · `version.json:2,3,4,5` · `test/e2e/52-restore-honesty.spec.js` new (299 lines). |
| **What the write set does** | **UNCHANGED.** The referential-integrity predicates moved verbatim into `phantom_restoreOrphans` (compare the removed inline block in the diff), computed once above the confirm, so the DROPPED line and the writes count the same records. The snapshot, headroom check and rollback are untouched. The Ghost Echo IndexedDB write is untouched in what it writes; it gained `onerror` / `onblocked` / `tx.onerror` / `tx.onabort` / a 15 s watchdog, each ending in a report and the reload. |
| **Doctrine self-review** | **Data honesty** — every line the confirm prints is read from `localStorage` / the file / IndexedDB at that moment; `kept` for Ghost Echo is true because the IndexedDB write is skipped when the bundle's list is empty; success wording counts what was written, not what was hoped. **Blank is never an erase** — a store the file DECLARES it could not read is kept and said; an optional section the file lacks is kept and said; an always-written deploy section the file lacks is **CLEARED** — pre-existing replace semantics, now disclosed, not changed (owner question below). **Contract 14** — the refusals alert; a cancelled confirm is the user's choice; the async wrapper's catch names the possibility that writes landed. **One door** — the restore door and `phantomImport` are unchanged; the helpers are called from it alone. **44px / channel colour** — no markup, no CSS. **Legacy** — the header's RESTORE calls the same function in both houses. |
| **Lockstep** | ✅ three stamps, all `phantom-v1.14.585`, `grep -c` = 1 each; `prevVersion` = `.584`. |
| **Diff scope** | `dct-ios.html` +278/−53 · `sw.js` +1/−1 · `version.json` +3/−3 · `test/e2e/52-restore-honesty.spec.js` +299 (new). JS: 3 inline blocks, 0 failures; `node --check sw.js` OK; `version.json` parses; CSS braces 4808 / 4808 in `<style>` blocks; `dct-ios.html` CRLF 60276 / bare LF 0, `sw.js` CRLF 314 / 0. |
| **What the spec proves (RED → GREEN)** | Against `.584`, all eight failed on the defect each pins: no device counts in the confirm, orphans silent, PARTIAL not recognised, a non-list section and a manifest mismatch both accepted (two dialogs, not one refusal), photos undisclosed, the report without counts, and an IndexedDB failure that ended without any dialog. Against `.585`: eight of eight. The file input and the dialogs are the real door (Playwright's `filechooser` + dialog events, the same technique as `04-storage`); nothing in the write path is stubbed. |
| **Two harness findings, recorded because they cost time** | (1) `phantom.boot()`'s seed is an init script that re-applies on every navigation, including the reload the restore ends with; a test that reads `localStorage` after a restore must seed through `page.evaluate`. **Classified 2026-09-09 after an app-path measurement, at the owner's insistence:** on a second page with no init script, a real restore followed by its reload left all 21 restored keys byte-identical, none missing, none created by boot — the app does not re-seed restored data; this is harness-only. ⚠ Lead: 04-storage's round trip (`:461`) reads `localStorage` after that same reload with the seed still armed, so its post-reload assertions are satisfied by the seed whether or not the restore wrote anything; the probe's shape (a `context.newPage()` restore) is the honest version and should become a pinned spec. (2) **An own property set on `window.indexedDB` vanishes within ~500 ms on the same page with no reload** — WebKit does not keep an expando on a platform-object wrapper alive unless JS holds a reference. Test-only (owner, 2026-09-09). Spec 52 stubs `IDBFactory.prototype`; spec 51's stub moved to the prototype in the same docs commit. |
| **Leads, not fixed here** | Discrepancy photos are still not restored (the `photoStore` write path — its own ship); the confirm now says so. The always-written deploy sections clearing device data when the file lacks them is disclosed, not changed. `safeGet`-backed stores that fail to parse still restore as the fallback. |
| **Q — owner ruling, parked, not guessed** | Should *blank is never an erase* apply to a restore? **RULED 2026-09-09 (`OWNER-RULINGS.md` RESTORE-UNDO): neither that nor strict replace — the restore becomes undoable: snapshot before applying, one revert.** Own spec, evidence first: `docs/RESTORE-UNDO-PHASE0-EVIDENCE.md`, `docs/SHIP-HANDOFF-RESTORE-UNDO.md`. Not inside `.585` or `.586`. |

---

## Reviews

**Mechanical ship gate (`phantom-ship-gate`): PASS on all seven checks.** Lockstep at `.585` with `prevVersion` `.584` and `VERIFIED` line 1 `.584 VERIFIED`; three inline blocks compile ×3 and `node --check sw.js` OK; `version.json` parses; braces 14358 / 14358 whole-file; four localized hunks in `dct-ios.html`, none in CSS, `sw.js` and `version.json` stamp-only; CRLF 60276 / 0 and 314 / 0. **One flag, accepted:** `phantomImport` is called from the shared header menu in both houses, so legacy sees the new dialog text too — an invariant, not presentation (Contract 17's carve-out), the same shape as `.584`'s flag.

**Correctness review (`phantom-rd-reviewer`): PASS.** A first attempt stalled and was killed by the harness after ten minutes without a verdict, mid-way through questioning `key` in the preview's `siteProfile` branch; the fresh review checked that branch first — `key` is bound per section, `phantom_site_profile_v1`, the same string the write path and `SITE_PROFILE_KEY` use; not a bug. It ran spec 52 (8 / 8) and 04-storage (20 passed, 1 skipped, the three restore pins holding), compiled the whole 2.5 MB enclosing script block (not just the function), cross-checked every `PHANTOM_RESTORE_SECTIONS` kind against the real `_writes.push` conditionals (the disclosed kept / CLEARED behaviour matches the write path row for row), and cross-checked the manifest store names against the `.584` exporter verbatim (no name mismatch that could cause a false miss or a false refusal). Verified clean: every early return is loud or a user cancel; the count failure surfaces as *count unavailable* in the confirm; one completion door; both promise branches handled; no double-finish; no deadlock; no CSS. **Advisory, not blocking:** the five always-written deploy sections still clear when the backup lacks them — disclosed, not refused — and the reviewer agrees a refusal would block legitimate recoveries from narrower or older backups; left to John (the Q row above).

---

## What John actually taps (Pages URL, AFTER the promote)

**From the terminal first:**
```
.\tools\promote.ps1
```
Expected: `Served version adjudicated: phantom-v1.14.584 VERIFIED`, the pending commits, then `SERVED: phantom-v1.14.585`. Wait for the Pages build.

**On the phone — one look, no write:**
1. SYS reports **`phantom-v1.14.585`**.
2. Header **⋯** → **RESTORE** → pick any PHANTOM backup from Files (today's `.584` backup is fine).
   **PASS** = the confirm reads **`Replaces on this device:`** with lines shaped `SOPs: N on this device → M in backup`, ends **`This will OVERWRITE current data.`**, and is readable on the phone. **Tap Cancel.** Nothing changes.
   **FAIL** = the old confirm (a bare list of what is in the file), a dialog cut off or unreadable at 390, or a JS-ERROR banner.
3. Optional, your call only: OK on today's own backup → the completion alert reads `Restore complete. N keys written … Ghost Echo: restored K …` and the app reloads with the same data. Not required for PASS.

**Then, from the terminal only — one command, either way:**
```
.\tools\verify.ps1 585 PASS
.\tools\verify.ps1 585 FAIL "what you saw"
```

---

## Dialog texts, as the harness saw them on the `.585` bytes

```
Restore from backup?

Replaces on this device:
  SOPs: 2 on this device → 1 in backup
  Deployments: 3 on this device → 1 in backup
  Deploy racks: 1 on this device → CLEARED (not in backup)
  2 additional data keys (1 already on this device, will be overwritten)

This will OVERWRITE current data.
```
```
Restore from backup?

⚠ PARTIAL BACKUP — GhostEchoDB:ghosts was not readable when this file was written. This device's 1 Ghost Echo entry will be KEPT.

Replaces on this device:
  SOPs: 2 on this device → 1 in backup
  Deployments: 3 on this device → 1 in backup
  Deploy racks: 1 on this device → 1 in backup
  Deploy phases: 0 on this device → 1 in backup
  2 additional data keys (1 already on this device, will be overwritten)

This will OVERWRITE current data.
→ Restore complete. 9 keys written (2 from the registry). Ghost Echo: KEPT this device's 1 entry — the backup had none readable. PHANTOM will reload now so every surface reads the restored data.
```
```
Backup file is damaged — sops is not a list. Nothing was changed.
Backup file is damaged — manifest says 5 deployments, file has 1. Nothing was changed.
Restore complete. 9 keys written (2 from the registry). Ghost Echo: restored 1 entry. PHANTOM will reload now …
Restore complete. 9 keys written (2 from the registry). Ghost Echo: NOT restored (open error) — this device's entries are unchanged; everything else was restored. PHANTOM will reload now …
```

## Suite run — targeted `phone-webkit`, `.585` bytes

```
./test/node_modules/.bin/playwright test -c test/playwright.config.js --project=phone-webkit 52-restore-honesty 04-storage 50-status-honesty

  ok 24  ⛔ the confirm shows device count against backup count, and names what will be CLEARED
  ok 25  orphans are counted in the confirm and in the report, never dropped in silence
  ok 26  ⛔ a PARTIAL backup keeps this device's Ghost Echo, says so before and after, and writes the rest
  ok 27  ⛔ a damaged file is refused before any write: a section that is not a list
  ok 28  a damaged file is refused before any write: the manifest count does not match the file
  ok 29  photos the restore does not carry are disclosed before the write
  ok 30  the completion report counts what was written and restores Ghost Echo from a full backup
  ok 31  ⛔ a Ghost Echo write failure is reported, this device's entries are unchanged, and the rest still landed

  1 skipped
  30 passed (3.2m)        ← 52: 8/8 · 04-storage: 20 passed, 1 skipped, the :368 pin as pinned · 50: 2/2
51-backup-honesty (re-run alone, .585 bytes): 6 passed (42.8s)
```

⚠ **What this run cannot say:** how a ten-line `confirm()` renders on iOS Safari at 390, and the Files picker. That is the one look on the phone.

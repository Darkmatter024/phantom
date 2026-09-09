# BATCH 2 — EVIDENCE TABLE · `phantom-v1.14.584`

**Written:** 2026-09-09 · **Ship commit:** `6439dbc` · **Baseline:** `.583` VERIFIED (`b9d7de9`), served on `release` (`b9d7de9`), device PASS 2026-09-09
**Status:** evidence delivered. **Awaiting John, in this order:** `promote.ps1` → one device check → `verify.ps1 584 PASS` (or `FAIL "reason"`).

---

## Batch header

| Field | Result |
|---|---|
| Batch contents | ONE ship, `.584` — **BACKUP HONESTY**, DATA-HONESTY-COMMAND Batch 2 P0, owner GO 2026-09-09 (*"GO on .584 Batch 2 P0"*). |
| `VERIFIED` / version drift | `VERIFIED` head = `.583` (`b9d7de9`); tree = `.584`. **One unverified ship — the gate is AT its limit.** |
| `release` vs `main` | `release` = `b9d7de9` serving `.583`. `main` carries `.584` once pushed. The phone has `.583` until John promotes. |
| Targeted suite (`phone-webkit`) | `51-backup-honesty.spec.js` (new, 6 cases, RED then GREEN) — **6 / 6 pass.** `04-storage.spec.js` — **20 passed, 1 skipped, 1 `test.fail` pin failing as pinned (`:368`, quarantine rewrite — pre-existing, unrelated).** `05-offline.spec.js` — **7 passed, 8 skipped, 0 failed** (identical to the `.583` run). `50-status-honesty.spec.js` — **2 / 2.** |
| Mechanical ship gate | **PASS** on all seven checks plus the VERIFIED gate (`phantom-ship-gate`): lockstep at `.584` with `prevVersion` `.583`; 3 inline blocks compile, `node --check sw.js` OK; `version.json` parses; braces balanced; diff surgical (stamp, `exportAllData`, `_addManifest`, bundle literal, `downloadJSON`, the DCT-16 reminder IIFE — nothing else); CRLF 60039 / bare LF 0 and 314 / 0. **One flag, accepted:** the legacy medallion menu's BACKUP resolves to the same `exportAllData`, so legacy sees the new banner states too — that is Contract A2 (one door) doing its job, and `#backup-remind` sits in the shared header that renders in both houses. |
| Correctness review | see §Correctness review below. |

---

## Ship evidence — `phantom-v1.14.584`

| Field | Content |
|---|---|
| **Version** | `phantom-v1.14.584` |
| **Visible change** | **ONE.** The backup banner under the header reports the **completed op, not the tap**: `BACKUP · SAVING…` while the read and the share sheet are in flight → on completion the banner hides and a toast names the time (`Backup exported HH:MM` via the sheet; `Backup file prepared HH:MM — check your downloads` via the browser, per handoff rev 2: a download is not proof of a retained copy) → `BACKUP NOT SAVED — share sheet dismissed — tap to retry` / `BACKUP NOT SAVED — retry or free space — tap to retry` (magenta `#ff2bd6`, the ratified fault channel; persistent, plus a toast; never marked done) → `PARTIAL BACKUP — review missing data: GhostEchoDB:ghosts — tap to retry` (gold, persistent, never marked done). A second tap while saving gets `Backup already in progress`. |
| **Why** | `exportAllData()` called `phantomMarkBackupDone()` as its FIRST line, so the last-backup timestamp was written and the reminder hidden before the IndexedDB read, before the share sheet, before anything could fail — a dismissed sheet counted as a backup. Both GhostEchoDB error paths built the bundle from `[]` and the manifest recorded the store as `included:true, recordCount:0` — a failed read serialised as a clean, empty store. `downloadJSON` never consulted `navigator.share()`'s promise, so a dismissed sheet fell through to a second download prompt and nothing learned the outcome. A technician could believe they had backed up work they had not. Contracts B10 and B14. |
| **Anchors** | `dct-ios.html:12865` stamp · `:55386` `_backupInFlight` · `:55387` `exportAllData` (state machine: `setState` / `finish` / `ship` / `readFailed`) · `:55451` `_addManifest(…, error)` · `:55535` `partial` + `readFailures` in the bundle · `:55551` `downloadJSON(bundle, 'phantom-full-backup', { cancelIsFinal: true })` · `:55561` 15 s watchdog over the whole IndexedDB read, cleared by `ship()` · `:55588` `downloadJSON(data, prefix, opts)` → `Promise<{outcome, error}>` · `:55641` `window.phantomBackupState` · `:55672` `phantomMarkBackupDone` reset · `sw.js:37` · `version.json:2,3,4,5` · `test/e2e/51-backup-honesty.spec.js` new (215 lines). |
| **Doctrine self-review** | **44px** — the banner is the existing tappable strip; size and tap target unchanged. **Data honesty** — success says what the code can prove: the sheet *resolved* (`exported`) or the anchor was *handed to the browser* (`sent to downloads`), with the time; it never says *saved on this device*, because the sheet's destination (Files, AirDrop, Mail) is the user's choice and the browser path cannot be observed. PARTIAL names the store; the manifest says `included:false, error:'read failed'`; the bundle says `partial:true, readFailures:[…]` so the **file** cannot be mistaken for a full backup. **Contract 14** — no silent early return on a user-facing path: the in-flight guard toasts; every failure path paints the banner and warns; the hourly reminder's guard is a timer tick, commented as such. **One visible change** — PASS. **One door** — `#backup-remind` is the one backup surface; `exportAllData` the one function (four callers, unchanged). **Channel colour** — violet in flight (the banner's own), **magenta `#ff2bd6` for NOT SAVED — the ratified fault channel (`:9765`)**, `--gold` (`#ffd60a` on `:root`) for PARTIAL; the toast uses the existing `ok` / `warn` / `error` types. ⚠ The first `.584` diff painted NOT SAVED in `--alert` red, matching the two sibling banners; `phantom-rd-reviewer` caught it — red is the owner-ruled EXIT exception only, and the siblings predate that ruling. Corrected before commit. **Legacy** — shared header, same function; byte-identity revoked 2026-08-29. |
| **Lockstep** | ✅ three stamps, all `phantom-v1.14.584`, `grep -c` = 1 each; `prevVersion` = `.583`. |
| **Diff scope** | `dct-ios.html` +174/−29 · `sw.js` +1/−1 · `version.json` +4/−4 · `test/e2e/51-backup-honesty.spec.js` +219 (new). JS: 3 inline blocks, 0 failures; `node --check sw.js` OK; `version.json` parses; CSS braces 4808 / 4808 in `<style>` blocks (14291 / 14291 whole-file); `dct-ios.html` CRLF 60051 / bare LF 0, `sw.js` CRLF 314 / 0; `version.json` LF, exempt. |
| **What the spec proves (RED → GREEN)** | Run first against `.583`: all six failed on the defect each pins (timestamp written before the export finished; dismissed sheet recorded and fell through to a download; failed read `included:true`; no completion feedback; the tap threw; a double tap started a second export). Run against `.584`: six of six pass. The transport is stubbed at `navigator.share` / `triggerDownload` (WebKit-on-Windows has no share sheet); `exportAllData`, `buildBundle`, `downloadJSON` and the banner are the real code. Hard errors are asserted empty after filtering the boot-time API-probe CORS refusal (three identical entries in every test, including the one that never builds a bundle) — filtered in the spec with the reason, not added to the global allowlist. |
| **Leads, not fixed here** | (1) The six other `downloadJSON` callers (`:43292`, `:44038`, `:52420`, `:55130`, `:55146`, `:55202`) keep the cancel-falls-through-to-download behaviour — `cancelIsFinal` is passed only by the full backup, which is the only caller that records an outcome. Their own honesty pass is the next Batch 2 candidate of this class. (2) `safeGet`-backed stores whose bytes fail to parse are quarantined and read back as the fallback, which the manifest still counts as `included:true` — same class as the GhostEchoDB defect, one level down. (3) The reminder's own text still uses `innerHTML` with a fixed string (no data in it); untouched. (4) The `.583` leads (strip dot-colour `:contains()`, unreachable `PENDING CHANGES`) stand. |
| **Deviations from the handoff P0 (rev 1 §4, rev 2 §1)** | Rev 2 lists five messages: *Saving… / Saved on this device / Not saved — retry or free space / Backup file prepared / Partial backup — review missing data.* Four are used verbatim or near it. **"Saved on this device" is not used:** the share sheet's destination is the user's choice (Files, AirDrop, Mail), so the honest success line is `Backup exported HH:MM`; rev 2's own rule — *a browser download is NOT proof of a retained recoverable copy* — is the same principle one path over, and the anchor path now says exactly `Backup file prepared HH:MM — check your downloads`. The export timestamp is recorded on both success paths because the reminder measures *exports* (its own text: *Last export: Nd ago*), not verified copies. Success is a toast and failure/partial are persistent, per *"persistent feedback, not a disappearing toast."* **PARTIAL is not marked done** — the handoff did not say; chosen so the reminder keeps asking until a full backup completes. A cancelled sheet gets its own tail (*share sheet dismissed*) instead of *free space*, which would be a false hint. **Rev 2's restore-side honesty** (show what will be replaced, validate before applying, report partial/failed recovery) is a different visible surface — parked as the next P0 sub-ship, not folded into this one. |

---

## Correctness review

**First pass (`phantom-rd-reviewer`, on the initial diff): CHANGES-REQUESTED — one finding, RULE #12.** The failure state painted `#backup-remind` in `--alert` red; the ratified redesign fault channel is magenta `#ff2bd6` (`:9765`, *"NOT red — red is the owner-ruled EXIT exception only"*). The sibling banners `#storage-warn` and `#offline-banner` are red but predate the ruling. Three advisories: the failure branches warned and painted but did not toast (Contract 14's letter is warn **and** toast); the watchdog covered `indexedDB.open()` but not a hung `getAll()`; the result read sat outside the inner try. Everything else verified clean: brace balance, no TDZ, `_backupInFlight` always returns to false, no double-finish across the open/getAll/watchdog race, `downloadJSON` never rejects, the six other callers byte-for-byte unchanged, manifest/bundle honesty confirmed from live test output, success wording does not overclaim, `textContent` not `innerHTML`.

**Fixed before commit:** NOT SAVED is `#ff2bd6`; both failure branches toast `Backup not saved — tap the banner to retry` alongside the persistent banner; `ship()` (the single exit) clears the watchdog so it covers the whole read; the result read is inside the try. Spec 51 re-run: 6 / 6.

**Second pass (fresh review of the corrected diff, including the rev 2 wording): PASS.** Rule 12 fixed and verified against `:9765`; `--gold` confirmed on `:root` at `#ffd60a`; `downloadJSON` never rejects on any branch; the six other callers byte-identical; `_backupInFlight` always returns to false from every terminal path; no double-finish across the open / getAll / watchdog races (IndexedDB callbacks are always a later task, so the watchdog is assigned before any can fire); brace counter over the function → depth 0; one door (four entry points → `exportAllData` → `ship()` → `downloadJSON`); Rule 11 universal-surface carve-out. Spec 51 run twice by the reviewer, 6 / 6 both times. **Advisories, not blocking, for John's ledger:** the failure toasts use the app-wide `'error'` toast idiom, which is red (153 uses; the persistent state is magenta) — relevant only if the channel law is meant to bind toasts; SAVING reuses the banner's own violet, a debatable fit for in-flight; no watchdog on `navigator.share()` itself (user-visible OS UI, pre-existing); and `CLAUDE.md`'s locked-token table names `--vio` / `--mag` / `--gold #ffcb45` while live `:root` declares `--violet #9b59ff` / `--magenta #ff006e` / `--gold #ffd60a` — the doc is stale against the file, background context for the design-system ledger, nothing in this diff uses those names.

---

## What John actually taps (Pages URL, AFTER the promote)

**From the terminal first:**
```
.\tools\promote.ps1
```
Expected: `Served version adjudicated: phantom-v1.14.583 VERIFIED`, then the pending commits, then `SERVED: phantom-v1.14.584`. Wait for the Pages build.

**On the phone — one sequence, two looks:**
1. SYS reports **`phantom-v1.14.584`**.
2. Header **⋯** menu → **BACKUP**. The strip under the header reads **`BACKUP · SAVING…`**, then the share sheet opens. **Dismiss it** (Cancel).
   **PASS** = the strip reads **`BACKUP NOT SAVED — share sheet dismissed — tap to retry`** in magenta and stays there (a toast says the same and fades); **no second download prompt appears**.
3. **Tap that strip.** The sheet opens again → **Save to Files**.
   **PASS** = the strip disappears and a toast reads **`Backup exported HH:MM`**.
   **FAIL** (either step) = no strip appears · `SAVING…` never clears · the old behaviour (nothing said) · a download prompt after Cancel · a JS-ERROR banner.

**Then, from the terminal only — one command, either way:**
```
.\tools\verify.ps1 584 PASS
.\tools\verify.ps1 584 FAIL "what you saw"
```

---

## Suite run — targeted `phone-webkit`, `.584` bytes

```
./test/node_modules/.bin/playwright test -c test/playwright.config.js --project=phone-webkit 51-backup-honesty 05-offline

[51] during {"ts":null,"shown":true,"text":"BACKUP · SAVING…"}
[51] after {"ts":"1788961324230","shown":false,"toast":"Backup exported 08:42"}
  ok 16  ⛔ the backup is not marked done until the share sheet resolves (7.0s)
[51] dismissed {"ts":null,"shown":true,"text":"BACKUP NOT SAVED — share sheet dismissed — tap to retry","downloads":0}
  ok 17  a dismissed share sheet is NOT SAVED: persistent, never marked done, no second download (6.4s)
[51] partial {"ts":null,"text":"PARTIAL BACKUP — review missing data: GhostEchoDB:ghosts — tap to retry","ghosts":{"store":"GhostEchoDB:ghosts","included":false,"recordCount":0,"bytes":2,"error":"read failed"},"partial":true,"readFailures":["GhostEchoDB:ghosts"]}
  ok 18  ⛔ a failed GhostEchoDB read is a PARTIAL backup: the manifest says so, the file says so, nothing is marked done (6.5s)
[51] download {"ts":"1788963384249","shown":false,"toast":"Backup file prepared 09:16 — check your downloads","downloads":1}
  ok 19  no share API: the download path reports the file as prepared, never saved, and records the export (6.5s)
[51] threw {"ts":null,"shown":true,"text":"BACKUP NOT SAVED — retry or free space — tap to retry","bundles":0}
  ok 20  an exception before the bundle exists is NOT SAVED, retry or free space, and never thrown at the tap (6.0s)
[51] double-tap {"toast":"Backup already in progress","shareCalls":1}
  ok 21  a second tap while saving is refused with a toast, not silently (7.2s)

  8 skipped
  13 passed (1.9m)          ← 51: 6/6 · 05-offline: 7 passed, 8 skipped
(51 re-run alone on the FINAL bytes — after the review fixes and the rev 2 wording: 6 passed, 41.4 s)

04-storage:  20 passed · 1 skipped · 1 test.fail pin (:368) failing as pinned
50-status-honesty:  2 passed
```

⚠ **What this run cannot say:** WebKit-on-Windows has no `navigator.share`, so the real iOS share sheet — its resolve on *Save to Files*, its `AbortError` on Cancel — is exercised only through the stub. That is exactly what step 2 and step 3 on the phone are for.

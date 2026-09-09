# BATCH 1 — EVIDENCE TABLE · `phantom-v1.14.583`

**Written:** 2026-09-08 · **Ship commit:** `aa4d437` · **Baseline:** `.582` VERIFIED (`9a9d6db`), served on `release` (`2758ce9`)
**Status:** ✅ **CLOSED 2026-09-09.** Device PASS (SYS `.583`, strip `LOCAL ACTIVE | ON-DEVICE · SAVED`); owner adjudicated with the first live `verify.ps1 583 PASS` — stamp `b9d7de9`, `release` `944ba1d → b9d7de9`, `SERVED: phantom-v1.14.583`. *(The first PASS report, 2026-09-08, came before the promote and was refused on evidence — the phone was on `.582`. Recorded in `PHANTOM_CURRENT_STATE.md` §1/§8.)*

---

## Batch header

| Field | Result |
|---|---|
| Batch contents | ONE ship, `.583` — **STATUS-HONESTY**, SITE-SYNC ship 1, owner GO 2026-09-08 (*"GO on .583 STATUS-HONESTY"*). |
| `VERIFIED` / version drift | `VERIFIED` head = `.582` (`9a9d6db`); tree + `origin/main` = `.583`. **One unverified ship — the gate is AT its limit.** |
| `release` vs `main` | `release` = `2758ce9` serving `.582`. `main` = `aa4d437` carrying `.583`. The phone has `.582` until John promotes. |
| Targeted suite (`phone-webkit`) | `50-status-honesty.spec.js` (new, pinned) — **2 / 2 pass, 18.7 s.** `05-offline.spec.js` re-run — **7 passed, 8 skipped, 0 failed.** No other spec references the strip (`grep SYNCED|bw-state|ON-DEVICE|PENDING CHANGES test/e2e` → only spec 50). |
| Mechanical ship gate | **PASS** on all seven checks plus the VERIFIED gate (`phantom-ship-gate`). |
| Correctness review | **PASS** (`phantom-rd-reviewer`): data honesty, one door, channel colour unaffected, 390 px shorter than the shipped OFFLINE sibling, `?legacy` unreachable (`bw_render` is redesign-only), spec assertions pin the ruling, `navigator.onLine` shadowing is sound and ordered before the render. |

---

## Ship evidence — `phantom-v1.14.583`

| Field | Content |
|---|---|
| **Version** | `phantom-v1.14.583` |
| **Visible change** | **ONE.** Build's execution strip reads **`LOCAL ACTIVE \| ON-DEVICE · SAVED`** where it read `LOCAL ACTIVE \| SYNCED`. Offline still reads `ON-DEVICE · OFFLINE`, unchanged. |
| **Why** | `SYNCED` was written whenever `navigator.onLine` was not false and meant nothing else: no server holds site state, there is no sync queue (`bw_hasPendingWrites` `:21640` is a placeholder returning `false`), and there is no other phone to be in sync with. A technician reading SYNCED on a second phone would believe the first phone's work had reached it. Contract B10. SITE-SYNC §7.1 owns the future vocabulary and it returns only when sync exists. |
| **Anchors** | `dct-ios.html:12865` app stamp · `:22143–:22148` note · `:22149` `execState = 'ON-DEVICE · SAVED'` (same escape as the OFFLINE string at `:22139`) · `sw.js:37` cache stamp · `version.json:2,4,5` · `test/e2e/50-status-honesty.spec.js` new. |
| **Doctrine self-review** | **44px** — no touch target added, moved or resized. **Data honesty** — the new label claims only local persistence, which offline-first (Contract A9) guarantees; it is still a static default when online, not a proof of a completed write — that is the SITE-SYNC lead, not this ship's defect. **Contract 14** — no new path, no early return. **One visible change** — PASS. **Channel colour** — the `execState` span carries no class and inherits slate; the mint `LOCAL ACTIVE` is untouched. |
| **Lockstep** | ✅ three stamps, all `phantom-v1.14.583`, `grep -c` = 1 each; `prevVersion` = `.582`. |
| **Diff scope** | `dct-ios.html` +8/−2 (stamp + one block) · `sw.js` +1/−1 · `version.json` +3/−3 · `test/e2e/50-status-honesty.spec.js` +90 (new). JS: 3 inline blocks, 0 failures; `node --check sw.js` OK; `version.json` parses; CSS braces 14247 / 14247; `dct-ios.html` CRLF 59906 / bare LF 0, `sw.js` CRLF 314 / 0; `version.json` LF on both branches, exempt. |
| **Leads, not fixed here** | The strip's dot-colour rules `:59035–:59037` use `:contains()`, which no engine implements — the dot is always green. `PENDING CHANGES` is unreachable because the placeholder never returns true. A CSS comment at `:59040` still names SYNCED. All three go to the dead-CSS ledger; none touched (Contract 15 R-E, one visible change). |
| **Deviations** | None from the GO. One from the recon: Batch 2 §6 proposed `} else {`; the ship keeps `} else if (onl) {` and changes only the string — the condition is dead-but-harmless and a smaller diff wins. |

---

## What John actually taps (Pages URL, AFTER the promote)

**From the terminal first:**
```
.\tools\promote.ps1
```
Expected: `Served version adjudicated: phantom-v1.14.582 VERIFIED`, then the pending commits (`9a9d6db` stamp, `aa4d437` ship, the docs commits). Confirm with `git ls-remote origin refs/heads/release`, then wait for the Pages build.

**On the phone — one check:**
1. SYS reports **`phantom-v1.14.583`**.
2. Tap **BUILD**. Under the header, the strip reads **`LOCAL ACTIVE | ON-DEVICE · SAVED`**.
   **PASS** = exactly that, and the word SYNCED appears nowhere on Build.
   **FAIL** = SYNCED still shows, or the strip is missing or clipped at 390.
3. Optional, not required: airplane mode, re-open Build → `LOCAL ACTIVE | ON-DEVICE · OFFLINE` (unchanged behaviour).

**Then, from the terminal only — one command, either way:**
```
.\tools\verify.ps1 583 PASS
.\tools\verify.ps1 583 FAIL "what you saw"
```
`verify.ps1` stamps `VERIFIED`, pushes `main`, fast-forwards `release` and ends on `SERVED: phantom-v1.14.583`. A FAIL stamps `FAILED` with the reason, pushes `main`, and leaves `release` where it is. It refuses, writing nothing, if `.583` is not what `origin/release` and Pages carry — so it runs **after** the promote, never before. *(`stamp.ps1 583 VERIFIED` + `git push origin main` still works; it is exactly what `verify.ps1` runs.)*

---

## Suite run — targeted `phone-webkit`, `.583` bytes

```
./test/node_modules/.bin/playwright test -c test/playwright.config.js --project=phone-webkit 50-status-honesty

[50] online {"text":"LOCAL ACTIVE|ON-DEVICE · SAVED","last":"ON-DEVICE · SAVED"}
  ok 1  ⛔ online: the strip reads ON-DEVICE · SAVED, and the word SYNCED is absent (8.8s)
[50] offline {"text":"LOCAL ACTIVE|ON-DEVICE · OFFLINE","last":"ON-DEVICE · OFFLINE"}
  ok 2  offline: the strip still reads ON-DEVICE · OFFLINE, and the word SYNCED is absent (8.7s)

  2 passed (18.7s)

05-offline:  7 passed · 8 skipped · 0 failed (1.2m)
```

⚠ **What this run cannot say:** WebKit-on-Windows is not iOS Safari. Nothing in this ship depends on iOS hardware, so the phone check is confirmatory, not the only gate.

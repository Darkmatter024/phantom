# BATCH 1 — EVIDENCE TABLE · `phantom-v1.14.582`

**Written:** 2026-09-08 · **Format:** `SHIP-HANDOFF-BATCH-OODA.md` §7 *(the format is used; the doctrine is NOT in force — see Deviation 2)*
**Ship commits:** `9c03aa3` (ship) + `e643517` (review fix) · **`main` head:** `30f3822` (promote.ps1, ruling C — tools only)
**Status:** evidence delivered. **Awaiting John, in this order:** `promote.ps1` → device check on the Pages URL → `stamp.ps1`.

---

## Batch header

| Field | Result |
|---|---|
| Batch contents | ONE ship, `.582`. **Diagnostics only** — RACK-PREVIEW-CONTEXT Phase 1, Option 5 of `docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md` §5, owner-ruled 2026-09-08. Rides its own version, not `.581`. |
| `VERIFIED` / version drift | `VERIFIED` head = `.581`; tree + `origin/main` = `.582`. **One unverified ship — the gate is AT its limit, not over it.** |
| `release` vs `main` | `release` = `14028c8` serving `.581` — confirmed 2026-09-08 by `curl` of the Pages `version.json` (`"phantom-v1.14.581"`). `main` = `30f3822` carrying `.582`, in sync with `origin/main`. **The phone has `.581` until John promotes.** |
| Targeted suite (`phone-webkit`) | `49-preview-trace.spec.js` — **4 / 4 pass, 48 s.** Run block at the end. |
| Full suite | **Not re-run this session.** Last full sweep: `.581` bytes, 388 / 8 / 13 (2.8 h), none of the 8 implicating the preview path. `.582`'s executable delta is confined to `bw_mount3D`'s logging; the targeted spec plus the mechanical gate are the precheck. |
| Mechanical ship gate | **PASS on all seven checks** (`phantom-ship-gate`, read-only). Detail below. |
| Owner's checklist | §"What John actually taps", below — **after** the promote, on the Pages URL. |

---

## Ship evidence — `phantom-v1.14.582`

| Field | Content |
|---|---|
| **Version** | `phantom-v1.14.582` |
| **Visible change** | **NONE, by design.** Zero pixels, zero control flow, zero new GL contexts. What changes is what **SYS → DIAGNOSTICS** holds after a Build visit: the rack preview's silent paths now leave a record the operator can read. |
| **What it records** | Five paths in `bw_mount3D`, each as a TRACE entry in the `phantom_crash_log` ring via `preview_trace()` — `MOUNT_FAILED` (the `say()` message, which the next render wipes), `DEFERRED_AISLE_OWNS_SCREEN` and `DEFERRED_DETAIL_OWNS_SCREEN` (both CORRECT deferrals that previously vanished), `CONTEXT_LOST`, `AWAITING_LAYOUT` (a path that waits and declares nothing, by design). **Plus one health snapshot per page load**, 1200 ms after mount: `MOUNT_LIVE` or `MOUNT_NOT_DRAWING`, carrying `cvAttr`, `drawingBuffer`, `lost`, `connected` and the full `diag()` line. |
| **Anchors** | `dct-ios.html:12865` app stamp · `:22601–:22629` ship note · `:22618` `var _pvHealthLogged` · `:22630` `function preview_trace(ev, detail)` · `:22648` `MOUNT_FAILED` inside `say()` · `:22730` `DEFERRED_AISLE_OWNS_SCREEN` · `:22759` `DEFERRED_DETAIL_OWNS_SCREEN` · `:22791` `CONTEXT_LOST` · `:22795–:22833` health snapshot (`setTimeout` 1200) with `:22829` the `MOUNT_NOT_DRAWING`/`MOUNT_LIVE` line and `:22832` `HEALTH_PROBE_THREW` · `:22865` `AWAITING_LAYOUT` · `sw.js:37` cache stamp · `version.json:2,4,5`. Door: SYS panel DIAGNOSTICS row `:13593` → ERRORS sheet `:13675` / renderer `:19564`. |
| **Why it cannot hurt a healthy device** | `opts.trace` is the purpose-built channel (added `.406`, proven by the `.403` aisle hunt): a trace is **listed** by the ERRORS sheet but **excluded** from `phantom_crashErrors`, so no JS-ERROR banner. `preview_trace` mirrors `aisle_trace` (`:19733`) rather than inventing a second logging shape. The healthy snapshot is recorded **once per page load**; anomalies always. Ring is 30 entries, shared with real errors — hence not per-frame, not per-re-arm. |
| **Doctrine self-review** | **44px** — no touch target added, moved or resized. **Data honesty** — PASS: every field is a read of live state; the probe's honest bound is written into the code (it cannot prove pixels reached the screen; `readPixels` would manufacture false negatives with `preserveDrawingBuffer:false`; `getError()` is NOT called because it clears GL state). **Contract 14** — the ship removes silent paths, adds none. **`.394`** — record only, no re-arm, no re-render, no new context; `phantom_readGL` on a canvas that already holds a context returns the same one. **One visible change** — PASS by having none; the DIAGNOSTICS sheet is the surface. |
| **Lockstep** | ✅ three stamps, all `phantom-v1.14.582`: `version.json:2`, `sw.js:37`, `dct-ios.html:12865`. `grep -c` = exactly 1 each. `release:version.json` = `.581` = `main`'s `prevVersion`. |
| **Diff scope** | `dct-ios.html` +81/−1 (one stamp hunk + five hunks inside `:22598–:22862`) · `sw.js` +1/−1 · `version.json` +4/−4 · `test/e2e/49-preview-trace.spec.js` +150 (new) · `docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md` +158 (new) · `tools/promote.ps1` +51/−13 (ruling C, separate commit). No other file. |
| **Mechanical gate detail** | JS: 3 inline blocks, 0 compile failures; `node --check sw.js` OK · `version.json` parses · CSS braces 14247 / 14247 · line endings: `dct-ios.html` CRLF 59900 / bare LF 0, `sw.js` CRLF 314 / bare LF 0; `version.json` is LF on **both** branches and the guard exempts genuinely-LF files · redesign-scope grep clean. *(The gate flagged `?legacy` byte-identity for the reviewer; that guarantee was revoked 2026-08-29 — Contract 17 — so the flag is moot.)* |
| **Review that mattered** | `e643517`: the first cut called `preview_trace('DEFERRED_…', diag())` — evaluating `diag()` **at the call site, outside the instrument's try**, one line before the aisle guard's `return`, inside a block whose `catch` is empty. A throw in `diag()` would have skipped the `return` and fallen through into `rackElevation_render3D`, **re-creating the `.405` defect with the instrument built to diagnose it.** `detail` is now a thunk evaluated inside the one existing try, so every call site — present and future — is covered by construction. Pinned by test 3 below. |
| **Deviations** | **THREE, all from the handoff, none from the ship — below.** |

---

## Deviations from `SHIP-HANDOFF-CLOSEOUT-BATCH.md`

**1 · The canonical order in §0.2 is unexecutable and is superseded.** The handoff says *"device-verify (against main's live Pages URL) → stamp → promote"*. **`main` has never been served.** Pages was traced to `release` on 2026-09-08 by content match and by a last-modified six minutes after `release`'s own commit. That order is how `.581` came to be stamped VERIFIED off a dry-run misread with no phone having seen it. **Owner ruling C (2026-09-08, `30f3822`): promote → device-verify on the Pages URL → stamp either way.** `promote.ps1` Guard 4 now adjudicates the version the phone HAS, so promoting `.583` while `.582` sits unruled is still refused — the no-stacking property is unchanged, enforced where it can be. §1's own wording (*"John promotes it to release, checks the preview renders on his phone, then stamps"*) is the correct one.

**2 · "Run BATCH-OODA at full tilt" cannot be honoured as written.** `OWNER-RULINGS.md` 2026-09-05, §"⛔ NOT YET IN FORCE": BATCH-OODA becomes standing doctrine only when spec §8 is satisfied. Measured today: item 4 (`CLAUDE.md` rewritten — it still carries CALL 0), item 6 (`stamp.ps1` batch syntax — `grep -i batch tools/stamp.ps1` returns nothing) and item 7 (one batch run end to end) are unmet. *"Until then the existing ship discipline governs unchanged"* — **max ONE unverified ship.** The hook enforces it regardless: `checkVerifiedGate` refuses any `version.json` commit while `HEAD:version.json` ≠ `VERIFIED`'s first token. So Batches 2–4 got **Phase 0 recon in parallel, read-only**; nothing ships until `.582` is ruled and each batch's contents get a GO (C-5). Reported here rather than silently resolved.

**3 · The agent roster.** The handoff names seven installed agents. They exist as `.claude/agents/*.md` in the repo, but this session's harness exposes `phantom-ship-gate`, `phantom-rd-reviewer` and `ship-verifier` plus the built-ins. The mechanical gate ran as `phantom-ship-gate`; Phase 0 recon ran as forks carrying the full doctrine context. Agent PASS is advisory; John's phone is the gate.

---

## What John actually taps (Pages URL, AFTER the promote)

**From the terminal first:**
```
.\tools\promote.ps1
```
Expected output includes `Served version adjudicated: phantom-v1.14.581 VERIFIED` and `phantom-v1.14.582 is not yet adjudicated - it becomes verifiable once served`. Confirm the move with `git ls-remote origin refs/heads/release` (should be `30f3822…`), then wait for the Pages build.

**On the phone:**
1. Hard-load the Pages URL (private tab or the installed PWA). **SYS reports `phantom-v1.14.582`.** If it still says `.581`, the SW has not swapped yet — take the update and re-open.
2. **BUILD, with a Master loaded and a rack in a deployment** (the US-QRS03 shape from 2026-09-08 is ideal). Look at the RACK PREVIEW. **It may still be blank. That is expected and does NOT fail `.582`** — it is the `.391` class, pre-existing.
3. ⭐ **The one that matters: SYS → DIAGNOSTICS** (opens the ERRORS sheet).
   **PASS** = at least one entry beginning **`PREVIEW/`** is listed, **and** no red JS-ERROR banner appeared anywhere during steps 1–3.
   **FAIL** = no `PREVIEW/` entry after visiting Build, **or** a JS-ERROR banner appeared on a device that was healthy at `.581`.
4. **Report the `PREVIEW/` line(s) verbatim** — a screenshot of the sheet is enough. This is the reading the ship was flown for:
   - `PREVIEW/MOUNT_NOT_DRAWING` beside a blank pane → candidate **A** (context granted, never usable). Phase 2 is Option 1 territory, and it needs a ruling because it re-opens `.394`.
   - `PREVIEW/MOUNT_LIVE` beside a blank pane → **refutes A**, sends the hunt to **D** (paused rAF loop) — just as useful.
   - `PREVIEW/DEFERRED_*` → a guard correctly deferred; the aisle or a rack detail owned the screen. ⚠ **Expected on every BOM / OPS-tool open, not a finding:** `rd_openOpsTool` runs `bw_render` (which mounts the preview) and *then* sets `body.ops-detail`, so the rack-detail guard fires and leaves `DEFERRED_DETAIL_OWNS_SCREEN` each time — that is the P-8 duplicate-card defect (Batch 3 §4), not the iOS class. Read the line that follows a plain Build visit, not one that follows a tool open.
   - `PREVIEW/AWAITING_LAYOUT` with nothing after it → the host never got a box; the layout path, not the GPU.

**Then, from the terminal only:**
```
.\tools\stamp.ps1 582 VERIFIED
```
or `.\tools\stamp.ps1 582 FAILED -Note "…"`. **Stamp on the instrument, not on the preview** — the preview's state is the finding, not the verdict.

---

## Suite run — targeted `phone-webkit`, `.582` bytes

```
./test/node_modules/.bin/playwright test -c test/playwright.config.js --project=phone-webkit 49-preview-trace

[49] PREVIEW entries: ["PREVIEW/MOUNT_LIVE","PREVIEW/DEFERRED_DETAIL_OWNS_SCREEN"]
  ok 1  a PREVIEW record reaches the ring the operator can actually read (10.3s)
[49] {"types":["trace","trace"],"countedAsErrors":0,"bannerShown":false}
  ok 2  every PREVIEW record is a TRACE — a healthy device must never show a JS-ERROR banner (10.0s)
[49] {"escaped":false,"ringParses":true,"stringFormOk":true}
  ok 3  a throwing detail can never escape the instrument (5.4s)
[49] MOUNT_LIVE after 4 Build visits: 1 | ring size: 5
  ok 4  the ring is not flooded — the healthy snapshot is recorded once, not once per visit (21.3s)

  4 passed (48.2s)
```

## Device walk, reproduced with real taps — `phone-webkit`, `.582` bytes (2026-09-08, after the promote)

The owner's first device pass read *"No errors recorded"* with a Master loaded. Replayed with real dock and SYS taps (session-local spec `99-582-device-walk.spec.js`, not landed — copy in the session scratchpad, offered for landing). **4 / 4 pass, 1.1 min.**

| # | Device state seeded | Build's first card | `PREVIEW/` cards rendered in the ERRORS sheet | SYS row |
|---|---|---|---|---|
| 1 | Master + active deployment + one pending rack; **launch only**, no Build tap | `Active rack` — built behind the picker, canvas none | `DEFERRED_DETAIL_OWNS_SCREEN` | NONE |
| 2 | same, then **tap BUILD**, wait 3 s | `Active rack`, canvas 652×640 | `MOUNT_LIVE · cvAttr=652x640 drawingBuffer=652x640 lost=false connected=true …` plus the launch's DEFERRED line | NONE · no banner · 0 caught |
| 3 | Master + active deployment, **no racks**; tap BUILD | `Build overview`, no card | none — *"No errors recorded"* | NONE |
| 4 | Master, **no deployment**; boot lands on Command; tap BUILD | `Build overview`, no card | none — *"No errors recorded"* | NONE |

**Reading:** the sheet renders traces (rows 1–2), and a healthy mount always leaves `MOUNT_LIVE`, so *"No errors recorded"* on `.582` bytes is row 3 or row 4 — **no active deployment with a blocked, active or pending rack on that device** — or the phone was still on `.581`. ⛔ **Correction to the DEFERRED note above and to `35418c3`'s commit message:** the `.571` launch does NOT skip the instrument. With a live rack it builds the card behind the picker and leaves `DEFERRED_DETAIL_OWNS_SCREEN` with no Build tap at all (row 1). The empty sheet is a missing rack, not a missing tap.

**The device check, corrected:** SYS reads `.582` → BUILD → the first card must read **Active rack** with the preview pane. If it reads *Build overview* or *Rack queue*, there is no rack to preview: open the deployment and trace a rack first. Wait ~3 s on that screen without opening a tool, the aisle or a rack detail → SYS → DIAGNOSTICS → a `TRACE · PREVIEW/MOUNT_LIVE` or `MOUNT_NOT_DRAWING` card. **Either is PASS.**

Harness artifact, not app: the SYS health ping's OPTIONS request to the Worker is refused for the `127.0.0.1` origin (CORS) and logs console errors; the ring holds 0 caught errors and no banner shows, so it is environment noise and is not in the benign list.

## Device result — 2026-09-08, owner's iPhone, served `.582`

**PASS.** BUILD with the *Active rack* card up; SYS → DIAGNOSTICS reads **`PREVIEW/MOUNT_NOT_DRAWING`**. The instrument reaches the sheet on hardware, and where the harness reads `MOUNT_LIVE` at `652x640` the phone reads the defect: **candidate A**, a context granted but never usable. Owner stamping VERIFIED on the instrument. ⚠ Payload (`cvAttr` / `drawingBuffer` / `lost`) to be appended verbatim when reported — it decides whether Phase 2 is the never-granted shape (`drawingBuffer=0x0 lost=false`), a loss between mount and probe (`lost=true`), or the layout path (`cvAttr=0x0`).

⚠ **What this run cannot say:** WebKit-on-Windows is not iOS Safari. The harness reports `MOUNT_LIVE` because its GPU grants synchronously; **whether candidate A presents as `drawingBuffer 0` on a real iPhone is exactly what is unknown**, and only step 4 above answers it.

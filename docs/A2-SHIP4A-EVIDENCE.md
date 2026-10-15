# A.2 SHIP 4a — EVIDENCE · the photos adapter, and an async fold

**Written:** 2026-10-15. **Status:** ⏳ **BUILT AND PROVEN ON BRANCH `a2/ship4a-photos`.** It is **not on `main`** and **not version-bumped**.
- `.594` is unadjudicated (`VERIFIED` line 1 = `.593`), so the guard refuses any `.595` bump.
- The branch carries the code and the tests at the `.594` stamps; landing is §7.
- Nothing about this ship reaches staging or the phone until `.594` is ruled.

**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md` §1 item 4, §3, §5 (amended by Q-30). **Phase 0 (the build spec):** `docs/A2-SHIP4-PHASE0-EVIDENCE.md`.
**Rulings:** `OWNER-RULINGS.md` 2026-10-15 **Q-28…Q-38 as recommended** (owner's words: *"Good to go"*) · 2026-09-17 Q-10…Q-27 and Q-A · 2026-09-15 Q-1…Q-9 · 2026-09-14 (the composite is the rack key).
**Baseline:** `main` @ `a1e7146`, `dct-ios.html` at **`phantom-v1.14.594`**, 61,040 lines.
**Built by:** a cloud Claude session on Linux, Chromium 141 under Playwright 1.56.1 — **not the laptop's Claude Code.** `core.hooksPath tools/githooks` was set in this clone, so the pre-commit guard ran on every commit made here.
⚠ **GATE ENGINE `laptop-chromium` (Q-38).** WebKit cannot be downloaded in this environment (egress policy) and is blocked on the laptop (Smart App Control). **The only WebKit gate for this ship is John's Safari look, §6** — and its step 1 is the one check no harness here can make.

---

## 1 · What changed

| File | +/− | Anchors |
|---|---|---|
| `dct-ios.html` | **+172 / −17** | **all inside the A.2 block** (`// A.2 RACK RECORD ASSEMBLER` … `// ── END rrdev`) |
| `test/e2e/65-rack-record-assembler.spec.js` | **+443 / −69** | 11 new tests; the Ship 1–3 tests awaited |
| `docs/A2-SHIP4A-EVIDENCE.md` | new | this file |

**In `dct-ios.html`** (lines on the branch):
- header note: `// SHIP 4a: photos adapter over IndexedDB, and the fold becomes ASYNC` (`:31618`);
- **`var RR_ADAPTER_PHOTOS`** (`:31805`), declared above `PHANTOM_RR` like blockers and notes;
- **registry** gains `RR_ADAPTER_PHOTOS` fifth;
- **`assemble: async function(rackId)`**: `forEach` became a `for` loop so each `read()` can be awaited. Every other line of the fold is byte-identical;
- **derivation** `// P6 — photo count, bytes and refs`, beside `openBlockers`. `status.photoCount`, `status.photoBytes` and `evidence.photoIds` now come from it, not from literals;
- **readout** awaits `PHANTOM_RR.assemble(asked)`, drops a stale pick, prints `assembling…` while it waits, and prints `ASSEMBLY FAILED — …` with a `console.warn` on rejection.

⛔ **Untouched, verified by hunk position and by review:** `photo_persist`, `photo_getDB`, `photo_getCountForRack`, `photo_getAllForRack`, `photo_deletePhoto`, gallery, viewer, `deploy_generateReport`, every storage writer, every nav, `sw.js`, `version.json`, and the three stamps.

---

## 2 · How each ruling landed

| Q | Where |
|---|---|
| **Q-28** safe pure read | version-less `idb.open(self.DB)`. `onupgradeneeded` with `oldVersion === 0` → `transaction.abort()`; the `AbortError` → `empty`. Never `photo_getDB()`. Pinned by **FRESH DEVICE** (no database after assembly, then `photo_persist` + `photo_getCountForRack` = 1) |
| **Q-29** async fold | `assemble` returns a Promise; sequential `await` in registry order; a rejection is one `error` row. Pinned by **ASYNC** (a slow adapter and a rejecting one inserted mid-registry) |
| **Q-30** split | this is 4a: the readout stays and gains the photos row. 4b removes it |
| **Q-31** match key | `rows.filter(… p.rackId === rackId)` over `getAll()`, no index, no `siteId`. Pinned by **SCOPING**: `_1`/`_10`, foreign deployment, `''`, and a record whose `siteId` disagrees with the split |
| **Q-32** watchdog | `timeoutMs: 15000`, a property a test shortens to 300 ms. A database without its store → `error`. Pinned by **ERROR**: no IndexedDB, failed open, hung open, storeless database |
| **Q-33** payload | `data: { photoId, bytes }`. Pinned by **TIMELINE** (exact keys) and **PURE READ** (no `blob`, `caption`, `w`, `h` key in the Record) |
| **Q-34** photoIds | dated in timeline order, then undated. Pinned by **DERIVED** |
| **Q-35** photoBytes | `null` unless every counted photo has a finite size; row detail `N photo(s) have no stored size — the byte total is not taken`. Pinned by **SIZE MISSING** |
| **Q-36** deletions | recorded in the adapter comment; no row caveat |
| **Q-37** grep gate | 4b's |
| **Q-38** gate engine | `laptop-chromium` + §6 |

---

## 3 · Proof — all on `laptop-chromium`

### RED — the new spec 65 against the unchanged `.594` app
**18 failed / 19 passed** (2.8 m). Every red failed for the missing feature and nothing else:
- `photoCount` reads `null`, not `0`;
- there is no `photos` coverage row;
- the registry has four adapters;
- `assemble()` is not a Promise;
- the readout lines lack `· photos …`.

**All 19 Ship 1–3 tests passed with `await` added** — the helper's `Promise.resolve()` takes `.594`'s synchronous return unchanged — so the conversion itself changes no assertion.

### GREEN
**37/37** (1.5 m), first on the build and again on the final source after the two post-review edits (§4).

### D-1 — a defect the tests found during GREEN, fixed before any commit (probe P10)
The first cut resolved inside `getAll`'s `onsuccess` and called `close()` there. The **PURE READ** test then saw `blocked` on an immediate version upgrade.

A throwaway probe isolated it. Probe P10 is this ship's, not Phase 0's — Phase 0 stops at P9:
- seed → assemble → versioned open: **`blocked: true`**;
- seed → snapshot → versioned open: **`blocked: false`**;
- seed → assemble → snapshot → versioned open: **`blocked: false`**.

So the connection did close, but only once its read transaction finished. A close requested before that is merely pending, and an upgrade landing in that window counts the connection as open.

**Fix:** the answer is delivered on `tx.oncomplete`, so `assemble()` resolves only after the connection is truly gone. The test now checks immediately after assembly, the strict case. **Mutation M11** puts the old behaviour back and is caught.

### Mutation checks — each applied by script, spec 65 run alone, file restored and sha256-checked
GREEN sha256 at the time: `76dfac5c…94313c54`. Every restore matched it byte-exact.

| # | Mutation | Caught by |
|---|---|---|
| M1 | no abort on `oldVersion 0` | 9 red, incl. **FRESH DEVICE** (the open leaves a storeless database → `error`) |
| M2b | open at version 1 and create the store (what `photo_getDB` does) | **FRESH DEVICE** — a database now exists after assembly |
| M3b | prefix match on `rackId` | **SCOPING** |
| M4b | also require `siteId` = the split | 5 red: **TIMELINE**, **SCOPING**, **DERIVED**, **SIZE MISSING**, READOUT |
| M5 | missing size → `0` | **SIZE MISSING** |
| M6 | payload gains `caption`, `w`, `h` | 6 red |
| M7 | `error` collapsed to `empty` | **ERROR** |
| M8 | watchdog removed | **ERROR** (the hung open never settles) |
| M9 | no `db.close()` | **PURE READ** (`blocked`) |
| M10 | `read()` not awaited | 15 red |
| M11 | resolve on request success (D-1's first cut) | **PURE READ** |
| M12 | partial sum over sized photos | **SIZE MISSING** |
| M13 | undated ids listed first | **DERIVED** |
| M14 | empty → `null`/`null` | 3 red, incl. **RECORD**, **FRESH DEVICE** |

⚠ **Recorded rather than hidden:**
- **The first M2 was built wrong.** It opened at version 1 but left the adapter's abort in place, so it never created a database. Only the storeless-database case caught it. It was replaced by M2b, which is faithful.
- **M3 and M4 first errored.** Their anchor matched twice, because the phases adapter has the identical filter line. M3b and M4b use the photos adapter's own `var mine = rows.filter(…)` line.

### Regression — each spec alone, `laptop-chromium`, final 4a source unless marked

| Spec | 4a | Untouched `.594` (worktree, same box, same day) |
|---|---|---|
| `64-report-engine-characterization` | **8/8** — report output unchanged | — |
| `00-boot` | **4/4** | — |
| `63-handoff-readiness-gate` | **5/5** | — |
| `12-blockers` | **8/8** | — |
| `13-phase-model` | **13/13** | — |
| `27-rack-capabilities-in-build` | **8/8** | — |
| `26-rack-detail-surface` | **4/4** | — |
| `59-image-compression` (shares `photo_*` code) | **7/7** | — |
| `61-image-storage-safety` | **5/5** | — |
| `01-nav` | 12 p / 6 s / **1 f** at `:307` | **identical** — 12 p / 6 s / 1 f at `:307` |
| `98-cmd-census` | 26 p / **1 f** at `:365` | **identical** — 26 p / 1 f at `:365` |
| `04-storage` | over 4 runs: **1 pass, 3 fail** at `:461` | over 5 runs: **2 pass, 3 fail** at `:461`, **identical error** |

⭐ **`04-storage :461` is a pre-existing race, not this ship.** The error, every time, is `ReferenceError: PHANTOM_BACKUP_EXCLUDED_KEYS is not defined` at spec `:515`. That line is a `page.evaluate` right after `driveRestore`. The restore reloads the page, and the evaluate can land in the new document before its script has defined the constant. It is the same red the laptop has carried since 2026-09-21. It is intermittent, and it fails on untouched `.594` as readily as on 4a. 4a adds no boot-time code: the adapter is a declaration, and nothing calls `assemble` without `?rrdev=1`. **Lead L-9.** `:605`, the laptop's other red, passed on every run here.

---

## 4 · Integrity and review

- **Syntax:** all 3 inline scripts pass `node --check` (extracted).
- **Lockstep:** the stamps are unchanged at `.594` on all three files. They agree, and the bump is §7's.
- **`rrdev` hits:** 8, all inside the readout block. One is the new `[rrdev] assemble failed` warning. 4b removes them all.
- **Reviews.** Independent agents that had not seen the work ran from the repo's own definitions (`.claude/agents/*.md`), read-only:
  - **`adapter-reviewer`: PASS.** All 7 contract items pass, each with lines cited.
  - **`surgical-edit-reviewer`: APPROVE.** Every hunk is inside the A.2 block, the fenced surfaces are byte-identical, and no off-token colour or dependency was added.
  - **`data-honesty-auditor`: PASS.**
- **Acted on after review:**
  - the code comment and the spec both cited "Phase 0 probe P10", which does not exist; both now cite this document;
  - the readout now says `assembling…` instead of sitting blank during a slow read.

  Spec 65 was re-run after both: **37/37**.
- **Advisories, recorded and not acted on** (§5): `''` reads `empty`/0, the `.then` success handler is not itself guarded, and `assembledAt` is stamped after the photo read.

Agent approval is advisory; **John's device verify is the only ship gate.**

---

## 5 · Interpretations and deviations — each is the owner's to strike

- **D-1** Answer on `tx.oncomplete`, not on request success (§3). This is a change from Phase 0 E-5 step 4, which said to close after `getAll`.
- **D-2** The readout prints `assembling…` while it waits. This is a dev-surface line that did not exist before; 4b deletes it.
- **D-3** `assembledAt` is stamped when the Record is built, which is after the photo read — up to the 15 s watchdog later than the localStorage reads. Unchanged code; recorded because the read is no longer instant.
- **D-4** `rackId === ''` reads `empty`, and the counts are therefore `0`. This is the Ship 2 and Ship 3 guard (I-3), kept for consistency. The readout cannot send `''`.
- **D-5** The pure-read tests leave `phantom_tab_presence_v1` out of the localStorage compare. The app's presence beacon writes it every 30 s, and assembly now awaits, so the beacon can land between the two snapshots. The reviewer traced every writer of that key and found none in the A.2 block.
- **D-6** Built in a cloud session, not by the laptop's Claude Code. The same rules, hook and reviewers applied. The laptop's graphify was not available here; `dct-ios.html` is read from source by ruling anyway.

---

## 6 · THE ONE LOOK — after landing, a Safari tab on staging (ruling Q-8)

**Use a Private tab for step 1: it has fresh storage.** Load a Master and create a one-rack deployment.

1. **The fresh-device check — WebKit only, and the reason this ship splits.**
   - Open `…/dct-ios.html?rrdev=1`, pick the rack. The coverage line ends `· photos empty`.
   - Close the readout. Go to Build → that rack → **Photo** → take one photo.
   - **PASS:** the toast reads `PHOTO SAVED`.
   - **FAIL:** `PHOTO NOT SAVED`, or the Photo action doing nothing. That would mean WebKit left a database behind where Chromium does not.
2. **Count and size.**
   - Take a second photo, open the gallery, and note its title `PHOTOS · <rack> · 2 · X.X MB`.
   - Re-open `?rrdev=1` and pick the rack.
   - **PASS:** `photos ok (2)`; JSON `status.photoCount` `2`; `status.photoBytes ÷ 1048576` rounds to `X.X`; `evidence.photoIds` has 2 ids; two `photo.captured` events with numeric `t`; phase, `openBlockers` and the notes row unchanged.
3. **Delete.** Delete one photo in the viewer, then re-pick: `photos ok (1)`, `photoCount` `1`.

**FAIL on any of these:**
- `photos error`;
- a count that differs from the gallery title;
- a `blob`, `caption`, `w` or `h` anywhere in the JSON;
- an event without a numeric `t`;
- any trace of the readout without the param.

---

## 7 · Landing — only after `.594` is adjudicated

1. `.594` gets its ruling: John's `PASS 594 — stamp and promote`, or `FAIL 594`. If `.594` FAILS, Ship 3 is repaired first and this branch rebases onto the repair.
2. Rebase `a2/ship4a-photos` onto `main`, then bump the three stamps to `phantom-v1.14.595`:
   - `dct-ios.html:12879` `PHANTOM_APP_VERSION`;
   - `sw.js:37` `CACHE_VERSION`;
   - `version.json` `version` / `prevVersion` / `released`, plus notes drafted from §1–§3 and §6.
3. Commit through the guard, push `main`, and confirm staging serves `.595`.
4. John's look (§6). Stamp, promote, then 4b.

---

## Q · Found, not worked

- **L-9** `04-storage :461` races the post-restore reload (§3). It is a test defect: the evaluate needs to wait for the reloaded document. It is the laptop's standing red, and it reproduces on untouched `.594`.
- `01-nav :307` (the nav blocker badge did not appear) and `98-cmd-census :365` (`#cs-fieldtools` visible "on the phone" at 1366 px) fail identically on untouched `.594`. They are the Ship 3 baseline reds, still unexplained.
- Phase 0 leads L-1…L-8 stand. **L-1** — BACKUP breaks Ghost Echo on a fresh device — is the one live in the promoted app.

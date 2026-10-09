# PLAYWRIGHT BASELINE — PINNED

**This is the reference every subsequent suite run compares against.** Owner ruling 2026-09-10: *"Schedule the full 430-run on an idle box as its own task, and its result becomes the pinned baseline every subsequent run compares against. Not folded into another ship."*

⛔ **THIS IS A CI-ONLY PIN (owner ruling 2026-09-13).** The ruling's intent stands — one scheduled full run, its own task, nothing folded in — but *"on an idle box"* has been overtaken by the machine: the build laptop OOM-kills a full run and cannot produce a comparable one. **There is exactly one pin and it is the CI run.** No Windows pin is maintained, a laptop result is not comparable to this one, and a second pin is not to be re-introduced — two references is how a baseline stops being a reference.

> **A run is clean if its FAILING SET is a subset of the entries below that are still open. Anything else is new and belongs to whatever changed.** ⛔ Entry 2 is FIXED, so a healthy run now shows **at most one** failure, not two — read the names, never the total.

---

## Provenance

| | |
|---|---|
| Commit | **`1e505b5`** on `main` |
| App bytes | `phantom-v1.14.589` — `VERIFIED`, promoted, `release` = `main` at the time of the run |
| Command | `npx playwright test --project=phone-webkit --workers=1 --reporter=list,json` (all 62 spec files) |
| Started / ended | 2026-09-13, CI run **#6** (`34783368284`), **50 min** · exit **1** |
| Conditions | **GitHub Actions `ubuntu-latest`, one worker, no sharding.** ⛔ **THIS PIN MOVED FROM WINDOWS TO CI, AND THAT WAS FORCED, NOT PREFERRED.** The previous pin was a Windows-on-an-idle-box run; this laptop can no longer produce one — it OOM-killed a 38-spec PREFIX on 2026-09-13, which is the same wall `docs/TEST-SUITE-RECOVERY-PLAN.md` records being hit three times. A pin nobody can reproduce decays into folklore, so the reproducible surface becomes the reference. |
| Harness | `fixtures.js` **with** the AI-proxy route intercept (`72e0630`). A baseline taken before that commit is not comparable. Failure names are emitted as `::error::` annotations by `test/ci-report-failures.js` — readable without auth, which is what makes a by-name comparison possible at all |

⚠ **The tree HAS moved since this run, and one app byte changed.** `11ce5bb` reworded a comment in `dct-ios.html` — the very comment that caused failure 2 — so a re-run should now show entry 2 green. That is the only app change since `1e505b5`; `git diff 1e505b5..HEAD` over `sw.js`, `version.json`, `manifest.json`, `index.html` and `icons/` is empty. ⛔ **This pin therefore records the run that FOUND the blind spot, not a clean run.** Re-pin from the next CI run to get a clean reference.

## Result

| | |
|---|---|
| **Passed** | **466** |
| **Skipped** | 14 |
| **Failed** | **2** |
| Total | 482 |

⭐ **Zero pinned defects passed.** `"Expected to fail, but passed"` appears **0** times, so no `test.fail()` pin was silently fixed by recent work — a real check, since that string is the repo's own signal that a defect closed without anyone noticing.

---

## The two failures, classified

The classification is not a judgement call: it comes from **three runs** — a contended full run, this clean full run, and an isolation run of spec 37.

| # | Test | Kind | Class |
|---|---|---|---|
| 1 | `01-nav.spec.js:399` — *`?legacy=1` does not stick across a reload* | assertion | **LOAD-DEPENDENT FLAKE** — passes in isolation on this laptop |
| 2 | `38-context-engine.spec.js:129` — *no AI call site still bypasses the choke point* | assertion | **✅ FIXED at `11ce5bb`, NOT a standing failure** |

⛔ **NEITHER OF THESE WAS ON THE PREVIOUS PIN, AND ALL FOUR OF ITS ENTRIES PASSED.** That is the
whole reason this document exists in by-name form, and it is worth stating what it caught.

**1 · `01-nav:399` — flake, load-dependent.** Passed on this laptop in isolation immediately after
the CI failure. Same class as the rack-pose pair below: it fails under accumulated load and passes
alone. ⚠ Not investigated further; if it recurs in consecutive CI runs it stops being a flake.

**2 · `38-context-engine:129` — A REAL BLIND SPOT, FOUND AND FIXED, and the cause was a COMMENT.**
The spec strips comments before counting call sites, and it strips BLOCK comments first. A line
comment introduced by the `.589` image-input ship ended with the literal text `image/*.`, so that
`/*` opened a block comment as far as the stripper was concerned and ran to the next `*/` — a regex
92 lines later. **4,713 characters of real code were swallowed**, including
`var _system = buildContext({ surface: 'va' })`, a perfectly good call site the guard could no
longer see. The count read 6 where 7 was required. ⛔ **The app was never wrong** — in JavaScript
that `/*` is inert inside a `//` line, the browser parses it correctly and `node --check` passes.
What was wrong is that a guard built to catch AI call sites bypassing the choke point had a
4,713-character blind spot. Bisected across the session’s commits: 7 sites at `ded1f6b`, 7 at
`7ef2729`, 7 at `10d8d2c`, **6 at `4350d34`**. Fixed by rewording the comment (`11ce5bb`); count
restored to 7, spec 7/7.

⚠ **THE SAME SHAPE IS STILL PRESENT AND UNFIXED AT `dct-ios.html:53133`** — `// … ./vendor/*`
same-origin assets*. Its swallowed region happens to contain no counted call site, so every
source-scanning spec passes over it today. **It is latent, not safe**, and it will bite whenever the
code between it and the next `*/` changes.
⚠ **AND THE DEEPER FRAGILITY IS THE STRIPPER**, shared by specs 38, 39, 56, 57, 58, 61 and 62:
stripping block comments BEFORE line comments means any `//` line containing `/*` can blind any of
them. Fixing that is a harness change across seven files and has not been done.

### What the PREVIOUS pin listed, and where each entry went

| Old # | Test | Status at this pin |
|---|---|---|
| 1 | `10-site-profile-root.spec.js:84` | ✅ **RESOLVED** — re-pointed at `92f6d37` (2026-09-10) to the contract `.538` actually shipped. 18/18 green. The old pin was stale by this entry and a run was mis-read as "same names as the baseline" because of it. |
| 2 | `37-locked-rack-pose.spec.js:141` | **PASSED this run.** Root-caused and FIXED, but the fix is **parked** at `955608a` by owner ruling 2026-09-13 and is NOT on `main`. Expect intermittent failure until it is unparked. |
| 3 | `37-locked-rack-pose.spec.js:179` | **PASSED this run.** Same as above. |
| 4 | `39-sw-update-path.spec.js:64` | **PASSED this run.** Was classified a flake; consistent with that. |

⭐ **THE RACK-POSE PAIR IS NO LONGER "ORDER-DEPENDENT, NEEDS A PRODUCT CALL" — IT IS DIAGNOSED.**
Nothing leaks state between specs. `_ease` converged a flat **0.14 per frame** and set an axis
exactly only under `LOCK_SNAP`, so a walk-exit gap needed ~56 frames — under a second at 60fps,
**~21 seconds** at the ~2.7fps a harness renders. The pose was **approached, not installed**, and
its resting value depended on the frame budget; earlier specs starve that budget, which is the
entire reason it looked like test ORDER. Fix: ease from elapsed **seconds** plus a 1.6s deadline.
Proven `5/5 RED → 5/5 GREEN` by `54-pose-frame-starvation.spec.js`, which starves the frame budget
deterministically instead of waiting for the machine to do it. **Parked, not merged.**

### APPENDIX — the retired Windows pin's evidence (HISTORICAL, and three of its conclusions were WRONG)

⛔ **NOTHING BELOW IS EVIDENCE FOR THE CURRENT PIN.** It is kept because the measurements were expensive to obtain and remain useful, and because anyone who meets this analysis quoted elsewhere should be able to find where it was corrected. **The numbers held; the conclusions did not.** Read it as history, never as current state.

| Test | Contended full run | Clean full run | Isolated |
|---|---|---|---|
| `10-…:84` | fail | fail | — |
| `37-…:141` | fail | fail | **pass** (4/4) |
| `37-…:179` | fail | fail | **pass** (4/4) |
| `39-…:64` | **pass** | fail | — |

**1 · siteLead — the chain is still worth reading; the verdict is not.** `res.filled` returned `["id"]` where the test wanted `siteLead`. The seed was **deliberately deleted at `v1.14.538`**, and `dct-ios.html` carries the deletion verbatim with *"⛔ Do not restore it."* The chain: `.474` removed Site Lead from Site Setup → the migration's escape clause pointed at a door that no longer asked → the seed quietly became the only writer of site authority → `.537` built the SITE/SYSTEM door → `.538` removed the seed. **The test asserted deliberately removed behaviour.**
❌ **ITS VERDICT — *"Not fixed, not re-pointed, not pinned — that is a harness ship needing its own GO"* — IS FALSE AS OF 2026-09-10.** It WAS re-pointed, at `92f6d37`, to the contract `.538` actually shipped; 18/18 green. ⛔ **That stale verdict is exactly what let a later run be reported as "same names as the baseline" when only three of the four could still fail.**

**2 and 3 · rack pose — the numbers were right and the diagnosis was wrong.** Both reproduced in two independent full runs and both passed 4/4 with spec 37 alone. The yaw test failed at `fwd.x 0.00048` in one run and `0.00023` in another against a `< 0.0001` floor — same direction, different magnitude. The position test wanted `-4.7` to five decimals and got `-4.69565`, off by `0.00435`.
❌ **THE CONCLUSION DRAWN FROM THIS — *"something earlier in the suite leaves camera state behind"* — IS WRONG.** Nothing leaks state between specs. `_ease` converged a flat **0.14 per frame** and set an axis exactly only under `LOCK_SNAP`, so a walk-exit gap needed ~56 frames: under a second at 60fps, **~21 seconds** at the ~2.7fps a harness renders. The pose was **approached, not installed**, and its resting value depended on the **frame budget** — which earlier specs starve. The varying magnitudes the old note read as *"accumulated drift"* were varying frame counts.
❌ **AND ITS OPEN QUESTION — *"two readings, and choosing between them is a product call"* — WAS ANSWERED the same day.** Owner ruling 2026-09-10: *"it's a real defect, the tolerance stands."* Fixed, proven `5/5 RED → 5/5 GREEN` by `54-pose-frame-starvation.spec.js`, and **parked** at `955608a` by owner ruling 2026-09-13.

**4 · SW update path — this one held up.** A 45-second timeout **while setting up the page**, not an assertion, and it **passed in the other full run**; the six tests immediately after it in the same file all passed. Classified a flake, and it **passed in CI run #6** — consistent.

---

## How to use this pin

1. **Read the run’s `::error::` annotations, not its count.** `test/ci-report-failures.js` emits one per failure carrying `file:line` and title, plus a `FAILING SET` roll-up, and they are readable from the check-runs API **without authentication**. Before that existed, the names went only to `$GITHUB_STEP_SUMMARY` and the artifact — both auth-walled — so a count was all a tool could read, and a count cannot tell a clean run from a regression wearing the right number.
2. Compare against the two above **by name**, not by count. ⛔ **`2 failed` is NOT automatically clean** — entry 2 is FIXED, so a healthy run should now show at most entry 1. A different member is a regression regardless of the total.
3. Anything not on the list belongs to whatever changed since `1e505b5`.
4. ⛔ **DO NOT RUN THE FULL SUITE ON THE BUILD LAPTOP.** It OOM-kills — measured again on 2026-09-13 on a 38-spec PREFIX, and `docs/TEST-SUITE-RECOVERY-PLAN.md` records three earlier kills. CI is the only surface that can produce a comparable run. Isolated specs and small groups are still fine locally and are how a flake gets classified.
5. **Re-pin when an app or harness byte changes** and the new result has been explained. ⚠ **Explained is the operative word** — the previous pin went stale because entry 1 was fixed on 2026-09-10 and the pin was not updated, which let a later run be reported as "same names as the baseline" when that was no longer possible.

## What is open, and none of it is fixed here

- ✅ **siteLead — CLOSED.** Re-pointed at `92f6d37` (2026-09-10) to the contract `.538` actually shipped. 18/18 green.
- ⛔ **The rack-pose fix is PARKED, by owner ruling 2026-09-13.** It is root-caused, written and proven `5/5 RED → 5/5 GREEN` on `fix/rack-pose-determinism-v2` @ `955608a`, and it is deliberately NOT on `main`. **Unparking needs a GO**, and if it is ever unparked it still owes the full single-process suite run, which is CI’s job.
- ⭐ **"The order dependence itself" is ANSWERED and the old wording here was wrong.** The suite does **not** carry state between specs. The pose landing was **frame-counted**, so its resting value depended on the frame budget, and earlier specs starve that budget — load, not leaked state. Anything else in this suite that "passes alone and fails after 400 others" should be tested against that hypothesis first: starve the condition deliberately and see whether it reproduces, rather than hunting for shared state.
- ⚠ **`01-nav.spec.js:399` is unclassified beyond "flake".** It passed in isolation immediately after failing in CI; nobody has starved its condition on purpose. If it recurs in consecutive CI runs it needs the same treatment the pose defect got.
- ⚠ **`dct-ios.html:53133` carries the comment-stripper trap** (`// … ./vendor/*`) and is latent, not safe. And the stripper itself — block comments removed BEFORE line comments, shared by specs 38, 39, 56, 57, 58, 61, 62 — means any `//` line containing `/*` can blind any of them. Neither is fixed.

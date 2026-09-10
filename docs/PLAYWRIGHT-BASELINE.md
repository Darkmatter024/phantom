# PLAYWRIGHT BASELINE — PINNED

**This is the reference every subsequent suite run compares against.** Owner ruling 2026-09-10: *"Schedule the full 430-run on an idle box as its own task, and its result becomes the pinned baseline every subsequent run compares against. Not folded into another ship."*

> **A run is clean if it reproduces exactly the four failures below. Anything else is new and belongs to whatever changed.**

---

## Provenance

| | |
|---|---|
| Commit | **`5723ac3`** on `main` |
| App bytes | `phantom-v1.14.586` — `VERIFIED`, promoted, `release` = `main` at the time of the run |
| Command | `npx playwright test --project=phone-webkit --reporter=line` (all 55 spec files) |
| Started / ended | 2026-09-10 **15:21:58Z** → **16:30:56Z** (**1.1 h**) · exit **1** |
| Conditions | **Idle box.** Nothing else running — no browser, no second Playwright, no measurement script |
| Harness | `fixtures.js` **with** the AI-proxy route intercept (`72e0630`). A baseline taken before that commit is not comparable |

⚠ **The tree has moved since, but only documentation.** `git diff 5723ac3..HEAD` over `dct-ios.html`, `sw.js`, `manifest.json`, `version.json`, `index.html`, `icons/` and `test/` is **empty**. The pin stays valid until an app or harness byte changes.

## Result

| | |
|---|---|
| **Passed** | **413** |
| **Skipped** | 13 |
| **Failed** | **4** |
| Total | 430 |

⭐ **Zero pinned defects passed.** `"Expected to fail, but passed"` appears **0** times, so no `test.fail()` pin was silently fixed by recent work — a real check, since that string is the repo's own signal that a defect closed without anyone noticing.

---

## The four failures, classified

The classification is not a judgement call: it comes from **three runs** — a contended full run, this clean full run, and an isolation run of spec 37.

| # | Test | Kind | Class |
|---|---|---|---|
| 1 | `10-site-profile-root.spec.js:84` — *migration seeds siteLead from the one name on record* | assertion | **STANDING — stale test, not an app defect** |
| 2 | `37-locked-rack-pose.spec.js:141` — *every rack lands on the SAME pose* | assertion | **ORDER-DEPENDENT** |
| 3 | `37-locked-rack-pose.spec.js:179` — *leaving WALK AISLE returns to an identical pose* | assertion | **ORDER-DEPENDENT** |
| 4 | `39-sw-update-path.spec.js:64` — *a message handler must exist to promote on demand* | **timeout**, 45 s during page setup | **FLAKE** |

### The evidence behind each class

| Test | Contended full run | Clean full run | Isolated |
|---|---|---|---|
| `10-…:84` | fail | fail | — |
| `37-…:141` | fail | fail | **pass** (4/4) |
| `37-…:179` | fail | fail | **pass** (4/4) |
| `39-…:64` | **pass** | fail | — |

**1 · siteLead — standing, and already diagnosed.** `res.filled` returns `["id"]` where the test wants `siteLead`. The seed was **deliberately deleted at `v1.14.538`**, and `dct-ios.html` carries the deletion verbatim with *"⛔ Do not restore it."* The chain: `.474` removed Site Lead from Site Setup → the migration's escape clause pointed at a door that no longer asked → the seed quietly became the only writer of site authority → `.537` built the SITE/SYSTEM door → `.538` removed the seed. **The test asserts deliberately removed behaviour.** Already on record at `PHANTOM_CURRENT_STATE.md:1476` as *"failing, not pinned, despite the handoff calling it resolved."* ⛔ Not fixed, not re-pointed, not pinned — that is a harness ship needing its own GO.

**2 and 3 · rack pose — order-dependent, and this is the finding worth having.** Both reproduce in **two independent full runs**, and both **pass 4/4 when spec 37 runs alone**. So something earlier in the suite leaves camera state behind. They are also **not deterministic**: the yaw test failed at `fwd.x 0.00048` in the first run and `0.00023` in the clean one, against a `< 0.0001` floor — same direction, different magnitude, which is accumulated drift rather than a fixed miscalculation. The position test wants `-4.7` to five decimals and gets `-4.69565`, off by `0.00435`.
⚠ **Two readings, and choosing between them is a product call, not mine.** Either the pose lock genuinely fails to restore exactly after a walk — a real defect under RACK SCENE LOCK, where *"every rack lands on the SAME pose"* is the contract — or a five-decimal tolerance on a 3D camera round trip is tighter than the product needs and the test should assert a visible threshold instead. **Nothing was changed either way.**

**4 · SW update path — flake.** A 45-second timeout **while setting up the page**, not an assertion, and it **passed in the other full run**. The six tests immediately after it in the same file all passed, which is what a setup flake looks like rather than a broken spec. If it recurs in consecutive runs it stops being a flake and gets investigated.

---

## How to use this pin

1. Run `npx playwright test --project=phone-webkit` **on an idle box**. Contention is not cosmetic here — the first attempt at this baseline was invalidated by a browser running alongside it, and load turns assertion failures into timeouts that look like different defects.
2. Compare against the four above **by name**, not by count. `4 failed` matching this list is clean; `4 failed` with a different member is a regression wearing the right number.
3. Anything not on the list belongs to whatever changed since `5723ac3`.
4. **Re-pin when an app or harness byte changes** and the new result has been explained.

## What is open, and none of it is fixed here

- The **siteLead** test needs re-pointing (assert that migration must *not* fill `siteLead`) or pinning. Harness ship, needs a GO.
- The **rack-pose pair** needs the product call above, then either a fix or a tolerance change. Needs a GO.
- The **order dependence itself** is the deeper item: two tests that pass alone and fail after 400 others mean the suite carries state between specs. Worth its own investigation, because it can hide or manufacture failures anywhere, not just in spec 37.

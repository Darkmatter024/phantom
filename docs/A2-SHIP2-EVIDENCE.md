# A.2 SHIP 2 — EVIDENCE · blockers adapter, derived `status.openBlockers`, the Q-A `gaps` list

**Written:** 2026-09-17 · **Status:** ✅ **SHIPPED AS `phantom-v1.14.593` (`f2f2cec`) — both reviews PASS (§4); the owner's §6 look PASSED, stamped `d73a0bb` and promoted 2026-09-17.** John ran `verify.ps1` and `promote.ps1` himself.
**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md` §5 — *"Ship 2: blockers adapter (readout gains blocker events + derived openBlockers)."* **Phase 0:** `docs/A2-SHIP2-PHASE0-EVIDENCE.md` (the build spec).
**Rulings:** `OWNER-RULINGS.md` 2026-09-17 **Q-10…Q-17** (as recommended) · 2026-09-17 **Q-A** (separate `gaps` list; Ships 2–4 verify one at a time) · 2026-09-17 **Ship 2 gated on Chromium** (§G) · 2026-09-15 Q-1…Q-9 · 2026-09-14 (the composite is the rack key).
**Baseline:** `main` @ `d48fc0c`, `dct-ios.html` at **`phantom-v1.14.592`** (verified and promoted), 60,896 lines, CRLF.
⚠ **GATE ENGINE: `laptop-chromium`, not `phone-webkit`** — owner ruling 2026-09-17, §G. **WebKit coverage for this ship is John's Safari look on staging (§6).**
⚠ **graphify was not run.** `graphify.exe` is blocked by Windows Application Control on this box (the same Smart App Control policy as §G). Reported, not worked around.

---

## G · GATE ENGINE DEVIATION (owner ruling 2026-09-17)

**What happened.** The first RED run of spec 65 on `phone-webkit`, against the unchanged `.592` code, failed **18/18 before any page loaded**: `browserType.launch: Target page, context or browser has been closed`. Playwright's call log shows `ms-playwright\webkit-2336\Playwright.exe` exiting with **`exitCode=3236495362` = `0xC0E90002`** (`STATUS_SYSTEM_INTEGRITY_POLICY_VIOLATION`).

**The Windows evidence.** `Microsoft-Windows-CodeIntegrity/Operational` records events **3033 / 3077** ("Code Integrity determined that a process (`…\ms-playwright\webkit-2336\Playwright.exe`) attempted to load `…\webkit-2336\icuin77.dll` [and `sqlite3.dll`] that did not meet the … requirements") and **3118** ("Smart App Control Block Details") — **132 of them in the 09:xx hour on 2026-09-17**. The same log holds earlier WebKit blocks on **08-28 (126), 08-31 (2), 09-04 (58)**, and **none between 09-05 and 09-16** — which is when Ship 1 ran green on `phone-webkit` (`docs/A2-SHIP1-EVIDENCE.md` §3; `PHANTOM_CURRENT_STATE.md` records the block lifting on 09-06). The block comes and goes; the log's oldest event is 08-28, so its history before that is not visible here. `Get-MpComputerStatus` reports `SmartAppControlState: On`.

**A direct launch probe** (`@playwright/test` 1.62.1, this tree's `node_modules`): **Chromium 151.0.7922.34 launched; WebKit failed** with the same error.

**The reinstall attempt (by the parent session).** `npx playwright install --force webkit` rewrote `webkit-2336` (09:51). WebKit still did not start; Playwright then reported **`Host system is missing dependencies!`** for `icuin77.dll`, `libxml2.dll`, `libxslt.dll`, `libegl.dll` and `sqlite3.dll` — **all five present on disk**, so Windows is refusing to load them, not missing them.

**The ruling.** The owner chose ***"Gate this ship on Chromium"*** (recorded in `OWNER-RULINGS.md`). RED, GREEN, the mutation checks and the regression specs below all ran on the existing **`laptop-chromium`** project (1366×768, Chromium, not mobile). Nothing in `test/playwright.config.js` changed and Smart App Control was not touched.

**What that costs, stated plainly.** No part of this ship ran on a WebKit engine on this box. The config's own header already says WebKit-on-Windows is not iOS Safari, so the real WebKit gate was always the phone — **for this ship it is the only one: John's Safari look on staging (§6, ruling Q-8).** The ruling does not carry forward: Ship 3 tries `phone-webkit` first.

---

## 1 · What changed

| File | +/− | Anchors |
|---|---|---|
| `dct-ios.html` | **+92 / −9** | `:12879` `const PHANTOM_APP_VERSION` (stamp) · **one region `:31614–:31898`, entirely inside the A.2 block** (`// A.2 RACK RECORD ASSEMBLER` `:31611` … `// ── END rrdev` `:31916`) — see the hunk list below |
| `sw.js` | +1 / −1 | `:37` `const CACHE_VERSION` (stamp) |
| `version.json` | +4 / −4 | `version`, `released` (2026-09-17), `prevVersion` (`phantom-v1.14.592`), `notes` |
| `test/e2e/65-rack-record-assembler.spec.js` | +308 / −20 | header comment; Ship 2 seed (`seedWithBlockers`, helpers); 10 Ship 1 tests (RECORD, FOLD and READOUT · picked rack edited per E-7c, none weakened) + **8 new** = **18** |
| `docs/A2-SHIP2-EVIDENCE.md` | new | this file |

**`dct-ios.html` hunks (post-change line numbers):**

| Lines | What |
|---|---|
| `:12879` | stamp `phantom-v1.14.592` → `phantom-v1.14.593` |
| `:31614–31615` | A.2 header comment gains a Ship 2 line |
| `:31690–31741` | **`RR_ADAPTER_BLOCKERS`** — new, declared **above** `var PHANTOM_RR` (`:31742`; stop condition 6) |
| `:31745` | registry → `[RR_ADAPTER_IDENTITY, RR_ADAPTER_PHASES, RR_ADAPTER_BLOCKERS]` |
| `:31748` | `var coverage = [], gaps = [], …` |
| `:31762` | fold passes `detail` through on **ok** rows when an adapter supplies one (Q-11) |
| `:31766–31770` | Ship 1's synthetic `coverage.push({ adapter: 'rack', … })` → `gaps.push({ field: 'rack', detail: <same string> })` (Q-A, Q-14) |
| `:31788–31805` | **derived `openBlockers`** beside the P6 phase derivation (Q-11, Q-13) |
| `:31813–31814` | comment + `status.openBlockers: openBlockers` (was the literal `null`) |
| `:31817–31818` | `coverage: coverage, gaps: gaps` |
| `:31875–31877`, `:31883`, `:31890–31892`, `:31898` | readout: `#rr-dev-gaps` line — created, cleared with the others, rendered, appended after the coverage line (E-7b) |

**Not changed:** `blocker_save`, `deploy_advancePhase`, `PHANTOM_BLOCKERS`, the BLOCK/UNBLOCK buttons, `deploy_countBlockers`, `deploy_generateReport`, `safeGet`, `_rr_readKey`, `RR_ADAPTER_IDENTITY`, `RR_ADAPTER_PHASES`, any renderer, nav, dock or storage writer (stop condition 7, handoff §8). The blockers adapter reads **only** `phantom_blockers_v1` (stop condition 3), through `_rr_readKey` (stop condition 5). No STOP-list field (S-1…S-6) is read or parsed — in particular the `blk_migrated_…` id is never parsed. `VERIFIED` untouched. `OWNER-RULINGS.md` shows a working-tree change: that is the parent session recording ruling §G, not this build.

---

## 2 · How each ruling landed

| Ruling | In the code | Proved by (spec 65) |
|---|---|---|
| **Q-10** the store's truth | the adapter reads `clearedAt` only; no phase or audit read | BLOCKERS · TIMELINE (a cleared record is the only `blocker.cleared`) |
| **Q-11** undated = counted, not timed | `migrated: true` or non-numeric `openedAt` → `facts.undated`, no `blocker.opened`; the ok row carries `detail`; the fold passes it through | TIMELINE (no B_MIG event), DERIVED (`openBlockers 3`, row `detail`), UNDATED |
| **Q-12** `blocker.opened` / `blocker.cleared` | the two event types | TIMELINE |
| **Q-13** `empty → 0`, `error → null` | the derivation reads the blockers coverage row | RECORD, EMPTY, ERROR, FOLD |
| **Q-14 / Q-A** `gaps` after `coverage`, Ship 1's string, `schema` `rr-1` | `gaps.push(...)`, `gaps: gaps` | RECORD, GAPS, both `?rrdev=1` READOUT tests |
| **Q-15** Log blocker, never BLOCK | no code — §6 | owner |
| **Q-16** compare with Build + phase badge | no code — §6 | owner |
| **Q-17** no phase-record blocker fields | the phases adapter is untouched | TIMELINE (the phase events are Ship 1's exactly) |
| **Q-5** raw reader only | `_rr_readKey(PHANTOM_BLOCKERS_KEY)` | BLOCKERS · ERROR, BLOCKERS · PURE READ |

**The adapter, per E-5.** Status `empty` for an absent/`''` key, `[]`, or no record for this rack; `error` + detail for unreadable storage, malformed JSON, or a non-array (`'blocker store is not an array'`); otherwise `ok` with `facts: { undated: [...] }`. Events: `blocker.opened` `{ blockerId, phaseId, desc, openedBy }` at `openedAt`; `blocker.cleared` `{ blockerId, clearedBy }` at `clearedAt` — values as stored (`null` for an absent value, as Ship 1 does for `signedOffBy`). E-5c's four untrustworthy shapes are reported in the order *no blockerId → unreadable clearedAt → migrated → non-numeric openedAt*; the first two emit nothing, the last two still emit a valid `blocker.cleared`. `open` is the module's own predicate `!b.clearedAt`. **Nothing in `read()` can throw:** every value it touches is a `JSON.parse` result, and storage access is inside `_rr_readKey`'s `try`; the fold's `try` stays the second fence.

**The derivation, per E-6.** Only events with `source === 'blockers'`: `|opened ids \ cleared ids| + |undated with open|`. Id sets are `Object.create(null)` so an id such as `constructor` cannot collide with a prototype key. No blockers row at all (a test-swapped registry) → `null`.

---

## 3 · Proof — all on `laptop-chromium` (§G)

### RED — spec 65 against the unchanged `.592` code

| Run | Result |
|---|---|
| `phone-webkit` | **18 failed at browser launch** — environment, not the feature (§G) |
| `laptop-chromium` | **11 failed / 7 passed**. The 7 passes are Ship 1 tests this ship does not touch (TIMELINE, EMPTY, ERROR, PURE READ, STATUS, READOUT without the param, READOUT with no racks) |

Every one of the 11 failed **for the missing feature and nothing else** (first failing assertion, verbatim):

| Test | Failure on `.592` |
|---|---|
| RECORD | `Object.keys(rec)` — expected `…'coverage', 'gaps'`, received no `'gaps'` |
| FOLD | coverage rows — expected a trailing `['blockers', 'empty', 0]` |
| BLOCKERS · TIMELINE | `rec.timeline` — `- Expected - 42 / + Received + 0` (no blocker events) |
| BLOCKERS · DERIVED | *"open = opened \ cleared, plus undated-and-open (Q-11)"* — `Expected: 3, Received: null` |
| BLOCKERS · UNDATED | blocker events — `- Expected - 20 / + Received + 1` |
| BLOCKERS · EMPTY | *"key absent"* — `Expected: {"adapter": "blockers", …}, Received: undefined` |
| BLOCKERS · ERROR | *"malformed JSON must be error, never empty (P3)"* — `Expected: "error", Received: undefined` |
| BLOCKERS · PURE READ | *"the fixture really is malformed"* — `Expected: "error", Received: null` |
| GAPS | *"the registry, in order"* — no `'blockers'` |
| READOUT · picked rack | `Expected substring: "blockers empty"`, received `identity ok (0) · phases ok (3) · rack empty — no rack adapter in A.2: …` |
| READOUT · blocker store | coverage line — received the same `… · rack empty — …` line |

**RED re-proved with the final spec.** After the D-1 correction (§5), the final spec file was copied into a temporary worktree at `d48fc0c` (`.592`, untouched; own server on port 4417) and run alone on `laptop-chromium`: **11 failed / 7 passed — the same 11 tests with the same first failures as above** (DERIVED: `Expected: 3, Received: null`; READOUT · picked rack: `Expected substring: "blockers empty"`). The correction changed no RED outcome.

### GREEN

**Spec 65 alone: 18/18 passed** (38.1 s). The first GREEN attempt was 16/18 — see **D-1** in §5: two expectations in my spec copied a miscount from Phase 0, not a product defect.

### Mutation checks — each applied to `dct-ios.html` with the Edit tool, spec 65 run alone, then restored

| # | Mutation (E-10) | Named test | Went red | Assertion that fired |
|---|---|---|---|---|
| M1 | `blocker.opened` for migrated records (`if (false && b.migrated === true)`) | TIMELINE | **BLOCKERS · TIMELINE**, DERIVED, UNDATED, READOUT · blocker store — 4 | timeline deep-equality (a B_MIG event at `T0+999999`); DERIVED *"an ok read with one undated record says so"* |
| M2 | open count from events only (undated dropped) | DERIVED | **BLOCKERS · DERIVED**, UNDATED, READOUT · blocker store — 3 | *"open = opened \ cleared, plus undated-and-open (Q-11)"* |
| M3 | `b.rack.indexOf(rackId) === 0` | DERIVED (B-TEN) | **BLOCKERS · DERIVED** only — 1 | `blockerEvents(other)` — `+ Received + 11` (B_TEN claimed by `rack_<dep>_1`) |
| M4 | `{ state: 'ok', value: PHANTOM_BLOCKERS.loadAll() }` | ERROR + PURE READ | **BLOCKERS · ERROR**, **BLOCKERS · PURE READ** — 2 | *"malformed JSON must be error, never empty (P3)"*; *"the fixture really is malformed"* |
| M5 | `empty → openBlockers = null` | EMPTY | **BLOCKERS · EMPTY**, RECORD, FOLD, DERIVED — 4 | *"key absent — a count was taken and found nothing (Q-13)"* |
| M6 | `clearOk = !!b.clearedAt` (finite check removed) | TIMELINE — *"add a string-clearedAt record if M6 survives"* | **BLOCKERS · UNDATED** only — 1. TIMELINE survived, as E-10 predicted | blocker events — a `blocker.opened` for `blk_u3` and a `blocker.cleared` with a string `t` |
| M7 | adapter declared below `PHANTOM_RR` (renamed `RR_ADAPTER_BLOCKERS_M7`, aliased after `window.PHANTOM_RR`) | every test | **17 of 18** | 14 × `page.evaluate: TypeError: Cannot read properties of undefined (reading 'name')` — the E-8 trap exactly. The one survivor is READOUT · no racks, which never assembles |

**After every restore:** `sha256sum -c` against the post-GREEN hash (`384ec71b…179c`) read **OK** each time; after M7, `git diff --numstat dct-ios.html` still reads **`92 9`**; remnant searches read 0 for `indexOf(rackId)`, `PHANTOM_BLOCKERS.loadAll() }`, `var clearOk = !!` and `_M7`. The one `false && ` hit in the file is pre-existing (`:56831`, the restore manifest). M4's PURE READ failure fired at the test's status precondition, so its storage-snapshot assertion was not reached under that mutation.

### Regression — each spec alone, `laptop-chromium`, on the final Ship 2 source

| Spec | Ship 2 source | Baseline `d48fc0c` (`.592`) | Verdict |
|---|---|---|---|
| `64-report-engine-characterization` | **8/8** | — | ✅ handoff acceptance #3 — `deploy_generateReport` output unchanged; `summary.openBlockers` not moved |
| `00-boot` | **4/4** | — | ✅ incl. *no uncaught exception and no console error* |
| `63-handoff-readiness-gate` | **5/5** | — | ✅ |
| `12-blockers` | **8/8** | — | ✅ |
| `13-phase-model` | **13/13** | — | ✅ |
| `04-storage` | **20 passed, 1 skipped** | — | ✅ its standalone baseline (A2-SHIP1-EVIDENCE §3); the one `x` row (`:368`) is the pinned `test.fail`, counted as passed |
| `98-cmd-census` | **26 passed, 1 failed** | **26 passed, 1 failed — the same test** | ⚪ **pre-existing on this viewport**: `:365` *A-3 … both panels are gone from the Deck* → *"#cs-fieldtools is visible on the phone"*. The 2026-09-01 ruling keeps that door on desktop, and `laptop-chromium` is 1366 px wide — a phone-only assertion |
| `01-nav` | **12 passed, 6 skipped, 1 failed** | **12 passed, 6 skipped, 1 failed — the same test** | ⚪ **pre-existing on this viewport**: `:307` *nav blocker badge — it NEVER eats the tap* → *"the badge did not appear when blockers exist"*; at this width the shell composes a left rail (the file's own skips say so). The second `x` row (`:347`, *browser back*) is a pinned `test.fail` |

**Introduced by Ship 2: none.** The two reds were classified by running the same spec alone, on the same project, against untouched `d48fc0c` in a temporary `git worktree` (scratchpad, own port; its `node_modules` junction removed first, then `git worktree remove`). The user's tree was never stashed, reset or cleaned.
⛔ **NOT CLAIMED:** any `phone-webkit` result (§G), a batched run, or the full suite.

---

## 4 · Integrity and review

- **CRLF:** `dct-ios.html` 60,979 lines — **60,979 CR bytes, 60,979 LF bytes**, 0 lone LF, 0 lone CR (was 60,896 / 60,896). `sw.js` 318/318 · `version.json` 6/6 · spec 65 621/621. Every product edit was made with the Edit tool; `version.json` was written by a Node `JSON.stringify(…, null, 2)` + CRLF script, first proven to round-trip the `.592` file byte-identically.
- **Inline scripts:** 3, **all compile** (`vm.Script` per block, the guard's method). The A.2 hunk is in block 3 (`:16928–:59801`). `sw.js` compiles. `version.json` is valid JSON with no backtick in `notes`.
- **Braces:** whole file 14,543 / 14,543 (the guard's count); CSS `<style>` blocks with comments stripped 4,804 / 4,804 — unchanged from Ship 1.
- **Three-stamp lockstep:** `dct-ios.html:12879` · `sw.js:37` · `version.json:2` all read `phantom-v1.14.593`; `prevVersion` `phantom-v1.14.592`, `released` `2026-09-17`. `VERIFIED` line 1 still reads `phantom-v1.14.592 VERIFIED` (untouched).
- **The guard itself:** `tools/hooks/phantom-guard.js` fed a synthetic `git commit -a -F -` payload (nothing committed) → **exit 0**: stamps, compile, braces, CRLF and the VERIFIED gate all pass.
- **Surgical diff:** `git diff --numstat dct-ios.html` → **`92 9`**; outside the A.2 block only `:12879` moves. Of the 9 removed lines, one is the old stamp; the other 8 are Ship 1 lines inside the A.2 block that Phase 0 E-6/E-7b named (the registry, the `coverage` var, the rack row and its two comment lines, the `openBlockers` literal and its comment, the `coverage` return key).
- `tools/verify.ps1`, `promote.ps1` and `stamp.ps1` were not run, and `VERIFIED` was not touched.

**Reviews — both PASS, on the uncommitted working tree that was then committed unchanged.**
- **`phantom-ship-gate` — PASS, 7/7:** lockstep, compile, JSON, CSS braces, surgical diff, CRLF, redesign scope.
- **`phantom-rd-reviewer` — PASS.** It also applied the `adapter-reviewer` and `data-honesty-auditor` checklists inline, because those agents cannot be dispatched from this session. Every field the adapter reads is in census refresh §3 / E-1b. The adapter never writes, and an error stays an error. An empty result stays `empty`. The derived `openBlockers` is computed on read and never stored. Two advisories, neither blocking:
  - **(a)** The empty-`rackId` guard (D-3) cannot be reached through today's picker. It is kept as a defence for the `rack: ''` orphans.
  - **(b)** The ship bundles three changes (adapter, derived count, `gaps`). Ruling Q-14 authorised the bundle.
- **Parent session's own runs, `laptop-chromium`, each spec alone, no reviewer running tests at the same time:** spec `65` **18/18** · spec `64` **8/8**.
- **Parent session's nit, not fixed:** a `clearedAt` of `0` is filed as undated with the reason *"clearedAt is not a number"*. The record is right (undated, still open). Only the internal reason string is loose, and the record never shows it.
- ⚠ The `adapter-reviewer` and `data-honesty-auditor` checklists were also applied while the code was being written (pure read, error containment, honest emptiness, event shape `{ t, type, source, data }`, no cross-class read). That is self-application. The reviewer's inline pass above is the independent one.

---

## 5 · Interpretations and deviations — each is the owner's to strike

- **D-1 · Phase 0 miscounted the blocker events; the spec follows the rules, not the count.** E-10 test 2 says the blockers row is `{ status: 'ok', events: 5 }`. By E-5b/E-5c the seed yields **4** — B_OPEN opened, B_TIE opened, B_CLOSED opened + cleared; B_MIG emits nothing (Q-11) — and E-10 test 1's own timeline lists exactly those four. My spec first copied the 5; the first GREEN run failed DERIVED and READOUT · blocker store on `events 4` vs `5`, and **both expectations were corrected to 4** before the passing run. RED is unaffected — DERIVED fails first on `openBlockers null` and the readout line on `rack empty`; re-run of the final spec on untouched `.592`: the same 11 red, the same reasons (§3).
- **D-2 · An UNDATED test was added before the code** (not in E-10's list). It covers E-5c's hand-edited shapes — string and missing `openedAt`, string and `0` `clearedAt`, an empty `blockerId`, a migrated-and-cleared record — plus `null`, a bare string and a number in the array (I-10). E-10 anticipated needing it (*"add a string-clearedAt record if M6 survives"*); M6 did survive TIMELINE and was caught only here.
- **D-3 · `''` is never a match target.** DERIVED also assembles rack `''` and expects `empty`. The adapter carries a one-line guard (`typeof rackId !== 'string' || !rackId` → `empty`) so the orphan records `create()` stores with `rack: ''` (E-1c) are never gathered as if `''` were a rack. The phases adapter (Ship 1) has no such guard and is untouched.
- **D-4 · The seed adds `openedBy: 'Unknown'` on B_TIE.** The device operator in the fixture is `E2E`, the same as B_OPEN's `openedBy`, so only a different stored value can catch a substitution of the current operator (I-6, Contract 9a).
- **D-5 · Gaps line format.** `gaps: rack — <Ship 1's string>`, gold (`#ffcb45`, the caution channel), under the unchanged cyan coverage line; `gaps: none` if the list is ever empty (never in Ship 2). E-7b named the element (`#rr-dev-gaps`) and the `field — detail` form; the `gaps: ` prefix is mine, so the two lines cannot be mistaken for each other.
- **D-6 · `data` values are `null` when absent**, not omitted — the Ship 1 convention for `signedOffBy`. Census records always carry all four; only a hand-edited record could differ.
- **Carried from Phase 0, implemented as written:** I-1 (`blocker.cleared`), I-2 (`desc` is current text), I-3 (`empty → 0`), I-4 (whole-string match, no `phaseId` fallback), I-5 (`siteId` ignored), I-6 (`openedBy` / `clearedBy` verbatim), I-7, I-8 (`gaps` top-level, `schema` `rr-1`), I-9 (ok rows carry `detail` only when there is one), I-10.

---

## 6 · THE ONE LOOK — Safari tab on staging (ruling Q-8); the only WebKit gate for this ship (§G)

**Where:** Safari → `https://phantom-staging.wfj6t2fk7w.workers.dev/dct-ios.html`, **all in one tab**, not the icon. Confirm SYS shows **`phantom-v1.14.593`** first.
**Set-up:** if the Ship 1 look's TST99 deployment is still in this tab, reuse it. Otherwise Build → **＋ NEW** → **LOAD MASTER** (`MASTER-US-TST99-TORTURE-TEST.xlsx`) → select one cab (e.g. `s1:001`) → **STAGE SCOPE SNAPSHOT** → name it → **CREATE DEPLOYMENT**.
⛔ **Use Log blocker, never the phase card's BLOCK button** — BLOCK writes a blocked phase with no blocker record (Q-15).

1. Build → **Log blocker** → pick the rack if asked → type `RR SHIP2` → **SAVE BLOCKER**. **PASS:** toast `Blocker saved`; the Build *Active rack* card reads `Blocked — RR SHIP2`; the `Blockers` metric reads `1`. **The BUILD dock badge stays hidden — that is expected, not a FAIL** (it counts AI Review issues, Q-16).
2. Add `?rrdev=1` to the address, pick the rack. **PASS:** the coverage line reads `identity ok (0) · phases ok (0) · blockers ok (1)`; a **separate gold line** reads `gaps: rack — no rack adapter in A.2: …`; the JSON shows `status.openBlockers: 1`, one `blocker.opened` whose `data.desc` is `RR SHIP2` and whose `data.openedBy` is your operator, and `status.phase` still `index 0 · of 5 · name "mechanical"`. **Compare with the Build workspace and the phase badge** (Q-16) — not with the dock badge, Command, the readiness gate or a report.
3. Remove the param and reload → **Open blocked rack** → **UNBLOCK** on the blocked phase. The Build card no longer says Blocked; `Blockers` reads `0`.
4. Add `?rrdev=1` again, pick the rack. **Expected (Q-10):** `status.openBlockers` **still `1`**, still one `blocker.opened`, **no** `blocker.cleared`. UNBLOCK does not close the blocker record, so the readout and the Build card now disagree. **That mismatch is recorded, not a FAIL** — the look passes when the readout matches the store.
5. Reload **without** the param: no trace of the readout.

**FAIL:** `blockers` reads `error`; `blockers` reads `empty` after step 1; `openBlockers` is `null` after step 1; any event without a numeric `t`; a `blocker.cleared` appearing after step 3; `identity` or `phases` changed from Ship 1's values; the rack gap printed inside the coverage line instead of its own line; any trace of the readout without the param.
**What the look cannot show:** the `blocker.cleared` path and the undated path — neither is reachable through the UI with a clean result (Phase 0 E-2b, E-2d). Spec 65 owns both.

---

## Q · Found, not worked

- **Leads L-1…L-6** from `docs/A2-SHIP2-PHASE0-EVIDENCE.md` stand unchanged. Nothing in this ship touches them. The Q-10 writer defect (UNBLOCK never closes the record — fix must also null `phase.blockerId`, L-6) and the Q-15 BLOCK-button defect remain the owner's to schedule.
- **A.3 trap carried (Q-16, L-5):** rr-1 `status.openBlockers` (blocker records) and `deploy_generateReport`'s `summary.openBlockers` (AI Review issues, pinned by spec 64) share a name.
- **The WebKit block (§G)** needs its own resolution before Ship 3's RED. The ruling does not carry forward.
- **The Phase 0 miscount (D-1)** is a one-number error in `docs/A2-SHIP2-PHASE0-EVIDENCE.md` E-10 test 2; left as written history.

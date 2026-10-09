# A.2 SHIP 3 — EVIDENCE · the notes adapter, and a coverage `detail` on `empty` rows

**Written:** 2026-09-17, **completed 2026-09-21** (the box slowed mid-build and the test runs stretched across the date boundary — see §5 D-5). · **Status:** ⏳ **SHIPPED TO `main` AS `phantom-v1.14.594` — both reviews PASS (§4); device verify owed (§6).** Not stamped, not promoted: `verify.ps1` and `promote.ps1` are John's.
**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md` §5 — *"Ship 3: notes adapter."* · §1 item 3 — *"**notes** (log notes)"*. **Phase 0 (the build spec):** `docs/A2-SHIP3-PHASE0-EVIDENCE.md` (`c24cf12`).
**Rulings:** `OWNER-RULINGS.md` 2026-09-17 **Q-18…Q-27 as recommended** · 2026-09-17 **Ship 3 gated on Chromium** (§G) · 2026-09-17 Q-10…Q-17 and Q-A · 2026-09-15 Q-1…Q-9 · 2026-09-14 (the composite is the rack key).
**Baseline:** `main` @ `c24cf12`, `dct-ios.html` at **`phantom-v1.14.593`**, 60,979 lines, CRLF. `VERIFIED` line 1 reads `phantom-v1.14.593 VERIFIED`; `.593` is promoted. **This ship stamps `phantom-v1.14.594`.**
⚠ **GATE ENGINE: `laptop-chromium`, not `phone-webkit`** — owner ruling 2026-09-17, §G. **WebKit coverage for this ship is John's Safari look on staging (§6).**
⚠ **graphify was not run.** `graphify.exe` is blocked by the same Windows Application Control policy as §G. Reported, not worked around.

---

## G · GATE ENGINE DEVIATION (owner ruling 2026-09-17)

**The ruling.** `OWNER-RULINGS.md` 2026-09-17, *"A.2 SHIP 3 IS GATED ON CHROMIUM TOO — WebKit is still blocked"*. The owner chose ***"Chromium again"***. Terms identical to Ship 2's: RED, GREEN, the mutation checks and the regression specs run on **`laptop-chromium`** (1366×768, Chromium, not mobile).

**Today's WebKit probe, as reported to this build.** The parent session probed WebKit again on 2026-09-17 before any Ship 3 test ran, using this tree's `@playwright/test`: **WebKit `browserType.launch: Host system is missing dependencies!`**; **Chromium `151.0.7922.34` launched**. `Get-MpComputerStatus` reports `SmartAppControlState: On`. ⛔ **This build did not re-probe WebKit and did not attempt a WebKit run** — the parent's instruction was explicit that WebKit is blocked and not to try it. The probe result above is the parent's, recorded here, not re-measured by me.

**Nothing in `test/playwright.config.js` was changed** and Smart App Control was not touched.

**What that costs, stated plainly.** No part of this ship ran on a WebKit engine on this box. The real WebKit gate is, for this ship, the only one: **John's Safari look on staging (§6).**

⛔ **It does not carry forward.** Ship 4 probes `phone-webkit` first, per the ruling.

---

## 1 · What changed

| File | +/− | Anchors |
|---|---|---|
| `dct-ios.html` | **+65 / −3** | `:12879` `const PHANTOM_APP_VERSION` (stamp) · **one region `:31616–:31824`, entirely inside the A.2 block** (`// A.2 RACK RECORD ASSEMBLER` `:31611` … `// ── END rrdev` `:31978`) |
| `sw.js` | +1 / −1 | `:37` `const CACHE_VERSION` (stamp) |
| `version.json` | +4 / −4 | `version`, `prevVersion` (`phantom-v1.14.593`), `notes`, and `released` — **`2026-09-21`**, set by the parent session after the build handed back; see §5 D-5 |
| `test/e2e/65-rack-record-assembler.spec.js` | **+411 / −5** | header comment; Ship 3 fixture (`aud`, `AUDIT`, `seedWithNotes`, helpers); 5 existing tests edited; **9 new** = **27** |
| `docs/A2-SHIP3-EVIDENCE.md` | new | this file |

**`dct-ios.html` hunks (post-change line numbers) — five, and there are no others:**

| Lines | What |
|---|---|
| `:12879` | stamp `phantom-v1.14.593` → `phantom-v1.14.594` |
| `:31616–31617` | A.2 header comment gains a Ship 3 line (+2) |
| `:31744–31801` | **`RR_ADAPTER_NOTES`** — new, declared **above** `var PHANTOM_RR` (`:31805`; stop condition 6) (+58) |
| `:31805` | registry → `[RR_ADAPTER_IDENTITY, RR_ADAPTER_PHASES, RR_ADAPTER_BLOCKERS, RR_ADAPTER_NOTES]` |
| `:31822–31824` | the Q-23 fold line: `res.status === 'ok'` → `res.status !== 'error'`, plus a two-line comment (+3 / −1) |

`git diff -U0 dct-ios.html` reports exactly those five hunk headers.

**Not changed:** `stripeRack_logNote`, `deploy_logAudit` (`:31089`), `deploy_purgeAudit` (`:31141`), the FIFO block, `deploy_verifyAuditChain`, `deploy_loadAllAudit` / `deploy_loadAuditFor`, the LOG sheet, HISTORY (`deploy_showAuditLog` `:43069`), the NERVE card (`nerve_buildRackCard` `:57180`), the shift report (`:18429`), the handoff generator (`:31314`), `deploy_generateReport` (`:43689`), `safeGet`, `_rr_readKey`, `RR_ADAPTER_IDENTITY`, `RR_ADAPTER_PHASES`, `RR_ADAPTER_BLOCKERS`, the derived `openBlockers` block, the rr-1 return shape, the readout, any renderer, nav, dock or storage writer. Every fenced surface sits outside the five hunks above (stop condition 8, handoff §8). The adapter reads **only** `phantom_deploy_audit_v1` (stop condition 4), **only** through `_rr_readKey` (stop condition 3). No STOP-list field is read or parsed: the `id` is carried verbatim and never parsed for a time, `delta` is not touched, `summary` is never searched for a rack name, the deployment is never parsed out of the composite, `hash`/`prevHash` are not read, and `truncatedCount` is never surfaced (S-18). `VERIFIED` untouched.

---

## 2 · How each ruling landed

| Ruling | In the code | Proved by (spec 65) |
|---|---|---|
| **Q-18** `RACK_NOTE` only | the filter is `e.action === 'RACK_NOTE' && e.entityType === 'rack' && e.entityId === rackId`, all three, whole-string. `e.rack` and `summary` are never keys | NOTES · TIMELINE (`A_ASSIGN`, `A_BLK`, `A_PHASE`, `A_STEP`, `A_VA` all excluded), NOTES · EMPTY (a store of only those reads `empty`), NOTES · SCOPING. Mutations **M1, M2, M3** |
| **Q-19** field notes out | `OMNI_NOTE` fails the action test | NOTES · EMPTY (`A_OMNI` in the non-matching store) |
| **Q-20** checklist notes out | no phases read at all; the adapter opens one key | NOTES · REGISTRY (`schemaHandled` names one key), NOTES · PURE READ |
| **Q-21** `note.logged` `{ auditId, text, actor }` | the one event type; `Object.keys(ev.data)` is exactly those three, in that order | NOTES · TIMELINE (explicit `Object.keys` assertion) |
| **Q-22** no new `status` field | `:31805`–`:31824` untouched below the fold line; the return shape is Ship 2's | NOTES · TIMELINE and READOUT · notes both assert `Object.keys(rec.status)` is `['phase','openBlockers','photoCount','photoBytes']` |
| **Q-23** reset marker as a `detail`, on `empty` rows too | `chainReset === true` anywhere in the array sets the caveat; the fold line becomes `res.status !== 'error' && res.detail` | NOTES · TRUNCATION (the `[HEAD]` case is `empty` **with** a detail). Mutations **M8, M9, M12** |
| **Q-24** no hash chain | `hash` / `prevHash` are never read; no `sha256` call | the adapter's 58 lines contain neither identifier |
| **Q-25** actor verbatim | `actor: (e.actor == null ? null : e.actor)` | NOTES · TIMELINE (`'System'`, `'LEAD-B'` survive), READOUT · notes. Mutation **M10** |
| **Q-26** look compares HISTORY | no code — §6 | owner |
| **Q-27** issue/discrepancy/voice notes out | one key, one action | NOTES · EMPTY (`A_VA` excluded), NOTES · REGISTRY |
| **Q-5** raw reader only | `_rr_readKey(DEPLOY_AUDIT_KEY)` | NOTES · ERROR, NOTES · PURE READ. Mutation **M4** |
| **Q-17** nothing from Ship 3 enters `openBlockers` | `note.logged` carries `source: 'notes'`; the derivation returns early on `ev.source !== 'blockers'` | NOTES · TIMELINE and NOTES · EMPTY assert `openBlockers` is unmoved; NOTES · ERROR asserts it stays `3` |

**The adapter, per E-7.** `empty` for a non-string or empty `rackId`, an absent or `''` key, or an array holding no matching note; `error` + detail for unreadable storage, malformed JSON, or a non-array (`'audit store is not an array'`); otherwise `ok` with `facts: { undated: [...] }`. One event, `note.logged`, at `e.ts` when `e.ts` is a finite number, carrying `{ auditId, text, actor }` with `null` for an absent value (Ship 2 D-6). A matching entry whose `ts` is unusable goes to `facts.undated` and never to the timeline. **Nothing in `read()` can throw:** every value it touches is a `JSON.parse` result, and storage access is inside `_rr_readKey`'s `try`; the fold's `try` stays the second fence.

---

## 3 · Proof — all on `laptop-chromium` (§G)

### RED — spec 65 against the unchanged `.593` product source

**14 failed / 13 passed.** The 13 passes are Ship 1 and Ship 2 tests this ship does not touch. Every one of the 14 failed **for the missing feature and nothing else** (first failing assertion, verbatim):

| # | Test | First failure on `.593` |
|---|---|---|
| 1 | RECORD | `toEqual` on `rec.coverage` — `- Expected - 5 / + Received + 0`, the missing `Object { "adapter": "notes", "events": 0, "status": "empty" }` |
| 2 | FOLD | coverage rows — missing `Array [ "notes", "empty", 0 ]` |
| 3 | GAPS | *"the registry, in order"* — `- "notes"` |
| 4 | NOTES · TIMELINE | `rec.timeline` — `- Expected - 40 / + Received + 0` (no note events) |
| 5 | NOTES · SCOPING | *"rack_<dep>_1 never claims rack_<dep>_10's note"* — `- Expected - 22 / + Received + 1` |
| 6 | NOTES · EMPTY | *"key absent"* — `Expected: {"adapter": "notes", …}, Received: undefined` |
| 7 | NOTES · ERROR | *"malformed JSON must be error, never empty (P3)"* — `Expected: "error", Received: undefined` |
| 8 | NOTES · PURE READ | *"the fixture really is malformed and the notes adapter really read it"* — `Expected: "error", Received: null` |
| 9 | NOTES · UNDATED | note events — `- Expected - 32 / + Received + 1` |
| 10 | NOTES · TRUNCATION | *"an ok read of a truncated log says entries may be missing"* — `Expected: {…detail: "the audit log carries a reset marker…"}, Received: undefined` |
| 11 | NOTES · REGISTRY | *"notes is registered fourth, after blockers (E-8b: the tie order)"* — `- "notes"` |
| 12 | READOUT · picked rack | `Expected substring: "notes empty"`, received `identity ok (0) · phases ok (3) · blockers empty` |
| 13 | READOUT · blocker store | coverage line — received the same line without `· notes empty` |
| 14 | READOUT · notes | coverage line — received the line without `· notes ok (4) — …` |

**RED re-proved with the final spec.** After the D-3 correction below, the final spec file was copied into a temporary worktree at **`c24cf12`** (`.593`, product source untouched; own port 4421) and run alone on `laptop-chromium`: **14 failed / 13 passed — the identical 14 tests** (`diff` of the sorted failing-test lists is empty), and NOTES · PURE READ still fails at its precondition, so the reorder did not make it vacuous.

### GREEN

**Spec 65 alone: 27/27 passed** (55.8 s), **on the first attempt** — no expectation needed correcting. Every count in the E-10 plan was worked out by hand from the fixture before the code was written (§5 D-1), and all of them were right. Re-run after the D-3 spec change: **27/27** again (2.2 m).

### Mutation checks — each applied to `dct-ios.html` with the Edit tool, spec 65 run alone, then restored

| # | Mutation (E-10) | Plan says | Went red | Assertion that fired |
|---|---|---|---|---|
| M1 | drop the `action` test (`entityType` + `entityId` only) | TIMELINE, EMPTY | **TIMELINE, EMPTY, READOUT · notes — 3** | timeline gained `A_ASSIGN` (`"text": "Assigned to: E2E"`); EMPTY store 4 read `events 1` |
| M2 | also match `e.rack === rackId` | TIMELINE | **TIMELINE, EMPTY, READOUT · notes — 3** | timeline gained `A_STEP` and `A_BLK`; readout read `notes ok (6)` |
| M3 | `String(e.entityId).indexOf(rackId) === 0` | SCOPING | **SCOPING only — 1** | *"rack_<dep>_1 never claims rack_<dep>_10's note"* — `OTHER` claimed `A_TEN` |
| M4 | read through `deploy_loadAllAudit()` | ERROR, PURE READ | **ERROR, PURE READ — 2** | *"malformed JSON must be error, never empty (P3)"* — `Received: "empty"`; **after D-3**, PURE READ fires on the write itself: `+ "phantom_quarantine_v1": "{\"phantom_deploy_audit_v1\":…}"` |
| M5 | no finite check + `t: Number(e.ts)` | UNDATED, TIMELINE | **TIMELINE, UNDATED, TRUNCATION, READOUT · notes — 4** | `A_UNDATED` landed on the timeline; UNDATED gained 3 events |
| M6 | a rack with no notes returns `ok` with 0 events | EMPTY | **EMPTY, TRUNCATION — 2** | `- "status": "empty" / + "status": "ok"` |
| M7 | `RR_ADAPTER_NOTES` declared below `var PHANTOM_RR` | every assembling test | **26 of 27** | 22 × `page.evaluate: TypeError: Cannot read properties of undefined (reading 'name')` — the E-8b trap exactly. The one survivor is READOUT · no racks, which never assembles |
| M8 | drop the reset detail | TRUNCATION | **TRUNCATION only — 1** | *"an ok read of a truncated log says entries may be missing"* — the `detail` key absent |
| M9 | revert the fold to `ok`-only details | TRUNCATION | **TRUNCATION only — 1** | *"an empty read of a truncated log still says so (Q-23)"* — the `detail` key absent on the `empty` row |
| M10 | `actor: identity_getUser()` instead of verbatim | TIMELINE | **TIMELINE, UNDATED, READOUT · notes — 3** | `- "actor": "System" / + "actor": "E2E"`; readout *"actor verbatim, fallbacks included (Q-25)"* |
| M11 | register `notes` before `blockers` | TIMELINE (tie at `T0+300`) | **RECORD, FOLD, GAPS, TIMELINE, REGISTRY, READOUT · blocker store, READOUT · notes — 7** | the `T0+300` tie reordered; coverage row order changed |
| M12 | print `truncatedCount` in the detail | TRUNCATION | **TRUNCATION only — 1** | `+ "detail": "…— 1 entries older than its oldest surviving entry are missing"` — the L-7 lie, caught by exact-string equality |

**Every mutation in the plan was caught, and none needed a new test.** M1, M2, M5, M6, M10 and M11 were caught more widely than the plan predicted; M3, M8, M9 and M12 exactly as predicted.

**After every restore:** `sha256sum -c` against the post-GREEN hash (`c8073da8711b8120a7ec6d0e51512d97c65d471fbb77bb9e040209687b385f6a`) read **OK** each time, `cmp` against a saved post-GREEN copy read **identical**, and `git diff --numstat dct-ios.html` still read **`65 3`**. Remnant searches after the cycle read 0 for `&& e.rack !== rackId`, `indexOf(rackId)`, `Number(e.ts)`, `_M7`, `identity_getUser() } });`, `res.status === 'ok' && res.detail` and `RR_ADAPTER_NOTES, RR_ADAPTER_BLOCKERS`. The one `false && ` hit in the file is pre-existing (the restore manifest, baseline `:56831`), and `truncatedCount` appears only at the FIFO writer `:31130` and inside the adapter comment that explains why it is never printed.

⚠ **The M10 run was interrupted.** The box slowed roughly threefold partway through the cycle (a GREEN run went from 55.8 s to 3.2 m) and the first M10 run exceeded its 10-minute harness timeout and was killed mid-run. The tree was then **proved** back to the post-GREEN hash before anything else ran — hash compared explicitly, `cmp` byte-identical, M9/M10 remnant greps clean — and spec 65 was re-run to **27/27 GREEN** before M10 was re-applied. The recorded M10 result above is from the completed re-run.

### Regression — each spec alone, `laptop-chromium`, on the final Ship 3 source

| Spec | Ship 3 source | Baseline `c24cf12` (`.593`, worktree, port 4421) | Verdict |
|---|---|---|---|
| `64-report-engine-characterization` | **8/8** | — | ✅ **handoff acceptance #3** — `deploy_generateReport` output unchanged |
| `00-boot` | **4/4** | — | ✅ incl. *no uncaught exception and no console error* |
| `63-handoff-readiness-gate` | **5/5** | — | ✅ |
| `12-blockers` | **8/8** | — | ✅ |
| `13-phase-model` | **13/13** | — | ✅ |
| `27-rack-capabilities-in-build` | **8/8** | — | ✅ the `Log note` door is unmoved |
| `04-storage` | **18 passed, 2 failed, 1 skipped** | **18 passed, 2 failed, 1 skipped — the SAME two tests** (`:461` *a full backup restores every key…* → `ReferenceError: PHANTOM_BACKUP_EXCLUDED_KEYS is not defined`; `:605` *data written through the app survives a reload* → `locator.click: Element is not visible` on `#pe-tapcatch`) | ⚪ **pre-existing on this box.** ⚠ Both passed on 2026-09-17 (Ship 2 recorded *20 passed, 1 skipped*). They fail identically on **untouched `c24cf12`** today, so **the environment changed, not the code** — see §Q |
| `98-cmd-census` | **26 passed, 1 failed** | **26 passed, 1 failed — the same test** | ⚪ **pre-existing on this viewport**: `:365` *both panels are gone from the Deck* → *"#cs-fieldtools is visible on the phone"*. A phone-only assertion at 1366 px |
| `01-nav` | **12 passed, 6 skipped, 1 failed** (settled, runs 2 and 3) | **12 passed, 6 skipped, 1 failed — the same test** (3 runs) | ⚪ **pre-existing on this viewport**: `:307` *nav blocker badge — it NEVER eats the tap*. See the flake note below |

**The `01-nav` flake, reported rather than buried.** The **first** Ship 3 run of `01-nav` showed **2** failures: the pre-existing `:307`, plus `:399` *"?legacy=1 does not stick across a reload"* failing with `locator.click: Element is not visible` on `#pe-tapcatch` — the identical signature to the pre-existing `04-storage:605`. It did **not** reproduce: `01-nav` was then run twice more on the Ship 3 tree and twice more on untouched `c24cf12`, and **all four runs read 12 passed / 6 skipped / 1 failed with only `:307` failing.** Ship 3 touches nothing in the `?legacy=1` path or the splash tap-catcher. Classified as a one-off environment flake of the slow-box `#pe-tapcatch` family; `retries: 0` means a flake shows as a hard failure.

**Introduced by Ship 3: none.** Every red was classified by running the same spec alone, on the same project, against untouched `c24cf12` in a temporary `git worktree` (scratchpad, own port 4421; its `node_modules` junction removed before `git worktree remove`). **The user's tree was never stashed, reset or cleaned.**
⛔ **NOT CLAIMED:** any `phone-webkit` result (§G), a batched run, or the full suite.

---

## 4 · Integrity and review

- **CRLF** (counted as bytes with node — `grep -c $'\r$'` matches every line in this shell and is not a CR check): `dct-ios.html` **61,041 CRLF, 0 lone LF, 0 lone CR** (was 60,979 / 0 / 0) · `sw.js` 318 / 0 / 0 · `version.json` 6 / 0 / 0 · spec 65 1,027 / 0 / 0. Every product edit was made with the Edit tool.
- **`version.json`** was written by a Node `JSON.stringify(obj, null, 2)` + CRLF script, **first proven to round-trip the `.593` file byte-identically** (3,294 bytes in, 3,294 bytes out, `Buffer.equals` true) — proven again immediately before the write. It parses, and it contains **no backtick** and no non-ASCII character.
- **Inline scripts:** 3, **all compile** (`vm.Script` per block, the guard's method). The A.2 hunks are in block 3. `sw.js` compiles.
- **Braces:** whole file **14,561 / 14,561** (the guard's count; was 14,543 / 14,543 — +18 pairs, all inside the new adapter). CSS `<style>` blocks with comments stripped: **12 blocks, 4,804 / 4,804 — unchanged from `.593`**, proving no CSS was touched.
- **Three-stamp lockstep:** `dct-ios.html:12879` · `sw.js:37` · `version.json` all read `phantom-v1.14.594`; `prevVersion` `phantom-v1.14.593`. `VERIFIED` line 1 still reads `phantom-v1.14.593 VERIFIED` (untouched; `git status` shows it unmodified).
- **The guard, dry:** `tools/hooks/phantom-guard.js` fed a synthetic `git` `commit -a -F -` PreToolUse payload, **committing nothing** → **exit 0 (ALLOW)**. (Earlier in the build, with `version.json` still at `.593`, the same guard correctly returned **BLOCKED — THREE-STAMP LOCKSTEP BROKEN**, which is independent evidence the check is live and not vacuous.)
- **Surgical diff:** `git diff --numstat` → `dct-ios.html 65 3` · `sw.js 1 1` · `version.json 3 3` · `test/e2e/65-… 411 5`. Outside the A.2 block only `:12879` moves. Of the 3 removed `dct-ios.html` lines: the old stamp, the old registry line, and the old fold line.
- `tools/verify.ps1`, `promote.ps1` and `stamp.ps1` were **not run**, `VERIFIED` was **not touched**, graphify was **not run**, and nothing was committed, staged, pushed, stashed, reset or cleaned.

**Reviews — both PASS, run by the parent session on this working tree, which was then committed unchanged except for D-5's `released` field and this section.**
- **`phantom-ship-gate` — PASS, every check:** three-stamp lockstep (`.594` in all three, `prevVersion` `.593`), three inline scripts compile, `version.json` parses, CSS braces 14,561/14,561, the diff is surgical (the stamp plus the A.2 block, no drive-by edit), no line-ending damage, redesign scope clean, and `VERIFIED` untouched at `phantom-v1.14.593 VERIFIED`. Its one note was that `version.json` is +4/−4 rather than +3/−3 — the `released` change of D-5, corrected in §1 above.
- **`phantom-rd-reviewer` — PASS, no rule violations.** It also applied the `adapter-reviewer` and `data-honesty-auditor` checklists inline, since neither can be dispatched. It confirmed: the read goes only through `_rr_readKey(DEPLOY_AUDIT_KEY)` (`DEPLOY_AUDIT_KEY` is a top-level `const` at `:25327`, so no TDZ); `error`, `empty` and `ok` stay distinct and nothing is fabricated; every field read is in census refresh §4 and no STOP field is read; the filter is the three-way whole-string match, never `e.rack` or `summary`; the payload is verbatim with no operator substitution; `assemble`'s `status` literal is untouched and a `note.logged` event cannot reach the `openBlockers` or phase derivations; the truncation wording interpolates no count; the adapter is declared above `PHANTOM_RR`; and no fenced surface is touched. Its only advisory was the §1/D-5 date inconsistency, now fixed.
- **Parent session's own runs, `laptop-chromium`, each spec alone, with no reviewer running tests at the same time:** spec `65` **27/27** · spec `64` **8/8** · spec `04-storage` **18 passed, 2 failed, 1 skipped** — the same two pre-existing failures this document records at §3 and §Q, reproduced independently.
- ⚠ The `adapter-reviewer` and `data-honesty-auditor` checklists were also self-applied while the code was written. That is self-application; the reviewer's inline pass above is the independent one.

⚠ **The `adapter-reviewer` and `data-honesty-auditor` checklists were applied by me while writing the code** — pure read, error containment, honest emptiness, event shape `{ t, type, source, data }`, no cross-class read, no census-undocumented field, no fabricated value. **That is self-application, not review.** It does not satisfy the CLAUDE.md REVIEW MATRIX row *"Assembler, adapter, or registry → adapter-reviewer"*, and it must not be counted as an independent pass. Neither agent is dispatchable from this session.

---

## 5 · Interpretations and deviations — each is the owner's to strike

- **D-1 · Phase 0's counts were verified, not trusted, and they were right.** Ship 2's D-1 recorded that its Phase 0 miscounted the seed's events. Before writing a line of spec or product code, I re-derived Ship 3's E-10 fixture independently in a throwaway node script: the four `RACK` notes, the one undated entry, the `OTHER`/`TEN`/`FOREIGN` counts of 2/1/1, and the full 11-row merged timeline with its `T0+300` four-way tie. **All matched E-10 exactly.** GREEN passed 27/27 on the first attempt, which is the corroboration.
- **D-2 · Nine tests were added, and `GAPS` needed both.** E-10's item 8 (*"Names equal `['identity','phases','blockers','notes']`"*) is partly an **edit** to the existing `GAPS` test at `:544`, which a fourth adapter breaks. I did both: edited `GAPS`, and added a distinct ninth test **`NOTES · REGISTRY`** that makes the same registry assertions **under `seedWithNotes()`** and additionally pins `schemaHandled`, the rr-1 key order and the unchanged `gaps` list. The nine added tests are TIMELINE, SCOPING, EMPTY, ERROR, PURE READ, UNDATED, TRUNCATION, REGISTRY and READOUT · notes.
- **D-3 · `NOTES · PURE READ` asserts the writes BEFORE the precondition, and that is deliberate.** As first written (precondition first, the Ship 2 order) mutation M4 failed the test at the status line — so the snapshot assertion, the one that actually detects a quarantine write, **was never reached**, exactly as Ship 2 recorded for its own M4. I reordered so the two write assertions run first and the `error` precondition runs last. Re-running M4 then produced the real proof: `+ "phantom_quarantine_v1": "{\"phantom_deploy_audit_v1\":{…\"error\":\"Expected property name…\"}}"`. **The precondition is still there and still load-bearing** — on `.593` the test fails on it, which is why it is not vacuous. RED was re-proved with this final spec (§3).
- **D-4 · `matched`, not `events.length`, decides `ok` vs `empty`.** E-7a says *"≥ 1 matching note → `ok`"*. A rack whose every note has an unusable `ts` **has** notes, so it reads `ok` with `events: 0` and a `detail` saying so; `empty` would deny them. This is the same line Ship 2's blockers adapter draws with `mine.length`. I added a case to `NOTES · UNDATED` covering it, because no test in E-10's plan distinguished the two and mutation M6 would otherwise have had a survivor variant.
- **D-5 · `released` now reads `2026-09-21`, the day the ship was finished and pushed.** The build wrote `2026-09-17` because its instruction said so verbatim, and flagged the mismatch instead of silently correcting it — the right call. **The parent session then changed the one field**, with the same `JSON.stringify(…, null, 2)` + CRLF writer, after proving it round-tripped the build's file byte-identically; `notes` also gained *"still blocked on 2026-09-21"* on the WebKit probe sentence. No code moved. The ship was built on 09-17 and completed on 09-21 because the box slowed and the test runs stretched.
- **D-6 · The Ship 3 fixture deliberately does not copy spec 64's `RACK_NOTE` shape.** Spec 64's fixture puts the composite in `rack` (`64-…:76-77`), which no live writer produces (lead L-16). Every `aud()` entry here carries `rack: ''`, as `stripeRack_logNote` actually stores it, with all 16 written fields.
- **Carried from Phase 0, implemented as written:** I-1 (the three-part filter), I-2 (whole-string `entityId`, no `deploymentId` compare or parse), I-3 (`''` reads `empty`), I-4 (text verbatim, never interpreted), I-5 (actor verbatim), I-6 (`t` only for a finite `ts`), I-7 (`auditId: null`), I-8 (absent values are `null`, not omitted), I-9 (`siteId` and the six unused fields ignored), I-10 (non-object members skipped, never an `error`), I-11 (`detail` only when there is something to say), I-12 (a purged rack reads `empty`, no special handling).

---

## 6 · THE ONE LOOK — Safari tab on staging (ruling Q-8); the only WebKit gate for this ship (§G)

**Where:** Safari → `https://phantom-staging.wfj6t2fk7w.workers.dev/dct-ios.html`, **all in one tab**, not the icon. Confirm SYS shows **`phantom-v1.14.594`** first.
**Set-up:** reuse the Ship 1/2 TST99 deployment if it is still in this tab — it holds **one rack**, which is what makes the count comparable (Q-26). Otherwise Build → **＋ NEW** → **LOAD MASTER** (`MASTER-US-TST99-TORTURE-TEST.xlsx`) → select **one** cab (e.g. `s1:001`) → **STAGE SCOPE SNAPSHOT** → name it → **CREATE DEPLOYMENT**.
⚠ **Set an operator name before logging**, or the notes will credit the Build Lead (lead L-9, ruled carry-verbatim by Q-25).
⛔ **Do not use** Command's `LOG` → `SEND` (it writes a deployment FIELD NOTE no rack can hold, Q-19), the assistant's `LOG … NOTE` buttons, or the checklist `+ note`. If you used one anyway the look is **not** failed — count only `RACK_NOTE` rows.

1. **Before any note:** deployment screen → **HISTORY**. Note the header's `N events` and how many rows read `RACK_NOTE` (likely 0). Then add `?rrdev=1` and pick the rack.
   - **PASS:** the coverage line ends **`· notes empty`** when HISTORY has no `RACK_NOTE` rows (`· notes ok (k)` if it has k), **even though HISTORY also lists the Ship 2 look's `BLOCKER_OPENED` / `BLOCKED` / `UNBLOCKED` rows.** That is the scope ruling working (Q-18).
   - Everything before it is exactly as Ship 2 left it: `identity ok (0) · phases ok (0) · blockers …`, and the gold `gaps:` line is unchanged.
2. Reload **without** the param → **BUILD** → **LOG NOTE** → type `RR SHIP3 A` → **OK**. **PASS:** toast `Note logged to s1:001`.
3. **Continue** (or the rack's queue row) → rack detail → **LOG NOTE** → type `RR SHIP3 B` → **OK**. **PASS:** the same toast.
4. **Optional, chip hold:** **LOG NOTE** again → press and hold the chip `IN PROGRESS` for about a second. **PASS:** the prompt closes and the same toast appears. If iOS does not fire the hold the prompt stays open — tap **CANCEL**; that is **not** a FAIL.
5. Deployment screen → **HISTORY**. **PASS:** the header reads `N+2 events` (`N+3` with step 4), and the new rows read `RACK_NOTE` with your text and your operator name.
6. Add `?rrdev=1` → pick the rack.
   - **PASS:** the coverage line ends **`· notes ok (M)`**, where **M is the total number of `RACK_NOTE` rows HISTORY now lists** — 2 more than step 1, or 3 with step 4 (so `notes ok (2)` on a fresh deployment).
   - The JSON timeline holds `note.logged` events whose `data.text` reads `RR SHIP3 A`, then `RR SHIP3 B` (then `IN PROGRESS`), with `data.actor` = your operator name, each with a numeric `t`, and they are the newest events so they come last.
   - `status` is exactly as before: `phase` unchanged, `openBlockers` unchanged, `photoCount`/`photoBytes` `null`, and **no `noteCount` key** (Q-22).
7. Reload without the param: **no trace** of the readout.

**FAIL:** `notes` reads `error` · `notes ok (…)` with a number that does not match the new `RACK_NOTE` rows · `notes` counts a `BLOCKER_OPENED`, `BLOCKED`, `UNBLOCKED` or `FIELD NOTE` row · a `note.logged` whose text is a blocker description · any event without a numeric `t` · `identity`, `phases` or `blockers` changed from Ship 2's values · `openBlockers` or `status.phase` moved because of a note · any trace of the readout without the param.

**Not a FAIL — recorded disagreements (Q-26):** the rack detail's *RECENT ACTIVITY* showing none or only some of the notes (it shows a note only if the text contains the rack's name, lead L-12) · the shift report's *Field Notes* count excluding rack notes (it counts `OMNI_NOTE` only) · the HISTORY header counting every action.

**What the look cannot show:** truncation (the 2,000-entry cap is device-wide — **do not try to fill it**), the restore marker, undated entries, a malformed or non-array store, the `''` guard, scoping between racks (HISTORY rows do not name their rack, so a two-rack deployment cannot be checked by eye), and voice notes. **Spec 65 owns all of them**, and each has a named test in §3.

---

## Q · Found, not worked

- **Leads L-7…L-16** from `docs/A2-SHIP3-PHASE0-EVIDENCE.md` stand unchanged and **none was fixed** — that is the ruling (handoff §8). The ones this ship had to design around: **L-7** (`truncatedCount` does not accumulate, so the reset wording states no number — M12 pins it), **L-9** (the Build Lead is credited when no operator is set; carried verbatim per Q-25, the writer defect is the owner's to schedule), **L-12** (NERVE's text-substring activity filter, why §6 calls its disagreement not-a-FAIL).
- **New, found while building — the environment moved under the suite.** `04-storage:461` and `:605` passed on 2026-09-17 and fail today **on untouched `c24cf12`** as well as on Ship 3. `:461` fails with `ReferenceError: PHANTOM_BACKUP_EXCLUDED_KEYS is not defined` (a global declared at `:55956`, byte-identical in both trees) and `:605` with `locator.click: Element is not visible` on `#pe-tapcatch`. The same `#pe-tapcatch` signature produced the one-off `01-nav:399` failure. This looks like a slow-box boot-timing class, not a code regression, but **it is a suite-health finding the owner should know about**: two `04-storage` tests are now red on the promoted, verified `.593`. It is outside this ship's scope and was not touched.
- **A.3 traps carried:** rr-1 `status.openBlockers` vs `deploy_generateReport`'s `summary.openBlockers` share a name (Q-16, lead L-5); the shift report's *Field Notes* and the Record's rack notes share a word (Q-26). Neither may be printed under one label by any A.3 renderer.
- **The WebKit block (§G)** is unresolved. Ship 4 probes `phone-webkit` first and returns to the owner if it is still blocked.

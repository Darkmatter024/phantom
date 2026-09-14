# v1.14.590 — HANDOFF READINESS PREDICATE · SHIP EVIDENCE

**Ship:** FIX-HANDOFF-READINESS-PREDICATE (external principal-engineer review of live `.589`, 2026-09-13, Finding 3 / P1).
**Phase 0:** `docs/HANDOFF-READINESS-PREDICATE-PHASE0-EVIDENCE.md` (committed `3787748`).
**Ruling:** owner delegated the three open recon questions in-session (*"you pick"*, 2026-09-13). The calls are recorded in §2 so they can be struck.
**Baseline anchored before any edit:** staging (`main`) = release (PHANTOM icon) = `HEAD:version.json` = `VERIFIED` line 1 = **`phantom-v1.14.589`**. Working tree clean.

---

## 1 · What changed

Four edits to `dct-ios.html`, one new spec file. **No storage schema change. No new key. No change to handoff generation content.**

| # | Where | Change |
|---|---|---|
| 1 | constants block, beside `HANDOFF_KEY` | new `HANDOFF_WINDOW_MS = 12 * 60 * 60 * 1000` |
| 2 | `handoff_generate` | `cutoff` now reads the shared constant; its function-local `SHIFT_WINDOW_MS` declaration is gone. **Same number, no behaviour change** |
| 3 | handoff module, after `handoff_purge` | new `handoff_stampOf(h)` and `handoff_isCurrentFor(deploymentId)` |
| 4 | `cs_renderReady` gate array | `['Handoff started', …]` now calls `handoff_isCurrentFor(activeDep && activeDep.id)` |

**The defect, in one line:** the gate read `!!(hraw && JSON.parse(hraw))` over the raw key, and `JSON.parse('[]')` is `[]`, and `!![]` is `true`.

⭐ **`handoff_isCurrentFor` reads through `handoff_loadAll()` → `safeGet`**, so a malformed blob is quarantined and returns `[]` — the gate stays OPEN, never throws, never passes. That also retires the Phase 0 finding that `:23496` bypassed the canonical accessor with a raw string literal and its own parse.

---

## 2 · The three delegated calls

- **Staleness window → the 12-hour window only, lifted to one shared constant.** Rejected the `phantom_shift_end` option: `shift_state()` returns `{kind:'unset'}` by default, so a gate built on it would be strict on devices that set a shift end and loose on those that did not, with nothing on screen saying which. ⭐ The 12h window is also already what `handoff_generate` builds its summary from, so the gate and the artifact it gates now measure the same period. Real shift boundaries are future work (review §C), not this fix.
- **Timestamp → `savedAt`, falling back to `generatedAt`; neither means NOT fresh.** `savedAt` is the moment the technician committed the handoff, which is what the gate claims happened, but it exists only on records this app wrote — a restored record may carry only `generatedAt`. ⛔ Checked with `typeof`/`isFinite`, not `a || b`: a legitimate `0` is falsy and would fall through to the wrong field. An absent stamp never reads as fresh (Contract B10).
- **Resolver → the `activeDep` already in scope.** `cmd_render` resolves it via `nowtab_resolveDep()`; reaching for `deploy_getActiveId()` here would put a **third** answer to "which deployment is active" on one screen. The two-resolver split is a separate recorded defect (board v2 Q-1) and this gate rides whatever fixes it.
- **Label unchanged** — *"Handoff started"*. The fix spec drew that line and no defect remains behind it once the predicate is correct. ⚠ Noted for the record: the store holds only **saved** handoffs, so the strictly honest label is nearer *"Handoff saved"*. Not taken.

---

## 3 · Scope narrowed from what the spec implied — and why

⛔ **The fix does NOT change the shared `handoffDraft` boolean at `cmd_render`.** Phase 0 found six consumers of it, not one. Three make an **assertive** claim rather than a gate reading:

| Consumer | Says |
|---|---|
| shift-end sub-message | *"A handoff draft is open — finish it before shift end."* |
| `cmd_nba` → NBA card | *"Finish your shift handoff."* / **GO TO HANDOFF** |
| signal row | *"Handoff waiting for summary"* · **DRAFT** |

Correcting the shared boolean would have made those three **more precisely wrong**: they would fire exactly when a technician had *just saved* a handoff for the current deployment, telling them to go finish it. ⭐ **Their wrongness is pre-existing** — the store has only ever held saved handoffs, so "a draft is open" was already false — and it is a separate finding, logged in §7, not worked here. `cs_renderReady` already receives `activeDep`, so the gate answers its own question with no signature change and no call site moved.

⚠ **The unused `handoffDraft` parameter is deliberately left in place** on `cs_renderDesktop` and `cs_renderReady`, with an inline comment at the gate saying why, so nobody re-wires the row back to it. Removing it would move two signatures and two call sites for a cosmetic win.

---

## 4 · Acceptance — the fix spec's four cases, plus defensive parse

`test/e2e/63-handoff-readiness-gate.spec.js`, run on **`phone-webkit`** — the primary field-device project, not a Chromium stand-in.

| Case | Stored value | Gate state | Dot |
|---|---|---|---|
| 1 · empty list | `'[]'` | **OPEN**, `warn` | `rgb(255,214,10)` gold |
| 2 · foreign deployment | `[record(dep_hof_b, now)]` | **OPEN**, `warn` | gold |
| 3 · stale | `[record(dep_hof_a, now − 13h)]` | **OPEN**, `warn` | gold |
| 4 · fresh | `[record(dep_hof_a, now − 1h)]` | **OK**, no warn | `rgb(61,220,132)` green |
| 4b · after deployment switch | same record, `phantom_active_deployment → dep_hof_b` | **OPEN**, `warn` | gold |
| 5 · malformed | `'{not json at all'` | **OPEN**, `warn` | gold |

⚠ **Every case asserts the DOT as well as the text.** `.577`'s first cut of the neighbouring gate passed its text assertions while the dot still rendered the OK green — the lie was in a colour, which is why `.578` exists.

**RED → GREEN, measured on this branch:**

- **With the fix: 5 passed** (40.1s).
- **With `dct-ios.html` stashed to `.589`: 4 failed, 1 passed** (45.6s). The four failures are exactly acceptance cases 1–4, each reporting `Expected "OPEN" / Received "OK"`.
- ⚠ **Case 5 passed BEFORE the fix too, and that is stated rather than counted.** The old `try/catch` already swallowed the parse error and left `handoffDraft = false`. Case 5 is a **regression guard**, not a proof of defect. The honest claim is **4 RED → GREEN**, not 5.

---

## 5 · Regression

| Spec set | Project | Result |
|---|---|---|
| `98-cmd-census.spec.js` — the neighbouring surface | `phone-webkit` | ✅ **27 / 27** (3.4m) |
| `04-storage` · `11-event-log` · `12-blockers` · `13-phase-model` | `phone-webkit` | ⚠ 47 passed, 1 failed, 1 skipped (5.5m) — see below |

⭐ **Phase 0 predicted `98-cmd-census.spec.js:185` would need its seed updated. It did not, and the prediction is corrected rather than left standing.** That test seeds `{open:true, summary:''}` — an object with no `deploymentId` — to drive `cmd_nba` to the GO TO HANDOFF branch. `cmd_nba` reads the shared `handoffDraft`, which this ship does not touch, so the seed still does exactly what it was written to do. The prediction was correct for the fix shape the spec implied and wrong for the narrower one taken.

**The one failure: `04-storage.spec.js:461`** — *"a full backup restores every key it captured after localStorage is wiped"*. ⛔ Not a member of the pinned baseline (`docs/PLAYWRIGHT-BASELINE.md`: `10-site-profile-root:84`, `37-locked-rack-pose:141`, `37:179`, `39-sw-update-path:64`), so it was not accepted on the count.

⭐ **Three runs settle it, and the control is the one that matters:**

| Run | App | Result |
|---|---|---|
| `04-storage:461` alone | **with fix** | ✅ 1 passed (8.3s) |
| batch A (4 specs) | **with fix** | ⚠ 1 failed — `:461` (5.5m) |
| **batch A (4 specs) — CONTROL** | **stashed to `.589`** | ⛔ **2 failed — `:605` and `:668`. NOT `:461`.** (1.5h) |
| `04-storage.spec.js` whole spec alone | **with fix** | ✅ **20 passed, 1 skipped** (2.3m) — includes `:461`, `:605` and `:668` |

⛔ **THE UNFIXED APP FAILS THIS BATCH TOO, WITH DIFFERENT MEMBERS.** The failing set moves between runs on the same box while every one of those tests passes when `04-storage` runs alone. **The change is not implicated: it cannot be the cause of a failure that also occurs without it, on different tests.**

⚠ **And the clock names the real cause.** The control took **1.5 hours** for the same 49 tests the fixed run finished in **5.5 minutes** — a 16× spread on identical work. That is the documented WebKit GPU-process climb (≈20 MB per test toward a ~2 GB peak, state file §9) and `docs/TEST-SUITE-RECOVERY-PLAN.md`, not a code difference. **This laptop cannot produce a trustworthy multi-spec `04-storage` result.** CI's full-serial job is the instrument for that, and it is where this belongs.

⚠ **Stated honestly: this does NOT certify `04-storage` healthy.** It establishes that the batch was already unstable at `.589` and that none of the three moving members touches the handoff readiness gate. ⛔ None of `:461`, `:605` or `:668` is in the pinned baseline, so **the pinned baseline no longer describes what this box produces for `04-storage`** — a harness finding, logged in §7, owed to CI rather than to this ship.

---

## 6 · Mechanical gates

- **Inline script compiles** — 3 inline blocks, `vm.Script` clean, run with the guard's own `checkCompile` logic before any commit.
- **Brace balance** — 14,417 `{` vs 14,417 `}`.
- **Three-stamp lockstep** — `dct-ios.html` / `sw.js` / `version.json` bumped together; the hook refuses the commit otherwise.
- **VERIFIED gate** — `.589` is stamped, so a `.590` bump is permitted.
- **Line endings** — `dct-ios.html` stays CRLF; no renormalisation.
- ⛔ **Promote is the owner's.** Claude Code pushes `main` and PARKS. `verify.ps1` and `promote.ps1` were not run and will not be.

---

## 7 · Q · Found, not worked (Hard Stop Rule)

- The three assertive surfaces above (`cmd_render`'s shift-end message, `cmd_nba`, the signal row) still read the raw-truthiness `handoffDraft` and still say *"a draft is open"* over a store that holds only saved handoffs. Pre-existing, louder than the gate, and a separate ship.
- The `HANDOFF WAITING` banner filters `h.status === 'saved'` with **no deployment filter and no time filter** — the same defect class, unfixed.
- `status: 'unread'` is dead in storage: `handoff_saveRecord` overwrites it to `'saved'` before every write, so both `status === 'saved'` filters match every record and are no-ops.
- `phantom_handoff_v1` has no cap and no shift-end purge; `handoff_purge` fires only on deployment delete.
- `shiftDate` on a handoff record is a locale display string sitting beside two epoch-ms fields.
- The `handoffDraft` parameter is now unused in both `cs_renderDesktop` and `cs_renderReady`.
- ⛔ **The pinned Windows baseline no longer describes this box for `04-storage`.** Three tests (`:461`, `:605`, `:668`) fail intermittently in multi-spec batches, none of them baseline members, all green standalone — and a 49-test batch varied 5.5m to 1.5h. `docs/PLAYWRIGHT-BASELINE.md` needs a re-pin from CI, not from here.
- ⚡ **`phone-webkit` LAUNCHED AND RAN CLEAN ON THIS BOX — board item Q-5 is stale.** Q-5 records that the primary project cannot start here because Smart App Control blocks `ms-playwright/webkit-2336/libxslt.dll`, and that every suite run is therefore "Chromium at 390×844, SIGNAL NOT THE PRIMARY GATE". It ran 32 tests across two specs and a further 49 in batch A without a launch failure. **Every result in this document is primary-project evidence, not Chromium signal.** Why the block lifted is not established here and is not this ship's question.

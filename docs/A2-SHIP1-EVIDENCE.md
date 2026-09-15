# A.2 SHIP 1 — EVIDENCE · Rack Record assembler core, registry, identity + phases adapters, `?rrdev=1` readout

**Written:** 2026-09-15 · **Status:** ⏳ **SHIPPED AS `v1.14.592` — device verify owed (§6).** Cherry-picked from `f0466da` onto the verified `.591` with an identical `git patch-id`. *It was held on branch `a2/ship1-assembler` until `.590`, then `.591`, was adjudicated; the "held" notes below are that history.*
**Re-run on `.591` code before shipping, each spec alone on `phone-webkit`:** `65` 10/10 · `64-report-engine-characterization` 8/8 · `00-boot` 4/4 · `63-handoff-readiness-gate` 5/5 · `98-cmd-census` 27/27 · `04-storage` 20 passed, 1 skipped (its baseline). `phantom-ship-gate` PASS on the cherry-picked branch; the `phantom-rd-reviewer` PASS below applies unchanged because the change is byte-identical.
**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md` — owner GO 2026-09-15. **Rulings:** `OWNER-RULINGS.md` 2026-09-15, Q-1…Q-9. **Phase 0:** `docs/A2-SHIP1-PHASE0-EVIDENCE.md`.
**Baseline:** `main` @ `b7493ed`, `dct-ios.html` at `v1.14.590`.

⛔ **WHY IT IS HELD.** `VERIFIED` reads `.589`; `.590` is on `main` unstamped. The guard refuses a `version.json` bump until `.590` is adjudicated, and committing this product source to `main` under the `.590` stamp would give one version number two meanings — the `.588` drift. **When `.590` is ruled:** merge this branch to `main`, add the three-stamp bump in the same ship, push, and the owner's loop runs as normal (staging look → `verify.ps1` → `promote.ps1`).

---

## 1 · What changed

| File | Change |
|---|---|
| `dct-ios.html` | **+225 / −0, one hunk**, inserted after `window.PHANTOM_PHASE_MODEL = PHANTOM_PHASE_MODEL;` (`:31576` at `.590`) and ending before `// GHOST ECHO — Tribal Knowledge Cache`. Contents: `_rr_readKey` · `RR_ADAPTER_IDENTITY` · `RR_ADAPTER_PHASES` · `PHANTOM_RR` (+ `window.PHANTOM_RR`) · the readout IIFE between `A.2 DEV READOUT · rrdev` and `END rrdev` |
| `test/e2e/65-rack-record-assembler.spec.js` | new, **10 tests** |

**Not changed:** `sw.js`, `version.json`, and **no pre-existing line anywhere in `dct-ios.html`** — so not `deploy_generateReport`, not `safeGet`, not any renderer, nav, loader or storage writer.

---

## 2 · How each ruling landed

| Ruling | In the code | Proved by |
|---|---|---|
| **Q-1** beside `deploy_generateReport` | no call to it; no line of it touched | spec `64` **8/8** |
| **Q-2** `platform`/`masterPresent` null with a reason | both `null`; coverage row `rack` carries the reason — see **I-2** | `65` RECORD |
| **Q-3** two adapters | `registry: [RR_ADAPTER_IDENTITY, RR_ADAPTER_PHASES]` | `65` RECORD (coverage rows) |
| **Q-4** phase count derived | `of` = the rack's phase records; `{index:null, of:null, name:null}` when none | `65` EMPTY, STATUS |
| **Q-5** one raw reader, `safeGet` untouched | `_rr_readKey`: `getItem` + `JSON.parse` in `try`, no quarantine, no toast | `65` ERROR, PURE READ |
| **Q-6** `tech.identity` = the actor | the stored `operator`, trimmed; `siteLead` only inside `site.profile` | `65` RECORD |
| **Q-7** `siteId` = profile `id` | `null` when absent; `facilityId` never substituted | `65` RECORD |
| **Q-8** device look in a Safari tab | §6 below | owner |
| **Q-9** | no change | — |

⚠ **Q-6, stated precisely:** the adapter reads `operator` from the raw stored profile rather than calling `PHANTOM_SITE.currentOperator()`. The value is the same — that getter returns `String(p.operator || '').trim()` (`:34910`) — but it reads through `this.load()` → `safeGet`, which is not a pure read (Phase 0 §2).

---

## 3 · Proof

**RED first.** All 8 original tests failed on `.590` for the missing feature and nothing else: six on `PHANTOM_RR is not defined` / `PHANTOM_RR.assemble is not defined`, two on `#rr-dev` not found.
**GREEN.** 8/8 on `phone-webkit` (47.3 s); **10/10 on the final source** (58.0 s).

**Mutation checks — six realistic breaks, each caught by the test built for it, each reverted:**

| # | Mutation to `dct-ios.html` | Went red | Assertion that fired |
|---|---|---|---|
| M1 | completion needs only `signedOffAt` (status check removed) | TIMELINE | received a `network` completion at `T0+999` |
| M2 | identity `profile` from `siteProfile_load()` | RECORD | *"profile carries stored values only"* — received `floorZones`, `pduType`, `platforms` |
| M3 | malformed JSON read as absent | ERROR (+ PURE READ) | *"malformed JSON must be error, never empty (P3)"* |
| M4 | readout mounts without `?rrdev=1` | READOUT absent | `#rr-dev` count expected 0, received 1 |
| M5 | every-phase-complete names the last phase | STATUS | received `"name": "validation"` |
| M6 | `try/catch` around `ad.read` removed | FOLD | *"a throwing adapter escaped assemble()"* — received `"kaboom"` |

M1–M4 left every other test green, so each break is caught where it belongs. ⚠ **STATUS and FOLD were written AFTER the code**, to cover two branches the first cut left untested; a test written after passes on its first run by construction, which is why M5 and M6 exist.

**After every revert:** all six remnant checks read 0, both restored lines read 1, `git diff --numstat` is still `225 0`.

**Regression, `phone-webkit`, each spec run on its own:**

| Spec | Result |
|---|---|
| `64-report-engine-characterization` | **8/8** — handoff acceptance #3 |
| `00-boot` | **4/4**, including *"no uncaught exception and no console error"* |
| `63-handoff-readiness-gate` | **5/5** |
| `98-cmd-census` | **27/27** |
| `04-storage` | **20 passed, 1 skipped** — identical to `.590`'s standalone baseline |

⚠ **A MISREAD OF MINE, RECORDED.** The `04-storage` run listed one row as `x` (`:368`) and I first read it as a regression. It is that file's **`test.fail`** — a pinned defect (the quarantine rewrites on every read), expected to fail and counted as passed. `--list` confirms **21 tests** in the file, so 20 + 1 skipped is all of them. Nothing was changed on account of it.

⛔ **NOT CLAIMED:** a batched or full-suite run. This box has OOM-killed multi-spec batches before; the full serial suite is CI's job.
⚠ `00-boot`, `63`, `98` and `04` ran after M1–M4 were reverted and **before** M5/M6 were applied and reverted; product source at those runs is identical to final by the remnant checks and numstat above.

---

## 4 · Integrity and review

- **CRLF:** 60,864 lines, 60,864 CR bytes. **Inline scripts:** 3, all compile. **CSS braces:** balanced (4,804/4,804 counted over `<style>` blocks with comments stripped; the ship gate's own per-block count was 4,812/4,812 — different method, both balanced).
- **`phantom-ship-gate` — PASS, 7/7.** One FLAG, not a fail: the readout mounts on `document.body`, outside any redesign scope. That is the handoff's own shape for a temporary `?rrdev=1` surface; it is gated, writes nothing, and is deleted in Ship 4.
- **`phantom-rd-reviewer` — PASS.** Also ran the `adapter-reviewer` and `data-honesty-auditor` checklists inline (those agents are not dispatchable). Every field an adapter reads is census-documented; zero `var()` tokens in the diff; channel colours consistent (gold notice, cyan control, magenta NO RACKS); close control 44×44.
  - **(a)** picker through `deploy_loadAllRacks()` — **correct**: picking is not assembly, and a second rack lister would be a second engine.
  - **(b)** the synthetic `rack` coverage row — **acceptable but loose** → **Q-A**.
  - Advisory: the `#app`-missing branch warns without a toast — a debug-only path that dies in Ship 4.
- ⚠ **Both reviews ran before STATUS and FOLD were added.** Product source has not changed since; the two added tests were not reviewed.

---

## 5 · Interpretations — each is the owner's to strike

- **I-1** `status.openBlockers`, `photoCount`, `photoBytes` are **`null`**, not the `0` the rr-1 example shows: no adapter that owns them is registered, and a 0 would claim a count nobody took. They become numbers in Ships 2 and 4.
- **I-2** Q-2's reason rides a coverage row `{ adapter: 'rack', status: 'empty', events: 0, detail }` although no rack adapter exists.
- **I-3** A rack with **every** phase complete reads `{ index: 5, of: 5, name: null }` — no phase is "current".
- **I-4** No stored profile → identity `empty`, `siteId` and `tech.identity` `null`. An **empty** stored operator → `''`.

---

## 6 · The ONE look — only after `.590` is adjudicated and this ships

**Where:** Safari, **not** the icon (Q-8) — `https://phantom-staging.wfj6t2fk7w.workers.dev/dct-ios.html`, all in one tab.
**Do:** confirm site setup if asked → Build → **＋ NEW** → **LOAD MASTER** (`MASTER-US-TST99-TORTURE-TEST.xlsx`) → select one cab, e.g. `s1:001` → **STAGE SCOPE SNAPSHOT** → name it → **CREATE DEPLOYMENT**. Then add `?rrdev=1` to the address in the same tab and pick the rack.
**PASS:** the readout opens; coverage reads `identity ok (0) · phases ok (0) · rack empty — …`; the JSON shows `rack.rackId` as `rack_dep_…_0`, `status.phase` as `index 0 · of 5 · name "mechanical"`, and `tech.identity` as the operator you set. Closing it and loading the page **without** `?rrdev=1` shows no trace of it.
**FAIL:** no readout; `NO RACKS` after creating the deployment; any adapter reads `error`; `phases` reads `empty` for the rack just created; or any trace of it without the param.

---

## Q · Found, not worked

- **Q-A (before Ship 2).** Keep the synthetic `rack` coverage row, or carry Q-2-style gaps in a separate `gaps: [{ field, detail }]` list so coverage stays exactly one row per registered adapter? Reviewer's suggestion; no Ship 1 change.
- `test/e2e/64-report-engine-characterization.spec.js`'s header still says Ruling 2 *"extends"* — stale since the Q-1 amendment; test-only fix on request.

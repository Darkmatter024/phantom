# BATCH 1 — EVIDENCE TABLE · `phantom-v1.14.581`

**Written:** 2026-09-05 · **Format:** `SHIP-HANDOFF-BATCH-OODA.md` §7
**Ship commit:** `f32e49a` ⚠ *(mis-titled — see Deviation 2)* · **`main` head:** `694ef3b`
**Status:** evidence delivered. **Awaiting John:** device verify on `main`, then `stamp.ps1`, then `promote.ps1`.

⚠ **ANCHOR NOTICE — every `dct-ios.html` line number in this document below `:8987` is +11 stale.**
The Q-b note was amended in place under the owner ruling of 2026-09-05, adding 11 net lines at
`:8980`. **The anchors below were correct at `dc8f486` and are correct against current `main` only
after adding 11** — e.g. the app stamp reads `:12854` here and is `:12865` now,
`cmd_masterRackCount()` reads `:23671` and is `:23682`. They are left as written rather than
rewritten in bulk, because a snapshot re-numbered by hand is how a wrong anchor gets into the
record. ⛔ **One is wrong independently of the shift and is corrected here, not silently:** the
`.574` shift-door gate is cited below as `:24398`; it was **`:24399`** at that commit (`:24410`
now). That was my miscount, not the offset.

---

## Batch header

| Field | Result |
|---|---|
| Batch contents | ONE ship, `.581`, two owner-ruled fixes (Q-b `--tac`, Q-c one rack engine) |
| `VERIFIED` / version drift | `VERIFIED` head = `.580`; tree + `origin/main` = `.581`. **One unverified ship — the SHIP GATE is AT its limit, not over it.** |
| `release` vs `main` | `release` = `4abd92f` serving `.580` (VERIFIED). `main` = `694ef3b` carrying `.581`. The phone still has `.580` until John promotes. |
| Full suite (`phone-webkit`) | **388 passed · 8 failed · 13 skipped** (2.8h). Baseline `.559` was **20 failed**. Of the 8: 4 flake, 1 timeout cascade, 3 reproduce — **none implicates `.581`.** Full breakdown in the run block at the end. |
| Targeted suite | `98-cmd-census.spec.js` — **27/27 pass** at `.581` bytes |
| Owner's private-tab checklist | §"What John actually taps", below |

---

## Ship evidence — `phantom-v1.14.581`

| Field | Content |
|---|---|
| **Version** | `phantom-v1.14.581` |
| **Visible change** | **ONE.** Command stops answering "how many racks" with two different numbers: the hero KPI and the RACKS stat cell both now read the **Master's** cab count, and the headline drops its count entirely — `"Deploying on <site>. Tap one."` ⭐ **The other half (Q-b, `--tac`) changes no pixel but is NOT a no-op — it turned `19-design-tokens-and-picker.spec.js:24` from red to green. Its NOTE, not its fix, is what needs your ruling — see the CORRECTION block and Deviation 1.** |
| **Anchors** | `dct-ios.html:8980-8987` Q-b note · `:8989` `--tac: var(--cyan)` inside `.opswall > div` · `:12854` app stamp · `:23425-23428` Q-c note + `var _mrc` · `:23432` stats array reads `_mrc` · `:23664-23676` engine note + `function cmd_masterRackCount()` at `:23671` · `:23695-23698` `pickN` removal note · `:23709` headline · `:23724` `cs-kpi-racks` · `sw.js:37` cache stamp · `version.json:2,4,5` |
| **Doctrine self-review** | **44px** — no touch target added, moved or resized; PASS by non-participation. **Data honesty** — PASS on Q-c: the count now names its own source, and the headline states no number it cannot justify. ⚠ **One carry-over, NOT introduced here:** `cs-kpi-racks` still renders `"0"` with no Master where `.579`'s pattern says `"—"`. It read `"0"` before this ship too (`String(rackCount \|\| 0)`), so `.581` neither caused nor fixed it; it is already parked as a `DATA-HONESTY-COMMAND` §4 item awaiting an owner ruling. **One visible change** — PASS *as shipped*, because the second change turns out to be invisible. ⛔ It was not intended to be, and that is the finding. |
| **Lockstep** | ✅ three stamps, all `phantom-v1.14.581`: `version.json:2`, `sw.js:37`, `dct-ios.html:12854`. Verified by `grep -o` count = exactly 1 each. |
| **Targeted e2e** | ⛔ **`.581` SHIPPED WITH ZERO NEW ASSERTIONS.** Existing coverage re-run against `.581` bytes: `98-cmd-census.spec.js` **27/27 pass**, including `:204`, which asserts the headline keeps `"Tap one"` — the `.573` contract this ship deliberately preserved. **A written-but-uncommitted spec now proves Q-c directly** (torture case below). It is parked, not landed: adding it is outside Batch 1's GO. |
| **Diff scope** | `dct-ios.html` +36/−9 · `sw.js` +1/−1 · `version.json` +3/−3 · `VERIFIED` +1/−0. Line endings intact — all three ship files report **CRLF** (`file(1)`). JS: 3 inline blocks, **0 compile failures**; `node --check sw.js` OK; `version.json` parses. CSS: **12 style blocks, every one brace-balanced** (3600/3600 on the main block). |
| **Deviations** | **TWO, both material — below.** |

---

## ⭐ CORRECTION (same day, after the full sweep) — read this before Deviation 1

**This document's first cut, and the commit message on `e88b977`, called the Q-b half of `.581`
"a measured no-op". That is wrong, and the error was mine.** The measurement it rests on still
holds — `--tac` changes zero rendered pixels, and everything under Deviation 1 about `.opswall`
matching nothing is unchanged. **What it missed is that a pixel is not the only thing a fix can
change.**

`19-design-tokens-and-picker.spec.js:24` — *"EVERY design token referenced in CSS is actually
declared somewhere"* — **was FAILING in the `.559` sweep and PASSES at `.581`.** `--tac` was the
undeclared token it was catching. **Q-b closed a real, red repo invariant that had been red for at
least 22 versions.** That is not a no-op; it is an invisible fix, which is a different thing and a
legitimate one.

**What survives from Deviation 1, and still needs your ruling:** the ship note's *specific* claim —
that *"the wall had been rendering without its accent since the cells shipped"* — is still false.
No wall ever rendered, so no accent was ever lost or restored. The note describes a visual
restoration; what actually happened was a token-declaration gate going green. **The fix was real;
the reason given for it was not.** ⭐ **The right correction is to the note's stated effect, not to
the fix** — and "one visible change per ship" still holds at one (Q-c), because Q-b's effect is
invisible by nature.

⛔ **Two reading errors of mine were reported to John before this correction and are retracted
here:** (1) mid-sweep I said "zero failures" — my filter missed Playwright's `x` marker, and
failures were already present. (2) I read the `.559` baseline as "349 passed, 0 failed" from a
truncated tail; **it was 20 failed.** The true comparison is **`.559` 20 failed → `.581` 8 failed**,
an improvement, and the `.559` red list is where the `--tac` finding above came from.

---

## Deviation 1 ⚠ — the Q-b note describes a visual restoration that did not happen

*(Read the CORRECTION above first: the fix is real and closed a red gate. What follows is why the
note's stated reason is still wrong.)*

`.581`'s note says `--tac` was dead and that *"the wall had been rendering without its accent since
the cells shipped."* **There is no wall.** The three declarations `--tac` feeds all hang off
`.opswall`, and `.opswall` matches **zero elements** in the shipped app. Declaring the token revives
three declarations attached to selectors nothing matches.

**Source census** — every occurrence of `opswall` in `dct-ios.html` (12, exhaustive):

| Lines | What |
|---|---|
| `8966, 8988, 9004, 9013, 9015, 9017, 9018` | CSS selectors |
| `8976, 14084` | comments |
| `22944, 22946, 22971` | `querySelector('#wk-opswall …')` — three lookups |

No `class="opswall"` anywhere in markup. No `classList.add`, no `className` write, no
`createElement` path creates it. ⭐ **`:14084` says so in the file's own words:** *"The .bnr /
.opsrow / .opswall CSS is deliberately LEFT. It is **inert**."* — written at `.464`, which deleted
`#wk-opswall` along with the Build banner stack under the owner ruling of 2026-08-19.
`test/e2e/03-tools.spec.js:388` records the same move: the tools now live in `.cs-tools .cs-tool`.

**MEASURED, not inferred** — `phone-webkit`, `.581` bytes, cold boot:

```
after boot   : .opswall=0   .opswall>div=0   #wk-opswall=0   .oc-n=0   [data-oc]=0
               .cs-tools .cs-tool=10    body.rd=true
wk_toggleOpsWall() called → no .opsrow host found
after toggle : .opswall=0   .opswall>div=0
```

`querySelectorAll` is document-wide and matches hidden elements, and no code path creates the class,
so no later navigation can produce these nodes. The count is 0 everywhere, always.

**The whole subsystem is unreachable, and the chain closes end to end:**

| Function | Callers |
|---|---|
| `wk_toggleOpsWall` `:22840` | **none** — no `#wk-opsrow` / `.opsrow` markup exists |
| `wk_paintOpsWall` `:22943` | only `:22849`, inside `wk_toggleOpsWall` |
| `wk_opsCellStat` `:22888` | only `:22959`, inside `wk_paintOpsWall` |
| `wk_opsNilLabel` `:22877` | only `:22935`, inside the same dead chain |

⭐ **The dead code is not the defect — it is inert, harmless, and `.464` left it deliberately. The
defect is the NOTE'S STATED EFFECT.** `version.json` and `dct-ios.html:8980` both describe a
user-visible restoration the DOM cannot produce. In a file whose comments are the institutional
memory, and under a rule that says *never label absent telemetry*, a note that names the wrong
effect for a real fix is the same class of failure the note at `:8910` was written to warn about.
**What the fix actually did is close `19-design-tokens-and-picker.spec.js:24` — a red invariant, now
green.** That is the sentence the note should carry.

**This is a ruling for John, not a fix I took:** amend the note in place (cheapest, honest), or fold
the correction into the next ship. I did neither — no unrequested edit to a shipped version.

## Deviation 2 ⚠ — the ship commit is titled as a stamp

`f32e49a` reads **`stamp: phantom-v1.14.580 VERIFIED`** but carries the entire `.581` ship —
`dct-ios.html +36/−9`, `sw.js`, `version.json` — alongside the one-line `VERIFIED` append. The old
`stamp.ps1` committed everything staged. **That is already fixed forward** by `694ef3b`,
*"stamp.ps1 commits the register file and nothing else"*, but the misleading commit stands in
history: `git log --oneline -- version.json` will tell a future reader that `.581` never shipped.
No action taken — rewriting history is not mine to do.

---

## What Q-c actually does — the torture case, measured

Seed: a Master holding **60 cabs**, an **active** deployment holding **1 rack** — the exact shape the
ship note describes, where the hero counted the deployment and the cell summed rack rows.

```
[Q-c TORTURE]  phone-webkit, .581 bytes
 masterCabs                : 60
 deploymentRacks           : 1
 cmd_masterRackCount()     : 60
 kpiRacks (#cs-kpi-racks)  : "60"
 statRacks (RACKS cell)    : "60 Racks"
 heroTitle                 : "Deploying on Harness Facility. Tap one."
 heroCta                   : "PICK A RACK"
```

Both surfaces agree, both are the Master's number, the headline states no count it cannot justify,
and the `.573` pairing — `"Tap one"` above a picker CTA — is intact. **Q-c does what it says.**

⚠ **An honest bound on "one engine":** `cmd_masterRackCount()` `:23671` unifies the **two Command
surfaces**. A third, byte-identical copy of the same expression still lives at `:22894` inside
`wk_opsCellStat` — which sits in the dead chain above, so it renders nothing today. Worth knowing
before anyone reads "one engine" as file-wide.

⚠ **A vocabulary question this ship surfaces but does not answer:** the number is
`Object.keys(racksByCab).length` — **cabinets**. Command labels it `RACKS`; the dead OPS cell labelled
the identical number `CABS`. One of those two words is wrong, and `20-vocabulary.spec.js` has no rule
for it. Parked for John, not assumed.

⚠ **A dead parameter, harmless, noted for the next reader:** `cs_renderHero(…, rackCount, …)`
`:23677` no longer reads `rackCount` — `pickN` went with the count it fed, and `cs-kpi-racks` now
calls the engine. The parameter is still passed at `:23459`. Not a bug; not worth its own ship.

---

## What John actually taps (private tab, `main` URL)

1. Hard-load `main`'s live URL in a private tab. Confirm SYS reports **`phantom-v1.14.581`**.
2. **Cold, no Master:** Command headline reads **`Load a Master to start.`**, CTA **`LOAD MASTER`**.
   *(The RACKS cell reads `0` — known, parked, §4. Not a `.581` regression.)*
3. **Load a real Master, no deployment:** the headline names the site and does **not** say "Tap one".
4. **With an active deployment:** headline reads **`Deploying on <site>. Tap one.`**, the button reads
   **`PICK A RACK`**, and it opens the picker.
5. ⭐ **The one that matters:** the **RACKS** stat cell and the hero **RACKS** KPI show the **same
   number**, and that number is the Master's cab count — not the deployment's rack count.
6. Nothing on Build looks different. *(Q-b touched only unreachable CSS. If anything moved there,
   that is a finding, not the ship.)*

**Then, from John's terminal only:** `tools/stamp.ps1 581 VERIFIED` → `tools/promote.ps1`.

---

## Suite run — full `phone-webkit`, `.581` bytes

```
388 passed · 8 failed · 13 skipped     (2.8h)
```

⭐ **THIS RAN ON REAL WEBKIT, AND THAT NEEDED PROVING.** Board v2 records that Smart App Control
blocked `webkit-2336`'s `libxslt.dll` and that until a Playwright bump landed, *"any suite run is
Chromium at 390×844 — SIGNAL, NOT THE PRIMARY GATE."* **Measured 2026-09-06 and no longer true:**
`@playwright/test` 1.62.1 launches `webkit-2336` and it runs. Engine identity proven by feature
fork rather than by the project name or the UA string — `navigator.vendor` = `Apple Computer, Inc.`,
`window.chrome` undefined, `webkitConvertPointFromNodeToPage` defined, `GPUAdapter` undefined,
`browser.version()` 26.5. A Chromium fallback fails every one of those. **So these numbers carry
the weight the board says they would not.** ⚠ **WebKit-on-Windows is still not iOS Safari and the
physical iPhone gate is still mandatory** — that is `playwright.config.js`' standing warning and
this closure does not touch it.

**Baseline comparison: `.559` was `349 passed · 20 failed · 10 skipped` (1.1h). `.581` more than
halves the failures.** ⛔ The handoff's line *"suite green baseline achieved"* is **not** what the
bytes report — 8 remain. Four of the eight are flake; three reproduce; one is a stale test.

**All eight re-run targeted on an idle box:**

| Failure | Reproduces? | Verdict |
|---|---|---|
| `21-first-run-gate:137` | ❌ passes clean | flake from the loaded 2.8h run |
| `37-locked-rack-pose:179` | ❌ passes clean | flake |
| `43-paste-door:64` | ❌ passes clean | flake |
| `43-paste-door:85` | ❌ passes clean | flake |
| `04-storage:605` | took **19.2 min** alone | timeout cascade, not a logic failure |
| `40-shift-door:41` | ✅ reproduces | **stale test — see below** |
| `10-site-profile-root:84` | ✅ reproduces | **pre-existing, also red at `.559`** |
| `43-paste-door:208` | ✅ reproduces | **test-isolation defect** |

⭐ **NONE of the three touches anything `.581` changed.** Traced individually:

- **`40-shift-door:41`** boots with **no Master** and asserts `#cs-shiftbar` is reachable. It
  measures **0px wide** — because `dct-ios.html:24398` reads
  *"⛔ v1.14.574 — GATED ON THE MASTER (owner ruling, FIRST-DOOR Ship A row 2)"*. **The gate is
  `.574`, not `.581`.** `98-cmd-census.spec.js:244` asserts the *opposite* — that the door is hidden
  with no Master — and passes. Two specs, one ruling, one of them never updated. The `.559` sweep
  predates `.574`, which is why the triage missed it. **Test defect, same class as the four §4
  already cleaned up.**
- **`10-site-profile-root:84`** — `PHANTOM_SITE.migrate()` returns `["id"]`; the test expects
  `"siteLead"`. **It was already in the `.559` red list.** The handoff calls this one
  *"RESOLVED — owner-only pin, do not touch"*, but **the pin was never actually applied**: the spec
  carries no `test.fail()` and was last touched at `v1.14.418`. It is failing, not pinned.
  ⚠ **Flagged, untouched — the `.474`/`.537` authority contract makes this yours.**
- **`43-paste-door:208`** — a foreign warn, `[OPS] no #bw-mount to anchor below`
  (`dct-ios.html:21875`), leaks into the assertion window and fails a
  `toMatch(/paste|box|not/i)`. The paste path itself behaves. **Test-isolation defect.**

**Bottom line for the gate: nothing in the suite implicates `.581`.** The one spec that changed
verdict because of this ship changed it the right way — `19-design-tokens-and-picker.spec.js:24`
went **red → green**.


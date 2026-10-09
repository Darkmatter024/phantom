# SHIP-HANDOFF-BATCH-OODA

**Type:** standing doctrine, not a code ship.
**Status:** ⛔ **NOT IN FORCE. Nothing implemented.** C-1 … C-5 ruled 2026-09-05
(`OWNER-RULINGS.md`); §4 triage complete 2026-09-05. **Existing ship discipline still governs,**
**including max ONE unverified ship,** until §8 is satisfied in full.
**Author:** Claude Code, 2026-09-05, on owner instruction.
**Touches when implemented:** `CLAUDE.md` (ship discipline — CALL 0 and `BATCH-VERIFY.md` struck),
`tools/stamp.ps1` (batch syntax).
**Blocked on:** the **five** defects remaining in §4 being fixed and the suite genuinely green,
plus the sweep runtime regression. One of the original six is already closed (`9078534`).

---

## 1 · What this is

A standing change to how work is planned and adjudicated. Today every ship costs the owner a
device pass. BATCH-OODA moves the owner's attention from **per ship** to **per batch**, and pays for
that by making the machine's own gates stricter and its evidence auditable.

**The trade, stated plainly:** the owner gives up per-ship inspection and gains back his time. In
exchange the loop must never proceed on red, and must produce evidence he can audit without
re-deriving it. If the evidence is not trustworthy the trade is a bad one, which is why §4 is a
hard prerequisite rather than a nice-to-have.

---

## 2 · The doctrine (owner's five points, as given)

### 2.1 Batch mode
Work is planned in chunks of **3–5 small ships per batch**. One visible change each. Sequential
versions. **No per-ship owner check.**

### 2.2 Inner loop, per ship
```
build → self-review against doctrine → lockstep + targeted e2e → diff review against the spec
```
- **self-review** covers at minimum: 44px tap targets, data honesty, one visible change.
- **Any red = fix or park. Never proceed on red.**

### 2.3 Batch gate
- full suite **green** (only meaningful after §4)
- **zero unpinned failures**
- no `VERIFIED` / version drift
- **an evidence table per ship**: what changed, line refs, spec results

### 2.4 The owner's role shrinks to batch boundaries
- one evidence table
- one private-tab pass over the batch's visible changes
- **one stamp per batch** (`stamp.ps1` gains batch syntax — §6)
- **promote stays his**, via `tools/promote.ps1`

### 2.5 Hard rails, unchanged
⛔ No `release` moves. ⛔ No `VERIFIED` writes. ⛔ No doctrine edits.
⛔ **Stop immediately on any gate failure and park the batch.**

---

## 3 · What BATCH-OODA does NOT change

Recorded explicitly so approving this cannot be read as loosening anything else.

| Rail | Status |
|---|---|
| Promote is owner-only (`OWNER-RULINGS.md`, 2026-09-05) | **untouched** |
| `VERIFIED` is owner-only; agent commits of it are blocked | **untouched** |
| Device verify is the owner's | **untouched**, moved to batch boundary |
| Three-stamp lockstep, unique version per ship | **untouched** |
| `phantom-guard.js` mechanical gates | **untouched** |
| No commit on `release`, no non-fast-forward, no `--force` | **untouched** |

---

## 4 · ⛔ PREREQUISITE — the suite baseline triage

⭐ **TRIAGE COMPLETED 2026-09-05. Every row re-verified against `.579`**, not carried over from the
`.559` log — and that mattered: five of the twenty had changed state.

⭐ **FIRST DEFECT CLOSED 2026-09-05 — and it was never an app defect.** See the `03-tools` row.

**Batch mode is meaningless without a trustworthy green.** "Full suite green" cannot be a gate while
the suite has never been green.

### The numbers

| | Result |
|---|---|
| `.559` full sweep (`test/sweep-559.log`) | 20 failed / 349 passed · 1.1h |
| `.579` re-run of the 10 specs carrying those 20 | 15 failed · 11 skipped · 89 passed · 17.5m |
| **after the `03-tools` fix (`9078534`)** | **5 unpinned failures remain** |

### Row by row, verified at `.579`

| Spec:line | Why it fails | Verdict |
|---|---|---|
| `03-tools:410` ×10 | **NOT a hidden host — a ~50ms TEST RACE.** The wait returned as soon as the host had text; `showMode` defers `ops_init` behind a double `rAF` (`:19254`), so `#pg-work` still lacked `active` (`display:none`). Host measured 0×0 at 0/50ms, **362×635 and visible from 100ms**, stable after. | ✅ **CLOSED `9078534`** — test waits for a settled surface; **app untouched** |
| `02-build-forge:389` | RackEngine holds a **DETACHED** attachment (`connected:false`) | **FIX** |
| `05-offline:565` | no `[data-requires-net="1"]` in the DOM — the gate has nothing to gate | **FIX** |
| `10-site-profile-root:84` | migration did not run on a confirmed profile missing `siteLead` | **FIX** |
| `19-design-tokens:24` | tokens referenced with no fallback, declared nowhere | **FIX** |
| `39-sw-update-path:24` | `install()` calls `skipWaiting` — no worker ever reaches `waiting` | **FIX** |
| `01-nav:137` | — | ✅ **already fixed** since `.559` |
| `29-context:72` → `:90` | — | ✅ **already fixed** |
| `29-context:128` → `:203` | — | ✅ **already fixed** |
| `30-rack-above-the-fold:79` | — | ✅ **already fixed** |
| `44-tool-reachability:69` → `:105` | `test.skip(vw < 1024)` — Field tools went **desktop-only** at `v1.14.576` | ⊘ **not a phone test any more** |

⭐ **ZERO STALE TESTS. ZERO NEW PINS WARRANTED.** Nothing in the baseline asserts removed behaviour,
and nothing warranted hiding behind a `test.fail()` — including the ten that turned out to be a race.

### ⭐ What is actually left

**FIVE unpinned failures, five distinct defects:**

1. RackEngine detached-attachment leak
2. the offline connectivity gate has nothing to gate
3. `siteLead` migration does not fire
4. undeclared design tokens
5. SW `install()` calls `skipWaiting`

Each is now one row, one defect — no remaining multiplier. **The prerequisite is five defects.**

⚠ **A latent risk found while diagnosing, not scheduled:** the tool renderers execute while the host
is still 0×0. Nothing fails on it today, but any renderer that measures layout in that window reads
zero. That is the shape that bites later.

### ⛔ Corrections to this spec's earlier drafts

All three errors were mine. All are corrected above rather than quietly overwritten.

1. **"`03-tools.spec.js` has zero `test.fail()` pins" — WRONG. It has FOUR**, at `:519 :539 :560
   :615`, written `test.fail(true, 'reason')`. The original grep only matched the no-argument form.
   They are the "KNOWN DEAD DOORS" block, and they are why twenty failure marks reconcile to fifteen
   counted failures. **Any future pin audit must match `test.fail(` , not `test.fail()`.**
2. **"`44-tool-reachability` and `30-rack-above-the-fold` share the dead-render-host root; one fix
   closes twelve of twenty" — DISPROVED.** `30-rack` passes at `.579`; `44-tool` skips on phone.
3. ⭐ **"Ten rows are one app defect: `#ops-tool-host` is `visibility:hidden`" — WRONG, AND IT IS THE
   MOST INSTRUCTIVE ERROR HERE.** It was a test race; the app was always correct. **The failure
   message itself is what misled two versions of this document:** `visibility` is an INHERITED
   property, so the probe's ancestor walk broke on `#ops-tool-host` itself and never named
   `#pg-work` — the node that actually declared `display:none`. The message was accurate and
   useless. ⛔ **A probe that reports an inherited property must name the DECLARING node — the first
   ancestor whose computed value differs from its parent's — or it will confidently blame the wrong
   element.** Both earlier drafts, and the first triage table, repeated that mistake.

⚠ The earlier note that the four pinned DEAD DOORs might "share the root" and make it fourteen tests
is **withdrawn**: there is no shared root, because there was no app defect to share. Those four cite
`#ops-content` inside the never-active `#pg-sop`, which is hidden *by construction* — a genuinely
different condition, still pinned, still real.

### Pinning discipline

⛔ **A failure may only be pinned by the owner, never by Claude Code.** Pinning is how a real defect
becomes invisible. The existing pins are the pattern to follow — a pin with a stated reason:
`01-nav` 2, `02-build-forge` 1, `03-tools` **4**, `05-offline` 1, `06-composition` 5.

### Also blocking: the suite is far slower than its own baseline

`.559` swept 369 tests in **1.1h**. The 2026-09-04 sweep reached spec 37 of 50 in **9.7 hours**
before it was stopped. Unexplained, and unrelated to any ship. **A batch gate that costs a 9-hour
sweep is not a gate anyone will run**, so the cause has to be found as part of this prerequisite.

⚠ New data point: the 2026-09-05 ten-spec run did 115 tests in **17.5m** — a healthy rate. So the
slowdown is **not** uniform, which argues against a blanket cause (machine load, a global timeout)
and for something specific to the specs the 9.7-hour sweep was grinding through.

---

## 5 · ⚠ CONFLICTS THAT NEED THE OWNER'S RULING

Reported, not resolved. Approving BATCH-OODA without ruling on these leaves contradictions live.

### C-1 · The SHIP GATE says max ONE unverified ship (2026-08-23)

> *"Max ONE unverified ship at a time. A version does not exist until John reports PASS from the
> iPhone. Three unverified ships stacked (.483/.484/.485) is the condition that triggered this rule."*

BATCH-OODA stacks **3–5**. This is a **direct contradiction of the rule, and of the incident that
created it.** BATCH-OODA cannot take effect until that ruling is explicitly amended or revoked.

**What is different now, offered as the argument for amending it — not as a decision:** in 2026-08
there was no `phantom-guard.js` lockstep gate, no `VERIFIED` adjudication gate, no e2e suite of this
size, and no evidence table. The `.483/.484/.485` stack was three *unadjudicated* ships with no
machine gate beneath them. BATCH-OODA stacks ships that have each passed a mechanical gate.
**Whether that is enough is the owner's call, not Claude Code's.**

### C-2 · Ship discipline 0 (CALL 0) already permits batching, with a cap of 6

`CLAUDE.md` already says ships may stack, consolidated via `BATCH-VERIFY.md`, *"every 6 stacked
ships or before any HIGH-risk ship."* BATCH-OODA sets 3–5 and adds gates.
**Does BATCH-OODA supersede CALL 0, or refine it?** If superseded, CALL 0 and `BATCH-VERIFY.md`
should be struck in the same edit so two batching rules do not coexist. Note CALL 0 and the SHIP
GATE in C-1 **already contradict each other today**; BATCH-OODA is the chance to resolve that.

### C-3 · LEGACY-RETIRE explicitly forbids stacking

> *"⛔ one visible change per ship and NO stacking — every stage takes a phone verify before the next
> begins, so Ship discipline 0 (CALL 0 batching) does not apply inside this campaign."*

**Ruling needed:** does BATCH-OODA carve LEGACY-RETIRE out (recommended — that campaign's stages are
high-risk by construction), or override it?

### C-4 · ⛔ THE BIGGEST HOLE: what happens when the private-tab pass fails on ship 3 of 5?

**The doctrine as given does not say.** Batched ships are sequential versions on one chain, so a
defect found at the batch boundary has four possible answers and they are not equivalent:

1. **Whole batch FAILED**, next batch is the fix. Simple, honest, matches how `.578 FAILED → .579`
   worked. Costly: four good ships are tarred by one bad one.
2. **Per-ship adjudication at the boundary** — the evidence table gets a PASS/FAIL column, and
   `VERIFIED` records the batch with the failing version named. Preserves good work; more
   bookkeeping; needs `stamp.ps1` support (§6).
3. **Revert the offending ship**, re-run the gate, re-present. Cleanest history, most work, and a
   revert is itself an unadjudicated change.
4. **Park and hand back** — the current behaviour, no batch semantics at all.

**Recommendation: (2), with (1) as the fallback when the failure is structural rather than
localised.** But this is a ruling, and BATCH-OODA should not be approved without it — an unwind path
discovered *during* a failed batch is exactly the wrong time to invent one.

### C-5 · "No new features during stabilization" (Ship discipline 5)

Ship discipline 5 says the queue is empty by design and new scope needs an owner ruling. BATCH-OODA
changes *how* work is adjudicated, not *what* is authorised. **Confirm that batch approval is not
itself scope approval** — each batch's contents still need the owner's GO.

---

## 6 · `stamp.ps1` batch syntax

⚠ **Load-bearing constraint, from `phantom-guard.js:269`:**

```js
const verifiedToken = (verified || '').split(/\s+/)[0] || '';
if (verifiedToken !== oldVersion) { block }
```

The guard reads **the first whitespace-delimited token of the whole file** and compares it to
`git show HEAD:version.json`. For a batch producing `.580 … .584`, the next bump to `.585` requires
**token 0 to be `phantom-v1.14.584`** — the batch's *last* version. Anything else blocks the next
ship with a message that does not explain why.

Proposed shape:

```powershell
.\tools\stamp.ps1 -Batch VERIFIED -From phantom-v1.14.580 -To phantom-v1.14.584 -Note "BATCH-OODA 1"
```

writing, newest first:

```
phantom-v1.14.584 VERIFIED - batch .580-.584, BATCH-OODA 1
phantom-v1.14.583 VERIFIED - batch .580-.584
phantom-v1.14.582 VERIFIED - batch .580-.584
phantom-v1.14.581 VERIFIED - batch .580-.584
phantom-v1.14.580 VERIFIED - batch .580-.584
```

**Every version gets its own line** — the register stays a per-version record, and one line per
version keeps `-Version` lookups and the duplicate guard working unchanged. The batch is a *note*,
not a new record shape.

If C-4 resolves to per-ship adjudication, the syntax needs a mixed form:

```powershell
.\tools\stamp.ps1 -Batch VERIFIED -From ... -To ... -Failed phantom-v1.14.582 -Note "..."
```

⛔ **`stamp.ps1` remains owner-only and terminal-only.** Batch syntax changes what it writes, never
who may run it.

---

## 7 · Evidence table format (one per ship)

| Field | Content |
|---|---|
| Version | `phantom-v1.14.NNN` |
| Visible change | one sentence, what a person sees differently |
| Anchors | `file:line` for every edit |
| Doctrine self-review | 44px · data honesty · one visible change — pass/notes each |
| Lockstep | three stamps confirmed |
| Targeted e2e | spec file, counts, named new assertions |
| Diff scope | insertions/deletions, line-endings intact |
| Deviations | anything differing from the ship's spec |

Plus a **batch header**: full-suite result, unpinned-failure count, `VERIFIED`/version drift check,
and the single private-tab checklist the owner actually runs.

---

## 8 · Definition of done

1. §4 triage landed and signed off; suite genuinely green with every non-green owner-pinned.
2. Sweep runtime regression explained and fixed, or accepted with a stated number.
3. C-1 … C-5 ruled on.
4. `CLAUDE.md` ship discipline rewritten to BATCH-OODA; CALL 0 and `BATCH-VERIFY.md` reconciled.
5. `OWNER-RULINGS.md` records the SHIP GATE amendment.
6. `tools/stamp.ps1` gains batch syntax, parse-checked, **not executed by Claude Code**.
7. First batch run end-to-end and adjudicated before BATCH-OODA is called standing doctrine.

---

## 9 · Claude Code's own read

Two honest notes, since this doctrine governs the author.

**This spec increases what Claude Code is trusted to do unsupervised.** The right posture is that
the rails in §2.5 and §3 are the price of it, and they are not negotiable downward by the party they
constrain. A gate is not a gate if the thing it constrains can decide it does not apply today.

**The prerequisite is the whole ship.** §4 is not paperwork before the real work — a green suite is
the only thing that makes "no per-ship owner check" safe. If the triage proves the baseline cannot
be made trustworthy in reasonable time, **BATCH-OODA should be declined, not softened.** A batch gate
resting on a suite nobody trusts would move the owner's attention away from the ships *and* leave
nothing watching them.

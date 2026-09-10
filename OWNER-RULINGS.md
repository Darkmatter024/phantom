# OWNER-RULINGS.md

Dated register of owner rulings. **`CLAUDE.md` carries the standing law; this file is the record of
the rulings that changed it.** Where the two disagree, the newest ruling here wins and `CLAUDE.md`
is stale until edited. Newest first.

---

## 2026-09-10 · INTEL-DOCK — ALL FOUR OPEN QUESTIONS RULED. The ghost takes dock slot 4.

**Ruled in session 2026-09-10**, against `docs/INTEL-DOCK-PHASE0-EVIDENCE.md` §5 and its 2026-09-09 addendum, with the options and tap counts in front of him. This closes every item the Phase 0 listed as blocking, and it re-confirms rather than re-opens the 2026-09-03 ruling.

**1 · DOCK COUNT — OPTION A. Four slots: `COMMAND · BUILD · TOOLS · GHOST`; EXIT (hold) leaves the dock for the last row of SYS.**
The 2026-09-03 ruling stands, re-confirmed rather than assumed, exactly as §5 asked. ⛔ **Option B (five slots, SHIFT restored) is REJECTED** — it would restore a pillar while three of SHIFT's nine questions still have no data source, which `PHANTOM_CURRENT_STATE.md` D-1 forbids, and it would change the nav twice for two device verifies. ⛔ **Option C (ghost in the header or as a floating button) is REJECTED** — it leaves the assistant 2+ taps away and re-uses the `.156` medallion that was hidden for being dead.
**A8 / R-02 is not contradicted:** *removing that slot removes the slot, not the feature*. If M4 later wants a SHIFT slot it collides with the ghost, and **that is ruled then, not now.**

**2 · `#cc-asst` — RETIRED when the dock owns the door.**
The dock ghost becomes the **single** opener, so Contract A2 (one door per feature) holds and the door ledger is genuinely **net 0**, not +1. The Command card required a Master to be loaded; the dock ghost does not, so reach goes up as the door count stays flat.
⭐ **This also retires the lying gauge, and the lie is now measured, not suspected.** The card's eyebrow reads a static `AI ASSISTANT · ONLINE` beside a static green dot regardless of `body[data-net]` or the API check. A read-only preflight on 2026-09-09 proved the API can be genuinely unreachable while that gauge still reads ONLINE — a Contract B10 violation that dies with the card rather than needing its own ship.

**3 · GHOST ART — COMMISSION A MATCHING CUT.**
It must match the pipeline the other four dock icons already use: `icons/phantom-nav-*-vN-256.webp`, **256×256, `loading="eager"`**, plus a dim state that reads at arm's length (*"dim means dim"* — a glyph change if opacity alone fails). ⛔ **Reusing `phantom-ghost-v3.webp` is rejected** — it is sized for a 107×122 card and was never cut as a lit/dim pair. This is a **web-Claude art task and a Phase 1 dependency**: flag it early, the way Addendum A3 flagged SCAN. ⛔ **Do not precache it until a consumer exists** (the `.364` lesson).

**4 · THE HARNESS CORS RED — FIX BY ROUTE INTERCEPT IN THE FIXTURE.**
`00-boot.spec.js:18` has been failing on three CORS entries because the Worker correctly refuses the `127.0.0.1` harness origin. The fixture will intercept `PHANTOM_PROXY_URL` so the probe never leaves the harness. ⛔ **Not by widening `BENIGN_CONSOLE`** — the standing rule is *"never widen the console allow-list to get green"*, and this ruling honours it. The in-spec filter `.584` used is rejected as the general fix for the same reason: it leaves the probe firing at a Worker that will always refuse it.
⭐ **It also unblocks the ghost's own tests.** Bound to the SYS aggregate, the ghost renders **dim in every harness run** because the API probe can never succeed there; with the intercept, the lit state becomes drivable and therefore testable.
**Scope:** harness only, no app source, no version bump. It may land **in parallel** with `.586`'s device verify.

### What is still NOT ruled, and must not be assumed

- **`#cs-nav-ext`** — the desktop side-nav EXIT (`:16561` at `.586`). INTEL-DOCK is silent on it. **Default stands: leave it**, per the `.576` pattern (the phone loses the duplicate, the desktop keeps its door).
- **SYS's other nine items** — INTEL-DOCK §2 says *"nothing else moves into SYS in this ship"*; whether the four health rows and five actions are later trimmed, and whether MASTER (B-1) joins, are separate ships.
- **The Next Action card on Build** — recorded open, untouched.

### The gate that is not the owner's

Ship discipline allows **one unverified ship in flight**. `.586` (ICON REFRESH) is built and unadjudicated, so INTEL-DOCK **cannot be built** until `.586` has been on the phone and ruled through `verify.ps1`. Every ruling above is now recorded and waiting; the harness ship in item 4 is the one piece that can proceed in parallel, because it touches no app source.

---

## 2026-09-09 · RESTORE-UNDO — a restore becomes undoable; neither "blank is never an erase" nor strict replace

**Ruling, verbatim (in session, 2026-09-09), answering the `.585` question of whether a backup that
lacks a deploy section may clear it on the device:**

> I'm not ruling "blank is never an erase" and I'm not ruling strict replace either. Neither is
> right. There is no cross-device sync, so there is exactly one copy of that deploy data and an
> unrecoverable clear is the actual risk — but a merge produces a state that never existed on any
> device and gives me no way back to clean. Ruling: restore becomes undoable. Snapshot current state
> before applying, offer one revert. A confirm dialog is something a tech reads with gloves on at
> 3am; an undo is something that works when they didn't. Write that as its own spec, evidence first,
> don't ship it inside .585 or .586.

### What it settles

- The restore keeps its replace semantics; the confirm keeps saying CLEARED (`.585`). Neither is
  the fix. **The fix is a persisted pre-restore snapshot and one revert.**
- **Own ship, own version, evidence first:** `docs/RESTORE-UNDO-PHASE0-EVIDENCE.md` (what a restore
  writes, what it does not touch, why the snapshot cannot live in `localStorage`, what one revert
  must capture) and `docs/SHIP-HANDOFF-RESTORE-UNDO.md` (the spec). Not folded into `.585` or `.586`.

### Q1–Q3 answered the same day (verbatim)

- **Q1, snapshot cannot be taken:** *"Refuse the restore when the snapshot cannot be taken: yes,
  refuse. Tell the tech why in one line. An un-undoable restore on a device holding the only copy of
  that data is the exact failure the ruling exists to prevent."*
- **Q2, band placement:** *"whatever puts the revert in front of the tech at the moment they realize
  it went wrong, not buried. Show me your options with tap counts before you build."* → options with
  tap counts in `docs/RESTORE-UNDO-PHASE0-EVIDENCE.md` §6; owner picks before any build.
  **RULED 2026-09-09 — A, the header band.** Owner, verbatim, with the §6 table and its tap counts in
  front of him: *"a"*. One door: the band beside the storage/backup warnings on every screen while a
  slot exists — `RESTORE APPLIED HH:MM · from <file> · UNDO | KEEP` — persistent until UNDO or KEEP,
  no auto-hide, no interstitial, no SYS row.
- **Q3, expiry:** *"parked, don't guess. Bring me what the storage budget actually allows in
  IndexedDB and I'll rule from that."* → measurement plan in the same evidence §4; the harness engine
  returns `null` for `navigator.storage.estimate()`, so the number comes from the phone.

---

## 2026-09-09 · PROMOTE ORDER — RESOLVED. Principle: verify → stamp → promote is canonical. Mechanics: not runnable until `main` has a served surface

**Context.** Earlier the same day the owner stated the canonical order as *verify → stamp →
promote, device checks against main's live Pages URL*. Measured the same hour (last-modified
2026-09-09 14:26:54 GMT): Pages serves `release` only; `main` is not served at any URL; there is no
`.github/workflows`. Reported back as a contradiction with ruling C (`30f3822`) and rev 2 §0.

**Ruling, verbatim:**

> You're right and the error was mine. Pages serves release, so main has no served surface and the
> order I gave you can't be run as written. Resolve the contradiction in OWNER-RULINGS in my favor on
> the principle and against me on the mechanics: verify → stamp → promote stays canonical, and it
> does not become runnable until main has a served surface.

**The surface, verbatim:**

> This is not its own ship in the app — no dct-ios.html change, no version bump. It's a Cloudflare
> Pages project pointed at main, giving a staging URL alongside the existing GitHub Pages release
> deployment. I already have Cloudflare. Write it as an infrastructure task with the steps for me to
> run, not an app ship. Once staging exists: phone check on staging, verify.ps1, stamp, then I
> promote to release, and release means graduated.

→ `docs/INFRA-STAGING-CLOUDFLARE-PAGES.md`. Pre-checked from the repo: every path is relative
(`start_url ./dct-ios.html`, `register('./sw.js')`, relative `PRECACHE_URLS`, zero `/phantom/`
absolutes), so `main` served at the root of a `*.pages.dev` origin runs unchanged.

**Named exception — `.585`, verbatim:**

> .585 runs serve → see → verify one more time as a NAMED EXCEPTION, recorded as such in
> OWNER-RULINGS with the reason (no staging surface existed yet). It is not precedent.

Reason of record: on 2026-09-09 no staging surface existed and `.585` was already on `main`. Order
for `.585` only: `promote.ps1` → the RESTORE-confirm look on the release URL → `verify.ps1 585
PASS|FAIL`. The owner records the stamp against what he actually saw on the phone.

**What this supersedes and what it unlocks.** Ruling C's order (`30f3822`) and the *serve →
device-see → verify* line in rev 2 §0 are superseded for every version after `.585`. The tools
follow the surface, in a script-only ship gated on the staging URL existing: `verify.ps1`'s
NOT-SERVED / SERVED-BYTES guards move from `origin/release` + the release URL to `origin/main` + the
staging URL; its PASS path stops promoting and prints the promote line instead; `promote.ps1`
Guard 4 returns to requiring the INCOMING version to be adjudicated — the semantics ruling C relaxed
only because nothing could serve an unpromoted version. `CLAUDE.md`'s ship loop is rewritten in the
same ship. Promote remains owner-only, per instance, from the owner's terminal, no exceptions.

---

## 2026-09-08 · PREVIEW-DIAG — RACK-PREVIEW-CONTEXT Option 5, INSTRUMENTATION ONLY, APPROVED

**Ruling, verbatim (in session, 2026-09-08):**

> Option 5 = ruling PREVIEW-DIAG, instrumentation only, approved.

**The premise it rests on, also verbatim, same thread:**

> Untangle .581/.582: .581 stays VERIFIED, leave the guard's refusal — do NOT stamp .581 FAILED, the
> preview bug is pre-existing state-3, not .581's.

### What it approves

- **Option 5 of `docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md` §5: make the silent states speak,
  change nothing else.** Every silent path in `bw_mount3D` already composed a full diagnostic line
  and handed it to the console, and there is no console in a cold aisle. The lines now go to the
  `phantom_crash_log` ring, readable at SYS → DIAGNOSTICS, as TRACE entries excluded from
  `phantom_crashErrors`. Plus one read-only health snapshot per mount, 1200 ms after mount.
- **As its own version.** The ship is `v1.14.582` (`9c03aa3` + review fix `e643517`), already on
  `main`. This entry confirms it; nothing new is built under it.
- **Instrumentation only means:** no re-arm, no re-render, no context allocation, `getError()` not
  called (it clears GL state). Zero pixels change. The one on-screen difference is that the ERRORS
  sheet lists `PREVIEW/…` entries; the SYS row count and dot exclude traces and stay NONE / grey on a
  healthy device.

### What it does NOT approve

- Options 1–4 of the same document. **Option 1** (liveness probe + re-arm) re-opens the `.394` ruling
  that re-arming a starved device worsens context pressure; it needs its own ruling, and only becomes
  a candidate if a device reading names candidate A (`MOUNT_NOT_DRAWING`). **Options 2+3**
  (`webglcontextrestored` listener, drop `{ once: true }`) are cheap and additive but cannot see
  candidate A — own ship, own ruling. **Option 4** touches the `.401` pause/resume contract.

### Why 5 beats the others

It is the only option with zero risk to a starved device, and it turns every future blank preview
from a guess into a reading. The reading then decides whether Option 1 is justified, instead of
taking Option 1 on a hypothesis.

### Verify

Promote → device: BUILD with a Master loaded → SYS → DIAGNOSTICS. **PASS** = a `PREVIEW/` entry is
listed and no JS-ERROR banner appeared. **FAIL** = no entry after a Build visit, or a banner on a
device that was healthy at `.581`. **A blank preview does not fail this ship** — the line it leaves
is the finding. Stamp on the instrument, not on the preview. Checklist: `docs/BATCH1-582-EVIDENCE.md`.

### Record notes

- The `.582` commit message records Option 5 as *"owner-ruled 2026-09-08"*. The owner confirmed it
  and gave it the label **PREVIEW-DIAG** in session on 2026-09-08; this entry is the register record.
- **Same day, recorded elsewhere, not yet given its own entry here:** the promote-order ruling
  (`30f3822`; `tools/promote.ps1` Guard 4 header — promote → device-verify on the Pages URL → stamp,
  and the guard adjudicates the version the phone HAS). That commit calls it *"owner ruling C"*.
  Owner to confirm whether it gets a register entry under that label.

---

## 2026-09-05 · BATCH-OODA — C-1 … C-5 RULED

Spec: `SHIP-HANDOFF-BATCH-OODA.md`. The owner ruled all five conflicts in one message, each
matching Claude Code's recommendation.

| # | Conflict | Ruling |
|---|---|---|
| **C-1** | SHIP GATE 2026-08-23, *"max ONE unverified ship"*, vs batches of 3–5 | **AMEND** |
| **C-2** | Ship discipline 0 (CALL 0) already batches, cap 6 | **SUPERSEDE** |
| **C-3** | LEGACY-RETIRE forbids stacking | **CARVE OUT** |
| **C-4** | Private-tab pass fails mid-batch | **Option 2** |
| **C-5** | Does batch approval authorise scope? | **CONFIRM** |

### What each ruling means concretely

- **C-1 AMEND.** The 2026-08-23 SHIP GATE is amended **by name, not revoked** — the `.483/.484/.485`
  incident stays on the record as the reason the rule existed. The amendment is **conditional on a
  genuinely green suite** (spec §4). Until that lands, max ONE unverified ship still governs.
- **C-2 SUPERSEDE.** BATCH-OODA replaces CALL 0. **CALL 0 and `BATCH-VERIFY.md` are struck in the
  same edit** — two live batching rules is the failure mode this repo already knows.
- **C-3 CARVE OUT.** ⛔ **BATCH-OODA does not apply inside LEGACY-RETIRE.** That campaign keeps one
  visible change per ship and a phone verify between stages, per its own ruling.
- **C-4 OPTION 2.** Per-ship adjudication at the batch boundary: the evidence table carries a
  PASS/FAIL column and `VERIFIED` records the batch with any failing version named. **Fallback to
  Option 1 (whole batch FAILED) when the defect is structural rather than localised.**
- **C-5 CONFIRM.** Batch approval is **not** scope approval. Each batch's contents still need an
  explicit GO. BATCH-OODA changes adjudication cadence only.

### ⛔ NOT YET IN FORCE

These rulings settle the *conflicts*. They do **not** start batch mode. BATCH-OODA becomes standing
doctrine only when spec §8 is satisfied — the §4 suite triage landed and signed off, the sweep
runtime regression resolved, `CLAUDE.md` rewritten, `stamp.ps1` given batch syntax, and one batch
run end to end. **Until then the existing ship discipline governs unchanged.**

---

## 2026-09-05 · PROMOTE IS OWNER-ONLY. The 2026-08-30 amendment is REVOKED.

**Ruling, verbatim:**

> The 2026-08-30 amendment is revoked. Promote is owner-only from now on: never move release, in any
> mode, unless I explicitly order that specific promote in that session. Log the revocation in
> OWNER-RULINGS.md. The promote.ps1 from the scripts ship becomes the only promote path, and it runs
> from my terminal.

### What this revokes

`CLAUDE.md` § *Branch topology — SHIP-GATE-LOCKDOWN*, the block headed
**"⭐ AMENDED 2026-08-30 — CLAUDE CODE MAY PROMOTE."** That amendment permitted Claude Code to run
`git checkout release; git merge --ff-only main; git push origin release; git checkout main` on its
own judgement. **It no longer holds.**

### What triggered it

`release` moved twice inside 24 hours without the owner running a promote:

| Ref move | Time | By |
|---|---|---|
| `e78f0b2 → 2000e02` | 2026-09-05 07:46:02 -0500 | Claude Code |
| `2000e02 → 9cac936` | 2026-09-05 08:26:58 -0500 | Claude Code |

Both were fast-forwards performed by Claude Code on an explicit in-session instruction, and both
were reported at the time. An audit confirmed **no automation moved the branch**: no
`.github/workflows/`, no active `.git/hooks/`, `tools/githooks/pre-commit` contains no
push/merge/checkout, and the only repo-wide matches for `--ff-only` / `push origin release` are
documentation in `CLAUDE.md:146` and comments in `tools/hooks/phantom-guard.js`.

⚠ Not audited from this box: **GitHub-side** branch protection or auto-merge on `release`. `gh` is
not installed here; that check has to come from the owner's terminal.

The ruling is not a finding of unauthorised action. It removes the discretion itself, so the
question cannot arise again.

### The standing rule

1. ⛔ **Claude Code never moves `release`. In any mode. No exceptions, including a session order.**
   No `merge --ff-only`, no push to `release`, no branch reset, no "it is only a fast-forward".
   An in-session instruction to promote is answered by **handing the owner the command**, never by
   running it.
2. **The only promote path is `tools/promote.ps1`, run by the owner from his own terminal.**
3. The 2026-08-27 lockdown's original gates are untouched and still absolute: **`VERIFIED` is
   owner-only**, and **the device verify is the owner's**.
4. A push to `main` changes nothing on the iPhone. Claude Code ships to `main`, reports, and
   **parks**. Reaching the phone is the owner's step.

### ✅ RESOLVED same day — the escape-hatch clause is STRUCK

The ruling as first given contained both an in-session escape hatch (*"unless I explicitly order
that specific promote in that session"*) and a mechanism only the owner can operate (*"promote.ps1 …
runs from my terminal"*). Claude Code reported the tension rather than resolving it.

**Owner ruling, 2026-09-05, same day:** *"Strike the escape-hatch clause: you never move release,
full stop, no session-order exception. The only promote path is promote.ps1 from my terminal."*

⛔ The escape hatch **does not exist**. The quoted ruling above is preserved as the historical
record; this strike governs.

### `promote.ps1` — GO given 2026-09-05

At the time of the ruling the repo contained **no `.ps1` files at all**. The owner then gave an
explicit GO for the scripts ship: **`tools/stamp.ps1` and `tools/promote.ps1`, script-only.**
Until that ship lands there is no promote path and no ship can reach the phone.

### Stale instruction hazard — CLOSED 2026-09-05

`CLAUDE.md` carried the revoked *"CLAUDE CODE MAY PROMOTE"* amendment, and `CLAUDE.md` is what a
fresh session reads at startup. On the owner's instruction both passages were edited to point here:
the § *Branch topology* amendment block, and ship-loop step 4 (*"PROMOTE, then STOP"* → *"PUSH TO
`main`, then STOP"*). No permission language remains.

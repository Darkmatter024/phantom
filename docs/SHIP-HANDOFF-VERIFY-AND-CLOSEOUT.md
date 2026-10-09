# SHIP-HANDOFF-VERIFY-AND-CLOSEOUT
**Written:** 2026-09-08 · **Baseline:** release serves v1.14.582 (unstamped pending John's TRACE-line device read)
**Executor:** Claude Code (fresh session). **Owner:** John.
**Purpose:** (A) Collapse John's per-ship manual work to ONE command. (B) Give the session the full outstanding board so it runs unattended between John's verify points.

---

## 0 · Session start (in order, before anything)

1. Graphify first (SessionStart hook fires the reminder). Read `graphify-out/wiki/index.md` + god nodes for every file a ship touches. Graph is pinned — **no full rebuild** (semantic passes bill this session's tokens; see cost.json). Missing graphify → STOP.
2. Read OWNER-RULINGS.md + CLAUDE.md. Rails, unchanged and non-negotiable:
   - Claude Code **never** moves `release` and **never** writes VERIFIED. Those are John's keys.
   - Order is **device-verify (main's live Pages URL) → stamp → promote.**
   - Punch-list ships only. No rebuild campaigns. Every ship closes ≥1 door (door ledger, net down).
   - Don't end turns with questions on pre-authorized work; park product questions in the batch table's Q section and keep going.

---

## 1 · SHIP FIRST — `verify.ps1`, the one-command gate (this is the automation John asked for)

**Problem it solves:** John currently runs two commands per ship (`stamp.ps1` then `promote.ps1`) and eyeballs the pill/TRACE line in between. He wants one command. The two-key safety property (owner eyes + owner keystroke) MUST survive — this only fuses the mechanics, it does not remove John from the loop.

**Build `tools/verify.ps1`** (PS 5.1, script-only ship, no app code) with this exact behavior:

```
.\tools\verify.ps1 582 PASS     # John saw it pass on device
.\tools\verify.ps1 582 FAIL "blank preview, no TRACE line"
```

Sequence inside the script:
1. **Preflight, fail loud:** confirm HEAD's version.json == the version arg; confirm working tree clean; confirm the version isn't already adjudicated in VERIFIED. Any mismatch → print the named reason, change nothing, exit.
2. **PASS path:** stamp `<version> VERIFIED` → commit → push main → fast-forward `release` to main → push release → poll Pages, print `SERVED: <version>` when the served bytes match. One command, ends with the green proof line.
3. **FAIL path:** stamp `<version> FAILED "<reason>"` → commit → push main. **Never promotes.** Release stays where it is. Ends by printing what release still serves.
4. **Every path prints, up top, one of:** `PROMOTED <version>` / `RECORDED FAILED <version>` / `REFUSED: <named guard>`. No silent success, no dry-run text that reads like a real run (the c6d4931/14028c8 lesson).
5. Keep `stamp.ps1` and `promote.ps1` as the underlying primitives; `verify.ps1` calls them. Fixture-test all three refusal cases (version mismatch, already-adjudicated, dirty tree) before John runs it live.

**What stays John's, still:** the device look. The script cannot see his phone. `verify.ps1 … PASS` is his attestation that his eyes confirmed it — same meaning the stamp always had, now one keystroke. Do NOT add any "auto-pass if tests green" path; Playwright cannot see the iOS render class (see §3), so an auto-pass would be a lie for exactly the bugs that matter.

**DoD:** John runs `verify.ps1 582 PASS` after reading the .582 TRACE line, it stamps+promotes+prints SERVED in one go, and the register/refusal fixtures pass.

---

## 2 · CLOSE the .582 tail (blocks the batches)

.582 = ruling **PREVIEW-DIAG** (Option 5, instrumentation only, approved). It makes the silent 3D-mount state speak as a `TRACE · PREVIEW/MOUNT_LIVE` or `TRACE · PREVIEW/MOUNT_NOT_DRAWING` line in SYS→DIAGNOSTICS→ERRORS. **Either reading is a PASS for .582** — the ship is the instrument, not the preview fix. John reads that line, then runs `verify.ps1 582 PASS`.
- Once .582 is stamped: the real preview fix is a **separate later ship, RACK-PREVIEW-CONTEXT** (state 3, iOS async GPU context-grant, pre-existing since .391 — three.js swallows the loss). Phase 0 evidence already exists (abadbc2). Build the fix on what the .582 instrument now reports; John device-verifies on real iOS.

---

## 3 · Standing verify model (why John's one keystroke can't go to zero)

Playwright (`--project=phone-webkit`) is the agent's precheck and MUST run before every device ask — it catches logic, layout, data-honesty regressions fast, and it's the reason batches can stack. But it is **structurally blind** to the iOS-WebKit async GPU class (the blank preview). For that class, and any "does it actually render/scan/save on a real iPhone" question, John's eye + `verify.ps1 PASS` is the only honest gate. Everything Playwright *can* prove, prove there and don't send John a phone check for it.

---

## 4 · BATCH 2 — DATA-HONESTY-COMMAND (pre-approved scope, one batch, one evidence table)

**P0 (do first — highest value in the whole board):** `exportAllData()` marks backup done before the async read/export finishes; a failed store read can serialize as "included, 0 records" (Ghost Echo manifest). This is field-evidence dishonesty — a tech can believe they backed up work they didn't. Fix so every state message reflects the completed op: Saving… / Saved on this device / Not saved — retry or free space / Partial backup — review missing data. Persistent (not toast) on real save failure.

Then, one visible change each:
- **:23563** gate aggregate-vs-active divergence · **:23699 cs-kpi-pct** ungated percent · **racks cell** counted "0" with no Master → `na`/em-dash per .579 · **count labels** flags(:20241 geometry) vs blockers(:42760 human-triaged) — name what each measures · **SYNCED label** → relabel (it only means "online, no pending local writes," not cross-device sync) · **readiness** confirm setup-gates model or convert to N/A (owner ruling if ambiguous — park, don't guess) · **"Handoff started" in readiness** — split setup-readiness from handoff-review (report §10).

## 5 · BATCH 3 — PUNCH-LIST (pre-approved scope)

Micro-typography 10px/11px → readable floors (~16px instructions, 13–14px support) and **remove `user-scalable=no`/`maximum-scale=1.0`** so zoom works (report §5, real, in CSS) · Master-management still needs a clear door · cage-nut/reference screens that earn nothing · duplicate rack-preview on BOM path · three boot curtains → one · ISOLATE reachable (not 2.9 screens deep) · empty CTAs on no-Master jobs · forge.html P-12 four deprecated `claude-sonnet-4-20250514` strings · old all-workspaces Anthropic key deletion (John, console).

## 6 · BATCH 4 — IA-SHIFTNAV v2 Phase 0 + INTEL-DOCK (design, comprehension gate §6 first)

Governing IA is settled and is NOT the five-tab dock some external reviews propose: **the rack is the unit of work** — load Master → pick rack → work the rack; Scan and OPS tools are rack-scoped actions, not dock destinations; only a short list keeps its own door. Reject any proposal that reopens the five-pillar tab bar.
- **INTEL-DOCK / ghost:** DCT Assistant (ghost) takes a bottom-dock slot (lit online / dimmed offline + "needs signal" sheet); **EXIT (hold) moves to the very bottom of SYS**; SYS final MASTER · PROFILE · DIAGNOSTICS · EXIT; ghost tap opens the A-2 sheet (SPEAK/PASTE TICKET/TYPE OR PASTE/IMPORT FILE).
- **OWNER RULING PENDING — do not assume:** dock tab count and whether the ghost is a 5th slot or replaces one. Phase 0 proposes; John rules before build.

## 7 · HARD STOPS — interrupt John immediately

Unparkable gate failure · any VERIFIED/version drift · anything touching release, doctrine, data-honesty rulings, or destructive ops (Master eviction, PIN-delete) · the iOS-WebKit render class (Playwright can't judge it) · high-risk campaigns (LEGACY-RETIRE-style) stay per-ship, never batched.

## 8 · Background / queued (only if a batch finishes early)

SITE-SYNC Phase 0 graph rebuild (budget vs cost.json ~2.18M tokens — John's GO before any bulk run) · MASTER-TRUTH Phase 0 reconciliation map (read-only, can run in parallel) · webkit-2358 harness ship (likely MOOT — Playwright ran locally; confirm + close) · GitHub release branch-protection check (John, web UI) · six untracked reports + one untracked spec sitting in repo root should move to docs/.

## 9 · Standing engineering rules

One visible change per ship · three-stamp lockstep (dct-ios.html / sw.js / version.json) · CRLF, no `&&` in PS 5.1 (use `;`) · verified-source anchors never guessed · blank is never an erase · closed deployment → dashboard not tombstone · no synthetic values styled as live · 44–48px cold-aisle targets · evidence before patch · a claim cannot outrank a mismatch (D-1) · every log line credits the actor (D-2).

---

### The shape John wants, stated plainly
Agent builds and Playwright-proves a batch → John gets ONE evidence table → John does ONE device pass → John types ONE `verify.ps1 <v> PASS` per verified version (or FAIL with a reason). No per-ship back-and-forth, no two-command dance, no stamp/promote split. The only thing that never automates is John's eye on the glass — because that is the product.

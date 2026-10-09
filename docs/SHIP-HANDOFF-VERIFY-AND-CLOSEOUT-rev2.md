# SHIP-HANDOFF-VERIFY-AND-CLOSEOUT (rev 2)
**Written:** 2026-09-09 · **Baseline:** release + main at b9d7de9, serving v1.14.583 VERIFIED (verify.ps1 gate live, self-tested, christened on .583)
**Executor:** Claude Code (fresh session). **Owner:** John.
**Purpose:** Clear the remaining board via BATCH-OODA, one evidence table per batch, John verifying with the one-command gate.

> **rev-2 note:** an external UI review (v1.14.582 baseline) was cross-checked. Only its *confirmed, source-grounded, scoped* findings were folded in below — flagged **[ext-review, confirmed]**. Its rebuild-shaped program (three-pass roadmap, full component-system standardization) and its five-tab dock proposal were **rejected**: the five-tab model contradicts the settled "rack is the unit of work" IA, and program-scope work violates punch-list-only doctrine. Everything it tagged "needs device validation" stays a lead, not a work order.

---

## 0 · Session start (in order, before anything)

1. Graphify first (SessionStart hook fires the reminder). Read `graphify-out/wiki/index.md` + god nodes for every file a ship touches. Graph is pinned — **no full rebuild** (semantic passes bill this session's tokens; see cost.json). Missing graphify → STOP.
2. Read OWNER-RULINGS.md + CLAUDE.md. Rails, non-negotiable:
   - Claude Code **never** moves `release`, **never** writes VERIFIED. John's keys.
   - Gate is now ONE command: John runs `.\tools\verify.ps1 <version> PASS` (or `FAIL "reason"`) from his terminal. It stamps → commits → pushes → promotes → prints SERVED on PASS; stamps FAILED and never promotes on FAIL. It refuses NOT-SERVED and ALREADY-ADJUDICATED. Order is serve → device-see → verify.
   - Punch-list ships only. No rebuild campaigns. Every ship closes ≥1 door (ledger, net down).
   - Playwright `--project=phone-webkit` precheck before every device ask. It is **blind** to the iOS async GPU render class — that class is John's-eyes-only.
   - Don't end turns with questions on pre-authorized work; park product questions in the batch table's Q section and continue.

---

## 1 · BATCH 2 — DATA-HONESTY-COMMAND (pre-approved scope, one batch, one evidence table)

**P0 — do first, highest value on the whole board. [ext-review, confirmed] + John's own finding.**
`exportAllData()` marks the backup done before its async IndexedDB read/export completes; both error paths serialize as `included: true, recordCount: 0` (Ghost Echo manifest), and the share promise's resolve/reject is never consulted — so "Saved on this device" is currently unknowable, and a failed store can present as an included empty store. A tech can believe field evidence was backed up when it wasn't. Fix so every state message reflects the completed op:
- Saving… / Saved on this device / Not saved — retry or free space / Backup file prepared / Partial backup — review missing data.
- A browser download is NOT proof of a retained recoverable copy — don't imply it is.
- Critical save/backup failure gets persistent feedback, not a disappearing toast.
- For restore: show what will be replaced, validate the backup before applying, report partial/failed recovery honestly.

Then, one visible change each (all reconcile-to-Master / data-honesty):
- **:23563** gate aggregate-vs-active divergence ("—" while blockers exist on a non-active deployment).
- **:23699 cs-kpi-pct** ungated percent (same pattern as the fixed blockers cell).
- **racks cell** counted "0" with no Master → `na`/em-dash per the .579 pattern. **[ext-review, confirmed: "use Not loaded / Not measured, not a misleading zero"]**
- **count labels** — flags (:20241, computed Master geometry) vs blockers (:42760, human-triaged) both read as "things wrong" unlabeled; name what each measures. Use semantic status labels alongside color: Saved / Pending / Blocked / Unknown. **[ext-review, confirmed]**
- **SYNCED label** → relabel; it only means "online, no pending local writes," not cross-device sync.
- **"Handoff started" in readiness** — split setup-readiness from handoff-review; a started draft does not mean the report is ready. Distinguish draft / reviewed / exported states; only claim "acknowledged" if a real receiving-user mechanism exists (a local export is not proof of receipt). **[ext-review, confirmed]**
- **readiness model** — confirm setup-gates-in-readiness is what John wants or convert to N/A (owner ruling if ambiguous — park, don't guess).

---

## 2 · BATCH 3 — PUNCH-LIST (pre-approved scope, one visible change each)

- **Readability + zoom-lock. [ext-review, confirmed]** CSS defines 10px micro / 11px caption tokens; the viewport sets `maximum-scale=1.0` + `user-scalable=no`. Raise essential text toward readable floors (~16px instructions/inputs, 13–14px meaningful support, 20–24px titles) and **remove the zoom restriction** so users can enlarge content (W3C viewport rule). Dense rack elevations may keep smaller labels behind a clear detail view; essential instructions must not rely on microtext. These are starting targets, validate on device.
- **Error-message hygiene. [ext-review, confirmed]** Some API errors expose Worker/key/billing detail in the user-facing string. Show a clear next action (Retry / Continue without AI) with the draft preserved; keep technical detail in an expandable support view. Example only when the draft is actually retained: "Assistant unavailable. Your draft is still here. Try again."
- Master-management still needs one clear door · dead/unearned reference screens (cage-nut etc.) removed or justified · duplicate rack-preview on the BOM path · three boot curtains → one · ISOLATE reachable (not ~2.9 screens deep) · empty CTAs on no-Master jobs · forge.html P-12 four deprecated `claude-sonnet-4-20250514` strings · old all-workspaces Anthropic key deletion (John, console).

---

## 3 · RACK-PREVIEW-CONTEXT — the real 3D fix (own ship, own version)

.582 shipped the instrument (PREVIEW-DIAG / Option 5) that now reports MOUNT_LIVE / MOUNT_NOT_DRAWING. This ship makes the preview actually draw: trace `bw_mount3D` context acquisition on iOS WebKit — the async GPU context-grant is missed (state 3, pre-existing since .391; three.js swallows the loss silently). Investigate the real device failure before choosing recovery; a `webglcontextrestored`/`lost` listener or retry-on-grant is the likely shape. **Avoid repeated automatic graphics restarts (resource pressure).**
**[ext-review, confirmed — good design constraint]:** keep a usable **2D rack representation** available while 3D loads and whenever it fails; selection, phase updates, and verification must work from 2D. A blank preview must never be the only route to a task. Show explicit loading / unavailable / ready states; Retry without blocking progress.
Phase 0 evidence exists (abadbc2). John device-verifies on real iOS — Playwright can't judge this class.

---

## 4 · BATCH 4 — IA-SHIFTNAV v2 Phase 0 + INTEL-DOCK (design; comprehension gate §6 first)

Settled IA — **the rack is the unit of work**: load Master → pick rack → work the rack; Scan and OPS tools are rack-scoped actions, not dock destinations; only a short list keeps its own door. **Reject any proposal that reopens a five-pillar / five-tab dock** (an external review proposed Home/Build/Scan/Tools/Shift — that is the superseded model). The valid concern underneath it — "a new tech must be able to find Scan and Handoff without instruction" — is an acceptance check for the rack-scoped design, not a reason for a tab bar.
- **INTEL-DOCK / ghost:** DCT Assistant (ghost) takes a bottom-dock slot (lit online / dimmed offline + "needs signal" sheet); **EXIT (hold) moves to the very bottom of SYS**; SYS final MASTER · PROFILE · DIAGNOSTICS · EXIT; ghost tap opens the A-2 sheet (SPEAK / PASTE TICKET / TYPE OR PASTE / IMPORT FILE). **[ext-review agrees EXIT should leave the dock.]**
- **OWNER RULING PENDING — do not assume:** dock tab count and whether the ghost is a fifth slot or replaces one. Phase 0 proposes; John rules before build.
- Persistent rack-context strip on task screens (site · deployment · rack · phase), draft keeps its original context across a context switch, no silent re-attach to a new rack. **[ext-review, confirmed as compatible with the rack-scoped model.]**

---

## 5 · HARD STOPS — interrupt John immediately

Unparkable gate failure · any VERIFIED/version drift · anything touching release, doctrine, data-honesty rulings, or destructive ops (Master eviction, PIN-delete) · the iOS-WebKit render class (Playwright can't judge it) · high-risk campaigns (LEGACY-RETIRE-style) stay per-ship, never batched · any proposal that reopens a superseded ruling (five-tab dock, rebuild program).

## 6 · Background / queued (only if a batch finishes early)

SITE-SYNC Phase 0 graph rebuild (budget vs cost.json ~2.18M tokens — John's GO before any bulk run) · MASTER-TRUTH Phase 0 reconciliation map (read-only, parallel-safe) · webkit-2358 harness ship (likely MOOT — Playwright ran locally; confirm + formally close) · GitHub release branch-protection check (John, web UI) · six untracked reports + one untracked spec in repo root → move to docs/ · Claude Code self-update pending (close VS Code, /exit, restart).

## 7 · Standing engineering rules

One visible change per ship · three-stamp lockstep (dct-ios.html / sw.js / version.json) · CRLF, no `&&` in PS 5.1 (use `;`) · verified-source anchors never guessed · blank is never an erase · closed deployment → dashboard not tombstone · no synthetic values styled as live · 44–48px cold-aisle targets · reserve strongest visual emphasis for the active task and actionable exception; keep decorative art/motion subordinate and out of the reading path (preserve reduced-motion support) **[ext-review, confirmed]** · evidence before patch · a claim cannot outrank a mismatch (D-1) · every log line credits the actor (D-2).

---

### The loop, stated plainly
Agent builds + Playwright-proves a batch → John gets ONE evidence table → ONE device pass → ONE `verify.ps1 <v> PASS` (or FAIL "reason"). The only thing that never automates is John's eye on the glass — because that is the product.

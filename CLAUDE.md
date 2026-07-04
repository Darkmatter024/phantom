# CLAUDE.md — PHANTOM (darkmatter024/phantom)

## What this is
PHANTOM is an offline-first, single-file iOS Safari PWA (`dct-ios.html`, ~44k lines) for CoreWeave data-center technicians. Live at darkmatter024.github.io/phantom/dct-ios.html. Built and owned by John (Lead DCT). It is a FLEET-WIDE app: ships site-agnostic; the loaded master file provides all site-specific data (§ Design Law 6).

## Roles
- **John**: owner. All gate decisions. All device verifies (iPhone, real hardware). His word is final.
- **web-Claude**: authors `.md` handoff specs with verbatim `str_replace` anchors.
- **You (Claude Code)**: execute specs, git operations, verification. You may fix draft-spec bugs against live code (verify helper names, selectors, signatures before use) — report every deviation from spec in the commit message.

## Ship discipline — every ship, no exceptions
1. **OODA first**: `curl` live `main` (`dct-ios.html`, `sw.js`, `version.json`) before ANY edit. If live version ≠ spec baseline, STOP and re-anchor. Verbatim strings are truth; line numbers are hints.
2. **Surgical edits only**: `str_replace` with unique anchors. No rewrites, no "while I'm here" changes, no drive-by refactors.
3. **Gates before push**: `node --check` ×3 · CSS brace-balance check · CRLF preserved.
4. **Three-stamp lockstep**: `dct-ios.html` + `sw.js` CACHE_VERSION + `version.json` bump together, always.
5. **One ship per version.** Never stack a second UI change on an unverified one.
6. **Device verify is a HARD STOP.** After push, hand John the verify checklist and PARK. Do not proceed to the next ship on your own initiative.
7. **`?legacy=1` is byte-identical-behavior.** Legacy markup, `showPage`/`showOpsTab`, `#ops-tab-strip`, and legacy render paths are untouchable except in a John-signed R1 deletion pass. "Hide, not delete; rip-cord restores it."

## Hard rules (violations found in the field — never reintroduce)
- **No silent failures.** Never `if (!x) return;` on a user-facing path. Fail loudly: `console.warn` + `phantomToast`. (Root cause of the dead Work-grid cards.)
- **No legacy page IDs in nav state under redesign.** Nothing running under `body.rd` may `nav_push` a legacy `p:` value (e.g. `p:'sop'`). Back-nav must never be able to resurrect a legacy surface. (Root cause of the legacy-leak bug.)
- **One door per feature.** Never wire the same surface to two hand-built entry points. New entry points call the ONE canonical `rd_open*` function.
- **No silent host fallbacks.** Renderers targeting a redesign host must not quietly fall back to a legacy container (`deploy_opsHost` pattern). Warn and abort instead.
- **Merge, never overwrite.** Master-file loads fill gaps in user data; hand-entered values always win and always survive reloads.
- **No base64 images in localStorage.** Photos/attachments: ephemeral or IndexedDB only.
- **Names say what the door opens.** No aspirational or historical labels (MASTER DOC→SITE PROFILE precedent).

## Design law (test every change against these)
1. Shift-shape, not history-shape: COMMAND = situational awareness · WORK = job chain in execution order (Deploy → Master → BOM → Manifest → Port Map → Rack Map → Scan → Handoff) · CRASH CART = zero-state troubleshooting bench.
2. Zero-state test: works with no deployment loaded → CRASH CART reference. Needs deploy state → lives inside the Deploy flow.
3. Additive over surgery: re-homed legacy organs (pg-power family) get new redesign-native layers routed into existing content. No internal rewrites before R4.
4. Cold Aisle Filter: every feature must help a gloved tech in the aisle right now. Tap depth matters. Four taps to reach a reference is a defect.
5. Aesthetic bar: "$10M, not cheesy." Tokens: `--bg:#04060a --cyan:#28e0ff --vio:#8a4bff --mag:#ff2bd6 --teal:#1fffd0 --gold:#ffcb45`. Fonts: Orbitron/Chakra Petch/Rajdhani. Minimum formatting, no clutter.
6. Site data flows from the master; the app carries only fleet truth. One master load hydrates Site Profile, Rack Map, Port Map. Profiles are per-facility; switching masters switches context.

## Current state & queue (update this section every ship)
- Live: `v1.14.178` — **Ship B1 shipped (router gating 1/4); awaiting John device-verify.** Prior: `.174`–`.177` device-verified (all good), R-3b COMPLETE. (History: `.173` landing REJECTED on device → rebuilt as `.175`.)
- Governing docs: `PHASE0-CENSUS.md` (in repo; LIVE/RE-HOMED/STRANDED/RETIRED verdicts — source of truth for R1 deletion). `PHANTOM-MASTER-REORG-SPEC.md` (roadmap + decision log; Downloads-only — copy into repo if it should govern sessions).
- DONE: Phase-0 census (38 surfaces; awaiting John SIGN-OFF) · R-1 `.169` (Work re-sort, 8 shift cards) · R-2a `.170` (Deploy detail absorbs BURNDOWN/AUDITS via `deploy_detailTool`) · R-2b `.171` (retire the TOOLS grid; ⚙→⚑ BLOCKER) · R-2c `.172` (re-home stranded rack LOG NOTE) · R-3a `.173` (PLATFORMS front door — landing REJECTED, superseded) · `.174` (PARTS label consistency) · **R-3b `.175` (PLATFORMS correction: landing rebuilt in rf-card language via `.deploy-tools-grid`, 6 photoreal platform icons, GB-NVL fold REVERTED to 5 cards, per-platform drill-in `rd_platformOpen` filtering the re-homed Power/LED/Thermal reference cards)**. All Phase-0.5 strands resolved/folded.
- Queue: **Ship B** (router gating — plan drafted + adversarially verified in `Downloads/SHIP-B-PLAN.md`; 4 sub-ships): **B1 `.178` DONE** (repoint 15 deploy-flow `nav_push` `p:'sop'`→`p:'work'` under redesign; zero `nav_restore` edit) → **B2** (delete `deploy_showTools`/`deploy_showOpsTool` + clean `nav_restore` `'tools'`/`'tool:'`; ⚠️order-sensitive + change BOTH the `typeof` condition and the call) → **B3** (gate `showOpsTab`'s push) → **B4** (central **`showPage()`-level** guard — NOT `nav_restore`-level, per the verify catch — + host-hardening + optional `showStab`). Each sub-ship = its own version + device-verify; `nav_restore` edits (B2+) need John's explicit go. → **R1 deletion pass** (RETIRED incl. Crash-Cart Mode + dead `rd_openPower`, after Ship B verified).
- R-3b COMPLETE: `.175` landing rebuilt (rf-card language, 5-card revert, per-platform drill-in) · `.176` hid the duplicate Rack Map pill (Work RACK MAP card is its door) · `.177` re-homed Blast Radius to the Deploy detail via Path A (settable `_br_target` + `OPS_TABS.blast` + Row 2.4 button; pill hidden — Deploy is its sole rd door). `rd_openPower` confirmed dead → R1.
- ⚠️ Prior queue also listed **R-2.5** and **F-1** — no specs held; John to define or confirm superseded.
- Open decisions on John: device-verify `.175` (+ `.174`) · census SIGN-OFF · **Ship B go/no-go + router sign-off** · R-3b `.175` deviations OK? (B200→textless reactor art since no on-spec air/textless B200 delivered; cooling as plain `·` meta + accent color not a bordered chip; SHARED icon white-keyed) · greenlight R-3b pill cleanup.
- RETIRED by owner decision: Crash-Cart Mode (do NOT build doors for it; physical deletion waits for R1).

## Communication style
John is terse and field-operational. Match it: lead with status, state deviations plainly, no cheerleading, no hedging. Push back with evidence when the spec or the ask conflicts with live code or these rules — he rewards honest pushback and penalizes churn. When parked, say exactly what you're waiting on and from whom, in one line.

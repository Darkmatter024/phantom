# DEVICE VERIFY — v1.14.483
**Date:** 2026-08-23  
**Ships:** v1.14.481 (UI hardening) · v1.14.482 (quality pass) · v1.14.483 (CLEAN window)  
**Environment:** Real iPhone, iOS Safari PWA  
**Load:** Your real Master (ALP-01 if possible; any Master works for most checks)

⛔ **You are judging what you SEE.** All checks require real hardware behavior (haptic, motion, rendering). CLI automation cannot verify these.

---

## SHIP SUMMARY FOR CONTEXT

### v1.14.481 — UI Hardening
- **Haptic constants:** PASS/WARN/FAIL patterns standardized (semantic feedback)
- **View Transitions:** 120ms cross-fade on page navigation (iOS 18+ feature)
- **Fat ACK bar:** Full-width blocked state indicator (location guard, etc.)
- **Badge honesty:** Shows `—` (em-dash, dimmed) when Master absent

### v1.14.482 — Quality Pass
- **LAYERS card:** Single-line subtitle with ellipsis (no title/subtitle overlap)
- **Location guard:** Down-link wizard step 0 blocks NEXT without location (fat ACK response)
- **Motion audit:** Transitions reduced to 150ms, bare `ease` → `ease-out`, `transition:all` scoped
- **Copy audit:** "LOCATION REQUIRED" is active/commanding (no hedging)

### v1.14.483 — CLEAN Window
- **Orphan function removed:** `_edp_checkpointBootCheck`
- **Dead CSS removed:** `.crashcart-active` guard rules
- **Crash-Cart structural code:** Preserved (R1 deletion pass, not CLEAN work)

---

## DEVICE VERIFY PROTOCOL

⛔ **Load your real Master before starting.** Every check (except noted) depends on Master-loaded state.

### CHECK 1 — FAT ACK BAR (v1.14.481)
**What:** Fat ACK bar should render when location guard blocks down-link wizard advance.

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 1a | Open **ISOLATE** → **DOWN-LINK** wizard. **Do NOT enter a location.** | You see a DOWN-LINK step with `Location: <empty>` | No location field visible; wizard skips step 0 |
| 1b | Tap **NEXT** button without entering location. | A **full-width bar** appears at top saying `LOCATION REQUIRED` in centered white text, colored magenta (fault color). Bar holds for ~800ms then slides out. Haptic feedback (device vibrates). | No bar appears · toast appears instead of bar · bar is undersized or off-screen · bar disappears instantly (< 200ms) · no vibration felt |
| 1c | (Re-check) Enter a location (e.g., "HALL-07 / ROW-C / R-C02 / U14"), tap **NEXT**. | Wizard advances to step 1 (Observe). Bar does NOT appear. | Wizard does not advance · bar appears again even with location entered |

---

### CHECK 2 — VIEW TRANSITIONS (v1.14.481)
**What:** Page navigation should cross-fade smoothly, not cut black.

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 2a | In **COMMAND**, scroll to any page tab (e.g., tap **WORK**). | Page fades in over ~120ms. No black flash. Motion feels fast, not stuttering. (This is subtle — compare to a hard cut you'd see on older iOS.) | Black flash between pages · page appears instantly · fade takes >300ms or feels laggy |
| 2b | Tap another page (e.g., **REF**). | Same fade-in behavior. Consistent across page switches. | Inconsistent (some pages fade, some cut) · any page still cuts black |

---

### CHECK 3 — LAYERS CARD (v1.14.482)
**What:** LAYERS card subtitle should not overlap title even on narrow phone screens.

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 3a | Open **ISOLATE** → **LAYERS** wizard. Look at the grid of cards. Find **LAYERS** card (first card, title: "LAYERS", subtitle: "Name the layer..."). | Title and subtitle are **visually separated**. Subtitle is a **single line** ending with ellipsis (e.g., "Name the layer, name the…"). No text overlap. Card is readable at 390px phone viewport. | Title and subtitle **overlap** · subtitle wraps to two lines · ellipsis not visible (text is truncated at edge without "…") · card looks visually broken |

---

### CHECK 4 — LOCATION REQUIRED COPY (v1.14.482)
**What:** Location guard message should be direct and command-like, no hedging.

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 4a | (From CHECK 1, step 1b) Read the fat ACK bar message. | Text says exactly: `LOCATION REQUIRED` (or very close). No "Please enter…", no "You should…", no "This will help you…". Direct and imperative. | Message uses hedging ("Please", "Would you", "if you'd like") · message is vague ("Info needed", "Try entering location") |

---

### CHECK 5 — MOTION (v1.14.482)
**What:** All UI transitions should feel snappy (≤300ms per Emil Kowalski principles).

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 5a | In any UI with toggles/buttons, tap them and watch state changes. (E.g., tap issue chips to change color, tap expand buttons, etc.) | All transitions feel **instant-to-very-fast** (< 200ms). No laggy 400ms+ fades. Easing feels smooth (not abrupt). Matches professional app motion feel, not web-slow. | Any transition noticeably slow (> 300ms) · easing feels jagged or bouncy · motion is inconsistent (some fast, some slow) |

---

### CHECK 6 — HAPTIC FEEDBACK (v1.14.481)
**What:** Haptic patterns should be semantic (pass = two-pulse, fail = long pulse).

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 6a | (From CHECK 1, step 1b) When fat ACK bar for LOCATION REQUIRED appears, feel the **vibration pattern**. | You feel a **medium-length single pulse** (WARN pattern for blocked state). Distinct from normal tap feedback. | No vibration · vibration is same as normal touch feedback (not distinct) · vibration is too weak to feel with gloved hands |
| 6b | In normal app flow, when an action **succeeds** (e.g., save), you should feel a **two-pulse quick rhythm**. | You feel **two short pulses** (PASS pattern). | Single pulse only · no vibration · vibration doesn't match action outcome |

---

### CHECK 7 — BADGE HONESTY (v1.14.481)
**What:** When no Master is loaded, badge should show `—` (em-dash) dimmed, not "SITE" or blank.

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 7a | **Clear your Master.** (In COMMAND, tap MASTER area, tap reload/clear if available, OR use `?legacy=1` mode to see old state.) | The site badge in the header shows a single **`—`** character, **dimmed/faded** (not bright cyan). | Badge shows "SITE" · badge is blank/empty · badge shows "MASTER" · badge is bright (not dimmed) |
| 7b | **Load your Master.** | Badge updates to show the site locode (e.g., "ALP-01") at **full opacity** (bright cyan). | Badge stays on `—` · badge updates but is still dimmed · badge shows wrong locode |

---

### CHECK 8 — LEGACY FALLBACK (v1.14.483)
**What:** Legacy shell (`?legacy=1`) should be byte-identical, unaffected by recent ships.

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 8a | Append `?legacy=1` to the URL and reload. Load your Master. | App boots to **legacy interface** (old 5-row Build banner, legacy Crash-Cart structure visible but no ISOLATE door). No errors in console. All legacy features work. | App crashes · console errors appear · legacy interface looks different than before · any new UI appears under legacy mode |

---

### CHECK 9 — NO STORAGE REGRESSION (v1.14.483)
**What:** No new localStorage keys added; storage quota unchanged.

| Step | Do this | PASS | FAIL |
|------|---------|------|------|
| 9a | Open **DevTools** (Inspector). Check **Application → Storage → Local Storage**. Compare key count to a baseline from v1.14.482 or earlier. | Key count is **unchanged** (should be same ~20 keys as before: `master`, `profile`, `shift_*`, etc.). No new keys like `_edp_check*` or `crashcart_*`. | New localStorage keys appeared · keys were deleted (missing old keys) · storage size jumped significantly |

---

## ROLLBACK LINE (if any check fails)

If **any check FAILS**, note:
1. Which check failed
2. What you observed (vs. expected)
3. Reproduce-case (exact steps)

**Rollback to v1.14.482:**
```bash
git revert HEAD  # Reverts v1.14.483
git push origin main
```

---

## PASS CRITERIA

✅ **PASS** = All 9 checks show PASS behavior  
❌ **FAIL** = Any check shows FAIL behavior (note which, proceed to rollback)  
⏳ **CONDITIONAL** = Motion/haptic feel subjective — use your floor judgment ("does this feel like a field tool, not web-slow?")

---

## AFTER VERIFY

If all checks PASS:
- [ ] Update `PHANTOM_CURRENT_STATE.md`: Mark v1.14.483 as **DEVICE-VERIFIED 2026-08-XX**
- [ ] Commit: `Device verify v1.14.483 PASS — all checks green`
- [ ] Next: Begin Phase Next-1 kickoff (Master asset pipeline integration)

If any check FAILS:
- [ ] Rollback v1.14.483
- [ ] Report failing check + repro steps
- [ ] Investigate root cause with Claude Code
- [ ] Fix + test cycle

---

**Ready when you are. Report results when done.**

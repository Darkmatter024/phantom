# DEVICE VERIFY: SHIP-FIRST-RUN-474
## Greenfield Cold-Open Path

**Live version:** v1.14.474  
**Commit:** c43fe86  
**Branch:** main  
**Test device:** iPhone (iOS Safari PWA, from home screen)  
**Reference viewport:** 390 × 844px

---

## Golden Path Walkthrough (V1–V14)

Run in order. Any ✗ = no ship.

### V1: RESET THIS DEVICE (sanity gate)

- [ ] SYSTEM → Profile sheet → scroll to bottom
- [ ] Button labeled `RESET THIS DEVICE` visible, danger styling (red/gold)
- [ ] Tap → native `confirm()`: `This clears the site profile and first-run state. Deployments, racks and Master stay. Continue?`
- [ ] Tap OK → app reloads
- [ ] After reload: setup card appears (first-run state cleared)

---

### V2: FIRST VISIT (boot TAP TO ENTER)

**Precondition:** Device state is reset (V1 complete), OR fresh install

- [ ] Splash screen shows `TAP TO ENTER`
- [ ] Waits for tap (does NOT auto-fire on first visit)
- [ ] Tap → ENTERING animation → lands on setup card

---

### V3: SETUP CARD (2 FIELDS ONLY)

- [ ] Card header: `New device` or site name (if Master loaded)
- [ ] Lede text: `PHANTOM runs your rack build from Master to handoff. Two things to start.`
- [ ] Two input sections ONLY:
  1. **YOUR NAME** — e.g. J. Hamilton
  2. **SITE** — e.g. ALP-01
- [ ] ⛔ NO SITE LEAD field
- [ ] ⛔ NO FACILITY NAME input
- [ ] ⛔ NO MASTER FILE section
- [ ] ⛔ NO FLOOR DETAILS section
- [ ] Confirm button label: `START` (NOT "CONFIRM & ENTER")
- [ ] Error handling: tap START with empty name → toast "Enter your name first", focus name field

---

### V4: VALIDATION (2 FIELDS REQUIRED)

- [ ] Name empty + site filled → tap START → toast "Enter your name first"
- [ ] Name filled + site empty → tap START → toast "Enter your site first"
- [ ] Both fields empty → tap START → toast "Enter your name first"

---

### V5: SUCCESSFUL SETUP (Device Ready Toast)

- [ ] Name + site both filled → tap START
- [ ] Toast: `Device ready — ALP-01 confirmed`
- [ ] Setup card closes
- [ ] Lands on Command center

---

### V6: COMMAND RUNG B, STEP 1 OF 3 (Load Master)

- [ ] Headline: `Load your Master.` (with line break)
- [ ] Paragraph: `PHANTOM reads cabinets and host assignments from your Master file.`
- [ ] **New:** Step indicator above headline: `STEP 1 OF 3` (cyan, uppercase, Chakra Petch 11px)
- [ ] Assistant summary: `Profile set for SITE.` (NOT "No Master loaded in...")
- [ ] NBA button: `LOAD MASTER →`
- [ ] Stats: `—  RACKS`, `—  BLOCKERS`, `—  DEPLOYS`

---

### V7: LOAD MASTER → STEP 2 OF 3

- [ ] Tap `LOAD MASTER` → file picker
- [ ] Select test Master file
- [ ] Counts sheet appears (confirm counts)
- [ ] Activate Master
- [ ] Command re-renders:
  - [ ] Step counter now: `STEP 2 OF 3`
  - [ ] Headline: `Start a deployment.` (with line break)
  - [ ] Paragraph: `Master loaded. Scope cabinets into a deployment to begin.`
  - [ ] NBA button: `START DEPLOYMENT →`
  - [ ] Rack hero visible (live 3D preview, if WebGL available)
  - [ ] Stats show real counts: e.g. `15 RACKS`, `0 BLOCKERS`, `0 DEPLOYS`

---

### V8: START DEPLOYMENT → STEP 3 OF 3

- [ ] Tap `START DEPLOYMENT` → mscope flow
- [ ] Create one deployment (name + cabinets)
- [ ] Save + back to Command
- [ ] Command re-renders:
  - [ ] Step counter now: `STEP 3 OF 3`
  - [ ] Headline: `Capture your first rack.` (with line break)
  - [ ] Paragraph: `Deployment ready. Start your rack trace with a scan.`
  - [ ] NBA button: `GO TO SCAN →`
  - [ ] Stats: deployment count = 1

---

### V9: CAPTURE FIRST RACK → RUNG C (No Step Counter)

- [ ] Tap `GO TO SCAN` → Scan surface
- [ ] Scan one rack (code or manual entry)
- [ ] Back to Command
- [ ] **IMPORTANT:** Step counter GONE (only appears in rung B, steps 1–3)
- [ ] Rung C dashboard visible:
  - [ ] Headline: `SITE Ready State`
  - [ ] Stats: `01 RACKS`, blocker/deploy counts
  - [ ] Assistant summary: real state (e.g., "All clear in SITE...")

---

### V10: RETURN VISIT (BOOT AUTO-FIRE ≤400ms)

- [ ] Kill app (force close)
- [ ] Relaunch from home screen
- [ ] Splash appears ≤400ms
- [ ] **NO TAP REQUIRED** — auto-fires after 400ms
- [ ] Lands directly on Command (rung C)
- [ ] Setup card does NOT appear

---

### V11: AIRPLANE MODE (RETURN VISIT, OFFLINE)

- [ ] Enable airplane mode
- [ ] Kill app + relaunch
- [ ] Same as V10: splash, auto-fire ≤400ms, Command rung C
- [ ] Online chip: RED (offline)
- [ ] All Command features work offline (no blocking calls)

---

### V12: SITE LEAD IN SYSTEM PROFILE

- [ ] Airplane mode OFF
- [ ] SYSTEM → Profile sheet
- [ ] Scroll to "FROM MASTER · SITE-VARS" section OR "PLATFORMS ON SITE" section
- [ ] Look for SITE LEAD field in the editable profile section
- [ ] **Expected:** Site Lead field IS present
- [ ] Field is empty (from fresh reset)
- [ ] Notice line should appear when empty: `No Site Lead set. Lead-tier actions are locked until one is named.`
- [ ] Type a name in the Site Lead field
- [ ] Scroll down, tap `SAVE PROFILE`
- [ ] Return to Command, re-open SYSTEM → Profile
- [ ] Site Lead field shows the saved name
- [ ] Notice is gone

---

### V13: LEGACY MODE UNCHANGED

- [ ] Navigate to `?legacy=1` URL
- [ ] Legacy 5-tab interface boots (unchanged)
- [ ] Setup gate renders (legacy unchanged, byte-identical from prior version)
- [ ] Tap through legacy first-run flow
- [ ] Confirm: same behavior as v1.14.473

---

### V14: CALIBRATION MODE ALWAYS WAITS

- [ ] Kill app
- [ ] Navigate to `?cal=1`
- [ ] Splash appears with `TAP TO ENTER`
- [ ] **DOES NOT auto-fire** (even though phantom_seen_boot === '1')
- [ ] Tap → enters normal flow
- [ ] (This allows John to tap-and-hold for calibration setup if needed)

---

## Implementation Summary

**Edits (16 surgical `str_replace` changes):**

1. ✅ Boot return-skip: Check `phantom_seen_boot` at IIFE init, auto-fire after 400ms (or 120ms if prefers-reduced-motion)
2. ✅ Set `phantom_seen_boot = '1'` in firstRun_confirm() on successful save
3. ✅ Remove SITE LEAD section from rd setup card
4. ✅ Remove MASTER FILE section from rd setup card
5. ✅ Remove FLOOR DETAILS section from rd setup card
6. ✅ Update lede text: "PHANTOM runs your rack build from Master to handoff. Two things to start."
7. ✅ Update placeholder: "Site code (e.g. ALP-01)"
8. ✅ Change button label: "CONFIRM & ENTER" → "START"
9. ✅ cmd_nba() restructure with B1/B2/B3 step logic
10. ✅ cmd_nba() B1: "Load your Master." + step 1/3
11. ✅ cmd_nba() B2: "Start a deployment." + step 2/3 + mscope_open() guard
12. ✅ cmd_nba() B3: "Capture your first rack." + step 3/3
13. ✅ cmd_render(): Display step counter in #cc-nbastep
14. ✅ cmd_render(): Update assistant summary (remove !masterLoaded nag from rung B)
15. ✅ Add #cc-nbastep HTML element + CSS styling (Chakra Petch 11px, cyan, .26em tracking)
16. ✅ Add Reset Device button + siteProfile_resetDevice() function
17. ✅ Three-stamp lockstep: v1.14.474 (dct-ios.html, sw.js, version.json)

**Hard exclusions (verified):**
- ✅ Legacy (`?legacy=1`) byte-identical
- ✅ No new localStorage keys (only `phantom_seen_boot`, already spec'd)
- ✅ No new Master write paths (master_loadFromPicker only)
- ✅ No onboarding carousel/tooltips
- ✅ Step counter capped at 3 (B1/B2/B3 only)
- ✅ Boot canvas/ring/dive/bootFail untouched

---

## What Happens Next

**If all V1–V14 PASS:**
- SHIP-FIRST-RUN-474 is live
- Phase 2 device verification gate can proceed (Ships 2A–2F still awaiting owner verify)

**If any V check FAILS:**
- Report which V failed and what you observed
- I will fix the issue and push a new commit
- Device verify runs again from V1

---

## Reference

- Spec: `C:\Users\Darkm\Downloads\SHIP-FIRST-RUN-474.md` (frozen)
- Commit: c43fe86
- Live: darkmatter024.github.io/phantom/dct-ios.html (v1.14.474)

---

**Ready for your device verification. Report PASS or specific V failures.**

# BATCH VERIFY: PHASE 2 (Ships 2A–2F)
## Consolidated Mobile Build Workspace Device Verification

**Live version:** v1.14.473  
**Commits:** 2e01c8c (Ship 2A) + pre-existing Ships 2B–2F  
**Test device:** iPhone (iOS Safari PWA, from home screen)  
**Reference viewport:** 390 × 844px  
**Estimated time:** 30–40 minutes

---

## Precondition Setup

**Before starting V1, prepare the device:**

- [ ] Navigate to: `darkmatter024.github.io/phantom/dct-ios.html` on real iPhone
- [ ] Complete device setup (Operator name, Site code)
- [ ] Load a Master file with test data:
  - Minimum: 1 deployment, 1 rack (L03-R17 preferred)
  - Rack should have: platform (H200 or GB300), phase info, some hosts
  - Phase should have: 3–5 checklist items, some marked complete
- [ ] Select active deployment
- [ ] Select active rack (to enter Build workspace)
- [ ] Confirm: Build workspace loads (header visible, no errors)

---

## SHIP 2A VERIFICATION — Header + State Strip

**Specification:** Phase 2 spec §17.1311  
**Lines:** 22389-22418 in dct-ios.html

### Visual Elements (spec §8.1)

- [ ] **Header visible at top:**
  - [ ] Left side: `BUILD` (bold, ~20–24px) + `/ FIELD MODE` (lighter)
  - [ ] Right side: Site identifier (e.g., `ALP-01` or loaded site name)
  - [ ] Header does not scroll away (sticky or in first viewport)

- [ ] **State strip visible below header:**
  - [ ] Cyan/green border on left
  - [ ] Green dot indicator
  - [ ] Text: `LOCAL ACTIVE` (bold) + separator `|` + state text
  - [ ] No flicker or layout shift

### State Logic (spec §8.2)

**Online with no pending changes:**
- [ ] Dot color: Green
- [ ] State text: `SYNCED`

**Toggle Wi-Fi OFF (airplane mode):**
- [ ] Dot color: Green (still operational)
- [ ] State text: `ON-DEVICE · OFFLINE`
- [ ] Build workspace remains fully functional
- [ ] No blocking modals or error messages

**After toggling a checklist item (if Phase 2C/2F implemented):**
- [ ] Dot color: Gold/amber
- [ ] State text: `PENDING CHANGES` (or equivalent sync queue state)

**Toggle Wi-Fi back ON:**
- [ ] State returns to `SYNCED`
- [ ] No blocking reconnect dialogs

### Data Honesty

- [ ] No hardcoded site name (uses real Master data or profile)
- [ ] State reflects real network status (not just `navigator.onLine`)
- [ ] Dot color matches state accurately

### Regression Check

- [ ] Header styling matches mockup (no distortion)
- [ ] Text readable at 390px (no size reduction below 12px)
- [ ] Touch targets safe (no accidental taps on state strip)

---

## SHIP 2B VERIFICATION — Active Rack Hero + Metrics + Quick Actions

**Specification:** Phase 2 spec §17.1328–17.1363  
**Lines:** 22491-22682 in dct-ios.html

### Active Rack Hero (spec §8.3)

**Content presence:**
- [ ] Eyebrow: `ACTIVE RACK` label
- [ ] Rack ID displayed (real value from Master, e.g., `L03-R17`)
- [ ] Platform chip shown (e.g., `H200`, `GB300`) OR cleanly omitted if missing
- [ ] No vendor inference (no `NVIDIA HGX` if only platform present)
- [ ] Phase info: `Phase X of Y` (e.g., `Phase 3 of 5`) or `Phase —` if unavailable
- [ ] Phase name below number (e.g., `Cabling`)
- [ ] Progress bar visible with real percentage (NOT fixed `68%`)
- [ ] If blocked: `Blocked —` text with reason if available

**Primary CTA:**
- [ ] Button text: `CONTINUE` (normal) or `REVIEW BLOCKER` (if blocked)
- [ ] Button visible in first viewport (390×844, no scroll needed)
- [ ] Button tappable (≥60pt height for glove test)
- [ ] Tap opens rack detail workflow
- [ ] Detail closes: returns to Build with hero intact

**Offline behavior:**
- [ ] Hero renders fully with Wi-Fi OFF
- [ ] All data visible (no blank values)
- [ ] CTA remains tappable offline

---

### Rack Metrics (spec §8.6)

**Visual layout:**
- [ ] Four columns visible on 390px width
- [ ] Responsive: 2×2 grid on narrow phones (360px) without text reduction

**Metric cards (labels + values + bars):**

1. **Components**
   - [ ] Label: `COMPONENTS`
   - [ ] Value: real count (e.g., `12 / 15`, NOT fixed)
   - [ ] Progress bar: cyan fill showing completion ratio
   - [ ] Different from other metrics (not all 68%)

2. **Connections**
   - [ ] Label: `CONNECTIONS`
   - [ ] Value: honest `—` (data source not available per spec)
   - [ ] OR: real count if data available
   - [ ] Never shows zero-filled or guessed number

3. **Verification**
   - [ ] Label: `VERIFICATION`
   - [ ] Value: real items met / total items from checklist
   - [ ] Progress bar shows audit completion
   - [ ] Different percentage from Components

4. **Blockers**
   - [ ] Label: `BLOCKERS`
   - [ ] Value: real unresolved blocker count (e.g., `2` or `0`)
   - [ ] If > 0: cell highlights red/magenta, shows `Attention` label
   - [ ] If 0: normal styling

**Data honesty audit:**
- [ ] No hardcoded counts
- [ ] All denominators from real data (no zero-filling)
- [ ] Missing denominators shown as `—` (not guessed)

---

### Contextual Quick Actions (spec §8.7)

**Visual layout:**
- [ ] Three buttons in row (standard width) or responsive to 2-column on narrow
- [ ] All buttons ≥52pt high (glove-safe)

**Action buttons:**

1. **Scan**
   - [ ] Label: `Scan`
   - [ ] Tappable, opens Scan surface
   - [ ] Works offline for locally-known codes

2. **Port Map** (or contextual tool)
   - [ ] Label: `Port map` (or equivalent)
   - [ ] Opens canonical tool surface
   - [ ] Shows honest empty state if no data

3. **Log Blocker**
   - [ ] Label: `Log blocker`
   - [ ] Opens blocker creation flow
   - [ ] Pre-fills active site, deployment, rack
   - [ ] Saves through canonical store
   - [ ] On save failure: loud error toast (never silent)

**Conditional actions (if deployment + rack selected):**
- [ ] Assign, QR, Log Note buttons visible when deployment AND rack exist
- [ ] All call canonical functions (no duplicate implementations)
- [ ] Failed actions show toast

---

## SHIP 2C VERIFICATION — Next Action + Rack Metrics Grid

**Specification:** Phase 2 spec §17.1328  
**Lines:** 22536-22620 in dct-ios.html

### Next Action Card (spec §8.4)

**Content:**
- [ ] Eyebrow: `NEXT ACTION` label
- [ ] Real action title from phase checklist (NOT hardcoded text)
- [ ] Supporting detail: phase context if specific item found
- [ ] Metadata: phase label displayed
- [ ] CTA button: opens rack detail workflow
- [ ] Icon: PHANTOM ghost orb (46×46px, visible)

**Zero states:**
- [ ] All items complete: falls back to "Continue [Phase name]"
- [ ] No phase found: honest fallback text
- [ ] Never blank or missing CTA

**Data honesty:**
- [ ] Action title changes with different racks/phases
- [ ] NOT fixed text like "Connect 8x OSFP cables"
- [ ] Reflects actual phase state

---

### Metrics Grid Responsiveness (spec §7.2)

**At 390px (reference viewport):**
- [ ] Four columns visible, readable
- [ ] No text size reduction below 12px
- [ ] No horizontal scroll

**At 360px (narrow stress test):**
- [ ] Metrics reshape to 2×2 grid (responsive)
- [ ] Text remains readable
- [ ] No horizontal scroll

**At 430px and above:**
- [ ] Four-column layout maintained
- [ ] Spacing proportional
- [ ] Safe area respected

---

## SHIP 2D VERIFICATION — Rack Preview / 3D Composition

**Specification:** Phase 2 spec §17.1346  
**Lines:** 22566-23032 in dct-ios.html (HIGH RISK)

### 3D Mount & Canvas (spec §8.5)

**Visual presence:**
- [ ] Card labeled "Rack preview" visible
- [ ] "Open aisle" button present and tappable
- [ ] Control rail with FRONT/ISO/TOP/REAR buttons below preview
- [ ] Canvas renders 3D rack (or flat fallback if WebGL unavailable)
- [ ] No blank boxes or missing content

**Size & aspect ratio:**
- [ ] Mobile (390px): 250px height, 100% width
- [ ] Desktop (1024px+): 340px+ height, 4:3 aspect ratio
- [ ] No horizontal scroll at any breakpoint

**3D Controls:**
- [ ] FRONT/ISO/TOP/REAR buttons work (cycle view)
- [ ] Each button updates canvas
- [ ] Controls visible and tappable (≥44pt)

---

### WebGL Lifecycle (HIGH RISK — Critical iOS Paths)

**Normal render (online, optimal):**
- [ ] Canvas initializes on Build load
- [ ] 3D rack visible immediately (or flat fallback)
- [ ] No flicker or blank frame

**Aisle view context collision:**
- [ ] Tap "Open aisle" → Aisle view opens in full-screen
- [ ] 3D context transfers cleanly
- [ ] Aisle view renders correctly
- [ ] Back navigation to Build: 3D rack still present (not blank)
- [ ] Back again: Aisle context released, Build continues

**Rack Detail open/close:**
- [ ] Tap rack hero CTA → Rack detail opens
- [ ] Back to Build: 3D rack intact (not blank)
- [ ] Open detail again: no context collision

**iOS Context Loss (offline recovery):**
- [ ] Enable airplane mode
- [ ] Build should still show 3D or flat fallback
- [ ] No blank mount (honest error message if WebGL unavailable)
- [ ] Disable airplane mode: 3D re-renders on next interaction
- [ ] No console errors (or diagnostic warnings only)

---

### Fallback Behavior

**If WebGL unavailable:**
- [ ] Shows flat HTML elevation (never blank)
- [ ] Toast or console warning (honest, not silent)
- [ ] Fallback elevation shows rack structure clearly

**If context REFUSED (starvation):**
- [ ] Toast: "Rack preview could not get a graphics context"
- [ ] Includes diagnostic details
- [ ] No re-arm loop (respects allocation pressure)
- [ ] User can continue work without 3D

---

## SHIP 2E VERIFICATION — Contextual Quick Actions (Detailed)

**Specification:** Phase 2 spec §17.1363  
**Lines:** 22622-22682 in dct-ios.html

### All Six Action Categories

1. **Scan** → `showWorkTab('scan')`
   - [ ] Works offline
   - [ ] Preserves active context
   - [ ] Opens Scan interface

2. **Log Blocker** → `blocker_quick(deployId)`
   - [ ] Pre-fills deployment
   - [ ] Opens blocker creation
   - [ ] Saves through hardened store
   - [ ] Blocker count updates immediately

3. **Port Map, BOM, Manifest, Rack Map** → `rd_openOpsTool()`
   - [ ] Each opens respective tool
   - [ ] Back action returns to Build
   - [ ] Active context preserved

4. **Assign** (conditional, deployment + rack)
   - [ ] Only shows when both exist
   - [ ] Calls `deploy_assignRack()`
   - [ ] Refreshes Build on complete

5. **QR** (conditional)
   - [ ] Only shows when rack selected
   - [ ] Generates QR code
   - [ ] No refresh needed

6. **Log Note** (conditional)
   - [ ] Only shows when rack selected
   - [ ] Opens note creation
   - [ ] Saves to rack state

### Error Handling

- [ ] Every action failure → loud toast (never silent)
- [ ] Toast messages are user-friendly (not cryptic)
- [ ] No dead buttons (conditional rendering prevents taps on unavailable actions)

---

## SHIP 2F VERIFICATION — Accessibility & Polish

**Specification:** Phase 2 spec §17.1376  
**Lines:** 22687-22834 + CSS in dct-ios.html

### Worklist & Checklist

**Visual presence:**
- [ ] "Worklist" header visible
- [ ] Current phase name displayed
- [ ] Checklist items from real phase data (NOT hardcoded)
- [ ] Each item shows: checkbox + description + optional evidence note

**Interactions:**
- [ ] Tap checkbox: toggles item completion (re-renders)
- [ ] Evidence button: opens prompt, saves note
- [ ] "Complete Phase" button: advances phase (if all items done)
- [ ] Phase completion: toast confirms, re-renders Command

**Zero states:**
- [ ] No active phase: "Every phase on this rack is complete."
- [ ] Empty phase: "No checklist items defined for this phase."
- [ ] Both honest messages (never blank)

---

### Accessibility Features (spec §19)

**ARIA semantics:**
- [ ] Checkboxes have `aria-pressed="true|false"`
- [ ] Checkbox labels have `aria-label="Mark done: [item description]"`
- [ ] Evidence button has `aria-label`
- [ ] All buttons: `type="button"` (semantic)

**Keyboard navigation:**
- [ ] Tab cycles through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Focus visible on all controls (outline or highlight)

**Visual indicators:**
- [ ] Completed items show ✓ checkmark
- [ ] Incomplete items: empty checkbox
- [ ] "Complete Phase" button shows status (open count if partial)

---

### Responsive Design

**Mobile-first (below 1024px):**
- [ ] Phone layout: linear composition (no sidebars)
- [ ] Header → state strip → hero → metrics → actions → worklist
- [ ] All text readable (no size below 12px)
- [ ] All buttons ≥52pt (glove-safe)

**Desktop (1024px+):**
- [ ] Sidebars appear (queue, blockers, local state) via CSS Grid
- [ ] DOM order unchanged (sidebars positioned via Grid, not reordered)
- [ ] Phone layout preserved (back-compatible)

**Breakpoint verification:**
- [ ] 360px: Metrics 2×2, actions 2-column, no horizontal scroll, readable
- [ ] 390px: Optimal (reference viewport), four-column metrics, three-column actions
- [ ] 430px: Grid maintains proportion, spacing scales
- [ ] 1024px: Sidebars active, desktop layout stable
- [ ] 1500px: Extended sizing, proportional

---

### Desktop-Only Sidebars

**Rack Queue (if rendered):**
- [ ] Visible only on desktop (≥1024px)
- [ ] Shows: Complete / Active / Blocked / Pending tally
- [ ] Clickable rack list with current highlighted
- [ ] Zero state: "No racks captured yet"

**Active Blockers:**
- [ ] Shows blocked racks with notes
- [ ] Clickable to open each rack
- [ ] Zero state: "Nothing blocking this deployment"

**Local State Panel:**
- [ ] "Saved locally" explanation
- [ ] "Pending changes: None — writes are immediate"
- [ ] Last save timestamp (real or `—`)
- [ ] "Synchronization: On-device only"

---

### Data Honesty

- [ ] Checklist items: Real from phase.items (never invented)
- [ ] Item completion: Real from item.status / done
- [ ] Blocker count: Real count (not guessed)
- [ ] "Pending changes: None" is truthful
- [ ] "On-device only" is honest capability statement
- [ ] All values sourced from Master/phase state (no fabrication)

---

## OFFLINE VERIFICATION (All Ships)

**Enable airplane mode, verify:**

- [ ] Build workspace fully visible (no "loading" states)
- [ ] All metrics display (not blanked)
- [ ] Quick actions open (Scan, Log blocker, tools)
- [ ] Checklist toggle works (offline write)
- [ ] Evidence notes save (offline storage)
- [ ] Phase completion works (offline)
- [ ] 3D preview renders or shows flat fallback (no blank)
- [ ] No blocking network calls
- [ ] No error toasts about connectivity

**Re-enable Wi-Fi:**
- [ ] State reflects "SYNCED" (if sync queue implemented)
- [ ] No modal dialogs blocking interaction
- [ ] Work continues seamlessly

---

## REGRESSION CHECKS (All Ships)

**Legacy mode (`?legacy=1`):**
- [ ] Byte-identical behavior from prior version
- [ ] No redesign CSS leaks into legacy
- [ ] No new pages visible in legacy

**Desktop (≥1024px):**
- [ ] Existing desktop Build workspace unchanged
- [ ] No mobile-only classes at desktop width
- [ ] Desktop composition stable

**Other surfaces:**
- [ ] Command center unchanged
- [ ] Tools / Scan / Handoff / Master Load unchanged
- [ ] No global navigation breakage

---

## PERFORMANCE & ERRORS

- [ ] Build workspace loads within 2 seconds
- [ ] Scrolling smooth (60fps, no jank)
- [ ] Safari console clear (no `console.error` for missing functions)
- [ ] Memory usage reasonable (no leak indicators)
- [ ] WebGL (3D) initializes without blocking UI

---

## SUMMARY CHECKLIST

### Pass/Fail by Ship

| Ship | Component | Status | Notes |
|------|-----------|--------|-------|
| 2A | Header | [ ] PASS | Site + BUILD/FIELD MODE visible |
| 2A | State strip | [ ] PASS | Dot + SYNCED/OFFLINE state accurate |
| 2B | Rack hero | [ ] PASS | Real data, CTA in viewport |
| 2B | Metrics | [ ] PASS | Real counts, not 68% across all |
| 2B | Quick actions | [ ] PASS | 6 buttons working, conditional render |
| 2C | Next Action | [ ] PASS | Real title from phase, not hardcoded |
| 2C | Metrics grid | [ ] PASS | Responsive 360/390/430/1024px |
| 2D | 3D preview | [ ] PASS | Renders or honest fallback |
| 2D | Aisle/Detail nav | [ ] PASS | No blank rack on return |
| 2D | Context loss | [ ] PASS | iOS recovery working (or fallback) |
| 2E | All actions | [ ] PASS | All 6 buttons functional, errors loud |
| 2F | Worklist | [ ] PASS | Real items, toggle works |
| 2F | Accessibility | [ ] PASS | ARIA labels, keyboard nav |
| 2F | Responsive | [ ] PASS | All breakpoints legible, no scroll |
| 2F | Offline | [ ] PASS | All features work offline |
| ALL | Regression | [ ] PASS | Legacy/desktop unchanged |

---

## Sign-Off

**Tester:** [Name]  
**Device:** iPhone ___ (iOS _._)  
**Viewport tested:** 390 × 844px (primary) + 360px / 430px (stress)  
**Date:** ________

**Overall Result:**
- [ ] ✅ **ALL PASS** — Phase 2 ships ready for production
- [ ] ⚠️ **CHANGES REQUESTED** — List below
  1. Ship: ___ | Issue: ___ | Severity: ___ | Repro: ___
  2. 
  3. 

---

**Reference:** Phase 2 spec § 17 Ships 2A–2F  
**Commits:** 2e01c8c (2A) through latest  
**Live:** darkmatter024.github.io/phantom/dct-ios.html (v1.14.473)

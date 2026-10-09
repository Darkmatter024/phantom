# BATCH VERIFY: Ship 2A + 2B — Mobile Build Workspace
## Device Verification Checklist

**Live version:** v1.14.473  
**Commits:** 2e01c8c (Ship 2A: header + state strip) + pre-existing Ship 2B (hero, metrics, actions)  
**Test device:** iPhone (iOS Safari PWA)  
**Reference viewport:** 390 × 844px

---

## Pre-Test Setup

- [ ] Navigate to: `darkmatter024.github.io/phantom/dct-ios.html` on real iPhone
- [ ] Complete device setup (Operator name, Site, Facility name)
- [ ] Load a Master file (test Master with at least one active deployment + rack)
- [ ] Select active deployment + rack to enter Build workspace

---

## SHIP 2A VERIFICATION — Header + Local State Strip

### Visual Hierarchy (spec §3.1, 8.1)

- [ ] **Header visible at top of Build workspace**
  - [ ] Left side: `BUILD` (bold, ~20-24px) + `/ FIELD MODE` (lighter, ~14-17px)
  - [ ] Right side: Site identifier (e.g., `SITE` or loaded site name)
  - [ ] Header does not scroll away (sticky or in first viewport)

### Local Execution State Strip (spec §8.2)

- [ ] **State strip visible below header**
  - [ ] Green dot indicator on left
  - [ ] Text: `LOCAL ACTIVE` (bold) + separator `|` + state text
  - [ ] **Online with no changes:** Shows `SYNCED` (green dot)
  - [ ] **Offline (toggle Wi-Fi off):** Shows `ON-DEVICE · OFFLINE` (green dot, still operational)
  - [ ] **After edit to a checklist item:** Shows `PENDING CHANGES` or appropriate state (if sync queue implemented)
  - [ ] **Text color:** Green for normal, gold/amber for pending, red/magenta for failed

### Data Honesty

- [ ] No hardcoded values in header or state strip
- [ ] Site identifier comes from Master or profile
- [ ] State reflects real network + sync status (not just `navigator.onLine`)

---

## SHIP 2B VERIFICATION — Active Rack Hero + Metrics + Actions

### Active Rack Hero (spec §8.3)

**Content presence:**
- [ ] Eyebrow: `ACTIVE RACK` label
- [ ] Rack ID displayed (real value from Master, e.g., `L03-R17`)
- [ ] Platform chip shown (e.g., `H200`, `GB300`) OR cleanly omitted if not in Master
- [ ] No vendor inference (no `NVIDIA HGX` if only platform is present)
- [ ] Phase info: `Phase X of Y` (e.g., `Phase 3 of 5`) or `Phase —` if unavailable
- [ ] Phase name below number (e.g., `Cabling`, `Complete`)
- [ ] Progress bar visible with percentage (real value, NOT fixed `68%`)
- [ ] If blocked: `Blocked —` text with reason/note if available

**Primary CTA:**
- [ ] Button text: `CONTINUE` (normal) or `REVIEW BLOCKER` (if blocked)
- [ ] Button visible in initial viewport without scrolling (at 390×844)
- [ ] Button is tappable (min 60pt height for glove test)
- [ ] Tap navigates to rack detail workflow

**Offline behavior:**
- [ ] Hero renders fully with Wi-Fi OFF
- [ ] All data visible from local Master + phase state
- [ ] CTA remains tappable offline

---

### Rack Metrics (spec §8.6)

**Visual layout:**
- [ ] Four columns on standard phone width (390px+)
- [ ] Responsive: 2×2 grid on narrow phones (360px) without text size reduction

**Metric cards (labels + values):**

1. **Components**
   - [ ] Label: `COMPONENTS`
   - [ ] Value: real completed count / total (e.g., `12 / 15`)
   - [ ] Progress bar below (cyan fill)
   - [ ] If no data: shows `—` or omitted

2. **Connections**
   - [ ] Label: `CONNECTIONS`
   - [ ] Value: real connected count / expected (or omitted if not available)
   - [ ] Progress bar shows completion ratio
   - [ ] If unavailable: shows `—`

3. **Verification**
   - [ ] Label: `VERIFICATION`
   - [ ] Value: items met / total items (real from phase checklist)
   - [ ] Progress bar shows audit completion
   - [ ] Different from Components/Connections (not duplicate percentages)

4. **Blockers**
   - [ ] Label: `BLOCKERS`
   - [ ] Value: real unresolved blocker count (e.g., `2` or `0`)
   - [ ] If > 0: cell highlights in red/magenta, shows `Attention` label
   - [ ] If 0: normal styling
   - [ ] Only counts active/unresolved blockers (not historical)

**Data honesty:**
- [ ] No hardcoded counts (e.g., not fixed `68%`, `124 / 150`, `2 BLOCKERS`)
- [ ] All denominators from real data (not guessed / zero-filled)
- [ ] Missing denominators handled (no division by zero, shows `—`)

---

### Contextual Quick Actions (spec §8.7)

**Visual layout:**
- [ ] Three buttons in a row (standard width)
- [ ] Responsive: two-column layout on narrow phones
- [ ] All buttons min 52pt high (glove-safe)

**Action buttons (left to right):**

1. **Scan**
   - [ ] Label: `Scan`
   - [ ] Tappable and opens Scan surface
   - [ ] Scan mode pre-fills active deployment/rack context
   - [ ] Works offline for locally-known codes

2. **Port Map** (or equivalent contextual tool)
   - [ ] Label: `Port map` (or next contextual tool)
   - [ ] Opens canonical Port Map surface
   - [ ] Pre-filters to active rack if supported
   - [ ] Shows honest "no data" state if rack has no port map

3. **Log Blocker**
   - [ ] Label: `Log blocker`
   - [ ] Opens blocker creation flow
   - [ ] Pre-fills active site, deployment, rack, phase
   - [ ] Saves through canonical hardened store
   - [ ] On save failure: loud error (never silent)
   - [ ] Blocker count updates in Metrics immediately on success

**Additional actions (if implemented):**
- [ ] Assign, QR, Log Note buttons available when deployment + rack selected
- [ ] All buttons call canonical functions (no second implementations)
- [ ] Failed actions show toast/error, never silently fail

---

## OFFLINE-FIRST VERIFICATION (spec §10)

- [ ] Disable Wi-Fi on phone
- [ ] Build workspace remains fully functional
- [ ] Can view rack, phase, metrics, actions
- [ ] Can mark checklist items complete (offline write)
- [ ] Can open Port Map (if data cached from prior load)
- [ ] State strip shows `ON-DEVICE · OFFLINE` (not an error state)
- [ ] Re-enable Wi-Fi: app resumes sync (if sync mechanism exists)
- [ ] No blocking modals on reconnect

---

## CSS BREAKPOINT VERIFICATION (spec §7.2)

- [ ] At 390×844: optimal layout, CTA visible, text readable
- [ ] At 360×800 (narrow stress): 2×2 metrics grid, responsive actions, no horizontal scroll
- [ ] At 430×932 (large phone): four-column metrics, three-column actions, spacing proportional
- [ ] At 1024px and above (desktop): layout unchanged from existing design (verify no regression)
- [ ] No horizontal scrolling at any width
- [ ] Safe area respected (bottom padding for home indicator, nav bar clearance)

---

## ACCESSIBILITY & TOUCH TARGETS

- [ ] All text readable (no size below 12px)
- [ ] All interactive elements ≥52pt (buttons ≥60pt for primary CTA)
- [ ] No essential action depends on tiny chevron alone
- [ ] Focus states visible (outline or highlight on interactive elements)
- [ ] ARIA labels present on icon-only buttons (if any)
- [ ] Reduced motion respected (no continuous animations if `prefers-reduced-motion` set)

---

## REGRESSION CHECKS

**Legacy mode (`?legacy=1`):**
- [ ] Byte-identical behavior in legacy mode
- [ ] No new pages/content visible in legacy
- [ ] No redesign CSS leaks into legacy UI

**Desktop (1024px+):**
- [ ] Existing desktop Build workspace unchanged
- [ ] No mobile-specific classes applied at desktop width
- [ ] Desktop composition stable from prior release

**Other surfaces:**
- [ ] Command center unchanged
- [ ] Tools / Scan / Handoff / Master Load unchanged
- [ ] No global navigation breakage

---

## PERFORMANCE & ERRORS

- [ ] Build workspace loads within 2 seconds
- [ ] Scrolling smooth (60fps, no jank)
- [ ] Safari console clear (no `console.error`, `console.warn` for unavailable functions)
- [ ] Memory usage reasonable (no leak detection in DevTools)
- [ ] WebGL (if 3D preview present) initializes without blocking

---

## DATA VERIFICATION

With a known test Master containing:
- Deployment: `ALP-01`
- Rack: `L03-R17` with platform `H200`
- Phase: `Phase 3 of 5 - Cabling`
- Hosts: 12 total, 10 installed
- Checklist: 25 items, 17 met

Verify:
- [ ] Header shows correct site
- [ ] Rack ID: `L03-R17` (exact, not inferred)
- [ ] Platform: `H200` (real, not `NVIDIA HGX`)
- [ ] Phase: `Phase 3 of 5` + `Cabling` (not hardcoded)
- [ ] Progress: calculates real completion % from items
- [ ] Components: `10 / 12` (not `12 / 12` or guessed)
- [ ] Blockers: real count from Master (not fixed `2`)

---

## SIGN-OFF

**Developer:** [Name] — Code review + syntax gates PASS  
**Owner (John):** [Confirm visual, functional, offline, touch] — PASS / REQUEST CHANGES

**Status:**
- [ ] PASS — Ship 2A + 2B ready for production
- [ ] REQUEST CHANGES — List issues below
  1. 
  2. 
  3. 

**Next step:** Proceed to Ship 2C + 2D (Next Action placement + 3D preview)

---

**Reference:** PHANTOM Phase 2 spec § 17 Ships 2A–2B  
**Test date:** ________  
**Device:** iPhone _______ (iOS version: ________)  

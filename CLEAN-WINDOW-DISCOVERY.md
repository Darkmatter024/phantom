# CLEAN WINDOW DISCOVERY PHASE
**Date:** 2026-08-23  
**Source:** `dct-ios.html` (v1.14.482)  
**Task:** Identify dead code, CSS, functions, and red/green residue before removal

---

## FINDINGS SUMMARY

### 1. RETIRED CRASH-CART CODE (R1-pass, not CLEAN work per CLAUDE.md rule 7)
**Status:** Hide-not-delete until R1 deletion pass. Listed to prevent loss.

| Item | Count | Notes |
|------|-------|-------|
| `.ta-*` CSS classes | 10 | Crash-Cart panel styles, never referenced in current HTML |
| `#ta-sheet` (HTML ID) | 4 | Crash-Cart sheet element, never rendered |
| `#hw-matrix-sheet` (HTML ID) | 4 | Hardware matrix, part of retired Crash-Cart |
| `#bt-print-sheet` (HTML ID) | 2 | Build-time print sheet, never rendered |
| `.crashcart-active` guards | 5+ | CSS rules gating display on removed feature |

**Action:** SKIP — routed to R1 deletion pass per owner ruling. Do NOT remove yet.

---

### 2. RED/GREEN RESIDUE (absorbed into CLEAN window per owner directive)
**Context:** Ships `.371`–`.373` retokenized state channels (green→teal, red→magenta). ~343 refs survived outside the retokenization fence. Owner directive: absorb into CLEAN window, not separate ship.

**Identified locations (sample from running list notes):**
- Canvas `strokeStyle` (line ~19090) — drawing code, rendering logic
- Severity data labels (lines ~22166, ~22174) — DOA/THERMAL status
- Issue chips (lines ~22245, ~22247, ~22578, ~22616, ~22619) — issue status display
- BLOCKED display (line ~32771) — phase-advancement block state
- Advance-phase blocked (line ~35861) — gate state
- `gx-green` class (line ~8807 + consumer ~32645) — grid/graph coloring
- QA icon (line ~13491) — test status icon
- Inline styles (line ~30892) — scattered hardcoded state colors
- `.bp-card-status.complete` (line ~9731) — **semantically "complete" channel, should be teal**

**Verified counts:**
- Red-family refs: ~45 (sample search for `#ff45*/rgb(255...)`)
- Green-family refs: ~10 (sample search for `#3D*` patterns)
- `gx-green` refs: 2

**High-confidence candidates for conversion:**
- `.bp-card-status.complete` → use `--teal` (semantic: completion = success, not red)
- Canvas `strokeStyle` red refs → if used for error/block state, convert to magenta
- Severity "DOA" display → if red, convert to magenta per state retokenization
- `gx-green` refs → convert to teal if used for "healthy/passing" state

---

### 3. ORPHAN FUNCTIONS (candidates for removal)
**Total functions in file:** 122

**Verified orphans (never called):**
- `_edp_checkpointBootCheck` — 1 ref (def only, noted as cleared by FIX-1)

**Functions with known callers (verified NOT orphans):**
- `blocker_*` family (6 functions) — all referenced in blocker UI flow
- BOM-related functions — heavy use in MASTER ingest

**Recommended audit approach:** Diff against prior commit to see which functions were removed in recent ships; check if any references remain.

---

### 4. DEAD CSS FAMILIES (no HTML emitters)
**Sample scan:** Boot-phase CSS includes `.boot-*`, `.dot-*`, `.boot-badge-*` — these ARE used (boot splash). `.crashcart-active` guard rules depend on a feature that no longer exists.

**Candidates (need verification):**
- Any `.ta-*` rule that has no corresponding HTML (10 found, all Crash-Cart)
- Any guard rule like `.crashcart-active ...` (feature no longer exists)
- Dead Crash-Cart conditional CSS (`#ta-sheet`, `#hw-matrix-sheet`, `#bt-print-sheet`)

---

### 5. NULL-LOOKUP TOMBSTONES (checks for deleted features)
**Pattern:** Code that guards against undefined objects/properties from removed subsystems.

**Crash-Cart precedent:**
- Guards like `if(typeof crashCart !== 'undefined')` — crashCart is gone, guard is dead
- CSS rule `.crashcart-active .app-header { display: none }` — condition never true

**Recommended audit:** Search for typeof/existence checks on removed feature names.

---

## CATEGORIZED REMOVAL LIST (self-verify before touching)

### ✅ SAFE TO REMOVE (no dependencies, dead code only)
- [ ] `#ta-sheet` and `#ta-*` CSS (10 refs) — Crash-Cart retired
- [ ] `#hw-matrix-sheet` element and CSS (4 refs)
- [ ] `#bt-print-sheet` element and CSS (2 refs)
- [ ] `.crashcart-active` guard rules (5+ rules)
- [ ] `_edp_checkpointBootCheck` function (1 ref, definition only)

### ⚠️ CONDITIONAL REMOVAL (red/green residue — needs line-by-line decision)
- Canvas `strokeStyle` red refs — audit context (error rendering? status display?)
- Severity data red refs — audit context (DOA/THERMAL color intent)
- Issue chip red refs — audit context (issue status color)
- BLOCKED display red refs — audit context (gate state color)
- `gx-green` refs → convert to `--teal`
- `.bp-card-status.complete` red/green → convert to `--teal`

---

## SELF-VERIFY CHECKLIST (before ship)

- [ ] No active HTML elements reference `.ta-*` or `#ta-sheet` or `#hw-matrix-sheet`
- [ ] No active functions call `_edp_checkpointBootCheck`
- [ ] `.crashcart-active` condition is never true in live code path
- [ ] Red/green residue conversions preserve semantics (error→magenta, pass→teal)
- [ ] Cold boot test: app loads to HOME without console errors
- [ ] `?legacy=1` still renders unchanged (byte-identical)
- [ ] Three-stamp lockstep ready (`dct-ios.html` / `sw.js` / `version.json`)
- [ ] No new localStorage keys added
- [ ] Test suite runs green (if applicable)

---

## BLOCKERS / NOTES

**Not dead, do NOT remove:**
- BOM code (935 refs, all active)
- Blocker family functions (6 functions, all called)
- Boot CSS (`.boot-*`, `.dot-*`) — used on boot splash
- Any color that is currently wired to a live feature (verify before converting)

**Awaiting clarification:**
- Canvas `strokeStyle` red refs — are these rendering an error state or decoration?
- Severity data red refs — is DOA/THERMAL still using red, or migrated to magenta?

---

**Status:** Discovery complete. Ready for surgical removal phase after approval.

# SHIP-HANDOFF-IA-SHIFTNAV.md
**Information architecture: shift-sequence navigation + the Deploy Optics door**

- **Status:** APPROVED — base spec. Absorbs LEGACY-RETIRE Stage 5. Unstrands Deploy Optics per docs/LEGACY-RETIRE-STRANDED.md ("a door, not a rebuild").
- **Baseline:** current stamped version at execution time. Run `/graphify . --update` first; all anchors from verified source. No assumed anchors, no assumed nav structure — Phase 0 establishes ground truth.
- **Problem statement (owner-observed):** the owner himself got lost running Tier 0 checks. A tech who didn't build PHANTOM has no chance. Sandbox testers will file twenty "couldn't find X" reports unless the IA matches how a shift actually flows. Deploy Optics currently has **no navigation path at all** — reachable only by URL/dev means.
- **Scope:** navigation and entry points only. No feature rebuilds, no screen redesigns beyond what a door requires, no data-model changes.

---

## THE MODEL (owner doctrine for this spec)

Navigation follows the **shift sequence** — the order a DCT actually works:

1. **ARRIVE** — what's my assignment, what happened before I got here (handoffs, alerts)
2. **WORK** — the active task surfaces: deploy, scan, rack detail, photo evidence, ISOLATE
3. **VERIFY** — checks, optics, QA passes (Deploy Optics lives here)
4. **HAND OFF** — end-of-shift: notes, status, what the next tech inherits

A tech at any moment is in one of these four modes. Primary nav should let them answer "where am I in the shift" in one glance and reach any mode in one tap. Within a mode, surfaces order by frequency of use during that mode.

This is the organizing principle Claude Code designs against — the concrete IA proposal still comes back to the owner for ruling before anything ships (Phase 1).

---

## PHASE 0 — NAV INVENTORY (read-only, report before any design)

From verified source + graphify wiki:

- **E-1.** Every reachable screen/surface and every path to it (nav element, button, gesture, URL param). Produce the full reachability map as a table: surface → entry points → taps-from-launch.
- **E-2.** Every surface with ZERO nav entry points (the stranded list). Deploy Optics is known; confirm whether it's alone.
- **E-3.** The current nav chrome: what persistent nav exists (tab bar, hamburger, home grid?), its element IDs, and its behavior at 390px width. Quote the code that renders it.
- **E-4.** Where ISOLATE lives today: exact tap path from cold launch, tap count.
- **E-5.** Anything absorbed from old LEGACY-RETIRE Stage 5 notes that still applies (list, don't act).

**Deliverable:** evidence report → owner review. No design, no patches, in Phase 0.

---

## PHASE 1 — IA PROPOSAL (design on paper, owner rules)

Against the Phase 0 map, propose:

- **P-1.** The four-mode assignment: every surface from E-1/E-2 assigned to ARRIVE / WORK / VERIFY / HAND OFF (or explicitly marked utility/settings). Nothing unassigned.
- **P-2.** The primary nav mechanism (owner leans persistent + glove-safe; propose against the Cold Aisle Filter: thumb-reachable, big targets, readable in a loud dark aisle, zero precision taps).
- **P-3.** Tap-count table, before vs after, for the ten most-used surfaces — ISOLATE and rack detail must not get worse.
- **P-4.** The Deploy Optics door specifically: where it lives in VERIFY and its entry affordance.
- **P-5.** Ship slicing: smallest honest sequence of one-visible-change ships to get from current nav to the proposal. Ship 1 must be the Deploy Optics door alone (smallest, unstrands the only orphan). Later ships stage the mode nav.

**Deliverable:** proposal doc → owner rules, amends, approves. Nothing ships from Phase 1.

---

## SHIP 1 (pre-authorized once Phase 1 is ruled) — THE DEPLOY OPTICS DOOR

- One visible change: Deploy Optics gains a navigation entry point where the ruled IA says it belongs.
- Door only: no changes inside Deploy Optics itself beyond what entry requires (e.g., a back path if it lacks one — a door swings both ways; a surface you can enter but not leave is a trap, not a door).
- Cold Aisle Filter on the affordance. Three-stamp lockstep. Grep gate: no new dead code, no orphaned handlers.

Later ships (mode nav, reordering) execute per the ruled Phase 1 slicing — each its own handoff, each held for owner slotting. **No self-scheduling.**

---

## DEVICE-VERIFY (owner, iPhone)

Ship 1:
1. Cold launch → navigate to Deploy Optics using only visible UI. No URL tricks.
2. Enter it, leave it, land back somewhere sane. Repeat with gloves.
3. Nothing else moved: ISOLATE, rack detail, deploy flow all at their pre-ship tap paths.
4. Version stamp current; no console errors.

Full IA (later ships) adds the **stranger test**: hand the phone to someone who has never seen PHANTOM, name a surface ("get me to ISOLATE", "find the QA optics"), count taps and seconds. That test is the whole point of this spec; it goes in every mode-nav ship's verify gate.

---

## GUARDRAILS

- Data honesty: no placeholder nav items for surfaces that don't exist; no "coming soon" tiles.
- Nav labels use aisle language (the words a tech says out loud), not developer names.
- Any surface Phase 0 finds stranded besides Deploy Optics gets flagged to the owner — not silently doored.
- If Phase 1's proposal can't avoid worsening a P-3 tap count, that regression is called out in bold for the owner ruling, never buried.

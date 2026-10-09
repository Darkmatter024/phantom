# SHIP-HANDOFF-MASTER-TRUTH.md
**One Master, one truth. Every count and status in the app must reconcile to the loaded Master — evidence first, no patch until the divergence is mapped.**

- **Status:** APPROVED — owner-directed. Evidence-first bug hunt; NO fix ships until Phase 0 maps where every number comes from and the owner rules on the reconciliation.
- **Baseline:** current stamped release (.570). `/graphify . --update` first. All anchors from verified source. No assumed anchors.
- **Owner principle (record as standing doctrine):** the loaded Master (the .xlsx) is the single source of truth. Every device count, rack count, U position, phase status, and racked/pending tally shown anywhere in the app must derive from the Master and must agree with every other place the same fact appears. Two screens showing different numbers for the same rack is a data-integrity defect, not a display quirk. "A gauge that lies is worse than no gauge" extends to counts: a count that disagrees with itself is a lying gauge.

---

## THE OBSERVED DIVERGENCES (owner walkthrough, live .570)

**D-1 — Device count disagrees with itself inside one rack (s3:171):**
- Rack detail header: "s3:171 · 8 devices"
- Same rack's component list footer: "10 COMPONENTS · 0 RACKED · 10 PENDING"
- The yellow summary banner says "8 DEVICES" while enumerating rows U10, U45, U18, U22, U28, U20, U33, … (more than 8 visible)
- So the same rack is simultaneously 8 devices and 10 components. At most one is the Master's truth.

**D-2 — "100% done" counts gate-bypassed phases as complete (s1:001):**
- Rack detail: "100% · 5/5 · All 5 phases complete. This rack is done."
- Recent activity on the same rack: "VALIDATION: gate bypassed (s1:001)" and earlier a MECHANICAL phase shown COMPLETE with a 0/10 checklist via "GATE OVERRIDE ACTIVE."
- So "100% complete" is counting bypassed/overridden gates as done. A phase whose checklist is 0/10 but was gate-bypassed reads identically to a phase genuinely finished. The rack says "done" when its checklists were skipped.

---

## PHASE 0 — TRACE EVERY NUMBER TO ITS SOURCE (read-only, report before any patch)

For each fact below, quote file:line and say **what it derives from** (Master field? a separate cache? a computed tally? a hardcoded default?):

- **E-1.** The rack-detail header "N devices" count for a rack — where does N come from?
- **E-2.** The component-list footer "N COMPONENTS / N RACKED / N PENDING" — where does each come from? Same source as E-1 or different?
- **E-3.** The yellow "N DEVICES" summary banner — its source, and why it can differ from E-1/E-2.
- **E-4.** Reconcile the three: for s3:171 specifically, produce the actual list the Master holds and show which count is right (8 or 10) and where the wrong one is manufactured. Name the bug: is one counting only devices-with-known-height, or only non-blanking-panels, or deduping U-ranges, etc.?
- **E-5.** The rack "%" and "X/5 phases" completion — how is it computed? Does a gate-bypassed or gate-overridden phase increment the numerator the same as a genuinely completed phase?
- **E-6.** Where "gate bypassed" / "GATE OVERRIDE ACTIVE" is recorded on a phase, and whether that state is available at the point where "% complete" and "this rack is done" are rendered (i.e., can the display distinguish bypassed from truly-complete? or is that information thrown away before the rollup?).
- **E-7.** Fleet-level rollups that consume these same numbers (the Build overview "0/98 racks done", "leading edge", per-phase counts) — do they inherit the same divergence? If the per-rack count is wrong, is the fleet count wrong too? Report the blast radius.
- **E-8.** Enumerate every other place in the app a device/rack/phase count or completion status is shown (Command, Build overview, 3D aisle rack chips, handoff, audits, burndown). For each, note which source it reads. The goal is a map: fact → all the places it appears → the source each place uses.

- **E-9.** ⭐ **ADDED 2026-09-02 BY OWNER DIRECTION, from the `v1.14.571` device pass — evidence only, no patch.** On the `.571` first screen the **active** rack `s1:002` renders **"Platform not in Master"**. **How can a rack be ACTIVE if the Master does not contain its platform?** Determine which of the two it is, and do not assume: **(a) stale local state** — `s1:002` is a survivor of a PRIOR Master, still pointed at by `ACTIVE_DEPLOYMENT_KEY` / `ACTIVE_CTX_KEY` / the deployment racks store after a Master swap, in which case the defect is that a Master change does not reconcile the active pointers; or **(b) a real Master gap** — the current Master genuinely carries the rack but no platform/vendor for it, in which case the defect is upstream in ingest or in the Master itself. **Lead anchor (re-verify against the stamp before use):** the string is emitted at `dct-ios.html:22199`, inside `bw_render()` (`:22076`), under the condition `if (!platform && !vendor)` — so the render is already honest about absence; **the question E-9 asks is why the value is absent for a rack the app calls active, not whether the label is correct.** Quote where `platform`/`vendor` are read from, what populates them at ingest, and whether any code reconciles active-rack pointers when a Master is replaced or deleted. ⭐ **RE-CONFIRMED ON A REAL MASTER, 2026-09-03 (owner, `.572` device pass).** The first report came from a single rack; this one comes from a **loaded 98-rack Master on site `US-QRS03`**, where the Command headline correctly read *"98 racks on US-QRS03"* — so the Master is present, parsed and counted — **and `s1:002` still renders "Platform not in Master".** ⛔ **That narrows E-9 sharply: this is not an absent Master and not a failed ingest. It is a per-rack gap inside a Master the app is otherwise reading correctly**, which makes branch (b) — a real Master gap — substantially more likely than branch (a) — stale local state — and makes the reconciliation question about ROWS, not about pointers. ⚠ Still evidence-only; neither branch is ruled. ⚠ **This bears on P-6 / FIRST-DOOR B-1**, which adds a **Delete (PIN)** for the Master: if (a) is true, deleting a Master while a rack is active is the same class of defect and B-1 must say what happens to the active pointer.

**Deliverable:** a reconciliation table — every count, its source, and where sources disagree — plus a named root cause for D-1 and a clear statement for D-2 of whether "bypassed" is currently indistinguishable from "complete" at render time. → owner review. **No patch ships from Phase 0.**

---

## OWNER RULINGS NEEDED (after Phase 0, before any ship)

- **R-1 (D-1):** once Phase 0 says which count is the Master's truth and why the other exists — confirm the single source all three displays must read from. Expectation: one function computes the rack's device/component set from the Master; every display calls it. No display computes its own tally.
- **R-2 (D-2):** rule on how a gate-bypassed phase should read. Options to weigh (owner picks):
  (a) bypassed counts toward "done" but is visibly marked (e.g., "5/5 · 2 bypassed" and a distinct color), so honesty is preserved without blocking the floor;
  (b) bypassed does NOT count as complete — "% complete" reflects only genuinely-finished phases, and bypassed shows as its own state;
  (c) rack is "done" only if every phase is complete OR explicitly bypassed, but "done (with bypasses)" never renders identically to "done clean."
  Recommendation for the owner to react to, not adopt automatically: (a) or (c) — never let a 0/10-checklist bypassed phase render pixel-identical to a genuinely finished one. That's the data-honesty line.

---

## SHIP SLICING (after rulings)

One visible change per ship, smallest first:
- **Ship 1:** single-source the device/component count (R-1). All three displays on rack detail read one computed value. Grep gate: no display computes its own count. Fleet rollups (E-7) then inherit the corrected number.
- **Ship 2:** bypassed-vs-complete distinction (R-2) — render bypassed phases per the owner's ruling everywhere completion is shown (rack detail, fleet, handoff).
- Each ship: three-stamp lockstep, owner promotes, iPhone verify, door/consistency ledger.

---

## DEVICE-VERIFY (owner, iPhone)

- **Ship 1:** open s3:171 — header, banner, and footer all show the SAME device/component count, and it matches the Master. Open two more racks with known counts — all agree. Fleet "racks done" reflects the corrected math.
- **Ship 2:** a rack with a bypassed gate shows "done" **differently** from a rack finished clean — the bypass is visible at a glance, not buried in activity log. A 0/10-checklist bypassed phase never reads as an honest 100%.

---

## GUARDRAILS / STANDING DOCTRINE ADDED

- The Master is the single source of truth. Every count/status derives from it through one path; no screen invents or re-derives its own tally.
- Any two places showing the same fact must show the same number. A self-disagreeing count is a lying gauge and is treated as a data-honesty defect.
- Bypassed/overridden is a real state and must remain visible through every rollup — never collapsed into "complete" before render.
- Evidence before patches: this is a hunt first. The map comes back before any number is changed.

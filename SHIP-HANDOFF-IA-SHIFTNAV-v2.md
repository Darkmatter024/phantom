# SHIP-HANDOFF-IA-SHIFTNAV.md — v2
**The rack is the unit of work. Load Master → pick rack → work the rack. Every other door closes or moves inside the rack.**

- **Status:** APPROVED — supersedes v1 and its Addendum A in full. Where v1 said "modes," read "rack." Phase 0's nav census (reachability map, ten-tool group, `ops_init` finding) is still valid evidence and carries forward.
- **Baseline:** current stamped release (.562 at authoring). `/graphify . --update` first. All anchors from verified source.
- **Owner:** John Hamilton. Rulings are his. No self-scheduling.

---

## §0 · READ THIS FIRST — WHAT THE OWNER IS TRYING TO DO

This section is written in plain language on purpose. Claude Code must not proceed past Phase 0 without restating it back (see §6). If any later instruction in this spec seems to conflict with §0, §0 wins and you stop and ask.

PHANTOM is used by a data center technician standing in a cold aisle, wearing gloves, in front of one rack, with a phone. The owner has been saying the same thing for weeks in different words: **make it as easy as possible.** The app has grown too many doorways — separate screens, tabs, tool rows, and pictures that each hold a piece of what the tech needs about the rack they're standing at. The tech has to remember where each piece lives and go get it. That is the problem.

The fix is a single organizing rule:

> **The rack is the unit of work.** After the Master is loaded, the tech taps a rack and everything they will ever do to that rack is on that rack's screen — phases, checks, devices and their U positions, assign, QR, log note, photo evidence, flags, and every tool that applies to that rack, shown only when it applies. They do not leave the rack to find a tool. They do not re-select the rack on another screen. There is no "deck" of tools; there is the rack in front of them.

Three moves, total: **load Master → pick rack → work the rack.**

Everything in this spec serves that rule. A proposal that adds a screen, a tab, a chip row, or a second path to something already reachable from the rack is wrong even if it is well-built. "Well-built but adds a door" fails this spec.

**Doctrine line (standing, applies to every ship from here on):** a ship that opens a door must close at least one. Two paths to the same fact is a defect. Every ship report includes a door ledger (before/after table of paths).

---

## §1 · WHAT IS RACK-SCOPED (goes inside the rack) vs NOT (keeps a door)

**Rack-scoped — inside the rack screen, contextual to that rack:**
- The five phases (MECH → PWR → NET → COMP → VAL) and every check within each phase
- Devices list with U position per row (per SHIP-HANDOFF-RACK-ELEVATION-DEMOTE)
- Assign, QR, log note, photo evidence
- Flags / blockers for this rack
- Optics / audits / port map / power / burndown / BOM / manifest — **as rack-scoped views, not destinations.** They render for *this* rack because the tech is on *this* rack.
- ISOLATE — as an action on a rack whose state permits it. It is dangerous; it gets a deliberate affordance (confirm step, red, full-width), but it lives on the rack, not in a tool row.
- Blast and the rest of the ten-tool group — each is evaluated in Phase 1: rack-scoped action, aisle-scoped (see below), or **closed** if it duplicates something the rack screen already does.
- `SEE IN AISLE` door to Forge 3D, focused on this rack (per RACK-ELEVATION-DEMOTE Addendum A)

**Not rack-scoped — these keep a door, and it should be the short list:**
- **Load / switch Master** (the first move)
- **Pick rack** — the rack picker itself (list or Forge aisle survey). This is "which rack am I working."
- **Shift handoff** — what state are my racks in, hand to the next tech
- **SYS** — app/system panel, version, diagnostics
- **Exit** — as a gesture, not a dock slot

Anything not in either list above is a Phase 1 ruling for the owner, presented with a recommendation and the reason.

---

## §2 · WHAT THE PHONE DOCK BECOMES

Phase 1 proposes; owner rules. But the design constraint is set now: the dock exists to move between the *short list* in §1 and the rack. Candidates: **Racks** (picker / current rack), **Shift** (handoff), **SYS**. Scan belongs where scanning happens — on the rack (scan a device into this rack) and on the picker (scan a rack label to open it) — not as a dock destination of its own; Phase 1 shows the tap counts and the owner rules. Exit-hold does not own a slot. Command as a "status museum" first screen is retired; the first screen after Master load is the rack picker with honest state (which racks, which are mine, which are flagged).

---

## §3 · HARD REQUIREMENTS CARRIED FORWARD (from review and prior rulings)

- Scan reachable in ≤1 tap from wherever the tech is (rack or picker).
- ISOLATE reachable in ≤2 taps from the rack, never from a laundry row, always with a confirm.
- Rack detail and ISOLATE tap counts may not get worse than today (Phase 0 table is the baseline).
- Identity/nameplate off the first screen; racks and blockers above the fold.
- No CTA that pretends there is a job when there is no Master. No score for an unset state. (DATA-HONESTY-COMMAND governs; this spec must not re-introduce either.)
- Phone is the product. Desktop rail views become rack-scoped views on the phone or are explicitly ruled desktop-only by the owner.
- Cold Aisle Filter on everything: ≥44px targets, glove-readable text, no precision taps.
- Data honesty throughout: `U —` beats a guess; a stale Master says it is stale.

---

## §4 · PHASE 0 (evidence, carried forward + additions)

The v1 Phase 0 census stands. Add:
- **E-8.** For each of the ten OPS tools and each desktop rail tab: what data does it read, and is that data keyed by rack? (If yes, it can be rack-scoped. If no, it is aisle/shift-level and needs a ruling.) Table, file:line.
- **E-9.** How rack-detail is entered today from every path, and what state it needs (rack ID, Master). This is the contract for "pick rack → work the rack."
- **E-10.** `ops_init` — quote what it initialized when enabled. Owner rules whether any of it is still needed under the rack model.

**Stop after Phase 0. Report. Include §6.**

---

## §5 · PHASE 1 (proposal on paper, owner rules)

- **P-1.** Every surface, tool, and tab from Phase 0 assigned to exactly one of: *rack-scoped*, *short-list door*, or *closed*. Nothing unassigned. For each "closed," name what already covers it.
- **P-2.** The rack screen layout: phases spine, devices with U, actions, rack-scoped views, ISOLATE affordance. Wireframe in words or ASCII; no code.
- **P-3.** Dock proposal per §2 with tap-count table before/after for the ten most-used actions.
- **P-4.** Door ledger for the whole IA: every path today → every path after. Net must go down.
- **P-5.** Ship slicing: smallest honest sequence of one-visible-change ships. First ship is the one that closes the most doors for the least code — likely moving the ten-tool group's rack-keyed tools into the rack screen and closing the chip row.

**Stop after Phase 1. Owner rules. Nothing ships from Phase 1.**

---

## §6 · COMPREHENSION GATE (required in the Phase 0 report)

Before any design, Claude Code writes, in its own words, in ≤150 words:
1. What the owner is trying to achieve (not what the spec says to build — what he *wants*).
2. Why "rack as the unit of work" achieves it.
3. One example of a change that would look like progress but violate §0.
4. The one question you would ask the owner before Phase 1 if you could ask only one.

If the restatement is wrong, the owner corrects it before any further work. This gate exists because prior sessions executed specs correctly while missing the point.

---

## §7 · GUARDRAILS

- Evidence before design; design before code; one visible change per ship; surgical edits against verified anchors; three-stamp lockstep; owner promotes; iPhone verify gates every stamp; stranger test on every nav ship.
- No rebuilds. No new frameworks. No new screens unless the door ledger shows a net close.
- If Phase 0 or Phase 1 finds that §0 cannot be honored for some surface, say so plainly with the reason. Do not quietly keep a door.

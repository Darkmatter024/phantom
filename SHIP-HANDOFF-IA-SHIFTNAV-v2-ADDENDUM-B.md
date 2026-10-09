# SHIP-HANDOFF-IA-SHIFTNAV-v2 — ADDENDUM B
**Worked example: the Build screen. Nine doors today → two under the rack model.**

- **Status:** APPROVED — attaches to v2 as the concrete illustration of §0. Read alongside §0 and §1. Changes no rulings; it makes the target legible.
- **Source:** owner walkthrough of live v1.14.570, Build tab, on device. Owner hunted a single long-phase warning banner across four screens (3D aisle → phases panel → Build overview → rack detail) and could not land on it directly. That hunt is the problem this spec exists to end: if the person who built PHANTOM can't find one banner, a gloved tech at 2am cannot.

---

## BUILD TODAY — WHAT'S ON ONE SCREEN

The Build overview (fleet level, all 98 racks) currently presents, as separate destinations:

1. Rack List
2. Floor Map
3. Acceptance
4. Handoff
5. History
6. Burndown
7. Audits
8. Phase Pipeline (fleet)
9. Pause Deployment
— plus three stat cards (Racks Done / Leading Edge / Optics) and a rack search.

Nine doors. The one thing a tech actually needs next — **one rack's live state** (its phase, its checklist, its long-phase warning, its flags) — is not on this screen at all. It's another tap deeper, and which tap is not obvious. The screen answers "how's the whole fleet?" nine ways and "what do I do at this rack?" zero ways.

This is honest data (the numbers are real) arranged as a **status museum**, the same failure the first-run Command screen was flagged for. Breadth of doors is not the same as help.

---

## BUILD UNDER THE RACK MODEL — TWO MOVES

Per §0 (the rack is the unit of work), Build collapses to:

1. **Pick a rack** — one door. Rack List or Floor Map is a *how you pick*, not two separate destinations; they're one picker with two views. Search and scan live here.
2. **Work the rack** — you're on the rack, and everything about it is present: phase pipeline (this rack), checklist, the long-phase warning, devices with U positions, flags/blockers, assign, QR, log note, and this rack's Acceptance / Handoff / History / Audits as **views of the rack**, not fleet destinations.

Everything in the "nine doors" list is then re-homed, not deleted:

| Build door today | Under the rack model |
|---|---|
| Rack List | half of the one picker |
| Floor Map | other half of the one picker |
| Acceptance | a view on the rack (this rack's acceptance) |
| Handoff | a view on the rack + the one fleet handoff (shift level) |
| History | a view on the rack (this rack's history) |
| Audits | a view on the rack (this rack's audits) |
| Burndown | fleet-level — keep at fleet, not per rack; candidate for the fleet/shift door, owner rules |
| Phase Pipeline (fleet) | fleet-level summary stays at fleet; the *actionable* pipeline is on the rack |
| Pause Deployment | fleet-level control — keep (genuinely fleet-wide) |

**Doors that remain at fleet level after this:** pick-a-rack, pause-deployment, and whatever Phase 1 rules as genuinely fleet/shift-wide (likely Burndown and a fleet phase summary). Everything else becomes a lens on the rack the tech already chose.

---

## WHAT THIS CHANGES FOR PHASE 1

- P-3's tap-count table must include the banner-hunt path: today, reaching one rack's long-phase warning from Build took the owner four screens. After: pick rack → it's on the rack. Put both numbers in the table.
- P-1 of the proposal (assign every surface to rack-scoped / short-list door / closed) now has a concrete anchor: run every item in the nine-door list above through that assignment and show the result as this same before/after table.
- The stranger test gets a named task drawn from this exact failure: "you're told rack S3:171 has been on POWER too long — get to that warning." Count taps and seconds. That is the acceptance bar.

---

## GUARDRAIL

Re-homing is not deleting. Acceptance, Handoff, History, Audits, Burndown all carry real function — the ship moves them to where the tech already is (the rack, or the one fleet door), it does not remove them. Any item Phase 0 finds has no rack-keyed data at all is a fleet/shift door, flagged for owner ruling, never silently dropped. Door ledger required: Build goes from nine fleet doors to a small, named few, and every closed door names the rack view or fleet door that now carries it.

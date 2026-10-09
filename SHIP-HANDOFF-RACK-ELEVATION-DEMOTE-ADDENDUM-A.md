# SHIP-HANDOFF-RACK-ELEVATION-DEMOTE — ADDENDUM A
**Ship 3 amended: no new elevation view. One door to the picture that already exists. Net doors go down, not up.**

- **Status:** APPROVED. Supersedes Ship 3 in the base spec. Ships 1 and 2 unchanged.
- **Owner principle (record this — it applies to every spec from here on):** *Make the app as easy as possible. Minimize doorways. Close duplicates.* A ship that opens a door must close at least one. Two paths to the same fact is a defect.

---

## WHY THE ORIGINAL SHIP 3 IS WRONG

The base spec proposed a new full-screen `VIEW ELEVATION` sheet. That is a **fourth** rack picture (Forge 3D aisle, phone elevation card, phone strip, new sheet). The rack drawing the owner actually wants already exists in Forge · 3D Aisle at full size with every U legible. Building another is a new doorway to a fact that already has one.

## SHIP 3 (AMENDED) — ONE DOOR TO THE 3D AISLE

One visible change: rack-detail gains a single `SEE IN AISLE` affordance that opens Forge · 3D Aisle **with this rack already focused**.

- **S-10.** Affordance sits with the existing action row (ASSIGN / QR area), Cold Aisle Filter sizing. Label is aisle language: `SEE IN AISLE`.
- **S-11.** It passes the rack ID (e.g. `s3:171`) so Forge lands focused on that rack — not on the aisle overview requiring a second tap. Phase 0 (below) establishes the handoff mechanism from verified source.
- **S-12.** Forge's rack chips / focus action gain the reverse door: a focused rack offers `OPEN IN PHANTOM` → that rack's phone rack-detail (device list). Same rack ID, same Master. One tap each way.
- **S-13.** Freshness is shown, not implied: when arriving from PHANTOM, Forge's existing `SAVED … · RESTORED FROM CACHE` line stays visible. If the cached Master is older than the phone's, Forge says so in one line. No silent staleness.
- **S-14.** The renderer removed in Ship 2 is **deleted**, not kept for a sheet that no longer exists. Grep gate: zero references.

## DOOR LEDGER FOR THIS SPEC

| Before | After |
|---|---|
| Phone elevation card (clipped) | closed |
| Phone full-height strip (unreadable) | closed |
| Proposed VIEW ELEVATION sheet | never opened |
| Forge 3D aisle | kept — the one picture |
| — | `SEE IN AISLE` (phone → Forge, focused) |
| — | `OPEN IN PHANTOM` (Forge → phone rack-detail) |

Net: three pictures → one. Two unrelated paths to a rack → one linked pair. Doors closed: 2 (+1 never built). Doors opened: 2, both between views that were previously unconnected.

## PHASE 0 ADDITION (before Ship 3)

- **E-6.** How Forge and dct-ios.html share a Master today (same localStorage keys? separate caches?). Quote it. This decides whether the door can carry the rack ID cleanly or whether the two apps hold divergent data — in which case Ship 3 stops and reports before any door is built, because a door between two disagreeing sources is worse than no door.
- **E-7.** Forge's existing focus mechanism (URL param? state? tap handler on rack chips). Quote it. The door uses what exists; it does not add a new focus system.

## DEVICE-VERIFY (owner, iPhone)

1. Rack-detail → `SEE IN AISLE` → Forge opens with that rack focused, first try, no second tap.
2. Forge → `OPEN IN PHANTOM` → phone rack-detail for the same rack, device list showing U ranges.
3. Freshness line visible on arrival in Forge.
4. Round trip twice. State survives.
5. No other rack picture exists anywhere on the phone rack-detail screen.

---

*Standing doctrine gains one line: a ship that opens a door closes at least one; two paths to the same fact is a defect.*

# SHIP-HANDOFF-RACK-ELEVATION-DEMOTE.md
**Remove the rack drawings from the default rack-detail screen; keep the U-position information where a gloved tech reads it**

- **Status:** APPROVED — owner-directed
- **Baseline:** v1.14.562 (live release). Run `/graphify . --update` first. All anchors from verified source; no assumed anchors.
- **Owner ruling:** the rack elevation as rendered on the phone does not earn its screen. Two drawings (a clipped 48U elevation showing ~7U, and an unreadable full-height strip with a clipped "U48" label) convey nothing the `U42–U43` badge doesn't. **The information (which U a device occupies) is essential and stays. The pictures go off the default path.** No shortcuts: this is done evidence-first, in slices, each verified on the phone.
- **Scope:** rack-detail surface (phone). Desktop rail untouched unless Phase 0 shows shared rendering. No data-model changes. No changes to deploy flow, OPEN AISLE, ASSIGN, QR, LOG NOTE, or the phase strip.

---

## PHASE 0 — EVIDENCE (read-only, report before any patch)

Quote file:line for each:

- **E-1.** The elevation card: container element, the renderer function(s), what data feeds it (device list → U ranges), and the .557 guard added when OPEN AISLE was wiping it. Confirm whether the same renderer draws the desktop rack view.
- **E-2.** The right-hand full-height strip: is it a separate component or a second call of the same renderer? Quote the code that positions the "U48" label — it's clipping behind the card corner in .562. Root cause, not just location.
- **E-3.** The `DEVICES (8)` collapsible: markup, expand/collapse handler, and what each device row currently shows. Does the device record already carry U start/end? Quote the field names.
- **E-4.** Every other reader of the elevation component (any code that scrolls to it, measures it, or depends on its height/presence). This determines whether removal from the default path breaks anything silently.
- **E-5.** Current default state of `DEVICES` on rack-detail load (collapsed vs expanded) and whether that state persists.

**Deliverable:** evidence report → owner review → Ship 1. Nothing ships from Phase 0.

---

## SHIP 1 — DEVICES LIST CARRIES THE U POSITION (additive; nothing removed yet)

One visible change: every row in `DEVICES` shows its U range.

- **S-1.** Each device row gains a U-position element: `U42–U43` style, monospace, same visual grammar as the existing badge on the elevation. Single-U devices show `U12`. Devices without a recorded U show `U —` (honest blank, never a guessed number).
- **S-2.** Rows sort by U descending (top of rack first) — matches how a tech reads a rack standing in front of it. If Phase 0 shows a different existing sort that techs rely on, report and stop.
- **S-3.** `DEVICES` defaults to **expanded** on rack-detail load. It is now the primary place the U information lives; it can't hide.
- **S-4.** Cold Aisle Filter: row height ≥44px, U text ≥14px, tap target is the full row.
- **S-5.** Elevation card and strip are **untouched** in this ship. Two sources of the same truth coexist for exactly one verified ship so the phone check can confirm the list agrees with the drawing before the drawing leaves.

Device-verify (owner, iPhone): open the rack in the screenshot. Every device row shows a U range. Row for the U42–U43 device matches the badge on the elevation. Expanded by default. Nothing else moved.

---

## SHIP 2 — DRAWINGS LEAVE THE DEFAULT PATH

One visible change: the elevation card and the full-height strip no longer render on rack-detail by default.

- **S-6.** Remove the elevation card and the strip from the default rack-detail layout. Per E-4, remove or neutralize every dependent (scroll targets, height measurements, the .557 guard if it now guards nothing). **No dead code left behind** — grep gate for the renderer's call sites; only the on-demand path (Ship 3) may reference it after this ship.
- **S-7.** Reclaimed space closes up; `OPEN AISLE`, `DEVICES`, `ASSIGNED TO`, and `LOG NOTE` move up. No new empty region.
- **S-8.** The clipped "U48" label defect is resolved by removal, not by patching the strip. Record that in the ship note so nobody reopens it as a bug.
- **S-9.** Desktop: if E-1 showed a shared renderer, the desktop view keeps its elevation via a desktop-only path — phone demotion does not remove it from the wide layout. If separate, desktop is untouched.

Device-verify (owner, iPhone): rack-detail loads with no drawings; devices list is the first thing under OPEN AISLE; U ranges present; OPEN AISLE → close still leaves the screen intact (the .557 scenario, re-run); no console errors; version stamp current.

---

## SHIP 3 — ELEVATION ON DEMAND (only if owner wants it back at all)

Owner decides after Ship 2 whether the drawing has any remaining job. If yes:

- **S-10.** A single affordance on rack-detail — `VIEW ELEVATION` — opens the elevation as a full-screen sheet, rendering the **whole** 48U at a legible scale (vertical scroll if needed), device blocks labeled, dismiss by tap or swipe. It is a view, not a status widget: no timers, no live nudging.
- **S-11.** The strip does not return in any form.

If the owner rules no: Ship 3 is skipped and the renderer is deleted entirely in a fourth cleanup ship with its own grep gate.

---

## GUARDRAILS

- Data honesty: no U value is ever invented. `U —` beats a wrong number.
- One visible change per ship; three ships is the minimum honest sequence. Do not combine Ship 1 and Ship 2 to save a stamp — the overlap ship is what lets the phone confirm the list before the drawing goes.
- Three-stamp lockstep each ship. Owner promotes. iPhone verify gates every stamp.
- No self-scheduling: owner slots this against DATA-HONESTY-COMMAND and IA-SHIFTNAV. Suggested: after DATA-HONESTY-COMMAND (both touch rack-detail neighbors; sequential avoids merge churn).

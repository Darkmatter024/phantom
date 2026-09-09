# SHIP-HANDOFF-RESTORE-UNDO

**Written:** 2026-09-09 · **Ruling:** `OWNER-RULINGS.md` 2026-09-09 RESTORE-UNDO · **Evidence:** `docs/RESTORE-UNDO-PHASE0-EVIDENCE.md` (read it first; every anchor is there)
**Status:** spec only. **Not authorised to build** until the owner answers Q1–Q3 in the evidence and gives a GO. Not inside `.585` or `.586`.

## Purpose
A restore becomes undoable: the device's current state is snapshotted before any write, and exactly one revert is offered afterwards. The confirm (`.585`) stays; the undo is what works when the confirm was not read.

## One visible change
After a restore and its reload, a persistent band under the header: `RESTORE APPLIED HH:MM · from <file> · UNDO | KEEP`. Nothing else on screen changes.

## Scope
1. **Snapshot before the first write** — every key in the restore's write set with its previous value, `phantom_ghost_echo_v1` before the merge, and the `GhostEchoDB` ghosts only when the file carries ghosts; one record in a new IndexedDB store, taken in one transaction, with provenance. If it cannot be taken: per Q1.
2. **The band** on boot while a slot exists. UNDO → confirm built by `phantom_restorePreview` (device → snapshot) → the snapshot written back through the existing atomic loop and rollback → slot deleted → reload. KEEP → slot deleted.
3. **One revert** — single slot; a second restore replaces it and its confirm says so.
4. **Loud failures** — evidence §7.
5. **Spec 53** — evidence §8, RED against `.585` first.

## Out of scope
Discrepancy photos (still not restored; own ship) · changing replace semantics (the ruling rejected both alternatives) · cross-device anything.

## Standing rules that bind this ship
One visible change · three-stamp lockstep · write set changes only where the spec says · evidence before patch · a claim cannot outrank a mismatch · every log line credits the actor · 44 px targets · the snapshot is the right path, not the cheap one: it is a data path.

## DoD
Spec 53 green on `phone-webkit`; `phantom-ship-gate` and `phantom-rd-reviewer` PASS; on the phone: restore today's own backup → the band appears → UNDO → the confirm names what comes back → the device reads as before the restore; then KEEP on a second run removes the band. Adjudicated through `verify.ps1`.

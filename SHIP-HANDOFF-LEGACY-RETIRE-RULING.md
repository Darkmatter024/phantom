# SHIP-HANDOFF: LEGACY-RETIRE — OWNER RULING ON STAGE LIST

**Status:** APPROVED WITH MODIFICATIONS — read fully before touching anything
**Authority:** John (owner). This ruling supersedes the proposed 23–36-ship stage list.
**Doctrine in force:** one visible change per ship · owner phone-verify between ships · no self-directed extensions · VERIFIED stamp gates version bumps · patches written against verified source only

---

## RULING SUMMARY

The recon and staging work is accepted. The full campaign as proposed is **not** approved. The scope below replaces it. Target: ~10–12 ships, not 23–36.

| Stage | Ruling |
|---|---|
| 0–2 | **APPROVED.** Proceed as staged. Stage 0 first; do not touch Stage 1 until I verify Stage 0 on device. |
| 3–4 | **APPROVED** contingent on 0–2 landing clean and stamped. |
| 5 (STRANDED) | **PULLED FROM THIS CAMPAIGN.** This is feature work, not deletion. The 3 unresolved rows (Deploy Optics tab, pg-twin, …) get their redesign doors built under **SHIP-HANDOFF-IA-SHIFTNAV**, where nav/door work already lives. Do not build doors here. Document the 3 rows in a short note (`docs/LEGACY-RETIRE-STRANDED.md`) and stop. |
| 6 (RE-HOMED decouple) | **HELD — inventory gate.** Before any ship: deliver `docs/LEGACY-RETIRE-ORGAN-INVENTORY.md` listing all 11 borrowed organs — what each is, which shell hosts it, where it re-homes, and the blast radius if the re-home is wrong. I review and approve the inventory before ship 1 of this stage. Highest-risk stage in the plan; it gets the most paperwork. |
| 7 (The switch) | **APPROVED as the finish line**, contingent on Stage 6 completing verified. Removing `redesign_isOn`, `phantom_legacy`, the `?legacy=1` param, and `--tabnav-h` (20 refs) is the actual payoff of this entire campaign. |
| 8 (Gate unwrap) | **PERMANENTLY DEFERRED.** Your own recommendation, adopted. 941 permanently-true gates cost nothing at runtime. A 941-edit sweep through a 60k-line file with no build system and no type checker is unacceptable risk for a cosmetic win. Do not schedule it. Do not revisit it unprompted. |

---

## EXECUTION RULES

1. **Sequence:** 0 → verify → 1 → verify → 2 → verify → 3 → 4 → STRANDED note → organ inventory → (my approval) → 6 ships → 7 → done.
2. **One visible change per ship.** Each ship gets a phone verify from me before the next begins. No stacking.
3. **No scope creep.** If you find adjacent cleanup mid-stage, log it in a findings note; do not act on it. Findings notes are leads, not tasking.
4. **Anchors:** run `/graphify . --update` and read the relevant god nodes before each patch, per CLAUDE.md. Patches against verified source only — never assumed anchors.
5. **Stamps:** VERIFIED stamp and version bump only after my device verify, per phantom-guard.js. No exceptions, including "safe" stages.
6. **Stop condition:** any on-device error, console SyntaxError, or crash-log entry during verify = full stop, brace-level diagnosis before anything else ships. We are not repeating .522.

---

## WHAT SUCCESS LOOKS LIKE

`?legacy=1` is gone, the legacy house (param handling, markup, CSS, legacy-only tokens) no longer exists in the file, the redesign stands on its own DOM at boot, and the 941 gates remain as inert always-true branches nobody ever has to think about again.

Confirm receipt of this ruling, restate the revised stage sequence back to me in one line, and begin Stage 0.

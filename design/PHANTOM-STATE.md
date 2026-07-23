# PHANTOM — STATE OF PLAY · WHAT'S LEFT
**Compiled 2026-07-13 · Live: v1.14.239 (batch .238+.239 UNVERIFIED)
Rulings committed f71744c · Everything below is cross-checked against the
session record, INTEGRATION-STATE.md checkpoints, and the standing roadmap.**

---

## TIER 0 — BLOCKING RIGHT NOW (all three are yours, John — nothing moves without them)

1. **DFW02 GPU chassis ruling.** Your 8U photo was AUSTIN hardware. If DFW02
   runs Dell XE9680s (6U), the "impossible" 6U pitch was real racking and the
   DFW02 collision flags are false alarms. Answer with the model string from
   the Master or the floor: Dell XE9680 = 6U / Supermicro SYS-821GE = 8U /
   other. This gates whether your device pass is even meaningful.
2. **VAST DBox generation.** Lightspeed 44-bay = 2U / Ceres ruler = 1U.
   One word; ships as a data-only append; closes the last 2.2% unknown.
3. **.238/.239 device pass on DFW02** (after #1 resolves), then send
   ".238/.239 PASS": collision flags with reasons in table + 3D · gold-hatch
   unknown-height trays still tappable · clean rack unflagged · legacy
   unchanged.

## TIER 1 — COMMITTED QUEUE (order locked at f71744c; fires on your PASS; one ship per device-verify)

- **A · Ruling 1:** provenance strips house-wide (refactor
  `deploy_forge_provenance()` into one global helper FIRST, then strips;
  amber SOURCE UNKNOWN; tap → FILE panel).
- **B · Rulings 2+3 (one ship):** single Master ingestion point (FILE panel
  only door; deploy's second loader removed; SCOPE A JOB references the
  store) + NBA priority ladder (profile → master → handoff → deploy) +
  fourth status pill "Master ✓ / No Master". **Open sub-question Code must
  ask you at build time:** Master replaced during an active deployment →
  deployment follows new Master through RECONCILE (confirm).
- **C · Reconciliation** (D2 implemented): hostname-identity re-keying with
  migration (unmatched → RECONCILE items, never dropped), ADDED/MOVED/REMOVED
  flow, nameless-device key-collision fix. **This ship finally signs off the
  verify-toggle workflow — until C lands, verify toggles remain officially
  unverified for Master re-import.**
- **D · Ruling 5:** FORGE Command card + splash. **Your prerequisite: commit
  the three asset files to the repo** (forge-card-tile-256.webp,
  forge-splash-1024.webp, forge-splash-portrait-720.webp).
- **E · Ruling 4:** assistant fleet-wide/site-aware — audit BOTH paths
  (offline PHANTOM_HW_MATRIX lookup AND Worker AI prompt) for site-gating.
  Must-pass: GB300 optics from DFW-05.

## TIER 2 — RULED OR SPECED, NOT YET SCHEDULED

- **INSPECT3D single-rack port.** The old washed-out 3D toggle was retired
  in .237; its replacement — the locked MOCKUP-INSPECT3D-FINAL (v12, GB300
  renderer, five-field strip, View dropdown, ghost band) — has never been
  ported. Own stage; do not fold into the Tier-1 queue.
- **Forge parity audit vs the v2.9.2 mock.** Confirm which locked mock
  behaviors made it through integration: undo toast on toggles, chip
  auto-center, search→picker pre-check for unloaded racks, pads at loadout
  ends, focus dolly, toggle persistence semantics vs phantom_node_status_v1.
  One Code session with the mock open side-by-side; anything missing becomes
  a punch item. (Suspicion, not verified: undo toast and splash empty-state
  are not in yet — splash arrives with Ship D.)
- **Naming-convention ruling (yours, deferred):** does the hostname encode
  cab position at each site? Gates whether HOSTNAME/LOCATION MISMATCH flags
  (like gpu-c1-001-01 in c1:002) are Master errors or normal. Site-profile
  material.
- **D4 · plate provenance:** v2.6 composite CW plate is canonical unless the
  original v1 production bake surfaces. Non-blocking.

## TIER 3 — STANDING ROADMAP (pre-existing, unchanged, do not lose)

- **Site profile + context injection** (was the declared next PHANTOM
  priority before Forge took over): per-site switch models, GPU platforms,
  standard optics, rack naming convention, PDU type — injected into every AI
  feature. Now has three new consumers waiting on it: the model→U-height
  table, row/pos parsing, and the naming-convention ruling above.
- **Shift Handoff Data Transfer:** tech-to-tech bundle via Web Share/AirDrop
  + QR fallback; the verify change-log design was built to feed it;
  `navigator.storage.persist()` companion fix rides along.
- **Legacy retirement census program:** Phase 0 requires your explicit
  sign-off before any deletion; untouched and correctly so.
- **Punch-list sweep:** have Code audit PHANTOM-PUNCH-LIST.md for still-open
  items — specifically confirm whether the MINI-strip overflow fix (lost in
  the .232 revert) is still needed anywhere the MINI strip survives.
- **Backlog (acknowledged, unscheduled):** QR deep-link scan-rack→verify ·
  search v2 (jump + highlight U in sheet) · glove-size pass on 46px action
  buttons · Forge card status-line polish once real Masters flow.

## TIER 4 — LOOSE ENDS / HYGIENE

- **Stray file sweep:** old mock versions (v1 trio-era on your phone, v2.x
  intermediates) — sweep so nothing wrong wanders into a session again.
  Canonical Forge mock remains MOCKUP-FORGE-HYBRID-AISLE-v2.9.2.html
  (fe73b6ac…).
- **Landing/marketing art:** the PHANTOM globe-aisle hero — regen needed
  (white lightning artifact), trident glyph is an unmade brand decision,
  placement ruled outside-world only (README/Pages hero); boot screen stays
  locked. Zero urgency.
- **RACK · STACK · VERIFY** tagline: canon; use it on the landing art and
  README when that work happens.

---

### The short version
**Today:** answer chassis + VAST, run the pass, send PASS.
**Then:** the machine runs A→E with you verifying between each.
**Then:** INSPECT3D port and the site profile are the next two big rocks.
Nothing is lost, nothing is stuck — three questions and one word from you
open the whole pipeline.

# INTEGRATION-STATE.md — FORGE HYBRID AISLE v2.9.2

**Standing rule (brief A2):** update at the END of every working session, and IMMEDIATELY
if context runs low mid-plan.

Last updated: 2026-07-12, after shipping `.235` `.236` `.237`.
Governing doc: `Downloads/FORGE-237-238-WORK-ORDER.md` (supersedes FORGE-CODE-SESSION-BRIEF.md).

---

## 1. SHIPPED

### v1.14.235 — Defect 2: Master bridge + honest zero-state
The bridge read **`window.master`, a global that has never existed**. Live Master is
`window._lastPhantomMaster`. `deploy_forge_rackList()` returned `[]` every open → five
blank pads. **Forge had NEVER rendered real Master data.** `.233`/`.234` both shipped a
data path that could not execute; `try/catch → []` swallowed it. Fixed + honest zero-state.

### v1.14.236 — Defect 1: retire the old rack-detail 3D view
The `.218` `FLAT|3D` toggle, unwired from rd, code kept (R1 removes it). **The brief's C1
was a trap:** `forge3d_*` is the WRAPPER hosting the new aisle — retiring it as instructed
would have deleted Forge. Real target was `reh3d_*`.

### v1.14.237 — Provenance & trust (work order Ship 1)
⭐ **BIGGEST FIND — shipped CSS bug, dead since `.233`.** The comment above the Forge token
block contained `(:root/*/html,...)`. The literal `*/` **closed the CSS comment early**; the
parser took the trailing prose as a selector, entered error recovery, and **swallowed the
next rule** — `#forge3d-sheet{--fbg --cyan --vio --teal --gold --ink --dim}`. Proven in
browser: pre-fix, `--dim`/`--teal` were **empty** and `--gold` resolved to the *global*
`#ffd60a`, not Forge's `#ffcb45`; the rule was in raw CSS but **absent from the CSSOM**.
**Every Forge design token has been undefined inside the aisle since day one.** Fixed;
all four tokens verified resolving.

Also: provenance line replaces the "LIVE MASTER" lie (and the stale "STAGE 1 · SCENE
PREVIEW" subtitle) → `DFW2 · dfw2.cwz · SAVED 07/09 09:33 · RESTORED FROM CACHE`;
`sourceFile` persisted (**additive, schemaVersion stays 1** — a v2 bump would have rejected
and destroyed every cached Master); **PURGE CACHED MASTER** with two-step confirm naming
what dies; **unplaced RU-less hosts surfaced** (Forge was the only surface in the app that
silently dropped them); **missing `.status-racked`/`.status-pending` CSS** shipped.

---

## 2. FIELD ANSWERS FROM JOHN (ground truth — supersede my earlier theories)
- **Chassis is 8U — CONFIRMED** (Supermicro SYS-821GE, photo + vendor spec). So `return 8`
  is **correct**, my "the constant is wrong" theory was **WRONG**, and the cached Master's
  6U GPU pitch (RU 1, 7, 13) is **physically impossible data**. The collision is REAL.
  John's standing ruling holds: *flag the U-collision, never render bad geometry as valid.*
- **"No Master loaded" screen = DEPLOY Command Center — correct by design.** It is
  deployment-scoped (no active deployment). Forge reads the site-persisted Master store.
  Both surfaces are right; **the split was the trust defect** — fixed by `.237` provenance.

---

## 3. ✅ SHIPPED — v1.14.238 · GEOMETRY TRUTH (commit bf57e0c, 2026-07-13) — AWAITING JOHN'S DEVICE PASS

**The spec's premise was wrong and the correction matters.** There was never a hardcoded
`return 8`. `master_nodeHeightU` was ALREADY a table (in-name `NRU` parse → GPU-family →
silent `return 1`). The real defect was that **DEFAULT**: every model the family test missed
was silently sized 1U.

**Measured on the real masters (this is the number that drove the design):**
- `MASTER-US-CENTRAL-DFW02-BRUTAL.xlsx`: **38.8% of hosts (907/2338)** fall through to the
  1U guess — `NVIDIA Quantum-2 QM9700` ×528, `NVIDIA SN2201` ×240, `Supermicro AS-2125` ×50
  (**really 2U**), `VAST DBox` ×50, `Dell R760` ×36 (**really 2U**), `Dell R660`.
  Only the `HGX H100/H200 8-GPU` rows (61%) resolve to a real height.
- `phantom-stress` master: 10.3% default. `TORTURE-TEST`: 0%.

### ⚠️ THE TRAP THAT ALMOST SANK THIS SHIP — read before touching heights again
The spec said *unknown → null → position-unknown tray*. **Doing that globally would have been
silent DATA LOSS.** `mscope_buildRacksFromSnapshot` (`:28536`) writes `elev.slots` into a
**PERSISTED deployment record** (`deployment.edpParsed.racks[].slots` AND each `deploy_racks`
record — persisted TWICE, both authoritative for phases/checklists/burndown). Dropping
unknown-height hosts from `slots[]` would have baked deployments **permanently missing 39–100%
of their devices**, unfixable by a later master reload. Worse: `refreshCounts` uses
`slots.length` as its denominator, so a rack would read **"12/12 RACKED · 100%" over eight
devices nobody ever verified** — a green complete-signal over unverified hardware.

**What shipped instead (containment):** `master_nodeHeightU()` KEEPS its numeric contract
(unknown → 1U footprint) — **proven identical to `.237` over 60 inputs, 0 differences**, so
Rack Map / Master search / mscope seeder / persisted deploys are untouched. The new
`master_nodeHeightInfo()` returns `{u, known}` and `master_rackToElevation` stamps
`hgtUnknown:true` (additive). **Forge** is the only surface that acts on it: draws those
devices gold-hatched, flagged, NOT to scale — but still **drawn and tappable**, so the tech
never loses the ability to mark real gear RACKED. They are also named in a gold callout with
model + U. That callout IS the site-profile worksheet.

### What shipped
1. `MASTER_U_TABLE` — the ONLY height authority, carrying ONLY field-confirmed heights
   (H100/H200/A100/HGX/DGX = 8U; GB200/GB300/B200 = 1U; leaf/spine/tor/mgmt-sw = 1U).
2. `phantom_rackGeometry(slots, totalU, label)` — `preflight_run`'s occ-map **extracted
   verbatim**, now shared by preflight AND Forge. **Proven behavior-identical: 400 random
   racks / 1522 findings / 0 mismatches.** Both sides of an overlap are flagged (John's ruling).
   ⚠️ **CAUGHT PRE-SHIP:** my first cut made it SKIP `hgtUnknown` slots — that would have made a
   HARD NO-GO detector **lose findings it catches today**. Every device occupies ≥1U, so the
   placeholder span is a sound LOWER BOUND: it under-detects honestly, never invents a collision.
3. `drawGuts` real occlusion fix — clean trays first, flagged trays LAST (never buried),
   colliding trays SPLIT into half-width lanes so BOTH sides are visible. Hatch + hard border.
   All constants `* S`; no new texture/material; nothing drawn on the plate.
4. `sl.conflict` is its OWN field — never a third value of `sl.status`.
5. Flags surfaced: table row markers + reasons, red "elevation is not true" banner, gold
   unknown-height callout, ⚠N on rack chips + herotag.
6. Cross-rack strays flagged `HOSTNAME/LOCATION MISMATCH`, never silently re-homed.

### OPEN FOR JOHN (blocks the next height work)
- **(a) Confirm the heights** for the models the DFW02 callout will name — `QM9700`,
  `SN2201`, `Supermicro AS-2125`, `VAST DBox`, `Dell R760`, `Dell R660`, NVLink trays, patch
  panels. They seed `MASTER_U_TABLE` next ship. **Do NOT guess them into the table.**
- **(b) Rule:** should Rack Map / Master search also stop guessing 1U? That changes persisted
  deployment seeding → needs its own ship + its own verify. Today they still show the old guess.

### 🔴 NEW DEFECT FOUND, NOT FIXED, NOT VERIFIED BY ME — needs its own pass
`MASTER-US-WEST-10A-US-SPK03-SPARKS.xlsx` (a **real** CoreWeave master, 92 sheets) does not
column-align with the parser's fixed indices: only **398 of 5370 rows** pass `_PHANTOM_MASTER_CAB_RE`,
and the values landing in the parser's `model` slot are garbage (`vtep_loopback`,
`10.57.128.1/32`, `swp4`, raw `s1:010:47` cab strings). If that holds, **the app largely cannot
ingest that master at all** — a far bigger problem than heights. Reported by an inventory agent;
**I have not confirmed it myself.** Verify before acting.

## 3-OLD. SPEC AS WRITTEN (superseded by the above — kept for the reasoning trail)
1. **Model→U-height table** replaces the hardcoded `return 8` in `master_nodeHeightU`.
   Seed: H100/H200 air-cooled = 8U; leaf/mgmt switch = 1U. **Unknown model → `null` →
   "position unknown" tray + flag. Never a guessed height.** Site-profile material.
2. **Collision detect + flag.** ⚠️ **REUSE, DO NOT REBUILD:** a U-collision detector already
   exists — `preflight_run`'s occ-map at **`:43493`–`:43518`** (emits
   `U-collision — <rack> U<n>: <a> overlaps <b>.`). It is **blind to Master-derived racks**
   because it reads `dep.edpParsed.racks` gated on `deploy_getActive()` (`:43477`/`:43481`).
   Extract it to a pure helper, have preflight call it (behavior-preserving — it's a HARD
   NO-GO safety detector), and have Forge render its output. A second authority that can
   disagree with the first violates "one door per feature".
3. **Traps for the collision visual (from adversarial review — do not skip):**
   - **A colour branch is NOT enough.** `drawGuts` fills tray rects in `hosts[]` order, so
     two devices in the same band mean **the later one paints over the earlier**. A colliding
     device is *already invisible* in the 3D face. Recolouring does not bring it back — needs
     a split-band / inset visual (the `.230` inset-badge precedent).
   - **Do NOT make `conflict` a third value of `sl.status`.** `statusOf` (`:17728`) maps
     anything ≠ `'racked'` to `'pending'`, the row toggle overwrites it, and `refreshCounts`
     computes PENDING as `total − racked`. Use a **separate `sl.conflict` field**; conflict is
     geometry, status is verify — orthogonal.
   - Every new pixel constant in `drawGuts` must be `* S` (`GS = 2.5` supersample).
   - Add **no second texture/material** — O(5) memory depends on one CanvasTexture per rack.
   - Never draw on the CoreWeave plate ("photo is photo, data is data").
4. **Cross-rack strays** (`gpu-c1-001-01` filed in `c1:002`): render where the Master places
   it (hosts are filed by `locCabRu`, `:27912`; the hostname is display-only) but flag
   `HOSTNAME/LOCATION MISMATCH`. Do **not** silently re-home — naming convention is a
   site-profile decision John has not ruled on.
5. **Reconciliation** (field-beats-import; ADDED/MOVED/REMOVED; RECONCILE list with CONFIRM
   REMOVED vs FLAG MASTER ERROR; re-key `rackId|dns` → device identity, unmatched entries
   become RECONCILE items) — **the ship AFTER `.238`.** Do not fold in.
   Still-open migration question for John: re-key vs wipe-and-re-verify.

## 3b. QUEUED — PERSISTENT MASTER PROVENANCE STRIP (John policy ruling, 2026-07-12)
**Status: QUEUED behind `.238` + John's device pass. Batch is at cap. DO NOT BUILD YET.**
Supersedes the acknowledge-gate draft — that idea is dead, do not revive it.

**The ruling (verbatim intent):** silent restore STAYS (offline-first is non-negotiable), but
it is never invisible. Every Master-fed surface in the **rd house** carries a thin provenance
strip: `SITE · <sourceFile | SOURCE UNKNOWN> · SAVED <date>` + a `RESTORED` badge when
applicable. **Tapping the strip opens the Master FILE panel** (Replace / Purge cache already
live there — reuse that door, do not build a second one). **Amber accent when `sourceFile` is
unknown.** Display-only, additive, **no new state, no boot friction.** Reuse `.237`'s
provenance data verbatim.

**⚠️ DESIGN TRAP — read before writing a line.** `.237`'s `deploy_forge_provenance()` lives
*inside the `forge3d_render()` closure* and writes `#forge3d-prov` directly. It is **not
reusable as-is**. Copy-pasting its logic into each surface creates N provenance authorities
that can disagree — a straight "one door per feature" violation. **First step of this ship is
to factor the provenance computation out into ONE global helper** (e.g.
`phantom_masterProvenance()` returning `{site, sourceFile, savedAt, restored, text, unknown}`),
have Forge's existing call site consume it, then have the strip consume the same helper.
Refactor first, then add surfaces.

**Data (all already exist, `.237`):** `m.siteCode` · `m.sourceFile` (null pre-`.237` snapshots
→ render `SOURCE UNKNOWN` + amber) · `m.savedAt || m.ingestedAt` → `master_formatTimestamp()`
(`:28652`, yields `MM/DD HH:MM`, null-safe) · `m.restoredFromStorage` (trustworthy: exactly one
writer, `_phantom_master_bootRestore`).

**Surface inventory — VERIFY, don't trust this list.** Known Master consumers to check:
Forge (already has its subtitle — likely swaps to the shared strip), Rack Map, Port Map, Site
Profile, Master search/elevation (`master_rackToElevation` callers noted at `:17760` Forge,
`:28408` mscope seeder, `:28887` Master search, `:29088` `master_renderElevationView`).
Enumerate properly as step 2.

**Hard constraints:** `body.rd`-only (the Master banner is SHARED with legacy — `.237` gates
its provenance + Purge on `redesign_isOn()`; the strip must be gated the same way or
`?legacy=1` stops being byte-identical). `sourceFile` is operator-supplied filename text →
**escape it or use `textContent`** (`.237` uses `_fesc` / `textContent` for exactly this).
Strip must not push a legacy `p:` value on tap.

## 4. D-LEDGER
- **D1** v2.9.2 device gate — PASSED. **D2** — RULED (field beats import); implementation is
  the post-`.238` ship. **D3** — RESOLVED (vendored three.js verified pre-r152, mock-compatible).
  **D4** plate provenance — OPEN, non-blocking.

## 5. ✅ BATCH-VERIFY CLEARED — `.235` `.236` `.237` DEVICE-VERIFIED (John, iPhone, 2026-07-12)
John's device pass: **provenance strip PASS · purge PASS · empty state PASS · FLAT-only PASS ·
HUD colours look right on the phone.** The dead-token bug was NOT masking further colour
problems underneath it — the aisle reads correctly now.

Batch is **clear**. `.238` starts from zero owed.

### ⚠️ CARRY-FORWARD — three checklist items not covered by that pass
The purge ran during the pass, so the device ended with **no Master loaded**. These three
items exercise the *populated* path and were therefore not exercised. **`.238` depends
directly on this path** (it renders geometry from real Master slots), so verify them FIRST in
the `.238` session, immediately after importing a real Master:
1. **Real racks + real hostnames render** in the aisle. This is the entire point of the `.235`
   bridge fix and it has never once been confirmed on a phone with a real Master.
2. **Unplaced RU-less hosts** show the gold `NOT PLACEABLE IN 3D` callout, naming them.
3. **RACKED / PENDING badges** are visibly distinct (teal vs slate) now that the tokens are alive.

Also still unverified: `?legacy=1` Master tab shows **no** purge button and **no** provenance
text (rd-gated by construction, but never eyeballed on device).

**Do NOT sign off `.234`'s verify-toggle as "working"** — it persists in the happy path but
loses field truth on the first Master re-import. That is the reconciliation ship.

## 6. NEXT SESSION STARTS HERE
0. **`.238` IS SHIPPED AND LIVE (bf57e0c). HARD STOP — it owes John's device pass.** Batch =
   1 owed. Do not stack another ship on it.
1. John's `.238` pass (checklist in `version.json`) — **import a REAL master first**; it also
   clears the three §5 carry-forward items, which have never been exercised on a populated
   master.
2. Then, in the brief's order: reconciliation (§3.3) → provenance strips house-wide (§3.1 —
   **refactor `deploy_forge_provenance` into ONE global helper FIRST**) → single Master
   ingestion point (§3.2) → FORGE Command card (§3.4).
3. Height work is **gated on John's answers to §3 OPEN (a)/(b)** — do not seed `MASTER_U_TABLE`
   from your own knowledge of the hardware. That is exactly the guess this ship exists to kill.

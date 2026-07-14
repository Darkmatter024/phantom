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

## 3. ✅ SHIPPED — v1.14.238 GEOMETRY TRUTH (bf57e0c) + v1.14.239 U-TABLE SEED (fb45e4a), 2026-07-13 — BOTH AWAITING JOHN'S DEVICE PASS (batch = 2)

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

### ✅ RESOLVED BY v1.14.239 (commit fb45e4a) — table seeded from VENDOR SPEC
John directed the web lookup ("you can run a check from the web"). A **cited vendor spec is
evidence, not a guess** — same standard as his SYS-821GE photo. Each row carries its source in
a code comment. Seeded: `QM9700/QM9790`=1U · `SN2201`=1U · `AS-2125`=**2U** (was drawn 1U —
WRONG) · `Dell R760`=**2U** (was drawn 1U — WRONG) · `Dell R660`=1U.
**DFW02: unknown 38.8% → 2.2%, resolved 61.2% → 97.8%, 0 mismatches vs spec.**

⚠️ **NOT SEEDED, STILL FLAGGED — guessing these is the exact sin `.238` exists to kill:**
- **`VAST DBox` (50 hosts on DFW02)** — VAST ships the enclosure as BOTH **1U (Ceres)** and
  **2U (Lightspeed DF-5630)**; the master string does not disambiguate. **⬅ ONE WORD FROM JOHN
  TAKES DFW02 TO 99.9%.**
- `SN5600` — only in the synthetic stress fixture, never in a real master.
- model `X` (2 hosts) — garbage data; correctly stays unknown.

⚠️ **`.239` IS NOT DISPLAY-ONLY.** `master_nodeHeightU` now returns 2 (was 1) for AS-2125 and
R760, which changes the U-span in `master_rackToElevation` → feeds Rack Map, Master search, AND
the mscope seeder that **persists** slots. Therefore: (i) NEW deployments seed those at the
correct 2U; deployments created BEFORE `.239` keep old 1U spans (never retroactively
re-derived); (ii) `preflight_run` may surface **NEW U-collisions** for AS-2125/R760 that the
undersized 1U guess was hiding. **Those collisions are REAL — surfacing them is the point.**

### OPEN FOR JOHN (still)
- **(a) Which VAST enclosure is on the floor — 1U Ceres or 2U Lightspeed?** Seeds the last row.
- **(b) Rule:** should Rack Map / Master search also stop guessing 1U for models that remain
  unknown? That changes persisted deployment seeding → needs its own ship + its own verify.
  Today they still render the old 1U guess for anything not in the table.

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

---

# 7. JOHN'S RULINGS — RECORDED 2026-07-13 (VERBATIM, main thread)

**Status: RECORDED ONLY. NO IMPLEMENTATION CODE.** The batch (`.238` + `.239`) is live but
**UNVERIFIED**. The queue below moves ONLY when John sends "`.238/.239 PASS`".

## RULING 1 — PROVENANCE STRIPS HOUSE-WIDE (already in state doc §3b)
Refactor deploy_forge_provenance() into ONE global helper first, point
Forge's call site at it, then add the strip to every Master-fed rd
surface: SITE · <sourceFile|SOURCE UNKNOWN> · SAVED <date> · RESTORED
badge; amber when source unknown; tap → Master FILE panel.
redesign_isOn()-gated; legacy byte-identical.

## RULING 2 — SINGLE MASTER INGESTION POINT
The Master FILE panel is the ONLY door a Master enters the app.
Remove the deploy flow's separate master-load path entirely.
Deployments REFERENCE the site Master store (read-only), scoped via
SCOPE A JOB. Deploy with no site Master → "NO SITE MASTER — LOAD ONE
FIRST" + deep link to the FILE panel. Never a second uploader.
Open sub-question — ask me before implementing: site Master replaced
while a deployment is active → deployment follows the new Master
through RECONCILE, not a pinned stale copy. Confirm at build time.

## RULING 3 — NBA GUIDED SETUP + MASTER PILL (ships WITH Ruling 2)
NEXT BEST ACTION becomes a priority ladder, top unmet condition wins:
  1. No profile      → "Set your site profile." [SET PROFILE →]
  2. No site Master  → "Load the site Master — nothing renders
                        without it." [LOAD MASTER →] (deep link to
                        FILE panel)
  3. Handoff draft open → current behavior
  4. Active deployment states as today
Command Lens stays status-only (subtitle may reflect state, no load
button). Status pill row gains a fourth pill: "Master ✓" / amber
"No Master", tap → FILE panel.

## RULING 4 — ASSISTANT IS FLEET-WIDE, SITE-AWARE
DCT Assistant answers for ANY platform in the knowledge base
regardless of loaded site profile. Site context ANNOTATES, never
gates: platform not at this site → full answer + one line "Note: not
currently deployed at <SITE>." Ambiguous questions resolve to this
site's platforms first. Domain guardrails (DC/hardware/ops only)
unchanged. Audit BOTH paths for site-gating — the offline
PHANTOM_HW_MATRIX lookup AND the Worker AI prompt. Must-pass example:
"GB300 optics?" from DFW-05 → full GB300 NVL72 answer + note.

## RULING 5 — FORGE COMMAND CARD
Tile: forge-card-tile-256.webp · Splash: forge-splash-1024.webp /
forge-splash-portrait-720.webp behind Forge's NO MASTER LOADED state
(CSS scrim for text legibility, not baked into image). I supply the
asset files. Card: title FORGE · 3D AISLE; live status line reusing
the Ruling-1 provenance helper (loaded: "5 RACKS · c1:001–005 · DFW2
SAVED 07/08" / empty: amber "NO MASTER LOADED"); tap → Forge scene,
loadout restored. rd-only.

## SHIP ORDER AFTER JOHN'S ".238/.239 PASS"
  A) Ruling 1 (provenance refactor + strips)
  B) Rulings 2+3 together (one architecture ship: ingestion + NBA +
     pill)
  C) Reconciliation per the confirmed spec in the state doc — this
     ship finally signs off the verify-toggle workflow
  D) Ruling 5 (Forge card)
  E) Ruling 4 (assistant prompt/logic layer)
One ship at a time, hard stop for my device verify between each.
All standing gates apply: str_replace unique anchors, node --check ×3,
CSS brace balance, CRLF, three-stamp lockstep, legacy curl-diff,
INTEGRATION-STATE.md updated at session end or low context.

---

## 7b. ⛔ STEP 1 (VAST SEED) — BLOCKED, NOT DONE
John's 2026-07-13 message intended to answer the VAST DBox height but **sent the template with
BOTH options still in it**: `VAST DBox at DFW02 = [2U — Lightspeed 44-bay / 1U — Ceres ruler]`.
One option was meant to be struck out; neither was.

**NOT SEEDED. NOT GUESSED.** Picking either value would be exactly the failure `.238` exists to
prevent, and this one is not cosmetic — `master_nodeHeightU` feeds the mscope seeder, which
**persists** slots into deployment records. A wrong VAST height would be baked into every
deployment created from DFW02.

`VAST DBox` (×50 on DFW02) therefore remains **UNKNOWN → flagged gold** in Forge. DFW02 stays at
2.2% unknown. **One word from John (Lightspeed or Ceres) closes it — data-only append, rides in
the current unverified batch, no new batch.**

---

# 8. 🔴 CRITICAL — THE 8U RULE IS WRONG FOR DFW02. "IMPOSSIBLE DATA" WAS PROBABLY GOOD DATA.
**Found 2026-07-13 replaying the REAL `MASTER-US-CENTRAL-DFW02-BRUTAL.xlsx` through the shipped
code. NO CODE CHANGED — this is John's field call. Read before the `.238`/`.239` device pass.**

## The measurement
Every GPU on DFW02 sits at a **uniform 6U pitch** (U1, U7, U13, U19, U25, U31) — **1191 adjacent
pairs, all 268 cabs, zero exceptions.** Run the shipped detector both ways:

| GPU chassis assumption | devices in U-collision on DFW02 |
|---|---|
| **8U** (Supermicro SYS-821GE — what `MASTER_U_TABLE` ships today) | **1435 / 2347 = 61.1%**, across **240 of 268 racks** |
| **6U** (Dell PowerEdge XE9680) | **2 / 2347 = 0.1%**, in **1 rack** |

## Why 6U is almost certainly right
- `NVIDIA HGX H200 8-GPU` names the **GPU baseboard, not the chassis.** It does not identify the
  vendor. John's 8U confirmation was a **Supermicro SYS-821GE** — a different box.
- **Dell PowerEdge XE9680 = 6U**, 8×HGX H100/H200 SXM5 (Dell spec: 263.20mm ≈ 6U). Real, common.
- The master's own layout is **self-consistent with 6U**: 6 nodes × 6U = U1–U36, + mgmt/leaf at
  U42–U44, inside a 48U rack. Six **8U** nodes = 48U **plus** 3U of switches = **51U — it would
  not fit the rack the master itself describes.**
- A uniform error across 268 cabs is not a typo. It is a convention.

## What this overturns
State doc §2 recorded: *"the cached Master's 6U GPU pitch (RU 1,7,13) is physically impossible
data. The collision is REAL."* **That conclusion was built on assuming Supermicro fleet-wide, and
is very likely WRONG.** The Master John PURGED on 2026-07-12 had this same 6U pitch — **it was
probably correct data.** (Recoverable: re-import.)

## The real lesson
**Chassis height is a SITE/vendor property, not a GPU-baseboard property.** A fleet-wide
`hgx → 8U` rule cannot be right for a fleet that runs both Supermicro (8U) and Dell (6U). This is
exactly the site-profile boundary of Design Law 6.

## Options for the next ship — JOHN'S CALL, do NOT pick one autonomously
- **(a)** Site profile carries the GPU chassis (DFW02 = XE9680/6U; John's Supermicro site = 8U).
- **(b)** Derive from the master: if a rack's own GPU pitch is uniformly N and N < the table
  height, that is a **SITE CHASSIS MISMATCH** — flag it ONCE per site, not 240 rack collisions.
- **(c)** Do nothing → the DFW02 device pass is 61% red and has **no clean rack to verify against**.

## The one REAL defect on DFW02 (survives even under 6U) — best single verify target
**`c1:002`** trips BOTH new features at once:
- `gpu-c1-001-01` — a **7th** GPU (every other rack has 6), **named for cab c1:001 but FILED in
  c1:002** → `HOSTNAME/LOCATION MISMATCH` flag.
- It sits at **U37–U42** and **overlaps `mgmt-c1-002` (SN2201) at U42** → `U-SPAN CONFLICT`,
  both devices flagged, split-lane in 3D.

---

# 9. ✅ RESOLVED — v1.14.240 (28fa560): DFW02 GPU = 6U. The 61% red aisle is dead.
**John's ruling, 2026-07-13:** *"The loaded Master's own uniform 6U pitch IS the height
evidence — same authority as my rail photo was for AUS."* Shipped data-only, one
`MASTER_U_TABLE` row, inside the existing unverified batch. §8's finding is now ACTIONED.

- **Row:** `{ re: /hgx.*8-gpu/, u: 6 }`, placed ABOVE the 8U row. Keyed on the **8-GPU baseboard
  form** specifically. Guard-tested: `H100-HGX` (TST99) still → 8U · `GB300-NVL72` → 1U ·
  `nvlink`/`nvl-` still excluded · in-name `NRU` still wins. The Supermicro SYS-821GE 8U row
  (AUS hardware) is intact behind it.
- **DFW02 collisions: 1435 → 2.** Resolved hosts: 97.8%.
- **Ruling 2 (recorded, NOT built):** height is per-site, scoped to the Master as loaded. A
  future import emitting the same model string with **conflicting** height evidence flags
  `SITE CHASSIS MISMATCH` **at load time**. John: *"we rule on it when it actually exists, not
  before."* **No hypothetical-site design work in this batch.**

## ⚠️ VAST DBox — STILL OPEN AFTER THREE ASKS, but NOT blocking
The answer has arrived three times as an **unstruck template**: `[Lightspeed 2U / Ceres 1U]`.
**Not seeded, not guessed** — it persists into deployment records.
**The master cannot settle it either:** DFW02 storage cabs run a uniform **4U pitch**
(`AS-2125 @U1 · VAST @U5 · AS-2125 @U9 …`), which accommodates BOTH a 1U Ceres and a 2U
Lightspeed. **Collision-neutral either way → it does NOT block the device pass.** It renders
gold hatch (×50, plus 11 blank-model rows) until John eyeballs one enclosure in the aisle.

## BATCH = 3 (`.238` `.239` `.240`) — HARD STOP, awaiting John's DFW02 device pass
Checklist lives in `version.json`. Headline: **the aisle should now be mostly CLEAN.** Expect
**no red anywhere except `c1:002`**, and gold only on VAST + blank-model rows.
**`c1:002` is THE target** — it trips both new features at once: `gpu-c1-001-01` is a **7th** GPU
(every other rack has 6), **named for c1:001 but FILED in c1:002**, at **U37–U42**, **overlapping
`mgmt-c1-002` (SN2201) at U42** → `HOSTNAME/LOCATION MISMATCH` + `U-SPAN CONFLICT`, both devices
flagged, **both visible side-by-side in split lanes** (the `.238` occlusion fix).

---

# 10. STATE-OF-PLAY AUDIT (2026-07-13, vs `Downloads/PHANTOM-STATE-OF-PLAY.md`)
That doc was compiled at `.239`. Corrections and gaps found by auditing it against the repo and
the two REAL masters on disk.

## ✅ RETRACTION — "SPARKS cannot be ingested" WAS FALSE. No defect. Do not chase it.
§8's earlier note (sourced from an inventory agent, and explicitly marked unverified) claimed the
real `MASTER-US-WEST-10A-US-SPK03-SPARKS.xlsx` misaligned with the parser. **Verified today: it
parses correctly.** `SITE-HOSTS` col D is `LOC:CAB:RU`; **4143 of 5370 rows ingest** (matches the
4143-host count already on record for this master). The agent had conflated it with the
**`SITE-NODE-DATA`** sheet — a network-data tab the app never parses as hosts, which is where the
`vtep_loopback` / IP / `swp4` "garbage models" actually live. **Nothing to fix.**

## 🔴 THE REAL FINDING — TWO REAL MASTERS, TWO INCOMPATIBLE MODEL VOCABULARIES
| | DFW02 (`MASTER-US-CENTRAL-DFW02`) | SPARKS (`US-SPK03`, 4143 hosts, 296 cabs) |
|---|---|---|
| GPU model string | `NVIDIA HGX H200 8-GPU` | `gpu-b300-01` |
| Switch | `NVIDIA Quantum-2 QM9700` | `q3400-ra`, `sn5610`, `sn4700` |
| Vocabulary | vendor marketing names | **NetBox slugs** |
| Resolves under the `.240` table | **97.8%** | **37.5% — 62.5% gold-hatches** |
| Collisions under `.240` | 2 (one real defect) | **0** |

**This is the single strongest argument yet for promoting the SITE PROFILE work (Tier 3).** A
fleet-wide model→U table cannot serve two sites that don't share a naming vocabulary. Note SPARKS
already leans on the **in-name `NRU` convention** and it works perfectly (`ps-1ru-06` → 1U ×1152,
`cdu-4ru-03` → 4U ×144) — the table's highest-confidence rule.

**Good news:** SPARKS produces **ZERO collisions** — the unknowns land on the 1U placeholder and
its pitch is spacious. So `.238`'s honesty machinery degrades gracefully: lots of gold, no false
red. **SPARKS is safe to open; it will just be heavily gold until the site profile lands.**

**Table gap spotted:** the B-series row is `/\b(gb200|gb300|b200)\b/` — it has `gb300` and `b200`
but **NOT plain `b300`**, so SPARKS' 1296× `gpu-b300-01` misses. Do NOT patch it by guessing a
height — B300 air-cooled node ≠ GB300 NVL72 tray. Needs John or a vendor spec.

## GAPS IN THE STATE-OF-PLAY DOC (not in it, still owed)
1. **It predates `.240`.** Tier-0 item 1 (DFW02 chassis) is **RESOLVED** — 6U shipped, 61% red
   killed. **Batch is now 3 (`.238` `.239` `.240`), not 2.**
2. **The purged Master was probably GOOD DATA.** It carried the same 6U pitch. **John should
   re-import it** — not listed as an action anywhere.
3. **Open question (b) from `.239` was never answered:** should Rack Map / Master search stop
   guessing 1U for unknown models? They still do. Forge is the only honest surface today.
4. **VAST DBox** — asked 3×, still an unstruck template. Collision-neutral, non-blocking.
5. **Build-badge double-`v`** (old memory note): **verified FIXED** — `textContent` overwrites the
   static `v—`, renders `v1.14.240`. Nothing to do; drop it from any punch list.

---

# 11. POLICY RULING — SINGLE RESIDENT MASTER (John, 2026-07-13) · folds into SHIP B
**Recorded only. No code — batch (.238–.241) is live and UNVERIFIED.**

The store holds exactly ONE site Master at a time. Importing a Master for a DIFFERENT site while
one is resident does NOT stack — it prompts:

    "SPARKS Master is loaded (saved <date>, <sourceFile>).
     Replace it with DFW2?   [EXPORT BACKUP]  [REPLACE]  [CANCEL]"

- **Replace** = explicit, logged, provenance updated.
- **Backup export offered in the SAME dialog** — one tap, not a separate trip.
- **Same-site re-import = the existing RECONCILE flow, unchanged.**
- This is the **storage-side twin of the single-ingestion ruling** (Ruling 2): *one door in, one
  tenant inside.* **Fold into Ship B (Rulings 2+3) — same architecture ship.**

**Side effect (John):** defuses the quota warning as a *workflow* issue — one Master at a time
fits comfortably. **IndexedDB migration stays queued post-queue as capacity insurance, urgency
DOWNGRADED.**

## ⚠️ OPEN SUB-QUESTION FOR SHIP B — ASK JOHN BEFORE IMPLEMENTING
**What happens to the field-verify overlay (`phantom_node_status_v1`) on a cross-site REPLACE?**
This is not answered by the ruling and it is load-bearing:
- The overlay is keyed **`rackId|dns`** (`_nk()`, Forge module) — **NOT namespaced by site.**
- `.237`'s PURGE deliberately does **NOT** touch field-verify status (documented, intentional).
- So on a SPARKS→DFW2 replace, SPARKS' racked/pending entries **survive in the store**. Two live
  risks: (a) **stale cross-site keys accumulate forever**; (b) if two sites ever share a
  `rackId|dns` pair (e.g. both have a `c1:001` + a same-named host), **DFW2 would silently
  inherit SPARKS' RACKED marks** — field truth invented out of nothing, the exact class of defect
  `.238` exists to kill.
- Likely right answer: **namespace the overlay by site** (`siteCode|rackId|dns`) so each site's
  field truth is preserved and isolated across replaces — and a swap back restores it. But that
  is a **migration of an existing persisted store**, so it must be designed with the
  reconciliation ship (C), not improvised inside B.
- **Do not implement REPLACE until John rules on this.** Silently dropping or silently inheriting
  field-verify status are both unacceptable.

---

# 12. RULING — OVERLAY NAMESPACED BY SITE + QUEUE REORDER (John, 2026-07-13)
**Recorded only. No code — batch (.238–.241) live, UNVERIFIED.**

1. **APPROVED:** namespace `phantom_node_status_v1` by site → **`siteCode|rackId|dns`**, with
   migration of existing entries keyed to their site of origin. Each site's field truth is
   preserved and isolated; swapping Masters **restores** that site's marks rather than losing or
   leaking them. **Silent inherit and silent drop are BOTH forbidden — per D2.**

2. **QUEUE REORDERED to kill the dependency:**
   **A** (provenance) → **C** (reconciliation, **now including the namespace migration**) →
   **B** (single ingestion + single resident + REPLACE dialog + NBA/pill, **building on the
   namespaced store**) → **honesty-parity** (Rack Map / Master search stop guessing 1U) →
   **D** (Forge card) → **E** (assistant).
   One ship per device-verify, unchanged. *(Supersedes the A→B→C→D→E order in §7.)*

3. **Cross-site REPLACE stays BLOCKED until C lands.** Interim = today's manual path
   (backup → purge → import), which is what John is doing now.

## ⚠️ IMPLEMENTATION NOTE FOR SHIP C — "site of origin" IS NOT RECORDED
The migration cannot read a site off existing entries: today's keys are **`rackId|dns`** with
**no site component and no site stored anywhere alongside them**. So "keyed to their site of
origin" has to be *inferred*, and inference is a guess — the thing this whole arc exists to stop.
Options, in the app's own idiom:
- **(a) Attribute to the resident Master's `siteCode` at migration time.** Near-certainly correct
  in practice (the store has only ever held one Master at a time, which is exactly what §11 now
  makes law). Cheap, and the failure mode is bounded.
- **(b) Migrate them to an `UNATTRIBUTED|rackId|dns` namespace** that the first matching site
  ADOPTS on load — and, per D2, **flags the adoption** rather than performing it silently.
Recommend **(a) + a logged, surfaced note** ("N field-verify marks attributed to <SITE> on
upgrade"). **Do not migrate silently either way** — a tech must be able to see that it happened.
Ruling needed from John at C build time; do not improvise.

**§12 SUB-QUESTION — RULED (John, 2026-07-13): OPTION (a).**
Migrate existing `rackId|dns` entries by attributing them to the **resident Master's `siteCode`**
at migration time, **plus a logged, SURFACED note** ("N field-verify marks attributed to <SITE> on
upgrade"). **Never a silent migration** — the tech must be able to see their field truth was
re-keyed. Option (b) (`UNATTRIBUTED|` namespace + adopt-on-load) is DEAD; do not revive.
This is now settled input for Ship C. No further ruling needed on the overlay migration.

---

# §13 — SHIP v1.14.242 · SPARKS NETWORK/DIST HEIGHTS (data-only, 2026-07-13)

Per `HANDOFF-U-TABLE-SPARKS-NET-242.md` (web-Claude). John's cover note made handing the file
the sign-off, **conditional on the §4 replay assertions passing**. They all pass — shipped.

**Seven rows, TWO evidence classes.** They are not equally strong and the comments say so:

| class | rows | why |
|---|---|---|
| **VENDOR SPEC** (datasheet is load-bearing) | `sn3420`=1U · `sn4700`=1U · `sn5610`=**2U** · `cm8148`=1U · `ngfw-4245`=1U | The master's pitch is *consistent* with these but does **not prove** them — it leaves clear U above each, so a taller box would also fit. Sources: NVIDIA "Spectrum-4 SN5000 **2U** Switch Systems" HW manual · NVIDIA SN4000 + Dell PowerSwitch SN4700 spec sheets · NVIDIA/Lenovo SN3420 guide · Opengear CM8100 datasheet · Cisco Secure Firewall 4200 (SKU `FPR4245-NGFW-K9` matches the slug). |
| **MASTER GEOMETRY** (same class as the HGX 6U ruling) | `net-6x100g-02`=1U · `12-mpo-48-lc-port-patch-panel`=1U | No public SKU exists / port-count *is* the class. **Adjacency makes any taller height impossible:** `s3:175` puts `s3-pkey03`@U28 and `s3-pkey01`@U29 **adjacent** (a 2U box overruns into a device the master itself placed); it stacks `pp-ru06/07/08/09` at **four consecutive U** (a 2U panel self-collides). |

## ⚠️ THE HANDOFF'S PHOTO EVIDENCE WAS WRONG — CORRECTED AGAINST THE MASTER
§4 of the handoff explicitly ordered this ("do not trust the photo, trust the master"). Two defects:

1. **`dh1:005` DOES NOT EXIST.** SPARKS row prefixes are **`s1` / `s2` / `s3` only**. The
   photographed rack is **`s3:175`** (twin `s3:176`) — **21 devices, not 25**. The U positions
   web-Claude read *were* right (`s3-fbs-01..04` at U11/14/17/20), so it is the **right rack under
   the wrong name**. **John's §8 verify target is corrected to `s3:175`.**
2. **The `net-6x100g-02` "U25–U31 zero-gap run" is FALSE.** Real positions are U28 / U29 / U31 —
   gaps of 1U and 2U, not a 7U run. The **conclusion (1U) survives** via the U28/U29 adjacency, so
   the row ships with the **true** proof. No row shipped on evidence that failed the replay.

**LESSON (generalises):** a photo can identify the right *hardware* and still be wrong about the
*label and the layout*. The master is the only citable geometry. This is the second time a
confident upstream claim ("physically impossible data", now "dh1:005") has dissolved on replay.

## REPLAY (both real masters, through the shipped `phantom_rackGeometry`)
- **SPARKS:** resolution **68.8% → 79.3%** (2850 → 3287 of 4143). Collisions **0/4143**, overflow 0,
  bad racks 0. Each of the seven seeded **alone** onto the .241 table adds **zero** collisions.
- **`s3:175`:** **20 unknown → 1** (only `net-ufm-05` stays gold).
- **DFW02:** **per-host height drift = 0** across all 2347 placed hosts; resolution 2286/2347 and
  the 2 collisions are **identical to .241** (they are the pre-existing genuine `c1:002` defect).
  **The in-flight DFW2 device pass REMAINS VALID** — only the build badge changes.
- **23 guards PASS:** `sn5600` still UNKNOWN (the `\b` guard keeps it off `sn5610`=2U) ·
  `net-6x100g-03`, `net-ufm-05`, `cm8132`, `ngfw-4225` still UNKNOWN (rows are model/rev-exact —
  no family-wide guessing) · in-name NRU still wins · every prior ruling unmoved.

## STILL GOLD ON SPARKS (20.7% — never guessed)
`q3400-ra` (448) · `cpu-gp2-*` (165) · `gpu-b40-02` (160) · `inf-med-01` (60) · `om2216-c14` (16) ·
`fs-media-converter-chassis` (5) · `net-ufm-05` (2). Zero collisions at the 1U placeholder, so
SPARKS renders **honest gold, never falsely red**. Each needs its own ruling pass. The DFW02-vs-
SPARKS vocabulary split (marketing names vs NetBox slugs) remains the standing argument for
**SITE PROFILE**.

## BATCH NOW = 5 (.238 .239 .240 .241 .242) — cap is 6
Device-verify: DFW2 `c1:002` checklist unchanged, **plus** SPARKS **`s3:175`** (NOT `dh1:005`).
Queue (A → C → B → honesty-parity → D → E) is untouched and still gated on John's PASS.

---

# §14 — SHIP v1.14.243 · SCOPE FLOW (UI-logic, rd-scoped, 2026-07-13)

Per `HANDOFF-SCOPE-FLOW-243.md`. Two parts, one ship. **Batch is now 6 — AT THE CAP.**

## PART A — the SCOPE A JOB dead-render (John's field report, DFW-05)
Master page → loaded-master banner → tap **SCOPE A JOB** → *nothing happened*.

**Root cause confirmed against live source.** `mscope_open()` renders into `deploy_opsHost()`
(= `#wk-deploy` under redesign) but **never made that host visible**. Tapped from `pg-master`, the
picker painted into a hidden container on a page the user wasn't on. Nothing thrown, nothing
logged — the exact **silent-success-into-a-hidden-node** class as the `.223` fix. `.223` patched
only the `nav_restore` dispatch (`d==='mscope'`); **the live tap path was never patched.** ＋NEW
worked purely by the luck of the user already standing in Work→Deploy.

**Fix = drill at the CHOKEPOINT** (top of `mscope_open`, rd-gated): `showMode('work')` →
`deploy_ensureDeployPanelVisible()`. `showMode` *re-adds* `.wk-grid` (grid-landing default), so the
`.223` helper must follow it. Deliberately **not** `showWorkTab('deploy')` — that renders the whole
Command Center and pushes `d:'command'` first (wasted paint + polluted back-stack). `showMode`'s
`showPage()` is `_navInternalCall`-guarded, so the drill pushes **no** nav state.

### ⚠️ THE SPEC UNDERCOUNTED THE BLAST RADIUS
There are **SEVEN** `mscope_open()` callers, not the three the handoff listed. Fixing at the
chokepoint also repairs **two more dead paths the field report never reached**: the **blocker
sheet's** NEW FROM MASTER (L19842) and the **handoff sheet's** (L20120) — both reachable from
pages that are not Work→Deploy. Per-button fixes would have missed them. **Lesson: fix the
chokepoint, not the button.**

## PART B — MASTER OWNS JOB BIRTH (John ruling)
The Master is the ONLY place a job is born; Deploy is where jobs **live**. The empty-scope CTA is
now rd-gated: redesign **routes** to the Master page; legacy keeps its in-place picker verbatim.

### ⚠️ DEVIATION FROM SPEC (deliberate, reported)
Spec said `onclick="showPage('master')"`. **Shipped `onclick="rd_openMasterFile()"`** — the
canonical `.167` door. The hard rule is **one door per feature** ("new entry points call the ONE
canonical `rd_open*` function"); a raw `showPage('master')` would be a *second* hand-built entrance
to a surface that already has one. It is also strictly better: `rd_openMasterFile` adds the
defensive `master_showSection('file')` echo, landing on the **FILE browse** — where the LOAD MASTER
FILE CTA and the loaded-master banner actually live — instead of whatever section `pg-master`
defaults to. *(Note: `'master'` **is** whitelisted in the Ship-B4 `showPage` rd guard
(`['cmd','work','ref','master']`), so neither form breaks the no-legacy-page-IDs rule. This was
about the **door** rule, not the guard.)* `mscope_loadMaster()` survives — legacy CTA + the picker's
own RE-LOAD button = 4 live call sites, no dead code.

## VERIFIED IN A REAL BROWSER (not just static checks)
The whole defect class is **invisible to a throw-only instrument**, so static greps could not have
caught it and cannot prove the fix. Drove headless Chrome against the built file, both houses:
- **rd:** standing on `pg-cmd`, `#wk-deploy` **not visible** → `mscope_open()` → `pg-work` active,
  `.wk-grid` stripped, host **VISIBLE (1184×225)**, `.msc-wrap` painted **and non-zero-size**, CTA
  reads `OPEN MASTER FILE →` wired to `rd_openMasterFile()`.
- CTA click → lands on **`pg-master`**, visible.
- **＋NEW regression:** already in Work→Deploy, second drill → still paints. Drill is idempotent.
- **`?legacy=1`:** `redesign_isOn()` false → drill block **inert** (`wk-grid` untouched), picker
  paints into `#ops-content`, CTA still `LOAD MASTER` → `mscope_loadMaster()`, RE-LOAD survives.
- **Zero console errors or warnings in either house.**

## BATCH = 6 (.238 .239 .240 .241 .242 .243) — AT THE CAP, NO MORE SHIPS
One consolidated device pass covers all six:
1. **Heights:** DFW2 `c1:002`; SPARKS **`s3:175`** (NOT `dh1:005` — that cab does not exist).
2. **Scope flow:** Master banner SCOPE A JOB → picker visible, back → Master · Work grid → Deploy →
   ＋NEW → picker · no master → OPEN MASTER FILE → `pg-master` → load → SCOPE A JOB → picker ·
   `?legacy=1` still offers LOAD MASTER in place.

Queue (A → C → B → honesty-parity → D → E) untouched, still gated on John's PASS.

---

# §15 — SHIP v1.14.244 · MONOLITH PLATE (visual, Forge module, 2026-07-13)

Per `HANDOFF-FORGE-MONOLITH-PLATE.md`. John device-approved mock **variant D (MONOLITH)**.
Old plate = flat fill + `strokeRect` + one line of text (256×64) — "basic and blah" (John).
New plate = machined gunmetal plaque: brushed grain, chamfered slab, bevel pair, corner bolts,
**engraved** ID (dual-pass emboss), routed light channel that **ignites cyan on focus**.
Canvas 256×64 → **576×144** (2× res, **same 4:1 plane — geometry untouched**).

**Contract preserved exactly:** `(text, focus) → Mesh{PlaneGeometry 1.5×0.375,
MeshBasicMaterial{map: CanvasTexture}, toneMapped:false}`. Both plate-recycling callers
(`assignSlot`, `setFocus`) dispose `old.material.map / .material / .geometry` — unchanged.

## ⚠️ DEVIATION — §3 FONT RE-BAKE HOOK **DROPPED** (evidence, not preference)
The spec adds a `document.fonts.ready` one-shot re-bake to defend against a first-paint font race.
**That race cannot happen in this app.** Verified against live source:
- The **only** `@font-face` is `PhantomBrand`. **Zero** `fonts.googleapis` / `gstatic` links
  (the offline-first no-CDN guard).
- `--orb` / `--raj` resolve to `-apple-system, 'Helvetica Neue', Arial, sans-serif`.
- So `"Orbitron"` and `"Chakra Petch"` **always** fall back to their generics — exactly as the
  OLD plate's `"Chakra Petch"` already has for several ships. **The fallback IS the approved look.**

The hook is therefore a no-op — **and as specced it would have introduced two bugs:**
1. It re-bakes via `assignSlot(s, label)` → which calls `plate(label, **false**)`. That strips the
   lit channel off the **currently focused** rack, and `setFocus` early-returns on
   `(focused === rack)`, so nothing restores it until the user taps away.
2. It iterates only `focusables` — the five `'run'` racks. The **`'dummy'` neighbour racks**
   (built at L18075) **also carry plates** and would never re-bake.

Shipping a no-op that breaks focus state is strictly worse than shipping nothing.

### 🔭 CONDITION FOR REVIVING IT
**If a real webfont is ever embedded** (an `@font-face` for Orbitron/Chakra/Rajdhani, or a font
token stops being a system stack), plates **will** need a one-shot re-bake. Correct implementation
— do NOT reuse the spec's:
- Iterate **every plate-bearing rack**, not just `focusables` (push each `grp` from `buildRack`
  into a module-level array, or walk the scene).
- Re-bake with `plate(label, rack === focused)` so **focus state survives** — do **not** route
  through `assignSlot` (it forces `focus=false` and needlessly churns gut textures).

## VERIFIED (§4 guards — real browser; shipped `plate()`/`plateChamfer` extracted verbatim,
## run against a live canvas with THREE stubbed)
| guard | result |
|---|---|
| **Deterministic** | two consecutive `plate('dh1:005', true)` canvases **pixel-identical** → recycled slots never shimmer |
| **Contract** | all 7 cases: 576×144, plane 1.5×0.375, CanvasTexture, `toneMapped:false`, anisotropy 16 |
| **Focus** | focused ≈ **12.2%** cyan-dominant px · **every idle plate = cyan 0.0000** (etched, legible, **no glow**) |
| **Pad** | `'·  ·  ·'` is the quietest surface (ink 0.009) |
| **No-colon** | `'R42'` (0.027) and the `'F-06'` dummy labels (0.029) render **centered, never blank** |
| **Real ids** | `c1:002` (DFW2), `s3:175` (SPARKS), `dh1:005` all correct |

Idle legibility is the one that matters — **idle is ~80% of what's on screen**.

## `?legacy=1` — UNAFFECTED
`#forge3d-sheet` is CSS-gated to `body.rd` (`body.rd #forge3d-sheet.open{display:flex}`), so legacy
cannot render the Forge scene at all. This ship changes **only pixels inside `plate()`** — no
gating, no markup, no shared code. *(Honest caveat: I could not prove the module never
**executes** under legacy — the header is a known cross-house surface — but since only pixels
changed, legacy behavior is identical either way.)*

## ⚠️ BATCH = 7 (.238 → .244) — **ONE PAST THE 6-CAP**
John was told the batch was at cap and shipped this anyway. Flagged per CALL 0. **No more ships.**
The consolidated device pass now owes:
1. **Heights:** DFW2 `c1:002` · SPARKS `s3:175`.
2. **Scope flow (.243):** the four guards.
3. **Forge (.244):** focused plate lit · **idle plates legible WITHOUT glow** · NEXT/PREV walk with
   no recycle hitch · oblique-angle sharpness · cold PWA reopen.

## OUT OF SCOPE (parked, John's call)
Etched five-pip rail lit as racked-count (the "E transplant") — needs real data through the plate
contract; own spec, own ship.

---

# §16 — SHIP v1.14.245 · UFM CLASSIFIER (f5d6db3, 2026-07-13) · BATCH = 1, AWAITING DEVICE PASS

**✅ BATCH `.238`–`.244` CLEARED by John, 2026-07-13.** That stack is closed. `.245` opens a new batch.

Per `HANDOFF-PKG-FINAL-2026-07-13.md` **Ship 1** (Ships 2 and 3 of that package are NOT started —
one-unverified-ship-in-flight is still law).

## What shipped — three edits, reusing the existing `server` type
| # | site | change |
|---|---|---|
| 1 | `master_hostType` :29361 | `ufm|fabric manager` → `'server'`, at the **tail** so it can never steal a host an earlier, more specific rule already claimed |
| 2 | **`_TMAP` :17782** (inside `forge3d_render`) | **added the `server: 'server'` key** |
| 3 | `deploy_classifyDevice` :26648 | same test before its `'blank'` fallthrough (EDP/CSV path) |

Zero additions to `TYPE_COLOR`/`TLABEL` (:17749) or `TYPE_COLORS` (:39782) — all three already
carry `server`. Zero CSS.

## ⚠️ THE SPEC'S ROOT CAUSE WAS WRONG AND ITS FIX WAS A PROVEN NO-OP — read before trusting a handoff's blame
The package blamed `deploy_classifyDevice`. **It is not in that path.** `s3:176` reached the screen
through the **Master** (SCOPE A JOB → `mscope_buildRacksFromSnapshot` → `master_rackToElevation`,
which stamps `type: master_hostType(h)`). `deploy_classifyDevice` is only ever fed `cols[3]` by the
EDP **CSV** parser (:27728). The real chain is:

    master_hostType → 'other' → _TMAP['other'] → 'blank' → TLABEL → BLANK

The spec also sent me to `TYPE_COLORS` to check whether `'server'` was mapped. That is the **Rack
Map's** map (:39782 — it does carry `server`). The map on the **failing surface** is **`_TMAP`**
(:17782), the Forge bridge from `master_hostType`'s vocabulary to the flat one, and it had **no
`server` key**. Applying the spec's line verbatim and pushing a UFM through the real render chain:

    master_hostType -> 'server' · _TMAP['server'] -> undefined · || 'blank' -> STILL BLANK

**Edit 2 is load-bearing, not cosmetic — without it edit 1 is inert.** Edit 3 still ships: that
classifier is UFM-blind too, same defect class, and a CSV-sourced UFM would hit it.
**LESSON (third time now): a confident upstream claim dissolves on replay. Execute the spec's fix
before shipping it — "it compiles" is not "it works."**

## PRE-SHIP GUARD + POST-SHIP VERIFY (both real masters, app's own vendored SheetJS)
- **Total type drift = 2 hosts, both UFMs** (`s3-ufm1-r175`, `s3-ufm2-r176`; other/blank → server/server).
- **DFW02: 0 drift** across all 2347 placed hosts. SPARKS: 0 across the other 4141.
- Token sweep on `deploy_classifyDevice`: only `ufm` / `fabric manager` move; gpu/leaf/mgmt/pdu/
  patch/console/server/storage/HGX/q3400-ra/`''`/null all identical.
- `_TMAP` addition is **inert for existing data** — `master_hostType` could not emit `'server'` before this ship.
- **Shipped bytes re-verified:** `s3:176` U27 → **SERVER**. SPARKS BLANK count **461 → 459**.

## 📋 BLANK-TOKEN AUDIT — JOHN'S RULING OWED (no reclassification performed)
Every distinct model token still rendering as a **blanking panel** on the real masters:

| master | BLANK | tokens |
|---|---|---|
| **DFW02** | **1 / 2347 (0.0%)** | one row with an **empty model cell** @`c1:001:38` |
| **SPARKS** | **459 / 4143 (11.1%)** | `q3400-ra` ×448 · `net-6x100g-02` ×6 · `fs-media-converter-chassis` ×5 |

- **`q3400-ra` ×448** — every one is named `s*-**ib**-ruNN-*`. The master itself calls them
  InfiniBand. Strong, but it is a **naming inference, not a vendor spec or a photo** → **NOT seeded.**
- **`net-6x100g-02` ×6** — these ARE John's `pkey02` / `pkey04` / `metal-jump01` rows. **One token
  explains three of the four BLANKs on his screen.**
- `s3:176` reproduced exactly: was **4 BLANK of 21**, now **3** (the UFM cleared).

## 🔴 SYSTEMIC FINDING — SURFACED, NOT FIXED (John's call, its own ship)
**`_TMAP.other = 'blank'`** means **every unclassified Master device renders as a BLANKING PANEL** —
the app draws *"nothing is installed here"* over real hardware. This is the same honesty class as the
1U guess that `.238` exists to kill, but **strictly worse**: a wrong height still **shows** a device;
BLANK **erases** it. That is **459 hosts on SPARKS today**. An honest **`unknown`** type (gold, like
the height flag) instead of `blank` would close the whole class rather than one token at a time.
Fixing this is arguably a better use of the next ship than Ship 2.

## Noted in passing, NOT touched (strict scope)
In `deploy_classifyDevice` the `/mgmt/` test **precedes** the `/cable\s*mgmt/` test, so
`'cable mgmt'` classifies as **`switch`**, not `blank`. Pre-existing, unrelated to this ship.

## DEVICE-VERIFY OWED (John) — HARD STOP before Ship 2
1. `s3:176` → **UFM row (U27) reads SERVER**, not BLANK.
2. `pkey02` / `pkey04` / `metal-jump01` rows **UNCHANGED** this ship (still BLANK — your ruling pending).
3. One other rack spot-checked for type regressions.
4. `?legacy=1` curl-diff.

## NEXT (gated on that pass)
Ship 2 (facility-keyed site profiles) and Ship 3 (verified height overrides) of the package are
**untouched**. The queue from §12 (A → C → B → honesty-parity → D → E) is also untouched.
⚠️ Repo `CLAUDE.md` § "Current state & queue" is **stale at `.226`** — the live-state doc is THIS file.

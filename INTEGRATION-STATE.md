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

---

# §17 — SHIP v1.14.246 · THE HONEST `unknown` TYPE (2026-07-13) · BATCH = 2, DEVICE PASS OWED

**John's call: taken INSTEAD of the package's Ship 2 (site profiles),** on the systemic finding the
`.245` audit surfaced. Ship 2 and Ship 3 remain unbuilt.

## The lie this kills
`_TMAP.other = 'blank'` mapped `master_hostType`'s fallthrough — *"I could not classify this"* —
onto the flat type **`blank`**: slate `#22303e`, label literally **`BLANK`**. So **every**
unclassified Master device rendered as a **blanking panel**. The app drew *"nothing is installed
here"* over real, racked hardware: **459 hosts on SPARKS (11.1%)**, 1 on DFW02.

Same honesty class as the 1U-height guess `.238` exists to kill, but **strictly worse — a wrong
height still SHOWS a device; BLANK ERASES it.** A gloved tech reading the aisle would walk past
**448 InfiniBand switches the screen calls empty U.**

## What shipped — 5 edits, all inside `forge3d_render`, all DISPLAY-ONLY
| # | change |
|---|---|
| 1 | `TYPE_COLOR` + `unknown: '#ffcb45'` (gold — the app's existing "we don't know something" token). **`blank` KEEPS slate.** The two claims must never share a colour. |
| 2 | `TLABEL` + `unknown: 'UNKNOWN'` |
| 3 | `_TMAP` — `other: 'blank'` → **`other: 'unknown'`** |
| 4 | `_TMAP[s.type] \|\| 'blank'` → **`\|\| 'unknown'`** — an unmapped key is by definition unknown, never empty |
| 5 | `flagsOf` + `'DEVICE TYPE UNKNOWN · <model> — REAL GEAR, NOT A BLANKING PANEL'` (gold WARN family, not red conflict) |

**Edit 4 matters beyond this ship:** that `|| 'blank'` is the exact fallback that swallowed `.245`'s
`'server'` and rendered a UFM as a blanking panel. It is now fail-honest instead of fail-empty.

## ⭐ THE DESIGN LINE — why `unknown` is drawn TO SCALE and NOT hatched
`drawGuts` reserves the hazard hatch + hard border + ⚠ for `conflict` / `overflow` / `hgtUnknown`.
All three assert **one** thing: **DO NOT TRUST THIS GEOMETRY.**

**Type-unknown is a different claim.** The U-span **is** true — read straight from the Master
(`net-6x100g-02`'s height is even vendor-seeded 1U per `.242`). We simply cannot **name** the device.
So it renders **solid, at correct scale, gold-spined, flagged — and NEVER hatched**, because hatching
would falsely assert the geometry is untrustworthy. Both flags co-exist where both are true
(`q3400-ra` is type- **and** height-unknown → gold spine **and** hatch).
**Getting this line wrong in either direction would have shipped a NEW lie** — which is the whole
point of the ship. Do not "simplify" these into one flag later.

## Why this was safe to do as a display-only ship
- **`_TMAP` is display-only.** `mscope_buildRacksFromSnapshot` persists `master_hostType`'s **raw**
  output (`'other'`); `_TMAP` exists **only** inside `forge3d_render` (2 refs, both display).
  **Nothing persisted changes.**
- **Counts are bit-identical.** `refreshCounts` uses `slots.length`; `statusOf` is orthogonal to
  type; and **`blank` was never special-cased anywhere in the Forge module** — no `drawGuts` skip,
  no denominator exclusion. **Grep-confirmed BEFORE designing** (this was the `.238`-class trap to
  rule out: if blanks had been excluded from the burn-down denominator, flipping 459 hosts would
  have silently moved every RACKED/PENDING count John reads).

## NOT TOUCHED (strict scope)
`deploy_classifyDevice`'s `'blank'` fallthrough (the **EDP/CSV** path). Unlike `_TMAP` it **is
PERSISTED** (`deployment.edpParsed.racks[].slots.type`), so flipping it rewrites seeded deployment
records → **own ship, own verify.** `'blank'` therefore remains a legitimate, reachable type — but
only from EDP, where it means *"the data positively says blanking panel."*

## GUARD (both real masters, shipped maps extracted verbatim from the edited file)
| master | census (shipped) | moved vs `.245` | still BLANK |
|---|---|---|---|
| DFW02 (2347) | `switch:905 · gpu:1441 · unknown:1` | **1** (blank→unknown) | **0** |
| SPARKS (4143) | `gpu:1681 · pdu:1296 · switch:693 · unknown:459 · patch:12 · server:2` | **459** (blank→unknown) | **0** |

**Not one host carrying a real type moved.** Invariants green: unknown colour ≠ blank colour
(`#ffcb45` vs `#22303e`); every `_TMAP` value resolves to a defined `TLABEL` **and** `TYPE_COLOR`
(**0 undefined-label rows** — the failure that would print the literal word `undefined` on a tray).

**Net: zero Master-sourced devices are described as blanking panels any more.**

## DEVICE-VERIFY OWED (John) — ONE pass covers `.245` + `.246`
1. **`.246`** SPARKS `s3:176` → U31 `metal-jump01` / U29 `pkey02` / U28 `pkey04` read **UNKNOWN in
   gold**, not BLANK · tap each → gold flag *DEVICE TYPE UNKNOWN · net-6x100g-02 — REAL GEAR, NOT A
   BLANKING PANEL* · drawn **solid, to scale, no hatch**.
2. **`.246`** `s1:001` → the 448 `q3400-ra` read UNKNOWN + gold and — being height-unknown too —
   **still carry the hatch + MODEL HEIGHT UNKNOWN**.
3. **`.246`** DFW02 `c1:002` unchanged (its 2 real collisions still red) · **no tray anywhere prints
   the literal word `undefined`** · RACKED/PENDING counts unchanged from `.245`.
4. **`.245`** `s3:176` U27 UFM still reads **SERVER**.
5. Both: `?legacy=1` curl-diff.

## STILL OWED — JOHN'S RULING (this ship makes them HONEST; it does not classify them)
~~`q3400-ra` ×448~~ → **RULED, shipped `.247` — see §18** · `net-6x100g-02` ×6 ·
`fs-media-converter-chassis` ×5 · DFW02's one **empty-model** row @`c1:001:38`.

---

# §18 — SHIP v1.14.247 · SEED `q3400-ra` = InfiniBand SWITCH (type-only, 2026-07-13) · BATCH = 3

**John's field call:** *"q3400-ra is InfiniBand — seed it as switch."* Same authority class as his
6U/DFW02 ruling and the SYS-821GE photo. The master's own naming (all 448 are `s*-**ib**-ruNN-*`)
**corroborates** it — but **John's word is the evidence of record.** Per `.238` discipline a naming
inference **alone** would NOT have been seeded, and `.246` deliberately shipped them as honest gold
UNKNOWN rather than acting on the hint.

**ONE EDIT** — `master_hostType`, immediately above the existing sw-family rule:

    if (/(^|[^a-z0-9-])q3400-ra([^a-z0-9-]|$)/.test(s)) return 'sw';

The preceding gpu/cdu/pwr tests don't match `q3400-ra`, so it cannot steal a host from a more
specific classifier.

## ⚠️ THE OBVIOUS REGEX WAS WRONG — caught by the guard, not by reading
`\bq3400-ra\b` is a **trap**: **`\b` matches before a hyphen**, so it also swallows a longer SKU like
`q3400-ra-x` — a rev John never ruled on would **silently inherit the ruling**. The shipped boundary
excludes a trailing `-`. Same discipline as `.242`'s `\b` guard that keeps `sn5600` off the
`sn5610`=2U row. **Seeding a family the owner did not rule on is exactly the guess `.238` exists to
kill.** Generalise: **`\b` is not a model-exactness boundary when the SKU contains hyphens.**

## GUARD (both real masters, shipped function)
| | result |
|---|---|
| SPARKS | **448 move `unknown → switch`**; the ONLY model that moves is `q3400-ra`. Unknown **459 → 11** (11.1% → 0.3%) |
| DFW02 | **zero** movement, zero models touched |
| **HEIGHT drift** | **0 on both** — `master_nodeHeightInfo` bit-identical across all 6490 placed hosts |
| model-exactness | `q3400` → other · `q3400-rb` → other · `q3400-ra-x` → other |

*Control:* `sn5600` → `sw` is **pre-existing** (the long-standing `\bsn\d` rule already typed it;
`.242`'s sn5600 guard was about **height**). Not a regression, not introduced here.

## ⭐ TYPE ONLY — HEIGHT REMAINS HONESTLY UNKNOWN (do not "finish the job" later without a ruling)
`q3400-ra` is **NOT** in `MASTER_U_TABLE` and this ship does not add it. Verified post-edit:
`master_nodeHeightInfo('q3400-ra')` = `{u:null, known:false}`. So all 448 now render **SWITCH**
(violet spine, label SWITCH) **while STILL carrying** the gold hazard hatch, hard border, ⚠ and
*MODEL HEIGHT UNKNOWN — NOT DRAWN TO SCALE*.

**That simultaneity is correct, not a bug.** John ruled on **WHAT** the device is, not **HOW TALL**
it is, and the app must never quietly infer the second from the first. This is the `.246` design line
(type-unknown ≠ height-unknown) paying off in the opposite direction.

**Lead for the height ruling — NOT seeded:** SPARKS places them at a **uniform 5U pitch**
(`s1:001` → U42 / U37 / U32), which **bounds** the chassis at ≤5U but does not determine it. A vendor
spec or John's eyeball closes it, exactly as with VAST DBox.

## DEVICE-VERIFY (John) — one pass now covers `.245` + `.246` + `.247`
- **`.247`** SPARKS `s1:001` → `q3400-ra` rows read **SWITCH**, not UNKNOWN — **and still show the
  gold hatch + MODEL HEIGHT UNKNOWN**. Both are correct at once. DFW02 completely unchanged.
- **`.246`** `s3:176` → U31/U29/U28 read **UNKNOWN gold**, solid + to scale (no hatch), tap → *DEVICE
  TYPE UNKNOWN · net-6x100g-02 — REAL GEAR, NOT A BLANKING PANEL* · no tray prints `undefined` ·
  RACKED/PENDING counts unchanged.
- **`.245`** `s3:176` U27 UFM reads **SERVER**.
- All: `?legacy=1` curl-diff.

## STILL OWED — JOHN'S RULING
`net-6x100g-02` ×6 (the pkey / metal-jump rows) · `fs-media-converter-chassis` ×5 · DFW02's one
**empty-model** row @`c1:001:38` · **and the HEIGHT of `q3400-ra`** (448 hosts still hatched).

---

# §19 — SHIP v1.14.248 · RETIRE THE CRASH-CART DOOR (2026-07-14) · BATCH = 4

**John-signed legacy deletion.** The ask was *"remove the crashcart key from OPS_TABS."* Shipping
that literally would have created a bug; the ship is the key **plus its only door**.

## The lie this kills
Crash-Cart Mode was **RETIRED by owner decision** (PHASE0-CENSUS: *"do NOT build doors for it;
physical deletion waits for R1"*). But the door was still live — `OPS_TABS.crashcart` existed and
`#ops-tab-strip` still rendered a tappable **Crash-Cart** pill. The app offered a working entrance to
a feature the owner had killed.

**How it surfaced:** a `/graphify` knowledge-graph build over the repo's docs flagged `showOpsTab` as
the **highest-betweenness node** in the documented architecture. Tracing its edges showed it still
dispatching to a census-RETIRED surface. **The graph raised the lead; live code was the evidence** —
every claim was grep-confirmed before a single edit.

## ⚠️ WHY THE KEY ALONE WOULD HAVE SHIPPED A DEAD-TAP
`showOpsTab` opens with:

    tab = (OPS_TABS[tab]) ? tab : (currentOpsTab || 'sops');

Delete the key, leave the pill @`:14781`, and tapping **Crash-Cart** falls through that guard and
**silently renders the SOPs tab** — no warning, no toast, no throw. That is precisely the defect class
`.223` (deploy dead-card) and `.224` (ops-content dead-tap sweep) exist to kill, and it violates
**hard rule #1 (no silent failures)**. A key and its only door are one unit; deleting half of a door
leaves a button that lies.

## What shipped — 3 edits
| # | change |
|---|---|
| 1 | `OPS_TABS.crashcart` key + launch-card handler **removed** (`:19615`). Trailing comma moved onto `manifest` so the object literal stays valid. |
| 2 | `'crashcart'` dropped from the `_unhomedOps` host-routing test (`:19649`) + its comment — the tab no longer exists, so it cannot be un-homed. |
| 3 | The **Crash-Cart pill removed** from `#ops-tab-strip` (`:14781`). |

## GUARD (post-edit, on the shipped file)
| | result |
|---|---|
| `OPS_TABS` keys | **10** — blast, sops, portmap, rackmap, optics, burndown, audits, bom, deploy, manifest. `crashcart` **absent**. |
| reachable doors | `showOpsTab('crashcart')` = **0** · `data-tab="crashcart"` = **0** · `onclick="crashcart_toggle()"` = **0** |
| entry-point proof | `crashcart_toggle()` had **exactly ONE caller** (the OPS_TABS launch card) → the mode is now **fully UNREACHABLE** |

## NOT TOUCHED (strict scope)
The mode's own implementation — `crashcart_toggle` / `crashcart_exit` / `crashcart_pickRack` /
`crashcart_render`, the `#crashcart-layer` overlay markup, and the ~100-line `.crashcart-*` CSS
cluster — is now **dead but INTACT**, left for the **LR-2 atomic sweep that already owns it**
(order dependency; a CSS-brace-balance job, not a drive-by). Deleting it here would have put a large
diff on an already-unverified stack.

## ⚠️ LEGACY-STRICT BREAK — EXPLICITLY SIGNED BY JOHN (2026-07-14)
**This is the first ship to touch `#ops-tab-strip` markup, so `?legacy=1` is NO LONGER
byte-identical** — the pill is gone in the legacy house too. **Intended:** the surface is RETIRED in
both houses, and leaving a working door to a killed feature under legacy would be the lie.
Ship-discipline **rule 7** requires an owner signature for exactly this; it was given.
Precedent set: a census-RETIRED surface's *doors* may be cut ahead of LR-2; its *code* may not.

## DEVICE-VERIFY (John) — one pass now covers `.245` + `.246` + `.247` + `.248`
- **`.248`** BUILD subtab strip → the **Crash-Cart pill is GONE**. The remaining pills all still open
  their correct panes — **especially tap Rack Map and Optics** (the two that flanked the deleted
  pill): neither may dead-tap or land on SOPs. Same check under `?legacy=1` (pill gone there too —
  expected, signed).
- **`.247`** SPARKS `s1:001` → `q3400-ra` reads **SWITCH** + still gold hatch + MODEL HEIGHT UNKNOWN.
- **`.246`** `s3:176` → U31/U29/U28 read **UNKNOWN gold**, solid + to scale, no hatch; no `undefined`.
- **`.245`** `s3:176` U27 UFM reads **SERVER**.

## STILL OWED — JOHN'S RULING
- **`net-6x100g-02` ×6 and `fs-media-converter-chassis` ×5 are BOTH media converters** (John's field
  call, 2026-07-14) — but **there is no media-converter type in the app** (`gpu/switch/pdu/patch/
  server/storage/unknown/blank`). **Awaiting his type + colour decision** before that ship. Heights
  split: `net-6x100g-02` is **1U known**; `fs-media-converter-chassis` is **height-unknown** (stays
  hatched — do not infer height from the type ruling, per §18).
- ⚠️ **Latent trap found while scoping it:** the `.242` height rule for `net-6x100g-02` is a **bare
  substring** `/net-6x100g-02/` with **no boundary**, so `net-6x100g-02-x` would silently inherit 1U —
  its own comment claims *"KEYED TO EXACT REV -02"* but the regex does not enforce that. Same hyphen
  trap as §18. Harmless on today's masters; a future-rev landmine. **One-line fix, not yet made.**
- DFW02's one **empty-model** row @`c1:001:38` · **the HEIGHT of `q3400-ra`** (448 hosts still hatched).

---

# §20 — SHIP v1.14.249 · BOUNDARY FIX `net-6x100g-02` (2026-07-14) · BATCH = 5 ⚠️ CAP-1

**One line, data-only, height-only.** Found while scoping the media-converter ruling; John asked for
it directly.

## The rule lied about itself
`.242` seeded the height as a **bare substring**:

    { re: /net-6x100g-02/, u: 1 },

while its own comment claimed *"KEYED TO EXACT REV -02: a future -03 is different hardware until its
own pitch proves otherwise."* **The regex did not enforce that.** Any longer SKU containing the
substring silently inherited John's 1U ruling.

**⚠️ `\b` would NOT have fixed it either** — `\b` matches **before** a hyphen. That is the exact
`.247` `q3400-ra` trap seen from the other side. **Generalisation (now proven twice): neither a bare
substring NOR `\b` is a model-exactness boundary when the SKU contains hyphens.** The only safe form
is an explicit negated class.

## Shipped

    { re: /(^|[^a-z0-9-])net-6x100g-02([^a-z0-9-]|$)/, u: 1 },

`master_nodeHeightInfo`'s haystack is **`model + ' ' + dns`**, and a **space is a boundary char**
under this class — so real hosts still hit. (Checked before shipping; this is the detail that would
have broken a naive `^...$` anchor.)

## GUARD (both real masters, shipped table vs the `.248` baseline)
| | result |
|---|---|
| **HEIGHT drift** | **0 across ALL 6490 placed hosts, BOTH masters** — bit-identical on real data |
| the 6 real hosts | SPARKS `s3:175`/`s3:176` still resolve `{u:1, known:true}` |
| **leaks CLOSED** (were 1U-known, now honestly unknown) | `net-6x100g-02-x` · **`net-6x100g-021`** · `xnet-6x100g-02` (prefix leak) |
| controls | `net-6x100g-03` / `-04` / `net-6x100g` — unknown before, unknown after |

**`net-6x100g-021` is the one that matters.** It is a *far* more plausible future NetBox rev than the
`-02-x` that first raised the flag — a brand-new rev would have silently inherited a ruling it never
earned. **The guard found it; reading the regex did not.** (Third time that has been true.)

## ⚠️ SIBLING RULES NOT TOUCHED — John's call, flagged not fixed
The same latent leak exists in two more `MASTER_U_TABLE` rows:
- `{ re: /ngfw-4245/, u: 1 }` — **bare substring**, same class exactly.
- `{ re: /\bas-?2125/, u: 2 }` — **no trailing boundary at all**.

Neither was asked for; **no drive-by changes**. They go in one ship on his word.
*(Rules keyed on hyphen-less SKUs — `\bsn5610\b`, `\br760\b`, `\bgb300\b` etc. — are SAFE; `\b` works
fine there. The trap is hyphens, only.)*

## Also noted, NOT fixed
`sw.js` still precaches `icons/phantom-tool-crashcart-256.webp` — an orphaned asset after `.248`
retired that surface. Harmless (a cached icon nobody renders), belongs to the LR-2 sweep.

## DEVICE-VERIFY (John) — ONE pass now covers `.245` → `.249` (5 ships, cap is 6)
- **`.249`** SPARKS `s3:175`/`s3:176` → the 6 `net-6x100g-02` rows (pkey/metal-ztp family) still draw
  **1U, to scale, NO height hatch** — identical to `.248`. Nothing else on either master changes height.
- **`.248`** BUILD subtab strip → **Crash-Cart pill GONE**; tap **Rack Map** and **Optics** (the pills
  that flanked it) — neither dead-taps nor lands on SOPs. Same under `?legacy=1` (pill gone there too
  — signed break).
- **`.247`** `s1:001` → `q3400-ra` reads **SWITCH** + still gold hatch + MODEL HEIGHT UNKNOWN.
- **`.246`** `s3:176` → U31/U29/U28 read **UNKNOWN gold**, solid + to scale, no hatch; no `undefined`.
- **`.245`** `s3:176` U27 UFM reads **SERVER**.

## STILL OWED — JOHN'S RULING
1. ⭐ **THE MEDIA-CONVERTER TYPE.** `net-6x100g-02` ×6 **and** `fs-media-converter-chassis` ×5 are
   **both media converters** (John's field call, 2026-07-14) — but **the app has no media-converter
   type** (`gpu/switch/pdu/patch/server/storage/unknown/blank`). **Blocked on his type + colour
   decision.** Heights are already settled and must NOT be inferred from the type ruling:
   `net-6x100g-02` = **1U known** (this ship); `fs-media-converter-chassis` = **height-unknown**
   (stays hatched).
2. The `ngfw-4245` / `as-2125` boundary siblings above.
3. DFW02's one **empty-model** row @`c1:001:38`.
4. **The HEIGHT of `q3400-ra`** (448 hosts still hatched).

---

# §21 — SHIP v1.14.250 · BOUNDARY FIXES `ngfw-4245` + `as-2125` (2026-07-14) · ⛔ BATCH = 6, CAP REACHED

Completes the sibling sweep §20 flagged. **Data-only, height-only.**

## ⚠️ RECON CHANGED THE PLAN — §20's OWN FLAG WAS PARTLY WRONG
§20 flagged **both** rules as leaks needing a trailing boundary. **Replaying the real masters BEFORE
editing showed that would have been a BUG for `as-2125`.** The two rules are not the same shape.

| rule | real model string on the master | count |
|---|---|---|
| `ngfw-4245` | written **exactly** `ngfw-4245` | 4 (SPARKS `s3:175`) |
| `as-2125` | written **`Supermicro AS-2125`** — but the RULED HARDWARE is the **AS-2125HS-TNR** | 50 (DFW02) |

**The lesson: a self-flagged "obvious" fix still gets replayed against real data before it ships.**
The flag was right about the defect class and wrong about the remedy for one of the two rows.

## What shipped
**(1) `ngfw-4245` — BOTH sides closed.** Was a bare substring with no guard on either side, so
`xngfw-4245` and `ngfw-4245-k9` silently inherited the 1U ruling.

    { re: /(^|[^a-z0-9-])ngfw-4245([^a-z0-9-]|$)/, u: 1 },

Correct here because **4215 / 4225 / 4245 are DIFFERENT boxes** — there is no family prefix to preserve.

**(2) `as-2125` — LEFT boundary ONLY.** `\b` matches **after** a hyphen as well as before one, so the
old `/\bas-?2125/` let `foo-as-2125` inherit. That side is now closed:

    { re: /(^|[^a-z0-9-])as-?2125/, u: 2 },

## ⭐ THE OPEN TAIL ON `as-2125` IS DELIBERATE — DO NOT "FINISH THE JOB" LATER
Closing it would stop matching the moment a master spells the **fuller SKU** (`AS-2125HS-TNR` — what
the hardware actually **is**), **silently dropping 50 real hosts to unknown height**: a regression
*from a correct known value*. It is also right on the merits — **Supermicro encodes U-height in the
model number** (`AS-2**1**25` → 2U), so the whole `as-2125*` family genuinely **is** 2U.
**A prefix match is the CORRECT semantics for this row. A bare substring was not.** The two are
different things and the distinction is the whole point of this ship.

## GUARD (both real masters, shipped table vs the `.249` baseline)
| | result |
|---|---|
| **HEIGHT drift** | **0 across ALL 6490 placed hosts, BOTH masters** — bit-identical |
| kept | 4 `ngfw-4245` hosts still **1U** · all 50 `as-2125` hosts still **2U** |
| **leaks CLOSED** | `xngfw-4245` · `ngfw-4245-k9` · `foo-as-2125` |
| **family preserved** (still 2U, by design) | `supermicro as-2125hs-tnr` · `as-2125gt-hnr` · `as2125` (hyphen-less) |
| control | `ngfw-4225` — unknown before, unknown after |

## ⭐ THE GENERALISATION (now proven 3× — .247, .249, .250)
When a SKU contains **hyphens**, **neither a bare substring NOR `\b`** is a model-exactness boundary
(`\b` matches on *both* sides of a hyphen). Only an explicit negated class `[^a-z0-9-]` is.
**But WHICH sides to close is a per-rule judgement about the vendor's naming, NOT a mechanical
rewrite.** Close the tail where the SKU is exact; leave it open where the row is *deliberately* a
family prefix. Rules keyed on hyphen-less SKUs (`\bsn5610\b`, `\br760\b`, `\bgb300\b`) are **safe as
they are** — the trap is hyphens, only. `MASTER_U_TABLE` is now clean of this class.

## ⛔ THE 6-SHIP CAP IS REACHED — NO FURTHER SHIPS UNTIL JOHN'S DEVICE PASS (CALL 0)
Batch = **.245 · .246 · .247 · .248 · .249 · .250**, all unverified.

### DEVICE-VERIFY (John) — ONE pass covers all six
- **`.250`** DFW02 → the 50 `Supermicro AS-2125` rows still draw **2U**, to scale, no hatch ·
  SPARKS `s3:175` → the 4 `ngfw-4245` rows still draw **1U** (U38/U40), no hatch. Nothing else on
  either master may change height.
- **`.249`** SPARKS `s3:175`/`s3:176` → the 6 `net-6x100g-02` rows still **1U**, no hatch.
- **`.248`** BUILD subtab strip → **Crash-Cart pill GONE**; tap **Rack Map** and **Optics** (the pills
  that flanked it) — neither dead-taps nor lands on SOPs. Same under `?legacy=1` (pill gone there too
  — the signed break).
- **`.247`** `s1:001` → `q3400-ra` reads **SWITCH** + still gold hatch + MODEL HEIGHT UNKNOWN.
- **`.246`** `s3:176` → U31/U29/U28 read **UNKNOWN gold**, solid + to scale, no hatch; no `undefined`.
- **`.245`** `s3:176` U27 UFM reads **SERVER**.

## STILL OWED — JOHN'S RULING (all blocked, nothing buildable)
1. ⭐ **THE MEDIA-CONVERTER TYPE** — `net-6x100g-02` ×6 **and** `fs-media-converter-chassis` ×5 are
   **both media converters** (his call, 2026-07-14), but the app has **no such type**. Needs his
   **type + colour** decision. Heights are already settled and must **not** be inferred from the type
   ruling: `net-6x100g-02` = 1U known; `fs-media-converter-chassis` = height-unknown (stays hatched).
2. DFW02's one **empty-model** row @`c1:001:38`.
3. **The HEIGHT of `q3400-ra`** (448 hosts still hatched).

---

# §22 — SHIP v1.14.251 · MEDIA CONV (2026-07-14) · ⭐ THE HONESTY ARC CLOSES · NEW BATCH = 1

**John's field call (2026-07-14):** *"net-6x100g-02 is a media converter, fs-media-converter-chassis
too."* The app had **no media-converter type** at all, so those 11 hosts had been sitting as
honest-but-useless gold **UNKNOWN** since `.246`.

## ⚠️ THE NAMING AND THE COLOUR ARE MINE, NOT JOHN'S
He ruled the **hardware** and explicitly **delegated** the rest (*"you do whats best"*). He did **not**
specify the type key, the label, or the colour. **Recorded as a Claude design call, not an owner
spec** — if he dislikes any of it, it is one token.

**The call:** **NOT a switch** — a media converter does not switch, and typing it as one would be
precisely the class of lie `.246` exists to kill. **NOT patch either** — a patch panel is **passive**;
a media converter is **powered active gear**. So it gets its own type:
`media` · label **`MEDIA CONV`** · colour **`#2ee6a8`**, deliberately held **apart from patch teal
`#1fffd0`** because patch is the type it sits closest to conceptually, and is therefore the pair a
gloved tech is likeliest to confuse at arm's length.

## What shipped — 4 edits
`TYPE_COLOR + media` · `TLABEL + media:'MEDIA CONV'` · `_TMAP + media:'media'` ·
`master_hostType` gains **two** rules at the tail.

## ⭐ TWO RULES, NOT ONE — DIFFERENT EVIDENCE, DO NOT COLLAPSE THEM LATER
| | rule | why this shape |
|---|---|---|
| **(a) SELF-NAMING** | `/media[\s-]*conv/` | `fs-media-converter-chassis` **says what it is in its own model string.** Reading a device's name is **not an inference**, so a GENERAL rule is legitimate — and a future `*-media-converter-*` rev is covered on the same evidence. Same class as `.245`'s generic `/ufm\|fabric\s*manager/`. |
| **(b) OWNER'S WORD ONLY** | `/(^\|[^a-z0-9-])net-6x100g-02([^a-z0-9-]\|$)/` | The NetBox slug **does not say what the device is** — nothing in `net-6x100g-02` hints "media converter". **John's ruling is the entire evidence**, so it is **MODEL-EXACT**, exactly like `.247`'s `q3400-ra`. A future `-03`/`-021` is different hardware until he rules on it. Boundary is the negated class, **not `\b`** (per `.250`). |

Both sit at the **tail** so neither can steal a host a more specific classifier already claimed.

## ⚠️ TYPE ONLY — HEIGHTS UNTOUCHED (the §17 design line paying off a third time)
- `net-6x100g-02` → **1U known** (seeded `.242`, boundary-fixed `.249`) → draws **to scale**.
- `fs-media-converter-chassis` → **not in `MASTER_U_TABLE`** → reads **MEDIA CONV** *and still carries
  the gold hazard hatch + MODEL HEIGHT UNKNOWN*.

**Reading MEDIA CONV while hatched is CORRECT, not a bug.** John ruled **what** they are, not **how
tall**. The app must never quietly infer the second from the first.

## GUARD (both real masters, shipped function vs the `.250` baseline)
| | result |
|---|---|
| movement | **exactly 11 hosts**, all `unknown → media`; the only models that move are the two he ruled. **Zero** other hosts change type on either master. |
| **HEIGHT drift** | **0** across all 6490 placed hosts |
| ⭐ **SPARKS** | **ZERO unknown-type hosts** (was **459 = 11.1%** before `.246`) |
| DFW02 | exactly **1** unknown remains — the **empty-model row @`c1:001:38`**, still owed a ruling |
| `.246` invariants | every `_TMAP` value resolves to a defined `TLABEL` **and** `TYPE_COLOR` — **0 undefined-label rows** (the failure that prints the literal word `undefined` on a tray) |
| over-catch | `media-server` → unknown · `net-6x100g-021` / `-02-x` / `-03` → unknown · `q3400-ra` → still switch · `fs-media-converter-chassis-v2` → media (intended, self-naming) |

## ⭐ THE ARC, .238 → .251
`.238` stop guessing heights · `.242` seed real ones · `.245` UFM is not BLANK · `.246` **`blank` →
`unknown`** (459 hosts stopped being erased) · `.247` q3400-ra = switch · `.249`/`.250` close the
boundary leaks · `.251` **the last two unknown models get a real name.**
**Net: on SPARKS, the app no longer describes a single real device as empty, mis-typed, or
un-nameable.** Every remaining hazard flag on that master is a *true* statement of ignorance.

## PRE-EXISTING, NOT FIXED (re-flagged from §17)
`TYPE_COLOR.pdu` and `TYPE_COLOR.unknown` **share `#ffcb45`** — a PDU spine and an UNKNOWN spine are
indistinguishable **by colour alone** (label + flag still differ). `media` does not participate.
John's call whether it matters.

## BATCH
John reviewed the `.245`–`.250` stack (*"i looked"*) and directed continuation (*"keep cooking"*).
⚠️ **Recorded honestly: that is an OWNER ACKNOWLEDGEMENT, not an itemized checklist pass** — the
per-ship items in §21 were not walked one-by-one. **This ship opens a NEW batch at 1.**

### DEVICE-VERIFY (John) — `.251`
- SPARKS `s3:176` → U31 `metal-jump01` / U29 `pkey02` / U28 `pkey04` now read **MEDIA CONV** in green,
  drawn **solid + to scale, NO hatch** (they are 1U-known).
- The 5 `fs-media-converter-chassis` rows (`s3:011`/`s3:111`/`s1:010`/`s2:060`/`s3:030`) read
  **MEDIA CONV** *and still carry the gold hatch + MODEL HEIGHT UNKNOWN* — **both at once is correct.**
- No tray prints `undefined`. RACKED/PENDING counts unchanged. **DFW02 completely unchanged.**

## STILL OWED — JOHN'S RULING
1. DFW02's one **empty-model** row @`c1:001:38` — **the last unknown-type host on either master.**
2. **The HEIGHT of `q3400-ra`** (448 hosts still hatched; SPARKS' uniform 5U pitch **bounds** it at ≤5U
   but does not determine it).
3. **The HEIGHT of `fs-media-converter-chassis`** (5 hosts — now named, still hatched).
4. Whether the `pdu`/`unknown` gold collision matters.

---

# §23 — JOHN'S RULINGS, RECORDED PRE-COMPACT (2026-07-14) · ⛔ NOTHING SHIPPED YET

**This section is a HANDOFF, not a ship note.** John ruled two things and asked that they be written
down *before* a context compaction. **No code was touched.** Live is still `.251`
(local == origin == live, CRLF-normalized diff clean). Read this before writing any code.

## RULING 1 — `q3400-ra` = **2U**
Resolves §22's owed item #2. **448 hosts on SPARKS stop being hatched.** They already type as
`switch` (`.247`); this is the **HEIGHT** only.
- ✅ **CONSISTENT WITH THE OBSERVED DATA** — SPARKS' uniform 5U placement pitch *bounds* the model at
  **≤5U**; 2U sits inside that bound (leaves 3U of air per pitch, which is normal). Had he said 6U I
  would have had to flag a contradiction. **He did not, so there is nothing to push back on.**
- Implementation: **one `MASTER_U_TABLE` row.** `q3400-ra` is **MODEL-EXACT** (owner's-word evidence,
  the §22(b) class — the slug does not self-name a height). It contains a hyphen ⇒ **§18 boundary law
  applies: `\b` is NOT a boundary on either side of a hyphen.** Use the negated class:
  `{ re: /(^|[^a-z0-9-])q3400-ra([^a-z0-9-]|$)/, u: 2 },`
- ⚠️ **GUARD BEFORE SHIPPING** (the `.250` lesson — *replay the real masters even on a "self-evident"
  fix*): expect **exactly 448 hosts** to move `hgtUnknown → 2U known`, **zero type drift**, and **zero
  other model** to change on either master.

## RULING 2 — type `unknown` = **MAGENTA `#ff2bd6`**
> *"unknown type gets magenta #ff2bd6 — spine, legend, detail dots together"*

Resolves §22's owed item #4. Kills the **`pdu`/`unknown` gold collision** (both were `#ffcb45`, so a
PDU spine and an UNKNOWN spine were indistinguishable by colour alone). **PDU keeps the gold; only
`unknown` moves.**
- ✅ **`#ff2bd6` IS ALREADY THE APP'S `--mag` BRAND TOKEN** (`:11017`, and Design Law 5 in `CLAUDE.md`).
  He picked an existing token, not a new colour. Coherent with the palette.

### ⭐ THE THREE SURFACES ARE ONE EDIT, NOT THREE — "together" is STRUCTURAL
`TYPE_COLOR.unknown` (`:17763`) is the **single source** feeding every surface he named:
| surface | site | how it reads the colour |
|---|---|---|
| **spine** (5px lane bar) | `:17957` → `:17965` | `var col = TYPE_COLOR[sl.type]` |
| **detail dots** (`.type-dot`) | `:18408` → `:18413` | `var col = TYPE_COLOR[sl.type]` |
| **search-result label** | `:18505`–`:18506` | `var col = TYPE_COLOR[rr.comp.type]` |
**⇒ Changing the ONE value at `:17763` moves all of them in lockstep.** They cannot drift apart.
(The `.246` invariant still applies: every `_TMAP` value must resolve to a defined `TLABEL` **and**
`TYPE_COLOR` — re-check it, since a typo'd key here prints the literal word `undefined` on a tray.)

### ⛔ DO **NOT** RECOLOUR THE HAZARD SITES — `unk` THERE MEANS **HEIGHT**, NOT TYPE
`:17968` (hatch), `:17977` (label text), `:17989` (hard edge) are all gated on **`unk`**, which pairs
with `bad` (`conflict || overflow`) and tracks **`sl.hgtUnknown`** — see the `flagged` split at
`:17995`: `if (sl.conflict || sl.overflow || sl.hgtUnknown)`. **That gold is the HEIGHT-UNKNOWN hazard
signal, and it is a DIFFERENT STATEMENT from type-unknown.** Recolouring it to magenta would **collapse
the exact distinction §17/§22 exist to protect** (*type-unknown ≠ height-unknown*; type-unknown draws
SOLID + TO SCALE, hazard means DO NOT TRUST THIS GEOMETRY). **Leave all three gold.**
Likewise **out of scope** (unrelated gold, must not move): `--gold` token, `.rf-card` RACK MAP / KNOW
accents (`:12526`, `:12571`), BURNDOWN (`:26390`, `:30756`), `.va-i-type` (`:11457`), `.ctag b` (`:11736`).

### ⚠️ TWO THINGS I OWE JOHN BEFORE THIS SHIPS
1. **The "legend" is NOT YET LOCATED as a `TYPE_COLOR` consumer.** The only legends in the file are
   `.rm-legend` (`:2432`/`:14635`, Rack-Map) and `.br-legend` (`:5843`, Blast-Radius) — **neither is
   driven by `TYPE_COLOR`.** So either he means the detail-list labels (already covered above), or
   there is a legend that **hardcodes** gold and needs a **second** edit. **Find it before shipping —
   do not assume the one-edit story covers it.**
2. **NEW COLOUR ADJACENCY, flagged honestly:** `unknown #ff2bd6` (magenta) now sits next to
   `storage #ff7bd0` (pink) — **same hue family.** The gold collision is genuinely killed, but this may
   trade it for a magenta/pink pair. **Needs his eye on a real tray**, not my judgement.

## BATCH STATE
**Open batch = 1 ship: `.251` (MEDIA CONV).** Device-verify checklist in §22 is **OWED and UNWALKED.**
⚠️ *"i looked"* on the `.245`–`.250` stack was an **OWNER ACKNOWLEDGEMENT, not an itemized pass** — it
does **not** carry forward to `.251`. Cap is 6; **5 slots remain** before a consolidated device pass.

## 📥 INBOX — `files (58).zip` (dropped 2026-07-14, **UNREAD**)
`Downloads/files (58).zip` → `HANDOFF-reh3d-rewire-REV2.md` (3.7KB) · `PHANTOM-OPEN-BOARD-2026-07-14.md`
(5.6KB). **Not yet opened.** `reh3d` = the 3D rack-elevation module (`_reh3dActive`, `.218`–`.220`);
it shares a **symmetric cross-dispose** contract with `forge3d_*` (§ `.222`) — **any rewire must
preserve that or it leaks a WebGL context.** Read both before acting on either.

## STILL OWED — JOHN'S RULING (updated)
1. DFW02's one **empty-model** row @`c1:001:38` — **the last unknown-type host on either master.**
2. ~~The HEIGHT of `q3400-ra`~~ → **RULED: 2U** (above; not yet shipped).
3. **The HEIGHT of `fs-media-converter-chassis`** (5 hosts — named `.251`, still hatched).
4. ~~Whether the `pdu`/`unknown` gold collision matters~~ → **RULED: `unknown` → magenta `#ff2bd6`**
   (above; not yet shipped). **New question raised:** magenta vs `storage` pink — his eye needed.

---

# §24 — SHIP v1.14.252 · BOTH §23 RULINGS SHIPPED (2026-07-14) · BATCH = 2
**Supersedes §23's "⛔ NOTHING SHIPPED YET".** Live-confirmed (`local == live`, byte-identical).
Three edits, no markup, no CSS, no new function.

## 1 · `q3400-ra` = 2U — **448 hosts stop being hatched**
The largest block of height-unknown devices on either master. Typed `switch` in `.247`; this is the
**height only** (0 type drift). **Evidence = John's word, and the code records that distinction:**
the uniform 5U pitch only **BOUNDS** the chassis at ≤5U — 2U sits inside the bound, so the ruling is
*consistent* with the floor, but **the floor could never have proven 2U on its own.** Logged as
**owner-evidence, not geometry-evidence**, so a future conflicting import can't be silently overruled.
MODEL-EXACT; boundary is the negated class (§18), **character-identical to the `.247` TYPE regex** —
type and height must mean exactly the same hosts. Also **struck `q3400-ra` from the U-table's
DELIBERATELY-ABSENT list**, which would otherwise still be claiming it needs a ruling.

## 2 · type `unknown` GOLD → **MAGENTA `#ff2bd6`** — the pdu collision is dead
PDU **keeps** the gold. `#ff2bd6` is the existing `--mag` brand token, not a new colour.
⭐ **John's "spine, legend, detail dots together" is STRUCTURAL, not three parallel edits:**
`TYPE_COLOR.unknown` is the **single source** for the tray spine (`:17957`), the `.type-dot`
(`:18413`) and the search-result label (`:18506`). **One value ⇒ they cannot drift apart.**
**There is no separate legend element in the Forge tray** — the `TLABEL` text beside each name is
`var(--dim)` grey for *every* type (not a colour key), so it stays untouched; colouring it would
change all 9 types, which John did not rule.

### ⛔ THE TRAP, AND THE COMMENT THAT NOW GUARDS IT
The gold in the tray's **hazard paint** (hatch, ⚠ name text, hard edge) is **NOT** type-unknown — it
is gated on **`unk` = `sl.hgtUnknown`** (see the `flagged` split: `conflict || overflow || hgtUnknown`).
**A find-and-replace on `#ffcb45` would have recoloured it and COLLAPSED the exact line `.246`/`.247`
exist to protect:** type-unknown draws **SOLID + TO SCALE** (the U-span IS true); the hazard means
**DO NOT TRUST THIS GEOMETRY.** Gold hazard and magenta type are now **two different signals on
screen — that is the whole point.** Also untouched: `--gold`, RACK MAP / KNOW `rf-card` accents,
BURNDOWN, `.va-i-type`, `.ctag b`.

## GUARD (both real masters, shipped fns vs the `.251` baseline)
**Exactly 448** hosts change height, **all `q3400-ra`**, `{u:null,known:false}` → `{u:2,known:true}`.
**Zero** other model moves. **ZERO TYPE DRIFT (0 / 6490).** **DFW02 completely unchanged.**
Boundary probes: `q3400-ra-x` · `xq3400-ra` · `q3400-rb` · `q3400` · `mqm8700-q3400-ra` → **all still
unknown.** `.246` invariants green, and **NO TWO TYPES SHARE A COLOUR — first time that has ever
been true.**
**HATCH: SPARKS 856 → 408.** DFW02 61 (unchanged).

## ⚠️ NEW ADJACENCY — FLAGGED, NOT HIDDEN
`unknown #ff2bd6` (magenta) now sits beside `storage #ff7bd0` (pink) — **distinct hex, same hue
family.** The gold collision is genuinely dead, but this may have **traded** it for a magenta/pink
pair. **John's eye on a real tray.** One-token change if he dislikes it.

## BATCH = 2 (`.251` + `.252`) · 4 slots left
⚠️ **`.251` device-verify is STILL OWED and UNWALKED** — *"i looked"* was an owner ACK, not an
itemized pass. `.252` checklist (A: q3400-ra solid/2U/no-hatch · B: magenta spine+dot+label together,
PDU still gold · C: a height-unknown host STILL gold-hatched · D: nothing prints `undefined`) is in
`version.json`.

## STILL OWED — JOHN'S RULING
1. DFW02's **empty-model** row @`c1:001:38` — the last unknown-**type** host on either master.
2. The **HEIGHT** of `fs-media-converter-chassis` (5).
3. The SPARKS height remainder, now top of the hatch list: **`gpu-b40-02` (160) · `cpu-gp2-01` (90) ·
   `cpu-gp2-08` (75) · `inf-med-01` (60) · `om2216-c14` (16)**. (DFW02: `VAST DBox` (50) still needs
   the 1U-Ceres-vs-2U-Lightspeed call.)
4. Whether the new **magenta-vs-storage-pink** adjacency bothers him.
5. 📥 **UNREAD:** `files (58).zip` → `HANDOFF-reh3d-rewire-REV2.md` · `PHANTOM-OPEN-BOARD-2026-07-14.md`.

---

# §25 — SHIP v1.14.253 · MEDIA CONV COLOUR CORRECTED (2026-07-14) · BATCH = 3
Green `#2ee6a8` → **SLATE `#7d93a4`**. One constant + the comment that misrecorded it. No logic, no
markup, no CSS, no classifier change. Live-confirmed (`local == live`).

## ⚠️ THE RECORD — I HAD IT WRONG IN THE SOURCE, AND THE SOURCE NOW SAYS SO
`.251` shipped MEDIA CONV green, and its comment **asserted John had DELEGATED the colour to me**
(*"you do whats best"*). **He had not.** He had already ruled it **in writing** —
`PHANTOM-OPEN-BOARD-2026-07-14.md` (rev 2, 09:15, against `.248`): *"new MEDIA CONV type → **slate
`#7d93a4`**"*. **That board was sitting UNREAD in `files (58).zip` when I picked green.** So I
recorded **a spec of his as a call of mine**, in the code. Both are corrected.

**How we know the board is his ruling and not a proposal:** the same line reads *"UNKNOWN → magenta
`#ff2bd6`"* — **character-for-character** what he later handed me verbatim and what `.252` shipped.
It even uses his phrase *"spine colors, legend, detail dots."* The board **is** the source.

### ⭐ LESSON — READ THE DROPPED ARTIFACT BEFORE CLAIMING A DECISION WAS DELEGATED
*"Do what's best"* is **not a grant of authorship when a written spec already exists.** I could not
have known that without opening the file — **so open the file.** (Sits beside the `.250` lesson:
*replay the real masters before shipping even a "self-evident" fix I flagged myself.*)

## AND SLATE IS BETTER ON ITS MERITS, INDEPENDENT OF WHO RULED IT
A media converter is **quiet infrastructure.** Green `#2ee6a8` (**L=0.610**) shouted at the same
volume as **GPU cyan** — it drew the eye to the least interesting device in the rack. Slate
(**L=0.279**) recedes, which is what that hardware should do. It still stays well clear of **patch
teal `#1fffd0`** — patch is the type it sits nearest conceptually, the pair a gloved tech is
likeliest to confuse at arm's length. **That separation was the one thing `.251` got right, and it
survives.**

## GUARD
`media == #7d93a4` (**byte-matches the board**) · **no two types share a colour** (still true, first
established `.252`) · every `_TMAP` value resolves to a defined `TLABEL` **and** `TYPE_COLOR` (`.246`
invariant — a miss prints the literal word `undefined` on a tray).

### ⚠️ THE ONE NEW RISK SLATE INTRODUCES — CHECKED, FLAGGED, NOT BLOCKING
The Forge tray paints **UNRACKED slots in a slate-grey of its own** (`#5a6b7d`), so a **RACKED** media
converter must not read as an **EMPTY** slot — *the honesty arc's own failure mode, inverted.*
**It does not: the two separate by ALPHA, not hue.** A racked spine paints at `globalAlpha 0.90`
(L=0.279); an unracked one lands at **~16% effective alpha** (`0.35` fill × `0.45` global, L=0.142,
near-invisible). **Readable in the maths — still the single thing to eyeball on a real tray.**
Noted, not blocking: `media` L=0.279 and `unknown` L=0.278 are near-identical in **luminance** —
they separate on **hue** (slate vs magenta), so they'd be indistinguishable in greyscale. **The type
LABEL differs on every row, so no information rides on colour alone.**

## BATCH = 3 (`.251` + `.252` + `.253`) · 3 slots left
⚠️ **`.251` AND `.252` device-verifies are BOTH still owed and unwalked.** Checklists in `version.json`.

## 📥 THE ZIP IS READ — `files (58).zip`
**`PHANTOM-OPEN-BOARD-2026-07-14.md`** — reconciles with our state, with two notes: (a) it calls the
rulings one ship (`.249`); on our line they landed as **`.249` (boundary) + `.251` (MEDIA CONV) +
`.252` (magenta) + `.253` (slate)**; (b) its **watch item on the magenta** — *"too loud on a dense
rack → one-constant revert, say so"* — is the **same** concern I raised independently about magenta
sitting beside storage pink. **Known risk, cheap to revert.**
Board also asks: **`pkey` / `metal-jump` — "real gear or true blanks?"** → **THE DATA ANSWERS: REAL
GEAR.** They are `net-6x100g-02`, typed **MEDIA CONV** since `.251`, 1U-known since `.242`.

**`HANDOFF-reh3d-rewire-REV2.md`** — reverse the `.236` retirement, rewire the solo-rack **FLAT|3D
toggle** (a distinct surface from FORGE; John-ruled). 3 edits, verified against `.248`; all `reh3d_*`
machinery **resident and unwired**; scene internals + GL cross-dispose guards **LOCKED**. The board
calls it *"the original mission"* and it has been **orphaned once** (its `.244` stamp was consumed by
MONOLITH PLATE). **Board says queue it right after the rulings verify clears ⇒ GATED ON JOHN'S DEVICE
PASS, not startable now.**

## STILL OWED — JOHN'S RULING
1. DFW02's **empty-model** row @`c1:001:38` — the last unknown-**type** host on either master.
2. **Heights:** `gpu-b40-02` (160) · `cpu-gp2-01` (90) · `cpu-gp2-08` (75) · `inf-med-01` (60) ·
   `om2216-c14` (16) · `fs-media-converter-chassis` (5) · DFW02 `VAST DBox` (50 — 1U-Ceres vs
   2U-Lightspeed) · `net-ufm-05` (needs the network engineer).
3. Does the `.252` **magenta read too loud** on a dense rack? (The board's own watch item.)
4. Does a **racked slate MEDIA CONV** read as a real device, not an empty slot? (`.253-B`.)

---

# §26 — SHIP v1.14.254 · reh3d FLAT|3D TOGGLE REWIRED (2026-07-14) · BATCH = 4
**The `.236` retirement is REVERSED** (John's ruling, standing since 2026-07-12). Executes
`HANDOFF-reh3d-rewire-REV2.md` — the OPEN BOARD calls it **"the original mission"**, and it had been
**orphaned once** (its `.244` stamp was consumed by MONOLITH PLATE). **Now landed.**
Three edits, all inside the **rd branch**. **No CSS** (every `.reh-3d-*` rule was already resident),
no new function, **no scene-internals change.** Live-confirmed (`local == live`).

## WHY `.236`'s REASONING NO LONGER HOLDS — argued, not asserted
`.236` retired the toggle on two grounds. Both are answered:
1. **"One door per feature"** — **NOT ENGAGED.** The solo-rack 3D inspect view is a **DISTINCT
   SURFACE** from the FORGE aisle: **FORGE walks a ROW; this is ONE RACK on the bench.** Two
   *features*, not two doors onto one. **John's call, and his to make.**
2. **"Two 3D views compete for the single GL context"** — answered by machinery that **already
   exists and is unchanged**, and ⭐ **I VERIFIED IT RATHER THAN TRUSTING THE HANDOFF'S CLAIM: the
   guards are SYMMETRIC IN BOTH DIRECTIONS.** `rackElevation_render3D` disposes a live
   `_forge3dActive` (`:31752`, added `.222`); `forge3d_open` disposes a live `_reh3dActive`
   (`:31676`). `_reh3dActive` bounds live contexts to exactly **1**. **A dual-GL crash has no path.**

## THE THREE EDITS
- **EDIT 1 · re-emit the toggle + the 3D mount.** ⭐ **PLACEMENT WAS THE ONE REAL DECISION, and the
  handoff punted it to device-verify** (*"if the toggle breaks the canvas/minimap flex split, emit it
  full-width BEFORE the container instead"*). **The CSS decides it outright — no guessing, no phone
  needed:** `.rack-hybrid` is `display:flex; align-items:stretch`, so a toggle emitted as its **child
  becomes a THIRD FLEX COLUMN** and shreds the 85/15 canvas/minimap split. **⇒ emitted full-width
  BEFORE `.rack-hybrid`.** `#reh3dMount` rejoins as a sibling of `#rehFlatWrap` — **safe while FLAT**,
  because `.reh-3d-mount` is `display:none` until `.is-3d`, and `#rehFlatWrap` is `display:contents`,
  so the fitted flat elevation lays out **exactly as today**.
- **EDIT 2 · restore the session pref** in the rAF block, **AFTER `rackFlat_applyFit`** so a restored
  3D view can never race the flat fit. ⚠️ **NON-OBVIOUS AND LOAD-BEARING:** `reh3d_restore()` **also
  sets `window._reh3dRack`, which `reh3d_setMode()` READS.** So the call is **NOT optional when the
  pref is off** — without it the **FIRST tap on 3D would render a rack of `undefined`.**
- **EDIT 3 · the `.236` comment is ANNOTATED, NOT DELETED** (re-home law): the reversal is argued
  **in place**, so the next reader sees both the retirement and why it was overturned.

**LOCKED / UNTOUCHED per spec:** `rackElevation_render3D` internals · the tray raycast →
`openRmDevice(dev)` wiring · the orbit-drag threshold · the GL cross-dispose guards · FORGE · legacy.
**FLAT stays the INSTANT DEFAULT**; 3D is a **per-session opt-in** (`REH3D_PREF_KEY`), never
auto-entered on a cold open; three.js lazy-loads on the first 3D tap only.
**`?legacy=1` byte-identical BY CONSTRUCTION** — every new emission is inside `if (_rehRd)`, and
`reh3d_setMode()` is unreachable in the legacy house (no `#reh3dCanvasHost` to find).

## ⚠️ NOTED, NOT FIXED — a hard-rule-#1 shape this rewire RE-ANIMATES
`reh3d_setMode()` opens with **`if (!host) return;`** — a **silent return on a user-facing path**,
the exact shape hard rule #1 forbids. It is **unreachable in practice** (the buttons and
`#reh3dCanvasHost` are emitted in the same render pass, so the host cannot be missing while a button
exists) — but **this ship makes that code LIVE again after 18 dormant stamps.** Deliberately **NOT**
patched inside a spec'd rewire (that would be the drive-by ship discipline forbids). **Flagged for a
future hardening ship.**

## 🔧 CORRECTION TO THE `.254` COMMIT MESSAGE (not the code)
The commit body lost one code snippet: **backticks in the message ran as a shell subshell**, eating
the `if (!host) return;` fragment (`bash: undefined: command not found`). **The CODE IS UNAFFECTED**
and the full note survives **intact in `version.json`**, which is the real audit record. **Not
force-pushed** — rewriting pushed history on `main` is a genuine risk while a second build line
exists, and the loss is cosmetic. **Corrected here instead.**
**LESSON: single-quote or heredoc a commit body that contains code.**

## BATCH = 4 (`.251` · `.252` · `.253` · `.254`) · 2 slots left
⚠️ **ALL FOUR DEVICE-VERIFIES ARE OWED AND UNWALKED.** The OPEN BOARD's own §6 holds the
one-unverified-ship rule and calls the 7-deep freeze *"Sunday's lesson."* **John directed this ship
explicitly with the verifies outstanding — his call to make, recorded here so the trail is honest.**

### DEVICE-VERIFY (John, iPhone) — `.254`
- [ ] Rack detail opens **FLAT INSTANTLY**, identical to today — no regression, no flash of 3D.
- [ ] **FLAT|3D toggle visible ABOVE the elevation**, and it does **NOT** break the canvas/minimap
      split. *(This is the placement call — if it reads wrong above the container, it is a one-block move.)*
- [ ] Tap **3D** → three.js lazy-loads, the solo rack renders in its locked framing.
- [ ] **Tap a tray in 3D** → the flat device detail opens. **An ORBIT DRAG does NOT trigger it.**
- [ ] Toggle back to **FLAT** → GL disposed clean → open **FORGE** → **no dual-GL crash.**
      **Then the reverse: FORGE first, back out, tap 3D** — both directions are guarded, both worth a tap.
- [ ] **Kill + relaunch the PWA** → pref is PER-SESSION, so it must return **FLAT**, not 3D.
- [ ] **`?legacy=1`** → toggle absent, rack detail unchanged.

## STILL OWED — JOHN'S RULING (unchanged by this ship)
DFW02's empty-model row @`c1:001:38` · heights for `gpu-b40-02` (160) · `cpu-gp2-01` (90) ·
`cpu-gp2-08` (75) · `inf-med-01` (60) · `om2216-c14` (16) · `fs-media-converter-chassis` (5) ·
`VAST DBox` (50) · `net-ufm-05` · does the `.252` magenta read too loud on a dense rack · does a
racked slate MEDIA CONV read as a real device rather than an empty slot.

---

# §27 — SHIP v1.14.255 · THE INSPECTION BAY (2026-07-14) · BATCH = 5
The `.218` wireframe rack scene behind the FLAT|3D toggle is **replaced by the John-locked
Inspection Bay**. Executes `HANDOFF-INSPECT3D-BAY-PORT.md` against `mocks/MOCKUP-INSPECT3D-BAY-LOCKED.html`
(both committed to `/mocks/` this session). Live-confirmed (`local == live`).

## PART 1 — THE HOIST (3 edits)
`TYPE_COLOR` / `TLABEL` / `_TMAP` moved from inside `forge3d_render` to **module scope**. Values
**byte-identical** to `.254`; scope only widened. ⭐ This is the STRUCTURAL reason the Bay can obey
§E ("never contradict the elevation"): the Bay and the Forge tray now read **one** map, so the next
colour John rules moves both at once — the `.251→.253` media drift cannot recur.

## PART 2 — THE PORT (1 spliced block; interaction/orbit/raycast/scrub/teardown kept verbatim)
Fresh scene+renderer+camera (alpha, ACES, **exposure 1.1**, sRGB, **FOV 28** locked framing, env
cubemap not solid bg) · **§A locked light rig verbatim** · **§B** chrome-black structure + procedural
env (`envMapIntensity 0.25`) · Master-driven trays · all nine **§D** bay elements · **§C** highlight
band with the **RESTORED edge box**.

### ⭐ §C EDGE BOX REVERSES AN EARLIER RULING
The bright edge box was previously removed; **John reversed that** (§C). Recorded per §C's own instruction.

### ⚠️⚠️ ONE DELIBERATE DEVIATION FROM THE LOCKED MOCK — JOHN'S CALL
The mock's chrome-black finish repaints **every tray piano-black** (`0x0c0f14`), which would **erase
the type colours** ruled across `.251`–`.253` (magenta UNKNOWN, slate MEDIA CONV, gold PDU). §E
requires the bay to **show** type colour and never contradict the elevation — the two can't both hold.
**Resolution: chrome black → rack STRUCTURE only; TRAYS keep type colour** (it is *information*, not
finish — the whole `.238`→`.253` arc is about that colour meaning something). Full piano-black trays
are a **one-flag change** but would bury four ships of rulings, so **not shipped without John's word.**
`hgtUnknown` trays get the **gold hazard hatch in 3D** (echo of FLAT); distinct from an UNKNOWN *type*
(magenta); both can co-occur — correct.

### GL DISCIPLINE (verified, not assumed)
Reuses the socket's untouched teardown → symmetric cross-dispose with `forge3d_*` (`:31752` / `:31676`),
one WebGL context ever. The mock's **three** rAF loops (`animBay`/`hlPulse`/`animSweep`) **collapse
into one `bayTick(now)`** called from the socket's single `loop()`, so nothing survives dispose.
`bayDispose()` frees every CanvasTexture + the env CubeTexture (`material.dispose()` won't).
**§F:** pixelRatio≤2; reflection clone gated `BAY_REFLECT` (auto-off >DPR 2.1, the pre-approved
fallback); motes 220→120 >DPR 2. **This ship: reflection SHIPPED** at DPR≤2.1.

## 🐞 NOTED, NOT FIXED — a PRE-EXISTING bug the port surfaced (owed its own ship)
The FLAT rack-elevation CSS is keyed on the **EDP vocabulary** (`switch`/`pdu`/`storage`/`compute`…),
but `master_rackToElevation` emits `master_hostType` **RAW codes** (`sw`/`pwr`/`stor`/…). Their
intersection is **only `gpu`** → on a Master-loaded rack **the FLAT elevation colours GPUs and leaves
everything else default-styled.** The Bay (via `_TMAP→TYPE_COLOR`) is **more correct than FLAT** until
that lands, so **3D and FLAT will DISAGREE on non-GPU colours** — that disagreement is the *elevation's*
bug, **not** the Bay's. Recorded so it is not mistaken for a `.255` regression.

## GATES / BATCH
`node --check` ×4 + sw.js · CSS 3856/3856 · CRLF preserved · UTF-8 box-draw round-trip verified ·
single-definition check (scene/camera/renderer/canvas/fitDist/rackGrp/trayMeshes/hlBand each ==1) ·
old `.218` `trayHex`/FOV-32 gone · three-stamp lockstep. **`?legacy=1` byte-identical** (`render3D` is
reachable only via the rd-gated 3D toggle).
**BATCH = 5** (`.251`–`.255`). `.251`–`.254` verifies **cleared by John** ("all good" → "build it")
BEFORE this ship; **`.255` is a NEW unverified ship**, cap is 6 — **one slot left** before a hard pass.
Full 12-point device-verify checklist [A]–[L] in `version.json` (the deviation is item **[G]**).

## STILL OWED — JOHN'S RULING
DFW02 empty-model row @`c1:001:38` · heights (`gpu-b40-02` 160 · `cpu-gp2-*` 165 · `inf-med-01` 60 ·
`om2216-c14` 16 · `fs-media-converter-chassis` 5 · `VAST DBox` 50 · `net-ufm-05`) · does `.252` magenta
read too loud · **NEW:** the FLAT-elevation EDP-vocabulary colour bug (its own ship) · **the [G]
deviation:** type-coloured trays vs the mock's piano-black.

---

# §28 — DEVICE-VERIFY RESULT (John, 2026-07-14): the `.255` [G] deviation is RATIFIED
**No ship. A ruling + a partial verify, recorded.** John, on device: *"keep trays type-colored,
magenta unknown looks right."*

## WHAT THIS SETTLES
1. ⭐ **The `.255` [G] deviation is now JOHN'S DECISION, not my provisional call.** Trays keep their
   **type colour**; the mock's uniform piano-black finish is **rejected**. The `.238`→`.253` honesty
   arc wins over the mock's look — colour carries information. **Do NOT switch trays to piano-black
   in any future session** — that is now a ruled-against change, not an open question.
2. **`.252` magenta UNKNOWN is DEVICE-VERIFIED** — reads right on real hardware. The pdu/unknown
   collision fix is confirmed good on-device.

## ⚠️ WHAT THIS DOES *NOT* SETTLE (do not over-claim — the "i looked ≠ itemized pass" discipline)
John spoke to **trays + magenta only.** The rest of the `.255` checklist is **still unwalked**:
[A] flat-default/live-trays · [B] rig-matches-mock · [C] scan wave climb · [D] scrub band · [E] rack
reads as the star from every angle · [F] tap-tray→detail vs orbit-drag · [H] gold hatch on an
hgtUnknown tray in 3D · [I] the GL pass BOTH directions (FLAT→FORGE, FORGE→3D) · [J] on-device frame
rate / reflection clone · [K] cold PWA relaunch · [L] `?legacy=1`. **[I] and [J] especially still owe
a pass** — a WebGL context leak or a frame-rate cliff won't show in "the trays look right."

## HOUSEKEEPING
The `.255` code comment still reads *"not shipped without a ruling."* **Intentionally left** — no
comment-only stamp bump (no churn). **The ruling lives here in §28; fold the comment update into the
next ship that touches `dct-ios.html`.** BATCH still = 5 (`.251`–`.255`); cap 6, **one slot left.**

## STILL OWED — JOHN'S RULING (unchanged)
DFW02 empty-model row @`c1:001:38` · heights (`gpu-b40-02` 160 · `cpu-gp2-*` 165 · `inf-med-01` 60 ·
`om2216-c14` 16 · `fs-media-converter-chassis` 5 · `VAST DBox` 50 · `net-ufm-05`) · the FLAT-elevation
EDP-vocabulary colour bug (its own ship) · **the rest of the `.255` verify, especially [I]/[J].**

---

# §29 — DEVICE-VERIFY (John, 2026-07-14): `.255` [I] GL cross-dispose CONFIRMED (FORGE→3D)
**No ship.** John, on device: *"toggled FORGE then 3D, no crash."*

⭐ **This clears the single highest technical risk of the reh3d/Bay arc.** FORGE→3D is the demanding
direction: opening the Bay while a FORGE WebGL context is live forces `rackElevation_render3D` to
dispose `_forge3dActive` (`:31752`). **No crash = that dispose fired and only one GL context was ever
alive.** The Bay's new renderer + teardown do not leak a context. `bayDispose()` + the symmetric
cross-dispose work on real hardware.

## VERIFIED SO FAR ON `.255`
[G] trays type-coloured (ruled, §28) · magenta unknown (§28) · **[I] FORGE→3D GL pass (this turn).**

## STILL WORTH A TAP (not blocking, but honestly still unwalked)
- **[I] reverse direction 3D→FORGE** — opening FORGE disposes `_reh3dActive` (`:31676`); same guard,
  opposite way. The high-risk direction is done; this one is lower-risk but not literally observed.
- **[J] on-device frame rate** — the Bay is heavier than the `.218` scene (shadows, motes, reflection
  clone). If it drags, `BAY_REFLECT`/`MOTE_COUNT` auto-scale by DPR, but John's read is the ground truth.
- [C] scan-wave climb · [E] rack-as-star-from-every-angle · [H] gold hatch on an hgtUnknown tray in 3D
  · [K] cold PWA relaunch · [L] `?legacy=1`.

BATCH still = 5 (`.251`–`.255`), cap 6, **one slot left.**


# §30 — SHIP v1.14.256 · PORT THE RACK (real hardware) (2026-07-14) · BATCH = 6 (AT CAP)

**Handoff:** `mocks/HANDOFF-INSPECT3D-RACK-PORT.md` (committed this ship) · **Visual truth:** `mocks/MOCKUP-INSPECT3D-FINAL.html` (committed this ship). Live == local == **v1.14.256** (Pages served, verified).

**Why:** `.255` shipped the BAY faithfully but rebuilt the RACK from scratch — one `BoxGeometry` chassis + one sphere LED per unit, rear = two "hint cylinders." On John's device it read as **coloured shelves on posts** — the exact failure the port existed to prevent. §1's RULE for this ship: **port the mock VERBATIM**, change ONLY the data source (live Master slots, not the mock's GB300 `ZONES`) + add `envMapIntensity 0.25`.

**What landed (one spliced block replacing the `.255` improvised rack, between the frame build and `scene.add(rackGrp)`; frame + entire bay UNTOUCHED, §4):**
- **Interior by kind (§1a/§3):** compute = 2 NIC + 2 OSFP + 8 drive bays (ONE `InstancedMesh`) each w/ green LED + BF3 + status + ears · switch = 2 blocks + 4×10×2=80-port grid (ONE `InstancedMesh`) + ~50% violet port LEDs + status · power = 6 PSU + 6 fan + 6 green LED · generic (patch/media/storage/unknown) = chassis + one status LED, **NO invented hardware** (§3 zero-fabrication).
- **Rear assembly (§1b):** cartridge, 2 **copper** bus bars, top+bottom manifolds + 3 vertical pipes, 6 cable arms, rear door — mock geometry + materials verbatim + env .25. Replaces the two hint cylinders.
- **Cables (§1c):** `createCable` + every mock call, ported verbatim, **hidden by default**; **new CABLES toggle** injected into the 3D control strip (`#reh3dBtnCables`, `.reh-3d-seg` styling) — owns `cableMeshes` directly (no window global), created only while 3D is live, **removed in `teardown()`**. Bounded to `[1,totalU]` so the mock's hardcoded GB300 rows can't float off a shorter rack.
- **Side panels + feet** (omitted in `.255`) added per mock.
- **Chassis stay TYPE-colour** (§3 + the `.251`–`.253` honesty arc); **hgtUnknown gold hatch** unchanged.

**§2 RULING RECORDED (owed-item DONE):** the `.255` flagged tray deviation is now resolved in the in-code comment (~L31779) with John's device ruling — *"keep trays type-colored, magenta unknown looks right"* — type-colour trays **LOCKED**, piano-black ruled AGAINST.

**⚠️ TWO HANDOFF-INTERNAL CONTRADICTIONS — resolved toward the MOCK per THE RULE, FLAGGED loud in-code (~L31858 header) + top of device-verify. BOTH are 1-edit flips:**
- **(A) REAR FINISH:** §1b/§1d/§7 say port the rear materials verbatim (copper bus bars, green cartridge); §2 says chrome-black the rear assembly/cartridge/door. The mock + §7's *"the rack looks the SAME as the mock side-by-side, any visible gap = fail"* bar OUTWEIGH §2's one clause → **rear ported VERBATIM (COPPER visible).** Swap 4 rear mats to CHROME if John rules §2.
- **(B) EARS:** the mock CODE builds rack ears on **COMPUTE** units (mock L555-562); §1a/§7 TEXT lists them under switch → **ported on COMPUTE** (mock is reference truth). Move the ear block to the switch branch if John rules switch.

**§5 budget:** shared materials (created once, reused — mock re-allocated per unit) · `InstancedMesh` for the two dominant box-repeats (compute drives 8→1 draw/unit, switch ports 80→1 draw/switch) · LEDs share 2 group-blinked `MeshBasic` materials driven in `bayTick` with scratch `setRGB` — **no per-frame `Color` allocation** (mock did `new THREE.Color()` per LED per frame). Est. ~500-700 meshes on a populated 42U rack; **actual count + on-device FPS = John's read (§7 [12]).**

**GL discipline (unchanged, verified):** `teardown()`'s `scene.traverse` disposes every ported geometry+material (`InstancedMesh` included); `bayDispose` frees env cubemap + CanvasTextures; symmetric `_forge3dActive`/`_reh3dActive` cross-dispose (`:31752`/`:17676`) untouched — one WebGL context ever.

**Gates:** node --check 4 inline + sw.js PASS · CSS **3857/3857** (was 3856; +1 = the single `.reh-3d-cables` rule §6 anticipated) · CRLF preserved (bare-LF 0) · latin1 byte-splice round-trip clean · `InstancedMesh` count 2 · exactly 1 `scene.add(rackGrp)` · old "rear cooling/manifold hint" gone · three-stamp lockstep `.255`→`.256`. **`?legacy=1` byte-identical** (render3D reachable only via the body.rd 3D toggle; the one CSS rule is body.rd-scoped).

**STILL NOTED, NOT FIXED (owed their own ships):** (1) FLAT rack-elevation CSS keyed on EDP vocab while `master_rackToElevation` emits RAW `master_hostType` codes — intersection only `gpu` → FLAT colours only GPUs on Master racks; the 3D rack is MORE correct, so 3D↔FLAT DISAGREE on non-GPU colour = the elevation's bug. (2) `reh3d_setMode` opens `if (!host) return;` — hard-rule-#1 silent return, re-animated by the `.254` rewire, flagged for a hardening ship, deliberately NOT drive-by patched.

**BATCH = 6 (`.251`–`.256`) — AT THE 6-CAP.** `.251`–`.254` cleared by John; `.255` device-verified [G]+[I]; **`.256` is NEW/unverified.** A **consolidated device pass is owed before ANY further ship.** Device-verify checklist (13 items + the two FLAG-FIRST deviation questions) is in `version.json`. **PARKED at the device-verify HARD STOP.**


# §31 — SHIP v1.14.257 · TRAY FIDELITY (dark chassis + type-colour accent + interior library) (2026-07-15) · BATCH stacks to 7

**Handoff:** `mocks/HANDOFF-INSPECT3D-TRAY-FIDELITY.md` (committed this ship). Live == local == **v1.14.258** (this + §32 pushed together; Pages served, verified).

**Root cause it fixes (John device-verified `.256`, saw it):** the `.256` dense rack read as **coloured slabs**, not the mock. OODA-proven cause (the handoff correctly pins it on the PREVIOUS handoff's §3 text, not the executor): `.256`'s chassis material painted the whole box in saturated `TYPE_COLOR` hex where the mock uses a **dark gunmetal per-kind palette**.

**JOHN'S RULING THIS IMPLEMENTS (verbatim intent, 2026-07-15):** *"Interior detail is a TYPE SIGNATURE, not a spec sheet."* A patch panel looks like a patch panel without claiming exactly 24 ports; the SAME renderer must make ANY rack look like the mock; featureless boxes over real gear = BLANK over real gear = forbidden.

**EDIT A — chassis palette restored, TYPE colour demoted to accent:** chassis `color/emissive = KIND_C[kind]` (compute 0x1a2332 · switch 0x1e293b · power 0x1a2028 · blank 0x0f141c · patch 0x18222e · media 0x161d26 · storage 0x141c26 · generic 0x121a24). TYPE colour (`hex`, unchanged from `.256`) moves to a **front bezel strip** (`PlaneGeometry(cw*0.92, min(hT*0.14, uH*0.20))`) on every non-blank tray — the glance-readable honesty channel. **UNKNOWN additionally gets a magenta `0xff2bd6` chassis outline** (unmissable at arm's length, .251 arc); gold hgtUnknown hatch coexists (height-unknown ≠ type-unknown). Blank = mock ghost (0x0a0f14, opacity 0.4, no strip). Raycast/userData/`.256` LEDs unchanged.

**EDIT B — interior library (no BLANK over real gear):** routing extended — patch→patch, media→media, storage→storage, unknown→generic, server stays compute. Signatures (dark blocks, shared materials, InstancedMesh for repeats): **patch** = 2 rows × 16 port squares (InstancedMesh 32) + teal LED every 4th port; **media** = 6 converter bricks + green LEDs + shelf lip; **storage** = 10 vertical drive blades (InstancedMesh) + green LED each; **generic (unknown)** = dark chassis + magenta strip + magenta outline and **nothing else** (the `.256` generic status-LED REMOVED — zero invented hardware). All signatures are decoration keyed to TYPE, never a count claim (John's ruling).

**STANDING RULINGS RATIFIED by John this handoff (my `.256` flags):** (1) **REAR FINISH VERBATIM — copper bus bars / green cartridge CONFIRMED**; the side-by-side bar is the law, the §2 chrome-rear text is DEAD. (2) **RACK EARS ON COMPUTE per the mock — CONFIRMED.** (He may still flip either at device-verify; until then ruled.) This closes the `.255`/`.256` fidelity arc.

**Gates:** node --check 4 inline + sw.js PASS · CSS **3857/3857 UNCHANGED** (handoff expected NO CSS — the strip/outline are geometry) · CRLF preserved · three-stamp `.256`→`.257` · **`?legacy=1` byte-identical** (all edits inside `rackElevation_render3D`, body.rd-only).

# §32 — SHIP v1.14.258 · SITE-PROFILE CLASSIFIER FIX (EDIT C micro-ship, own stamp/own verify) (2026-07-15)

**One edit, `site_derivePlatformsFromMaster` (~L22612).** BUG: role derivation used the EDP/CSV classifier (`deploy_extractGpuType`/`deploy_classifyDevice`/`deploy_inferDeviceRole`), which doesn't recognise the sn2201/sn3420/cm8148/om switch families — Site Profile showed them as **OTHER** while `master_hostType` (the Master-path classifier, .247+) already types them `sw`. FIX: `role = _TMAP[master_hostType({model})]`, fall back `'other'` only when that yields `'unknown'` (`master_hostType` reads `.model`, verified L29416; `_TMAP` module-scope since .255). Now the Site Profile agrees with the 3D rack + FLAT elevation — **one hostType source across all three surfaces.** Scope = classifier path ONLY; the larger profile redesign (running list, no poison pill, no fake deletes) stays in Ship-2. EDP helpers keep their other callers (no dead code). Gates green; NO CSS; three-stamp `.257`→`.258`; `?legacy=1` byte-identical. **Independent surface from the 3D-rack batch — own one-line verify (Site Profile → sn/cm/om families show SWITCH).**

**BATCH state:** the 3D-rack batch is now `.251`–`.257` (7 stacked, well past the 6-cap); `.258` is a separate surface. John device-verified `.256` (found the slab defect → `.257`; ratified rear/ears) and directed `.257`+`.258` in one handoff drop — recorded honestly, his call. **A consolidated device pass on the 3D rack is owed.** PARKED at the device-verify HARD STOP.


# §33 — SHIP v1.14.259 · INSPECT-3D FOG (one-line fidelity fix) (2026-07-15)

**John-directed one-liner.** The mock (`MOCKUP-INSPECT3D-FINAL.html` L327) declares `scene.fog = new THREE.FogExp2(0x030508, 0.008)`; the `.255` bay port explicitly DROPPED it (scene comment said "no fog" — the mistake). John's parameter audit: everything else in parity, so the missing fog is why `.258` read **washed out** where the mock reads **deep-black**. Two edits in `rackElevation_render3D`: add the fog right after `var scene = new THREE.Scene()`; clear `scene.fog = null` in `bayDispose` (FogExp2 has no dispose — null is the teardown, per John's note). Applies only to the reh3d bay scene (:31801); the forge3d scene (:17777) untouched. Gates green; NO CSS; three-stamp `.258`→`.259`; `?legacy=1` byte-identical. Live == local == **v1.14.259** (served, verified). **3D-rack consolidated device pass still owed; parked.**


# §34 — SHIP v1.14.260 · RACK STRUCTURE (perforated rails + U-ticks; sparse racks read as racks) (2026-07-15) · ENDS THE MOCK-FIDELITY ARC

**Handoff:** `mocks/HANDOFF-INSPECT3D-RACK-STRUCTURE.md` (committed). Live == local == **v1.14.260** (served, verified).

**⚠️ NEW GEOMETRY, NOT A PORT — recorded so no future session "corrects" it out.** The mock has NO perforation and NO per-U rail detail; rails/perforation/ticks are additions, **John-approved 2026-07-15.**

**Why:** John saw the app as a "glass display case" next to the mock. OODA root cause (NOT a render defect): the mock renders a GB300 NVL72 (46U declared hardware); the app rendered **s1:001 / US-SPK03**, a SPINE rack — the SPARKS Master holds s1:*/s3:* spine racks ONLY, no compute cabinets — **s1:001 is 48U with 8 devices. It looks empty because it IS empty.** No renderer change puts 38 devices into a rack the Master says has 8. But a real 48U spine rack with 8 switches still reads as a rack because ~40U of mounting rail + square-hole perforation are physically there, and PHANTOM drew none of it.

**DOCTRINE (John-ruled, verbatim — the whole design rests on it): "RAILS ARE THE RACK. BLANKS ARE HARDWARE."**
- Master states totalU → totalU of rail/perforation/U-position exist → drawing them declares NOTHING the Master didn't. **Permitted.**
- Master does NOT say "blank at U15" → a blanking-panel face there CLAIMS a U is filled (tells a Day-0 tech to pull a panel that isn't there) = BLANK over an undeclared U = same family as BLANK over real gear (.246-.251 Unified Law). **Forbidden.**
- A Master-**declared** blank is data → renders as ghost hardware (EDIT C). An undeclared U → rails + perforation + back panel, **never a panel face.**

**EDIT A — perforated rails (canvas texture, not geometry: 48×3×4=576 hole meshes would kill an iPhone):** the two ported 0.08 front verticals → four rails `BoxGeometry(0.17, RH-0.5, 0.09)` (x/z kept exact, body CHROME), + two REAR rails at `z=-(RD/2-0.24)` (depth through empty U at ISO; front-only is a 1-entry delete). Perforation = ONE shared `CanvasTexture` (32×64 U-tile, 3 EIA-310 holes + machined lip), `repeat.set(1, totalU)`, on the **front face only** via a 6-slot material array (index 4 = +Z front, 5 = -Z rear); pushed to `_bayTex`. **`repeat.y = totalU` is load-bearing** — hole pitch must land on U boundaries or a tech miscounts; **falls back to plain CHROME if totalU falsy** (fail honest, never a wrong pitch).

**EDIT B — U-ticks:** every 5U on the inner front-rail face, `PlaneGeometry(0.05,0.012)` slate `0x7d93a4` opacity 0.5 at `yFor(u)`. Ticks only, NO numerals (MINI strip carries numbers). First to go if FPS moves.

**EDIT C — declared blanks = hardware:** blank branch uses the mock ghost recipe verbatim (0x0a0f14 · metal .4 · rough .85 · opacity .4 · env .25 · no strip/interior). **⚠️ UNREACHED on current Masters** — `master_hostType` has no 'blank' output (the `deploy_classifyDevice` 'blank' is the EDP/CSV path, not this one), so `disp` is never 'blank'. Forward-correct only; fires for no current data. **The doctrine holds automatically:** an undeclared U has no slot → no mesh → rails + back panel, never a face. NO classifier rule was invented to synthesize blanks (no evidence; the .238 guess the honesty arc kills). **The owed DFW02 empty-model row @c1:001:38 ruling may be the signal that makes a declared blank reachable — EDIT C is ready for it.**

**Mesh delta:** ~+18 objects + 1 texture (negligible). Gates green; **CSS 3858/3858 UNCHANGED** (no CSS — verified the diff touches zero `<style>` content; the .257 "3857" was a stale absolute, HEAD .259 was already 3858); railTex disposed via `_bayTex`; three-stamp `.259`→`.260`; `?legacy=1` byte-identical; forge3d untouched.

**CLOSING (handoff, for the record): this ENDS the mock-fidelity arc.** The renderer now matches the mock; the remaining difference between John's two screenshots is **which Master is loaded** — a GB300/HGX Master renders like the mock because that's the rack the mock was built from. **Future "doesn't match the mock" reports run the mechanical parameter diff FIRST (scene/lights/materials, all deltas at once), spot-fix second** — three ships (.257/.259/.260) went to one-variable-at-a-time hunting a 30-second audit catches. **3D-rack consolidated device pass still owed; PARKED.**

---

# §35 — RECON (NO CODE SHIP): SPARSE-RACK-CLEAR PRO mock scoped; verify-first plan set (2026-07-15)

**No code shipped.** John dropped `Downloads/PHANTOM-SPARSE-RACK-CLEAR.html` (716KB; end of today's `MOCKUP-SPARSE-RACK-TUNER` → `-5/-7/-8` → `CLEAR` lineage; **NO companion handoff .md — I author the plan**). John said **"do whats best."** Per the §25 lesson (*"do what's best" is NOT a blank grant when discipline/gates exist*) + ship-rule #6 (device verify = hard stop, I can't do it), that = **execute the recon's recommended plan WITHIN the gates, NOT override the hard stop.** Mapped by a 6-agent recon workflow (2 agents died mid-stream → synth made confident-negative errors → the adversarial critic caught them; param/geometry half is source-verified and solid, mechanic inventory was corrected).

## THE MOCK IS PORT-AWARE, not desktop chrome
Touch handlers + explicit `// PHANTOM PORT: tap = hover+select on touch`; thermal/cables/holo already stripped by web-Claude with `"no telemetry source"`. This is the next 3D-rack vision, not a desktop toy.

## PARAMETER DIFF (the §34 mechanical-diff-first, DONE) — "doesn't match the mock" = LIGHT, not geometry
App bay is **1.5–7× darker per light source + 22% lower exposure + 2× denser fog** than this mock:
exposure **1.1 vs 1.42** · ambient **0.04 vs 0.16** · key **0.78 vs 1.18** · fill **0.10 vs 0.48** · rim **0.42 vs 0.78** · glow **0.08 vs 0.55** · underGlow **0.14 PURPLE vs 0.55 CYAN** · fog **0x030508@0.008 vs 0x020407@0.0040**.
⚠️ The app's darker rig MAY be intentional (protects the thin type-colour bezel strips) — **VERIFY on device before auto-brightening.** ⚠️ The `.259` fog "port" targeted `MOCKUP-INSPECT3D-FINAL`, NOT this SPARSE mock — **`0.008→0.0040` is an OPEN reconcile, not a proven mislabel** (critic caught the over-claim; changing it could REGRESS the FINAL-mock match).

## THE SPARSE-CLEAR CORE = GHOST-SLOT GRID (the app does NOT have it)
For every empty U the mock draws a dim RECESSED DEVICE-WIDTH bay: width = chassisW, height = uH*0.88 (**the ~0.12 seam IS the perceived U-rhythm**), depth = RD*0.16 pushed to z=-RD*0.16 (rear shelf), color 0x0a121a opacity 0.22 depthWrite:false, **ABSENT from unitRegistry (uncounted/untappable)**. 8 bright + ~40 dim recessed bays = a rack that reads mostly-empty-but-**present**. The app answers empty-U DIFFERENTLY — `.260` perforated CHROME rails, an **APP INVENTION with ZERO mock ancestor** (the mock's rails are plain steel). ⭐ **DOCTRINE TRIPWIRE:** the ghost bay is doctrine-safe ONLY if all 4 honesty props hold simultaneously (recessed + shallow 16% + dim 0.22/depthWrite-off + uncounted). Drop any one → flush/opaque/full-depth → it becomes a blank FACE on an undeclared U = **§34 violation.** Port whole or not at all.

## OTHER MECHANICS (inventory, source-verified)
- **FAULT mode** (L1692) — most on-brand, but a **DEMO**: picks a RANDOM racked unit, **INVENTS** a fault (chassis 0x3a1515 + emissive 0xef4444, 40 smoke spheres, auto-opens card). The red **OVERWRITES type colour** (`userData._faultColor`). Value ONLY if wired to **real status** (field-verify / node-status), never random, and as an OVERLAY that preserves type colour. **Needs a data-source ruling.**
- **PHANTOM mode** (L1633) — X-ray: occupied chassis → opacity 0.28 + 12 additive data-flow tubes (teal/purple). An occupied-gear reveal, **NOT** a sparse-clear competitor.
- **Interactive U-MAP** (L1606) — drag-to-scan scrubber + **bidirectional 3D sync** + arrow stepping. The app has only a STATIC MINI strip → real functional gap.
- **Camera presets + tap-to-focus** (pickView L2209 / focusSelectedUnit L1373) — front/side/iso/reset + center-the-tapped-unit. Small, useful gloved UX.

## ⚠️ TRAP CONFIRMED — palette collision in the UI/LEGEND layer (NOT the chassis)
Chassis are near-black (clean, no collision). BUT the mock's legend/U-Map colour map COLLIDES with the honesty arc: power **#f59e0b ≈ pdu gold #ffcb45** · compute **#00d4aa ≈ patch/gpu** · switch **#a855f7 ≈ switch violet #8a4bff** · tor **#3b82f6 ≈ server**. **Do NOT port the coloured U-Map/legend — keep the arc, drop the mock palette.** (Fault/phantom LED/light hues are safe as sub-pixel LEDs; a violation the moment promoted to a bezel/chassis.)

## DROP (desktop chrome / invented data)
Telemetry strip, health ring, ambient audio (Web-Audio synth), light-mode theme, keyboard shortcuts, sub-pixel micro-detail (0.018 screws, 32/24 individually-meshed ports). No place on an iPhone in the cold aisle.

## DECIDED PLAN (verify-first; each a SEPARATE ship; 6-cap respected going forward)
0. ⛔ **BATCH-VERIFY `.251`–`.260` ON DEVICE FIRST** (John — the gate; 9 deep, past the 6-cap; I cannot do it). It ALSO informs ship 1: does `.260`'s perforated rail already make `s1:001` read, or is the ghost grid needed? **Consolidated checklist handed to John this turn.**
1. **GHOST-SLOT GRID** — the real sparse-clear win; design (replace rails / complement / both) KEYS OFF the device read; honesty-4 locked.
2. **LIGHTING RECONCILE** (only if verify says too dark) — param spot-fix (fog/exposure/rig), **no geometry churn**.
3. **FAULT / ATTENTION mode** — data-driven only, overlay preserves type colour. Needs the data-source ruling.
4. **U-MAP scrubber** — if the static strip falls short. (Camera presets fold in cheap.)

The prior-arc QUEUE (A provenance → C reconciliation+namespace → B ingestion/NBA/pill → honesty-parity → D Forge card → E assistant) is UNTOUCHED and still behind John's PASS.

---

# S36 - SHIP v1.14.261 - U-MAP INSTRUMENT (Ship 1 of the INSPECT-3D MIRROR port) (2026-07-16)

**First Code-authored ship of the SPARSE-RACK-MIRROR handoff** (files63.zip: STATE-LOCKUP + CLEAR-PORT + UMAP-DETENT) **+ RULING-UMAP-GLASS-BANDS.** The U-map was the explicitly Code-shaped problem (STATE-LOCKUP S5.2/S5.4: study pg-compass, rebuild the instrument in-repo). NOT DEVICE-VERIFIED - screenshot self-verified only; John iPhone gate pending.

## What shipped
Rebuilt the rd rack-detail minimap (`rack-hybrid-minimap` / `.scrubbar`, NOT a mock `buildUMap` - that name does not exist in the app) into the cage-nut-compass (`compass_render`) instrument language. Nine edits + a legacy guard, `dct-ios.html` only, all `body.rd`-scoped:
- **Zero chrome** (RULING S3): killed the `.scrubbar` panel/border/box behind the strip.
- **Glass bands** (RULING S2): `.scrubbar-slot` -> tinted glass = `rgba(--kc,0.20)` fill + `rgba(--kc,0.85)` 1px rim (identity) + top-light/seat insets, NO bloom. Retires the purple-blob failure. Radius scales with span (JS-inline, rd-gated). Contiguous bands seam via their own insets (verified U32-33 vs U34 on screenshot).
- **Canon palette** (approved): switch #8a4bff / gpu(compute) #1fffd0 / storage #ffcb45 / cooling #0abfd8 / server(patch) #5d7488. Set via per-`data-type` `--kc` custom prop. Reserved: cyan #28e0ff (active), mag #ff2bd6 (UFM) - no band uses them.
- **RULING S4 resolved (option a):** network -> #3b82f6 azure (distinct from switch violet), not ship-both-violets. Screenshot-confirmed distinct. NEW closest pair to watch on device: cooling #0abfd8 vs gpu #1fffd0 (teal family).
- **Frosted carriage** (DETENT S2): un-hid `.scrubbar-handle` under rd, 32px machined glass + cyan centre index; sole navigator indicator (`.scrubbar-viewport` hidden under rd).
- **Detent + DRO**: `engageAt()` in `rackHybrid_initSync` toggles `.lt-engaged` (fill->0.32 + 2.5px cyan ring) on the band under the carriage centre, and writes an Orbitron DRO U-readout. **ENGAGED tracks the CARRIAGE (scroll centre), not selection** (DETENT S3).
- **Engraved scale + DRO** replace the `MINI` header; U-labels lose their void-pill.

## Deviations from spec (per CLAUDE.md role rule)
1. **Scope:** ship 1 is visual instrument + carriage-driven detent + DRO ONLY. **Tap-to-select is DEFERRED** to the mirror/void view-redesign ship - because the app hybrid minimap is a SCROLL-scrubber owned by `rackHybrid_initSync` (`scrubbar_init` is dead in hybrid, comment-confirmed @ its def). Forcing select into the scrollbar would fight the scroll model; it belongs with the redesigned no-scroll view. STATE-LOCKUP treats the U-map as extractable, but it assumed the mock VIEW (no scroll) - the real app entangles them.
2. **uToFrac 47-pitch:** the app strip uses `(totalU-u)/totalU` linear positioning (internally consistent, slot-height-is-data holds). The mock 47-pitch is for exact map<->3D sync in the redesigned view; folds in there, not here.
3. **Legacy guard added:** `engageAt` early-returns under `?legacy=1` so the DOM is byte-untouched (rule 7). CSS all `body.rd`-scoped; DRO/radius rd-gated in `scrubbar_buildHtml`.

## Gates (all green)
OODA: live==local==.260 before edit. node --check 4 inline blocks / 0 fail; CSS braces 3875/3875 BAL (+17 rules); CRLF preserved (bare-LF 0); NUL 0 (caught+fixed a latin1-write mojibake of non-ASCII comment chars - clean rebuild); content diff = 60 ins / 3 del (`--ignore-cr-at-eol`); three-stamp lockstep .260->.261 (dct/sw/version.json). `?legacy=1` byte-identical. forge3d + reh3d GL scene untouched (DOM/CSS-only ship). NOT a `.251-.260` batch item (CLEAR-PORT S11 out-of-scope).

## DEVICE-VERIFY (John, iPhone, gloves) - the gate (RULING S5 + DETENT S7 + CLEAR-PORT S10 U-map rows)
[1] Open a rack-detail 3D/FLAT hybrid: the side U-map reads as a machined instrument, NOT a panel with colored blocks. [2] Channel scale/ticks readable THROUGH every band tint. [3] Contiguous equipment (two switches touching) reads as separate glass slabs (seam). [4] NO glow/bloom on bands; rim carries colour. [5] NOTHING gray behind/around the instrument, any angle/theme. [6] Scroll the canvas: the band under the carriage brightens + cyan ring; DRO U-number tracks. [7] switch(violet) vs network(azure) distinguishable at arm length; ALSO check cooling vs gpu (teal pair). [8] `?legacy=1` byte-identical (no DRO, no detent, old minimap). [9] Frosted carriage visible against dark bands (else raise white gradient .16->.22).

## Queue after this
Ship 2+ = the rest of the MIRROR port (mirror finish / void scene / boot cover+6s failsafe / chrome deletions+identity plate / fitted telemetry / inline Orbitron+Chakra fonts / canon skin), each its own device-verified ship - and tap-to-select + uToFrac 47-pitch fold in there. Prior-arc QUEUE (provenance->reconciliation->ingestion->honesty-parity->Forge card->assistant) still behind Johns PASS. `.251-.260` consolidated device pass still owed (separate).

---

# S37 - SHIP v1.14.262 - VOID SCENE (Ship 2 of the INSPECT-3D MIRROR port; owner chose A) (2026-07-16)

John: after .261 U-map (looks good), "make the rack look more real" -> chose **A = photoreal scene** (mirror finish + void). This ship = the VOID half; mirror/piano-black material finish is Ship 3.

## What shipped (reh3d Inspection Bay, `rackElevation_render3D`)
Strips the sci-fi diorama dressing so the rack reads as a clean product shot in near-black. One `VOID_SCENE` flag + a prune loop after `scene.add(bayGrp)` sets `visible=false` on every `bayGrp` child EXCEPT `floorMesh` and `refl`. Hidden: motes/particles, background ghost-fleet wireframe racks, backdrop gradient panel, floor glow ring, scan-wave+halo, the inspection PAD group (glass slab/edge strips/calib marks/sweep), 2 practical lights, sweep light. KEPT: dark reflective `floorMesh` (grounding) + mirror `refl` (when on). Mount bg -> true black #000000.
- **Why visible=false not delete:** teardown `scene.traverse` still disposes them (no GL leak) and `bayTick` animations no-op on hidden objects. Fully reversible (flip the flag). 3 edits total.

## DEVIATION from CLEAR-PORT S3 (reported, CLAUDE.md role rule)

CLEAR-PORT S3 says DELETE the floor slab and let the reflection ground the void. But `BAY_REFLECT = (DPR <= 2.1)` -> the mirror reflection is GATED OFF on the iPhone (DPR 3); a floorless void would float the rack in pure black on Johns device. **Kept the reflective floor as device-safe grounding.** John can rule pure-void-no-floor on device (accepts reflection-off float on iPhone) - one-line change if so.

## Preserved / untouched

.260 perforated rails + U-ticks + blank recipe; the ghost reflection (refl); forge3d; all lights (ambient/key/fill/rim/glow/under stay - only the bay PRACTICAL + sweep lights are hidden). Fog left at 0x030508 (near-black; did NOT change to true-black - the .259/handoff flagged the fog reconcile as OPEN and warned changing it regresses the FINAL-mock match; the mount-bg #000 + hidden dressing already give the void).

## Gates

OODA live==local==.261; node --check 4 blocks/0 fail; CSS 3875/3875 BAL; NUL 0; ctrl == HEAD (0 new); bare-LF 0; content diff 16 ins/2 del; three-stamp .261->.262. body.rd-only (reh3d) -> ?legacy=1 byte-identical. NOT device-verified - John iPhone gate pending.

## DEVICE-VERIFY (John, iPhone)

[1] Open a rack in 3D: the rack sits CLEAN in near-black on a reflective floor - NO floating motes, NO ghost wireframe racks behind, NO painted backdrop, NO glow ring / scan sweep / glass inspection pad. [2] The floor still grounds it (reflective, not a void-float). [3] .260 rails/perforation + mounted gear unchanged. [4] Dense + sparse racks both read right. [5] FLAT toggle + FORGE-after + cold offline reopen all fine (no dual-GL crash, no leak on repeat opens). [6] ?legacy=1 byte-identical. [7] RULE: pure-void-no-floor (delete the floor too, accept reflection-off float on iPhone) - or keep the floor? [8] Fog/black depth reads right, or want true-black fog (open reconcile).

## Next

Ship 3 = MIRROR/piano-black material finish (CLEAR-PORT S2) - the rack STRUCTURE only (trays keep type colour); watch the no-PMREM 128px env cube (a hard mirror off it looks coarse - may need a modest roughness nudge, not roughness 0). Then boot cover / chrome deletions / identity plate / telemetry / fonts as later ships. Ship 1 (.261 U-map) + this (.262) both PARKED on John device-verify.

---

# S38 - SHIP v1.14.263 - U-MAP RU LABEL LEGIBILITY FIX (2026-07-16)

John device-verifying .262: "cant see the RU numbers." **Regression from .261**: full-width glass bands (left/right 3px) + hybrid `.scrubbar-slot` z-index:2 == `.scrubbar-u-label` z-index -> bands paint OVER and HIDE the U numbers where they overlap (the .262 true-black void made it starker). Numbers live on the strip by design (.260 = ticks-only on the 3D rails, numerals on the MINI/U-MAP strip).
**Fix (CSS-only, 1 rule):** RU labels -> z-index:4 (above bands z-2 / engaged z-3, below carriage z-5) + 9px/600 + #c9d8e4 + contrast text-shadow -> read over the glass. Screenshot self-verified (U42..U1 crisp over every band). ?legacy=1 byte-identical. Gates green; three-stamp .262->.263. Parked on John device-verify.
Open (unchanged): pure-void-vs-keep-floor ruling (.262); fog true-black reconcile; Ship 3 = mirror finish.

---

# S39 - SHIP v1.14.264 - RACK GESTURE LOCK (2026-07-16)

Per RULING-RACK-GESTURE-LOCK.md. 3D rack canvas: orbit SIDE-TO-SIDE ONLY; vertical swipe over the rack = native PAGE scroll (released, no dead zone). 5 edits in `rackElevation_render3D`:
1. `canvas.touchAction` none->**pan-y** (CSS primary). Audited: pinch is the app camera zoom (JS), so NOT `pinch-zoom` in touch-action (app owns it).
2. **Direction lock:** touchstart axis=0; first ~8px |dx|>|dy| -> claim orbit + preventDefault, else release (no preventDefault / no camera write -> page scrolls); committed until touchend.
3. **Elevation writer killed at source:** removed the `tElev` vertical-tilt assignment in `onMove`; elev stays 0.18 (CLEAR-PORT S1 default). No view-preset / unit-focus tilt exists in this scene.
4. `touchmove` passive true->**false** (to preventDefault the claimed orbit + pinch); touchstart stays passive:true.
5. Mouse vertical no-ops (onMove writes theta only); wheel zoom unchanged.
**Preserved:** horizontal orbit feel; pinch zoom+clamp (0.55-1.7); tap-to-select (clean tap <8px keeps axis 0 -> raycast; vertical scroll sets moved=true so it never mis-selects; 11px tap threshold kept); U-map scrubber (own touches).
reh3d-only -> ?legacy=1 byte-identical; forge3d untouched. Gates green; three-stamp .263->.264. **CANNOT screenshot-verify touch gestures - John iPhone gate matters here.**
Device-verify: [1] vertical swipe on rack scrolls page both ways w/ native momentum, NO dead zone. [2] horizontal orbits; elevation never moves. [3] diagonal resolves by dominant first axis, stays committed. [4] clean taps still select. [5] pinch + U-map unchanged. [6] scroll doesnt jump when a drag ends over the canvas.
Open still: pure-void-vs-floor (.262); fog reconcile; Ship 3 = mirror finish.

---

# S40 - SHIP v1.14.265 - MIRROR FINISH (2026-07-16)

Ship 3 of the MIRROR port (other half of "make the rack more real"; John: "do the mirror finish"). Ports the mock `setFinish("mirror")` recipe (read from the v32 mock, authoritative per CLEAR-PORT S2) onto the rack STRUCTURE.
**Material (mock-exact):** color 0x04060a, metalness 1.0, roughness 0.05, envMapIntensity 0.25, emissive off = black-lacquer piano mirror. Applied to `steelMat`/CHROME (posts+rail bodies), `sidePanelMat` (big flats, were matte 0.7/0.5), `footMat`. **Honors the .256 lock: STRUCTURE ONLY - trays keep type colour, untouched.**
**Env (the key):** ported mock `buildEnvMirror` as `_envCubeMirror()` + swapped `scene.environment` to it - a black studio room with white/cyan/violet light BANDS + top softbox. ESSENTIAL: a roughness-0.05 metal reflecting the old dark gradient shows almost nothing (mock note). Registered via `_tex()` -> bayDispose cleans it.
**Left alone (deviations from mock-mirrors-everything, reported):** semi-transparent emissive back panel (`backMat`, depth contrast) + the .260 perforated rail FACES (`railFaceMat`, machined-matte + preserve the .260 boundary). Ghost reflection clones rackGrp AFTER build -> inherits the mirror. Trays catch the studio env faintly (global env) - colour unchanged, allowed.
5 edits in `rackElevation_render3D`. reh3d-only -> ?legacy=1 byte-identical; forge3d untouched. Gates green; three-stamp .264->.265. **Cannot screenshot the live 3D - John iPhone gate.**
Device-verify: does the rack read as a polished BLACK MIRROR (studio bands + light streaks across the posts/panels), not too dark/dead? If flat: next lever is envMapIntensity up or brighter env bands (the ENV is the mirror, not the material roughness). Trays still read type-colour.
Batch now .261-.265 (5) PARKED on device-verify - AT the 6-cap next ship. Open: pure-void-vs-floor (.262); fog reconcile. Remaining MIRROR-port ships: boot cover / chrome deletions+identity plate / telemetry / fonts (each own ship).

---

# S41 - SHIP v1.14.266 - FLOOR TILE (2026-07-16)

Per RULING-RACK-FLOOR-TILE.md (Option A). **Resolves the open .262 floor question:** the 3D floor becomes polished data-center tile. 3 edits in `rackElevation_render3D`:
1. **`BAY_REFLECT` -> true** (was DPR<=2.1). The ghost clone IS the reflection; the ruling needs it visible in the floor on the iPhone. Was perf-gated OFF at DPR>2.1; now all devices - device-verify [6] checks 55fps/2min. (Vindicates the .262 keep-floor deviation - the floor stays and becomes the tile.)
2. **`floorMesh` -> procedural anisotropic tile:** CanvasTexture 512 (2x2 tiles) = charcoal #0a0d12 + hairline near-black grout grid + per-tile luminance jitter (+/-3%) + faint noise; RepeatWrapping, one tile ~= rack width; `anisotropy min(maxAniso,4)` (stops grout shimmer - the premium tell); `_tex()`-registered. Material map=tile, metal 0.5, rough 0.35, **transparent opacity 0.85**, renderOrder 1 -> composites OVER the dim clone -> reflection through the tile = **satin** (not mirror), strongest at base, dissolving out; fog eats the far edge (no rim).
3. stamp.
Option B (THREE.Reflector) NOT used. Reflection inherits the .265 mirror. Pad/ring/motes stay deleted; void/mirror/gesture unchanged - this only ADDS the floor. reh3d-only -> ?legacy=1 byte-identical. Gates green; three-stamp .265->.266. **Cannot screenshot live 3D - John iPhone gate** (grout straight/no shimmer; reflection stands satin; edge dissolves to void; variance=material; cyan/violet tint; 55fps).
Batch now .261-.266 (6) PARKED on device-verify (owner said keep shipping past the cap). Remaining MIRROR-port: fonts (BLOCKED on font binaries - owner drop) + boot/chrome/telemetry (need the full-screen-view decision).
---

# S42 - SHIP v1.14.267 - FLOOR TILE V2 (2026-07-16)

Per PUNCH-FLOOR-TILE-V2.md (owner screenshot review of .266: IMG_0722 dark = correct baseline vs IMG_0721 bright = fails the ruling). Clears P0-P3 in 6 edits, all inside `rackElevation_render3D`. **The §A JOHN-LOCKED light rig is UNTOUCHED** - that lock is exactly why the fix lands on the floor.

**P0 + P1 ARE ONE ROOT CAUSE - and the punch's framing was wrong (reported).** The punch asked "if IMG_0721 is the LIGHTS toggle..." - **there is NO LIGHTS toggle in the file** (grepped: LIGHTS/lightsOn/_lights/toggleLights = 0 hits). Neither branch of P0 applied. Both frames are the SAME build at a different orbit angle. The floor was a **LIT surface**: MeshStandard `metalness 0.5 / roughness 0.35` took a specular lobe from `keyL` (0xd4e5f7 @0.78, high front-right) -> a bright pool that **sweeps with camera theta** = the "bright state"; `rimL` 0x00d4aa specularing off it = the **off-palette mint**; and `keyL`'s shadow of the rack **cut that pool** left of the base = P1's "dark angular polygon" - **an absence of highlight, not a gap in the tile**. `keyL` at (5.45,13.79,4.91) throws it exactly where the owner saw it.
**FIX = the owner's own law, literally:** `floorMesh` -> **`MeshBasicMaterial` (unlit)**. No direct light, no env, no shadow; it can only show its own tile + the ghost clone through its transparency. *"The floor only ever REFLECTS."* Kills the view-angle dependence **at source** (deterministic - no angle can ever flare it again). `receiveShadow` dropped (was the P1 source; no-op on Basic).

**SECOND, INDEPENDENT BUG (mine, from .266; found by reading, not by the punch):** `_floorTex` was the **only CanvasTexture in the file left at default LinearEncoding** (`:18070`/`:18188`/`:18197` all set sRGB). The authored charcoal was read as already-linear and **gamma-LIFTED on output to ~rgb(56) grey** - **the tile has NEVER rendered at the value .266 specced**, and that lift was half the "washed" read. Now `encoding = sRGBEncoding` -> WYSIWYG.
**DEVIATION (reported):** the old `10,13,18` + grout `#04060a` were **silently compensating for that lift** - once corrected they went near-invisible against the `#04060a` void (**the grout WAS the void colour exactly**). Re-authored: base **24,29,37**, grout **#090c11** = the same tile, landing where 10,13,18 was always meant to. ⭐**TRAP for future sessions: MeshBasic + sRGB = what you paint is what renders. The floor's look is now 100% authored - if it reads wrong, the lever is the TILE PAINT, never the lights.**

**P2 tile pitch:** divisor `RW*2` -> `RW` (one tile ~= HALF a rack width). **NOTE: the .266 math was already ~1 rack width/tile** (48U: floor 81.6 / 7 reps = 11.66 per canvas / 2 tiles = 5.83 ~= RW 6.0) - the "~2x" read is **perspective at elev 0.18, not a maths error**. Owner's eye is the gate, so it goes smaller. **"Halve the repeat" taken as halve the tile PITCH (= DOUBLE the repeat count)** - halving the count would have made tiles BIGGER.
**P3 presence:** clone opacity `0.16`->`0.22` + floor opacity `0.85`->`0.80` (both owner-named values). Satin, never mirror.

**VERIFICATION - new capability, worth keeping:** built an **isolation harness** (`scratchpad/floorlab.html` + a node static server; same vendored r128, §A rig verbatim, .265 env, real floor code, stand-in rack, renders N floor recipes side-by-side at chosen thetas). It **REPRODUCED** the bright pool, the mint tint and the shadow wedge on the .266 recipe and **CLEARED all three** on this one; tile reads continuous with grout seams, no visible rim. **This is the first time a reh3d look-bug was diagnosed and a fix proven WITHOUT spending a device pass.** ⚠️ **The harness is NOT the app** - stand-in rack, so the live tray/reflection balance is still the owner's eye. Note also: file:// is blocked by the Chrome extension (serve over http), and ~10 live WebGL contexts freeze the renderer (keep the grid small).

Unchanged: BAY_REFLECT, void, mirror, gesture, anisotropy, per-tile jitter, noise, fog-dissolve. reh3d-only -> `?legacy=1` byte-identical; forge3d untouched (0 diff hits). Gates: node --check 4/0; CSS 3875/3875; CRLF 49514/0 bare LF; NUL 0; three-stamp .266->.267.
**Known stale comment (NOT fixed, out of scope):** the VOID_SCENE note at ~:32476 still says "BAY_REFLECT is DPR<=2.1, so the mirror reflection is OFF on the iPhone" - false since .266 set it true. Cosmetic lie in a comment; fold into the next floor/void ship.
**John iPhone gate:** [1] **orbit a FULL 360 - the floor must NEVER flare into a bright pool at any angle** (the P0 regression test; one sweep is the whole check). [2] no dark wedge left of the rack base; floor continuous. [3] tile reads as TILE - grout seams + per-tile variance = material, not a checkerboard, not invisible (**if too dark/dead, the lever is the tile base 24,29,37 - NOT the lights**). [4] lit trays stand faintly in the polish at the base, satin (if short: clone 0.22->0.26). [5] no mint anywhere on the floor. [6] edge still dissolves to void; grout straight, no shimmer. [7] 55+fps 2min.
**Batch now .261-.267 (7).** The .266 floor got a real (screenshot) owner pass, which produced this punch; the rest of the batch (.262 void, .264 gesture, .265 mirror) is still owed a device pass - the punch confirmed **glass bands + U-map seams look right (.261/.263 effectively cleared)**. Open: pure-void-vs-floor is **RESOLVED** (floor stays, per RULING-RACK-FLOOR-TILE + this punch). Remaining MIRROR-port: fonts (BLOCKED on font binaries - owner drop) + boot/chrome/telemetry (need the full-screen-view decision).

---

# S43 - RECON (NO CODE): CODE-QUEUE.md received; TASK 1 PHASE DOCK mapped (2026-07-16)

**Owner dropped `Downloads/CODE-QUEUE.md`** (owner-ordered, supersedes internal ordering) while device-verifying `.267`. **NOTHING SHIPPED THIS SECTION.**

## THE RACK LOCK (new owner invariant - honour in every future session)
The rack scene **LOCKS** the moment the `.267` floor 360-orbit P0 pass completes. If that pass FAILS, the pre-staged floor levers (**tile paint 24,29,37 - NEVER the lights**; clone `0.22->0.26`) are the **ONE** permitted rack-scene change, then re-pass, then LOCK. Once locked: **no changes to geometry, materials, lighting, camera, floor, reflection, or boot without an explicit new owner ruling.** If a queued task would touch the rack scene: **STOP AND ASK.**
⚠️ **New standing rule from the queue: "ONE unverified ship in flight"** - this TIGHTENS the old CALL-0 6-ship batch cap. `.267` is in flight -> **.268 must not ship until the owner calls the floor.** (Existing parked batch `.261-.267` predates this rule.)

## TASK 3 - GESTURE LOCK: **ALREADY SHIPPED (.264). VERIFIED IN CODE, NOT ASSUMED. NO WORK.**
`touch-action:pan-y` `:31868` · 8px JS direction lock `:32589` (committed till touchend) · `tElev` writer dead at source `:32555` (elev pinned 0.18) · taps/pinch/U-map preserved. Owner's device pass still owed (it is on his own VERIFY list).

## TASK 1 - PHASE DOCK: RECON DONE. ⭐ **THE SPEC'S PREMISE IS HALF-WRONG (report to owner).**
Spec says the cards "render inline on both the rack WORK view AND the SET UP SITE flow; one component fixes both."
- ✅ **"One component fixes both" is TRUE** - and stronger than the spec knows: there is exactly **ONE renderer, ONE call site**. The 5 cards come from a single `rackPhases.forEach` at **`:33202-33273`** inside **`deploy_showRackDetail`** (`:32953`). Independently re-verified: every other `DEPLOY_PHASE_TYPES.forEach` site (`:21636`, `:25895`, `:25990`, `:26281`, `:30702`, `:31420`) builds a **pipeline progress BAR** (lit/dim segments, no cards); `:23104` is `wakeLock_evaluate` (wake-lock helper, not a renderer). **Re-homing `deploy_showRackDetail` covers every surface phase cards can appear on, by construction.**
- ❌ **"SET UP SITE flow" has NO phase cards.** `SET UP SITE` (`:19320`) is a gold NBA banner -> `cmd_route('profile')` -> `rd_openProfile()` -> `siteProfile_showEditor` = the site-profile editor. No phase-card markup anywhere in it. **The owner's VERIFY line "WORK + SET UP SITE: no phase cards in scroll" is therefore trivially true on SET UP SITE.** ASK the owner which surface he means (likely he calls the deploy flow "set up site") - but it does NOT block the build, since one renderer covers all.

### Build map (everything needed; next session can execute straight from this)
- **Host:** `deploy_opsHost()` `:26317` -> `#wk-deploy` under `body.rd`, `#ops-content` under `?legacy=1`. `deploy_ensureDeployPanelVisible()` `:30568` (rd-gated) runs first - the `.223` dead-card fix, do not disturb.
- **Cards:** outer `.hud-card` + state modifier `hud-card-live|-complete|-blocked` (`:33215-33217`; **CSS `:5253-5318` is GLOBAL, not `body.rd`-scoped**). Buttons `.pt-btn*`; status pill `.badge`/`.b-green|b-cyan|b-red|b-gold` `:33227`. Nested checklist `checklist_renderPhase` `:24715` is **rd-gated** at `:33267`.
- **Data:** `deploy_loadPhases(deployId).filter(rackId)` sorted by `seqOrder` `:32975`; `DEPLOY_PHASE_TYPES` `:25316`; labels `:25318`; per-type accent `DEPLOY_PHASE_COLORS` `:25319` (mech/power gold · network cyan · compute green · validation violet).
- **Status colours** `:33205-33217`: complete `--green` · in_progress `--cyan` · blocked `--red` · pending `--slate`. (Pre-existing nit, NOT ours: `rgba(255,45,85,…)` = #ff2d55 is used two lines from root `--red:#ff453a` - two different reds. Leave it.)
- **Bottom stack on this screen:** `#rd-botnav` `.botnav` fixed bottom:0 **z-40**, `--tabnav-h: calc(72px + var(--safe-bottom))` `:131`, shown only via `body.rd` `:9148`. `#omni-bar` (LOG) fixed `bottom:var(--tabnav-h)` **z-25** `:4556`, ~57-60px, **NOT rd-gated** (exists in legacy too; `.omni-inactive` hides it with no active deploy). `#action-stripe` is legacy-only (`body.rd` hides it `:9112`).
- **Sheet primitive - REUSE, DO NOT INVENT.** Two families: **(A) `.va-sheet`** `:2717` = scrim `rgba(2,4,8,.8)` + blur + z-150, inner `.va-sheet-inner` `:2724` radius/max-height 75vh/`@keyframes sheetUp` `:1999` transform-based + `--safe-bottom` padding; **generic `initSheetDismiss(sheetId, innerSel, closeFn)` `:45864` gives drag-down-to-dismiss free** (wired for 5 sheets `:17016`). No body-scroll lock in this family. **(B) `.rd-sheet`** (`#rd-profile-sheet` `:8825`) = **`body.rd`-gated** full opaque panel, `bottom:calc(72px+safe)` (deliberately clears the nav), `.rd-sheet-hdr/-body/-close` `:9003-9008`, open/close = `classList.add/remove('open')` (`rd_openProfile` `:17588`), no scrim/anim. **(C)** plain modals (`#ta-sheet`/`#hw-matrix-sheet`, z-8900) do body-scroll lock via `body.style.overflow='hidden'` `:23881`.
  -> Queue wants 90-100% height + scrim + drag-down + X + scrim-tap + body-scroll-lock + `overscroll-behavior:contain` + reduced-motion. **Best fit: (A)'s scrim/animation/`initSheetDismiss` + (B)'s `body.rd` gating discipline + (C)'s scroll lock.**
- ⚠️ **LEGACY-LEAK TRAP:** the card renderer + `.hud-card` CSS are **unconditional** and keep firing under `?legacy=1` (only the host differs). **Any dock/sheet plumbing MUST be `body.rd`-gated** (mirror `body.rd #id.open{display:flex}`) or `?legacy=1` breaks byte-identical. This is the [[reference_shared_header_legacy_leak]] family - same trap, different organ.
- **Owner decision owed:** which bottom-stack option shipped (dock above LOG bar / merged into LOG row / auto-collapse hairline) - queue requires stating it.

## TASK 2 - U-MAP 1U RATCHET: not started. Queue-confirmed the U-map COLUMN is UI, not the rack scene (does not violate the lock). Positional quantization only: `position = uToFrac(round(fracToU(rawFingerFrac)))` per frame; DRO + engaged band update ON the step; **the `/47` stays** (47 pitches between 48 centres, not an off-by-one). Surface = `rack-hybrid-minimap`/`.scrubbar` (`scrubbar_buildHtml`/`rackHybrid_initSync`) - **mock `buildUMap` does not exist in the app.**

---

# S44 - OWNER RULINGS (NO CODE): .267 P0 PASSED · WET FINISH scoped 1+2+3, ITEM 4 DROPPED (2026-07-16)

## ⭐ `.267` PASSED THE P0 PASS (owner, iPhone, full 360)
The unlit floor + the sRGB encoding fix HELD on glass: no flare at any angle, no wedge, no mint. **The `S42` diagnosis is confirmed on device** (the floor was a LIT surface; the isolation-harness method predicted the live result correctly - first reh3d look-bug fixed without burning a device pass, and it landed first try).

## RULING - `Downloads/RULING-FLOOR-WET-FINISH.md` + owner ruling in-session
Owner verdict: floor passed, but "needs a mirror finish to it, like a wet look - but it's not." Rack lock **formally re-opened for THIS CHANGE ONLY**, re-arms on the wet-pass. Nothing else in the rack scene rides along.

### ⛔ ITEM 4 IS **DROPPED** - OWNER RULED "drop 4, ship 1+2+3 after the dock" (2026-07-16). **DO NOT REINTRODUCE IT IN ANY FUTURE SESSION.**
The ruling as written asked for "tile roughness 0.35 -> ~0.20 so the scene's own lights draw a tighter specular streak" + metalness +0.05. **That is a P0 REVERT and was pushed back with evidence, and the owner agreed.** WHY (the permanent reason): after `.267` the tile is **`MeshBasicMaterial` = UNLIT - it HAS no roughness/metalness/env**; those were the `.266` values, and `roughness 0.35` is *precisely what drew the bright pool*. Going to `0.20` is a **TIGHTER lobe = a SHARPER, BRIGHTER streak from `keyL` (0.78)** - it would flare WORSE than the original IMG_0721, and it contradicts the same ruling's own hard bound ("if any orbit angle flares, the change has gone too far"). **Item 4 and that bound cannot both hold.** ⭐**STANDING TRAP: any future ask for floor "sheen/gloss/specular/shine" that reaches for roughness/metalness/lights is the SAME P0 revert. The floor is unlit BY RULING. Its look is 100% authored paint + clone compositing.**

### SHIP `.269` = WET FINISH (1+2+3 only). Sequencing: **DOCK `.268` SHIPS AND VERIFIES FIRST** (CODE-QUEUE: "nothing ships before this"; one unverified ship in flight). Then wet as its own ship.
⚠️ **The ruling doc's baseline is HALF-STALE - it was written against `.266`. Correct baselines are `.267`:**
1. **Wet = DARKER (the cue everyone forgets).** Tile paint level **-15%**: `24,29,37` -> **~`20,25,31`** (grout `#090c11` scales with it - keep it just under the tile). Authored paint = deterministic, no light involved.
2. **Reflection presence up:** ghost clone opacity **`0.22` -> `~0.32`**; tile plane opacity **`0.80` -> `~0.78`** (⚠️ the doc says "0.85 -> 0.78" - **0.85 is the STALE `.266` value; `.267` already set 0.80**).
3. **Contact-sharp falloff = THE wet signature.** Vertical alpha gradient on the clone: **full strength where the rack meets the floor -> gone within ~1.5 rack-heights.** The clone is mirrored BELOW `floorY`, so this is alpha falling off with depth below `floorY` (far-from-contact = the rack's TOP). Implementation note for the builder: clone materials are per-mesh `.clone()`s at `:32389`-ish, so the clean lever is **`onBeforeCompile`** injecting a world-Y smoothstep into the alpha (no geometry change, no Reflector); three caches by shader source so it should stay ~1 program per material type - **watch the build-time recompile cost and the 55fps gate.**
**BOUNDS (unchanged):** satin-wet, **NOT** a literal mirror - the **tile grid must still read THROUGH the reflection everywhere**; if seams vanish at the contact zone, **back off #2**. **The bright-pool failure mode is the HARD CEILING.** No Reflector pass; same clone+tile architecture; Option-B gating from RULING-RACK-FLOOR-TILE still applies.
**WET VERIFY (owner, iPhone, full 360 - this RE-RUNS the P0):** [1] floor visibly DARKER than `.267`, reads wet at a glance. [2] rack stands sharply in the polish at contact, dissolves with distance. [3] tile seams read through the reflection everywhere incl. the contact zone. [4] full 360: no flare, no wedge, no mint - **P0 re-passes**. [5] ⭐**REAR VIEW TOO** - the owner judged from the rear last time; it must read wet from the back-panel side, not just the lit face. [6] **ON PASS: THE RACK LOCK RE-ARMS - state it here.**

## QUEUE AS IT NOW STANDS
**`.268` DOCK (Task 1)** -> owner verify -> **`.269` WET (1+2+3)** -> owner verify -> **RACK LOCK RE-ARMS** -> **Task 2 U-map 1U ratchet** (UI, not the rack scene). Task 3 gesture lock = **already shipped `.264`**, no work, owner device-confirm still owed. Task 1 build map + the legacy-leak trap + the bottom-stack decision owed to the owner: **see `S43`**.

## S44b - OWNER DECISION (2026-07-16): BOTTOM-STACK OPTION = **DOCK ABOVE THE LOG BAR** (all tightened)
Owner ruled "dock above LOG bar is fine, go with that" - closes the last open Task 1 decision. The queue REQUIRES the ship note state which option shipped: **state "dock above LOG bar, all tightened"** in the `.268` note. The other two (merge into the LOG row / auto-collapse to a progress hairline on scroll) are NOT chosen - do not drift into them.
**Why it is the right one (keep, so nobody re-litigates):** additive - it does not disturb `#omni-bar`'s existing stacking, whose maths **differs materially between rd and legacy** (rd = `#omni-bar` z-25 at `bottom:var(--tabnav-h)` + `#rd-botnav` z-40 at bottom:0; legacy = `#omni-bar` + `#action-stripe`, NO `#rd-botnav`). Auto-collapse was the riskiest and is held until the dock is proven.
**Constraints from the queue that still bind:** dock must NOT cover map content when closed and must NOT push the page nav off-thumb; `#omni-bar` hides itself via `.omni-inactive` when no deploy is active, so the dock's bottom offset must **not** hard-assume the LOG bar is present. Success criterion is the owner's: *"the U-map is clean and has more room to look the way it should be."*

---

# S45 - SHIP v1.14.268 - PHASE DOCK (CODE-QUEUE Task 1) (2026-07-16)

**Owner asked 3x; the queue said "nothing ships before this."** It is now shipped and **IN FLIGHT (unverified)** - the "ONE unverified ship in flight" rule means **`.269` WET must NOT ship until the owner calls this one.**

## BOTTOM-STACK OPTION SHIPPED (the queue requires the note state which): **DOCK ABOVE THE LOG BAR, ALL TIGHTENED** (per S44b).
Measured live on a 575px viewport: **dock 384-434 -> LOG bar 435-491 -> nav 489-575.** The dock sits flush above `#omni-bar`. The other two options (merge into the LOG row / auto-collapse hairline) were NOT built - do not drift into them.

## THE BUILD (all additive - the ONLY removed line in `dct-ios.html` is the version stamp)
- **RE-HOMED, NOT REBUILT.** `deploy_showRackDetail`'s card loop is **byte-identical**: an **IIFE that SHADOWS `html`** captures the cards into `_phCardsHtml`, so the 73-line loop needed **zero edits inside it**. There is **NO second renderer** - `#ph-sheet-body` is fed the exact string deploy already built. ⭐ **This is the pattern to reuse for any future "re-home, don't rebuild" ask.**
- **LIVE-SYNC IS FREE:** every phase button already re-enters `deploy_showRackDetail`, so one call at its end recomputes the cards and pushes them into the open sheet. Verified live: real BLOCK tap inside the sheet -> persisted -> card re-rendered -> dock chip flipped active->blocked -> sheet stayed open.
- **BODY-LEVEL BY NECESSITY (new trap, worth keeping):** `#wk-deploy`'s `.work-sub` carries `animation: rf-fade .22s ease both` (`:8729`/keyframes `:8810`) = **a non-none transform for 220ms**, which would make it the containing block for a `position:fixed` child. **The `.212` trap in a different organ.** Any future fixed-position child of a render host must check this first.
- **Bottom offset does NOT hard-assume the LOG bar:** `#omni-bar` hides itself via `.omni-inactive` (display:none) when no deploy is active, so the `+ --omni-h` term is **`:has()`-gated** on the bar being live, and **`--omni-h` is MEASURED in JS** (57px live), never guessed. No content spacer needed: `.page` already reserves `calc(--tabnav-h + 140px)` > the 107px omni+dock stack.
- **Sheet = reused primitives, not invented:** (A) `.va-sheet` scrim + `@keyframes sheetUp` + `initSheetDismiss` drag-down · (B) `.rd-sheet` `body.rd` gating · (C) `#ta-sheet` body-scroll lock. `overscroll-behavior:contain`; safe-area both ends; `prefers-reduced-motion` honoured. ⚠️ **`.phs-inner` is ITSELF the scroller** (header sticky INSIDE it) because `initSheetDismiss` keys drag-dismiss off `inner.scrollTop <= 0` - **splitting it into a flex column with a separate scrolling body would let a checklist drag dismiss the sheet. Do not "tidy" this.**
- **Lifecycle:** CSS gate `body.rd.ops-detail.ph-dock-on`. Belt = every existing `ops-detail` clear kills the dock free. Braces = explicit `phdock_leave()` in the 4 sibling screens that KEEP `ops-detail` (`rd_openOpsTool`, `deploy_detailTool`, `mscope_render`, `deploy_showDetail`) **+ `showMode`**.

## ⭐ TWO REAL BUGS FOUND BY DRIVING THE APP - **THE GATES WERE ALL GREEN THE WHOLE TIME**
1. **Sheet stranded over the Command Center.** A bottom-nav tap (`showMode`) with the sheet open left `#ph-sheet.open` up over `#pg-cmd` **and `body.overflow` stuck at `hidden`**. Root cause: `showMode` removes `ops-detail`, which hides the **DOCK** - but `#ph-sheet.open` is **not gated on `ops-detail`**. Fixed by calling `phdock_leave()` in `showMode` **right beside the existing `rd_closeProfile()` call, which is there for exactly this reason.** ⭐ **STANDING LESSON: hiding the opener does NOT close the modal. Any future body-level sheet must be dismissed in `showMode` explicitly.**
2. **Sheet subtitle printed the internal rack id** (`R-TEST-1`) instead of the label the tech reads off the cabinet (`C12-R07`). Now `rack.rackId`.

Self-caught pre-push (both mine): `phdock_activeIdx` shipped **dead** (now wired - it seeds the landing phase in_progress>blocked>first-incomplete, so the sheet "opens scrolled to the active phase" per the queue; a chip tap overrides and persists as last-viewed), and **three comments named a `deploy_phaseCardsHtml` function the IIFE approach never created** (comment rot, corrected).

## ⚠️ METHOD NOTE - A WRONG DIAGNOSIS, CAUGHT AND CORRECTED
The landing scroll first appeared broken (`scrollTop` stayed 0). I diagnosed "scrollTop written before first paint is discarded" and shipped a **double-rAF** fix. **It was wrong.** Instrumenting proved `phdock_scrollToPhase` was **never called at all**: the automation tab was **backgrounded (`document.hidden=true`), so rAF never fires.** An env artifact - the same class as the `.214` "page won't scroll" ghost. Final code uses **NO rAF**: the scroll runs **synchronously after a forced reflow** (`void inner.offsetHeight`), which is deterministic AND testable in a hidden tab. ⭐ **Rule earned: never "fix" a symptom the harness itself produced - instrument until the call is proven to have happened.** (A second wrong turn: `showMode('cmd')` silently no-ops - the map is `{command:'cmd'}`, so the key is **`'command'`**. The belt only looked broken.)

## DEVIATIONS (both reported to the owner, both deliberate)
1. **Chip "done" = `--green`, NOT teal.** The queue's legend said "pending gold · active cyan · done teal · gated dim+lock". **`--teal` is not a root token** (only scoped to `#boot` `:11049` and `#forge3d-sheet` `:8848`) and the cards paint complete with `--green`. **A dock chip disagreeing with the card it opens is a field defect**, so chips mirror the card colours exactly. Gold/cyan/dim+lock shipped as written.
2. **"SET UP SITE flow" premise half-wrong** (unchanged from S43): that flow has NO phase-card markup, so the owner's VERIFY line is trivially true there. ONE renderer/ONE call site = re-homing covers every surface by construction. **Owner still owes: which surface does he call SET UP SITE?**

## VERIFICATION (live, real app served over http, real seeded deploy - not a mock)
Gates: node --check 4/0 · CSS 12 blocks balanced · CRLF uniform (0 bare-LF) · three-stamp `.267`->`.268`. Driven live: all 5 chip states paint · sheet opens landed on the tapped phase (NET->idx2 @821; MECH->0; VAL clamps at max-scroll 856 and is **fully visible** - correct, not a bug) · drag/X/scrim dismiss + tap-inside does NOT dismiss · live-sync through a real BLOCK · dock cleared on every leave path.
**`?legacy=1` proven byte-identical LIVE:** `redesign_isOn()`=false · host=`#ops-content` · 5 cards **inline** with all phase buttons · 0 cards in the sheet · dock+sheet `display:none` · **`phdock_render` called 0 times** · and a **simulated `#ta-sheet` body-lock SURVIVED `phdock_leave`** (`phdock_close` restores `overflow` only if IT took the lock - **rule 7**).
**RACK LOCK: untouched** - no geometry/materials/lighting/camera/floor/reflection/boot.

## OWNER GATE (iPhone, gloves) - `.268` IS THE ONE UNVERIFIED SHIP IN FLIGHT
- [ ] WORK rack detail: **no phase cards in the scroll**; dock above the LOG bar; nothing covered; nav thumb-reachable
- [ ] Each chip opens the sheet **on that phase**; START/GATED/OVERRIDE/checklist drawers work as before
- [ ] Drag-down / X / scrim-tap dismiss; page does not scroll behind; a **checklist drag does NOT dismiss**
- [ ] Phase action with the sheet open -> card **and** chip update, sheet stays open
- [ ] **Tap COMMAND in the nav with the sheet open -> the sheet closes** (this was bug [1])
- [ ] ⭐ **SUCCESS CRITERION (owner's words): "the U-map is clean and has more room to look the way it should be."**
- [ ] `?legacy=1`: phase cards still inline, unchanged

## QUEUE AS IT NOW STANDS
**`.268` DOCK = SHIPPED, AWAITING OWNER VERIFY (HARD STOP)** -> **`.269` WET FINISH** (items 1+2+3 ONLY, spec in S44; item 4 DROPPED forever) -> owner verify -> **RACK LOCK RE-ARMS** -> **Task 2 U-map 1U ratchet** (UI, not the rack scene). Task 3 gesture lock = already shipped `.264`, no work, owner device-confirm still owed.

## S45b - OWNER RULING (2026-07-16): **"SET UP SITE" = THE DEPLOY FLOW** (closes the S43/S45 open question)

Owner: *"the deploy flow is what I call set up site."* **The S43 open question is CLOSED - do not re-ask it.**

**Consequence for `.268`: NONE. The verify line is already covered; nothing more to build.** The owner's queue line *"WORK + SET UP SITE: no phase cards in scroll"* names **two ROUTES to the SAME screen** (`deploy_showRackDetail`), not two surfaces. Re-verified against the shipped `.268` code: **exactly ONE place in the file emits a phase card** - `:33473` in `deploy_showRackDetail`. Every other phase loop emits **zero** `hud-card`s (`shiftReport_generate` `:16902` · `deploy_computeDeployRollup` `:26006` · `deploy_seedRacksAndPhases` `:26101` · `deploy_renderPhaseMatrix` `:26392` · **`deploy_showDetail` `:30817`/`:30835`** · `rackLookup_renderRow` `:31535` · `deploy_generateReport` `:34560` · `_asbuilt_rackBuild` `:35208`/`:35210`) - they build the pipeline progress BAR. **So "one component fixes both" was true, and `.268` fixed both by construction.** S43's "the spec's premise is half-wrong" verdict is now **superseded**: the premise was right, the owner's *vocabulary* was what differed - he calls the deploy flow "set up site".

### ⚠️ SURFACED BY THE RULING (owner's call, NOT actioned - `.268` is awaiting verify, one unverified ship in flight)
**The app uses the literal string `SET UP SITE` for the SITE PROFILE, not the deploy flow** - i.e. the label does not open what the owner means by those words. Two call sites, **both first-run only** (they disappear once `siteProfile_isConfirmed()`):
1. `cmd_nba` rung A `:19431` - NBA banner `label:'SET UP SITE'` -> `cmd_route('profile')` -> `rd_openProfile()` -> `siteProfile_showEditor`. Body copy *"Set up your site profile. / PHANTOM needs your facility, switches, and rack naming…"* does disambiguate it.
2. `cmd_setSiteLabel` `:19478` - the `#rd-site` header slot prints `SET UP SITE` (gold `.warn`) while the profile is unconfirmed.

**This is the `MASTER DOC -> SITE PROFILE` precedent again** (hard rule: *"Names say what the door opens. No aspirational or historical labels."*). It is a **naming smell, NOT a live defect**: severity is low (first-run onboarding only, body copy disambiguates, both vanish once configured). **Recommendation on the table: relabel both to `SET UP PROFILE`** (cosmetic, 2 strings, redesign-gated, own micro-ship) so the owner's field vocabulary and the app's labels stop colliding. **Owner has NOT ruled - do not ship it unasked.**

---

# S46 - SHIP v1.14.269 - `SET UP SITE` -> `SET UP PROFILE` (label-only micro-ship) (2026-07-16)

Owner approved the relabel surfaced in `S45b`. **Label only - two strings. No logic, no routes, no new door.**

## WHAT + WHY
The app printed the literal string `SET UP SITE` for the **SITE PROFILE** onboarding, while the owner's field vocabulary uses "set up site" for the **DEPLOY FLOW** (`S45b` ruling). The label named a different door than the person using it means - the **`MASTER DOC -> SITE PROFILE` precedent**, hard rule *"Names say what the door opens."*
- `cmd_nba` rung-A NBA label `:19435` -> `SET UP PROFILE` (act `cmd_route('profile')` **unchanged**)
- `cmd_setSiteLabel` `#rd-site` header prompt `:19486` -> `SET UP PROFILE`
- 3 stale comments naming the old label updated so they cannot rot; **2 deliberate "do NOT relabel this back" notes retained** - they are the only `SET UP SITE` strings left in the file, and they are load-bearing (they carry the owner-vocabulary reason).

## ⚠️ SEQUENCING - THE FLIGHT RULE WAS WAIVED, ONCE, BY THE OWNER
This **stacks on the still-unverified `.268`**, which "ONE unverified ship in flight" would forbid. The owner gave an **informed go** immediately after being told, in the preceding line, that `.268` was parked awaiting his verify. **Waived FOR THIS SHIP ONLY - the rule still stands; do not treat this as precedent.**
⭐ **WET FINISH THEREFORE MOVES `.269` -> `.270`.** Its spec is **unchanged** (S44: items **1+2+3 only**; **item 4 stays DROPPED forever**).
Cannot confound the `.268` verify: both strings render **only while `siteProfile_isConfirmed()` is false** (first-run) - a state the owner's configured device is not in - and neither is on the rack-detail/dock surface.

## VERIFIED LIVE, BOTH HOUSES (served over http, real boot)
- **Redesign:** NBA renders `SET UP PROFILE →` · header `#rd-site` reads `SET UP PROFILE` · **the door still works** - tapping it opens the populated `SITE PROFILE` sheet (`rd-profile-sheet`, title "SITE PROFILE", body content present).
- **Legacy, CLEAN boot forcing nothing:** `#pg-cmd` never active (`display:none`, 0x0) · **`#cc-nbar` content is `""` - never populated** · **0 elements show the label** · `#mode-toggle` display:none. Control (`appLogoTap` 110x20) proves layout was real, **not a hidden-tab artifact**. -> **`?legacy=1` byte-identical.**
- Gates: node --check 4/0 · CSS 12 blocks balanced · CRLF uniform · three-stamp `.268`->`.269`. **RACK LOCK untouched.**

## ⭐ A WRONG CLAIM I WROTE, CAUGHT AND CORRECTED (keep - it re-maps the legacy-leak organ)
An interim comment asserted legacy reaches `cmd_setSiteLabel` via `#mode-toggle -> showMode('command') -> cmd_render`. **It cannot.** `#mode-toggle` carries **inline `style="display:none"`** at `:12594` (*"Hidden until ?redesign=1; flag-gated so the field app is untouched"*) - it is hidden in **BOTH** houses, so **legacy has NO door to `showMode`/`cmd_render` at all**. The `body.rd #mode-toggle{display:none}` rule at `:9190` is only the rd-side belt (the bottom nav replaces it) and misreads as "visible in legacy" if taken alone.
An earlier probe showed `#cc-nbar` rendering **163x33 in legacy** and looked like a rule-7 break - **it was my own forced `showMode('command')` manufacturing a state legacy cannot reach.** ⭐ **Two method traps re-confirmed: (1) `innerText` falls back to `textContent` in a hidden tab and reports display:none text as present - use `getBoundingClientRect`/`offsetParent` + a known-visible control instead; (2) never conclude from a state you forced - re-test with a clean boot that forces nothing.** Same family as [[feedback_verify_env_artifacts_before_fixing]].

## QUEUE
**`.268` DOCK + `.269` relabel both AWAITING OWNER VERIFY** (the relabel folds into the `.268` pass - nothing to see on a configured device) -> **`.270` WET FINISH** (items 1+2+3) -> verify -> **RACK LOCK RE-ARMS** -> **Task 2 U-map 1U ratchet**. Task 3 = already shipped `.264`.

---

# S47 - OWNER RULING (NO CODE): ⭐**CAMERA SURFACE OPEN** · WET STILL NEXT, AFTER THE `.268` VERIFY (2026-07-16)

Owner, verbatim in-session: **"camera open, wet after .268 verify"**. **NOTHING SHIPPED THIS SECTION.**

## ⭐ RULING 1 — THE CAMERA TERM OF THE RACK LOCK IS **OPEN**. THIS IS THE "EXPLICIT NEW OWNER RULING" THE LOCK DEMANDED.
`Downloads/CODE-QUEUE.md` reads: *"no changes to geometry, materials, lighting, **camera**, floor, reflection, or boot — NOTHING — without an explicit new owner ruling."* **This is that ruling, and it lifts the CAMERA term ONLY.**
- ✅ **OPEN — camera as an instrument:** projection (ortho/perspective), camera position, presets, view rail, `setView`-driven `tTheta`/`tElev`/`tZoom`, framing/frustum. The owner's own authorizing words, on record since the consult: ***"It's gotta be leveled — when I see it, it should look like you're looking straight at the rack."*** The rack does not change; the eye does.
- ⛔ **STILL LOCKED — the scene, permanently:** materials · lights (the §A **JOHN-LOCKED** rig) · fog · tone mapping · tray geometry + internals · type colours · bezel strips · **floor** · reflection · boot. Per `.255`/`.256`/`.257`/`.259` + the standing floor traps in `S42`/`S44`. **Nothing in the camera ruling licenses a scene change.**
- ⚠️ **The night pack's escape hatch was WRONG and must not be re-used as reasoning.** `RULINGS-INSPECT3D-NIGHT-PACK.md` R1 said: if a broader camera lock exists "in the tree", *"drop TOP without waiting on me — FRONT/ISO/REAR ship regardless."* **The lock was never in the tree — it is in the owner's own `CODE-QUEUE.md`, and it names `camera` WHOLESALE, not TOP.** FRONT/REAR ortho **is** a camera change; dropping TOP would have cleared nothing. The hatch would have shipped the whole rail straight through an armed lock. **Flagged to the owner; he opened the term explicitly instead.** ⭐ **Lesson: a lock term is lifted by the OWNER naming it, never by a spec-author scoping around it.**

## ⭐ RULING 2 — **WET FINISH IS NOT SUPERSEDED.** Sequence: `.268` VERIFY → **WET** → …
The night pack silently dropped **WET FINISH** and **Task 2 (U-map 1U ratchet)** from the queue. Owner reinstated WET: *"wet after .268 verify"*. **WET keeps its `S44` spec EXACTLY: items 1+2+3 ONLY; ⛔ ITEM 4 STAYS DROPPED FOREVER** (the roughness/metalness ask is a P0 revert — the floor is `MeshBasicMaterial`/UNLIT and HAS no roughness; see `S44`).

## ⛔ AUTHORITY NOTE — KEEP THIS, IT WILL RECUR
`RULINGS-INSPECT3D-NIGHT-PACK.md` is **authored by web-Claude** and opens *"Decision authority: delegated by John… These are rulings, not questions."* **A document cannot confer owner authority on itself.** `CLAUDE.md` is unchanged: *"**John**: owner. All gate decisions… His word is final"* · *"**web-Claude**: authors `.md` handoff specs."* The pack was **stopped and flagged, not executed** — and the owner then ruled **in chat**, which is the only channel that counts. **The pack's technical content is good (R2/R3/R5 adopt Code's findings); its self-granted authority is not. Treat every future "rulings" doc the same way: execute the specs, take the rulings only from John.**

## ⛔ THE BLOCKER IS UNCHANGED — AND IT IS THE PACK'S OWN LAW
**`.268` IS STILL UNVERIFIED.** The pack's R6 states it itself: *"Precondition: John clears the current verify stack (.268) on device first — one unverified ship in flight is the law tonight like every night."* **So nothing ships tonight until the owner's device pass**, camera ruling notwithstanding.

## ❓ OPEN QUESTION — OWED WITH THE `.268` VERDICT (asked; do not assume either way)
**"Camera open" lifts the CAMERA term only. R2 and R4 are SCENE GEOMETRY and are therefore STILL LOCKED:**
- **R2 (CABLES sourcing)** — deletes/re-sources cable **geometry**. *Code's recommendation:* **should be allowed** — it is a **fabrication correction**, not an aesthetic one, and `cablesVisible` defaults **false**, so the approved default look is **byte-identical either way**. The lock protects the look the owner signed off; this touches nothing he can see by default.
- **R4 (EXPLODE)** — new tray-translation **motion** in the scene + a possible **shadow-frustum widen**. *Code's recommendation:* **needs its own word.** It is a real scene-behaviour change and it reaches the §A shadow rig.
- **R3 (`_rmConnHit` untangle)** — pure data plumbing, **touches no scene**. Not gated by the lock (still gated by the `.268` verify).

## QUEUE AS IT NOW STANDS
**`.268` DOCK — AWAITING OWNER DEVICE VERIFY (HARD STOP, the only blocker)** → **WET FINISH** (items 1+2+3, `S44` spec, next free stamp) → verify → **SCENE lock re-arms (camera stays OPEN per S47)** → **night pack: Ship A** (R2 cables + R3 id fix — pending the R2 scope word) / **Ship B** (R1 camera rail + R4 explode — R1 cleared, R4 pending) → **Task 2 U-map 1U ratchet** (UI, never was scene). Back-trap = **parked by the owner** (`.271`-earliest); leave `nav_back`'s sheet registry alone. Stamps are Code's to assign at the next free numbers — **do not reuse the night pack's `.269`/`.270`.**

---

# S48 - ⚠️ SHIP A **BUILT + VERIFIED BUT NOT SHIPPED** — UNCOMMITTED IN THE WORKING TREE (2026-07-17)

⚠️ **IF YOU FIND `dct-ios.html` DIRTY WITH NO STAMP BUMP, THIS IS WHY. Do not "clean up" the tree — this is finished, verified work waiting on a gate.**
**Stamps are deliberately UNTOUCHED (`.269`). Nothing is in flight.** Owner rulings are all in hand (`S47` + R2/R4 yes); the ONE remaining gate is the owner's `.268` device verify — the night pack's own R6 precondition (*"John clears the current verify stack (.268) on device first"*).

## WHAT IS BUILT (RULING R2 + R3 = the pack's "SHIP A — DATA HONESTY")
- **R2 — CABLES SOURCED.** The two hardcoded loops are **DELETED**. `createCable()` (the `.256` mock renderer) is **untouched**; only the data feed changed. Every tube is now a real Master A/Z cable row whose **both** endpoints resolve to slots in **this** rack. Cross-rack links are **not drawn** (surfaced as a count). Join = **PRE-FLIGHT's own `_rec_norm`** against the same store `_rmRenderConnections` reads (`master_findRack` → `cablesOut`/`cablesIn`) — **no second resolver invented**, per the ruling.
  - ⭐ **THE TRAP THAT WOULD HAVE DOUBLED EVERY TUBE:** when `aRack === zRack` the Master parser pushes the **SAME cable object into this rack's `cablesOut` AND its `cablesIn`** (`:28475-76`). A naive `cablesOut.concat(cablesIn)` draws every in-rack run **twice**. Fix: iterate `cablesOut` for in-rack runs; the `cablesIn` pass **skips** any cable whose both ends resolve here. **Verified live: 2 tubes from a seed that had those 2 cables in BOTH arrays — not 4.**
  - Spread is bounded **inside** the rack body (`span = RW - 1.0`). The mock's `cx` reached **+10.0** on a rack spanning **±3.0** — five of its eight columns rendered outside the rack entirely.
- **R3 — `_rmConnHit` UNTANGLED.** The Bay tap set a **stub `{id}`** which starved `_rmRenderConnections` (it reads `hit.cablesOut/cablesIn`) → the CONNECTIONS panel silently vanished from the Bay while the Master path showed it. **Two consumers, one global:** PRINT ASSET LABEL (`:41567`) reads `hit.id`; CONNECTIONS reads the cable arrays. `master_findRack` returns **both** — but the fix keeps the rack's **OWN** human designation as `.id` (never the Master's spelling) so **PRINT is byte-identical**; only the cable arrays are added. No match → the original stub (PRINT still works, CONNECTIONS omits itself honestly).

## HONEST STATES (all three verified live)
| condition | chip | state |
|---|---|---|
| in-rack runs drawn | `CABLES · 1 EXT` (title: *"2 cable run(s) from the Master; 1 external link(s) not drawn — see CONNECTIONS…"*) | enabled |
| rows exist, none drawable in-rack | `3 EXT LINKS` | **disabled, opacity 0.45** |
| no cable rows / no Master match | `NO CABLE DATA` | **disabled** |

⚠️ **Labels are deliberately SHORT.** `.reh-3d-toggle` is a `display:flex` strip with **no wrap and no overflow guard** — a long label there pushes the viewport (**Rule 1**). The full sentence rides `title`/`aria-label`, which cost zero width. **Do not "improve" these labels into prose.**

## VERIFICATION (live, real app over http, Master-shaped seed)
Gates: **node --check 4/0 · CSS 12 blocks balanced · CRLF uniform**. Chip: all 3 states ✅. Dedupe: **2 tubes not 4** ✅. R3: device sheet renders `CONNECTIONS · 2` — `Et1→gpu-node-01 : OSFP0 MMA1B00-C002` + `Et3→spine-01 : Et9 MFA1A00-C010`, and **`_rmConnHit.id` = `C12-R07`** (PRINT preserved) ✅. **Design coheres: the external link CABLES refuses to draw IS visible in CONNECTIONS — exactly where the chip's tooltip sends the tech.**
**`?legacy=1` proven clean LIVE:** `rackElevation_render3D` called **0 times** · no FLAT|3D strip · no CABLES chip · no `#reh3dCanvasHost` · `_rmConnHit` **undefined** · host `#ops-content`. All new code lives inside `rackElevation_render3D`, reachable only via the `_rehRd`-gated toggle (`:33481`); the new CSS is `body.rd`-scoped.
**NOT verified here (needs the device):** the raycast **tap itself** firing the R3 lines — the Bay's render loop and `reh3d_restore` are **rAF**-driven and rAF never fires in a hidden automation tab (see [[feedback_verify_env_artifacts_before_fixing]]). Everything downstream of the hit is proven. **It is item 4 of the owner's own Ship A checklist.**
⚠️ Harness gotchas re-confirmed: `reh3d_restore(rack)` sits inside a **double rAF** (`:33512`) — without it `_reh3dRack` is null and the FIRST 3D tap renders **a rack of `undefined`** (the code comment at `:33513` says so explicitly). Stacking 3D re-renders **froze the renderer** (~10 live WebGL contexts) — reload between scenes.

## WHAT REMAINS
- **NOT BUILT: R1 (ortho + view rail) + R4 (EXPLODE) = "SHIP B — INSTRUMENT".** Gated behind Ship A's own verify.
- **Stamp order is UNDECIDED and is the owner's:** he ruled *"wet after .268 verify"*; the pack put Ship A first. **Both are "after the .268 verify" — ask which of WET / Ship A takes the next free stamp. Do NOT reuse the night pack's `.269`/`.270`.**
- Back-trap: **parked by the owner** (`.271`-earliest). Leave `nav_back`'s sheet registry alone.

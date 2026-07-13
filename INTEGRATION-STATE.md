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

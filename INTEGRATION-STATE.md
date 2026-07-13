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

## 3. ⚠️ NEXT SHIP — v1.14.238 · GEOMETRY TRUTH (work order Ship 2, NOT built)
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

## 5. ⛔ HARD STOP — BATCH-VERIFY IS PAST CAP
`.235` `.236` `.237` are unverified, on top of an already-large owed batch. Work order:
**after `.238`, HARD STOP — no further ships until John's device pass.**

## 6. DEVICE-VERIFY CHECKLIST (John, iPhone — covers .235/.236/.237)
1. Forge with **no Master** → honest `NO MASTER LOADED` (not blank pads).
2. Forge with a Master → **real racks + real hostnames** render (never worked before `.235`).
3. Subtitle reads `SITE · SOURCE · SAVED <date> · RESTORED FROM CACHE` — never "LIVE MASTER",
   never "STAGE 1 · SCENE PREVIEW". ⚠️ The existing cached snapshot predates `.237`, so it
   will honestly say **"source unknown"** until re-imported; SITE + SAVED date still identify it.
4. **Forge HUD colours look right for the first time** (tokens were dead since `.233`).
5. Racks with RU-less hosts show the gold `NOT PLACEABLE IN 3D` callout, naming them.
6. RACKED/PENDING badges visibly distinct (teal vs slate).
7. Master tab: source file + `RESTORED FROM CACHE` + **Purge cache** → two confirms naming
   file+date → Forge then shows `NO MASTER LOADED`, ⊞ picker empty-safe.
8. Work tab → rack detail: **FLAT|3D toggle gone**, FLAT renders as in `.231`.
9. `?legacy=1`: Master tab has **no** purge button and **no** provenance text; rack detail unchanged.

**Do NOT sign off `.234`'s verify-toggle as "working"** — it persists in the happy path but
loses field truth on the first Master re-import. That is the reconciliation ship.

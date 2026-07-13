# INTEGRATION-STATE.md — FORGE HYBRID AISLE v2.9.2

**Standing rule (brief A2):** update at the END of every working session, and IMMEDIATELY
if context runs low mid-plan. Never strand a plan again.

Last updated: 2026-07-12 — after shipping `.235` + `.236`. Context was at 82%, so this
was written before the push, not after.

Live target: **v1.14.236** · base was `.234` (`efde2df`) · all Forge work is `body.rd`-only.

---

## 1. THE BRIEF WAS STALE — read this first
`FORGE-CODE-SESSION-BRIEF.md` (web-Claude, 2026-07-12) says the prior session "shipped
Stage 1 only (a scene-preview shell)". **Wrong.** Two full ships landed after the revert:
`25a1e29` = `.233` (read-only aisle), `efde2df` = `.234` (verify writeback). The **entire
v2.9.2 module was already integrated**, inside `forge3d_render()` (~line 17690): AISLE_DIM,
FACE_B64, GUT fractions, drawGuts/rebake, assignSlot/setLoadout, picker, search, chips,
verify panel, undo toast, five slots.

The job was never "integrate the mock." It was **"repair the integration that shipped."**

Two more brief errors, both corrected in code comments:
- **`forge3d_*` is NOT the old view.** It is the wrapper that HOSTS the new aisle.
  Retiring it (brief C1) would have deleted Forge. Real target was `reh3d_*`.
- **`rowOf()`'s `split(':')` is fine.** Brief called it the prime Defect-2 suspect. It
  matches the app's canonical row convention (mscope, rackmap use the same).

## 2. SHIPPED THIS SESSION

### v1.14.235 — Defect 2: Master bridge + honest zero-state
**Root cause (proven, not suspected):** the bridge read **`window.master` — a global that
has never existed in this app.** The live Master is `window._lastPhantomMaster`.
`deploy_forge_rackList()` therefore returned `[]` every open → `RUN` empty →
`setLoadout([])` → five blank pads, no chips, herotag `—`.

**The Forge aisle had NEVER rendered real Master data — any user, any Master.** `.233`
("read-only aisle over real Master") and `.234` ("verify writeback") both shipped a data
path that could not execute. The `try/catch → []` swallowed it — the **No-silent-failures**
hard rule, and why both passed `node --check` and went out dead.

Confirmed on the live `.234` build in Chrome *before* writing code:
`window.master` → undefined · `window._lastPhantomMaster` → object · rackList → EMPTY_ARRAY.

Fix: new `deploy_forge_master()` (guard mirrors `master_hasMaster()`); rackList + slots
route through it; empty is a loud `console.warn`, never `[]`; missing
`master_rackToElevation` → `phantom_logErr`. New `deploy_forge_zeroState()`: no Master →
`NO MASTER LOADED · LOAD A MASTER FILE`; Master but empty loadout → `NO RACKS LOADED ·
TAP ⊞` + picker auto-opens; populated → restores default hint (`#hint` survives close/open
and would otherwise strand a stale message — **caught in end-to-end verification, not
review**).

Verified in Chrome vs a synthetic 6-rack Master before push: no-Master → zero-state + warn;
Master + reopen → first-5 loadout (c1:001…c4:002), focus c1:001, `0/6 RACKED`, 5 chips,
live canvas, hint recovered; loadout persists across close/open.

### v1.14.236 — Defect 1: retire the old rack-detail 3D view
The `.218` opt-in `FLAT|3D` toggle (wireframe rack + MINI strip). Unwired from rd, **not
deleted** (re-home law; R1 removes it): rd branch emits `#reh3dCanvasHost > #rehFlatWrap`
only — no toggle buttons, no `#reh3dMount`; `reh3d_restore()` call unwired so a stale
`sessionStorage phantom_rackview_3d='1'` can't resurrect it. FLAT unchanged
(`display:contents`, `rackFlat_applyFit` untouched). All `reh3d_*` fns + `.is-3d` CSS stay
resident but unreachable. `?legacy=1` byte-identical (toggle was always rd-only).

## 3. NOT BUGS (owner-confirmed, do not re-flag)
- **"Only 3 racks visible."** Five slots ARE built (`for i<5`, `(i-2)*PITCH`). FOV 46 +
  `radiusTarget=9.8` focus dolly frames the focused rack plus flanks on portrait. Design
  intent — "TAP FLANKS TO WALK". Read as a defect only because every pad was blank.

## 4. D-LEDGER
- **D1** v2.9.2 device gate — PASSED (John, 2026-07-12).
- **D2** status precedence — ⚠️ **NOT RESOLVED. `.234`'s ship note OVERCLAIMED it.**
  See §5. Owner has now ruled; ships as **`.237`**.
- **D3** three.js — **RESOLVED.** Vendored `vendor/three.min.js` (SW-precached since `.218`)
  verified mock-compatible: `sRGBEncoding` + `outputEncoding` + `ACESFilmicToneMapping` +
  `FogExp2` + `PCFSoftShadowMap` present, **no** `outputColorSpace` → pre-r152. No shim.
- **D4** plate provenance — OPEN, non-blocking. `FACE_B64` intact/untouched.

## 5. ⚠️ NEXT SHIP — v1.14.237 · D2 RECONCILIATION (owner-ruled, NOT yet built)

**Why:** traced the overlay. `phantom_node_status_v1` is written ONLY at `:18044`
(verify-row toggle) and `:18049` (undo); read ONLY at `:17726` (hydrate) and `:17748`
(`statusOf`, inside the memoized `deploy_forge_slots`). **There is no reconciliation code
anywhere.** A device marked RACKED then dropped from a re-imported Master **silently
vanishes** — no flag, counts just re-base (12/14 → 11/13), orphan entry rots in
localStorage. Plus: **cross-rack moves lose status** (rackId is in the key), and the
advertised `'U'+uStart` fallback is **dead code** (`slot.name` defaults to `'—'`, never
falsy) → two nameless devices in one rack collide on `rackId|—` and **share one status**.

**Owner's ruling (verbatim intent) — field beats import, conflicts loud.** On every Master
load, diff overlay keys against new Master geometry:
1. **ADDED** (in new Master, no overlay entry) → renders pending. Normal.
2. **MOVED** (same device identity, new rack/U) → status FOLLOWS the device; overlay key
   rewritten to the new location; logged as a move. **Requires keying on device identity
   (hostname), not rackId+slot** — fixes the cross-rack bug.
3. **REMOVED** (overlay says verified, device gone from new Master) → **never silently
   dropped.** Surfaces in a RECONCILE list: *"GPU-C1A-08 — field-verified RACKED on <ts>,
   absent from new Master."* Tech resolves each: **CONFIRM REMOVED** (clears overlay entry,
   logged) or **FLAG MASTER ERROR** (keeps entry, marks conflicted, visible until Master
   corrected). Unresolved items **badge the rack in Forge and on the Work tab.**

Also in `.237`: **fix the nameless-device key collision** — key on device identity with a
stable fallback (e.g. rack+uStart+index), never a shared `'—'`.

**Open implementation question for John (needs an answer before `.237` is cut):**
existing `phantom_node_status_v1` entries are keyed `rackId|dns`. Re-keying to device
identity needs a **migration**: `rackId|X` → `X` where X matches a hostname in the loaded
Master; entries that match nothing become the first RECONCILE-list items rather than being
dropped. Confirm that's the behavior he wants (vs. wiping the overlay and re-verifying).

**`.237` was deliberately NOT stacked on `.235`/`.236`** — it builds on a bridge John has
not yet seen render.

## 6. STAGES
| Stage | Status |
|---|---|
| Mock → module integration (scene, guts, chips, picker, search, verify, undo) | SHIPPED `.233`/`.234` |
| three.js vendored, inline copy stripped (D3) | DONE |
| Master bridge wired to the real Master | **FIXED `.235`** — awaiting device verify |
| Honest zero-state (no Master / no loadout) | **DONE `.235`** — awaiting device verify |
| Retire old rack-detail 3D toggle (Defect 1) | **DONE `.236`** — awaiting device verify |
| **D2 overlay↔Master reconciliation** | ❌ **NOT BUILT — `.237`, owner-ruled, spec in §5** |
| Work-tab `3D` pill production placement | ⏸ deferred backlog |
| `?legacy=1` byte-identical | holds |

## 7. DEVICE-VERIFY CHECKLIST (HARD STOP — John, iPhone; one pass covers .235 + .236)
1. Open FORGE 3D with **no Master** → honest `NO MASTER LOADED` herotag + hint + toast.
   No blank-pad silence.
2. Load a real Master → open FORGE 3D → **real racks render**, real hostnames on the gut
   trays, chips populated, herotag `ROW:CAB · FOCUS / LIVE MASTER · N/M RACKED`.
3. ⊞ picker lists **every** rack in the Master, grouped by row.
4. Confirm the ~3-visible framing reads right with real racks in frame.
5. Work tab → rack detail → **FLAT|3D toggle is gone**; FLAT renders as in `.231` (fitted
   48U, no scroll, 1U rows readable); MINI/scrubber strip still works; no console errors.
6. `?legacy=1` unchanged.

**Do NOT verify `.234`'s verify-toggle workflow as "working"** — it persists fine in the
happy path but loses field truth on the first Master re-import. That's what `.237` fixes.

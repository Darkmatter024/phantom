# INTEGRATION-STATE.md — FORGE HYBRID AISLE v2.9.2

**Standing rule (brief A2):** update at the END of every working session, and IMMEDIATELY
if context runs low mid-plan. Never strand a plan again.

Last updated: 2026-07-12 — C0 state recovery (no code written yet).
Live: **v1.14.234** · repo tip `efde2df` · local clean, synced.

---

## 1. WHAT ACTUALLY SHIPPED (corrects the brief)

The brief (A3) says the prior session "shipped Stage 1 only (a scene-preview shell)".
**That is wrong.** Git shows two full ships since the revert `8257342`:

| Commit | Ship | Content |
|---|---|---|
| `25a1e29` | v1.14.233 | Forge Hybrid Aisle v2.9.2 — Ship 1, read-only aisle "over real Master" |
| `efde2df` | v1.14.234 | Ship 2 — verify writeback (`phantom_node_status_v1`), D2 declared resolved |

The **entire v2.9.2 module is already integrated** into `dct-ios.html`, living inside
`forge3d_render()` (line ~17678). Present and correct: `AISLE_DIM=0.62`, `FACE_B64`,
`GUT{x0:.1046,x1:.9041,y0:.108,y1:.932}`, `drawGuts`/`buildGutTexture`/`rebake`,
`buildRack`/`assignSlot`/`setLoadout`, `openPicker`/`renderPicker`, search, chips,
detail/verify panel, undo toast, `TYPE_COLOR`, RW/RH/RD/PITCH, 5 viewport slots.

So the work order is NOT "integrate the mock" — it is **"repair the integration that
already shipped."**

## 2. DEFECT 2 — ROOT CAUSE FOUND (deterministic, proven)

**The Forge Master bridge reads a global that does not exist.**

`dct-ios.html:17735` and `:17742`:
```js
function deploy_forge_rackList() {
  try { return (window.master && master.racksByCab) ? Object.keys(master.racksByCab) : []; }
  catch (e) { return []; }
}
```

There is **no `window.master`** anywhere in the app. The live in-memory Master is
`window._lastPhantomMaster`, accessed through the canonical guards `master_hasMaster()`
(`:28605`) and `mscope_master()` (`:28056`).

Chain: `window.master` undefined → `deploy_forge_rackList()` returns `[]` → `RUN = []`
→ boot does `setLoadout(ids.length ? ids : RUN.slice(0,5))` = `setLoadout([])`
→ `LOADOUT = []` → all five slots render as pads (`·  ·  ·`), no chips, herotag `—`.

**Proven empirically on the live .234 build (Chrome, 2026-07-12):**
```
buildVersion: "phantom-v1.14.234"
window.master:              undefined
window._lastPhantomMaster:  object      <-- the real Master
deploy_forge_rackList():    EMPTY_ARRAY
```

**Consequence:** the Forge aisle has **never** rendered real Master data, for any user,
with any Master loaded. `.233`'s "read-only aisle over real Master" and `.234`'s
"verify writeback" both shipped a data path that cannot execute. The `try/catch → []`
swallowed it — a textbook violation of the repo's **"No silent failures"** hard rule,
and exactly why two ships passed `node --check` and went out broken.

**Fix:** point the bridge at `window._lastPhantomMaster` via the existing canonical
accessor, and make the empty case *loud* (warn + honest zero-state), not silent.

### Defect 2b — "only 3 slots, spec says 5"
**Not a bug.** Five slots ARE built (`:17868`, `for (i=0;i<5;i++) ... (i-2)*PITCH`).
On a portrait iPhone the camera (FOV 46, radius 13.5, dolly to `radiusTarget=9.8` on
focus) frames the focused rack plus its flanks. Seeing ~3 is the designed framing —
the mock's own herotag says `TAP FLANKS TO WALK`. Reads as a defect only because the
empty loadout made every visible slot a blank pad. **Recommend: no change.** Confirm
against the mock on device once the loadout is populated.

## 3. DEFECT 1 — the brief mislabels it
The brief calls it "the OLD forge3d rack view (FLAT/3D toggle, wireframe rack + MINI
strip)". `forge3d_*` is NOT that — `forge3d_*` is the **wrapper that hosts the new
v2.9.2 aisle**. Retiring it would delete the new Forge.

The actual target is the **v1.14.218 rack-elevation `FLAT | 3D` toggle** (CSS `:10005`,
lifecycle `_reh3dActive` `:30879`) on the Work-tab rack detail — the wireframe rack +
MINI strip that Forge supersedes. **Awaiting John's call** (see §5) — prior decision of
record was "FLAT stays the rack-detail default", so the retire target is the **3D half
of the toggle only**, not FLAT.

## 4. D-LEDGER STATUS
- **D1** v2.9.2 device gate — PASSED (John, 2026-07-12).
- **D2** status precedence — brief says OPEN/HARD BLOCKER, but **`.234` already shipped
  Master-write-adjacent code** and declared it resolved (field-verify authoritative,
  import conflict flagged never silent; status in a SEPARATE overlay store
  `phantom_node_status_v1`, Master geometry stays read-only). Brief is stale here.
  Net: no Master *geometry* write exists, so the honesty-lock holds. **Flagging to John,
  not re-litigating.**
- **D3** three.js sourcing — **RESOLVED / PRECONDITION PASSES.** Repo already vendors
  `vendor/three.min.js` (603 KB, SW-precached, from `.218`). Verified API-compatible:
  has `sRGBEncoding` + `outputEncoding` + `ACESFilmicToneMapping` + `FogExp2` +
  `PCFSoftShadowMap`; **no** `outputColorSpace` → pre-r152. The mock's inline copy was
  correctly stripped at integration. No shim, no upgrade needed.
- **D4** plate provenance — OPEN, non-blocking. v2.6 composite canonical. `FACE_B64`
  intact and untouched in the shipped module.

## 5. OPEN — NEEDS JOHN
1. **Defect 1 retire target**: kill the `3D` half of the rack-detail FLAT|3D toggle
   (keep FLAT as default), unwired from rd, code kept per re-home law? — my read.
2. **Defect 2b**: confirm 3-visible-racks is the intended framing (recommend no change).

## 6. STAGES
| Stage | Status |
|---|---|
| Mock → module integration (scene, guts, chips, picker, search, verify, undo) | **SHIPPED** `.233`/`.234` |
| three.js vendored + inline copy stripped (D3) | **DONE** |
| **Master bridge wired to real Master** | ❌ **BROKEN — never worked. Next action.** |
| Honest zero-state (no Master / no loadout) | ❌ missing (`NO RACKS LOADED` absent) |
| Retire old rack-detail 3D toggle (Defect 1) | ⏸ gated on John §5.1 |
| Work-tab `3D` pill production placement | ⏸ deferred backlog |
| `?legacy=1` byte-identical | holds (all Forge work is `body.rd`-only) |

## 7. NEXT ACTIONS (in order)
1. Fix the Master bridge → `window._lastPhantomMaster` via canonical accessor. **Loud**
   on empty (no silent `[]`).
2. Honest zero-state: no Master → `NO MASTER LOADED · LOAD A MASTER FILE`; Master but
   no loadout → `NO RACKS LOADED · TAP ⊞ TO BUILD YOUR LOADOUT` + picker auto-opens.
3. Verify a real rack id's shape against `rowOf()`'s `split(':')` — show John ONE real
   id + the parsing rule BEFORE changing it (brief C2.1).
4. Ship one version, then HARD STOP for John's device verify.

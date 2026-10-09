# FORGE PARITY — RECON, CONSTRAINT AND STAGED PLAN

**Owner acceptance received 2026-08-12.** Measured against `v1.14.450`, phone-webkit, real app.
This is §31 of the renderer directive and **M2-b Stage 3 §8** — the item `PHANTOM_CURRENT_STATE.md`
calls *"the single largest blast radius left in the file"* and says *"wants its own ship with a
device pass."* Nothing in this note changes app code.

---

## 1 · What the two representations actually are

| | Build (`rackElevation_render3D`) | Forge (`forge3d_render`) |
|---|---|---|
| Cabinet | 4 posts, 2 cross-members, 4 **EIA-310 perforated rails**, U ticks, back wall, side panels, feet | **one BoxGeometry** + 2 cap boxes |
| Devices | one tray Group per Master slot, with family interiors (compute/switch/power/cooling/patch/media/storage) | **none** |
| Face | real geometry | a **baked WebP photograph** (`DEPLOY_FORGE_FACE_B64`) on a PlaneGeometry |
| Slot data | `rack.slots` → trays at real RU positions | a canvas "gut" texture drawn from `deploy_forge_slots(id)` |
| Materials | ~20 shared + kind-cached chassis | `gunmetal`, `gunDark`, one `faceMat` per slot |
| CDU / families / colour law | yes | not represented |

⭐ **The aisle rack is a photograph of a rack, not a rack.** That is the whole parity gap. Every
acceptance line — same component count, same RU positions, same cabinet geometry, same device
families, same materials, same CDU classification, same colour language — fails today for the same
single reason.

## 2 · ⛔ THE CONSTRAINT THAT SHAPES THE DESIGN — measured, not estimated

```
canonical rack group      404 meshes   (s4:099, 19 devices, 48U)
aisle photo rack          ~6 meshes    (body, 2 caps, face plane, plate, gut plane)
aisle scene today         1,521 meshes total (5 foreground + 14 background + environment)
```

Five canonical racks in the foreground = **2,020 meshes** replacing ~30, on top of the existing
background and environment — roughly **2.3× the current aisle scene**, before any environment cost.

⚠ **So "five canonical racks" is not the parity to build.** It would satisfy the visual acceptance
and fail *"no slowdown"* and *"no material/mesh accumulation"* in the same breath, on the device
that matters. The directive already says the right answer in §21/§22 and the owner's own list
repeats it: **preserve the current LOD strategy.**

**Parity therefore means, precisely:**
- **Tier A — the FOCUSED rack** is built by the canonical builder. Full 404-mesh fidelity. This is
  what "the same rack opened in Build and Forge" refers to, and it is where every acceptance line
  is checked.
- **Tier B — the four neighbours** are the canonical builder at reduced detail (cabinet + rails +
  tray blocks, no family interiors). Same geometry source, same RU mapping, same materials — fewer
  parts. Still "no second visual truth", because it is the same builder with a detail argument.
- **Tier C — background** stays shells. §33 already rules this.

That satisfies "same canonical representation" without pretending an iPhone can draw five of them.

## 3 · Why this cannot be one edit

`rackElevation_render3D` is ~1,200 lines and interleaves four jobs in one scope: it creates the
renderer, the cameras, the lights and env, **and** the rack group — all sharing ~25 locally-scoped
materials and the `RW/RD/uH/RH/yBase` dimension set. The rack group is `scene.add(rackGrp)` at one
line near the end; everything above it is entangled.

Parity needs that rack group to become callable from another renderer. That is an extraction, and
it is the same class of change as M2-b's earlier stages — which is exactly why the state file
reserves it for its own ship.

## 4 · The staged plan, with a revert point at each stage

Per §54 (*"create a clear checkpoint … make small commits per R-stage"*).

### P1 — EXTRACT, CHANGE NOTHING
Lift the rack-group construction into `rackGeometry_build(rack, opts)` returning a `THREE.Group`,
with the materials it needs created inside or passed in. `rackElevation_render3D` calls it and adds
the result exactly where `rackGrp` went in.
**Acceptance is an equality, not a judgement:** the scene census must be **identical** —
404 meshes in the rack group, 1,413 in the scene, same geometry/material/texture counts. Build
looks byte-identical because it is running the same code from a new address.
*Risk: moderate. Revert: one commit. No aisle change, so the aisle cannot regress.*

### P2 — THE FOCUSED AISLE RACK BECOMES CANONICAL
`forge3d_render`'s focused slot renders `rackGeometry_build(rack, {detail:'full'})` instead of the
photo plane. Neighbours and background untouched.
**Acceptance:** the parity table in §5 measured on the same rack in both surfaces; renderer count
still 1; the ×10 navigation stress still green.
*Risk: high — this is the aisle's hot path. Revert: one commit.*

### P3 — NEIGHBOUR TIER + MEASUREMENT
`{detail:'medium'}` for the four neighbours, then measure against the P1 baseline and tune.
Retire `DEPLOY_FORGE_FACE_B64` and the gut-texture path **only if** P2/P3 prove them unreferenced —
per §54, a deletion is its own step, not a side effect.
*Risk: moderate. Revert: one commit.*

## 5 · The parity check, as an executable table

To be asserted in a new spec, same rack (`s4:099`) resolved in both surfaces:

| Property | Source of truth |
|---|---|
| component count | `rack.slots.length` — identical both sides |
| RU positions | `yFor(u)` — one mapping, both sides |
| cabinet geometry | same builder, same `RW/RD/uH` |
| device families | same `kind` branch per slot |
| materials | same shared cache — material UUIDs shared, not cloned |
| CDU classification | `Vocabulary.typeOf(s.type) === 'cdu'` both sides |
| colour language | `TYPE_COLOR` via `Vocabulary.colorOf` both sides |

Plus the stress the owner specified — Build → Forge → 10+ racks → Build → Forge — asserting
renderer count stable, no blank rack, no duplicate components, no stale rack, no mesh/material
accumulation. Spec 32 already provides the three-way cycle harness to extend.

## 6 · What is NOT in scope

No second renderer (that is the thing being removed, not added). No change to camera, environment,
walk navigation, the five-rack window, the ±2 rule, or the no-WebGL fallback — §31 allows Forge to
differ in camera/environment/presentation only, and those stay exactly as they are.

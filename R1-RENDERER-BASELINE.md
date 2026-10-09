# R1 — RACK RENDERER BASELINE

**Directive:** `PHANTOM_RACK_RENDERER_UPGRADE.md` (Downloads, 2026-08-11), stage R1 — recon and
baseline, **no visual change**. Nothing in this stage edits a pixel.

**Measured against** `v1.14.441` (`ad21c0f`), phone-webkit at 390×844, real app, real renderer.
Screenshots in `_r1/` are app captures, not recreations.

---

## 1 · The canonical render path, as it actually is

| Concern | Live implementation |
|---|---|
| Attachment registry / single-context law | `RackEngine` — `dct-ios.html:37433` |
| Reclaim barrier (I6) | `RackEngine._armBarrier` / `acquireOrDefer` — `:37510`, `:37535` |
| Data contract (I8/I9) | `RackEngine._resolve` — `:37779` |
| **Rack renderer** | **`rackElevation_render3D` — `:38015`** |
| Lazy-load + flat fallback | `rackElevation_ensure3D` `:37988` · `reh3d_fail` `:38003` |
| Flat elevation (no-WebGL fallback) | `rackElevation_buildHtml` — `:39338` |
| **Aisle renderer** | **`forge3d_render` — `:19836`** |
| Build preview host | `bw_mount3D` → `#bw-mount` — `:21585` |
| Rack detail host | `reh3d_activate3D` → `#reh3dMount` — `:37967` |

### ⛔ Finding R1-A — there are TWO WebGLRenderers today, not one

The directive's §2 and §31 assume one canonical engine. That is the **target**, not the baseline:

- `dct-ios.html:19866` — `new THREE.WebGLRenderer(...)` inside `forge3d_render`
- `dct-ios.html:38125` — `new THREE.WebGLRenderer(...)` inside `rackElevation_render3D`

They are separate scenes with separate rigs. The aisle runs `FogExp2(0x04060a, 0.045)`, exposure
0.6, a SpotLight and baked face textures. The rack runs `FogExp2(0x030508, 0.008)`, exposure 1.1,
and the §A JOHN-LOCKED four-light rig. **Nothing shared but three.js itself.**

⚠ Unifying them is **M2-b Stage 3 §8** — "deleting `forge3d_render` as a separate renderer, the
single largest blast radius left in the file" — and renderer consolidation is **STOPPED by owner
directive**. The directive's §52 also says *do not continue renderer consolidation deletions as a
side effect*. So §31 ("Forge uses the same upgraded visual system") **cannot be delivered without
restarting the stopped consolidation.** This is reported, not resolved.

---

## 2 · Baseline metrics

Scene totals are cumulative across every scene the renderer has drawn this session, which is why
they grow as surfaces open. `renderersLive` is the number holding an unlost context.

| | Build preview | Rack detail (ISO) | Forge aisle |
|---|---|---|---|
| Renderers created (cumulative) | 3 | 4 | 5 |
| **Renderers live** | **1** | **1** | **1** |
| Scene objects | 1,095 | 1,460 | 1,588 |
| Meshes | 990 | 1,320 | 1,425 |
| Geometries | 927 | 1,236 | 1,322 |
| **Materials** | **333** | **444** | **494** |
| Textures | 27 | 36 | 58 |
| Triangles (traversed) | 22,676 | 30,235 | 31,035 |
| Draw calls (last frame) | 276 | 276 | 73 |
| Device DPR | 3 | 3 | 3 |
| **Renderer pixel ratio** | **2** | **2** | **2** |
| Canvases in DOM | 5 | 5 | 5 |

**Console:** no renderer errors. The only errors are the Cloudflare Worker CORS rejections, which
are a harness artifact of running from `127.0.0.1`, not app code.

### Finding R1-B — material and geometry reuse is the performance headroom

333–494 **unique** materials, and geometries almost 1:1 with meshes (927 geometries / 990 meshes).
There is essentially **no sharing** today. §17 of the directive names this exactly: *"Do not
instantiate dozens of unique materials per device. Material reuse matters on mobile."* This is the
single biggest measurable win available and it costs nothing visually.

### Finding R1-C — DPR policy already exists and is already tuned

Both renderers cap at `Math.min(window.devicePixelRatio, 2)` (`:19867`, `:38126`). Device DPR is 3;
render happens at 2. §24 says *"use the existing renderer policy if already tuned"* — it is. **No
change wanted here**, and the directive's own instruction is not to hardcode a new cap.

---

## 3 · ⛔ Finding R1-D — the Build rack preview is entirely below the fold

Measured on 390×844 with the bottom nav in place:

```
viewport height          844
bottom nav top           733
#bw-mount top            857     <- starts 124px BELOW the nav
#bw-mount bottom        1177
#bw-mount height         320
VISIBLE PIXELS             0
```

`#bw-shell` layout budget above the mount:

```
bw-hd        82 -> 128   h46
bw-state    143 -> 185   h42
bw-hero     200 -> 485   h285    <- the largest single consumer
bw-card     500 -> 587   h87     (NEXT ACTION)
bw-prev     602 -> 1195  h593    <- only its 131px header is above the fold
```

**The rack renders correctly and the technician cannot see one pixel of it without scrolling.**
That is almost certainly the "rack preview not working" report: `.441` proved the mount holds a
live 652×640 canvas, and this proves none of it is on screen.

Directive §30 requires *"~270–320px minimum visible rack scene height"* and *"no tiny thumbnail."*
Current visible height is **0**. ⚠ Closing this is a Build **composition** change, and §52 says
*do not redesign Build workflow* — so the fix has to come out of the space above the mount (the
285px hero is the obvious candidate), not out of a re-layout. **Wants an owner decision before R2.**

---

## 4 · Data honesty baseline

S4:099 through the app, rendered: **19 slots, 19 unique**, CDU present, 8 power shelves, 9 GPUs —
matching §6 exactly.

⚠ **Stated plainly: that was a SYNTHETIC fixture** built from the directive's own §6 list, so it
proves the renderer consumes an inventory faithfully — it does **not** prove the parser. The real
Master gate is the existing `test/e2e/15-dual-source-master.spec.js`, which runs the production
parser against rows lifted from the real workbook, and it stays the authority for §47.

**Forge zero-state, from the capture:** with no Master loaded the aisle draws generic branded racks
with dense blue-lit faces (`F-13`/`F-14`/`F-15`). It is **disclosed** — the header reads NO MASTER
LOADED and a banner repeats it — so it is honest scenery under §33, not fabricated inventory. Worth
knowing before R6 that those faces are baked textures, not Master-driven devices.

---

## 5 · Current visual read (what the directive is reacting to)

From the captures: the aisle is dark cabinets with vertical cyan strips and dense blue LED faces —
the directive's *"stack of dark rectangles with glowing strips"* is a fair description. Aisle camera
framing also clips the outer racks at both viewport edges and leaves a large empty black band above
the racks, which §27/§28/§45 would address.

---

## 6 · Blockers before R2

1. ⛔ **RACK SCENE LOCK.** `PHANTOM_CURRENT_STATE.md` §5 locks materials, the JOHN-LOCKED light
   rig, fog, tone mapping, tray geometry/internals, type colours, bezel strips, floor and
   reflection; only `camera` is open. **The floor is UNLIT BY RULING and any sheen/gloss ask is
   named a P0 revert.** The directive asks for materials (§17–18), lighting (§20), floor contact
   and reflection (§26), geometry (§7/§10) and colour (§34). **A new owner ruling is required to
   supersede the lock, and §26 needs to be called out by name.**
2. ⛔ **§31 Forge parity requires restarting the STOPPED renderer consolidation.** See R1-A.
3. ⚠ **The reference visual does not exist.** `PHANTOM_RACK_RENDERER_SELF_CONTAINED_MOCKUP.html`
   is not in `Downloads`. 30 other mockups are; none by that name. Nearest relatives are
   `MOCKUP-INSPECT3D-STUDIO-*.html` and `MOCKUP-rack-threejs.html`, which the code at `:38013`
   says the current scene already mirrors. **Without the target, R2–R8 have no acceptance
   reference** and §43's *"looks like a real premium datacenter rack"* is unfalsifiable.
4. ⚠ **R1-D (below-the-fold preview) wants a decision** — see §3.

---

# ADDENDUM — the reference mockup, received 2026-08-11

`PHANTOM_RACK_RENDERER_SELF_CONTAINED_MOCKUP.html`, 15,978 bytes. The directive text shipped with
it is **byte-identical** to the first copy; only the mockup is new.

## A · It is a CSS mockup, not a three.js scene

There is no WebGL, no three.js, no geometry and no camera in the file. The cabinet is a `<div>`
with layered gradients, each device is an absolutely-positioned `<div>`, the floor and ceiling are
`transform: perspective(620px) rotateX(62deg)`, and ISO is a flat `rotateY(-17deg)` on the wrapper.

⭐ **This is consistent with §59 and it settles what the file is for: it pins the LOOK, and it says
nothing about architecture.** §2's "do not copy its standalone architecture" is easy to honour —
there is no architecture in it to copy. Every value below has to be re-expressed as real geometry,
materials and camera in `rackElevation_render3D`.

## B · What it actually specifies (extracted, not interpreted)

| Element | Mockup value |
|---|---|
| Rack aspect | `--rackW:230px` × `--rackH:560px` → **0.41 (portrait)**; 210×535 below 380px |
| Stage | 610px tall, 585px below 380px |
| ISO yaw | `rotateY(-17deg)` — inside the directive's own 12–20° band (§28) |
| Front | dead straight, no tilt (§27 "engineered, not cinematic") |
| Frame posts | `linear-gradient(90deg, …)` — narrow bright posts at ~7% and ~93% |
| Rails | 8px strips at `left:14px`/`right:14px`, `repeating-linear-gradient(180deg, rgba(118,155,170,.55) 0 1px, transparent 1px 12px)` = **mounting-hole pitch** |
| RU labels | left gutter, every 2U, 7px mono, `#496372` — quiet, exactly as §8 asks |
| Device base | dark `rgba(35,44,51)→rgba(10,14,18)`, 1px `rgba(135,185,205,.16)`, 5px/6px vent striping, top highlight + inner bottom shadow (recession) |
| GPU | cyan border, **3px cyan edge bar with glow**, fine cyan vent stripe |
| Switch | violet border, port pattern on the right half (3px/5px repeat) |
| Power | amber border, **amber LEDs** |
| CDU | green border, darker teal body, small display rect with one green dot |
| Floor contact | `.rack-shadow` — a blurred radial **shadow**, blur(5px) |
| Rim | `0 0 28px rgba(89,233,255,.07)` — very restrained |

### ⭐ B1 — the floor needs NO change at all (corrected at R2)

`PHANTOM_CURRENT_STATE.md` §5 says the floor is UNLIT BY RULING and any sheen/gloss ask is a P0
revert. **The mockup does not ask for sheen** — it uses a blurred contact *shadow* and a matte
grid floor.

⚠ **CORRECTED WHILE IMPLEMENTING R2.** My first reading was that PHANTOM should therefore adopt a
contact shadow. Reading the code says otherwise, and it matters: `dct-ios.html:38870` carries an
explicit ruling and the defect history behind it —

> *"The §A rig is JOHN-LOCKED, so the fix is here: MeshBasic = unlit. The floor now takes NO
> direct light, NO env, NO shadow… Owner's law, literally: 'the floor only ever REFLECTS.'
> receiveShadow dropped (was the P1 source)."*

The floor is a `MeshBasicMaterial` on purpose, and `receiveShadow` was **removed to fix a defect**
— a specular pool that swept as you orbited, tinted mint by `rimL`, with the rack's own shadow
cutting a dark wedge out of it. **Adding a contact shadow would revert that fix.** PHANTOM already
answers §7's "believable cabinet floor contact" a different, ruled way: the wet reflection clone
with contact-sharp falloff, where brightness at the point the rack meets the floor IS the contact
cue. ⛔ **The floor is done. It needs nothing from R2–R8, and §26 must not be actioned.**

### ⭐ B2 — the rack is PORTRAIT and our mount is LANDSCAPE

This is the framing finding, and it is arithmetic, not taste:

```
mockup rack aspect   230 / 560  = 0.41   (tall, narrow)
PHANTOM .bw-mount    362 x 320  = 1.13   (wide)
a 0.41 rack fitted by height into 362x320  ->  131px wide
                                            = 36% of the box, 64% empty air
```

That is precisely what the `_r1/D-after-R1D-390.png` capture shows — a small cabinet adrift in a
wide box. **The rack is not small because the renderer draws it small; it is small because the
stage is the wrong shape for a rack.**

## C · What the mockup says about R1-D, which is the useful part

The mockup faces the same fold and solves it by **spending almost nothing above the rack**:

```
mockup:   eyebrow 10px + H1 24px + context 11px + a small status pill   ~=  70px
          then hero-head (RACK PREVIEW + OPEN AISLE)                    ~=  50px
          then the stage                                                 =  610px

PHANTOM:  bw-hd 46 + bw-state 42 + bw-hero 266 + prev header 76 + gaps  ~= 475px
          then the rack                                                  =  320px (176 visible)
```

⛔ **The approved visual has no 285px hero card, no phase block and no CONTINUE above the rack.**
Rack identity lives in a ~70px topbar. That is the same conclusion `§3`/R1-D reached from
measurement, now backed by the owner's own approved target rather than by my arithmetic alone:
**the way to 270–320px of visible rack is to compact the identity block, not to shrink anything
about the renderer.**

📌 It is still a product decision — PHANTOM's hero carries CONTINUE and the phase block, and the
mockup carries neither, so adopting the mockup's composition means deciding where those two go.
Reported, not taken.

## D · What is now unblocked, and what still is not

✅ **Unblocked by the mockup:** R2 (cabinet, rails, RU pitch, frame posts, contact shadow),
R3 (the four device families are fully specified above), R4 (materials), R5 (lighting, restrained
rim), R7 (ISO at ~17°, straight Front), R8 (LED and label restraint). §43's acceptance list now has
an artifact to check against.

⛔ **Still blocked, unchanged by the mockup:**
1. **The RACK SCENE LOCK ruling for R2–R8.** The R1-D override was explicitly scoped to R1-D —
   *"overrides the rack-scene lock only for this specific fix… do not make unrelated
   materials/lighting/geometry changes."* R2 onward needs its own ruling. **B1 above narrows what
   that ruling has to cover: the floor can stay as ruled.**
2. **§31 Forge parity** still requires restarting the STOPPED renderer consolidation (R1-A). The
   mockup does not touch this — it renders one rack and has no aisle.

## 7 · What R1 did NOT do

No visual change. No material, light, geometry, camera or layout edit. No renderer touched. The
only files added are this note and the `_r1/` captures.

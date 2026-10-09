# PHANTOM — WebGL Renderer & Canvas Map
**Audit basis:** `dct-ios.html` @ v1.14.394 (`71d4279`), 54,045 lines. Static analysis, working tree clean.
**Status:** answers the owner's 15 runtime questions. Items marked **RUNTIME** cannot be settled statically and are covered by the device probe in §7.

---

## 1. Every WebGL renderer creation path

There are exactly **two** `new THREE.WebGLRenderer` sites in the entire codebase.

| # | Site | Function | Owner surface | Mount | Options |
|---|---|---|---|---|---|
| **R1** | `dct-ios.html:19083` | `forge3d_render(mount)` @19066 | **Open Aisle** (Forge) | `#forge3d-mount` | `antialias:true, powerPreference:'high-performance'` |
| **R2** | `dct-ios.html:35015` | `rackElevation_render3D(rack, mountEl)` @34923 | **Canonical rack scene** — shared by 3 consumers | caller-supplied | `antialias:true, alpha:true` |

**R2 is already a shared renderer with three consumers.** It is not three renderers; it is one function handed three different mounts:

| Consumer | Call site | Mount | Status @ .394 |
|---|---|---|---|
| Build workspace | `bw_mount3D` → `rackElevation_render3D` @20625 | `#bw-mount` (**rebuilt every render**) | **LIVE — the failing one** |
| Rack-detail panel | `reh3d_activate3D` → `rackElevation_ensure3D` @34891 → @34898 | `#reh3dMount` | LIVE |
| Command hero | `cmd_rackHero3D` @21833 | `.cc-rackhero-mount` | **RETAINED, UNUSED** — `cmd_mountRackHero` @21875 routes to `cmd_rackHeroFlat` |

---

## 2. Canvas inventory (Q1 / Q2 / Q3)

**Only two canvases are ever appended to the DOM in the whole file** — verified by grepping every `appendChild` of a canvas:

- `19092: mount.appendChild(renderer.domElement)` — R1
- `35026: mountEl.appendChild(canvas)` — R2

Everything else is detached and **consumes no WebGL context**:

| Class | Sites | Context type | Attached? |
|---|---|---|---|
| Three.js texture bakes | 19353, 19387, 19542, 19553, 35048, 35066, 35108, 35704, 35820, 35830, 35843, 35884 | 2D | No — uploaded as `CanvasTexture`, then discarded |
| Photo evidence compression | 30198 | 2D | No |
| Barcode-scan rotation buffer | 48087 (`_rotCanvas`, cached singleton) | 2D | No |
| **WebGL capability probes** | **20597, 20633, 34866** | **WebGL** | **No — see §3, these leak** |

**Static answer:** max DOM canvas count = **2**; visible = **1** (R1 and R2 are mutually exclusive by design — see §4); hidden = 0 by design. Actual runtime counts: **RUNTIME**, §7.

---

## 3. ⚠️ FINDING F1 — the capability probes allocate real contexts and never release them

Two of the three probes mint a fresh canvas and take a **real WebGL context** on it, with no `forceContextLoss()` and no reference kept to release it:

```
34866  function reh3d_webglOK() {
34867    var c = document.createElement('canvas');
         return !!(window.WebGLRenderingContext && (c.getContext('webgl') || ...));
```
```
20597  diag(): var cv = document.createElement('canvas');
              gl = !!(cv.getContext('webgl') || cv.getContext('experimental-webgl'));
```

`reh3d_webglOK()` is called on **every** `reh3d_activate3D()` (34886) — i.e. every rack-detail open and every Forge close (19010). Each call takes a context slot that is only reclaimed when the canvas is garbage-collected, which on iOS WebKit is neither prompt nor guaranteed.

`diag()` is worse in effect: it runs **on the failure path**, so at the exact moment the app is out of contexts it asks for another one. This is also why the device reported `WebGL support: true` in the same breath as `context REFUSED` — **that "true" came from a different, freshly-minted canvas, not from the rack canvas.** The two statements were never in conflict; the diagnostic was measuring the wrong object.

The third probe (20633) is safe — it reads back the context three.js already holds on the existing canvas, and does not allocate.

---

## 4. Renderer ownership & the mutual-exclusion guards (Q5 / Q6 / Q7 / Q8 / Q9 / Q10)

Two module-scope single-slot trackers:

- `_forge3dActive = null` @18982 — `{mount, dispose}`
- `_reh3dActive = null` @34862 — `{mount, dispose}`

| Q | Answer | Evidence |
|---|---|---|
| Q5 Active renderer owner | `_reh3dActive.mount` for the rack scene; `_forge3dActive.mount` for the aisle. Single slot each — a second live mount is **untracked and orphaned**. | 34862, 18982 |
| Q6 Animation-loop owner | R1: `_rafId` closure @19073, driven @20053. R2: `rafId` closure, driven @36129. Both cancelled in their teardown (36160, via `_cleanup` 20085). | — |
| Q7 Does Command own a renderer? | **No, as of .394.** `cmd_mountRackHero` @21875 calls `cmd_rackHeroFlat`. `cmd_rackHero3D` @21790 is retained but has no live caller. | 21873–21875 |
| Q8 Does Build own a renderer? | **Yes** — `#bw-mount` via `bw_mount3D` @20577. This is the intended owner. | 20366, 20625 |
| Q9 Does Open Aisle own a separate renderer? | **Yes — R1 is a completely separate renderer, scene, and loop.** | 19066 |
| Q10 Do hidden/legacy pages retain renderers? | Not by design — but see F2. Legacy is gated out of `bw_render` @20208. | 20208 |

### ⚠️ FINDING F2 — the cross-module dispose guards are ASYMMETRIC

| Path | Disposes Forge? | Disposes rack? |
|---|---|---|
| `rackElevation_render3D` @34931 | ✅ yes | ✅ yes (34925–34929) |
| `forge3d_open` @18990 | ✅ yes (via render) | ✅ yes |
| **`forge3d_render` @19068** | ✅ yes | ❌ **NO** |

`forge3d_render` disposes only `_forge3dActive`. Its guarding of the rack context lives one level up in `forge3d_open`. Any path that reaches `forge3d_render` **without** going through `forge3d_open` — the async `loadScript` branch at 19022, or any future caller — creates R1 while R2 is still live. **Two live contexts.** The guard is not enforced at the boundary that creates the renderer.

---

## 5. ⚠️ FINDING F3 — THE ROOT CAUSE. Build tears down and rebuilds the GPU scene on every ordinary UI update (Q11 / Q12)

**Q11 — does `bw_render()` create or replace the canvas? It replaces it. Every time.**

`bw_render()` @20202 wipes its entire host and rebuilds the DOM from scratch:

```
20212   host.textContent = '';            // detaches the old #bw-mount AND its canvas
...
20357   var mount = E('div','bw-mount'); mount.id = 'bw-mount';   // a BRAND NEW element
20366   bw_mount3D(rack, mount);
```

`#bw-mount` is a **new element on every render**, so all mount-local lifecycle state (`_rm3dDispose`, `_rm3dRackId`, `_rm3dSizeTries`, `_pulseNextU`) is destroyed with the old node.

**Q12 — do checklist / evidence / phase updates recreate the renderer? Yes. All three.**

| Action | Call site | Effect |
|---|---|---|
| Toggle a checklist item | `bw_render()` @20446 | full teardown + new `WebGLRenderer` |
| Save evidence | `setTimeout(bw_render, 350)` @20465 | full teardown + new `WebGLRenderer` |
| Complete a phase | `bw_render()` @20489 | full teardown + new `WebGLRenderer` |

### The exact failure sequence

1. `bw_render()` → `host.textContent=''` @20212 — old canvas detached. **No dispose has run yet.** `_reh3dActive` still points at the now-detached mount.
2. New `#bw-mount` created @20357; `bw_mount3D` → `draw()` → `rackElevation_render3D`.
3. @34926 `mountEl._rm3dDispose` — undefined (fresh element) → skipped.
4. @34927 `_reh3dActive.mount !== mountEl` → true → **`_reh3dActive.dispose()`** → `renderer.dispose()` + **`renderer.forceContextLoss()`** @36183–36184.
5. @34934 `mountEl.innerHTML = ''`.
6. @35015 **`new THREE.WebGLRenderer(...)` — requested synchronously, in the same call stack, microseconds after step 4's `forceContextLoss()`.**

On desktop Chrome step 6 always succeeds. **On iOS WebKit the GPU-side reclaim from `forceContextLoss()` is asynchronous**, so the slot is still occupied and the new context is refused.

**This is not a new theory — it is exactly the diagnosis `v1.14.391` wrote down** (comment @20609–20616), and `v1.14.342` had already hit and fixed the identical thing for the Command hero. `.394` then removed the bounded re-arm for precisely this failure mode (@20628–20635) on the correct reasoning that retrying worsens context pressure. **The retry was the only thing masking F3.** Removing it did not cause the bug; it exposed it. The owner's reading of the device output is correct.

**The real defect is not the retry count and not the layout.** It is that *a checklist checkbox tap destroys and rebuilds a GPU scene.* That is the architectural violation named in the owner's ruling: *"Build rerenders must update the existing scene and state — not create another renderer."*

---

## 6. Disposal correctness (Q13 / Q14 / Q15)

| Q | Answer | Evidence |
|---|---|---|
| Q13 Is `renderer.dispose()` actually called? | Yes, in both teardowns. | 20100 (R1), 36183 (R2) |
| Q14 Is `forceContextLoss()` used, and only where appropriate? | Called in both teardowns. Placement is correct (after `dispose`, before canvas removal). **Its use is not the problem — the problem is what happens immediately after it, §5 step 6.** | 20101, 36184 |
| Q15 Can a detached canvas still own a context? | **Yes — two ways.** (a) The probe canvases in F1 are never disposed at all. (b) If any code path detaches a mount without calling its `_rm3dDispose`, the single-slot `_reh3dActive` tracker is the only remaining handle; if it is overwritten first, that context is unreachable and leaks. `bw_render` @20212 detaches before disposing and survives only because the tracker happens to still hold the old mount. That is incidental, not designed. | 20212, 34927, 36196–36201 |

Both teardowns are otherwise thorough: they cancel the rAF loop, remove all listeners, disconnect the `ResizeObserver`, traverse-dispose geometries and materials, and remove the canvas from the DOM (20102, 36186).

---

## 7. What still needs the device (RUNTIME)

Static analysis cannot produce live counts. These require an on-device probe, which is the first instrumented build:

- Q1/Q2/Q3 actual canvas counts at each step of the owner's 12-step sequence
- Whether more than one context is ever simultaneously live in practice
- Whether the probe canvases (F1) are reclaimed by iOS GC in practice or accumulate
- Actual context count **before** and **after** the correction

**The probe must not itself allocate a context** — that is the mistake F1 documents. It must count DOM canvases and read back contexts from *existing* canvases only.

---

## 8. Conclusions carried into the architecture work

1. **There is no third live renderer.** `.394` closed the second one correctly. The refusal is not another owner — it is Build fighting *itself*, one `bw_render()` against the next.
2. **The canonical rack renderer already exists**: `rackElevation_render3D`. It does not need to be written, it needs an **owner and a lifecycle**. Today it is a free function that any caller may invoke, and every invocation is a full teardown-and-rebuild.
3. **The required change is to separate "update the scene" from "create the scene."** Build's re-render must reuse the existing mount and push state into the live scene. This is the `RackExperience` controller the `.394` ship notes already named as authorized and deferred.
4. **Open Aisle must become a mode of the same engine, not a second engine** — this also deletes F2 rather than patching it.
5. **F1 (probe leak) is independent of the architecture** and is a small, safe, self-contained correction.

*Scene internals — lighting, materials, geometry, fog, camera, floor, reflection, tone mapping, tray geometry, `TYPE_COLORS` — are untouched by every conclusion above. RACK SCENE LOCK holds.*

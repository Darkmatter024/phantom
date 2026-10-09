# RACK-PREVIEW-CONTEXT — PHASE 0 EVIDENCE

**Opened:** 2026-09-08, owner ruling. **Ship:** RACK-PREVIEW-CONTEXT. **Rides its own version — NOT `.581`.**
**Status:** ⛔ **EVIDENCE ONLY. NO FIX, NO BUMP, NO EDIT TO `dct-ios.html`.** Options below await an owner ruling.

**Owner ruling of record, 2026-09-08:** `.581` **stays VERIFIED**. Canvas-present on device confirms the
failure is the iOS-WebKit async GPU context class, **pre-existing since `.391`**, not a `.581` regression.
Do not stamp `.581` FAILED.

**Reported state:** BUILD → RACK PREVIEW blank after a Master loads. US-QRS03. `OPEN AISLE` and
`CONTINUE` present, progress `0%`, preview pane blank, **a `<canvas>` IS present**, nothing logged.

---

## 1 · The render path, as it actually runs

```
showMode('work') → bw_render()                                    :22230
  bw_ctx()  → nowtab_resolveDep → deploy_loadRacksFor → deploy_computeRackRollup
              pick = blocked || active || pending
  branch 1  !c.master && !c.dep   → "No Master loaded", return
  branch 2  !c.rack               → zero state, return
  branch 3  builds .bw-prev: header + Open aisle + #bw-strip + #bw-mount
            → bw_mount3D(rack, mount)                             :22340  (unconditional)
                 waitForBox(40 frames) → ResizeObserver fallback  :22771
                 → draw()                                         :22660
                     guard: forge3d-sheet.open       → warn, return (no user text)
                     guard: body.ops-detail          → warn, return (no user text)
                     rackElevation_render3D(rack, mount)          :40133
                     cv = mount.querySelector('canvas')
                     if (!cv)              → rearm
                     gl = phantom_readGL(cv)
                     if (!gl)              → say(), VISIBLE MESSAGE
                     if (gl.isContextLost) → rearm
                     addEventListener('webglcontextlost', …, { once: true })
```

Inside `rackElevation_render3D`: one `new THREE.WebGLRenderer({antialias:true, alpha:true})` (body `:135`),
a **continuous rAF loop** (`loop()` body `:952`, `renderer.render` at `:976`), and `RackEngine.register`
with `{dispose: teardown, pause: _rmPause, resume: _rmResume, reacquire: …}` (body `:1048`).

---

## 2 · What the evidence RULES OUT

| Ruled out | Proof |
|---|---|
| **A `.581` regression** | Every function in the chain is **byte-identical** `.580`→`.581`: `bw_render` `27f7e3f0713e`, `bw_ctx` `6397c20b62b8`, `bw_mount3D` `fbe00c2ce3ee`, `rackElevation_render3D` `cea2fbbd8698`, `showMode` `c55d8d97215f`, `showPage` `f5e6515ffe05`. `.581`'s whole executable delta is **six lines** in `cmd_render`/`cs_renderHero`, none touching canvas, WebGL, dispose or timing. `cmd_render` has **zero** executable lines referencing canvas/WebGL/RackEngine. |
| **The `releaseOthers` dispose path** — the mechanism the owner first suspected, and the `.405` shape | ⭐ **`teardown` REMOVES THE CANVAS** — `if (canvas.parentNode) canvas.parentNode.removeChild(canvas)` (body `:1018`). **A canvas is present on the device, so teardown did not run on this mount.** Nothing disposed it. |
| **A never-attached mount** (the "blockers cell" pattern) | `bw_mount3D` is called **unconditionally** at `:22340` once branch 3 builds the card, and the card is on screen. The mount attached: a canvas exists. |
| **The host-less-cab data trap** | Harness at `.581`, seeded to the reported shape (US-QRS03, Master, pending rack, `0%`): mount `326×320`, **one canvas `652×640`**, no zero-message, `Continue` + `Open aisle`, `0%`. Run **with and without** hosts on the rack — **identical**. Not a data shape. |
| **A refused context** | `if (!gl)` calls `say()`, which writes visible text into the mount. **No text on device ⇒ `gl` was non-null ⇒ the context object was granted.** |

---

## 3 · What remains — four silent states, and none of them logs

⛔ **Every declared failure in `bw_mount3D` writes text into the mount.** A blank pane with no text means
none of them fired. These four produce exactly that.

### A · The context is granted but never becomes usable — the `.391` class

`phantom_readGL` returns `cv.getContext('webgl2') || …`. **On iOS the context OBJECT exists before the
GPU-side grant completes.** So at the instant of the check:

- `gl` is **non-null** → the `say()` path does not fire
- `gl.isContextLost()` is **false** → the re-arm does not fire; nothing was *lost*, it was never *granted*
- `webglcontextlost` **never fires** → the listener sits idle forever

⭐ **THE INSTRUMENTATION ASKS "WAS IT LOST?" WHEN THE QUESTION ON iOS IS "DID IT EVER BECOME USABLE?"**
That is the silent swallow `.391` named and did not close: *"three.js swallows the loss silently — a canvas
exists and nothing ever draws."* **This is the leading candidate and it matches every reported symptom.**

### B · The only loss listener is `{ once: true }`

`cv.addEventListener('webglcontextlost', …, { once: true })` (`:22749`). After one loss→re-arm cycle, if the
re-arm returns early at the aisle guard (`:22692`) or the rack-detail guard (`:22720`), **the surviving
canvas carries no loss listener at all.** A second eviction is then permanently silent and unrecoverable.

### C · There is no `webglcontextrestored` listener anywhere in the file

`grep -n "webglcontextrestored" dct-ios.html` → **zero hits.** iOS *does* fire restore after it reclaims and
frees GPU memory. **The app cannot hear it.** This is the largest recovery gap, and it is a gap in the whole
file, not just this surface.

### D · The rAF loop can be paused and never resumed

`_rmPause()` does `cancelAnimationFrame` and is driven by **RackEngine's per-attachment IntersectionObserver**
(`.401` / spec I4). A paused loop on a live context and a connected canvas is a **frozen** canvas — no error,
no message, nothing logged. `loop()` self-tears-down only when `!canvas.isConnected`, which is false here.

---

## 4 · Can `contextrestored` or retry-on-grant recover it?

**Direct answer to the ruling's question.**

⛔ **`webglcontextrestored` ALONE DOES NOT FIX CANDIDATE A, and this is the trap to avoid.** `restored` only
fires after a `lost` fired. In candidate A **nothing is ever lost**, so neither event fires and a restore
listener would sit as idle as the loss listener does. **It is necessary and insufficient** — worth adding for
B and C, but it does not close the leading candidate.

⭐ **RECOVERY REQUIRES A POSITIVE LIVENESS PROBE — "did a frame actually draw" — NOT AN EVENT.**

⛔ **AND IT IS CONSTRAINED BY `.394`, WHICH MUST NOT BE RE-LITIGATED BY ACCIDENT:** *"a REFUSED context is not
a timing problem, and re-arming it asks the browser for yet another context while it is already starved…
Fail once, loudly."* The owner's words at the time: *"the 12 re-arms may be worsening context pressure."*
**Any option below must allocate ZERO new contexts.** Calling `rackElevation_render3D` again builds a **new**
`WebGLRenderer` — so re-render is safe, re-mount is not.

**Three probes exist that cost nothing and allocate nothing:**

| Probe | Reads | Cost |
|---|---|---|
| `renderer.info.render.frame` | three.js' own count of frames actually rendered | free, already tracked |
| `gl.drawingBufferWidth === 0` | a context with no GPU backing commonly reports 0 | free |
| `gl.getError()` | pending error state | free |

⚠ **`renderer` is currently a local inside `rackElevation_render3D` and is NOT reachable from `bw_mount3D`.**
Any option using `info.render.frame` needs the handle exposed — additive, but it is a real change to that
function's contract and should be ruled on, not assumed.

---

## 5 · Options for the owner's ruling — NOT built

| # | Option | Closes | Risk |
|---|---|---|---|
| **1** | **Liveness probe after N frames.** After the mount settles, check once (say at ~500ms and ~2s) whether `drawingBufferWidth > 0` and a frame has rendered. If not, call the EXISTING `rearm()` — which re-enters `draw()` and re-renders. No new context on the probe itself. | **A** | LOW-MED. `rearm` → `draw` → `rackElevation_render3D` **does** build a new renderer, so this inherits `.394`'s pressure concern. Needs a hard cap and a loud final `say()`. |
| **2** | **`webglcontextrestored` listener** on the canvas, calling `rearm()`. First one in the file. | **B, C** | LOW. Purely additive; fires only on a real restore. Does not close A. |
| **3** | **Drop `{ once: true }`** so the loss listener survives repeated evictions. | **B** | LOW. One-token change; must confirm it cannot stack duplicate listeners across re-arms. |
| **4** | **Resume-on-visible**: assert the rAF loop is running when the mount is on screen, independent of the IntersectionObserver. | **D** | MED. Touches `.401`'s pause/resume contract, which exists to stop off-screen loops burning battery in a cold aisle. |
| **5** | **Diagnostics only** — make the silent states speak (`diag()` already composes the full line; it is simply never emitted on these paths). Ship nothing else until a device log names the real state. | none | LOWEST. **Cheapest honest first ship**, and it converts every future instance from a guess into a reading. |

⭐ **RECOMMENDATION: 5 FIRST, THEN 2+3 TOGETHER, THEN 1 ONLY IF THE LOG SAYS A.** The whole hunt so far has
been narrowing by elimination because the device says nothing. Option 5 ends that permanently and costs
almost no risk; 2+3 are cheap and strictly additive; 1 is the only one that re-opens `.394`'s pressure
question and should not be taken on a hypothesis a log can settle first.

---

## 6 · What is still owed, and what would settle it fastest

⚠ **NOT MEASURED — the harness cannot reach this class.** `playwright.config.js`' own header: *"WebKit-on-
Windows is NOT iOS Safari. Every field bug of the last two months was iOS-WebKit-specific… This suite
catches NONE of those."* Everything in §3 is reasoned from source and from the device symptom, **not
reproduced.** No option should be called proven until an iPhone says so.

**From the device, in one pass, whichever is easiest:**

1. Does SYS → DIAGNOSTICS hold a `bw_mount3D` line? Any of `aisle owns the screen`, `rack detail owns the
   screen`, `host not measurable yet`, `webglcontextlost - re-arming` **names the state outright** and
   collapses §3 to one candidate.
2. Had the aisle or a rack detail been opened before this, even seconds earlier? → points at **B**.
3. Does the blank canvas have non-zero width/height attributes? → `652×640` would match the harness and
   point at **A** or **D**; `0×0` points at the layout path instead.

**If none of that is reachable on a phone in an aisle, that itself argues for Option 5 first.**

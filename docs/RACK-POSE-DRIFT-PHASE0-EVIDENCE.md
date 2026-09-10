# RACK POSE DRIFT — PHASE 0 EVIDENCE (read-only, nothing authorised to build)

**Written:** 2026-09-10 · **Baseline:** `.586` served · **Ruling:** owner, 2026-09-10 — *"rack pose: it's a real defect, the tolerance stands"*
**Failures it explains:** `37-locked-rack-pose.spec.js:141` and `:179`, both in the pinned baseline (`docs/PLAYWRIGHT-BASELINE.md`)
**Status:** diagnosis only. **No source edited, no test changed, no version bump.** A fix needs a GO.

---

## 1 · What the tolerance is actually measuring, and why it is not too tight

`settle()` (spec 37, `:76`) does **not** sample mid-glide. It polls every 500 ms and returns only after **two consecutive identical readings** at 5 decimal places, with a 40 s budget. Its own comment says why: *"POLL, DO NOT WAIT A FIXED PERIOD… a fixed wait samples mid-glide and measures the MACHINE."*

**So the camera was observed at rest at `-4.69565` when the canonical value is `-4.7`.** Not caught in flight — at rest, twice, a second apart. That is what makes the owner's ruling correct: a resting pose that is 0.00435 from canonical is a pose the app actually produced, and the spec's own contract is that *"Rack A and rack B must look like the same rig physically moved in front of each cabinet"*, solved *"from the SELECTED RACK'S OWN TRANSFORM — never from previous camera state."*

## 2 · The mechanism — the landing is frame-count dependent

`_ease` (`dct-ios.html:21363`):

```js
function _ease(v, t) {
  ['x','y','z'].forEach(function (a) {
    if (Math.abs(t[a] - v[a]) < LOCK_SNAP) v[a] = t[a];   // LOCK_SNAP = 0.0009
    else v[a] += (t[a] - v[a]) * 0.14;
  });
}
```

Geometric convergence at 14 % per **frame**, with an exact set only once the gap is under `0.0009`. From a walk-exit gap of order 4 world units that is **≈ 56 frames** — `4 × 0.86ⁿ < 0.0009`.

⚠ **Spec 37's own header records the render rate: ~2.7 fps in this harness.** 56 frames is therefore **≈ 21 seconds** of wall clock. The ease is well inside the 40 s budget on an idle box — which is exactly why the spec passes **4/4 in isolation** — but it is a long, frame-hungry landing, and every frame the browser fails to grant leaves the camera further from canonical.

**The defect, stated in the spec's own terms:** the canonical pose is not *installed*, it is *approached*, and whether it arrives depends on how many frames the machine granted. A pose that depends on frame budget is a pose derived from something other than the rack's transform.

## 3 · What the residual is NOT — two hypotheses tested and set aside

**(a) A moving target from DOM measurement — RULED OUT for `x`.** `lockPoseFor` (`:20833`) solves `pos = rackWorldPos + n · lockDistance()`, and `lockDistance()` (`:20824`) is derived from a **live `getBoundingClientRect`** cached by `lockSync`, which only re-measures on every 15th tick (`if (!force && _lockM && (_lockTick++ % 15)) return _lockM;`). That looked like the culprit — a pose that moves with chrome height and tick phase. **But `n` is the rack's own +Z, and no rack rotation was found in the scene build**, so `n ≈ (0,0,1)` and `pos.x = at.x` exactly. `lockDistance()` cannot move `x`. **The observed failure is in `x`, so this is not it.**

**(b) `settle()` returning early — cannot be fully excluded, and does not change the fix.** If the render loop stalls for more than a second under suite load, two polls read the same value and `settle()` reads "converged" where the truth is "frozen mid-ease". That is consistent with fail-under-load / pass-in-isolation. ⚠ **It is not an alternative to §2 — it is the same root cause seen from the harness side.** Both reduce to: *the pose is only canonical if enough frames render.* Fixing the landing fixes both readings; tightening `settle()` would only hide the one the owner has ruled is real.

## 4 · A separate latent inconsistency, found in passing — NOT the cause of these two failures

`lockSync` decides whether to rebuild the projection by comparing a signature **quantised to whole pixels**:

```js
var sig = [Math.round(m.w), Math.round(m.h), Math.round(m.u.r), Math.round(m.u.b)].join('/');
```

…but `lockDistance()` consumes the **raw, unrounded** floats: `var frac = Math.max(0.3, (m.u.b - m.u.t) / (m.h || 1));`

**So sub-pixel jitter in the measured rect changes the camera distance while the signature reports "nothing changed".** It cannot affect `x` (see §3a), so it does not explain the two baseline failures — but it does mean `y` and `z` can differ between two arrivals at the same rack by an amount no guard is watching. Worth closing in the same ship; **reported, not acted on.**

## 5 · Fix directions — for the owner to choose, none built

The property to restore: **arriving at a rack installs the canonical pose in bounded time, independent of frame budget.**

1. **Deadline snap (smallest).** Give the ease a start time and set the pose exactly once a bounded interval has elapsed, however many frames arrived. Keeps the glide, guarantees the landing.
2. **Time-based ease.** Drive the interpolation from elapsed milliseconds rather than a per-frame factor, so the same wall-clock duration lands the same pose at 2.7 fps or 60 fps.
3. **Raise `LOCK_SNAP`.** One-line, and the least honest of the three: it shrinks the residual without removing the frame dependence, and the spec would pass while the property stays broken.

**Recommendation: 2, with 1 as the guard.** A time-based ease is the only one of the three where the resting pose is genuinely a function of the rack and nothing else — which is what the `.455` ruling asks for.

⛔ Whichever is chosen, the acceptance is the pinned baseline: `37-locked-rack-pose` must pass **inside a full 430-run**, not only in isolation. Isolation already passes today and proves nothing about this defect.

## 6 · Bounds

Source reading and the two baseline logs only. **Nothing was run on a device, no fix was written, and the ~56-frame figure is arithmetic from the 0.14 factor and `LOCK_SNAP`, not an instrumented frame count.** Confirming it would mean logging the ease against frames on a loaded box — worth doing as the first step of the ship, before choosing between the options in §5.

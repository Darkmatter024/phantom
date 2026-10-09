# HANDOFF — INSPECT-3D PORT · "THE INSPECTION BAY" (visuals JOHN-LOCKED 2026-07-14)
**For:** fresh Claude Code session · **Reference truth:** `MOCKUP-INSPECT3D-BAY-LOCKED.html` (commit it to the repo under `/mocks/` before starting — it is the visual contract)
**Target:** the solo 3D rack inspect view behind the FLAT|3D toggle shipped in v1.14.254
**Stamp:** next free at execution — OODA curl decides. dct-ios.html only · body.rd only · `?legacy=1` byte-identical · three-stamp lockstep.

---

## THE DESIGN LAW (John, verbatim intent)
**The rack is the star.** The current in-app 3D view renders the rack in blank empty space —
that background is retired. The Inspection Bay replaces it: environment everywhere, but every
environment element is additive-blend, low-opacity, and dimmer than the rack's own lights.
Nothing occludes the rack. Nothing competes with it. If any bay element reads brighter than
the hero at any orbit angle, the element is wrong, not the rack.

## WHAT SHIPS (one sentence)
Transplant the GB300-mock renderer + the locked Inspection Bay environment into the existing
reh3d socket, with trays generated from live Master slot data instead of the mock's hardcoded
loadout.

---

## A · JOHN-LOCKED LIGHT RIG (exact, non-negotiable)
```js
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.10;
scene.add(new THREE.AmbientLight(0x1a2535, 0.04));
var key = new THREE.DirectionalLight(0xd4e5f7, 0.78);
key.position.set(5.45, 13.79, 4.91);        // az 48° · el 62° · original throw distance
var fill = new THREE.DirectionalLight(0x4a3a7a, 0.10);
var rim  = new THREE.DirectionalLight(0x00d4aa, 0.42);
var glow = new THREE.PointLight(0x00d4aa, 0.08, 35);
var underGlow = new THREE.PointLight(0xa855f7, 0.14, 20);   // position per mock: (0, -RH/2-0.3, 2)
```
Character: near-zero ambient, quarter reflections, doubled rim — dark edge-lit look; the
scan/band/bay carry the drama. Fill/rim positions verbatim from the mock source.

## B · FINISHES
- **Default shipping finish: CHROME BLACK** — equipment surfaces `color 0x0c0f14 ·
  metalness 0.92 · roughness 0.16 · envMapIntensity 0.25`. Skip MeshBasic materials and any
  material with `emissiveIntensity > 0.5` (LEDs/glows stay lit); zero their emissive otherwise.
- **BLACK MIRROR (retain as optional mode, not default):** `0x04060a · metalness 1.0 ·
  roughness 0.05 · envMapIntensity 0.25`.
- **Environment map:** procedural canvas cubemap, 128px faces, per the mock: walls near-black
  `#04060c` with three horizontal bands (white `rgba(200,225,245,.75)` @y30 h9 · cyan
  `rgba(60,205,240,.65)` @y62 h6 · violet `rgba(138,75,255,.35)` @y92 h5), top radial cool
  pool, floor soft bounce. **envMapIntensity 0.25 everywhere** (John-locked).
- STOCK (original mock materials) retained behind a debug flag only; no UI toggle in-app
  unless John rules otherwise at verify.

## C · EQUIPMENT HIGHLIGHT BAND (John re-ruling — reverses "bright edge box removed")
- Ghost fill: `0x00d4aa`, **additive**, breathing opacity `0.30 ± 0.10` (~4s sine).
- **Edge box restored:** EdgesGeometry wireframe `0x1fffd0`, additive, breathing `0.80 ± 0.18`,
  parented to the band so it tracks `setHLUnit` span scaling exactly.
- Band geometry/behavior verbatim from mock: `(RW+0.30, uH, RD+0.30)` base, scale.y = U-span,
  snaps to selected unit via `setHLUnit`; scrub follows the U-map handle.
- Record in ship notes: this reverses the documented earlier ruling, by John, 2026-07-14.

## D · THE INSPECTION BAY (all elements; RH = rack height, floorY = -RH/2 - 0.05)
1. **Glass platform** (replaces any pad/ring concept): slab `PW=RH*0.62 × PT=RH*0.018 ×
   PD=RH*0.66`, `0x0a1420 · metal 0.35 · rough 0.12 · opacity 0.85 · env 0.25`; cyan
   additive edge frame strips (opacity 0.7) on all four top rims; 21 calibration marks along
   the front edge, every 5th heavier (0.65 vs 0.3); light sweep bar `PW*0.28` wide gliding
   across on a 5.2s cycle, opacity `0.5·sin(phase)`.
2. **SCAN WAVE** (the signature — RACK·STACK·VERIFY as motion): four additive gradient planes
   wrapping the rack (`scanW=RH*0.40, scanD=RH*0.44`, band height `RH*0.14`, white-hot core
   `rgba(220,250,255,1)` with cyan falloff 0.35) + **halo ring** (radial additive plane
   `1.7×` footprint, opacity 0.8) + traveling `PointLight 0xbff2ff · 2.4 · range RH*1.6`.
   Cycle **6.5s**: climb floor→top over the first 50% (≈3.25s), ease-in, fade at crest,
   dark rest. All opacities scale together with the climb envelope.
3. **Ghost fleet:** 6 wireframe rack silhouettes per side (`gW=RH*0.30, gD=RH*0.34`,
   EdgesGeometry, cyan additive, opacity `0.15/(n·0.9)`, spacing `±(RH*0.55 + n·gW·1.35)`),
   nearest pair carrying 5 faint interior shelf lines (0.06); plus a distant back rank —
   x = −5..5 (skip 0), spacing `gW*1.5`, at `z = −RH*0.95`, opacity 0.05.
4. **Data motes:** 220 points, `0x9fd9ff`, size `RH*0.008`, opacity 0.55, additive; spawned
   in a cylinder `r = RH*(0.25..1.15)`, rising `0.0015..0.0055`/frame, wrapping at `RH*1.35`.
5. **Floor:** `RH*5` square plane, `0x04060a · metal 0.9 · rough 0.38 · env 0.25` at floorY.
6. **Ghost reflection:** mirrored rack clone below floorY, opacity 0.16, emissive ×0.5,
   depthWrite off. **Mobile-fungible — see budget.**
7. **Backdrop:** vertical gradient glow panel `RH*2.2 × RH*1.4`, opacity 0.45, at
   `z = −RH*1.2`, renderOrder −1.
8. **Invisible practicals:** two PointLights `0xbfe6ff · 0.5 · range RH*2.5` at
   `(±RH*0.55, floorY+RH*0.52, −RH*0.25)` — **no visible fixtures** (John-ruled: light
   exists, hardware doesn't).
9. **Sweep light:** `0x9fd9ff · 0.9`, glacial ~50s orbit, radius `RH*0.7`, bobbing height —
   a highlight is always traveling even when the user's hand is still.

## E · APP INTEGRATION (the port itself)
- **Socket:** the .254 FLAT|3D toggle, `reh3dMount`, lazy three.js load, FLAT default,
  per-session pref — all keep working unchanged. Replace the scene the socket builds
  (the old .218 shelf renderer) with the mock renderer + bay. Old renderer functions retire
  under re-home rules (annotate, physical deletion in R1).
- **Master-driven trays:** the mock's hardcoded GB300 loadout is replaced by the rack's live
  slot data (same source the FLAT elevation uses) — U-position, U-span, type color, label.
  Honest-unknown slots render with the gold hatch treatment in 3D too; UNKNOWN type renders
  magenta. The bay must never contradict the elevation.
- **Interaction contract preserved verbatim:** tap-a-tray raycast → `openRmDevice(dev)`;
  orbit-drag threshold; `setHLUnit` selection; U-map scrub → `setHL`.
- **GL discipline:** symmetric cross-dispose with `forge3d_*` (flagged in BATCH-VERIFY) —
  opening either disposes the other. One WebGL context alive, ever. Full teardown on FLAT
  toggle and view exit: renderer, geometries, textures, canvases, rAF loops (bay runs three:
  bay anim, hl pulse, sweep — all must die on dispose).

## F · MOBILE BUDGET (iPhone Safari is the target, not the desktop preview)
- Cap `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- Bay geometry is lines/planes/points — cheap. The **ghost reflection clone is the one
  luxury**: if frame rate on John's device dips, replace it with a simple darker floor
  gradient — pre-approved fallback, no re-ask needed. Ship notes must state which shipped.
- Motes scale down (220 → 120) as the second lever. Everything else stays.
- Scan/highlight rAF loops pause when the 3D view is hidden (visibilitychange + FLAT mode).

## GATES
OODA curl first · `node --check` ×3 · CSS brace-balance · three-stamp lockstep ·
one-unverified-ship rule · `?legacy=1` byte-identical.

## DEVICE-VERIFY (John, iPhone)
- [ ] FLAT default intact; toggle 3D → bay loads, rack renders with live Master trays
- [ ] Rig matches the locked mock (dark, edge-lit, env 0.25) — compare side-by-side with
      MOCKUP-INSPECT3D-BAY-LOCKED.html
- [ ] Scan wave climbs every ~6.5s, equipment illuminates as it passes, halo wraps
- [ ] Select/scrub → highlight band + edge box glow, breathing, unmissable
- [ ] Ghost fleet + platform + motes present; **rack reads as the star from every angle**
- [ ] Tap tray → flat device detail; orbit-drag does NOT trigger it
- [ ] Unknown-height slot shows gold hatch in 3D; UNKNOWN type shows magenta
- [ ] Toggle FLAT → GL disposed (no leak, no dead spin); open FORGE after → no dual-GL crash
- [ ] Frame rate acceptable on-device; note whether reflection clone or fallback shipped
- [ ] Kill/relaunch PWA offline → everything renders
- [ ] `?legacy=1` curl-diff byte-identical

## SESSION END
INTEGRATION-STATE.md: ship + stamp, verify results, the highlight-band re-ruling recorded,
reflection-clone decision, any budget trims. This environment is **John-locked canon** —
future sessions change it only on a new John ruling.

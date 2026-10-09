# PHANTOM — RACK RENDERER VISUAL UPGRADE
## Principal Implementation Directive for Claude Code

**Status:** APPROVED FOR IMPLEMENTATION PLANNING + EXECUTION  
**Priority:** High — technician-facing quality upgrade  
**Scope:** Canonical rack rendering only  
**Reference visual:** `PHANTOM_RACK_RENDERER_SELF_CONTAINED_MOCKUP.html`  
**Owner intent:** Make the rack itself look dramatically more realistic, premium, legible, and physically believable without creating a second renderer, second truth source, or performance regression.

---

# 1. EXECUTIVE INTENT

PHANTOM’s rack renderer should look like a real premium datacenter rack, not a stack of dark rectangles with glowing strips.

The upgrade must improve:

- physical believability
- rack proportions
- equipment depth
- rail detail
- device differentiation
- material quality
- lighting
- shadows
- camera framing
- hierarchy
- selected-rack emphasis
- realism on iPhone
- consistency between Build and Forge

The upgrade must **not** change the product data model, Master truth, RackEngine ownership, or renderer lifecycle.

This is a **visual/rendering upgrade**, not a new subsystem.

The correct architecture is:

```text
ACTIVE MASTER
    ↓
normalized rack inventory
    ↓
canonical RackEngine
    ↓
multiple camera/presentation states
    ↓
Build preview / Forge aisle
```

Not:

```text
Build renderer
+
Forge renderer
+
special rack preview renderer
+
legacy renderer
```

There must remain **one canonical rack rendering engine**.

---

# 2. MOST IMPORTANT RULE

## DO NOT BUILD A SECOND RACK ENGINE

The self-contained HTML mockup is a **visual target only**.

Do not copy its standalone architecture into PHANTOM.

Do not introduce:

- a second WebGLRenderer
- a second rack component model
- a parallel device list
- a duplicate rack DOM renderer
- a special “pretty rack” data path
- hardcoded rack inventory
- independent Build/Forge geometry builders

Instead, improve the current canonical RackEngine.

The final visual result should be inspired by the reference mockup while remaining fully native to PHANTOM’s current renderer architecture.

---

# 3. RECON BEFORE EDITING

Before modifying code, inspect and document the current live implementation.

Find the current equivalents of:

- `RackEngine`
- `rackElevation_render3D`
- `rackElevation_ensure3D`
- `rackHybrid_initSync`
- `deploy_showRackDetail`
- `forge3d_open`
- current scene creation
- current rack geometry builder
- current device/chassis builder
- current material factory
- current light rig
- current camera framing logic
- renderer attach/detach lifecycle
- WebGL context ownership
- renderer reuse path
- mobile DPR handling
- resize handling
- active five-rack Forge window
- background rack shell generation
- selected rack state
- flat/no-WebGL fallback

Do not assume function names have remained unchanged.

Use the current main branch.

If renderer Stage 3a/3b has landed, treat that architecture as current truth.

Do not resurrect removed renderer ownership.

---

# 4. VISUAL QUALITY TARGET

The selected rack should feel like a high-end product visualization of an actual datacenter cabinet.

Target characteristics:

- dark powder-coated steel
- subtle metallic edge response
- recessed equipment
- visible front rails
- visible mounting pattern
- correct U spacing
- realistic chassis depth cues
- device face variation
- ventilation texture
- restrained indicator LEDs
- soft internal shadows
- controlled cyan rim light
- extremely restrained violet secondary accents
- believable cabinet floor contact
- dark aisle environment
- crisp front labels
- no cartoon glow
- no excessive bloom
- no fake hologram aesthetic
- no random sci-fi geometry

The scene should communicate:

> “This is a real rack represented by PHANTOM.”

Not:

> “This is a neon game prop.”

---

# 5. DATA HONESTY — ABSOLUTE

Every rendered component must come from canonical normalized rack data.

Never render fake filler equipment merely to make the rack look full.

Never fabricate:

- switches
- GPU nodes
- PDUs
- power shelves
- CDU
- cable trays
- ports
- labels
- LEDs indicating actual health
- completion state
- installed state
- device counts

If PHANTOM does not know a fact, use neutral visual treatment.

Example:

A generic green LED may be used as **decorative chassis power styling only if it cannot be interpreted as operational health**.

If the app currently uses LEDs as health state, then LED state must be sourced from real status.

Prefer neutral dim white/blue equipment lights when status truth is unavailable.

---

# 6. CANONICAL S4:099 REGRESSION FIXTURE

Use the real Master regression fixture.

Known canonical S4:099 explicit component inventory:

- RU46 — SN2201 infra switch
- RU42 — PS-1RU-06
- RU41 — PS-1RU-06
- RU40 — PS-1RU-06
- RU39 — PS-1RU-06
- RU35 — GPU-B300-01
- RU32 — GPU-B300-01
- RU29 — GPU-B300-01
- RU26 — GPU-B300-01
- RU23 — GPU-B300-01
- RU20 — GPU-B300-01
- RU17 — GPU-B300-01
- RU14 — GPU-B300-01
- RU11 — GPU-B300-01
- RU09 — PS-1RU-06
- RU08 — PS-1RU-06
- RU07 — PS-1RU-06
- RU06 — PS-1RU-06
- RU02 — CDU

Expected unique component count:

```text
19
```

Do not hardcode this layout into production.

Use it only as a regression fixture proving that the renderer accurately consumes the normalized inventory.

### Important

The visual mockup may visually assume chassis heights based on RU spacing.

Production must use real normalized/device metadata when available.

If exact device U-height is not known, derive it only from an approved deterministic source.

Do not invent a hardware height merely because it looks visually convenient.

---

# 7. RACK CABINET GEOMETRY

Upgrade the cabinet shell first.

The cabinet should have:

## 7.1 Frame

- realistic narrow front posts
- top cross-member
- bottom cross-member
- left/right structural rails
- subtle bevels
- enough depth to catch edge lighting
- physically plausible width-to-height ratio

Avoid:

- oversized bezel
- thick sci-fi borders
- glowing cabinet frame
- giant rounded corners

The actual physical rack should read as mostly rectangular steel.

### Geometry principle

Use small bevels to catch light.

Do not increase polygon count everywhere.

A few correct bevels provide more realism than large amounts of decorative geometry.

---

# 8. VERTICAL RAILS + RU SYSTEM

The rack should visibly communicate real rack units.

Implement or refine:

- left mounting rail
- right mounting rail
- regular RU pitch
- mounting-hole pattern
- restrained RU tick marks

If current scene already includes rails, improve those instead of adding parallel geometry.

## RU labels

Labels must:

- remain readable in Front view
- not dominate equipment
- align exactly with the rack U system
- stay visually quiet
- use current PHANTOM typography/tokens where possible

At distance, reduce label complexity instead of allowing shimmering text.

Do not render full text on background racks.

---

# 9. DEVICE PLACEMENT

All device placement must use the canonical rack coordinate system.

Define one authoritative mapping:

```text
RU index
→ Y coordinate
```

The same mapping must be used for:

- rack shell
- device chassis
- selection
- camera focus
- overlays
- cables
- Build preview
- Forge

Do not allow Build and Forge to use slightly different U positioning.

A device at RU35 must occupy the same physical Y location everywhere.

---

# 10. CHASSIS DEPTH

Current equipment should not look pasted onto a flat panel.

Every device should have enough 3D depth to create:

- front-face shadow
- top/bottom separation
- side-wall darkness
- realistic recession into the rack

Recommended approach:

- device front face slightly recessed from front rail plane
- chassis extends backward
- subtle side geometry
- subtle ambient occlusion/contact shadow where chassis meets rails

Do not over-extrude equipment toward the viewer.

Servers live inside the rack.

---

# 11. DEVICE-SPECIFIC VISUAL FAMILIES

Create a small, maintainable set of visual families rather than a unique handmade model for every SKU.

Recommended visual families:

```text
GPU / compute node
network switch
power shelf
CDU / cooling
generic infrastructure
unknown / fallback
```

Each family should share the same canonical base material system while having identifiable front-face characteristics.

---

# 12. GPU / COMPUTE NODE LOOK

GPU nodes should visually communicate dense compute hardware.

Use:

- dark black/anodized face
- fine vent/perforation region
- subtle service handles/latches
- restrained cyan edge indicator
- small status LED cluster
- deeper chassis body

Avoid:

- large glowing rectangles
- huge brand logos
- fake GPU imagery
- giant RGB strips

If the source provides model name, a small technical label may be shown where current UI policy allows.

No invented vendor branding.

---

# 13. NETWORK SWITCH LOOK

Network switch family should be distinguishable by front-port density.

Use a low-cost visual representation:

- dark chassis
- small repeating port pattern
- restrained violet/cyan secondary distinction
- tiny port-status texture when appropriate
- subtle vent region

Do not model hundreds of expensive individual port geometries unless performance proves acceptable.

Use texture/instancing/merged geometry where possible.

---

# 14. POWER SHELF LOOK

Power shelves should visually read differently from compute.

Use:

- denser industrial metal face
- slightly warmer neutral accents
- restrained amber detail where visually appropriate
- vent/fan pattern
- PSU bay divisions if cheap enough

Amber must not imply a warning unless status semantics say so.

If amber is merely family styling, keep it subtle and non-alerting.

---

# 15. CDU / COOLING LOOK

CDU should feel like a specialized equipment block.

Use:

- heavier front housing
- distinct ventilation/grille pattern
- small neutral display area
- subtle cooling/plumbing visual cues only if supported by current design language

Do not add fake values to a CDU display.

A dark inactive/abstract equipment screen is acceptable.

---

# 16. UNKNOWN DEVICE FALLBACK

Unknown hardware must still look professional.

Fallback chassis:

- correct U height
- black metal
- subtle vents
- neutral label
- minimal LEDs
- no category-specific invented details

Unknown must never look broken.

---

# 17. MATERIAL SYSTEM

Create or consolidate a small material palette.

Prefer material reuse.

Suggested material roles:

```text
rackFrameMaterial
rackRailMaterial
deviceDarkMaterial
deviceMetalMaterial
ventMaterial
glassDisplayMaterial
cyanAccentMaterial
violetAccentMaterial
neutralLedMaterial
```

Do not instantiate dozens of unique materials per device.

Material reuse matters on mobile.

---

# 18. PHYSICALLY BELIEVABLE METAL

Target look:

- mostly rough black powder coat
- low-to-medium metalness
- restrained specular response
- edge highlights visible under side light
- no mirror-chrome racks

If using PBR materials:

Rack frame:
- high roughness
- low/moderate metalness

Device chassis:
- slightly smoother
- subtle metallic response

Rail:
- slightly brighter metal response than cabinet body

Exact values should be tuned in the live scene, not blindly copied from this document.

---

# 19. VENT / PERFORATION DETAIL

Do not model every vent hole as geometry.

Use the cheapest solution that survives iPhone rendering:

Priority:

1. texture / alpha texture
2. normal map
3. instanced low-cost geometry only when necessary

Avoid creating thousands of individual meshes.

Goal:

The equipment should appear manufactured and detailed without becoming GPU-expensive.

---

# 20. LIGHTING

The current lighting should be improved carefully, not completely replaced unless required.

Target lighting hierarchy:

### Key

Soft cool light from front/upper side.

Purpose:
- define face geometry
- expose rack edges
- make equipment readable

### Fill

Very weak neutral/cool fill.

Purpose:
- prevent crushed black details

### Rim

Subtle cyan PHANTOM edge light.

Purpose:
- selected-rack separation
- brand identity

### Secondary

Extremely restrained violet contribution when useful.

### Floor / environment

Dark indirect ambient contribution only.

Avoid:

- neon wash across entire cabinet
- overexposed cyan edges
- light leaking through solid metal
- multiple bright colored lights
- dramatic purple fog

---

# 21. SELECTED RACK EMPHASIS

The currently selected rack should look better than neighbors without becoming a glowing trophy.

Use:

- slightly higher exposure
- stronger edge definition
- full device detail
- readable labels
- higher material fidelity
- subtle floor contact reflection/shadow

Neighbor racks:

- slightly darker
- less label detail
- simpler equipment faces
- cheaper material/geometry treatment

Background racks:

- shell-level detail only
- no expensive per-device labels
- no unnecessary small geometry

---

# 22. LOD STRATEGY

PHANTOM already has an active five-rack foreground window concept.

Preserve it.

Recommended detail model:

## Tier A — selected rack

Full detail:
- accurate components
- rails
- labels
- vents
- device family detail
- LEDs
- shadows

## Tier B — immediate foreground neighbors

Medium detail:
- accurate chassis placement
- simplified vent/port pattern
- no tiny labels unless readable
- fewer effects

## Tier C — background

Low detail:
- rack shell
- coarse face blocks
- minimal or no LEDs
- no tiny text
- no expensive reflection work

This should make the selected rack look dramatically richer while keeping iPhone performance stable.

---

# 23. DRAW-CALL DISCIPLINE

Measure before and after.

Do not judge performance only by “it feels okay on desktop.”

Track at minimum:

- renderer count
- scene object count
- mesh count
- material count
- texture count
- draw calls
- triangles
- DPR
- frame time

Use instancing or merged geometry where appropriate for repeated elements:

- mounting holes
- vent patterns
- repeated power shelves
- repeated chassis family elements
- background rack shells

Do not merge objects if it destroys useful selection/interaction behavior.

---

# 24. IPHONE DPR

Do not blindly render at the device’s full native pixel ratio.

Use the existing renderer policy if already tuned.

If no explicit policy exists, evaluate a capped DPR strategy.

Example concept only:

```js
pixelRatio = Math.min(window.devicePixelRatio, SAFE_CAP)
```

Do not hardcode a new cap without measuring current behavior.

Goal:

- crisp enough
- stable thermals
- no unnecessary GPU overdraw

---

# 25. SHADOWS

Use shadows strategically.

The rack needs:

- cabinet floor contact shadow
- device recession/contact shading
- selected rack depth

Do not enable expensive full-resolution real-time shadows for every rack and every device without measuring.

Preferred:

- one high-value shadow source
- restrained shadow-map resolution
- cheap baked/approximate contact treatment when possible
- no shadow casting from microscopic detail

---

# 26. REFLECTIONS

A slight reflection helps the premium aesthetic.

Do not turn the floor into glass.

Target:

- dark polished datacenter floor
- extremely subtle reflection
- strongest under selected rack
- rapidly fades with distance

If real-time reflection is too expensive:

Use:
- environment response
- blurred proxy reflection
- gradient/contact treatment

Performance wins over literal reflection.

---

# 27. CAMERA — FRONT VIEW

Front view must feel authoritative.

Requirements:

- rack vertically centered
- full cabinet visible
- minimal unused space
- slight breathing room top/bottom
- no accidental tilt
- no perspective that makes rack trapezoidal
- device faces readable
- RU layout understandable

The owner prefers straight, square, deliberate presentation.

Front must look engineered, not cinematic.

---

# 28. CAMERA — ISO VIEW

ISO is for physical depth.

Use a restrained angle.

Target:

- enough yaw to expose cabinet side/depth
- not so much that RU positions become hard to read
- no excessive fisheye perspective
- preserve device visibility

Recommended visual range:

approximately 12–20 degrees of yaw as a tuning starting point.

Do not treat that as a locked constant.

Tune against real phone screenshots.

---

# 29. CAMERA TRANSITIONS

Camera transitions should feel premium but fast.

Use:

- short ease
- transform/orbit interpolation
- no slow cinematic animation
- no auto-rotation

Technician workflow comes first.

Respect `prefers-reduced-motion`.

---

# 30. BUILD PREVIEW

Build Rack Preview must remain operational, not decorative.

At phone width:

- rack must be large enough to understand
- no tiny thumbnail
- controls remain glove-safe
- Open Aisle remains clearly available
- current rack identity remains visible
- no WebGL black box

Recommended minimum visible rack scene height:

```text
~270–320 px minimum
```

If the upgraded rack benefits from more height and the page can support it without hiding primary workflow, tune intelligently.

Do not let renderer vanity push the primary technician action below an unreasonable fold.

---

# 31. FORGE AISLE

Forge should use the same upgraded visual system.

No separate prettier Forge materials.

Same canonical:

- cabinet
- devices
- materials
- source inventory
- RU mapping
- colors
- selected state

Forge adds:

- aisle composition
- five-rack foreground window
- rack navigation
- immersive camera

It does not invent another rack representation.

---

# 32. ACTIVE FIVE-RACK WINDOW

Preserve:

```text
selected rack
±2 logical neighboring racks
```

Only those five foreground racks receive full/medium physical detail.

When the user changes focus:

- recycle/repopulate
- do not leak old meshes
- do not accumulate renderers
- do not accumulate material clones
- do not accumulate event listeners

The previously validated repeated rack navigation behavior must remain green.

---

# 33. BACKGROUND RACKS

Background racks are visual context only.

They should:

- suggest aisle scale
- remain dark
- use low-cost geometry
- have tiny sparse lights
- not compete with selected rack
- not use full device-level Master rendering unless required

No full-resolution rack labels in the background.

No expensive port/vent detail.

---

# 34. COLOR LANGUAGE

Use PHANTOM color law.

### Cyan

- primary system focus
- selected rack
- active camera state
- restrained rack edge

### Violet

- secondary/intelligence accent
- optional network/secondary device visual family
- restrained

### Green

- success only when actual state is success
- not general decoration if it implies state

### Amber

- warning only when semantic
- if used as neutral hardware-family styling, keep extremely subtle and non-alerting

### Red

- failure/destructive only

### White / Gray

- informational
- labels
- chassis detail
- neutral state

---

# 35. LABEL QUALITY

Rack/device labels should not shimmer or blur.

Use:

- limited text quantity
- readable technical type
- distance-based hiding
- texture atlas / canvas texture reuse if current architecture supports it
- correct anisotropy only where useful

Do not create one expensive dynamic canvas texture for every background label every frame.

Text updates must be event-driven, not frame-driven.

---

# 36. NO FRAME-RATE WORK IN UI LOOP

Do not update DOM/UI state every animation frame unless truly necessary.

Renderer animation loop should not continuously:

- rebuild labels
- recalc rack inventory
- reparse Master
- allocate new arrays
- clone materials
- create geometries
- update localStorage
- touch layout-heavy DOM

Build static scene state when rack data changes.

Animation loop should mostly:

- update camera/interpolation
- update controls
- render

---

# 37. MEMORY DISCIPLINE

Every temporary scene resource needs explicit ownership.

On rack replacement or scene disposal:

Dispose/reuse:

- geometry
- textures
- materials
- render targets
- controls
- event listeners

But do not dispose shared canonical resources still used by the active engine.

Establish resource ownership.

Avoid “dispose everything” hacks.

---

# 38. RENDERER LIFECYCLE

Absolute constraint:

**One live interactive RackEngine context.**

Do not create a new WebGLRenderer because Build wants a prettier preview.

Use the current renderer attach/reparent/scene presentation model.

If current architecture uses one canvas moving between Build and Forge, preserve that design.

If it uses one renderer with different scene/camera states, preserve that design.

The visual upgrade must fit the current ownership model.

---

# 39. NO-WEBGL FALLBACK

The existing flat rack elevation remains the involuntary fallback.

If WebGL fails:

- show flat rack
- show honest unavailable/fallback state
- keep Build usable
- do not show an empty black panel

Do not add a user-facing “2D/3D” toggle merely for this work unless one already canonically exists.

---

# 40. RENDER FAILURE

If a rack cannot be rendered because inventory is missing:

Do not fabricate equipment.

Show:

```text
RACK PRESENT
EQUIPMENT DATA UNAVAILABLE
```

or the existing honest equivalent.

Physical topology can establish the rack shell.

Master data populates equipment.

Empty shell is acceptable when truth is absent.

Fake fullness is not.

---

# 41. BOOT / CACHE SAFETY

Do not make renderer visual changes dependent on stale derived cache.

Rack geometry consumes current normalized inventory.

A renderer upgrade must not:

- alter Master identity
- alter normalized inventory
- mutate cached rack counts
- persist visual mesh state as truth
- require user re-upload just because rendering code changed

Geometry is derived presentation.

It is disposable.

---

# 42. IMPLEMENTATION PHASES

Execute in small checkpoints.

## R1 — RECON + BASELINE

Before visual edits:

Capture:

- current Front screenshot
- current ISO screenshot
- current Forge screenshot
- current iPhone-width Build screenshot

Record:

- draw calls
- triangles
- object count
- materials
- textures
- renderer count
- average frame time where practical

Identify canonical render path.

No visual change yet.

Deliver a short baseline note.

---

## R2 — CABINET + RAILS

Change only:

- cabinet proportions
- frame
- rails
- RU mapping visibility
- depth
- floor contact

Do not modify device families yet.

Test.

Screenshot.

Checkpoint.

---

## R3 — DEVICE DEPTH + FAMILY SYSTEM

Introduce or refine reusable chassis families:

- compute
- network
- power
- cooling
- generic

Maintain exact canonical component placement.

Test S4:099.

Screenshot.

Checkpoint.

---

## R4 — MATERIALS

Tune:

- black powder coat
- rail metal
- chassis metal
- vent response
- subtle display glass
- accent materials

Reduce material duplication.

Test performance.

Screenshot.

Checkpoint.

---

## R5 — LIGHTING

Improve:

- key
- fill
- cyan edge
- selected-rack separation
- shadows

Do not touch unrelated UI.

Test iPhone-like DPR/resolution.

Screenshot.

Checkpoint.

---

## R6 — LOD / FOREGROUND WINDOW

Apply detail tiers:

- selected
- foreground neighbors
- background

Confirm active five-rack behavior remains canonical.

Measure.

Checkpoint.

---

## R7 — CAMERA + FIT

Tune:

- Front
- ISO
- Forge selected rack framing
- resize behavior

Verify:

- 360px
- 390px
- 430px
- tablet
- desktop

Checkpoint.

---

## R8 — POLISH

Only after structural visual system is correct:

- tiny LED tuning
- label contrast
- vent density
- reflection amount
- transitions
- selected-rack glow amount

Do not polish an incorrect geometry model.

---

# 43. VISUAL ACCEPTANCE — FRONT

Front view passes only if:

- rack is perfectly straight
- cabinet reads as physical steel
- front rails are visible
- RU positions make sense
- devices appear mounted, not pasted
- equipment families are visibly distinct
- rack is not excessively neon
- labels remain quiet
- selected rack dominates composition
- no clipped chassis
- no overlapping device geometry
- no fake devices
- S4:099 renders 19 unique components
- rack still looks good at real iPhone width

---

# 44. VISUAL ACCEPTANCE — ISO

ISO passes only if:

- side depth becomes clear
- rack does not become distorted
- equipment remains readable
- no floating devices
- no rail/chassis separation bugs
- camera movement is fast
- no visible clipping through cabinet
- no Z-fighting
- no excessive perspective distortion

---

# 45. VISUAL ACCEPTANCE — FORGE

Forge passes only if:

- selected rack is clearly strongest
- immediate neighbors remain useful
- background racks stay quiet
- selected rack uses same component geometry as Build
- five-rack foreground window still works
- moving through >10 racks does not progressively slow
- no renderer count growth
- no heat regression beyond acceptable existing behavior
- no memory accumulation
- no repeated duplicate components

---

# 46. PERFORMANCE ACCEPTANCE

Do not ship a renderer that merely looks better.

It must remain operational on iPhone.

Automated / desktop simulation checks:

- renderer count stable
- no WebGL context leak
- no console errors
- no uncaught promise errors
- no geometry count growth after repeated rack changes
- no material count growth after repeated rack changes
- no texture count growth after repeated rack changes
- no duplicate animation loops
- no duplicate resize listeners
- no duplicate pointer handlers

Stress loop:

```text
Open Build rack
→ ISO
→ Front
→ Open Forge
→ move across 10+ racks
→ return Build
→ repeat
```

Compare initial and final renderer/resource counts.

---

# 47. REAL-MASTER REGRESSION TESTS

Use the real Master fixture.

Required assertions:

### S4:099

```text
component count = 19
```

No duplicates.

No missing CDU.

No missing power shelves.

No one-component-per-cable bug.

### Reload

After reload:

```text
component count = 19
```

### Re-import same Master

After idempotent re-import:

```text
component count = 19
```

Not 38.

### Cross-rack

Spot-check S1/S2/S3 racks to prove the new geometry code did not create duplicate normalized inventory.

Renderer code must never mutate normalized inventory.

---

# 48. TEST DEVICE SIZES

At minimum:

```text
360 × 800
390 × 844
393 × 852
430 × 932
768 × 1024
desktop wide
```

Verify:

- rack fit
- control clearance
- labels
- no safe-area conflict
- no horizontal overflow
- no clipped floor
- no top cut-off
- no giant dead zone

---

# 49. INTERACTION

Existing rack interactions must remain.

Do not remove a real capability just because the new rack looks cleaner.

Preserve canonical equivalents of:

- Front
- ISO
- Top if currently supported
- Rear if currently supported
- Cables if currently supported
- Explode if currently supported and product-approved
- Open Aisle
- rack selection

Do not invent unsupported controls.

---

# 50. POINTER / TOUCH

Touch targets remain at least glove-safe.

Small rendered objects do not imply tiny touch zones.

If selecting equipment in 3D:

- raycast interaction may use invisible larger hit target
- visual geometry remains accurate
- hit target may be forgiving

Do not make technicians tap microscopic screws/ports.

---

# 51. ACCESSIBILITY

Renderer cannot be the only way to understand rack state.

The DOM/UI must still expose:

- rack identity
- component count
- relevant status
- fallback information

3D is spatial presentation.

It is not the only source of information.

---

# 52. THINGS NOT TO DO

Do NOT:

- replace RackEngine wholesale
- create another WebGLRenderer
- create a separate Build rack renderer
- create a separate Forge rack renderer
- create one component per cable
- hardcode S4:099
- invent device heights
- invent device status
- invent telemetry
- add dramatic bloom everywhere
- add purple fog
- add giant neon outlines
- add vendor logos that are not sourced
- turn rack fronts into sci-fi holograms
- model every vent hole
- model every port as expensive geometry
- run full-detail racks across the entire aisle
- create a new state store
- modify Master parser as part of visual work unless an actual renderer-blocking bug is proven
- change navigation
- redesign Build workflow
- continue renderer consolidation deletions as a side effect
- touch unrelated Site Profile or Shift code

This task is intentionally narrow.

---

# 53. SIMPLIFICATION LAW

If visual improvement requires a new parallel system, reject that approach.

Prefer:

```text
better shared geometry
better shared materials
better shared lighting
better shared camera
better LOD
```

over:

```text
another renderer
another rack representation
another cache
another code path
```

---

# 54. GIT / REGRESSION POLICY

Before large renderer changes:

- create a clear checkpoint
- identify known-good current commit
- make small commits per R-stage

If behavior breaks:

Do not patch blindly.

Use:

- git diff
- git log
- git blame
- bisect when appropriate

If Forge worked before a stage and fails after it, find the stage regression.

Do not add a compatibility exception to hide it.

---

# 55. OWNER REVIEW POLICY

Claude must do all possible validation first.

Do not ask the owner to test after every tiny code edit.

Use:

- automated page loading
- Playwright
- screenshot comparisons
- scene/resource counters
- console checks
- repeated route stress
- viewport tests

Show the owner screenshots at meaningful visual gates.

Physical iPhone test should happen only after the renderer is internally green.

---

# 56. SCREENSHOT REVIEW GATES

Show screenshots after:

### Gate A

Cabinet + rail upgrade

### Gate B

Device family upgrade

### Gate C

Lighting/material upgrade

### Gate D

Final Build rack preview

### Gate E

Final Forge aisle

Screenshots must be real app screenshots, not recreated static mockups.

---

# 57. FINAL OWNER DEVICE TEST

Only after automated tests pass, request one concise iPhone test:

```text
1. Open Build rack.
2. Confirm rack renders.
3. Switch Front ↔ ISO 5 times.
4. Open Aisle.
5. Move across at least 10 racks.
6. Return to Build.
7. Background app and return.
```

PASS:

- rack remains populated
- no blank renderer
- no duplication
- no visible slowdown
- no obvious heat spike
- no crash
- no missing controls
- no stale rack identity

FAIL:

Ask owner to report only the failed step and visible behavior.

Do not send console instructions unless the visible reproduction is insufficient.

---

# 58. FINAL DELIVERABLE

When complete, report:

## Architecture

- canonical renderer path used
- renderer count
- confirmation no second engine was created

## Visual work

- cabinet
- rails
- device families
- materials
- lighting
- shadows
- camera
- LOD
- background treatment

## Data

- confirmation all equipment remains Master-driven
- S4:099 count
- same-Master reload count
- duplicate test

## Performance

Before vs after:

- object count
- mesh count
- material count
- draw calls
- triangles
- pixel ratio policy
- frame timing where measured

## Tests

- automated tests run
- viewport screenshots
- stress test
- console result

## Remaining risks

Only genuine unresolved risks.

---

# 59. VISUAL REFERENCE INTERPRETATION

Use `PHANTOM_RACK_RENDERER_SELF_CONTAINED_MOCKUP.html` to understand the direction:

- tall physical cabinet
- narrow structural steel frame
- visible RU rail system
- equipment recessed inside cabinet
- distinct GPU / switch / power / CDU families
- dark industrial materials
- subtle cyan edge
- restrained purple
- strong floor contact
- large selected rack
- clean Front/ISO states

Do NOT treat the mockup as production code.

It is a visual prototype.

The final PHANTOM implementation should exceed it because the production renderer has real 3D geometry, real camera control, and real Master-driven inventory.

---

# 60. DEFINITION OF DONE

This task is DONE when:

1. PHANTOM still has one canonical RackEngine.
2. Build and Forge render from the same normalized rack inventory.
3. The selected rack looks physically believable.
4. S4:099 renders exactly 19 canonical components.
5. Devices are visibly recessed and mounted in the rack.
6. Rails/RU structure are clear.
7. Compute/network/power/cooling families are distinguishable.
8. Lighting looks premium without neon excess.
9. Front view is square and authoritative.
10. ISO view provides useful depth.
11. Foreground/background LOD protects iPhone performance.
12. Repeated rack navigation does not leak resources.
13. No duplicate renderer/context exists.
14. Flat fallback still works when WebGL is unavailable.
15. No fake device/data/status has been introduced.
16. Real iPhone-width screenshots look substantially better than the current rack.
17. Owner can look at the final screenshot and immediately say:
    **“That looks like a real premium datacenter rack.”**

---

# FINAL PRINCIPAL ENGINEER INSTRUCTION

Do not ask the owner to specify every bevel, material value, light position, camera coordinate, or texture choice.

Own those implementation decisions.

Use the product laws and the visual reference to make the strongest engineering and design choices.

If two technical approaches produce the same product behavior, choose the simpler and more maintainable one yourself.

Escalate only if a decision changes actual product behavior, data truth, or technician workflow.

The owner is approving the target:

> **Make the canonical PHANTOM rack renderer look exceptional while keeping it honest, fast, stable, and singular.**

Own the implementation.

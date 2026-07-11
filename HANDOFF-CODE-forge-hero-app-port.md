# HANDOFF FOR CLAUDE CODE — FORGE HERO SCENE → PHANTOM APP PORT
## Master-driven interactive hero rack · gut-bake architecture · in-app feature

**Owner:** John Hamilton · PHANTOM (`dct-ios.html`, repo `darkmatter024/phantom`)
**Written:** 2026-07-10 (web-Claude)
**This is an APP FEATURE, not a standalone mock.** Everything below goes INSIDE
`dct-ios.html`, subject to full ship discipline.
**Supersedes:** the Stage 2 "procedural hero" definition in `HANDOFF-forge-hero-scene.md`.
Aisle/staging structure from that doc still applies; the hero definition changes (§2).

---

## 1. REQUIRED FILES IN REPO BEFORE STARTING

| File | Role | Status |
|---|---|---|
| `MOCKUP-FORGE-HYBRID-AISLE-v2.html` | **PRIMARY reference** — live row, focus slide, CW hall, zoom | John downloading from chat outputs |
| `MOCKUP-FORGE-HERO-BAKE-v7.html` | Gut-bake architecture reference (single-rack composite) | John downloading from chat outputs |
| CoreWeave rack render (original PNG) | Hero + dummy chassis source art | John has original; mocks embed a compressed jpeg stand-in — DO NOT reuse it |
| `MOCKUP-HYBRID-v14.html` | Feature source for manifest/tour (Stage 4 of old handoff) | Still owed from prior chat |

**If the mocks are not in the repo, stop and ask John. Do not rebuild from this prose.**

**Also in scope alongside this port:** a light UI polish pass on the app's front
surfaces (John-directed, "final touches" grade — nothing structural). John supplies
the specific items via screenshots; do not invent polish targets.

---

## 2. THE ARCHITECTURE (locked — this replaces the old procedural hero)

**One rack, three times.** Dummies and hero use the SAME baked CoreWeave photo texture.
The hero's tray bay is cut out of the photo and live guts are drawn into the hole.

- **Photo = chassis. Canvas = guts. One composite texture.**
- Gut window — **PRODUCTION VALUES, measured on the original render (2026-07-11):**
  Source image 688×1504 → **crop box (l,t,r,b) = (114, 306, 573, 1204)** → 459×898.
  As fractions of that crop:
  `GUT = { x0:0.1046, x1:0.9041, y0:0.1080, y1:0.9320 }`
  (y1 note: LED/tray content ends at 0.929; dim base-frame continues to ~0.98 —
  do not include it. If the crop box changes, all four fractions must be re-measured.)
  Webp reference at `quality=82`: 512w=60KB · **640w=77KB (recommended)** · 768w=98KB.
  640 keeps guts text sharp under pinch-zoom for +17KB over 512.
- Hero differs from dummies ONLY by: full-brightness face (dummies ~0.60 scalar) ·
  live guts in the window · spotlight target · tappable. Chassis is pixel-identical.
  This enforces the old "hero must not read as a paste-in" rule by construction.
- **Chassis never redraws. Rack switching = `drawGuts()` + `texture.needsUpdate` only.**
  No scene teardown (HYBRID-v2 multi-rack pattern).
- Hero face material: `MeshBasicMaterial`, `toneMapped = false` — scene runs
  ACESFilmic @ exposure 0.6 (locked Forge look) and must not crush the bake.
- Scene composition per v7: single row of 7, hero center, NO opposing row (it occluded
  the camera — removed in v4, keep it removed), camera radius default ~15.2 with
  pinch-zoom clamp [6.5, 22], one-finger orbit, floor glow, fog, dimmer slider.

## 3. APP INTEGRATION REQUIREMENTS (this is inside dct-ios.html)

- **three.js r128, LOCAL — no CDN.** Strip the mock's cdnjs script tag. No Tailwind,
  no FontAwesome (mock has neither, keep it that way).
- **Single canvas / single WebGL context forever.** Reuse the app's existing 3D
  context management; never instantiate a second renderer alongside the rack-detail 3D.
- **Chassis art pipeline:** original PNG → crop to rack bounds → `cwebp -q 82
  -alpha_q 95 -m 6` → base64 embed → add to service-worker precache.
- **Offline-first:** zero network dependencies at runtime. Everything embedded.
- **HUD:** mock's HTML overlay (brand, stamp, herotag, dimmer) gets rebuilt in app
  surface language (glass pills, existing tokens `--cyan:#28e0ff --vio:#8a4bff` etc.),
  not copied verbatim. Fonts already in app (Orbitron/Chakra Petch/Rajdhani).
- **`?legacy=1` stays byte-identical.** All of this is redesign-side (`body.rd`).
- **Error paths:** every tap handler and texture-load path gets REAL error handling.
  No `catch(_){}` — that exact pattern caused the deploy-button production bug.
  Failures log to the SYS→ERRORS ring buffer.
- **THE SCENE IS DISPOSABLE (field-app rule):** full teardown on exit — dispose
  geometries, materials, textures, kill the render loop, release everything.
  This app runs 10-hour shifts; the 3D lens must leave the phone exactly as it
  found it. Any WebGL failure (context lost under iOS memory pressure) degrades
  gracefully to the FLAT lens. **Deploy workflows never depend on 3D existing.**

## 4. STAGE A — MASTER BINDING · LIVE ROW + FOCUS SLIDE
### (AMENDED per MOCKUP-FORGE-HYBRID-AISLE-v2, owner-approved)

Not a single hero — a **live front row.** The Master decides how many.

- One entry function: `openHeroScene(rackId)`. Entry points: rack tap on floor map ·
  rack row in deploy detail · deploy-switcher chips. (Same nav machinery as existing
  tab switches — re-home, don't rebuild.)
- **The front row renders the target rack AND its physical neighbors from the
  Master's own floor map** (adjacent cabs in `racksByCab`), each with its real guts.
  Neighbors that don't exist in the Master → CoreWeave-faced dummies. The data
  decides; there is no mode toggle.
- **One rack is FOCUSED at a time:** full brightness, spotlight, floor glow, plate
  lit cyan, tag shows label + racked/pending count. Non-focused live racks render
  their real guts dimmed (~0.55).
- **Focus slide:** tap a non-focused live rack → brightness crossfade, spotlight
  retarget, glow + camera drift to it, tag updates. Walking the row IS the feature —
  deployment progress across a run reads at a glance.
- **Boot framing (locked):** scene ALWAYS opens centered, straight-on, hero-focused —
  the composition of John's approved screenshot (2026-07-11). Camera controls
  (orbit/pitch/zoom) are allowed but CLAMPED: yaw ±~0.8, pitch [-0.05, 0.55],
  radius [6.5, 22] — no flying into the void, no getting lost. Lock is the default;
  movement is the exception. Re-opening the scene resets to the locked framing.
- **Zoom:** pinch (clamp ~[6.5, 22]) + one-finger orbit. User can zoom into ANY
  focused rack, far-left cab included — focus first, then zoom.
- Tap a CoreWeave dummy → nothing. Tap the FOCUSED rack → opens Stage B tile mode.
- Background rows: CoreWeave dummy hall, ONE shared baked texture (byte-cost of
  extra dummies ≈ zero; the photo is paid for once). Live-rack count costs bytes
  only in data — guts are runtime canvases. The real budget is GPU texture memory:
  keep live gut canvases ≤ ~512px wide, dispose on teardown.
- Data: `racksByCab[rackId].slots[]` — `{uStart,uEnd,type,name,model,notes}` +
  status. **Mock's hardcoded c1:00x lists DIE here. No invented data in the app.**
- Empty rack per Master → "EMPTY PER MASTER — full build ahead" + full ghost build
  (the mock's c1:005 shows exactly this).
- **VERIFY GATE (John, on iPhone, hard stop):** load real Master → open a rack →
  row shows correct neighbors → guts match xlsx row-for-row on at least 3 cabs →
  focus-slide across the full row → zoom into the far-left cab and read its guts.

## 5. STAGE B — DRILL-DOWN · RE-HOMED ONTO THE FLAT PAGE
### (AMENDED 2026-07-11, owner decision "option A")

The 3D scene does NOT grow its own device-detail UI. Drill-down re-homes onto the
EXISTING FLAT rack elevation page. Each surface does one job:
**3D = where am I · FLAT = what goes here · sheet = what is this.**

- **Tap flow (locked):**
  1. Tap a non-focused live rack → **focus-slide** (crossfade, spotlight retarget,
     camera drift — glance at its guts in 3D)
  2. Tap the FOCUSED rack → **opens the existing FLAT rack elevation page** for
     that cab (the install-reference view: full 48U, every Master device in
     position, ghost slots for un-racked — the "cage nut page")
  3. Escape hatch: the focus pill gains an **OPEN RACK** button — one tap to the
     FLAT page when you already know where you're going (gloved-hand rule)
- **On the FLAT page:** tap any U/device row → **device sheet**:
  1. Master row: name, model, uStart–uEnd + RU count, notes, status
  2. **Platform reference card summary** — match model/type to existing Platforms
     reference content. RE-HOME, DON'T REBUILD. (Ask John for the matching key;
     type-level fallback card if no exact match.)
  3. Quick actions: log note (existing quick-chip machinery) · flag blocker ·
     jump to full reference card
  4. CONNECTIONS section — Stage C, gated on the Master connectivity answer
- Tap a blank U → "U<n> · BLANK PER MASTER" — never a dead tap.
- NOTE: this makes the flat-fit work (`HANDOFF-v1.14.225-flatfit-lens-taps.md`,
  still unshipped) a DEPENDENCY of Stage B — the FLAT page must fit one screen
  before it becomes the drill-down destination. Sequence it accordingly.
- **VERIFY GATE:** flank tap slides focus · focused tap lands on the correct cab's
  FLAT page · OPEN RACK button works · U-tap sheet matches Master on every slot
  type incl. blank · back-navigation returns to the 3D scene with focus intact.

## 6. STAGE C — FIBER HOPS (blocked on a data question)

- **BLOCKED until John answers: does the Master xlsx contain a patching /
  port-map / fiber-runs sheet?** Do not start C without this answer.
  - YES → parser work: `linksByDevice[name] = [{localPort, farRack, farDevice,
    farPort, media}]`. Sheet gains CONNECTIONS section; each far-end row tappable →
    `openHeroScene(farRack)` → the hop. Breadcrumb trail for back-walking.
  - NO → it's a data-capture problem; capture-flow design happens with John first.
- **Parked, do not build:** 3D fiber arcs drawn between racks in-scene. Zero field
  value over the sheet list.
- **VERIFY GATE:** trace one real, known fiber run on device; PHANTOM's answer must
  match the actual floor. Field-truth is the test.

## 7. SEQUENCING — DO NOT REORDER

1. **Current open gates close first:** the outstanding batch device-verify
   (.224/.225/.226 items) · John's Forge Stage-1 aisle sign-off · the flat-fit +
   MINI-strip + Command-cards handoff (`HANDOFF-v1.14.225-flatfit-lens-taps.md`,
   ships as next free version number) · v14 mock into repo.
2. Forge Stage 2 = THIS hero (gut-bake), replacing the old procedural hero spec.
3. Stage A → John verifies → Stage B → John verifies → Stage C per data answer.
4. Each stage is its own versioned ship. **Max 1 unverified ship in flight —
   the 6-deep unverified stack from .219–.224 does not happen again.**

## 8. SHIP DISCIPLINE (every ship, no exceptions)

OODA curl live main before edits · surgical `str_replace` edits · `node --check` ×3 ·
CSS brace-balance gate · three-stamp lockstep (`dct-ios.html` / `sw.js` /
`version.json`) · `CACHE_VERSION` bump · **John device-verifies on iPhone before
anything counts as shipped** · `?legacy=1` byte-identical.

## 9. OPEN QUESTIONS (ask John, don't assume)

1. Master connectivity sheet — exists? (gates all of Stage C)
2. Model→reference-card matching key?
3. Forge scene's place in nav: default rack-detail entry, or a lens beside FLAT/3D?
4. Hop breadcrumb depth cap?

# SHIP B — BUILD PLAN (FLAT dies, 3D is the view)
**Author:** Claude Code, from live recon of `dct-ios.html` at v1.14.352, 2026-07-25.
**Rulings this executes:** `design/OWNER-RULINGS.md` (2026-07-24, SHIP B block).
**Status:** ✅ **SHIP B COMPLETE. Edits 1–8 = v1.14.353 (`4f84c65`); edit 9 (B4.3 reflow) + the 44px
door = v1.14.354 (`9c0c4de`). Both ships gate-PASS, awaiting the consolidated `.351–.354` device pass.**

> **EDIT 9 SHIPPED (.354, owner ruling a):** the 3D elevation now renders just below NEXT ACTION under
> redesign. NOTE for the record: a naive whole-block move was caught by BOTH gates as a `?legacy=1`
> Rule-11 break (deploy_showRackDetail is a SHARED function — the reorder hit legacy too). Redone with
> the reorder **redesign-gated** (the elevation builds into `rehHybridHtml` and is flushed before Ghost
> Echo for legacy / after NERVE for redesign). Lesson: any reorder inside a shared deploy_* render
> function must be `redesign_isOn()`-gated or it silently reorders `?legacy=1`. Option (b) — lifting
> NEXT ACTION above COMPONENTS/phase-dots — was NOT chosen; owner picked (a).

> **EDIT-9 HOLD (why, 2026-07-25):** recon during execution proved NEXT ACTION is rendered by a
> SEPARATE function — `nerve_buildRackCard` (`:49212`), emitted at `:35476` — not inline in
> `deploy_showRackDetail` as the plan assumed. So "open on NEXT ACTION" is a multi-block layout
> judgement (3D block just below NERVE? or NERVE lifted above the COMPONENTS card / phase dots
> too?) on a surface only the owner sees. It is pure html-ordering, 100% separable from the WebGL
> inversion; shipping it inside the HIGH-risk `.353` would make that ship's device verify
> unbisectable (the spec's own do-not-combine principle). Ship `.354` = move the 3D elevation
> block (`deploy_showRackDetail`, currently emitted before NERVE) to the owner-chosen position;
> verify the double-rAF init (`rackHybrid_initSync`, `rackFlat_applyFit`) still fires after the
> moved markup. Everything else in this plan is done.

**Status (original):** recon COMPLETE, findings RULED ON, cleared to execute top-to-bottom. Read findings first.

> **OWNER SIGN-OFF (John, 2026-07-25):**
> - **F1 CONFIRMED** — mode segments die; `.reh-3d-toggle` container STAYS as the control strip,
>   reseeded with the single OPEN AISLE door; the 3D view keeps its own camera/EXPLODE/CABLES
>   controls. Build it exactly as F1's resolution states.
> - **F2 APPROVED** — FLAT stays as the hidden no-WebGL fallback ONLY (never a selectable mode).
>   Approved deviation from spec B4.1; state it in the ship note.
> - No open questions remain. Execute the EDIT LIST in order; standing gates + both agents apply.
**Scope note:** SHIP B's "deployment page" = the **rack detail** page (`deploy_showRackDetail`,
`:35228`). The FLAT|3D|AISLE pill (`:35405`) AND the PHASE RUNNING LONG card (`:35613`) both
live there. This ship is confined to that one function + the reh3d module it drives.

---

## THREE FINDINGS THAT CHANGE THE SHIP (surfaced before any edit)

### F1 — "The pill dies entirely" cannot be literal: it is a load-bearing injection anchor.
The `.reh-3d-toggle` container is not just FLAT|3D|AISLE. At 3D render time, `rackElevation_render3D`:
- resolves `_strip = document.querySelector('.reh-3d-toggle')` (`:34102`),
- **appends the CABLES filter chip into it** (`:34136`),
- **injects the VIEW RAIL (FRONT|ISO|TOP|REAR) + EXPLODE as a sibling** via `_strip.parentNode`
  (`:34144`).

Delete the container and `_strip` is `null` → CABLES, the camera rail, and EXPLODE all silently
stop building (every block is `if (_strip …)`-guarded). That strips the 3D view of its own
controls — a 3D rack you cannot rotate, explode, or cable-filter. Not the intent.

**Resolution (serves the ruling, keeps the view usable):** the **mode SEGMENTS** die (FLAT, 3D
buttons — `:35406-35407`) and AISLE-as-a-segment dies (`:35408`). The **`.reh-3d-toggle`
container STAYS as the 3D control strip** so CABLES/rail/EXPLODE keep their anchor. It is
re-seeded with the single **OPEN AISLE door**, styled as a door (NOT `.reh-3d-seg`). CABLES is a
filter and rides the same strip honestly; the camera rail stays its own row below.
The mode toggle is gone; the 3D view keeps its native controls. ← **confirm this reading, F1.**

### F2 — FLAT must survive as the no-WebGL fallback, or rack detail bricks to a black box.
Spec B4.1 says "delete the flat rendering path." But under redesign, `#rehFlatWrap`
(`:35417`, the flat elevation) is the fallback `reh3d_fail` drops to when three.js can't load
(`:33500`, `reh3d_fail` → FLAT + toast). If 3D is "always mounted" and flat is deleted, a device
without WebGL — or any three.js load failure — shows **nothing**. That is a No-Silent-Failures
violation (CLAUDE.md hard rule).

**Resolution:** FLAT-as-a-selectable-**mode** dies (no toggle, never user-chosen). FLAT-as-
**involuntary-fallback** stays: `#rehFlatWrap` remains in the DOM, hidden while 3D is live,
revealed only when WebGL/three.js is unavailable. The user never sees flat as a choice; they see
it only if 3D genuinely can't run. Serves the ruling's intent; keeps the safety net.
**Deviation from spec B4.1 — will be stated in the ship note.**

### F3 — the `:35421` else-branch is LEGACY, not a fallback.
The `:35416`/`:35421` split is gated on `redesign_isOn()` (`:35399`, `:35412`), not WebGL.
`:35421` is the `?legacy=1` path → **out of fence, untouched.** (Corrects a mid-recon hypothesis
that it was the no-WebGL fallback; the real fallback is F2's `reh3d_fail`.)

---

## THE INVERSION (mechanism)

Today: `#rehFlatWrap` visible by default (`:10548` `display:contents`); `.reh-3d-mount`
`display:none` until `.is-3d` lands on `#reh3dCanvasHost` (`:10549-10551`). `.is-3d` is added
only by `reh3d_setMode('3d')` (`:33458`), a user tap (or `reh3d_restore` if pref on, `:33442`).

Target: 3D is the default. **Keep the `.is-3d` mechanism** (minimal blast radius — every render
guard at `:33486`, `:33524`, `:34089` already keys on it) but **set it unconditionally at render**
and remove the FLAT branch of the toggle. Concretely:
- At rack-detail mount (the double-rAF at `:35425`), if `redesign_isOn()` and WebGL OK: add
  `.is-3d` to `#reh3dCanvasHost` and call `rackElevation_ensure3D(rack, #reh3dMount)` directly.
- `reh3d_fail` (`:33492`) keeps removing `.is-3d` → `#rehFlatWrap` shows (F2 fallback). Drop its
  button/`prefSet` lines; keep the toast + flat reveal.
- ⚠️ **`display:contents` trap ([[feedback_display_contents_breaks_webgl_mount]]):** `#reh3dMount`
  is a real box (`:10549`, `position:relative;height:60vh`), a SIBLING of `#rehFlatWrap`, NOT under
  it. Keep it that way. Do not let the always-on mount inherit `display:contents`. `render3D`
  measures `clientWidth/Height` (`:33518`) and already retries on zero-size (`:33524`) — verify it
  gets real dimensions on the cold, default-3D path (it previously only mounted after a tap, when
  layout was settled).

## EDIT LIST (exact anchors, verify each at execution)
1. **CSS `:10548-10551`** — invert the reveal. `#rehFlatWrap` becomes the hidden-unless-fallback
   layer; `.reh-3d-mount` shown by default. Keep `.is-3d` as the live-3D flag OR flip to an
   `.is-flat`-fallback flag — pick the one that keeps `reh3d_fail` a one-line reveal. Keep both
   as real boxes.
2. **Pill template `:35405-35409`** — remove FLAT/3D segments + AISLE segment. Keep the
   `.reh-3d-toggle` container (F1 anchor). Seed it with one **OPEN AISLE** door → `forge3d_open()`,
   door-styled, `aria-label="Open the 3D aisle"`. Add a door CSS class (new, small).
3. **Mount call site `:35425`** — inside the double-rAF, add the unconditional 3D mount for the
   redesign+WebGL path (see mechanism).
4. **`reh3d_setMode` `:33446`** — retire. Grep all callers first: `:18607` (forge3d_close),
   `:33442` (reh3d_restore), `:33463`/`:33470` (self). Replace forge3d_close's reset (F-rewire);
   delete restore's pref gate; the FLAT/3D button toggling inside setMode goes with the buttons.
5. **`reh3d_restore` `:33440` + `reh3d_prefOn/Set` `:33429` + `REH3D_PREF_KEY`** — retire the
   per-session mode pref; the mode it chose no longer exists. Verify no other reader.
6. **`forge3d_close` `:18607`** — `reh3d_setMode('flat')` reset → restore the rack-detail **3D**
   view (the only defined state now). Read `:18600-18615` at execution to see what state it
   expects; likely just ensure `#reh3dCanvasHost.is-3d` + re-ensure the mount.
7. **CABLES/rail injection `:34094-34160`** — should need NO change if F1's container stays
   (the `.reh-3d-toggle` query still resolves). CONFIRM `_strip` still found after reseed. The
   hero path (`_heroCard`, `:34093-34100`) is untouched.
8. **PHASE RUNNING LONG card `:35613`** — remove (B4.4). Keep the NEXT ACTION overrun chip
   (locate exactly at execution — the amber "1213 min on POWER" chip inside NEXT ACTION;
   grep `min on ` / the anomaly block feeding NEXT ACTION). One fact, one surface.
9. **B4.3 reflow** — rack detail opens on NEXT ACTION, 3D block below. This is a REORDER of the
   `deploy_showRackDetail` html assembly (currently elevation-first). Lowest-risk form: move the
   3D block emission after the NEXT ACTION block; do NOT rewrite either. Verify the double-rAF
   init (`rackHybrid_initSync`, `rackFlat_applyFit`, `:35426-35427`) still fires after the moved
   markup exists.

## GATES (this ship)
Standing: JS ×3 vm.Script · CSS brace net-0 · three-stamp `.352→.353` · CRLF preserved ·
`?legacy=1` byte-identical (all edits body.rd/`_rehRd`-gated; `:35421` untouched) ·
two-WebGLRenderer discipline. PLUS:
- grep: zero `reh3d_setMode` references remain; zero `REH3D_PREF_KEY`.
- grep: `forge3d_open` still reachable from exactly the new OPEN AISLE door (+ any pre-existing).
- **RACK SCENE LOCK note (required in ship note):** no lights/exposure/fog/tone-mapping/
  type-colour/geometry value is touched — this ship changes the **mount reveal path + control
  strip contents + card order only.** Scene internals untouched.

## RISK
HIGH (LR-2). WebGL mount inversion + injection-anchor preservation + page reflow, all
field-only-verifiable, with two historically-expensive traps in range (display:contents,
declare-above-first-use). Own batch slot. Owner device verify per B5, both shells (390 + 1024+).

# RACK-DETAIL BUG HUNT — PHASE 0 EVIDENCE

**Commission:** PHANTOM-BOARD-NEXT-OPS.md Q-1 — *"is the renderer called / does it throw / is the
container zero-size; diff Ship A for shared init that died with the deleted preview card."*
**Baseline:** `main` @ `ed0722b`, `phantom-v1.14.556`, working tree clean for `dct-ios.html`.
**Date:** 2026-08-31. **Status:** EVIDENCE ONLY — no fix written, no stamp, nothing shipped.

---

## VERDICT IN ONE LINE

A real, reproducible defect exists and it empties the rack elevation — but it is **not** the
"renderer never called / throws / zero-size host" shape the commission expected. **Ship A
(`v1.14.531`) removed the 3D mount and one of the two callers that mounts into it. The second
caller survived, and it now hides the only rack visual that is left.**

---

## THE THREE COMMISSION QUESTIONS

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Is the renderer called? | **Yes, and it renders.** The flat elevation builder runs on every rack-detail open and produces a real 120px box. `rackElevation_render3D` is deliberately NOT called here any more — Ship A's intent. | `dct-ios.html:41587` emits `#rehFlatWrap` from `rackElevation_buildHtml(rack)`. Measured baseline: `#rackCanvas` height **120px**. |
| 2 | Does it throw? | **No. Nothing throws, anywhere on the path.** That is why every existing instrument is blind to it. | `rackElevation_ensure3D` early-returns on a null mount (`dct-ios.html:39153`). Probe captured zero errors from `forge3d_open` / `forge3d_close`. |
| 3 | Is the container zero-size? | **Only after the trigger fires — and the app's own zero-size instrument still cannot see it.** The elevation goes 120px → **0px**, but the OPS host it measures only drops 120px → **51px**, above the 8px threshold. | `.461` instrument at `dct-ios.html:41741-41748` measures `c` (the OPS host), not the elevation card. |

**⛔ A measurement trap sits on question 3, and it caught me first.** `#rehFlatWrap` is
`display: contents` (`dct-ios.html:11117`), so it has **no box of its own** — measuring *it* for
height reports a false zero even when the rack renders perfectly. My first probe run failed all
four tests on that false zero. The honest instrument is its child `#rackCanvas`
(`dct-ios.html:40794`), which carries the actual pixels. This is the recorded
*display:contents-killing-a-measured-mount* class, and any fix's regression test must measure the
child, never the wrapper.

---

## SHIP A — WHAT DIED WITH THE DELETED PREVIEW CARD

Ship A is **`001bcc2` — `v1.14.531`, "remove the dead 3D mount, elevation stands alone"** (its own
commit body names it *"Ship A of RACK-DETAIL-CLEANUP"*). Its `dct-ios.html` diff is 26 lines and
removes exactly two live things:

1. `<div id="reh3dMount" class="reh-3d-mount"></div>` — the dead half of the two-surface card.
2. `if (_rehRd && typeof reh3d_restore === 'function') reh3d_restore(rack);` — inside
   `deploy_showRackDetail`.

**The shared-init audit the commission asked for comes back CLEAN.** `reh3d_restore`
(`dct-ios.html:39129-39132`) does only two things: `window._reh3dRack = rack` and
`reh3d_activate3D()`. The commit claimed `window._reh3dRack` had no other reader; **that claim
holds** — it is written at `:39130` and read only at `:39139`, inside `reh3d_activate3D` itself. No
shared initialisation died with the card. Ship A's stated reasoning was sound.

**What Ship A missed is a caller, not an initialiser.** `reh3d_activate3D` has a **second** caller
that Ship A did not audit:

```js
// dct-ios.html:19690-19693, inside forge3d_close
} else if (typeof reh3d_activate3D === 'function') {
  // No captured lender — the aisle was opened from a path that held no attachment. Preserve the
  // pre-.427 behaviour exactly rather than changing what those paths do.
  try { reh3d_activate3D(); } catch (e) { phantom_logErr('forge3d_close:reactivate3D', e); }
}
```

Ship A's own commit message predicted this exact failure for the wrong fix — *"reh3d_activate3D
adds .is-3d BEFORE it looks for the mount ... would have hidden the flat elevation via :11276 and
left the card genuinely empty."* It removed the caller it could see and left the one in another
function.

---

## THE MECHANISM

1. `forge3d_close` finds no lender → calls `reh3d_activate3D()` (`dct-ios.html:19693`).
2. `reh3d_activate3D` resolves `#reh3dCanvasHost` — **which still exists**, its id deliberately
   retained by Ship A — and adds `.is-3d` **before** looking for the mount (`dct-ios.html:39146`).
3. CSS `body.rd .rack-hybrid-canvas.is-3d .reh-flat-wrap { display: none; }`
   (**`dct-ios.html:11119`**, live at `.556`) hides the flat elevation — since Ship A, the *only*
   rack visual on the page.
4. `rackElevation_ensure3D(rack, document.getElementById('reh3dMount'))` gets **null** — Ship A
   deleted that node — and early-returns at `dct-ios.html:39153`. Nothing is drawn.
5. Nothing removes `.is-3d` again. The only remover is `reh3d_fail` (`dct-ios.html:39171`), which
   is never reached because the load was never attempted.

**Net effect: a control rail sitting over an empty box — precisely the condition Ship A shipped to
eliminate, restored by the caller it did not audit.**

---

## REPRODUCTION (Playwright 1.62.1, throwaway probe, since deleted)

| Probe | Path | Result |
|---|---|---|
| **A · Baseline** | Build → rack detail | **PASS.** `flatHeight:120`, `hostIs3d:false`, `mountPresent:false`. Ship A's end state is correct and the elevation renders. |
| **C · Mechanism** | call `reh3d_activate3D()` directly | **DEFECT.** `flatWrapDisplay` `contents`→`none`, `flatHeight` **120→0**, `hostIs3d` false→**true**, host 120→**51px**. |
| **D · Round trip from BUILD** | rack detail → OPEN AISLE → close | **PASS — does NOT reproduce.** A lender *is* captured (`{kind:'rack', hasReacquire:true}`), so `forge3d_close` takes the `_owner.reacquire()` branch and never reaches the landmine. |
| **E · Round trip from HOME** | Home → rack detail → OPEN AISLE → close | **DEFECT, through the real door.** `lender: null` → falls to `reh3d_activate3D` → `flatHeight` **120→0**, `hostIs3d:true`, host **51px**. |

**E reproduces identically on `desktop-chromium` (1440×900) and `phone-webkit` (iPhone 13,
390×844).** No exception is thrown on either. Numbers are byte-identical across both projects.

### Why the two round trips differ

`forge3d_open` captures the lender from `RackEngine.active()` (`dct-ios.html:19635-19637`). After
Ship A, rack detail registers **nothing** — `rackElevation_render3D` (`dct-ios.html:40773`) is the
only non-aisle registrar and it is no longer called from this page. So the attachment that saves
the Build path belongs to **Build's own preview**, not to the rack detail. Reach rack detail by a
path where Build's preview never mounted — the deep-link / back-nav restore, which calls
`deploy_showRackDetail` from wherever the operator is — and there is no lender to hand back to.

---

## WHY THIS SURVIVED EVERY INSTRUMENT

- **It never throws.** `phantom_logErr` and every `try/catch` on the path see nothing.
- **The `.461` zero-size instrument measures the wrong box.** It measures the OPS host `c`
  (`dct-ios.html:41741-41748`) against an 8px floor. The host survives at **51px** — the control
  rail — so the warning and its toast never fire while the rack itself is at 0px.
- **It self-heals on any re-render.** `c.innerHTML = html` (`dct-ios.html:41730`) replaces
  `#reh3dCanvasHost` with a fresh node carrying no `.is-3d`, so tapping the rack again restores it.
  That makes it present as intermittent — "sometimes the rack is missing" — which is the hardest
  shape to report and the easiest to disbelieve.

---

## HONEST BOUNDS — WHAT THIS DOES **NOT** ESTABLISH

- ⛔ **It is not proven that this is the failure the sandbox gate is open on.** The board records
  the symptom as "Rack-detail visual renders — OPEN" without a reproduction path. This evidence
  proves *a* defect that empties the elevation; it does not prove it is *the* one observed.
- ⛔ **My first hypothesis was half wrong and the probe corrected it.** I expected the aisle round
  trip to reproduce from Build. It does not (probe D). Only the no-lender path does (probe E).
- ⛔ **Not device-verified.** WebKit-on-Windows is not iOS Safari, per the harness's own warning.
- ⛔ **No data-side check was performed.** Per the standing trap, an "empty rack" report can be
  *data* (~42% of cabs are cable-only). The probe used a synthetic 5-slot rack, so this evidence
  speaks only to the code path, not to any specific field rack.

---

## FIX OPTIONS — NOT WRITTEN, NOT SHIPPED, FOR OWNER RULING

Smallest first. Each is one visible change; none has been applied.

1. **Guard the mount before the class** (~2 lines, in `reh3d_activate3D`): return early when
   `#reh3dMount` is absent, *before* `host.classList.add('is-3d')`. Fixes every caller at once and
   restores the invariant Ship A's own commit message stated. **Recommended.**
2. **Neutralise the surviving caller** (~1 line, in `forge3d_close`): drop the `else if` branch that
   Ship A orphaned. Narrower, but leaves the landmine armed for any future caller.
3. **Delete the now-unreachable CSS** (`dct-ios.html:11119-11120`): correct in principle since
   nothing should add `.is-3d` any more, but it treats the symptom and leaves the class churn.

**Option 1 also closes the class, not just the instance** — `.is-3d` can no longer be added to a
host that has nothing to draw into, from any caller, ever.

Any fix ships with a regression test that measures **`#rackCanvas`**, never `#rehFlatWrap` — see
the measurement trap above.

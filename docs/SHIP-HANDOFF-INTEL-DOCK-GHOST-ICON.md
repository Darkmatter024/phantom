# SHIP-HANDOFF-INTEL-DOCK-GHOST-ICON

**Status:** HELD — Phase 0 may start immediately. Ship 1 is blocked on the asset existing.
**Act:** 1 — Run the shift. Makes this act shorter by: nothing on its own. This is the asset prerequisite that unblocks INTEL-DOCK, which is where the act-1 saving lives.
**Version:** no bump until Ship 1.
**Supersedes:** nothing. Amends nothing. This is a prerequisite carved out of SHIP-HANDOFF-INTEL-DOCK so that spec stops being blocked on an asset it does not own.

---

## 0. Preflight

Standing rules apply unchanged:

- `/graphify . --update` and read `graphify-out/wiki/index.md` plus the relevant god nodes before any patch. Fail loudly if graphify is missing.
- Patches are written against verified source only. Never against assumed anchors.
- One visible change per ship. Owner device-verifies on the phone before the next ship.
- Three-stamp lockstep on any version bump: `dct-ios.html` / `sw.js` / `version.json`.
- Ship loop is build → staging → verify → promote. Claude Code never moves `release`.
- Product questions park in the evidence table's Q section. Do not end turns with questions.

**Mock provenance:** the source image is owner-selected art. The prohibition on porting mock code does not apply to image assets. This asset is permitted once it passes the art pipeline below.

---

## 1. Why this exists

INTEL-DOCK is fully specified and all four owner rulings are recorded, but it cannot be built: the dock needs a fifth icon that does not exist. The DCT Assistant ghost has no dock-family asset.

The four shipped dock icons (COMMAND gauge, BUILD rack, TOOLS wrench, EXIT door) came from an owner-selected set with a shared treatment — bright glass body, neon rim light, dark interior. The ghost must join that family or the dock reads as four icons and a sticker.

This spec covers the asset only. It does not build the dock.

---

## 2. Source art and its three problems

Owner-selected master exists: a glass ghost, cyan rim-lit, circuit-trace irises, scalloped hem. The art direction is correct and is not in question.

Three things stand between it and a dock asset. All three are owner-side, none are Claude Code's.

**P-1 — Detail load at dock size.** The irises carry circuit traces, pin rows and vias. The dock renders at 44px. At that size the traces resolve to noise and the eyes read as two lit ovals. Compare against the wrench, which is one shape and survives the reduction. Either the irises simplify to plain lit ovals, or the detail is accepted as invisible weight. It cannot be both.

**P-2 — No alpha channel.** The master is composited on solid black. The icon spec requires true alpha. This one does not knock out: the ghost's own body is near-black glass, so a black-to-transparent key destroys the subject along with the background. **The asset must be re-rendered with a transparent background at source.** Do not attempt a post-hoc key, and do not accept an asset that merely looks right on a black dock.

**P-3 — Brightness not yet matched.** The four shipped icons already have a known defect: the wrench renders smaller and dimmer than its neighbours and the EXIT door floats above the row, from bitmap padding mismatch. The planned fix is a uniform batch re-render. **The ghost joins that batch rather than being matched to the current inconsistent set** — matching a broken row propagates the break.

---

## 3. Asset specification

Locked, matching the existing icon spec:

| Property | Value |
|---|---|
| Dimensions | 256 × 256 |
| Format | WebP |
| Alpha | True alpha, rendered at source |
| Encode | `cwebp -q 82 -alpha_q 95 -m 6` |
| Padding | Identical to the batch. Subject fills the same proportion of the canvas as the other four. |
| States | **One file only.** |

**One file only** is load-bearing. INTEL-DOCK calls for the ghost lit when the assistant is online and visibly dimmed when offline. That dimming is applied by the app at render time, not baked into two assets. Per the standing dock-icon ruling, active-state emphasis is the app's job and brightness is uniform in the file.

**Acceptance test before the asset is accepted:** place the candidate at 44px in a row with the other four dock icons and look at it on the phone. If it does not read as a ghost at that size, it fails, regardless of how it looks at full resolution.

---

## 4. Phase 0 — evidence only, no patch

Claude Code may start this now. Report only. No source changes, no version bump.

1. **Locate the dock icon render path.** Which function draws the dock row, where the four icon files are referenced, and how the active state is currently applied (CSS filter, opacity, separate asset, or something else). Name file and line for each.
2. **Measure the four shipped icons.** For each: pixel dimensions, byte size, whether it carries a real alpha channel, and the bounding box of non-transparent pixels as a proportion of canvas. This is what P-3's padding mismatch actually is — measure it rather than describing it.
3. **Establish what a fifth slot costs.** The dock is currently four slots. Report what changes structurally when it becomes five: fixed widths, flex behaviour, label truncation at the narrowest supported viewport, and the nav-clearance token from the `.532` ResizeObserver work.
4. **Name the collision.** The standing note records an open owner ruling on the ghost-versus-SHIFT fifth-slot collision. State what the current source actually has in that slot so the owner rules against fact, not memory.

Report as one evidence table. Product questions go in the Q section.

---

## 5. Ship 1 — asset integration

**Blocked until the asset lands.** Do not begin.

Scope, when unblocked: place the ghost asset in the dock's fifth slot with the online/offline state applied by the app. One visible change. No behaviour beyond the icon appearing and dimming.

Everything else INTEL-DOCK specifies — the assistant surface itself, the "needs signal" sheet, EXIT moving to the bottom of SYS — stays in SHIP-HANDOFF-INTEL-DOCK and is not in this ship.

### Definition of done

- Asset committed at 256×256 WebP with a verified alpha channel. Grep gate: no second ghost asset file, no `-dim` or `-active` variant anywhere in the tree.
- Dimming applied at render time. Grep gate: exactly one ghost asset path referenced in source.
- Three-stamp lockstep.
- Playwright `--project=phone-webkit` green, with a spec pinning that the dock renders five slots and that the offline state changes the rendered ghost's applied style rather than its source path.
- Owner sees it on staging, on the phone, at real dock size, before any stamp.

### Door ledger

Opens: 0. Closes: 0. An icon swap in an existing slot is neither.

---

## 6. Owner actions

These are John's, not Claude Code's:

1. Rule P-1 — simplify the irises, or accept the detail as invisible.
2. Re-render with true alpha at source (P-2).
3. Fold the ghost into the uniform brightness batch with the other four (P-3).
4. Rule the fifth-slot collision against whatever Phase 0 reports.
5. Run the 44px row test before accepting the asset.

Until item 2 lands, Ship 1 does not start and INTEL-DOCK stays blocked.

---

## 7. Open rulings

| ID | Question | Recommendation |
|---|---|---|
| G-1 | Do the irises keep circuit detail at dock size? | Simplify. Invisible detail is file weight. |
| G-2 | Does the ghost ship before or after the uniform brightness batch? | After. Matching a broken row propagates the break. |
| G-3 | Fifth slot: ghost or SHIFT? | Parked for the owner, against Phase 0 evidence. |
| G-4 | Does the offline dim have a copy affordance in the dock itself, or only in the sheet? | Sheet only. The dock is not a place for sentences. |

# PHANTOM — Banner Render Directive
Applies to all five BUILD banner rows. Locked against candidate **B** (current OPS key).

---

## 1. Output size

**Render a 6:1 ultra-wide master. Do not render to final ratio.**

| | Width × Height |
|---|---|
| **Master (render this)** | **4344 × 724** — 6:1 |
| Crop window taken from it | 2100 × 724 — 2.90:1 |
| Horizontal runway gained | 2244 px |

The runway is the point. It lets the 2.90 window slide until the subject lands at 72%
without re-rendering. A master cropped tight to 2.90 has no slack and one bad frame
costs a whole regeneration.

**Minimum acceptable master height is 724px.** The last DEPLOY came in at 261px tall —
a 2.90 crop off that is 757×261, and phone @3x needs 1170 wide. That's a 1.5× upscale
on hero art. If the generator caps below 4344 wide, render 6:1 at the largest height
it will give and check the crop still clears 2100×724.

---

## 2. Composition

```
0%                    45%              72%                 100%
|---- DEAD ZONE ------|--- falloff ----|-- SUBJECT --|------|
|  near-black aisle   |                |   centroid  |
```

- **Left 45% is a dead zone.** Empty aisle receding into dark. No subject, no light
  source, no specular hit, no glow crossing into it. This is where the label sits.
- **Subject centroid at 72%** of the final crop, ±2%.
- Subject occupies roughly the right third. Nothing important past 93% — it gets
  clipped on narrow shells.

---

## 3. Lighting — the rule that keeps breaking

**Light stays attached to the subject.** That is the whole constraint.

B works because the tablet is the only lit object in frame and everything else falls off
to near-black. The failed DEPLOY renders lit the subject correctly, then ran horizontal
glow streaks the full width of the frame — which is exactly what carried light into the
dead zone. Bright saturated pixels spanned 5–1567 of a 1568px master. There was no dark
region left to crop toward.

**Do not include:**
- Energy streaks, light trails, data beams, or particle flows travelling laterally
- Floor specular reflections running toward the left edge
- Ceiling light runs receding down the aisle on the left side
- Any second light source in the left half

**Do include:**
- One motivated light source: the subject itself, or the rack it sits in
- Aisle falloff to near-black by 40% across
- Cool key consistent with the set — the existing cyan/violet cast is right

---

## 4. Prompt language

> Ultra-wide 6:1 cinematic datacenter photograph, 4344×724. A [SUBJECT] positioned in the
> right third of the frame, roughly 72% across. The left 45% of the image is empty dark
> cold-aisle corridor receding into near-black — no lights, no reflections, no glow, no
> detail. The only illumination in the frame comes from the subject itself and the rack
> immediately around it. Cool cyan and violet cast. Deep shadow, very low ambient. No
> light streaks, no energy trails, no particle effects, no floor reflections. Shot at
> rack height on a long lens, shallow depth of field.

Subjects per row:
| Row | Subject |
|---|---|
| DEPLOY | Server chassis on extended rails, half-seated into a rack |
| SCAN | Serial/asset label on a chassis face, close |
| HANDOFF | Rugged tablet held mid-transfer |
| MASTER FILE | Rack elevation on a screen |
| OPS | *(locked — do not re-render)* |

---

## 5. Acceptance check — hot-core position

The established metric is **hot-core position**: where the subject's brightest mass sits
across the frame. Target **62–68%**, which places the subject clear of the left-45% text
scrim without pushing it off the right edge.

| Check | Accept |
|---|---|
| Hot-core position | 62–68% |
| Native aspect | 2.89–2.91 (rendered native, NOT cropped from 2:1) |
| Left 45% | clear of subject mass and of any lateral light |
| Background racks | dark surfaces, LED points surviving |
| Baked text | none |

Accepted set values on record: DEPLOY 62.9%, SCAN 62.4%, HANDOFF 82.1% (deliberately
outside the set), MASTER FILE native-clearing.

> **SUPERSEDED — do not use.** An earlier revision of this section defined a left-45%
> luminance test (mean / p95 / p99) benchmarked against a candidate the assistant had
> itself just picked. That test was invented mid-session, was circular, and was never the
> pipeline's standard. It was used to fail four banners that a prior session had already
> iterated and accepted. It has been removed. If you have a copy of this doc showing a
> p99 table, that copy is stale.

---

## 5.5 Baked text — RULING (2026-07-30)

Screen content in banner art is **allowed and wanted**. A NOC or datacenter photograph
with blank monitors reads as fake. The prohibition is on *legible fabricated values*,
not on text as such.

**The rule is type size, measured in the SHIP CUT — not the master.**

> No text taller than **10px in the 1170×403 phone cut.**

Absolute pixel figure, pinned to the shipped asset. Masters differ in height (DEPLOY 736,
HANDOFF 611) so a percentage-of-master threshold would gate the same art differently
depending on how it was rendered. It measures the wrong frame. The phone cut is fixed at
403px tall for every row, so it is the only stable gate.

Test procedure:
1. Downscale the master to exactly 1170×403.
2. Measure the tallest glyph. Over 10px fails.
3. Confirm at true on-screen size (390px wide) that nothing resolves as a readable value.

**What passes:** dense small screen content, log lines, row labels, chart axis ticks,
hardware faceplate markings — the texture that makes a photograph read as real.

**What fails:** anything legible that asserts a state or a value. Large display numerals
(72%, 24.2 MW, 98.7%, 8,742). Status words like "Complete" or "Ready" sized to be read —
these are fabricated values by definition, since they assert a state that comes from no
data. Button labels sized for reading.

**In-scene marks are not composited logos.** A PHANTOM wordmark embroidered on a glove
cuff, printed on a chassis, or otherwise physically present in the photographed scene is
set dressing and is allowed. The absolute prohibition covers marks laid *over* the frame
in post: title cards, captions, watermarks, corner logos.

Applies to: DEPLOY, HANDOFF, and any future render. Test by downscaling the master to
390px wide and confirming nothing resolves into a readable number.

Separately and unchanged: **no text composited over the image** — no title cards,
captions, watermarks, or logos. That is a different prohibition and is absolute.

---

## 6. Where the current set stands

| Row | Status |
|---|---|
| DEPLOY | **Accepted.** 2134×737, 2.896 native, hot-core 62.9%, bg racks dimmed. Open: B5 below. |
| SCAN | **Accepted** in prior session. Do not re-render. Locate the file. |
| HANDOFF | **Accepted** in prior session. Do not re-render. Locate the file. |
| MASTER FILE | **Accepted** in prior session. Do not re-render. Locate the file. |
| OPS | **BLOCKED — B4.** Came in at 2.995 aspect vs spec 2.90. Needs a re-cut. |

OPS is the only render still owed. Everything else is either accepted or a file-location
problem, not an art problem.

**B5 / GB300 — owner call, unresolved.** The accepted DEPLOY art shows NVIDIA GB300 NVL72
branding on the sled. ALP-01 runs H100/H200 — no Blackwell on the floor. This is not a
defect in the render; it is a choice about whether BUILD's hero art depicts the floor as
it is or as aspiration. John decides. If it must match the floor, DEPLOY needs a re-render
and B1 reopens.

---

## 7. Post-render

- Crop 2.90:1 from the master, sliding for 72% subject placement
- Export **2100×724** (desk @2x) and **1170×403** (phone @3x)
- WebP `-q 82 -alpha_q 95 -m 6`
- Scrim stays CSS: `rgba(2,4,7,0.72)` → transparent at 55%. Do not bake it in.

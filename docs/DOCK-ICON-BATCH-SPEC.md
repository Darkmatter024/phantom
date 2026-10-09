# DOCK ICON BATCH — THE SHARED SUBJECT BOX

**Written:** 2026-09-10 · **Baseline:** `.586` served · **For:** the uniform batch re-render (P-3), and the ghost cut that joins it
**Rulings this implements:** `OWNER-RULINGS.md` 2026-09-10 — **G-1 keep the circuit detail in the eyes** · **P-3 order: subject box and ink budget first, brightness after**
**Status:** the numbers the owner asked for. Nothing built, no source touched.

---

## 0 · A correction I owe, before the spec

My Phase 0 said the wrench "is not smaller, it is sparse" and gave rendered sizes of `54 × 47.7` and similar. **Those numbers were wrong and the conclusion was half wrong.**

`object-fit: contain` fits the **256 × 256 canvas** into the 54 px box — not the subject. So the scale is a flat `54 / 256 = 0.2109` for every icon, and the subject renders at its own proportion of that:

| Icon | Subject in master | **Rendered in the dock** | Longest side rendered |
|---|---|---|---|
| COMMAND | 226 × 131 | **47.7 × 27.6 px** | 47.7 |
| BUILD | 226 × 142 | **47.7 × 30.0 px** | 47.7 |
| TOOLS | 190 × 168 | **40.1 × 35.4 px** | **40.1** |
| EXIT | 157 × 180 | **33.1 × 38.0 px** | **38.0** |

**So "the wrench renders smaller" was right and I was wrong to push back on it.** TOOLS renders 40.1 px against COMMAND and BUILD's 47.7 — **16 % smaller**; EXIT is **20 % smaller** at 38.0. What does not hold is *"dimmer"*: TOOLS has the **highest** mean luma of the four (95.2 against EXIT's 54.6). It reads faint because it is simultaneously **smaller and sparse** (8.8 % ink), not because its pixels are dark. **The fix order the owner accepted is unchanged and is reinforced by this: box, then ink, then brightness.** Brightening TOOLS would have been the wrong move for a reason that survives the correction.

---

## 1 · THE SHARED SUBJECT BOX — the answer

> **Canvas 256 × 256. Subject longest side = 226 px, centred, minimum 15 px margin on all four sides.**

Every icon in the batch — the four existing plus the ghost — is scaled so that **whichever of its width or height is larger measures exactly 226 px**, then centred on the canvas. The shorter dimension falls where the artwork's aspect ratio puts it; it is **not** stretched.

**Why 226 and not something rounder:**

- **Two of the four already are 226** (COMMAND and BUILD, both with 15/15 side padding). Standardising on it means the row's current visual anchor does not move.
- **It is the largest value in the set**, so nothing has to shrink. TOOLS and EXIT scale **up**, which is the direction they need. A re-render at source loses nothing doing this.
- **G-1 argues for the largest defensible box.** Keeping circuit detail in the irises means the ghost needs every pixel it can get; 226 is the most that leaves a real margin.
- **It renders at 47.7 px — 88 % of the 54 px box** — generous without letting a glow or rim-light touch the cell edge.

**What this delivers:** every icon in the row renders with the **same 47.7 px longest side**. EXIT stops floating: its side padding goes from 50/49 px to 15/15, and it renders 47.7 px wide instead of 33.1.

⚠ **One caveat, stated so it is a decision and not a surprise.** Equal longest sides is a *geometric* match, not an *optical* one. A wide flat gauge and a tall narrow door with the same longest side still carry different visual mass. The batch should be eyeballed as a row after the geometry lands, and any icon that still reads heavy or light gets a small manual nudge **inside** the 226 box. The box is the floor for consistency, not a guarantee of it.

---

## 2 · THE INK BUDGET — second, per the accepted order

Ink coverage is the share of the canvas carrying visible pixels (alpha > 8). It is what makes a glyph read as present rather than faint. Scaling to the shared box changes it by the square of the scale factor, so here is where each icon lands **after** §1 and before any stroke work:

| Icon | Ink now | Scale to 226 | **Ink after the box fix** |
|---|---|---|---|
| BUILD | 43.5 % | ×1.00 | **43.5 %** |
| EXIT | 22.2 % | ×1.58 | **35.0 %** |
| COMMAND | 29.6 % | ×1.00 | **29.6 %** |
| TOOLS | 8.8 % | ×1.41 | **12.4 %** |

**Target band: 25–45 %.** Three of the four land inside it once the box is fixed, without touching the artwork.

**TOOLS is the only real outlier and the box fix does not rescue it** — 12.4 % against a 25 % floor. It needs roughly **double its current stroke weight**, not more brightness. It is a thin outline glyph competing with filled ones.

---

## 3 · G-1 — what "keep the circuit detail" costs, and the number that makes it survivable

The owner ruled the irises **keep** their circuit traces. That is a design call and it stands. What it needs to be meaningful is a **minimum stroke width in the master**, because the dock scale is brutal:

- Everything in the master is multiplied by **0.2109** on its way to the dock.
- A trace that is **8 px** in the 256 master renders at **1.7 px** — the thinnest that still reads as a line on a retina phone rather than dissolving into grey.
- A trace at **4 px** in the master renders at **0.84 px** — below one device-independent pixel. It will alias to a smudge.

> **Any trace intended to be legible must be ≥ 8 px in the 256 master. Below that it is texture, not circuitry.**

If the art direction wants traces finer than that, they still ship — but they read as *shading inside the iris*, not as visible circuitry, and the acceptance test in §4 should judge them on that basis rather than on whether individual traces resolve. **This is not a re-litigation of G-1; it is the number that decides whether G-1 got what it asked for.**

---

## 4 · Acceptance — corrected to the real render size

⛔ **Run the row test at 54 px, not 44 px.** The ghost-icon handoff §3 specifies 44; that is the **tap-target floor** (`01-nav.spec.js:104`), not the icon box. `#rd-botnav .bicon` is **54 × 54**. Testing at 44 under-tests legibility by 19 %.

The test: all five icons in one row at 54 px, on the phone, at arm's length.

1. Does every icon read as its own subject? The ghost must read as a ghost.
2. Do they look like one set, or four plus a sticker?
3. Does any icon look conspicuously larger or smaller than its neighbours? *(After §1 the longest sides are equal, so anything left is optical and gets the §1 nudge.)*
4. **G-1 check:** do the irises read as circuitry, as texture, or as two lit ovals? Any of the three can be accepted — but it should be **named**, because it is what G-1 was ruling on.

---

## 5 · The one-line answer for the re-render

> **256 × 256 canvas · subject longest side 226 px, centred, ≥ 15 px margin all round · true alpha at source · ink coverage 25–45 % · any legible iris trace ≥ 8 px in the master · one file, no dim variant — the app dims it.**

Encode per the existing icon spec: `cwebp -q 82 -alpha_q 95 -m 6`. Name it `icons/phantom-nav-ghost-v1-256.webp`; the `-vN` suffix is mandatory and must increment on any re-cut, because overwriting a precached asset in place serves the old bytes from cache.

## 6 · Bounds

§1 and §2 are computed from decoded image bytes and the CSS rule; §3's render figures follow from the same `0.2109` scale. **None of it has been confirmed on a device**, and the row test in §4 is the thing that does that. No source was touched and no icon was modified.

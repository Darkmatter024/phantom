# INTEL-DOCK GHOST ICON — PHASE 0 EVIDENCE (read-only, nothing authorised to build)

**Written:** 2026-09-10 · **Baseline:** `main` = `release` = `e6f5445`, serving `phantom-v1.14.586`, verify debt zero
**Spec:** `docs/SHIP-HANDOFF-INTEL-DOCK-GHOST-ICON.md` §4 (imported verbatim, sha256 `dbdaa067b9e0fb39`) · **Mode:** READ-ONLY. No source edited, no version bump, nothing staged in the app.

---

## ⛔ 0 · BEFORE THE EVIDENCE — THIS SPEC ASKS A QUESTION THE OWNER ALREADY RULED, TODAY

The handoff is written around a **fifth** dock slot. §4.3 asks what changes "when it becomes five"; §4.4 asks the owner to rule "the ghost-versus-SHIFT fifth-slot collision"; G-3 parks *"Fifth slot: ghost or SHIFT?"* as open.

**That was ruled on 2026-09-10** (`OWNER-RULINGS.md`, INTEL-DOCK item 1), hours before this handoff arrived:

> **DOCK COUNT — OPTION A. Four slots: `COMMAND · BUILD · TOOLS · GHOST`; EXIT (hold) leaves the dock for the last row of SYS.** … ⛔ **Option B (five slots, SHIFT restored) is REJECTED** … If M4 later wants a SHIFT slot it collides with the ghost, and **that is ruled then, not now.**

**The ghost does not add a slot. It takes the one EXIT vacates.** The dock is four slots before and four after.

Reported, **not silently resolved**, per the standing rule that a proposal reopening a superseded ruling is a hard stop. Everything else in the handoff is consistent with the ruling and is actioned below; §4.3 is answered **both ways** so the record is useful whichever way the owner goes. **If the handoff's fifth-slot framing was deliberate, it reverses today's ruling and needs to say so explicitly.**

Two smaller mismatches, same class:

- **§3 says the dock renders at 44 px. It renders at 54 px.** `#rd-botnav .bicon{width:54px;height:54px;object-fit:contain}`. 44 px is the *tap-target floor* (`01-nav.spec.js:104`), not the icon box. The acceptance test in §3 should be run at **54 px**, or it under-tests legibility by 19 %.
- **§2 P-3 says the wrench "renders smaller and dimmer".** ⭐ **Half right, and the half I first disputed was the correct half.** *Smaller* is true and measured: TOOLS renders 40.1 px against COMMAND and BUILD's 47.7, and EXIT 38.0 — see the corrected table in §2. *Dimmer* is not: TOOLS carries the **highest** mean luma of the four (95.2 against EXIT's 54.6). It is **smaller and sparse together** — 8.8 % ink against BUILD's 43.5 %. **Brightening it would still be the wrong fix**, which is why the accepted order is box, then ink, then brightness.

---

## 1 · The dock icon render path — §4.1

| What | Where at `.586` | Detail |
|---|---|---|
| The row | `dct-ios.html:16590` `<div class="botnav" id="rd-botnav">` | `grid-template-columns:repeat(4,1fr)`, `overflow:hidden`, `align-items:stretch` (`:9979`) |
| The rail | `:16591` `<div id="bn-rail">` | `#bn-rail{display:contents}` (`:10018`) — its three tabs are **direct grid cells**, so the rail is not itself a column |
| COMMAND icon | `:16593` | `<img class="bicon" src="icons/phantom-nav-command-v3-256.webp" width="256" height="256" loading="eager">` |
| BUILD icon | `:16597` | `icons/phantom-nav-build-v3-256.webp`, same attributes |
| TOOLS icon | `:16606` | `icons/phantom-nav-tools-v4-256.webp`, same attributes |
| EXIT icon | `:16612` | `icons/phantom-nav-exit-v3-256.webp`, same attributes — inside `#rd-exit`, a **sibling of the rail**, deliberately not a `.botitem` (`01-nav.spec.js:101` pins that) |
| Icon box | `:9985` | `#rd-botnav .bicon{order:1;width:54px;height:54px;object-fit:contain;display:block;opacity:.82;transition:opacity .2s,filter .2s}` |
| **Active state** | `:10004` | `#rd-botnav .botitem.active .bicon,#rd-botnav #rd-exit .bicon{opacity:1}` |
| Arming state | `:10009` | `#rd-exit.arming .bicon{filter:drop-shadow(0 0 8px var(--gold))}` |
| Label | `:10003` | `font-size:clamp(8px,2.3vw,var(--fs-micro))`, `white-space:nowrap`, `max-width:100%` |

⭐ **§3's "One file only" is already how this dock works, so the ruling costs nothing to honour.** Active state is **pure CSS opacity** — `.82` inactive, `1` active. **No JavaScript swaps any `src`**: the only other `bicon` hits in the file are a CSS comment (`:9998`) and the arming drop-shadow (`:10009`). A ghost that dims by having its opacity driven from `body[data-net]` needs **no new mechanism**, and the DoD grep gate (*"exactly one ghost asset path referenced in source"*) is satisfied by construction.

---

## 2 · The four shipped icons, measured — §4.2, and this is what P-3 actually is

Decoded pixel-by-pixel through a real WebP decoder (headless Chromium canvas; there is no `cwebp` or `sharp` on this box). Alpha threshold 8/255 for the bounding box, 200/255 for the luma sample.

| Icon | Bytes | Canvas | Subject box | fill W | fill H | Ink | True alpha | pad T/B | pad L/R | Mean luma |
|---|---|---|---|---|---|---|---|---|---|---|
| COMMAND | 20,042 | 256×256 | 226×131 | 88.3 % | 51.2 % | 29.6 % | yes | 63 / 62 | 15 / 15 | 88.4 |
| BUILD | 21,552 | 256×256 | 226×142 | 88.3 % | 55.5 % | 43.5 % | yes | 57 / 57 | 15 / 15 | 63.3 |
| TOOLS | 10,388 | 256×256 | 190×168 | 74.2 % | 65.6 % | **8.8 %** | yes | 44 / 44 | 33 / 33 | **95.2** |
| EXIT | 9,326 | 256×256 | 157×180 | 61.3 % | 70.3 % | 22.2 % | yes | 38 / 38 | **50 / 49** | **54.6** |

⛔ **CORRECTED 2026-09-10 — THE RENDERED SIZES FIRST PUBLISHED HERE WERE WRONG, AND SO WAS THE CONCLUSION I DREW FROM THEM.** `object-fit:contain` fits the **256 × 256 canvas** into the 54 px box, not the subject, so the scale is a flat `54 / 256 = 0.2109` for every icon and the subject renders at its own proportion of that. Full correction and the batch numbers: `docs/DOCK-ICON-BATCH-SPEC.md` §0.

| Icon | Subject | **Rendered (corrected)** | Longest side |
|---|---|---|---|
| COMMAND | 226 × 131 | **47.7 × 27.6 px** | 47.7 |
| BUILD | 226 × 142 | **47.7 × 30.0 px** | 47.7 |
| TOOLS | 190 × 168 | **40.1 × 35.4 px** | **40.1** |
| EXIT | 157 × 180 | **33.1 × 38.0 px** | **38.0** |

⭐ **THE HANDOFF WAS RIGHT THAT THE WRENCH RENDERS SMALLER, AND THIS DOCUMENT WAS WRONG TO PUSH BACK ON IT.** TOOLS renders 40.1 px against COMMAND and BUILD's 47.7 — **16 % smaller** — and EXIT is **20 % smaller** at 38.0. What does *not* hold is **"dimmer"**: TOOLS still carries the highest mean luma of the four (95.2 against EXIT's 54.6). It reads faint because it is **smaller and sparse at the same time**, not because its pixels are dark. **The accepted fix order — subject box, then ink, then brightness — is unchanged, and this correction reinforces it.**

- **The row has no shared subject box.** Widths run 157–226 px and heights 131–180 px on an identical canvas. Nothing in the set agrees on how much of the frame the subject fills.
- **EXIT is the one that floats**, and the number says why: 50/49 px of left/right padding against COMMAND and BUILD's 15/15, so it renders **33.1 px wide where they render 47.7**.
- **TOOLS is smaller *and* sparse** — 8.8 % ink coverage against BUILD's 43.5 %, a third of the row median, on top of the 16 % size deficit. ⛔ **Raising its brightness would blow out the brightest thing in the row and still leave it reading small.** The fix is subject scale and stroke weight.

**What the batch re-render must therefore standardise (this is the actionable form of P-3):** one **subject bounding box** shared by all five — pick a target longest side, e.g. 226 px to match the two that already agree — and one **ink budget**, so a sparse outline glyph is not competing with a filled one. Mean luma should be equalised *after* those two, not instead of them.

---

## 3 · What a slot change costs — §4.3, answered both ways

**Under the 2026-09-10 ruling (four slots, ghost replaces EXIT): the cost is zero.** The grid stays `repeat(4,1fr)`, cell width is unchanged at `(390 − 12) / 4 ≈ 94 px` on the narrowest supported viewport, labels are unchanged, and the ghost inherits a glove-safe cell by construction (`.botitem` `min-height:54px`, `01-nav.spec.js:104` pins ≥ 44 px). **No layout work is in this ship.**

**If a fifth slot were ever added anyway**, measured rather than guessed:

| Property | 4 slots | 5 slots |
|---|---|---|
| Cell width at 390 px | ~94 px | **~75.6 px** |
| Icon box | 54 px, unchanged (fixed, not fluid) | 54 px, unchanged |
| Tap target | ≥ 44 px floor holds | still holds (54 px min-height) |
| Label size | `clamp(8px, 2.3vw, --fs-micro)` → **8.97 px** at 390 | **identical** — the clamp is viewport-based, not cell-based, so it does **not** shrink to fit a narrower cell |

⚠ **The label is the real fifth-slot risk, and it fails silently.** `.blabel` is `white-space:nowrap; max-width:100%` with **no `text-overflow:ellipsis`**, inside `#rd-botnav{overflow:hidden}`. A label too wide for its cell is **clipped without an ellipsis** — no visual signal that a word was cut. Because the font size is pinned to the viewport rather than the cell, narrowing cells from 94 px to 76 px does not shrink the text to compensate. **"COMMAND" is the longest of the four labels and would be the first to clip.** This is the same failure family as `.530`, when width pressure forced COMMAND to be relabelled DECK.

⭐ **Nav clearance is safe either way, and it self-heals.** `--rd-navclear` has a static CSS fallback of `calc(96px + var(--safe-bottom))` (`:1109`), but `rd_syncNavClear()` (`:19175`) measures the real box with `getBoundingClientRect().height` and writes the token, and a **`ResizeObserver` on `#rd-botnav`** (`:19196`) re-fires on every height change — icon box, label size or safe-area inset, "without knowing about any of them". It guards the zero case explicitly (a `0` height leaves the CSS default standing rather than collapsing every page's padding), and `orientationchange` re-syncs after 200 ms. **So a taller or shorter dock cannot repeat the `.341` stale-token defect.** Nothing in this area needs touching.

---

## 4 · The collision, stated against source — §4.4

**What the fourth cell actually holds today at `.586`:** `#rd-exit` (`:16610`), the hold-to-freeze control — `aria-label="Hold to exit and freeze the app"`, a sibling of `#bn-rail`, not a `.botitem`.

**SHIFT is not in the dock and never has been in this shell.** Occurrences of "shift" inside the `#rd-botnav` markup block: **0**. `.botitem` count: **3**.

So the collision the handoff asks the owner to rule **is not a live one in source**. SHIFT's slot is a *contract* claim (A8 / R-02: `COMMAND · BUILD · SCAN · TOOLS · SHIFT`) that is **delivered at M4 and gated behind M3** — three of SHIFT's nine questions still have no data source, and `PHANTOM_CURRENT_STATE.md` D-1 says do not restore the slot early. The 2026-09-10 ruling already reconciled this: the ghost takes EXIT's vacated cell now, and a SHIFT slot at M4 is ruled then.

---

## 5 · Q — for the owner

1. **The fifth-slot framing.** Today's ruling says four. Does the handoff's "fifth slot" reverse it, or was it drafted before the ruling landed? **Nothing is built until this is settled**, because it decides whether the ship is an icon swap into a vacated cell or a grid change.
2. **G-1, irises.** §2 P-1 and the measurements agree: at a 54 px box the wrench survives on one shape while the ghost's circuit-trace irises resolve to two lit ovals. Recommendation stands — **simplify**.
3. **G-2, order.** The measurements support shipping the ghost **with** the batch, not before it: matching today's row means matching a set whose subject boxes disagree by 69 px of width.
4. **The 44 px vs 54 px acceptance test** — §3's row test should be run at the real box size.
5. **G-4** is already satisfied by the existing design: the dock carries no sentences, and the offline copy lives in the sheet.

## 6 · Bounds

Source and image bytes only. **Nothing was rendered on a device, and no dock was built.** The measurements in §2 come from a headless Chromium canvas decode, not from the phone; the §3 label-clipping risk is derived from the CSS rule and has **not** been reproduced at 5 slots because no five-slot dock exists to measure.

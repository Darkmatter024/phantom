# SHIP SPEC — DEPLOYMENT PAGE: CLEARANCE + FLAT REMOVAL
**Base:** v1.14.345 · **Law:** `PHANTOM-CORE-DOCTRINE.md` §1e (two shells), §1h (one shared rule) · **Gate:** both agents + owner device verify.

**Two ships, sequenced. Do not combine** — Ship A is a house-wide token fix, Ship B is a page recomposition. Combined, a bad result cannot be bisected.

**TWO SHELLS THROUGHOUT.** One DOM recomposed by CSS at the ≥1024px breakpoint. Phone and desktop are different compositions of the same markup, so **every fix below must resolve correctly in both**, and every verify runs twice. A fix proven on one shell is not proven.

---

# SHIP A — ONE DERIVED CLEARANCE (do this first)

## A1. THE BUG

Bottom content clips on the deployment page — "PHASE RUNNING LONG / POWER — 1213 min elapsed" is cut mid-card by the phase strip.

Token values at v345:

| Token | Line | Value |
|---|---|---|
| `--safe-bottom` | 125 | `max(env(safe-area-inset-bottom), 12px)` |
| `--tabnav-h` | 132 | `72px + safe` |
| `--action-stripe-reserve` | 155 | `40 + 54 + 12` = **106px** |
| `--rd-navclear` | 1087 | **96px** + safe |

**Phone (observed):** the page stacks nav (72px) **and** phase strip (~54px) ≈ **126px + safe**. The scroll container reserves `--rd-navclear` = **96px + safe** → **short ~30px**, one line of text, exactly what is missing.

> **The desktop arithmetic is NOT assumed to match.** The desktop nav is full-width edge-to-edge and the phase strip may size or stack differently in that composition. Desktop may be short by a different amount, or not short at all. Step 0 measures it rather than inheriting the phone's numbers.

**Seven bottom-padding formulas across four tokens:**
```
L1088   calc(var(--rd-navclear) + 20px)
L1332   var(--safe-bottom)
L1971   calc(var(--tabnav-h) + 14px)
L2463   calc(var(--safe-bottom) + 20px + var(--action-stripe-reserve))
L2739   calc(var(--safe-bottom) + 20px + var(--action-stripe-reserve))
L9157   calc(var(--safe-bottom) + 24px)
L11488  calc(var(--rd-navclear) + 12px) !important
```
Containers using `--action-stripe-reserve` account for the strip; those using `--rd-navclear` do not. **This is the per-element pattern that made clipping take four passes.** Patching one container sends it back on another page or the other shell.

**Compounding risk:** four desktop breakpoints exist — 980 (L8771), 1024 (L9324, L9910), 980–1023 (L10024). If any clearance formula sits inside one, it applies at some desktop widths and not others.

## A2. STEP 0 — REPORT, THEN STOP

1. For each of the seven sites: selector, which surface it governs, **which shell(s) it applies in**, and whether that surface renders the phase strip, the nav, both, or neither.
2. **Measured device pixels for nav height and strip height at 390px AND at 1000px, 1280px, 1440px.** Confirm or correct the 72/54 phone figures; report the desktop figures independently.
3. Is the phase strip **conditional** — only on deployment pages, only in certain phases, only in one shell? A fixed reserve is wrong wherever the strip is absent; it would over-pad every other page.
4. Is the strip `position:fixed`, `sticky`, or in flow — **in each shell**? Determines whether it must be reserved at all, and the answer may differ by composition.
5. Do any of the seven formulas sit **inside a desktop media query**? Name which, and at which breakpoint.
6. **Verdict:** does the derived clearance need **one value** that resolves correctly in both shells, or a **per-shell pair**? Recommend, with the measurements behind it.
7. Which sites `?legacy=1` also uses — **out of fence.**

Then **STOP.** A6 needs an owner ruling if the answer to (6) is a pair.

## A3. SCOPE

**One derived clearance.** A single token resolving to the *actual* bottom chrome present: safe area + nav + strip-if-present. Every scroll container references it. Delete the other formulas. Drop the `!important` at L11488 — the conflict it fought is resolved.

**It must derive, not enumerate.** If the strip is conditional, the token is conditional (a class on the page root, or a measured custom property set at render). If the shells genuinely need different values, that is **one rule with a shell-scoped value** — not two independent formulas that will drift. **Do not hardcode 126px**; that is the same mistake at a larger number.

**Grep gate (add to `phantom-ship-gate`):** after the patch, `--rd-navclear|--action-stripe-reserve|--tabnav-h` appear in **exactly one** `padding-bottom` formula file-wide. More fails the ship.

### IS NOT
- No layout, spacing, or card changes. Clearance only.
- No phase strip restyling.
- No breakpoint consolidation — log the four-breakpoint problem as a separate CLEAN item. Changing breakpoints while changing clearance makes a bad result impossible to bisect.
- Legacy byte-identical.

## A4. VERIFY (owner — hard gate, BOTH SHELLS)

**Phone, 390px:**
- [ ] Deployment page: scroll to absolute bottom — **PHASE RUNNING LONG fully visible**, nothing under the strip
- [ ] Same on a deployment in a different phase
- [ ] BUILD, Command, Tools, Reference: bottom content clears nav, **no new dead space** on pages without a strip

**Desktop, at 1000px, 1280px, 1440px** (the breakpoints disagree; one width proves nothing):
- [ ] Deployment page bottom card fully visible at **each** width
- [ ] Other pages: content clears the full-width nav, no dead space
- [ ] No width where the fix applies on one side of a breakpoint and not the other

**Both:**
- [ ] Grep gate green · `?legacy=1` pixel-identical · gates green · stamps in lockstep

---

# SHIP B — REMOVE FLAT, RECOMPOSE THE PAGE

## B1. OWNER RULING (confirmed)

The FLAT rack elevation and the `FLAT / 3D / AISLE` pill are **removed from the deployment page, in both shells.** AISLE already covers the need: tapping a rack there opens a detail page carrying the full rack contents per-U. FLAT is redundant.

## B2. WHAT THE PILL ACTUALLY IS (L35146–35150)

```
.reh-3d-toggle
  #reh3dBtnFlat   -> reh3d_setMode('flat')   [view state]
  #reh3dBtn3d     -> reh3d_setMode('3d')     [view state]
  #reh3dBtnAisle  -> forge3d_open()          [NAVIGATION — different surface]
```

**AISLE is not a mode, it is a door.** The control mixes two view states and one navigation action in one segmented pill. Removing FLAT exposes this: a mode toggle with one remaining mode is not a toggle.

Source comment at L35141 records that placement was already forced by CSS: `.rack-hybrid` is `display:flex; align-items:stretch`, so a toggle emitted as its child becomes a third flex column and breaks the 85/15 canvas/minimap split. **That constraint is desktop-relevant** — confirm what the same geometry does in the phone composition.

## B3. STEP 0 — REPORT, THEN STOP

1. What else calls `reh3d_setMode('flat')` or reads a `'flat'` mode — deep links, restore state, `localStorage`, keyboard shortcuts, the minimap? **Removing a mode something restores into = a blank canvas.**
2. `#rehFlatWrap` is a sibling of `#reh3dMount`, and `.reh-3d-mount` is `display:none` until `.rack-hybrid-canvas` gets `.is-3d`. **If FLAT is removed, is the 3D mount still revealed, or does it depend on a transition out of flat that no longer happens?** Answer per shell.
3. **Where does `.reh-3d-toggle` sit in each composition** — phone one-column, and the desktop three-region layout? Report the real estate it occupies in both, since the B4.2 ruling must hold in both.
4. Is `.reh-3d-toggle` / `#rehFlatWrap` used on any surface **other** than the deployment page, in either shell?
5. Does the U-map minimap rail belong to the flat wrap or to `.rack-hybrid`? It goes or stays with whichever survives — confirm per shell.
6. Legacy dependency on any of it — **out of fence.**

Then **STOP.**

## B4. SCOPE

### B4.1 — Remove the flat view and the pill
Delete `.reh-3d-toggle` and the flat rendering path from the deployment page. Remove `reh3d_setMode('flat')` and any state that persists or restores it. **Both shells.**

### B4.2 — AISLE keeps a door ⟵ **owner ruling required, must hold in both shells**
`forge3d_open()` must remain reachable. Options — **do not choose unilaterally:**
- **(a)** A single labelled action ("OPEN AISLE") where the pill was
- **(b)** Folded into an existing row so no new chrome is introduced
- **(c)** No door here; AISLE reached only from its own destination

Whether 3D also survives on this page is part of the same ruling. If both 3D and AISLE stay, they are **two doors, not a segmented control** — the mode-toggle metaphor retires with FLAT.

**The chosen answer must work in both compositions.** The pill's slot on a phone and its slot in the desktop layout are not the same real estate; a door that fits one may crowd or strand the other. Step 0 §3 supplies the facts for this call.

### B4.3 — Recompose so the work is the hero
With the elevation block gone, the page opens on **NEXT ACTION** in both shells. Correct hierarchy, and it matches ratified doctrine: active work leads, visualization is a destination not a header.

### B4.4 — Kill the duplicated fact ⟵ recommended, owner confirms
The 1213-minute overrun renders **twice on one screen**: the amber chip inside NEXT ACTION ("1213 min on POWER (typical: 60 min). Unlogged blocker?") and again as PHASE RUNNING LONG ("POWER — 1213 min elapsed (typical: 60 min)"). Same fact, two cards, two wordings.

Keep **one**. Recovers more vertical space than the pill did, and two renderings of one fact is the §1c drift risk that broke the rack hero.

### IS NOT
- No changes to the AISLE / FORGE surface itself, or the rack detail page it opens.
- No changes to INSPECT-3D internals.
- No clearance changes — Ship A owns those.
- No card, border, or colour changes.
- Legacy byte-identical.

## B5. VERIFY (owner — hard gate, BOTH SHELLS)

**Phone 390px and desktop 1000/1280/1440px, each:**
- [ ] Deployment page opens on NEXT ACTION — no pill, no flat elevation
- [ ] AISLE reachable per the B4.2 ruling, and the door sits sensibly in **that** composition
- [ ] Tapping a rack in AISLE still opens full rack detail
- [ ] Nothing blank-canvases — no path restores into a mode that no longer exists
- [ ] Overrun fact appears **once**
- [ ] Everything fits; bottom card fully visible (Ship A already green)
- [ ] No layout strand: nothing orphaned where the pill used to sit

**Both:**
- [ ] `?legacy=1` pixel-identical · gates green · stamps in lockstep

---

## SEQUENCE

**Ship A → verify both shells → Ship B → verify both shells.**

A is house-wide; B lands on top of it. Reversed, the recomposition hides the clipping without fixing it — less content overflows less, but the shortfall survives on every page that scrolls far enough, and on the shell nobody checked.

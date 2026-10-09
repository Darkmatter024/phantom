# SHIP-HANDOFF — INTEL-DOCK SHIP 1 · the dock's fourth slot changes identity

**Written:** 2026-09-10 · **Baseline:** `main` = `release` = `e6f5445`, serving `phantom-v1.14.586`, verify debt zero
**Rulings:** `OWNER-RULINGS.md` 2026-09-10 INTEL-DOCK (all four questions ruled) · **Evidence:** `docs/INTEL-DOCK-PHASE0-EVIDENCE.md` and its 2026-09-09 addendum (anchors re-swept to `.586`)
**Status:** ⛔ **BLOCKED ON ONE DELIVERABLE — the ghost dock art. Everything else is specified and ready.** Nothing in `dct-ios.html` has been touched.

---

## 0 · The blocker, stated first because it is the whole critical path

Ruling 3 was **"commission a matching cut"**. That art does not exist yet. Checked at `.586`: `icons/` holds only `phantom-ref-ghostecho-256.webp` and `-768.webp` (GHOST ECHO *reference* art, a different thing), and the root ghosts — `phantom-ghost-v2.webp`, `phantom-ghost-v3.webp`, `cc-ghost.webp`, `ghost.webp` — are boot-sequence and card art at the wrong size, never cut as a lit/dim pair.

**Ship 1 cannot be split around it.** EXIT leaving the dock and the ghost arriving are the *same* visible change: `#rd-botnav` is a fixed `grid-template-columns:repeat(4,1fr)`, so removing EXIT without putting the ghost in its place leaves a visibly empty fourth cell. Shipping the EXIT move alone would mean two nav changes and two device verifies — the exact cost that got Option B rejected.

**So the order is: art lands → build → staging look → stamp.** Section 1 is the art request, cut so it can go straight to web-Claude.

---

## 1 · THE ART REQUEST — measured from the four icons already in the dock

Every number below was read off the shipped files at `.586`, not recalled.

| Property | Requirement | How it was established |
|---|---|---|
| Format | **WebP, VP8X container, alpha channel present** | All four current icons are VP8X with the alpha flag set and a real `ALPH` chunk (2,736–12,006 bytes of it) |
| Dimensions | **256 × 256** | All four, exactly |
| File size | **~9–22 KB** | command 20,042 B · build 21,552 B · tools 10,388 B · exit 9,326 B |
| Naming | **`icons/phantom-nav-ghost-v1-256.webp`** | Matches `phantom-nav-{name}-v{n}-256.webp`. ⛔ The `-vN` suffix is **mandatory and must increment on any re-cut** — overwriting a precached asset in place serves the old bytes from cache (`sw.js` note at the tools icon, `.527`) |
| Render box | Legible at **54 × 54 CSS px**, `object-fit:contain` | `#rd-botnav .bicon{width:54px;height:54px;object-fit:contain}` |
| Two states | **Lit and dim must differ at arm's length** | The dock dims by opacity alone today (`.bicon{opacity:.82}`, active `opacity:1`). ⚠ **That is not enough for the ghost**, because dim here means *"the assistant cannot answer"* — a real capability difference, not just "not the current tab". If opacity alone does not read as OFF on a phone at arm's length, supply a **second glyph** rather than a fainter one |
| Palette | Its own channel colour, distinct from `#61efff` (Command), `#3d84ff` (Build), `#cfe3ee` (Tools) | Each slot carries `style="--tc:…"`; EXIT's `#ff4d4d` is freed by this ship |
| Subject | The PHANTOM ghost, consistent with the `.586` chrome-ghost app icon | So the dock and the home-screen icon read as one identity |

⛔ **Do not precache it until a consumer exists** (the `.364` lesson). It enters `PRECACHE_URLS` in the same commit that renders it, never before.

---

## 2 · What Ship 1 changes — one visible change

**The dock reads `COMMAND · BUILD · TOOLS · [ghost]`, and SYS ends in `EXIT (hold)`.**

Anchors are from the `.586` re-sweep. **Re-verify every one before editing** — they are hints, and verbatim strings are the truth.

| Anchor at `.586` | Edit |
|---|---|
| `:16610` `#rd-exit` block | **Removed from the dock markup**, not hidden. Grep gate: zero Exit-hold markup inside `#rd-botnav` |
| `:16605` after `#bn-ref` | Add the fourth `.botitem`, `id="bn-ghost"`, inside `#bn-rail` |
| `:13608` / `:13609` | Insert the EXIT row **between** them — after the SITE PROFILE row closes, before `#hdr-agg-panel` closes |
| `:19146` `rd_initExit` | Re-point the existing `rd_holdGesture(el,'arming',rd_freeze)` wiring at the new SYS row |
| `:13951` `#cc-asst` | **Retired** (ruling 2). The dock becomes the single opener; the static `AI ASSISTANT · ONLINE` eyebrow at `:13955` dies with it |
| `sw.js` `PRECACHE_URLS` | Add the ghost icon, in the same commit that references it |

**Ghost behaviour.** Tap → `openVaSheet('intent')` — the A-2 sheet already exists (`#vaSheet` `:16670`, `va_intentHtml` `:51183`: SPEAK / PASTE TICKET / TYPE OR PASTE / IMPORT FILE). Nothing there is rebuilt; the dock re-homes an opener onto a sheet that already works. Lit/dim binds to `body[data-net]` plus the `api` health colour — both already exist (`phantomUpdateNetPill` `:55855`, `phantomCheckApi` `:55846`), **no new detection code**. Offline tap → a one-line sheet, *"Assistant needs signal. Offline right now."*, and back. ⛔ No spinner.

### ⛔ Must not be touched

`rd_freeze` / `rd_wake` / `rd_freezeBootRestore` (`:19128`–`:19203`) stay byte-identical — only the trigger moves · the NBA line under the hero · `#vaSheet` / `va_intentHtml` · SYS items 1–10 (*"nothing else moves into SYS in this ship"*; MASTER is B-1, a separate ship) · `#cs-nav-ext` (`:16561`, desktop EXIT) — **default is leave it**, per the `.576` pattern, and it is explicitly still unruled.

---

## 3 · Tests before edit — `test/e2e/55-intel-dock.spec.js`, RED first

Written and run RED **before** any `dct-ios.html` edit, per Phase 0 §5.

1. The dock holds **four** grid cells: three `.botitem` plus `#bn-ghost` — and **`#rd-exit` is absent from `#rd-botnav`**.
2. Every dock control still clears the **44 px** gloved-hand floor (`01-nav.spec.js:104` is the existing pin).
3. `#bn-ghost` opens `#vaSheet`, and the sheet shows all four intent doors.
4. **Offline**: with the platform offline, the ghost reads dim and a tap yields the one-line needs-signal sheet, never a spinner. *(This is the cheap direction — see the note below.)*
5. **Online**: with the probe answered, the ghost reads lit and opens the sheet.
6. SYS's **last** row is EXIT (hold); a `.85 s` hold raises `#rd-freeze-curtain`; a short tap does not.
7. `#cc-asst` is gone, and the assistant sheet has **exactly one** opener.

⚠ **`01-nav.spec.js:79` pins "three slots plus EXIT" and must be REWRITTEN, not deleted** — its own header calls it *"a CHECKPOINT, NOT A SPECIFICATION"*. `06-composition.spec.js` (25 dock-geometry hits) and `94-probe-badge.spec.js` (`#bn-work-n`) also assert on the dock.

⭐ **The harness can now test the lit state, and could not before this week.** `fixtures.js` answers the AI-proxy probe locally as of `72e0630`, so the API dot settles on REACH instead of being permanently red from the Worker's origin allowlist. Without that, test 5 was unwritable: the SYS aggregate went `offline` in every run. Test 4 needs no stub — offline is the harness's natural condition.

---

## 4 · Device verify — the owner's, on PHANTOM STAGING

Dock shows **no EXIT** · ghost lit and opens the sheet from Command, from a rack, and from the picker · **airplane mode** → ghost visibly dim, tap gives the one-line sheet with no spinner · back online → it lights **without a relaunch** · SYS's bottom row is EXIT (hold) → app freezes → relaunch lands on the same view.
**The freeze/restore path on an installed PWA is a hardware-only class.** Playwright proves everything else first.

---

## 5 · Door ledger — net 0

| Door | Before | After |
|---|---|---|
| Dock controls | 4 (COMMAND · BUILD · TOOLS · EXIT-hold) | 4 (COMMAND · BUILD · TOOLS · GHOST) |
| EXIT | 1 (dock) | 1 (SYS, last row) |
| Assistant openers on phone | 2 (`#cc-asst`, Master-required · omni keyword) | 1 (dock ghost, no Master needed) + the omni keyword |
| SYS items | 11 | 12 |

**Net 0**, and it reaches 0 *only because* ruling 2 retires `#cc-asst`. Reach goes up — the assistant becomes one tap from anywhere and no longer requires a loaded Master — while the door count stays flat.

---

## 6 · Preconditions

✅ `.586` adjudicated and promoted (`e6f5445`), verify debt zero · ✅ all four rulings recorded · ✅ anchors re-swept to `.586` · ✅ harness can drive the lit state · ⛔ **ghost art — the one open item** · ⏳ spec 55 written and RED.

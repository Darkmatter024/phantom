# PHANTOM — Composition, Accessibility & Performance Audit
**Basis:** `dct-ios.html` @ v1.14.394 (`71d4279`), audited against `.github/skills/ui-guidelines/DESIGN_RULES.md`. Specialist audit, key claims re-verified by the Principal Integration Owner.

---

## C1 — The entire desktop composition ships dead ⚠️ P0

`~700 lines` of desktop CSS are gated on `body.rd.cshell`. `.cshell` is added **only** when the URL carries `?cshell=1` or `?shell=1`:

```
18772  function cshell_isOn() {
18778    return s.indexOf('cshell=1') !== -1 || s.indexOf('shell=1') !== -1;
18807  if (cshell_isOn()) { document.body.classList.add('cshell'); }
```

Deliberately not persisted — the comment @18768 explains why ("a sticky preview is exactly the trap .380 had to ship a way out of"). That reasoning is sound *for a preview flag*. The consequence is that the sidebar, topbar, dashboard grid and desktop Build workspace (`:53620`, `:53695`, `:53719`, `:53996`, `:54020`) **are never seen on a bare URL**, and `#cs-side, #cs-top { display:none }` unconditionally @53338.

**OWNER RULING R-01 (2026-08-05): promote `.cshell` to the default above 851px.** See `00-owner-rulings.md` for the binding constraints that follow — the `?cshell=0` rip-cord, the 1500px clip that must be fixed in the same ship, the 136px dead runway, and the sidebar/topbar literals that need tokens.

## C2 — Work does not compose above 480px ⚠️ P0

`#bw-shell` has a `max-width` **only** under `.cshell` @53628. Outside it, its only rules are @53349 and @53544 — no cap. At 1440px it is ~1314px wide, and `.bw-mx` is `repeat(4,1fr)` → four ~325px cells each holding an **8px** label @53428 over a 17px number.

| | 390px | 768px | 1024px | 1440px |
|---|---|---|---|---|
| Command | flex column, rail dissolved @9456 | **identical to 390** | real 2-region grid 340+760 @9471 | centred 1128px island |
| Work | phone column | same | same | **same, 1314px wide** |
| Ref | 2 col @8772 | 3 col, cap 760 @8794 | 4 col, cap 1080 @8799 | 4 col, cap 1080 |

**Ref genuinely composes. Command genuinely composes at ≥1024. Work never composes.** And the `min-width:768` block @10046 is **legacy-only** — iPad portrait gets the phone Command verbatim.

## C3 — Two boot animation loops run for the entire session ⚠️ P0 — CONFIRMED

```
12916  (function vf(){ … requestAnimationFrame(vf); })();   // 34 void motes
12940  (function ef(){ … requestAnimationFrame(ef); })();   // 2 code-streaming eyes
```

Neither has an exit condition, a stored handle, or a visibility guard. `launch()` @18316 sets `boot.style.display = 'none'` — **`boot.remove()` appears 0 times in the file** (verified). The closures hold live canvas references, so both loops run forever.

`ef` is the expensive one: per frame, 2× `save/arc/clip`, a `createRadialGradient`, 3 `fillRect`, and ~20 `fillText` with a rebuilt font string — all onto an off-screen canvas nobody sees. `#boot.collapsing *{animation-play-state:paused}` @383 pauses **CSS** animations only and has no effect on rAF.

**Relevance to the renderer work:** these are 2D contexts, so they do **not** consume WebGL context slots and they are **not** the root cause of the refusal — F3 is. But they are a continuous GPU/CPU tax for a full shift on the primary device, and iOS WebKit sheds WebGL contexts under memory pressure, so they are a plausible aggravator. Fixing them is a pure win: store the handles, cancel in `launch()`, no visual change, no risk.

## C4 — Rule 1 (zero horizontal overflow) holds ✅

The global lock is real: `html{max-width:100vw;overflow-x:hidden}` @291, `body` @303, `#app` + 13 named sheets @328.

Systematic scans came back clean: **0** hits for `width:NNNpx ≥ 361`, **0** for `min-width ≥ 361`, **0** for `width:100vw`, **0** `position:fixed` with left+right+width all set. 24 `overflow-x:auto` containers exist; `<pre>` count is 0.

Two real risks remain:
- **`.dt` tables @1203, 80 call sites** — `width:100%` with no `table-layout:fixed`, no `word-break`, no scroll wrapper. Content is short prose today, but a long part number or MPO trunk ID would push wide and be **clipped by the ancestor `overflow-x:hidden` — silently lost, not scrolled.**
- **`#cs-grid` @54017 breaks at exactly 1500–1501px** — three columns need 1200px, available is `1500 − 246 sidebar − 56 padding = 1198`. Two pixels short, and `#cmd-shell{overflow-x:hidden}` @53191 clips rather than scrolls. `?cshell=1` only.

## C5 — Fixed-strip clearance: one strip is correct, one is a latent repeat ⚠️

| Strip | Height source | Clearance | Same token? |
|---|---|---|---|
| `#ph-dock` @9247 | `min-height: var(--rd-dockclear)` | `calc(var(--rd-navclear) + var(--rd-dockclear) + 20px)` @1100 | ✅ **YES — the model to copy** |
| `#rd-botnav` @9564 | **no height declared at all**; intrinsic ≈ 90px + safe-bottom | `--rd-navclear: calc(96px + var(--safe-bottom))` @1087 | ❌ **NO** |

`--rd-navclear` is a hard-coded constant that merely *describes* the nav. Nothing forces `#rd-botnav` to be 96px. **This is the exact `.341` failure the comment @1097 documents** ("`--tabnav-h` went stale at 72 while the nav grew to 96") — the lesson was applied to `--rd-dockclear` and **not** to `--rd-navclear`. Current slack is ~6px; `.bicon` is already a `.339` bump from 46 to 54.

**Fix: `#rd-botnav{min-height:var(--rd-navclear);box-sizing:border-box}`.** One line, closes the class permanently.

Also: under `.cshell` the nav is `display:none` @53807 but `.page` keeps `padding-bottom:calc(var(--rd-navclear)+20px)` @1088 — 136px of dead scroll runway on every desktop page.

## C6 — Accessibility

**Failing contrast, both on primary surfaces:**
- **`#4a565f` on `#030304`** — `#rd-botnav .blabel`, the inactive nav labels, at **9px** @9573. **2.74:1.** Undersized *and* under-contrast, on the app's primary navigation, for a gloved tech in aisle lighting. Worst pair in the file.
- **`--slate-dim #486070` on `--bg0`** — **3.06:1**. The token's own comment @342 says *"borders/decoration only, **NEVER text**"* — and it is used as `color:` at @9505, @9540 (15px), @9549 (13px). Three self-violations, all on Command.

Passing: `--slate` on `--bg0` = 8.62:1 ✅ · `.dt td` = 10.48:1 ✅ · forge chip = 8.23:1 ✅.

**Type floor.** The file sets its own hard floor at 10px @158 and ships a guard @10800 — but **the guard only matches inline `style` attributes**, so all **86** sub-10px sizes declared in CSS rules bypass it: one at 7.5px @53675, 14 at 8px, 12 at 8.5px, ~59 at 9–9.5px.

**Tap targets.** `--tap-s:44px` is defined @147 and honoured on the important controls (`.botitem` 54px, `.cc-rackline` 52px, `.bw-cta` 56px, back/close 44px, optic ± 48px). Failures: **`.reh-3d-seg` ≈22px @10657** — the rack view pills, overridden to 46px only inside `.bw-prev` @53583, so the rack-detail copies stay 22px. Then a cluster at 28px including two **destructive** actions — optic DELETE @47186 and audit DELETE ENTRY @49005.

**Clean:** all 17 hover rules are inside `@media (hover:hover)`; `title=` count is 0 (no hover-only tooltips); focus ring is a correct two-layer global @266/@3936 with `:focus:not(:focus-visible){outline:none}` @3945 — **no unreplaced `outline:none` found** across 49 occurrences.

**Unnamed icon buttons:** the material one is the optic `+`/`−` pair @37572–37583 — announced as "plus"/"minus" with no object. The `←`/`✕` set is 44px and keyboard-reachable.

## C7 — Performance

- **13 `setInterval`, 4 `clearInterval`.** `cmd_clock` @18810 (15s), `omni_updatePlaceholder` @18120 (15s), `tab_pillRefresh` @50484 (20s), `phantomHealthRefresh` @50299 and `phantomStorageCheck` @50368 (5min) all tick **while the screen is off**. The SW poll @12536 and `sw_pillRefresh` @12655 are visibility-gated — exemplary, and the pattern the others should copy.
- **0 `removeEventListener` against 145 `addEventListener`.** Most are one-shot bootstrap and harmless. The material leak: `window.addEventListener('mousemove'/'mouseup')` @36085–36086 and @36113–36114 are registered inside `rackElevation_render3D` — **re-registered on every render**, each holding a Three.js closure over `camP`/`renderer`/`zoom`. Given F3 (a render per checklist tap), this compounds directly. *Note: the teardown @36160 does remove these; the leak is bounded to renders that never reach teardown.*
- **Layout thrash** in `rackFlat_applyFit` @36325–36350: reads rect → **writes `canvas.style.height`** @36343 → **reads rect again** @36346. One forced reflow per call. Debounced 150ms @36355, so bounded — but the order is wrong and free to fix by hoisting the header read above the write.
- **81 `backdrop-filter` declarations.** `#rd-botnav` was correctly de-blurred at `.338`; `#ph-dock` @9253, `#cs-top` @53766, `.rd-topbar`, `.dl-topbar`, `.msc-actions` still blur and can co-occur during a sheet transition over a scrolling list.
- **51 `infinite` animations** across 65 `@keyframes`. Reduced-motion coverage is genuinely strong (33 blocks, including the documented sweep @11111). Against DESIGN_RULES §1 and §5 this is over budget — but it is a taste finding, and the accessibility floor is honoured.
- Only **8 `will-change`**, one explicitly demoted after the boot dive @18319. ✅

## C8 — Responsive-asset machinery: VERIFIED ABSENT ✅

`<picture>` **0** · `srcset` **0** · `image-set` **0** · width-based `matchMedia` **0** (all 5 uses are `prefers-reduced-motion` or `display-mode:standalone`). The standing memory note is accurate.

Latent risk: there is **no global `img{max-width:100%}`** — the rule @307 is on `body`. Every image is individually contained today; a future untagged `<img>` would overflow and break Rule 1.

---

## Priority ledger

| P | Item | Notes |
|---|---|---|
| **P0** | C3 — cancel the two boot rAF loops in `launch()` | Pure win, zero visual change, zero risk |
| **P0** | C1 — decide what desktop ships | **The one item I am bringing to the owner** — it changes the product |
| **P1** | C5 — `#rd-botnav{min-height:var(--rd-navclear)}` | One line, closes the `.341` class |
| **P1** | C6 — nav label 2.74:1 @9px → `--slate` @10px | Primary navigation |
| **P1** | C6 — remove `--slate-dim` from the 3 `color:` sites | Token's own comment forbids it |
| **P1** | C7 — visibility-gate the 5 always-on intervals | Battery, full-shift device |
| **P2** | C4 — `.dt` `table-layout:fixed` + `word-break` | Silent clipping, not scrolling |
| **P2** | C6 — 28px destructive DELETE buttons → 44px | Gloved hands |
| **P2** | C7 — hoist the read above the write in `rackFlat_applyFit` | Free |
| **RULING** | `.reh-3d-seg` 22→44px @10657 | Standing owner item per CLAUDE.md |

**UNVERIFIED:** whether `font-size: revert !important` @10811 in the BLE-printer exception actually yields 8px (`revert` on an author-origin declaration may roll past the inline style attribute). Needs a render check.

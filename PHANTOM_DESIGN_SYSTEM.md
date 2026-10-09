# PHANTOM — Design System (LOCKED)

> **Status:** **APPROVED by the owner 2026-08-07** — all six rulings in §0 carried. The tokens
> landed in `dct-ios.html` at `v1.14.410`; screens consume them in the Step-2 order (§11).
> **Authority:** once approved, these are *the* values. Screens consume them; screens do not
> redefine them. A screen that needs a value not in this file needs a ruling, not a local token.
>
> **Companion docs.** `.github/skills/ui-guidelines/DESIGN_RULES.md` holds the *principles*
> (anti-slop, cold-aisle filter, copy voice). This file holds the *values*. Read that one for
> "why", this one for "what".
>
> **Every number below was measured in `dct-ios.html` at `v1.14.409`**, not invented. Where the
> current app disagrees with the lock, the disagreement is stated rather than hidden.

---

## 0 — What the audit found, and the five rulings it needs

The app already has a strong material identity (machined ring, recessed well, one-knob glow) and a
genuinely characterful tracking scale. What it does **not** have is a *scale discipline*. Measured
across all 12 `<style>` blocks:

| Dimension | Tokenised | Literal | Distinct literal values |
|---|---:|---:|---|
| `padding` / `margin` / `gap` | 45 | **1116** | — |
| `border-radius` | 50 | **397** | **25** |
| `font-size` | 347 | 630 | **36** |
| `z-index` | 9 | **135** | — |

191 distinct tokens exist. **28 are declared and never used.** **13 more resolve by cascade** —
the same token name carrying different values in different places.

**R-A · Spacing.** There is no global spacing scale. The only spacing tokens are surface-local
(`--bw-*` for Build, `--forge-*` for the Forge dock) and they disagree: 9, 15, 17, 18px.
→ *Proposed:* the 4px scale in §2. **Ruling needed.**

**R-B · Radius.** 25 distinct radii are in live use, including 11px, 13px, 17px, 22px, 26px, 99px
and 100px. Nobody chose 25 radii; they accumulated.
→ *Proposed:* the 5-step scale in §4. **Ruling needed.**

**R-C · Type.** Six `--fs-*` tokens exist, but usage is `caption 348 · micro 310 · body 116 · head
**2** · subhead **0** · hero **1**`. In practice **PHANTOM is typographically flat between 10px and
12px**, with 36 literal sizes filling the gap ad hoc (7.5px through 42px). This is the single
largest perceived-quality gap in the app: hierarchy is currently carried almost entirely by colour
and glow, with type doing almost none of the work.
→ *Proposed:* §3, and the first visible win of this sprint. **Ruling needed.**

**R-D · `--cyan` is two different colours.** `#5cf2ff` globally, but `#28e0ff` inside the Forge HUD
scope and the entry screen. `--gold` likewise (`#ffd60a` vs `#ffcb45`), and `--ink`
(`#c9d6e2` vs `#cdd6e4`).
→ *Proposed:* keep the brighter pair as a **named, deliberate** 3D-surface variant
(`--cyan-scene`) rather than an unexplained shadow of `--cyan`. **Ruling needed.**

**R-F · PHANTOM's display face is currently a raw system stack — and two approved things
contradict each other here.**

`--orb` and `--raj` are consumed **376 times** between them, and both resolve to
`-apple-system, 'Helvetica Neue', Arial, sans-serif`. There is no Orbitron and no Rajdhani in this
build. So PHANTOM's display typography is **Helvetica**.

- `DESIGN_RULES.md` §1 bans *"raw system-font stacks as the display face"* as the #1 generic-AI tell.
- The `plate()` note at `:19778` says the opposite, deliberately: *"That fallback IS the approved
  look… there is no font race to lose."*

Both are approved. They cannot both stand in a sprint whose goal is "not a website, not generic."

→ *Proposed, and this is my recommendation, not a neutral option:* **promote the already-embedded
`PhantomBrand` (Audiowide) to the display tier** (`--fs-hero`, `--fs-head`). It costs **zero new
bytes** — the woff2 is already inlined at `:37` — carries **zero offline risk**, and it is already
PHANTOM's brand face on the wordmark and all collateral. One face, two sizes, top of the ladder
only; body and data stay as they are.

⚠ The risk is width: Audiowide is a wide face, and at 16–18px uppercase with 4.5px tracking it may
not fit 390px. **That is a visual ruling, not an argument** — see the render. **Ruling needed.**

**R-E · Do NOT mass-refactor the 1116 literals.**
This is my recommendation, not a neutral option. Rewriting 1116 padding declarations touches every
surface in a 55k-line single file with no staging environment, and produces **zero visible
improvement** — it is precisely the gold-plating the sprint says to avoid. The scale is instead
**enforced going forward and applied per screen as that screen is finished**, which is the same
cadence Step 2 already defines. Blast radius stays at one screen at a time.

---

## 1 — Foundations that are already correct (locked as-is, no change)

These were designed deliberately, are used consistently, and are PHANTOM's identity. **Do not
redesign them.**

### Material — the machined ring
Every raised surface is: *recessed well* (two padding-box layers) + *machined ring*
(one border-box gradient on a transparent border) + *inset shadow*. Two families:

| Family | Ring | Consumers |
|---|---|---|
| **PILL SKIN v2** (`v1.14.186`) | 2.5px | chips, tabs, tags, switchers |
| **GLASS SKIN v1** (`v1.14.189`) | 2px | cards, metrics, rows, banners |

⛔ **The machined ring does not paint on a raw `<button>` on iOS**, even with
`appearance:none`. Button consumers use the padding-box primitive (1px coloured ring, no
border-box layer) instead. This is a platform fact, not a style preference.

### Glow — one knob, app-wide
`--glow-outer: 22px · --glow-a: 0% · --glow-inner: 0% · --glow-border: 52% · --glow-hue: var(--cyan)`

**Tune these four numbers only, never per-selector.** `--glow-hue` is the one intended override:
violet on the Command next-best-action, gold on `.gx-gold`. That is the mechanism working.

### Tracking — PHANTOM's actual signature
| Token | Value | Use |
|---|---:|---|
| `--hud-track-display` | 4.5px | hero / wordmark |
| `--hud-track-wide` | 2.8px | section headers |
| `--hud-track-button` | 2.4px | button labels |
| `--hud-track-ui` | 2.2px | nav, tabs |
| `--hud-track-mid` | 1.6px | captions, pills |
| `--hud-track-tight` | 0.4px | dense labels |
| `--hud-track-data` | 0.3px | numerals, IDs |

Wide tracking on short uppercase strings is what makes PHANTOM read as instrumentation rather than
as a website. **This is the identity. Keep it.**

### Tap targets — cold aisle, gloved
| Token | Value | Use |
|---|---:|---|
| `--tap-s` | **44px** | absolute floor — nothing interactive goes below this |
| `--tap-m` | 48px | standard control |
| `--tap-l` | 52px | primary action |
| `--tap-xl` | 56px | hero CTA |

⚠ **Open defects against this floor** (carried, not introduced by the sprint):
`.rd-sheet-close` 40×40 and `.detail-close` 32×32 are both **under 44**.

---

## 2 — Spacing scale *(R-A — proposed)*

One 4px-based scale. Every gap, pad and margin resolves to a step.

| Token | Value | Use |
|---|---:|---|
| `--sp-1` | 4px | icon↔label, inside a chip |
| `--sp-2` | 8px | between siblings in a row |
| `--sp-3` | 12px | inside a card |
| `--sp-4` | 16px | between cards |
| `--sp-5` | 20px | screen gutter *(phone)* |
| `--sp-6` | 24px | between sections |
| `--sp-8` | 32px | between major regions |

**Phone screen gutter is `--sp-5` (20px)** — this is the one value the eye reads as "the app has a
margin". The Forge dock currently uses 18px (`--forge-pad-x`) and Build uses 15/17px (`--bw-*`);
both fold into `--sp-5` as their screens are finished.

**Derived, never restated:** a value used by two elements in one slot becomes a named term
(`--forge-gap`), because two elements restating one number is how a magic constant is born.

---

## 3 — Type scale *(R-C — proposed)*

Keep the six existing tokens. **Start actually using the top three.** Every step pairs a size with
a weight and a tracking token — size alone is not hierarchy.

| Token | Size | Weight | Tracking | Case | Role |
|---|---:|---:|---|---|---|
| `--fs-display` | **32px** | 800 | tight | sentence/UPPER | **one display moment per screen** — desktop hero headline, the rack ID on Build. Never a label, never a metric. |
| `--fs-hero` | 18px | 700 | `display` 4.5px | UPPER | screen title, wordmark |
| `--fs-head` | 16px | 700 | `wide` 2.8px | UPPER | section header |
| `--fs-subhead` | 14px | 600 | `ui` 2.2px | UPPER | card title, tab |
| `--fs-body` | 12px | 500 | `tight` 0.4px | sentence | prose, descriptions |
| `--fs-caption` | 11px | 600 | `mid` 1.6px | UPPER | labels, pills, status |
| `--fs-micro` | 10px | 600 | `mid` 1.6px | UPPER | dense data, counts |

**Numerals** (rack IDs, U positions, counts) always run `--hud-track-data` (0.3px) — data is read,
not scanned.

**RULING A + the seventh step, owner-approved 2026-08-07 (`v1.14.412`).** The ladder is **fixed at
every tier**: a bigger screen buys *composition*, not bigger type — §9 already says the surplus
becomes margin, and growing the type is itself a form of stretching. The `@media (min-width:1024px)`
fluid block is therefore **retired**; it had produced two separate ladder failures (`--fs-micro`
resolving to **9px**, below the app's own floor, at 1024–1200; and `--fs-body` reaching 14px and
colliding with `--fs-subhead` from 1366 up). Capping one bound could not fix it — each cap moved the
collision to the neighbouring pair.

Because the six steps are a *phone* ladder that tops at 18px, a genuine display moment had nowhere
to go, so `--fs-display` **32px** was added as the seventh and last step. It does **not** grow by
tier either: before this, `.cs-hero-title` carried three sizes (30/35/38) and `.bw-rack` three more
(34/38/40) — six declarations now consuming one token. **Resolved ladder is
`10 / 11 / 12 / 14 / 16 / 18 / 32` at 390, 834, 1366, 1440 and 1920.**

⚠ **CORRECTION to the audit as first written.** I reported the second `:root` re-declaring
`--fs-micro/caption/body` as `clamp()` values as a cascade conflict. **It is not.** That block sits
inside `@media (min-width: 1024px)` (`:10223`), so it is a deliberate *tier override*: the phone
gets the fixed steps, laptop and up get the fluid ones. The mechanism is correct and nothing needs
removing.

The real defect it hides is narrower: **at ≥1024px `--fs-body` clamps up to 14px, which collides
exactly with `--fs-subhead` (14px, unchanged at every tier)**, so two adjacent steps of the ladder
become the same size on laptop and desktop. Fix belongs to Step 3 (responsive translation), not to
the phone pass.

---

## 4 — Radius scale *(R-B — proposed)*

25 → 5. Radius encodes *what kind of thing this is*, so it must be legible at a glance.

| Token | Value | Means |
|---|---:|---|
| `--r-data` | 2px | data cells, elevation faces, hairline surfaces |
| `--r-ctl` | 6px | buttons, inputs, small controls |
| `--r-card` | 12px | cards, panels, tiles |
| `--r-sheet` | 20px | bottom sheets, modals, the Build workspace |
| `--r-pill` | 999px | chips, tabs, status pills |

Retire: 3, 5, 7, 9, 10, 11, 13, 14, 15, 16, 17, 18, 22, 24, 26, 99, 100px. `4px` and `8px` fold to
`--r-data` and `--r-ctl` respectively as each screen is finished.

---

## 5 — Colour semantics (locked — channels are meaning, never decoration)

| Channel | Hex | Uses | Means — and **only** this |
|---|---|---:|---|
| **cyan** | `#5cf2ff` | 732 | PHANTOM itself: identity, focus, selection, active |
| **gold** | `#ffd60a` | 242 | **attention** — flagged, pending, needs a human |
| **green** | `#30d158` | 200 | **done** — racked, verified, complete, online |
| **red** | `#ff453a` | 172 | **fault** — error, blocked, NO-GO, offline |
| **violet** | `#9b59ff` | 127 | **intelligence** — suggestion, next-best-action, derived |

⛔ **One channel, one meaning, app-wide.** The recurring failure is gold-vs-red: a zero state, an
empty result and an absent-data panel are **not faults**. `0/0 RACKED` on a cable-endpoint-only
cabinet is honest data — styling it red nearly rolled production back on 2026-08-06.

**Neutrals:** `--bg0 #04070b` (page) · `--bg1 #0e1822` (raised) · `--bg2 #141f2e` (control) ·
`--bg3 #1a2a3a` (hover) · `--white #f5f5f7` (primary text) · `--ink #c9d6e2` (secondary) ·
`--dim #5b6678` (tertiary) · `--slate-dim #486070` (disabled).

**Emphasis ladder** — exactly three levels per surface, never four:
*primary* = cyan fill or ring + glow · *secondary* = machined ring, no glow · *tertiary* = `--dim`
text, no ring, no glow.

**Dead ramps to delete:** the entire unused violet set (`--violet-glow`, `--violet-border-hi`,
`--violet-dim`, `--violet-subtle`, `--violet-surface-hi`) and four unused `--glow-*` colours
(green/red/gold/violet) — 0 uses each. They tempt future work into inventing a fourth emphasis level.

---

## 6 — State treatments (one shape per state, app-wide)

The state a surface is in must be readable in a **half-second glance, from arm's length, on glass,
in a cold aisle.** These are the only five.

| State | Treatment | Copy rule |
|---|---|---|
| **Empty** | `--dim` text, machined ring, **no glow, no colour** | An invitation to act. Never an error. Never a mood piece. Say it **once** per surface. |
| **Loading** | skeleton at `--bg2`, one shimmer, no spinner | Never blocks the OODA loop. |
| **Error** | red ring + red label + **what went wrong** | Explains the failure. Never vague. Never silent. |
| **Offline** | cyan ring, `OFFLINE` caption, **content stays live** | Offline is PHANTOM's normal, not a fault. |
| **Success** | green, one 250ms pulse, then settle | Never permanent decoration. |

⛔ **A zero state is not an error — and that rule governs the COLOUR, not just the label.**
(`deploy_forge_zeroState` once painted a red bar because `phantomToast` was called with no type and
defaults to `colors.error`.)

⛔ **Never label absent telemetry.** A panel is named for what PHANTOM actually receives. A readiness
score is a count of real gates, never a fabricated percentage.

---

## 7 — Motion

- **One orchestrated moment, not scattered effects.** PHANTOM's is the **boot dive**. Everything
  else is functional feedback.
- **Durations:** 150ms state change · 250ms enter/exit · 800ms ambient fade. ⚠ Two elements in one
  slot must share one duration or a probe will read one mid-flight — the `.408` false-failure.
- **Tap feedback is instant.** Never animate the acknowledgement of a tap.
- `prefers-reduced-motion` is honoured everywhere and is a **project in the Playwright suite**.
- ⛔ **A transform at rest makes an element a containing block for any `position:fixed`
  descendant** — the `.212` trap. Prefer `margin-inline:auto` over `translateX(-50%)` for centring.

---

## 8 — Layering

A `--z-*` scale exists — and **four of its six steps have 0 uses** while 135 literal z-indexes are
spread through the file. That mismatch is what made the `.408` toast bug hard to see.

| Token | Value | Layer |
|---|---:|---|
| `--z-content` | 1 | page content |
| `--z-nav` | 20 | bottom nav |
| `--z-float` | 50 | FAB, toasts |
| `--z-sheet` | 200 | sheets, modals |
| `--z-overlay` | 600 | full-screen overlay |
| `--z-boot` | 999 | boot plate |
| `--z-scanner` | 10000 | camera scanner |

⛔ **`position:fixed` establishes a stacking context unconditionally — z-index is irrelevant.**
A child of a fixed element can never escape it. Fix layering with *position*, not with a bigger
number.

---

## 9 — Composition per tier

Same system, different composition. **Desktop is not stretched mobile, and it is not a new product.**

### Phone — 390px (the design target)
Single column · gutter `--sp-5` · one primary action visible without scrolling · bottom nav +
dock own the bottom, content clears **every** fixed strip by its own derived term ·
`env(safe-area-inset-bottom)` respected and **verified only on device** — it resolves to 0 in the
harness, so nothing in CI proves it.

### Tablet — 834px
Single column, wider gutters, **denser rows** — not larger cards. The iPad is the operator's real
device: more rows visible per screen is the win, not more whitespace.

### Laptop — 1366px
Two columns: persistent context rail (left, ~320px) + work surface. The rail shows what the phone
puts behind a tap. **Nothing new appears** — the same information stops being modal.

### Desktop — 1440px+
Two columns + a third **detail** column. Max content width so line length stays readable; the
surplus becomes margin, never stretched cards.

### Wide — 1920px+
No new columns. Centre the desktop composition and let the background carry the space.

---

## 10 — Non-negotiable floors

1. **Zero horizontal overflow.** No element pushes the viewport past `100vw`. Enforced on `html`,
   `body`, `#app` and every sheet. A layout that overflows horizontally is broken regardless of
   how it looks.
2. **44px minimum** on anything tappable. Gloved hands.
3. **A control declares its own height.** Never sized by a sibling through `align-items:stretch` —
   it collapses hardest in the empty state, which is the state every fresh device shows.
4. **Both overflow axes declared.** `overflow-x:auto` silently blockifies `overflow-y` to `auto`
   and amputates glow; reserve the glow's room *inside* as padding, derived from the same token
   that feeds the shadow.
5. **Every fixed strip needs its own clearance term**, and that constant is the strip's own
   `min-height` from the same token — or it goes stale in silence.
6. **`?legacy=1` stays byte-identical.** Gate the *presentation*; never gate the *invariant*.
7. **Visible keyboard focus** on every interactive element.
8. **No silent failures.** Never `if (!x) return;` on a user-facing path.

---

## 11 — Applying this

Per screen, in the Step-2 order (Command → Build → Forge → Tools → Shift):

1. Inspect that surface and its shared primitives **only**.
2. Replace that screen's literals with scale steps — **that screen's, not the app's**.
3. Render 390px. Owner sees the screenshot. Rule.
4. At most one correction pass.
5. Run that screen's spec.
6. Mark **visually frozen** in this file.

| Screen | Status |
|---|---|
| Command | **pass done** `v1.14.410` — offline state, header truncation, display tier, dropzone tightened + centred |
| Build | **pass done** `v1.14.410` — cyan→violet gradient retired, zero-state typography, screen title |
| Forge | **pass done** `v1.14.410` — HUD onto the scale, sheet close to 44px, **permanent control placement ruling** |
| Tools | **pass done** `v1.14.410` — search input to the floor, tile type + radius, all scoped to `#ref-grid` |
| Shift | **pass done** `v1.14.410` — close button was 260.5×30, title wrap, type + radius onto the scale |
| **Desktop shell (`cshell`)** | **pass done + GATE FLIPPED** `v1.14.412` — automatic at **≥1024**, `?cshell=0` rip-cord. 5 violet gradients → 0 · 8 sub-44 controls → 0 · 18 type sizes → 8 · 24 sub-floor declarations → 0 |
| **Shared header / nav chrome** | **pass done** `v1.14.412` — `.hdr-agg-pill` 27→44px, `.blabel` / `#ver-stamp` 9→10px, and a latent notch bug (`top:-9px`) deleted |
| Tablet 834–1023 | **no composition** — stays on the phone layout by ruling; the shell renders a broken half-state here |

### The seven-tier floor check (`v1.14.412`)

`390 · 834 · 1024 · 1194 · 1366 · 1440 · 1920` + the `?cshell=0` rip-cord — **zero tappable targets
under 44px, zero text under 10px, zero horizontal overflow, ladder strictly increasing at all.**

⚠ **The audit lesson that produced the last two rows.** Every phone pass scoped its audit to the
PAGE container (`#pg-cmd`, `#pg-work`, `#pg-ref` …), so the header and bottom nav were never
measured — *"zero sub-44 targets on all five screens"* was true of the screens and was allowed to
read as true of the app. **Audit the chrome as its own surface, or it is nobody's.**

### Carried, with the ruling that owns each

| Item | Owner ruling |
|---|---|
| Tools shows **two stacked search fields** (global + grid filter) | open — structural, not spacing |
| Tool tiles run **six border colours** vs the §5 channel law | open — is the tool palette a carve-out, or does it collapse to cyan? |
| `OPTICS` subtitle truncates to `Fiber · Form factors · …` | open |
| Forge id pill drops `· FOCUS` | ruled: the 10px floor wins over fitting more words |
| `EXIT` is red in the nav; red means fault | deferred with the SHIFT pillar — navigation is frozen |
| Four cyan→violet gradients + two sub-44px buttons in `body.rd.cshell` | Step 3 |
| `--fs-body` collides with `--fs-subhead` at ≥1024px | Step 3 |

# RACK-ELEVATION-DEMOTE — PHASE 0 EVIDENCE

**Commission:** `SHIP-HANDOFF-RACK-ELEVATION-DEMOTE.md` Phase 0 (E-1…E-5), plus E-6/E-7 added by
Addendum A.
**Baseline:** `main` @ `f28b0b3`, **`phantom-v1.14.563`** — ⛔ **not** the `.562` the handoff names.
**Method:** verified source, direct grep against the live file. No graph, no probe, no device.
**Status:** EVIDENCE ONLY — no design, no patches, nothing shipped. Ship 1 is not started.
✅ **E-6 and E-7 are answered** (appended below, same baseline). `forge.html` WAS read for E-6.

---

## ⛔ HEADLINE: MOST OF THIS SPEC IS ALREADY BUILT, AND TWO ITEMS CANNOT BE EXECUTED

Three findings outrank everything below.

**1. The U information the spec is built to preserve is already on screen.** S-1 asks that every
device row gain a U-position element. `:41800` already emits it. What actually remains of Ship 1 is
sorting, default-expanded, Cold Aisle sizing, and an explicit `U —` for unrecorded values. **Ship 1
as written would re-deliver done work** — the same shape as `.559`, and it should be narrowed and
say so rather than narrowed quietly.

**2. S-14's grep gate is unreachable.** Addendum A directs that the renderer be deleted with *"zero
references."* It has **five** call sites and only two are rack-detail; the other two are the Command
Deck hero's fallback and a **public method on `RackEngine`**, which is under R-05. See E-1.

**3. Ship 3's door already exists, and its premise names the wrong app.** S-10's `SEE IN AISLE`
is `OPEN AISLE` at `:41699`, shipped `.353`. `forge.html` reads **zero** `phantom_*` keys and is
not the "Forge" the addendum means — the aisle is an in-app sheet. **0 doors need opening; one
existing door needs an argument.** See E-6/E-7.

---

## BASELINE DRIFT — RE-ANCHOR BEFORE QUOTING

The handoff states baseline `.562` and forbids assumed anchors. `.563` shipped after it was written
and removed four net lines from `dct-ios.html`. Offsets for anything quoted against `.562`:

| region | shift |
|---|---|
| before `:9962` | 0 |
| `:9962` – `:9995` | −1 |
| `:9996` – `:16612` | 0 |
| `:16613` – `:19262` | −1 |
| after `:19265` | −4 |

**Every anchor in this document is against `.563` and was re-verified by grep, not carried over.**

---

## E-1 · THE ELEVATION CARD

⭐ **It is the FLAT 2D path. RACK SCENE LOCK does not apply to it.**

| | |
|---|---|
| Container chain | `.rack-hybrid` (flex) → `.rack-hybrid-canvas#reh3dCanvasHost` → `#rehFlatWrap.reh-flat-wrap` → `#rackCanvas` |
| Built at | `:41710-41712` (redesign branch) · `:41714` (legacy branch) |
| Renderer | **`rackElevation_buildHtml`, `:40903`** |
| Data in | `rack.slots[]`, `totalU = rack.totalU \|\| 42` |
| Filter | `:40910-40916` — drops `uStart == null`, and drops any slot spanning **≥80%** of the rack as a placeholder |

⚠ **The two call sites are `if`/`else`, not two draws.** `_rehRd` selects redesign or legacy. Only
one renders. There is no duplicate elevation from this path.

### The `.557` guard is not where the handoff expects it

It is at **`:39246`**, inside `rackElevation_ensure3D` — *"resolve the mount before touching the
class, and bail if it is gone."* ⛔ **That is the 3D path, which rack-detail no longer calls:**
`.531` removed `#reh3dMount` and the `reh3d_restore(rack)` call with it. The guard protects other
callers and is **shared**. S-6's *"remove the `.557` guard if it now guards nothing"* is therefore
based on a false premise — it still guards something, just not this surface.

### ⛔ THE RENDERER IS SHARED — FIVE CALL SITES

| line | consumer | in scope? |
|---|---|---|
| `:23705` | `cmd_rackHeroFlat` — Command Deck rack hero, no-WebGL flat fallback | **NO** |
| `:38841` | **`RackEngine.renderFlat`** — public API method, *"render a rack flat into a host, with no GL context"* | **NO** |
| `:40903` | definition | — |
| `:41711` | rack-detail, redesign branch | yes |
| `:41714` | rack-detail, legacy branch | yes |

**S-9 is live.** The base spec's own scope line says the desktop rail is untouched *unless Phase 0
shows shared rendering* — it does. **S-6's grep gate must be scoped to rack-detail's two call sites
or it will take out the Command Deck hero and a RackEngine method.** S-14 (Addendum A) needs an
owner amendment for the same reason: zero references is not reachable inside this spec's scope.

---

## E-2 · THE RIGHT-HAND STRIP — A SEPARATE COMPONENT

Not a second call of the elevation renderer.

| | |
|---|---|
| Renderer | **`scrubbar_buildHtml`, `:41073`** |
| Rendered into | `.rack-hybrid-minimap`, at `:41716` |
| Host markup | `.scrubbar-host.scrubbar-host-minimap` → `.scrubbar#scrubbar[data-total-u]` |
| Layout | `.rack-hybrid-canvas{flex:1;min-width:0}` `:11022` · `.rack-hybrid-minimap` `:11031` |
| Header text | the literal string `MINI` |

📌 **It already sorts by U descending** — `slots.sort((a,b) => (b.uStart||0) - (a.uStart||0))`.
**S-2 should reuse this comparator rather than author a second one.**

### ⚠ THE CLIPPED "U48" — A MISMATCH, NOT A ROOT CAUSE

The handoff places the clipped label **on the strip**. Source does not support that: the strip's
header renders `MINI`, and the only U-label emitter found is `.rack-canvas-u-marker` **in the
elevation**, positioned `top: uH(totalU - u)` — which for the topmost U computes to `top: 0`, flush
against the container edge where it clips.

⛔ **Reported unresolved.** Either the label belongs to the elevation and the handoff attributes it
to the wrong half, or a third emitter exists that this pass did not find. **A screenshot or a device
look settles it; source alone does not.** S-8 says the defect is "resolved by removal" — that is only
true if the label is on something being removed, which is currently unproven.

📌 Probable cause of the related *"48U showing ~7U"*: `.rack-hybrid-canvas .rack-canvas
{height:100%;max-height:60vh}` at `:11026-11029`, against `rackFlat_applyFit`'s `--u-h` fit.

---

## E-3 · THE `DEVICES` COLLAPSIBLE — ⭐ THE U POSITION IS ALREADY THERE

Markup **`:41794-41808`**. Native `<details>`/`<summary>`. **No JS handler** — the browser owns
expand/collapse.

**`:41800`:**

```js
if (slot.uStart != null) html += ' · U' + slot.uStart + (slot.uEnd && slot.uEnd !== slot.uStart ? '-' + slot.uEnd : '');
```

**Field names: `slot.uStart`, `slot.uEnd`.** Rows also carry `slot.name`, `slot.model`, and
`slot.serial` rendered as `TAG` (`:41805`, added `.6.97`).

### What Ship 1 actually still owes

| spec | status |
|---|---|
| S-1 U range per row | ✅ **already shipped** at `:41800` |
| S-1 `U —` when unrecorded | ❌ real gap — today the element is **omitted entirely**, so absent and not-recorded look identical |
| S-1 format | ⚠ emits `U42-U43` (hyphen); spec asks `U42–U43` (en dash) |
| S-1 monospace | ✅ already `font-family:var(--mono)` |
| S-2 sort U descending | ❌ real gap — `rack.slots.forEach` in stored order. Comparator exists at `:41086` |
| S-3 default expanded | ❌ real gap — one attribute |
| S-4 ≥44px row, ≥14px U text | ❌ real gap — `padding:6px 10px`, `font-size:var(--fs-caption)` |

---

## E-4 · EVERY OTHER READER

| reader | line | what it depends on |
|---|---|---|
| `rackFlat_applyFit` | `:41037` | **measures** the canvas and sets `--u-h`; up to 5 rAF retries; resize timer `:41067-41069` querying `#rehFlatWrap .rack-canvas-grid` |
| `rackHybrid_initSync` | `:38556` | touch sync between canvas and minimap |
| `railSel_bindFlat` | `:41010` | flat rail selection binding |
| direct query | `:41042` | `#rehFlatWrap .rack-canvas` |

All three functions are called at **`:41719-41721`**, inside a double-`requestAnimationFrame`.

⚠ **S-6 must neutralize all four, not just the markup.** `rackFlat_applyFit`'s resize timer
re-queries on every resize; left in place against a removed host it becomes a permanent no-op
polling a node that will never exist — inert, invisible, and exactly the class `.563` was cut to
remove.

---

## E-5 · DEFAULT STATE OF `DEVICES`

**Collapsed.** `<details>` at `:41794` carries **no `open` attribute**.

**Not persisted.** No store read or write touches this element — nothing in the `iso_`, `deploy_` or
`safeStore` paths references it. S-3's change is therefore a pure default, with no migration and no
stored state to honour.

---

## E-6 · HOW FORGE AND dct-ios.html SHARE A MASTER

⛔ **First, "Forge" names two different things, and the addendum means the second.**

| | what it is |
|---|---|
| `forge.html` | separate 1.9 MB page at repo root — the NEXUS/FORGE-01 demo (boot sequence, runbooks, CRT co-pilot, fault briefing) |
| **FORGE · 3D AISLE** | an **in-app sheet inside `dct-ios.html`** — `#forge3d-sheet` `:13667`, `#forge3d-mount`, opened by `forge3d_open()` `:19669` |

**Proven, not assumed:** S-13 quotes Forge's *"SAVED … · RESTORED FROM CACHE"* line. That string
appears **twice in `dct-ios.html`** (`:20050`, `:36873`) and **zero times in `forge.html`**.

### `forge.html` holds no Master

Its entire storage surface, across 1.9 MB:

```js
localStorage.getItem('nexus_el_key')
localStorage.setItem('nexus_el_key', k)
localStorage.removeItem('cw_api_key')      // FORGE-WORKER-CUTOVER credential cleanup
```

**Zero `phantom_*` keys.** No Master, no racks, no elevation. It is not a rack viewer.

### ⭐ E-6's STOP CONDITION CANNOT FIRE

Addendum A halts Ship 3 if the two apps hold divergent data. **There is only one app.** The aisle is
`dct-ios.html`, reading the same `PHANTOM_MASTER`. The freshness line at **`:20049`** reads
`m.restoredFromStorage`, `m.savedAt`/`m.ingestedAt` and `m.sourceFile` off that same object:

```js
el.textContent = deploy_forge_siteLabel() + ' · ' + src + ' · '
  + (restored ? 'SAVED ' + ts + ' · RESTORED FROM CACHE' : 'LOADED ' + ts);
```

**S-13 is already satisfied by construction** — a surface cannot go stale against itself.

⛔ **S-12 is moot.** *"OPEN IN PHANTOM (Forge → phone rack-detail)"* describes returning from a
separate app. You never left one. `forge3d_close()` (`:19696`) already returns to rack-detail.

---

## E-7 · FORGE'S EXISTING FOCUS MECHANISM

**No URL param.** `forge3d_open()` takes **no argument** — verified at all four call sites:
`:13583` (header menu), `:22174` (Build workspace), `:41699` (rack-detail), plus the definition.

| mechanism | anchor |
|---|---|
| `LOADOUT` — up to 5 rack IDs, `.slice(0, 5)` | `:20772`, `:20774` |
| persisted / restored | `store.set('deploy_forge_loadout_v1', LOADOUT)` `:20779` · `:20844` |
| key registry entry | `:54896` — *"Forge loadout — hand-built rack layout"* |
| the focused rack's id | `focused.userData.label` |
| stepping between racks | walks `LOADOUT` by index, `:20992-20994` |
| pickers | `#loadoutBtn` *"pick up to 5 racks"* `:13680` · `#searchBtn` |

Owner ruling quoted in-file at `:13682-13684`: *"Forge is RACK-CENTRIC by default — the camera holds one
deterministic framing per rack and navigation moves between canonical rack positions."*

### ⛔ S-10 ALREADY EXISTS

Rack-detail has had the door since `.353`, at **`:41699`**:

```html
<button type="button" class="reh-aisle-door" onclick="forge3d_open()"
        aria-label="Open the 3D aisle walk-through">OPEN AISLE ›</button>
```

Adding `SEE IN AISLE` would be a **second door to the same surface** — Contract A2, and more
pointedly the addendum's **own** new doctrine: *two paths to the same fact is a defect.*

⭐ **What is actually missing is only S-11's focus carry.** `forge3d_open()` does not seed `LOADOUT`
or focus from the rack you came from, so it lands on whatever loadout was last saved. **That is a
parameter, not a door.**

### REVISED DOOR LEDGER

| Addendum A says | measured reality |
|---|---|
| open `SEE IN AISLE` | ⛔ already open as `OPEN AISLE` `:41699` |
| open `OPEN IN PHANTOM` | ⛔ moot — same app, `forge3d_close()` returns |
| keep the freshness line | ✅ already built `:20049` |
| S-11 focus carry | ⭐ **the only real work** |

The addendum's ledger claims **2 doors opened**. The honest count is **0 opened, 1 existing door
gains an argument** — a better outcome by the addendum's own principle than the ship it describes.

---

## ⚠ WHAT S-5 WILL FIND, AND IT IS NOT A BUG

S-5 keeps both surfaces for one ship so the phone check can confirm *"the list agrees with the
drawing."* **They will not fully agree, by design:**

- `DEVICES` renders **every** slot in `rack.slots`
- the elevation **filters** — no `uStart`, or spanning ≥80% of the rack, and the slot is dropped
  (`:40910-40916`); the scrubbar applies the same filter (`:41077-41085`)

**A rack with placeholder or U-less slots will show more rows in the list than blocks in the
drawing.** That expected difference must be stated before the device check, or a correct app reads
as a defect.

---

## SHIP 1 · ANCHOR PASS — re-verified at `e948aac` / `v1.14.563`

The base spec's BOUNDS require it: *"Ship 1 needs its own anchor pass against the then-current stamp
before any edit."* `dct-ios.html` has not moved since `.563`, but these were **re-read, not carried**.
⛔ **All eight resolve.**

| S- | change | anchor | measured state |
|---|---|---|---|
| **S-3** | `<details>` gains `open` | `:41794` | one attribute; no JS handler exists to disturb |
| **S-2** | sort U-descending | insert before `:41796` (`rack.slots.forEach`) | ⭐ **comparator already exists at `:41086`** — `slots.sort((a,b) => (b.uStart\|\|0) - (a.uStart\|\|0))`. **Reuse it; do not author a second** |
| **S-4** | row ≥44px, U text ≥14px | `:41797` (row `div`) | today `padding:6px 10px`, `font-size:var(--fs-caption)` |
| **S-1** | explicit `U —`, en-dash | `:41800` | today the element is **omitted entirely** when `uStart == null` |
| **S-5** | elevation + strip untouched | — | no edit; `:41794-41808` is the whole surface |

Supporting anchors: `:41795` (list wrapper), `:41799` (model), `:41805` (TAG), `:41808` (close).

### ⭐ TWO THINGS THE PASS FOUND CHEAPER THAN THE SPEC ASSUMED

1. **The U ranges already render** at `:41800` — S-1's core is shipped (recorded in E-3).
2. **Both tokens S-4 needs already exist:** `--tap-s: 44px` (`:198`) and `--fs-caption: 11px`
   (`:205`). **S-4 is a token swap, not a new scale** — no addition to the design system, which is
   locked.

### ⚠ THE ONE REAL DECISION INSIDE S-1

Today a slot with no `uStart` renders **no U element at all**. S-1 asks for `U —`. That is the
honest-blank change and **the only part of Ship 1 that alters what a tech sees for existing data** —
absent and not-recorded currently look identical, which is the defect. Everything else in Ship 1
reorders, resizes, or expands what is already on screen.

### ⛔ GATE — WHY THIS IS AN ANCHOR PASS AND NOT A SHIP

`tools/hooks/phantom-guard.js:checkVerifiedGate` reads `oldVersion` from `HEAD:version.json`
(`.563`) and `VERIFIED` (`.562`). Any commit staging `version.json` returns:

> `GATE: phantom-v1.14.563 not stamped in VERIFIED. Owner must verify on device and update VERIFIED before the next ship.`

**The hook and the doctrine agree: one unverified ship at a time, and `.563` is it.** Ship 1 commits
only after the owner clears `.563` on the iPhone and stamps `VERIFIED` — which is owner-only, and the
same gate blocks Claude Code from committing that file at all.

---

## BOUNDS

- ⛔ **Source only.** Nothing was run, rendered, or measured on a device. The `~7U` and the clipped
  label are the owner's observations; this pass found a plausible mechanism for each and **proved
  neither**.
- ⛔ **E-2's label attribution is unresolved** and is the one open question in this report.
- ⛔ **E-6/E-7 were answered from source, not from a running aisle.** `forge3d_open()` was read,
  never invoked. That the door lands unfocused is read off the absence of a parameter and of any
  seeding call — it was **not** observed on a device.
- 📌 **`forge.html` was read only for its storage surface** (a grep of every `localStorage` call
  and every `phantom_*` occurrence). Its behaviour, rendering and AI paths were not examined and
  are out of scope for this spec.
- ⛔ **Nothing here is design.** Where a spec item is measured as already-shipped or unexecutable,
  the finding is reported for owner amendment — it is not narrowed, resequenced or rewritten.
- 📌 **The Ship 1 anchor pass above is valid at `e948aac` / `.563` and nowhere else.** If any
  ship lands on `dct-ios.html` before Ship 1 does, **re-run it** — the offset table at the top of
  this document exists because that drift has already cost a wrong citation once this session.

# M2-b STAGE 3 — THE RENDERER CONSOLIDATION · PLAN, NOT A DIFF

**Written 2026-08-10 against live `v1.14.434`. Nothing here has been built.**
This is a plan for approval. RACKENGINE-SPEC §8 is the requirement; this is how it lands without
taking the operational centre down.

> **Why a plan and not a ship.** Stage 1 (the data contract) and stage 2 (the reclaim barrier) were
> each a contained change with a test that could prove it. Stage 3 is not: it deletes a renderer,
> and everything left in M2-b depends on that deletion. The three previous attempts to move fast in
> this subsystem cost eight ships (`.389`→`.396`), a near-rollback of production, and a live defect
> that survived until `.427`.

---

## 1 · Why there is no small ship inside stage 3

Measured, not estimated:

| | Lines | Exposes on its mount |
|---|---|---|
| `rackElevation_render3D` `:37718` | **1,322** | `_rm3dDispose`, `_rm3dRackId` — and nothing else |
| `forge3d_render` `:19836` | **1,243** | its own `_forge3dActive` tracker |

**Neither renderer can update in place.** The scene is built wholesale; changing rack data means
re-running the whole function. That single fact produces a dependency chain with no branch points:

```
attach idempotency (I2)  needs  handle.update()
handle.update()          needs  a renderer that can mutate in place
modes (§4)               needs  ONE renderer that can be interactive OR flat per attachment
                         ⇒ all three are §8's consolidation
```

⛔ **So `attach` must not ship first.** Shipping it as a wrapper around `register` would name an
idempotency guarantee it cannot keep: a data-driven re-render would return the existing handle
holding a **stale scene with no way to refresh it** — worse than today's rebuild. `attach` lands
*with* `update`, or not at all.

---

## 2 · The prize, and it is not tidiness

§8: *"The `bw_render` change is the one that ends the refusal."* **Verified in the current file:**

- `bw_render` `:21173` does **`host.textContent = ''`** at `:21183` — it wipes `#bw-shell` whole.
- It then rebuilds a **brand-new `#bw-mount`** at `:21328`.
- So every re-render **destroys the element carrying all mount-local lifecycle state** —
  `_rm3dDispose`, `_rm3dRackId`, `_rm3dSizeTries`, and the node the IntersectionObserver observes —
  and then asks for a fresh WebGL context.

📌 **A consequence worth naming, because it is not in the spec.** The wipe **orphans the disposal
handle**: `_rm3dDispose` lives on the detached element, so nothing can call it. The only thing that
still reclaims that context is `RackEngine`'s attachment registry, which is keyed on the old mount —
i.e. the engine is currently the sole reason a wiped Build workspace does not leak a context.

⭐ **After consolidation `#bw-mount` is built ONCE.** Panels around it re-render freely; the rack
receives `handle.update()`. The checklist toggle, evidence save and phase complete become `update`
calls that allocate nothing. **That is the win — three of the eight `bw_render()` callers stop
touching the GL lifecycle at all.**

---

## 3 · What each renderer has that the other does not

⚠ **This inventory must be completed against the code before stage 3a starts.** It is the single
highest-risk unknown in the plan, and it is the thing a "byte-identical scene" claim rests on.
First pass, to be verified line by line:

| Capability | bay (`rackElevation_render3D`) | aisle (`forge3d_render`) |
|---|---|---|
| Camera rigs | FRONT / ISO / TOP, ortho fit | walk composition, wider rig |
| Explode | yes | — |
| Cables | yes | — |
| Scrub bar / minimap | yes (`scrubbar_buildHtml` `:39211`) | — |
| Loadout picker | — | yes (`#picker`, five-rack window) |
| Row / walk | — | yes |
| Detail panel | — | yes (`.detail-panel`, the `.416` tap window) |
| Resize handling | `ResizeObserver` + `doResize` | own path |

**Neither is a superset.** The merged renderer is `bay ∪ aisle` with mode selecting the rig and which
controls mount — which is exactly §4's "`mode` chooses camera rig, composition and which controls
render; `interactive` chooses WebGL versus flat".

---

## 4 · Staging — five ships, each independently revertable

Ordered so the **riskiest deletion is last** and every stage is provable before the next.

### 3a · The flat path (no deletion, no risk to the interactive scene)
Give an attachment a **flat renderer** — `rackElevation_buildHtml` `:39041` absorbed, already
`Vocabulary`-fed since `.429`/`.430`. Prove: an attachment can render flat, with no GL context, and
switch to flat when demoted. **Nothing is deleted. Nothing changes for an operator.**
*Unlocks:* `interactive:false` modes (`map`, `review`, `hero`) and §5's demote-is-not-disposal.

### 3b · `attach` + `update` together
Now that a flat path exists, `attach` can honestly promise idempotency, because `update` has
somewhere to land. Both renderers keep their internals; `attach` becomes the door.
**Verify:** a data change allocates nothing (I2) — assert context count is unchanged across an
`update`, which is the assertion that would have caught this class years ago.

### 3c · `bw_render` stops wiping its host
The prize from §2. `#bw-mount` is built once and survives panel re-renders; the three churn callers
become `update`. **This is the first stage an operator can feel** — and the first that needs a
device pass (items 3 and 4).
⚠ **Revert plan:** this is a `bw_render` change only; reverting restores the wipe. No engine rollback.

### 3d · Modes on one renderer
Merge `forge3d_render`'s rig and controls into the engine under `mode:'aisle'`. **`forge3d_render`
still exists and is still the live path** — the merged path runs behind a flag (`?engine=1`) so both
can be compared on the same device, same rack, same session.
⚠ **This is the stage that must not be rushed.** Ship it flagged-off, verify, then flip.

### 3e · The deletions
Only after 3d is verified on hardware with the flag on:
`forge3d_render` · `cmd_rackHero3D` · `reh3d_webglOK` `:37662` · `phantom_webglCapable` `:37643` ·
standalone `PhantomGL` · `TYPE_COLORS` · the twin trackers (`_reh3dActive` **14 refs**,
`_forge3dActive` **10 refs**).
**Definition of done includes the deletion, not just the replacement** — §8 is explicit, and a
half-deleted door is worse than either state (`.431` is the written record of that).

---

## 5 · What this plan deliberately does NOT do

- **It does not touch §8.1's aisle-door deletions** (entry by zoom-out, no standalone command).
  That is a navigation and product change on top of a renderer change, and stacking them makes a
  failure impossible to attribute. Separate ship, after 3e.
- **It does not adopt §4.1's five-rack absorption.** Same reason.
- **It does not change the scene.** "Scene byte-identical" is the acceptance bar for 3d, not an
  aspiration — if the merged aisle looks different, the merge is wrong, not the ruling.

---

## 6 · The honest risks

1. **The inventory in §3 is incomplete until verified.** Every "neither is a superset" claim is a
   place a capability can be silently dropped. **3d does not start until §3 is line-by-line.**
2. **The harness cannot prove the scene.** It proves hosts, contexts, attachments and geometry — it
   has never been able to prove a rack *looks right*. 3c and 3d each need a device pass.
3. **This box cannot produce a trustworthy full-suite run in one pass** (18 failures across a 1.0h
   run, all passing on isolated re-runs — WebGL context exhaustion). Re-run Forge specs alone before
   reading a red run as a regression.
4. **`?legacy=1` does not cover a renderer swap.** `rackElevation_render3D` draws in BOTH houses.
   The flag in 3d is the rollback, and it must exist before the merge lands — not after.

---

## 7 · Recommendation

**Approve 3a and 3b as a pair** — they are additive, deletion-free, and they unlock everything else.
Stop there and re-read this plan before 3c, because 3c is the first stage an operator can feel and
3d is the one that can take the aisle down.

If the appetite is smaller: **3a alone is still worth shipping.** A flat render path is the missing
capability behind demote-is-not-disposal, `hero`, `map` and `review` — four spec'd behaviours that
are currently unrepresentable, and none of it deletes a line.

---

# ADDENDUM — 2026-08-11 · THE RACK DETAIL IS A SECOND BUILD WORKSPACE

Found while walking the technician flow at `v1.14.437`. **Not renderer work** — recorded here
because it is the same class of problem one layer up: two surfaces for one job.

## Measured

| | Build workspace (`#bw-shell`) | Rack detail (`ops-detail`) |
|---|---|---|
| Current rack | ✓ | ✓ (`l1:001`) |
| Next action | ✓ | ✓ (`Complete NETWORK — work is in progress`) |
| Open aisle | ✓ | ✓ (`OPEN AISLE ›`) |
| Rack elevation | ✓ | ✓ |
| Phase state | `Complete NETWORK` | the `MECH·PWR·NET·COMP·VAL` dock + `2/5 PHASES` |
| **Only here** | Scan · Log blocker · Port map · BOM · Manifest · Rack map · FRONT/ISO/TOP/REAR/EXPLODE | **ASSIGN · QR · LOG NOTE** |

**Same rack, same job, two workspaces.** Contract A7 says Build is the operational centre; the
canonical technician flow says BUILD carries current rack, current phase, completed work, blockers,
next action, contextual tools, contextual scan and OPEN AISLE. The rack detail is a parallel
implementation of most of that, plus three capabilities that exist nowhere else.

## The decision

⭐ **BUILD wins. The rack detail stops being a second workspace.** Its three unique capabilities —
**ASSIGN, QR, LOG NOTE** — move into Build, and the `MECH/PWR/NET/COMP/VAL` dock becomes Build's
phase control rather than a separate screen's. Nothing is deleted until its replacement is proven.

## Why this is a PLAN, not an edit

It is a surface merge with three capabilities to re-home and a fixed dock to relocate, in the area
that produced both of today's workflow defects. The same discipline that applies to §8 applies here:
**stage it, prove each step, delete last.** Suggested order —

1. **Inventory ASSIGN / QR / LOG NOTE** properly (what each writes, who calls it) — the step that
   `.431` skipped and paid for.
2. **Re-home them into Build** additively; the rack detail keeps working.
3. **Make the phase dock Build's**, so phase navigation lives with the phase work.
4. **Then** retire the rack detail as a destination — keeping `deploy_showRackDetail` only if a
   deep-link still needs it, and pointing it at Build if not.

⚠ **Do not start at step 4.** The dock and the detail are what the back-nav restore path lands on
(`:19053`), and `v1.14.437` only just made that landing coherent.

## Step 3 is bigger than this plan assumed — measured 2026-08-11

**The dock is not standalone.** Its renderer is:

```js
phdock_render(deployId, rackId, rackPhases, cardsHtml, rack)
```

`cardsHtml` is the **phase-card markup the rack detail builds** — START / COMPLETE / OVERRIDE per
phase. So "move the dock into Build" is really **two** jobs:

1. Build must produce the phase-card content the detail currently produces, and
2. only then can the dock be re-parented to Build's surface.

⛔ **Do not re-parent the dock first.** `phdock_render` fails loudly and correctly when its nodes are
missing (*"under body.rd the sheet is the ONLY door to the phase cards… if either node is missing
the tech loses START/COMPLETE/OVERRIDE with no symptom"*) — but a dock rendered with someone else's
`cardsHtml`, or with none, is a phase control that cannot complete a phase. That is worse than the
detour it replaces.

**Revised step 3, in order:**

- **3a.** Inventory what builds `cardsHtml` today and what it depends on (rack, phases, gating).
  Same discipline as step 1 — inventory before moving.
- **3b.** Give Build the phase cards, ADDITIVELY, with the detail still rendering its own.
- **3c.** Re-parent the dock to Build and prove START / COMPLETE / OVERRIDE work from there.
- **3d.** Only then step 4 (retire the detail as a destination).

⚠ **The estimate that mattered:** step 2 was one array append plus a guard. Step 3 is a content
migration with a live safety rule attached to it. They are not the same size, and the plan
previously implied they were.

### 3a — DONE (inventory, 2026-08-11). The coupling is the refresh, not the markup.

`_phCardsHtml` is built by an IIFE **inside `deploy_showRackDetail`** (`:40019`–`:40094`) and handed
to `phdock_render` at `:40166`. Under `?legacy=1` the same string is appended inline instead
(`:40100`), so the builder already serves two presentations — which is the good news.

**What the cards depend on:**

| Dependency | Refs | Note |
|---|---|---|
| **`deploy_showRackDetail(…)`** | **4** | ⛔ the cards' own actions RE-ENTER the detail to refresh |
| `deploy_advancePhase(…)` | 3 | START / COMPLETE |
| `deploy_isPhaseGated(…)` | 1 | per-phase gating |
| `deploy_overrideGate(…)` | 1 | OVERRIDE |
| `deploy_renderPhaseStaleBadge(…)` | 1 | staleness |

⭐ **THE COUPLING IS THE REFRESH.** Four of the ten call sites re-enter `deploy_showRackDetail`, so
these cards do not merely *live* on the detail — their actions are wired to re-render **that
surface**. Move the markup alone and every START/COMPLETE/OVERRIDE tap in Build would navigate the
technician back to the screen this merge exists to retire. It would look like the buttons worked and
then "jumped" — the same shape as `.436`'s wrong-landing, reintroduced by the fix for it.

**So 3b is a REFRESH-CALLBACK extraction, not a copy-paste:**

1. Lift the IIFE to a named builder — `deploy_buildPhaseCards(deployId, rackId, rackPhases, rack, onRefresh)`.
2. `deploy_showRackDetail` calls it with `onRefresh = () => deploy_showRackDetail(deployId, rackId)`
   — **byte-identical behaviour on the existing surface, which is the acceptance bar for 3b.**
3. Build calls it with `onRefresh = () => bw_render()`.
4. The four hardcoded `deploy_showRackDetail(...)` strings in the card markup become that callback.

⚠ **The four are inside onclick STRINGS**, not JS references, so they cannot be swapped by renaming
a variable — the builder has to emit the caller's refresh hook. That is exactly why 3b is a
migration and not a move, and why re-parenting the dock first (3c before 3b) would strand the cards.

### ⛔ 3a's COUNT WAS SHORT BY NINE — corrected at `v1.14.439`, 2026-08-11

The table above answers *"what does the phase-card block contain."* The question that decides 3b is
**"which code assumes the surface it refreshes is the rack detail,"** and that answer is **13**:

| Where | Sites | Lines (at `.438`) |
|---|---|---|
| `onclick` strings in the card loop — the four above | 4 | `40067` `40069` `40073` `40076` |
| Resume **after a modal** | 4 | `30238` `30255` `30285` `30471` |
| Emitted **inside** the card markup by its own helpers | 5 | `29037` `29048` `29060` `29065` `29621` |

⛔ **This kills the `onRefresh` CALLBACK.** Nine of the thirteen run after the builder's scope is
gone — `ge_captureSkip`/`ge_captureSave` resume when the quirk modal closes, `ta_resolveUnblock`
when Troubleshoot resolves, and the five `checklist_*`/re-verify sites are emitted into onclick
attributes. A closure survives none of them.

⭐ **`.439` shipped the mechanism 3b needs:** `phase_refreshSurface(surface, deployId, rackId)` —
a **string** key, `'build'` → `bw_render`, anything else → `deploy_showRackDetail`. `'detail'` is
the default so untouched callers are byte-identical, and an unknown key warns and still lands
somewhere rather than nowhere (Contract 14).

📌 **It was already live, which is why it shipped ahead of 3b.** `.438` moved ASSIGN into Build
while `deploy_assignRack` still ended with `deploy_showRackDetail`, so Assign-from-Build threw the
technician onto the detail. **Every remaining merge step adds a second destination**, so the other
twelve are now known work rather than a surprise found mid-ship.

⚠ **The IIFE also reads `dep` and `rackAudit`**, which the proposed signature omits. Pass them in;
the detail already holds both and re-deriving `deploy_loadAuditFor` on a hot render path buys
nothing.

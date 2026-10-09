# LEGACY-RETIRE — THE STRANDED ROWS

**Required by the owner ruling of 2026-08-29** (`SHIP-HANDOFF-LEGACY-RETIRE-RULING.md`), which
pulled Stage 5 from this campaign: *"This is feature work, not deletion. The 3 unresolved rows get
their redesign doors built under **SHIP-HANDOFF-IA-SHIFTNAV** … Do not build doors here. Document
the 3 rows in a short note and stop."*

**Nothing is built here. This is the handover.**
**Re-verified against live `v1.14.544`, 2026-08-30.** `PHASE0-CENSUS.md` is anchored at `v1.14.166`
and is **378 versions stale**, so every claim below was re-checked in source rather than inherited.

---

## ⛔ CORRECTION — 2026-09-01, against `v1.14.558`. READ THIS BEFORE THE BODY.

**Two claims below are now false. The body is left standing, because how it was wrong is the
more useful record.**

1. ⛔ **DEPLOY OPTICS WAS NEVER STRANDED — it was UNFINDABLE.** It has a working redesign door at
   `dct-ios.html:13914`, a `.cs-tool` button calling **`rd_openOpsTool('optics')`**, which invokes
   the identical `OPS_TABS` renderer `showOpsTab('optics')` does. Measured on phone-webkit at
   390×844: tapped, opened, `#ops-tool-host` rendered **362×746, visible, 1,619 chars**.
   ⭐ **That door is not new — `v1.14.383` built it and `v1.14.425` made it phone-visible.** Both
   predate the `.544` pass below by more than a hundred versions.
   ⭐ **HOW THIS NOTE GOT IT WRONG, and it is the lesson, not the error:** the `.544` re-check
   searched `showOpsTab(` and the legacy `.stab`. It never searched **`rd_openOpsTool(`** — the
   same entity behind a second name. **A name-based grep is evidence about NAMING, never about
   EXISTENCE.** This note was careful, explicitly re-verified against source, and still inherited a
   wrong verdict, because one of two spellings was invisible to it.
   📌 **The real defect was real, just misnamed:** every Command Deck tool door sits **2.4–2.9
   screens below the fold** with nothing pointing at it. That is a findability problem across
   **ten** tools, not a stranding problem on one. See `docs/IA-SHIFTNAV-PHASE0-NAV-CENSUS.md`.

2. ✅ **THE BLOCKER AT THE FOOT OF THIS NOTE IS CLOSED.** `SHIP-HANDOFF-IA-SHIFTNAV.md` and
   Addendum A were imported verbatim on 2026-09-01 (`2160d71`) — 5,442 and 6,209 bytes. The base
   spec, its Phase 0 census and its ruled Phase 1 proposal are all in the repo.

⭐ **WHAT IA-SHIFTNAV ACTUALLY INHERITS, superseding the closing section:** not a door to build —
a **findability** ship across all ten OPS tools, ruled **V-1 / 1a** by the owner on 2026-08-31.
⛔ **Ship 1 must NOT add a door to Deploy Optics.** It already has one; a second would violate
Contract A2, one canonical door.

---

## ⭐ THE HEADLINE: it is ONE row, not three

The census listed six STRANDED rows, three already marked resolved. Of the three the ruling
inherited, **only one is still stranded.** The other two resolved themselves in ships nobody went
back to reclassify.

| Row | Census verdict (`.166`) | Verdict at `.544` | Goes to IA-SHIFTNAV? |
|---|---|---|---|
| **Deploy Optics tab** | STRANDED | ⛔ ~~**STILL STRANDED**~~ → **WRONG, see the correction above.** Reachable at `:13914` since `.383`/`.425` | ⚠ Yes, but as **findability**, not a door |
| **pg-twin** | STRANDED, re-home "half-done" | ✅ **RESOLVED** — re-homed, door exists | ❌ No |
| **pg-triage** | "RETIRED as a redesign surface" | ✅ **SUPERSEDED**, not stranded | ❌ No |

---

## 1 · Deploy Optics tab — ⛔ ~~GENUINELY STRANDED~~ **SUPERSEDED 2026-09-01. See the correction.**

⚠ **Everything in this section is accurate about the LEGACY door and wrong about the conclusion.**
The legacy `.stab` really is inert inside `pg-sop`; what follows simply missed the second, working
door in the redesign. Kept verbatim as the record of a careful pass that still reached a wrong
verdict.

**What it is.** `renderOpticsTab()` (`:52644`) — a complete optic scanner and inventory surface.

**Why it is stranded, precisely.** ⛔ **FALSE — corrected above; `rd_openOpsTool('optics')` at
`:13914` is a second, working door.** The original claim follows: *it is reachable only through*
`OPS_TABS.optics` *(`:24955`), whose sole door is one* `.stab` *at `:16432`*:

```html
<div class="stab" data-tab="optics" onclick="showOpsTab('optics')">Optics</div>
```

That strip is `#ops-tab-strip` (`:16422`), which lives inside **`<div class="page" id="pg-sop">`**
(`:16421`) — a page the redesign never shows. So the door exists in exactly one house.

⭐ **THE SURFACE ITSELF IS NOT BROKEN, AND THAT MATTERS FOR THE ESTIMATE.** `optics` is **not** in
the `_unhomedOps` list at `:25022` (`rackmap`, `bom`, `manifest`, `portmap`), so `showOpsTab('optics')`
renders through `deploy_opsHost()` — which resolves to `#wk-deploy` **under the redesign**. The
panel would draw correctly in the redesign frame today. **What is missing is a door, not a surface.**
Calling `showOpsTab('optics')` from a redesign control is very likely the whole fix.

⚠ **Do not simply un-hide the legacy strip.** That strip carries nine other tabs with their own
routing and their own homes; exposing it wholesale would import legacy nav into the redesign, which
is what Stage 7 exists to end.

## 2 · pg-twin — ✅ RESOLVED. Do not build a door.

The census called this *"STRANDED, not RE-HOMED — the re-home is HALF-DONE."* At `.544` it is done:

- `redesign_homeIssues()` (`:23148`) re-parents the live `#issue-page` node out of `pg-twin` into
  `#wk-issues` at `DOMContentLoaded`, keeping `issue_renderList`'s `getElementById('issue-page')`
  target intact — a move, not a rebuild.
- **A redesign door exists** at `:14165`: a `.stab` with `data-wk="wk-issues"` that calls
  `showStab(this,'work-sub','wk-issues')` and then `issue_pageOpen()`.
- `wk-issues` is a registered `work-sub` panel (`:17624`).

**What remains of `pg-twin` is an empty shell** — `:16445`–`:16447` contain only `#issue-page`, which
is moved out at boot. ⛔ That makes it **Stage 6/7 work** (a re-homed shell whose organ has left),
**not Stage 5 work.** It needs a deletion, not a door.

📌 The census's other half — *"Memory/Twin — Stage 4 will re-home its data"* (`:16641`) — refers to a
data concept, not a reachable surface. Nothing renders it.

## 3 · pg-triage — ✅ SUPERSEDED, not stranded. Do not build a door.

The legacy NOW dashboard. The census already said it was *"intentionally SUPERSEDED by the pg-cmd
rebuild"*, and that holds: `#pg-cmd` is the redesign's Command surface and covers the same job.
A stranded surface has no equivalent; this one has a **replacement**. Building it a door would
re-introduce the page the redesign was built to replace.

Its remaining children are `#triage-mission-bar`, `#triage-brief-bar`, `#qa-deploy-card`,
`#today-dashboard`, `#cmd-blocker-card`, `#cmd-handoff-card`, `#fr-chip`.

---

## ✅ Findings this re-verification turned up — **ALL THREE CLOSED by `v1.14.555`**

⭐ **Re-checked 2026-09-01 at `.558`: `firstRun_renderChip` and `#fr-chip` return ZERO matches;
`today_render` and `#qa-deploy-card` survive only as comments.** `.555` deleted the three writers
together with the page they painted into, so every item below is now historical. **Recorded as
closed rather than deleted** — the shape they shared is the point, and it will recur.

⚠ **One live reference to the deleted page remains, and it is NOT one of these three.** `:24266`
still resolves a legacy home id: `redesign_isOn() ? 'pg-cmd' : 'pg-triage'`. The redesign branch is
correct; the legacy branch names a page whose markup `.555` removed. `?legacy=1` is inert since
`.554`, so this is very likely dead-but-harmless — **but it has not been proven harmless, and it is
not in this note's scope.** Flagged, not chased.

The original text follows. Both are the **dead-render-host** shape: live code painting into
`pg-triage`, which the redesign never displays. Neither is a stranded surface, so neither belongs in
this handover — recording them here only because this pass is what found them.

1. **`firstRun_renderChip()` paints into a hidden node.** `#fr-chip` has exactly **one** markup
   instance, inside `pg-triage`, and one JS writer. It is called from `firstRun_confirm` — so on
   every setup, under the redesign, it writes into a page nobody sees.
2. **`#qa-deploy-card` is the same shape** — one markup instance inside `pg-triage`, one live writer.
3. Already recorded in `PHANTOM_CURRENT_STATE.md`: **`today_render` runs in full at every boot**
   into `#today-dashboard`, also inside `pg-triage`. ✅ **CLOSED by `.555`** — 338 lines deleted.

⭐ These three share one cause, and it is worth naming once: **`pg-triage` is a page the redesign
never shows but the app never stopped writing to.** A single ship could re-point or retire all
three; it belongs to no stage yet, and it is a *correctness* question, not a cleanup one.

---

## What IA-SHIFTNAV inherits — ⛔ **SUPERSEDED 2026-09-01. The correction at the top governs.**

⭐ **IT INHERITS A FINDABILITY PROBLEM, NOT A DOOR.** Deploy Optics has a working door
(`rd_openOpsTool('optics')`, `:13914`); so do the other nine OPS tools. What none of them has is any
nav route pointing at them — all ten sit **2.4–2.9 screens below the fold** on the Command Deck.
Owner rulings **V-1** (VERIFY is a band inside Build) and **1a** (Ship 1 is the Build tool door),
2026-08-31, and `v1.14.558` restored the `ops_init` row that Ship 1 lands on.
⛔ **Ship 1 must NOT add a door to Deploy Optics** — Contract A2, one canonical door.

✅ **THE BLOCKER IS CLOSED.** `SHIP-HANDOFF-IA-SHIFTNAV.md` (5,442 b) and Addendum A (6,209 b) were
imported verbatim on 2026-09-01 (`2160d71`). Nothing here is waiting on the owner any more.

**The original text, which was true when written and is kept for the record:**

> **One door: Deploy Optics.** Not three. The surface already renders correctly in the redesign
> frame; it needs a redesign-side control that calls `showOpsTab('optics')`, and nothing more.
>
> ⛔ **`SHIP-HANDOFF-IA-SHIFTNAV.md` does not exist on this machine.** Addendum A has been held for
> that reason since before this campaign began. Until the base spec is in the repo, this row has
> nowhere to go — that is a blocker on the owner, not on the work.

**STOP. Per the ruling, no doors are built here.** ⭐ **And per the correction, none are needed.**

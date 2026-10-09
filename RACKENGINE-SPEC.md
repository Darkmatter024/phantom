# RackEngine — Implementation Spec

**Status:** design complete. **M2-a SHIPPED** (`v1.14.401` `a94bb5f` — lifecycle owner + I4 observer; `v1.14.402` `1f47b87` scoped the observer to the redesign house). **M2-b not implemented** — `attach`, the reclaim barrier (I6), modes, the data contract and the §8 deletions all remain owed.
**Governs:** blueprint §5. Owner rulings **R-05** (one engine, many hosts) and the standing **RACK SCENE LOCK**.
**Amended 2026-08-06** by owner ruling on the aisle: **§4.1** (subject + entry) and **§8.1/§8.2** (doors + storage).
**Baseline:** `dct-ios.html` @ v1.14.395 (`68dd5a9`); §4.1/§8.1 line references read against v1.14.402.

---

## §1 — What this is and is not

**Is:** one engine that renders a rack into any host, in any approved mode, interactive or not, from one data contract and one colour vocabulary, with one lifecycle owner.

**Is not:** a consolidation of surfaces. Per R-05, the rack may legitimately appear in Build, Open Aisle, Rack Map, deployment review, contextual detail, Command, and future approved views. **No presentation is removed.** What is removed is seven independent *implementations* of the same idea.

**Not touched.** Scene internals move byte-identically: materials, the §A JOHN-LOCKED light rig, fog, tone mapping, tray geometry and internals, type colours, bezel strips, floor, reflection, boot. RACK SCENE LOCK holds; only the `camera` term is open, and this spec changes *who owns* the camera, not what it looks like.

---

## §2 — The door

```js
const handle = RackEngine.attach({
  host,          // Element — required
  rackId,        // string — required; the engine resolves the rack itself
  mode,          // 'bay' | 'aisle' | 'detail' | 'map' | 'review' | 'hero'
  interactive,   // bool — default derived from mode (§4)
  view,          // optional initial view; omitted → restore this rack's last view
  context        // optional { deploymentId, phaseId } for annotation
});

handle.update(patch)     // data changed → mutate in place. NEVER re-creates.
handle.setView(view)     // { camera, exploded, cablesVisible }
handle.setMode(mode)
handle.promote()         // request the interactive slot
handle.demote()          // give up the interactive slot, keep rendering flat
handle.suspend()         // host not visible → stop the loop
handle.resume()
handle.detach()          // tear this attachment down
handle.state             // live, read-only

RackEngine.report()      // the census (§10)
RackEngine.interactive   // the handle currently holding the context, or null
```

`attach` is **idempotent per host**: attaching to a host that already has an attachment for the same `rackId` returns the existing handle and applies any changed params. It does not rebuild. This is what makes `bw_render()` safe to call repeatedly.

---

## §3 — INVARIANTS

| # | Invariant | Enforced by |
|---|---|---|
| **I1** | At most one attachment is `interactive` at any moment | the arbiter (§5), inside the engine — never by callers |
| **I2** | `create` and `update` are different operations. A data change never allocates | `attach` idempotency + `handle.update` |
| **I3** | The host element is stable across updates. Nothing wipes a live mount | callers stop rebuilding hosts (§8) |
| **I4** | An attachment whose host is not visible suspends itself | `IntersectionObserver` + `visibilitychange`, per attachment |
| **I5** | Nothing mints a canvas to ask a question | capability owned by the engine, probed once, released |
| **I6** | **No context is acquired in the same task as a release** | the reclaim barrier (§6) |
| **I7** | Non-interactive attachments hold no WebGL context, ever | flat renderer path has no `getContext` |
| **I8** | One data contract. Callers pass `rackId`, never a rack object | `_resolve` (§7) |
| **I9** | One colour vocabulary. Every mode reads `Vocabulary` | `_resolve` normalises `type` before any renderer sees it |
| **I10** | Degradation is visible and honest. No silent downgrade | §9 |

---

## §4 — Modes

`mode` chooses camera rig, composition and which controls render. `interactive` chooses WebGL versus flat DOM. They are separate axes, deliberately — a `bay` that cannot get a context is still a `bay`, rendered flat, not an error screen.

| Mode | Surface today | Default `interactive` | Notes |
|---|---|---|---|
| `bay` | Build workspace `#bw-mount` | **true** | the primary interactive rack |
| `aisle` | the active rack **in its row** (§4.1) | **true** | wider rig, walk composition |
| `detail` | rack-detail panel `#reh3dMount` | **true** | interactive when focused |
| `map` | Rack Map | false | flat, drag/edit affordances |
| `review` | deployment review | false | flat, annotated with phase + blocker |
| `hero` | Command | **false — ruled** | Command's approved static presentation |

`hero` is non-interactive by owner ruling, not by capability. It is expressed as `interactive: false` on the one engine rather than as a separate code path — which is what deletes `cmd_rackHero3D`.

---

## §4.1 — The aisle: subject and entry

**Owner ruling 2026-08-06.** Asked whether the five-rack Forge loadout was a planning bench in real use or legacy composition, the owner ruled **legacy composition — absorb it into M2-b.** The design below is that absorption. It supersedes the aisle's current behaviour entirely.

### The defect this closes is a WRONG SUBJECT, not a misplaced control

The question that started this was where to put the `OPEN AISLE` button. That was the wrong question, and the code says why:

- `bw_render`'s handler is `ab.onclick → forge3d_open()` (`:20467`) — it **takes no rack argument.**
- The aisle's subject is `LOADOUT`: up to five racks from `deploy_forge_loadout_v1`, or `RUN.slice(0, 5)` — the first five racks of the run — when that is empty (`:19781-82`).
- If the loadout resolves empty, `openPicker()` fires (`:19784`). **The technician taps a control on the rack they are building and gets a "choose racks" modal.**

So the rack under the tech's hands is not passed in and may not be on screen. No placement fixes a control that navigates away from the subject of the screen it sits on. Worse, it sits in the preview card header directly above the FRONT/ISO/TOP/REAR + EXPLODE + CABLES rail — controls that *are* genuine view modes of this rack — which teaches that the aisle is another view mode. It is not; it is a different workspace with its own persisted state.

**Doctrine already answered the standalone question.** *One door per feature* is a hard rule, and the aisle has **three** doors today: Build (`:20467`), rack detail (`:37216`), header menu `FORGE 3D` (`:13043`).

### Subject

```js
RackEngine.attach({ host, rackId, mode: 'aisle' })   // SAME rackId the bay is showing
```

The engine centres on `rackId` and resolves its neighbours **from run order**. No saved selection, no picker, ever. A rack with no row context — standalone, or the host-less-cab case — **says so** and renders honestly rather than fabricating neighbours; that is I10 plus the `source` rule in §7.

### Entry — a continuation, not a command

**No standalone control. The gesture already exists.** The rack canvas already claims pinch (`.264`, preventDefault on claimed horizontal orbit + pinch), so the aisle is not a new gesture — it is **what is there when you keep zooming out.** Pinch out past the rack's envelope and the neighbours come into frame; pinch back in and you are at the bench. Nothing is named, nothing is learned, and the only thing that changed is camera distance — the one term RACK SCENE LOCK leaves open.

**Secondary affordance, for gloved one-handed use:** the rack's identity line carries its own position — `u1:002 · 4 of 12 · ROW A ›` — and tapping the position widens to the row. Information first, navigation second. **If a dedicated action is ever required, this is where it lives** — never a floating command in a card header.

**Return is symmetric and free.** §5's demote/promote already keeps the demoted attachment's data and view state, so returning restores camera, explode and cables. The rack never disappeared and never lost its angle.

⚠ **OPEN OWNER CALL — the zoom-out threshold at which the row appears.** That is a feel value and belongs on the device, not at a desk. The rack scene itself stays byte-identical; the aisle is a distinct presentation under R-05, and the transition is a handoff between two modes of one engine.

---

## §5 — Interactive arbitration

The single slot. `RackEngine._interactive` holds one handle or `null`.

```
promote(next):
  if (_interactive === next) return                    // already ours
  if (_interactive) {
    _interactive._demoteToFlat()                       // keeps data + view, renders flat
    _releaseContext()                                  // dispose + forceContextLoss + arm barrier
  }
  _interactive = next
  _acquireContext(next)                                // goes through the barrier (§6)
```

**Demotion is not disposal.** The demoted attachment keeps its resolved data and its view state and re-renders flat into the same host. Nothing is destroyed, so promoting it back restores the same camera, explode and cable state.

That is the mechanism behind Build → Open Aisle → Build: Build demotes to flat, Aisle takes the context, and on return Build is promoted and restores its view. From the technician's side the rack never disappeared and never lost its angle.

**A second interactive request never fails silently.** It either transfers the slot or, if transfer is refused, the requester degrades visibly per §9.

---

## §6 — The reclaim barrier (I6)

The fix for the iPhone refusal. **Not a retry and not a timeout** — an ordering guarantee.

```js
let _barrier = false, _pending = null;

function _releaseContext() {
  try { renderer.dispose(); } catch (_) {}
  try { renderer.forceContextLoss(); } catch (_) {}
  _barrier = true;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    _barrier = false;
    const p = _pending; _pending = null;
    if (p) p();
  }));
}

function _acquireContext(handle) {
  if (_barrier) { _pending = () => _create(handle); return; }
  _create(handle);
}
```

**Why double `rAF`.** On iOS WebKit the GPU-side reclaim from `forceContextLoss()` is asynchronous. A single `rAF` can still land in the same compositor frame. Two frames is ~33ms — imperceptible to a human, and it is a *guarantee* rather than a hope.

**Only one pending acquisition is held.** Rapid navigation collapses to the last request; it does not queue N allocations.

**If the context is still refused after the barrier, we do not loop.** We degrade per §9 and record it in `report()`. Retrying a refusal is what made the pressure worse, and that finding stands.

---

## §7 — Data contract (I8, I9)

Callers pass `rackId`. The engine resolves.

```js
_resolve(rackId) → {
  id, label, units,                       // units = rack height in U
  devices: [ { u, height, type, label, hostname, status } ],
  source: 'master' | 'deployment' | 'standalone',
  dataState: 'populated' | 'empty' | 'unassigned'   // R-06 — see §7.1
}
```

**`type` is normalised through `Vocabulary.typeOf()` inside `_resolve`, before any renderer sees it.** This is the root fix for the monochrome flat elevation: today `master_rackToElevation` `:32613` emits RAW codes, `rackElevation_buildHtml` `:36255` writes them into `data-type`, and the CSS at `:10439` is keyed on the EDP vocabulary — intersection `{gpu}`, so nine of ten device classes render grey. With normalisation in the resolver, **no mode can render a RAW code**, and the bug becomes unrepresentable rather than fixed-and-refixable.

It also removes the reshape divergence: `master_renderHit` `:32754` reshapes the rack where the other path passes the whole record. Neither does now — both ask for a `rackId`.

`source` is carried for honesty, not behaviour: a rack that exists only as a cable endpoint resolves with an empty `devices[]`, and the engine says so rather than rendering a convincing empty rack.

---

## §7.1 — Topology is not contents (owner ruling R-06, 2026-08-06)

**The Master must not determine whether a physical cabinet exists.** Topology says which cabinets exist and where; the Master *enriches* them. **A zero-component rack is a valid rack state, not a missing-rack state.**

### Where topology comes from — and the one honest limit

Topology is **already available and already independent of contents.** `deploy_forge_rackList()` `:19243` returns `Object.keys(m.racksByCab)`, and `racksByCab` is built from **both** host rows **and** cable endpoints — so the roster already contains host-less cabs. In US-QRS03 roughly **215 of 511 cabs (≈42%)** are cable-endpoint-only. The field report's own readout proves it: `ROW S3 · POS 113/119` means the roster already knew **119** cabs in that row while the cab under inspection had **zero** devices.

This satisfies R-06 without a new data source, and it stays inside Design Law 6 (site data flows from the Master):

> **the Master's CAB ROSTER is topology; the Master's HOST ROWS are contents.** Absence of hosts is never absence of cabinet.

⚠ **The limit, stated so it is not discovered later.** PHANTOM can render a shell for every cabinet *some source has mentioned*. It **cannot** invent positions no source has ever mentioned — if a row physically has 140 cabinets and every source knows 119, the missing 21 cannot be drawn without fabricating them, and fabrication is barred. `buildPhysicalRackTopology(row)` therefore resolves **the roster**, not the floor. Extending topology beyond the roster requires a real floor-plan/topology input and is a **separate owner ruling**.

### §7.1a — MEASURED BLAST RADIUS (US-QRS03, 2026-08-06)

Not an edge case. Measured offline against `MASTER-US-WEST-99Z-US-QRS03-QUARRY.xlsx` by replicating the parser exactly — the app's own vendored SheetJS, the same `CAB_RE` / `RACK_RE`, the same columns (`SITE-HOSTS` `hr[3]`; cable `row[2]`/`row[11]`), and CUTSHEET as the source because the workbook has no WIP sheet.

**Sanity-checked before use, per the standing measurement rule:** the parse returns **511 cabs / 296 with hosts / 215 host-less** and **4,143 host lines**, matching the independently recorded US-QRS03 figures. The replication is faithful.

| Row | Cabs | With hosts | Empty |
|---|---|---|---|
| `s1` | 98 | 98 | **0** |
| `s2` | 98 | 98 | **0** |
| `s3` | 119 | 100 | **19** |
| `s4` | 98 | **0** | **98** |
| `s5` | 98 | **0** | **98** |

**⛔ ROWS S4 AND S5 ARE 100% HOST-LESS — 196 cabinets that exist, carry cabling, and today render as nothing at all.** With `s3`'s 19 that is **215 cabs, ≈42% of the site.** R-06 governs two entire rows, not one cabinet.

**The reported cab is legitimate, and it has content to show.** `s3:172` sits at position **113 of 119** — matching the device readout exactly — with **0 hosts but 31 cables out and 44 cables in.** A richly connected patch/network cabinet. That is precisely R-06's *cabling-only cabinet: render the shell and any available cabling or assignment metadata* — the data exists and the current surface discards it. The `s3` empties also fall in contiguous blocks (`101–110`, `112–114`, `137–140`, `171–172`), consistent with dedicated network sections rather than scattered data loss.

**✅ ANSWERED by the owner 2026-08-06: `s4` and `s5` are FUTURE ROWS — no hosts expected yet.** The Master is correct and complete; there is no ingest defect. See §7.1b for what that answer changes.

### §7.1b — `dataState` describes the MASTER, never the FLOOR

The owner's answer creates a distinction R-06 did not need to make, and getting it wrong inverts the honesty failure it was written to fix.

- `s3:172` — 0 hosts but **31/44 cables**, in a row that is 100/119 populated. This cabinet demonstrably **exists**.
- `s4`/`s5` — 0 hosts across **98 of 98**, cabling planned in CUTSHEET. These are **future rows**. The cabinets may not be **installed yet.**

Rendering all 196 as "a complete empty 48U cabinet shell" would tell a technician **196 cabinets are standing in those rows.** That is fabricating presence — the same class of lie as hiding a cabinet that exists, pointed the other way, and it is what the standing *never label absent telemetry* rule forbids.

**The Master cannot currently distinguish them.** Verified: `SITE-VARS` carries only `location`, `row_type` and `rack_type` (data-hall names and subnet conventions). **No build-status field exists anywhere in the schema.** And it must not be guessed — "a row with zero hosts across every cab is probably future" would mislabel a legitimate all-patch row, and heuristics of that shape are barred.

**Ruling of record (mine, under delegated engineering authority — reverse it if you disagree):**

> **`dataState` reports what the MASTER knows, never what the FLOOR contains.** `'empty'` means *the loaded Master has no devices for this cabinet* — true for `s3:172` and for every `s4`/`s5` cab alike. It asserts neither that the cabinet is installed nor that it is absent. The shell renders; the **label never overclaims.**

So the geometry from §7.1's contract is unchanged, and only the wording is constrained: **never "empty cabinet, ready to rack"** — always *"no host data in the loaded Master."*

⚠ **The one thing that needs the owner, because it changes a file he maintains:** if PHANTOM should say *"future row"* rather than the weaker *"no host data,"* the Master needs somewhere to say it. Natural home is a **`SITE-VARS` `row_status` var** (`row_status | s4 | planned`), which is site data flowing from the Master exactly as Design Law 6 requires, and the SITE-VARS ingest already shipped in `.346`. Absent that var, PHANTOM stays with the weaker honest label. **This is a Master-schema change and needs an explicit ruling — do not add it unprompted.**

### Required construction — topology first, never a populated filter

```js
const rackShells = buildPhysicalRackTopology(row);       // roster, contents-independent
const racks = rackShells.map(shell => ({
  ...shell,
  contents:  masterContentsByRackId[shell.id] ?? [],
  dataState: masterContentsByRackId[shell.id] ? 'populated' : 'empty'
}));
```

`_resolve` **is** this shell factory — R-06 extends §7 rather than competing with it. Every expected position yields one canonical shell; Master records merge into the matching shell; **unmatched shells stay present as empty racks**; IDs and ordering are stable.

### Per-cabinet rendering contract

| Condition | Render |
|---|---|
| Full data | cabinet + all known devices |
| Partial data | cabinet + known devices + **honest missing-data states** |
| No Master devices | **a complete empty 48U cabinet shell** |
| Cabling-only | shell + any available cabling / assignment metadata |
| Unknown assignment | shell marked **unassigned/unknown** — never absent |

**If the front rendering represents five cabinet positions, all five always render.**

### What is defective today (measured, not assumed)

- `setLoadout` `:19740` builds `WINDOW` as `LOADOUT[k] || null` and an unfilled position becomes a **pad** (`s.userData.pad`) rather than a cabinet shell. Under R-06 every one of the five positions renders a **shell**; a position with no rack is an *unassigned shell*, not a blank pad.
- The same line filters with `deploy_forge_slots(id).length || RUN.indexOf(id) >= 0`. It survives only because of the `RUN` fallback — its **first clause is exactly the populated-filter R-06 forbids.** Topology-first construction removes the question.
- A rack in the loadout with zero slots draws no guts, so it is visually indistinguishable from a pad. It must draw the 48U shell and carry `dataState`.

**This lands with `_resolve` at M2-b.** It is not a patch to `forge3d_render`, and it is not a fallback condition — it is the resolver being built correctly the first time.

---

## §8 — Migration map

All seven paths from `audit/07` Q1, with what each becomes.

| # | Today | Becomes | Disposition |
|---|---|---|---|
| 1 | `rackElevation_render3D` `:34923` | the engine's **interactive renderer internals** | absorbed; scene byte-identical |
| 2 | `forge3d_render` `:19066` | `attach({ mode:'aisle', interactive:true, rackId })` | **deleted** as a separate renderer — this is what kills F2. Subject and entry per **§4.1** |
| 3 | `rackElevation_buildHtml` `:36204` | the engine's **flat renderer** | absorbed; now `Vocabulary`-fed |
| 4 | `renderElevation` `:44865` | `attach({ mode:'map', interactive:false })` | absorbed; drops its private `TYPE_COLORS` `:44339` |
| 5 | `master_buildElevationRail` `:32893` | `attach({ mode:'review' })`, **own layout retained** | chassis-face rail is a legitimate distinct presentation (R-05). Same data + vocabulary, its own visual |
| 6 | `scrubbar_buildHtml` `:36361` | minimap presentation of the engine | absorbed |
| 7 | `cmd_rackHeroFlat` `:21778` / `cmd_rackHero3D` `:21790` | `attach({ mode:'hero', interactive:false })` | flat absorbed; **`cmd_rackHero3D` deleted** |

**The `bw_render` change is the one that ends the refusal.** Today `:20212` wipes the host and `:20357` builds a brand-new `#bw-mount`, destroying all mount-local lifecycle state, and then a new context is requested microseconds after the previous one was force-lost. After M2: `#bw-mount` is built once; the panels around it re-render freely; the rack receives `handle.update()`. Checklist toggle `:20446`, evidence save `:20465` and phase complete `:20489` all become `update` calls that allocate nothing.

**Deleted at M2** (definition of done includes the deletion, not just the replacement):
`forge3d_render` · `cmd_rackHero3D` · `reh3d_webglOK` · `phantom_webglCapable` · standalone `PhantomGL` · `diag()`'s census line · `TYPE_COLORS` `:44339` · the `_reh3dActive` / `_forge3dActive` twin trackers.

### §8.1 — The aisle doors and the loadout (owner ruling 2026-08-06, per §4.1)

**All three standalone doors are deleted, and no replacement command appears.** Entry is the zoom-out
continuation plus the row-position affordance in the rack's identity line (§4.1).

| Door | Site | Disposition |
|---|---|---|
| Build `Open aisle` | `:20467` | **deleted** — it navigates away from the subject of the screen it sits on |
| rack-detail `OPEN AISLE` | `:37216` | **deleted** — same entry model applies here |
| header menu `FORGE 3D` | `:13043` | **deleted** — under the new subject model there is no rack to centre on, so a rack-less aisle is meaningless |
| `openPicker` | `:20023` | **deleted** — retires with the loadout |

Three standalone doors → **zero**. One gesture, one contextual affordance.

### §8.2 — Storage disposition — ⛔ RETIRING THE FEATURE IS NOT DROPPING THE KEY

Both Forge keys are registered in M1's backup registry (`:50456-57`). M1 spent four ships making backup
coverage **derived and honest**; silently orphaning a key here would contradict that immediately.

| Key | Disposition |
|---|---|
| `deploy_forge_loadout_v1` | Feature retires. **The registry entry STAYS**, relabelled honestly — *"retired Forge loadout — carried for restore only"* — and is **never written again**. Existing devices still hold real bytes and those bytes must keep travelling in backups. Removing the entry is a **separate, owner-signed cleanup**, not this ship. |
| `deploy_forge_view_v1` | **Superseded** by the engine's per-rack view state (§2: `view` omitted → restore this rack's last view). Migrate on first read, then treat as above. |

Neither key may be deleted in the same ship that retires the surface that wrote it. A tech who restores an
old backup is entitled to their bytes even when the feature that made them is gone.

---

## §9 — Failure semantics (I10)

No silent failures, per the standing hard rule.

| Condition | Behaviour |
|---|---|
| Context refused after the barrier | attachment degrades to `interactive:false` **flat**, with a visible line naming why. No retry loop. Recorded in `report()`. |
| Second interactive request refused | requester degrades to flat with the same honest line |
| `rackId` unresolvable | honest empty state **naming the rackId** — never a blank host |
| Rack resolves with no devices | **R-06: render the complete empty 48U cabinet shell**, carry `dataState`, and say `source` — this is the documented host-less-cab case. It is a **valid rack state, not a missing-rack state, and never a render failure.** Never a blank, never a pad, never fabricated devices |
| Host not measurable | the existing `ResizeObserver` path is retained; it is sound and the `.191` per-mount re-arm stays |
| `webglcontextlost` at runtime | `preventDefault`, demote to flat, attempt re-promotion through the barrier **once**, then stay flat and say so |

A flat rack is a **legitimate presentation**, not a broken one. That is why degradation reads as "showing flat elevation" and not as an error.

---

## §10 — `report()` — and its own retirement

Absorbs the whole of M0's `PhantomGL`, plus what only the engine can know:

```
version · deviceWebgl · threeLoaded
attachments: [ { host, rackId, mode, interactive, suspended, ctx } ]
interactiveOwner · canvases {total,visible,hidden,live,lost,refused}
barrier { armed, deferrals } · lastRefusalReason
```

Per the blueprint's instrumentation rule, this replaces the standalone instruments and they are deleted in the same ship. `report()` itself is permanent — it is the engine describing itself, not a diagnostic bolted onto it.

---

## §11 — Verification (M2 gate)

The owner's 14-step sequence, with the numbers that must hold. `RackEngine.report()` at every step.

| Step | Must hold |
|---|---|
| Command | `interactiveOwner: null`, `live: 0` |
| Build | `interactiveOwner: bw-mount`, `live: 1` |
| Aisle (zoom out, §4.1) | `interactiveOwner:` the aisle host, **`live: 1`** — transferred, not added. **The centred rack is the one Build was showing**, and no picker appears |
| Return to Build (zoom in) | `interactiveOwner: bw-mount`, `live: 1`, **view restored** |
| Aisle entry points | **zero** standalone aisle controls exist anywhere (§8.1) — grep `forge3d_open` returns no call sites |
| ×10 Build entries | `live: 1` throughout, `refused: 0`, `total` does not climb |
| Checklist / evidence / phase | **zero** new contexts; `barrier.deferrals` may increment, refusals may not |
| Any surface | non-interactive racks still render |
| Data | unchanged |

Plus the mechanical gates: `node --check` ×3, CSS brace balance, line endings, three-stamp lockstep, and a diff confined to the rack subsystem.

---

## §12 — What M2 does not do

Not routing. Not storage. Not composition. Not Shift. Not the intelligence boundary. Not legacy deletion — **that is a separate ship inside M2, per R-04, and does not stack with this one.**

⚠ **Reconciling "not storage" with §8.2.** §8.2 is not storage *architecture* — that stays M-later. It is the
disposition of the two keys this ship's own deletions would otherwise orphan. The rule it encodes is narrow:
**a ship that retires a surface must say what happens to the bytes that surface wrote, in the same ship.**
Retiring `deploy_forge_loadout_v1`'s writer while leaving its registry entry to rot would be exactly the silent
data-orphaning M1 was built to end. Saying so costs a table; discovering it later costs a technician's data.

One ship, one subject.

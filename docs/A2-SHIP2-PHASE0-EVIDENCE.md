# A.2 SHIP 2 — PHASE 0 (blockers adapter · derived `openBlockers` · the Q-A `gaps` list; read-only, nothing authorised to build)

**Written:** 2026-09-17 · **Mode:** EVIDENCE ONLY. No product source edited, no adapter written, no spec written, no version bump.
**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md` §5 — *"Ship 2: blockers adapter (readout gains blocker events + derived openBlockers)."*
**Baseline:** `main` @ `472ba8e`, `dct-ios.html` at **`phantom-v1.14.592`** (`:12879` `const PHANTOM_APP_VERSION = 'phantom-v1.14.592';`), **60,896 lines**. `VERIFIED` line 1 reads `phantom-v1.14.592 VERIFIED`; `.592` is promoted (`PHANTOM_CURRENT_STATE.md` line 9). Every `:line` below was read against that tree. **Verbatim strings are the truth; line numbers are hints.**
**Rulings in force:** `OWNER-RULINGS.md` 2026-09-17 (Q-A → separate `gaps` list; Ships 2–4 verify one at a time) · 2026-09-15 (Q-1…Q-9) · 2026-09-14 (the composite is the rack key).
**Builds on:** `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md` §3 · `docs/A1-CENSUS-REFRESH-TIER-A.md` §3 · `docs/A2-ASSEMBLER-RECON.md` §1a · `docs/A2-SHIP1-PHASE0-EVIDENCE.md` §3a · `docs/A2-SHIP1-EVIDENCE.md` §5, §Q · `docs/DATA-HONESTY-COMMAND-PHASE0-EVIDENCE.md` §1, §4.

---

## 0 · What decides Ship 2

1. ⛔ **THE LIVE UI NEVER CLOSES A BLOCKER RECORD.** `PHANTOM_BLOCKERS.clear()` is the only writer of `clearedAt`, and its only caller is `PHANTOM_PHASE_MODEL.transition` (`:31586`), which has **zero call sites** in `dct-ios.html`. UNBLOCK (`:42209`) and *✓ THIS FIXED IT — UNBLOCK* (`:32329`) both call `deploy_advancePhase(…,'in_progress',…)`, which never touches the blocker store. **On a device every blocker record stays open forever, a `blocker.cleared` event can never appear, and a derived `openBlockers` never goes down — while every phase-status surface drops to 0 on UNBLOCK.** (§E-2, §E-6, **Q-10**)
2. ⛔ **THE PHASE CARD'S BLOCK BUTTON BYPASSES THE RECORD** (`:42206`), producing a blocked phase with no `blockerId` — the state §6.2 calls invalid. At the next boot **with a Master stored**, `migrate()` adopts it with `openedAt = Date.now()`: a boot time stored as an open time, marked only by `migrated: true`. (§E-2, **Q-11**, **Q-15**)
3. ⛔ **THE APP'S MOST VISIBLE "BLOCKER COUNT" IS NOT A COUNT OF BLOCKER RECORDS.** `deploy_countBlockers` counts AI Review `reviewIssues` (`:43259-43265`). It feeds the BUILD dock badge `bn-work-n`, Command, the readiness gate, the brief and `deploy_generateReport`'s `summary.openBlockers` (pinned by spec 64). On a MASTER SCOPE deployment with no AI Review run, all of those read 0 or stay hidden whatever the technician does. **The on-device comparison surface is the Build workspace, not the badge.** (§E-3, **Q-16**)
4. ✅ **The class itself is clean and fully census-documented:** one key, one JSON array, ten fields plus `migrated`, the composite rack key, epoch-ms stamps. The adapter needs no new read primitive — Ship 1's `_rr_readKey` serves it (§E-8).
5. ⚠ **Q-A touches the same lines Ship 2 must touch anyway.** Registering a third adapter already breaks spec 65's `coverage[2]` rack-row assertions; the `gaps` change lands on those same lines. Recommendation: ride in Ship 2 (**Q-14**).

---

## E-1 · BLOCKERS STORAGE

### E-1a · Key and container

```
:25950  var PHANTOM_BLOCKERS_KEY = 'phantom_blockers_v1';
:25952    loadAll: function() {
:25953      var v = safeGet(PHANTOM_BLOCKERS_KEY, []);
:25954      return Array.isArray(v) ? v : [];
:25956    saveAll: function(list) { return safeStore(PHANTOM_BLOCKERS_KEY, JSON.stringify(list || [])); },
```

One localStorage key, one JSON array. **No IndexedDB store holds blockers**: a search for `phantom_blockers_v1` returns only `:25950`, the JOBSTATE source label `:28671`, and the backup registry row `:55765`. Census: A.1 §3 *"**localStorage key:** `phantom_blockers_v1`"* and *"**Format:** JSON array; no compression"*; refresh §3 *"**Key** `:25918`, module `:25919`"* (line hints at `.590`).

### E-1b · Record shape — every field, with its census row

Written by `create()` `:25970-25978` and by `migrate()` `:26010-26019`:

```
:25971      blockerId: 'blk_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
:25972      rack: o.rack || '', stepId: o.stepId || '', phaseId: o.phaseId || '',
:25973      deploymentId: o.deploymentId || '',
:25974      desc: String(o.desc == null ? '' : o.desc),
:25975      openedBy: (typeof PHANTOM_SITE !== 'undefined' ? PHANTOM_SITE.currentOperator() : '') || 'Unknown',
:25976      openedAt: o.openedAt || Date.now(),
:25977      clearedBy: null, clearedAt: null
```
```
:26011          blockerId: 'blk_migrated_' + (ph.id || i) + '_' + (ph.blockedAt || 0),
:26012          rack: ph.rackId || '', stepId: '', phaseId: ph.id || '',
:26015          desc: String(ph.blockerNote || '') || '(no description recorded before v1.14.420)',
:26016          openedBy: 'Unknown (pre-v1.14.420)',   // never attribute to whoever is holding the device now
:26017          openedAt: ph.blockedAt || ph.updatedAt || Date.now(),
:26018          clearedBy: null, clearedAt: null, migrated: true
```

| Field | Type as written | Always present? | Census (quoted) | Adapter needs it? |
|---|---|---|---|---|
| `blockerId` | string | yes (both writers) | A.1 §3 `blockerId: 'blk_' + Date.now() + …`; refresh §3 *"Record … `blockerId`"* | ✅ event identity, open/clear pairing |
| `rack` | string; `''` when absent | yes | A.1 §3 `rack: STRING, // rack ID or name (may be empty)`; refresh §3 *"⭐ `rack` carries the COMPOSITE, not the human name"* | ✅ the rack filter |
| `stepId` | string, always `''` from live paths | yes | A.1 §3 `stepId: STRING, // … usually empty pre-M4` | ❌ not emitted |
| `phaseId` | string | yes | A.1 §3 `phaseId: STRING, // phase ID (links to DEPLOY_PHASES_KEY)` | ✅ event data |
| `deploymentId` | string | yes | A.1 §3 `deploymentId: STRING, // deployment ID` | ❌ already inside the composite |
| `desc` | string | yes | A.1 §3 `desc: STRING, // blocker description/reason (user-entered text)`; refresh §3 *"editing a blocker's description rewrites `desc` and touches **no timestamp**"* | ✅ event data — current text (I-2) |
| `openedBy` | string, `'Unknown'` or `'Unknown (pre-v1.14.420)'` possible | yes | A.1 §3 `openedBy: STRING, // ACTOR who opened it`; refresh §3 *"An adapter must carry that string through, not normalise it to an operator."* | ✅ event data |
| `openedAt` | number, epoch ms | yes — but see E-2d | A.1 §3 `openedAt: NUMBER, // epoch ms`; A.1 §3 *"**openedAt, clearedAt:** epoch milliseconds (`Date.now()`)"* | ✅ `t` of `blocker.opened` |
| `clearedBy` | `null`, or string | yes | A.1 §3 `clearedBy: STRING \| null`; refresh §3 *"`clear()` `:25952` sets `clearedBy` and `clearedAt`"* | ✅ event data |
| `clearedAt` | `null`, or number | yes | A.1 §3 `clearedAt: NUMBER \| null, // epoch ms when cleared (null = still open)` | ✅ `t` of `blocker.cleared`; openness |
| `migrated` | `true`, only on adopted records | **no** — absent on `create()` records | A.1 §3 `migrated: BOOLEAN // true if adopted from pre-.420 phase.blockerNote`; refresh §3 *"`migrated: true` marks it."* | ✅ provenance of `openedAt` |

⛔ **There is no `status` field.** Open/closed is `clearedAt` alone — the module's own predicate:
```
:25964    open: function() { return this.loadAll().filter(function(b) { return b && !b.clearedAt; }); },
```
The A.1 census hazard H5 says *"Blocker has status='open'/'resolved'"* — no writer produces such a field (Leads, L-3).

### E-1c · Rack-ID forms, and how each maps to the ruled composite

| Form | Where it comes from | Maps to composite |
|---|---|---|
| **composite** `rack_<depId>_<idx>` | live road: `blocker_save` → `create({ rack: rackId, … })` `:26054-26056`; `rackId` is `_blockerModal.rackId`, set from `ctx.rack.id` `:25671`/`:25680` or `blocker_pickRack(r.id)` `:25891` over `deploy_loadRacksFor` rows `:25834`; `activeContext_get` resolves `ctx.rack` as `racks.find(function(r) { return r.id === ctx.rackId; })` `:28482` — the rack record's `id`, the composite `:32500` | **identity** — exact string match |
| **composite, via the phase** | `migrate()` `rack: ph.rackId \|\| ''` `:26012`; `phase.rackId` is the composite (refresh §2; Ship 1's phases adapter already matches on it `:31670`) | identity |
| **empty string** `''` | `create()` default `rack: o.rack \|\| ''` `:25972`; `migrate()` when a phase has no `rackId` | **matches no rack** |
| **human / Master-style name** (`R-01`, `u1:007`) | A.1 §3 *"Direct string (may be empty); not composite; human-readable (e.g., "R-01", "AIS-002", or "")"* — **superseded** by the refresh (header: *"Supersedes, for these five classes only"*). **No live writer at `.592` produces it**; spec 12/13 fixtures create such records by calling `create()` directly | **matches no composite.** Translating it needs the racks store, which no census refresh covers (**STOP S-5**) |

Deployment ids contain underscores (`'dep_' + ms + '_' + rand6`, Ship 1 Phase 0 §4), so **the adapter must compare whole strings and never parse.** A prefix or substring test would let `rack_<dep>_1` claim `rack_<dep>_10`'s records.

### E-1d · Timestamps

- `openedAt` — epoch ms. `create()` writes `o.openedAt || Date.now()` `:25976`; the only live caller passes no `openedAt` (`:26054-26056`), so it is the save time. `migrate()` writes `ph.blockedAt || ph.updatedAt || Date.now()` `:26017` — see E-2d for why this is not always a happened-at.
- `clearedAt` — `null` at creation (`:25977`, `:26018`); set to `Date.now()` only by `clear()` `:25989`.
- No other timestamp exists on the record. **A `desc` edit leaves no trace in time** (refresh §3).

### E-1e · STOP list — fields the adapter would want that the census does NOT document

| # | Wanted | Why it is not available | Consequence |
|---|---|---|---|
| **S-1** | Whether a migrated record's `openedAt` came from `ph.blockedAt` (real) or `Date.now()` (fabricated) | No stored field says. The only signal is the `_0` suffix of a `blk_migrated_…` id (`:26011`), and **neither census documents that id format** | ⛔ Do not parse `blockerId`. Treat every migrated `openedAt` as untrusted (**Q-11**) |
| **S-2** | A happened-at for "resolved" from the live UI | Not in this store. UNBLOCK writes a `PHASE_UNBLOCKED` audit entry (`:32608`) — the notes/audit class, Ship 3 | ⛔ The blockers adapter never reads `phantom_deploy_audit_v1` (handoff §4 scope) |
| **S-3** | `phase.status`, `phase.blockerId`, `phase.blockedAt`, `phase.blockerNote` — to reconcile store vs phase | They live in `phantom_deploy_phases_v1`, the phases adapter's store | ⛔ No cross-store read, not even to "fix" the Q-10 disagreement |
| **S-4** | A per-record site id | The record has none (E-1b) | The adapter ignores its `siteId` argument (I-5). Informational, not a blocker |
| **S-5** | A human rack name (`s1:001`) for a blocker | Racks store — outside the Tier-A refresh; Ship 1 Q-2 ruled no racks adapter | Emit the composite only; never translate names |
| **S-6** | The description as it read when the blocker opened | Overwritten in place, no history (`:26071`) | `desc` is emitted as **current** text (I-2) |

---

## E-2 · EVERY WRITER AND EVERY READER

### E-2a · Writers

| Writer | Line | What it does | Mutates history? |
|---|---|---|---|
| `PHANTOM_BLOCKERS.create(o)` | `:25967-25982` | appends one record; `if (!this.saveAll(all)) return null;` | No — *"Never mutates an existing one."* `:25966` |
| `PHANTOM_BLOCKERS.clear(blockerId)` | `:25984-25996` | first record with that id and `!clearedAt` gets `clearedBy` + `clearedAt = Date.now()` | Closes, never deletes. ⛔ **Unreachable from the UI** (E-2b) |
| `PHANTOM_BLOCKERS.migrate()` | `:26002-26034` | adopts every phase with `status === 'blocked'` and no `blockerId`; writes the record, then `deploy_saveAllPhases(phases)` with `blockerId` linked back `:26021`, `:26026` | Appends; may stamp a **fabricated** `openedAt` (E-2d) |
| `PHANTOM_BLOCKERS.saveAll(list)` | `:25956` | rewrites the whole array | Whole-array rewrite |
| `blocker_save(deployId, rackId, phaseId, note)` | `:26038-26099` | **road 1** — see E-2c | ⛔ **Yes: rewrites `desc` in place** `:26071` |
| backup restore | `:56919-56927` | `bundle.keys` passthrough: `_writes.push([k, v])` for every string value not already staged | Replaces the array verbatim, no shape check |
| `deploy_purgeHeavyData` (deployment delete) | `:42643-42670` | purges racks, phases, optics, audit, handoffs, recents — **not blockers** | No — orphans remain (L-1) |

**Blockers are created in-app, never from the Master.** `PHANTOM_BLOCKERS.create(` has exactly one caller, `:26054` inside `blocker_save`; `migrate()` reads only `DEPLOY_PHASES_KEY` `:26004`; nothing in the Master path references the key. The only other ways records arrive are the boot adoption and a restore.

### E-2b · `clearedAt` has no live writer

```
:31586      try { if (typeof PHANTOM_BLOCKERS !== 'undefined') PHANTOM_BLOCKERS.clear(step.blockerId); } catch (_) {}
```
That line is inside `PHANTOM_PHASE_MODEL.transition` (`:31565` `transition: function(rackId, stepId, next, meta) {`). A search for `.transition(` in `dct-ios.html` returns **no call site** — the Ship 1 Phase 0 finding (§3b, *"`transition` has ZERO call sites"*) still holds at `.592`. A search for `.clear(` excluding storage APIs returns only `:31586`.

The two controls a technician uses to resolve a blocker:
```
:42209  … onclick="deploy_advancePhase(\'' + ph.id + '\',\'in_progress\',\'' + deployId + '\');' + _refresh + '">' + _ico.refresh('#5cf2ff', 12) + ' UNBLOCK</button>';
:32329  html += '<div class="ta-foot"><button class="ta-foot-btn ta-foot-fix" onclick="ta_resolveUnblock()">✓ THIS FIXED IT — UNBLOCK</button></div>';
:32371      deploy_advancePhase(ctx.phaseId, 'in_progress', ctx.deployId);
```
`deploy_advancePhase` (`:32546-32618`) writes `status`, and `signedOffAt`/`signedOffBy` on complete (`:32571-32576`), the rack's `currentPhase` cache, the deployment's `updated`, and one audit entry (`:32607-32613`). **It never references `PHANTOM_BLOCKERS` and never clears `phase.blockerId`.**

⛔ **What this means:** spec 12 (*"clearing records WHO cleared it and WHEN"*) and spec 13 (*"clearing a block returns the step to IN_PROGRESS and CLOSES the record"*) prove `clear()` only through direct calls and the dead state machine. On a device, `clearedAt` stays `null` for every record ever opened. `docs/A2-SHIP1-PHASE0-EVIDENCE.md` §3a's *"`PHANTOM_BLOCKERS` already carries `openedAt`/`clearedAt` for the same moment"* is true of `openedAt` only (L-4).

### E-2c · `blocker_save` — road 1, and what it overwrites

```
:26047    var wasBlocked = all[idx].status === 'blocked';
:26048    all[idx].blockerNote = note;
:26049    all[idx].blockedAt   = Date.now();
:26053    if (!all[idx].blockerId) {
:26054      var _bid = PHANTOM_BLOCKERS.create({
:26055        rack: rackId, phaseId: phaseId, deploymentId: deployId, desc: note
:26063        deploy_logAudit(deployId, 'BLOCKER_OPENED', 'phase', phaseId, note || 'Blocker opened',
:26066    } else {
:26067      // Updating the description of an open record — the record keeps its identity.
:26070        if (_list[_j] && _list[_j].blockerId === all[idx].blockerId && !_list[_j].clearedAt) {
:26071          _list[_j].desc = String(note == null ? '' : note);
:26083      try { deploy_advancePhase(phaseId, 'blocked', deployId); } catch (e) {}
```

Limits on what can be emitted honestly:
- **One record per phase, for life.** `phase.blockerId` is set once and never nulled (E-2b), so every later save on that phase takes the `else` branch. **A second blocking episode (block → UNBLOCK → block again) re-uses the first record:** no new record, no new `openedAt`, `desc` overwritten. The timeline can show only the first opening.
- **`desc` is always current.** The note at open time is gone after any re-save (S-6).
- ⚠ If a record *were* cleared (test or restore only), a re-save on its phase finds no open match at `:26070`, creates nothing, and still blocks the phase — a blocked phase pointing at a closed record, the H5 invariant break. Unreachable from the UI today (L-6).

### E-2d · Road 2 — the phase card BLOCK button, and the boot adoption that follows it

```
:42206      html += '<button class="pt-btn pt-btn-ghost" … onclick="deploy_advancePhase(\'' + ph.id + '\',\'blocked\',\'' + deployId + '\');' + _refresh + '">' + _ico.block('#ff2d55', 12) + ' BLOCK</button>';
```
It renders on every `in_progress` phase card (`deploy_buildPhaseCards`, `:42204-42206`). It moves `status` to `'blocked'` and writes `PHASE_BLOCKED` to the audit log. **It creates no record, sets no `blockerId`, no `blockerNote`, no `blockedAt`.**

The adoption runs only inside the Master boot restore:
```
:58383  (function _phantom_master_bootRestore() {
:58387      if (!loaded) return;
:58410      try { if (typeof PHANTOM_BLOCKERS !== 'undefined') PHANTOM_BLOCKERS.migrate(); } catch (_) {}
```
On the next boot with a stored Master, `migrate()` adopts the road-2 phase. `ph.blockedAt` is absent (only `:26049` writes it), and `ph.updatedAt` **has no writer** (refresh §2: *"`updatedAt` is documented and has NO WRITER"*), so `openedAt` becomes **`Date.now()` at that boot** — the reload time, not the time of the block. The record reads `openedBy: 'Unknown (pre-v1.14.420)'` and `desc: '(no description recorded before v1.14.420)'`, although the block happened on `.592`. Refresh §3 already names the trap: *"a fallback to "now", so a migrated blocker can carry a fabricated open time. `migrated: true` marks it."* **New here: this is reachable on a device today, not only for pre-`.420` data.**

### E-2e · Readers

| Reader | Line | What it does |
|---|---|---|
| `PHANTOM_BLOCKERS.loadAll()` | `:25952` | `safeGet` — quarantines and toasts on malformed JSON. **Not for the adapter** (Q-5) |
| `.byId(id)` | `:25957` | only app caller `:31579`, inside the dead `transition` |
| `.open()` | `:25964` | **no app caller**; used by specs 12, 13, 17 |
| `blocker_save` (else branch) | `:26068` | finds the open record to rewrite `desc` |
| `migrate()` | `:26006` | reads the array to append |
| `JOBSTATE_FIELDS` *OPEN ISSUES / BLOCKERS* | `:28676-28679` | `safeGet(PHANTOM_BLOCKERS_KEY, [])`, `b.filter(function (x) { return x && !x.clearedAt; })`, **site-wide**. Feeds `jobState_snapshot` `:28784` — **AI prompt text, never rendered** |
| backup collect | `:55846-55851` | copies the raw string via the registry row `:55765` |

⭐ **No visible UI surface reads a blocker record.** Every on-screen "blocker" is derived from something else (E-3).

---

## E-3 · EVERY SURFACE THAT SHOWS A BLOCKER COUNT OR STATE

Four derivations use the word. They measure different things.

### Engine A — `deploy_countBlockers`: AI Review issues, not blocker records

```
:43259  function deploy_countBlockers(deploymentId) {
:43260    var dep = deploy_getById(deploymentId);
:43261    if (!dep || !Array.isArray(dep.reviewIssues)) return 0;
:43262    return dep.reviewIssues.filter(function(i) {
:43263      return i.triage === 'untriaged' || i.triage === 'blocking';
```
`reviewIssues` is written only by `deploy_saveReviewIssues` `:43217` (*"Stage 5: AI Review Issue Persistence"*), from an AI Review result.

| Surface | Line | Scope |
|---|---|---|
| `cmd_render` aggregate `blockerCount` | `:23519-23523` | **every** deployment |
| topbar badge `cs-tnotif-n` | `:23663` | aggregate |
| **BUILD dock badge `bn-work-n`** | `:23673-23674` | aggregate; hidden at 0 (spec 01 *"it is HIDDEN at zero"*) |
| Command stat card `BLOCKERS` | `:23599` | aggregate |
| mag strip `N BLOCKERS · TAP TO REVIEW` | `:23583-23584` | aggregate |
| assistant line `no open blockers` | `:23563` | aggregate |
| **readiness gate `No open blockers`** | `:23743` `['No open blockers', hasDeployment ? !(blockerCount > 0) : null],` | ⚠ aggregate behind an active-only gate |
| hero KPI `cs-kpi-block` | `:23909-23911` | active deployment only (`.579`) |
| NBA *Resolve N open blockers* | `:24015` | aggregate |
| `brief_generate` | `:27675` | active deployment |
| `handoff_generate` | `:31337-31338` | labelled `' unresolved AI Review blocker'` |
| `deploy_computeAggregateStats`, `deploy_showList`, `deploy_showDetail` | `:32740`, `:33233`, `:38401` | per deployment |
| **`deploy_generateReport` `summary.openBlockers`** | `:43597`, `:43623` | per deployment — pinned by spec 64: *"openBlockers is deploy_countBlockers: reviewIssues triaged untriaged\|blocking."* `expect(s.openBlockers).toBe(1);` (`64…spec.js:150-151`) |
| `nowDot_update` severity | `:54546` | active deployment |

### Engine B — `phase.status === 'blocked'`: the state a technician sets

| Surface | Line | Derivation |
|---|---|---|
| `deploy_computeRackRollup` → `isBlocked` | `:32388`, `:32401` | `else if (p.status === 'blocked') blocked++;` … `isBlocked: blocked > 0` |
| **Build *Active rack* card** | `:22327-22331` | `'Blocked — ' + note`, note = first blocked phase's `blockerNote`; `'Blocked — no note recorded.'` when none |
| Build CTA | `:22333` | `'Open blocked rack'` |
| **Build metric `Blockers`** | `:22429` ← `bw_metrics` `:21736-21740` | `if (p && p.status === 'blocked') blk++;` — this rack's blocked **phases** |
| Build rack queue tally `Blocked` | `:22606` | racks with `isBlocked` |
| Build *Active blockers* list | `:22629-22645` | racks with `isBlocked`; `'Nothing blocking this deployment.'` when none |
| **rack detail phase card badge** | `:42180` | `ph.status === 'blocked' ? 'b-red'`, label `BLOCKED` |
| rack detail phase dots / rack chips | `:42318`, `:42303` | status / `isBlocked` colour |
| rack lookup chip `BLOCKED` | `:38893`, `:38999` | `isBlocked` |
| floor tile flag | `:38697` | `f.state === 'blocked'` ← `hud_rackFill` `:32475` |
| `shiftReport_generate` *Open Blockers — Next Shift* | `:18472-18486` | `phases.filter(function(p) { return p.status === 'blocked'; })` |
| `handoff_generate` `BLOCKED:` lines | `:31335` | `isBlocked` |

### Engine C — rack-record fields that no writer sets

| Surface | Line | Derivation | Result |
|---|---|---|---|
| Command Z3 vital `BLOCKERS` | `:24284` ← `cmd_rackBlockers` `:24250-24256` | `if (Array.isArray(r.blockers)) return r.blockers.length; return r.status === 'blocked' ? 1 : 0;` | The seeded rack record (`:32501-32511`) has neither `blockers` nor `status` → **always 0** |
| blocker sheet rack picker badge | `:25830-25833` | `var blocked = r.status === 'blocked';` | never shows |
| `activeContext_get` `blockedRacks` | `:28485` | `r.status === 'blocked'` | always 0 (AI context only) |

### Engine D — the blocker records themselves

JOBSTATE only (`:28676-28679`), and it is not rendered (E-2e).

### Do they agree?

- **A vs B: different concepts; they agree only by coincidence.** A technician's blocker moves B and never moves A.
- **A vs A:** the aggregate vs active-only split is a **named DATA-HONESTY-COMMAND defect**, `docs/DATA-HONESTY-COMMAND-PHASE0-EVIDENCE.md` §1: *"the gate is answerable only for the active deployment but answers with every deployment's count"* — item 4, **READY-ACTIVE**, *"needs one-word ruling"*. Still live at `.592` (`:23743` above).
- **The word itself:** the same document §4 records the 2026-09-05 ruling *"Blockers = triaged review issues on this deployment"* (LABEL-COUNTS, parked) and the lead *"the word BLOCKERS is also painted by two other engines — Build metrics … counting phases with `status === 'blocked'` … and the Z3 vital … fed by `cmd_rackBlockers`"*. **Unfixed at `.592`.**
- **C vs B:** C reads 0 whenever B reports a blocked rack.
- **D vs B:** agree while a road-1 blocker is still blocked; disagree after any UNBLOCK (E-2b) and after any road-2 BLOCK until a reload adopts it (E-2d).

⭐ **What John compares on device:** the Build *Active rack* card, the Build `Blockers` metric, and the rack detail phase badge (Engine B). **The BUILD dock badge stays hidden and is not a FAIL** — it counts review issues, and a MASTER SCOPE deployment has none unless AI Review has run.

---

## E-4 · BLOCKER FIELDS ON THE PHASE RECORD

| Field | Writers | Readers | Cleared? |
|---|---|---|---|
| `blockerId` | `migrate` `:26021`; `blocker_save` `:26061` | `blocker_save` `:26053`, `:26070`; `migrate` `:26009` | ⛔ never |
| `blockerNote` | `blocker_save` `:26048` (every save) | Build card `:22329`, active list `:22637`, blocker sheet prefill `:25862`, troubleshoot `:32276`; `migrate` `:26015` | never |
| `blockedAt` | `blocker_save` `:26049` (every save, **including a note edit**) | `migrate` only `:26011`, `:26017` | ⛔ never; **absent after a road-2 BLOCK** |

**Census:** A.1 §2 lists them under *"// v1.14.420 additions:"* — `blockerId: STRING | null`, `blockerNote: STRING, // legacy field`, `blockedAt: NUMBER | null, // epoch ms when blocked`. Refresh §2: *"**Writers the A.1 census omits:** … `blocker_save` `:26006` (writes `blockerId`, `blockerNote`, `blockedAt`)."*

**What Ship 1's phases adapter emits for them — nothing:**
```
:31678      if (p.status === 'complete' && typeof p.signedOffAt === 'number' && isFinite(p.signedOffAt)) {
:31679        events.push({ t: p.signedOffAt, type: 'phase.completed', source: 'phases',
:31680          data: { phaseId: p.id, phaseType: p.type, signedOffBy: (p.signedOffBy == null ? null : p.signedOffBy) } });
:31684    return { events: events, facts: { phaseOrder: mine.map(function(p) { return p.type; }) }, status: 'ok' };
```
**No overlap exists today** — and none should be created.

**Which adapter should own them — recommendation: none, in A.2.**
- `blockedAt` is not a block time. It is *the last time `blocker_save` ran on this phase*, a note edit included. It is absent for road-2 blocks, and it duplicates `openedAt` for the first road-1 save. Emitting it would double-count `blocker.opened` (Ship 1 Phase 0 §3a) or mislabel an edit as a block.
- `blockerNote` duplicates the record's `desc`; both are written in the same `blocker_save` call.
- `blockerId` is a link, not an event. The blockers adapter cannot read it anyway (S-3).
- **The happened-ats for phase block and unblock live in the audit log** (`PHASE_BLOCKED` / `PHASE_UNBLOCKED` `:32608-32610`, `BLOCKER_OPENED` `:26063`, `PHASE_BLOCKER_NOTE` `:26088`) — **Ship 3's class.**
- ⚠ **Constraint to carry into Ship 3:** `BLOCKER_OPENED` and the record's `openedAt` describe the **same moment** through two separate `Date.now()` calls (`:25976` and `:31102`). If Ship 3 emits `BLOCKER_OPENED` as `blocker.opened`, the timeline double-counts. And a `PHASE_UNBLOCKED` entry is a phase event, not a blocker close, so it must never reach the `openBlockers` derivation. → **Q-17**

---

## E-5 · PROPOSED EVENT MODEL — `RR_ADAPTER_BLOCKERS`

**Reads:** `phantom_blockers_v1` only, through `_rr_readKey` (E-8). **Filter:** `b && typeof b === 'object' && b.rack === rackId` — the same shape as Ship 1's phases filter `:31670`.

### E-5a · Adapter status

| Storage state | `status` | `events` | `facts` |
|---|---|---|---|
| key absent or `''` | `empty` | `[]` | `{}` |
| valid array, no record for this rack (incl. `[]`) | `empty` | `[]` | `{}` |
| `getItem` throws | `error` + `detail` from `_rr_readKey` | `[]` | `{}` |
| malformed JSON | `error` + `detail` from `_rr_readKey` | `[]` | `{}` |
| parses, not an array | `error`, `detail: 'blocker store is not an array'` (mirrors `:31668`) | `[]` | `{}` |
| ≥ 1 matching record | `ok` | per E-5b | `{ undated: [...] }` |

### E-5b · Events, per matching record — **proposed, subject to Q-11 / Q-12**

| Event | Emitted only when | `t` | `data` (all census-documented, E-1b) |
|---|---|---|---|
| `blocker.opened` | `migrated !== true` **and** `typeof openedAt === 'number' && isFinite(openedAt)` **and** `blockerId` is a non-empty string **and** the record is not in the "unreadable clear" row below | `openedAt` | `{ blockerId, phaseId, desc, openedBy }` — values as stored (`openedBy` carried through, I-6) |
| `blocker.cleared` | `clearedAt` is truthy **and** a finite number **and** `blockerId` is a non-empty string | `clearedAt` | `{ blockerId, clearedBy }` |

### E-5c · When a timestamp is absent or untrustworthy — never assume a time

| Record condition | Events | `facts.undated` entry | Reachable how |
|---|---|---|---|
| `migrated === true` | no `blocker.opened`; `blocker.cleared` if `clearedAt` is valid | `{ blockerId, open: !b.clearedAt, reason: 'migrated — open time not trustworthy' }` | **live**: road-2 BLOCK + reload with a Master (E-2d) |
| `openedAt` missing or not a finite number | no `blocker.opened`; `blocker.cleared` if valid | `{ blockerId, open: !b.clearedAt, reason: 'openedAt is not a number' }` | restore / hand edit only (`create()` always writes one) |
| `clearedAt` present but not a truthy finite number (e.g. a string, `true`, `0`) | **none** | `{ blockerId, open: !b.clearedAt, reason: 'clearedAt is not a number' }` — `open` follows the module's own predicate `!b.clearedAt` `:25964` | restore / hand edit only |
| `blockerId` missing or empty | **none** (open/clear events could not be paired) | `{ blockerId: null, open: !b.clearedAt, reason: 'no blockerId' }` | restore / hand edit only |
| `clearedAt === null` | `blocker.opened` only (if eligible) | — | the normal open record |

**Coverage row for an `ok` read with undated records:** `detail` = *"N blocker(s) have no trustworthy time — counted, not on the timeline"*. ⚠ Today `assemble()` copies `detail` **only** for `error` rows (`:31707` `if (res.status === 'error') row.detail = …`). Showing this caveat needs a one-line assembler change (I-9, Q-11).

**Never:** a default `t`, `Date.now()` in the adapter, `t: null` in the timeline, a placeholder event for an empty store, or a `blocker.cleared` inferred from a phase leaving `blocked`.

---

## E-6 · DERIVED `status.openBlockers`

**Where:** inside `PHANTOM_RR.assemble`, beside the P6 phase derivation (`:31720` *"P6 — the current phase, derived from events here and nowhere else."*), replacing the literal at:
```
:31739      // No blockers or photos adapter is registered yet: null, not 0 — a 0 claims a count nobody took.
:31740      status: { phase: phase, openBlockers: null, photoCount: null, photoBytes: null },
```

**Definition (proposed):**
```
blockers row status error          → openBlockers = null   (no count was taken)
blockers row status empty          → openBlockers = 0      (Q-13)
blockers row status ok             → openBlockers =
    | { e.data.blockerId : e.type === 'blocker.opened' } \ { e.data.blockerId : e.type === 'blocker.cleared' } |
  + | { u ∈ facts.blockers.undated : u.open } |          (Q-11 option A)
```
Only events with `source === 'blockers'` are consulted. No phase status and no audit action enters it (S-2, S-3, Q-17).

**What changes from Ship 1:** `openBlockers` stops being `null` (A2-SHIP1-EVIDENCE §5 **I-1**: *"They become numbers in Ships 2 and 4"*). `photoCount` and `photoBytes` stay `null` until Ship 4.

**Prediction per surface.** R = readout `openBlockers`; B = Build `Blockers` metric / Active rack card / phase badge; A = `bn-work-n` and the other Engine A surfaces (no AI Review run); C = Z3 vital.

| Scenario | Reachable on device? | R | B | A | C | R vs B |
|---|---|---|---|---|---|---|
| **S1 — the handoff's "open + resolved":** one record open (its phase still blocked), one record cleared by `clear()` (its phase in progress) | ⛔ **no** — nothing in the UI writes `clearedAt`; fixture/restore only | 1 | 1 | 0 / hidden | 0 | ✅ agree |
| **S2 — road-1 block, still blocked** | ✅ | 1 | 1 (card reads `Blocked — <note>`) | 0 / hidden | 0 | ✅ agree |
| **S3 — road-1 block, then UNBLOCK** | ✅ | **1** | **0** (card not blocked) | 0 / hidden | 0 | ⛔ **disagree by construction** (Q-10) |
| **S4 — road-2 BLOCK, no reload** | ✅ | **0** (`empty`) | 1 (`Blocked — no note recorded.`) | 0 / hidden | 0 | ⛔ disagree |
| **S4′ — S4 after a reload with a Master stored** | ✅ | 1 (undated, no event) | 1 | 0 / hidden | 0 | ✅ agree on the count; the timeline shows nothing for it |
| **S5 — road-1 block, UNBLOCK, block again through the sheet** | ✅ | 1 (the **first** `openedAt`, the **new** `desc`) | 1 | 0 / hidden | 0 | ✅ agree on the count; the second opening is invisible (E-2c) |
| **S6 — two phases blocked on one rack, one through the sheet, one through the phase card** | ✅ | 1 before a reload, 2 after | 2 | 0 / hidden | 0 | disagree until a reload |

**The report engine is a trap for A.3, not for Ship 2:** `deploy_generateReport`'s `summary.openBlockers` (Engine A, pinned by spec 64) and rr-1's `status.openBlockers` (Engine D) share a name and count different things (L-5).

---

## E-7 · Q-A — THE `gaps` LIST (ruled 2026-09-17)

**The ruling:** *"The readout's coverage carries **exactly one row per registered adapter**. A data gap that belongs to no adapter — Ship 1's synthetic `rack` row … — moves to a separate **`gaps: [{ field, detail }]`** list."*

### E-7a · What Ship 1 shipped

```
:31711    // Q-2: no adapter reads a source for these in A.2. Say so in the manifest rather than leave a
:31712    // bare null that a renderer could print as "no".
:31713    coverage.push({ adapter: 'rack', status: 'empty', events: 0,
:31714      detail: 'no rack adapter in A.2: platform and masterPresent are not read, so both are null (ruling Q-2)' });
```
Readout line:
```
:31808        cov.textContent = rec.coverage.map(function(c) {
:31809          return c.adapter + ' ' + c.status + (c.status === 'ok' ? ' (' + c.events + ')' : '') + (c.detail ? ' — ' + c.detail : '');
:31810        }).join(' · ');
```

### E-7b · What the change touches — product (`dct-ios.html`, all inside the A.2 hunk)

| Line | Change |
|---|---|
| `:31694` `var coverage = [], merged = [], facts = {}, siteId = null;` | add `gaps = []` |
| `:31711-31714` | `coverage.push({ adapter: 'rack', … })` → `gaps.push({ field: 'rack', detail: '<the same string>' })`; the comment follows |
| `:31743` `coverage: coverage` | add `gaps: gaps` after it — a top-level Record key (I-8) |
| `:31798-31816` readout | coverage line unchanged; add a second line (e.g. `#rr-dev-gaps`) rendering `field — detail`; clear it in the change handler beside `:31804-31805`; append it beside `:31815` |

Nothing outside the `A.2 RACK RECORD ASSEMBLER` … `END rrdev` block moves.

### E-7c · What the change touches — spec `test/e2e/65-rack-record-assembler.spec.js`

| Line | Today | Why it moves |
|---|---|---|
| `:104` | `expect(Object.keys(rec)).toEqual(['schema', …, 'evidence', 'coverage']);` | gains `'gaps'` (Q-A) |
| `:114` | `expect(rec.status.openBlockers, 'no blockers adapter is registered in Ship 1').toBeNull();` | the seed has no blockers key → `empty` → `0` (Q-13) — **moves because of Ship 2 alone** |
| `:119-130` | `coverage.slice(0, 2)` …, `expect(rec.coverage.length).toBe(3);`, `expect(rec.coverage[2].adapter).toBe('rack');`, `…status).toBe('empty')`, `…detail).toMatch(/platform/)`, `/masterPresent/` | **`:126` breaks from Ship 2 alone** (`coverage[2]` becomes `blockers`). Under Q-A: coverage equals exactly `[identity ok 0, phases ok 3, blockers empty 0]`, and `rec.gaps` equals one `{ field: 'rack', detail }` matching both words |
| `:20-22` | header: *"status.openBlockers … are asserted NULL"* | comment update |
| `:164`, `:240` | `out.first.coverage[1]`, `rec.coverage[1].status` | **unchanged** — index 1 is still `phases` |
| `:277`, `:288` | FOLD: `[saved[0], boom, saved[1]]`, `coverage.slice(0, 3)` | still passes; recommend `[saved[0], boom, ...saved.slice(1)]` so the blockers adapter also runs after the fault |
| `:304-324` | READOUT: `toContainText('identity ok')`, `'phases ok'` | still passes; add `'blockers'` and the gaps line |

### E-7d · Rides in Ship 2, or its own ship? → **Q-14**

| Option | For | Against |
|---|---|---|
| **Ride in Ship 2** (recommended) | Spec 65's rack-row block must be rewritten by Ship 2 anyway (`:126`); one rewrite instead of two. One look covers both, and they print on **separate lines**, so a FAIL is attributable. One stamp cycle under the one-at-a-time ruling. The surface is `?rrdev=1`-only and is deleted in Ship 4 | Two changes to the readout in one version — a literal reading of P7 counts them as two |
| Own ship, before Ship 2 | Cleanest P7 | A full ship → look → verify → stamp cycle for a debug-only shape; spec 65 is edited twice; Ship 2 waits |
| Own ship, after Ship 2 | — | Ship 2 would first re-index a synthetic row that dies one ship later — churn on both sides |

---

## E-8 · THE REGISTRY AND ADAPTER CONTRACT AS SHIP 1 BUILT IT

**The raw reader (ruling Q-5):**
```
:31627  function _rr_readKey(key) {
:31628    var raw;
:31629    try { raw = localStorage.getItem(key); }
:31630    catch (e) { return { state: 'error', detail: 'storage unreadable for "' + key + '": ' + String((e && e.message) || e) }; }
:31631    if (raw === null || raw === '') return { state: 'absent' };
:31632    try { return { state: 'ok', value: JSON.parse(raw) }; }
:31633    catch (e2) { return { state: 'error', detail: 'malformed JSON in "' + key + '" (' + raw.length + ' bytes)' }; }
```
No quarantine, no toast, no write. `safeGet` is untouched. ✅ **It serves the blockers key unchanged:** `_rr_readKey(PHANTOM_BLOCKERS_KEY)`. The constant is a top-level `var` at `:25950`, in the same inline script as the assembler (`<script>` `:16928` … `</script>` `:59718`), and is assigned before `read()` can run. ⛔ The adapter must **not** call `PHANTOM_BLOCKERS.loadAll()`, `.open()` or `.byId()` — each goes through `safeGet` (`:25953`), which writes a quarantine record and toasts on malformed JSON (Ship 1 Phase 0 §2).

**The registry and the fold:**
```
:31691    registry: [RR_ADAPTER_IDENTITY, RR_ADAPTER_PHASES],
:31695      this.registry.forEach(function(ad, order) {
:31697        try { res = ad.read(siteId, rackId); }
:31698        catch (e) { res = { events: [], facts: {}, status: 'error', detail: 'adapter threw: ' + String((e && e.message) || e) }; }
:31699        if (!res || (res.status !== 'ok' && res.status !== 'empty' && res.status !== 'error')) {
:31700          res = { events: [], facts: {}, status: 'error', detail: 'adapter returned no valid status' };
:31702        // Only an ok read contributes events or facts; empty and error never do.
:31705        facts[ad.name] = (res.status === 'ok' && res.facts) ? res.facts : {};
:31706        var row = { adapter: ad.name, status: res.status, events: evs.length };
:31707        if (res.status === 'error') row.detail = String(res.detail || 'unknown error');
:31709        if (res.status === 'ok' && res.facts && res.facts.siteId !== undefined) siteId = res.facts.siteId;
:31717    merged.sort(function(a, b) { return (a.ev.t - b.ev.t) || (a.order - b.order) || (a.i - b.i); });
```

**How to register:** define `var RR_ADAPTER_BLOCKERS = { name: 'blockers', schemaHandled: 'phantom_blockers_v1 (docs/A1-CENSUS-REFRESH-TIER-A.md §3)', read: function(siteId, rackId) { … } };` between the end of `RR_ADAPTER_PHASES` (`:31686`) and `var PHANTOM_RR = {` (`:31688`), and append it to `:31691`. Registry order then puts `blockers` third, so on an equal `t` a phase event sorts before a blocker event.

⛔ **Placement trap.** The registry array is built when `var PHANTOM_RR = {…}` executes. A `var RR_ADAPTER_BLOCKERS` declared **below** that line is hoisted as `undefined`, so `registry[2]` is `undefined`. `ad.read` fails inside the `try` (`:31697`), but `facts[ad.name]` at `:31705` is **outside** it and throws — **`assemble()` itself would throw.** `node --check` cannot see this.

⛔ **Sort trap.** The comparator subtracts `t`. A non-number `t` makes it `NaN` and the order undefined — which is why E-5b emits only finite numbers.

---

## E-9 · DEVICE VERIFY FOR SHIP 2 (ruling Q-8: a Safari tab, not the icon)

**Where:** Safari → `https://phantom-staging.wfj6t2fk7w.workers.dev/dct-ios.html`, all in one tab. Confirm SYS shows the Ship 2 version first.

**Set-up:** if the Ship 1 look's TST99 deployment is still in this tab, reuse it. Otherwise: Build → **＋ NEW** → **LOAD MASTER** (`MASTER-US-TST99-TORTURE-TEST.xlsx`) → select one cab (e.g. `s1:001`) → **STAGE SCOPE SNAPSHOT** → name it → **CREATE DEPLOYMENT**.

**The controls, from source:**
- Open a blocker — Build's contextual action `['Log blocker', function() { try { blocker_quick(c.dep && c.dep.id); } …` `:22453` (also Command's `BLOCKER` verb `:14052` / `:14004`). The sheet steps are `SELECT RACK` → `BLOCKER NOTE` (`:25760-25761`); the note box is `#blocker-note-input` `:25874`; the button reads **SAVE BLOCKER** `:25878`; success toasts `'Blocker saved'` `:26092`; an empty note toasts `'Type a blocker note before saving'` `:25928`.
- Resolve — the rack detail phase card's **UNBLOCK** `:42209` (or TROUBLESHOOT → **✓ THIS FIXED IT — UNBLOCK** `:32329`).
- ⛔ **Do not use the phase card's BLOCK button** (`:42206`) for this look: it creates no record (E-2d, Q-15).

**The look:**
1. Build → **Log blocker** → pick the rack if asked → type `RR SHIP2` → **SAVE BLOCKER**. PASS: toast `Blocker saved`; the Build *Active rack* card reads `Blocked — RR SHIP2`; the `Blockers` metric reads `1`. **The BUILD dock badge stays hidden — expected** (Engine A, E-3).
2. Add `?rrdev=1`, pick the rack. **PASS:** the coverage line reads `identity ok (0) · phases ok (0) · blockers ok (1)`; a separate gaps line names `rack` (if Q-14 rides); the JSON shows `status.openBlockers: 1`, one `blocker.opened` whose `data.desc` is `RR SHIP2` and whose `data.openedBy` is your operator, and `status.phase` still `index 0 · of 5 · name "mechanical"`.
3. Reload **without** `?rrdev=1` → **Open blocked rack** → **UNBLOCK** on the blocked phase. The Build card no longer says Blocked; `Blockers` reads `0`.
4. Add `?rrdev=1` again, pick the rack. **Expected under Q-10 (a):** `status.openBlockers` **still `1`**, still one `blocker.opened`, **no** `blocker.cleared`. That is the store's truth and the recorded disagreement (S3) — not a FAIL.
5. Reload without the param: no trace of the readout.

**FAIL:** `blockers` reads `error`; `blockers` reads `empty` after step 1; `openBlockers` is `null` after step 1; any event without a numeric `t`; a `blocker.cleared` appearing after step 3 (that would mean a writer changed under this recon); `identity` or `phases` changed from Ship 1's values; any trace of the readout without the param.

⚠ **What the look cannot show:** the `blocker.cleared` path and the undated path. Neither is reachable through the UI with a clean result (E-2b, E-2d), so automation owns both (E-10).

---

## E-10 · TEST PLAN (spec 65 additions — RED first on `.592`)

**Fixture — a second seed, so Ship 1's TIMELINE expectations stay byte-identical.** `seedWithBlockers()` = `seed()` plus `phantom_blockers_v1` (stored order deliberately not by time):

| Record | Shape (every field from E-1b) | Proves |
|---|---|---|
| `B-OPEN` | `rack: RACK`, `phaseId: 'phase_' + RACK + '_network'`, `openedAt: T0 + 200`, `openedBy: 'E2E'`, `clearedBy: null`, `clearedAt: null`, `desc: 'missing optic'` | an open road-1 record → one event, counted |
| `B-CLOSED` | `rack: RACK`, `openedAt: T0 + 50`, `clearedAt: T0 + 400`, `clearedBy: 'E2E-2'` | S1 → two events, not counted |
| `B-MIG` | `rack: RACK`, `migrated: true`, `openedAt: T0 + 999999`, `openedBy: 'Unknown (pre-v1.14.420)'`, `desc: '(no description recorded before v1.14.420)'`, `clearedAt: null` | the undated path → **no** event, counted, coverage `detail` |
| `B-OTHER` | `rack: OTHER`, open | another rack never appears |
| `B-TEN` | `rack: 'rack_' + DEP + '_10'`, open | assembling `rack_<dep>_1` (OTHER) must not claim it — catches a prefix match |
| `B-EMPTY` | `rack: ''`, open | `''` matches no rack |
| `B-TIE` | `rack: RACK`, `openedAt: T0 + 300`, open | ties with two `phase.completed` at `T0 + 300` → phases sort first (registry order) |

**Tests:**
1. **BLOCKERS · TIMELINE** — `seedWithBlockers`; the timeline equals, in order: `blocker.opened` B-CLOSED (`T0+50`) · `phase.completed` power (`T0+100`) · `blocker.opened` B-OPEN (`T0+200`) · `phase.completed` mechanical · `phase.completed` compute · `blocker.opened` B-TIE (all `T0+300`) · `blocker.cleared` B-CLOSED (`T0+400`). No B-MIG, B-OTHER, B-TEN or B-EMPTY event. Payloads exactly as E-5b, `openedBy` verbatim.
2. **BLOCKERS · DERIVED** — `status.openBlockers === 3` (B-OPEN + B-TIE + B-MIG); coverage row `{ adapter: 'blockers', status: 'ok', events: 5 }` with a `detail` naming the one undated record. Assembling OTHER returns only B-OTHER's event, and `openBlockers === 1`.
3. **BLOCKERS · EMPTY** — key absent; `[]`; a store holding only other racks → row `{ adapter: 'blockers', status: 'empty', events: 0 }`, no blocker events, `openBlockers === 0` (Q-13).
4. **BLOCKERS · ERROR** — `'{not json'`; `{}` (not an array); `Storage.prototype.getItem` throwing for this key only (the Ship 1 technique, `:187-197`) → `error` with a non-empty `detail`, `openBlockers === null`, and identity + phases rows unchanged. **Error proven by seeded storage, not by damaging a live device.**
5. **BLOCKERS · PURE READ** — the Ship 1 snapshot technique (`:229-246`) with a malformed blockers key: every localStorage key and value is identical before and after `assemble()`, and no toast is added. Catches a regression to `PHANTOM_BLOCKERS.loadAll()`.
6. **GAPS (Q-A)** — `rec.coverage.map(c => c.adapter)` equals `['identity', 'phases', 'blockers']` — exactly the registry; `rec.gaps` equals one `{ field: 'rack', detail }` whose detail matches `platform` and `masterPresent`; `Object.keys(rec)` ends with `'gaps'`.
7. **READOUT** — with `?rrdev=1` and `seedWithBlockers`: `#rr-dev-cov` contains `blockers ok`; the gaps line contains `rack`; the JSON's `status.openBlockers` is a number.
8. **Existing tests edited, not weakened:** `:104`, `:114`, `:119-130` per E-7c; FOLD registry `[saved[0], boom, ...saved.slice(1)]` with the blockers row still `ok`/`empty` after the fault.

**Mutation checks to run after GREEN** (each must be caught by the named test, then reverted): (M1) emit `blocker.opened` for `migrated` records → TIMELINE; (M2) count open from events only, dropping undated → DERIVED; (M3) `b.rack.indexOf(rackId) === 0` instead of `===` → DERIVED (B-TEN); (M4) read through `PHANTOM_BLOCKERS.loadAll()` → ERROR + PURE READ; (M5) `empty` → `openBlockers: null` → EMPTY; (M6) emit `blocker.cleared` without the finite-number check → TIMELINE (add a string-`clearedAt` record if M6 survives); (M7) declare `RR_ADAPTER_BLOCKERS` below `PHANTOM_RR` → every test (E-8 trap).

**Regression, each spec alone on `phone-webkit`, as Ship 1 ran them:** `64-report-engine-characterization` (**8/8 — handoff acceptance #3; this ship must not move `summary.openBlockers`**) · `65` · `12-blockers` · `13-phase-model` · `00-boot` · `01-nav` (the badge) · `98-cmd-census` (Engine A's `blockerSeed()`) · `04-storage` (baseline 20 passed, 1 skipped).

---

## Interpretations — each is the owner's to strike

- **I-1** The brief's "resolved" is the store's `clear()`; the event is named after the store's own words, `blocker.cleared` (Q-12).
- **I-2** `blocker.opened.data.desc` is the description **now**, not at opening — a re-save rewrites it with no stamp (`:26071`; refresh §3 *"One gap"*).
- **I-3** An `empty` blockers read gives `openBlockers: 0`, not `null`. Ship 1's I-1 used `null` because no adapter owned the count; once the adapter has read the store and found nothing, 0 is a count that was actually taken (Q-13).
- **I-4** Rack matching is whole-string equality against the composite. There is no fallback through `phaseId`: no live writer produces `rack: ''` alongside a `phaseId` (`blocker_save` passes both `:26055`; `migrate` passes `ph.rackId` `:26012`).
- **I-5** The adapter ignores `siteId`: blocker records carry no site field (S-4).
- **I-6** `openedBy` and `clearedBy` pass through verbatim, `'Unknown'` and `'Unknown (pre-v1.14.420)'` included — never replaced by the current operator (Contract 9a; refresh §3).
- **I-7** The A.1 census's *"not composite; human-readable"* rack form is treated as superseded by the Tier-A refresh, whose header supersedes the A.1 sections for these five classes.
- **I-8** `gaps` is a top-level Record key after `coverage`; `schema` stays `'rr-1'`. The ruling adds the list and names no schema bump, and no renderer consumes rr-1 yet (A.3).
- **I-9** A blockers `ok` row may carry a `detail` (only if Q-11 is ruled A). Rows without a detail keep Ship 1's exact shape.
- **I-10** A matching record that is not an object, or has no usable `blockerId`, is never an `error` for the whole adapter: primitives cannot match a rack, and a keyless object is reported as undated (E-5c).

---

## Q · Rulings owed before Ship 2 builds (numbered on from Ship 1's Q-9) — ✅ ALL RULED 2026-09-17, AS RECOMMENDED (`OWNER-RULINGS.md`)

| # | Question | Evidence | Options | Recommendation | Blocks |
|---|---|---|---|---|---|
| **Q-10** | **UNBLOCK does not close the blocker record.** The only `clearedAt` writer is reachable only from the dead `transition`. On device, the readout's `openBlockers` never goes down, while the Build card and metric drop to 0 on UNBLOCK. | E-2b; E-6 S3 | **(a)** Ship 2 reports the store's truth; S3 is a recorded disagreement and the look passes if the readout matches the store; the writer defect goes to the owner as a separate lead. **(b)** Hold Ship 2 until a separate, owner-GO'd ship makes UNBLOCK call `PHANTOM_BLOCKERS.clear` — a storage-writer change, outside A.2's fences (handoff §8). **(c)** Derive openness from `phase.status` — a cross-store read (§4, S-3); **not viable** | **(a)**. It is the honest reading of the store, it is what P3/§6 ask a readout to do, and it puts the defect in front of the owner with evidence instead of hiding it | E-6 predictions; E-9 PASS line |
| **Q-11** | **Records with no trustworthy open time** — `migrated: true`, which is live via road-2 BLOCK + reload (open time = boot time), and non-numeric `openedAt` from a restore. | E-2d; S-1; E-5c | **(A)** No timeline event; counted in `openBlockers` through `facts.undated`; the coverage row carries a `detail`; the assembler passes `detail` through on `ok` rows. **(B)** Emit `blocker.opened` at the stored `openedAt` with `data.migrated: true` — keeps P6 pure, but puts a boot time into an ordered spine as if it were a happened-at. **(C)** Drop them entirely — the readout says 0 while the phase card says BLOCKED | **(A)**. It is the only option that neither invents a time nor hides a real blocker. Cost: `openBlockers` is derived from events **plus** one declared fact, a stated exception to "derived from events" | the adapter's code; the derivation; spec tests 1–2 |
| **Q-12** | **Event names.** | E-1b; `clear()` `:25984` | `blocker.opened` / `blocker.cleared` · `blocker.opened` / `blocker.resolved` | **`blocker.cleared`** — the store's own vocabulary (`clearedAt`, `clearedBy`, `clear()`). "Resolved" claims a fix the record does not claim | spec expectations |
| **Q-13** | **`openBlockers` when the adapter reads `empty`.** | Ship 1 I-1; `:31739` | `0` · `null` | **`0` for `empty`, `null` for `error`.** A count was taken and found nothing; `error` is the state in which no count exists (P3) | spec 65 `:114`; E-6 |
| **Q-14** | **Q-A: ride in Ship 2, or its own ship?** Also the shape: a top-level `gaps` after `coverage`, one entry `{ field: 'rack', detail: <Ship 1's string> }`, `schema` still `'rr-1'`. | E-7; ruling 2026-09-17 | ride in Ship 2 · own ship before · own ship after | **Ride in Ship 2**, with that shape. Spec 65's rack-row block moves in Ship 2 regardless (`:126`); two readout lines keep a FAIL attributable; one verify cycle instead of two for a surface Ship 4 deletes | the Ship 2 diff's scope |
| **Q-15** | **The phase card BLOCK button (`:42206`) writes the §6.2 invalid state** (blocked, no record), later adopted with a fabricated open time. | E-2d | report only in A.2 · open a separate defect item | **Report only in A.2** (fence: storage writers and renderers). Log it as its own lead for the owner; the Ship 2 look uses **Log blocker**, never BLOCK | E-9 steps only |
| **Q-16** | **The word "blockers" names three engines.** `bn-work-n`, Command, readiness and the report count AI Review issues; rr-1's `openBlockers` counts blocker records. | E-3; DATA-HONESTY-COMMAND §4 (2026-09-05 *"Blockers = triaged review issues on this deployment"*) | compare the readout with the Build workspace and the phase badge · compare it with the dock badge | **The Build workspace and the phase badge (Engine B).** Record that the dock badge stays hidden and is not a FAIL. Carry the name collision to A.3: no renderer may print rr-1 `openBlockers` beside `summary.openBlockers` under one word | E-9 PASS lines |
| **Q-17** | **Who owns the blocker fields on the phase record, and the audit's blocker actions?** | E-4 | no adapter in A.2 · phases adapter emits `phase.blocked` from `blockedAt` · Ship 3 emits `BLOCKER_OPENED` as `blocker.opened` | **No A.2 adapter emits `blockedAt`, `blockerNote` or `blockerId`. Ship 3 may emit `PHASE_BLOCKED` / `PHASE_UNBLOCKED` as phase events, must not emit `BLOCKER_OPENED` as `blocker.opened`, and nothing from Ship 3 enters `openBlockers`** | nothing in Ship 2 (the phases adapter stays unchanged); constrains Ship 3's Phase 0 |

---

## STOP list (P2 — fields the census does not document; do not design around them)

**S-1** the provenance of a migrated `openedAt` (the `blk_migrated_…_0` id format is undocumented — never parse it) · **S-2** any live "resolved" happened-at (it exists only in the audit log, Ship 3) · **S-3** phase status and the phase-record blocker fields (another adapter's store) · **S-5** human rack names for blockers (racks store, uncensused) · **S-6** the description at open time (overwritten, no history). *(S-4, the missing site id, is informational — the adapter ignores `siteId`.)* Details in E-1e.

## Stop conditions — Ship 2 is unsafe to write as specified if any of these holds

1. **Q-10 is unruled.** The handoff's *"blocker count … must match what the app's existing surfaces show"* cannot hold after an UNBLOCK, by construction; no honest PASS line can be written until the owner says which truth the readout shows.
2. **Q-11 is unruled.** The adapter cannot be written without either laundering a possibly fabricated time into the spine or silently dropping a real blocker.
3. **Any design reads phases or audit from the blockers adapter** to "fix" Q-10 or Q-11 — a scope violation (handoff §4), automatic reviewer FAIL.
4. **The verify plan compares the readout with `bn-work-n`**, Command, or the report's `openBlockers` — a guaranteed false FAIL (E-3).
5. **The adapter reads through `PHANTOM_BLOCKERS.*`** — a quarantine write and a toast from inside assembly (ruling Q-5).
6. **`RR_ADAPTER_BLOCKERS` is declared below `var PHANTOM_RR`** — `assemble()` throws (E-8).
7. **Any Ship 2 edit touches `blocker_save`, `deploy_advancePhase`, `PHANTOM_BLOCKERS`, the BLOCK/UNBLOCK buttons or `deploy_countBlockers`** — storage writers and renderers are fenced (handoff §8); the defects in Q-10/Q-15 are reported, not fixed here.

---

## Leads — found, not worked (findings notes are leads, not tasking)

- **L-1** `deploy_purgeHeavyData` (`:42643`) does not purge `phantom_blockers_v1`. A deleted deployment leaves its blocker records behind, and JOBSTATE's site-wide *"open blockers"* keeps counting them.
- **L-2** `cmd_rackBlockers` (`:24250`), the blocker-sheet picker badge (`:25830`) and `activeContext_get`'s `blockedRacks` (`:28485`) read `r.status` / `r.blockers` on rack records the seeder never gives those fields (`:32501-32511`) — the Z3 `BLOCKERS` vital is a permanent 0. `cmd_rackBlockers` also compares `(r.rackId || r.id)` with an elevation id, a second identity question.
- **L-3** A.1 census corrections for this class: H5's *"Blocker has status='open'/'resolved'"* — no such field exists; *"WRITTEN NEVER READ: clearedBy/clearedAt unused by readers (only displayed)"* — `clearedAt` is read by `open()` and JOBSTATE, displayed nowhere, and written by no live path; *"blocker_save() … Creates blockerId if phase.status='blocked' and no blockerId exists"* — it creates on **no `blockerId`**, whatever the status.
- **L-4** `docs/A2-SHIP1-PHASE0-EVIDENCE.md` §3a and `docs/A2-ASSEMBLER-RECON.md` §1a both treat `clearedAt` as a live happened-at. Neither connects it to the dead `transition`. Left as written history.
- **L-5** Spec 64 pins `summary.openBlockers` as the review-issue count (`:150-151`). rr-1 uses the same name for a different quantity — an A.3 renderer trap.
- **L-6** If a record is ever cleared (a test, a restore, or a future UNBLOCK fix), re-blocking its phase through the sheet creates nothing (`:26066-26075` finds no open match) and still blocks the phase. **Any future fix for Q-10 must also null `phase.blockerId` on clear**, or it creates the H5 state.

---

## Bounds

Source reading of `dct-ios.html` at `.592`, plus specs `12`, `13`, `64`, `65`, `01` (nav badge block), `98` (`blockerSeed`), `test/e2e/fixtures.js` (`boot`), the two A.1 census documents, the A.2 recon, both Ship 1 evidence documents, `docs/DATA-HONESTY-COMMAND-PHASE0-EVIDENCE.md`, `OWNER-RULINGS.md` (top three A.2-relevant entries), `CLAUDE.md` and `PHANTOM_CURRENT_STATE.md` (search only). **Nothing was executed against the app — no Playwright, no e2e, no browser, no network — no storage was inspected on a device, and no adapter, spec or product line was written.** Reachability claims (*"no call site"*, *"no live writer"*) are text searches of the single file and can be defeated only by dynamic dispatch, which searches for `PHANTOM_PHASE_MODEL[` (0 hits) and for a quoted `'transition'` member access (0 hits) also did not find. The iOS Safari-tab storage context is Ship 1 Phase 0 §5's statement, not re-measured. Not reviewed by `storage-archaeologist`, `adapter-reviewer` or `data-honesty-auditor` — none is dispatchable from a Claude Code session (`docs/A1-CENSUS-REFRESH-TIER-A.md` §0); the rulings in this document's Q table are the owner's.

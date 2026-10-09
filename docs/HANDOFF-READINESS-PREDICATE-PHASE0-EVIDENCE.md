# HANDOFF READINESS PREDICATE — PHASE 0 EVIDENCE (recon only; no patch)

**Written:** 2026-09-13 · **Against:** `FIX-HANDOFF-READINESS-PREDICATE.md` (`Downloads`, 4,400 bytes, `sha256 48cd5bd11229f8c7…`, 2026-09-13), Finding 3 / P1.
**Mode:** EVIDENCE ONLY. No source edited, no version bump, no patch. Per the spec's Process step 1 — *"No patch until the recon lands and is ruled on."*
**Baseline:** `dct-ios.html` on `main` at **`v1.14.589`**, 60,582 lines (`:12879`) — `VERIFIED` = `release` = served, working tree clean.

---

## Headline

⭐ **The gate is worse than the spec describes, and also easier to fix than it looks.**

`phantom_handoff_v1` **only ever contains SAVED handoffs.** `handoff_generate` `:31224` returns a draft into an in-memory variable `_handoffDraft` `:42379`; nothing reaches storage until `handoff_saveRecord` `:42449` sets `status = 'saved'` `:42463` and `savedAt` `:42464` and unshifts `:42467`. **So a gate labelled "Handoff started" is actually reading "a handoff was COMPLETED — for any deployment, at any point in history."** The label and the data disagree in both directions: it says *started* over a store of only *finished* records, and it implies *this shift, this deployment* over a store that is global and append-forever.

⭐ **And the predicate the fix needs is already half-built and shipping:** `handoff_loadForDeployment(deploymentId)` `:31215-31217` filters by `h.deploymentId === deploymentId` — exactly the spec's requirement *"filtered to the active deployment by identifier, not by position in the list."*

---

## E-1 · The expression, and every consumer of its result

**The expression is where the spec says, verbatim**, inside `cmd_render()` `:23479`, under a comment reading *"── honest reads (all guarded) ──"* `:23482`:

```
:23495   var handoffDraft = false;
:23496   try { var hraw = localStorage.getItem('phantom_handoff_v1'); handoffDraft = !!(hraw && JSON.parse(hraw)); } catch (_) {}
```

⚠ It is computed **once** and fans out to **six** surfaces — the spec anticipates `cs_renderReady()` *"and anything else"*; this is the anything else:

| # | Consumer | Line | What it asserts |
|---|---|---|---|
| 1 | shift-end sub-message | `:23532` | *"A handoff draft is open — finish it before shift end."* |
| 2 | `cmd_nba(rung, {…handoffDraft…})` | `:23576` → `:23976` | *"Finish your shift handoff."* / **GO TO HANDOFF** |
| 3 | signal row | `:23584` | *"Handoff waiting for summary"* · *"Draft open — finish before shift end"* · **DRAFT** |
| 4 | `cmd_telemetry` | `:23593` → `:23930`, used `:23956` | telemetry line |
| 5 | `cs_renderDesktop` → `cs_renderReady` | `:23595` → `:23610` → `:23666` → `:23683` | **the gate** `:23712` `['Handoff started', !!handoffDraft]` |
| 6 | ring / count text | `:23717-23720`, `:23734` | *"N of 4 ready — clear to hand off."* |

⛔ **Three of the six make an ASSERTIVE claim, not a gate reading** (#1, #2, #3): they tell the technician a draft *is open* and to go finish it. On a `[]` store, or on a foreign-deployment record, those strings are wrong in the same way the gate is — **and they are wrong more loudly.** One predicate fix corrects all six at once. ⚠ **That is more than one visible change**, and the ship note should say so rather than let it read as scope creep.

**Precision on the "clear to hand off" claim.** `:23734` prints it only when `met === answerable.length && !indet`. `indet` is 0 only when a deployment exists (otherwise the blockers gate is `null` `:23711`). **So the false "clear to hand off" requires: an active deployment + site profile confirmed + Master loaded + zero blockers + any parseable handoff value.** The spec's headline is correct; the repro is narrower than "when the other gates pass", and acceptance case 4 needs that full state to be meaningful.

⛔ **`.577` ALREADY EXAMINED THIS EXACT GATE AND PASSED IT.** `:23704-23707`, verbatim:

> *"⚠ ONLY THIS GATE CHANGES, and the asymmetry is the point rather than an oversight. `Handoff started` is also false with no deployment, but false is HONEST there: the shift genuinely has not been handed off. Only the blockers gate was claiming a PASS it had not earned."*

⭐ **That is not a contradiction, it is a gap, and the distinction matters for the ruling.** `.577` tested the gate on ONE axis — *what does it read with no deployment* — and on that axis it is right: with no deployment the key is usually absent and the gate reads false. It never examined the three cases this finding names (`[]` parseable, foreign deployment, stale record), all of which need a *populated* key. ⛔ **Nobody should cite `.577` to refuse this fix, and nobody should read this fix as re-litigating a settled ruling.**

---

## E-2 · The writer, and the record shape

**Canonical accessors** — `HANDOFF_KEY = 'phantom_handoff_v1'` `:25289`:

| Function | Line | Note |
|---|---|---|
| `handoff_loadAll()` | `:31209` | `safeGet(HANDOFF_KEY, [])` — array-always |
| `handoff_save(arr)` | `:31212` | `safeStore(…, JSON.stringify(arr))` |
| **`handoff_loadForDeployment(id)`** | **`:31215`** | ⭐ **already filters `h.deploymentId === id`** |
| `handoff_purge(id)` | `:31218` | removes one deployment's records |
| `handoff_generate(id)` | `:31224` | builds a draft — **does not write** |
| `handoff_saveRecord(id)` | `:42449` | ⭐ **the ONLY writer of a record** |

⛔ **`:23496` uses none of them.** It reads `localStorage.getItem('phantom_handoff_v1')` with a raw string literal and its own `JSON.parse`, bypassing both `HANDOFF_KEY` `:25289` and `handoff_loadAll()` `:31209`.

**The stored record** (`handoff_generate` return, `:31275-31294`, as amended by `handoff_saveRecord` `:42460-42464`):

| Field | Line | Usable for the predicate? |
|---|---|---|
| `id` | `:31276` | `hoff_<ts>_<rand>` |
| **`deploymentId`** | **`:31277`** | ✅ **the deployment identifier EXISTS — nothing needs inventing** |
| `deploymentName` | `:31278` | display |
| **`generatedAt: Date.now()`** | **`:31279`** | ✅ **epoch ms — sortable, already used for ordering at `:42489`, `:56765`** |
| `shiftDate` | `:31280` | ⛔ `toLocaleDateString(…)` — a **locale display string**, not parseable. Do not use for staleness. |
| `outgoingTech` / `incomingTech` | `:31281`, `:42460-42461` | display |
| `status` | `:31282` → `:42463` | written `'unread'`, **overwritten to `'saved'` before every storage write** |
| **`savedAt: Date.now()`** | **`:42464`** | ✅ **epoch ms — added only on save; marks actual completion** |
| `autoSummary` / `notes` / `completedItems` / `openItems` / `watchItems` / `opticSnapshot` / `phaseProgress` / `shiftEventCount` | `:31283-31293` | content |

⭐ **Answer to the spec's "if the stored record has no deployment identifier, that is a finding":** it has one (`:31277`), plus **two** real epoch-ms timestamps (`:31279` generated, `:42464` saved). **No schema change is required and none should be made.**

⭐ **The 12-hour window already exists in code**, exactly as the spec hoped — but as a **function-local const**, not a shared one:

```
:31237   var SHIFT_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours
:31238   var cutoff = Date.now() - SHIFT_WINDOW_MS;
```

⚠ Reusing it means either lifting it to a shared constant or restating the number. Restating it puts the same magic number in two places that must agree — the thing Contract A2 exists to prevent.

⛔ **Nothing purges handoffs at shift end, and there is no cap.** `handoff_purge` `:31218` has exactly one caller — the **deployment-delete** path `:42349`, beside `deploy_purgeAudit` `:42346`. **The array grows forever**, so a handoff saved months ago still satisfies the gate today. The staleness case is real and unbounded.

⚠ **The restore path writes the key wholesale** — `:56594` `_writes.push(['phantom_handoff_v1', JSON.stringify(cleanHandoff)])`. After a restore from an old backup, the gate passes immediately on historical records. The fix's deployment + window filter closes this incidentally; worth stating so it is not later mistaken for a restore defect.

---

## E-3 · Does a current-shift concept exist?

✅ **Yes — but it is an END marker, it is optional, and it is unset by default.**

```
:24463   var SHIFT_END_KEY = 'phantom_shift_end';
:24464   var SHIFT_ENDED_GRACE_MS = 2 * 60 * 60 * 1000;
:24481   return safeStore(SHIFT_END_KEY, JSON.stringify({ end: endMs, setAt: Date.now() }));
```

`shift_state()` `:24484` returns one of three kinds — `{kind:'unset'}`, `{kind:'countdown', ms, end}`, `{kind:'ended', end}` — with a 2-hour grace `:24489` so a night shift crosses midnight without being flagged stale. Set via `shift_setPreset` `:24586` / `shift_setCustom` `:24597`, cleared by `shift_clear` `:24608`.

⭐ **`setAt` `:24481` is a genuine work-period START** — the moment the technician declared this shift. That is a real boundary, better than a rolling window, for any device that has one.

⛔ **But `{kind:'unset'}` is the default and the common case.** A technician who never taps SET SHIFT END has no shift concept at all, so a predicate that depends on it **fails open for most devices** — the exact failure mode this fix exists to remove.

**So, precisely, for the spec's staleness question:** shift boundaries are **not** "only implied by the rolling 12-hour handoff window" — a real, explicit, user-set boundary exists at `:24463-24484`, it is just optional. That makes the ruling a three-way choice rather than the two-way one the spec assumes. See Q-1 below.

---

## E-4 · Blast radius on the existing suite

⛔ **`test/e2e/98-cmd-census.spec.js:185` WILL GO RED, and it is not a flake.** It seeds:

```js
localStorage.setItem('phantom_handoff_v1', JSON.stringify({ open: true, summary: '' }));
```

An **object**, not an array, with neither `deploymentId` nor any timestamp — a shape `handoff_generate` has never produced. **It works today only because the predicate is `!!JSON.parse(…)`.** Its comment `:178-184` shows the intent: drive `cmd_nba` to the GO TO HANDOFF branch so the NBA and the headline disagree, which is that test's actual subject. ⭐ **The intent survives the fix** by seeding a real record — `{deploymentId: <the seeded deployment>, generatedAt: Date.now(), status: 'saved'}` — and the seed must be updated **in the same ship**.

✅ `test/e2e/53-restore-reload-honesty.spec.js:91` seeds `'phantom_handoff_v1': '[]'` but makes **no readiness assertion** (zero hits for `cs-ready` / `cs-ringn` / `Handoff`). No impact.

⭐ **A readiness harness already exists to build the new spec on:** `readiness(page)` `98-cmd-census.spec.js:431` returns per-row `{label, val, warn}` plus ring and count; `dots(page)` `:500` asserts dot colour and glow — written because `.577`'s first cut *"checked text and class; the lie was in a colour"* (`:495-499`). **The four acceptance cases should assert through both**, or case 4 can pass on text while the dot still reads green.

⚠ No spec currently asserts the `Handoff started` row's value in any state, so there is **no existing pin to break** beyond the seed above.

---

## E-5 · One question the fix cannot answer for itself

⛔ **There are two resolvers for "which deployment is active", and they can disagree** — recorded in `PHANTOM-BOARD-NEXT-OPS-v2.md` (Q-1) as the likely cause of the 0-vs-60 rack split. `cmd_render` takes its `activeDep` from **`nowtab_resolveDep()`** `:23493`, not `deploy_getActiveId()`. The fix's *"filter to the active deployment by identifier"* therefore inherits whichever resolver it reads.

⭐ **Using the `activeDep` already in scope at `:23493` is the conservative choice** — the gate then agrees with the rest of the card it sits on, rather than introducing a third answer. **Stated, not decided.**

---

## Questions for the ruling

- **Q-1 · The staleness window.** Three options, not two: **(a)** reuse the 12-hour window at `:31237`, lifted to a shared constant; **(b)** use `shift_state()` `:24484` / `setAt` `:24481` when a shift is set and **fall back** to (a) when it is `unset`; **(c)** (a) only, and log real shift boundaries as future work per the review's section C. ⚠ **(b) is the honest answer and the more complex one** — it also makes the gate's meaning vary by device, which may be worse than a uniform rule.
- **Q-2 · Which timestamp.** `generatedAt` `:31279` (when the summary was built) or `savedAt` `:42464` (when the technician committed it)? They differ by however long the form was open. **`savedAt` is the one that means "handoff work happened"**, but it exists only on records written by `:42449` — a restored or hand-seeded record may lack it, so the predicate needs a stated order of preference, not a silent `||`.
- **Q-3 · Does the label move?** The spec says keep *"Handoff started"* and not expand into draft/reviewed/accepted — agreed and in scope. ⚠ **But the store holds only SAVED handoffs**, so the honest label for what is measured is nearer *"Handoff saved"*. A one-word label change is not the state-machine expansion the spec rules out. **Owner's call; not done.**

---

## Bounds

Source reading only, on `main` at `.589`, plus `test/e2e/98-cmd-census.spec.js` and `53-restore-reload-honesty.spec.js`. **Nothing was executed, no storage was inspected on a device, no patch was written, and no fix shape is proposed beyond reporting what the code makes possible.** Every line cite re-anchored by verbatim string against this baseline.

---

## Q · Found, not worked (Hard Stop Rule — one line each, leads not tasking)

- `:32865` the **HANDOFF WAITING** banner filters `h.status === 'saved'` with **no deployment filter and no time filter** — the same defect class as this finding, on a louder surface.
- `:27641` filters by deployment but not by time — same family, half-guarded.
- `status: 'unread'` `:31282` is **dead in storage**: `:42463` overwrites it to `'saved'` before every write, so both `status === 'saved'` filters (`:27641`, `:32865`) match every record and are no-ops.
- `:23496` bypasses `HANDOFF_KEY` `:25289` and `handoff_loadAll()` `:31209` with a raw string literal and its own parse.
- `shiftDate` `:31280` is a locale display string in a record whose other two timestamps are epoch ms — the mixed-format hazard `docs/A2-ASSEMBLER-RECON.md` §2 tabulates.
- `phantom_handoff_v1` has **no cap and no eviction**; the audit log next to it caps at 2,000 `:31079`.
- The `:23482` comment *"honest reads (all guarded)"* describes guarding against a **throw**, not against a wrong answer — the whole subject of this finding sits directly under it.

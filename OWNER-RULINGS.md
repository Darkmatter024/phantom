# OWNER-RULINGS.md

Dated register of owner rulings. **`CLAUDE.md` carries the standing law; this file is the record of
the rulings that changed it.** Where the two disagree, the newest ruling here wins and `CLAUDE.md`
is stale until edited. Newest first.

---

## 2026-09-17 · A.2 SHIP 2 — Q-10 … Q-17 RULED AS RECOMMENDED. The readout reports the blockers store's truth; the writer defects are leads, not A.2 work.

Owner, verbatim, against the Q table of `docs/A2-SHIP2-PHASE0-EVIDENCE.md`: ***"Q-10 to Q-17 as recommended"***. Recorded on first statement. Each line below is that table's recommendation, now law for Ship 2; the evidence for each is in that document, not repeated here.

- **Q-10 — the readout shows what the store holds.** UNBLOCK and "THIS FIXED IT" change only the phase status; the only `clearedAt` writer (`PHANTOM_BLOCKERS.clear`, `dct-ios.html:31586`) is reachable only from `PHANTOM_PHASE_MODEL.transition` (`:31565`), which nothing calls. So after an UNBLOCK the readout's `openBlockers` stays up while the Build card drops, **by construction**. That disagreement is **recorded, not a FAIL**, and the look passes when the readout matches the store. ⛔ The writer defect (UNBLOCK never closes the record) is the owner's to schedule as its own ship; it is **not** fixed inside A.2 (handoff §8). Whoever fixes it must also null `phase.blockerId` on clear (lead L-6).
- **Q-11 — records with no trustworthy open time** (`migrated: true`, or a non-numeric `openedAt`) emit **no timeline event**. They are counted in `openBlockers` through `facts.undated`, and the blockers coverage row carries a `detail` saying so; the assembler passes `detail` through on `ok` rows. ⚠ Accepted cost: `openBlockers` is derived from events **plus one declared fact**, a stated exception to P6.
- **Q-12 — event names are `blocker.opened` / `blocker.cleared`**, the store's own vocabulary. "Resolved" is not used.
- **Q-13 — `status.openBlockers` is `0` when the blockers adapter reads `empty`, and `null` when it reads `error`.**
- **Q-14 — Q-A rides in Ship 2.** A top-level `gaps` list follows `coverage`, with one entry `{ field: 'rack', detail: <Ship 1's existing string> }`. `schema` stays `'rr-1'`.
- **Q-15 — the phase card BLOCK button (`:42206`) writes the invalid "blocked, no record" state.** In A.2 it is **report only**, and it is carried as its own lead. The Ship 2 look uses **Log blocker**, never BLOCK.
- **Q-16 — the look compares the readout with the Build workspace and the phase badge.** The dock badge, Command, the readiness gate and the report count AI Review issues (`deploy_countBlockers`), a different quantity; the dock badge staying hidden is **not** a FAIL. The name clash goes to A.3: no renderer may print rr-1 `openBlockers` beside `summary.openBlockers` under one word.
- **Q-17 — no A.2 adapter emits the phase record's `blockedAt`, `blockerNote` or `blockerId`.** Ship 3 may emit `PHASE_BLOCKED` / `PHASE_UNBLOCKED` as phase events, **must not** emit `BLOCKER_OPENED` as `blocker.opened`, and nothing from Ship 3 enters `openBlockers`.

⛔ **WHAT THESE RULINGS DO NOT DO.** They do not authorise any edit to a storage writer or renderer (`blocker_save`, `deploy_advancePhase`, `PHANTOM_BLOCKERS`, the BLOCK/UNBLOCK buttons, `deploy_countBlockers`). The evidence document's STOP list (S-1 … S-6) and stop conditions stand.

---

## 2026-09-17 · A.2 SHIPS 2–4 — Q-A RULED: data gaps move to their own list. Ships 2, 3 and 4 verify one at a time.

The owner answered in session, choosing between the options put to him: Q-A → ***"Separate gaps list"***; verify plan → ***"One at a time"***. Both were the recommended options. Recorded on first statement.

**RULING 1 — Q-A (owed before Ship 2, `docs/A2-SHIP1-EVIDENCE.md` §Q).** The readout's coverage carries **exactly one row per registered adapter**. A data gap that belongs to no adapter — Ship 1's synthetic `rack` row, which reads `rack empty — …` — moves to a separate **`gaps: [{ field, detail }]`** list. The shape as it was shown to the owner (the detail text there was illustrative; the real strings are the ones Ship 1 already emits):

```
coverage: identity ok (0) · phases ok (0) · blockers ok (2)
gaps:     [{ field: "rack", detail: "empty — no devices" }]
```

⚠ This changes a shape Ship 1 already shipped, so spec `65`'s coverage assertions change with it. Whether it rides in Ship 2 with the blockers adapter, or needs its own ship to keep one visible change per ship, is Ship 2's Phase 0 call, and is reported before any patch.

**RULING 2 — VERIFY PLAN.** Ships 2, 3 and 4 ship and are verified **one at a time**: Ship 2 → device look in the readout → stamp → Ship 3 → look → stamp → Ship 4 → look → stamp. The handoff (§5) allowed BATCH-OODA for Ships 2–4 only on the owner's GO; this is the answer, and batching does not apply to this slice. The reason given with the question: Ship 4 removes the `?rrdev=1` readout, which is the surface every adapter is verified on.

⛔ **WHAT THESE RULINGS DO NOT DO.** They answer the two questions Ship 2 was waiting on; they do not cut a version. Ship 2 starts with its Phase 0 recon against the verified `.592` source, per the handoff.

---

## 2026-09-15 · FORGE DETAIL PAGER — PREV/NEXT WALK THE ROW. Supersedes the unrecorded 2026-09-14 "label the counts". The pager fix ships before A.2 Ship 1.

Owner, verbatim, reporting the defect on staging: ***"Fix it, add a quick check that NEXT enables on c1:005, and tell me what the root cause was."*** Then, on the fix and the ship order: ***"pager fix ships first, record the ruling"***. Recorded on first statement.

**THE DEFECT.** The Forge detail panel read `ROW C1 · POS 5/18 · 0/9 RACKED` with NEXT disabled. POS counts the row (`rowOf()` → `ROWS[row]`); PREV/NEXT indexed `LOADOUT`, the five-rack 3D bench (`setLoadout`'s `.slice(0, 5)`, Contract A6). The default bench is the Master's first five racks, so `c1:005` was the last bench slot and NEXT dimmed. Not a racked-count gate, not a sort mismatch. Evidence: `docs/RACK-PAGER-NEXT-PHASE0-EVIDENCE.md` §1–§2 and §10.

**RULING 1 — PREV/NEXT walk the row the header counts.** At `POS n/18`, NEXT is disabled only at 18/18 and PREV only at 1/18. When the neighbour is not on the bench, the bench moves to a five-rack window of that row and lands on it — still five live racks (A6), never an enabled control that does nothing (Contract 14).
⛔ **This SUPERSEDES the "OWNER RULING 2026-09-14: A — label the counts" in that Phase 0 document's §9.** That ruling was never entered in this register; it existed only in an untracked evidence file. Its A1 `BENCH 5/5` meta-string ship is not built. With the pager walking the row, POS and NEXT describe one list.

**RULING 2 — SHIP ORDER.** The pager fix takes the next version (`.591`). A.2 Ship 1 (`a2/ship1-assembler` @ `f0466da`) follows it and is re-based onto `main` when it ships.

⚠ **NOT AN OWNER RULING — an implementation choice under Contract 11, recorded so it can be struck.** `setLoadout` saves the bench to `deploy_forge_loadout_v1`, the backup registry's *"hand-built rack layout"*. `phantom-rd-reviewer` returned CHANGES-REQUESTED because the first cut of the walk overwrote it on an ordinary NEXT tap. The shipped behaviour: **a bench moved by walking is NOT saved**; only an explicit bench build (the picker's Apply, the boot restore) saves. ⭐ **And the loadout picker opens on the SAVED bench, not the walked one** — the re-review found that seeding it from the live bench let an untouched APPLY save the walked window over the hand-built one, one screen later. Both are pinned by `test/e2e/66-forge-pager-row-walk.spec.js`. Consequence the tech can see: reopening the aisle after walking restores the hand-picked bench, not the row window last walked to. If the owner wants the walked window remembered instead, that is a one-line change and a new ruling.

---

## 2026-09-15 · A.2 SHIP 1 — Q-1 … Q-9 RULED AS RECOMMENDED. Ruling 2 of 2026-09-14 is AMENDED: the assembler does NOT extend `deploy_generateReport`

Owner, verbatim, against the Q table of `docs/A2-SHIP1-PHASE0-EVIDENCE.md`: ***"Q-1 through Q-9 approved as recommended"***. Recorded on first statement. Each line below is that table's recommendation, now law for the A.2 slice (`docs/SHIP-HANDOFF-A2-ASSEMBLER.md`); the evidence for each is in that document, not repeated here.

- **Q-1 — ENGINE PLACEMENT. ⛔ RULING 2 (2026-09-14) IS AMENDED.** A.2 builds the assembler core and registry **as the handoff specifies**, beside `deploy_generateReport`, and **does not touch it** (handoff §1, §8). The words *"A.2 EXTENDS deploy_generateReport"* are **struck**. ⭐ **What survives from Ruling 2 unchanged:** that engine's output must not change, and `test/e2e/64-report-engine-characterization.spec.js` staying green is the proof (handoff acceptance #3). ⚠ **The cost, accepted knowingly:** two code paths fold phases and audit until **A.3** decides whether the report engine renders from Rack Records. That is the point at which Contract A2's one-engine question is settled — not before, and not by A.2.
- **Q-2 — `rack.platform` and `rack.masterPresent` emit `null`**, each with a coverage `detail` saying why. Never `true`, never a guess. **No racks adapter in A.2.**
- **Q-3 — identity and phases are TWO adapters**, both in Ship 1. Ship 1 stays one visible change: the dev readout.
- **Q-4 — `status.phase.of` is derived** from the rack's phase records; `null` when there are none. Never a literal.
- **Q-5 — the adapter layer owns ONE raw storage reader:** `getItem` + `JSON.parse` in a `try`, returning a state and a value, never quarantining, never toasting. ⛔ **`safeGet` is NOT modified** — it is shared by the whole file, and its quarantine behaviour is correct for the app's own readers.
- **Q-6 — `tech.identity` is the ACTOR:** `currentOperator`, strict, empty allowed. `siteLead` appears only inside `site.profile`, as stored. Neither is inferred from the other (Contract 9a).
- **Q-7 — `site.siteId` is the site profile's `id`**; `null` when absent. `facilityId` is never substituted.
- **Q-8 — the dev readout is verified in a Safari tab on the staging URL**, using `MASTER-US-TST99-TORTURE-TEST` through MASTER SCOPE → CREATE DEPLOYMENT, all in that same tab. `MASTER-US-EAST-ATL03-CRUCIBLE` is used only if the owner has it on the phone.
- **Q-9 — recorded, no Ship 1 change.** Ruling 1's *"no Master linkage is persisted anywhere"* holds for EDP deployments only: a MASTER SCOPE deployment stores the Master cab id as `rack.rackId` (`dct-ios.html:36365` at `.590`) and in `scope.selectedCabIds` (`:36413`). Whoever builds the Master bridge starts there.

⛔ **WHAT THESE RULINGS DO NOT DO.** They do not GO the handoff — its header still reads `HELD — gate is John's GO on this document`. And they do not let Ship 1 cut a version: `.590` is on `main` unstamped, and the guard refuses a `version.json` bump while `HEAD` and `VERIFIED` disagree.

---

## 2026-09-14 · FIELD REPORT / A.2 — the COMPOSITE is the canonical rack key, and the assembler EXTENDS `deploy_generateReport`

Owner, verbatim, against the two questions Phase 0 and the A.2 recon put to him: ***"composite is the key, extend deploy_generateReport"***. Both were named as owner rulings by the recon that raised them, and both are recorded here on first statement.

**RULING 1 — the canonical rack key is the synthetic composite** (`'rack_' + deployment.id + '_' + idx`, written at `dct-ios.html:32243`, stored as the rack record's `id` field). This settles the finding `docs/A2-ASSEMBLER-RECON.md` §0 called *"the single most valuable output of this recon"*: one rack carried two live identifiers, written by the same function two lines apart, and nothing joined them.

⭐ **The ruling is cheap to honour because three of the four A.2 adapters already use it**, measured at `.590` in `docs/FIELD-REPORT-PHASE0-EVIDENCE.md` §2: phases (`:32259`), blockers (via `ctx.rack.id` → `create({rack:…})`), and photos (via `photo_handleCapture(…, c.rack.id)`). The `read(siteId, rackId)` contract can now be satisfied. ⛔ **What it does NOT settle, and nobody should read it as settling:**
- **The Master bridge.** The Master keys `racksByCab` by `s1:001`; the composite is derived from the **vendor EDP parse** (`:32243` seeded from `deployment.edpParsed.racks`, `:32234`), so no Master linkage is persisted anywhere. The composite being canonical makes this a **mapping** problem rather than an identity problem — but the mapping still does not exist.
- **The photo `siteId` defect.** `:57301` derives `siteId` by splitting the rack key on a colon; a composite has no colon, so `siteId` becomes the whole key. ⛔ **Under this ruling that derivation is definitionally wrong, not merely odd.** Both readers recompute the identical split, so it is SELF-CONSISTENT and photos retrieve correctly today — **which means correcting it without a migration orphans every stored photo** against the `byRack` compound index. Contract B11. It is its own ship, with its own migration, and it is not a line change.
- **Notes/audit remains unscopable to a rack by field.** Two of 24 `deploy_logAudit` call sites pass `meta.rack`. The only contract-legal recovery is parsing the composite back out of `phase.id`, which embeds it by construction (`:32258`).

⛔ **AMENDED 2026-09-15 (entry above, Q-1): the assembler is built BESIDE `deploy_generateReport` and does not touch it. The "EXTENDS" below is struck; the compatibility constraint below it stands.**

**RULING 2 — A.2 EXTENDS `deploy_generateReport` (`dct-ios.html:43230` at `.589`; re-anchor at `.590`), it does not supersede it.** Contract A2, one canonical engine per concept. That engine already folds racks + phases + optics + audit + rollup into one structure, already sorts the audit by `ts`, already emits an `auditTrail` in the plan's own event shape (`{ts, time, actor, action, entityType, summary}`) with true ISO beside epoch ms, and already has **three** renderers — JSON export, print HTML, and close-out.

⛔ **THE COMPATIBILITY CONSTRAINT THIS CREATES, STATED NOW SO IT IS NOT DISCOVERED LATE:** those three consumers are live and reachable from four buttons. **Extending must not change what they emit.** The Rack Record is rack-scoped and the existing engine is deployment-scoped, so the extension adds a rack-scoped path beside the existing fold — it does not re-shape the existing return value. ⚠ **No spec pins any of the three today**, so nothing would catch a regression in them: a characterization test over the current JSON output is owed before the first extending edit, on the `.589`-image-input precedent where a tripwire went in before the feature.

⛔ **Neither ruling authorises a ship.** `.590` is on `main` unstamped, and the guard refuses any `version.json` bump while `HEAD` and `VERIFIED` disagree, so A.2 cannot cut a version until `.590` is adjudicated. The handoff itself is extracted by the owner from `PHANTOM-INTELLIGENCE-CORE.md`, one at a time — not written by Claude Code.

---

## 2026-09-10 · RACK POSE DRIFT — it is a REAL DEFECT and the tolerance STANDS

Owner, verbatim, against the pinned baseline: *"rack pose: it's a real defect, the tolerance stands"*. This settles the question Phase 0 put to him — defect versus over-tight test — in favour of **defect**. ⛔ The five-decimal position tolerance and the `1e-4` yaw floor in `37-locked-rack-pose.spec.js` are **not to be loosened**, and the test is **not to be re-pointed or pinned**.

**Why the ruling is right on the evidence, not merely accepted:** `settle()` does not sample mid-glide — it returns only after **two consecutive identical readings 500 ms apart**, at 5 decimal places. So the camera was seen **at rest** at `-4.69565` where canonical is `-4.7`. A resting pose 0.00435 off canonical is a pose the app actually produced, and the `.455` ruling requires it be solved *"from the SELECTED RACK'S OWN TRANSFORM — never from previous camera state"*.

**Mechanism** (full diagnosis in `docs/RACK-POSE-DRIFT-PHASE0-EVIDENCE.md`): `_ease` (`dct-ios.html:21363`) converges 14 % **per frame** and sets an axis exactly only once the gap falls under `LOCK_SNAP = 0.0009` — roughly **56 frames** from a walk-exit gap, and spec 37's own header records the harness at **~2.7 fps**. So the canonical pose is **approached, not installed**, and whether it arrives depends on the frame budget the machine granted. That is precisely why it passes 4/4 in isolation and fails inside a full 430-run.

⭐ **Two hypotheses were tested and set aside rather than assumed.** The DOM-measured `lockDistance()` cannot move `x`: racks carry no rotation, so the rack normal is `(0,0,1)` and `pos.x = at.x` exactly. And `settle()` returning early under a stalled render loop is **not an alternative** to the frame-dependence — it is the same root cause seen from the harness side.

**Fix directions, none built, owner picks:** a **time-based ease** (recommended) so the same wall-clock duration lands the same pose at 2.7 fps or 60 fps, with a **deadline snap** as the guard; the deadline snap alone; or raising `LOCK_SNAP`, which is **rejected as the dishonest option** — it shrinks the residual while leaving the frame dependence in place, so the spec would go green while the property stayed broken.

⛔ **Acceptance is the pinned baseline:** `37-locked-rack-pose` must pass **inside a full 430-run**, not in isolation. Isolation passes today and proves nothing about this defect.

⚠ **Found in passing, same file, NOT the cause of these two failures:** `lockSync` compares a signature **rounded to whole pixels** to decide whether to rebuild the projection, while `lockDistance()` consumes the **raw floats**. Sub-pixel rect jitter therefore changes the camera distance with no guard watching. It cannot affect `x`, so it is not this defect, but it can move `y` and `z` between two arrivals at the same rack. Reported, not acted on.

---

## 2026-09-10 · DOCK ICON BATCH — G-1 ruled, P-3 framing corrected, the shared subject box set

Ruled in session 2026-09-10 against `docs/INTEL-DOCK-GHOST-ICON-PHASE0-EVIDENCE.md`. Numbers in `docs/DOCK-ICON-BATCH-SPEC.md`.

**G-1 · THE IRISES KEEP THEIR CIRCUIT DETAIL.** Owner, verbatim: *"G-1 ruled: keep the circuit detail in the eyes."* ⛔ **The Phase 0 recommendation was to simplify, and it is overruled.** Do not re-raise it.
⭐ **What the ruling needs in order to mean anything — the number, not the argument.** Everything in a 256 master is multiplied by **0.2109** on its way to the 54 px dock box. A trace **8 px** in the master renders at **1.7 px**, the thinnest that still reads as a line on a retina phone; a trace **4 px** in the master renders at **0.84 px** and aliases to a smudge. **So: any trace intended to be legible is ≥ 8 px in the 256 master.** Finer traces still ship, but they read as *shading inside the iris* rather than as circuitry, and the acceptance test judges them on that basis. This is not a re-litigation of G-1 — it is the spec that decides whether G-1 got what it asked for.

**P-3 · THE FRAMING CORRECTION IS ACCEPTED, AND SO IS THE CORRECTION TO MY CORRECTION.** Owner: *"P-3 correction accepted — subject box and ink budget first, brightness after. Your measurement stands, my framing was wrong."*
⚠ **Then my own arithmetic turned out to be wrong, and the owner's original word was right.** Phase 0 first published rendered sizes computed as if `object-fit:contain` fitted the *subject*; it fits the **256 × 256 canvas**, at a flat `54/256 = 0.2109`. Corrected: COMMAND and BUILD render **47.7 px** on the longest side, TOOLS **40.1** (**16 % smaller**), EXIT **38.0** (**20 % smaller**). **The handoff's "the wrench renders smaller" was therefore correct and my pushback on it was not.** What does not hold is *"dimmer"* — TOOLS has the **highest** mean luma of the four (95.2 vs EXIT 54.6). It is **smaller and sparse together** (8.8 % ink vs BUILD 43.5 %). The accepted fix order is unchanged and reinforced: **box → ink → brightness.**

**THE SHARED SUBJECT BOX — the number the ghost re-render is matched to:**
> **Canvas 256 × 256 · subject longest side 226 px, centred · minimum 15 px margin on all four sides.**
Chosen because COMMAND and BUILD **already are 226** (so the row's anchor does not move), it is the **largest value in the set** (so nothing shrinks and the two small ones scale up, which is the direction they need), **G-1 argues for the largest defensible box** because kept iris detail needs pixels, and it renders at **47.7 px — 88 % of the 54 px box** without letting a rim-light touch the cell edge. Result: every icon renders with the **same 47.7 px longest side**, and EXIT stops floating (side padding 50/49 → 15/15).
⚠ Equal longest sides is a **geometric** match, not an optical one. The row gets eyeballed after the geometry lands and any icon still reading heavy or light gets a manual nudge **inside** the 226 box.

**INK BUDGET — second, per the accepted order. Target band 25–45 %.** After the box fix alone: BUILD 43.5 %, EXIT 35.0 %, COMMAND 29.6 %, **TOOLS 12.4 %**. Three of four land in band untouched. **TOOLS is the only real outlier and the box fix does not rescue it** — it needs roughly **double its stroke weight**, not more brightness.

**ACCEPTANCE TEST RUNS AT 54 px, NOT 44.** The ghost-icon handoff §3 specifies 44; that is the **tap-target floor** (`01-nav.spec.js:104`), not the icon box — `#rd-botnav .bicon` is **54 × 54**. Testing at 44 under-tests legibility by 19 %. The row test also **names** whether the irises read as circuitry, as texture, or as two lit ovals, because that is what G-1 was ruling on.

**ON THE RECORD, NOTHING TO DO YET (owner: *"noted and goes on the record"*):** on a five-slot dock, `.blabel` would clip **silently** — `white-space:nowrap; max-width:100%` with **no `text-overflow:ellipsis`** inside `#rd-botnav{overflow:hidden}`, and its `clamp(8px,2.3vw,…)` is **viewport-based**, so the text does not shrink to fit a narrower cell. Same family as `.530`, when width pressure forced COMMAND to be relabelled DECK. **Not a live risk under the four-slot ruling.**

**STATE:** the owner is re-rendering the ghost with true alpha at source, matched to the 226 box above. **INTEL-DOCK stays HELD until that asset lands.**

---

## 2026-09-10 · INTEL-DOCK — ALL FOUR OPEN QUESTIONS RULED. The ghost takes dock slot 4.

**Ruled in session 2026-09-10**, against `docs/INTEL-DOCK-PHASE0-EVIDENCE.md` §5 and its 2026-09-09 addendum, with the options and tap counts in front of him. This closes every item the Phase 0 listed as blocking, and it re-confirms rather than re-opens the 2026-09-03 ruling.

**1 · DOCK COUNT — OPTION A. Four slots: `COMMAND · BUILD · TOOLS · GHOST`; EXIT (hold) leaves the dock for the last row of SYS.**
The 2026-09-03 ruling stands, re-confirmed rather than assumed, exactly as §5 asked. ⛔ **Option B (five slots, SHIFT restored) is REJECTED** — it would restore a pillar while three of SHIFT's nine questions still have no data source, which `PHANTOM_CURRENT_STATE.md` D-1 forbids, and it would change the nav twice for two device verifies. ⛔ **Option C (ghost in the header or as a floating button) is REJECTED** — it leaves the assistant 2+ taps away and re-uses the `.156` medallion that was hidden for being dead.
**A8 / R-02 is not contradicted:** *removing that slot removes the slot, not the feature*. If M4 later wants a SHIFT slot it collides with the ghost, and **that is ruled then, not now.**

**2 · `#cc-asst` — RETIRED when the dock owns the door.**
The dock ghost becomes the **single** opener, so Contract A2 (one door per feature) holds and the door ledger is genuinely **net 0**, not +1. The Command card required a Master to be loaded; the dock ghost does not, so reach goes up as the door count stays flat.
⭐ **This also retires the lying gauge, and the lie is now measured, not suspected.** The card's eyebrow reads a static `AI ASSISTANT · ONLINE` beside a static green dot regardless of `body[data-net]` or the API check. A read-only preflight on 2026-09-09 proved the API can be genuinely unreachable while that gauge still reads ONLINE — a Contract B10 violation that dies with the card rather than needing its own ship.

**3 · GHOST ART — COMMISSION A MATCHING CUT.**
It must match the pipeline the other four dock icons already use: `icons/phantom-nav-*-vN-256.webp`, **256×256, `loading="eager"`**, plus a dim state that reads at arm's length (*"dim means dim"* — a glyph change if opacity alone fails). ⛔ **Reusing `phantom-ghost-v3.webp` is rejected** — it is sized for a 107×122 card and was never cut as a lit/dim pair. This is a **web-Claude art task and a Phase 1 dependency**: flag it early, the way Addendum A3 flagged SCAN. ⛔ **Do not precache it until a consumer exists** (the `.364` lesson).

**4 · THE HARNESS CORS RED — FIX BY ROUTE INTERCEPT IN THE FIXTURE.**
`00-boot.spec.js:18` has been failing on three CORS entries because the Worker correctly refuses the `127.0.0.1` harness origin. The fixture will intercept `PHANTOM_PROXY_URL` so the probe never leaves the harness. ⛔ **Not by widening `BENIGN_CONSOLE`** — the standing rule is *"never widen the console allow-list to get green"*, and this ruling honours it. The in-spec filter `.584` used is rejected as the general fix for the same reason: it leaves the probe firing at a Worker that will always refuse it.
⭐ **It also unblocks the ghost's own tests.** Bound to the SYS aggregate, the ghost renders **dim in every harness run** because the API probe can never succeed there; with the intercept, the lit state becomes drivable and therefore testable.
**Scope:** harness only, no app source, no version bump. It may land **in parallel** with `.586`'s device verify.

### What is still NOT ruled, and must not be assumed

- **`#cs-nav-ext`** — the desktop side-nav EXIT (`:16561` at `.586`). INTEL-DOCK is silent on it. **Default stands: leave it**, per the `.576` pattern (the phone loses the duplicate, the desktop keeps its door).
- **SYS's other nine items** — INTEL-DOCK §2 says *"nothing else moves into SYS in this ship"*; whether the four health rows and five actions are later trimmed, and whether MASTER (B-1) joins, are separate ships.
- **The Next Action card on Build** — recorded open, untouched.

### The gate that is not the owner's

Ship discipline allows **one unverified ship in flight**. `.586` (ICON REFRESH) is built and unadjudicated, so INTEL-DOCK **cannot be built** until `.586` has been on the phone and ruled through `verify.ps1`. Every ruling above is now recorded and waiting; the harness ship in item 4 is the one piece that can proceed in parallel, because it touches no app source.

---

## 2026-09-09 · RESTORE-UNDO — a restore becomes undoable; neither "blank is never an erase" nor strict replace

**Ruling, verbatim (in session, 2026-09-09), answering the `.585` question of whether a backup that
lacks a deploy section may clear it on the device:**

> I'm not ruling "blank is never an erase" and I'm not ruling strict replace either. Neither is
> right. There is no cross-device sync, so there is exactly one copy of that deploy data and an
> unrecoverable clear is the actual risk — but a merge produces a state that never existed on any
> device and gives me no way back to clean. Ruling: restore becomes undoable. Snapshot current state
> before applying, offer one revert. A confirm dialog is something a tech reads with gloves on at
> 3am; an undo is something that works when they didn't. Write that as its own spec, evidence first,
> don't ship it inside .585 or .586.

### What it settles

- The restore keeps its replace semantics; the confirm keeps saying CLEARED (`.585`). Neither is
  the fix. **The fix is a persisted pre-restore snapshot and one revert.**
- **Own ship, own version, evidence first:** `docs/RESTORE-UNDO-PHASE0-EVIDENCE.md` (what a restore
  writes, what it does not touch, why the snapshot cannot live in `localStorage`, what one revert
  must capture) and `docs/SHIP-HANDOFF-RESTORE-UNDO.md` (the spec). Not folded into `.585` or `.586`.

### Q1–Q3 answered the same day (verbatim)

- **Q1, snapshot cannot be taken:** *"Refuse the restore when the snapshot cannot be taken: yes,
  refuse. Tell the tech why in one line. An un-undoable restore on a device holding the only copy of
  that data is the exact failure the ruling exists to prevent."*
- **Q2, band placement:** *"whatever puts the revert in front of the tech at the moment they realize
  it went wrong, not buried. Show me your options with tap counts before you build."* → options with
  tap counts in `docs/RESTORE-UNDO-PHASE0-EVIDENCE.md` §6; owner picks before any build.
  **RULED 2026-09-09 — A, the header band.** Owner, verbatim, with the §6 table and its tap counts in
  front of him: *"a"*. One door: the band beside the storage/backup warnings on every screen while a
  slot exists — `RESTORE APPLIED HH:MM · from <file> · UNDO | KEEP` — persistent until UNDO or KEEP,
  no auto-hide, no interstitial, no SYS row.
- **Q3, expiry:** *"parked, don't guess. Bring me what the storage budget actually allows in
  IndexedDB and I'll rule from that."* → measurement plan in the same evidence §4; the harness engine
  returns `null` for `navigator.storage.estimate()`, so the number comes from the phone.

---

## 2026-09-09 · PROMOTE ORDER — RESOLVED. Principle: verify → stamp → promote is canonical. Mechanics: not runnable until `main` has a served surface

**Context.** Earlier the same day the owner stated the canonical order as *verify → stamp →
promote, device checks against main's live Pages URL*. Measured the same hour (last-modified
2026-09-09 14:26:54 GMT): Pages serves `release` only; `main` is not served at any URL; there is no
`.github/workflows`. Reported back as a contradiction with ruling C (`30f3822`) and rev 2 §0.

**Ruling, verbatim:**

> You're right and the error was mine. Pages serves release, so main has no served surface and the
> order I gave you can't be run as written. Resolve the contradiction in OWNER-RULINGS in my favor on
> the principle and against me on the mechanics: verify → stamp → promote stays canonical, and it
> does not become runnable until main has a served surface.

**The surface, verbatim:**

> This is not its own ship in the app — no dct-ios.html change, no version bump. It's a Cloudflare
> Pages project pointed at main, giving a staging URL alongside the existing GitHub Pages release
> deployment. I already have Cloudflare. Write it as an infrastructure task with the steps for me to
> run, not an app ship. Once staging exists: phone check on staging, verify.ps1, stamp, then I
> promote to release, and release means graduated.

→ `docs/INFRA-STAGING-CLOUDFLARE-PAGES.md`. Pre-checked from the repo: every path is relative
(`start_url ./dct-ios.html`, `register('./sw.js')`, relative `PRECACHE_URLS`, zero `/phantom/`
absolutes), so `main` served at the root of a `*.pages.dev` origin runs unchanged.

**Named exception — `.585`, verbatim:**

> .585 runs serve → see → verify one more time as a NAMED EXCEPTION, recorded as such in
> OWNER-RULINGS with the reason (no staging surface existed yet). It is not precedent.

Reason of record: on 2026-09-09 no staging surface existed and `.585` was already on `main`. Order
for `.585` only: `promote.ps1` → the RESTORE-confirm look on the release URL → `verify.ps1 585
PASS|FAIL`. The owner records the stamp against what he actually saw on the phone.

**What this supersedes and what it unlocks.** Ruling C's order (`30f3822`) and the *serve →
device-see → verify* line in rev 2 §0 are superseded for every version after `.585`. The tools
follow the surface, in a script-only ship gated on the staging URL existing: `verify.ps1`'s
NOT-SERVED / SERVED-BYTES guards move from `origin/release` + the release URL to `origin/main` + the
staging URL; its PASS path stops promoting and prints the promote line instead; `promote.ps1`
Guard 4 returns to requiring the INCOMING version to be adjudicated — the semantics ruling C relaxed
only because nothing could serve an unpromoted version. `CLAUDE.md`'s ship loop is rewritten in the
same ship. Promote remains owner-only, per instance, from the owner's terminal, no exceptions.

---

## 2026-09-08 · PREVIEW-DIAG — RACK-PREVIEW-CONTEXT Option 5, INSTRUMENTATION ONLY, APPROVED

**Ruling, verbatim (in session, 2026-09-08):**

> Option 5 = ruling PREVIEW-DIAG, instrumentation only, approved.

**The premise it rests on, also verbatim, same thread:**

> Untangle .581/.582: .581 stays VERIFIED, leave the guard's refusal — do NOT stamp .581 FAILED, the
> preview bug is pre-existing state-3, not .581's.

### What it approves

- **Option 5 of `docs/RACK-PREVIEW-CONTEXT-PHASE0-EVIDENCE.md` §5: make the silent states speak,
  change nothing else.** Every silent path in `bw_mount3D` already composed a full diagnostic line
  and handed it to the console, and there is no console in a cold aisle. The lines now go to the
  `phantom_crash_log` ring, readable at SYS → DIAGNOSTICS, as TRACE entries excluded from
  `phantom_crashErrors`. Plus one read-only health snapshot per mount, 1200 ms after mount.
- **As its own version.** The ship is `v1.14.582` (`9c03aa3` + review fix `e643517`), already on
  `main`. This entry confirms it; nothing new is built under it.
- **Instrumentation only means:** no re-arm, no re-render, no context allocation, `getError()` not
  called (it clears GL state). Zero pixels change. The one on-screen difference is that the ERRORS
  sheet lists `PREVIEW/…` entries; the SYS row count and dot exclude traces and stay NONE / grey on a
  healthy device.

### What it does NOT approve

- Options 1–4 of the same document. **Option 1** (liveness probe + re-arm) re-opens the `.394` ruling
  that re-arming a starved device worsens context pressure; it needs its own ruling, and only becomes
  a candidate if a device reading names candidate A (`MOUNT_NOT_DRAWING`). **Options 2+3**
  (`webglcontextrestored` listener, drop `{ once: true }`) are cheap and additive but cannot see
  candidate A — own ship, own ruling. **Option 4** touches the `.401` pause/resume contract.

### Why 5 beats the others

It is the only option with zero risk to a starved device, and it turns every future blank preview
from a guess into a reading. The reading then decides whether Option 1 is justified, instead of
taking Option 1 on a hypothesis.

### Verify

Promote → device: BUILD with a Master loaded → SYS → DIAGNOSTICS. **PASS** = a `PREVIEW/` entry is
listed and no JS-ERROR banner appeared. **FAIL** = no entry after a Build visit, or a banner on a
device that was healthy at `.581`. **A blank preview does not fail this ship** — the line it leaves
is the finding. Stamp on the instrument, not on the preview. Checklist: `docs/BATCH1-582-EVIDENCE.md`.

### Record notes

- The `.582` commit message records Option 5 as *"owner-ruled 2026-09-08"*. The owner confirmed it
  and gave it the label **PREVIEW-DIAG** in session on 2026-09-08; this entry is the register record.
- **Same day, recorded elsewhere, not yet given its own entry here:** the promote-order ruling
  (`30f3822`; `tools/promote.ps1` Guard 4 header — promote → device-verify on the Pages URL → stamp,
  and the guard adjudicates the version the phone HAS). That commit calls it *"owner ruling C"*.
  Owner to confirm whether it gets a register entry under that label.

---

## 2026-09-05 · BATCH-OODA — C-1 … C-5 RULED

Spec: `SHIP-HANDOFF-BATCH-OODA.md`. The owner ruled all five conflicts in one message, each
matching Claude Code's recommendation.

| # | Conflict | Ruling |
|---|---|---|
| **C-1** | SHIP GATE 2026-08-23, *"max ONE unverified ship"*, vs batches of 3–5 | **AMEND** |
| **C-2** | Ship discipline 0 (CALL 0) already batches, cap 6 | **SUPERSEDE** |
| **C-3** | LEGACY-RETIRE forbids stacking | **CARVE OUT** |
| **C-4** | Private-tab pass fails mid-batch | **Option 2** |
| **C-5** | Does batch approval authorise scope? | **CONFIRM** |

### What each ruling means concretely

- **C-1 AMEND.** The 2026-08-23 SHIP GATE is amended **by name, not revoked** — the `.483/.484/.485`
  incident stays on the record as the reason the rule existed. The amendment is **conditional on a
  genuinely green suite** (spec §4). Until that lands, max ONE unverified ship still governs.
- **C-2 SUPERSEDE.** BATCH-OODA replaces CALL 0. **CALL 0 and `BATCH-VERIFY.md` are struck in the
  same edit** — two live batching rules is the failure mode this repo already knows.
- **C-3 CARVE OUT.** ⛔ **BATCH-OODA does not apply inside LEGACY-RETIRE.** That campaign keeps one
  visible change per ship and a phone verify between stages, per its own ruling.
- **C-4 OPTION 2.** Per-ship adjudication at the batch boundary: the evidence table carries a
  PASS/FAIL column and `VERIFIED` records the batch with any failing version named. **Fallback to
  Option 1 (whole batch FAILED) when the defect is structural rather than localised.**
- **C-5 CONFIRM.** Batch approval is **not** scope approval. Each batch's contents still need an
  explicit GO. BATCH-OODA changes adjudication cadence only.

### ⛔ NOT YET IN FORCE

These rulings settle the *conflicts*. They do **not** start batch mode. BATCH-OODA becomes standing
doctrine only when spec §8 is satisfied — the §4 suite triage landed and signed off, the sweep
runtime regression resolved, `CLAUDE.md` rewritten, `stamp.ps1` given batch syntax, and one batch
run end to end. **Until then the existing ship discipline governs unchanged.**

---

## 2026-09-05 · PROMOTE IS OWNER-ONLY. The 2026-08-30 amendment is REVOKED.

**Ruling, verbatim:**

> The 2026-08-30 amendment is revoked. Promote is owner-only from now on: never move release, in any
> mode, unless I explicitly order that specific promote in that session. Log the revocation in
> OWNER-RULINGS.md. The promote.ps1 from the scripts ship becomes the only promote path, and it runs
> from my terminal.

### What this revokes

`CLAUDE.md` § *Branch topology — SHIP-GATE-LOCKDOWN*, the block headed
**"⭐ AMENDED 2026-08-30 — CLAUDE CODE MAY PROMOTE."** That amendment permitted Claude Code to run
`git checkout release; git merge --ff-only main; git push origin release; git checkout main` on its
own judgement. **It no longer holds.**

### What triggered it

`release` moved twice inside 24 hours without the owner running a promote:

| Ref move | Time | By |
|---|---|---|
| `e78f0b2 → 2000e02` | 2026-09-05 07:46:02 -0500 | Claude Code |
| `2000e02 → 9cac936` | 2026-09-05 08:26:58 -0500 | Claude Code |

Both were fast-forwards performed by Claude Code on an explicit in-session instruction, and both
were reported at the time. An audit confirmed **no automation moved the branch**: no
`.github/workflows/`, no active `.git/hooks/`, `tools/githooks/pre-commit` contains no
push/merge/checkout, and the only repo-wide matches for `--ff-only` / `push origin release` are
documentation in `CLAUDE.md:146` and comments in `tools/hooks/phantom-guard.js`.

⚠ Not audited from this box: **GitHub-side** branch protection or auto-merge on `release`. `gh` is
not installed here; that check has to come from the owner's terminal.

The ruling is not a finding of unauthorised action. It removes the discretion itself, so the
question cannot arise again.

### The standing rule

1. ⛔ **Claude Code never moves `release`. In any mode. No exceptions, including a session order.**
   No `merge --ff-only`, no push to `release`, no branch reset, no "it is only a fast-forward".
   An in-session instruction to promote is answered by **handing the owner the command**, never by
   running it.
2. **The only promote path is `tools/promote.ps1`, run by the owner from his own terminal.**
3. The 2026-08-27 lockdown's original gates are untouched and still absolute: **`VERIFIED` is
   owner-only**, and **the device verify is the owner's**.
4. A push to `main` changes nothing on the iPhone. Claude Code ships to `main`, reports, and
   **parks**. Reaching the phone is the owner's step.

### ✅ RESOLVED same day — the escape-hatch clause is STRUCK

The ruling as first given contained both an in-session escape hatch (*"unless I explicitly order
that specific promote in that session"*) and a mechanism only the owner can operate (*"promote.ps1 …
runs from my terminal"*). Claude Code reported the tension rather than resolving it.

**Owner ruling, 2026-09-05, same day:** *"Strike the escape-hatch clause: you never move release,
full stop, no session-order exception. The only promote path is promote.ps1 from my terminal."*

⛔ The escape hatch **does not exist**. The quoted ruling above is preserved as the historical
record; this strike governs.

### `promote.ps1` — GO given 2026-09-05

At the time of the ruling the repo contained **no `.ps1` files at all**. The owner then gave an
explicit GO for the scripts ship: **`tools/stamp.ps1` and `tools/promote.ps1`, script-only.**
Until that ship lands there is no promote path and no ship can reach the phone.

### Stale instruction hazard — CLOSED 2026-09-05

`CLAUDE.md` carried the revoked *"CLAUDE CODE MAY PROMOTE"* amendment, and `CLAUDE.md` is what a
fresh session reads at startup. On the owner's instruction both passages were edited to point here:
the § *Branch topology* amendment block, and ship-loop step 4 (*"PROMOTE, then STOP"* → *"PUSH TO
`main`, then STOP"*). No permission language remains.

# PHANTOM — BOARD & NEXT OPS (v2)
**Consolidated state as of 2026-09-01. Release at v1.14.562. Owner copy. Supersedes v1.**

---

## DONE — VERIFIED (no action)

- **LEGACY-RETIRE:** complete (stages 0–4, 6, 7; Stage 5 folded into IA-SHIFTNAV; Stage 8 permanently deferred).
- **FORGE-WORKER-CUTOVER:** complete; independently verified from release — 0 `sk-ant`, 0 direct `api.anthropic.com`, 4 call sites on the Worker. Old key revoked; new key lives only as the Worker secret.
- **Rack-detail render bug:** fixed (.557) — OPEN AISLE from Home no longer wipes the elevation.
- **Multi-tab data-loss toast:** shipped, mutation-tested.
- **BOOT-TAPGATE:** shipped — `tap to enter` is in the live source.
- **IA-SHIFTNAV base spec + Phase 0 nav census:** done. Premise corrected: Deploy Optics is *buried* (~3 screens, ten-tool group), not stranded. Phase 1 parked on owner rulings.

---

## OPEN — OWNER ACTIONS

- **O-1 · Log in and run the session opener.** Nothing has executed today; `/login` first. Opener includes graphify-first, the spec import, and the rulings below.
- **O-2 · Rulings for IA-SHIFTNAV Ship 1:** (a) `ops_init` stays disabled or comes back; (b) aisle word for the OPS tool group; (c) **amended by review item 6:** ISOLATE gets its own door, separate from the tool group — the dangerous tool doesn't live in a laundry row with Blast.
- **O-3 · Worker streaming check (2 min, phone).** Forge AI text progressive = done. One lump = paste the pass-through fix in Cloudflare (v1 board has the code).
- **O-4 · Header hit-path repro (phone, 390px).** Reviewer's browser agent reported a Build tap landing on `header.app-header`. Unverifiable from source (`.app-header {display:none}` in one rule). Reproduce with a thumb. If real → P1, own ship.
- **O-5 · Grok-icon provenance ruling.**
- **O-6 · Boot ceremony ruling (optional).** Reviewer called boot "three curtains." You chose the tap gate deliberately; it stays. Only decide whether globe + nameplate should collapse into the single held screen. Owner taste, not a defect.

---

## QUEUE — SHIPS

### Q-1 · DATA-HONESTY-COMMAND — *new; suggested next after the opener*
Source-supported findings from the live review, one spec, two or three small ships:
- `set up profile` appears 7× in source, 3× visible on first-run Command → one affordance, in one place.
- `continue deployment` / Timeline / Open AI render on an empty job (no Master) → CTAs conditional on a Master existing; honest zeros keep honest verbs.
- Shift Readiness renders 25% for an unset profile → **gate or number, never a score for nothing.** Either hide until a site exists or replace with a plain gate state.
- Local System State card duplicates the same UNSET facts already shown above it → collapse.
- **Setup gates inside Shift Readiness.** `:23560` scores Site profile / Master loaded / Handoff alongside the deployment gate, so a fresh device reports a low readiness % for not being configured yet. Owner ruling 2026-09-04: **0% stands — three gates answerable, the count is honest, no change.** Carried here as a spec question only: should setup gates and floor gates share one ring, or is readiness a floor-state instrument that setup should not enter?
- **`cs-kpi-pct` renders an ungated percent.** `:23699` `E(cs-kpi-pct).textContent = pct + %` with no answerability gate — same class as the blockers-cell FAIL of `.578`, different value (`activePct`). The readiness ring at `:23576` already honours `pct === null` with an em dash; this hero surface does not. Report-only observation, no ruling sought yet.
- **The readiness blockers gate mixes an aggregate with an active-only predicate.** `:23563` gates on `hasDeployment = !!activeDep` (`:23559`) but scores `blockerCount`, which `:23345` sums across **every** deployment. So with deployments present but none active, the readiness row reads `—` while real blockers exist; and with a non-active deployment holding blockers, the row's OK/OPEN answer is computed from a count the gate did not scope. Surfaced during the `.579` ship and ruled **report-only 2026-09-04** — `.579` fixed the hero KPI to active-only and deliberately did not touch this gate (single visible change). Spec question: does the readiness row adopt the same active-only count, or does its gate widen to any deployment?
- **Two answers to "how many racks" on one screen (torture Master, US-TST99).** Hero reads *"0 racks on US-TST99. Tap one."* while the RACKS cell reads 60. ⚠ NOT Master-vs-deployment as first read: **neither counts Master racks.** Hero `pickN` (`:23668`) counts rack rows in the **active deployment only**; the KPI/stat cells use `rackCount` (`:23344`) which **sums every deployment**. The `:23664` comment defends the split deliberately - the headline points at a picker that lists one deployment, so counting all of them beside "tap one" would be a gauge that lies. The defect is that the screen shows both, unlabelled, so the reader cannot tell which question each answers.
- **⛔ The likely cause of 0-vs-60: TWO resolvers for "which deployment is active", and they can disagree.** `live` (which gates the "Tap one" headline) comes from `nowtab_resolveDep()` (`:27120`), which filters to active/paused/status-less deployments and picks the **most recently updated**, only *then* preferring `deploy_getActive()` **if that one is in the list**. `pickN` uses `deploy_getActiveId()` directly. So when `phantom_active_deployment` is unset or points at a completed/archived deployment, `nowtab_resolveDep` falls back to the newest active one and renders "Tap one" while `pickN` resolves to 0. The `:23664` comment claims the headline's N "can never disagree" with the surface it points at - that guarantee holds for the number but **not for the headline's existence**, which a different resolver decides. Contract A2, one canonical engine per concept.
- **Flags vs blockers: CONFIRMED intentionally distinct, no defect.** `deploy_forge_flagCount` (`:20241`) counts **devices in one rack** with a **geometry** problem - `conflict`, `overflow`, `hgtUnknown` or `stray` - derived from the **Master**. `deploy_countBlockers` (`:42760`) counts **`reviewIssues` on a deployment record** with `triage` of `untriaged` or `blocking`, from `phantom_deployments_v1`, **human-triaged**. Different subject, source, scope and origin; 20 flagged with 0 blockers is coherent (the Master has 20 geometry problems, nobody has filed a review issue). ⚠ The honesty concern stands anyway: two counts that both read as "things wrong" sit on adjacent surfaces with nothing naming what each measures.
- **LABEL THE COUNTS (owner ruling 2026-09-05, no fix now).** Flags and blockers stay distinct; what is owed is that each surface **names what it measures**. Flags = devices in this rack with a geometry problem, from the Master. Blockers = triaged review issues on this deployment. Same treatment is owed to the two rack counts once Finding 2 lands.
- **⛔ Finding 2 PROMOTED OUT of this pile to a Batch 1 fix (owner ruling 2026-09-05).** One engine for "how many racks", same treatment as the blockers cell. Owner ruling on the ambiguity: **the cell shows the MASTER rack count, the hero names the DEPLOYMENT state.** ⚠ Note this is a behaviour CHANGE, not just unification: the cell today shows neither - it sums rack rows across every deployment (`:23344`), and nothing on Command currently reads the Master's rack count at all.

#### Q · parked for owner ruling (Batch 1, 2026-09-05)
- **Q-a · siteLead migration test asserts behaviour `.538` deliberately removed.** `10-site-profile-root:84` expects `migrate()` to fill `siteLead` from `operator`. `.538` deleted that seed and the code carries an explicit **do not restore it**: `.474` removed Site Lead from Site Setup, so the seed had quietly become the ONLY writer of site authority, granting it to whoever set the device up; `.537` built the SITE/SYSTEM door Contract 9a names, so seeding it is now a guess. **Recommend PIN with that reason, split so the `id` / `rootMigratedAt` assertions stay live** - the same shape as the `.513` skipWaiting pin. Pinning is owner-only; not done.
- **Q-b · `--tac` is referenced but never declared - three declarations are silently dead.** `.opswall` cells use `var(--tac)` for border (`:8982`), active border (`:8995`) and label colour (`:9004`). It is declared in no stylesheet, set on no element and never written by `setProperty`, so under Contract 15 each whole declaration invalidates. The `:8910` comment claims the opposite - *"var(--rfac)/var(--tac) are set inline per row/cell, so no undefined custom property can silently kill a declaration here"* - the intent was never implemented. **This is the only REAL app defect in Batch 1.** Fix: give `.opswall > div` a default `--tac` in the cascade (precedent `.iso .card{--rfac:var(--cyan)}` at `:8763`) so inline per-cell overrides still win. Needs a version bump.
- **Q-c · Finding 2 fix shape.** Master rack count is `Object.keys(m.racksByCab).length`, already used at `:22885`. The cell adopts it; the hero drops its own count and names the deployment state per the ruling. Needs a version bump.
Doctrine: no removal of real state; only removal of repeated or decorative state. Phase 0 evidence quotes each element's file:line first.

### Q-2 · IA-SHIFTNAV Phase 1 — *inputs updated by the review*
Hard requirements now on record for the proposal:
- **Scan gets a dock slot.** The all-day action is currently a card + a substab + a desktop rail item. Homeless on the phone.
- **Exit-hold loses its dock slot.** A power gesture is not a place; it doesn't own a quarter of the rail.
- **ISOLATE gets its own door** (per O-2c).
- **Identity moves to ARRIVE.** Nameplate off the first screen; racks/blockers above the fold on Command.
- **Phone is the product.** Desktop rail has `deploy / optics / audits / sops / power` tabs the phone dock lacks. Phase 1 reconciles: anything a tech needs on the floor exists on the phone dock or one tap from it. Confirm Phase 0's census covered the desktop rail; if not, extend it before design.
- Standing guards: tap-count table before/after; ISOLATE and rack detail may not get worse; stranger test in every mode-nav verify gate.

### Q-3 · IA-SHIFTNAV Ship 1 (re-scoped) — *after O-2 rulings*
Findability of the ten-tool group (option 1), 1→2 tap trade accepted, plus the ISOLATE door.

### Q-4 · Forge Ship 2 confirm — *likely already done*
Verify `#api-key-input` and `cw_api_key` plumbing are absent. Report only.

### Q-5 · WEBKIT HARNESS BUMP — *queued 2026-09-04, NOT NOW*
⛔ **The `phone-webkit` project — the primary field gate, the one `playwright.config.js` says
everything must pass first — cannot launch on this box.** Windows **Smart App Control is ON**
(`VerifiedAndReputablePolicyState = 1`, enforcement) and blocks
`ms-playwright/webkit-2336/libxslt.dll`: *"An Application Control policy has blocked this file."*
`WebCore.dll` then resolves `libxslt.dll` as **not found** and every WebKit process dies at launch,
which surfaces as the misleading `browserType.launch: Target page, context or browser has been
closed`. ⚠ **A forced re-download does NOT fix it** — the policy blocks the bytes, not their
absence; the file is present and freshly downloaded and still unloadable.

⛔ **TURNING SMART APP CONTROL OFF IS NOT THE FIX AND IS NOT AVAILABLE** (owner ruling
2026-09-04): it has **no per-file exemptions**, and once disabled it **cannot be re-enabled**
without a Windows reinstall. That door is one-way, so it stays shut.

⭐ **THE REAL FIX IS THE HARNESS.** `webkit-2358` is **NOT blocked** — its `libxslt.dll` loads
cleanly, which is how `.578` was measured on real WebKit through the `playwright-iphone` MCP
profile. `test/` is pinned to `@playwright/test` **1.62.1**, which wants **2336**. The ship is the
devDependency bump to a version that resolves **2358**.

⚠ **IT IS ITS OWN SHIP AND MUST NOT RIDE ALONG WITH A FEATURE.** A Playwright major/minor bump can
shift behaviour across all 50 specs, so it carries a **full 50-spec pass** as its acceptance gate,
compared against a recorded pre-bump baseline. ⛔ **Until it lands, any suite run is Chromium at
390×844 — that is SIGNAL, NOT THE PRIMARY GATE**, and a ship note that reports it must say so.
⚠ **The iPhone device verify is unaffected and remains the actual gate.**

---

## SANDBOX GATE

| # | Gate | Status |
|---|------|--------|
| 1 | Exposed API key | **CLOSED** |
| 2 | Rack-detail visual renders | **CLOSED** (.557) |
| 3 | Churn settled | **CLOSED** |
| 4 | First screen is honest (Q-1) | OPEN |
| 5 | Scan + ISOLATE reachable in ≤1 tap from dock (Q-2/Q-3) | OPEN |
| 6 | Header hit-path clean (O-4) | OPEN — phone check |
| 7 | Streaming UX confirmed (O-3) | OPEN — phone check |

Two phone checks and two ships between now and handing PHANTOM to 2–3 trusted techs at ALP-01.

---

## SITE-SYNC — PARKED (repo-side entry, added 2026-09-03 by owner ruling)

⛔ **PARKED. IT IS AN ARCHITECTURE SPEC, NOT A SHIP.** `docs/SHIP-HANDOFF-SITE-SYNC.md` (13545 bytes,
sha256 `6c4b34ba238718c5…`, imported verbatim at `44502bc`). **Its Phase 0 is NOT started and must
not be started.**

**Sequenced: after FIRST-DOOR and INTEL-DOCK complete.** FIRST-DOOR still owes Ship A slice A-4 and
all of Ship B; INTEL-DOCK is itself sequenced behind Ship A and has not begun.

⭐ **ONE SLICE MAY MOVE EARLY, AND ONLY ONE: `STATUS-HONESTY`.** The spec's own slice 1 — *"the strip
says ON DEVICE / SAVED, never SYNCED, until sync exists. Ships now, no backend. One line."*
**The `SYNCED` label lies today**, and the spec says so plainly: *"a gauge that lies is worse than no
gauge — the SYNCED strip is fixed before anything else, so the app never claims sync it doesn't
have."* ⭐ **That makes it a Contract B10 data-honesty fix, not sync work** — which is exactly why it
is allowed out of order: it removes a false claim rather than adding a capability, and it needs no
backend to be correct.

⛔ **EVERYTHING ELSE WAITS.** Offline queue, conflict policy, the server side — none of it starts
before the sequencing above. ⚠ **Do not read STATUS-HONESTY as permission to begin SITE-SYNC.** One
slice shipping early is not the campaign starting early, and the distinction is the whole point of
the park.

⚠ **Its own Phase 0 E-4 is the prerequisite for even that slice** — *"confirm the SYNCED label's
exact logic (file:line) for the honesty fix"*. A one-line change still needs the one line found and
verified against the stamp first.

---

## GRAPH REBUILD — DEFERRED, SCHEDULED (repo-side, 2026-09-04)

⛔ **A FULL `/graphify .` REBUILD IS OWED, AND IT IS SCHEDULED FOR WHEN SITE-SYNC PHASE 0 OPENS.**
Owner ruling: batch it there, because that is when the graph must know SITE-SYNC, and a rebuild
pays for itself against a real census rather than against two parked documents.

⚠ **WHY THE INCREMENTAL PATH COULD NOT DO IT, so nobody retries it and calls it a tooling glitch:**
`--update` shrank the graph 4615 → 4374 and the shrink-guard refused the write. The refusal was
CORRECT and was verified rather than forced. Two causes, both real: `PHANTOM_CURRENT_STATE.md` lost
**141 nodes** because the extracting agent read only **151 of its 1449 lines** and the thin result
would have REPLACED a richer stored one; and `docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md` lost **113**
despite never being re-extracted, collapsed by fuzzy dedup. ⭐ An additive-only retry — AST plus the
two new docs, nothing replaced — **still shrank**, because `build_merge`'s dedup pass collapses
pre-existing nodes no matter what is added.

⛔ **THE SEMANTIC CACHE WAS CLEARED, AND THE REBUILD DEPENDS ON IT STAYING CLEAR.** It had just been
written with those truncated extractions, so a later rebuild would have hit the cache and silently
reused the thin `PHANTOM_CURRENT_STATE.md` — carrying the defect into the very rebuild meant to fix
it. **If a rebuild is run and the numbers look thin, check the cache first.**

⚠ **AND THE TRUNCATION IS A STANDING CONSTRAINT, NOT A ONE-OFF:** `PHANTOM_CURRENT_STATE.md` is 1449
lines and grows every ship. **Any future extraction of it must read it in parts**, or it will under-
extract the single most important document in the repo and never say so.

✅ **Meanwhile the graph is CURRENT for the code the next slices touch.** SITE-SYNC and
`PHANTOM-OVERVIEW.html` are parked documents; both are committed and readable, and only the graph
lacks them. `graph.json` sits intact at **4615 nodes** — nothing was degraded.

---

## REVIEW LEDGER (what the live-app critique got right, wrong, and unproven)

Supported by source: status museum, triple profile CTA, scan homeless, exit-hold on dock, Isolate buried, empty CTAs, readiness score, phone/desktop divergence.
Conflicts with owner ruling: boot ceremony (tap gate stays).
Unproven: header hit-path (O-4).
Rejected on principle: any "tear down and rebuild." Everything above is punch-list ships against verified anchors.

---

*Standing doctrine unchanged: graphify before work · evidence before patches · one visible change per ship · surgical edits against verified anchors · three-stamp lockstep · owner promotes · iPhone verify gates every stamp · no self-scheduling · a gauge that lies is worse than no gauge.*

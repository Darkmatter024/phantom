# SHIP-HANDOFF-IA-SHIFTNAV — SHIP 1
**The tenth tool, and the name collision**

- **Status:** DRAFT — awaiting owner approval. Nothing is edited until this is ruled.
- **Parent:** `SHIP-HANDOFF-IA-SHIFTNAV.md` + `SHIP-HANDOFF-IA-SHIFTNAV-ADDENDUM-A.md` (imported `2160d71`).
- **Evidence:** `docs/IA-SHIFTNAV-PHASE0-NAV-CENSUS.md` · **Design:** `docs/IA-SHIFTNAV-PHASE1-PROPOSAL.md`.
- **Owner rulings carried in:** **V-1** (VERIFY is a band inside BUILD) · **1a** (Ship 1 is the Build
  tool door) · `ops_init` repaired first · **the 1→2 tap trade is ACCEPTED** · **OPTIC LEDGER is the
  aisle word** (all 2026-08-31 / 2026-09-01).
- **Baseline:** `main` @ `dab7082`, **`phantom-v1.14.558`**, verified and stamped. Anchors below were
  re-read against this stamp on 2026-09-01, per Phase 1's requirement that Ship 1 take its own pass.

---

## ⛔ SCOPE CORRECTION — `.558` ALREADY SHIPPED MOST OF THIS

Phase 1 wrote Ship 1 as *"the ten OPS tools gain a findable, grouped entry point."* **Nine of them
already have it.** `v1.14.558` restored `ops_init`, and the OPS row it builds **is** that entry
point. Measured on phone-webkit at 390×844, `.558`:

| | Measured |
|---|---|
| OPS control after 1 tap (BUILD) | `top: 94px`, `h: 44px`, **on-screen with zero scrolling** |
| Panels after 2 taps | **9**, deepest at **0px — no scroll at all** |
| Panels present | BOM · MANIFEST · PORT MAP · RACK MAP · SOPs · BURNDOWN · AUDITS · BLAST RADIUS · OPTICS |
| **ISOLATE in the row** | ⛔ **NO** |

**So Phase 1's P-3 "after" column is already true for nine tools.** Ship 1 is therefore not the
findability ship Phase 1 imagined — that shipped as `.558`. What remains is the part `.558` could
not reach: **the tenth tool, and the name collision.** This is stated rather than quietly re-scoped,
because a ship that re-delivers work already done is churn.

⚠ **ISOLATE is the one tool the trade did not pay off for.** Phase 1 promised it 2 taps / 0 scroll;
at `.558` it is still 1 tap **plus 2.9 screens of blind scrolling** on the Command Deck, because it
is absent from `OPS_PANELS_CONFIG`. **That is the defect this ship exists to close.**

---

## PHASE 0 — ANCHORS (re-read at `.558`, 2026-09-01)

- **A-1.** `OPS_PANELS_CONFIG` — `dct-ios.html:21535`. **Nine** entries, ending
  `{ tool: 'optics', name: 'OPTICS', meta: 'FIBER · MPO', icon: '◎', accent: '#1fffd0' }`.
  **No `isolate` entry.** This array is what `ops_renderPanels` iterates.
- **A-2.** `DEPLOY_TOOLS` — `dct-ios.html:32155`–`:32176`. **Ten** entries; `isolate` is last
  (`:32176`, `name:'ISOLATE'`, `meta:'DOWN-LINK'`, `ac:'#5cf2ff'`,
  `img:'icons/phantom-tool-isolate-768.webp'`). **The registry already knows the tenth tool.**
- **A-3.** `ops_getStatistic` — cases for `bom, manifest, portmap, rackmap, sops, burndown, audits,
  blast, optics`. **No `isolate` case**, so it would fall to the default.
- **A-4.** The Command Deck row — `#cs-fieldtools`, ten `.cs-tool` buttons, `:13911`–`:13920`.
  `optics` at `:13914` (`aria-label="Optics"`, `.cs-tool-k` text `Optics`), `isolate` at `:13915`.
- **A-5.** The **reference** Optics card — `#ref-grid`, `.rf-cname` `OPTICS`,
  `onclick="showRefTab('rf-optics')"`. ⛔ **This is a different surface and must NOT be renamed.**

### Test constraints this ship must satisfy

- **T-1.** `test/e2e/03-tools.spec.js:378` asserts, **order-sensitively**, that both `DEPLOY_TOOLS`
  and the `.cs-tools .cs-tool` row equal `OPS_TOOLS`' ten tabs. ⚠ Adding `isolate` to
  `OPS_PANELS_CONFIG` does **not** touch either, so this test is unaffected — **verify, do not
  assume.**
- **T-2.** `test/e2e/48-ops-row-exists.spec.js` asserts the expanded row `toContain('OPTICS')`.
  **The rename breaks my own test.** It must move to `OPTIC LEDGER` in the same ship.
- **T-3.** `03-tools.spec.js:149` pins the **reference** card as `OPTICS` with `backTitle: 'OPTICS'`.
  Renaming the reference would break it — which is the correct outcome, since the reference keeps
  its name.

---

## THE SHIP — one visible change: the tool row is complete and unambiguous

- **S-1 · ISOLATE joins the OPS row.** Append to `OPS_PANELS_CONFIG` (A-1), after `optics`, matching
  `DEPLOY_TOOLS`' registry order so the row and the registry stay in the same sequence:
  `{ tool: 'isolate', name: 'ISOLATE', meta: 'DOWN-LINK', icon: '⊣', accent: '#5cf2ff' }`.
  ⚠ **Icon and accent are taken from `DEPLOY_TOOLS:32176`, not invented.**
- **S-2 · A real statistic for ISOLATE.** Add an `isolate` case to `ops_getStatistic` (A-3) reporting
  **open isolation sessions** from `iso_load()`. ⛔ **Data honesty (Contract B10):** if
  `iso_load` is absent, the panel shows `—` and a label naming the absence — **never a fabricated
  `0`.** A zero means "none open"; an em-dash means "not measured." They are different facts.
- **S-3 · The deployment tool becomes OPTIC LEDGER.** Rename in exactly three places, all
  deployment-tool sites: `OPS_PANELS_CONFIG.name` (A-1), `DEPLOY_TOOLS.name` (A-2, drives the
  back-header title), and the `#cs-fieldtools` button's `aria-label` + `.cs-tool-k` (A-4).
  ⛔ **`tab` keys, `OPS_TABS` keys and every `rd_openOpsTool('optics')` call stay `optics`.** This is
  a label change, not an identifier change — renaming the key would break every door at once.
- **S-4 · The reference card is untouched** (A-5). **The whole point is that the two stop colliding.**
- **S-5 · Tests move with the ship.** `48-ops-row-exists` expects `OPTIC LEDGER` and asserts the row
  carries **ten** panels including `ISOLATE`; `03-tools`' `OPS_TOOLS` title for `optics` follows.

**Grep gates (part of done):** `grep -c "OPTIC LEDGER" dct-ios.html` → **3** ·
`grep -c "rd_openOpsTool('optics')" dct-ios.html` unchanged from `.558` ·
`grep -c "tool: 'isolate'" dct-ios.html` → **1**.

**Lockstep:** three stamps, `.559`. Serve from `release` on promote; `VERIFIED` owner-only.

---

## ⏳ ONE OPEN QUESTION — the buried row's fate. **Owner ruling, not mine to take.**

`#cs-fieldtools` still carries all ten doors, 2.4–2.9 screens down the Command Deck. After this
ship the same ten are two taps away on Build with no scrolling. **That is two entry points to one
canonical function.** Three ways, and this ship does **not** assume one:

- **D-1 · Leave it.** Both call `rd_openOpsTool` — one canonical *door*, two handles. Contract A2 is
  about not building a second implementation, and there isn't one. Zero risk. ⭐ **Recommended:
  it is out of this ship's one-visible-change budget either way.**
- **D-2 · Remove it.** Cleaner IA; ⛔ **breaks `03-tools`' order-sensitive wall assertion (T-1)** and
  strips the desktop composition's only tool access at ≥1024, where the OPS row's Build context may
  not be where a laptop user is. **Not a tidy-up — a real removal with real blast radius.**
- **D-3 · Defer to Ship 2** (the five-pillar dock), which reworks the nav anyway.

**Nothing in S-1…S-5 depends on this answer.** If it is unruled when the ship is slotted, D-1 is the
default: leaving a working door alone is never the risky choice.

---

## DEVICE-VERIFY (owner, iPhone)

1. Cold launch → tap **BUILD** → tap **OPS**. The row shows **ten** tools, **ISOLATE** among them,
   with no scrolling.
2. Tap **ISOLATE** from the row. The down-link flow opens; back returns to Build.
3. The tile reads **OPTIC LEDGER**, not OPTICS. Open it — the optic scanner/inventory, and its back
   header says OPTIC LEDGER.
4. **The collision test, and it is the point:** go to **TOOLS**. That card still reads **OPTICS** and
   opens the fiber/MPO *reference*. **Two surfaces, two names, no ambiguity.**
5. Gloves on for the row taps.
6. Nothing else moved: rack detail, deploy flow, Scan and Handoff at their pre-ship paths.

⭐ **Stranger test, per the parent spec:** hand the phone to someone who has never seen PHANTOM and
say *"find the optic ledger."* Then *"get me to ISOLATE."* Count taps and seconds. **That test is
why this spec exists**; it is the honest measure of whether the rename earned its ship.

### ⚠ VERIFY DEBT THIS SHIP CARRIES — nine of the ten tools are unmeasured

The 2026-08-31 hardware pass cleared **the door**, not what the door opens. It establishes the
OPS control's EXISTENCE at the top of the Build workspace and its 44px gloved tap floor. It does
**not** clear the ten tools' own surfaces: each renders through `rd_openOpsTool`, and **only
OPTICS was measured** — visible host, 362×746, 1,619 chars. **The other nine are unverified on
the phone.**

⛔ **A door that opens is not a surface that renders.** `.558` is the standing proof: a control
can be absent, or present-and-inert, for 85 versions without throwing. The nine unmeasured tools
sit in exactly that state — nothing has yet asked them to paint on hardware. Step 2 above walks
ISOLATE and step 3 walks OPTIC LEDGER; **the remaining eight are opened by no step in this list.**

Source of record: `PHANTOM_CURRENT_STATE.md`, the `.558` Historical verify entry. Owner-restated
2026-09-01.

---

## GUARDRAILS

- ⛔ **No door is added to Deploy Optics.** It has one. A second violates Contract A2.
- ⛔ **`optics` stays the identifier everywhere.** Only human-facing labels change.
- ⛔ **No fabricated statistic** for ISOLATE — `—` when unmeasured, per Contract B10.
- ⚠ **The VERIFY band (V-1) is Ship 3, not this ship.** One visible change.
- ⚠ **F-1 is still open** (`docs`/`PHANTOM_CURRENT_STATE.md` §4): ten `03-tools` OPS-door tests fail
  identically at `.557` and `.558` in the synthetic direct-call path. **Ship 1 must not be read as
  fixing them, and must not make them worse** — re-run `03-tools` before and after and report both
  counts, exactly as `.558` did.

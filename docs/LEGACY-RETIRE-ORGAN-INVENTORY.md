# LEGACY-RETIRE — THE BORROWED ORGAN INVENTORY

**Required by the owner ruling of 2026-08-29**, which HELD Stage 6 behind this document:
*"Before any ship: deliver … all 11 borrowed organs — what each is, which shell hosts it, where it
re-homes, and the blast radius if the re-home is wrong. I review and approve the inventory before
ship 1 of this stage. Highest-risk stage in the plan; it gets the most paperwork."*

**Built from live `v1.14.544` source, 2026-08-30. Nothing is shipped or staged.**
`PHASE0-CENSUS.md` is anchored at `v1.14.166`; every fact below was read from current source.

---

## ⛔ THE ONE FACT THAT MAKES THIS THE DANGEROUS STAGE

**The redesign's Reference and Work surfaces are EMPTY SCAFFOLDS in the served HTML.** They contain
no content of their own. Every one of them is filled at `DOMContentLoaded` by **moving legacy DOM
nodes out of legacy pages into them**:

```html
<div class="ref-sub" id="rf-know"></div>        <!-- :14238 — empty -->
<div class="ref-sub stab-active" id="rf-optics"></div>   <!-- :14232 — empty -->
<div class="work-sub" id="wk-scan"></div>       <!-- :14174 — empty -->
<div class="work-sub" id="wk-issues"></div>     <!-- :14194 — empty -->
```

⛔ **So deleting a legacy shell does not "remove legacy" — it empties a redesign surface.** And it
does so **silently**: every re-home guards with `if (src && dest && src.firstChild)`, so a missing
source is a no-op with no warning, no toast, and no thrown error. The tech taps REFERENCE → OPTICS
and gets a blank panel. That is the `hostless_cabs_empty_render` shape, and it is the single failure
mode this stage exists to avoid.

**Stage 6 "decouple" therefore means: move the markup into the redesign's own scaffold IN SOURCE,
delete the re-home function, then delete the legacy shell — in that order, per organ.** It does not
mean deleting shells and hoping.

---

## Reconciliation: 11 census rows = 8 functions = 9 organs

The census counted **surfaces**; the code has **8 re-home functions** moving **9 distinct DOM
organs**. Neither count is wrong — they count different things, and the mismatch is why an inventory
was worth demanding.

| Census surface | Actual organ | Function |
|---|---|---|
| KNOW cards | `#pw-rb` | `redesign_homeKnow` |
| Optic Selector · pg-fiber | `#pg-fiber` children | `redesign_homeOptics` |
| SCAN · pg-scan | `#pg-scan` children | `redesign_homeScan` |
| pg-power · BLAST RADIUS | `#pg-power` children | `redesign_homeHardware` |
| Cage Compass | `#pg-compass` children | `redesign_homeCompass` |
| pg-cli | `#pg-cli` children | `redesign_homeCLI` |
| HW REF Matrix · BT Label Printing | `#hw-matrix-sheet .hwm-inner` | `redesign_homeHWRef` |
| *(census filed this under STRANDED)* | `#issue-page` | `redesign_homeIssues` |

📌 Two census rows name **contents** of an organ, not organs: BLAST RADIUS (`#pw-blast`) rides
inside `pg-power`, and BT Label Printing rides inside `.hwm-inner`. They move with their host and
need no separate ship — but they are what breaks if the host move is wrong.

---

## The nine organs

| # | Organ | Lives in (shell) | Re-homes to | Mechanism | Blast radius if wrong |
|---|---|---|---|---|---|
| 1 | `#pw-rb` (Runbook / KNOW) | `pg-power` | `#rf-know` | **move node** | Reference→Know renders empty. Also un-does the `STAB_GROUPS` fix below |
| 2 | `#pg-fiber` children (Optic Selector) | `pg-fiber` | `#rf-optics` | **drain + wipe** | Reference→Optics empty. `fiber-sub` subtabs unbound |
| 3 | `#pg-scan` children (SCAN) | `pg-scan` | `#wk-scan` | **drain + wipe** | Work→Scan empty. **Scanner is a primary pillar** |
| 4 | `#issue-page` (Deployment Issue Log) | `pg-twin` | `#wk-issues` | **move node** | Work→Issues empty. `issue_renderList` writes into a detached node |
| 5 | `#pg-power` children (Power · **BLAST RADIUS** · Thermal · LED-GPU) | `pg-power` | `#rf-hw` | **drain + wipe** | Reference→Hardware empty. Takes BLAST RADIUS with it |
| 6 | `#pg-compass` children (Cage Nut) | `pg-compass` | new `#pw-compass` in `#rf-hw` | **build panel + move children** | No Cage Nut tab. Depends on organ 5 having already run |
| 7 | `#pg-cli` children (CLI / IB) | `pg-cli` | `#rf-cli` | **drain + wipe** | Reference→CLI empty. `cli-sub` subtabs unbound |
| 8 | `.hwm-inner` (HW REF Matrix · **BT Label Printing**) | `#hw-matrix-sheet` | `#rf-hwref` | **move node** | Reference→HW Ref empty. Takes label printing with it |
| 9 | *(the empty shells left behind)* | `pg-fiber` `pg-scan` `pg-power` `pg-cli` `pg-compass` `pg-twin` | — | — | These are what Stage 6/7 finally delete, **after** their organ is re-sourced |

## Two mechanisms, and only one of them is safe to reason about casually

**A · Move the node** — organs 1, 4, 8. `dest.appendChild(src)`. Idempotent, guarded on
`parentNode !== dest`. The node keeps its identity, so `getElementById` in the owning module keeps
working — this is the *"re-home, don't rebuild"* rule, and it is why `issue_renderList` never noticed
it moved.

**B · Drain and wipe** — organs 2, 3, 5, 7. `dest.innerHTML = ''` then `while (src.firstChild)
dest.appendChild(src.firstChild)`.
⚠ **This DESTROYS whatever the redesign had in that container** before moving legacy children in.
`#rf-hw`, `#rf-cli` and `#rf-hwref` ship with a placeholder div that exists only to be wiped. So any
content authored directly into those scaffolds is deleted at boot — **which is exactly what a naive
Stage 6 "just put the markup in the redesign container" fix would produce.** Move the markup **and**
delete the re-home in the same ship, or the boot wipe eats the fix.

## ⛔ The ordering chain is load-bearing

`DOMContentLoaded` handlers fire in registration order, and three of these depend on it:

```
homeKnow (:23105) → homeOptics → homeScan → homeIssues → homeHardware (:23180) → homeCompass (:23367) → homeCLI → homeHWRef
```

1. **`homeKnow` MUST run before `homeHardware`.** `#pw-rb` lives inside `pg-power`. Know moves it
   out first; Hardware then drains what remains. Reverse them and the Runbook is swept into
   Reference→Hardware and Know is empty. The code says so at `:23098`.
2. **`homeCompass` MUST run after `homeHardware`.** It appends its new `#pw-compass` panel and a
   stab into `#rf-hw .subtab-strip` — a strip that only exists there **because Hardware moved it**.
   Run it first and it returns early on `!strip`, silently, and Cage Nut never appears.
3. `homeHWRef` is last and independent.

## Runtime side effects that outlive the DOM move

These are not DOM moves and will not show up in a markup diff:

- **`STAB_GROUPS['pwr-sub']` is mutated twice.** `homeKnow` *removes* `'pw-rb'` (`:23101`) so
  Hardware's subtab switching cannot strip the Know panel's `stab-active`; `homeCompass` *pushes*
  `'pw-compass'` (`:23359`). Delete the functions without replicating these and subtab switching
  misbehaves in ways no static check catches.
- **`initSubtab()` is re-run against the NEW location's selector** by organs 2, 5 and 7 — e.g.
  `initSubtab('pwr-sub', 'pw-power', '#rf-hw .subtab-strip .stab')`. The subtab groups are bound to
  a CSS path that only resolves after the move.
- **`homeHardware` hides three stabs** by regex on their `onclick` (`pw-rb|pw-rm|pw-blast`,
  `:23172`) — R-3b routing decisions encoded in a runtime `style.display`, not in CSS.
- **`homeCompass` drops the `.cn-header`** ("Back to Triage") while moving children.
- **`homeHWRef` removes `.hwm-hdr`** before moving, and calls `hwMatrix_render()` afterwards.

## Recommended sequence — safest first, and why

The ruling says 5–8 ships. This is the order I would take them, lowest blast radius first, so the
pattern is proven on cheap organs before it is applied to a pillar:

| Order | Organ | Risk | Rationale |
|---|---|---|---|
| 1 | `#issue-page` (4) | **low** | Move-node, single element, one door, no `STAB_GROUPS`, no `initSubtab`. `pg-twin` is already an empty shell otherwise — the cleanest possible proof of the pattern |
| 2 | `.hwm-inner` (8) | low–med | Move-node, independent of the ordering chain |
| 3 | `#pg-cli` (7) | medium | Drain+wipe, one subtab group, no chain dependency |
| 4 | `#pg-fiber` (2) | medium | Drain+wipe, one subtab group |
| 5 | `#pw-rb` + `#pg-power` (1, 5) | **HIGH — one ship** | They are entangled by ordering; splitting them re-creates the bug `:23098` documents. Carries BLAST RADIUS |
| 6 | `#pg-compass` (6) | high | Must follow 5. Synthesises a panel and a stab that exist in no markup |
| 7 | `#pg-scan` (3) | **HIGH, do last** | SCAN is a primary nav pillar. Prove the pattern six times before touching it |

## How to prove each one, before the phone

Per organ, the ship is only safe if all four hold:

1. **The redesign surface renders from its OWN markup with the re-home function deleted** — not
   merely "still works", which the re-home would provide anyway.
2. **`?legacy=1` still renders the same organ**, until Stage 7 removes that requirement.
3. **No silent empty.** Any surface that resolves no content must say so — this stage's whole
   failure mode is a blank panel that reports success.
4. **The subtab strip still switches**, including the `STAB_GROUPS` and `initSubtab` effects above.

⚠ **Automated coverage is thin here.** No spec drives `redesign_home*` directly. A spec asserting
each destination is non-empty after boot — for all nine organs — is worth writing **before** ship 1,
and would have caught any of these failures without a device pass.

---

**HELD. No Stage 6 ship starts until John approves this inventory.**

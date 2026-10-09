# IA-SHIFTNAV v2 — PHASE 1 PROPOSAL (P-1…P-5)

**Commission:** `SHIP-HANDOFF-IA-SHIFTNAV-v2.md` §5. Phase 0 (v1 census + E-8/E-9/E-10) is the
evidence base; `docs/IA-SHIFTNAV-V2-PHASE0-EVIDENCE.md` is the anchor of record.
**Baseline:** `main` @ `c412bdc`, **`phantom-v1.14.563`**.
**Status:** ⛔ **PROPOSAL ON PAPER. NOTHING SHIPS FROM PHASE 1.** No code, no anchors re-cut.
**Owner rulings this proposal is built on (all 2026-09-01):** E-8 — the tools stay doors, no data
change · model depth — the deployment step stays, the picker resolves it · ISOLATE is not dangerous ·
SCAN is v2 §2 · SCAN-PILLAR retired.
**Amended 2026-09-02 by `SHIP-HANDOFF-IA-SHIFTNAV-v2-ADDENDUM-B.md`** — the Build-screen worked
example. It changes no ruling; it supplies the concrete anchor P-1 lacked, a real path for P-3's
table, and the stranger test's named task. It also carries **P-9**, which the punch list asked be
recorded here as a hard requirement.

---

## §0 · THE MEASUREMENT THE MODEL-DEPTH RULING REQUIRED

> *"Phase 1 measures it before drawing the picker."*

**Rack labels CAN collide across deployments. Record ids cannot.** From `deploy_seedRacksAndPhases`:

```js
var rackId = 'rack_' + deployment.id + '_' + idx;   // the RECORD id
allRacks.push({
  id: rackId,                              // embeds deployment.id -> GLOBALLY UNIQUE
  deploymentId: deployment.id,
  rackId: sr.name || ('Rack-' + (idx + 1)), // the LABEL, straight from the Master -> NOT scoped
  ...
});
```

⭐ **This resolves the residual in the picker's favour, with one condition.** `deploy_loadRacksFor(deployId)`
filters by `deploymentId`, and the working precedent at `:24075` searches **only the active
deployment's racks**. Inside one deployment a duplicate label is a Master data defect, not an app
defect. **So the picker is safe exactly as long as it scopes its search to the active deployment.**

⛔ **THE CONDITION, AND IT IS THE PICKER'S ONE HARD RULE:** if the picker ever offers
cross-deployment search, it owes a **disambiguation**, never a silent pick — Contract B14. A
scanned `s4:099` that exists in two deployments must ask, not choose.

---

## P-1 · ASSIGNMENT — NOTHING UNASSIGNED

### Rack-scoped (inside the rack screen)

| surface | why it qualifies at zero data cost |
|---|---|
| Five phases (MECH → PWR → NET → COMP → VAL) + checks | already rack-scoped |
| Devices list + U per row | `slot.uStart`/`uEnd` already render at `:41902` |
| Assign · QR · log note · photo evidence · flags | already on the rack screen |
| **ISOLATE** | sessions carry `rackId` — the only rack-keyed tool |
| **RACK MAP** | rack-*addressed by input*; seedable with the current rack, no store touched |
| `SEE IN AISLE` | **already exists** as `OPEN AISLE` `:41784` |

### ⭐ THE NINE BUILD DOORS — ADDENDUM B'S ANCHOR, ASSIGNED

Addendum B counts what the Build overview presents as separate destinations at `.570`. **P-1 said
"nothing unassigned"; this is the list it was missing.**

| Build door today | Assignment | Basis |
|---|---|---|
| Rack List | **short-list door** — half of the one picker | §1 |
| Floor Map | **short-list door** — the picker's other view | *how you pick*, not a second destination |
| Acceptance | **rack-scoped view** | ⚠ rack-keying **unmeasured** |
| Handoff | **rack-scoped view** + the one fleet handoff | ⚠ rack-keying **unmeasured** |
| History | **rack-scoped view** | ⚠ rack-keying **unmeasured** |
| Audits | ⛔ **STAYS A DOOR** | **already measured: `phantom_audits_v1` / `phantom_active_audit`, no `rackId`** — E-8 |
| Burndown | **fleet door** | job-keyed (`dct_burndown_v1`), measured in E-8 |
| Phase Pipeline (fleet) | **fleet door**; the actionable pipeline is on the rack | Addendum B |
| Pause Deployment | **fleet door** | genuinely fleet-wide |

⛔ **AUDITS IS THE ONE ADDENDUM B AND A RULING DISAGREE ON, AND THE RULING WINS.** Addendum B makes it
a view on the rack; **E-8 measured that it carries no `rackId` and the owner ruled that such tools stay
doors with no data change.** The two documents agree on the *mechanism* — Addendum B's own guardrail
says an item with no rack-keyed data is a fleet/shift door, flagged, never silently dropped — so this
is that flag, raised early rather than at design time.

⚠ **THREE CELLS ABOVE ARE UNMEASURED AND MUST NOT BE BUILT ON.** Acceptance, Handoff and History have
**not** had E-8's treatment. Each needs the same question asked — *does its data carry a rack?* — and
each may land where Audits did. **A ship that assumes they are rack-scoped is assuming the finding.**

### Short-list doors (§1's list, kept)

Load / switch Master · **Rack picker** · Shift handoff · SYS · Exit (gesture, not a slot).

### Tool doors — KEPT, per the E-8 ruling

OPTIC LEDGER · AUDITS · BURNDOWN · BLAST RADIUS · MANIFEST · BOM · PORT MAP · SOPs.

⭐ **They do not move.** They stay in the **OPS row on Build**, which is already their canonical
door under the owner ruling of 2026-08-19 (*Build's tool door IS the OPS row*), restored at `.558`
and completed at `.559`. **This is the cheapest possible answer: the assignment is "no change."**

### Closed

| closed | what covers it instead |
|---|---|
| `#cs-fieldtools` (`:13912`) — second path to the same ten tools | the OPS row on Build, same `rd_openOpsTool` door |
| Command as the "status museum" first screen | the rack picker, per §2 |

⚠ **`#cs-fieldtools` is not a free close** — see P-4.

---

## P-2 · THE RACK SCREEN

```
┌──────────────────────────────────────────┐
│ ‹ BACK          s4:099          [flags] │   rack label + blocker count
├──────────────────────────────────────────┤
│  MECH ▸ PWR ▸ NET ▸ COMP ▸ VAL           │   phases spine — the job chain,
│  ●●●●●─────────────────────               │   current phase lit
├──────────────────────────────────────────┤
│  DEVICES (8)                    expanded │   ⭐ default OPEN (Ship 1 of
│   ┌────────────────────────────────────┐ │   RACK-ELEVATION-DEMOTE)
│   │ SW-LEAF-01   U42–U43        [TAG] │ │   sorted U descending
│   │ SRV-COMP-14  U12            [TAG] │ │   U — when unrecorded
│   │ …                                  │ │   ≥44px rows
├──────────────────────────────────────────┤
│  [ OPEN AISLE › ]                        │   exists at :41699
├──────────────────────────────────────────┤
│  ASSIGN    QR    LOG NOTE    PHOTO       │   rack actions, ≥44px
├──────────────────────────────────────────┤
│  ISOLATE · DOWN-LINK                     │   ⛔ NO destructive styling —
│                                          │   owner ruling, it is not dangerous
├──────────────────────────────────────────┤
│  RACK MAP (this rack)                    │   seeded with the current rack
└──────────────────────────────────────────┘
```

⛔ **What is deliberately NOT on this screen:** a `TOOLS` band listing the eight kept doors. That is
the chip row relocated, not closed — the §6 gate names it as the archetypal false-progress move.
The eight stay one level up, on Build's OPS row.

---

## P-3 · DOCK AND TAP COUNTS

⛔ **SUPERSEDED — OWNER RULING 2026-09-03: `SHIP-HANDOFF-INTEL-DOCK.md` GOVERNS THE DOCK.** The dock
is `COMMAND · BUILD · TOOLS · GHOST` — four slots — and EXIT moves to the last item of the SYS menu.
**Do not build the three-slot dock below, and do not cite it as a target.** It is kept only so the
reasoning that produced it stays legible.

⚠ **What SURVIVES the supersession, because it was never about slot count:** the tap-count table in
this section, the `.530` label-risk note, and the stranger test's named task. Those measure reach,
not layout.

~~**Proposed dock:** `RACKS` · `SHIFT` · `SYS` — three slots, per §2. Exit stays a hold gesture.~~
Scan lives on the rack and on the picker, never as a slot (ruled).

⚠ **Three slots at 390px is 126px each** — far above the 44px floor and *better* than today's 95px.
The `.530` label risk that forced COMMAND→DECK **evaporates at three slots**, which is why that
ruling is probably moot (recorded, not assumed).

### Tap counts — measured baseline, projected after

| action | now | after | note |
|---|---|---|---|
| ⭐ **Reach one rack's long-phase warning** | **4 screens** | **2** | Addendum B: the owner hunted it across 3D aisle → phases panel → Build overview → rack detail and could not land on it directly |
| Reach a rack from cold launch | 3 | **2** | picker is the first screen |
| Devices + U for this rack | 3 | **2** | expanded by default |
| ISOLATE for this rack | 4 | **3** | on the rack, not the row |
| RACK MAP for this rack | 4 | **3** | seeded |
| Any of the eight tools | 4 | 4 | ⛔ **unchanged — E-8 ruling** |
| Aisle view of this rack | 4 | 4 | already exists |
| Shift handoff | 3 | **2** | dock slot |
| Scan a device into this rack | 4 | **2** | on the rack |
| Scan a rack label to open it | — | **2** | new capability, on the picker |
| Exit / freeze | 1 hold | 1 hold | unchanged |

### ⭐ THE STRANGER TEST NOW HAS A NAMED TASK

From Addendum B, drawn from the failure that produced it:

> **"Rack S3:171 has been on POWER too long — get to that warning."** Count taps and seconds.

⛔ **This is the acceptance bar, and it is not a formality.** The owner — who built PHANTOM — took
**four screens** to find that banner on `.570`. If the author cannot land on it, a gloved tech at
2am cannot. ⭐ **The banner in question is the one `.570` repaired** (`:55988`): it carried **two**
independent defects — it stated a fabricated *"typical"*, and it is unreachable. `.570` closed the
honesty half; **this ship closes the findability half**, and neither surfaced the other.

---

⛔ **The "now" column is projected from the `.557` Phase 0 census plus the `.558`/`.559` changes,
not re-measured at `.563`.** Phase 0's own table is the named baseline. **The ship that lands any
of this re-measures before and after** — every number here is a design target, not evidence.

✅ **RULED (owner, 2026-09-01) — `03-tools`' reachability pin is RETIRED.** It asserted ops tools
were *one tap from the Build landing* and was an expected-failure at `.563`, because
`48-ops-row-exists:136` confirms the row is **collapsed at boot BY DESIGN** — its doors are
correctly invisible until the tech taps OPS. The owner accepted the 1→2 tap trade at `.559`, so the
pin encoded a **superseded** standard and would have stayed red forever describing intended
behaviour.

⭐ **Retired, not re-pointed, because the accepted trade is already pinned canonically in
`48-ops-row-exists`** — `:54` the door (tap 1), `:72` the ten tools on expand (tap 2), `:136` the
collapsed-boot control. Re-asserting it in `03-tools` would have been a second test for one fact:
the one-canonical violation in test form. ⚠ **The old test's own guard is honoured** — it read *"Do
not repoint this at Command to make it green… weakening the test to fit the code."* Nothing was
repointed and no assertion was weakened; **the standard changed by ruling, and the test holding the
new standard already existed.** **Measured: `03-tools` 29 → 28 tests; 10 failed / 23 passed with
`48` — the ten F-1 failures byte-for-byte unchanged.**

---

## P-4 · DOOR LEDGER

| path today | after |
|---|---|
| Command first screen (status museum) | **closed** — picker is first |
| `#cs-fieldtools` → ten tools (`:13912`) | **closed on phone, KEPT on desktop** (ruled) |
| Build → OPS row → ten tools | kept — the one canonical tool door |
| Build workspace | kept, reached from the rack/picker |
| Tools bay (`pg-ref`) | kept — reference, zero-state |
| Shift handoff | kept, promoted to a dock slot |
| SYS | kept, promoted to a dock slot |
| EXIT dock slot | **closed as a slot** — stays as a hold gesture |
| `OPEN AISLE` `:41784` | kept — **not re-opened as `SEE IN AISLE`** |
| Rack picker | **new** — but it replaces the Command first screen, not an addition |

**Net: −2** (Command-as-first-screen, EXIT's slot) **against +1** (the picker, which replaces what
it closes). ✅ **RULED: the desktop keeps a path**, so `#cs-fieldtools` is a **re-home off the
phone, not a close** — it does not score. **Honest net: −1, and it is a slot rather than a
destination.**

⛔ **THIS IS THE ACHIEVABLE NET, AND IT IS SMALLER THAN v2 IMAGINED — SAID PLAINLY PER §7.** The
E-8 ruling keeps eight tool doors, so the closable set is duplicate *paths*, not the tools. **No
number is manufactured to satisfy P-4's own rule.**

✅ **RULED (owner, 2026-09-01): THE DESKTOP KEEPS A PATH.** `.559` measured the cost of deleting
`#cs-fieldtools` outright — it *"would break `03-tools`' order-sensitive wall assertion **and**
strip desktop tool access at ≥1024."* The ruling preserves that access: **the phone loses the
duplicate, the desktop keeps its door.** ⛔ **That makes it a re-home, not a close, and P-4 scores
it as one — honest net −1.** ⭐ **Contract A2 was never at risk either way:** both entry points
already call the one canonical `rd_openOpsTool`, and **two compositions reaching one door is not
two doors.**

---

## P-5 · SHIP SLICING

Smallest honest sequence. One visible change each. **None is authorised by this document.**

| # | ship | why here | risk |
|---|---|---|---|
| **1** | **DEVICES defaults expanded, sorted U-descending, Cold Aisle sizing, explicit `U —`** | RACK-ELEVATION-DEMOTE Ship 1, already specced and measured; the U ranges already render at `:41902`. Closes no door but makes the rack screen the place the U data lives | **low** — one `<details>` attribute, a comparator that already exists at `:41171`, and sizing |
| **2** | **Rack picker becomes the first screen after Master load** | the single biggest §0 move; retires the status museum | **medium** — new surface, must scope search to the active deployment |
| **3** | **Dock → `RACKS · SHIFT · SYS`** | three slots, EXIT loses its slot and keeps the gesture | **medium** — nav change, one device verify, `01-nav` re-pins |
| **4** | **ISOLATE + RACK MAP onto the rack screen, seeded** | the only two tools that can be rack-scoped at zero data cost | low-medium |
| **5** | **`#cs-fieldtools` disposition** | needs P-4's open question ruled first | **held** |

⭐ **Ship 1 is deliberately not a door change.** §5 asks for "the most doors closed for the least
code," but under the E-8 ruling the door-closing ships all carry surface risk, and Ship 1 is the one
that makes the rack screen *worth* landing on — which every later ship depends on. **Stated as a
deviation from §5's suggestion rather than silently reordered.**

---

## BOUNDS

- ⛔ **Paper. No code, no anchors re-cut.** Every `file:line` here is carried from
  `docs/IA-SHIFTNAV-V2-PHASE0-EVIDENCE.md` at `.563` and must be re-verified by the ship that uses it.
- ⛔ **P-3's tap counts are design targets, not measurements.** The "now" column is projected from the
  `.557` census plus `.558`/`.559`; nothing was re-measured at `.563` and nothing was measured on a
  device.
- ⛔ **P-2's layout is a sketch of order and grouping, not a visual design.** Spacing, type and
  materials come from `PHANTOM_DESIGN_SYSTEM.md`, which is the lock.
- ✅ **P-3's and P-4's open questions were both RULED on 2026-09-01** and are folded in above: the
  desktop keeps a path (so the net is −1, not −2), and the `03-tools` pin is retired in favour of
  `48-ops-row-exists`. **The pin retirement is the only change in this document that touched code** —
  a test file, no product source, no stamp.
- 📌 **The picker's one hard rule is in §0 above:** scope the search to the active deployment, or owe
  a disambiguation. It is repeated in P-5's Ship 2 risk column because that is where it bites.
- ⚠ **ADDENDUM B IS FOLDED IN, BUT IT IS AN ILLUSTRATION, NOT A MEASUREMENT.** Its nine-door count
  is an owner walkthrough of `.570` on device; the doors were confirmed to exist in source, but
  **their data scoping was not measured except where E-8 already had.** Acceptance, Handoff and
  History remain unmeasured and are the next Phase 0 pass this proposal owes.
- ⛔ **The four-screen figure is the owner's count, not an instrumented one.** It is recorded as
  reported. The ship that lands this re-measures both columns, as P-3 already requires.
- ⛔ **EVERY `file:line` IN THIS DOCUMENT WAS RE-SWEPT AT `.570` AND FOUR HAD DRIFTED.** The proposal was written at `.563`; `.564`–`.570` moved the file. `:24005`→`:24075`, `:41086`→`:41171`, `:41699`→`:41784`, `:41800`→`:41902` (the last also *rewritten* by `.564`, so it is a different statement, not just a different line). **This is F-4b: an anchor is only valid against a stamp.** Re-sweep before using any of them.

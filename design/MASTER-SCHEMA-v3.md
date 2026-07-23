# MASTER SCHEMA v3 — RECON RESULTS + TEST FIXTURE
**Phase 1 of `HANDOFF-MASTER-FULL-INGEST.md` is COMPLETE.** Headers below are **observed**, read from two real files, not guessed.

**Sources:** two real production Masters (site codes + filenames redacted) — a 6-sheet site Master and a 7-sheet BOM workbook.
**Fixture produced:** `MASTER-US-CENTRAL-AUS03-TEST.xlsx` — fictional site, safe to commit.

> **Legend:** ✅ OBSERVED = header read verbatim from a real file, build against it.
> ⚠️ PROPOSED = sheet the parser names but which was **absent** from the real Master. Shape is a guess — **confirm against a real file that has it before building a consumer.**

---

## 1. RECON RESULT — what the real Master actually contains

The 6-sheet real site Master, sheets in file order:

| Sheet | Rows | Cols | Parser today |
|---|---|---|---|
| OVERHEAD | 2 | 3 | discarded |
| LEGEND-NET | 3 | 2 | discarded |
| WIP | 11,658 | 20 | **parsed** |
| CUTSHEET | 6 | 20 | ignored (WIP wins) |
| SITE-HOSTS | 2,371 | 21 | **parsed** |
| SITE-VARS | 4 | 2 | discarded |

**Two findings that matter:**

1. **`LEGEND-GPU`, `LEGEND-CPU`, and `SITE-NODE-DATA` were NOT in the file.** The parser names them in `sheetsSkipped`, but this Master doesn't carry them. They are optional at best, possibly aspirational. **Do not build hard dependencies on them.** This vindicates the graceful-degradation invariant (§7).
2. **`SITE-VARS` is tiny — 3 keys** (`site`, `fabric`, `customer`). It is the right *mechanism* for site pre-fill, but a real Master today would pre-fill only three fields. Richer pre-fill requires either extending what the Master authors write, or sourcing from BOM cover sheets (§4).

---

## 2. ✅ OBSERVED — SITE-HOSTS (21 cols, required)

```
#, LAST-PROVISIONED, LOCODE, LOC(cab:ru), DNS, MODEL, SERIAL, ROW-TYPE, ROLE,
TAGS, IPV4, IPV6, GRID-GROUP, GRID, GRID-POD, ASN, RAIL, PLANE, SUPERPOD-ID,
LEAF-GROUP-ID, FABRIC
```
Sample (site code / DNS / serial redacted): `1 | 2026-05-08 | <SITE> | c1:001:44 | leaf-c1-001-a.<site>.<tld> | NVIDIA Quantum-2 QM9700 | <SERIAL> | ib-fabric | leaf | ndr;400g;qm9700 | …`

- `LOC(cab:ru)` format is **`row:cabinet:ru`** — `c1:001:44` = row C1, cabinet 001, RU 44.
- **Divider rows exist**: col A contains `──── HOSTS ROW C1 ────` with all other cells empty. Must be skipped, not parsed as a host.
- `ROW-TYPE` values seen: `ib-fabric`, and by extension compute/mgmt. `ROLE`: `leaf`. `TAGS` are `;`-delimited.

## 3. ✅ OBSERVED — WIP / CUTSHEET (20 cols, identical headers)

```
#, A-LOCODE, A-LOC(cab:ru), A-DNS, A-MODEL, A-PORT, A-BRKOUT-CAB,
A-BRKOUT-SLOT/PORT, A-OPTIC, A-PATCH,
Z-LOCODE, Z-LOC(cab:ru), Z-DNS, Z-MODEL, Z-PORT, Z-BRKOUT-CAB,
Z-BRKOUT-SLOT/PORT, Z-OPTIC, Z-PATCH, CABLE-ID
```
- Symmetric A-side / Z-side, 9 columns each, plus `#` and `CABLE-ID`.
- **Divider rows**: `════════ ROW C1 ════════` in col A.
- The real CUTSHEET is deliberately loaded with rows reading `DECOY-SHOULD-BE-IGNORED-n` — that file is a **precedence test fixture**, proving WIP must win. Preserve that behaviour exactly.

## 4. ✅ OBSERVED — SITE-VARS / LEGEND-NET / OVERHEAD

**SITE-VARS** — `KEY | VALUE`. Observed keys: `site`, `fabric`, `customer`.
**LEGEND-NET** — `MODEL | SPEED`. e.g. `QM9700 → 400G NDR`, `SN2201 → 1G mgmt`.
**OVERHEAD** — *not* a table. Row 1 is a title, row 2 is a bare list (`PDU whips`, `busway`, `CRAH units`). **Freeform. Do not parse as tabular data.** Surface as notes or skip.

## 5. ✅ OBSERVED — the BOM workbook (two distinct sheet shapes)

**Shape A — cover/metadata sheets** (per-datahall cover tabs; real sheet name redacted): scattered key/value pairs, not a table. Carries Region, LOCODE, Customer, DH, Phase, Stack/HPC Net, Physical Access / Power Delivery / Production Due dates, status flags (`Overhead: Complete`, `Cutsheets: Not Complete`), staffing, and a Q&A block.

> **This is the richest site-profile source that exists** — far richer than SITE-VARS. If site pre-fill should include region, customer, phase, data hall, and due dates, this sheet has them today. But it is **irregular in layout** (values sit at varying column offsets across sheets), so parsing it is label-driven, not positional. Treat as a Phase 4 candidate, not a quick win.

**Shape B — line-item sheets** (per-CID tabs; real CID numbers redacted) — **this is the actual BOM**:
```
Status, LoCode, Data Hall Row / Rack, CAP # & Description, Category - Link (IM),
Type - Link (IM), Part #, Description - Link (IM), Qty, Qty + Spares,
Qty On-Hand, Qty Short, SHIP / PROC Request, PO #, Vendor,
Estimated Delivery Date, Created By, Created, Modified By, Modified
```
- `Status`: `Complete`, `NA`, `In Progress`, blank.
- `Category` is ordinal: `1. Rack/Cabinet`, `2. Power`, `3. Stackable Unit`.
- Section header rows appear with a label in the Description column and no data — skip like dividers.
- **`Qty Short` is the blocker signal.** Non-zero = material gap. That belongs on the BLOCKERS surface.
- **PII columns** (`Created By`, `Modified By`, `PO #`, `Vendor`) must never be rendered or stored. Drop at parse.

## 6. ⚠️ PROPOSED — sheets absent from the real Master

**`LEGEND-GPU` / `LEGEND-CPU`** — assumed `MODEL | SPEED`, mirroring LEGEND-NET. Reasonable, unconfirmed.
**`SITE-NODE-DATA`** — fixture proposes `MODEL | U-HEIGHT | KIND | PSU-COUNT | WATTS`. **This is invention.** U-height would be genuinely valuable (rack elevation currently infers it), but do not build against this shape until a real file with the sheet is in hand.
**`JOBS`** — does not exist in any real file. Introduced by the fixture as the burndown scope carrier (§7).

## 7. BURNDOWN — scope in, burn computed (ruling stands)

The fixture's `JOBS` sheet carries `JOB-ID, PHASE, SCOPE-TYPE, SCOPE-REF, SCOPE-QTY, UNIT, TARGET-DATE` and **deliberately has no percent-complete column.** Phases match the existing empty-state flow: PLAN → SCOPE → WORK → VERIFY → CLOSE.

Scope can also be derived without a JOBS sheet at all: **WIP row count = ports to land** (128 in the fixture, 11,658 in the real Master). That is the honest denominator, and it already exists in every Master.

`burndown_buildSeries` takes the denominator from the Master and the numerator from logged work. Never import a completion percentage.

---

## 8. THE FIXTURE — `MASTER-US-CENTRAL-AUS03-TEST.xlsx`

Fictional site **AUS3 / US-AUS03**. Every hostname, serial, IP, part number, ship request, and date is invented. **No CoreWeave personnel, customer, vendor, or procurement data.** Safe to commit as a test asset.

| Sheet | Content | Tests |
|---|---|---|
| `_README` | inventory + intent | self-documenting |
| `SITE-VARS` | **18 keys** | Phase 2 pre-fill at full richness |
| `SITE-HOSTS` | 28 hosts, 4 cabinets | required path + divider skip |
| `WIP` | 128 IB cables | required path + divider skip |
| `CUTSHEET` | 5 decoy rows | WIP precedence |
| `LEGEND-NET/GPU/CPU` | model → speed | fills the empty `legends{}` |
| `SITE-NODE-DATA` | model → U-height/kind | ⚠️ proposed shape |
| `OVERHEAD` | freeform notes | must not be parsed as a table |
| `BOM` | 9 line items | `bom_ingestParsed()` route |
| `JOBS` | 5 phase rows, scope only | burndown denominator |

**Deliberate test conditions:** divider rows in both required sheets · CUTSHEET decoys · **3 BOM lines with non-zero `Qty Short`** (blocker surface) · JOBS carries no completion column · counts are internally consistent (JOBS J-002 says 28 hosts; SITE-HOSTS has exactly 28).

Topology: 4 cabinets `c1:001`–`c1:004`, each with 4× HGX H200 (8U, RU 1/9/17/25), 2× QM9700 leaf (RU 43/44), 1× SN2201 mgmt (RU 42). 8 OSFP ports per GPU node → 128 cables.

Deterministic (`random.seed(1337)`) — regenerating produces the same file.

---

## 9. REVISED PHASE ORDER

1. ~~Phase 1 recon~~ ✅ **done — this document.**
2. **Phase 2 — SITE-VARS → site profile pre-fill.** Build key-driven (not positional); tolerate unknown keys; ignore missing ones. Works with 3 keys or 18. Only editable field: technician name.
3. **Phase 3 — LEGEND-NET → `legends.net`.** Ship the one legend that verifiably exists. GPU/CPU wire the same way but degrade to null.
4. **Phase 4 — BOM line-item sheet → `bom_ingestParsed()`.** Drop PII columns at parse. Surface `Qty Short` as blockers.
5. **Phase 5 — burndown denominator from WIP row count.** No JOBS dependency.
6. **Deferred — BOM cover sheets, SITE-NODE-DATA, OVERHEAD.** Need either irregular-layout parsing or a real file that contains the sheet.

**Invariants unchanged:** extend `phantom_parseMaster`, never rewrite · new sheets are enrichment, only SITE-HOSTS + WIP/CUTSHEET hard-block · everything through `PHANTOM_MASTER_STORE` with quota pre-flight · one phase per ship · both agents before every commit.

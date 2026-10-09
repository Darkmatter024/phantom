# SHIP-HANDOFF-IA-SHIFTNAV — ADDENDUM A
**Pattern harvest from the Grok five-pillar mock**
Status: amendment to SHIP-HANDOFF-IA-SHIFTNAV.md · same HELD status, same gates, same standing rules.
The mock itself is a disposable reference. **No code is ported from it — ever.** It is React on a server stack; PHANTOM re-implements every adopted pattern natively in dct-ios.html's own vanilla JS/CSS, in PHANTOM's own visual language, against verified anchors. The mock is not given to Claude Code as source; only this addendum travels.

---

## A1. Two doctrine additions (apply app-wide, not just new screens)

**D-1 · A claim cannot outrank a mismatch.** When recorded data contradicts an operator's assertion, the data wins and the stored result reflects the mismatch. First application: scan commit — if scanned optic PN ≠ port-map expected PN, the record is FAIL even if the tech taps PASS (the tap is logged as the operator's claim; the result field is the system's honest verdict). Pattern generalizes to any verify surface.

**D-2 · Every log line credits the actor.** Site lead = authority; operator = whoever holds this phone; all events, blockers, scans, notes, and photos stamp the operator. No anonymous evidence. Operator is set on SHIFT; NEXT chain blocks forward work until an operator exists.

## A2. NEXT chain — extended priority order (supersedes §3 ordering)

1. Site not confirmed → `Confirm site` (no floor work against an unconfirmed Master)
2. No operator set → `Set operator on Shift — work is credited to the actor`
3. Active blocker / down-link → `Clear blocker: <title>` → lands in isolate flow (unchanged from §3, including the rackless-blocker ruling John still owes)
4. Unverified work exists → verify entry
5. Open phase → `Continue Build — <phase> is still open`
6. Nothing open → `Generate the handoff on Shift`
7. Zero-state → `Load Master` / `Start deployment`

## A3. Dock (Phase 1 scope) — mechanics adopted, skin rejected

Adopt: five equal tabs · sliding thumb indicator under the active pillar (CSS transform, ~200ms ease) · live blocker-count badge on BUILD · `env(safe-area-inset-bottom)` padding · 44px minimums.
Reject: the mock's flat/lucide aesthetic. Icons and materials remain PHANTOM's photoreal/glass language. Existing NAV icon assets are re-used; one new pillar icon (SCAN) is sourced through the established art pipeline before Phase 1 ships — art is a Phase 1 dependency, flag it early.

## A4. BUILD additions (Phase 3 scope)

- **Rack chip strip** at top: horizontal scroll of rack chips, active chip filled; tap = switch active rack. 44px, gloveable.
- **Expect-vs-Scanned port table** in the "Check" band: columns Port · Expect · Scanned · Role; scanned cell color-coded (match / mismatch / unscanned). Mismatch rows are D-1 territory — they render as FAIL, never amber "close enough."
- **Empty-rack copy**: an empty elevation renders "EMPTY CAB · STILL A RACK" — blank is never an erase, and empty racks stay visible on every roster.
- **Blocker form microcopy**: detail placeholder reads "What you saw. Not a guess." Severity is a three-way choice (BLOCKER / WARN / NOTE), gold-highlighted, one tap.
- **Explicitly rejected**: tap-to-toggle phase completion. Phases advance only from recorded evidence (scans, verifies, stamps). A phase tile with no evidence behind it is display, not a button.

## A5. SCAN additions (Phase 4 scope)

- D-1 enforcement at commit (see A1).
- Honest-state labels: any simulated/demo/no-data state names itself on-surface ("NO LIVE TELEMETRY", "IDENTIFIED FROM CATALOG — NOT A SWITCH READING"). No synthetic value ever renders styled as a live reading (matches the forge findings; same rule, front door).
- Port seat picker after identify: grid of expected ports from the port map, then PASS/FAIL commit. The port map is presented as "the expected partner, not a switch reading."

## A6. TOOLS additions (Phase 5 scope)

- One filter field at Tools root, filtering across all bays.
- Copy-to-clipboard on every CLI/command card, with a 1-second "COPIED" state.
- Triage cards structured **cause → fix**, two short paragraphs, no walls of text.
- (Ghost Echo already covers the mock's "tribal cache" — no new store; the pattern confirms Ghost Echo belongs surfaced in TOOLS' Paper bay as well as SHIFT.)

## A7. SHIFT additions (Phase 6 scope)

- **Identity panel**: Operator field + `SET ACTOR` action; site lead displayed as authority-of-record. Feeds D-2.
- **Shift-end countdown**: presets 06:00 / 18:00 / +12h / CLEAR; remaining time renders on SHIFT and as the third Command stat when set (Command stats become RACKS · BLOCK · SHIFT-REMAINING when a shift clock exists, else %-complete as spec'd).
- **Hold-to-freeze interaction (locked design)**: 800ms press-and-hold with a visible progress fill; releasing early cancels; completion freezes. Frozen screen: full-bleed "PHANTOM · FROZEN — shift state saved · nothing lost" with a hold-to-wake ring (same 800ms + clip-path fill). No single-tap path to freeze or wake anywhere. This is the R-02a implementation: EXIT is not a nav pillar.
- **Actor-credited event log**: newest-first, `time · actor · text`, capped render with full log in the record. This log is an adapter input to the Rack Record assembler, not a parallel store.
- **Handoff honesty banner**: the generator states its scope on-surface — "written from this device's records only" — and the renderer inherits the coverage-honesty manifest from the intelligence-core spec (what was and wasn't captured, no silent gaps).

## A8. Phase-mapping summary (for the executor)

| Addendum item | Ships in |
|---|---|
| A2 extended NEXT chain | Phase 2 |
| A3 dock mechanics (+SCAN icon art dependency) | Phase 1 |
| A4 Build items | Phase 3 |
| A5 Scan items + D-1 | Phase 4 |
| A6 Tools items | Phase 5 |
| A7 Shift items + D-2 | Phase 6 |
| D-1/D-2 as written doctrine lines in CLAUDE.md | with their first shipping phase |

Everything else in the base spec is unchanged: HELD gates, Phase 0 census first, one visible change per ship, graph-before-patch, owner device-verify on every ship, forge.html out of scope.

*End of Addendum A.*

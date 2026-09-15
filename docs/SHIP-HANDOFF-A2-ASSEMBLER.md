# SHIP-HANDOFF-A2-ASSEMBLER
**Status:** HELD — gate is John's GO on this document.
**Act (DOCTRINE-THREE-ACTS):** CLOSE THE LOOP. This slice builds the truth layer every closing artifact (field report, handoff, escalation) will render from. It shortens Act 3 by making "give me the picture" a single assembly instead of N re-queries.
**Extracted from:** PHANTOM-INTELLIGENCE-CORE (John's document — you receive this handoff only, never the source).
**Prerequisites already met:** A.1 recon census delivered and refreshed (docs/A1-RECON-CENSUS-PHANTOM-STORAGE.md); rack-key ruling issued (the composite is the rack key); characterization test pins deploy_generateReport's current output.

---

## 1. Scope — what A.2 builds

The Rack Record assembler core, the adapter registry, and the first four adapters:

1. **identity/phase** (site, rack, tech identity, phase events)
2. **blockers**
3. **notes** (log notes)
4. **photos** (IndexedDB refs only — blob IDs, never blob bytes)

**No UI. No renderer. No behavior change to any existing surface.** The existing report path (deploy_generateReport) is untouched this slice — its characterization test must stay green as proof. The field report renderer is A.3, a separate future handoff.

Verification surface: a temporary dev readout (§6), gated and removed at the end of the slice.

## 2. Binding principles (excerpted; these are law for this slice)

- **P1 — One truth, many renderings.** Nothing outside an adapter reads raw storage on behalf of a Rack Record. Renderers (future) consume Records only.
- **P2 — Adapters own their mess.** Each adapter owns all legacy-shape translation for its data class — timestamp normalization, rack-ID form matching — mapped from shapes the A.1 census documented. Translating a shape not in the census is an invented anchor: stop and report instead.
- **P3 — Coverage honesty.** Every assembled Record carries a coverage manifest: which adapters ran, found data, found nothing, or FAILED to read. `empty` and `error` are different states and must never collapse into each other.
- **P4 — Assembly is on-demand and disposable.** Records are computed when asked, from live storage, and thrown away. Never cached, never persisted.
- **P5 — The AI is never the record.** No AI call anywhere in assembly.
- **P6 — Events over states.** The spine is a merged, time-ordered timeline. Point-in-time state (current phase, open blocker count, photo count) is DERIVED from events at assembly, never stored.
- **P7 — Ship discipline unchanged.** One visible change per ship, patches against verified source, surgical edits, three-stamp lockstep, John's device verify as the hard gate.

## 3. Canon schema (rr-1) — build exactly this

```json
{
  "schema": "rr-1",
  "assembledAt": 0,
  "site":   { "siteId": "", "profile": {} },
  "rack":   { "rackId": "", "platform": "", "masterPresent": true },
  "tech":   { "identity": "" },
  "status": { "phase": { "index": 0, "of": 5, "name": "" }, "openBlockers": 0, "photoCount": 0, "photoBytes": 0 },
  "timeline": [ { "t": 0, "type": "phase.completed", "source": "phases", "data": {} } ],
  "evidence": { "photoIds": [] },
  "coverage": [ { "adapter": "phases", "status": "ok", "events": 0 } ]
}
```

- `rackId` uses the ruled composite key everywhere. Adapters translate any legacy rack-ID forms found in the census to it.
- `timeline` is the merge-sort of all adapters' events. Event shape: `{ t (epoch ms), type (namespaced, e.g. "blocker.opened"), source (adapter name), data }`.
- `status` is computed from the timeline inside the assembler, in one place.
- `evidence.photoIds` are IndexedDB refs only. Blobs load at render time (A.3), never during assembly.
- `coverage.status` ∈ `ok | empty | error` (with `detail` on error).

## 4. Adapter contract (binding, reviewed by adapter-reviewer on every diff)

`{ name, schemaHandled, read(siteId, rackId) → { events[], facts{}, status } }`

- **Pure read.** An adapter never writes, deletes, migrates, or "fixes" storage.
- **Error containment.** `read()` never throws past its boundary; storage errors become `status: "error"` with detail.
- **Honest emptiness.** No data → `status: "empty"`, `events: []`. Never fabricate a default event, placeholder, or assumed timestamp.
- **Scope.** One adapter per data class. No "while I'm here" reads of another store.

The assembler is a fold over the ordered registry plus a timeline merge-sort. Nothing more.

## 5. Ship plan — four ships, one visible change each

- **Ship 1:** Assembler core + registry + identity/phase adapter + dev readout (§6). Readout shows the assembled Record for a chosen rack.
- **Ship 2:** blockers adapter (readout gains blocker events + derived openBlockers).
- **Ship 3:** notes adapter.
- **Ship 4:** photos adapter (refs + counts + bytes) **and removal of the dev readout in the same ship** — the slice ends with no residual UI.

Each ship: recon against verified source first, surgical diff, three-stamp lockstep, e2e precheck where applicable, then John's device verify. Mandatory reviewers per the CLAUDE.md matrix — adapter-reviewer on every adapter/registry diff, data-honesty-auditor on the derived-status code. Silence between ships.

BATCH-OODA may apply to Ships 2–4 only if John GOes them as a batch at the Ship 1 boundary; batch approval never authorizes scope beyond this document.

## 6. Dev readout (temporary verification surface)

- Reachable ONLY via query param `?rrdev=1`. No nav entry, no dock change, no visible trace without the param.
- Renders the raw assembled Record as formatted JSON plus a one-line coverage summary, for a rack John picks.
- John verifies by comparing readout values against known rack truth on device using the torture Masters (MASTER-US-TST99-TORTURE-TEST and MASTER-US-EAST-ATL03-CRUCIBLE): phase state, blocker count, note count, photo count/bytes must match what the app's existing surfaces show — and where existing surfaces disagree with each other (known DATA-HONESTY-COMMAND defects), report the disagreement, do not pick a side silently.
- Removed entirely in Ship 4. A grep gate proves no `rrdev` remnant ships past this slice.

## 7. Acceptance (the slice is done when)

1. All four adapters registered; assembling any rack from a loaded Master returns a valid rr-1 Record.
2. Coverage manifest correctly distinguishes ok / empty / error (prove error by test, not by breaking live storage).
3. deploy_generateReport characterization test still green — byte-identical output, proving zero behavior change.
4. Timeline is strictly time-ordered across sources; derived status matches events for the verified racks.
5. Dev readout gone; grep gate clean.
6. All four ships device-verified by John; stamps and promote are John's, from his terminal, per standing rules.

## 8. Hard fences

- Do not touch any renderer, any nav, deploy_generateReport, or storage writers.
- Do not read or request PHANTOM-INTELLIGENCE-CORE or any roadmap material.
- Anything requiring a product ruling: park it in the Q table of the evidence report and continue; never self-schedule follow-on work.

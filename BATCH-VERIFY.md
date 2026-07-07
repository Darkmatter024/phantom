# BATCH-VERIFY — consolidated device checklist (CALL 0, DIRECTIVE 2026-07-06)
**Protocol:** ships stack; owner runs THIS list once per batch (cap: every 6 stacked ships or before
any HIGH-risk ship). Every ship keeps its own rollback line. Claude Code appends; owner checks off.
**Batch v1.14.192-.197: RELEASED by owner 2026-07-07 ('keep going'). Current batch: v1.14.198 → (open)** · Clear SW cache before the pass.

---

## v1.14.192 — G-1c2 `.gsk` inline plates (`d1758b6`) · rollback: revert commit
- [ ] Rack Map floor view: empty card + rows machined
- [ ] Rack detail: phase card + audit-scan mono row machined
- [ ] Handoff log record cards machined · Deploy audit log entries machined
- [ ] BOM analyze result rows machined · optic scan alternate-match card machined
- [ ] Tombstone modal UNCHANGED (deliberately skipped)
- [ ] `?legacy=1` rack detail/audit log: identical pixels

## v1.14.193 — A-1 ticket intake (`8a63726`) · rollback: revert commit (stateless)
- [ ] (superseded by A-2 UI — verify via the .194 flow below; A-1 plumbing items only:)
- [ ] Import a .txt → chip shows name/KB · oversized (>256KB) file binned with message
- [ ] Deny clipboard permission → machined textarea fallback appears, ATTACH works
- [ ] Close/reopen sheet → ticket gone (stateless) · offline → existing fail-fast unchanged

## v1.14.194 — A-2 intent flow, auto-mic killed (`0c1a5e4`) · rollback: revert commit
- [ ] Tap Ask card → sheet opens, NO mic indicator anywhere in Safari chrome
- [ ] Four machined intent cards render (SPEAK cyan / PASTE violet / TYPE gold / IMPORT teal)
- [ ] SPEAK → mic starts only now · CANCEL → menu, mic off
- [ ] TYPE OR PASTE → native paste works, no permission prompt → ASK PHANTOM → answer addresses it
- [ ] ‹ MENU back leaves nothing stale
- [ ] PASTE TICKET → chip mounts above menu, SPEAK subtitle = "Ask about the attached ticket"
- [ ] SPEAK with chip → answer references ticket · composer + chip → answer uses BOTH
- [ ] ✕ clears chip · `?legacy=1`: va sheet + triage "Ask Assistant" tile unchanged (old behavior intact)

## v1.14.195 — T3 ask-card saturation (`pending`) · rollback: delete the `filter:none` line
- [ ] Ask card on Command: prism art reads clean (was hot/oversaturated) — `.155` precedent value
- [ ] Card still glass (ring/well/violet tint) — only saturation changed

## v1.14.196 — M-1 .mach recipe (CALL 3) · rollback: revert commit
- [ ] Rack Map SCAN-OR-TYPE input: unchanged look (same recipe, now from the .mach block) + cyan focus
- [ ] A-1 clipboard-deny fallback textarea: unchanged look + placeholder legible
- [ ] Any regression on Rack Map search flow (submit still works)

## v1.14.197 — G-1c3 CALL-1 + inline plates (`pending`) · rollback: revert commit
- [ ] Deploy command center: phase-matrix rows machined; a COMPLETE row rings green, PAUSED gold, BLOCKED red, normal slate; phase cells (per-phase colors/glows) unchanged
- [ ] ?legacy=1 deploy list: phase matrix rows show the OLD flat tints (runtime-gated)
- [ ] Optic ledger summary card + Masterfile reconcile card: machined CYAN ring (violet gone — CALL 1)
- [ ] Issue detail cards, handoff record cards, BOM-ingest step cards, EDP parse status, preflight card, nvidia-smi telemetry card: machined
- [ ] BOM-ingest SUCCESS (green) cards + TODAY red blocker rows: UNCHANGED (semantic, deliberately skipped)
- [ ] .195 ask card + .196 inputs items above

## v1.14.198 — G-1d Command + pt-btn · rollback: revert commit (primary = one rule)
- [ ] Command: OPS SIGNAL rows, KPI tiles, header back chip machined; hero lens + stat trio glass w/ cyan glow intact
- [ ] Command QA tile grid: machined housings, per-tile glow/text hues still locate groups at arm length (border tints gone — JUDGE THIS)
- [ ] ⭐ PRIMARY BUTTONS fleet-wide (LOAD MASTER, parse, exports…): now dark cask w/ cyan text + ring (was solid cyan/black text) — JUDGE THE AFFORDANCE; veto = one-rule revert
- [ ] Ghost/secondary buttons machined incl. clip-notch corners; warning/destructive buttons UNCHANGED (semantic)
- [ ] Header ghost button machined; its amber alert state unchanged; shift pill (green) unchanged

## v1.14.199 — S-1 client proxy key · rollback: revert commit (Worker unaffected)
- [ ] Any AI feature (Ask PHANTOM) round-trips normally against the grace-mode Worker
- [ ] (After Worker paste) Cloudflare log shows x-phantom-key arriving; unkeyed count trends to 0

## v1.14.200 — P-2 New Device v2 + .mach true-up · rollback: revert commit
- [ ] Fresh device (cleared localStorage): v2 screen — machined fields w/ brush, comet ring rotating, spotlight follows touch
- [ ] Save minimal (name+site) -> enters app -> SYS > SITE PROFILE shows saved values; floor fields editable later
- [ ] EXISTING-profile device NEVER sees the screen (backfill contract)
- [ ] ?legacy=1 fresh device: the OLD gate, verbatim
- [ ] Rack-ID input + ticket fallback textarea: deeper well + brighter cyan focus (true-up) — still reads right

## v1.14.201 — D-1a stat faces pilot · rollback: revert commit
- [ ] Platforms drill-ins / POWER + COOLING cards: 11 faces render (values collapsed-visible, mono, cyan); 12 procedural cards deliberately faceless
- [ ] ⭐ DENSITY CALL at arm length (gates D-1b): too busy? want the scent line? faces on the right cards?
- [ ] H100 Common Faults card: XID tags w/ gold numbers
- [ ] Spot-audit any face value against the card body it fronts (they must match verbatim)
- [ ] ?legacy=1: cards show NO faces (guard) — pixel-identical to before

<!-- append new ships above this line; checkpoint when 6 deep or before HIGH-risk -->

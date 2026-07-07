# BATCH-VERIFY — consolidated device checklist (CALL 0, DIRECTIVE 2026-07-06)
**Protocol:** ships stack; owner runs THIS list once per batch (cap: every 6 stacked ships or before
any HIGH-risk ship). Every ship keeps its own rollback line. Claude Code appends; owner checks off.
**Current batch: v1.14.192 → (open)** · Clear SW cache before the pass.

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

<!-- append new ships above this line; checkpoint when 6 deep or before HIGH-risk -->

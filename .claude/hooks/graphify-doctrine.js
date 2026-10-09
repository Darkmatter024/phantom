#!/usr/bin/env node
// SessionStart hook — harness-enforced graphify-first doctrine.
// Emits the reminder as additionalContext; runs no rebuild (graph is pinned
// pending SITE-SYNC Phase 0). Shell-agnostic: node owns the JSON, not the shell.
// Ref: SHIP-HANDOFF-GRAPHIFY-AUTORUN.md §3 Option B.

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext:
      "DOCTRINE: Before any patch, read graphify-out/wiki/index.md and the god " +
      "nodes for every file you will touch. Graph is pinned pending SITE-SYNC " +
      "Phase 0 — do NOT run a full rebuild. If graphify output is missing, " +
      "STOP and report; do not proceed unanchored."
  }
}));

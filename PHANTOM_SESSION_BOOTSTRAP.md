# PHANTOM — SESSION BOOTSTRAP

Read this first in a clean session. It is the startup protocol, not a knowledge dump.

## 1 · Orient (2 minutes, in this order)

| Step | Source | What you get |
|---|---|---|
| 1 | `CLAUDE.md` | The 17 contracts, ship discipline, design law. Loads automatically |
| 2 | **`PHANTOM_CURRENT_STATE.md`** | Live version, milestone, open defects, verify debt. **The only state source** |
| 3 | `PHANTOM_SESSION_HANDOFF.md` | What the last session was mid-way through |
| 4 | `git log --oneline -10` | Per-ship truth. Beats any prose summary |

Do not read `INTEGRATION-STATE.md`, `AUDIT.md`, or `ROADMAP.md` — they are archived tombstones
pointing at `archive/2026-08-08/`. If a doc's claimed version disagrees with `version.json`, the
doc is wrong.

## 2 · Confirm reality before editing

```bash
curl -s https://darkmatter024.github.io/phantom/version.json          # what is actually live
node -e "console.log(require('./version.json').version)"              # what the tree carries
git status -sb                                                        # what is uncommitted
```

If live ≠ tree, find out why before touching anything. A stale baseline is how a re-anchor turns
into a revert.

## 3 · Know what is enforced for you

**`tools/hooks/phantom-guard.js` runs automatically** on every Edit/Write and before every commit.
It blocks on: broken three-stamp lockstep · non-compiling inline script · brace imbalance · damaged
CRLF on `dct-ios.html`/`sw.js` · a backtick in a commit body. You do not need to check these by
hand, and you must not work around the block — fix the cause.

**`test/e2e` is the regression baseline** — 128 tests, `retries: 0`, 5 viewport projects.

```bash
cd test && npx playwright test --project=phone-webkit --reporter=line   # the gate, ~15 min
cd test && npx playwright test --reporter=line                          # full matrix, ~4 hours
```

`phone-webkit` is the declared primary gate — *"Everything must pass here first."* Run the full
matrix only when a change is compositional. **A `test.fail()` is a PINNED DEFECT**, and *"Expected
to fail, but passed"* is your proof a fix landed. Never widen the console allow-list to get green.

⚠ **Pipe buffering:** `npx playwright test | tail -N` prints nothing until the run ends — it reads
exactly like a hang. Redirect to a file with `--reporter=line` instead.

## 4 · Before you ship

1. Bump all three stamps together — `dct-ios.html`, `sw.js`, `version.json` (the hook enforces it).
2. Run `phone-webkit`. Green, or explain precisely what failed.
3. Commit with a heredoc (`git commit -F - <<'EOF'`), never `-m` with backticks.
4. Push, then **verify the served bytes**, not just the stamp — poll live `version.json`, then grep
   the served `dct-ios.html` for a marker unique to the change.
5. **Close the loop:** show `git log -1 --oneline` and `git status`.
6. Append the ship to `PHANTOM_CURRENT_STATE.md` and add a block to `BATCH-VERIFY.md`.
7. **PARK.** Device verify is John's, on physical hardware. Do not start the next ship.

## 5 · Standing traps that have each cost a ship

- **`sed -i` destroys CRLF** on `dct-ios.html`/`sw.js`. Use Edit. (Now hook-blocked.)
- **Verify token NAMES against `:root`.** `--vio`/`--mag` exist only under `#boot`; an undefined
  `var()` invalidates the declaration silently — no error, no paint.
- **Bytes shipped ≠ bytes rendered.** Verify the display surface, not the deploy.
- **`0/0` with a real location is probably honest data, not a bug.** ~42% of cabs are
  cable-endpoint-only and legitimately carry no hosts. Suspect DATA before code.
- **A hidden tab never fires rAF.** Prove the call happened before "fixing" it.
- **Declare above first use.** A `var x = null` below an earlier assignment silently wipes it, and
  `node --check` is blind to it.
- **`cd` persists between calls.** After working in `Downloads`, repo greps hit a stale copy.

## 6 · Where knowledge lives

| Need | Go to |
|---|---|
| Contracts, discipline, design law | `CLAUDE.md` |
| Live state, defects, verify debt | `PHANTOM_CURRENT_STATE.md` |
| Judgment: blast radius, what not to build | `senior-principal-engineer` skill |
| Architecture program, milestones, rulings | `ARCHITECTURE-BLUEPRINT.md`, `RACKENGINE-SPEC.md` |
| Tokens, spacing, type, channel colour | `PHANTOM_DESIGN_SYSTEM.md` |
| Device checklist | `BATCH-VERIFY.md` (consolidated section at the top) |
| Durable lessons from past failures | project memory |
| Superseded history | `archive/2026-08-08/` |

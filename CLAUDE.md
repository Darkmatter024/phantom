# CLAUDE.md — PHANTOM (darkmatter024/phantom)

Offline-first single-file iOS Safari PWA (`dct-ios.html`, ~48.5k lines) for CoreWeave DCTs.
Live: darkmatter024.github.io/phantom/dct-ios.html. Owned by John (Lead DCT); his word is final.
Ships site-agnostic — the loaded Master supplies every site-specific fact (Law A6).

**State lives in `PHANTOM_CURRENT_STATE.md`, and nowhere else.** Do not record live version,
queue, or open defects in this file — five documents once claimed five different live versions and
none was correct. Start a session with `PHANTOM_SESSION_BOOTSTRAP.md`.

⭐ **The governing programme is `nexus01/SHIP-TECH-FLOW-V2-FROZEN.md`** (owner ruling 2026-08-08;
**added to the repo 2026-08-10** — it had lived only in `Downloads`, outside version control and
unreachable from a session that could not see that folder). It sets
the delivery ORDER; the contracts below and the blueprint rulings remain the law it delivers
against. It is FROZEN — a genuine contradiction gets **reported, never silently resolved**, and
every ambiguity resolution is logged in `PHANTOM_CURRENT_STATE.md` §1a.

---

## THE CONTRACTS — architecture and data law

These are contracts, not reminders. They do not expire, and they are not subject to the
behavioral-rule test. Changing one requires an owner ruling.

**A · Product / architecture**
1. **ONE ACTIVE MASTER.** Exactly one authoritative Master at a time — never one in memory and
   another in storage, never a candidate half-active. `PHANTOM_MASTER` is the only writer of both
   halves; it persists FIRST and goes live SECOND. Parsers return candidates; only acceptance writes.
2. **One canonical engine per concept.** No second renderer, no second door, no parallel
   implementation of a thing that already exists. New entry points call the one canonical function.
3. **Physical topology creates racks; the Master populates them.** (blueprint R-06) A rack exists
   because the floor has one, not because a spreadsheet mentions it.
4. **Empty racks remain real and visible.** A cab with no devices says what that means — it is
   never hidden, never silently zeroed, never treated as absent.
5. **Forge uses the canonical Rack Engine.** No private renderer inside Forge.
6. **Only the active foreground rack window gets full interactive 3D.** Five foreground racks;
   everything else is scenery. One live WebGL attachment, ever (spec I1).
7. **Build is the operational center.** The shift runs from Build; Command is situational
   awareness, Tools is reference.
8. **SHIFT is a primary product pillar.** Primary nav is **Command · Build · Scan · Tools · Shift**
   and `EXIT` does not occupy a pillar slot (**R-02**, blueprint §3.4). Removing that slot removes
   the slot, **not the feature** — hold-to-freeze re-homes into Shift (**R-02a**, §3.4a).
   **Delivered at M4, gated behind M3** — 3 of Shift's 9 questions have no data source yet.
   The shipped nav is 3 slots + EXIT; `01-nav.spec.js` pins that as a **pre-M4 checkpoint, not a
   specification.** ⛔ Do not restore the slot early — see `PHANTOM_CURRENT_STATE.md` D-1.
9. **Offline-first, not offline-only.** Full function with no network; the network is an
   enhancement, never a precondition.

9a. **Identity is two people, not one.** `siteLead` = **authority**, set at Site Setup and changed
   only in SITE/SYSTEM. `currentOperator` = the **actor** working on this device now. Usually the
   same person; the model never assumes it. **Every Event Log entry credits the ACTOR — work is
   never auto-credited to the Site Lead.** (spec §2; supersedes the earlier single-identity
   wording. Landed `v1.14.417`.)

**B · Data / safety**
10. **Real data only.** Never fabricate telemetry, never label a panel after data PHANTOM does not
    receive, never present a mock's number as a measurement. Structural no-data is correct, not
    unfinished. Caption where a number came from.
11. **User data is preserved.** Merge, never overwrite — Master loads fill gaps; hand-entered
    values always win and always survive reloads. Never rebuild a persisted object as a fresh
    literal. Never destroy known-good data for a candidate that cannot be kept.
12. **Cache identity and invalidation.** Every Master-derived cache carries the Master's identity
    and is checked on read. A cache may accelerate the active Master, never outlive it.
    (`if (cache[id])` treats an empty array as a hit — check identity, not truthiness.)
13. **No base64 images in localStorage.** Ephemeral or IndexedDB only.
14. **No silent failures.** Never `if (!x) return;` on a user-facing path. Fail loudly:
    `console.warn` + `phantomToast`. A tappable control that does nothing is a violation.

**C · Presentation**
15. **Approved PHANTOM visual identity.** `PHANTOM_DESIGN_SYSTEM.md` is the lock (approved
    2026-08-07). Verify token NAMES against `:root` before use — an undefined `var()` invalidates
    the whole declaration silently. ⛔ R-E: no mass refactor of the 1116 literals; per-screen only.
16. **Intentional compositions per tier.** Phone / tablet / laptop / desktop are designed, not
    stretched. Desktop composition is automatic at ≥1024 via media query. Rule 1: nothing pushes
    the viewport past 100vw, ever.
17. ⛔ **REVOKED IN PART — owner ruling 2026-08-29.** John, verbatim: *"I formally revoke contract
    17 — `?legacy=1` byte-identical behavior is no longer guaranteed."* **The byte-identity
    guarantee is gone.** `?legacy=1` may change, may degrade, and at LEGACY-RETIRE Stage 7 it stops
    existing. ⛔ Do not cite byte-identity to refuse or narrow a change, and do not restore this
    clause from an older copy of this file — every ship from `.533` on that says *"legacy is
    byte-identical"* in its notes is quoting a contract that no longer holds.
    ⚠ **What the ruling did NOT name, held pending his correction:** *no legacy UI leakage* —
    nothing under `body.rd` may `nav_push` a legacy `p:` value — and the general law **gate the
    PRESENTATION, never the INVARIANT**. The revocation names byte-identity and nothing else, so
    the leakage invariant stands under the campaign's own *"anything ambiguous defaults to KEEP"*;
    it becomes moot when Stage 7 deletes the legacy `p:` values it guards against. **Reported here
    rather than silently resolved** — if John meant the whole contract, he strikes these two lines.

---

## LEGACY-RETIRE — the campaign of record (owner ruling 2026-08-29)

⭐ **`SHIP-HANDOFF-LEGACY-RETIRE-RULING.md` is in the repo** — imported verbatim 2026-08-30,
**3,454 bytes · `sha256 537be43ddb9dc5fc…`**, byte-identical to the copy in `Downloads`. It had
lived only in that folder, which is how `SHIP-TECH-FLOW-V2` was nearly lost: a document no session
can see is not a programme of record. **Read the file, not this summary, before any stage patch.**

**Goal:** `?legacy=1` and the legacy house cease to exist. **Scope: ~10–12 ships, not the 23–36 in
the proposed stage list** — the ruling replaced it.

**Sequence, and it is not negotiable:**
`0 → verify → 1 → verify → 2 → verify → 3 → 4 → STRANDED note → organ inventory → OWNER APPROVAL
→ Stage 6 ships → Stage 7 → done.`

- **Stages 0–2** approved outright. **3–4** approved contingent on 0–2 landing clean and stamped.
- ⛔ **Stage 5 (STRANDED) is PULLED from this campaign.** The 3 unresolved rows get their redesign
  doors under `SHIP-HANDOFF-IA-SHIFTNAV`. **Do not build doors here** — document them in
  `docs/LEGACY-RETIRE-STRANDED.md` and stop.
- ⛔ **Stage 6 (RE-HOMED decouple) is HELD behind an inventory gate.** `docs/LEGACY-RETIRE-ORGAN-INVENTORY.md`
  — all 11 borrowed organs, what each is, which shell hosts it, where it re-homes, the blast radius
  if wrong — goes to John and **he approves it before ship 1 of that stage.** Highest-risk stage in
  the plan; it gets the most paperwork.
- **Stage 7 is the finish line:** `redesign_isOn`, `phantom_legacy`, `?legacy=1` and `--tabnav-h`
  (20 refs) come out. That is the payoff of the whole campaign.
- ⛔ **Stage 8 (unwrapping the 941 always-true `body.rd` gates) is PERMANENTLY DEFERRED.** They cost
  nothing at runtime; a 941-edit sweep through a 60k-line file with no build system and no type
  checker is unacceptable risk for a cosmetic win. **Do not schedule it. Do not revisit it unprompted.**

**Execution rules that override the batching default:** ⛔ **one visible change per ship and NO
stacking** — every stage takes a phone verify before the next begins, so Ship discipline 0 (CALL 0
batching) does **not** apply inside this campaign. Adjacent cleanup found mid-stage is logged to a
findings note, never acted on — *findings notes are leads, not tasking*. Any on-device error,
console `SyntaxError`, or crash-log entry during a verify is a **full stop** with brace-level
diagnosis before anything else ships; `.522` is why.

**Stage 0 landed 2026-08-30** — this section, the Contract 17 revocation above, and the ruling
import. Docs only: no product source touched, so no version bump and no `VERIFIED` stamp.

---

## Branch topology — SHIP-GATE-LOCKDOWN (owner ruling 2026-08-27)

**Two branches, two served surfaces, one gate.**

- **`main`** — where Claude Code works. All edits, all commits, all merges. **Served at staging**
  since 2026-09-09: `https://phantom-staging.wfj6t2fk7w.workers.dev/dct-ios.html`, a Cloudflare
  Worker serving `main`'s root, rebuilt on every push in about a minute — the **PHANTOM STAGING**
  icon on the phone (`docs/INFRA-STAGING-CLOUDFLARE-PAGES.md`). Its own origin, its own storage:
  staging data is not release data.
- **`release`** — what GitHub Pages serves: `darkmatter024.github.io/phantom/dct-ios.html`, the
  **PHANTOM** icon. **`release` means graduated.**

⛔ **REVOKED 2026-09-05 — PROMOTE IS OWNER-ONLY. CLAUDE CODE NEVER MOVES `release`, IN ANY MODE.**
The 2026-08-30 amendment that permitted Claude Code to fast-forward `release` itself is **struck**.
⭐ **The ruling of record is `OWNER-RULINGS.md`, 2026-09-05 — read it, not this summary.**

There is **no session-order exception**. An in-session instruction to promote is answered by handing
John the command to run, never by running it. ⛔ No `merge --ff-only`, no push to `release`, no
branch reset, no "it is only a fast-forward".

**The only promote path is `tools/promote.ps1`, run by John from his own terminal.** Claude Code
ships to `main`, reports, and PARKS. A push to `main` reaches the PHANTOM STAGING icon within about
a minute and nothing else; the PHANTOM icon moves only when John promotes.

⛔ Still forbidden to anyone: any commit on `release`, any non-fast-forward, any `--force`. A promote
is a fast-forward or it is a STOP.

⛔ **WHAT DID NOT CHANGE, and is the actual gate:**
1. **`VERIFIED` is owner-only.** Claude Code never edits it except when John says "stamp it", never
   commits it, and never stamps a version the served bytes have not carried — and since 2026-09-09
   "served" means **staging**, which `tools/verify.ps1` reads before it writes anything.
2. **The device verify is John's, always.** Promoting a version is not verifying it. Staging makes a
   version *seeable*; only John's phone makes it *real*; the promote makes it *graduated*.

A commit that bumps `version.json` is blocked by hook unless John has verified the old version on device and stamped it in the `VERIFIED` file. The gate is mechanical, not a promise. 

**Live serves from `release`; staging serves `main`.** A push to `main` changes nothing on the PHANTOM icon until John promotes.

### The mechanical ship loop — build → check staging on device → verify → promote

*Rewritten 2026-09-09 under `OWNER-RULINGS.md` PROMOTE ORDER. It supersedes ruling C's promote → see →
verify, which existed only because `main` had no served surface; `.585` was that order's last run, as
a named exception, not precedent.*

1. **OODA against served bytes.** `curl` staging `version.json` (what `main` serves) and the release `version.json` (what the PHANTOM icon has). Staging must read `HEAD`'s `version.json`; release must read `VERIFIED` line 1. If either does not, STOP and re-anchor.
2. **One visible change to `main`.** Edit, test, commit. The hook enforces three-stamp lockstep and the VERIFIED gate.
3. **Report:** what changed, what proves it, and the ONE look on PHANTOM STAGING — exactly what to do, what PASS and FAIL look like. Close the loop: show `git log -1 --oneline` and `git status`.
4. **PUSH TO `main`, then STOP.** Staging rebuilds in about a minute. Every step from here is John's, from his terminal: **(a)** the look on PHANTOM STAGING; **(b)** `.\tools\verify.ps1 <v> PASS` or `FAIL "what you saw"` — it refuses a version `origin/main` does not carry, a `HEAD` that is not `origin/main`, and a version staging is not serving, then stamps `VERIFIED` and pushes `main`. **It does not promote.** **(c)** On PASS, `.\tools\promote.ps1` — Guard 4 refuses an unstamped or FAILED incoming version; `release` means graduated. ⛔ Claude Code never runs (b) or (c) — revoked 2026-09-05, see `OWNER-RULINGS.md`. The next ship is impossible until (b) has run: the hook refuses a `version.json` bump until `VERIFIED` rules on the old version. **A version does not exist until John's phone clears it on staging; promoting it is graduation, not verification.**
5. **"Start Phase N" from John means:** ship the **next single slice** of Phase N, then stop. A phase name is never authorization for multiple ships.
6. **At ≥70% context:** write current state to `PHANTOM_CURRENT_STATE.md`, tell John, recommend `/clear` before the next slice.

---

## Ship discipline

0. **Batching (CALL 0, owner-delegated).** Ships may stack; device verification is one consolidated
   pass via `BATCH-VERIFY.md` — run the consolidated section at the top, not the per-ship blocks.
   Cap: every 6 stacked ships or before any HIGH-risk ship. *(This supersedes the old "one ship per
   version" rule, which contradicted it in the same section.)*
1. **OODA first.** `curl` live `main` before any edit. If live ≠ the spec baseline, STOP and
   re-anchor. Verbatim strings are truth; line numbers are hints.
2. **Surgical edits only.** Unique anchors, no rewrites, no drive-by refactors.
3. **Mechanical gates are enforced by hook, not by memory** — `tools/hooks/phantom-guard.js` blocks
   a commit on broken three-stamp lockstep, a non-compiling inline script, brace imbalance, damaged
   CRLF, a backtick in a commit body, an unstamped `VERIFIED`, or `HEAD` sitting on `release`.
   Do not work around it; fix the cause.
   ⚡ **THE GATE RUNS IN TWO PLACES, AND A FRESH CLONE HAS ONLY ONE.** The guard is wired into
   `~/.claude/settings.json` as a `PreToolUse` hook, which sees **agent tool calls only** — a
   commit typed into a terminal never reaches it. `tools/githooks/pre-commit` covers every local
   commit whoever types it, by driving the same guard so the two cannot drift. Git cannot wire
   hooks automatically, so **each clone needs this once**:
   ```
   git config core.hooksPath tools/githooks
   ```
   Check with `git config --get core.hooksPath` → `tools/githooks`. Until that is run, terminal
   commits are ungated. That gap is not hypothetical: `v1.14.520`–`.523` were committed straight
   onto `release` and orphaned by a reset the next day, surviving only as `recovery-v1.14.52x`
   tags. `--no-verify` still bypasses both layers, by design — a seatbelt, not an immobiliser.
   ⭐ **THE HOOK IS THE GATE** (owner ruling 2026-08-08). Spec §10 names four subagents —
   `lockstep-auditor`, `surgical-edit-reviewer`, `data-honesty-auditor`, `cold-aisle-qa` — which
   are **not loadable from this session's CWD** and have never once run; `BATCH-VERIFY` records
   *"Agents barred, equivalents run inline"* three times. Do not block a ship waiting for them.
4. **Device verify is a HARD STOP.** Critical iPhone/WebGL behaviour is verified on physical
   hardware or it is not verified. After push, hand John the checklist and PARK.
   ⛔ **THE OWNER IS NOT THE TEST HARNESS** (owner ruling 2026-08-10). **You own automated
   verification.** Before requesting ANY physical-device test, exhaust what can be proven locally:
   unit/integration tests, parser fixtures, Playwright flows, responsive screenshots, DOM/state
   assertions, console and page-error checks, storage/cache tests, service-worker simulation,
   reload/restart behaviour, regression tests, known-good fixture comparisons. **Never ask the
   owner to manually verify what automation can prove.**
   **Physical iPhone verification is reserved for behaviour that materially depends on real iOS
   hardware/runtime:** installed Home-Screen PWA service-worker behaviour · real iOS safe-area ·
   iOS WebGL/GPU lifecycle · camera/scanner hardware · OS-level Share/AirDrop · other *proven*
   hardware-specific conditions. "The harness skips it" is NOT the same as "it needs hardware" —
   check whether another project (e.g. Chromium, which installs service workers) can run it first.
   **When hardware truly is required:** finish all automation first, then ask for **ONE concise
   test** — exactly what to do, exactly what PASS and FAIL look like. **Do not ask him to read
   consoles or engineering internals** unless genuinely unavoidable.
   **He approves product behaviour; he does not perform routine QA.**
5. **No new features during the current stabilization / UI-finish phase.** The queue is empty by
   design. New scope needs an owner ruling.

## Design law

1. **Shift-shape, not history-shape.** COMMAND = situational awareness · BUILD/WORK = the job chain
   in execution order · CRASH CART = zero-state bench.
2. **Zero-state test.** Works with no deployment → CRASH CART reference. Needs deploy state → lives
   inside the Deploy flow.
3. **Additive over surgery.** Re-homed legacy organs get new layers routed into existing content.
4. **Cold Aisle Filter.** Every feature must help a gloved tech in the aisle *now*. Tap depth
   matters; four taps to a reference is a defect. **Mock the phone first — 390 before 1080.**
5. **Aesthetic bar: "$10M, not cheesy."** Minimum formatting, no clutter. Values live in
   `PHANTOM_DESIGN_SYSTEM.md` — that file, not this one, is the source of truth for tokens.
6. **Site data flows from the Master; the app carries only fleet truth.**

## Roles

- **John** — owner. All gate decisions, all device verifies. Terse and field-operational: lead with
  status, state deviations plainly, no cheerleading. He rewards honest pushback and penalizes churn.
  When parked, say exactly what you are waiting on, in one line.
- **web-Claude** — authors `.md` handoff specs with verbatim anchors. Its zips may restamp a version
  already shipped: diff against the shared base and re-apply on top of live, never drop-in.
- **You** — execute, verify, push. You may fix draft-spec bugs against live code; report every
  deviation in the commit message.

## Working rules

- **Read the graph before any patch.** Run `/graphify . --update`, then read
  `graphify-out/wiki/index.md` — community article first, then the god nodes for the surface you
  are about to touch. The wiki is generated into a gitignored folder, so it never travels with the
  repo: the REBUILD is the requirement, not the file. If graphify is not installed, say so in the
  report and proceed — never skip this silently.
  graphify-first is harness-enforced via SessionStart hook in `.claude/settings.json`.
- **Match process to task size.** Localized UI/CSS is your own work: inspect → implement →
  verify → finish. Reach for specialists only at architecture boundaries, data safety, WebGL
  lifecycle, offline/storage, or independent release verification.
- **When John hands BYTES, reproduce them VERBATIM.** No silent improvements. Stop and ask before
  any change; only the named target moves.
- **After a push, close the loop** — show `git log -1 --oneline` and `git status` so he can verify
  origin actually has it before anything else proceeds.
- **Tests carry the mechanical truth.** `test/e2e` — 128 tests, `retries: 0`. A `test.fail()` is a
  PINNED DEFECT; *"Expected to fail, but passed"* is proof a fix landed. Never widen the console
  allow-list to get green. Automation does not replace the iPhone gate.

## New-rule policy

Do not create a permanent behavioral rule after every correction. Correct the issue, and prefer
automated enforcement. Add a permanent rule only when the same meaningful failure **recurs**, or
when the mistake could cause data loss, architectural corruption, or a critical release regression.
**Architecture and product rulings are exempt — they are recorded on first statement.**

---

## PHANTOM DESIGN SYSTEM — LOCKED (Claude Code reads this before any UI work)

PHANTOM is a vanilla JS/HTML/CSS single-file PWA (`dct-ios.html`). The design system is LOCKED. Design skill recommendations inform decisions but PHANTOM's own tokens are the authority.

### Locked design tokens (never override these)
```
--bg:    #04060a   (deep space black — the floor)
--cyan:  #28e0ff   (primary — HUD, active state, links)
--vio:   #8a4bff   (secondary — permission tiers, elevated UI)
--mag:   #ff2bd6   (alert — fail states, critical)
--teal:  #1fffd0   (success — pass states, completed)
--gold:  #ffcb45   (warning — blocked, hold, caution)
```

### Locked fonts
Orbitron (display/headings) · Chakra Petch (UI labels) · Rajdhani (body)
No new font imports. No Inter, no system-ui, no "just a quick Google Fonts."

### Locked architecture
Single file: `dct-ios.html` (~52k lines). No build system, no npm, no React.
str_replace edits only. Three-stamp lockstep: dct-ios.html / sw.js / version.json.

### How to use the design skills with PHANTOM
- **UI UX Pro Max**: run `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "field tool dark UI" --domain style` to find relevant style guidance. Use it to inform motion, spacing, and layout decisions — not color or font choices.
- **Taste Skill**: use to audit any new surface before shipping. "Does this look like AI slop?" is the question. If yes, fix it.
- **Design Motion Principles**: use when adding CSS transitions, animations, or the View Transitions spec. Lean Emil Kowalski (restraint, speed, purpose) — PHANTOM is a field tool, not a portfolio.
- **Awesome Claude Design**: if you need a reference aesthetic, check `.claude/references/awesome-claude-design/` — Linear, Vercel, and Raycast are the closest matches to PHANTOM's sensibility.
- **Frontend Design**: Anthropic's own skill. Activates automatically for UI/UX work. Defers to the locked tokens above when it conflicts.

### Cold Aisle Filter (never violated)
44pt minimum tap targets. Gloved hands. No tiny controls for floor actions. Data hall is loud.

---

### REVIEW MATRIX (mandatory, intelligence-core era)

Before ANY commit, the diff must pass every agent its row demands. A missing review = do not commit.

| Change touches… | Required reviews |
|---|---|
| Any ship (always) | lockstep-auditor · surgical-edit-reviewer |
| Any user-visible UI | cold-aisle-qa · data-honesty-auditor |
| Assembler, adapter, or registry | adapter-reviewer (census must exist first — see below) |
| Any Record renderer (report, composer, gallery, mission chip, coverage display) | report-fidelity-auditor · data-honesty-auditor |
| Storage shape questions, before writing any adapter | storage-archaeologist census covering that data class |

Rules:
1. **storage-archaeologist is read-only recon.** Its census output goes to John before any adapter that depends on it is written. No adapter may read a field the census does not document.
2. **Reviewer agents render verdicts, never edits.** A FAIL is fixed by a new surgical diff, re-reviewed from scratch.
3. **Agent PASS is advisory.** It is never a substitute for John's device verify, which remains the only ship gate. No agent, and no combination of agents, authorizes a deploy.
4. One extracted handoff at a time; agents operate only within the active handoff's scope. An agent finding outside scope is REPORTED to John, never acted on.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current. ⛔ **It is NOT free.**
  Corrected 2026-09-04 — this line previously read *"AST-only, no API cost"*, which is true only of
  a pure-code corpus. PHANTOM is not one: **175 of the 256 graphed files are markdown**, and only 80
  are code. Code goes down the AST path and genuinely costs nothing; docs and images go through LLM
  semantic extraction, and with no `GEMINI_API_KEY` set the host session is itself the LLM, so the
  cost lands on this session's own budget via dispatched subagents.
  Observed in `graphify-out/cost.json`: **350k–670k input tokens per `--update`** (9–24 changed
  files), and **2.18M** for the 2026-08-28 full build. That file is the ledger — read it before any
  bulk rebuild, and never treat an update as a free reflex on a docs-heavy change.

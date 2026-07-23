# PHANTOM — CORE DOCTRINE (STANDING LAW)
**Status:** standing reference. Not a build spec — no edits authorized by this document alone.
**Live version at authoring:** v1.14.343 · single-file vanilla JS/HTML/CSS PWA, no framework, no build step, no backend.
**Audience:** Claude Code + subagents. Hold this alongside every future PHANTOM spec.

---

## §0 HOW TO USE THIS DOCUMENT

Three tiers. Treat them differently.

- **§1 RATIFIED** — already true in the codebase. Enforce on every ship. No ruling needed.
- **§2 TRANSLATED** — the intent is right, the named mechanism doesn't exist here. Use the translation, never the original wording.
- **§3 CONTESTED** — conflicts with shipped, device-verified work. **STOP AND FLAG. Do not implement without an explicit written ruling from John naming the section.**

If a future spec cites a §3 item as settled law, that spec is wrong. Flag it.

---

## §1 RATIFIED LAWS (already PHANTOM, enforce always)

### 1a. Offline-first, defensive storage
Assume no network. Storage ceilings are tight on iOS Safari.
**Already implemented:** `PHANTOM_MASTER_STORE` (L29454) — lz-string compression, hardened quota detection across browser flavors (`QuotaExceededError` / code 22 / `NS_ERROR_DOM_QUOTA_REACHED` 1014 / `/quota/i`), loud failure so silent data loss is impossible. Live storage gas gauge (~L26197).
**Enforce:** every new write path goes through the hardened store. No raw `localStorage.setItem`.

### 1b. Deterministic parsing — no guessing, hard blockers
**Already implemented:** `phantom_parseMaster` (L29628) — re-entrancy guard, SHA-256 revision hashing with in-memory cache, password-protected detection, required-sheet gates (SITE-HOSTS mandatory; WIP or CUTSHEET required, WIP wins), structured prefixed errors, chunked yielding every 5,000 rows.
**Enforce:** missing signal → throw a hard blocker. Never infer, never default-fill.

### 1c. Data honesty
No invented data, ever. No fake telemetry, no placeholder trends, no dead buttons, no numbers without a source.
**Precedent:** the DEPLOY sparkline was struck because no time-series deploy data exists. `deploy_computeDeployRollup` returns one current value — so the honest progress bar shipped instead.
**Corollary — "rails are the rack":** undeclared U render as open rails, never invented blanking panels. A sparse rack looks sparse because that is the truth.

### 1d. The Glove Test (Cold Aisle Filter)
Every decision answers: *does this help the gloved tech in the aisle right now?*
Touch targets ≥60pt for primary actions, ≥52pt for buttons. No delicate or precision-dependent controls. Primary action reachable without scrolling.

### 1e. Two shells, one truth
Phone and desktop are **different compositions of the same components** — same data, same functions, same tokens. Not a stretched copy.
One DOM recomposed by CSS at the ≥1024px breakpoint. Shell-specific elements (desktop assistant rail, phone bottom nav) are hidden on the other shell, never duplicated.
**Art direction over scaling:** distinct assets per orientation where it matters. Never crop critical UI with `background-size: cover`.

### 1f. Master is truth
Single ingestion door: every ingest control routes to `cmd_loadMaster()` → `master_loadFile()`. One resident Master. Hero and bay render the **same rack object** resolved once from the Master — never two sources sharing a label.

### 1g. Ship discipline (non-negotiable)
- Surgical `str_replace` only — no wholesale rewrites of hardened functions
- `node --check` ×3 · CSS brace-balance gate
- Three-stamp version lockstep: `dct-ios.html` / `sw.js` / `version.json`
- All edits `body.rd`-scoped · `?legacy=1` byte-identical
- `.255` tap contract and `.256` type-colour lock intact
- Single live GL context (`_reh3dActive`) — exactly 2 `WebGLRenderer` in the file
- **One concern per ship.** John device-verifies on iPhone as the hard gate.

### 1h. One shared rule, never per-instance
Recurring failure mode: fixes applied per-element instead of via one token or rule. Bottom clipping took three passes; card surface took two.
**Law:** when a value applies to more than one consumer, define it once and delete every local override. Add a grep gate proving zero overrides remain.

### 1i. Performance
Animations and transitions use `transform` and `opacity` only — no layout-triggering properties in motion. Lean DOM. Locked 60fps on device is the bar.
**Already implemented:** renderer pixelRatio capped at 2 (§F mobile cap); trays opaque so Three's transparent sort can't thrash during orbit.

---

## §2 TRANSLATED LAWS (right intent, wrong mechanism)

### 2a. "Tailwind" → the token system
**PHANTOM has no Tailwind, no framework, and no build step.** Styling is vanilla CSS driven by `:root` custom properties, all `body.rd`-scoped.
**Translation:** "ruthless, lean markup" = reuse existing tokens and component classes; add no new colors outside `:root`; no utility-class emulation.
**Verified real tokens include:** `--cyan-border-lo`, `--surf-1`, `--ok` (#3DDC84, pass/healthy only). Pill law: cyan `hsl(186 100% 69%)`, violet `hsl(285 100% 64%)`.
**Never invent token names in a spec.** If a spec names a token, grep it first; if absent, use the real one and say so.

### 2b. "TypeScript / class architecture" → JSDoc on plain functions
A build step would break the entire ship discipline in §1g: the file edited would stop being the file deployed, voiding the ship-gate, the legacy byte-diff, and version lockstep.
**Translation:** type safety via JSDoc annotations — editor-level checking, zero build.

### 2c. "Multi-agent orchestrator" → the subsystems that already exist
The three proposed agents are already built:
- **Master Parser** → `phantom_parseMaster` (L29628) — already has every defensive feature the proposal describes
- **Diagnostic/BOM** → 30 `bom_*` functions with IndexedDB backing (`bom_openDB` L37314, deployment scoping)
- **Audit/Handoff** → 13+ `handoff_*` functions (save/load/generate/export, L21615+, L26557+, L35441+)
**Translation:** do not build an orchestrator layer. Extend these subsystems in place. An intent router between the UI and three deterministic functions adds indirection and drift surface with no capability gain.

### 2d. Web Worker for parsing — **not authorized on speculation**
The parse loops already yield (`await setTimeout(0)` every 5,000 rows). The only truly blocking calls are `XLSX.read()` and `sheet_to_json()`, which are monolithic and unchunkable.
**Translation:** a worker is justified **only** if jank is observed on a real Master on device, and then only to move those two calls off-thread. Measure before building. Note the tradeoff: structured-clone cost returning `racksByCab`/`hosts`/`cables` may offset the gain.

---

## §3 CONTESTED — STOP AND FLAG, ruling required

### 3a. "Kill the Curves" / clip-path chamfers house-wide
**Conflict:** SPEC-COMMAND-FINAL-LOOK §3 established and shipped the card system — 1px border, **14px radius**, `--card-surface` fill — device-verified across v1.14.335–.343 and adopted line-for-line from the OPTION 2 comp John approved.
Converting every surface to `clip-path` chamfers would revert that work, void the comp as reference, and re-open the card-surface unification that took two passes to land.
**Also technical:** `clip-path` removes the border, so the 1px edge treatment must be rebuilt as a layered pseudo-element, and it interacts badly with `overflow`-clipped scroll containers and the backdrop-filter carriage.
**Required before any implementation:** John rules in writing, naming §3a, and states scope — *all* surfaces, or a limited accent set (e.g. hero card + primary buttons only). Absent that ruling, the shipped radius system stands.

### 3b. Version identity
Specs have referenced "v3.0 SYSTEM" and "v1.14.162." **Live is v1.14.343.** Any spec citing a different base is stale — flag it and confirm the base before executing.

---

## §4 AGENT GUIDANCE

**No new agents are needed. Two exist and cover the work; adding more adds coordination cost without coverage gain.**

### 4a. `phantom-ship-gate` (Haiku — mechanical, cheap, runs on every ship)
Unchanged. Verifies: `node --check` ×3, CSS brace balance, three-stamp lockstep, `body.rd` scope, `?legacy=1` byte-diff empty, exactly 2 `WebGLRenderer`.
**Add to its checklist:** grep gate proving zero per-instance overrides for any value promoted to a shared token in that ship (§1h).

### 4b. `phantom-rd-reviewer` (Sonnet — doctrine review, runs before every commit)
**Update its rubric to check this document**, specifically:
1. Does the diff violate any §1 ratified law?
2. Does it implement a §2 item using the original wrong mechanism (Tailwind classes, TS, orchestrator layer, speculative worker)?
3. Does it touch a §3 contested item without a written ruling naming that section? → **automatic FAIL**
4. Does any new value get defined per-instance where a shared token exists? → FAIL
5. Does any surface render data with no source? → FAIL (§1c)

### 4c. When to run them
Both, in parallel, after edits and **before every commit**. Never commit on a failed gate. This is what caught the fake sparkline, the invented token names, and the desktop breakpoint collision — the pattern works; don't loosen it.

### 4d. What agents cannot do
Visual correctness on device is **John's hard gate**, not an agent's. No agent approves a look. Agents verify mechanics and doctrine; John verifies reality on the iPhone.

---

## §5 OUTSTANDING WORK (as of v1.14.343)

**In flight, unverified:** `FIX-DESKTOP-NAV-CARDS.md` — desktop nav full-width solid black, desktop bottom-clipping via the shared derived-clearance rule, card-surface token unification, hero rack visibility. Verify both shells before starting anything new.

**Roadmap, ruled and waiting:**
1. **AUS-01 site profile** — persistent localStorage profile (switch models, GPU platforms, standard optics, rack naming convention, PDU type) injected automatically into every AI feature (context injection)
2. **Shift Handoff Data Transfer** — one-tap tech-to-tech bundle via Web Share API (AirDrop) with QR-chunked fallback, reusing the existing full-backup export and atomic restore; `navigator.storage.persist()` as companion

Both extend existing subsystems (§2c) rather than adding new architecture. **One per ship.**

# SPEC — COMMAND FINAL LOOK · "OPTION 2" ADOPTED LINE-FOR-LINE
**Supersedes:** SPEC-COMMAND-V2-FINAL §2 layout + **D12 (REVERSED by John: assistant-first is IN)**. All other V2 rulings (D1–D11, D13) stand.
**Target:** the app looks like the OPTION 2 comp — same anatomy, every card fed by REAL data. **Author:** web-Claude. **Executor:** Claude Code + agents. **Hard gate:** John on iPhone + desktop browser.

---

## 0. TRANSLATION RULE (read first)

**VISUAL REFERENCE REQUIRED:** the OPTION 2 comp image must be provided alongside this spec — either committed at `design/option2-comp.png` or pasted directly into the executing session. **Do not execute §1–§3 without the image in context**; the card proportions, active-row highlight treatment, spacing, and finish are defined by the pixels, not prose. If the image is absent → STOP AND FLAG.

The comp is adopted **card-for-card**. Where the comp shows dev-session content (the "LIGHT RIGS" title, rig table, preset names), the **card anatomy is kept and the content is mapped to real app data** per §2. No card renders fake or dev-tool data. That is the only permitted deviation from "line for line," and it is what makes line-for-line honest.

---

## 1. DESKTOP LAYOUT (≥1024px) — three regions

### 1a. LEFT ASSISTANT RAIL (~300px, fixed)  — D12 REVERSED: RULED IN
Top→bottom, exactly as comp:
- `AI ASSISTANT · ONLINE` eyebrow
- **Ghost art** — the real `phantom-ghost-v2.webp` (in repo), not a stand-in
- Greeting: "Hi, I'm Phantom. Your AI shift assistant."
- One-line situational summary (real): site, blocker count, shift delta — from existing fleet state
- **NBA card** (violet, GO TO HANDOFF →) — existing `cmd_nba()` feed. NBA renders HERE on desktop and NOWHERE else on desktop (ladder: one NBA per surface)
- `SUGGESTED ACTIONS` — 4 chips wired to existing features: Summarize shift · Explain blocker · Recommend next step · Check system health (route into the existing assistant/annotate paths; if a route doesn't exist, chip is omitted — no dead buttons)
- `QUICK TOOLS` — SCAN · LOG · BLOCKER (existing qa actions)
- `CHAT WITH PHANTOM ▶` — opens the existing assistant surface
- Footer: `AI STATUS · Active`

### 1b. CENTER COLUMN
Top→bottom:
1. **Status band**: SITE DFW-05 ·Online / STORAGE Ready / PROFILE Active / LAST SYNC h:mm — real pills data (merged `#cc-statusrow` feed) + Master timestamp (D2 amber >12h lives here)
2. **Stat cards row** (4): RACKS Active / BLOCKERS Open / DEPLOYS In Progress / DEPLOY PROGRESS % + sparkline — existing counts + deploy % feed
3. **HERO CARD** (the comp's "LIGHT RIGS" card, remapped):
   - Card title: `ACTIVE RACK` eyebrow → **`s1:001`** big + kind chip (e.g. `US-SPK03`)
   - Left/center: **live INSPECT-3D** (existing shared `rackElevation_render3D`, D13 live-everywhere, D7 NEXT-U pulse)
   - Right column (comp's preset list) = **RACK SWITCHER**: s1:001…s1:005+ rows from `deploy_loadRacks()` + existing sort; active row highlighted exactly like the comp's "RAKING" row; row subtitle = `nnU · n devices · n blockers` (real). Supersedes D5's picker-sheet on desktop; phone keeps D5.
   - Bottom-left button: **`OPEN BAY ⟶`** (comp's EDIT RIG) → full rack-detail 3D
   - Bottom-right button: **`ALL RACKS`** (comp's MANAGE PRESETS) → BUILD
   - Card corner: `View all racks` chip (comp's View all rigs) → BUILD
   - **No view rail on the hero (D4 stands).** The bay owns FRONT/ISO/TOP/REAR/EXPLODE/CABLES.
4. **Bottom cards row** (3): DEPLOY PROGRESS (% + master name + ACTIVE, sparkline) / HANDOFF STATUS (DRAFT · PENDING SEND — real handoff state) / OPS SIGNAL (2 real signal lines + `DRAFT` / `RESUME` action chips → route to handoff / seeding continuation)
5. **Footer strip**: SYSTEM HEALTH + EKG (existing SYS pill feed) · LAST SYNC · SECURE SESSION 🔒

### 1c. TOP NAV (desktop): HOME · BUILD · TOOLS · RACKS + version chip + SYS + ghost avatar. Map to REAL pages only (Home/Command, Work/BUILD, Reference/TOOLS, rack index if it exists — comp's MAPS/ANALYTICS/SETTINGS entries are omitted unless a real page exists; no dead nav).

## 1d. S0 (no Master) — D10 stands on both surfaces: full-screen ingest replaces center column (desktop keeps the assistant rail; its summary line says "No Master loaded — ingest to begin").

---

## 2. PHONE LAYOUT (<1024px) — per comp's right panel, one column
1. Header: PHANTOM · COREWEAVE · DFW-05 · ghost avatar (assistant door)
2. Pills row: Online / Ready / Active ✓
3. **AI ASSISTANT card**: mini ghost + greeting + **NBA inside it** (h/p + GO TO HANDOFF →) — phone's single NBA
4. Stat cards row (3): RACKS / BLOCKERS / DEPLOYS
5. **RACK card** (comp's phone LIGHT RIGS card, remapped): `ACTIVE RACK · s1:001` + kind chip + live 3D thumb (36vh clamp per D6) + **`OPEN BAY ⟶`** full-width + `View all` corner chip → BUILD. NEXT-U pulse on. Tap rack → bay.
6. `QUICK TOOLS`: SCAN · LOG · BLOCKER (≥60pt)
7. Bottom nav: **existing real pages** (HOME · BUILD · TOOLS · EXIT) restyled to comp treatment — do not invent MAPS/RACKS tabs.

Fold rule (390×844): items 1–5 incl. OPEN BAY visible without scrolling; assistant card is compact (~120px) to protect this. If it can't fit, the assistant card compresses before the rack does.

---

## 3. VISUAL SYSTEM (the "finish")
- **Card discipline**: every module in a card — 1px `--edge-lo` border, 14px radius, `--surf` gradient fill, inner top highlight, 18–22px padding
- Eyebrow labels: mono 10px, letter-spacing .2em, slate
- Big values: Orbitron for numerals, white; sub-labels slate mono
- Chips: existing pill law (cyan/violet machined-housing treatment)
- Buttons: violet gradient primary (NBA/GO), cyan-outline secondary (OPEN BAY), magenta accent only for BLOCKER
- Ghost art: `phantom-ghost-v2.webp` (two-tier icon law: WebP ≥72px)
- All new CSS `body.rd`-scoped; tokens from the existing :root only — no new colors

---

## 4. SHIPPING PLAN (budget-aware)
- `.334` lazy-load guard: unchanged, ships first (or already shipped).
- **If V2 structure has NOT shipped yet:** merge structure+skin → ship ONCE as this spec (single verify cycle). **If V2 already shipped:** this is the skin pass on top. Claude Code checks repo state and branches; states which path it took in the diff summary.
- Invariants unchanged: rd-scope, legacy byte-identical, reh3d internals untouched (NEXT-U + hero-strip-removal only), Master pipeline read-only, `.255`/`.256`, single-GL-context, three-stamp lockstep.
- Execution: OODA per V2 §4. Agents: phantom-ship-gate + phantom-rd-reviewer in parallel; triple-check greps: (a) one NBA per surface, (b) no dead nav/chips, (c) hero has zero view-rail elements, (d) `phantom-ghost-v2.webp` referenced from the rail, (e) exactly 2 WebGLRenderer, (f) legacy diff empty.
- Pre-authorized to execute and commit without sign-off unless a locked value, missing anchor, or failed gate → STOP AND FLAG.

## 5. JOHN'S VERIFY (both surfaces)
Desktop: rail renders with real ghost art + live NBA · switcher rows switch the live rack · OPEN BAY → bay and back with no GL leak · status band + stat cards + bottom row all show real numbers · S0 full-screen ingest with rail intact.
Phone: fold rule holds · single NBA (in assistant card) · rack card taps to bay · quick tools reachable · legacy pixel-identical.

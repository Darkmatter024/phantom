# PHANTOM — Phase 0 Legacy-Retirement Census

**Status:** census COMPLETE · **Base:** phantom-v1.14.166 (reorg tracked against .168) · **Method:** multi-agent classify + adversarial verify (32 census rows + 7 gap-fill; recon 49 rd entry points / 8 re-home fns) · **Updated 2026-07-02** for the Master-Reorg spec (Crash-Cart Mode owner-killed → RETIRED; pg-master un-stranded in v1.14.167).

**Key:** LIVE = reachable+working in redesign today · RE-HOMED = legacy DOM re-parented into rd via `redesign_home*` · STRANDED = built+working but reachable ONLY via `?legacy=1` (Phase 0.5 blocker) · RETIRED = no working entry point OR owner-killed, safe to delete.

**Tally (38 surfaces):** **6** STRANDED (1 ✅ resolved) · **11** RE-HOMED · **18** LIVE · **3** RETIRED

## ⛔ STRANDED — Phase 0.5 blockers (6)

Built, working, reachable ONLY via `?legacy=1`. Each needs a redesign entry point (like Ghost Echo got its Crash-Cart card) before its legacy shell can die. **Deploy Optics was NOT in the roster — the completeness critic found it.** (Crash-Cart Mode, also critic-found, was owner-reclassified → RETIRED per the Master-Reorg spec — see RETIRED table.) Per the Master-Reorg spec §2, the remaining strands fold into R-1/R-2 destinations rather than standalone un-strand ships.

| Surface | rd? | home | rationale | ref |
|---|:--:|---|---|---|
| **Deploy Optics tab** | — | none | Built + fully working but reachable ONLY via ?legacy=1 => STRANDED (Phase-0.5 blocker). renderOpticsTab (38323) is a complete 'Optic Scanner & Invento… | `dct-ios.html:38323` |
| **LOG NOTE** ✅ | ✓ | none | **RESOLVED / UN-STRANDED in v1.14.172** — added a redesign-gated 'LOG NOTE' button to the redesign rack detail (deploy_showRackDetail, below the ASSIGN/QR row) → `stripeRack_logNote(deployId,rackId)`; the note lands in the same audit trail the Handoff report reads (so it IS the 'LOG NOTE → Handoff flow' fold). Of the three legacy #action-stripe toolbar actions, LOG NOTE was the ONLY stranded one (QR already had a rd door @28529; HANDOFF via the deploy detail). (Was: reachable only via ?legacy=1 — its sole door was the #action-stripe, display:none under body.rd @L8895.) | `dct-ios.html:28531` |
| **pg-master** ✅ | ✓ | none | **RESOLVED / UN-STRANDED in v1.14.167** — a "MASTER FILE" card in #work-grid now routes via rd_openMasterFile() (showPage('master')+master_showSection('file')); verified rendering on-brand in the rd frame. (Was: BROWSE surface reachable only via ?legacy=1.) | `dct-ios.html:13673-13682` |
| **pg-triage** | — | — | RETIRED as a redesign surface: pg-triage (the legacy NOW dashboard) was intentionally SUPERSEDED by the pg-cmd rebuild - the whole point of the Comman… | `dct-ios.html:11420-11520` |
| **pg-twin** | — | redesign_homeIssues | STRANDED, not RE-HOMED. The redesign_homeIssues re-home is HALF-DONE: the #issue-page organ was relocated into the redesign container #wk-issues, but … | `dct-ios.html:16245-16251` |
| **Phase Work** ✅ | ✓ | none | **RESOLVED-BY-EXISTING (v1.14.172 recon)** — NOT a distinct surface. The literal 'phase work' occurs ONLY as legacy pg-triage NBA copy (@L18841, "Continue current phase work…"); there is no separate Phase-Work view. The actual per-phase work already lives in the redesign Deploy detail (PHASE PIPELINE) + rack detail (per-phase rack phases). No redesign door needed. | `dct-ios.html:18841` |

## ♻️ RE-HOMED (11)

Legacy DOM re-parented into the redesign at boot — the redesign’s borrowed organs. Shells stay until R4 decouples the re-home.

| Surface | rd? | home | rationale | ref |
|---|:--:|---|---|---|
| **BLAST RADIUS** | ✓ | redesign_homeHardware | Textbook borrowed-organ: the #pw-blast panel lives in legacy #pg-power but is MOVE-re-parented into Ref>Hardware (#rf-hw) by redesign_homeHardware() a… | `dct-ios.html:11398` |
| **BT Label Printing** | ✓ | redesign_homeHWRef | LIVE-equivalent, not stranded. The FAULT-label entry is RE-HOMED-carried: its trigger button lives inside the .hwm-inner DOM that redesign_homeHWRef r… | `dct-ios.html:11395` |
| **Cage Compass** | ✓ | redesign_homeCompass | Textbook RE-HOMED case (dossier [B] fn redesign_homeCompass). Reachable and working under body.rd without ?legacy=1: two entry points, one surface — (… | `dct-ios.html:11397` |
| **HW REF Matrix** | ✓ | redesign_homeHWRef | Matches dossier [B] exactly (redesign_homeHWRef, one of the 8 borrowed-organ bridges). Distinct from Ghost Echo (LIVE, no legacy shell) because HW REF… | `dct-ios.html:16331-16342` |
| **KNOW cards** | ✓ | redesign_homeKnow | CONFIRMED RE-HOMED and genuinely rendering, not present-but-hidden. redesign_homeKnow() (redesign_isOn-gated; true on bare URL since body.rd is defaul… | `dct-ios.html:11396` |
| **Optic Selector** | ✓ | redesign_homeOptics | Classic re-home: #fs-optic is a borrowed organ of the redesign. redesign_homeOptics moves the whole pg-fiber subtree (subtab strip + 8 panels) into #r… | `dct-ios.html:11823-11866` |
| **pg-cli** | ✓ | redesign_homeCLI | Classic re-home (dossier [B] redesign_homeCLI). Under body.rd (default, no ?legacy=1), Crash Cart card 'CLI / IB' -> showRefTab('rf-cli') opens the fu… | `dct-ios.html:16311-16322` |
| **pg-fiber** | ✓ | redesign_homeOptics | Matches dossier [B] homeOptics and calibration. pg-fiber is a BORROWED ORGAN: its children are MOVE-re-parented (not copied) into #rf-optics at boot, … | `dct-ios.html:11586` |
| **pg-power** | ✓ | redesign_homeHardware | Classic borrowed-organ. pg-power itself is a legacy .page id that under body.rd is drained of its children into Reference->Hardware (#rf-hw) at DOMCon… | `dct-ios.html:16258-16276 (move loop 16264,` |
| **pg-scan** | ✓ | redesign_homeScan | Textbook RE-HOMED / borrowed-organ (dossier [B] home #3). pg-scan is NOT stranded: it has a first-class redesign entry (Work>SCAN card + Command Scann… | `dct-ios.html:16228-16237` |
| **SCAN** | ✓ | redesign_homeScan | Reachable AND working under body.rd without ?legacy=1 via two redesign entry points (Work>SCAN card and Command Scanned tile), both routing to showWor… | `dct-ios.html:16228-16236` |

## ✅ LIVE (18)

Reachable + working in the default redesign. ⚠️ **pg-sop** is LIVE but a borrowed organ — Handoff generator + un-homed ops tabs render into its `#ops-content`; cannot cold-delete until those re-point.

| Surface | rd? | home | rationale | ref |
|---|:--:|---|---|---|
| **Active Build** | ✓ | none | Judgment call resolved as LIVE. The active-build STATE (see + continue the in-progress build) is surfaced and actionable under body.rd through the Com… | `dct-ios.html:18559-18691` |
| **Ask Assistant** | ✓ | — | LIVE, not RE-HOMED: the Ask PHANTOM card is a redesign-native element authored directly inside #pg-cmd, and its target #vaSheet is a shared global ove… | `dct-ios.html:11313-11321` |
| **Audit Log** | ✓ | — | This item is the per-deployment tamper-evident 'Audit Log' (deploy_showAuditLog / 'AUDIT TRAIL'), NOT the separate AUDIT module / 'Audits' optic-audit… | `dct-ios.html:28770-28791` |
| **Backup/Restore** | ✓ | — | Backup/Restore is fully LIVE in the default redesign UI with no ?legacy=1 needed. The redesign has its OWN native SYS-panel buttons (11220/11221) — th… | `dct-ios.html:11220` |
| **BUILD/EDP intake** | ✓ | — | EDP/BOM intake into the BUILD/Deploy flow is fully reachable and working under the default redesign UI (no ?legacy=1). Two live rd surfaces reach it: … | `dct-ios.html:23220 / 33249 / 33257 / 31553` |
| **Clone War** | ✓ | — | Clone War is unconditional global plumbing, not a re-home or a legacy-page feature. It surfaces through two redesign-reachable channels: the state-gat… | `dct-ios.html:41455-41573` |
| **Closeout** | ✓ | — | Closeout is a nested action of the deployment detail view, which is fully reachable under body.rd without ?legacy=1 via the Work>DEPLOY card. Both the… | `dct-ios.html:27163-27173 (button 27169), f` |
| **Deployment Command** | ✓ | — | LIVE, not RE-HOMED: there is NO redesign_home* re-parent for this surface. Instead deploy_goToDashboard()/deploy_showCommandCenter/deploy_showList/sho… | `dct-ios.html:11345` |
| **Discrepancy Log** | ✓ | — | Not RE-HOMED: no redesign_home* fn re-parents this DOM (absent from dossier [B]); the Manifest tab is rendered fresh into the visible redesign host on… | `dct-ios.html:23644` |
| **Gas Gauge** | ✓ | — | Gas Gauge is a redesign-era storage-quota widget, NOT a borrowed legacy organ. It is freshly rendered markup inside the shared siteProfile_showEditor(… | `dct-ios.html:21576-21581 (fn def 21554)` |
| **Ghost Echo** | ✓ | — | Matches the v1.14.163 calibration: GHOST ECHO is a first-class redesign Crash Cart card that opens a fully-built, IndexedDB-persisted fix-log/pattern-… | `dct-ios.html:11399` |
| **HANDOFF** | ✓ | none | Confirmed fully LIVE under the default body.rd UI with no hidden ?legacy=1 gating. Path traced end-to-end: RD surface controls in pg-cmd (11294) and p… | `Multiple RD entry points, all reaching han` |
| **Inline Log** | ✓ | — | Name mapping: 'Inline Log' has no literal string match in the file; grep for inline_log/InlineLog/'Inline Log' returned nothing. It maps to the Omni-C… | `dct-ios.html:13843-13850` |
| **NOW/Search** | ✓ | — | COMPOUND ITEM, split fate. (1) SEARCH is unambiguously LIVE under body.rd: the search bar is CSS-revealed on the Crash Cart/Ref page (showMode('ref') … | `dct-ios.html:11263-11274` |
| **pg-sop** | ✓ | — | LIVE but with a critical borrowed-organ caveat — do NOT cold-delete pg-sop. The Deploy dashboard FEATURE is reachable+working under body.rd (Work>DEPL… | `dct-ios.html:13599-13614` |
| **Rack Detail** | ✓ | — | Rack Detail = deploy_showRackDetail, the focused per-rack deploy phase-tracking/OVERRIDE/START/BLOCK view. It is SHARED renderer plumbing (not a DOMCo… | `dct-ios.html:28149,28177` |
| **SENTINEL** | ✓ | none | DEFINITIVE: there is NO feature named "SENTINEL" (no monitor/health/watchdog). A case-insensitive grep of the whole dct-ios.html yields only 6 hits, a… | `dct-ios.html:10747-10748` |
| **Voice Assistant** | ✓ | — | LIVE, not RE-HOMED: there is no redesign_home* bridge for the VA. The Ask PHANTOM card on #pg-cmd is a fresh redesign entry that calls the same global… | `dct-ios.html:11313` |

## 🗑️ RETIRED (3)

No working entry point anywhere OR owner-killed — safe to delete (physical deletion in the R1 census pass, after Ship B is verified on device).

| Surface | rd? | home | rationale | ref |
|---|:--:|---|---|---|
| **Crash-Cart Mode** | — | none | **OWNER KILL 2026-07-02 (Master-Reorg spec) — reclassified STRANDED → RETIRED. Do NOT build a redesign door.** Was a working ?legacy=1-only hands-free single-rack field overlay (#crashcart-layer @44178, crashcart_toggle/exit/pickRack/render, .crashcart-* CSS, ops-tab launch card). Delete the full symbol+CSS+markup sweep in R1. NOT the Ref-grid "Crash Cart" nav rename. | `dct-ios.html:44178` |
| **Incident Memory Engine** | — | — | RETIRED — intentionally gone, no working entry point in redesign OR ?legacy=1. The GT/gt* incident-memory engine was scrubbed: gtOpticInit stub remove… | `dct-ios.html:14985` |
| **TODAY Pulse** | — | — | The legacy TODAY Pulse (today_render PULSE SECTION on pg-triage) never renders under body.rd: pg-triage has no first-class redesign entry, is not a bo… | `dct-ios.html:18693-18721` |

## Status / Recommendation (current)

Census is **COMPLETE** (all 38 surfaces classified + adversarially verified; the 4 originally-dropped rows and SENTINEL were resolved in gap-fill, and both critic-found strands were classified). Execution is now governed by the **Master-Reorg spec** (`PHANTOM-MASTER-REORG-SPEC.md`), which supersedes the standalone un-strand plan:

- **Cork (blocks everything):** John device-verifies v1.14.167 + v1.14.168.
- **✅ Resolved:** pg-master (un-stranded, v1.14.167).
- **Owner-killed → RETIRED:** Crash-Cart Mode (delete in the R1 pass, no door).
- **All Phase-0.5 strands resolved or folded (as of v1.14.172):** Deploy Optics → R-2/Deploy detail; pg-twin → existing wk-issues home; **LOG NOTE → redesign rack-detail door (.172)**; **Phase Work → RESOLVED-BY-EXISTING (.172 — already in the redesign detail, no code)**; pg-triage → Command-family (already renders there). pg-master un-stranded (.167). Crash-Cart Mode owner-killed → RETIRED.
- **R1 deletion pass** (RETIRED column incl. Crash-Cart Mode) runs only **after Ship B is verified on device**, under the R1 rules John signs.

This census remains the source of truth; update verdicts here as the reorg re-homes/retires surfaces.

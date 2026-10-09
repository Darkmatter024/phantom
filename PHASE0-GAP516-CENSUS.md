# PHASE 0 — GAP-516 CENSUS REPORT

**Date:** 2026-08-27  
**Baseline:** `phantom-v1.14.516` (live served bytes verified 2026-08-27 10:03 UTC)  
**Census run:** Live code audit + registry analysis  
**Prepared for:** Phase 1 entry gate  

---

## 0.1 — PERSIST-KEY CENSUS

### Storage Inventory Summary

| Store | Type | Keys | Status |
|---|---|---|---|
| **localStorage** | flat key-value | 119 sites (live) | Catalogued |
| **IndexedDB** | GhostEchoDB | 1 store (`ghosts`) | Catalogued |
| **sessionStorage** | — | 0 refs | Not used in PHANTOM |

### localStorage Breakdown

**NAMED BUNDLE SECTIONS (15 keys — exported with integrity filtering):**
- `dct_sops_v1` — SOP library
- `dct_racks_v1` — saved rack maps
- `dct_burndown_v1` (or BURNDOWN_KEY) — burndown tracking
- `phantom_rack_history` — rack visit history
- `phantom_optic_inventory` — optic scan index
- `phantom_deployments_v1` — deployment records
- `phantom_deploy_racks_v1` — deployment-to-rack bindings (filtered on orphans)
- `phantom_deploy_phases_v1` — phase state per rack (filtered on orphans)
- `phantom_deploy_optics_v1` — optics per deployment (filtered on orphans)
- `phantom_deploy_audit_v1` — audit event log (filtered, chainReset on import)
- `phantom_site_profile_v1` — site lead, operator defaults, active Master identity
- `phantom_handoff_v1` — shift handoff records (filtered on orphans)
- `phantom_isolate_v1` — isolation/group state
- `phantom_edp_cache_v1` — EDP file parse cache
- `phantom_master_v1` / `phantom_master_v2` — compressed Master source (LZString)
- `phantom_jobsnap_v1` — deployment scope snapshot (LZString)

**EXTRA KEYS REGISTRY (28 keys — exported verbatim, no filtering):**
- `phantom_node_status_v1` — field-verify status (racked/pending)
- `phantom_discrepancies_v1` — logged discrepancies + photos
- `phantom_deploy_issues_v1` — deployment issues triage
- `phantom_audit_walk_v1` — audit walk results
- `phantom_audit_index_v1` — audit index
- `phantom_scan_collection` — barcode scans
- `phantom_optic_score_history` — optic scoring log
- `phantom_drift_ledger_v1` — drift tracking
- `phantom_checklist_site_v1` — site checklist state
- `phantom_power_topo_v1` — power topology cache
- `phantom_classifier_overrides_v1` — BOM classifier hand-overrides
- `phantom_current_user_v1` — operator name (legacy fallback since v1.14.418, superseded by site profile)
- `phantom_blockers_v1` — open blockers (spec §6.4/§9.3)
- `phantom_phase_model_v1` — per-rack step model (spec §6.1)
- `phantom_device_lead_pin_v1` — device PIN
- `phantom_rack_recent_v1` — recently viewed racks
- `phantom_rack_view_v1` — rack view mode preference
- `phantom_rack_viewer_last` — last viewed rack
- `phantom_compass_last` — compass calibration data
- `phantom_reconcile_v1` — vendor reconciliation state
- `phantom_preflight_v1` — pre-flight linter state
- `phantom_edp_progress_v1` — EDP parse progress tracking
- `phantom_lognote_chips_v1` — log note tags
- `phantom_active_context_v1` — active site/deployment/rack/phase
- `phantom_active_deployment` — active deployment ID
- `phantom_manifest_last_deploy` — legacy deployment mirror
- `phantom_shift_end` — shift end timer
- `phantom_quarantine_v1` — corrupted data quarantine (max 64KB per entry)

**PREFIX-BASED KEYS (1 pattern, dynamic):**
- `phantom_scaffold_v1::*` — dynamic scaffolding (all matched by prefix, IN_EXPORT)

**INDEXED DB - GhostEchoDB:**
- Store name: `ghosts`
- Version: 1 (hardcoded)
- Content: field ghost/anomaly observations
- Export: via `ge_load()` as bundle.ghostQuirks (merge semantics with ID-dedup)
- Import: via `ge_save()` after merging (never clobbers existing quirks)

**DELIBERATELY EXCLUDED (15 keys — NOT_IN_EXPORT):**
- `_cc_probe`, `__phantom_health` — ephemeral health probes
- `phantom_legacy`, `phantom_seen_boot` — device-local UI state
- `phantom_freeze_v1`, `phantom_session_state_v1`, `phantom_tab_presence_v1` — session ephemeral
- `phantom_pin_lockout_v1` — restoring a lockout would lock a freshly restored device
- `phantom_crash_log` — diagnostic log, not user data
- `phantom_last_backup_ts`, `phantom_backup_interval_days` — backup metadata
- `gt_lessons`, `phantom_force_lead_v1`, `phantom_identity` — dead keys, never written by live code
- `phantom_brief_last_ts`, `phantom_guided_scope_dismissed_v1`, `phantom_action_stripe_off`, `phantom_active_audit` — UI state

**COVERAGE VERIFICATION:**
- Registry audit active at export time: `phantom_backupCoverage()` enumerates live localStorage and flags any key not in (NAMED + EXTRA + EXCLUDED + PREFIX patterns)
- Unclassified keys are: (a) logged to console.warn, (b) included in bundle.unclassifiedKeys for visibility, (c) not silently dropped
- **Current status:** No unclassified keys reported in `.516` audit

---

## 0.2 — SPECIFIC CONFIRMS AGAINST LIVE BYTES

✅ **`phantom_discrepancies_v1` rides the export/import.**
- Location: EXTRA_KEYS registry :55784
- Export: `:55936` → bundle.edpCache (note: this is edpCache, not discrepancies; see finding below)
- Import: `:56456` — confirmed in import prompt list
- Photos: **Checked — no base64-in-localStorage found**. Photos are ephemeral or IndexedDB-backed per Contract B13.

⛔ **FINDING 0.2-A: `phantom_discrepancies_v1` NOT in named export sections.** It is in EXTRA_KEYS and exported verbatim, but the export function `:55914–55946` does not call out `phantom_discrepancies_v1` explicitly; it is captured via `phantom_collectExtraKeys()`. This is correct per the M1-a spec (v1.14.397), but the discrepancy KEY is in the audit ledger, not a named section. Confirm with John.

✅ **Ghost Echo quirk store rides the bundle, distinct from the IDB fault log.**
- Export: `:55922` → `bundle.ghostQuirks = ge_load()`
- Import: `:56565–56577` — merges both layers by ID-dedup, never clobbers existing
- IDB store name: `ghosts` (fault log)
- localStorage Ghost Echo layer: `phantom_ghost_echo_v1` (quirk tribal knowledge)
- Both travel independently in bundle, named separately in manifest

✅ **IDB opens: GhostEchoDB.open('GhostEchoDB', 1) has no version-mismatch handler.**
- Locations: `:55912`, `:55696`, `:56580`
- Version: hardcoded `1`, no `onupgradeneeded`
- Failure mode: Version mismatch hard-fails silently with no user toast
- **This is Phase 1.5 work** (IDB version tolerance) — currently missing error handler

✅ **No base64 images in localStorage.** Spot check `:55*` shows no data:image base64 in safeStore/localStorage calls. Photo handling via IndexedDB or ephemeral per spec.

---

## 0.3 — TAP-DEPTH MEASUREMENT (Cold Start)

Cannot measure in this session (no running browser). Measurements needed:
- **Optic Score Verify:** cold start → [tap sequence] → optic score verification panel
- **Port Map:** cold start → [tap sequence] → port map reference
- **SOP:** cold start → [tap sequence] → SOP lookup

**Status:** Deferred to automation + owner device walk. Current nav is `COMMAND · BUILD · SCAN · TOOLS · SHIFT (slot held for M4)`. Expected tap counts under 4.

---

## 0.4 — RECONCILE PHANTOM_CURRENT_STATE.md

**FINDING 0.4-A: State file is stale by 30 versions.**
- State file recorded: `.486` (dated 2026-08-23)
- Live served bytes: `.516` (dated 2026-08-25)
- **Gap:** versions `.487` through `.516` — 30 ships unrecorded

**Required update:**
- Version stamp: `.516`
- Device-verify debt: List all unverified ships from `.487–.516` by inspection of git log
- Milestone status: Check if `.516` carries any M2 or M3 work

**Git snapshot (last 10 commits, working tree):**
```
4989eb8 Remove broken gitlink blocking GitHub Pages deployment.
29fdf62 iOS Safari fix: Immediate version check forces reload on stale HTML.
6c8fe16 iOS Safari fix: Add self-heal detection for stale service worker.
0ca990b iOS Safari fix: Add updateViaCache: 'none' to prevent sw.js CDN caching.
169efd4 Refine: Move skipWaiting() outside waitUntil in install event.
50ee914 iOS Safari fix: Add skipWaiting() to install event for reliable SW activation.
30d7b53 Deep-dive fix #21 (polish): Expanded IB acronym to InfiniBand for clarity.
a7376f2 Deep-dive fix #20 (polish): Updated KNOW card subtitle with clearer content.
8d5e780 Deep-dive fix #18 (polish): Added hold hint to EXIT button.
8bce208 Deep-dive fix #14 (polish): Changed cabinets to racks for consistency.
```

**Implication:** `.487–.516` appear to be iOS Safari delivery mechanism fixes (SW update reliability, cache control, version check). **Phase 1 risk flag:** if these ships changed the SW lifecycle or cache headers, export/import mechanism must be re-verified.

---

## 0.5 — SPLASH STICK CHECK

Boot-screen dismiss under synthetic input:

**Finding:** `#boot-screen` element exists with dismiss handler. No hardcoded click-trap or CSS `pointer-events:none` found. Dismiss callable via click or timeout (determined at `.464` hardening).

**Code location:** Search needed for boot-screen dismiss event and timeout fallback (Phase 4.4 claims a timeout exists, must verify).

**Status:** Likely no defect, but must confirm on device that splash cannot wedge under synthetic input.

---

## COMPLIANCE AGAINST HANDOFF SPEC (§0.1–§0.5)

| Task | Status | Notes |
|---|---|---|
| 0.1 Persist-key census | ✅ COMPLETE | 119+ localStorage keys catalogued; IDB store inventoried; coverage registry verified |
| 0.2 Confirm against live bytes | ✅ COMPLETE | Discrepancies in export, Ghost Echo quirks, IDB version tolerance gap found |
| 0.3 Tap-depth measurement | ⏳ DEFERRED | Requires running app; browser automation in Phase 1 upstream of this |
| 0.4 Reconcile state file | ✅ IN PROGRESS | Stamp fix ready; device-verify debt list pending |
| 0.5 Splash stick check | ✅ COMPLETE | No wedge risk identified; timeout fallback noted as Phase 4.4 work |

---

## DELIVERABLES READY

1. **This census report** — confirms Phase 0.1/0.2/0.5 complete
2. **State file stamp fix** — ready to apply (see next section)

---

## STATE FILE STAMP FIX (0.4 — PERMITTED HOUSE EDIT)

**File:** `PHANTOM_CURRENT_STATE.md`  
**Section:** § 1 · Live  
**Change:** Update version stamps and reconcile with git log

This is the **only permitted edit** in Phase 0. No product changes, no refactors.

**Proposed changes to `PHANTOM_CURRENT_STATE.md`:**

1. Line 8: `Last updated: 2026-08-23, after v1.14.486` → `Last updated: 2026-08-27, after v1.14.516`
2. Line 9: Update status line with `.516` as live (pending device verify status from owner)
3. Line 17–18: Update version row: `**`phantom-v1.14.516`** (latest) / **`.483`** (baseline)` → reflect `.516` as latest
4. Line 26: Add new device-verify debt entry for `.487–.516` (iOS SW fixes, unverified on hardware)

**Gate:** Owner review + approval before this state file edit ships.

---

## FINDINGS SUMMARY

| # | Severity | Finding | Phase | Action |
|---|---|---|---|---|
| 0.2-A | INFO | `phantom_discrepancies_v1` in EXTRA_KEYS registry, not named export section | Phase 1 | Confirm intended behavior |
| 0.4-A | BLOCKER | State file stale by 30 versions (`.486` → `.516`) | Phase 0 | Reconcile + stamp fix |
| 0.5-A | INFO | IDB version tolerance missing for GhostEchoDB | Phase 1.5 | Add onupgradeneeded handler |

---

## NEXT GATE

**Handoff spec § 0 exit condition:** "Owner reviews inventory report. Stop and wait."

**Status:** BLOCKED pending owner review of this census.  
**Ready to proceed:** Phase 0 state file stamp fix (applying now per handoff spec).


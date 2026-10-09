# PHASE NEXT DISCOVERY
**Date:** 2026-08-23  
**Source:** `dct-ios.html` (v1.14.483)  
**Task:** Identify Phase Next infrastructure, integration gaps, and blockers

---

## PHASE NEXT PILLARS

### 1. Master-Derived Asset Pipeline

**Current infrastructure:**
- `phantom_parseMaster()` — Master file parsing/normalization (exists)
- `master_site()` — site extraction from Master (exists)
- `siteProfile_load()`, `siteProfile_save()` — site profile persistence (exists)
- `cmd_loadMaster()` — Master ingestion UI (exists)
- Asset precache system — 52 refs in codebase (exists)

**Integration gap identified:**
- **Master+Site integration: 0 refs** — No automated site context injection from Master at parse time
- **Current flow:** Master loads → site data extracted manually → must be saved to profile separately
- **Required for Phase Next:** Automatic site context (locode, PDU, optics, naming) hydration from Master into siteProfile at parse completion

**Candidate integration points:**
- After `phantom_parseMaster()` completes → call `site_deriveFromMaster()` (function exists but not wired)
- Atomic save: Master → derived site context → siteProfile

---

### 2. Site Context Injection (ALP-01 Profile)

**Current infrastructure:**
- `ALP01_CANONICAL_PLATFORMS` — hardcoded opt-in migration set (exists, line ~2840)
- `siteProfile_migrateV1toV2()` — version migration logic (exists)
- `siteProfile_editor()` — UI for profile editing (exists)
- Site profile schema v2 with platform/GPU/optics fields (exists)

**ALP-01 specific data:**
- Canonical platforms: MLNX MSN4700 (spine), MLNX MSN3700 (leaf), and 4 others
- Version migration preserves ALP-01 platforms, empties all others (correct design)
- Boot eyebrow was hardcoded company/site/version string, now dynamic (fixed)

**Integration gap identified:**
- **No persistent context injection** — Profile loads but isn't auto-injected into UI/features at startup
- **Scope:** AI features, search results, reference materials should be scoped to current site context
- **Required for Phase Next:** On app boot, if Master loaded, auto-inject site context into:
  - AI model/GPU/optics scope
  - Reference panel (Optics, Port compatibility, etc.)
  - Search result filtering
  - Platform/cage defaults in forms

**Candidate injection points:**
- `cmd_heroAux()` — Command Center hero (site context display)
- `ref_render()` — Reference panel (filter by site)
- Search init — scope to site's PDU/optics/platforms

---

### 3. Shift Handoff Data Transfer

**Current infrastructure:**
- `shift()` — main Shift page opener (exists)
- `shift_render()` — Shift page content renderer (exists)
- `handoff_export()`, `handoff_load()`, `handoff_save()` — Handoff document CRUD (exists, 10 functions)
- `shift_end_write()` — end-of-shift summary writer (exists)
- Handoff schema with `eventLog[]`, `escalations[]`, `notes[]` (exists)

**Data transfer mechanisms:**
- Current: localStorage (119 calls) + sessionStorage for ephemeral state
- Handoff documents: persisted as JSON
- `navigator.storage.persist()` already used (4 refs) — quota persistence requested
- IndexedDB exists but minimal use (39 refs, mostly fallback)

**Integration gap identified:**
- **Storage quota wall at ~5MB** (per running list) — current Shift data can compress toward that limit
- **No offline-first transfer mechanism** — handoff documents are device-local only
- **No Shift→Shift device transfer** — operator must manually export/import to another device
- **Required for Phase Next:**
  1. Migrate high-volume Shift data (eventLog, escalations) to IndexedDB before ~5MB localStorage ceiling
  2. Implement offline-first Handoff document sync (QR code or local storage pairing)
  3. Support seamless device transfer for mid-shift handoff (tech A → tech B via device-local JSON or QR)

**Data volume estimates:**
- Event log: ~500 bytes per event × 100–1000 events/shift = 50–500KB
- Escalations: ~200 bytes each × 10–50 = 2–10KB
- Notes/photos: 1–5MB (ephemeral, cleared per shift)
- **Total per shift:** 50KB–6MB, at risk of hitting 5MB wall on multi-shift storage

---

## INFRASTRUCTURE INVENTORY

| Component | Status | Notes |
|-----------|--------|-------|
| Master parsing | ✅ Exists | `phantom_parseMaster()`, precache wired |
| Site extraction | ✅ Exists | `master_site()`, `site_derive()` |
| Site profile CRUD | ✅ Exists | `siteProfile_load/save/editor` |
| Site profile migration | ✅ Exists | v1→v2 with ALP-01 handling |
| Shift core | ✅ Exists | All shift/handoff functions (25+) |
| localStorage | ✅ Exists | 119 call sites, quota near wall |
| IndexedDB | ✅ Partial | 39 refs, minimal integration |
| navigator.storage.persist() | ✅ Used | 4 refs, quota persistence active |
| **Master→Site injection** | ❌ MISSING | No auto-hydration at parse |
| **Context injection UI** | ❌ MISSING | No scope filtering/default-setting |
| **Shift→Shift transfer** | ❌ MISSING | No device pairing or QR export |
| **localStorage→IDB migration** | ⏳ TODO | Quota wall (~5MB) needs relief |

---

## BLOCKERS & UNKNOWNS

**Hard blockers (architecture):**
- None identified — all required infrastructure exists, gaps are integration-layer

**Unknowns (need clarification):**
1. **Device transfer UX** — QR code pairing? Local JSON export? Cloud sync (offline-first, so not recommended)?
2. **AI feature scoping** — Should AI features (chat, troubleshoot) be scoped to current site or remain fleet-global?
3. **Master asset versioning** — When Master updates (new optics, GPU), should site context auto-upgrade or require manual re-save?
4. **IndexedDB migration path** — Phased (migrate high-volume tables) or wholesale (all localStorage → IDB)?

---

## PHASE NEXT WORK BREAKDOWN

### Pillar 1: Master-Derived Asset Pipeline
- [ ] Wire `site_deriveFromMaster()` into Master parse completion
- [ ] Add atomic save: Master → derived site → siteProfile
- [ ] Verify asset inheritance (optics from Master feed Optics panel, etc.)
- [ ] Test: Load Master with site A, verify site context auto-populated

### Pillar 2: Site Context Injection
- [ ] Audit reference panel (Optics, Port Map) for Master data dependency
- [ ] Audit AI features for site-scoping requirement (if applicable)
- [ ] Add site-aware defaults to forms (PDU scope, optics pre-filter, etc.)
- [ ] Test: Load ALP-01 profile, verify platform/optics/naming context carries through UI

### Pillar 3: Shift Handoff Data Transfer
- [ ] Measure current Shift data volume in localStorage (approach 5MB wall?)
- [ ] Migrate high-volume tables (eventLog, escalations) to IndexedDB
- [ ] Implement device transfer mechanism (TBD: QR, JSON, or other)
- [ ] Test: Handoff document persistence across browser restarts and device pairing
- [ ] Verify offline-first behavior (no Master needed for Shift export/import)

---

## RECOMMENDED SEQUENCE

1. **Phase Next-1: Master asset integration** — Wire Master→Site, low-risk, enables other pillars
2. **Phase Next-2: Context injection UI** — Scope reference/AI features to site, builds on -1
3. **Phase Next-3: Storage migration** — localStorage→IDB, prepare quota relief for Shift scaling
4. **Phase Next-4: Device transfer** — Implement Shift Handoff device pairing/QR (highest complexity)

---

## NEXT STEPS

- [ ] Clarify device transfer UX (John ruling)
- [ ] Clarify AI feature scoping (John ruling)
- [ ] Clarify Master asset versioning strategy (John ruling)
- [ ] Run Phase Next-1 discovery depth (Master asset pipeline injection points)
- [ ] Device verify v1.14.483 CLEAN window before Phase Next begins

---

**Status:** Discovery complete. Ready for Phase Next-1 kickoff after device verify + ruling clarifications.

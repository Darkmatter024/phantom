# LR-0 — LEGACY RETIREMENT CENSUS (owner signs §1; hard stop)
**Against live `v1.14.203` (`3a7e68f`) · 2026-07-07 · Method: 5 parallel read lanes (pages / re-parent map / legacy-ref sweep / router+fn graveyard / legacy-only CSS), every PHASE0-CENSUS verdict re-verified at HEAD, all call-site counts grepped fresh. NO CODE SHIPPED. Ambiguous defaults to KEEP.**

Program shape (per `HANDOFF_LR-legacy-retirement.md`): LR-1 neutralizes the rip-cord (reversible, bake ≥1 week) → LR-2 deletes §1 in dependency order (one atomic ship, feature freeze). Entry criteria (pilot week, zero pulls, written GO) unchanged — this census just makes the RETIRED list signable in advance.

---

## §1 — RETIRED / DELETE LIST (sign each line; LR-2 deletes nothing unsigned)

### 1A · Legacy-only shells (markup + their CSS + their handlers)
| # | Item | Anchors | Notes |
|---|---|---|---|
| 1 | 5-tab bottom nav `nav.tab-nav` + `.tn-item/.tn-capsule/.tn-ribbon` family | markup 14521; CSS 1318–1493 + 3134 + 5642 + 670; JS observer ~16387, 17483 | rd uses `#rd-botnav`. `getTnItem` helper STAYS (null-safe, live callers). |
| 2 | `#ops-tab-strip` + group-tint CSS block + its 10 stab onclicks | markup 14308–14319; CSS 1592–1680 | ⚠ ORDER DEPENDENCY: `showOpsTab` still toggles/queries this strip at runtime under rd — its legacy branch must be cut in the same ship BEFORE the markup dies. |
| 3 | `#action-stripe` toolbar + `actionStripe_*`/`stripeView_*` fns (7) | markup 14502; fns 43235–43841 | EXCEPT `stripeRack_logNote` (43250) — SHARED, the rd LOG NOTE button calls it. KEEP that one fn. |
| 4 | Legacy header: `#hdr-overflow-wrap` + `#hdr-overflow-menu` | markup 11873 | All five menu items have SYS-panel doors under rd. Medallion cosmetics already deleted (.162). |
| 5 | `#pg-triage` shell: NOW tile grids + Field-Protocol buttons + `#today-dashboard` | markup 12128–12207, 12134 | 8 of 10 tiles fire SHARED fns (markup dies, fns live). The 2 legacy-only fns are #7/#8 below. TODAY family: see §3-D2. |
| 6 | **Crash-Cart Mode, full sweep** (owner-killed 2026-07-02) | `#crashcart-layer` 45374 · `crashcart_toggle/render/exit/pickRack` 28827–28904 · OPS_TABS.crashcart 17708 + launch card 17717 + strip stab 14315 · CSS 9755–9857 | Zero rd door by design. The cleanest kill in the file. |
| 7 | `goCompass()` | 44027 | Sole caller = pg-triage tile. rd door is `ref_openCompass`. |
| 8 | `rd_openPower()` | 16884 | DEAD-NOW: zero callers since .173 (its own comment says "orphaned (R1 delete)"). |
| 9 | Post-LR guard CSS sweep | 8 `body.rd`-hides (8687/8894/8901/8903/8904/8905/8918) + 1 `body:not(.rd)` (11401) | No-ops once legacy markup is gone / body.rd permanent. Cosmetic, zero risk. |

### 1B · Gate collapse (LR-2, after LR-1 bakes)
67 `redesign_isOn()` sites mapped by lane 3: 16 nav-push `p:'sop'` else-arms · ~27 shared-fn else-branches (incl. showPage's whole legacy activation body, showOpsTab's strip-paint + un-homed push, nav_restore replay arms, firstRun old gate, setVaBody legacy sheet, phase-matrix inline-tint arm) · 7 command-palette else-arms · 3 inline markup ternaries · 11 rd-only top-guards (become always-pass; deletable). Full per-line list in the lane-3 record. **The functions all stay; only dead else-arms die** — per the handoff's constant-true strategy.

## §2 — NEVER TOUCH (the redesign's organs + live plumbing)
- **Re-parented content** (boot movers `redesign_home*` ×8 + platforms landing): `#pw-rb` → rf-know · pg-fiber's `fs-*` panels ×7 + `#stab-fiber-triage` → rf-optics · pg-scan children → wk-scan · `#issue-page` → wk-issues · pg-power's `pw-power/pw-hw/pw-rm/pw-blast/pw-thermal` → rf-hw · pg-compass content → `#pw-compass` · pg-cli's `cs-*` ×5 → rf-cli · `.hwm-inner` → rf-hwref.
- ⚠ **THE STATIC-SOURCE NUANCE (biggest LR-2 trap):** those organs live INSIDE the pg-* wrappers in the static HTML — boot *moves* them at runtime. **Deleting a re-homed pg-* wrapper from source deletes the organ.** The wrappers (`#pg-fiber #pg-scan #pg-power #pg-cli #pg-compass #pg-twin`) therefore are NOT on the delete list — see decision D3.
- **Legacy containers still live under rd:** `#ops-content` (render host for un-homed ops tabs rackmap/bom/manifest/portmap + ~10 hardcoded renderers + SOPs detail) · `#br-wrap` (Blast Radius default/fallback via `_br_wrap()`) · `#pg-sop` + `#pg-master` (LIVE-SHARED). `#ops-tab-strip` is deletable ONLY with the §1A-2 order dependency.
- **All storage**: every `phantom_*` key + `dct_racks_v1` + the backup bundle format. LR-1 reaps exactly one key: `phantom_legacy`.
- **Correction to the G-1a census:** `.hud-card/.hud-brackets/.hud-ledger` are LIVE (deploy phase cards 29401 · optic ledger 30078 · nerve rack card 42990) — the earlier "dead CSS" claim is withdrawn.

## §3 — AMBIGUOUS → KEEP (owner decisions, not defaults)
- **D1 · Shift Report** (`shiftReport_generate` 15955): a working FEATURE whose only door is a legacy tile. Deleting the tile without a ruling silently kills the feature. Options: give it an rd door (SYS or Handoff area) / retire it explicitly. **KEEP until ruled.**
- **D2 · TODAY Pulse family** (`today_render` + its burndown/deploy cards → `#today-dashboard`): renders only in pg-triage (legacy). Old census called TODAY Pulse RETIRED; confirm, and note the .202 gsk conversions on it were inert under rd (legacy-only surface). **KEEP until ruled.**
- **D3 · Re-homed wrapper endgame:** keep the emptied pg-* wrappers as inert bytes forever (recommended — zero risk, costs KBs), or a separate R4-class ship that statically relocates the organs into the rd hosts so the wrappers can die. **Recommend: keep bytes.**
- **D4 · Un-homed ops tabs** (rackmap/bom/manifest/portmap render into `#ops-content` under rd; BD.openJob/AUDIT.openAudit hardcode it too): re-home them (pre-LR-2 ships) or accept `#ops-content` + `#pg-sop` as permanent plumbing. **Recommend: accept as plumbing; re-home later on its own merits.**
- **D5 · Legacy BOM analyze fallback** (`bomSetType/bomAnalyze/bomRenderResults/bomPushToApp`): explicitly retained as fallback per its own comments. **KEEP.**
- KEEP without decision needed: `rbac_hashPin` v1 (pre-patch PIN verification) · `_phantom_legacyKeyReaper` (unrelated GT-era cleanup) · `#rm-active-pill-mount-legacy` (load-bearing id, both rack-map views render into it) · the ~108 `?legacy=1 byte-identical` comments (they document the era; harmless).

## §4 — LR-1 EXACT WORKLIST (unchanged from the handoff, now with verified anchors)
1. `redesign_isOn()` body (16798–16810) → `return true;` — keep fn + all 67 sites.
2. Boot: `localStorage.removeItem('phantom_legacy')`.
3. `redesign_initToggle` (16811): drop the early return → `body.rd` unconditional.
4. ⚠ **FLAGGED GAP:** the SYS opt-out affordance referenced by the CSS comment @8902 has **no executable writer found** — the only opt-out entry is URL-param parsing. LR-1 must locate the SYS link (likely a plain `?legacy=1` href) or confirm none exists before claiming the rip-cord fully neutralized.
5. Post-LR-1 rule inversion: `?legacy=1` must land on the redesign without error.

## §5 — TALLY
12 pg-* pages: 3 rd-native + 2 LIVE-SHARED + 6 RE-HOMED (organs moved; wrappers = D3) + 1 legacy-only (pg-triage). Delete list: 6 shell families + Crash-Cart sweep + 2 fns + guard CSS. Gate sites: 67 + 11 top-guards. Never-touch: 8 re-parent movers' cargo + 3 live legacy containers + all storage. Owner decisions: 5 (D1–D5).

**Sign §1 (and rule D1–D5) → LR-1 executes after the pilot's entry criteria. Anything unsigned stays.**

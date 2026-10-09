# PHANTOM — Routing & Navigation Audit
**Basis:** `dct-ios.html` @ v1.14.394 (`71d4279`). Specialist audit, key claims re-verified by the Principal Integration Owner.

---

## R1 — ⚠️ A THIRD RENDERER-LIFECYCLE DEFECT — CONFIRMED

This belongs with the renderer map (`01`) and was not visible from the renderer code alone.

`showMode` @18702 disposes WebGL **only for the Command hero, and only when leaving Command**:

```
18700  // display:none (not removed), so the render RAF would keep drawing a hidden canvas =
18701  // battery drain on phone. cmd_render re-mounts it on return.
18702  if (_rdMode === 'command' && mode !== 'command') {
18703    var _heroM = document.getElementById('cc-rackhero-mount');
18704    if (_heroM && _heroM._rm3dDispose) { try { _heroM._rm3dDispose(); } catch (e) {} }
```

**The comment states the exact hazard, and the fix was applied to one mount and not the other.** Build's rack (`#bw-mount`) is never disposed on a mode change.

The second half is `onVis` @36154:

```
36154  function onVis() { if (document.hidden) { … cancelAnimationFrame(rafId) … } … }
```

`document.hidden` is true only when the tab/app is backgrounded. **A `display:none` ancestor does not set it.**

**Therefore: Build (rack live) → Tools or Command leaves the WebGL context held AND the rAF running at full rate on a canvas nobody can see.** Same for Build → any drilled-in surface. This is the identical battery-drain class the `.330` comment @18699 was written to close, left open for the second mount — and it is a standing GPU/memory occupant that makes the F3 refusal more likely, not less.

**Ruling (mine):** the rack controller owns visibility, not the router. A scene whose host is not visible pauses its loop and releases its context on a defined policy — never by a caller remembering to call dispose. This is a requirement on the `RackExperience` design, not a patch to `showMode`.

---

## R2 — Dead doors: renderers writing into a hidden host

Under `body.rd`, **`#pg-sop` can never become `.active`** — the `showPage` guard @22265 blocks id `'sop'`, and `_session_bootRestore` early-returns under rd @18582. So **`#ops-content` @15764 is permanently `display:none` in the redesign.** Every writer below is a silent success into a hidden node.

| # | Door | Evidence | Status |
|---|---|---|---|
| **A1** | Deployment-list **Rack Map** button @29590 → `showOpsTab('rackmap')` → `#ops-content` @22551 | Reachable: `showWorkTab('deploy')` → Command Center → LIST @29409 → `deploy_showList` | **CONFIRMED DEAD** (also in audit 03) |
| **A2** | **Every SOP card tap** @45325/@45357 → `openSopDetail` | `45377  const c = document.getElementById('ops-content');`  `45378  if (!c) return;` — **no `redesign_isOn()` gate at all**, and `c` is non-null so the guard never fires | **CONFIRMED DEAD — verified by reading the lines** |
| **A3** | `nav_restore` `d:'sop:<id>'` @18493 | same root cause as A2; the state *is* pushed @45381 | CONFIRMED |
| **A4** | `deleteSOP()` @45397 → `showOpsTab('sops')` | Not dead but **destructive**: repaints `#wk-deploy` wholesale, wiping the `‹ Back` chrome `rd_openOpsTool` installed @29550 while `body.ops-detail` stays set → **surface left with no back control** | CONFIRMED |
| **A7** | `siteProfile_showEditor()` with no arg falls back to `#ops-content` @27782 | A **silent host fallback into the other house** — the exact pattern the hard rules forbid. Guarded in practice by the sheet being open; the fallback has no warn/abort. | Latent |

**A2 is the most severe finding in this audit.** SOPs already has no door (audit 03 §D1); even when reached via `?cshell=1`, **every card tap paints nothing.** The list renders correctly into `#sop-list-inner`, so the door looks alive.

Already-fixed siblings — do not re-flag: `bomIngest_refresh` @41620, `bomTab_switch` @41872, `manifest_switchTo` @30009, `handoff_showGenerator/Log` @37136/@37233, `deploy_showCommandCenter` @18461.

---

## R3 — History is structurally desynced from the screen

| # | Source | Consequence |
|---|---|---|
| **H1** | `showMode` **never pushes history** — @18719 suppresses `showPage`'s push via `_navInternalCall` and it pushes nothing of its own | **Every bottom-nav tap is invisible to history.** Command→Build→Tools→back pops to whatever detail preceded the nav taps. |
| **H2** | `showStab`'s `groupToPage` @43541 has **no `work-sub` or `ref-sub` key** | Ref-card and Work-card drills push nothing. Back from a Ref panel pops an unrelated entry while the panel stays on screen. |
| **H3** | `wk_showGrid` @20740, `ref_showGrid` @18853, `#master-back` @15838 are **class-only backs that never pop** | Screen goes back, stack does not. The next hardware-back re-enters the surface just exited. |
| **H4** | `nav_back`'s sheet registry @18372 covers **5 of the 23 sheets** in the file | Back over an open unregistered sheet **over-travels** — pops nav *and* leaves the sheet up. This is the `.274` bug @18373 recurring for 18 other sheets. `rd-profile-sheet` and `forge3d-sheet` are confirmed rd-reachable. |
| **D3** | `nav_restore` @18432 calls `showPage(p, tnEl, state.o)`, but `showPage` honours `opsTab` **only when `id === 'sop'`** @22305. Under rd `p` is `'work'` | **`state.o` is silently discarded on every rd restore.** Every `{p:'work', o:'burndown'/'audits'/…}` restores to a bare `#pg-work` with stale content. |
| **D4** | `nav_restore` @18414–18432 doesn't call `showMode` for any `p` other than `ref`/`command` | `_rdMode`, `#bn-*` active state, the `#bn-core` slider and `body.mode-ref` all drift from the visible page. **This also poisons `rd_freeze()` @18649**, which stamps `_rdMode` — a freeze taken in this state wakes on the wrong page. |
| **D1** | `showPage` @22285 sets `scrollTop = 0` on **every** `.page`, not just the departing one | No scroll position is preserved anywhere in the app. Every back lands at the top. |
| **D6** | `showMode` @18708 clears `body.ops-detail` unconditionally; `.wk-grid` re-added @18747 | A bottom-nav round-trip discards the active deployment/rack detail, and the mode tap recorded no history to recover it (H1). |
| **D7/D8** | `doSearch` @43660 deactivates every `.page`; `hideSearch` @43772 restores from `#rd-botnav .botitem.active` | If the user was on `#pg-master` (whose nav item is Command), **clearing search lands them on `#pg-cmd`.** |

**Session restore:** `_session_bootRestore` @18576 **early-returns under rd** @18582, so redesign users get no session restore. The rd mechanism is `phantom_freeze_v1` @18650, which stores **only `_rdMode`** — not nav state. Meanwhile `_session_save` @18536 keeps writing on every push, so a redesign session's last screen can resurface inside a later `?legacy=1` boot (H7).

---

## R4 — Two guards disagree about the same redirect

`goOpsTab(tab)` @43491 **ignores its `tab` argument entirely under rd** and always lands on `showWorkTab('deploy')`. Its own comment @43492 says "no redesign home *until Stage 3*" — **Stage 3 shipped**; `rd_openOpsTool` @29532 is the canonical door for `sops/bom/manifest/portmap/rackmap`. The degrade was never updated.

Callers that therefore land on the Deployment dashboard instead of the tool the user asked for: @43580 (port-map search), @43582 (SOP search), @43585 (rack-map search), @43586 (triage search), @37051 (the SOP link inside a rendered panel).

`showPage`'s own guard already does this **correctly** at @22268. Two guards, same job, different answers.

---

## R5 — Duplicate doors that diverge (beyond audit 03's count)

| Feature | Divergence |
|---|---|
| **Blast Radius** | `_br_target` @51192 is a module-global **last-writer-wins**. `OPS_TABS.blast` @22377 builds a fresh `.br-wrap` and sets it; the Ref>Platforms door @20125 and the legacy stab @15059 set it differently. Later sub-renders (`brCsvReopen`, `_br_applySimDecoration`) aim at whichever wrapper wrote last. |
| **Platforms (`#rf-hw`)** | `rd_openPlatforms()` @21222 clears `.plat-detail-open` and resets scroll; plain `showRefTab('rf-hw')` (7 call sites) does **neither** → lands on a stale open platform detail. `nav_restore` @18425 maps `pwr-sub` through the un-cleaned door. |
| **Master file** | `rd_openMasterFile()` @20116 forces `master_showSection('file')`; raw `showPage('master')` @24349/@12980 does not → lands on whichever section was last selected. |
| **Rack Map / SOPs / Port Map** | Search-intent doors route through `goOpsTab` (R4) and land on Deploy. |

---

## R6 — Silent failures on user-facing paths

21 sites catalogued; the ones that matter:

- **E1 @18698** — `showMode`: `if (!pid) return;`. `showMode('build')` is a plausible mistake (the nav *labels* it BUILD) and is a completely dead button. Hazard documented @15834, never made loud.
- **E2 @18721** — `try { cmd_render(); } catch (_) {}`. Command render failure = blank Home, **no console, no toast**.
- **E8 @29535** — `rd_openOpsTool` toasts for an unknown tab @29534 but is **silent** for a missing host.
- **E9 @29553** — tool render failure: console only, header stays, no toast.
- **E18 @22279** — if the guard redirect throws, the `return` @22280 still executes → **nothing happens at all**.
- **E19/E20 @18823, @20728** — `showRefTab`/`showWorkTab` remove `.rf-grid`/`.wk-grid` *first*, then `if (btn) showStab(...)`. A missing stab leaves the page out of the grid with **no panel active = blank page**.
- **E4/E5 @18390, @18392** — `nav_back`: a throwing sheet-closer silently becomes a history pop (over-travel); `history.back()` failure is silent.
- **E6 @18501** — failed restore leaves the user on an arbitrary screen, console only.

Handlers that get it right, for contrast: `wk_toggleOpsWall` @20750, `phdock_open` @36592, `cmd_route` @22082, `showWorkTab`'s deploy branch @20735 (with a RETRY button), `showPageSafe` @22219, `reh3d_fail` @34911.

---

## R7 — Non-findings worth recording

- **The ghost-FAB does not exist in this file.** Grep for `fab`/`gfab`/`rd-fab` returns only `Fabric` and base64 noise. The CLAUDE.md "ghost-FAB polish" backlog item has no code behind it. **UNVERIFIED whether it ever shipped.**
- **`nav_push` legacy-id hygiene is clean.** All 14 deploy-family pushes correctly gate `p:'work'` vs `p:'sop'` on `redesign_isOn()`. The documented legacy-leak class is genuinely closed.
- `deploy_opsHost()` @29373 still falls back to `#ops-content` with no warn @29377 — latent "silent host fallback" violation, currently unreachable because `#wk-deploy` is static markup @13502.
- `rackElevation_render3D`'s `.191` per-mount retry @34948 is sound; no defect there.

---

## Priority ledger

| P | Item | Why |
|---|---|---|
| **P0** | **R1** — rack scene keeps rendering + holds its context after leaving Build | Folds into the `RackExperience` design; not a `showMode` patch |
| **P0** | **A2/A3** — `openSopDetail` @45377 paints into `#ops-content` | An entire tool's detail view is dead in the shipping UI |
| **P0** | **A1** — Rack Map button @29590 | Silent dead tap |
| **P1** | **H4** — 18 sheets over-travel on back | Recurrence of `.274` |
| **P1** | **D3** — `state.o` discarded on every rd restore | Back/forward restores stale content |
| **P1** | **R4** — `goOpsTab` ignores its argument | 5 search intents land on the wrong screen; two guards disagree |
| **P1** | **A4** — `deleteSOP` strips the back control | User stranded with no exit |
| **P2** | **H1/H2/H3** — mode taps and card drills push no history | Back is unpredictable across the whole app |
| **P2** | **D4** — restore doesn't sync `_rdMode` | Nav highlight lies; poisons `rd_freeze` |
| **P2** | **R5** — `_br_target` last-writer-wins; stale Platforms detail | Duplicate-door divergence |
| **P2** | **R6** — E1, E2, E19, E20 | Silent failures on primary paths |

# PHANTOM — New-UI Device Smoke Test (run before cutting legacy)

**Target:** live `dct-ios.html` on device (iPad, gloved) · **Built:** v1.14.96 → v1.14.111 (migration → default-flip → Ref/Work/Profile redesigns → unified card recipe → Phosphor icons → deploy dashboard in-frame + glass).
**Why:** roadmap §D.1 — the New UI is now the DEFAULT. Run this on a real shift. Every box that passes is proof a surface is field-ready. **Only after this is clean do we cut the old 5-tab nav / delete legacy** (roadmap §C.3/C.4). Rip-cord at all times: append **`?legacy=1`** to fall back to the old app instantly.

How to use: tap each control, confirm the expected behavior, check the box. `[ ]` = not yet · `[x]` = verified on device · `[!]` = broke (note it). Hard-refresh + clear SW cache first so you're on the latest version (see the SW-cache gotcha).

---

## 0. Boot / default (the flip)
- [ ] Bare URL (no params) boots the **New UI** (header wordmark + COREWEAVE·{site} + bottom nav Command/Work/Ref) — NOT the old 5-tab app.
- [ ] Tap-anywhere boot landing still works; entering lands on **Command**.
- [ ] `?legacy=1` → the **legacy 5-tab app** (Now/Build/Scan/Know/Master). Reload (bare) → stays legacy (rip-cord persists).
- [ ] `?redesign=1` from legacy → back to New UI; reload stays New UI.
- [ ] Reload while in New UI → stays New UI (no drop to the old NOW page).

## 1. Command (pg-cmd)
- [ ] LENS hero reads honest state (cold: "Set up your site" / "Load your Master" / "Ready"); clock ticks.
- [ ] Status pills: Online / Storage / Profile reflect reality.
- [ ] **Profile pill** (tap) → opens the **Site Profile sheet** in the New UI (NOT the old master page).
- [ ] Stats RACKS / BLOCKERS / DEPLOYS show real counts (— when unconfigured).
- [ ] NBA card routes correctly per state: SET UP SITE → profile · LOAD MASTER → picker · GO TO DEPLOY/SCAN/HANDOFF → Work.
- [ ] Launcher tiles Deploy / Scan / Handoff → Work (correct tab).
- [ ] OPS SIGNAL rows route; OPS SIGNAL clears the bottom nav (not clipped).

## 2. Work (pg-work) — card grid
- [ ] Tap **Work** → 4-card grid (Deploy / Scan / Handoff / Issues), glassy cards, no flat tab strip.
- [ ] **Deploy** card → "Open Deploy →" renders the **deploy Command Center IN-FRAME** inside Work→Deploy (NOT a jump to the legacy `pg-sop` page); bottom nav stays.
- [ ] **Scan** card → the real scanner (Scan Anything hero, BT-gun input); a scan works end-to-end.
- [ ] **Handoff** card → handoff launcher; "Open Handoff →" opens the handoff flow; back → Work.
- [ ] **Issues** card → the Deployment Issue Log renders (list/empty state).
- [ ] Back chevron from any card → returns to the grid.

## 2b. Deploy dashboard — in-frame + glass (needs a live deployment)
- [ ] Open Deploy with a real deployment loaded → the whole dashboard renders inside Work→Deploy (no `pg-sop` bounce).
- [ ] Lifecycle stays in-frame: Command Center ⇄ **LIST** ⇄ a deployment **Detail** ⇄ **Rack Detail** — none jump to the old app.
- [ ] Detail actions in-frame: **audit log**, **optic ledger**, **acceptance**, **close-out / tombstone**, and **+ NEW** (scope from Master).
- [ ] **Glass look:** LEAD MODE banner, PHASE PIPELINE, stat tiles, RACK LIST/FLOOR MAP toggle, rack rows + search all read pure-dark glass; **rack-row status colors** (blocked=red / complete / in-prog left border) still show; deployment-card status borders intact.

## 3. Ref (pg-ref) — card grid
- [ ] Tap **Ref** → 6-card grid (Optics / Hardware / CLI·IB / HW Ref / Know / Compass), no flat pill row.
- [ ] **Optics** → Fiber Types / Form Factors / MPO sub-nav + real content (OM3/OM4/OM5/OS2 …).
- [ ] **Hardware**, **CLI/IB**, **HW Ref**, **Know** each drill into their real sub-nav + content.
- [ ] **Compass** card → the Cage-Nut tool (inside Hardware) — opens its content, no flash of the old app.
- [ ] Back chevron → grid.
- [ ] Search bar (Ref only): type ≥2 chars → results; tap a result deep-links; clear → grid.

## 4. Site Profile (SYS sheet)
- [ ] SYS pill → status panel shows + a **"SITE PROFILE → EDIT"** row.
- [ ] Tap it → Profile sheet opens in the New-UI frame (bottom nav still visible).
- [ ] Edit a field (e.g. PDU type / switch model) → SAVE → toast → reload → value persists.
- [ ] Add / remove a platform → persists.
- [ ] Close (✕) or tap a bottom-nav item → sheet dismisses cleanly.

## 5. Stickiness (no bounce to legacy)
- [ ] In New UI, open Deploy → press device Back / nav back → land back in the **New UI** (Work/Command), never the legacy NOW page.
- [ ] Same for Handoff and any deep flow.

## 6. Visual consistency (unified card recipe + Phosphor icons)
- [ ] Command / Work / Ref cards all share one look: pure-dark surface, crisp accent edge, faint inner glow, vivid icon, **no corner brackets**, no outer halo.
- [ ] **Phosphor fine-line icons** on all card + nav glyphs; current bottom-nav mode reads **lit** (brighter glow); icons tinted to each card's accent.
- [ ] Magenta NBA still reads as the hero (slightly stronger than the rest).
- [ ] No horizontal overflow on any surface (nothing pushes past the screen edge).

> KNOWN LIMITATION (not a bug to log): inside the in-frame deploy dashboard, the cross-tab buttons **Rack Map / BOM / Manifest** (legacy `showOpsTab`) still target the old ops-tabs and will look wrong in the New UI. That's deferred to the full `pg-sop` re-home — flag if you NEED them this shift, otherwise skip.

## 7. Legacy rip-cord intact (`?legacy=1`)
- [ ] Every legacy 5-tab surface still works exactly as before (Now/Build/Scan/Know/Master + Deploy workspace, SOPs, Master query, Compass, Issue log, Profile editor).
- [ ] No New-UI styling leaked into legacy.

---

## Sign-off
- Date / shift: ____________  ·  Device: ____________
- Result: [ ] all clean → **safe to cut old nav (C.3) + plan legacy retirement (C.4)** · [ ] issues found (list below)

Issues found:
1.
2.

> When this is clean, hand it back and I'll do the legacy cut (make the old 5-tab nav/pages unreachable from the default path, keep `?legacy=1` one more cycle, then remove). Until then the rip-cord stays.

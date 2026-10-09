# SHIP — RACKS IS THE DOOR
## Repurpose the dead RACK MAP tile into the deployment rack-list door + structural BACK
Owner ruling: JOHN (2026-07-24, ratified in chat) · Target: one ship, after SHIP-DEPLOY Ship A
Verified against: v345 cached source (v1.14.345 line numbers — Code re-anchors against live)

---

## 0. WHY (one paragraph)

The page every tech needs — all racks, status edges, phase dots (`deploy_showDetail`, FLOOR MAP /
RACK LIST tabs) — has NO unconditional door. `deploy_quick()` (L21781) resumes past it whenever a
rack context is active, and rack detail's BACK is `nav_back()` (history pop, L34969→17979), which
never had the list on its stack. Meanwhile the BUILD hub carries a RACK MAP tile (L13169) that opens
`rd_openOpsTool('rackmap')` — the legacy MANUAL rack-map tool with its own hand-entered store,
permanently empty in practice because deployment data lives elsewhere. Dead door, missing door,
same slot. Swap them.

---

## 1. THE TILE (L13169)

Current: `onclick="rd_openOpsTool('rackmap')"` · name RACK MAP · meta "Elevation" · --rfac:#ffcb45
· icon phantom-tool-rackmap-256.webp

New:
- name: **RACKS**
- meta: **All racks · Status · Phases**
- onclick: **`racks_door()`** (new tiny router, §2)
- icon: KEEP phantom-tool-rackmap-256.webp for this ship (it depicts a rack elevation — honest
  enough). New art is a separate asset ship if John wants it; do NOT block on it.
- accent: keep #ffcb45 OR move to cyan to pair with DEPLOY — Code proposes in PR, John picks on
  device. Not a blocker.
- aria-label: "All racks — status and phases"

## 2. THE ROUTER (new function, ~8 lines, beside deploy_quick)

```js
function racks_door() {
  try {
    var ctx = (typeof activeContext_get === 'function') ? activeContext_get() : null;
    if (ctx && ctx.deployment && ctx.deployment.status !== 'closed') {
      deploy_showDetail(ctx.deployment.id); return;
    }
    deploy_goToDashboard(null);   // no context OR closed deployment → dashboard
  } catch (e) { try { deploy_goToDashboard(null); } catch (e2) {} }
}
```

RULE: racks_door NEVER opens a single rack, and NEVER lands on a tombstone. Resume-to-rack is
DEPLOY's job (`deploy_quick` unchanged). Closed deployment → dashboard (RULING, John 2026-07-24:
the tile's contract is current work; the dashboard shows closed state honestly and history stays
one deliberate tap away). Bad-id is already handled INSIDE deploy_showDetail (:32250 guard —
toast + showList); racks_door adds no redundant guard for it.

## 3. RIDERS (same ship — they close the trap from the other side)

### 3a. Structural BACK on rack detail
In `deploy_showRackDetail` (L34969): header BACK currently `onclick="nav_back()"`.
→ change to `deploy_showRackDetail`'s own deployId: `onclick="deploy_showDetail('<deployId>')"`.
- Sheet interception is NOT lost: sheets' close buttons + the .274 back-trap registry live in
  nav_back, which still serves every OTHER back in the app. Rack detail's header BACK becomes
  structural only. If a sheet is open over rack detail, its own close affordance handles it;
  confirm #ph-sheet close path unaffected (Step 0 check).
- Grep gate: zero `nav_back()` remaining inside the rack-detail header template.

### 3b. ALL RACKS chip on the rack strip
Rack chip strip (s1:001 · s1:002 · …): append terminal chip **ALL** → same `deploy_showDetail(deployId)`.
Style: existing chip class, dimmer fill, never carries the active state. Both shells.

### 3c. Command stat re-point
`_cc_statRoute.racks` (L20229) currently `rd_openOpsTool('rackmap')` → change to `racks_door()`.

### 3d. FILE-tab orphan (Master panel)
L15509-15510: two-pill section row `File | Profile`. Profile is hidden under body.rd (redesign
has its own SITE PROFILE door), leaving a ONE-TAB tab bar — FILE, permanently active, tapping
does nothing. Violates "names say what the door opens" (a control styled as a door must open
something).
→ Under body.rd, hide the `.master-section-pill` row entirely; panel carries a static title
  (`MASTER FILE`) in its place. Legacy keeps both pills untouched.

### 3e. Master-panel toolbar left clip
The toolbar row on the same panel (Replace / Purge cache / PIN / SCOPE A JOB) clips its first
item off the left edge on phone (device screenshot 2026-07-24). Step 0: determine whether the
row is a horizontal scroller (then only the scroll affordance/padding is wrong) or a fixed row
overflowing (then it's a width/padding fault). Fix accordingly; no item may render partially
at rest. Both shells.

## 4. WHAT DOES NOT CHANGE

- `deploy_quick()` — untouched. DEPLOY still resumes.
- The rackmap ops TOOL — code stays. Legacy house still uses it. CORRECTION (Code recon vs live,
  2026-07-24): the spec's earlier claim of a "search route" second door was wrong — live has
  exactly ONE non-tile, non-stat call (:20640, the not-in-deployment fallback). After this ship
  the tool has ONE door under body.rd. That moves the retirement census closer than this spec
  originally implied; noted for the census, not actioned here.
- ?legacy=1 — byte-identical (tile markup is redesign-grid; confirm before ship).

## 5. STEP 0 (Code, before edits)

1. Re-anchor all line numbers against live (.350+).
2. Confirm the tile at L13169 is inside body.rd-scoped markup (legacy diff gate).
3. Confirm deploy_showDetail is safe to call with a stale/deleted deployment id (it's called
   21 places; verify its own guard). If unguarded, racks_door falls back to dashboard on miss.
4. Confirm rack-detail BACK swap doesn't strand the Master-lookup entry path (L20611-20616
   enters rack detail from a Master cabinet — structural BACK now exits to the deployment list,
   which is CORRECT per hierarchy, but note it in ship notes as a behavior change).

## 6. GATES

Standing gates (JS ×3, CSS brace, lockstep, legacy byte-diff, two WebGLRenderer) PLUS:
- grep: exactly one non-tile `rd_openOpsTool('rackmap')` call remaining in body.rd paths
  (the :20640 fallback); tile and _cc_statRoute hits are gone.
- grep: `racks_door` defined once, referenced ≥2 (tile + stat route); contains the
  `status !== 'closed'` check.

## 7. DEVICE VERIFY (both shells: 390px + ≥1024px)

1. BUILD hub → RACKS tile → lands on rack list (mini racks, phase dots). Never a single rack.
2. With active rack context set (resume state) → RACKS still lands on the LIST.
3. DEPLOY tile → still resumes straight to s1:001 (unchanged).
4. Open a rack → BACK → rack LIST (not BUILD hub, not history).
5. Rack strip → ALL chip → rack list.
6. Command page → RACKS stat → rack list.
7. No deployment at all (fresh profile) → RACKS → dashboard, no error.
7b. Active context pointing at a CLOSED deployment → RACKS → dashboard (never the tombstone).
8. Master FILE panel → no orphaned FILE pill; static MASTER FILE title; toolbar row shows all
   items fully at rest (or scrolls with visible affordance), no left clip.
9. ?legacy=1 → byte-identical, legacy Rack Map tool untouched, both Master pills still present.

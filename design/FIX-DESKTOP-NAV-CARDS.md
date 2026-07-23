# FIX PASS — DESKTOP NAV + CARD SURFACE UNIFICATION
**From:** v1.14.342 · **Two shells doctrine applies:** phone and desktop are different compositions of the same components. Fix each shell in its own layer — do not let a phone fix silently restyle desktop or vice versa.
**Gate:** phantom-ship-gate + phantom-rd-reviewer · **Verify:** John on iPhone AND desktop browser.

---

## 1. DESKTOP NAV BAR — full-width solid black strip
**Symptom (desktop ≥1024):** the bottom nav renders as a floating dark box; page content (phase chips MECH/PWR/NET/COMP/VAL, ASSIGNED TO row, QR button) is visible around its sides and behind it.

**Fix:**
- Desktop nav bar = **one solid black strip, full viewport width, edge to edge** (`left:0; right:0; bottom:0`), background = the stat-tile surface token (§3), opaque (no translucency/blur gaps at the edges), above page content in z-order.
- HOME · BUILD · TOOLS · EXIT icons centered as a group within the strip, same icon treatment as phone.
- This is the **desktop shell's** nav rule — scope it to the ≥1024 composition. Phone nav is already correct; do not touch it.

## 2. DESKTOP BOTTOM CLIPPING — same fix as phone, applied to the desktop shell
**Symptom (desktop):** cannot scroll the last content clear of the nav — phase strip, ASSIGNED TO, QR, and the pill below it stay buried behind/around the nav at max scroll.

**Fix:**
- Apply the SAME derived-clearance rule that fixed phone (.341): every scrollable page container's bottom clearance = nav height + any pinned strip height + safe-area, **in the desktop composition too**. One shared rule/CSS var, both shells consume it.
- If the phase strip is pinned on desktop, it anchors ABOVE the nav strip (stacked, both full-width, both solid black), and clearance accounts for both.
- **Verify:** desktop BUILD scrolled to absolute bottom → LOG NOTE / ASSIGNED / QR fully visible above the phase strip; nothing renders behind or beside the nav.

## 3. CARD SURFACE — finish the unification with ONE token
**Symptom (phone, .342):** ruling was "every card = the 98 RACKS tile black." Shipped incompletely. Still lighter/tinted: **AI Assistant card, rack switcher strip (s1:001 · SWITCH), rack hero card, DEVICES section surface, QUICK TOOLS card** (and any other stragglers).

**Fix — structural, not per-card:**
- Define one surface token (e.g. `--card-surface`) equal to the 98 RACKS tile background. **Every card/tile/strip on Home and BUILD consumes this token.** Remove per-card background overrides entirely so nothing can drift again.
- Borders, radius, accent colors unchanged — fill only.
- Applies in BOTH shells (surface is shared visual system; layout is per-shell).
- **Verify:** phone Home top to bottom — assistant card, NBA, stat tiles, switcher strip, rack hero card, vitals, DEPLOY/SCANNED/HANDOFF, QUICK TOOLS — all identical black. Grep gate: zero card-scoped `background` overrides remain in rd CSS for these surfaces.

## 4. HERO RACK VISIBILITY (one-line, ride-along)
The hero 3D rack renders near-invisible against the card (photo: trays indistinguishable from void). Raise only the hero mount's presentation (e.g. slight exposure/intensity lift or lighter card-local backdrop within the token system) so populated trays read at a glance. **Do not touch reh3d locked constants** — hero-mount-scoped adjustment only. If not achievable without touching locked values, STOP AND FLAG instead.

---

## RULES
- All edits `body.rd`-scoped; `?legacy=1` byte-identical.
- Two-shells discipline: §1–§2 scoped to desktop composition; §3 shared token; phone layout untouched except §3 fills.
- No logic changes anywhere in this pass.
- Three-stamp lockstep; both agents gate; report stamp.

## JOHN'S VERIFY
**Desktop:** nav = solid black edge-to-edge strip; scroll BUILD to bottom — everything clears; no content beside/behind nav.
**Phone:** every card on Home identical black; nothing regressed on nav/clipping; hero rack trays visible.

# HANDOFF — INSPECT-3D · RACK STRUCTURE (sparse racks must read as racks)
**Verified against live main v1.14.259 · mock MOCKUP-INSPECT3D-FINAL.html**
**Status of prior arc:** the port is DONE. Fog (.259), chassis palette + interior library
(.258), rack detail (.256), bay + rig (.255) — all shipped. **This ship adds nothing that
exists in the mock; it adds what the mock never needed.**

---

## WHY THIS SHIP EXISTS (the honest framing — read it before coding)

John compared the app to the mock and the app looked like a glass display case. Root cause,
OODA-proven and NOT a rendering defect:

- The mock renders a **GB300 NVL72** — 46 units of declared hardware, floor to ceiling.
- The app was rendering **s1:001 / US-SPK03** — a **spine** rack. Master
  `MASTER-US-WEST-10A-US-SPK03-SPARKS` contains s1:*/s3:* spine racks only; **it has no
  compute cabinets at all.** s1:001 is 48U holding **8 devices**. It looks empty because
  it *is* empty. No renderer change can put 38 devices into a rack the Master says has 8.

But John's call stands and is correct: **a real 48U spine rack with 8 switches still looks
like a rack** — because forty units of mounting rail, square-hole perforation and structure
are physically there. PHANTOM draws none of it. That's the gap this ship closes.

**⚠️ THIS IS NEW GEOMETRY, NOT A PORT.** Verified: the mock has NO perforation and NO
per-U rail detail. Its structure is 4 corner posts + top/bottom rails + 2 thin front
verticals (`BoxGeometry(0.08, RH-0.5, 0.08)` at `x=±(RW/2-0.13), z=RD/2-0.24`, mock L398)
+ back panel + side panels + feet — **all already ported and present in .259 (L31860-31862,
L31917-31925). Do not touch them.** Everything below is an addition, John-approved
2026-07-15, and must be recorded as such.

## THE DOCTRINE LINE (John-ruled — the whole design rests on it)
> **Rails are the rack. Blanks are hardware.**

- The Master states `48U`. Therefore 48 units of rail, perforation and U-position exist.
  Drawing them **declares nothing the Master didn't**. Permitted.
- The Master does **not** say "blank at U15" — it says *nothing* at U15. Painting a blanking
  panel there **claims a U is filled**, which on a Day-0 deploy rack tells a tech to pull a
  panel that isn't there. That is BLANK over a U the Master never described — the same
  family as BLANK over real gear (.246–.251 arc, Unified Law). **Forbidden.**
- A Master-**declared** blank is data and renders as hardware (§EDIT C).
- **Empty U renders as rails + perforation + the existing back panel. Never a panel face.**

---

## EDIT A — perforated mounting rails (the core of the ship)

**Approach: canvas texture, NOT geometry.** 48U × 3 holes × 4 rails = 576 meshes and an
instant iPhone death. One shared `CanvasTexture` + one shared material = 1 extra draw call.

1. **Widen the two ported front verticals into real rail faces.** Change ONLY the geometry
   at .259 **L31862** from `BoxGeometry(0.08, RH-0.5, 0.08)` to
   `BoxGeometry(0.17, RH-0.5, 0.09)` (a 19" rail face is ~20mm; at this scale
   1 unit ≈ 131mm, so 0.17 ≈ 22mm — reads correct without cartooning). Keep x/z positions
   **exactly** as ported. Keep `steelMat` (CHROME) as the body material.
2. **Add two matching rear rails** at `z = -(RD/2 - 0.24)`, same geometry, same material.
   Real racks have four; from ISO angles the rear pair is what sells depth through an empty
   rack. *(If John rules front-only at verify, delete these two lines.)*
3. **Perforation texture** — build once, share across all four rails:
   ```js
   // EIA-310 read: 3 square holes per U, on the rail's front face
   var railCv = document.createElement('canvas');
   railCv.width = 32; railCv.height = 64;            // one U tile
   var rg = railCv.getContext('2d');
   rg.fillStyle = '#0c0f14'; rg.fillRect(0, 0, 32, 64);            // chrome-black rail body
   [12, 32, 52].forEach(function (cy) {                             // 3 holes per U
     rg.fillStyle = '#02040a'; rg.fillRect(11, cy - 5, 10, 10);     // hole void
     rg.strokeStyle = 'rgba(160,190,215,0.30)'; rg.lineWidth = 1;
     rg.strokeRect(11.5, cy - 4.5, 9, 9);                           // machined lip
   });
   rg.fillStyle = 'rgba(160,190,215,0.10)'; rg.fillRect(0, 0, 1, 64);   // edge highlight
   var railTex = new THREE.CanvasTexture(railCv);
   railTex.wrapS = THREE.RepeatWrapping; railTex.wrapT = THREE.RepeatWrapping;
   railTex.repeat.set(1, totalU);                    // ONE TILE PER U — must equal totalU
   railTex.magFilter = THREE.LinearFilter;
   _bayTex.push(railTex);                            // existing dispose registry
   ```
   Apply as a **second material on the rail's front face only** (BoxGeometry material index
   4 = +Z for front rails, 5 = −Z for rear). Rail body stays CHROME on all other faces:
   ```js
   var railFaceMat = new THREE.MeshStandardMaterial({
     map: railTex, color: 0xffffff, metalness: 0.88, roughness: 0.34, envMapIntensity: 0.25 });
   ```
   `repeat.y = totalU` is **load-bearing** — the hole pitch must land on real U boundaries,
   or a tech counts holes and gets a wrong U. If `totalU` is unknown/0, fall back to the
   unperforated CHROME rail rather than a wrong pitch (fail honest, never fail plausible).

## EDIT B — U-position markers (field utility + the density that sells it)
Every 5U (U5, U10 … U45), on the **inner face of both front rails**, a small etched marker:
a 2-unit-wide tick (`PlaneGeometry(0.05, 0.012)`, `MeshBasicMaterial 0x7d93a4`, opacity
0.5, additive off) at `yFor(u)`, positioned `x = ±(RW/2 - 0.13 ∓ 0.09)` facing inward.
Honest: the Master declared 48U, so U-positions are stated fact. Do **not** render numerals
(text meshes = cost + a legibility fight at this scale); the MINI/U-MAP strip already
carries numbers. Ticks only.

## EDIT C — Master-declared blanks render as hardware
The mock's ghost-blank material was ported in .256 but is **never reached** — this Master
declares no blanks. Wire it: when a slot's display key is `blank`, use the mock's recipe
verbatim (mock L474–478): `color 0x0a0f14 · metalness 0.4 · roughness 0.85 · transparent ·
opacity 0.4` + `envMapIntensity 0.25`, **no interior detail, no bezel strip**.
A declared blank is hardware and draws as hardware. An undeclared U is not a blank —
it gets EDIT A and nothing else.

## DO NOT TOUCH
Everything ported and shipped: corner posts, top/bottom rails, back panel, side panels,
feet, chassis palette + interiors (.258), fog (.259), rig, bay, scan, halo, hlBand,
GL discipline, `openRmDevice` contract, MINI strip.

## MOBILE BUDGET
+4 meshes (2 rear rails, reusing 2 front), +1 texture, +20 tick planes = negligible. If FPS
moves at all, the ticks go first. Report mesh delta in ship notes.

## GATES
OODA curl first · `node --check` ×3 · CSS brace-balance · three-stamp lockstep ·
one-unverified-ship · `?legacy=1` byte-identical · `_bayTex` registry gets `railTex`
(canvas textures leak GPU memory on repeat opens if not disposed).

## DEVICE-VERIFY (John, iPhone)
- [ ] **s1:001 (8 devices, 48U) now reads as a RACK** — rails with square-hole perforation
      running floor to ceiling, 8 switches mounted in it. Not a display case. **This is the
      whole point of the ship.**
- [ ] Hole pitch lands on U boundaries — count 3 holes per U against the MINI strip
- [ ] Rear rails visible through the empty U at ISO — depth reads (or rule front-only)
- [ ] U ticks every 5U, subtle, not competing with hardware
- [ ] **No blanking panel appears in any U the Master didn't declare** — doctrine gate
- [ ] A dense rack (s3:176, 21 components) still looks right — rails don't fight hardware
- [ ] Bay/scan/fog/palette unchanged · tap-tray → detail · FLAT toggle → GL disposed ·
      FORGE after → no dual-GL crash · cold PWA reopen offline
- [ ] `?legacy=1` byte-identical

## SESSION END
INTEGRATION-STATE: ship + stamp, the **"Rails are the rack, blanks are hardware"** ruling
recorded verbatim, the fact that **rails/perforation/ticks are NEW geometry with no mock
ancestor** (John-approved 2026-07-15 — so no future session "corrects" them back out),
rear-rail and tick decisions, mesh delta.

**Closing note for the record:** this ends the mock-fidelity arc. The renderer now matches
the mock; the remaining difference between John's two screenshots is **which Master is
loaded**. A GB300/HGX Master will render like the mock because that is the rack the mock
was built from. Any future "doesn't match the mock" report runs the mechanical parameter
diff FIRST (scene/lights/materials, mock vs app, all deltas at once) — spot-fixes second.
Three ships were spent on one-variable-at-a-time hunting that a 30-second audit caught.

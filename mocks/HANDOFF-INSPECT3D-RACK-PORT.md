# HANDOFF — INSPECT-3D · PORT THE **RACK** (the star is still missing)
**Rev:** follow-up to HANDOFF-INSPECT3D-BAY-PORT.md · **Verified against live main v1.14.255**
**Reference truth:** `MOCKUP-INSPECT3D-BAY-LOCKED.html` (identical rack code to
`MOCKUP-INSPECT3D-FINAL.html` — line numbers below are from the FINAL mock)
**Target:** next free stamp · dct-ios.html only · body.rd only · `?legacy=1` byte-identical · three-stamp lockstep

---

## WHAT'S WRONG (and whose fault it is)

.255 shipped the **bay** faithfully — rig, glass platform, scan wave, ghost fleet, motes,
highlight band, GL discipline, mobile caps. All of that is CORRECT AND STAYS. Do not touch it.

But the **rack itself was rebuilt from scratch instead of ported.** In .255 a device is one
`BoxGeometry` chassis + one sphere LED (`~L31875`), and the whole rear assembly is two
cylinders commented *"rear cooling/manifold hint — low detail"* (`~L31860`). The mock builds
~350 lines of real hardware. On John's device the result reads as **coloured shelves on posts**
— the exact failure the port existed to prevent.

**Cause: the previous handoff's fault, not the executor's.** It specified the bay in four
detailed sections and gave the rack one line ("transplant the renderer"). Code built what was
specified and improvised what wasn't. This handoff removes all room for improvisation.

**THE RULE FOR THIS SHIP: port, don't interpret.** Every mesh, material, dimension and
constant below is copied from the mock verbatim. If something in the mock looks redundant,
port it anyway. The only permitted change is the data source (§3).

---

## 1 · WHAT TO PORT — verbatim from the mock (FINAL) into `rackElevation_render3D`

Replace the improvised rack construction between the frame build and `scene.add(rackGrp)`
(`~L31866–31890` in .255) with the mock's real build. Port ALL of it:

### 1a · Per-unit chassis interior (mock `L470–600`) — **the biggest gap**
Every unit is a `THREE.Group` at `yc`, not a bare box. Inside it, by kind:
- **chassis** — `BoxGeometry(chassisW = RW-0.42, h, chassisD = RD-0.42)`, per-kind material
  (mock `L474–486`).
- **compute units:** left NIC block `BoxGeometry(chassisW*0.22, h*0.75, 0.02)` @ `0x080e14`
  m.6/r.4; a row of **OSFP cages** `BoxGeometry(0.08, 0.025, 0.025)` @ `0x050a10`; **drive
  bays** — 8 drives `BoxGeometry(driveW/8-0.008, h*0.55, 0.015)` @ `0x060c12`, each with a
  green `SphereGeometry(0.008, 6, 6)` `0x10b981` drive LED; right NIC block (same as left);
  **BF3 DPU** `BoxGeometry(0.06, 0.04, 0.02)`; **status LED** `BoxGeometry(0.04, 0.015, 0.01)`
  `0x10b981`.
- **switch units:** rack **ears** `BoxGeometry(0.03, h*0.5, 0.03)` @ `0x141e2a` m.7/r.3 both
  sides; **switch block** `BoxGeometry(chassisW*0.42, h*0.7, 0.015)` @ `0x0a1018`; the
  **port grid** — `BoxGeometry(0.04, 0.025, 0.012)` per port, full row/column counts as
  written in the mock. Port the loops exactly; do not reduce counts.
- **power / blank kinds:** their materials and faces per the mock.
- `ledLights[]` registry populated exactly as the mock does — `bayTick` may drive it, but the
  meshes and their positions come from the mock.

### 1b · Rear assembly (mock `L680–757`) — currently two cylinders in .255
- **Cartridge:** `cartridgeW = RW*0.35`, `cartridgeH = RH*0.55`, `cartridgeY = RH*0.05`,
  `cartridgeMat` verbatim (`L683–693`).
- **Bus bars:** `busBarMat` + geometry verbatim (`L694–706`).
- **Manifolds:** `manifoldMat` (`L707–709`) + **top manifold** (`L710–716`) + **bottom
  manifold** (`L717–732`) — three assemblies, not two hint-cylinders.
- **Cable arms:** `cableArmMat` (`L733–745`) — the arm at `(0, caY, -RD/2 + 0.35)`.
- **Rear door:** `rearDoorMat` + mesh (`L746–757`).

### 1c · Cables (mock `L758–787`) + the toggle
- `createCable(su, eu, ox, col, thick)` verbatim — the tube geometry, the curve, the
  `cableMeshes.push(tube)` registry.
- Every `createCable(...)` call the mock makes, with the same arguments.
- **Cables default hidden** (`cablesVisible = false`, mock `L970/980–982`) and get a
  **CABLES toggle** in the 3D view's control strip, matching the existing FLAT|3D segmented
  styling (`.reh-3d-seg`). Same behaviour: toggle flips `c.visible` across `cableMeshes` and
  the button's `.is-on` state. Cold Aisle Filter: one tap, big target.

### 1d · Materials
Port the mock's material definitions verbatim. **`envMapIntensity: 0.25`** is added to each
`MeshStandardMaterial` (John-locked env value, already applied house-wide in .255) — that is
the ONLY permitted edit to the mock's materials.

## 2 · CHROME FINISH — resolve .255's flagged deviation
.255 applied chrome-black to structure only and flagged the question. **John's ruling:
that call was correct — trays keep their type colour** (information, not finish; the bay may
never contradict the elevation). Keep the current behaviour: chrome-black
(`0x0c0f14 · m.92 · r.16 · env .25`) on **frame/posts/rails/rear assembly/cartridge/door**;
**type colour on chassis** per §3; LEDs/emissives untouched. Record the ruling in the comment
where the deviation is currently flagged (`~L31779–31785`), replacing "not shipped without a
ruling" with the ruling.

## 3 · DATA — the only place the mock changes
- The mock's hardcoded `ZONES` array (`L438–446`, the GB300 loadout) is **replaced** by the
  rack's live Master slots — the same source the FLAT elevation uses. Keep `yFor(u)` and the
  `unitRegistry` shape.
- Per slot: `uStart/uEnd` → `top/bot/h/yc` exactly as `.255` computes today (`~L31866–31872`);
  `dev.type` → display key via the module-scope `_TMAP`; colour via `TYPE_COLOR[disp]`
  (magenta `#ff2bd6` UNKNOWN, slate `#7d93a4` MEDIA CONV, etc. — hoisted in .255, reuse).
- **Kind mapping for the interior detail** (which chassis interior a slot gets):
  `gpu|server|compute → compute interior` · `switch → switch interior` ·
  `pdu|power → power` · `blank → blank` · `patch|media conv|storage|unknown → generic chassis`
  (chassis + status LED, no NIC/port grid — do NOT invent hardware PHANTOM can't verify).
- `dev.hgtUnknown` → keep .255's gold-hatch `LineSegments` wireframe exactly as shipped
  (`~L31884–31889`). The 1U placeholder stays a placeholder — never silently sized.
- **Zero fabrication rule:** interior detail is *decoration keyed to type*, never a claim
  about a specific device. It must never imply port counts or drive counts the Master
  doesn't state.

## 4 · DO NOT TOUCH (shipped correct in .255)
The bay in its entirety — rig (exposure 1.10 · amb 0.04 · key 0.78 @(5.45,13.79,4.91) ·
fill 0.10 · rim 0.42 · glow 0.08 · underGlow 0.14 · env 0.25), FOV 28 framing + fitDist,
glass platform, scan wave, ghost fleet, motes, floor, backdrop, practicals, sweep,
`hlBand` + edge box (§C re-ruling), `bayTick`/`bayDispose`, `_bayTex` texture registry,
pixel-ratio cap, GL cross-dispose with forge3d, camera/orbit/raycast/scrub wiring,
`openRmDevice` tap contract, the FLAT|3D socket.

## 5 · MOBILE BUDGET (§F carried forward)
The interior detail is the new cost: ~40–60 extra meshes per unit × up to 48 units.
- **Required:** merge or instance where the mock repeats identical geometry (OSFP cages,
  drives, ports) — `InstancedMesh` per unit is acceptable and preferred; the *look* must be
  identical.
- If John's device drops frames: pre-approved trims **in this order** — (1) cables stay
  hidden by default (already), (2) drive LEDs → static material instead of per-mesh,
  (3) motes 220→120, (4) ghost reflection → floor fade. **Never trim the port grid or NIC
  blocks** — that detail IS the deliverable.
- Report actual mesh count + FPS in the ship notes.

## 6 · GATES
OODA curl first (stamp from reality) · `node --check` ×3 · CSS brace-balance (the CABLES
button adds one rule) · three-stamp lockstep · one-unverified-ship rule · `?legacy=1`
byte-identical.

## 7 · DEVICE-VERIFY (John, iPhone) — the bar is the mock, side by side
- [ ] Open the mock and the app's 3D view side by side. **The rack looks the same.** Not
      similar — same. Any visible gap in chassis detail is a fail.
- [ ] Compute trays show NIC blocks, OSFP cages, drive bays with LEDs, BF3, status LED
- [ ] Switch trays show ears, switch block, full port grid
- [ ] Rear: cartridge, bus bars, three manifolds, cable arm, rear door — no "hint cylinders"
- [ ] CABLES toggle: off by default, on → cable tubes appear, off → gone
- [ ] Type colours intact (magenta UNKNOWN, slate MEDIA CONV) — bay never contradicts FLAT
- [ ] Gold hatch still marks height-unknown slots
- [ ] Bay unchanged: scan wave, ghost fleet, platform, rig — **rack still reads as the star**
- [ ] Tap tray → flat device detail; orbit-drag doesn't trigger it
- [ ] FLAT toggle → GL disposed; FORGE after → no dual-GL crash; cold PWA reopen offline
- [ ] Frame rate acceptable; note mesh count + any trims taken
- [ ] `?legacy=1` byte-identical

## 8 · SESSION END
INTEGRATION-STATE.md: ship + stamp, verify results, chrome-deviation ruling recorded (§2),
mesh count / FPS / trims taken, and the note that the rack detail is now **ported, not
authored** — future sessions change it only against the mock.

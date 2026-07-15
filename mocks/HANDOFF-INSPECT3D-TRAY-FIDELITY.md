# HANDOFF — INSPECT-3D · TRAY FIDELITY (dark chassis · type accents · interior library)
**Verified against live main v1.14.256 · mock MOCKUP-INSPECT3D-FINAL.html (== BAY-LOCKED rack code)**
**Root cause this fixes (OODA-proven, 2026-07-15):** .256's chassis material is the mock's
recipe with ONE variable changed — `color/emissive: TYPE_COLOR hex` (saturated cyan/gold/
magenta) where the mock uses a dark gunmetal per-kind palette (`C = {compute:0x1a2332,
switch:0x1e293b, power:0x1a2028, tor:0x16202a, blank:0x0f141c}`, chassis mat mock L474–486;
app deviation at .256 L31939). That single swap — introduced by the PREVIOUS HANDOFF's §3
text, not by the executor — is why the app reads as coloured slabs instead of the mock.
Second gap: patch/media/storage/unknown route to `kind='generic'` (.256 L31924–29) = bare box,
which violates the Unified Law (real gear rendered featureless).

**Prior specs stand except where amended here.** The bay, rig, scan, detail already ported:
untouched. dct-ios.html only · body.rd only · `?legacy=1` byte-identical · three-stamp
lockstep · next free stamp by OODA.

---

## JOHN'S RULING THIS SHIP IMPLEMENTS (2026-07-15, verbatim intent)
**Interior detail is a TYPE SIGNATURE, not a spec sheet.** A patch panel must look like a
patch panel without claiming it has exactly 24 ports. A consistent Master means a small
interior library covers every rack — the SAME renderer must make ANY rack look like the mock.
Featureless boxes over real gear = BLANK over real gear = forbidden.

## EDIT A — chassis material: restore the mock's darks; TYPE colour becomes an accent
At .256 **L31939** replace the chassis material with the mock's, keyed by kind:
```js
var KIND_C = { compute:0x1a2332, switch:0x1e293b, power:0x1a2028, blank:0x0f141c,
               patch:0x18222e, media:0x161d26, storage:0x141c26, generic:0x121a24 };
var chMat = new THREE.MeshStandardMaterial({
  color: KIND_C[kind] || 0x121a24, emissive: KIND_C[kind] || 0x121a24,
  emissiveIntensity: 0.06, metalness: 0.55, roughness: 0.4,
  transparent: true, opacity: 0.92, envMapIntensity: 0.25 });
```
Blank kind keeps the mock's ghost treatment (mock L474–478: 0x0a0f14, opacity 0.4).
**TYPE colour moves to the accent channel** — on EVERY non-blank tray, add a front bezel
strip (this is where the glance-readable honesty now lives):
```js
var strip = new THREE.Mesh(new THREE.PlaneGeometry(cw * 0.92, Math.min(hT * 0.14, uH * 0.20)),
  new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.9 }));
strip.position.set(0, -hT/2 + Math.min(hT*0.10, uH*0.14), cd/2 + 0.011);
grp.add(strip);
```
- `hex` stays exactly as .256 computes it (TYPE_COLOR via disp) — the truth channel is
  unchanged, it just stops painting the whole box.
- **UNKNOWN trays additionally get a magenta EdgesGeometry outline** (LineBasicMaterial
  `0xff2bd6`, opacity 0.85) around the chassis — magenta must stay unmissable at arm's
  length (Cold Aisle / .251 honesty arc). Gold hgtUnknown hatch: unchanged, coexists.
- Raycast target stays the chassis; `userData.dev` unchanged; existing LED/detail meshes
  from .256 unchanged.

## EDIT B — interior library for the generic bucket (type signatures)
Extend the kind routing (.256 L31923–29): `patch → 'patch'` · `media → 'media'` ·
`storage → 'storage'` · `unknown → 'generic'`. Then add branches after `blank`
(style/material discipline identical to the ported compute/switch branches — dark blocks
`0x050a10–0x0a1018` @ metal .5–.6 / rough .4–.5, envMapIntensity 0.25, shared materials):

- **patch:** two full-width rows of small port squares across the face
  (`BoxGeometry(0.05, 0.03, 0.012)`, 16 per row from `-cw*0.42..+cw*0.42`, rows at
  `±hT*0.18`), teal LED dot (`SphereGeometry(0.008)`, `0x1fffd0`) on every 4th port.
  Representative rows, not a port count claim (John's ruling).
- **media:** the 1U shelf read — 6 converter bricks (`BoxGeometry(cw*0.12, hT*0.55, 0.03)`)
  evenly spaced, one green status LED each, thin shelf lip (`BoxGeometry(cw*0.94, 0.015,
  0.02)`) at the bottom edge.
- **storage:** one row of 10 vertical drive blades (`BoxGeometry(cw*0.07, hT*0.6, 0.015)`),
  green LED per blade — the mock's compute drive-bay language at full width.
- **generic (unknown):** dark chassis + magenta strip + magenta outline from EDIT A and
  **nothing else** — zero invented hardware. Honest and loud, exactly per doctrine.
- `server` stays routed to the compute interior (already correct in .256).

## EDIT C — separate micro-ship: profile derivation uses the wrong classifier
`site_derivePlatformsFromMaster` (.256 ~L22611) types platforms via
`deploy_extractGpuType/deploy_classifyDevice` — the EDP/CSV-path classifier — which is why
the Site Profile shows sn2201/sn3420/cm8148 as OTHER while `master_hostType` (the Master-path
classifier, .247+) already types them `sw`. Swap the role derivation to
`_TMAP[master_hostType({model: model})]` (fall back 'other' only when that yields
'unknown'). **Own stamp, own verify** (Site Profile → platforms show SWITCH not OTHER).
The larger profile redesign (running list, no poison pill, no fake deletes — John's
2026-07-14 rulings) stays in Ship-2's spec; this micro-ship only fixes the classifier path.

## STANDING RULINGS CONFIRMED (Code's .256 flags — John's calls, defaults ratified)
1. **Rear finish: VERBATIM (copper bus bars, green cartridge) — CONFIRMED.** The side-by-side
   bar is the law; the §2 chrome-rear text is dead.
2. **Rack ears on COMPUTE units, per the mock — CONFIRMED.**
(John may flip either at device-verify; until then these are ruled.)

## GATES
OODA curl first · `node --check` ×3 · CSS brace-balance (no CSS expected) · three-stamp
lockstep · one-unverified-ship rule · `?legacy=1` byte-identical · shared materials +
InstancedMesh discipline for the new repeats (ports, bricks, blades) per §5 budget.

## DEVICE-VERIFY (John, iPhone) — side-by-side with the mock remains the bar
- [ ] Dense rack in 3D: chassis read as dark gunmetal hardware, NOT colour slabs —
      mock-equivalent at a glance
- [ ] Type still readable in two seconds: bezel strips (cyan/violet/gold/teal/slate) pop
      against the dark chassis
- [ ] UNKNOWN: magenta strip + magenta outline — unmissable; gold hatch still marks
      height-unknown
- [ ] Patch / media / storage trays show their signatures (ports / bricks / blades) —
      no bare boxes over real gear anywhere
- [ ] s1:001 AND a dense GPU/switch rack both look right — same renderer, any rack
- [ ] Scan wave, band, bay, tap-to-detail, FORGE GL guard — all unchanged
- [ ] Micro-ship: Site Profile platforms now typed SWITCH for sn/cm families
- [ ] FPS acceptable; mesh count + trims in ship notes · `?legacy=1` byte-identical

## SESSION END
INTEGRATION-STATE: ship + stamps, the TYPE-SIGNATURE ruling recorded verbatim, rear/ears
rulings ratified, chassis-palette restoration noted as closing the .255/.256 fidelity arc.
Remaining known 3D item after this ship: scan-wave brightness at crest (present in the mock
too — same numbers) → phone-tuner session when John calls it, not before.

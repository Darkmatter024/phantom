# OWNER RULINGS — John, in chat

Rulings issued by John directly in chat. **These outrank any web-Claude `.md`.**
If an incoming spec contradicts a ruling here, the ruling wins and the conflict gets
reported before anything ships.

Kept separate from the spec files on purpose: a corrected spec drop overwrites the
spec, and a ruling recorded inside it would be silently lost.

---

## 2026-07-30 — THE FOUR CARRIED ITEMS, all ruled after the `.355`–`.363` batch cleared

**1. SUBTAB STRIP — kill it, the banner rows win. CONFIRMED.**
The `.subtab-strip` (Deploy/Scan/Handoff/Issues) below the BUILD banner rows duplicates three of
the five rows. Owner: *"already ruled: kill it, banner rows win. Confirmed."* — a re-confirmation of
a standing ruling, not a new one. **Ruled but NOT sequenced**; no ship assigned. ⚠ Note for whoever
takes it: `.subtab-strip` is a SHARED class — `#pg-ref` has its own strip at `:13273` and other
surfaces use it too. Only the `#pg-work` instance dies, and the strip's `showStab` targets
(`wk-deploy`/`wk-scan`/`wk-handoff`/`wk-issues`) are still the render hosts several doors write
into, so this is a nav-surface removal, **not** a panel deletion. `?legacy=1` reaches those panels
through its own nav and must keep working.

**2. `MASTER-phone@3x` — KEEP THE STEM. CLOSED.**
Owner: *"Renaming rasters again to match a display label is cache churn for zero function. The stem
follows the file, the label follows the row."* So `MASTER-phone@3x.webp` stands; `MASTER-FILE-` is
rejected. **Do not re-raise.** The general principle is worth keeping: a raster's filename tracks
the FILE's identity, not whatever a row happens to be captioned this month — and every rename costs
a full three-stamp bump plus a cold-cache rebuild for every device in the field.

**3. ORPHANS + DEAD PRECACHE — approved as its own ship. SHIPPED `.364` (`bbfcf33`).**
Owner approved it as the next ship after the batch cleared, and specified the method: *"Read-only
sweep first, then one commit. Nothing else rides along."* Executed as ruled.
⭐ **His two figures reconciled exactly:** he authorised deleting **4** orphaned tile icons and
purging **16** dead precache entries; the sweep found **20** entries on disk and referenced by
nothing — and 20 = 16 + 4, because the four `.359` orphans still carried entries of their own. No
scope expansion was needed or taken. `PRECACHE_URLS` went 74 → 54 (**228.4 KB** off every cold
install). The 4 named files were deleted; the other 16 stay on disk, orphaned-but-retained.
📌 **Method note worth reusing:** the sweep caught two of its own bugs before anything was touched —
an entry regex that paired apostrophes inside a *comment* and invented a phantom entry, and a
reference check that consulted only `manifest.json` and would have un-cached three **live** brand
assets (`cc-ghost.webp`, `phantom-prism.png`, `phantom-shield.png`) that other shell files
reference. A cleanup ship's failure mode is silent and offline-only, so the sweep is the gate.

**4. OPS WALL LIVE DATA — ~~its own ship, BLOCKED on a spec~~ → RELEASED 2026-07-31, SHIPPED `.365`.**
Owner: nine cells bind to real Master accessors, **empty state when no data — "blank is never an
erase"** — and *"do not start until the spec lands"* (incoming from web-Claude). The empty-state
clause is the same law that governs [[feedback_fresh_literal_destroys_user_data]]: a cell with no
data renders the empty state, it never renders a zero or a blank that reads as a measured value.

**BLOCK RELEASED 2026-07-31 (John, in chat): "§8 is the spec, build the OPS wall live data."**
The awaited document turned out to be a section of a doc already in hand — `SHIP-BUILD-BANNER-ROWS-SPEC.md`
§8, whose positive half ("every wall cell reads live state at render time; no data renders the empty
state") had never been built, only its prohibition half (no sample literals) honoured. Shipped `.365`.

**One deviation, ruled by intent rather than letter and recorded here because it is a standing
precedent for any future "bind to the Master" instruction:** §8's wording is *"reads `phantomMaster`"*,
but **only RACK MAP is Master-backed in this app.** The other eight tools keep state in their own
stores. Each cell was therefore bound to the source of the tool it opens — a cell that counted the
Master would print a number the tool behind it does not have. The mock's own provenance map labelled
five of these "Master" and was simply wrong about the live app. **Rule: "bind it to the Master" means
bind it to the truth the surface claims to show; verify where that truth actually lives before
wiring.** Two consequences worth carrying:
- **PORT MAP has no store at all** and never will — it is paste-and-validate, and the Master's
  `cables[]` is not even persisted. Its permanent call-to-action is §8's empty state applied
  correctly, **not** an unfinished cell. Do not "fix" it later.
- **A count must match its own tool's definition.** BURNDOWN filters `!archived` because its own list
  view does; AUDITS does not, because its list view does not. A single convenient rule across all nine
  would have made cells disagree with the screens they open.

---

## 2026-07-30 — BOTH HELD BANNERS RELEASE (shipped `.360`)
**Ruling (John), issued to release the two holds blocking the last two BUILD banner rows.**

Both halves were **re-issued in chat**, not invented here. Each already had an entry below from
when it was first ruled; this entry is the **release record** — what changed is that the art is
now *referenced by the app*, not merely staged in `icons/`. Read this entry together with the two
below it; where they differ, this one is later.

**B5 — ACCEPT. Unchanged from the entry below, restated verbatim by the owner:** DEPLOY commits
as-is with `GB300 / NVL72` legible on the faceplates. *"The app is site-agnostic but the art does
not have to be."* **CLOSED — do not re-raise.**

**§5.5 — WAIVED FOR THE HANDOFF BANNER ONLY. ⚠ This is BROADER than the scoped overrule recorded
below, and the difference matters.** The earlier entry overruled three *named* items (the
`Complete` sublines, the `READY FOR HANDOFF` CTA, the tablet title) and then recorded that the
overrule "never had to fire", because each measured clear of the 10px bar unaided. The owner has
now waived §5.5 for **the asset's legible baked workflow text as a whole**, and framed it as
**owner-accepted debt** rather than as a pass on measurement. Those are different positions: the
old one says nothing was actually in breach, the new one accepts that something is and ships it
anyway. **The new framing governs.** Do not cite the measurements below as evidence the waiver
was unnecessary — the owner has decided it on acceptance, not on arithmetic.

⛔ **NOT A PRECEDENT, and this is the load-bearing part of the ruling.** §5.5 stays in force,
unamended, for **every** future banner render. This waiver attaches to **one asset**. A later
render does not inherit it, and this row must not be cited by one. The standing narrow-reading
warning in the §5.5 entry below applies to this waiver with more force, not less.

**State:** applied in `.360` (`1f29d44`) — `phantom-banner-deploy-1170.webp` and
`phantom-banner-handoff-1170.webp` are now referenced by the DEPLOY and HANDOFF `.bnr` rows, so
all five BUILD banner rows carry art. Both rasters were already in `PRECACHE_URLS` from `.357`/
`.358`. Awaiting the consolidated `.355`–`.360` device pass.

**The deploy asset's FILENAME — RULED, renamed, CLOSED.** The release ruling named
`DEPLOY-phone@3x.webp`, a file that existed nowhere in the repo, in `Downloads/`, or in git
history; `.357` had shipped `icons/phantom-banner-deploy-1170.webp`, which is what the ruling's own
"already in the repo from `.357` and `.358`" identified, so `.360` referenced that and reported the
mismatch rather than guessing. **Owner ruled the NAME, not the file (2026-07-30): "yes rename it to
DEPLOY-phone@3x.webp".** Done in `.361` (`3842fd5`) — `git mv`, 100% similarity, **zero byte change
to the raster**; only the path, the `<img src>` and the `PRECACHE_URLS` entry moved.

✅ **The whole set now follows it — CONVENTION COMPLETE.** `.361` renamed DEPLOY alone, which left
the set mixed and was flagged as needing its own word; the owner gave it ("rename the other four to
match") and `.362` (`917d523`) finished the job. The five banners are
`icons/{DEPLOY,SCAN,HANDOFF,MASTER,OPS}-phone@3x.webp` — all `git mv`, all 100% similarity, **zero
byte change to any raster**. `phantom-banner-` now appears **zero** times in `dct-ios.html` and
`sw.js`; remaining mentions in this file and `BATCH-VERIFY.md` are history and stay as written.

**The one judgement call in `.362`, recorded because the ruling did not cover it:** the pattern
read off DEPLOY is "uppercase the existing stem, keep the suffix", which maps scan/ops/handoff
unambiguously. **MASTER did not** — its stem is `master` but its row label is **MASTER FILE**, and
DEPLOY gave no signal because its stem and label were already identical. Shipped as
`MASTER-phone@3x.webp`, **preserving the stem**, as the least-inference reading;
`MASTER-FILE-phone@3x.webp` would have invented a name the ruling never used. **One line to change
if the label form was intended.**

📌 **Durable note for any future asset rename:** a rename changes a *served path and a precache
key*, so it needs the full three-stamp bump. Without it, a client on the old service worker holds
the old URL cached and 404s the new one — an offline-boot break that is **invisible online**,
because the network serves the file regardless. `@` is legal unencoded in a path segment (RFC 3986
`pchar`); the `<img src>` and `PRECACHE_URLS` strings must stay **byte-identical** or the Cache API
misses and the row silently falls back to the hatch offline.

**Judgement left open to the device pass:** whether HANDOFF's baked text reads badly *at arm's
length on the phone*. The waiver covers the asset as cut; a re-cut remains available to the owner.

---

## 2026-07-30 — BANNER ART §5.5: baked text is a SIZE rule, measured in the ship cut
**Ruling (John):** confirmed §5.5 of `BANNER-RENDER-DIRECTIVE.md` as his, in chat. It is the gate.

- **Screen content is ALLOWED and wanted.** A NOC or datacenter photograph with blank monitors
  reads as fake. The prohibition is on *legible fabricated values*, not on text as such.
- **The bar: no text taller than 10px in the 1170x403 phone cut.** Measured in the SHIP CUT, not
  the master. Masters differ in height (DEPLOY 736, HANDOFF 611), so a percent-of-master threshold
  gates identical art differently depending on how it was rendered — it measures the wrong frame.
  The cut is fixed at 403px tall for every row, so it is the only stable gate.
- **Test:** downscale master to exactly 1170x403 → measure tallest glyph, over 10px fails →
  confirm at 390px wide that nothing resolves as a readable value.
- **Passes:** dense small screen content, log lines, row labels, chart axis ticks, hardware
  faceplate markings — the texture that makes a photograph read as real.
- **Fails:** anything legible asserting a state or value. Large display numerals. Status words
  like "Complete"/"Ready" sized to be read. Button labels sized for reading.
- **In-scene marks are NOT composited logos.** A PHANTOM wordmark embroidered on a glove cuff or
  printed on a chassis is set dressing, allowed. The absolute prohibition covers marks laid *over*
  the frame in post: title cards, captions, watermarks, corner logos.

**Known gap in the test as written:** step 1 says "downscale the master to 1170x403". A letterboxed
master must be DE-LETTERBOXED first or the measurement runs against a frame padded with dead black
(the MASTER row's master carries 22 dead bottom rows). Not owner-ruled; flagged for whoever
formalises the gate.

**State:** applied 2026-07-30. DEPLOY measured 6.6px largest text in the cut, nothing resolving at
390px — CLEARS, shipped in `.357`. OPS (shipped `.356`) is retroactively clean under this rule —
its monitor wall is exactly the "dense small screen content / chart axis ticks" the ruling passes.

---

## 2026-07-30 — B5: GB300 NVL72 on the DEPLOY banner STAYS
**Ruling (John):** "GB300 stays, it's aspiration not a defect."

The DEPLOY banner art carries legible `GB300 NVL72` on rack faceplates. ALP-01 runs H100/H200 and
there is no Blackwell on the floor, and the app ships site-agnostic (Design Law 6) — so this was
raised as a factual-accuracy defect. Owner ruled it is intentional aspiration. **Question CLOSED.**
Do not re-flag it on future ships.

**Corrects forward:** the shipped `.356` commit message and `version.json` notes state DEPLOY was
held partly because "the fleet runs H100/H200". That reasoning is SUPERSEDED by this ruling.
History not rewritten — corrected here and in the `.357` notes.

▶ **Re-issued and RELEASED in `.360`** — see the release entry at the top of this file. This entry
is still accurate; `.360` is where the art actually reaches the app.

---

## 2026-07-30 — HANDOFF banner: scoped text overrule (NOT a change to §5.5)
▶ ⚠ **SUPERSEDED IN PART by the `.360` release entry at the top of this file.** The owner has
since waived §5.5 for **this asset's baked workflow text as a whole**, framed as accepted debt
rather than as a measurement pass. The item-by-item overrule and the measurements below remain
accurate as history, but the **broader waiver governs** — do not quote "the overrule never had to
fire" as evidence that nothing was waived.

**Ruling (John):** the `Complete` sublines and the `READY FOR HANDOFF` CTA are overruled — ship
despite §5.5's fail-list naming status words and button labels.

**This is a scoped exception to §5.5 for ONE asset, not an amendment.** §5.5 stands unchanged for
every future render; do not cite this as precedent.

**State — the overrule never had to fire.** Measured in the ship cut: `Complete` = 4.0px and gone
entirely at 390px; CTA label = 5.9px and does not resolve. Both clear §5.5 unaided.

**The title question — RULED, ship (John, 2026-07-30). CLOSED.** The tablet screen title
"HANDOFF" measures **exactly 10px** — tallest glyph, measured directly in the 1170x403 ship cut,
stable across luminance thresholds 120/160/190. §5.5's bar is "no text taller than 10px", so it
passes on size AT the limit, not over it. It is also the one item in the frame that resolves as a
readable WORD at 390px — but §5.5's test names a readable VALUE, and a screen title asserts no
state, no value and no measurement, so it is outside the fail-list (large display numerals, status
words sized to be read, button labels). Owner ruled ship. **Shipped in `.358`.**

⚠ **Read the title case narrowly.** It sits ON the 10px bar, not under it, and it clears test 3
on a word-versus-value distinction. Do not treat "a legible word survived to ship size and shipped
anyway" as the general rule — §5.5's intent is that text dissolves into texture. A future render
whose surviving text asserts anything is still a fail.

**Measurement lesson of record — DO NOT BOUNDING-BOX TILTED TYPE.** An automated pass first
returned FAILS on this title at 17px. The dominant cause was **methodology, not frame**: a raw
whole-word connected-component bounding box. The tablet sits in perspective at ~4.8 degrees, so a
box around tilted type absorbs the tilt and overstates height by roughly width x sin(theta) — the
glyphs appear to grow left-to-right (H smallest, final F largest) purely because the right edge of
the tablet is nearer the camera. **Measure per-glyph STEM height, not a bounding box.**

An earlier draft of this entry blamed "measured on the master against the superseded
percent-of-master rule". That was wrong, and the gate caught it: the naive bounding box reproduces
~17px *even on the correct 1170x403 ship cut*. Wrong frame was a secondary factor at most. Corrected
here rather than left to teach the wrong fix.

⚠ **Do not cross-cite figures measured by different methods.** The 8.6px quoted for the glove-cuff
wordmark came from a stem measurement; a naive vertical column-extent on that mark reads 24-30px,
because it sits at a ~45 degree diagonal — far steeper than the tablet's 4.8. It does not matter for
shipping (in-scene marks are categorically exempt, not size-tested), but the number must not be
quoted as if it came from the same method used on the tablet text.

**Source doc:** §5.5 lives in `design/BANNER-RENDER-DIRECTIVE.md`, checked into the repo with this
entry. It was previously cited from a `Downloads/` copy that existed nowhere in the repo or its
history, so the paraphrase above could not be cross-checked against the original. Chat rulings
recorded here outrank any spec file regardless — but the source is now auditable.

---

## 2026-07-25 — FIX-DESKTOP-NAV-CARDS §3: the "DEVICES" card is COMPONENTS (:35331)
**Ruling (John):** the spec's "DEVICES section surface" was a **stale name**. The real card is
**COMPONENTS at `dct-ios.html:~35331`**, which carries an inline `background:var(--surf-1)`.
Question CLOSED.

**State:** §3 (card-surface unification) shipped PARTIAL in `.352` — the hero card was unified,
this COMPONENTS card was held back pending the ID. The ID is now known, so the §3 finish is
**unblocked but not yet shipped**: swap the COMPONENTS card's inline `--surf-1` → `--rd-cardfill`
(the one Home/Command card surface — real source is the SURFACE-GLOW `!important` block + GLASS-
SKIN, per [[feedback_grep_cascade_before_background]]). Small ship, not started; no owner action
pending. The broader 22-site inline `--surf-1` sweep stays parked (edits JS-generated HTML).

---

## 2026-07-24 — SHIP B: FLAT dies, 3D IS the view, one door out
**B4.2 RULING (supersedes the spec's a/b/c menu):** option (a), and deeper than the spec asked.

- With FLAT gone, **3D is not a door — it is THE view.** Always mounted. **No mode control at
  all.** The `.reh-3d-toggle` pill dies **entirely** (FLAT + 3D + AISLE buttons).
- **One control remains on this page: `OPEN AISLE`**, styled as what it is — a door to another
  surface, not a segment in a toggle.
- `forge3d_close` returns to the rack-detail **3D view**, which is now the only defined state.
  That makes the contract honest instead of implicit.

**B4.4 RULING:** keep the **NEXT ACTION chip**, drop the standalone **PHASE RUNNING LONG** card
(`dct-ios.html:35613`). One fact, one surface, and it lives in the actionable card.

**Sequencing:** Ship B takes its **own batch slot** — not stacked. Agreed because of the two
Step 0 findings below.

### Step 0 findings this ruling must respect (from live recon, 2026-07-24)
1. **This is an inversion, not a deletion.** `.reh-flat-wrap` is visible by default (`:10548`)
   and `.reh-3d-mount` is `display:none` until `.is-3d` lands on the host (`:10549`/`:10551`).
   3D becoming the always-on view inverts both the CSS gate and the `reh3d_setMode` contract.
2. ⚠️ **`display:contents` trap.** `.reh-flat-wrap` is `display:contents` (`:10548`). Do NOT
   leave the 3D mount under a `display:contents` ancestor — that is the `.337`→`.338` bug
   (a JS-measured WebGL mount goes invisible on iOS). See [[feedback_display_contents_breaks_webgl_mount]].
3. **`forge3d_close` hard-depends on `'flat'`** (`:18607`, `reh3d_setMode('flat')` reset) —
   must be rewired, or closing AISLE lands on a mode that no longer exists.
4. **Persisted state retires with the mode:** `reh3d_prefOn()` / `REH3D_PREF_KEY`
   (`:33429`, consumed `:33442`) exists only to choose between flat and 3D.
5. **The minimap survives** — `.rack-hybrid-minimap` is a sibling of `.rack-hybrid-canvas`
   (`:35423`), not a child of `#rehFlatWrap`.
6. **A third composition exists** — `:35421`, a non-3D branch with no flat wrap and no 3D host.
   Needs its own answer.

**Ship note must state:** no RACK SCENE LOCK value is touched — lights, exposure, fog, tone
mapping and type colours are untouched; this ship changes the **mount reveal path only.**

---

## 2026-07-24 — SHIP A (deployment page clearance) is CLOSED, not shipped
**Ruling:** John chose option 1 — close Ship A, go straight to Ship B.

**Why:** Step 0 proved A1's bug was already fixed by `v1.14.351` (`dct-ios.html:1100`,
`body.rd.ops-detail.ph-dock-on .page`). The spec is based on v345 and is stale by two ships.
It also misnames the surface: PHASE RUNNING LONG renders at `:35613`, inside **rack detail**,
and `ph-dock-on` is added only by `phdock_render` (`:35150`) and removed by `phdock_leave`
(`:35198`) which `deploy_showDetail` calls (`:32252`) — so the phase strip never renders on
the deployment detail page at all.

**Also rejected:** A3's grep gate (one `padding-bottom` formula file-wide). Three of the eight
sites are bottom sheets with an action stripe, one is the legacy nav itself, one is
legacy-shared (`.sop-detail` reads `--tabnav-h`). The gate cannot pass without breaking
`?legacy=1` byte-identity. The `!important` at `:11512` is not stale — it prevents the `.212`
tap-eating regression.

**Left on the table (not actioned):** narrowing clearance unification to the three rd page
scroll containers (`:1088`, `:1100`, `:11512`). Available as a CLEAN item if ever wanted.

**Open:** John to reconfirm on device that rack detail is clear on `.352`.

---

## 2026-07-24 — `racks_door` closed-deployment behavior
**Context:** Step 0 recon on `SHIP-RACKS-IS-THE-DOOR.md` found that `deploy_showDetail`
routes a **closed** deployment to `deploy_showTombstone` (`dct-ios.html:32256`). The spec's
§2 router would therefore land RACKS on a tombstone whenever the active context pointed at
a closed deployment — the spec never considered this case, and its verify step 7 only
covers "no deployment at all."

**Ruling:**
- Closed deployment → **dashboard, never the tombstone.**
- `racks_door` checks `ctx.deployment.status !== 'closed'`.
- Closed **or** missing → `deploy_goToDashboard(null)`.
- **Drop the spec's redundant bad-id fallback** — the `:32250` guard
  (`phantomToast('Deployment not found','error')` + `deploy_showList()`) already owns that
  path, loudly and correctly.

**Order also ratified:** SHIP-DEPLOY-PAGE-CLEARANCE-AND-FLAT (Ship A) first, then RACKS.

**Open when this ships:** the corrected `SHIP-RACKS-IS-THE-DOOR.md` is incoming and must be
pulled before `racks_door` is written. Verify the corrected spec actually encodes this
ruling; if it doesn't, this ruling still governs — report the mismatch, don't silently
follow the spec.

---

## 2026-07-31 — OPS WALL CELL ART, AND ART FIT IS PER-SHELL (shipped `.366`)

**Ruling (John):** the nine wall rasters wire in as **background art behind the content** — cell
layout, heights and every text child stay structurally byte-identical, no growth, no line
replacement, no reflow. Accent tints and borders stay exactly as they are, rendering over and around
the art. Then, on the measurement below: **"contain on desk, ship it."**

**The finding that produced that ruling, recorded because it corrects a premise that will otherwise
come back.** The original spec expected the 256 sources to merely *soft-scale* on the desk shell and
asked whether 512 masters were warranted. They are not, and cutting them would not have helped:

> The wall cell is **3.95:1 on desk** (348×88 at a 1280px viewport) while every source raster is
> **1:1**. Under `cover` that fills the width and then discards **75% of the icon's height**, leaving
> a soft band through its middle. **This is an aspect-ratio problem, not a resolution one — a 512
> master would only have made the cropped band sharper.**

**Durable rule: when art looks wrong at a larger size, measure the CELL ASPECT against the SOURCE
ASPECT before reaching for a bigger master.** Resolution and fit are separate axes, and the expensive
fix is usually aimed at the wrong one.

Settled values: phone keeps `cover` (at 107×88 it still shows **82%** of the icon and filling the cell
reads better); desk takes `contain` (an 88×88 icon centred in a 348px cell, **downscaled** from 256
and therefore sharp). Net effect is that the existing 256 masters are now *correct* on both shells
rather than merely adequate.

**Standing structural facts confirmed by this ship, so they need not be re-derived:**
- **The OPS wall is ONE shared markup block, not duplicated per shell** — one `.opswall`, one
  `#wk-opswall`, one render path. The "lands on laptop, missing on phone" half-ship is *structurally
  impossible* here. Do not add a second block.
- **Shells switch by CSS media query ONLY** — no body class, no separate render path, and still **no
  asset-shell machinery** (the file's single `<picture>`/`srcset` are both inside a comment saying so).
  Breakpoints act on `#work-grid` max-width: base full · 640px → 760px · 980px → 1080px. See
  [[reference_no_asset_shell_mechanism]].
- **Per-shell values get their own declaration site.** `--veil-t`/`--veil-b`/`--tfit` are declared for
  phone and again in the 640px block. Both shells *start* at the same veil alphas by ruling; the
  duplication is the point, so tuning one shell can never silently move the other. **Do not "tidy"
  these into a single rule.**
- **`phantom-tool-blastradius-256.webp` does not exist and never has.** BLAST's raster is
  `phantom-tool-power-256.webp`. The name appears in the ship request but no file on disk has ever
  carried it — do not create one to match.
- Until `.366` the eight tool rasters rendered on **no surface at all**: their only reference was the
  dormant `DEPLOY_TOOLS.img` field, which nothing reads. The wall is their first real consumer.
  `DEPLOY_TOOLS` stays untouched — that cleanup is still its own ship.

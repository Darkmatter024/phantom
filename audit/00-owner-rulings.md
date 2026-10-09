# PHANTOM — Owner Rulings (this reconstruction)

Rulings made by John during the v1.14.394 architectural audit. These are **binding** and are not to be re-litigated or "improved" in implementation. Anything not listed here was decided by the Principal Integration Owner under the 2026-08-05 delegation directive.

---

## R-01 — Desktop composition: PROMOTE `.cshell` above 851px
**Date:** 2026-08-05 · **Owner words:** *"promote cshell above 851px"*

The desktop composition (`body.rd.cshell` — sidebar `:53719`, topbar `:53763`, dashboard grid `:54020`, desktop Build workspace `:53620`/`:53695`, collapsed-rail band `:53996`) currently ships dead: `.cshell` is applied **only** when the URL carries `?cshell=1`/`?shell=1` (`:18772`, `:18807`), so a bare-URL laptop or desktop never sees it.

**RULED: `.cshell` becomes the DEFAULT at ≥851px.**

Implementation constraints that follow from the ruling and from existing doctrine — not new decisions:

1. **851px is the breakpoint**, matching every existing `.cshell` media query (`:53527`, `:53620`, `:53719`, `:53996`). Do not invent a new one.
2. **Keep a rip-cord.** `?cshell=0` must force it off. The comment at `:18768` documents why a *sticky* preview was the `.380` trap — the anti-pattern is persistence, not the flag. The rip-cord must be per-URL and non-persisted, exactly like `?legacy=1` is not.
3. **Phone composition is untouched.** Below 851px nothing changes. This is additive at the top end only.
4. **`?legacy=1` stays byte-identical.** `.cshell` is a `body.rd` concern and must never apply in the legacy house.
5. **The 1500px clip must be fixed as part of this**, not after. `#cs-grid` `:54017` needs 1200px of column and gets 1198px at W=1500 (`1500 − 246 sidebar − 56 padding`), and `#cmd-shell{overflow-x:hidden}` `:53191` **clips** the deficit rather than scrolling it. Promoting `.cshell` to default turns a preview-only cosmetic defect into a shipping Rule-1 violation. Raise the 3-column breakpoint to 1520px or reduce `#cmd-shell` padding in the 1500–1599 band.
6. **Dead scroll runway must go.** Under `.cshell` the bottom nav is `display:none` `:53807`, but `.page` still carries `padding-bottom:calc(var(--rd-navclear)+20px)` `:1088` — 136px of empty runway on every desktop page. Currently invisible to users because desktop never ships; it ships now.
7. **Hard-coded layout literals get tokens.** `246`/`82` (sidebar width) appear at 3 sites each, `76` (topbar height) at 2. These are the same drift class as `--rd-navclear` (see audit 05 §C5). Introduce `--cs-side-w` / `--cs-top-h` and let the clearance terms read them, so the strips cannot go stale.

**Verification:** the owner's device pass must cover 851px, 1024px, 1440px, **1500px and 1501px specifically** (the clip boundary), and 1600px — plus a phone pass to prove nothing below 851px moved.

**Status:** RULED, not yet implemented. Scheduled into the reconstruction plan; will not ship as a standalone patch.

---

## R-04 — Delete the legacy house at M2
**Date:** 2026-08-05 · **Owner words:** *"delete legacy at M2"*

`?legacy=1` (persisting `phantom_legacy`) and the entire 5-tab house are **deleted at M2**, not deferred to the end of the program.

Rationale of record: under the owner's standing preserve-rule — *preserve only user data, product vision, and offline-first reliability* — legacy qualifies as none of the three. It is carried because it exists. It taxes every edit in the program: the byte-identical gate, the shared-header leak class, `redesign_isOn()` branching, `nav_push` house-gating, and duplicated render paths. Removing it early makes every subsequent stage cheaper and removes an entire class of regression.

**Accepted tradeoff (stated before the ruling, and ruled anyway):** this removes the runtime escape hatch during the riskiest phase of the program. Mitigation is git, and the fact that the redesign has been the default since v1.14.101 (~290 ships).

Binding conditions:

1. **Data first.** Before a single line is deleted, prove that no user data is reachable *only* through a legacy surface, and that every key in the `Store` registry (M1) is readable and writable from the redesign. A key that only a legacy screen can reach is a blocker, not a footnote.
2. **M1 lands first.** The full backup must round-trip every key before legacy is removed, so a mistake is recoverable.
3. **Delete, do not hide.** This supersedes the standing *"hide, not delete; rip-cord restores it"* rule in `CLAUDE.md` §7, which is retired by this ruling. The `?legacy=1` byte-identical gate is retired with it — after M2 there is no second house to be identical to.
4. **`phantom_legacy` is cleaned up**, not orphaned: the key is removed from storage on upgrade so no device boots into a house that no longer exists.
5. **One ship, reverted whole or not at all.** The deletion does not stack with other M2 work in the same version.

**Verification:** a device that had `phantom_legacy` set before the upgrade must cold-boot into the redesign with all its data intact.

**Status:** RULED 2026-08-05. Scheduled M2, after the renderer work and after M1.

---

## R-05 — One engine does not mean one location
**Date:** 2026-08-05 · **Owner words:** *"A PHANTOM capability may appear in multiple appropriate places throughout the application. Canonical does not mean globally restricted to one screen."*

**Canonical means:** one engine · one business-logic implementation · one canonical state contract · one lifecycle owner · **multiple intentional presentations and hosts.**

This corrects a real error in the blueprint as approved. `audit/07` counted seven rack render paths and the blueprint treated the *count* as the defect, with consolidation framed as collapsing seven surfaces into one component. **The count was never the defect.** Seven places rendering a rack is correct product behaviour. Seven independent implementations carrying six mutually-disagreeing colour vocabularies is the defect.

The rack may legitimately appear in Build, Open Aisle, Rack Map, deployment review, a contextual detail workspace, and future approved operational views. **No useful rack presentation is removed to satisfy a literal one-component rule.**

```js
RackEngine.attach({ host, rackId, mode, view, interactive, context });
```

Derived constraint that makes this work on the primary device:

> **Many attachments, at most one interactive.** The iOS single-context ceiling constrains *interactive* attachments, not *presentations*. An attachment with `interactive: false` holds no WebGL context, costs nothing, and may exist many times simultaneously. The lifecycle owner enforces that at most one interactive attachment holds a context at any moment.

This also resolves the flat-elevation defect properly: flat is a **mode of the engine**, not a separate renderer, so it consumes `Vocabulary` like every other mode. `audit/07` Q2 (nine of ten device types rendering monochrome) stops being a CSS keying bug and becomes impossible by construction.

Applies equally beyond the rack — any capability with multiple hosts follows the same shape.

**Status:** RULED 2026-08-05. Supersedes the "one component" framing in blueprint §5 and the "8 doors is the worst in the app" framing in `audit/03` D6.

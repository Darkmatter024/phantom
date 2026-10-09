# LEGACY-RETIRE — STAGE 3 RECON (LIVE shells)

**Built against live `v1.14.535` · 2026-08-30 · report only, nothing shipped.**
Stage 3 was staged as *"legacy shells of the 18 LIVE surfaces — redesign already carries each,
medium risk, 4–6 ships."* This is the re-verification of that scope against live source, because
`PHASE0-CENSUS.md` is anchored at `v1.14.166` and its line references are now meaningless — 369
versions plus this campaign's own deletions have moved everything.

---

## 1 · The correction that matters: `pg-*` does NOT mean "legacy"

Twelve page shells exist. Classifying them by whether the redesign styles them under `body.rd`:

| Page | `body.rd` CSS rules | Verdict |
|---|--:|---|
| `pg-work` | **30** | ⛔ **THE REDESIGN'S OWN PAGE** — Build/Work |
| `pg-cmd` | **25** | ⛔ **THE REDESIGN'S OWN PAGE** — Command |
| `pg-ref` | **5** | ⛔ **THE REDESIGN'S OWN PAGE** — Reference |
| `pg-scan` `pg-power` `pg-fiber` `pg-cli` `pg-compass` `pg-twin` | 0 | ♻️ **RE-HOMED — Stage 6**, held behind the organ inventory |
| `pg-sop` | 0 | ⛔ **BLOCKED** — hosts `#ops-content` for the un-homed ops tabs |
| `pg-master` | 0 | ⛔ Reachable in the redesign via 11 `showPage('master')` calls |
| `pg-triage` | 0 | ⚠ Legacy default page; `today_render` paints into it at **boot** |

⛔ **So NOT ONE of the twelve page shells is a Stage 3 target.** Three are the redesign itself and
deleting them would destroy the app; six belong to Stage 6; three are individually blocked. Anyone
reading "legacy shells" as "the `pg-*` pages" and starting to delete would take the redesign down on
the first ship. **Stage 3's targets are legacy CHROME, not legacy PAGES.**

## 2 · What Stage 3 actually targets

The real shape is *hidden, not deleted*: legacy chrome still present in the DOM and still live under
`?legacy=1`, suppressed under the redesign by one of 32 `body.rd … { display:none }` rules.

| Target | markup | JS refs | Note |
|---|--:|--:|---|
| `#action-stripe` | 1 | 1 | The legacy toolbar. All three of its actions have redesign doors — QR `.28529`-era, LOG NOTE `.172`, HANDOFF via deploy detail |
| ~~`#hdr-overflow-wrap`~~ | — | — | ⛔ **STRUCK 2026-08-30 — NEVER A TARGET. SEE §2a.** |
| `#hdr-stripe-btn` | 1 | **0** | Pure chrome, no script touches it |
| `#mode-toggle` | 1 | **0** | Pure chrome, no script touches it |
| `#phantom-tab-pill` | 1 | 1 | |
| `#omni-bar` | 1 | **3** | The LOG bar. `.282` retired it under redesign; `.533` deleted the dead `--omni-h` write. Still live under legacy — treat as its own ship |
| `.app-logo` · `.app-loc` · `.hdr-ghost-img` | 1 each | — | Legacy header identity block |
| `.search-wrap` | 2 | — | Two instances; confirm both before cutting |

⛔ **RESERVED FOR STAGE 7, do not take them here** — `#nav-back-btn` and `.tab-nav` are named in the
owner ruling as part of the switch. Taking them early breaks that stage's rollback story.

⛔ **NOT targets, despite matching the `display:none` grep** — `#pg-work.bw-on #work-grid`,
`#rf-hw.plat-detail-open`, `.bw-strip:empty`, `#wk-job-host:empty`, `#ref-grid .rf-card.rf-hidden`
and similar are the **redesign's own state machinery**, not legacy suppression. `.rf-cnr` has **9**
markup uses — a shared class, not a shell.

## 2a · ⛔ CORRECTION — `#hdr-overflow-wrap` is NOT a target, and never was

**Found while building Stage 3.1, 2026-08-30.** §2 listed it on the strength of
`body.rd #hdr-overflow-wrap { display:none !important }`. **That grep found the suppression rule
and never read what it suppresses.** The wrapper holds the legacy overflow **MENU**, and under
`?legacy=1` it is the only door to:

- `exportAllData()` and `phantomImport()` — **export and restore**
- `identity_promptUser()` — identity
- `hwMatrix_open()` — the hardware reference
- `actionStripe_toggle()` — the action stripe
- **`legacy_returnToNewUI()` — the only way back out of the `?legacy=1` rip-cord**

⛔ **Deleting it would strand any user who entered legacy, with no route back and no export.** The
markup even says so at the `.380` comment beside that last button. `#hdr-stripe-btn` — a menu ITEM
inside this wrapper, not the wrapper — remains a legitimate target and rides with `#action-stripe`.

⭐ **The general lesson, worth more than the correction:** a `display:none` rule proves a thing is
*hidden in one house*, never that it is *disposable*. Every remaining target in §2 was found the
same way and must be opened and read before it is cut, not counted.

## 2b · ⛔ TWO MORE STRIKES — and §2 is now three-for-ten wrong

**Found while building Stage 3.4, 2026-08-30.** Both were listed in §2 on the same
`body.rd … display:none` evidence, and both are wrong for different reasons.

**`.search-wrap` — STRUCK. It is LIVE IN THE REDESIGN.** `:10064` hides it under `body.rd`, and the
very next line, `:10065`, gives it back: `body.rd.mode-ref .search-wrap{display:flex}` — **the search
bar on Tools**. Deleting it would have removed redesign search. ⭐ The grep did not merely fail to
prove disposability here; it read the *first* of two rules and stopped.

**`#phantom-tab-pill` — ⭐ OWNER RULING 2026-08-30: KEEP IT. Struck from the campaign.** John ruled
after the finding below was reported. ⛔ It is not to be deleted in Stage 7 either without a fresh
ruling: the whole point is that removing it removes the last in-app multi-tab warning anywhere.
📌 **The gap it exposes is now a standing finding** (see `PHANTOM_CURRENT_STATE.md`): the redesign
has no in-app multi-tab warning at all. That is unresolved, and outlives this campaign.

**Why it was held —** It is the multi-tab warning chip of the Clone
War module, which the census classes **LIVE**. `tab_pillTap()` says *"open in another tab — close it
to avoid data loss."* ⛔ **It is the ONLY in-app multi-tab warning that exists.** `showBanner()`
renders exclusively into `#boot .boot-items` and returns early otherwise, with the comment *"In-app
(boot dismissed) we intentionally show no floating popup."*
⚠ **Which surfaces a real gap, independent of this campaign:** the pill is `display:none` under
`body.rd`, so **the redesign has had no in-app multi-tab warning at all** — only a boot-screen row a
user sees before they open the second tab. Deleting the pill would remove the last one anywhere.
**Not a Stage 3 call. Report it, then let John rule on whether the redesign needs the warning first.**

⭐ **THE RULE THIS ESTABLISHES.** Three of the ten §2 entries were wrong — `#hdr-overflow-wrap`,
`.search-wrap`, `#phantom-tab-pill` — and each was wrong in a different way: the rule hid a door, the
rule was reversed one line later, the rule hid the only instance of a live warning. **A
`display:none` under `body.rd` is the START of an investigation, never the end of one.** Every
target must be opened, its JS traced, and its neighbours checked for shared symbols — `.540` and
`.542` each found one (`stripeRack_logNote`, `omni_getActiveDeployment`) sitting inside a
legacy-only module.

## 3 · One freebie, already earned

⭐ `body.rd .reh-3d-mount { display:none }` is **an orphan rule**: `v1.14.531` deleted the 3D mount
and `.reh-3d-mount` now has **zero markup occurrences**. A rule suppressing an element that no
longer exists. Fold it into the first Stage 3 ship — it is the same class of debt `.533` removed,
found the same way.

## 4 · The constraint that changes every Stage 3 verify

Every target above is **live under `?legacy=1`**. Deleting any of them is a **visible legacy
change**, exactly like `.535`, not an invisible one like `.534`. So:

- Each ship's device check belongs **under `?legacy=1`**, not on the default app.
- Each is permitted only because Contract 17's byte-identity guarantee was revoked 2026-08-29.
- The default app must show **no** change; that is the other half of every check.

## 5 · Recommended sequencing

Grouped so each ship is one coherent visible change in the legacy house:

1. **Header identity block** — `.app-logo` · `.app-loc` · `.hdr-ghost-img` · `#hdr-stripe-btn` ·
   `#hdr-overflow-wrap`, plus the `.reh-3d-mount` orphan rule.
2. **`#action-stripe`** — its own ship; three redesign doors must be re-confirmed live first.
3. **`#omni-bar`** — its own ship; 3 JS references to unpick, the largest single piece here.
4. **`#phantom-tab-pill` · `#mode-toggle` · `.search-wrap`** — the remainder.

**Four ships, not 4–6** — the estimate came down once the `pg-*` pages were ruled out.

⛔ **Not started. Stage 3 ships are blocked until `.535` is promoted, verified and stamped.**

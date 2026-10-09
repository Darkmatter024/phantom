# SHIP-HANDOFF-SCAN-PILLAR.md
**SCAN becomes a navigable pillar — R-02's fourth slot**

- **Status:** ⛔ **RETIRED — owner ruling, 2026-09-01.** This document's central proposal is dead.
  `SHIP-HANDOFF-IA-SHIFTNAV-v2.md` §2 rules that SCAN is **not a dock destination** — it lives
  where scanning happens, on the rack and on the picker. **SCAN does not become R-02's fourth
  slot at M4 or at any other time.** The board line that wanted a SCAN dock slot
  (`PHANTOM-BOARD-NEXT-OPS-v2.md:40`) was struck as stale in the same ruling.

  ⭐ **ITS PARENT IS GONE TOO, AND THAT IS THE CLEANER REASON.** The line below names
  `SHIP-HANDOFF-IA-SHIFTNAV.md` + Addendum A as this document's parent, and **v2 supersedes both
  in full.** A handoff split out of a superseded ship cannot outlive it, independently of §2.

  📌 **KEPT AS EVIDENCE, NOT AS TASKING — this is why the file is not deleted.** The measured
  material below survives the retirement and is still true: the ten routes at A-5, the `pg-scan`
  history (it existed; `.552` deleted it in LEGACY-RETIRE Stage 6.7), the `#wk-scan` markup, and
  the SCAN/SHIFT art provenance (the approved cut, tracked at `a328a10`). A future SCAN ship —
  on the rack and picker, per v2 §3's *scan reachable in ≤1 tap* — reads this for the anchors
  and re-verifies them against the then-current stamp.

  ⛔ **DO NOT EXECUTE ANY SHIP, STAGE, OR PROPOSAL IN THIS DOCUMENT.** Anchors are `.562`-era and
  the live stamp is `.563` or later; the offset table in `docs/RACK-ELEVATION-PHASE0-EVIDENCE.md`
  applies. Superseded status line, kept for the record:
  ⛔ *HELD UNTIL M4 — owner ruling, 2026-09-01. Nothing is edited. This document is the record;
  it does not authorise work.*

- **Parent:** `SHIP-HANDOFF-IA-SHIFTNAV.md` + Addendum A. Split out of Ship 2 (B-1) because the work
  is structural, not a nav tweak, and the back half of another ship is the wrong place for it.
- **Baseline:** `main` @ `a328a10`, **`phantom-v1.14.562`**, verified and stamped. Every anchor below
  was read against this stamp on 2026-09-01.
- **Owner rulings already in hand:** the SCAN art is **the approved cut** (2026-09-01, now tracked at
  `a328a10`) · Ship 2's dock mechanics shipped as `.562` · B-3 cleared the nav test first.

---

## ⭐ THE RULING, AND WHY IT IS THE RIGHT ONE

**Owner, 2026-09-01: wait for M4.** Asked whether SCAN should become a pillar now — ahead of SHIFT,
which is gated behind M3 — the answer was to defer.

**The reasoning is open question 3 below, and it is the strongest argument in this document.** SHIP
ONE PILLAR NOW AND THE NAV CHANGES TWICE: once here for SCAN, once at M4 when SHIFT arrives and EXIT
re-homes into it per R-02a. Two nav changes means two device verifies, two chances to break the
gloved floor, and a period where the nav is **five slots that are not R-02's five** — Command ·
Build · Scan · Tools · **EXIT**. Deferring costs nothing that M4 does not already cost, and it keeps
`pg-scan`'s re-creation (a partial reversal of LEGACY-RETIRE Stage 6.7) inside one deliberate ship
rather than two.

⚠ **WHAT THIS RULING DOES NOT SAY:** it does not reject the SCAN pillar, and it does not settle open
questions 1 and 2. Those are still live and are answered when M4 is scheduled, not now.

📌 **What survives the hold, and is already done:** the SCAN and SHIFT art is the approved cut and is
tracked (`a328a10`) · `01-nav` no longer races, so a lying slot will fail honestly whenever this does
ship · the ten routes at A-5 and the `pg-scan` history are recorded here so the next session does not
re-derive them.

---

## ⛔ READ THIS BEFORE ANYTHING ELSE: THIS SHIP REVERSES PART OF A COMPLETED CAMPAIGN

**`pg-scan` existed. `v1.14.552` deleted it** — LEGACY-RETIRE **Stage 6.7**, *"SCAN decoupled and
STAGE 6 IS COMPLETE"*, the **eighth and last** borrowed-organ re-home. The file states the outcome
at `:22976`:

> *"`redesign_homeScan` IS DELETED, the EIGHTH AND LAST of the borrowed-organ re-homes. Its children
> are authored in `#wk-scan` directly and `pg-scan` is gone. With this the redesign no longer borrows
> a single node from the legacy house at boot."*

**Giving SCAN its own page re-creates the surface that ship removed.** That is not automatically
wrong — R-02 has always specified SCAN as a pillar, and Stage 6 was about *borrowing*, not about
pillar count — but it must be an explicit owner decision, not a side effect of a nav ship.

⚠ **Three owner-approved positions are in tension and all three currently stand:**

| Source | Says |
|---|---|
| **Contract A8 / R-02** | Primary nav is Command · Build · **Scan** · Tools · Shift |
| **LEGACY-RETIRE Stage 6.7** (`.552`) | `pg-scan` deleted; SCAN's markup lives in `#wk-scan`, a Build sub-tab |
| **`01-nav`** (de-raced at `79e5599`) | The nav highlight and the visible page **must never disagree** |

The third is what forces the issue. It is now measured, not aspirational.

---

## WHY THE CHEAP VERSION IS DEAD

A SCAN slot that simply calls `cmd_route('work','scan')` — the obvious two-line ship — **cannot
work.** That call enters `work` mode, so `showMode` lights **BUILD**, not SCAN. The technician taps
SCAN, the nav says BUILD, and the page is Build's workspace.

⭐ **This was arguable yesterday and is provable today.** `01-nav`'s active-mirror test was racing the
app and reading mid-swap; `79e5599` fixed it to poll for convergence *and* assert the highlight has
not drifted. A lying slot now fails honestly. **Do not ship B-2.**

---

## PHASE 0 — ANCHORS (already read at `.562`; re-verify at execution time)

- **A-1 · `showMode` knows three modes.** `dct-ios.html:19252` — `['command','work','ref'].forEach(...)`
  toggles `#mode-*`, `#bn-*` and the desktop rail together. **A fourth mode is a change to this one
  line and everything keyed off it.**
- **A-2 · The nav is a four-column grid.** `:9960` — `grid-template-columns:repeat(4,1fr)`, with
  `#bn-rail{display:contents}` (`:9961`) so its items become direct grid cells. **Five slots is a
  grid change plus one markup item**, not a wrapper change.
- **A-3 · Geometry is not the constraint.** D-1 measured it: `390px − 12px ÷ 5 = 75.6px` per slot
  against a 44px floor. Current items are `min-height:54px`.
- **A-4 · `#wk-scan` is ~60 lines of authored markup** (`:14137`), registered in the `work-sub`
  group at `:17490` alongside `wk-deploy`, `wk-handoff`, `wk-issues`.
- **A-5 · TEN routes reach SCAN today** and every one must be re-pointed or deliberately left:
  `:13894` `.cs-op` · `:13994` `.cc-qtool` · `:14042` `.hverb` · `:14050` `#tt-scan` tile ·
  `:16585` `#cs-nav-scn` desktop rail · `:16608` `.cs-tscan` topbar · `:22232` Build's own
  `['Scan', …]` action · `:24311` the `id === 'scan'` restore branch · plus two comment references.
  ⚠ **`:24311` is the deep-link/back-nav path** — the one that reaches surfaces from anywhere.
- **A-6 · `nav_push` `p:` values in use:** `command`, `work`, `ref`, `sop`, `triage`, `twin`, `cmd`.
  **`scan` is not among them**; a new mode needs its own and needs `showPage`'s redesign whitelist to
  accept it, or it lands in the *"Not in the new UI yet"* toast that `.555` traced.
- **A-7 · The art is tracked but NOT precached.** `icons/phantom-nav-scan-v3-256.webp`, committed at
  `a328a10`. ⛔ **`PRECACHE_URLS` entry belongs in THIS ship**, when the consumer appears — `sw.js`
  records at `:66`/`:82` that `.364` purged 20 entries that were exactly the reverse mistake.

---

## THE SHIP — one visible change: SCAN is a pillar you can navigate to

- **S-1 · A fourth mode.** Add `scan` to A-1's list and give it a page host. ⚠ **Re-creating a
  `pg-scan` shell is the honest reading of "its own page"** — see the campaign note above; if the
  owner prefers SCAN to remain inside `pg-work` and merely *highlight* correctly, that is a
  different ship and a weaker one.
- **S-2 · Move, do not rebuild.** `#wk-scan`'s ~60 lines move as a unit. ⛔ **Re-home, never
  re-author** — Stage 6's whole lesson, and Contract A2's.
- **S-3 · The fifth slot.** `repeat(4,1fr)` → `repeat(5,1fr)`, one `.botitem` with the approved art,
  and the `PRECACHE_URLS` entry in the same commit as its first consumer.
- **S-4 · Re-point all ten routes (A-5)**, `:24311` included, so no door lands on a moved surface.
- **S-5 · `nav_push`/`showPage` accept `scan`** so back-nav and deep links resolve rather than
  toasting.
- **S-6 · Tests follow the ship**: `01-nav`'s `PAGES`/`SLOTS` maps gain `scan`; `44`'s reachability
  set is unaffected (OPS tools, not pillars); `45-borrowed-organs` must still pass — **it is the
  guard that Stage 6 left behind and it is the one most likely to have an opinion about a new page.**

**Grep gates:** `showWorkTab('scan')` → 0 outside comments · `cmd_route('work','scan')` → 0 ·
`phantom-nav-scan-v3` → ≥1 in `dct-ios.html` **and** 1 in `sw.js`.

**Lockstep:** three stamps. Owner promotes; `VERIFIED` owner-only.

---

## ⏳ WHAT I WOULD NOT DECIDE FOR YOU

1. **Does SCAN get a real page, or stay in `pg-work` with an honest highlight?** The first satisfies
   R-02 and reverses part of Stage 6.7. The second is smaller and leaves the pillar half-built.
2. **Does EXIT keep its slot?** R-02a re-homes hold-to-freeze into Shift **at M4**. Until then a
   five-slot nav is Command · Build · Scan · Tools · **EXIT** — and SHIFT, the actual fifth pillar,
   still has no slot. ⚠ **The nav would then be five slots that are not R-02's five.**
3. ✅ **ANSWERED — WAIT FOR M4 (owner, 2026-09-01).** Shipping one pillar now
   means the nav changes twice: once here, once at M4. That is the ruling's stated reason,
   and it is why questions 1 and 2 above stay open rather than being forced now.

---

## DEVICE-VERIFY (owner, iPhone)

1. Cold launch → **SCAN** is a slot in the bottom nav, with the approved icon, no 404.
2. Tap it: the scanner surface opens **and the SCAN slot highlights** — nav and page agree.
3. Back returns somewhere sane. Repeat with gloves; all five slots still clear the floor.
4. Every old route still lands: Command's scan tile, the hero verb, Build's Scan action, the desktop
   rail and topbar.
5. **Offline:** cold-launch with the network off — the SCAN icon still draws (precache).
6. Nothing else moved: rack detail, deploy flow, OPS row, handoff.

---

## GUARDRAILS

- ⛔ **Re-home, never re-author.** Stage 6 spent eight ships on this lesson.
- ⛔ **No slot that lies.** If nav and page cannot agree, the ship is wrong, not the test.
- ⛔ **The precache entry ships WITH its consumer** — not before, not after.
- ⚠ **`45-borrowed-organs` is the canary.** If it goes red, stop: it means the re-home reintroduced
  the coupling Stage 6 removed.
- ⚠ **This is the second nav change in one line of ships.** `.562` added the badge; if the owner
  defers to M4, say so and stop rather than shipping a nav that changes twice.

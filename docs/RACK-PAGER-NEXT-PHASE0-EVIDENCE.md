# RACK PAGER · NEXT DEAD END — PHASE 0 EVIDENCE (read-only; no patch)

**Written:** 2026-09-14 · **Against:** `FIX-RACK-PAGER-NEXT.md` (`Downloads`, 3,654 bytes, `sha256 de2b7cb7c0979d78…`), status DRAFT awaiting GO.
**Mode:** EVIDENCE ONLY. No source edited, no version bump, no patch.
**Baseline:** `dct-ios.html` on `main` at **`v1.14.590`**, 60,639 lines. ⛔ `.590` is shipped but **not stamped**, so no version can ship regardless of what this report concludes.

⚠ **GRAPHIFY-FIRST WAS ATTEMPTED AND COULD NOT RUN — reported, not skipped silently** (CLAUDE.md working rules). `graphify.exe` is installed at `~/.local/bin/` but **Smart App Control blocks it**: *"An Application Control policy has blocked this file."* That is the same policy the board records against `webkit-2336`'s `libxslt.dll` — ⚡ though note `phone-webkit` itself now launches on this box, so the policy's coverage has changed and board Q-5 is stale in the other direction. The sanctioned fallback was used instead (`graphify-out/wiki/`), and **it has no article for this surface** — no pager, no Forge detail panel. Every anchor below is read from source, per the spec's *"no assumed anchors."*

---

## 0 · The headline, and it redirects the ship

> **The pager is not broken. It correctly walks the five-rack bench. The POS counter is the surface that misleads — it reports position within the 18-rack ROW, inside a modal whose pager only ever traverses the LOADOUT.**

⛔ **AND THE SHIP AS WRITTEN IN §3 WOULD CREATE A SILENT DEAD TAP.** The spec says derive PREV/NEXT *"from the same list and index that produce the POS counter"*. Done literally, NEXT at position 5 of 18 would call `walk(1)` for a rack that has **no slot in the 3D scene**, `focusables.find(...)` would return `undefined`, and `walk` would return without doing anything, without a toast and without a warn. **That is a Contract 14 violation** — *"a tappable control that does nothing is a violation"* — and it is the `.473`/`.531` shape the repo keeps paying for. It would also breach **Contract A6**: five foreground racks, one live WebGL attachment, ever.

**Reported, not resolved.** The fix direction is an owner ruling; §5 of the spec says anything outside the fence goes to the board, and this is inside the fence but points away from the prescribed change.

---

## 1 · E-1 — the renderer and the exact disable predicate

The modal is the **Forge detail panel** (`#detailPanel`), markup at `:13780-13797`; pager row `:13792-13796` with `#navPrev`, `#navExit`, `#navNext`. It matches the device evidence exactly: header text is built at `:21034` and the footer at `:21036`, which produce `ROW C1 · POS 5/18 · 0/9 RACKED` and `9 COMPONENTS · 0 RACKED · 9 PENDING`.

**The predicate, verbatim** (`updateNav`, `:21161-21166`):

```
:21163   var idx = LOADOUT.indexOf(focused.userData.label);
:21164   document.getElementById('navPrev').classList.toggle('disabled', idx <= 0);
:21165   document.getElementById('navNext').classList.toggle('disabled', idx >= LOADOUT.length - 1);
```

**The mechanism is a CSS class, and the answer the spec asked for is "class":** `:9462` `#forge3d-sheet .navbtn.disabled{opacity:.25;pointer-events:none}`.

⚠ **It is disabled twice over, which matters for E-5.** The click handlers are bound **unconditionally** at `:21223-21224` (`on(navPrev,'click',()=>walk(-1))`, `on(navNext,'click',()=>walk(1))`), so the class is what stops the tap reaching them — *and* `walk` guards internally anyway at `:21157` (`if (n < 0 || n >= LOADOUT.length) return;`). Neither path can advance past the loadout.

---

## 2 · E-2 — the POS counter reads a DIFFERENT list. H2 confirmed.

`refreshCounts(label)` `:21028`:

```
:21031   var info = rowOf(label);
:21034   D.meta.textContent = 'ROW ' + info.row.toUpperCase() + ' · POS ' + (info.idx + 1) + '/' + info.arr.length + ' · ' …
```

`rowOf` `:20316`:

```
function rowOf(id) { var row = id.split(':')[0]; var arr = ROWS[row] || []; return { row: row, arr: arr, idx: arr.indexOf(id) }; }
```

| Surface | List | Index | Anchor |
|---|---|---|---|
| **POS counter** | `ROWS[row]` — every cab in the row | `arr.indexOf(id)` | `:20313`, `:20316`, `:21034` |
| **PREV / NEXT** | `LOADOUT` — the Forge bench | `LOADOUT.indexOf(label)` | `:20936`, `:21163` |

⭐ **Two lists, two engines, one modal, and nothing on screen names which is which.** That is exactly the family the spec points at, and it is the same defect the board already ruled on as **LABEL THE COUNTS** (2026-09-05): counts may legitimately differ, but each surface must say what it measures.

**Why the numbers land where they do:** `LOADOUT` is capped at five —

```
:20938   LOADOUT = ids.filter(…).slice(0, 5);
:20939   WINDOW = []; for (var k = 0; k < 5; k++) WINDOW.push(LOADOUT[k] || null);
```

— and `WINDOW` feeds the five scene slots at `:20941`. With `c1:005` last in a five-rack loadout, `idx = 4`, `LOADOUT.length - 1 = 4`, so `idx >= LOADOUT.length - 1` is **true** and NEXT dims. Meanwhile `ROWS['c1'].length` is 18, so POS reads `5/18`. **Both are correct about their own list.**

⭐ **The five is not arbitrary and must not be "fixed" away:** Contract A6 — *"Only the active foreground rack window gets full interactive 3D. Five foreground racks; everything else is scenery. One live WebGL attachment, ever (spec I1)."*

---

## 3 · E-3 — cannot be instrumented without a source edit

`ROWS` `:20313`, `rowOf` `:20316`, `LOADOUT` `:20936`, `setLoadout` `:20937`, `walk` `:21154` and `updateNav` `:21161` are **all function-scoped inside `forge3d_render(mount)` `:20018`**, and there is **no global exposure** — zero hits for `window.LOADOUT`, `window.ROWS`, `window.forge3d`. So `page.evaluate` cannot read the pager list, the index, or the neighbour lookup.

⚠ E-3 as written ("console/throwaway log, stripped before ship") is therefore **a source edit**, on a memory-constrained box, for evidence the source already states unambiguously. **Not done.** The three values it asks for are given above with anchors: list = `LOADOUT` capped at 5 `:20938`; index = `LOADOUT.indexOf(focused.userData.label)` `:21163`; neighbour lookup = `focusables.find(s => s.userData.label === LOADOUT[n])` `:21158`, pre-guarded at `:21157`. **Say the word and the instrumented run happens** — it is an edit, a run and a revert, not a ship.

---

## 4 · E-4 — the bug is DATA-INDEPENDENT, so the phone matrix is not needed. H3 killed.

E-4's stated purpose is to isolate *"whether trap data breaks the pager's list build or whether the bug is data-independent."* **Source answers it: data-independent.**

The cap at `:20938` is an unconditional `.slice(0, 5)` applied after a filter that only drops cabs with no slots and no `RUN` membership. **No sort, no dedupe, no LOC parsing** is involved in the pager's list build. Padded LOCs, duplicated sections and lookalike cabs cannot shorten it below five, and cannot lengthen it past five. **Any row with more than five racks in the loadout reproduces this**, on any master — CRUCIBLE, DFW2 BRUTAL, or US-SPK03.

⛔ **So the CRUCIBLE-vs-DFW2 walk and the C5/C3 trap-row cases do not need to be run.** Ship discipline 4: *"Never ask the owner to manually verify what automation can prove"* — and here source alone proves it. **Nothing on this finding requires a phone.**

---

## 5 · E-5 — disabled, not occluded. H5 killed, from source, no phone check.

`:9462` sets `pointer-events:none` on `.navbtn.disabled`. The element is **programmatically inert**, not covered by something else. The spec called this "cheap to rule out"; it is ruled out without leaving the source.

---

## 6 · Hypothesis ledger

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| **H1** | off-by-one / inverted end-of-list predicate | ⛔ **KILLED** | `idx >= LOADOUT.length - 1` is correct **for `LOADOUT`** `:21165`. Nothing is inverted and nothing is off by one. |
| **H2** | pager list built by a different engine than the POS counter | ✅ **CONFIRMED** | `LOADOUT` `:21163` vs `ROWS[row]` `:20316`/`:21034` |
| **H3** | list truncated by trap rows (sort/dedupe choke) | ⛔ **KILLED** | the cap is an unconditional `.slice(0, 5)` `:20938`; no sort, no dedupe, no LOC parsing in the list build |
| **H4** | stale disabled state carried from a previous rack | ⛔ **KILLED** | `updateNav()` is called by `openDetail` at `:21150`, so it recomputes on every open |
| **H5** | occlusion, not disablement | ⛔ **KILLED** | `pointer-events:none` `:9462` |

---

## 7 · What the ship cannot be, and the shape of the question for the owner

⛔ **§3 as written is unsafe.** Pointing the pager at `ROWS[row]` gives `walk()` targets that have no scene slot (`focusables` is exactly the five `WINDOW` entries, `:20939`/`:20941`), so `:21159`'s `if (slot)` swallows the tap: dimmed becomes tappable-and-dead. Worse than the current state, and a Contract 14 violation.

**The genuine options, none built, owner picks:**

- **A · Label the counts.** The pager is right; the meta line is the liar. Make the header say what the pager traverses — position within the loadout — and, if the row total is still wanted, name it as the row total rather than letting `POS n/18` imply a sequence the pager was never walking. Smallest change, no behaviour change, directly the board's LABEL THE COUNTS ruling.
- **B · Advance the window.** NEXT at the end of the loadout re-windows the bench to the next five racks in the row and focuses the first. Real capability, honours Contract A6 because still exactly five are live — but it is a new behaviour with a scene rebuild behind it, not a predicate fix, and it is nowhere in the spec's fence.
- **C · Do nothing to the pager and file the counter.** Treat this as the MASTER-TRUTH-family honesty finding it is, and let it ride with the other unlabelled-count work.

⚠ **The spec's §3 conditional already anticipates this shape** — *"If Phase 0 shows the pager list is genuinely short (H3), that is a separate data-honesty finding: report it, do not silently fix the list build."* H3 is killed, but the conclusion it guards against applies to H2 just as well: **the list is not short by accident, it is short by contract**, and the honesty problem is on the counter.

---

## 8 · Bounds

Source reading only, on `main` at `.590`. **Nothing was executed, no storage inspected, no device used, no patch written, and no fix built.** Graphify could not run (§ header) and the wiki has no article for this surface, so every anchor is a direct source read re-anchored by verbatim string. E-3's runtime instrumentation was **not performed** and the reason is stated in §3 rather than left as a silent gap.

---

## 9 · OWNER RULING 2026-09-14: **A — label the counts.** Ship prep, NOT shipped.

Owner picked **A** against the three options in §7. The pager stays as it is; the meta line stops implying a sequence it never walked.

⛔ **THE SHIP IS BLOCKED AND CANNOT BE STARTED.** `.590` is on `main` unstamped, so `phantom-guard.js` refuses any `version.json` bump, and this change needs one. ⛔ **It also cannot be pre-committed under the `.590` stamp:** that would put app bytes on `main` under a version the owner is about to adjudicate from staging — exactly the `.588` drift `PHANTOM_CURRENT_STATE.md` records, where a stamp ended up meaning three changes instead of one. **One stamp, one meaning.** And any commit at all, pushed or not, moves `HEAD` off `origin/main` and trips the `NOT-SERVED` guard on the owner's pending verify.

**The single anchor, and it is one line:**

```
:21034   D.meta.textContent = 'ROW ' + info.row.toUpperCase() + ' · POS ' + (info.idx + 1) + '/' + info.arr.length + ' · '
:21035     + (slots.length ? (racked + '/' + slots.length + ' RACKED') : deploy_forge_emptyState(label));
```

Today: `ROW C1 · POS 5/18 · 0/9 RACKED`

**Candidate strings — the owner picks, this is his taste call under Design law 5:**

- **A1 (recommended):** `ROW C1 · POS 5/18 · BENCH 5/5 · 0/9 RACKED` — adds one clause. `BENCH 5/5` is the pager's own list, so it answers the question the dimmed NEXT actually raises, and its presence beside `POS` makes `POS` read as row-scoped by contrast.
- **A2 (more explicit, longer):** `ROW C1 · POS 5/18 IN ROW · BENCH 5/5 · 0/9 RACKED` — removes the last of the ambiguity at the cost of clutter, against Design law 5's *"minimum formatting, no clutter."*

⚠ **Both need a 390px look before choosing**, and the reason is recorded rather than assumed: `#forge3d-sheet .detail-meta` `:9395` sets no `white-space`, so this line **wraps** and does not clip. That is a materially safer failure than the status-pills row, which is `nowrap` and **clipped a ⚠ FLAGGED clause at x=445 in a 372px row** (`:20731-20736`) — a live defect found by measurement, not by waiting for a report. Different element, different risk, but the same lesson: measure the string at 390 rather than reasoning about it.

⛔ **The bench number must come from the pager's own list, not be recomputed.** `LOADOUT` is in scope at `:21034`, so the clause reads from the same array `updateNav` `:21163` indexes. Deriving it any other way would recreate, inside one line, the exact two-engines defect this ship exists to remove.

**Scope, per the spec's §5 fence:** only the meta string. No change to `updateNav`, `walk`, the pager's enable logic, the footer, row toggles, or the counter's arithmetic. **No test is owed by the fence**, but a Playwright assertion on the rendered meta string is cheap and would pin the labelling against a future edit — offered, not assumed.

---

## Q · Found, not worked (spec §5 fence)

- ⚡ `graphify.exe` is blocked by Smart App Control on this box, so the CLAUDE.md graphify-first rule is currently unfollowable — while `phone-webkit`, which board Q-5 says is blocked by the same policy, now runs. The policy's coverage has moved in both directions and neither doc reflects it.
- `graphify-out/wiki/` has no article for the Forge detail panel or the pager, so the wiki fallback is thin exactly where this ship needed it.
- The click handlers at `:21223-21224` are bound unconditionally and rely on CSS `pointer-events` to gate them. It works, but the gate is presentation-layer for a behavioural rule — the class-vs-handler split is a latent trap if that CSS rule is ever scoped differently.
- `refreshCounts` `:21034` prints `POS` from the row even for a cab whose slots are empty; `:21032-21033`'s comment records a prior ruling that *"position within the row is still true and still useful for an unprovisioned cab, so only the count clause yields."* That earlier decision is the reason the row position is on this line at all — worth reading before changing it.

---

## 10 · 2026-09-15 — §9 IS SUPERSEDED: the owner asked for NEXT to walk the row

⛔ **§9's "OWNER RULING 2026-09-14: A" was never entered in `OWNER-RULINGS.md`** — it existed only in this untracked file. On 2026-09-15 the owner reported the same defect on staging and asked, verbatim: *"Fix it, add a quick check that NEXT enables on c1:005, and tell me what the root cause was."* **That is option B of §7, not A.** §1–§9 are left as written history.

**Re-verified before acting, at `.590` (`fd1fa40`, now `VERIFIED` = `release`):** every §1–§2 anchor reads identically — `updateNav` indexes `LOADOUT` (`:21163-21165`), `setLoadout` caps it with `.slice(0, 5)` (`:20938`), POS reads `rowOf()` → `ROWS[row]` sorted (`:20313-20316`, `:21034`), the default bench is `RUN.slice(0, 5)` (`:21010`). No racked-count gate; not a sort mismatch.

**Built on branch `fix/rack-pager-row-walk`:** `walk` and `updateNav` read `rowOf()`, the list that prints POS. A neighbour with no bench slot re-windows the bench through the existing `setLoadout` to a five-rack window of the row containing it — **still five live racks (A6)** — and only then focuses it, so §7's dead-tap trap is closed rather than created. Pinned by `test/e2e/66-forge-pager-row-walk.spec.js`: RED on `.590` for the reported reason, GREEN with the fix, and a mutation that disables the re-window (enabled-but-dead NEXT) is caught.

⚠ **§9's meta-string ship (A1 `BENCH 5/5`) was NOT built.** With the pager walking the row, `POS 5/18` and NEXT now describe the same list, so the contradiction §9 set out to label is gone; whether the header still wants a bench clause is open, not assumed.
✅ **The side effect is closed, and so is a second one the re-review found.** `setLoadout` saves the bench to `deploy_forge_loadout_v1`, registered as the *"hand-built rack layout"*. As shipped: a bench moved by walking is **not saved** (`setLoadout(…, { persist: false })`); the walk lands on its target directly (`{ focus: target }`, so no other rack opens in the panel first); and the loadout picker opens on the **saved** bench, so an untouched APPLY cannot save the walked window either. Recorded in `OWNER-RULINGS.md` 2026-09-15 as an implementation choice under Contract 11, strikable.

### Proof — `phone-webkit`, final source (`.591`)

- **`test/e2e/66-forge-pager-row-walk.spec.js`, 5 tests, 5/5 (3.5 m):** NEXT at `c1:005` walks off the bench and back · all 18 positions in order, dead ends only at the row ends · a walk never overwrites a hand-picked saved bench · an untouched picker APPLY after a walk keeps it · a PREV walk opens only its target. The first was **RED on `.590` for the reported reason** (`#navNext` class `navbtn disabled` at `POS 5/18`); the last three were each **RED against the diff before their fix**. A mutation disabling the re-window (NEXT enabled but dead) was caught.
- **Regression, each spec alone:** `09-master-binding` 5/5 · `08-forge-layout` 17 passed, 1 skipped (unchanged from before the fix).
- **Reviews:** `phantom-ship-gate` PASS on each of the three diff revisions. `phantom-rd-reviewer` CHANGES-REQUESTED twice — the walk overwrote the hand-built bench; then the picker did — and PASS on the final diff (RACK SCENE LOCK, A6, Contract 14 and Contract 11 all traced to call sites).
- ⚠ **Two click-stability timeouts did not reproduce.** Spec 66 timed out once in the 18-step walk and once in the `c1:005` test, both with `#navNext` enabled but never "stable" for Playwright. On an idle machine the full spec passed 4/4 in 3.0 m with no other Playwright process alive. Both failures overlapped heavy concurrent work — the second a reviewer agent running Playwright on every project against the shared test server. **Recorded as contention, not as something fixed**; reviewer agents are now told not to run tests.

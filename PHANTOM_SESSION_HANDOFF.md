# PHANTOM — SESSION HANDOFF

**One session's worth of continuation. Overwrite this file each session; do not append a log.**
Durable facts belong in `PHANTOM_CURRENT_STATE.md`; durable lessons belong in memory.

---

## Last session — 2026-08-13/14

**Ended:** clean, eight ships pushed. **Live: `v1.14.461`** (`5b07828`).
**CALL 0 cap: 2 of 6.** Verify debt: `.460`–`.461`, block at the TOP of `BATCH-VERIFY.md`.

⚠ **This file was STALE when the session opened** — it claimed the previous session ended clean at
`.453` with nothing in flight, while the tree held an unstamped, untested, uncommitted `.454`.
**If `git status` disagrees with this document, `git status` is the truth.**

---

## What shipped

| | | |
|---|---|---|
| `.454` | Forge rack-centric, WALK AISLE an explicit mode | ✅ hardware |
| `.455` | The locked pose became a true front elevation | ✅ hardware |
| `.456` | HANDOFF art stops fabricating status | ✅ hardware |
| `.457` | The context engine (369 V3, rescoped) | ✅ hardware |
| `.458` | **The SW UPDATE P0** | ✅ hardware |
| `.459` | No-op payload that proved it | ✅ hardware |
| `.460` | SHIFT's door — it had none that worked | ⏳ owed |
| `.461` | Build's CONTINUE cannot fail silently | ⏳ owed |

---

## ⛔ THE THREE LESSONS WORTH MORE THAN THE SHIPS

**1 · A green suite proves nothing when the assertions test the wrong property.**
`.454` locked the camera to the angles `setFocus` had always targeted — 5.7° yaw, 4.6° pitch — and
passed everything while visibly failing the owner's eye, because **every assertion tested that the
camera did not MOVE, never that it was SQUARE.** ⭐ *"These are the values the product already used"*
is not evidence they are right.

**2 · PRESENT, WIRED AND CORRECT IS NOT REACHABLE.** SHIFT's only door was a control with a live
onclick, correct text and a sensible class, measuring **0×0 inside a `display:none` container at
every viewport**. Then the first re-home landed in a **second** hidden node (`.cs-microbar`, also
`display:none` at 390). ⭐ **Assert GEOMETRY and hit-testing, not presence** — spec 40 caught the
second one, and a "is it there and wired" test would have passed through both.

**3 · Prove an environment artifact is not the cause before fixing what it shows.** A diagnostic
that seeded storage then reloaded *after* boot left `#pe-tapcatch` over the page, and
`elementFromPoint` reported the splash intercepting CONTINUE — **which looks exactly like the
reported bug.** Seeding through the fixture made it vanish.

---

## ⚠ TRAPS HIT THIS SESSION

1. **An early-return guard whose guarded path was the COMMON one** (`setWalkMode` writing the rack
   label into the pill that owns `n/m RACKED`).
2. **One convergence test across several axes** — the pose ease snapped on total 3-D distance, so
   camera height crept across a walk. ⭐ **The largest-delta axis decides for all of them.**
3. **Fixed wall-clock waits against frame-based easing.** ⚠ This harness renders at **~2.7 fps**.
   ⭐ Poll for the condition; a 90-second probe that MEASURES turns a guess into a fact.
4. ⛔ **NEVER ROUND-TRIP ANY REPO FILE THROUGH A SHELL READ/WRITE.**
   `(Get-Content -Raw) … | Set-Content` mojibaked **4,622 lines** of `dct-ios.html`, and
   **`phantom-guard` returned exit 0 on the corrupted file** — it checks line endings, not encoding.
   ⚠ **I then did it AGAIN to a spec hours later**, which is why the rule is now "any file, not just
   those two". An untracked file has **no `git checkout` to recover with**. Use Edit.
   Detect with `Select-String -Pattern 'â€|â”|â­|âœ|âš'` → must be 0.
5. **Static source greps cannot see runtime composition** — twice a verification grep reported a
   false MISS (a constant reassigned after construction; a string built by concatenation).
   ⭐ **The runtime is the authority.**
6. **A guard can reintroduce the thing it prevents.** `.458`'s honesty guard refused to repaint the
   SW pill when nothing was waiting — which left a *failed* activation stuck reading `UPDATING…`.

---

## Useful capabilities discovered

⭐ **Raster conversion with no install:** no `cwebp`/`sharp`/ImageMagick here, but **Playwright's
Chromium** does it — load PNG, canvas, `toDataURL('image/webp', q)`. Used for `.456`, 1468 KB → 44 KB.
⛔ **No image GENERATION** — no `GEMINI_API_KEY`; the `design` skill emits SVG only.
⭐ **Service-worker lifecycle IS automatable** on `desktop-chromium` (WebKit never installs one).

---

## ⛔ Open — owner decisions, none started

1. **The `.460`/`.461` device pass** — two checks, top of `BATCH-VERIFY.md`. ⭐ Check 2 is a
   diagnostic: the CONTINUE failure does **not** reproduce here, so *which* message appears — or
   that none does — is the finding.
2. **From the `.460` walk, disclosed and unfixed:** the `"Loading storage metrics…"` line that never
   resolved · `"CONTEXT INJECTION ACTIVE"` naming 3 AI surfaces when `.457` wired 7.
3. **The locked drag says nothing** · **the FOV literal** (fold into the next `placeCamera` ship) ·
   **the HANDOFF gesture**.
4. **369 follow-ons:** the auto-detecting paste parser is the spec's own named next candidate; the
   EVIDENCE UI card waits for response formats. ⛔ Next-best-action, readiness scores, Rack
   Intelligence and auto-handoff each need data-reality scoping first — **the `.457` field inventory
   is the model** (3 already emitted, 4 added, 1 degraded, 3 excluded for having no source).
5. **R1-D remainder** · **PHASE-ENGINE step text** · **M3 data sources**. ⛔ D-1 is the LAST domino,
   and §1i corrected the sentence it was partly resting on.

---

## Machine note

WebGL context exhaustion means no trustworthy multi-spec run — a six-spec run once took **18 hours**
and all six then passed alone in three minutes. ⭐ **Run renderer/Forge specs ONE AT A TIME.**
Redirect to a file rather than piping; print every pass/fail line (`tail -1` hides failures).
⚠ GitHub threw **four consecutive 500s** on pushes and Pages served stale bytes for minutes after —
documented transient: retry, then verify the SERVED bytes.

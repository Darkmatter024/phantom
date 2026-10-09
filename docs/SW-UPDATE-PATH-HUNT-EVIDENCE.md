# SW UPDATE PATH — HUNT EVIDENCE (F-3, `39-sw-update-path:24`)

**Commission:** owner, 2026-09-01 — hunt the `39-sw-update-path` failure surfaced by the full sweep.
**Baseline:** `main` @ `5a44c19`, `phantom-v1.14.560`, verified and stamped.
**Status:** EVIDENCE ONLY. No fix written, no stamp. **This one needs an owner ruling, not a patch.**

---

## ⛔ VERDICT: THIS IS NOT A BUG. IT IS TWO SHIPS IMPLEMENTING OPPOSITE DESIGNS.

`v1.14.458` removed `skipWaiting()` from install as a **P0 fix**, device-verified by the owner.
`v1.14.513` put it back, three months of versions later, on a rationale that **contradicts that
device verification.** The file now carries both explanations, adjacent, both asserted as true.

**Nobody has been wrong since — the two ships simply disagree, and no instrument was watching.**

---

## THE EVIDENCE

### E-1 · The line, and the comment directly above it

`sw.js:166-171` — the `.458` rationale and the `.513` line, four lines apart:

```js
// ⛔ v1.14.458: the old note here read "skipWaiting() at the end so upgrades activate immediately
// on next page load". That is no longer true and was the P0: activating immediately meant no
// worker ever reached `waiting`, so the SW UPDATE badge had nothing to promote. A new worker now
// INSTALLS AND WAITS; the user's tap posts SKIP_WAITING and the message handler below promotes it.
self.addEventListener('install', (event) => {
  self.skipWaiting();          // ← v1.14.513
```

**The comment explains why the line beneath it must not exist.**

A second `.513` note sits at the *bottom* of the same handler (`sw.js:187-189`), describing a call
placed at the *top* — so a reader who scrolls the block sees the justification detached from the
statement it justifies.

### E-2 · Provenance

| | |
|---|---|
| `.458` | Owner-directed P0. **Device-verified**, Pass A, 2026-08-14. |
| `.513` | `50ee914`, 2026-08-24 22:11, *"iOS Safari fix: Add skipWaiting() to install event"*. Co-authored **Claude Haiku 4.5**. |
| `.513a` | `169efd4`, 22:14 (3 min later), moved it outside `waitUntil`. Same author. |

⛔ **`.513`'s stated rationale is:** *"iOS Safari does not reliably process message-based
skipWaiting() calls."*

⭐ **THAT CLAIM CONTRADICTS A RECORDED DEVICE VERIFICATION.** `PHANTOM_CURRENT_STATE.md:1184`:

> **Pass A closed the SW UPDATE P0** — one tap moved the installed PWA from `.458` to `.459`,
> reloading once, clearing the badge, and leaving Site Profile, Active Master and rack/work/event
> data intact; no reinstall, no Safari cache clearing.

**The message-based path was proven to work on the owner's actual iPhone, ten days before `.513`
declared it unreliable.** No device evidence is offered for `.513`'s claim, and none is recorded.

⚠ **This does not make `.513` wrong.** iOS Safari is genuinely inconsistent across versions and PWA
install states, and one successful pass is not proof of reliability. But the file now asserts both
"it works" and "it does not work" with only the first backed by hardware.

### E-3 · What actually happens today — measured, not reasoned

`39-sw-update-path` on **desktop-chromium** (a browser that really installs service workers):
**6 of 7 pass. Only the source-level assertion fails.**

| Test | Result |
|---|---|
| install must NOT skipWaiting | ⛔ **FAIL** |
| exactly one `controllerchange`, one activation door | ✅ pass |
| navigations / `version.json` not answerable from stale cache | ✅ pass |
| **the badge is honest: cannot claim an update with no worker waiting** | ✅ pass |
| the diagnostic reports lifecycle position | ✅ pass |
| **an activation attempt with nothing to promote FAILS LOUDLY** | ✅ pass |
| **operational data is never touched by an update attempt** | ✅ pass |

⭐ **The `.458` guards are still doing their job even though the mechanism beneath them changed.**
The badge does not lie, the failure is loud, and user data is safe. **The P0 has not returned in
full** — this is not a dead button that silently does nothing.

### E-4 · But the designed path is now unreachable

With `skipWaiting()` in install, a worker never parks in `waiting`. Every branch of the app's update
UI is keyed on exactly that:

- `dct-ios.html:12938` — `if (reg.waiting) phantom_ghostUpdateReady();` — never true on load.
- `dct-ios.html:13041-13045` — `promote()` returns false without `r.waiting`; `SKIP_WAITING` is
  never posted.
- `dct-ios.html:13062` — the 15s backstop `fail('worker never reached waiting')` is now the
  *expected* outcome of a tap, not an edge case.
- `sw.js:197-201` — the message handler `.458` added has **no live sender**.

And one comment is now simply false — `dct-ios.html:12944-12946`:

> *"with skipWaiting gone the worker is now genuinely parked in `waiting` at this point — so the
> badge finally means what it says."*

**skipWaiting is not gone.**

### E-5 · The update still lands, by a different route

`install` → `skipWaiting()` → activate → `controllerchange` → the single guarded listener at
`dct-ios.html:12918` reloads once. **Users do get new versions** — automatically, without the badge.

⚠ **UNVERIFIED AND WORTH KNOWING:** no test proves this end-to-end auto-update on iOS, and I did not
prove it here. `.514`–`.560` all reached the phone, which is *circumstantial* evidence it works.

---

## THE REAL QUESTION FOR THE OWNER

**Which design does PHANTOM want?**

- **A · Auto-update (`.513`, current).** New version activates and reloads itself. ⭐ Nothing to tap,
  nothing to miss. ⛔ **An unannounced reload can land mid-shift**, on a gloved tech entering data in
  a cold aisle. The app is offline-first and data-safety-first; a surprise reload is a product
  decision, not an implementation detail, and it was never ruled.
- **B · User-controlled (`.458`).** Badge appears, tech taps when ready. ⭐ Never interrupts work;
  the tech chooses the moment. ⛔ Depends on the message path `.513` claims iOS mishandles — a claim
  that contradicts Pass A and has no device evidence either way.
- **C · Both.** Park in `waiting`, raise the badge, and auto-promote only after a quiet period or on
  a fresh launch. More moving parts, and every one of them is an iOS lifecycle edge case.

⛔ **I am not choosing.** `.513` was taken without an owner ruling and that is precisely the problem;
taking a second unruled decision on top would repeat it.

---

## HONEST BOUNDS

- ⛔ **Not device-verified, either way.** Everything measured here is desktop-chromium and source
  reading. **The one claim that decides A vs B — whether iOS Safari honours message-based
  `skipWaiting` — can only be settled on the owner's iPhone.**
- ⛔ **I did not prove the auto-update path works on iOS.** That `.514`–`.560` all arrived is
  suggestive, not proof; they may have arrived by ordinary navigation rather than by SW promotion.
- ⛔ **I did not prove the mid-shift reload hazard occurs.** It follows from the mechanism, but no
  observation of it exists.
- ⚠ **`.513` may well be right.** One passing device test is not a reliability proof, and iOS varies
  by version and install state. The defect recorded here is that **the two ships were never
  reconciled** — not that either author reasoned badly.
- 📌 **The test is not wrong and must not be "fixed" to green.** It encodes design B. If the owner
  rules A, the *test* changes to assert A deliberately — and the `.458` comments come out with it.

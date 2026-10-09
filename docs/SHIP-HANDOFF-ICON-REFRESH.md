# SHIP-HANDOFF-ICON-REFRESH

**Status:** READY — pending John placing the asset files (see §2)
**Scope:** One ship. Swap the app icon set to the new chrome-ghost art. Served-content change → version bump + three-stamp lockstep.
**Act (DOCTRINE-THREE-ACTS):** None of the three — this is identity/branding, not flow. Door ledger: 0 opened / 0 closed. Tap counts unchanged everywhere. Any edit that would change a flow is out of scope and must stop.

---

## §0 — Session preconditions (non-negotiable)

1. Run `/graphify . --update` and read `graphify-out/wiki/index.md` plus relevant god nodes before any patch. Fail loudly if graphify is missing.
2. Patches are written against **actual verified source at HEAD**, never assumed anchors. If Phase 0 finds a reference this spec didn't predict, report it — do not invent handling.
3. `str_replace`-style surgical edits only.
4. **No promote. Ever.** `tools/promote.ps1` from John's terminal is the only promote path. VERIFIED stamp is owner-only via `tools/stamp.ps1`.
5. Windows shell is PowerShell 5.1: chain with `;`, never `&&`.

---

## §1 — Why

The app icon set is being replaced with the new chrome/neon ghost render (John-selected, processed to true-alpha masters). This aligns the installed-PWA identity with the shipped ghost boot screen.

**Explicitly out of scope:** the boot-screen ghost sequence and its assets (locked and shipped — do not touch), dock/nav icons (separate Grok-icon batch with its own open provenance ruling), BUILD banner art, OPS wall art.

---

## §2 — Inputs (owner action before you start)

John downloads these six files from web-Claude and stages them at **`icons/incoming/`** in the repo working tree. Do not begin Phase 1 until all six exist there; report and stop if any are missing.

| File | Format | Purpose |
|---|---|---|
| `phantom-icon-1024.png` | PNG, true alpha, 1024×1024 | Master / any-size source |
| `phantom-icon-512.png` | PNG, true alpha, 512×512 | Manifest icon |
| `phantom-icon-192.png` | PNG, true alpha, 192×192 | Manifest icon |
| `apple-touch-icon.png` | PNG, opaque on dark (#05060C), 180×180 | iOS home-screen icon |
| `favicon-32.png` | PNG, true alpha, 32×32 | Browser tab |
| `phantom-ghost-256.webp` | WebP per locked icon spec (`cwebp -q 82 -alpha_q 95 -m 6`, true alpha) | In-app use per icon doctrine |

Filenames above are staging names only. Final repo paths/names are decided by Phase 0 evidence (match what the code actually references — do not force these names onto the code, and do not rename code references to match these files without reporting the mapping first).

---

## §3 — Phase 0: icon reference census (EVIDENCE ONLY — no patch)

Build a table of **every** current icon reference from verified source at HEAD. Search at minimum:

1. `dct-ios.html`: `<link rel="apple-touch-icon"...>`, `<link rel="icon"...>`, `<link rel="manifest"...>`, any `apple-touch-startup-image`, any inline manifest JSON, any `<meta>` icon/tile references.
2. The manifest file (whatever the link tag actually points at): every entry in `icons[]` — src, sizes, type, purpose (`any` vs `maskable`).
3. `sw.js`: precache/asset lists containing any icon path.
4. `forge.html` and any other served page: icon link tags (report only; forge edits are their own call — default is out of scope unless John rules otherwise at the Phase 0 gate).
5. Existing files in `icons/` (or wherever assets live): list what's there, note which files are referenced vs orphaned.
6. Any place the app draws the app icon in-UI (e.g., SYS/about surfaces) — report, don't assume.

**Phase 0 report format:** one table — `referencing file : line : exact path referenced : exists on disk? : replaced by which incoming file`. Plus a short list of anything unmapped (a referenced size we don't have, a `maskable` purpose entry, startup images). **Stop and wait for John's GO on the mapping before Phase 1.**

Note for the mapping: transparent-alpha PNGs are correct for manifest icons; only `apple-touch-icon` must be opaque (iOS composites transparency to black). If the manifest declares `purpose: "maskable"` anywhere, flag it — maskable needs a safe-zone-padded variant we have not produced; the ruling default is to keep that entry pointed at `any` art or drop `maskable` for this ship, John decides.

---

## §4 — Phase 1: the ship (ONE visible change)

After John's GO on the Phase 0 mapping:

1. Copy/rename the incoming files onto the exact paths the code references (per approved mapping). Old icon files are **left in place** this ship if anything still references them; orphan cleanup is a follow-up docs/cleanup ship, not this one.
2. Edit only where a referenced path/size/type genuinely changes. If the approved mapping reuses existing filenames verbatim, the HTML/manifest may need **zero** edits — that is the preferred outcome.
3. Bump `sw.js` cache version so clients refetch the icon assets. Three-stamp lockstep: `dct-ios.html` / `sw.js` / `version.json` all on the new version.
4. Delete `icons/incoming/` staging folder as part of the same commit.

**Definition of done (grep gates):**
- Every icon path referenced in `dct-ios.html`, the manifest, and `sw.js` resolves to a file on disk (script the check, show output).
- Zero references to `icons/incoming/`.
- Three stamps agree on the new version.
- Playwright precheck if the suite touches boot/head assets; no new failures vs current baseline.

---

## §5 — Verify (owner gate)

Claude Code ships to `main`; device checks run against main's live staging URL per the canonical verify → stamp → promote order. John's phone check:

1. Version pill reads the new version on cold launch.
2. Browser tab shows the new favicon.
3. **Home-screen icon:** iOS caches the apple-touch icon at install time — the existing installed PWA will keep the old icon. The honest check is: remove the installed PWA and re-add to Home Screen, confirm the new ghost renders (dark background, chrome ghost, not a black square and not white-background art). This does clear that install's local data — John does this on his own timing/device choice; the .585 backup/restore path exists if needed. If John defers the reinstall, the ship can still stamp on checks 1–2 + a Safari-rendered icon confirmation, with the home-screen confirm noted as deferred in the stamp line.
4. Boot-screen ghost sequence unchanged (tap gate intact).

No VERIFIED stamp, no promote, until John says so from his own terminal. FAILED is recorded as FAILED.

---

## §6 — Comprehension gate

Before Phase 0, restate in your own words: what is being changed, what is explicitly frozen, why the reinstall caveat exists, and why this ship's door ledger is 0/0. One paragraph. Then proceed.

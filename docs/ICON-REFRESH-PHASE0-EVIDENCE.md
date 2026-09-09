# ICON-REFRESH — PHASE 0 EVIDENCE (read-only, nothing authorised to build)

**Written:** 2026-09-09 · **Baseline:** `main` at `0457936`, `.585` served on release and staging · **Spec:** `docs/SHIP-HANDOFF-ICON-REFRESH.md` §3
**Status:** evidence only. No patch, no version bump, no asset copied onto a referenced path. **Five mapping questions below need the owner's GO before Phase 1.**
Every row is measured from the `.585` bytes at HEAD and from the files themselves — dimensions, colour type and alpha content were decoded, not read off the handoff table.

---

## 1 · The incoming six, as measured

Staged at `icons/incoming/` (untracked). A PNG decoder (IHDR + inflate + unfilter, `zlib` only — no `sharp` on this box) read every pixel's alpha; the WebP row is from the VP8X chunk header.

| File | Claimed | Measured | Alpha | Verdict |
|---|---|---|---|---|
| `phantom-icon-1024.png` | 1024×1024, true alpha | 1024×1024, 8-bit, colour type 6 | 56.4 % fully transparent, edges 100 % transparent | **TRUE ALPHA** ✅ |
| `phantom-icon-512.png` | 512×512, true alpha | 512×512, colour type 6 | 56.0 % transparent, edges 100 % transparent | **TRUE ALPHA** ✅ |
| `phantom-icon-192.png` | 192×192, true alpha | 192×192, colour type 6 | 54.6 % transparent, edges 100 % transparent | **TRUE ALPHA** ✅ |
| `apple-touch-icon.png` | 180×180, opaque on dark | 180×180, **colour type 2 (no alpha channel)** | 0 transparent px, all four corners opaque | **OPAQUE** ✅ correct for iOS |
| `favicon-32.png` | 32×32, true alpha | 32×32, colour type 6 | 43.0 % transparent | **TRUE ALPHA** ✅ |
| `phantom-ghost-256.webp` | WebP, true alpha | VP8X 256×256, alpha flag set, `ALPH` chunk 3007 B | present | ✅ |

**All six match the handoff's claims exactly.** The one that mattered most — `apple-touch-icon` must be opaque, because iOS composites transparency to black and the result reads as a black square — is genuinely opaque, and is the only one of the six without an alpha channel.

## 2 · The census — every icon reference at HEAD

| Referencing file | Line | Exact path referenced | On disk? | Replaced by |
|---|---|---|---|---|
| `dct-ios.html` | 11 | `manifest.json` | ✅ | — (not an icon) |
| `dct-ios.html` | 24 | `apple-touch-icon.png` | ✅ 180×180 opaque, 35,674 B | `apple-touch-icon.png` ✅ **name matches** |
| `dct-ios.html` | 25 | `icon-192.png` | ✅ 192×192 opaque, 39,450 B | `phantom-icon-192.png` ⚠ **name differs** |
| `dct-ios.html` | 26 | `icon-512.png` | ✅ 512×512 opaque, 179,094 B | `phantom-icon-512.png` ⚠ **name differs** |
| `dct-ios.html` | 27 | `favicon-32.png` | ✅ 32×32 opaque, 1,491 B | `favicon-32.png` ✅ **name matches** |
| `dct-ios.html` | 28 | `favicon-16.png` | ✅ 16×16 opaque, 481 B | ⛔ **NOTHING — Q2** |
| `manifest.json` | 12 | `favicon-16.png` · 16×16 · any | ✅ | ⛔ **NOTHING — Q2** |
| `manifest.json` | 13 | `favicon-32.png` · 32×32 · any | ✅ | `favicon-32.png` ✅ |
| `manifest.json` | 14 | `apple-touch-icon.png` · 180×180 · any | ✅ | `apple-touch-icon.png` ✅ |
| `manifest.json` | 15 | `icon-192.png` · 192×192 · any | ✅ | `phantom-icon-192.png` ⚠ |
| `manifest.json` | 16 | `icon-512.png` · 512×512 · any | ✅ | `phantom-icon-512.png` ⚠ |
| `manifest.json` | 17 | `icon-512-maskable.png` · 512×512 · **maskable** | ✅ 512×512 **opaque**, 153,021 B | ⛔ **NOTHING — Q3** |

**Eleven references, six distinct files, all six present on disk.** The Definition-of-Done resolve gate was run against HEAD as a control and reports **0 unresolved** today, so a non-zero result after Phase 1 is caused by Phase 1.

### Searched and clean

- **`forge.html`: zero icon link tags, zero manifest link.** It is not an installable surface, so §3.4's "report only" resolves to *nothing to report* and forge stays out of scope on measurement, not on assumption.
- **`index.html`: zero icon or manifest references.**
- **`apple-touch-startup-image`, `msapplication-TileImage`, `mask-icon`, inline manifest JSON: zero occurrences** in `dct-ios.html`.
- **No in-UI surface draws the app icon.** The only `phantom-icon` hits in `dct-ios.html` (`:720`, `:722`) are the `.tn-item .phantom-icon` **nav** class — a drop-shadow filter on the tab bar, which is the separate Grok-icon batch and out of scope.

### The service worker — §4.3 confirmed, with a correction to the reason

**None of the six app icons is in `PRECACHE_URLS`, and neither is `manifest.json`** (grep count 0 for every name). They are nevertheless cached: the fetch handler's same-origin branch is **cache-first**, and it `cache.put`s any successful same-origin GET into the cache named by `CACHE_VERSION` (`sw.js:289–311`). So an installed client holds the old icons in its runtime cache and would keep serving them indefinitely.

**Therefore the `CACHE_VERSION` bump in §4.3 is not a nicety — it is the only mechanism that evicts them**, since a new cache name orphans the old entries and the next fetch repopulates from network. The handoff's wording ("so clients refetch the icon assets") is right; the assumption that they were precached is not.

## 3 · Size deltas, if the mapping is approved

| Path | Now | After | Δ |
|---|---|---|---|
| `apple-touch-icon.png` | 35,674 B | 39,343 B | +3.7 KB |
| `icon-192.png` | 39,450 B | 49,422 B | +10.0 KB |
| `icon-512.png` | 179,094 B | 252,363 B | +73.3 KB |
| `favicon-32.png` | 1,491 B | 8,013 B | **+6.5 KB (5.4×)** |

Total +93.5 KB across four files, none of them precached, all fetched once per client per cache generation. Not a cold-install cost. The `favicon-32` multiple is large in ratio and trivial in bytes; noted so it is not discovered later and read as damage.

---

## 4 · The five questions — OWNER'S GO REQUIRED BEFORE PHASE 1

### Q1 · Naming: rename the incoming files onto the paths the code already uses?

Four of six incoming names match the code; two do not (`phantom-icon-192/512` vs `icon-192/512`). §4.2 states the preferred outcome is zero HTML/manifest edits, and §2 forbids renaming code references to match staging names without reporting first — this is that report.

**Recommendation: rename the two incoming files onto `icon-192.png` and `icon-512.png`.** Phase 1 then copies six files over five existing paths and edits **no HTML and no manifest at all**; the only source edits in the entire ship are the three version stamps. Blast radius drops to the asset bytes themselves.

### Q2 · `favicon-16.png` — no incoming replacement exists

Referenced twice (`dct-ios.html:28`, `manifest.json:12`). The incoming set has a 32 but no 16, so after Phase 1 the 16 px tab icon is the **only surviving piece of the old identity in the browser tab**. Three ways:

- **(a) Leave it.** Zero edits, zero risk. Browsers on retina displays pick the 32; a non-retina tab shows old art at 16 px. The mismatch is real and nearly invisible.
- **(b) Drop both references.** One edit in each file; the browser downscales the 32. Cleanest identity, and it is two deletions rather than new art.
- **(c) Generate one.** A mechanical box-filter downscale of the approved 1024 master to 16×16 in pure Node — no `sharp` on this box, and none needed. It is a resample of owner-approved art, not new art, but it is still a file this repo produced rather than one web-Claude shipped.

**Recommendation: (b).** A 16 px favicon is a legacy slot, the 32 covers it everywhere that matters, and deleting two lines beats carrying a stale asset or minting one.

### Q3 · `icon-512-maskable.png` — no incoming replacement, and the new 512 must not be used for it

`manifest.json:17` declares `purpose: "maskable"`. The current maskable file is **opaque**, which is what maskable requires: the platform crops it to a circle/squircle and anything transparent at the edge becomes empty. **The incoming 512 is 56 % transparent with 100 % transparent edges**, so pointing this entry at it would render the ghost shrunken inside an empty mask on any Android/Chrome install. The handoff predicted exactly this and asked for a flag.

- **(a) Leave the entry on the existing opaque art.** Zero edits, zero regression. One manifest entry keeps the old ghost — invisible on iOS, which never uses `maskable`.
- **(b) Drop the maskable entry.** One deletion. Honest for an iOS-first field tool that is never installed from Chrome.
- **(c) Point it at the new 512.** ⛔ **Do not.** It is the only option that produces a visibly wrong icon.

**Recommendation: (a) this ship, (b) as a one-line follow-up if you want the entry gone.** PHANTOM installs on iPhone and iPad; no fleet device consumes a maskable icon, so (a) costs nothing real and needs no edit. A correct replacement needs a safe-zone-padded master nobody has produced.

### Q4 · `phantom-ghost-256.webp` — referenced by nothing

Grepped across `dct-ios.html`, `sw.js`, `manifest.json`, `forge.html`, `index.html`: **zero references.** The handoff calls it "in-app use per icon doctrine" without naming a target. The nearby ghost assets are `phantom-ghost-v2.webp` and `phantom-ghost-v3.webp` — **both frozen boot-sequence art, explicitly out of scope in §1** — and an orphaned `ghost.webp` that nothing references either.

**Recommendation: do not add it.** Copying an unreferenced 19.6 KB asset into the repo creates a new orphan on a ship whose door ledger is 0/0. If it is meant to replace something, name the target and it lands in that ship instead.

### Q5 · `phantom-icon-1024.png` — master source, referenced by nothing

No code path wants a 1024. It is the master the other sizes came from.

**Recommendation: do not add it to the repo root**, where it would be served by Pages and staging and fetched by nobody, for 816 KB. If you want the master under version control, `docs/assets/` or a `masters/` folder is the place, and that is its own small decision — not this ship.

---

## 5 · What Phase 1 becomes if every recommendation is taken

One ship, one visible change, and the smallest possible diff:

1. Copy four files onto four existing paths: `apple-touch-icon.png`, `icon-192.png` (renamed from `phantom-icon-192.png`), `icon-512.png` (renamed from `phantom-icon-512.png`), `favicon-32.png`.
2. Delete `favicon-16.png` and its two references (Q2b) — the only HTML/manifest edits in the ship.
3. Leave `icon-512-maskable.png` untouched (Q3a).
4. Bump the three stamps: `dct-ios.html` / `sw.js` / `version.json`. The `CACHE_VERSION` bump is what evicts the old icons from every installed client's runtime cache.
5. Delete `icons/incoming/`.
6. Gates: the resolve script (0 unresolved), zero `icons/incoming/` references, three stamps agreeing, and the Playwright suite on `phone-webkit` with no new failures against the current baseline.

**Device check is §5's, unchanged, and its third item is the honest one:** iOS caches the home-screen icon at install time, so the installed PHANTOM keeps the old art until it is removed and re-added — which clears that install's data. The staging icon is the safer place to look, since it was just re-added and holds no real work.

## 6 · Not done, deliberately

No file copied onto a referenced path · no HTML, manifest or `sw.js` edit · no version bump · nothing deleted · `icons/incoming/` staged but untracked · the boot ghost sequence, the nav icons, the BUILD banner and the OPS wall art untouched and unexamined beyond confirming they are not in the reference set.

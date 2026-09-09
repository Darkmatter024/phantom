# INFRA — A SERVED SURFACE FOR `main` (Cloudflare Pages staging)

**Written:** 2026-09-09 · **Ruling:** `OWNER-RULINGS.md` 2026-09-09 PROMOTE ORDER — *verify → stamp → promote is canonical, not runnable until `main` has a served surface* · **Owner:** John runs these; Claude Code cannot (Cloudflare account, no API token in this repo).
**This is not an app ship.** No `dct-ios.html` change, no version bump, nothing in `VERIFIED`. GitHub Pages keeps serving `release`, untouched. What changes is that every push to `main` also appears at a staging URL, so the phone can see a version before it is promoted.

---

## 0 · Pre-checks already done from the repo (2026-09-09)

| Question | Answer | Where |
|---|---|---|
| Does anything assume the `/phantom/` subpath GitHub Pages uses? | **No.** `start_url` is `./dct-ios.html`; the SW registers as `./sw.js`; `PRECACHE_URLS` are all relative; zero `'/phantom/'` literals in the app. Serving `main` at the **root** of a `*.pages.dev` origin runs the bytes unchanged. | `manifest.json:5` · `dct-ios.html:12962` · `sw.js:41` |
| Where does the AI proxy allow origins? | In the **Cloudflare Worker** (`phantom-api.wfj6t2fk7w.workers.dev`, `dct-ios.html:18212`), not in this repo. Until the staging origin is allowed there, the API dot on staging reads red and DIAGNOSTICS logs the CORS refusal — harmless to a verify, misleading to read. | step 6 |
| Is the service worker a problem on a second origin? | No. A different origin gets its own SW registration and its own cache; the `CACHE_VERSION` logic is per origin. | `sw.js:37` |
| Is the data a problem on a second origin? | **It is a different device as far as storage goes.** The staging PWA has its own empty `localStorage` and IndexedDB. Your real data stays in the release PWA. Load a Master on staging once; it persists there. | — |

## 1 · Steps (Cloudflare dashboard, once)

1. **Workers & Pages → Create → Pages → Connect to Git → GitHub → `Darkmatter024/phantom`.** Authorise the Cloudflare GitHub app for that repo if asked.
2. **Project name:** `phantom-staging`. The URL becomes `https://phantom-staging.pages.dev`. Any name works; record the one you choose.
3. **Production branch:** `main`. **Framework preset:** None. **Build command:** leave empty. **Build output directory:** `/` (the repo root). **Root directory:** `/`.
4. **Save and Deploy.** When the first deployment finishes, open `https://<project>.pages.dev/version.json` — it must read `main`'s version (`phantom-v1.14.585` today).
5. **Settings → Builds & deployments → Preview deployments → None.** Otherwise every other branch (`redesign/*`, `fix/*`) would also deploy at `<branch>.<project>.pages.dev`. Only `main` should be served.
6. **The Worker's CORS allowlist** (Workers & Pages → `phantom-api` → its source or environment variable, wherever the allowed origins are kept): add `https://<project>.pages.dev`. Reload staging; SYS → the API dot reads green.
7. **On the iPhone:** Safari → `https://<project>.pages.dev/dct-ios.html` → Share → **Add to Home Screen** → name it **PHANTOM STAGING** so it can never be mistaken for the release app. Open it once, load a Master.
8. **Tell me the URL.** Nothing else is needed from you for the tools to follow.

## 2 · Done when

- A push to `main` shows at `https://<project>.pages.dev/version.json` within a few minutes, and GitHub Pages still serves `release`.
- The phone has two icons: PHANTOM (release, graduated) and PHANTOM STAGING (main, verify surface).
- No other branch is served.

## 3 · What follows, on my side (script-only ship, gated on step 8)

- `tools/verify.ps1`: NOT-SERVED checks `origin/main` carries the version and `HEAD == origin/main`; SERVED-BYTES reads the **staging** URL; the PASS path stamps and pushes `main`, **does not promote**, and prints `.\tools\promote.ps1` for you. FAIL unchanged.
- `tools/promote.ps1` Guard 4: the **incoming** version must be adjudicated in `VERIFIED` — the original semantics, now executable. `release` means graduated.
- `tools/verify-selftest.ps1` follows (its live fixture pins to the staging URL).
- `CLAUDE.md` ship loop and `PHANTOM_CURRENT_STATE.md` §7 rewritten to verify → stamp → promote; the evidence checklists point the phone at staging.
- Until then, nothing after `.585` ships: the tools would refuse correctly and the doctrine would be wrong.

## 4 · What could go wrong

- **Wrong output directory** → the deploy serves a 404 at `/dct-ios.html`. Fix: output `/`, no build command.
- **Preview deployments left on** → other branches served; harmless but confusing, and a stale `redesign/*` could be mistaken for `main`.
- **CORS not updated** → AI features fail on staging only; DIAGNOSTICS shows the refusal. Not a verify blocker; do step 6 before relying on the API dot.
- **Testing on the wrong icon** → the staging PWA holds different data. The icon name is the guard.

## 5 · Outcome — 2026-09-09, staging is live

**URL of record:** `https://phantom-staging.wfj6t2fk7w.workers.dev` — **workers.dev, not pages.dev.** Cloudflare
built it as a **Worker with static assets** (the dashboard's current shape for a Git-connected static site),
production branch `main`, preview branches none. Owner-created. The `phantom-api` Worker's CORS allowlist is at
**v2.3** with this origin added and deployed; the owner reports the SYS badge normal on staging.

**Measured from this box, 2026-09-09 (D-1: origin → served → then the claim):**

| Check | Result |
|---|---|
| `version.json`, `sw.js`, `dct-ios.html`, `manifest.json`, `index.html` on staging vs `origin/main` (f5ab630) | **byte-identical**, all five |
| `version.json` on staging | `phantom-v1.14.585`, `Cache-Control: public, max-age=0, must-revalidate`, no redirect |
| GitHub Pages `version.json` vs `origin/release` (f95ece0) | **byte-identical**, still `phantom-v1.14.585` — release untouched |
| `/dct-ios.html` on staging | **307 → `/dct-ios`** (also `/index.html` → `/`, and `?legacy` survives the redirect). Bytes after the redirect are identical to `main`. |

✅ **The `.html` → extensionless 307 is CLOSED — `64e6cf8`, owner GO 2026-09-09 ("html_handling none via
wrangler.jsonc, no version bump").** It was Workers static assets' default `html_handling: "auto-trailing-slash"`,
not anything in the repo. `wrangler.jsonc` at the repo root now pins the Worker: `name phantom-staging` (it is
the workers.dev hostname), `assets.directory ./`, `html_handling none`, `not_found_handling none`. `.assetsignore`
keeps `.git/`, `node_modules/` and the gitignored local tooling out of the upload; `.gitattributes` pins that file
to LF because wrangler splits it on bare LF and a CRLF copy ignores nothing (measured: the first local dry-run
walked all 6,441 files under `.git`; with LF, 8,635 of 9,086 entries ignored). Why the redirect mattered: the
service worker precaches `'dct-ios.html'` through a redirect as a response flagged `redirected`, which browsers
reject for an offline navigation, so the staging icon could have failed to boot offline where the release icon
does not.

**Measured after the rebuild, staging at `64e6cf8` (2026-09-09):**

| Path | Before | After |
|---|---|---|
| `/dct-ios.html` · `/dct-ios.html?legacy` · `/index.html` | 307 | **200, no redirect** — parity with Pages |
| `/dct-ios` | 200 (the redirect target) | 404 — as on Pages |
| `/` | 200 (index.html) | **404** — see the lead below |
| `/.git/HEAD` · `/.git/config` · `/.assetsignore` | — | 404 — nothing under `.git` was uploaded |
| `/wrangler.jsonc` · `/tools/verify.ps1` | — | 200, byte-identical to `origin/main` — the build is from the new commit |
| `version.json` · `sw.js` · `dct-ios.html` · `manifest.json` · `index.html` vs `origin/main` | identical | identical |
| GitHub Pages | `.585`, `origin/release` f95ece0 | unchanged |

⚠ **New lead from the same measurement: the bare root `/` is 404 on staging.** With `html_handling: none`
nothing maps `/` to `index.html`, whereas Pages renders the landing at `/phantom/`. No verify path uses the root:
the icon opens `/dct-ios.html`, the QR helper builds absolute URLs, the service worker's offline root fallback is
its own cache. If root parity is wanted, the exact fix is a one-line `_redirects` at the repo root —
`/ /index.html 200` — a rewrite, not a redirect, inert on Pages. **Ruled 2026-09-09, owner verbatim:** *"Skip the
_redirects file — no verify path uses the root and I'd rather keep staging simple."* **Closed; the root stays 404.**

✅ **The PHANTOM STAGING icon** had been added while `/dct-ios.html` still redirected; the owner re-added it from
`https://phantom-staging.wfj6t2fk7w.workers.dev/dct-ios.html` after the fix and reports it loading fine (2026-09-09).
A re-add is a fresh install (iOS deletes a removed web app's storage), so the Master was loaded again.

**Tools follow the surface — landed the same day** (the script-only ship this doc's §3 promised):
`tools/verify.ps1` NOT-SERVED reads `origin/main` and requires `HEAD == origin/main`; SERVED-BYTES reads the
staging `version.json`; the PASS path stamps, pushes `main`, does **not** promote and prints the promote line;
`tools/promote.ps1` Guard 4 requires the **incoming** version adjudicated and never promotes FAILED;
`tools/verify-selftest.ps1` proves both in a throwaway clone (T4b, T7a–c added); `CLAUDE.md`'s ship loop reads
build → check staging on device → verify → promote.

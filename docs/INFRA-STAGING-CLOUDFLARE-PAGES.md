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

⚠ **The `.html` → extensionless 307 is a lead, not a defect proven on a phone.** It is Workers static assets'
default `html_handling: "auto-trailing-slash"`, not anything in the repo. `version.json` is unaffected, so
`tools/verify.ps1` reads it directly. What it *could* affect, unmeasured: the service worker precaches
`'dct-ios.html'` via `cache.addAll`, which follows the redirect and stores a response flagged `redirected`; a
navigation answered offline from that entry is rejected by browsers as a redirected response to a
non-`follow` request. **So offline boot of the PHANTOM STAGING icon may fail where the PHANTOM icon's does
not.** Only an offline-behaviour look on staging would hit it; version verifies do not. **Fix, when wanted,
is infra-side:** `html_handling: "none"` on the Worker's assets config (dashboard, or a `wrangler.jsonc` at the
repo root — the latter is a repo change and needs a GO). Owner's call; parked here.

**Tools follow the surface — landed the same day** (the script-only ship this doc's §3 promised):
`tools/verify.ps1` NOT-SERVED reads `origin/main` and requires `HEAD == origin/main`; SERVED-BYTES reads the
staging `version.json`; the PASS path stamps, pushes `main`, does **not** promote and prints the promote line;
`tools/promote.ps1` Guard 4 requires the **incoming** version adjudicated and never promotes FAILED;
`tools/verify-selftest.ps1` proves both in a throwaway clone (T4b, T7a–c added); `CLAUDE.md`'s ship loop reads
build → check staging on device → verify → promote.

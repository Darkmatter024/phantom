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

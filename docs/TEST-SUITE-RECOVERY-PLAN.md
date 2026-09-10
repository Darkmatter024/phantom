# Test Suite Recovery Plan — breaking the verification loop

## Why today stalled

The defect only appears with **accumulated state across a long serial run**. Proving it therefore requires a full 430-test single-process run. That run doesn't fit in available memory, so the worker dies partway through. When it restarts, the target tests execute in a **fresh worker** — which is the isolation condition where they already passed before any change was made.

Result: every verification attempt destroys the exact condition it is trying to verify. The output isn't "failed," it's "not proven," so it invites a rerun. That's the loop.

Two independent problems got tangled together:

| Problem | Nature |
|---|---|
| Rack-pose nondeterminism under accumulated state | The actual defect |
| Runs can't complete in available memory | The thing preventing verification |

Neither can be solved while they're entangled. **Separate them, then fix the smaller one first.**

---

## Step 0 — Commit the proven fix (do this before anything else)

The `siteLead` test re-point ran as test 140 inside shard 1 and finished clean. That is proven. Nothing is committed, so a crash, a bad reap, or an editor mishap loses it.

```bash
git add -p                      # stage the siteLead re-point only
git commit -m "test: re-point siteLead spec (verified clean in shard 1, test 140)"
```

Then isolate the unproven work so it can't be lost or confused with proven work:

```bash
git stash push -m "rack-pose determinism fix — UNPROVEN" -- <paths>
# or
git switch -c rack-pose-determinism
```

**Rule from here on: proven and unproven changes never share a working tree.**

---

## Step 1 — Shrink the repro (this is the actual unlock)

Do not keep trying to verify against 430 tests. Find the **minimal ordered subset** that reproduces the nondeterminism. Verification then takes minutes instead of an hour, fits in memory, and runs on the laptop.

### Bisect on test order

The defect is order- and accumulation-dependent, so bisect the **prefix**, not the file set.

1. Confirm the failure with the target spec at the end of the full serial list. That's the known-bad baseline.
2. Cut the prefix in half. Run: first half of the specs, then the target spec.
3. Fails → keep that half, halve again. Passes → the trigger is in the other half.
4. Repeat until you have the smallest prefix that still produces the defect.

Roughly 9 iterations for 430 tests. Even at a few minutes each, that's one afternoon **once** — and then every future verification is fast.

```bash
# Serial, deterministic, explicit order, fail fast
npx playwright test <prefix-specs...> <target-spec> \
  --workers=1 \
  --reporter=list \
  --max-failures=1
```

Verify empirically that the runner honors the order you pass (`--reporter=list` shows execution order). If it re-sorts, force ordering with a single serial describe block or a generated spec list, and confirm before trusting bisect results.

### Confirm it's real, not flaky

Once you have a candidate minimal repro, run it repeatedly:

```bash
npx playwright test <minimal-set> --workers=1 --repeat-each=5
```

- Fails 5/5 → deterministic repro. This is now your regression test.
- Fails 2/5 → still flaky; the prefix is incomplete or there's a second variable (timing, GPU state, network).

**Deliverable of this step:** a named, committed repro — e.g. `specs/repro/rack-pose-accumulation.spec.ts` — that fails reliably in under five minutes.

---

## Step 2 — Treat the memory growth as a bug, not an environment nuisance

A WebKit GPU process growing past 1.5 GB during a long run is a leak. Contexts, pages, or GPU surfaces are not being released between tests.

This matters more than it looks: **the leak and the defect may be the same root cause.** Both are "state accumulates across a serial run and changes behavior." Do not assume they're unrelated until you've checked.

Instrument it:

```js
// in a global afterEach or a fixture
if (test.info().workerIndex === 0) {
  const m = process.memoryUsage();
  console.log(`[mem] ${test.info().title} rss=${(m.rss/1e6).toFixed(0)}MB`);
}
```

Log RSS per test and plot it. What you're looking for:

- **Smooth linear climb** → a per-test leak. Find the missing teardown.
- **Step change at a specific test** → that test leaks. It may also be your trigger.
- **Climb that correlates with the failure point** → the leak *is* the defect mechanism. Fix it and both problems close.

Common culprits: browser contexts created but never closed, pages left open on failure paths, listeners accumulating on a shared context, video/trace artifacts retained in memory.

### While you're still running locally

```bash
# Reap orphans before every run — stopped runs leave browsers alive
pkill -f "chrome-for-testing|chromium|webkit" || true

# Reduce the GPU surface footprint
npx playwright test --workers=1 --trace off --video off
```

Closing Chrome buys you one attempt. It is not a fix and it is not repeatable.

---

## Step 3 — Move the full 430-test run off the laptop

A serial full-suite run is a CI job. It should not be competing with a browser, an editor, and a mail client for 3 GB.

- Single serial job: `--workers=1`, no sharding. **A shard boundary destroys accumulated state, so a sharded run can never prove or disprove this defect.**
- Give it real memory headroom — target at least 8 GB free for the run.
- Publish artifacts: per-test RSS log, trace on failure, full `--reporter=list` output.
- Trigger it on push to the fix branch, so verification happens while you work on something else.

The laptop runs the minimal repro. CI runs the full suite. Neither blocks the other.

---

## Step 4 — Evidence standard

Any claim of "fixed" must state the conditions, because those conditions are the entire question here.

| Claim | Required evidence |
|---|---|
| `siteLead` re-point | ✅ Ran as test 140 in shard 1, finished clean — **proven** |
| Minimal repro is valid | Fails ≥5/5 runs before the fix, in a single process |
| Rack-pose determinism fixed | Same minimal repro passes ≥5/5 after the fix |
| No regression | Full 430-test single-process CI run, one worker, no shard boundary, no worker restart |

Anything that ran in a fresh worker after a crash proves nothing about accumulated state. Record the worker restart in the result, or the number is misleading.

---

## Order of operations

1. Commit the siteLead re-point. **Now.**
2. Isolate the unproven rack-pose work on its own branch.
3. Bisect to a minimal ordered repro. Commit it as a permanent regression test.
4. Instrument per-test RSS. Check whether the leak and the defect share a root cause.
5. Fix against the minimal repro — fast loop, laptop is fine.
6. Full serial run in CI, single worker, no sharding, for the regression proof.

The change that ends the all-day loop is **step 3**. Everything before it is protecting work already done; everything after it is fast.

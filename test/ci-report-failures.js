#!/usr/bin/env node
//
// ci-report-failures.js — emit each failing test as a GitHub annotation, by NAME.
//
// ⛔ WHY THIS EXISTS. The full-serial job wrote its failure names to $GITHUB_STEP_SUMMARY and to an
// uploaded artifact. Both are readable by a human with the repo open, and NEITHER is reachable
// without authentication — the artifact download returns 401 and the job log needs admin. So the
// one question the job exists to answer, "WHICH tests failed", could not be answered from outside
// the browser. That matters because PLAYWRIGHT-BASELINE.md's rule is explicit: compare BY NAME, not
// by count — "4 failed matching this list is clean; 4 failed with a different member is a
// regression wearing the right number." A count alone cannot distinguish those, and this job was
// only ever emitting a count anywhere a tool could read it.
//
// ::error:: annotations ARE publicly readable (check-runs API), so the names go there.
//
// ⚠ IT READS THE JSON REPORT, NOT THE LIST OUTPUT, and that is deliberate. A sibling gate in this
// repo was written twice against the list reporter and was wrong both times — once accepting a
// SKIPPED test because a skipped test still prints its own title, once demanding the literal marker
// "ok", which Playwright prints only on win32 ("✓" everywhere else), so it passed on the laptop and
// failed on Linux while every test passed. Outcomes are data; read them as data.
//
// USAGE
//   node ci-report-failures.js <report.json>
// Always exits 0: this REPORTS, it does not gate. The job's verdict comes from the run's own exit
// code, so a reporting bug must never turn a red run green or a green run red.

const fs = require('fs');

const reportPath = process.argv[2];
if (!reportPath) {
  console.log('::warning::ci-report-failures.js called with no report path');
  process.exit(0);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (e) {
  // Loud, but not fatal — see the exit-0 note above.
  console.log(`::error::could not read the Playwright JSON report at ${reportPath}: ${e.message}`);
  process.exit(0);
}

/** Flatten the nested suite tree into rows carrying file, line and outcome. */
const rows = [];
(function walk(suites, file) {
  for (const suite of suites || []) {
    const f = suite.file || file;
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) {
        rows.push({
          file: spec.file || f || '?',
          line: spec.line || 0,
          title: spec.title,
          status: t.status,          // expected | unexpected | flaky | skipped
          project: (t.projectName || ''),
        });
      }
    }
    walk(suite.suites, f);
  }
})(report.suites);

const failed = rows.filter((r) => r.status === 'unexpected');
const flaky = rows.filter((r) => r.status === 'flaky');
const skipped = rows.filter((r) => r.status === 'skipped');
const passed = rows.filter((r) => r.status === 'expected');

// ⭐ THE LINE A BASELINE COMPARISON ACTUALLY NEEDS: file:line, which is how
// docs/PLAYWRIGHT-BASELINE.md names its four. Title alone is not enough — two specs can share one.
for (const r of failed) {
  const where = `${r.file}:${r.line}`;
  console.log(`::error::FAILED ${where} — ${r.title}`);
}
for (const r of flaky) {
  console.log(`::warning::FLAKY ${r.file}:${r.line} — ${r.title}`);
}

// One compact, greppable roll-up so a reader gets the shape without expanding anything.
console.log(`::notice::RESULT passed=${passed.length} failed=${failed.length} flaky=${flaky.length} skipped=${skipped.length} total=${rows.length}`);
if (failed.length) {
  console.log(`::notice::FAILING SET ${failed.map((r) => `${r.file}:${r.line}`).sort().join(' ')}`);
} else {
  console.log('::notice::FAILING SET (none)');
}

// Also to stdout, for the artifact and for anyone reading the log directly.
console.log('');
console.log(`passed=${passed.length} failed=${failed.length} flaky=${flaky.length} skipped=${skipped.length} total=${rows.length}`);
for (const r of failed) console.log(`FAILED  ${r.file}:${r.line}  ${r.title}`);
for (const r of flaky) console.log(`FLAKY   ${r.file}:${r.line}  ${r.title}`);

process.exit(0);

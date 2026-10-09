#!/usr/bin/env node
//
// ci-assert-ran.js — assert that named tests actually PASSED in a Playwright JSON report.
//
// ⛔ WHY THIS EXISTS, AND WHY IT IS NOT A grep.
// The sw-https job's whole purpose is that it cannot report a vacuous green: 05-offline's
// service-worker registration test SELF-SKIPS when the origin is not https, so if the TLS
// listener ever stopped coming up, that test would skip, everything else would still pass, and
// the job would certify the service-worker path while never having executed it.
//
// That check was written twice as a grep over the list reporter's human output, and it was wrong
// both times:
//   1. It asked whether a test avoided appearing as SKIPPED, and separately whether a title string
//      appeared ANYWHERE in the log. A skipped test prints its own title, so a guard that never
//      ran satisfied the second check completely.
//   2. Rewritten to demand the line "  ok  N ... <title>", it then failed on CI while every test
//      passed — because Playwright's list reporter prints "ok" only on win32 and "✓" everywhere
//      else. The check was matching a cosmetic detail of a human-readable format.
//
// The JSON reporter states the outcome as data: status is "expected" (passed), "unexpected"
// (failed), "flaky", or "skipped". That is what a gate should read. No markers, no column
// alignment, no platform branches.
//
// USAGE
//   node ci-assert-ran.js <report.json> "<title substring>" ["<title substring>" ...]
// Exits 0 only when EVERY named test is present exactly once and its status is "expected".

const fs = require('fs');

const [reportPath, ...required] = process.argv.slice(2);

if (!reportPath || required.length === 0) {
  console.error('usage: node ci-assert-ran.js <report.json> "<title substring>" [...]');
  process.exit(2);
}

let report;
try {
  report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (e) {
  // ⛔ A missing or unparseable report is a FAILURE, never a pass. If the run died before the
  // reporter wrote anything, the gate must say so rather than find nothing to complain about.
  console.error(`::error::could not read the Playwright JSON report at ${reportPath}: ${e.message}`);
  process.exit(1);
}

/** Flatten the nested suite tree into {title, status} rows. */
const rows = [];
(function walk(suites) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const t of spec.tests || []) rows.push({ title: spec.title, status: t.status });
    }
    walk(suite.suites);
  }
})(report.suites);

if (rows.length === 0) {
  console.error('::error::the Playwright JSON report contains no tests at all.');
  process.exit(1);
}

let failed = 0;
for (const needle of required) {
  const hits = rows.filter((r) => r.title.includes(needle));

  if (hits.length === 0) {
    console.error(`::error::no test matching "${needle}" ran at all — so this run proves nothing about it.`);
    failed = 1;
    continue;
  }
  // Ambiguity is a failure too: if a substring matches two tests, the gate is not asserting what
  // its author thinks it is asserting.
  if (hits.length > 1) {
    console.error(`::error::"${needle}" matched ${hits.length} tests; the assertion is ambiguous: `
      + hits.map((h) => JSON.stringify(h.title)).join(', '));
    failed = 1;
    continue;
  }

  const { title, status } = hits[0];
  if (status !== 'expected') {
    console.error(`::error::"${title}" did not pass — status "${status}". `
      + (status === 'skipped'
        ? 'It SKIPPED, which means the condition it guards was never actually exercised.'
        : 'Read the run log.'));
    failed = 1;
    continue;
  }
  console.log(`PASSED: ${title}`);
}

process.exit(failed);

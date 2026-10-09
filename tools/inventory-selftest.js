'use strict';
/*
 * inventory-selftest.js — machine-checked proof for tools/inventory.js's own
 * FIXTURE VERIFICATION comment.
 *
 * WHAT THIS IS FOR
 * inventory.js's whole thesis is "don't trust a number you can't re-derive."
 * Its header comment used to assert, by hand, that eight known failure
 * classes each trip a named fixture when reintroduced — a claim nobody
 * re-checked after the day it was typed. This script re-derives it: for
 * each of the eight classes, it reintroduces the exact historical bug into
 * a THROWAWAY COPY of inventory.js's source (never the real file), points
 * that copy at the REAL dct-ios.html (never a mock), runs it with `node`,
 * and asserts that (a) it exits non-zero, (b) it prints nothing to stdout —
 * the fixture gate must emit zero results, not a plausible wrong one — and
 * (c) the fixture name(s) that should have caught the bug appear in stderr.
 *
 * HOW TO RUN
 *   node tools/inventory-selftest.js
 * Exits 0 if all eight classes are caught, 1 with a report naming which
 * class(es) failed to be caught. Re-run this whenever CHANNELS, the
 * tokenizer, or the scope indexer in inventory.js changes.
 *
 * VERIFYING THIS SCRIPT ISN'T VACUOUS
 * Pass an alternate path to a (deliberately broken) copy of inventory.js's
 * source as argv[2], e.g.:
 *   node tools/inventory-selftest.js C:\path\to\a-neutered-copy.js
 * That copy is used as the BASE the eight bug-patches are applied on top
 * of — if one of its fixtures has been neutered, the corresponding class
 * will correctly report as NOT CAUGHT and the script exits 1. Never point
 * this at the real tools/inventory.js when doing that — use a scratch copy.
 *
 * CONSTRAINTS THIS SCRIPT HONORS
 * Node built-ins only (fs, path, os, child_process — child_process is a
 * test-harness allowance, not something the shipped tool may use). It never
 * writes to the real tools/inventory.js or the real dct-ios.html; every
 * patched variant is written to its own fs.mkdtempSync() directory and
 * deleted immediately after it runs.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const cp = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const REAL_TARGET = path.join(REPO_ROOT, 'dct-ios.html');
const DEFAULT_BASE = path.join(__dirname, 'inventory.js');
const BASE_TOOL_PATH = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_BASE;

// The one piece of harness plumbing applied to every variant, on top of the
// base source, before any bug-patch: repoint TARGET at the real dct-ios.html
// by absolute path, since the throwaway copy does not live at
// tools/inventory.js and `path.join(__dirname, '..', 'dct-ios.html')` would
// resolve relative to the temp directory instead.
function pointAtRealTarget(src) {
  const from = "const TARGET = path.join(__dirname, '..', 'dct-ios.html');";
  const hits = src.split(from).length - 1;
  if (hits !== 1) {
    throw new Error('harness: expected exactly 1 occurrence of the TARGET line in ' +
      BASE_TOOL_PATH + ', found ' + hits + ' — inventory.js plumbing changed; update this harness');
  }
  return src.replace(from, 'const TARGET = ' + JSON.stringify(REAL_TARGET) + ';');
}

function applyPatches(src, patches, label) {
  let out = src;
  patches.forEach(function (p, i) {
    const hits = out.split(p.from).length - 1;
    if (hits !== 1) {
      throw new Error('harness: patch ' + (i + 1) + ' for "' + label + '" expected exactly 1 occurrence ' +
        'of its `from` string in the current source, found ' + hits + ' — derive it again from the file, do not guess');
    }
    out = out.replace(p.from, p.to);
  });
  return out;
}

// The eight known failure classes. Each `from` string is copied verbatim
// from the current tools/inventory.js — if the file changes shape, a patch
// will fail to apply (hits !== 1) rather than silently patching the wrong
// thing or silently patching nothing.
const CLASSES = [
  {
    id: 1,
    desc: 'substring trap — emitters() replaced with a naive whole-file regex count',
    expect: ['rd-row-has-no-emitters'],
    patches: [{
      from: 'function emitters(tokens, cls) { return tokens.counts[cls] || 0; }',
      to: "function emitters(tokens, cls) { var __src = fs.readFileSync(TARGET, 'utf8'); var __re = new RegExp(cls, 'g'); return (__src.match(__re) || []).length; }"
    }]
  },
  {
    id: 2,
    desc: 'all-zeros instrument — buildClassTokens() returns empty maps',
    expect: ['dl-chip-is-live', 'tile-is-live'],
    patches: [{
      from: '  return { counts: counts, samples: samples, dynamic: dynamic, dynamicTokens: dynamicTokens };',
      to: '  return { counts: {}, samples: {}, dynamic: 0, dynamicTokens: {} };'
    }]
  },
  {
    id: 3,
    desc: 'unterminated scope attribution — buildScopeIndex() pop loop disabled',
    expect: ['sw_pillTap-span', 'scopeOf-boundary-past-sw_pillTap', 'sw_pillTap-has-no-color-refs'],
    patches: [{
      from: '    while (stack.length && depth <= stack[stack.length - 1].base) {',
      to: '    while (false && stack.length && depth <= stack[stack.length - 1].base) {'
    }]
  },
  {
    id: 4,
    desc: 'column-anchored fn detection — ^\\s* narrowed back to ^',
    expect: ['indented-fn-logCrash-is-scoped', 'indented-fn-logo_goHome-is-scoped'],
    patches: [{
      from: '    const m = l.match(/^\\s*(?:async\\s+)?function\\s+([A-Za-z_$][\\w$]*)/);',
      to: '    const m = l.match(/^(?:async\\s+)?function\\s+([A-Za-z_$][\\w$]*)/);'
    }]
  },
  {
    id: 5,
    desc: 'neon-token collision — (?=[\\s,)]) lookahead reverted to \\b on red and green',
    expect: ['channels-reject-neon-variants'],
    patches: [
      {
        from: '  red: /var\\(--red(?=[\\s,)])|#ff453a|#ff3b30|#ff2d55|#ff5a4d|rgba\\(\\s*255,\\s*(69|45|59)\\s*,/i,',
        to: '  red: /var\\(--red\\b|#ff453a|#ff3b30|#ff2d55|#ff5a4d|rgba\\(\\s*255,\\s*(69|45|59)\\s*,/i,'
      },
      {
        from: '  green: /var\\(--green(?=[\\s,)])|#30d158|#34c759|#32d74b|rgba\\(\\s*(48|52|50),\\s*(209|199|215)\\s*,/i',
        to: '  green: /var\\(--green\\b|#30d158|#34c759|#32d74b|rgba\\(\\s*(48|52|50),\\s*(209|199|215)\\s*,/i'
      }
    ]
  },
  {
    id: 6,
    desc: 'evidence truncation — sanctioned() evidence reverted to a column-0 slice(0, 110)',
    expect: ['sanctioned-evidence-shows-its-marker'],
    patches: [{
      from: 'function evidenceForPattern(line, re) {\n  const t = line.trim();\n  const m = t.match(re);\n  return sliceAround(t, (m && m.index !== undefined) ? m.index : 0);\n}',
      to: 'function evidenceForPattern(line, re) {\n  const t = line.trim();\n  return t.slice(0, 110);\n}'
    }]
  },
  {
    id: 7,
    desc: "dynamic-attribute harvesting — old /[\\s+'\"]+/ split restored, JS identifiers become class tokens",
    expect: ['dynamic-class-attrs-excluded-from-tokens'],
    patches: [{
      from: "    if (/\\+|\\$\\{|['\"]/.test(v)) {\n      dynamic++;\n      const seen = Object.create(null);\n      v.split(/[\\s+'\"]+/).forEach(function (t) {\n        if (!t || seen[t]) return;\n        seen[t] = true;\n        dynamicTokens[t] = (dynamicTokens[t] || 0) + 1;\n      });\n      continue;\n    }\n    v.split(/\\s+/).forEach(function (t) {",
      to: "    v.split(/[\\s+'\"]+/).forEach(function (t) {"
    }]
  },
  {
    id: 8,
    desc: "dropped exit site — exitLines() filter narrowed to return fewer than 2",
    expect: ['exit-has-two-code-sites'],
    patches: [{
      from: 'function exitLines(ctx) {\n  const out = [];\n  for (let i = 0; i < ctx.lines.length; i++) {\n    if (/#rd-exit/.test(ctx.lines[i]) && CHANNELS.red.test(ctx.lines[i])) out.push(i + 1);\n  }\n  return out;\n}',
      to: 'function exitLines(ctx) {\n  const out = [];\n  for (let i = 0; i < ctx.lines.length; i++) {\n    if (/#rd-exit/.test(ctx.lines[i]) && CHANNELS.red.test(ctx.lines[i])) out.push(i + 1);\n  }\n  return out.slice(0, 1);\n}'
    }]
  }
];

// Run a patched source as a real child `node` process. Uses a subcommand
// (`sanctioned`) that always prints real rows when fixtures pass, so an
// uncaught bug is visible as BOTH exit 0 AND non-empty stdout — not just
// one weaker signal.
function runVariant(src) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'inventory-selftest-'));
  const file = path.join(dir, 'inventory.js');
  try {
    fs.writeFileSync(file, src, 'utf8');
    return cp.spawnSync(process.execPath, [file, 'sanctioned'], { encoding: 'utf8' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function main() {
  let baseSrc;
  try {
    baseSrc = fs.readFileSync(BASE_TOOL_PATH, 'utf8');
  } catch (e) {
    console.error('inventory-selftest: cannot read base tool ' + BASE_TOOL_PATH + ': ' + e.message);
    process.exit(1);
  }

  let pointed;
  try {
    pointed = pointAtRealTarget(baseSrc);
  } catch (e) {
    console.error('inventory-selftest: ' + e.message);
    process.exit(1);
  }

  console.log('inventory-selftest: base tool = ' + BASE_TOOL_PATH);
  console.log('inventory-selftest: target    = ' + REAL_TARGET);
  console.log('');

  let anyFail = false;

  CLASSES.forEach(function (cls) {
    const tag = '[' + cls.id + '/' + CLASSES.length + ']';
    let patched;
    try {
      patched = applyPatches(pointed, cls.patches, cls.desc);
    } catch (e) {
      anyFail = true;
      console.log(tag + ' FAIL — could not apply patch');
      console.log('  ' + cls.desc);
      console.log('  ' + e.message);
      console.log('');
      return;
    }

    const r = runVariant(patched);
    if (r.error) {
      anyFail = true;
      console.log(tag + ' FAIL — could not run patched variant: ' + r.error.message);
      console.log('');
      return;
    }

    const stdout = r.stdout || '';
    const stderr = r.stderr || '';
    const exitNonZero = r.status !== 0;
    const stdoutEmpty = stdout === '';
    const missingNames = cls.expect.filter(function (name) { return stderr.indexOf(name) === -1; });
    const ok = exitNonZero && stdoutEmpty && missingNames.length === 0;

    if (ok) {
      console.log(tag + ' PASS — ' + cls.desc);
      console.log('  caught by: ' + cls.expect.join(', '));
    } else {
      anyFail = true;
      console.log(tag + ' FAIL — ' + cls.desc);
      console.log('  expected: exit != 0, stdout empty, stderr containing: ' + cls.expect.join(', '));
      console.log('  actual:   exit=' + r.status + ' stdout=' + JSON.stringify(stdout.slice(0, 200)) +
        (missingNames.length ? ' missing-from-stderr=' + missingNames.join(', ') : ''));
      if (stderr) console.log('  stderr:   ' + stderr.trim().split('\n').join('\n            '));
    }
    console.log('');
  });

  if (anyFail) {
    console.error('inventory-selftest: FAILED — not every known failure class is caught. See FAIL entries above.');
    process.exit(1);
  }
  console.log('inventory-selftest: PASSED — all ' + CLASSES.length + ' known failure classes are caught.');
  process.exit(0);
}

main();

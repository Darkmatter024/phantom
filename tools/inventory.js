'use strict';
// FIXTURE VERIFICATION - this tool's whole thesis is "don't trust a number
// you can't re-derive." That used to stop at the tool's own boundary: this
// comment asserted, by hand, that each known failure class trips a named
// fixture - a claim nothing machine-checked after the day it was written.
//
// It is now machine-checked. Run:
//   node tools/inventory-selftest.js
// It reintroduces each of the eight known failure classes into a throwaway
// copy of this file's source (never this file, never dct-ios.html), runs
// that copy against the REAL dct-ios.html, and asserts the expected
// fixture(s) fail loudly with zero emitted results. Re-run it whenever
// CHANNELS, the tokenizer, or the scope indexer changes - that is the point
// of having it.
//
// NO fixture may contain a hard-coded dct-ios.html line number: the file
// ships daily and a single inserted line must never brick every subcommand,
// nor produce a failure indistinguishable from real corruption. Every
// fixture here is content-derived via spanOf()/exitLines()/dynamicTokens,
// never a pinned line.
const fs = require('fs'), path = require('path');
const TARGET = path.join(__dirname, '..', 'dct-ios.html');

function loadTarget() {
  let src;
  try { src = fs.readFileSync(TARGET, 'utf8'); }
  catch (e) { console.error('inventory: cannot read ' + TARGET + ': ' + e.message); process.exit(1); }
  const lines = src.split(/\r?\n/);
  return { src: src, lines: lines, tokens: buildClassTokens(src), scopes: buildScopeIndex(lines) };
}

function rootHas(src, name) {
  const blocks = src.match(/:root\s*\{([\s\S]*?)\}/g);
  if (!blocks) return false;
  const content = blocks.map(function (b) { return b.match(/:root\s*\{([\s\S]*?)\}/)[1]; }).join(' ');
  return new RegExp('(^|[;\\s])' + name + '\\s*:').test(content);
}

// Tokenise EVERY class attribute once. Never a regex per class - that is
// what produced two false inventories (rd- matches inside card-/board-).
// counts/samples/dynamicTokens are Object.create(null): a bare {} answers
// emitters('constructor')/('toString')/('hasOwnProperty') with the inherited
// Object.prototype function instead of 0 - a prototype-key leak, not a real
// class occurrence.
//
// A class attribute built by JS concatenation (class="foo' + bar + '") is
// NOT split into the main `counts` map - splitting on the old /[\s+'"]+/
// pattern harvested the JS variable names themselves (bar, ok, lit, ...) as
// if they were class tokens, producing false LIVE verdicts with zero real
// static occurrences. Any value containing '+', '${', or an embedded quote
// is counted into `dynamic` instead and left unresolved there: the tool
// cannot see through string concatenation, and must say so rather than
// guess.
//
// It DOES, separately, record which literal fragments appear inside each
// dynamic attribute (dynamicTokens) - using that same split pattern, but
// only to answer "is this name sitting unresolved in a dynamic attribute",
// never to promote a fragment into the LIVE counts above. This is the fact
// that closes the false-lead in emitters' own CLI note: a token can be
// UNPROVEN in `counts` and simultaneously explained by dynamicTokens.
function buildClassTokens(src) {
  const counts = Object.create(null);
  const samples = Object.create(null);
  const dynamicTokens = Object.create(null);
  let dynamic = 0;
  const re = /class\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const v = m[2] !== undefined ? m[2] : m[3];
    if (/\+|\$\{|['"]/.test(v)) {
      dynamic++;
      const seen = Object.create(null);
      v.split(/[\s+'"]+/).forEach(function (t) {
        if (!t || seen[t]) return;
        seen[t] = true;
        dynamicTokens[t] = (dynamicTokens[t] || 0) + 1;
      });
      continue;
    }
    v.split(/\s+/).forEach(function (t) {
      if (!t) return;
      counts[t] = (counts[t] || 0) + 1;
      if (!samples[t]) samples[t] = 'class="' + v + '"';
    });
  }
  return { counts: counts, samples: samples, dynamic: dynamic, dynamicTokens: dynamicTokens };
}

// Detect functions at ANY indentation, and track nesting with a stack so an
// inner function's closing brace cannot close its parent. Each frame records
// the brace depth it opened at; it closes when depth returns to that base.
function buildScopeIndex(lines) {
  const out = [];
  const stack = [];
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const m = l.match(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/);
    if (m) stack.push({ name: m[1], start: i + 1, base: depth, end: -1 });
    depth += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
    while (stack.length && depth <= stack[stack.length - 1].base) {
      const f = stack.pop();
      f.end = i + 1;
      out.push(f);
    }
  }
  while (stack.length) { const f = stack.pop(); f.end = lines.length; out.push(f); }
  return out.sort(function (a, b) { return a.start - b.start; });
}

// First-match-by-start silently guesses when a name is ambiguous - 10 name
// groups in this file's scope index have 2-3 frames sharing a name. spanOf
// is load-bearing for the sw_pillTap/logCrash/logo_goHome fixtures, so an
// ambiguous name must fail loudly, never resolve to "whichever came first".
function spanOf(index, name) {
  let found = null, count = 0;
  for (let i = 0; i < index.length; i++) {
    if (index[i].name === name) { count++; if (found === null) found = index[i]; }
  }
  if (count > 1) throw new Error('spanOf: "' + name + '" is ambiguous (' + count + ' matches) - refusing to guess');
  return found;
}

// Innermost enclosing function wins - the one with the LATEST start that still
// contains the line. Without this, a nested line reports its outer function.
function scopeOf(index, line) {
  let best = null;
  for (let i = 0; i < index.length; i++) {
    const f = index[i];
    if (line >= f.start && line <= f.end) {
      if (best === null || f.start > best.start) best = f;
    }
  }
  return best === null ? '(markup)' : best.name + '()';
}

function emitters(tokens, cls) { return tokens.counts[cls] || 0; }

const CHANNELS = {
  red: /var\(--red(?=[\s,)])|#ff453a|#ff3b30|#ff2d55|#ff5a4d|rgba\(\s*255,\s*(69|45|59)\s*,/i,
  green: /var\(--green(?=[\s,)])|#30d158|#34c759|#32d74b|rgba\(\s*(48|52|50),\s*(209|199|215)\s*,/i
};

// Shared window: 30 chars of lead-in, 110 total, '...' when clipped on the left.
function sliceAround(t, idx) {
  const start = Math.max(0, idx - 30);
  return (start > 0 ? '...' : '') + t.slice(start, start + 110);
}

// Centre the window on an arbitrary marker - used where the thing that must be
// visible is not the colour but the reason the row was selected.
function evidenceForPattern(line, re) {
  const t = line.trim();
  const m = t.match(re);
  return sliceAround(t, (m && m.index !== undefined) ? m.index : 0);
}

// Centre the evidence window on the actual match. A fixed slice from column 0
// silently omits the match on long lines, leaving a real row with unrelated
// evidence - the exact "looks right, is wrong" failure this tool exists to stop.
function evidenceFor(line, ch) {
  const t = line.trim();
  let idx = -1;
  if (ch === 'red' || ch === 'both') {
    const m = t.match(CHANNELS.red);
    if (m && m.index !== undefined) idx = m.index;
  }
  if (ch === 'green' || ch === 'both') {
    const m = t.match(CHANNELS.green);
    if (m && m.index !== undefined && (idx < 0 || m.index < idx)) idx = m.index;
  }
  return sliceAround(t, idx < 0 ? 0 : idx);
}

function colorRefs(ctx, opts) {
  const above = opts.above || 0, want = opts.channel || 'all', rows = [];
  for (let i = 0; i < ctx.lines.length; i++) {
    const n = i + 1;
    if (n < above) continue;
    const l = ctx.lines[i];
    const r = CHANNELS.red.test(l), g = CHANNELS.green.test(l);
    if (!r && !g) continue;
    const ch = r && g ? 'both' : (r ? 'red' : 'green');
    if (want !== 'all' && ch !== want && ch !== 'both') continue;
    rows.push({ line: n, channel: ch, scope: scopeOf(ctx.scopes, n), evidence: evidenceFor(l, ch) });
  }
  return rows;
}

function colorRefsIn(ctx, from, to) {
  return colorRefs(ctx, { above: from }).filter(function (r) { return r.line <= to; }).length;
}

// Derived from the file, never remembered. EXIT and BLAST are owner-sanctioned red.
function exitLines(ctx) {
  const out = [];
  for (let i = 0; i < ctx.lines.length; i++) {
    if (/#rd-exit/.test(ctx.lines[i]) && CHANNELS.red.test(ctx.lines[i])) out.push(i + 1);
  }
  return out;
}

function sanctioned(ctx) {
  const rows = [];
  exitLines(ctx).forEach(function (n) {
    rows.push({ line: n, kind: 'EXIT', evidence: evidenceForPattern(ctx.lines[n - 1], /#rd-exit/) });
  });
  for (let i = 0; i < ctx.lines.length; i++) {
    const l = ctx.lines[i];
    if (/BLAST|blastradius/i.test(l) && CHANNELS.red.test(l)) {
      rows.push({ line: i + 1, kind: 'BLAST', evidence: evidenceForPattern(l, /BLAST|blastradius/i) });
    }
  }
  return rows.sort(function (a, b) { return a.line - b.line; });
}

const FIXTURES = [
  { name: 'root-defines-teal', run: function (ctx) {
      const a = rootHas(ctx.src, '--teal');
      return { ok: a === true, expected: 'true', actual: String(a) }; } },
  { name: 'root-omits-mag', run: function (ctx) {
      const a = rootHas(ctx.src, '--mag');
      return { ok: a === false, expected: 'false', actual: String(a) }; } },
  { name: 'rd-row-has-no-emitters', run: function (ctx) {
      const a = emitters(ctx.tokens, 'rd-row');
      return { ok: a === 0, expected: '0', actual: String(a) }; } },
  { name: 'dl-chip-is-live', run: function (ctx) {
      const a = emitters(ctx.tokens, 'dl-chip');
      return { ok: a > 0, expected: '> 0', actual: String(a) }; } },
  { name: 'tile-is-live', run: function (ctx) {
      const a = emitters(ctx.tokens, 'tile');
      return { ok: a > 0, expected: '> 0', actual: String(a) }; } },
  { name: 'sw_pillTap-span', run: function (ctx) {
      const s = spanOf(ctx.scopes, 'sw_pillTap');
      const len = s ? (s.end - s.start) : null;
      const ok = s !== null && len === 16;
      const a = s ? ('L' + s.start + '-L' + s.end + ' (length ' + len + ')') : 'not found';
      return { ok: ok, expected: 'span found, length 16', actual: a }; } },
  { name: 'scopeOf-boundary-past-sw_pillTap', run: function (ctx) {
      const s = spanOf(ctx.scopes, 'sw_pillTap');
      if (!s) return { ok: false, expected: 'sw_pillTap span found', actual: 'not found' };
      const atEnd = scopeOf(ctx.scopes, s.end);
      const pastEnd = scopeOf(ctx.scopes, s.end + 1);
      const ok = atEnd === 'sw_pillTap()' && pastEnd === '(markup)';
      return { ok: ok, expected: 'sw_pillTap() then (markup)', actual: atEnd + ' then ' + pastEnd }; } },
  { name: 'indented-fn-logCrash-is-scoped', run: function (ctx) {
      const s = spanOf(ctx.scopes, 'logCrash');
      const a = s ? scopeOf(ctx.scopes, s.start + 1) : 'not found';
      return { ok: s !== null && a === 'logCrash()', expected: 'logCrash()', actual: a }; } },
  { name: 'indented-fn-logo_goHome-is-scoped', run: function (ctx) {
      const s = spanOf(ctx.scopes, 'logo_goHome');
      const a = s ? scopeOf(ctx.scopes, s.start + 1) : 'not found';
      return { ok: s !== null && a === 'logo_goHome()', expected: 'logo_goHome()', actual: a }; } },
  { name: 'sw_pillTap-has-no-color-refs', run: function (ctx) {
      const s = spanOf(ctx.scopes, 'sw_pillTap');
      if (!s) return { ok: false, expected: 'sw_pillTap span found', actual: 'not found' };
      const a = colorRefsIn(ctx, s.start, s.end);
      return { ok: a === 0, expected: '0', actual: String(a) }; } },
  { name: 'channels-reject-neon-variants', run: function () {
      const ok = CHANNELS.green.test('color:var(--green-neon)') === false
              && CHANNELS.red.test('color:var(--red-neon)') === false
              && CHANNELS.green.test('color:var(--green)') === true
              && CHANNELS.red.test('color:var(--red, #ff453a)') === true;
      return { ok: ok, expected: 'true', actual: String(ok) }; } },
  { name: 'exit-has-two-code-sites', run: function (ctx) {
      const lns = exitLines(ctx);
      const bothMarked = lns.length > 0 && lns.every(function (n) { return /#rd-exit/.test(ctx.lines[n - 1]); });
      const ok = lns.length === 2 && bothMarked;
      return { ok: ok, expected: '2 code sites, both containing #rd-exit', actual: (lns.join(',') || '(none)') + ' | both marked: ' + bothMarked }; } },
  { name: 'sanctioned-evidence-shows-its-marker', run: function (ctx) {
      const rows = sanctioned(ctx);
      const bad = rows.filter(function (r) {
        return r.kind === 'BLAST' ? !/BLAST|blastradius/i.test(r.evidence)
                                  : r.evidence.indexOf('#rd-exit') < 0;
      });
      const a = bad.length === 0 ? 'all rows show their marker' : bad.map(function (r) { return 'L' + r.line; }).join(',');
      return { ok: bad.length === 0, expected: 'all rows show their marker', actual: a }; } },
  { name: 'spanOf-throws-on-ambiguous-name', run: function () {
      // Synthetic frames, not ctx.scopes: pinning this to a live function
      // name (the file used to be asserted against 'cleanup') silently
      // depends on dct-ios.html keeping >=2 same-named functions forever -
      // the exact family of content-dependence this tool exists to refuse.
      let threw = false;
      try { spanOf([{ name: 'x', start: 1, end: 2 }, { name: 'x', start: 5, end: 6 }], 'x'); }
      catch (e) { threw = true; }
      let singleOk = false;
      try {
        const s = spanOf([{ name: 'x', start: 1, end: 2 }], 'x');
        singleOk = s !== null && s.start === 1 && s.end === 2;
      } catch (e) { singleOk = false; }
      const ok = threw === true && singleOk === true;
      return { ok: ok, expected: 'ambiguous (2 frames) throws; unambiguous (1 frame) returns normally',
               actual: 'threw=' + threw + ' singleFrameOk=' + singleOk }; } },
  { name: 'dynamic-class-attrs-excluded-from-tokens', run: function (ctx) {
      const blocked = emitters(ctx.tokens, 'blocked');
      const dlChip = emitters(ctx.tokens, 'dl-chip');
      const ok = blocked === 0 && dlChip > 0;
      return { ok: ok, expected: 'blocked===0 (JS-harvested identifier) && dl-chip>0 (real static class)',
               actual: 'blocked=' + blocked + ' dl-chip=' + dlChip }; } },
  { name: 'chip-is-in-dynamic-set', run: function (ctx) {
      // dct-ios.html:19641 builds class="chip' + (fl ? ' flagged' : '') + '"
      // by JS concatenation. `chip` is real - the tokenizer just cannot
      // resolve it through the concatenation, and must say so by name
      // instead of burying it behind a generic "elsewhere" note.
      const a = ctx.tokens.dynamicTokens['chip'] || 0;
      return { ok: a > 0, expected: '> 0', actual: String(a) }; } }
];

function runFixtures(ctx) {
  const failures = [];
  FIXTURES.forEach(function (f) {
    let r;
    try { r = f.run(ctx); }
    catch (e) { r = { ok: false, expected: '(no throw)', actual: 'threw: ' + e.message }; }
    if (!r.ok) failures.push({ name: f.name, expected: r.expected, actual: r.actual });
  });
  return failures;
}

function main() {
  const ctx = loadTarget();
  const failures = runFixtures(ctx);
  if (failures.length) {
    console.error('inventory: FIXTURE FAILURE - refusing to emit results.');
    failures.forEach(function (f) {
      console.error('  ' + f.name + ': expected ' + f.expected + ', got ' + f.actual);
    });
    process.exit(1);
  }
  const cmd = process.argv[2];
  if (!cmd) { console.error('usage: inventory <emitters|colors|scope|sanctioned> [args]'); process.exit(2); }
  if (cmd === 'emitters') {
    const cls = process.argv[3];
    if (!cls) { console.error('usage: inventory emitters <class>'); process.exit(2); }
    const n = emitters(ctx.tokens, cls);
    const dynHits = ctx.tokens.dynamicTokens[cls] || 0;
    console.log((n > 0 ? 'LIVE' : 'UNPROVEN') + '  ' + cls + '  class-attr occurrences: ' + n);
    if (n > 0) {
      console.log('  evidence: ' + ctx.tokens.samples[cls]);
    }
    if (n === 0) {
      console.log('  NOTE: UNPROVEN is not a claim of unused. Classes toggled at');
      console.log('  runtime via classList.add never appear in a class="..." attribute.');
    }
    if (dynHits > 0) {
      // This is the specific fact, not the generic one: the tokenizer saw
      // `cls` sitting inside a JS-concatenated class attribute and can name
      // it, rather than steering the reader toward an unrelated "elsewhere".
      console.log('  NOTE: ' + cls + ' appears in ' + dynHits + ' dynamic (JS-built) attribute(s) — unresolved.');
    } else {
      console.log('  NOTE: ' + ctx.tokens.dynamic + ' class attribute(s) elsewhere are built by JS');
      console.log('  concatenation (contain +, ${, or an embedded quote) and cannot be resolved');
      console.log('  by static scan; their tokens are excluded from every count above, never guessed.');
    }
    process.exit(0);
  }
  if (cmd === 'scope') {
    const raw = process.argv[3];
    const n = parseInt(raw, 10);
    if (!raw || !/^\d+$/.test(raw) || n < 1 || n > ctx.lines.length) {
      console.error('usage: inventory scope <line> (1-' + ctx.lines.length + ')'); process.exit(2);
    }
    const label = scopeOf(ctx.scopes, n);
    console.log('L' + n + '  ' + label + '  |  ' + sliceAround((ctx.lines[n - 1] || '').trim(), 0));
    if (label === '(markup)') {
      console.log('  NOTE: (markup) means no `function NAME` declaration encloses this line.');
      console.log('  Arrow functions, class methods, and object-method shorthand are not');
      console.log('  detected - this is not proof the line sits outside any function.');
    }
    process.exit(0);
  }
  if (cmd === 'colors') {
    const opts = { above: 0, channel: 'all' };
    const usage = 'usage: inventory colors [--above N] [--channel red|green|all]';
    let bad = false;
    for (let i = 3; i < process.argv.length && !bad; i++) {
      const a = process.argv[i];
      if (a === '--above') {
        const v = process.argv[++i];
        if (!v || !/^\d+$/.test(v)) { bad = true; break; }
        opts.above = parseInt(v, 10);
      } else if (a === '--channel') {
        const v = process.argv[++i];
        if (v === undefined) { bad = true; break; }
        opts.channel = v;
      } else {
        bad = true;
      }
    }
    if (bad || ['red', 'green', 'all'].indexOf(opts.channel) === -1) {
      console.error(usage); process.exit(2);
    }
    const rows = colorRefs(ctx, opts);
    rows.forEach(function (r) {
      console.log('L' + String(r.line).padEnd(7) + r.channel.padEnd(6) +
        r.scope.padEnd(30) + r.evidence);
    });
    console.log('-- ' + rows.length + ' ref(s)');
    console.log('NOTE: the scope column only detects `function NAME` declarations; arrow');
    console.log('functions, class methods, and object-method shorthand report (markup) even');
    console.log('when the line is actually inside a function.');
    process.exit(0);
  }
  if (cmd === 'sanctioned') {
    const rows = sanctioned(ctx);
    rows.forEach(function (r) {
      console.log('L' + String(r.line).padEnd(7) + r.kind.padEnd(7) + r.evidence);
    });
    console.log('-- ' + rows.length + ' sanctioned site(s) - these must NEVER be retokenised');
    process.exit(0);
  }
  console.error('inventory: unknown subcommand "' + cmd + '"'); process.exit(2);
}

main();

// ─────────────────────────────────────────────────────────────────────────────
// 38 — THE CONTEXT ENGINE (v1.14.457, SHIP-CONTEXT-INJECT-369 V3 rescoped, ruling 2026-08-13)
//
// ⛔ WHY THIS SPEC EXISTS IN THIS SHAPE. The frozen spec described building a SiteProfile module on
// key `phantom_site_profile_v1` and wiring AI call sites to a single choke point. Both already
// existed — the key since the SITE-PROFILE workstream, the choke point as
// activeContext_getContextBlock(). The owner ruled to execute the INTENT against live code, so the
// contract under test is "buildContext WRAPS the existing door and adds the guarantees", not
// "a second door exists".
//
// ⭐ THE ASSERTIONS TARGET WHAT CAN SILENTLY ROT. A context builder fails quietly: it returns a
// string either way. So these test the properties that would otherwise only surface as a bad AI
// answer weeks later — the guard is present, unknown fields are ABSENT rather than blank,
// placeholder step text never reaches the model, and CHANGE has no path.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');
const { SITE_HOSTS_ROWS, CUTSHEET_ROWS } = require('./data/us-qrs03-rows');

const loadMaster = (page) => page.evaluate(async ({ H, C }) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(H), 'SITE-HOSTS');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(C), 'CUTSHEET');
  const site = await phantom_parseMaster(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }), { filename: 'CTX.xlsx' });
  PHANTOM_MASTER.replace(site);
}, { H: SITE_HOSTS_ROWS, C: CUTSHEET_ROWS });

test.describe('Context engine', () => {

  test('⛔ the honesty guard is always first and is never dropped', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      const bare = buildContext({ surface: 'test' });
      // A caller trying to blow the budget must not be able to push the guard out.
      const flooded = buildContext({ surface: 'test', extra: 'X'.repeat(200000) });
      return { bare, flooded, bareFirst: bare.indexOf('FACTS BELOW ARE FROM SITE RECORDS'), floodedFirst: flooded.indexOf('FACTS BELOW ARE FROM SITE RECORDS') };
    });
    expect(r.bareFirst, 'the honesty guard is missing from a bare context').toBe(0);
    expect(r.floodedFirst, 'a 200k-char extra pushed the honesty guard out of the prompt').toBe(0);
    expect(r.bare, 'the guard does not forbid invention').toContain('Do not invent hardware or job details not listed');
    expect(r.bare, 'the guard does not demand graded language').toContain('needs confirmation');
    expect(r.bare, 'the evidence rule is missing').toContain('name which context section it came from');
  });

  test('⛔ the token budget holds, and truncation happens at line boundaries', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      const lines = Array.from({ length: 400 }, (_, i) => `RECORD ${i}: some payload text for this record`).join('\n');
      const out = buildContext({ surface: 'test', extra: lines });
      const tail = out.split('\n').filter((l) => l.startsWith('RECORD '));
      return { tokens: ctx_tokens(out), out, lastLine: tail[tail.length - 1] || '', hasMarker: /\[\+\d+ more records omitted\]/.test(out) };
    });
    // The cap is approximate by design (chars/4); assert it is ENFORCED, with headroom for the
    // fixed guard text rather than a number tuned to today's wording.
    expect(r.tokens, `context ran to ${r.tokens} tokens against a ~2200 cap`).toBeLessThan(2600);
    expect(r.hasMarker, 'records were dropped SILENTLY — a truncated prompt must say so').toBe(true);
    // ⭐ The failure this pins: a prompt cut mid-record hands the model half a fact, which reads
    // as complete. Every surviving record line must be whole.
    expect(r.lastLine.endsWith('record'), `last kept record was cut mid-line: "${r.lastLine}"`).toBe(true);
  });

  test('⛔ CHANGE has no path, and READ is asserted at the choke point', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      const out = { permission: AI_PERMISSION, read: null, suggest: null, change: null };
      try { assertAIPermission('READ'); out.read = 'allowed'; } catch (e) { out.read = 'denied'; }
      try { assertAIPermission('SUGGEST'); out.suggest = 'allowed'; } catch (e) { out.suggest = 'denied'; }
      try { assertAIPermission('CHANGE'); out.change = 'allowed'; } catch (e) { out.change = 'denied'; }
      return out;
    });
    expect(r.permission, 'the app is not in READ tier').toBe('READ');
    expect(r.read, 'READ is denied — every AI call site would throw').toBe('allowed');
    expect(r.suggest, 'SUGGEST is permitted — no suggest-tier feature ships in this build').toBe('denied');
    expect(r.change, '⛔ CHANGE IS PERMITTED — AI output could reach a state-mutating path').toBe('denied');
  });

  test('unknown fields are ABSENT, not blank-stubbed', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => {
      const out = buildContext({ surface: 'test' });
      // The failure mode is a row like "LAST SCAN: " — which asserts the record exists and is
      // empty, a different and false claim from "PHANTOM does not track this".
      // ⚠ SCOPED TO FIELD LABELS. A first draft matched any /^[A-Z][A-Z /]+:\s*$/ and flagged
      // "JOB STATE:" — the section HEADER, which jobState_snapshot only emits when it has lines
      // to put under it. That was the assertion being wrong, not the app.
      const blank = JOBSTATE_FIELDS
        .map((f) => f.label)
        .filter((l) => new RegExp('^' + l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*$', 'm').test(out));
      return { out, blank };
    });
    expect(r.blank, `blank-stubbed field rows present: ${JSON.stringify(r.blank)}`).toEqual([]);
  });

  test('⛔ placeholder step text never reaches the model', async ({ phantom, page }) => {
    await phantom.boot();
    await loadMaster(page);
    const r = await page.evaluate(() => {
      // Seed a phase model so PHASE has something to report.
      try {
        if (typeof PHANTOM_PHASE_MODEL !== 'undefined') PHANTOM_PHASE_MODEL.forRack('s4:099', 'H100');
      } catch (_) {}
      return { out: buildContext({ surface: 'test', rackId: 's4:099' }), snap: jobState_snapshot('s4:099') };
    });
    // The step labels are literally "<PHASE> — step not yet defined for this site". Real
    // per-platform commissioning procedure is site knowledge the app does not have, so emitting
    // those labels would be fabricated procedure wearing a checklist.
    expect(r.out, '⛔ placeholder step text leaked into the AI context').not.toContain('step not yet defined');
    expect(r.snap, '⛔ placeholder step text leaked into the JobState snapshot').not.toContain('step not yet defined');
  });

  test('the JobState field registry carries a source for every field, and sources never ship to the model', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(() => ({
      fields: JOBSTATE_FIELDS.map((f) => ({ label: f.label, source: f.source, hasValue: typeof f.value === 'function' })),
      out: buildContext({ surface: 'test' }),
    }));
    expect(r.fields.length, 'the JobState registry is empty').toBeGreaterThan(0);
    for (const f of r.fields) {
      expect(f.source, `${f.label} has no declared source — §2.1 excludes unsourced fields`).toBeTruthy();
      expect(f.hasValue, `${f.label} has no resolver`).toBe(true);
      // §2.3: the source string is for the ship report and this file, never for the model.
      expect(r.out.includes(f.source), `the source string for ${f.label} reached the prompt`).toBe(false);
    }
    // ⭐ The owner ruling that named this field: counts are real, "BURNDOWN" is not a record.
    const labels = r.fields.map((f) => f.label);
    expect(labels, 'a BURNDOWN label reappeared — it is OPEN ISSUES / BLOCKERS').not.toContain('BURNDOWN');
    expect(labels).toContain('OPEN ISSUES / BLOCKERS');
  });

  test('⛔ no AI call site still bypasses the choke point', async ({ phantom, page }) => {
    await phantom.boot();
    // Every wired call site must route through buildContext. The old door survives only as
    // buildContext's own internal call — anything else is a bypass that skips the honesty guard
    // and the permission assert.
    const r = await page.evaluate(async () => {
      const html = await (await fetch('./dct-ios.html')).text();
      const src = html.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
      // ⚠ EXCLUDE THE DECLARATION. `function activeContext_getContextBlock()` matches the same
      // pattern as a call, and a first draft counted it as a bypass — the assertion was wrong, not
      // the code. Only real CALL sites count.
      const calls = (src.match(/(^|[^\w.])activeContext_getContextBlock\(\)/gm) || [])
        .filter((m) => !/function\s*$/.test(m.slice(0, -30)));
      const old = (src.match(/activeContext_getContextBlock\(\)/g) || []).length
                - (src.match(/function\s+activeContext_getContextBlock\(\)/g) || []).length;
      const wired = (src.match(/buildContext\(\{/g) || []).length;
      return { old, wired, calls: calls.length };
    });
    // ⚠ Comments are stripped before counting: an earlier spec in this repo went red because the
    // fix's own comment quoted the removed line. One legitimate CALL remains — inside buildContext.
    expect(r.old, `${r.old} calls to the old door survive; exactly 1 (buildContext's own) is correct`).toBe(1);
    expect(r.wired, 'call sites are not wired through buildContext').toBeGreaterThanOrEqual(7);
  });
});

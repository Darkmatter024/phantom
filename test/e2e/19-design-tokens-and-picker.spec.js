// ─────────────────────────────────────────────────────────────────────────────
// 19 — DESIGN TOKENS RESOLVE, AND THE LOADOUT PICKER PICKS
//
// BATCH-VERIFY item 9, automated (owner ruling 2026-08-10). Neither half needs iOS.
//
// WHY THE TOKEN CHECK IS THE RIGHT MECHANICAL HALF OF "reads as one system".
// CLAUDE.md contract 15: "Verify token NAMES against :root before use — an UNDEFINED var()
// invalidates the whole declaration SILENTLY." That is not hypothetical here. v1.14.237 shipped
// a CSS comment containing `/*/`, which closed early and swallowed the very next rule — the whole
// `#forge3d-sheet` token block. Every Forge token was undefined for two versions and it presented
// as "the badges look unstyled", sending the investigation into specificity in the wrong rule.
// Brace-balance passed. node --check does not read CSS. Nothing errored.
//
// So: a name that is REFERENCED but never DECLARED is the failure this test exists to catch, and
// it is invisible to every other gate in the project. Taste — whether five screens *read* as one
// system — stays the owner's call. This proves the substrate is intact, not that it looks right.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');
const fs = require('fs');
const path = require('path');

test.describe('the design-system substrate and the loadout picker', () => {

  test('EVERY design token referenced in CSS is actually declared somewhere', async ({ phantom, page }) => {
    test.setTimeout(120_000);
    await phantom.boot();

    const report = await page.evaluate(() => {
      const declared = new Set();
      const referenced = new Map();   // name -> first selector that uses it

      // ⚠ PER-RULE try/catch, not per-sheet. First version wrapped only the whole-sheet call, so a
      // single rule that threw silently abandoned the REST of that stylesheet — it reported
      // 2 sheets and 2 tokens against a file with 12 <style> blocks, i.e. a green-looking probe
      // that had walked almost nothing. A gate that under-reports is worse than no gate.
      let ruleErrors = 0;
      const walk = (rules) => {
        const list = Array.from(rules || []);
        for (let i = 0; i < list.length; i++) {
          const rule = list[i];
          try {
            if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules);
            const st = rule.style;
            if (!st) continue;
            for (let j = 0; j < st.length; j++) {
              const prop = st[j];
              if (prop && prop.indexOf('--') === 0) declared.add(prop.trim());
              const val = st.getPropertyValue(prop) || '';
              // Capture whether THIS use supplies a fallback. `var(--x, #fff)` degrades by design
              // and is not a defect; only a bare `var(--x)` can silently kill its declaration.
              const re = /var\(\s*(--[a-zA-Z0-9_-]+)\s*(,?)/g;
              let mm;
              while ((mm = re.exec(val)) !== null) {
                const name = mm[1];
                const bare = mm[2] !== ',';
                const prev = referenced.get(name);
                if (!prev) referenced.set(name, { selector: rule.selectorText || '(at-rule)', anyBare: bare });
                else if (bare) prev.anyBare = true;
              }
            }
          } catch (_) { ruleErrors++; }
        }
      };

      let sheets = 0;
      Array.from(document.styleSheets).forEach((s) => {
        let rules = null;
        try { rules = s.cssRules; } catch (_) { return; }   // cross-origin — none expected here
        if (!rules) return;
        sheets++;
        walk(rules);
      });

      // Also collect custom properties set INLINE on live elements — a token written by JS via
      // element.style.setProperty is genuinely declared, just not in a stylesheet.
      const inline = new Set();
      document.querySelectorAll('[style]').forEach((el) => {
        const st = el.style;
        for (let i = 0; i < st.length; i++) { const p = st[i]; if (p.indexOf('--') === 0) inline.add(p); }
      });

      const suspect = [];
      referenced.forEach((info, name) => {
        if (declared.has(name) || inline.has(name)) return;
        if (!info.anyBare) return;            // every use supplies a fallback → degrades by design
        suspect.push({ name, usedBy: String(info.selector).slice(0, 90) });
      });
      return { sheets, declared: declared.size, referenced: referenced.size, suspect, ruleErrors, inline: inline.size };
    });

    // FINAL CLASSIFICATION HAPPENS AGAINST THE SOURCE, not just the live CSSOM. A token written by
    // JS with setProperty is declared at runtime on an element that may not exist yet in this
    // fixture, so the DOM sweep above cannot see it. Subtracting those is the difference between a
    // gate that finds real dead declarations and one that cries wolf on every dynamic token.
    const appSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'dct-ios.html'), 'utf8');
    const jsSet = new Set();
    const setRe = /setProperty\(\s*['"](--[a-zA-Z0-9_-]+)['"]/g;
    let sm;
    while ((sm = setRe.exec(appSrc)) !== null) jsSet.add(sm[1]);

    const dead = report.suspect.filter((s) => !jsSet.has(s.name));

    console.log(`[19] ${report.sheets} sheet(s) · ${report.declared} declared · ${report.referenced} referenced · ` +
      `${report.inline} inline · ${jsSet.size} set by JS · ${report.ruleErrors} unreadable · ${dead.length} DEAD`);
    expect(report.sheets, 'no stylesheet was readable — the probe proved nothing').toBeGreaterThan(0);
    expect(report.declared, 'no custom properties found at all — the walk is broken, not the CSS').toBeGreaterThan(50);

    // An undefined var() invalidates its whole declaration in silence. This is the ONLY gate in
    // the project that can see that — brace balance passes, and node --check never reads CSS.
    // This gate found --alert dead on its first run: referenced bare by three declarations
    // (.bd-pri-btn.active[data-pri="P1"], .bd-pri-tag.P1, .bd-sla.overdue) and declared nowhere, so
    // a P1 tag and an OVERDUE SLA inherited the surrounding colour instead of alert red. It was
    // PINNED here as an exact list, reported, and the owner authorised the fix — `--alert: #ff3b3b`
    // now sits on :root at v1.14.428, taking the value from the fallback the author had already
    // written twice. The pin is gone rather than edited, and the assertion is back to EMPTY:
    // any dead token is now a failure, which is the state this gate is supposed to hold.
    expect(
      dead,
      'design tokens referenced with NO fallback, declared in no stylesheet, set on no element and ' +
      'never written by setProperty — every declaration using one is silently dead: ' +
      `${JSON.stringify(dead, null, 1)}`
    ).toEqual([]);
  });

  test('the FORGE token block specifically survives parsing — the .237 swallowed-rule guard', async ({ phantom, page }) => {
    await phantom.boot();
    // Raw-text presence proves nothing; ask the CSSOM whether the rule exists at all. This is the
    // exact probe that would have caught .237 on the day it shipped.
    const forge = await page.evaluate(() => {
      const out = { ruleFound: false, tokens: {} };
      for (const s of Array.from(document.styleSheets)) {
        let rules;
        try { rules = s.cssRules; } catch (_) { continue; }
        for (const r of Array.from(rules)) {
          if (r.selectorText && r.selectorText.indexOf('#forge3d-sheet') === 0 && r.style) {
            for (let i = 0; i < r.style.length; i++) {
              const p = r.style[i];
              if (p.startsWith('--')) { out.ruleFound = true; out.tokens[p] = r.style.getPropertyValue(p).trim(); }
            }
          }
        }
      }
      return out;
    });
    expect(forge.ruleFound, 'no #forge3d-sheet rule declares any custom property — the token block was eaten again').toBe(true);
    Object.keys(forge.tokens).forEach((k) => {
      expect(forge.tokens[k], `${k} is declared on #forge3d-sheet but resolves to empty`).not.toBe('');
    });
    console.log('[19] #forge3d-sheet tokens present: ' + Object.keys(forge.tokens).join(', '));
  });

  test('THE LOADOUT PICKER OPENS AND PICKS (.411)', async ({ phantom, page }) => {
    test.setTimeout(150_000);
    await phantom.boot();
    await page.evaluate(() => {
      const racks = {};
      for (let r = 1; r <= 12; r++) {
        const id = 'l1:' + String(r).padStart(3, '0');
        racks[id] = { cabId: id, locode: 'ALP-01', cablesOut: [], cablesIn: [], hosts: [
          { locCabRu: id + ':42', dns: id.replace(':', '-') + '-sw', model: 'SN2201', source: 'SITE_HOSTS' },
        ] };
      }
      PHANTOM_MASTER.replace({ racksByCab: racks, siteCode: 'ALP-01', sourceFile: 'PICK.xlsx',
        sourceFileHash: 'pick', stats: { sourceFileHash: 'pick', totalCables: 0 } });
      try { forge3d_open(); } catch (_) {}
    });
    await page.waitForFunction(() => {
      const s = document.getElementById('forge3d-sheet');
      return !!s && s.classList.contains('open');
    }, null, { timeout: 20_000 });

    // Through the real control, not a function call — the .411 defect was that a tap here hit the
    // wrong element entirely, so the tap path is the thing under test.
    await page.locator('#loadoutBtn').click();
    await expect(page.locator('#picker')).toHaveClass(/open/, { timeout: 10_000 });

    const rows = page.locator('#pickerList .pick');
    await expect(rows.first()).toBeVisible({ timeout: 10_000 });
    const before = await page.locator('#pickerCount').textContent();

    // Pick one, and require the count to actually MOVE. A picker that opens but does not register
    // a pick is a dead control that looks alive — the class this project keeps rediscovering.
    await rows.first().click();
    await expect
      .poll(async () => (await page.locator('#pickerCount').textContent()) || '',
        { timeout: 10_000, message: 'picking a rack did not change the loadout count' })
      .not.toBe(before);

    const sel = await page.locator('#pickerList .pick.sel').count();
    expect(sel, 'no row carries .sel after a pick — the selection did not stick').toBeGreaterThan(0);
    console.log(`[19] loadout count ${before} -> ${await page.locator('#pickerCount').textContent()}`);
  });
});

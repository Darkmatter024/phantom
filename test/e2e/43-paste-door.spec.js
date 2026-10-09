// 43 — THE PASTE DOOR. Reachability, not existence.
// ⛔ Two controls in this app have shipped present, wired, correct — and dead, measuring 0x0
// inside a display:none ancestor (the SHIFT pill, and the first re-home of it). Assert GEOMETRY
// and hit-testing, because "is it there and wired" passes straight through that defect.
//
// ⚠ THE DOOR IS A .pasterow ON WORK, NOT THE BRIEF'S TENTH ops-cell (owner ruling 2026-08-19).
// The OPS wall is a 3x3 of exactly nine whose banner reads "Nine tools on this build", and .bnr's
// own background is the missing-raster hatch, so an art-less banner would ship looking broken.
const { test, expect } = require('./fixtures');

// showMode('work') runs bw_render(), which paints #bw-shell — the surface Work actually shows.
// ⭐ HOW THE FIRST PLACEMENT WAS CAUGHT, worth keeping: the row measured 0x0 in #work-grid, and
// the SIBLINGS were measured before the markup was touched. All four shipped banners and the OPS
// row measured 0x0 too, which said "the container is hidden", not "this control is broken".
// Fixing the row on that first reading would have been a fix for nothing.
const openDoor = async (page) => {
  await page.evaluate(() => { if (typeof showMode === 'function') showMode('work'); });
  await page.waitForTimeout(2500);
};

test.describe('paste door', () => {

  test('⛔ the PASTE row is reachable on Work', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    const c = await page.evaluate(() => {
      const el = document.querySelector('.pasterow[data-oc="paste"]');
      if (!el) return { exists: false };
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
      return { exists: true, w: Math.round(r.width), h: Math.round(r.height),
               covered: hit ? !(hit === el || el.contains(hit)) : true,
               coveredBy: hit && !(hit === el || el.contains(hit)) ? (hit.id || hit.className) : null,
               // ⛔ It must live inside #bw-shell, the surface Work actually shows. The banner
               // stack in #work-grid is hidden by .bw-on from the first Work visit onward, so a
               // row there would pass "exists and wired" and still never be seen.
               inBwShell: !!el.closest('#bw-shell') };
    });
    expect(c.exists, 'no PASTE row on Work').toBe(true);
    expect(c.w, 'the PASTE row is 0px wide — unreachable').toBeGreaterThan(0);
    expect(c.h, `the PASTE row is ${c.h}px tall, under the 44px gloved floor`).toBeGreaterThanOrEqual(44);
    expect(c.covered, `the PASTE row is covered by ${c.coveredBy}`).toBe(false);
    expect(c.inBwShell, 'the PASTE row is outside #bw-shell — it would be hidden by .bw-on').toBe(true);
  });

  test('⛔ tapping the row actually opens the sheet', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    // ⭐ Assert the ROUND TRIP through a real click, not a direct rd_openPaste() call. Both
    // controls this app shipped dead were "wired correctly" — the handler was never the problem.
    await page.evaluate(() => document.querySelector('.pasterow[data-oc="paste"]').scrollIntoView({ block: 'center' }));
    await page.click('.pasterow[data-oc="paste"]');
    await page.waitForTimeout(300);
    const s = await page.evaluate(() => {
      const sheet = document.getElementById('rd-paste-sheet');
      const r = sheet ? sheet.getBoundingClientRect() : null;
      return { open: !!(sheet && sheet.className.indexOf('open') >= 0), h: r ? Math.round(r.height) : 0 };
    });
    expect(s.open, 'tapping PASTE did not open the sheet').toBe(true);
    expect(s.h, 'the sheet opened with no height').toBeGreaterThan(100);
  });

  test('the sheet opens with an empty, honest zero state', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    const s = await page.evaluate(() => {
      rd_openPaste();
      const sheet = document.getElementById('rd-paste-sheet');
      const r = sheet ? sheet.getBoundingClientRect() : null;
      return { open: !!(sheet && sheet.className.indexOf('open') >= 0), h: r ? Math.round(r.height) : 0,
               box: !!document.getElementById('paste-input'),
               actions: document.querySelectorAll('#paste-actions button').length,
               verdict: (document.getElementById('paste-verdict') || {}).textContent || '' };
    });
    expect(s.open, 'the paste sheet did not open').toBe(true);
    expect(s.h, 'the paste sheet rendered with no height').toBeGreaterThan(100);
    expect(s.box, 'there is no textarea to paste into').toBe(true);
    // ⛔ It must not claim a verdict, or offer a route, before anything has been pasted.
    expect(s.verdict).not.toMatch(/Looks like/i);
    expect(s.verdict, 'the zero state invented a caption').toBe('');
    expect(s.actions, 'the zero state offered a route with nothing pasted').toBe(0);
  });

  test('a recognised paste names the format and offers exactly one route', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    const r = await page.evaluate(async () => {
      rd_openPaste();
      const box = document.getElementById('paste-input');
      box.value = 'U1, 2U, PDU-A, PDU, Vertiv\nU3, 1U, SW-01, switch, Arista\nU4-U7, 4U, GPU-01, gpu, GB300';
      box.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((res) => setTimeout(res, 400));
      const acts = Array.from(document.querySelectorAll('#paste-actions button'));
      return { verdict: document.getElementById('paste-verdict').textContent,
               buttons: acts.map((b) => b.textContent.trim()),
               heights: acts.map((b) => Math.round(b.getBoundingClientRect().height)) };
    });
    expect(r.verdict).toMatch(/rack elevation/i);
    expect(r.buttons.length, 'a confident match should offer ONE route, not a menu').toBe(1);
    expect(r.buttons[0]).toMatch(/RACK MAP/i);
    for (const h of r.heights) expect(h, `route button is ${h}px tall`).toBeGreaterThanOrEqual(44);
  });

  test('⛔ an unrecognised paste says so and offers the doors', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    const r = await page.evaluate(async () => {
      rd_openPaste();
      const box = document.getElementById('paste-input');
      box.value = 'rack looks hot, check with Dave before EOD';
      box.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((res) => setTimeout(res, 400));
      const acts = Array.from(document.querySelectorAll('#paste-actions button'));
      return { verdict: document.getElementById('paste-verdict').textContent,
               count: acts.length,
               heights: acts.map((b) => Math.round(b.getBoundingClientRect().height)) };
    });
    expect(r.verdict, 'it claimed a format for free prose').not.toMatch(/Looks like/i);
    // ⚠ THERE ARE THREE HONEST UNKNOWN CAPTIONS, not one — the brief's regex assumed a single
    // message and failed against correct code. Round 3's structural gate says "That reads as
    // notes, not data." for prose, which is a BETTER answer for a technician than the generic
    // "Not a format PHANTOM recognises." — it names why. Assert the set, and assert none of them
    // claims a format.
    expect(r.verdict).toMatch(/not a format PHANTOM recognises|reads as notes, not data|not enough to go on/i);
    // Degrades to today's behaviour: pick a tool.
    expect(r.count, 'unknown should offer the tool list').toBeGreaterThanOrEqual(4);
    // ⛔ The gloved floor applies to the DEGRADED path too. A fallback that is hard to tap is
    // where a cold-aisle defect actually lands, because that is the path a bad paste takes.
    for (const h of r.heights) expect(h, `fallback door is ${h}px tall`).toBeGreaterThanOrEqual(44);
  });

  test('⛔ every offered route is a real door, and unknown routes nowhere', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    const d = await page.evaluate(() => ({
      keys: Object.keys(PASTE_TARGETS),
      // The shipped shape is {label, box, open}. ⚠ task-1-brief.md documents {label, tool, box};
      // the brief is wrong and reaching for .tool would toast "Unknown tool" on cli and edp.
      shapes: Object.keys(PASTE_TARGETS).map((k) => ({
        k, label: typeof PASTE_TARGETS[k].label, box: typeof PASTE_TARGETS[k].box,
        open: typeof PASTE_TARGETS[k].open,
      })),
      hasUnknown: Object.prototype.hasOwnProperty.call(PASTE_TARGETS, 'unknown'),
      dispatch: typeof paste_dispatch,
    }));
    expect(d.keys.sort()).toEqual(['bom', 'cli', 'edp', 'elevation', 'portmap']);
    expect(d.hasUnknown, 'unknown must NOT have a target — it routes nowhere').toBe(false);
    expect(d.dispatch, 'the action buttons have no dispatcher').toBe('function');
    for (const s of d.shapes) {
      expect(s.label, `${s.k}.label missing`).toBe('string');
      expect(s.box, `${s.k}.box missing`).toBe('string');
      expect(s.open, `${s.k}.open is not callable`).toBe('function');
    }
  });

  test('⛔ a tap cannot silently do nothing before routing is wired', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    // Task 3 defines paste_route. Until then the button must SAY it cannot route — Contract 14.
    // When Task 3 lands, this asserts the guard still fires on a build missing paste_route,
    // which is the state a partial deploy actually produces.
    const r = await page.evaluate(async () => {
      const warns = [];
      const orig = console.warn;
      console.warn = function () { warns.push(Array.prototype.join.call(arguments, ' ')); orig.apply(console, arguments); };
      const saved = window.paste_route;
      try {
        window.paste_route = undefined;
        rd_openPaste();
        const box = document.getElementById('paste-input');
        box.value = 'rack looks hot, check with Dave before EOD';
        box.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((res) => setTimeout(res, 300));
        document.querySelector('#paste-actions button').click();
        await new Promise((res) => setTimeout(res, 200));
      } finally {
        window.paste_route = saved;
        console.warn = orig;
      }
      return { warned: warns.some((w) => /paste_route is not defined/.test(w)) };
    });
    expect(r.warned, 'the button did nothing and said nothing').toBe(true);
  });
});

test.describe('paste routing', () => {

  test('routing lands in the target tool WITH the text', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    const r = await page.evaluate(async () => {
      const TEXT = 'U1, 2U, PDU-A, PDU, Vertiv\nU3, 1U, SW-01, switch, Arista';
      paste_route('elevation', TEXT);
      await new Promise((res) => setTimeout(res, 1500));
      const box = document.getElementById('rm-data-input');
      return { sheetClosed: (document.getElementById('rd-paste-sheet') || {}).className.indexOf('open') < 0,
               boxExists: !!box, boxValue: box ? box.value : null, pending: window._pastePending };
    });
    expect(r.boxExists, 'the destination box was never mounted').toBe(true);
    // ⭐ The whole point: the technician pastes ONCE.
    expect(r.boxValue, 'the text did not arrive in the destination box').toContain('PDU-A');
    expect(r.sheetClosed, 'the paste sheet stayed open over the tool').toBe(true);
    // ⛔ A pending value that lingers is a second source of truth.
    expect(r.pending, 'the pending handoff was not cleared after consumption').toBeFalsy();
  });

  test('⛔ a route that cannot complete says so instead of losing the paste', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const warns = [], toasts = [];
      const ow = console.warn; console.warn = function () { warns.push(Array.from(arguments).join(' ')); ow.apply(console, arguments); };
      const ot = window.phantomToast; window.phantomToast = function (m) { toasts.push(String(m)); };
      paste_route('portmap', 'A01 Eth1/1 → B04 Eth1/1');
      await new Promise((res) => setTimeout(res, 2500));
      console.warn = ow; window.phantomToast = ot;
      return { warns, toasts, pending: window._pastePending };
    });
    // Booted without entering Work, the destination box may not mount. Silence is the defect.
    // ⛔ v1.14.581 — A FOREIGN WARN IS NOT THIS ROUTE SPEAKING. The first cut treated ANY captured
    // warn as "the route said something", so a benign, unrelated `[OPS] no #bw-mount to anchor
    // below` (dct-ios.html:21886 — the CORRECT fallback when a host-less deployment renders no
    // rack preview) drifting into the 2.5s window flipped the guard on and then failed the match,
    // because that message is about Build, not about a paste. The app was right and the test was
    // measuring the wrong thing.
    // ⭐ ATTRIBUTION IS BY THE NAMESPACE THE CODE ALREADY USES, not by guesswork: every message
    // paste_route emits is a `[paste]`-prefixed warn (:32576, :32586, :32591, :32625) or a toast.
    const spoke = r.warns.filter((w) => /^\[paste\]/.test(w)).concat(r.toasts);
    const foreign = r.warns.filter((w) => !/^\[paste\]/.test(w));
    if (spoke.length) {
      // ⛔ THE REGEX NAMES THE ROUTE'S ACTUAL FAILURE VOCABULARY, not the `[paste]` prefix — that
      // would match the filter above and make this assertion vacuous, which is the trap the .573
      // test walked into (an assertion that can only pass proves nothing).
      expect(spoke.join(' '), `the route spoke but said nothing about why it could not complete. Foreign warns in window: ${JSON.stringify(foreign)}`)
        .toMatch(/no target|no tool|threw|declined|did not accept|unavailable/i);
    }
    expect(r.pending, 'a failed route left a stale pending handoff behind').toBeFalsy();
  });

  test('⛔ EDP declines without a deployment, and the sheet keeps the text', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    // ⭐ THE ONE TARGET WITH A PRECONDITION. vendorEdp_open never creates a deployment, so with
    // none active there is nothing to attach an EDP to. Declining must be AUDIBLE, and the paste
    // must survive it — a decline that closes the sheet would throw away the technician's text.
    const r = await page.evaluate(async () => {
      const toasts = [];
      const ot = window.phantomToast; window.phantomToast = function (m) { toasts.push(String(m)); };
      const savedDep = window.deploy_getActiveId;
      try {
        window.deploy_getActiveId = function () { return null; };
        rd_openPaste();
        document.getElementById('paste-input').value = 'KEEP THIS TEXT';
        paste_route('edp', 'KEEP THIS TEXT');
        await new Promise((res) => setTimeout(res, 400));
      } finally {
        window.deploy_getActiveId = savedDep;
        window.phantomToast = ot;
      }
      const sheet = document.getElementById('rd-paste-sheet');
      return { toasts, pending: window._pastePending,
               stillOpen: sheet.className.indexOf('open') >= 0,
               kept: document.getElementById('paste-input').value };
    });
    expect(r.toasts.join(' '), 'the decline was silent').toMatch(/deployment/i);
    expect(r.stillOpen, 'a declined route closed the sheet').toBe(true);
    expect(r.kept, 'a declined route threw away the paste').toBe('KEEP THIS TEXT');
    expect(r.pending, 'a declined route left a stale pending handoff').toBeFalsy();
  });

  test('⛔ overwriting a box that already had text is stated, not silent', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    // ⛔ CONTRACT 11. Routing into a box the technician already typed in is a legitimate overwrite
    // — they chose the destination — but the old content is gone and unrecoverable. The brief
    // wrote the value unconditionally, which is how half-finished work disappears with nothing on
    // screen to explain it.
    const r = await page.evaluate(async () => {
      paste_route('elevation', 'U1, 2U, PDU-A, PDU, Vertiv\nU3, 1U, SW-01, switch, Arista');
      await new Promise((res) => setTimeout(res, 1200));
      const box = document.getElementById('rm-data-input');
      box.value = 'half-typed work the tech has not finished';
      const toasts = [];
      const ot = window.phantomToast; window.phantomToast = function (m) { toasts.push(String(m)); };
      try {
        paste_route('elevation', 'U9, 1U, SW-99, switch, Arista\nU10, 1U, SW-98, switch, Arista');
        await new Promise((res) => setTimeout(res, 1200));
      } finally { window.phantomToast = ot; }
      return { toasts, value: document.getElementById('rm-data-input').value };
    });
    expect(r.value, 'the new text did not land').toContain('SW-99');
    expect(r.toasts.join(' '), 'the overwrite was silent').toMatch(/replaced/i);
  });

  test('⛔ routing an unknown verdict is refused, not guessed', async ({ phantom, page }) => {
    await phantom.boot();
    await openDoor(page);
    const r = await page.evaluate(async () => {
      const toasts = [];
      const ot = window.phantomToast; window.phantomToast = function (m) { toasts.push(String(m)); };
      try {
        paste_route('unknown', 'rack looks hot, check with Dave before EOD');
        await new Promise((res) => setTimeout(res, 300));
      } finally { window.phantomToast = ot; }
      return { toasts, pending: window._pastePending };
    });
    expect(r.toasts.join(' '), 'an unroutable verdict was silent').toMatch(/no tool/i);
    expect(r.pending, 'an unroutable verdict left a pending handoff').toBeFalsy();
  });
});

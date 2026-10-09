// ─────────────────────────────────────────────────────────────────────────────
// 62 — THE SEND-TIME IMAGE BUDGET (Phase 5)
//
// ⛔ WHAT THIS REPLACES. Phase 2 sized images against VA_IMAGE_BUDGET_BYTES, a fixed 180,000 chosen
// from a harness measurement where the system prompt was 4,300 bytes. In the field that prompt also
// carries buildContext, brief_buildLiveContext, hwMatrix_queryContext and a ticket capped at 12,000
// chars, so the constant was guaranteed to be wrong — too generous with a big Master loaded, too
// mean with none. phantomAPI (:18253) refuses an oversized body BEFORE the network, so being wrong
// in the generous direction means a technician's photo dies client-side with a toast about size.
//
// ⭐ NOW THE BUDGET IS MEASURED AGAINST THE ACTUAL REQUEST. va_imageBudgetFor() builds the real
// envelope with an EMPTY data field, measures it, and subtracts from PHANTOM_API_MAX_BODY; base64
// is 4/3 of raw, hence the 3/4. If the photo prepared at import no longer fits, it is re-prepared
// FROM THE ORIGINAL FILE — not from the already-lossy copy, which would throw away quality twice.
//
// ⛔ AND A SIZE REFUSAL IS NOT A NETWORK FAILURE. Without a named branch it would have surfaced as
// "Could not reach assistant", sending a technician to check their signal over a problem they can
// actually fix by clearing the attached ticket.
//
// RUN STANDALONE:
//   cd test && npx playwright test e2e/62-image-send-budget.spec.js --project=phone-webkit
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const PROXY = /phantom-api\.[a-z0-9]+\.workers\.dev/;

const MAKE = `
  window.__mk = function (w, h) {
    return new Promise(function (res) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d');
      x.fillStyle = '#123'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) {
        x.fillStyle = 'rgba(' + ((i*7)%255) + ',' + ((i*13)%255) + ',' + ((i*29)%255) + ',1)';
        x.fillRect((i*37)%w, (i*53)%h, 24, 24);
      }
      c.toBlob(function (b) { try { c.width = 0; c.height = 0; } catch (e) {} res(b); }, 'image/jpeg', 0.92);
    });
  };
  window.__attach = async function (w, h) {
    var blob = await window.__mk(w || 1400, h || 1050);
    var dt = new DataTransfer();
    dt.items.add(new File([blob], 'rack.jpg', { type: 'image/jpeg' }));
    var input = document.getElementById('vaTicketFile');
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    for (var i = 0; i < 80 && !(VA.image && VA.image.b64); i++) {
      await new Promise(function (r) { setTimeout(r, 100); });
    }
    return !!(VA.image && VA.image.b64);
  };
`;

async function stubAssistant(page) {
  const sent = [];
  await page.route(PROXY, (route) => {
    const req = route.request();
    if (req.method() !== 'POST') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
    }
    sent.push({ raw: req.postData() || '' });
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: JSON.stringify({ content: [{ type: 'text', text: 'Reseat the optic.' }] }),
    });
  });
  return sent;
}

async function ask(page, q) {
  await page.evaluate(() => setVaBody('composer'));
  await page.locator('#vaComposerTa').fill(q);
  await page.locator('.va-cask').click();
}

test.describe('send-time image budget', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(MAKE);
  });

  test('⛔ the budget tracks the REAL system prompt, not a constant', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => openVaSheet('intent'));
    expect(await page.evaluate(() => window.__attach(1400, 1050))).toBe(true);

    const r = await page.evaluate(() => {
      const small = va_imageBudgetFor('why?', 'S'.repeat(1000));
      const large = va_imageBudgetFor('why?', 'S'.repeat(60000));
      return { small, large, fixed: VA_IMAGE_BUDGET_BYTES, ceiling: PHANTOM_API_MAX_BODY };
    });

    // A 59,000-byte bigger prompt must cost the image ~59,000 * 3/4 of its allowance. A constant
    // cannot do that, which is the whole point of the change.
    expect(r.large, 'a larger system prompt did not shrink the image budget').toBeLessThan(r.small);
    expect(r.small - r.large,
      `the budget moved by ${r.small - r.large} bytes for a 59,000-byte prompt difference; it ` +
      `should be about 3/4 of that`).toBeGreaterThan(40000);
    // And it never exceeds what the ceiling can physically hold.
    expect(Math.ceil(r.small * 4 / 3)).toBeLessThanOrEqual(r.ceiling);
  });

  test('⛔ the sent body fits under PHANTOM_API_MAX_BODY, measured on the real request', async ({ phantom, page }) => {
    const sent = await stubAssistant(page);
    await phantom.boot();
    await page.evaluate(() => openVaSheet('intent'));
    expect(await page.evaluate(() => window.__attach(1600, 1200))).toBe(true);

    await ask(page, 'What is wrong with this rack?');
    await page.waitForFunction(() => !!document.querySelector('#vaBody .va-answer'), undefined, { timeout: 20_000 });

    const ceiling = await page.evaluate(() => PHANTOM_API_MAX_BODY);
    expect(sent.length).toBe(1);
    expect(sent[0].raw.length,
      `the request body is ${sent[0].raw.length} bytes against a ${ceiling} ceiling — phantomAPI ` +
      `would have refused it before the network`).toBeLessThanOrEqual(ceiling);
  });

  test('⛔ a huge system prompt RE-PREPARES the photo smaller rather than failing the send', async ({ phantom, page }) => {
    const sent = await stubAssistant(page);
    await phantom.boot();
    await page.evaluate(() => openVaSheet('intent'));
    expect(await page.evaluate(() => window.__attach(1600, 1200))).toBe(true);

    const r = await page.evaluate(async () => {
      const beforeBytes = VA.image.bytes;
      const warns = [];
      const orig = console.warn;
      console.warn = function () { warns.push(Array.from(arguments).join(' ')); orig.apply(console, arguments); };
      let content;
      try {
        // ⚠ SIZED BY MEASUREMENT, NOT BY GUESS. The first cut used 120,000 and failed — but the
        // code was right and the test was wrong: a 120,000-byte prompt still leaves a ~134,000-byte
        // budget, which the prepared photo already fit, so no re-prepare was DUE. Re-preparation
        // needs the prompt above ~134,300. 200,000 forces it while still leaving room for a lower
        // rung to land, which is the path under test here — the refusal path is the next test.
        content = await va_userContent('why is this down?', 'S'.repeat(200000));
      } finally { console.warn = orig; }
      return { beforeBytes, afterBytes: VA.image.bytes, isArray: Array.isArray(content), warns };
    });

    expect(r.isArray, 'the content is no longer an image block array').toBe(true);
    expect(r.afterBytes,
      `the photo was ${r.beforeBytes} bytes and stayed ${r.afterBytes} despite a 200,000-byte ` +
      `prompt — it was not re-prepared against the real budget`).toBeLessThan(r.beforeBytes);
    expect(r.warns.some((w) => /re-preparing photo for the real budget/i.test(w)),
      `the re-prepare was silent — got ${JSON.stringify(r.warns)}`).toBe(true);
  });

  test('⛔ when nothing can fit, the refusal names the CAUSE and keeps the photo', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => openVaSheet('intent'));
    expect(await page.evaluate(() => window.__attach(1400, 1050))).toBe(true);

    const r = await page.evaluate(async () => {
      // A prompt that consumes essentially the whole ceiling: no rung can fit beneath it.
      let threw = null;
      try { await va_userContent('why?', 'S'.repeat(299000)); }
      catch (e) { threw = e && e.message; }
      return { threw, stillAttached: !!(VA.image && VA.image.b64) };
    });

    expect(r.threw, 'an impossible budget did not refuse').toBe('IMAGE_TOO_BIG');
    // The photo stays attached so the technician can clear the ticket and retry, rather than
    // having to find and pick the photo again.
    expect(r.stillAttached, 'the refusal threw the photo away').toBe(true);
  });

  test('⛔ the refusal reads as a SIZE problem, not a network problem', async ({ phantom, page }) => {
    await stubAssistant(page);
    await phantom.boot();
    await page.evaluate(() => openVaSheet('intent'));
    expect(await page.evaluate(() => window.__attach(1400, 1050))).toBe(true);

    // Force the impossible case through the real ask path by making the ticket enormous: a ticket
    // is capped at 12,000 chars by va_ticketContext, so drive it through the context instead.
    await page.evaluate(() => {
      const orig = va_ticketContext;
      window.va_ticketContext = function () { return 'X'.repeat(299000); };
      VA.__origTicketContext = orig;
    });

    await ask(page, 'What is wrong here?');
    await expect(page.locator('#vaBody')).toContainText(/will not fit alongside/i, { timeout: 20_000 });
    // ⛔ The exact wording matters less than what it is NOT: a technician must not be sent to check
    // their signal over a problem they can fix by clearing the ticket.
    await expect(page.locator('#vaBody')).not.toContainText(/could not reach assistant/i);
  });
});

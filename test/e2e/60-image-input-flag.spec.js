// ─────────────────────────────────────────────────────────────────────────────
// 60 — IMAGE INPUT: THE FLAG AND THE BRANCH (Phase 3)
//
// FEATURE_IMAGE_INPUT ships OFF. This spec proves two separate things, and the second is the one
// the plan's anti-breakage contract actually rests on:
//
//   FLAG OFF  — the app is byte-identical to before Phase 3. 58-assistant-import-file.spec.js is
//               the tripwire for that and is re-run in CI as-is; the accept attribute is asserted
//               here too because it is the one string a reader can check by eye.
//   FLAG ON   — the image branch works AND the text path still behaves exactly as 58 pins it. A
//               branch that works but quietly changes the path beside it has broken the contract.
//
// ⚠ WHY THE FLAG IS FLIPPABLE FROM A TEST. It is declared `var`, not `const`, precisely so this
// file can run both states. The plan demands the characterization test pass with the flag off and
// on; a const would have made the second half unprovable, and an unprovable half of a contract is
// how "shipped dark" turns into "shipped unread". Every read of the flag is at call time — accept
// attribute at setVaBody('intent'), branch at import, content shape at ask — so flipping it at
// runtime exercises the same code a shipped flag would.
//
// ⛔ NO REAL NETWORK, and no real API spend: the proxy is stubbed and the request body captured,
// so the assertions are about the SHAPE the app actually sent.
//
// RUN STANDALONE:
//   cd test && npx playwright test e2e/60-image-input-flag.spec.js --project=phone-webkit
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const PROXY = /phantom-api\.[a-z0-9]+\.workers\.dev/;
const SENTINEL = 'ZQX-PHASE3-4412';
const ANSWER = 'The optic is seated incorrectly.';

/** In-page fixture builder: a noisy canvas, so JPEG cannot compress it to nothing. */
const MAKE = `
  window.__mk = function (w, h, type) {
    return new Promise(function (res) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d');
      x.fillStyle = '#123'; x.fillRect(0, 0, w, h);
      for (var i = 0; i < 900; i++) {
        x.fillStyle = 'rgba(' + ((i*7)%255) + ',' + ((i*13)%255) + ',' + ((i*29)%255) + ',1)';
        x.fillRect((i*37)%w, (i*53)%h, 24, 24);
      }
      c.toBlob(function (b) { try { c.width = 0; c.height = 0; } catch (e) {} res(b); }, type, 0.92);
    });
  };
`;

/** Only POSTs are asks — phantomCheckApi (:55894) OPTIONS the same URL on every boot. */
async function stubAssistant(page) {
  const sent = [];
  await page.route(PROXY, (route) => {
    const req = route.request();
    if (req.method() !== 'POST') {
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' }, body: '' });
    }
    let body = null;
    try { body = JSON.parse(req.postData() || 'null'); } catch (_) { body = null; }
    sent.push({ raw: req.postData() || '', body });
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: JSON.stringify({ content: [{ type: 'text', text: ANSWER }], stop_reason: 'end_turn' }),
    });
  });
  return sent;
}

const setFlag = (page, on) => page.evaluate((v) => { FEATURE_IMAGE_INPUT = v; }, on);

async function ask(page, question) {
  await page.evaluate(() => setVaBody('composer'));
  await page.locator('#vaComposerTa').fill(question);
  await page.locator('.va-cask').click();
  await page.waitForFunction(() => !!document.querySelector('#vaBody .va-answer'), undefined, { timeout: 15_000 });
}

// ⭐ PHASE 5 FLIPPED THE FLAG ON. This describe used to be "flag OFF (what ships)"; the flag now
// ships ON, so what it guards is the ROLLBACK PATH — the state the app returns to if the feature
// has to be switched off in a hurry. That path stops being exercised by the shipped default the
// moment the flag flips, which is exactly when it becomes worth a test.
test.describe('image input — flag OFF (the rollback path)', () => {

  // ⚠ THE FLAG-OFF PROPERTIES SHARE ONE BOOT ON PURPOSE. Each boot of this 3.6 MB document costs
  // ~6s, and the plan caps this file at 60 seconds; seven boots measured 61s. These assertions are
  // about one state, not one behaviour each, so they belong together rather than being split for
  // cosmetic granularity and blowing the budget.
  test('⛔ switched off, the filter offers no images and a forced image is still refused', async ({ phantom, page }) => {
    await page.addInitScript(MAKE);
    await phantom.boot();
    await page.evaluate(() => { FEATURE_IMAGE_INPUT = false; openVaSheet('intent'); });

    expect(await page.locator('#vaTicketFile').getAttribute('accept')).toBe('.txt,.log,.json,.eml,.csv,.md');

    // Bypass the accept filter entirely — the branch itself must refuse while the flag is off.
    const r = await page.evaluate(async () => {
      const blob = await window.__mk(800, 600, 'image/jpeg');
      const file = new File([blob], 'rack.jpg', { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.getElementById('vaTicketFile');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
      await new Promise((res) => setTimeout(res, 1200));
      return { image: VA.image, ticket: VA.ticket };
    });

    // With the flag off the image branch is dead, so the file falls into the TEXT path and is read
    // as text — which is exactly what happened before Phase 3 existed. It must not become an image.
    expect(r.image, '⛔ an image was attached with the feature flag OFF').toBeNull();
  });
});

test.describe('image input — flag ON', () => {

  test('⛔ the filter gains image/*, and a photo is attached, shown, and sent as an image block', async ({ phantom, page }) => {
    const sent = await stubAssistant(page);
    await page.addInitScript(MAKE);
    await phantom.boot();
    await setFlag(page, true);
    await page.evaluate(() => openVaSheet('intent'));

    // The accept filter is asserted here rather than in its own test: it needs the same boot and
    // the same flag state, and a separate boot for one getAttribute costs ~6s of a 60s budget.
    expect(await page.locator('#vaTicketFile').getAttribute('accept'))
      .toBe('.txt,.log,.json,.eml,.csv,.md,image/*');

    await page.evaluate(async () => {
      const blob = await window.__mk(1400, 1050, 'image/jpeg');
      const file = new File([blob], 'rack.jpg', { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.getElementById('vaTicketFile');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    });
    await page.waitForFunction(() => !!(VA.image && VA.image.b64), undefined, { timeout: 20_000 });

    // The technician has to be able to SEE that a photo is riding along.
    await expect(page.locator('#vaBody')).toContainText('PHOTO ATTACHED');

    await ask(page, 'What is wrong with this rack?');

    expect(sent.length, `expected 1 ask, got ${sent.length}`).toBe(1);
    const content = sent[0].body.messages[0].content;
    expect(Array.isArray(content), '⛔ an attached photo did not produce a content ARRAY').toBe(true);

    const image = content.find((b) => b.type === 'image');
    const text = content.find((b) => b.type === 'text');
    expect(image, 'no image block in the request').toBeTruthy();
    expect(image.source.type).toBe('base64');
    expect(image.source.media_type, 'the media type is not what the compressor produced').toBe('image/jpeg');
    expect((image.source.data || '').length, 'the image block carries no data').toBeGreaterThan(1000);
    expect(text.text).toContain('What is wrong with this rack?');

    // The whole body must still clear the ceiling phantomAPI enforces before the network.
    const ceiling = await page.evaluate(() => PHANTOM_API_MAX_BODY);
    expect(sent[0].raw.length,
      `the request body is ${sent[0].raw.length} bytes against a ${ceiling} ceiling — phantomAPI ` +
      `would have refused it client-side`).toBeLessThanOrEqual(ceiling);
  });

  test('⛔ WITH THE FLAG ON, a TEXT import still sends a bare string', async ({ phantom, page }) => {
    const sent = await stubAssistant(page);
    await phantom.boot();
    await setFlag(page, true);
    await page.evaluate(() => openVaSheet('intent'));

    await page.locator('#vaTicketFile').setInputFiles({
      name: 'switch.log', mimeType: 'text/plain',
      buffer: Buffer.from(`Sep 11 09:14 %OPTIC-4-RX_LOW: Rx power -18.4 dBm ${SENTINEL}`, 'utf8'),
    });
    await page.waitForFunction(() => !!(VA.ticket && VA.ticket.text), undefined, { timeout: 10_000 });

    await ask(page, 'Why is the link down?');

    // ⭐ THE ANTI-BREAKAGE CONTRACT IN ONE ASSERTION. The image branch existing — and being ON —
    // must not change the path beside it by one byte.
    const content = sent[0].body.messages[0].content;
    expect(typeof content,
      '⛔ a TEXT import sent a content array while the image flag was on — the branch leaked into ' +
      'the existing path, which is the one thing this plan forbids').toBe('string');
    expect(sent[0].body.system).toContain(SENTINEL);
    expect(sent[0].body.system).toContain('ATTACHED TICKET');
  });

  test('⛔ a photo never outlives the sheet', async ({ phantom, page }) => {
    await page.addInitScript(MAKE);
    await phantom.boot();
    await setFlag(page, true);
    await page.evaluate(() => openVaSheet('intent'));

    const r = await page.evaluate(async () => {
      const blob = await window.__mk(800, 600, 'image/jpeg');
      const dt = new DataTransfer();
      dt.items.add(new File([blob], 'rack.jpg', { type: 'image/jpeg' }));
      const input = document.getElementById('vaTicketFile');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
      await new Promise((res) => setTimeout(res, 1500));
      const attached = !!(VA.image && VA.image.b64);
      vaClose();
      // And it must not have leaked to storage on the way — base64 photos in localStorage would
      // exhaust the quota and take the technician's saved work with them.
      let inStorage = false;
      for (let i = 0; i < localStorage.length; i++) {
        const v = localStorage.getItem(localStorage.key(i)) || '';
        if (v.length > 20000) { inStorage = true; break; }
      }
      return { attached, afterClose: VA.image, inStorage };
    });

    expect(r.attached, 'fixture invalid — nothing was attached, so the clear proves nothing').toBe(true);
    expect(r.afterClose, '⛔ the photo survived vaClose()').toBeNull();
    expect(r.inStorage, '⛔ something photo-sized reached localStorage').toBe(false);
  });

  test('⛔ a photo that cannot be prepared is REFUSED out loud, not silently dropped', async ({ phantom, page }) => {
    await phantom.boot();
    await setFlag(page, true);
    await page.evaluate(() => openVaSheet('intent'));

    const r = await page.evaluate(async () => {
      // An image/* MIME type over bytes that are not a decodable image: the branch is entered and
      // va_prepareImage returns null. Contract 14 says that cannot be a silent return.
      const file = new File([new Blob(['definitely not a JPEG'])], 'broken.jpg', { type: 'image/jpeg' });
      const dt = new DataTransfer();
      dt.items.add(file);
      const input = document.getElementById('vaTicketFile');
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
      await new Promise((res) => setTimeout(res, 2000));
      return { image: VA.image, toast: (document.querySelector('#toast-container div') || {}).textContent || '' };
    });

    expect(r.image, 'an undecodable image was attached anyway').toBeNull();
    expect(r.toast, `the refusal was silent — toast text was ${JSON.stringify(r.toast)}`).toMatch(/could not attach/i);
  });
});

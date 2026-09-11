// ─────────────────────────────────────────────────────────────────────────────
// 58 — DCT ASSISTANT: IMPORT FILE (CHARACTERIZATION)
//
// ⭐ THIS SPEC IS A TRIPWIRE, NOT A FEATURE TEST. It pins what the .txt/.log/.json/.eml/.csv
// import does TODAY, before image input is built alongside it. The image work branches AROUND
// this path and must never modify it, so every later phase re-runs this file. If it goes red,
// the change broke existing behaviour and gets REVERTED, not patched.
//
// ⚠ IT WAS WRITTEN AGAINST UNMODIFIED main AND MUST PASS THERE FIRST. A characterization test
// that was authored after the change it is meant to police proves nothing.
//
// WHAT IT PINS — the whole chain, end to end:
//   #vaTicketFile (accept=".txt,.log,.json,.eml,.csv,.md", :51251)
//     -> va_importTicket()      :51314  readAsText, 256 KB cap
//     -> va_attachTicket()      :51285  VA.ticket = {name, text}   (memory only, never persisted)
//     -> va_ticketContext()     :51332  fences the text into the SYSTEM prompt, 12 000 char cap
//     -> vaAsk()                :51344  -> phantomAI() :18400 -> phantomAPI() :18253
//     -> messages[0].content is a BARE STRING                      :18417
//     -> vaShowAnswer()         :51445  renders the answer into #vaBody
//
// ⛔ NO REAL NETWORK. The proxy is stubbed with page.route and the request body is captured, so
// the assertion is "the file's bytes actually reached the request", not "a call happened". The
// endpoint is CROSS-ORIGIN, which matters twice over: sw.js returns early for cross-origin
// (`url.origin !== self.location.origin`), so a registered service worker never intercepts it and
// page.route holds on every project — and a live call would spend the owner's API budget and need
// an allowlisted Origin, which the Worker enforces (measured: a bare request returns 403
// origin_denied).
//
// WHY THE SHEET IS OPENED BY CALLING openVaSheet() RATHER THAN TAPPING THE DOCK GHOST: the door is
// 55-intel-dock.spec.js's subject, and INTEL-DOCK Ship 2 is still to come. A tripwire for IMPORT
// must not go red because a nav door moved.
//
// RUN STANDALONE:
//   cd test && npx playwright test e2e/58-assistant-import-file.spec.js --project=phone-webkit
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const PROXY = /phantom-api\.[a-z0-9]+\.workers\.dev/;

// A sentinel that cannot occur by accident anywhere else in a 3.6 MB document or its state.
const SENTINEL = 'ZQX-CHARACTERIZATION-7731';
const LOG_TEXT = [
  'Sep 11 09:14:02 aus01-sw-07 %LINK-3-UPDOWN: Interface Ethernet1/12, changed state to down',
  `Sep 11 09:14:03 aus01-sw-07 %OPTIC-4-RX_LOW: Rx power -18.4 dBm ${SENTINEL}`,
  'Sep 11 09:14:09 aus01-sw-07 %LINK-3-UPDOWN: Interface Ethernet1/12, changed state to up',
].join('\n');

const ANSWER = 'Optic Rx power is below threshold on Ethernet1/12. Reseat the transceiver.';

/**
 * Stub the assistant proxy and capture what the app actually sent.
 * Returns a live array — one entry per request, already JSON-parsed where possible.
 */
async function stubAssistant(page) {
  const sent = [];
  await page.route(PROXY, (route) => {
    const req = route.request();

    // ⛔ ONLY POSTs ARE ASKS. phantomCheckApi() (:55894) fires an OPTIONS at this SAME URL on every
    // boot to light the API dot. A first cut of this stub recorded it, so `sent.length` was 1
    // before the technician had asked anything and the oversized-file test failed claiming a
    // refused import had sent a request — the instrument was wrong, not the app. Answer the probe
    // the way the shared fixture does (204 + permissive CORS, keeping the app on its production
    // code path) and keep this counter about asks alone.
    if (req.method() !== 'POST') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': '*',
        },
        body: '',
      });
    }

    let body = null;
    try { body = JSON.parse(req.postData() || 'null'); } catch (_) { body = { _unparseable: req.postData() }; }
    sent.push({ method: req.method(), raw: req.postData() || '', body });
    // The shape apiText() (:18064) requires: data.content[] of blocks carrying .text
    return route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        id: 'msg_harness', type: 'message', role: 'assistant',
        model: 'claude-sonnet-4-5-20250929',
        content: [{ type: 'text', text: ANSWER }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
    });
  });
  return sent;
}

/** Open the assistant, import a .log, then ask a question through the composer. */
async function importThenAsk(page, { name = 'switch.log', text = LOG_TEXT, question = 'What is wrong with this link?' } = {}) {
  await page.evaluate(() => openVaSheet('intent'));
  await expect(page.locator('#vaSheet')).toHaveClass(/visible/);

  // The real control is hidden and driven by the IMPORT FILE card's click; setInputFiles drives
  // the same input and fires the same onchange -> va_importTicket(this).
  await page.locator('#vaTicketFile').setInputFiles({
    name, mimeType: 'text/plain', buffer: Buffer.from(text, 'utf8'),
  });

  // va_attachTicket() re-renders the intent body once the read resolves. Wait on the STATE the
  // app reaches, never on a duration.
  // ⚠ NOT window.VA: VA is declared `const VA = {...}` at top level (:51060), and a top-level
  // const is a global BINDING, not a property of window. window.VA is undefined and always was —
  // the first cut of this helper waited on it and timed out against perfectly healthy code.
  await page.waitForFunction(() => typeof VA !== 'undefined' && !!(VA.ticket && VA.ticket.text), undefined, { timeout: 10_000 });

  await page.evaluate(() => setVaBody('composer'));
  await page.locator('#vaComposerTa').fill(question);
  await page.locator('.va-cask').click();
  return question;
}

test.describe('DCT assistant — Import File, as it behaves today', () => {

  test('⛔ THE TRIPWIRE: a .log is read, reaches the request, and the answer renders', async ({ phantom, page }) => {
    const sent = await stubAssistant(page);
    await phantom.boot();

    const question = await importThenAsk(page);

    // 1. The answer renders. This is the user-visible end of the chain.
    await expect(page.locator('#vaBody .va-answer')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#vaBody')).toContainText('Reseat the transceiver');
    // vaShowError() paints a distinct ERROR label — its absence is part of the contract.
    await expect(page.locator('#vaBody')).not.toContainText('ERROR');

    // 2. Exactly one request, and the FILE'S BYTES are in it. "A call happened" is not the claim.
    expect(sent.length, `expected exactly 1 proxy request, got ${sent.length}`).toBe(1);
    expect(sent[0].method).toBe('POST');
    expect(sent[0].raw.includes(SENTINEL),
      '⛔ the imported file never reached the request body — the import path is broken').toBe(true);

    // 3. The question travelled too.
    expect(sent[0].raw).toContain(question);
  });

  test('the request shape today: content is a BARE STRING and the file rides in system', async ({ phantom, page }) => {
    const sent = await stubAssistant(page);
    await phantom.boot();
    await importThenAsk(page);

    const body = sent[0].body;
    expect(body, 'the request body was not JSON').toBeTruthy();
    expect(Array.isArray(body.messages), 'messages is not an array').toBe(true);
    expect(body.messages.length).toBe(1);
    expect(body.messages[0].role).toBe('user');

    // ⭐ THE LINE PHASE 3 WILL BRANCH AROUND, PINNED SO THE BRANCH CANNOT SWALLOW THIS PATH.
    // A text import must still send a bare string even after image input adds a content-array
    // path beside it. If this ever becomes an array for a .log, the branch leaked.
    expect(typeof body.messages[0].content,
      '⛔ messages[0].content is no longer a bare string for a TEXT import (:18417). The image ' +
      'branch must not change the existing path.').toBe('string');

    // va_ticketContext() (:51332) fences the file into the SYSTEM prompt, not user content.
    expect(typeof body.system).toBe('string');
    expect(body.system.includes(SENTINEL),
      '⛔ the file text is no longer carried in the system prompt').toBe(true);
    expect(body.system).toContain('ATTACHED TICKET');
    expect(body.messages[0].content.includes(SENTINEL),
      'the file text has moved into user content — a real change worth a ruling, not a silent one').toBe(false);
  });

  test('the accept filter is text-only today — no image types', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => openVaSheet('intent'));

    const accept = await page.locator('#vaTicketFile').getAttribute('accept');
    // ⭐ Phase 3 appends image/* behind FEATURE_IMAGE_INPUT. With the flag OFF this attribute must
    // stay byte-identical to this string, which is the anti-breakage contract in one assertion.
    expect(accept).toBe('.txt,.log,.json,.eml,.csv,.md');
    expect(/image/.test(accept || ''),
      'image types are accepted with no feature flag in evidence').toBe(false);
  });

  test('⛔ an oversized file is REFUSED loudly and nothing is attached', async ({ phantom, page }) => {
    const sent = await stubAssistant(page);
    await phantom.boot();
    await page.evaluate(() => openVaSheet('intent'));

    // The cap is `file.size > 262144` (:51318). 300 KB clears it decisively.
    const warns = [];
    page.on('console', (m) => { if (m.type() === 'warning') warns.push(m.text()); });

    await page.locator('#vaTicketFile').setInputFiles({
      name: 'huge.log', mimeType: 'text/plain', buffer: Buffer.from('x'.repeat(300 * 1024), 'utf8'),
    });

    // Contract 14: refusing is fine, refusing SILENTLY is not. The toast is the visible half.
    // ⚠ phantomToast (:55739) appends a bare <div> into #toast-container and removes it ~4.35s
    // later — there is no id and no class to match on, and a selector guess (#phantom-toast,
    // .toast) matches nothing. Assert the container's child, and assert what it SAYS: "a toast
    // appeared" would pass for any toast, including one about something else entirely.
    const toast = page.locator('#toast-container div').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
    await expect(toast, 'the refusal did not say WHY').toContainText(/too large/i);

    const attached = await page.evaluate(() => typeof VA !== 'undefined' && !!VA.ticket);
    expect(attached, '⛔ an oversized file was attached anyway — the 256 KB cap did not hold').toBe(false);
    expect(sent.length, 'a refused import still sent a request').toBe(0);
  });

  test('⛔ the imported file is never persisted to storage', async ({ phantom, page }) => {
    await stubAssistant(page);
    await phantom.boot();
    await importThenAsk(page);

    // VA.ticket is annotated "never persisted, cleared on sheet close" (:51066). That is a
    // PROPERTY the image work must preserve: base64 photos in localStorage would exhaust the
    // quota and take the technician's saved work with them.
    const leaked = await page.evaluate((needle) => {
      const hits = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k) || '';
        if (v.includes(needle) || (k || '').includes('ticket')) hits.push(k);
      }
      return hits;
    }, SENTINEL);

    expect(leaked,
      `⛔ the imported file reached localStorage under ${JSON.stringify(leaked)}. It is supposed to ` +
      `live in memory only.`).toEqual([]);
  });
});

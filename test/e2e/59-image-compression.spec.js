// ─────────────────────────────────────────────────────────────────────────────
// 59 — IMAGE COMPRESSION FOR THE ASSISTANT (Phase 2)
//
// Nothing in the app calls va_prepareImage yet; Phase 3 wires it. This spec is the whole of its
// verification, so it carries the plan's three fixtures — a large JPEG, a PNG with transparency,
// and a file that is not an image — plus the thing the plan did not ask for and needs most: proof
// that the output actually FITS THE REQUEST.
//
// ⛔ THE CEILING IS THE POINT. phantomAPI (:18253) refuses a body over PHANTOM_API_MAX_BODY
// (300,000, :18252) BEFORE the network, and base64 inflates a blob by 4/3. Measured here: a
// request with no image is 4,535 bytes. The plan's stated target — 1600px @ 0.80 landing "under
// 400 KB" — is 533 KB once base64'd, nearly double a limit that already existed. Even the
// EXISTING 1280/0.70 default produced 271,259 bytes from a noisy 3000x2000 JPEG, over the ceiling
// on its own. A fixed setting cannot meet a byte budget, so va_prepareImage walks a ladder.
//
// ⭐ AND IT IS ONE COMPRESSOR, NOT TWO. photo_compress (:56953) was PARAMETERISED rather than
// duplicated — Contract A2. Its defaults are the old hard-coded values, so its one caller
// (photo_handleCapture :56944, which passes neither argument) is served byte-identically. That
// function had ZERO test coverage before this spec, so its default behaviour is pinned below;
// generalising an untested function without pinning it first is how a "safe" refactor ships a
// regression.
//
// RUN STANDALONE:
//   cd test && npx playwright test e2e/59-image-compression.spec.js --project=phone-webkit
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

/**
 * Fixture builder, evaluated in-page: a canvas painted with deterministic noise so JPEG cannot
 * compress it to nothing. A clean gradient would flatter the compressor and prove far less.
 */
const MAKE_FIXTURES = `
  window.__mk = function (w, h, type, alpha) {
    return new Promise(function (res) {
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var x = c.getContext('2d');
      if (!alpha) { x.fillStyle = '#123'; x.fillRect(0, 0, w, h); }
      for (var i = 0; i < 4000; i++) {
        x.fillStyle = 'rgba(' + ((i*7)%255) + ',' + ((i*13)%255) + ',' + ((i*29)%255) + ',' + (alpha ? 0.5 : 1) + ')';
        x.fillRect((i*37)%w, (i*53)%h, 24, 24);
      }
      c.toBlob(function (b) { res(b); }, type, type === 'image/jpeg' ? 0.92 : undefined);
    });
  };
`;

test.describe('assistant image compression', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(MAKE_FIXTURES);
  });

  test('⛔ a large JPEG is compressed to fit the request budget', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const blob = await window.__mk(3000, 2000, 'image/jpeg');
      const file = new File([blob], 'rack.jpg', { type: 'image/jpeg' });
      const out = await va_prepareImage(file);
      return { inBytes: file.size, out: out && { mediaType: out.mediaType, width: out.width, height: out.height, bytes: out.bytes }, budget: VA_IMAGE_BUDGET_BYTES };
    });

    expect(r.out, 'a normal phone-sized JPEG returned null — nothing can be sent').not.toBeNull();
    expect(r.out.bytes,
      `${r.out.bytes} bytes exceeds the ${r.budget}-byte budget; base64 would put it over ` +
      `PHANTOM_API_MAX_BODY and phantomAPI would refuse it before the network`).toBeLessThanOrEqual(r.budget);
    expect(r.out.bytes, 'compression did not actually reduce anything').toBeLessThan(r.inBytes);
    expect(r.out.mediaType).toBe('image/jpeg');
    // Aspect preserved: 3000x2000 is 3:2.
    expect(r.out.width / r.out.height).toBeCloseTo(1.5, 1);
    expect(r.out.width).toBeLessThanOrEqual(1280);
  });

  test('⛔ base64 of the result still fits inside PHANTOM_API_MAX_BODY with a real prompt', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const warns = [];
      const orig = console.warn;
      console.warn = function () { warns.push(Array.from(arguments).join(' ')); orig.apply(console, arguments); };
      let out;
      try {
        const blob = await window.__mk(3000, 2000, 'image/jpeg');
        out = await va_prepareImage(new File([blob], 'rack.jpg', { type: 'image/jpeg' }));
      } finally { console.warn = orig; }
      if (!out) return { nulled: true, warns };
      const b64 = await new Promise((res) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result).split(',')[1] || '');
        fr.readAsDataURL(out.blob);
      });
      return { raw: out.bytes, b64: b64.length, ceiling: PHANTOM_API_MAX_BODY, warns };
    });

    // A null here is the interesting failure, so say WHICH branch produced it rather than
    // reporting a bare null and leaving the next person to re-derive it.
    expect(r.nulled,
      `va_prepareImage returned null for a normal phone-sized JPEG. Its own warnings: ` +
      `${JSON.stringify(r.warns)}`).toBeFalsy();
    // 40 KB of headroom for system prompt + live context + HW context + a capped ticket.
    const HEADROOM = 40000;
    expect(r.b64 + HEADROOM,
      `base64 is ${r.b64} bytes; with ${HEADROOM} of prompt overhead that is over the ` +
      `${r.ceiling}-byte ceiling and the request dies client-side`).toBeLessThanOrEqual(r.ceiling);
  });

  test('a PNG with transparency is handled — and the alpha loss is real, not hidden', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const blob = await window.__mk(2400, 1600, 'image/png', true);
      const file = new File([blob], 'screenshot.png', { type: 'image/png' });
      const out = await va_prepareImage(file);
      return { inBytes: file.size, out: out && { mediaType: out.mediaType, bytes: out.bytes, width: out.width }, budget: VA_IMAGE_BUDGET_BYTES };
    });

    expect(r.out, 'a PNG returned null').not.toBeNull();
    expect(r.out.bytes).toBeLessThanOrEqual(r.budget);
    // ⚠ MEASURED AND STATED, NOT PAPERED OVER: the output is JPEG, so transparency is gone. A
    // transparent PNG can even grow through this path (121,959 -> 190,913 at the top rung), which
    // is exactly why the ladder exists — it steps down until the bytes fit.
    expect(r.out.mediaType, 'transparency survived — the ladder no longer emits JPEG').toBe('image/jpeg');
  });

  test('⛔ a non-image returns NULL and does not throw', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const file = new File([new Blob(['this is not an image'])], 'notes.txt', { type: 'text/plain' });
      const warns = [];
      const orig = console.warn;
      console.warn = function () { warns.push(Array.from(arguments).join(' ')); orig.apply(console, arguments); };
      let threw = null, out;
      try { out = await va_prepareImage(file); } catch (e) { threw = String(e && e.message || e); }
      finally { console.warn = orig; }
      return { out, threw, warns };
    });

    expect(r.threw,
      `⛔ va_prepareImage threw instead of returning null: ${r.threw}. photo_compress REJECTS on a ` +
      `non-image, and the assistant branch sits beside the text import path — a throw there would ` +
      `take the existing path down with it.`).toBeNull();
    expect(r.out, 'a non-image did not return null').toBeNull();
    // Contract 14: null is a refusal, and a refusal has to say so.
    expect(r.warns.some((w) => /not an image/i.test(w)),
      `the refusal was silent — got ${JSON.stringify(r.warns)}`).toBe(true);
  });

  test('⛔ a smaller image is never upscaled', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const blob = await window.__mk(400, 300, 'image/jpeg');
      const out = await va_prepareImage(new File([blob], 'small.jpg', { type: 'image/jpeg' }));
      return out && { width: out.width, height: out.height, bytes: out.bytes };
    });
    expect(r).not.toBeNull();
    expect(r.width, 'a 400px image was upscaled').toBe(400);
    expect(r.height).toBe(300);
  });

  test('⛔ an impossible budget returns null rather than something unsendable', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const blob = await window.__mk(3000, 2000, 'image/jpeg');
      const warns = [];
      const orig = console.warn;
      console.warn = function () { warns.push(Array.from(arguments).join(' ')); orig.apply(console, arguments); };
      let out;
      try { out = await va_prepareImage(new File([blob], 'rack.jpg', { type: 'image/jpeg' }), 500); }
      finally { console.warn = orig; }
      return { out, warns };
    });
    // 500 bytes is unreachable at every rung. Returning the smallest rung anyway would hand
    // Phase 3 something the API will reject — a control that looks like it worked.
    expect(r.out, 'an unreachable budget returned an oversized result instead of null').toBeNull();
    expect(r.warns.some((w) => /will not fit/i.test(w)),
      `the refusal was silent — got ${JSON.stringify(r.warns)}`).toBe(true);
  });

  test('⭐ photo_compress keeps its old behaviour for the caller that passes no arguments', async ({ phantom, page }) => {
    await phantom.boot();
    const r = await page.evaluate(async () => {
      const blob = await window.__mk(3000, 2000, 'image/jpeg');
      const out = await photo_compress(new File([blob], 'rack.jpg', { type: 'image/jpeg' }));
      const dims = await va_imageDims(out);
      return { type: out.type, width: dims.w, height: dims.h };
    });
    // The pin: photo_handleCapture (:56944) calls photo_compress(file) with no maxSide and no
    // quality. Parameterising must not have moved its defaults — 1280 long edge, JPEG.
    expect(r.width, '⛔ the default long-edge cap moved off 1280 — the photo capture path changed').toBe(1280);
    expect(r.type).toBe('image/jpeg');
  });
});

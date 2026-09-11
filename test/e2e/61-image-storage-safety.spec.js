// ─────────────────────────────────────────────────────────────────────────────
// 61 — IMAGE STORAGE SAFETY (Phase 4)
//
// ⚠ THIS PHASE'S PREMISE DOES NOT HOLD, AND THAT IS THE FINDING, NOT A SHORTCUT.
// The plan's Phase 0 gate says: "If conversation state lives in localStorage: flag it. Images must
// not go there. Phase 4 handles this; it becomes mandatory rather than optional."
//
// Conversation state does not live in localStorage. It does not live anywhere. VA (:51060) is an
// in-memory const, VA.ticket is annotated "never persisted, cleared on sheet close", vaShowAnswer
// writes straight to innerHTML, and there is no history array. The assistant is single-turn. So
// there is no conversation record to put a key and a thumbnail into, and no store to build.
//
// ⛔ BUILDING IT ANYWAY WOULD HAVE BEEN THE WRONG MOVE TWICE OVER: an IndexedDB store for a
// conversation that does not exist, duplicating `phantom-attachments` (:57002) which already has
// bySite and byRack indexes — a third photo database in a file that already carries two.
//
// ⭐ SO PHASE 4 SHIPS THE GUARD INSTEAD OF THE STORE. The risk the plan names is real in
// PRINCIPLE — base64 photos in localStorage would exhaust the quota and take the technician's
// saved work with them, and localStorage is already under pressure from large Masters. It is
// currently impossible only because of an architectural accident. These tests make it impossible
// ON PURPOSE: the day someone adds conversation history, this file goes red before a photo can
// ride into localStorage with it.
//
// The plan's own test — "store three images, reload, confirm they render and that localStorage did
// not grow" — is adapted to what the architecture actually is. Three images are attached, the
// storage floor is measured on both sides, and the reload proves nothing was carried forward.
//
// RUN STANDALONE:
//   cd test && npx playwright test e2e/61-image-storage-safety.spec.js --project=phone-webkit
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

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
      c.toBlob(function (b) { res(b); }, 'image/jpeg', 0.92);
    });
  };
  window.__attach = async function (name) {
    var blob = await window.__mk(1200, 900);
    var dt = new DataTransfer();
    dt.items.add(new File([blob], name, { type: 'image/jpeg' }));
    var input = document.getElementById('vaTicketFile');
    input.files = dt.files;
    input.dispatchEvent(new Event('change'));
    for (var i = 0; i < 60 && !(VA.image && VA.image.b64); i++) {
      await new Promise(function (r) { setTimeout(r, 100); });
    }
    return !!(VA.image && VA.image.b64);
  };
  // Total bytes of localStorage, keys included — the number the quota actually counts.
  window.__lsBytes = function () {
    var n = 0;
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      n += (k || '').length + (localStorage.getItem(k) || '').length;
    }
    return n;
  };
`;

test.describe('image storage safety', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(MAKE);
  });

  test('⛔ THREE attached photos put nothing photo-sized into localStorage', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => { FEATURE_IMAGE_INPUT = true; openVaSheet('intent'); });

    const r = await page.evaluate(async () => {
      const snap = () => {
        const o = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          o[k] = (k || '').length + (localStorage.getItem(k) || '').length;
        }
        return o;
      };
      const before = snap();
      const attached = [];
      for (const name of ['rack-a.jpg', 'rack-b.jpg', 'rack-c.jpg']) {
        attached.push(await window.__attach(name));
      }
      const after = snap();
      const moved = [];
      for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
        const d = (after[k] || 0) - (before[k] || 0);
        if (d !== 0) moved.push({ key: k, delta: d });
      }
      return { attached, moved, photoBytes: VA.image && VA.image.bytes };
    });

    expect(r.attached, 'fixture invalid — not all three photos attached, so the measurement proves nothing')
      .toEqual([true, true, true]);

    // ⚠ THE THRESHOLD IS NOT A LOOSENING TO GET GREEN, AND THE MEASUREMENT SAYS WHY.
    // A first cut asserted localStorage did not move by a single byte, and it failed consistently:
    // 275 -> 309, a 34-byte delta traced to `phantom_brief_last_ts` — a 13-byte timestamp plus its
    // key, written by the brief on its own schedule and nothing to do with photos. Demanding exact
    // equality was asserting "the app is idle", which is not the claim. The claim is that no IMAGE
    // reached localStorage, and an image cannot hide in 34 bytes: the smallest ladder rung produces
    // ~87 KB, ~116 KB once base64'd. 4 KB is ~30x smaller than anything this guard must catch and
    // ~100x larger than the housekeeping it must tolerate.
    const PHOTO_FLOOR = 4096;
    const suspicious = r.moved.filter((m) => Math.abs(m.delta) >= PHOTO_FLOOR);
    expect(suspicious,
      `localStorage keys moved by a photo-sized amount across three attachments: ` +
      `${JSON.stringify(suspicious)}. The attached photo was ${r.photoBytes} bytes. Base64 images ` +
      `in localStorage exhaust the quota and take the technician's saved work with them — that is ` +
      `the breakage this phase exists to prevent. (All deltas seen: ${JSON.stringify(r.moved)})`)
      .toEqual([]);
  });

  test('⛔ no value anywhere in localStorage is photo-sized, before or after', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => { FEATURE_IMAGE_INPUT = true; openVaSheet('intent'); });

    const big = await page.evaluate(async () => {
      await window.__attach('rack.jpg');
      const hits = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const v = localStorage.getItem(k) || '';
        // A compressed photo is tens of KB minimum; nothing legitimate here is close.
        if (v.length > 20000) hits.push({ key: k, bytes: v.length });
        // And nothing should look like base64 image payload regardless of size.
        if (/^[A-Za-z0-9+/]{2000,}={0,2}$/.test(v.trim())) hits.push({ key: k, base64: true });
      }
      return hits;
    });

    expect(big, `⛔ photo-sized or base64-shaped values in localStorage: ${JSON.stringify(big)}`).toEqual([]);
  });

  test('⛔ the assistant creates no database of its own', async ({ phantom, page }) => {
    await phantom.boot();

    const r = await page.evaluate(async () => {
      if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
        return { supported: false };
      }
      const before = (await indexedDB.databases()).map((d) => d.name).sort();
      FEATURE_IMAGE_INPUT = true;
      openVaSheet('intent');
      await window.__attach('rack.jpg');
      vaClose();
      const after = (await indexedDB.databases()).map((d) => d.name).sort();
      return { supported: true, before, after };
    });

    // ⚠ REPORTED, NOT SILENTLY SKIPPED. WebKit has not always exposed indexedDB.databases(); if it
    // is missing the check cannot run, and saying so is better than a green tick that meant nothing.
    test.skip(!r.supported, 'indexedDB.databases() is not available in this browser — the ' +
      'database-creation check cannot run here. It runs on the chromium projects.');

    expect(r.after,
      `⛔ attaching a photo created a database: ${JSON.stringify(r.after.filter((n) => !r.before.includes(n)))}. ` +
      `The assistant holds no conversation, so it has nothing to persist — and a third photo store ` +
      `beside phantom-attachments and phantom-photos would be exactly the duplication Contract A2 forbids.`)
      .toEqual(r.before);
  });

  test('⛔ a reload carries no photo forward — the attachment dies with the session', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => { FEATURE_IMAGE_INPUT = true; openVaSheet('intent'); });

    const attached = await page.evaluate(() => window.__attach('rack.jpg'));
    expect(attached, 'fixture invalid — nothing attached').toBe(true);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof VA !== 'undefined', undefined, { timeout: 20_000 });

    const after = await page.evaluate(() => ({
      image: VA.image,
      ticket: VA.ticket,
      flag: FEATURE_IMAGE_INPUT,
    }));

    expect(after.image, '⛔ a photo survived a reload — something persisted it').toBeNull();
    expect(after.ticket, 'a ticket survived a reload').toBeNull();
    // And the flag is back to its shipped value: the test flipped a runtime var, not the file.
    expect(after.flag, 'the feature flag survived a reload — it is not shipping off').toBe(false);
  });

  test('⭐ the guard has teeth: a base64 photo written to localStorage IS caught', async ({ phantom, page }) => {
    await phantom.boot();
    await page.evaluate(() => { FEATURE_IMAGE_INPUT = true; openVaSheet('intent'); });

    // ⛔ THE MUTATION, RUN AS A TEST RATHER THAN TRUSTED. A guard that cannot detect the thing it
    // guards against is worse than no guard: it certifies by not applying. This does deliberately
    // what a future conversation-history feature might do accidentally, and proves the detector
    // above would fire. It cleans up after itself so no other test inherits the key.
    const caught = await page.evaluate(async () => {
      await window.__attach('rack.jpg');
      const KEY = '__phantom_test_leak';
      try {
        localStorage.setItem(KEY, VA.image.b64);
        let hits = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const v = localStorage.getItem(localStorage.key(i)) || '';
          if (v.length > 20000) hits++;
        }
        return hits;
      } finally {
        localStorage.removeItem(KEY);
      }
    });

    expect(caught,
      'the photo-sized-value detector did not fire on a deliberately leaked base64 photo — it ' +
      'would not have caught a real one either').toBeGreaterThan(0);

    // ...and the cleanup held, so the suite is left as it was found.
    const residue = await page.evaluate(() => localStorage.getItem('__phantom_test_leak'));
    expect(residue, 'the mutation test left its own leak behind').toBeNull();
  });
});

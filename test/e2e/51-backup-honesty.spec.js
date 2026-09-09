// ─────────────────────────────────────────────────────────────────────────────
// 51 — THE BACKUP BANNER REPORTS THE COMPLETED OP, NOT THE TAP
//      (v1.14.584, BACKUP-HONESTY, DATA-HONESTY-COMMAND Batch 2 P0, owner GO 2026-09-09)
//
// ⛔ WHY THIS EXISTS. exportAllData() called phantomMarkBackupDone() as its FIRST line: the
// last-backup timestamp was written and the reminder banner hidden before the IndexedDB read,
// before the share sheet, and before anything could fail. A dismissed share sheet counted as a
// backup. Both GhostEchoDB error paths built the bundle from [] and the manifest recorded the
// store as included:true, recordCount:0 — a failed read serialised as a clean, empty store. And
// downloadJSON never consulted navigator.share()'s promise, so nothing ever learned the outcome.
// A technician could believe they had backed up work they had not. Contract B10 / B14.
//
// ⭐ THE ACCEPTANCE BAR: the banner says SAVING while the op runs; DONE is recorded only when the
// share resolved (or the download was handed to the browser); a dismissed sheet or a thrown error
// is NOT SAVED, persistent, never marked done; a failed store read is a PARTIAL backup that names
// the store, the manifest says included:false, the file says partial:true, and it is never marked
// done. A second tap while saving is refused with a toast, not silently.
//
// The export transport is stubbed at navigator.share / triggerDownload — WebKit-on-Windows has no
// share sheet and a real anchor click would open a download — but exportAllData, buildBundle,
// downloadJSON and the banner are the real code paths.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const TS_KEY = 'phantom_last_backup_ts';

// The boot-time API health probe hits the Cloudflare worker from the harness origin
// (http://127.0.0.1:4317), which the worker's CORS policy refuses: WebKit logs the refusal as a
// console error AND surfaces the rejected fetch as a pageerror. Same three entries in every test,
// including the one that never builds a bundle — boot noise, nothing to do with the export. Filtered
// HERE with the reason, not added to the global allowlist (fixtures.js is deliberately narrow).
const BOOT_API_PROBE = /workers\.dev|Access-Control-Allow-Origin|access control checks/i;

// Print every hard error before asserting on them: a bare "+14" tells nobody what fired.
function expectNoHardErrors(phantom) {
  const errs = phantom.hardErrors().filter((e) => !BOOT_API_PROBE.test(e.text));
  if (errs.length) console.log('[51] hardErrors ' + JSON.stringify(errs.map((e) => e.type + ': ' + e.text.slice(0, 160))));
  expect(errs, 'a hard error the export is responsible for').toEqual([]);
}

// Arm the page: capture every bundle handed to downloadJSON, count triggerDownload calls without
// clicking, install a share-sheet stub, optionally break IndexedDB or the first sync read.
async function arm(page, opts) {
  await page.evaluate((o) => {
    window.__bk = { bundles: [], downloads: 0, shareCalls: 0 };
    const origDownload = window.downloadJSON;
    window.downloadJSON = function (data, prefix, dopts) {
      window.__bk.bundles.push(data);
      return origDownload(data, prefix, dopts);
    };
    window.triggerDownload = function () { window.__bk.downloads++; };
    if (o.share === 'none') {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: undefined });
    } else {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: () => {
          window.__bk.shareCalls++;
          return new Promise((resolve, reject) => setTimeout(() => {
            if (o.share === 'resolve') return resolve();
            if (o.share === 'abort') { const e = new Error('Share canceled'); e.name = 'AbortError'; return reject(e); }
            reject(new Error('share exploded'));
          }, o.delay || 50));
        },
      });
    }
    if (o.idb === 'fail') {
      window.indexedDB.open = function () {
        const r = {};
        setTimeout(() => { if (r.onerror) r.onerror({ target: r }); }, 0);
        return r;
      };
    }
    if (o.throwEarly) {
      window.loadSOPs = function () { throw new Error('fixture: loadSOPs exploded'); };
    }
  }, opts);
}

// Call the real entry point. Returns the thrown error as a string, or null.
const tap = (page) => page.evaluate(() => {
  try { exportAllData(); return null; } catch (e) { return String(e && e.message ? e.message : e); }
});

const read = (page) => page.evaluate((k) => {
  const b = document.getElementById('backup-remind');
  const tc = document.getElementById('toast-container');
  const first = window.__bk.bundles[0] || null;
  const manifest = (first && first.manifest) || [];
  return {
    ts: localStorage.getItem(k),
    shown: !!b && b.style.display !== 'none',
    text: b ? b.textContent.replace(/\s+/g, ' ').trim() : null,
    state: b ? b.getAttribute('data-backup-state') : null,
    toast: tc ? tc.textContent.replace(/\s+/g, ' ').trim() : '',
    bundles: window.__bk.bundles.length,
    downloads: window.__bk.downloads,
    shareCalls: window.__bk.shareCalls,
    ghosts: manifest.find((m) => m.store === 'GhostEchoDB:ghosts') || null,
    partial: first ? first.partial : null,
    readFailures: first ? first.readFailures : null,
  };
}, TS_KEY);

test.describe('The backup banner reports the completed op, not the tap', () => {

  test('⛔ the backup is not marked done until the share sheet resolves', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await arm(page, { share: 'resolve', delay: 900 });
    expect(await tap(page)).toBeNull();
    const during = await read(page);
    console.log('[51] during ' + JSON.stringify({ ts: during.ts, shown: during.shown, text: during.text }));
    expect(during.ts, 'the timestamp was written before the export finished').toBeNull();
    expect(during.shown).toBe(true);
    expect(during.text).toMatch(/SAVING/);
    await page.waitForTimeout(1500);
    const after = await read(page);
    console.log('[51] after ' + JSON.stringify({ ts: after.ts, shown: after.shown, toast: after.toast }));
    expect(after.ts, 'a resolved share must mark the backup done').not.toBeNull();
    expect(after.shown).toBe(false);
    expect(after.toast).toMatch(/Backup exported/);
    expect(after.bundles).toBe(1);
    expectNoHardErrors(phantom);
  });

  test('a dismissed share sheet is NOT SAVED: persistent, never marked done, no second download', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await arm(page, { share: 'abort' });
    expect(await tap(page)).toBeNull();
    await page.waitForTimeout(600);
    const s = await read(page);
    console.log('[51] dismissed ' + JSON.stringify({ ts: s.ts, shown: s.shown, text: s.text, downloads: s.downloads }));
    expect(s.ts, 'a dismissed sheet was recorded as a backup').toBeNull();
    expect(s.shown).toBe(true);
    expect(s.text).toMatch(/NOT SAVED/);
    expect(s.state).toBe('failed');
    expect(s.downloads, 'a cancelled share fell through to a download prompt').toBe(0);
    expectNoHardErrors(phantom);
  });

  test('⛔ a failed GhostEchoDB read is a PARTIAL backup: the manifest says so, the file says so, nothing is marked done', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await arm(page, { share: 'resolve', idb: 'fail' });
    expect(await tap(page)).toBeNull();
    await page.waitForTimeout(800);
    const s = await read(page);
    console.log('[51] partial ' + JSON.stringify({ ts: s.ts, text: s.text, ghosts: s.ghosts, partial: s.partial, readFailures: s.readFailures }));
    expect(s.bundles).toBe(1);
    expect(s.ghosts, 'the manifest has no GhostEchoDB entry').not.toBeNull();
    expect(s.ghosts.included, 'a failed read serialised as included').toBe(false);
    expect(s.ghosts.recordCount).toBe(0);
    expect(s.partial).toBe(true);
    expect(s.readFailures).toContain('GhostEchoDB:ghosts');
    expect(s.text).toMatch(/PARTIAL BACKUP/);
    expect(s.text).toMatch(/GhostEchoDB/);
    expect(s.state).toBe('partial');
    expect(s.shown).toBe(true);
    expect(s.ts, 'a partial backup was marked done').toBeNull();
    expectNoHardErrors(phantom);
  });

  // Handoff rev 2: a browser download is not proof of a retained copy, so the anchor path says the
  // file was PREPARED and where to look. It never says saved.
  test('no share API: the download path reports the file as prepared, never saved, and records the export', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await arm(page, { share: 'none' });
    expect(await tap(page)).toBeNull();
    await page.waitForTimeout(600);
    const s = await read(page);
    console.log('[51] download ' + JSON.stringify({ ts: s.ts, shown: s.shown, toast: s.toast, downloads: s.downloads }));
    expect(s.downloads).toBe(1);
    expect(s.ts).not.toBeNull();
    expect(s.shown).toBe(false);
    expect(s.toast).toMatch(/Backup file prepared/);
    expect(s.toast).toMatch(/check your downloads/i);
    expect(s.toast, 'the download path claimed a saved copy').not.toMatch(/saved/i);
    expectNoHardErrors(phantom);
  });

  test('an exception before the bundle exists is NOT SAVED, retry or free space, and never thrown at the tap', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await arm(page, { share: 'resolve', throwEarly: true });
    expect(await tap(page), 'the tap itself threw').toBeNull();
    await page.waitForTimeout(400);
    const s = await read(page);
    console.log('[51] threw ' + JSON.stringify({ ts: s.ts, shown: s.shown, text: s.text, bundles: s.bundles }));
    expect(s.bundles).toBe(0);
    expect(s.ts).toBeNull();
    expect(s.shown).toBe(true);
    expect(s.text).toMatch(/NOT SAVED/);
    expect(s.text).toMatch(/retry/i);
    expect(s.state).toBe('failed');
    expectNoHardErrors(phantom);
  });

  test('a second tap while saving is refused with a toast, not silently', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await arm(page, { share: 'resolve', delay: 900 });
    expect(await tap(page)).toBeNull();
    expect(await tap(page)).toBeNull();
    const during = await read(page);
    console.log('[51] double-tap ' + JSON.stringify({ toast: during.toast, shareCalls: during.shareCalls }));
    expect(during.toast).toMatch(/already in progress/i);
    await page.waitForTimeout(1500);
    const after = await read(page);
    expect(after.shareCalls, 'the second tap started a second export').toBe(1);
    expect(after.bundles).toBe(1);
    expect(after.ts).not.toBeNull();
    expectNoHardErrors(phantom);
  });
});

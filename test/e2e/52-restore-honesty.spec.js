// ─────────────────────────────────────────────────────────────────────────────
// 52 — THE RESTORE SAYS WHAT IT WILL REPLACE, REFUSES A DAMAGED FILE BEFORE ANY WRITE,
//      AND REPORTS WHAT IT ACTUALLY RECOVERED
//      (v1.14.585, RESTORE-HONESTY, DATA-HONESTY-COMMAND Batch 2 P0 sub-ship 2, owner GO 2026-09-09)
//
// ⛔ WHY THIS EXISTS. phantomImport() confirmed a restore by listing what was IN the file, never
// what is ON THE DEVICE that the file would overwrite or clear. Orphaned records (a rack whose
// deployment is not in the backup) were filtered out silently. A bundle whose manifest says a
// store failed to read (included:false, partial:true — the .584 vocabulary) was offered as a
// normal restore. A structurally damaged file — a section that is not a list, a manifest count
// that does not match the file — could reach the write set. Discrepancy photos are exported and
// never restored, and nothing said so. The completion alert said "Restore complete" whatever
// happened, and an IndexedDB failure on the Ghost Echo write produced no report at all.
// Contracts B10 / B14; handoff rev 2 §1: show what will be replaced, validate before applying,
// report partial or failed recovery honestly.
//
// ⭐ THE ACCEPTANCE BAR: the confirm shows device-count → backup-count per section and names what
// will be CLEARED, DROPPED or KEPT; a damaged file is refused with every key byte-identical; a
// partial backup keeps this device's Ghost Echo and says so; the completion alert counts what was
// written and reports the Ghost Echo outcome, including failure.
//
// The file input and the dialogs are the app's REAL restore door (confirm()/alert(), as in
// 04-storage); nothing in the write path is stubbed.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const readAll = (page) => page.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[k] = localStorage.getItem(k); }
  return out;
});

// Same technique as 04-storage: phantomImport builds a detached <input type=file>, so the
// filechooser event is the only way in. Returns every dialog the restore raised, in order.
async function driveRestore(page, jsonText) {
  const dialogs = [];
  const handler = (d) => { dialogs.push({ type: d.type(), message: d.message() }); d.accept().catch(() => {}); };
  page.on('dialog', handler);
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 10_000 }),
      page.evaluate(() => phantomImport()),
    ]);
    await chooser.setFiles({ name: 'phantom-full-backup.json', mimeType: 'application/json', buffer: Buffer.from(jsonText, 'utf8') });
    await expect.poll(() => dialogs.length, { timeout: 15_000, message: 'restore raised no dialog' }).toBeGreaterThan(0);
    await expect.poll(() => dialogs.some((d) => d.type === 'alert'), { timeout: 15_000 }).toBe(true);
  } finally {
    page.off('dialog', handler);
  }
  return dialogs;
}

const confirmOf = (dialogs) => (dialogs.find((d) => d.type === 'confirm') || {}).message || '';
const lastAlert = (dialogs) => [...dialogs].reverse().find((d) => d.type === 'alert');

// The app's own store: GhostEchoDB v1, store 'ghosts', keyPath id autoIncrement (GE.initDB).
const seedGhost = (page, note) => page.evaluate((n) => new Promise((res, rej) => {
  const req = indexedDB.open('GhostEchoDB', 1);
  req.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('ghosts')) {
      const s = db.createObjectStore('ghosts', { keyPath: 'id', autoIncrement: true });
      s.createIndex('rackId', 'rackId', { unique: false });
      s.createIndex('faultType', 'faultType', { unique: false });
      s.createIndex('ts', 'ts', { unique: false });
    }
  };
  req.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('ghosts', 'readwrite');
    tx.objectStore('ghosts').add({ rackId: 'US-E2E-R01', faultType: 'link', ts: Date.now(), note: n });
    tx.oncomplete = () => { db.close(); res(true); };
    tx.onerror = () => rej(tx.error);
  };
  req.onerror = () => rej(req.error);
}), note);

const ghostNotes = (page) => page.evaluate(() => new Promise((res, rej) => {
  const req = indexedDB.open('GhostEchoDB', 1);
  req.onsuccess = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains('ghosts')) { db.close(); return res([]); }
    const r = db.transaction('ghosts', 'readonly').objectStore('ghosts').getAll();
    r.onsuccess = () => { db.close(); res((r.result || []).map((g) => g.note)); };
    r.onerror = () => rej(r.error);
  };
  req.onerror = () => rej(req.error);
}));

// A device with real work on it, across a named section, the always-written deploy sections,
// and a registry key.
const DEVICE = {
  'dct_sops_v1': JSON.stringify([{ id: 'SOP-1', title: 'Torque spec' }, { id: 'SOP-2', title: 'Optic cleaning' }]),
  'phantom_deployments_v1': JSON.stringify([
    { id: 'DEP-A', name: 'A', status: 'active' }, { id: 'DEP-B', name: 'B', status: 'active' }, { id: 'DEP-C', name: 'C', status: 'closed' },
  ]),
  'phantom_deploy_racks_v1': JSON.stringify([{ id: 'RK-A1', deploymentId: 'DEP-A', rackId: 'US-E2E-R01' }]),
  'phantom_node_status_v1': JSON.stringify({ 'US-E2E-R01-U12': 'racked' }),
};

// Seeded AFTER boot, through localStorage directly, on purpose: phantom.boot()'s seed is an init
// script that re-applies on every navigation — including the reload the restore ends with — so a
// boot-seeded key would read back as the seed, not as what the restore wrote (04-storage's note).
const seedDevice = (page) => page.evaluate((d) => {
  for (const [k, v] of Object.entries(d)) localStorage.setItem(k, v);
}, DEVICE);

// A minimal, valid backup. Overrides are shallow-merged so a test can add or damage a section.
function bundle(over) {
  return JSON.stringify(Object.assign({
    exported: '2026-09-09T12:00:00.000Z',
    app: 'PHANTOM — Field Intelligence System',
    version: '1.0',
    schemaVersion: 1,
    sops: [{ id: 'SOP-9', title: 'From backup' }],
    deployments: [{ id: 'DEP-1', name: 'Backup deployment', status: 'active' }],
    deployRacks: [{ id: 'RK-1', deploymentId: 'DEP-1', rackId: 'US-E2E-R02' }],
    deployPhases: [{ id: 'PH-1', deploymentId: 'DEP-1', rackId: 'RK-1', type: 'rack', status: 'pending' }],
    keys: { 'phantom_node_status_v1': JSON.stringify({ 'US-E2E-R02-U01': 'pending' }), 'phantom_audits_v1': '[]' },
  }, over || {}));
}

test.describe('The restore says what it replaces, refuses damage before any write, and reports what it recovered', () => {

  test('⛔ the confirm shows device count against backup count, and names what will be CLEARED', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    // The backup carries deployments and sops but no burndown, no handoffs: the restore writes
    // the always-written deploy sections regardless, so what is on the device must be disclosed.
    const dialogs = await driveRestore(page, bundle({ deployRacks: undefined, deployPhases: undefined }));
    const c = confirmOf(dialogs);
    console.log('[52] confirm\n' + c);
    expect(c).toMatch(/Deployments: 3 on this device → 1 in backup/);
    expect(c).toMatch(/SOPs: 2 on this device → 1 in backup/);
    expect(c).toMatch(/Deploy racks: 1 on this device → CLEARED \(not in backup\)/);
    expect(c).toMatch(/2 additional data keys \(1 already on this device/);   // phantom_node_status_v1 exists on the device
    expect(c).toMatch(/This will OVERWRITE current data\./);
    expect(phantom.hardErrors().filter((e) => !/workers\.dev|Access-Control|access control/i.test(e.text))).toEqual([]);
  });

  test('orphans are counted in the confirm and in the report, never dropped in silence', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    const dialogs = await driveRestore(page, bundle({
      deployRacks: [
        { id: 'RK-1', deploymentId: 'DEP-1', rackId: 'US-E2E-R02' },
        { id: 'RK-X', deploymentId: 'DEP-GONE', rackId: 'US-E2E-R09' },   // deployment not in backup
      ],
      deployPhases: [
        { id: 'PH-1', deploymentId: 'DEP-1', rackId: 'RK-1', type: 'rack', status: 'pending' },
        { id: 'PH-X', deploymentId: 'DEP-1', rackId: 'RK-X', type: 'rack', status: 'pending' },  // rack dropped above
      ],
    }));
    const c = confirmOf(dialogs);
    console.log('[52] orphans confirm\n' + c);
    expect(c).toMatch(/DROPPED as orphans/);
    expect(c).toMatch(/1 rack/);
    expect(c).toMatch(/1 phase/);
    const done = lastAlert(dialogs).message;
    console.log('[52] orphans report\n' + done);
    expect(done).toMatch(/^Restore complete/);
    expect(done).toMatch(/[Dd]ropped 1 orphan rack/);
    expect(done).toMatch(/1 orphan phase/);
  });

  test('⛔ a PARTIAL backup keeps this device\'s Ghost Echo, says so before and after, and writes the rest', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    await seedGhost(page, 'device ghost');
    const partial = bundle({
      partial: true,
      readFailures: ['GhostEchoDB:ghosts'],
      ghostEcho: [],
      manifest: [
        { store: 'dct_sops_v1', included: true, recordCount: 1, bytes: 40 },
        { store: 'phantom_deployments_v1', included: true, recordCount: 1, bytes: 60 },
        { store: 'GhostEchoDB:ghosts', included: false, recordCount: 0, bytes: 2, error: 'read failed' },
      ],
    });
    const dialogs = await driveRestore(page, partial);
    const c = confirmOf(dialogs);
    console.log('[52] partial confirm\n' + c);
    expect(c).toMatch(/PARTIAL BACKUP/);
    expect(c).toMatch(/GhostEchoDB:ghosts/);
    expect(c).toMatch(/1 Ghost Echo entr(y|ies) will be KEPT/);
    const done = lastAlert(dialogs).message;
    console.log('[52] partial report\n' + done);
    expect(done).toMatch(/^Restore complete/);
    expect(done).toMatch(/Ghost Echo: KEPT this device's 1 entr/);
    // after the reload: the device ghost survived, the rest was restored
    await page.waitForTimeout(1500);
    expect(await ghostNotes(page)).toEqual(['device ghost']);
    const after = await readAll(page);
    expect(JSON.parse(after['dct_sops_v1'])[0].id).toBe('SOP-9');
  });

  test('⛔ a damaged file is refused before any write: a section that is not a list', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    const before = await readAll(page);
    const dialogs = await driveRestore(page, bundle({ sops: 'not a list' }));
    console.log('[52] damaged ' + JSON.stringify(dialogs));
    expect(dialogs.length, 'exactly one dialog: the refusal').toBe(1);
    expect(dialogs[0].type).toBe('alert');
    expect(dialogs[0].message).toMatch(/damaged/i);
    expect(dialogs[0].message).toMatch(/sops/);
    expect(dialogs[0].message).toMatch(/nothing was changed/i);
    const excluded = await page.evaluate(() => PHANTOM_BACKUP_EXCLUDED_KEYS);
    const material = (snap) => Object.fromEntries(Object.entries(snap).filter(([k]) => !excluded.includes(k)));
    expect(material(await readAll(page))).toEqual(material(before));
  });

  test('a damaged file is refused before any write: the manifest count does not match the file', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    const before = await readAll(page);
    const dialogs = await driveRestore(page, bundle({
      manifest: [{ store: 'phantom_deployments_v1', included: true, recordCount: 5, bytes: 300 }],
    }));
    console.log('[52] manifest mismatch ' + JSON.stringify(dialogs));
    expect(dialogs.length).toBe(1);
    expect(dialogs[0].type).toBe('alert');
    expect(dialogs[0].message).toMatch(/damaged/i);
    expect(dialogs[0].message).toMatch(/manifest says 5/);
    expect(dialogs[0].message).toMatch(/file has 1/);
    expect(dialogs[0].message).toMatch(/nothing was changed/i);
    const excluded = await page.evaluate(() => PHANTOM_BACKUP_EXCLUDED_KEYS);
    const material = (snap) => Object.fromEntries(Object.entries(snap).filter(([k]) => !excluded.includes(k)));
    expect(material(await readAll(page))).toEqual(material(before));
  });

  test('photos the restore does not carry are disclosed before the write', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    const dialogs = await driveRestore(page, bundle({
      discrepancies: [{ id: 'DSC-1', note: 'bent cage nut' }],
      discrepancyPhotos: [{ id: 'PH-1', discrepancyId: 'DSC-1', data: 'x' }, { id: 'PH-2', discrepancyId: 'DSC-1', data: 'y' }],
    }));
    const c = confirmOf(dialogs);
    console.log('[52] photos confirm\n' + c);
    expect(c).toMatch(/2 discrepancy photos/);
    expect(c).toMatch(/not restore/i);
  });

  test('the completion report counts what was written and restores Ghost Echo from a full backup', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    await seedGhost(page, 'device ghost');
    const dialogs = await driveRestore(page, bundle({
      ghostEcho: [{ rackId: 'US-E2E-R02', faultType: 'power', ts: 1750000000000, note: 'backup ghost' }],
    }));
    const done = lastAlert(dialogs).message;
    console.log('[52] full report\n' + done);
    // sops, deployments, + the five always-written deploy sections, + 2 registry keys = 9
    expect(done).toMatch(/^Restore complete\. 9 keys written \(2 from the registry\)/);
    expect(done).toMatch(/Ghost Echo: restored 1 entr/);
    await page.waitForTimeout(1500);
    expect(await ghostNotes(page)).toEqual(['backup ghost']);
  });

  test('⛔ a Ghost Echo write failure is reported, this device\'s entries are unchanged, and the rest still landed', async ({ phantom, page }) => {
    test.setTimeout(90000);
    await phantom.boot();
    await seedDevice(page);
    await seedGhost(page, 'device ghost');
    // Stub on the PROTOTYPE, not the instance. Measured in this harness: an own property set on
    // window.indexedDB vanished within 500 ms on the same page with no reload — WebKit does not
    // keep an expando on a platform-object wrapper alive unless JS holds a reference, so the
    // IDBFactory wrapper was collected and recreated without it. IDBFactory.prototype is a plain
    // JS object and persists. The restore's own open() must fail; the engine's count goes through
    // GE.init, which either has its handle cached from boot or resolves null through this stub.
    await page.evaluate(() => {
      IDBFactory.prototype.open = function () {
        const r = {};
        setTimeout(() => { if (r.onerror) r.onerror({ target: r }); }, 0);
        return r;
      };
    });
    const dialogs = await driveRestore(page, bundle({
      ghostEcho: [{ rackId: 'US-E2E-R02', faultType: 'power', ts: 1750000000000, note: 'backup ghost' }],
    }));
    const done = lastAlert(dialogs).message;
    console.log('[52] idb failure report\n' + done);
    expect(done).toMatch(/^Restore complete/);
    expect(done).toMatch(/Ghost Echo: NOT restored/);
    expect(done).toMatch(/unchanged/);
    await page.waitForTimeout(1500);               // the reload drops the stub
    expect(await ghostNotes(page)).toEqual(['device ghost']);
    const after = await readAll(page);
    expect(JSON.parse(after['dct_sops_v1'])[0].id).toBe('SOP-9');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 53 — A RESTORE SURVIVES ITS OWN RELOAD ON THE APP PATH: EVERY RESTORED KEY BYTE-IDENTICAL,
//      NOTHING RE-SEEDED, NOTHING CREATED BY BOOT
//      (pinned 2026-09-09 from the .585 investigation; owner: "Pin that spec with the honest probe shape")
//
// ⛔ WHY THIS EXISTS. 04-storage's round trip (:461) reads localStorage after the reload a restore
// ends with — while phantom.boot()'s seed, an init script that re-applies on EVERY navigation, is
// still armed. Its post-reload assertions are therefore satisfied by the seed whether or not the
// restore wrote anything. That shape cannot distinguish "the restore worked" from "the harness
// re-seeded". This spec drives the restore on a SECOND PAGE that has no init script: the same
// origin storage, the same app, no harness writer. Anything that changes after the reload is the
// app's own boot — a migration, a backfill, a default — and is reported by name.
//
// ⭐ THE ACCEPTANCE BAR: every key the restore wrote reads back byte-identical after the reload;
// none is missing; boot creates nothing new; the keys the restore did not touch are carried.
// Measured 2026-09-09 on the .585 bytes: 21 same, 0 changed, 0 missing, 0 created.
// ─────────────────────────────────────────────────────────────────────────────
const { test, expect } = require('./fixtures');

const readAll = (p) => p.evaluate(() => {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out[k] = localStorage.getItem(k); }
  return out;
});

// The app's real restore door (phantomImport builds a detached <input type=file>; the filechooser
// event is the only way in), dialogs accepted, returned in order. Same technique as 04-storage / 52.
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
    await expect.poll(() => dialogs.some((d) => d.type === 'alert'), { timeout: 20_000, message: 'the restore raised no completion alert' }).toBe(true);
  } finally { page.off('dialog', handler); }
  return dialogs;
}

// Enter the app on a page that phantom.boot() did not prepare: the return-visit skip usually
// dissolves the splash on its own; tap the gate if it does not.
async function enter(page) {
  const visible = () => page.evaluate(() => { const a = document.getElementById('app'); return !!a && a.classList.contains('visible'); }).catch(() => false);
  for (let i = 0; i < 40 && !(await visible()); i++) {
    await page.locator('#pe-tapcatch').click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(400);
  }
  expect(await visible(), 'the second page never entered the app').toBe(true);
}

const T = 1750000000000;
// One value of every kind the restore writes: named sections, the always-written deploy sections,
// a profile, the EDP cache, and registry keys. Every value is distinct from anything the fixture seeds.
const BUNDLE = {
  exported: '2026-09-09T12:00:00.000Z', app: 'PHANTOM — Field Intelligence System', version: '1.0', schemaVersion: 1,
  sops: [{ id: 'SOP-R', title: 'Restored SOP', body: 'x' }],
  rackMaps: [{ id: 'RM-R', name: 'R09', units: 48 }],
  burndown: [{ id: 'BD-R', name: 'Restored job', items: [] }],
  rackHistory: { 'US-RST-R09': [{ ts: T, action: 'RACKED', detail: 'u1' }] },
  opticInventory: [{ sn: 'OPT-R-1', type: 'QSFP-DD-400' }],
  deployments: [{ id: 'DEP-R', name: 'Restored deployment', status: 'active', created: T, updated: T, createdAt: T, updatedAt: T }],
  deployRacks: [{ id: 'RK-R', deploymentId: 'DEP-R', rackId: 'US-RST-R09', room: 'HALL-9', totalU: 48, slots: [], currentPhase: 'mechanical', hosts: [] }],
  deployPhases: [{ id: 'PH-R', deploymentId: 'DEP-R', rackId: 'RK-R', type: 'mechanical', seqOrder: 1, status: 'pending', tasksTotal: 0, tasksDone: 0 }],
  deployOptics: [],
  deployAudit: [{ id: 'AU-R', deploymentId: 'DEP-R', ts: T, summary: 'restored audit', actor: 'RESTORED' }],
  handoffs: [],
  siteProfile: { schemaVersion: 2, facilityId: 'RST-01', facilityName: 'Restored Facility', operator: 'RESTORED', confirmedAt: T, lastUpdated: T },
  edpCache: { 'edp-r': { at: T } },
  keys: {
    'phantom_node_status_v1': JSON.stringify({ 'US-RST-R09-U01': 'racked' }),
    'phantom_current_user_v1': 'RESTORED-TECH',
    'phantom_audits_v1': JSON.stringify([{ id: 'AUD-R', result: 'pass' }]),
    'phantom_backup_interval_days': '7',
    'phantom_last_backup_ts': String(T),
    'phantom_discrepancies_v1': JSON.stringify([{ id: 'DSC-R', rack: 'US-RST-R09', note: 'restored' }]),
    'phantom_scan_collection': JSON.stringify(['SN-R-1']),
    'phantom_classifier_overrides_v1': JSON.stringify({ 'X-1': 'optic' }),
  },
};

// What the restore WRITES for each key: named sections re-serialised, registry keys verbatim.
// The audit head gets chainReset:true + a truncatedAt timestamp from the restore itself (:56420).
const EXPECTED = {
  'dct_sops_v1': JSON.stringify(BUNDLE.sops), 'dct_racks_v1': JSON.stringify(BUNDLE.rackMaps), 'dct_burndown_v1': JSON.stringify(BUNDLE.burndown),
  'phantom_rack_history': JSON.stringify(BUNDLE.rackHistory), 'phantom_optic_inventory': JSON.stringify(BUNDLE.opticInventory),
  'phantom_deployments_v1': JSON.stringify(BUNDLE.deployments), 'phantom_deploy_racks_v1': JSON.stringify(BUNDLE.deployRacks),
  'phantom_deploy_phases_v1': JSON.stringify(BUNDLE.deployPhases), 'phantom_deploy_optics_v1': '[]',
  'phantom_site_profile_v1': JSON.stringify(BUNDLE.siteProfile), 'phantom_handoff_v1': '[]', 'phantom_edp_cache_v1': JSON.stringify(BUNDLE.edpCache),
  ...BUNDLE.keys,
};

test.describe('A restore survives its own reload on the app path', () => {

  test('⛔ every restored key reads back byte-identical after the reload, with no harness seed on the page', async ({ phantom, page, context }) => {
    test.setTimeout(150000);
    await phantom.boot();                          // page A: the harness-seeded profile, the SW registered
    const B = await context.newPage();             // page B: same storage, NO init script
    await B.goto('/dct-ios.html', { waitUntil: 'domcontentloaded' });
    await enter(B);

    const before = await readAll(B);
    const dialogs = await driveRestore(B, JSON.stringify(BUNDLE));
    const last = dialogs[dialogs.length - 1];
    expect(last.type).toBe('alert');
    expect(last.message).toMatch(/^Restore complete\./);
    await B.waitForTimeout(4000);                  // the reload, then every boot-time writer
    const after = await readAll(B);

    const changed = [], missing = [];
    for (const [k, v] of Object.entries(EXPECTED)) {
      if (!(k in after)) { missing.push(k); continue; }
      if (after[k] !== v) changed.push(k + ' → ' + after[k].slice(0, 160) + '   (restore wrote ' + v.slice(0, 100) + ')');
    }
    // The audit head is stamped by the restore, not by boot: assert its shape, not its timestamp.
    const audit = JSON.parse(after['phantom_deploy_audit_v1'] || '[]');
    expect(audit.length).toBe(1);
    expect(audit[0].id).toBe('AU-R');
    expect(audit[0].chainReset).toBe(true);
    expect(typeof audit[0].truncatedAt).toBe('number');

    // Session and heartbeat keys (PHANTOM_BACKUP_EXCLUDED_KEYS :55311 — the tab-presence beacon, the
    // brief timestamp, the seen-boot flag) are the app talking to itself; boot rewrites them by
    // design. They are excluded from the backup for the same reason and are excluded here.
    const excluded = await B.evaluate(() => PHANTOM_BACKUP_EXCLUDED_KEYS);
    const material = (k) => !(k in EXPECTED) && k !== 'phantom_deploy_audit_v1' && !excluded.includes(k);
    const created = Object.keys(after).filter((k) => material(k) && !(k in before));
    const carried = Object.keys(after).filter((k) => material(k) && (k in before));
    console.log('[53] same=' + (Object.keys(EXPECTED).length - changed.length - missing.length) + ' changed=' + changed.length + ' missing=' + missing.length + ' createdByBoot=' + created.length + ' carried=' + carried.join(','));
    if (changed.length) console.log('[53] CHANGED BY BOOT:\n  ' + changed.join('\n  '));

    expect(missing, 'keys the restore wrote are gone after the reload').toEqual([]);
    expect(changed, 'boot rewrote keys the restore had just written').toEqual([]);
    expect(created, 'boot created keys after the restore that did not exist before it').toEqual([]);
    for (const k of carried) expect(after[k], 'a key the restore did not touch changed across the reload: ' + k).toBe(before[k]);
  });
});

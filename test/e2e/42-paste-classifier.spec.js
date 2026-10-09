// 42 — THE PASTE CLASSIFIER (pure). Shape only, never meaning; offline by construction.
// ⭐ The adversarial block matters more than the happy path: the failure that hurts a technician
// is being routed CONFIDENTLY into the wrong parser, which wastes the paste and teaches them not
// to trust the door. Every ambiguous input must land on 'unknown', not on a best guess.
const { test, expect } = require('./fixtures');

const classify = (page, text) => page.evaluate((t) => paste_classify(t), text);

const PORTMAP = 'A01 · U3 · SW-SPINE-01 Eth1/1 → B04 · U7 · GPU-01 Eth1/1\n'
              + 'A01 · U3 · SW-SPINE-01 Eth1/2 → B04 · U8 · GPU-02 Eth1/1';
const PORTMAP_CSV = 'src_rack,src_port,dst_rack,dst_port,optic\nA01,Eth1/1,B04,Eth1/1,SR4';
const ELEVATION = 'U1, 2U, PDU-A, PDU, Vertiv GeistV2\nU3, 1U, SW-SPINE-01, switch, Arista 7050CX3\nU4-U7, 4U, GPU-01, gpu, GB300';
const CLI = '# show interfaces Eth1/1 transceiver\nEth1/1  Rx Power: -2.31 dBm  Tx Power: -1.90 dBm';
const BOM = 'part,qty,description,vendor\nMCX713106AS,8,ConnectX-7 NIC,NVIDIA';
// Realistic vendor-EDP text carrying the full, unambiguous phrase — a bare "EDP" alone must
// never be enough (see the fix-round-1 regression case below), so this is the happy path that
// proves the strict rule still recognises a real one.
const EDP = 'VENDOR EQUIPMENT DATA PACK — GB300 NVL72 Rack Unit\n'
          + 'Document Type: Equipment Data Pack (EDP)\n'
          + 'Manufacturer: NVIDIA\n'
          + 'Model: GB300-NVL72\n'
          + 'Serial: SN-88213-A\n'
          + 'Ship Date: 2026-07-02\n'
          + 'Received: 2026-07-14\n'
          + 'Inspected By: J. Alvarez\n'
          + 'Notes: no shipping damage observed, all crates intact.';

test.describe('paste classifier', () => {

  test('identifies each real format from shape alone', async ({ phantom, page }) => {
    await phantom.boot();
    expect((await classify(page, PORTMAP)).verdict).toBe('portmap');
    expect((await classify(page, PORTMAP_CSV)).verdict).toBe('portmap');
    expect((await classify(page, ELEVATION)).verdict).toBe('elevation');
    expect((await classify(page, CLI)).verdict).toBe('cli');
    expect((await classify(page, BOM)).verdict).toBe('bom');
    expect((await classify(page, EDP)).verdict).toBe('edp');
  });

  // ⭐ THESE MATTER AS MUCH AS THE ADVERSARIAL BLOCK. Rounds 1 and 2 tightened the keyword rules
  // until they started refusing REAL pastes — a door that refuses real pastes is just a broken
  // door with good manners. Each case below is a genuine export or terminal capture that the
  // round-2 classifier returned 'unknown' for, and each names the anchor that rejected it.
  test('⭐ real pastes are not refused for being messy', async ({ phantom, page }) => {
    await phantom.boot();
    for (const [name, want, text] of [
      // Rejected because the src/dst check was anchored to lines[0] only.
      ['port-map CSV under a comment banner', 'portmap',
        '// exported from cabling tool v3\n' + PORTMAP_CSV],
      // Same cause: real exports put a "do not edit" banner above the header row.
      ['BOM CSV under a comment banner', 'bom',
        '# BOM export 2026-08-19, do not edit below this line\n' + BOM],
      // Rejected because the prompt marker was anchored with ^[#>$] at position 0.
      ['CLI echo behind a capture timestamp', 'cli',
        '[14:02:11] # show interfaces Eth1/1 transceiver\n'
        + '[14:02:12] Eth1/1  Rx Power: -2.31 dBm  Tx Power: -1.90 dBm'],
      // Found by round-3 adversarial probing, same anchor: a real device prompt carries the
      // HOSTNAME in front of the marker, which ^[#>$] also rejected.
      ['CLI echo behind a device hostname prompt', 'cli',
        'spine1# show interfaces Eth1/1 transceiver\n'
        + 'Eth1/1  Rx Power: -2.31 dBm  Tx Power: -1.90 dBm'],
      // A spreadsheet copy quotes its fields; an exact-field header match must see through that.
      ['BOM CSV copied out of a spreadsheet', 'bom',
        '"part","qty","description","vendor"\n"MCX713106AS","8","ConnectX-7 NIC, 400G","NVIDIA"'],
      // A CSV row may legitimately end in a full stop. Column shape outranks punctuation.
      ['BOM CSV whose notes column ends in a full stop', 'bom',
        'part,qty,description,vendor,notes\n'
        + 'MCX713106AS,8,ConnectX-7 NIC,NVIDIA,Spare units held in the cage for now.'],
      // Title line above, human note below — the ordinary shape of a pasted export.
      ['port map wrapped in a title and a trailing note', 'portmap',
        'Port map for row A, exported 2026-08-19\n' + PORTMAP + '\nNote: please confirm optics before install.'],
      // ⚠ THE OPPOSITE FAILURE FOR ROUND 4. Requiring TWO document fields must not start refusing
      // short real EDPs — over-tightening is the failure mode that broke rounds 2 and 3, and it is
      // invisible unless a positive fixture exists to catch it. Two fields is the new floor, so
      // this is the smallest EDP that may still classify.
      ['a short vendor EDP carrying only two document fields', 'edp',
        'Equipment Data Pack\nManufacturer: NVIDIA\nModel: GB300-NVL72'],
    ]) {
      const r = await classify(page, text);
      expect(r.verdict, `${name} was refused (got ${r.verdict})`).toBe(want);
    }
  });

  test('⛔ ambiguous and unrecognisable input returns unknown, never a guess', async ({ phantom, page }) => {
    await phantom.boot();
    for (const [name, text] of [
      ['free prose', 'rack looks hot, check with Dave before EOD'],
      ['a bare URL', 'https://example.com/thing'],
      ['whitespace', '   \n\n  \t '],
      ['empty', ''],
      ['one word', 'racks'],
      // ⛔ FIX ROUND 1 REGRESSIONS — found by running the classifier, not by inspection. Each of
      // these previously cleared BOTH decision thresholds off one weak/coincidental signal, with
      // second = 0, so the tie-break arithmetic (which only resolves genuine cross-category ties)
      // never engaged. Pinned here so none of the three can regress silently.
      ['a "show" word that is prose, not a command echo',
        'show status update: rack cooling nominal, no action needed'],
      ['a shift note that mentions EDP once but is otherwise prose',
        'Shift handoff notes for night crew:\n'
        + 'Aisle 3 temps look fine, no alarms since 18:00.\n'
        + 'Ran into a delay waiting on the EDP from the vendor rep, should land tomorrow.\n'
        + 'Cabinet B12 door sensor still flaky, ticket open.\n'
        + 'Fiber spool count looks short, will recount in the morning.\n'
        + 'No blockers on the GPU install otherwise.\n'
        + 'Coffee machine on level 2 is out again.\n'
        + 'Reminder: badge access renewal due Friday.\n'
        + 'Handing off to Dana at 06:00.'],
      ['informal arrows in planning prose, not port endpoints',
        "let's move from Plan A -> Plan B -> Plan C for tomorrow"],
      // ⛔ FIX ROUND 2 REGRESSIONS — same root cause, three more instances: a command word and its
      // "corroborating" signal were merely present SOMEWHERE in the same blob, not structurally
      // related to each other. Pinned here so none can regress silently.
      ['cli command word and a counter term in unrelated sentences',
        "ethtool was the topic on today's call.\nSomeone also mentioned FCS drift on an old switch, unrelated issue."],
      ['cli command word and port tokens in one unrelated prose sentence',
        'perfquery training is postponed. Eth1/1 and Eth2/1 were swapped yesterday for an unrelated reason, no other news.'],
      ['cli command word buried mid-note, counter term on a different unrelated line',
        'Site walk notes, aisle 4:\n'
        + 'Temps nominal, no alarms triggered.\n'
        + 'ethtool link status confirmed fine on spare NICs.\n'
        + 'Rx Power looked normal on last optics check, unrelated to this walk.\n'
        + 'No further action needed today.'],
      ['bom vocabulary word in an ordinary comma sentence, not a header row',
        "Thanks for looping in the vendor, we'll proceed as discussed on the call."],
      ['edp full phrase mentioned once in an ordinary status update, not a document',
        'Still waiting on the equipment data pack from the vendor rep before I can close this ticket out tonight'],
      // ⛔ FIX ROUND 3 — the round-2 rules were defeated AGAIN by fresh sentences carrying the
      // same trigger words, which is why the design changed: prose can always contain the
      // keywords, so vocabulary can never be the discriminator. A structural gate now runs
      // BEFORE scoring, and a lone sentence can no longer classify whatever words it holds.
      ['prose asking for Rx Power work',
        'show any Rx Power anomalies to Dave before EOD, thanks.'],
      ['prose reporting a perfquery result',
        'perfquery flagged CRC errors on three ports overnight, ticket filed for review.'],
      ['prose reporting an ethtool result',
        'ethtool showed FCS errors climbing on spine2 this morning, keep an eye on it.'],
      ['prose scheduling ethtool work, with a counter term',
        'ethtool output review scheduled for tomorrow, Tx Power levels on some optics look low per last report.'],
      // ⭐ THREE commas — enough delimiters to look structural. It is still a sentence: split on
      // its commas it yields two labels and two clauses, and a column label is not a clause.
      ['a sentence carrying three commas and two BOM header words',
        'Vendor, quantity, and description all match the packing slip, nothing else to flag here today.'],
      ['a request naming two BOM header words',
        'vendor, description, please confirm these two fields are correct before we proceed further today'],
      // ⛔ ROUND-3 SELF-PROBING — found by attacking the new gate, not reported by a reviewer.
      // Each one clears the gate's line-shape tests and had to be stopped by the header rule
      // ("a header row is labels, and labels are short") or by the prose veto.
      ['a ticket asking for src/dst columns to be added',
        'Columns needed: src rack, src port, dst rack, dst port\nAlso add optic, length, media'],
      ['two comma-lists, one of them carrying BOM header words',
        'Dave, Priya, and Marcus are on shift\nvendor, description, and qty still need checking'],
      ['an imperative asking for command output, with counter terms',
        'show me the ethtool output, the FCS numbers, and the CRC deltas\n'
        + 'Rx Power, Tx Power, CRC counts all looked fine yesterday'],
      ['counter terms with real numbers, but written as prose',
        'Rx Power dropped to -3 on Eth1/1 yesterday\nTx Power was -2 on Eth1/2 as well'],
      ['a chat log that happens to be timestamped',
        '[14:02] Dave: check the vendor, description, and qty fields\n[14:06] Me: will do after the walk'],
      ['planning arrows on two separate lines',
        'Plan A -> Plan B for the spine cutover\nThen Plan B -> Plan C if the optics are late'],
      // ⛔ FIX ROUND 4 — the last rule the structural gate had NOT been applied to. A status note
      // ABOUT an EDP is not an EDP: the phrase, the acronym echo and ONE document field cleared a
      // rule that asked for "a document-field line" in the singular. A document carries a
      // document's worth of fields, so the corroborator is now COUNTED. ⚠ The `^field:` anchor is
      // untouched — it survived every attack; the quantity of evidence it carried was the defect.
      ['a status note about an EDP, with the acronym echo and one document field',
        'Equipment Data Pack (EDP) status:\nVendor: still waiting\nReceived: not yet'],
    ]) {
      const r = await classify(page, text);
      expect(r.verdict, `${name} was classified as ${r.verdict}`).toBe('unknown');
    }
  });

  test('⛔ CSV-vs-CSV does not collide — the real ambiguity in this set', async ({ phantom, page }) => {
    await phantom.boot();
    // Both are comma headers. They separate on header TOKENS, not on being CSV.
    expect((await classify(page, BOM)).verdict).toBe('bom');
    expect((await classify(page, PORTMAP_CSV)).verdict).toBe('portmap');
    // A CSV with neither vocabulary is not a coin flip.
    const NEITHER = 'alpha,beta,gamma\n1,2,3';
    expect((await classify(page, NEITHER)).verdict).toBe('unknown');
  });

  test('every verdict except unknown has a routing target', async ({ phantom, page }) => {
    await phantom.boot();
    const t = await page.evaluate(() => PASTE_TARGETS);
    for (const v of ['portmap', 'elevation', 'cli', 'bom', 'edp']) {
      expect(t[v], `${v} has no target`).toBeTruthy();
      expect(t[v].box, `${v} has no destination box id`).toBeTruthy();
      expect(t[v].label, `${v} has no button label`).toBeTruthy();
    }
    // ⚠ Assert the DOORS exist, because two of the five are not OPS_TABS entries: the CLI parser
    // has goCliParser and vendor EDP has vendorEdp_open. A table that assumed rd_openOpsTool for
    // all five would toast "Unknown tool" for those two.
    const doors = await page.evaluate(() => ({
      rd: typeof rd_openOpsTool, cli: typeof goCliParser, edp: typeof vendorEdp_open,
      tabs: Object.keys(OPS_TABS || {}),
    }));
    expect(doors.rd).toBe('function');
    expect(doors.cli, 'goCliParser is missing — the CLI route has no door').toBe('function');
    expect(doors.edp, 'vendorEdp_open is missing — the EDP route has no door').toBe('function');
    for (const k of ['portmap', 'rackmap', 'bom']) {
      expect(doors.tabs, `OPS_TABS has no '${k}' entry`).toContain(k);
    }
    expect(t.unknown, 'unknown must NOT have a target — it routes nowhere').toBeFalsy();
  });

  test('bounded input cannot change a verdict', async ({ phantom, page }) => {
    await phantom.boot();
    // 4,000 lines of noise appended AFTER a clear elevation header must still read as elevation:
    // the bound reads the opening lines, and every format here is identifiable from them.
    const padded = ELEVATION + '\n' + Array.from({ length: 4000 }, (_, i) => 'noise line ' + i).join('\n');
    expect((await classify(page, padded)).verdict).toBe('elevation');
  });
});

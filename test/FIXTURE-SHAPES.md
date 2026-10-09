# PHANTOM — POPULATED FIXTURE SHAPES

**Measured 2026-08-06 against `dct-ios.html` @ v1.14.405 by two read-only discovery agents.**

Groundwork for **OWNER RULING 4** (a representative populated Master/rack fixture, so Build metrics,
phases, devices, platform, blockers and Forge can be tested against real populated state).
Every shape below carries the line number of the code that READS it. Re-confirm before relying on
any of it — line numbers drift, and a wrong shape produces a fixture that silently tests nothing.

Consumed by `test/e2e/fixtures-populated.js` (not yet written).

---

## AREA: MASTER

### `localStorage['phantom_master_v1'] — the ONLY Master key. Value is LZString.compressToUTF16(JSON.stringify(payload)), NOT plain JSON.`

**Reader:** dct-ios.html:31440 (PHANTOM_MASTER_STORE.load) → dct-ios.html:52519 (boot-restore IIFE) → dct-ios.html:52521 assigns window._lastPhantomMaster

```js
// PHANTOM_MASTER_STORE.save payload, verbatim dct-ios.html:31403-31420.
// This is a WHITELIST: exactly these 7 fields, nothing else.
{
  schemaVersion: 1,            // :31404 — load() rejects any other value, :31450
  savedAt: '2026-08-06T12:00:00.000Z',   // :31405 new Date().toISOString()
  sourceFileHash: 'sha256:<hex>' | null, // :31406 LIFTED OUT of parseResult.stats
  siteCode: 'TEST-01' | null,  // :31407
  sourceFile: 'TEST-01-master.xlsx' | null, // :31411
  siteVars: {<lowercased key>: '<verbatim value>'} | null, // :31418
  racksByCab: { '<row>:<cab>': {...} }   // :31419 persisted WHOLE and DEEP
}
// save() returns false immediately unless parseResult.racksByCab is truthy (:31402).
```

### `window._lastPhantomMaster — the live handle every Master surface reads. TWO DIFFERENT SHAPES depending on provenance.`

**Reader:** dct-ios.html:32544 master_hasMaster (requires Object.keys(racksByCab).length > 0); :19318 deploy_forge_master; :31954 mscope_master; :32986 master_findRack; :33264 master_renderLoaded

```js
// A) FRESH PARSE (phantom_parseMaster returns `site`, :31802-31831), assigned :31896:
{
  siteCode, siteName,               // :31803, :31804
  sourceFile,                        // :31810
  stats: { totalCabinets, totalHosts, totalCables, cableSource,
           sheetsParsed, sheetsSkipped, parseMs, sourceFileHash }, // :31810-31822
  racksByCab, hosts: [], cables: [], // :31824, :31825, :31826  (hosts/cables are FLAT copies)
  legends: { net:null, gpu:null, cpu:null },  // :31827 — written once, ZERO readers in the file
  siteVars,                          // :31828
  ingestedAt: Date.now(),            // :31829
  schemaVersion: 1                   // :31830
}
// B) COLD-START RESTORE (:52521) = Object.assign({}, <save payload>, {restoredFromStorage:true}):
{ schemaVersion, savedAt, sourceFileHash, siteCode, sourceFile, siteVars,
  racksByCab, restoredFromStorage: true }
// NO siteName, NO stats, NO flat hosts[], NO flat cables[], NO legends, NO ingestedAt.
```

### `racksByCab['<row>:<cab>'] — the cabinet roster entry. Keys are built from BOTH host rows AND cable endpoints.`

**Reader:** dct-ios.html:19326 deploy_forge_rackList (Object.keys → every cab becomes an aisle cabinet); :31967 mscope_groupByRow; :32891 master_rackToElevation; :32999 master_findRack

```js
// ensureRack literal, verbatim :31659:
{ cabId: 'tx1:001', locode: 'TEST-01', hosts: [], cablesOut: [], cablesIn: [] }
// KEY FORMAT IS LAW: _phantom_master_rackOf (:31359) applies
//   _PHANTOM_MASTER_RACK_RE = /^([a-z0-9]+:[0-9]+)(?::|$)/  (:31350)
// to a LOWERCASED loc string, so the key is the first two colon segments, lowercase.
// THREE writers create a rack:
//   :31709 ensureRack(aRack, aLocode).cablesOut.push(cable)   <- cable A-endpoint
//   :31710 ensureRack(zRack, zLocode).cablesIn.push(cable)    <- cable Z-endpoint
//   :31757 ensureRack(hRack, hLocode).hosts.push(host)        <- SITE-HOSTS row
// => a cable-endpoint-only cab is a FIRST-CLASS rack with hosts: [] (owner ruling R-06).
// NOTE: the parser NEVER writes `totalU` on a rack. master_rackToElevation reads it
// (:32922) but on a real Master it is always undefined and floors to max(maxU, 48).
```

### `racksByCab[cab].hosts[i] — the SITE-HOSTS row. 20 fields, ALL strings (_phantom_master_norm, :31352).`

**Reader:** dct-ios.html:32895 master_rackToElevation (dns→name, model, serial, type, hgtUnknown); :25786 site_derivePlatformsFromMaster reads .model only; :33498 master_findMatches searches every field except ipv4/ipv6/asn

```js
// verbatim :31735-31755
{
  lastProvisioned: '',  locode: 'TEST-01',      // locode is n() — NOT lowercased
  locCabRu: 'tx1:001:14',                        // nLow() — LOWERCASED. '<row>:<cab>:<U>'
  dns: 'tx1-gpu-01',    model: 'NVIDIA HGX H100 8-GPU',
  serial: '',           rowType: '',   role: '',   tags: '',
  ipv4: '',  ipv6: '',  gridGroup: '', grid: '',  gridPod: '',
  asn: '',   rail: '',  plane: '',     superpodId: '', leafGroupId: '', fabric: ''
}
// Row is admitted ONLY if nLow(col3) matches
//   _PHANTOM_MASTER_CAB_RE = /^[a-z0-9]+:[0-9]+:[0-9]+/   (:31349, tested :31727)
// U POSITION: master_extractRu splits locCabRu on ':' and parseInt's parts[2] (:32562-32569).
//   parts.length < 3 or non-numeric => null => host lands in elevation.unplaced (:32897).
// TYPE and HEIGHT ARE DERIVED, NOT SETTABLE. Both classifiers read model + ' ' + dns:
//   master_hostType (:32835) -> 'gpu'|'cdu'|'pwr'|'sw'|'patch'|'fw'|'stor'|'cpu'|'media'|'server'|'other'
//   master_nodeHeightInfo (:32807) -> {u, known}: (1) /(\d+)\s*-?\s*ru\b/ on MODEL ONLY (:32811),
//       (2) MASTER_U_TABLE regex on model+dns (:32674), (3) else {u:null, known:false}.
```

### `racksByCab[cab].cablesOut[i] and .cablesIn[i] — the WIP/CUTSHEET row. 18 fields, all strings.`

**Reader:** dct-ios.html:35976-36007 rackElevation_render3D (aDns/zDns resolved against slot.name/slot.dns via _rec_norm to build the purple tubes); :49238-49251 preflight_run reads aDns/aPort/zDns/zPort/aOptic/zOptic/aModel/zModel/aLoc/cable; :49188 _pf_collectCables

```js
// verbatim :31686-31706
{
  aLoc: 'tx1:001:14',        // nLow(row[2]) — LOWERCASED, must match CAB_RE
  aDns: 'tx1-gpu-01', aModel: '', aPort: 'eth0',
  aBreakoutCab: '',   aBreakoutSlotPort: '', aOptic: 'QSFP-400G', aPatch: '',
  zLoc: 'tx1:001:44',        // nLow(row[11]) — LOWERCASED, must match CAB_RE
  zDns: 'tx1-leaf-01', zModel: '', zPort: 'swp1',
  zBreakoutCab: '',   zBreakoutSlotPort: '', zOptic: 'QSFP-400G', zPatch: '',
  cable: 'C-0001',
  source: 'WIP' | 'CUTSHEET'   // = cableSource, WIP wins when both sheets exist (:31643)
}
// ⚠ INTRA-RACK CABLE IS DOUBLE-PUSHED BY DESIGN: when aRack === zRack the SAME object
//   goes into cablesOut (:31709) AND cablesIn (:31710). The 3D renderer depends on this
//   (:35994-36007: draw from cablesOut only, count cablesIn as already-drawn).
// CROSS-RACK: object goes in the A-rack's cablesOut and the Z-rack's cablesIn.
```

### `siteVars — flat lower-cased key/value map from the SITE-VARS sheet (v1.14.346).`

**Reader:** dct-ios.html:25816 master_siteVars (returns null for an EMPTY object — {} reads as 'no site vars'); :25847 site_prefillProfileFromMaster

```js
{ 'locode': 'TEST-01', 'rack-naming': '<row>:<cab>', 'pdu-type': '...', 'standard-optic': '...' , ...any other key verbatim }
// Keys lower-cased (nLow, :31778); values kept verbatim (n, :31779).
// A 'KEY | VALUE' header row is dropped (:31782). Empty map => siteVars stays null (:31785).
// ONLY 4 keys have a profile writer — SITE_VARS_PROFILE_MAP (:31831 in source order, decl :25831):
//   ['locode','site']->facilityId, ['rack-naming']->rackNamingConvention,
//   ['pdu-type']->pduType, ['standard-optic']->standardOptics
// Every other key is carried but only shown read-only. `platforms` is DELIBERATELY unmapped.
```

### `localStorage['phantom_deploy_racks_v1'][i] — ⛔ THIS, NOT THE MASTER, IS WHAT BUILD'S METRICS READ.`

**Reader:** dct-ios.html:20403 bw_metrics (rack.hosts → componentsTotal); :20406 (x.installed===true || x.status==='installed' || x.status==='complete' → components); :20499 platform chip; :20501 vendor sub-label; :35473 rackElevation_render3D reads rack.slots + rack.totalU

```js
// deploy_seedRacksAndPhases writes EXACTLY this, verbatim :29312-29321:
{ id: 'rack_<depId>_<idx>', deploymentId: '<depId>',
  rackId: '<cabId>',        // = mscope rack.name = the Master cab key (:32306 -> :29314)
  room: '<locode>', totalU: 48, slots: [ /* master_rackToElevation slots */ ],
  notes: '', powerCircuits: [], currentPhase: 'mechanical' }
// slot contract (master_rackToElevation :32906-32915 / forge :19388):
//   { uStart, uEnd, name, model, type, serial, dns, hgtUnknown }
// ⛔ THERE IS NO `hosts` FIELD AND NO `platform` FIELD. Nothing in dct-ios.html writes one
//    onto a deployment rack (grep 'hosts:' -> only Master/jobsnap literals).
// Yet bw_metrics reads rack.hosts (:20403) and bw_render reads rack.platform /
//    rack.hosts[0].platform / rack.hosts[0].model / rack.hosts[0].type (:20499, :20501).
// To exercise the POPULATED metrics + platform chip your fixture must ADD:
//   hosts: [{ platform|model: 'NVIDIA HGX H100 8-GPU', type: 'gpu',
//             installed: true | status: 'installed'|'complete' }, ...]
// — a shape the app READS but never WRITES. Record it as such; do not present it as
//   what a real seeded rack looks like.
```

### `localStorage['phantom_site_profile_v1'] — the platform DERIVATION target and the gate that silently kills it.`

**Reader:** dct-ios.html:25772 site_derivePlatformsFromMaster; :25741 siteProfile_isConfirmed; :25753 phantom_siteLabel (facilityName || facilityId) — read by bw_render at :20441 for the BUILD header site label

```js
// SITE_PROFILE_KEY = 'phantom_site_profile_v1' (:22855). Shape from SITE_PROFILE_DEFAULTS (:25678):
{ facilityId:'', facilityName:'', platforms:[], standardOptics:'', rackNamingConvention:'',
  pduType:'', floorZones:'...', buildLead:'', operator:'',
  confirmedAt: null,          // :25688 — ⛔ THE GATE
  schemaVersion: 2, lastUpdated: null,
  sources: { <field>: 'master' }   // additive provenance written by :25868
}
// site_derivePlatformsFromMaster writes each entry as (:25798):
//   { id: '', display: <host.model verbatim>, role: _TMAP[master_hostType({model})] || 'other',
//     source: 'master' }
// ⛔ BOTH Master->profile writers bail on line 1 unless siteProfile_isConfirmed() is true:
//   :25774 (derivePlatforms) and :25849 (prefillProfile). A fresh harness device has
//   confirmedAt === null, so BOTH silently no-op and the Master's platforms never appear.
//   Seed confirmedAt (a ms timestamp) to see either. Also: any existing platforms[] entry
//   with source !== 'master' blocks the whole derivation (:25781).
```

**Consumers**

- dct-ios.html:52517 _phantom_master_bootRestore — the ONLY writer of restoredFromStorage; calls site_derivePlatformsFromMaster (:52522) and site_prefillProfileFromMaster (:52523) after hydrating
- dct-ios.html:32544 master_hasMaster — the app-wide 'is a Master loaded' predicate. Requires racksByCab to be an object with Object.keys().length > 0. Gates bw_ctx.master (:20375) and the shift-start cold state (:21600)
- dct-ios.html:19318 deploy_forge_master / :19323 deploy_forge_rackList — the Forge aisle roster. Object.keys(racksByCab) => EVERY cab becomes a cabinet, host-less or not
- dct-ios.html:19334 deploy_forge_siteLabel — the aisle herotag: String(m.siteCode).toUpperCase(), else 'MASTER'
- dct-ios.html:19345 deploy_forge_provenance — writes #forge3d-prov; 'NO MASTER LOADED' when deploy_forge_master() is null (:19349); reads sourceFile (:19353) and savedAt || ingestedAt (:19352)
- dct-ios.html:19377 deploy_forge_slots — per-cab slot build: master_rackToElevation -> _TMAP[s.type] || 'unknown' (:19389) -> phantom_rackGeometry conflicts/overflow (:19403) -> deploy_forge_strayOf (:19411) -> _unplacedCache (:19414)
- dct-ios.html:32891 master_rackToElevation — THE bridge. rack.hosts[] -> {id, totalU, slots[], unplaced[]}. totalU = rack.totalU || max(maxU, 48) (:32922). Empty hosts[] => slots:[], unplaced:[], totalU:48
- dct-ios.html:32835 master_hostType — raw type vocabulary, from model + ' ' + dns
- dct-ios.html:32807 master_nodeHeightInfo + :32674 MASTER_U_TABLE — height vocabulary; unknown => hgtUnknown:true and a 1U placeholder footprint
- dct-ios.html:19227 TYPE_COLOR / :19234 _TMAP — the DISPLAY vocabulary. _TMAP = {gpu:'gpu', sw:'switch', pwr:'pdu', patch:'patch', stor:'storage', cpu:'server', server:'server', cdu:'pdu', fw:'switch', media:'media', other:'unknown'}
- dct-ios.html:32986 master_findRack — deployment-rack -> Master bridge. Exact case-folded match on the cab KEY (:33001), then on a nested host dns (:33015). Returns {id, source:'master', hosts, cablesOut, cablesIn}
- dct-ios.html:35436 rackElevation_render3D — reads rack.slots / rack.totalU (:35473); cable tubes resolved through master_findRack at :35975; builds the .reh-3d-seg CABLES pill (:36049), the FRONT/ISO/TOP/REAR rail (:36097) and EXPLODE (:36107)
- dct-ios.html:20373 bw_ctx / :20399 bw_metrics / :20424 bw_render — the Build workspace. bw_ctx.master comes from master_hasMaster, but every metric comes from deploy_loadRacksFor/deploy_loadPhasesFor, NOT from the Master
- dct-ios.html:31962 mscope_groupByRow — row grouping for the scope picker: row = cabId.split(':')[0]; per-cab counts hosts.length and cablesOut.length + cablesIn.length
- dct-ios.html:32079 mscope_render — reads m.siteName || m.siteCode (:32103), m.restoredFromStorage (:32095), and the cab-only fidelity banner (:32108)
- dct-ios.html:32203 mscope_confirm -> :32298 mscope_buildRacksFromSnapshot — freezes racksByCab into phantom_jobsnap_v1, then shapes each cab as {name, room, totalU, slots} (:32306-32310) for deploy_seedRacksAndPhases
- dct-ios.html:29301 deploy_seedRacksAndPhases — writes phantom_deploy_racks_v1 and phantom_deploy_phases_v1 (5 phases per rack, DEPLOY_PHASE_TYPES :28645)
- dct-ios.html:33259 master_renderLoaded — the Master tab banner: siteCode, Object.keys(racks).length, savedAt || ingestedAt (:33271), sourceFile + 'RESTORED FROM CACHE' (:33277-33281)
- dct-ios.html:33030 master_renderHit — hosts.length > 0 ? elevation : cablesOut+cablesIn > 0 ? cabling list : nodata. THE host-less-cab routing fork
- dct-ios.html:33233 master_renderElevationView — slots.length === 0 renders 'no hosts with a U position on record' (:33236); unplaced renders .master-unplaced (:33241)
- dct-ios.html:33487 master_findMatches — searches EVERY field on a rack and its hosts except {ipv4, ipv6, asn, hosts, cablesOut, cablesIn} (:33498)
- dct-ios.html:33374 master_sampleCab / :33382 master_namespaceHtml — the 'IN THIS MASTER · TAP A PREFIX' block, grouped by the cabId prefix before ':'
- dct-ios.html:49186 _pf_collectCables + :49197 preflight_run — prefers the flat master.cables (:49188), falls back to concatenating racksByCab[].cablesOut (:49190). Reads sourceFileHash from either location (:49202)
- dct-ios.html:31474 master_purgeCached — reads sourceFile, savedAt || ingestedAt, siteCode, Object.keys(racksByCab).length; clears the store and sets window._lastPhantomMaster = undefined (:31500)
- dct-ios.html:25772 site_derivePlatformsFromMaster / :25847 site_prefillProfileFromMaster — the only two Master->site-profile writers, both gated on siteProfile_isConfirmed()

**⛔ Gotchas**

- THE KEY IS COMPRESSED, NOT JSON. phantom_master_v1 holds LZString.compressToUTF16(JSON.stringify(payload)) (:31421). A plain-JSON seed makes decompressFromUTF16 return empty and load() bails at :31446. LZString comes from a static <script src="./vendor/lz-string.min.js"> at :16391, so window.LZString exists before the boot-restore IIFE at :52517 — but NOT inside a Playwright addInitScript. Seed with page.evaluate(() => localStorage.setItem('phantom_master_v1', LZString.compressToUTF16(JSON.stringify(p)))) then page.reload(), and verify AFTER the reload.
- THE save() WHITELIST DROPS SIX THINGS. Present after a fresh parse (:31802), GONE after a cold start: siteName (:31804), the whole stats object (:31810 — totalCabinets/totalHosts/totalCables/cableSource/sheetsParsed/sheetsSkipped/parseMs), the flat hosts[] (:31825), the flat cables[] (:31826), legends (:31827), ingestedAt (:31829). Only stats.sourceFileHash survives, LIFTED to the top level by :31406 — which is why readers write `(m.stats && m.stats.sourceFileHash) || m.sourceFileHash` (:32242) and `master.sourceFileHash || (master.stats && ...)` (:49202).
- WHAT DOES SURVIVE: racksByCab is persisted WHOLE AND DEEP, so the NESTED hosts[], cablesOut[] and cablesIn[] inside each cab survive a cold start intact. The store's own header comment (:31393-31396) and the mscope 'Restored Master is cab-only' banner copy (:32109) both claim otherwise — the banner's CONDITION is data-driven (restored && totalHosts===0 && totalCables===0, :32108) so a populated fixture will simply never trip it. Do not treat its absence as a defect.
- legends IS A DEAD FIELD. `legends: {net:null,gpu:null,cpu:null}` at :31827 is the ONLY occurrence of the token in all 54,749 lines — written once, never read, and dropped by save(). Do not put it in a fixture and do not assert on it.
- CAB KEY FORMAT IS LAW AND IT IS LOWERCASE. Keys must be `<row>:<cab>` matching /^([a-z0-9]+:[0-9]+)(?::|$)/ (:31350). Host locCabRu must be `<row>:<cab>:<U>` matching /^[a-z0-9]+:[0-9]+:[0-9]+/ (:31349) and IS lowercased by the parser (nLow, :31726). locode is n(), NOT lowercased — so 'TEST-01' is correct as a locode/siteCode but a cab key must be e.g. 'tx1:001'.
- master_hasMaster() (:32544) TREATS AN EMPTY racksByCab AS NO MASTER — it requires Object.keys(...).length > 0. Same guard in deploy_forge_master (:19320) and mscope_master (:31955). A payload with `racksByCab: {}` boots as zero-state.
- DEVICE TYPE AND HEIGHT ARE NOT SETTABLE FIELDS — both are derived from `model + ' ' + dns`. master_hostType (:32835) and master_nodeHeightInfo (:32807). A dns like 'gpu-01' will type a host 'gpu' no matter what its model says. Pick models that classify AND have a known height so slots are not hgtUnknown: 'NVIDIA HGX H100 8-GPU' (gpu, 6U, :32690), 'NVIDIA SN2201' (sw, 1U, :32717), 'NVIDIA SN5610' (sw, 2U, :32749), '12-mpo-48-lc-port-patch-panel' (patch, 1U, :32784), 'cdu-4ru-03' (cdu->pdu, 4U via the -ru name rule :32811), 'ps-1ru' (pwr->pdu, 1U via the same rule). NOTE the -ru rule reads MODEL ONLY, while MASTER_U_TABLE reads model+dns.
- BUILD'S METRICS NEVER TOUCH THE MASTER. bw_metrics (:20399) reads rack.hosts off a phantom_deploy_racks_v1 record, and deploy_seedRacksAndPhases (:29312) NEVER writes a hosts field — the record has slots[], not hosts[]. So on the app's own data path Components is ALWAYS an em-dash and the chip always reads 'Platform not in Master' (:20501), no matter how populated the Master is. Making those cells render requires adding hosts[] to the DEPLOY rack fixture — a shape the app reads but never writes. That is an honest mismatch to record, not a defect to fix.
- CONNECTIONS CAN NEVER RENDER A NUMBER. m.connections and m.connectionsTotal are declared null at :20400 and are not assigned anywhere in bw_metrics (:20399-20422). The Connections cell (:20593) reads them and falls to '—' at :20601. No fixture can populate it. Assert the em-dash, do not chase it.
- THE PLATFORM LABEL HAS TWO UNRELATED SOURCES. (a) Build's bw-chip: rack.platform || rack.hosts[0].platform || rack.hosts[0].model, with the sub-label rack.hosts[0].type (:20499-20501) — all off the DEPLOYMENT rack. (b) The site profile's platforms[]: derived from racksByCab[].hosts[].model by site_derivePlatformsFromMaster (:25786-25799). They never feed each other. Separately, the BUILD header's site name comes from phantom_siteLabel (:20441 -> :25753) which reads the PROFILE's facilityName/facilityId — not the Master's siteCode.
- BOTH MASTER->PROFILE WRITERS ARE GATED ON confirmedAt. site_derivePlatformsFromMaster returns at :25774 and site_prefillProfileFromMaster at :25849 unless siteProfile_isConfirmed() (:25741) is true. A fresh harness device has confirmedAt: null, so seeding a Master alone produces NO derived platforms and NO SITE-VARS pre-fill — silently. Seed phantom_site_profile_v1 with a numeric confirmedAt to exercise them. A single platforms[] entry whose source !== 'master' also blocks the derivation entirely (:25781).
- HOST-LESS CABINETS (owner ruling R-06) ARE PRODUCED BY THE CABLE LOOP, NOT AN EDGE CASE. ensureRack fires for the A endpoint (:31709) and the Z endpoint (:31710) before any host row is parsed, so a cab named only by a cable has hosts: [] with populated cablesOut/cablesIn. Downstream: master_rackToElevation returns slots:[] / totalU:48 (:32922), Forge draws a complete empty 48U shell, the tagSub reports '0/0 RACKED' (:19342), the Master tab prints 'no hosts with a U position on record' (:33236), and master_renderHit routes to the CABLING list instead of the elevation (:33041). Include at least one such cab.
- INTRA-RACK CABLES MUST APPEAR IN BOTH cablesOut AND cablesIn. When aRack === zRack the parser pushes the SAME object twice (:31709 and :31710) and rackElevation_render3D depends on it: it draws from cablesOut only and counts every cablesIn hit as already-drawn (:35994-36005). Cross-rack cables go in the A-rack's cablesOut and the Z-rack's cablesIn only.
- THE CABLES PILL IS THREE-STATE AND DATA-DRIVEN. It only ENABLES (:36055) when a cable's aDns AND zDns both resolve to slots in the SAME rack — matched by _rec_norm (uppercase, strip non-alphanumerics) against slot.name/slot.dns (:35984-35989), where slot.name is the host's dns (:32899). Otherwise you get a DISABLED 'N EXT LINKS' (:36068) or 'NO CABLE DATA' (:36071). Give one cab two hosts plus a cable whose aDns/zDns are exactly those two dns values.
- A DEPLOYMENT RACK'S rackId MUST EQUAL THE MASTER CAB KEY. master_findRack matches on the cab key case-folded (:33001) and is queried with rack.rackId || rack.name || rack.id (:35971, :36557). mscope names the rack `name: cabId` (:32306) and the seeder copies it to rackId (:29314). Any other rackId and the cable tubes, the CABLES pill and the device sheet's CONNECTIONS panel all go dark with no error.
- racksByCab[cab].totalU IS READ (:32922) BUT NEVER WRITTEN BY THE PARSER. Setting it in a fixture is legal (it has a reader) but produces a state no real Master can reach. Omit it and let the 48U floor apply.
- siteCode IS THE FIRST NON-EMPTY LOCODE THE PARSER SEES — from a cable row (:31711) or a host row (:31733), falling back to 'UNKNOWN' (:31791). It is n(), not nLow(), so 'TEST-01' round-trips verbatim.
- master_siteVars() (:25816) RETURNS null FOR AN EMPTY OBJECT. `siteVars: {}` is indistinguishable from `siteVars: null` to every consumer. Only four keys have a profile writer (SITE_VARS_PROFILE_MAP, :25831): locode/site, rack-naming, pdu-type, standard-optic.

**Notes**

SCOPE VERIFIED, NOT ASSUMED: every line number above was re-grepped against the working tree. Nothing was written or modified.

THE ONE-SENTENCE SHAPE OF THE AREA: a loaded Master lives in exactly one localStorage key ('phantom_master_v1', LZString-compressed), hydrates to exactly one global (window._lastPhantomMaster), and the only field that reaches a cold start with real content is racksByCab — a flat map of '<row>:<cab>' -> {cabId, locode, hosts[], cablesOut[], cablesIn[]}. Everything else the app shows about a Master is derived at read time.

THE MOST EXPENSIVE THING I FOUND, and it changes what the fixture has to be: BUILD'S METRICS ARE NOT A MASTER SURFACE. bw_ctx only asks the Master a yes/no question (master_hasMaster, :20375) to decide whether to show the zero-state door. Every number after that comes from phantom_deploy_racks_v1 + phantom_deploy_phases_v1. And the deployment rack record that the app's OWN seeder writes (:29312) has slots[], not hosts[] — while bw_metrics reads rack.hosts (:20403) and the platform chip reads rack.hosts[0] (:20499). So seeding a perfect Master and running the real seeder still yields Components '—' and 'Platform not in Master'. A fixture that wants the populated metrics layout must write a hosts[] array onto the deploy-rack record that no code path in the app produces. That is worth stating plainly in the fixture's own comments: the populated-metrics branch is reachable by fixture but is currently unreachable by the product. Under R3 that is an observation to assert, not a defect to file or a rail to polish.

WHAT A MASTER *DOES* DRIVE, and where a populated fixture pays off: the Forge aisle roster and its cabinet geometry (:19323, :19377), the aisle herotag and provenance line (:19334, :19345), the Build 3D preview's cable tubes and the CABLES pill state (:35975, :36049), the whole Master tab (banner :33259, namespace :33382, elevation/cabling fork :33030), the scope picker's row/cab tree with its per-cab 'Nh · Nc' counts (:31967), preflight's cable audit (:49186), and — only once confirmedAt is set — the site profile's derived platforms[] (:25772).

TWO CELLS ARE STRUCTURALLY DEAD, and both should be asserted as em-dashes rather than pursued: Connections (never assigned, :20400) and, on any app-produced rack, Components. Calling either a fixture failure would send the next agent chasing code that does not exist.

ON THE HOST-LESS CABINET (R-06): the parser gives it to you for free — a cable row whose A or Z endpoint names a cab that no SITE-HOSTS row mentions creates that cab with hosts: []. It is not a special construction, it is the ordinary consequence of parsing cables before hosts (:31709/:31710 run in step 7, :31757 in step 9). One such cab in the fixture covers the 42%-of-a-real-site data class, the '0/0 RACKED' herotag, the empty-48U-shell render, and the cabling-list fork in master_renderHit.

TWO THINGS I DID NOT VERIFY AND WILL NOT GUESS: (1) I did not execute a seed-and-reload, so the claim that a directly-seeded compressed payload boot-restores is read from the code path (:52519 -> :31440 -> :31450 -> :52521), not measured — verify it in the harness before building on it, exactly as the brief instructs. (2) I did not trace deploy_computeRackRollup, so the exact shape of `ru` (ru.phases[].items[], ru.pctComplete, ru.currentPhase, ru.phaseTotal, ru.isBlocked) is stated only as bw_metrics and bw_render CONSUME it (:20408-20418, :20505-20527); the phases fixture owner should confirm the producer's shape rather than inferring it from these readers.

---

## AREA: DEPLOYMENT

### `phantom_deployments_v1`

**Reader:** dct-ios.html:27525 (deploy_loadAll) · :24572-24586 (nowtab_resolveDep, the deployment bw_ctx actually uses) · :27527 (deploy_getById)

```js
JSON array of deployment records. Canonical writer = _deploy_create_postIntake dct-ios.html:33884-33897, VERBATIM:
[{
  id: 'dep_' + now + '_' + Math.random().toString(36).substr(2,6),  // :33885 — any unique string is fine
  name: 'TEST-01 Harness Build',        // :33886
  edpHash: 'mscope_harness_0',          // :33887 (mscope_ prefix per :32350)
  status: 'active',                     // :33888 — MUST be 'active' | 'paused' | absent to be resolvable (:24575)
  buildLead: 'Harness Lead',            // :33889
  created: 1754400000000,               // :33890  NOTE: 'created', not 'createdAt'
  updated: 1754400000000,               // :33891  NOTE: 'updated', not 'updatedAt'
  edpRaw: 'MASTER SCOPE · TEST-01 · 3 cabs: TEST-01-A01, TEST-01-A02, TEST-01-A03', // :33892 / :32346
  edpParsed: { racks: [ {name,room,totalU,slots,notes?} ] },  // :33893 — master-scoped shape from mscope_buildRacksFromSnapshot :32306-32316
  rackCount: 3,                         // :33894
  phaseCount: 5,                        // :33895
  scope: { source:'master', sourceFileHash:'harness', siteCode:'TEST-01', selectedCabIds:['TEST-01-A01','TEST-01-A02','TEST-01-A03'], stagedAt:1754400000000, snapshotConsumedAt:1754400000000 } // :33896, shape at :32351-32358
}]
OPTIONAL later-written fields (all deploy_saveAll writers): reviewIssues:[{id,severity,category,message,triage,triagedBy,triagedAt}] :38186-38196 · reviewVerdict :38197 · reviewSummary :38198.
NOT needed for Build; edpParsed may even be null (deploy_createLightweight :40404-40421).
```

### `phantom_deploy_racks_v1`

**Reader:** dct-ios.html:27608 (deploy_loadAllRacks) · :27612-27618 (deploy_loadRacksFor) · :20378 (bw_ctx) · :35473-35474 (rackElevation_render3D reads only .slots and .totalU)

```js
JSON array of rack records, UNSCOPED across all deployments. Canonical writer = deploy_seedRacksAndPhases dct-ios.html:29312-29322, VERBATIM:
[{
  id: 'rack_dep_<depId>_0',   // :29311 'rack_' + deployment.id + '_' + idx — GLOBALLY UNIQUE, this is what phases point at
  deploymentId: '<depId>',    // :29314 — the scoping field deploy_loadRacksFor filters on (:27617)
  rackId: 'TEST-01-A01',      // :29315 sr.name || 'Rack-'+(idx+1) — the DISPLAY designation
  room: 'HARNESS-HALL-1',     // :29316 sr.room || ''  (master-scoped path puts cab.locode here, :32308)
  totalU: 48,                 // :29317 sr.totalU || 42
  slots: [ ...slot objects... ], // :29318 sr.slots || []
  notes: '',                  // :29319 sr.notes || '' — master-scoped sets 'UNPLACED (n): name,…' (:32314)
  powerCircuits: [],          // :29320 always seeded empty
  currentPhase: 'mechanical'  // :29321 cache, re-derived on every phase advance (:29405)
}]
SLOT SHAPE — use the MASTER-scoped one (master_rackToElevation :32907-32916), which is what a Master-scoped deployment really stores:
  { uStart:11, uEnd:14, name:'test01-a01-gpu-ru11', model:'GB300 NVL72', type:'gpu', serial:'', dns:'test01-a01-gpu-ru11', hgtUnknown:false }
  type ∈ master_hostType vocabulary (:32835-32886): gpu|sw|pwr|patch|stor|cpu|cdu|fw|media|other (+ 'server' bridge, :19234).
EDP/CSV slot shape (different, :31152-31159): { uStart, uEnd, type, name, model, notes } with type from deploy_classifyDevice (:30049): gpu|switch|pdu|patch|server|storage|blank.
HOST-LESS CABINET (R-06) = the same record with slots: [] — legal, renders a full empty shell.
App-written later: assignedTo (:25471), currentPhase (:29405). NOTHING else is ever written.
```

### `phantom_deploy_phases_v1`

**Reader:** dct-ios.html:27749 (deploy_loadAllPhases) · :27753-27756 (deploy_loadPhasesFor) · :29193-29216 (deploy_computeRackRollup) · :20379 (bw_ctx) · :20414 (Blockers metric) · :20526 (blockerNote) · :27986/:28000/:28001 (checks/notes render)

```js
JSON array of phase records, UNSCOPED. Exactly 5 per rack. Canonical writer = deploy_seedRacksAndPhases dct-ios.html:29325-29338, VERBATIM:
[{
  id: 'phase_rack_dep_<depId>_0_mechanical', // :29326 'phase_' + rackId + '_' + type (rackId = the INTERNAL rack.id)
  deploymentId: '<depId>',   // :29327 — scoping field for deploy_loadPhasesFor (:27755)
  rackId: 'rack_dep_<depId>_0', // :29328 — the rack's INTERNAL id, NOT its display rackId
  type: 'mechanical',        // :29329 — one per DEPLOY_PHASE_TYPES (:28645) ['mechanical','power','network','compute','validation']
  seqOrder: 1,               // :29330 pi+1, 1..5; rollup sorts on this (:29195)
  status: 'pending',         // :29331 — 'pending' | 'in_progress' | 'complete' | 'blocked' (writers :29382/:29383/:23320/:29453)
  tasksTotal: 0,             // :29332
  tasksDone: 0,              // :29333
  signedOffBy: null,         // :29334 set to identity/buildLead on complete (:29385-29386)
  signedOffAt: null,         // :29335 set to Date.now() on complete (:29384)
  _gateOverride: false,      // :29336 set true by deploy_overrideGate (:29454)
  _notes: ''                 // :29337 STRING; appended at :29455. HAS NO READER ANYWHERE.
}]
RUNTIME-ADDED fields (absent from the seed, add them deliberately):
  checks: { 'mech-rails': true, 'mech-set': true }   // :27882-27884 — per-item tick map, keys are checklist item ids from PHASE_CHECKLIST_DEFAULTS (:27767-27811)
  notes:  { 'mech-torque': '85 Nm verified' }        // :27912-27914 — OBJECT map, per-item evidence (NOT the _notes string)
  blockerNote: 'Awaiting busbar torque tool',        // :23312 — only writer is blocker_save
  blockedAt: 1754400000000                           // :23313 — written with it
A FIELD BLOCKER = { status:'blocked', blockerNote:'…', blockedAt:<ms> } on one phase.
```

### `phantom_active_deployment`

**Reader:** dct-ios.html:27534-27546 (deploy_getActiveId) · :27548-27556 (deploy_getActive) · :24583-24584 (nowtab_resolveDep — 'active build wins')

```js
⛔ RAW STRING, NOT JSON. Written `safeStore(ACTIVE_DEPLOYMENT_KEY, String(id))` at :27562; read with a bare `localStorage.getItem` and NO JSON.parse at :27536. Store exactly:  dep_1754400000000_h4rnss   — a JSON.stringify'd value would carry literal quotes and never match a record id. Key name declared at :27532.
```

### `phantom_manifest_last_deploy`

**Reader:** dct-ios.html:27539 (lazy migration inside deploy_getActiveId)

```js
RAW STRING mirror of phantom_active_deployment, same value, written in lockstep at :27564. If the primary key is absent, :27539-27543 lazily migrates FROM this one. Seed both to the identical raw id.
```

### `phantom_active_context_v1`

**Reader:** dct-ios.html:26126-26154 (activeContext_get) · :24702-24703 (today_render hero) · :23038-23040 / :23047-23049 (blocker_quick pre-scoping)

```js
JSON object (ACTIVE_CTX_KEY, declared :26084):
{ deploymentId: '<depId>', rackId: 'rack_dep_<depId>_0' | null, phaseId: '<phaseId>' | null, lastTouched: 1754400000000 }
Writers: activeContext_setDeployment :26097-26108 · activeContext_setRack :26110-26117. Read raw + JSON.parse at :26086-26091.
OPTIONAL for Build. It does NOT choose the Build hero rack — see gotchas.
```

### `phantom_checklist_site_v1`

**Reader:** dct-ios.html:27821-27828 (checklist_loadSite) · :27843-27859 (checklist_effectiveItems)

```js
JSON object, OPTIONAL site-level checklist overrides (CHECKLIST_SITE_KEY :27812):
{ added: [ {id,phase,label,wantNote} ], removed: ['itemId'], renamed: { itemId: 'label' } }   // normalised at :27821-27828
Omit it entirely and checklist_effectiveItems (:27843) returns the PHASE_CHECKLIST_DEFAULTS (:27767-27811) unchanged — which is what you want for a baseline fixture.
```

**Consumers**

- bw_ctx() dct-ios.html:20373-20395 — resolves master(:20375)/dep(:20376)/racks(:20378)/phases(:20379), rolls up every rack (:20383), and picks the hero rack blocked > active > pending at :20387-20392
- bw_metrics(rack, ru) dct-ios.html:20399-20422 — Components from rack.hosts (:20403-20408); Verification + Blockers from ru.phases (:20411-20419); Connections is NEVER assigned anywhere in the function, so it always em-dashes
- bw_render() dct-ios.html:20424-20790 — four routing exits at :20426 (#bw-shell missing), :20430 (!redesign_isOn), :20457 (!master && !dep), :20470 (!rack); #bw-mount created at :20579; metrics grid :20591-20615; four bw-tab tool doors :20632; worklist :20645-20690
- bw_mount3D(rack, mount) dct-ios.html:20799-20975 — waits for a measurable box, then rackElevation_render3D; aborts while #forge3d-sheet.open (:20888-20892)
- bw_queueRow(dep, row) dct-ios.html:20977-20993 — the all-complete / no-hero fallback list
- deploy_computeRackRollup(rackId, phases) dct-ios.html:29193-29216 — filters p.rackId === rack.id, returns {currentPhase, phaseDone, phaseTotal, pctComplete, isBlocked, hasInProgress, phases}
- deploy_computeDeployRollup(deployId) dct-ios.html:29218-29279 — memoized per _deployRollupGen; feeds the rack list and dashboards
- nowtab_resolveDep() dct-ios.html:24572-24586 — the ONLY deployment selector bw_ctx uses
- deploy_loadRacksFor / deploy_loadPhasesFor dct-ios.html:27612-27618 / :27753-27756 — scoped loaders; a missing deployId returns [] and logs loader misuse (:27592-27600)
- deploy_showRackDetail(deployId, rackId) dct-ios.html:37184-37400+ — the Continue/Next-action destination; elevation block gated on rack.slots.length > 0 at :37343
- rackElevation_render3D(rack, mountEl) dct-ios.html:35436+ — consumes rack.slots (:35473) and rack.totalU (:35474); tray colour via _TMAP[dev.type] at :35738; builds the CABLES chip (:36045-36077) and the FRONT/ISO/TOP/REAR + EXPLODE rail (:36085-36119)
- checklist_effectiveItems / checklist_toggle / checklist_setNote / checklist_paintMeter dct-ios.html:27843 / :27878 / :27904 / :27893 — the REAL per-rack checklist, riding ph.checks and ph.notes
- blocker_save(deployId, rackId, phaseId, note) dct-ios.html:23302-23338 — the only writer of blockerNote/blockedAt; flips status via deploy_advancePhase (:23320)
- deploy_advancePhase(phaseId, newStatus, deployId) dct-ios.html:29357-29429 — the only status writer; also refreshes rack.currentPhase (:29405) and dep.updated (:29413)
- deploy_countBlockers(deploymentId) dct-ios.html:38223-38229 — REVIEW issues only, unrelated to Build's Blockers metric
- activeContext_get() dct-ios.html:26126-26154 — resolves deployment + rack from ACTIVE_CTX_KEY
- today_render() dct-ios.html:24600+ — blocker cards built at :24673-24691 from ru.isBlocked + blockedPhase.blockerNote/blockedAt
- showMode('work') dct-ios.html:18815 — the ONLY caller of bw_render()

**⛔ Gotchas**

- ⛔ RAW-STRING KEY: phantom_active_deployment (and its mirror phantom_manifest_last_deploy) are plain strings. Writer :27562 does safeStore(key, String(id)); reader :27536 does a bare localStorage.getItem with NO JSON.parse. JSON.stringify would store \"dep_x\" with quotes and the id would never match a record. Every OTHER key in this area goes through safeGet (:17053), which JSON.parse's and, on a parse error, QUARANTINES the value (:17062) and silently returns the fallback — a malformed seed yields the zero state with no error.
- ⛔ FIELD-NAME TRAP in the deployment record: the create path writes `created` and `updated` (:33890, :33891), but nowtab_resolveDep's recency tie-break reads `d.updatedAt || d.createdAt` (:24578, :24580) — fields nothing writes. With more than one active deployment the tie-break always compares 0 and falls through to active[0]; the reliable selector is phantom_active_deployment, which wins at :24584. Seed it.
- ⛔ ph.rackId MUST be the rack's INTERNAL `id` ('rack_<depId>_<idx>', :29311/:29328), never its display `rackId` (:29315). deploy_computeRackRollup filters `p.rackId === rackId` where rackId is rack.id (:29194, called with r.id at :20383). Getting this wrong produces 0 phases per rack, which does NOT throw — it silently yields pctComplete 0 / phaseTotal 5 (:29210-29211) and a fixture that tests nothing.
- ⛔ NO WRITER FOR rack.hosts / rack.platform. bw_metrics Components reads rack.hosts (:20403) and the hero chip reads rack.platform || rack.hosts[0].platform|model, plus rack.hosts[0].type (:20498-20500). Deploy rack records carry `slots`, never `hosts` (:29318). Every `.hosts` producer in the file targets MASTER cabinets in racksByCab (:31825, :32228, :33005, :32892), not deploy racks. Consequence on honest data: Components em-dashes and the chip reads 'Platform not in Master' (:20502) for every rack the app can produce. Adding hosts[]/platform to the fixture exercises a real reader but is a shape the app cannot emit — declare it explicitly if you do it.
- ⛔ NO WRITER FOR phase.items. Verification (:20411-20419), Next action (:20549) and the whole Worklist (:20652, :20658) read `phase.items[]`. Nothing in dct-ios.html ever assigns `items` to a phase. The real checklist state is ph.checks (:27882-27884) + ph.notes (:27912-27914), with the item LIST derived at render time by checklist_effectiveItems(ph.type, hardwareType) (:27843) over PHASE_CHECKLIST_DEFAULTS (:27767-27811). On honest data the Build worklist always prints 'No checklist items defined for this phase.' (:20654) and Verification always em-dashes. Reader-expected item shape if you seed it anyway: { id, description|label, status:'met'|'complete' | done:true, note }.
- LIVE DEFECT — do not write a test that asserts the Build worklist checkbox toggles. The box calls checklist_toggle(depId, curPhase.id, it.id) at :20667, which writes ph.checks[itemId] (:27884), then bw_render() re-reads items[] (:20652). The tick is never persisted back into items[], so the checkbox reverts on every repaint.
- TWO UNRELATED BLOCKER COUNTERS. Build's 'Blockers' cell = FIELD blockers: phases on THIS rack with status === 'blocked' (bw_metrics :20414). deploy_countBlockers(deployId) (:38223) counts dep.reviewIssues[] with triage 'untriaged' or 'blocking' (:38226-38227) and is not read by bw_render at all. Seeding reviewIssues moves nothing on Build; seeding blocked phases moves nothing in deploy_countBlockers.
- A blocked phase with no blockerNote renders the literal string 'Blocked — no note recorded.' (:20527). Both blockerNote (:23312) and blockedAt (:23313) are written only by blocker_save, together with the status flip via deploy_advancePhase (:23320). Seed all three or accept that string.
- REQUIRED ORDERING for #bw-mount to exist — bw_render routes away at four points: no #bw-shell (:20426), !redesign_isOn() (:20430), !c.master && !c.dep (:20457, an AND — a deployment alone is enough, no Master needed), and !c.rack (:20470). c.rack is null when the deployment has no rack records OR when EVERY rack's rollup is currentPhase === 'complete' (:20386 returns before the pick). A fixture with all 5 phases 'complete' on all racks shows the rack-queue card and NO 3D mount, no tool tabs, no metrics.
- HERO-RACK PRIORITY IS blocked > active > pending, first match wins (:20387-20392, comment at :20391). ACTIVE_CTX_KEY.rackId does NOT select it — bw_ctx never reads that key. So if the fixture contains a blocked rack, THAT is the rack #bw-mount draws; the host-less cabinet will only be the drawn rack if it is itself the highest-priority pick. Design the fixture so the intended rack wins, or drive two runs.
- A rack with ZERO phase records is NOT treated as complete: rp.length === 0 leaves currentPhase 'mechanical', phaseTotal falls back to 5 and pctComplete 0 (:29196-29215), so it classifies as 'pending' and can be picked as the hero rack. Only a rack whose phases are ALL 'complete' reaches currentPhase 'complete' (:29205).
- TWO SLOT-TYPE VOCABULARIES, and they barely overlap. _TMAP (:19234) is keyed on the MASTER vocabulary (master_hostType :32835 → gpu|sw|pwr|patch|stor|cpu|cdu|fw|media|other, plus a 'server' bridge). The EDP/CSV classifier deploy_classifyDevice (:30049) emits gpu|switch|pdu|patch|server|storage|blank. rackElevation_render3D colours trays with `_TMAP[dev.type] || 'unknown'` (:35738), so EDP-vocabulary 'switch'/'pdu'/'storage'/'blank' all fall through to MAGENTA UNKNOWN. Use the MASTER vocabulary — it is what a Master-scoped deployment genuinely stores (:32912) — if you want honest tray colour. TYPE_COLOR/TLABEL (:19227/:19230) are keyed on the DISPLAY vocabulary, a third set of names.
- R-06 HOST-LESS CABINET IS SAFE AT #bw-mount BUT NOT AT RACK DETAIL. rackElevation_render3D reads only slots + totalU (:35473-35474); slots: [] means the slots.forEach at :35734 does nothing and the rack shell/rails/floor still draw — a complete empty 48U cabinet. But deploy_showRackDetail gates its entire elevation block on `rack.slots && rack.slots.length > 0` (:37343), so the SAME rack renders no elevation there. Two surfaces, two behaviours — do not assert the same thing about both.
- totalU defaults disagree by path: deploy_seedRacksAndPhases falls back to 42 (:29317), master_rackToElevation floors at 48 (:32921), rackElevation_render3D falls back to 48 when absent (:35474), deploy_showRackDetail prints 42 (:37225). State totalU explicitly on every rack so nothing is inferred.
- THE .reh-3d-seg RAIL IS FOUND BY A GLOBAL QUERY. rackElevation_render3D does `document.querySelector('.reh-3d-toggle')` (:36043) and inserts the rail as that strip's SIBLING (:36119). bw_render supplies #bw-strip with class 'reh-3d-toggle bw-strip' for exactly this (:20577). If a rack-detail panel has already emitted its own .reh-3d-toggle into #pg-work (:37366) the hidden one can win the query — enter Build on a clean page, not after opening rack detail. There is also NO FLAT|3D pill pair any more (retired in .353, :37357); the JS-built pills are CABLES (:36049), FRONT/ISO/TOP/REAR (:36097) and EXPLODE (:36107), and the redesign strip's static content is the single OPEN AISLE door (:37367). Per R3, assert what IS there.
- THE FORGE AISLE IS NOT DEPLOYMENT-DRIVEN. 'NO MASTER LOADED' comes from deploy_forge_provenance (:19349) via deploy_forge_master(), and the aisle zero-state (:19844-19863) is decided by RUN, built from the Master's racksByCab (deploy_forge_slots :19377-19396). No deployment/rack/phase seed will populate the aisle — it needs the Master fixture. #forge3d-sheet :13104, #forge3d-mount :13109.
- SPELLING TRAP ON PHASES: `_notes` is a STRING (seeded '' at :29337, appended by deploy_overrideGate at :29455) and HAS NO READER ANYWHERE IN THE FILE. `notes` is an OBJECT map of itemId → evidence string (:27912-27914, read at :28001). Both live on the same phase object. Keep them straight.
- rack.status is read by activeContext_get (:26140-26142) to compute completeRacks/blockedRacks/activeRacks, but NO app path ever writes it — the only rack mutations are currentPhase (:29405) and assignedTo (:25471). Those three counts are always 0 on honest data.
- deploy_ensureRacksAndPhases (:29348-29353) re-seeds ONLY when deploy_loadRacksFor(dep.id).length === 0 AND dep.edpParsed.racks.length > 0 (:29350); it runs from deploy_showDetail at :33984. So a fixture that seeds rack records is safe from silent re-seeding, but a fixture that supplies edpParsed.racks with NO rack records will be auto-seeded (with the app's own ids and 5 pending phases) the first time the deployment detail opens.
- deploy_saveAllRacks (:27619) and deploy_saveAllPhases (:27757) write the WHOLE key, unscoped. Rack ids are globally unique by construction ('rack_<depId>_<idx>') and the .348 data-loss fix depends on that (:25454-25462) — keep the id convention.
- _deployDashCache (:29222) memoizes deploy_computeDeployRollup against _deployRollupGen, which only increments inside the deploy_save* wrappers. It is in-memory, so a localStorage-seeded fixture is always seen fresh at boot; but an in-page localStorage.setItem that bypasses those wrappers can be served stale. deploy_computeRackRollup (:29193) is NOT memoized, so Build itself is always live.
- bw_render() has exactly ONE caller: showMode('work') at :18815. Mutating storage does not repaint Build — re-enter Work (or reload) after any in-page seed change.
- The two 28px destructive DELETE buttons named in the brief are NOT deployment-driven and cannot be instantiated from this fixture: :47717 is the optic-inventory row delete (deleteOpticEntry, optic scan entries) and :49536 is AUDIT.removeEntry on the audit/scan entry list. They belong to the storage/optics area, not to deployments/racks/phases.
- checklist_isDlc (:27836) FAILS OPEN — an absent or 'generic' hardwareType shows the two DLC rows. ge_deriveHardwareType (:28702-28730) reads rack.slots[].type === 'gpu' plus .model, so a Master-vocabulary 'gpu' slot with model 'GB300 NVL72' yields hardwareType 'GB300' and keeps 10 mechanical items; a rack with slots: [] returns 'generic' (:28703) and also keeps 10. Item counts per phase on defaults: mechanical 10, power 6, network 6, compute 6, validation 5.

**Notes**

RECOMMENDED FIXTURE SHAPE (all line numbers verified against the working copy at C:\Users\Darkm\nexus01\dct-ios.html).

Seed five keys directly, before the app boots:
  phantom_deployments_v1     JSON.stringify([dep])
  phantom_deploy_racks_v1    JSON.stringify([rackA, rackB, rackC])
  phantom_deploy_phases_v1   JSON.stringify(15 phase records — 5 per rack)
  phantom_active_deployment  dep.id            <- RAW STRING, no JSON
  phantom_manifest_last_deploy  dep.id         <- RAW STRING, no JSON
  (optional) phantom_active_context_v1  JSON.stringify({deploymentId, rackId, phaseId:null, lastTouched})

Three racks give full coverage of the classes that matter and let the hero pick be steered:
  rackA 'TEST-01-A01' — populated, mid-build. Slots in the MASTER vocabulary (gpu/sw/pwr/patch/cdu).
                        Phases: mechanical complete, power complete, network in_progress, compute pending,
                        validation pending  -> pctComplete 40, hasInProgress true, currentPhase 'network'.
                        Add checks:{...} on the two complete phases so the rack-detail meter is non-zero.
  rackB 'TEST-01-A02' — HOST-LESS CABINET (R-06): slots: [], totalU 48, all five phases pending.
                        Exercises the empty-shell draw at #bw-mount and the no-elevation branch at :37343.
  rackC 'TEST-01-A03' — BLOCKED: network phase status 'blocked' + blockerNote + blockedAt.
  ⚠ With rackC present, bw_ctx picks rackC as the hero rack (blocked outranks active, :20387-20392), so
    #bw-mount draws rackC, the hero shows the .bw-blk note and the Blockers metric reads 1.
    If a spec needs rackA or rackB in the mount instead, flip rackC's phase to 'in_progress' for that run
    or order the array so the wanted rack is the first of its class. There is no key that overrides this.

WHAT THIS FIXTURE ACTUALLY UNLOCKS (measured against the readers, not assumed):
  ✅ #bw-mount is created (:20579) and rackElevation_render3D runs — three.js scene, and with #bw-strip
     present (:20577) the CABLES chip + FRONT/ISO/TOP/REAR + EXPLODE .reh-3d-seg pills become LIVE
     controls instead of the synthetic probe 06-composition had to use.
  ✅ The four bw-tab tool doors (:20632) instantiate.
  ✅ Hero: rack name, 'Phase 3 of 5' (:20512), phase label (:20518), pct bar (:20520), blocked note (:20527).
  ✅ Metrics: Blockers renders a real number and the .hot class (:20597, :20600); Verification renders
     only if you also seed phase.items (see below).
  ✅ The rack-queue branch (:20470-20486) if you flip every phase to 'complete'.
  ❌ Components stays an em-dash and the platform chip stays 'Platform not in Master' unless the fixture
     adds rack.hosts[] / rack.platform — reader-only fields with NO app writer (:20403, :20498-20500).
  ❌ Verification stays an em-dash and the Worklist stays empty unless the fixture adds phase.items[] —
     also reader-only, NO app writer (:20411-20419, :20549, :20652).
  ❌ The Forge aisle still says 'NO MASTER LOADED' (:19349) — it reads racksByCab, not deployments.

ON THE TWO READER-ONLY FIELDS. This is the honest crux of R4. hosts[]/platform on a deploy rack and
items[] on a phase each have real readers I can name, but nothing in 54,749 lines writes them. Seeding
them is the ONLY way to see the populated Build metrics layout and the Build worklist — which is exactly
the gap CLAUDE.md records as never having been seen — but the resulting state is one the app itself
cannot reach. My recommendation: seed them, in a clearly-named separate object/flag inside the fixture
(e.g. a `synthetic` block) so the spec can say which assertions depend on app-producible state and which
depend on the reader-only augmentation. Do NOT bury them among the seed-faithful fields. And note the
matching pre-existing defect for the parent agent's record, not as a new filing: the Build metrics read a
MASTER-rack shape off a DEPLOY-rack record, which is why they have always em-dashed.

FIELDS I DELIBERATELY DID NOT INVENT: no serials on synthetic hosts (Master has zero serials across
4,143 hosts on the real file); no `connections`/`connectionsTotal` source exists anywhere — bw_metrics
never assigns them (:20400), so Connections is a permanent em-dash by construction, not a data gap.

IDENTIFIERS: TEST-01-A01/A02/A03 as cab ids, room 'HARNESS-HALL-1', buildLead 'Harness Lead', dns names
'test01-a01-gpu-ru11' style, models from the app's own vocabulary ('GB300 NVL72', 'QM9700', 'SN4600',
'PDU', 'MPO patch') so master_hostType (:32835) and ge_deriveHardwareType (:28702) classify them the way
real data would. Nothing here names a real facility, customer or serial.

UNCERTAIN / NOT VERIFIED BY ME (say so rather than guess): the exact Master-side shape under
window._lastPhantomMaster / PHANTOM_MASTER_STORE and its save() whitelist at :31422 — that is the Master
agent's area and I did not read it. bw_ctx tolerates master:false as long as a deployment exists
(:20457 is an AND), so the deployment fixture is independent of it, but anything asserting the Forge
aisle or the platform chip's Master-derived branch depends on that other fixture landing first.

---


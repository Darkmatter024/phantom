# PHANTOM — Storage & Persistence Audit
**Basis:** `dct-ios.html` @ v1.14.394 (`71d4279`) + `sw.js`. Specialist audit, key claims re-verified by the Principal Integration Owner.
**Scale:** 187 lines touch `localStorage`; **63 distinct keys**; `localStorage.clear()` appears **0 times** (good).

---

## The hardened layer, and where it is bypassed

| Helper | Line | Contract |
|---|---|---|
| `safeParse(str, fallback)` | 16993 | try/catch `JSON.parse`; returns fallback on throw **and** on null. **Silent — no log, no toast.** |
| `safeStore(key, value)` | 17007 | try/catch `setItem`; classifies quota across 5 signatures; 10s-throttled `phantomToast('Storage full…')` + haptic; returns `false`. |
| `DataStore(key)` | 17445 | `{load,save}` wrapper. Used by only **3** stores: `_rackStore` 44363, `_sopStore` 45233, `_opticStore` 46888. |
| `PHANTOM_MASTER_STORE` / `PHANTOM_JOBSNAP_STORE` | 31120 / 31244 | Own try/catch + quota classify — but **`console.warn` only, no toast.** |

**There is no `safeGet` and no `safeRemove`.** All 31 `removeItem` calls and every `getItem` are raw by construction.

---

## ST1 — Field-verify status is the highest data-loss exposure in the app ⚠️

`phantom_node_status_v1` @19112 holds per-node racked/pending state — **real work a technician did in the aisle.** It is written through a private closure wrapper at 19107–19116:

```
19107  get: function(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } }
19108  set: function(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
```

Three compounding faults: raw `setItem`, a **naked `catch(e){}`** so a quota failure is completely silent, and — verified against `exportAllData` @50042 — **the key is not in the backup bundle.** A tech fills a rack, storage is full, nothing is said, and the work is not in any export.

---

## ST2 — Two `setItem` calls with no error handling at all ⚠️

`bom_classify_saveOverride` @39489 and `bom_classify_clearOverride` @39500 are the only `setItem` sites in the file with **no try/catch**. On a quota-full or storage-disabled device the exception propagates out of the function.

---

## ST3 — `ge_load` is a READ-side whitelist ⚠️

`ge_load` @28400–28411 rebuilds a fresh literal `{outgoing, incoming, schemaVersion}` and drops every other stored key. Paired with `ge_save(cache)` @28413, **the round-trip erases any field it does not know about** — the same defect class as the documented `MASTER_STORE.save` trap, but on the read side, where nobody is looking for it.

---

## ST4 — The Master whitelist, enumerated

`PHANTOM_MASTER_STORE.save` @31122–31161 persists exactly 7 fields: `schemaVersion`, `savedAt`, `sourceFileHash`, `siteCode`, `sourceFile`, `siteVars`, `racksByCab`.

The parse result built at @31524–31553 carries more. **Dies at cold start:** `siteName`, the entire `stats` object (`totalCabinets`, `totalHosts`, `totalCables`, `cableSource`, `sheetsParsed`, `sheetsSkipped`, `parseMs`), flat `hosts[]`, `cables[]`, `legends{net,gpu,cpu}`, `ingestedAt`.

`hosts[]`/`cables[]` loss is documented and intentional @31115. The rest is incidental. **The standing trap holds: any field added at 31524 is silently dropped unless also added to the 31125 literal.**

---

## ST5 — Offline PDF import is broken ⚠️ CONFIRMED

`vendor/pdf.min.js` and `vendor/pdf.worker.min.js` are loaded at runtime @47700–47701 and are **absent from `sw.js`'s 54-entry PRECACHE list** — I grepped `sw.js` for `pdf`, zero hits. Both files exist on disk in `vendor/`.

The catch block @47702 even says *"Check connection and retry"* — in an offline-first field app. Honest, but the fix is two lines in the precache list.

---

## ST6 — Smaller confirmed defects

- **`handoffDraft` never clears** @21325: `handoffDraft = !!(hraw && JSON.parse(hraw))`. `phantom_handoff_v1` is an **array**; `JSON.parse('[]')` is truthy. Once the key exists — including after every handoff is deleted — the indicator is permanently on. Needs `.length`. **CONFIRMED by reading the line.**
- **Dual-write drift**: `phantom_active_deployment` and `phantom_manifest_last_deploy` hold the same id. `deploy_setActive` @27289–27291 writes both, but **@29911 writes only the legacy key**, and @29902/@30031 read only the legacy key. Reinforces S1 in the state audit.
- **Identity split**: `_bomActor` @39114 reads `phantom_identity`, which **is never written anywhere**. The live writer targets `phantom_current_user_v1` @22601. BOM attribution silently falls through to `'unknown'`.
- **Dead keys**: `phantom_force_lead_v1` and `gt_lessons` are deleted at 18132/18133/18174/18176 but never written or read. `phantom_backup_interval_days` @50111 is read, never written.
- **Two writers, one key**: `dct_burndown_v1` (47422 module + 43361 BOM push) and `phantom_optic_inventory` (46890 DataStore + 43399 BOM push, **different record shape**). The burndown module comment @47610 claims sole ownership of its key; 43349/43361/50036 disprove it.
- **Unreachable else-arms**: the `if (typeof safeStore === 'function') … else localStorage.setItem(…)` idiom at 18650, 44378, 51669, 52499, 52870, 52884. `safeStore` is declared top-level @17007, above all six — the raw arm is dead code that would only ever serve to defeat the quota toast.
- **`phantom_rack_viewer_last` is written in two shapes** — a Master cab id @44056 vs a human label @44096/44122/44435. Mitigated by re-resolution @44119, but genuinely two shapes on one key.

---

## ST7 — Backup coverage gap: 16 keys are outside the bundle ⚠️

`exportAllData` @50042–50065 captures 15 keys. **Not captured, therefore lost on device migration or restore:**

`phantom_node_status_v1` · `phantom_discrepancies_v1` · `phantom_deploy_issues_v1` · `phantom_audit_walk_v1` · `phantom_audits_v1` · `phantom_scan_collection` · `phantom_optic_score_history` · `phantom_drift_ledger_v1` · `phantom_checklist_site_v1` · `phantom_power_topo_v1` · `phantom_classifier_overrides_v1` · `phantom_current_user_v1` · `phantom_device_lead_pin_v1` · `phantom_compass_last` · `phantom_rack_recent_v1` · all `phantom_scaffold_v1::*`

Issues, discrepancies, audits, walk results and the scan collection are all field work. **This is the single most consequential finding in the storage audit** — a backup that omits a third of the app's user data is a backup the owner will trust and shouldn't.

---

## ST8 — Corrupt data is always swallowed

Every parse failure path — `safeParse` @16993 and all 12 direct-parse sites — degrades silently to `null`/`{}`/`[]`. **There is no corrupt-data toast, no quarantine, and no "your data looked damaged" path anywhere in the app.** Only LZString decompression failure warns (31168, 31279), and console-only.

This directly contradicts the No-Silent-Failures rule for a case that destroys user data rather than just hiding a surface.

---

## ST9 — What is already correct (do not touch)

- **Quota handling is genuinely good**: `safeStore` classification + throttled toast @17011; `deploy_validateStorageHeadroom` @33553 pre-flights at 3.6 MB of a 4.5 MB assumption; `scaffold_set` @39989 does a 4KB cap + LRU evict + retry.
- **Restore is the only transactional path in the app** @50577–50600: byte pre-check, staged writes, **full rollback to snapshot on first failure**, `alert()` naming the failing key. This is the pattern to copy.
- **Migrations are real where they matter**: `siteProfile_migrateV1toV2` @25426 does true field migration; device PIN v1→v2 rehashes in place @25009; crash log prunes against app version @17496; session 8h TTL @18528; EDP checkpoint 24h TTL @42887.
- **`JOBSNAP.save` @31250** uses `Object.assign({}, snapshot, {schemaVersion:1})` — passes everything through. **This is the correct pattern**, and the counter-example that proves the Master whitelist is a choice, not a constraint.
- **`siteProfile_saveFromEditor` @27957** was fixed in v1.14.347 to read-modify-write; blank input = no change @27991. Correct.
- **Service worker is healthy**: `CACHE_VERSION = 'phantom-v1.14.394'` @sw.js:37 in three-stamp lockstep with `PHANTOM_APP_VERSION` @12489 and `version.json`. All 54 precache entries exist on disk — **zero stale entries**. Install uses `allSettled` (non-fatal), activate deletes all non-current caches, navigations are network-first with a cached-shell fallback.

Two precached orphans: `cc-ghost.webp` (75 KB) and `phantom-shield.png` (91 KB) — referenced nowhere in the app.

---

## Priority ledger

| P | Item | Why |
|---|---|---|
| **P0** | ST7 — add the 16 missing keys to `exportAllData` | A backup that silently omits field work is worse than no backup |
| **P0** | ST1 — route `phantom_node_status_v1` through `safeStore` + include in backup | Highest data-loss exposure |
| **P1** | ST5 — precache `pdf.min.js` + `pdf.worker.min.js` | Offline-first app with an online-only import path |
| **P1** | ST2 — wrap the two BOM override writers | Only unguarded `setItem` calls in the file |
| **P1** | ST3 — make `ge_load` read-modify-write | Silent field erasure on round-trip |
| **P1** | ST8 — one honest corrupt-data path | Silent data loss violates the app's own first rule |
| **P2** | ST6 — `handoffDraft` `.length`; identity key unification; dual-write drift; dead keys | Small, independent, safe |

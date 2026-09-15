# A.2 SHIP 1 — PHASE 0 (assembler core · registry · identity/phase adapter · dev readout; read-only, nothing authorised to build)

**Written:** 2026-09-15 · **Mode:** EVIDENCE ONLY. No product source edited, no adapter written, no version bump.
**Handoff:** `docs/SHIP-HANDOFF-A2-ASSEMBLER.md`, imported verbatim in the same commit as this file — **7,133 bytes, `sha256 127da11fe8361ea7a1342dc040141c2357fa0e071b472aeb368898cdf02fa556`**, `cmp`-identical to `Downloads\SHIP-HANDOFF-A2-ASSEMBLER.md`. ⛔ **Its own header reads `HELD — gate is John's GO on this document`. This recon is not that GO.**
**Baseline:** `main` @ `ae74e26`, `dct-ios.html` at **`v1.14.590`** (`:12879`), **60,639 lines**. Every `:line` below was read against that tree. Verbatim strings are the truth; line numbers are hints.
**Builds on:** `docs/A1-CENSUS-REFRESH-TIER-A.md` (five classes at `.590`), `docs/A2-ASSEMBLER-RECON.md`, `OWNER-RULINGS.md` 2026-09-14.

---

## 0 · What decides Ship 1

1. ⛔ **No version can ship.** `VERIFIED` and `release` are `.589`; `.590` is on `main` unstamped. The guard refuses a `version.json` bump, and committing Ship 1's product source under the `.590` stamp would repeat `.588`'s one-stamp-two-meanings drift. **Ship 1 waits on `.590`.**
2. ⛔ **The handoff contradicts Ruling 2 on where the assembler lives** (Q-1). Both keep `deploy_generateReport`'s output unchanged; they disagree on whether A.2 is a new engine or an extension of that one.
3. ⛔ **The app's canonical storage reader cannot serve the adapter contract** (§2, Q-5). `safeGet` collapses *absent*, *unreadable* and *malformed* into one fallback — so `empty` and `error` are indistinguishable through it (P3) — and on malformed JSON it **writes** a quarantine record and toasts (§4 "pure read").
4. ⭐ **The torture Master CAN produce a composite-keyed rack on device** (§4). Loading a Master alone creates none; the MASTER SCOPE flow does, and it persists the Master cab id on the rack record — which the rulings' "no Master linkage is persisted anywhere" does not account for (Q-9).
5. ⚠ **The dev readout cannot be reached from an installed icon** (§5, Q-8). `start_url` carries no query string and a Home Screen app has no URL bar, so the device look happens in a Safari tab — which on iOS is a different storage context.

---

## 1 · IDENTITY — what the adapter would read, and the three ways the existing readers would lie to it

**Store:** `phantom_site_profile_v1` (`SITE_PROFILE_KEY`). Census: `docs/A1-CENSUS-REFRESH-TIER-A.md` §1.

| Reader | Line | Problem for an adapter |
|---|---|---|
| `siteProfile_load()` | `:28058` | goes through `safeGet` (§2); **backfills `confirmedAt` from `lastUpdated` in memory** `:28071`; **merges `SITE_PROFILE_DEFAULTS` over the stored record** `:28073`, so absence is indistinguishable from default |
| `siteProfile_migrateV1toV2()` | `:28033` | pure (returns a new object, writes nothing) — but for a v1 profile with **no `platforms` array** and `facilityId === 'AUS-01'` it **injects `AUS01_CANONICAL_PLATFORMS`** `:28043-28045`. A Record built through it would present platforms the device never stored |
| `PHANTOM_SITE.currentOperator()` | `:34908` | STRICT, no coalesce — correct — but reads through `this.load()` |
| `PHANTOM_SITE.siteLead()` | `:34932` | same; empty is a legitimate state (`.418`) |
| `identity_getUser()` | `:25465` | ⛔ **falls back to the legacy `phantom_current_user_v1`** `:25472` — a second identity source. Not for an adapter |

⭐ **`site.siteId` has a real candidate:** `SITE_PROFILE_DEFAULTS.id` `:28007`, commented *"stable profile id; Event Log entries bind to it as siteProfileId"*. Default `null`. `facilityId` `:27981` is the human facility code — a different thing (Q-7).

**Identity carries no events.** Nothing in the class is a happened-at: `confirmedAt` is synthesized at read time, and `createdAt`/`lastUpdated` describe the profile record, not work on a rack. The adapter returns facts and `events: []`.

---

## 2 · THE READ PRIMITIVE — `safeGet` is correct for the app and wrong for an adapter

```
:17614  function safeGet(key, fallback) {
:17616    try { raw = localStorage.getItem(key); }
:17617    catch (e) { … console.warn … return fallback; }      // UNREADABLE  → fallback
:17618    if (raw === null || raw === '') return fallback;       // ABSENT      → fallback
:17620      var r = JSON.parse(raw);
:17623      phantom_quarantine(key, raw, e);                    // MALFORMED   → WRITE, then fallback
```

`phantom_quarantine` `:17580` writes `PHANTOM_QUARANTINE_KEY` via `safeStore` `:17594` and raises an error toast `:17601`. It does **not** delete the original key ("quarantined, not deleted").

⛔ **Two contract violations for an adapter built on it:**
- **P3 / §4 honest emptiness:** three different states return the same value. An adapter cannot report `error` for a malformed or unreadable store — it would report `empty`, which is exactly the collapse P3 forbids.
- **§4 pure read:** a malformed store causes a storage write and a user-facing toast from inside assembly.

Every class loader Ship 1 would reach inherits this: `deploy_loadAllPhases` `:30330`, `deploy_loadAllRacks` `:30189`, `PHANTOM_BLOCKERS.loadAll` `:25920`, `siteProfile_load` `:28059`. **Shape errors collapse too:** `deploy_loadAllPhases` turns a non-array into `[]` `:30332`.

⚠ **Two more readers that write:** `deploy_getActiveId` `:30115` lazily migrates the legacy manifest key with `safeStore` `:30122`; `PHANTOM_PHASE_MODEL.forRack` `:31506` seeds and saves a template on first ask `:31509-31511`. Neither belongs in an assembly path — including the readout's rack picker.

⭐ **`safeGet` is a shared helper for the whole file. Changing it is large-radius and is not proposed.** See Q-5.

---

## 3 · PHASES — one live store, one dead store, and only one event with a real clock

### 3a · The live store: `phantom_deploy_phases_v1`

Seeded by `deploy_seedRacksAndPhases` `:32233`, one record per `DEPLOY_PHASE_TYPES` entry `:31422` (`mechanical · power · network · compute · validation`), record `:32257-32270`. `phase.rackId` is the **composite** `:32260`; `phase.id` embeds it `:32258`.

**Status writers and what each stamps:**

| Transition | Writer | Timestamp on the phase record |
|---|---|---|
| → `complete` | `deploy_advancePhase` `:32314-32318` | ✅ `signedOffAt = Date.now()` `:32316`, `signedOffBy` `:32317` |
| → `in_progress` (START / UNBLOCK) | `deploy_advancePhase`, buttons `:41945`, `:41952`; `:32114` | ⛔ **none** |
| → `blocked` | `deploy_advancePhase` via `blocker_save` `:26051`, BLOCK button `:41949` | ⛔ none from the phase path; `blockedAt` is written by `blocker_save` `:26017` |
| gate override → `in_progress` | `deploy_overrideGate` `:32385-32387` | ⛔ none numeric — an ISO string **inside free text** `_notes` `:32387` |

⛔ **`signedOffAt` is never cleared.** `deploy_advancePhase` sets it only `if (newStatus === 'complete')` and has no `else`. A phase that leaves `complete` keeps its stamp. No call site passes `'pending'`; whether a `complete` phase can reach `blocked` through `blocker_save` `:26051` was **not proven reachable**. Either way, **a completion event must require `status === 'complete'` AND a finite numeric `signedOffAt`** — the stamp alone is not the fact.

⛔ **`blockedAt` is never cleared either** — four occurrences in the file, none a reset; UNBLOCK `:41952` moves status and leaves it. It is the blockers class's history living on the phase record, and `PHANTOM_BLOCKERS` already carries `openedAt`/`clearedAt` for the same moment. **A phase adapter that emits it would double-count Ship 2's events.**

**Consequence for Ship 1's timeline:** the only honest phase event is `phase.completed` (`t = signedOffAt`). Start, block, unblock and override happen-ats exist **only in the audit log** (`PHASE_STARTED` / `PHASE_BLOCKED` / `PHASE_UNBLOCKED` `:32350-32355`, `entityType 'phase'`, `entityId` = `phase.id`) — Ship 3's class. Ship 1 will show completions and nothing else, and that is correct.

**Derived status (P6):** `status.phase` can be computed from phase records ordered by `seqOrder` — first phase not derived-complete. The app keeps its own copy of that answer as `rack.currentPhase` `:32329-32337`, a **cache written on every advance**; the seed writes the literal `'mechanical'` `:32253`. Where the two disagree, that is a finding for the readout to surface, not something to reconcile.

⛔ `tasksTotal` / `tasksDone` stay literal `0` (census §2) — never a source for anything.

### 3b · The dead store: `phantom_phase_model_v1` (`PHANTOM_PHASE_MODEL`)

`:31450`, object `:31456`: a per-rack step state machine (`NOT_STARTED · IN_PROGRESS · BLOCKED · COMPLETE` `:31451`) with `doneAt`/`doneBy` `:31561-31562` and a `STEP_STATE_CHANGE` audit write `:31570`.

⛔ **`transition` has ZERO call sites. `forRack` and `saveAll` have zero outside the object.** The one external reader is `JOBSTATE_FIELDS` `:28616`; the backup registry lists the key `:55509`. So on a device the store is empty unless a backup restored one.
⛔ **Neither census documents it** (0 mentions in both A.1 documents). Under `adapter-reviewer`'s rule, reading it is an automatic FAIL. **Ship 1's phase adapter reads `phantom_deploy_phases_v1` only.** Recorded because a future reader will find `doneAt` and think it is the richer source.

---

## 4 · RACK KEY AT `.590` — where composites come from

**Composite writer:** `deploy_seedRacksAndPhases` `:32243`, `'rack_' + deployment.id + '_' + idx`. Deployment ids are `'dep_' + ms + '_' + rand6` `:37949` — **they contain underscores**, so parsing a deployment out of a composite needs the last-underscore rule. Filtering phases by `rackId === composite` needs no parsing at all.

**Two roads reach the seeder, both through `_deploy_create_postIntake` `:37923` → `:37971`:**

| Road | Rack `name` → stored `rackId` | Evidence |
|---|---|---|
| EDP intake | vendor EDP rack name | `:32234`, A.2 recon §0 |
| ⭐ **MASTER SCOPE** | **the Master cab id** (`s1:001` form) | `mscope_buildRacksFromSnapshot` `:36365`; `scope.source: 'master'`, `selectedCabIds` `:36410-36413` |

⭐ **So for a Master-scoped deployment the rack record already carries both keys: `id` = composite, `rackId` = Master cab id.** Ruling 1 says *"no Master linkage is persisted anywhere"*, reasoned from the EDP road. That holds for EDP deployments and not for MASTER SCOPE ones. **Reported, not resolved** — it does not change Ship 1 (Q-9).

**Device road to a composite from the torture Master:** Build → **＋ NEW** (`mscope_open`, `:32632` / `:32902`) → **LOAD MASTER** `:36123` → select cabs → **STAGE SCOPE SNAPSHOT** `:36195` → **CREATE DEPLOYMENT** `:36343`. Loading a Master alone writes nothing to `phantom_deploy_racks_v1` — its only writers are the seeder `:32274`, advance `:32338`, assign `:27758`, purge `:42390` and restore `:56646`.

⛔ **The rack store is not in the Tier-A census refresh**, and the seeded record has **no `platform` field** `:32244-32254`. rr-1's `rack.platform` and `rack.masterPresent` have no source among the four adapters (Q-2).

---

## 5 · THE DEV READOUT — reachability

| Fact | Evidence | Consequence |
|---|---|---|
| Query-param precedent exists | `window.location.search.indexOf('cal=1')` `:13470` | a `?rrdev=1` check has a house pattern |
| Offline load works with the param | `sw.js` navigations are network-first with fallback `caches.match('dct-ios.html')` — a **fixed** key `:257-268` | ✅ `dct-ios.html?rrdev=1` loads offline |
| Installed icons never carry it | `manifest.json:5` `"start_url": "./dct-ios.html"` | PHANTOM STAGING opens without `?rrdev=1` and has no URL bar |
| Storage context | **platform behaviour, NOT measured on this box:** an iOS Home Screen web app keeps storage separate from Safari | data built in the staging icon is not visible to `?rrdev=1` in Safari |
| Harness can boot with it | `fixtures.js` `boot({ query })` `:136`, `:150` | automation needs no new fixture |
| Boot-complete anchor | `launch()` `:18825`; fixture end-state `#app.visible` + `#boot` hidden `:174-178` | a mount after launch has an observable ready state |

⛔ **So the one look runs entirely in a Safari tab on the staging URL:** load the Master there, create the MASTER SCOPE deployment there, view the existing surfaces there, then add `?rrdev=1` in the same tab. ⚠ `MASTER-US-EAST-ATL03-CRUCIBLE` is **not on this box** (home directory searched six levels deep); `MASTER-US-TST99-TORTURE-TEST.xlsx` and its answer key are in `Downloads`. The answer key covers cabs, hosts and cables only — it predicts **no** phase, blocker, note or photo values, so readout values can only be checked against the app's own surfaces, as §6 says.

---

## 6 · What automation can prove before any device look

Owned by the harness, per CLAUDE.md Ship discipline 4:

- **A new spec, seeded exactly like `64`** (`phantom.boot({ seed })`, composite `rack_rep_0`), asserting a valid rr-1 Record for a seeded rack, and `timeline` non-decreasing by `t`.
- **`ok` / `empty` / `error` proved by seed, not by damaging live storage:** absent key → `empty`; malformed JSON → `error`; unreadable → `error` via an init-script override of `Storage.prototype.getItem` for one key; non-array phases → `error`.
- **Pure read proved, not asserted:** snapshot every `localStorage` key and value before and after assembly and require them identical — this catches a quarantine write (§2) and a lazy migration (`:30122`).
- **Completion honesty:** a seeded phase with a `signedOffAt` but `status !== 'complete'` produces **no** `phase.completed` event.
- **Spec `64` stays green** — the handoff's acceptance #3.
- ⚠ **"Strictly time-ordered" (acceptance #4) cannot be literal when two events share a millisecond.** The provable property is non-decreasing `t` with a stated tie-break; `Array.prototype.sort` is stable in every engine this app targets.

---

## 7 · What Ship 1 should NOT build (and why)

- **No change to `safeGet`, `siteProfile_load` or any loader.** Shared helpers; the adapter layer owns its own read (Q-5).
- **No read of `phantom_phase_model_v1`.** Zero writers, zero census (§3b).
- **No `phase.blocked` / `phase.started` events in Ship 1.** No happened-at exists on the phase record for them; they arrive with Ships 2 and 3 from the classes that own them.
- **No parsing of `_notes` for the gate-override ISO string.** Free text is not a field.
- **No Master read for `masterPresent`**, and no platform lookup. Out of the four classes (Q-2).
- **The readout stays ugly on purpose.** It is deleted in Ship 4 — effort follows permanence.

---

## Q · Rulings owed before Ship 1 builds

| # | Question | Evidence | Recommendation |
|---|---|---|---|
| **Q-1** | **Engine placement.** Handoff §1/§8: *"deploy_generateReport is untouched this slice"*, *"Do not touch… deploy_generateReport"*. Ruling 2 (2026-09-14): *"A.2 EXTENDS deploy_generateReport… Contract A2, one canonical engine per concept."* | `OWNER-RULINGS.md` 2026-09-14; handoff §1, §8 | **Build per the handoff, and amend Ruling 2 in writing.** Zero blast radius on the three consumers behind four buttons. Cost: two folds over phases and audit until A.3 decides whether the report engine renders from Records |
| **Q-2** | **`rack.platform` / `rack.masterPresent` have no source.** Rack record has no `platform` `:32244-32254`; `masterPresent` needs the Master store; the racks store is not in the Tier-A census | §4 | `null` for both, with a coverage `detail` saying why — never `true`. A racks adapter (and its census row) is scope growth: owner's call |
| **Q-3** | **"identity/phase" is two stores.** §4: one adapter per data class, no reads of another store; the census treats identity and phases as separate classes | §1, §3a | **Two adapters in Ship 1** (`identity`, `phases`). Still one visible change — the readout |
| **Q-4** | **rr-1's `"of": 5` literal.** Spec `64` pins the engine's literal-5 fallback as wrong-and-shipping | handoff §3; spec 64 header | Derive from the rack's phase records; `null` when there are none |
| **Q-5** | **Read primitive.** `safeGet` collapses empty/unreadable/malformed and writes on malformed | §2 | One raw reader **inside the adapter layer** — `getItem` + `JSON.parse` in a `try`, returning a state and a value, never quarantining, never toasting. `safeGet` untouched. The app's own boot-time readers still quarantine a damaged key, so nothing is lost |
| **Q-6** | **`tech.identity` is one string; Contract 9a is two people.** | §1; CLAUDE.md 9a | `tech.identity` = the ACTOR, `currentOperator` strict, empty allowed. `siteLead` appears only inside `site.profile` as stored. Neither is inferred from the other |
| **Q-7** | **What `site.siteId` is.** | `:28007` vs `:27981` | Profile `id`; `null` when absent. Never substitute `facilityId` |
| **Q-8** | **Device path for the readout.** Installed icon cannot carry `?rrdev=1`; Safari storage is separate; CRUCIBLE is not on this box | §5 | Accept a Safari-tab look on staging using TST99 via MASTER SCOPE; CRUCIBLE only if the owner has it on the phone |
| **Q-9** | **Ruling 1's "no Master linkage persisted anywhere" is incomplete.** MASTER SCOPE deployments persist the cab id as `rack.rackId` `:36365` and in `scope.selectedCabIds` `:36413` | §4 | Report only — no Ship 1 change. Relevant to whoever builds the Master bridge |

---

## Bounds

Source reading at `.590` only, plus `sw.js`, `manifest.json`, `test/e2e/fixtures.js`, spec `64`, and the torture-test answer key. **Nothing was executed against the app, no storage was inspected on a device, no adapter or readout was written.** Ships 2–4 classes (blockers, notes/audit, photos) are touched only where they affect Ship 1. The iOS storage-partition statement in §5 is a platform fact stated from knowledge, not measured here. Not reviewed by `storage-archaeologist` or `adapter-reviewer` — neither is loadable in a Claude Code session (`docs/A1-CENSUS-REFRESH-TIER-A.md` §0).

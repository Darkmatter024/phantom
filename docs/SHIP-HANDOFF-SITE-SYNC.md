# SHIP-HANDOFF-SITE-SYNC.md
**PHANTOM becomes a team tool: one site, one truth, many phones. Offline stays first — sync is what happens when signal returns.**

- **Status:** ARCHITECTURE SPEC — owner-approved direction, Phase 0 evidence required before any code. This is the biggest change since the Master; it does not ship in slices until the model below is ruled on.
- **Baseline:** v1.14.576 (live). Verified facts about today's app: all rack state is in localStorage + IndexedDB on the phone; the only network call is the AI proxy; there is no server holding site state; the "SYNCED" status label means "online with no pending local writes," not synced to anything.
- **Owner statement (verbatim intent):** "If I'm able to roll this out to multiple technicians they need to be able to share data quickly with each other."
- **Governing docs:** MASTER-TRUTH (the Master is the single source of truth; counts must reconcile), IA-SHIFTNAV v2 (rack is the unit of work), the door-budget rule, and data honesty.

---

## §0 · THE PROBLEM IN ONE PARAGRAPH

Today every phone is an island. Ten technicians on one site each carry a private copy of the Master and a private record of their own work. If Tech A marks POWER complete on s3:171, Tech B's phone still shows it pending. Handoff only works if the next tech uses the same phone. This is fine for one person; it breaks on the first day two people share a site — which is exactly the sandbox rollout. PHANTOM has to become the *site's* tool, not one technician's, without giving up the thing that makes it work in a cage: it never depends on signal.

---

## §1 · THE MODEL — OFFLINE IS THE LOCAL MODE, NOT THE ONLY MODE

Three layers, each with a clear owner:

| Layer | What it is | Who writes it | Where it lives |
|---|---|---|---|
| **Master** | The site's deployment truth: racks, devices, U positions, port maps | Deployment lead loads it once per site | Server (one copy per site) → cached on every phone |
| **Rack state** | Phases, checklists, gates, blockers, assignments — the work | Any technician on the site | Every phone (offline) → server (when online) → every other phone |
| **Evidence** | Photos, notes, scans, activity log | The technician who captured it | Phone first → server when online; credited to the actor, never rewritten |

Rules that follow:

1. **The phone never waits on the network.** Every write lands locally first, instantly, exactly as today. Sync is a background process that runs when signal exists. A tech in a Faraday cage of a cold aisle works all shift and syncs at the door.
2. **One Master per site, distributed — not loaded per phone.** The lead loads the Master once; every phone on that site pulls it. No more ten techs each loading a spreadsheet and hoping they picked the same one. (This also fixes MASTER-TRUTH's "Platform not in Master" class of bug: a rack that isn't in the site's Master can't be active on anyone's phone.)
3. **Rack state is shared per rack, not per phone.** s3:171's phases are the site's fact, not Tech A's fact. Everyone sees the same rack.
4. **Evidence is append-only.** A photo or log line, once captured, is never edited or merged — only added. Attribution is the technician who captured it (Addendum A rule D-2: every log line credits the actor). This makes evidence trivially mergeable: union of everything, sorted by time.
5. **The activity log is the sync spine.** Every state change is already logged as an event ("John: POWER: pending → in_progress (s1:001)"). Sync ships *events*, not snapshots. Two phones exchanging their event logs and replaying them reach the same state. Timeline-as-spine, per INTELLIGENCE-CORE.

---

## §2 · CONFLICTS — THE HARD PART, RULED IN ADVANCE

Two techs, same rack, no signal, both make changes, both reconnect. What happens is decided *now*, not discovered in the field.

| Situation | Rule | Why |
|---|---|---|
| Both add evidence (photos, notes, scans) to the same rack | **Union.** Keep everything, each credited to its author. | Evidence is append-only; there is no conflict. |
| Both advance the same phase the same way (both mark POWER complete) | **Merge as one.** First timestamp wins the "who completed it" credit; the other is logged as a confirmation. | Same outcome; no fight. |
| One advances a phase, the other reverts or blocks it | **Blocker wins. Latest wins otherwise.** A BLOCK or gate-override always survives a merge and surfaces as a visible flag ("changed while you were offline — by Tech B"). | Safety-conservative: a rack is never silently un-blocked by a stale phone. |
| Both check items on the same checklist | **Union of checked items**, each credited. | Checklist items are independent facts. |
| Both assign the rack to different people | **Latest wins, and the rack shows both names in the log.** | Assignment is coordination, not evidence; it's cheap to fix in person. |
| Master replaced on the server while a phone is offline | **Phone keeps working on the old Master; on reconnect it shows "Master updated — N racks changed" and reloads.** Local rack state for racks that still exist is preserved; racks removed from the Master are archived on the phone, not deleted. | Honest, never destructive. |
| Two phones both "own" the shift handoff | **Handoff is per-technician, not per-site.** Each tech closes their own shift; the site view shows all open shifts. | Removes the conflict entirely. |

**Standing rule:** no merge is ever silent. Anything that changed under a technician's feet while they were offline shows as a visible "since you were offline" strip on the rack, with who and what. The app never quietly rewrites what someone saw.

---

## §3 · THE BACKEND — SMALLEST THING THAT WORKS, ON WHAT ALREADY EXISTS

PHANTOM already has a Cloudflare account, a deployed Worker (`phantom-api`), a KV namespace, and secrets management. Build on that; do not add a second vendor.

| Piece | Choice | Why |
|---|---|---|
| **Store** | Cloudflare D1 (SQLite) for events and rack state; R2 for photos | D1 is a real relational store with per-site rows and time ordering; R2 is cheap object storage for images. Both are in the account already. KV alone is wrong for this — no ordering, no queries. |
| **API** | A second Worker, `phantom-sync` (keep `phantom-api` as the AI proxy) | Separation of concerns; different rate limits; the AI proxy stays untouched. |
| **Endpoints** | `POST /sync` — phone sends its unsent events since last ack, receives everyone else's since its last pull. One call, both directions. `GET /master/{site}` — pull the site Master. `PUT /master/{site}` — lead uploads (PIN + role). `POST /evidence` — photo upload, returns a URL the event references. | One sync door. Not a REST zoo. |
| **Identity** | Site code + technician identity (name today; a per-site join code or PIN to enroll a phone). Origin-locked like `phantom-api`. | Enough to attribute and to keep a stranger's phone out; not an SSO project. Phase 0 rules on whether employer identity is required for rollout. |
| **Cost** | Free tier covers a site; paid tiers are single digits per month at this scale | Owner confirms budget; nothing here needs approval-level spend. |

**Offline queue on the phone:** unsent events sit in IndexedDB with a "pending" flag (the app already has `bw_hasPendingWrites` — that's the hook). On reconnect, the queue drains in order. The status strip shows the truth: `ON DEVICE · OFFLINE` → `SYNCING 12` → `SYNCED 2m ago`.

---

## §4 · WHAT CHANGES ON THE PHONE (and what doesn't)

**Doesn't change:** the rack screen, the phases, scan, photo, log note, the picker, the first screen, ISOLATE, the assistant. A tech's day looks identical. That's the point.

**Changes:**
- **Status strip becomes honest.** "SYNCED" today lies. It becomes one of: `ON DEVICE · OFFLINE` / `SYNCING n` / `SYNCED ·` time / `SYNC FAILED · retrying`. (This line ships *first*, independently — it's a data-honesty fix even before sync exists.)
- **SYS → MASTER** (B-1) gains "pull site Master" for technicians and "upload / replace" (PIN + lead role) for the lead. The REPLACE-with-PIN ruling stands; it now replaces the *site's* Master, and every phone gets it.
- **Rack screen gains one strip:** "since you were offline" — only when something merged in. Otherwise invisible.
- **Rack picker shows who's on what.** A rack assigned to Tech B shows their name. Blocked-by shows who blocked it.
- **Handoff becomes site-visible.** Open shifts and their last rack are on the site view; the next tech on any phone sees "In progress: s1:001 — Network (Tech A, 2h ago)."

---

## §5 · SECURITY AND PRIVACY (non-negotiable)

- No API keys or secrets in the app — same rule as the AI proxy. Sync auth is a per-phone enrolled token issued by the site join step, stored on the phone, revocable server-side.
- `phantom-sync` is origin-locked to the app's domain and rate-capped, same pattern as `phantom-api`.
- Site data is partitioned by site code at the database level. A phone enrolled on US-QRS03 cannot read US-WEST-99Z.
- Photos in R2 are private objects served through the Worker with the phone's token, never public URLs.
- Everything a phone sends is already something the tech typed or captured; nothing new is collected. Actor attribution uses the name the tech entered at the name gate.
- Owner rules with the employer before rollout on: where the data may live (Cloudflare region), retention, and whether corporate identity is required. This spec doesn't decide that; it flags it as a gate.

---

## §6 · PHASE 0 — EVIDENCE (read-only, report before any design is finalized)

- **E-1.** Census every localStorage / IndexedDB key that holds rack state, evidence, or Master data (the A.1 storage census exists — reuse and update it). For each: is it per-rack, per-site, or per-phone? Which ones become shared, which stay local (UI prefs stay local)?
- **E-2.** Quote the activity-log event shape. Confirm every state change produces an event with actor, rack, timestamp, before → after. Anything that changes state *without* logging an event is a sync hole — list them.
- **E-3.** Quote `bw_hasPendingWrites` and the write path — where would the outbound queue attach?
- **E-4.** Confirm the "SYNCED" label's exact logic (file:line) for the honesty fix.
- **E-5.** Photo storage today: format, size, where. R2 sizing estimate per rack per shift.
- **E-6.** How the Master is loaded and cached (the parser, the cache key, the eviction dialog) — this is what becomes "pull from server."
- **E-7.** Name every place the app assumes single-user (e.g. "the" shift, "the" assignee, hardcoded actor). Each is a change site.

**Stop. Report. Owner rules on §2 conflicts as written or amended, on identity (E-7 + §5), and on ship order.**

---

## §7 · SHIP ORDER (after rulings)

Each is its own verified ship. Nothing here combines.

1. **STATUS-HONESTY** — the strip says ON DEVICE / SAVED, never SYNCED, until sync exists. Ships now, no backend. One line. (Data honesty; also on the punch list.)
2. **EVENT-SPINE** — every state change emits a complete event; holes from E-2 closed. Still local-only. This is the foundation; sync is impossible without it.
3. **SYNC-WORKER** — `phantom-sync` deployed with D1 schema (sites, events, racks, evidence). Owner action in Cloudflare, like the AI proxy. Playwright can't test this; a curl smoke test can.
4. **MASTER-DISTRIBUTE** — lead uploads to the site; phones pull. SYS → MASTER grows the two actions. Replaces per-phone spreadsheet loading.
5. **EVENT-SYNC** — outbound queue + inbound replay, with the §2 rules and the "since you were offline" strip. The core ship. Verified with **two phones**: yours and one other, same rack, airplane mode on one, reconnect, confirm the merge and the strip.
6. **EVIDENCE-SYNC** — photos to R2, referenced by events.
7. **SITE-VIEW** — who's on what, open shifts, blocked-by. Then handoff across phones is a consequence, not a feature.

Ship 5 is the one that proves the model. Its verify is the two-phone test, done by you and one trusted tech, before any wider sandbox.

---

## §8 · WHAT THIS MAKES POSSIBLE (for the rollout pitch)

- Ten technicians, one site, one truth. Anyone's phone shows every rack's real state.
- A lead loads the Master once; nobody else touches a spreadsheet.
- Handoff works across people, not just across shifts on one phone.
- A blocked rack is blocked on every phone within seconds of signal.
- The field report (INTELLIGENCE-CORE) assembles from the *site's* evidence, not one phone's.
- The assistant's context gets richer — it can answer "who was last on this rack and what did they see?"
- And a phone still works, fully, with no signal at all. That never changes.

---

## §9 · GUARDRAILS

- Offline-first is not negotiable: no feature may require signal except the assistant and sync itself.
- No silent merges. No silent deletes. Archive, flag, credit — never overwrite what a technician saw.
- One sync door (`POST /sync`). No per-feature endpoints growing back.
- Evidence before design (Phase 0), design before code, one visible change per ship, two-phone device verify for the sync ships, owner promotes, iPhone verify gates every stamp.
- The Master rule extends to the server: the server's Master is *the* Master. The phone's copy is a cache and says so.
- A gauge that lies is worse than no gauge — the SYNCED strip is fixed before anything else, so the app never claims sync it doesn't have.

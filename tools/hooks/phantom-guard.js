#!/usr/bin/env node
/**
 * PHANTOM ship guard — the mechanical half of ship discipline, executed instead of remembered.
 *
 * Installed 2026-08-08 by the instruction-surface compaction. It replaces four prose rules and
 * one blocking rule that could never run:
 *
 *   CLAUDE.md used to say "a ship is blocked until lockstep-auditor and data-honesty-auditor both
 *   report PASS". Those agents live in nexus01/.claude/agents/, the session CWD is the home
 *   directory, so they were never loadable — BATCH-VERIFY records "Agents barred, equivalents run
 *   inline" three separate times. A gate that cannot execute is not a gate. These checks run.
 *
 * WHAT IT ENFORCES (each one has drawn blood at least once):
 *   1. CRLF preservation on dct-ios.html / sw.js  — `sed -i` silently rewrites 55k line endings
 *   2. Three-stamp lockstep                       — dct-ios.html + sw.js + version.json or no ship
 *   3. Inline <script> compile + CSS brace balance — a syntax error ships a blank app
 *   4. No backticks in a git commit body           — they run as a subshell and eat the message
 *   5. VERIFIED token gate                        — version.json bumps blocked until VERIFIED is stamped
 *
 * DESIGN NOTES, so a later reader does not "simplify" this into a footgun:
 *   - Scoped to the PHANTOM repo. Any other project passes straight through untouched.
 *   - Read-only. It inspects and reports; it never edits, stages, or rewrites anything.
 *   - Fails OPEN on its own internal error. A broken guard must not block a real fix at 2am —
 *     it prints the failure and gets out of the way. It is a seatbelt, not an immobiliser.
 *   - Exit 2 blocks the tool call and returns stderr to Claude; exit 0 allows it.
 */

'use strict';
const fs = require('fs');
const path = require('path');

const REPO = 'C:\\Users\\Darkm\\nexus01';
const APP = path.join(REPO, 'dct-ios.html');
const SW = path.join(REPO, 'sw.js');
const VER = path.join(REPO, 'version.json');

function read(p) { return fs.readFileSync(p, 'utf8'); }
function inRepo(p) {
  if (!p) return false;
  return path.resolve(String(p)).toLowerCase().startsWith(REPO.toLowerCase());
}

/** Lone LF (or lone CR) in a CRLF file = line endings were rewritten by something. */
function lineEndingReport(file) {
  const b = fs.readFileSync(file);
  let crlf = 0, loneLF = 0, loneCR = 0;
  for (let i = 0; i < b.length; i++) {
    if (b[i] === 10) { if (i > 0 && b[i - 1] === 13) crlf++; else loneLF++; }
    else if (b[i] === 13 && b[i + 1] !== 10) loneCR++;
  }
  return { crlf, loneLF, loneCR };
}

function checkLineEndings(file) {
  const { crlf, loneLF, loneCR } = lineEndingReport(file);
  // Only assert on files that are CRLF to begin with; a genuinely LF file is not damaged.
  if (crlf > 0 && (loneLF > 0 || loneCR > 0)) {
    return `${path.basename(file)}: LINE ENDINGS DAMAGED — ${crlf} CRLF but ${loneLF} lone LF / `
      + `${loneCR} lone CR. Something rewrote them (sed -i is the usual culprit). `
      + `Restore with: git checkout -- ${path.basename(file)}  then redo the edit with Edit.`;
  }
  return null;
}

function checkStamps() {
  const app = read(APP), sw = read(SW);
  const a = (app.match(/const PHANTOM_APP_VERSION = '(phantom-v[\d.]+)'/) || [])[1];
  const s = (sw.match(/const CACHE_VERSION = '(phantom-v[\d.]+)'/) || [])[1];
  let v = null;
  try { v = JSON.parse(read(VER)).version; } catch (e) { return `version.json is not valid JSON: ${e.message}`; }
  if (!a || !s || !v) return `stamp not found — app:${a || 'MISSING'} sw:${s || 'MISSING'} json:${v || 'MISSING'}`;
  if (a !== s || a !== v) {
    return `THREE-STAMP LOCKSTEP BROKEN — dct-ios.html:${a}  sw.js:${s}  version.json:${v}. `
      + `All three move together or the service worker serves stale bytes under a new version.`;
  }
  return null;
}

function checkCompile() {
  const s = read(APP);
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  const vm = require('vm');
  let m, i = 0, bad = [];
  while ((m = re.exec(s))) {
    i++;
    const line = s.slice(0, m.index).split('\n').length;
    try { new vm.Script(m[1], { filename: `inline-block-${i}` }); }
    catch (e) { bad.push(`block ${i} (near dct-ios.html:${line}): ${e.message}`); }
  }
  if (bad.length) return `INLINE SCRIPT DOES NOT COMPILE — ${bad.join(' | ')}`;
  const open = (s.match(/{/g) || []).length, close = (s.match(/}/g) || []).length;
  if (open !== close) return `CSS/JS BRACE IMBALANCE — ${open} { vs ${close} }. A dropped brace silently kills every rule after it.`;
  return null;
}

function checkSwCompile() {
  try { new (require('vm').Script)(read(SW), { filename: 'sw.js' }); } catch (e) { return `sw.js does not compile: ${e.message}`; }
  return null;
}

/** Branch topology gate: work lands on main; release is promote-only.
 *  v1.14.520 through .523 were committed straight onto release on 2026-08-27, bypassing
 *  main, and were orphaned the next day by a reset to main. They survive only because they
 *  were tagged after the fact (recovery-v1.14.520 .. .523). This refuses the commit that
 *  would repeat it. Promotion is unaffected: git merge --ff-only creates no commit. */
function checkBranchGate(cmd) {
  if (!/git\s+commit/.test(cmd)) return null;

  try {
    const head = read(path.join(REPO, '.git', 'HEAD')).trim();
    const m = /^ref:\s*refs\/heads\/(.+)$/.exec(head);
    if (!m) return null;                    // detached HEAD is not the failure this guards
    if (m[1].trim() === 'release') {
      return 'GATE: HEAD is on release, which is promote-only. Commit to main, then promote with '
        + 'git checkout release && git merge --ff-only main. (v1.14.520-.523 were committed here '
        + 'and lost to a reset; see tags recovery-v1.14.520 through recovery-v1.14.523.)';
    }
  } catch (e) {
    process.stderr.write(`[phantom-guard] branch gate check skipped (error): ${e.message}\n`);
  }

  return null;
}

/** What this commit would ACTUALLY include.
 *
 *  This is a PreToolUse hook: it runs BEFORE the command, so the index is not yet what the
 *  commit will contain. Three forms have to be told apart —
 *    git commit           -> the index alone
 *    git commit -a        -> the index PLUS every tracked modification (staged AT commit time)
 *    git commit <paths>   -> the index PLUS the named paths
 *
 *  The original gate read `git diff --cached` alone, so on `git commit -am "..."` the index was
 *  empty at inspection time, the version.json test was false, and the whole gate short-circuited.
 *  That is how v1.14.524 bumped version.json over a .518 stamp with no --no-verify and no intent:
 *  -am is simply the most common way to commit. Reproduced before this fix, and pinned below. */
function filesInCommit(cmd) {
  const { execSync } = require('child_process');
  const run = (c) => execSync(c, { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] })
    .trim().split('\n').filter(Boolean);

  const set = new Set(run('git diff --cached --name-only'));

  // Everything below reads the INVOCATION only. A commit body routinely quotes flags and
  // filenames while explaining a change — this very file's history does — and prose must never
  // be parsed as arguments.
  const inv = commitInvocation(cmd);
  if (!inv) return set;

  // -a / --all, including short-flag clusters like -am. Long options must not match:
  // /^-[a-zA-Z]+$/ rejects --amend because '-' is not in [a-zA-Z].
  const auto = inv.split(/\s+/).some(
    (t) => t === '--all' || (/^-[a-zA-Z]+$/.test(t) && t.includes('a')));
  if (auto) for (const f of run('git diff --name-only HEAD')) set.add(f);

  // Explicit pathspec form. This must parse ARGUMENTS, not scan the raw string: a commit whose
  // MESSAGE merely mentions VERIFIED is not a commit OF VERIFIED. (The first cut of this function
  // used cmd.includes() and promptly blocked its own commit, whose body explains the gate.)
  for (const f of pathspecsOf(inv)) {
    const base = f.replace(/^.*[/\\]/, '');
    if (base === 'version.json' || base === 'VERIFIED') set.add(base);
  }

  return set;
}

/** The actual `git commit ...` invocation, or null. A command may be a heredoc whose BODY
 *  discusses git commit in prose; only a line where the command starts — at the beginning of
 *  a line or after a shell separator — is an invocation. */
function commitInvocation(cmd) {
  for (const line of String(cmd).split('\n')) {
    const m = line.match(/(?:^|[;&|]\s*)\s*(git\s+commit\b.*)$/);
    if (m) return m[1];
  }
  return null;
}

/** Positional pathspecs of a `git commit` invocation, with option values skipped. */
function pathspecsOf(inv) {
  const toks = (String(inv).match(/[^\s"']+|"[^"]*"|'[^']*'/g) || [])
    .map((t) => t.replace(/^["']|["']$/g, ''));
  const start = toks.indexOf('commit');
  if (start < 0) return [];
  const takesValue = new Set(['-m', '--message', '-F', '--file', '-c', '-C', '--reuse-message',
    '--author', '--date', '--cleanup', '-S', '--gpg-sign', '-t', '--template']);
  const out = [];
  let afterSep = false;
  for (let i = start + 1; i < toks.length; i++) {
    const t = toks[i];
    if (afterSep) { out.push(t); continue; }
    if (t === '--') { afterSep = true; continue; }
    if (takesValue.has(t)) { i++; continue; }        // consume the option's value
    if (t.startsWith('-')) continue;                 // flag, or --opt=value
    out.push(t);
  }
  return out;
}

/** VERIFIED token gate: version.json bumps are blocked until owner stamps the old version. */
function checkVerifiedGate(cmd) {
  if (!/git\s+commit/.test(cmd)) return null;

  const VERIFIED_FILE = path.join(REPO, 'VERIFIED');
  const { execSync } = require('child_process');

  try {
    // What this commit would include — not merely what happens to be staged right now.
    const staged = [...filesInCommit(cmd)];

    // ⭐ 2026-09-03 (owner ruling) — VERIFIED IS OWNER-ONLY, AND THAT NOW MEANS WHAT IT SAYS.
    // This rule exists to stop an AGENT stamping its own work. It was enforced as "nobody may
    // commit VERIFIED", which made the owner-only file uncommittable BY ITS OWNER: the git-hook
    // path added later runs this same guard for every local commit, so the owner's own terminal
    // commit hit an agent rule, and the only way through was --no-verify — which disables EVERY
    // other gate in this file at once. Trading eight mechanical checks for one stamp is a worse
    // position than this rule was ever meant to create.
    //
    // THE TWO-KEY PROPERTY IS PRESERVED, NOT WEAKENED:
    //   agent commit -> Claude Code's PreToolUse hook fires FIRST and spawns this guard with no
    //     PHANTOM_GUARD_VIA in its environment, so it blocks before git ever runs;
    //   owner commit -> PreToolUse never fires (not a tool call); git runs tools/githooks/pre-commit,
    //     which sets PHANTOM_GUARD_VIA=githook, and the stamp lands.
    // An agent cannot reach the allowing branch by exporting the variable in its own shell: the
    // PreToolUse guard is a separate process spawned BEFORE that shell exists.
    //
    // ⚠ STATED PLAINLY: an env var is spoofable in principle and is deliberately not hardened
    // further. This file's own posture is "a seatbelt, not an immobiliser", and the bypass this
    // replaces (--no-verify) was strictly weaker because it removed every other gate with it.
    if (staged.includes('VERIFIED') && process.env.PHANTOM_GUARD_VIA !== 'githook') {
      return 'GATE: VERIFIED is owner-only. An agent never commits it; the owner commits it from a terminal.';
    }

    // If version.json is being modified, check that VERIFIED matches the old version
    if (staged.includes('version.json')) {
      let oldVersion = null;
      try {
        const oldVerJson = execSync('git show HEAD:version.json', { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        oldVersion = JSON.parse(oldVerJson).version;
      } catch (e) {
        // If HEAD doesn't have version.json yet (first commit scenario), proceed
        if (e.toString().includes('exists on disk, but not in')) return null;
        return `GATE: Could not read old version from HEAD: ${e.message}`;
      }

      // Read VERIFIED file
      let verified = null;
      if (fs.existsSync(VERIFIED_FILE)) {
        verified = read(VERIFIED_FILE).trim();
      }

      // ⭐ 2026-09-03 (owner ruling) — VERIFIED RECORDS AN ADJUDICATION, NOT ONLY A PASS.
      // THE GAP THIS CLOSES, FOUND BY WALKING INTO IT: this gate compared VERIFIED to the old
      // version and demanded they match, which silently assumed every ship EVENTUALLY PASSES.
      // v1.14.572 was device-verified and FAILED (the hero headline promised the picker while the
      // button opened the handoff). A failed version can never be honestly stamped as passed — so
      // .573, which existed only to FIX .572, was blocked behind it forever. A gate that forbids
      // shipping the fix for the defect it just caught is inverted.
      //
      // ⛔ THE FIX IS NOT TO WEAKEN THE GATE. The intent — never stack an UNADJUDICATED ship — is
      // unchanged and still enforced. What changes is that VERIFIED may now record either outcome:
      //
      //     phantom-v1.14.572            -> verified on device, PASSED
      //     phantom-v1.14.572 FAILED     -> verified on device, FAILED; the next ship is its fix
      //
      // Both mean "the owner put this on a phone and ruled on it", which is the only question this
      // gate is entitled to ask. ⚠ FAILED is NOT a pass and must never be read as one: it does not
      // license promoting that version, and nothing else in this repo treats it as a stamp.
      // ⛔ It also does not let an agent self-adjudicate — writing this line is still a VERIFIED
      // edit, and VERIFIED is still owner-only on the agent path (see the gate above).
      const verifiedToken = (verified || '').split(/\s+/)[0] || '';
      if (verifiedToken !== oldVersion) {
        return `GATE: ${oldVersion} not adjudicated in VERIFIED. The owner verifies on device, then writes either "${oldVersion}" (passed) or "${oldVersion} FAILED" (failed; next ship is the fix).`;
      }
    }
  } catch (e) {
    // Fail open on internal errors
    process.stderr.write(`[phantom-guard] VERIFIED gate check skipped (error): ${e.message}\n`);
  }

  return null;
}

/** Backticks inside a commit body run as a subshell and silently eat the snippet. */
function checkCommitMessage(cmd) {
  if (!/git\s+commit/.test(cmd)) return null;
  if (/-F\s*-|--file|-F\s+\S/.test(cmd)) return null;      // heredoc / file: safe by construction
  const dashM = cmd.match(/-m\s+(['"])([\s\S]*?)\1/);
  if (dashM && dashM[2].includes('`')) {
    return 'BACKTICK IN COMMIT MESSAGE — it will run as a subshell and swallow the snippet. '
      + 'Use a quoted heredoc instead:  git commit -F - <<' + "'EOF'";
  }
  return null;
}

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let payload = {};
  try { payload = JSON.parse(input || '{}'); } catch (_) { process.exit(0); }

  const tool = payload.tool_name || '';
  const ti = payload.tool_input || {};
  const problems = [];

  try {
    if (tool === 'Edit' || tool === 'Write' || tool === 'NotebookEdit') {
      // POST-EDIT: only the two files whose line endings are load-bearing.
      const fp = ti.file_path;
      if (inRepo(fp)) {
        const base = path.basename(String(fp)).toLowerCase();
        if (base === 'dct-ios.html' || base === 'sw.js') {
          const r = checkLineEndings(fp);
          if (r) problems.push(r);
        }
      }
    } else if (tool === 'Bash' || tool === 'PowerShell') {
      const cmd = String(ti.command || '');
      const msg = checkCommitMessage(cmd);
      if (msg) problems.push(msg);

      // PRE-COMMIT: the full mechanical gate, but only when a commit would include the app.
      if (/git\s+commit/.test(cmd) && fs.existsSync(APP)) {
        // Branch topology gate runs first: a commit on release is wrong whatever the stamps say.
        const branchGate = checkBranchGate(cmd);
        if (branchGate) problems.push(branchGate);

        // VERIFIED token gate runs next (blocks before the mechanical checks)
        const verifiedGate = checkVerifiedGate(cmd);
        if (verifiedGate) problems.push(verifiedGate);

        for (const fn of [checkStamps, checkCompile, checkSwCompile]) {
          const r = fn();
          if (r) problems.push(r);
        }
        for (const f of [APP, SW]) {
          const r = checkLineEndings(f);
          if (r) problems.push(r);
        }
      }
    }
  } catch (e) {
    // FAIL OPEN — a broken guard must never block a real fix.
    process.stderr.write(`[phantom-guard] check skipped (internal error): ${e.message}\n`);
    process.exit(0);
  }

  if (problems.length) {
    process.stderr.write(
      'PHANTOM SHIP GUARD — BLOCKED\n\n' +
      problems.map((p, i) => `${i + 1}. ${p}`).join('\n\n') +
      '\n\nThese are the mechanical gates from CLAUDE.md, enforced rather than remembered.\n' +
      'Fix the cause; do not work around the guard.\n'
    );
    process.exit(2);
  }
  process.exit(0);
});

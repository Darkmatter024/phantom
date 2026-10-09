#Requires -Version 5.1
<#
  tools/stamp.ps1 - record a device adjudication in VERIFIED, and commit it.

  VERIFIED IS OWNER-ONLY. RUN IT FROM YOUR OWN TERMINAL.

  Why your terminal specifically, and not just "because the rule says so":
  tools/hooks/phantom-guard.js blocks any commit that includes VERIFIED unless the environment
  carries PHANTOM_GUARD_VIA=githook. An agent's commit is intercepted by the PreToolUse hook, which
  runs in a process spawned BEFORE the agent's shell exists, so it cannot set that variable. Your
  terminal commit skips PreToolUse entirely and runs tools/githooks/pre-commit, which sets it. That
  is the two-key property. It needs `git config core.hooksPath tools/githooks` set in this clone.

  ! THE ORDER OF LINES IN VERIFIED IS LOAD-BEARING - THIS IS THE WHOLE REASON THIS SCRIPT EXISTS.
    The guard reads the FIRST WHITESPACE-DELIMITED TOKEN OF THE ENTIRE FILE:
        const verifiedToken = (verified || '').split(/\s+/)[0] || '';
        if (verifiedToken !== oldVersion) { block }
    and compares it to `git show HEAD:version.json`. So the newest adjudication must be line 1.
    Put an older version first and the next version.json bump is blocked with a message that does
    not explain why. This script always PREPENDS.

  ! IT COMMITS VERIFIED AND NOTHING ELSE, even when other files are staged. A stamp that quietly
    carries a ship defeats the two-key gate. See the commit block at the bottom for how.

  A FAILED stamp is not a pass. It records that the owner put the version on a phone and ruled on
  it, which is the only question the gate asks. It does not license promoting that version.
  (Owner ruling 2026-09-03, quoted in phantom-guard.js.)

  Usage:
    .\tools\stamp.ps1 VERIFIED                     stamp version.json's current version as passed
    .\tools\stamp.ps1 FAILED                       stamp it as failed; the next ship is its fix
    .\tools\stamp.ps1 FAILED -Version phantom-v1.14.578 -Note "blockers cell counted a zero"
    .\tools\stamp.ps1 VERIFIED -DryRun             show the resulting file, write nothing
#>
[CmdletBinding()]
# ARGUMENTS ARE ORDER-FORGIVING ON PURPOSE. The first cut declared Outcome as a ValidateSet at
# position 0, so the natural invocation - stamp.ps1 580 VERIFIED - failed PARAMETER BINDING before
# the body ran. Nothing was written, and the error was a wall of PowerShell binding text that read
# as noise rather than as a refusal. That happened for real on 2026-09-05 and the owner reasonably
# believed the stamp had landed. A tool whose failure looks like success is worse than a strict one.
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$First,

  [Parameter(Position = 1)]
  [string]$Second,

  [string]$Version,
  [string]$Note,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

function Invoke-Git {
  param([Parameter(Mandatory = $true)][string[]]$GitArgs, [switch]$AllowFail)
  $out = & git @GitArgs
  if ($LASTEXITCODE -ne 0 -and -not $AllowFail) {
    throw "git $($GitArgs -join ' ') failed with exit code $LASTEXITCODE"
  }
  return $out
}

function Stop-Stamp {
  param([string]$Reason)
  Write-Host ''
  Write-Host "STOP: $Reason" -ForegroundColor Red
  Write-Host 'VERIFIED was not changed.' -ForegroundColor Red
  exit 1
}

# Whichever token is VERIFIED/FAILED is the outcome; the other, if present, is the version.
$Outcome = $null
$versionArg = $null
foreach ($tok in @($First, $Second)) {
  if ([string]::IsNullOrWhiteSpace($tok)) { continue }
  if ($tok -eq 'VERIFIED' -or $tok -eq 'FAILED') { $Outcome = $tok.ToUpper() }
  else { $versionArg = $tok }
}
if (-not $Outcome) {
  Write-Host ''
  Write-Host 'STOP: no outcome given. Pass VERIFIED or FAILED - either position works.' -ForegroundColor Red
  Write-Host '  tools/stamp.ps1 VERIFIED          stamp the version in version.json' -ForegroundColor Yellow
  Write-Host '  tools/stamp.ps1 580 VERIFIED      same, naming the build number' -ForegroundColor Yellow
  Write-Host '  tools/stamp.ps1 FAILED -Note ...  record a device failure' -ForegroundColor Yellow
  Write-Host 'VERIFIED was not changed.' -ForegroundColor Red
  exit 1
}
if (-not $Version) { $Version = $versionArg }

# A bare build number is the natural thing to type, so accept it and the obvious near-misses.
# Deliberately no regex here: an anchored numeric pattern is not worth the quoting risk.
if ($Version) {
  $v = $Version.Trim()
  $asInt = 0
  if ([int]::TryParse($v, [ref]$asInt)) { $Version = 'phantom-v1.14.' + $v }
  elseif ($v -like '1.14.*')  { $Version = 'phantom-v' + $v }
  elseif ($v -like 'v1.14.*') { $Version = 'phantom-' + $v }
  else                        { $Version = $v }
}

$VerifiedFile = Join-Path $RepoRoot 'VERIFIED'

# ---- Which version are we adjudicating? Default to what version.json currently carries. ----
if (-not $Version) {
  try { $Version = (Get-Content -Raw (Join-Path $RepoRoot 'version.json') | ConvertFrom-Json).version }
  catch { Stop-Stamp "could not read version.json: $($_.Exception.Message)" }
}
if ($Version -notmatch '^phantom-v\d+\.\d+\.\d+$') {
  Stop-Stamp "version '$Version' is not of the form phantom-vMAJOR.MINOR.PATCH"
}

# ---- Guard: stamps are committed on main. ----
$branch = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Trim()
if ($branch -ne 'main') {
  Stop-Stamp "HEAD is on '$branch', not main. Stamps are committed on main."
}

# ---- Guard: hooksPath must be wired, or this commit is ungated AND the guard cannot allow it. ----
$hooksPath = (Invoke-Git @('config', '--get', 'core.hooksPath') -AllowFail)
if (-not $hooksPath -or $hooksPath.Trim() -ne 'tools/githooks') {
  Stop-Stamp 'core.hooksPath is not tools/githooks. Run:  git config core.hooksPath tools/githooks'
}

# ---- Read the existing register. ----
$existing = @()
if (Test-Path $VerifiedFile) {
  $existing = @(Get-Content $VerifiedFile | Where-Object { $_.Trim().Length -gt 0 })
}

# ---- Guard: refuse a duplicate adjudication of the same version. ----
$already = $existing | Where-Object { $_.Trim().Split(' ')[0] -eq $Version } | Select-Object -First 1
if ($already) {
  Stop-Stamp "$Version is already adjudicated in VERIFIED as: '$already'. Edit it by hand if it is genuinely wrong."
}

# ---- Build the new line. Token 0 must be the version - nothing may precede it. ----
$line = "$Version $Outcome"
if ($Note) { $line = "$line - $Note" }

# NEWEST FIRST. See the header - the guard reads token[0] of the whole file.
$new = @($line) + $existing

# ! THE PREVIEW MUST ANNOUNCE ITS MODE BEFORE IT SHOWS THE CONTENT, NEVER AFTER.
#   This block used to print "VERIFIED will become:", then the whole resulting file, then a cyan
#   "Gate token: phantom-v1.14.NNN" line, and ONLY THEN "DRY RUN - nothing written". Every
#   reassuring line came first and the disclaimer came last.
#   That happened for real on 2026-09-06: a -DryRun was run, `phantom-v1.14.581 VERIFIED` was read
#   as line 1 of the preview, and the stamp was reported as landed. Nothing had been written, and
#   the gate stayed shut on a version everyone believed was adjudicated.
#   THAT IS THE THIRD STAMP-ADJACENT INSTANCE OF THIS FILE'S OWN RULE - a tool whose failure looks
#   like success is worse than a strict one - after the parameter-binding refusal and the ship
#   commit that rode along under a stamp's subject line.
#   THREE THINGS FIX IT, and the third is the one that actually answers the question a reader asks:
#     1. the banner goes FIRST, so nothing reassuring is read before the mode is known;
#     2. every previewed line is PREFIXED, so it cannot be mistaken for the file itself;
#     3. the run ends by printing WHAT IS ACTUALLY ON DISK - "line 1 says X" is the question, so
#        the tool answers it rather than leaving a preview to be misread as the answer.
if ($DryRun) {
  Write-Host ''
  Write-Host '  ===================================================' -ForegroundColor Yellow
  Write-Host '   DRY RUN - NOTHING BELOW IS WRITTEN TO DISK' -ForegroundColor Yellow
  Write-Host '  ===================================================' -ForegroundColor Yellow
  Write-Host ''
}

if ($DryRun) {
  Write-Host 'VERIFIED WOULD become:' -ForegroundColor Cyan
  $new | ForEach-Object { Write-Host "  [would-be] $_" }
  Write-Host ''
  Write-Host "Gate token WOULD BE: $($new[0].Split(' ')[0])" -ForegroundColor Cyan
} else {
  Write-Host 'VERIFIED will become:' -ForegroundColor Cyan
  $new | ForEach-Object { Write-Host "  $_" }
  Write-Host ''
  Write-Host "Gate token (must equal HEAD's version.json on the next bump): $($new[0].Split(' ')[0])" -ForegroundColor Cyan
}

if ($DryRun) {
  $onDisk = if ($existing.Count -gt 0) { $existing[0] } else { '(VERIFIED does not exist yet)' }
  Write-Host ''
  Write-Host 'DRY RUN - NOTHING WAS WRITTEN. VERIFIED on disk still reads:' -ForegroundColor Yellow
  Write-Host "  $onDisk" -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Re-run WITHOUT -DryRun to stamp, then confirm against the file and the commit:' -ForegroundColor Yellow
  Write-Host '  Get-Content .\VERIFIED -TotalCount 1' -ForegroundColor Yellow
  Write-Host '  git log --oneline -1 -- VERIFIED' -ForegroundColor Yellow
  exit 0
}

# -Encoding ascii, deliberately: PowerShell 5.1's utf8 writes a BOM. The content is pure ASCII, and
# a BOM ahead of token 0 is exactly the kind of invisible breakage this file must never introduce.
Set-Content -Path $VerifiedFile -Value $new -Encoding ascii

$msg = "stamp: $Version $Outcome"
if ($Note) { $msg = "$msg - $Note" }

# ---- Commit VERIFIED, AND NOTHING ELSE. ----
# `git commit -m ...` commits THE WHOLE INDEX, so whatever the owner already had staged rides along
# under the stamp's message. That happened for real on 2026-09-05: commit f32e49a, subject
# "stamp: phantom-v1.14.580 VERIFIED", also carried dct-ios.html, sw.js and version.json. A ship
# inside an adjudication is the one pairing the two-key gate exists to keep apart, and `git log
# --oneline` shows it as a stamp, so nothing about the subject line reveals it.
#
# `git commit -- VERIFIED` is a PARTIAL COMMIT: git builds a TEMPORARY index of HEAD plus this one
# path, commits the WORKING-TREE content of it, and leaves every other staged file staged and
# untouched. Two consequences, both verified in a scratch repo before this was written:
#   - the pre-commit hook runs against that temporary index, so the `git diff --cached --name-only`
#     inside phantom-guard.js sees exactly one file, which is the truth of the commit. The
#     version.json gate therefore cannot misfire on a stamp, and PHANTOM_GUARD_VIA=githook is still
#     exported by tools/githooks/pre-commit, so the owner-only check works exactly as before.
#   - the owner's staged work is not consumed. It is still staged when this returns.
$stagedOthers = @(Invoke-Git @('diff', '--cached', '--name-only') |
  Where-Object { $_.Trim().Length -gt 0 -and $_.Trim() -ne 'VERIFIED' })
if ($stagedOthers.Count -gt 0) {
  Write-Host ''
  Write-Host 'These files are staged. They are NOT part of the stamp, and stay staged:' -ForegroundColor Yellow
  $stagedOthers | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}

# A partial commit needs the path to be KNOWN to git, so a first-ever VERIFIED has to be added.
# A tracked one is deliberately NOT added: if the commit is then refused, the change stays in the
# working tree where `git diff VERIFIED` shows it, instead of sitting in the index waiting to be
# swept into somebody else's commit - which is the very failure this block is fixing.
$tracked = @(Invoke-Git @('ls-files', '--', 'VERIFIED') | Where-Object { $_.Trim().Length -gt 0 })
if ($tracked.Count -eq 0) { Invoke-Git @('add', '--', 'VERIFIED') | Out-Null }

try { Invoke-Git @('commit', '-m', $msg, '--', 'VERIFIED') | Out-Null }
catch {
  Write-Host ''
  Write-Host 'The commit was refused. If the message mentions VERIFIED being owner-only, this ran' -ForegroundColor Yellow
  Write-Host 'through the agent path rather than your terminal. VERIFIED is left modified but' -ForegroundColor Yellow
  Write-Host 'uncommitted - inspect with: git diff VERIFIED' -ForegroundColor Yellow
  Stop-Stamp $_.Exception.Message
}

# Assert the property this block exists for, rather than trusting it. Cheap, and the failure it
# catches is one that reads as success everywhere else.
$committed = @(Invoke-Git @('show', '--name-only', '--format=', 'HEAD') |
  Where-Object { $_.Trim().Length -gt 0 })
if ($committed.Count -ne 1 -or $committed[0].Trim() -ne 'VERIFIED') {
  Write-Host ''
  Write-Host 'WARNING: the stamp commit carries more than VERIFIED:' -ForegroundColor Red
  $committed | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
  Write-Host 'Do not push it. Unwind with:  git reset --soft HEAD~1' -ForegroundColor Red
}

# ! READ LINE 1 BACK OFF DISK AND SHOW IT. The success path used to end on a commit line, which
#   proves a commit happened but not WHAT THE GATE WILL READ - and the gate reads token 0 of this
#   file, nothing else. The dry-run path now states what is on disk, so the success path states it
#   too: the same question gets the same answer in both modes, from the file rather than from a
#   variable this script happens to be holding.
$diskLine = @(Get-Content $VerifiedFile | Where-Object { $_.Trim().Length -gt 0 })[0]
Write-Host ''
Write-Host 'VERIFIED line 1 on disk is now:' -ForegroundColor Green
Write-Host "  $diskLine" -ForegroundColor Green
if ($diskLine.Trim().Split(' ')[0] -ne $Version) {
  Write-Host ''
  Write-Host "WARNING: line 1 does NOT name $Version. The gate reads token 0 of this file, so the" -ForegroundColor Red
  Write-Host 'next version.json bump will be refused. Inspect VERIFIED by hand before pushing.' -ForegroundColor Red
}
Write-Host ''
Invoke-Git @('log', '-1', '--oneline') | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
Write-Host ''
Write-Host 'Stamped locally. Push it with:  git push origin main' -ForegroundColor Cyan
if ($Outcome -eq 'FAILED') {
  Write-Host "$Version is recorded as FAILED. That is not a pass - do not promote it. The next ship is its fix." -ForegroundColor Yellow
}

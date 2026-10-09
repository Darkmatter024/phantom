#Requires -Version 5.1
<#
  tools/promote.ps1 - THE ONLY PROMOTE PATH.

  Owner ruling 2026-09-05 (OWNER-RULINGS.md): promote is owner-only. Claude Code never moves
  `release`, in any mode, with no session-order exception. This script exists so the owner runs
  one command instead of a four-command chain that has to be typed correctly every time.

  RUN IT FROM YOUR OWN TERMINAL.

  ! That rule is PROCEDURAL, not enforced by this file. Nothing here can tell who invoked it -
    same posture the commit guard states about itself: a seatbelt, not an immobiliser. The
    protection is that the rule is written down and that this is the only sanctioned path.

  What it does, and where each step comes from:
    - the promote itself is CLAUDE.md's documented line:
        git checkout release; git merge --ff-only main; git push origin release; git checkout main
    - `;` not `&&` because this box's shell is Windows PowerShell 5.1, where `&&` is a parser
      error that kills the chain before the first git runs, silently.
    - "A promote is a fast-forward or it is a STOP" - --ff-only, and the result is re-checked.
    - forbidden to everyone: any commit on `release`, any non-fast-forward, any --force.
    - "a ship John cannot reach is not a ship" - it confirms the SERVED bytes at the end.

  Usage:
    .\tools\promote.ps1            promote main -> release
    .\tools\promote.ps1 -DryRun    show exactly what would move, change nothing

  WHEN (owner ruling 2026-09-09, OWNER-RULINGS.md PROMOTE ORDER): after .\tools\verify.ps1 has
  stamped the incoming version against the PHANTOM STAGING look. Guard 4 refuses anything else.
  release means graduated.
#>
[CmdletBinding()]
param(
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

# Repo root is this script's parent's parent (tools/promote.ps1 -> repo).
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

function Stop-Promote {
  param([string]$Reason)
  Write-Host ''
  Write-Host "STOP: $Reason" -ForegroundColor Red
  Write-Host 'Nothing was moved.' -ForegroundColor Red
  exit 1
}

Write-Host "PHANTOM promote - repo $RepoRoot" -ForegroundColor Cyan
Write-Host ''

# ---- Guard 1: clean working tree. A promote carries committed work only. ----
$dirty = Invoke-Git @('status', '--porcelain', '--untracked-files=no')
if ($dirty) {
  Write-Host 'Uncommitted tracked changes:' -ForegroundColor Yellow
  $dirty | ForEach-Object { Write-Host "  $_" }
  Stop-Promote 'working tree is not clean. Commit or stash first.'
}

# ---- Guard 2: you must be on main. Never surprise-switch the owner's branch. ----
$branch = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Trim()
if ($branch -ne 'main') {
  Stop-Promote "HEAD is on '$branch', not main. Checkout main yourself, then re-run."
}

# ---- Guard 3: main must already be pushed. Otherwise release would carry commits origin/main
#      does not have, and the served branch would lead the reviewed one. ----
Invoke-Git @('fetch', '--quiet', 'origin') | Out-Null
$localMain = (Invoke-Git @('rev-parse', 'main')).Trim()
$originMain = (Invoke-Git @('rev-parse', 'origin/main')).Trim()
if ($localMain -ne $originMain) {
  Stop-Promote "main ($($localMain.Substring(0,7))) does not match origin/main ($($originMain.Substring(0,7))). Push main first."
}

# ---- Guard 4: THE INCOMING VERSION MUST BE ADJUDICATED. ----
# Runs BEFORE the pending list, before the fast-forward check and before -DryRun returns, so a
# refusal is identical in dry-run and in a real promote. It was missing entirely until
# 2026-09-05, when this script promoted .580 while VERIFIED still topped out at .579.
# Reading the working file is safe: Guard 1 has already proved the tree clean.
$headVersion = $null
try { $headVersion = (Get-Content -Raw version.json | ConvertFrom-Json).version }
catch { Stop-Promote "could not read version.json: $($_.Exception.Message)" }

# ! GUARD 4 RESTORED 2026-09-09 (owner ruling, OWNER-RULINGS.md PROMOTE ORDER). IT ADJUDICATES THE
#   VERSION ARRIVING, AS IT DID BEFORE 2026-09-08. Nothing reaches release that a phone has not
#   seen and the owner has not ruled on. release means graduated.
#   HISTORY, KEPT SO THE AMENDMENT IS NOT RE-INVENTED: from 2026-09-08 to 2026-09-09 (ruling C,
#   30f3822) this guard adjudicated the version the phone ALREADY HAD instead. Requiring the
#   incoming version to be adjudicated was UNEXECUTABLE then: GitHub Pages serves `release`, main
#   had no served surface, so a version could not be device-verified until promoted and could not
#   be promoted until verified. The only compliant path was a false stamp, which is how .581 was
#   stamped VERIFIED off a dry-run misread. That amendment was right for a world with one served
#   surface. There are two now: staging (a Cloudflare Worker serving main's root,
#   docs/INFRA-STAGING-CLOUDFLARE-PAGES.md) is where the phone sees a version BEFORE it is
#   promoted, and tools/verify.ps1 stamps against staging. So the original semantics are
#   executable again and are the rule.
#   THE PROPERTY IS UNCHANGED: NEVER STACK AN UNADJUDICATED SHIP. It is now enforced at the door
#   of release, where it belongs; the served-version check below stays as the second lock.
#   ! A FAILED VERSION IS NEVER PROMOTED, AND IT DOES NOT BLOCK ITS OWN FIX. FAILED is an
#   adjudication: the owner put it on a phone and ruled. .573 existed solely to repair .572, and a
#   gate that traps the fix behind the defect is inverted -- the 2026-09-03 ruling recorded in
#   phantom-guard.js. The fix ships to main, is seen on staging, is stamped, and promotes; the
#   FAILED version simply never goes.
$verifiedLines = @()
if (Test-Path VERIFIED) { $verifiedLines = @(Get-Content VERIFIED | Where-Object { $_.Trim().Length -gt 0 }) }
if ($verifiedLines.Count -eq 0) { Stop-Promote 'VERIFIED is missing or empty - nothing is adjudicated.' }

function Get-Ruling { param([string]$v)
  if (-not $v) { return $null }
  return $verifiedLines | Where-Object { ($_.Trim() -split '[ ]+')[0] -eq $v } | Select-Object -First 1
}

# FIRST LOCK - the INCOMING version: ruled, and not ruled FAILED.
$headRuling = Get-Ruling $headVersion
if (-not $headRuling) {
  Stop-Promote "$headVersion IS NOT ADJUDICATED. Nothing reaches release before a phone has seen it on PHANTOM STAGING and you have ruled on it:  .\tools\verify.ps1 $headVersion PASS   (or FAIL `"what you saw`"), then re-run this."
}
if ((($headRuling.Trim() -split '[ ]+')) -contains 'FAILED') {
  Stop-Promote "$headVersion is stamped FAILED. A failed version is never promoted - the next ship is its fix."
}
Write-Host "Incoming version adjudicated: $headRuling" -ForegroundColor Green

# SECOND LOCK - the version on `release`, read from the branch and never from a variable this
# script is holding, must also be on record. Under the order above it always is; this catches a
# release that was moved around the tools.
$servedVersion = $null
try {
  $servedRaw = @(Invoke-Git @('show', 'release:version.json') -AllowFail) -join "`n"
  if ($servedRaw -and $LASTEXITCODE -eq 0) { $servedVersion = ($servedRaw | ConvertFrom-Json).version }
}
catch { $servedVersion = $null }

if (-not $servedVersion) {
  Write-Host 'release carries no readable version.json - treating this as a first promote; nothing has been served, so there is nothing to adjudicate.' -ForegroundColor Yellow
}
elseif ($servedVersion -eq $headVersion) {
  Write-Host "release already carries $servedVersion." -ForegroundColor Yellow
}
else {
  $servedRuling = Get-Ruling $servedVersion
  if (-not $servedRuling) {
    Stop-Promote "$servedVersion is on release and was never adjudicated - it got there around the tools. Rule on it first (.\tools\stamp.ps1 $servedVersion VERIFIED|FAILED) before promoting $headVersion over it; burying an unruled version is the stacking this gate exists to prevent."
  }
  Write-Host "Served version adjudicated: $servedRuling" -ForegroundColor Green
}

# ---- What would move ----
$pending = Invoke-Git @('log', '--oneline', 'release..main')
if (-not $pending) {
  Write-Host 'release is already level with main. Nothing to promote.' -ForegroundColor Green
  exit 0
}
# ! THE MODE IS ANNOUNCED BEFORE THE COMMIT LIST, NEVER AFTER IT. Same trap, same fix as
#   tools/stamp.ps1. This block printed "Commits this promote would publish:", then the pending
#   commits, and ONLY THEN "DRY RUN - nothing moved" - so the reassuring content came first and the
#   disclaimer came last.
#   It fired on 2026-09-08: a -DryRun listed `f34982f stamp: phantom-v1.14.581 VERIFIED` under that
#   heading, and the promote was reported as done. release had not moved, locally or on the remote,
#   and Pages kept serving .580.
#   THE SIBLING SCRIPT WAS HARDENED FOR THIS EXACT SHAPE TWO DAYS EARLIER AND THIS ONE WAS NOT
#   CHECKED. A failure class fixed in one of two near-identical tools is not fixed.
if ($DryRun) {
  Write-Host ''
  Write-Host '  ===================================================' -ForegroundColor Yellow
  Write-Host '   DRY RUN - NOTHING BELOW IS PUBLISHED. release WILL NOT MOVE.' -ForegroundColor Yellow
  Write-Host '  ===================================================' -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Commits this promote WOULD publish:' -ForegroundColor Cyan
  $pending | ForEach-Object { Write-Host "  [would-be] $_" }
} else {
  Write-Host 'Commits this promote will publish:' -ForegroundColor Cyan
  $pending | ForEach-Object { Write-Host "  $_" }
}
Write-Host ''

# ---- Guard 5: it must be a fast-forward. release must be an ancestor of main. ----
Invoke-Git @('merge-base', '--is-ancestor', 'release', 'main') -AllowFail | Out-Null
if ($LASTEXITCODE -ne 0) {
  Stop-Promote 'release is NOT an ancestor of main - this would not be a fast-forward.'
}

if ($DryRun) {
  # State what is actually on the remote. "Where is release" is the question a promote turns on,
  # so the tool answers it from the remote rather than leaving a preview to be misread as the move.
  # @() then [0] deliberately: Invoke-Git returns an ARRAY, and `-split` on an array stringifies
  # the whole thing first, which would silently produce a wrong sha rather than fail.
  $remoteSha = '(could not read origin)'
  $remoteNow = @(Invoke-Git @('ls-remote', 'origin', 'refs/heads/release') -AllowFail)
  if ($remoteNow.Count -gt 0 -and $remoteNow[0] -and $remoteNow[0].Length -ge 8) {
    $remoteSha = $remoteNow[0].Substring(0, 8)
  }
  Write-Host 'DRY RUN - NOTHING MOVED. origin/release is still:' -ForegroundColor Yellow
  Write-Host "  $remoteSha" -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Re-run WITHOUT -DryRun to promote, then confirm against the remote and the served bytes:' -ForegroundColor Yellow
  Write-Host '  git ls-remote origin refs/heads/release' -ForegroundColor Yellow
  Write-Host '  (then reload the Pages URL - the build takes a few minutes)' -ForegroundColor Yellow
  exit 0
}

# ---- The promote. CLAUDE.md's documented line, with each step checked. ----
$before = (Invoke-Git @('rev-parse', 'release')).Trim()
try {
  Invoke-Git @('checkout', 'release') | Out-Null
  Invoke-Git @('merge', '--ff-only', 'main') | Out-Null
  Invoke-Git @('push', 'origin', 'release') | Out-Null
}
catch {
  Invoke-Git @('checkout', 'main') -AllowFail | Out-Null
  Stop-Promote "promote failed: $($_.Exception.Message)"
}
finally {
  # Always land back on main, even if something above threw.
  $now = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD')).Trim()
  if ($now -ne 'main') { Invoke-Git @('checkout', 'main') -AllowFail | Out-Null }
}

$after = (Invoke-Git @('rev-parse', 'release')).Trim()
Write-Host ''
Write-Host "release $($before.Substring(0,7)) -> $($after.Substring(0,7))" -ForegroundColor Green
Invoke-Git @('log', '-1', '--oneline') | ForEach-Object { Write-Host "  $_" }

# ---- Confirm the SERVED bytes. A ship you cannot reach is not a ship. ----
Write-Host ''
# PowerShell 5.1 does not negotiate TLS 1.2 by default; github.io refuses anything older, and the
# failure surfaces as an unhelpful 'could not create SSL/TLS secure channel'.
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}
Write-Host 'Checking served version (Pages may take a minute to rebuild)...' -ForegroundColor Cyan
$expected = $null
try { $expected = (Get-Content -Raw version.json | ConvertFrom-Json).version } catch {}

$served = $null
for ($i = 1; $i -le 20; $i++) {
  try {
    $u = "https://darkmatter024.github.io/phantom/version.json?cb=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())-$i"
    $served = (Invoke-RestMethod -Uri $u -TimeoutSec 20).version
  }
  catch { $served = $null }
  if ($served -eq $expected) { break }
  Start-Sleep -Seconds 15
}

if ($served -eq $expected) {
  Write-Host "SERVED: $served" -ForegroundColor Green
  Write-Host "$served was adjudicated before this promote (Guard 4). Nothing further is owed here."
}
else {
  Write-Host "Expected $expected but live still serves $served after ~5 minutes." -ForegroundColor Yellow
  Write-Host 'The push succeeded - this is Pages lagging or failing to build. Check the repo Actions/Pages status.'
}

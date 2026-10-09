#Requires -Version 5.1
<#
  tools/verify-selftest.ps1 - fixture-tests tools/verify.ps1 in a throwaway clone.

  THIS REPO IS NEVER TOUCHED: not its branches, not VERIFIED, not origin. The script bare-clones
  the repo into %TEMP%, clones a working copy from THAT, and every push in every fixture lands in
  the throwaway bare repo. What it reaches on the real network, read-only: the STAGING URL
  (verify.ps1's SERVED-BYTES guard reads it) and the Pages URL (promote.ps1's served-bytes poll
  reads it). A fixture that faked either would be testing a script that does not exist.

  It tests the WORKING-TREE tools/ (verify, stamp, promote), copied into the clone and committed
  there, so an edit is tested BEFORE it is committed here. Run it after any edit to those three.

  What it proves (the order of record since 2026-09-09: main -> staging -> phone -> verify -> promote):
    T1 VERSION-MISMATCH     HEAD carries a different version than the one named       (no network)
    T2 DIRTY-TREE           a tracked file is modified                                 (no network)
    T3 ALREADY-ADJUDICATED  VERIFIED already rules on the version                      (no network)
    T4 NOT-SERVED           origin/main has never carried the version - the .581 class (no network)
    T4b NOT-SERVED          HEAD is not origin/main - a commit the phone cannot have run (no network)
    T7a promote Guard 4     an unadjudicated incoming version is refused, nothing moves (no network)
    T5 FAIL path            stamps FAILED with the reason, pushes main, release does not move
    T7b promote Guard 4     the FAILED version T5 stamped is refused, nothing moves     (no network)
    T6 PASS path            stamps VERIFIED, pushes main, release does NOT move, prints the promote line
    T7c promote after PASS  Guard 4 reads the stamp, release fast-forwards to main, SERVED printed
  Each refusal is also checked to have written nothing: HEAD, release, origin/main, origin/release
  and VERIFIED line 1 are compared before and after.

  T1-T4 run on the ship commit of HEAD's version with VERIFIED not yet ruling on it, so they hold
  on a repo whose HEAD version is already closed (at HEAD they would hit ALREADY-ADJUDICATED
  first). T5/T6/T7 pin the fixture to whichever version STAGING serves RIGHT NOW (same rule), so
  the SERVED-BYTES guard passes. T7c additionally needs the Pages URL to already serve that
  version, or promote.ps1's poll would wait five minutes for a build a throwaway clone never gets;
  otherwise it is SKIPPED. Anything that cannot be read is reported SKIPPED - never PASS.

  Note on the hook: the clone's pre-commit runs tools/hooks/phantom-guard.js, which is pinned to
  THIS repo's path, so fixture commits are gated against this repo's index and stamps, not the
  clone's. The selftest refuses to start while this repo has staged files.

  Usage:
    .\tools\verify-selftest.ps1                run everything, delete the scratch afterwards
    .\tools\verify-selftest.ps1 -KeepScratch   leave the scratch clone on disk for inspection
#>
[CmdletBinding()]
param([switch]$KeepScratch)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$StagingVersionUrl = 'https://phantom-staging.wfj6t2fk7w.workers.dev/version.json'   # what verify.ps1 reads
$PagesVersionUrl = 'https://darkmatter024.github.io/phantom/version.json'             # what promote.ps1 polls

$Scratch = Join-Path $env:TEMP ('phantom-verify-selftest-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
$Bare = Join-Path $Scratch 'origin.git'
$Clone = Join-Path $Scratch 'clone'
$VerifyScript = Join-Path $Clone 'tools\verify.ps1'
$PromoteScript = Join-Path $Clone 'tools\promote.ps1'
$Tools = @('verify.ps1', 'stamp.ps1', 'promote.ps1')

$Results = New-Object System.Collections.Generic.List[object]
function Add-Result { param([string]$Name, [bool]$Ok, [string]$Detail)
  $Results.Add([pscustomobject]@{ Name = $Name; Ok = $Ok; Skipped = $false; Detail = $Detail })
  if ($Ok) { Write-Host "  [PASS] $Name" -ForegroundColor Green }
  else {
    Write-Host "  [FAIL] $Name" -ForegroundColor Red
    if ($Detail) { $Detail -split "`n" | ForEach-Object { Write-Host "         $_" -ForegroundColor Red } }
  }
}
function Add-Skip { param([string]$Name, [string]$Why)
  $Results.Add([pscustomobject]@{ Name = $Name; Ok = $true; Skipped = $true; Detail = $Why })
  Write-Host "  [SKIP] $Name - $Why" -ForegroundColor Yellow
}

function Invoke-GitIn { param([string]$Dir, [string[]]$GitArgs)
  $out = & git -C $Dir @GitArgs
  if ($LASTEXITCODE -ne 0) { throw "git -C $Dir $($GitArgs -join ' ') failed with exit code $LASTEXITCODE" }
  return $out
}
function Get-JsonAt { param([string]$Dir, [string]$Rev)
  return ((@(Invoke-GitIn $Dir @('show', "${Rev}:version.json")) -join "`n") | ConvertFrom-Json)
}
function Get-VerifiedTop { param([string]$Dir)
  return (@(Get-Content (Join-Path $Dir 'VERIFIED') | Where-Object { $_.Trim().Length -gt 0 }))[0]
}
function Get-Sha { param([string]$Dir, [string]$Rev) return (Invoke-GitIn $Dir @('rev-parse', $Rev)).Trim() }
function Get-State { param([string]$Dir)
  return ('HEAD=' + (Get-Sha $Dir 'HEAD') + ' release=' + (Get-Sha $Dir 'release') +
          ' origin/main=' + (Get-Sha $Dir 'origin/main') + ' origin/release=' + (Get-Sha $Dir 'origin/release') +
          ' VERIFIED[0]=' + (Get-VerifiedTop $Dir))
}
function Get-HeadFiles { param([string]$Dir)
  return @(Invoke-GitIn $Dir @('show', '--name-only', '--format=', 'HEAD') | Where-Object { $_.Trim().Length -gt 0 })
}
function Invoke-Verify { param([string[]]$VerifyArgs)
  # A child process: verify.ps1's own exit ends verify.ps1, not this script, and the exit code
  # comes back as a value. Its stdout is captured whole so the banners can be asserted on.
  $lines = @(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $VerifyScript @VerifyArgs)
  $code = $LASTEXITCODE
  return [pscustomobject]@{ Exit = $code; Text = ($lines -join "`n") }
}
function Invoke-Promote {
  # Same shape: promote.ps1 in the clone, as a child process, stdout captured for the assertions.
  $lines = @(& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $PromoteScript)
  $code = $LASTEXITCODE
  return [pscustomobject]@{ Exit = $code; Text = ($lines -join "`n") }
}
function Find-ShipCommit { param([string]$Dir, [string]$Version, [switch]$RequireUnruled)
  foreach ($sha in @(Invoke-GitIn $Dir @('log', '--format=%H', 'main', '--', 'version.json'))) {
    if ((Get-JsonAt $Dir $sha).version -ne $Version) { continue }
    if ($RequireUnruled) {
      $ruled = @(Invoke-GitIn $Dir @('show', "${sha}:VERIFIED") | Where-Object { ($_.Trim() -split '[ ]+')[0] -eq $Version })
      if ($ruled.Count -gt 0) { continue }
    }
    return $sha
  }
  return $null
}
function Copy-ToolsIntoClone {
  # The working-tree scripts, committed in the clone so its tree stays clean and HEAD carries them.
  foreach ($t in $Tools) { Copy-Item (Join-Path $RepoRoot "tools\$t") (Join-Path $Clone "tools\$t") -Force }
  Invoke-GitIn $Clone (@('add', '--') + @($Tools | ForEach-Object { "tools/$_" })) | Out-Null
  $staged = @(Invoke-GitIn $Clone @('diff', '--cached', '--name-only') | Where-Object { $_.Trim().Length -gt 0 })
  if ($staged.Count -gt 0) { Invoke-GitIn $Clone @('commit', '--quiet', '-m', 'selftest: tools/ from the working tree') | Out-Null }
}
function Set-Fixture { param([string]$Sha)
  # main and release both at the fixture commit (working-tree tools committed on top), pushed.
  Invoke-GitIn $Clone @('checkout', '--quiet', '-B', 'main', $Sha) | Out-Null
  Copy-ToolsIntoClone
  Invoke-GitIn $Clone @('branch', '-f', 'release', 'HEAD') | Out-Null
  Invoke-GitIn $Clone @('push', '--quiet', '--force', 'origin', 'main', 'release') | Out-Null
}
function Test-Refusal { param([string]$Name, [string[]]$VerifyArgs, [string]$Guard)
  $before = Get-State $Clone
  $r = Invoke-Verify $VerifyArgs
  $after = Get-State $Clone
  $ok = ($r.Exit -eq 1) -and ($r.Text -match ('REFUSED: ' + [regex]::Escape($Guard))) -and ($after -eq $before)
  $detail = "exit=$($r.Exit) unchanged=$($after -eq $before)`n--- verify.ps1 said ---`n$($r.Text)"
  Add-Result $Name $ok $detail
}

Write-Host ''
Write-Host "verify.ps1 SELFTEST - scratch: $Scratch" -ForegroundColor Cyan
Write-Host "This repo's branches, VERIFIED and origin are not touched. Every push goes to the scratch bare repo." -ForegroundColor Cyan
Write-Host ''

$stagedHere = @(& git -C $RepoRoot diff --cached --name-only | Where-Object { $_.Trim().Length -gt 0 })
if ($stagedHere.Count -gt 0) {
  Write-Host "STOP: this repo has staged files ($($stagedHere -join ', ')). The clone's hook gates against THIS index. Unstage, then re-run." -ForegroundColor Red
  exit 1
}
foreach ($t in $Tools) {
  if (-not (Test-Path (Join-Path $RepoRoot "tools\$t"))) {
    Write-Host "STOP: tools\$t is missing from the working tree - nothing to test." -ForegroundColor Red
    exit 1
  }
}

New-Item -ItemType Directory -Path $Scratch | Out-Null
try {
  Write-Host 'setup: bare origin + clone, hooks wired, working-tree tools committed' -ForegroundColor DarkGray
  Invoke-GitIn $RepoRoot @('clone', '--bare', '--quiet', $RepoRoot, $Bare) | Out-Null
  Invoke-GitIn $Scratch @('clone', '--quiet', $Bare, $Clone) | Out-Null
  Invoke-GitIn $Clone @('config', 'core.hooksPath', 'tools/githooks') | Out-Null
  Invoke-GitIn $Clone @('config', 'user.name', 'phantom-selftest') | Out-Null
  Invoke-GitIn $Clone @('config', 'user.email', 'selftest@phantom.invalid') | Out-Null
  Invoke-GitIn $Clone @('checkout', '--quiet', 'main') | Out-Null
  Invoke-GitIn $Clone @('branch', '--quiet', 'release', 'origin/release') | Out-Null
  Copy-ToolsIntoClone
  Invoke-GitIn $Clone @('push', '--quiet', 'origin', 'main') | Out-Null

  $headJson = Get-JsonAt $Clone 'HEAD'
  $headV = $headJson.version
  $prevV = $headJson.prevVersion
  Write-Host "setup: clone main carries $headV (prev $prevV), release carries $((Get-JsonAt $Clone 'release').version)" -ForegroundColor DarkGray

  # T1-T4 run on the ship commit of HEAD's version with VERIFIED not yet ruling on it, so they hold
  # whatever this repo's VERIFIED says today. At HEAD of a closed ship they would hit
  # ALREADY-ADJUDICATED before the guard under test.
  $fixtureSha = Find-ShipCommit $Clone $headV -RequireUnruled
  if ($fixtureSha) {
    Set-Fixture $fixtureSha
    Write-Host "setup: T1-T4 pinned to $($fixtureSha.Substring(0, 7)) - $headV is unruled there" -ForegroundColor DarkGray
  }
  else { Write-Host "setup: no commit on main carries $headV unruled - T1-T3 run at HEAD, T4/T4b are skipped" -ForegroundColor Yellow }
  Write-Host ''

  # ---- T1: the version named is not the one HEAD carries. ----
  Test-Refusal 'T1 VERSION-MISMATCH: a version HEAD does not carry is refused' @($prevV, 'PASS') 'VERSION-MISMATCH'

  # ---- T2: a tracked file is modified. ----
  Add-Content -Path (Join-Path $Clone 'CLAUDE.md') -Value 'selftest: deliberate dirt'
  Test-Refusal 'T2 DIRTY-TREE: a modified tracked file is refused' @($headV, 'PASS') 'DIRTY-TREE'
  Invoke-GitIn $Clone @('checkout', '--', 'CLAUDE.md') | Out-Null

  # ---- T3: VERIFIED already rules on the version (fixture ruling committed, then removed). ----
  $verifiedPath = Join-Path $Clone 'VERIFIED'
  $keep = @(Get-Content $verifiedPath)
  Set-Content -Path $verifiedPath -Value (@("$headV VERIFIED") + $keep) -Encoding ascii
  Invoke-GitIn $Clone @('commit', '--quiet', '-m', 'selftest: fixture ruling', '--', 'VERIFIED') | Out-Null
  Test-Refusal 'T3 ALREADY-ADJUDICATED: a version VERIFIED already rules on is refused' @($headV, 'PASS') 'ALREADY-ADJUDICATED'
  Invoke-GitIn $Clone @('reset', '--quiet', '--hard', 'HEAD~1') | Out-Null

  # ---- T4: origin/main has never carried the version (the .581 class). ----
  # ---- T4b: HEAD is not origin/main - a local commit origin never received. ----
  if (-not $fixtureSha) {
    Add-Skip 'T4 NOT-SERVED (origin/main)' "no commit on main carries $headV unruled"
    Add-Skip 'T4b NOT-SERVED (HEAD is not origin/main)' "no commit on main carries $headV unruled"
  }
  else {
    $prevSha = Find-ShipCommit $Clone $prevV
    if (-not $prevSha) { Add-Skip 'T4 NOT-SERVED (origin/main)' "no commit on main carries $prevV" }
    else {
      # origin's main is moved back to the previous ship; local main still carries $headV.
      Invoke-GitIn $Clone @('push', '--quiet', '--force', 'origin', "${prevSha}:refs/heads/main") | Out-Null
      Invoke-GitIn $Clone @('fetch', '--quiet', 'origin') | Out-Null
      Test-Refusal 'T4 NOT-SERVED: a version origin/main has never carried is refused' @($headV, 'PASS') 'NOT-SERVED'
      Invoke-GitIn $Clone @('push', '--quiet', '--force', 'origin', 'main') | Out-Null
      Invoke-GitIn $Clone @('fetch', '--quiet', 'origin') | Out-Null
    }
    Add-Content -Path (Join-Path $Clone 'CLAUDE.md') -Value 'selftest: a local commit origin never received'
    Invoke-GitIn $Clone @('commit', '--quiet', '-m', 'selftest: unpushed commit', '--', 'CLAUDE.md') | Out-Null
    Test-Refusal 'T4b NOT-SERVED: a HEAD that is not origin/main (unpushed commit) is refused' @($headV, 'PASS') 'NOT-SERVED'
    Invoke-GitIn $Clone @('reset', '--quiet', '--hard', 'origin/main') | Out-Null
  }

  # ---- T5 / T6 / T7: the real paths, pinned to what STAGING serves right now. ----
  $live = $null
  $liveErr = 'empty response'
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    # ${...} deliberately: '?' is a legal variable-name character, so "$StagingVersionUrl?cb=" is empty.
    $live = (Invoke-RestMethod -Uri "${StagingVersionUrl}?cb=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -TimeoutSec 20).version
  } catch { $live = $null; $liveErr = $_.Exception.Message }

  if (-not $live) {
    Add-Skip 'T7a promote Guard 4 (unadjudicated)' "the staging URL could not be read: $liveErr"
    Add-Skip 'T5 FAIL path' "the staging URL could not be read: $liveErr"
    Add-Skip 'T7b promote Guard 4 (FAILED)' "the staging URL could not be read: $liveErr"
    Add-Skip 'T6 PASS path' "the staging URL could not be read: $liveErr"
    Add-Skip 'T7c promote after PASS' "the staging URL could not be read: $liveErr"
  }
  else {
    Write-Host "setup: staging serves $live - T5/T6/T7 are pinned to it" -ForegroundColor DarkGray
    $sha = Find-ShipCommit $Clone $live -RequireUnruled
    if (-not $sha) {
      Add-Skip 'T7a promote Guard 4 (unadjudicated)' "no commit on main carries $live with VERIFIED not yet ruling on it"
      Add-Skip 'T5 FAIL path' "no commit on main carries $live with VERIFIED not yet ruling on it"
      Add-Skip 'T7b promote Guard 4 (FAILED)' "no commit on main carries $live with VERIFIED not yet ruling on it"
      Add-Skip 'T6 PASS path' "no commit on main carries $live with VERIFIED not yet ruling on it"
      Add-Skip 'T7c promote after PASS' "no commit on main carries $live with VERIFIED not yet ruling on it"
    }
    else {
      # T7a: promote.ps1 refuses the unadjudicated incoming version before any stamp exists.
      # release is parked one commit behind so there is genuinely something to promote.
      Set-Fixture $sha
      Invoke-GitIn $Clone @('branch', '-f', 'release', 'HEAD~1') | Out-Null
      Invoke-GitIn $Clone @('push', '--quiet', '--force', 'origin', 'release') | Out-Null
      $before = Get-State $Clone
      $p = Invoke-Promote
      $after = Get-State $Clone
      $ok = ($p.Exit -eq 1) -and ($p.Text -match 'IS NOT ADJUDICATED') -and ($after -eq $before)
      Add-Result 'T7a promote.ps1 Guard 4: an unadjudicated incoming version is refused, nothing moved' $ok "exit=$($p.Exit) unchanged=$($after -eq $before)`n--- promote.ps1 said ---`n$($p.Text)"

      # T5
      Set-Fixture $sha
      $fixtureHead = Get-Sha $Clone 'HEAD'
      $reason = 'selftest fixture, not a real adjudication'
      $r = Invoke-Verify @($live, 'FAIL', $reason)
      $top = Get-VerifiedTop $Clone
      $files = @(Get-HeadFiles $Clone)   # @() again: a one-element return unrolls to a string, and [0] of that is a letter
      $head = Get-Sha $Clone 'HEAD'
      $om = Get-Sha $Clone 'origin/main'
      $or = Get-Sha $Clone 'origin/release'
      $ok = ($r.Exit -eq 0) -and ($r.Text -match ('RECORDED FAILED ' + [regex]::Escape($live))) -and
            ($top -eq "$live FAILED - $reason") -and ($files.Count -eq 1) -and ($files[0] -eq 'VERIFIED') -and
            ($head -ne $fixtureHead) -and ($om -eq $head) -and ($or -eq $fixtureHead)
      $detail = "exit=$($r.Exit) top='$top' headFiles=[$($files -join ',')] stampCommitted=$($head -ne $fixtureHead) mainPushed=$($om -eq $head) releaseUnmoved=$($or -eq $fixtureHead)`n--- verify.ps1 said ---`n$($r.Text)"
      Add-Result 'T5 FAIL path: FAILED stamped with the reason, main pushed, release not moved' $ok $detail

      # T7b: promote.ps1 refuses the FAILED version T5 just stamped. main is one stamp ahead of
      # release, so the only thing stopping it is Guard 4.
      $before = Get-State $Clone
      $p = Invoke-Promote
      $after = Get-State $Clone
      $ok = ($p.Exit -eq 1) -and ($p.Text -match 'stamped FAILED') -and ($after -eq $before)
      Add-Result 'T7b promote.ps1 Guard 4: a FAILED incoming version is refused, nothing moved' $ok "exit=$($p.Exit) unchanged=$($after -eq $before)`n--- promote.ps1 said ---`n$($p.Text)"

      # T6
      Set-Fixture $sha
      $fixtureHead = Get-Sha $Clone 'HEAD'
      $r = Invoke-Verify @($live, 'PASS')
      $top = Get-VerifiedTop $Clone
      $files = @(Get-HeadFiles $Clone)   # @() again: a one-element return unrolls to a string, and [0] of that is a letter
      $head = Get-Sha $Clone 'HEAD'
      $om = Get-Sha $Clone 'origin/main'
      $or = Get-Sha $Clone 'origin/release'
      $ok = ($r.Exit -eq 0) -and ($r.Text -match ('VERIFIED ' + [regex]::Escape($live) + ' - READY TO PROMOTE')) -and
            ($top -eq "$live VERIFIED") -and ($files.Count -eq 1) -and ($files[0] -eq 'VERIFIED') -and
            ($head -ne $fixtureHead) -and ($om -eq $head) -and ($or -eq $fixtureHead) -and
            ($r.Text -match 'promote\.ps1')
      $detail = "exit=$($r.Exit) top='$top' headFiles=[$($files -join ',')] stampCommitted=$($head -ne $fixtureHead) mainPushed=$($om -eq $head) releaseUnmoved=$($or -eq $fixtureHead)`n--- verify.ps1 said ---`n$($r.Text)"
      Add-Result 'T6 PASS path: VERIFIED stamped, main pushed, release NOT moved, promote line printed' $ok $detail

      # T7c: the promote the owner runs next. promote.ps1's served-bytes poll reads the RELEASE
      # URL, so this is provable only while Pages already serves $live; otherwise the poll would
      # wait five minutes for a build a throwaway clone never gets.
      $pages = $null
      try { $pages = (Invoke-RestMethod -Uri "${PagesVersionUrl}?cb=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())" -TimeoutSec 20).version } catch { $pages = $null }
      if ($pages -ne $live) { Add-Skip 'T7c promote after PASS' "Pages serves '$pages', not $live - promote.ps1's poll would wait five minutes for nothing" }
      else {
        $mainBefore = Get-Sha $Clone 'HEAD'
        $p = Invoke-Promote
        $rel = Get-Sha $Clone 'release'
        $or = Get-Sha $Clone 'origin/release'
        $back = (Invoke-GitIn $Clone @('rev-parse', '--abbrev-ref', 'HEAD')).Trim()
        $ok = ($p.Exit -eq 0) -and ($p.Text -match 'Incoming version adjudicated') -and ($rel -eq $mainBefore) -and
              ($or -eq $mainBefore) -and ($back -eq 'main') -and ($p.Text -match ('SERVED: ' + [regex]::Escape($live)))
        Add-Result 'T7c promote after PASS: Guard 4 reads the stamp, release fast-forwards to main, SERVED printed, back on main' $ok "exit=$($p.Exit) release=$($rel -eq $mainBefore) originRelease=$($or -eq $mainBefore) branch=$back`n--- promote.ps1 said ---`n$($p.Text)"
      }
    }
  }
}
catch {
  Add-Result 'SETUP' $false $_.Exception.Message
}
finally {
  if ($KeepScratch) { Write-Host ''; Write-Host "scratch kept: $Scratch" -ForegroundColor Yellow }
  else {
    try { Remove-Item -Recurse -Force $Scratch -ErrorAction Stop }
    catch { Write-Host "could not delete $Scratch - $($_.Exception.Message)" -ForegroundColor Yellow }
  }
}

$failed = @($Results | Where-Object { -not $_.Ok })
$skipped = @($Results | Where-Object { $_.Skipped })
$passed = $Results.Count - $failed.Count - $skipped.Count
Write-Host ''
if ($failed.Count -eq 0) {
  $skipNote = ''
  if ($skipped.Count -gt 0) { $skipNote = " - SKIPPED, NOT PROVEN: $(($skipped | ForEach-Object { $_.Name }) -join '; ')" }
  Write-Host "SELFTEST PASS - $passed passed, $($skipped.Count) skipped, 0 failed$skipNote" -ForegroundColor Green
  exit 0
}
Write-Host "SELFTEST FAIL - $passed passed, $($skipped.Count) skipped, $($failed.Count) failed" -ForegroundColor Red
exit 1

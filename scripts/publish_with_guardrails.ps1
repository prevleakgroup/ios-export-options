param(
  [string]$PreviewChannelId = 'ops-safe',
  [switch]$SkipExternalDnsChecks,
  [switch]$ValidateOnly,
  [string]$FirebaseProjectId = 'saferide-peld8'
)

$ErrorActionPreference = 'Stop'

function Invoke-And-Assert {
  param(
    [string]$Name,
    [scriptblock]$Command
  )
  Write-Output "`n[STEP] $Name"
  & $Command
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Step failed: $Name"
    exit 1
  }
}

function Test-Urls {
  param(
    [string]$BaseUrl,
    [string[]]$Paths
  )

  $failures = @()
  foreach ($p in $Paths) {
    $url = "$BaseUrl$p"
    $trace = curl.exe -sS -L -o NUL -w "%{http_code}|%{url_effective}" $url
    if ($LASTEXITCODE -ne 0) {
      $failures += "curl failed for $url"
      continue
    }

    $parts = $trace -split '\|'
    if ($parts.Count -lt 2) {
      $failures += "unexpected output for ${url}: ${trace}"
      continue
    }

    $status = [int]$parts[0]
    $effective = $parts[1]
    if ($status -ne 200) {
      $failures += "status $status for $url (effective: $effective)"
    }
  }

  return $failures
}

function Get-GitSourceState {
  param([string]$RepoRoot)

  $branch = (& git -C $RepoRoot rev-parse --abbrev-ref HEAD).Trim()
  $remote = (& git -C $RepoRoot remote get-url origin).Trim()
  $statusOutput = (& git -C $RepoRoot status --short)
  $isDirty = -not [string]::IsNullOrWhiteSpace($statusOutput)
  $statusText = if ($isDirty) { 'changes pending' } else { 'clean' }

  return [pscustomobject]@{
    Branch = $branch
    Remote = $remote
    StatusText = $statusText
    IsDirty = $isDirty
  }
}

function Get-AppHostingStatus {
  param([string]$RepoRoot, [string]$ProjectId)

  $appHostingConfig = Join-Path $RepoRoot 'apphosting.yaml'
  if (-not (Test-Path $appHostingConfig)) {
    return @('apphosting.yaml missing from repository root')
  }

  $content = Get-Content -Path $appHostingConfig -Raw
  $lines = @()
  $lines += 'apphosting.yaml present'
  $lines += if ($content -match 'NEXT_PUBLIC_SITE_URL') { 'NEXT_PUBLIC_SITE_URL is configured' } else { 'NEXT_PUBLIC_SITE_URL is missing' }

  $gcloud = Get-Command gcloud -ErrorAction SilentlyContinue
  if (-not $gcloud) {
    $lines += 'gcloud CLI not available; App Hosting console check skipped'
    return $lines
  }

  $authOutput = @(& gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>$null)
  $authAccount = ($authOutput | ForEach-Object { if ($_ -ne $null) { $_.ToString().Trim() } } | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }) -join [Environment]::NewLine
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($authAccount)) {
    $lines += 'gcloud is installed but no active account is available'
    return $lines
  }

  $backendOutput = (& gcloud apphosting backends list --project $ProjectId --format='value(name)' 2>$null)
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($backendOutput)) {
    $lines += ('App Hosting backends detected: ' + (($backendOutput -split "`r?`n") -join ', '))
  } else {
    $lines += 'App Hosting backend lookup returned no active backends'
  }

  return $lines
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$logDir = Join-Path $repoRoot 'ops\validation-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'

$gitState = Get-GitSourceState -RepoRoot $repoRoot
Write-Output "`n[ANCHOR] GitHub source"
Write-Output "  - Repository: $($gitState.Remote)"
Write-Output "  - Branch: $($gitState.Branch)"
Write-Output "  - Working tree: $($gitState.StatusText)"
Write-Output "[ANCHOR] Firebase project: $FirebaseProjectId"

$appHostingStatus = Get-AppHostingStatus -RepoRoot $repoRoot -ProjectId $FirebaseProjectId
foreach ($entry in $appHostingStatus) {
  Write-Output "  - $entry"
}

Invoke-And-Assert -Name 'Validate source governance' -Command { node "$repoRoot\scripts\validate_operational_contracts.js" }
Invoke-And-Assert -Name 'Validate Firebase setup requirements' -Command { node "$repoRoot\scripts\validate_firebase_setup.js" }
Invoke-And-Assert -Name 'Validate local link integrity' -Command { node "$repoRoot\scripts\validate_link_integrity.js" }
Invoke-And-Assert -Name 'Validate deployment trees' -Command { node "$repoRoot\scripts\validate_deployment_trees.js" }

if (-not $SkipExternalDnsChecks) {
  Invoke-And-Assert -Name 'Validate front-domain forwarding' -Command { powershell -ExecutionPolicy Bypass -File "$repoRoot\scripts\check_front_domains.ps1" }
  Invoke-And-Assert -Name 'Validate DNS TXT/SPF/DMARC' -Command { powershell -ExecutionPolicy Bypass -File "$repoRoot\scripts\validate_dns_txt_records.ps1" }
}

$previewUrl = ''
if (-not $ValidateOnly) {
  Invoke-And-Assert -Name 'Deploy preview channel' -Command {
    firebase hosting:channel:deploy $PreviewChannelId --expires 7d | Tee-Object -FilePath "$logDir\preview-deploy-$ts.log"
  }

  $previewLog = Get-Content "$logDir\preview-deploy-$ts.log" -Raw
  $previewUrl = [regex]::Match($previewLog, 'https://[^\s]+\.web\.app').Value
  if (-not $previewUrl) {
    Write-Error 'Unable to detect preview URL from deploy output.'
    exit 1
  }

  $paths = @('/', '/customer-hub.html', '/rider/index.html', '/driver/index.html', '/apps/plumber-app.html', '/apps/public-reporting-app.html')
  $previewFailures = Test-Urls -BaseUrl $previewUrl -Paths $paths
  if ($previewFailures.Count -gt 0) {
    Write-Error ("Preview smoke checks failed:`n - " + ($previewFailures -join "`n - "))
    exit 1
  }

  Invoke-And-Assert -Name 'Deploy production hosting' -Command {
    firebase deploy --only hosting | Tee-Object -FilePath "$logDir\prod-deploy-$ts.log"
  }

  $prodFailures = Test-Urls -BaseUrl "https://$FirebaseProjectId.web.app" -Paths $paths
  if ($prodFailures.Count -gt 0) {
    Write-Error ("Production smoke checks failed:`n - " + ($prodFailures -join "`n - "))
    exit 1
  }
} else {
  Write-Output "`n[SKIP] Deployment skipped because -ValidateOnly was supplied."
}

$reportPath = Join-Path $logDir "unified-launch-$ts.md"
$reportLines = @(
  '# Unified launch report',
  '',
  '- Source repository: ' + $gitState.Remote,
  '- Branch: ' + $gitState.Branch,
  '- Working tree: ' + $gitState.StatusText,
  '- Firebase project: ' + $FirebaseProjectId,
  '- Preview channel: ' + $PreviewChannelId,
  '- Preview URL: ' + $(if ($previewUrl) { $previewUrl } else { 'not deployed in validate-only mode' }),
  '- Production URL: https://' + $FirebaseProjectId + '.web.app',
  '- GoDaddy / front-domain forwarding: ' + $(if ($SkipExternalDnsChecks) { 'skipped' } else { 'validated by script' }),
  '- App Hosting status: ' + ($appHostingStatus -join '; ')
)
Set-Content -Path $reportPath -Value ($reportLines -join [Environment]::NewLine)

Write-Output "`nPublish with guardrails completed successfully."
if ($previewUrl) {
  Write-Output "Preview URL: $previewUrl"
}
Write-Output "Unified report: $reportPath"
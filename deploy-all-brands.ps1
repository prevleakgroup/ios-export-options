#!/usr/bin/env pwsh

<#
.SYNOPSIS
Deploy each brand to Firebase Hosting with separate domains

.DESCRIPTION
Deploys Prevleak, Saferide, Palettemath, and Qvedic to Firebase with:
- Separate hosting sites for each domain
- Independent DNS configuration
- Custom domain routing (prevleak.company, saferide.company, etc.)

.PARAMETER Environment
Deploy environment: 'production' or 'staging'

.PARAMETER Action
Action to perform: 'deploy', 'verify', or 'all'

.EXAMPLE
.\deploy-all-brands.ps1 -Environment production -Action deploy
#>

param(
  [ValidateSet('production', 'staging')]
  [string]$Environment = 'production',

  [ValidateSet('deploy', 'verify', 'all')]
  [string]$Action = 'all'
)

$ErrorActionPreference = 'Stop'

# Brand configuration
$brands = @(
  @{
    target = 'prevleak'
    site   = 'prevleak-peld8'
    domain = 'prevleak.company'
    dir    = 'download-site/prevleak-site'
    color  = 'Blue'
  },
  @{
    target = 'saferide'
    site   = 'saferide-peld8'
    domain = 'saferide.company'
    dir    = 'download-site/saferide-site'
    color  = 'Green'
  },
  @{
    target = 'palettemath'
    site   = 'palettemath-peld8'
    domain = 'palettemath.company'
    dir    = 'download-site/palettemath-site'
    color  = 'Magenta'
  },
  @{
    target = 'qvedic'
    site   = 'qvedic-peld8'
    domain = 'qvedic.company'
    dir    = 'download-site/qvedic-site'
    color  = 'Cyan'
  }
)

function Write-Status {
  param([string]$Message, [string]$Color = 'White')
  Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

function Test-Environment {
  Write-Status 'Checking deployment environment...' -Color 'Yellow'

  $checks = @{
    'firebase-token' = { $null -ne $env:FIREBASE_TOKEN }
    'firebase-project' = { $null -ne $env:FIREBASE_PROJECT_ID }
    'deployment-dirs' = { 
      $brands | ForEach-Object {
        Test-Path $_.dir
      } | Where-Object { $_ -eq $false } | Measure-Object | Select-Object -ExpandProperty Count -eq 0
    }
  }

  $allPass = $true
  foreach ($check in $checks.GetEnumerator()) {
    $result = & $check.Value
    $status = if ($result) { '✓' } else { '✗' }
    Write-Host "  $status $($check.Key)"
    $allPass = $allPass -and $result
  }

  if (-not $allPass) {
    throw 'Environment check failed. Please verify FIREBASE_TOKEN, FIREBASE_PROJECT_ID, and directories.'
  }

  Write-Status 'Environment check passed ✓' -Color 'Green'
}

function Deploy-Brand {
  param([hashtable]$Brand)

  Write-Status "Deploying $($Brand.target) to $($Brand.domain)..." -Color $Brand.color

  try {
    $deployArgs = @(
      'deploy',
      '--only', "hosting:$($Brand.target)",
      '--project', 'saferide-peld8'
    )

    & firebase @deployArgs

    Write-Status "$($Brand.target) deployed successfully ✓" -Color 'Green'
    return @{
      brand  = $Brand.target
      status = 'success'
      url    = "https://$($Brand.site).web.app"
      domain = $Brand.domain
    }
  }
  catch {
    Write-Status "ERROR deploying $($Brand.target): $_" -Color 'Red'
    return @{
      brand  = $Brand.target
      status = 'failed'
      error  = $_
    }
  }
}

function Verify-Deployment {
  param([hashtable]$Brand)

  Write-Status "Verifying $($Brand.domain)..." -Color $Brand.color

  try {
    # Check if site is accessible
    $response = Invoke-WebRequest -Uri "https://$($Brand.site).web.app" -Method Head -ErrorAction Stop
    
    $status = if ($response.StatusCode -eq 200) {
      Write-Status "$($Brand.domain) is live and responding ✓" -Color 'Green'
      'verified'
    }
    else {
      Write-Status "$($Brand.domain) returned status $($response.StatusCode)" -Color 'Yellow'
      'warning'
    }

    return @{
      brand   = $Brand.target
      status  = $status
      domain  = $Brand.domain
      message = "HTTP $($response.StatusCode)"
    }
  }
  catch {
    Write-Status "ERROR verifying $($Brand.domain): $_" -Color 'Red'
    return @{
      brand   = $Brand.target
      status  = 'failed'
      domain  = $Brand.domain
      error   = $_
    }
  }
}

function Generate-Report {
  param([array]$Results)

  $report = @{
    timestamp = Get-Date -Format 'o'
    environment = $Environment
    action = $Action
    results = $Results
  }

  $reportFile = "deployment-report-multi-brand-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
  $report | ConvertTo-Json | Out-File $reportFile -Encoding UTF8

  Write-Status "Report saved to $reportFile" -Color 'Cyan'
  return $reportFile
}

# Main execution
Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║          Multi-Domain Brand Deployment for Firebase            ║
╚════════════════════════════════════════════════════════════════╝

Environment: $Environment
Action: $Action
Brands: $($brands.Count)
  • $($brands[0].domain) (PrevLeak)
  • $($brands[1].domain) (Saferide)
  • $($brands[2].domain) (Palettemath)
  • $($brands[3].domain) (Qvedic)

"@ -ForegroundColor 'Cyan'

# Execute tasks
Test-Environment

$results = @()

if ($Action -in 'deploy', 'all') {
  Write-Status 'Starting deployment phase...' -Color 'Yellow'
  Write-Host ""

  foreach ($brand in $brands) {
    $result = Deploy-Brand $brand
    $results += $result
    Write-Host ""
  }
}

if ($Action -in 'verify', 'all') {
  Write-Status 'Starting verification phase...' -Color 'Yellow'
  Write-Host ""

  foreach ($brand in $brands) {
    $result = Verify-Deployment $brand
    $results += $result
    Start-Sleep -Seconds 1
  }
  
  Write-Host ""
}

# Generate summary
$reportFile = Generate-Report $results

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                    Deployment Summary                          ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor 'Cyan'

$results | ForEach-Object {
  $icon = switch ($_.status) {
    'success' { '✓' }
    'verified' { '✓' }
    'warning' { '⚠' }
    default { '✗' }
  }

  $color = switch ($_.status) {
    'success' { 'Green' }
    'verified' { 'Green' }
    'warning' { 'Yellow' }
    default { 'Red' }
  }

  Write-Host "$icon  $($_.brand)" -ForegroundColor $color -NoNewline
  Write-Host " → $($_.domain)" 

  if ($_.url) {
    Write-Host "   URL: $($_.url)" -ForegroundColor 'Gray'
  }
  if ($_.error) {
    Write-Host "   Error: $($_.error)" -ForegroundColor 'Red'
  }
}

Write-Host ""
Write-Status 'Deployment complete' -Color 'Green'

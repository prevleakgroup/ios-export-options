$ErrorActionPreference = 'Stop'

$sourceOfTruthPath = Join-Path $PSScriptRoot '..\company-docs\routing-dns-source-of-truth.json'
if (-not (Test-Path $sourceOfTruthPath)) {
  Write-Error "Missing source-of-truth file: $sourceOfTruthPath"
  exit 1
}

$sourceOfTruth = Get-Content -Raw -Path $sourceOfTruthPath | ConvertFrom-Json
$expected = @()
foreach ($entry in $sourceOfTruth.forwarding) {
  $expected += @{ Domain = $entry.domain; MustContain = $entry.mustContain }
}

$failures = @()

foreach ($item in $expected) {
  $domain = $item.Domain
  $mustContain = $item.MustContain
  $url = "https://$domain"

  Write-Output "Checking $url"
  $trace = curl.exe -sS -L -o NUL -w "%{url_effective}|%{num_redirects}|%{http_code}" $url

  if ($LASTEXITCODE -ne 0) {
    $failures += "curl failed for $domain"
    continue
  }

  $parts = $trace -split '\|'
  if ($parts.Count -lt 3) {
    $failures += ('Unexpected curl output for {0}: {1}' -f $domain, $trace)
    continue
  }

  $effectiveUrl = $parts[0]
  $redirects = [int]$parts[1]
  $status = [int]$parts[2]

  if ($status -ne 200) {
    $failures += ('Unexpected status for {0}: {1}' -f $domain, $status)
  }

  if ($effectiveUrl -notlike "*$mustContain*") {
    $failures += "Wrong destination for ${domain}. Expected to contain '${mustContain}' but got '${effectiveUrl}'"
  }

  if ($redirects -gt 10) {
    $failures += ('Too many redirects for {0}: {1}' -f $domain, $redirects)
  }
}

if ($failures.Count -gt 0) {
  Write-Error ("Front domain checks failed:`n - " + ($failures -join "`n - "))
  exit 1
}

Write-Output 'Front domain checks passed.'

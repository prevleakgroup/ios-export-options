param(
  [string[]]$Domains
)

$ErrorActionPreference = 'Stop'

$sourceOfTruthPath = Join-Path $PSScriptRoot '..\company-docs\routing-dns-source-of-truth.json'
if (-not (Test-Path $sourceOfTruthPath)) {
  Write-Error "Missing source-of-truth file: $sourceOfTruthPath"
  exit 1
}

$sourceOfTruth = Get-Content -Raw -Path $sourceOfTruthPath | ConvertFrom-Json

if (-not $Domains -or $Domains.Count -eq 0) {
  $Domains = @($sourceOfTruth.dnsPolicy.domains)
}

$expectedApex = @($sourceOfTruth.dnsPolicy.apexTxtRequired)

$expectedDmarc = $sourceOfTruth.dnsPolicy.dmarcRequired

$anyFailures = $false

foreach ($domain in $Domains) {
  Write-Output "`n=== $domain ==="

  $apexTxt = @()
  $dmarcTxt = @()

  try {
    $apexTxt = Resolve-DnsName -Name $domain -Type TXT -ErrorAction Stop |
      Where-Object { $_.Type -eq 'TXT' } |
      ForEach-Object { ($_.Strings -join '') }
  }
  catch {
    Write-Output 'Apex TXT lookup failed'
  }

  try {
    $dmarcTxt = Resolve-DnsName -Name "_dmarc.$domain" -Type TXT -ErrorAction Stop |
      Where-Object { $_.Type -eq 'TXT' } |
      ForEach-Object { ($_.Strings -join '') }
  }
  catch {
    Write-Output 'DMARC TXT lookup failed'
  }

  Write-Output 'Apex TXT records:'
  if ($apexTxt.Count -gt 0) {
    $apexTxt | ForEach-Object { Write-Output " - $_" }
  }
  else {
    Write-Output ' - <none>'
  }

  Write-Output '_dmarc TXT records:'
  if ($dmarcTxt.Count -gt 0) {
    $dmarcTxt | ForEach-Object { Write-Output " - $_" }
  }
  else {
    Write-Output ' - <none>'
  }

  $hasTxtTag = $apexTxt -contains $expectedApex[0]
  $hasSpf = $apexTxt -contains $expectedApex[1]
  $hasDmarc = $dmarcTxt -contains $expectedDmarc

  if ($hasTxtTag -and $hasSpf -and $hasDmarc) {
    Write-Output 'STATUS: PASS'
  }
  else {
    $anyFailures = $true
    if (-not $hasTxtTag) { Write-Output 'STATUS: FAIL missing T9229417' }
    if (-not $hasSpf) { Write-Output 'STATUS: FAIL missing SPF record' }
    if (-not $hasDmarc) { Write-Output 'STATUS: FAIL missing/mismatch DMARC record' }
  }
}

if ($anyFailures) {
  Write-Error 'DNS TXT/SPF/DMARC validation failed for one or more domains.'
  exit 1
}

Write-Output "`nAll domains passed DNS TXT/SPF/DMARC validation."

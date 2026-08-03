param(
  [string[]]$Domains
)

$ErrorActionPreference = 'Stop'

function Get-TxtRecords {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  if (Get-Command Resolve-DnsName -ErrorAction SilentlyContinue) {
    try {
      $records = Resolve-DnsName -Name $Name -Type TXT -ErrorAction Stop |
        Where-Object { $_.Type -eq 'TXT' } |
        ForEach-Object { ($_.Strings -join '') }

      if ($null -ne $records) {
        return @($records)
      }
    }
    catch {
      Write-Verbose "Resolve-DnsName failed for $Name"
    }
  }

  $dig = Get-Command dig -ErrorAction SilentlyContinue
  if ($dig) {
    try {
      $output = & $dig.Source +short TXT $Name 2>$null
      if ($LASTEXITCODE -eq 0) {
        return @($output | ForEach-Object {
          $value = $_.ToString().Trim()
          if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
            $value = $value.Substring(1, $value.Length - 2)
          }
          $value = $value -replace '" "', '"'
          return $value
        } | Where-Object { $_ })
      }
    }
    catch {
      Write-Verbose "dig failed for $Name"
    }
  }

  $nslookup = Get-Command nslookup -ErrorAction SilentlyContinue
  if ($nslookup) {
    try {
      $output = & $nslookup.Source -type=TXT $Name 2>$null
      if ($LASTEXITCODE -eq 0) {
        $results = @()
        foreach ($line in $output) {
          if ($line -match 'text =') {
            $value = ($line -split '=', 2)[1].Trim()
            if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
              $value = $value.Substring(1, $value.Length - 2)
            }
            $results += $value
          }
        }
        return @($results | Where-Object { $_ })
      }
    }
    catch {
      Write-Verbose "nslookup failed for $Name"
    }
  }

  return @()
}

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
    $apexTxt = Get-TxtRecords -Name $domain
  }
  catch {
    Write-Output 'Apex TXT lookup failed'
  }

  try {
    $dmarcTxt = Get-TxtRecords -Name "_dmarc.$domain"
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

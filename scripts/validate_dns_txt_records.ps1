param(
  [string[]]$Domains
)

$ErrorActionPreference = 'Stop'

function Get-TxtRecords {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  $normalize = {
    param([string]$Value)
    if ($null -eq $Value) {
      return $null
    }

    $text = $Value.Trim()
    if ($text.StartsWith('"') -and $text.EndsWith('"')) {
      $text = $text.Substring(1, $text.Length - 2)
    }

    return $text
  }

  if (Get-Command Resolve-DnsName -ErrorAction SilentlyContinue) {
    try {
      $records = Resolve-DnsName -Name $Name -Type TXT -ErrorAction Stop |
        Where-Object { $_.Type -eq 'TXT' } |
        ForEach-Object { ($_.Strings -join '') }

      if ($null -ne $records) {
        return @($records | ForEach-Object { & $normalize -Value $_ })
      }
    }
    catch {
      # fall through to alternative resolvers
    }
  }

  if (Get-Command dig -ErrorAction SilentlyContinue) {
    $rawOutput = & dig +short TXT $Name 2>$null
    if ($LASTEXITCODE -eq 0 -and $rawOutput) {
      $records = @()
      foreach ($line in @($rawOutput)) {
        $record = & $normalize -Value $line
        if ($null -ne $record) {
          $records += $record
        }
      }

      if ($records.Count -gt 0) {
        return $records
      }
    }
  }

  if (Get-Command nslookup -ErrorAction SilentlyContinue) {
    $rawOutput = & nslookup -type=TXT $Name 2>$null
    if ($LASTEXITCODE -eq 0 -and $rawOutput) {
      $records = @()
      foreach ($line in @($rawOutput)) {
        if ($line -match 'text\s*=\s*"?(?<value>[^"]+)"?') {
          $record = $Matches.value
          if ($record) {
            $records += $record
          }
        }
        elseif ($line -match 'TXT\s+"(?<value>[^"]+)"') {
          $record = $Matches.value
          if ($record) {
            $records += $record
          }
        }
      }

      if ($records.Count -gt 0) {
        return $records
      }
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

  $apexTxt = @(Get-TxtRecords -Name $domain)
  if ($apexTxt.Count -eq 0) {
    Write-Output 'Apex TXT lookup failed'
  }

  $dmarcTxt = @(Get-TxtRecords -Name "_dmarc.$domain")
  if ($dmarcTxt.Count -eq 0) {
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

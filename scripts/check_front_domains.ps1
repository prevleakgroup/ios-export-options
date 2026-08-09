$ErrorActionPreference = 'Stop'

function Invoke-HttpProbe {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,
    [int]$MaxRedirects = 10
  )

  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.AllowAutoRedirect = $false
  $client = [System.Net.Http.HttpClient]::new($handler)
  $client.Timeout = [TimeSpan]::FromSeconds(20)

  try {
    $redirectCount = 0
    $currentUri = $Uri

    while ($true) {
      $request = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $currentUri)
      try {
        $response = $client.SendAsync($request).GetAwaiter().GetResult()
      }
      finally {
        $request.Dispose()
      }

      try {
        if ($response.StatusCode -ge [System.Net.HttpStatusCode]::MultipleChoices -and $response.StatusCode -lt [System.Net.HttpStatusCode]::BadRequest) {
          $redirectCount++
          if ($redirectCount -gt $MaxRedirects) {
            throw [System.InvalidOperationException]::new('Too many redirects')
          }

          $location = $response.Headers.Location
          if ($null -eq $location) {
            throw [System.InvalidOperationException]::new('Redirect response without Location header')
          }

          if ($location.IsAbsoluteUri) {
            $currentUri = $location.AbsoluteUri
          }
          else {
            $currentUri = [Uri]::new([Uri]::new($currentUri), $location).AbsoluteUri
          }

          continue
        }

        return [pscustomobject]@{
          StatusCode = [int]$response.StatusCode
          EffectiveUrl = $currentUri
        }
      }
      finally {
        $response.Dispose()
      }
    }
  }
  finally {
    $client.Dispose()
  }
}

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

  try {
    $probe = Invoke-HttpProbe -Uri $url
    $effectiveUrl = $probe.EffectiveUrl
    $status = $probe.StatusCode
  }
  catch {
    if ($_.Exception.Message -eq 'Too many redirects') {
      $failures += ('Too many redirects for {0}' -f $domain)
    }
    else {
      $failures += ('Probe request failed for {0}: {1}' -f $domain, $_.Exception.Message)
    }

    continue
  }

  if ($status -ne 200) {
    $failures += ('Unexpected status for {0}: {1}' -f $domain, $status)
  }

  if ($effectiveUrl -notlike "*$mustContain*") {
    $failures += "Wrong destination for ${domain}. Expected to contain '${mustContain}' but got '${effectiveUrl}'"
  }
}

if ($failures.Count -gt 0) {
  Write-Error ("Front domain checks failed:`n - " + ($failures -join "`n - "))
  exit 1
}

Write-Output 'Front domain checks passed.'

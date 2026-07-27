param(
  [switch]$Publish,
  [switch]$SkipExternalDnsChecks,
  [string]$PreviewChannelId = 'ops-safe',
  [string]$FirebaseProjectId = 'saferide-peld8'
)

$ErrorActionPreference = 'Stop'

function Invoke-Step {
  param(
    [string]$Name,
    [scriptblock]$Cmd
  )

  Write-Output "`n[PC/DC] $Name"
  & $Cmd
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Step failed: $Name"
    exit 1
  }
}

Write-Output "[PC/DC] Firebase operator started"

Invoke-Step -Name 'Confirm active Firebase project alias' -Cmd {
  firebase use
}

Invoke-Step -Name 'List Firebase hosting sites' -Cmd {
  firebase hosting:sites:list --project $FirebaseProjectId
}

Invoke-Step -Name 'Validate Firebase setup requirements' -Cmd {
  node scripts/validate_firebase_setup.js
}

Invoke-Step -Name 'Validate deployment trees' -Cmd {
  node scripts/validate_deployment_trees.js
}

Invoke-Step -Name 'Validate link integrity and contracts' -Cmd {
  node scripts/validate_link_integrity.js
  node scripts/validate_operational_contracts.js
}

if ($Publish) {
  if ($SkipExternalDnsChecks) {
    Invoke-Step -Name 'Publish with guardrails (Firebase-focused)' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId -SkipExternalDnsChecks
    }
  }
  else {
    Invoke-Step -Name 'Publish with guardrails (full external checks)' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId
    }
  }
}
else {
  if ($SkipExternalDnsChecks) {
    Invoke-Step -Name 'Validate-only guardrails (skip external DNS checks)' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -ValidateOnly -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId -SkipExternalDnsChecks
    }
  }
  else {
    Invoke-Step -Name 'Validate-only guardrails (with external DNS checks)' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -ValidateOnly -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId
    }
  }
}

Write-Output "`n[PC/DC] Completed successfully"

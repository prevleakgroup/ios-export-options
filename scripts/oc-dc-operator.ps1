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

  Write-Output "`n[OC/DC] $Name"
  & $Cmd
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Step failed: $Name"
    exit 1
  }
}

Write-Output "[OC/DC] Holding operator started"
Write-Output "[OC/DC] Mode: $([string]::Join(', ', @($(if($Publish){'publish'} else {'validate-only'}), $(if($SkipExternalDnsChecks){'skip-external-dns'} else {'with-external-dns'}))))"

Invoke-Step -Name 'Auto-fix safe public link targets' -Cmd { node scripts/auto_fix_link_targets.js }
Invoke-Step -Name 'Validate Firebase setup requirements' -Cmd { node scripts/validate_firebase_setup.js }
Invoke-Step -Name 'Validate deployment tree isolation' -Cmd { node scripts/validate_deployment_trees.js }
Invoke-Step -Name 'Validate operational contracts' -Cmd { node scripts/validate_operational_contracts.js }
Invoke-Step -Name 'Validate link integrity' -Cmd { node scripts/validate_link_integrity.js }

if ($Publish) {
  if ($SkipExternalDnsChecks) {
    Invoke-Step -Name 'Publish with guardrails (skip external DNS checks)' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId -SkipExternalDnsChecks
    }
  }
  else {
    Invoke-Step -Name 'Publish with guardrails (full checks)' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId
    }
  }
}
else {
  if ($SkipExternalDnsChecks) {
    Invoke-Step -Name 'Guardrail validation-only run' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -ValidateOnly -SkipExternalDnsChecks -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId
    }
  }
  else {
    Invoke-Step -Name 'Guardrail validation-only run with external checks' -Cmd {
      powershell -ExecutionPolicy Bypass -File scripts/publish_with_guardrails.ps1 -ValidateOnly -PreviewChannelId $PreviewChannelId -FirebaseProjectId $FirebaseProjectId
    }
  }
}

Write-Output "`n[OC/DC] Completed successfully"

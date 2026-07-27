$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$destDir = Join-Path $env:USERPROFILE "Downloads\assessment-build-artifacts"

New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$files = @(
    @{ Source = Join-Path $scriptDir "app-build-artifacts.zip"; Name = "app-build-artifacts.zip" },
    @{ Source = Join-Path $repoRoot "app\build\outputs\apk\debug\app-debug.apk"; Name = "app-debug.apk" },
    @{ Source = Join-Path $repoRoot "app\build\outputs\apk\release\app-release.apk"; Name = "app-release.apk" },
    @{ Source = Join-Path $repoRoot "app\build\outputs\bundle\release\app-release.aab"; Name = "app-release.aab" },
    @{ Source = Join-Path $repoRoot "app\build\intermediates\intermediary_bundle\release\packageReleaseBundle\intermediary-bundle.aab"; Name = "intermediary-bundle.aab" }
)

foreach ($file in $files) {
    if (Test-Path $file.Source) {
        Copy-Item $file.Source (Join-Path $destDir $file.Name) -Force
        Write-Host "Copied $($file.Name)"
    } else {
        Write-Warning "Missing source file: $($file.Source)"
    }
}

Write-Host "Artifacts saved to: $destDir"

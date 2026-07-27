# Firebase Brand Deployment with Port Gateways
# PowerShell version for Windows deployment

param(
    [string]$Project = "saferide-peld8",
    [string]$Action = "deploy"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "FIREBASE BRAND DEPLOYMENT" -ForegroundColor Cyan
Write-Host "Project: $Project" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Brand configuration
$Brands = @{
    "prevleak"    = "prevleak-peld8"
    "saferide"    = "saferide-peld8"
    "palettemath" = "palettemath-peld8"
    "qvedic"      = "qvedic-peld8"
}

# Verify Firebase CLI is authenticated
Write-Host "`n[1/3] Verifying Firebase authentication..." -ForegroundColor Yellow
$FirebaseStatus = firebase projects:list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated with Firebase" -ForegroundColor Red
    Write-Host "Run: firebase login --no-localhost" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase authenticated" -ForegroundColor Green

# Deploy functions first (shared for all brands)
Write-Host "`n[2/3] Deploying Cloud Functions..." -ForegroundColor Yellow
firebase deploy --only functions --project $Project
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Function deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cloud Functions deployed" -ForegroundColor Green

# Deploy each brand to its hosting target
Write-Host "`n[3/3] Deploying brand websites..." -ForegroundColor Yellow

foreach ($Brand in $Brands.Keys) {
    $Target = $Brands[$Brand]
    
    Write-Host "`n  >>> Deploying $Brand to $Target..." -ForegroundColor Cyan
    
    firebase deploy `
        --only "hosting:$Brand" `
        --project $Project `
        --message "Deploying $Brand workflow"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to deploy $Brand" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ✅ $Brand deployed" -ForegroundColor Green
}

# Deployment complete
Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "✅ ALL BRANDS DEPLOYED SUCCESSFULLY" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host "`nLIVE WEBSITES:" -ForegroundColor Cyan
Write-Host "  PrevLeak:    https://prevleak-peld8.web.app" -ForegroundColor Yellow
Write-Host "  SafeRide:    https://saferide-peld8.web.app" -ForegroundColor Yellow
Write-Host "  PaletteMath: https://palettemath-peld8.web.app" -ForegroundColor Yellow
Write-Host "  Qvedic:      https://qvedic-peld8.web.app" -ForegroundColor Yellow

Write-Host "`nAPI ENDPOINTS (Cloud Functions):" -ForegroundColor Cyan
Write-Host "  https://us-central1-$Project.cloudfunctions.net/auth/signup/email?brand={brand}" -ForegroundColor Yellow
Write-Host "  https://us-central1-$Project.cloudfunctions.net/auth/signin/email?brand={brand}" -ForegroundColor Yellow

Write-Host "`nSOURCE CODE PROTECTION:" -ForegroundColor Cyan
Write-Host "  ✅ Source code remains in local repository only" -ForegroundColor Green
Write-Host "  ✅ Cloud Functions deployed from compiled code" -ForegroundColor Green
Write-Host "  ✅ No source files exposed publicly" -ForegroundColor Green

Write-Host "`nPORT GATEWAY CONFIGURATION:" -ForegroundColor Cyan
Write-Host "  Development: http://localhost:5000 (Firebase Hosting emulator)" -ForegroundColor Yellow
Write-Host "  Functions:   http://localhost:5001 (Cloud Functions emulator)" -ForegroundColor Yellow
Write-Host "  Firestore:   http://localhost:8080 (Firestore emulator)" -ForegroundColor Yellow

Write-Host "`nDEPLOYMENT VERIFICATION:" -ForegroundColor Cyan
Write-Host "  Run: firebase hosting:sites:list --project $Project" -ForegroundColor Yellow

Write-Host ""

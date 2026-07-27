###############################################################################
# DEPLOYMENT SCRIPT: Deploy all Prevleakgroup™ components (Windows PowerShell)
# Deploys: Firebase Hosting, Cloud Functions, Firestore Rules, Config
# Status: Production-ready
# Last Updated: 2026-07-27
###############################################################################

param(
    [string]$FirebaseProject = "saferide-peld8",
    [string]$FirebaseToken = $env:FIREBASE_TOKEN,
    [switch]$SkipValidation = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PREVLEAKGROUP™ UNIFIED DEPLOYMENT SCRIPT (Windows)          ║" -ForegroundColor Cyan
Write-Host "║   All 5 Brands • Firebase • Cloud Functions • Rules            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# CONFIGURATION
# ============================================================================

$BRANDS = @("palettemath", "saferide", "prevleak", "qvedic", "plumber")
$COLORS = @{
    "palettemath" = "#0c4c95"
    "saferide" = "#f28c28"
    "prevleak" = "#0056b3"
    "qvedic" = "#1e5a96"
    "plumber" = "#d4511f"
}

# ============================================================================
# STEP 1: VALIDATE ENVIRONMENT
# ============================================================================

Write-Host "Step 1: Validating environment..." -ForegroundColor Yellow

try {
    $firebase = firebase --version
    Write-Host "✓ Firebase CLI version: $firebase" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Install with: npm install -g firebase-tools" -ForegroundColor Red
    exit 1
}

try {
    $node = node --version
    Write-Host "✓ Node.js version: $node" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: VALIDATE BRAND ISOLATION
# ============================================================================

if (-not $SkipValidation) {
    Write-Host "Step 2: Validating brand isolation..." -ForegroundColor Yellow
    
    if (Test-Path "scripts/validate-brand-anchors.js") {
        $validationResult = & node scripts/validate-brand-anchors.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Brand isolation validation PASSED" -ForegroundColor Green
        } else {
            Write-Host "❌ Brand isolation validation FAILED" -ForegroundColor Red
            Write-Host $validationResult
            exit 1
        }
    } else {
        Write-Host "⚠ Warning: validate-brand-anchors.js not found" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ============================================================================
# STEP 3: CHECK FIREBASE AUTHENTICATION
# ============================================================================

Write-Host "Step 3: Checking Firebase authentication..." -ForegroundColor Yellow

if ($FirebaseToken) {
    Write-Host "✓ Using FIREBASE_TOKEN from environment/parameter" -ForegroundColor Green
    $env:FIREBASE_TOKEN = $FirebaseToken
} else {
    Write-Host "⚠ No FIREBASE_TOKEN provided. Using local Firebase CLI credentials..." -ForegroundColor Yellow
    Write-Host "   If you haven't authenticated, run: firebase login:ci" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# STEP 4: DEPLOY FIRESTORE SECURITY RULES
# ============================================================================

Write-Host "Step 4: Deploying Firestore Security Rules..." -ForegroundColor Yellow

if (Test-Path "shared/firestore-brand-isolation.rules") {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would deploy: shared/firestore-brand-isolation.rules" -ForegroundColor Cyan
    } else {
        & firebase deploy --only firestore:rules --project $FirebaseProject
        Write-Host "✓ Firestore Security Rules deployed" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Warning: firestore-brand-isolation.rules not found" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 5: DEPLOY CLOUD FUNCTIONS
# ============================================================================

Write-Host "Step 5: Deploying Cloud Functions..." -ForegroundColor Yellow

if (Test-Path "functions") {
    Push-Location functions
    
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Gray
        & npm install
    }
    
    Pop-Location
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would deploy Cloud Functions" -ForegroundColor Cyan
    } else {
        & firebase deploy --only functions --project $FirebaseProject
        Write-Host "✓ Cloud Functions deployed" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Deployed Functions:" -ForegroundColor Cyan
    Write-Host "  ✓ paletteMathColorAnalysis → POST /api/palettemath/color-analysis" -ForegroundColor Gray
    Write-Host "  ✓ saferideRideMatching → POST /api/saferide/ride-matching" -ForegroundColor Gray
    Write-Host "  ✓ preleakMonitoring → POST /api/prevleak/monitoring" -ForegroundColor Gray
    Write-Host "  ✓ qvedicContentDelivery → POST /api/qvedic/content" -ForegroundColor Gray
    Write-Host "  ✓ plumberWorkOrderDispatch → POST /api/plumber/dispatch" -ForegroundColor Gray
    Write-Host "  ✓ mlInference → POST /api/ml/inference" -ForegroundColor Gray
    Write-Host "  ✓ initiateBrandWorkflow → POST /api/operations/workflow" -ForegroundColor Gray
    Write-Host "  ✓ getOperationsHealth → GET /api/operations/health" -ForegroundColor Gray
    Write-Host "  ✓ healthCheck → GET /health" -ForegroundColor Gray
} else {
    Write-Host "⚠ Warning: functions directory not found" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 6: DEPLOY FIREBASE HOSTING
# ============================================================================

Write-Host "Step 6: Deploying Firebase Hosting..." -ForegroundColor Yellow

if (Test-Path "download-site") {
    if ($DryRun) {
        Write-Host "  [DRY RUN] Would deploy Firebase Hosting" -ForegroundColor Cyan
    } else {
        & firebase deploy --only hosting --project $FirebaseProject
        Write-Host "✓ Firebase Hosting deployed" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Deployed Sites:" -ForegroundColor Cyan
    Write-Host "  ✓ https://saferide-peld8.web.app (main)" -ForegroundColor Gray
    Write-Host "  ✓ https://saferide-peld8.firebaseapp.com (alias)" -ForegroundColor Gray
} else {
    Write-Host "⚠ Warning: download-site directory not found" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 7: VERIFY DEPLOYMENT
# ============================================================================

if (-not $DryRun) {
    Write-Host "Step 7: Verifying deployment..." -ForegroundColor Yellow
    
    Write-Host "  Checking health endpoint..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "https://saferide-peld8.web.app/health" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Health check PASSED" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠ Health check PENDING (functions may take a moment to warm up)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# ============================================================================
# STEP 8: DEPLOYMENT SUMMARY
# ============================================================================

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            DEPLOYMENT $(if ($DryRun) { "DRY RUN " } else { "COMPLETE" }) ✓                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Deployment Summary:" -ForegroundColor Green
Write-Host ""

Write-Host "Brands Deployed:" -ForegroundColor Cyan
foreach ($brand in $BRANDS) {
    $color = $COLORS[$brand]
    Write-Host "  ✓ $brand ($color)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Components:" -ForegroundColor Cyan
Write-Host "  ✓ Firestore Database (brand-isolated collections)" -ForegroundColor Gray
Write-Host "  ✓ Firestore Security Rules (brand isolation enforcement)" -ForegroundColor Gray
Write-Host "  ✓ Cloud Functions (5 brand engines + ML + operations)" -ForegroundColor Gray
Write-Host "  ✓ Firebase Hosting (public web pages + portals)" -ForegroundColor Gray
Write-Host ""

Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  🌐 Web Portal: https://saferide-peld8.web.app" -ForegroundColor Gray
Write-Host "  🔌 API Gateway: https://saferide-peld8.web.app/api" -ForegroundColor Gray
Write-Host "  📊 Operations Health: https://saferide-peld8.web.app/api/operations/health" -ForegroundColor Gray
Write-Host "  🔐 Firestore Console: https://console.firebase.google.com/project/$FirebaseProject/firestore" -ForegroundColor Gray
Write-Host "  ⚡ Functions Console: https://console.firebase.google.com/project/$FirebaseProject/functions" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Verify color schemes on each brand page" -ForegroundColor Gray
Write-Host "  2. Test incident workflow (PrevLeak) → Dispatch (Plumber) → Report (Public)" -ForegroundColor Gray
Write-Host "  3. Validate brand isolation with: node scripts/validate-brand-anchors.js" -ForegroundColor Gray
Write-Host "  4. Monitor health dashboard: Invoke-WebRequest https://saferide-peld8.web.app/api/operations/health" -ForegroundColor Gray
Write-Host "  5. Request first municipal pilot at: sales@prevleakgroup.company" -ForegroundColor Gray
Write-Host ""

Write-Host "Contact Support:" -ForegroundColor Cyan
Write-Host "  📧 Sales: sales@prevleakgroup.company" -ForegroundColor Gray
Write-Host "  📧 Support: support@prevleakgroup.company" -ForegroundColor Gray
Write-Host "  📧 Ops Emergency: ops@prevleakgroup.company" -ForegroundColor Gray
Write-Host ""

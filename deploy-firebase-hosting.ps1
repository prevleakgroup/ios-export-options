# Firebase Hosting Deployment Script - All Domains Anchored
# Deploys download-site to Firebase (saferide-peld8) with all custom domains

param(
    [ValidateSet('deploy', 'emulate', 'serve', 'verify')]
    [string]$Action = 'deploy',
    
    [ValidateSet('production', 'staging')]
    [string]$Environment = 'production',
    
    [string]$SiteDir = "download-site"
)

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       Firebase Hosting Deployment - All Domains Anchored      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$FirebaseProject = "saferide-peld8"
$Domains = @("prevleak.company", "saferide.company", "palettemath.company", "qvedic.company")

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Project: $FirebaseProject" -ForegroundColor Cyan
Write-Host "  Environment: $Environment" -ForegroundColor Cyan
Write-Host "  Domains: $($Domains -join ', ')" -ForegroundColor Cyan
Write-Host "  Action: $Action" -ForegroundColor Cyan
Write-Host ""

# Function: Deploy to Firebase
function Deploy-ToFirebase {
    param($Project, $SiteDirectory)
    
    Write-Host "🚀 Deploying to Firebase Hosting..." -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    
    # Check if firebase.json exists
    if (-not (Test-Path "firebase.json")) {
        Write-Host "❌ firebase.json not found" -ForegroundColor Red
        exit 1
    }
    
    # Check if .firebaserc exists
    if (-not (Test-Path ".firebaserc")) {
        Write-Host "❌ .firebaserc not found" -ForegroundColor Red
        exit 1
    }
    
    # Check if deployment directory exists
    if (-not (Test-Path $SiteDirectory)) {
        Write-Host "❌ $SiteDirectory not found" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ All configuration files present" -ForegroundColor Green
    Write-Host "✅ Deployment directory: $SiteDirectory" -ForegroundColor Green
    Write-Host ""
    
    try {
        Write-Host "📤 Uploading to Firebase..." -ForegroundColor Cyan
        firebase deploy --project $Project --public $SiteDirectory --only hosting
        
        Write-Host ""
        Write-Host "✅ Firebase deployment successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Deployment Information:" -ForegroundColor Yellow
        Write-Host "  Project: $Project" -ForegroundColor Cyan
        Write-Host "  Hosting URL: https://$Project.web.app" -ForegroundColor Cyan
        Write-Host "  Custom Domains:" -ForegroundColor Cyan
        foreach ($domain in $Domains) {
            Write-Host "    • https://$domain (awaiting DNS config)" -ForegroundColor Gray
        }
        
    }
    catch {
        Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Function: Local Emulation
function Emulate-Firebase {
    Write-Host "🔧 Starting Firebase Local Emulator..." -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "Local URLs:" -ForegroundColor Yellow
    Write-Host "  Hosting: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "  Emulator UI: http://localhost:4000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    
    firebase emulators:start --project $FirebaseProject
}

# Function: Serve locally
function Serve-Locally {
    Write-Host "🖥️  Serving locally (preview mode)..." -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "Local URL: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    
    firebase serve --project $FirebaseProject --public $SiteDir
}

# Function: Verify Deployment
function Verify-Deployment {
    Write-Host "✅ Verifying Firebase Deployment..." -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Firebase Project Status:" -ForegroundColor Yellow
    firebase projects:list --filter=$FirebaseProject
    
    Write-Host ""
    Write-Host "Hosting Deployments:" -ForegroundColor Yellow
    firebase hosting:list --project $FirebaseProject
    
    Write-Host ""
    Write-Host "✅ Deployment Configuration:" -ForegroundColor Green
    Write-Host "  Site directory: $SiteDir" -ForegroundColor Cyan
    Write-Host "  Environment: $Environment" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Custom Domains Status:" -ForegroundColor Yellow
    foreach ($domain in $Domains) {
        Write-Host "  • $domain - Configure in Firebase Console → Hosting" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Open: https://console.firebase.google.com/project/$FirebaseProject/hosting" -ForegroundColor Cyan
    Write-Host "  2. Add custom domains" -ForegroundColor Cyan
    Write-Host "  3. Configure DNS in GoDaddy" -ForegroundColor Cyan
}

# Main execution
switch ($Action) {
    'deploy' {
        Deploy-ToFirebase -Project $FirebaseProject -SiteDirectory $SiteDir
    }
    'emulate' {
        Emulate-Firebase
    }
    'serve' {
        Serve-Locally
    }
    'verify' {
        Verify-Deployment
    }
    default {
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green

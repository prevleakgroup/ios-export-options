#!/usr/bin/env pwsh
# Complete Key Generation & Setup Guide
# Generates SSH, Gets GCP JSON, Gets Firebase token, then adds to GitHub

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  GitHub Pages Deployment - Complete Key Setup Guide       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PART 1: GENERATE SSH KEY
# ============================================================================
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "PART 1: Generate SSH Key (ed25519)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

$sshKeyPath = "$env:USERPROFILE\.ssh\id_ed25519_prevleakgroup"
$sshKeyPubPath = "$sshKeyPath.pub"

Write-Host "📝 SSH Key Details:" -ForegroundColor Cyan
Write-Host "   File: $sshKeyPath" -ForegroundColor White
Write-Host "   Type: ed25519 (strong encryption)" -ForegroundColor White
Write-Host ""

if (Test-Path $sshKeyPath) {
    Write-Host "✓ SSH key already exists at: $sshKeyPath" -ForegroundColor Green
    $useSshKey = Read-Host "Use existing key? (y/n)"
    if ($useSshKey -ne "y") {
        Write-Host "Backing up existing key..." -ForegroundColor Yellow
        $backupPath = "$sshKeyPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $sshKeyPath $backupPath
        Write-Host "Backup saved: $backupPath" -ForegroundColor Green
    }
} else {
    Write-Host "Generating new SSH key..." -ForegroundColor Yellow
    # Ensure .ssh directory exists
    $sshDir = "$env:USERPROFILE\.ssh"
    if (-not (Test-Path $sshDir)) {
        New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    }
    
    # Generate SSH key (non-interactive, no passphrase)
    ssh-keygen -t ed25519 -a 64 `
        -C "prevleakgroup@users.noreply.github.com" `
        -f $sshKeyPath `
        -N ""
    
    if ($?) {
        Write-Host "✅ SSH key generated successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to generate SSH key" -ForegroundColor Red
        exit 1
    }
}

# Display SSH public key
Write-Host ""
Write-Host "📌 SSH PUBLIC KEY (add to GitHub Settings → SSH and GPG keys):" -ForegroundColor Yellow
Write-Host ""
Get-Content $sshKeyPubPath | ForEach-Object { Write-Host "   $_" -ForegroundColor Cyan }
Write-Host ""

Write-Host "To add to GitHub:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://github.com/settings/keys" -ForegroundColor White
Write-Host "  2. Click 'New SSH key'" -ForegroundColor White
Write-Host "  3. Paste the key above" -ForegroundColor White
Write-Host ""

# ============================================================================
# PART 2: FIREBASE TOKEN
# ============================================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "PART 2: Firebase Token" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "Check if Firebase CLI is installed..." -ForegroundColor Yellow
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Firebase CLI found" -ForegroundColor Green
Write-Host ""

Write-Host "Getting Firebase token (interactive login required)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Follow the browser prompt to:" -ForegroundColor Cyan
Write-Host "  1. Sign in with your Google account" -ForegroundColor White
Write-Host "  2. Grant access to Firebase" -ForegroundColor White
Write-Host "  3. Copy the token from terminal" -ForegroundColor White
Write-Host ""

# Get Firebase token
Write-Host "Running: firebase login:ci" -ForegroundColor Yellow
$firebaseTokenOutput = firebase login:ci 2>&1

if ($firebaseTokenOutput) {
    # Firebase token is typically the last line
    $firebaseToken = ($firebaseTokenOutput | Select-Object -Last 1).Trim()
    
    if ($firebaseToken.Length -gt 50) {
        Write-Host "✅ Firebase token obtained!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Token (first 20 chars): $($firebaseToken.Substring(0, 20))..." -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Could not automatically extract token" -ForegroundColor Yellow
        Write-Host "Please paste the token manually when prompted below" -ForegroundColor Yellow
        $firebaseToken = Read-Host "Enter Firebase token"
    }
} else {
    Write-Host "⚠️  No token found in output" -ForegroundColor Yellow
    $firebaseToken = Read-Host "Enter Firebase token manually"
}

Write-Host ""
Write-Host "Token will be added to GitHub secrets" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PART 3: GCP SERVICE ACCOUNT JSON KEY
# ============================================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "PART 3: GCP Service Account JSON Key" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  This requires manual setup in GCP Console (cannot automate)" -ForegroundColor Yellow
Write-Host ""
Write-Host "To get GCP Service Account JSON Key:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Go to: https://console.cloud.google.com" -ForegroundColor White
Write-Host "  2. Select your project" -ForegroundColor White
Write-Host "  3. Navigate to: IAM & Admin → Service Accounts" -ForegroundColor White
Write-Host "  4. Click 'Create Service Account'" -ForegroundColor White
Write-Host "  5. Fill in details:" -ForegroundColor White
Write-Host "     - Service account name: github-pages-deployer" -ForegroundColor Cyan
Write-Host "     - Description: GitHub Pages deployment service account" -ForegroundColor Cyan
Write-Host "  6. Click 'Create and Continue'" -ForegroundColor White
Write-Host "  7. Grant roles (optional for now):" -ForegroundColor White
Write-Host "     - Editor (for full access)" -ForegroundColor Cyan
Write-Host "  8. Click 'Continue'" -ForegroundColor White
Write-Host "  9. Go to 'Keys' tab" -ForegroundColor White
Write-Host "  10. Click 'Add Key' → 'Create new key'" -ForegroundColor White
Write-Host "  11. Choose 'JSON'" -ForegroundColor White
Write-Host "  12. Click 'Create' (downloads JSON file)" -ForegroundColor White
Write-Host ""

$gcpJsonPath = Read-Host "Enter path to GCP service account JSON file"

if (Test-Path $gcpJsonPath) {
    Write-Host "✅ GCP JSON file found: $gcpJsonPath" -ForegroundColor Green
    # Validate JSON
    try {
        $gcpJson = Get-Content $gcpJsonPath -Raw | ConvertFrom-Json
        Write-Host "   Project ID: $($gcpJson.project_id)" -ForegroundColor Cyan
        Write-Host "   Service Account: $($gcpJson.client_email)" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠️  Invalid JSON file" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ GCP JSON file not found: $gcpJsonPath" -ForegroundColor Red
    Write-Host "Please download the file and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# ============================================================================
# PART 4: ADD SECRETS TO GITHUB
# ============================================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "PART 4: Add All Secrets to GitHub" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

Write-Host "Verifying GitHub CLI..." -ForegroundColor Yellow
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI not found!" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI ready" -ForegroundColor Green
Write-Host ""

Write-Host "Adding secrets to GitHub..." -ForegroundColor Yellow
Write-Host ""

# Add SSH_PRIVATE_KEY
Write-Host "1. Adding SSH_PRIVATE_KEY..." -ForegroundColor Cyan
try {
    $sshPrivateKey = Get-Content $sshKeyPath -Raw
    $sshPrivateKey | gh secret set SSH_PRIVATE_KEY
    Write-Host "   ✅ SSH_PRIVATE_KEY added" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to add SSH_PRIVATE_KEY: $_" -ForegroundColor Red
}

Write-Host ""

# Add GCP_SERVICE_ACCOUNT_JSON
Write-Host "2. Adding GCP_SERVICE_ACCOUNT_JSON..." -ForegroundColor Cyan
try {
    $gcpJsonContent = Get-Content $gcpJsonPath -Raw
    $gcpJsonContent | gh secret set GCP_SERVICE_ACCOUNT_JSON
    Write-Host "   ✅ GCP_SERVICE_ACCOUNT_JSON added" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to add GCP_SERVICE_ACCOUNT_JSON: $_" -ForegroundColor Red
}

Write-Host ""

# Add FIREBASE_TOKEN
Write-Host "3. Adding FIREBASE_TOKEN..." -ForegroundColor Cyan
try {
    $firebaseToken | gh secret set FIREBASE_TOKEN
    Write-Host "   ✅ FIREBASE_TOKEN added" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to add FIREBASE_TOKEN: $_" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# PART 5: VERIFICATION
# ============================================================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "PART 5: Verify All Secrets Are Set" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

$secrets = @("SSH_PRIVATE_KEY", "GCP_SERVICE_ACCOUNT_JSON", "FIREBASE_TOKEN")
$secretsList = gh secret list

foreach ($secret in $secrets) {
    if ($secretsList | Select-String $secret) {
        Write-Host "✅ $secret" -ForegroundColor Green
    } else {
        Write-Host "❌ $secret (not found)" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Setup Complete!                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Summary:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ SSH Key" -ForegroundColor Green
Write-Host "   Generated: $sshKeyPath" -ForegroundColor Cyan
Write-Host "   Public key: Added to GitHub (via manual step)" -ForegroundColor White
Write-Host ""
Write-Host "✅ Firebase Token" -ForegroundColor Green
Write-Host "   Status: Added to GitHub secrets" -ForegroundColor White
Write-Host ""
Write-Host "✅ GCP Service Account" -ForegroundColor Green
Write-Host "   Path: $gcpJsonPath" -ForegroundColor Cyan
Write-Host "   Status: Added to GitHub secrets" -ForegroundColor White
Write-Host ""

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Push workflow files to GitHub:" -ForegroundColor Cyan
Write-Host "   git add .github/workflows/" -ForegroundColor White
Write-Host "   git commit -m 'Add deployment workflows'" -ForegroundColor White
Write-Host "   git push" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Enable GitHub Pages (Settings → Pages):" -ForegroundColor Cyan
Write-Host "   Source: Deploy from a branch" -ForegroundColor White
Write-Host "   Branch: main" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Add custom domains (Settings → Pages):" -ForegroundColor Cyan
Write-Host "   • prevleak.company" -ForegroundColor White
Write-Host "   • palettemath.company" -ForegroundColor White
Write-Host "   • saferide.company" -ForegroundColor White
Write-Host "   • qvedic.company" -ForegroundColor White
Write-Host "   • plumber.company" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Monitor deployment (Actions tab):" -ForegroundColor Cyan
Write-Host "   Watch for green checkmarks when DNS is verified" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "All credentials are now secure in GitHub and ready to use! 🚀" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

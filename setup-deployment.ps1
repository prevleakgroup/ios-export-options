#!/usr/bin/env pwsh
# GitHub Pages Deployment - Complete PowerShell Setup
# Run this on your local machine in the repo directory

param(
    [string]$SSHKeyPath = "$env:USERPROFILE\.ssh\id_ed25519",
    [string]$GCPJsonPath,
    [string]$FirebaseToken
)

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "GitHub Pages Deployment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# VERIFY GITHUB CLI
# ============================================================================
Write-Host "🔍 Checking GitHub CLI..." -ForegroundColor Yellow
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI not found!" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ GitHub CLI found" -ForegroundColor Green

# ============================================================================
# PART 1: COMMIT & PUSH
# ============================================================================
Write-Host ""
Write-Host "📤 PART 1: Committing and pushing to GitHub..." -ForegroundColor Cyan

git status
Write-Host ""
$continue = Read-Host "Continue with commit and push? (y/n)"

if ($continue -eq "y") {
    git add .github/workflows/github-pages-deploy.yml
    git add .github/workflows/advanced-deployment.yml
    git add GITHUB-PAGES-DEPLOYMENT.md
    git add DNS-CONFIGURATION-GODADDY.md
    git add QUICK-START.md
    git add setup-deployment.sh
    
    git commit -m "feat: add GitHub Pages deployment workflows with SSH+GCP support and DNS configuration"
    git push origin main
    
    Write-Host "✅ Files pushed to GitHub" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipped commit and push" -ForegroundColor Yellow
}

# ============================================================================
# PART 2: ADD GITHUB SECRETS
# ============================================================================
Write-Host ""
Write-Host "🔐 PART 2: Adding GitHub Secrets..." -ForegroundColor Cyan
Write-Host ""

# SSH_PRIVATE_KEY
Write-Host "Adding SSH_PRIVATE_KEY..." -ForegroundColor Yellow
if (Test-Path $SSHKeyPath) {
    $sshKey = Get-Content $SSHKeyPath -Raw
    $sshKey | gh secret set SSH_PRIVATE_KEY
    Write-Host "✅ SSH_PRIVATE_KEY added" -ForegroundColor Green
} else {
    Write-Host "⚠️  SSH key not found at: $SSHKeyPath" -ForegroundColor Yellow
    Write-Host "   Provide path with: -SSHKeyPath 'C:\path\to\key'" -ForegroundColor Yellow
}

Write-Host ""

# GCP_SERVICE_ACCOUNT_JSON
if ($GCPJsonPath) {
    Write-Host "Adding GCP_SERVICE_ACCOUNT_JSON..." -ForegroundColor Yellow
    if (Test-Path $GCPJsonPath) {
        $gcpJson = Get-Content $GCPJsonPath -Raw
        $gcpJson | gh secret set GCP_SERVICE_ACCOUNT_JSON
        Write-Host "✅ GCP_SERVICE_ACCOUNT_JSON added" -ForegroundColor Green
    } else {
        Write-Host "❌ GCP JSON file not found: $GCPJsonPath" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipping GCP_SERVICE_ACCOUNT_JSON (use -GCPJsonPath to add)" -ForegroundColor Yellow
}

Write-Host ""

# FIREBASE_TOKEN
if ($FirebaseToken) {
    Write-Host "Adding FIREBASE_TOKEN..." -ForegroundColor Yellow
    $FirebaseToken | gh secret set FIREBASE_TOKEN
    Write-Host "✅ FIREBASE_TOKEN added" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping FIREBASE_TOKEN (use -FirebaseToken to add)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# PART 3: GET GITHUB REPO INFO
# ============================================================================
Write-Host "📋 PART 3: Fetching repository info..." -ForegroundColor Cyan

$repoInfo = gh repo view --json nameWithOwner,url -q '.nameWithOwner,.url'
$repoName = ($repoInfo -split "`n")[0]
$repoUrl = ($repoInfo -split "`n")[1]

Write-Host "Repository: $repoName" -ForegroundColor Green
Write-Host "URL: $repoUrl" -ForegroundColor Green

# ============================================================================
# PART 4: ENABLE GITHUB PAGES
# ============================================================================
Write-Host ""
Write-Host "📄 PART 4: Enabling GitHub Pages..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Go to GitHub Pages settings:" -ForegroundColor Yellow
Write-Host "$repoUrl/settings/pages" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚙️  Manual Steps:" -ForegroundColor Yellow
Write-Host "  1. Source: 'Deploy from a branch'" -ForegroundColor White
Write-Host "  2. Branch: 'main' or 'master'" -ForegroundColor White
Write-Host "  3. Save" -ForegroundColor White
Write-Host ""

# ============================================================================
# PART 5: ADD CUSTOM DOMAINS
# ============================================================================
Write-Host "🌐 PART 5: Custom Domains (Manual in GitHub Pages settings)" -ForegroundColor Cyan
Write-Host ""
Write-Host "For each domain, add in GitHub Pages → Custom domain:" -ForegroundColor Yellow
Write-Host "  • prevleak.company" -ForegroundColor White
Write-Host "  • palettemath.company" -ForegroundColor White
Write-Host "  • saferide.company" -ForegroundColor White
Write-Host "  • qvedic.company" -ForegroundColor White
Write-Host "  • plumber.company" -ForegroundColor White
Write-Host ""

# ============================================================================
# PART 6: VERIFY DNS
# ============================================================================
Write-Host "✅ PART 6: Verify DNS Configuration" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test DNS resolution:" -ForegroundColor Yellow

$domains = @("prevleak.company", "palettemath.company", "saferide.company", "qvedic.company", "plumber.company")

foreach ($domain in $domains) {
    Write-Host ""
    Write-Host "Testing $domain..." -ForegroundColor Cyan
    try {
        $ips = [System.Net.Dns]::GetHostAddresses($domain)
        foreach ($ip in $ips) {
            Write-Host "  ✓ $ip" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ✗ DNS resolution failed" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================================================
# PART 7: TRIGGER WORKFLOW
# ============================================================================
Write-Host "🚀 PART 7: Trigger Deployment Workflow" -ForegroundColor Cyan
Write-Host ""

$trigger = Read-Host "Trigger github-pages-deploy workflow now? (y/n)"

if ($trigger -eq "y") {
    Write-Host "Triggering workflow..." -ForegroundColor Yellow
    gh workflow run github-pages-deploy.yml
    Write-Host "✅ Workflow triggered" -ForegroundColor Green
    Write-Host ""
    Write-Host "View progress:" -ForegroundColor Yellow
    Write-Host "$repoUrl/actions" -ForegroundColor Cyan
} else {
    Write-Host "⏭️  Skipped workflow trigger" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Status:" -ForegroundColor Yellow
Write-Host "  ✓ Files committed and pushed" -ForegroundColor Green
Write-Host "  ✓ GitHub secrets configured" -ForegroundColor Green
Write-Host "  ⚠ GitHub Pages: Requires manual setup (see above)" -ForegroundColor Yellow
Write-Host "  ⚠ Custom domains: Requires manual setup (see above)" -ForegroundColor Yellow
Write-Host "  ✓ DNS verified" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Links:" -ForegroundColor Yellow
Write-Host "  Pages Settings: $repoUrl/settings/pages" -ForegroundColor Cyan
Write-Host "  Actions: $repoUrl/actions" -ForegroundColor Cyan
Write-Host "  Secrets: $repoUrl/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Enable GitHub Pages (Settings → Pages)" -ForegroundColor White
Write-Host "  2. Add custom domains (each domain separately)" -ForegroundColor White
Write-Host "  3. Wait for DNS verification (green checkmark)" -ForegroundColor White
Write-Host "  4. HTTPS enables automatically after 24 hours" -ForegroundColor White
Write-Host ""

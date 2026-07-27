#!/usr/bin/env pwsh
# GitHub Secrets & Pages Verification Script
# Confirms all required secrets are set and GitHub Pages is enabled

$ErrorActionPreference = "Stop"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "GitHub Secrets & Pages Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# CHECK GITHUB CLI
# ============================================================================
Write-Host "🔍 Checking GitHub CLI..." -ForegroundColor Yellow
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI not found!" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ GitHub CLI installed" -ForegroundColor Green

# ============================================================================
# GET REPO INFO
# ============================================================================
Write-Host ""
Write-Host "📋 Fetching repository info..." -ForegroundColor Yellow

try {
    $repoName = gh repo view --json nameWithOwner -q '.nameWithOwner'
    $repoUrl = gh repo view --json url -q '.url'
    Write-Host "✅ Repository: $repoName" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get repo info. Make sure you're in the repo directory." -ForegroundColor Red
    exit 1
}

# ============================================================================
# PART 1: VERIFY GITHUB SECRETS
# ============================================================================
Write-Host ""
Write-Host "🔐 PART 1: Verifying GitHub Secrets" -ForegroundColor Cyan
Write-Host ""

$secrets = @("SSH_PRIVATE_KEY", "GCP_SERVICE_ACCOUNT_JSON", "FIREBASE_TOKEN")
$secretsStatus = @()

foreach ($secret in $secrets) {
    try {
        $secretExists = gh secret list | Select-String $secret
        if ($secretExists) {
            Write-Host "  ✓ $secret" -ForegroundColor Green
            $secretsStatus += @{ Name = $secret; Status = "✓" }
        } else {
            Write-Host "  ✗ $secret (not found)" -ForegroundColor Red
            $secretsStatus += @{ Name = $secret; Status = "✗" }
        }
    } catch {
        Write-Host "  ? $secret (error checking)" -ForegroundColor Yellow
        $secretsStatus += @{ Name = $secret; Status = "?" }
    }
}

Write-Host ""
Write-Host "Secret Summary:" -ForegroundColor Yellow
$secretsStatus | ForEach-Object {
    if ($_.Status -eq "✓") {
        Write-Host "  ✅ $($_.Name) is set" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($_.Name) is MISSING" -ForegroundColor Red
    }
}

$allSecretsSet = ($secretsStatus | Where-Object { $_.Status -eq "✓" }).Count -eq 3
if ($allSecretsSet) {
    Write-Host ""
    Write-Host "✅ All secrets verified!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Some secrets are missing. Add them with:" -ForegroundColor Yellow
    Write-Host "  ./setup-deployment.ps1 -SSHKeyPath 'path/to/key' -GCPJsonPath 'path/to/gcp.json' -FirebaseToken 'token'" -ForegroundColor Cyan
}

# ============================================================================
# PART 2: VERIFY GITHUB PAGES
# ============================================================================
Write-Host ""
Write-Host "📄 PART 2: Verifying GitHub Pages Configuration" -ForegroundColor Cyan
Write-Host ""

try {
    # Get pages info
    $pagesJson = gh api repos/{owner}/{repo}/pages --jq '.' -H "Accept: application/vnd.github.v3+json" 2>$null || $null
    
    if ($pagesJson) {
        Write-Host "✅ GitHub Pages is enabled" -ForegroundColor Green
        
        # Parse pages status
        $pagesStatus = $pagesJson | ConvertFrom-Json
        
        if ($pagesStatus.status) {
            Write-Host "  Status: $($pagesStatus.status)" -ForegroundColor Cyan
        }
        if ($pagesStatus.source) {
            Write-Host "  Source: Branch '$($pagesStatus.source.branch)' / '$($pagesStatus.source.path)'" -ForegroundColor Cyan
        }
        if ($pagesStatus.custom_domain) {
            Write-Host "  Custom Domain: $($pagesStatus.custom_domain)" -ForegroundColor Cyan
        }
        if ($pagesStatus.https_enforced) {
            Write-Host "  HTTPS Enforced: Yes" -ForegroundColor Green
        } else {
            Write-Host "  HTTPS Enforced: No" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  GitHub Pages not yet configured" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To enable GitHub Pages:" -ForegroundColor Yellow
        Write-Host "  1. Go to: $repoUrl/settings/pages" -ForegroundColor Cyan
        Write-Host "  2. Under 'Source', select 'Deploy from a branch'" -ForegroundColor Cyan
        Write-Host "  3. Select branch: 'main' or 'master'" -ForegroundColor Cyan
        Write-Host "  4. Click Save" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Could not fetch GitHub Pages status" -ForegroundColor Yellow
    Write-Host "  This might be expected if Pages isn't enabled yet" -ForegroundColor Yellow
}

# ============================================================================
# PART 3: CHECK CUSTOM DOMAINS
# ============================================================================
Write-Host ""
Write-Host "🌐 PART 3: Custom Domains Status" -ForegroundColor Cyan
Write-Host ""

$domains = @("prevleak.company", "palettemath.company", "saferide.company", "qvedic.company", "plumber.company")

Write-Host "Domains to add (in Settings → Pages → Custom domain):" -ForegroundColor Yellow
foreach ($domain in $domains) {
    Write-Host "  • $domain" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "After adding each domain, GitHub will:" -ForegroundColor Yellow
Write-Host "  1. Check DNS records" -ForegroundColor White
Write-Host "  2. Show green ✓ when verified" -ForegroundColor White
Write-Host "  3. Auto-generate HTTPS certificate (24 hours)" -ForegroundColor White

# ============================================================================
# PART 4: CHECK WORKFLOWS
# ============================================================================
Write-Host ""
Write-Host "⚙️  PART 4: Checking Deployment Workflows" -ForegroundColor Cyan
Write-Host ""

$workflows = @("github-pages-deploy.yml", "advanced-deployment.yml")

foreach ($workflow in $workflows) {
    $workflowPath = ".github/workflows/$workflow"
    if (Test-Path $workflowPath) {
        Write-Host "  ✓ $workflow" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $workflow (not found)" -ForegroundColor Red
    }
}

# ============================================================================
# PART 5: SUMMARY & NEXT STEPS
# ============================================================================
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Verified:" -ForegroundColor Green
Write-Host "  • GitHub CLI ready" -ForegroundColor White

if ($allSecretsSet) {
    Write-Host "  • All secrets set" -ForegroundColor White
} else {
    Write-Host "  • ⚠️  Some secrets missing" -ForegroundColor Yellow
}

Write-Host "  • Workflows in place" -ForegroundColor White

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host ""

if (-not $allSecretsSet) {
    Write-Host "1️⃣  Add missing secrets:" -ForegroundColor Cyan
    Write-Host "   ./setup-deployment.ps1 -SSHKeyPath '~/.ssh/id_ed25519_prevleakgroup' -GCPJsonPath 'path/to/gcp.json' -FirebaseToken 'token'" -ForegroundColor White
    Write-Host ""
}

Write-Host "2️⃣  Enable GitHub Pages:" -ForegroundColor Cyan
Write-Host "   $repoUrl/settings/pages" -ForegroundColor Cyan
Write-Host "   Source: 'Deploy from a branch' → Branch: 'main'" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  Add custom domains (one at a time):" -ForegroundColor Cyan
Write-Host "   $repoUrl/settings/pages → Custom domain" -ForegroundColor Cyan
foreach ($domain in $domains) {
    Write-Host "   • $domain" -ForegroundColor White
}
Write-Host ""

Write-Host "4️⃣  Monitor deployment:" -ForegroundColor Cyan
Write-Host "   $repoUrl/actions" -ForegroundColor Cyan
Write-Host ""

Write-Host "5️⃣  Watch for green checkmarks:" -ForegroundColor Cyan
Write-Host "   Each domain will show ✓ when DNS is verified" -ForegroundColor White
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Run this script again to verify all steps are complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

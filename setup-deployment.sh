#!/bin/bash
# GitHub Pages Deployment - Complete Setup Script
# Run this script to push code and set up secrets locally
# Part 1 & 2 only (GitHub setup). Parts 3-5 require manual steps.

set -e

echo "================================"
echo "GitHub Pages Deployment Setup"
echo "================================"
echo ""

# ============================================================================
# PART 1: COMMIT & PUSH TO GITHUB
# ============================================================================
echo "📤 PART 1: Committing files to GitHub..."
echo ""

git status

echo ""
read -p "Continue with commit? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .github/workflows/github-pages-deploy.yml
    git add .github/workflows/advanced-deployment.yml
    git add GITHUB-PAGES-DEPLOYMENT.md
    git add DNS-CONFIGURATION-GODADDY.md
    git add QUICK-START.md
    
    git commit -m "feat: add GitHub Pages deployment workflows and DNS configuration"
    git push origin main
    
    echo "✅ Files pushed to GitHub"
else
    echo "⏭️  Skipped commit and push"
fi

echo ""

# ============================================================================
# PART 2: ADD GITHUB SECRETS (via CLI)
# ============================================================================
echo "🔐 PART 2: GitHub Secrets Configuration"
echo ""
echo "You have two options:"
echo "  A) Manual: GitHub UI (Settings → Secrets and variables → Actions)"
echo "  B) CLI: Use 'gh' command (requires GitHub CLI)"
echo ""

read -p "Use GitHub CLI to add secrets? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Checking if GitHub CLI is installed..."
    if ! command -v gh &> /dev/null; then
        echo "❌ GitHub CLI not found. Install from: https://cli.github.com"
        echo ""
        echo "Using GitHub UI instead (manual)..."
    else
        echo "✅ GitHub CLI found"
        echo ""
        
        # SSH_PRIVATE_KEY
        echo "Adding SSH_PRIVATE_KEY secret..."
        read -p "Enter path to SSH private key file (e.g., ~/.ssh/id_ed25519): " ssh_key_path
        if [ -f "$ssh_key_path" ]; then
            gh secret set SSH_PRIVATE_KEY < "$ssh_key_path"
            echo "✅ SSH_PRIVATE_KEY added"
        else
            echo "❌ SSH key file not found at: $ssh_key_path"
        fi
        
        echo ""
        
        # GCP_SERVICE_ACCOUNT_JSON
        echo "Adding GCP_SERVICE_ACCOUNT_JSON secret..."
        read -p "Enter path to GCP service account JSON file: " gcp_json_path
        if [ -f "$gcp_json_path" ]; then
            gh secret set GCP_SERVICE_ACCOUNT_JSON < "$gcp_json_path"
            echo "✅ GCP_SERVICE_ACCOUNT_JSON added"
        else
            echo "❌ GCP JSON file not found at: $gcp_json_path"
        fi
        
        echo ""
        
        # FIREBASE_TOKEN
        echo "Adding FIREBASE_TOKEN secret..."
        echo "Get this from: firebase login:ci (paste the token)"
        read -sp "Enter Firebase token: " firebase_token
        echo
        echo "$firebase_token" | gh secret set FIREBASE_TOKEN
        echo "✅ FIREBASE_TOKEN added"
        
        echo ""
        echo "✅ All secrets added via GitHub CLI"
    fi
else
    echo "⏭️  Skipped CLI setup"
fi

echo ""

# ============================================================================
# PART 3: DNS CONFIGURATION (Manual - Print for reference)
# ============================================================================
echo "📋 PART 3: DNS Configuration (Manual Steps)"
echo ""
echo "Add these DNS records in GoDaddy for EACH domain:"
echo ""
echo "Domain: prevleak.company"
echo "  A Records:"
echo "    185.199.108.153"
echo "    185.199.109.153"
echo "    185.199.110.153"
echo "    185.199.111.153"
echo "  CNAME: www → prevleakgroup.github.io"
echo ""
echo "Repeat for:"
echo "  - palettemath.company"
echo "  - saferide.company"
echo "  - qvedic.company"
echo "  - plumber.company"
echo ""
echo "Full guide: DNS-CONFIGURATION-GODADDY.md"
echo ""

# ============================================================================
# PART 4: ENABLE GITHUB PAGES (Manual - Print instructions)
# ============================================================================
echo "📄 PART 4: Enable GitHub Pages (Manual Steps)"
echo ""
echo "1. Go to: GitHub → Your Repo → Settings → Pages"
echo "2. Source: Select 'Deploy from a branch'"
echo "3. Branch: Select 'main' or 'master'"
echo "4. Click Save"
echo "5. Under 'Custom domain': Add each domain"
echo "   - prevleak.company"
echo "   - palettemath.company"
echo "   - saferide.company"
echo "   - qvedic.company"
echo "   - plumber.company"
echo ""

# ============================================================================
# PART 5: MONITOR WORKFLOW
# ============================================================================
echo "✅ PART 5: Monitor Workflow"
echo ""
echo "Open GitHub Actions to watch deployment:"
echo "  https://github.com/prevleakgroup/ios-export-options/actions"
echo ""
echo "Or use CLI:"
echo "  gh run list --workflow=github-pages-deploy.yml"
echo ""

echo "================================"
echo "Setup Complete!"
echo "================================"

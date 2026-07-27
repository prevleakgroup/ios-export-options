# GitHub Pages Deployment Guide

## Overview

This guide explains how to deploy your application to GitHub Pages with SSH and GCP authentication, across 5 domains with proper DNS configuration.

---

## Part 1: Add GitHub Secrets

### Required Secrets

These must be added to your repository before running workflows.

**Location:** Settings → Secrets and variables → Actions → New repository secret

#### 1. SSH_PRIVATE_KEY

**Purpose:** Authenticate SSH operations for infrastructure deployment

**How to create:**

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -N ""
```

**How to add to GitHub:**
1. Copy the private key:
   ```bash
   cat ~/.ssh/github_deploy | pbcopy  # macOS
   # or
   cat ~/.ssh/github_deploy           # Windows - manually copy
   ```
2. Go to: Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `SSH_PRIVATE_KEY`
5. Value: Paste the entire private key (starts with `-----BEGIN PRIVATE KEY-----`)
6. Click "Add secret"

#### 2. GCP_SERVICE_ACCOUNT_JSON

**Purpose:** Authenticate with Google Cloud Platform for operations

**How to create:**

1. Go to [GCP Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to: IAM & Admin → Service Accounts
4. Create a new service account (or use existing)
5. Go to the service account details
6. Click "Keys" tab
7. Click "Add Key" → "Create new key"
8. Choose "JSON"
9. Click "Create" (downloads JSON file)

**How to add to GitHub:**
1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Go to: Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Name: `GCP_SERVICE_ACCOUNT_JSON`
6. Value: Paste the entire JSON (starts with `{` and ends with `}`)
7. Click "Add secret"

#### 3. FIREBASE_TOKEN (If using Firebase)

**Purpose:** Deploy to Firebase Hosting

**How to create:**
```bash
npm install -g firebase-tools
firebase login:ci
```

Copy the token and add as secret with name `FIREBASE_TOKEN`

---

## Part 2: GitHub Pages Configuration

### Enable GitHub Pages

1. Go to: Settings → Pages
2. Set "Source" to: "Deploy from a branch"
3. Select branch: `main` or `master`
4. Select folder: `/ (root)` or `/docs` (depending on build output)

### Add Custom Domains

For each of your 5 domains:

1. Go to: Settings → Pages
2. Under "Custom domain", enter domain name
3. Click "Save"
4. GitHub will prompt you to add DNS records

---

## Part 3: Configure DNS in GoDaddy

### For Each Domain

#### A Records (for root domain, e.g., prevleak.company)

Add these 4 A records:

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

#### CNAME Record (for www subdomain)

| Type | Name | Value |
|------|------|-------|
| CNAME | www | `<your-username>.github.io` |

**Example:** If your GitHub username is `prevleakgroup`, the CNAME would point to `prevleakgroup.github.io`

### Domains to Configure

```
1. prevleak.company
2. palettemath.company
3. saferide.company
4. qvedic.company
5. plumber.company
```

---

## Part 4: Run Deployment Workflows

### Option 1: GitHub Pages Deployment (Basic)

**Workflow:** `github-pages-deploy.yml`

Triggers automatically on push to `main`/`master` or manually via workflow_dispatch

**To run manually:**
1. Go to: Actions → GitHub Pages Deployment
2. Click "Run workflow" → Run workflow

**What it does:**
- Validates deployment structure
- Builds static site
- Deploys to GitHub Pages
- Generates DNS guide

### Option 2: Advanced Deployment (SSH + GCP + Pages)

**Workflow:** `advanced-deployment.yml`

Includes SSH and GCP secret verification

**To run manually:**
1. Go to: Actions → Advanced Deployment
2. Click "Run workflow"
3. (Optional) Select target domain
4. (Optional) Skip DNS check
5. Click "Run workflow"

**What it does:**
- Verifies all secrets are configured
- Validates DNS (if enabled)
- Stages SSH credentials
- Authenticates with GCP
- Deploys to GitHub Pages
- Generates deployment report

---

## Part 5: Verify DNS Configuration

### Check GitHub Pages Status

1. Go to: Settings → Pages
2. Look for status under "Custom domains"

**Status indicators:**
- 🟢 **Green checkmark** = DNS verified, ready for traffic
- 🟡 **Yellow indicator** = DNS verification in progress (wait ~10 minutes)
- 🔴 **Red X** = DNS not properly configured

### Check HTTPS Certificate

HTTPS is automatic after DNS verification, but generation takes ~24 hours

---

## Workflow Artifacts

After each deployment, check **Actions** tab for artifacts:

1. **dns-configuration-guide** — Step-by-step DNS setup
2. **deployment-report** — Deployment summary
3. **github-pages-artifact** — Built site files

---

## Troubleshooting

### DNS Not Verifying

1. **Check GoDaddy records:**
   - Go to GoDaddy Domain Settings
   - Verify all 4 A records are present
   - Verify CNAME record for www
   - Wait 15-30 minutes for DNS propagation

2. **Test DNS resolution:**
   ```bash
   dig prevleak.company +short
   # Should return: 185.199.108.153 (or similar GitHub IP)
   ```

3. **Re-trigger verification:**
   - Go to Settings → Pages
   - Remove custom domain
   - Re-add custom domain
   - GitHub will attempt verification again

### Secrets Not Found

1. Go to: Settings → Secrets and variables → Actions
2. Verify secrets exist:
   - SSH_PRIVATE_KEY ✓
   - GCP_SERVICE_ACCOUNT_JSON ✓
   - FIREBASE_TOKEN ✓ (if using)

3. If missing, add them using Part 1 instructions

### Build Fails

1. Check that `/download-site/` directory exists
2. Verify `.github/workflows/` files are in repository
3. Check build logs in Actions tab

---

## Security Best Practices

✅ **Do:**
- Store secrets in GitHub repository settings
- Use separate SSH keys for different purposes
- Rotate GCP keys regularly
- Review workflow logs for unauthorized access

❌ **Don't:**
- Commit SSH keys to repository
- Commit GCP credentials to repository
- Log or echo secret values
- Share secrets with unauthorized users

---

## Support

For detailed GitHub Pages documentation: https://docs.github.com/en/pages

For GCP authentication: https://cloud.google.com/docs/authentication/getting-started

For GoDaddy DNS: https://www.godaddy.com/help

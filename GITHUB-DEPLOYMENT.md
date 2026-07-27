# GitHub Deployment Guide

## Overview
This repository uses GitHub Actions for continuous integration and deployment (CI/CD) of all 5 brands to Firebase production environment.

## Setup Instructions

### 1. GitHub Repository Setup

```bash
git init
git add .
git commit -m "Initial commit: All 5 brands infrastructure"
git remote add origin https://github.com/YOUR_ORG/ios-export-options.git
git branch -M main
git push -u origin main
```

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. **FIREBASE_TOKEN** (Required)
   - Generate: `firebase login:ci`
   - Go to: Repository Settings → Secrets and variables → Actions
   - Add secret: `FIREBASE_TOKEN`
   - Value: The token from `firebase login:ci`

2. **GCP_SA_KEY** (Required for secrets management)
   - Type: Google Cloud Service Account JSON
   - Permissions: Cloud Secret Manager Admin
   - Go to: Repository Settings → Secrets and variables → Actions
   - Add secret: `GCP_SA_KEY`

3. **SLACK_WEBHOOK** (Optional, for notifications)
   - Create Slack webhook for each brand channel
   - Go to: Repository Settings → Secrets and variables → Actions
   - Add secret: `SLACK_WEBHOOK`
   - Value: Your Slack webhook URL

### 3. Configure GitHub Branch Protection

Main Branch (Production):
```
Settings → Branches → Add Rule
- Branch name pattern: main
- Require a pull request before merging
- Require approvals: 1
- Require status checks to pass:
  ✓ validate
  ✓ deploy-functions
  ✓ deploy-rules
  ✓ deploy-hosting
- Require branches to be up to date before merging
- Require deployment to succeed before merging
```

### 4. Repository Structure

```
.github/
  workflows/
    deploy-functions.yml      # Deploy Cloud Functions
    deploy-rules.yml          # Deploy Firestore Rules
    deploy-hosting.yml        # Deploy Hosting (4 brands)
    manage-secrets.yml        # Manage brand secrets
    production-deploy.yml     # Full production deployment

functions/
  index.js                     # Cloud Functions entry point
  firebase-auth-manager.js     # Authentication module
  auth-routes.js              # API endpoints
  firebase-data-engine.js     # Data operations
  firebase-ml-engine.js       # ML operations
  firebase-operations-coordinator.js  # Workflow orchestration
  webhook-orchestration.js    # DNS webhook handling
  brand-secrets-manager.js    # Secrets management
  brand-secrets-init.js       # Secrets initialization
  package.json
  
download-site/
  prevleak-site/             # PrevLeak hosting files
  saferide-site/             # SafeRide hosting files
  palettemath-site/          # PaletteMath hosting files
  qvedic-site/               # Qvedic hosting files

firebase.json                 # Firebase configuration
.firebaserc                   # Firebase project aliases
firestore-brand-isolation.rules # Firestore Security Rules
```

## Workflows

### Workflow 1: Deploy Cloud Functions
**Trigger:** Push to `main` or `develop` on `functions/**` changes

```yaml
- Installs dependencies
- Lints code
- Runs tests
- Deploys to Firebase (us-central1 + eu-west1)
- Verifies deployment
- Sends Slack notification
```

**Usage:**
```bash
git add functions/
git commit -m "Update Cloud Functions"
git push origin main
```

### Workflow 2: Deploy Firestore Rules
**Trigger:** Push to `main` or `develop` on `firestore-*.rules` changes

```yaml
- Deploys Firestore Security Rules
- Verifies indexes
- Sends Slack notification
```

**Usage:**
```bash
git add firestore-brand-isolation.rules
git commit -m "Update Firestore Security Rules"
git push origin main
```

### Workflow 3: Deploy Hosting
**Trigger:** Push to `main` on `download-site/**` changes

```yaml
- Deploys to all 4 brand sites (PrevLeak, SafeRide, PaletteMath, Qvedic)
- Gets deployment URLs
- Sends Slack notifications per brand
```

**Usage:**
```bash
git add download-site/
git commit -m "Update brand hosting sites"
git push origin main
```

### Workflow 4: Manage Secrets
**Trigger:** Manual workflow dispatch or quarterly schedule

```yaml
Actions:
- status     # Check secrets status dashboard
- verify     # Verify all secrets are accessible
- rotate     # Rotate all secrets
- setup-rotation # Schedule rotation jobs
```

**Usage:**
```bash
# Via GitHub UI:
Actions → Manage Brand Secrets → Run workflow
Select action: status/verify/rotate/setup-rotation
Click "Run workflow"
```

### Workflow 5: Complete Production Deployment
**Trigger:** Push to `production` branch or manual dispatch

```yaml
Deployment Types:
- full              # Deploy functions + rules + hosting
- functions-only    # Deploy only Cloud Functions
- hosting-only      # Deploy only hosting
- rules-only        # Deploy only Firestore Rules

Steps:
1. Validate code (lint + tests)
2. Deploy Cloud Functions
3. Deploy Firestore Rules
4. Deploy Hosting (all 4 brands)
5. Verify all services
6. Send comprehensive Slack notification
```

**Usage:**
```bash
# For production deployment:
git checkout -b production
git merge main
git push origin production

# Or via GitHub UI:
Actions → Complete Production Deployment → Run workflow
Select deployment_type: full/functions-only/hosting-only/rules-only
Click "Run workflow"
```

## Common Tasks

### Deploy Functions Update
```bash
# Make changes to functions/
git checkout -b feature/function-update
git add functions/
git commit -m "feat: add new authentication method"
git push origin feature/function-update
# Create Pull Request on GitHub
# Once approved and merged to main, workflow runs automatically
```

### Deploy Hosting Update for One Brand
```bash
git checkout -b feature/saferide-ui-update
# Edit download-site/saferide-site/ files
git add download-site/saferide-site/
git commit -m "feat(saferide): update driver portal UI"
git push origin feature/saferide-ui-update
# Create PR and merge
# GitHub Actions deploys only changed brand
```

### Rotate All Secrets
```bash
# Via GitHub UI:
1. Go to Actions tab
2. Select "Manage Brand Secrets" workflow
3. Click "Run workflow"
4. Select action: "rotate"
5. Click green "Run workflow" button
6. Monitor in Slack channel

# Or via API:
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_ORG/ios-export-options/actions/workflows/manage-secrets.yml/dispatches \
  -d '{"ref":"main","inputs":{"action":"rotate"}}'
```

### View Deployment Logs
```
GitHub UI → Actions tab → Select workflow → Click run → View logs
Or specific step → See real-time output
```

## Environment Variables

### Function Deployments
- `FIREBASE_TOKEN`: Used for Firebase CLI authentication
- `BRAND`: Current brand being deployed (set by matrix strategy)

### Secrets Management
- `GCP_SA_KEY`: Google Cloud Service Account for accessing Secret Manager
- `SLACK_WEBHOOK`: Webhook URL for Slack notifications

## Monitoring & Notifications

### Slack Channels
Configure webhooks for:
- `#prevleak-deployments` - PrevLeak deployments
- `#saferide-deployments` - SafeRide deployments
- `#palettemath-deployments` - PaletteMath deployments
- `#qvedic-deployments` - Qvedic deployments
- `#plumber-deployments` - Plumber backend deployments
- `#deployment-status` - All deployments summary

### Notification Format
```
✅ Cloud Functions deployment - SUCCESS
Repository: ios-export-options
Branch: main
Commit: abc123def456
Author: developer-name

🔄 Deploying...
Brand: saferide
Status: Deployment complete
Functions: 2 deployed
URL: https://apieuropewest1-v2vtmionpq-ew.a.run.app
```

## Rollback Procedures

### Rollback Functions
```bash
# Option 1: Revert commit and push
git revert <commit-hash>
git push origin main

# Option 2: Firebase console manual rollback
firebase functions:delete apiUsCentral1 --project saferide-peld8
firebase functions:delete apiEuropeWest1 --project saferide-peld8
git checkout <last-working-commit>
git push origin main  # Redeploy
```

### Rollback Hosting
```bash
# Option 1: Revert site content
git revert <commit-hash>
git push origin main

# Option 2: Manual via Firebase Console
1. Go to Hosting in Firebase Console
2. Select brand site
3. View version history
4. Click "Rollback" on previous version
```

## Best Practices

1. **Branch Strategy**
   - `main` → Production (auto-deployed)
   - `develop` → Staging (auto-deployed)
   - Feature branches → Pull requests to develop

2. **Commit Messages**
   ```
   feat(brand): add new feature
   fix(auth): resolve token expiry bug
   docs(deployment): update guide
   chore(deps): upgrade firebase-functions
   ```

3. **Pull Request Reviews**
   - Require 1+ approvals before merge
   - Run all checks before merging
   - Review deployment preview

4. **Secrets Management**
   - Never commit `.env` files
   - Use GitHub Secrets for all tokens
   - Rotate secrets quarterly
   - Audit secret access logs

5. **Deployment Frequency**
   - Functions: Deploy as needed (parallel-safe)
   - Hosting: Deploy daily during business hours
   - Rules: Deploy after testing (affects all users)
   - Secrets: Rotate quarterly, monitor access

## Troubleshooting

### Workflow Fails at "Deploy"
```
Error: Build failed with status: FAILURE
Solution: Check Cloud Build logs
https://console.cloud.google.com/cloud-build
```

### "The default Firebase app already exists"
```
Cause: Duplicate admin.initializeApp() calls
Solution: Ensure only functions/index.js calls admin.initializeApp()
```

### Secrets Not Found
```
Error: Failed to load secrets for prevleak
Solution: Run "Manage Brand Secrets" workflow with action: "verify"
```

### Slack Notifications Not Sending
```
Solution: Verify SLACK_WEBHOOK secret is set correctly
Check webhook URL format: https://hooks.slack.com/services/<WORKSPACE_ID>/<CHANNEL_ID>/<TOKEN>
```

## Support

For issues, open GitHub Issues:
- Bug: https://github.com/YOUR_ORG/ios-export-options/issues/new?template=bug_report.md
- Feature: https://github.com/YOUR_ORG/ios-export-options/issues/new?template=feature_request.md

For urgent deployments, contact: devops@company.com

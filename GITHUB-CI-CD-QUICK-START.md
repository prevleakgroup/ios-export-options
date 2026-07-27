# GitHub Actions Quick Reference

## 🚀 Push Updates & Auto-Deploy

### Deploy Cloud Functions
```bash
# Make changes
cd functions/
# ... edit files ...

# Commit and push
git add .
git commit -m "feat: add new authentication"
git push origin main

# 🤖 GitHub Actions automatically:
# ✅ Installs dependencies
# ✅ Runs linter & tests
# ✅ Deploys to us-central1 & eu-west1
# ✅ Sends Slack notification
```

### Deploy Brand Hosting
```bash
# Edit brand site files
cd download-site/
# ... edit saferide-site/ or other brand ...

# Commit and push
git add .
git commit -m "feat(saferide): update driver portal"
git push origin main

# 🤖 GitHub Actions automatically:
# ✅ Deploys to Firebase Hosting
# ✅ Updates all 4 brands in parallel
# ✅ Sends notifications per brand
```

### Deploy Firestore Rules
```bash
# Update security rules
# ... edit firestore-brand-isolation.rules ...

git add firestore-brand-isolation.rules
git commit -m "security: update Firestore rules"
git push origin main

# 🤖 GitHub Actions automatically:
# ✅ Validates rules syntax
# ✅ Deploys to production
# ✅ Verifies indexes
# ✅ Sends notification
```

## 📋 Workflows at a Glance

| Workflow | Trigger | Deploys | Brands |
|----------|---------|---------|--------|
| `deploy-functions.yml` | functions/** | Cloud Functions | All 5 |
| `deploy-rules.yml` | firestore-*.rules | Firestore Rules | All 5 |
| `deploy-hosting.yml` | download-site/** | Firebase Hosting | 4 (PrevLeak, SafeRide, PaletteMath, Qvedic) |
| `manage-secrets.yml` | Manual / Quarterly | Cloud Secret Manager | All 5 |
| `production-deploy.yml` | production branch | All | All 5 |

## 🔐 GitHub Secrets Setup (One-Time)

1. Go to: **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add these secrets:

| Secret Name | Value | Where to Get |
|------------|-------|--------------|
| `FIREBASE_TOKEN` | CI token | Run `firebase login:ci` |
| `GCP_SA_KEY` | Service account JSON | Google Cloud Console |
| `SLACK_WEBHOOK` | Slack webhook URL | Create in Slack workspace |

## 📊 Monitor Deployments

### GitHub UI
```
Repository → Actions tab → Select workflow → View logs
```

### Real-Time Status
- Watch GitHub Actions tab while workflow runs
- See each step: Install → Lint → Test → Deploy → Verify
- Check Slack for notifications

### Logs & Debugging
```bash
# View full logs in GitHub Actions UI
# Or via Firebase CLI:
firebase functions:log --project saferide-peld8 --token $FIREBASE_TOKEN
```

## 🔄 Common Commands

### Deploy Everything (Production Branch)
```bash
git checkout -b release/v1.0.0
git merge main
git push origin release/v1.0.0

# Then merge to production:
git checkout production
git merge release/v1.0.0
git push origin production

# 🤖 Automatically triggers Complete Production Deployment
# ✅ Functions → Rules → Hosting → Verify
```

### Force Redeploy via GitHub UI
```
1. Go to Actions tab
2. Select workflow (e.g., "Deploy Cloud Functions")
3. Click "Run workflow"
4. Select branch
5. Click green "Run workflow" button
```

### Rotate Secrets
```
1. Actions tab
2. Select "Manage Brand Secrets"
3. Click "Run workflow"
4. Select action: "rotate"
5. Click "Run workflow"

🤖 Automatically rotates all brand secrets
```

## ✅ Deployment Checklist

Before pushing to production:

- [ ] Code review completed
- [ ] Tests passing locally
- [ ] No console errors
- [ ] Firestore rules validated
- [ ] Security rules tested
- [ ] Environment variables set in GitHub
- [ ] Slack webhooks configured
- [ ] Firebase token is fresh

## 🚨 Troubleshooting

### Workflow Won't Start
```
✗ Problem: Push to main but no workflow running
✓ Solution: Check .github/workflows/ exists and files are valid YAML
Run: npx yaml-validator .github/workflows/*.yml
```

### Deployment Fails
```
✗ Problem: Build failed with status: FAILURE
✓ Solution: Check Cloud Build logs
https://console.cloud.google.com/cloud-build
```

### Secrets Error
```
✗ Problem: Failed to load secrets
✓ Solution: 
- Verify GCP_SA_KEY is set in GitHub Secrets
- Check service account has Cloud Secret Manager Admin role
- Run: node brand-secrets-init.js verify
```

### Slack Notifications Not Working
```
✗ Problem: No Slack notifications
✓ Solution:
- Verify SLACK_WEBHOOK is set
- Test webhook: curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' $SLACK_WEBHOOK
- Check workflow logs for errors
```

## 📞 Quick Links

- **Firebase Console**: https://console.firebase.google.com/project/saferide-peld8
- **Google Cloud Console**: https://console.cloud.google.com/project/610769160211
- **GitHub Actions Logs**: https://github.com/YOUR_ORG/ios-export-options/actions
- **Cloud Build Logs**: https://console.cloud.google.com/cloud-build
- **Slack Workspace**: https://your-workspace.slack.com

## 🎯 Next Steps

1. **Initialize Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial: 5-brand Firebase infrastructure"
   git remote add origin https://github.com/YOUR_ORG/ios-export-options.git
   git push -u origin main
   ```

2. **Add GitHub Secrets**
   - Go to GitHub repository Settings
   - Add FIREBASE_TOKEN, GCP_SA_KEY, SLACK_WEBHOOK

3. **Make First Commit**
   ```bash
   git add functions/
   git commit -m "deploy: initial functions deployment"
   git push origin main
   # Watch Actions tab - deployment happens automatically
   ```

4. **Monitor Deployments**
   - Check Actions tab for workflow status
   - Receive Slack notifications
   - Verify sites are live

## 📚 Full Documentation

See `GITHUB-DEPLOYMENT.md` for comprehensive guide including:
- Setup instructions
- Branch protection rules
- Workflow details
- Best practices
- Rollback procedures
- Advanced troubleshooting

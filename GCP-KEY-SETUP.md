# GCP Service Account JSON Key Setup

## Quick Summary
Create a Google Cloud service account and generate a JSON key for GitHub secrets. This key enables GitHub Actions to authenticate with Google Cloud services.

---

## Step-by-Step Setup

### 1. Go to Google Cloud Console
- Open: https://console.cloud.google.com
- Sign in with your Google account
- Select your existing project (or create a new one)

### 2. Navigate to Service Accounts
1. Click the **hamburger menu** (≡) top-left
2. Go to: **IAM & Admin** → **Service Accounts**
3. Click **Create Service Account** button

### 3. Create Service Account
**Service Account Details:**
- **Service account name:** `github-pages-deployer`
- **Service account ID:** (auto-generated)
- **Description:** `GitHub Pages deployment service account`

Click **Create and Continue**

### 4. Grant Roles (Optional)
- Select role: **Editor** (for full access to Google Cloud resources)
- Click **Continue**

### 5. Create and Download JSON Key
1. Click on the newly created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose: **JSON**
5. Click **Create** (downloads JSON file automatically)

### 6. Save JSON Key Path
Note the downloaded file path, e.g.:
```
C:\Users\Admin\Downloads\github-pages-deployer-abc123.json
```

---

## Add to GitHub Secrets

### Option A: Manual (GitHub UI)
1. Go to: https://github.com/prevleakgroup/PrevLeak-Group/settings/secrets/actions
2. Click **New repository secret**
3. Name: `GCP_SERVICE_ACCOUNT_JSON`
4. Value: (paste entire JSON file contents)
5. Click **Add secret**

### Option B: Automated (PowerShell)
```powershell
cd c:\Users\Admin\repos\assessment\ios-export-options

# Set the JSON path
$gcpJsonPath = "C:\Users\Admin\Downloads\github-pages-deployer-abc123.json"

# Add to GitHub
$gcpJson = Get-Content $gcpJsonPath -Raw
$gcpJson | gh secret set GCP_SERVICE_ACCOUNT_JSON

# Verify
gh secret list
```

---

## Verify Setup

### Check All Secrets
```powershell
gh secret list
```

Expected output:
```
NAME                    UPDATED
FIREBASE_PROJECT_ID     17 hours ago
FIREBASE_TOKEN          5 minutes ago
SSH_PRIVATE_KEY         10 minutes ago
GCP_SERVICE_ACCOUNT_JSON [JUST ADDED]
```

---

## Security Notes

⚠️ **Important:**
- ✅ Never commit JSON file to GitHub
- ✅ Keep the JSON file secure (don't share)
- ✅ GitHub encrypts secrets automatically
- ✅ Secrets are never logged or echoed
- ✅ Only accessible to workflows in this repository

---

## What This Key Enables

With `GCP_SERVICE_ACCOUNT_JSON` configured, workflows can:
- ✅ Deploy to Google Cloud Platform
- ✅ Access Cloud Storage
- ✅ Manage Cloud Run services
- ✅ Configure Firebase from CI/CD

---

## Workflow Usage

In GitHub Actions workflows, reference it as:
```yaml
- name: Authenticate to GCP
  uses: google-github-actions/auth@v1
  with:
    credentials_json: ${{ secrets.GCP_SERVICE_ACCOUNT_JSON }}
```

---

## If You Need Multiple Projects

You can create multiple service accounts for different purposes:
- `github-pages-deployer` (current)
- `firebase-deployer`
- `storage-admin`
- etc.

Each gets its own JSON key and GitHub secret.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| JSON file not found | Download from Google Cloud Console → Service Accounts → Keys |
| Secret not showing in workflow | Verify secret name exactly matches (case-sensitive) |
| Authentication fails in workflow | Ensure JSON key is complete (has `project_id`, `client_email`, etc.) |
| 403 Forbidden errors | Check service account has required roles in Google Cloud |

---

## Next Steps

After adding `GCP_SERVICE_ACCOUNT_JSON`:

1. ✅ Verify in GitHub: `gh secret list`
2. ✅ Trigger workflow: Push to `master` branch
3. ✅ Monitor: https://github.com/prevleakgroup/PrevLeak-Group/actions
4. ✅ Enable GitHub Pages: Settings → Pages
5. ✅ Add custom domains: Settings → Pages → Custom domain

---

## GitHub Pages Workflow Status

Current secrets configured:
- ✅ SSH_PRIVATE_KEY
- ✅ FIREBASE_TOKEN
- ✅ FIREBASE_PROJECT_ID
- ⏳ GCP_SERVICE_ACCOUNT_JSON (waiting for setup)

Workflows ready to deploy:
- ✅ `.github/workflows/github-pages-deploy.yml`
- ✅ `.github/workflows/advanced-deployment.yml`

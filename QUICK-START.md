# Quick Start: 3-Step Deployment Checklist

## Your Details
- **GitHub Username:** `prevleakgroup`
- **GitHub Pages URL:** `https://prevleakgroup.github.io`
- **Domains:** 5 custom domains all pointing to same GitHub Pages site

---

## Step 1: Add GitHub Secrets ✅
**Location:** Your repo Settings → Secrets and variables → Actions

Create these 3 secrets:

```
Name: SSH_PRIVATE_KEY
Value: [Your SSH private key - starts with -----BEGIN PRIVATE KEY----]

Name: GCP_SERVICE_ACCOUNT_JSON
Value: [Your GCP service account JSON - starts with { ]

Name: FIREBASE_TOKEN
Value: [Your Firebase token from 'firebase login:ci' command]
```

**Time:** 5 minutes

---

## Step 2: Deploy Firebase ✅
**Location:** Your local machine terminal

```powershell
cd c:\Users\Admin\repos\assessment\ios-export-options

# Install Firebase
npm install -g firebase-tools

# Login (opens browser)
firebase login

# Get token for GitHub
firebase login:ci
# Copy the token → paste into GitHub as FIREBASE_TOKEN secret

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy --only hosting
```

**Time:** 10 minutes

---

## Step 3: Configure DNS in GoDaddy ✅
**Location:** GoDaddy.com → My Products → Domains → [Domain] → Manage DNS

### For EACH of your 5 domains:

```
Domain: prevleak.company
  Add A Records:
    185.199.108.153
    185.199.109.153
    185.199.110.153
    185.199.111.153
  
  Add CNAME Record:
    www → prevleakgroup.github.io

---

Domain: palettemath.company
  (Same A + CNAME records as above)

---

Domain: saferide.company
  (Same A + CNAME records as above)

---

Domain: qvedic.company
  (Same A + CNAME records as above)

---

Domain: plumber.company
  (Same A + CNAME records as above)
```

**Time:** 20 minutes (5 min per domain × 5 domains)

---

## Step 4: Add Custom Domains in GitHub ✅
**Location:** Your repo Settings → Pages

For each domain:
1. Click "Add domain"
2. Enter domain name (e.g., `prevleak.company`)
3. Click Save
4. Wait for green checkmark (DNS verified)
5. Repeat for other 4 domains

**Time:** 10 minutes (2 min per domain × 5 domains + wait time)

---

## Step 5: Verify Everything Works ✅

```powershell
# Check DNS resolution
nslookup prevleak.company
# Should return: 185.199.108.153 or similar

# Check GitHub Pages status
# Go to: Settings → Pages
# Should show: Domain verified ✓ (green checkmark)
```

**Time:** 2 minutes

---

## Total Time to Complete
- **Step 1 (GitHub Secrets):** 5 minutes
- **Step 2 (Firebase Deploy):** 10 minutes  
- **Step 3 (GoDaddy DNS):** 20 minutes
- **Step 4 (Add Domains to GitHub):** 10 minutes
- **Step 5 (Verify):** 2 minutes + wait for DNS propagation (5-30 minutes)

**Total: ~50 minutes** (plus DNS propagation wait)

---

## Status Indicators

### After Step 3 (DNS added):
- 🟡 DNS records propagating... (5-30 minutes)

### After Step 4 (Domain added to GitHub):
- 🟡 Verifying DNS...
- 🟢 Domain verified ✓ (green checkmark appears)

### After 24 hours:
- 🔒 HTTPS enabled automatically

---

## Files Created for You

| File | Purpose |
|------|---------|
| `.github/workflows/github-pages-deploy.yml` | Auto-deploy to GitHub Pages |
| `.github/workflows/advanced-deployment.yml` | Deploy with SSH + GCP |
| `GITHUB-PAGES-DEPLOYMENT.md` | Full deployment guide |
| `DNS-CONFIGURATION-GODADDY.md` | Detailed DNS setup |

---

## Need Help?

**DNS verification failing?**
→ Check `DNS-CONFIGURATION-GODADDY.md` troubleshooting section

**Workflow errors?**
→ Check Actions tab → View logs

**Firebase issues?**
→ Run: `firebase deploy --debug`

---

**You're ready to go! Start with Step 1. 🚀**

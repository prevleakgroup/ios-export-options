# Firebase Hosting - All Domains Anchored
## Complete Setup & Deployment Guide

### Project Configuration
- **Firebase Project:** saferide-peld8
- **Hosting Source:** download-site/
- **Deployment Type:** Static Hosting + Custom Domains
- **SSL/HTTPS:** Auto-generated per domain
- **CDN:** Firebase Global CDN (included)

---

## Architecture

```
saferide-peld8 (Firebase Project)
│
├─ Hosting: download-site/ deployed
│
└─ Custom Domains:
   ├─ prevleak.company → saferide-peld8.web.app
   ├─ saferide.company → saferide-peld8.web.app
   ├─ palettemath.company → saferide-peld8.web.app
   └─ qvedic.company → saferide-peld8.web.app

All routed through:
└─ GoDaddy DNS Management (DNS records point to Firebase)
```

---

## Quick Deploy Commands

### 1. Deploy to Firebase
```powershell
# Full deployment
.\deploy-firebase-hosting.ps1 -Action deploy -Environment production

# OR manual Firebase CLI
firebase deploy --project saferide-peld8 --public download-site --only hosting
```

### 2. Test Locally
```powershell
# Option A: Serve with Firebase (emulates production)
.\deploy-firebase-hosting.ps1 -Action serve

# Option B: Full emulator with Firestore, Functions
.\deploy-firebase-hosting.ps1 -Action emulate

# Option C: GitHub Actions (on git push to master)
# Automatically triggers: firebase-hosting-deployment.yml
```

### 3. Verify Deployment
```powershell
.\deploy-firebase-hosting.ps1 -Action verify

# Shows:
# ✅ Project status
# ✅ Latest deployment info
# ✅ Hosting URL: https://saferide-peld8.web.app
# ✅ Custom domains status
```

---

## Setup Steps (First Time)

### Step 1: Verify Firebase Configuration ✅

Check files are in place:
```bash
# firebase.json - Hosting config
ls firebase.json

# .firebaserc - Project association
ls .firebaserc
```

Expected `.firebaserc`:
```json
{
  "projects": {
    "default": "saferide-peld8"
  }
}
```

### Step 2: Deploy to Firebase

```powershell
firebase login  # If not already authenticated

.\deploy-firebase-hosting.ps1 -Action deploy -Environment production
```

Expected output:
```
✅ Hosting Deployed: download-site → Firebase
✅ Live at: https://saferide-peld8.web.app
✅ Ready for custom domains
```

### Step 3: Add Custom Domains in Firebase Console

1. Go to: https://console.firebase.google.com/project/saferide-peld8/hosting
2. Click **"+ Add custom domain"**
3. Enter: `prevleak.company`
4. Firebase generates DNS records
5. Copy records → Paste into GoDaddy

Repeat for:
- saferide.company
- palettemath.company
- qvedic.company

### Step 4: Configure DNS in GoDaddy

For each domain:

1. Log in: https://www.godaddy.com
2. Go to: Domain Settings → DNS Management
3. Add records Firebase provided:

**Example (Firebase will provide exact values):**
```
Type    Name              Value
A       prevleak.company  <Firebase IP 1>
A       prevleak.company  <Firebase IP 2>
CNAME   www               <Firebase domain>
```

### Step 5: Wait for Verification

- DNS propagation: 5-30 minutes
- Firebase verifies automatically
- HTTPS certificate generates
- Green checkmark appears in Firebase Console

---

## Live URLs (After DNS Setup)

```
Production HTTPS URLs:
├─ https://prevleak.company
├─ https://saferide.company
├─ https://palettemath.company
└─ https://qvedic.company

All serving:
└─ download-site/ content from saferide-peld8 Firebase Hosting
```

---

## GitHub Actions Workflow

Automatic deployment on every push to master:

```yaml
# Triggers on: git push origin master
# Workflow: firebase-hosting-deployment.yml
# Steps:
1. ✅ Validate & Build
2. ✅ Deploy to Firebase
3. ✅ Verify Deployment
4. ✅ Generate domain config
```

Manual trigger:
```
GitHub Actions → firebase-hosting-deployment.yml → Run workflow
Select: production or staging
Click: Run workflow
```

---

## Cost Breakdown

| Service | Cost | Included |
|---------|------|----------|
| Firebase Hosting | FREE* | 10GB/month, 360 deployments/month |
| Custom Domains | FREE | Unlimited domains |
| SSL/HTTPS | FREE | Auto-generated per domain |
| CDN | FREE | Firebase Global CDN |
| Bandwidth | $0.12/GB | First 1GB/month free |

*Blaze Plan: $48/month includes Functions, Firestore, other services

---

## Troubleshooting

### Domain not resolving?
1. Check GoDaddy DNS records match Firebase
2. Wait 24+ hours for DNS propagation
3. Verify in Firebase Console (should show checkmark)

### HTTPS certificate not generating?
1. Ensure DNS records are correct
2. Wait 24 hours
3. Check Firebase Console → Hosting → Custom domain
4. If stuck, re-add domain

### Can't deploy?
1. Check FIREBASE_TOKEN secret in GitHub
2. Verify firebase.json exists
3. Run: `firebase projects:list` to confirm access
4. Check: `firebase hosting:list --project saferide-peld8`

---

## Mobile App Integration

All apps link to Firebase backend:

```
iOS Apps          Android Apps
   ↓                   ↓
   └─── Firebase Auth / Firestore / Functions ───┘
        (saferide-peld8 project)
```

Users can:
- Sign in via any domain
- Sync data across all apps
- Use Firebase features (Auth, DB, Storage, etc.)

---

## Next Steps

1. ✅ Deploy: `.\deploy-firebase-hosting.ps1 -Action deploy`
2. ✅ Verify: `.\deploy-firebase-hosting.ps1 -Action verify`
3. ✅ Add domains in Firebase Console (prevleak.company, etc.)
4. ✅ Configure DNS in GoDaddy
5. ✅ Wait for DNS verification (~24 hours)
6. ✅ Test: Visit https://prevleak.company
7. ✅ Done! All 4 domains live on Firebase

---

## Support

Firebase Docs: https://firebase.google.com/docs/hosting
GoDaddy DNS: https://www.godaddy.com
GitHub Secrets: https://github.com/prevleakgroup/PrevLeak-Group/settings/secrets

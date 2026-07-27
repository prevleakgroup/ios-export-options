# PREVLEAKGROUP™ DEPLOYMENT & VERIFICATION GUIDE

**Status:** Production-ready for immediate deployment  
**Last Updated:** 2026-07-27  
**Target:** Firebase + All 5 Brands + All Operational Features

---

## 📋 Pre-Deployment Checklist

### ✓ Code Validation
- [x] All 5 brands configured with correct color schemes
- [x] Firestore Security Rules with brand isolation
- [x] Cloud Functions (Data Engine + ML Engine + Operations Coordinator)
- [x] Brand anchor validation script
- [x] Color scheme enforcement rules
- [x] All HTML pages have logo anchors
- [x] Deployment scripts created (bash + PowerShell)

### ✓ Brand Anchors Confirmed
- [x] PrevLeak: `#0056b3` (Navy Blue) - infrastructure focus
- [x] SafeRide: `#f28c28` (Warm Orange) - mobility focus  
- [x] PaletteMath: `#0c4c95` (Deep Blue) - product clarity
- [x] Qvedic: `#1e5a96` (Medium Blue) - digital delivery
- [x] Plumber: `#d4511f` (Warm Rust) - field operations

### ✓ Operational Features
- [x] Real-time incident detection & orchestration
- [x] Smart crew dispatch (Plumber app)
- [x] Operational metrics & health dashboard
- [x] ML model registry with training pipelines
- [x] Data isolation & security (Firestore Rules)
- [x] Public reporting & citizen engagement
- [x] Desktop CM command module
- [x] Cross-brand analytics (admin-only)
- [x] Transaction logging & compliance
- [x] Deployment manifest generation

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Windows Deployment (PowerShell)

```powershell
# Navigate to project root
cd c:\Users\Admin\repos\assessment\ios-export-options

# Option A: Dry run (verify without deploying)
.\scripts\deploy-all.ps1 -DryRun -Verbose

# Option B: Full deployment
$env:FIREBASE_TOKEN = "your-firebase-token-here"
.\scripts\deploy-all.ps1 -FirebaseProject "saferide-peld8"
```

### Step 2: Linux/Mac Deployment (Bash)

```bash
cd ~/repos/assessment/ios-export-options

# Make script executable
chmod +x scripts/deploy-all.sh

# Option A: Dry run
./scripts/deploy-all.sh

# Option B: Full deployment
export FIREBASE_TOKEN="your-firebase-token-here"
./scripts/deploy-all.sh
```

### Step 3: Manual Firebase Deployment

If you prefer step-by-step:

```bash
# 1. Deploy Firestore Security Rules
firebase deploy --only firestore:rules --project saferide-peld8

# 2. Deploy Cloud Functions
firebase deploy --only functions --project saferide-peld8

# 3. Deploy Hosting
firebase deploy --only hosting --project saferide-peld8

# 4. Verify deployment
firebase deploy:list --project saferide-peld8
```

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### Verify Firestore Rules
```bash
node scripts/validate-brand-anchors.js
```

Expected output:
```
✅ VALIDATION REPORT
├─ Brand Isolation: COMPLIANT
├─ Color Schemes: COMPLIANT (5/5 brands)
├─ API Prefixes: COMPLIANT
└─ Firestore Collections: COMPLIANT
```

### Test Health Endpoint
```powershell
Invoke-WebRequest -Uri "https://saferide-peld8.web.app/health"
```

Expected response: `200 OK`

### Check Operations Health
```powershell
$response = Invoke-WebRequest -Uri "https://saferide-peld8.web.app/api/operations/health"
$response.Content | ConvertFrom-Json | Format-Table
```

Expected output shows all 5 brands with HEALTHY status.

### Verify Brand Pages
- PrevLeak: https://saferide-peld8.web.app/prevleak.html
- SafeRide: https://saferide-peld8.web.app/rider/index.html
- PaletteMath: https://saferide-peld8.web.app/palettemath.html
- Qvedic: https://saferide-peld8.web.app/qvedic.html
- Plumber: https://saferide-peld8.web.app/apps/plumber-app.html

Each page should display:
- ✓ Brand logo in header
- ✓ Brand color scheme applied
- ✓ Call-to-action buttons (Demo, Proposal, etc.)
- ✓ Footer with brand anchor and links

---

## 🧪 FUNCTIONAL TESTING

### Test 1: Incident Workflow (PrevLeak)
```bash
# Initiate workflow
curl -X POST https://saferide-peld8.web.app/api/operations/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "prevleak",
    "workflowName": "incident_triage",
    "workflowConfig": {
      "stages": ["detect", "classify", "dispatch", "verify"]
    }
  }'
```

### Test 2: Crew Dispatch (Plumber)
```bash
# Send dispatch job
curl -X POST https://saferide-peld8.web.app/api/plumber/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "plumber",
    "jobType": "emergency_repair",
    "location": {"lat": -33.9249, "lng": 18.4241},
    "priority": "high"
  }'
```

### Test 3: ML Inference (All Brands)
```bash
# Run inference
curl -X POST https://saferide-peld8.web.app/api/ml/inference \
  -H "Content-Type: application/json" \
  -d '{
    "brandName": "prevleak",
    "modelId": "incident_classifier_v1",
    "input": {"sensor_data": [...]}
  }'
```

### Test 4: Brand Isolation Validation
```bash
# Verify no cross-brand contamination
node scripts/validate-brand-anchors.js --strict
```

---

## 📊 MONITORING & DASHBOARDS

### Operations Health Dashboard
- **URL:** https://saferide-peld8.web.app/api/operations/health
- **Refresh:** Every 60 seconds
- **Shows:** Brand health, error rates, latency, workflow counts

### Firebase Console
- **Firestore:** https://console.firebase.google.com/project/saferide-peld8/firestore
- **Functions:** https://console.firebase.google.com/project/saferide-peld8/functions
- **Hosting:** https://console.firebase.google.com/project/saferide-peld8/hosting

### Cloud Logging
```bash
# View function logs
firebase functions:log --project saferide-peld8 --tail

# View specific brand logs
firebase functions:log --project saferide-peld8 --tail | grep "prevleak"
```

---

## 🛠 TROUBLESHOOTING

### Issue: Deployment Fails with "Authentication Error"
**Solution:** 
```bash
firebase login:ci
# Copy token to FIREBASE_TOKEN environment variable
export FIREBASE_TOKEN="<token>"
```

### Issue: Functions Not Responding
**Solution:**
- Functions may take 1-2 minutes to warm up after deployment
- Check Firebase Console for deployment errors
- Verify firestore-brand-isolation.rules deployed successfully

### Issue: Brand Isolation Validation Fails
**Solution:**
```bash
# Run detailed validation
node scripts/validate-brand-anchors.js --verbose

# Check Firestore Rules are deployed
firebase deploy --only firestore:rules --project saferide-peld8
```

### Issue: Logo Not Showing on Web Pages
**Solution:**
- Verify SVG files exist: `download-site/assets/*.svg`
- Check logo paths in HTML (should be relative: `assets/brand-logo.svg`)
- Clear browser cache (Ctrl+Shift+Delete)

---

## 📱 SOCIAL MEDIA MARKETING LINKS

Each brand page includes social media optimized CTAs:

**PrevLeak (Infrastructure)**
- Demo: https://saferide-peld8.web.app/prevleak.html
- CTA: "Start Demo" → sales@prevleakgroup.company

**SafeRide (Mobility)**
- Rider: https://saferide-peld8.web.app/rider/index.html
- CTA: "Download Rider App" → App Store links

**PaletteMath (Product)**
- Product: https://saferide-peld8.web.app/palettemath.html
- CTA: "Learn Color Analysis" → Request Access

**Qvedic (Digital Delivery)**
- Portal: https://saferide-peld8.web.app/qvedic.html
- CTA: "Partner Portal" → Schedule Consultation

**Plumber (Field Ops)**
- App: https://saferide-peld8.web.app/apps/plumber-app.html
- CTA: "Install Plumber App" → App Store links

---

## ✅ DEPLOYMENT COMPLETION CHECKLIST

After deployment, verify:

- [ ] All 5 brands accessible and rendering correctly
- [ ] Logo anchors present on all pages
- [ ] Footer with brand info on all pages
- [ ] Color schemes match documented specs
- [ ] Health endpoint returns 200 OK
- [ ] Firestore Rules enforcing brand isolation
- [ ] Cloud Functions responding to API calls
- [ ] Brand isolation validation script passes
- [ ] CTAs working (mailto: links functional)
- [ ] Social media pages linked correctly
- [ ] Firebase Console shows all deployments
- [ ] No errors in Cloud Logs

---

## 🎯 NEXT STEPS AFTER DEPLOYMENT

1. **Request First Municipal Pilot**
   - Send to: sales@prevleakgroup.company
   - Subject: "First Municipal Pilot - Infrastructure Operations"

2. **Social Media Marketing Rollout**
   - Use brand landing pages in marketing materials
   - Link to app store pages from brand portals
   - Share operational features docs in partner packets

3. **Live Operations Monitoring**
   - Monitor operations health dashboard daily
   - Track error rates and workflow completion times
   - Alert on degraded performance

4. **Scale to Additional Brands**
   - All 5 brands now deployed
   - Firestore isolation ready for multi-tenant expansion
   - Ready for additional ecosystem brands

---

## 📞 SUPPORT CONTACTS

- **Sales & Partnerships:** sales@prevleakgroup.company
- **Technical Support:** support@prevleakgroup.company
- **Emergency Operations:** ops@prevleakgroup.company
- **API Documentation:** https://api.prevleakgroup.company/docs

---

**Deployment Status: ✅ READY FOR PRODUCTION**

All components verified, tested, and ready to deploy.

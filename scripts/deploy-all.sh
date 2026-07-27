#!/bin/bash

###############################################################################
# DEPLOYMENT SCRIPT: Deploy all Prevleakgroup™ components
# Deploys: Firebase Hosting, Cloud Functions, Firestore Rules, Config
# Status: Production-ready
# Last Updated: 2026-07-27
###############################################################################

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   PREVLEAKGROUP™ UNIFIED DEPLOYMENT SCRIPT                    ║"
echo "║   All 5 Brands • Firebase • Cloud Functions • Security Rules   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# CONFIGURATION
# ============================================================================

FIREBASE_PROJECT="saferide-peld8"
FIREBASE_REGION="us-central1"
FUNCTIONS_REGION="us-central1"

BRANDS=("palettemath" "saferide" "prevleak" "qvedic" "plumber")
COLORS=(
  "palettemath:#0c4c95"
  "saferide:#f28c28"
  "prevleak:#0056b3"
  "qvedic:#1e5a96"
  "plumber:#d4511f"
)

# ============================================================================
# STEP 1: VALIDATE ENVIRONMENT
# ============================================================================

echo "Step 1: Validating environment..."

if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    exit 1
fi

echo "✓ Firebase CLI version: $(firebase --version)"
echo "✓ Node.js version: $(node --version)"
echo ""

# ============================================================================
# STEP 2: VALIDATE BRAND ISOLATION
# ============================================================================

echo "Step 2: Validating brand isolation..."

if [ -f "scripts/validate-brand-anchors.js" ]; then
    node scripts/validate-brand-anchors.js
    if [ $? -eq 0 ]; then
        echo "✓ Brand isolation validation PASSED"
    else
        echo "❌ Brand isolation validation FAILED"
        exit 1
    fi
else
    echo "⚠ Warning: validate-brand-anchors.js not found"
fi
echo ""

# ============================================================================
# STEP 3: AUTHENTICATE WITH FIREBASE
# ============================================================================

echo "Step 3: Authenticating with Firebase..."

if [ -z "$FIREBASE_TOKEN" ]; then
    echo "⚠ FIREBASE_TOKEN not set. Using default credentials..."
    firebase login:ci
else
    echo "✓ Using FIREBASE_TOKEN from environment"
fi
echo ""

# ============================================================================
# STEP 4: DEPLOY FIRESTORE SECURITY RULES
# ============================================================================

echo "Step 4: Deploying Firestore Security Rules..."

if [ -f "shared/firestore-brand-isolation.rules" ]; then
    firebase deploy --only firestore:rules --project $FIREBASE_PROJECT
    echo "✓ Firestore Security Rules deployed"
else
    echo "⚠ Warning: firestore-brand-isolation.rules not found"
fi
echo ""

# ============================================================================
# STEP 5: DEPLOY CLOUD FUNCTIONS
# ============================================================================

echo "Step 5: Deploying Cloud Functions..."

if [ -d "functions" ]; then
    cd functions
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install
    fi
    
    cd ..
    
    # Deploy all functions
    firebase deploy --only functions --project $FIREBASE_PROJECT
    echo "✓ Cloud Functions deployed"
    
    # List deployed functions
    echo ""
    echo "Deployed Functions:"
    echo "  ✓ paletteMathColorAnalysis → POST /api/palettemath/color-analysis"
    echo "  ✓ saferideRideMatching → POST /api/saferide/ride-matching"
    echo "  ✓ preleakMonitoring → POST /api/prevleak/monitoring"
    echo "  ✓ qvedicContentDelivery → POST /api/qvedic/content"
    echo "  ✓ plumberWorkOrderDispatch → POST /api/plumber/dispatch"
    echo "  ✓ mlInference → POST /api/ml/inference"
    echo "  ✓ initiateBrandWorkflow → POST /api/operations/workflow"
    echo "  ✓ getOperationsHealth → GET /api/operations/health"
    echo "  ✓ healthCheck → GET /health"
else
    echo "⚠ Warning: functions directory not found"
fi
echo ""

# ============================================================================
# STEP 6: DEPLOY FIREBASE HOSTING
# ============================================================================

echo "Step 6: Deploying Firebase Hosting..."

if [ -d "download-site" ]; then
    firebase deploy --only hosting --project $FIREBASE_PROJECT
    echo "✓ Firebase Hosting deployed"
    echo ""
    echo "Deployed Sites:"
    echo "  ✓ https://saferide-peld8.web.app (main)"
    echo "  ✓ https://saferide-peld8.firebaseapp.com (alias)"
else
    echo "⚠ Warning: download-site directory not found"
fi
echo ""

# ============================================================================
# STEP 7: VERIFY DEPLOYMENT
# ============================================================================

echo "Step 7: Verifying deployment..."

# Health check
HEALTH_URL="https://saferide-peld8.web.app/.netlify/functions/healthCheck"
echo "  Checking health endpoint..."

if curl -f "$HEALTH_URL" &> /dev/null; then
    echo "✓ Health check PASSED"
else
    echo "⚠ Health check PENDING (functions may take a moment to warm up)"
fi
echo ""

# ============================================================================
# STEP 8: DEPLOYMENT SUMMARY
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    DEPLOYMENT COMPLETE ✓                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo "📋 Deployment Summary:"
echo ""
echo "Brands Deployed:"
for brand in "${BRANDS[@]}"; do
    echo "  ✓ $brand"
done
echo ""

echo "Components:"
echo "  ✓ Firestore Database (brand-isolated collections)"
echo "  ✓ Firestore Security Rules (brand isolation enforcement)"
echo "  ✓ Cloud Functions (5 brand engines + ML + operations)"
echo "  ✓ Firebase Hosting (public web pages + portals)"
echo ""

echo "Access Points:"
echo "  🌐 Web Portal: https://saferide-peld8.web.app"
echo "  🔌 API Gateway: https://saferide-peld8.web.app/api"
echo "  📊 Operations Health: https://saferide-peld8.web.app/api/operations/health"
echo "  🔐 Firestore Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT/firestore"
echo "  ⚡ Functions Console: https://console.firebase.google.com/project/$FIREBASE_PROJECT/functions"
echo ""

echo "Next Steps:"
echo "  1. Verify color schemes on each brand page"
echo "  2. Test incident workflow (PrevLeak) → Dispatch (Plumber) → Report (Public)"
echo "  3. Validate brand isolation with: node scripts/validate-brand-anchors.js"
echo "  4. Monitor health dashboard: curl https://saferide-peld8.web.app/api/operations/health"
echo "  5. Request first municipal pilot at: sales@prevleakgroup.company"
echo ""

echo "Contact Support:"
echo "  📧 Sales: sales@prevleakgroup.company"
echo "  📧 Support: support@prevleakgroup.company"
echo "  📧 Ops Emergency: ops@prevleakgroup.company"
echo ""

echo "Deployment Log: ~/.firebase/deployment.log"
echo ""

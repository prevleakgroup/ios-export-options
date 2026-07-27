#!/bin/bash
# FIREBASE BRAND DEPLOYMENT SCRIPT
# Links each brand workflow to Firebase hosting targets
# Uses port gateways for local development
# Source code remains protected - NOT published

set -e

PROJECT="saferide-peld8"
REGION="us-central1"

echo "=========================================="
echo "FIREBASE BRAND DEPLOYMENT"
echo "Project: $PROJECT"
echo "=========================================="

# Array of brands and their targets
declare -A BRANDS=(
  [prevleak]="prevleak-peld8"
  [saferide]="saferide-peld8"
  [palettemath]="palettemath-peld8"
  [qvedic]="qvedic-peld8"
)

# Deploy each brand to its hosting target
for BRAND in "${!BRANDS[@]}"; do
  TARGET=${BRANDS[$BRAND]}
  
  echo ""
  echo ">>> Deploying $BRAND to $TARGET"
  
  # Deploy hosting for this brand
  firebase deploy \
    --only "hosting:$BRAND" \
    --project "$PROJECT" \
    --message "Deploying $BRAND brand workflow"
  
  echo "✅ $BRAND deployed successfully"
done

echo ""
echo "=========================================="
echo "✅ ALL BRANDS DEPLOYED"
echo "=========================================="
echo ""
echo "LIVE WEBSITES:"
echo "  PrevLeak:   https://prevleak-peld8.web.app"
echo "  SafeRide:   https://saferide-peld8.web.app"
echo "  PaletteMath: https://palettemath-peld8.web.app"
echo "  Qvedic:     https://qvedic-peld8.web.app"
echo ""
echo "API ENDPOINTS (via Cloud Functions):"
echo "  https://us-central1-$PROJECT.cloudfunctions.net/auth/signup/email?brand={brand}"
echo "  https://us-central1-$PROJECT.cloudfunctions.net/auth/signin/email?brand={brand}"
echo ""

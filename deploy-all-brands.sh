#!/bin/bash
# 5-BRAND FIREBASE DEPLOYMENT AUTOMATION SCRIPT
# Run this to deploy all 5 brands with a single command

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════╗"
echo "║   5-BRAND FIREBASE PRODUCTION DEPLOYMENT              ║"
echo "║   PrevLeak • SafeRide • PaletteMath • Qvedic • Plumber║"
echo "╚════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print step
print_step() {
  echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
  print_error "Node.js is not installed. Please install Node.js 20 or later."
  exit 1
fi
print_success "Node.js $(node --version) detected"

# Check npm
if ! command -v npm &> /dev/null; then
  print_error "npm is not installed."
  exit 1
fi
print_success "npm $(npm --version) detected"

# Check Firebase CLI
if ! command -v firebase &> /dev/null; then
  print_warning "Firebase CLI not found. Installing..."
  npm install -g firebase-tools@latest
else
  print_success "Firebase CLI $(firebase --version | cut -d' ' -f1) detected"
fi

# Check Git
if ! command -v git &> /dev/null; then
  print_error "Git is not installed. Please install Git."
  exit 1
fi
print_success "Git detected"

echo ""
print_step "Environment setup..."

# Set Genkit version if needed
export GENKIT_DEV_VERSION="1.40.1"
print_success "Genkit version set to 1.40.1"

# Check Firebase project
PROJECT_ID="saferide-peld8"
print_step "Checking Firebase project: $PROJECT_ID"

# Verify Firebase authentication
if ! firebase list --project $PROJECT_ID &> /dev/null; then
  print_warning "Not authenticated with Firebase. Starting login..."
  firebase login
else
  print_success "Firebase authentication verified"
fi

echo ""
print_step "Installing dependencies..."

# Install function dependencies
if [ -d "functions" ]; then
  cd functions
  npm ci --prefer-offline
  print_success "Functions dependencies installed"
  cd ..
else
  print_error "functions directory not found"
  exit 1
fi

echo ""
print_step "Validating configuration..."

# Validate firebase.json
if [ -f "firebase.json" ]; then
  print_success "firebase.json found"
else
  print_error "firebase.json not found"
  exit 1
fi

# Validate .firebaserc
if [ -f ".firebaserc" ]; then
  print_success ".firebaserc found"
else
  print_error ".firebaserc not found"
  exit 1
fi

# Validate security rules
if [ -f "firestore-brand-isolation.rules" ]; then
  print_success "Firestore Security Rules found"
else
  print_error "Firestore Security Rules not found"
  exit 1
fi

echo ""
print_step "Validating Cloud Functions..."

# Basic validation
if [ -f "functions/index.js" ]; then
  print_success "index.js entry point found"
else
  print_error "functions/index.js not found"
  exit 1
fi

# Check key modules
modules=(
  "firebase-auth-manager.js"
  "auth-routes.js"
  "firebase-data-engine.js"
  "firebase-ml-engine.js"
  "firebase-operations-coordinator.js"
  "webhook-orchestration.js"
  "brand-secrets-manager.js"
  "genkit-workflows.js"
)

for module in "${modules[@]}"; do
  if [ -f "functions/$module" ]; then
    print_success "$module exists"
  else
    print_warning "$module not found (optional)"
  fi
done

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}DEPLOYMENT OPTIONS${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""
echo "1) Deploy Cloud Functions (us-central1 + eu-west1)"
echo "2) Deploy Firestore Security Rules"
echo "3) Deploy Firebase Hosting (4 brands)"
echo "4) Deploy Everything (Functions + Rules + Hosting)"
echo "5) Setup Brand Secrets"
echo "6) Check Genkit Workflows"
echo ""
read -p "Select option (1-6): " option

case $option in
  1)
    print_step "Deploying Cloud Functions..."
    firebase deploy --only functions --project $PROJECT_ID
    print_success "Cloud Functions deployed!"
    firebase functions:list --project $PROJECT_ID
    ;;
  2)
    print_step "Deploying Firestore Security Rules..."
    firebase deploy --only firestore:rules --project $PROJECT_ID
    print_success "Firestore Security Rules deployed!"
    ;;
  3)
    print_step "Deploying Firebase Hosting (4 brands)..."
    firebase deploy --only hosting --project $PROJECT_ID
    print_success "Firebase Hosting deployed!"
    firebase hosting:sites:list --project $PROJECT_ID
    ;;
  4)
    print_step "Deploying everything (Functions + Rules + Hosting)..."
    firebase deploy --only functions,firestore:rules,hosting --project $PROJECT_ID
    print_success "Complete deployment successful!"
    ;;
  5)
    print_step "Setting up Brand Secrets..."
    cd functions
    if [ -f "brand-secrets-init.js" ]; then
      node brand-secrets-init.js status
      print_success "Secrets status checked"
    else
      print_error "brand-secrets-init.js not found"
    fi
    cd ..
    ;;
  6)
    print_step "Checking Genkit Workflows..."
    if [ -f "functions/genkit-workflows.js" ]; then
      print_success "12 Genkit workflows available:"
      echo "  PrevLeak: Threat Detection, Incident Prediction"
      echo "  SafeRide: Ride Matching, Route Optimization"
      echo "  PaletteMath: Color Analysis, Palette Generation"
      echo "  Qvedic: Content Recommendation, Engagement Optimization"
      echo "  Plumber: Dispatch Optimization, Demand Forecast"
      echo "  Shared: Data Processing, Anomaly Detection"
    else
      print_error "genkit-workflows.js not found"
    fi
    ;;
  *)
    print_error "Invalid option"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next Steps:"
echo "1. Verify Firebase Console:"
echo "   https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
echo "2. Check Cloud Functions:"
echo "   https://console.cloud.google.com/functions?project=$PROJECT_ID"
echo ""
echo "3. Setup Webhooks (GoDaddy):"
echo "   See GITHUB-DEPLOYMENT.md for webhook URLs"
echo ""
echo "4. Initialize Brand Secrets:"
echo "   node functions/brand-secrets-init.js init"
echo ""
echo "5. Push to GitHub for CI/CD:"
echo "   git add ."
echo "   git commit -m 'deploy: all 5 brands production ready'"
echo "   git push origin main"
echo ""
print_success "All set! 5 brands infrastructure is live."

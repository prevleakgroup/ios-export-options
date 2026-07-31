#!/usr/bin/env bash
set -euo pipefail

export PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
export REGION="${REGION:-us-central1}"
export REPO_OWNER="${REPO_OWNER:-your-github-username}"
export REPO_NAME="${REPO_NAME:-your-repo-name}"
export SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-github-deploy-sa}"
export WORKLOAD_POOL="${WORKLOAD_POOL:-github-pool}"
export WORKLOAD_PROVIDER="${WORKLOAD_PROVIDER:-github-provider}"

# 1) Enable APIs
 gcloud services enable iamcredentials.googleapis.com \
   iam.googleapis.com \
   cloudbuild.googleapis.com \
   firebasehosting.googleapis.com \
   run.googleapis.com \
   artifactregistry.googleapis.com \
   storage.googleapis.com

# 2) Create service account
 gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
   --project "$PROJECT_ID"

# 3) Grant least-privilege roles
 gcloud projects add-iam-policy-binding "$PROJECT_ID" \
   --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
   --role="roles/firebasehosting.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
   --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
   --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
   --member="serviceAccount:${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
   --role="roles/storage.admin"

# 4) Create Workload Identity Pool and Provider
 gcloud iam workload-identity-pools create "$WORKLOAD_POOL" \
   --project="$PROJECT_ID" \
   --location="global" \
   --display-name="GitHub OIDC"

gcloud iam workload-identity-pools providers create-oidc "$WORKLOAD_PROVIDER" \
   --project="$PROJECT_ID" \
   --location="global" \
   --workload-identity-pool="$WORKLOAD_POOL" \
   --issuer-uri="https://token.actions.githubusercontent.com" \
   --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner"

# 5) Bind GitHub repo to service account
 gcloud iam service-accounts add-iam-policy-binding \
   "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com" \
   --project="$PROJECT_ID" \
   --role="roles/iam.workloadIdentityUser" \
   --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')/locations/global/workloadIdentityPools/$WORKLOAD_POOL/attribute.repository/$REPO_OWNER/$REPO_NAME"

# 6) Output values for GitHub Actions
 echo "Use these values in GitHub Actions:"
 echo "PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
 echo "POOL_ID=$WORKLOAD_POOL"
 echo "PROVIDER_ID=$WORKLOAD_PROVIDER"
 echo "SERVICE_ACCOUNT=${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

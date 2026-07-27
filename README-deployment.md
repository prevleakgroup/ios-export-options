# Deployment Notes

Use the business identity thulani@prevleakgroup.company for Firebase, Google Cloud, GitHub, and API access for this repository and its deployments.

## Launch anchor and integration protocol

This repository is the source-of-truth anchor for the public launch and deployment workflow across GitHub, Firebase Hosting, Google Cloud / Cloud Shell, VS Code, and the public app-store entry points.

- GitHub: keep the repository as the canonical source of launch notes, deployment scripts, and governance checks. The active remote is https://github.com/prevleakgroup/PrevLeak-Group.git.
- Firebase Hosting: deploy the public site from the Firebase project saferide-peld8 using the hosting target in this repository.
- Cloud Shell / Google Cloud: use Cloud Shell for admin-level checks, deployment validation, and service-account review when required.
- VS Code: keep the workspace rooted in this repository so all edits, deployment scripts, and launch documentation stay aligned.
- App stores: use only the published app-store addresses for public marketing and launch materials.

Canonical public launch targets:
- Main: https://prevleakgroup.co.za/
- Management: https://saferiderapp.co.za/
- Rider: https://saferideapp.co.za/
- Driver: https://saferidesapp.co.za/
- Palettemath: https://palettemath.net/

App-store entry points:
- Google Play: https://play.google.com/store/search?q=PrevLeak%20Group%20Saferide&c=apps
- Apple App Store: https://apps.apple.com/za/

Integration sequence:
1. GitHub holds the approved source and launch notes.
2. Firebase Hosting publishes the public web experience.
3. App Hosting uses the canonical public site URL from apphosting.yaml.
4. GoDaddy forwarding routes the short public domains to the canonical destinations.
5. Public marketing uses only the front-facing URLs and app-store addresses.

Keep the Firebase CLI signed in as thulani@prevleakgroup.company and do not use the old Gmail-linked account for deploys, service-account access, or project ownership changes.

Canonical public URLs for launch and marketing:
- Main: https://prevleakgroup.co.za/
- Management: https://saferiderapp.co.za/
- Rider: https://saferideapp.co.za/
- Driver: https://saferidesapp.co.za/
- Palettemath: https://palettemath.net/

Firebase hosting base URL for the current project:
- https://saferide-peld8.web.app

## Secret Manager access for App Hosting / compute service account

If your app reads secrets from Secret Manager, grant the compute service account used by App Hosting the Secret Manager Secret Accessor role.

Example:

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_COMPUTE_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

Replace `YOUR_COMPUTE_SERVICE_ACCOUNT` with the service account that your App Hosting runtime uses, such as the default App Hosting compute service account.

## Multi-site deployment in a monorepo

For multiple Firebase Hosting sites from one codebase, define deploy targets in the root firebase.json file and deploy a specific target with:

```bash
firebase deploy --only hosting:admin-panel
```

If you are using Firebase hosting targets, make sure the target names are configured in your project with:

```bash
firebase target:apply hosting admin-panel your-site-id
```

## GitHub source governance for operations and ML

This repository now includes GitHub-enforced governance checks for:
- operational data structure contracts
- ML reliability and release thresholds
- public-link policy enforcement (no source/build artifact links on public HTML)

Key files:
- `.github/workflows/ops-governance.yml`
- `scripts/validate_operational_contracts.js`
- `ops/contracts/operational-data-structure.v1.json`
- `ops/ml/ml-governance.v1.json`
- `company-docs/published-domain-map.json`

Run locally before pushing:

```bash
node scripts/validate_operational_contracts.js
```

## GitHub App registration baseline (for solid Firebase + app-link controls)

Register a GitHub App in your organization/user settings with:
- Webhook URL: your CI endpoint (or leave disabled if Actions-only)
- Repository permissions:
  - Contents: Read and write
  - Pull requests: Read and write
  - Actions: Read and write
  - Checks: Read and write
  - Metadata: Read-only
- Subscribe to events:
  - push
  - pull_request
  - check_run
  - check_suite

After installation, keep this policy:
- Only merge PRs when `Ops Governance` workflow passes.
- Keep canonical front-facing domains in `company-docs/published-domain-map.json`.
- Keep app links as store addresses only in public pages.

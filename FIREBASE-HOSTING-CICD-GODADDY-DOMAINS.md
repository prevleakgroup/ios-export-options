# Firebase Hosting CI/CD and GoDaddy Domain Setup

This guide brings together the Firebase Hosting deployment workflow and the GoDaddy DNS steps used for the public launch domains in this repository.

## What is automated

The repository already contains two workflows that cover the main publish path:

- `.github/workflows/firebase-hosting-deployment.yml` deploys the static site from `download-site/` to Firebase Hosting whenever changes are pushed to `master` or when the workflow is run manually.
- `.github/workflows/configure-godaddy-dns.yml` upserts the A and CNAME records for the GoDaddy domains so they point at Firebase Hosting.

## Prerequisites

Before you run the deployment flow, make sure you have:

- Access to the Firebase project `saferide-peld8`
- A GitHub Actions secret named `FIREBASE_TOKEN`
- A GitHub Actions secret named `GODADDY_PAT` if you want to automate GoDaddy DNS updates
- The target domains registered in GoDaddy

## GitHub Actions CI/CD flow

1. Push your changes to `master`, or trigger the workflow manually in GitHub Actions.
2. The Firebase Hosting workflow validates the repository structure and deployment directory.
3. The workflow builds a deployment artifact from `download-site/` and deploys it with the Firebase CLI.
4. The workflow finishes by preparing a custom-domain checklist for Firebase Console.

### Required GitHub secrets

- `FIREBASE_TOKEN`: Firebase CLI token used by the deployment workflow.
- `GODADDY_PAT`: GoDaddy API token used by the DNS automation workflow.

## Firebase Hosting deployment commands

You can also deploy manually from the repository root:

```bash
firebase login
firebase deploy --project saferide-peld8 --public download-site --only hosting
```

Verify the deployment with:

```bash
firebase hosting:list --project saferide-peld8
```

## GoDaddy DNS setup

For each public domain, point the site at Firebase Hosting using DNS records in GoDaddy.

### Recommended record pattern

- Create two `A` records at the apex (`@`) that point to the Firebase Hosting IPs:
  - `151.101.1.195`
  - `151.101.65.195`
- Create a `CNAME` record for `www` that points to the matching Firebase site domain.

### Current domain mapping used by the workflow

| Domain | Firebase site target |
|--------|----------------------|
| `prevleakgroup.co.za` | `prevleakgroup-peld8.web.app` |
| `prevleak.company` | `prevleak-peld8.web.app` |
| `saferide.company` | `saferide-peld8.web.app` |
| `palettemath.net` | `palettemath-peld8.web.app` |
| `qvedic.company` | `qvedic-peld8.web.app` |

## Add the custom domain in Firebase Console

After the DNS records are in place:

1. Open the Firebase Hosting section for `saferide-peld8`.
2. Click `Add custom domain`.
3. Enter the domain and complete the verification step.
4. Wait for Firebase to issue the HTTPS certificate.

## Verification checklist

- Confirm the DNS records exist in GoDaddy.
- Confirm the domain resolves from the public internet.
- Confirm Firebase Hosting shows the domain as verified.
- Confirm HTTPS is enabled for the custom domain.

## Troubleshooting

If deployment fails:

- Make sure the `FIREBASE_TOKEN` secret is valid.
- Confirm the Firebase project name in `.firebaserc` matches the target project.
- Check the GitHub Actions logs for the deployment workflow.

If DNS does not resolve:

- Verify the GoDaddy records were created with the correct names and values.
- Wait for DNS propagation (often 5–30 minutes, but sometimes longer).
- Use tools such as `dig` or the GoDaddy DNS view to confirm the records are visible.

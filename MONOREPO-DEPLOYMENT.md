# PrevLeak Group Monorepo — Deployment Guide

This document covers everything needed to build, deploy, and maintain the PrevLeak Group monorepo in production.

---

## Firebase Hosting Targets

The monorepo deploys to **five Firebase Hosting targets**, all under the `saferide-peld8` Firebase project.

| Target | Site ID | Public Directory | Custom Domain |
|---|---|---|---|
| `prevleakgroup` | `prevleakgroup-peld8` | `download-site/` | prevleak.company |
| `prevleak` | `prevleak-peld8` | `download-site/prevleak-site/` | prevleak.company |
| `saferide` | `saferide-peld8` | `download-site/saferide-site/` | saferide.company |
| `palettemath` | `palettemath-peld8` | `download-site/palettemath-site/` | palettemath.company |
| `qvedic` | `qvedic-peld8` | `download-site/qvedic-site/` | qvedic.company |

Targets are declared in `.firebaserc` and served from `firebase.json`. All targets apply security headers (HSTS, CSP, X-Frame-Options, etc.) and rewrite all routes to `/index.html` for SPA routing.

---

## Workspace Build & Deploy Commands

### Prerequisites

```bash
npm install -g firebase-tools
firebase login          # interactive login
# or, for CI:
firebase login:ci       # outputs a FIREBASE_TOKEN for use in automation
```

### Build the service worker bundle

```bash
npm install
npm run build:sw
# Output: download-site/apps/firebase-sw.js
```

### Deploy all hosting targets at once

```bash
firebase deploy \
  --only hosting:prevleakgroup,hosting:prevleak,hosting:saferide,hosting:palettemath,hosting:qvedic \
  --project saferide-peld8
```

### Deploy a single hosting target

```bash
firebase deploy --only hosting:saferide --project saferide-peld8
```

### Deploy Cloud Functions

```bash
cd functions && npm ci && cd ..
firebase deploy --only functions --project saferide-peld8
```

### Deploy Firestore security rules

```bash
firebase deploy --only firestore:rules --project saferide-peld8
```

### Full production deployment (functions + rules + hosting)

```bash
firebase deploy --project saferide-peld8
```

### Verify deployed assets

```bash
firebase hosting:sites:list --project saferide-peld8
firebase functions:list   --project saferide-peld8
```

---

## GitHub Actions Secrets

The following secrets must be configured at `Settings → Secrets and variables → Actions` in the repository before any workflow can succeed.

| Secret | Description | How to obtain |
|---|---|---|
| `FIREBASE_TOKEN` | Long-lived CI token for Firebase CLI | Run `firebase login:ci` locally and copy the printed token |
| `GCP_SA_KEY` | Service account JSON key for GCP API access | GCP Console → IAM → Service Accounts → `saferide-peld8` → Keys → Add Key → JSON |
| `SLACK_WEBHOOK` | Incoming Webhook URL for deployment notifications | Slack workspace → Apps → Incoming Webhooks → Create new webhook |

### Adding a secret

1. Go to `https://github.com/prevleakgroup/ios-export-options/settings/secrets/actions`
2. Click **New repository secret**
3. Enter the name and value from the table above
4. Click **Add secret**

---

## GoDaddy DNS Setup for Firebase Custom Domains

Firebase Hosting requires ownership verification via DNS before serving traffic on a custom domain. Perform the following steps for each brand domain.

### Step 1 — Get verification records from Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com) → **Hosting** → select the site
2. Click **Add custom domain**
3. Enter the domain (e.g. `saferide.company`)
4. Firebase displays one or two `TXT` records for ownership verification — copy them

### Step 2 — Add records in GoDaddy

Go to **GoDaddy → My Products → Domains → (domain) → Manage DNS**.

Add the records below for each domain, substituting the Firebase-provided TXT values.

#### A records (root domain → Firebase servers)

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `151.101.1.195` | 1 hour |
| A | `@` | `151.101.65.195` | 1 hour |

> Firebase Hosting IP addresses may vary by region. Always use the addresses shown in the Firebase Console custom domain wizard for your site.

#### CNAME record (www subdomain)

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | `www` | `<site-id>.web.app` | 1 hour |

For example, for `saferide`:
```
CNAME  www  saferide-peld8.web.app
```

#### TXT records (ownership verification)

| Type | Name | Value | TTL |
|---|---|---|---|
| TXT | `@` | `<value from Firebase Console>` | 1 hour |

### Step 3 — Complete verification in Firebase Console

1. Return to the Firebase Console custom domain wizard
2. Click **Verify** — Firebase polls DNS and confirms ownership
3. After verification, Firebase provisions an SSL certificate automatically (up to 24 hours)
4. Once the certificate is live, enforce HTTPS in the Firebase Console

### Step 4 — Verify propagation locally

```bash
nslookup saferide.company
# Expected: resolves to Firebase Hosting IPs

dig TXT saferide.company +short
# Expected: shows the Firebase verification TXT record
```

Repeat Steps 1–4 for each brand domain (`prevleak.company`, `palettemath.company`, `qvedic.company`).

---

## Production Deployment Notes

### Repeatable deployment procedure

Follow these steps for every production release:

1. **Merge to `production` branch** — the `production-deploy.yml` workflow triggers automatically.
2. **Workflow validates** → deploys functions → deploys rules → deploys all hosting targets in parallel (max 2 at a time).
3. **Check Actions tab** — all four jobs must be green before the deployment is considered complete.
4. **Smoke-test each site**:
   ```bash
   curl -I https://prevleak.company
   curl -I https://saferide.company
   curl -I https://palettemath.company
   curl -I https://qvedic.company
   ```
5. **Slack notification** is sent automatically on success or failure.

### Manual deployment (emergency / hotfix)

Use `workflow_dispatch` on the **Complete Production Deployment** workflow and choose the appropriate type:

| Deployment type | What runs |
|---|---|
| `full` | functions + rules + all hosting |
| `functions-only` | Cloud Functions only |
| `hosting-only` | All four hosting targets |
| `rules-only` | Firestore security rules only |

### Rollback

Firebase Hosting keeps a deployment history. To roll back a hosting target:

```bash
firebase hosting:clone saferide-peld8:saferide saferide-peld8:saferide --version <VERSION_ID>
# Or use the Firebase Console → Hosting → Release history → Rollback
```

### Brand isolation checklist

Before every production deployment confirm:

- [ ] No secrets are committed to the repository (run `git log --oneline -10` and inspect recent diffs)
- [ ] Each brand's `download-site/<brand>-site/` directory contains only that brand's assets
- [ ] `firebase.json` hosting targets match `.firebaserc` target mappings
- [ ] Security headers are present in `firebase.json` for every target
- [ ] GitHub Actions secrets (`FIREBASE_TOKEN`, `GCP_SA_KEY`, `SLACK_WEBHOOK`) are set and not expired
- [ ] Custom domain DNS is verified and SSL certificate is active for each domain

---

## Related Documentation

| Document | Topic |
|---|---|
| `FIREBASE-HOSTING-SETUP.md` | Initial Firebase project setup |
| `DNS-CONFIGURATION-GODADDY.md` | GoDaddy DNS records for GitHub Pages |
| `GITHUB-CI-CD-QUICK-START.md` | GitHub Actions quick-start |
| `COMPLETE-DEPLOYMENT-GUIDE.md` | End-to-end GitHub + Android + iOS deployment |
| `IOS-APPSTORE-DEPLOYMENT.md` | iOS App Store submission guide |
| `ANDROID-PLAYSTORE-DEPLOYMENT.md` | Google Play submission guide |

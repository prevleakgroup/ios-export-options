# ios-export-options

This repository contains iOS export option plists, deployment scripts, Firebase configuration, and supporting documentation for the PrevLeak Group multi-brand release workflow.

## Start here

If you are not sure what to do next, use one of these entry points:

- **Project overview:** [`MASTER-README.md`](./MASTER-README.md)
- **Deployment roadmap:** [`COMPLETE-DEPLOYMENT-GUIDE.md`](./COMPLETE-DEPLOYMENT-GUIDE.md)
- **Quick setup checklist:** [`QUICK-START.md`](./QUICK-START.md)
- **iOS App Store deployment:** [`IOS-APPSTORE-DEPLOYMENT.md`](./IOS-APPSTORE-DEPLOYMENT.md)

## Repository contents

- `*-exportOptions.plist` — iOS export option files for brand-specific builds
- `functions/` — Firebase Functions backend
- `download-site/` — static site assets
- `scripts/` — validation and deployment helpers
- `deployments/` — deployment manifests and integration metadata

## Validation commands

- Root service worker build: `npm run build:sw`
- Functions lint placeholder: `cd functions && npm run lint`

If your goal is release packaging or App Store export configuration, start with the iOS deployment guide and the relevant `*-exportOptions.plist` file.

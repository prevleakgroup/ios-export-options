# Deployment Trees

This directory isolates publish paths by target so DNS and app-store releases cannot accidentally share or overwrite each other.

## Structure

- `deployments/dns/*/manifest.json`: one manifest per domain target.
- `deployments/appstores/*/manifest.json`: one manifest per store target.
- `deployments/integration/*.json`: source-to-platform integration manifests.

## Rules

- Every manifest must define a single target only.
- `sourcePath` must be explicit.
- `publishTarget` must be explicit.
- `privacyControls` must include non-public operational data handling.
- DNS manifests must include required TXT/SPF/DMARC policy metadata.

## Operational Use

1. Update only the manifest for the target you are publishing.
2. Run `node scripts/validate_operational_contracts.js`.
3. Run `node scripts/validate_link_integrity.js`.
4. Run DNS and forwarding checks before production cutover.

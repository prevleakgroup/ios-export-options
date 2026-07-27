# Firebase + GoDaddy Link-All Checklist

Use this to link all domains through Firebase Hosting (recommended) while keeping GitHub as CI/CD source only.

## Target architecture

- GitHub: source and workflows only
- Firebase Hosting: canonical web serving
- Firebase Functions: API serving
- GoDaddy: DNS registrar and DNS records only (avoid long-term URL forwarding)

## Domains to link

- prevleakgroup.co.za
- prevleakgroup.com
- saferiderapp.co.za
- saferideapp.co.za
- saferidesapp.co.za
- palettemath.net

## Canonical destination policy

- main: https://prevleakgroup.co.za/
- management: https://prevleakgroup.co.za/customer-hub.html
- rider: https://prevleakgroup.co.za/rider/index.html
- driver: https://prevleakgroup.co.za/driver/index.html
- palettemath: https://prevleakgroup.co.za/palettemath.html

## One-time Firebase setup per domain

For each domain:

1. In Firebase Hosting, add custom domain to project `saferide-peld8`.
2. Copy Firebase-provided verification record(s) and DNS target record(s).
3. In GoDaddy DNS, add exactly those records (do not alter values).
4. Wait for Firebase verification and SSL provisioning.
5. Repeat for next domain.

Note: Firebase provides domain-specific verification values, so these must be copied from Firebase Console at setup time.

## Required policy records in GoDaddy (all launch domains)

Add/verify at apex:

- TXT: `T9229417`
- TXT/SPF: `v=spf1 include:secureserver.net -all`
- DMARC host `_dmarc` TXT:
  `v=DMARC1; p=reject; rua=mailto:dmarc_rua@onsecureserver.net; adkim=r; aspf=r;`

## Subdomain requirements

Ensure DNS resolution for:

- auth.prevleakgroup.co.za
- uploads.prevleakgroup.co.za
- verify.prevleakgroup.co.za

## Cutover order

1. Link `prevleakgroup.co.za` to Firebase and verify SSL active.
2. Link `saferiderapp.co.za`, `saferideapp.co.za`, `saferidesapp.co.za`, `palettemath.net`.
3. Link `prevleakgroup.com`.
4. Remove temporary GoDaddy forwarding once direct DNS-to-Firebase mapping is active.

## Validation commands

Run after every batch:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check_front_domains.ps1
powershell -ExecutionPolicy Bypass -File scripts/validate_dns_txt_records.ps1
```

Final publish run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pc-dc-operator.ps1 -Publish
```

## Expected finish state

- All domains resolve and map to policy routes.
- TXT/SPF/DMARC checks pass for all configured domains.
- auth/uploads/verify subdomains resolve.
- Firebase + Functions health checks stay green.

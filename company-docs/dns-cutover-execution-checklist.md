# DNS Cutover Execution Checklist

Date: 2026-07-25
Project: saferide-peld8

## Goal
Lock source-to-Firebase-to-GoDaddy routing, DNS policy, and visitor access for all public domains.

## A) Firebase Hosting Baseline
1. Keep active hosting target on saferide-peld8.
2. Keep source publish root as download-site.
3. Confirm deploy success before DNS changes:
   - firebase deploy --only hosting

## B) GoDaddy Forwarding Map (Permanent 301)
1. prevleakgroup.com -> https://prevleakgroup.co.za/
2. saferiderapp.co.za -> https://prevleakgroup.co.za/customer-hub.html
3. saferideapp.co.za -> https://prevleakgroup.co.za/rider/index.html
4. saferidesapp.co.za -> https://prevleakgroup.co.za/driver/index.html
5. palettemath.net -> https://prevleakgroup.co.za/palettemath.html

Important: do not point prevleakgroup.co.za back to itself or to a page that redirects back to prevleakgroup.co.za. The canonical target must be a direct final destination and not a redirect loop.

Required forwarding mode:
- Type: Permanent (301)
- Protocol: HTTPS destination
- Masking: Off

## C) TXT/SPF/DMARC Records (Per Domain)
Apply on each required domain apex and _dmarc:

Apex TXT records:
1. T9229417
2. v=spf1 include:secureserver.net -all

DMARC TXT record:
1. v=DMARC1; p=reject; rua=mailto:dmarc_rua@onsecureserver.net; adkim=r; aspf=r;

## D) Subdomain Resolution for Registration Workflows
Publish and resolve:
1. auth.prevleakgroup.co.za
2. uploads.prevleakgroup.co.za
3. verify.prevleakgroup.co.za

## E) Validation Commands
Run from repository root.

1. Source governance:
- node scripts/validate_operational_contracts.js

2. Front-domain forwarding:
- powershell -ExecutionPolicy Bypass -File .\scripts\check_front_domains.ps1

3. TXT/SPF/DMARC policy:
- powershell -ExecutionPolicy Bypass -File .\scripts\validate_dns_txt_records.ps1

4. Live page access:
- curl https://saferide-peld8.web.app/
- curl https://prevleakgroup.co.za/
- curl https://prevleakgroup.co.za/customer-hub.html

## F) Pass Criteria
1. check_front_domains.ps1 returns pass.
2. validate_dns_txt_records.ps1 returns pass.
3. No redirect loops on prevleakgroup.co.za.
4. Customer hub and rider/driver pages return HTTP 200 via final domains.
5. auth/uploads/verify subdomains resolve publicly.

## G) Final Lock Statement
Routing and DNS are considered locked only when all checks pass in sections E and F.

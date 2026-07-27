# GoDaddy Manual Cutover Sheet

Date: 2026-07-25
Project: saferide-peld8

Use this sheet exactly as written when editing GoDaddy forwarding and DNS records.

## 1) Forwarding Entries (Permanent 301, no masking)
Apply at domain-level forwarding for each domain.

1. prevleakgroup.com -> https://prevleakgroup.co.za/
2. saferiderapp.co.za -> https://prevleakgroup.co.za/customer-hub.html
3. saferideapp.co.za -> https://prevleakgroup.co.za/rider/index.html
4. saferidesapp.co.za -> https://prevleakgroup.co.za/driver/index.html
5. palettemath.net -> https://prevleakgroup.co.za/palettemath.html

Important: make sure prevleakgroup.co.za is not set to recursively forward to itself or to another domain that loops back to it.

Forwarding mode for all five:
- Type: Permanent (301)
- Protocol: HTTPS destination
- Forward settings: Forward only
- Masking: Off

## 2) TXT and DMARC Entries (Exact Values)
Apply these values on each target domain that is in launch scope.

At apex (@), add TXT records:
1. T9229417
2. v=spf1 include:secureserver.net -all

At _dmarc, add TXT record:
1. v=DMARC1; p=reject; rua=mailto:dmarc_rua@onsecureserver.net; adkim=r; aspf=r;

## 3) Subdomain Publishing
Create DNS so these names resolve publicly:
1. auth.prevleakgroup.co.za
2. uploads.prevleakgroup.co.za
3. verify.prevleakgroup.co.za

## 4) Fast Verification Commands
Run from repository root after saving GoDaddy changes and waiting for propagation.

1. node scripts/validate_operational_contracts.js
2. powershell -ExecutionPolicy Bypass -File .\scripts\check_front_domains.ps1
3. powershell -ExecutionPolicy Bypass -File .\scripts\validate_dns_txt_records.ps1

Optional route smoke checks:
- curl.exe -I https://prevleakgroup.co.za/
- curl.exe -I https://prevleakgroup.co.za/customer-hub.html
- curl.exe -I https://prevleakgroup.co.za/rider/index.html
- curl.exe -I https://prevleakgroup.co.za/driver/index.html

## 5) Success Definition
Cutover is complete only when:
1. forwarding validator passes,
2. TXT/SPF/DMARC validator passes,
3. prevleakgroup.co.za has no redirect loop,
4. customer-hub, rider, and driver routes return HTTP 200 on final domains,
5. auth/uploads/verify subdomains resolve.
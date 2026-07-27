# Launch Validation Report

Date: 2026-07-25
Project: saferide-peld8
Scope: Source, Firebase Hosting, GoDaddy forwarding, TXT/SPF/DMARC records, public route visibility

## 1) Source and Deploy Status
- Source validation: PASS (operational contracts and ML governance checks)
- Firebase deploy: PASS
- Active hosting URL: https://saferide-peld8.web.app/

## 2) Public Route Visibility (Latest Check)
- https://saferide-peld8.web.app/ -> 200
- https://saferide-peld8.web.app/customer-hub.html -> 200
- https://saferide-peld8.web.app/rider/index.html -> 200
- https://saferide-peld8.web.app/driver/index.html -> 200
- https://saferide-peld8.web.app/apps/plumber-app.html -> 200
- https://saferide-peld8.web.app/apps/public-reporting-app.html -> 200

## 3) Custom Domain and Forwarding Status
- https://prevleakgroup.co.za/ -> redirect loop / too many redirects
- https://prevleakgroup.co.za/customer-hub.html -> 404
- https://saferideapp.co.za/ -> resolves to Firebase root
- https://saferiderapp.co.za/ -> resolves to Firebase rider page
- https://saferidesapp.co.za/ -> resolves to Firebase root
- https://palettemath.net/ -> resolves on itself (not forwarding to required destination)

## 4) TXT/SPF/DMARC Validation Result
Required values checked:
- @ TXT: T9229417
- @ TXT: v=spf1 include:secureserver.net -all
- _dmarc TXT: v=DMARC1; p=reject; rua=mailto:dmarc_rua@onsecureserver.net; adkim=r; aspf=r;

Observed results:
- prevleakgroup.co.za: FAIL
  - apex TXT missing both required values
  - DMARC present but p=quarantine (expected p=reject)
- saferideapp.co.za: FAIL
  - apex TXT missing both required values
  - DMARC present but p=quarantine
- saferiderapp.co.za: FAIL
  - apex TXT missing both required values
  - DMARC present but p=quarantine
- saferidesapp.co.za: FAIL
  - apex TXT missing both required values
  - DMARC present but p=quarantine
- palettemath.net: FAIL
  - apex TXT missing both required values
  - DMARC present but p=quarantine
- prevleakgroup.com: FAIL
  - apex TXT only google-site-verification found
  - DMARC missing

## 5) Registration and Signup Endpoint Readiness
- mailto links present: PASS
  - sales@prevleakgroup.company
  - support@prevleakgroup.company
- subdomain endpoints not yet resolvable: FAIL
  - auth.prevleakgroup.co.za
  - uploads.prevleakgroup.co.za
  - verify.prevleakgroup.co.za

## 6) Required Actions to Reach Full Launch Lock
1. Fix prevleakgroup.co.za redirect loop.
2. Point forwarding destinations exactly to approved .co.za routes.
3. Publish and resolve auth/uploads/verify subdomains.
4. Set required TXT/SPF/DMARC records to exact values across all intended domains.
5. Re-run domain, DNS, and route visibility checks after propagation.

## 7) Final Rerun Evidence (2026-07-25)
- Forwarding validator: FAIL
  - prevleakgroup.com could not be resolved
  - saferiderapp.co.za forwarded to https://saferide-peld8.web.app/rider/index.html (expected https://prevleakgroup.co.za/customer-hub.html)
  - saferideapp.co.za forwarded to https://saferide-peld8.web.app/ (expected https://prevleakgroup.co.za/rider/index.html)
  - saferidesapp.co.za forwarded to https://saferide-peld8.web.app/ (expected https://prevleakgroup.co.za/driver/index.html)
  - palettemath.net remained on https://palettemath.net/ (expected https://prevleakgroup.co.za/palettemath.html)
- DNS TXT/SPF/DMARC validator: FAIL
  - all target domains failed at least one required TXT/SPF/DMARC assertion
  - all observed DMARC policies were p=quarantine or missing (expected p=reject)
- Route curl snapshot:
  - Firebase-hosted routes stayed 200 (PASS)
  - prevleakgroup.co.za root returned 301 loop and customer-hub route returned 404
  - auth/uploads/verify subdomains remained unresolved

## 8) Final Launch Verdict
- Source and Firebase deployment state: READY
- External DNS and forwarding state: NOT READY
- Overall launch lock: FAIL (blocked externally)

## 9) Evidence Log Files
- Forwarding validation log: ops/validation-logs/check_front_domains-20260725-215149.log
- DNS TXT/SPF/DMARC log: ops/validation-logs/validate_dns_txt_records-20260725-215158.log

## 10) Remote Authorization Recheck (GoDaddy)
- Date: 2026-07-25
- Shared GoDaddy session loaded domain forwarding tab for saferiderapp.co.za.
- Forwarding controls reported as enabled in UI state checks, but edit/add dialogs did not render in the remote automation session.
- Result: remote authorization and write-back could not be completed programmatically from this session.

Current external status at recheck:
- prevleakgroup.co.za apex TXT: missing T9229417 and SPF record.
- prevleakgroup.co.za DMARC: p=quarantine (expected p=reject).
- prevleakgroup.co.za root: redirect loop; customer-hub route: 404.
- auth/uploads/verify subdomains: unresolved.
- saferiderapp.co.za / saferideapp.co.za / saferidesapp.co.za / palettemath.net forwarding: still misaligned with source policy.

# Domain Forwarding Source of Truth

This file defines the required production forwarding map for front-facing domains.

## Required forwarding map
- prevleakgroup.com -> https://prevleakgroup.co.za/
- saferiderapp.co.za -> https://prevleakgroup.co.za/customer-hub.html
- saferideapp.co.za -> https://prevleakgroup.co.za/rider/index.html
- saferidesapp.co.za -> https://prevleakgroup.co.za/driver/index.html
- palettemath.net -> https://prevleakgroup.co.za/palettemath.html

## Management and data flow role
- saferiderapp.co.za is the public marketing and customer management entrypoint.
- Customer registrations, authorization requests, uploads, and verification actions route to `customer-hub.html` and related secured services.
- Dedicated rider and driver experiences remain separated on their respective domains.

## Required subdomains on prevleakgroup.co.za
- auth.prevleakgroup.co.za -> authorization and account access
- uploads.prevleakgroup.co.za -> image/document upload gateway
- verify.prevleakgroup.co.za -> verification and review workflows

## Forwarding mode
- Type: Permanent (301)
- Protocol: HTTPS destination
- Behavior: Forward only (no masking)

## Prohibited configurations
- Do not forward front domains to each other.
- Do not create circular redirects between any two domains.
- Do not use local, source-code, or build artifact links in public routing.

## Verification command (local)
Run this from repository root after GoDaddy updates:

```powershell
$domains=@('prevleakgroup.com','saferiderapp.co.za','saferideapp.co.za','saferidesapp.co.za','palettemath.net'); foreach($d in $domains){ Write-Output "`n=== $d ==="; curl.exe -sS -D - -o NUL "https://$d" | Select-Object -First 20 }
```

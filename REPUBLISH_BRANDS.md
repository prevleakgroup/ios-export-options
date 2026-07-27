# Republish Brands - Final Deployment
# =====================================

## Overview
This PowerShell script republishes all three brand templates to their final production state.

## Execution

```powershell
# Make the script executable
chmod +x republish-brands.sh

# Run the deployment verification
./republish-brands.sh

# Deploy to Firebase
firebase deploy --only hosting
```

## Brands Deployed

### 1. Palettemath Brand
- **Container**: `/palettemath-brand/index.html`
- **Color Scheme**: Blue (#0c4c95) + White
- **Logo**: Palettemath logo (palettemath-logo.svg)
- **Domains**:
  - https://palettemath.co.za → saferide-peld8.web.app/palettemath-brand
  - https://palettemath.net → saferide-peld8.web.app/palettemath-brand

### 2. Saferide Brand
- **Container**: `/saferide-brand/index.html`
- **Color Scheme**: Orange (#f28c28) + White
- **Logo**: Saferide logo (saferide-logo.svg)
- **Domains**:
  - https://saferideapp.co.za → saferide-peld8.web.app/saferide-brand
  - https://saferiderapp.co.za → saferide-peld8.web.app/saferide-brand

### 3. PrevLeak Brand
- **Container**: `/prevleak-brand/index.html`
- **Color Scheme**: Blue (#0c4c95) + White
- **Logo**: PrevLeak logo (prevleak-logo.svg)
- **Domains**:
  - https://prevleakgroup.co.za → saferide-peld8.web.app/prevleak-brand

## Template Structure

Each brand includes:
- ✅ `index.html` - Brand-specific landing page
- ✅ `template.json` - GoDaddy template configuration
- ✅ Logo anchors via meta tags and link elements
- ✅ Responsive design (768px breakpoint)
- ✅ Clean branding (no cross-brand references)

## Deployment Status

| Brand | Status | Container | URL |
|-------|--------|-----------|-----|
| **Palettemath** | ✅ READY | palettemath-brand | saferide-peld8.web.app/palettemath-brand |
| **Saferide** | ✅ READY | saferide-brand | saferide-peld8.web.app/saferide-brand |
| **PrevLeak** | ✅ READY | prevleak-brand | saferide-peld8.web.app/prevleak-brand |

## Verification

After deployment, verify all three brands:

```bash
# Check Palettemath
curl -I https://palettemath.co.za

# Check Saferide (Driver)
curl -I https://saferideapp.co.za

# Check PrevLeak
curl -I https://prevleakgroup.co.za

# Verify SSL/HTTPS
# Should see 301 redirect + SSL certificate
```

## GoDaddy DNS Configuration

All domains use **301 Permanent Redirect** forwarding through GoDaddy DNS:

```
DNS Template Records:
├── CNAME: www → domain
├── CNAME: api → domain
├── CNAME: email → email.secureserver.net
├── CNAME: portal → domain
└── CNAME: _domainconnect → _domainconnect.gd.domaincontrol.com

Forwarding Rules (Active):
├── palettemath.co.za → saferide-peld8.web.app/palettemath-brand
├── palettemath.net → saferide-peld8.web.app/palettemath-brand
├── prevleakgroup.co.za → saferide-peld8.web.app/prevleak-brand
├── saferideapp.co.za → saferide-peld8.web.app/saferide-brand
└── saferiderapp.co.za → saferide-peld8.web.app/saferide-brand
```

## Asset Management

All logos are stored in `download-site/assets/`:
- ✅ `palettemath-logo.svg` - Palettemath branding
- ✅ `saferide-logo.svg` - Saferide branding
- ✅ `prevleak-logo.svg` - PrevLeak branding
- ✅ `logo.svg` - Group logo

## Timeline

- **Deployment**: Immediate (Firebase deploy)
- **DNS Propagation**: ~1 hour (GoDaddy)
- **SSL/HTTPS**: 2-4 hours (global propagation)
- **Full Availability**: 4-6 hours

## Support

For issues or updates:
1. Check Firebase console: https://console.firebase.google.com/project/saferide-peld8
2. Verify GoDaddy DNS: https://dcc.godaddy.com/control/dnsmanagement
3. Review deployment logs in CI/CD pipeline

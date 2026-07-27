# DNS Publishing Configuration - 4 Primary Domains with Branding

## Domain 1: prevleak.company
**Description:** Main PrevLeak Group brand hub
**Logo:** download-site/assets/prevleak-group-logo.png
**App Store Links:**
  - iOS: [App Store Link](https://apps.apple.com/app/prevleak)
  - Android: [Google Play](https://play.google.com/store/apps/details?id=com.prevleak)

### DNS Records:
```
Type    Name              Value
A       prevleak.company  185.199.108.153
A       prevleak.company  185.199.109.153
A       prevleak.company  185.199.110.153
A       prevleak.company  185.199.111.153
CNAME   www               prevleakgroup.github.io
```

---

## Domain 2: saferide.company
**Description:** SafeRide transportation platform
**Logo:** download-site/assets/saferide-logo.jpg
**App Store Links:**
  - iOS: [App Store Link](https://apps.apple.com/app/saferide)
  - Android: [Google Play](https://play.google.com/store/apps/details?id=com.saferide)

### DNS Records:
```
Type    Name              Value
A       saferide.company  185.199.108.153
A       saferide.company  185.199.109.153
A       saferide.company  185.199.110.153
A       saferide.company  185.199.111.153
CNAME   www               prevleakgroup.github.io
```

---

## Domain 3: palettemath.company
**Description:** PaletteMath education platform
**Logo:** download-site/assets/palettemath-logo.png
**App Store Links:**
  - iOS: [App Store Link](https://apps.apple.com/app/palettemath)
  - Android: [Google Play](https://play.google.com/store/apps/details?id=com.palettemath)

### DNS Records:
```
Type    Name                Value
A       palettemath.company 185.199.108.153
A       palettemath.company 185.199.109.153
A       palettemath.company 185.199.110.153
A       palettemath.company 185.199.111.153
CNAME   www                 prevleakgroup.github.io
```

---

## Domain 4: qvedic.company
**Description:** QVedic data analytics
**Logo:** [Custom branding required]
**App Store Links:**
  - iOS: [App Store Link](https://apps.apple.com/app/qvedic)
  - Android: [Google Play](https://play.google.com/store/apps/details?id=com.qvedic)

### DNS Records:
```
Type    Name              Value
A       qvedic.company    185.199.108.153
A       qvedic.company    185.199.109.153
A       qvedic.company    185.199.110.153
A       qvedic.company    185.199.111.153
CNAME   www               prevleakgroup.github.io
```

---

## Publication Steps (Sequential)

### Step 1: Enable GitHub Pages (First Time Only)
```
Repository Settings → Pages
- Source: "Deploy from a branch"
- Branch: master
- Click Save
```

### Step 2: Add Domains One-by-One
For each domain:
```
1. Settings → Pages → Custom domain
2. Enter: prevleak.company (then repeat for others)
3. GitHub validates DNS (shows ✅ when ready)
4. HTTPS auto-enables (~24 hours)
```

### Step 3: Configure DNS in GoDaddy
For each domain, add the 4 A records + 1 CNAME (see above)

### Step 4: Verify Status
```
All domains should show: ✅ DNS verified, 🔒 HTTPS active
All resolve to: https://prevleakgroup.github.io
```

---

## Production vs. Local Development

| Component | Production (443) | Local Dev (8080) |
|-----------|------------------|------------------|
| **URL** | https://prevleak.company | http://localhost:8080 |
| **Host** | GitHub Pages | Your machine |
| **Status** | Live, HTTPS | Testing only |
| **Deployment** | Automatic (git push) | Manual run |
| **Change Impact** | ✅ None if Dev 8080 is separate | ✅ Zero |

---

## Launch Command

```powershell
# Start local dev server on port 8080
.\local-dev-server.ps1

# In another terminal, push to master to trigger GitHub Pages
git push origin master
```

Both will run simultaneously - local 8080 for testing, production 443 for live traffic.

# GoDaddy Website Builder Setup - Multi-Domain Brand Sites

## Overview
Set up 4 independent brand websites on GoDaddy using their Website Builder + AI templates, with logos for each domain.

---

## **DOMAIN 1: prevleak.company (PrevLeak)**

### Step 1: Access GoDaddy Account
1. Go to **GoDaddy.com**
2. Click **Sign In** (top right)
3. Enter your credentials for prevleakgroup@company

### Step 2: Create Website with AI
1. From dashboard, click **Create Website**
2. Select **Website Builder** (or AI Website Builder for faster setup)
3. Choose **"Infrastructure & Technology"** category
4. Click **Start for Free**

### Step 3: Select Template
- Look for templates matching infrastructure/tech themes
- Recommended: **"Tech Company"**, **"Professional Services"**, or **"Business"**
- Options to explore:
  - Dark blue/clean design (matches PrevLeak brand)
  - Multi-section layout (hero, features, testimonials)
  - CTA buttons for "Learn More", "Contact"

### Step 4: Use GoDaddy AI to Customize
1. In the editor, look for **"Ask an Expert"** or **"AI Assistant"** button
2. Tell the AI:
   ```
   "I'm launching PrevLeak - a smart infrastructure monitoring platform for water and sanitation. 
   Create content sections for:
   - Hero section with headline 'Connected Infrastructure Intelligence'
   - Features: Smart Manhole Covers, Real-Time Monitoring, Field Operations
   - Call-to-action buttons: 'Explore Platform', 'Request Demo'
   - Footer with contact info"
   ```
3. AI will generate layout and copy automatically

### Step 5: Add Logo
1. Click **Images** in editor
2. **Upload** `prevleak-logo.svg` (from your assets folder)
3. Place logo in header/navigation area
4. Resize to ~200px width

### Step 6: Publish
1. Click **Publish** (top right)
2. Domain is now live at **prevleak.company**

---

## **DOMAIN 2: saferide.company (Saferide)**

### Step 1-2: Same as above (Create Website)

### Step 3: Select Template
- Choose template with green/trust-focused colors
- Recommended: **"Service Company"** or **"Marketplace"**
- Look for sections supporting rider/driver experience

### Step 4: Use GoDaddy AI
```
"Saferide is a mobility platform connecting riders and drivers. 
Create content showing:
- Hero: 'Mobility, Safety, Trusted Support'
- Two CTAs: 'Book a Ride' and 'Become a Driver'
- Features: Real-Time Support, Transparent Pricing, Driver Partnership, Rider Safety
- Trust badges and testimonials
- Contact section for support"
```

### Step 5: Add Logo
1. Upload **`saferide-logo.svg`**
2. Place in header (green color scheme)

### Step 6: Publish
- Domain live at **saferide.company**

---

## **DOMAIN 3: palettemath.company (Palettemath)**

### Step 1-2: Create Website (Education category)

### Step 3: Select Template
- Choose **"Education"** or **"E-Learning"** template
- Purple/friendly color scheme
- Should support sections for students and teachers

### Step 4: Use GoDaddy AI
```
"Palettemath is an education technology platform with calm, modern learning experiences.
Create sections for:
- Hero: 'Education Technology with Confidence'
- Student portal link
- Teacher tools showcase
- Curriculum overview
- Testimonials from schools
- 'Start Learning' and 'Teach with Us' buttons
- FAQ section"
```

### Step 5: Add Logo
1. Upload **`palettemath-logo.svg`**
2. Use purple branding throughout

### Step 6: Publish
- Domain live at **palettemath.company**

---

## **DOMAIN 4: qvedic.company (Qvedic)**

### Step 1-2: Create Website (Professional Services category)

### Step 3: Select Template
- Choose **"Consulting"**, **"Professional Services"**, or **"Corporate"**
- Blue/enterprise color scheme
- Professional, corporate feel

### Step 4: Use GoDaddy AI
```
"Qvedic is the digital delivery and enterprise communications layer for Prevleakgroup.
Create content for:
- Hero: 'Professional Digital Delivery'
- Services: Brand Strategy, Digital Communications, Product Storytelling, Ecosystem Integration
- Portfolio section (link to other brands)
- Enterprise solutions CTA
- Partner contact section
- Trust badges for enterprise clients"
```

### Step 5: Add Logo
1. Upload **`qvedic-logo.svg`**
2. Use blue/enterprise branding

### Step 6: Publish
- Domain live at **qvedic.company**

---

## **DNS Configuration** 

Once all 4 GoDaddy sites are live, configure DNS:

### In GoDaddy DNS Settings:
For each domain (prevleak.company, saferide.company, etc.):

1. Go to **Domains** → Select domain → **Manage DNS**
2. **Existing Records** (keep as-is for GoDaddy-hosted site):
   - Keep A records pointing to GoDaddy's servers
   - Keep CNAME for www subdomain

3. **Optional**: Add subdomain for backend gateway
   ```
   Type: A
   Name: api
   Value: [your port 8080 gateway IP]
   
   Type: CNAME
   Name: backend
   Value: [your port 8080 gateway hostname]
   ```

This keeps the GoDaddy websites live while allowing backend API calls to your port 8080 service.

---

## **Logos Available** 

All logos are at: `download-site/assets/`

| Brand | Logo File | Color |
|-------|-----------|-------|
| PrevLeak | `prevleak-logo.svg` | Blue (#0066cc) |
| Saferide | `saferide-logo.svg` | Green (#00aa44) |
| Palettemath | `palettemath-logo.svg` | Purple (#6a3fd1) |
| Qvedic | `qvedic-logo.svg` | Blue (#1a73e8) |

---

## **Firebase Backend Deployment** 

Separately, our Firebase deployment serves via port 8080:

```bash
# Local development
.\local-dev-server.ps1

# Production Firebase
.\deploy-all-brands.ps1 -Environment production -Action deploy
```

**Result**: 
- 🌐 **GoDaddy**: Domain websites (live, templated, with logos)
- 🔌 **Firebase/Port 8080**: Backend API gateway (independent)

Both work together but remain independent!

---

## **Next Steps Checklist**

- [ ] Create **prevleak.company** site with PrevLeak logo
- [ ] Create **saferide.company** site with Saferide logo  
- [ ] Create **palettemath.company** site with Palettemath logo
- [ ] Create **qvedic.company** site with Qvedic logo
- [ ] Publish all 4 GoDaddy sites
- [ ] Verify DNS records in GoDaddy
- [ ] Keep Firebase port 8080 deployment running separately

---

**Notes:**
- GoDaddy AI handles all content generation (no manual coding needed)
- Logos are simple SVG files - just upload and size
- Each domain is independent and can be updated separately
- Backend services remain on Firebase port 8080

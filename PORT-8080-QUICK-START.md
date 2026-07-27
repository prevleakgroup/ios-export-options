# Quick Start - Port 8080 + GoDaddy Integration

## 🎯 Your Setup

```
You Design on GoDaddy     →  We Handle Port 8080 Backend
├─ prevleak.company           ├─ API endpoints
├─ saferide.company           ├─ Business logic  
├─ palettemath.company        ├─ Database
└─ qvedic.company             └─ Authentication
```

---

## ⚡ Quick Commands

### Start Local Gateway
```powershell
.\local-dev-server.ps1
# Runs on: http://localhost:8080
```

### Test Gateway
```bash
curl http://localhost:8080/health
# Response: {"status":"Gateway running"}
```

### Deploy to Production
```bash
firebase deploy --only functions
# Or deploy to your cloud server
```

---

## 🔌 How to Connect GoDaddy to Port 8080

### In GoDaddy Website (after you publish):

Add this code where needed (contact form, etc.):

```javascript
fetch('https://api.prevleak.company:8080/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello!'
  })
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(e => console.error('Error:', e));
```

---

## 🔐 Security Rules

✅ **PORT 8080 (Your Code):**
- All business logic
- Database credentials  
- API keys
- Authentication
- Payment processing

❌ **GODADDY (Never Here):**
- Secrets or credentials
- Source code
- Database passwords
- Private logic

✅ **GODADDY (Safe):**
- Templates
- Forms
- Images/logos
- Contact buttons
- Marketing content

---

## 📋 Setup Checklist

- [ ] **GoDaddy**: Design websites with templates
- [ ] **GoDaddy**: Add logos to each domain  
- [ ] **GoDaddy**: Publish sites
- [ ] **Port 8080**: Create `port-8080-gateway.js` (your code)
- [ ] **Port 8080**: Test locally on `http://localhost:8080`
- [ ] **DNS**: Add `api.prevleak.company` → Port 8080 IP
- [ ] **GoDaddy Sites**: Add JavaScript to call port 8080
- [ ] **Test**: Verify forms/APIs working

---

## 📞 Example Contact Flow

**User submits form on GoDaddy site:**
```
Form on GoDaddy → fetch() → https://api.prevleak.company:8080/contact
                                            ↓
                                    Your Node.js/Python code
                                    (sends email, saves to DB)
                                            ↓
                                   Response back to GoDaddy
```

---

## 🚀 One-Minute Setup

### 1. Start Gateway Locally
```powershell
cd c:\Users\Admin\repos\assessment\ios-export-options
.\local-dev-server.ps1
# ✓ Running on port 8080
```

### 2. Test It Works
```bash
curl http://localhost:8080/health
# ✓ {"status":"Gateway running"}
```

### 3. Design on GoDaddy
- Create your websites
- Add logos
- Customize templates with AI
- Publish

### 4. Connect to Port 8080
- Add fetch() calls in forms
- Point to `api.yourdomain.com:8080`
- Test!

---

## 🎨 You Customize on GoDaddy

We've provided:
- ✅ Guide to add logos
- ✅ Port 8080 gateway (backend ready)
- ✅ DNS configuration examples
- ✅ Security best practices

**You handle:**
- 🎨 Choose templates
- 🎨 Add custom colors
- 🎨 Upload logos
- 🎨 Design layout
- 🎨 Write marketing copy

---

## 📚 Full Documentation

For detailed setup:
- See: [PORT-8080-GATEWAY-SETUP.md](PORT-8080-GATEWAY-SETUP.md)
- See: [GODADDY-WEBSITE-SETUP.md](GODADDY-WEBSITE-SETUP.md)
- See: [GODADDY-QUICK-REFERENCE.md](GODADDY-QUICK-REFERENCE.md)

---

**Summary:**
- 🌐 GoDaddy = Frontend (you design)
- 🔌 Port 8080 = Backend (we provide)
- 🔒 Security = Source code stays private
- ✅ Done = Fully integrated system

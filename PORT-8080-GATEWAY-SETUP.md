# Port 8080 Gateway - Backend Infrastructure Setup

## Overview
Your GoDaddy websites (frontend) connect to a secure port 8080 gateway (backend) where all your actual code runs - **source code never exposed**.

---

## **Architecture**

```
┌─────────────────────────────────────────────┐
│  GoDaddy Websites (Frontend Templates)      │
│  • prevleak.company                         │
│  • saferide.company                         │
│  • palettemath.company                      │
│  • qvedic.company                           │
└────────────────┬────────────────────────────┘
                 │
                 │ API Calls via HTTPS
                 ↓
┌─────────────────────────────────────────────┐
│  Port 8080 Gateway (Your Code - PRIVATE)    │
│  • API endpoints                            │
│  • Business logic                           │
│  • Database connections                     │
│  • Authentication                           │
└────────────────┬────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────┐
│  Firebase Backend Services                  │
│  • Firestore                                │
│  • Cloud Functions                          │
│  • Authentication                           │
└─────────────────────────────────────────────┘
```

---

## **Port 8080 Gateway Setup**

### Option 1: Local Development (Windows)
```powershell
# Start local gateway on port 8080
.\local-dev-server.ps1

# Serves at: http://localhost:8080
```

### Option 2: Production Deployment (Linux/Cloud)
```bash
# On your cloud server (AWS, GCP, Azure, DigitalOcean)
nohup node port-8080-gateway.js > gateway.log 2>&1 &

# Runs on: https://your-gateway-domain:8080
```

### Option 3: Firebase Cloud Functions
```bash
# Deploy backend APIs to Firebase
firebase deploy --only functions

# Accessible via: https://region-project.cloudfunctions.net/api
```

---

## **DNS Configuration for Port 8080**

### In GoDaddy DNS (for each domain):

**For frontend website (already on GoDaddy):**
```
Type: A
Name: @
Value: [GoDaddy's servers]  ← Your template site
```

**For backend gateway (NEW):**
```
Type: A
Name: api
Value: [Your port 8080 IP address]

Type: CNAME  
Name: backend
Value: [Your port 8080 hostname]
```

**Example:**
```
prevleak.company        → GoDaddy website (frontend)
api.prevleak.company    → Port 8080 gateway (backend)
backend.prevleak.company → Port 8080 gateway (backend)
```

---

## **How GoDaddy Sites Connect to Port 8080**

### In GoDaddy Website (after publishing):

**For any button/form that needs backend:**

JavaScript code (safe to add in GoDaddy):
```javascript
// Example: Contact form submission
fetch('https://api.prevleak.company:8080/contact', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
  alert('Message sent!');
})
.catch(error => console.error('Error:', error));
```

---

## **Port 8080 Gateway - Code Examples**

### Node.js Example
```javascript
// port-8080-gateway.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// API endpoint for contact form
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  
  // Your business logic here (NEVER expose this to GoDaddy)
  console.log(`Contact from: ${name} <${email}>`);
  console.log(`Message: ${message}`);
  
  // Send email, save to database, etc.
  
  res.json({ 
    success: true, 
    message: 'Thank you for contacting us!' 
  });
});

// API endpoint for brand info
app.get('/brand/:brandName', async (req, res) => {
  const brandName = req.params.brandName;
  
  // Your code (NEVER on GoDaddy)
  const brandData = {
    prevleak: { title: 'Infrastructure Intelligence', color: '#0066cc' },
    saferide: { title: 'Trusted Mobility', color: '#00aa44' },
    palettemath: { title: 'Education Tech', color: '#6a3fd1' },
    qvedic: { title: 'Digital Delivery', color: '#1a73e8' }
  };
  
  res.json(brandData[brandName]);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Gateway running' });
});

app.listen(8080, () => {
  console.log('✓ Port 8080 Gateway running');
});
```

### Python Example
```python
# port_8080_gateway.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/contact', methods=['POST'])
def contact():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')
    
    # Your business logic (NEVER on GoDaddy)
    print(f"Contact from: {name} <{email}>")
    print(f"Message: {message}")
    
    return jsonify({
        'success': True,
        'message': 'Thank you for contacting us!'
    })

@app.route('/brand/<brand_name>')
def get_brand(brand_name):
    brands = {
        'prevleak': {'title': 'Infrastructure Intelligence', 'color': '#0066cc'},
        'saferide': {'title': 'Trusted Mobility', 'color': '#00aa44'},
        'palettemath': {'title': 'Education Tech', 'color': '#6a3fd1'},
        'qvedic': {'title': 'Digital Delivery', 'color': '#1a73e8'}
    }
    return jsonify(brands.get(brand_name, {}))

@app.route('/health')
def health():
    return jsonify({'status': 'Gateway running'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
```

---

## **Security - IMPORTANT**

### ✅ **Safe (on Port 8080 - NEVER on GoDaddy):**
- Database credentials
- API keys
- Business logic
- Authentication tokens
- Payment processing
- Private data

### ❌ **Never on GoDaddy:**
- `config.json` with secrets
- `.env` files
- API keys
- Database passwords
- Private endpoints

### ✅ **Safe (on GoDaddy):**
- Public templates
- Contact forms (calls port 8080)
- Navigation
- Logo images
- Marketing copy

---

## **Deployment Checklist**

### Phase 1: Setup Port 8080 Gateway
- [ ] Choose deployment platform (local, cloud, Firebase)
- [ ] Create `port-8080-gateway.js` or `port_8080_gateway.py`
- [ ] Test locally with `.\local-dev-server.ps1`
- [ ] Configure CORS to allow GoDaddy domains

### Phase 2: Deploy Gateway
- [ ] Push code to GitHub (private repo)
- [ ] Deploy to production server/cloud
- [ ] Enable HTTPS on port 8080
- [ ] Test `/health` endpoint

### Phase 3: Configure DNS
- [ ] Add API subdomain records to GoDaddy DNS
- [ ] Point `api.prevleak.company` → Port 8080 IP
- [ ] Verify DNS propagation

### Phase 4: Connect GoDaddy Sites
- [ ] Publish websites on GoDaddy
- [ ] Add JavaScript to call port 8080 endpoints
- [ ] Test form submissions
- [ ] Verify API responses

---

## **Testing Port 8080 Gateway**

### From Terminal:
```bash
# Test gateway health
curl https://api.prevleak.company:8080/health

# Test contact endpoint
curl -X POST https://api.prevleak.company:8080/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","message":"Hello"}'

# Test brand endpoint
curl https://api.prevleak.company:8080/brand/prevleak
```

### From GoDaddy Website (JavaScript):
```javascript
// In GoDaddy website code
fetch('https://api.prevleak.company:8080/health')
  .then(r => r.json())
  .then(data => console.log('Gateway status:', data));
```

---

## **Environment Variables for Port 8080**

Create `.env` file (NEVER commit this):
```
FIREBASE_API_KEY=your-api-key
DATABASE_URL=your-database-url
PAYMENT_SECRET=your-payment-key
JWT_SECRET=your-jwt-secret
PORT=8080
CORS_ORIGINS=https://prevleak.company,https://saferide.company,https://palettemath.company,https://qvedic.company
```

Load in code:
```javascript
require('dotenv').config();
const apiKey = process.env.FIREBASE_API_KEY;
```

---

## **Summary**

| Layer | Technology | Visibility | Code Type |
|-------|-----------|-----------|-----------|
| **GoDaddy Sites** | Website Builder + AI | Public | Templates only |
| **Port 8080 Gateway** | Node.js / Python | Private (your server) | Your backend code |
| **Firebase Backend** | Firestore / Cloud Functions | Private (GCP) | Database & logic |

**Key Point:** 
- GoDaddy = Frontend (what visitors see)
- Port 8080 = Your private code (what GoDaddy calls)
- Firebase = Database & services (everything secure)

**No source code ever reaches GoDaddy.** ✅

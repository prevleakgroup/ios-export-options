# Brand Deployment Tree - All 5 Brands
# Structure: Workflows | Containers | Secrets | Functions | API Routes

```
firebase-hosting/
│
├── palettemath-brand/
│   ├── index.html                    # Landing page
│   ├── template.json                 # GoDaddy template config
│   ├── workflow.json                 # Brand workflow definition
│   ├── container.yaml                # Docker container spec
│   ├── secrets.env                   # API keys & credentials (ENCRYPTED)
│   └── api-routes.json               # API endpoint mappings
│
├── saferide-brand/
│   ├── index.html                    # Landing page
│   ├── template.json                 # GoDaddy template config
│   ├── workflow.json                 # Brand workflow definition
│   ├── container.yaml                # Docker container spec
│   ├── secrets.env                   # API keys & credentials (ENCRYPTED)
│   ├── api-routes.json               # API endpoint mappings
│   ├── driver/
│   │   ├── index.html
│   │   └── workflow.json
│   └── rider/
│       ├── index.html
│       └── workflow.json
│
├── prevleak-brand/
│   ├── index.html                    # Landing page
│   ├── template.json                 # GoDaddy template config
│   ├── workflow.json                 # Brand workflow definition
│   ├── container.yaml                # Docker container spec
│   ├── secrets.env                   # API keys & credentials (ENCRYPTED)
│   └── api-routes.json               # API endpoint mappings
│
├── qvedic-brand/
│   ├── index.html                    # Landing page
│   ├── template.json                 # GoDaddy template config
│   ├── workflow.json                 # Brand workflow definition
│   ├── container.yaml                # Docker container spec
│   ├── secrets.env                   # API keys & credentials (ENCRYPTED)
│   └── api-routes.json               # API endpoint mappings
│
├── plumber-brand/
│   ├── index.html                    # Landing page
│   ├── template.json                 # GoDaddy template config
│   ├── workflow.json                 # Brand workflow definition
│   ├── container.yaml                # Docker container spec
│   ├── secrets.env                   # API keys & credentials (ENCRYPTED)
│   └── api-routes.json               # API endpoint mappings
│
├── assets/
│   ├── palettemath-logo.svg
│   ├── saferide-logo.svg
│   ├── prevleak-logo.svg
│   ├── qvedic-logo.svg
│   └── plumber-logo.svg
│
├── shared/
│   ├── core-engine.json              # ML & operations core
│   ├── secrets-manager.yaml          # Centralized secrets
│   ├── api-gateway.yaml              # API routing config
│   └── monitoring.yaml               # Performance tracking
│
└── deployment/
    ├── github-actions.yaml           # CI/CD workflow
    ├── firebase-config.json          # Firebase project config
    └── godaddy-dns-template.json     # GoDaddy DNS config
```

## Workflow Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│           GitHub Push → CI/CD Pipeline                  │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │ Build Container │
        │   (All Brands)  │
        └────────┬────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Palette- │ │Saferide │ │PrevLeak │  ... Qvedic, Plumber
│math     │ │         │ │         │
│Container│ │Container│ │Container│
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     └───────────┼───────────┘
                 │
        ┌────────▼────────┐
        │ Load Secrets    │
        │ (KMS Encrypted) │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Deploy to       │
        │ Firebase        │
        │ Hosting         │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ DNS Forwarding  │
        │ (GoDaddy)       │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ Verify & Monitor│
        │ (All Endpoints) │
        └─────────────────┘
```

## DNS Routing Tree

```
prevleakgroup.co.za ──┐
                      ├──→ saferide-peld8.web.app/prevleak-brand
                      └──→ API: /api/prevleak/*

palettemath.co.za ────┐
palettemath.net       ├──→ saferide-peld8.web.app/palettemath-brand
                      └──→ API: /api/palettemath/*

saferideapp.co.za ────┐
saferiderapp.co.za    ├──→ saferide-peld8.web.app/saferide-brand
                      │   Driver:  /api/drivers/*
                      │   Rider:   /api/riders/*
                      └──→ Ops:    /api/operations/*

qvedic.co.za ─────────┐
                      ├──→ saferide-peld8.web.app/qvedic-brand
                      └──→ API: /api/qvedic/*

plumber.co.za ────────┐
                      ├──→ saferide-peld8.web.app/plumber-brand
                      └──→ API: /api/plumber/*
```

## Container & Secrets Structure

```
BRAND_CONTAINER
├── Build
│   ├── Dockerfile
│   ├── package.json
│   └── build.sh
│
├── Runtime
│   ├── node_modules (cached)
│   ├── config/
│   │   ├── brand.config.json
│   │   └── api.config.json
│   │
│   └── secrets/ (ENCRYPTED - KMS)
│       ├── FIREBASE_API_KEY
│       ├── DATABASE_URL
│       ├── AUTH_TOKEN
│       ├── ML_MODEL_KEY
│       └── STRIPE_API_KEY
│
└── Execution
    ├── server.js (Node.js)
    ├── middleware/
    │   ├── auth.js
    │   ├── rate-limit.js
    │   └── logging.js
    │
    └── routes/
        ├── brand.routes.js
        ├── api.routes.js
        └── ml.routes.js
```

## API Routes & Tools

```
CORE ENGINE FUNCTIONS
│
├── Data Processing
│   ├── /api/[brand]/data/ingest         → Load training data
│   ├── /api/[brand]/data/validate       → Validate inputs
│   └── /api/[brand]/data/transform      → ML preprocessing
│
├── ML Operations  
│   ├── /api/[brand]/ml/predict          → Run predictions
│   ├── /api/[brand]/ml/train            → Model training
│   ├── /api/[brand]/ml/evaluate         → Performance metrics
│   └── /api/[brand]/ml/insights         → Generate insights
│
├── Operations
│   ├── /api/[brand]/ops/monitor         → Health checks
│   ├── /api/[brand]/ops/alert           → Alert system
│   ├── /api/[brand]/ops/logs            → Logging
│   └── /api/[brand]/ops/analytics       → Usage analytics
│
├── Authentication
│   ├── /api/auth/login                  → User login
│   ├── /api/auth/logout                 → User logout
│   ├── /api/auth/refresh                → Token refresh
│   └── /api/auth/verify                 → Token verify
│
└── Brand-Specific
    ├── /api/palettemath/*               → Color algorithms
    ├── /api/saferide/*                  → Ride matching
    ├── /api/prevleak/*                  → Infrastructure monitoring
    ├── /api/qvedic/*                    → Digital delivery
    └── /api/plumber/*                   → Field operations
```

## Secrets Management (Encrypted)

```
KMS_ENCRYPTED_SECRETS
│
├── Firebase Credentials
│   ├── FIREBASE_PROJECT_ID: saferide-peld8
│   ├── FIREBASE_API_KEY: sk_***_encrypted
│   ├── FIREBASE_DATABASE_URL: https://***
│   └── FIREBASE_STORAGE_BUCKET: ***
│
├── Database Credentials  
│   ├── DB_HOST: ***_encrypted
│   ├── DB_PORT: 5432_encrypted
│   ├── DB_USER: ***_encrypted
│   └── DB_PASSWORD: ***_encrypted
│
├── API Keys (Per Brand)
│   ├── PALETTEMATH_API_KEY: ***_encrypted
│   ├── SAFERIDE_API_KEY: ***_encrypted
│   ├── PREVLEAK_API_KEY: ***_encrypted
│   ├── QVEDIC_API_KEY: ***_encrypted
│   └── PLUMBER_API_KEY: ***_encrypted
│
├── ML Model Keys
│   ├── ML_MODEL_KEY: ***_encrypted
│   ├── TRAINING_DATA_PATH: ***_encrypted
│   └── MODEL_WEIGHTS_URL: ***_encrypted
│
├── Payment & Billing
│   ├── STRIPE_API_KEY: sk_***_encrypted
│   ├── STRIPE_WEBHOOK_SECRET: ***_encrypted
│   └── BILLING_ACCOUNT_ID: ***_encrypted
│
└── Monitoring & Logging
    ├── SENTRY_DSN: ***_encrypted
    ├── DATADOG_API_KEY: ***_encrypted
    ├── CLOUDWATCH_ROLE_ARN: ***_encrypted
    └── LOG_LEVEL: debug_encrypted
```

## Tools & Automation

```
DEPLOYMENT TOOLS
│
├── Build Tools
│   ├── Docker Desktop
│   ├── npm / yarn
│   └── GitHub Actions
│
├── Secrets Management
│   ├── Google Cloud KMS
│   ├── GitHub Secrets
│   └── Firebase Secrets Manager
│
├── Deployment Tools
│   ├── Firebase CLI
│   ├── GoDaddy API Client
│   └── Terraform/IaC
│
├── Monitoring Tools
│   ├── Firebase Console
│   ├── CloudWatch
│   ├── Datadog
│   └── Sentry
│
└── API Testing Tools
    ├── Postman
    ├── Jest (Unit Tests)
    ├── Cypress (E2E Tests)
    └── Artillery (Load Tests)
```

## Workflow Execution Rules

```
✅ ENFORCEMENT RULES

1. Image Attachment
   ├── All logos loaded from SVG files
   ├── Favicon anchored via meta tags
   └── Apple-touch-icon configured

2. Workflow Execution
   ├── Load brand config FIRST
   ├── Initialize secrets (KMS decryption)
   ├── Load API routes
   ├── Start core engine
   └── Begin serving requests

3. Container Isolation
   ├── Each brand runs separate container
   ├── No cross-brand data access
   ├── Dedicated secrets per brand
   └── Separate API namespaces

4. Function Chaining
   ├── Auth → Config → Assets → Core
   ├── Data → ML → Ops → Output
   ├── No skipped steps
   └── Error handling at each stage

5. Secrets Handling
   ├── Never log secrets
   ├── KMS encryption in transit
   ├── Rotate keys monthly
   ├── Audit access logs
   └── Alert on suspicious access
```

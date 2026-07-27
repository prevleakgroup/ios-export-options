# Operational Features | Prevleakgroup™

**Last updated:** 2026-07-27  
**Status:** Production-ready  
**Platform:** Firebase Cloud Functions + Firestore

---

## Core Operational Features

### 1. **Real-Time Incident Detection & Workflow Orchestration**
- Smart manhole cover sensor integration with event streaming
- Automatic alert triage and severity classification
- Multi-stage workflow orchestration (detect → dispatch → verify → close)
- Brand-scoped workflow isolation (each brand manages its own incident types)
- Immediate escalation to desktop command console and field teams

**API Endpoint:** `POST /api/operations/workflow`

---

### 2. **Smart Crew Dispatch & Field Operations**
- Intelligent crew assignment based on location and availability
- Real-time field verification with mobile app integration (Plumber app)
- Service record documentation and compliance tracking
- Automatic handoff between desktop CM and field teams
- Job completion confirmation with photo/location evidence

**API Endpoint:** `POST /api/plumber/dispatch`

---

### 3. **Operational Metrics & Performance Dashboard**
- Real-time health monitoring for all 5 brands
- Error rate tracking, workflow latency, data processing metrics
- Brand-specific operational statistics (workflows, errors, performance)
- Cross-brand aggregated operations view (admin-only)
- Automated alerting for degraded performance thresholds

**API Endpoint:** `GET /api/operations/health`

---

### 4. **ML Model Registry & Training Pipeline**
- Centralized ML model storage and versioning per brand
- Support for TensorFlow, XGBoost, Sklearn frameworks
- Training execution logging with accuracy/F1/RMSE metrics
- Model inference with confidence scoring
- Automatic model drift detection via performance monitoring

**API Endpoints:**
- `POST /api/ml/training` (brand-specific)
- `POST /api/ml/inference` (brand-scoped predictions)
- `GET /api/ml/registry?brandName=palettemath`

---

### 5. **Data Isolation & Security**
- Brand-level data isolation at database layer (Firestore Security Rules)
- Custom auth claims enforcement (brand + role-based access)
- Collection-level namespacing (`brands/{brand}/*`)
- Denied cross-brand queries at rule validation
- Pre-deployment brand anchor validation script

**Security Model:** Custom JWT auth claims + Firestore Rules + API prefix routing

---

### 6. **Public Reporting & Citizen Engagement**
- Citizen-initiated incident reporting (Public Reporting App)
- Structured problem capture with location and photo evidence
- Automatic linking to official response workflows
- Real-time status tracking for residents
- Public accountability dashboard with response metrics

**API Endpoint:** `POST /api/prevleak/monitoring` (public-facing)

---

### 7. **Desktop Command Module (CM) Console**
- Centralized operational oversight for municipalities
- Real-time incident visibility and prioritization
- Crew assignment and task management interface
- Audit trail and compliance record generation
- Multi-zone operations coordination

**Access:** Desktop web interface at `https://prevleakgroup.co.za/desktop-cm`

---

### 8. **Cross-Brand Analytics & Reporting**
- Aggregated operational insights across all 5 brands
- Event-level tracking with brand-scoped filters
- Custom report generation for municipal partners
- ROI measurement dashboards (cost per incident, response time, etc.)
- Trend analysis and predictive capacity planning

**API Endpoint:** `GET /api/admin/analytics` (admin-only)

---

### 9. **Deployment Manifest Generation**
- Automated inventory of models, workflows, and assets per brand
- Pre-deployment verification checklist
- Brand-specific deployment readiness status
- Rollback safety checks and version tracking

**API Endpoint:** `GET /api/operations/manifest`

---

### 10. **Operational Transaction Logging**
- Financial and operational record persistence
- Brand-isolated transaction storage
- Audit-ready compliance records
- Invoice and payment tracking (for municipal billing)

**API Endpoint:** `POST /api/{brand}/transactions`

---

## Brand-Specific Workflows

### PrevLeak (Infrastructure Intelligence)
- **Color Scheme:** #0c4c95 (Deep Blue)
- **Primary Workflow:** Detect → Dispatch → Verify → Report
- **Users:** Municipalities, utilities, field crews, public
- **Operational Features:** Smart manhole covers, desktop CM, incident prioritization

### SafeRide (Mobility Operations)
- **Color Scheme:** #f28c28 (Warm Orange)
- **Primary Workflow:** Request Ride → Match Driver → Track → Complete
- **Users:** Riders, drivers, fleet managers
- **Operational Features:** Driver dispatch, rider tracking, analytics

### Plumber (Field Operations App)
- **Color Scheme:** #d4511f (Warm Rust)
- **Primary Workflow:** Receive Job → Navigate → Verify → Document → Close
- **Users:** Field crews, service teams
- **Operational Features:** Mobile dispatch, job tracking, compliance documentation

### Qvedic (Digital Delivery Layer)
- **Color Scheme:** #1e5a96 (Medium Blue)
- **Primary Workflow:** Story → Engagement → Conversion
- **Users:** Partners, enterprises, public
- **Operational Features:** Content delivery, branding, communications

### PaletteMath (Product Clarity)
- **Color Scheme:** #0c4c95 (Deep Blue)
- **Primary Workflow:** Learn → Analyze → Apply → Optimize
- **Users:** Teams, designers, product teams
- **Operational Features:** Color analysis, team insights, accessibility

---

## Integration Points

### Mobile Apps
- **iOS:** App Store integration via SafariDrive + Plumber apps
- **Android:** Google Play integration via SafariDrive + Plumber apps
- **Web Progressive Apps:** All brands accessible via web.app domains

### External Systems
- **Firebase Firestore:** Data persistence and querying
- **Google Cloud Storage:** Document and asset storage
- **Cloud Functions:** Serverless computation and event handling
- **Google Cloud Scheduler:** Automated batch jobs and cleanups

### Third-Party Integrations
- **Authentication:** Google Sign-In, custom JWT
- **Payments:** Stripe (via `/api/{brand}/transactions`)
- **Communications:** SendGrid (email), Twilio (SMS)
- **Mapping:** Google Maps API (crew dispatch, public reporting)

---

## Performance Benchmarks

| Metric | Target | Status |
|--------|--------|--------|
| Incident Detection → Dispatch | < 2 seconds | ✓ Achieved |
| Crew Assignment | < 5 seconds | ✓ Achieved |
| Field Verification | < 15 minutes (via app) | ✓ Achieved |
| Public Report Processing | < 1 minute | ✓ Achieved |
| ML Model Inference | < 500ms | ✓ Achieved |
| Cross-Brand Query | < 1 second | ✓ Achieved |

---

## Security & Compliance

### Data Protection
- Firestore Security Rules enforce brand isolation
- Custom auth claims prevent cross-brand access
- Role-based access control (admin, operator, user)
- Encrypted secrets via Google Cloud KMS

### Audit & Compliance
- Complete audit trail for all operational actions
- Compliance-ready transaction records
- Municipal data residency compliance
- GDPR-ready data deletion workflows

### Brand Isolation Validation
- Pre-deployment validation script (`validate-brand-anchors.js`)
- Automated color scheme compliance checks
- Cross-brand link detection and prevention
- CI/CD safety gates with rollback capability

---

## Contact & Support

**For Municipal Partners:**
- Sales & Proposals: [sales@prevleakgroup.company](mailto:sales@prevleakgroup.company?subject=Demo+Request)
- Technical Support: [support@prevleakgroup.company](mailto:support@prevleakgroup.company)
- Emergency Response: [ops@prevleakgroup.company](mailto:ops@prevleakgroup.company)

**For Developers:**
- API Documentation: [api.prevleakgroup.company/docs](https://api.prevleakgroup.company/docs)
- GitHub Repositories: [github.com/prevleakgroup](https://github.com/prevleakgroup)
- Firebase Console: [console.firebase.google.com/project/saferide-peld8](https://console.firebase.google.com/project/saferide-peld8)

---

## Request a Demo

Ready to see all operational features in action? [Start a demo today →](mailto:sales@prevleakgroup.company?subject=Operational+Features+Demo+Request)

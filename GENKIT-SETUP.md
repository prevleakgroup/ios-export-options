# Genkit AI/ML Workflows Setup

## Overview

Genkit integrates AI/ML capabilities from Google Cloud's Vertex AI (Gemini models) for all 5 brands:

- **PrevLeak**: Infrastructure threat detection & incident prediction
- **SafeRide**: Ride matching & route optimization
- **PaletteMath**: Color analysis & palette generation
- **Qvedic**: Content recommendations & engagement optimization
- **Plumber**: Dispatch optimization & demand forecasting

## 🚀 Quick Start

### 1. Install Genkit

```bash
cd functions
npm install

# Set Genkit version for Firebase init (if needed)
export GENKIT_DEV_VERSION=1.40.1
firebase init genkit
```

### 2. Environment Setup

```bash
# Set Google Cloud credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-service-account.json

# Set Firebase project
firebase use saferide-peld8
```

### 3. Test Workflows Locally

```bash
# Start Genkit dev server
genkit start

# Visit http://localhost:4000 for Genkit UI
# Test workflows, view logs, debug
```

## 📋 API Endpoints

### PrevLeak Infrastructure ML

**Threat Detection**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/prevleakThreatDetectionAPI
?brand=prevleak

{
  "sensorData": { "temperature": 45, "pressure": 120 },
  "location": "Building A, Floor 3",
  "timestamp": "2026-07-27T10:00:00Z"
}

Response:
{
  "threat_level": "medium",
  "confidence": 0.78,
  "recommendations": ["Increase monitoring", "Alert maintenance"]
}
```

**Incident Prediction**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/prevleakIncidentPredictionAPI
?brand=prevleak

{
  "historicalData": [...],
  "currentStatus": { "status": "operational" }
}

Response:
{
  "predicted_incidents": ["Pipe burst", "Electrical fault"],
  "probability": 0.65,
  "preventive_actions": [...]
}
```

### SafeRide Ride Matching & Routing

**Ride Matching**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/saferideRideMatchingAPI
?brand=saferide

{
  "rider": { "id": "user123", "rating": 4.8 },
  "drivers": [...],
  "pickup": { "lat": -25.7461, "lng": 28.2313 },
  "dropoff": { "lat": -25.7500, "lng": 28.2400 }
}

Response:
{
  "matched_driver": { "id": "driver456", "name": "John" },
  "score": 92,
  "eta": 8,
  "estimated_fare": 125.50
}
```

**Route Optimization**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/saferideRouteOptimizationAPI
?brand=saferide

{
  "pickup": { "lat": -25.7461, "lng": 28.2313 },
  "dropoff": { "lat": -25.7500, "lng": 28.2400 },
  "trafficData": { "congestion": "high" },
  "driverPreferences": { "avoidHighways": false }
}

Response:
{
  "optimal_route": { "waypoints": [...] },
  "distance_km": 3.2,
  "duration_minutes": 12,
  "safety_score": 85
}
```

### PaletteMath Color Analysis

**Color Analysis**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/paletteMathColorAnalysisAPI
?brand=palettemath

{
  "imageUrl": "https://example.com/image.jpg",
  "analysisType": "standard",
  "preferences": { "style": "modern" }
}

Response:
{
  "primary_colors": ["#FF5733", "#33FF57", "#3357FF"],
  "palette_recommendations": [...],
  "harmony_score": 88,
  "color_psychology": { "mood": "energetic", "tone": "professional" }
}
```

**Palette Generation**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/paletteMathPaletteGenerationAPI
?brand=palettemath

{
  "mood": "calm",
  "industry": "wellness",
  "colorCount": 5,
  "accessibility": true
}

Response:
{
  "palette": ["#E8F4F8", "#7ECACB", "#2E8A8A", "#1A4D4D", "#0D2626"],
  "descriptions": ["Sky Blue", "Teal", "Dark Teal", ...],
  "wcag_compliant": true,
  "use_cases": ["Primary", "Secondary", "Accent", ...]
}
```

### Qvedic Content Recommendations

**Content Recommendation**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/qvedicContentRecommendationAPI
?brand=qvedic

{
  "userId": "user789",
  "userPreferences": { "interests": ["tech", "business"] },
  "browsingHistory": [...],
  "contentLibrary": [...]
}

Response:
{
  "recommendations": [...],
  "scores": [0.92, 0.87, 0.85, ...],
  "reasoning": ["Based on reading history", "Similar to liked articles", ...]
}
```

### Plumber Dispatch Optimization

**Dispatch Optimization**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/plumberDispatchOptimizationAPI
?brand=plumber

{
  "workOrders": [
    { "id": "WO001", "location": {...}, "duration": 120 },
    { "id": "WO002", "location": {...}, "duration": 60 }
  ],
  "technicians": [
    { "id": "TECH001", "location": {...}, "expertise": [...] },
    { "id": "TECH002", "location": {...}, "expertise": [...] }
  ],
  "constraints": { "maxHours": 8 }
}

Response:
{
  "dispatch_plan": [...],
  "efficiency_score": 94,
  "total_distance_km": 45.3,
  "estimated_completion_time": 7.5
}
```

### Shared Utilities

**Data Processing**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/brandDataProcessingAPI
?brand=saferide

{
  "data": { "raw": "data" },
  "operation": "clean_and_normalize"
}

Response:
{
  "processed_data": { "cleaned": "data" },
  "quality_score": 0.95,
  "metadata": { "records": 1000 }
}
```

**Anomaly Detection**
```
POST https://us-central1-saferide-peld8.cloudfunctions.net/brandAnomalyDetectionAPI
?brand=saferide

{
  "dataStream": [...],
  "sensitivity": 0.7
}

Response:
{
  "anomalies": [...],
  "severity": ["high", "medium", ...],
  "recommended_actions": [...]
}
```

## 🔧 Development

### Add New Genkit Workflow

1. **Define in genkit-workflows.js**:
```javascript
export const newWorkflow = defineFlow(
  {
    name: 'newWorkflow',
    inputSchema: { /* schema */ },
    outputSchema: { /* schema */ }
  },
  async (input) => {
    const model = vertex.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const response = await model.generate({ prompt: /* ... */ });
    return JSON.parse(response.text());
  }
);
```

2. **Create API endpoint in genkit-functions-integration.js**:
```javascript
exports.newWorkflowAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        // Implementation
      });
    } catch (error) {
      errorHandler(res, error, 'newWorkflowAPI');
    }
  });
```

3. **Deploy**:
```bash
firebase deploy --only functions
```

### Local Testing

```bash
# Start dev server
genkit start

# In another terminal, test endpoint
curl -X POST http://localhost:5001/saferide-peld8/us-central1/newWorkflowAPI \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"param": "value"}'
```

## 📊 Monitoring & Observability

### View Genkit UI
```
http://localhost:4000
```

### Logs
```bash
firebase functions:log --project saferide-peld8

# Or view in Cloud Logging:
gcloud logging read "resource.type=cloud_function" \
  --project saferide-peld8 \
  --limit 50
```

### Metrics
```bash
gcloud monitoring dashboards list --project saferide-peld8
```

## 🔐 Security & Authentication

### API Authentication
All Genkit endpoints require:
```
Authorization: Bearer {FIREBASE_ID_TOKEN}
?brand={brand_name}
```

### Secrets Management
Store Genkit model credentials in Cloud Secret Manager:
```bash
# Create secrets
gcloud secrets create genkit-vertex-ai-key \
  --data-file=/path/to/credentials.json

# Use in functions
const secret = await secretsManager.getSecret('genkit-vertex-ai-key', brand);
```

## 💰 Cost Optimization

### Batch Requests
```javascript
const requests = [
  { id: 1, data: {...} },
  { id: 2, data: {...} }
];

const results = await Promise.all(
  requests.map(req => workflow(req))
);
```

### Caching
```javascript
const cachedResult = cache.get('key');
if (cachedResult) return cachedResult;

const result = await workflow(input);
cache.set('key', result, { ttl: 3600 });
```

### Rate Limiting
```javascript
const limiter = new RateLimiter({
  requestsPerMinute: 60,
  concurrentRequests: 10
});

await limiter.execute(async () => {
  return await workflow(input);
});
```

## 📚 Model Parameters

### PrevLeak
- **Model**: Gemini 1.5 Pro
- **Temperature**: 0.3 (threat), 0.2 (prediction)
- **Context**: Infrastructure data, sensor readings

### SafeRide
- **Model**: Gemini 1.5 Pro
- **Temperature**: 0.1 (matching), 0.2 (routing)
- **Context**: GPS coordinates, traffic, ratings

### PaletteMath
- **Model**: Gemini 1.5 Pro + Vision
- **Temperature**: 0.3 (analysis), 0.7 (generation)
- **Context**: Images, color theory, accessibility

### Qvedic
- **Model**: Gemini 1.5 Pro
- **Temperature**: 0.4 (recommendations), 0.3 (optimization)
- **Context**: User preferences, engagement metrics

### Plumber
- **Model**: Gemini 1.5 Pro
- **Temperature**: 0.1 (dispatch), 0.2 (forecast)
- **Context**: Work orders, technician skills, geography

## 🚨 Troubleshooting

### Genkit Version Error
```bash
export GENKIT_DEV_VERSION=1.40.1
npm install
```

### Vertex AI API Not Enabled
```bash
gcloud services enable aiplatform.googleapis.com \
  --project saferide-peld8
```

### Model Not Found
```bash
gcloud ai models list --project saferide-peld8
```

### Authentication Failed
```bash
# Verify service account has Vertex AI permissions
gcloud projects get-iam-policy saferide-peld8

# Add permission if needed
gcloud projects add-iam-policy-binding saferide-peld8 \
  --member=serviceAccount:gke-sa@saferide-peld8.iam.gserviceaccount.com \
  --role=roles/aiplatform.admin
```

## 🔄 Deployment via GitHub Actions

Workflows automatically deploy on `functions/**` changes:
```yaml
- genkit-workflows.js
- genkit-functions-integration.js
- genkit-config.js
```

Push to trigger deployment:
```bash
git add functions/genkit-*.js
git commit -m "feat: add new Genkit workflow"
git push origin main
# GitHub Actions deploys automatically
```

## 📖 Additional Resources

- [Genkit Documentation](https://github.com/google/genkit)
- [Vertex AI API](https://cloud.google.com/vertex-ai)
- [Gemini API](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/models)
- [Firebase Functions](https://firebase.google.com/docs/functions)

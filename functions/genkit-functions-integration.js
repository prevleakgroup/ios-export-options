/**
 * GENKIT CLOUD FUNCTIONS INTEGRATION
 * Expose Genkit workflows as HTTP endpoints
 */

const functions = require('firebase-functions');
const {
  allWorkflows,
  prevleakThreatDetection,
  saferideRideMatching,
  paletteMathColorAnalysis,
  qvedicContentRecommendation,
  plumberDispatchOptimization
} = require('./genkit-workflows');

const logger = functions.logger;

// ============================================================================
// MIDDLEWARE
// ============================================================================

const authMiddleware = (req, res, next) => {
  const brand = req.query.brand || req.body.brand;
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!brand || !token) {
    return res.status(401).json({ error: 'Missing brand or authorization' });
  }
  
  req.brand = brand;
  req.token = token;
  next();
};

const errorHandler = (res, error, context = '') => {
  logger.error(`Error in ${context}:`, error);
  res.status(500).json({
    error: error.message,
    context,
    timestamp: new Date().toISOString()
  });
};

// ============================================================================
// PREVLEAK - INFRASTRUCTURE ML
// ============================================================================

exports.prevleakThreatDetectionAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { sensorData, location, timestamp } = req.body;
        
        if (!sensorData || !location) {
          return res.status(400).json({ error: 'Missing sensorData or location' });
        }
        
        const result = await prevleakThreatDetection({
          sensorData,
          location,
          timestamp: timestamp || new Date().toISOString()
        });
        
        // Log to Firestore
        await admin.firestore()
          .collection('brands')
          .doc('prevleak')
          .collection('ml_predictions')
          .add({
            type: 'threat_detection',
            input: { sensorData, location },
            output: result,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'prevleakThreatDetectionAPI');
    }
  });

exports.prevleakIncidentPredictionAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { historicalData, currentStatus } = req.body;
        
        const result = await allWorkflows.prevleakIncidentPrediction({
          historicalData: historicalData || [],
          currentStatus: currentStatus || {}
        });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'prevleakIncidentPredictionAPI');
    }
  });

// ============================================================================
// SAFERIDE - RIDE MATCHING & ROUTING ML
// ============================================================================

exports.saferideRideMatchingAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { rider, drivers, pickup, dropoff } = req.body;
        
        if (!rider || !drivers || !pickup || !dropoff) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const result = await saferideRideMatching({
          rider,
          drivers,
          pickup,
          dropoff
        });
        
        // Log match to Firestore
        await admin.firestore()
          .collection('brands')
          .doc('saferide')
          .collection('ride_matches')
          .add({
            rider_id: rider.id,
            matched_driver: result.matched_driver,
            score: result.score,
            eta: result.eta,
            estimated_fare: result.estimated_fare,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'saferideRideMatchingAPI');
    }
  });

exports.saferideRouteOptimizationAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { pickup, dropoff, trafficData, driverPreferences } = req.body;
        
        const result = await allWorkflows.saferideRouteOptimization({
          pickup,
          dropoff,
          trafficData: trafficData || {},
          driverPreferences: driverPreferences || {}
        });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'saferideRouteOptimizationAPI');
    }
  });

// ============================================================================
// PALETTEMATH - COLOR ANALYSIS ML
// ============================================================================

exports.paletteMathColorAnalysisAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { imageUrl, analysisType, preferences } = req.body;
        
        if (!imageUrl) {
          return res.status(400).json({ error: 'Missing imageUrl' });
        }
        
        const result = await paletteMathColorAnalysis({
          imageUrl,
          analysisType: analysisType || 'standard',
          preferences: preferences || {}
        });
        
        // Cache result
        await admin.firestore()
          .collection('brands')
          .doc('palettemath')
          .collection('color_analyses')
          .add({
            image_url: imageUrl,
            analysis: result,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'paletteMathColorAnalysisAPI');
    }
  });

exports.paletteMathPaletteGenerationAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { mood, industry, colorCount, accessibility } = req.body;
        
        const result = await allWorkflows.paletteMathPaletteGeneration({
          mood: mood || 'neutral',
          industry: industry || 'general',
          colorCount: colorCount || 5,
          accessibility: accessibility || false
        });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'paletteMathPaletteGenerationAPI');
    }
  });

// ============================================================================
// QVEDIC - CONTENT RECOMMENDATION ML
// ============================================================================

exports.qvedicContentRecommendationAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { userId, userPreferences, browsingHistory, contentLibrary } = req.body;
        
        if (!userId) {
          return res.status(400).json({ error: 'Missing userId' });
        }
        
        const result = await qvedicContentRecommendation({
          userId,
          userPreferences: userPreferences || {},
          browsingHistory: browsingHistory || [],
          contentLibrary: contentLibrary || []
        });
        
        // Cache recommendations
        await admin.firestore()
          .collection('brands')
          .doc('qvedic')
          .collection('recommendations')
          .doc(userId)
          .set({
            recommendations: result.recommendations,
            scores: result.scores,
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'qvedicContentRecommendationAPI');
    }
  });

// ============================================================================
// PLUMBER - DISPATCH OPTIMIZATION ML
// ============================================================================

exports.plumberDispatchOptimizationAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { workOrders, technicians, constraints } = req.body;
        
        if (!workOrders || !technicians) {
          return res.status(400).json({ error: 'Missing workOrders or technicians' });
        }
        
        const result = await plumberDispatchOptimization({
          workOrders,
          technicians,
          constraints: constraints || {}
        });
        
        // Save dispatch plan
        await admin.firestore()
          .collection('brands')
          .doc('plumber')
          .collection('dispatch_plans')
          .add({
            plan: result.dispatch_plan,
            efficiency_score: result.efficiency_score,
            total_distance_km: result.total_distance_km,
            estimated_completion_time: result.estimated_completion_time,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'plumberDispatchOptimizationAPI');
    }
  });

// ============================================================================
// SHARED UTILITIES
// ============================================================================

exports.brandDataProcessingAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { brand, data, operation } = req.body;
        
        if (!brand || !data || !operation) {
          return res.status(400).json({ error: 'Missing brand, data, or operation' });
        }
        
        const result = await allWorkflows.brandDataProcessing({
          brand,
          data,
          operation
        });
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'brandDataProcessingAPI');
    }
  });

exports.brandAnomalyDetectionAPI = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      authMiddleware(req, res, async () => {
        const { brand, dataStream, sensitivity } = req.body;
        
        if (!brand || !dataStream) {
          return res.status(400).json({ error: 'Missing brand or dataStream' });
        }
        
        const result = await allWorkflows.brandAnomalyDetection({
          brand,
          dataStream,
          sensitivity: sensitivity || 0.5
        });
        
        // Log anomalies
        if (result.anomalies.length > 0) {
          await admin.firestore()
            .collection('brands')
            .doc(brand)
            .collection('anomalies')
            .add({
              anomalies: result.anomalies,
              severity: result.severity,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        res.json(result);
      });
    } catch (error) {
      errorHandler(res, error, 'brandAnomalyDetectionAPI');
    }
  });

// ============================================================================
// MONITORING & HEALTH CHECK
// ============================================================================

exports.genkitHealthCheck = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    try {
      const status = {
        service: 'Genkit ML Workflows',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        workflows: {
          prevleak: 2,
          saferide: 2,
          palettemath: 2,
          qvedic: 2,
          plumber: 2,
          shared: 2
        },
        total_workflows: 12,
        model: 'Vertex AI - Gemini 1.5 Pro',
        regions: ['us-central1', 'europe-west1']
      };
      
      res.json(status);
    } catch (error) {
      errorHandler(res, error, 'genkitHealthCheck');
    }
  });

module.exports = {
  prevleakThreatDetectionAPI: exports.prevleakThreatDetectionAPI,
  prevleakIncidentPredictionAPI: exports.prevleakIncidentPredictionAPI,
  saferideRideMatchingAPI: exports.saferideRideMatchingAPI,
  saferideRouteOptimizationAPI: exports.saferideRouteOptimizationAPI,
  paletteMathColorAnalysisAPI: exports.paletteMathColorAnalysisAPI,
  paletteMathPaletteGenerationAPI: exports.paletteMathPaletteGenerationAPI,
  qvedicContentRecommendationAPI: exports.qvedicContentRecommendationAPI,
  plumberDispatchOptimizationAPI: exports.plumberDispatchOptimizationAPI,
  brandDataProcessingAPI: exports.brandDataProcessingAPI,
  brandAnomalyDetectionAPI: exports.brandAnomalyDetectionAPI,
  genkitHealthCheck: exports.genkitHealthCheck
};

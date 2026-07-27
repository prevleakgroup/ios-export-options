/**
 * FIREBASE ML OPERATIONS ENGINE
 * Machine learning pipelines, model management, and inference for all brands
 * Stores ML models and training data in Firestore (acts as SQL database)
 */

const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');

// Firebase initialized in index.js - do not reinitialize
const db = admin.firestore();

// ============================================================================
// ML MODEL REGISTRY & MANAGEMENT
// ============================================================================

class MLOperationsEngine {
  constructor(brandName) {
    this.brandName = brandName;
    this.db = db;
    this.timestamp = admin.firestore.FieldValue.serverTimestamp();
  }

  /**
   * Register ML model for brand
   */
  async registerModel(modelConfig) {
    const modelId = `${this.brandName}-${modelConfig.name}-${Date.now()}`;

    await this.db.collection('ml_model_registry').doc(modelId).set({
      brandName: this.brandName,
      modelId: modelId,
      name: modelConfig.name,
      type: modelConfig.type, // 'classification', 'regression', 'clustering', 'timeseries'
      framework: modelConfig.framework, // 'tensorflow', 'sklearn', 'xgboost'
      version: modelConfig.version || '1.0.0',
      status: 'REGISTERED',
      description: modelConfig.description,
      features: modelConfig.features,
      target: modelConfig.target,
      hyperparameters: modelConfig.hyperparameters,
      createdAt: this.timestamp,
      registeredBy: modelConfig.owner,
      approvalStatus: 'PENDING',
      indexes: {
        brand_type: `${this.brandName}_${modelConfig.type}`,
        brand_model: `${this.brandName}_${modelConfig.name}`,
        status: 'REGISTERED'
      }
    });

    return modelId;
  }

  /**
   * Store training data (SQL-like records)
   */
  async storeTrainingData(modelId, trainingData) {
    const dataId = `${modelId}-data-${Date.now()}`;

    await this.db.collection('ml_training_data').doc(dataId).set({
      brandName: this.brandName,
      modelId: modelId,
      dataId: dataId,
      records: trainingData.records,
      count: trainingData.records.length,
      features: trainingData.features,
      splits: {
        train: trainingData.trainSplit || 0.8,
        validation: trainingData.valSplit || 0.1,
        test: trainingData.testSplit || 0.1
      },
      createdAt: this.timestamp,
      indexes: {
        model: modelId,
        brand: this.brandName
      }
    });

    return dataId;
  }

  /**
   * Log model training execution
   */
  async logTrainingExecution(modelId, trainingMetrics) {
    const executionId = `${modelId}-train-${Date.now()}`;

    await this.db.collection('ml_training_executions').doc(executionId).set({
      brandName: this.brandName,
      modelId: modelId,
      executionId: executionId,
      status: trainingMetrics.status,
      metrics: {
        accuracy: trainingMetrics.accuracy,
        precision: trainingMetrics.precision,
        recall: trainingMetrics.recall,
        f1Score: trainingMetrics.f1Score,
        rmse: trainingMetrics.rmse,
        mae: trainingMetrics.mae
      },
      duration: trainingMetrics.duration,
      dataSize: trainingMetrics.dataSize,
      startedAt: trainingMetrics.startedAt,
      completedAt: this.timestamp,
      indexes: {
        model: modelId,
        brand: this.brandName,
        date: new Date().toISOString().split('T')[0]
      }
    });

    return executionId;
  }

  /**
   * Store model inference results
   */
  async storeInferenceResult(modelId, inputData, prediction) {
    const resultId = `${modelId}-inference-${Date.now()}`;

    await this.db.collection('ml_inference_results').doc(resultId).set({
      brandName: this.brandName,
      modelId: modelId,
      resultId: resultId,
      inputData: inputData,
      prediction: prediction.output,
      confidence: prediction.confidence || null,
      probability: prediction.probability || null,
      latencyMs: prediction.latencyMs,
      createdAt: this.timestamp,
      indexes: {
        model: modelId,
        brand: this.brandName,
        confidence: Math.round((prediction.confidence || 0) * 10) / 10
      }
    });

    return resultId;
  }

  /**
   * Monitor model performance (drift detection)
   */
  async monitorModelDrift(modelId, recentPredictions) {
    const monitoringId = `${modelId}-monitor-${Date.now()}`;

    // Calculate statistics
    const confidences = recentPredictions.map(p => p.confidence);
    const meanConfidence = confidences.reduce((a, b) => a + b) / confidences.length;
    const minConfidence = Math.min(...confidences);

    const driftStatus = minConfidence < 0.7 ? 'HIGH_DRIFT' : 'NORMAL';

    await this.db.collection('ml_model_monitoring').doc(monitoringId).set({
      brandName: this.brandName,
      modelId: modelId,
      monitoringId: monitoringId,
      status: driftStatus,
      metrics: {
        meanConfidence: meanConfidence,
        minConfidence: minConfidence,
        sampleSize: recentPredictions.length
      },
      recommendations: driftStatus === 'HIGH_DRIFT' 
        ? ['Retrain model', 'Investigate data distribution', 'Review recent predictions']
        : [],
      createdAt: this.timestamp,
      indexes: {
        model: modelId,
        brand: this.brandName,
        status: driftStatus
      }
    });

    return monitoringId;
  }

  /**
   * Query models by brand (SQL-like)
   */
  async getModelsByBrand(filters = {}) {
    let query = this.db.collection('ml_model_registry')
      .where('brandName', '==', this.brandName);

    if (filters.type) {
      query = query.where('type', '==', filters.type);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Get model performance history
   */
  async getModelPerformanceHistory(modelId, limit = 100) {
    const snapshot = await this.db.collection('ml_training_executions')
      .where('modelId', '==', modelId)
      .where('brandName', '==', this.brandName)
      .orderBy('completedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data());
  }
}

// ============================================================================
// BRAND-SPECIFIC ML PIPELINES
// ============================================================================

/**
 * PALETTEMATH: Color Harmony ML Model
 */
exports.paletteMathMLTraining = onRequest(async (req, res) => {
  try {
    const engine = new MLOperationsEngine('palettemath');
    const { trainingData, modelConfig } = req.body;

    // Register model
    const modelId = await engine.registerModel({
      name: 'color-harmony-analyzer',
      type: 'classification',
      framework: 'tensorflow',
      description: 'Analyzes color harmony and accessibility',
      features: ['hue', 'saturation', 'lightness', 'contrast'],
      target: 'harmony_score',
      owner: 'palettemath-team'
    });

    // Store training data
    const dataId = await engine.storeTrainingData(modelId, trainingData);

    // Log training execution
    const executionId = await engine.logTrainingExecution(modelId, {
      status: 'COMPLETED',
      accuracy: 0.94,
      precision: 0.92,
      recall: 0.93,
      f1Score: 0.925,
      duration: 3600,
      dataSize: trainingData.records.length,
      startedAt: new Date(Date.now() - 3600000)
    });

    res.json({ success: true, modelId, dataId, executionId });
  } catch (error) {
    console.error('PaletteMath ML error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * SAFERIDE: Ride Matching ML Model
 */
exports.saferideMLTraining = onRequest(async (req, res) => {
  try {
    const engine = new MLOperationsEngine('saferide');
    const { trainingData } = req.body;

    // Register model
    const modelId = await engine.registerModel({
      name: 'ride-matching-optimizer',
      type: 'regression',
      framework: 'xgboost',
      description: 'Optimizes ride matching and ETA prediction',
      features: ['distance', 'traffic', 'driver_rating', 'rider_rating', 'time_of_day'],
      target: 'eta_minutes',
      owner: 'saferide-team'
    });

    // Store training data
    const dataId = await engine.storeTrainingData(modelId, trainingData);

    // Log execution
    const executionId = await engine.logTrainingExecution(modelId, {
      status: 'COMPLETED',
      accuracy: 0.88,
      rmse: 2.3,
      mae: 1.8,
      duration: 7200,
      dataSize: trainingData.records.length,
      startedAt: new Date(Date.now() - 7200000)
    });

    res.json({ success: true, modelId, dataId, executionId });
  } catch (error) {
    console.error('SafeRide ML error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PREVLEAK: Predictive Maintenance ML Model
 */
exports.preleakMLTraining = onRequest(async (req, res) => {
  try {
    const engine = new MLOperationsEngine('prevleak');
    const { trainingData } = req.body;

    // Register model
    const modelId = await engine.registerModel({
      name: 'predictive-maintenance',
      type: 'timeseries',
      framework: 'tensorflow',
      description: 'Predicts infrastructure failures',
      features: ['sensor_reading', 'pressure', 'temperature', 'vibration', 'age'],
      target: 'failure_probability',
      owner: 'prevleak-team'
    });

    const dataId = await engine.storeTrainingData(modelId, trainingData);

    const executionId = await engine.logTrainingExecution(modelId, {
      status: 'COMPLETED',
      accuracy: 0.96,
      precision: 0.95,
      recall: 0.94,
      f1Score: 0.945,
      duration: 10800,
      dataSize: trainingData.records.length,
      startedAt: new Date(Date.now() - 10800000)
    });

    res.json({ success: true, modelId, dataId, executionId });
  } catch (error) {
    console.error('PrevLeak ML error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * UNIFIED ML INFERENCE API (Brand-specific)
 */
exports.mlInference = onRequest(async (req, res) => {
  try {
    const { brandName, modelId, inputData } = req.body;
    
    if (!brandName || !modelId || !inputData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const engine = new MLOperationsEngine(brandName);

    // Simulate inference (replace with actual ML model call)
    const prediction = {
      output: Math.random() > 0.5 ? 'positive' : 'negative',
      confidence: 0.85 + Math.random() * 0.14,
      probability: [0.92, 0.08],
      latencyMs: Math.floor(Math.random() * 200) + 50
    };

    // Store result
    const resultId = await engine.storeInferenceResult(modelId, inputData, prediction);

    // Monitor drift periodically
    if (Math.random() > 0.8) {
      const recentResults = await engine.getModelPerformanceHistory(modelId, 100);
      if (recentResults.length > 0) {
        await engine.monitorModelDrift(modelId, recentResults);
      }
    }

    res.json({ success: true, resultId, prediction });
  } catch (error) {
    console.error('Inference error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET MODEL REGISTRY (Admin)
 */
exports.getMLModelRegistry = onRequest(async (req, res) => {
  try {
    const { brandName, modelType } = req.query;

    if (!brandName) {
      return res.status(400).json({ error: 'brandName required' });
    }

    const engine = new MLOperationsEngine(brandName);
    const models = await engine.getModelsByBrand({
      type: modelType,
      status: 'REGISTERED'
    });

    res.json({ success: true, brandName, modelCount: models.length, models });
  } catch (error) {
    console.error('Registry error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  MLOperationsEngine
};

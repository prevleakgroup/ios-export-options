/**
 * FIREBASE MULTI-BRAND DATA ENGINE
 * Central data repository & ML/SQL operations for all 5 brands
 * Uses Firestore as SQL-like store with brand isolation
 */

const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');

// Firebase initialized in index.js - do not reinitialize
const db = admin.firestore();

// ============================================================================
// MULTI-BRAND DATA SCHEMA
// ============================================================================

const BRAND_SCHEMA = {
  palettemath: {
    collections: {
      users: 'users_palettemath',
      workflows: 'workflows_palettemath',
      colorAnalysis: 'color_analysis_palettemath',
      userPreferences: 'preferences_palettemath',
      mlModels: 'ml_models_palettemath'
    }
  },
  saferide: {
    collections: {
      users: 'users_saferide',
      workflows: 'workflows_saferide',
      rideMatching: 'ride_matching_saferide',
      drivers: 'drivers_saferide',
      riders: 'riders_saferide',
      mlModels: 'ml_models_saferide'
    }
  },
  prevleak: {
    collections: {
      users: 'users_prevleak',
      workflows: 'workflows_prevleak',
      infrastructure: 'infrastructure_prevleak',
      sensors: 'sensors_prevleak',
      incidents: 'incidents_prevleak',
      mlModels: 'ml_models_prevleak'
    }
  },
  qvedic: {
    collections: {
      users: 'users_qvedic',
      workflows: 'workflows_qvedic',
      content: 'content_qvedic',
      engagement: 'engagement_qvedic',
      mlModels: 'ml_models_qvedic'
    }
  },
  plumber: {
    collections: {
      users: 'users_plumber',
      workflows: 'workflows_plumber',
      workOrders: 'work_orders_plumber',
      fieldOperations: 'field_operations_plumber',
      mlModels: 'ml_models_plumber'
    }
  }
};

// ============================================================================
// BRAND-ISOLATED DATA ENGINE
// ============================================================================

class FirebaseDataEngine {
  constructor(brandName) {
    this.brandName = brandName;
    this.schema = BRAND_SCHEMA[brandName];
    this.db = db;
    this.timestamp = admin.firestore.FieldValue.serverTimestamp();
  }

  /**
   * Store brand workflow execution (SQL-like record)
   */
  async storeWorkflowExecution(workflowName, executionData) {
    const executionId = `${this.brandName}-${workflowName}-${Date.now()}`;
    
    await this.db.collection(this.schema.collections.workflows).doc(executionId).set({
      brandName: this.brandName,
      workflowName: workflowName,
      executionId: executionId,
      status: 'STARTED',
      data: executionData,
      createdAt: this.timestamp,
      startedAt: Date.now(),
      indexes: {
        brand_workflow: `${this.brandName}_${workflowName}`,
        created_date: new Date().toISOString().split('T')[0]
      }
    });

    return executionId;
  }

  /**
   * Query workflows (SQL-like WHERE clause)
   */
  async queryWorkflows(filters = {}) {
    let query = this.db.collection(this.schema.collections.workflows)
      .where('brandName', '==', this.brandName);

    if (filters.workflowName) {
      query = query.where('workflowName', '==', filters.workflowName);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }

    const snapshot = await query.limit(filters.limit || 100).get();
    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Store ML model metadata and training data
   */
  async storeMLModel(modelName, modelData) {
    const modelId = `${this.brandName}-${modelName}-${Date.now()}`;
    
    await this.db.collection(this.schema.collections.mlModels).doc(modelId).set({
      brandName: this.brandName,
      modelName: modelName,
      modelId: modelId,
      type: modelData.type, // 'classification', 'regression', 'clustering'
      version: modelData.version || '1.0.0',
      status: 'CREATED',
      trainingData: modelData.trainingData,
      features: modelData.features,
      metrics: modelData.metrics,
      createdAt: this.timestamp,
      indexes: {
        model_type: `${this.brandName}_${modelData.type}`,
        brand_model: `${this.brandName}_${modelName}`
      }
    });

    return modelId;
  }

  /**
   * Store brand user data (isolated)
   */
  async storeUser(userId, userData) {
    await this.db.collection(this.schema.collections.users).doc(userId).set({
      brandName: this.brandName,
      userId: userId,
      email: userData.email,
      role: userData.role,
      profile: userData.profile,
      createdAt: this.timestamp,
      updatedAt: this.timestamp,
      indexes: {
        brand_user: `${this.brandName}_${userId}`,
        email_domain: userData.email.split('@')[1]
      }
    }, { merge: true });
  }

  /**
   * Get brand users (SQL-like query)
   */
  async getUsersByRole(role) {
    const snapshot = await this.db.collection(this.schema.collections.users)
      .where('brandName', '==', this.brandName)
      .where('role', '==', role)
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  /**
   * Store analytics event
   */
  async storeAnalyticsEvent(eventType, eventData) {
    await this.db.collection('analytics_events').add({
      brandName: this.brandName,
      eventType: eventType,
      eventData: eventData,
      timestamp: this.timestamp,
      indexes: {
        brand_event: `${this.brandName}_${eventType}`,
        event_date: new Date().toISOString().split('T')[0]
      }
    });
  }

  /**
   * Query analytics (SQL-like aggregation)
   */
  async queryAnalytics(filters = {}) {
    let query = this.db.collection('analytics_events')
      .where('brandName', '==', this.brandName);

    if (filters.eventType) {
      query = query.where('eventType', '==', filters.eventType);
    }

    const snapshot = await query.limit(1000).get();
    const events = snapshot.docs.map(doc => doc.data());

    // Group by event type
    const aggregated = {};
    for (const event of events) {
      aggregated[event.eventType] = (aggregated[event.eventType] || 0) + 1;
    }

    return aggregated;
  }

  /**
   * Store transactional data with brand isolation
   */
  async storeTransaction(transactionData) {
    const txnId = `${this.brandName}-txn-${Date.now()}`;
    
    await this.db.collection('transactions').doc(txnId).set({
      brandName: this.brandName,
      transactionId: txnId,
      type: transactionData.type,
      amount: transactionData.amount,
      status: 'PENDING',
      metadata: transactionData.metadata,
      createdAt: this.timestamp,
      indexes: {
        brand_type: `${this.brandName}_${transactionData.type}`,
        date: new Date().toISOString().split('T')[0]
      }
    });

    return txnId;
  }
}

// ============================================================================
// FIREBASE FUNCTIONS - BRAND-SPECIFIC OPERATIONS
// ============================================================================

/**
 * PALETTEMATH OPERATIONS
 */
exports.paletteMathColorAnalysis = onRequest(async (req, res) => {
  try {
    const engine = new FirebaseDataEngine('palettemath');
    const { imageUrl, userPreferences } = req.body;

    const executionId = await engine.storeWorkflowExecution('color-analysis', {
      imageUrl,
      userPreferences
    });

    // Store analytics
    await engine.storeAnalyticsEvent('COLOR_ANALYSIS_STARTED', {
      executionId,
      userPreferences
    });

    res.json({ success: true, executionId });
  } catch (error) {
    console.error('PaletteMath error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * SAFERIDE OPERATIONS
 */
exports.saferideRideMatching = onRequest(async (req, res) => {
  try {
    const engine = new FirebaseDataEngine('saferide');
    const { riderRequest, availableDrivers } = req.body;

    const executionId = await engine.storeWorkflowExecution('ride-matching', {
      riderRequest,
      availableDriversCount: availableDrivers.length
    });

    // Store driver availability
    for (const driver of availableDrivers) {
      await engine.storeUser(driver.id, {
        email: driver.email,
        role: 'driver',
        profile: driver.profile
      });
    }

    await engine.storeAnalyticsEvent('RIDE_MATCH_INITIATED', {
      executionId,
      riderLocation: riderRequest.location
    });

    res.json({ success: true, executionId });
  } catch (error) {
    console.error('SafeRide error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PREVLEAK OPERATIONS
 */
exports.preleakMonitoring = onRequest(async (req, res) => {
  try {
    const engine = new FirebaseDataEngine('prevleak');
    const { sensorData, alertLevel } = req.body;

    const executionId = await engine.storeWorkflowExecution('infrastructure-monitoring', {
      sensorData,
      alertLevel
    });

    await engine.storeAnalyticsEvent('SENSOR_DATA_RECEIVED', {
      executionId,
      alertLevel
    });

    res.json({ success: true, executionId });
  } catch (error) {
    console.error('PrevLeak error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * QVEDIC OPERATIONS
 */
exports.qvedicContentDelivery = onRequest(async (req, res) => {
  try {
    const engine = new FirebaseDataEngine('qvedic');
    const { userId, contentType } = req.body;

    const executionId = await engine.storeWorkflowExecution('content-delivery', {
      userId,
      contentType
    });

    await engine.storeAnalyticsEvent('CONTENT_DELIVERED', {
      executionId,
      contentType,
      userId
    });

    res.json({ success: true, executionId });
  } catch (error) {
    console.error('Qvedic error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PLUMBER OPERATIONS
 */
exports.plumberWorkOrderDispatch = onRequest(async (req, res) => {
  try {
    const engine = new FirebaseDataEngine('plumber');
    const { workOrderData, technicianId } = req.body;

    const executionId = await engine.storeWorkflowExecution('work-order-dispatch', {
      workOrderData,
      technicianId
    });

    await engine.storeTransaction({
      type: 'work_order',
      amount: workOrderData.estimatedCost,
      metadata: { workOrderData, technicianId }
    });

    await engine.storeAnalyticsEvent('WORK_ORDER_DISPATCHED', {
      executionId,
      location: workOrderData.location
    });

    res.json({ success: true, executionId });
  } catch (error) {
    console.error('Plumber error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CROSS-BRAND QUERY ENGINE (Admin only)
// ============================================================================

exports.getCrossBrandAnalytics = onRequest(async (req, res) => {
  try {
    // Verify admin claim
    const token = req.headers.authorization?.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const brands = ['palettemath', 'saferide', 'prevleak', 'qvedic', 'plumber'];
    const analytics = {};

    for (const brand of brands) {
      const engine = new FirebaseDataEngine(brand);
      analytics[brand] = await engine.queryAnalytics();
    }

    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EXPORT FOR USE IN CLOUD FUNCTIONS
// ============================================================================

module.exports = {
  FirebaseDataEngine,
  BRAND_SCHEMA
};

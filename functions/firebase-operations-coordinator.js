/**
 * FIREBASE OPERATIONS ENGINE COORDINATOR
 * Master orchestrator for all 5 brands
 * Coordinates workflows, data flows, and ML operations across brands
 */

const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');

// Firebase initialized in index.js - do not reinitialize
const db = admin.firestore();

// ============================================================================
// OPERATIONS COORDINATOR
// ============================================================================

class OperationsCoordinator {
  constructor() {
    this.db = db;
    this.timestamp = admin.firestore.FieldValue.serverTimestamp();
    this.brands = ['palettemath', 'saferide', 'prevleak', 'qvedic', 'plumber'];
  }

  /**
   * Initiate brand-specific workflow orchestration
   */
  async orchestrateWorkflow(brandName, workflowConfig) {
    const orchestrationId = `orch-${brandName}-${workflowConfig.name}-${Date.now()}`;

    // Validate brand
    if (!this.brands.includes(brandName)) {
      throw new Error(`Unknown brand: ${brandName}`);
    }

    // Create orchestration record
    await this.db.collection('operations_orchestrations').doc(orchestrationId).set({
      orchestrationId: orchestrationId,
      brandName: brandName,
      workflowName: workflowConfig.name,
      status: 'INITIATED',
      stages: workflowConfig.stages || [],
      currentStage: 0,
      results: [],
      createdAt: this.timestamp,
      indexes: {
        brand_workflow: `${brandName}_${workflowConfig.name}`,
        status: 'INITIATED'
      }
    });

    return orchestrationId;
  }

  /**
   * Log operation stage completion
   */
  async logStageCompletion(orchestrationId, stageIndex, stageResult) {
    await this.db.collection('operations_orchestrations').doc(orchestrationId).update({
      [`results.${stageIndex}`]: stageResult,
      currentStage: stageIndex + 1,
      updatedAt: this.timestamp
    });
  }

  /**
   * Store cross-brand operational metrics
   */
  async storeOperationalMetrics(metricsData) {
    const metricsId = `metrics-${Date.now()}`;

    const metrics = {};
    for (const brand of this.brands) {
      metrics[brand] = metricsData[brand] || {
        workflows: 0,
        errors: 0,
        avgLatency: 0,
        dataProcessed: 0
      };
    }

    await this.db.collection('operational_metrics').doc(metricsId).set({
      metricsId: metricsId,
      timestamp: this.timestamp,
      byBrand: metrics,
      total: {
        workflows: this.brands.reduce((sum, b) => sum + (metrics[b].workflows || 0), 0),
        errors: this.brands.reduce((sum, b) => sum + (metrics[b].errors || 0), 0),
        avgLatency: this.brands.reduce((sum, b) => sum + (metrics[b].avgLatency || 0), 0) / this.brands.length
      }
    });

    return metricsId;
  }

  /**
   * Get operational health across all brands
   */
  async getOperationalHealth() {
    const snapshot = await this.db.collection('operational_metrics')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        status: 'NO_DATA',
        brands: this.brands.reduce((acc, b) => {
          acc[b] = { status: 'UNKNOWN' };
          return acc;
        }, {})
      };
    }

    const latestMetrics = snapshot.docs[0].data();
    const health = {
      timestamp: latestMetrics.timestamp,
      overallStatus: 'HEALTHY',
      brands: {}
    };

    for (const brand of this.brands) {
      const brandMetrics = latestMetrics.byBrand[brand];
      const errorRate = brandMetrics.workflows > 0 
        ? (brandMetrics.errors / brandMetrics.workflows) 
        : 0;

      health.brands[brand] = {
        status: errorRate < 0.05 ? 'HEALTHY' : errorRate < 0.1 ? 'WARNING' : 'UNHEALTHY',
        workflows: brandMetrics.workflows,
        errors: brandMetrics.errors,
        errorRate: (errorRate * 100).toFixed(2) + '%',
        latency: brandMetrics.avgLatency + 'ms'
      };

      if (health.brands[brand].status !== 'HEALTHY') {
        health.overallStatus = 'DEGRADED';
      }
    }

    return health;
  }

  /**
   * Broadcast data across brands (audit log only)
   */
  async logCrossBrandEvent(eventType, eventData) {
    const eventId = `event-${Date.now()}`;

    await this.db.collection('cross_brand_events').doc(eventId).set({
      eventId: eventId,
      eventType: eventType,
      affectedBrands: eventData.brands || [],
      metadata: eventData,
      createdAt: this.timestamp,
      indexes: {
        event_type: eventType,
        date: new Date().toISOString().split('T')[0]
      }
    });

    return eventId;
  }

  /**
   * Generate deployment manifest for all brands
   */
  async generateDeploymentManifest() {
    const manifest = {
      deploymentId: `deploy-${Date.now()}`,
      timestamp: this.timestamp,
      brands: {}
    };

    for (const brand of this.brands) {
      // Get latest models
      const modelsSnap = await this.db.collection('ml_model_registry')
        .where('brandName', '==', brand)
        .where('status', '==', 'REGISTERED')
        .limit(5)
        .get();

      // Get recent workflows
      const workflowsSnap = await this.db.collection(`workflows_${brand}`)
        .limit(10)
        .get();

      manifest.brands[brand] = {
        models: modelsSnap.docs.map(doc => ({
          id: doc.data().modelId,
          name: doc.data().name,
          type: doc.data().type
        })),
        recentWorkflows: workflowsSnap.docs.length,
        status: 'READY_FOR_DEPLOYMENT'
      };
    }

    return manifest;
  }
}

// ============================================================================
// FIREBASE FUNCTIONS - OPERATIONS ENDPOINTS
// ============================================================================

/**
 * Initialize brand workflow
 */
exports.initiateBrandWorkflow = onRequest(async (req, res) => {
  try {
    const { brandName, workflowName, workflowConfig } = req.body;

    const coordinator = new OperationsCoordinator();
    const orchestrationId = await coordinator.orchestrateWorkflow(brandName, {
      name: workflowName,
      stages: workflowConfig.stages
    });

    // Log event
    await coordinator.logCrossBrandEvent('WORKFLOW_INITIATED', {
      brands: [brandName],
      workflowName: workflowName,
      orchestrationId: orchestrationId
    });

    res.json({ 
      success: true, 
      orchestrationId,
      brandName,
      workflowName
    });
  } catch (error) {
    console.error('Workflow init error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get operations health dashboard
 */
exports.getOperationsHealth = onRequest(async (req, res) => {
  try {
    const coordinator = new OperationsCoordinator();
    const health = await coordinator.getOperationalHealth();

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Store operational metrics
 */
exports.storeOperationalMetrics = onRequest(async (req, res) => {
  try {
    const { metrics } = req.body;

    const coordinator = new OperationsCoordinator();
    const metricsId = await coordinator.storeOperationalMetrics(metrics);

    res.json({
      success: true,
      metricsId
    });
  } catch (error) {
    console.error('Metrics storage error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate deployment manifest
 */
exports.getDeploymentManifest = onRequest(async (req, res) => {
  try {
    const coordinator = new OperationsCoordinator();
    const manifest = await coordinator.generateDeploymentManifest();

    res.json({
      success: true,
      manifest
    });
  } catch (error) {
    console.error('Manifest error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint for load balancer
 */
exports.healthCheck = onRequest(async (req, res) => {
  try {
    const coordinator = new OperationsCoordinator();
    const health = await coordinator.getOperationalHealth();

    const overallHealthy = health.overallStatus === 'HEALTHY';
    res.status(overallHealthy ? 200 : 503).json({
      status: health.overallStatus,
      timestamp: new Date().toISOString(),
      brands: Object.keys(health.brands).length
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'UNHEALTHY',
      error: error.message 
    });
  }
});

module.exports = {
  OperationsCoordinator
};

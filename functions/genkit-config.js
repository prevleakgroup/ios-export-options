/**
 * GENKIT CONFIGURATION
 * AI/ML workflow setup for all 5 brands
 */

module.exports = {
  // Model Configuration
  ai: {
    model: 'vertex-ai',
    modelName: 'gemini-1.5-pro',
    visionModel: 'gemini-1.5-pro-vision',
    region: 'us-central1',
    projectId: 'saferide-peld8'
  },

  // Brand-Specific ML Models
  brandModels: {
    prevleak: {
      threatDetection: {
        model: 'gemini-1.5-pro',
        temperature: 0.3,
        maxTokens: 1024,
        topK: 40,
        topP: 0.95
      },
      incidentPrediction: {
        model: 'gemini-1.5-pro',
        temperature: 0.2,
        maxTokens: 2048
      }
    },
    saferide: {
      rideMatching: {
        model: 'gemini-1.5-pro',
        temperature: 0.1,
        maxTokens: 512
      },
      routeOptimization: {
        model: 'gemini-1.5-pro',
        temperature: 0.2,
        maxTokens: 2048
      }
    },
    palettemath: {
      colorAnalysis: {
        model: 'gemini-1.5-pro-vision',
        temperature: 0.3,
        maxTokens: 1024
      },
      paletteGeneration: {
        model: 'gemini-1.5-pro',
        temperature: 0.7,
        maxTokens: 1024
      }
    },
    qvedic: {
      contentRecommendation: {
        model: 'gemini-1.5-pro',
        temperature: 0.4,
        maxTokens: 2048
      },
      engagementOptimization: {
        model: 'gemini-1.5-pro',
        temperature: 0.3,
        maxTokens: 1024
      }
    },
    plumber: {
      dispatchOptimization: {
        model: 'gemini-1.5-pro',
        temperature: 0.1,
        maxTokens: 2048
      },
      demandForecast: {
        model: 'gemini-1.5-pro',
        temperature: 0.2,
        maxTokens: 1024
      }
    }
  },

  // Workflow Execution Configuration
  execution: {
    timeout: 300000, // 5 minutes
    maxRetries: 3,
    retryDelay: 1000,
    enableCaching: true,
    cacheTTL: 3600 // 1 hour
  },

  // Data Processing
  dataProcessing: {
    batchSize: 100,
    processTimeout: 60000,
    qualityThreshold: 0.7,
    enableValidation: true
  },

  // Monitoring & Logging
  monitoring: {
    enableLogging: true,
    logLevel: 'info',
    enableMetrics: true,
    metricsInterval: 60000,
    enableTracing: true
  },

  // Cost Optimization
  costOptimization: {
    enableBatching: true,
    batchWindow: 5000,
    enableCaching: true,
    cacheSize: '1GB',
    pruneInterval: 86400000 // 24 hours
  },

  // API Rate Limits
  rateLimits: {
    requestsPerMinute: 60,
    concurrentRequests: 10,
    burstLimit: 100
  },

  // Firestore Collections for ML Results
  firestoreCollections: {
    predictions: 'ml_predictions',
    anomalies: 'ml_anomalies',
    matches: 'ride_matches',
    recommendations: 'recommendations',
    colorAnalyses: 'color_analyses',
    dispatchPlans: 'dispatch_plans',
    auditLog: 'ml_audit_log'
  },

  // Alert Thresholds
  alerting: {
    threatLevelCritical: 0.9,
    anomalyScoreHigh: 0.8,
    anomalyScoreMedium: 0.6,
    engagementLiftMin: 0.1,
    efficiencyScoreLow: 0.6
  },

  // Vertex AI Configuration
  vertexAi: {
    projectId: 'saferide-peld8',
    location: 'us-central1',
    apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS
  },

  // Feature Flags
  features: {
    enableThreatDetection: true,
    enableIncidentPrediction: true,
    enableRideMatching: true,
    enableRouteOptimization: true,
    enableColorAnalysis: true,
    enablePaletteGeneration: true,
    enableContentRecommendation: true,
    enableEngagementOptimization: true,
    enableDispatchOptimization: true,
    enableDemandForecast: true,
    enableAnomalyDetection: true,
    enableDataProcessing: true
  },

  // Privacy & Compliance
  privacy: {
    enableDataEncryption: true,
    enableAuditLogging: true,
    enableAnonymization: true,
    retentionDays: 90,
    gdprCompliant: true
  }
};

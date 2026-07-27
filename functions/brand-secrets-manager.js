/**
 * SECRETS MANAGEMENT FOR ALL 5 BRANDS
 * Secure credential storage and retrieval using Google Cloud Secret Manager
 * Enables smooth large function operations without exposing sensitive data
 */

const admin = require('firebase-admin');
const secretManager = require('@google-cloud/secret-manager');

// Firebase initialized in index.js
const db = admin.firestore();

// Secret Manager client
const secretClient = new secretManager.SecretManagerServiceClient();
const projectId = 'saferide-peld8';

// ============================================================================
// BRAND SECRETS CONFIGURATION
// ============================================================================

const BRAND_SECRETS = {
  prevleak: {
    name: 'PrevLeak Infrastructure',
    secrets: [
      'prevleak-api-key',
      'prevleak-gcp-service-account',
      'prevleak-slack-webhook',
      'prevleak-godaddy-api-key',
      'prevleak-godaddy-api-secret',
      'prevleak-ml-model-config',
      'prevleak-database-password'
    ],
    functions: [
      'infrastructure-deployment',
      'sensor-data-processor',
      'predictive-analysis'
    ],
    rotation_days: 90
  },
  saferide: {
    name: 'SafeRide Ride Matching',
    secrets: [
      'saferide-api-key',
      'saferide-gcp-service-account',
      'saferide-slack-webhook',
      'saferide-godaddy-api-key',
      'saferide-godaddy-api-secret',
      'saferide-payment-provider-key',
      'saferide-twilio-auth-token',
      'saferide-maps-api-key'
    ],
    functions: [
      'ride-matching-engine',
      'location-tracking',
      'driver-assignment'
    ],
    rotation_days: 60
  },
  palettemath: {
    name: 'PaletteMath Color Intelligence',
    secrets: [
      'palettemath-api-key',
      'palettemath-gcp-service-account',
      'palettemath-slack-webhook',
      'palettemath-godaddy-api-key',
      'palettemath-godaddy-api-secret',
      'palettemath-ml-model-config',
      'palettemath-vertexai-token',
      'palettemath-database-password'
    ],
    functions: [
      'color-analysis-engine',
      'ml-inference-service',
      'palette-generation'
    ],
    rotation_days: 60
  },
  qvedic: {
    name: 'Qvedic Content Management',
    secrets: [
      'qvedic-api-key',
      'qvedic-gcp-service-account',
      'qvedic-slack-webhook',
      'qvedic-godaddy-api-key',
      'qvedic-godaddy-api-secret',
      'qvedic-content-delivery-token',
      'qvedic-search-engine-key',
      'qvedic-database-password'
    ],
    functions: [
      'content-delivery-optimizer',
      'engagement-tracker',
      'recommendation-engine'
    ],
    rotation_days: 90
  },
  plumber: {
    name: 'Plumber Work Order Management',
    secrets: [
      'plumber-api-key',
      'plumber-gcp-service-account',
      'plumber-slack-webhook',
      'plumber-godaddy-api-key',
      'plumber-godaddy-api-secret',
      'plumber-scheduling-token',
      'plumber-dispatch-api-key',
      'plumber-database-password'
    ],
    functions: [
      'work-order-dispatcher',
      'technician-router',
      'service-scheduler'
    ],
    rotation_days: 90
  }
};

// ============================================================================
// SECRETS MANAGER CLASS
// ============================================================================

class BrandSecretsManager {
  constructor() {
    this.projectId = projectId;
    this.secretsCache = {};
    this.cacheExpiry = 300000; // 5 minutes
  }

  /**
   * Get secret value from Google Cloud Secret Manager
   * Caches for performance
   */
  async getSecret(secretName, brandName) {
    const cacheKey = `${brandName}/${secretName}`;
    
    // Check cache
    if (this.secretsCache[cacheKey] && this.secretsCache[cacheKey].expiry > Date.now()) {
      console.log(`✓ Secret retrieved from cache: ${cacheKey}`);
      return this.secretsCache[cacheKey].value;
    }

    try {
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await secretClient.accessSecretVersion({ name });
      const secret = version.payload.data.toString('utf8');

      // Cache the secret
      this.secretsCache[cacheKey] = {
        value: secret,
        expiry: Date.now() + this.cacheExpiry
      };

      console.log(`✓ Secret retrieved: ${secretName}`);
      return secret;
    } catch (error) {
      console.error(`✗ Failed to retrieve secret ${secretName}:`, error);
      throw new Error(`Secret not found: ${secretName}`);
    }
  }

  /**
   * Get all secrets for a brand
   */
  async getBrandSecrets(brandName) {
    const config = BRAND_SECRETS[brandName];
    if (!config) {
      throw new Error(`Brand not found: ${brandName}`);
    }

    const secrets = {};
    
    try {
      for (const secretName of config.secrets) {
        secrets[secretName] = await this.getSecret(secretName, brandName);
      }
      
      console.log(`✓ All secrets loaded for ${brandName}`);
      return secrets;
    } catch (error) {
      console.error(`✗ Failed to load secrets for ${brandName}:`, error);
      throw error;
    }
  }

  /**
   * Create secret in Google Cloud Secret Manager
   */
  async createSecret(secretName, secretValue, brandName) {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}`;

      // Check if secret already exists
      try {
        await secretClient.getSecret({ name });
        console.log(`Secret already exists: ${secretName}`);
      } catch (error) {
        if (error.code !== 5) { // 5 = NOT_FOUND
          throw error;
        }

        // Create new secret
        await secretClient.createSecret({
          parent: `projects/${this.projectId}`,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {}
            }
          }
        });

        console.log(`✓ Secret created: ${secretName}`);
      }

      // Add secret version
      await secretClient.addSecretVersion({
        parent: name,
        payload: {
          data: Buffer.from(secretValue)
        }
      });

      console.log(`✓ Secret version added: ${secretName}`);

      // Log to Firestore
      await db.collection('secrets_audit_log').add({
        brand: brandName,
        secret_name: secretName,
        action: 'CREATE',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        created_by: 'system'
      });

      return { secret: secretName, status: 'CREATED' };
    } catch (error) {
      console.error(`✗ Failed to create secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Rotate secret (create new version)
   */
  async rotateSecret(secretName, newValue, brandName) {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}`;

      // Add new version
      await secretClient.addSecretVersion({
        parent: name,
        payload: {
          data: Buffer.from(newValue)
        }
      });

      // Invalidate cache
      const cacheKey = `${brandName}/${secretName}`;
      delete this.secretsCache[cacheKey];

      console.log(`✓ Secret rotated: ${secretName}`);

      // Log rotation
      await db.collection('secrets_audit_log').add({
        brand: brandName,
        secret_name: secretName,
        action: 'ROTATE',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        rotated_by: 'system'
      });

      return { secret: secretName, status: 'ROTATED' };
    } catch (error) {
      console.error(`✗ Failed to rotate secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Get secrets for function execution
   */
  async getSecretsForFunction(brandName, functionName) {
    try {
      const config = BRAND_SECRETS[brandName];
      if (!config) {
        throw new Error(`Brand not found: ${brandName}`);
      }

      if (!config.functions.includes(functionName)) {
        throw new Error(`Function not authorized for brand: ${functionName}`);
      }

      const secrets = await this.getBrandSecrets(brandName);

      // Log function access
      await db.collection('function_access_log').add({
        brand: brandName,
        function_name: functionName,
        accessed_at: admin.firestore.FieldValue.serverTimestamp(),
        secrets_accessed: Object.keys(secrets).length
      });

      return secrets;
    } catch (error) {
      console.error(`✗ Failed to get secrets for function:`, error);
      throw error;
    }
  }

  /**
   * Verify secret exists
   */
  async verifySecret(secretName) {
    try {
      const name = `projects/${this.projectId}/secrets/${secretName}`;
      await secretClient.getSecret({ name });
      return true;
    } catch (error) {
      if (error.code === 5) { // NOT_FOUND
        return false;
      }
      throw error;
    }
  }

  /**
   * List all secrets for a brand
   */
  async listBrandSecrets(brandName) {
    try {
      const config = BRAND_SECRETS[brandName];
      if (!config) {
        throw new Error(`Brand not found: ${brandName}`);
      }

      const secretsList = [];
      
      for (const secretName of config.secrets) {
        const exists = await this.verifySecret(secretName);
        secretsList.push({
          name: secretName,
          exists: exists,
          status: exists ? 'READY' : 'MISSING'
        });
      }

      return secretsList;
    } catch (error) {
      console.error(`✗ Failed to list secrets:`, error);
      throw error;
    }
  }

  /**
   * Delete secret (requires confirmation)
   */
  async deleteSecret(secretName, brandName, confirmationToken) {
    try {
      // Verify confirmation token (should be from verified admin)
      if (!confirmationToken) {
        throw new Error('Confirmation token required for secret deletion');
      }

      const name = `projects/${this.projectId}/secrets/${secretName}`;
      
      await secretClient.deleteSecret({ name });

      // Invalidate cache
      const cacheKey = `${brandName}/${secretName}`;
      delete this.secretsCache[cacheKey];

      console.log(`✓ Secret deleted: ${secretName}`);

      // Log deletion
      await db.collection('secrets_audit_log').add({
        brand: brandName,
        secret_name: secretName,
        action: 'DELETE',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        deleted_by: 'admin'
      });

      return { secret: secretName, status: 'DELETED' };
    } catch (error) {
      console.error(`✗ Failed to delete secret ${secretName}:`, error);
      throw error;
    }
  }

  /**
   * Get secrets status dashboard
   */
  async getSecretsStatusDashboard() {
    const dashboard = {};

    for (const [brand, config] of Object.entries(BRAND_SECRETS)) {
      const secrets = await this.listBrandSecrets(brand);
      const ready = secrets.filter(s => s.exists).length;
      const missing = secrets.filter(s => !s.exists).length;

      dashboard[brand] = {
        name: config.name,
        total_secrets: secrets.length,
        ready: ready,
        missing: missing,
        functions: config.functions,
        rotation_days: config.rotation_days,
        secrets: secrets
      };
    }

    return dashboard;
  }
}

// ============================================================================
// BRAND-SPECIFIC SECRET LOADERS
// ============================================================================

class PrevLeakSecretsLoader {
  constructor(secretsManager) {
    this.sm = secretsManager;
    this.brand = 'prevleak';
  }

  async loadForInfrastructureDeployment() {
    return this.sm.getSecretsForFunction(this.brand, 'infrastructure-deployment');
  }

  async loadForSensorDataProcessor() {
    return this.sm.getSecretsForFunction(this.brand, 'sensor-data-processor');
  }
}

class SafeRideSecretsLoader {
  constructor(secretsManager) {
    this.sm = secretsManager;
    this.brand = 'saferide';
  }

  async loadForRideMatching() {
    return this.sm.getSecretsForFunction(this.brand, 'ride-matching-engine');
  }

  async loadForLocationTracking() {
    return this.sm.getSecretsForFunction(this.brand, 'location-tracking');
  }
}

class PaletteMathSecretsLoader {
  constructor(secretsManager) {
    this.sm = secretsManager;
    this.brand = 'palettemath';
  }

  async loadForColorAnalysis() {
    return this.sm.getSecretsForFunction(this.brand, 'color-analysis-engine');
  }

  async loadForMLInference() {
    return this.sm.getSecretsForFunction(this.brand, 'ml-inference-service');
  }
}

class QvedicSecretsLoader {
  constructor(secretsManager) {
    this.sm = secretsManager;
    this.brand = 'qvedic';
  }

  async loadForContentDelivery() {
    return this.sm.getSecretsForFunction(this.brand, 'content-delivery-optimizer');
  }

  async loadForRecommendations() {
    return this.sm.getSecretsForFunction(this.brand, 'recommendation-engine');
  }
}

class PlumberSecretsLoader {
  constructor(secretsManager) {
    this.sm = secretsManager;
    this.brand = 'plumber';
  }

  async loadForWorkOrderDispatch() {
    return this.sm.getSecretsForFunction(this.brand, 'work-order-dispatcher');
  }

  async loadForTechnicianRouting() {
    return this.sm.getSecretsForFunction(this.brand, 'technician-router');
  }
}

module.exports = {
  BrandSecretsManager,
  PrevLeakSecretsLoader,
  SafeRideSecretsLoader,
  PaletteMathSecretsLoader,
  QvedicSecretsLoader,
  PlumberSecretsLoader,
  BRAND_SECRETS
};

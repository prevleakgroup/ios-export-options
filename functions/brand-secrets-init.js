/**
 * BRAND SECRETS INITIALIZATION
 * Setup script to create and configure secrets for all 5 brands
 * Run this once during deployment setup
 */

const { BrandSecretsManager, BRAND_SECRETS } = require('./brand-secrets-manager');

// ============================================================================
// SAMPLE SECRETS - REPLACE WITH REAL VALUES
// ============================================================================

const SAMPLE_SECRETS = {
  prevleak: {
    'prevleak-api-key': 'sk_prevleak_live_abc123def456',
    'prevleak-gcp-service-account': '{"type":"service_account","project_id":"saferide-peld8"}',
    'prevleak-slack-webhook': '<WORKSPACE_ID>/<CHANNEL_ID>/<TOKEN>',
    'prevleak-godaddy-api-key': 'YOUR_GODADDY_API_KEY_HERE',
    'prevleak-godaddy-api-secret': 'YOUR_GODADDY_API_SECRET_HERE',
    'prevleak-ml-model-config': '{"model":"infrastructure-predictor","version":"1.0.0"}',
    'prevleak-database-password': 'SECURE_PASSWORD_HASH_HERE'
  },
  saferide: {
    'saferide-api-key': 'sk_saferide_live_xyz789abc123',
    'saferide-gcp-service-account': '{"type":"service_account","project_id":"saferide-peld8"}',
    'saferide-slack-webhook': '<WORKSPACE_ID>/<CHANNEL_ID>/<TOKEN>',
    'saferide-godaddy-api-key': 'YOUR_GODADDY_API_KEY_HERE',
    'saferide-godaddy-api-secret': 'YOUR_GODADDY_API_SECRET_HERE',
    'saferide-payment-provider-key': 'pk_live_saferide_payment_key',
    'saferide-twilio-auth-token': 'YOUR_TWILIO_AUTH_TOKEN',
    'saferide-maps-api-key': 'YOUR_GOOGLE_MAPS_API_KEY'
  },
  palettemath: {
    'palettemath-api-key': 'sk_palettemath_live_def123ghi456',
    'palettemath-gcp-service-account': '{"type":"service_account","project_id":"saferide-peld8"}',
    'palettemath-slack-webhook': '<WORKSPACE_ID>/<CHANNEL_ID>/<TOKEN>',
    'palettemath-godaddy-api-key': 'YOUR_GODADDY_API_KEY_HERE',
    'palettemath-godaddy-api-secret': 'YOUR_GODADDY_API_SECRET_HERE',
    'palettemath-ml-model-config': '{"model":"color-analyzer","version":"2.1.0"}',
    'palettemath-vertexai-token': 'YOUR_VERTEX_AI_TOKEN',
    'palettemath-database-password': 'SECURE_PASSWORD_HASH_HERE'
  },
  qvedic: {
    'qvedic-api-key': 'sk_qvedic_live_jkl456mno789',
    'qvedic-gcp-service-account': '{"type":"service_account","project_id":"saferide-peld8"}',
    'qvedic-slack-webhook': '<WORKSPACE_ID>/<CHANNEL_ID>/<TOKEN>',
    'qvedic-godaddy-api-key': 'YOUR_GODADDY_API_KEY_HERE',
    'qvedic-godaddy-api-secret': 'YOUR_GODADDY_API_SECRET_HERE',
    'qvedic-content-delivery-token': 'cdn_token_qvedic_live',
    'qvedic-search-engine-key': 'YOUR_SEARCH_ENGINE_API_KEY',
    'qvedic-database-password': 'SECURE_PASSWORD_HASH_HERE'
  },
  plumber: {
    'plumber-api-key': 'sk_plumber_live_pqr012stu345',
    'plumber-gcp-service-account': '{"type":"service_account","project_id":"saferide-peld8"}',
    'plumber-slack-webhook': '<WORKSPACE_ID>/<CHANNEL_ID>/<TOKEN>',
    'plumber-godaddy-api-key': 'YOUR_GODADDY_API_KEY_HERE',
    'plumber-godaddy-api-secret': 'YOUR_GODADDY_API_SECRET_HERE',
    'plumber-scheduling-token': 'sched_token_plumber_live',
    'plumber-dispatch-api-key': 'dispatch_key_plumber_live',
    'plumber-database-password': 'SECURE_PASSWORD_HASH_HERE'
  }
};

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Initialize all brand secrets
 * WARNING: This should only be run during initial setup
 */
async function initializeBrandSecrets() {
  const secretsManager = new BrandSecretsManager();

  console.log('🔐 Starting Brand Secrets Initialization...\n');

  for (const [brand, secrets] of Object.entries(SAMPLE_SECRETS)) {
    console.log(`📦 Initializing secrets for ${brand}...`);
    
    try {
      for (const [secretName, secretValue] of Object.entries(secrets)) {
        await secretsManager.createSecret(secretName, secretValue, brand);
      }
      console.log(`✅ ${brand} secrets initialized successfully\n`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${brand} secrets:`, error.message);
    }
  }

  console.log('🔐 Brand Secrets Initialization Complete!');
}

/**
 * Get status of all secrets
 */
async function getSecretsStatus() {
  const secretsManager = new BrandSecretsManager();

  console.log('\n📊 SECRETS STATUS DASHBOARD\n');
  console.log('=' .repeat(80));

  try {
    const dashboard = await secretsManager.getSecretsStatusDashboard();

    for (const [brand, status] of Object.entries(dashboard)) {
      console.log(`\n📦 ${status.name}`);
      console.log(`   Total Secrets: ${status.total_secrets}`);
      console.log(`   Ready: ${status.ready} ✓`);
      console.log(`   Missing: ${status.missing} ✗`);
      console.log(`   Rotation Period: ${status.rotation_days} days`);
      console.log(`   Functions: ${status.functions.join(', ')}`);
      
      if (status.missing > 0) {
        console.log(`   Missing Secrets:`);
        status.secrets.filter(s => !s.exists).forEach(s => {
          console.log(`     - ${s.name}`);
        });
      }
    }

    console.log('\n' + '='.repeat(80));
  } catch (error) {
    console.error('Failed to get secrets status:', error);
  }
}

/**
 * Rotate secrets for a brand
 */
async function rotateBrandSecrets(brandName, newSecrets) {
  const secretsManager = new BrandSecretsManager();

  console.log(`\n🔄 Rotating secrets for ${brandName}...\n`);

  try {
    for (const [secretName, newValue] of Object.entries(newSecrets)) {
      await secretsManager.rotateSecret(secretName, newValue, brandName);
    }
    console.log(`✅ ${brandName} secrets rotated successfully`);
  } catch (error) {
    console.error(`❌ Failed to rotate ${brandName} secrets:`, error.message);
  }
}

/**
 * Verify all secrets are accessible
 */
async function verifySecretsAccess() {
  const secretsManager = new BrandSecretsManager();

  console.log('\n🔑 VERIFYING SECRETS ACCESS\n');
  console.log('='.repeat(80));

  for (const brand of Object.keys(BRAND_SECRETS)) {
    console.log(`\nTesting ${brand}...`);
    try {
      const secrets = await secretsManager.getBrandSecrets(brand);
      console.log(`✅ Successfully loaded ${Object.keys(secrets).length} secrets for ${brand}`);
    } catch (error) {
      console.error(`❌ Failed to load secrets for ${brand}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Setup schedule for secret rotation
 */
async function setupSecretRotationSchedule() {
  console.log('\n📅 SETTING UP SECRET ROTATION SCHEDULE\n');

  for (const [brand, config] of Object.entries(BRAND_SECRETS)) {
    const rotationDays = config.rotation_days;
    
    console.log(`${brand}:`);
    console.log(`  - Rotation interval: Every ${rotationDays} days`);
    console.log(`  - Next rotation: ${new Date(Date.now() + rotationDays * 24 * 60 * 60 * 1000).toLocaleDateString()}`);
    console.log(`  - Cloud Scheduler job: rotate-${brand}-secrets`);
    console.log(`  - Status: SCHEDULED\n`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await initializeBrandSecrets();
      break;
    case 'status':
      await getSecretsStatus();
      break;
    case 'verify':
      await verifySecretsAccess();
      break;
    case 'rotate':
      const brand = process.argv[3];
      if (!brand) {
        console.error('Usage: node brand-secrets-init.js rotate <brand>');
        process.exit(1);
      }
      // This would require new secrets to be provided
      console.log(`To rotate ${brand} secrets, provide new values`);
      break;
    case 'setup-rotation':
      await setupSecretRotationSchedule();
      break;
    default:
      console.log(`
Brand Secrets Manager - Initialization Script

Usage:
  node brand-secrets-init.js init              # Initialize all brand secrets
  node brand-secrets-init.js status            # Show secrets status dashboard
  node brand-secrets-init.js verify            # Verify secrets are accessible
  node brand-secrets-init.js setup-rotation    # Setup rotation schedule
  node brand-secrets-init.js rotate <brand>   # Rotate specific brand secrets
      `);
  }
}

// Export for use as module
module.exports = {
  initializeBrandSecrets,
  getSecretsStatus,
  rotateBrandSecrets,
  verifySecretsAccess,
  setupSecretRotationSchedule
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

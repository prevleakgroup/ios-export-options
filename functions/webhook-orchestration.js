/**
 * WEBHOOK ORCHESTRATION SYSTEM
 * Manages webhooks for all 5 brand DNS workflows
 * Integrates with Cloud Workflows, Cloud Pub/Sub, and external services
 */

const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const crypto = require('crypto');
const axios = require('axios');

// Firebase initialized in index.js
const db = admin.firestore();

// ============================================================================
// WEBHOOK CONFIGURATION FOR EACH BRAND
// ============================================================================

const BRAND_WEBHOOKS = {
  prevleak: {
    name: 'PrevLeak Infrastructure Management',
    domain: 'prevleak.company',
    workflows: [
      'infrastructure-deployment',
      'sensor-data-sync',
      'incident-detection'
    ],
    dns_events: ['A_RECORD_CHANGE', 'CNAME_UPDATE', 'TXT_RECORD_CHANGE'],
    slack_channel: 'prevleak-deployments',
    godaddy_domain: 'prevleak.company'
  },
  saferide: {
    name: 'SafeRide Ride Matching',
    domain: 'saferide.company',
    workflows: [
      'ride-matching',
      'driver-assignment',
      'location-tracking'
    ],
    dns_events: ['A_RECORD_CHANGE', 'CNAME_UPDATE'],
    slack_channel: 'saferide-deployments',
    godaddy_domain: 'saferide.company'
  },
  palettemath: {
    name: 'PaletteMath Color Intelligence',
    domain: 'palettemath.company',
    workflows: [
      'color-analysis',
      'ml-inference',
      'palette-generation'
    ],
    dns_events: ['A_RECORD_CHANGE', 'CNAME_UPDATE', 'TXT_RECORD_CHANGE'],
    slack_channel: 'palettemath-deployments',
    godaddy_domain: 'palettemath.net'
  },
  qvedic: {
    name: 'Qvedic Content Management',
    domain: 'qvedic.company',
    workflows: [
      'content-delivery',
      'engagement-tracking',
      'recommendation-engine'
    ],
    dns_events: ['A_RECORD_CHANGE', 'CNAME_UPDATE'],
    slack_channel: 'qvedic-deployments',
    godaddy_domain: 'qvedic.company'
  },
  plumber: {
    name: 'Plumber Work Order Management',
    domain: 'plumber.company',
    workflows: [
      'work-order-dispatch',
      'technician-routing',
      'service-scheduling'
    ],
    dns_events: ['A_RECORD_CHANGE', 'CNAME_UPDATE', 'SRV_RECORD_CHANGE'],
    slack_channel: 'plumber-deployments',
    godaddy_domain: 'plumber.company'
  }
};

// ============================================================================
// WEBHOOK REGISTRATION
// ============================================================================

class WebhookOrchestrator {
  constructor() {
    this.webhookCollection = 'webhooks';
    this.eventLogCollection = 'webhook_events';
  }

  /**
   * Register webhook for brand DNS workflow
   */
  async registerBrandWebhook(brandName, webhookConfig) {
    try {
      const webhook = {
        brand: brandName,
        name: webhookConfig.name,
        domain: webhookConfig.domain,
        workflows: webhookConfig.workflows,
        dns_events: webhookConfig.dns_events,
        slack_channel: webhookConfig.slack_channel,
        godaddy_domain: webhookConfig.godaddy_domain,
        status: 'ACTIVE',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        webhook_url: `https://us-central1-saferide-peld8.cloudfunctions.net/webhook/dns/${brandName}`,
        secret: crypto.randomBytes(32).toString('hex'),
        retry_count: 0,
        last_triggered: null,
        enabled: true
      };

      await db.collection(this.webhookCollection).doc(brandName).set(webhook);
      
      console.log(`✓ Webhook registered for ${brandName}: ${webhook.webhook_url}`);
      return webhook;
    } catch (error) {
      console.error(`✗ Failed to register webhook for ${brandName}:`, error);
      throw error;
    }
  }

  /**
   * Register all brand webhooks
   */
  async registerAllWebhooks() {
    const results = [];
    
    for (const [brand, config] of Object.entries(BRAND_WEBHOOKS)) {
      try {
        const webhook = await this.registerBrandWebhook(brand, config);
        results.push({ brand, status: 'SUCCESS', webhook });
      } catch (error) {
        results.push({ brand, status: 'FAILED', error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Handle incoming DNS webhook from GoDaddy
   */
  async handleDNSWebhook(brandName, payload, signature) {
    try {
      // Verify signature
      const webhook = await db.collection(this.webhookCollection).doc(brandName).get();
      if (!webhook.exists) {
        throw new Error(`Webhook not found for brand: ${brandName}`);
      }

      const secret = webhook.data().secret;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      // Process DNS change
      await this.processDNSChange(brandName, payload);
      
      return { status: 'PROCESSED', brand: brandName };
    } catch (error) {
      console.error(`✗ DNS webhook processing failed for ${brandName}:`, error);
      throw error;
    }
  }

  /**
   * Process DNS change event and trigger workflows
   */
  async processDNSChange(brandName, payload) {
    try {
      const config = BRAND_WEBHOOKS[brandName];
      
      // Log event
      await db.collection(this.eventLogCollection).add({
        brand: brandName,
        event_type: 'DNS_CHANGE',
        event_data: payload,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'PROCESSING'
      });

      // Trigger workflows based on DNS change type
      const triggeredWorkflows = [];
      
      if (payload.change_type === 'A_RECORD' && config.workflows.includes('infrastructure-deployment')) {
        triggeredWorkflows.push('infrastructure-deployment');
      }
      
      if (payload.change_type === 'CNAME' && config.workflows.includes('ride-matching')) {
        triggeredWorkflows.push('ride-matching');
      }

      // Execute Cloud Workflow for each triggered workflow
      for (const workflow of triggeredWorkflows) {
        await this.executeWorkflow(brandName, workflow, payload);
      }

      // Send Slack notification
      await this.sendSlackNotification(brandName, payload, triggeredWorkflows);

      return { brand: brandName, workflows_triggered: triggeredWorkflows };
    } catch (error) {
      console.error(`✗ Failed to process DNS change for ${brandName}:`, error);
      throw error;
    }
  }

  /**
   * Execute Cloud Workflow
   */
  async executeWorkflow(brandName, workflowName, workflowData) {
    try {
      const projectId = 'saferide-peld8';
      const location = 'us-central1';
      
      const executionName = `${projectId}-${brandName}-${workflowName}-${Date.now()}`;

      // This would call Google Cloud Workflows API
      // For now, we log the workflow execution
      await db.collection('workflow_executions').add({
        brand: brandName,
        workflow_name: workflowName,
        execution_name: executionName,
        input_data: workflowData,
        status: 'SCHEDULED',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        location: location
      });

      console.log(`✓ Workflow scheduled: ${workflowName} for ${brandName}`);
      return { workflow: workflowName, status: 'SCHEDULED' };
    } catch (error) {
      console.error(`✗ Failed to execute workflow ${workflowName}:`, error);
      throw error;
    }
  }

  /**
   * Send Slack notification for workflow event
   */
  async sendSlackNotification(brandName, payload, triggeredWorkflows) {
    try {
      const config = BRAND_WEBHOOKS[brandName];
      const slackWebhookUrl = process.env[`SLACK_WEBHOOK_${config.slack_channel.toUpperCase()}`];

      if (!slackWebhookUrl) {
        console.warn(`Slack webhook URL not configured for ${config.slack_channel}`);
        return;
      }

      const message = {
        text: `🔗 DNS Webhook Triggered`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${config.name}*\n*Domain:* ${config.domain}\n*Event:* DNS Change`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Record Type:*\n${payload.change_type}`
              },
              {
                type: 'mrkdwn',
                text: `*Workflows Triggered:*\n${triggeredWorkflows.join(', ')}`
              }
            ]
          }
        ]
      };

      await axios.post(slackWebhookUrl, message);
      console.log(`✓ Slack notification sent to #${config.slack_channel}`);
    } catch (error) {
      console.error(`✗ Failed to send Slack notification:`, error);
    }
  }

  /**
   * Webhook health check endpoint
   */
  async getWebhookStatus(brandName) {
    try {
      const webhook = await db.collection(this.webhookCollection).doc(brandName).get();
      
      if (!webhook.exists) {
        return { status: 'NOT_FOUND', brand: brandName };
      }

      const data = webhook.data();
      
      // Get recent events
      const recentEvents = await db
        .collection(this.eventLogCollection)
        .where('brand', '==', brandName)
        .orderBy('timestamp', 'desc')
        .limit(5)
        .get();

      return {
        status: data.enabled ? 'ACTIVE' : 'INACTIVE',
        brand: brandName,
        webhook_url: data.webhook_url,
        domain: data.domain,
        workflows: data.workflows,
        last_triggered: data.last_triggered,
        recent_events: recentEvents.docs.map(doc => ({
          event_type: doc.data().event_type,
          timestamp: doc.data().timestamp,
          status: doc.data().status
        }))
      };
    } catch (error) {
      console.error(`✗ Failed to get webhook status for ${brandName}:`, error);
      throw error;
    }
  }

  /**
   * Update webhook status
   */
  async updateWebhookStatus(brandName, enabled) {
    try {
      await db.collection(this.webhookCollection).doc(brandName).update({
        enabled: enabled,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { brand: brandName, enabled: enabled, status: 'UPDATED' };
    } catch (error) {
      console.error(`✗ Failed to update webhook status:`, error);
      throw error;
    }
  }
}

module.exports = WebhookOrchestrator;

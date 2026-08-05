/**
 * FIREBASE & GODADDY WEBHOOK INTEGRATION SYSTEM
 * Real-time event-driven architecture with Slack notifications
 * 
 * Integrates:
 * - Firebase Cloud Functions (scheduled & triggered)
 * - Firestore listeners & triggers
 * - Cloud Pub/Sub for async workflows
 * - Cloud Tasks for delayed operations
 * - Cloud Scheduler for cron jobs
 * - GoDaddy DNS API webhooks
 * - Firebase Realtime Database listeners
 * - Firebase Authentication events
 * - Slack notifications for all events
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const axios = require('axios');
const crypto = require('crypto');
const { createGoDaddyClient } = require('./godaddy-client');

const db = admin.firestore();
const pubsub = admin.pubsub();

class WebhookManager {
  constructor(brandName) {
    this.brandName = brandName;
    this.collection = `brands/${brandName}/webhooks`;
    this.eventsCollection = `brands/${brandName}/events`;
    this.slackWebhooks = {};
  }

  /**
   * SLACK NOTIFICATION SYSTEM
   */

  // Initialize Slack webhook URLs
  async initializeSlackWebhooks(webhookConfig) {
    this.slackWebhooks = {
      deployments: webhookConfig.deployments,
      alerts: webhookConfig.alerts,
      analytics: webhookConfig.analytics,
      authentication: webhookConfig.authentication,
      operations: webhookConfig.operations,
    };

    // Store in Firestore for persistence
    await db.collection(this.collection).doc('slack-config').set({
      webhooks: this.slackWebhooks,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Send Slack notification
  async sendSlackNotification(channel, message, details = {}) {
    const webhook = this.slackWebhooks[channel];

    if (!webhook) {
      console.error(`No Slack webhook configured for channel: ${channel}`);
      return;
    }

    const payload = {
      text: message,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${this.brandName.toUpperCase()}* - ${message}`,
          },
        },
        ...this._buildDetailBlocks(details),
      ],
      attachments: [
        {
          color: details.status === 'success' ? 'good' : details.status === 'error' ? 'danger' : 'warning',
          timestamp: Math.floor(Date.now() / 1000),
        },
      ],
    };

    try {
      await axios.post(webhook, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json' },
      });

      // Log notification
      await this._logEvent('slack_notification', {
        channel,
        message,
        status: 'sent',
      });
    } catch (error) {
      console.error(`Failed to send Slack notification: ${error.message}`);
      await this._logEvent('slack_notification', {
        channel,
        message,
        status: 'failed',
        error: error.message,
      });
    }
  }

  /**
   * FIREBASE DEPLOYMENT WEBHOOKS
   */

  // Listen to Cloud Functions deployment events
  async onFunctionDeployed(functionName) {
    const message = `🚀 Cloud Function Deployed: ${functionName}`;

    await this.sendSlackNotification('deployments', message, {
      status: 'success',
      component: 'Cloud Functions',
      function: functionName,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to Firestore deployment events
  async onFirestoreDeployed() {
    const message = `📊 Firestore Rules Deployed`;

    await this.sendSlackNotification('deployments', message, {
      status: 'success',
      component: 'Firestore',
      timestamp: new Date().toISOString(),
    });
  }

  // Listen to Hosting deployment events
  async onHostingDeployed(site, version) {
    const message = `🌐 Hosting Deployed: ${site} (v${version})`;

    await this.sendSlackNotification('deployments', message, {
      status: 'success',
      component: 'Firebase Hosting',
      site,
      version,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * FIRESTORE DOCUMENT TRIGGERS
   */

  // Create trigger on document write
  async onDocumentWrite(path, handler) {
    return functions.firestore
      .document(path)
      .onWrite(async (change, context) => {
        const data = change.after.data();
        const previousData = change.before.data();

        await this.sendSlackNotification('operations', `📝 Document Updated: ${path}`, {
          status: 'info',
          documentId: context.params.id,
          action: change.after.exists ? (change.before.exists ? 'updated' : 'created') : 'deleted',
          timestamp: new Date().toISOString(),
        });

        return handler(change, context);
      });
  }

  // Create trigger on document delete
  async onDocumentDelete(path, handler) {
    return functions.firestore
      .document(path)
      .onDelete(async (snap, context) => {
        const data = snap.data();

        await this.sendSlackNotification('operations', `🗑️ Document Deleted: ${path}`, {
          status: 'warning',
          documentId: context.params.id,
          timestamp: new Date().toISOString(),
        });

        return handler(snap, context);
      });
  }

  /**
   * REAL-TIME DATABASE WEBHOOKS
   */

  // Listen to Realtime Database events
  async onRealtimeDatabaseWrite(path, handler) {
    const db = admin.database();

    const ref = db.ref(path);

    ref.on('value', async (snapshot) => {
      const data = snapshot.val();

      await this.sendSlackNotification('operations', `🔄 Realtime DB Updated: ${path}`, {
        status: 'info',
        path,
        dataSize: JSON.stringify(data).length,
        timestamp: new Date().toISOString(),
      });

      handler(snapshot);
    });
  }

  /**
   * CLOUD SCHEDULER - CRON JOBS
   */

  // Schedule recurring operation with webhook notification
  async scheduleOperation(name, schedule, handler) {
    const scheduledFunction = functions.pubsub
      .schedule(schedule)
      .onRun(async (context) => {
        const startTime = Date.now();

        try {
          const result = await handler();

          const duration = Date.now() - startTime;

          await this.sendSlackNotification('operations', `⏰ Scheduled Job: ${name} (${duration}ms)`, {
            status: 'success',
            job: name,
            schedule,
            duration,
            timestamp: new Date().toISOString(),
          });

          return result;
        } catch (error) {
          await this.sendSlackNotification('alerts', `❌ Scheduled Job Failed: ${name}`, {
            status: 'error',
            job: name,
            error: error.message,
            timestamp: new Date().toISOString(),
          });

          throw error;
        }
      });

    return scheduledFunction;
  }

  /**
   * CLOUD TASKS - DELAYED & QUEUED OPERATIONS
   */

  // Create async task with webhook callback
  async createTask(queueName, taskData, delaySeconds = 0) {
    const cloudTasks = require('@google-cloud/tasks');
    const client = new cloudTasks.CloudTasksClient();

    const project = process.env.GCLOUD_PROJECT;
    const queue = queueName;
    const location = 'us-central1';

    const parent = client.queuePath(project, location, queue);

    const task = {
      httpRequest: {
        httpMethod: 'POST',
        url: `https://us-central1-${project}.cloudfunctions.net/task-handler`,
        headers: { 'Content-Type': 'application/json' },
        body: Buffer.from(JSON.stringify(taskData)).toString('base64'),
      },
    };

    if (delaySeconds > 0) {
      task.scheduleTime = {
        seconds: Math.floor(Date.now() / 1000) + delaySeconds,
      };
    }

    try {
      const [response] = await client.createTask({ parent, task });

      await this.sendSlackNotification('operations', `📋 Task Queued: ${queueName}`, {
        status: 'success',
        queue: queueName,
        taskId: response.name,
        delaySeconds,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      await this.sendSlackNotification('alerts', `❌ Task Creation Failed: ${queueName}`, {
        status: 'error',
        queue: queueName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  /**
   * CLOUD PUB/SUB - ASYNC MESSAGE QUEUE
   */

  // Publish message to Pub/Sub topic
  async publishMessage(topicName, messageData) {
    const topic = pubsub.topic(topicName);

    try {
      const messageId = await topic.publish(Buffer.from(JSON.stringify(messageData)));

      await this.sendSlackNotification('operations', `📤 Message Published: ${topicName}`, {
        status: 'success',
        topic: topicName,
        messageId,
        timestamp: new Date().toISOString(),
      });

      return messageId;
    } catch (error) {
      await this.sendSlackNotification('alerts', `❌ Publish Failed: ${topicName}`, {
        status: 'error',
        topic: topicName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  // Subscribe to Pub/Sub topic
  async subscribeToTopic(topicName, subscriptionName, handler) {
    const subscription = pubsub.subscription(subscriptionName);

    const messageHandler = async (message) => {
      try {
        const data = JSON.parse(message.data.toString());

        await handler(data);

        message.ack();

        await this.sendSlackNotification('operations', `📥 Message Received: ${topicName}`, {
          status: 'success',
          topic: topicName,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error processing message: ${error.message}`);
        message.nack();

        await this.sendSlackNotification('alerts', `❌ Message Processing Failed: ${topicName}`, {
          status: 'error',
          topic: topicName,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    };

    subscription.on('message', messageHandler);
  }

  /**
   * FIREBASE AUTHENTICATION WEBHOOKS
   */

  // Listen to user creation
  async onUserCreated(handler) {
    return functions.auth.user().onCreate(async (user) => {
      await this.sendSlackNotification('authentication', `👤 New User: ${user.email || user.uid}`, {
        status: 'success',
        uid: user.uid,
        email: user.email,
        provider: user.providerData.map(p => p.providerId).join(', '),
        timestamp: new Date().toISOString(),
      });

      return handler(user);
    });
  }

  // Listen to user deletion
  async onUserDeleted(handler) {
    return functions.auth.user().onDelete(async (user) => {
      await this.sendSlackNotification('authentication', `🗑️ User Deleted: ${user.email || user.uid}`, {
        status: 'warning',
        uid: user.uid,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      return handler(user);
    });
  }

  /**
   * GODADDY DNS WEBHOOKS
   */

  // Register GoDaddy DNS webhook
  async registerGoDaddyWebhook(domainName, callbackUrl) {
    const godaddyKey = process.env.GODADDY_API_KEY;
    const godaddySecret = process.env.GODADDY_API_SECRET;

    if (!godaddyKey || !godaddySecret) {
      throw new Error('GoDaddy API credentials not configured');
    }

    try {
      const godaddyClient = createGoDaddyClient({
        apiKey: godaddyKey,
        apiSecret: godaddySecret,
      });

      await godaddyClient.domains.get({ domain: domainName });

      const response = await axios.post(
        `https://api.godaddy.com/v1/domains/${domainName}/webhook`,
        {
          url: callbackUrl,
          events: ['dns_update', 'domain_renewal', 'domain_expiration'],
        },
        {
          headers: {
            'Authorization': `sso-key ${godaddyKey}:${godaddySecret}`,
            'Content-Type': 'application/json',
          },
        }
      );

      await this.sendSlackNotification('operations', `🌐 GoDaddy Webhook Registered: ${domainName}`, {
        status: 'success',
        domain: domainName,
        events: ['dns_update', 'domain_renewal', 'domain_expiration'],
        timestamp: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      await this.sendSlackNotification('alerts', `❌ GoDaddy Webhook Registration Failed: ${domainName}`, {
        status: 'error',
        domain: domainName,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  // Handle GoDaddy DNS update webhook
  async handleGoDaddyWebhook(payload, signature) {
    // Verify webhook signature
    const isValid = this._verifyGoDaddySignature(payload, signature);

    if (!isValid) {
      throw new Error('Invalid GoDaddy webhook signature');
    }

    await this.sendSlackNotification('operations', `🌐 GoDaddy DNS Updated`, {
      status: 'info',
      domain: payload.domain,
      event: payload.event,
      timestamp: new Date().toISOString(),
    });

    // Log event
    await this._logEvent('godaddy_webhook', payload);
  }

  /**
   * WORKFLOW WEBHOOKS
   */

  // Create workflow webhook
  async createWorkflowWebhook(workflowName, triggerEvents) {
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const webhookDoc = {
      webhookId,
      workflowName,
      triggerEvents,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true,
    };

    await db.collection(`${this.collection}/workflow-hooks`).doc(webhookId).set(webhookDoc);

    await this.sendSlackNotification('operations', `🔗 Workflow Webhook Created: ${workflowName}`, {
      status: 'success',
      workflow: workflowName,
      webhookId,
      events: triggerEvents,
      timestamp: new Date().toISOString(),
    });

    return webhookId;
  }

  // Trigger workflow via webhook
  async triggerWorkflowWebhook(webhookId, eventData) {
    const webhookDoc = await db.collection(`${this.collection}/workflow-hooks`).doc(webhookId).get();

    if (!webhookDoc.exists) {
      throw new Error(`Webhook not found: ${webhookId}`);
    }

    const webhook = webhookDoc.data();

    // Check if event type matches trigger events
    if (!webhook.triggerEvents.includes(eventData.type)) {
      console.log(`Event type ${eventData.type} not in trigger events`);
      return;
    }

    // Execute workflow
    await this.publishMessage(`workflow-${webhook.workflowName}`, eventData);

    await this.sendSlackNotification('operations', `▶️ Workflow Triggered: ${webhook.workflowName}`, {
      status: 'success',
      workflow: webhook.workflowName,
      event: eventData.type,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * MONITORING & ANALYTICS WEBHOOKS
   */

  // Send performance metrics to Slack
  async sendPerformanceMetrics(metrics) {
    const criticalThreshold = 1000; // 1 second
    const warningThreshold = 500; // 500ms

    const status = metrics.averageLatency > criticalThreshold ? 'error' : 
                   metrics.averageLatency > warningThreshold ? 'warning' : 'success';

    await this.sendSlackNotification('analytics', `📊 Performance Metrics`, {
      status,
      averageLatency: `${metrics.averageLatency}ms`,
      errorRate: `${metrics.errorRate}%`,
      requestsPerSecond: metrics.rps,
      timestamp: new Date().toISOString(),
    });
  }

  // Send error alerts to Slack
  async sendErrorAlert(error, context) {
    await this.sendSlackNotification('alerts', `❌ Error Alert`, {
      status: 'error',
      errorMessage: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * PRIVATE HELPER METHODS
   */

  _buildDetailBlocks(details) {
    const blocks = [];

    if (Object.keys(details).length > 0) {
      const detailText = Object.entries(details)
        .map(([key, value]) => `• *${key}:* ${value}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: detailText,
        },
      });
    }

    return blocks;
  }

  _verifyGoDaddySignature(payload, signature) {
    // Implement GoDaddy signature verification
    // This is a simplified example
    const secret = process.env.GODADDY_WEBHOOK_SECRET;
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return computedSignature === signature;
  }

  async _logEvent(eventType, data) {
    await db.collection(this.eventsCollection).add({
      eventType,
      data,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

module.exports = WebhookManager;

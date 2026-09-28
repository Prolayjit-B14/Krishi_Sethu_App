/**
 * AgriSense Pro v17.2.0 MQTT Service
 * Manages real-time telemetry stream and command publishing to hardware nodes.
 * 
 * FIX LOG:
 * - v17.2.0: Increased keepalive from 10s → 60s to prevent HiveMQ Cloud disconnects.
 *            Added reconnectPeriod 5000ms (was 3000ms) to prevent reconnect storms.
 *            Added error logging for JSON parse failures during development.
 */

import mqtt from 'mqtt';
import { MASTER_CONFIG } from '../setup';

const { connect } = mqtt;

const MQTT_CONFIG = {
  host: MASTER_CONFIG.MQTT_BROKER,
  port: MASTER_CONFIG.MQTT_WSS_PORT,
  protocol: 'wss',
  path: '/mqtt',
  username: MASTER_CONFIG.MQTT_USER,
  password: MASTER_CONFIG.MQTT_PASS
};

const isDev = import.meta.env.DEV;

class MqttService {
  constructor() {
    this.client = null;
    this.onMessage = null;
    this.onStatus = null;
    this.url = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}${MQTT_CONFIG.path}`;
  }

  connect(primaryId, secondaryId, onMessageCallback, onStatusCallback) {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
    
    const normalize = (val, fallback) => (val || fallback).trim().toLowerCase().replace(/[\s-]+/g, '_');
    
    this.rawPrimaryId = (primaryId || 'agrisense_pro').trim();
    this.primaryId   = normalize(primaryId, 'agrisense_pro');
    this.secondaryId = normalize(secondaryId, 'field_b');
    this.onMessage   = onMessageCallback;
    this.onStatus    = onStatusCallback;

    // ✅ FIX: Use raw email for topic (normalize was corrupting email addresses with hyphens)
    // The topic must match exactly what the firmware publishes:
    // agrisense/{USER_EMAIL}/field_b/sensors
    const rawPrimary = (primaryId || 'agrisense_pro').trim();
    const pairedTopic = `agrisense/${rawPrimary}/field_b/#`;
    
    if (isDev) console.log(`[MQTT] 🔌 Connecting... Topic: ${pairedTopic}`);
    this.onStatus?.('connecting');

    try {
      this.client = connect(this.url, {
        reconnectPeriod: 5000,       // ✅ FIX: was 3000ms - increased to prevent reconnect storms
        connectTimeout: 30 * 1000,
        keepalive: 60,               // ✅ FIX: was 10s - HiveMQ Cloud needs ≥60s for cellular stability
        clientId: 'agrisense_web_' + Math.random().toString(16).slice(2, 10),
        username: MQTT_CONFIG.username,
        password: MQTT_CONFIG.password,
        clean: true,
        rejectUnauthorized: !isDev
      });

      this.client.on('connect', () => {
        this.onStatus?.('connected');
        if (isDev) console.log(`[MQTT] ✅ Connected. Subscribing to: ${pairedTopic}`);
        this.client.subscribe(pairedTopic, { qos: 0 }, (err) => {
          if (err) console.error('[MQTT_ERROR] ❌ Subscription Failed', err);
          else if (isDev) console.log(`[MQTT] 📡 Subscribed to: ${pairedTopic}`);
        });
      });

      this.client.on('message', (topic, message) => {
        const rawData = message.toString();
        try {
          const parsedData = JSON.parse(rawData);
          if (this.onMessage) this.onMessage(topic, parsedData);
        } catch (e) {
          // ✅ FIX: Log parse errors in dev, silently ignore in production
          if (isDev) console.warn('[MQTT] ⚠️ JSON parse failed for topic:', topic, '| Raw:', rawData.slice(0, 100));
        }
      });

      this.client.on('error', (err) => {
        if (isDev) console.error('[MQTT] ❌ Connection Error:', err.message);
        this.onStatus?.('error');
      });

      this.client.on('close', () => {
        if (isDev) console.log('[MQTT] 🔌 Connection closed.');
        this.onStatus?.('disconnected');
      });
      
      this.client.on('reconnect', () => {
        if (isDev) console.log('[MQTT] 🔄 Reconnecting...');
        this.onStatus?.('reconnecting');
      });

    } catch (err) {
      console.error('[MQTT] ❌ Fatal connect error:', err);
      this.onStatus?.('error');
    }
  }

  publishCommand(action) {
    if (this.client) {
      // 🛡️ SECURITY: Only authenticated, non-guest users can publish physical actuator commands
      const primary = this.rawPrimaryId;
      if (!primary || primary === 'agrisense_pro' || primary.startsWith('guest')) {
        if (isDev) console.warn('[MQTT] ⚠️ Command publication blocked: guest/unbound session');
        return;
      }

      const topic = `agrisense/${primary}/field_b/commands`;
      const message = JSON.stringify(action);
      this.client.publish(topic, message, { qos: 0 });
      if (isDev) console.log('[MQTT] 📤 Command published to:', topic, action);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
  }

  refresh() {
    const oldCb = this.onMessage;
    const oldSt = this.onStatus;
    const oldPrimary = this.rawPrimaryId;
    const oldSecondary = this.secondaryId;
    this.disconnect();
    setTimeout(() => {
      this.connect(oldPrimary, oldSecondary, oldCb, oldSt);
    }, 500);
  }
}

const mqttService = new MqttService();
export default mqttService;

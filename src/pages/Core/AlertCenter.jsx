import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { 
  AlertTriangle, Thermometer, Droplets, WifiOff, 
  CheckCircle2, Trash2, ChevronRight, 
  ArrowLeft, Cpu, ShieldAlert, X, Check,
  MessageSquare, Send, Bell, BellOff
} from 'lucide-react';
import { dispatchSmsToWorker, formatSmsAlert, DEFAULT_FIELD_CONTACTS } from '../../api/smsService';

const FILTER_OPTIONS = ['All', 'Critical', 'Warning', 'Info'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const readLS = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

const DEFAULT_RANGES = {
  soilMoisture:    { min: 30,  max: 80  },
  airTemperature:  { min: 10,  max: 40  },
  soilPh:          { min: 5.5, max: 7.5 },
  humidity:        { min: 40,  max: 90  },
};

const DEFAULT_ALERTS = {
  lowRangeAlert:  true,
  highRangeAlert: true,
  criticalAlert:  true,
};

// ─── Alert sound (Web Audio API — no file needed) ────────────────────────────
const playAlertBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) { /* browser may block autoplay */ }
};

const AlertCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { farmInfo } = useApp();
  const { sensorData, mqttStatus, lastGlobalUpdate } = useTelemetry();

  // ── Read notification settings from localStorage (live with Settings) ──
  const notifSettings    = readLS('krishi_sethu_alerts', DEFAULT_ALERTS);
  const sensorRanges     = readLS('krishi_sethu_sensor_ranges', DEFAULT_RANGES);
  const alertSoundsOn    = readLS('krishi_sethu_alert_sounds', true) === true
                           || readLS('krishi_sethu_alert_sounds', true) === 'true'
                           || readLS('krishi_sethu_alert_sounds', true) === false ? readLS('krishi_sethu_alert_sounds', true) : true;
  const pushNotifOn      = readLS('krishi_sethu_push_notifications', true) === true
                           || readLS('krishi_sethu_push_notifications', true) === 'true';

  const [activeFilter, setActiveFilter]     = useState('All');
  const [selectedAlert, setSelectedAlert]   = useState(location.state?.alert || null);
  const [dismissedIds, setDismissedIds]     = useState([]);
  const [smsModalAlert, setSmsModalAlert]   = useState(null);
  const [selectedContact, setSelectedContact] = useState(DEFAULT_FIELD_CONTACTS[0]);
  const [smsDraftText, setSmsDraftText]     = useState('');
  const [smsSentNotice, setSmsSentNotice]   = useState(null);
  const prevAlertCountRef = useRef(0);

  // ── Threshold helpers ─────────────────────────────────────────────────────
  const r = (key) => sensorRanges?.[key] || DEFAULT_RANGES[key] || { min: 0, max: 9999 };
  const isCritical  = (val, key) => val < r(key).min;       // below min = critical low
  const isHighWarn  = (val, key) => val > r(key).max;        // above max = high warning

  // ── Generate real-time alerts honoring notification settings ──────────────
  const telemetryAlerts = useMemo(() => {
    const list = [];
    const ts   = lastGlobalUpdate || 'Live';

    // 1. Soil Moisture ─ Critical (below min threshold)
    const moisture = sensorData?.soil?.moisture;
    if (notifSettings.criticalAlert && moisture != null && isCritical(moisture, 'soilMoisture')) {
      list.push({
        id: 'alt-moisture-crit',
        title: 'Soil Moisture Critical Low',
        node: 'SOIL-01', sensor: 'Soil Moisture', sensorId: 'moisture',
        value: `${moisture} %`, threshold: `${r('soilMoisture').min} %`,
        message: `Node: SOIL-01 • Current moisture ${moisture}% is below safe threshold (${r('soilMoisture').min}%).`,
        recommendation: 'Initiate zone irrigation or activate the irrigation pump relay.',
        severity: 'Critical', time: ts,
        icon: Droplets, color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5'
      });
    }

    // 2. Soil Moisture ─ High Warning (above max)
    if (notifSettings.highRangeAlert && moisture != null && isHighWarn(moisture, 'soilMoisture')) {
      list.push({
        id: 'alt-moisture-high',
        title: 'Soil Moisture Excessive',
        node: 'SOIL-01', sensor: 'Soil Moisture', sensorId: 'moisture',
        value: `${moisture} %`, threshold: `${r('soilMoisture').max} %`,
        message: `Node: SOIL-01 • Moisture ${moisture}% exceeds max threshold (${r('soilMoisture').max}%). Risk of waterlogging.`,
        recommendation: 'Pause irrigation. Check field drainage.',
        severity: 'Warning', time: ts,
        icon: Droplets, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A'
      });
    }

    // 3. MQTT Offline ─ always Critical (gateway level)
    if (notifSettings.criticalAlert && mqttStatus !== 'connected') {
      list.push({
        id: 'alt-mqtt-offline',
        title: 'IoT Telemetry Gateway Offline',
        node: 'GATEWAY-01', sensor: 'MQTT WSS Stream', sensorId: null,
        value: 'Disconnected', threshold: 'Connected',
        message: 'Broker connection interrupted. Sensors operating in local buffer mode.',
        recommendation: 'Check WiFi network and MQTT HiveMQ broker credentials.',
        severity: 'Critical', time: ts,
        icon: WifiOff, color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5'
      });
    }

    // 4. Air Temperature ─ High Warning
    const temp = sensorData?.weather?.temp;
    if (notifSettings.highRangeAlert && temp != null && isHighWarn(temp, 'airTemperature')) {
      list.push({
        id: 'alt-weather-heat',
        title: 'High Ambient Temperature',
        node: 'WEATHER-01', sensor: 'Air Temperature', sensorId: 'weather_temp',
        value: `${temp} °C`, threshold: `${r('airTemperature').max} °C`,
        message: `Node: WEATHER-01 • Heat stress detected (${temp}°C). Max threshold: ${r('airTemperature').max}°C.`,
        recommendation: 'Increase shade net coverage and schedule evening irrigation.',
        severity: 'Warning', time: ts,
        icon: Thermometer, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A'
      });
    }

    // Low temperature warning
    if (notifSettings.lowRangeAlert && temp != null && isCritical(temp, 'airTemperature')) {
      list.push({
        id: 'alt-weather-cold',
        title: 'Low Ambient Temperature',
        node: 'WEATHER-01', sensor: 'Air Temperature', sensorId: 'weather_temp',
        value: `${temp} °C`, threshold: `${r('airTemperature').min} °C`,
        message: `Node: WEATHER-01 • Cold stress detected (${temp}°C). Min threshold: ${r('airTemperature').min}°C.`,
        recommendation: 'Cover crops with frost protection. Check heating systems.',
        severity: 'Warning', time: ts,
        icon: Thermometer, color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD'
      });
    }

    // 5. Soil pH
    const ph = sensorData?.soil?.ph;
    if (ph != null) {
      if (notifSettings.lowRangeAlert && ph < r('soilPh').min) {
        list.push({
          id: 'alt-soil-ph-low',
          title: 'Soil pH Too Acidic',
          node: 'SOIL-01', sensor: 'Soil pH', sensorId: 'ph',
          value: `${ph} pH`, threshold: `≥ ${r('soilPh').min} pH`,
          message: `Node: SOIL-01 • pH level (${ph}) below safe range.`,
          recommendation: 'Apply agricultural lime to raise soil pH.',
          severity: 'Warning', time: ts,
          icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A'
        });
      }
      if (notifSettings.highRangeAlert && ph > r('soilPh').max) {
        list.push({
          id: 'alt-soil-ph-high',
          title: 'Soil pH Too Alkaline',
          node: 'SOIL-01', sensor: 'Soil pH', sensorId: 'ph',
          value: `${ph} pH`, threshold: `≤ ${r('soilPh').max} pH`,
          message: `Node: SOIL-01 • pH level (${ph}) above safe range.`,
          recommendation: 'Apply gypsum or organic compost to buffer pH.',
          severity: 'Warning', time: ts,
          icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A'
        });
      }
    }

    // 6. Nominal fallback
    if (list.length === 0) {
      list.push({
        id: 'alt-sys-nominal',
        title: 'All Sensor Nodes Nominal',
        node: 'SOIL-01 and WEATHER-01', sensor: 'All Sensors', sensorId: null,
        value: 'Optimal', threshold: 'Within Limits',
        message: 'All connected IoT nodes are operating within your configured agro-climatic thresholds.',
        recommendation: 'Standard crop monitoring routine in progress.',
        severity: 'Info', time: ts,
        icon: CheckCircle2, color: '#0EA5E9', bg: '#F0F9FF', border: '#BAE6FD'
      });
    }

    return list.filter(a => !dismissedIds.includes(a.id));
  }, [sensorData, mqttStatus, lastGlobalUpdate, dismissedIds, notifSettings, sensorRanges]);

  // ── Play sound when new critical/warning alert appears ────────────────────
  useEffect(() => {
    const newCount = telemetryAlerts.filter(a => a.severity !== 'Info').length;
    if (alertSoundsOn && newCount > prevAlertCountRef.current) {
      playAlertBeep();
    }
    prevAlertCountRef.current = newCount;
  }, [telemetryAlerts, alertSoundsOn]);

  // ── Push notification (browser Notification API) ──────────────────────────
  useEffect(() => {
    if (!pushNotifOn) return;
    const critical = telemetryAlerts.find(a => a.severity === 'Critical' && !dismissedIds.includes(a.id));
    if (!critical) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('🚨 KrishiSethu Alert', {
        body: critical.title + '\n' + critical.message,
        icon: '/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') {
          new Notification('🚨 KrishiSethu Alert', {
            body: critical.title + '\n' + critical.message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  }, [telemetryAlerts.map(a => a.id).join(',')]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'All') return telemetryAlerts;
    return telemetryAlerts.filter(a => a.severity.toLowerCase() === activeFilter.toLowerCase());
  }, [activeFilter, telemetryAlerts]);

  const handleDismissAlert = (alertId) => {
    setDismissedIds(prev => [...prev, alertId]);
    if (selectedAlert?.id === alertId) setSelectedAlert(null);
  };
  const handleClearAll = () => {
    setDismissedIds(telemetryAlerts.map(a => a.id));
    setSelectedAlert(null);
  };
  const handleInvestigateSensor = (sensorId) => {
    if (sensorId) navigate('/sensor-detail', { state: { sensorId, from: '/alerts' } });
    else navigate('/device-area');
  };

  // ── Notification status badges ─────────────────────────────────────────────
  const criticalCount = telemetryAlerts.filter(a => a.severity === 'Critical').length;
  const warningCount  = telemetryAlerts.filter(a => a.severity === 'Warning').length;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '16px', background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box', minHeight: '100%'
    }}>

      {/* ─── DETAIL VIEW ─────────────────────────────────────────────────── */}
      {selectedAlert ? (
        <motion.div
          key="detail-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ marginBottom: 14 }}>
            <button
              onClick={() => setSelectedAlert(null)}
              style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-main)',
                borderRadius: 12, padding: '6px 14px',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to All Alerts</span>
            </button>
          </div>

          {/* Alert Header */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 26, padding: '22px 20px',
            border: '1px solid var(--border-main)', boxShadow: 'var(--shadow-md)',
            marginBottom: 16, position: 'relative'
          }}>
            <div style={{
              position: 'absolute', top: 20, right: 20,
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 14,
              background: selectedAlert.bg, border: `1px solid ${selectedAlert.border}`,
              color: selectedAlert.color, fontSize: '0.72rem', fontWeight: 800
            }}>
              <span>●</span><span>{selectedAlert.severity}</span>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: selectedAlert.bg, border: `1px solid ${selectedAlert.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: selectedAlert.color, marginBottom: 14
            }}>
              <selectedAlert.icon size={24} strokeWidth={2.3} />
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {selectedAlert.title}
            </h3>
            <p style={{ margin: '0 0 10px', fontSize: '0.84rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>
              {selectedAlert.message}
            </p>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-inactive)', fontWeight: 600 }}>
              Timestamp: {selectedAlert.time}
            </div>
          </div>

          {/* Spec Table */}
          <div style={{
            background: 'var(--bg-card)', borderRadius: 22, padding: '16px 20px',
            border: '1px solid var(--border-main)', boxShadow: 'var(--shadow-sm)', marginBottom: 16
          }}>
            {[
              { label: 'Host Node',         value: selectedAlert.node,           color: 'var(--text-main)' },
              { label: 'Sensor Channel',    value: selectedAlert.sensor,         color: 'var(--text-main)' },
              { label: 'Current Reading',   value: selectedAlert.value,          color: selectedAlert.color, bold: true },
              { label: 'Safe Threshold',    value: selectedAlert.threshold,      color: 'var(--text-main)' },
              { label: 'Recommended Action',value: selectedAlert.recommendation, color: '#15803D', bold: true }
            ].map((item, idx, arr) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                padding: '10px 0', gap: 12,
                borderBottom: idx < arr.length - 1 ? '1px solid var(--border-main)' : 'none'
              }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: '0.84rem', fontWeight: item.bold ? 800 : 600, color: item.color, textAlign: 'right' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, paddingBottom: 14, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDismissAlert(selectedAlert.id)}
              style={{
                flex: 1, minWidth: 110, height: 46, borderRadius: 16,
                background: 'var(--bg-card)', border: '1.5px solid var(--border-main)',
                color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 800,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              <Check size={16} /><span>Dismiss</span>
            </button>
            <button
              onClick={() => {
                setSmsDraftText(formatSmsAlert(selectedAlert, farmInfo?.name));
                setSmsModalAlert(selectedAlert);
              }}
              style={{
                flex: 1, minWidth: 130, height: 46, borderRadius: 16,
                background: '#0284C7', border: 'none', color: '#FFFFFF',
                fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(2,132,199,0.25)'
              }}
            >
              <MessageSquare size={16} /><span>Broadcast SMS</span>
            </button>
            {selectedAlert.sensorId && (
              <button
                onClick={() => handleInvestigateSensor(selectedAlert.sensorId)}
                style={{
                  flex: 1, minWidth: 120, height: 46, borderRadius: 16,
                  background: '#15803D', border: 'none', color: '#FFFFFF',
                  fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(21,128,61,0.25)'
                }}
              >
                <Cpu size={16} /><span>Investigate</span>
              </button>
            )}
          </div>
        </motion.div>

      ) : (
        /* ─── LIST VIEW ──────────────────────────────────────────────────── */
        <motion.div
          key="list-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          {/* Notification status bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14, gap: 8, flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {criticalCount > 0 && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                  background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5'
                }}>
                  {criticalCount} Critical
                </span>
              )}
              {warningCount > 0 && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                  background: '#FFFBEB', color: '#F59E0B', border: '1px solid #FDE68A'
                }}>
                  {warningCount} Warning
                </span>
              )}
              {criticalCount === 0 && warningCount === 0 && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20,
                  background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0'
                }}>
                  All Clear
                </span>
              )}
            </div>

            {/* Notification toggles status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {pushNotifOn
                ? <Bell size={14} color="#10B981" />
                : <BellOff size={14} color="#94A3B8" />
              }
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: pushNotifOn ? '#10B981' : '#94A3B8' }}>
                {pushNotifOn ? 'Push On' : 'Push Off'}
              </span>
            </div>
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
            {FILTER_OPTIONS.map(filter => {
              const isSelected = activeFilter === filter;
              const count = filter === 'All' ? telemetryAlerts.length
                : telemetryAlerts.filter(a => a.severity === filter).length;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '6px 16px', borderRadius: 20,
                    border: isSelected ? 'none' : '1px solid var(--border-main)',
                    background: isSelected ? '#15803D' : 'var(--bg-card)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '0.82rem', fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: isSelected ? '0 4px 12px rgba(21,128,61,0.25)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 5
                  }}
                >
                  {filter}
                  {count > 0 && (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 900,
                      background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-main)',
                      padding: '1px 5px', borderRadius: 8
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Alert Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
              const Icon = alert.icon;
              return (
                <motion.div
                  key={alert.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAlert(alert)}
                  style={{
                    background: 'var(--bg-card)', borderRadius: 22,
                    padding: '16px 18px', border: '1px solid var(--border-main)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 14, cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 14,
                      background: alert.bg, border: `1px solid ${alert.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: alert.color, flexShrink: 0
                    }}>
                      <Icon size={22} strokeWidth={2.2} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                        {alert.title}
                      </h4>
                      <div style={{
                        fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3, fontWeight: 600,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {alert.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-inactive)', marginTop: 3, fontWeight: 500 }}>
                        Node: {alert.node} • {alert.value}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '4px 10px', borderRadius: 12,
                      background: alert.bg, border: `1px solid ${alert.border}`,
                      color: alert.color, fontSize: '0.72rem', fontWeight: 800
                    }}>
                      {alert.severity}
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </motion.div>
              );
            }) : (
              <div style={{
                background: 'var(--bg-card)', borderRadius: 24, padding: '36px 20px',
                border: '1px solid var(--border-main)', textAlign: 'center'
              }}>
                <CheckCircle2 size={36} color="#15803D" style={{ marginBottom: 8 }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  All Clear
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No active {activeFilter !== 'All' ? activeFilter.toLowerCase() + ' ' : ''}alerts.
                  {!notifSettings.criticalAlert && !notifSettings.lowRangeAlert && !notifSettings.highRangeAlert
                    ? ' All alert types are disabled in Settings.'
                    : ''}
                </p>
              </div>
            )}
          </div>

          {/* Notification settings hint */}
          <div style={{
            padding: '10px 14px', borderRadius: 14, marginBottom: 12,
            background: 'var(--bg-card)', border: '1px solid var(--border-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
          }}>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>Active filters: </span>
              {[
                notifSettings.criticalAlert && 'Critical',
                notifSettings.highRangeAlert && 'High Range',
                notifSettings.lowRangeAlert  && 'Low Range',
              ].filter(Boolean).join(' · ') || 'None'}
            </div>
            <button
              onClick={() => navigate('/settings')}
              style={{
                fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                background: '#15803D', color: '#FFF', border: 'none', cursor: 'pointer'
              }}
            >
              Configure
            </button>
          </div>

          {/* Acknowledge All */}
          {telemetryAlerts.length > 0 && (
            <div style={{ paddingBottom: 10 }}>
              <button
                onClick={handleClearAll}
                style={{
                  width: '100%', height: 46, borderRadius: 16,
                  background: 'var(--bg-card)', border: '1px solid var(--border-main)',
                  color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Trash2 size={16} /><span>Acknowledge All Alerts</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── SMS MODAL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {smsModalAlert && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 10002,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
            }}
            onClick={() => setSmsModalAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)', borderRadius: 24, border: '1px solid var(--border-main)',
                padding: 20, width: '100%', maxWidth: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#0284C720', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      Dispatch SMS Alert
                    </h3>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Send to field worker mobile
                    </span>
                  </div>
                </div>
                <button onClick={() => setSmsModalAlert(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {/* Recipient */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                  SELECT FIELD WORKER
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {DEFAULT_FIELD_CONTACTS.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      style={{
                        padding: '8px 12px', borderRadius: 12,
                        border: selectedContact.id === contact.id ? '1.5px solid #0284C7' : '1px solid var(--border-main)',
                        background: selectedContact.id === contact.id ? '#0284C710' : 'var(--bg-main)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>{contact.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{contact.phone} • {contact.role}</div>
                      </div>
                      {selectedContact.id === contact.id && <Check size={16} color="#0284C7" strokeWidth={2.5} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>MESSAGE</label>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: smsDraftText.length > 160 ? '#DC2626' : '#15803D' }}>
                    {smsDraftText.length} / 160
                  </span>
                </div>
                <textarea
                  value={smsDraftText}
                  onChange={e => setSmsDraftText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                    borderRadius: 12, border: '1px solid var(--border-main)',
                    background: 'var(--bg-main)', color: 'var(--text-main)',
                    fontSize: '0.8rem', fontFamily: 'monospace', resize: 'none', outline: 'none'
                  }}
                />
              </div>

              {smsSentNotice && (
                <div style={{
                  padding: '8px 12px', borderRadius: 10, background: '#15803D20', color: '#15803D',
                  fontSize: '0.76rem', fontWeight: 800, marginBottom: 12, textAlign: 'center'
                }}>
                  {smsSentNotice}
                </div>
              )}

              <button
                onClick={() => {
                  dispatchSmsToWorker(selectedContact.phone, smsDraftText);
                  setSmsSentNotice(`SMS dispatched to ${selectedContact.name}!`);
                  setTimeout(() => { setSmsSentNotice(null); setSmsModalAlert(null); }, 1500);
                }}
                style={{
                  width: '100%', height: 44, borderRadius: 14,
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  border: 'none', color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, boxShadow: '0 4px 14px rgba(2,132,199,0.3)'
                }}
              >
                <Send size={16} />
                <span>Send to {selectedContact.name.split(' ')[0]}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertCenter;

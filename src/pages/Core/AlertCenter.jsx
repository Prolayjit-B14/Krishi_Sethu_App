import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { 
  AlertTriangle, Thermometer, Droplets, WifiOff, 
  CheckCircle2, Clock, Trash2, ChevronRight, 
  ArrowLeft, Cpu, Sliders, ShieldAlert, Sparkles, X, Check,
  MessageSquare, Send, PhoneCall
} from 'lucide-react';
import { dispatchSmsToWorker, formatSmsAlert, DEFAULT_FIELD_CONTACTS } from '../../api/smsService';

const FILTER_OPTIONS = ['All', 'Critical', 'Warning', 'Info'];

const AlertCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { farmInfo } = useApp();
  const { sensorData, mqttStatus, recommendations, lastGlobalUpdate } = useTelemetry();

  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedAlert, setSelectedAlert] = useState(location.state?.alert || null);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [smsModalAlert, setSmsModalAlert] = useState(null);
  const [selectedContact, setSelectedContact] = useState(DEFAULT_FIELD_CONTACTS[0]);
  const [smsDraftText, setSmsDraftText] = useState('');
  const [smsSentNotice, setSmsSentNotice] = useState(null);

  // Generate real-time dynamic alerts from live telemetry
  const telemetryAlerts = useMemo(() => {
    const list = [];
    const timestamp = lastGlobalUpdate || 'Live';

    // 1. Check Soil Moisture
    const moisture = sensorData?.soil?.moisture;
    if (moisture != null && moisture < 30) {
      list.push({
        id: 'alt-moisture-crit',
        title: 'Soil Moisture Critical Low',
        node: 'SOIL-01',
        sensor: 'Soil Moisture',
        sensorId: 'moisture',
        value: `${moisture} %`,
        threshold: '30 %',
        message: `Node: SOIL-01 • Current moisture ${moisture}% is below minimum safe threshold.`,
        recommendation: 'Initiate zone irrigation or activate irrigation pump relay.',
        severity: 'Critical',
        time: timestamp,
        icon: Droplets,
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FCA5A5'
      });
    }

    // 2. Check MQTT Connection
    if (mqttStatus !== 'connected') {
      list.push({
        id: 'alt-mqtt-offline',
        title: 'IoT Telemetry Gateway Offline',
        node: 'GATEWAY-01',
        sensor: 'MQTT WSS Stream',
        sensorId: null,
        value: 'Disconnected',
        threshold: 'Connected',
        message: 'Broker connection interrupted. Sensors operating in local buffer mode.',
        recommendation: 'Check WiFi network and MQTT HiveMQ broker credentials.',
        severity: 'Critical',
        time: timestamp,
        icon: WifiOff,
        color: '#DC2626',
        bg: '#FEF2F2',
        border: '#FCA5A5'
      });
    }

    // 3. Check Air Temperature
    const temp = sensorData?.weather?.temp;
    if (temp != null && temp > 35) {
      list.push({
        id: 'alt-weather-heat',
        title: 'High Ambient Temperature',
        node: 'WEATHER-01',
        sensor: 'Air Temperature',
        sensorId: 'weather_temp',
        value: `${temp} °C`,
        threshold: '35 °C',
        message: `Node: WEATHER-01 • Heat stress warning (${temp}°C).`,
        recommendation: 'Increase shade net coverage and schedule evening irrigation.',
        severity: 'Warning',
        time: timestamp,
        icon: Thermometer,
        color: '#F59E0B',
        bg: '#FFFBEB',
        border: '#FDE68A'
      });
    }

    // 4. Check Soil pH
    const ph = sensorData?.soil?.ph;
    if (ph != null && (ph < 6.0 || ph > 7.8)) {
      list.push({
        id: 'alt-soil-ph',
        title: 'Soil pH Deviation',
        node: 'SOIL-01',
        sensor: 'Soil pH',
        sensorId: 'ph',
        value: `${ph} pH`,
        threshold: '6.0 – 7.5 pH',
        message: `Node: SOIL-01 • pH level (${ph}) out of optimal range for crops.`,
        recommendation: ph < 6.0 ? 'Apply agricultural lime to raise soil pH.' : 'Apply gypsum or organic compost to buffer pH.',
        severity: 'Warning',
        time: timestamp,
        icon: AlertTriangle,
        color: '#F59E0B',
        bg: '#FFFBEB',
        border: '#FDE68A'
      });
    }

    // 5. Default Informational System Status Alert if list is small
    if (list.length === 0) {
      list.push({
        id: 'alt-sys-nominal',
        title: 'All Sensor Nodes Nominal',
        node: 'SOIL-01 & WEATHER-01',
        sensor: 'All Sensors',
        sensorId: 'moisture',
        value: 'Optimal',
        threshold: 'Within Limits',
        message: 'All connected IoT nodes are operating within designated agro-climatic ranges.',
        recommendation: 'Standard crop monitoring routine in progress.',
        severity: 'Info',
        time: timestamp,
        icon: CheckCircle2,
        color: '#0EA5E9',
        bg: '#F0F9FF',
        border: '#BAE6FD'
      });
    }

    return list.filter(a => !dismissedIds.includes(a.id));
  }, [sensorData, mqttStatus, lastGlobalUpdate, dismissedIds]);

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'All') return telemetryAlerts;
    return telemetryAlerts.filter(a => a.severity.toLowerCase() === activeFilter.toLowerCase());
  }, [activeFilter, telemetryAlerts]);

  const handleDismissAlert = (alertId) => {
    setDismissedIds(prev => [...prev, alertId]);
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null);
    }
  };

  const handleClearAll = () => {
    setDismissedIds(telemetryAlerts.map(a => a.id));
    setSelectedAlert(null);
  };

  const handleInvestigateSensor = (sensorId) => {
    if (sensorId) {
      navigate('/sensor-detail', { state: { sensorId, from: '/alerts' } });
    } else {
      navigate('/device-area');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      minHeight: '100%'
    }}>

      {/* ─── CASE A: DETAILED NOTIFICATION VIEW (MERGED INLINE) ─── */}
      {selectedAlert ? (
        <motion.div
          key="detail-view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{ display: 'flex', flexDirection: 'column' }}
        >
          {/* Back button */}
          <div style={{ marginBottom: '14px' }}>
            <button
              onClick={() => setSelectedAlert(null)}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-main)',
                borderRadius: '12px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to All Alerts</span>
            </button>
          </div>

          {/* Alert Header Card */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '26px',
            padding: '22px 20px',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '16px',
            position: 'relative'
          }}>
            {/* Top-Right Severity Badge */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '14px',
              background: selectedAlert.bg,
              border: `1px solid ${selectedAlert.border}`,
              color: selectedAlert.color,
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              <span>●</span>
              <span>{selectedAlert.severity}</span>
            </div>

            {/* Warning Icon Container */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: selectedAlert.bg,
              border: `1px solid ${selectedAlert.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedAlert.color,
              marginBottom: '14px'
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

          {/* Telemetry Details Spec Table */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '22px',
            padding: '16px 20px',
            border: '1px solid var(--border-main)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '16px'
          }}>
            {[
              { label: 'Host Node', value: selectedAlert.node, color: 'var(--text-main)' },
              { label: 'Sensor Channel', value: selectedAlert.sensor, color: 'var(--text-main)' },
              { label: 'Current Reading', value: selectedAlert.value, color: selectedAlert.color, bold: true },
              { label: 'Safe Threshold', value: selectedAlert.threshold, color: 'var(--text-main)' },
              { label: 'Recommended Action', value: selectedAlert.recommendation, color: '#15803D', bold: true }
            ].map((item, idx, arr) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  gap: '12px',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--border-main)' : 'none'
                }}
              >
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
          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingBottom: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDismissAlert(selectedAlert.id)}
              style={{
                flex: 1,
                minWidth: '110px',
                height: '46px',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-main)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Check size={16} />
              <span>Dismiss</span>
            </button>

            <button
              onClick={() => {
                setSmsDraftText(formatSmsAlert(selectedAlert, farmInfo?.name));
                setSmsModalAlert(selectedAlert);
              }}
              style={{
                flex: 1,
                minWidth: '130px',
                height: '46px',
                borderRadius: '16px',
                background: '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)'
              }}
            >
              <MessageSquare size={16} />
              <span>Broadcast SMS</span>
            </button>

            {selectedAlert.sensorId && (
              <button
                onClick={() => handleInvestigateSensor(selectedAlert.sensorId)}
                style={{
                  flex: 1,
                  minWidth: '120px',
                  height: '46px',
                  borderRadius: '16px',
                  background: '#15803D',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)'
                }}
              >
                <Cpu size={16} />
                <span>Investigate</span>
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        /* ─── CASE B: ALERTS LIST VIEW ─── */
        <motion.div
          key="list-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          {/* 📲 SMS Cellular Bridge Status */}
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '10px 14px',
            border: '1px solid var(--border-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px',
                background: '#0284C720', color: '#0284C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <MessageSquare size={15} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Cellular SMS Alert Gateway
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Active Bridge: {DEFAULT_FIELD_CONTACTS.length} Field Workers linked for offline phone dispatch
                </div>
              </div>
            </div>
            <span style={{
              fontSize: '0.62rem', fontWeight: 900, padding: '3px 8px', borderRadius: '100px',
              background: '#15803D20', color: '#15803D'
            }}>
              GSM ACTIVE
            </span>
          </div>

          {/* Horizontal Filter Chips */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {FILTER_OPTIONS.map(filter => {
              const isSelected = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  style={{
                    padding: '6px 18px',
                    borderRadius: '20px',
                    border: isSelected ? 'none' : '1px solid var(--border-main)',
                    background: isSelected ? '#15803D' : 'var(--bg-card)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(21, 128, 61, 0.25)' : 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {filter}
                </button>
              );
            })}
          </div>

          {/* Alert Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map(alert => {
                const Icon = alert.icon;

                return (
                  <motion.div
                    key={alert.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedAlert(alert)}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '22px',
                      padding: '16px 18px',
                      border: '1px solid var(--border-main)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '14px',
                        background: alert.bg,
                        border: `1px solid ${alert.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: alert.color,
                        flexShrink: 0
                      }}>
                        <Icon size={22} strokeWidth={2.2} />
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.94rem',
                          fontWeight: 900,
                          color: 'var(--text-main)',
                          letterSpacing: '-0.02em'
                        }}>
                          {alert.title}
                        </h4>

                        <div style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {alert.message}
                        </div>

                        <div style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-inactive)',
                          marginTop: '3px',
                          fontWeight: 500
                        }}>
                          Node: {alert.node} • Value: {alert.value}
                        </div>
                      </div>
                    </div>

                    {/* Right: Severity Badge & Chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: alert.bg,
                        border: `1px solid ${alert.border}`,
                        color: alert.color,
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}>
                        {alert.severity}
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '36px 20px',
                border: '1px solid var(--border-main)',
                textAlign: 'center'
              }}>
                <CheckCircle2 size={36} color="#15803D" style={{ marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  All Clear
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No active warnings or alerts for {activeFilter.toLowerCase()} status.
                </p>
              </div>
            )}
          </div>

          {/* Action Footer: Acknowledge All */}
          {telemetryAlerts.length > 0 && (
            <div style={{ marginTop: 'auto', paddingTop: '10px', paddingBottom: '10px' }}>
              <button
                onClick={handleClearAll}
                style={{
                  width: '100%',
                  height: '46px',
                  borderRadius: '16px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-main)',
                  color: 'var(--text-muted)',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={16} />
                <span>Acknowledge All Alerts</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* 📲 SMS DISPATCH MODAL DIALOG */}
      <AnimatePresence>
        {smsModalAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 10002,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setSmsModalAlert(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-main)',
                padding: '20px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: '#0284C720', color: '#0284C7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: 'var(--text-main)' }}>
                      Dispatch GSM SMS Alert
                    </h3>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Cellular delivery to non-smartphone / offline feature phones
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSmsModalAlert(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Recipient Selector */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  SELECT FIELD WORKER
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {DEFAULT_FIELD_CONTACTS.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '12px',
                        border: selectedContact.id === contact.id ? '1.5px solid #0284C7' : '1px solid var(--border-main)',
                        background: selectedContact.id === contact.id ? '#0284C710' : 'var(--bg-main)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
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

              {/* Message Draft Textarea */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                    GSM 160-CHAR MESSAGE PREVIEW
                  </label>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: smsDraftText.length > 160 ? '#DC2626' : '#15803D' }}>
                    {smsDraftText.length} / 160 Chars
                  </span>
                </div>
                <textarea
                  value={smsDraftText}
                  onChange={e => setSmsDraftText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-main)',
                    background: 'var(--bg-main)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
              </div>

              {smsSentNotice && (
                <div style={{
                  padding: '8px 12px', borderRadius: '10px',
                  background: '#15803D20', color: '#15803D',
                  fontSize: '0.76rem', fontWeight: 800, marginBottom: '12px',
                  textAlign: 'center'
                }}>
                  {smsSentNotice}
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={() => {
                  dispatchSmsToWorker(selectedContact.phone, smsDraftText);
                  setSmsSentNotice(`SMS broadcast dispatched to ${selectedContact.name}!`);
                  setTimeout(() => {
                    setSmsSentNotice(null);
                    setSmsModalAlert(null);
                  }, 1500);
                }}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Send size={16} />
                <span>Transmit SMS to {selectedContact.name.split(' ')[0]}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AlertCenter;

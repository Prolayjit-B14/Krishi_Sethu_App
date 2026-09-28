/**
 * AgriSense Pro — Detailed Device Node Screen
 * Redesigned to match the Soil and Weather Monitoring card container designs:
 * - Card container design matching Soil & Weather (borderRadius 22, CardWave, pastel badges, dark mode)
 * - Sensor value and optimum range removed per user request
 * - Displays attached hardware sensors, hardware types, channel designations, and inspect navigation
 * - Top Node Hero Card with consistent radius, pastel badges, and connection stats
 * - Seamless dark mode integration via AppContext
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { 
  ArrowLeft, Droplets, Thermometer, Activity, FlaskConical,
  Beaker, Hexagon, Sun, CloudRain, Camera, RefreshCw,
  CheckCircle2, CloudSun, BarChart2, Cpu, Wifi, WifiOff,
  Eye, ChevronRight
} from 'lucide-react';

const HARDWARE_NODE_REGISTRY = [
  {
    id: 'SOIL-01',
    nodeKey: 'soil_node',
    name: 'SOIL-01',
    type: 'Soil Monitoring Node',
    category: 'Soil Nodes',
    icon: Droplets,
    color: '#15803D',
    iconBg: '#E8FDF0',
    iconBorder: '#BBF7D0'
  },
  {
    id: 'WEATHER-01',
    nodeKey: 'weather_node',
    name: 'WEATHER-01',
    type: 'Weather Station Node',
    category: 'Weather',
    icon: CloudSun,
    color: '#0284C7',
    iconBg: '#F0F9FF',
    iconBorder: '#BAE6FD'
  }
];

// ─── CARD WAVE COMPONENT (IDENTICAL TO SOIL & WEATHER MONITORS) ───────────────
const CardWave = ({ fill = 'rgba(21, 128, 61, 0.08)', stroke = 'rgba(21, 128, 61, 0.18)' }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 38,
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 1,
    }}
  >
    {/* Ambient/Back Wave: Smooth Fluid Crawl */}
    <motion.div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '200%',
        height: '100%',
        display: 'flex',
      }}
      animate={{
        x: ['0%', '-50%'],
        y: [0, -1.5, 0],
      }}
      transition={{
        x: { duration: 7.5, repeat: Infinity, ease: 'linear' },
        y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <svg
        viewBox="0 0 320 32"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 14 Q40 5 80 14 T160 14 Q200 5 240 14 T320 14 L320 32 L0 32 Z"
          fill={fill}
          opacity="0.75"
        />
      </svg>
    </motion.div>

    {/* Surface/Front Wave: Active Ripple in Offset Motion */}
    <motion.div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '200%',
        height: '100%',
        display: 'flex',
      }}
      animate={{
        x: ['-50%', '0%'],
        y: [0, 1.5, 0],
      }}
      transition={{
        x: { duration: 5, repeat: Infinity, ease: 'linear' },
        y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <svg
        viewBox="0 0 320 32"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 18 Q40 9 80 18 T160 18 Q200 9 240 18 T320 18 L320 32 L0 32 Z"
          fill={fill}
        />
        <path
          d="M0 18 Q40 9 80 18 T160 18 Q200 9 240 18 T320 18"
          stroke={stroke}
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    </motion.div>
  </div>
);

// ─── SENSOR CARD COMPONENT (CARD CONTAINER LIKE SOIL & WEATHER, NO VALUES/RANGES) ──
const SensorCard = ({ sensor, isDarkMode, onInspect }) => {
  const Icon = sensor.icon;
  const isSensorLive = sensor.isLive;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onInspect}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 22,
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        padding: '16px 16px 14px 16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: sensor.sensorId ? 'pointer' : 'default',
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
    >
      {/* Pastel Wave Accent along Bottom */}
      <CardWave 
        fill={isDarkMode ? `${sensor.iconColor}14` : sensor.waveFill} 
        stroke={isDarkMode ? `${sensor.iconColor}25` : sensor.waveStroke} 
      />

      {/* Top Row: Icon + Sensor Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2, minWidth: 0, width: '100%' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: isDarkMode ? `${sensor.iconColor}1c` : sensor.iconBg,
            border: isDarkMode ? `1px solid ${sensor.iconColor}38` : `1px solid ${sensor.iconBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={17} color={sensor.iconColor} strokeWidth={2.2} />
        </div>
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.015em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {sensor.label}
        </span>
      </div>

      {/* Hardware Profile Subtitle */}
      <div style={{ marginTop: '12px', zIndex: 2 }}>
        <div
          style={{
            fontSize: '0.74rem',
            fontWeight: 600,
            color: isDarkMode ? '#94A3B8' : '#64748B',
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
          }}
        >
          {sensor.type}
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN DEVICE DETAILS SCREEN ──────────────────────────────────────────────
const DeviceDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sensorData, mqttStatus, lastGlobalUpdate, devices, rawDevices } = useTelemetry();
  const { isDarkMode } = useApp();

  const searchParams = new URLSearchParams(location.search);
  const paramNodeId = searchParams.get('node') || searchParams.get('id');
  const targetNodeId = location.state?.nodeId || location.state?.device?.id || paramNodeId || 'SOIL-01';

  const [selectedNodeId, setSelectedNodeId] = useState(targetNodeId);

  React.useEffect(() => {
    const nextTarget = location.state?.nodeId || location.state?.device?.id || paramNodeId;
    if (nextTarget) {
      setSelectedNodeId(nextTarget);
    }
  }, [location.state, location.search, paramNodeId]);


  const isMqttLive = mqttStatus === 'connected';

  // Compute live synchronized state for the active node
  const activeNode = useMemo(() => {
    const matched = HARDWARE_NODE_REGISTRY.find(n => n.id === selectedNodeId) || {
      id: selectedNodeId,
      nodeKey: 'soil_node',
      name: selectedNodeId,
      type: 'Custom IoT Node',
      category: 'Soil Nodes',
      icon: Droplets,
      color: '#15803D',
      iconBg: '#E8FDF0',
      iconBorder: '#BBF7D0'
    };

    let isOnline = false;
    let lastSeenText = 'Disconnected';

    if (matched.id === 'SOIL-01') {
      const hasSoilData = sensorData?.soil?.moisture != null || sensorData?.soil?.temp != null;
      const isSoilActive = devices?.soil_node?.status === 'ACTIVE' || rawDevices?.soil_node?.status === 'ACTIVE';
      isOnline = isMqttLive && (isSoilActive || hasSoilData);
      lastSeenText = isOnline 
        ? (lastGlobalUpdate || 'Live Telemetry') 
        : 'Disconnected';
    } else if (matched.id === 'WEATHER-01') {
      const hasWeatherData = sensorData?.weather?.temp != null || sensorData?.weather?.humidity != null;
      const isWeatherActive = devices?.weather_node?.status === 'ACTIVE' || rawDevices?.weather_node?.status === 'ACTIVE';
      isOnline = isMqttLive && (isWeatherActive || hasWeatherData);
      lastSeenText = isOnline 
        ? (lastGlobalUpdate || 'Live Telemetry') 
        : 'Disconnected';
    } else {
      isOnline = isMqttLive;
      lastSeenText = isMqttLive ? 'Node Linked' : 'Disconnected';
    }

    return {
      ...matched,
      isOnline,
      status: isOnline ? 'Online' : 'Offline',
      lastSeen: lastSeenText
    };
  }, [selectedNodeId, sensorData, devices, rawDevices, isMqttLive, lastGlobalUpdate]);

  // Connected sensors list (Metadata & Hardware Profiles only — NO sensor values, NO optimal ranges)
  const connectedSensors = useMemo(() => {
    if (activeNode.id === 'SOIL-01') {
      const m = sensorData?.soil?.moisture;
      const t = sensorData?.soil?.temp;
      const p = sensorData?.soil?.ph;
      const n = sensorData?.soil?.npk?.n;
      const phos = sensorData?.soil?.npk?.p;
      const k = sensorData?.soil?.npk?.k;

      return [
        {
          id: 'moisture',
          label: 'Soil Moisture',
          channel: 'Port A1',
          type: 'Capacitive Probe',
          icon: Droplets,
          iconColor: '#15803D',
          iconBg: '#E8FDF0',
          iconBorder: '#BBF7D0',
          waveFill: '#DCFCE7',
          waveStroke: '#86EFAC',
          isLive: m != null,
          sensorId: 'moisture'
        },
        {
          id: 'temp',
          label: 'Soil Temperature',
          channel: 'Port A2',
          type: 'NTC Thermistor',
          icon: Thermometer,
          iconColor: '#EA580C',
          iconBg: '#FFF7ED',
          iconBorder: '#FED7AA',
          waveFill: '#FFEDD5',
          waveStroke: '#FDBA74',
          isLive: t != null,
          sensorId: 'temp'
        },
        {
          id: 'ph',
          label: 'Soil pH',
          channel: 'Port A3',
          type: 'ISFET Electrode',
          icon: Activity,
          iconColor: '#0D9488',
          iconBg: '#F0FDFA',
          iconBorder: '#99F6E4',
          waveFill: '#CCFBF1',
          waveStroke: '#5EEAD4',
          isLive: p != null,
          sensorId: 'ph'
        },
        {
          id: 'n',
          label: 'Nitrogen (N)',
          channel: 'Port D1',
          type: 'Optical Photometry',
          icon: FlaskConical,
          iconColor: '#7C3AED',
          iconBg: '#F5F3FF',
          iconBorder: '#DDD6FE',
          waveFill: '#EDE9FE',
          waveStroke: '#C4B5FD',
          isLive: n != null,
          sensorId: 'n'
        },
        {
          id: 'p',
          label: 'Phosphorus (P)',
          channel: 'Port D2',
          type: 'Colorimetric Cell',
          icon: Beaker,
          iconColor: '#2563EB',
          iconBg: '#EFF6FF',
          iconBorder: '#BFDBFE',
          waveFill: '#DBEAFE',
          waveStroke: '#93C5FD',
          isLive: phos != null,
          sensorId: 'p'
        },
        {
          id: 'k',
          label: 'Potassium (K)',
          channel: 'Port D3',
          type: 'Ion Selective Electrode',
          icon: Hexagon,
          iconColor: '#D97706',
          iconBg: '#FEFCE8',
          iconBorder: '#FEF08A',
          waveFill: '#FEF9C3',
          waveStroke: '#FDE047',
          isLive: k != null,
          sensorId: 'k'
        }
      ];
    }

    if (activeNode.id === 'WEATHER-01') {
      const wt = sensorData?.weather?.temp;
      const wh = sensorData?.weather?.humidity;
      const wl = sensorData?.weather?.lightIntensity;
      const wr = sensorData?.weather?.rainLevel;

      return [
        {
          id: 'weather_temp',
          label: 'Air Temperature',
          channel: 'Port W1',
          type: 'RTD Platinum Probe',
          icon: Thermometer,
          iconColor: '#EA580C',
          iconBg: '#FFF7ED',
          iconBorder: '#FED7AA',
          waveFill: '#FFEDD5',
          waveStroke: '#FDBA74',
          isLive: wt != null,
          sensorId: 'weather_temp'
        },
        {
          id: 'humidity',
          label: 'Air Humidity',
          channel: 'Port W2',
          type: 'Digital Hygrometer',
          icon: Droplets,
          iconColor: '#0284C7',
          iconBg: '#F0F9FF',
          iconBorder: '#BAE6FD',
          waveFill: '#E0F2FE',
          waveStroke: '#7DD3FC',
          isLive: wh != null,
          sensorId: 'humidity'
        },
        {
          id: 'light',
          label: 'Sunlight Intensity',
          channel: 'Port W3',
          type: 'Silicon Pyranometer',
          icon: Sun,
          iconColor: '#D97706',
          iconBg: '#FEFCE8',
          iconBorder: '#FEF08A',
          waveFill: '#FEF9C3',
          waveStroke: '#FDE047',
          isLive: wl != null,
          sensorId: 'light'
        },
        {
          id: 'rain',
          label: 'Precipitation',
          channel: 'Port W4',
          type: 'Tipping Bucket Gauge',
          icon: CloudRain,
          iconColor: '#2563EB',
          iconBg: '#EFF6FF',
          iconBorder: '#BFDBFE',
          waveFill: '#DBEAFE',
          waveStroke: '#93C5FD',
          isLive: wr != null,
          sensorId: 'rain'
        }
      ];
    }

    if (activeNode.id === 'CAM-01') {
      return [
        {
          id: 'cam_fps',
          label: 'Vision Stream',
          channel: 'CAM-01',
          type: 'RGB AI Camera Module',
          icon: Camera,
          iconColor: '#D97706',
          iconBg: '#FEF6E9',
          iconBorder: '#FDE8C7',
          waveFill: '#FEF9C3',
          waveStroke: '#FDE047',
          isLive: isMqttLive,
          sensorId: null
        },
        {
          id: 'cam_res',
          label: 'Image Sensor',
          channel: 'CAM-02',
          type: 'Sony STARVIS CMOS',
          icon: Eye,
          iconColor: '#15803D',
          iconBg: '#E8FDF0',
          iconBorder: '#BBF7D0',
          waveFill: '#DCFCE7',
          waveStroke: '#86EFAC',
          isLive: isMqttLive,
          sensorId: null
        }
      ];
    }

    return [];
  }, [activeNode, sensorData, isMqttLive]);

  const activeSensorsCount = useMemo(() => {
    return connectedSensors.filter(s => s.isLive).length;
  }, [connectedSensors]);

  const NodeIcon = activeNode.icon;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      minHeight: 'auto'
    }}>

      {/* ─── TOP BAR: BACK & NODE SELECTOR ─── */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '16px' 
      }}>
        <button
          onClick={() => navigate(location.state?.from || '/device-area')}
          style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E2E8F0',
            borderRadius: '9999px',
            padding: '7px 14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: isDarkMode ? 'var(--text-main)' : '#1E293B',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} />
          <span>
            {location.state?.from?.includes('sensor') ? 'Back to Sensor Manager' : 'Back to Device Manager'}
          </span>
        </button>

        <span style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.07em'
        }}>
          {activeNode?.category ? activeNode.category.toUpperCase() : 'IOT NODE'}
        </span>
      </div>

      {/* ─── 1. TOP NODE HERO CARD ─────────────────────────────────────────── */}
      <motion.div
        key={activeNode.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 24,
          padding: '18px 20px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.04)',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle decorative wave along the bottom */}
        <CardWave 
          fill={isDarkMode ? `${activeNode.color}10` : `${activeNode.color}15`} 
          stroke={isDarkMode ? `${activeNode.color}20` : `${activeNode.color}25`} 
        />

        {/* Top Header: Node Icon + Name & Status Badge */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: isDarkMode ? `${activeNode.color}20` : activeNode.iconBg,
              border: isDarkMode ? `1px solid ${activeNode.color}40` : `1px solid ${activeNode.iconBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeNode.color,
              flexShrink: 0
            }}>
              <NodeIcon size={22} strokeWidth={2.4} />
            </div>

            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '1.25rem', 
                fontWeight: 900, 
                color: isDarkMode ? '#F8FAFC' : '#0F172A', 
                letterSpacing: '-0.02em', 
                lineHeight: 1.1 
              }}>
                {activeNode.name}
              </h3>
              <div style={{ 
                fontSize: '0.78rem', 
                color: isDarkMode ? '#94A3B8' : '#64748B', 
                fontWeight: 600, 
                marginTop: '3px' 
              }}>
                {activeNode.type}
              </div>
            </div>
          </div>

          {/* Status badge: Network logo + Online / Offline */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '9999px',
            background: activeNode.isOnline 
              ? (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7') 
              : (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
            border: activeNode.isOnline 
              ? (isDarkMode ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #86EFAC') 
              : (isDarkMode ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FCA5A5'),
            color: activeNode.isOnline ? '#15803D' : '#DC2626',
            fontSize: '0.74rem',
            fontWeight: 800
          }}>
            {activeNode.isOnline ? (
              <Wifi size={13} strokeWidth={2.4} />
            ) : (
              <WifiOff size={13} strokeWidth={2.4} />
            )}
            <span>{activeNode.isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>

      </motion.div>

      {/* ─── 2. SENSORS SECTION (MATCHING CARD CONTAINER DESIGN, NO VALUES/RANGES) ── */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '12px', 
          padding: '0 4px' 
        }}>
          <h4 style={{ 
            fontSize: '0.96rem', 
            fontWeight: 900, 
            color: isDarkMode ? '#F8FAFC' : '#0F172A', 
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Sensors on {activeNode.name}
          </h4>
          <span style={{ 
            fontSize: '0.74rem', 
            fontWeight: 800, 
            color: activeSensorsCount > 0 ? '#15803D' : '#DC2626'
          }}>
            {activeSensorsCount > 0 ? `${activeSensorsCount} Active Channels` : `${connectedSensors.length} Offline`}
          </span>
        </div>

        {/* Sensor Cards 2-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px'
        }}>
          {connectedSensors.map(sensor => (
            <SensorCard
              key={sensor.id}
              sensor={sensor}
              isDarkMode={isDarkMode}
              onInspect={() => {
                if (sensor.sensorId) {
                  navigate('/sensor-detail', {
                    state: {
                      sensorId: sensor.sensorId,
                      from: `/device-detail?node=${encodeURIComponent(activeNode.id)}`
                    }
                  });
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── 3. NODE SPECIFICATIONS CONTAINER ─────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ 
          fontSize: '0.96rem', 
          fontWeight: 900, 
          color: isDarkMode ? '#F8FAFC' : '#0F172A', 
          margin: '0 0 12px 4px',
          letterSpacing: '-0.01em'
        }}>
          Node Specifications
        </h4>

        <div style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 22,
          padding: '16px 20px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)'
        }}>
          {[
            { label: 'Node Hardware ID', value: activeNode.id },
            { label: 'Device Profile', value: activeNode.type },
            { label: 'Firmware Runtime', value: 'v2.4.1-field-edge' },
            { 
              label: 'Broker Connection', 
              value: activeNode.isOnline ? 'Connected (WSS HiveMQ)' : 'Disconnected', 
              color: activeNode.isOnline ? '#15803D' : (isDarkMode ? '#F87171' : '#DC2626')
            },
            { label: 'Active Channels', value: `${connectedSensors.length} Channels Attached` }
          ].map((row, idx, arr) => (
            <div
              key={row.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '11px 0',
                borderBottom: idx < arr.length - 1 
                  ? (isDarkMode ? '1px solid var(--border-main)' : '1px solid #F1F5F9') 
                  : 'none'
              }}
            >
              <span style={{ fontSize: '0.82rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                {row.label}
              </span>
              <span style={{ fontSize: '0.84rem', color: row.color || (isDarkMode ? '#F8FAFC' : '#0F172A'), fontWeight: 800 }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DeviceDetails;

/**
 * AgriSense Pro — Sensor Manager Screen
 * Exact visual match to screenshot:
 * - Header: "Sensor Details" with "Manage and view all sensor data"
 * - Node Filter: Soil Node (6 Sensors), Weather Node (4 Sensors), Total Sensors (10)
 * - Section Title: "All Sensors" with "Select a sensor to view details"
 * - Clean Search Field: "Search sensor..."
 * - 2-Column Grid of exactly 10 cards:
 *   1. Soil Moisture (Soil Node, Online)
 *   2. Soil Temperature (Soil Node, Online)
 *   3. Soil pH (Soil Node, Online)
 *   4. Nitrogen (N) (Soil Node, Offline)
 *   5. Phosphorus (P) (Soil Node, Online)
 *   6. Potassium (K) (Soil Node, Offline)
 *   7. Sunlight (Weather Node, Online)
 *   8. Humidity (Weather Node, Online)
 *   9. Rain (Weather Node, Offline)
 *   10. Temperature (Weather Node, Online)
 * - Bottom info banner: "Sensors keep your farm informed"
 * - NO telemetry values, NO percentages, NO ranges, NO graphs on this screen.
 * - Tapping any card navigates to its dedicated detail page.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets, Thermometer, Leaf, FlaskConical, Beaker, Hexagon,
  Sun, CloudRain, ChevronRight, Search, Sprout, Layers, CloudSun,
  BarChart2, Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import SensorCalibration from '../Core/SensorCalibration';

// ─── ANIMATION ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

// ─── 10 SENSOR DEFINITIONS ───────────────────────────────────────────────────
const SENSORS_LIST = [
  // Row 1
  {
    id: 'moisture',
    name: 'Soil Moisture',
    nodeType: 'Soil Node',
    nodeKey: 'soil',
    icon: Droplets,
    iconColor: '#0284C7',
    iconBg: '#EBF5FF',
    iconBorder: '#D0E6FD',
    waveFill: '#E0F2FE',
    defaultStatus: 'ONLINE',
  },
  {
    id: 'temp',
    name: 'Soil Temperature',
    nodeType: 'Soil Node',
    nodeKey: 'soil',
    icon: Thermometer,
    iconColor: '#EA580C',
    iconBg: '#FFF3EB',
    iconBorder: '#FEE2D1',
    waveFill: '#FFEDD5',
    defaultStatus: 'ONLINE',
  },
  // Row 2
  {
    id: 'ph',
    name: 'Soil pH',
    nodeType: 'Soil Node',
    nodeKey: 'soil',
    icon: Leaf,
    iconColor: '#16A34A',
    iconBg: '#E8F9EE',
    iconBorder: '#C4F1D3',
    waveFill: '#DCFCE7',
    defaultStatus: 'ONLINE',
  },
  {
    id: 'n',
    name: 'Nitrogen (N)',
    nodeType: 'Soil Node',
    nodeKey: 'soil',
    icon: FlaskConical,
    iconColor: '#8B5CF6',
    iconBg: '#F3EDFF',
    iconBorder: '#E0D4FD',
    waveFill: '#EDE9FE',
    defaultStatus: 'OFFLINE',
  },
  // Row 3
  {
    id: 'p',
    name: 'Phosphorus (P)',
    nodeType: 'Soil Node',
    nodeKey: 'soil',
    icon: Beaker,
    iconColor: '#D97706',
    iconBg: '#FEF6E9',
    iconBorder: '#FDE8C7',
    waveFill: '#FEF3C7',
    defaultStatus: 'ONLINE',
  },
  {
    id: 'k',
    name: 'Potassium (K)',
    nodeType: 'Soil Node',
    nodeKey: 'soil',
    icon: Hexagon,
    iconColor: '#0891B2',
    iconBg: '#E6F8FB',
    iconBorder: '#C8F0F7',
    waveFill: '#CFFAFE',
    defaultStatus: 'OFFLINE',
  },
  // Row 4
  {
    id: 'light',
    name: 'Sunlight',
    nodeType: 'Weather Node',
    nodeKey: 'weather',
    icon: Sun,
    iconColor: '#F59E0B',
    iconBg: '#FEF8E8',
    iconBorder: '#FDEEC8',
    waveFill: '#FEF3C7',
    defaultStatus: 'ONLINE',
  },
  {
    id: 'humidity',
    name: 'Humidity',
    nodeType: 'Weather Node',
    nodeKey: 'weather',
    icon: Droplets,
    iconColor: '#0284C7',
    iconBg: '#EBF5FF',
    iconBorder: '#D0E6FD',
    waveFill: '#E0F2FE',
    defaultStatus: 'ONLINE',
  },
  // Row 5
  {
    id: 'rain',
    name: 'Rain',
    nodeType: 'Weather Node',
    nodeKey: 'weather',
    icon: CloudRain,
    iconColor: '#8B5CF6',
    iconBg: '#F3EDFF',
    iconBorder: '#E0D4FD',
    waveFill: '#EDE9FE',
    defaultStatus: 'OFFLINE',
  },
  {
    id: 'weather_temp',
    name: 'Temperature',
    nodeType: 'Weather Node',
    nodeKey: 'weather',
    icon: Thermometer,
    iconColor: '#EA580C',
    iconBg: '#FFF3EB',
    iconBorder: '#FEE2D1',
    waveFill: '#FFEDD5',
    defaultStatus: 'ONLINE',
  },
];

// ─── CARD BOTTOM WAVE DECORATION (LIVING FLUID WAVE MOTION) ───────────────────
const CardWave = ({ fill, stroke }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '28px',
      pointerEvents: 'none',
      borderBottomLeftRadius: '20px',
      borderBottomRightRadius: '20px',
      overflow: 'hidden',
      zIndex: 1,
    }}
  >
    {/* Deep/Back Wave: Slow Ambient Fluid Sway */}
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
          d="M0 18 Q40 10 80 18 T160 18 Q200 10 240 18 T320 18 L320 32 L0 32 Z"
          fill={fill}
          opacity="0.95"
        />
        {stroke && (
          <path
            d="M0 18 Q40 10 80 18 T160 18 Q200 10 240 18 T320 18"
            stroke={stroke}
            strokeWidth="1.2"
            fill="none"
          />
        )}
      </svg>
    </motion.div>
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const SensorManager = () => {
  const navigate = useNavigate();
  const { devices, sensorData } = useTelemetry();

  const { isDarkMode } = useApp();
  // Filter & Search states
  const [nodeFilter, setNodeFilter] = useState('ALL'); // 'ALL' | 'soil' | 'weather'
  const [searchQuery, setSearchQuery] = useState('');

  // Node online status checks
  const isSoilNodeOnline = 
    devices?.soil_node?.status === 'ACTIVE' || 
    devices?.soil_node?.status === 'ONLINE' || 
    (sensorData?.soil?.moisture !== null && sensorData?.soil?.moisture !== undefined);

  const isWeatherNodeOnline = 
    devices?.weather_node?.status === 'ACTIVE' || 
    devices?.weather_node?.status === 'ONLINE' || 
    (sensorData?.weather?.temp !== null && sensorData?.weather?.temp !== undefined);

  // Compute node-wise active sensors count (strictly zero when offline, no fake increments)
  const soilActiveSensors = useMemo(() => {
    if (!isSoilNodeOnline) return 0;
    let count = 0;
    if (sensorData?.soil?.moisture !== undefined && sensorData?.soil?.moisture !== null) count++;
    if ((sensorData?.soil?.temp !== undefined && sensorData?.soil?.temp !== null) ||
        (sensorData?.soil?.temperature !== undefined && sensorData?.soil?.temperature !== null)) count++;
    if (sensorData?.soil?.ph !== undefined && sensorData?.soil?.ph !== null) count++;
    if ((sensorData?.soil?.npk?.n !== undefined && sensorData?.soil?.npk?.n !== null) ||
        (sensorData?.soil?.nitrogen !== undefined && sensorData?.soil?.nitrogen !== null)) count++;
    if ((sensorData?.soil?.npk?.p !== undefined && sensorData?.soil?.npk?.p !== null) ||
        (sensorData?.soil?.phosphorus !== undefined && sensorData?.soil?.phosphorus !== null)) count++;
    if ((sensorData?.soil?.npk?.k !== undefined && sensorData?.soil?.npk?.k !== null) ||
        (sensorData?.soil?.potassium !== undefined && sensorData?.soil?.potassium !== null)) count++;
    return Math.min(count, 6);
  }, [isSoilNodeOnline, sensorData?.soil]);

  const weatherActiveSensors = useMemo(() => {
    if (!isWeatherNodeOnline) return 0;
    let count = 0;
    if (sensorData?.weather?.lightIntensity !== undefined && sensorData?.weather?.lightIntensity !== null) count++;
    if (sensorData?.weather?.humidity !== undefined && sensorData?.weather?.humidity !== null) count++;
    if ((sensorData?.weather?.rainLevel !== undefined && sensorData?.weather?.rainLevel !== null) ||
        (sensorData?.weather?.rain !== undefined && sensorData?.weather?.rain !== null)) count++;
    if (sensorData?.weather?.temp !== undefined && sensorData?.weather?.temp !== null) count++;
    return Math.min(count, 4);
  }, [isWeatherNodeOnline, sensorData?.weather]);

  // Strict Real-Time status and value resolution (no synthetic demo numbers)
  const getSensorStatusAndVal = (id) => {
    switch (id) {
      case 'moisture': {
        const val = sensorData?.soil?.moisture;
        const online = isSoilNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(0)}%` : 'OFFLINE' };
      }
      case 'temp': {
        const val = sensorData?.soil?.temp ?? sensorData?.soil?.temperature;
        const online = isSoilNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(1)}°C` : 'OFFLINE' };
      }
      case 'ph': {
        const val = sensorData?.soil?.ph;
        const online = isSoilNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(1)} pH` : 'OFFLINE' };
      }
      case 'n': {
        const val = sensorData?.soil?.npk?.n ?? sensorData?.soil?.nitrogen;
        const online = isSoilNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(0)} mg/kg` : 'OFFLINE' };
      }
      case 'p': {
        const val = sensorData?.soil?.npk?.p ?? sensorData?.soil?.phosphorus;
        const online = isSoilNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(0)} mg/kg` : 'OFFLINE' };
      }
      case 'k': {
        const val = sensorData?.soil?.npk?.k ?? sensorData?.soil?.potassium;
        const online = isSoilNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(0)} mg/kg` : 'OFFLINE' };
      }
      case 'light': {
        const val = sensorData?.weather?.lightIntensity;
        const online = isWeatherNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(0)} lx` : 'OFFLINE' };
      }
      case 'humidity': {
        const val = sensorData?.weather?.humidity;
        const online = isWeatherNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(0)}%` : 'OFFLINE' };
      }
      case 'rain': {
        const val = sensorData?.weather?.rainLevel ?? sensorData?.weather?.rain;
        const online = isWeatherNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(0)} mm` : 'OFFLINE' };
      }
      case 'weather_temp': {
        const val = sensorData?.weather?.temp;
        const online = isWeatherNodeOnline && val !== null && val !== undefined;
        return { online, valStr: online ? `${Number(val).toFixed(1)}°C` : 'OFFLINE' };
      }
      default:
        return { online: false, valStr: 'OFFLINE' };
    }
  };

  const totalActiveSensors = soilActiveSensors + weatherActiveSensors;

  // Filtered sensor list
  const filteredSensors = useMemo(() => {
    return SENSORS_LIST.filter((sensor) => {
      // Node filter
      if (nodeFilter !== 'ALL' && sensor.nodeKey !== nodeFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          sensor.name.toLowerCase().includes(q) ||
          sensor.nodeType.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [nodeFilter, searchQuery]);

  return (
    <div
      style={{
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        minHeight: 'auto',
        padding: '16px 16px 16px',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── 1. HERO OVERVIEW CARD (NODE-WISE ACTIVE SENSORS) ──────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        style={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, #091f14 0%, #06170e 100%)' 
            : 'linear-gradient(135deg, #F0F9F2 0%, #E8F5EB 100%)',
          borderRadius: 22,
          border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(21, 128, 61, 0.16)',
          padding: '18px 18px 16px',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 3px 14px rgba(21, 128, 61, 0.06)',
        }}
      >
        {/* Living Fluid Wave Motion Accent across bottom of Hero Card */}
        <CardWave
          fill={isDarkMode ? 'rgba(34, 197, 94, 0.12)' : 'rgba(21, 128, 61, 0.08)'}
          stroke={isDarkMode ? 'rgba(34, 197, 94, 0.22)' : 'rgba(21, 128, 61, 0.14)'}
        />

        {/* Top Header of Hero Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2,
            marginBottom: 14,
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7',
                border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDarkMode ? '#4ADE80' : '#15803D',
                flexShrink: 0,
              }}
            >
              <Activity size={18} strokeWidth={2.4} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.02rem',
                  fontWeight: 900,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                Active Sensors Overview
              </h3>
            </div>
          </div>

          {/* Overall Active Pill Badge */}
          <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 11px',
                borderRadius: 100,
                background: totalActiveSensors > 0
                  ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7')
                  : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2'),
                border: totalActiveSensors > 0
                  ? (isDarkMode ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #86EFAC')
                  : (isDarkMode ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #FCA5A5'),
                color: totalActiveSensors > 0
                  ? (isDarkMode ? '#4ADE80' : '#15803D')
                  : (isDarkMode ? '#F87171' : '#DC2626'),
                fontSize: '0.72rem',
                fontWeight: 800,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: totalActiveSensors > 0 ? '#22C55E' : '#EF4444',
                  boxShadow: totalActiveSensors > 0 ? '0 0 6px #22C55E' : 'none',
                }}
              />
              <span>{totalActiveSensors}/10 Online</span>
            </div>
        </div>

        {/* Node-wise Breakdown Grid (Soil Node + Weather Node) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* 1. SOIL NODE CARD */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              navigate('/device-detail?node=SOIL-01', {
                state: { nodeId: 'SOIL-01', from: '/sensor-details' },
              })
            }
            style={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.85)',
              borderRadius: 16,
              padding: '12px 14px',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 88,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {/* Top Row: Icon on left, Active Badge on right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: isDarkMode ? 'rgba(22, 163, 74, 0.2)' : '#DCFCE7',
                  color: isDarkMode ? '#4ADE80' : '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sprout size={17} strokeWidth={2.4} />
              </div>

              {/* Node-wise count badge */}
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: 100,
                  background: isSoilNodeOnline ? (isDarkMode ? '#064e3b' : '#E8F5EB') : (isDarkMode ? '#450a0a' : '#FEE2E2'),
                  color: isSoilNodeOnline ? (isDarkMode ? '#34D399' : '#15803D') : (isDarkMode ? '#F87171' : '#DC2626'),
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {soilActiveSensors}/6 Active
              </div>
            </div>

            {/* Middle: Title */}
            <div style={{ marginBottom: 10 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Soil Node
              </p>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 4,
                borderRadius: 99,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(soilActiveSensors / 6) * 100}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: isSoilNodeOnline ? '#22C55E' : '#EF4444',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </motion.div>

          {/* 2. WEATHER NODE CARD */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() =>
              navigate('/device-detail?node=WEATHER-01', {
                state: { nodeId: 'WEATHER-01', from: '/sensor-details' },
              })
            }
            style={{
              background: isDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.85)',
              borderRadius: 16,
              padding: '12px 14px',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: 88,
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {/* Top Row: Icon on left, Active Badge on right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: isDarkMode ? 'rgba(2, 132, 199, 0.2)' : '#E0F2FE',
                  color: isDarkMode ? '#38BDF8' : '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CloudSun size={17} strokeWidth={2.4} />
              </div>

              {/* Node-wise count badge */}
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: 100,
                  background: isWeatherNodeOnline ? (isDarkMode ? '#082f49' : '#F0F9FF') : (isDarkMode ? '#450a0a' : '#FEE2E2'),
                  color: isWeatherNodeOnline ? (isDarkMode ? '#38BDF8' : '#0284C7') : (isDarkMode ? '#F87171' : '#DC2626'),
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {weatherActiveSensors}/4 Active
              </div>
            </div>

            {/* Middle: Title */}
            <div style={{ marginBottom: 10 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                }}
              >
                Weather Node
              </p>
            </div>

            {/* Progress bar */}
            <div
              style={{
                width: '100%',
                height: 4,
                borderRadius: 99,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(weatherActiveSensors / 4) * 100}%`,
                  height: '100%',
                  borderRadius: 99,
                  background: isWeatherNodeOnline ? '#0284C7' : '#EF4444',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── 2. SEGMENTED SENSOR FILTER PILLS (ALL, SOIL, WEATHER) ──────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 16,
          scrollbarWidth: 'none',
        }}
      >
        {[
          { key: 'ALL', label: 'All' },
          { key: 'soil', label: 'Soil' },
          { key: 'weather', label: 'Weather' },
        ].map((f) => {
          const isSel = nodeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setNodeFilter(f.key)}
              style={{
                padding: '7px 18px',
                borderRadius: 100,
                border: isSel ? 'none' : (isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0,0,0,0.08)'),
                background: isSel ? '#15803D' : (isDarkMode ? 'var(--bg-card)' : '#FFFFFF'),
                color: isSel ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                fontSize: '0.78rem',
                fontWeight: isSel ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: isSel ? '0 2px 8px rgba(21, 128, 61, 0.25)' : 'none',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ── 2. SECTION HEADER & SEARCH FIELD ──────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
          gap: 12,
        }}
      >
        {/* Title + Subtitle */}
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '1.18rem',
              fontWeight: 800,
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              letterSpacing: '-0.02em',
            }}
          >
            {nodeFilter === 'ALL' ? 'All Sensors' : nodeFilter === 'soil' ? 'Soil Sensors' : 'Weather Sensors'}
          </h2>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.72rem',
              fontWeight: 500,
              color: isDarkMode ? '#94A3B8' : '#64748B',
            }}
          >
            {nodeFilter === 'ALL'
              ? 'All 10 sensors'
              : nodeFilter === 'soil'
              ? '6 soil sensors'
              : '4 weather sensors'}
          </p>
        </div>

        {/* Pill Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 100,
            border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.08)',
            padding: '7px 12px',
            boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.02)',
            width: '150px',
            flexShrink: 0,
          }}
        >
          <Search size={15} color={isDarkMode ? '#94A3B8' : '#475569'} strokeWidth={2.4} />
          <input
            type="text"
            placeholder="Search sensor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.74rem',
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {/* ── 3. EXACT 10 SENSOR CARDS IN A 2-COLUMN GRID ───────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {filteredSensors.map((sensor, idx) => {
          const Icon = sensor.icon;
          const statusInfo = getSensorStatusAndVal(sensor.id);

          return (
            <motion.div
              key={sensor.id}
              custom={idx}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                navigate('/sensor-detail', {
                  state: { sensorId: sensor.id, from: '/sensor-details' },
                })
              }
              style={{
                background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                borderRadius: 20,
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
                padding: '12px 10px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 74,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {/* Living Fluid Wave Motion Accent */}
              <CardWave
                fill={isDarkMode ? `${sensor.iconColor}18` : sensor.waveFill}
                stroke={isDarkMode ? `${sensor.iconColor}2a` : `${sensor.iconColor}22`}
              />

              {/* Left Side: Icon Container + Name */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                  zIndex: 2,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                {/* Small Colored Icon Container */}
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

                {/* Text Block: Full Sensor Name + Real-Time Telemetry / OFFLINE badge */}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: sensor.name.length > 15 ? '0.78rem' : '0.84rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      lineHeight: 1.2,
                      letterSpacing: '-0.015em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {sensor.name}
                  </p>
                  {statusInfo.online && (
                    <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          color: sensor.iconColor,
                        }}
                      >
                        {statusInfo.valStr}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Clean Chevron Arrow */}
              <div
                style={{
                  color: isDarkMode ? '#94A3B8' : '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                  marginLeft: 4,
                  flexShrink: 0,
                }}
              >
                <ChevronRight size={16} strokeWidth={2.4} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 4. SENSOR CALIBRATION ────────────────────────────────────────── */}
      <div style={{ marginTop: 24, paddingBottom: 16 }}>
        <SensorCalibration isDarkMode={isDarkMode} />
      </div>
    </div>
  );
};

export default SensorManager;

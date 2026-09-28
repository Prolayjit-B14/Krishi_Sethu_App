/**
 * Krishi Sethu / AgriSense Pro Ã¢â‚¬â€ Smart Irrigation Control
 * Dedicated Industrial IoT Irrigation & Closed-Loop Automation Screen
 * 100% Uniform Theme matching SoilMonitor, WeatherMonitor & Settings
 * - Hero Card with botanical foliage SVG, ArcGauge, and live Pump/Mode status
 * - Complete AUTOMATION Section with both Soil Moisture and Rain aspects:
 *   1. Automatic Irrigation toggle
 *   2. Use Soil Moisture Threshold toggle
 *   3. Pump Start Threshold stepper
 *   4. Pump Stop Threshold stepper
 *   5. Rain Protection (Auto-Pause) toggle
 *   6. Rain Cutoff Threshold stepper
 *   7. Scheduled Irrigation Window toggle & time inputs
 * - 4 Water Accounting KPI cards with living fluid wave motion (CardWave)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Waves, Zap, Clock, Shield, AlertTriangle,
  TrendingDown, ChevronDown, ChevronUp, PlayCircle,
  StopCircle, CloudRain, CloudFog, Gauge, Power,
  Sunrise, Sunset, Sun, Moon
} from 'lucide-react';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { evaluateIrrigationAutoPilot, detectWaterlogging } from '../../logic/healthEngine';
import { calculateCropLifecycle } from '../../data/core/AgronomyUtils';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ANIMATIONS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TIME PICKER CONSTANTS & HELPERS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const stepHour = (hourStr, delta) => {
  const current = parseInt(hourStr, 10);
  const valid = isNaN(current) ? 0 : current;
  const next = (valid + delta + 24) % 24;
  return String(next).padStart(2, '0');
};

const stepMinute = (minStr, delta) => {
  const current = parseInt(minStr, 10);
  const valid = isNaN(current) ? 0 : current;
  let next;
  if (delta > 0) {
    next = (Math.floor(valid / 5) + 1) * 5;
  } else {
    next = (Math.ceil(valid / 5) - 1) * 5;
  }
  const wrapped = (next + 60) % 60;
  return String(wrapped).padStart(2, '0');
};

const PRESET_WINDOWS = [
  { label: 'Morning', icon: Sunrise, start: '06:00', end: '08:30' },
  { label: 'Mid-Day', icon: Sun, start: '10:00', end: '11:30' },
  { label: 'Evening', icon: Sunset, start: '17:00', end: '19:00' },
  { label: 'Night', icon: Moon, start: '21:00', end: '22:30' },
];

const format12Hour = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ CARD BOTTOM WAVE DECORATION (LIVING FLUID WAVE MOTION) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const CardWave = ({ fill, stroke }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '32px',
      pointerEvents: 'none',
      borderBottomLeftRadius: '22px',
      borderBottomRightRadius: '22px',
      overflow: 'hidden',
      zIndex: 1,
    }}
  >
    {/* Deep Wave: Slow Ambient Sway */}
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
        y: [0, -1.8, 0],
      }}
      transition={{
        x: { duration: 7.2, repeat: Infinity, ease: 'linear' },
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

    {/* Surface Wave: Active Ripple */}
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
        y: [0, 1.8, 0],
      }}
      transition={{
        x: { duration: 4.8, repeat: Infinity, ease: 'linear' },
        y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
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

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ SEMI-CIRCULAR ARC GAUGE (EXACT MATCH TO SOIL MONITOR & WEATHER) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const ArcGauge = ({ value, isDarkMode }) => {
  const size = 114;
  const strokeW = 11;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const arcSweep = 0.72; // 240 degrees sweep
  const pct = value !== null && value !== undefined && !isNaN(value) ? Math.min(Math.max(value, 0), 100) / 100 : 0;
  const strokeDashoffset = circ * (1 - pct * arcSweep);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(140deg)' }}>
        {/* Background Track matching Soil & Weather */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#D8E2D9'}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - arcSweep)}
        />
        {/* Active Progress Arc */}
        {value !== null && value !== undefined && !isNaN(value) && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={isDarkMode ? '#38BDF8' : '#0284C7'}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ * (1 - 0) }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.34, 1.1, 0.64, 1], delay: 0.2 }}
          />
        )}
      </svg>
      {/* Center Reading */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <span
          style={{
            fontSize: '1.95rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            lineHeight: 1,
            letterSpacing: '-0.03em'
          }}
        >
          {value !== null && value !== undefined && !isNaN(value) ? `${Math.round(value)}` : '--'}
        </span>
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: isDarkMode ? '#94A3B8' : '#475569',
            marginTop: 2
          }}
        >
          %
        </span>
      </div>
    </div>
  );
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ REUSABLE TOGGLE SWITCH (IDENTICAL TO SETTINGS COMPONENT) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const ToggleSwitch = ({ active, onToggle, onColor = '#10B981', ariaLabel = 'Toggle switch', isDarkMode, disabled = false }) => (
  <button
    type="button"
    role="switch"
    disabled={disabled}
    aria-checked={active}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled && onToggle) onToggle();
    }}
    aria-label={ariaLabel}
    style={{
      width: 48,
      height: 28,
      borderRadius: 100,
      background: active
        ? onColor
        : (isDarkMode ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1'),
      border: 'none',
      padding: 2.5,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.42 : 1,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      outline: 'none',
      flexShrink: 0,
      transition: 'background 0.2s ease, opacity 0.2s ease',
    }}
  >
    <div
      style={{
        width: 23,
        height: 23,
        borderRadius: '50%',
        background: '#FFFFFF',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: active ? 'translateX(20px)' : 'translateX(0px)',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.1, 0.64, 1)'
      }}
    />
  </button>
);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ UNIFIED WATER ACCOUNTING KPI CARD COMPONENT Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const KpiCard = ({ title, value, unit, icon: Icon, color, waveFill, waveStroke, isDarkMode, index }) => (
  <motion.div
    custom={index}
    variants={fadeUp}
    style={{
      background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
      borderRadius: 22,
      border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
      boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
      padding: '16px 16px 14px 16px',
      position: 'relative',
      overflow: 'hidden',
      minHeight: 124,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    {/* Translucent Wave in Dark Mode, Soft Pastel in Light Mode */}
    <CardWave
      fill={isDarkMode ? `${color}14` : waveFill}
      stroke={isDarkMode ? `${color}25` : waveStroke}
    />

    {/* Top Row: Icon Container + Metric Name */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2, minWidth: 0, width: '100%' }}>
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          background: isDarkMode ? `${color}1c` : `${color}14`,
          border: isDarkMode ? `1px solid ${color}38` : `1px solid ${color}28`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} strokeWidth={2.2} />
      </div>
      <span
        style={{
          fontSize: '0.82rem',
          fontWeight: 800,
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </span>
    </div>

    {/* Center Row: Large Value + Optional Unit */}
    <div style={{ margin: '8px 0 2px', zIndex: 2, display: 'flex', alignItems: 'baseline' }}>
      <span
        style={{
          fontSize: '1.85rem',
          fontWeight: 900,
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </span>
      {unit && (
        <span
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: isDarkMode ? '#94A3B8' : '#64748B',
            marginLeft: '4px',
          }}
        >
          {unit}
        </span>
      )}
    </div>
  </motion.div>
);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ MAIN SMART IRRIGATION CONTROL COMPONENT Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const IrrigationControl = () => {
  const { isDarkMode, activePlot, actuators: globalActuators, toggleActuator: appToggleActuator } = useApp();
  const { sensorData, mqttStatus, toggleActuator: mqttToggleActuator } = useTelemetry();
  // Use MQTT toggle if available (sends hardware command), fallback to app toggle
  const toggleActuator = mqttToggleActuator || appToggleActuator;
  const isOnline = mqttStatus === 'connected';
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ AUTOMATION STATE (SYNCHRONIZED WITH LOCALSTORAGE) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [isAutoPilot, setIsAutoPilot] = useState(() => {
    return localStorage.getItem('agrisense_irrigation_autopilot') === 'true';
  });

  const [useSoilMoistureThreshold, setUseSoilMoistureThreshold] = useState(() => {
    const saved = localStorage.getItem('agrisense_use_soil_moisture');
    return saved !== null ? saved === 'true' : true;
  });

  const [minMoisture, setMinMoisture] = useState(() => {
    return Number(localStorage.getItem('agrisense_min_moisture')) || 40;
  });

  const [maxMoisture, setMaxMoisture] = useState(() => {
    return Number(localStorage.getItem('agrisense_max_moisture')) || 70;
  });

  const [rainProtection, setRainProtection] = useState(() => {
    const saved = localStorage.getItem('agrisense_rain_protection');
    return saved !== null ? saved === 'true' : true;
  });

  const [rainCutoff, setRainCutoff] = useState(() => {
    return Number(localStorage.getItem('agrisense_rain_cutoff')) || 5;
  });

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ TIMER STATE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const [startTime, setStartTime] = useState(() => {
    return localStorage.getItem('agrisense_irrigation_start_time') || '06:00';
  });
  const [endTime, setEndTime] = useState(() => {
    return localStorage.getItem('agrisense_irrigation_end_time') || '08:30';
  });
  const [isTimerEnabled, setIsTimerEnabled] = useState(() => {
    return localStorage.getItem('agrisense_irrigation_timer_enabled') === 'true';
  });

  const [startHour, startMin] = useMemo(() => {
    const parts = (startTime || '06:00').split(':');
    return [parts[0] || '06', parts[1] || '00'];
  }, [startTime]);

  const [endHour, endMin] = useMemo(() => {
    const parts = (endTime || '08:30').split(':');
    return [parts[0] || '08', parts[1] || '30'];
  }, [endTime]);

  const handleUpdateStartTime = (newHour, newMin) => {
    const updated = `${newHour}:${newMin}`;
    setStartTime(updated);
    localStorage.setItem('agrisense_irrigation_start_time', updated);
  };

  const handleUpdateEndTime = (newHour, newMin) => {
    const updated = `${newHour}:${newMin}`;
    setEndTime(updated);
    localStorage.setItem('agrisense_irrigation_end_time', updated);
  };

  const handleStepStartHour = (delta) => {
    const newH = stepHour(startHour, delta);
    handleUpdateStartTime(newH, startMin);
  };

  const handleStepStartMin = (delta) => {
    const newM = stepMinute(startMin, delta);
    handleUpdateStartTime(startHour, newM);
  };

  const handleStepEndHour = (delta) => {
    const newH = stepHour(endHour, delta);
    handleUpdateEndTime(newH, endMin);
  };

  const handleStepEndMin = (delta) => {
    const newM = stepMinute(endMin, delta);
    handleUpdateEndTime(endHour, newM);
  };

  const applyPreset = (preset) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
    localStorage.setItem('agrisense_irrigation_start_time', preset.start);
    localStorage.setItem('agrisense_irrigation_end_time', preset.end);
  };

  // Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ ACTUATOR PUMP & VALVE STATE Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    // ACTUATOR STATE - derived from global AppContext (single source of truth)
  const pumpState = Boolean(globalActuators?.PUMP || globalActuators?.pump);
  const valveState = Boolean(globalActuators?.VALVE || globalActuators?.valve);



  // Crop Lifecycle
  const currentCrop = activePlot?.crop || 'paddy';
  const lifecycle = useMemo(() => {
    return calculateCropLifecycle(currentCrop, activePlot?.sowDate);
  }, [currentCrop, activePlot?.sowDate]);

  const isWaterlogged = detectWaterlogging(sensorData?.soil?.moisture, sensorData?.weather?.rainLevel);
  const isTelemetryOnline = sensorData?.soil?.moisture !== null && sensorData?.soil?.moisture !== undefined && !isNaN(sensorData?.soil?.moisture);

  // Water Accounting Numbers
  const estimatedPumpedVal = useMemo(() => {
    if (!isTelemetryOnline) return '--';
    return pumpState ? '1,420' : '980';
  }, [isTelemetryOnline, pumpState]);

  const estimatedSavedVal = useMemo(() => {
    if (!isTelemetryOnline) return '--';
    return '38';
  }, [isTelemetryOnline]);

  const handleToggleAutoPilot = () => {
    const nextVal = !isAutoPilot;
    setIsAutoPilot(nextVal);
    localStorage.setItem('agrisense_irrigation_autopilot', String(nextVal));
  };

  const handleTogglePump = () => {
    // If turning ON and hardware MQTT is disconnected, alert with modal popup
    if (!pumpState && !isOnline) {
      setPendingConfirmation({
        key: 'PUMP',
        isHardwareOffline: true,
        title: 'Hardware Offline',
        warning: 'Cannot activate Water Pump. The field controller is not connected to the MQTT stream. Please ensure your ESP32 hardware node is powered on and connected.',
        actionLabel: 'Understood'
      });
      return;
    }
    // If turning ON, prompt for confirmation
    if (!pumpState) {
      setPendingConfirmation({
        key: 'PUMP',
        title: 'Start Water Pump?',
        warning: 'This will start water pumping into the irrigation line.',
        actionLabel: 'Start Pump'
      });
      return;
    }
    if (toggleActuator) toggleActuator('PUMP');
  };

  const handleToggleValve = () => {
    // If turning ON and hardware MQTT is disconnected, alert with modal popup
    if (!valveState && !isOnline) {
      setPendingConfirmation({
        key: 'VALVE',
        isHardwareOffline: true,
        title: 'Hardware Offline',
        warning: 'Cannot open Main Valve. The field controller is not connected to the MQTT stream. Please ensure your ESP32 hardware node is powered on and connected.',
        actionLabel: 'Understood'
      });
      return;
    }
    // If turning ON, prompt for confirmation
    if (!valveState) {
      setPendingConfirmation({
        key: 'VALVE',
        title: 'Open Main Valve?',
        warning: 'This will open the main irrigation water valve.',
        actionLabel: 'Open Valve'
      });
      return;
    }
    if (toggleActuator) toggleActuator('VALVE');
  };


  return (
    <div
      style={{
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        minHeight: 'auto',
        padding: '16px 16px 16px',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      `}</style>

      {/* Ã¢Å¡Â Ã¯Â¸Â Waterlogging Warning Banner */}
      {isWaterlogged && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 18,
            background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
            border: '1.5px solid #EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#DC2626' }}>
              Waterlogging Warning: High Soil Saturation
            </div>
          </div>
        </div>
      )}

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ 1. IRRIGATION HEALTH INDEX HERO CARD (MATCHING SOIL & WEATHER) Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #091f14 0%, #06170e 45%, #030d07 100%)'
            : 'linear-gradient(135deg, #F2F9F3 0%, #E7F5EA 45%, #DCF0E0 100%)',
          borderRadius: 24,
          padding: '20px 20px 16px',
          border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(21, 128, 61, 0.12)',
          boxShadow: isDarkMode ? '0 4px 24px rgba(0, 0, 0, 0.5)' : '0 4px 20px rgba(21, 128, 61, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        {/* Botanical Foliage & Water Canal SVG Illustration matching Soil & Weather */}
        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '180px',
            height: '160px',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.9,
          }}
          viewBox="0 0 180 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 135 C50 115, 100 130, 180 115 L180 160 L0 160 Z"
            fill="#BAE6FD"
            opacity={isDarkMode ? '0.15' : '0.45'}
          />
          <path
            d="M50 160 C80 140, 130 138, 180 132 L180 160 Z"
            fill="#7DD3FC"
            opacity={isDarkMode ? '0.2' : '0.55'}
          />
          <path
            d="M145 145 C150 115, 172 95, 180 90 C178 110, 170 130, 155 142 Z"
            fill="#15803D"
          />
          <path
            d="M135 142 C125 110, 140 80, 158 68 C156 90, 150 118, 142 138 Z"
            fill="#16A34A"
          />
          <path
            d="M158 68 C150 88, 142 112, 138 136"
            stroke="#86EFAC"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>

        {/* Soft Sprout on Bottom Left */}
        <svg
          style={{
            position: 'absolute',
            bottom: -5,
            left: 5,
            width: '60px',
            height: '60px',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.45,
          }}
          viewBox="0 0 60 60"
          fill="none"
        >
          <path
            d="M10 60 C15 45, 25 35, 42 30 C35 42, 28 50, 15 60 Z"
            fill="#15803D"
          />
          <path
            d="M12 60 C5 48, 10 38, 24 35 C18 45, 16 52, 14 60 Z"
            fill="#22C55E"
          />
        </svg>

        {/* Card Content */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Header Row: Icon Container + Title + Mode Pill Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                  border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(21, 128, 61, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isDarkMode ? '#38BDF8' : '#0284C7',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <Droplets size={24} strokeWidth={2.4} />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.12rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.02em',
                }}
              >
                Irrigation Health Index
              </h2>
            </div>

            {/* Mode Pill Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(148, 163, 184, 0.3)',
                borderRadius: 100,
                padding: '4px 12px',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isAutoPilot ? '#38BDF8' : '#10B981',
                  display: 'inline-block',
                  animation: isAutoPilot ? 'pulse-dot 2s infinite' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isAutoPilot ? (isDarkMode ? '#38BDF8' : '#0284C7') : (isDarkMode ? '#4ADE80' : '#15803D'),
                }}
              >
                {isAutoPilot ? 'Auto-Pilot' : 'Manual'}
              </span>
            </div>
          </div>

          {/* Middle Row: Circular Gauge + 2 Action Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Arc Gauge */}
            <ArcGauge
              value={sensorData?.soil?.moisture}
              isDarkMode={isDarkMode}
            />

            {/* Right Stack: Direct Pump Control + Mode Toggle */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Card 1: Direct Pump Control */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 16,
                  background: isDarkMode ? 'rgba(22, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    PUMP 1
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 850, color: pumpState ? (isDarkMode ? '#38BDF8' : '#0284C7') : (isDarkMode ? '#94A3B8' : '#64748B'), marginTop: 1 }}>
                    {pumpState ? 'RUNNING' : 'STANDBY'}
                  </div>
                </div>

                <ToggleSwitch
                  active={pumpState}
                  onToggle={handleTogglePump}
                  onColor="#0284C7"
                  ariaLabel="Toggle Pump 1"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Card 2: Main Valve Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 16,
                  background: isDarkMode ? 'rgba(22, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    VALVE
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 850, color: valveState ? (isDarkMode ? '#38BDF8' : '#0284C7') : (isDarkMode ? '#94A3B8' : '#64748B'), marginTop: 1 }}>
                    {valveState ? 'OPEN' : 'CLOSED'}
                  </div>
                </div>
                <ToggleSwitch
                  active={valveState}
                  onToggle={handleToggleValve}
                  onColor="#0369A1"
                  ariaLabel="Toggle Main Valve"
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ 2. AUTOMATION SECTION (EXACT MATCH TO SETTINGS CARD WITH SOIL & RAIN) Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <h3
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: isDarkMode ? '#94A3B8' : '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: '0 0 0 4px',
          }}
        >
          AUTOMATION
        </h3>

        <div
          style={{
            background: isDarkMode ? 'var(--bg-sheet)' : '#F1F5F2',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* Ã¢â€â‚¬Ã¢â€â‚¬ Row 1: Automatic Irrigation (always shown) Ã¢â€â‚¬Ã¢â€â‚¬ */}
          <div
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode
                ? (isAutoPilot ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)')
                : (isAutoPilot ? '1px solid #A7F3D0' : '1px solid #EAEFEA'),
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5',
                  border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Droplets size={19} color="#10B981" strokeWidth={2.3} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                  Automatic Irrigation
                </div>
                {isAutoPilot && (
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isDarkMode ? '#4ADE80' : '#10B981', marginTop: 2 }}>
                    Auto-Pilot Active
                  </div>
                )}
              </div>
            </div>
            <ToggleSwitch
              active={isAutoPilot}
              onToggle={handleToggleAutoPilot}
              onColor="#10B981"
              ariaLabel="Toggle Automatic Irrigation"
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Ã¢â€â‚¬Ã¢â€â‚¬ 3 SECTION TOGGLES: only visible when Auto-Pilot is ON Ã¢â€â‚¬Ã¢â€â‚¬ */}
          {isAutoPilot && (
            <>
              {/* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION A: Soil Moisture Threshold Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div
                style={{
                  background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                  borderRadius: 16,
                  border: isDarkMode
                    ? (useSoilMoistureThreshold ? '1px solid rgba(2, 132, 199, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)')
                    : (useSoilMoistureThreshold ? '1px solid #BAE6FD' : '1px solid #EAEFEA'),
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
                      border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Gauge size={19} color="#0284C7" strokeWidth={2.3} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    Soil Moisture Threshold
                  </div>
                </div>
                <ToggleSwitch
                  active={useSoilMoistureThreshold}
                  onToggle={() => {
                    const nextVal = !useSoilMoistureThreshold;
                    setUseSoilMoistureThreshold(nextVal);
                    localStorage.setItem('agrisense_use_soil_moisture', String(nextVal));
                  }}
                  onColor="#0284C7"
                  ariaLabel="Toggle Soil Moisture Threshold"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Soil detail rows: only when useSoilMoistureThreshold is ON */}
              {useSoilMoistureThreshold && (
                <>
                  {/* Pump Start Threshold */}
                  <div
                    style={{
                      background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                      borderRadius: 16,
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
                          border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <PlayCircle size={19} color="#0284C7" strokeWidth={2.3} />
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                        Pump Start
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                        borderRadius: 12,
                        padding: '3px 4px',
                        gap: 4,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.max(10, minMoisture - 5);
                          setMinMoisture(nextVal);
                          localStorage.setItem('agrisense_min_moisture', String(nextVal));
                        }}
                        aria-label="Decrease pump start threshold"
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                      >
                        <ChevronDown size={16} strokeWidth={2.4} />
                      </button>
                      <span style={{ minWidth: 48, textAlign: 'center', fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#38BDF8' : '#0284C7', userSelect: 'none' }}>
                        {minMoisture}%
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.min(maxMoisture - 5, minMoisture + 5);
                          setMinMoisture(nextVal);
                          localStorage.setItem('agrisense_min_moisture', String(nextVal));
                        }}
                        aria-label="Increase pump start threshold"
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                      >
                        <ChevronUp size={16} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>

                  {/* Pump Stop Threshold */}
                  <div
                    style={{
                      background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                      borderRadius: 16,
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#D1FAE5',
                          border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #A7F3D0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <StopCircle size={19} color="#10B981" strokeWidth={2.3} />
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                        Pump Stop
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                        borderRadius: 12,
                        padding: '3px 4px',
                        gap: 4,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.max(minMoisture + 5, maxMoisture - 5);
                          setMaxMoisture(nextVal);
                          localStorage.setItem('agrisense_max_moisture', String(nextVal));
                        }}
                        aria-label="Decrease pump stop threshold"
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                      >
                        <ChevronDown size={16} strokeWidth={2.4} />
                      </button>
                      <span style={{ minWidth: 48, textAlign: 'center', fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#4ADE80' : '#10B981', userSelect: 'none' }}>
                        {maxMoisture}%
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextVal = Math.min(95, maxMoisture + 5);
                          setMaxMoisture(nextVal);
                          localStorage.setItem('agrisense_max_moisture', String(nextVal));
                        }}
                        aria-label="Increase pump stop threshold"
                        style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                      >
                        <ChevronUp size={16} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION B: Rain Protection Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div
                style={{
                  background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                  borderRadius: 16,
                  border: isDarkMode
                    ? (rainProtection ? '1px solid rgba(2, 132, 199, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)')
                    : (rainProtection ? '1px solid #BAE6FD' : '1px solid #EAEFEA'),
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
                      border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CloudRain size={19} color="#0284C7" strokeWidth={2.3} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    Rain Protection
                  </div>
                </div>
                <ToggleSwitch
                  active={rainProtection}
                  onToggle={() => {
                    const nextVal = !rainProtection;
                    setRainProtection(nextVal);
                    localStorage.setItem('agrisense_rain_protection', String(nextVal));
                  }}
                  onColor="#0284C7"
                  ariaLabel="Toggle Rain Protection"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Rain detail row: only when rainProtection is ON */}
              {rainProtection && (
                <div
                  style={{
                    background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                    borderRadius: 16,
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: isDarkMode ? 'rgba(13, 148, 136, 0.16)' : '#CCFBF1',
                        border: isDarkMode ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #99F6E4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <CloudFog size={19} color="#0D9488" strokeWidth={2.3} />
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                      Rain Cutoff
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                      borderRadius: 12,
                      padding: '3px 4px',
                      gap: 4,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = Math.max(1, rainCutoff - 1);
                        setRainCutoff(nextVal);
                        localStorage.setItem('agrisense_rain_cutoff', String(nextVal));
                      }}
                      aria-label="Decrease rain cutoff"
                      style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                      <ChevronDown size={16} strokeWidth={2.4} />
                    </button>
                    <span style={{ minWidth: 52, textAlign: 'center', fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#2DD4BF' : '#0D9488', userSelect: 'none' }}>
                      {rainCutoff} mm
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = Math.min(25, rainCutoff + 1);
                        setRainCutoff(nextVal);
                        localStorage.setItem('agrisense_rain_cutoff', String(nextVal));
                      }}
                      aria-label="Increase rain cutoff"
                      style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                      <ChevronUp size={16} strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
              )}

              {/* Ã¢â€â‚¬Ã¢â€â‚¬ SECTION C: Scheduled Timer Ã¢â€â‚¬Ã¢â€â‚¬ */}
              <div
                style={{
                  background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                  borderRadius: 16,
                  border: isDarkMode
                    ? (isTimerEnabled ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)')
                    : (isTimerEnabled ? '1px solid #DDD6FE' : '1px solid #EAEFEA'),
                  boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : '#EDE9FE',
                      border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #DDD6FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={19} color="#8B5CF6" strokeWidth={2.3} />
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    Schedule Timer
                  </div>
                </div>
                <ToggleSwitch
                  active={isTimerEnabled}
                  onToggle={() => {
                    const nextVal = !isTimerEnabled;
                    setIsTimerEnabled(nextVal);
                    localStorage.setItem('agrisense_irrigation_timer_enabled', String(nextVal));
                  }}
                  onColor="#8B5CF6"
                  ariaLabel="Toggle Scheduled Window"
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Schedule detail rows: only when isTimerEnabled is ON */}
              {isTimerEnabled && (
                <>
                  {/* Start Time */}
                  <div
                    style={{
                      background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                      borderRadius: 16,
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : '#EDE9FE',
                          border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #DDD6FE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Sunrise size={19} color="#8B5CF6" strokeWidth={2.3} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>Start Time</div>
                        <div style={{ fontSize: '0.70rem', fontWeight: 600, color: isDarkMode ? '#A78BFA' : '#7C3AED' }}>{format12Hour(startTime)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9', border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1', borderRadius: 12, padding: '3px 5px', gap: 2 }}>
                      <button type="button" onClick={() => handleStepStartHour(-1)} aria-label="Decrease start hour" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronDown size={14} strokeWidth={2.4} /></button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'monospace', color: isDarkMode ? '#A78BFA' : '#7C3AED', userSelect: 'none' }}>{startHour}</span>
                      <button type="button" onClick={() => handleStepStartHour(1)} aria-label="Increase start hour" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronUp size={14} strokeWidth={2.4} /></button>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: isDarkMode ? '#8B5CF6' : '#6D28D9', padding: '0 1px' }}>:</span>
                      <button type="button" onClick={() => handleStepStartMin(-1)} aria-label="Decrease start minute" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronDown size={14} strokeWidth={2.4} /></button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'monospace', color: isDarkMode ? '#A78BFA' : '#7C3AED', userSelect: 'none' }}>{startMin}</span>
                      <button type="button" onClick={() => handleStepStartMin(1)} aria-label="Increase start minute" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronUp size={14} strokeWidth={2.4} /></button>
                    </div>
                  </div>

                  {/* End Time */}
                  <div
                    style={{
                      background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                      borderRadius: 16,
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : '#EDE9FE',
                          border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #DDD6FE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Sunset size={19} color="#8B5CF6" strokeWidth={2.3} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>End Time</div>
                        <div style={{ fontSize: '0.70rem', fontWeight: 600, color: isDarkMode ? '#A78BFA' : '#7C3AED' }}>{format12Hour(endTime)}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9', border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1', borderRadius: 12, padding: '3px 5px', gap: 2 }}>
                      <button type="button" onClick={() => handleStepEndHour(-1)} aria-label="Decrease end hour" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronDown size={14} strokeWidth={2.4} /></button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'monospace', color: isDarkMode ? '#A78BFA' : '#7C3AED', userSelect: 'none' }}>{endHour}</span>
                      <button type="button" onClick={() => handleStepEndHour(1)} aria-label="Increase end hour" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronUp size={14} strokeWidth={2.4} /></button>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: isDarkMode ? '#8B5CF6' : '#6D28D9', padding: '0 1px' }}>:</span>
                      <button type="button" onClick={() => handleStepEndMin(-1)} aria-label="Decrease end minute" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronDown size={14} strokeWidth={2.4} /></button>
                      <span style={{ minWidth: 24, textAlign: 'center', fontSize: '0.92rem', fontWeight: 800, fontFamily: 'monospace', color: isDarkMode ? '#A78BFA' : '#7C3AED', userSelect: 'none' }}>{endMin}</span>
                      <button type="button" onClick={() => handleStepEndMin(1)} aria-label="Increase end minute" style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF', color: isDarkMode ? '#CBD5E1' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.06)', padding: 0 }}><ChevronUp size={14} strokeWidth={2.4} /></button>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div
                    style={{
                      background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                      borderRadius: 16,
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
                      boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                      Presets
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, flex: 1 }}>
                      {PRESET_WINDOWS.map(p => {
                        const isSelected = startTime === p.start && endTime === p.end;
                        const Icon = p.icon;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyPreset(p)}
                            style={{
                              padding: '6px 4px',
                              borderRadius: 8,
                              border: isSelected ? '1px solid #8B5CF6' : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'),
                              background: isSelected ? (isDarkMode ? 'rgba(139, 92, 246, 0.25)' : '#EDE9FE') : (isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF'),
                              color: isSelected ? '#8B5CF6' : (isDarkMode ? '#CBD5E1' : '#475569'),
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {Icon && <Icon size={12} strokeWidth={2.2} style={{ flexShrink: 0 }} />}
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>

      {/* KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        <KpiCard
          index={2}
          title="EST. PUMPED*"
          value={estimatedPumpedVal}
          unit={isTelemetryOnline ? 'L' : null}
          icon={Droplets}
          color="#0284C7"
          waveFill="#E0F2FE"
          waveStroke="#BAE6FD"
          isDarkMode={isDarkMode}
        />

        <KpiCard
          index={3}
          title="WATER SAVED*"
          value={estimatedSavedVal}
          unit={isTelemetryOnline ? '%' : null}
          icon={TrendingDown}
          color="#10B981"
          waveFill="#DCFCE7"
          waveStroke="#BBF7D0"
          isDarkMode={isDarkMode}
        />

        <KpiCard
          index={4}
          title="SOIL DRAINAGE"
          value={isWaterlogged ? 'Saturated' : (isTelemetryOnline ? 'Optimal' : '--')}
          unit={null}
          icon={Waves}
          color="#0D9488"
          waveFill="#CCFBF1"
          waveStroke="#99F6E4"
          isDarkMode={isDarkMode}
        />

        <KpiCard
          index={5}
          title="PUMP RUNTIME"
          value={pumpState ? '18' : '0'}
          unit="min"
          icon={Clock}
          color="#8B5CF6"
          waveFill="#EDE9FE"
          waveStroke="#DDD6FE"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* ── SAFETY CONFIRMATION & HARDWARE OFFLINE MODAL ── */}
      <AnimatePresence>
        {pendingConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setPendingConfirmation(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                borderRadius: 20,
                padding: '24px 22px 20px',
                maxWidth: 380,
                width: '100%',
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isDarkMode 
                  ? '0 20px 40px -10px rgba(0, 0, 0, 0.6)' 
                  : '0 20px 35px -8px rgba(0, 0, 0, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              {/* Header with AlertTriangle Icon + Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <motion.div
                  initial={{ scale: 0.7, rotate: -12 }}
                  animate={{ scale: [0.7, 1.12, 1], rotate: [-12, 4, 0] }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    background: isDarkMode 
                      ? (pendingConfirmation.isHardwareOffline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.16)') 
                      : (pendingConfirmation.isHardwareOffline ? '#FEE2E2' : '#FEF3C7'),
                    border: isDarkMode 
                      ? (pendingConfirmation.isHardwareOffline ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.35)') 
                      : (pendingConfirmation.isHardwareOffline ? '1px solid #FECACA' : '1px solid #FDE68A'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: pendingConfirmation.isHardwareOffline ? '#DC2626' : '#D97706',
                    flexShrink: 0,
                    boxShadow: isDarkMode 
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                      : '0 2px 8px rgba(245, 158, 11, 0.16)',
                  }}
                >
                  <AlertTriangle size={22} strokeWidth={2.4} />
                </motion.div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    color: isDarkMode ? '#F8FAFC' : '#101828',
                    lineHeight: 1.25,
                  }}
                >
                  {pendingConfirmation.title}
                </h3>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.9rem',
                  color: isDarkMode ? '#94A3B8' : '#475569',
                  lineHeight: 1.5,
                  margin: '0 0 22px 0'
                }}
              >
                {pendingConfirmation.warning}
              </p>

              {/* Action Buttons */}
              {pendingConfirmation.isHardwareOffline ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setPendingConfirmation(null)}
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#1E293B',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    Understood
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setPendingConfirmation(null)}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                      color: isDarkMode ? '#F8FAFC' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingConfirmation.key && toggleActuator) {
                        toggleActuator(pendingConfirmation.key);
                      }
                      setPendingConfirmation(null);
                    }}
                    style={{
                      flex: 1.2,
                      height: 42,
                      borderRadius: 12,
                      background: '#16A34A',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.28)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {pendingConfirmation.actionLabel}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IrrigationControl;

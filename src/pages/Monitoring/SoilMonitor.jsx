/**
 * AgriSense Pro — Soil Monitor
 * Premium AgTech IoT Dashboard
 * Exact visual match to screenshot: warm off-white background, deep forest green brand,
 * refined hero card with circular health gauge & botanical accents, 6 unified metric cards
 * with pastel waves, full-width Detailed Analytics CTA, and production-ready telemetry.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets, Thermometer, Leaf, FlaskConical, Beaker, Hexagon,
  BarChart2, ChevronRight, Layers, Radio, Sprout
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';

// ─── ANIMATIONS ─────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

// ─── SENSOR DEFINITIONS ──────────────────────────────────────────────────────
const SENSORS = [
  {
    id: 'moisture',
    label: 'MOISTURE',
    unit: '%',
    range: '30–60 %',
    icon: Droplets,
    iconColor: '#0284C7',
    iconBg: '#EBF5FF',
    iconBorder: '#D0E6FD',
    waveFill: '#E0F2FE',
    waveStroke: '#BAE6FD',
    min: 30, max: 60,
  },
  {
    id: 'temp',
    label: 'TEMPERATURE',
    unit: '°C',
    range: '18–32 °C',
    icon: Thermometer,
    iconColor: '#EA580C',
    iconBg: '#FFF3EB',
    iconBorder: '#FEE2D1',
    waveFill: '#FFEDD5',
    waveStroke: '#FED7AA',
    min: 18, max: 32,
  },
  {
    id: 'ph',
    label: 'SOIL pH',
    unit: '',
    range: '6.0–7.5',
    icon: Leaf,
    iconColor: '#16A34A',
    iconBg: '#E8F9EE',
    iconBorder: '#C4F1D3',
    waveFill: '#DCFCE7',
    waveStroke: '#BBF7D0',
    min: 6.0, max: 7.5,
  },
  {
    id: 'n',
    label: 'NITROGEN (N)',
    unit: 'mg/kg',
    range: '40–60 mg/kg',
    icon: FlaskConical,
    iconColor: '#8B5CF6',
    iconBg: '#F3EDFF',
    iconBorder: '#E0D4FD',
    waveFill: '#EDE9FE',
    waveStroke: '#DDD6FE',
    min: 40, max: 60,
  },
  {
    id: 'p',
    label: 'PHOSPHORUS (P)',
    unit: 'mg/kg',
    range: '20–40 mg/kg',
    icon: Beaker,
    iconColor: '#D97706',
    iconBg: '#FEF6E9',
    iconBorder: '#FDE8C7',
    waveFill: '#FEF3C7',
    waveStroke: '#FDE68A',
    min: 20, max: 40,
  },
  {
    id: 'k',
    label: 'POTASSIUM (K)',
    unit: 'mg/kg',
    range: '30–50 mg/kg',
    icon: Hexagon,
    iconColor: '#0891B2',
    iconBg: '#E6F8FB',
    iconBorder: '#C8F0F7',
    waveFill: '#CFFAFE',
    waveStroke: '#A5F3FC',
    min: 30, max: 50,
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
      height: '32px',
      pointerEvents: 'none',
      borderBottomLeftRadius: '22px',
      borderBottomRightRadius: '22px',
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
          d="M0 20 Q40 12 80 20 T160 20 Q200 12 240 20 T320 20 L320 32 L0 32 Z"
          fill={stroke}
          opacity="0.9"
        />
      </svg>
    </motion.div>
  </div>
);

// ─── SEMI-CIRCULAR ARC GAUGE ─────────────────────────────────────────────────
const ArcGauge = ({ value, isDarkMode }) => {
  const size = 114;
  const strokeW = 11;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  // Arc spans 240 degrees (leaving 120 open at bottom)
  const arcSweep = 0.72;
  const pct = value !== null ? Math.min(Math.max(value, 0), 100) / 100 : 0;
  const strokeDashoffset = circ * (1 - pct * arcSweep);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(140deg)' }}>
        {/* Background Track */}
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
        {value !== null && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#15803D"
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
          {value !== null ? `${value}` : '--'}
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

// ─── SENSOR CARD COMPONENT ───────────────────────────────────────────────────
const SensorCard = ({ sensor, value, index, isDarkMode }) => {
  const navigate = useNavigate();
  const Icon = sensor.icon;
  const displayVal = value !== null && value !== undefined ? value : null;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/sensor-detail', { state: { sensorId: sensor.id, from: '/soil-monitoring' } })}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 22,
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        padding: '16px 16px 14px 16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        minHeight: 142,
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

      {/* Top Row: Small Icon Container + Metric Name */}
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
          <Icon size={19} color={sensor.iconColor} strokeWidth={2.2} />
        </div>
        <span
          style={{
            fontSize: '0.84rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            letterSpacing: '0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
          }}
        >
          {sensor.label}
        </span>
      </div>

      {/* Center Row: Large Value + Optional Unit with Dynamic Changing Wave Effect */}
      <div style={{ margin: '10px 0 6px', zIndex: 2, display: 'flex', alignItems: 'baseline' }}>
        <motion.span
          key={displayVal}
          initial={{ opacity: 0.5, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            fontSize: '1.95rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {displayVal !== null ? displayVal : '--'}
        </motion.span>
        {sensor.unit && (
          <span
            style={{
              fontSize: sensor.unit.length > 2 ? '0.85rem' : '1.1rem',
              fontWeight: 700,
              color: isDarkMode ? '#94A3B8' : '#64748B',
              marginLeft: '4px',
            }}
          >
            {sensor.unit}
          </span>
        )}
      </div>

      {/* Bottom Row: Range */}
      <div style={{ zIndex: 2 }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: isDarkMode ? '#94A3B8' : '#64748B',
            letterSpacing: '-0.01em',
          }}
        >
          Range &nbsp;{sensor.range}
        </span>
      </div>
    </motion.div>
  );
};

// ─── MAIN SOIL MONITOR SCREEN ────────────────────────────────────────────────
const SoilMonitoring = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useApp();
  const { sensorData, systemHealth, devices } = useTelemetry();

  const soil = sensorData?.soil || {};
  const healthScore = systemHealth?.soil ?? null;
  const isOnline = soil.moisture !== null && soil.moisture !== undefined;

  const safeNum = (val, dec = 1) =>
    val !== null && val !== undefined && !isNaN(val) ? +Number(val).toFixed(dec) : null;

  const values = useMemo(() => ({
    moisture: safeNum(soil.moisture),
    temp:     safeNum(soil.temp),
    ph:       safeNum(soil.ph),
    n:        safeNum(soil.npk?.n, 0),
    p:        safeNum(soil.npk?.p, 0),
    k:        safeNum(soil.npk?.k, 0),
  }), [soil]);

  const activeSensors = Object.values(values).filter(v => v !== null).length;

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

      {/* ── 1. SOIL HEALTH INDEX HERO CARD ─────────────────────────────────── */}
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
        {/* Exquisite Botanical Background Illustration (Field foliage + Soil mound) */}
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
          {/* Distant Soft Hill Wash */}
          <path
            d="M0 130 Q60 110, 120 125 T180 115 L180 160 L0 160 Z"
            fill="#D0EAD5"
            opacity="0.5"
          />
          {/* Earth Mound / Fertile Soil Clod on Bottom Right */}
          <path
            d="M70 160 C90 135, 130 130, 180 142 L180 160 Z"
            fill="#5C4532"
            opacity="0.85"
          />
          <path
            d="M95 160 C115 145, 145 140, 180 148 L180 160 Z"
            fill="#3D2E22"
          />
          {/* Soil particle texture dots */}
          <circle cx="115" cy="152" r="1.5" fill="#8D6E53" />
          <circle cx="130" cy="147" r="1.8" fill="#A88B73" />
          <circle cx="155" cy="146" r="1.4" fill="#8D6E53" />
          <circle cx="140" cy="155" r="1.6" fill="#A88B73" />

          {/* Lush Green Crop / Tea Leaves on Right Edge */}
          <path
            d="M145 145 C150 110, 175 90, 180 85 C178 105, 170 128, 155 140 Z"
            fill="#15803D"
          />
          <path
            d="M135 142 C125 105, 140 75, 158 60 C156 85, 150 115, 142 138 Z"
            fill="#16A34A"
          />
          <path
            d="M158 60 C150 82, 142 108, 138 135"
            stroke="#86EFAC"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M165 115 C175 95, 180 65, 170 50 C182 68, 182 92, 172 120 Z"
            fill="#22C55E"
          />
          <path
            d="M125 150 C108 130, 105 105, 120 90 C125 110, 122 130, 128 145 Z"
            fill="#15803D"
            opacity="0.8"
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

        {/* Card Content (Layered above illustration) */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Header Row: Sprout Icon + Title + Inactive Badge */}
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
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                <Sprout size={24} color="#15803D" strokeWidth={2.2} />
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
                Soil Health Index
              </h2>
            </div>

            {/* Inactive / Active Pill Badge */}
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
                  background: isOnline ? '#15803D' : '#64748B',
                  display: 'inline-block',
                  animation: isOnline ? 'pulse-dot 2s infinite' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isOnline ? (isDarkMode ? '#4ADE80' : '#15803D') : (isDarkMode ? '#94A3B8' : '#475569'),
                }}
              >
                {isOnline ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Middle Row: Circular Gauge + 2 Compact KPI Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Arc Gauge */}
            <ArcGauge value={healthScore} isDarkMode={isDarkMode} />

            {/* Right Stack: SENSORS & SYNC Cards */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Sensors Pill Card */}
              <div
                onClick={() => navigate('/device-detail?node=SOIL-01', { state: { nodeId: 'SOIL-01', from: '/soil-monitoring' } })}
                title="View Soil 1 Device Screen"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: isDarkMode ? 'rgba(22, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
                  borderRadius: 16,
                  padding: '10px 14px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer',
                }}
              >
                <Layers size={20} color="#15803D" strokeWidth={2.4} />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#94A3B8' : '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    SENSORS
                  </p>
                  <p
                    style={{
                      margin: '1px 0 0',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      lineHeight: 1.15,
                    }}
                  >
                    {activeSensors} / 6
                  </p>
                </div>
              </div>

              {/* Sync Pill Card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: isDarkMode ? 'rgba(22, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
                  borderRadius: 16,
                  padding: '10px 14px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                }}
              >
                <Radio size={20} color="#15803D" strokeWidth={2.4} />
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#94A3B8' : '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    SYNC
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '1px' }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: '#15803D',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: isDarkMode ? '#F8FAFC' : '#0F172A',
                        lineHeight: 1.15,
                      }}
                    >
                      Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Supporting Text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 14,
            }}
          >
            <Leaf size={13} color="#15803D" strokeWidth={2.4} />
            <span
              style={{
                fontSize: '0.72rem',
                fontStyle: 'italic',
                fontWeight: 500,
                color: isDarkMode ? '#86EFAC' : '#3D5A45',
                letterSpacing: '-0.01em',
              }}
            >
              Monitor soil health for sustainable growth
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── 2. SOIL METRIC CARDS GRID (2 Columns x 3 Rows) ────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}
      >
        {SENSORS.map((sensor, i) => (
          <SensorCard
            key={sensor.id}
            sensor={sensor}
            value={values[sensor.id]}
            index={i + 1}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

    </div>
  );
};

export default SoilMonitoring;

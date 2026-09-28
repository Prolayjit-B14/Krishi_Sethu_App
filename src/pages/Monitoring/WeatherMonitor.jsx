/**
 * Krishi Sethu — Weather Station Monitor
 * Premium AgTech IoT Dashboard
 * Visually identical and consistent with Soil Monitor reference:
 * warm off-white background, deep forest green brand, refined hero card with circular Arc Gauge,
 * dual stacked KPI cards, unified metric cards with pastel waves, icon/text positions,
 * rich animations, and regional intelligence.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer, Droplets, Sun, CloudRain,
  Wind, Gauge, Sunrise, Sunset, Cloud,
  BarChart2, ChevronRight, Layers, Radio,
  CloudSun, Leaf, Activity, ShieldAlert,
  Flame, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { fetch72hForecast } from '../../api/weatherService';

// ─── ANIMATIONS ─────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

// ─── 4 CORE WEATHER METRICS ──────────────────────────────────────────────────
const SENSORS = [
  {
    id: 'temp',
    sensorId: 'weather_temp',
    label: 'TEMPERATURE',
    unit: '°C',
    range: '18–32 °C',
    icon: Thermometer,
    iconColor: '#EA580C',
    iconBg: '#FFF3EB',
    iconBorder: '#FEE2D1',
    waveFill: '#FFEDD5',
    waveStroke: '#FED7AA',
    min: 18,
    max: 32,
  },
  {
    id: 'humidity',
    sensorId: 'humidity',
    label: 'HUMIDITY',
    unit: '%',
    range: '40–70 %',
    icon: Droplets,
    iconColor: '#0284C7',
    iconBg: '#EBF5FF',
    iconBorder: '#D0E6FD',
    waveFill: '#E0F2FE',
    waveStroke: '#BAE6FD',
    min: 40,
    max: 70,
  },
  {
    id: 'light',
    sensorId: 'light',
    label: 'SUNLIGHT',
    unit: 'lx',
    range: '1k–8k lx',
    icon: Sun,
    iconColor: '#D97706',
    iconBg: '#FEF6E9',
    iconBorder: '#FDE8C7',
    waveFill: '#FEF3C7',
    waveStroke: '#FDE68A',
    min: 1000,
    max: 8000,
  },
  {
    id: 'rain',
    sensorId: 'rain',
    label: 'RAINFALL',
    unit: 'mm',
    range: '0–100 mm',
    icon: CloudRain,
    iconColor: '#8B5CF6',
    iconBg: '#F3EDFF',
    iconBorder: '#E0D4FD',
    waveFill: '#EDE9FE',
    waveStroke: '#DDD6FE',
    min: 0,
    max: 100,
  },
];

// ─── 8 REGIONAL INTELLIGENCE METRICS ─────────────────────────────────────────
const REGIONAL_ITEMS = [
  { key: 'aqi',       label: 'AQI',   icon: Activity,    color: '#15803D', bg: '#DCFCE7' },
  { key: 'wind',      label: 'Wind',  icon: Wind,        color: '#D97706', bg: '#FEF3C7' },
  { key: 'pressure',  label: 'Press', icon: Gauge,       color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'feelsLike', label: 'Feels', icon: Thermometer, color: '#E11D48', bg: '#FFE4E6' },
  { key: 'sunset',    label: 'Set',   icon: Sunset,      color: '#0284C7', bg: '#E0F2FE' },
  { key: 'sunrise',   label: 'Rise',  icon: Sunrise,     color: '#D97706', bg: '#FEF3C7' },
  { key: 'uv',        label: 'UV',    icon: Sun,         color: '#EA580C', bg: '#FFEDD5' },
  { key: 'clouds',    label: 'Clouds',icon: Cloud,       color: '#64748B', bg: '#F1F5F9' },
];

// ─── 5-DAY REGIONAL FORECAST DEFAULTS ────────────────────────────────────────
const DEFAULT_FORECAST = [
  { date: 'Mon 21', condition: 'Sunny',          rainProb: null,  temp: 29 },
  { date: 'Tue 22', condition: 'Partly Cloudy',  rainProb: '20%', temp: 31 },
  { date: 'Wed 23', condition: 'Light Rain',     rainProb: '65%', temp: 27 },
  { date: 'Thu 24', condition: 'Partly Cloudy',  rainProb: '15%', temp: 30 },
  { date: 'Fri 25', condition: 'Sunny',          rainProb: null,  temp: 28 },
];

const FORECAST_META = {
  'Sunny':          { icon: Sun,       color: '#D97706', bg: '#FEF3C7' },
  'Partly Cloudy':  { icon: CloudSun,  color: '#D97706', bg: '#FEF3C7' },
  'Light Rain':     { icon: CloudRain, color: '#0284C7', bg: '#E0F2FE' },
  'Rain':           { icon: CloudRain, color: '#0284C7', bg: '#E0F2FE' },
};

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

// ─── UNIFIED WEATHER METRIC CARD ─────────────────────────────────────────────
const WeatherMetricCard = ({ sensor, value, index, isDarkMode }) => {
  const navigate = useNavigate();
  const Icon = sensor.icon;
  const displayVal = value !== null && value !== undefined ? value : null;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate('/sensor-detail', { state: { sensorId: sensor.sensorId, from: '/weather' } })}
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
            width: 36,
            height: 36,
            borderRadius: 12,
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

// ─── REGIONAL INTELLIGENCE CHIP CARD ─────────────────────────────────────────
const RegionalCard = ({ item, value, index, isDarkMode }) => {
  const Icon = item.icon;
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 18,
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.02)',
        padding: '12px 6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        textAlign: 'center',
        boxSizing: 'border-box'
      }}
    >
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: isDarkMode ? `${item.color}1c` : item.bg,
        border: isDarkMode ? `1px solid ${item.color}35` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={18} color={item.color} strokeWidth={2.2} />
      </div>

      <span style={{
        fontSize: '0.68rem',
        fontWeight: 700,
        color: isDarkMode ? '#94A3B8' : '#64748B',
        marginTop: 2
      }}>
        {item.label}
      </span>

      <span style={{
        fontSize: '0.88rem',
        fontWeight: 900,
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        lineHeight: 1.1
      }}>
        {value ?? '--'}
      </span>
    </motion.div>
  );
};

// ─── FORECAST ROW ────────────────────────────────────────────────────────────
const ForecastCardRow = ({ day, index, isDarkMode }) => {
  const meta = FORECAST_META[day.condition] || { icon: Sun, color: '#D97706', bg: '#FEF3C7' };
  const Icon = meta.icon;

  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 16,
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.25)' : '0 1px 4px rgba(0, 0, 0, 0.02)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}
    >
      <span style={{
        width: '56px',
        fontSize: '0.8rem',
        fontWeight: 800,
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        flexShrink: 0
      }}>
        {day.date}
      </span>

      <div style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: isDarkMode ? `${meta.color}1c` : meta.bg,
        border: isDarkMode ? `1px solid ${meta.color}35` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={18} color={meta.color} strokeWidth={2.2} />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
          {day.condition}
        </div>
        {day.rainProb && (
          <div style={{
            fontSize: '0.64rem',
            color: isDarkMode ? '#60A5FA' : '#0284C7',
            fontWeight: 700,
            marginTop: 1
          }}>
            💧 {day.rainProb}
          </div>
        )}
      </div>

      <span style={{
        fontSize: '1.08rem',
        fontWeight: 900,
        color: isDarkMode ? '#F8FAFC' : '#0F172A'
      }}>
        {day.temp}°
      </span>
    </motion.div>
  );
};

// ─── MAIN WEATHER STATION MONITOR COMPONENT ──────────────────────────────────
const WeatherMonitoring = () => {
  const navigate = useNavigate();
  const { apiWeather, apiForecast, isDarkMode } = useApp();
  const { sensorData, systemHealth } = useTelemetry();

  const weather = sensorData?.weather || {};
  const weatherScore = systemHealth?.weather ?? null;
  const isOnline = weather.temp !== null && weather.temp !== undefined;

  const safeNum = (val, dec = 1) =>
    val !== null && val !== undefined && !isNaN(val) ? +Number(val).toFixed(dec) : null;

  const values = useMemo(() => ({
    temp:     safeNum(weather.temp),
    humidity: safeNum(weather.humidity, 0),
    light:    safeNum(weather.lightIntensity, 0),
    rain:     safeNum(weather.rainLevel, 1),
  }), [weather]);

  const activeSensors = Object.values(values).filter(v => v !== null).length;

  // Regional intelligence metrics values
  const chipValues = {
    aqi:       apiWeather?.aqi        ?? '--',
    wind:      apiWeather?.windSpeed  ?? '--',
    pressure:  apiWeather?.pressure   ? `${apiWeather.pressure}` : '--',
    feelsLike: apiWeather?.feelsLike  ? `${apiWeather.feelsLike}°` : '--°',
    sunset:    apiWeather?.sunset     ?? '--',
    sunrise:   apiWeather?.sunrise    ?? '--',
    uv:        apiWeather?.uv         ?? '--',
    clouds:    apiWeather?.clouds     ? `${apiWeather.clouds}%` : '--',
  };

  // 🌦️ 5-Day Forecast & Disaster Risk Engine
  const [disasterAlerts, setDisasterAlerts] = useState([]);
  const [liveForecastDays, setLiveForecastDays] = useState([]);

  useEffect(() => {
    fetch72hForecast().then(res => {
      if (res?.disasterAlerts) setDisasterAlerts(res.disasterAlerts);
      if (res?.days && res.days.length > 0) setLiveForecastDays(res.days);
    });
  }, []);

  // Forecast list (API or realistic calibrated regional dataset)
  const forecastList = useMemo(() => {
    if (liveForecastDays && liveForecastDays.length > 0) {
      return liveForecastDays.map(d => ({
        date: d.date,
        temp: d.tempMax,
        condition: d.condition,
        rainProb: d.rainProb ? `${d.rainProb}% (${d.rainSum}mm)` : null
      }));
    }
    if (apiForecast && apiForecast.length > 0) {
      return apiForecast.slice(0, 5);
    }
    return DEFAULT_FORECAST;
  }, [liveForecastDays, apiForecast]);

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

      {/* ── 1. WEATHER HEALTH INDEX HERO CARD ───────────────────────────────── */}
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
        {/* Harmonious Weather + Botanical Background Illustration */}
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
          {/* Natural Field Contour on Bottom Right */}
          <path
            d="M70 160 C90 135, 130 130, 180 142 L180 160 Z"
            fill="#166534"
            opacity="0.25"
          />
          <path
            d="M95 160 C115 145, 145 140, 180 148 L180 160 Z"
            fill="#15803D"
            opacity="0.35"
          />
          {/* Atmospheric Sun Glow behind foliage */}
          <circle cx="152" cy="55" r="22" fill="#FDE68A" opacity="0.4" />
          <circle cx="152" cy="55" r="14" fill="#F59E0B" opacity="0.65" />

          {/* Lush Crop Leaves on Right Edge matching Soil Reference */}
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

          {/* Soft weather cloud drifting over foliage */}
          <path
            d="M110 82 C110 76, 115 72, 121 72 C123 66, 130 63, 136 66 C140 62, 148 64, 150 70 C155 70, 158 74, 158 79 C158 84, 154 88, 148 88 L116 88 C112 88, 110 85, 110 82 Z"
            fill="#FFFFFF"
            opacity="0.65"
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
          {/* Header Row: CloudSun Icon + Title + Status Pill Badge */}
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
                <CloudSun size={24} color="#15803D" strokeWidth={2.2} />
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
                Weather Health Index
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

          {/* Middle Row: Circular Arc Gauge + 2 Compact Stacked KPI Cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Arc Gauge */}
            <ArcGauge value={weatherScore} isDarkMode={isDarkMode} />

            {/* Right Stack: SENSORS & SYNC Cards */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Sensors Pill Card */}
              <div
                onClick={() => navigate('/device-detail?node=WEATHER-01', { state: { nodeId: 'WEATHER-01', from: '/weather' } })}
                title="View Weather 1 Device Screen"
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
                    {activeSensors} / 4
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
                        background: isOnline ? '#15803D' : '#64748B',
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
              Smarter weather. Healthier tomorrow.
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── 2. WEATHER METRIC CARDS GRID (2 Columns x 2 Rows) ──────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {SENSORS.map((sensor, i) => (
          <WeatherMetricCard
            key={sensor.id}
            sensor={sensor}
            value={values[sensor.id]}
            index={i + 1}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>

      {/* ── 3. REGIONAL INTELLIGENCE (8 ITEMS IN 4-COLUMN COMPACT CARDS) ───── */}
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            padding: '0 2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 18, background: '#15803D', borderRadius: 4 }} />
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 800,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.01em',
              }}
            >
              Regional Intelligence
            </h3>
          </div>

          <button
            onClick={() => navigate('/analytics', { state: { tab: 'weather' } })}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isDarkMode ? '#4ADE80' : '#15803D',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            <span>See insights</span>
            <ChevronRight size={14} strokeWidth={2.4} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
        >
          {REGIONAL_ITEMS.map((item, i) => (
            <RegionalCard
              key={item.key}
              item={item}
              value={chipValues[item.key]}
              index={i}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </div>


      {/* ── 4. 5-DAY FORECAST ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            padding: '0 2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 18, background: '#15803D', borderRadius: 4 }} />
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 800,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.01em',
              }}
            >
              5-Day Forecast
            </h3>
          </div>

          <button
            onClick={() => navigate('/analytics', { state: { tab: 'weather' } })}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isDarkMode ? '#4ADE80' : '#15803D',
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            <span>View all</span>
            <ChevronRight size={14} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {forecastList.map((day, idx) => (
            <ForecastCardRow key={idx} day={day} index={idx} isDarkMode={isDarkMode} />
          ))}
        </div>
      </div>

    </div>
  );
};

export default WeatherMonitoring;

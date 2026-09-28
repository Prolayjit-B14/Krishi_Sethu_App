/**
 * Krishi Sethu — Flagship Farm Dashboard
 * Redesigned to visually mirror the Soil Monitor screen:
 * warm botanical off-white (#F8FAF7), dual-gradient Hero Card with Arc Gauge & SVG foliage,
 * CardWave living fluid waves, pure white elevated cards with pastel icon badges,
 * harmonized section headers, and botanical CTA buttons.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, CloudSun, Droplets, MapPin,
  ChevronRight, ChevronDown, ShieldCheck, RefreshCw,
  BellRing, Lightbulb, ArrowUp, ArrowDown,
  CheckCircle, BarChart3, Zap, Activity, Monitor,
  Volume2, VolumeX, Check, Sparkles, Leaf,
  Bot, CloudRain, ShieldAlert, Cpu, Server,
  Layers, FileText, TrendingUp
} from 'lucide-react';

// Context & State
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { getHealthColor } from '../../logic/healthEngine';
import { runDecisionEngine } from '../../logic/decisionEngine';
import speechService from '../../api/speechService';
import { generateRealtimeCropAdvisory, generateHolisticFieldSummary } from '../../api/aiService';
import { AIContextService } from '../../services/aiContextService';

// ─── ANIMATIONS ─────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
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
        x: { repeat: Infinity, duration: 8, ease: 'linear' },
        y: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
      }}
    >
      <svg
        viewBox="0 0 1000 32"
        preserveAspectRatio="none"
        style={{ width: '50%', height: '100%', display: 'block' }}
      >
        <path
          d="M0,16 C125,28 250,4 375,16 C500,28 625,4 750,16 C875,28 1000,10 L1000,32 L0,32 Z"
          fill={fill}
          opacity="0.55"
        />
      </svg>
      <svg
        viewBox="0 0 1000 32"
        preserveAspectRatio="none"
        style={{ width: '50%', height: '100%', display: 'block' }}
      >
        <path
          d="M0,16 C125,28 250,4 375,16 C500,28 625,4 750,16 C875,28 1000,10 L1000,32 L0,32 Z"
          fill={fill}
          opacity="0.55"
        />
      </svg>
    </motion.div>

    {/* Front Wave with Crisp Animated Stroke */}
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
        x: { repeat: Infinity, duration: 6, ease: 'linear' },
        y: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
      }}
    >
      <svg
        viewBox="0 0 1000 32"
        preserveAspectRatio="none"
        style={{ width: '50%', height: '100%', display: 'block' }}
      >
        <path
          d="M0,20 C150,8 300,28 450,18 C600,8 750,26 900,16 C950,12 1000,22 1000,22 L1000,32 L0,32 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
      </svg>
      <svg
        viewBox="0 0 1000 32"
        preserveAspectRatio="none"
        style={{ width: '50%', height: '100%', display: 'block' }}
      >
        <path
          d="M0,20 C150,8 300,28 450,18 C600,8 750,26 900,16 C950,12 1000,22 1000,22 L1000,32 L0,32 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.2"
        />
      </svg>
    </motion.div>
  </div>
);

// ─── 1. FARMER WELCOME HEADER CARD ───────────────────────────────
const UnifiedFarmerHeroCard = React.memo(({
  user,
  currentGPS,
  isDarkMode,
  onSync,
  isSyncing,
}) => {
  const [time] = useState(new Date());
  const h = time.getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : h < 21 ? 'Good Evening' : 'Good Night';
  const firstName = (user?.name || user?.email || 'Farmer').split(' ')[0].split('@')[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: isDarkMode
          ? 'linear-gradient(145deg, #101c15 0%, #0d161f 50%, #091017 100%)'
          : 'linear-gradient(145deg, #FFFFFF 0%, #F5FAF6 55%, #EBF8EE 100%)',
        borderRadius: 24,
        padding: '18px 18px 16px',
        border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(21, 128, 61, 0.16)',
        boxShadow: isDarkMode
          ? '0 6px 28px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(34, 197, 94, 0.08)'
          : '0 4px 20px rgba(21, 128, 61, 0.07), 0 1px 3px rgba(0, 0, 0, 0.03)',
        position: 'relative',
        overflow: 'visible',
        marginBottom: 16,
      }}
    >
      {/* ── TOP SECTION: GREETING & SUBTITLE ── */}
      <div style={{ marginBottom: 12 }}>
        <h1
          style={{
            fontSize: '1.42rem',
            fontWeight: 900,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.02em',
            margin: '0 0 3px 0',
            lineHeight: 1.2,
            textTransform: 'uppercase',
          }}
        >
          {greeting.toUpperCase()}, {firstName.toUpperCase()}
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: '0.84rem',
            fontWeight: 500,
            color: isDarkMode ? '#94A3B8' : '#64748B',
          }}
        >
          Your farm at a glance
        </p>
      </div>

      {/* ── LOCATION & REFRESH / SYNC ROW ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {/* Location (Lucide SVG, NO emoji) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.84rem',
            fontWeight: 700,
            color: isDarkMode ? '#E2E8F0' : '#1E293B',
          }}
        >
          <MapPin size={14} color={isDarkMode ? '#86EFAC' : '#15803D'} strokeWidth={2.4} />
          <span>{currentGPS?.city || 'Krishnanagar'}</span>
        </div>

        {/* ↻ → Refresh / sync */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onSync}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.07)' : '#FFFFFF',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
            borderRadius: 10,
            padding: '5px 11px',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: isDarkMode ? '#CBD5E1' : '#475569',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.15s ease',
          }}
        >
          <motion.div
            animate={{ rotate: isSyncing ? 360 : 0 }}
            transition={{ duration: 0.8, repeat: isSyncing ? Infinity : 0, ease: 'linear' }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <RefreshCw size={13} strokeWidth={2.4} color={isSyncing ? '#15803D' : (isDarkMode ? '#94A3B8' : '#64748B')} />
          </motion.div>
          <span>Refresh / sync</span>
        </motion.button>
      </div>
    </motion.div>
  );
});

// ─── 2. BOTANICAL HERO CARD (FARM HEALTH INDEX) ──────────────────────────────
const HealthOverview = React.memo(({ score, devices, navigate, isDarkMode }) => {
  const activeNodesCount = ['soil_node', 'weather_node']
    .filter(id => devices?.[id]?.status === 'ACTIVE' || devices?.[id]?.status === 'PARTIAL').length;

  const isOnline = activeNodesCount > 0;
  const healthScore = score != null ? Math.round(score) : null;
  const healthColor = !isOnline || healthScore == null ? '#94A3B8' : getHealthColor(healthScore);

  const statusTitle = !isOnline ? 'System Offline' : (healthScore != null ? (healthScore >= 80 ? 'Optimal Field Condition' : 'Attention Recommended') : 'Sensors Connected');

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      custom={0}
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
        <path d="M0 130 Q60 110, 120 125 T180 115 L180 160 L0 160 Z" fill="#D0EAD5" opacity="0.5" />
        <path d="M70 160 C90 135, 130 130, 180 142 L180 160 Z" fill="#5C4532" opacity="0.85" />
        <path d="M95 160 C115 145, 145 140, 180 148 L180 160 Z" fill="#3D2E22" />
        <circle cx="115" cy="152" r="1.5" fill="#8D6E53" />
        <circle cx="130" cy="147" r="1.8" fill="#A88B73" />
        <circle cx="155" cy="146" r="1.4" fill="#8D6E53" />
        <path d="M140 135 C135 100, 140 60, 160 30 C158 55, 162 85, 155 135 Z" fill="#15803D" />
        <path d="M152 75 C165 60, 175 40, 180 20 C182 38, 178 58, 165 80 Z" fill="#16A34A" />
      </svg>

      {/* Sprout on Bottom Left */}
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
        <path d="M10 60 C15 45, 25 35, 42 30 C35 42, 28 50, 15 60 Z" fill="#15803D" />
        <path d="M12 60 C5 48, 10 38, 24 35 C18 45, 16 52, 14 60 Z" fill="#22C55E" />
      </svg>

      {/* Content Area */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header Row: Sprout Icon + Title + Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(21, 128, 61, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <Sprout size={22} color="#15803D" strokeWidth={2.4} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.08rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.02em',
                }}
              >
                Farm Health Index
              </h2>
            </div>
          </div>

          {/* Active / Offline Pill Badge */}
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
                background: isOnline ? '#15803D' : '#EF4444',
                display: 'inline-block',
                boxShadow: isOnline ? '0 0 6px #22C55E' : 'none',
              }}
            />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Center: Hero Circular Arc Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '14px 0 16px' }}>
          <div style={{ position: 'relative', width: '130px', height: '130px' }}>
            <svg width="130" height="130" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(21, 128, 61, 0.12)'}
                strokeWidth="7"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={isOnline ? healthColor : '#94A3B8'}
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeDasharray="264"
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * (isOnline && healthScore != null ? healthScore : 0) / 100) }}
                transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '2.1rem',
                  fontWeight: 900,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}
              >
                {isOnline && healthScore != null ? `${healthScore}%` : '--'}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: isOnline && healthScore != null ? '#15803D' : '#94A3B8',
                  letterSpacing: '0.08em',
                  marginTop: 3,
                  textTransform: 'uppercase',
                }}
              >
                {isOnline && healthScore != null ? (healthScore >= 80 ? 'EXCELLENT' : 'STABLE') : (isOnline ? 'STANDBY' : 'OFFLINE')}
              </span>
            </div>
          </div>
        </div>

        {/* Dual Stacked KPI Cards inside Hero Card (Soil Node + Weather Node) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* KPI 1: Soil Node */}
          <div
            onClick={() => navigate('/device-detail?node=SOIL-01', { state: { nodeId: 'SOIL-01', from: '/dashboard' } })}
            style={{
              background: isDarkMode ? 'rgba(22, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
              borderRadius: 16,
              padding: '10px 12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sprout size={18} color="#15803D" strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                SOIL NODE
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                  {devices?.['soil_node']?.status === 'ACTIVE' ? 'Active' : 'SOIL-01'}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Weather Node */}
          <div
            onClick={() => navigate('/device-detail?node=WEATHER-01', { state: { nodeId: 'WEATHER-01', from: '/dashboard' } })}
            style={{
              background: isDarkMode ? 'rgba(22, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
              borderRadius: 16,
              padding: '10px 12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: '#E0F2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CloudSun size={18} color="#0284C7" strokeWidth={2.4} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
                WEATHER NODE
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                  {devices?.['weather_node']?.status === 'ACTIVE' ? 'Active' : 'WEAT-01'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ─── 3. SENSOR TELEMETRY MODULE CARDS (SOIL HEALTH & WEATHER HEALTH) ─────────
const TelemetryModuleCards = ({ sensorData, devices, navigate, isDarkMode }) => {
  const isSoilOnline = devices?.['soil_node']?.status === 'ACTIVE' || sensorData?.soil?.moisture != null;
  const isWeatherOnline = devices?.['weather_node']?.status === 'ACTIVE' || sensorData?.weather?.temp != null;

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
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
            Live Telemetry Modules
          </h3>
        </div>

        <button
          onClick={() => navigate('/sensor-manager')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: '0.74rem',
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

      {/* 2-Column Grid matching Soil Screen Sensor Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Module 1: Soil Health Card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/soil-monitoring')}
          style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 22,
            border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
            padding: '16px 14px 14px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 128,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <CardWave
            fill={isDarkMode ? 'rgba(22, 163, 74, 0.14)' : '#DCFCE7'}
            stroke={isDarkMode ? 'rgba(22, 163, 74, 0.25)' : '#BBF7D0'}
          />

          {/* Top Row: Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 2, minWidth: 0, width: '100%' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: isDarkMode ? 'rgba(22, 163, 74, 0.2)' : '#E8F9EE',
                border: isDarkMode ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid #C4F1D3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sprout size={18} color="#15803D" strokeWidth={2.2} />
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
              Soil Health
            </span>
          </div>

          {/* Middle Row: Primary Reading */}
          <div style={{ margin: '10px 0 4px', zIndex: 2, display: 'flex', alignItems: 'baseline' }}>
            <span
              style={{
                fontSize: '1.95rem',
                fontWeight: 800,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {sensorData?.soil?.moisture != null ? Math.round(sensorData.soil.moisture) : '--'}
            </span>
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: isDarkMode ? '#94A3B8' : '#64748B',
                marginLeft: 4,
              }}
            >
              %
            </span>
          </div>

          {/* Bottom Row: Status Badge */}
          <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: isDarkMode ? '#94A3B8' : '#64748B',
              }}
            >
              {isSoilOnline
                ? (sensorData?.soil?.moisture != null
                  ? (sensorData.soil.moisture > 60 ? 'Moisture • Optimal' : (sensorData.soil.moisture < 30 ? 'Moisture • Low' : 'Moisture • Moderate'))
                  : 'Sensor Syncing')
                : 'Offline'}
            </span>
          </div>
        </motion.div>

        {/* Module 2: Weather Station Card */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/weather')}
          style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 22,
            border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
            padding: '16px 14px 14px',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 128,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <CardWave
            fill={isDarkMode ? 'rgba(2, 132, 199, 0.14)' : '#E0F2FE'}
            stroke={isDarkMode ? 'rgba(2, 132, 199, 0.25)' : '#BAE6FD'}
          />

          {/* Top Row: Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 2, minWidth: 0, width: '100%' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: isDarkMode ? 'rgba(2, 132, 199, 0.2)' : '#EBF5FF',
                border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.35)' : '1px solid #D0E6FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CloudSun size={18} color="#0284C7" strokeWidth={2.2} />
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
              Weather Station
            </span>
          </div>

          {/* Middle Row: Primary Reading */}
          <div style={{ margin: '10px 0 4px', zIndex: 2, display: 'flex', alignItems: 'baseline' }}>
            <span
              style={{
                fontSize: '1.95rem',
                fontWeight: 800,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                lineHeight: 1,
                letterSpacing: '-0.03em',
              }}
            >
              {sensorData?.weather?.temp != null ? sensorData.weather.temp.toFixed(1) : '--'}
            </span>
            <span
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: isDarkMode ? '#94A3B8' : '#64748B',
                marginLeft: 4,
              }}
            >
              °C
            </span>
          </div>

          {/* Bottom Row: Status Badge */}
          <div style={{ zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: isDarkMode ? '#94A3B8' : '#64748B',
              }}
            >
              {isWeatherOnline
                ? (sensorData?.weather?.temp != null
                  ? `${sensorData?.weather?.humidity != null ? `${Math.round(sensorData.weather.humidity)}% Humidity` : 'Live Weather'}`
                  : 'Sensor Syncing')
                : 'Offline'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─── 4. QUICK ACTUATOR CONTROLS CARD ─────────────────────────────────────────
const ControlsCard = React.memo(({ actuators, toggleActuator, ACTUATORS, isDarkMode, navigate }) => {
  const controls = [
    { key: ACTUATORS?.PUMP, label: 'Water Pump', icon: Droplets, color: '#0ea5e9', bg: '#E0F2FE' },
    { key: ACTUATORS?.BUZZER, label: 'Siren Buzzer', icon: BellRing, color: '#ef4444', bg: '#FEE2E2' },
    { key: ACTUATORS?.LIGHT, label: 'Grow Light', icon: Lightbulb, color: '#f59e0b', bg: '#FEF3C7' },
  ];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={3}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 22,
        padding: '16px 18px',
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardWave
        fill={isDarkMode ? 'rgba(21, 128, 61, 0.08)' : 'rgba(21, 128, 61, 0.04)'}
        stroke={isDarkMode ? 'rgba(21, 128, 61, 0.16)' : 'rgba(21, 128, 61, 0.09)'}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, zIndex: 2, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: isDarkMode ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7',
              border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803D',
            }}
          >
            <Zap size={18} strokeWidth={2.4} />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '0.98rem',
                fontWeight: 800,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.01em',
              }}
            >
              Quick Actuators
            </h3>
          </div>
        </div>

        <button
          onClick={() => navigate('/actuators')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            fontSize: '0.72rem',
            fontWeight: 700,
            color: isDarkMode ? '#4ADE80' : '#15803D',
            fontFamily: 'inherit',
          }}
        >
          <span>Control Hub</span>
          <ChevronRight size={13} strokeWidth={2.4} />
        </button>
      </div>

      {/* 3 Quick Controls Pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, position: 'relative', zIndex: 2 }}>
        {controls.map((c) => {
          const isOn = actuators?.[c.key] ?? false;

          return (
            <div
              key={c.label}
              style={{
                background: isDarkMode
                  ? (isOn ? `${c.color}1c` : 'rgba(255, 255, 255, 0.03)')
                  : (isOn ? `${c.color}12` : '#F8FAF7'),
                border: isOn
                  ? `1.5px solid ${c.color}45`
                  : (isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)'),
                borderRadius: 18,
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.25s ease',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 14,
                  background: isOn ? c.color : (isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF'),
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: isOn ? `0 4px 12px ${c.color}40` : '0 1px 4px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.25s ease',
                }}
              >
                <c.icon size={20} color={isOn ? '#FFFFFF' : (isDarkMode ? '#CBD5E1' : '#64748B')} strokeWidth={2.2} />
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
              >
                {c.label}
              </span>

              {/* iOS-Style Toggle Switch */}
              <motion.div
                whileTap={{ scale: 0.92 }}
                onClick={() => toggleActuator(c.key)}
                style={{
                  width: 38,
                  height: 22,
                  borderRadius: 12,
                  background: isOn ? c.color : (isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1'),
                  position: 'relative',
                  cursor: 'pointer',
                  padding: 2,
                  boxSizing: 'border-box',
                  transition: 'background 0.25s ease',
                }}
              >
                <motion.div
                  animate={{ x: isOn ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
});


// ─── 6. QUICK ACTION HUB (4 COMPACT FEATURE SHORTCUTS) ──────────────────────────

const QuickActionHub = React.memo(({ navigate, isDarkMode }) => {
  const actions = [
    {
      id: 'ai',
      title: 'Krishi AI',
      subtitle: 'Ask Assistant',
      path: '/krishisethu-ai',
      icon: Bot,
      color: '#10B981',
      bg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
      border: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
    },
    {
      id: 'advisor',
      title: 'Crop Advisor',
      subtitle: 'Disease & Stage',
      path: '/crop-advisor',
      icon: Sparkles,
      color: '#F59E0B',
      bg: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
      border: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
    },

    {
      id: 'irrigation',
      title: 'Irrigation Hub',
      subtitle: 'Drip & Actuators',
      path: '/actuators',
      icon: Droplets,
      color: '#3B82F6',
      bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
      border: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
    },
    {
      id: 'analytics',
      title: 'Reports',
      subtitle: 'Analytics & Graphs',
      path: '/analytics',
      icon: BarChart3,
      color: '#8B5CF6',
      bg: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#F3E8FF',
      border: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : '#E9D5FF',
    },
  ];


  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <motion.div
              key={act.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(act.path)}
              style={{
                background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                borderRadius: 18,
                padding: '12px 14px',
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: act.bg,
                  border: `1px solid ${act.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={19} color={act.color} strokeWidth={2.2} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                  letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {act.title}
                </div>
                <div style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: isDarkMode ? '#94A3B8' : '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: 1,
                }}>
                  {act.subtitle}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

// ─── 7. ACTIVE CROP & PHENOLOGY STAGE CARD ──────────────────────────────────────
const ActiveCropStageCard = React.memo(({ activePlot, farmInfo, decision, navigate, isDarkMode }) => {
  const cropRaw = activePlot?.crop || farmInfo?.crop || 'Paddy (Rice)';
  const cropFormatted = cropRaw.charAt(0).toUpperCase() + cropRaw.slice(1);
  const stageName = decision?.lifecycle?.activeStage?.name || 'Vegetative Stage';
  const daysElapsed = decision?.lifecycle?.daysElapsed || 32;
  const totalDays = decision?.lifecycle?.totalDays || 120;
  const progressPercent = Math.min(100, Math.round((daysElapsed / totalDays) * 100)) || 27;

  const acreage = activePlot?.acreage || farmInfo?.acreage || '2.0';
  const waterSaved = decision?.percentSaved != null ? `${decision.percentSaved}%` : '34%';
  const targetMoisture = decision?.adaptiveThresholds?.idealMoisture
    ? `${decision.adaptiveThresholds.idealMoisture.min}–${decision.adaptiveThresholds.idealMoisture.max}%`
    : '40–70%';

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={1}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate('/crop-advisor')}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 22,
        padding: '16px 18px',
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        marginBottom: 16,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CardWave
        fill={isDarkMode ? 'rgba(34, 197, 94, 0.07)' : 'rgba(34, 197, 94, 0.04)'}
        stroke={isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)'}
      />

      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7',
                border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803D',
              }}
            >
              <Sprout size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '0.96rem',
                    fontWeight: 800,
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {cropFormatted}
                </h3>
                <span
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7',
                    color: isDarkMode ? '#4ADE80' : '#15803D',
                    padding: '2px 7px',
                    borderRadius: 8,
                  }}
                >
                  Active Crop
                </span>
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: isDarkMode ? '#94A3B8' : '#64748B',
            }}
          >
            Day {daysElapsed} of {totalDays}
          </span>
        </div>

        {/* Progress Bar Row */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isDarkMode ? '#CBD5E1' : '#334155' }}>
              {stageName}
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: isDarkMode ? '#4ADE80' : '#15803D' }}>
              {progressPercent}% Cycle
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 6,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: 6,
                background: 'linear-gradient(90deg, #15803D, #22C55E)',
              }}
            />
          </div>
        </div>

        {/* 3 Quick Micro Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div
            style={{
              padding: '7px 8px',
              borderRadius: 12,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.60rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.04em' }}>
              TARGET MOISTURE
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', marginTop: 2 }}>
              {targetMoisture}
            </div>
          </div>

          <div
            style={{
              padding: '7px 8px',
              borderRadius: 12,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.60rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.04em' }}>
              WATER SAVED
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10B981', marginTop: 2 }}>
              {waterSaved}
            </div>
          </div>

          <div
            style={{
              padding: '7px 8px',
              borderRadius: 12,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '0.60rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.04em' }}>
              PLOT ACREAGE
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', marginTop: 2 }}>
              {acreage} Ac
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ─── 8. (removed) ───────────────────────────────────────────────────────────────
const FieldAdvisoryBanner = null && React.memo(({ decision, navigate, isDarkMode }) => {
  const isWarning = decision?.severity === 'warning';
  const isOffline = decision?.severity === 'offline';
  const title = decision?.advisoryTitle || 'Field Conditions Optimal';
  const action = decision?.actionItem || 'Soil moisture & temperature within target thresholds.';

  const badgeColor = isOffline ? '#94A3B8' : (isWarning ? '#F59E0B' : '#10B981');
  const badgeBg = isOffline
    ? (isDarkMode ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9')
    : (isWarning ? (isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7') : (isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7'));
  const borderCol = isOffline
    ? (isDarkMode ? 'rgba(148, 163, 184, 0.25)' : '#E2E8F0')
    : (isWarning ? (isDarkMode ? 'rgba(245, 158, 11, 0.25)' : '#FDE68A') : (isDarkMode ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0'));

  const Icon = isWarning ? BellRing : (isOffline ? Activity : CheckCircle);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={2}
      whileTap={{ scale: 0.985 }}
      onClick={() => navigate('/crop-advisor')}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 18,
        padding: '12px 14px',
        border: `1px solid ${borderCol}`,
        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: badgeBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={17} color={badgeColor} strokeWidth={2.4} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 800,
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 500,
              color: isDarkMode ? '#CBD5E1' : '#64748B',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              marginTop: 1,
            }}
          >
            {action}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isDarkMode ? '#4ADE80' : '#15803D' }}>
          Advisor
        </span>
        <ChevronRight size={13} strokeWidth={2.4} color={isDarkMode ? '#4ADE80' : '#15803D'} />
      </div>
    </motion.div>
  );
});

// ─── MAIN DASHBOARD EXPORT ───────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const {
    user, farmInfo, actuators, toggleActuator, currentGPS, syncData, ACTUATORS, isDarkMode,
    plots, activePlotId, switchPlot, activePlot
  } = useApp();
  const { sensorData, farmHealthScore, systemHealth, devices, sensorHistory, mqttStatus } = useTelemetry();

  const [isSyncing, setIsSyncing] = useState(false);

  // 🧠 CENTRAL DECISION ENGINE: Synchronizes active plot, sensors, phenology, and advisories
  const decision = useMemo(() => {
    return runDecisionEngine({
      plot: activePlot,
      sensorData,
      sensorHistory
    });
  }, [activePlot, sensorData, sensorHistory]);

  const handleSync = () => {
    setIsSyncing(true);
    syncData();
    setTimeout(() => setIsSyncing(false), 1200);
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
      {/* 1. Farmer Command & Welcome Header */}
      <UnifiedFarmerHeroCard
        user={user}
        currentGPS={currentGPS}
        isDarkMode={isDarkMode}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      {/* 2. Botanical Hero Card (Farm Health Index) */}
      <HealthOverview
        score={farmHealthScore}
        systemHealth={systemHealth}
        devices={devices}
        navigate={navigate}
        isDarkMode={isDarkMode}
      />



      {/* 4. Active Crop & Growth Stage Card */}
      <ActiveCropStageCard
        activePlot={activePlot}
        farmInfo={farmInfo}
        decision={decision}
        navigate={navigate}
        isDarkMode={isDarkMode}
      />

      {/* 5. Live Telemetry Module Cards (Soil Health & Weather Health) */}
      <TelemetryModuleCards
        sensorData={sensorData}
        systemHealth={systemHealth}
        devices={devices}
        navigate={navigate}
        isDarkMode={isDarkMode}
      />

      {/* ── SECTION A: Hardware & IoT ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2} style={{
        marginBottom: 16,
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 22,
        padding: '14px',
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0,0,0,0.05)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDarkMode ? '#94A3B8' : '#64748B', marginBottom: 12 }}>Hardware &amp; IoT</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>

          {/* Device Manager */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/device-area')}
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: isDarkMode ? 'rgba(13,148,136,0.18)' : '#CCFBF1',
              border: isDarkMode ? '1px solid rgba(13,148,136,0.35)' : '1px solid #99F6E4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={19} color="#0D9488" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>Device Manager</div>
          </motion.div>

          {/* Sensor Manager */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/sensor-details')}
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: isDarkMode ? 'rgba(21,128,61,0.18)' : '#DCFCE7',
              border: isDarkMode ? '1px solid rgba(21,128,61,0.35)' : '1px solid #BBF7D0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={19} color="#15803D" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>Sensor Manager</div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── SECTION B: Reports & Analytics ── */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} style={{
        marginBottom: 16,
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 22,
        padding: '14px',
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0,0,0,0.05)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: isDarkMode ? '#94A3B8' : '#64748B', marginBottom: 12 }}>Reports &amp; Analytics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>

          {/* Report Generator */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/reports')}
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: isDarkMode ? 'rgba(245,158,11,0.18)' : '#FEF3C7',
              border: isDarkMode ? '1px solid rgba(245,158,11,0.35)' : '1px solid #FDE68A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={19} color="#D97706" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>Report Generator</div>
          </motion.div>

          {/* Graph Analyzer */}
          <motion.div
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/analytics')}
            style={{
              background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
              borderRadius: 14, padding: '14px', cursor: 'pointer',
              border: isDarkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: isDarkMode ? 'rgba(139,92,246,0.18)' : '#F3E8FF',
              border: isDarkMode ? '1px solid rgba(139,92,246,0.35)' : '1px solid #E9D5FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={19} color="#7C3AED" strokeWidth={2.2} />
            </div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>Graph Analyzer</div>
          </motion.div>
        </div>
      </motion.div>

      {/* 7. Quick Actuator Controls */}
      <ControlsCard
        actuators={actuators}
        toggleActuator={toggleActuator}
        ACTUATORS={ACTUATORS}
        isDarkMode={isDarkMode}
        navigate={navigate}
      />



      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 12, paddingBottom: 10 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#94A3B8', letterSpacing: '0.08em', opacity: 0.6 }}>
          KRISHI SETHU • v{farmInfo?.version || '1.4.3'}
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

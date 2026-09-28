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
  Volume2, VolumeX, Check, Sparkles, Leaf
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

// ─── 1. UNIFIED FARMER COMMAND & SUMMARY CARD ───────────────────────────────
const UnifiedFarmerHeroCard = React.memo(({
  user,
  currentGPS,
  isDarkMode,
  onSync,
  isSyncing,
  plots,
  activePlot,
  activePlotId,
  onSwitchPlot,
  isPlotDropdownOpen,
  setIsPlotDropdownOpen,
  decision,
  liveAiAdvisory,
  aiFieldSummary,
  isGeneratingAi,
  advisoryLang,
  onLanguageChange,
  isSpeaking,
  onSpeakAdvisory,
  devices,
  sensorData,
  pipelineState = 'idle',
  statusMessage = '',
}) => {
  const [time] = useState(new Date());
  const h = time.getHours();
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : h < 21 ? 'Good Evening' : 'Good Night';
  const firstName = (user?.name || user?.email || 'Farmer').split(' ')[0].split('@')[0];

  // Node telemetry count calculation
  const calculatedActive = devices
    ? Object.values(devices).filter(d => d?.status === 'ACTIVE' || d?.status === 'PARTIAL').length
    : 0;
  const isMoistureOnline = sensorData?.soil?.moisture != null && !isNaN(sensorData?.soil?.moisture);
  const onlineNodes = calculatedActive > 0 ? calculatedActive : (isMoistureOnline ? 4 : 3);

  // Plot taxonomy & stage display
  const cropDisplay = activePlot?.crop
    ? (activePlot.crop.toLowerCase() === 'paddy' ? 'Rice' : (activePlot.crop.charAt(0).toUpperCase() + activePlot.crop.slice(1).toLowerCase()))
    : 'Rice';
  const acreageDisplay = `${activePlot?.acreage || 2} acres`;
  const stageDisplay = decision?.lifecycle?.activeStage?.sub
    || decision?.lifecycle?.activeStage?.shortName
    || decision?.lifecycle?.activeStage?.title
    || decision?.lifecycle?.activeStage?.name
    || 'Tillering';

  // Dynamic AI Agricultural Summary Text (respects selected language)
  const currentSummaryText = aiFieldSummary?.assessment?.[advisoryLang]
    || liveAiAdvisory?.voiceScripts?.[advisoryLang]
    || liveAiAdvisory?.body
    || decision?.advisory?.body
    || "Soil moisture data isn't being received right now. AI advice will resume when the node reconnects.";

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
          marginBottom: 14,
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

      {/* ── 1. PLOT SELECTION CARD (Compact, clean SVG icons, no emoji) ── */}
      <div style={{ position: 'relative', marginBottom: 12, zIndex: 25 }}>
        <div
          onClick={() => setIsPlotDropdownOpen(!isPlotDropdownOpen)}
          style={{
            background: isDarkMode ? 'rgba(0, 0, 0, 0.35)' : '#FFFFFF',
            border: isDarkMode ? '1.5px solid rgba(34, 197, 94, 0.3)' : '1.5px solid #C4EAD0',
            borderRadius: 16,
            padding: '10px 14px',
            boxShadow: isDarkMode
              ? '0 4px 16px rgba(0, 0, 0, 0.25)'
              : '0 2px 10px rgba(21, 128, 61, 0.05)',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
          }}
        >
          {/* Row 1: Sprout SVG + Plot Name + Chevron */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sprout size={16} color={isDarkMode ? '#86EFAC' : '#15803D'} strokeWidth={2.2} />
              <span
                style={{
                  fontSize: '0.90rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#F8FAFC' : '#0F172A',
                }}
              >
                {activePlot?.name || 'Plot A — North Field'}
              </span>
            </div>
            <ChevronDown
              size={16}
              color={isDarkMode ? '#94A3B8' : '#64748B'}
              style={{
                transform: isPlotDropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </div>

          {/* Row 2: Compact Meta Line (Crop • Acreage • Stage • Online Nodes) */}
          <div
            style={{
              paddingLeft: 23,
              fontSize: '0.74rem',
              fontWeight: 600,
              color: isDarkMode ? '#94A3B8' : '#64748B',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: isDarkMode ? '#86EFAC' : '#15803D', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Leaf size={12} strokeWidth={2.2} />
              {cropDisplay} • {acreageDisplay} • {stageDisplay}
            </span>
            <span style={{ color: isDarkMode ? '#475569' : '#CBD5E1' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: onlineNodes >= 3 ? '#22C55E' : (onlineNodes > 0 ? '#F59E0B' : '#EF4444'),
                  boxShadow: onlineNodes >= 3 ? '0 0 6px rgba(34, 197, 94, 0.6)' : 'none',
                }}
              />
              <span>{onlineNodes}/4 nodes</span>
            </span>
          </div>
        </div>

        {/* Animated Plot Switcher Dropdown */}
        <AnimatePresence>
          {isPlotDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute',
                top: '105%',
                left: 0,
                right: 0,
                background: isDarkMode ? '#111827' : '#FFFFFF',
                borderRadius: 16,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #C4EAD0',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
                padding: '6px',
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{
                padding: '4px 10px 6px',
                fontSize: '0.64rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isDarkMode ? '#94A3B8' : '#64748B'
              }}>
                Select Active Farm Plot
              </div>
              {plots && plots.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSwitchPlot(p.id);
                    setIsPlotDropdownOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 12,
                    background: activePlotId === p.id
                      ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7')
                      : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 1 }}>
                      {p.crop.toUpperCase()} • {p.acreage} Acres
                    </div>
                  </div>
                  {activePlotId === p.id && <Check size={16} color="#15803D" strokeWidth={2.5} />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 2. AI FIELD SUMMARY CARD ── */}
      <div
        style={{
          background: isDarkMode ? 'rgba(0, 0, 0, 0.35)' : '#FFFFFF',
          border: isDarkMode ? '1.5px solid rgba(34, 197, 94, 0.25)' : '1.5px solid #C4EAD0',
          borderRadius: 18,
          padding: '14px 16px 14px',
          boxShadow: isDarkMode
            ? '0 4px 20px rgba(0, 0, 0, 0.25)'
            : '0 2px 12px rgba(21, 128, 61, 0.05)',
        }}
      >
        {/* Header Row: Clean "FIELD SUMMARY" (No extra live badge per user request) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isDarkMode ? '#4ADE80' : '#15803D',
            }}
          >
            FIELD SUMMARY
          </span>
        </div>

        {/* Status Line: Clean SVG glowing dot indicator (NO emoji) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isMoistureOnline ? '#22C55E' : '#EF4444',
              boxShadow: isMoistureOnline
                ? '0 0 8px rgba(34, 197, 94, 0.7)'
                : '0 0 8px rgba(239, 68, 68, 0.7)',
            }}
          />
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: isMoistureOnline ? (isDarkMode ? '#4ADE80' : '#15803D') : '#EF4444',
            }}
          >
            {isMoistureOnline ? 'Telemetry online' : 'Telemetry offline'}
          </span>
        </div>

        {/* Body Text */}
        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '0.84rem',
            fontWeight: 600,
            color: isDarkMode ? '#E2E8F0' : '#334155',
            lineHeight: 1.48,
          }}
        >
          {isMoistureOnline
            ? currentSummaryText
            : "Soil moisture data isn't being received right now. AI advice will resume when the node reconnects."}
        </p>

        {/* Missing / Limitations Notice if present */}
        {aiFieldSummary?.missingDataNotes && isMoistureOnline && (
          <div
            style={{
              fontSize: '0.72rem',
              color: isDarkMode ? '#94A3B8' : '#64748B',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontStyle: 'italic',
            }}
          >
            <span style={{ fontSize: '0.8rem' }}>ℹ️</span>
            <span>{aiFieldSummary.missingDataNotes}</span>
          </div>
        )}

        {/* ── PROGRESS STATUS BADGE (4 Progressive States) ── */}
        {['collecting', 'analyzing', 'synthesizing'].includes(pipelineState) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              borderRadius: 10,
              background: isDarkMode ? 'rgba(34, 197, 94, 0.12)' : '#F0FDF4',
              border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid #BBF7D0',
              marginBottom: 10,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ display: 'flex', color: '#15803D' }}
            >
              <RefreshCw size={13} />
            </motion.div>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803D' }}>
              {statusMessage || (
                pipelineState === 'collecting' ? 'Collecting field data...' :
                pipelineState === 'analyzing' ? 'Analysing field conditions...' :
                'Preparing voice summary...'
              )}
            </span>
          </motion.div>
        )}

        {/* Footer Row: Language Selector (left) + Audio Controls (right) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            paddingTop: 8,
            borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            flexWrap: 'wrap',
          }}
        >
          {/* Language Selector: [ English ] [ বাংলা ] [ हिन्दी ] */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
              padding: 3,
              borderRadius: 10,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
            }}
          >
            {[
              { id: 'en', label: 'English' },
              { id: 'bn', label: 'বাংলা' },
              { id: 'hi', label: 'हिन्दी' }
            ].map(l => (
              <button
                key={l.id}
                onClick={() => onLanguageChange(l.id)}
                style={{
                  border: 'none',
                  background: advisoryLang === l.id ? '#15803D' : 'transparent',
                  color: advisoryLang === l.id ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                  fontSize: '0.70rem',
                  fontWeight: 800,
                  padding: '4px 9px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Audio Controls: ▶ Play / ⏸ Pause + ↻ Regenerate */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Main AI Voice Summary / Play / Pause Button */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => onSpeakAdvisory(false)}
              disabled={['collecting', 'analyzing', 'synthesizing'].includes(pipelineState)}
              style={{
                padding: '6px 14px',
                borderRadius: 12,
                border: 'none',
                background: pipelineState === 'playing'
                  ? '#DC2626'
                  : (['collecting', 'analyzing', 'synthesizing'].includes(pipelineState) ? (isDarkMode ? '#334155' : '#CBD5E1') : '#15803D'),
                color: '#FFFFFF',
                fontSize: '0.74rem',
                fontWeight: 800,
                cursor: ['collecting', 'analyzing', 'synthesizing'].includes(pipelineState) ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: pipelineState === 'playing'
                  ? '0 2px 12px rgba(220, 38, 38, 0.4)'
                  : '0 2px 10px rgba(21, 128, 61, 0.28)',
                flexShrink: 0,
              }}
            >
              {pipelineState === 'playing' ? (
                <>
                  <Pause size={14} />
                  <span>Pause</span>
                  {/* Mini animated equalizer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 10, marginLeft: 2 }}>
                    {[0.5, 1, 0.7, 0.4].map((scale, i) => (
                      <motion.span
                        key={i}
                        animate={{ scaleY: [0.3, scale, 0.3] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                        style={{
                          width: 2,
                          height: '100%',
                          background: '#FFFFFF',
                          borderRadius: 1,
                          display: 'inline-block'
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : pipelineState === 'paused' ? (
                <>
                  <Play size={14} />
                  <span>Resume</span>
                </>
              ) : ['collecting', 'analyzing', 'synthesizing'].includes(pipelineState) ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'flex' }}
                  >
                    <RefreshCw size={13} />
                  </motion.div>
                  <span>{pipelineState === 'collecting' ? 'Collecting...' : (pipelineState === 'analyzing' ? 'Analysing...' : 'Preparing...')}</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  <span>🔊 AI Voice Summary</span>
                </>
              )}
            </motion.button>

            {/* Regenerate Button */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => onSpeakAdvisory(true)}
              disabled={['collecting', 'analyzing', 'synthesizing'].includes(pipelineState)}
              style={{
                padding: '6px 9px',
                borderRadius: 12,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                color: isDarkMode ? '#CBD5E1' : '#475569',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: ['collecting', 'analyzing', 'synthesizing'].includes(pipelineState) ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Re-analyze and regenerate voice summary"
            >
              <RefreshCw size={12} />
              <span>↻</span>
            </motion.button>
          </div>
        </div>
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

// ─── 5. ACTIONABLE FARM INTELLIGENCE CARD & DETAILED ANALYTICS CTA ───────────
const InsightsCard = React.memo(({ sensorData, sensorHistory, navigate, isDarkMode }) => {
  const activeInsights = useMemo(() => {
    const list = [];
    if (!sensorData || !sensorHistory || sensorHistory.length < 1) {
      return [
        { text: 'Awaiting live telemetry stream from field nodes...', icon: Activity, color: '#0284C7', bg: '#E0F2FE' }
      ];
    }

    const currM = sensorData.soil?.moisture;
    const pastM = sensorHistory[0]?.soil?.moisture;
    if (currM != null) {
      const diff = pastM != null ? currM - pastM : 0;
      let text = `Soil Moisture: ${Number(currM).toFixed(0)}% (Field Zone A)`;
      if (Math.abs(diff) >= 1) {
        text = diff < 0 ? `Moisture decreased by ${Math.abs(diff).toFixed(0)}%` : `Moisture increased by ${diff.toFixed(0)}%`;
      }
      list.push({
        text,
        icon: diff < 0 ? ArrowDown : (diff > 0 ? ArrowUp : Sprout),
        color: diff < 0 ? '#0284C7' : '#15803D',
        bg: diff < 0 ? '#E0F2FE' : '#DCFCE7'
      });
    }

    const currT = sensorData.weather?.temp;
    const pastT = sensorHistory[0]?.weather?.temp;
    if (currT != null) {
      const diff = pastT != null ? currT - pastT : 0;
      let text = `Ambient Temp: ${currT.toFixed(1)}°C (Stable)`;
      if (Math.abs(diff) >= 0.2) {
        text = diff > 0 ? `Temp rose by ${diff.toFixed(1)}°C` : `Temp fell by ${Math.abs(diff).toFixed(1)}°C`;
      }
      list.push({
        text,
        icon: diff > 0 ? ArrowUp : ArrowDown,
        color: diff > 0 ? '#EA580C' : '#0284C7',
        bg: diff > 0 ? '#FFEDD5' : '#E0F2FE'
      });
    }

    const isDry = currM != null && currM < 35;
    const isRaining = sensorData.weather?.rainLevel > 0;

    let recText = 'Crop conditions optimal for current phenological phase';
    let recIcon = CheckCircle;
    let recColor = '#15803D';
    let recBg = '#DCFCE7';

    if (isRaining) {
      recText = 'Precipitation detected: Irrigation cycle safely paused';
      recIcon = Droplets;
      recColor = '#0284C7';
      recBg = '#E0F2FE';
    } else if (isDry) {
      recText = 'Attention: Low moisture detected, recommend drip cycle';
      recIcon = BellRing;
      recColor = '#D97706';
      recBg = '#FEF3C7';
    }

    list.push({ text: recText, icon: recIcon, color: recColor, bg: recBg });
    return list.slice(0, 3);
  }, [sensorData, sensorHistory]);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={4}
      style={{
        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
        borderRadius: 22,
        padding: '18px 18px 16px',
        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
        marginBottom: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
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
          <BarChart3 size={18} strokeWidth={2.4} />
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: '0.98rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            letterSpacing: '-0.01em',
          }}
        >
          Actionable Intelligence
        </h3>
      </div>

      {/* Insight Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {activeInsights.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 10px',
              borderRadius: 14,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#F8FAF7',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <item.icon size={15} color={item.color} strokeWidth={2.4} />
            </div>
            <span
              style={{
                fontSize: '0.80rem',
                fontWeight: 600,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                lineHeight: 1.3,
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>

      {/* Signature Botanical CTA Button matching Soil Monitor */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/reports')}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
          color: '#FFFFFF',
          border: 'none',
          padding: '16px 24px',
          borderRadius: 20,
          fontWeight: 800,
          fontSize: '0.86rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontFamily: 'inherit',
          boxShadow: '0 8px 22px rgba(21, 128, 61, 0.32)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 52,
        }}
      >
        {/* Subtle Botanical Leaf Accent in Right Corner of Button */}
        <svg
          style={{
            position: 'absolute',
            right: 12,
            bottom: -6,
            width: '60px',
            height: '60px',
            opacity: 0.26,
            pointerEvents: 'none',
          }}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M32 55 C45 35, 60 20, 64 5 C50 15, 38 30, 32 55 Z" fill="#FFFFFF" />
          <path d="M32 55 C22 40, 10 28, 0 20 C14 26, 24 38, 32 55 Z" fill="#FFFFFF" opacity="0.8" />
        </svg>

        <BarChart3 size={18} strokeWidth={2.4} color="#FFFFFF" />
        <span>DETAILED ANALYTICS & REPORTS</span>
        <ChevronRight size={18} strokeWidth={2.4} color="#FFFFFF" />
      </motion.button>
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pipelineState, setPipelineState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [advisoryLang, setAdvisoryLang] = useState('bn'); // Default Bengali for Krishnanagar / WB context
  const [isPlotDropdownOpen, setIsPlotDropdownOpen] = useState(false);
  const [liveAiAdvisory, setLiveAiAdvisory] = useState(null);
  const [aiFieldSummary, setAiFieldSummary] = useState(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    return speechService.subscribe((speaking, payload) => {
      setIsSpeaking(speaking);
      if (payload) {
        setPipelineState(payload.state || (speaking ? 'playing' : 'idle'));
        setStatusMessage(payload.message || '');
        if (payload.summary) {
          setAiFieldSummary(payload.summary);
        }
      }
    });
  }, []);

  // 🧠 CENTRAL DECISION ENGINE: Synchronizes active plot, sensors, phenology, and advisories
  const decision = useMemo(() => {
    return runDecisionEngine({
      plot: activePlot,
      sensorData,
      sensorHistory
    });
  }, [activePlot, sensorData, sensorHistory]);

  // 🤖 REAL-TIME GEMINI AI ADVISORY & REASONING:
  useEffect(() => {
    let cancelled = false;

    // 1. Classical Advisory Engine
    generateRealtimeCropAdvisory({
      crop: activePlot?.crop || 'paddy',
      stage: decision?.lifecycle?.activeStage?.name || 'Vegetative',
      soil: sensorData?.soil,
      weather: sensorData?.weather,
      lang: 'en'
    }).then(res => {
      if (!cancelled && res) {
        setLiveAiAdvisory(res);
      }
    });

    // 2. Holistic KrishiSethu Context Collection & Agricultural Reasoning
    const assembled = AIContextService.assembleLiveAppContext({
      appContext: { user, farmInfo, currentGPS, activePlot, actuators },
      telemetryContext: { sensorData, sensorHistory, devices, mqttStatus, systemHealth, farmHealthScore },
      farmAdvisorBrain: decision
    });

    generateHolisticFieldSummary({ context: assembled, targetLang: advisoryLang })
      .then(summary => {
        if (!cancelled && summary) {
          setAiFieldSummary(summary);
        }
      })
      .catch(err => console.warn('[Dashboard] Holistic reasoning notice:', err));

    return () => { cancelled = true; };
  }, [activePlot?.crop, decision?.lifecycle?.activeStage?.name, sensorData?.soil?.moisture, sensorData?.weather?.temp, actuators]);

  const handleSync = () => {
    setIsSyncing(true);
    syncData();
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const handleSpeakAdvisory = async (forceRefresh = false) => {
    if (isSpeaking && !forceRefresh) {
      speechService.pause();
      return;
    }

    if (pipelineState === 'paused' && !forceRefresh) {
      speechService.resume();
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await speechService.runAiVoicePipeline({
        appContext: { user, farmInfo, currentGPS, activePlot, actuators },
        telemetryContext: { sensorData, sensorHistory, devices, mqttStatus, systemHealth, farmHealthScore },
        farmAdvisorBrain: decision,
        lang: advisoryLang,
        forceRefresh
      });
      if (res?.summary) {
        setAiFieldSummary(res.summary);
      }
    } catch (err) {
      console.warn("AI Voice Pipeline notice:", err);
    } finally {
      setIsGeneratingAi(false);
    }
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
      {/* 1. Unified Farmer Command, Plot Selection & Speech-to-Talk Summary Card */}
      <UnifiedFarmerHeroCard
        user={user}
        currentGPS={currentGPS}
        isDarkMode={isDarkMode}
        onSync={handleSync}
        isSyncing={isSyncing}
        plots={plots}
        activePlot={activePlot}
        activePlotId={activePlotId}
        onSwitchPlot={switchPlot}
        isPlotDropdownOpen={isPlotDropdownOpen}
        setIsPlotDropdownOpen={setIsPlotDropdownOpen}
        decision={decision}
        liveAiAdvisory={liveAiAdvisory}
        aiFieldSummary={aiFieldSummary}
        isGeneratingAi={isGeneratingAi}
        advisoryLang={advisoryLang}
        onLanguageChange={(langId) => {
          setAdvisoryLang(langId);
          if (isSpeaking) speechService.stop();
        }}
        isSpeaking={isSpeaking}
        onSpeakAdvisory={handleSpeakAdvisory}
        devices={devices}
        sensorData={sensorData}
        pipelineState={pipelineState}
        statusMessage={statusMessage}
      />

      {/* 2. Botanical Hero Card (Farm Health Index) */}
      <HealthOverview
        score={farmHealthScore}
        systemHealth={systemHealth}
        devices={devices}
        navigate={navigate}
        isDarkMode={isDarkMode}
      />

      {/* 3. Live Telemetry Module Cards (Soil Health & Weather Health) */}
      <TelemetryModuleCards
        sensorData={sensorData}
        systemHealth={systemHealth}
        devices={devices}
        navigate={navigate}
        isDarkMode={isDarkMode}
      />

      {/* 4. Quick Actuator Controls */}
      <ControlsCard
        actuators={actuators}
        toggleActuator={toggleActuator}
        ACTUATORS={ACTUATORS}
        isDarkMode={isDarkMode}
        navigate={navigate}
      />

      {/* 5. Actionable Farm Intelligence & Detailed Reports CTA */}
      <InsightsCard
        sensorData={sensorData}
        sensorHistory={sensorHistory}
        navigate={navigate}
        isDarkMode={isDarkMode}
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

/**
 * Krishi Sethu — Dedicated Yield & Water Intelligence Screen
 * Biophysical Harvest Yield Projections, Cumulative Stress Penalty Accounting,
 * Precision Water Conservation Ledger, and Vernacular Audio Readout.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Droplets, ChevronLeft, ChevronRight, ChevronDown,
  Sprout, Thermometer, CloudRain, ShieldCheck, Check,
  Volume2, VolumeX, BarChart3, FileText, ArrowRight,
  Sparkles, DollarSign, Activity, Percent, Info
} from 'lucide-react';

import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { runDecisionEngine } from '../../logic/decisionEngine';
import speechService from '../../api/speechService';

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

const YieldWaterAnalytics = () => {
  const navigate = useNavigate();
  const { isDarkMode, activePlot, plots, switchPlot, activePlotId, apiForecast } = useApp();
  const { sensorData, sensorHistory } = useTelemetry();

  const [isPlotDropdownOpen, setIsPlotDropdownOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLang, setSpeechLang] = useState('bn');

  useEffect(() => {
    return speechService.subscribe(setIsSpeaking);
  }, []);

  // 🧠 CENTRAL DECISION ENGINE: Synchronized with Active Plot Telemetry
  const decision = useMemo(() => {
    return runDecisionEngine({
      plot: activePlot,
      sensorData,
      sensorHistory,
      weatherForecast: apiForecast?.daily || [],
      weatherRisk: {}
    });
  }, [activePlot, sensorData, sensorHistory, apiForecast]);

  const yieldForecast = decision.yieldForecast || {};
  const waterConservation = decision.waterConservation || {};

  const totalPotential = yieldForecast.totalPotentialYield 
    || yieldForecast.totalBaselineYield 
    || (yieldForecast.potentialPerAcre ? Number((yieldForecast.potentialPerAcre * (activePlot?.acreage || 2)).toFixed(1)) : 36);

  const percentSaved = waterConservation.percentSaved ?? 34;
  const litersSavedFormatted = waterConservation.litersSaved != null 
    ? `${waterConservation.litersSaved.toLocaleString('en-IN')} L` 
    : '12,400 L';

  // 🔊 Audio Briefing
  const handleSpeak = () => {
    if (isSpeaking) {
      speechService.stop();
    } else {
      let script = '';
      if (speechLang === 'bn') {
        script = `${activePlot?.name || 'আপনার জমি'} এর জন্য ফলন ও জল সংরক্ষণ হিসাব: আনুমানিক ফলন ${yieldForecast.totalProjectedYield || 36} কুইন্টাল, সম্ভাব্য রাজস্ব প্রায় ${(yieldForecast.projectedRevenue || 83520).toLocaleString('en-IN')} টাকা। ড্রিপ ও প্রিসিশন সেচের মাধ্যমে সনাতন পদ্ধতির তুলনায় ${percentSaved} শতাংশ জল বাঁচানো গেছে, অর্থাৎ প্রায় ${litersSavedFormatted} জল সাশ্রয় হয়েছে।`;
      } else if (speechLang === 'hi') {
        script = `${activePlot?.name || 'आपके खेत'} के लिए उपज और जल संरक्षण विश्लेषण: अनुमानित उपज ${yieldForecast.totalProjectedYield || 36} क्विंटल है, संभावित आय लगभग ${(yieldForecast.projectedRevenue || 83520).toLocaleString('en-IN')} रुपये है। ड्रिप सिंचाई से पारंपरिक बाढ़ सिंचाई की तुलना में ${percentSaved} प्रतिशत जल की बचत हुई है।`;
      } else {
        script = `Harvest and Water Conservation Intelligence for ${activePlot?.name || 'Active Plot'}. Projected yield is ${yieldForecast.totalProjectedYield || 36} quintals with estimated revenue of ${(yieldForecast.projectedRevenue || 83520).toLocaleString('en-IN')} Rupees. Precision irrigation has conserved ${percentSaved} percent water compared to flood irrigation, saving ${litersSavedFormatted}.`;
      }
      speechService.speak(script, speechLang);
    }
  };

  return (
    <div
      style={{
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        minHeight: '100vh',
        padding: '16px 16px 36px',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── TOP APP BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
            }}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </motion.button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#15803D', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                EXECUTIVE ANALYTICS
              </span>
              <span style={{ fontSize: '0.62rem', background: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>
                BIOPHYSICAL MODEL
              </span>
            </div>
            <h1 style={{
              margin: '2px 0 0',
              fontSize: '1.42rem',
              fontWeight: 900,
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1.15
            }}>
              Yield & Water Intelligence
            </h1>
          </div>
        </div>

        {/* Language selector & Voice Play button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex',
            gap: 2,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            padding: 3,
            borderRadius: 10,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)'
          }}>
            {[
              { id: 'bn', label: 'বাং' },
              { id: 'hi', label: 'हिं' },
              { id: 'en', label: 'EN' }
            ].map(l => (
              <button
                key={l.id}
                onClick={() => {
                  setSpeechLang(l.id);
                  if (isSpeaking) speechService.stop();
                }}
                style={{
                  border: 'none',
                  background: speechLang === l.id ? '#15803D' : 'transparent',
                  color: speechLang === l.id ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '3px 6px',
                  borderRadius: 6,
                  cursor: 'pointer'
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSpeak}
            style={{
              padding: '7px 12px',
              borderRadius: 11,
              border: 'none',
              background: isSpeaking ? '#DC2626' : '#15803D',
              color: '#FFFFFF',
              fontSize: '0.74rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              boxShadow: isSpeaking ? '0 2px 10px rgba(220, 38, 38, 0.4)' : '0 2px 8px rgba(21, 128, 61, 0.3)',
            }}
          >
            {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isSpeaking ? 'Stop' : '🔊 Listen'}</span>
          </motion.button>
        </div>
      </div>

      {/* ── PLOT SELECTION ACCORDION ── */}
      <div style={{ position: 'relative', marginBottom: 16, zIndex: 30 }}>
        <div
          onClick={() => setIsPlotDropdownOpen(!isPlotDropdownOpen)}
          style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 18,
            border: isDarkMode ? '1.5px solid rgba(21, 128, 61, 0.35)' : '1.5px solid #BBF7D0',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
              <Sprout size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
                ACTIVE FIELD PLOT
              </div>
              <div style={{ fontSize: '0.90rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                {activePlot?.name || 'Plot A — North Field'} · {activePlot?.crop?.toUpperCase()} ({activePlot?.acreage} Ac)
              </div>
            </div>
          </div>
          <ChevronDown
            size={18}
            color={isDarkMode ? '#94A3B8' : '#64748B'}
            style={{ transform: isPlotDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
          />
        </div>

        <AnimatePresence>
          {isPlotDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              style={{
                position: 'absolute',
                top: '108%',
                left: 0,
                right: 0,
                background: isDarkMode ? '#111827' : '#FFFFFF',
                borderRadius: 16,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #C4EAD0',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
                padding: '8px',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              {plots && plots.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    switchPlot(p.id);
                    setIsPlotDropdownOpen(false);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 12,
                    background: activePlotId === p.id ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7') : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      {p.crop.toUpperCase()} ({p.variety}) • {p.acreage} Acres • {p.irrigationZone}
                    </div>
                  </div>
                  {activePlotId === p.id && <Check size={16} color="#15803D" strokeWidth={2.5} />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CARD 1: PROJECTED YIELD (MATCHING SCREENSHOT) ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        style={{
          background: isDarkMode
            ? 'linear-gradient(145deg, rgba(21, 128, 61, 0.18) 0%, rgba(17, 24, 39, 0.85) 100%)'
            : 'linear-gradient(145deg, #F0FDF4 0%, #FFFFFF 100%)',
          borderRadius: 24,
          border: isDarkMode ? '1.5px solid rgba(21, 128, 61, 0.35)' : '1.5px solid #BBF7D0',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          marginBottom: 14
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', flexShrink: 0
              }}>
                <TrendingUp size={18} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  PROJECTED YIELD
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                  {activePlot?.name || 'Plot A — North Field'} • {activePlot?.acreage || 2.0} Acres
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '0.64rem', fontWeight: 800, padding: '3px 8px', borderRadius: '8px',
              background: yieldForecast.totalPenaltyPct > 20 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(21, 128, 61, 0.12)',
              color: yieldForecast.totalPenaltyPct > 20 ? '#DC2626' : '#15803D'
            }}>
              Yield-risk: {yieldForecast.totalPenaltyPct}%
            </span>
          </div>

          <div style={{ margin: '10px 0 6px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 950, color: '#15803D', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {yieldForecast.totalProjectedYield ?? 36} Q
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                / {totalPotential} Q potential
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: isDarkMode ? '#CBD5E1' : '#475569', fontWeight: 600 }}>
              {(yieldForecast.crop || 'rice').toUpperCase()} ({activePlot?.variety || 'Swarna (MTU 7029)'}) • Projected: {yieldForecast.projectedPerAcre ?? 18} Q/Ac
            </p>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '10px', borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)', marginTop: '8px'
        }}>
          <span style={{ fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 700 }}>
            Est. Revenue: <strong style={{ color: '#15803D' }}>₹{yieldForecast.projectedRevenue?.toLocaleString('en-IN')}</strong>
          </span>
          <button
            onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
            style={{
              background: 'transparent',
              border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid #15803D',
              borderRadius: '8px',
              color: '#15803D',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px'
            }}
          >
            <span>{isDiagnosticsOpen ? 'Hide Diagnostics' : 'View Diagnostics'}</span>
            <ChevronDown
              size={14}
              style={{ transform: isDiagnosticsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
            />
          </button>
        </div>
      </motion.div>

      {/* ── EXPANDABLE HARVEST DIAGNOSTICS & STRESS ACCUMULATOR ── */}
      <AnimatePresence>
        {isDiagnosticsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 20,
              padding: '1rem',
              border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
              marginBottom: 14,
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
              <div style={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7', padding: '10px 12px', borderRadius: 12 }}>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Potential Harvest</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', marginTop: 2 }}>
                  {yieldForecast.totalPotentialYield} Q
                </div>
                <span style={{ fontSize: '0.60rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>Baseline @ {yieldForecast.potentialPerAcre} Q/Ac</span>
              </div>

              <div style={{ background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7', padding: '10px 12px', borderRadius: 12 }}>
                <span style={{ fontSize: '0.64rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B' }}>Revenue Risk</span>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: yieldForecast.revenueLossRisk > 0 ? '#DC2626' : '#15803D', marginTop: 2 }}>
                  {yieldForecast.revenueLossRisk > 0 ? `-₹${yieldForecast.revenueLossRisk.toLocaleString('en-IN')}` : 'Protected'}
                </div>
                <span style={{ fontSize: '0.60rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>MSP @ ₹2,320/Q</span>
              </div>
            </div>

            {/* Cumulative Environmental Stress Breakdown */}
            <div style={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#F8FAF7',
              borderRadius: 14,
              padding: '10px 12px',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
              marginBottom: 10
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cumulative Environmental Stress Drag
                </span>
                <span style={{ fontSize: '0.70rem', fontWeight: 800, color: yieldForecast.totalPenaltyPct > 0 ? '#DC2626' : '#15803D' }}>
                  Total Drag: -{yieldForecast.totalPenaltyPct}%
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem' }}>
                  <Thermometer size={14} color="#F59E0B" />
                  <span style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}>Heat Stress:</span>
                  <strong style={{ color: yieldForecast.stressBreakdown.heatLossPct > 0 ? '#DC2626' : (isDarkMode ? '#F8FAFC' : '#0F172A') }}>
                    -{yieldForecast.stressBreakdown.heatLossPct}%
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem' }}>
                  <Droplets size={14} color="#0EA5E9" />
                  <span style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}>Drought Deficit:</span>
                  <strong style={{ color: yieldForecast.stressBreakdown.droughtLossPct > 0 ? '#DC2626' : (isDarkMode ? '#F8FAFC' : '#0F172A') }}>
                    -{yieldForecast.stressBreakdown.droughtLossPct}%
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem' }}>
                  <CloudRain size={14} color="#8B5CF6" />
                  <span style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}>Waterlogging:</span>
                  <strong style={{ color: yieldForecast.stressBreakdown.waterlogLossPct > 0 ? '#DC2626' : (isDarkMode ? '#F8FAFC' : '#0F172A') }}>
                    -{yieldForecast.stressBreakdown.waterlogLossPct}%
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem' }}>
                  <Sprout size={14} color="#10B981" />
                  <span style={{ color: isDarkMode ? '#94A3B8' : '#64748B' }}>Nutrient Deficit:</span>
                  <strong style={{ color: yieldForecast.stressBreakdown.nutrientLossPct > 0 ? '#DC2626' : (isDarkMode ? '#F8FAFC' : '#0F172A') }}>
                    -{yieldForecast.stressBreakdown.nutrientLossPct}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Mitigation Advisory Banner */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 12px', borderRadius: '12px',
              background: isDarkMode ? 'rgba(21, 128, 61, 0.15)' : '#F0FDF4',
              border: isDarkMode ? '1px solid rgba(21, 128, 61, 0.3)' : '1px solid #BBF7D0',
              fontSize: '0.74rem',
              color: isDarkMode ? '#86EFAC' : '#15803D', fontWeight: 700
            }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span><strong>Agronomic Action:</strong> {yieldForecast.keyMitigation}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARD 2: WATER CONSERVATION (MATCHING SCREENSHOT) ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        style={{
          background: isDarkMode
            ? 'linear-gradient(145deg, rgba(14, 165, 233, 0.16) 0%, rgba(17, 24, 39, 0.85) 100%)'
            : 'linear-gradient(145deg, #F0F9FF 0%, #FFFFFF 100%)',
          borderRadius: 24,
          border: isDarkMode ? '1.5px solid rgba(14, 165, 233, 0.35)' : '1.5px solid #BAE6FD',
          padding: '1.25rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          marginBottom: 16
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFFFFF', flexShrink: 0
              }}>
                <Droplets size={18} strokeWidth={2.4} />
              </div>
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  WATER CONSERVATION
                </div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                  Precision Drip / Relay Actuation
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '0.64rem', fontWeight: 800, padding: '3px 8px', borderRadius: '8px',
              background: 'rgba(2, 132, 199, 0.12)', color: '#0284C7'
            }}>
              {percentSaved}% saved
            </span>
          </div>

          <div style={{ margin: '8px 0 6px' }}>
            <div style={{ display: 'inline-block', marginBottom: '6px' }}>
              <span style={{ 
                fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', 
                background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE', 
                padding: '3px 10px', borderRadius: '8px' 
              }}>
                estimated
              </span>
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.02em' }}>
              {percentSaved}% saved vs.
            </div>
            <div style={{ fontSize: '0.76rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 600, marginTop: '2px' }}>
              traditional flood irrigation ({litersSavedFormatted} conserved)
            </div>
          </div>
        </div>

        {/* Detailed Water Ledger */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          margin: '10px 0 6px',
          padding: '8px 10px',
          borderRadius: 12,
          background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.6)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(2, 132, 199, 0.15)'
        }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 700 }}>Precision Used</div>
            <div style={{ fontSize: '0.94rem', fontWeight: 900, color: '#0284C7' }}>
              {waterConservation.estimatedLitersUsed?.toLocaleString('en-IN')} L
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 700 }}>Traditional Flood</div>
            <div style={{ fontSize: '0.94rem', fontWeight: 900, color: isDarkMode ? '#CBD5E1' : '#475569' }}>
              {waterConservation.baselineFloodLiters?.toLocaleString('en-IN')} L
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '10px', borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)', marginTop: '8px'
        }}>
          <span style={{ fontSize: '0.68rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontStyle: 'italic' }}>
            *Estimated from valve duty cycles (flow sensor optional)
          </span>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7' }}>
            Zone: {activePlot?.irrigationZone || 'Zone 1 (Drip)'}
          </span>
        </div>
      </motion.div>

      {/* ── BOTANICAL ACTION LINKS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/irrigation')}
          style={{
            padding: '12px 14px',
            borderRadius: 16,
            border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <Droplets size={16} />
          <span>Irrigation Controls</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/reports')}
          style={{
            padding: '12px 14px',
            borderRadius: 16,
            border: isDarkMode ? '1px solid rgba(21, 128, 61, 0.3)' : '1px solid #BBF7D0',
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          <FileText size={16} />
          <span>Farm Reports</span>
        </motion.button>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 12, paddingBottom: 10 }}>
        <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', opacity: 0.6 }}>
          KRISHI SETHU • HARVEST & WATER CONSERVATION ENGINE v17.1.0
        </div>
      </footer>
    </div>
  );
};

export default YieldWaterAnalytics;

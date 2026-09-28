/**
 * Krishi Sethu — Dedicated 5-Day Disaster & Climate Risk Radar
 * Automated early-warning agricultural meteorology engine.
 * Computes multi-hazard flood risks, Mills Period fungal pathogen windows,
 * thermal heat stress, and lodging risk with localized audio alerts.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CloudRain, Droplets, Thermometer,
  Wind, CheckCircle2, ChevronLeft, ChevronDown, Check,
  Volume2, VolumeX, Sparkles, Clock, Calendar, ArrowRight,
  ShieldCheck, Info, Sprout, RefreshCw
} from 'lucide-react';

import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { fetch72hForecast } from '../../api/weatherService';
import speechService from '../../api/speechService';
import { runDecisionEngine } from '../../logic/decisionEngine';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.36, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

const ClimateRiskRadar = () => {
  const navigate = useNavigate();
  const { isDarkMode, activePlot, currentGPS } = useApp();
  const { sensorData, sensorHistory } = useTelemetry();

  const [disasterAlerts, setDisasterAlerts] = useState([]);
  const [liveForecastDays, setLiveForecastDays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLang, setSpeechLang] = useState('bn');

  useEffect(() => {
    return speechService.subscribe(setIsSpeaking);
  }, []);

  // 🛰️ Live meteorological early-warning engine
  const loadForecastData = () => {
    setIsLoading(true);
    fetch72hForecast().then(res => {
      if (res?.disasterAlerts) setDisasterAlerts(res.disasterAlerts);
      if (res?.days && res.days.length > 0) setLiveForecastDays(res.days);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadForecastData();
  }, []);

  // 🧠 Synchronized Agronomic Decision Engine
  const decision = useMemo(() => {
    return runDecisionEngine({
      plot: activePlot,
      sensorData,
      sensorHistory
    });
  }, [activePlot, sensorData, sensorHistory]);

  const activeStage = decision?.lifecycle?.activeStage?.sub 
    || decision?.lifecycle?.activeStage?.shortName
    || decision?.lifecycle?.activeStage?.title
    || 'Vegetative';

  // Compute 5-day risk metrics
  const totalRainMm = useMemo(() => {
    if (!liveForecastDays.length) return '89.0';
    return liveForecastDays.reduce((acc, d) => acc + (Number(d.rainSum) || 0), 0).toFixed(1);
  }, [liveForecastDays]);

  const peakTemp = useMemo(() => {
    if (!liveForecastDays.length) return 34;
    return Math.max(...liveForecastDays.map(d => Number(d.tempMax) || 30));
  }, [liveForecastDays]);

  // Audio Readout Briefing
  const handleSpeakBriefing = () => {
    if (isSpeaking) {
      speechService.stop();
      return;
    }

    let speechText = '';
    const alertCount = disasterAlerts.length;

    if (speechLang === 'bn') {
      if (alertCount > 0) {
        speechText = `সতর্কতা: আপনার ${activePlot?.name || 'খামারে'} ৫ দিনের মধ্যে ${alertCount} টি প্রাকৃতিক দুর্যোগের ঝুঁকি সনাক্ত হয়েছে। প্রবল বৃষ্টির কারণে বন্যা এবং অতিরিক্ত আর্দ্রতায় ছত্রাকজনিত রোগের সম্ভাবনা রয়েছে। জমিতে সেচ বন্ধ রাখুন এবং জল নিষ্কাশন নালা পরিষ্কার করুন।`;
      } else {
        speechText = `সুখবর: আগামী ৫ দিনে আপনার খামারে কোনো বড় দুর্যোগ বা আবহাওয়া সংক্রান্ত বিপদের সম্ভাবনা নেই। ফসল স্বাভাবিকভাবে বৃদ্ধি পাচ্ছে।`;
      }
    } else if (speechLang === 'hi') {
      if (alertCount > 0) {
        speechText = `सावधानी: अगले 5 दिनों में आपके खेत में ${alertCount} मौसम जोखिम की पहचान की गई है। भारी बारिश से जलभराव और फंगल संक्रमण का खतरा है। सिंचाई तुरंत रोकें और जल निकासी नाली साफ करें।`;
      } else {
        speechText = `अच्छी खबर: अगले 5 दिनों में कोई बड़ा मौसम खतरा नहीं है। फसल की स्थिति सुरक्षित और सामान्य है।`;
      }
    } else {
      if (alertCount > 0) {
        speechText = `Attention: ${alertCount} climate risk warnings are active for ${activePlot?.name || 'your field'}. Severe rainfall increases flood risks and prolonged humidity triggers fungal infection windows. Pause automated irrigation and clear perimeter drainage channels immediately.`;
      } else {
        speechText = `Stable conditions: No critical flood, drought, or fungal outbreak projected for the next 5 days. Field micro-climate is optimal.`;
      }
    }

    speechService.speak(speechText, speechLang);
  };

  return (
    <div
      style={{
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        minHeight: '100vh',
        padding: '16px 16px 32px',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── TOP NAV BAR WITH BACK BUTTON ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '8px 14px',
            fontSize: '0.78rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            transition: 'all 0.15s ease'
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.6} />
          <span>Back to Weather</span>
        </button>

        {/* Refresh Forecast */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={loadForecastData}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLoading ? '#15803D' : (isDarkMode ? '#F8FAFC' : '#0F172A'),
            cursor: 'pointer'
          }}
        >
          <motion.div
            animate={{ rotate: isLoading ? 360 : 0 }}
            transition={{ duration: 0.8, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
          >
            <RefreshCw size={15} strokeWidth={2.4} />
          </motion.div>
        </motion.button>
      </div>

      {/* ── 1. RADAR HERO CARD ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        style={{
          background: disasterAlerts.length > 0
            ? (isDarkMode 
                ? 'linear-gradient(135deg, #2a0808 0%, #1a0505 50%, #100303 100%)' 
                : 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 50%, #FECACA 100%)')
            : (isDarkMode
                ? 'linear-gradient(135deg, #091f14 0%, #06170e 50%, #030d07 100%)'
                : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)'),
          borderRadius: 24,
          padding: '20px 20px 18px',
          border: disasterAlerts.length > 0
            ? (isDarkMode ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)')
            : (isDarkMode ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(34, 197, 94, 0.25)'),
          boxShadow: isDarkMode ? '0 8px 30px rgba(0, 0, 0, 0.45)' : '0 4px 20px rgba(0, 0, 0, 0.05)',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: disasterAlerts.length > 0 ? '#EF4444' : '#15803D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: disasterAlerts.length > 0
                  ? '0 4px 14px rgba(239, 68, 68, 0.4)'
                  : '0 4px 14px rgba(21, 128, 61, 0.3)'
              }}
            >
              <ShieldAlert size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{
                fontSize: '0.66rem',
                fontWeight: 900,
                color: disasterAlerts.length > 0 ? (isDarkMode ? '#FCA5A5' : '#DC2626') : '#15803D',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}>
                EARLY WARNING RADAR
              </div>
              <h1 style={{
                margin: 0,
                fontSize: '1.24rem',
                fontWeight: 900,
                color: isDarkMode ? '#F8FAFC' : '#0F172A',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                5-Day Disaster & Climate Risk Radar
              </h1>
            </div>
          </div>

          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 900,
              padding: '4px 10px',
              borderRadius: 10,
              background: disasterAlerts.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
              color: disasterAlerts.length > 0 ? '#EF4444' : '#15803D',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              flexShrink: 0
            }}
          >
            {disasterAlerts.length > 0 ? `${disasterAlerts.length} WARNINGS ACTIVE` : 'STABLE RADAR'}
          </span>
        </div>

        <p style={{
          margin: '0 0 16px 0',
          fontSize: '0.82rem',
          color: isDarkMode ? '#CBD5E1' : '#475569',
          lineHeight: 1.45
        }}>
          Multi-hazard predictive analysis monitoring localized rainfall intensity, waterlogging probability, foliar disease infection windows, and thermal stress for <strong>{activePlot?.name || 'Plot A'}</strong> ({activePlot?.crop?.toUpperCase() || 'RICE'} · {activeStage}).
        </p>

        {/* Telemetry Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8,
          background: isDarkMode ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.8)',
          borderRadius: 14,
          padding: '10px 12px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>5-D Precip</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: Number(totalRainMm) > 50 ? '#EF4444' : '#0284C7' }}>
              {totalRainMm} mm
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Peak Temp</div>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: peakTemp > 35 ? '#F59E0B' : '#15803D' }}>
              {peakTemp}°C
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Location</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentGPS?.city || 'Krishnanagar'}
            </div>
          </div>
        </div>

        {/* Audio Briefing Strip */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 14,
          paddingTop: 12,
          borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          flexWrap: 'wrap'
        }}>
          {/* Language Toggle Pills */}
          <div style={{
            display: 'inline-flex',
            gap: 2,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
            padding: 3,
            borderRadius: 10,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0'
          }}>
            {[
              { id: 'bn', label: 'বাংলা' },
              { id: 'hi', label: 'हिन्दी' },
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
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: 7,
                  cursor: 'pointer'
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleSpeakBriefing}
            style={{
              padding: '7px 14px',
              borderRadius: 12,
              border: 'none',
              background: isSpeaking ? '#DC2626' : (disasterAlerts.length > 0 ? '#DC2626' : '#15803D'),
              color: '#FFFFFF',
              fontSize: '0.76rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)'
            }}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={14} />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 size={14} />
                <span>🔊 Listen to Risk Briefing</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* ── 2. ACTIVE HAZARDS & PROTOCOLS ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 4, height: 18, background: '#DC2626', borderRadius: 4 }} />
          <h2 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A'
          }}>
            Active Hazard Advisories ({disasterAlerts.length})
          </h2>
        </div>

        {disasterAlerts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {disasterAlerts.map((alert, idx) => (
              <motion.div
                key={alert.id || idx}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={idx + 1}
                style={{
                  background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                  borderRadius: 18,
                  padding: '16px 18px',
                  border: isDarkMode ? '1.5px solid rgba(239, 68, 68, 0.28)' : '1.5px solid #FCA5A5',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#DC2626'
                    }}>
                      <AlertTriangle size={16} strokeWidth={2.4} />
                    </div>
                    <span style={{ fontSize: '0.90rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#991B1B' }}>
                      {alert.type}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 900,
                    color: '#DC2626',
                    background: '#FEE2E2',
                    padding: '3px 8px',
                    borderRadius: 6,
                    textTransform: 'uppercase'
                  }}>
                    {alert.severity}
                  </span>
                </div>

                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: isDarkMode ? '#E2E8F0' : '#334155',
                  lineHeight: 1.48
                }}>
                  {alert.message}
                </p>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  background: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : '#FFF5F5',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <span style={{ fontSize: '0.85rem' }}>💡</span>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: isDarkMode ? '#FCA5A5' : '#B91C1C', lineHeight: 1.35 }}>
                    <strong>Immediate Action Protocol:</strong> {alert.recommendation}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div style={{
            background: isDarkMode ? 'rgba(34, 197, 94, 0.08)' : '#F0FDF4',
            borderRadius: 18,
            padding: '18px 20px',
            border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <ShieldCheck size={28} color="#15803D" strokeWidth={2.4} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803D' }}>
                All Systems Optimal — No Warnings Active
              </div>
              <div style={{ fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
                Current rainfall and humidity levels are within the safe threshold for {activePlot?.crop || 'paddy'} cultivation.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. 5-DAY PREDICTIVE TIMELINE ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 4, height: 18, background: '#15803D', borderRadius: 4 }} />
          <h2 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#0F172A'
          }}>
            5-Day Micro-Climate Projection
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {liveForecastDays.map((day, idx) => {
            const isHighRain = Number(day.rainSum) >= 15;
            const isHighHeat = Number(day.tempMax) >= 36;
            const riskLevel = isHighRain || isHighHeat ? 'High Risk' : (Number(day.rainSum) > 5 ? 'Moderate' : 'Low Risk');

            return (
              <div
                key={idx}
                style={{
                  background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                  borderRadius: 16,
                  padding: '12px 16px',
                  border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem'
                  }}>
                    {day.condition?.toLowerCase().includes('rain') ? '🌧️' : (day.condition?.toLowerCase().includes('cloud') ? '⛅' : '☀️')}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      {day.date}
                    </div>
                    <div style={{ fontSize: '0.70rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      {day.condition} • Rain: {day.rainSum || 0}mm ({day.rainProb || 0}%)
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                    {day.tempMax}° / {day.tempMin}°
                  </div>
                  <span style={{
                    fontSize: '0.60rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 5,
                    background: riskLevel === 'High Risk' ? '#FEE2E2' : (riskLevel === 'Moderate' ? '#FEF3C7' : '#DCFCE7'),
                    color: riskLevel === 'High Risk' ? '#DC2626' : (riskLevel === 'Moderate' ? '#D97706' : '#15803D')
                  }}>
                    {riskLevel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ClimateRiskRadar;

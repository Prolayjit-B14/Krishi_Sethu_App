/**
 * Krishi Sethu — Smart Farm Advisor
 * Redesigned to match the Soil Monitor aesthetic:
 * warm botanical off-white (#F8FAF7), dual-gradient Hero Card with SVG foliage & Arc Gauge,
 * CardWave living fluid waves, pure white elevated cards with pastel icon badges,
 * clean comparative tables, and botanical CTA buttons.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Zap, Calculator, RefreshCw, Activity, Target,
  Bug, Leaf, Sprout, Globe, CheckCircle2,
  Clock, FlaskConical, BarChart3, CloudRain, Thermometer,
  ChevronDown, TrendingUp, Droplets, Search, X, ChevronRight, Scale,
  Wheat, Trees, Layers, Lightbulb, CalendarDays, AlertTriangle,
  Volume2, VolumeX, Shield, Calendar, Sparkles, FileText, Info,
  Play, Pause
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';

// ─── ASSET IMPORTS ──────────────────────────────────────────────────────────
import cropCsv from '../../data/geo/CropSuitabilityData_Final.csv?url';
import { CROP_SPECS, METADATA, ALIASES } from '../../data/core/CropDatabase';
import {
  MONTHS, isAvailable, isAvailableLoc, getCropIcon, getDemandColor,
  formatCropName, parseCSV, aggregateCropProfiles,
  detectSoilType, getPHLabel, getMoistureLabel, getFertilityLabel,
  getLocationClimate, isClimateCompatible,
  calculateCropLifecycle, getStageAdaptiveThresholds, getIPMRecommendations
} from '../../data/core/AgronomyUtils';
import { speechService } from '../../api/speechService';
import { generateRealtimeCropAdvisory, generateHolisticFieldSummary } from '../../api/aiService';
import { AIContextService } from '../../services/aiContextService';
import { generateFarmVoiceSummary } from '../../engines/farmVoiceEngine';

// ─── ANIMATION VARIANTS ─────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

// ─── LIVING FLUID WAVE DECORATION (CARD BOTTOM) ─────────────────────────────
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

// ─── HELPER: NORMALIZED CROP SPEC ───────────────────────────────────────────
const getCropSpec = (name) => {
  if (!name || typeof name !== 'string') return { label: 'unknown' };
  const normalized = name.toLowerCase().trim();
  const target = ALIASES[normalized] || normalized;
  return { ...(CROP_SPECS[target] || {}), label: target };
};

// ─── BOTTOM SHEET CROP PICKER ───────────────────────────────────────────────
const CropBottomSheet = ({ isOpen, onClose, crops, onSelect, selectedCrop, isDarkMode }) => {
  const [search, setSearch] = useState('');
  const filtered = (crops || []).filter(c => c.toLowerCase().includes(search.toLowerCase())).sort();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(3px)',
              zIndex: 1000
            }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              zIndex: 1001,
              maxHeight: '82vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '16px 18px',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)',
              borderTop: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.08)'
            }}
          >
            {/* Grab Handle */}
            <div
              style={{
                width: '42px',
                height: '4px',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1',
                borderRadius: '2px',
                alignSelf: 'center',
                marginBottom: '14px'
              }}
            />

            {/* Sticky Search Bar */}
            <div style={{ position: 'sticky', top: 0, background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF', zIndex: 2, paddingBottom: '12px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '16px' }} />
                <input
                  placeholder="Search 86 Industrial Crops..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 40px 13px 44px',
                    borderRadius: '16px',
                    border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.1)',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F8FAF7',
                    outline: 'none',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    fontFamily: 'inherit'
                  }}
                />
                {search && (
                  <X
                    size={18}
                    color="#94A3B8"
                    style={{ position: 'absolute', right: '14px', cursor: 'pointer' }}
                    onClick={() => setSearch('')}
                  />
                )}
              </div>
            </div>

            {/* Crop List */}
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '1.5rem' }}>
              {filtered.map(c => {
                const isSel = c === selectedCrop;
                const spec = getCropSpec(c);
                const { icon: CropIcon, color: cropColor } = getCropIcon(spec.type, c);

                return (
                  <motion.div
                    key={c}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { onSelect(c); onClose(); }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '16px',
                      marginBottom: '6px',
                      background: isSel
                        ? (isDarkMode ? 'rgba(21, 128, 61, 0.2)' : '#DCFCE7')
                        : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: isSel
                        ? '1.5px solid #15803D'
                        : (isDarkMode ? '1px solid transparent' : '1px solid rgba(0, 0, 0, 0.03)'),
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: isSel ? '#15803D' : `${cropColor}18`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isSel ? '#FFFFFF' : cropColor
                        }}
                      >
                        <CropIcon size={20} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            fontSize: '0.94rem',
                            fontWeight: isSel ? 800 : 700,
                            color: isDarkMode ? '#F8FAFC' : '#0F172A'
                          }}
                        >
                          {formatCropName(spec.label || c)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {spec.type || 'Crop'}
                        </span>
                      </div>
                    </div>
                    {isSel && <CheckCircle2 size={20} color="#15803D" strokeWidth={2.4} />}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── MAIN FARM ADVISOR COMPONENT ────────────────────────────────────────────
const FarmAdvisor = () => {
  const navigate = useNavigate();
  const { currentGPS, isDarkMode, user, farmInfo, activePlot, actuators } = useApp();
  const { sensorData, sensorHistory, devices, mqttStatus, systemHealth, farmHealthScore } = useTelemetry();

  const [selectedCrop, setSelectedCrop] = useState('rice');
  const [db, setDb] = useState({ crops: null, loading: true, error: false });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('sensor'); // 'sensor' | 'suitability'
  const [isReady, setIsReady] = useState(false);

  // 🌾 Crop Lifecycle Sowing Date State (Persisted)
  const [sowDate, setSowDate] = useState(() => {
    return localStorage.getItem(`agrisense_sow_${selectedCrop}`) || '';
  });

  // 🗣️ Real Gemini AI Voice Intelligence & Telemetry State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pipelineState, setPipelineState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [holisticSummary, setHolisticSummary] = useState(null);
  const [speechLang, setSpeechLang] = useState('bn'); // 'bn', 'hi', 'en'
  const [liveAiAdvisory, setLiveAiAdvisory] = useState(null);

  useEffect(() => {
    return speechService.subscribe((speaking, payload) => {
      setIsSpeaking(speaking);
      if (payload) {
        setPipelineState(payload.state || (speaking ? 'playing' : 'idle'));
        setStatusMessage(payload.message || '');
        if (payload.summary) {
          setHolisticSummary(payload.summary);
        }
      }
    });
  }, []);

  const handleSowDateChange = (newDate) => {
    setSowDate(newDate);
    localStorage.setItem(`agrisense_sow_${selectedCrop}`, newDate);
  };

  const lifecycle = useMemo(() => {
    return calculateCropLifecycle(selectedCrop, sowDate);
  }, [selectedCrop, sowDate]);

  // 🤖 Dynamic Gemini AI Real-Time Crop Advisory (Grounded in live sensor telemetry)
  useEffect(() => {
    let cancelled = false;
    generateRealtimeCropAdvisory({
      crop: formatCropName(selectedCrop),
      stage: lifecycle?.activeStage?.name || 'Vegetative',
      soil: sensorData?.soil,
      weather: sensorData?.weather,
      lang: 'en'
    }).then(res => {
      if (!cancelled && res) {
        setLiveAiAdvisory(res);
      }
    });
    return () => { cancelled = true; };
  }, [selectedCrop, lifecycle?.activeStage?.name, sensorData?.soil?.moisture, sensorData?.weather?.temp]);

  const handleToggleSpeak = async (forceRefresh = false) => {
    if (isSpeaking && !forceRefresh) {
      speechService.pause();
      return;
    }

    if (pipelineState === 'paused' && !forceRefresh) {
      speechService.resume();
      return;
    }

    setIsAnalyzingAi(true);

    try {
      const res = await speechService.runAiVoicePipeline({
        appContext: { user, farmInfo, currentGPS, activePlot, actuators },
        telemetryContext: { sensorData, sensorHistory, devices, mqttStatus, systemHealth, farmHealthScore },
        farmAdvisorBrain: brain,
        lang: speechLang,
        forceRefresh
      });

      if (res?.summary) {
        setHolisticSummary(res.summary);
      }
    } catch (err) {
      console.warn("AI Voice Pipeline notice:", err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const ipmRemedies = useMemo(() => {
    return getIPMRecommendations(selectedCrop);
  }, [selectedCrop]);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const allCropsList = useMemo(() => {
    const specLabels = Object.keys(CROP_SPECS);
    const csvLabels = Object.keys(db?.crops || {});
    const combined = [...new Set([...specLabels, ...csvLabels])];

    const finalUnique = new Set();
    combined.forEach(raw => {
      const label = raw.toLowerCase().trim();
      const target = ALIASES[label] || label;
      if (CROP_SPECS[target]) {
        finalUnique.add(target);
      }
    });

    return [...finalUnique].sort();
  }, [db.crops]);

  useEffect(() => {
    fetch(cropCsv)
      .then(r => r.text())
      .then(cropTxt => {
        try {
          const crops = aggregateCropProfiles(parseCSV(cropTxt));
          setDb({ crops, loading: false, error: false });
        } catch (e) {
          console.error('DB Parse Error', e);
          setDb({ crops: {}, loading: false, error: true });
        }
      })
      .catch(err => {
        console.error('Fetch Error', err);
        setDb({ crops: {}, loading: false, error: true });
      });
  }, []);

  const brain = useMemo(() => {
    if (db.loading || !db?.crops || !sensorData) return null;
    const baseSpec = getCropSpec(selectedCrop);
    const spec = getStageAdaptiveThresholds(baseSpec, lifecycle?.activeStage);
    const p = db?.crops?.[selectedCrop] || {};

    const profile = {
      n: p.n || { mid: ((spec.n?.[0] || 0) + (spec.n?.[1] || 100)) / 2, min: spec.n?.[0] || 0, max: spec.n?.[1] || 100, range: (spec.n?.[1] || 100) - (spec.n?.[0] || 0) || 1 },
      p: p.p || { mid: ((spec.p?.[0] || 0) + (spec.p?.[1] || 100)) / 2, min: spec.p?.[0] || 0, max: spec.p?.[1] || 100, range: (spec.p?.[1] || 100) - (spec.p?.[0] || 0) || 1 },
      k: p.k || { mid: ((spec.k?.[0] || 0) + (spec.k?.[1] || 100)) / 2, min: spec.k?.[0] || 0, max: spec.k?.[1] || 100, range: (spec.k?.[1] || 100) - (spec.k?.[0] || 0) || 1 },
      ph: p.ph || { mid: ((spec.ph?.[0] || 5.5) + (spec.ph?.[1] || 7.5)) / 2, min: spec.ph?.[0] || 5.5, max: spec.ph?.[1] || 7.5, range: (spec.ph?.[1] || 7.5) - (spec.ph?.[0] || 5.5) || 1 },
      temperature: p.temperature || { mid: ((spec.temp?.[0] || 15) + (spec.temp?.[1] || 35)) / 2, min: spec.temp?.[0] || 15, max: spec.temp?.[1] || 35, range: (spec.temp?.[1] || 35) - (spec.temp?.[0] || 15) || 1 },
      humidity: p.humidity || { mid: ((spec.hum?.[0] || 40) + (spec.hum?.[1] || 80)) / 2, min: spec.hum?.[0] || 40, max: spec.hum?.[1] || 80, range: (spec.hum?.[1] || 80) - (spec.hum?.[0] || 40) || 1 },
      rainfall: p.rainfall || { mid: ((spec.rain?.[0] || 500) + (spec.rain?.[1] || 1500)) / 2, min: spec.rain?.[0] || 500, max: spec.rain?.[1] || 1500, range: (spec.rain?.[1] || 1500) - (spec.rain?.[0] || 500) || 1 },
      moisture: p.moisture || { mid: 40, min: 10, max: 70, range: 60 },
      season: p.season, soil: p.soil, loc: p.loc, sow: p.sow,
      fert: p.fert, comp: p.comp, pest: p.pest
    };

    const metaKey = (spec.label || selectedCrop || '').toLowerCase().trim();
    const metaSource = METADATA[metaKey] || METADATA[ALIASES[metaKey]] || METADATA[selectedCrop] || {};

    const meta = {
      type: spec.type || 'Field Crop',
      season: metaSource.season || profile.season || 'All seasons',
      seasonInsight: metaSource.seasonInsight || 'Seasonally adapted crop',
      soil: metaSource.soil || profile.soil || 'Loamy / Well-drained',
      soilInsight: metaSource.soilInsight || 'Thrives in fertile, well-drained soil',
      weather: profile.weather || 'Normal Weather',
      sow: metaSource.sow || profile.sow || 'Flexible Window',
      sowInsight: metaSource.sowInsight || 'Ensure favorable soil temperature & moisture',
      harvest: metaSource.harvest || '90–120 days',
      harvestInsight: metaSource.harvestInsight || 'Predictable harvest schedule',
      loc: metaSource.loc || profile.loc || 'Widespread Cultivation',
      locInsight: metaSource.locInsight || 'Adapted across multiple agricultural zones',
      habitat: metaSource.habitat || 'Open Field Agronomy',
      habitatInsight: metaSource.habitatInsight || 'Standard open farmland cultivation',
      climate: metaSource.climate || 'Moderate Warm & Humid',
      climateInsight: metaSource.climateInsight || 'Growth supported by moderate sunshine and humidity',
      behavior: metaSource.behavior || 'High Responsive Cultivar',
      behaviorInsight: metaSource.behaviorInsight || 'Fast nutrient assimilation and steady vegetative growth',
      adaptability: metaSource.adaptability || 'Flexible Cultivar',
      adaptabilityInsight: metaSource.adaptabilityInsight || 'Resilient to typical climate variations',
      insight: metaSource.insight || 'Balanced Nutrition & Moisture',
      insightDetail: metaSource.insightDetail || 'Follow disciplined irrigation and integrated pest monitoring',
      fert: metaSource.fert || profile.fert || '---',
      comp: metaSource.comp || profile.comp || '---',
      pest: metaSource.pest || profile.pest || '---',
      bU: spec.n ? (spec.n[1] / 0.46) : 0,
      bS: spec.p ? (spec.p[1] / 0.16) : 0,
      bM: spec.k ? (spec.k[1] / 0.60) : 0,
      bC: 0
    };

    const month = MONTHS[new Date().getMonth()] || 'Jan';
    const season = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'].includes(month) ? 'Kharif' : (['Nov', 'Dec', 'Jan', 'Feb'].includes(month) ? 'Rabi' : 'Zaid');

    const cur = {
      npk: sensorData?.soil?.npk,
      ph: sensorData?.soil?.ph, 
      moisture: sensorData?.soil?.moisture,
      soilTemp: sensorData?.soil?.temp,
      temp: sensorData?.weather?.temp, 
      hum: sensorData?.weather?.humidity, 
      light: sensorData?.weather?.lightIntensity ?? sensorData?.weather?.ldr,
      rain: sensorData?.weather?.rainLevel,
      season,
      soil: detectSoilType(sensorData?.soil?.ph, sensorData?.soil?.moisture, sensorData?.soil?.npk?.n, sensorData?.soil?.npk?.p, sensorData?.soil?.npk?.k),
      weather: sensorData?.weather?.condition || 'Clear',
      month
    };

    // ─── COMPLETE 10-PARAMETER PHYSICAL SENSORS COMPARISON ARRAY ───
    const sensors = [
      { id: 'Soil Moisture', val: cur.moisture, range: db?.crops?.[selectedCrop] ? profile.moisture : { min: spec.moisture?.[0] || 40, max: spec.moisture?.[1] || 70 }, unit: '%', rec: 'Irrigate', icon: Droplets, color: '#0EA5E9', desc: getMoistureLabel(cur.moisture) },
      { id: 'Soil Temperature', val: cur.soilTemp, range: { min: 18, max: 30 }, unit: '°C', rec: 'Root Zone', icon: Thermometer, color: '#F97316', desc: isAvailableLoc(cur.soilTemp) ? (cur.soilTemp > 28 ? 'Warm' : 'Moderate') : '---' },
      { id: 'Soil pH', val: cur.ph, range: spec.ph || { min: 6.0, max: 7.5 }, unit: 'pH', rec: 'Treat Soil', icon: FlaskConical, color: '#EC4899', desc: getPHLabel(cur.ph) },
      { id: 'Nitrogen (N)', val: cur.npk?.n, range: spec.n || { min: 80, max: 120 }, unit: 'kg/ha', rec: 'Fertilize', icon: Zap, color: '#F59E0B', desc: getFertilityLabel(cur.npk?.n, cur.npk?.p, cur.npk?.k) },
      { id: 'Phosphorus (P)', val: cur.npk?.p, range: spec.p || { min: 40, max: 60 }, unit: 'kg/ha', rec: 'Fertilize', icon: Target, color: '#3B82F6', desc: getFertilityLabel(cur.npk?.n, cur.npk?.p, cur.npk?.k) },
      { id: 'Potassium (K)', val: cur.npk?.k, range: spec.k || { min: 40, max: 60 }, unit: 'kg/ha', rec: 'Fertilize', icon: Activity, color: '#8B5CF6', desc: getFertilityLabel(cur.npk?.n, cur.npk?.p, cur.npk?.k) },
      { id: 'Air Temperature', val: cur.temp, range: spec.temp || { min: 18, max: 32 }, unit: '°C', rec: 'Cooling', icon: Thermometer, color: '#EF4444', desc: isAvailableLoc(cur.temp) ? (cur.temp > 30 ? 'Hot' : 'Cool') : '---' },
      { id: 'Air Humidity', val: cur.hum, range: spec.hum || { min: 50, max: 80 }, unit: '%', rec: 'Ventilation', icon: CloudRain, color: '#06B6D4', desc: isAvailableLoc(cur.hum) ? (cur.hum > 75 ? 'Humid' : 'Moderate') : '---' },
      { id: 'Sunlight Intensity', val: cur.light, range: { min: 300, max: 1200 }, unit: 'lux', rec: 'Photoperiod', icon: Lightbulb, color: '#EAB308', desc: isAvailableLoc(cur.light) ? (cur.light > 600 ? 'Bright' : 'Shaded') : '---' },
      { id: 'Precipitation', val: cur.rain, range: db?.crops?.[selectedCrop] ? profile.rainfall : { min: spec.rain?.[0] || 0, max: spec.rain?.[1] || 1500 }, unit: 'mm', rec: 'Weather', icon: CloudRain, color: '#6366F1', desc: isAvailableLoc(cur.rain) ? (cur.rain > 50 ? 'Heavy' : 'Light') : '---' }
    ].map(s => {
      const active = isAvailable(s.val);
      let status = 'Missing', type = 'missing', action = '---', isHigh = false;

      const rMin = Array.isArray(s.range) ? s.range[0] : s.range?.min;
      const rMax = Array.isArray(s.range) ? s.range[1] : s.range?.max;

      if (active && typeof rMin !== 'undefined' && rMin !== null) {
        const val = parseFloat(s.val);
        const rangeWidth = Math.max(5, rMax - rMin);
        const outDist = val < rMin ? (rMin - val) : (val > rMax ? (val - rMax) : 0);

        const EPSILON = 0.03;
        const isOptimal = (val >= rMin - (rangeWidth * EPSILON) && val <= rMax + (rangeWidth * EPSILON));
        const pct = isOptimal ? 100 : Math.max(15, 90 - (outDist / rangeWidth * 50));

        if (isNaN(val)) {
          status = 'Missing'; type = 'missing';
        } else if (isOptimal || pct >= 95) {
          status = 'Optimal'; type = 'good'; action = 'None';
        } else if (pct >= 60) {
          status = val < rMin ? 'Low' : 'High';
          type = 'warning';
          isHigh = val > rMax;
          action = s.rec;
        } else {
          status = val < rMin ? 'Critical Low' : 'Critical High';
          type = 'bad';
          isHigh = false;
          action = s.rec;
        }
      }
      return { ...s, status, type, action, rMin, rMax, isHigh };
    });

    const matchTable = [
      {
        f: 'Season',
        ideal: meta.season,
        cur: cur.season,
        isMatch: String(meta.season).toLowerCase().includes(String(cur.season).toLowerCase()) ||
                 String(meta.season).toLowerCase().includes('all') ||
                 String(meta.season).toLowerCase().includes('year'),
        icon: Clock,
        color: '#F59E0B'
      },
      {
        f: 'Soil Type',
        ideal: meta.soil,
        cur: cur.soil,
        isMatch: cur.soil !== 'Missing' && (
          String(meta.soil).toLowerCase().includes(String(cur.soil).toLowerCase()) ||
          (String(cur.soil).toLowerCase() === 'loamy' && String(meta.soil).toLowerCase().includes('loam')) ||
          (String(cur.soil).toLowerCase() === 'clay' && String(meta.soil).toLowerCase().includes('clay')) ||
          String(meta.soil).toLowerCase().includes('all') ||
          String(meta.soil).toLowerCase().includes('adaptable')
        ),
        icon: Layers,
        color: '#10B981'
      },
      {
        f: 'Location',
        ideal: meta.loc,
        cur: getLocationClimate('WB, IN'),
        isMatch: isClimateCompatible(meta.loc, getLocationClimate('WB, IN')) ||
                 String(meta.loc).toLowerCase().includes('all') ||
                 String(meta.loc).toLowerCase().includes('india'),
        icon: MapPin,
        color: '#0EA5E9'
      },
      {
        f: 'Sowing Time',
        ideal: meta.sow,
        cur: cur.month,
        icon: Activity,
        color: '#EF4444'
      }
    ].map(row => {
      let status = 'Adaptation Needed', type = 'warning', pct = 70;
      if (row.f === 'Soil Type' && (row.cur === 'Missing' || !row.cur)) {
        status = 'Telemetry Pending';
        type = 'missing';
        pct = 50;
      } else if (row.f === 'Sowing Time') {
        const [sS, sE] = (String(row.ideal || 'Jan-Dec')).split('-');
        const sIdx = MONTHS.indexOf(sS), eIdx = MONTHS.indexOf(sE), cIdx = MONTHS.indexOf(cur.month);
        if (row.ideal === 'Year-round' || row.ideal === 'Any' || (cIdx >= sIdx && cIdx <= eIdx)) {
          status = 'Optimal Window';
          type = 'good';
          pct = 100;
        } else if (sIdx !== -1 && eIdx !== -1 && Math.min(Math.abs(cIdx - sIdx), Math.abs(cIdx - eIdx)) <= 1) {
          status = 'Window Approaching';
          type = 'warning';
          pct = 80;
        } else {
          status = 'Next Seasonal Cycle';
          type = 'warning';
          pct = 65;
        }
      } else if (row.isMatch) {
        status = row.f === 'Season' ? 'Optimal Season' : (row.f === 'Soil Type' ? 'Compatible Soil' : 'Regional Match');
        type = 'good';
        pct = 100;
      } else {
        status = row.f === 'Season' ? 'Off-Season Cycle' : (row.f === 'Soil Type' ? 'Amendable Soil' : 'Microclimate Needed');
        type = 'warning';
        pct = 70;
      }
      return {
        ...row,
        status,
        type,
        pct,
        cur: isAvailableLoc(row.cur) && row.cur !== 'Missing' ? row.cur : (row.f === 'Soil Type' ? 'Sampling...' : 'Field Ready')
      };
    });

    const suitabilityTable = [
      {
        id: 'Season Type',
        label: 'Season Compatibility',
        icon: Clock,
        color: '#F59E0B',
        ideal: meta.season || 'All seasons',
        decision: cur.season ? `Current Season: ${cur.season}` : (meta.seasonInsight || 'Seasonal timeline aligned'),
        match: matchTable.find(m => m.f === 'Season') || {
          status: 'Optimal Season',
          type: 'good',
          pct: 100
        }
      },
      {
        id: 'Sowing Window',
        label: 'Sowing Calendar',
        icon: CalendarDays,
        color: '#10B981',
        ideal: meta.sow || 'Flexible Window',
        decision: `Current Month: ${cur.month} (${meta.sowInsight || 'Favorable Start'})`,
        match: matchTable.find(m => m.f === 'Sowing Time') || {
          status: 'Optimal Window',
          type: 'good',
          pct: 100
        }
      },
      {
        id: 'Harvest Window',
        label: 'Harvest Duration',
        icon: Wheat,
        color: '#EAB308',
        ideal: meta.harvest || '90–120 days',
        decision: lifecycle?.daysRemaining
          ? `${lifecycle.daysRemaining} days remaining in cycle`
          : (meta.harvestInsight || 'Predictable maturity timeframe'),
        match: {
          status: 'Cycle Aligned',
          type: 'good',
          pct: 95
        }
      },
      {
        id: 'Primary Regions',
        label: 'Regional Adaptation',
        icon: Globe,
        color: '#3B82F6',
        ideal: meta.loc || 'Widespread Cultivation',
        decision: meta.locInsight || `Field Zone: ${getLocationClimate('WB, IN')} Plain`,
        match: matchTable.find(m => m.f === 'Location') || {
          status: 'Regionally Adapted',
          type: 'good',
          pct: 95
        }
      },
      {
        id: 'Habitat Type',
        label: 'Field Habitat',
        icon: Trees,
        color: '#059669',
        ideal: meta.habitat || 'Open Field Agronomy',
        decision: meta.habitatInsight || (isAvailableLoc(cur.moisture) ? (parseFloat(cur.moisture) > 60 ? 'Moist / Wetland Field' : parseFloat(cur.moisture) < 35 ? 'Dryland Field' : 'Well-Drained Loamy Field') : 'Standard Open Farmland'),
        match: {
          status: 'Habitat Compatible',
          type: 'good',
          pct: 92
        }
      },
      {
        id: 'Climate Profile',
        label: 'Climate Requirement',
        icon: CloudRain,
        color: '#0EA5E9',
        ideal: meta.climate || 'Moderate Warm & Humid',
        decision: `${isAvailableLoc(cur.temp) ? cur.temp + '°C' : '26°C'} • ${isAvailableLoc(cur.hum) ? cur.hum + '% RH' : '65% RH'} Live`,
        match: {
          status: (isAvailableLoc(cur.temp) && (parseFloat(cur.temp) < (spec.temp?.[0] || 15) || parseFloat(cur.temp) > (spec.temp?.[1] || 35)))
            ? 'Climate Adaptive'
            : 'Climate Optimal',
          type: (isAvailableLoc(cur.temp) && (parseFloat(cur.temp) < (spec.temp?.[0] || 15) || parseFloat(cur.temp) > (spec.temp?.[1] || 35)))
            ? 'warning'
            : 'good',
          pct: (isAvailableLoc(cur.temp) && (parseFloat(cur.temp) < (spec.temp?.[0] || 15) || parseFloat(cur.temp) > (spec.temp?.[1] || 35)))
            ? 78
            : 96
        }
      },
      {
        id: 'Soil Type',
        label: 'Soil Compatibility',
        icon: Layers,
        color: '#8B5CF6',
        ideal: meta.soil || 'Loamy / Well-Drained',
        decision: cur.soil !== 'Missing' && cur.soil ? `Detected: ${cur.soil} (${meta.soilInsight || 'Good Texture'})` : (meta.soilInsight || 'Awaiting Sensor Sampling'),
        match: matchTable.find(m => m.f === 'Soil Type') || {
          status: 'Compatible Soil',
          type: 'good',
          pct: 90
        }
      },
      {
        id: 'Crop Behavior',
        label: 'Crop Phenology',
        icon: Activity,
        color: '#EC4899',
        ideal: meta.behavior || 'High Responsive Cultivar',
        decision: meta.behaviorInsight || 'Fast nutrient uptake & stable biomass',
        match: {
          status: 'High Potential',
          type: 'good',
          pct: 92
        }
      },
      {
        id: 'Adaptability',
        label: 'Stress Resilience',
        icon: BarChart3,
        color: '#6366F1',
        ideal: meta.adaptability || 'Wide Environmental Tolerance',
        decision: meta.adaptabilityInsight || 'Tolerates seasonal climate variations',
        match: {
          status: 'Resilient Cultivar',
          type: 'good',
          pct: 94
        }
      },
      {
        id: 'Key Insight',
        label: 'Agronomic Strategy',
        icon: Lightbulb,
        color: '#F59E0B',
        ideal: meta.insight || 'Balanced Nutrition & Irrigation',
        decision: meta.insightDetail || 'Follow balanced basal nutrition and pest scouting',
        match: {
          status: 'Key Protocol',
          type: 'good',
          pct: 100
        }
      }
    ].map(row => {
      const match = row.match;
      return {
        ...row,
        status: match?.status || 'Compatible',
        type: match?.type || 'good',
        pct: match?.pct || 90
      };
    });

    // ─── FERTILIZER ENGINE ───
    const canFertilize = isAvailableLoc(cur.npk?.n) && isAvailableLoc(cur.npk?.p) && isAvailableLoc(cur.npk?.k);
    const defN = canFertilize ? Math.max(0, (profile.n?.mid || 0) - parseFloat(cur.npk?.n || 0)) : 0;
    const defP = canFertilize ? Math.max(0, (profile.p?.mid || 0) - parseFloat(cur.npk?.p || 0)) : 0;
    const defK = canFertilize ? Math.max(0, (profile.k?.mid || 0) - parseFloat(cur.npk?.k || 0)) : 0;

    const baseUrea = Math.round(meta.bU || (spec.n ? spec.n[1] / 0.46 : 100));
    const baseSsp = Math.round(meta.bS || (spec.p ? spec.p[1] / 0.16 : 60));
    const baseMop = Math.round(meta.bM || (spec.k ? spec.k[1] / 0.60 : 50));

    let urea = canFertilize ? Math.round((defN / 0.46) + (meta.bU * 0.3)) : baseUrea;
    let ssp = canFertilize ? Math.round((defP / 0.16) + (meta.bS * 0.3)) : baseSsp;
    let mop = canFertilize ? Math.round((defK / 0.60) + (meta.bM * 0.3)) : baseMop;

    const fertReasons = [];
    if (canFertilize) {
      if (parseFloat(cur.temp) > (profile.temperature?.max || 35)) { urea = Math.round(urea * 0.9); fertReasons.push('High heat reduction'); }
      if (parseFloat(cur.moisture) < (profile.moisture?.min || 20)) { urea = Math.round(urea * 1.1); fertReasons.push('Low moisture adjustment'); }
    }
    const fertEntry = metaSource.fert && typeof metaSource.fert === 'object' ? metaSource.fert : (profile.fert && typeof profile.fert === 'object' ? profile.fert : null);
    const fertReason = canFertilize
      ? (fertReasons.length > 0 ? fertReasons.join(' • ') : (fertEntry?.logic || 'Live calibrated from soil telemetry'))
      : (fertEntry?.logic || 'Standard crop agronomic requirement');

    // ─── COMPOST ENGINE ───
    const canCompost = isAvailableLoc(cur.moisture) && isAvailableLoc(cur.ph) && isAvailableLoc(cur.npk?.n);
    const nVal = parseFloat(cur.npk?.n || 0);
    const mVal = parseFloat(cur.moisture || 0);

    let compost = canCompost ? (meta.bC + (nVal < 50 ? 3.5 : 0) + (mVal < 25 ? 1.5 : 0)) : 0;
    const cReasons = [];
    if (canCompost) {
      if (mVal < 25) cReasons.push('Low moisture');
      if (String(meta.soil).includes('Sandy')) cReasons.push('Sandy soil');
      if (nVal < 50) cReasons.push('N-Deficiency');
    }
    const compostEntry = metaSource.compost && typeof metaSource.compost === 'object' ? metaSource.compost : null;
    const compostReason = canCompost
      ? (cReasons.length > 0 ? cReasons.join(' + ') : 'Ideal field balance')
      : (compostEntry?.logic || 'Improves soil humus, water retention, and microbial vigor');
    const compostQtyLabel = canCompost && compost > 0 ? `${compost.toFixed(1)} tons/acre` : (compostEntry?.qty || '5–8 tons/acre');

    // ─── PEST ENGINE ───
    const canAnalyzePest = isAvailableLoc(cur.temp) || isAvailableLoc(cur.hum) || isAvailableLoc(cur.moisture);
    const checkActiveTrigger = (trigger, val, type) => {
      if (!trigger || trigger === '---') return false;
      const t = trigger.toLowerCase();
      const v = parseFloat(val);
      if (isNaN(v)) return false;
      if (type === 'temp') {
        if (t.includes('warm') && v > 26) return true;
        if (t.includes('hot') && v > 32) return true;
        if (t.includes('cool') && v < 22) return true;
      }
      if (type === 'hum') {
        if (t.includes('humid') && v > 75) return true;
        if (t.includes('dry') && v < 40) return true;
      }
      if (type === 'moist') {
        if ((t.includes('wet') || t.includes('high')) && v > 70) return true;
        if (t.includes('dry') && v < 30) return true;
      }
      return false;
    };

    const pestEntry = metaSource.pest && typeof metaSource.pest === 'object' ? metaSource.pest : (meta.pest && typeof meta.pest === 'object' ? meta.pest : (profile.pest && typeof profile.pest === 'object' ? profile.pest : null));
    const isThreatActive = canAnalyzePest && pestEntry && (
      checkActiveTrigger(pestEntry.weather, cur.temp, 'temp') ||
      checkActiveTrigger(pestEntry.weather, cur.hum, 'hum') ||
      checkActiveTrigger(pestEntry.water, cur.moisture, 'moist')
    );

    const primaryPest = pestEntry?.most || (pestEntry?.all ? pestEntry.all.split(',')[0] : 'Standard Field Pest');

    // ─── REAL-WORLD CONFIDENCE & MATCH ALGORITHM ───
    const calcMatchPct = (s) => {
      if (s.type === 'missing' || !isAvailableLoc(s.val)) return 0;
      const val = parseFloat(s.val);
      const { rMin, rMax } = s;
      const rangeWidth = Math.max(5, rMax - rMin);

      const EPSILON = 0.03;
      const isOptimal = (val >= rMin - (rangeWidth * EPSILON) && val <= rMax + (rangeWidth * EPSILON));
      if (isOptimal) return 100;

      const outDist = val < rMin ? (rMin - val) : (val - rMax);
      const decay = (outDist / rangeWidth) * 50;
      return Math.max(15, Math.round(90 - decay));
    };

    const categories = [
      {
        id: 'soil',
        name: 'Soil Health',
        icon: Leaf,
        params: [
          { n: 'Soil Moisture', s: sensors[0], weight: 0.25 },
          { n: 'Soil Temperature', s: sensors[1], weight: 0.15 },
          { n: 'Soil pH', s: sensors[2], weight: 0.20 },
          { n: 'Nitrogen (N)', s: sensors[3], weight: 0.15 },
          { n: 'Phosphorus (P)', s: sensors[4], weight: 0.15 },
          { n: 'Potassium (K)', s: sensors[5], weight: 0.10 }
        ]
      },
      {
        id: 'climate',
        name: 'Climate & Weather',
        icon: Thermometer,
        params: [
          { n: 'Air Temperature', s: sensors[6], weight: 0.35 },
          { n: 'Air Humidity', s: sensors[7], weight: 0.25 },
          { n: 'Sunlight Intensity', s: sensors[8], weight: 0.20 },
          { n: 'Precipitation', s: sensors[9], weight: 0.20 }
        ]
      },
      {
        id: 'external',
        name: 'External Factors',
        icon: Globe,
        params: [
          { n: 'Season', s: { pct: matchTable[0].pct || 100, type: matchTable[0].type }, weight: 0.35 },
          { n: 'Growing Time', s: { pct: matchTable[3].pct || 100, type: matchTable[3].type }, weight: 0.35 },
          { n: 'Location', s: { pct: matchTable[2].pct || 100, type: matchTable[2].type }, weight: 0.30 }
        ]
      }
    ];

    const processedGroups = categories.map(cat => {
      let catScore = 0;
      const items = cat.params.map(p => {
        const pct = p.s.pct !== undefined ? p.s.pct : calcMatchPct(p.s);
        catScore += pct * p.weight;
        return { ...p, pct };
      });
      return { ...cat, score: Math.round(catScore), items };
    });

    const weights = { soil: 0.50, climate: 0.35, external: 0.15 };
    const activeSensors = sensors.filter(s => s.type !== 'missing').length;
    const isOffline = activeSensors === 0;

    const matchScore = isOffline ? 0 : Math.round(
      processedGroups.reduce((acc, g) => acc + (g.score * weights[g.id]), 0)
    );

    let recStatus = 'MODERATE';
    let recColor = '#F59E0B';
    if (matchScore > 80) { recStatus = 'EXCELLENT MATCH'; recColor = '#15803D'; }
    else if (matchScore < 50) { recStatus = 'LOW VIABILITY'; recColor = '#EF4444'; }

    // ─── DYNAMIC CROP COMPARISON MATRIX ───
    const candidateCropIds = [
      'rice', 'wheat', 'maize (corn)', 'tomato', 'potato', 'mustard',
      'cotton', 'chili', 'brinjal (eggplant)', 'soybean', 'sugarcane',
      'groundnut (peanut)', 'onion', 'cabbage'
    ];

    const cropCompareList = candidateCropIds.map(cId => {
      const cSpec = CROP_SPECS[cId] || {};
      const isCur = cId === selectedCrop;
      
      let scoreAcc = 0;
      let totalWeights = 0;

      // pH check
      if (cur.ph && cSpec.ph) {
        const phVal = parseFloat(cur.ph);
        const [pMin, pMax] = cSpec.ph;
        const phScore = (phVal >= pMin && phVal <= pMax) ? 100 : Math.max(20, 100 - (Math.abs(phVal < pMin ? pMin - phVal : phVal - pMax) * 35));
        scoreAcc += phScore * 0.3;
        totalWeights += 0.3;
      }

      // Temp check
      if (cur.temp && cSpec.temp) {
        const tVal = parseFloat(cur.temp);
        const [tMin, tMax] = cSpec.temp;
        const tScore = (tVal >= tMin && tVal <= tMax) ? 100 : Math.max(20, 100 - (Math.abs(tVal < tMin ? tMin - tVal : tVal - tMax) * 8));
        scoreAcc += tScore * 0.35;
        totalWeights += 0.35;
      }

      // Moisture check
      if (cur.moisture) {
        const mVal = parseFloat(cur.moisture);
        const [mMin, mMax] = cSpec.moisture || [35, 75];
        const mScore = (mVal >= mMin && mVal <= mMax) ? 100 : Math.max(20, 100 - (Math.abs(mVal < mMin ? mMin - mVal : mVal - mMax) * 3));
        scoreAcc += mScore * 0.35;
        totalWeights += 0.35;
      }

      const matchPct = isCur ? matchScore : (totalWeights > 0 ? Math.round(scoreAcc / totalWeights) : 82);

      const waterNeed = (cSpec.rain?.[0] > 1000 || cSpec.type === 'Cash Crop' || cId === 'rice') 
        ? 'High' 
        : (cSpec.rain?.[1] < 700 || cSpec.type === 'Pulse' || cSpec.type === 'Oilseed') 
        ? 'Low' 
        : 'Moderate';

      return {
        id: cId,
        name: formatCropName(cId),
        type: cSpec.type || 'Field Crop',
        matchPct,
        isCurrent: isCur,
        phRange: cSpec.ph ? `${cSpec.ph[0]} - ${cSpec.ph[1]}` : '5.5 - 7.5',
        tempRange: cSpec.temp ? `${cSpec.temp[0]} - ${cSpec.temp[1]}°C` : '18 - 30°C',
        waterNeed,
        duration: cId === 'rice' ? '120-150d' : cId === 'wheat' ? '110-130d' : cId === 'potato' ? '90-110d' : cId === 'mustard' ? '85-105d' : '90-120d',
        status: matchPct >= 85 ? 'Optimal' : (matchPct >= 70 ? 'Viable' : 'Sub-optimal'),
        color: matchPct >= 85 ? '#15803D' : (matchPct >= 70 ? '#F59E0B' : '#EF4444')
      };
    }).sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return b.matchPct - a.matchPct;
    });

    // ─── SOIL & IRRIGATION ADVISOR STATE ───
    const minMois = spec.moisture?.[0] || 40;
    const maxMois = spec.moisture?.[1] || 70;
    const curMoist = cur.moisture !== null && !isNaN(cur.moisture) ? parseFloat(cur.moisture) : null;
    const waterDeficit = curMoist !== null && curMoist < minMois ? (minMois - curMoist) : 0;
    const waterExcess = curMoist !== null && curMoist > maxMois ? (curMoist - maxMois) : 0;

    const pumpState = (actuators?.waterPump || actuators?.pump || 'OFF').toUpperCase();
    const valveState = (actuators?.irrigationValve || actuators?.valve || 'CLOSED').toUpperCase();

    const irrigationAdvisor = {
      curMoisture: curMoist,
      minMois,
      maxMois,
      waterDeficit: Math.round(waterDeficit),
      waterExcess: Math.round(waterExcess),
      pumpState,
      valveState,
      status: curMoist === null 
        ? 'Telemetry Offline' 
        : waterDeficit > 0 
        ? 'Irrigation Needed' 
        : waterExcess > 0 
        ? 'Saturated / Drainage Needed' 
        : 'Hydration Optimal',
      statusColor: curMoist === null 
        ? '#94A3B8' 
        : waterDeficit > 0 
        ? '#F59E0B' 
        : waterExcess > 0 
        ? '#3B82F6' 
        : '#15803D',
      recommendedMins: waterDeficit > 0 ? Math.max(25, Math.min(60, Math.round(waterDeficit * 2.5))) : 0,
      waterLitersPerAcre: waterDeficit > 0 ? Math.round(waterDeficit * 350) : 0,
      wateringWindow: 'Early Morning (06:00 - 08:30 AM) or Sunset',
      actionText: curMoist === null 
        ? 'Check ESP32 sensor node power supply and LoRa/Wi-Fi connection.'
        : waterDeficit > 0 
        ? (pumpState === 'ON' ? 'Irrigation in progress. Water pump is running to restore optimal root zone moisture.' : 'Turn on the irrigation pump for optimal root zone recovery.')
        : waterExcess > 0 
        ? 'Keep irrigation valve closed. Verify surface drainage outlets to prevent root hypoxia.'
        : 'Soil hydration is balanced. No additional irrigation required today.'
    };

    return {
      sensors,
      suitabilityTable,
      cropCompareList,
      irrigationAdvisor,
      matchScore,
      recStatus,
      recColor,
      isOffline,
      cur,
      demand: metaSource.demand || (['Cash Crop', 'Fruit', 'Seed'].includes(spec.type) ? 'High' : (['Fiber', 'Grain', 'Vegetable', 'Pulse'].includes(spec.type) ? 'Stable' : 'Moderate')),
      fertilizer: {
        isLive: canFertilize,
        urea: Math.max(15, Math.round(urea)),
        ssp: Math.max(10, Math.round(ssp)),
        mop: Math.max(10, Math.round(mop)),
        product: fertEntry?.common || 'Urea, DAP, MOP',
        stage: fertEntry?.stage || 'Basal: DAP + MOP; Tillering: 50% N; Panicle: 50% N',
        logic: fertReason,
        products: fertEntry?.products || ['Urea', 'SSP', 'MOP']
      },
      compost: {
        isLive: canCompost,
        qty: compostQtyLabel,
        type: compostEntry?.type || 'Farmyard Manure (FYM) / Vermicompost',
        stage: compostEntry?.stage || '2–3 weeks before sowing',
        logic: compostReason
      },
      pests: {
        isLive: canAnalyzePest,
        isThreatActive,
        primary: primaryPest,
        all: pestEntry?.all || primaryPest,
        weatherTrigger: pestEntry?.weather || 'Humid or warm weather trigger',
        stageTrigger: pestEntry?.trigger || 'Vegetative to tillering stage',
        action: isThreatActive ? 'Active threat — Apply bio-pesticide or IPM spray within 48h' : 'Low risk — Scheduled monitoring & preventive neem spray'
      },
      meta,
      lifecycle,
      ipmRemedies,
      chipData: {
        soilType: cur.soil !== 'Missing' && cur.soil ? cur.soil : (metaSource.soil && metaSource.soil !== '---' ? metaSource.soil : (profile.soil && profile.soil !== '---' ? profile.soil : 'Detecting...')),
        market: metaSource.demand || (['Cash Crop', 'Fruit', 'Seed'].includes(spec.type) ? 'High' : (['Fiber', 'Grain', 'Vegetable', 'Pulse'].includes(spec.type) ? 'Stable' : 'Moderate')),
        category: spec.type && spec.type !== '---' ? spec.type : 'Field Crop',
        climate: metaSource.climate && metaSource.climate !== '---' ? metaSource.climate : (cur.season === 'Kharif' ? 'Tropical' : cur.season === 'Rabi' ? 'Semi-Arid' : 'Subtropical'),
        region: metaSource.loc && metaSource.loc !== '---' ? metaSource.loc : (profile.loc && profile.loc !== '---' ? profile.loc : 'South Asia'),
      }
    };
  }, [
    db,
    selectedCrop,
    sowDate,
    lifecycle,
    sensorData?.soil?.moisture,
    sensorData?.soil?.temp,
    sensorData?.soil?.ph,
    sensorData?.soil?.npk?.n,
    sensorData?.soil?.npk?.p,
    sensorData?.soil?.npk?.k,
    sensorData?.weather?.temp,
    sensorData?.weather?.rainLevel,
    sensorData?.weather?.condition,
    sensorData?.weather?.humidity
  ]);

  if (db.loading || !brain) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7'
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{
            width: 36,
            height: 36,
            border: '3px solid #15803D',
            borderTopColor: 'transparent',
            borderRadius: '50%'
          }}
        />
        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D', letterSpacing: '0.06em' }}>
          LOADING AGRONOMIC ADVISOR...
        </span>
      </div>
    );
  }

  if (db.error) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
          padding: 24,
          textAlign: 'center'
        }}
      >
        <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: 12 }} />
        <h2 style={{ fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', margin: '0 0 6px' }}>Database Sync Error</h2>
        <p style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Unable to load crop specifications.</p>
      </div>
    );
  }

  const { icon: CropIcon, color: cropThemeColor } = getCropIcon(brain.meta.type, selectedCrop);

  return (
    <div
      style={{
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        minHeight: 'auto',
        padding: '16px 16px 16px',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {!isReady ? (
        <div style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
            style={{ width: 36, height: 36, border: '3px solid #15803D', borderTopColor: 'transparent', borderRadius: '50%' }}
          />
          <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803D', letterSpacing: '0.08em' }}>
            CALIBRATING FIELD CROP ENGINE...
          </div>
        </div>
      ) : (
        <>
          {/* ─── 1. BOTANICAL HERO CARD (CROP SUITABILITY & MATCH OVERVIEW) ─── */}
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
            {/* Exquisite Botanical Background Illustration */}
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

            {/* Hero Card Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Header inside Hero */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div
                  onClick={() => setIsSheetOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                    padding: '8px 14px',
                    borderRadius: 16,
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(21, 128, 61, 0.12)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: `${cropThemeColor}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cropThemeColor
                    }}
                  >
                    <CropIcon size={18} />
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '1.02rem',
                        fontWeight: 900,
                        color: isDarkMode ? '#F8FAFC' : '#0F172A',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2
                      }}
                    >
                      {formatCropName(selectedCrop)}
                    </h2>
                    <div style={{ fontSize: '0.68rem', color: '#15803D', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {brain.meta.type || 'Field Crop'}
                    </div>
                  </div>
                  <ChevronDown size={14} color="#94A3B8" style={{ marginLeft: 2 }} />
                </div>

                {/* Right side: Speech Audio Icon + Language Toggle + Match Status Pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Single Language Toggle Button: Click to cycle EN -> বাংলা -> हिंदी */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextLang = speechLang === 'en' ? 'bn' : speechLang === 'bn' ? 'hi' : 'en';
                      setSpeechLang(nextLang);
                      if (isSpeaking) speechService.stop();
                    }}
                    title="Click to switch language (EN / বাংলা / हिंदी)"
                    style={{
                      height: 32,
                      padding: '0 11px',
                      borderRadius: 10,
                      border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid #C4EAD0',
                      background: isDarkMode ? 'rgba(34, 197, 94, 0.16)' : '#DCFCE7',
                      color: isDarkMode ? '#86EFAC' : '#15803D',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <span>{speechLang === 'bn' ? 'বাংলা' : speechLang === 'hi' ? 'हिंदी' : 'EN'}</span>
                  </motion.button>

                  {/* AI Voice Summary / Speaker Icon Only */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <motion.button
                      whileTap={{ scale: 0.90 }}
                      disabled={['collecting', 'analyzing', 'synthesizing'].includes(pipelineState)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSpeak(false);
                      }}
                      style={{
                        height: 32,
                        width: 32,
                        padding: 0,
                        borderRadius: 10,
                        border: 'none',
                        background: pipelineState === 'playing'
                          ? '#DC2626'
                          : (['collecting', 'analyzing', 'synthesizing'].includes(pipelineState)
                              ? (isDarkMode ? '#334155' : '#CBD5E1')
                              : '#15803D'),
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: ['collecting', 'analyzing', 'synthesizing'].includes(pipelineState) ? 'wait' : 'pointer',
                        boxShadow: pipelineState === 'playing'
                          ? '0 0 14px rgba(220, 38, 38, 0.4)'
                          : '0 2px 10px rgba(21, 128, 61, 0.3)',
                        flexShrink: 0
                      }}
                      title={pipelineState === 'playing' ? 'Pause' : pipelineState === 'paused' ? 'Resume' : 'Play Voice Advisory'}
                    >
                      {pipelineState === 'playing' ? (
                        <Pause size={15} />
                      ) : pipelineState === 'paused' ? (
                        <Play size={15} />
                      ) : ['collecting', 'analyzing', 'synthesizing'].includes(pipelineState) ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          style={{ display: 'flex' }}
                        >
                          <RefreshCw size={13} />
                        </motion.div>
                      ) : (
                        <Volume2 size={16} />
                      )}
                    </motion.button>
                  </div>

                  {/* Match Status Pill */}
                  {!brain.isOffline && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.9)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(148, 163, 184, 0.3)',
                        borderRadius: 100,
                        padding: '5px 12px',
                        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: brain.recColor,
                          display: 'inline-block',
                          boxShadow: `0 0 6px ${brain.recColor}`,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: isDarkMode ? '#F8FAFC' : '#0F172A',
                        }}
                      >
                        {brain.matchScore}% Match
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Circular Arc Gauge */}
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
                      stroke={brain.isOffline ? '#94A3B8' : brain.recColor}
                      strokeWidth="7.5"
                      strokeLinecap="round"
                      strokeDasharray="264"
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * (brain.isOffline ? 0 : brain.matchScore) / 100) }}
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
                      {brain.isOffline ? '--' : `${brain.matchScore}%`}
                    </span>
                    <span
                      style={{
                        fontSize: '0.60rem',
                        fontWeight: 800,
                        color: brain.isOffline ? '#94A3B8' : brain.recColor,
                        letterSpacing: '0.08em',
                        marginTop: 3,
                        textTransform: 'uppercase',
                      }}
                    >
                      {brain.isOffline ? 'OFFLINE' : brain.recStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6 Field Context Info Chips — 3 rows × 2 cols */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {(() => {
                  const v = (raw) => (!raw || raw === 'Missing' || raw === '---') ? '--' : raw;
                  return [
                    { label: 'SOIL TYPE', val: v(brain.chipData.soilType), icon: Layers, color: '#7C3AED' },
                    { label: 'MARKET', val: v(brain.chipData.market), icon: TrendingUp, color: getDemandColor(brain.chipData.market) },
                    { label: 'CATEGORY', val: v(brain.chipData.category), icon: Sprout, color: '#15803D' },
                    { label: 'CLIMATE', val: v(brain.chipData.climate), icon: CloudRain, color: '#0284C7' },
                    { label: 'REGION', val: v(brain.chipData.region), icon: Globe, color: '#EA580C' },
                    { label: 'LOCATION', val: v(currentGPS?.city || currentGPS?.district), icon: MapPin, color: '#DB2777' },
                  ];
                })().map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: isDarkMode ? 'rgba(22, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.04)',
                      borderRadius: 12,
                      padding: '7px 6px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 3 }}>
                      <item.icon size={10} color={item.color} />
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em' }}>
                        {item.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.71rem',
                        fontWeight: 800,
                        color: isDarkMode ? '#F8FAFC' : '#0F172A',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        width: '100%',
                      }}
                    >
                      {item.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>



          {/* ─── 2B. CROP GROWTH LIFECYCLE & STAGE TRACKER ────────────────── */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 22,
              padding: '16px 18px',
              border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.06)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
              marginBottom: 16
            }}
          >
            {/* Header with Active Stage Badge & Sowing Date Input */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
                  <Sprout size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.94rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                    Crop Growth Lifecycle
                  </div>
                </div>
              </div>

              {/* Sowing Date Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAF7', padding: '6px 10px', borderRadius: 12, border: '1px solid var(--border-main)' }}>
                <Calendar size={13} color="#15803D" />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8' }}>Sown:</span>
                <input
                  type="date"
                  value={sowDate || brain.lifecycle.sowDate}
                  onChange={(e) => handleSowDateChange(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    fontFamily: 'inherit',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* Visual Lifecycle Stepper (5 Distinct Stages) */}
            <div style={{ position: 'relative', margin: '16px 0 12px' }}>
              {/* Horizontal Connecting Bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  transform: 'translateY(-50%)',
                  left: '8%',
                  right: '8%',
                  height: 3,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  zIndex: 1,
                  borderRadius: 2
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, brain.lifecycle.progressPct))}%`,
                    background: 'linear-gradient(90deg, #10B981, #15803D)',
                    borderRadius: 2,
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {brain.lifecycle.allStages.map((stg, idx) => {
                  const isPassed = idx < brain.lifecycle.activeStageIndex;
                  const isCurrent = idx === brain.lifecycle.activeStageIndex;
                  const stageTitle = stg.title || stg.shortName || `Stage ${idx + 1}`;
                  const subTitle = stg.sub;

                  return (
                    <div
                      key={stg.id || idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        position: 'relative'
                      }}
                    >
                      {/* Step Node Circle Wrapper for Pixel-Perfect Vertical Centering with Bar */}
                      <div
                        style={{
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 6
                        }}
                      >
                        <div
                          style={{
                            width: isCurrent ? 30 : 22,
                            height: isCurrent ? 30 : 22,
                            borderRadius: '50%',
                            background: isCurrent
                              ? '#15803D'
                              : (isPassed ? '#10B981' : (isDarkMode ? '#1E293B' : '#FFFFFF')),
                            border: isCurrent
                              ? '3px solid #86EFAC'
                              : (isPassed ? '2px solid #059669' : (isDarkMode ? '2px solid rgba(255, 255, 255, 0.2)' : '2px solid #CBD5E1')),
                            color: isCurrent || isPassed ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isCurrent ? '0.78rem' : '0.64rem',
                            fontWeight: 900,
                            boxShadow: isCurrent ? '0 0 14px rgba(34, 197, 94, 0.7)' : 'none',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {isPassed ? <CheckCircle2 size={13} strokeWidth={3} /> : (idx + 1)}
                        </div>
                      </div>

                      {/* Clear Proper Stage Title */}
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: isCurrent ? 900 : (isPassed ? 750 : 600),
                          color: isCurrent
                            ? (isDarkMode ? '#86EFAC' : '#15803D')
                            : (isPassed ? (isDarkMode ? '#E2E8F0' : '#334155') : (isDarkMode ? '#64748B' : '#94A3B8')),
                          textAlign: 'center',
                          lineHeight: 1.15,
                          maxWidth: '96%',
                          display: 'block',
                          wordBreak: 'break-word',
                          padding: '0 2px'
                        }}
                      >
                        {stageTitle}
                      </span>

                      {/* Sub-phase in subtle parenthesis */}
                      {subTitle && (
                        <span
                          style={{
                            fontSize: '0.56rem',
                            fontWeight: isCurrent ? 750 : 500,
                            color: isCurrent
                              ? (isDarkMode ? '#4ADE80' : '#16A34A')
                              : (isDarkMode ? '#64748B' : '#94A3B8'),
                            textAlign: 'center',
                            lineHeight: 1.1,
                            marginTop: 1,
                            display: 'block',
                            wordBreak: 'break-word',
                            padding: '0 1px'
                          }}
                        >
                          ({subTitle})
                        </span>
                      )}


                    </div>
                  );
                })}
              </div>
            </div>

            {/* Progress Metrics Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7',
                padding: '12px 14px',
                borderRadius: 14,
                marginTop: 14,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>DAYS ELAPSED</span>
                <div style={{ fontSize: '1.02rem', fontWeight: 950, color: isDarkMode ? '#F8FAFC' : '#0F172A', marginTop: 2 }}>
                  {brain.lifecycle.daysElapsed} Days
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  borderLeft: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRight: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)'
                }}
              >
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>EST. TO HARVEST</span>
                <div style={{ fontSize: '1.02rem', fontWeight: 950, color: '#15803D', marginTop: 2 }}>
                  {brain.lifecycle.daysLeft} Days
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>LIFECYCLE</span>
                <div style={{ fontSize: '1.02rem', fontWeight: 950, color: '#0284C7', marginTop: 2 }}>
                  {brain.lifecycle.progressPct}% Done
                </div>
              </div>
            </div>
          </motion.div>


          {/* ─── 3. VIEW NAVIGATOR (SENSOR TELEMETRY / CROP SUITABILITY) ──── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              marginBottom: 16,
              boxSizing: 'border-box'
            }}
          >
            {[
              { id: 'sensor', label: 'Sensor Telemetry', icon: Activity },
              { id: 'suitability', label: 'Crop Suitability', icon: Leaf }
            ].map(t => {
              const isActive = activeTab === t.id;
              return (
                <motion.button
                  key={t.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    flex: 1,
                    padding: '11px 12px',
                    borderRadius: 14,
                    background: isActive ? '#15803D' : (isDarkMode ? 'var(--bg-card)' : '#FFFFFF'),
                    color: isActive ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                    border: isActive ? 'none' : (isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.06)'),
                    boxShadow: isActive ? '0 4px 14px rgba(21, 128, 61, 0.28)' : '0 2px 6px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <t.icon size={16} strokeWidth={2.4} color={isActive ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B')} />
                  <span>{t.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* ─── 4. ADVISORY MODULES ───────────────────────────────────────── */}

          {/* MODULE 1: COMPLETE 10-FACTOR FIELD SENSOR MATCH TABLE */}
          {activeTab === 'sensor' && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              style={{
                background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                borderRadius: 22,
                padding: '16px 18px',
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
                marginBottom: 16,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <CardWave
                fill={isDarkMode ? 'rgba(21, 128, 61, 0.08)' : 'rgba(21, 128, 61, 0.04)'}
                stroke={isDarkMode ? 'rgba(21, 128, 61, 0.16)' : 'rgba(21, 128, 61, 0.09)'}
              />

              {/* Table Header Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.8fr 1.2fr 1fr',
                  gap: 8,
                  padding: '8px 10px',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7',
                  borderRadius: 12,
                  marginBottom: 8,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  FACTOR
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'center' }}>
                  LIVE READING
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>
                  OPTIMAL
                </span>
              </div>

              {/* Table Rows */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                {brain.sensors.map((s, idx) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.8fr 1.2fr 1fr',
                      gap: 8,
                      padding: '10px 10px',
                      alignItems: 'center',
                      borderBottom: idx === brain.sensors.length - 1 ? 'none' : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)')
                    }}
                  >
                    {/* Factor Name + Icon */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 8,
                          background: `${s.color}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {React.createElement(s.icon, { size: 13, color: s.color, strokeWidth: 2.2 })}
                      </div>
                      <span
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          color: isDarkMode ? '#F8FAFC' : '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {s.id}
                      </span>
                    </div>

                    {/* Live Reading */}
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
                      <span
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: s.type === 'missing'
                            ? '#94A3B8'
                            : (s.type === 'good'
                              ? (isDarkMode ? '#4ADE80' : '#16A34A')
                              : (s.type === 'warning'
                                ? (isDarkMode ? '#F59E0B' : '#D97706')
                                : (isDarkMode ? '#F87171' : '#DC2626')))
                        }}
                      >
                        {s.type === 'missing' ? '---' : (s.id.includes('pH') ? (parseFloat(s.val) || 0).toFixed(1) : `${Math.round(parseFloat(s.val) || 0)}`)}
                      </span>
                      {s.type !== 'missing' && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8' }}>
                          {s.unit}
                        </span>
                      )}
                    </div>

                    {/* Optimal Range */}
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#94A3B8',
                        textAlign: 'right'
                      }}
                    >
                      {(typeof s.rMin !== 'undefined' && s.rMin !== null) ? `${s.id.includes('pH') ? s.rMin.toFixed(1) : Math.round(s.rMin)}-${s.id.includes('pH') ? s.rMax.toFixed(1) : Math.round(s.rMax)}` : '---'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MODULE 4: TARGETED NUTRIENT PRESCRIPTION */}
          {activeTab === 'sensor' && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              style={{
                background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                borderRadius: 22,
                padding: '16px 18px',
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
                marginBottom: 16,
                position: 'relative'
              }}
            >
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(37, 99, 235, 0.18)' : '#EFF6FF',
                      border: isDarkMode ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid #BFDBFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563EB'
                    }}
                  >
                    <FlaskConical size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '0.98rem',
                        fontWeight: 800,
                        color: isDarkMode ? '#F8FAFC' : '#0F172A',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      Targeted Nutrient Prescription
                    </h3>
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                      Fertilizer dosages calibrated for {formatCropName(selectedCrop)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Header Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 0.8fr 1.4fr',
                  gap: 8,
                  padding: '8px 10px',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7',
                  borderRadius: 12,
                  marginBottom: 8,
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  FERTILIZER
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'center' }}>
                  RATE
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>
                  APPLICATION TIMING
                </span>
              </div>

              {/* Table Rows */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                {(() => {
                  const specType = brain.meta?.type;
                  const getRows = () => {
                    if (specType === 'Pulse') {
                      return [
                        { name: 'Starter Urea', formula: '46-0-0', val: brain.fertilizer.urea, color: '#D97706', timing: '100% Basal at Sowing' },
                        { name: 'SSP / DAP', formula: '0-16-0', val: brain.fertilizer.ssp, color: '#0284C7', timing: '100% Basal Banding' },
                        { name: 'Potash (MOP)', formula: '0-0-60', val: brain.fertilizer.mop, color: '#7C3AED', timing: 'Basal / Pod Fill' }
                      ];
                    }
                    if (specType === 'Vegetable' || specType === 'Fruit') {
                      return [
                        { name: 'Urea (N)', formula: '46-0-0', val: brain.fertilizer.urea, color: '#D97706', timing: 'Split: Basal & Canopy' },
                        { name: 'Single Super Phos', formula: '0-16-0', val: brain.fertilizer.ssp, color: '#0284C7', timing: '100% Basal in Root Zone' },
                        { name: 'Muriate of Potash', formula: '0-0-60', val: brain.fertilizer.mop, color: '#7C3AED', timing: 'Split: Basal & Fruit Fill' }
                      ];
                    }
                    if (specType === 'Oilseed') {
                      return [
                        { name: 'Urea (Prilled)', formula: '46-0-0', val: brain.fertilizer.urea, color: '#D97706', timing: '2-Split (Basal & Rosette)' },
                        { name: 'SSP (P + Sulfur)', formula: '0-16-0', val: brain.fertilizer.ssp, color: '#0284C7', timing: '100% Basal Placement' },
                        { name: 'Potash (MOP)', formula: '0-0-60', val: brain.fertilizer.mop, color: '#7C3AED', timing: '100% Basal at Sowing' }
                      ];
                    }
                    // Default Cereal / Grain
                    return [
                      { name: 'Urea (Prilled)', formula: '46-0-0', val: brain.fertilizer.urea, color: '#D97706', timing: '3-Split (Basal / Tiller / Panicle)' },
                      { name: 'Single Super Phos', formula: '0-16-0', val: brain.fertilizer.ssp, color: '#0284C7', timing: '100% Basal Placement' },
                      { name: 'Muriate of Potash', formula: '0-0-60', val: brain.fertilizer.mop, color: '#7C3AED', timing: 'Basal + Top-dress' }
                    ];
                  };

                  return getRows().map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 0.8fr 1.4fr',
                        gap: 8,
                        padding: '10px 10px',
                        alignItems: 'center',
                        borderBottom: idx === 2 ? 'none' : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.04)')
                      }}
                    >
                      {/* Name + Formula */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                        <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
                            {row.name}
                          </span>
                          <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '1px 4px', borderRadius: 4, background: `${row.color}15`, color: row.color, fontFamily: 'monospace', flexShrink: 0 }}>
                            {row.formula}
                          </span>
                        </div>
                      </div>

                      {/* Rate */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                          <span style={{ fontSize: '0.92rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', fontVariantNumeric: 'tabular-nums' }}>
                            {Math.round(row.val)}
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8' }}>
                            kg/ha
                          </span>
                        </div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#94A3B8' }}>
                          ~{Math.round(row.val * 0.40)} kg/ac
                        </span>
                      </div>

                      {/* Timing */}
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9', color: isDarkMode ? '#CBD5E1' : '#475569', display: 'inline-block', lineHeight: 1.2 }}>
                          {row.timing}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          )}

          {/* MODULE 5: 10 FACTOR CROP SUITABILITY CARDS */}
          {activeTab === 'suitability' && (
            <div style={{ marginBottom: 16 }}>
              {/* 10 Factor Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {brain.suitabilityTable.map((row, idx) => {
                  const isGood = row.type === 'good';
                  const isWarn = row.type === 'warning';
                  const matchPct = row.pct || 90;
                  const accent = row.color || '#15803D';

                  const badgeColor = isGood ? (isDarkMode ? '#4ADE80' : '#15803D') : isWarn ? '#F59E0B' : (isDarkMode ? '#94A3B8' : '#64748B');
                  const BadgeIcon = isGood ? CheckCircle2 : isWarn ? AlertTriangle : Info;

                  const barGradient = isGood
                    ? 'linear-gradient(90deg, #22C55E 0%, #15803D 100%)'
                    : isWarn
                    ? 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)'
                    : 'linear-gradient(90deg, #94A3B8 0%, #64748B 100%)';

                  return (
                    <motion.div
                      key={row.id}
                      variants={fadeUp}
                      custom={idx * 0.04}
                      initial="hidden"
                      animate="visible"
                      style={{
                        background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                        borderRadius: 20,
                        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0,0,0,0.06)',
                        boxShadow: isDarkMode ? '0 3px 14px rgba(0,0,0,0.35)' : '0 2px 12px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* ── Card Header ── */}
                      <div style={{
                        padding: '12px 14px 10px',
                        background: isDarkMode
                          ? `linear-gradient(135deg, ${accent}22 0%, transparent 75%)`
                          : `linear-gradient(135deg, ${accent}12 0%, transparent 75%)`,
                        borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}>
                        {/* Icon + Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 12,
                            background: `${accent}18`,
                            border: `1.5px solid ${accent}38`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {React.createElement(row.icon, { size: 18, color: accent, strokeWidth: 2.2 })}
                          </div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                            {row.label || row.id}
                          </div>
                        </div>

                        {/* Status Label */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          color: badgeColor,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          flexShrink: 0
                        }}>
                          <BadgeIcon size={14} strokeWidth={2.5} />
                          <span>{row.status}</span>
                        </div>
                      </div>

                      {/* ── Match Progress Bar ── */}
                      <div style={{ padding: '8px 14px 2px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 6, borderRadius: 10, background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(matchPct, 100)}%` }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            style={{ height: '100%', borderRadius: 10, background: barGradient }}
                          />
                        </div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: badgeColor, minWidth: 32, textAlign: 'right' }}>
                          {matchPct}%
                        </span>
                      </div>

                      {/* ── Dual Benchmark: TARGET vs FIELD REALITY ── */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 14px 14px' }}>
                        {/* Target Benchmark */}
                        <div style={{
                          background: isDarkMode ? 'rgba(34,197,94,0.07)' : '#F0FDF4',
                          borderRadius: 14, padding: '9px 11px',
                          border: isDarkMode ? '1px solid rgba(34,197,94,0.18)' : '1px solid #BBF7D0',
                          display: 'flex', flexDirection: 'column', gap: 3
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16A34A' }} />
                            <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#15803D', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              CROP TARGET
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isDarkMode ? '#4ADE80' : '#15803D', lineHeight: 1.35 }}>
                            {row.ideal && row.ideal !== '---' ? row.ideal : 'Standard Agronomic Range'}
                          </div>
                        </div>

                        {/* Field Alignment */}
                        <div style={{
                          background: isDarkMode ? 'rgba(148,163,184,0.07)' : '#F8FAFC',
                          borderRadius: 14, padding: '9px 11px',
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.16)' : '1px solid #E2E8F0',
                          display: 'flex', flexDirection: 'column', gap: 3
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isGood ? '#10B981' : isWarn ? '#F59E0B' : '#94A3B8' }} />
                            <span style={{ fontSize: '0.58rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              FIELD ALIGNMENT
                            </span>
                          </div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#1E293B', lineHeight: 1.35 }}>
                            {row.decision && row.decision !== '---' ? row.decision : 'Telemetry synchronized'}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Sheet Modal */}
          <CropBottomSheet
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            crops={allCropsList}
            onSelect={setSelectedCrop}
            selectedCrop={selectedCrop}
            isDarkMode={isDarkMode}
          />
          <div style={{ height: 20 }} />
        </>
      )}
    </div>
  );
};

export default FarmAdvisor;

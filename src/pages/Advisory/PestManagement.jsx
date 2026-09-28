/**
 * Krishi Sethu — Dedicated Integrated Pest Management (IPM) Screen
 * Bio-Protection Protocol, Real-Time Micro-Climate Pest Triggers, 
 * 4-Tier Non-Chemical First Remedies, Vernacular Audio Advisory & Actuator Automation.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, ShieldAlert, ShieldCheck, Bug, AlertTriangle,
  ChevronLeft, ChevronRight, CheckCircle2, Sprout, Droplets,
  Thermometer, Wind, Volume2, VolumeX, Sparkles, Filter,
  Check, RefreshCw, Zap, FlaskConical, MapPin, Eye, Radio
} from 'lucide-react';

import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import speechService from '../../api/speechService';
import { getIPMRecommendations } from '../../data/core/AgronomyUtils';

// ─── ANIMATIONS ─────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }
  }),
};

// ─── PEST KNOWLEDGE REPOSITORY PER CROP ──────────────────────────────────────
const CROP_PEST_DATA = {
  paddy: {
    name: 'Rice / Paddy',
    allPests: 'Stem Borer, Brown Planthopper, Leaf Folder, Gall Midge, Hispa',
    primary: 'Brown Planthopper 🚨 & Stem Borer',
    weatherTrigger: 'Warm, humid weather (RH > 75%, Temp 26–32°C) accelerates planthopper reproduction.',
    stageTrigger: 'Tillering to Panicle Initiation',
    nonChemicalMethod: 'Install yellow sticky traps (10/ac), alternate wetting & drying (AWD), conserve spider predators.',
    bioSpray: 'Neem Oil (Azadirachtin 1500 ppm @ 4 ml/L) + Beauveria bassiana (2 g/L)',
    etlThreshold: '> 5-10 planthoppers per hill or > 5% dead hearts during vegetative phase.'
  },
  rice: {
    name: 'Rice / Paddy',
    allPests: 'Stem Borer, Brown Planthopper, Leaf Folder, Gall Midge, Hispa',
    primary: 'Brown Planthopper 🚨 & Stem Borer',
    weatherTrigger: 'Warm, humid weather (RH > 75%, Temp 26–32°C) accelerates planthopper reproduction.',
    stageTrigger: 'Tillering to Panicle Initiation',
    nonChemicalMethod: 'Install yellow sticky traps (10/ac), alternate wetting & drying (AWD), conserve spider predators.',
    bioSpray: 'Neem Oil (Azadirachtin 1500 ppm @ 4 ml/L) + Beauveria bassiana (2 g/L)',
    etlThreshold: '> 5-10 planthoppers per hill or > 5% dead hearts during vegetative phase.'
  },
  wheat: {
    name: 'Wheat',
    allPests: 'Aphids, Termites, Armyworm, Brown Mite',
    primary: 'Aphids 🚨 & Termites',
    weatherTrigger: 'Cloudy, cool conditions (18–24°C) with light winds promote rapid aphid colonization.',
    stageTrigger: 'Booting to Grain Filling',
    nonChemicalMethod: 'Conserve Coccinellid ladybird beetles, use yellow sticky traps at canopy level.',
    bioSpray: 'Verticillium lecanii (2 g/L) or 5% Neem Seed Kernel Extract (NSKE)',
    etlThreshold: '> 10 aphids per earhead / tiller across 20 sample plants.'
  },
  maize: {
    name: 'Maize / Corn',
    allPests: 'Fall Armyworm, Stem Borer, Pink Borer, Earworm',
    primary: 'Fall Armyworm (Spodoptera frugiperda) 🚨',
    weatherTrigger: 'Monsoon onset and intermittent rains accelerate nocturnal moth flight and egg-laying.',
    stageTrigger: 'V2 to V6 Whorl Stage',
    nonChemicalMethod: 'Handpick egg masses, apply dry sand/sawdust mixed with lime in whorls, delta pheromone lures (5/ac).',
    bioSpray: 'Metarhizium rileyi or Bacillus thuringiensis (Bt @ 2 g/L) into whorls',
    etlThreshold: '> 10% whorl damage in seedlings or > 20% in mid-whorl stage.'
  },
  potato: {
    name: 'Potato',
    allPests: 'Potato Tuber Moth, Aphids, Cutworm, Whiteflies',
    primary: 'Aphids & Potato Tuber Moth 🚨',
    weatherTrigger: 'Mild winter temperature with moderate moisture allows aphid vectors to spread potato leaf roll virus.',
    stageTrigger: 'Vegetative to Tuber Bulking',
    nonChemicalMethod: 'Proper earthing up to cover exposed tubers, install pheromone traps (4/ac).',
    bioSpray: 'Trichoderma viride soil application + 5% NSKE foliar spray',
    etlThreshold: '> 20 aphids per 100 compound leaves.'
  },
  mustard: {
    name: 'Mustard',
    allPests: 'Mustard Aphid, Sawfly, Painted Bug',
    primary: 'Mustard Aphid (Lipaphis erysimi) 🚨',
    weatherTrigger: 'Overcast skies and high morning humidity in Dec–Jan foster exponential aphid growth.',
    stageTrigger: 'Flowering to Pod Formation',
    nonChemicalMethod: 'Sow early (before Oct 20), install yellow water pan or sticky traps (12/ac).',
    bioSpray: 'Verticillium lecanii (2.5 g/L) or Garlic-chilli extract 2%',
    etlThreshold: '> 20% plants showing aphid colonies on top 10 cm of central shoot.'
  }
};

const PestManagement = () => {
  const navigate = useNavigate();
  const { user, currentGPS, isDarkMode, activePlot, plots, switchPlot, actuators, toggleActuator } = useApp();
  const { sensorData, mqttStatus } = useTelemetry();

  const [selectedCropKey, setSelectedCropKey] = useState(
    (activePlot?.crop || 'paddy').toLowerCase()
  );
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLang, setSpeechLang] = useState('bn');
  const [checkedSteps, setCheckedSteps] = useState({ 1: false, 2: false, 3: false, 4: false });

  // Sync state with activePlot when activePlot changes
  useEffect(() => {
    if (activePlot?.crop) {
      setSelectedCropKey(activePlot.crop.toLowerCase());
    }
  }, [activePlot?.crop]);

  useEffect(() => {
    return speechService.subscribe(setIsSpeaking);
  }, []);

  const currentCropData = useMemo(() => {
    const key = selectedCropKey.toLowerCase();
    return CROP_PEST_DATA[key] || CROP_PEST_DATA.paddy;
  }, [selectedCropKey]);

  // Real-time sensor metrics
  const temp = sensorData?.weather?.temp != null ? Math.round(sensorData.weather.temp) : 28;
  const humidity = sensorData?.weather?.humidity != null ? Math.round(sensorData.weather.humidity) : 76;
  const moisture = sensorData?.soil?.moisture != null ? Math.round(sensorData.soil.moisture) : 62;

  // Real-time micro-climate risk assessment
  const isHighHumidity = humidity >= 70;
  const isWarmTemp = temp >= 24 && temp <= 34;
  const riskAssessmentText = isHighHumidity && isWarmTemp
    ? 'Moderate seasonal risk based on ambient micro-climate telemetry'
    : isHighHumidity
    ? 'Elevated fungal & nymph pressure trigger detected'
    : 'Low ambient threat condition — Maintain preventive monitoring';

  const riskLevel = isHighHumidity && isWarmTemp ? 'Moderate' : isHighHumidity ? 'Elevated' : 'Low';
  const riskColor = riskLevel === 'Elevated' ? '#DC2626' : riskLevel === 'Moderate' ? '#F59E0B' : '#15803D';

  // 4-Tier IPM Remedies
  const ipmRemedies = useMemo(() => {
    const base = getIPMRecommendations(selectedCropKey);
    return {
      ...base,
      riskAssessment: riskAssessmentText
    };
  }, [selectedCropKey, riskAssessmentText]);

  // Voice Readout
  const handleSpeak = () => {
    if (isSpeaking) {
      speechService.stop();
    } else {
      let script = '';
      if (speechLang === 'bn') {
        script = `সমন্বিত বালাই দমন নির্দেশিকা। আপনার ${currentCropData.name} ফসলের জন্য বায়ো-প্রোটেকশন প্রোটোকল: প্রথম ধাপ, নিচের পাতায় ডিম ও ছত্রাকের দাগ পর্যবেক্ষণ করুন। দ্বিতীয় ধাপ, জমিতে প্রতি একরে ৮ থেকে ১২টি হলুদ বা নীল আঠালো ফাঁদ এবং ফেরোমোন ফাঁদ স্থাপন করুন। তৃতীয় ধাপ, ক্ষতিকর রাসায়নিকের বদলে নিম তেল প্রতি লিটার জলে ৪ মিলি হারে প্রয়োগ করুন। চতুর্থ ধাপ, ক্ষতি ১০ শতাংশের বেশি না হলে রাসায়নিক কীটনাশক এড়িয়ে চলুন।`;
      } else if (speechLang === 'hi') {
        script = `एकीकृत कीट प्रबंधन सलाह। आपकी ${currentCropData.name} फसल के लिए पर्यावरण-अनुकूल सुरक्षा: पहला चरण, पत्तियों के निचले हिस्से में कीटों की निगरानी करें। दूसरा चरण, प्रति एकड़ 8 से 12 पीले चिपचिपे ट्रैप और फेरोमोन ट्रैप लगाएं। तीसरा चरण, रासायनिक की जगह नीम का तेल 4 मिलीलीटर प्रति लीटर से छिड़कें। चौथा चरण, रासायनिक कीटनाशक केवल तभी जब नुकसान 10 प्रतिशत से अधिक हो।`;
      } else {
        script = `Integrated Pest Management protocol for ${currentCropData.name}. Step 1: Canopy scouting twice weekly for egg masses. Step 2: Install 8 to 12 yellow sticky traps and pheromone lures per acre. Step 3: Apply botanical Neem Oil at 4 ml per liter as bio-control priority. Step 4: Reserve chemical sprays strictly if Economic Threshold Level exceeds 10 percent damage.`;
      }
      speechService.speak(script, speechLang);
    }
  };

  const toggleStep = (stepNum) => {
    setCheckedSteps(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  const isSprinklerActive = actuators?.pest_sprinkler?.state || false;

  return (
    <div
      style={{
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        minHeight: '100vh',
        padding: '16px 16px 36px',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── TOP APP BAR WITH BACK BUTTON ── */}
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
                AGRONOMY INTELLIGENCE
              </span>
              <span style={{ fontSize: '0.62rem', background: '#DCFCE7', color: '#15803D', fontWeight: 800, padding: '1px 6px', borderRadius: 4 }}>
                IPM ENGINE
              </span>
            </div>
            <h1 style={{
              margin: '2px 0 0',
              fontSize: '1.45rem',
              fontWeight: 900,
              color: isDarkMode ? '#F8FAFC' : '#0F172A',
              letterSpacing: '-0.02em',
              lineHeight: 1.15
            }}>
              Pest Management
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

      {/* ── CROP SELECTOR PILL BANNER ── */}
      <div style={{ position: 'relative', marginBottom: 14, zIndex: 20 }}>
        <div
          onClick={() => setIsCropDropdownOpen(!isCropDropdownOpen)}
          style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 18,
            border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #BBF7D0',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
              <Sprout size={17} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
                CURRENT TARGET CROP
              </div>
              <div style={{ fontSize: '0.90rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                {currentCropData.name} ({activePlot?.name || 'Active Plot'})
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            color={isDarkMode ? '#94A3B8' : '#64748B'}
            style={{ transform: isCropDropdownOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s ease' }}
          />
        </div>

        <AnimatePresence>
          {isCropDropdownOpen && (
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
              {Object.entries(CROP_PEST_DATA).map(([key, data]) => (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedCropKey(key);
                    setIsCropDropdownOpen(false);
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 11,
                    background: selectedCropKey === key ? (isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7') : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                    {data.name}
                  </span>
                  {selectedCropKey === key && <Check size={16} color="#15803D" strokeWidth={2.5} />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── AMBIENT MICRO-CLIMATE TELEMETRY METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {/* Metric 1: Temp */}
        <div style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 16,
          padding: '10px 12px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#F59E0B', fontSize: '0.64rem', fontWeight: 800 }}>
            <Thermometer size={14} />
            <span>TEMP</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', marginTop: 4 }}>
            {temp}°C
          </div>
          <div style={{ fontSize: '0.62rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
            {temp >= 26 ? 'Warm Trigger' : 'Normal'}
          </div>
        </div>

        {/* Metric 2: Humidity */}
        <div style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 16,
          padding: '10px 12px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0284C7', fontSize: '0.64rem', fontWeight: 800 }}>
            <Droplets size={14} />
            <span>HUMIDITY</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', marginTop: 4 }}>
            {humidity}%
          </div>
          <div style={{ fontSize: '0.62rem', color: isHighHumidity ? '#F59E0B' : '#15803D', fontWeight: 700, marginTop: 2 }}>
            {isHighHumidity ? 'High Spore Risk' : 'Optimal'}
          </div>
        </div>

        {/* Metric 3: Pest Threat Level */}
        <div style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 16,
          padding: '10px 12px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: riskColor, fontSize: '0.64rem', fontWeight: 800 }}>
            <ShieldAlert size={14} />
            <span>THREAT</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: riskColor, marginTop: 4 }}>
            {riskLevel}
          </div>
          <div style={{ fontSize: '0.62rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: 2 }}>
            Micro-climate
          </div>
        </div>
      </div>

      {/* ── CROP PEST PROFILE INTELLIGENCE CARD ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 22,
          padding: '16px 18px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(245, 158, 11, 0.25)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bug size={18} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ACTIVE THREAT PROFILE
              </div>
              <div style={{ fontSize: '0.94rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                {currentCropData.primary}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.64rem', fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: '#FEF3C7', color: '#B45309' }}>
            Seasonal Vulnerability
          </span>
        </div>

        <div style={{ fontSize: '0.78rem', color: isDarkMode ? '#CBD5E1' : '#475569', lineHeight: 1.45, marginBottom: 10 }}>
          <strong>Known Threats:</strong> {currentCropData.allPests}
        </div>

        <div style={{
          padding: '10px 12px',
          borderRadius: 14,
          background: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#FFFBEB',
          border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FDE68A',
          fontSize: '0.74rem',
          color: isDarkMode ? '#FDE68A' : '#92400E',
          lineHeight: 1.4
        }}>
          ⚡ <strong>Trigger Warning:</strong> {currentCropData.weatherTrigger}
        </div>
      </motion.div>

      {/* ── 4-TIER INTEGRATED PEST MANAGEMENT (IPM) PROTOCOL CARD (EXACT AS SCREENSHOT) ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 24,
          padding: '18px 18px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(16, 185, 129, 0.25)',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
          marginBottom: 16
        }}
      >
        {/* Card Header (Matches Screenshot) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803D' }}>
              <Shield size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ECO-FRIENDLY BIO-PROTECTION
              </div>
              <div style={{ fontSize: '1.02rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
                Integrated Pest Management (IPM)
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: '#DCFCE7', color: '#15803D' }}>
            Non-Chemical First
          </span>
        </div>

        {/* Risk Assessment Strip (Matches Screenshot) */}
        <div style={{
          padding: '9px 12px',
          borderRadius: 14,
          background: isDarkMode ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
          border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #A7F3D0',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Shield size={16} color="#15803D" strokeWidth={2.5} />
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isDarkMode ? '#86EFAC' : '#15803D' }}>
            {riskAssessmentText}
          </span>
        </div>

        {/* 4 Tier IPM Steps (Matches Screenshot) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {(ipmRemedies?.steps || []).map((ipm) => {
            const isChecked = checkedSteps[ipm.step];

            return (
              <div
                key={ipm.step}
                onClick={() => toggleStep(ipm.step)}
                style={{
                  padding: '14px 15px',
                  borderRadius: 16,
                  background: isChecked
                    ? (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4')
                    : (isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAF7'),
                  border: isChecked
                    ? '1.5px solid #15803D'
                    : '1px solid var(--border-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: 6,
                      border: isChecked ? 'none' : '2px solid var(--border-main)',
                      background: isChecked ? '#15803D' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFFFFF'
                    }}>
                      {isChecked && <Check size={13} strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      {ipm.title}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    color: ipm.color,
                    background: `${ipm.color}18`,
                    border: `1px solid ${ipm.color}35`,
                    padding: '3px 8px',
                    borderRadius: 8
                  }}>
                    {ipm.badge}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: isDarkMode ? '#CBD5E1' : '#475569', lineHeight: 1.45, paddingLeft: 28 }}>
                  {ipm.action}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── BIO-SPRAY / SPRINKLER QUICK ACTUATOR CARD ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 22,
          padding: '16px 18px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: isSprinklerActive ? '#15803D' : '#FEF3C7',
            color: isSprinklerActive ? '#FFFFFF' : '#D97706',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={20} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ fontSize: '0.64rem', fontWeight: 800, color: isDarkMode ? '#94A3B8' : '#64748B', textTransform: 'uppercase' }}>
              AUTOMATED HARDWARE INTERLOCK
            </div>
            <div style={{ fontSize: '0.94rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
              Pest Sprinkler Actuator
            </div>
            <div style={{ fontSize: '0.70rem', color: isSprinklerActive ? '#15803D' : '#94A3B8', fontWeight: 700 }}>
              Status: {isSprinklerActive ? 'ACTIVE (Spraying Bio-Solution)' : 'STANDBY (Off)'}
            </div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => toggleActuator && toggleActuator('pest_sprinkler')}
          style={{
            padding: '8px 16px',
            borderRadius: 12,
            border: 'none',
            background: isSprinklerActive ? '#DC2626' : '#15803D',
            color: '#FFFFFF',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: isSprinklerActive ? '0 2px 10px rgba(220, 38, 38, 0.3)' : '0 2px 10px rgba(21, 128, 61, 0.3)'
          }}
        >
          {isSprinklerActive ? 'Turn Off' : 'Activate'}
        </motion.button>
      </motion.div>

      <div style={{ height: 16 }} />

      {/* Footer */}
      <footer style={{ textAlign: 'center', marginTop: 8, paddingBottom: 10 }}>
        <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', opacity: 0.6 }}>
          KRISHI SETHU • PEST MANAGEMENT ENGINE v17.1.0
        </div>
      </footer>
    </div>
  );
};

export default PestManagement;

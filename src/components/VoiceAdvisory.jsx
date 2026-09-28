import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Pause, Play, RefreshCw, Sparkles, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { speechService } from '../api/speechService';
import { STABLE_VOICE_PROFILES, getStableVoiceConfig, setStableVoiceConfig } from '../api/aiService';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'hi', label: 'हिन्दी' }
];

export const VoiceAdvisory = ({
  appContext = {},
  telemetryContext = {},
  brain = null,
  cur = {},
  sensors = [],
  sensorData = {},
  selectedCrop = 'rice',
  defaultLang = 'en',
  isDarkMode = false,
  className = '',
  style = {}
}) => {
  const [lang, setLang] = useState(defaultLang);
  const [pipelineState, setPipelineState] = useState('idle'); // 'idle' | 'collecting' | 'analyzing' | 'synthesizing' | 'playing' | 'paused' | 'error'
  const [statusMessage, setStatusMessage] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [reasoningData, setReasoningData] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(() => getStableVoiceConfig(defaultLang));
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Sync with speechService events
  useEffect(() => {
    const unsub = speechService.subscribe((isSpeaking, payload) => {
      if (payload) {
        setPipelineState(payload.state);
        setStatusMessage(payload.message);
        if (payload.summary?.speechSummary?.[lang]) {
          setGeneratedText(payload.summary.speechSummary[lang]);
          setReasoningData(payload.summary);
        }
      }
    });

    return () => {
      unsub();
      speechService.stop();
    };
  }, [lang]);

  // Handle Voice Selection change
  const handleVoiceChange = (voiceId) => {
    setSelectedVoice(voiceId);
    setStableVoiceConfig(lang, voiceId);
    setShowVoicePicker(false);
  };

  // Switch Language
  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    setSelectedVoice(getStableVoiceConfig(newLang));
    if (speechService.isSpeakingNow()) {
      speechService.stop();
    }
  };

  // Run or Trigger Gemini AI Pipeline
  const handleTriggerSummary = useCallback(async (forceRefresh = false) => {
    try {
      if (pipelineState === 'playing') {
        speechService.pause();
        return;
      }

      if (pipelineState === 'paused' && !forceRefresh) {
        speechService.resume();
        return;
      }

      const res = await speechService.runAiVoicePipeline({
        appContext: {
          ...appContext,
          activePlot: { crop: selectedCrop, ...(appContext?.activePlot || {}) }
        },
        telemetryContext: {
          ...telemetryContext,
          sensorData: sensorData || telemetryContext?.sensorData || {},
          farmAdvisorBrain: brain
        },
        farmAdvisorBrain: brain,
        lang,
        voiceName: selectedVoice,
        forceRefresh
      });

      if (res?.speechText) {
        setGeneratedText(res.speechText);
        setReasoningData(res.summary);
      }
    } catch (err) {
      console.warn('[VoiceAdvisory] Pipeline trigger error:', err);
    }
  }, [pipelineState, appContext, telemetryContext, sensorData, brain, selectedCrop, lang, selectedVoice]);

  const isLoading = ['collecting', 'analyzing', 'synthesizing'].includes(pipelineState);
  const isPlaying = pipelineState === 'playing';
  const isPaused = pipelineState === 'paused';

  const currentProfile = STABLE_VOICE_PROFILES[lang] || STABLE_VOICE_PROFILES.en;

  return (
    <div
      className={`krishi-voice-advisory-card ${className}`}
      style={{
        borderRadius: 20,
        padding: '18px 20px',
        background: isDarkMode
          ? 'linear-gradient(145deg, #131d17 0%, #0d161a 100%)'
          : 'linear-gradient(145deg, #FFFFFF 0%, #F5FAF6 100%)',
        border: isDarkMode
          ? '1.5px solid rgba(34, 197, 94, 0.25)'
          : '1.5px solid rgba(21, 128, 61, 0.2)',
        boxShadow: isDarkMode
          ? '0 8px 30px rgba(0, 0, 0, 0.45)'
          : '0 4px 24px rgba(21, 128, 61, 0.08)',
        position: 'relative',
        overflow: 'visible',
        ...style
      }}
    >
      {/* ── Top Bar: Title & Language Selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803D'
            }}
          >
            <Sparkles size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', letterSpacing: '-0.01em' }}>
              AI Voice Summary
            </div>
            <div style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 600 }}>
              Gemini Agricultural Intelligence
            </div>
          </div>
        </div>

        {/* Language Tabs: [ English ] [ বাংলা ] [ हिन्दी ] */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
            padding: 3,
            borderRadius: 12,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'
          }}
        >
          {SUPPORTED_LANGUAGES.map(l => (
            <button
              key={l.code}
              onClick={() => handleLanguageChange(l.code)}
              style={{
                border: 'none',
                background: lang === l.code ? '#15803D' : 'transparent',
                color: lang === l.code ? '#FFFFFF' : (isDarkMode ? '#94A3B8' : '#64748B'),
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 9,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Status Progress Indicator ── */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 10,
            background: isDarkMode ? 'rgba(34, 197, 94, 0.1)' : '#F0FDF4',
            border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid #BBF7D0',
            marginBottom: 12
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ display: 'flex', color: '#15803D' }}
          >
            <RefreshCw size={13} />
          </motion.div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#15803D' }}>
            {statusMessage || 'Processing field intelligence...'}
          </span>
        </motion.div>
      )}

      {/* ── Generated Text Display ── */}
      {generatedText && !isLoading && (
        <div
          style={{
            background: isDarkMode ? 'rgba(0, 0, 0, 0.25)' : '#F8FAF7',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
            borderRadius: 14,
            padding: '12px 14px',
            marginBottom: 12
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.82rem',
              fontWeight: 600,
              lineHeight: 1.52,
              color: isDarkMode ? '#E2E8F0' : '#334155'
            }}
          >
            {generatedText}
          </p>

          {reasoningData?.missingInformation?.length > 0 && (
            <div style={{ marginTop: 8, fontSize: '0.70rem', color: '#94A3B8', fontStyle: 'italic' }}>
              Note: {reasoningData.missingInformation.join(', ')} currently offline.
            </div>
          )}
        </div>
      )}

      {/* ── Controls Row: Play / Pause / Regenerate ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Main Action Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTriggerSummary(false)}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: isPlaying ? '#DC2626' : '#15803D',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              padding: '8px 16px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: isLoading ? 'wait' : 'pointer',
              boxShadow: isPlaying ? '0 2px 12px rgba(220, 38, 38, 0.35)' : '0 2px 10px rgba(21, 128, 61, 0.3)'
            }}
          >
            {isPlaying ? (
              <>
                <Pause size={15} />
                <span>Pause</span>
              </>
            ) : isPaused ? (
              <>
                <Play size={15} />
                <span>Resume</span>
              </>
            ) : isLoading ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw size={14} />
                </motion.div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Volume2 size={15} />
                <span>Play Summary</span>
              </>
            )}
          </motion.button>

          {/* Regenerate Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTriggerSummary(true)}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '8px 12px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: isDarkMode ? '#CBD5E1' : '#475569',
              cursor: isLoading ? 'wait' : 'pointer'
            }}
            title="Re-analyze current field state"
          >
            <RefreshCw size={13} />
            <span>Regenerate</span>
          </motion.button>
        </div>

        {/* Stable Voice Selector Dropdown Toggle */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowVoicePicker(!showVoicePicker)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <span>Voice Profile</span>
            <ChevronDown size={12} />
          </button>

          <AnimatePresence>
            {showVoicePicker && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '120%',
                  background: isDarkMode ? '#1E293B' : '#FFFFFF',
                  borderRadius: 12,
                  padding: 6,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                  zIndex: 50,
                  minWidth: 180
                }}
              >
                {currentProfile.availableVoices.map(v => (
                  <div
                    key={v.id}
                    onClick={() => handleVoiceChange(v.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: '0.72rem',
                      fontWeight: selectedVoice === v.id ? 800 : 600,
                      color: selectedVoice === v.id ? '#15803D' : (isDarkMode ? '#E2E8F0' : '#334155'),
                      background: selectedVoice === v.id ? (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7') : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{v.name}</span>
                    {selectedVoice === v.id && <CheckCircle2 size={13} color="#15803D" />}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default VoiceAdvisory;

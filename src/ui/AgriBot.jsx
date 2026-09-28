import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Bot, Sparkles, X, ChevronDown, Check, Copy,
  Mic, MicOff, Volume2, VolumeX, Trash2, Plus, Camera,
  BarChart2, FileText, MapPin, Droplets, Thermometer,
  CloudRain, CheckCircle2, Loader2, Wheat, Shield,
  Landmark, Handshake, DollarSign, Megaphone
} from 'lucide-react';
import { useApp } from '../state/AppContext';
import { useTelemetry } from '../state/TelemetryContext';
import { askGemini } from '../api/aiService';
import { speakText, stopSpeaking } from '../services/voiceService';
import { speechService } from '../api/speechService';
import ReactMarkdown from 'react-markdown';

const COLORS = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  danger: 'var(--danger)',
  dark: 'var(--text-main)',
  subtext: 'var(--text-muted)'
};

const springConfig = { type: "spring", stiffness: 400, damping: 30 };

// Browser Speech Recognition instance (cross-browser fallback)
const SpeechRecognition = typeof window !== 'undefined' 
  ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
  : null;

// Conversation starter chips (modern horizontal row)
const CONVERSATION_CHIPS = [
  { id: 'crop', label: '🌱 Check My Crop', prompt: 'How is my crop health and growth stage right now?' },
  { id: 'irrigate', label: '💧 Should I Irrigate?', prompt: 'Should I irrigate my field right now based on my current soil moisture and weather?' },
  { id: 'weather', label: '🌦️ Weather', prompt: 'What is the current weather and rain forecast for my farm?' },
  { id: 'soil', label: '🧪 Check Soil', prompt: 'What are my current soil conditions including moisture, pH, and nutrients?' },
  { id: 'insurance', label: '🛡️ Crop Insurance', prompt: 'What is PMFBY crop insurance and how do I report crop loss within 72 hours?' },
  { id: 'schemes', label: '🏛️ Government Schemes', prompt: 'What government agricultural schemes like PM-KISAN, AIF, and SMAM are available?' },
  { id: 'pacs', label: '🤝 Cooperative Help', prompt: 'How can my local PACS cooperative help me with KCC crop credit and farm inputs?' }
];

// 3 Real Contextual Suggestion Cards for Empty State
const CONTEXTUAL_SUGGESTIONS = [
  {
    id: 'irrigate',
    icon: Droplets,
    color: '#0284C7',
    label: 'Should I irrigate now?',
    prompt: 'Should I irrigate my field right now based on my live soil moisture and weather forecast?'
  },
  {
    id: 'health',
    icon: Sparkles,
    color: '#10B981',
    label: 'Check my crop health',
    prompt: 'Check my crop health, soil NPK balance, and current growth stage requirements.'
  },
  {
    id: 'schemes',
    icon: Landmark,
    color: '#F59E0B',
    label: 'Find relevant schemes',
    prompt: 'What government agriculture schemes, PM-KISAN subsidies, and PACS facilities am I eligible for?'
  }
];

const AgriBot = ({ fullScreen = false }) => {
  const navigate = useNavigate();
  const { apiWeather, apiForecast, actuators, farmInfo, currentGPS, isDarkMode } = useApp();
  const telemetry = useTelemetry();
  const telemetryRef = useRef(telemetry);
  
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  const [isOpen, setIsOpen] = useState(fullScreen ? true : false);
  useEffect(() => {
    if (fullScreen) setIsOpen(true);
  }, [fullScreen]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toolSteps, setToolSteps] = useState([]); // Dynamic real-time tool execution badges
  const [chatLang, setChatLang] = useState('en'); // 'en' | 'bn' | 'hi'
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Live sensor readings directly from IoT Telemetry (NO FAKE DEMO VALUES)
  const sensorData = telemetry?.sensorData;
  const liveMoisture = (sensorData?.soil?.moisture !== null && sensorData?.soil?.moisture !== undefined && !isNaN(sensorData?.soil?.moisture))
    ? Number(sensorData.soil.moisture)
    : null;
  const liveTemp = (sensorData?.soil?.temp !== null && sensorData?.soil?.temp !== undefined && !isNaN(sensorData?.soil?.temp))
    ? Number(sensorData.soil.temp)
    : ((sensorData?.weather?.temp !== null && sensorData?.weather?.temp !== undefined && !isNaN(sensorData?.weather?.temp))
      ? Number(sensorData.weather.temp)
      : null);
  const livePh = (sensorData?.soil?.ph !== null && sensorData?.soil?.ph !== undefined && !isNaN(sensorData?.soil?.ph))
    ? Number(sensorData.soil.ph)
    : null;
  const liveRain = (sensorData?.weather?.rainLevel !== null && sensorData?.weather?.rainLevel !== undefined && !isNaN(sensorData?.weather?.rainLevel))
    ? Number(sensorData.weather.rainLevel)
    : null;
  const hasRealTelemetry = liveMoisture !== null || liveTemp !== null || livePh !== null;

  const handleCopyMessage = (index, text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedIdx(index);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isTyping, isOpen, toolSteps]);

  // Clean up speech on unmount, close, or when playback completes
  useEffect(() => {
    const unsub = speechService.subscribe((isSpeaking) => {
      if (!isSpeaking) {
        setSpeakingIdx(null);
      }
    });

    return () => {
      unsub();
      stopSpeaking();
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSend = async (textToSend = input, isVoiceTriggered = false) => {
    const text = (typeof textToSend === 'string' ? textToSend : input).trim();
    if (!text) return;

    stopSpeaking();
    setSpeakingIdx(null);
    setShowAttachMenu(false);

    const userMessage = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setToolSteps([]); // Start clean without fake mock steps

    const { sensorData: currentSensors, systemHealth, sensorHistory, devices, lastGlobalUpdate } = telemetryRef.current || {};
    
    const context = {
      farmName: farmInfo?.name || 'Krishi Sethu Farm',
      projectName: farmInfo?.projectName || 'Krishi Sethu',
      location: currentGPS?.city || farmInfo?.city || 'Regional Hub, India',
      crop: farmInfo?.crop || 'Paddy (Rice)',
      stage: farmInfo?.stage || 'Tillering',
      soilType: farmInfo?.soilType || 'Alluvial Loam',
      acreage: farmInfo?.acreage ? `${farmInfo.acreage} Acres` : '2.0 Acres',
      language: chatLang,
      currentSensors: currentSensors || {},
      liveTelemetry: {
        moisture: liveMoisture,
        temp: liveTemp,
        ph: livePh,
        rain: liveRain,
        isOnline: hasRealTelemetry
      },
      weather: apiWeather,
      forecast: apiForecast,
      actuators: actuators,
      devices: devices,
      health: systemHealth,
      recentLogs: sensorHistory?.slice(-10),
      lastGlobalUpdate: lastGlobalUpdate,
      time: new Date().toLocaleTimeString()
    };

    try {
      const response = await askGemini({
        prompt: text,
        context,
        history: messages.slice(-8),
        onToolCall: (step) => {
          setToolSteps(prev => {
            const filtered = prev.filter(s => s.id !== step.id);
            return [...filtered, step];
          });
        }
      });

      const aiMessage = { 
        role: 'ai', 
        content: response, 
        timestamp: new Date(),
        telemetrySnapshot: {
          moisture: liveMoisture,
          temp: liveTemp,
          ph: livePh,
          rain: liveRain
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      if (isVoiceTriggered || autoSpeak) {
        const cleanText = response.replace(/###/g, '').replace(/\*\*/g, '').replace(/[*#_`]/g, '');
        speakText({ text: cleanText, language: chatLang });
        setSpeakingIdx(messages.length + 1);
      }
    } catch (error) {
      console.error("AgriBot API Error:", error);
      const errorMessage = { 
        role: 'ai', 
        content: "I ran into a temporary issue retrieving live farm telemetry. Please ask your question again in a moment.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setToolSteps([]), 2000);
    }
  };

  // 🎙️ Speech-to-Text (Voice Input)
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome/Edge or type your query.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = chatLang === 'bn' ? 'bn-IN' : (chatLang === 'hi' ? 'hi-IN' : 'en-IN');

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);

        if (event.results[0].isFinal) {
          setIsListening(false);
          handleSend(transcript, true);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      setIsListening(false);
    }
  };

  // 🔊 Text-to-Speech (Voice Output)
  const toggleSpeechForMessage = (idx, content) => {
    if (speakingIdx === idx) {
      stopSpeaking();
      setSpeakingIdx(null);
    } else {
      stopSpeaking();
      setSpeakingIdx(idx);
      const cleanText = content.replace(/###/g, '').replace(/\*\*/g, '').replace(/[*#_`]/g, '');
      speakText({ text: cleanText, language: chatLang });
    }
  };

  const langLabels = { en: 'EN', bn: 'বাং', hi: 'हिं' };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={fullScreen ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={fullScreen ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            exit={fullScreen ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            transition={springConfig}
            style={fullScreen ? {
              position: 'relative',
              width: '100%',
              height: '100%',
              flex: 1,
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: 'none',
              boxShadow: 'none',
              borderRadius: 0,
            } : {
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: 'calc(100vw - 40px)',
              maxWidth: '460px',
              height: '85vh',
              maxHeight: '720px',
              background: 'var(--bg-card)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-premium)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 10001,
              border: '1px solid var(--border-main)',
            }}
          >
            {/* 1. TOP SUB-HEADER: SIMPLIFIED & SUBTLE */}
            <div style={{
              padding: '10px 16px',
              background: 'var(--bg-main)',
              borderBottom: '1px solid var(--border-main)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              {/* Left: Active indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 6px #10B981',
                  display: 'inline-block'
                }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.01em' }}>
                  Krishi AI
                </span>
              </div>

              {/* Right: Language Dropdown + Voice + Clear */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                {/* Language Selector Dropdown Button */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-main)',
                      color: 'var(--text-main)',
                      padding: '4px 10px',
                      borderRadius: '10px',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      outline: 'none'
                    }}
                  >
                    <span>{langLabels[chatLang] || 'EN'}</span>
                    <ChevronDown size={13} strokeWidth={2.4} />
                  </button>

                  <AnimatePresence>
                    {showLangMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          marginTop: '6px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-main)',
                          borderRadius: '12px',
                          boxShadow: 'var(--shadow-lg)',
                          padding: '4px',
                          zIndex: 200,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          minWidth: '80px'
                        }}
                      >
                        {[
                          { id: 'en', label: 'English' },
                          { id: 'bn', label: 'বাংলা' },
                          { id: 'hi', label: 'हिंदी' }
                        ].map(l => (
                          <button
                            key={l.id}
                            onClick={() => {
                              setChatLang(l.id);
                              setShowLangMenu(false);
                            }}
                            style={{
                              background: chatLang === l.id ? 'var(--primary-soft)' : 'transparent',
                              color: chatLang === l.id ? 'var(--primary)' : 'var(--text-main)',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 10px',
                              fontSize: '0.74rem',
                              fontWeight: chatLang === l.id ? 800 : 600,
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            {l.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Auto-Speech Toggle */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  title={autoSpeak ? "Voice speech: ON" : "Voice speech: OFF"}
                  style={{
                    background: autoSpeak ? 'var(--primary-soft)' : 'var(--bg-card)',
                    border: `1px solid ${autoSpeak ? 'var(--primary)' : 'var(--border-main)'}`,
                    color: autoSpeak ? 'var(--primary)' : 'var(--text-muted)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Volume2 size={15} strokeWidth={2.4} />
                </motion.button>

                {/* Clear Chat */}
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    stopSpeaking();
                    setMessages([]);
                  }}
                  title="Clear chat"
                  style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-main)', 
                    color: 'var(--text-muted)', 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '9px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    cursor: 'pointer' 
                  }}
                >
                  <Trash2 size={15} strokeWidth={2.2} />
                </motion.button>

                {!fullScreen && (
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      stopSpeaking();
                      setIsOpen(false);
                    }}
                    style={{ 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border-main)', 
                      color: 'var(--text-main)', 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '9px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer' 
                    }}
                  >
                    <X size={16} strokeWidth={2.6} />
                  </motion.button>
                )}
              </div>
            </div>

            {/* 💬 CHAT STREAM (THE ONLY SCROLLABLE AREA) */}
            <div 
              className="no-scrollbar" 
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                WebkitOverflowScrolling: 'touch',
                padding: '16px 14px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px', 
                background: 'var(--bg-card)' 
              }}
            >
              <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

              {/* 2. COMPACT EMPTY STATE */}
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '18px 8px 12px', margin: 'auto 0' }}>
                  {/* Sparkle ✦ */}
                  <div style={{ 
                    fontSize: '1.8rem', 
                    color: 'var(--primary)', 
                    lineHeight: 1, 
                    marginBottom: '10px',
                    fontWeight: 900
                  }}>
                    ✦
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--text-main)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    How can I help today?
                  </h3>
                  
                  <p style={{ fontSize: '0.80rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.45 }}>
                    Your intelligent farm assistant • Ask about your farm, crops, schemes, or insurance.
                  </p>

                  {/* 3. LIVE FARM CONTEXT BADGE (Render ONLY if real telemetry is online - NO FAKE DEMO VALUES) */}
                  {hasRealTelemetry && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      background: 'var(--bg-main)',
                      border: '1px solid var(--border-main)',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      marginBottom: '18px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {liveMoisture !== null && <span>💧 {Math.round(liveMoisture)}%</span>}
                      {liveTemp !== null && <span>🌡️ {Math.round(liveTemp)}°C</span>}
                      {livePh !== null && <span>pH {livePh.toFixed(1)}</span>}
                      <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                        LIVE
                      </span>
                    </div>
                  )}

                  <div style={{ width: '100%', height: '1px', background: 'var(--border-main)', marginBottom: '18px', opacity: 0.6 }} />

                  {/* 3 Contextual Suggestions (Real Questions sent to Gemini) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', marginBottom: '18px' }}>
                    {CONTEXTUAL_SUGGESTIONS.map(s => {
                      const Icon = s.icon;
                      return (
                        <motion.button
                          key={s.id}
                          whileHover={{ x: 3, borderColor: 'var(--primary)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSend(s.prompt)}
                          style={{
                            padding: '11px 14px',
                            borderRadius: '13px',
                            border: '1px solid var(--border-main)',
                            background: 'var(--bg-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Icon size={16} color={s.color} strokeWidth={2.4} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)' }}>
                              {s.label}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>→</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* 4. Horizontal Chip Row (Conversation Starters) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    paddingBottom: '4px'
                  }} className="no-scrollbar">
                    {CONVERSATION_CHIPS.map(chip => (
                      <button
                        key={chip.id}
                        onClick={() => handleSend(chip.prompt)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          border: '1px solid var(--border-main)',
                          background: 'var(--bg-main)',
                          color: 'var(--text-main)',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: '0.15s'
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Chat Message Stream */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: msg.role === 'user' ? '82%' : '92%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  {/* AI Message Header (Avatar + KrishiSethu AI) */}
                  {msg.role === 'ai' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
                      <div style={{ 
                        width: '18px', height: '18px', borderRadius: '5px', 
                        background: 'var(--primary-soft)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Bot size={12} color="var(--primary)" />
                      </div>
                      <span style={{ fontSize: '0.70rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                        KrishiSethu AI
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-main)',
                      color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-main)',
                      padding: '12px 16px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      boxShadow: msg.role === 'user' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border-main)',
                      fontSize: '0.86rem',
                      fontWeight: 500,
                      lineHeight: 1.55,
                      position: 'relative'
                    }}
                  >
                    <ReactMarkdown 
                      components={{
                        h3: ({node, ...props}) => <h3 style={{ fontSize: '0.94rem', fontWeight: 900, margin: '8px 0 4px', color: msg.role === 'user' ? '#FFFFFF' : 'var(--primary)' }} {...props} />,
                        p: ({node, ...props}) => <p style={{ margin: '0 0 6px' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: '3px' }} {...props} />,
                        strong: ({node, ...props}) => <strong style={{ fontWeight: 800, color: msg.role === 'user' ? '#FFFFFF' : 'var(--primary-deep, var(--primary))' }} {...props} />,
                        blockquote: ({node, ...props}) => <blockquote style={{ margin: '6px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.06)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }} {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* 8. Selective Inline Live Card for Telemetry / Recommendations */}
                    {msg.role === 'ai' && msg.telemetrySnapshot && (
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-main)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.70rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)'
                      }}>
                        <span>💧 Soil: {msg.telemetrySnapshot.moisture}%</span>
                        <span>🌡️ {msg.telemetrySnapshot.temp}°C</span>
                        <span>pH: {msg.telemetrySnapshot.ph}</span>
                        <span style={{ color: '#10B981' }}>● Live</span>
                      </div>
                    )}

                    {/* Bubble Footer with Timestamp, Clipboard Copy & Audio Speaker */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'space-between',
                      marginTop: '8px', 
                      paddingTop: '6px',
                      gap: '8px',
                      borderTop: msg.role === 'user' ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--border-main)'
                    }}>
                      {msg.role === 'ai' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Copy to Clipboard Button */}
                          <button
                            onClick={() => handleCopyMessage(i, msg.content)}
                            title="Copy message to clipboard"
                            style={{
                              background: copiedIdx === i ? 'var(--primary-soft)' : 'transparent',
                              border: 'none',
                              color: copiedIdx === i ? 'var(--primary)' : 'var(--text-muted)',
                              padding: '3px 6px',
                              borderRadius: '6px',
                              fontSize: '0.67rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {copiedIdx === i ? <Check size={12} color="var(--primary)" /> : <Copy size={12} />}
                            <span>{copiedIdx === i ? 'Copied' : 'Copy'}</span>
                          </button>

                          {/* Text-to-Speech Button */}
                          <button
                            onClick={() => toggleSpeechForMessage(i, msg.content)}
                            style={{
                              background: speakingIdx === i ? 'var(--primary-soft)' : 'transparent',
                              border: 'none',
                              color: speakingIdx === i ? 'var(--primary)' : 'var(--text-muted)',
                              padding: '3px 6px',
                              borderRadius: '6px',
                              fontSize: '0.67rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {speakingIdx === i ? (
                              <>
                                <VolumeX size={12} color="var(--primary)" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 size={12} />
                                <span>Speak</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <span style={{ fontSize: '0.60rem', opacity: 0.65, fontWeight: 700 }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* 9. REALISTIC TOOL ACTIVITY INDICATOR (AGENT ACTIONS) */}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 6 }} 
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '85%',
                    background: 'var(--bg-main)',
                    borderRadius: '16px',
                    padding: '10px 14px',
                    border: '1px solid var(--border-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <Loader2 size={13} className="spin" color="var(--primary)" />
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {toolSteps.length > 0 ? 'AGENT TOOL EXECUTION' : 'THINKING'}
                    </span>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
                  </div>

                  {toolSteps.length > 0 ? (
                    toolSteps.map((step) => (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {step.status === 'done' ? (
                          <CheckCircle2 size={13} color="#10B981" />
                        ) : (
                          <Loader2 size={12} className="spin" color="var(--primary)" />
                        )}
                        <span>{step.text}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <span>Analyzing query and farm context...</span>
                    </div>
                  )}
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* 3. LIVE FARM CONTEXT STRIP ABOVE INPUT (Render ONLY if real telemetry is online - NO FAKE DEMO VALUES) */}
            {messages.length > 0 && hasRealTelemetry && (
              <div style={{
                padding: '6px 14px',
                background: 'var(--bg-main)',
                borderTop: '1px solid var(--border-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.70rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {liveMoisture !== null && <span>💧 {Math.round(liveMoisture)}%</span>}
                  {liveTemp !== null && <span>🌡️ {Math.round(liveTemp)}°C</span>}
                  {livePh !== null && <span>pH {livePh.toFixed(1)}</span>}
                  {liveRain !== null && <span>🌧️ {Math.round(liveRain)}mm</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#10B981' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                  <span>Live Telemetry</span>
                </div>
              </div>
            )}

            {/* 6. ATTACHMENT MENU POPOVER */}
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    bottom: '68px',
                    left: '12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-main)',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-premium)',
                    padding: '8px',
                    zIndex: 300,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    width: '210px'
                  }}
                >
                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      navigate('/pest-management');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      textAlign: 'left'
                    }}
                  >
                    <Camera size={16} color="var(--primary)" />
                    <span>📷 Scan Leaf</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      const telParts = [];
                      if (liveMoisture !== null) telParts.push(`Soil Moisture ${Math.round(liveMoisture)}%`);
                      if (liveTemp !== null) telParts.push(`Temperature ${Math.round(liveTemp)}°C`);
                      if (livePh !== null) telParts.push(`pH ${livePh.toFixed(1)}`);
                      handleSend(
                        telParts.length 
                          ? `Analyze my live farm telemetry: ${telParts.join(', ')}.`
                          : 'Analyze my current farm and crop conditions.'
                      );
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      textAlign: 'left'
                    }}
                  >
                    <BarChart2 size={16} color="#0284C7" />
                    <span>📊 Analyze Sensor Data</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      setInput("Here is my soil test report: N=120kg/ha, P=35kg/ha, K=180kg/ha, pH=6.4. What fertilizer should I apply?");
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      textAlign: 'left'
                    }}
                  >
                    <FileText size={16} color="#F59E0B" />
                    <span>📄 Upload Report</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAttachMenu(false);
                      handleSend(`Provide hyper-local weather risk radar and advisory for my coordinates in ${farmInfo?.city || 'Krishnanagar'}.`);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      textAlign: 'left'
                    }}
                  >
                    <MapPin size={16} color="#10B981" />
                    <span>📍 Use Farm Location</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 5. PROMINENT FOCAL INPUT CONSOLE WITH ATTACHMENT (+) & OUTSIDE CIRCULAR SEND BUTTON */}
            <div style={{ 
              padding: '10px 14px', 
              paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
              background: 'var(--bg-main)', 
              borderTop: '1px solid var(--border-main)', 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center',
              flexShrink: 0
            }}>
              {/* Attachment / Camera (+) Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                title="Attach or trigger farm action"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-main)',
                  background: showAttachMenu ? 'var(--primary-soft)' : 'var(--bg-card)',
                  color: showAttachMenu ? 'var(--primary)' : 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
              >
                <Plus size={20} strokeWidth={2.5} style={{ transform: showAttachMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
              </motion.button>

              {/* Wide Text Input with Integrated Mic Button inside */}
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  autoComplete="off"
                  enterKeyHint="send"
                  placeholder={isListening ? "Listening... Speak now..." : (chatLang === 'bn' ? "আপনার খামার সম্পর্কে জিজ্ঞাসা করুন..." : (chatLang === 'hi' ? "अपने खेत के बारे में पूछें..." : "Ask about your farm..."))}
                  style={{ 
                    width: '100%', 
                    border: isListening ? '1.5px solid #EF4444' : '1.5px solid var(--border-main)', 
                    background: 'var(--bg-card)', 
                    borderRadius: '24px', 
                    padding: '11px 44px 11px 16px', 
                    fontSize: '0.88rem', 
                    outline: 'none', 
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-main)';
                  }}
                />

                {/* Integrated Mic Button inside input */}
                <button
                  onClick={toggleListening}
                  title={isListening ? "Listening... Tap to stop" : "Voice input"}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: isListening ? '#FEE2E2' : 'transparent',
                    border: isListening ? '1px solid #EF4444' : 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isListening ? '#EF4444' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {isListening ? (
                    <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      <MicOff size={16} />
                    </motion.div>
                  ) : (
                    <Mic size={16} />
                  )}
                </button>
              </div>

              {/* Circular Send Button Outside */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSend()}
                disabled={!input.trim() && !isListening}
                style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%', 
                  background: (input.trim() || isListening) ? 'var(--primary)' : 'var(--border-main)', 
                  color: '#FFFFFF', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  cursor: (input.trim() || isListening) ? 'pointer' : 'default',
                  flexShrink: 0,
                  boxShadow: (input.trim() || isListening) ? '0 4px 12px rgba(21, 128, 61, 0.3)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Send size={18} strokeWidth={2.4} style={{ marginLeft: '2px' }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AgriBot;

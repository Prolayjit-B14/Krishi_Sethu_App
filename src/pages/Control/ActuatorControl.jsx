/**
 * AgriSense Pro — Actuator Control
 * Premium AgTech Industrial IoT Control Panel
 * Exact visual match to screenshot:
 * - Clean section containers with tinted #F1F5F2 surfaces and 22px rounded corners
 * - Category headers with green icons, titles, descriptions, and device count badges
 * - Compact, professional actuator control rows with category-tinted icon containers
 * - Custom 52x30px smooth toggles with 24px white circular thumbs
 * - Subdued, authoritative status indicators (● ON, ● OPEN, ● OFF)
 * - Full-width Emergency Stop (All Actuators) with red outline and warning icon
 * - Bottom Navigation with active Devices tab in Forest Green (#176B45)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Droplets, Waves, FlaskConical, Fan, CloudFog, 
  Lightbulb, Flashlight, AlertTriangle, 
  Shield, Leaf, SprayCan, Monitor, Camera,
  CheckCircle2, Gauge, Zap, TrendingDown, Clock, ArrowRight, ChevronRight, X
} from 'lucide-react';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { detectWaterlogging } from '../../logic/healthEngine';

// ─── CUSTOM PROFESSIONAL OUTLINE ICONS ───────────────────────────────────────
const BugIcon = ({ size = 20, color = 'currentColor', strokeWidth = 2.2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="8" height="14" x="8" y="6" rx="4" />
    <path d="m19 7-3 2" />
    <path d="m5 7 3 2" />
    <path d="m19 19-3-2" />
    <path d="m5 19 3-2" />
    <path d="M20 13h-4" />
    <path d="M4 13h4" />
    <path d="m10 4 1 2" />
    <path d="m14 4-1 2" />
  </svg>
);

const SirenIcon = ({ size = 20, color = 'currentColor', strokeWidth = 2.2 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 18v-6a5 5 0 1 1 10 0v6" />
    <path d="M5 21a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2z" />
    <path d="M21 12h1" />
    <path d="M18.5 4.5 19 4" />
    <path d="M2 12h1" />
    <path d="M12 2v1" />
    <path d="M4.9 4.9 5.5 5.5" />
    <path d="M12 12v3" />
  </svg>
);

// ─── 6 CATEGORIES WITH USER-SPECIFIED ACTUATORS & SEMANTIC PALETTES ──────────
const ACTUATOR_CATEGORIES = [
  {
    id: 'irrigation',
    title: 'IRRIGATION',
    headerIcon: Droplets,
    headerColor: '#0284C7',
    headerBg: '#E0F2FE',
    headerBorder: '#BAE6FD',
    headerDarkBg: 'rgba(2, 132, 199, 0.2)',
    headerDarkColor: '#38BDF8',
    items: [
      {
        key: 'pump',
        name: 'Water Pump',
        icon: Droplets,
        iconColor: '#0284C7',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        isOpenType: false,
        onColor: '#0284C7',
      },
      {
        key: 'valve',
        name: 'Main Valve',
        icon: Waves,
        iconColor: '#0369A1',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        isOpenType: true,
        onColor: '#0284C7',
      },
    ],
  },
  {
    id: 'crop_protection',
    title: 'CROP PROTECTION',
    headerIcon: Leaf,
    headerColor: '#16A34A',
    headerBg: '#DCFCE7',
    headerBorder: '#BBF7D0',
    headerDarkBg: 'rgba(22, 163, 74, 0.2)',
    headerDarkColor: '#4ADE80',
    items: [
      {
        key: 'fertilizer',
        name: 'Fertilizer Injector',
        icon: FlaskConical,
        iconColor: '#8B5CF6',
        iconBg: '#F3E8FF',
        iconBorder: '#DDD6FE',
        isOpenType: false,
        onColor: '#8B5CF6',
      },
      {
        key: 'pest_sprinkler',
        name: 'Pest Sprinkler',
        icon: BugIcon,
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        isOpenType: false,
        onColor: '#D97706',
      },
      {
        key: 'sprayer',
        name: 'Crop Sprayer',
        icon: SprayCan,
        iconColor: '#16A34A',
        iconBg: '#DCFCE7',
        iconBorder: '#BBF7D0',
        isOpenType: false,
        onColor: '#16A34A',
      },
    ],
  },
  {
    id: 'climate_control',
    title: 'CLIMATE CONTROL',
    headerIcon: Fan,
    headerColor: '#0D9488',
    headerBg: '#CCFBF1',
    headerBorder: '#99F6E4',
    headerDarkBg: 'rgba(13, 148, 136, 0.2)',
    headerDarkColor: '#2DD4BF',
    items: [
      {
        key: 'fan',
        name: 'Ventilation Fan',
        icon: Fan,
        iconColor: '#0D9488',
        iconBg: '#CCFBF1',
        iconBorder: '#99F6E4',
        isOpenType: false,
        onColor: '#0D9488',
      },
      {
        key: 'fogger',
        name: 'Mist / Fogger',
        icon: CloudFog,
        iconColor: '#6366F1',
        iconBg: '#EEF2FF',
        iconBorder: '#C7D2FE',
        isOpenType: false,
        onColor: '#6366F1',
      },
    ],
  },
  {
    id: 'lighting',
    title: 'LIGHTING',
    headerIcon: Lightbulb,
    headerColor: '#D97706',
    headerBg: '#FEF3C7',
    headerBorder: '#FDE68A',
    headerDarkBg: 'rgba(217, 119, 6, 0.2)',
    headerDarkColor: '#FBBF24',
    items: [
      {
        key: 'light',
        name: 'Grow Lights',
        icon: Lightbulb,
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        isOpenType: false,
        onColor: '#D97706',
      },
      {
        key: 'flood_light',
        name: 'Field Flashlight',
        icon: Flashlight,
        iconColor: '#B45309',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        isOpenType: false,
        onColor: '#D97706',
      },
    ],
  },
  {
    id: 'emergency',
    title: 'SECURITY',
    headerIcon: Shield,
    headerColor: '#2563EB',
    headerBg: '#EFF6FF',
    headerBorder: '#BFDBFE',
    headerDarkBg: 'rgba(37, 99, 235, 0.2)',
    headerDarkColor: '#60A5FA',
    items: [
      {
        key: 'siren',
        name: 'Siren',
        icon: SirenIcon,
        iconColor: '#DC2626',
        iconBg: '#FEE2E2',
        iconBorder: '#FECACA',
        isOpenType: false,
        onColor: '#DC2626',
      },
      {
        key: 'camera',
        name: 'Camera',
        icon: Camera,
        iconColor: '#3B82F6',
        iconBg: '#EFF6FF',
        iconBorder: '#BFDBFE',
        isOpenType: false,
        onColor: '#3B82F6',
      },
    ],
  },
  {
    id: 'system_display',
    title: 'SYSTEM DISPLAY',
    headerIcon: Monitor,
    headerColor: '#8B5CF6',
    headerBg: '#F3E8FF',
    headerBorder: '#DDD6FE',
    headerDarkBg: 'rgba(139, 92, 246, 0.2)',
    headerDarkColor: '#A78BFA',
    items: [
      {
        key: 'display',
        name: 'OLED Display',
        icon: Monitor,
        iconColor: '#8B5CF6',
        iconBg: '#F3E8FF',
        iconBorder: '#DDD6FE',
        readOnly: true, // 🔒 No manual control - strictly driven by firmware code!
        onColor: '#8B5CF6',
      },
    ],
  },
];

// ─── DEFAULT ACTUATOR STATES (ALL BUTTONS OFF BY DEFAULT) ────────────────────
const INITIAL_ACTUATORS_STATE = {
  pump: { state: false, statusText: 'OFF' },
  valve: { state: false, statusText: 'CLOSED' },
  fertilizer: { state: false, statusText: 'OFF' },
  pest_sprinkler: { state: false, statusText: 'OFF' },
  sprayer: { state: false, statusText: 'OFF' },
  fan: { state: false, statusText: 'OFF' },
  fogger: { state: false, statusText: 'OFF' },
  light: { state: false, statusText: 'OFF' },
  flood_light: { state: false, statusText: 'OFF' },
  siren: { state: false, statusText: 'OFF' },
  camera: { state: false, statusText: 'OFF' },
};

// ─── HIGH-CONSEQUENCE PHYSICAL ACTUATOR SAFETY CONFIGURATION ────────────────
const HIGH_CONSEQUENCE_ACTUATORS = {
  pump: {
    title: 'Start Water Pump?',
    warning: 'This will start water pumping into the irrigation line.',
    actionLabel: 'Start Pump'
  },
  valve: {
    title: 'Open Main Valve?',
    warning: 'This will open the main irrigation water valve.',
    actionLabel: 'Open Valve'
  },
  fertilizer: {
    title: 'Start Fertilizer Injector?',
    warning: 'This will start fertilizer dosing into the irrigation line.',
    actionLabel: 'Start Injector'
  },
  pest_sprinkler: {
    title: 'Start Pest Sprinkler?',
    warning: 'This will start pest control spraying across the field.',
    actionLabel: 'Start Sprinkler'
  },
  sprayer: {
    title: 'Start Crop Sprayer?',
    warning: 'This will start foliar spraying across the crop area.',
    actionLabel: 'Start Sprayer'
  },
  fan: {
    title: 'Start Ventilation Fan?',
    warning: 'This will activate the field ventilation fan system.',
    actionLabel: 'Start Fan'
  },
  fogger: {
    title: 'Start Mist / Fogger?',
    warning: 'This will start the mist fogger for humidity control.',
    actionLabel: 'Start Fogger'
  },
  light: {
    title: 'Turn On Grow Lights?',
    warning: 'This will power on the grow light array.',
    actionLabel: 'Turn On'
  },
  flood_light: {
    title: 'Turn On Field Flashlight?',
    warning: 'This will power on the field flood lighting.',
    actionLabel: 'Turn On'
  },
  siren: {
    title: 'Activate Siren?',
    warning: 'This will trigger the security siren alert.',
    actionLabel: 'Activate Siren'
  },
  camera: {
    title: 'Enable Camera?',
    warning: 'This will turn on the field security camera.',
    actionLabel: 'Enable Camera'
  },
};


// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ActuatorControl = () => {
  const { mqttStatus, sensorData } = useTelemetry();
  const { isDarkMode, toggleActuator, actuators: globalActuators } = useApp();
  const isOnline = mqttStatus === 'connected';

  // Check if physical firmware code reports active OLED hardware
  const isOledActiveFromCode = sensorData?.soil?.oledActive === 1 || sensorData?.hardware?.display === 'ACTIVE';

  const [isEmergencyHalt, setIsEmergencyHalt] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const navigate = useNavigate();

  const isWaterlogged = useMemo(() => {
    return detectWaterlogging(sensorData?.soil?.moisture, sensorData?.weather?.rainLevel);
  }, [sensorData?.soil?.moisture, sensorData?.weather?.rainLevel]);

  // Convert AppContext flat actuators map { PUMP: true, FAN: false, ... }
  // into the UI format this component expects: { pump: { state: true, statusText: 'ON' }, ... }
  const actuators = useMemo(() => {
    const g = globalActuators || {};
    const toState = (key, isOpenType) => {
      const on = Boolean(g[key.toUpperCase()] || g[key]);
      return { state: on, statusText: isOpenType ? (on ? 'OPEN' : 'CLOSED') : (on ? 'ON' : 'OFF') };
    };
    return {
      pump:           toState('pump', false),
      valve:          toState('valve', true),
      fertilizer:     toState('fertilizer', false),
      pest_sprinkler: toState('pest_sprinkler', false),
      sprayer:        toState('sprayer', false),
      fan:            toState('fan', false),
      fogger:         toState('fogger', false),
      light:          toState('light', false),
      flood_light:    toState('flood_light', false),
      siren:          toState('siren', false),
      camera:         toState('camera', false),
      display:        { state: isOledActiveFromCode, statusText: isOledActiveFromCode ? 'ON' : 'OFF' },
    };
  }, [globalActuators, isOledActiveFromCode]);

  const executeToggle = (key, isOpenType) => {
    setIsEmergencyHalt(false);
    if (toggleActuator) {
      toggleActuator(key.toUpperCase());
    }
  };


  const handleToggle = (key, isOpenType) => {
    const currentState = actuators[key]?.state || false;

    // If turning ON and hardware MQTT is disconnected, show offline modal notification
    if (!currentState && !isOnline) {
      const config = HIGH_CONSEQUENCE_ACTUATORS[key];
      const targetName = config?.title 
        ? config.title.replace('?', '').replace('Start ', '').replace('Turn On ', '').replace('Open ', '').replace('Activate ', '').replace('Enable ', '') 
        : key;
      setPendingConfirmation({
        key,
        isOpenType,
        isHardwareOffline: true,
        title: 'Hardware Offline',
        warning: `Cannot activate ${targetName}. The field controller is not connected to the MQTT stream. Please ensure your ESP32 hardware node is powered on and connected.`,
        actionLabel: 'Understood'
      });
      return;
    }

    // If turning ON and actuator has confirmation configured, prompt for confirmation
    if (!currentState && HIGH_CONSEQUENCE_ACTUATORS[key]) {
      setPendingConfirmation({
        key,
        isOpenType,
        ...HIGH_CONSEQUENCE_ACTUATORS[key]
      });
      return;
    }
    executeToggle(key, isOpenType);
  };

  const handleEmergencyStop = () => {
    setPendingConfirmation({
      title: 'Emergency Stop All?',
      warning: 'This will immediately shut down all irrigation pumps, valves, and field actuators.',
      actionLabel: 'Stop All',
      isEmergency: true,
    });
  };

  const handleEmergencyToggle = () => {
    if (!isEmergencyHalt) {
      handleEmergencyStop();
    } else {
      setIsEmergencyHalt(false);
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
      {/* ⚠️ High-Visibility Waterlogging Banner */}
      {isWaterlogged && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 18,
          background: isDarkMode ? 'rgba(220, 38, 38, 0.15)' : '#FEE2E2',
          border: '1.5px solid #EF4444',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 14
        }}>
          <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#DC2626' }}>
              WATERLOGGING CRITICAL ALERT: Soil Saturation {sensorData?.soil?.moisture ? `${sensorData.soil.moisture}%` : 'High'}
            </div>
            <div style={{ fontSize: '0.72rem', color: isDarkMode ? '#FCA5A5' : '#991B1B', fontWeight: 600, marginTop: 2 }}>
              All irrigation halted. Immediately open boundary bunds and drainage outlets to prevent root asphyxiation.
            </div>
          </div>
        </div>
      )}


      {/* ── 5 CATEGORY SECTION CONTAINERS ──────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ACTUATOR_CATEGORIES.map((category) => {
          const CatIcon = category.headerIcon;

          return (
            <div
              key={category.id}
              className="settings-section-container"
              style={{
                background: 'var(--bg-sheet)',
                borderRadius: 22,
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6',
                padding: '14px 14px 10px',
                transition: 'background-color 0.18s ease, border-color 0.18s ease',
              }}
            >
              {/* Category Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                {/* Left: Icon + Title + Description */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: isDarkMode ? category.headerDarkBg : category.headerBg,
                      border: isDarkMode ? `1px solid ${category.headerDarkColor}55` : `1px solid ${category.headerBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CatIcon size={20} color={isDarkMode ? category.headerDarkColor : category.headerColor} strokeWidth={2.3} />
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.02rem',
                        fontWeight: 800,
                        color: isDarkMode ? '#F8FAFC' : '#101828',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {category.title}
                    </h3>
                  </div>
                </div>
              </div>


              {/* Actuator Rows Stack inside Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {category.items.map((item) => {
                  const ItemIcon = item.icon;
                  const isDisplayItem = item.key === 'display' || item.readOnly;
                  const act = actuators[item.key] || { state: false, statusText: item.isOpenType ? 'CLOSED' : 'OFF' };
                  const isActive = isDisplayItem ? isOledActiveFromCode : act.state;
                  const currentStatusText = isDisplayItem
                    ? (isOledActiveFromCode ? 'ON' : 'OFF')
                    : (act.statusText || (item.isOpenType ? (isActive ? 'OPEN' : 'CLOSED') : (isActive ? 'ON' : 'OFF')));

                  return (
                    <motion.div
                      key={item.key}
                      className="settings-card-item"
                      whileTap={{ scale: item.readOnly ? 1 : 0.99 }}
                      onClick={() => !item.readOnly && handleToggle(item.key, item.isOpenType)}
                      style={{
                        background: 'var(--bg-card)',
                        borderRadius: 16,
                        border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6',
                        boxShadow: isDarkMode ? '0 2px 6px rgba(0, 0, 0, 0.15)' : '0 1px 4px rgba(0, 0, 0, 0.02)',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: item.readOnly ? 'default' : 'pointer',
                        transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
                      }}
                    >
                      {/* Left Side: Icon Container + Name + Status Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Rounded-square Icon Container */}
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : item.iconBg,
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${item.iconBorder}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <ItemIcon size={19} color={item.iconColor} strokeWidth={2.2} />
                        </div>

                        {/* Actuator Name */}
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.94rem',
                            fontWeight: 700,
                            color: isDarkMode ? '#F8FAFC' : '#101828',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.2,
                          }}
                        >
                          {item.name}
                        </p>
                      </div>

                      {/* Right Side: Smooth Toggle Switch */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!item.readOnly) {
                              handleToggle(item.key, item.isOpenType);
                            }
                          }}
                          aria-label={item.readOnly ? `${item.name} status: ${isActive ? 'ON' : 'OFF'}` : `Toggle ${item.name}`}
                          style={{
                            width: 52,
                            height: 30,
                            borderRadius: 100,
                            background: isActive 
                              ? (item.onColor || '#18A66A') 
                              : (isDarkMode ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1'),
                            border: 'none',
                            padding: 3,
                            cursor: item.readOnly ? 'default' : 'pointer',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            outline: 'none',
                            flexShrink: 0,
                            transition: 'background-color 0.2s ease',
                          }}
                        >
                          {/* Circular Thumb */}
                          <motion.div
                            animate={{ x: isActive ? 22 : 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: '#FFFFFF',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                            }}
                          />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Redirection Short Link to Automatic Irrigation Control Screen */}
              {category.id === 'irrigation' && (
                <motion.div
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/irrigation')}
                  style={{
                    marginTop: 10,
                    background: isDarkMode ? 'rgba(2, 132, 199, 0.08)' : 'rgba(224, 242, 254, 0.55)',
                    borderRadius: 14,
                    border: isDarkMode ? '1px dashed rgba(56, 189, 248, 0.35)' : '1px dashed #BAE6FD',
                    padding: '11px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background-color 0.18s ease, border-color 0.18s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: isDarkMode ? 'rgba(56, 189, 248, 0.16)' : '#E0F2FE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isDarkMode ? '#38BDF8' : '#0284C7',
                        flexShrink: 0,
                      }}
                    >
                      <ArrowRight size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: isDarkMode ? '#38BDF8' : '#0369A1' }}>
                        Automatic Irrigation Control
                      </div>
                      <div style={{ fontSize: '0.72rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                        Set smart schedule timers & moisture triggers
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: isDarkMode ? '#38BDF8' : '#0284C7',
                    }}
                  >
                    <span>Open</span>
                    <ChevronRight size={14} />
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── EMERGENCY STOP CARD (MATCHING CARD DESIGN) ────────────────────── */}
      <div
        className="settings-section-container"
        style={{
          marginTop: 18,
          background: isDarkMode ? 'rgba(239, 68, 68, 0.06)' : '#FEF2F2',
          borderRadius: 22,
          border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.22)' : '1px solid #FEE2E2',
          padding: '14px 14px 10px',
          transition: 'background-color 0.18s ease, border-color 0.18s ease',
        }}
      >
        <motion.div
          className="settings-card-item"
          whileTap={{ scale: 0.98 }}
          onClick={handleEmergencyStop}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #FDA29B',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(239, 68, 68, 0.08)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
          }}
        >
          {/* Left Side: Icon Container + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color="#DC2626" strokeWidth={2.4} />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '0.94rem',
                fontWeight: 800,
                color: isDarkMode ? '#FCA5A5' : '#991B1B',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              Emergency Stop (All Actuators)
            </p>
          </div>

          {/* Right Side: Toggle Switch (Same design as other cards) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEmergencyToggle();
              }}
              aria-label="Toggle Emergency Stop"
              style={{
                width: 52,
                height: 30,
                borderRadius: 100,
                background: isEmergencyHalt 
                  ? '#EF4444' 
                  : (isDarkMode ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1'),
                border: 'none',
                padding: 3,
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                outline: 'none',
                flexShrink: 0,
                transition: 'background-color 0.2s ease',
              }}
            >
              {/* Circular Thumb */}
              <motion.div
                animate={{ x: isEmergencyHalt ? 22 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ⚠️ SIMPLE ACTUATOR CONFIRMATION MODAL */}
      <AnimatePresence>
        {pendingConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              backdropFilter: 'blur(5px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setPendingConfirmation(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              style={{
                background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                borderRadius: 20,
                padding: '24px 22px 20px',
                maxWidth: 380,
                width: '100%',
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isDarkMode 
                  ? '0 20px 40px -10px rgba(0, 0, 0, 0.6)' 
                  : '0 20px 35px -8px rgba(0, 0, 0, 0.15)',
                boxSizing: 'border-box'
              }}
            >
              {/* Header with Fluid Reaction Motion SVG Icon + Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <motion.div
                  initial={{ scale: 0.7, rotate: -12 }}
                  animate={{ scale: [0.7, 1.12, 1], rotate: [-12, 4, 0] }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    background: isDarkMode 
                      ? (pendingConfirmation.isEmergency || pendingConfirmation.isHardwareOffline ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.16)') 
                      : (pendingConfirmation.isEmergency || pendingConfirmation.isHardwareOffline ? '#FEE2E2' : '#FEF3C7'),
                    border: isDarkMode 
                      ? (pendingConfirmation.isEmergency || pendingConfirmation.isHardwareOffline ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.35)') 
                      : (pendingConfirmation.isEmergency || pendingConfirmation.isHardwareOffline ? '1px solid #FECACA' : '1px solid #FDE68A'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: (pendingConfirmation.isEmergency || pendingConfirmation.isHardwareOffline) ? '#DC2626' : '#D97706',
                    flexShrink: 0,
                    boxShadow: isDarkMode 
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                      : '0 2px 8px rgba(245, 158, 11, 0.16)',
                  }}
                >
                  <AlertTriangle size={22} strokeWidth={2.4} />
                </motion.div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    color: isDarkMode ? '#F8FAFC' : '#101828',
                    lineHeight: 1.25,
                  }}
                >
                  {pendingConfirmation.title}
                </h3>
              </div>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.9rem',
                  color: isDarkMode ? '#94A3B8' : '#475569',
                  lineHeight: 1.5,
                  margin: '0 0 22px 0'
                }}
              >
                {pendingConfirmation.warning}
              </p>

              {/* Action Buttons */}
              {pendingConfirmation.isHardwareOffline ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setPendingConfirmation(null)}
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#1E293B',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    Understood
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setPendingConfirmation(null)}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                      color: isDarkMode ? '#F8FAFC' : '#334155',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (pendingConfirmation.isEmergency) {
                        // Turn off every actuator that is currently ON in global state
                        ACTUATOR_CATEGORIES.forEach(cat => {
                          cat.items.forEach(item => {
                            if (!item.readOnly) {
                              const key = item.key.toUpperCase();
                              const isOn = Boolean(
                                (globalActuators || {})[key] ||
                                (globalActuators || {})[item.key]
                              );
                              if (isOn && toggleActuator) {
                                toggleActuator(key);
                              }
                            }
                          });
                        });
                        setIsEmergencyHalt(true);

                      } else {
                        const { key, isOpenType } = pendingConfirmation;
                        executeToggle(key, isOpenType);
                      }
                      setPendingConfirmation(null);
                    }}
                    style={{
                      flex: 1.2,
                      height: 42,
                      borderRadius: 12,
                      background: pendingConfirmation.isEmergency ? '#DC2626' : '#16A34A',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: pendingConfirmation.isEmergency
                        ? '0 4px 12px rgba(220, 38, 38, 0.28)'
                        : '0 4px 12px rgba(22, 163, 74, 0.28)',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    {pendingConfirmation.actionLabel}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActuatorControl;

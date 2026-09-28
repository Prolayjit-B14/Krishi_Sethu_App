import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { useTelemetry } from '../../state/TelemetryContext';
import { 
  Bell, Sun, Moon,
  ChevronRight, ChevronDown, ChevronUp, Trash2, Download, Check, Globe,
  Thermometer, Clock, Volume2, HardDrive, Cpu, Lock, X,
  BellRing, Sliders, Droplets, ShieldAlert, KeyRound, Mail, Radio, Server,
  ArrowDown, ArrowUp, Smartphone, Gauge, Timer, PlayCircle, StopCircle,
  ShieldCheck, FileText,
  Info, BookOpen, Code2, Users, ExternalLink, Sprout, AlertTriangle, HelpCircle
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, isDarkMode, toggleTheme, resetPassword, farmInfo, updateBranding, deleteAccount } = useApp();
  const { lastGlobalUpdate, devices } = useTelemetry();

  // Settings State (Loaded from localStorage or farmInfo defaults)
  const [units, setUnits] = useState(() => localStorage.getItem('krishi_sethu_units') || 'Metric (°C, %, mm)');
  const [language, setLanguage] = useState(() => localStorage.getItem('krishi_sethu_language') || 'English');
  const [refreshInterval, setRefreshInterval] = useState(() => localStorage.getItem('krishi_sethu_refresh') || '5 seconds');
  const [offlineMode, setOfflineMode] = useState(() => {
    const saved = localStorage.getItem('krishi_sethu_offline_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [pushNotifications, setPushNotifications] = useState(() => {
    const saved = localStorage.getItem('krishi_sethu_push_notifications');
    return saved !== null ? saved === 'true' : true;
  });
  const [alertSounds, setAlertSounds] = useState(() => {
    const saved = localStorage.getItem('krishi_sethu_alert_sounds');
    return saved !== null ? saved === 'true' : true;
  });

  // Alert & Automation Preferences
  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_sethu_alerts');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return farmInfo?.alerts || {
      lowRangeAlert: true,
      highRangeAlert: true,
      criticalAlert: true,
      alertDelay: '30 sec',
      pushNotification: true
    };
  });

  const [automation, setAutomation] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_sethu_automation');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return farmInfo?.automation || {
      autoIrrigation: true,
      useSoilMoistureThreshold: true,
      pumpStartThreshold: 40,
      pumpStopThreshold: 70
    };
  });

  // Sensor Calibration Ranges
  const [sensorRanges, setSensorRanges] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_sethu_sensor_ranges');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return farmInfo?.sensorRanges || {
      soilMoisture:    { min: 30,   max: 80    },
      soilTemperature: { min: 15,   max: 35    },
      soilPh:          { min: 5.5,  max: 7.5   },
      airTemperature:  { min: 10,   max: 40    },
      humidity:        { min: 40,   max: 90    },
      light:           { min: 1000, max: 80000 },
      rainfall:        { min: 0,    max: 50    },
      nitrogen:        { min: 40,   max: 60    },
      phosphorus:      { min: 20,   max: 40    },
      potassium:       { min: 30,   max: 50    },
      npk:             { min: 10,   max: 300   }
    };
  });

  const handleSensorRangeChange = (key, field, val) => {
    setSensorRanges(prev => {
      const updated = {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [field]: val
        }
      };
      if (["nitrogen", "phosphorus", "potassium"].includes(key)) {
        const nMin = key === "nitrogen" && field === "min" ? val : (updated.nitrogen?.min ?? 40);
        const pMin = key === "phosphorus" && field === "min" ? val : (updated.phosphorus?.min ?? 20);
        const kMin = key === "potassium" && field === "min" ? val : (updated.potassium?.min ?? 30);
        const nMax = key === "nitrogen" && field === "max" ? val : (updated.nitrogen?.max ?? 60);
        const pMax = key === "phosphorus" && field === "max" ? val : (updated.phosphorus?.max ?? 40);
        const kMax = key === "potassium" && field === "max" ? val : (updated.potassium?.max ?? 50);
        updated.npk = {
          min: Math.min(nMin, pMin, kMin),
          max: Math.max(nMax, pMax, kMax),
        };
      }
      try {
        localStorage.setItem('krishi_sethu_sensor_ranges', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Automatic real-time saving (no manual save button needed)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Persist immediately to localStorage
    try {
      localStorage.setItem('krishi_sethu_units', units);
      localStorage.setItem('krishi_sethu_language', language);
      localStorage.setItem('krishi_sethu_refresh', refreshInterval);
      localStorage.setItem('krishi_sethu_offline_mode', String(offlineMode));
      localStorage.setItem('krishi_sethu_push_notifications', String(pushNotifications));
      localStorage.setItem('krishi_sethu_alert_sounds', String(alertSounds));
      localStorage.setItem('krishi_sethu_alerts', JSON.stringify(alerts));
      localStorage.setItem('krishi_sethu_automation', JSON.stringify(automation));
      localStorage.setItem('krishi_sethu_sensor_ranges', JSON.stringify(sensorRanges));
    } catch (err) {
      console.warn("Auto-save storage note:", err);
    }

    // Debounced sync with global farm state
    const timer = setTimeout(() => {
      try {
        if (typeof updateBranding === 'function') {
          updateBranding({
            ...farmInfo,
            alerts,
            automation,
            refreshInterval,
            offlineMode,
            sensorRanges
          });
        }
      } catch (err) {
        console.warn("Auto-save sync note:", err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [units, language, refreshInterval, offlineMode, pushNotifications, alertSounds, alerts, automation, sensorRanges]);

  // Dropdowns & State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeletingAccount(true);
    try {
      if (deleteAccount) {
        await deleteAccount();
      }
      navigate('/login');
    } catch (err) {
      console.warn("Delete account error:", err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  const [cacheCleared, setCacheCleared] = useState(false);
  const handleClearCache = () => {
    try {
      localStorage.clear();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 2500);
    } catch (e) {
      console.warn("Clear cache note:", e);
    }
  };

  const handleExportData = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      units,
      language,
      refreshInterval,
      offlineCacheEnabled: offlineMode,
      activeDevices: Object.keys(devices || {}),
      lastGlobalUpdate,
      alerts,
      automation,
      sensorRanges
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishi_sethu_telemetry_settings_${Date.now()}.json`;
    a.click();
  };

  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    setIsSaving(true);
    try {
      await resetPassword(user.email);
      setPasswordResetSent(true);
      setTimeout(() => {
        setPasswordResetSent(false);
      }, 3500);
    } catch (err) {
      console.warn("Reset error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reusable 48x28mm Toggle Switch Component
  const ToggleSwitch = ({ active, onToggle, onColor = '#10B981', ariaLabel = 'Toggle switch', thumbContent = null }) => (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={ariaLabel}
      style={{
        width: 48,
        height: 28,
        borderRadius: 100,
        background: active 
          ? onColor 
          : (isDarkMode ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1'),
        border: 'none',
        padding: 2.5,
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        outline: 'none',
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: 23,
          height: 23,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: active ? 'translateX(20px)' : 'translateX(0px)'
        }}
      >
        {thumbContent}
      </div>
    </button>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      minHeight: '100%',
      gap: 18,
      transition: 'background-color 0.18s ease, color 0.18s ease'
    }}>
      {/* ─── 1. GENERAL ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 0 4px',
          transition: 'color 0.18s ease'
        }}>
          GENERAL
        </h3>

        <div 
          className="settings-section-container"
          style={{
            background: 'var(--bg-sheet)',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.18s ease, border-color 0.18s ease'
          }}
        >
          {/* Theme */}
          <div 
            className="settings-card-item"
            style={{
              background: 'var(--bg-card)',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isDarkMode ? (
                  <Moon size={19} color="#FBBF24" strokeWidth={2.2} />
                ) : (
                  <Sun size={19} color="#D97706" strokeWidth={2.2} />
                )}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Theme
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              style={{
                cursor: 'pointer',
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                outline: 'none',
                flexShrink: 0
              }}
            >
              {isDarkMode ? (
                <Sun size={19} color="#FBBF24" strokeWidth={2.4} />
              ) : (
                <Moon size={19} color="#15803D" strokeWidth={2.4} />
              )}
            </button>
          </div>

          {/* Language */}
          <div style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 16,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
                border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #C7D2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Globe size={19} color="#6366F1" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Language
              </div>
            </div>

            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
              EN-US
            </span>
          </div>

          {/* Unit Settings */}
          <div style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 16,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(13, 148, 136, 0.16)' : '#CCFBF1',
                border: isDarkMode ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #99F6E4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Thermometer size={19} color="#0D9488" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Unit Settings
              </div>
            </div>

            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isDarkMode ? '#94A3B8' : '#64748B' }}>
              Metric (°C)
            </span>
          </div>

          {/* Data Refresh Interval */}
          <div
            onClick={() => {
              const next = refreshInterval === '5 seconds' ? '10 seconds' : refreshInterval === '10 seconds' ? '30 seconds' : '5 seconds';
              setRefreshInterval(next);
            }}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#E8F5E9',
                border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #C8E6C9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={19} color="#10B981" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Data Refresh Interval
              </div>
            </div>

            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              color: isDarkMode ? '#4ADE80' : '#15803D',
              background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
              padding: '4px 10px',
              borderRadius: 8
            }}>
              {refreshInterval}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. ACCOUNT & SECURITY ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 0 4px'
        }}>
          ACCOUNT & SECURITY
        </h3>

        <div 
          className="settings-section-container"
          style={{
            background: 'var(--bg-sheet)',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.18s ease, border-color 0.18s ease'
          }}
        >
          {/* Security & Login */}
          <div
            onClick={() => setIsSecurityOpen(v => !v)}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: isSecurityOpen ? '16px 16px 0 0' : 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'border-radius 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : '#F3E8FF',
                border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #E9D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Lock size={19} color="#8B5CF6" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Security & Login
              </div>
            </div>

            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkMode ? '#64748B' : '#94A3B8'
            }}>
              <ChevronDown 
                size={18} 
                strokeWidth={2.4} 
                style={{ 
                  transform: isSecurityOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </div>
          </div>

          {/* Inline Dropdown: Security & Login */}
          {isSecurityOpen && (
            <div style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: '0 0 16px 16px',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              borderTop: isDarkMode ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px dashed #E2E8F0',
              boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: -8
            }}>
              {/* Account Email (Single Line) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 14,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : '#F3E8FF',
                    border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #E9D5FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Mail size={17} color="#8B5CF6" strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    {user?.email || 'Registered Operator'}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#10B981',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: isDarkMode ? 'rgba(16, 185, 129, 0.14)' : '#DCFCE7'
                }}>Active</span>
              </div>

              {/* Password Recovery Email (Single Line) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 14,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(21, 128, 61, 0.16)' : '#DCFCE7',
                    border: isDarkMode ? '1px solid rgba(21, 128, 61, 0.3)' : '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <KeyRound size={17} color="#15803D" strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    Recovery Email
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleSendResetPassword} 
                  disabled={isSaving} 
                  style={{
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 8,
                    background: passwordResetSent ? '#10B981' : '#15803D',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: isSaving ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)',
                    flexShrink: 0,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Mail size={13} strokeWidth={2.4} />
                  <span>{isSaving ? 'Sending...' : passwordResetSent ? 'Sent!' : 'Send Email'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Connected Accounts */}
          <div
            onClick={() => setIsAccountsOpen(v => !v)}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: isAccountsOpen ? '16px 16px 0 0' : 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'border-radius 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
                border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Globe size={19} color="#0284C7" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Connected Accounts
              </div>
            </div>

            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkMode ? '#64748B' : '#94A3B8'
            }}>
              <ChevronDown 
                size={18} 
                strokeWidth={2.4} 
                style={{ 
                  transform: isAccountsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </div>
          </div>

          {/* Inline Dropdown: Connected Accounts */}
          {isAccountsOpen && (
            <div style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: '0 0 16px 16px',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              borderTop: isDarkMode ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px dashed #E2E8F0',
              boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginTop: -8
            }}>
              {/* Google Account */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 14,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.33 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                    Google Account
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#10B981',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: isDarkMode ? 'rgba(16, 185, 129, 0.14)' : '#DCFCE7'
                }}>Connected</span>
              </div>

              {/* MQTT Account */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 14,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
                    border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Server size={17} color="#0284C7" strokeWidth={2.2} />
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                    MQTT Account
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#10B981',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: isDarkMode ? 'rgba(16, 185, 129, 0.14)' : '#DCFCE7'
                }}>Active</span>
              </div>
            </div>
          )}

          {/* Delete Account & Data */}
          <div
            onClick={() => setIsDeleteModalOpen(true)}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(148, 163, 184, 0.16)' : '#F1F5F9',
                border: isDarkMode ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Trash2 size={19} color={isDarkMode ? '#CBD5E1' : '#64748B'} strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Delete Account & Data
              </div>
            </div>

            <ChevronRight size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
          </div>
        </div>
      </div>

      {/* ─── 3. DATA ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 0 4px'
        }}>
          DATA
        </h3>

        <div 
          className="settings-section-container"
          style={{
            background: 'var(--bg-sheet)',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.18s ease, border-color 0.18s ease'
          }}
        >
          {/* Export Farm Data */}
          <div
            onClick={handleExportData}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#E8F5E9',
                border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #C8E6C9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Download size={19} color="#10B981" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Export Farm Data
              </div>
            </div>

            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              color: isDarkMode ? '#4ADE80' : '#15803D',
              background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
              padding: '4px 10px',
              borderRadius: 8
            }}>
              Export
            </span>
          </div>

          {/* Clear Local Data */}
          <div
            onClick={handleClearCache}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(148, 163, 184, 0.16)' : '#F1F5F9',
                border: isDarkMode ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <HardDrive size={19} color={isDarkMode ? '#CBD5E1' : '#64748B'} strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Clear Local Data
              </div>
            </div>

            <span style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              color: isDarkMode ? '#94A3B8' : '#64748B',
              padding: '4px 10px',
              borderRadius: 8,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0'
            }}>
              {cacheCleared ? 'Cleared' : 'Clear'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. NOTIFICATIONS ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 0 4px'
        }}>
          NOTIFICATIONS
        </h3>

        <div 
          className="settings-section-container"
          style={{
            background: 'var(--bg-sheet)',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.18s ease, border-color 0.18s ease'
          }}
        >
          {/* Push Notifications */}
          <div style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 16,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bell size={19} color="#F59E0B" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Push Notifications
              </div>
            </div>

            <ToggleSwitch
              active={pushNotifications}
              onToggle={() => setPushNotifications(v => !v)}
              onColor="#F59E0B"
              ariaLabel="Toggle Push Notifications"
            />
          </div>

          {/* Alert Sounds */}
          <div style={{
            background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
            borderRadius: 16,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
                border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Volume2 size={19} color="#EF4444" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Alert Sounds
              </div>
            </div>

            <ToggleSwitch
              active={alertSounds}
              onToggle={() => setAlertSounds(v => !v)}
              onColor="#EF4444"
              ariaLabel="Toggle Alert Sounds"
            />
          </div>

          {/* Notification Settings Row */}
          <div
            onClick={() => setIsNotificationsOpen(v => !v)}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: isNotificationsOpen ? '16px 16px 0 0' : 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              borderBottom: isNotificationsOpen ? 'none' : undefined,
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(13, 148, 136, 0.16)' : '#CCFBF1',
                border: isDarkMode ? '1px solid rgba(13, 148, 136, 0.3)' : '1px solid #99F6E4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Bell size={19} color="#0D9488" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Notification Settings
              </div>
            </div>

            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isDarkMode ? '#64748B' : '#94A3B8'
            }}>
              <ChevronDown 
                size={18} 
                strokeWidth={2.4} 
                style={{ 
                  transform: isNotificationsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }} 
              />
            </div>
          </div>

          {/* Inline Dropdown: Notification Settings */}
          {isNotificationsOpen && (
            <div style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: '0 0 16px 16px',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              borderTop: isDarkMode ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px dashed #E2E8F0',
              boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginTop: -8
            }}>
              {/* Below Optimal Range */}
              <div style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                borderRadius: 14,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                    border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ArrowDown size={17} color="#F59E0B" strokeWidth={2.3} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    Below Optimal Range
                  </span>
                </div>
                <ToggleSwitch
                  active={alerts.lowRangeAlert}
                  onToggle={() => setAlerts(p => ({ ...p, lowRangeAlert: !p.lowRangeAlert }))}
                  onColor="#F59E0B"
                  ariaLabel="Below Optimal Range"
                />
              </div>

              {/* Above Optimal Range */}
              <div style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                borderRadius: 14,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(249, 115, 22, 0.16)' : '#FFEDD5',
                    border: isDarkMode ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid #FED7AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ArrowUp size={17} color="#F97316" strokeWidth={2.3} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    Above Optimal Range
                  </span>
                </div>
                <ToggleSwitch
                  active={alerts.highRangeAlert}
                  onToggle={() => setAlerts(p => ({ ...p, highRangeAlert: !p.highRangeAlert }))}
                  onColor="#F97316"
                  ariaLabel="Above Optimal Range"
                />
              </div>

              {/* Critical Alert */}
              <div style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                borderRadius: 14,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
                    border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={17} color="#EF4444" strokeWidth={2.3} />
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                    Critical Alert
                  </span>
                </div>
                <ToggleSwitch
                  active={alerts.criticalAlert}
                  onToggle={() => setAlerts(p => ({ ...p, criticalAlert: !p.criticalAlert }))}
                  onColor="#EF4444"
                  ariaLabel="Critical Alert"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── 5. LEGAL & PRIVACY ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 0 4px'
        }}>
          LEGAL AND COMPLIANCE
        </h3>

        <div 
          className="settings-section-container"
          style={{
            background: 'var(--bg-sheet)',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.18s ease, border-color 0.18s ease'
          }}
        >
          {/* Privacy Policy */}
          <div
            onClick={() => navigate('/privacy-policy')}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7',
                border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheck size={19} color="#10B981" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Privacy Policy
              </div>
            </div>

            <ChevronRight size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
          </div>

          {/* Terms and Conditions */}
          <div
            onClick={() => navigate('/terms')}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
                border: isDarkMode ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #BAE6FD',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <FileText size={19} color="#0284C7" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Terms and Conditions
              </div>
            </div>

            <ChevronRight size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
          </div>

          {/* Agricultural Disclaimer */}
          <div
            onClick={() => navigate('/disclaimer')}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
                border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={19} color="#D97706" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Agricultural Disclaimer
              </div>
            </div>

            <ChevronRight size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
          </div>
        </div>
      </div>

      {/* ─── 6. HELP & SUPPORT ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 0 4px'
        }}>
          HELP AND SUPPORT
        </h3>

        <div 
          className="settings-section-container"
          style={{
            background: 'var(--bg-sheet)',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.18s ease, border-color 0.18s ease'
          }}
        >
          {/* FAQ */}
          <div
            onClick={() => navigate('/faq')}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(139, 92, 246, 0.16)' : '#F3E8FF',
                border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #E9D5FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <HelpCircle size={19} color="#8B5CF6" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                FAQ
              </div>
            </div>

            <ChevronRight size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
          </div>

          {/* Contact Us */}
          <div
            onClick={() => navigate('/contact-us')}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(99, 102, 241, 0.16)' : '#EEF2FF',
                border: isDarkMode ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid #C7D2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={19} color="#6366F1" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                Contact Us
              </div>
            </div>

            <ChevronRight size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
          </div>
        </div>
      </div>

      {/* ─── 7. ABOUT ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#94A3B8' : '#64748B',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 0 4px'
        }}>
          ABOUT
        </h3>

        <div 
          className="settings-section-container"
          style={{
            background: 'var(--bg-sheet)',
            borderRadius: 22,
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E5EAE6',
            padding: '12px 12px 6px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            transition: 'background-color 0.18s ease, border-color 0.18s ease'
          }}
        >
          {/* About KrishiSethu */}
          <div
            onClick={() => navigate('/about-us')}
            style={{
              background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
              borderRadius: 16,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #EAEFEA',
              boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.04)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7',
                border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sprout size={19} color="#10B981" strokeWidth={2.2} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isDarkMode ? '#F8FAFC' : '#101828' }}>
                About KrishiSethu
              </div>
            </div>

            <ChevronRight size={18} color={isDarkMode ? '#64748B' : '#94A3B8'} />
          </div>
        </div>
      </div>

      {/* ─── AGRICULTURAL DISCLAIMER MODAL (Moved to dedicated /disclaimer screen) ─── */}
      <AnimatePresence>
        {false && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              style={{
                width: '100%',
                maxWidth: 440,
                maxHeight: '85vh',
                overflowY: 'auto',
                background: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: 24,
                border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
                padding: '24px 20px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D97706'
                  }}>
                    <AlertTriangle size={22} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      Agricultural Disclaimer
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      Advisory & Decision-Support Guidelines
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDisclaimerOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: 'none',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    color: isDarkMode ? '#94A3B8' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                fontSize: '0.84rem',
                color: isDarkMode ? '#CBD5E1' : '#475569',
                lineHeight: 1.55,
                marginBottom: 20
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
                  border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #FDE68A',
                  color: isDarkMode ? '#FDE68A' : '#92400E',
                  fontWeight: 600,
                  fontSize: '0.82rem'
                }}>
                  KrishiSethu provides real-time sensor analytics and automated insights solely for agricultural decision support.
                </div>
                <p style={{ margin: 0 }}>
                  Sensor readings (moisture, temperature, pH, NPK) are subject to probe depth, soil compaction, salinity levels, and environmental conditions. Autonomous irrigation triggers and dosage estimations should be evaluated against on-ground observations.
                </p>
                <p style={{ margin: 0 }}>
                  Always consult with regional Krishi Vigyan Kendra (KVK) agronomists, university extension specialists, or certified agricultural officers before undertaking large-scale crop protection, nutrient administration, or capital investments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsDisclaimerOpen(false)}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 12,
                  background: '#15803D',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(21, 128, 61, 0.35)'
                }}
              >
                Understood
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── FAQ MODAL (Moved to dedicated /faq screen) ─── */}
      <AnimatePresence>
        {false && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              style={{
                width: '100%',
                maxWidth: 480,
                maxHeight: '85vh',
                overflowY: 'auto',
                background: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: 24,
                border: isDarkMode ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid #E9D5FF',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
                padding: '24px 20px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#F3E8FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8B5CF6'
                  }}>
                    <HelpCircle size={22} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      FAQ
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      KrishiSethu Platform Guide
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFaqOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: 'none',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    color: isDarkMode ? '#94A3B8' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      style={{
                        borderRadius: 14,
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.035)' : '#F8FAFC',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
                        overflow: 'hidden'
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          gap: 10
                        }}
                      >
                        <span style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: isDarkMode ? '#F1F5F9' : '#1E293B'
                        }}>
                          {faq.q}
                        </span>
                        <ChevronDown
                          size={16}
                          color={isDarkMode ? '#94A3B8' : '#64748B'}
                          style={{
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                            flexShrink: 0
                          }}
                        />
                      </button>

                      {isOpen && (
                        <div style={{
                          padding: '0 14px 12px 14px',
                          fontSize: '0.8rem',
                          color: isDarkMode ? '#94A3B8' : '#64748B',
                          lineHeight: 1.5,
                          borderTop: isDarkMode ? '1px dashed rgba(255, 255, 255, 0.06)' : '1px dashed #E2E8F0',
                          paddingTop: 10
                        }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsFaqOpen(false)}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 12,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                  border: 'none',
                  color: isDarkMode ? '#E2E8F0' : '#475569',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── DELETE ACCOUNT & DATA CONFIRMATION MODAL ─────────────────── */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              style={{
                width: '100%',
                maxWidth: 400,
                background: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: 24,
                border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
                padding: '24px 20px',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EF4444'
                }}>
                  <AlertTriangle size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                    Permanent Data Deletion
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                    Irreversible action under Data Protection Guidelines
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: isDarkMode ? '#CBD5E1' : '#475569', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Are you sure you want to delete your account? All your personal profile records, farm configurations, and historical telemetry will be permanently wiped from both our cloud database and this device.
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingAccount}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 12,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    border: 'none',
                    color: isDarkMode ? '#E2E8F0' : '#475569',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingAccount}
                  style={{
                    flex: 1.3,
                    height: 42,
                    borderRadius: 12,
                    background: '#DC2626',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: isDeletingAccount ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 3px 10px rgba(220, 38, 38, 0.35)'
                  }}
                >
                  <Trash2 size={15} strokeWidth={2.4} />
                  <span>{isDeletingAccount ? "Erasing..." : "Erase Everything"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;

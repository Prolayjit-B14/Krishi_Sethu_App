import React, { useState } from 'react';
import { useApp } from '../../state/AppContext';
import {
  ChevronDown,
  Sparkles,
  Cpu,
  Wifi,
  Droplets,
  ShieldCheck,
  Bot
} from 'lucide-react';

const FAQ = () => {
  const { isDarkMode } = useApp();
  const [openIdx, setOpenIdx] = useState(0); // first item open by default

  const faqs = [
    {
      category: 'IoT and Sensors',
      icon: Cpu,
      iconColor: '#10B981',
      q: 'How does KrishiSethu collect soil and weather data?',
      a: 'KrishiSethu interfaces with ESP32 IoT nodes equipped with capacitive soil moisture probes, DHT22/SHT30 atmospheric sensors, and NPK testing sensors. Readings are sampled directly from your crop root zone in real time.'
    },
    {
      category: 'AI and Vision',
      icon: Sparkles,
      iconColor: '#F59E0B',
      q: 'How does AI crop disease detection work?',
      a: 'When you capture a leaf photo, an on-device computer vision model analyzes leaf discoloration, pustules, and fungal lesions against validated agricultural pathologies. Gemini reasoning then provides verified remedies and preventive steps.'
    },
    {
      category: 'Offline and Sync',
      icon: Wifi,
      iconColor: '#0EA5E9',
      q: 'Can I use KrishiSethu without internet in the field?',
      a: 'Yes. Sensor telemetry caches locally on your device, and core threshold rules (e.g., critical dry soil alerts) trigger without network access. Once an internet connection is established, logs automatically sync.'
    },
    {
      category: 'IoT and Sensors',
      icon: Droplets,
      iconColor: '#3B82F6',
      q: 'How are irrigation recommendations calculated?',
      a: 'Irrigation schedules evaluate root-zone volumetric water content, current crop growth phase, evapotranspiration rates, and forecasted rainfall to prevent both waterlogging and root moisture stress.'
    },
    {
      category: 'AI and Vision',
      icon: Bot,
      iconColor: '#8B5CF6',
      q: 'Does Krishi AI speak in regional languages?',
      a: 'Yes. Both Krishi AI and Farm Advisor support high-speed voice synthesis in English, Bengali (বাংলা), and Hindi (हिन्दी) for natural, hands-free field consultation.'
    },
    {
      category: 'Offline and Sync',
      icon: ShieldCheck,
      iconColor: '#14B8A6',
      q: 'Is my farm telemetry and location private?',
      a: 'Strictly private. Your soil data, photos, and location are stored securely for your farm management only. We do not use advertising trackers or sell farmer data to third parties.'
    }
  ];

  const cardStyle = {
    background: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderRadius: '16px',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
    boxShadow: isDarkMode ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.03)',
    boxSizing: 'border-box',
    overflow: 'hidden',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{
      padding: '16px 16px 40px',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          const Icon = faq.icon;

          return (
            <div key={idx} style={cardStyle}>
              {/* Question Header */}
              <div
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: `${faq.iconColor}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={15} color={faq.iconColor} />
                  </div>
                  <h4 style={{
                    margin: 0,
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: isDarkMode ? '#F8FAFC' : '#1E293B',
                    lineHeight: 1.4
                  }}>
                    {faq.q}
                  </h4>
                </div>

                <div style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <ChevronDown size={18} color={isDarkMode ? '#94A3B8' : '#64748B'} />
                </div>
              </div>

              {/* Answer Content */}
              {isOpen && (
                <div style={{
                  padding: '0 16px 14px 54px',
                  fontSize: '0.84rem',
                  lineHeight: 1.6,
                  color: isDarkMode ? '#CBD5E1' : '#475569'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default FAQ;

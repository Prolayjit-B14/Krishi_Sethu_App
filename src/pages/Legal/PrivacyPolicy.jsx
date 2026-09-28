import React from 'react';
import { useApp } from '../../state/AppContext';
import {
  Lock,
  Database,
  EyeOff,
  Trash2
} from 'lucide-react';

const PrivacyPolicy = () => {
  const { isDarkMode } = useApp();

  const cardStyle = {
    background: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderRadius: '16px',
    padding: '16px',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
    boxShadow: isDarkMode ? '0 2px 10px rgba(0, 0, 0, 0.2)' : '0 1px 4px rgba(0, 0, 0, 0.03)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  };

  const sections = [
    {
      icon: EyeOff,
      color: '#10B981',
      title: 'Zero Third-Party Ads or Trackers',
      desc: 'KrishiSethu does not host advertisements, track your web browsing, or sell your farm telemetry to commercial brokers.'
    },
    {
      icon: Database,
      color: '#0EA5E9',
      title: 'Data Stored for Farm Operation',
      desc: 'We store your farm configuration (crop type, land size, district) and historical IoT sensor readings (soil moisture, temperature, NPK) solely to generate accurate agronomic advisories.'
    },
    {
      icon: Lock,
      color: '#8B5CF6',
      title: 'Encrypted Telemetry and Local Storage',
      desc: 'Telemetry synced between IoT nodes and the platform is transmitted over secure TLS encryption. User session and theme preferences are saved locally on your device.'
    },
    {
      icon: Trash2,
      color: '#EF4444',
      title: 'Full Data Ownership and Deletion',
      desc: 'You maintain 100% ownership of your farm data. You can clear advisory history or permanently delete your account and records at any time in Settings.'
    }
  ];

  return (
    <div style={{
      padding: '16px 16px 40px',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {sections.map((sec, idx) => {
        const Icon = sec.icon;
        return (
          <div key={idx} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: `${sec.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={17} color={sec.color} />
              </div>
              <h4 style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: 700,
                color: isDarkMode ? '#F8FAFC' : '#1E293B'
              }}>
                {sec.title}
              </h4>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.84rem',
              lineHeight: 1.55,
              color: isDarkMode ? '#94A3B8' : '#64748B'
            }}>
              {sec.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default PrivacyPolicy;

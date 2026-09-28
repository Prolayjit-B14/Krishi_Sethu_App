import React from 'react';
import { useApp } from '../../state/AppContext';
import {
  Cpu,
  AlertCircle,
  HelpCircle,
  Compass
} from 'lucide-react';

const TermsConditions = () => {
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

  const terms = [
    {
      icon: Compass,
      color: '#3B82F6',
      title: 'Platform Purpose',
      desc: 'KrishiSethu provides intelligent IoT telemetry, irrigation automation monitoring, and AI-driven advisory support to help farmers improve crop yield and conserve water.'
    },
    {
      icon: Cpu,
      color: '#10B981',
      title: 'Sensor and Node Deployment',
      desc: 'Users are responsible for properly installing sensors at appropriate soil depths, shielding battery units from direct flooding, and ensuring steady device power.'
    },
    {
      icon: AlertCircle,
      color: '#F59E0B',
      title: 'Advisory Guidance and Responsibility',
      desc: 'AI disease diagnoses and watering schedules are decision-support insights. Farmers retain final discretion regarding fertilizer doses, pesticide spraying, and crop harvesting.'
    },
    {
      icon: HelpCircle,
      color: '#8B5CF6',
      title: 'Account and Platform Integrity',
      desc: 'Maintain your login credentials securely. Automated scraping, malicious telemetry injection, or attempting to compromise platform nodes is strictly prohibited.'
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

      {terms.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: `${item.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={17} color={item.color} />
              </div>
              <h4 style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: 700,
                color: isDarkMode ? '#F8FAFC' : '#1E293B'
              }}>
                {item.title}
              </h4>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.84rem',
              lineHeight: 1.55,
              color: isDarkMode ? '#94A3B8' : '#64748B'
            }}>
              {item.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default TermsConditions;

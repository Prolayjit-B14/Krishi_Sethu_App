import React from 'react';
import { useApp } from '../../state/AppContext';
import { Activity, Droplets, Eye, Sprout } from 'lucide-react';

const FONT = 'Outfit, -apple-system, sans-serif';

const AgriculturalDisclaimer = () => {
  const { isDarkMode } = useApp();

  const cardStyle = {
    background: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderRadius: '16px',
    padding: '16px',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
    boxShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.03)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const points = [
    {
      icon: Activity,
      color: '#10B981',
      title: 'Sensor Measurements and Physical Limits',
      desc: 'Soil moisture, NPK, and ambient readings reflect the specific placement depth and immediate microclimate around the probes. Field variations across acreage can occur.',
    },
    {
      icon: Eye,
      color: '#F59E0B',
      title: 'AI Diagnostic Probability',
      desc: 'Crop disease and pest identification models analyze visual leaf patterns. Detections provide probability-ranked guidance and should be verified with field inspection.',
    },
    {
      icon: Droplets,
      color: '#0EA5E9',
      title: 'Irrigation and Weather Dynamism',
      desc: 'Smart irrigation calculations balance sensor thresholds and forecast models. Sudden unseasonal weather shifts may require manual override on the field.',
    },
    {
      icon: Sprout,
      color: '#8B5CF6',
      title: 'Expert and Agronomist Verification',
      desc: 'For high-risk chemical treatments, severe pest infestations, or large-scale fertilizer dosing, always cross-reference recommendations with your district Krishi Vigyan Kendra (KVK).',
    },
  ];

  return (
    <div style={{
      padding: '16px 16px 40px',
      fontFamily: FONT,
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {points.map((pt, idx) => {
        const Icon = pt.icon;
        return (
          <div key={idx} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: pt.color + '18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={17} color={pt.color} />
              </div>
              <h4 style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: 700,
                color: isDarkMode ? '#F8FAFC' : '#1E293B',
              }}>
                {pt.title}
              </h4>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.84rem',
              lineHeight: 1.55,
              color: isDarkMode ? '#94A3B8' : '#64748B',
            }}>
              {pt.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default AgriculturalDisclaimer;

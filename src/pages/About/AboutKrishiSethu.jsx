import React from 'react';
import { useApp } from '../../state/AppContext';
import {
  Activity,
  Bug,
  Droplets,
  CloudRain,
  Cpu,
  Bell,
  BarChart3,
  Layers
} from 'lucide-react';

const AboutKrishiSethu = () => {
  const { isDarkMode } = useApp();





  const paragraphStyle = {
    fontSize: '0.88rem',
    color: isDarkMode ? '#CBD5E1' : '#334155',
    margin: '0 0 12px 0',
    lineHeight: 1.68,
    fontWeight: 450,
    textAlign: 'justify'
  };

  // ─── 8 CORE CAPABILITIES (Formatted in 2 clean lines per card) ───────────
  const capabilities = [
    {
      icon: Activity,
      line1: 'Crop Health',
      line2: 'Monitoring',
      color: '#10B981'
    },
    {
      icon: Bug,
      line1: 'Pest Detection',
      line2: '& Warning',
      color: '#F59E0B'
    },
    {
      icon: Droplets,
      line1: 'Smart Irrigation',
      line2: 'Management',
      color: '#0EA5E9'
    },
    {
      icon: CloudRain,
      line1: 'Environmental',
      line2: 'Risk Monitoring',
      color: '#8B5CF6'
    },
    {
      icon: Cpu,
      line1: 'Edge AI',
      line2: 'Processing',
      color: '#EC4899'
    },
    {
      icon: Bell,
      line1: 'Farmer Advisory',
      line2: 'System',
      color: '#14B8A6'
    },
    {
      icon: BarChart3,
      line1: 'Farm Analytics',
      line2: 'Dashboard',
      color: '#3B82F6'
    },
    {
      icon: Layers,
      line1: 'Scalable Field',
      line2: 'Deployment',
      color: '#6366F1'
    }
  ];

  // ─── TEAM DATA (2 × 4 Clean Grid) ───────────────────────────────────────
  const teamMembers = [
    {
      name: 'Arghya Roy',
      domain: 'Hardware · IoT',
      initials: 'AR',
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
    },
    {
      name: 'Prolayjit Biswas',
      domain: 'App · IoT · AI',
      initials: 'PB',
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)'
    },
    {
      name: 'Papon Chowdhury',
      domain: 'Hardware support',
      initials: 'PC',
      color: '#06B6D4',
      gradient: 'linear-gradient(135deg, #0891B2 0%, #22D3EE 100%)'
    },
    {
      name: 'Trina Diger',
      domain: 'Hardware support',
      initials: 'TD',
      color: '#F59E0B',
      gradient: 'linear-gradient(135deg, #D97706 0%, #FBBF24 100%)'
    },
    {
      name: 'Natasha Singh',
      domain: 'ML · AI',
      initials: 'NS',
      color: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)'
    },
    {
      name: 'Ragini Singh',
      domain: 'Technical Support',
      initials: 'RS',
      color: '#14B8A6',
      gradient: 'linear-gradient(135deg, #0D9488 0%, #2DD4BF 100%)'
    },
    {
      name: 'Ankan Bhowmik',
      domain: 'Hardware support',
      initials: 'AB',
      color: '#6366F1',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)'
    },
    {
      name: 'Subhajit Halder',
      domain: 'Hardware support',
      initials: 'SH',
      color: '#F97316',
      gradient: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)'
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
      gap: '24px'
    }}>

      {/* ─── 01 · ABOUT KRISHISETHU (PLAIN OVER BG) ─── */}
      <section>
        <p style={paragraphStyle}>
          Agriculture sustains millions across India, yet small and marginal farmers continually face erratic monsoons, heat stress, pest surges, and soil degradation. In rural heartlands where internet connectivity is often unreliable or unavailable, waiting for distant lab reports or cloud-dependent apps often means interventions arrive too late.
        </p>

        <p style={paragraphStyle}>
          <strong>KrishiSethu</strong> is an on-device Smart Farming Assistant built to solve this challenge. By marrying edge AI vision with field-level environmental sensing, the platform runs plant diagnostics, pest tracking, and soil moisture analytics directly on local hardware—delivering zero-latency guidance even completely offline.
        </p>

        <p style={{ ...paragraphStyle, color: isDarkMode ? '#94A3B8' : '#64748B', margin: 0 }}>
          From immediate advisories like <em>"Irrigate now"</em> or <em>"Disease detected"</em> to historical trend forecasting, KrishiSethu empowers growers to minimize input costs, conserve vital water, and protect crop yields before localized threats become widespread losses.
        </p>
      </section>

      {/* ─── 02 · EXPECTED SOLUTION CAPABILITIES ─── */}
      <section>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {capabilities.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: '12px',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0',
                boxSizing: 'border-box',
                height: '54px'
              }}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: `${item.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <item.icon size={16} color={item.color} strokeWidth={2.2} />
              </div>
              <div style={{
                minWidth: 0,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.line1}
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.line2}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 03 · OUR JOURNEY ─── */}
      <section>

        <p style={{ ...paragraphStyle, margin: 0 }}>
          Engineered and tested through iterative field trials and hardware hackathons, KrishiSethu brings together smart IoT sensors, local machine learning, and intuitive agronomic guidance to make precision farming genuinely accessible to every grower.
        </p>
      </section>

      {/* ─── 04 · THE TEAM (2 × 4 CLEAN GRID) ─── */}
      <section>

        {/* 2 × 4 Compact Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {teamMembers.map((member, i) => (
            <div
              key={i}
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                borderRadius: '12px',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0',
                padding: '10px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxSizing: 'border-box'
              }}
            >
              {/* Avatar Lettermark */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                background: member.gradient,
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '0.72rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {member.initials}
              </div>

              {/* Member Details */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: '0.80rem',
                  fontWeight: 800,
                  color: isDarkMode ? '#FFFFFF' : '#0F172A',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2
                }}>
                  {member.name}
                </div>
                <div style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  color: member.color,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '1px'
                }}>
                  {member.domain}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 05 · SIMPLE CLOSING STATEMENT ─── */}
      <section style={{
        textAlign: 'center',
        paddingTop: '8px',
        borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{
          fontSize: '0.88rem',
          fontWeight: 800,
          color: isDarkMode ? '#FFFFFF' : '#0F172A',
          letterSpacing: '-0.01em',
          marginBottom: '4px'
        }}>
          Empowering Every Farmer. Nurturing Every Acre.
        </div>
        <div style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: isDarkMode ? '#64748B' : '#94A3B8',
          letterSpacing: '0.04em'
        }}>
          KrishiSethu · Built for Sustainable Agriculture
        </div>
      </section>

    </div>
  );
};

export default AboutKrishiSethu;

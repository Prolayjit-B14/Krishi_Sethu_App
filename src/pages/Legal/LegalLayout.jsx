import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Cookie, AlertCircle } from 'lucide-react';
import { useApp } from '../../state/AppContext';

const LegalLayout = ({ title, subtitle, lastUpdated, children }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useApp();

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      background: isDarkMode ? '#0F172A' : '#F8FAFC',
      color: isDarkMode ? '#F1F5F9' : '#0F172A',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      boxSizing: 'border-box',
      padding: '16px 16px 80px'
    }}>
      <div style={{
        maxWidth: '720px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Top Back Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back to previous page"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
              color: isDarkMode ? '#F8FAFC' : '#1E293B',
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            color: isDarkMode ? '#94A3B8' : '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Legal & Compliance
          </span>
        </div>

        {/* Page Title Card */}
        <header style={{
          background: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderRadius: '20px',
          padding: '24px 20px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          marginBottom: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '1.45rem',
            fontWeight: 900,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            lineHeight: 1.2
          }}>
            {title}
          </h1>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '0.88rem',
            color: isDarkMode ? '#94A3B8' : '#475569',
            lineHeight: 1.5
          }}>
            {subtitle}
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
            borderRadius: '8px',
            color: isDarkMode ? '#4ADE80' : '#15803D',
            fontSize: '0.72rem',
            fontWeight: 800
          }}>
            <span>Jurisdiction: India (DPDP Act, 2023)</span>
            <span>•</span>
            <span>Last Updated: {lastUpdated || 'September 2026'}</span>
          </div>
        </header>

        {/* Content Body */}
        <article style={{
          background: isDarkMode ? '#1E293B' : '#FFFFFF',
          borderRadius: '20px',
          padding: '24px 20px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          lineHeight: '1.7',
          fontSize: '0.88rem',
          color: isDarkMode ? '#CBD5E1' : '#334155'
        }}>
          {children}
        </article>

        {/* Legal Footer Note */}
        <footer style={{
          textAlign: 'center',
          marginTop: '32px',
          fontSize: '0.76rem',
          color: isDarkMode ? '#64748B' : '#94A3B8'
        }}>
          <p style={{ margin: '0 0 4px 0' }}>
            KrishiSethu Smart Agriculture & Precision IoT Platform • SemiColon Team
          </p>
          <p style={{ margin: 0 }}>
            Governed by the Laws of India & the Digital Personal Data Protection Act, 2023.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LegalLayout;

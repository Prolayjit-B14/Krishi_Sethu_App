import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../state/AppContext';

const DetailLayout = ({ title, subtitle, category = 'Documentation', badgeText, maxWidth = '740px', children }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useApp();

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      background: 'var(--bg-main)',
      color: 'var(--text-main)',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      boxSizing: 'border-box',
      padding: '16px 16px 80px',
      transition: 'background-color 0.18s ease, color 0.18s ease'
    }}>
      <div style={{
        maxWidth: maxWidth,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* Top Back Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <button
            type="button"
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <span style={{
            fontSize: '0.74rem',
            fontWeight: 800,
            color: isDarkMode ? '#94A3B8' : '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            transition: 'color 0.18s ease'
          }}>
            {category}
          </span>
        </div>

        {/* Page Header Card */}
        <header 
          className="settings-card-item"
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '24px 20px',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
            marginBottom: '20px',
            boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease'
          }}
        >
          <h1 style={{
            margin: '0 0 8px 0',
            fontSize: '1.48rem',
            fontWeight: 900,
            color: isDarkMode ? '#F8FAFC' : '#0F172A',
            lineHeight: 1.2
          }}>
            {title}
          </h1>

          {subtitle && (
            <p style={{
              margin: '0 0 14px 0',
              fontSize: '0.88rem',
              color: isDarkMode ? '#94A3B8' : '#475569',
              lineHeight: 1.55
            }}>
              {subtitle}
            </p>
          )}

          {badgeText && (
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
              <span>{badgeText}</span>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DetailLayout;

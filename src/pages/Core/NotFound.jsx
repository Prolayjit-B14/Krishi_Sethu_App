import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, ArrowLeft, Home, ShieldCheck, Compass, AlertCircle } from 'lucide-react';
import { useApp } from '../../state/AppContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useApp();

  return (
    <div
      style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        textAlign: 'center',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        color: isDarkMode ? '#F8FAFC' : '#0F172A',
        boxSizing: 'border-box'
      }}
      role="main"
      aria-label="404 Page Not Found"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          maxWidth: 440,
          width: '100%',
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 28,
          padding: '36px 24px',
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(21, 128, 61, 0.12)',
          boxShadow: isDarkMode ? '0 8px 30px rgba(0, 0, 0, 0.4)' : '0 8px 30px rgba(21, 128, 61, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Animated Botanical Badge */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            background: isDarkMode ? 'rgba(34, 197, 94, 0.18)' : '#DCFCE7',
            border: isDarkMode ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid #BBF7D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            color: '#15803D'
          }}
        >
          <Compass size={36} strokeWidth={2.2} />
        </div>

        {/* 404 Large Label */}
        <div
          style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            lineHeight: 1,
            color: '#15803D',
            letterSpacing: '-0.04em',
            marginBottom: 8
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            margin: '0 0 10px',
            color: isDarkMode ? '#F8FAFC' : '#122B1E',
            letterSpacing: '-0.02em'
          }}
        >
          Plot Route Not Found
        </h1>

        <p
          style={{
            fontSize: '0.88rem',
            color: isDarkMode ? '#94A3B8' : '#64748B',
            lineHeight: 1.55,
            margin: '0 0 28px',
            maxWidth: 340
          }}
        >
          The agricultural sensor route, telemetry node, or document page you requested does not exist or has been relocated to another sector.
        </p>

        {/* Action Buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 14,
              background: '#15803D',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(21, 128, 61, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <Home size={18} />
            <span>Return to Field Dashboard</span>
          </button>

          <button
            onClick={() => navigate(-1)}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 14,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
              color: isDarkMode ? '#CBD5E1' : '#334155',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={16} />
            <span>Go Back Previous Page</span>
          </button>
        </div>

        {/* Statutory Links Footer */}
        <div style={{ marginTop: 28, paddingTop: 16, borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #F1F5F9', width: '100%' }}>
          <div style={{ fontSize: '0.74rem', color: isDarkMode ? '#64748B' : '#94A3B8', display: 'flex', justifyContent: 'center', gap: 12 }}>
            <span onClick={() => navigate('/privacy-policy')} style={{ color: '#15803D', cursor: 'pointer', fontWeight: 700 }}>Privacy Policy</span>
            <span>•</span>
            <span onClick={() => navigate('/terms')} style={{ color: '#15803D', cursor: 'pointer', fontWeight: 700 }}>Terms of Service</span>
            <span>•</span>
            <span onClick={() => navigate('/cookie-policy')} style={{ color: '#15803D', cursor: 'pointer', fontWeight: 700 }}>Cookies</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { ArrowLeft, Cookie, Database, ShieldCheck, Check } from 'lucide-react';

const CookiePolicy = () => {
  const { isDarkMode } = useApp();
  const navigate = useNavigate();

  const cardStyle = {
    background: isDarkMode ? '#1E293B' : '#FFFFFF',
    borderRadius: '18px',
    padding: '20px 18px',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
    boxShadow: isDarkMode ? '0 4px 18px rgba(0, 0, 0, 0.2)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
    marginBottom: '16px'
  };

  const sectionTitleStyle = {
    fontSize: '1.08rem',
    fontWeight: 800,
    color: '#15803D',
    margin: '0 0 10px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const storageItems = [
    {
      key: 'agrisense_user',
      type: 'LocalStorage',
      category: 'Strictly Necessary',
      desc: 'Keeps your session active on this device so you do not need to re-login every time you open the app.'
    },
    {
      key: 'krishi_sethu_theme',
      type: 'LocalStorage',
      category: 'Functional',
      desc: 'Remembers your interface preference (Dark Mode vs Light Mode).'
    },
    {
      key: 'agrisense_farm_info',
      type: 'LocalStorage',
      category: 'Functional',
      desc: 'Caches your farm name and crop profiles locally so the app renders instantly even when offline.'
    },
    {
      key: 'firebase:authUser:...',
      type: 'IndexedDB Token',
      category: 'Security / Auth',
      desc: 'Cryptographically signed JWT to authorize secure access to your Firestore database.'
    }
  ];

  return (
    <div style={{
      padding: '14px 12px 24px',
      fontFamily: "'Outfit', sans-serif",
      color: isDarkMode ? '#CBD5E1' : '#334155',
      fontSize: '0.86rem',
      lineHeight: 1.65,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* ─── HEADER CARD ─── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
              color: isDarkMode ? '#F8FAFC' : '#1E293B',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} />
            <span>Back</span>
          </button>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            color: '#D97706',
            background: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            ZERO AD-TRACKERS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            background: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Cookie size={20} color="#D97706" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              Cookie Policy
            </h1>
            <div style={{ fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: '2px' }}>
              Transparency Report • Last Updated: Sept 2026
            </div>
          </div>
        </div>
      </div>

      {/* ─── 1. DOES KRISHISETHU USE TRACKING COOKIES? ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>1. Does KrishiSethu Use Tracking Cookies?</h2>
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          background: isDarkMode ? 'rgba(21, 128, 61, 0.15)' : 'rgba(21, 128, 61, 0.08)',
          borderLeft: '4px solid #15803D',
          fontSize: '0.84rem',
          lineHeight: '1.6',
          marginBottom: '12px'
        }}>
          <strong>Short Answer: No.</strong> KrishiSethu does <strong>NOT</strong> utilize advertising cookies, marketing trackers, cross-site profiling scripts, or social media tracking pixels.
        </div>
        <p style={{ margin: 0 }}>
          Because we do not track your browsing behavior across the web or sell your attention to advertisers, we deliberately avoid cluttering your screen with intrusive, battery-draining "Accept All Cookies" banners.
        </p>
      </section>

      {/* ─── 2. COMPLETE AUDIT OF TECHNOLOGIES ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>2. Audit of Technologies We Use</h2>
        <p style={{ margin: '0 0 12px 0' }}>
          To deliver a smooth experience in rural fields with intermittent cellular coverage, we use strictly necessary <strong>HTML5 LocalStorage</strong> and <strong>Firebase Auth Session Tokens</strong>:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {storageItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                borderRadius: '14px',
                padding: '12px 14px',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem', color: isDarkMode ? '#38BDF8' : '#0284C7' }}>
                  {item.key}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#15803D',
                  background: isDarkMode ? 'rgba(21, 128, 61, 0.2)' : '#DCFCE7',
                  padding: '2px 7px',
                  borderRadius: '5px'
                }}>
                  {item.category}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginBottom: '4px' }}>
                Type: {item.type}
              </div>
              <div style={{ fontSize: '0.80rem', color: isDarkMode ? '#CBD5E1' : '#475569', lineHeight: 1.45 }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. HOW TO CLEAR LOCAL DATA ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>3. How to Clear Local Data</h2>
        <p style={{ margin: '0 0 10px 0' }}>You have full control over all stored data on your device:</p>
        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>
            <strong>Via the App:</strong> Navigate to <em>Account → Delete Account & Erase All Personal Data</em>. This immediately purges all keys from local storage.
          </li>
          <li>
            <strong>Via Your Browser:</strong> You can clear browser storage and site data anytime via browser settings (Chrome / WebView → Site Settings → Clear Data).
          </li>
        </ul>
      </section>

      {/* ─── 4. CONTACT ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>4. Contact for Inquiries</h2>
        <p style={{ margin: '0 0 6px 0' }}>
          If you have questions about how KrishiSethu handles local storage or session tokens, please contact our team:
        </p>
        <div style={{ fontWeight: 700, color: '#15803D' }}>
          KrishiSethu Compliance Team • <a href="mailto:contact.prolay14@gmail.com" style={{ color: '#15803D', textDecoration: 'underline' }}>contact.prolay14@gmail.com</a>
        </div>
      </section>
    </div>
  );
};

export default CookiePolicy;

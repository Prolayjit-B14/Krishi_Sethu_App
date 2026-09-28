import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { ArrowLeft, ShieldCheck, Mail, Database, Lock, Eye, AlertTriangle } from 'lucide-react';

const PrivacyPolicy = () => {
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
            color: '#15803D',
            background: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            DPDP ACT 2023 COMPLIANT
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={20} color="#10B981" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              Privacy Policy
            </h1>
            <div style={{ fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: '2px' }}>
              Jurisdiction: India • Last Updated: Sept 2026
            </div>
          </div>
        </div>
      </div>

      {/* ─── 1. INTRODUCTION ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>1. Introduction & Scope</h2>
        <p style={{ margin: '0 0 10px 0' }}>
          Welcome to <strong>KrishiSethu</strong> (“we”, “our”, or “the Platform”), an IoT-enabled smart agriculture monitoring and agronomy decision-support platform designed to assist smallholders and agricultural researchers with precision field telemetry.
        </p>
        <p style={{ margin: 0 }}>
          This Privacy Notice is published in compliance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and the <strong>Digital Personal Data Protection Rules, 2025</strong> of the Republic of India. We are committed to the principles of <em>Purpose Limitation</em>, <em>Data Minimisation</em>, and absolute transparency regarding what data is collected and why.
        </p>
      </section>

      {/* ─── 2. DATA WE COLLECT ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>2. Data We Collect (Data Minimisation)</h2>
        <p style={{ margin: '0 0 10px 0' }}>
          We collect only the minimum data strictly necessary to provide live telemetry, farm safety alerts, and AI-assisted agronomy recommendations:
        </p>
        <ul style={{ paddingLeft: '18px', margin: '0 0 12px 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>
            <strong>Account Identifiers:</strong> Your full name and email address, collected solely to authenticate your login and secure access to your field devices.
          </li>
          <li>
            <strong>Farm Identity:</strong> Farm name, district/village, and crop profile selections (e.g. Rice, Wheat, Mustard) to tailor agronomic thresholds.
          </li>
          <li>
            <strong>Field Coordinates (GPS):</strong> Approximate latitude and longitude, captured at broad farm-level precision strictly to fetch hyper-local weather forecasts and agro-meteorological advisories.
          </li>
          <li>
            <strong>IoT Sensor Telemetry:</strong> Real-time numerical measurements streamed from your ESP32 SoilNodes: Soil Moisture %, N-P-K levels, Temperature & Humidity, Rain sensor values, Light intensity, and Relay/Pump timestamps.
          </li>
          <li>
            <strong>Diagnostic Questions:</strong> Text prompts entered into AgriBot to diagnose crop health issues.
          </li>
        </ul>

        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          background: isDarkMode ? 'rgba(21, 128, 61, 0.15)' : 'rgba(21, 128, 61, 0.08)',
          borderLeft: '4px solid #15803D',
          fontSize: '0.80rem'
        }}>
          <strong>🛡️ What We Do NOT Collect:</strong> We do <em>not</em> collect financial details, bank accounts, UPI credentials, government identification numbers (Aadhaar/PAN), biometric information, or advertising tracking IDs.
        </div>
      </section>

      {/* ─── 3. PURPOSES OF PROCESSING ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>3. Purposes of Processing</h2>
        <p style={{ margin: '0 0 8px 0' }}>Your digital personal and farm data is processed strictly for the following purposes:</p>
        <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <li>To verify your identity and authenticate access to your specific farm devices.</li>
          <li>To stream real-time telemetry to your dashboard and calculate soil health indices.</li>
          <li>To generate emergency frost, waterlogging, or heatwave alerts for crop protection.</li>
          <li>To transmit user-initiated actuation commands (e.g. pump start/stop) to your physical hardware.</li>
          <li>To provide AI-assisted diagnostic recommendations via the Gemini AI Engine.</li>
        </ol>
      </section>

      {/* ─── 4. THIRD-PARTY PROCESSORS ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>4. Third-Party Processors & Infrastructure</h2>
        <p style={{ margin: '0 0 10px 0' }}>
          We do not sell, rent, or trade your personal or farm data. To run the platform, we utilize trusted infrastructure providers operating under strict security obligations:
        </p>
        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>Google Firebase:</strong> Secure authentication and encrypted Cloud Firestore storage.</li>
          <li><strong>HiveMQ Cloud:</strong> Industrial MQTT broker providing TLS-encrypted (WSS) streaming for sensor packets.</li>
          <li><strong>OpenWeatherMap API:</strong> Ephemeral coordinates queries to retrieve weather data (no personal identifiers sent).</li>
          <li><strong>Google Gemini AI API:</strong> Crop symptom reasoning (queries sent without personal identity tags).</li>
        </ul>
      </section>

      {/* ─── 5. COOKIE & STORAGE USAGE ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>5. Cookie & Storage Usage</h2>
        <p style={{ margin: '0 0 10px 0' }}>
          KrishiSethu does <strong>not</strong> use advertising cookies, marketing pixels, or cross-site tracking scripts. We utilize only essential browser <code>localStorage</code> to store:
        </p>
        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <li>Your active session token (so you stay securely logged in).</li>
          <li>Your dark/light UI theme preference.</li>
          <li>Locally cached farm profile details for offline resilience in rural field conditions.</li>
        </ul>
      </section>

      {/* ─── 6. YOUR RIGHTS ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>6. Your Rights Under DPDP Act, 2023</h2>
        <p style={{ margin: '0 0 10px 0' }}>As a Data Principal under Indian law, you possess the following statutory rights:</p>
        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li><strong>Right to Access:</strong> Review all personal profile and farm telemetry data stored in your dashboard at any time.</li>
          <li><strong>Right to Correction:</strong> Update or correct your name, email, and farm profile directly from the Account screen.</li>
          <li><strong>Right to Erasure:</strong> Permanently delete your account and all associated cloud and local data at any time via <em>Account → Delete Account</em>.</li>
          <li><strong>Right of Grievance Redressal:</strong> Register privacy inquiries or complaints directly with our Grievance Officer.</li>
        </ul>
      </section>

      {/* ─── 7. PROTECTION OF CHILDREN ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>7. Protection of Children</h2>
        <p style={{ margin: 0 }}>
          KrishiSethu is an agricultural monitoring platform and is not directed towards children under the age of 18. We do not knowingly collect, process, or track personal data belonging to minors.
        </p>
      </section>

      {/* ─── 8. GRIEVANCE REDRESSAL OFFICER ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>8. Grievance Redressal Officer</h2>
        <p style={{ margin: '0 0 10px 0' }}>
          In accordance with Section 10 of the DPDP Act, 2023 and the DPDP Rules, 2025, for any questions or requests regarding your personal data, contact our designated Grievance Officer:
        </p>
        <div style={{
          padding: '14px',
          borderRadius: '12px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
          fontSize: '0.82rem',
          lineHeight: '1.6',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div><strong>Officer:</strong> Prolayjit Biswas</div>
          <div><strong>Project:</strong> KrishiSethu IoT & Smart Agriculture Ecosystem</div>
          <div><strong>Organization:</strong> SemiColon Team</div>
          <div><strong>Location:</strong> Nadia / Kolkata, West Bengal, India</div>
          <div><strong>Direct Contact Email:</strong> <a href="mailto:contact.prolay14@gmail.com" style={{ color: '#15803D', fontWeight: 700 }}>contact.prolay14@gmail.com</a></div>
          <div><strong>Response Time:</strong> Acknowledged within 48 hours; resolved within 7 business days.</div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;

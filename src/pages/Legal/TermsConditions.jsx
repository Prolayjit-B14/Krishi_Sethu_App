import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const TermsConditions = () => {
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
            color: '#0284C7',
            background: isDarkMode ? 'rgba(2, 132, 199, 0.15)' : '#E0F2FE',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            LEGAL TERMS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            background: isDarkMode ? 'rgba(2, 132, 199, 0.16)' : '#E0F2FE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <FileText size={20} color="#0284C7" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: isDarkMode ? '#F8FAFC' : '#0F172A', lineHeight: 1.2 }}>
              Terms & Conditions
            </h1>
            <div style={{ fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B', marginTop: '2px' }}>
              Standard Terms of Use • Last Updated: Sept 2026
            </div>
          </div>
        </div>
      </div>

      {/* ─── 1. PLATFORM OVERVIEW ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>1. Platform Overview & Acceptance</h2>
        <p style={{ margin: '0 0 10px 0' }}>
          These Terms of Service (“Terms”) constitute a binding agreement between you (“User”, “Farmer”, or “Operator”) and the <strong>KrishiSethu Project</strong> (“SemiColon Team”, “we”, “our”).
        </p>
        <p style={{ margin: 0 }}>
          KrishiSethu is an IoT-integrated precision farming and agricultural telemetry research platform. By creating an account, connecting hardware nodes, or accessing our dashboard, you confirm that you have read, understood, and agreed to be bound by these Terms and our Privacy Policy.
        </p>
      </section>

      {/* ─── IOT HARDWARE & ACTUATION DISCLAIMER ─── */}
      <section style={{
        ...cardStyle,
        border: '1.5px solid #EF4444',
        background: isDarkMode ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#DC2626', fontWeight: 900, marginBottom: '10px' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.88rem' }}>CRITICAL IOT HARDWARE & ACTUATION DISCLAIMER</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: 1.55 }}>
          <div>
            <strong>1. Connectivity & Latency:</strong> Telemetry packets and actuator commands operate over wireless RF, Wi-Fi, and MQTT brokers. Packets may be delayed or lost due to rural network conditions or power outages.
          </div>
          <div>
            <strong>2. High-Voltage Physical Equipment:</strong> Actuators toggled via this platform (submersible pumps, solenoid valves, sprayers) interact with physical high-voltage relays.
          </div>
          <div>
            <strong>3. Required Physical Safeguards:</strong> Operators must ensure all physical equipment connected to ESP32 relay modules is equipped with local manual overrides, mechanical breakers, and physical emergency stop switches.
          </div>
          <div>
            <strong>4. Not an Industrial Safety System:</strong> KrishiSethu is an agronomy monitoring and decision-support tool. It is <strong>NOT</strong> an industrial emergency shutdown system. Never rely solely on cloud commands to prevent flooding or motor burnout.
          </div>
        </div>
      </section>

      {/* ─── AGRICULTURAL DECISION SUPPORT & AI DISCLAIMER ─── */}
      <section style={{
        ...cardStyle,
        border: '1.5px solid #15803D',
        background: isDarkMode ? 'rgba(21, 128, 61, 0.08)' : '#F0FDF4'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803D', fontWeight: 900, marginBottom: '10px' }}>
          <CheckCircle size={18} />
          <span style={{ fontSize: '0.88rem' }}>AGRICULTURAL DECISION-SUPPORT & AI DISCLAIMER</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', lineHeight: 1.55 }}>
          <div>
            <strong>1. Advisory Guidance Only:</strong> All soil health interpretations (NPK ratios, pH estimates), irrigation schedules, and crop advisories are computational estimates derived from mathematical models and available telemetry.
          </div>
          <div>
            <strong>2. Generative AI Outputs:</strong> Recommendations generated by AgriBot (powered by Gemini) are intended strictly for educational and preliminary diagnostic insights.
          </div>
          <div>
            <strong>3. Professional Consultation:</strong> No output from this platform guarantees specific crop yields. Always verify fertilizer dosage and pest chemicals against local soil test reports and certified guidance from your local Krishi Vigyan Kendra (KVK).
          </div>
        </div>
      </section>

      {/* ─── 2. USER ACCOUNTS & ACCEPTABLE USE ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>2. User Accounts & Acceptable Use</h2>
        <p style={{ margin: '0 0 8px 0' }}>When using KrishiSethu, you agree to:</p>
        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Maintain the confidentiality of your credentials and restrict access to authorized farm personnel.</li>
          <li>Never use the platform to transmit malicious packets or inject spoofed MQTT topics.</li>
          <li>Never attempt to eavesdrop on, intercept, or actuate hardware nodes belonging to another farm.</li>
          <li>Promptly rotate credentials if you suspect an unauthorized party has accessed your network.</li>
        </ul>
      </section>

      {/* ─── 3. INTELLECTUAL PROPERTY ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>3. Intellectual Property & Firmware Openness</h2>
        <p style={{ margin: 0 }}>
          The KrishiSethu interface, agronomic algorithms, and documentation are the intellectual creation of the SemiColon Team. The accompanying microcontroller firmware (ESP32/SoilNode) is provided as open-architecture research code under permissive licenses.
        </p>
      </section>

      {/* ─── 4. LIMITATION OF LIABILITY ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>4. Limitation of Liability</h2>
        <p style={{ margin: '0 0 8px 0' }}>
          To the maximum extent permitted under applicable laws of India, the developers, contributors, and the SemiColon Team shall not be liable for:
        </p>
        <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>Loss of crop yield, plant disease infestation, or weather-induced crop damage.</li>
          <li>Electrical equipment breakdown, pump motor burnout, valve malfunction, or pipe leakage.</li>
          <li>Network downtime, cloud broker disconnections, or sensor calibration inaccuracies.</li>
        </ul>
      </section>

      {/* ─── 5. GOVERNING LAW ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>5. Governing Law & Jurisdiction</h2>
        <p style={{ margin: 0 }}>
          These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with the platform shall be subject to the exclusive jurisdiction of the competent courts in West Bengal, India.
        </p>
      </section>

      {/* ─── 6. CONTACT INFORMATION ─── */}
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>6. Contact Information</h2>
        <p style={{ margin: '0 0 6px 0' }}>
          For questions regarding these Terms, please contact our project administration:
        </p>
        <div style={{ fontWeight: 700, color: '#15803D' }}>
          KrishiSethu Platform Team • <a href="mailto:contact.prolay14@gmail.com" style={{ color: '#15803D', textDecoration: 'underline' }}>contact.prolay14@gmail.com</a>
        </div>
      </section>
    </div>
  );
};

export default TermsConditions;

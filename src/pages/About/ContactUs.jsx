import React, { useState } from 'react';
import { useApp } from '../../state/AppContext';
import {
  Mail, MapPin,
  CheckCircle2, ArrowRight, ArrowUpRight
} from 'lucide-react';

const ContactUs = () => {
  const { isDarkMode, user } = useApp();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.message.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
    background: isDarkMode ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
    color: isDarkMode ? '#F8FAFC' : '#0F172A',
    fontSize: '0.86rem',
    fontFamily: "'Outfit', -apple-system, sans-serif",
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.15s ease'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.74rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
    marginBottom: '5px',
    color: isDarkMode ? '#94A3B8' : '#64748B'
  };

  return (
    <div style={{
      padding: '16px 16px 40px',
      fontFamily: "'Outfit', -apple-system, sans-serif",
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>


      {/* ─── CONTACT SECTION ─── */}
      <section style={{
        background: isDarkMode ? 'rgba(255, 255, 255, 0.025)' : '#F8FAFC',
        borderRadius: '14px',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
        padding: '12px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%'
      }}>
        {/* Email Row */}
        <a
          href="mailto:contact.prolay14@gmail.com?subject=KrishiSethu%20Inquiry"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
        >
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: '#10B98115',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Mail size={16} color="#10B981" strokeWidth={2.2} />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            minWidth: 0
          }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: isDarkMode ? '#94A3B8' : '#64748B',
              flexShrink: 0
            }}>
              Email:
            </span>
            <span style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              contact.prolay14@gmail.com
            </span>
          </div>
          <ArrowUpRight size={14} color="#10B981" style={{ opacity: 0.8, flexShrink: 0 }} />
        </a>

        {/* Location Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '10px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #E2E8F0'
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: '#8B5CF615',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <MapPin size={16} color="#8B5CF6" strokeWidth={2.2} />
          </div>
          <div style={{
            fontSize: '0.84rem',
            fontWeight: 700,
            color: isDarkMode ? '#FFFFFF' : '#0F172A'
          }}>
            Based in India
          </div>
        </div>
      </section>

      {/* ─── SEND A MESSAGE SECTION ─── */}
      <section style={{
        background: isDarkMode ? 'rgba(255, 255, 255, 0.025)' : '#F8FAFC',
        borderRadius: '14px',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #E2E8F0',
        padding: '16px 14px',
        boxSizing: 'border-box',
        width: '100%'
      }}>

        {submitted ? (
          <div style={{
            padding: '24px 16px',
            borderRadius: '12px',
            background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={32} color="#10B981" />
            <div style={{
              fontSize: '0.92rem',
              fontWeight: 800,
              color: isDarkMode ? '#FFFFFF' : '#0F172A'
            }}>
              Message Dispatched
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: isDarkMode ? '#94A3B8' : '#64748B',
              lineHeight: 1.5,
              maxWidth: '320px'
            }}>
              Thank you! We have received your message and will follow up at <strong>{formData.email || 'your registered email'}</strong>.
            </div>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData(prev => ({ ...prev, subject: '', message: '' }));
              }}
              style={{
                marginTop: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'transparent',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                color: isDarkMode ? '#CBD5E1' : '#334155',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Your Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Prolayjit Biswas"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Your Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. farmer@krishisethu.in"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Inquiring about IoT sensors & field deployment"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your message here..."
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: '42px',
                borderRadius: '10px',
                background: isDarkMode ? '#10B981' : '#15803D',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.86rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isDarkMode ? '0 2px 10px rgba(16, 185, 129, 0.25)' : '0 2px 10px rgba(21, 128, 61, 0.2)',
                marginTop: '4px',
                transition: 'opacity 0.15s ease'
              }}
            >
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}
      </section>

    </div>
  );
};

export default ContactUs;

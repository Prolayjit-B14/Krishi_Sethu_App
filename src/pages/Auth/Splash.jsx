import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────
const COLORS = {
  primary: '#10B981', 
  primaryLight: '#34D399',
  background: '#10B981', // Changed to green
  textMain: '#FFFFFF', // Changed to white for contrast
  textMuted: 'rgba(255, 255, 255, 0.7)',
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Artificial delay to allow user to experience the splash screen
    const timer = setTimeout(() => {
      navigate('/login');
    }, 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ 
      height: '100dvh', 
      width: '100vw', 
      background: 'linear-gradient(135deg, #065F46 0%, #042F2E 100%)',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative', 
      overflow: 'hidden',
      fontFamily: "'Outfit', sans-serif"
    }}>
      
      {/* CENTRAL LOGO SECTION */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        transform: 'translateY(-2rem)' // Slight upward shift for visual balance
      }}>
        
        {/* BRANDING - Clean and professional typography */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{ 
            color: COLORS.textMain, 
            fontSize: '2.8rem', 
            fontWeight: 600, 
            margin: 0, 
            letterSpacing: '-0.02em' 
          }}>
            Krishi Sethu
          </h1>
          <p style={{ 
            color: COLORS.textMuted, 
            marginTop: '0.6rem', 
            fontWeight: 400, 
            fontSize: '1rem', 
            letterSpacing: '0.01em' 
          }}>
            Precision Farming Platform
          </p>
        </motion.div>
      </div>

      {/* LOADING INDICATOR - Minimal and low contrast */}
      <div style={{ 
        position: 'absolute', 
        bottom: '80px', 
        width: '100%', 
        maxWidth: '200px', 
        textAlign: 'center' 
      }}>
         <div style={{ 
           marginBottom: '16px',
           color: COLORS.textMuted,
           fontSize: '0.8rem', 
           fontWeight: 400,
           letterSpacing: '0.02em'
         }}>
           Initializing system
         </div>
         
         <div style={{ 
           width: '100%', 
           height: '2px', 
           background: 'rgba(255,255,255,0.06)', 
           borderRadius: '10px', 
           overflow: 'hidden' 
         }}>
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: '100%' }} 
              transition={{ duration: 3.5, ease: 'easeInOut' }}
              style={{ 
                height: '100%', 
                background: COLORS.primary,
                opacity: 0.8
              }} 
            />
         </div>
      </div>
      
      {/* FOOTER - Versioning */}
      <div style={{ position: 'absolute', bottom: '30px', color: COLORS.textMuted, opacity: 0.6, fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em' }}>
        KRISHI SETHU • v1.4.3
      </div>

    </div>
  );
};

export default Splash;


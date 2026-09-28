/**
 * Farm Advisor Pro v17.1.0 Main Application Entry
 * Handles routing, global layout, and organized page imports.
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
// import { App as CapApp } from '@capacitor/app';
const CapApp = null; // Fallback for browser
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutGrid, LineChart, Cpu,
  Camera, Bell, User, Leaf,
  Settings as SettingsIcon, FlaskConical, Sparkles,
  AlertCircle, AlertTriangle
} from 'lucide-react';
import { TelemetryProvider } from './state/TelemetryContext';

// Context & State
import { AppProvider, useApp } from './state/AppContext';

// Reusable Components
import TopBar from './ui/TopBar';
import Sidebar from './ui/Sidebar';
import AgriBot from './ui/AgriBot';

// 🚀 PERFORMANCE: Lazy load pages to prevent white-screen on startup
import Login from './pages/Auth/Login';
import Splash from './pages/Auth/Splash';
// 🚀 PERFORMANCE: Lazy load pages
const Account = React.lazy(() => import('./pages/Auth/Account'));
const Dashboard = React.lazy(() => import('./pages/Core/Dashboard'));
const AlertCenter = React.lazy(() => import('./pages/Core/AlertCenter'));
const NotificationDetail = React.lazy(() => import('./pages/Core/NotificationDetail'));
const Settings = React.lazy(() => import('./pages/Core/Settings'));
const SoilMonitor = React.lazy(() => import('./pages/Monitoring/SoilMonitor'));
const SensorDetails = React.lazy(() => import('./pages/Monitoring/SensorDetails'));
const SensorManager = React.lazy(() => import('./pages/Monitoring/SensorManager'));
const WeatherMonitor = React.lazy(() => import('./pages/Monitoring/WeatherMonitor'));
const DeviceManager = React.lazy(() => import('./pages/Control/DeviceManager'));
const DeviceDetails = React.lazy(() => import('./pages/Control/DeviceDetails'));
const AnalyticsHub = React.lazy(() => import('./pages/Analytics/AnalyticsHub'));
const Reports = React.lazy(() => import('./pages/Analytics/Reports'));
const SoilForensics = React.lazy(() => import('./pages/Advisory/SoilForensics'));
const FarmAdvisor = React.lazy(() => import('./pages/Advisory/FarmAdvisor'));
const ActuatorControl = React.lazy(() => import('./pages/Control/ActuatorControl'));
const IrrigationControl = React.lazy(() => import('./pages/Control/IrrigationControl'));
const FarmSetup = React.lazy(() => import('./pages/Auth/FarmSetup'));
const PestManagement = React.lazy(() => import('./pages/Advisory/PestManagement'));
const YieldWaterAnalytics = React.lazy(() => import('./pages/Analytics/YieldWaterAnalytics'));
const ClimateRiskRadar = React.lazy(() => import('./pages/Monitoring/ClimateRiskRadar'));

// 📜 LEGAL & COMPLIANCE PAGES (India DPDP Act 2023 & Disclaimers)
const PrivacyPolicy = React.lazy(() => import('./pages/Legal/PrivacyPolicy'));
const TermsConditions = React.lazy(() => import('./pages/Legal/TermsConditions'));
const CookiePolicy = React.lazy(() => import('./pages/Legal/CookiePolicy'));
const NotFound = React.lazy(() => import('./pages/Core/NotFound'));

// 📖 ABOUT & CONTACT DEDICATED PAGES
const AboutKrishiSethu = React.lazy(() => import('./pages/About/AboutKrishiSethu'));
const ContactUs = React.lazy(() => import('./pages/About/ContactUs'));


// ─── LOADING SKELETON ──────────────────────────────────────────────────────
const PageLoader = () => (
  <div style={{
    height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)',
    gap: '20px', zIndex: 10000, position: 'fixed', top: 0, left: 0
  }}>
    <div style={{ width: '50px', height: '50px', border: '4px solid var(--border-main)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>INITIALIZING ENGINE...</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);


// 🚀 PERFORMANCE: Memoize BottomNav to prevent re-renders on every telemetry update
const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      id: 'Home',
      path: '/dashboard',
      icon: LayoutGrid,
      color: 'var(--primary)',
      matches: ['/dashboard', '/weather']
    },
    {
      id: 'Soil',
      path: '/soil-monitoring',
      icon: FlaskConical,
      color: '#15803D',
      matches: ['/soil-monitoring', '/sensor-detail', '/sensor-details-screen', '/sensor-details', '/sensor-manager', '/sensors', '/precision-soil-testing']
    },
    {
      id: 'Advisor',
      path: '/crop-advisor',
      icon: Sparkles,
      color: 'var(--accent)',
      matches: ['/crop-advisor']
    },
    {
      id: 'Analytics',
      path: '/reports',
      icon: LineChart,
      color: 'var(--primary)',
      matches: ['/reports', '/analytics', '/alerts', '/notification-detail']
    },
    {
      id: 'Devices',
      path: '/device-area',
      icon: Cpu,
      color: '#176B45',
      matches: ['/device-area', '/device-detail', '/device-details', '/actuators']
    },
  ];

  return (
    <nav className="bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)',
      borderTop: '1px solid var(--border-main)',
      height: '66px', display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '0 8px', zIndex: 1000,
      boxShadow: 'var(--shadow-lg)'
    }}>
      {tabs.map((item) => {
        const Icon = item.icon;
        const isActive = item.matches.includes(location.pathname);

        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
            style={{
              background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px', color: isActive ? item.color : 'var(--text-inactive)',
              padding: '8px 0', flex: 1, cursor: 'pointer', outline: 'none',
              position: 'relative'
            }}
          >
            <motion.div
              animate={{
                scale: isActive ? 1.15 : 1,
                y: isActive ? -2 : 0
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} color={isActive ? item.color : 'var(--text-inactive)'} />
            </motion.div>
            <motion.span
              animate={{ opacity: isActive ? 1 : 0.6, y: isActive ? 0 : 2 }}
              style={{ fontSize: '0.65rem', fontWeight: isActive ? 800 : 600, letterSpacing: '0.02em' }}
            >
              {item.id}
            </motion.span>
          </motion.button>
        );
      })}
    </nav>
  );
});

// ─── ERROR BOUNDARY ────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) {
    console.error("AgriSense Crash Detected:", error, errorInfo);
    try {
      const logs = JSON.parse(localStorage.getItem('agrisense_crash_logs') || '[]');
      logs.push({ message: error.message, stack: error.stack, time: new Date().toISOString() });
      localStorage.setItem('agrisense_crash_logs', JSON.stringify(logs.slice(-10)));
    } catch (e) { }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', height: '100dvh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'white' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '25px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>System Anomaly</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '12px', marginBottom: '2rem', maxWidth: '280px' }}>Our diagnostic module detected a conflict in the interface layer. A re-sync is recommended.</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '14px 30px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>RE-SYNC PLATFORM</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = ({ children }) => {
  const location = useLocation();
  const mainRef = React.useRef(null);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [location.pathname]);

  const titles = {
    '/dashboard': 'Dashboard',
    '/soil-monitoring': 'Soil Monitor',
    '/sensor-detail': 'Sensor Details',
    '/sensor-details-screen': 'Sensor Details',
    '/sensor-details': 'Sensor Manager',
    '/sensor-manager': 'Sensor Manager',
    '/sensors': 'Sensor Manager',
    '/weather': 'Weather Station',
    '/climate-risk-radar': 'Climate & Disaster Radar',
    '/disaster-radar': 'Climate & Disaster Radar',
    '/device-area': 'Device Manager',
    '/device-detail': 'Device Details',
    '/device-details': 'Device Details',
    '/actuators': 'Actuator Control',
    '/irrigation': 'Irrigation Control',
    '/irrigation-control': 'Irrigation Control',
    '/precision-soil-testing': 'Soil Forensics',
    '/crop-advisor': 'Farm Advisor',
    '/farm-setup': 'Farm Setup',
    '/reports': 'Farm Reports',
    '/analytics': 'Analytics Hub',
    '/account': 'My Account',
    '/alerts': 'Alerts',
    '/notification-detail': 'Alerts',
    '/profile': 'My Account',
    '/settings': 'Settings',
    '/privacy-policy': 'Privacy Policy',
    '/terms': 'Terms & Conditions',
    '/cookie-policy': 'Cookie Policy',
    '/cookies': 'Cookie Policy',
    '/about-us': 'About Us',
    '/about': 'About Us',
    '/about-krishisethu': 'About Us',
    '/contact-us': 'Contact Us',
    '/contact': 'Contact Us',
    '/404': 'Page Not Found',
  };

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
    const pageTitle = titles[location.pathname] || 'Smart Agriculture Platform';
    document.title = `${pageTitle} | Krishi Sethu`;
  }, [location.pathname]);

  // 🚀 PERFORMANCE: Navigation History Tracker for Directional Animations
  const [navDirection, setNavDirection] = React.useState(0);
  const prevPathRef = React.useRef(location.pathname);

  useEffect(() => {
    const paths = [
      '/dashboard',
      '/precision-soil-testing',
      '/crop-advisor',
      '/analytics',
      '/device-area',
      '/soil-monitoring',
      '/weather',
      '/irrigation',
      '/alerts',
      '/reports',
      '/account'
    ];
    const prevIdx = paths.indexOf(prevPathRef.current);
    const currIdx = paths.indexOf(location.pathname);

    if (prevIdx !== -1 && currIdx !== -1) {
      if (prevIdx === currIdx) setNavDirection(0);
      else setNavDirection(currIdx > prevIdx ? 1 : -1);
    } else {
      setNavDirection(0); // Fade only for unknown paths
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const variants = {
    enter: (direction) => ({
      x: direction === 0 ? 0 : (direction > 0 ? 100 : -100),
      opacity: 0,
      scale: direction === 0 ? 0.98 : 1,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction === 0 ? 0 : (direction < 0 ? 100 : -100),
      opacity: 0,
      scale: direction === 0 ? 0.98 : 1,
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0
    })
  };

  return (
    <div style={{
      height: '100dvh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg-main)'
    }}>
      <TopBar title={titles[location.pathname] || 'Krishi Sethu'} />
      <main
        ref={mainRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          position: 'relative'
        }}
      >
        <div style={{
          maxWidth: '480px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
          paddingBottom: '84px'
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <BottomNav />
      <Sidebar />
      {location.pathname === '/dashboard' && <AgriBot />}
    </div>
  );
};

const AppRoutes = () => {
  const app = useApp();
  console.log("🚦 [AppRoutes]: useApp returned", app ? "data" : "NULL");
  if (!app || Object.keys(app).length === 0) {
    console.log("🚦 [AppRoutes]: App context is missing or empty!");
    return <div style={{ color: 'var(--danger)', padding: '20px', background: 'var(--bg-main)', height: '100dvh' }}>App context is missing or empty!</div>;
  }
  const { user, isDataLoading, isDarkMode, cloudSyncStatus, setIsDataLoading } = app;
  const navigate = useNavigate();
  const location = useLocation();

  console.log("🚦 [AppRoutes]: Current State:", { user: user?.email, isDataLoading, path: location.pathname });

  useEffect(() => {
    if (window.hideAppLoader) {
      window.hideAppLoader();
    }
  }, []);

  useEffect(() => {
    // ✋ LOADING GUARD: Wait for Cloud Sync to finish
    if (isDataLoading) return;
  }, [user, isDataLoading, location.pathname, navigate]);


  useEffect(() => {
    let backListener;
    let urlListener;

    const initListeners = async () => {
      try {
        setTimeout(async () => {
          try {
            const { SplashScreen } = await import('@capacitor/splash-screen');
            await SplashScreen.hide();
          } catch (e) { }
        }, 2000);

        if (CapApp) {
          backListener = await CapApp.addListener('backButton', () => {
            if (['/dashboard', '/login', '/'].includes(location.pathname)) {
              CapApp.exitApp();
            } else {
              navigate(-1);
            }
          });

          urlListener = await CapApp.addListener('appUrlOpen', (data) => {
            console.log('🔗 AgriSense Deep Link Detected:', data.url);
            if (data.url.includes('google') || data.url.includes('firebase')) {
              window.location.reload();
            }
          });
        }
      } catch (e) {
        console.warn("Capacitor listeners failed:", e);
      }
    };
    initListeners();

    const handleGlobalError = (errorLog) => {
      console.error("🚀 RELEASE_CRASH_DETECTED:", errorLog);
      try {
        const logs = JSON.parse(localStorage.getItem('agrisense_crash_logs') || '[]');
        logs.push(errorLog);
        localStorage.setItem('agrisense_crash_logs', JSON.stringify(logs.slice(-10)));
      } catch (e) { }
    };

    window.addEventListener('error', (event) => handleGlobalError({ message: event.message, source: event.filename, line: event.lineno, col: event.colno, error: event.error?.stack, time: new Date().toISOString() }));
    window.addEventListener('unhandledrejection', (e) => handleGlobalError({ message: e.reason?.message || 'Promise Rejection', error: e.reason, time: new Date().toISOString() }));

    return () => {
      backListener?.remove();
      urlListener?.remove();
      window.removeEventListener('error', handleGlobalError);
    };
  }, [location.pathname, navigate]);

  const isPublicRoute = ['/', '/login', '/farm-setup'].includes(location.pathname);

  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/farm-setup" element={<FarmSetup />} />


      {/* 🛠️ PERSISTENT LAYOUT WRAPPER: Prevents layout re-mounting on every navigation */}
      <Route element={<MainLayout><React.Suspense fallback={<PageLoader />}><Outlet /></React.Suspense></MainLayout>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<AnalyticsHub />} />
        <Route path="/soil-monitoring" element={<SoilMonitor />} />
        <Route path="/sensor-detail" element={<SensorDetails />} />
        <Route path="/sensor-details-screen" element={<SensorDetails />} />
        <Route path="/sensor-details" element={<SensorManager />} />
        <Route path="/sensor-manager" element={<SensorManager />} />
        <Route path="/sensors" element={<SensorManager />} />
        <Route path="/device-area" element={<DeviceManager />} />
        <Route path="/device-detail" element={<DeviceDetails />} />
        <Route path="/device-details" element={<DeviceDetails />} />
        <Route path="/alerts" element={<AlertCenter />} />
        <Route path="/notification-detail" element={<AlertCenter />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/account" element={<Account />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/weather" element={<WeatherMonitor />} />
        <Route path="/climate-risk-radar" element={<ClimateRiskRadar />} />
        <Route path="/disaster-radar" element={<ClimateRiskRadar />} />
        <Route path="/precision-soil-testing" element={<SoilForensics />} />
        <Route path="/crop-advisor" element={<FarmAdvisor />} />
        <Route path="/pest-management" element={<PestManagement />} />
        <Route path="/pest-analysis" element={<PestManagement />} />
        <Route path="/yield-water-analytics" element={<YieldWaterAnalytics />} />
        <Route path="/yield-forecast" element={<YieldWaterAnalytics />} />
        <Route path="/water-conservation" element={<YieldWaterAnalytics />} />
        <Route path="/actuators" element={<ActuatorControl />} />
        <Route path="/irrigation" element={<IrrigationControl />} />
        <Route path="/irrigation-control" element={<IrrigationControl />} />
        {/* Graceful Fallback Redirects for Removed Screens */}
        <Route path="/camera" element={<Navigate to="/dashboard" replace />} />
        <Route path="/mqtt-config" element={<Navigate to="/device-area" replace />} />
        <Route path="/fertilizer-engine" element={<Navigate to="/crop-advisor" replace />} />
        <Route path="/ai-vision" element={<Navigate to="/crop-advisor" replace />} />
        <Route path="/crop-vision" element={<Navigate to="/crop-advisor" replace />} />
        <Route path="/vision" element={<Navigate to="/crop-advisor" replace />} />
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        {/* 📜 LEGAL & COMPLIANCE (inside app shell) */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/cookies" element={<Navigate to="/cookie-policy" replace />} />
        <Route path="/refund-policy" element={<Navigate to="/terms" replace />} />
        {/* 📖 ABOUT & CONTACT (inside app shell) */}
        <Route path="/about-us" element={<AboutKrishiSethu />} />
        <Route path="/about" element={<Navigate to="/about-us" replace />} />
        <Route path="/about-krishisethu" element={<Navigate to="/about-us" replace />} />
        <Route path="/help-docs" element={<Navigate to="/about-us" replace />} />
        <Route path="/docs" element={<Navigate to="/about-us" replace />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/contact" element={<Navigate to="/contact-us" replace />} />
        <Route path="/404" element={<NotFound />} />
      </Route>

      <Route path="/profile" element={<Navigate to="/account" />} />
      <Route path="*" element={<React.Suspense fallback={<PageLoader />}><NotFound /></React.Suspense>} />
    </Routes>
  );
};


// Helper to bridge AppContext and TelemetryProvider
// ⚠️ MUST be defined BEFORE App() so it is not accessed before initialization (const is not hoisted)
const TelemetryWrapper = ({ children }) => {
  const { user, farmInfo, nodePower } = useApp();
  return (
    <TelemetryProvider user={user} farmInfo={farmInfo} nodePower={nodePower}>
      {children}
    </TelemetryProvider>
  );
};

export default function App() {
  console.log("🛠️ [APP]: Rendering App component");
  return (
    <Router>
      <AppProvider>
        <ErrorBoundary>
          <TelemetryWrapper>
            <React.Suspense fallback={<PageLoader />}>
              <AppRoutes />
            </React.Suspense>
          </TelemetryWrapper>
        </ErrorBoundary>
      </AppProvider>
    </Router>
  );
}


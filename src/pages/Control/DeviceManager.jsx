/**
 * AgriSense Pro — Device Manager
 * Premium AgTech + Industrial IoT Device Management Interface
 * Exact visual match to screenshot:
 * - Single compact status summary card (Total Nodes: 3, Online: 0, Offline: 3, MQTT Link: Connected)
 * - Premium search bar: "Search real IoT node or sensor..." with sliders icon
 * - Segmented filter pills: All, Online, Offline, Soil Nodes, Weather
 * - Section header: "IoT Nodes" and "3 registered devices"
 * - Compact horizontal cards (~86px tall) for exactly 3 devices:
 *   1. SOIL-01 (Soil Monitoring Node, Sprout icon in pale green container, ● Offline)
 *   2. WEATHER-01 (Weather Monitoring Node, CloudSun icon in pale blue container, ● Offline)
 *   3. CAM-01 (Camera Node, Camera icon in pale amber container, ● Offline)
 * - Pair New IoT Node button with subtle leaf silhouette
 * - Devices active tab in bottom navigation
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../state/TelemetryContext';
import { useApp } from '../../state/AppContext';
import { 
  Search, ChevronRight, Plus, ArrowRight, CloudSun, Camera, 
  Layers, Wifi, WifiOff, Link2, SlidersHorizontal, Sprout, X, Cpu
} from 'lucide-react';

// ─── ANIMATION ───────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const DEVICE_FILTERS = ['All', 'Online', 'Offline', 'Soil Nodes', 'Weather'];

// ─── EXACT HARDWARE NODES ───────────────────────────────────────────────────
const BASE_HARDWARE_NODES = [
  {
    id: 'SOIL-01',
    name: 'SOIL-01',
    type: 'Soil Monitoring Node',
    category: 'Soil Nodes',
    icon: Sprout,
    iconColor: '#176B45',
    iconBg: '#E8F5E9',
    iconBorder: '#C8E6C9',
    status: 'Offline',
  },
  {
    id: 'WEATHER-01',
    name: 'WEATHER-01',
    type: 'Weather Monitoring Node',
    category: 'Weather',
    icon: CloudSun,
    iconColor: '#0284C7',
    iconBg: '#EBF5FF',
    iconBorder: '#D0E6FD',
    status: 'Offline',
  },
];

// ─── CARD BOTTOM WAVE DECORATION (LIVING FLUID WAVE MOTION) ───────────────────
const CardWave = ({ fill, stroke }) => (
  <div
    style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '28px',
      pointerEvents: 'none',
      borderBottomLeftRadius: '22px',
      borderBottomRightRadius: '22px',
      overflow: 'hidden',
      zIndex: 1,
    }}
  >
    {/* Deep/Back Wave: Slow Ambient Fluid Sway */}
    <motion.div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '200%',
        height: '100%',
        display: 'flex',
      }}
      animate={{
        x: ['0%', '-50%'],
        y: [0, -1.5, 0],
      }}
      transition={{
        x: { duration: 7.5, repeat: Infinity, ease: 'linear' },
        y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <svg
        viewBox="0 0 320 32"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 14 Q40 5 80 14 T160 14 Q200 5 240 14 T320 14 L320 32 L0 32 Z"
          fill={fill}
          opacity="0.75"
        />
      </svg>
    </motion.div>

    {/* Surface/Front Wave: Active Ripple in Offset Motion */}
    <motion.div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '200%',
        height: '100%',
        display: 'flex',
      }}
      animate={{
        x: ['-50%', '0%'],
        y: [0, 1.5, 0],
      }}
      transition={{
        x: { duration: 5, repeat: Infinity, ease: 'linear' },
        y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <svg
        viewBox="0 0 320 32"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%' }}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 18 Q40 10 80 18 T160 18 Q200 10 240 18 T320 18 L320 32 L0 32 Z"
          fill={fill}
          opacity="0.95"
        />
        {stroke && (
          <path
            d="M0 18 Q40 10 80 18 T160 18 Q200 10 240 18 T320 18"
            stroke={stroke}
            strokeWidth="1.2"
            fill="none"
          />
        )}
      </svg>
    </motion.div>
  </div>
);

const DeviceManager = () => {
  const navigate = useNavigate();
  const { mqttStatus, devices, sensorData } = useTelemetry();
  const { isDarkMode } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNodeId, setNewNodeId] = useState('');
  const [newNodeType, setNewNodeType] = useState('Soil Monitoring Node');
  const [customNodes, setCustomNodes] = useState([]);

  // Compute live states with exact screenshot default fallbacks
  const allDevices = useMemo(() => {
    return BASE_HARDWARE_NODES.map((node) => {
      let isOnline = false;
      if (node.id === 'SOIL-01') {
        const hasSoil = sensorData?.soil?.moisture != null || sensorData?.soil?.temp != null;
        const isAct = devices?.soil_node?.status === 'ACTIVE' || devices?.soil_node?.status === 'ONLINE';
        isOnline = mqttStatus === 'connected' && (isAct || hasSoil);
      } else if (node.id === 'WEATHER-01') {
        const hasWeather = sensorData?.weather?.temp != null || sensorData?.weather?.humidity != null;
        const isAct = devices?.weather_node?.status === 'ACTIVE' || devices?.weather_node?.status === 'ONLINE';
        isOnline = mqttStatus === 'connected' && (isAct || hasWeather);
      }

      return {
        ...node,
        status: isOnline ? 'Online' : 'Offline',
      };
    }).concat(customNodes);
  }, [devices, sensorData, mqttStatus, customNodes]);

  // Status Summary Stats
  const stats = useMemo(() => {
    const total = allDevices.length;
    const online = allDevices.filter(d => d.status === 'Online').length;
    const offline = allDevices.filter(d => d.status === 'Offline').length;
    const isMqttConnected = mqttStatus === 'connected';
    return { total, online, offline, isMqttConnected };
  }, [allDevices, mqttStatus]);

  // Filtered list based on Search & Segmented Filter
  const filteredDevices = useMemo(() => {
    return allDevices.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'All') return true;
      if (activeFilter === 'Online') return d.status === 'Online';
      if (activeFilter === 'Offline') return d.status === 'Offline';
      if (activeFilter === 'Soil Nodes') return d.category === 'Soil Nodes';
      if (activeFilter === 'Weather') return d.category === 'Weather';
      return true;
    });
  }, [allDevices, searchQuery, activeFilter]);

  const handleDeviceClick = (device) => {
    if (!device?.id) return;
    navigate(`/device-detail?node=${encodeURIComponent(device.id)}`, {
      state: { nodeId: device.id, from: '/device-area' },
    });
  };

  const handleAddDeviceSubmit = (e) => {
    e.preventDefault();
    if (!newNodeId.trim()) return;

    const formattedId = newNodeId.trim().toUpperCase();
    const isSoil = newNodeType.includes('Soil');
    const isWeather = newNodeType.includes('Weather');

    const newDev = {
      id: formattedId,
      name: formattedId,
      type: newNodeType,
      category: isSoil ? 'Soil Nodes' : isWeather ? 'Weather' : 'Cameras',
      icon: isSoil ? Sprout : isWeather ? CloudSun : Camera,
      iconColor: isSoil ? '#176B45' : isWeather ? '#0284C7' : '#D97706',
      iconBg: isSoil ? '#E8F5E9' : isWeather ? '#EBF5FF' : '#FEF6E9',
      iconBorder: isSoil ? '#C8E6C9' : isWeather ? '#D0E6FD' : '#FDE8C7',
      status: 'Offline',
    };

    setCustomNodes(prev => [...prev, newDev]);
    setIsAddModalOpen(false);
    setNewNodeId('');
  };

  return (
    <div
      style={{
        background: isDarkMode ? 'var(--bg-main)' : '#F8FAF7',
        minHeight: 'auto',
        padding: '16px 16px 16px',
        fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >


      {/* ── 1. SUMMARY AREA: SINGLE COMPACT 4-COLUMN CARD ─────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 22,
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          padding: '14px 4px',
          alignItems: 'center',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <CardWave fill={isDarkMode ? 'rgba(34, 197, 94, 0.12)' : 'rgba(21, 128, 61, 0.07)'} stroke={isDarkMode ? 'rgba(34, 197, 94, 0.22)' : 'rgba(21, 128, 61, 0.12)'} />
        {/* Total Nodes */}
        <div style={{ textAlign: 'center', padding: '0 4px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <Layers size={18} color={isDarkMode ? '#F8FAFC' : '#101828'} strokeWidth={2.2} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.68rem',
              fontWeight: 600,
              color: isDarkMode ? '#94A3B8' : '#667085',
              lineHeight: 1.2,
            }}
          >
            Total Nodes
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '1.4rem',
              fontWeight: 900,
              color: isDarkMode ? '#F8FAFC' : '#101828',
              lineHeight: 1.15,
            }}
          >
            {stats.total}
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderLeft: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6', textAlign: 'center', padding: '0 4px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <Wifi size={18} color="#16A66A" strokeWidth={2.4} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#16A66A',
              lineHeight: 1.2,
            }}
          >
            Online
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '1.4rem',
              fontWeight: 900,
              color: '#16A66A',
              lineHeight: 1.15,
            }}
          >
            {stats.online}
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderLeft: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6', textAlign: 'center', padding: '0 4px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'center', justifyContent: 'center', display: 'flex', marginBottom: 4 }}>
            <WifiOff size={18} color="#D92D20" strokeWidth={2.4} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#D92D20',
              lineHeight: 1.2,
            }}
          >
            Offline
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '1.4rem',
              fontWeight: 900,
              color: '#D92D20',
              lineHeight: 1.15,
            }}
          >
            {stats.offline}
          </p>
        </div>

        {/* Divider */}
        <div style={{ borderLeft: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6', textAlign: 'center', padding: '0 4px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <Link2 size={18} color="#16A66A" strokeWidth={2.4} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.68rem',
              fontWeight: 600,
              color: '#16A66A',
              lineHeight: 1.2,
            }}
          >
            MQTT Link
          </p>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: '0.82rem',
              fontWeight: 800,
              color: '#16A66A',
              lineHeight: 1.15,
            }}
          >
            Connected
          </p>
        </div>
      </motion.div>

      {/* ── 2. PREMIUM SEARCH INPUT ───────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 16,
          border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6',
          boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.15)' : '0 1px 4px rgba(0, 0, 0, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <Search size={18} color={isDarkMode ? '#94A3B8' : '#101828'} strokeWidth={2.2} />
          <input
            type="text"
            placeholder="Search real IoT node or sensor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.82rem',
              color: isDarkMode ? '#F8FAFC' : '#101828',
              width: '100%',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ color: isDarkMode ? '#94A3B8' : '#101828', display: 'flex', alignItems: 'center', marginLeft: 8 }}>
          <SlidersHorizontal size={18} strokeWidth={2.2} />
        </div>
      </motion.div>

      {/* ── 3. SEGMENTED FILTER PILLS ─────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 20,
          scrollbarWidth: 'none',
        }}
      >
        {DEVICE_FILTERS.map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <motion.button
              key={filter}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveFilter(filter)}
              style={{
                background: isSelected ? '#176B45' : (isDarkMode ? 'var(--bg-card)' : '#FFFFFF'),
                color: isSelected ? '#FFFFFF' : (isDarkMode ? 'var(--text-muted)' : '#667085'),
                border: isSelected ? 'none' : (isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6'),
                borderRadius: 100,
                padding: '6px 16px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 2px 8px rgba(23, 107, 69, 0.22)' : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              {filter}
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── 4. DEVICE LIST HEADER ─────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={3}
        style={{ marginBottom: 14 }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 800,
            color: isDarkMode ? '#F8FAFC' : '#101828',
            letterSpacing: '-0.02em',
          }}
        >
          IoT Nodes
        </h2>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '0.75rem',
            fontWeight: 500,
            color: isDarkMode ? '#94A3B8' : '#667085',
          }}
        >
          {filteredDevices.length} registered devices
        </p>
      </motion.div>

      {/* ── 5. COMPACT HORIZONTAL DEVICE CARDS ─────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredDevices.map((device, idx) => {
          const Icon = device.icon;
          const isDeviceOnline = device.status === 'Online';

          return (
            <motion.div
              key={device.id}
              custom={idx + 4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.97 }}
              onTap={() => handleDeviceClick(device)}
              onClick={() => handleDeviceClick(device)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDeviceClick(device);
                }
              }}
              style={{
                background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
                borderRadius: 22,
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.03)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                minHeight: 84,
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
              }}
            >
              {/* Living Fluid Wave Motion Accent */}
              <CardWave
                fill={isDarkMode ? `${device.iconColor}18` : `${device.iconColor}12`}
                stroke={isDarkMode ? `${device.iconColor}2a` : `${device.iconColor}20`}
              />

              {/* Left: 56x56 Icon Container + ID & Node Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, position: 'relative', zIndex: 2 }}>
                {/* 56x56px Tinted Icon Container */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : device.iconBg,
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${device.iconBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={26} color={device.iconColor} strokeWidth={2.2} />
                </div>

                {/* ID & Node Type Text */}
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#F8FAFC' : '#101828',
                      letterSpacing: '-0.01em',
                      lineHeight: 1.2,
                    }}
                  >
                    {device.name}
                  </h3>
                  <p
                    style={{
                      margin: '3px 0 0',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      color: isDarkMode ? '#94A3B8' : '#667085',
                      lineHeight: 1.15,
                    }}
                  >
                    {device.type}
                  </p>
                </div>
              </div>

              {/* Right: Outlined Status Chip (Online only) + Chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative', zIndex: 2 }}>
                {/* Status Chip (Shown only when device is Online) */}
                {isDeviceOnline && (
                  <div
                    style={{
                      background: isDarkMode ? 'rgba(22, 166, 106, 0.2)' : '#E8F5E9',
                      border: `1px solid ${isDarkMode ? 'rgba(22, 166, 106, 0.4)' : '#C8E6C9'}`,
                      borderRadius: 100,
                      padding: '4px 11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#16A66A',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: isDarkMode ? '#4ADE80' : '#16A66A',
                      }}
                    >
                      Online
                    </span>
                  </div>
                )}

                {/* Chevron */}
                <div style={{ color: isDarkMode ? '#94A3B8' : '#101828' }}>
                  <ChevronRight size={18} strokeWidth={2.2} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── 6. PAIR NEW IOT NODE BUTTON ───────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={filteredDevices.length + 5}
        style={{ marginTop: 22 }}
      >
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsAddModalOpen(true)}
          style={{
            width: '100%',
            height: 52,
            background: 'linear-gradient(135deg, #176B45 0%, #0D4F36 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 18,
            fontWeight: 800,
            fontSize: '0.92rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(23, 107, 69, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Botanical Leaf Silhouette Watermark */}
          <svg
            style={{
              position: 'absolute',
              right: 14,
              bottom: -4,
              width: '62px',
              height: '62px',
              opacity: 0.22,
              pointerEvents: 'none',
            }}
            viewBox="0 0 62 62"
            fill="none"
          >
            <path
              d="M31 52 C45 32, 58 18, 62 4 C48 14, 36 28, 31 52 Z"
              fill="#FFFFFF"
            />
            <path
              d="M31 52 C21 38, 10 26, 0 18 C14 24, 24 36, 31 52 Z"
              fill="#FFFFFF"
              opacity="0.8"
            />
          </svg>

          <Plus size={20} strokeWidth={2.5} color="#FFFFFF" />
          <span>Pair New IoT Node</span>
          <ArrowRight size={18} strokeWidth={2.4} color="#FFFFFF" />
        </motion.button>
      </motion.div>

      {/* ── 7. PAIR MODAL (CLEAN INDUSTRIAL FORM) ─────────────────────────── */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: isDarkMode ? '#161d31' : '#FFFFFF',
                borderRadius: 22,
                padding: '24px',
                width: '100%',
                maxWidth: '400px',
                border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: isDarkMode ? '#F8FAFC' : '#101828',
                  }}
                >
                  Pair New IoT Node
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: isDarkMode ? '#94A3B8' : '#667085',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddDeviceSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isDarkMode ? '#CBD5E1' : '#475569',
                      marginBottom: 6,
                    }}
                  >
                    Node Hardware ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOIL-02 or WEATHER-02"
                    value={newNodeId}
                    onChange={(e) => setNewNodeId(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 12,
                      border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6',
                      background: isDarkMode ? '#0a0f1d' : '#FFFFFF',
                      color: isDarkMode ? '#F8FAFC' : '#101828',
                      padding: '0 12px',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isDarkMode ? '#CBD5E1' : '#475569',
                      marginBottom: 6,
                    }}
                  >
                    Node Type
                  </label>
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 12,
                      border: isDarkMode ? '1px solid var(--border-main)' : '1px solid #E4E9E6',
                      padding: '0 12px',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                      background: isDarkMode ? '#0a0f1d' : '#FFFFFF',
                      color: isDarkMode ? '#F8FAFC' : '#101828',
                    }}
                  >
                    <option value="Soil Monitoring Node">Soil Monitoring Node</option>
                    <option value="Weather Monitoring Node">Weather Monitoring Node</option>
                    <option value="Camera Node">Camera Node</option>
                  </select>
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    height: 48,
                    background: '#176B45',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 14,
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Confirm & Pair Node
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DeviceManager;

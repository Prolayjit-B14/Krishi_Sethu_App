import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { auth } from '../../api/firebase';
import FarmInformationDetails from './FarmInformationDetails';
import { 
  Sprout, LogOut, Check, Pencil, X, Camera, User, Mail, Upload, Trash2, AlertTriangle
} from 'lucide-react';

const Account = () => {
  const navigate = useNavigate();
  const { user, farmInfo, updateUser, updateBranding, logout, deleteAccount, isDarkMode, currentGPS } = useApp();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarError, setAvatarError] = useState(false);

  // ─── EDIT PROFILE MODAL STATE ──────────────────────────────────────────
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || 'Pro B');
  const [editEmail, setEditEmail] = useState(user?.email || 'contact.prolay14@gmail.com');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || user?.photo || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const openEditModal = () => {
    setEditName(user?.name || 'Pro B');
    setEditEmail(user?.email || 'contact.prolay14@gmail.com');
    setEditPhoto(user?.photoURL || user?.photo || '');
    setProfileSaveSuccess(false);
    setIsEditModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert("Please select an image smaller than 3MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      if (updateUser) {
        await updateUser({
          name: editName.trim() || user?.name || 'Pro B',
          email: editEmail.trim() || user?.email || 'contact.prolay14@gmail.com',
          photoURL: editPhoto || user?.photoURL || '',
          photo: editPhoto || user?.photo || ''
        });
      }
      setAvatarError(false);
      setProfileSaveSuccess(true);
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setIsEditModalOpen(false);
      }, 700);
    } catch (err) {
      console.warn("Failed to update profile:", err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // ─── COMPREHENSIVE FARM PROFILE STATE ─────────────────────────────────────
  const [farmProfile, setFarmProfile] = useState(() => {
    return {
      // Card 01 — Farm Identity
      name: farmInfo?.name || 'Krishnanagar Precision Farm',
      farmId: farmInfo?.farmId || 'FARM-WB-NADIA-01',
      managerName: farmInfo?.managerName || user?.name || 'Prolayjit Biswas',
      farmType: farmInfo?.farmType || 'Open Field',

      // Card 02 — Location
      state: farmInfo?.state || 'West Bengal',
      district: farmInfo?.district || 'Nadia',
      village: farmInfo?.village || 'Krishnanagar Field Zone',
      latitude: farmInfo?.latitude || (currentGPS?.lat ? currentGPS.lat.toFixed(4) : '23.4013'),
      longitude: farmInfo?.longitude || (currentGPS?.lng ? currentGPS.lng.toFixed(4) : '88.4960'),
      elevation: farmInfo?.elevation || '14 m MSL',

      // Card 03 — Crop & Growing Season
      crops: farmInfo?.crops && farmInfo.crops.length > 0 ? farmInfo.crops : [
        {
          id: 'crop-1',
          category: 'Cereal',
          name: 'Rice',
          variety: 'Swarna (MTU 7029)',
          season: 'Kharif',
          sowingDate: '2024-06-15',
          harvestDate: '2024-11-20'
        }
      ],

      // Card 04 — Farm & Soil Profile
      area: farmInfo?.area || '2.5',
      areaUnit: farmInfo?.areaUnit || 'Acre',
      soilType: farmInfo?.soilType || 'Loamy',
      soilTexture: farmInfo?.soilTexture || 'Fine alluvial silt-clay loam',
      irrigationType: farmInfo?.irrigationType || 'Drip',
      waterSource: farmInfo?.waterSource || 'Borewell',

      // Card 05 — Sensor Optimal Ranges
      sensorRanges: {
        soilMoisture:    farmInfo?.sensorRanges?.soilMoisture    || { min: 30,   max: 80    },
        soilTemperature: farmInfo?.sensorRanges?.soilTemperature || { min: 15,   max: 35    },
        soilPh:          farmInfo?.sensorRanges?.soilPh          || { min: 5.5,  max: 7.5   },
        airTemperature:  farmInfo?.sensorRanges?.airTemperature  || { min: 10,   max: 40    },
        humidity:        farmInfo?.sensorRanges?.humidity        || { min: 40,   max: 90    },
        light:           farmInfo?.sensorRanges?.light           || { min: 1000, max: 80000 },
        rainfall:        farmInfo?.sensorRanges?.rainfall        || { min: 0,    max: 50    },
        nitrogen:        farmInfo?.sensorRanges?.nitrogen        || { min: 40,   max: 60    },
        phosphorus:      farmInfo?.sensorRanges?.phosphorus      || { min: 20,   max: 40    },
        potassium:       farmInfo?.sensorRanges?.potassium       || { min: 30,   max: 50    },
        npk:             farmInfo?.sensorRanges?.npk             || { min: 10,   max: 300   }
      },

      // Legacy — kept for Settings screen compatibility
      alerts: farmInfo?.alerts || {
        lowRangeAlert: true,
        highRangeAlert: true,
        criticalAlert: true,
        alertDelay: '30 sec',
        pushNotification: true
      },
      automation: farmInfo?.automation || {
        autoIrrigation: true,
        useSoilMoistureThreshold: true,
        pumpStartThreshold: 40,
        pumpStopThreshold: 70
      }
    };
  });

  // Save Full Farm Profile
  const handleSaveFarmProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    try {
      await updateBranding({
        ...farmInfo,
        ...farmProfile,
        sensorRanges: farmInfo?.sensorRanges || farmProfile.sensorRanges,
        name: farmProfile.name
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.warn("Save farm error:", err);
      setErrorMessage(err.message || 'Failed to update farm profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const initial = (user?.name || user?.email || 'P').charAt(0).toUpperCase();

  // Avatar Resolution: Google account image -> Email unavatar -> Fallback letter
  const avatarUrl = !avatarError ? (
    user?.photoURL ||
    user?.photo ||
    auth?.currentUser?.photoURL ||
    auth?.currentUser?.providerData?.find(p => p?.photoURL)?.photoURL ||
    (user?.email ? `https://unavatar.io/${encodeURIComponent(user.email)}` : null)
  ) : null;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      background: 'var(--bg-main)',
      fontFamily: "'Outfit', sans-serif",
      boxSizing: 'border-box',
      minHeight: '100%',
      gap: 18
    }}>

      {/* ─── 1. BOTANICAL PROFILE HERO CARD ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: isDarkMode ? 'var(--bg-card)' : '#FFFFFF',
          borderRadius: 24,
          padding: '24px 20px 20px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 2px 12px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top-Right Pencil Edit Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.06 }}
          onClick={openEditModal}
          type="button"
          title="Edit Profile"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 34,
            height: 34,
            borderRadius: 10,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
            color: isDarkMode ? '#CBD5E1' : '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            zIndex: 3
          }}
        >
          <Pencil size={15} strokeWidth={2.4} />
        </motion.button>

        {/* Subtle Decorative Botanical Glow */}
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: isDarkMode ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Avatar with Status Ring */}
        <div 
          onClick={openEditModal}
          title="Click to edit profile"
          style={{ position: 'relative', marginBottom: 14, cursor: 'pointer' }}
        >
          <div style={{
            width: 78,
            height: 78,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.1rem',
            fontWeight: 900,
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.35)',
            border: isDarkMode ? '3px solid #1E293B' : '3px solid #FFFFFF',
            overflow: 'hidden'
          }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user?.name || "Avatar"} 
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setAvatarError(true)}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              initial
            )}
          </div>

          <span style={{
            position: 'absolute',
            bottom: 2,
            right: 4,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#10B981',
            border: isDarkMode ? '2.5px solid #161D31' : '2.5px solid #FFFFFF',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
            zIndex: 2
          }} />
        </div>

        {/* User Name */}
        <h2 style={{
          fontSize: '1.35rem',
          fontWeight: 900,
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          margin: '0 0 4px 0',
          letterSpacing: '-0.02em'
        }}>
          {user?.name || 'Pro B'}
        </h2>

        {/* Email */}
        <div style={{ fontSize: '0.84rem', color: isDarkMode ? '#94A3B8' : '#64748B', fontWeight: 500 }}>
          {user?.email || 'contact.prolay14@gmail.com'}
        </div>
      </motion.div>

      {/* ─── 2. FARM INFORMATION — Always Visible ───────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: isDarkMode ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
            border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #FDE68A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Sprout size={16} color="#F59E0B" strokeWidth={2.2} />
          </div>
          <h3 style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: isDarkMode ? '#94A3B8' : '#64748B',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            margin: 0
          }}>
            FARM INFORMATION
          </h3>
        </div>

        <FarmInformationDetails
          farmProfile={farmProfile}
          setFarmProfile={setFarmProfile}
          isDarkMode={isDarkMode}
          errorMessage={errorMessage}
          handleSaveFarmProfile={handleSaveFarmProfile}
          isSaving={isSaving}
          saveSuccess={saveSuccess}
        />
      </div>


      {/* ─── 3. SIGN OUT ACTION ────────────────────────────────────────── */}
      <div style={{ marginTop: 8, marginBottom: 12 }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          whileHover={{ 
            backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2',
            borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.38)' : '#FCA5A5'
          }}
          onClick={handleSignOut}
          type="button"
          style={{
            width: '100%',
            height: 48,
            borderRadius: 14,
            background: isDarkMode ? 'rgba(239, 68, 68, 0.07)' : '#FEF2F2',
            border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.22)' : '1px solid #FECACA',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            transition: 'all 0.15s ease',
            outline: 'none',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(239, 68, 68, 0.05)',
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: isDarkMode ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <LogOut size={15} color="#EF4444" strokeWidth={2.5} />
          </div>
          <span>Sign Out</span>
        </motion.button>
      </div>

      {/* ─── 4. EDIT PROFILE MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.18 }}
              style={{
                width: '100%',
                maxWidth: 400,
                background: isDarkMode ? '#1E293B' : '#FFFFFF',
                borderRadius: 24,
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
                padding: '22px 20px 20px',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: isDarkMode ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981'
                  }}>
                    <Pencil size={17} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isDarkMode ? '#F8FAFC' : '#0F172A' }}>
                      Edit Profile
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: isDarkMode ? '#94A3B8' : '#64748B' }}>
                      Update your name, email & avatar
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                    border: 'none',
                    color: isDarkMode ? '#94A3B8' : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} strokeWidth={2.4} />
                </button>
              </div>

              {/* Avatar Change Section */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                marginBottom: 18,
                padding: '12px',
                borderRadius: 16,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9'
              }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.9rem',
                    fontWeight: 900,
                    overflow: 'hidden',
                    border: isDarkMode ? '2.5px solid #334155' : '2.5px solid #FFFFFF',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)'
                  }}>
                    {(editPhoto || avatarUrl) ? (
                      <img
                        src={editPhoto || avatarUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      (editName || user?.name || 'P').charAt(0).toUpperCase()
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload Image"
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: '#10B981',
                      border: isDarkMode ? '2px solid #1E293B' : '2px solid #FFFFFF',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  >
                    <Camera size={13} strokeWidth={2.6} />
                  </button>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 8,
                      background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                      border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #BBF7D0',
                      color: isDarkMode ? '#4ADE80' : '#15803D',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={12} strokeWidth={2.5} />
                    <span>Upload Photo</span>
                  </button>

                  {editPhoto && (
                    <button
                      type="button"
                      onClick={() => setEditPhoto('')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        background: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                        border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FECACA',
                        color: '#EF4444',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: isDarkMode ? '#CBD5E1' : '#334155',
                    marginBottom: 6
                  }}>
                    <User size={13} color="#10B981" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your name"
                    required
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 12,
                      border: isDarkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #E2E8F0',
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      padding: '0 13px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: isDarkMode ? '#CBD5E1' : '#334155',
                    marginBottom: 6
                  }}>
                    <Mail size={13} color="#3B82F6" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={{
                      width: '100%',
                      height: 42,
                      borderRadius: 12,
                      border: isDarkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1.5px solid #E2E8F0',
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC',
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      padding: '0 13px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Modal Action Buttons */}
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    style={{
                      flex: 1,
                      height: 42,
                      borderRadius: 12,
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
                      color: isDarkMode ? '#CBD5E1' : '#475569',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isUpdatingProfile}
                    style={{
                      flex: 1.4,
                      height: 42,
                      borderRadius: 12,
                      background: profileSaveSuccess
                        ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7')
                        : 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                      border: profileSaveSuccess
                        ? '1px solid #10B981'
                        : 'none',
                      color: profileSaveSuccess
                        ? (isDarkMode ? '#4ADE80' : '#15803D')
                        : '#FFFFFF',
                      fontSize: '0.84rem',
                      fontWeight: 800,
                      cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: profileSaveSuccess ? 'none' : '0 3px 10px rgba(21, 128, 61, 0.28)'
                    }}
                  >
                    <Check size={15} strokeWidth={2.8} />
                    <span>{isUpdatingProfile ? "Saving..." : (profileSaveSuccess ? "Updated!" : "Save Changes")}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Account;

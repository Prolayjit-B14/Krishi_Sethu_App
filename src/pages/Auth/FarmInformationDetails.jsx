import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, ChevronDown,
  Building2, Globe, MapPin, Maximize2, Layers, Sun
} from "lucide-react";

/* ─── Compact Colorful Lucide Icon Badge (matching Farm Information title style) ─── */
const iconBadge = (isDarkMode, color, darkBg, lightBg, lightBorder) => ({
  width: 28,
  height: 28,
  borderRadius: 8,
  background: isDarkMode ? darkBg : lightBg,
  border: isDarkMode ? `1px solid ${color}33` : `1px solid ${lightBorder}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
});

const CustomSelect = ({ value, onChange, options, placeholder = "Select...", isDarkMode, minWidth }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Update rect on open/scroll/resize
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const r = triggerRef.current.getBoundingClientRect();
      setRect(r);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const selected = options.find(o => (o.value ?? o) === value);
  const label = selected ? (selected.label ?? selected) : placeholder;

  const toggle = () => {
    if (!open && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setOpen(o => !o);
  };

  const spaceBelow = window.innerHeight - (rect?.bottom || 0);
  const showAbove = spaceBelow < 220 && (rect?.top || 0) > 220;

  const panel = open && rect && ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        key="panel"
        initial={{ opacity: 0, y: showAbove ? 4 : -4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: showAbove ? 4 : -4, scale: 0.97 }}
        transition={{ duration: 0.14 }}
        style={{
          position: "fixed",
          ...(showAbove
            ? { bottom: window.innerHeight - rect.top + 6 }
            : { top: rect.bottom + 6 }),
          right: Math.max(12, window.innerWidth - rect.right),
          minWidth: Math.max(rect.width, 130),
          width: "max-content",
          maxWidth: "calc(100vw - 24px)",
          maxHeight: 280,
          overflowY: "auto",
          zIndex: 99999,
          background: isDarkMode ? "#1E293B" : "#FFFFFF",
          borderRadius: 14,
          border: isDarkMode ? "1px solid rgba(255,255,255,0.14)" : "1px solid #E2E8F0",
          boxShadow: isDarkMode
            ? "0 16px 48px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)"
            : "0 8px 30px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          padding: "5px",
        }}
      >
        {options.map((opt) => {
          const val = opt.value ?? opt;
          const lbl = opt.label ?? opt;
          const isSelected = val === value;
          return (
            <button
              key={val}
              type="button"
              onClick={() => { onChange(val); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                width: "100%",
                padding: "8px 12px",
                borderRadius: 10,
                border: "none",
                background: isSelected
                  ? (isDarkMode ? "rgba(16,185,129,0.15)" : "#F0FDF4")
                  : "transparent",
                color: isSelected
                  ? (isDarkMode ? "#4ADE80" : "#15803D")
                  : (isDarkMode ? "#CBD5E1" : "#334155"),
                fontSize: "0.86rem",
                fontWeight: isSelected ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
                whiteSpace: "nowrap",
                transition: "background 0.1s ease",
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? (isDarkMode ? "rgba(16,185,129,0.15)" : "#F0FDF4") : "transparent"; }}
            >
              <span>{lbl}</span>
              {isSelected && <Check size={14} strokeWidth={2.8} style={{ marginLeft: 8, flexShrink: 0 }} />}
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>,
    document.body
  );

  return (
    <div style={{ position: "relative", display: "inline-flex", width: "fit-content", flexShrink: 0 }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          height: 36,
          width: "auto",
          minWidth: minWidth || "fit-content",
          padding: "0 10px 0 12px",
          borderRadius: 10,
          border: open
            ? (isDarkMode ? "1.5px solid rgba(16,185,129,0.5)" : "1.5px solid #10B981")
            : (isDarkMode ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #E2E8F0"),
          background: isDarkMode
            ? (open ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.05)")
            : (open ? "#F0FDF4" : "#F8FAFC"),
          color: value
            ? (isDarkMode ? "#F1F5F9" : "#0F172A")
            : (isDarkMode ? "#64748B" : "#94A3B8"),
          fontSize: "0.88rem",
          fontWeight: 600,
          cursor: "pointer",
          outline: "none",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
          boxSizing: "border-box",
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>{label}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ display: "inline-flex", alignItems: "center" }}>
          <ChevronDown size={14} strokeWidth={2.5} style={{ flexShrink: 0, opacity: 0.6 }} />
        </motion.div>
      </button>
      {panel}
    </div>
  );
};




const REGIONS = [
  "Tropical", "Sub-Tropical", "Temperate",
  "Arid / Semi-Arid", "Mediterranean", "Highland / Montane"
];

const SOIL_TYPES = ["Sandy", "Loamy", "Clay", "Sandy Loam", "Clay Loam", "Silty"];

const SEASONS = ["Kharif", "Rabi", "Zaid", "Year-round"];

const rowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 16px",
  gap: 12,
  minHeight: 52,
};

const rowLabel = (isDarkMode) => ({
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: "0.88rem",
  fontWeight: 600,
  color: isDarkMode ? "#CBD5E1" : "#334155",
  flexShrink: 0,
  minWidth: 115,
});

const rowInput = (isDarkMode) => ({
  height: 36,
  borderRadius: 10,
  border: isDarkMode ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #E2E8F0",
  background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC",
  color: isDarkMode ? "#F8FAFC" : "#0F172A",
  padding: "0 11px",
  fontSize: "0.88rem",
  fontWeight: 600,
  outline: "none",
  boxSizing: "border-box",
  textAlign: "right",
  flex: 1,
  minWidth: 0,
  maxWidth: 200,
});

const divider = (isDarkMode) => ({
  height: 1,
  background: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
  margin: "0 16px",
});

const FarmInformationDetails = ({
  farmProfile,
  setFarmProfile,
  isDarkMode,
  errorMessage,
  handleSaveFarmProfile,
  isSaving,
  saveSuccess,
}) => {

  const set = (key, val) => setFarmProfile(p => ({ ...p, [key]: val }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>



      {errorMessage && (
        <div style={{
          background: isDarkMode ? "rgba(239,68,68,0.15)" : "#FEF2F2",
          border: isDarkMode ? "1px solid rgba(239,68,68,0.3)" : "1px solid #FECACA",
          color: "#EF4444",
          borderRadius: 12, padding: "10px 14px",
          fontSize: "0.82rem", fontWeight: 700, textAlign: "center",
        }}>
          {errorMessage}
        </div>
      )}

      {/* FARM DETAILS */}
      <div style={{
        background: isDarkMode ? "#111827" : "#FFFFFF",
        borderRadius: 18,
        border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
        overflow: "hidden",
      }}>

        <div style={rowStyle}>
          <span style={rowLabel(isDarkMode)}>
            <div style={iconBadge(isDarkMode, "#3B82F6", "rgba(59,130,246,0.15)", "#EFF6FF", "#BFDBFE")}>
              <Building2 size={15} color={isDarkMode ? "#60A5FA" : "#2563EB"} strokeWidth={2.2} />
            </div>
            Farm Name
          </span>
          <input type="text" placeholder="Farm name" value={farmProfile.name || ""}
            onChange={e => set("name", e.target.value)} style={rowInput(isDarkMode)} />
        </div>

        <div style={divider(isDarkMode)} />

        <div style={rowStyle}>
          <span style={rowLabel(isDarkMode)}>
            <div style={iconBadge(isDarkMode, "#10B981", "rgba(16,185,129,0.15)", "#ECFDF5", "#A7F3D0")}>
              <Globe size={15} color={isDarkMode ? "#34D399" : "#059669"} strokeWidth={2.2} />
            </div>
            Region
          </span>
          <CustomSelect
            value={farmProfile.region || ""}
            onChange={v => set("region", v)}
            options={REGIONS}
            placeholder="Select..."
            isDarkMode={isDarkMode}
          />
        </div>

        <div style={divider(isDarkMode)} />

        <div style={rowStyle}>
          <span style={rowLabel(isDarkMode)}>
            <div style={iconBadge(isDarkMode, "#EF4444", "rgba(239,68,68,0.15)", "#FEF2F2", "#FECACA")}>
              <MapPin size={15} color={isDarkMode ? "#F87171" : "#DC2626"} strokeWidth={2.2} />
            </div>
            Location
          </span>
          <input type="text" placeholder="City / Village" value={farmProfile.village || ""}
            onChange={e => set("village", e.target.value)} style={rowInput(isDarkMode)} />
        </div>

        <div style={divider(isDarkMode)} />

        <div style={rowStyle}>
          <span style={rowLabel(isDarkMode)}>
            <div style={iconBadge(isDarkMode, "#8B5CF6", "rgba(139,92,246,0.15)", "#F5F3FF", "#DDD6FE")}>
              <Maximize2 size={15} color={isDarkMode ? "#A78BFA" : "#7C3AED"} strokeWidth={2.2} />
            </div>
            Farm Area
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="text" placeholder="0.0" value={farmProfile.area || ""}
              onChange={e => set("area", e.target.value)}
              style={{ ...rowInput(isDarkMode), width: 64, flex: "none" }} />
            <CustomSelect
              value={farmProfile.areaUnit || "Acre"}
              onChange={v => set("areaUnit", v)}
              options={["Acre", "Hectare", "m\u00b2"]}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        <div style={divider(isDarkMode)} />

        <div style={rowStyle}>
          <span style={rowLabel(isDarkMode)}>
            <div style={iconBadge(isDarkMode, "#F59E0B", "rgba(245,158,11,0.15)", "#FFFBEB", "#FDE68A")}>
              <Layers size={15} color={isDarkMode ? "#FBBF24" : "#D97706"} strokeWidth={2.2} />
            </div>
            Soil Type
          </span>
          <CustomSelect
            value={farmProfile.soilType || ""}
            onChange={v => set("soilType", v)}
            options={SOIL_TYPES}
            placeholder="Select..."
            isDarkMode={isDarkMode}
          />
        </div>

        <div style={divider(isDarkMode)} />

        <div style={rowStyle}>
          <span style={rowLabel(isDarkMode)}>
            <div style={iconBadge(isDarkMode, "#EAB308", "rgba(234,179,8,0.15)", "#FEFCE8", "#FEF08A")}>
              <Sun size={15} color={isDarkMode ? "#FACC15" : "#CA8A04"} strokeWidth={2.2} />
            </div>
            Season
          </span>
          <CustomSelect
            value={farmProfile.currentSeason || ""}
            onChange={v => set("currentSeason", v)}
            options={SEASONS}
            placeholder="Select..."
            isDarkMode={isDarkMode}
          />
        </div>

        {handleSaveFarmProfile && (
          <>
            <div style={divider(isDarkMode)} />
            <div style={rowStyle}>
              <span style={rowLabel(isDarkMode)}>
                <div style={iconBadge(isDarkMode, "#10B981", "rgba(16,185,129,0.15)", "#ECFDF5", "#A7F3D0")}>
                  <Check size={15} color={isDarkMode ? "#34D399" : "#059669"} strokeWidth={2.4} />
                </div>
                Save Changes
              </span>

              <motion.button
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                type="button"
                onClick={handleSaveFarmProfile}
                disabled={isSaving}
                style={{
                  height: 36,
                  padding: "0 20px",
                  borderRadius: 10,
                  background: saveSuccess 
                    ? (isDarkMode ? "rgba(16, 185, 129, 0.2)" : "#DCFCE7") 
                    : "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
                  border: saveSuccess 
                    ? (isDarkMode ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #86EFAC") 
                    : "none",
                  color: saveSuccess 
                    ? (isDarkMode ? "#4ADE80" : "#15803D") 
                    : "#FFFFFF",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  boxShadow: saveSuccess ? "none" : "0 2px 8px rgba(21, 128, 61, 0.22)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                <Check size={14} strokeWidth={2.6} />
                <span>{isSaving ? "Saving..." : (saveSuccess ? "Saved!" : "Save")}</span>
              </motion.button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default FarmInformationDetails;

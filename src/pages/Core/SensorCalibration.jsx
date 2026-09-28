import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../state/AppContext";
import {
  ChevronDown, ChevronUp, Gauge,
  Droplets, Thermometer, Leaf, CloudSun, Wind, Sun,
  CloudRain, FlaskConical, Beaker, Hexagon
} from "lucide-react";

/* ─── High precision click/hold stepper with hidden spinners ─── */
const NumberStepper = ({
  value,
  onChange,
  min = -50,
  max = 100000,
  step = 1,
  isDarkMode,
  accentColor = "#10B981",
  width,
  placeholder,
  title,
}) => {
  const timerRef = useRef(null);
  const [textVal, setTextVal] = useState(String(value ?? ""));

  useEffect(() => {
    setTextVal(String(value ?? ""));
  }, [value]);

  const valueRef = useRef(value);
  valueRef.current = value;

  const handleStep = (dir) => {
    const current = parseFloat(valueRef.current) || 0;
    const s = step || 1;
    const next = dir === "up" ? current + s : current - s;
    const clamped = Math.max(min, Math.min(max, next));
    const result = s < 1 ? parseFloat(clamped.toFixed(1)) : Math.round(clamped);
    valueRef.current = result;
    setTextVal(String(result));
    onChange(result);
  };

  const startHold = (dir) => {
    handleStep(dir);
    timerRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        handleStep(dir);
      }, 80);
    }, 280);
  };

  const stopHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const inputWidth = width || 46;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 34,
        width: 66,
        borderRadius: 10,
        border: isDarkMode
          ? "1.5px solid rgba(255,255,255,0.14)"
          : "1.5px solid #CBD5E1",
        background: isDarkMode ? "#1E293B" : "#FFFFFF",
        overflow: "hidden",
        boxSizing: "border-box",
        flexShrink: 0,
        transition: "border-color 0.15s ease",
      }}
    >
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        title={title}
        value={textVal}
        onChange={(e) => {
          const val = e.target.value;
          if (/^[-+]?[0-9]*\.?[0-9]*$/.test(val) || val === "") {
            setTextVal(val);
            const num = parseFloat(val);
            if (!isNaN(num)) onChange(num);
          }
        }}
        onBlur={() => {
          const num = parseFloat(textVal);
          if (isNaN(num)) {
            setTextVal(String(value ?? 0));
            onChange(value ?? 0);
          } else {
            const clamped = Math.max(min, Math.min(max, num));
            const cleaned = (step || 1) < 1 ? parseFloat(clamped.toFixed(1)) : Math.round(clamped);
            setTextVal(String(cleaned));
            onChange(cleaned);
          }
        }}
        style={{
          width: inputWidth,
          height: "100%",
          border: "none",
          background: "transparent",
          color: isDarkMode ? "#F8FAFC" : "#0F172A",
          fontSize: "0.85rem",
          fontWeight: 700,
          textAlign: "center",
          outline: "none",
          padding: "0 4px",
          boxSizing: "border-box",
        }}
      />

      {/* Up / Down Arrow Steppers */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 20,
          height: "100%",
          borderLeft: isDarkMode
            ? "1px solid rgba(255,255,255,0.10)"
            : "1px solid #E2E8F0",
          background: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
        }}
      >
        <button
          type="button"
          onMouseDown={() => startHold("up")}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold("up")}
          onTouchEnd={stopHold}
          title="Increase value"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            color: isDarkMode ? "#94A3B8" : "#64748B",
            transition: "all 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = accentColor;
            e.currentTarget.style.background = isDarkMode
              ? "rgba(255,255,255,0.12)"
              : "#EDE9FE";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDarkMode ? "#94A3B8" : "#64748B";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronUp size={11} strokeWidth={2.8} />
        </button>

        <div
          style={{
            height: 1,
            background: isDarkMode
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          }}
        />

        <button
          type="button"
          onMouseDown={() => startHold("down")}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold("down")}
          onTouchEnd={stopHold}
          title="Decrease value"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            color: isDarkMode ? "#94A3B8" : "#64748B",
            transition: "all 0.1s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = accentColor;
            e.currentTarget.style.background = isDarkMode
              ? "rgba(255,255,255,0.12)"
              : "#EDE9FE";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = isDarkMode ? "#94A3B8" : "#64748B";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <ChevronDown size={11} strokeWidth={2.8} />
        </button>
      </div>
    </div>
  );
};

export const SENSOR_LIST = [
  { key: "soilMoisture",    label: "Soil Moisture",     unit: "%",     color: "#3B82F6", icon: Droplets,     defaultMin: 30,   defaultMax: 80,    step: 1   },
  { key: "soilTemperature", label: "Soil Temperature",  unit: "°C",    color: "#F59E0B", icon: Thermometer,  defaultMin: 15,   defaultMax: 35,    step: 1   },
  { key: "soilPh",          label: "Soil pH",           unit: "pH",    color: "#8B5CF6", icon: Leaf,         defaultMin: 5.5,  defaultMax: 7.5,   step: 0.1 },
  { key: "airTemperature",  label: "Air Temperature",   unit: "°C",    color: "#EF4444", icon: CloudSun,     defaultMin: 10,   defaultMax: 40,    step: 1   },
  { key: "humidity",        label: "Humidity",          unit: "%",     color: "#06B6D4", icon: Wind,         defaultMin: 40,   defaultMax: 90,    step: 1   },
  { key: "light",           label: "Light Intensity",   unit: "lux",   color: "#F59E0B", icon: Sun,          defaultMin: 1000, defaultMax: 80000, step: 500 },
  { key: "rainfall",        label: "Rainfall",          unit: "mm",    color: "#0EA5E9", icon: CloudRain,    defaultMin: 0,    defaultMax: 50,    step: 1   },
  { key: "nitrogen",        label: "Nitrogen (N)",      unit: "mg/kg", color: "#8B5CF6", icon: FlaskConical, defaultMin: 40,   defaultMax: 60,    step: 1   },
  { key: "phosphorus",      label: "Phosphorus (P)",    unit: "mg/kg", color: "#D97706", icon: Beaker,       defaultMin: 20,   defaultMax: 40,    step: 1   },
  { key: "potassium",       label: "Potassium (K)",     unit: "mg/kg", color: "#0891B2", icon: Hexagon,      defaultMin: 30,   defaultMax: 50,    step: 1   },
];

const SensorCalibration = ({
  sensorRanges: propSensorRanges,
  onChange: propOnChange,
  isDarkMode: propIsDarkMode,
  hideHeader = false,
}) => {
  const appContext = useApp?.() || {};
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : (appContext.isDarkMode || false);
  const [isOpen, setIsOpen] = useState(false);

  const [internalRanges, setInternalRanges] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_sethu_sensor_ranges');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      soilMoisture:    { min: 30,   max: 80    },
      soilTemperature: { min: 15,   max: 35    },
      soilPh:          { min: 5.5,  max: 7.5   },
      airTemperature:  { min: 10,   max: 40    },
      humidity:        { min: 40,   max: 90    },
      light:           { min: 1000, max: 80000 },
      rainfall:        { min: 0,    max: 50    },
      nitrogen:        { min: 40,   max: 60    },
      phosphorus:      { min: 20,   max: 40    },
      potassium:       { min: 30,   max: 50    },
      npk:             { min: 10,   max: 300   }
    };
  });

  const sensorRanges = propSensorRanges || internalRanges;

  const handleChange = (key, field, val) => {
    if (propOnChange) {
      propOnChange(key, field, val);
    } else {
      setInternalRanges(prev => {
        const updated = {
          ...prev,
          [key]: {
            ...(prev[key] || {}),
            [field]: val
          }
        };
        try {
          localStorage.setItem('krishi_sethu_sensor_ranges', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  };

  const calibrationContent = (
    <>
      {/* Toggle trigger card matching Settings style */}
      <div
        className="settings-card-item"
        onClick={() => setIsOpen((v) => !v)}
        style={{
          background: "var(--bg-card)",
          borderRadius: isOpen ? "16px 16px 0 0" : 16,
          border: isDarkMode
            ? "1px solid rgba(255, 255, 255, 0.06)"
            : "1px solid #EAEFEA",
          boxShadow: isDarkMode
            ? "0 2px 8px rgba(0, 0, 0, 0.2)"
            : "0 1px 4px rgba(0, 0, 0, 0.04)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "border-radius 0.2s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        }}
      >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: isDarkMode
                  ? "rgba(2, 132, 199, 0.16)"
                  : "#E0F2FE",
                border: isDarkMode
                  ? "1px solid rgba(2, 132, 199, 0.3)"
                  : "1px solid #BAE6FD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Gauge size={19} color="#0284C7" strokeWidth={2.3} />
            </div>
            <div
              style={{
                fontSize: "0.92rem",
                fontWeight: 700,
                color: isDarkMode ? "#F8FAFC" : "#101828",
              }}
            >
              Sensor Calibration
            </div>
          </div>

          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDarkMode ? "#64748B" : "#94A3B8",
            }}
          >
            <ChevronDown
              size={18}
              strokeWidth={2.4}
              style={{
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s ease",
              }}
            />
          </div>
        </div>

        {/* Dropdown Content */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="sensor-calibration-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <div
                className="settings-card-item"
                style={{
                  background: "var(--bg-card)",
                  borderRadius: "0 0 16px 16px",
                  border: isDarkMode
                    ? "1px solid rgba(255, 255, 255, 0.06)"
                    : "1px solid #EAEFEA",
                  borderTop: isDarkMode
                    ? "1px dashed rgba(255, 255, 255, 0.08)"
                    : "1px dashed #E2E8F0",
                  boxShadow: isDarkMode
                    ? "0 4px 12px rgba(0, 0, 0, 0.25)"
                    : "0 2px 8px rgba(0, 0, 0, 0.05)",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: -8,
                  transition: "background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                }}
              >
                {/* Column Headers */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "2px 12px 4px",
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      color: isDarkMode ? "#64748B" : "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Sensor
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 66,
                        textAlign: "center",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: isDarkMode ? "#64748B" : "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Min
                    </span>
                    <span
                      style={{
                        width: 66,
                        textAlign: "center",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        color: isDarkMode ? "#64748B" : "#94A3B8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Max
                    </span>
                  </div>
                </div>

                {SENSOR_LIST.map(
                  ({
                    key,
                    label,
                    unit,
                    color,
                    icon: SensorIcon,
                    defaultMin,
                    defaultMax,
                    step,
                  }) => {
                    const range = sensorRanges?.[key] || {
                      min: defaultMin,
                      max: defaultMax,
                    };

                    return (
                      <div
                        key={key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          background: isDarkMode
                            ? "rgba(255,255,255,0.03)"
                            : "#F8FAFC",
                          borderRadius: 14,
                          border: isDarkMode
                            ? "1px solid rgba(255,255,255,0.06)"
                            : "1px solid #E2E8F0",
                          padding: "9px 12px",
                          minHeight: 52,
                          boxSizing: "border-box",
                        }}
                      >
                        {/* Icon badge + label + unit */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {SensorIcon && (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                background: isDarkMode
                                  ? `${color}22`
                                  : `${color}14`,
                                border: isDarkMode
                                  ? `1px solid ${color}44`
                                  : `1px solid ${color}28`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <SensorIcon
                                size={15}
                                color={color}
                                strokeWidth={2.4}
                              />
                            </div>
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: isDarkMode ? "#F1F5F9" : "#101828",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: "0.69rem",
                                color: isDarkMode ? "#64748B" : "#94A3B8",
                                fontWeight: 600,
                              }}
                            >
                              {unit}
                            </div>
                          </div>
                        </div>

                        {/* Side-by-side Min & Max Steppers (labels and arrow removed) */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexShrink: 0,
                          }}
                        >
                          <NumberStepper
                            value={range.min}
                            onChange={(val) => handleChange(key, "min", val)}
                            step={step || 1}
                            isDarkMode={isDarkMode}
                            accentColor={color}
                            title={`${label} Min`}
                            placeholder="Min"
                          />

                          <NumberStepper
                            value={range.max}
                            onChange={(val) => handleChange(key, "max", val)}
                            step={step || 1}
                            isDarkMode={isDarkMode}
                            accentColor={color}
                            title={`${label} Max`}
                            placeholder="Max"
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );

  if (hideHeader) {
    return calibrationContent;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3
        style={{
          fontSize: "0.78rem",
          fontWeight: 800,
          color: isDarkMode ? "#94A3B8" : "#64748B",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 0 4px",
        }}
      >
        SENSOR CALIBRATION
      </h3>

      {calibrationContent}
    </div>
  );
};

export default SensorCalibration;

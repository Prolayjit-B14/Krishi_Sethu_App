import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, CalendarDays, X } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseISODate = (str) => {
  if (!str) return null;
  if (typeof str !== 'string') return null;
  const parts = str.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

const formatToISO = (date) => {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateDisplay = (dateStr) => {
  const d = parseISODate(dateStr);
  if (!d) return 'Set Date';
  return `${String(d.getDate()).padStart(2, '0')} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export default function CustomDatePicker({
  value,
  onChange,
  isDarkMode = true,
  label = 'Sown',
  align = 'right' // 'left' or 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const initialDate = useMemo(() => parseISODate(value) || new Date(), [value]);
  const [viewYear, setViewYear] = useState(() => initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => initialDate.getMonth());

  // Update view when value changes and picker is closed
  useEffect(() => {
    if (!isOpen && value) {
      const d = parseISODate(value);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value, isOpen]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const prevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const date = new Date(viewYear, viewMonth - 1, dayNum);
      cells.push({
        dayNum,
        date,
        isCurrentMonth: false,
        iso: formatToISO(date),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      cells.push({
        dayNum: d,
        date,
        isCurrentMonth: true,
        iso: formatToISO(date),
      });
    }

    // Next month leading days (fill up to full 7-col grid)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d);
      cells.push({
        dayNum: d,
        date,
        isCurrentMonth: false,
        iso: formatToISO(date),
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const todayISO = useMemo(() => formatToISO(new Date()), []);
  const selectedISO = useMemo(() => {
    const d = parseISODate(value);
    return d ? formatToISO(d) : '';
  }, [value]);

  const handleSelectDate = (isoDate, dateObj) => {
    onChange(isoDate);
    // If user clicked a day outside current month, move view to that month
    if (dateObj.getMonth() !== viewMonth || dateObj.getFullYear() !== viewYear) {
      setViewMonth(dateObj.getMonth());
      setViewYear(dateObj.getFullYear());
    }
    setIsOpen(false);
  };

  const handleSelectToday = (e) => {
    e.stopPropagation();
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(formatToISO(now));
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Generate a reasonable range of years (e.g., current year - 5 to current year + 3)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentYear - 6; y <= currentYear + 4; y++) {
      list.push(y);
    }
    return list;
  }, [currentYear]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* ── Trigger Pill Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAF7',
          padding: '6px 12px',
          borderRadius: 12,
          border: isOpen
            ? '1px solid #10B981'
            : (isDarkMode ? '1px solid var(--border-main, rgba(255, 255, 255, 0.1))' : '1px solid rgba(0, 0, 0, 0.08)'),
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
            e.currentTarget.style.borderColor = '#10B981';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F8FAF7';
            e.currentTarget.style.borderColor = isDarkMode ? 'var(--border-main, rgba(255, 255, 255, 0.1))' : 'rgba(0, 0, 0, 0.08)';
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: 6,
          background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
          color: '#10B981'
        }}>
          <Calendar size={12} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.02em' }}>
          {label}:
        </span>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          color: isDarkMode ? '#F8FAFC' : '#0F172A',
          letterSpacing: '0.01em',
          minWidth: 78,
          textAlign: 'left'
        }}>
          {formatDateDisplay(value)}
        </span>
        <ChevronDown
          size={13}
          color="#94A3B8"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: 0.8
          }}
        />
      </button>

      {/* ── Custom Dark/Light Calendar Popover ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              [align === 'right' ? 'right' : 'left']: 0,
              zIndex: 1200,
              width: 296,
              background: isDarkMode ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 20,
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: isDarkMode
                ? '0 24px 50px -12px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(16, 185, 129, 0.18)'
                : '0 20px 45px -10px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(16, 185, 129, 0.12)',
              padding: '16px',
              userSelect: 'none',
              overflow: 'hidden'
            }}
          >
            {/* ── Header: Month & Year Selector + Prev/Next ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              {/* Prev Month Button */}
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Previous month"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  color: isDarkMode ? '#CBD5E1' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
                  e.currentTarget.style.color = '#10B981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9';
                  e.currentTarget.style.color = isDarkMode ? '#CBD5E1' : '#334155';
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {/* Month & Year Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {/* Month Dropdown */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F8FAF7',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: 8,
                      padding: '4px 20px 4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option
                        key={name}
                        value={idx}
                        style={{
                          background: isDarkMode ? '#0F172A' : '#FFFFFF',
                          color: isDarkMode ? '#F8FAFC' : '#0F172A'
                        }}
                      >
                        {name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={11}
                    color="#94A3B8"
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                </div>

                {/* Year Dropdown */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F8FAF7',
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: 8,
                      padding: '4px 18px 4px 8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: isDarkMode ? '#F8FAFC' : '#0F172A',
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  >
                    {yearOptions.map(y => (
                      <option
                        key={y}
                        value={y}
                        style={{
                          background: isDarkMode ? '#0F172A' : '#FFFFFF',
                          color: isDarkMode ? '#F8FAFC' : '#0F172A'
                        }}
                      >
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={11}
                    color="#94A3B8"
                    style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  />
                </div>
              </div>

              {/* Next Month Button */}
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Next month"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
                  color: isDarkMode ? '#CBD5E1' : '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
                  e.currentTarget.style.color = '#10B981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9';
                  e.currentTarget.style.color = isDarkMode ? '#CBD5E1' : '#334155';
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* ── Weekday Headers ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                marginBottom: 6,
                textAlign: 'center'
              }}
            >
              {WEEKDAYS.map(w => (
                <div
                  key={w}
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#64748B',
                    padding: '4px 0',
                    letterSpacing: '0.04em'
                  }}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* ── Days Grid ── */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                marginBottom: 12
              }}
            >
              {calendarGrid.map((cell, idx) => {
                const isSelected = cell.iso === selectedISO;
                const isToday = cell.iso === todayISO;

                let cellBg = 'transparent';
                let cellColor = isDarkMode ? '#F1F5F9' : '#1E293B';
                let cellBorder = '1px solid transparent';
                let cellShadow = 'none';

                if (isSelected) {
                  cellBg = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
                  cellColor = '#FFFFFF';
                  cellShadow = '0 4px 12px rgba(16, 185, 129, 0.45)';
                } else if (isToday) {
                  cellBorder = '1.5px solid #10B981';
                  cellColor = isDarkMode ? '#34D399' : '#059669';
                } else if (!cell.isCurrentMonth) {
                  cellColor = isDarkMode ? '#475569' : '#94A3B8';
                }

                return (
                  <motion.button
                    key={`${cell.iso}-${idx}`}
                    type="button"
                    onClick={() => handleSelectDate(cell.iso, cell.date)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    style={{
                      height: 32,
                      width: '100%',
                      borderRadius: 9,
                      border: cellBorder,
                      background: cellBg,
                      color: cellColor,
                      fontSize: '0.78rem',
                      fontWeight: isSelected ? 900 : (cell.isCurrentMonth ? 700 : 500),
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: cellShadow,
                      padding: 0,
                      transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = cellBg;
                      }
                    }}
                  >
                    {cell.dayNum}
                    {isToday && !isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: '#10B981'
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* ── Footer: Clear & Today Shortcuts ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 10,
                borderTop: isDarkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)'
              }}
            >
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isDarkMode ? '#94A3B8' : '#64748B',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = isDarkMode ? '#94A3B8' : '#64748B'}
              >
                <X size={12} />
                Clear
              </button>

              <button
                type="button"
                onClick={handleSelectToday}
                style={{
                  background: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: isDarkMode ? '#34D399' : '#15803D',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  padding: '5px 12px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#10B981';
                  e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7';
                  e.currentTarget.style.color = isDarkMode ? '#34D399' : '#15803D';
                }}
              >
                <CalendarDays size={13} />
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * AgriSense / Krishi Sethu — Cellular SMS Notification Bridge
 * Generates compact 160-char GSM-compliant messages for smallholder farmers with feature phones.
 * Supports native SMS intent dispatch and gateway formatting.
 */

export const DEFAULT_FIELD_CONTACTS = [
  { id: '1', name: 'Ramu (Pump Operator)', phone: '+91 98765 43210', role: 'Irrigation' },
  { id: '2', name: 'Suresh (Farm Supervisor)', phone: '+91 98480 12345', role: 'Supervisor' }
];

export const formatSmsAlert = (alert, farmName = 'Krishi Sethu Farm') => {
  const title = alert.title || alert.type || 'Field Alert';
  const rec = alert.recommendation || alert.action || alert.message || 'Check field';
  const val = alert.value ? ` [${alert.value}]` : '';

  // Compact GSM 160-char format
  return `[${farmName.slice(0, 12)}] ${title}${val}. Action: ${rec.slice(0, 70)}`;
};

export const dispatchSmsToWorker = (phone, text) => {
  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
  const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;

  if (typeof window !== 'undefined') {
    // Check if running on mobile device / Capacitor or browser
    const link = document.createElement('a');
    link.href = smsUrl;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, method: 'native_intent', phone: cleanPhone, text };
  }

  return { success: true, method: 'queued', phone: cleanPhone, text };
};

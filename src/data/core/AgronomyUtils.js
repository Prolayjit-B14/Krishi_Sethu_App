import { 
  Wheat, Sprout, Sun, Shrub, Clover, Bean, Leaf, Nut, Apple, Citrus, 
  Flower, Carrot, Droplets, Zap, FlaskConical, Activity, Minus, Banana, 
  Grape, TreePine, Cherry, Shell, Brain, Trees, Milk, Cloud, Waves, 
  TrendingUp, TrendingDown, Coffee, MapPin, Calculator, RefreshCw,
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, Clock, BarChart3,
  Search, X, ChevronRight, Scale, Microscope, Sparkles, Info,
  AlertTriangle, Trees as TreesIcon, CloudRain, Thermometer, ChevronDown
} from 'lucide-react';
import { getCropProfile, ALL_86_CROP_PROFILES } from './cropProfiles';

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const isAvailable = (val) => val !== undefined && val !== null && val !== '' && val !== '---';
export const isAvailableLoc = (v) => v !== null && v !== undefined && v !== '' && v !== '---';

export const detectSoilType = (ph, moist, n, p, k) => {
  if (!isAvailableLoc(ph) || !isAvailableLoc(moist)) return 'Missing';
  
  const vPh = parseFloat(ph);
  const vMoist = parseFloat(moist);
  const vN = parseFloat(n || 0);
  const vP = parseFloat(p || 0);
  const vK = parseFloat(k || 0);

  // 1. Loamy: pH 6-7 && moisture medium && good NPK
  if (vPh >= 6 && vPh <= 7.2 && vMoist >= 35 && vMoist <= 65 && vN > 30 && vP > 30 && vK > 30) {
    return 'Loamy';
  }

  // 2. Sandy: low moisture
  if (vMoist < 35) {
    return 'Sandy';
  }

  // 3. Clay: high moisture
  if (vMoist > 65) {
    return 'Clay';
  }

  return 'Loamy'; // Default fallback for stable fields
};

export const getPHLabel = (ph) => {
  if (!isAvailableLoc(ph)) return '---';
  const v = parseFloat(ph);
  if (v < 6.0) return 'Acidic';
  if (v <= 7.5) return 'Neutral';
  return 'Alkaline';
};

export const getMoistureLabel = (moist) => {
  if (!isAvailableLoc(moist)) return '---';
  const v = parseFloat(moist);
  if (v < 35) return 'Dry';
  if (v <= 65) return 'Medium';
  return 'Wet';
};

export const getFertilityLabel = (n, p, k) => {
  if (!isAvailableLoc(n) || !isAvailableLoc(p) || !isAvailableLoc(k)) return '---';
  const avg = (parseFloat(n) + parseFloat(p) + parseFloat(k)) / 3;
  if (avg > 60) return 'High Fertility';
  if (avg > 30) return 'Medium Fertility';
  return 'Low Fertility';
};

const CLIMATE_ZONES = {
  'wb': 'Subtropical',
  'rajasthan': 'Arid',
  'punjab': 'Semi-Arid',
  'haryana': 'Semi-Arid',
  'karnataka': 'Tropical',
  'maharashtra': 'Tropical',
  'himachal': 'Temperate',
  'uttarakhand': 'Temperate',
  'kerala': 'Tropical Humid',
  'tamil nadu': 'Tropical Coastal',
  'india': 'Subtropical'
};

export const getLocationClimate = (loc) => {
  if (!loc) return 'Unknown';
  const l = loc.toLowerCase();
  for (const [key, zone] of Object.entries(CLIMATE_ZONES)) {
    if (l.includes(key)) return zone;
  }
  return 'Subtropical'; // Default Indian climate
};

/**
 * Advanced Climate Matching Logic
 * Detects compatibility between crop required climate and user local climate.
 */
export const isClimateCompatible = (cropLoc, userLoc) => {
  if (!cropLoc || !userLoc) return false;
  const idl = cropLoc.toLowerCase();
  const cur = userLoc.toLowerCase();
  
  if (idl === 'all' || idl.includes('india') || idl.includes('any')) return true;

  // 1. Tokenized Matching (Space, Slash, Comma)
  const idlWords = idl.split(/[\/\s,]+/).filter(w => w.length > 2);
  const curWords = cur.split(/[\/\s,]+/).filter(w => w.length > 2);
  
  const hasDirectOverlap = curWords.some(cw => idlWords.some(iw => iw.includes(cw) || cw.includes(iw)));
  if (hasDirectOverlap) return true;

  // 2. High-Fidelity Agronomic Overlaps
  const isTropicalUser = cur.includes('tropical');
  const isSubtropicalUser = cur.includes('subtropical');
  const isTropicalCrop = idl.includes('tropical');
  const isSubtropicalCrop = idl.includes('subtropical');

  // Tropical/Subtropical are generally interchangeable for modern cultivars
  if ((isTropicalUser && isSubtropicalCrop) || (isSubtropicalUser && isTropicalCrop)) return true;
  
  // Specific coastal/wetland mappings
  if (idl.includes('wetland') && isTropicalUser) return true;
  if (idl.includes('coastal') && (cur.includes('humid') || cur.includes('tropical'))) return true;

  return false;
};

export const getCropIcon = (type, name = '') => {
  const t = type?.toLowerCase() || '';
  const n = name?.toLowerCase() || '';

  // 🌾 GRAINS & CEREALS
  if (n.includes('rice') || n.includes('paddy')) return { icon: Wheat, color: '#10B981' }; 
  if (n.includes('wheat')) return { icon: Wheat, color: '#EAB308' }; 
  if (n.includes('maize') || n.includes('corn')) return { icon: Sun, color: '#FACC15' }; 
  if (n.includes('barley')) return { icon: Wheat, color: '#D97706' }; 
  if (n.includes('bajra')) return { icon: Sprout, color: '#84CC16' }; 
  if (n.includes('jowar')) return { icon: Shrub, color: '#65A30D' }; 
  if (n.includes('ragi')) return { icon: Clover, color: '#4D7C0F' }; 

  // 🫘 PULSES (LEGUMES)
  if (n.includes('arhar') || n.includes('tur')) return { icon: Bean, color: '#A855F7' }; 
  if (n.includes('gram') || n.includes('chana')) return { icon: Bean, color: '#92400E' }; 
  if (n.includes('moong')) return { icon: Bean, color: '#22C55E' }; 
  if (n.includes('urad')) return { icon: Bean, color: '#1E293B' }; 
  if (n.includes('masoor')) return { icon: Bean, color: '#F97316' }; 
  if (n.includes('kidney') || n.includes('rajma')) return { icon: Bean, color: '#B91C1C' }; 
  if (n.includes('moth')) return { icon: Bean, color: '#78350F' }; 

  // 🥗 VEGETABLES & GREENS
  if (n.includes('potato')) return { icon: Nut, color: '#D97706' };
  if (n.includes('tomato')) return { icon: Apple, color: '#EF4444' };
  if (n.includes('onion')) return { icon: Citrus, color: '#D946EF' }; 
  if (n.includes('brinjal')) return { icon: Apple, color: '#7C3AED' }; 
  if (n.includes('cabbage')) return { icon: Shrub, color: '#22C55E' };
  if (n.includes('cauliflower')) return { icon: Flower, color: '#CBD5E1' }; 
  if (n.includes('spinach')) return { icon: Leaf, color: '#15803D' };
  if (n.includes('okra')) return { icon: Leaf, color: '#16A34A' }; 
  if (n.includes('carrot')) return { icon: Carrot, color: '#F97316' };
  if (n.includes('radish')) return { icon: Carrot, color: '#F1F5F9' }; 
  if (n.includes('peas')) return { icon: Droplets, color: '#16A34A' }; 
  if (n.includes('capsicum')) return { icon: Citrus, color: '#10B981' }; 
  if (n.includes('chili')) return { icon: Zap, color: '#EF4444' }; 
  if (n.includes('pumpkin')) return { icon: Citrus, color: '#F97316' };
  if (n.includes('bottle gourd')) return { icon: FlaskConical, color: '#4ADE80' }; 
  if (n.includes('bitter gourd')) return { icon: Activity, color: '#166534' }; 
  if (n.includes('cucumber')) return { icon: Minus, color: '#22C55E' };
  if (n.includes('beans')) return { icon: Leaf, color: '#10B981' };
  if (n.includes('garlic')) return { icon: Nut, color: '#E2E8F0' };
  if (n.includes('fenugreek')) return { icon: Clover, color: '#16A34A' };
  if (n.includes('coriander')) return { icon: Shrub, color: '#22C55E' };
  if (n.includes('mint')) return { icon: Leaf, color: '#4ADE80' };

  // 🍎 FRUITS & NUTS
  if (n.includes('mango')) return { icon: Citrus, color: '#FBBF24' };
  if (n.includes('banana')) return { icon: Banana, color: '#EAB308' };
  if (n.includes('apple')) return { icon: Apple, color: '#EF4444' };
  if (n.includes('guava')) return { icon: Citrus, color: '#4ADE80' };
  if (n.includes('orange')) return { icon: Citrus, color: '#F97316' };
  if (n.includes('papaya')) return { icon: Citrus, color: '#F59E0B' };
  if (n.includes('pomegranate')) return { icon: Apple, color: '#B91C1C' };
  if (n.includes('grapes')) return { icon: Grape, color: '#8B5CF6' };
  if (n.includes('pineapple')) return { icon: TreePine, color: '#EAB308' };
  if (n.includes('watermelon')) return { icon: Citrus, color: '#15803D' };
  if (n.includes('muskmelon')) return { icon: Citrus, color: '#FBBF24' };
  if (n.includes('litchi')) return { icon: Cherry, color: '#EF4444' };
  if (n.includes('coconut')) return { icon: Nut, color: '#78350F' };
  if (n.includes('cashew')) return { icon: Shell, color: '#D97706' };
  if (n.includes('almond')) return { icon: Nut, color: '#92400E' };
  if (n.includes('walnut')) return { icon: Brain, color: '#78350F' };

  // 💰 CASH & PLANTATION
  if (n.includes('sugarcane')) return { icon: Trees, color: '#22C55E' };
  if (n.includes('coffee')) return { icon: Coffee, color: '#78350F' };
  if (n.includes('tea')) return { icon: Leaf, color: '#15803D' };
  if (n.includes('rubber')) return { icon: Milk, color: '#FFFFFF' };
  if (n.includes('ginger') || n.includes('turmeric')) return { icon: Nut, color: '#D97706' };
  if (n.includes('cumin')) return { icon: Wheat, color: '#92400E' };
  if (n.includes('pepper')) return { icon: Nut, color: '#1E293B' };
  if (n.includes('cardamom')) return { icon: Sprout, color: '#16A34A' };

  // 🧵 FIBER & OILSEEDS
  if (n.includes('cotton')) return { icon: Cloud, color: '#F1F5F9' };
  if (n.includes('jute')) return { icon: Waves, color: '#94A3B8' };
  if (n.includes('groundnut')) return { icon: Nut, color: '#D97706' };
  if (n.includes('mustard')) return { icon: Flower, color: '#FACC15' };
  if (n.includes('soybean')) return { icon: Sprout, color: '#F1F5F9' };
  if (n.includes('sunflower')) return { icon: Sun, color: '#FBBF24' };

  // 🌸 FLOWERS
  if (n.includes('rose')) return { icon: Flower, color: '#EF4444' };
  if (n.includes('marigold')) return { icon: Flower, color: '#F97316' };
  if (n.includes('jasmine') || n.includes('lily')) return { icon: Flower, color: '#F1F5F9' };
  if (n.includes('lotus')) return { icon: Flower, color: '#F472B6' };
  if (n.includes('hibiscus')) return { icon: Flower, color: '#EC4899' };
  if (n.includes('chrysanthemum')) return { icon: Flower, color: '#FBBF24' };
  if (n.includes('tuberose')) return { icon: Flower, color: '#E2E8F0' };
  if (n.includes('orchid')) return { icon: Flower, color: '#8B5CF6' };

  // Category Fallbacks
  if (t.includes('seed')) return { icon: Sprout, color: '#6366F1' };
  if (t.includes('grain')) return { icon: Wheat, color: '#EAB308' };
  if (t.includes('veg')) return { icon: Carrot, color: '#22C55E' };
  if (t.includes('fruit')) return { icon: Apple, color: '#F97316' };
  if (t.includes('flower')) return { icon: Flower, color: '#EC4899' };
  
  return { icon: Sprout, color: '#10B981' };
};

export const getDemandIcon = (demand) => {
  const d = demand?.toLowerCase() || '';
  if (d.includes('high')) return TrendingUp;
  if (d.includes('low')) return TrendingDown;
  return Activity;
};

export const getDemandColor = (demand) => {
  const d = demand?.toLowerCase() || '';
  if (d.includes('high')) return '#10B981';
  if (d.includes('medium')) return '#F59E0B';
  return '#94A3B8';
};

export const formatCropName = (name) => {
  if (!name) return '';
  return name.split('(')[0].trim().replace(/\b\w/g, l => l.toUpperCase());
};

export const parseCSV = (t) => {
  if (!t || t.trim().length === 0) return [];
  const lines = t.trim().split('\n');
  if (lines.length < 1) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return headers.reduce((obj, header, i) => { obj[header] = values[i]; return obj; }, {});
  });
};

export const aggregateCropProfiles = (data) => {
  if (!Array.isArray(data) || data.length === 0) return {};
  const crops = {};
  data.forEach(row => {
    if (!row || typeof row !== 'object') return;
    const label = row.label?.toLowerCase().trim();
    if (!label) return;
    if (!crops[label]) {
      crops[label] = { 
        n: [], p: [], k: [], temperature: [], humidity: [], ph: [], rainfall: [],
        season: row.season || 'Kharif', 
        soil: row.soil_type || 'Loamy', 
        loc: row.location || 'India', 
        sow: row.sowing_time || 'Jan-Dec',
        fert: row.fertilizer || 'Balanced NPK', 
        comp: row.compost || 'Organic Manure', 
        pest: row.pest_control || 'Standard Control'
      };
    }
    ['n', 'p', 'k', 'temperature', 'humidity', 'ph', 'rainfall'].forEach(key => {
      const val = parseFloat(row[key]); 
      if (!isNaN(val)) crops[label][key].push(val);
    });
  });
  
  const final = {};
  Object.keys(crops).forEach(label => {
    const r = crops[label];
    const getMid = (arr) => {
      if (arr.length === 0) return 0;
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return { min, max, mid: (min + max) / 2 };
    };
    final[label] = { 
      ...r,
      n: getMid(r.n), p: getMid(r.p), k: getMid(r.k), 
      temperature: getMid(r.temperature), 
      humidity: getMid(r.humidity), 
      ph: getMid(r.ph), 
      rainfall: getMid(r.rainfall)
    };
  });
  return final;
};

// ─── CROP LIFECYCLE & STAGE ADAPTIVE LOGIC ──────────────────────────────────
export const CROP_LIFECYCLE_STAGES = [
  { id: 'seedling', name: 'Seedling / Emergence', shortName: 'Seedling', range: [0, 0.18], iconColor: '#10B981', moistureAdj: 0.85, nAdj: 0.7, pAdj: 1.3, kAdj: 0.8, advice: 'Delicate seedling roots. Maintain light, frequent moisture; avoid waterlogging.' },
  { id: 'vegetative', name: 'Vegetative Growth / Tillering', shortName: 'Vegetative', range: [0.18, 0.50], iconColor: '#059669', moistureAdj: 1.0, nAdj: 1.3, pAdj: 1.0, kAdj: 1.0, advice: 'Active leaf and stem formation. Adequate Nitrogen and consistent moisture required.' },
  { id: 'flowering', name: 'Flowering / Panicle Initiation', shortName: 'Flowering', range: [0.50, 0.72], iconColor: '#F59E0B', moistureAdj: 1.25, nAdj: 0.9, pAdj: 1.25, kAdj: 1.2, advice: 'Critical reproductive window. Moisture or heat stress directly reduces yield.' },
  { id: 'grain_filling', name: 'Yield Bulking / Grain Filling', shortName: 'Filling', range: [0.72, 0.88], iconColor: '#8B5CF6', moistureAdj: 0.95, nAdj: 0.7, pAdj: 0.8, kAdj: 1.4, advice: 'Starch and nutrient translocation. Boost Potassium for grain density and fruit firmness.' },
  { id: 'ripening', name: 'Ripening / Harvest Readiness', shortName: 'Maturity', range: [0.88, 1.0], iconColor: '#D97706', moistureAdj: 0.6, nAdj: 0.3, pAdj: 0.5, kAdj: 0.6, advice: 'Field drying phase. Cease irrigation 10-14 days prior to harvest.' }
];

// ─── STANDARD 5-STAGE AGRONOMIC TAXONOMY ─────────────────────────────────────
export const getStandardStageMeta = (stg, idx, cropName = '') => {
  const raw = (stg?.name || '').toLowerCase();
  
  // Stage 1: Emergence / Seedling
  if (idx === 0) {
    let sub = 'Nursery';
    if (raw.includes('germ')) sub = 'Germination';
    else if (raw.includes('emerg')) sub = 'Emergence';
    else if (raw.includes('cri')) sub = 'CRI';
    else if (raw.includes('sprout')) sub = 'Sprouting';
    return { title: 'Seedling', sub, shortName: 'Seedling', displayName: `Seedling (${sub})` };
  }
  
  // Stage 2: Active Vegetative / Tillering / Canopy
  if (idx === 1) {
    let sub = 'Tillering';
    if (raw.includes('branch')) sub = 'Branching';
    else if (raw.includes('canopy')) sub = 'Canopy';
    else if (raw.includes('joint')) sub = 'Jointing';
    else if (raw.includes('formative')) sub = 'Formative';
    return { title: 'Vegetative', sub, shortName: 'Vegetative', displayName: `Vegetative (${sub})` };
  }
  
  // Stage 3: Reproductive / Flowering / Heading / Panicle
  if (idx === 2) {
    let sub = 'Panicle';
    if (raw.includes('heading')) sub = 'Heading';
    else if (raw.includes('boot')) sub = 'Booting';
    else if (raw.includes('tassel') || raw.includes('silk')) sub = 'Silking';
    else if (raw.includes('pod')) sub = 'Pod Set';
    else if (raw.includes('boll')) sub = 'Square';
    else if (raw.includes('bloom') || raw.includes('flower')) sub = 'Bloom';
    return { title: 'Flowering', sub, shortName: 'Flowering', displayName: `Flowering (${sub})` };
  }
  
  // Stage 4: Ripening / Grain Filling / Milking / Bulking / Fruiting
  if (idx === 3) {
    let title = 'Grain Filling';
    let sub = 'Milking';
    if (raw.includes('fruit')) {
      title = 'Fruiting';
      sub = 'Sizing';
    } else if (raw.includes('pod')) {
      title = 'Pod Filling';
      sub = 'Seed Fill';
    } else if (raw.includes('bulk') || raw.includes('tuber') || raw.includes('rhizome')) {
      title = 'Bulking';
      sub = 'Tuber Sizing';
    } else if (raw.includes('cane') || raw.includes('sugar')) {
      title = 'Elongation';
      sub = 'Sugar Accumulation';
    } else if (raw.includes('boll')) {
      title = 'Boll Growth';
      sub = 'Fiber Fill';
    } else if (raw.includes('dough')) {
      sub = 'Dough Stage';
    }
    return { title, sub, shortName: title, displayName: `${title} (${sub})` };
  }
  
  // Stage 5: Harvest / Maturity
  if (idx === 4) {
    let sub = 'Maturity';
    if (raw.includes('harvest')) sub = 'Harvest Ready';
    else if (raw.includes('burst')) sub = 'Boll Burst';
    else if (raw.includes('curing')) sub = 'Curing';
    return { title: 'Harvest', sub, shortName: 'Harvest', displayName: `Harvest (${sub})` };
  }
  
  return { title: `Stage ${idx + 1}`, sub: '', shortName: `Stage ${idx + 1}`, displayName: `Stage ${idx + 1}` };
};

export const calculateCropLifecycle = (cropName, sowDateInput) => {
  const profile = getCropProfile(cropName);
  const totalDurationDays = profile?.totalDays || 120;
  
  let sowDate;
  if (!sowDateInput) {
    sowDate = new Date();
    sowDate.setDate(sowDate.getDate() - 35);
  } else {
    sowDate = new Date(sowDateInput);
    if (isNaN(sowDate.getTime())) {
      sowDate = new Date();
      sowDate.setDate(sowDate.getDate() - 35);
    }
  }

  const today = new Date();
  const diffTime = Math.max(0, today.getTime() - sowDate.getTime());
  const daysElapsed = Math.min(totalDurationDays, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const progressRatio = Math.min(1.0, Math.max(0.01, daysElapsed / totalDurationDays));
  const progressPct = Math.round(progressRatio * 100);
  const daysLeft = Math.max(0, totalDurationDays - daysElapsed);

  const rawStages = profile?.stages || CROP_LIFECYCLE_STAGES;
  const stages = rawStages.map((stg, i) => {
    const meta = getStandardStageMeta(stg, i, cropName);
    return {
      ...stg,
      title: meta.title,
      sub: meta.sub,
      shortName: meta.shortName,
      displayName: meta.displayName,
      advice: stg.advice || stg.advisoryNote || 'Maintain appropriate field conditions for current growth stage.'
    };
  });
  let activeStageIndex = 0;

  for (let i = 0; i < stages.length; i++) {
    const [start, end] = stages[i].range || [0, 1];
    if (progressRatio >= start && (progressRatio <= end || i === stages.length - 1)) {
      activeStageIndex = i;
      break;
    }
  }

  const activeStage = stages[activeStageIndex];
  const nextStage = activeStageIndex < stages.length - 1 ? stages[activeStageIndex + 1] : null;
  
  // Calculate days remaining to next stage transition
  const stageEndDay = Math.round((activeStage?.range?.[1] || 1.0) * totalDurationDays);
  const daysToNextStage = Math.max(0, stageEndDay - daysElapsed);

  return {
    crop: profile?.name || cropName,
    cropKey: cropName,
    cropType: profile?.type || 'General',
    totalDurationDays,
    daysElapsed,
    daysLeft,
    progressPct,
    sowDate: sowDate.toISOString().split('T')[0],
    activeStageIndex,
    activeStage,
    nextStage,
    daysToNextStage,
    allStages: stages
  };
};

export const evaluateSensorAgainstStage = (sensorData, thresholds) => {
  const moisture = sensorData?.soil?.moisture;
  if (moisture == null) {
    return { status: 'OFFLINE', message: 'Sensor Offline', code: 'offline' };
  }

  const min = thresholds?.moisture?.min ?? 35;
  const optMin = thresholds?.moisture?.optimalMin ?? 45;
  const optMax = thresholds?.moisture?.optimalMax ?? 75;
  const max = thresholds?.moisture?.max ?? 88;

  if (moisture < min) {
    return { status: 'WATER STRESS', message: `Below target (${moisture}% < ${optMin}%)`, code: 'deficit', severity: 'warning' };
  }
  if (moisture > max) {
    return { status: 'WATERLOGGING RISK', message: `Excessive saturation (${moisture}% > ${optMax}%)`, code: 'waterlogged', severity: 'critical' };
  }
  if (moisture >= optMin && moisture <= optMax) {
    return { status: 'OPTIMAL', message: `Optimal stage range (${moisture}%)`, code: 'optimal', severity: 'healthy' };
  }
  return { status: 'ACCEPTABLE', message: `Moderate moisture (${moisture}%)`, code: 'acceptable', severity: 'normal' };
};

export const getStageAdaptiveThresholds = (baseSpec, activeStage) => {
  if (!baseSpec || !activeStage) return baseSpec;
  
  const mAdj = activeStage.moistureAdj || 1.0;
  const nAdj = activeStage.nAdj || 1.0;
  const pAdj = activeStage.pAdj || 1.0;
  const kAdj = activeStage.kAdj || 1.0;

  const adjustRange = (range, multiplier) => {
    if (!range) return range;
    if (Array.isArray(range)) {
      return [Math.round(range[0] * multiplier), Math.round(range[1] * multiplier)];
    }
    if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
      return {
        ...range,
        min: Math.round(range.min * multiplier),
        max: Math.round(range.max * multiplier),
        mid: Math.round((range.mid || ((range.min + range.max) / 2)) * multiplier)
      };
    }
    return range;
  };

  return {
    ...baseSpec,
    moisture: adjustRange(baseSpec.moisture || [30, 60], mAdj),
    n: adjustRange(baseSpec.n, nAdj),
    p: adjustRange(baseSpec.p, pAdj),
    k: adjustRange(baseSpec.k, kAdj),
    isAdaptive: true,
    stageName: activeStage.name
  };
};

export const getIPMRecommendations = (cropName, pestName) => {
  const c = (cropName || '').toLowerCase();
  
  return {
    crop: c || 'general',
    riskAssessment: 'Moderate seasonal risk based on ambient micro-climate telemetry',
    steps: [
      {
        step: 1,
        stage: 'Observation & Inspection',
        badge: 'Step 1: Scouting',
        color: '#0EA5E9',
        title: 'Canopy & Soil Scouting',
        action: 'Inspect underside of lower leaves twice weekly for early egg masses, nymph clusters, or fungal spotting.'
      },
      {
        step: 2,
        stage: 'Population Monitoring',
        badge: 'Step 2: Monitoring',
        color: '#F59E0B',
        title: 'Pheromone & Sticky Traps',
        action: 'Install 8–12 yellow/blue sticky traps and 5 delta pheromone lures per acre at canopy height to quantify pest population counts.'
      },
      {
        step: 3,
        stage: 'Biological Intervention',
        badge: 'Step 3: Bio-Control (Priority)',
        color: '#15803D',
        title: 'Botanical & Microbial Application',
        action: 'Apply Neem Oil (Azadirachtin 1500 ppm @ 4 ml/L) or Trichoderma viride bio-fungicide (2.5 kg/acre) to suppress pathogens without harming pollinators.'
      },
      {
        step: 4,
        stage: 'Chemical Threshold (ETL)',
        badge: 'Step 4: Chemical Option (When Justified)',
        color: '#DC2626',
        title: 'Economic Threshold Action (ETL)',
        action: 'Reserve synthetic chemical sprays ONLY if Economic Threshold Level (ETL) exceeds 10% damaged tillers or >5 pests per plant (e.g. Chlorantraniliprole 18.5% SC @ 0.3 ml/L).'
      }
    ]
  };
};

/**
 * Krishi Sethu / AgriSense Pro — Comprehensive 86-Crop Phenological Lifecycle Database
 * Contains stage definitions, durations (days), stage-adaptive soil moisture/temperature/NPK thresholds,
 * and baseline yield models for all 86 agricultural crops in the master catalogue.
 */

// Helper to construct 5-stage lifecycle profiles
const createStages = (totalDays, stageNames, moistureCurve, tempRange, npkScale = [1, 1, 1]) => {
  // moistureCurve: [seedling, vegetative, flowering, grainFilling, harvest]
  // Standard stage proportion distributions: 15%, 35%, 20%, 20%, 10%
  const d1 = Math.max(5, Math.round(totalDays * 0.15));
  const d2 = Math.max(10, Math.round(totalDays * 0.35));
  const d3 = Math.max(7, Math.round(totalDays * 0.20));
  const d4 = Math.max(7, Math.round(totalDays * 0.20));
  const d5 = Math.max(4, totalDays - (d1 + d2 + d3 + d4));

  const getShort = (raw, fallback) => {
    if (!raw) return fallback;
    const first = raw.split('/')[0].split('&')[0].trim();
    return first || fallback;
  };

  return [
    {
      id: 'stage_1',
      name: stageNames[0] || 'Seedling / Emergence',
      shortName: getShort(stageNames[0], 'Seedling'),
      days: d1,
      range: [0, d1 / totalDays],
      moisture: { min: moistureCurve[0].min, optimalMin: moistureCurve[0].optMin, optimalMax: moistureCurve[0].optMax, max: moistureCurve[0].max },
      temp: tempRange,
      npkAdj: { n: npkScale[0] * 0.7, p: npkScale[1] * 1.2, k: npkScale[2] * 0.8 },
      advisoryNote: 'Establish healthy root architecture. Avoid moisture stress or water stagnation.',
      advice: 'Establish healthy root architecture. Avoid moisture stress or water stagnation.'
    },
    {
      id: 'stage_2',
      name: stageNames[1] || 'Vegetative Growth / Tillering',
      shortName: getShort(stageNames[1], 'Vegetative'),
      days: d2,
      range: [d1 / totalDays, (d1 + d2) / totalDays],
      moisture: { min: moistureCurve[1].min, optimalMin: moistureCurve[1].optMin, optimalMax: moistureCurve[1].optMax, max: moistureCurve[1].max },
      temp: tempRange,
      npkAdj: { n: npkScale[0] * 1.3, p: npkScale[1] * 1.0, k: npkScale[2] * 1.0 },
      advisoryNote: 'Peak vegetative biomass buildup. Ensure adequate Nitrogen and consistent moisture.',
      advice: 'Peak vegetative biomass buildup. Ensure adequate Nitrogen and consistent moisture.'
    },
    {
      id: 'stage_3',
      name: stageNames[2] || 'Flowering / Panicle Initiation',
      shortName: getShort(stageNames[2], 'Flowering'),
      days: d3,
      range: [(d1 + d2) / totalDays, (d1 + d2 + d3) / totalDays],
      moisture: { min: moistureCurve[2].min, optimalMin: moistureCurve[2].optMin, optimalMax: moistureCurve[2].optMax, max: moistureCurve[2].max },
      temp: tempRange,
      npkAdj: { n: npkScale[0] * 1.0, p: npkScale[1] * 1.3, k: npkScale[2] * 1.3 },
      advisoryNote: 'Critical reproductive window. Severe water or heat stress directly reduces pollination and yield.',
      advice: 'Critical reproductive window. Severe water or heat stress directly reduces pollination and yield.'
    },
    {
      id: 'stage_4',
      name: stageNames[3] || 'Grain Filling / Fruit Sizing',
      shortName: getShort(stageNames[3], 'Grain Filling'),
      days: d4,
      range: [(d1 + d2 + d3) / totalDays, (d1 + d2 + d3 + d4) / totalDays],
      moisture: { min: moistureCurve[3].min, optimalMin: moistureCurve[3].optMin, optimalMax: moistureCurve[3].optMax, max: moistureCurve[3].max },
      temp: tempRange,
      npkAdj: { n: npkScale[0] * 0.8, p: npkScale[1] * 0.9, k: npkScale[2] * 1.4 },
      advisoryNote: 'Dry matter translocation phase. Boost Potassium for grain density and fruit firmness.',
      advice: 'Dry matter translocation phase. Boost Potassium for grain density and fruit firmness.'
    },
    {
      id: 'stage_5',
      name: stageNames[4] || 'Maturity / Harvest Readiness',
      shortName: getShort(stageNames[4], 'Harvest'),
      days: d5,
      range: [(d1 + d2 + d3 + d4) / totalDays, 1.0],
      moisture: { min: moistureCurve[4].min, optimalMin: moistureCurve[4].optMin, optimalMax: moistureCurve[4].optMax, max: moistureCurve[4].max },
      temp: tempRange,
      npkAdj: { n: npkScale[0] * 0.3, p: npkScale[1] * 0.5, k: npkScale[2] * 0.5 },
      advisoryNote: 'Terminal ripening. Drain excess standing water 10–14 days prior to harvest.',
      advice: 'Terminal ripening. Drain excess standing water 10–14 days prior to harvest.'
    }
  ];
};

// ─── MASTER CROP LIFECYCLE REPOSITORY (86 CROPS) ─────────────────────────────
export const ALL_86_CROP_PROFILES = {
  // ── GRAINS & CEREALS ──────────────────────────────────────────────────────
  'rice': {
    name: 'Rice (Paddy)',
    type: 'Grain',
    totalDays: 120,
    baselineYield: 18,
    msp: 2320,
    unit: 'q/acre',
    stages: createStages(120,
      ['Seedling & Nursery', 'Tillering & Vegetative', 'Panicle Initiation & Booting', 'Grain Filling & Milk Stage', 'Maturity & Harvest'],
      [{ min: 65, optMin: 75, optMax: 90, max: 98 }, { min: 70, optMin: 80, optMax: 95, max: 100 }, { min: 75, optMin: 85, optMax: 98, max: 100 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 20, max: 35 }
    )
  },
  'wheat': {
    name: 'Wheat',
    type: 'Grain',
    totalDays: 125,
    baselineYield: 22,
    msp: 2425,
    unit: 'q/acre',
    stages: createStages(125,
      ['Crown Root Initiation (CRI)', 'Tillering & Jointing', 'Heading & Flowering', 'Milking & Dough Stage', 'Maturity & Harvest'],
      [{ min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 12, max: 28 }
    )
  },
  'maize (corn)': {
    name: 'Maize (Corn)',
    type: 'Grain',
    totalDays: 105,
    baselineYield: 30,
    msp: 2225,
    unit: 'q/acre',
    stages: createStages(105,
      ['Germination & Seedling', 'Rapid Vegetative (V6–V12)', 'Tasseling & Silking', 'Blister & Dent Stage', 'Black Layer & Maturity'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 18, max: 32 }
    )
  },
  'barley': {
    name: 'Barley',
    type: 'Grain',
    totalDays: 115,
    baselineYield: 20,
    msp: 1850,
    unit: 'q/acre',
    stages: createStages(115,
      ['Seedling Emergence', 'Tillering & Stem Extension', 'Booting & Earing', 'Grain Bulking', 'Maturity'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 25, optMin: 35, optMax: 50, max: 60 }],
      { min: 10, max: 26 }
    )
  },
  'bajra': {
    name: 'Bajra (Pearl Millet)',
    type: 'Grain',
    totalDays: 85,
    baselineYield: 14,
    msp: 2625,
    unit: 'q/acre',
    stages: createStages(85,
      ['Seedling Emergence', 'Tillering & Canopy', 'Panicle Emergence & Anthesis', 'Grain Development', 'Maturity'],
      [{ min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 25, optMin: 35, optMax: 45, max: 55 }],
      { min: 22, max: 38 }
    )
  },
  'jowar': {
    name: 'Jowar (Sorghum)',
    type: 'Grain',
    totalDays: 100,
    baselineYield: 15,
    msp: 3371,
    unit: 'q/acre',
    stages: createStages(100,
      ['Seedling Emergence', 'Whorl Stage & Tillering', 'Booting & Heading', 'Milk to Hard Dough', 'Physiological Ripeness'],
      [{ min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 25, optMin: 35, optMax: 50, max: 60 }],
      { min: 20, max: 36 }
    )
  },
  'ragi': {
    name: 'Ragi (Finger Millet)',
    type: 'Grain',
    totalDays: 110,
    baselineYield: 12,
    msp: 4290,
    unit: 'q/acre',
    stages: createStages(110,
      ['Seedling Establishment', 'Tillering & Leaf Expansion', 'Earhead Emergence', 'Grain Hardening', 'Harvest Readiness'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 25, optMin: 35, optMax: 48, max: 60 }],
      { min: 18, max: 32 }
    )
  },

  // ── PULSES ────────────────────────────────────────────────────────────────
  'arhar/tur': {
    name: 'Arhar / Pigeon Pea',
    type: 'Pulse',
    totalDays: 165,
    baselineYield: 8,
    msp: 7550,
    unit: 'q/acre',
    stages: createStages(165,
      ['Seedling & Nodulation', 'Branching & Vegetative', 'Flowering & Pod Setting', 'Pod Development & Seed Filling', 'Maturity'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 78, max: 85 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 25, optMin: 35, optMax: 45, max: 55 }],
      { min: 18, max: 34 }
    )
  },
  'gram/chana': {
    name: 'Gram / Chickpea',
    type: 'Pulse',
    totalDays: 105,
    baselineYield: 8,
    msp: 5440,
    unit: 'q/acre',
    stages: createStages(105,
      ['Germination & Seedling', 'Branching & Root Spread', 'Flowering & Pod Initiation', 'Pod Filling', 'Maturity'],
      [{ min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 20, optMin: 30, optMax: 45, max: 55 }],
      { min: 14, max: 28 }
    )
  },
  'moong': {
    name: 'Green Gram (Moong)',
    type: 'Pulse',
    totalDays: 65,
    baselineYield: 6,
    msp: 8682,
    unit: 'q/acre',
    stages: createStages(65,
      ['Sprouting & Seedling', 'Vegetative Canopy', 'Flowering & Pod Flush', 'Pod Maturation', 'Harvest Readiness'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 25, optMin: 35, optMax: 45, max: 55 }],
      { min: 22, max: 35 }
    )
  },
  'urad': {
    name: 'Black Gram (Urad)',
    type: 'Pulse',
    totalDays: 75,
    baselineYield: 6,
    msp: 7400,
    unit: 'q/acre',
    stages: createStages(75,
      ['Seedling Emergence', 'Vegetative Branching', 'Flowering & Pod Formation', 'Pod Development', 'Harvest'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 38, optMin: 48, optMax: 62, max: 72 }, { min: 25, optMin: 35, optMax: 45, max: 55 }],
      { min: 22, max: 35 }
    )
  },
  'masoor': {
    name: 'Lentil (Masoor)',
    type: 'Pulse',
    totalDays: 110,
    baselineYield: 7,
    msp: 6700,
    unit: 'q/acre',
    stages: createStages(110,
      ['Seedling Emergence', 'Vegetative Tillering', 'Flowering & Podding', 'Seed Filling', 'Ripening'],
      [{ min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 22, optMin: 30, optMax: 42, max: 52 }],
      { min: 12, max: 26 }
    )
  },
  'kidney beans': {
    name: 'Kidney Beans (Rajma)',
    type: 'Pulse',
    totalDays: 95,
    baselineYield: 9,
    msp: 7800,
    unit: 'q/acre',
    stages: createStages(95,
      ['Germination & Seedling', 'Foliage Development', 'Flowering & Pod Set', 'Seed Sizing', 'Pod Dryness'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 82, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 30, optMin: 40, optMax: 50, max: 60 }],
      { min: 14, max: 28 }
    )
  },
  'moth beans': {
    name: 'Moth Beans',
    type: 'Pulse',
    totalDays: 70,
    baselineYield: 5,
    msp: 6500,
    unit: 'q/acre',
    stages: createStages(70,
      ['Seedling', 'Spreading & Branching', 'Flowering', 'Pod Development', 'Maturity'],
      [{ min: 30, optMin: 40, optMax: 55, max: 65 }, { min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 45, optMin: 55, optMax: 68, max: 75 }, { min: 30, optMin: 40, optMax: 55, max: 65 }, { min: 20, optMin: 28, optMax: 40, max: 50 }],
      { min: 22, max: 38 }
    )
  },

  // ── CASH & FIBER CROPS ───────────────────────────────────────────────────
  'sugarcane': {
    name: 'Sugarcane',
    type: 'Cash Crop',
    totalDays: 360,
    baselineYield: 380,
    msp: 340,
    unit: 'q/acre',
    stages: createStages(360,
      ['Germination Phase', 'Tillering & Formative', 'Grand Growth Phase', 'Cane Elongation & Sugar Accumulation', 'Ripening & Harvest'],
      [{ min: 60, optMin: 70, optMax: 85, max: 95 }, { min: 65, optMin: 75, optMax: 90, max: 98 }, { min: 70, optMin: 80, optMax: 95, max: 100 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 22, max: 36 }
    )
  },
  'cotton': {
    name: 'Cotton',
    type: 'Fiber',
    totalDays: 160,
    baselineYield: 13,
    msp: 7120,
    unit: 'q/acre',
    stages: createStages(160,
      ['Seedling Emergence', 'Square Initiation', 'Flowering & Peak Boll Setting', 'Boll Development & Bulking', 'Boll Bursting & Harvest'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 22, max: 35 }
    )
  },
  'jute': {
    name: 'Jute',
    type: 'Fiber',
    totalDays: 120,
    baselineYield: 14,
    msp: 5050,
    unit: 'q/acre',
    stages: createStages(120,
      ['Seedling Emergence', 'Vegetative Canopy & Branching', 'Active Fiber Formation', 'Pod Initiation', 'Maturity (Small Pod Stage)'],
      [{ min: 60, optMin: 70, optMax: 85, max: 95 }, { min: 70, optMin: 80, optMax: 95, max: 100 }, { min: 75, optMin: 85, optMax: 98, max: 100 }, { min: 60, optMin: 70, optMax: 85, max: 95 }, { min: 45, optMin: 55, optMax: 70, max: 80 }],
      { min: 24, max: 37 }
    )
  },
  'coffee': {
    name: 'Coffee',
    type: 'Cash Crop',
    totalDays: 240,
    baselineYield: 10,
    msp: 11000,
    unit: 'q/acre',
    stages: createStages(240,
      ['Post-Harvest Flush', 'Blossom & Fruit Setting', 'Berry Expansion', 'Berry Hardening & Ripening', 'Cherry Harvesting'],
      [{ min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 16, max: 28 }
    )
  },

  // ── OILSEEDS ──────────────────────────────────────────────────────────────
  'groundnut (peanut)': {
    name: 'Groundnut (Peanut)',
    type: 'Oilseed',
    totalDays: 115,
    baselineYield: 11,
    msp: 6780,
    unit: 'q/acre',
    stages: createStages(115,
      ['Emergence & Seedling', 'Vegetative Branching', 'Flowering & Peg Penetration', 'Pod Development', 'Harvest Readiness'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 22, max: 34 }
    )
  },
  'groundnut': {
    name: 'Groundnut',
    type: 'Oilseed',
    totalDays: 115,
    baselineYield: 11,
    msp: 6780,
    unit: 'q/acre',
    stages: createStages(115,
      ['Emergence & Seedling', 'Vegetative Branching', 'Flowering & Peg Penetration', 'Pod Development', 'Harvest Readiness'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 22, max: 34 }
    )
  },
  'mustard': {
    name: 'Mustard',
    type: 'Oilseed',
    totalDays: 110,
    baselineYield: 8.5,
    msp: 5650,
    unit: 'q/acre',
    stages: createStages(110,
      ['Seedling Emergence', 'Rosette & Branching', 'Flowering & Siliqua Initiation', 'Seed Filling & Siliqua Growth', 'Maturity'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 78, max: 88 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 25, optMin: 35, optMax: 48, max: 58 }],
      { min: 14, max: 26 }
    )
  },
  'soybean': {
    name: 'Soybean',
    type: 'Oilseed',
    totalDays: 100,
    baselineYield: 10,
    msp: 4892,
    unit: 'q/acre',
    stages: createStages(100,
      ['Seedling Emergence', 'Vegetative Canopy (V1–Vn)', 'Flowering & Podding (R1–R3)', 'Seed Bulking (R5–R6)', 'Maturity (R8)'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 20, max: 32 }
    )
  },
  'sunflower': {
    name: 'Sunflower',
    type: 'Oilseed',
    totalDays: 90,
    baselineYield: 9,
    msp: 6760,
    unit: 'q/acre',
    stages: createStages(90,
      ['Seedling Establishment', 'Stem Elongation', 'Budding & Ray Floret Opening', 'Seed Filling & Acidity', 'Back of Head Yellowing (Maturity)'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 28, optMin: 36, optMax: 50, max: 60 }],
      { min: 18, max: 32 }
    )
  },

  // ── VEGETABLES ────────────────────────────────────────────────────────────
  'potato': {
    name: 'Potato',
    type: 'Vegetable',
    totalDays: 95,
    baselineYield: 100,
    msp: 1200,
    unit: 'q/acre',
    stages: createStages(95,
      ['Sprouting & Emergence', 'Vegetative Canopy', 'Tuber Initiation', 'Tuber Bulking', 'Haulm Senescence & Harvest'],
      [{ min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 14, max: 25 }
    )
  },
  'tomato': {
    name: 'Tomato',
    type: 'Vegetable',
    totalDays: 110,
    baselineYield: 150,
    msp: 1600,
    unit: 'q/acre',
    stages: createStages(110,
      ['Seedling / Transplant Recovery', 'Foliage Growth & Branching', 'Flowering & Fruit Set', 'Fruit Enlargement', 'Ripening & Staggered Harvest'],
      [{ min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 18, max: 32 }
    )
  },
  'onion': {
    name: 'Onion',
    type: 'Vegetable',
    totalDays: 130,
    baselineYield: 110,
    msp: 1800,
    unit: 'q/acre',
    stages: createStages(130,
      ['Seedling Establishment', 'Foliage Growth', 'Bulb Initiation', 'Bulb Enlargement', 'Neck Fall & Curing'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 30, optMin: 40, optMax: 50, max: 60 }],
      { min: 14, max: 30 }
    )
  },
  'brinjal (eggplant)': {
    name: 'Brinjal (Eggplant)',
    type: 'Vegetable',
    totalDays: 120,
    baselineYield: 120,
    msp: 1400,
    unit: 'q/acre',
    stages: createStages(120,
      ['Nursery & Transplant', 'Vegetative Canopy', 'Flowering & Fruit Setting', 'Fruit Sizing', 'Peak Picking'],
      [{ min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 20, max: 32 }
    )
  },
  'cabbage': {
    name: 'Cabbage',
    type: 'Vegetable',
    totalDays: 85,
    baselineYield: 140,
    msp: 1100,
    unit: 'q/acre',
    stages: createStages(85,
      ['Transplant Establishment', 'Foliage Rosette', 'Head Folding', 'Head Firming', 'Maturity'],
      [{ min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }],
      { min: 12, max: 24 }
    )
  },
  'cauliflower': {
    name: 'Cauliflower',
    type: 'Vegetable',
    totalDays: 80,
    baselineYield: 130,
    msp: 1300,
    unit: 'q/acre',
    stages: createStages(80,
      ['Transplant Recovery', 'Vegetative Foliage', 'Curd Initiation', 'Curd Development & Blanching', 'Harvest'],
      [{ min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }],
      { min: 14, max: 25 }
    )
  },
  'spinach': {
    name: 'Spinach',
    type: 'Vegetable',
    totalDays: 45,
    baselineYield: 60,
    msp: 1500,
    unit: 'q/acre',
    stages: createStages(45,
      ['Emergence', 'Early Leaves', 'Vegetative Canopy', 'Leaf Flush', 'Multiple Harvests'],
      [{ min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }],
      { min: 12, max: 25 }
    )
  },
  'okra (ladyfinger)': {
    name: 'Okra (Ladyfinger)',
    type: 'Vegetable',
    totalDays: 65,
    baselineYield: 50,
    msp: 2400,
    unit: 'q/acre',
    stages: createStages(65,
      ['Seedling Emergence', 'Vegetative Branching', 'First Flowering', 'Pod Elongation', 'Continuous Harvest'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 22, max: 36 }
    )
  },
  'carrot': {
    name: 'Carrot',
    type: 'Vegetable',
    totalDays: 75,
    baselineYield: 90,
    msp: 1600,
    unit: 'q/acre',
    stages: createStages(75,
      ['Germination', 'Fern Growth', 'Taproot Initiation', 'Root Bulking & Sweetening', 'Harvest Readiness'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 12, max: 22 }
    )
  },
  'radish': {
    name: 'Radish',
    type: 'Vegetable',
    totalDays: 40,
    baselineYield: 80,
    msp: 1200,
    unit: 'q/acre',
    stages: createStages(40,
      ['Emergence', 'Foliage Rosette', 'Root Swelling', 'Rapid Root Bulking', 'Harvest Readiness'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 10, max: 25 }
    )
  },
  'peas': {
    name: 'Green Peas',
    type: 'Vegetable',
    totalDays: 70,
    baselineYield: 35,
    msp: 3200,
    unit: 'q/acre',
    stages: createStages(70,
      ['Seedling Emergence', 'Vine Growth & Tendrils', 'Flowering & Pod Setting', 'Pod Bulking', 'Green Pod Harvest'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 78, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 10, max: 22 }
    )
  },
  'capsicum (bell pepper)': {
    name: 'Capsicum (Bell Pepper)',
    type: 'Vegetable',
    totalDays: 110,
    baselineYield: 90,
    msp: 2800,
    unit: 'q/acre',
    stages: createStages(110,
      ['Transplant Establishment', 'Vegetative Canopy', 'Flowering & Fruit Set', 'Fruit Sizing & Wall Thickening', 'Color Turning & Harvest'],
      [{ min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 18, max: 30 }
    )
  },
  'chili': {
    name: 'Chili',
    type: 'Vegetable',
    totalDays: 130,
    baselineYield: 14,
    msp: 12500,
    unit: 'q/acre',
    stages: createStages(130,
      ['Transplant Recovery', 'Branching & Canopy', 'Flower Flush & Fruit Setting', 'Fruit Maturation', 'Harvest (Green/Dry)'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 20, max: 35 }
    )
  },
  'pumpkin': {
    name: 'Pumpkin',
    type: 'Vegetable',
    totalDays: 115,
    baselineYield: 100,
    msp: 1200,
    unit: 'q/acre',
    stages: createStages(115,
      ['Seedling Emergence', 'Vine Sprawl & Tendril Extension', 'Flowering (Male/Female)', 'Fruit Sizing', 'Skin Hardening & Harvest'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 22, max: 35 }
    )
  },
  'bottle gourd (lauki)': {
    name: 'Bottle Gourd (Lauki)',
    type: 'Vegetable',
    totalDays: 85,
    baselineYield: 120,
    msp: 1100,
    unit: 'q/acre',
    stages: createStages(85,
      ['Sprouting', 'Trellis / Ground Vine Growth', 'Flowering & Fruit Setting', 'Tender Fruit Elongation', 'Picking'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 22, max: 35 }
    )
  },
  'bitter gourd (karela)': {
    name: 'Bitter Gourd (Karela)',
    type: 'Vegetable',
    totalDays: 75,
    baselineYield: 60,
    msp: 2200,
    unit: 'q/acre',
    stages: createStages(75,
      ['Germination', 'Vegetative Vine Growth', 'Flowering & Fruit Setting', 'Fruit Sizing', 'Harvest'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 65, optMin: 75, optMax: 88, max: 95 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 22, max: 35 }
    )
  },
  'cucumber': {
    name: 'Cucumber',
    type: 'Vegetable',
    totalDays: 60,
    baselineYield: 80,
    msp: 1600,
    unit: 'q/acre',
    stages: createStages(60,
      ['Seedling Emergence', 'Vine & Leaf Growth', 'Flowering & Fruit Set', 'Rapid Fruit Elongation', 'Picking'],
      [{ min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 45, optMin: 55, optMax: 70, max: 80 }],
      { min: 20, max: 34 }
    )
  },
  'beans': {
    name: 'French Beans',
    type: 'Vegetable',
    totalDays: 65,
    baselineYield: 45,
    msp: 2800,
    unit: 'q/acre',
    stages: createStages(65,
      ['Emergence', 'Bush / Pole Growth', 'Flowering', 'Pod Development', 'Tender Harvest'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 78, max: 85 }, { min: 60, optMin: 70, optMax: 85, max: 90 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 16, max: 28 }
    )
  },
  'garlic': {
    name: 'Garlic',
    type: 'Vegetable',
    totalDays: 135,
    baselineYield: 35,
    msp: 8500,
    unit: 'q/acre',
    stages: createStages(135,
      ['Clove Sprouting', 'Leaf Initiation', 'Clove / Bulb Differentiation', 'Bulb Enlargement', 'Maturity & Top Drying'],
      [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 25, optMin: 35, optMax: 48, max: 58 }],
      { min: 12, max: 26 }
    )
  },
  'ginger': {
    name: 'Ginger',
    type: 'Cash Crop',
    totalDays: 220,
    baselineYield: 60,
    msp: 6500,
    unit: 'q/acre',
    stages: createStages(220,
      ['Rhizome Sprouting', 'Tillering & Canopy', 'Rhizome Initiation', 'Rhizome Bulking', 'Leaf Yellowing & Harvest'],
      [{ min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 70, optMin: 80, optMax: 95, max: 98 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 20, max: 32 }
    )
  },
  'turmeric': {
    name: 'Turmeric',
    type: 'Cash Crop',
    totalDays: 240,
    baselineYield: 75,
    msp: 7200,
    unit: 'q/acre',
    stages: createStages(240,
      ['Sprouting', 'Vegetative Tillering', 'Rhizome Formation', 'Rhizome Maturation & Curcumin Bulking', 'Senescence & Harvest'],
      [{ min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 70, optMin: 80, optMax: 95, max: 98 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
      { min: 20, max: 34 }
    )
  },
  'tea': {
    name: 'Tea',
    type: 'Cash Crop',
    totalDays: 45,
    baselineYield: 25,
    msp: 4500,
    unit: 'q/acre',
    stages: createStages(45,
      ['Dormancy Break', 'Bud Opening', 'Active Two-and-a-Bud Flush', 'Peak Plucking Flush', 'Pruning Recovery'],
      [{ min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 70, optMin: 80, optMax: 95, max: 98 }, { min: 75, optMin: 85, optMax: 98, max: 100 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 50, optMin: 60, optMax: 75, max: 85 }],
      { min: 16, max: 28 }
    )
  },
  'rubber': {
    name: 'Rubber',
    type: 'Cash Crop',
    totalDays: 300,
    baselineYield: 8,
    msp: 18000,
    unit: 'q/acre',
    stages: createStages(300,
      ['Wintering & Refoliation', 'Active Latex Synthesis', 'Peak Tapping Flush', 'Late Tapping', 'Rest Period'],
      [{ min: 60, optMin: 70, optMax: 85, max: 95 }, { min: 65, optMin: 75, optMax: 90, max: 98 }, { min: 70, optMin: 80, optMax: 95, max: 100 }, { min: 60, optMin: 70, optMax: 85, max: 95 }, { min: 45, optMin: 55, optMax: 70, max: 80 }],
      { min: 22, max: 35 }
    )
  },
  'cumin': {
    name: 'Cumin (Jeera)',
    type: 'Cash Crop',
    totalDays: 105,
    baselineYield: 4,
    msp: 25000,
    unit: 'q/acre',
    stages: createStages(105,
      ['Emergence', 'Vegetative Canopy', 'Umbels & Flowering', 'Seed Bulking', 'Harvest Readiness'],
      [{ min: 30, optMin: 40, optMax: 55, max: 65 }, { min: 35, optMin: 45, optMax: 60, max: 70 }, { min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 30, optMin: 40, optMax: 55, max: 65 }, { min: 18, optMin: 25, optMax: 38, max: 48 }],
      { min: 15, max: 28 }
    )
  },
  'black pepper': {
    name: 'Black Pepper',
    type: 'Cash Crop',
    totalDays: 210,
    baselineYield: 6,
    msp: 62000,
    unit: 'q/acre',
    stages: createStages(210,
      ['Spike Emergence', 'Flowering & Berry Set', 'Berry Enlargement', 'Berry Maturation', 'Harvest Readiness'],
      [{ min: 65, optMin: 75, optMax: 90, max: 98 }, { min: 70, optMin: 80, optMax: 95, max: 100 }, { min: 70, optMin: 80, optMax: 95, max: 100 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }],
      { min: 20, max: 34 }
    )
  },
  'cardamom': {
    name: 'Cardamom',
    type: 'Cash Crop',
    totalDays: 180,
    baselineYield: 3,
    msp: 120000,
    unit: 'q/acre',
    stages: createStages(180,
      ['Panicle Emergence', 'Flowering', 'Capsule Setting', 'Capsule Swelling & Seed Darkening', 'Harvest Pickings'],
      [{ min: 70, optMin: 80, optMax: 95, max: 100 }, { min: 75, optMin: 85, optMax: 98, max: 100 }, { min: 75, optMin: 85, optMax: 98, max: 100 }, { min: 60, optMin: 70, optMax: 85, max: 95 }, { min: 50, optMin: 60, optMax: 75, max: 85 }],
      { min: 15, max: 26 }
    )
  },
  'fenugreek': {
    name: 'Fenugreek (Methi)',
    type: 'Vegetable',
    totalDays: 50,
    baselineYield: 25,
    msp: 4500,
    unit: 'q/acre',
    stages: createStages(50,
      ['Sprouting', 'Vegetative Foliage', 'Branching', 'Leaf Flush', 'Harvest (Greens)'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 14, max: 26 }
    )
  },
  'coriander': {
    name: 'Coriander (Dhaniya)',
    type: 'Vegetable',
    totalDays: 45,
    baselineYield: 30,
    msp: 4800,
    unit: 'q/acre',
    stages: createStages(45,
      ['Seedling Emergence', 'Basal Foliage Expansion', 'Canopy Spread', 'Leaf Harvest', 'Bolting / Seed Set'],
      [{ min: 40, optMin: 50, optMax: 65, max: 75 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 30, optMin: 40, optMax: 55, max: 65 }],
      { min: 14, max: 26 }
    )
  },
  'mint': {
    name: 'Mint (Pudina)',
    type: 'Vegetable',
    totalDays: 40,
    baselineYield: 40,
    msp: 3500,
    unit: 'q/acre',
    stages: createStages(40,
      ['Stolon Establishment', 'Vegetative Canopy', 'Foliage Maturation', 'Essential Oil Peak', 'Harvesting'],
      [{ min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 65, optMin: 75, optMax: 90, max: 95 }, { min: 55, optMin: 65, optMax: 80, max: 90 }, { min: 40, optMin: 50, optMax: 65, max: 75 }],
      { min: 15, max: 28 }
    )
  }
};

// Generic generator for remainder of the 86 crops (Fruits, Floriculture, Seeds)
const genericProfiles = [
  // Fruits
  { id: 'mango', name: 'Mango', type: 'Fruit', days: 150, yield: 60, msp: 3500 },
  { id: 'banana', name: 'Banana', type: 'Fruit', days: 330, yield: 240, msp: 1800 },
  { id: 'apple', name: 'Apple', type: 'Fruit', days: 160, yield: 90, msp: 6500 },
  { id: 'guava', name: 'Guava', type: 'Fruit', days: 120, yield: 70, msp: 2200 },
  { id: 'orange', name: 'Orange (Citrus)', type: 'Fruit', days: 210, yield: 80, msp: 3800 },
  { id: 'papaya', name: 'Papaya', type: 'Fruit', days: 270, yield: 180, msp: 1500 },
  { id: 'pomegranate', name: 'Pomegranate', type: 'Fruit', days: 180, yield: 50, msp: 7500 },
  { id: 'grapes', name: 'Grapes', type: 'Fruit', days: 135, yield: 90, msp: 5500 },
  { id: 'pineapple', name: 'Pineapple', type: 'Fruit', days: 450, yield: 140, msp: 2400 },
  { id: 'watermelon', name: 'Watermelon', type: 'Fruit', days: 85, yield: 150, msp: 1100 },
  { id: 'muskmelon', name: 'Muskmelon', type: 'Fruit', days: 80, yield: 90, msp: 1600 },
  { id: 'litchi', name: 'Litchi', type: 'Fruit', days: 110, yield: 45, msp: 7000 },
  { id: 'coconut', name: 'Coconut', type: 'Fruit', days: 365, yield: 80, msp: 3000 },
  { id: 'cashew', name: 'Cashew', type: 'Fruit', days: 120, yield: 12, msp: 9500 },
  { id: 'almond', name: 'Almond', type: 'Fruit', days: 180, yield: 14, msp: 35000 },
  { id: 'walnut', name: 'Walnut', type: 'Fruit', days: 160, yield: 16, msp: 28000 },

  // Flowers
  { id: 'rose', name: 'Rose', type: 'Flower', days: 60, yield: 20, msp: 8000 },
  { id: 'marigold', name: 'Marigold', type: 'Flower', days: 70, yield: 45, msp: 3500 },
  { id: 'jasmine', name: 'Jasmine', type: 'Flower', days: 65, yield: 18, msp: 14000 },
  { id: 'lotus', name: 'Lotus', type: 'Flower', days: 90, yield: 15, msp: 12000 },
  { id: 'hibiscus', name: 'Hibiscus', type: 'Flower', days: 60, yield: 22, msp: 6500 },
  { id: 'chrysanthemum', name: 'Chrysanthemum', type: 'Flower', days: 115, yield: 30, msp: 7500 },
  { id: 'tuberose (rajnigandha)', name: 'Tuberose (Rajnigandha)', type: 'Flower', days: 100, yield: 35, msp: 9000 },
  { id: 'lily', name: 'Lily', type: 'Flower', days: 90, yield: 25, msp: 12000 },
  { id: 'orchid', name: 'Orchid', type: 'Flower', days: 120, yield: 12, msp: 30000 },

  // Seeds & Specialty
  { id: 'paddy seeds', name: 'Paddy Seeds', type: 'Seed', days: 45, yield: 10, msp: 3500 },
  { id: 'wheat seeds', name: 'Wheat Seeds', type: 'Seed', days: 35, yield: 12, msp: 3800 },
  { id: 'tomato seeds', name: 'Tomato Seeds', type: 'Seed', days: 30, yield: 5, msp: 15000 },
  { id: 'chili seeds', name: 'Chili Seeds', type: 'Seed', days: 35, yield: 4, msp: 22000 },
  { id: 'brinjal seeds', name: 'Brinjal Seeds', type: 'Seed', days: 35, yield: 5, msp: 18000 },
  { id: 'mustard seeds', name: 'Mustard Seeds', type: 'Seed', days: 30, yield: 6, msp: 6200 },
  { id: 'sesame seeds', name: 'Sesame Seeds', type: 'Seed', days: 85, yield: 4.5, msp: 9200 },
  { id: 'coriander seeds', name: 'Coriander Seeds', type: 'Seed', days: 45, yield: 6, msp: 7500 },
  { id: 'fenugreek seeds', name: 'Fenugreek Seeds', type: 'Seed', days: 40, yield: 5, msp: 6800 },
  { id: 'fennel seeds', name: 'Fennel Seeds', type: 'Seed', days: 150, yield: 8, msp: 9800 }
];

genericProfiles.forEach(g => {
  if (!ALL_86_CROP_PROFILES[g.id]) {
    ALL_86_CROP_PROFILES[g.id] = {
      name: g.name,
      type: g.type,
      totalDays: g.days,
      baselineYield: g.yield,
      msp: g.msp,
      unit: 'q/acre',
      stages: createStages(g.days,
        ['Establishment & Early Flush', 'Vegetative Canopy', 'Flowering / Bloom Initiation', 'Yield Bulking / Sizing', 'Harvest Readiness'],
        [{ min: 45, optMin: 55, optMax: 70, max: 80 }, { min: 55, optMin: 65, optMax: 80, max: 88 }, { min: 60, optMin: 70, optMax: 85, max: 92 }, { min: 50, optMin: 60, optMax: 75, max: 85 }, { min: 35, optMin: 45, optMax: 60, max: 70 }],
        { min: 18, max: 32 }
      )
    };
  }
});

// Normalized lookup function
export const getCropProfile = (cropName) => {
  if (!cropName) return ALL_86_CROP_PROFILES['rice'];
  const clean = cropName.toLowerCase().trim();
  
  if (ALL_86_CROP_PROFILES[clean]) return ALL_86_CROP_PROFILES[clean];
  
  // Aliases
  if (clean.includes('rice') || clean.includes('paddy')) return ALL_86_CROP_PROFILES['rice'];
  if (clean.includes('corn') || clean.includes('maize')) return ALL_86_CROP_PROFILES['maize (corn)'];
  if (clean.includes('peanut') || clean.includes('groundnut')) return ALL_86_CROP_PROFILES['groundnut (peanut)'];
  if (clean.includes('tomato')) return ALL_86_CROP_PROFILES['tomato'];
  if (clean.includes('wheat')) return ALL_86_CROP_PROFILES['wheat'];
  if (clean.includes('chili') || clean.includes('chilli')) return ALL_86_CROP_PROFILES['chili'];
  if (clean.includes('brinjal') || clean.includes('eggplant')) return ALL_86_CROP_PROFILES['brinjal (eggplant)'];
  if (clean.includes('potato')) return ALL_86_CROP_PROFILES['potato'];
  if (clean.includes('onion')) return ALL_86_CROP_PROFILES['onion'];
  if (clean.includes('cotton')) return ALL_86_CROP_PROFILES['cotton'];
  if (clean.includes('sugarcane')) return ALL_86_CROP_PROFILES['sugarcane'];

  // Match by key substring
  const match = Object.keys(ALL_86_CROP_PROFILES).find(k => k.includes(clean) || clean.includes(k));
  if (match) return ALL_86_CROP_PROFILES[match];

  return ALL_86_CROP_PROFILES['rice'];
};

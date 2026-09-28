/**
 * AgriSense Pro — Agronomic Yield-Risk Forecasting Engine
 * Calculates projected harvest yield, cumulative environmental stress penalties,
 * and economic revenue protection metrics.
 */

// Standard Indian Farm Baselines: Potential Yield (Quintals/Acre) & Market Value (INR/Quintal)
export const CROP_YIELD_BASELINES = {
  'rice': { potential: 18, min: 14, max: 24, msp: 2320, unit: 'q/acre' },
  'wheat': { potential: 22, min: 16, max: 26, msp: 2425, unit: 'q/acre' },
  'maize (corn)': { potential: 30, min: 22, max: 36, msp: 2225, unit: 'q/acre' },
  'cotton': { potential: 13, min: 8, max: 18, msp: 7120, unit: 'q/acre' },
  'groundnut (peanut)': { potential: 11, min: 7, max: 15, msp: 6780, unit: 'q/acre' },
  'groundnut': { potential: 11, min: 7, max: 15, msp: 6780, unit: 'q/acre' },
  'mustard': { potential: 8.5, min: 5, max: 12, msp: 5650, unit: 'q/acre' },
  'soybean': { potential: 10, min: 6, max: 14, msp: 4892, unit: 'q/acre' },
  'sugarcane': { potential: 380, min: 280, max: 460, msp: 340, unit: 'q/acre' },
  'potato': { potential: 100, min: 70, max: 130, msp: 1200, unit: 'q/acre' },
  'tomato': { potential: 150, min: 100, max: 200, msp: 1600, unit: 'q/acre' },
  'onion': { potential: 110, min: 75, max: 140, msp: 1800, unit: 'q/acre' },
  'chili': { potential: 14, min: 9, max: 18, msp: 12500, unit: 'q/acre' },
  'gram/chana': { potential: 8, min: 5, max: 11, msp: 5440, unit: 'q/acre' }
};

/**
 * Calculates current yield projection and cumulative stress loss
 * @param {string} cropName 
 * @param {object} sensorData Current live sensor data
 * @param {Array} sensorHistory Historical sensor entries
 * @param {number} acreage Farm size in acres (default: 2.0)
 * @param {object} lifecycle Stage lifecycle info
 */
export const calculateYieldForecast = (cropName, sensorData, sensorHistory = [], acreage = 2.0, lifecycle = null) => {
  const normCrop = (cropName || 'rice').toLowerCase().trim();
  const baseline = CROP_YIELD_BASELINES[normCrop] || { potential: 20, min: 14, max: 25, msp: 2500, unit: 'q/acre' };

  // 1. Analyze historical stress events (or sample current telemetry if history is sparse)
  let heatStressPoints = 0;
  let droughtStressPoints = 0;
  let waterloggingPoints = 0;
  let totalDataPoints = Math.max(1, sensorHistory.length);

  if (sensorHistory && sensorHistory.length > 0) {
    sensorHistory.forEach(entry => {
      const temp = entry.weather?.temp;
      const moist = entry.soil?.moisture;
      if (temp != null && temp > 35) heatStressPoints++;
      if (moist != null && moist < 30) droughtStressPoints++;
      if (moist != null && moist > 88) waterloggingPoints++;
    });
  } else {
    // Current telemetry fallback
    const curTemp = sensorData?.weather?.temp || 28;
    const curMoist = sensorData?.soil?.moisture || 45;
    if (curTemp > 35) heatStressPoints = 3;
    if (curMoist < 30) droughtStressPoints = 4;
    if (curMoist > 88) waterloggingPoints = 2;
    totalDataPoints = 10;
  }

  // 2. Compute Loss Penalties
  // Heat stress: up to 18% loss
  const heatRatio = Math.min(1.0, heatStressPoints / totalDataPoints);
  const heatLossPct = Math.round(heatRatio * 18);

  // Moisture stress (Drought): up to 25% loss
  const droughtRatio = Math.min(1.0, droughtStressPoints / totalDataPoints);
  const droughtLossPct = Math.round(droughtRatio * 25);

  // Waterlogging / Poor drainage: up to 12% loss
  const waterlogRatio = Math.min(1.0, waterloggingPoints / totalDataPoints);
  const waterlogLossPct = Math.round(waterlogRatio * 12);

  // Soil Nutrient deficiency penalty
  let nutrientLossPct = 0;
  const n = sensorData?.soil?.npk?.n;
  const p = sensorData?.soil?.npk?.p;
  const k = sensorData?.soil?.npk?.k;
  if (n != null && n < 40) nutrientLossPct += 4;
  if (p != null && p < 25) nutrientLossPct += 3;
  if (k != null && k < 30) nutrientLossPct += 3;

  // Cumulative penalty capped at 45% maximum yield loss
  const totalPenaltyPct = Math.min(45, heatLossPct + droughtLossPct + waterlogLossPct + nutrientLossPct);
  
  // Health Index (100 - penalty)
  const yieldHealthScore = Math.max(55, 100 - totalPenaltyPct);

  // Projected Yield
  const projectedPerAcre = Number((baseline.potential * (1 - (totalPenaltyPct / 100))).toFixed(1));
  const totalProjectedYield = Number((projectedPerAcre * acreage).toFixed(1));
  const totalBaselineYield = Number((baseline.potential * acreage).toFixed(1));

  // Economic Impact in INR
  const projectedRevenue = Math.round(totalProjectedYield * baseline.msp);
  const potentialRevenue = Math.round(totalBaselineYield * baseline.msp);
  const revenueLossRisk = Math.max(0, potentialRevenue - projectedRevenue);

  // Agronomic Remediation Advice
  let keyMitigation = 'Field micro-climate is optimal. Maintain regular crop monitoring.';
  if (droughtLossPct > 5) {
    keyMitigation = 'Urgent: Apply light irrigation cycle to halt moisture stress penalties.';
  } else if (heatLossPct > 5) {
    keyMitigation = 'High canopy temperatures detected. Consider misting or shade netting to protect flowering.';
  } else if (nutrientLossPct > 4) {
    keyMitigation = 'Nutrient deficiency limiting yield. Apply targeted top-dressing as advised in Soil Forensics.';
  } else if (waterlogLossPct > 4) {
    keyMitigation = 'Excessive moisture detected. Clear drainage trenches to prevent root hypoxia.';
  }

  return {
    crop: normCrop,
    unit: baseline.unit,
    msp: baseline.msp,
    acreage,
    potentialPerAcre: baseline.potential,
    projectedPerAcre,
    totalProjectedYield,
    totalBaselineYield,
    totalPotentialYield: totalBaselineYield,
    totalPenaltyPct,
    yieldHealthScore,
    projectedRevenue,
    potentialRevenue,
    revenueLossRisk,
    stressBreakdown: {
      heatLossPct,
      droughtLossPct,
      waterlogLossPct,
      nutrientLossPct
    },
    keyMitigation
  };
};

/**
 * AgriSense Pro / Krishi Sethu — Central Agronomic Decision Engine
 * 
 * Unifies raw IoT sensor telemetry, phenological growth stage, 72-hour weather projections,
 * and environmental stress accumulation into a single synchronized decision matrix.
 * 
 * Pipeline:
 * Telemetry + Plot Profile -> Normalization -> Growth/Weather/Stress Engines -> Central Cross-Correlator
 *   -> Outputs: Irrigation (Auto-Pilot), Yield-Risk & Conservation, Multi-Channel Advisory (App/Voice/SMS/OLED)
 */

import { calculateCropLifecycle, getStageAdaptiveThresholds, getIPMRecommendations } from '../data/core/AgronomyUtils';
import { calculateYieldForecast } from './yieldForecastingEngine';
import { evaluateIrrigationAutoPilot, detectWaterlogging } from './healthEngine';

/**
 * Evaluates the comprehensive farm decision matrix for an active plot
 * @param {object} plot Active plot object { id, name, crop, variety, acreage, sowingDate, soil, irrigationZone }
 * @param {object} sensorData Live normalized sensor telemetry
 * @param {Array} sensorHistory Historical telemetry log
 * @param {Array} weatherForecast 72-hour Open-Meteo forecast points
 * @param {object} weatherRisk Disaster flags { isFloodRisk, isDroughtRisk, isFungalRisk }
 * @returns {object} Unified decision package
 */
export const runDecisionEngine = ({
  plot,
  sensorData,
  sensorHistory = [],
  weatherForecast = [],
  weatherRisk = {}
}) => {
  const cropName = plot?.crop || 'rice';
  const acreage = Number(plot?.acreage || 2.0);
  const sowingDate = plot?.sowingDate || new Date(Date.now() - (35 * 86400000)).toISOString().split('T')[0];

  // 1. PHENOLOGICAL GROWTH STAGE & STAGE-ADAPTIVE THRESHOLDS
  const lifecycle = calculateCropLifecycle(cropName, sowingDate);
  const baseSpec = {
    idealMoisture: { min: 35, max: 75 },
    npk: { n: 50, p: 30, k: 40 }
  };
  const adaptiveThresholds = getStageAdaptiveThresholds(baseSpec, lifecycle?.activeStage);

  // 2. STRESS & YIELD-RISK FORECASTING
  const yieldForecast = calculateYieldForecast(cropName, sensorData, sensorHistory, acreage, lifecycle);

  // 3. SMART IRRIGATION CLOSED-LOOP DECISION
  const autoPilot = evaluateIrrigationAutoPilot(
    sensorData,
    weatherForecast,
    adaptiveThresholds?.idealMoisture?.min || 35
  );

  // 4. WATER CONSERVATION & WATERLOGGING ACCOUNTING
  const waterlogging = detectWaterlogging(sensorHistory);
  // Estimate ~7,050 L / 2 acres traditional flood baseline vs ~4,650 L precision drip/relay
  const baselineFloodLiters = Math.round(acreage * 3529.4);
  const estimatedLitersUsed = Math.round(acreage * (autoPilot.shouldRunPump ? 2450 : 2329.4));
  const litersSaved = Math.max(0, baselineFloodLiters - estimatedLitersUsed);
  const percentSaved = Math.round((litersSaved / baselineFloodLiters) * 100);

  // 5. PROGRESSIVE IPM RECOMMENDATIONS
  const ipmLadder = getIPMRecommendations(cropName);

  // 6. SYNTHESIZED MULTI-CHANNEL ADVISORY & SEVERITY
  const isMoistureValid = sensorData?.soil?.moisture !== null && sensorData?.soil?.moisture !== undefined && !isNaN(sensorData?.soil?.moisture);
  const currentMoisture = isMoistureValid ? Math.round(sensorData.soil.moisture) : null;
  const isTempValid = sensorData?.weather?.temp !== null && sensorData?.weather?.temp !== undefined && !isNaN(sensorData?.weather?.temp);
  const currentTemp = isTempValid ? Math.round(sensorData.weather.temp) : null;
  const stageName = lifecycle?.activeStage?.name || 'Vegetative';

  let severity = 'optimal'; // 'optimal' | 'warning' | 'critical' | 'offline'
  let advisoryTitle = 'Field Micro-Climate Optimal';
  let advisoryBodyEn = '';
  let actionItem = 'Continue scheduled soil moisture monitoring.';

  if (!isMoistureValid) {
    severity = 'offline';
    advisoryTitle = 'Sensors Offline';
    advisoryBodyEn = 'Field sensor node is currently offline. Awaiting live telemetry from ESP32 node.';
    actionItem = 'Check ESP32 node power supply and LoRa/Wi-Fi connection.';
  } else if (waterlogging.isWaterlogged || weatherRisk.isFloodRisk) {
    severity = 'critical';
    advisoryTitle = 'Excess Moisture / Flood Risk Alert';
    advisoryBodyEn = `High soil saturation (${currentMoisture}%) detected during ${stageName}. Clear field drainage channels immediately to prevent root rot.`;
    actionItem = 'Inspect drainage outlets and halt all irrigation.';
  } else if (currentMoisture < (adaptiveThresholds?.idealMoisture?.min || 30)) {
    severity = weatherRisk.isHeatRisk ? 'critical' : 'warning';
    advisoryTitle = weatherRisk.isHeatRisk ? 'Heat Wave & Moisture Deficit' : 'Moisture Deficit Detected';
    advisoryBodyEn = `Soil moisture is low (${currentMoisture}%) while ${cropName} is in ${stageName}. Scheduled evening irrigation is strongly recommended.${currentTemp ? ` Current temperature is ${currentTemp}°C.` : ''}`;
    actionItem = 'Activate irrigation pump during the evening low-evaporation window.';
  } else if (weatherRisk.isFungalRisk) {
    severity = 'warning';
    advisoryTitle = 'Fungal Blast (Mills Period) Warning';
    advisoryBodyEn = `Prolonged humidity (>80%) and warm temperatures favor foliar blast. Preventive bio-fungicide spray advised.`;
    actionItem = 'Apply preventive Trichoderma viride or Pseudomonas foliar spray.';
  } else if (currentTemp && currentTemp > 36) {
    severity = 'warning';
    advisoryTitle = 'Thermal Heat Stress Alert';
    advisoryBodyEn = `Ambient temperature (${currentTemp}°C) exceeds optimum for ${stageName}. Canopy cooling recommended.`;
    actionItem = 'Schedule short sprinkler burst at sundown to lower soil temperature.';
  } else {
    advisoryBodyEn = `Soil moisture (${currentMoisture}%) and ambient conditions are well-balanced for the ${stageName} stage. Irrigation is not required today.`;
  }

  // 7. MULTILINGUAL VERNACULAR SCRIPTS (BN, HI, EN — Telugu removed per specification)
  const voiceScripts = {
    en: advisoryBodyEn,
    bn: !isMoistureValid
      ? 'KrishiSethu সিস্টেমে সেন্সর অফলাইনে রয়েছে। রিয়েল-টাইম ডেটা পাওয়ার পর স্বয়ংক্রিয় পরামর্শ চালু হবে।'
      : currentMoisture < (adaptiveThresholds?.idealMoisture?.min || 30)
      ? `মাটিতে আর্দ্রতা কম আছে (${currentMoisture}%)। ${stageName} দশার জন্য আজ সন্ধ্যায় জমিতে সেচ দেওয়ার পরামর্শ দেওয়া হচ্ছে।`
      : (waterlogging.isWaterlogged || currentMoisture > 85)
      ? `জমিতে অতিরিক্ত জল জমেছে (${currentMoisture}%)। শিকড় পচা রোগ এড়াতে অবিলম্বে নিষ্কাশন নালা পরিষ্কার করুন।`
      : `আজকে মাটির আর্দ্রতা অনুকূল আছে (${currentMoisture}%)। সেচের প্রয়োজন নেই। ফসল ${stageName} দশায় ভালো আছে।`,
    hi: !isMoistureValid
      ? 'KrishiSethu सिस्टम में सेंसर अभी ऑफ़लाइन हैं। लाइव डेटा प्राप्त होने पर स्वचालित परामर्श शुरू होगा।'
      : currentMoisture < (adaptiveThresholds?.idealMoisture?.min || 30)
      ? `मिट्टी में नमी कम है (${currentMoisture}%)। ${stageName} अवस्था के लिए आज शाम सिंचाई की सलाह दी जाती है।`
      : (waterlogging.isWaterlogged || currentMoisture > 85)
      ? `खेत में जलभराव है (${currentMoisture}%)। जड़ गलन रोकने के लिए जल निकासी की व्यवस्था करें।`
      : `आज मिट्टी में नमी पर्याप्त है (${currentMoisture}%)। अतिरिक्त सिंचाई की आवश्यकता नहीं है। फसल ${stageName} अवस्था में स्वस्थ है।`
  };

  // 8. GSM 160-CHAR CELLULAR SMS PAYLOAD
  const cleanPlotName = (plot?.name || 'Plot A').slice(0, 12);
  const smsText = !isMoistureValid
    ? `[KRISHI SETHU] ${cleanPlotName}: Node Offline. Awaiting sensor connection.`
    : `[KRISHI SETHU] ${cleanPlotName}: ${advisoryTitle}. Moist: ${currentMoisture}%, Temp: ${currentTemp ?? '--'}C. Action: ${actionItem.slice(0, 50)}`;

  // 9. OLED DISPLAY TELEMETRY STRINGS (for hardware node)
  const oledLines = !isMoistureValid
    ? [
        `PLT: ${cleanPlotName}`,
        `MST: --% [OFFLINE]`,
        `IRR: STANDBY`,
        `YLD: PENDING`
      ]
    : [
        `PLT: ${cleanPlotName}`,
        `MST: ${currentMoisture}% [${stageName.slice(0, 4)}]`,
        `IRR: ${autoPilot.shouldRunPump ? 'PUMP RUN' : 'STANDBY'}`,
        `YLD: ${yieldForecast.projectedPerAcre}q -${yieldForecast.totalPenaltyPct}%`
      ];

  return {
    timestamp: Date.now(),
    plot: {
      ...plot,
      cropName,
      acreage,
      sowingDate
    },
    lifecycle,
    adaptiveThresholds,
    yieldForecast,
    autoPilot,
    waterConservation: {
      estimatedLitersUsed,
      baselineFloodLiters,
      litersSaved,
      percentSaved,
      isWaterlogged: waterlogging.isWaterlogged
    },
    ipmLadder,
    advisory: {
      severity,
      title: advisoryTitle,
      body: advisoryBodyEn,
      actionItem
    },
    voiceScripts,
    smsAlert: {
      isCritical: severity === 'critical',
      text: smsText
    },
    oledLines
  };
};

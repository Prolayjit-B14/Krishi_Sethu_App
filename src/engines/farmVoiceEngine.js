/**
 * KrishiSethu — Gemini AI Agricultural Voice Intelligence Engine
 *
 * Replaces old hardcoded template summaries with dynamic context collection
 * and real-time Gemini agricultural reasoning.
 * Zero hardcoded agricultural sentences or generic reading of sensor numbers.
 */

import { AIContextService } from '../services/aiContextService';
import { generateGeminiAgriculturalReasoning } from '../api/aiService';

/**
 * Evaluates connection freshness from devices and live data.
 */
export const getSensorConnectivity = ({ sensorData, devices, isOffline }) => {
  const soilStatus = devices?.soil_node?.status;
  const weatherStatus = devices?.weather_node?.status;

  const hasSoil = sensorData?.soil?.moisture != null || sensorData?.soil?.temp != null;
  const hasWeather = sensorData?.weather?.temp != null;
  const hasNPK = sensorData?.soil?.npk?.n != null;

  if (isOffline || (soilStatus === 'OFFLINE' && weatherStatus === 'OFFLINE')) {
    return hasSoil ? 'stale' : 'offline';
  }

  if (!hasSoil && !hasWeather) {
    return 'none';
  }

  if (hasSoil && !hasNPK) {
    return 'partial';
  }

  if (soilStatus === 'ACTIVE' || weatherStatus === 'ACTIVE') {
    return 'live';
  }

  return (hasSoil || hasWeather) ? 'live' : 'none';
};

/**
 * Interprets sensor values against authoritative context.
 */
export const interpretSensorData = (options = {}) => {
  return AIContextService.collectCurrentTelemetry({ sensorData: options.sensorData || options });
};

/**
 * Generate Farm Voice Summary using real Gemini AI Context reasoning.
 */
export const generateFarmVoiceSummary = async (options = {}) => {
  const lang = options.language || options.lang || 'en';
  
  const context = AIContextService.assembleLiveAppContext({
    appContext: {
      farmInfo: { name: options.farmName, city: options.location },
      activePlot: { crop: options.crop, variety: options.variety, sowingDate: options.sowingDate },
      actuators: options.actuators || {}
    },
    telemetryContext: {
      sensorData: options.sensorData || {},
      sensorHistory: options.sensorHistory || [],
      devices: options.devices || {},
      mqttStatus: options.mqttStatus || 'connected',
      systemHealth: options.systemHealth || {},
      farmHealthScore: options.farmHealthScore || options.matchScore || 85
    },
    farmAdvisorBrain: options.brain
  });

  const reasoning = await generateGeminiAgriculturalReasoning({ context, targetLang: lang });
  return reasoning.speechSummary?.[lang] || reasoning.overallAssessment || '';
};

export default generateFarmVoiceSummary;

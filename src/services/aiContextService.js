/**
 * KrishiSethu — AI Context Service
 *
 * Implements the Holistic Context Collector & Context Builder for the
 * KrishiSethu Agricultural Reasoning Engine (Gemini Flash + Gemini Flash TTS).
 *
 * Gathers, normalizes, detects trends, and categorizes live application data into
 * AVAILABLE and UNAVAILABLE attributes so that Gemini Flash can reason about
 * interdependencies, missing telemetry, and real field conditions.
 */

// ─── UTILITY HELPERS ──────────────────────────────────────────────────────────
const isValid = (v) => v !== null && v !== undefined && v !== '' && !isNaN(Number(v));
const toNum = (v) => (isValid(v) ? Number(v) : null);

export class AIContextService {
  /**
   * 1. Collect Farm Profile
   */
  static collectFarm({ farmInfo = {}, currentGPS = {}, activePlot = {} } = {}) {
    const name = farmInfo?.name || activePlot?.farmName || 'KrishiSethu Smart Farm';
    const city = currentGPS?.city || farmInfo?.city || 'Krishnanagar, West Bengal';
    const rawLat = currentGPS?.lat != null ? Number(currentGPS.lat) : null;
    const rawLng = currentGPS?.lng != null ? Number(currentGPS.lng) : null;
    const lat = (rawLat !== null && !isNaN(rawLat)) ? rawLat : null;
    const lng = (rawLng !== null && !isNaN(rawLng)) ? rawLng : null;
    const soilType = activePlot?.soil || farmInfo?.soilType || 'Alluvial Loam';
    const acreage = activePlot?.acreage ? `${activePlot.acreage} Acres` : '2.0 Acres';
    const zone = activePlot?.irrigationZone || 'Zone 1';

    return {
      name,
      location: city,
      coordinates: (lat !== null && lng !== null) ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : null,
      soilType,
      acreage,
      zone,
      isLocationAvailable: Boolean(city && city !== 'Scanning for Field...')
    };
  }

  /**
   * 2. Collect Crop & Phenology Information
   */
  static collectCrop({ activePlot = {}, selectedCrop = null, lifecycle = null, cropSpecs = {} } = {}) {
    const rawCrop = activePlot?.crop || selectedCrop || 'rice';
    const cropName = typeof rawCrop === 'string' ? rawCrop.charAt(0).toUpperCase() + rawCrop.slice(1) : 'Paddy';
    const variety = activePlot?.variety || 'Swarna (MTU 7029)';
    const sowingDate = activePlot?.sowingDate || localStorage.getItem(`agrisense_sow_${rawCrop}`) || null;

    let das = null;
    if (sowingDate) {
      const sowMs = new Date(sowingDate).getTime();
      if (!isNaN(sowMs)) {
        das = Math.max(0, Math.floor((Date.now() - sowMs) / 86400000));
      }
    }

    const stageName = lifecycle?.activeStage?.name || (das ? (das < 25 ? 'Seedling' : (das < 65 ? 'Vegetative' : (das < 95 ? 'Reproductive' : 'Maturity'))) : 'Vegetative');
    const stageDesc = lifecycle?.activeStage?.description || 'Active vegetative shoot development and leaf expansion';
    const stageProgress = lifecycle?.progress ? `${Math.round(lifecycle.progress)}%` : null;

    return {
      crop: cropName,
      variety,
      sowingDate,
      daysAfterSowing: das,
      stage: stageName,
      stageDescription: stageDesc,
      stageProgress,
      isSowingDateConfigured: Boolean(sowingDate)
    };
  }

  /**
   * 3. Collect Current Live Telemetry
   */
  static collectCurrentTelemetry({ sensorData = {} } = {}) {
    const soil = sensorData?.soil || {};
    const weather = sensorData?.weather || {};

    const moisture = toNum(soil.moisture);
    const soilTemp = toNum(soil.temp);
    const ph = toNum(soil.ph);
    
    // NPK
    const n = toNum(soil.npk?.n);
    const p = toNum(soil.npk?.p);
    const k = toNum(soil.npk?.k);
    const hasNpk = n !== null || p !== null || k !== null;

    // Weather
    const airTemp = toNum(weather.temp);
    const humidity = toNum(weather.humidity);
    const light = toNum(weather.ldr ?? weather.light);
    const rainLevel = toNum(weather.rainLevel);

    return {
      moisture,
      soilTemp,
      ph,
      npk: hasNpk ? { n, p, k } : null,
      airTemp,
      humidity,
      light,
      rainLevel,
      rainStatus: (rainLevel !== null && rainLevel > 0) ? `Rain detected (${rainLevel} mm)` : 'No rain detected',
      isMoistureOnline: moisture !== null,
      isWeatherOnline: airTemp !== null || humidity !== null,
      isNpkOnline: hasNpk
    };
  }

  /**
   * 4. Collect Recent Telemetry Trends (e.g. last 30 minutes, 1 hour)
   */
  static collectRecentTelemetry({ sensorHistory = [], currentTelemetry = {}, windowMinutes = 30 } = {}) {
    if (!Array.isArray(sensorHistory) || sensorHistory.length === 0) {
      return {
        hasHistory: false,
        moistureTrend: { direction: 'stable', trajectory: [], description: 'History building, single snapshot' },
        tempTrend: { direction: 'stable', trajectory: [], description: 'History building, single snapshot' },
        historyDurationMinutes: 0
      };
    }

    const cutoff = Date.now() - (windowMinutes * 60 * 1000);
    const recent = sensorHistory
      .filter(item => (item.timestamp || 0) >= cutoff)
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Fall back to last 10 snapshots if timestamp window has few items
    const samples = recent.length >= 3 ? recent : sensorHistory.slice(-10);

    // Moisture trajectory
    const moisturePoints = samples
      .map(s => toNum(s.soil?.moisture))
      .filter(v => v !== null);

    // If current telemetry is available, append it
    if (currentTelemetry.moisture !== null) {
      moisturePoints.push(currentTelemetry.moisture);
    }

    const analyzeTrend = (points, unit = '%') => {
      if (points.length < 2) return { direction: 'stable', trajectory: points, description: 'Steady' };

      // Pick up to 5 evenly spaced samples to display trajectory like 612 → 574 → 521 → 438
      const step = Math.max(1, Math.floor(points.length / 4));
      const sampled = [];
      for (let i = 0; i < points.length; i += step) {
        sampled.push(points[i]);
      }
      if (sampled[sampled.length - 1] !== points[points.length - 1]) {
        sampled.push(points[points.length - 1]);
      }

      const first = points[0];
      const last = points[points.length - 1];
      const delta = last - first;
      const absDelta = Math.abs(delta);

      let direction = 'stable';
      if (delta <= -3) direction = 'falling';
      else if (delta >= 3) direction = 'rising';

      const arrowTrajectory = sampled.map(p => `${Math.round(p)}${unit}`).join(' → ');

      let description = 'Stable';
      if (direction === 'falling') {
        description = `Falling by ${Math.round(absDelta)}${unit} over the recent window (${arrowTrajectory})`;
      } else if (direction === 'rising') {
        description = `Rising by ${Math.round(absDelta)}${unit} over the recent window (${arrowTrajectory})`;
      } else {
        description = `Steady around ${Math.round(last)}${unit}`;
      }

      return {
        direction,
        first,
        last,
        delta,
        trajectory: sampled,
        arrowFormat: arrowTrajectory,
        description
      };
    };

    const moistureAnalysis = analyzeTrend(moisturePoints, '%');

    // Temperature trajectory
    const tempPoints = samples
      .map(s => toNum(s.weather?.temp))
      .filter(v => v !== null);
    if (currentTelemetry.airTemp !== null) tempPoints.push(currentTelemetry.airTemp);

    const tempAnalysis = analyzeTrend(tempPoints, '°C');

    return {
      hasHistory: samples.length >= 2,
      moistureTrend: moistureAnalysis,
      tempTrend: tempAnalysis,
      sampleCount: samples.length,
      historyDurationMinutes: windowMinutes
    };
  }

  /**
   * 5. Collect User-Configured & Optimal Agronomic Thresholds
   */
  static collectThresholds({ activePlot = {}, lifecycle = {}, customThresholds = {} } = {}) {
    // Defaults tailored for Indian precision farming
    const defaultMoistureMin = 40;
    const defaultMoistureMax = 70;
    const defaultPhMin = 6.0;
    const defaultPhMax = 7.5;
    const defaultTempMin = 22;
    const defaultTempMax = 34;

    const moistureMin = customThresholds.moistureMin ?? activePlot?.moistureMin ?? defaultMoistureMin;
    const moistureMax = customThresholds.moistureMax ?? activePlot?.moistureMax ?? defaultMoistureMax;
    const phMin = customThresholds.phMin ?? activePlot?.phMin ?? defaultPhMin;
    const phMax = customThresholds.phMax ?? activePlot?.phMax ?? defaultPhMax;
    const tempMin = customThresholds.tempMin ?? activePlot?.tempMin ?? defaultTempMin;
    const tempMax = customThresholds.tempMax ?? activePlot?.tempMax ?? defaultTempMax;

    return {
      moistureRange: { min: moistureMin, max: moistureMax, unit: '%' },
      phRange: { min: phMin, max: phMax },
      tempRange: { min: tempMin, max: tempMax, unit: '°C' },
      summary: `Moisture ${moistureMin}–${moistureMax}%, pH ${phMin}–${phMax}, Temp ${tempMin}–${tempMax}°C`
    };
  }

  /**
   * 6. Collect Actuator States
   */
  static collectActuatorStates({ actuators = {} } = {}) {
    const isPumpOn = Boolean(actuators.PUMP || actuators.pump || actuators.water_pump);
    const isValveOn = Boolean(actuators.VALVE || actuators.valve || actuators.main_valve);
    const isSprayerOn = Boolean(actuators.SPRAYER || actuators.sprayer || actuators.pest_sprinkler);
    const isFanOn = Boolean(actuators.FAN || actuators.fan);
    const isLightOn = Boolean(actuators.LIGHT || actuators.light);

    return {
      pump: isPumpOn ? 'ON' : 'OFF',
      valve: isValveOn ? 'ON' : 'OFF',
      sprayer: isSprayerOn ? 'ON' : 'OFF',
      fan: isFanOn ? 'ON' : 'OFF',
      light: isLightOn ? 'ON' : 'OFF',
      activeActuatorsList: [
        isPumpOn && 'Irrigation Pump',
        isValveOn && 'Main Solenoid Valve',
        isSprayerOn && 'Sprinkler/Sprayer',
        isFanOn && 'Ventilation Fan',
        isLightOn && 'Grow Light'
      ].filter(Boolean)
    };
  }

  /**
   * 7. Collect Active Alerts & System Health
   */
  static collectAlerts({ systemHealth = {}, farmHealthScore = 0, currentTelemetry = {}, thresholds = {} } = {}) {
    const alerts = [];
    const minMois = thresholds?.moistureRange?.min ?? 40;
    const maxMois = thresholds?.moistureRange?.max ?? 70;
    const maxTemp = thresholds?.tempRange?.max ?? 34;

    // Check moisture against thresholds
    if (currentTelemetry?.moisture !== null && currentTelemetry?.moisture !== undefined) {
      if (currentTelemetry.moisture < minMois) {
        alerts.push({
          level: 'CRITICAL',
          type: 'LOW_MOISTURE',
          message: `Soil moisture (${Math.round(currentTelemetry.moisture)}%) is below configured minimum (${minMois}%)`
        });
      } else if (currentTelemetry.moisture > maxMois) {
        alerts.push({
          level: 'WARNING',
          type: 'HIGH_MOISTURE',
          message: `Soil saturation (${Math.round(currentTelemetry.moisture)}%) exceeds optimal limit (${maxMois}%)`
        });
      }
    }

    // Check temperature against thresholds
    if (currentTelemetry?.airTemp !== null && currentTelemetry?.airTemp !== undefined) {
      if (currentTelemetry.airTemp > maxTemp) {
        alerts.push({
          level: 'WARNING',
          type: 'HIGH_TEMPERATURE',
          message: `Ambient temperature (${Math.round(currentTelemetry.airTemp)}°C) exceeds upper threshold (${maxTemp}°C)`
        });
      }
    }

    return {
      activeAlerts: alerts,
      alertCount: alerts.length,
      healthScore: Math.round(farmHealthScore) || 82,
      overallStatus: alerts.some(a => a.level === 'CRITICAL') ? 'NEEDS_ATTENTION' : 'STABLE'
    };
  }

  /**
   * 8. Collect Device Status
   */
  static collectDeviceStatus({ devices = {}, mqttStatus = 'disconnected' } = {}) {
    const soilNode = devices.soil_node || {};
    const weatherNode = devices.weather_node || {};
    const visionNode = devices.vision_node || {};

    const isSoilOnline = soilNode.status === 'ACTIVE';
    const isWeatherOnline = weatherNode.status === 'ACTIVE';
    const isVisionOnline = visionNode.status === 'ACTIVE';

    return {
      soilNode: { status: isSoilOnline ? 'ONLINE' : 'OFFLINE', lastSeen: soilNode.lastUpdate || null },
      weatherNode: { status: isWeatherOnline ? 'ONLINE' : 'OFFLINE', lastSeen: weatherNode.lastUpdate || null },
      visionNode: { status: isVisionOnline ? 'ONLINE' : 'OFFLINE', lastSeen: visionNode.lastUpdate || null },
      mqttConnection: mqttStatus,
      summary: `Soil: ${isSoilOnline ? 'Online' : 'Offline'}, Weather: ${isWeatherOnline ? 'Online' : 'Offline'}, Vision: ${isVisionOnline ? 'Online' : 'Offline'}`
    };
  }

  /**
   * 9. Explicitly Detect Available vs Unavailable Information
   */
  static detectMissingData({ farm, crop, telemetry, devices } = {}) {
    const available = [];
    const unavailable = [];

    // Farm details
    if (farm.isLocationAvailable) available.push(`Farm Location (${farm.location})`);
    else unavailable.push('GPS Location (not resolved)');

    if (farm.soilType) available.push(`Soil Type (${farm.soilType})`);
    else unavailable.push('Soil Type profile');

    // Crop details
    available.push(`Selected Crop (${crop.crop})`);
    available.push(`Growth Stage (${crop.stage})`);

    if (crop.isSowingDateConfigured) {
      available.push(`Sowing Date (${crop.daysAfterSowing} days after sowing)`);
    } else {
      unavailable.push('Sowing date (not configured in plot settings)');
    }

    // Telemetry & Sensors
    if (telemetry.moisture !== null) available.push(`Soil Moisture (${Math.round(telemetry.moisture)}%)`);
    else unavailable.push('Soil moisture sensor (offline or disconnected)');

    if (telemetry.soilTemp !== null) available.push(`Soil Temperature (${Math.round(telemetry.soilTemp)}°C)`);
    else unavailable.push('Soil temperature probe (unavailable)');

    if (telemetry.ph !== null) available.push(`Soil pH (${telemetry.ph})`);
    else unavailable.push('Soil pH sensor (unavailable)');

    if (telemetry.npk !== null) available.push(`NPK Nutrients (N:${telemetry.npk.n}, P:${telemetry.npk.p}, K:${telemetry.npk.k})`);
    else unavailable.push('NPK Nutrient sensors (offline/unavailable)');

    if (telemetry.airTemp !== null) available.push(`Air Temperature (${Math.round(telemetry.airTemp)}°C)`);
    else unavailable.push('Air temperature sensor');

    if (telemetry.humidity !== null) available.push(`Air Humidity (${Math.round(telemetry.humidity)}%)`);
    else unavailable.push('Humidity sensor');

    if (telemetry.light !== null) available.push(`Sunlight / Light level (${Math.round(telemetry.light)}%)`);
    else unavailable.push('Light sensor / LDR');

    if (telemetry.rainLevel !== null) available.push(`Rain gauge (${telemetry.rainLevel} mm)`);
    else unavailable.push('Rainfall sensor / tipping bucket');

    return {
      available,
      unavailable,
      hasCriticalData: telemetry.moisture !== null || telemetry.airTemp !== null
    };
  }

  /**
   * 10. Assemble Complete KrishiSethu Live Application Context
   */
  static assembleLiveAppContext({
    appContext = {},
    telemetryContext = {},
    farmAdvisorBrain = null,
    customThresholds = {}
  } = {}) {
    const { farmInfo, currentGPS, activePlot, actuators } = appContext;
    const { sensorData, sensorHistory, devices, mqttStatus, systemHealth, farmHealthScore } = telemetryContext;

    const farm = this.collectFarm({ farmInfo, currentGPS, activePlot });
    const crop = this.collectCrop({
      activePlot,
      selectedCrop: farmAdvisorBrain?.crop,
      lifecycle: farmAdvisorBrain?.lifecycle
    });
    const telemetry = this.collectCurrentTelemetry({ sensorData });
    const trends = this.collectRecentTelemetry({
      sensorHistory,
      currentTelemetry: telemetry,
      windowMinutes: 30
    });
    const thresholds = this.collectThresholds({
      activePlot,
      lifecycle: farmAdvisorBrain?.lifecycle,
      customThresholds
    });
    const actuatorStates = this.collectActuatorStates({ actuators });
    const alerts = this.collectAlerts({
      systemHealth,
      farmHealthScore,
      currentTelemetry: telemetry,
      thresholds
    });
    const deviceStatus = this.collectDeviceStatus({ devices, mqttStatus });
    const missingData = this.detectMissingData({ farm, crop, telemetry, devices });

    return {
      timestamp: new Date().toISOString(),
      localTimeFormatted: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      farm,
      crop,
      telemetry,
      trends,
      thresholds,
      actuators: actuatorStates,
      alerts,
      devices: deviceStatus,
      missingData
    };
  }

  /**
   * 11. Build Dynamic Plain Text Prompt Representation for Gemini Flash
   */
  static buildPromptContext(ctx) {
    const { farm, crop, telemetry, trends, thresholds, actuators, alerts, devices, missingData, localTimeFormatted } = ctx;

    return `KRISHISETHU LIVE APPLICATION CONTEXT
=====================================
TIME: ${localTimeFormatted}

FARM
Location: ${farm.location}
Plot: ${farm.name} (${farm.acreage})
Soil: ${farm.soilType}
Zone: ${farm.zone}

CROP & PHENOLOGY
Crop: ${crop.crop}
Variety: ${crop.variety}
Growth Stage: ${crop.stage} (${crop.stageDescription})
Sowing: ${crop.isSowingDateConfigured ? `${crop.daysAfterSowing} days after sowing (${crop.sowingDate})` : 'Not configured'}

USER CONFIGURED RANGES
Soil Moisture: ${thresholds.moistureRange.min}–${thresholds.moistureRange.max}%
Soil pH: ${thresholds.phRange.min}–${thresholds.phRange.max}
Ambient Temperature: ${thresholds.tempRange.min}–${thresholds.tempRange.max}°C

CURRENT TELEMETRY
Soil Moisture: ${telemetry.moisture !== null ? `${Math.round(telemetry.moisture)}%` : 'UNAVAILABLE'}
Soil Temperature: ${telemetry.soilTemp !== null ? `${telemetry.soilTemp}°C` : 'UNAVAILABLE'}
Soil pH: ${telemetry.ph !== null ? telemetry.ph : 'UNAVAILABLE'}
NPK: ${telemetry.npk ? `N=${telemetry.npk.n}, P=${telemetry.npk.p}, K=${telemetry.npk.k}` : 'UNAVAILABLE'}
Air Temperature: ${telemetry.airTemp !== null ? `${Math.round(telemetry.airTemp)}°C` : 'UNAVAILABLE'}
Air Humidity: ${telemetry.humidity !== null ? `${Math.round(telemetry.humidity)}%` : 'UNAVAILABLE'}
Light: ${telemetry.light !== null ? `${Math.round(telemetry.light)}%` : 'UNAVAILABLE'}
Rain: ${telemetry.rainStatus}

RECENT TREND (LAST 30 MINUTES)
Soil Moisture: ${trends.moistureTrend.description}
Air Temperature: ${trends.tempTrend.description}

ACTUATORS
Water Pump: ${actuators.pump}
Main Solenoid Valve: ${actuators.valve}
Sprinkler / Sprayer: ${actuators.sprayer}
Ventilation Fan: ${actuators.fan}
Grow Light: ${actuators.light}

ACTIVE ALERTS
${alerts.activeAlerts.length > 0 ? alerts.activeAlerts.map(a => `- [${a.level}] ${a.message}`).join('\n') : '- None (All parameters in nominal bounds)'}
Farm Health Score: ${alerts.healthScore}/100 (${alerts.overallStatus})

DEVICES & CONNECTIVITY
Soil Node: ${devices.soilNode.status}
Weather Node: ${devices.weatherNode.status}
Vision Node: ${devices.visionNode.status}
MQTT Status: ${devices.mqttConnection}

EXPLICIT TELEMETRY STATUS
AVAILABLE:
${missingData.available.map(item => `- ${item}`).join('\n')}

UNAVAILABLE:
${missingData.unavailable.map(item => `- ${item}`).join('\n')}

TASK
Analyze the actual field condition using the complete available context.
Identify what is happening, what requires attention, and what action may be appropriate.
Clearly mention important limitations caused by unavailable data.`;
  }
}

export default AIContextService;

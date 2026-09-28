/**
 * AgriSense AI Service
 * Handles communication with Gemini APIs.
 */

import { MASTER_CONFIG } from '../setup';

// 🔐 INDUSTRIAL KEY & SECURE PROXY INJECTION
const GEMINI_API_KEY = MASTER_CONFIG.GEMINI_API_KEY;
const AI_PROXY_URL = MASTER_CONFIG.AI_PROXY_URL;

// 💡 Diagnostic: Log AI status on load (Sanitized)
if (AI_PROXY_URL && AI_PROXY_URL.length > 5) {
  console.log(`🛰️ AgriBot: Secure Backend AI Proxy Active (${AI_PROXY_URL})`);
} else if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
  console.log(`🛰️ AgriBot: Cloud AI Engine Active (Handshake Ready)`);
} else {
  console.warn("🛰️ AgriBot: Cloud AI Engine Offline (Neither Proxy nor Key configured).");
}

/**
 * Local Agronomy Logic Engine (Fallback when API keys are missing or failing)
 */
const localAgriLogic = (prompt, context) => {
  const query = prompt.toLowerCase();
  const { currentSensors, weather, systemHealth, aiRecommendations, knowledgeBase } = context;
  
  // 1. Status Check
  if (query.includes('status') || query.includes('summary') || query.includes('how is my farm')) {
    const health = systemHealth?.overall_status || 'Unknown';
    const temp = currentSensors?.weather?.temp || '---';
    const moisture = currentSensors?.soil?.moisture || '---';
    const advice = typeof aiRecommendations?.[0] === 'object' ? (aiRecommendations[0].text || aiRecommendations[0].content) : aiRecommendations?.[0];
    
    return `### 🚜 FARM STATUS REPORT
- **Overall Health**: ${health}
- **Temperature**: ${temp}°C
- **Soil Moisture**: ${moisture}%
- **System**: ${systemHealth?.active_nodes || 0}/${systemHealth?.total_nodes || 0} nodes online.
- **Advice**: ${advice || "Everything looks stable."}`;
  }

  // 2. Irrigation Logic
  if (query.includes('irrigate') || query.includes('water') || query.includes('moisture')) {
    const moisture = parseFloat(currentSensors?.soil?.moisture);
    if (isNaN(moisture)) return "### 🔌 CONNECTION ISSUE\nI can't see your soil moisture right now. Please check if your soil node is online!";
    if (moisture < 30) return `### 🚨 CRITICAL ALERT\nSoil moisture is very low (**${moisture}%**). You should irrigate immediately! 💧`;
    if (moisture < 50) return `### ⚠️ WARNING\nSoil moisture is dipping (**${moisture}%**). Consider a light irrigation cycle soon.`;
    return `### ✅ OPTIMAL\nSoil moisture is healthy (**${moisture}%**). No irrigation needed at the moment.`;
  }

  // 3. Pest Warning
  if (query.includes('pest') || query.includes('bug') || query.includes('disease')) {
    const temp = parseFloat(currentSensors?.weather?.temp);
    const hum = parseFloat(currentSensors?.weather?.humidity);
    const pestAdvice = knowledgeBase?.pestDatabase?.find(p => {
      const cropName = p.split(':')[0].toLowerCase().split('(')[0].trim();
      return query.includes(cropName);
    });
    
    if (pestAdvice) return `### 🐛 PEST ADVICE\n${pestAdvice}\n\n*Current weather: ${temp}°C, ${hum}% humidity.*`;
    if (temp > 28 && hum > 70) return "### ⚠️ PEST ALERT\nHigh heat and humidity detected. This is a prime condition for fungal outbreaks. Keep an eye on leaf health! 🐛";
    return "### 🛡️ PROTECTED\nCurrent weather conditions are not showing high pest outbreak triggers. Continue regular monitoring.";
  }

  // 4. Fertilizer & Compost
  if (query.includes('fertilizer') || query.includes('npk') || query.includes('compost') || query.includes('dosage')) {
    const npk = currentSensors?.soil?.npk || {};
    const fertAdvice = knowledgeBase?.fertilizerDatabase?.find(f => {
      const cropName = f.split(':')[0].toLowerCase().split('(')[0].trim();
      return query.includes(cropName);
    });
    const compAdvice = knowledgeBase?.compostDatabase?.find(c => {
      const cropName = c.split(':')[0].toLowerCase().split('(')[0].trim();
      return query.includes(cropName);
    });

    let response = `### 🧪 SOIL NUTRIENTS\n- **N**: ${npk.n || '--'}\n- **P**: ${npk.p || '--'}\n- **K**: ${npk.k || '--'}`;
    if (fertAdvice) response += `\n\n### 💊 FERTILIZER\n${fertAdvice}`;
    if (compAdvice) response += `\n\n### 🌱 COMPOST\n${compAdvice}`;
    return response;
  }

  // 5. Suitability & Region
  if (query.includes('suit') || query.includes('grow') || query.includes('season') || query.includes('place')) {
    const suitability = knowledgeBase?.suitabilityHighlights?.slice(0, 5).join('\n- ');
    return `🌍 REGIONAL SUITABILITY:\n- ${suitability || 'Local climate synchronized'}\n\nAdvice: Consult local agronomic recommendations for micro-climate matching.`;
  }

  // 6. General Knowledge Fallback
  return "I'm currently analyzing your data using my Local Diagnostic Engine. I can help with 'status', 'irrigation', 'pests', 'NPK', or 'suitability'! To enable the full Cloud AI Brain, ensure your Gemini API key is active. 🌿";
};

/**
 * Sends a message to Gemini AI with context data.
 */
export const askGemini = async (prompt, context) => {
  if (!GEMINI_API_KEY) {
    console.warn("AgriBot: No valid API key found. Falling back to local diagnostic engine.");
    return localAgriLogic(prompt, context);
  }

  const models = [
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
  ];

  const slimContext = {
    sensors: context.currentSensors,
    weather: context.weather,
    health: context.health,
    logs: context.recentLogs,
    time: context.time
  };

  const fullPrompt = `
You are AgriSense AI, an elite agronomy assistant. 
Data Context:
- Farm: ${context.farmName}
- Sensors: ${JSON.stringify(slimContext.sensors)}
- Weather: ${JSON.stringify(slimContext.weather)}
- System: ${JSON.stringify(slimContext.health)}
- History: ${JSON.stringify(slimContext.logs)}

Instructions:
1. Provide a professional, concise response.
2. Use markdown for structure (h3 for sections).
3. Be action-oriented. If sensors are bad, suggest fixes.
4. If asked about status, summarize all sensors.

User: ${prompt}
`;

  const model = "gemini-flash-latest";
  const apiVersion = "v1beta";
  const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY 
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    if (response.ok) {
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } else {
      console.warn(`🛰️ AgriBot Error [${response.status}]:`, data.error?.message || response.statusText);
      throw new Error(data.error?.message || "Cloud AI Offline");
    }
  } catch (e) {
    console.error("🛰️ AgriBot Network Exception:", e.message);
  }

  console.error("🛰️ AgriBot: Cloud AI failed. Using Local Diagnostic Engine.");
  return localAgriLogic(prompt, context);
};

/**
 * Real-time Agricultural Intelligence Advisory Generator
 * Queries Google Gemini using live field telemetry and phenological growth stage.
 * If API is unavailable or offline, strictly computes dynamic real-time rule advisory (no static generic text).
 */
export const generateRealtimeCropAdvisory = async ({
  crop = 'Paddy (Rice)',
  stage = 'Vegetative',
  soil = {},
  weather = {},
  lang = 'bn'
}) => {
  const moisture = soil?.moisture !== null && soil?.moisture !== undefined && !isNaN(soil?.moisture)
    ? Number(soil.moisture)
    : null;
  const temp = weather?.temp !== null && weather?.temp !== undefined && !isNaN(weather?.temp)
    ? Number(weather.temp)
    : null;
  const humidity = weather?.humidity !== null && weather?.humidity !== undefined && !isNaN(weather?.humidity)
    ? Number(weather.humidity)
    : null;

  // 1. Strictly OFFLINE if sensors not connected
  if (moisture === null) {
    return {
      source: 'telemetry_offline',
      title: 'Sensors Offline',
      body: 'Soil moisture telemetry is currently disconnected. Live AI advisory will generate once sensor node telemetry is received.',
      action: 'Verify ESP32 node power supply and LoRa/Wi-Fi connection.',
      voiceScripts: {
        en: 'Soil moisture telemetry is currently disconnected. Live AI advisory will generate once sensor node telemetry is received.',
        bn: 'মাটির আর্দ্রতা সেন্সর অফলাইনে রয়েছে। নোড থেকে রিয়েল-টাইম টেলিমেট্রি পাওয়ার পর স্বয়ংক্রিয় এআই পর্যবেক্ষণ সক্রিয় হবে।',
        hi: 'मिट्टी की नमी का सेंसर अभी ऑफ़लाइन है। नोड से लाइव टेलीमेट्री प्राप्त होने पर सक्रिय एआई परामर्श उपलब्ध होगा।'
      }
    };
  }

  // 2. Multilingual Speech Scripts & Fallbacks
  const isDry = moisture < 35;
  const isFlooded = moisture > 80;

  const fallbackBodyEn = isDry
    ? `Soil moisture has dropped to ${Math.round(moisture)}% during ${stage}. Scheduled irrigation is recommended to prevent vegetative stress.${temp ? ` Ambient temp is ${Math.round(temp)}°C.` : ''}`
    : (isFlooded
    ? `Excessive saturation (${Math.round(moisture)}%) detected during ${stage}. Facilitate drainage to prevent root hypoxia.`
    : `Soil moisture (${Math.round(moisture)}%) is balanced for ${stage}. Transpiration is stable; no irrigation needed today.`);

  const actionEn = isDry 
    ? 'Activate irrigation pump during evening' 
    : (isFlooded ? 'Inspect perimeter drainage channels' : 'Maintain routine telemetry monitoring');

  const voiceBn = isDry
    ? `মাটিতে বর্তমান আর্দ্রতা ${Math.round(moisture)}% এ নেমে এসেছে, যা ${stage} পর্যায়ের জন্য অপ্রতুল। শিকড়ের পুষ্টি গ্রহণ স্বাভাবিক রাখতে নিয়ন্ত্রিত সেচ প্রয়োজন।`
    : (isFlooded
    ? `মাটির স্যাচুরেশন ${Math.round(moisture)}% এ পৌঁছেছে। শিকড় পচন এড়াতে দ্রুত নিষ্কাশন নিশ্চিত করুন।`
    : `মাটির আর্দ্রতা ${Math.round(moisture)}% এ ${stage} পর্যায়ের জন্য সম্পূর্ণ অনুকূল। স্বাভাবিক বৃদ্ধি অব্যাহত রয়েছে, আজ অতিরিক্ত সেচের প্রয়োজন নেই।`);

  const voiceHi = isDry
    ? `मिट्टी की नमी घटकर ${Math.round(moisture)}% रह गई है, जो ${stage} अवस्था के लिए कम है। कृपया तुरंत हल्की सिंचाई की व्यवस्था करें।`
    : (isFlooded
    ? `खेत में नमी ${Math.round(moisture)}% के खतरनाक स्तर पर है। जड़ गलन से बचाव हेतु जलनिकासी करें।`
    : `मिट्टी की नमी ${Math.round(moisture)}% पर ${stage} अवस्था के लिए पूर्णतः संतुलित है। आज अतिरिक्त सिंचाई की आवश्यकता नहीं है।`);

  // 3. Real-Time Gemini AI Generation (Generates English on-screen summary)
  const prompt = `You are KrishiSethu AI, an expert precision agronomy advisory system.
Live Field Telemetry:
- Crop: ${crop}
- Current Phenological Growth Stage: ${stage}
- Soil Moisture: ${moisture}%
- Soil N-P-K: N=${soil.npk?.n || '--'}, P=${soil.npk?.p || '--'}, K=${soil.npk?.k || '--'}
- Ambient Temperature: ${temp !== null ? `${temp}°C` : 'N/A'}
- Relative Humidity: ${humidity !== null ? `${humidity}%` : 'N/A'}
- Rainfall: ${weather?.rainLevel || 0}mm

Task:
Generate a personalized, real-time farm advisory in English.
Requirements:
1. Ground your advice strictly in the provided real-time moisture (${moisture}%) and stage (${stage}).
2. Provide exactly 1-2 direct sentences: State the current crop condition and exact irrigation or nutrient action needed today.
3. No introductory greetings or markdown headings. Output only pure clear sentences.`;

  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 250
          }
        }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (aiText && aiText.length > 10) {
          return {
            source: 'gemini_cloud_ai',
            title: 'AI Field Advisory',
            body: aiText,
            action: actionEn,
            voiceScripts: {
              en: aiText,
              bn: voiceBn,
              hi: voiceHi
            }
          };
        }
      }
    } catch (e) {
      console.warn("Gemini dynamic advisory call timed out or failed:", e.message);
    }
  }

  // 4. Deterministic Real-time Agronomic Fallback (Strictly English body and action)
  return {
    source: 'local_realtime_engine',
    title: isFlooded ? 'Waterlogging Alert' : (isDry ? 'Moisture Deficit Warning' : 'Optimal Microclimate'),
    body: fallbackBodyEn,
    action: actionEn,
    voiceScripts: {
      en: fallbackBodyEn,
      bn: voiceBn,
      hi: voiceHi
    }
  };
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * KRISHISETHU HOLISTIC AI AGRICULTURAL REASONING ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Permanent Behavior Policy:
 * 1. Reason over the complete live application context (farm, crop, stage, telemetry,
 *    trends, thresholds, actuator states, alerts, device status).
 * 2. Never treat a sensor reading in isolation.
 * 3. Explicitly recognize UNAVAILABLE data and articulate limitations without guessing.
 * 4. Generate natural, conversational Indian English, West Bengal Bangla, and Hindi.
 * 5. Return urgency and emotional tone for speech delivery.
 */

/**
 * Local Agronomic Reasoning Engine (Used when Cloud AI is offline or key is missing)
 * Strictly evaluates actual relationships, trends, all physical parameters, and missing data gaps dynamically.
 */
export const localAgronomicReasoning = (context) => {
  const { farm = {}, crop = {}, telemetry = {}, trends = {}, thresholds = {}, actuators = {}, alerts = {}, missingData = {} } = context;

  const cropName = crop.crop || 'Crop';
  const stage = crop.stage || 'Vegetative';
  const das = crop.daysAfterSowing ? `${crop.daysAfterSowing} days after sowing` : '';
  
  // Soil parameters
  const moisture = telemetry.moisture !== null && !isNaN(telemetry.moisture) ? Number(telemetry.moisture) : null;
  const soilTemp = telemetry.soilTemp !== null && !isNaN(telemetry.soilTemp) ? Number(telemetry.soilTemp) : null;
  const ph = telemetry.ph !== null && !isNaN(telemetry.ph) ? Number(telemetry.ph) : null;
  const npk = telemetry.npk;
  
  // Weather parameters
  const airTemp = telemetry.airTemp !== null && !isNaN(telemetry.airTemp) ? Number(telemetry.airTemp) : null;
  const humidity = telemetry.humidity !== null && !isNaN(telemetry.humidity) ? Number(telemetry.humidity) : null;
  const light = telemetry.light !== null && !isNaN(telemetry.light) ? Number(telemetry.light) : null;
  const rainLevel = telemetry.rainLevel !== null && !isNaN(telemetry.rainLevel) ? Number(telemetry.rainLevel) : null;

  // Actuator parameters
  const pumpState = (actuators.pump || actuators.waterPump || 'OFF').toUpperCase();
  const valveState = (actuators.valve || actuators.irrigationValve || 'CLOSED').toUpperCase();

  // Thresholds
  const minMois = thresholds?.moistureRange?.min ?? 40;
  const maxMois = thresholds?.moistureRange?.max ?? 70;
  const maxTemp = thresholds?.tempRange?.max ?? 34;

  const isMoistDeficit = moisture !== null && moisture < minMois;
  const isMoistExcess = moisture !== null && moisture > maxMois;
  const isTempHigh = airTemp !== null && airTemp > maxTemp;
  const isFalling = trends?.moistureTrend?.direction === 'falling';

  // Evaluate Urgency & Tone
  let urgency = 'normal';
  let tone = 'calm';
  if (moisture !== null && (moisture < minMois - 8 || moisture > maxMois + 15)) {
    urgency = 'critical';
    tone = 'urgent';
  } else if (isMoistDeficit || isMoistExcess || isTempHigh) {
    urgency = 'attention';
    tone = 'concerned';
  } else if (moisture !== null && moisture >= minMois + 5 && moisture <= maxMois - 5) {
    urgency = 'positive';
    tone = 'warm';
  }

  // ─── 1. ENGLISH DETAILED BRIEFING ───
  let enParts = [];
  enParts.push(`Field briefing for ${cropName} in the ${stage} stage${das ? ` (${das})` : ''}.`);
  
  // Soil Section
  if (moisture !== null) {
    const moistStatus = isMoistDeficit 
      ? `below the minimum target of ${minMois}%${isFalling ? ' and continuing to decrease' : ''}` 
      : isMoistExcess 
      ? `above the optimal threshold of ${maxMois}%` 
      : `balanced within the optimal target range of ${minMois}% to ${maxMois}%`;
    enParts.push(`Soil moisture is currently at ${Math.round(moisture)}%, which is ${moistStatus}.`);
  } else {
    enParts.push(`Soil moisture telemetry is currently disconnected.`);
  }

  if (soilTemp !== null) {
    enParts.push(`Soil temperature is measured at ${Math.round(soilTemp)}°C.`);
  }

  if (ph !== null) {
    const phLabel = ph < 6.0 ? 'slightly acidic' : ph > 7.5 ? 'alkaline' : 'neutral and optimal for nutrient uptake';
    enParts.push(`Soil pH stands at ${ph.toFixed(1)}, reflecting ${phLabel} soil chemistry.`);
  }

  if (npk && (npk.n !== null || npk.p !== null || npk.k !== null)) {
    enParts.push(`Soil fertility readings show Nitrogen at ${Math.round(npk.n || 0)} kg/ha, Phosphorus at ${Math.round(npk.p || 0)} kg/ha, and Potassium at ${Math.round(npk.k || 0)} kg/ha.`);
  } else {
    enParts.push(`NPK macronutrient telemetry is currently unmonitored.`);
  }

  // Weather Section
  let weatherSegments = [];
  if (airTemp !== null) weatherSegments.push(`ambient temperature is ${Math.round(airTemp)}°C`);
  if (humidity !== null) weatherSegments.push(`relative humidity is ${Math.round(humidity)}%`);
  if (light !== null) weatherSegments.push(`solar radiation is ${Math.round(light)} lux`);
  if (rainLevel !== null && rainLevel > 0) weatherSegments.push(`rainfall measured at ${rainLevel} mm`);
  else if (weatherSegments.length > 0) weatherSegments.push(`with no precipitation recorded`);
  
  if (weatherSegments.length > 0) {
    enParts.push(`Microclimate conditions indicate ${weatherSegments.join(', ')}.`);
  }

  // Irrigation & Actuators Section
  if (isMoistDeficit) {
    const minutes = Math.max(25, Math.min(60, Math.round((minMois - (moisture || 30)) * 2.5)));
    if (pumpState === 'ON') {
      enParts.push(`The irrigation pump is actively RUNNING with the main valve ${valveState}, which is actively rehydrating the root zone.`);
    } else {
      enParts.push(`Irrigation pump is currently OFF and valve is ${valveState}. Recommend activating irrigation for approximately ${minutes} minutes (applying around 15 mm of water) during early morning or sunset to prevent moisture stress.`);
    }
  } else if (isMoistExcess) {
    enParts.push(`The water pump is OFF and valve is ${valveState}. Due to elevated moisture, avoid irrigation and ensure field drainage channels are clear to prevent waterlogging.`);
  } else {
    enParts.push(`Water pump is OFF with valve ${valveState}. Soil moisture is sufficient; no irrigation is required at this time.`);
  }

  // ─── 2. BENGALI DETAILED BRIEFING ───
  let bnParts = [];
  bnParts.push(`${cropName} ফসলের বিস্তারিত রিপোর্ট: বর্তমানে ফসল ${stage} পর্যায়ে রয়েছে${das ? ` (${das})` : ''}।`);

  // Soil Section (BN)
  if (moisture !== null) {
    const bnMoistStatus = isMoistDeficit 
      ? `যা নির্ধারিত সর্বনিম্ন ${minMois}% সীমার নিচে${isFalling ? ' এবং ক্রমহ্রাসমান' : ''}` 
      : isMoistExcess 
      ? `যা সর্বোচ্চ ${maxMois}% সীমার অতিরিক্ত` 
      : `যা নির্ধারিত ${minMois}% থেকে ${maxMois}% আদর্শ সীমার মধ্যে স্থিতিশীল`;
    bnParts.push(`মাটির আর্দ্রতা বর্তমানে ${Math.round(moisture)} শতাংশ, ${bnMoistStatus}।`);
  } else {
    bnParts.push(`মাটির আর্দ্রতা সেন্সর বর্তমানে অফলাইনে রয়েছে।`);
  }

  if (soilTemp !== null) {
    bnParts.push(`মাটির তাপমাত্রা এখন ${Math.round(soilTemp)} ডিগ্রি সেলসিয়াস।`);
  }

  if (ph !== null) {
    const bnPhLabel = ph < 6.0 ? 'সামান্য অম্লীয়' : ph > 7.5 ? 'ক্ষারীয়' : 'নিরপেক্ষ ও পুষ্টি শোষণের জন্য উপযুক্ত';
    bnParts.push(`মাটির পিএইচ মান ${ph.toFixed(1)}, যা ${bnPhLabel}।`);
  }

  if (npk && (npk.n !== null || npk.p !== null || npk.k !== null)) {
    bnParts.push(`মাটিতে নাইট্রোজেন ${Math.round(npk.n || 0)}, ফসফরাস ${Math.round(npk.p || 0)} এবং পটাশিয়াম ${Math.round(npk.k || 0)} কেজি প্রতি হেক্টর।`);
  } else {
    bnParts.push(`NPK পুষ্টি সেন্সর বর্তমানে সংযোগ বিচ্ছিন্ন।`);
  }

  // Weather Section (BN)
  let bnWeather = [];
  if (airTemp !== null) bnWeather.push(`বাতাসের তাপমাত্রা ${Math.round(airTemp)}°C`);
  if (humidity !== null) bnWeather.push(`বাতাসের আর্দ্রতা ${Math.round(humidity)}%`);
  if (light !== null) bnWeather.push(`সূর্যালোকের তীব্রতা ${Math.round(light)} লাক্স`);
  if (rainLevel !== null && rainLevel > 0) bnWeather.push(`বৃষ্টিপাত ${rainLevel} মিমি`);
  else if (bnWeather.length > 0) bnWeather.push(`বৃষ্টির কোনো সম্ভাবনা নেই`);

  if (bnWeather.length > 0) {
    bnParts.push(`আবহাওয়া তথ্য: ${bnWeather.join(', ')}।`);
  }

  // Irrigation Section (BN)
  if (isMoistDeficit) {
    const mins = Math.max(25, Math.min(60, Math.round((minMois - (moisture || 30)) * 2.5)));
    if (pumpState === 'ON') {
      bnParts.push(`বর্তমানে সেচ পাম্পটি চালু রয়েছে এবং ভালভ ${valveState === 'OPEN' ? 'খোলা' : 'বন্ধ'}, ফলে আর্দ্রতা দ্রুত বৃদ্ধি পাবে।`);
    } else {
      bnParts.push(`সেচ পাম্পটি বন্ধ রয়েছে। ফসলের জলের ঘাটতি পূরণে ভোরবেলায় বা বিকেলে প্রায় ${mins} মিনিট সেচ প্রদান করার পরামর্শ দেওয়া হচ্ছে।`);
    }
  } else if (isMoistExcess) {
    bnParts.push(`সেচ পাম্প বন্ধ রাখুন। অতিরিক্ত আর্দ্রতার কারণে জল নিষ্কাশনের নালাগুলো পরিষ্কার রাখা জরুরি।`);
  } else {
    bnParts.push(`সেচ পাম্প বন্ধ রয়েছে। বর্তমানে পর্যাপ্ত আর্দ্রতা থাকায় অতিরিক্ত সেচের প্রয়োজন নেই।`);
  }

  // ─── 3. HINDI DETAILED BRIEFING ───
  let hiParts = [];
  hiParts.push(`${cropName} फसल की विस्तृत रिपोर्ट: वर्तमान में फसल ${stage} अवस्था में है${das ? ` (${das})` : ''}।`);

  // Soil Section (HI)
  if (moisture !== null) {
    const hiMoistStatus = isMoistDeficit 
      ? `जो निर्धारित न्यूनतम ${minMois}% सीमा से कम है${isFalling ? ' और लगातार गिर रही है' : ''}` 
      : isMoistExcess 
      ? `जो अधिकतम ${maxMois}% सीमा से अधिक है` 
      : `जो निर्धारित ${minMois}% से ${maxMois}% के आदर्श दायरे में है`;
    hiParts.push(`मिट्टी की नमी वर्तमान में ${Math.round(moisture)}% है, ${hiMoistStatus}।`);
  } else {
    hiParts.push(`मिट्टी की नमी का सेंसर अभी ऑफ़लाइन है।`);
  }

  if (soilTemp !== null) {
    hiParts.push(`मिट्टी का तापमान ${Math.round(soilTemp)}°C दर्ज किया गया है।`);
  }

  if (ph !== null) {
    const hiPhLabel = ph < 6.0 ? 'हल्की अम्लीय' : ph > 7.5 ? 'क्षारीय' : 'संतुलित एवं पोषक तत्वों के लिए उपयुक्त';
    hiParts.push(`मिट्टी का पीएच स्तर ${ph.toFixed(1)} है, जो ${hiPhLabel} है।`);
  }

  if (npk && (npk.n !== null || npk.p !== null || npk.k !== null)) {
    hiParts.push(`पोषक तत्व: नाइट्रोजन ${Math.round(npk.n || 0)}, फास्फोरस ${Math.round(npk.p || 0)}, पोटाश ${Math.round(npk.k || 0)} किग्रा/हेक्टेयर है।`);
  } else {
    hiParts.push(`NPK पोषक तत्वों का सेंसर अभी उपलब्ध नहीं है।`);
  }

  // Weather Section (HI)
  let hiWeather = [];
  if (airTemp !== null) hiWeather.push(`हवा का तापमान ${Math.round(airTemp)}°C`);
  if (humidity !== null) hiWeather.push(`आर्द्रता ${Math.round(humidity)}%`);
  if (light !== null) hiWeather.push(`सूर्य का प्रकाश ${Math.round(light)} लक्स`);
  if (rainLevel !== null && rainLevel > 0) hiWeather.push(`वर्षा ${rainLevel} मिमी`);
  else if (hiWeather.length > 0) hiWeather.push(`बारिश दर्ज नहीं की गई`);

  if (hiWeather.length > 0) {
    hiParts.push(`मौसम स्थिति: ${hiWeather.join(', ')}।`);
  }

  // Irrigation Section (HI)
  if (isMoistDeficit) {
    const mins = Math.max(25, Math.min(60, Math.round((minMois - (moisture || 30)) * 2.5)));
    if (pumpState === 'ON') {
      hiParts.push(`सिंचाई पंप अभी चालू है और वाल्व ${valveState === 'OPEN' ? 'खुला' : 'बंद'} है, जिससे नमी स्तर सामान्य हो रहा है।`);
    } else {
      hiParts.push(`सिंचाई पंप अभी बंद है। फसल में नमी की कमी दूर करने के लिए सुबह या शाम को लगभग ${mins} मिनट हल्की सिंचाई करने की सलाह दी जाती है।`);
    }
  } else if (isMoistExcess) {
    hiParts.push(`पंप बंद रखें। खेत में जलभराव रोकने के लिए जल निकासी नालियों को खुला रखें।`);
  } else {
    hiParts.push(`पंप बंद है। मिट्टी में नमी का स्तर संतुलित है, इसलिए अभी सिंचाई की आवश्यकता नहीं है।`);
  }

  const assessmentEn = enParts.join(' ');
  const assessmentBn = bnParts.join(' ');
  const assessmentHi = hiParts.join(' ');

  return {
    source: 'local_agronomic_reasoning',
    assessment: {
      en: assessmentEn,
      bn: assessmentBn,
      hi: assessmentHi
    },
    urgency,
    tone,
    keyObservations: [
      `Soil moisture: ${moisture !== null ? `${Math.round(moisture)}%` : 'Unavailable'} (Target: ${minMois}-${maxMois}%)`,
      `Soil pH: ${ph !== null ? ph.toFixed(1) : '---'} | Soil Temp: ${soilTemp !== null ? `${Math.round(soilTemp)}°C` : '---'}`,
      `Weather: ${airTemp !== null ? `${Math.round(airTemp)}°C` : '---'}, ${humidity !== null ? `${Math.round(humidity)}%` : '---'} RH`,
      `Actuators: Pump ${pumpState}, Valve ${valveState}`,
      `Crop: ${cropName} (${stage})`
    ],
    missingDataNotes: missingData.unavailable?.length > 0 
      ? `Sensor status: ${missingData.unavailable.join(', ')} offline.`
      : 'All primary telemetry online.'
  };
};

/**
 * Generates holistic agricultural reasoning from complete live context.
 * Queries Gemini Flash with dynamic context & permanent reasoning policy.
 * Seamlessly falls back to localAgronomicReasoning when offline or key is unconfigured.
 */
export const generateHolisticFieldSummary = async ({ context, targetLang = 'en' } = {}) => {
  if (!context) {
    throw new Error("generateHolisticFieldSummary requires an assembled application context.");
  }

  // 1. Check if Secure Server-Side AI Proxy is configured (Zero Key Leaks)
  if (AI_PROXY_URL && AI_PROXY_URL.trim() !== '') {
    try {
      const proxyEndpoint = `${AI_PROXY_URL.replace(/\/+$/, '')}/summary`;
      const res = await fetch(proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, targetLang }),
        signal: AbortSignal.timeout(9000)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.speechSummary || data.overallAssessment) {
          const speechEn = data.speechSummary?.en || data.assessment?.en || data.overallAssessment;
          const speechBn = data.speechSummary?.bn || data.assessment?.bn || speechEn;
          const speechHi = data.speechSummary?.hi || data.assessment?.hi || speechEn;

          return {
            source: 'backend_secure_proxy_gemini',
            overallAssessment: data.overallAssessment || speechEn,
            importantConditions: data.importantConditions || [],
            recommendedAttention: data.recommendedAttention || [],
            missingInformation: data.missingInformation || [],
            confidenceNotes: data.confidenceNotes || 'Grounded in live KrishiSethu telemetry (via Secure Backend Proxy)',
            speechSummary: { en: speechEn, bn: speechBn, hi: speechHi },
            assessment: { en: speechEn, bn: speechBn, hi: speechHi },
            urgency: data.urgency || 'normal',
            tone: data.tone || 'warm',
            keyObservations: data.importantConditions || []
          };
        }
      }
    } catch (proxyErr) {
      console.warn('🛰️ [KrishiSethu AI] Backend proxy summary error, falling back:', proxyErr?.message);
    }
  }

  // 2. Direct Gemini Flash Cloud AI (Used when direct API key is configured)
  if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
    try {
      const promptContext = typeof context === 'string' 
        ? context 
        : (context.promptString || JSON.stringify(context, null, 2));

      const systemInstruction = `You are KrishiSethu AI, an expert, context-aware agricultural intelligence system for Indian farmers.
Analyze the complete live state of the farm plot provided in the context (telemetry, trends, user-configured ranges, actuator states, crop growth stage, alerts, device status, and explicitly noted missing data).

CRITICAL REASONING & SPEECH PRINCIPLES:
1. Reason dynamically over the entire situation. Do NOT produce a robotic sensor reading or a fixed template.
2. Prioritize what actually matters:
   - If conditions are normal and within user-configured ranges: Provide a reassuring, concise natural assessment. Do NOT unnecessarily recite every number.
   - If an issue or trend requires attention (e.g. soil moisture steadily dropping while the pump is OFF, or high heat with rising humidity during a vulnerable crop stage): Focus on explaining the relationship between conditions, actuators, and crop stage.
   - If an actuator is already handling the situation (e.g., pump is currently ON recovering moisture): Acknowledge that the automation is actively addressing it.
   - User-defined ranges are authoritative application context. Evaluate against these limits, not generic rules.
3. Explicitly recognize missing data:
   - If a sensor (like NPK or rain) is offline or unavailable, explicitly state that you cannot assess that aspect because the sensor is unmonitored.
   - Never invent numbers or guess unmonitored parameters.
4. Language Style:
   - English: Natural, conversational Indian English. Warm, respectful, clear, practical. No corporate jargon or robotic phrasing.
   - Bengali: Natural West Bengal conversational Bengali (চলিত ভাষা / Cholit style). Everyday spoken Bangla understood by farmers in West Bengal. Absolutely NO সাধু ভাষা (Sadhu Bhasha) and NO heavy Sanskritised words. Normal everyday terms (পাম্প, সেন্সর, আর্দ্রতা / ময়েশ্চার, তাপমাত্রা) are natural.
   - Hindi: Natural conversational Indian Hindi. Warm, practical, everyday spoken language. Avoid textbook / heavily Sanskritised Hindi.

Return ONLY valid JSON matching this schema:
{
  "overallAssessment": "<concise 1-2 sentence overall diagnosis>",
  "importantConditions": ["<key condition 1>", "<key condition 2>"],
  "recommendedAttention": ["<actionable advice if needed, or confirmation of optimal status>"],
  "missingInformation": ["<sensors or settings currently offline>"],
  "confidenceNotes": "<statement of confidence grounded in available vs unavailable telemetry>",
  "speechSummary": {
    "en": "<natural conversational spoken summary in Indian English>",
    "bn": "<natural conversational spoken summary in West Bengal Cholit Bangla>",
    "hi": "<natural conversational spoken summary in everyday Indian Hindi>"
  },
  "urgency": "normal" | "attention" | "critical" | "positive",
  "tone": "calm" | "concerned" | "urgent" | "warm"
}`;

      const requestPayload = {
        contents: [
          {
            role: "user",
            parts: [
              { text: `${systemInstruction}\n\nAPPLICATION CONTEXT:\n${promptContext}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1200,
          responseMimeType: "application/json"
        }
      };

      // Try gemini-2.5-flash then gemini-1.5-flash
      const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      let parsed = null;

      for (const m of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload),
            signal: AbortSignal.timeout(7500)
          });

          if (res.ok) {
            const data = await res.json();
            const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (rawJson) {
              const cleaned = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
              parsed = JSON.parse(cleaned);
              if (parsed.speechSummary?.en || parsed.overallAssessment) break;
            }
          }
        } catch (mErr) {
          console.warn(`[KrishiSethu AI] Model ${m} attempt:`, mErr?.message);
        }
      }

      if (parsed) {
        const speechEn = parsed.speechSummary?.en || parsed.assessment?.en || parsed.overallAssessment;
        const speechBn = parsed.speechSummary?.bn || parsed.assessment?.bn || speechEn;
        const speechHi = parsed.speechSummary?.hi || parsed.assessment?.hi || speechEn;

        return {
          source: 'gemini_flash_cloud_ai',
          overallAssessment: parsed.overallAssessment || speechEn,
          importantConditions: parsed.importantConditions || [],
          recommendedAttention: parsed.recommendedAttention || [],
          missingInformation: parsed.missingInformation || [],
          confidenceNotes: parsed.confidenceNotes || 'Grounded in live KrishiSethu telemetry',
          speechSummary: {
            en: speechEn,
            bn: speechBn,
            hi: speechHi
          },
          assessment: {
            en: speechEn,
            bn: speechBn,
            hi: speechHi
          },
          urgency: parsed.urgency || 'normal',
          tone: parsed.tone || 'warm',
          keyObservations: parsed.importantConditions || []
        };
      }
    } catch (e) {
      console.warn("🛰️ [KrishiSethu AI] Cloud Gemini Flash call timed out or failed:", e.message);
    }
  }

  // 2. Dynamic Local Agronomic Reasoning Fallback
  const localRes = localAgronomicReasoning(context);
  return {
    ...localRes,
    speechSummary: localRes.assessment
  };
};

export const generateGeminiAgriculturalReasoning = generateHolisticFieldSummary;

// ─── AUDIO UTILITY: PCM TO WAV CONVERTER ────────────────────────────────────
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function pcmToWavBlob(pcmData, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat (PCM = 1)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmBytes = new Uint8Array(pcmData);
  const wavBytes = new Uint8Array(buffer, 44);
  wavBytes.set(pcmBytes);

  return new Blob([buffer], { type: 'audio/wav' });
}

// ─── STABLE VOICE PROFILES CONFIGURATION ────────────────────────────────────
export const STABLE_VOICE_PROFILES = {
  en: {
    languageCode: 'en-IN',
    defaultVoice: 'en-IN-Journey-D',
    availableVoices: [
      { id: 'en-IN-Journey-D', name: 'Voice A (Warm Indian English)', gender: 'FEMALE' },
      { id: 'en-IN-Neural2-D', name: 'Voice B (Clear Indian English)', gender: 'FEMALE' },
      { id: 'en-IN-Neural2-B', name: 'Voice C (Professional Indian English)', gender: 'MALE' }
    ],
    geminiPrebuiltVoice: 'Puck'
  },
  bn: {
    languageCode: 'bn-IN',
    defaultVoice: 'bn-IN-Neural2-A',
    availableVoices: [
      { id: 'bn-IN-Neural2-A', name: 'Voice A (স্বাভাবিক বাংলা - নারী)', gender: 'FEMALE' },
      { id: 'bn-IN-Wavenet-B', name: 'Voice B (স্বাভাবিক বাংলা - পুরুষ)', gender: 'MALE' }
    ],
    geminiPrebuiltVoice: 'Aoede'
  },
  hi: {
    languageCode: 'hi-IN',
    defaultVoice: 'hi-IN-Neural2-B',
    availableVoices: [
      { id: 'hi-IN-Neural2-B', name: 'Voice A (स्वाभाविक हिंदी - पुरुष)', gender: 'MALE' },
      { id: 'hi-IN-Neural2-A', name: 'Voice B (स्वाभाविक हिंदी - महिला)', gender: 'FEMALE' }
    ],
    geminiPrebuiltVoice: 'Charon'
  }
};

export const getStableVoiceConfig = (lang = 'en') => {
  const profile = STABLE_VOICE_PROFILES[lang] || STABLE_VOICE_PROFILES.en;
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(`krishisethu_voice_${lang}`) : null;
  return stored || profile.defaultVoice;
};

export const setStableVoiceConfig = (lang, voiceId) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(`krishisethu_voice_${lang}`, voiceId);
  }
};

/**
 * 🎙️ GEMINI TTS ONLY: Synthesizes high-fidelity natural speech audio.
 * Uses Google Cloud / Gemini TTS API exclusively — never browser SpeechSynthesis or native offline TTS.
 * 
 * Pipeline:
 * Gemini Flash Text -> Gemini TTS / Google Cloud Voice Synthesis -> Audio Blob URL -> KrishiSethu Player
 */
export const synthesizeGeminiTtsAudio = async ({
  text,
  lang = 'en',
  voiceName = null,
  urgency = 'normal'
} = {}) => {
  if (!text || typeof text !== 'string') {
    throw new Error('synthesizeGeminiTtsAudio requires valid text to synthesize.');
  }

  // Strip markdown formatting if any
  const cleanText = text
    .replace(/[#*`_~>[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const profile = STABLE_VOICE_PROFILES[lang] || STABLE_VOICE_PROFILES.en;
  const targetVoice = voiceName || getStableVoiceConfig(lang);

  // ── Method 0: Secure Backend Proxy TTS (Server-Side Key, Zero Exposure) ──
  if (AI_PROXY_URL && AI_PROXY_URL.trim() !== '') {
    try {
      const proxyTtsEndpoint = `${AI_PROXY_URL.replace(/\/+$/, '')}/tts`;
      const res = await fetch(proxyTtsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          lang,
          voiceName: targetVoice,
          urgency
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 100) {
          const audioUrl = URL.createObjectURL(blob);
          return {
            audioUrl,
            blob,
            source: 'backend_secure_proxy_tts',
            voice: targetVoice,
            lang
          };
        }
      }
    } catch (proxyTtsErr) {
      console.warn('[Gemini TTS] Secure proxy TTS error, trying direct:', proxyTtsErr?.message);
    }
  }

  const apiKey = GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('Gemini AI Voice synthesis requires a configured backend proxy (VITE_AI_PROXY_URL) or VITE_GEMINI_API_KEY in .env.');
  }

  // ── Method 1: Google Cloud Text-to-Speech API (Neural2 / Journey Indian voices) ──
  try {
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const rate = urgency === 'critical' ? 1.04 : (urgency === 'attention' ? 0.98 : 0.92);
    const pitch = urgency === 'critical' ? 1.4 : (urgency === 'attention' ? 0.6 : 0.0);

    const ttsPayload = {
      input: { text: cleanText },
      voice: {
        languageCode: profile.languageCode,
        name: targetVoice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: rate,
        pitch: pitch
      }
    };

    const res = await fetch(ttsUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ttsPayload),
      signal: AbortSignal.timeout(12000)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioContent) {
        const binary = atob(data.audioContent);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(blob);
        return {
          audioUrl,
          blob,
          source: 'gemini_cloud_tts',
          voice: targetVoice,
          lang
        };
      }
    }
  } catch (err) {
    console.warn('[Gemini TTS] Cloud TTS synthesis attempt note:', err?.message || err);
  }

  // ── Method 2: Gemini 2.0 Flash Native Audio Modality ──
  try {
    const geminiAudioUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const langDirectives = {
      en: 'Read the following agricultural advisory in natural conversational Indian English with clear pronunciation. Speak ONLY the exact text:\n\n',
      bn: 'নিচের কৃষি বার্তাটি পশ্চিমবঙ্গের স্বাভাবিক চলিত বাংলায় স্পষ্ট ও স্বাভাবিক উচ্চারণে পাঠ করুন। শুধুমাত্র নিচের টেক্সটটি বলুন:\n\n',
      hi: 'निम्नलिखित कृषि परामर्श को स्वाभाविक भारतीय हिंदी में स्पष्ट और आत्मीय आवाज में बोलें। केवल यह संदेश बोलें:\n\n'
    };

    const audioPrompt = (langDirectives[lang] || langDirectives.en) + cleanText;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: audioPrompt }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: profile.geminiPrebuiltVoice
            }
          }
        }
      }
    };

    const res = await fetch(geminiAudioUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(14000)
    });

    if (res.ok) {
      const data = await res.json();
      const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'audio/wav';
        const base64Data = part.inlineData.data;
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        let blob;
        if (mime.includes('pcm')) {
          blob = pcmToWavBlob(bytes.buffer, 24000, 1, 16);
        } else {
          blob = new Blob([bytes], { type: mime });
        }

        const audioUrl = URL.createObjectURL(blob);
        return {
          audioUrl,
          blob,
          source: 'gemini_flash_audio',
          voice: profile.geminiPrebuiltVoice,
          lang
        };
      }
    }
  } catch (err) {
    console.warn('[Gemini TTS] Gemini 2.0 Flash Audio modality attempt note:', err?.message || err);
  }

  throw new Error('Gemini TTS audio synthesis could not generate audio. Please check internet connection.');
};

export const synthesizeGeminiSpeech = synthesizeGeminiTtsAudio;



/**
 * KrishiSethu — Secure Serverless AI & Voice Proxy
 * Firebase Cloud Functions (v2 / v1 compatible)
 *
 * Keeps Gemini API Key & Google Cloud credentials strictly server-side.
 * Client never sees the secret API key.
 */

const functions = require("firebase-functions");

// Read Gemini / Cloud key strictly from server environment / secrets
const SERVER_GEMINI_KEY = process.env.GEMINI_API_KEY || (functions.config().gemini ? functions.config().gemini.key : "");

// STABLE VOICE PROFILES
const STABLE_VOICE_CONFIG = {
  en: { languageCode: "en-IN", defaultVoice: "en-IN-Journey-D" },
  bn: { languageCode: "bn-IN", defaultVoice: "bn-IN-Neural2-A" },
  hi: { languageCode: "hi-IN", defaultVoice: "hi-IN-Neural2-B" }
};

/**
 * 🛰️ Proxy Endpoint 1: Gemini Agricultural Reasoning
 * POST /aiSummary
 */
exports.aiSummary = functions.https.onRequest(async (req, res) => {
  // CORS Handling
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = SERVER_GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server configuration error: GEMINI_API_KEY is not configured on this cloud function."
    });
  }

  const { context, targetLang = "en" } = req.body || {};
  if (!context) {
    return res.status(400).json({ error: "Missing required parameter: context." });
  }

  const promptContext = typeof context === "string" ? context : JSON.stringify(context, null, 2);

  const systemInstruction = `You are KrishiSethu AI, an expert, context-aware agricultural intelligence system for Indian farmers.
Analyze the complete live state of the farm plot provided in the context (telemetry, trends, user-configured ranges, actuator states, crop growth stage, alerts, device status, and explicitly noted missing data).

CRITICAL REASONING & SPEECH PRINCIPLES:
1. Reason dynamically over the entire situation. Do NOT produce a robotic sensor reading or a fixed template.
2. Prioritize what actually matters:
   - If conditions are normal and within user-configured ranges: Provide a reassuring, concise natural assessment. Do NOT unnecessarily recite every number.
   - If an issue or trend requires attention (e.g. soil moisture steadily dropping while the pump is OFF): Focus on explaining the relationship between conditions, actuators, and crop stage.
   - If an actuator is already handling the situation (e.g., pump is currently ON recovering moisture): Acknowledge that automation is actively addressing it.
   - User-defined ranges are authoritative application context. Evaluate against these limits, not generic rules.
3. Explicitly recognize missing data:
   - If a sensor (like NPK or rain) is offline or unavailable, explicitly state that you cannot assess that aspect because the sensor is unmonitored.
   - Never invent numbers or guess unmonitored parameters.
4. Language Style:
   - English: Natural, conversational Indian English. Warm, respectful, clear, practical.
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

  const models = ["gemini-2.5-flash", "gemini-1.5-flash"];
  let parsed = null;

  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const data = await response.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawJson) {
          const cleaned = rawJson.replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
          parsed = JSON.parse(cleaned);
          if (parsed.speechSummary?.en || parsed.overallAssessment) break;
        }
      }
    } catch (e) {
      console.warn(`[Proxy] Model ${m} attempt error:`, e.message);
    }
  }

  if (parsed) {
    return res.status(200).json({
      source: "backend_secure_proxy_gemini",
      ...parsed
    });
  }

  return res.status(502).json({ error: "Failed to generate AI summary from upstream models." });
});

/**
 * 🎙️ Proxy Endpoint 2: Gemini / Google Cloud TTS Audio Synthesis
 * POST /aiTts
 */
exports.aiTts = functions.https.onRequest(async (req, res) => {
  // CORS Handling
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const apiKey = SERVER_GEMINI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server configuration error: GEMINI_API_KEY is not configured on this cloud function."
    });
  }

  const { text, lang = "en", voiceName = null, urgency = "normal" } = req.body || {};
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing required string parameter: text." });
  }

  const cleanText = text
    .replace(/[#*`_~>[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const profile = STABLE_VOICE_CONFIG[lang] || STABLE_VOICE_CONFIG.en;
  const targetVoice = voiceName || profile.defaultVoice;

  // Attempt Google Cloud Text-to-Speech
  try {
    const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    const rate = urgency === "critical" ? 1.04 : urgency === "attention" ? 0.98 : 0.92;
    const pitch = urgency === "critical" ? 1.4 : urgency === "attention" ? 0.6 : 0.0;

    const ttsPayload = {
      input: { text: cleanText },
      voice: {
        languageCode: profile.languageCode,
        name: targetVoice
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: rate,
        pitch: pitch
      }
    };

    const upstreamRes = await fetch(ttsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ttsPayload)
    });

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      if (data.audioContent) {
        const audioBuffer = Buffer.from(data.audioContent, "base64");
        res.set("Content-Type", "audio/mp3");
        res.set("Content-Length", audioBuffer.length);
        res.set("Cache-Control", "no-cache");
        return res.status(200).send(audioBuffer);
      }
    }
  } catch (err) {
    console.warn("[Proxy TTS] Cloud TTS upstream error:", err.message);
  }

  return res.status(502).json({ error: "Failed to synthesize speech audio from upstream." });
});

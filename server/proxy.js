/**
 * KrishiSethu — Standalone Node.js AI & TTS Proxy Server
 * 
 * Usage:
 *   GEMINI_API_KEY="your-gemini-key" PORT=3001 node server/proxy.js
 * 
 * Client .env:
 *   VITE_AI_PROXY_URL=http://localhost:3001/api/ai
 */

const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const STABLE_VOICE_CONFIG = {
  en: { languageCode: 'en-IN', defaultVoice: 'en-IN-Journey-D' },
  bn: { languageCode: 'bn-IN', defaultVoice: 'bn-IN-Neural2-A' },
  hi: { languageCode: 'hi-IN', defaultVoice: 'hi-IN-Neural2-B' }
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // Health check
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    return sendJson(res, 200, {
      service: 'KrishiSethu AI Proxy Server',
      status: 'operational',
      hasApiKey: Boolean(GEMINI_API_KEY && GEMINI_API_KEY.length > 5)
    });
  }

  // Parse Body for POST
  if (req.method === 'POST') {
    let bodyStr = '';
    req.on('data', chunk => { bodyStr += chunk; });
    req.on('end', async () => {
      let body = {};
      try {
        body = JSON.parse(bodyStr || '{}');
      } catch (e) {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }

      const apiKey = GEMINI_API_KEY || req.headers['x-goog-api-key'];
      if (!apiKey) {
        return sendJson(res, 500, {
          error: 'GEMINI_API_KEY is not configured on the proxy server.'
        });
      }

      // Endpoint 1: /api/ai/summary or /summary
      if (url.pathname.endsWith('/summary')) {
        const { context, targetLang = 'en' } = body;
        if (!context) return sendJson(res, 400, { error: 'Missing context' });

        const promptContext = typeof context === 'string' ? context : JSON.stringify(context, null, 2);

        const systemInstruction = `You are KrishiSethu AI, an expert context-aware agricultural intelligence system for Indian farmers.
Reason over the complete live farm state provided in the context. Never dump raw sensor lists or robotic phrases.
Return valid JSON matching:
{
  "overallAssessment": "<1-2 sentence overall diagnosis>",
  "importantConditions": ["<condition 1>", "<condition 2>"],
  "recommendedAttention": ["<actionable advice>"],
  "missingInformation": ["<sensors currently offline>"],
  "confidenceNotes": "<grounded confidence notes>",
  "speechSummary": {
    "en": "<natural conversational Indian English>",
    "bn": "<natural West Bengal Cholit Bangla>",
    "hi": "<natural conversational Indian Hindi>"
  },
  "urgency": "normal" | "attention" | "critical" | "positive",
  "tone": "calm" | "concerned" | "urgent" | "warm"
}`;

        const requestPayload = JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\nAPPLICATION CONTEXT:\n${promptContext}` }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 1200, responseMimeType: 'application/json' }
        });

        const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        let parsed = null;

        for (const m of models) {
          try {
            const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: requestPayload
            });
            if (upstream.ok) {
              const data = await upstream.json();
              const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (rawJson) {
                const cleaned = rawJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
                parsed = JSON.parse(cleaned);
                if (parsed.speechSummary?.en || parsed.overallAssessment) break;
              }
            }
          } catch (err) {
            console.warn(`Model ${m} proxy error:`, err.message);
          }
        }

        if (parsed) {
          return sendJson(res, 200, { source: 'backend_secure_proxy_gemini', ...parsed });
        }
        return sendJson(res, 502, { error: 'Failed to generate summary from upstream Gemini models' });
      }

      // Endpoint 2: /api/ai/tts or /tts
      if (url.pathname.endsWith('/tts')) {
        const { text, lang = 'en', voiceName = null, urgency = 'normal' } = body;
        if (!text) return sendJson(res, 400, { error: 'Missing text parameter' });

        const cleanText = text.replace(/[#*`_~>[\]]/g, '').replace(/\s+/g, ' ').trim();
        const profile = STABLE_VOICE_CONFIG[lang] || STABLE_VOICE_CONFIG.en;
        const targetVoice = voiceName || profile.defaultVoice;

        try {
          const rate = urgency === 'critical' ? 1.04 : (urgency === 'attention' ? 0.98 : 0.92);
          const pitch = urgency === 'critical' ? 1.4 : (urgency === 'attention' ? 0.6 : 0.0);

          const ttsPayload = JSON.stringify({
            input: { text: cleanText },
            voice: { languageCode: profile.languageCode, name: targetVoice },
            audioConfig: { audioEncoding: 'MP3', speakingRate: rate, pitch: pitch }
          });

          const ttsRes = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: ttsPayload
          });

          if (ttsRes.ok) {
            const data = await ttsRes.json();
            if (data.audioContent) {
              const audioBuffer = Buffer.from(data.audioContent, 'base64');
              res.writeHead(200, {
                'Content-Type': 'audio/mp3',
                'Content-Length': audioBuffer.length,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
              });
              return res.end(audioBuffer);
            }
          }
        } catch (ttsErr) {
          console.warn('TTS proxy error:', ttsErr.message);
        }

        return sendJson(res, 502, { error: 'Failed to synthesize audio from upstream TTS' });
      }

      return sendJson(res, 404, { error: 'Endpoint not found' });
    });
    return;
  }

  return sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`🛰️ KrishiSethu AI Proxy running at http://localhost:${PORT}`);
  console.log(`   - Gemini Reasoning Endpoint: http://localhost:${PORT}/api/ai/summary`);
  console.log(`   - Cloud TTS Endpoint:        http://localhost:${PORT}/api/ai/tts`);
  console.log(`   - API Key Configured:        ${Boolean(GEMINI_API_KEY)}`);
});

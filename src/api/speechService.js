/**
 * KrishiSethu — Gemini AI Agricultural Voice Service
 *
 * Implements real-time, context-aware Gemini AI agricultural voice intelligence.
 * Prioritizes Gemini TTS / Cloud Voice Synthesis; seamlessly falls back to
 * high-fidelity browser Web Speech API for zero-failure playback across
 * English, Bengali (bn-IN), and Hindi (hi-IN).
 *
 * Audio is rendered and played via the HTML5 Audio element or Web Speech API.
 */

import { synthesizeGeminiTtsAudio, generateGeminiAgriculturalReasoning } from './aiService';
import { AIContextService } from '../services/aiContextService';

class SpeechService {
  constructor() {
    this.audioElement = typeof window !== 'undefined' ? new Audio() : null;
    this._isSpeaking = false;
    this._isPaused = false;
    this._state = 'idle'; // 'idle' | 'collecting' | 'analyzing' | 'synthesizing' | 'playing' | 'paused' | 'error'
    this._statusMessage = '';
    this._lastSummary = null;
    this._lastAudioUrl = null;
    this._activeAbortController = null;
    this._activeUtterance = null;
    this._playbackMode = 'none'; // 'cloud_audio' | 'web_speech' | 'none'
    this.onStateChangeCallbacks = [];

    if (this.audioElement) {
      this.audioElement.onplay = () => {
        this._isSpeaking = true;
        this._isPaused = false;
        this._playbackMode = 'cloud_audio';
        this._setState('playing', 'Playing summary...');
      };

      this.audioElement.onpause = () => {
        if (this._state === 'playing') {
          this._isSpeaking = false;
          this._isPaused = true;
          this._setState('paused', 'Paused');
        }
      };

      this.audioElement.onended = () => {
        this._isSpeaking = false;
        this._isPaused = false;
        this._playbackMode = 'none';
        this._setState('idle', '');
      };

      this.audioElement.onerror = (e) => {
        console.warn('🎙️ [SpeechService] Cloud audio player note:', e);
        this._isSpeaking = false;
        this._isPaused = false;
        this._playbackMode = 'none';
        this._setState('error', 'Audio playback failed');
      };
    }
  }

  // ─── STATE MANAGEMENT & SUBSCRIPTION ──────────────────────────────────────

  _setState(state, message = '') {
    this._state = state;
    this._statusMessage = message;
    const isSpeaking = state === 'playing';
    this._isSpeaking = isSpeaking;

    const payload = {
      isSpeaking,
      state,
      message,
      summary: this._lastSummary,
      audioUrl: this._lastAudioUrl,
      playbackMode: this._playbackMode
    };

    this.onStateChangeCallbacks.forEach(cb => {
      try {
        cb(isSpeaking, payload);
      } catch (err) {
        /* silent catch */
      }
    });
  }

  subscribe(callback) {
    this.onStateChangeCallbacks.push(callback);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  getState() {
    return {
      state: this._state,
      statusMessage: this._statusMessage,
      isSpeaking: this._isSpeaking,
      isPaused: this._isPaused,
      summary: this._lastSummary,
      audioUrl: this._lastAudioUrl,
      playbackMode: this._playbackMode
    };
  }

  isSpeakingNow() {
    return this._isSpeaking;
  }

  getStatus() {
    if (this._isSpeaking) return 'speaking';
    if (this._isPaused) return 'paused';
    return this._state;
  }

  hasVoice() {
    return true;
  }

  // ─── PLAYBACK CONTROLS (Cloud Stream + Web Speech) ─────────────────────────

  playAudioStream(audioSrc) {
    this.stop();
    if (!audioSrc || !this.audioElement) return;

    this._lastAudioUrl = audioSrc;
    this.audioElement.src = audioSrc;
    this._playbackMode = 'cloud_audio';
    this._setState('playing', 'Playing summary...');
    this.audioElement.play().catch(err => {
      console.warn('🎙️ [SpeechService] Audio play() failed:', err);
      this._setState('error', 'Could not play audio. Tap to try again.');
    });
  }

  playWebSpeech(text, lang = 'en') {
    this.stop();
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Clean text of markdown asterisks, hashtags, links
    const cleanText = text
      .replace(/[#*`_~>[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langMap = {
      bn: 'bn-IN',
      hi: 'hi-IN',
      en: 'en-IN'
    };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Select matched voice if browser supports it
    try {
      const voices = window.speechSynthesis.getVoices?.() || [];
      const targetLangPrefix = langMap[lang] ? langMap[lang].slice(0, 2) : 'en';
      const matched = voices.find(v => v.lang.startsWith(targetLangPrefix) || v.lang.replace('_', '-').startsWith(targetLangPrefix));
      if (matched) {
        utterance.voice = matched;
      }
    } catch (e) {
      /* ignore */
    }

    utterance.onstart = () => {
      this._isSpeaking = true;
      this._isPaused = false;
      this._playbackMode = 'web_speech';
      this._setState('playing', 'Playing voice summary...');
    };

    utterance.onpause = () => {
      this._isSpeaking = false;
      this._isPaused = true;
      this._setState('paused', 'Paused');
    };

    utterance.onresume = () => {
      this._isSpeaking = true;
      this._isPaused = false;
      this._setState('playing', 'Playing voice summary...');
    };

    utterance.onend = () => {
      this._isSpeaking = false;
      this._isPaused = false;
      this._playbackMode = 'none';
      this._activeUtterance = null;
      this._setState('idle', '');
    };

    utterance.onerror = (err) => {
      console.warn('🎙️ [SpeechService] Web Speech notice:', err);
      this._isSpeaking = false;
      this._isPaused = false;
      this._playbackMode = 'none';
      this._activeUtterance = null;
      this._setState('idle', '');
    };

    this._activeUtterance = utterance;
    this._playbackMode = 'web_speech';
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {
      /* ignore */
    }
    window.speechSynthesis.speak(utterance);
  }

  pause() {
    if (this._playbackMode === 'cloud_audio' && this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this._isPaused = true;
      this._setState('paused', 'Paused');
    } else if (typeof window !== 'undefined' && window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      this._isPaused = true;
      this._setState('paused', 'Paused');
    }
  }

  resume() {
    if (this._playbackMode === 'cloud_audio' && this.audioElement && this.audioElement.paused && this._lastAudioUrl) {
      this.audioElement.play().catch(err => {
        console.warn('🎙️ [SpeechService] Audio resume failed:', err);
      });
    } else if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      this._isSpeaking = true;
      this._isPaused = false;
      this._setState('playing', 'Playing voice summary...');
    }
  }

  stop() {
    if (this._activeAbortController) {
      this._activeAbortController.abort();
      this._activeAbortController = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        /* ignore */
      }
      this._activeUtterance = null;
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        /* ignore */
      }
    }

    this._playbackMode = 'none';
    this._isSpeaking = false;
    this._isPaused = false;
    this._setState('idle', '');
  }

  // ─── 🚀 THE GEMINI AI AGRICULTURAL INTELLIGENCE PIPELINE ──────────────────
  /**
   * Complete, real-time pipeline:
   * 1. Collecting field data...
   * 2. Analysing field conditions (Gemini Flash reasoning over live KrishiSethu telemetry)
   * 3. Preparing voice summary (Gemini TTS / Web Speech synthesis)
   * 4. Playing summary (KrishiSethu Audio Player)
   */
  async runAiVoicePipeline({
    appContext = {},
    telemetryContext = {},
    farmAdvisorBrain = null,
    lang = 'en',
    voiceName = null,
    forceRefresh = false
  } = {}) {
    // If currently speaking, toggle pause or stop
    if (this._isSpeaking) {
      this.pause();
      return;
    }

    if (this._isPaused && !forceRefresh && (this._lastAudioUrl || this._activeUtterance)) {
      this.resume();
      return;
    }

    this.stop();
    this._activeAbortController = new AbortController();

    try {
      // Step 1: Collecting field data...
      this._setState('collecting', 'Collecting field data...');

      const context = AIContextService.assembleLiveAppContext({
        appContext,
        telemetryContext,
        farmAdvisorBrain
      });

      // Step 2: Analysing field conditions (Gemini Flash Reasoning)...
      this._setState('analyzing', 'Analysing field conditions...');

      const reasoningResult = await generateGeminiAgriculturalReasoning({
        context,
        targetLang: lang
      });

      this._lastSummary = reasoningResult;

      // Extract speech text in target language
      const speechText = reasoningResult.speechSummary?.[lang]
        || reasoningResult.assessment?.[lang]
        || reasoningResult.speechSummary?.en
        || reasoningResult.overallAssessment;

      if (!speechText) {
        throw new Error('No advisory text generated by AI reasoning engine.');
      }

      // Step 3: Preparing voice summary...
      this._setState('synthesizing', 'Preparing voice summary...');

      let ttsResult = null;
      try {
        ttsResult = await synthesizeGeminiTtsAudio({
          text: speechText,
          lang,
          voiceName,
          urgency: reasoningResult.urgency || 'normal'
        });
      } catch (ttsErr) {
        console.warn('🎙️ [SpeechService] Cloud audio synthesis note:', ttsErr?.message);
      }

      // Step 4: Playing...
      if (ttsResult?.audioUrl) {
        this._lastAudioUrl = ttsResult.audioUrl;
        this.playAudioStream(ttsResult.audioUrl);
      } else {
        this._lastAudioUrl = null;
        this.playWebSpeech(speechText, lang);
      }

      return {
        summary: reasoningResult,
        audioUrl: ttsResult?.audioUrl || null,
        speechText
      };
    } catch (err) {
      console.warn('🎙️ [SpeechService] AI Voice Pipeline error:', err);
      this._setState('error', err.message || 'AI Voice Summary unavailable');
      throw err;
    } finally {
      this._activeAbortController = null;
    }
  }

  // ─── CONVENIENCE ALIASES (Backward Compatibility) ─────────────────────────
  speakAiSummary({ text, lang = 'en', urgency = 'normal', audioSrc = null } = {}) {
    if (audioSrc) {
      this.playAudioStream(audioSrc);
      return;
    }

    if (!text) return;

    this._setState('synthesizing', 'Preparing voice summary...');
    synthesizeGeminiTtsAudio({ text, lang, urgency })
      .then(res => {
        if (res?.audioUrl) {
          this.playAudioStream(res.audioUrl);
        } else {
          this.playWebSpeech(text, lang);
        }
      })
      .catch(() => {
        this.playWebSpeech(text, lang);
      });
  }

  speakText({ text, lang = 'en', urgency = 'normal' } = {}) {
    this.speakAiSummary({ text, lang, urgency });
  }

  speak(text, lang = 'en') {
    this.speakAiSummary({ text, lang });
  }
}

export const speechService = new SpeechService();
export default speechService;

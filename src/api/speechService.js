/**
 * KrishiSethu — Gemini AI Agricultural Voice Service
 *
 * Implements real-time, context-aware Gemini AI agricultural voice intelligence.
 * Strictly uses Gemini TTS / Google Cloud Voice Synthesis for audio generation.
 * NEVER uses browser SpeechSynthesis, native device TTS, or local offline TTS.
 *
 * Audio is rendered and played via the HTML5 Audio element.
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
    this.onStateChangeCallbacks = [];

    if (this.audioElement) {
      this.audioElement.onplay = () => {
        this._isSpeaking = true;
        this._isPaused = false;
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
        this._setState('idle', '');
      };

      this.audioElement.onerror = (e) => {
        console.warn('🎙️ [SpeechService] Cloud audio player error:', e);
        this._isSpeaking = false;
        this._isPaused = false;
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
      audioUrl: this._lastAudioUrl
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
      audioUrl: this._lastAudioUrl
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
    // Cloud Gemini TTS supports English, Bengali, and Hindi natively
    return true;
  }

  // ─── PLAYBACK CONTROLS (HTML5 Audio Player) ───────────────────────────────

  playAudioStream(audioSrc) {
    this.stop();
    if (!audioSrc || !this.audioElement) return;

    this._lastAudioUrl = audioSrc;
    this.audioElement.src = audioSrc;
    this._setState('playing', 'Playing summary...');
    this.audioElement.play().catch(err => {
      console.warn('🎙️ [SpeechService] Audio play() failed:', err);
      this._setState('error', 'Could not play audio. Tap to try again.');
    });
  }

  pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this._isPaused = true;
      this._setState('paused', 'Paused');
    }
  }

  resume() {
    if (this.audioElement && this.audioElement.paused && this._lastAudioUrl) {
      this.audioElement.play().catch(err => {
        console.warn('🎙️ [SpeechService] Audio resume failed:', err);
      });
    }
  }

  stop() {
    if (this._activeAbortController) {
      this._activeAbortController.abort();
      this._activeAbortController = null;
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (e) {
        /* ignore */
      }
    }

    this._isSpeaking = false;
    this._isPaused = false;
    this._setState('idle', '');
  }

  // ─── 🚀 THE GEMINI AI AGRICULTURAL INTELLIGENCE PIPELINE ──────────────────
  /**
   * Complete, real-time pipeline:
   * 1. Collecting field data...
   * 2. Analysing field conditions (Gemini Flash reasoning over live KrishiSethu telemetry)
   * 3. Preparing voice summary (Gemini TTS audio synthesis ONLY)
   * 4. Playing summary (KrishiSethu HTML5 Audio player)
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

    if (this._isPaused && !forceRefresh && this._lastAudioUrl) {
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

      // Step 3: Preparing voice summary (Gemini TTS ONLY)...
      this._setState('synthesizing', 'Preparing voice summary...');

      const ttsResult = await synthesizeGeminiTtsAudio({
        text: speechText,
        lang,
        voiceName,
        urgency: reasoningResult.urgency || 'normal'
      });

      if (!ttsResult?.audioUrl) {
        throw new Error('Gemini TTS failed to produce an audio stream.');
      }

      // Step 4: Playing...
      this._lastAudioUrl = ttsResult.audioUrl;
      this.playAudioStream(ttsResult.audioUrl);

      return {
        summary: reasoningResult,
        audioUrl: ttsResult.audioUrl,
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

    // Direct Gemini TTS synthesis call
    this._setState('synthesizing', 'Preparing voice summary...');
    synthesizeGeminiTtsAudio({ text, lang, urgency })
      .then(res => {
        if (res?.audioUrl) {
          this.playAudioStream(res.audioUrl);
        }
      })
      .catch(err => {
        console.warn('[SpeechService] synthesizeGeminiTtsAudio error:', err);
        this._setState('error', err.message || 'TTS Error');
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

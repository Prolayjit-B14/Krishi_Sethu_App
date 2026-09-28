/**
 * KrishiSethu — Voice Service (TTS Central API)
 *
 * Centralized Gemini AI Audio & Voice interface for KrishiSethu.
 * Exclusively routes speech generation through Gemini Flash reasoning and Gemini TTS.
 * Zero usage of browser SpeechSynthesis or native offline TTS.
 */

import { speechService } from '../api/speechService';

/**
 * Speaks the provided text via Gemini TTS.
 */
export const speakText = ({
  text,
  language = 'en',
  lang,
  urgency = 'normal'
} = {}) => {
  const selectedLang = language || lang || 'en';
  speechService.speakAiSummary({
    text,
    lang: selectedLang,
    urgency
  });
};

/**
 * Runs the complete real-time Gemini AI agricultural voice intelligence pipeline.
 */
export const runAiVoicePipeline = (options) => {
  return speechService.runAiVoicePipeline(options);
};

/**
 * Stops any active speech synthesis immediately.
 */
export const stopSpeaking = () => {
  speechService.stop();
};

/**
 * Pauses speaking if supported.
 */
export const pauseSpeaking = () => {
  speechService.pause();
};

/**
 * Resumes speaking after pause.
 */
export const resumeSpeaking = () => {
  speechService.resume();
};

/**
 * Returns true if speech is currently active.
 * @returns {boolean}
 */
export const isSpeaking = () => {
  return speechService.isSpeakingNow();
};

/**
 * Returns the current speech status: 'idle' | 'speaking' | 'paused' | 'unavailable'
 * @returns {string}
 */
export const getStatus = () => {
  return speechService.getStatus();
};

/**
 * Returns true if a voice is available for the requested language.
 * Gemini Cloud TTS supports all three target languages.
 * @param {string} language - 'en' | 'hi' | 'bn'
 * @returns {boolean}
 */
export const hasVoice = (language) => {
  return speechService.hasVoice(language);
};

/**
 * Subscribes to speaking state changes.
 * @param {function(boolean, object): void} callback
 * @returns {function(): void} Unsubscribe function
 */
export const subscribe = (callback) => {
  return speechService.subscribe(callback);
};

/**
 * Open Charms — Web Audio Chime Generator
 * Synthesizes gentle music-box / bell chimes on interaction.
 * Zero external audio files, 100% self-contained.
 */
(function (root) {
  'use strict';

  let audioCtx = null;
  const PENTATONIC_FREQS = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5, D5, E5, G5, A5, C6
  let lastNoteIndex = -1;

  function getAudioContext() {
    if (!audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  const OpenCharmsAudio = {
    playChime(type = 'bell') {
      try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Pick next note harmonically
        let noteIndex = Math.floor(Math.random() * PENTATONIC_FREQS.length);
        if (noteIndex === lastNoteIndex) {
          noteIndex = (noteIndex + 1) % PENTATONIC_FREQS.length;
        }
        lastNoteIndex = noteIndex;
        const freq = PENTATONIC_FREQS[noteIndex];

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Music box / tiny bell timbre: sine with subtle harmonic
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Gentle envelope: instant soft attack, sweet ringing decay
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        // Optional overtone sparkle for metallic charm bell
        const overtoneOsc = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        overtoneOsc.type = 'sine';
        overtoneOsc.frequency.setValueAtTime(freq * 2.76, now);
        overtoneGain.gain.setValueAtTime(0.02, now);
        overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(ctx.destination);

        osc.start(now);
        overtoneOsc.start(now);
        osc.stop(now + 0.7);
        overtoneOsc.stop(now + 0.3);
      } catch (e) {
        // Audio suspended or blocked by user gesture policy - handle gracefully
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenCharmsAudio;
  } else {
    root.OpenCharmsAudio = OpenCharmsAudio;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);

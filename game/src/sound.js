// Tiny WebAudio sounds drawn from oscillators — no audio files, nothing to load. A card whoosh,
// a hit thud, a chime for healing and a low toll for defeat. M mutes; the first user gesture
// unlocks the AudioContext, as browsers require.

export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      context = new AudioCtor();
    }
    if (context.state === 'suspended') context.resume();
    return context;
  }

  function tone(freqFrom, freqTo, seconds, type, gainPeak, when = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const start = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    get muted() { return muted; },
    playCard() { tone(300, 620, 0.12, 'triangle', 0.12); },
    hit() { tone(160, 60, 0.18, 'sawtooth', 0.16); tone(90, 45, 0.22, 'square', 0.1, 0.02); },
    blocked() { tone(220, 180, 0.1, 'square', 0.1); },
    heal() { tone(520, 880, 0.25, 'sine', 0.12); tone(660, 990, 0.3, 'sine', 0.08, 0.08); },
    turn() { tone(440, 440, 0.07, 'sine', 0.08); tone(587, 587, 0.09, 'sine', 0.08, 0.09); },
    win() { tone(392, 392, 0.16, 'triangle', 0.14); tone(523, 523, 0.16, 'triangle', 0.14, 0.14); tone(659, 784, 0.34, 'triangle', 0.14, 0.28); },
    lose() { tone(330, 110, 0.7, 'sawtooth', 0.12); tone(220, 82, 0.9, 'triangle', 0.1, 0.1); },
  };
}

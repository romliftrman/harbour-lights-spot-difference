// Small WebAudio bleeps, no audio assets: a found difference chimes up, a
// wrong click buzzes low, a hint rings soft, a cleared scene arpeggiates.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context !== null && context.state === 'suspended') context.resume();
    return context;
  }

  function tone(freq, start, duration, type, volume) {
    const ctx = ensure();
    if (ctx === null || muted) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(volume || 0.12, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration + 0.05);
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    unlock() {
      ensure();
    },
    found() {
      tone(660, 0, 0.12, 'sine', 0.14);
      tone(990, 0.09, 0.18, 'sine', 0.12);
    },
    wrong() {
      tone(160, 0, 0.2, 'sawtooth', 0.07);
    },
    hint() {
      tone(880, 0, 0.15, 'triangle', 0.1);
      tone(1174, 0.1, 0.2, 'triangle', 0.08);
    },
    clear() {
      tone(523, 0, 0.14, 'sine', 0.13);
      tone(659, 0.12, 0.14, 'sine', 0.13);
      tone(784, 0.24, 0.22, 'sine', 0.13);
    },
    over() {
      tone(392, 0, 0.2, 'sine', 0.12);
      tone(311, 0.18, 0.3, 'sine', 0.12);
    },
    click() {
      tone(440, 0, 0.06, 'sine', 0.06);
    },
  };
}

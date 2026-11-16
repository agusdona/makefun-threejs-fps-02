let context = null;

export function unlockAudio() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!context) context = new AudioContextClass();
  if (context.state === 'suspended') context.resume();
  return context;
}

function tone({ frequency = 440, endFrequency = frequency, duration = 0.08, type = 'square', gain = 0.12 } = {}) {
  const ctx = unlockAudio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export const audio = {
  shot(category = 'rifle') {
    const low = category === 'sniper' ? 75 : category === 'shotgun' ? 110 : 150;
    tone({ frequency: low * 2.1, endFrequency: low, duration: 0.11, type: 'sawtooth', gain: 0.16 });
  },
  reload() { tone({ frequency: 520, endFrequency: 250, duration: 0.09, type: 'triangle', gain: 0.07 }); },
  footstep() { tone({ frequency: 105, endFrequency: 58, duration: 0.045, type: 'triangle', gain: 0.035 }); },
  beep() { tone({ frequency: 880, endFrequency: 880, duration: 0.12, type: 'sine', gain: 0.08 }); },
  explosion() { tone({ frequency: 95, endFrequency: 28, duration: 0.42, type: 'sawtooth', gain: 0.22 }); },
  stinger(win = true) {
    tone({ frequency: win ? 523 : 220, endFrequency: win ? 784 : 110, duration: 0.5, type: 'triangle', gain: 0.11 });
  },
};

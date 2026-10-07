// Interaction sound effects, synthesized with Web Audio — no asset files.
// Everything is short, low, and quiet so it sits under the rain ambience.

const STORAGE_KEY = 'fd-sfx-muted';
const MASTER_VOLUME = 0.5;

let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = false;
try {
  muted = localStorage.getItem(STORAGE_KEY) === '1';
} catch {}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noise() {
  if (!noiseBuffer) {
    const len = ctx.sampleRate * 0.5;
    noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

// Gain node with a fast attack and exponential decay, routed to master.
function envelope(t, peak, decay, attack = 0.004) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(master);
  return g;
}

function tone(t, { freq, type = 'sine', peak = 0.2, decay = 0.2, glideTo, attack }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t + decay);
  osc.connect(envelope(t, peak, decay, attack));
  osc.start(t);
  osc.stop(t + decay + 0.05);
}

function burst(t, { freq, q = 1, type = 'bandpass', peak = 0.2, decay = 0.05 }) {
  const src = noise();
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  src.connect(filter).connect(envelope(t, peak, decay, 0.002));
  src.start(t, Math.random() * 0.4);
  src.stop(t + decay + 0.05);
}

const SOUNDS = {
  // Soft paper tick when a choice is hovered or focused.
  hover(t) {
    burst(t, { freq: 3200, q: 4, peak: 0.05, decay: 0.025 });
  },
  // Typewriter key strike for picking a choice.
  choose(t) {
    burst(t, { freq: 2400, q: 1.5, peak: 0.35, decay: 0.04 });
    tone(t, { freq: 180, type: 'triangle', peak: 0.12, decay: 0.06 });
  },
  // Red checks are riskier — a heavier, lower strike.
  chooseRed(t) {
    burst(t, { freq: 900, q: 1.2, peak: 0.35, decay: 0.07 });
    tone(t, { freq: 110, type: 'sawtooth', peak: 0.08, decay: 0.18, glideTo: 70 });
  },
  // Two dice clattering on a desk.
  dice(t) {
    for (let i = 0; i < 5; i++) {
      const at = t + i * 0.045 + Math.random() * 0.02;
      burst(at, { freq: 1800 + Math.random() * 1600, q: 6, peak: 0.22 * (1 - i * 0.15), decay: 0.03 });
    }
  },
  success(t) {
    SOUNDS.dice(t);
    tone(t + 0.28, { freq: 523.25, type: 'triangle', peak: 0.14, decay: 0.5 });
    tone(t + 0.36, { freq: 783.99, type: 'triangle', peak: 0.12, decay: 0.7 });
  },
  failure(t) {
    SOUNDS.dice(t);
    tone(t + 0.28, { freq: 233.08, type: 'sawtooth', peak: 0.07, decay: 0.6, glideTo: 196 });
    tone(t + 0.28, { freq: 246.94, type: 'triangle', peak: 0.08, decay: 0.6, glideTo: 207.65 });
  },
  // Low swell for starting the engagement.
  begin(t) {
    tone(t, { freq: 65.41, type: 'sine', peak: 0.35, decay: 1.6, attack: 0.08 });
    tone(t, { freq: 98, type: 'triangle', peak: 0.1, decay: 1.4, attack: 0.12 });
    tone(t + 0.15, { freq: 392, type: 'sine', peak: 0.05, decay: 1.2, attack: 0.2 });
  },
  // Act boundary — a struck bell.
  milestone(t) {
    for (const [f, p] of [[261.63, 0.16], [523.25, 0.08], [659.25, 0.06], [1046.5, 0.03]]) {
      tone(t, { freq: f, type: 'sine', peak: p, decay: 1.8 });
    }
  },
  // Engagement over — a slow falling drone.
  ending(t) {
    tone(t, { freq: 130.81, type: 'sawtooth', peak: 0.06, decay: 2.2, glideTo: 82.41, attack: 0.1 });
    tone(t, { freq: 65.41, type: 'sine', peak: 0.2, decay: 2.4, attack: 0.1 });
  },
  // Small UI click for toggles and dev-panel buttons.
  toggle(t) {
    burst(t, { freq: 4200, q: 3, peak: 0.12, decay: 0.02 });
    tone(t, { freq: 1200, type: 'square', peak: 0.025, decay: 0.03 });
  },
};

let lastHover = 0;

export function play(name, delay = 0) {
  if (muted || !SOUNDS[name]) return;
  const c = audio();
  if (!c) return;
  if (name === 'hover') {
    // Sweeping the mouse across the choice list shouldn't machine-gun.
    if (c.currentTime - lastHover < 0.06) return;
    lastHover = c.currentTime;
  }
  SOUNDS[name](c.currentTime + delay);
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {}
}

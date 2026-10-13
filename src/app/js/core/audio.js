// =============================================================
// ALPHA-Band — Moteur audio (Tone.js 15, bundle vendor ESM)
// -------------------------------------------------------------
// Un canal par piste. Chaque voix est synthétisée (aucun sample
// externe : le projet reste 100 % autonome et hébergeable sur
// GitHub Pages).
//
//   import { audio } from './core/audio.js';
//   await audio.start();                    // sur un geste utilisateur
//   audio.trigger(trackId, time, velocity) // déclenche une piste
// =============================================================

import * as Tone from '/vendor/tone-bundle.js';

// ---------- Voix de base : enveloppe ADSR ----------
function env(attack, decay, sustain, release) {
  return { attack, decay, sustain, release };
}

function makeKick() {
  const amp = new Tone.AmplitudeEnvelope(env(0.001, 0.18, 0, 0.05));
  const pitch = new Tone.FrequencyEnvelope({
    attack: 0.001, decay: 0.12, sustain: 0, release: 0.05,
    baseFrequency: 120, octaves: 3, exponent: 2,
  });
  const osc = new Tone.Oscillator({ type: 'sine', frequency: 60 });
  const click = new Tone.Oscillator({ type: 'triangle', frequency: 1200 });
  const clickGain = new Tone.Gain(0.18);

  osc.chain(pitch, amp);
  click.connect(clickGain).connect(amp);
  osc.start();
  click.start();

  return {
    node: amp,
    trigger(t) {
      pitch.triggerAttackRelease(0.12, t);
      amp.triggerAttackRelease(0.22, t);
      clickGain.gain.setValueAtTime(0.18, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    },
    dispose() { osc.dispose(); click.dispose(); clickGain.dispose(); pitch.dispose(); amp.dispose(); },
  };
}

function makeSnare() {
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: env(0.001, 0.18, 0, 0.05),
    volume: -6,
  });
  const body = new Tone.MembraneSynth({
    pitchDecay: 0.04, octaves: 4,
    envelope: env(0.001, 0.12, 0, 0.04),
  });
  const merger = new Tone.Gain(1);
  noise.connect(merger);
  body.connect(merger);
  return {
    node: merger,
    trigger(t) {
      noise.triggerAttackRelease('16n', t);
      body.triggerAttackRelease('C3', '16n', t);
    },
    dispose() { noise.dispose(); body.dispose(); merger.dispose(); },
  };
}

function makeHat(open = false) {
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: env(0.001, open ? 0.18 : 0.04, 0, 0.03),
    volume: -10,
  });
  const hp = new Tone.Filter(7000, 'highpass');
  noise.connect(hp);
  return {
    node: hp,
    trigger(t) { noise.triggerAttackRelease(open ? '16n' : '32n', t); },
    dispose() { noise.dispose(); hp.dispose(); },
  };
}

function makeBass() {
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: { type: 'lowpass', frequency: 600, Q: 4 },
    envelope: env(0.005, 0.18, 0.4, 0.12),
    filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.2, baseFrequency: 200, octaves: 2.5 },
  });
  return {
    node: synth,
    trigger(t, pitch) { synth.triggerAttackRelease(pitch, '8n', t); },
    dispose() { synth.dispose(); },
  };
}

function makeLead() {
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: env(0.005, 0.18, 0.2, 0.15),
    filterEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.2, baseFrequency: 1500, octaves: 2 },
  });
  return {
    node: synth,
    trigger(t, pitch) { synth.triggerAttackRelease(pitch, '8n', t); },
    dispose() { synth.dispose(); },
  };
}

function makeKeys() {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: env(0.005, 0.4, 0.3, 0.5),
    volume: -8,
  });
  return {
    node: synth,
    trigger(t, pitches) { synth.triggerAttackRelease(pitches, '8n', t); },
    dispose() { synth.dispose(); },
  };
}

function makeBell() {
  const synth = new Tone.FMSynth({
    harmonicity: 3.5, modulationIndex: 12,
    oscillator: { type: 'sine' },
    envelope: env(0.002, 1.4, 0, 0.4),
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 0.2 },
  });
  return {
    node: synth,
    trigger(t, pitch) { synth.triggerAttackRelease(pitch, '4n', t); },
    dispose() { synth.dispose(); },
  };
}

function makePad() {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: env(0.8, 0.4, 0.8, 1.6),
    volume: -14,
  });
  const filter = new Tone.Filter(2000, 'lowpass');
  const chorus = new Tone.Chorus({ frequency: 0.5, delayTime: 3.5, depth: 0.7, wet: 0.4 }).start();
  synth.connect(chorus);
  chorus.connect(filter);
  return {
    node: filter,
    trigger(t, pitches) { synth.triggerAttackRelease(pitches, '1m', t); },
    dispose() { synth.dispose(); filter.dispose(); chorus.dispose(); },
  };
}

function makeRiser() {
  const synth = new Tone.NoiseSynth({
    noise: { type: 'sawtooth' },
    envelope: env(0.8, 0.1, 1, 0.4),
    volume: -14,
  });
  const filter = new Tone.Filter(200, 'bandpass');
  filter.Q.value = 4;
  synth.connect(filter);
  return {
    node: filter,
    trigger(t) {
      filter.frequency.setValueAtTime(200, t);
      filter.frequency.exponentialRampToValueAtTime(8000, t + 1.2);
      synth.triggerAttackRelease('1m', t);
    },
    dispose() { synth.dispose(); filter.dispose(); },
  };
}

function makeImpact() {
  const sub = new Tone.MembraneSynth({
    pitchDecay: 0.6, octaves: 6,
    envelope: env(0.001, 1.4, 0, 0.6),
    volume: -6,
  });
  const noise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: env(0.001, 0.6, 0, 0.3),
    volume: -18,
  });
  const merger = new Tone.Gain(1);
  sub.connect(merger); noise.connect(merger);
  return {
    node: merger,
    trigger(t) {
      sub.triggerAttackRelease('A0', '4n', t);
      noise.triggerAttackRelease('8n', t);
    },
    dispose() { sub.dispose(); noise.dispose(); merger.dispose(); },
  };
}

function makeZap() {
  const synth = new Tone.PluckSynth({ attackNoise: 0.5, dampening: 6000, resonance: 0.95 });
  return {
    node: synth,
    trigger(t) { synth.triggerAttackRelease('C6', '32n', t); },
    dispose() { synth.dispose(); },
  };
}

// presetId → constructeur
const FACTORIES = {
  'kick-808':   makeKick,
  'snare-clap': makeSnare,
  'drum-room':  makeSnare,
  'perc-latin': () => makeHat(false),
  'hat-trance': () => makeHat(true),
  'fx-noise':   () => makeHat(true),
  'bass-sub':   makeBass,
  'bass-funk':  makeBass,
  'bass-acid':  makeLead,
  'bass-reese': makeBass,
  'bass-wobble': makeBass,
  'syn-lead':   makeLead,
  'syn-arp':    makeLead,
  'syn-stab':   makeLead,
  'syn-keys':   makeKeys,
  'syn-bell':   makeBell,
  'pad-strings': makePad,
  'pad-choir':  makePad,
  'pad-glass':  makeKeys,
  'pad-ambient': makePad,
  'pad-warm':   makePad,
  'fx-riser':   makeRiser,
  'fx-down':    makeRiser,
  'fx-impact':  makeImpact,
  'fx-zap':     makeZap,
  'loop-break':  makeKeys,
  'loop-groove': makeBass,
  'loop-pad':    makePad,
  'loop-arp':    makeLead,
  'loop-perc':   makeSnare,
};

// Gammes — toutes les notes jouées restent dans la tonalité du projet (F min).
const MELODY = ['F3', 'Ab3', 'Bb3', 'C4', 'Db4', 'Eb4', 'F4', 'Ab4', 'Bb4', 'C5', 'Db5', 'Eb5'];
const LOWS = ['F1', 'Ab1', 'Bb1', 'C2', 'Db2'];
const CHORDS = [
  ['F2', 'Ab2', 'C3', 'Eb3'],
  ['Db2', 'F2', 'Ab2', 'C3'],
  ['Bb1', 'Db2', 'F2', 'Ab2'],
  ['Eb2', 'G2', 'Bb2', 'Db3'],
];

class AudioEngine {
  constructor() {
    this.available = false;
    this.started = false;
    this.channels = new Map();   // trackId → { voice, vol, pan, pitch, meta }
    this.master = null;
    this.limiter = null;
    this.analyser = null;
    this.metronome = null;
    this._load = 0.18;          // estimation de charge DSP, affichée dans le rack
  }

  /**
   * Démarre le contexte audio. DOIT être appelé depuis un geste utilisateur.
   * En cas d'échec (headless, pas de périphérique), on bascule en mode visuel
   * silencieux — l'interface reste entièrement fonctionnelle.
   */
  async start() {
    if (this.started) return this.available;
    this.started = true;
    try {
      await Promise.race([
        Tone.start(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Tone.start timeout')), 2000)),
      ]);
      this.master = new Tone.Gain(0.85).toDestination();
      this.limiter = new Tone.Limiter(-1).connect(this.master);
      this.analyser = new Tone.Analyser('waveform', 128).connect(this.master);
      this._buildMetronome();
      this.available = true;
    } catch (e) {
      console.warn('[audio] contexte audio indisponible — mode visuel.', e?.message || e);
      this.available = false;
    }
    return this.available;
  }

  _buildMetronome() {
    if (!this.limiter || this.metronome) return;
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.008, octaves: 8,
      envelope: env(0.001, 0.06, 0, 0.02),
      volume: -14,
    }).connect(this.limiter);
    this.metronome = synth;
  }

  click(time, accent = false) {
    if (!this.available || !this.metronome) return;
    try { this.metronome.triggerAttackRelease(accent ? 'C6' : 'C4', '32n', time); } catch { /* noop */ }
  }

  // ---------- Cycle de vie des canaux ----------

  attach(track) {
    this.detach(track.id);
    const pitch = this.pitchFor(track);

    if (!this.available) {
      this.channels.set(track.id, { voice: null, vol: null, pan: null, pitch, meta: this.metaOf(track) });
      return;
    }
    const factory = FACTORIES[track.preset];
    if (!factory) {
      console.warn(`[audio] preset inconnu : ${track.preset}`);
      return;
    }
    try {
      const voice = factory();
      const vol = new Tone.Gain(this.volToGain(track.volume)).connect(this.limiter);
      const pan = new Tone.Pan(track.pan ?? 0).connect(vol);
      voice.node.connect(pan);
      this.channels.set(track.id, { voice, vol, pan, pitch, meta: this.metaOf(track) });
    } catch (e) {
      console.warn(`[audio] échec création voix pour ${track.preset}`, e);
      this.channels.set(track.id, { voice: null, vol: null, pan: null, pitch, meta: this.metaOf(track) });
    }
  }

  attachAll(tracks) { for (const t of tracks) this.attach(t); }

  detach(trackId) {
    const ch = this.channels.get(trackId);
    if (!ch) return;
    try { ch.voice?.dispose?.(); } catch { /* noop */ }
    try { ch.vol?.dispose?.(); } catch { /* noop */ }
    try { ch.pan?.dispose?.(); } catch { /* noop */ }
    this.channels.delete(trackId);
  }

  // ---------- Lecture ----------

  /**
   * Déclenche une piste.
   * @param {string} trackId
   * @param {number} [time]  temps Tone.js (défaut : maintenant)
   * @param {number} [vel]   vélocité 0..1 (swing / humanize)
   */
  trigger(trackId, time = null, vel = 1) {
    const ch = this.channels.get(trackId);
    if (!ch || !ch.voice || !this.available) return;
    if (ch.meta.muted) return;
    if (ch.meta.anySolo && !ch.meta.solo) return;
    try {
      const t = time == null ? Tone.now() : time;
      ch.voice.trigger(t, ch.pitch, vel);
    } catch { /* noop */ }
  }

  /** Aperçu d'un preset depuis la bibliothèque (sans piste). */
  preview(presetId) {
    if (!this.available || !this.limiter) return false;
    const factory = FACTORIES[presetId];
    if (!factory) return false;
    try {
      const voice = factory();
      const g = new Tone.Gain(0.7).connect(this.limiter);
      voice.node.connect(g);
      const t = Tone.now();
      voice.trigger(t, 'F3', 1);
      setTimeout(() => { try { voice.dispose(); g.dispose(); } catch { /* noop */ } }, 2500);
      return true;
    } catch { return false; }
  }

  // ---------- Mélange ----------

  setVolume(trackId, v) {
    const ch = this.channels.get(trackId);
    if (!ch?.vol) return;
    try { ch.vol.gain.rampTo(this.volToGain(Math.max(0, Math.min(1, v))), 0.04); } catch { /* noop */ }
  }

  setPan(trackId, v) {
    const ch = this.channels.get(trackId);
    if (!ch?.pan) return;
    try { ch.pan.pan.rampTo(Math.max(-1, Math.min(1, v)), 0.04); } catch { /* noop */ }
  }

  setMaster(v) {
    if (!this.master) return;
    try { this.master.gain.rampTo(Math.max(0, Math.min(1, v)) ** 1.4, 0.05); } catch { /* noop */ }
  }

  /** Synchronise l'état de mute/solo sans recréer les voix. */
  syncFlags(tracks) {
    const anySolo = tracks.some((t) => t.solo);
    for (const t of tracks) {
      const ch = this.channels.get(t.id);
      if (!ch) continue;
      ch.meta.muted = !!t.muted;
      ch.meta.solo = !!t.solo;
      ch.meta.anySolo = anySolo;
      const audible = !t.muted && (!anySolo || t.solo);
      ch.meta.audible = audible;
      if (ch.vol) {
        try {
          ch.vol.gain.rampTo(audible ? this.volToGain(t.volume) : 0, 0.04);
        } catch { /* noop */ }
      }
    }
  }

  /** Crée un canal pour une piste ajoutée à chaud. */
  adopt(track) { this.attach(track); }

  volToGain(v) {
    if (v <= 0.001) return 0;
    return v ** 1.4 * 0.9;
  }

  metaOf(track) {
    return { muted: !!track.mute, solo: !!track.solo, anySolo: false, audible: true };
  }

  /** Note stable dérivée de l'id — mélodies toujours justes. */
  pitchFor(track) {
    let h = 0;
    for (const c of track.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    if (track.cat === 'bass') return LOWS[h % LOWS.length];
    if (track.cat === 'pad') return CHORDS[h % CHORDS.length];
    return MELODY[h % MELODY.length];
  }

  // ---------- Métriques ----------

  /** Forme d'onde crête 0..1 — alimente les vumètres. */
  peak() {
    if (!this.analyser) return 0;
    try {
      const buf = this.analyser.getValue();
      let max = 0;
      for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
      return max;
    } catch { return 0; }
  }

  get load() { return this._load; }

  dispose() {
    for (const id of [...this.channels.keys()]) this.detach(id);
    try { this.metronome?.dispose(); } catch { /* noop */ }
    try { this.analyser?.dispose(); } catch { /* noop */ }
    try { this.limiter?.dispose(); } catch { /* noop */ }
    try { this.master?.dispose(); } catch { /* noop */ }
    this.metronome = this.analyser = this.limiter = this.master = null;
    this.available = false;
    this.started = false;
  }
}

export const audio = new AudioEngine();
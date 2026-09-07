// =============================================================
// ALPHA-Band — Audio engine (Tone.js)
// -------------------------------------------------------------
// Expose une classe `AudioEngine` qui :
//   - crée un canal Tone.js par preset (kick, snare, bass, lead, pad, hat, fx)
//   - fournit une API unique : `trigger(trackId, time)`
//   - contrôle volume / mute / solo réels
//   - expose un callback `onStep(step, trackIds)` pour l'UI (playhead, cell pulse, meters)
//
// Pattern : on n'utilise PAS Tone.Transport pour le séquençage pas-à-pas.
// On utilise un setInterval piloté par le BPM (16e note) côté JS, ce qui
// garde un contrôle simple et déterministe, et permet de re-synchroniser
// l'audio Tone.js à `Tone.now()` pour chaque hit.
// =============================================================

// Import absolu depuis la racine du serveur (compatible GitHub Pages).
// Évite les problèmes de résolution d'imports relatifs `../` avec
// python -m http.server (le navigateur résout depuis l'origine).
import * as Tone from '/vendor/tone-bundle.js';

// ---------- Helpers : couleurs par cat pour l'UI (ré-export) ----------
export const CAT_COLOR = {
  drums: '#ef6c4d',
  bass:  '#3b82f6',
  synth: '#8b5cf6',
  pad:   '#14b8a6',
  fx:    '#f59e0b',
};

// ---------- Définition des voix (preset → factory Tone.js) ----------
// Chaque voix retourne { trigger(time), releaseAll() }.
// On évite les samples externes (limites GitHub Pages + pas d'audio à bundler).
// Tous les sons sont synthétisés.

function envelope(amp, opts = {}) {
  return {
    attack:  opts.attack ?? 0.001,
    decay:   opts.decay ?? 0.1,
    sustain: opts.sustain ?? 0.0,
    release: opts.release ?? 0.05,
  };
}

function makeKick() {
  // Kick 808 : sine sub + click, pitch envelope descendant.
  const env = new Tone.AmplitudeEnvelope(envelope(1, { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 }));
  const pitchEnv = new Tone.FrequencyEnvelope({
    attack: 0.001, decay: 0.12, sustain: 0, release: 0.05,
    baseFrequency: 120, octaves: 3, exponent: 2,
  });
  const osc = new Tone.Oscillator({ type: 'sine', frequency: 60 });
  const click = new Tone.Oscillator({ type: 'triangle', frequency: 1200 });
  const clickGain = new Tone.Gain(0.18);
  osc.chain(pitchEnv, env);
  click.connect(clickGain).connect(env);
  osc.start(); click.start();
  return {
    node: env,
    trigger(time) {
      pitchEnv.triggerAttackRelease(0.12, time);
      env.triggerAttackRelease(0.22, time);
      clickGain.gain.setValueAtTime(0.18, time);
      clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    },
    dispose() { osc.dispose(); click.dispose(); clickGain.dispose(); pitchEnv.dispose(); env.dispose(); },
  };
}

function makeSnare() {
  // Snare : noise + body tone, decay court.
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    volume: -6,
  });
  const body = new Tone.MembraneSynth({
    pitchDecay: 0.04, octaves: 4,
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 },
  });
  // Mix
  const merger = new Tone.Gain(1);
  noise.connect(merger);
  body.connect(merger);
  return {
    node: merger,
    trigger(time) {
      noise.triggerAttackRelease('16n', time);
      body.triggerAttackRelease('C3', '16n', time);
    },
    dispose() { noise.dispose(); body.dispose(); merger.dispose(); },
  };
}

function makeHat(open = false) {
  // Hi-hat : filtered noise, decay court/long selon open/closed.
  const noise = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: open ? 0.18 : 0.04, sustain: 0, release: 0.03 },
    volume: -10,
  });
  const hp = new Tone.Filter(7000, 'highpass');
  noise.connect(hp);
  return {
    node: hp,
    trigger(time) {
      noise.triggerAttackRelease(open ? '16n' : '32n', time);
    },
    dispose() { noise.dispose(); hp.dispose(); },
  };
}

function makeBass() {
  // Bass sub : saw filtré, glide léger.
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: { type: 'lowpass', frequency: 600, Q: 4 },
    envelope: { attack: 0.005, decay: 0.18, sustain: 0.4, release: 0.12 },
    filterEnvelope: { attack: 0.005, decay: 0.2, sustain: 0.3, release: 0.2, baseFrequency: 200, octaves: 2.5 },
  });
  return {
    node: synth,
    trigger(time, pitch = 'A1') {
      synth.triggerAttackRelease(pitch, '8n', time);
    },
    dispose() { synth.dispose(); },
  };
}

function makeLead() {
  // Lead synth : triangle, envelope ADSR piquée.
  const synth = new Tone.MonoSynth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.18, sustain: 0.2, release: 0.15 },
    filterEnvelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.2, baseFrequency: 1500, octaves: 2 },
  });
  return {
    node: synth,
    trigger(time, pitch = 'C4') {
      synth.triggerAttackRelease(pitch, '8n', time);
    },
    dispose() { synth.dispose(); },
  };
}

function makeKeys() {
  // Keys Rhodes : sine + slight FM, attack doux.
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.3, release: 0.5 },
    volume: -8,
  });
  return {
    node: synth,
    trigger(time, pitches = ['C4']) {
      synth.triggerAttackRelease(pitches, '8n', time);
    },
    dispose() { synth.dispose(); },
  };
}

function makeBell() {
  // Bell FM : carrier + mod, decay long.
  const synth = new Tone.FMSynth({
    harmonicity: 3.5,
    modulationIndex: 12,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 1.4, sustain: 0, release: 0.4 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 0.2 },
  });
  return {
    node: synth,
    trigger(time, pitch = 'C5') {
      synth.triggerAttackRelease(pitch, '4n', time);
    },
    dispose() { synth.dispose(); },
  };
}

function makePad() {
  // Pad : polysynth sine + chorus léger, sustain long.
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.8, decay: 0.4, sustain: 0.8, release: 1.6 },
    volume: -14,
  });
  const filter = new Tone.Filter(2000, 'lowpass');
  const chorus = new Tone.Chorus({ frequency: 0.5, delayTime: 3.5, depth: 0.7, wet: 0.4 }).start();
  synth.connect(chorus);
  chorus.connect(filter);
  return {
    node: filter,
    trigger(time, pitches = ['C3', 'G3', 'C4', 'E4']) {
      synth.triggerAttackRelease(pitches, '1m', time);
    },
    dispose() { synth.dispose(); filter.dispose(); chorus.dispose(); },
  };
}

function makeRiser() {
  // Riser : saw ascendant + filter sweep, déclenché long.
  const synth = new Tone.NoiseSynth({
    noise: { type: 'sawtooth' },
    envelope: { attack: 0.8, decay: 0.1, sustain: 1, release: 0.4 },
    volume: -14,
  });
  const filter = new Tone.Filter(200, 'bandpass').toDestination();
  filter.Q.value = 4;
  synth.connect(filter);
  return {
    node: filter,
    trigger(time) {
      filter.frequency.setValueAtTime(200, time);
      filter.frequency.exponentialRampToValueAtTime(8000, time + 1.2);
      synth.triggerAttackRelease('1m', time);
    },
    dispose() { synth.dispose(); filter.dispose(); },
  };
}

function makeImpact() {
  // Impact ciné : sub sine très basse + noise burst.
  const sub = new Tone.MembraneSynth({
    pitchDecay: 0.6, octaves: 6,
    envelope: { attack: 0.001, decay: 1.4, sustain: 0, release: 0.6 },
    volume: -6,
  });
  const noise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.3 },
    volume: -18,
  });
  const merger = new Tone.Gain(1);
  sub.connect(merger); noise.connect(merger);
  return {
    node: merger,
    trigger(time) {
      sub.triggerAttackRelease('A0', '4n', time);
      noise.triggerAttackRelease('8n', time);
    },
    dispose() { sub.dispose(); noise.dispose(); merger.dispose(); },
  };
}

function makeZap() {
  // Zap court : square très court + pitch down.
  const synth = new Tone.PluckSynth({ attackNoise: 0.5, dampening: 6000, resonance: 0.95 });
  return {
    node: synth,
    trigger(time) {
      synth.triggerAttackRelease('C6', '32n', time);
    },
    dispose() { synth.dispose(); },
  };
}

// ---------- Mapping preset → factory ----------
const PRESET_FACTORIES = {
  // Drums
  'kick-808':   { factory: makeKick, kind: 'drums' },
  'snare-clap': { factory: makeSnare, kind: 'drums' },
  'hat-trance': { factory: () => makeHat(true), kind: 'drums' },
  'perc-latin': { factory: () => makeHat(false), kind: 'drums' }, // approximation
  'drum-room':  { factory: makeSnare, kind: 'drums' },
  // Bass
  'bass-sub':   { factory: makeBass,  kind: 'bass' },
  'bass-funk':  { factory: makeBass,  kind: 'bass' },
  'bass-acid':  { factory: makeLead,  kind: 'bass' }, // approximation acid
  'bass-reese': { factory: makeBass,  kind: 'bass' },
  'bass-wobble':{ factory: makeBass,  kind: 'bass' },
  // Synth
  'syn-lead':   { factory: makeLead,  kind: 'synth' },
  'syn-keys':   { factory: makeKeys,  kind: 'synth' },
  'syn-arp':    { factory: makeLead,  kind: 'synth' },
  'syn-bell':   { factory: makeBell,  kind: 'synth' },
  'syn-stab':   { factory: makeLead,  kind: 'synth' },
  // Pad
  'pad-strings':{ factory: makePad,   kind: 'pad' },
  'pad-choir':  { factory: makePad,   kind: 'pad' },
  'pad-glass':  { factory: makeKeys,  kind: 'pad' },
  'pad-ambient':{ factory: makePad,   kind: 'pad' },
  'pad-warm':   { factory: makePad,   kind: 'pad' },
  // FX
  'fx-riser':   { factory: makeRiser,  kind: 'fx' },
  'fx-down':    { factory: makeRiser,  kind: 'fx' }, // approximation
  'fx-impact':  { factory: makeImpact, kind: 'fx' },
  'fx-noise':   { factory: () => makeHat(true), kind: 'fx' },
  'fx-zap':     { factory: makeZap,    kind: 'fx' },
};

// Notes utilisées pour la pitch des leads/bass (gamme pentatonique A min)
// → tous les sons joués restent musicaux.
const PENTATONIC_A_MIN = ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
const BASS_NOTES      = ['A1', 'C2', 'D2', 'E2', 'G2'];

// ---------- Moteur ----------
export class AudioEngine {
  constructor() {
    this.ready = false;
    this.channels = new Map(); // trackId → { voice, volume, muted, solo, preset, kind }
    this.masterGain = null;
    this.bpm = 120;
    this._onStep = null; // callback(stepIndex: int)
  }

  /**
   * Initialise le contexte audio (à appeler sur premier user gesture).
   * Robuste face aux environnements sans audio (headless, sandbox) :
   * on wrappe Tone.start() dans un timeout pour ne pas bloquer le transport.
   * On ne crée le masterGain que si le contexte a effectivement démarré.
   */
  async init() {
    if (this.ready) return;
    let started = false;
    try {
      await Promise.race([
        Tone.start(),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Tone.start timeout')), 1500)),
      ]);
      started = true;
    } catch (e) {
      // Pas d'audio dispo (headless, sandbox, pas de périph) — on continue en mode visuel
      console.warn('[audio] Tone.start a échoué ou timeout, mode visuel uniquement', e?.message || e);
    }
    if (started) {
      try {
        this.masterGain = new Tone.Gain(0.85).toDestination();
      } catch (e) {
        this.masterGain = null;
      }
    }
    this.ready = true;
  }

  /**
   * Crée (ou remplace) la voix associée à une piste.
   * Si Tone n'est pas dispo, on enregistre juste les métadonnées (mode visuel).
   */
  attach(track) {
    // Si déjà attachée, on libère l'ancienne
    this.detach(track.id);
    if (!this.masterGain) {
      // Tone non disponible — on garde juste les métadonnées pour l'UI.
      this.channels.set(track.id, {
        voice: null, vol: null, preset: track.preset, kind: track.cat,
        muted: !!track.muted, solo: !!track.solo,
        pitch: this._pickPitch(track, track.id),
        pitchPattern: this._pickPitchPattern(track),
      });
      return;
    }
    const preset = PRESET_FACTORIES[track.preset];
    if (!preset) {
      console.warn(`[audio] preset inconnu: ${track.preset}`);
      return;
    }
    try {
      const voice = preset.factory();
      // Volume channel (Tone.Gain) → master
      const vol = new Tone.Gain(this._volToGain(track.volume));
      vol.connect(this.masterGain);
      voice.node.connect(vol);
      this.channels.set(track.id, {
        voice, vol, preset: track.preset, kind: preset.kind,
        muted: !!track.muted, solo: !!track.solo,
        pitch: this._pickPitch(track, track.id),
        pitchPattern: this._pickPitchPattern(track),
      });
    } catch (e) {
      console.warn(`[audio] échec création voix pour ${track.preset}`, e);
      this.channels.set(track.id, {
        voice: null, vol: null, preset: track.preset, kind: track.cat,
        muted: !!track.muted, solo: !!track.solo,
        pitch: this._pickPitch(track, track.id),
        pitchPattern: this._pickPitchPattern(track),
      });
    }
  }

  /**
   * Libère la voix d'une piste.
   */
  detach(trackId) {
    const ch = this.channels.get(trackId);
    if (!ch) return;
    try { ch.voice?.dispose?.(); } catch (e) {}
    try { ch.vol?.dispose?.(); } catch (e) {}
    this.channels.delete(trackId);
  }

  /**
   * Déclenche le son d'une piste au temps Tone.js donné.
   * `time` = null → maintenant.
   */
  trigger(trackId, time = null) {
    const ch = this.channels.get(trackId);
    if (!ch) return;
    if (this._isSilenced(ch)) return;
    if (!ch.voice) return; // Tone pas dispo
    try {
      const t = (time == null) ? Tone.now() : time;
      ch.voice.trigger(t, ch.pitch);
    } catch (e) { /* silencieux */ }
  }

  /**
   * Déclenche une voix pad sur une longue durée (1 mesure).
   */
  triggerPadHold(trackId, time = null) {
    const ch = this.channels.get(trackId);
    if (!ch) return;
    if (this._isSilenced(ch)) return;
    if (!ch.voice) return;
    try {
      const t = (time == null) ? Tone.now() : time;
      ch.voice.trigger(t, ch.pitchPattern);
    } catch (e) { /* silencieux */ }
  }

  /**
   * Met à jour le volume réel (0..1 linéaire).
   */
  setVolume(trackId, v) {
    const ch = this.channels.get(trackId);
    if (!ch || !ch.vol) return;
    v = Math.max(0, Math.min(1, v));
    try { ch.vol.gain.rampTo(this._volToGain(v), 0.04); } catch (e) {}
  }

  setMute(trackId, muted) {
    const ch = this.channels.get(trackId);
    if (ch) ch.muted = !!muted;
  }

  setSolo(trackId, solo) {
    const ch = this.channels.get(trackId);
    if (ch) ch.solo = !!solo;
  }

  /**
   * Détermine si une piste doit être silencée en tenant compte des solos.
   */
  _isSilenced(ch) {
    if (ch.muted) return true;
    // Si une autre piste est en solo, cette voix est muette.
    const hasAnySolo = [...this.channels.values()].some(c => c.solo);
    if (hasAnySolo && !ch.solo) return true;
    return false;
  }

  _volToGain(v) {
    // Courbe logarithmique approx (0..1 → -∞..+6dB) → mieux à l'oreille.
    if (v <= 0.001) return 0;
    return Math.pow(v, 1.4) * 0.9;
  }

  _pickPitch(track, trackId) {
    // Index déterministe depuis l'id pour stabilité entre re-attaches.
    const seed = [...trackId].reduce((a, c) => a + c.charCodeAt(0), 0);
    const idx = seed % (track.cat === 'bass' ? BASS_NOTES.length : PENTATONIC_A_MIN.length);
    return track.cat === 'bass' ? BASS_NOTES[idx] : PENTATONIC_A_MIN[idx];
  }

  _pickPitchPattern(track) {
    // Pad : accords simples (3-4 notes d'un accord tonal).
    const seed = [...track.id].reduce((a, c) => a + c.charCodeAt(0), 0);
    const chords = [
      ['C3', 'G3', 'C4', 'E4'],
      ['A2', 'E3', 'A3', 'C4'],
      ['F2', 'C3', 'F3', 'A3'],
      ['D2', 'A2', 'D3', 'F3'],
      ['G2', 'D3', 'G3', 'B3'],
      ['E2', 'B2', 'E3', 'G3'],
    ];
    return chords[seed % chords.length];
  }

  /**
   * Cleanup global (à appeler sur unload).
   */
  dispose() {
    for (const id of [...this.channels.keys()]) this.detach(id);
    if (this.masterGain) { try { this.masterGain.dispose(); } catch (e) {} }
    this.masterGain = null;
    this.ready = false;
  }
}
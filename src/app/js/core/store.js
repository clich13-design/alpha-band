// =============================================================
// ALPHA-Band — État projet (store pub/sub)
// -------------------------------------------------------------
// Source unique de vérité partagée par le transport, la sidebar,
// le séquenceur, l'arrangement et le mixer. Persisté en localStorage.
// =============================================================

import { hashSeed } from './dom.js';

const STORAGE_KEY = 'alpha-band:project:v1';

// ---------- Palette du design system ----------
export const PALETTE = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#3b82f6', '#f87171'];

// ---------- Catalogue d'instruments (bibliothèque) ----------
export const CATEGORIES = [
  { id: 'all',   label: 'Tout',   icon: 'album' },
  { id: 'drums', label: 'Drums',  icon: 'album' },
  { id: 'bass',  label: 'Bass',   icon: 'graphic_eq' },
  { id: 'synth', label: 'Synth',  icon: 'piano' },
  { id: 'fx',    label: 'FX',     icon: 'auto_awesome' },
  { id: 'loops', label: 'Loops',  icon: 'loop' },
];

export const LIBRARY = [
  // Drums
  { id: 'kick-808',    name: 'Kick 808',      cat: 'drums', preset: 'kick-808',    bpm: 124, scale: 'Minor', mode: 'One-Shot',  kit: 'ALPHA Analog 909 Vintage' },
  { id: 'snare-clap',  name: 'Rimshot 707',   cat: 'drums', preset: 'snare-clap',  bpm: 128, scale: 'Minor', mode: 'One-Shot',  kit: 'Neon Tape Kit' },
  { id: 'hat-trance',  name: 'Hat Trance 16', cat: 'drums', preset: 'hat-trance',  bpm: 132, scale: 'Minor', mode: 'One-Shot',  kit: 'Neon Tape Kit' },
  { id: 'drum-room',   name: 'Room Crumple',  cat: 'drums', preset: 'drum-room',   bpm: 120, scale: 'Minor', mode: 'One-Shot',  kit: 'ALPHA Analog 909 Vintage' },
  { id: 'perc-latin',  name: 'Perc Latin',    cat: 'drums', preset: 'perc-latin',  bpm: 118, scale: 'Minor', mode: 'One-Shot',  kit: 'Cumbia Box' },
  // Bass
  { id: 'bass-sub',    name: 'Sub Bass',      cat: 'bass',  preset: 'bass-sub',    bpm: 124, scale: 'Minor', mode: 'Monophonic', kit: 'Deep End' },
  { id: 'bass-funk',   name: 'Funk Bass',     cat: 'bass',  preset: 'bass-funk',   bpm: 104, scale: 'Minor', mode: 'Monophonic', kit: 'Neon Tape Kit' },
  { id: 'bass-acid',   name: 'Acid Line',     cat: 'bass',  preset: 'bass-acid',   bpm: 128, scale: 'Minor', mode: 'Monophonic', kit: '303 Rave' },
  { id: 'bass-reese',  name: 'Reese Growl',   cat: 'bass',  preset: 'bass-reese',  bpm: 140, scale: 'Minor', mode: 'Monophonic', kit: '303 Rave' },
  { id: 'bass-wobble', name: 'Wobble Bass',   cat: 'bass',  preset: 'bass-wobble', bpm: 126, scale: 'Minor', mode: 'Monophonic', kit: 'Deep End' },
  // Synth
  { id: 'syn-lead',    name: 'Juno Lead',     cat: 'synth', preset: 'syn-lead',    bpm: 124, scale: 'Minor', mode: 'Poly',     kit: 'Juno Suite' },
  { id: 'syn-keys',    name: 'Rhodes Keys',   cat: 'synth', preset: 'syn-keys',    bpm: 90,  scale: 'Minor', mode: 'Poly',     kit: 'Late Night Keys' },
  { id: 'syn-arp',     name: 'Arp Cascade',   cat: 'synth', preset: 'syn-arp',     bpm: 124, scale: 'Minor', mode: 'Poly',     kit: 'Juno Suite' },
  { id: 'syn-bell',    name: 'FM Bell',       cat: 'synth', preset: 'syn-bell',    bpm: 110, scale: 'Minor', mode: 'Poly',     kit: 'Digital Rain' },
  { id: 'syn-stab',    name: 'Stab Chords',   cat: 'synth', preset: 'syn-stab',    bpm: 122, scale: 'Minor', mode: 'Poly',     kit: 'Late Night Keys' },
  // FX
  { id: 'fx-riser',    name: 'Riser Sweep',   cat: 'fx',    preset: 'fx-riser',    bpm: 128, scale: 'Minor', mode: 'One-Shot',  kit: 'Transitions' },
  { id: 'fx-impact',   name: 'Sub Impact',    cat: 'fx',    preset: 'fx-impact',   bpm: 80,  scale: 'Minor', mode: 'One-Shot',  kit: 'Transitions' },
  { id: 'fx-zap',      name: 'Laser Zap',     cat: 'fx',    preset: 'fx-zap',      bpm: 140, scale: 'Minor', mode: 'One-Shot',  kit: 'Transitions' },
  { id: 'fx-noise',    name: 'Noise Wash',    cat: 'fx',    preset: 'fx-noise',    bpm: 100, scale: 'Minor', mode: 'One-Shot',  kit: 'Transitions' },
  { id: 'fx-down',     name: 'Downlifter',    cat: 'fx',    preset: 'fx-down',     bpm: 128, scale: 'Minor', mode: 'One-Shot',  kit: 'Transitions' },
  // Loops
  { id: 'loop-break',  name: 'Break Loop 90', cat: 'loops', preset: 'loop-break',  bpm: 90,  scale: 'Minor', mode: 'Loop',     kit: 'Broken Pack' },
  { id: 'loop-groove', name: 'Groove 124',    cat: 'loops', preset: 'loop-groove', bpm: 124, scale: 'Minor', mode: 'Loop',     kit: 'Broken Pack' },
  { id: 'loop-pad',    name: 'Pad Atmos 120', cat: 'loops', preset: 'loop-pad',    bpm: 120, scale: 'Minor', mode: 'Loop',     kit: 'Ambient Tape' },
  { id: 'loop-arp',    name: 'Arp Loop 128',  cat: 'loops', preset: 'loop-arp',    bpm: 128, scale: 'Minor', mode: 'Loop',     kit: 'Digital Rain' },
  { id: 'loop-perc',   name: 'Perc Loop 118', cat: 'loops', preset: 'loop-perc',   bpm: 118, scale: 'Minor', mode: 'Loop',     kit: 'Cumbia Box' },
];

export function lookupPreset(id) {
  return LIBRARY.find((p) => p.id === id);
}

// ---------- Pistes par défaut ----------
export const DEFAULT_TRACKS = [
  { id: 't-kick',  name: 'Kick',  preset: 'kick-808',    cat: 'drums', kind: 'DRUM',  volume: 0.85, pan: 0,    mute: false, solo: false, inserts: ['EQ 3-Band', 'Compressor', 'Reverb'] },
  { id: 't-snare', name: 'Snare', preset: 'snare-clap',  cat: 'drums', kind: 'DRUM',  volume: 0.78, pan: 0,    mute: false, solo: false, inserts: ['EQ 3-Band', 'Reverb Plate', 'Compressor', 'Gate'] },
  { id: 't-bass',  name: 'Bass',  preset: 'bass-sub',    cat: 'bass',  kind: 'SYNTH', volume: 0.70, pan: 0,    mute: false, solo: false, inserts: ['Sub Filter', 'Compressor', 'Overdrive', 'EQ 3-Band'] },
  { id: 't-pad',   name: 'Pad',   preset: 'pad-strings', cat: 'synth', kind: 'SYNTH', volume: 0.55, pan: -0.18, mute: false, solo: false, inserts: ['Chorus Lush', 'Space Reverb', 'EQ 3-Band'] },
  { id: 't-lead',  name: 'Lead',  preset: 'syn-lead',    cat: 'synth', kind: 'SYNTH', volume: 0.65, pan: 0.24, mute: false, solo: false, inserts: ['Tape Echo', 'EQ 3-Band', 'Compressor', 'Phaser'] },
  { id: 't-fx',    name: 'FX',    preset: 'fx-riser',    cat: 'fx',    kind: 'RETURN', volume: 0.45, pan: 0, mute: false, solo: false, inserts: ['Grain Shifter', 'Delay Tape', 'Compressor', 'Sidechain'] },
];

export const STEP_COUNT = 16;

// ---------- Motifs de démonstration (1 = plein, 0.55 = fantôme) ----------
const SEEDS = {
  A: {
    't-kick':  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0.55, 0, 1, 0, 0, 0],
    't-snare': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    't-bass':  [1, 0, 0, 0, 0.6, 0, 1, 0, 1, 0, 0, 0, 0.6, 0, 1, 0],
    't-pad':   [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    't-lead':  [0, 0, 0, 0.55, 0, 0, 1, 0, 0, 0, 0, 0.55, 0, 0, 1, 0],
    't-fx':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  B: {
    't-kick':  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    't-snare': [0, 0, 0, 0, 1, 0, 0, 0.55, 0, 0, 1, 0, 0, 0, 0.55, 0],
    't-bass':  [1, 0, 0.55, 0, 0, 0, 0, 0, 1, 0, 0.55, 0, 0, 0, 0, 0],
    't-pad':   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    't-lead':  [0, 0.55, 0, 0, 0, 0.55, 0, 0, 0, 0.55, 0, 0, 0, 0.55, 0, 0],
    't-fx':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  C: {
    't-kick':  [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    't-snare': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    't-bass':  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    't-pad':   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    't-lead':  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    't-fx':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  D: {
    't-kick':  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    't-snare': [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    't-bass':  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    't-pad':   [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    't-lead':  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    't-fx':    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

function emptyPattern() {
  const p = {};
  for (const t of DEFAULT_TRACKS) p[t.id] = new Array(STEP_COUNT).fill(0);
  return p;
}

function buildPatterns() {
  const out = {};
  for (const key of ['A', 'B', 'C', 'D']) out[key] = SEEDS[key] ? structuredClone(SEEDS[key]) : emptyPattern();
  return out;
}

// ---------- Clips d'arrangement (barres de départ en 1/16) ----------
const ARRANGEMENT_SEED = [
  { track: 't-kick',  start: 0,  len: 32, label: 'Kick + Sub Pattern' },
  { track: 't-kick',  start: 48, len: 16, label: 'Kick Fill' },
  { track: 't-snare', start: 16, len: 32, label: 'Snare Backbeat' },
  { track: 't-bass',  start: 32, len: 32, label: 'Bassline A' },
  { track: 't-pad',   start: 64, len: 32, label: 'Pad Atmosphere' },
  { track: 't-lead',  start: 16, len: 16, label: 'Lead Stabs' },
  { track: 't-fx',    start: 92, len: 8,  label: 'Transition Sweep' },
];

function buildClips() {
  return ARRANGEMENT_SEED.map((c, i) => ({ id: `c${i}`, ...c }));
}

// ---------- État initial ----------
function initialState() {
  return {
    project: 'Midnight Horizon',
    bpm: 124,
    swing: 54,          // % — 50 = droit
    humanize: 12,       // % de variation de vélocité
    length: STEP_COUNT,
    pattern: 'A',
    patterns: buildPatterns(),
    trackDefs: DEFAULT_TRACKS.map((t, i) => ({
      ...t,
      color: PALETTE[i % PALETTE.length],
      index: i + 1,
    })),
    clips: buildClips(),
    bars: 8,
    masterVolume: 0.85,
    playing: false,
    recording: false,
    loop: true,
    metronome: false,
    selectedTrackId: 't-kick',
    step: 0,
  };
}

// ---------- Store ----------
class Store {
  constructor() {
    this.state = this.#load() || initialState();
    this.listeners = new Map();
    this.#seedMissing();
  }

  // --- persistance ---
  #load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Les patterns sont reconstruits depuis les seeds si absents.
      return parsed?.trackDefs ? parsed : null;
    } catch {
      return null;
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* quota ou mode privé — on ignore */
    }
  }

  reset() {
    this.state = initialState();
    this.save();
    this.emit('reset', {});
  }

  // Garantit que chaque piste a bien une entrée dans le pattern courant.
  #seedMissing() {
    for (const key of ['A', 'B', 'C', 'D']) {
      this.state.patterns[key] ||= emptyPattern();
      for (const t of this.state.trackDefs) {
        this.state.patterns[key][t.id] ||= new Array(this.state.length).fill(0);
        // Harmonise la longueur (32 pas si l'utilisateur a élargi).
        const cur = this.state.patterns[key][t.id];
        if (cur.length !== this.state.length) {
          const next = new Array(this.state.length).fill(0);
          cur.slice(0, this.state.length).forEach((v, i) => (next[i] = v));
          this.state.patterns[key][t.id] = next;
        }
      }
    }
  }

  // --- pub/sub ---
  on(evt, fn) {
    if (!this.listeners.has(evt)) this.listeners.set(evt, new Set());
    this.listeners.get(evt).add(fn);
    return () => this.listeners.get(evt).delete(fn);
  }

  emit(evt, payload) {
    for (const fn of this.listeners.get(evt) ?? []) fn(payload, this.state);
    for (const fn of this.listeners.get('*') ?? []) fn({ evt, payload }, this.state);
  }

  // --- sélecteurs ---
  get tracks() { return this.state.trackDefs; }
  get currentPattern() { return this.state.patterns[this.state.pattern]; }

  track(id) { return this.state.trackDefs.find((t) => t.id === id); }
  steps(trackId, patternKey = this.state.pattern) {
    return this.state.patterns[patternKey][trackId];
  }

  // --- mutations ---
  toggleStep(trackId, index) {
    const row = this.steps(trackId);
    row[index] = row[index] ? 0 : 1;
    this.save();
    this.emit('step', { trackId, index, value: row[index] });
    return row[index];
  }

  /** Valeur absolue : 0, 1 (plein) ou 0.55 (fantôme). */
  setStepValue(trackId, index, value) {
    this.steps(trackId)[index] = value;
    this.save();
    this.emit('step', { trackId, index, value });
  }

  setTrack(trackId, patch, evt = 'track') {
    const t = this.track(trackId);
    if (!t) return;
    Object.assign(t, patch);
    this.save();
    this.emit(evt, { trackId, patch });
  }

  set(key, value, evt = 'state') {
    this.state[key] = value;
    this.save();
    this.emit(evt, { key, value });
  }

  /** Solo exclusif : si une piste est solo, toutes les autres s'éteignent. */
  hasSolo(trackId) {
    const any = this.state.trackDefs.some((t) => t.solo);
    return any ? this.track(trackId).solo : true;
  }

  /** 0..1 → dB */
  toDb(v) { return v <= 0.0001 ? -Infinity : 20 * Math.log10(v); }
  fromDb(db) { return db === -Infinity ? 0 : Math.pow(10, db / 20); }

  /** Graine stable d'une piste — sert aux waveforms déterministes. */
  seedOf(trackId) { return hashSeed(trackId); }
}

export const store = new Store();
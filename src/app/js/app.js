// =============================================================
// ALPHA-Band — Orchestrateur
// -------------------------------------------------------------
// Assemble transport + sidebar + vue (arrangement ou séquenceur)
// + mixer, pilote l'horloge du séquenceur et le routage clavier.
//
//   startApp({ view: 'sequencer' })
// =============================================================

import { el, $ } from './core/dom.js';
import { store, PALETTE, lookupPreset } from './core/store.js';
import { audio } from './core/audio.js';

import { createTransport } from './modules/transport.js';
import { createSidebar } from './modules/sidebar.js';
import { createSequencer } from './modules/sequencer.js';
import { createArrangement } from './modules/arrangement.js';
import { createMixerRack, createMixerMini } from './modules/mixer.js';

// -------------------------------------------------------------
// Horloge du séquenceur
// -------------------------------------------------------------
// Pilotée par un minuteur calé sur le BPM, resynchronisée sur
// Tone.now() à chaque pas : simple, déterministe, et l'audio
// reste aligné même si l'onglet se charge.

class Clock {
  constructor(store, { onStep, onStop }) {
    this.store = store;
    this.onStep = onStep;
    this.onStop = onStop;
    this.timer = 0;
    this.nextTime = 0;
    this.startedAt = 0;
  }

  /** Durée d'un pas, en secondes (1/16 par défaut). */
  stepDuration() {
    const { bpm, swing } = this.store.state;
    return 60 / bpm / 4; // 1/16
  }

  start() {
    if (this.timer) return;
    const len = this.store.state.length;
    const lenMs = this.stepDuration() * 1000;
    this.nextTime = performance.now();
    this.startedAt = this.nextTime;

    this.timer = setInterval(() => {
      const now = performance.now();
      // Si l'onglet a été mis en pause, on saute les pas ratés
      // plutôt que d'en jouer une rafale.
      if (now - this.nextTime > lenMs * 4) this.nextTime = now;

      let guard = 0;
      while (now >= this.nextTime && guard++ < 32) {
        this.fire();
        this.nextTime += lenMs;
      }
    }, 15);
  }

  fire() {
    const s = this.store.state;
    const step = s.step;
    const len = s.length;

    if (s.metronome) {
      audio.click(null, step % 4 === 0);
    }

    // Déclenche toutes les pistes actives au pas courant.
    const live = [];
    const rows = store.currentPattern;
    const anySolo = s.trackDefs.some((t) => t.solo);
    for (const t of s.trackDefs) {
      const value = rows[t.id]?.[step] ?? 0;
      if (!value) continue;
      if (t.mute || (anySolo && !t.solo)) continue;
      audio.trigger(t.id, null, velocityFor(value, s.swing, s.humanize));
      live.push(t.id);
    }

    this.onStep(step, live, this.elapsed());

    const next = step + 1;
    if (next >= len) {
      store.state.step = s.loop ? 0 : len - 1;
      if (!s.loop) {
        this.stop();
        this.onStop?.();
        store.set('playing', false, 'play');
        return;
      }
    } else {
      store.state.step = next;
    }
    store.emit('transport:repaint', {});
  }

  /** Position dans la boucle, en secondes. */
  elapsed() {
    if (!this.startedAt) return 0;
    const s = this.store.state;
    const stepDur = this.stepDuration();
    return ((performance.now() - this.startedAt) / 1000) % (stepDur * s.length);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = 0;
    this.nextTime = 0;
    this.startedAt = 0;
  }

  get running() { return this.timer !== 0; }
}

/**
 * Vélocité d'un pas : swing décale l'accent, humanize ajoute
 * une variation pseudo-aléatoire stable pour un pas donné.
 */
function velocityFor(value, swing, humanize) {
  const base = value >= 1 ? 1 : 0.55;
  const shift = Math.max(0, (swing - 50) / 50);
  const jitter = ((value * 7919 + Math.round(shift * 100)) % 13) / 100;
  return Math.max(0.2, Math.min(1, base * (1 - shift * 0.12) - (jitter * humanize) / 100));
}

// -------------------------------------------------------------
// Application
// -------------------------------------------------------------

export function startApp({ view = 'sequencer', onMixerToggle } = {}) {
  const app = $('#app');
  const transportRoot = $('#transport');
  const sidebarRoot = $('#sidebar');
  const canvasRoot = $('#canvas');

  app.className = 'app';
  canvasRoot.className = 'shell__canvas';

  // ---------- État UI local ----------
  const ui = {
    sidebarOpen: true,
    mixerOpen: view === 'arrangement',
  };

  // ---------- Modules ----------
  let sequencer = null;
  let mixerMini = null;
  let mixerRack = null;
  let drawer = null;
  let arrangement = null;

  const clock = new Clock(store, {
    onStep: (step, live, elapsed) => {
      sequencer?.onStep(step, live);
      arrangement?.setPlayhead(step);
      arrangement?.setClock(elapsed);
    },
    onStop: () => {
      store.state.step = 0;
      sequencer?.onStep(0, []);
      arrangement?.setPlayhead(0);
    },
  });

  // --- Transport ---
  const transport = createTransport(transportRoot, store, {
    view,
    onTogglePlay: togglePlay,
    onStop: stop,
    onToggleRecord: () => {
      store.set('recording', !store.state.recording, 'record');
      notify(store.state.recording ? 'Enregistrement armé' : 'Enregistrement désarmé');
    },
    onToggleLoop: () => store.set('loop', !store.state.loop, 'loop'),
    onToggleSidebar: toggleSidebar,
    onOpenMixer: () => toggleMixer(!ui.mixerOpen),
    onSave: () => notify('Projet enregistré dans ce navigateur'),
    onExport: exportMix,
    onUndo: notify,
    onRedo: notify,
    onNavigate: notify,
  });

  // --- Sidebar ---
  const sidebar = createSidebar(sidebarRoot, store, {
    onAdd: (item) => addTrackFrom(item),
    onPreview: (item) => { if (store.state.playing) audio.preview(item.preset); },
  });

  // --- Vue principale ---
  if (view === 'sequencer') {
    // Colonne centrale (séquenceur) + colonne mixer compact.
    const row = el('div', { class: 'canvas-row' });
    canvasRoot.appendChild(row);

    sequencer = createSequencer(row, store, {
      onDropPreset: (preset, e) => addTrackFrom(lookupPreset(preset) ?? { preset, name: preset, cat: 'synth' }, e),
      onColumnClick: (i) => { store.state.step = i; store.emit('transport:repaint', {}); },
    });

    const aside = el('aside', { class: 'mixer-col', attrs: { 'aria-label': 'Mixer compact' } });
    row.appendChild(aside);
    mixerMini = createMixerMini(aside, store, { onAddTrack: addEmptyTrack });

  } else {
    arrangement = createArrangement(canvasRoot, store, {
      onOpenMixer: () => toggleMixer(!ui.mixerOpen),
      onDropPreset: (preset, e) => addTrackFrom(lookupPreset(preset) ?? { preset, name: preset, cat: 'synth' }, e),
      onSave: () => notify('Projet enregistré dans ce navigateur'),
      onUndo: notify,
      onRedo: notify,
    });

    // Tiroir mixer
    drawer = el('div', {
      class: `mixer-drawer ${ui.mixerOpen ? 'is-open' : ''}`,
      attrs: { 'aria-label': 'Rack mixer' },
    });
    const rackHost = el('div', { class: 'mixer-drawer__inner' });
    drawer.appendChild(rackHost);
    canvasRoot.appendChild(drawer);
    mixerRack = createMixerRack(rackHost, store);
  }

  // =============================================================
  // Actions
  // =============================================================

  async function ensureAudio() {
    if (audio.started) return audio.available;
    const ok = await audio.start();
    if (ok) {
      audio.attachAll(store.tracks);
      audio.setMaster(store.state.masterVolume);
      store.emit('audio:ready', { ok: true });
      notify('Audio activé');
    } else {
      notify('Audio indisponible — mode visuel');
    }
    return ok;
  }

  async function togglePlay() {
    await ensureAudio();
    const next = !store.state.playing;
    store.set('playing', next, 'play');
    if (next) {
      store.state.step = 0;
      clock.start();
    } else {
      clock.stop();
    }
  }

  function stop() {
    clock.stop();
    store.set('playing', false, 'play');
    store.state.step = 0;
    sequencer?.onStep(0, []);
    arrangement?.setPlayhead(0);
  }

  function toggleSidebar() {
    ui.sidebarOpen = !ui.sidebarOpen;
    sidebarRoot.classList.toggle('is-collapsed', !ui.sidebarOpen);
  }

  function toggleMixer(next) {
    ui.mixerOpen = next;
    onMixerToggle?.(next);
    if (view === 'arrangement') {
      drawer?.classList.toggle('is-open', next);
    } else {
      canvasRoot.querySelector('.mixer-col')?.classList.toggle('is-hidden', !next);
    }
  }

  function addTrackFrom(item, e) {
    if (!item) return;
    const color = PALETTE[store.tracks.length % PALETTE.length];
    const id = `t-${item.preset}-${Date.now().toString(36).slice(-4)}`;
    const track = {
      id,
      name: item.name,
      preset: item.preset,
      cat: item.cat,
      kind: (item.kind ?? (item.cat === 'drums' ? 'DRUM' : item.cat === 'fx' ? 'RETURN' : 'SYNTH')),
      volume: 0.7,
      pan: 0,
      mute: false,
      solo: false,
      inserts: ['EQ 3-Band', 'Compressor'],
      color,
      index: store.tracks.length + 1,
    };

    store.state.trackDefs.push(track);
    store.currentPattern[id] = new Array(store.state.length).fill(0);
    store.save();

    if (audio.available) audio.adopt(track);
    store.emit('tracks:changed', { added: track });
    notify(`Piste « ${track.name} » ajoutée`);
  }

  function addEmptyTrack() {
    addTrackFrom({ name: `Piste ${store.tracks.length + 1}`, preset: 'syn-lead', cat: 'synth', kind: 'SYNTH' });
  }

  async function exportMix() {
    await ensureAudio();
    notify('Export WAV — disponible en V1 (stub V0)');
  }

  function notify(msg) {
    let t = $('#toast');
    if (!t) {
      t = el('div', { class: 'toast', attrs: { role: 'status', 'aria-live': 'polite' }, id: 'toast' });
      document.body.appendChild(t);
    }
    t.textContent = typeof msg === 'string' ? msg : 'Action indisponible en V0';
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-visible'), 1900);
  }

  // =============================================================
  // Raccourcis clavier
  // =============================================================

  const isTyping = (e) => {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  };

  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || isTyping(e)) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;

      case 'Escape':
        stop();
        break;

      case 'ArrowLeft':
      case 'ArrowRight': {
        e.preventDefault();
        const len = store.state.length;
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        store.state.step = (store.state.step + dir + len) % len;
        sequencer?.onStep(store.state.step, []);
        arrangement?.setPlayhead(store.state.step);
        store.emit('transport:repaint', {});
        break;
      }

      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault();
        const list = store.tracks;
        const i = list.findIndex((t) => t.id === store.state.selectedTrackId);
        const next = list[(i + (e.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length];
        store.state.selectedTrackId = next.id;
        sequencer?.select(next.id);
        store.emit('select', { trackId: next.id });
        break;
      }

      case 'm':
      case 'M':
        sequencer?.toggleMute(store.state.selectedTrackId);
        break;

      case 's':
      case 'S':
        sequencer?.toggleSolo(store.state.selectedTrackId);
        break;

      case 't':
      case 'T':
        document.querySelector('.btn--tap')?.click();
        break;

      default:
        break;
    }
  });

  // Toute nouvelle piste reconstruit les vues concernées.
  store.on('tracks:changed', () => {
    if (view === 'sequencer') {
      sequencer?.render();
      const aside = canvasRoot.querySelector('.mixer-col');
      if (aside) {
        mixerMini?.stop();
        mixerMini = createMixerMini(aside, store, { onAddTrack: addEmptyTrack });
      }
    } else {
      arrangement?.render();
      if (drawer) {
        mixerRack?.stop();
        mixerRack = createMixerRack(drawer, store);
      }
    }
  });

  // Nettoyage
  window.addEventListener('beforeunload', () => {
    clock.stop();
    mixerMini?.stop();
    mixerRack?.stop();
  });

  // Synchronise les gains au démarrage (si l'audio était déjà actif).
  store.on('audio:ready', () => audio.syncFlags(store.tracks));

  // Expose un point d'entrée minimal pour le débogage console.
  window.ALPHA = { store, audio, clock, transport, sidebar };

  return { store, clock, notify, ensureAudio, togglePlay, stop };
}
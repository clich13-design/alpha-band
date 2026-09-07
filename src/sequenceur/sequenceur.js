// ALPHA-Band — Maquette séquenceur pas-à-pas
// Orchestrateur : état global, transport, animation du playhead,
// branchement de tous les sous-modules.
//
// Cette maquette est purement visuelle : aucun son n'est joué.
// L'architecture est compatible avec un branchement Tone.js ultérieur
// (cf. commentaires "AUDIO" aux endroits concernés).

import { LIBRARY, CATEGORIES, filterLibrary } from './library.js';
import {
  DEFAULT_TRACKS,
  STEP_COUNT,
  createTrack,
  seedSteps,
  randomize,
  clearAll,
  presetGroove,
  renderTrackRow,
  patchCell,
  pulseCell,
  patchTrackClasses,
  lookupPreset,
} from './tracks.js';
import { renderFader, tickMeters } from './mixer.js';
import { AudioEngine } from './audio.js';

// =============================================================
// STATE
// =============================================================
const state = {
  bpm: 120,
  isPlaying: false,
  currentStep: 0,           // 0..15
  loop: true,
  metronome: false,
  tapTimes: [],             // pour tap tempo
  tracks: [],
  selectedTrackId: null,
  length: STEP_COUNT,
  catFilter: 'all',
};

const ctx = {
  toggleMute, toggleSolo, toggleStep, selectTrack,
  addTrack, changeLength,
};

// =============================================================
// TRANSPORT TIMER
// =============================================================
let transportTimer = null;     // setInterval (kept for fallback)
let meterTimer = null;
let audioSchedulerId = null;   // requestAnimationFrame for tight scheduling
const audio = new AudioEngine();
let nextStepTime = 0;          // audio time (sec) at which next step should fire
let stepLookahead = 0.1;       // schedule 100ms ahead
let padHoldState = new Map();  // trackId → lastTriggerStep (avoid retriggering pads)
let startWallTime = 0;         // performance.now() au moment du start

function stepInterval() {
  // 16th note : intervalle = (60 / bpm) / 4 * 1000 ms
  return (60 / state.bpm) * 250;
}

async function startTransport() {
  stopTransport();
  state.isPlaying = true;
  state.currentStep = 0;
  btnPlay.setAttribute('aria-pressed', 'true');
  // Initialise le contexte audio au premier démarrage (user gesture requis)
  try {
    await audio.init();
    // Attache toutes les pistes (recrée les voix Tone)
    for (const tr of state.tracks) audio.attach(tr);
  } catch (e) {
    console.warn('[audio] init échoué, mode visuel uniquement', e);
  }
  startWallTime = performance.now();
  nextStepTime = 0;
  // Double sécurité : rAF pour timing précis + setInterval comme filet.
  // Le rAF reschedule est dans audioSchedulerTick lui-même.
  transportTimer = setInterval(visualOnlyStep, stepInterval());
  audioSchedulerId = requestAnimationFrame(audioSchedulerTick);
  meterTimer = setInterval(tickMeter, 80);
}

function stopTransport() {
  state.isPlaying = false;
  btnPlay.setAttribute('aria-pressed', 'false');
  if (transportTimer) clearInterval(transportTimer);
  if (meterTimer) clearInterval(meterTimer);
  if (audioSchedulerId) cancelAnimationFrame(audioSchedulerId);
  transportTimer = meterTimer = null;
  audioSchedulerId = null;
  padHoldState.clear();
  clearPlayhead();
  clearMeter();
  if (state.currentStep !== 0) state.currentStep = 0;
  positionNum.textContent = '01';
  barProgress.style.width = '0%';
}

// =============================================================
// SCHEDULER AUDIO : on lit l'avance et on déclenche les hits Tone.js
// =============================================================
function nowSec() {
  return (performance.now() - startWallTime) / 1000;
}

function audioSchedulerTick() {
  if (!state.isPlaying) return;
  try {
    const now = nowSec();
    let safety = 0;
    while (nextStepTime < now + stepLookahead) {
      scheduleStep(state.currentStep);
      advanceVisual(state.currentStep);
      nextStepTime += stepInterval() / 1000;
      state.currentStep = (state.currentStep + 1) % state.length;
      if (++safety > 32) break; // garde-fou
    }
  } catch (e) {
    console.warn('[transport] audioSchedulerTick error', e);
  }
  // Toujours reschedule (même en cas d'erreur) — sinon le transport meurt
  if (state.isPlaying) {
    audioSchedulerId = requestAnimationFrame(audioSchedulerTick);
  }
}

function scheduleStep(stepIdx) {
  // Pour chaque piste active au pas stepIdx, on déclenche l'audio.
  for (const tr of state.tracks) {
    if (tr.muted) continue;
    const anySolo = state.tracks.some(x => x.solo);
    if (anySolo && !tr.solo) continue;
    if (!tr.steps[stepIdx]) continue;
    if (tr.cat === 'pad') {
      // Pads : ne re-déclenche pas à chaque pas, uniquement au top de mesure.
      if (stepIdx % 4 === 0 || !padHoldState.has(tr.id)) {
        audio.triggerPadHold(tr.id);
        padHoldState.set(tr.id, stepIdx);
      }
    } else {
      audio.trigger(tr.id);
    }
  }
}

// TICK VISUEL seul (fallback si rAF est suspendu)
function visualTick() {
  // Pas besoin : le scheduler rAF gère tout. Conservé pour symétrie.
}

// Fallback : si rAF est suspendu (onglet en arrière-plan, devtools pause), on
// continue à faire avancer le playhead à intervalles réguliers. Ne fait que
// mettre à jour l'état visuel et l'index de pas, sans déclencher d'audio.
function visualOnlyStep() {
  if (!state.isPlaying) return;
  // Avance l'index si l'audio scheduler n'a pas avancé depuis longtemps
  const now = nowSec();
  if (now - nextStepTime > 0.5) {
    state.currentStep = (state.currentStep + 1) % state.length;
    advanceVisual(state.currentStep);
  }
}

function advanceStep() {
  // Conservé pour compatibilité (non utilisé en pratique).
  advanceVisual(state.currentStep);
  state.currentStep = (state.currentStep + 1) % state.length;
}

// TICK VISUEL découplé (utilisé par le scheduler rAF)
function advanceVisual(step) {
  setPlayhead(step);
  let activeCount = 0;
  for (const tr of state.tracks) {
    const rowEl = tracksHost.querySelector(`.track[data-id="${tr.id}"]`);
    if (!rowEl) continue;
    const cell = rowEl.querySelectorAll('.cell')[step];
    if (!cell) continue;
    if (tr.steps[step] && !tr.muted) {
      pulseCell(cell);
      activeCount++;
    }
  }
  barProgress.style.width = `${((step + 1) / state.length) * 100}%`;
  meterLevel = 0.15 + (activeCount / Math.max(1, state.tracks.length)) * 0.7
              + (Math.random() * 0.1);
  meterLevel = Math.min(1, meterLevel);
  positionNum.textContent = String(step + 1).padStart(2, '0');
}

function setPlayhead(step) {
  for (const cell of playheadCells) {
    cell.classList.remove('is-playing');
  }
  const cell = playheadCells[step];
  if (cell) cell.classList.add('is-playing');
}

function clearPlayhead() {
  for (const cell of playheadCells) cell.classList.remove('is-playing');
}

// =============================================================
// VU-METERS (pendant lecture)
// =============================================================
let meterLevel = 0;
function tickMeter() {
  // Décroissance lente vers une valeur "ambiante"
  meterLevel = meterLevel * 0.9 + Math.random() * 0.08;
  tickMeters(faderEntries, meterLevel);
}
function clearMeter() {
  meterLevel = 0;
  for (const f of faderEntries) f.update(f.track.volume, 0);
}

// =============================================================
// ACTIONS : mute / solo / toggle cellule / sélection
// =============================================================
function toggleMute(trackId) {
  const t = state.tracks.find(t => t.id === trackId);
  if (!t) return;
  t.muted = !t.muted;
  audio.setMute(trackId, t.muted);
  const row = tracksHost.querySelector(`.track[data-id="${trackId}"]`);
  if (row) patchTrackClasses(row, t, state.selectedTrackId);
}

function toggleSolo(trackId) {
  const t = state.tracks.find(t => t.id === trackId);
  if (!t) return;
  t.solo = !t.solo;
  audio.setSolo(trackId, t.solo);
  const row = tracksHost.querySelector(`.track[data-id="${trackId}"]`);
  if (row) patchTrackClasses(row, t, state.selectedTrackId);
}

function toggleStep(trackId, stepIdx, cellEl) {
  const t = state.tracks.find(t => t.id === trackId);
  if (!t) return;
  t.steps[stepIdx] = t.steps[stepIdx] ? 0 : 1;
  patchCell(cellEl, !!t.steps[stepIdx]);
  if (t.steps[stepIdx]) pulseCell(cellEl);
  // Tip contextuel sur le premier toggle de la session
  if (!state._tipShown) {
    showToast(`Astuce : Tab pour naviguer, Espace pour activer un pas.`);
    state._tipShown = true;
  }
  updateFillRate();
}

function selectTrack(trackId) {
  state.selectedTrackId = state.selectedTrackId === trackId ? null : trackId;
  for (const t of state.tracks) {
    const row = tracksHost.querySelector(`.track[data-id="${t.id}"]`);
    if (row) patchTrackClasses(row, t, state.selectedTrackId);
  }
}

function addTrack(meta) {
  const newMeta = {
    id: `t-${Date.now().toString(36)}`,
    preset: meta.preset,
    name: meta.name,
    cat: meta.cat,
    volume: 0.7,
    muted: false,
    solo: false,
  };
  const track = createTrack(newMeta, state.length);
  state.tracks.push(track);
  // Si l'audio est démarré, on attache la nouvelle piste
  if (audio.ready) audio.attach(track);
  renderAllTracks();
  refreshFaders();
  updateFillRate();
  showToast(`Piste ${meta.name} ajoutée`);
}

function changeLength(newLen) {
  state.length = newLen;
  for (const t of state.tracks) {
    const old = t.steps;
    const fresh = new Uint8Array(newLen);
    for (let i = 0; i < Math.min(old.length, newLen); i++) fresh[i] = old[i];
    t.steps = fresh;
  }
  // Re-render complet (changement de structure)
  renderAllTracks();
  refreshFaders();
  renderPlayhead();
}

// =============================================================
// RENDER
// =============================================================
let tracksHost, mixerHost, libraryList, libraryHint;
let btnPlay, btnStop, btnRewind, btnTap, btnLoop, btnMetronome;
let btnClear, btnRandom, btnPreset, btnAddTrack;
let inputBpm, selectLength, selectSubdiv;
let positionNum, barProgress;
let playheadCells = [];
let faderEntries = [];

function renderAllTracks() {
  tracksHost.innerHTML = '';
  for (const tr of state.tracks) {
    const { row } = renderTrackRow(tr, ctx);
    patchTrackClasses(row, tr, state.selectedTrackId);
    tracksHost.appendChild(row);
  }
}

function refreshFaders() {
  mixerHost.innerHTML = '';
  faderEntries = [];
  for (const tr of state.tracks) {
    const { el, update, setVolumeValue } = renderFader(tr);
    mixerHost.appendChild(el);
    // Branchement audio : à chaque changement de volume, on propage à Tone.js
    const originalSet = setVolumeValue;
    const wrappedSet = (v) => {
      originalSet(v);
      audio.setVolume(tr.id, v);
    };
    faderEntries.push({ track: tr, update, setVolumeValue: wrappedSet });
  }
}

function renderPlayhead() {
  const row = document.querySelector('.playhead-row');
  row.innerHTML = '';
  playheadCells = [];
  // padding pour la colonne head
  const pad = document.createElement('div');
  row.appendChild(pad);
  for (let i = 0; i < state.length; i++) {
    const c = document.createElement('div');
    c.className = 'playhead-cell' + (i % 4 === 0 ? ' on-beat' : '');
    row.appendChild(c);
    playheadCells.push(c);
  }

  const lbls = document.querySelector('.step-labels');
  lbls.innerHTML = '';
  const padLbl = document.createElement('div');
  lbls.appendChild(padLbl);
  for (let i = 0; i < state.length; i++) {
    const l = document.createElement('div');
    l.className = 'step-label' + (i % 4 === 0 ? ' on-beat' : '');
    l.textContent = (i % 4 === 0) ? String(i + 1).padStart(2, '0') : '·';
    lbls.appendChild(l);
  }
}

function renderLibrary() {
  libraryList.innerHTML = '';
  const items = filterLibrary(state.catFilter);
  for (const p of items) {
    const el = document.createElement('div');
    el.className = 'lib-item';
    el.dataset.id = p.id;
    el.setAttribute('role', 'option');
    el.setAttribute('tabindex', '0');
    el.draggable = true;

    const icon = document.createElement('div');
    icon.className = 'lib-item__icon';
    icon.style.background = `var(--c-${p.cat})`;
    icon.textContent = p.icon;

    const txt = document.createElement('div');
    txt.style.flex = '1';
    txt.style.minWidth = '0';
    const name = document.createElement('div');
    name.className = 'lib-item__name';
    name.textContent = p.name;
    const hint = document.createElement('div');
    hint.className = 'lib-item__hint';
    hint.textContent = p.hint;
    txt.append(name, hint);

    el.append(icon, txt);

    el.title = `${p.name} — ${p.hint}`;

    el.addEventListener('click', () => addTrack(p));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        addTrack(p);
      }
    });
    el.addEventListener('dragstart', (e) => {
      el.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', p.id);
    });
    el.addEventListener('dragend', () => el.classList.remove('is-dragging'));

    libraryList.appendChild(el);
  }
}

function updateFillRate() {
  const total = state.tracks.reduce((acc, t) => acc + t.steps.reduce((a, b) => a + b, 0), 0);
  const max = state.tracks.length * state.length || 1;
  const pct = Math.round((total / max) * 100);
  fillRate.textContent = String(pct);
}

// =============================================================
// TOAST
// =============================================================
let toastTimer = null;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

// =============================================================
// KEYBOARD SHORTCUTS
// =============================================================
function handleKey(e) {
  // Ignore si focus dans un input/select
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.isContentEditable)) {
    if (t.tagName === 'INPUT' && t.type === 'number') return; // autorise saisie BPM
    return;
  }

  switch (e.key) {
    case ' ':
      e.preventDefault();
      state.isPlaying ? stopTransport() : startTransport();
      break;
    case 'Escape':
      if (state.isPlaying) stopTransport();
      break;
    case 'ArrowLeft':
      e.preventDefault();
      state.currentStep = (state.currentStep - 1 + state.length) % state.length;
      if (!state.isPlaying) setPlayhead(state.currentStep);
      positionNum.textContent = String(state.currentStep + 1).padStart(2, '0');
      break;
    case 'ArrowRight':
      e.preventDefault();
      state.currentStep = (state.currentStep + 1) % state.length;
      if (!state.isPlaying) setPlayhead(state.currentStep);
      positionNum.textContent = String(state.currentStep + 1).padStart(2, '0');
      break;
    case 'ArrowUp':
      e.preventDefault();
      navigateTrack(-1);
      break;
    case 'ArrowDown':
      e.preventDefault();
      navigateTrack(1);
      break;
    case 'm': case 'M':
      if (state.selectedTrackId) toggleMute(state.selectedTrackId);
      break;
    case 's': case 'S':
      if (state.selectedTrackId) toggleSolo(state.selectedTrackId);
      break;
    case 't': case 'T':
      tap();
      break;
  }
}

function navigateTrack(dir) {
  if (!state.tracks.length) return;
  let idx = state.tracks.findIndex(t => t.id === state.selectedTrackId);
  if (idx === -1) idx = 0;
  else idx = (idx + dir + state.tracks.length) % state.tracks.length;
  selectTrack(state.tracks[idx].id);
  // Scroll vers la piste sélectionnée
  const row = tracksHost.querySelector(`.track[data-id="${state.tracks[idx].id}"]`);
  if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// =============================================================
// TAP TEMPO
// =============================================================
function tap() {
  const now = performance.now();
  state.tapTimes = state.tapTimes.filter(t => now - t < 3000);
  state.tapTimes.push(now);
  if (state.tapTimes.length >= 2) {
    const avg = (state.tapTimes[state.tapTimes.length - 1] - state.tapTimes[0]) / (state.tapTimes.length - 1);
    const bpm = Math.round(60000 / avg);
    if (bpm >= 40 && bpm <= 240) {
      inputBpm.value = String(bpm);
      onBpmChange();
      showToast(`Tempo calé : ${bpm} BPM`);
    }
  }
}

// =============================================================
// BPM
// =============================================================
function onBpmChange() {
  let v = parseInt(inputBpm.value, 10);
  if (Number.isNaN(v)) v = 120;
  v = Math.max(40, Math.min(240, v));
  state.bpm = v;
  inputBpm.value = String(v);
  // Si on est en train de jouer, on relance avec le nouvel intervalle
  if (state.isPlaying) {
    if (transportTimer) clearInterval(transportTimer);
    transportTimer = setInterval(advanceStep, stepInterval());
  }
}

// =============================================================
// INIT
// =============================================================
let fillRate, toast;

function init() {
  // Catches DOM
  tracksHost = document.getElementById('tracks-host');
  mixerHost = document.getElementById('mixer-host');
  libraryList = document.getElementById('library-list');
  libraryHint = document.querySelector('.library__hint');

  btnPlay = document.getElementById('btn-play');
  btnStop = document.getElementById('btn-stop');
  btnRewind = document.getElementById('btn-rewind');
  btnTap = document.getElementById('btn-tap');
  btnLoop = document.getElementById('btn-loop');
  btnMetronome = document.getElementById('btn-metronome');
  btnClear = document.getElementById('btn-clear');
  btnRandom = document.getElementById('btn-random');
  btnPreset = document.getElementById('btn-preset');
  btnAddTrack = document.getElementById('btn-add-track');
  inputBpm = document.getElementById('input-bpm');
  selectLength = document.getElementById('select-length');
  selectSubdiv = document.getElementById('select-subdiv');
  positionNum = document.getElementById('position-beat');
  barProgress = document.getElementById('bar-progress');
  fillRate = document.getElementById('fill-rate');
  toast = document.getElementById('toast');

  // État initial : 5 pistes avec seedSteps
  state.tracks = DEFAULT_TRACKS.map(meta => createTrack(meta, state.length));
  seedSteps(state.tracks);

  // Render
  renderPlayhead();
  renderAllTracks();
  refreshFaders();
  renderLibrary();
  updateFillRate();

  // Bindings transport
  btnPlay.addEventListener('click', () => {
    state.isPlaying ? stopTransport() : startTransport();
  });
  btnStop.addEventListener('click', stopTransport);
  btnRewind.addEventListener('click', () => {
    state.currentStep = 0;
    positionNum.textContent = '01';
    barProgress.style.width = '0%';
    if (state.isPlaying) {
      // restart position
    } else {
      setPlayhead(0);
    }
    showToast('Position réinitialisée');
  });
  btnTap.addEventListener('click', tap);

  btnLoop.addEventListener('click', () => {
    state.loop = !state.loop;
    btnLoop.setAttribute('aria-pressed', String(state.loop));
  });
  btnMetronome.addEventListener('click', () => {
    state.metronome = !state.metronome;
    btnMetronome.setAttribute('aria-pressed', String(state.metronome));
    showToast(`Métronome ${state.metronome ? 'activé' : 'désactivé'}`);
  });

  // BPM
  inputBpm.addEventListener('input', onBpmChange);
  inputBpm.addEventListener('change', onBpmChange);

  // Length / subdivision
  selectLength.addEventListener('change', () => changeLength(parseInt(selectLength.value, 10)));
  selectSubdiv.addEventListener('change', () => {
    showToast(`Subdivision : ${selectSubdiv.value === '4' ? '1/4' : selectSubdiv.value === '8' ? '1/8' : '1/16'}`);
  });

  // Outils
  btnClear.addEventListener('click', () => {
    clearAll(state.tracks);
    renderAllTracks();
    updateFillRate();
    showToast('Grille vidée');
  });
  btnRandom.addEventListener('click', () => {
    randomize(state.tracks);
    renderAllTracks();
    updateFillRate();
    showToast('Pattern aléatoire généré');
  });
  btnPreset.addEventListener('click', () => {
    presetGroove(state.tracks);
    renderAllTracks();
    updateFillRate();
    showToast('Preset groove chargé');
  });
  btnAddTrack.addEventListener('click', () => {
    // Ajoute un preset par défaut
    const fallback = LIBRARY.find(p => p.id === 'kick-808');
    addTrack(fallback);
  });

  // Catégories
  document.querySelectorAll('.cat').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.catFilter = btn.dataset.cat;
      renderLibrary();
    });
  });

  // Drag & drop depuis la bibliothèque
  tracksHost.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });
  tracksHost.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const preset = LIBRARY.find(p => p.id === id);
    if (preset) addTrack(preset);
  });

  // Clavier global
  window.addEventListener('keydown', handleKey);

  // Premier toast d'accueil
  setTimeout(() => showToast('Maquette prête · clique Play ou appuie sur Espace'), 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
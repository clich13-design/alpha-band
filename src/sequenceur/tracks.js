// Tracks : modèle + rendu DOM.
//
// Modèle :
//   tracks = [{
//     id, name, preset, cat,        // métadonnées
//     steps: Uint8Array(N),          // 0/1 par pas (16 par défaut)
//     muted: bool, solo: bool,
//     volume: 0..1
//   }]
//
// Le rendu est reconstruit à chaque changement de structure
// (ajout/suppression de piste). Pour les toggles de cellules on patche
// directement la cellule — pas de re-render complet (perf).
//
// Branchement audio futur :
//   `attachAudio(track)` recevra un wrapper Tone.js et appellera
//   `trigger(step, time)` à chaque pas actif. Pas implémenté en maquette.

import { LIBRARY } from './library.js';

export const DEFAULT_TRACKS = [
  { id: 't-kick',  preset: 'kick-808',    name: 'Kick',       cat: 'drums', volume: 0.85, muted: false, solo: false },
  { id: 't-snare', preset: 'snare-clap',  name: 'Snare',      cat: 'drums', volume: 0.78, muted: false, solo: false },
  { id: 't-bass',  preset: 'bass-sub',    name: 'Bass',       cat: 'bass',  volume: 0.70, muted: false, solo: false },
  { id: 't-synth', preset: 'syn-lead',    name: 'Lead Synth', cat: 'synth', volume: 0.65, muted: false, solo: false },
  { id: 't-pad',   preset: 'pad-strings', name: 'Pad Strings',cat: 'pad',   volume: 0.55, muted: false, solo: false },
];

export const STEP_COUNT = 16;

/**
 * Crée un objet track prêt à l'emploi.
 */
export function createTrack(meta, stepCount = STEP_COUNT) {
  return {
    id: meta.id,
    preset: meta.preset,
    name: meta.name,
    cat: meta.cat,
    volume: meta.volume ?? 0.75,
    muted: meta.muted ?? false,
    solo: meta.solo ?? false,
    steps: new Uint8Array(stepCount),  // vide par défaut
  };
}

/**
 * Génère une grille de démonstration (style groove maison).
 * 1 kick par mesure + snare 2 et 4 + bass sync + lead arpège + pad sustain.
 */
export function seedSteps(tracks) {
  const find = (preset) => tracks.find(t => t.preset === preset);
  const set = (track, pattern) => {
    if (!track) return;
    pattern.forEach((idx, i) => {
      // pattern = indices absolus ou relatifs à 4
      track.steps[idx % STEP_COUNT] = 1;
    });
  };

  const kick  = find('kick-808');
  const snare = find('snare-clap');
  const hat   = find('hat-trance');    // pas utilisé en maquette par défaut (5 tracks)
  const bass  = find('bass-sub');
  const lead  = find('syn-lead');
  const pad   = find('pad-strings');

  // Kick : 1, 5, 9, 11 (syncope légère)
  set(kick, [0, 4, 8, 10]);
  // Snare : 4 et 12 (2 et 4)
  set(snare, [4, 12]);
  // Bass : root tous les 4 + 1 syncope
  set(bass, [0, 2, 4, 6, 8, 10, 12, 14]);
  // Lead : arpège 0,3,5,8,11,14
  set(lead, [0, 3, 5, 8, 11, 14]);
  // Pad : longue tenue (1 + 9)
  set(pad, [0, 8]);
}

/**
 * Mélange aléatoire (densité par défaut : ~40%).
 */
export function randomize(tracks, density = 0.4, rng = Math.random) {
  for (const t of tracks) {
    for (let i = 0; i < t.steps.length; i++) {
      // Biais musical : pas impairs moins remplis sur les drums, plus sur lead
      const baseBias = t.cat === 'drums' ? 0.5 : (t.cat === 'bass' ? 0.5 : 0.4);
      t.steps[i] = rng() < density * baseBias ? 1 : 0;
    }
  }
}

/**
 * Vide toutes les grilles.
 */
export function clearAll(tracks) {
  for (const t of tracks) t.steps.fill(0);
}

/**
 * Rend une grille pré-faite (4-on-the-floor + break).
 */
export function presetGroove(tracks) {
  clearAll(tracks);
  const find = (preset) => tracks.find(t => t.preset === preset);
  const kick  = find('kick-808');
  const snare = find('snare-clap');
  const bass  = find('bass-sub');
  const lead  = find('syn-lead');
  const pad   = find('pad-strings');

  if (kick)  [0,4,8,12].forEach(i => kick.steps[i] = 1);
  if (snare) [4,12].forEach(i => snare.steps[i] = 1);
  if (bass)  [0,3,4,7,8,11,12,15].forEach(i => bass.steps[i] = 1);
  if (lead)  [2,6,10,14].forEach(i => lead.steps[i] = 1);
  if (pad)   [0,8].forEach(i => pad.steps[i] = 1);
}

/**
 * Lookup d'un preset dans la bibliothèque.
 */
export function lookupPreset(presetId) {
  return LIBRARY.find(p => p.id === presetId);
}

/**
 * Rend le DOM d'une track (sans les cellules — celles-ci sont patchées
 * individuellement pour la perf).
 *
 * Retourne { row, head, cells, dispose }.
 */
export function renderTrackRow(track, ctx) {
  const row = document.createElement('div');
  row.className = 'track';
  row.dataset.id = track.id;
  row.dataset.cat = track.cat;
  row.tabIndex = -1;

  // Head
  const head = document.createElement('div');
  head.className = 'track__head';

  const color = document.createElement('div');
  color.className = 'track__color';
  color.style.background = `var(--c-${track.cat})`;
  head.appendChild(color);

  const nameWrap = document.createElement('div');
  nameWrap.className = 'track__name-wrap';
  const nameEl = document.createElement('div');
  nameEl.className = 'track__name';
  nameEl.textContent = track.name;
  const presetEl = document.createElement('div');
  presetEl.className = 'track__preset';
  presetEl.textContent = lookupPreset(track.preset)?.name || '';
  nameWrap.append(nameEl, presetEl);
  head.appendChild(nameWrap);

  const btns = document.createElement('div');
  btns.className = 'track__btns';
  const mute = document.createElement('button');
  mute.className = 'tk-btn tk-btn--mute';
  mute.type = 'button';
  mute.textContent = 'M';
  mute.title = `Muter ${track.name}`;
  mute.setAttribute('aria-label', `Muter ${track.name}`);
  mute.setAttribute('aria-pressed', String(track.muted));
  if (track.muted) mute.classList.add('is-active');
  mute.addEventListener('click', () => ctx.toggleMute(track.id));
  btns.appendChild(mute);

  const solo = document.createElement('button');
  solo.className = 'tk-btn tk-btn--solo';
  solo.type = 'button';
  solo.textContent = 'S';
  solo.title = `Solo ${track.name}`;
  solo.setAttribute('aria-label', `Solo ${track.name}`);
  solo.setAttribute('aria-pressed', String(track.solo));
  if (track.solo) solo.classList.add('is-active');
  solo.addEventListener('click', () => ctx.toggleSolo(track.id));
  btns.appendChild(solo);

  head.appendChild(btns);
  row.appendChild(head);

  // Cellules
  const cells = [];
  for (let i = 0; i < track.steps.length; i++) {
    const cell = document.createElement('button');
    cell.className = 'cell' + (i % 4 === 0 ? ' on-beat' : '');
    cell.type = 'button';
    cell.dataset.step = String(i);
    cell.setAttribute('role', 'checkbox');
    cell.setAttribute('aria-checked', 'false');
    cell.setAttribute('aria-label', `${track.name} — pas ${i + 1}`);
    cell.tabIndex = 0;

    if (track.steps[i]) {
      cell.classList.add('is-on');
      cell.setAttribute('aria-checked', 'true');
    }

    cell.addEventListener('click', () => ctx.toggleStep(track.id, i, cell));
    cell.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        ctx.toggleStep(track.id, i, cell);
      }
    });
    row.appendChild(cell);
    cells.push(cell);
  }

  row.addEventListener('click', (e) => {
    if (e.target.classList.contains('cell')) return;  // la cellule gère son clic
    ctx.selectTrack(track.id);
  });

  return { row, head, cells };
}

/**
 * Patch une cellule sans re-render.
 */
export function patchCell(cell, isOn) {
  cell.classList.toggle('is-on', isOn);
  cell.setAttribute('aria-checked', String(isOn));
}

/**
 * Anime un pulse sur la cellule (utilisé quand on toggle on/off).
 */
export function pulseCell(cell) {
  cell.classList.remove('is-pulsing');
  // Force reflow pour relancer l'anim
  void cell.offsetWidth;
  cell.classList.add('is-pulsing');
  setTimeout(() => cell.classList.remove('is-pulsing'), 240);
}

/**
 * Met à jour l'état visuel de la track (mute/solo/selected).
 */
export function patchTrackClasses(row, track, selectedId) {
  row.classList.toggle('is-muted', track.muted);
  row.classList.toggle('is-solo', track.solo);
  row.classList.toggle('is-selected', track.id === selectedId);
  row.querySelector('.tk-btn--mute').classList.toggle('is-active', track.muted);
  row.querySelector('.tk-btn--mute').setAttribute('aria-pressed', String(track.muted));
  row.querySelector('.tk-btn--solo').classList.toggle('is-active', track.solo);
  row.querySelector('.tk-btn--solo').setAttribute('aria-pressed', String(track.solo));
}
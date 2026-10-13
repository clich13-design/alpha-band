// =============================================================
// ALPHA-Band — Module Sequencer
// -------------------------------------------------------------
// Grille pas-à-pas : 8 pistes × 16 pas (groupés par temps),
// pads 40px, en-tête de piste 256px, faisceau de lecture.
// Posé sur <section data-sequencer>.
// =============================================================

import { el, clear, waveShape, hashSeed } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { lookupPreset } from '../core/store.js';
import { audio } from '../core/audio.js';

const GHOST = 0.55;   // intensité d'une note fantôme
const STEPS_PER_BEAT = 4;

export function createSequencer(root, store, opts = {}) {
  const onDropPreset = opts.onDropPreset ?? (() => {});
  const onColumnClick = opts.onColumnClick ?? (() => {});

  clear(root);
  root.className = 'seq';

  // ---------- Rack ----------
  const rack = el('div', { class: 'seq__rack', attrs: { role: 'group', 'aria-label': 'Grille du séquenceur' } });

  // En-tête : colonne piste + numéros de pas
  const head = el('div', { class: 'seq__head' });
  const headCol = el('div', { class: 'seq__headcol' });
  headCol.append(
    el('span', { class: 'lbl', text: 'Track / Sound' }),
    el('span', { class: 'lbl', text: 'Pitch · Vol' }),
  );
  const stepsRow = el('div', { class: 'seq__steps' });
  head.append(headCol, stepsRow);

  // Faisceau de lecture
  const beam = el('div', { class: 'seq__beam', attrs: { 'aria-hidden': 'true' } });

  // Pistes
  const rows = el('div', { class: 'seq__rows', id: 'tracks-host' });
  rows.style.display = 'flex';
  rows.style.flexDirection = 'column';
  rows.style.gap = '8px';

  rack.append(head, beam, rows);

  // ---------- Barre d'outils ----------
  const tools = el('div', { class: 'seq__tools' });
  const toolsLeft = el('div', { class: 'seq__tools-left' });
  const toolsRight = el('div', { class: 'seq__tools-right' });

  // Length
  const lenGroup = el('div', { class: 'inspector__ctrl' });
  lenGroup.appendChild(el('span', { class: 'lbl', text: 'Length' }));
  const lenSeg = el('div', { class: 'seg' });
  for (const n of [16, 32]) {
    const b = el('button', {
      class: 'seg__item',
      text: String(n),
      attrs: { 'aria-pressed': String(n === store.state.length) },
      dataset: { len: String(n) },
    });
    b.addEventListener('click', () => {
      store.set('length', n, 'length');
      for (const other of lenSeg.children) other.setAttribute('aria-pressed', String(Number(other.dataset.len) === n));
      render();
    });
    lenSeg.appendChild(b);
  }
  lenGroup.appendChild(lenSeg);

  // Swing
  const swingGroup = el('div', { class: 'inspector__ctrl' });
  swingGroup.appendChild(el('span', { class: 'lbl', text: 'Swing' }));
  const swingRange = el('input', {
    class: 'range',
    attrs: { type: 'range', min: '50', max: '75', value: String(store.state.swing), 'aria-label': 'Swing' },
  });
  const swingVal = el('span', { class: 'tool-val', text: `${store.state.swing}%` });
  swingRange.addEventListener('input', () => {
    swingVal.textContent = `${swingRange.value}%`;
    store.set('swing', Number(swingRange.value), 'swing');
  });
  swingGroup.append(swingRange, swingVal);

  // Humanize
  const humGroup = el('div', { class: 'inspector__ctrl' });
  humGroup.appendChild(el('span', { class: 'lbl', text: 'Humanize' }));
  const humBtn = el('button', { class: 'tool', html: `${icon('shuffle', { size: 13 })}<span>${store.state.humanize}%</span>` });
  humBtn.addEventListener('click', () => {
    const next = (store.state.humanize + 6) % 25;
    store.set('humanize', next, 'humanize');
    humBtn.querySelector('span').textContent = `${next}%`;
  });
  humGroup.appendChild(humBtn);

  toolsLeft.append(lenGroup, toolsSep(), swingGroup, toolsSep(), humGroup);

  // Actions de motif
  let clipboard = null;
  const mkTool = (iconName, label, cls, onClick) => {
    const b = el('button', {
      class: `tool ${cls}`.trim(),
      html: `${icon(iconName, { size: 14 })}<span>${label}</span>`,
    });
    b.addEventListener('click', onClick);
    return b;
  };
  toolsRight.append(
    mkTool('content_copy', 'Copy', '', () => {
      clipboard = Object.fromEntries(store.tracks.map((t) => [t.id, [...store.steps(t.id)]]));
      toast('Motif copié');
    }),
    mkTool('content_paste', 'Paste', '', () => {
      if (!clipboard) { toast('Aucun motif dans le presse-papiers'); return; }
      for (const t of store.tracks) {
        const src = clipboard[t.id];
        if (!src) continue;
        src.forEach((v, i) => store.setStepValue(t.id, i, v));
      }
      render();
      toast('Motif collé');
    }),
    mkTool('delete_sweep', 'Clear', 'tool--danger', () => {
      for (const t of store.tracks) store.steps(t.id).fill(0);
      render();
      toast('Motif vidé');
    }),
    toolsSep(),
    mkTool('queue_music', 'Fill Every 4th', 'tool--primary', fillEveryFourth),
  );

  tools.append(toolsLeft, toolsRight);

  // ---------- Légende ----------
  const legend = el('div', { class: 'seq__legend' });
  legend.innerHTML = `
    <span><kbd>Espace</kbd> Play / Pause</span>
    <span><kbd>←</kbd><kbd>→</kbd> Naviguer</span>
    <span><kbd>M</kbd> Mute</span>
    <span><kbd>S</kbd> Solo</span>
    <span><kbd>↑</kbd><kbd>↓</kbd> Changer de piste</span>
    <span><kbd>Clic droit</kbd> Colonne =itempty</span>
  `;

  root.append(rack, tools, legend);

  // ---------- Rendu ----------
  const padRefs = new Map();   // `${trackId}:${index}` → élément
  const numRefs = [];          // numéros de pas
  const rowRefs = new Map();   // trackId → { row, head, mute, solo, vol }

  function renderSteps() {
    clear(stepsRow);
    numRefs.length = 0;
    const count = store.state.length;
    for (let g = 0; g < count / STEPS_PER_BEAT; g++) {
      const grp = el('div', { class: `seq__group ${g % 2 ? 'seq__group--alt' : ''}` });
      for (let s = 0; s < STEPS_PER_BEAT; s++) {
        const i = g * STEPS_PER_BEAT + s;
        const n = el('button', {
          class: `seq__num ${s === 0 ? 'seq__num--beat' : ''}`,
          text: String(i + 1),
          attrs: { title: `Pas ${i + 1}`, tabindex: '-1' },
        });
        n.addEventListener('click', () => onColumnClick(i));
        numRefs.push(n);
        grp.appendChild(n);
      }
      stepsRow.appendChild(grp);
    }
  }

  function renderTrack(track) {
    const row = el('div', { class: 'seq__track', dataset: { id: track.id } });
    row.style.setProperty('--track-color', track.color);
    if (track.id === store.state.selectedTrackId) row.classList.add('is-selected');

    // --- En-tête de piste ---
    const th = el('div', { class: 'track-head' });
    const idBox = el('div', { class: 'track-head__id' });
    idBox.append(el('span', { class: 'track-head__dot' }));
    const txt = el('div', { class: 'track-head__txt' });
    txt.append(
      el('div', { class: 'track-head__name', text: `${track.index}. ${track.name}` }),
      el('div', { class: 'track-head__preset', text: lookupPreset(track.preset)?.name ?? track.preset }),
    );
    idBox.appendChild(txt);

    const ctrl = el('div', { class: 'track-head__ctrl' });
    const mute = el('button', {
      class: 'track-btn is-mute', text: 'M',
      attrs: { 'aria-pressed': String(!!track.mute), title: `Muter ${track.name}`, 'aria-label': `Muter ${track.name}` },
    });
    mute.addEventListener('click', () => toggleMute(track.id));
    const solo = el('button', {
      class: 'track-btn is-solo', text: 'S',
      attrs: { 'aria-pressed': String(!!track.solo), title: `Solo ${track.name}`, 'aria-label': `Solo ${track.name}` },
    });
    solo.addEventListener('click', () => toggleSolo(track.id));
    const vol = el('div', { class: 'track-head__vol', attrs: { title: `Volume ${Math.round(track.volume * 100)} %` } });
    const volFill = el('span');
    volFill.style.width = `${Math.round(track.volume * 100)}%`;
    vol.appendChild(volFill);
    ctrl.append(mute, solo, vol);
    th.append(idBox, ctrl);

    row.addEventListener('click', (e) => {
      if (e.target.closest('.pad') || e.target.closest('.track-btn')) return;
      select(track.id);
    });

    // --- Pads ---
    const pads = el('div', { class: 'seq__pads' });
    const steps = store.steps(track.id);
    const count = store.state.length;

    for (let g = 0; g < count / STEPS_PER_BEAT; g++) {
      const grp = el('div', { class: 'seq__group seq__group--pads' });
      for (let s = 0; s < STEPS_PER_BEAT; s++) {
        const i = g * STEPS_PER_BEAT + s;
        const value = steps[i] ?? 0;
        const pad = el('button', {
          class: `pad ${value === 1 ? 'is-on' : value === GHOST ? 'is-ghost' : ''}`,
          attrs: {
            role: 'checkbox',
            'aria-checked': String(!!value),
            'aria-label': `${track.name} — pas ${i + 1}`,
            title: `${track.name} · pas ${i + 1}`,
          },
          dataset: { track: track.id, step: String(i) },
        });
        pad.appendChild(el('span', { class: 'pad__vel', attrs: { style: `width:${Math.round((value || 1) * 100)}%` } }));

        pad.addEventListener('click', (e) => onPadClick(e, track, i));
        pad.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          fillColumn(i);
        });

        padRefs.set(`${track.id}:${i}`, pad);
        grp.appendChild(pad);
      }
      pads.appendChild(grp);
    }

    row.append(th, pads);
    rowRefs.set(track.id, { row, mute, solo, volFill });
    return row;
  }

  function render() {
    clear(rows);
    padRefs.clear();
    rowRefs.clear();
    for (const t of store.tracks) rows.appendChild(renderTrack(t));
    renderSteps();
    markColumn(store.state.step, false);
  }

  // ---------- Interactions ----------

  function onPadClick(e, track, i) {
    // Clic droit / Alt+clic = note fantôme.
    const isGhost = e.button === 2 || e.altKey;
    if (e.button === 2) return;

    const current = store.steps(track.id)[i];
    let next;
    if (isGhost) next = current === GHOST ? 0 : GHOST;
    else next = current ? 0 : 1;

    store.setStepValue(track.id, i, next);
    patchPad(track.id, i, next);

    if (next) {
      audio.trigger(track.id, null, next);
      flashPad(track.id, i);
    }
    select(track.id);
  }

  function patchPad(trackId, i, value) {
    const pad = padRefs.get(`${trackId}:${i}`);
    if (!pad) return;
    pad.classList.toggle('is-on', value === 1);
    pad.classList.toggle('is-ghost', value === GHOST);
    pad.setAttribute('aria-checked', String(!!value));
    const vel = pad.querySelector('.pad__vel');
    if (vel) vel.style.width = `${Math.round((value || 1) * 100)}%`;
  }

  function flashPad(trackId, i) {
    const pad = padRefs.get(`${trackId}:${i}`);
    if (!pad) return;
    pad.classList.add('is-hit');
    setTimeout(() => pad.classList.remove('is-hit'), 110);
  }

  function fillColumn(i) {
    const rows = store.tracks;
    const fill = !rows.some((t) => store.steps(t.id)[i]);
    for (const t of rows) {
      const next = fill ? (t.cat === 'drums' ? 1 : GHOST) : 0;
      store.setStepValue(t.id, i, next);
      patchPad(t.id, i, next);
    }
    toast(fill ? `Colonne ${i + 1} remplie` : `Colonne ${i + 1} vidée`);
  }

  function fillEveryFourth() {
    for (const t of store.tracks) {
      const steps = store.steps(t.id);
      for (let i = 0; i < steps.length; i++) {
        const next = i % 4 === 0 ? 1 : 0;
        steps[i] = next;
        patchPad(t.id, i, next);
      }
    }
    store.save();
    toast('Fill sur chaque temps');
  }

  function toggleMute(id) {
    const t = store.track(id);
    store.setTrack(id, { mute: !t.mute }, 'track');
    patchRow(id);
    audio.syncFlags(store.tracks);
  }

  function toggleSolo(id) {
    const t = store.track(id);
    store.setTrack(id, { solo: !t.solo }, 'track');
    for (const tr of store.tracks) patchRow(tr.id);
    audio.syncFlags(store.tracks);
  }

  function select(id) {
    store.state.selectedTrackId = id;
    for (const [tid, ref] of rowRefs) ref.row.classList.toggle('is-selected', tid === id);
    store.emit('select', { trackId: id });
  }

  function patchRow(id) {
    const ref = rowRefs.get(id);
    const t = store.track(id);
    if (!ref || !t) return;
    ref.mute.setAttribute('aria-pressed', String(!!t.mute));
    ref.solo.setAttribute('aria-pressed', String(!!t.solo));
    ref.volFill.style.width = `${Math.round(t.volume * 100)}%`;
    ref.row.classList.toggle('is-muted', !!t.mute);
  }

  // ---------- Lecture / playhead ----------

  function markColumn(i, live = true) {
    for (const n of numRefs) n.classList.remove('is-current');

    // Faisceau
    if (i < 0 || i >= store.state.length) {
      beam.classList.remove('is-live');
      beam.style.left = '0px';
      for (const pad of padRefs.values()) pad.classList.remove('is-column');
      return;
    }

    const num = numRefs[i];
    num?.classList.add('is-current');
    if (live) num?.querySelector('.seq__num-ping') ?? num?.appendChild(el('span', { class: 'seq__num-ping' }));

    // Position du faisceau : colonne piste (256) + padding + groupes accumulés.
    const padW = num?.offsetWidth || 40;
    const groupGap = 6;
    const padPad = 6;
    const groups = Math.floor(i / STEPS_PER_BEAT);
    const inGroup = i % STEPS_PER_BEAT;
    const rackPad = 14;
    const left = rackPad + parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--seq-head-w'))
      + 10 + groups * (4 * (padW + groupGap) + padPad + groupGap) + inGroup * (padW + groupGap);
    beam.style.left = `${left}px`;
    beam.classList.toggle('is-live', live);

    for (const [key, pad] of padRefs) {
      pad.classList.toggle('is-column', Number(key.split(':')[1]) === i);
    }
  }

  /** Appelé par le transport à chaque pas. */
  function onStep(i, liveTracks = []) {
    markColumn(i, true);
    for (const id of liveTracks) flashPad(id, i);
  }

  // ---------- Glisser-déposer ----------
  for (const node of [head, rows]) {
    node.addEventListener('dragover', (e) => {
      if (!e.dataTransfer.types.includes('text/alpha-preset')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    node.addEventListener('drop', (e) => {
      const preset = e.dataTransfer.getData('text/alpha-preset');
      if (!preset) return;
      e.preventDefault();
      onDropPreset(preset, e);
    });
  }

  // ---------- Réactions aux mutations ----------
  store.on('track', ({ trackId }) => {
    if (trackId) patchRow(trackId);
  });
  store.on('pattern', render);
  store.on('reset', render);
  store.on('select', ({ trackId }) => {
    for (const [tid, ref] of rowRefs) ref.row.classList.toggle('is-selected', tid === trackId);
  });

  // ---------- Toast local ----------
  let toastEl = null;
  let toastTimer = 0;
  function toast(msg) {
    if (!toastEl) {
      toastEl = el('div', { class: 'toast', attrs: { role: 'status', 'aria-live': 'polite' } });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 1800);
  }

  render();

  return { root, render, onStep, patchRow, select, fillEveryFourth, toggleMute, toggleSolo };
}

function toolsSep() {
  return el('div', { class: 'tools-sep', attrs: { 'aria-hidden': 'true' } });
}

export { waveShape, hashSeed };
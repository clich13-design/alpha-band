// =============================================================
// ALPHA-Band — Module Arrangement
// -------------------------------------------------------------
// Timeline de clips : en-têtes de piste (200px) + grille de
// mesures (120px), playhead, clips glissables, inspecteur bas.
// Posé sur <section data-arrangement>.
// =============================================================

import { el, clear, waveShape, hashSeed, formatClock } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { audio } from '../core/audio.js';

const BAR_W = 120;          // px par mesure — doit rester synchro avec --bar-w
const SUB = 4;              // pas par temps (1/16)

export function createArrangement(root, store, opts = {}) {
  const onOpenMixer = opts.onOpenMixer ?? (() => {});
  const onDropPreset = opts.onDropPreset ?? (() => {});
  const onUndo = opts.onUndo ?? (() => {});
  const onRedo = opts.onRedo ?? (() => {});
  const onSave = opts.onSave ?? (() => {});

  clear(root);
  root.className = 'arrangement';

  // ---------- En-tête de zone ----------
  const head = el('div', { class: 'zone-head' });
  const left = el('div', { class: 'zone-head__left' });
  const titleBox = el('div', { class: 'zone-head__title' });
  titleBox.append(el('span', { class: 'dot dot--live' }), el('h1', { class: 'h-display', text: 'Arrangement' }));
  left.append(titleBox, el('span', { class: 'chip', text: `${store.state.bars} Bars / 4-4 Time` }));

  const right = el('div', { class: 'zone-head__right' });
  right.innerHTML = `<span class="zone-head__stat">Voix actives <b data-voices>0 / 0</b></span>`;
  const btnMixer = el('button', {
    class: 'btn btn--sm',
    html: `${icon('tune', { size: 14 })}<span>Mixer View</span>`,
  });
  btnMixer.addEventListener('click', onOpenMixer);
  right.append(btnMixer);
  head.append(left, right);

  // ---------- Timeline ----------
  const timeline = el('div', { class: 'timeline' });

  const heads = el('div', { class: 'tl-heads' });
  const headsRuler = el('div', { class: 'tl-heads__ruler' });
  headsRuler.append(el('span', { class: 'lbl', text: 'Pistes' }), el('span', { class: 'lbl', text: 'M · S' }));
  heads.appendChild(headsRuler);

  const scroll = el('div', { class: 'tl-scroll' });
  const ruler = el('div', { class: 'tl-ruler' });
  const rows = el('div', { class: 'tl-rows', id: 'arr-rows' });
  const playhead = el('div', { class: 'playhead', attrs: { 'aria-hidden': 'true' } });
  playhead.appendChild(el('div', { class: 'playhead__cap' }));
  scroll.append(ruler, rows, playhead);

  timeline.append(heads, scroll);

  // ---------- Inspecteur ----------
  const inspector = el('div', { class: 'inspector' });
  const iLeft = el('div', { class: 'inspector__group' });

  const grpSwing = el('div', { class: 'inspector__ctrl' });
  grpSwing.appendChild(el('span', { class: 'lbl', text: 'Swing' }));
  const swingRange = el('input', {
    class: 'range',
    attrs: { type: 'range', min: '50', max: '75', value: String(store.state.swing), 'aria-label': 'Swing' },
  });
  const swingVal = el('span', { class: 'inspector__val', text: `${store.state.swing}%` });
  swingRange.addEventListener('input', () => {
    swingVal.textContent = `${swingRange.value}%`;
    store.set('swing', Number(swingRange.value), 'swing');
  });
  grpSwing.append(swingRange, swingVal);

  const grpTempo = el('div', { class: 'inspector__ctrl' });
  grpTempo.appendChild(el('span', { class: 'lbl', text: 'Tempo' }));
  const tempoVal = el('span', { class: 'inspector__val', text: store.state.bpm.toFixed(1) });
  grpTempo.appendChild(tempoVal);

  const grpClock = el('div', { class: 'inspector__ctrl' });
  grpClock.appendChild(el('span', { class: 'lbl', text: 'Clock' }));
  const clockVal = el('span', { class: 'inspector__val', text: '00:00.00' });
  grpClock.appendChild(clockVal);

  iLeft.append(grpSwing, sep(), grpTempo, sep(), grpClock);

  const iRight = el('div', { class: 'inspector__group inspector__group--right' });

  const btnUndo = mkBtn('undo', 'Annuler', onUndo);
  const btnRedo = mkBtn('redo', 'Rétablir', onRedo);
  const btnSave = mkBtn('save', 'Save', onSave);
  iRight.append(btnUndo, btnRedo, btnSave);

  inspector.append(iLeft, iRight);

  root.append(head, timeline, inspector);

  // =============================================================
  // Rendu
  // =============================================================

  const rowRefs = new Map();

  function renderRuler() {
    clear(ruler);
    const bars = store.state.bars;
    const frag = document.createDocumentFragment();
    for (let b = 0; b < bars; b++) {
      const bar = el('div', { class: `tl-ruler__bar ${b % 2 ? 'tl-ruler__bar--alt' : ''}` });
      bar.style.width = `${BAR_W}px`;
      bar.appendChild(el('span', { class: 'tl-ruler__num', text: String(b + 1).padStart(3, '0') }));
      frag.appendChild(bar);
    }
    ruler.appendChild(frag);
    ruler.style.width = `${bars * BAR_W}px`;
  }

  function renderHeads() {
    // On ne touche que la zone sous la règle.
    while (heads.children.length > 1) heads.lastChild.remove();

    for (const t of store.tracks) {
      const h = el('div', {
        class: `tl-head ${t.id === store.state.selectedTrackId ? 'is-selected' : ''}`,
        dataset: { id: t.id },
        attrs: { role: 'button', tabindex: '0' },
      });
      h.style.setProperty('--track-color', t.color);

      h.append(el('span', { class: 'tl-head__stripe' }));
      h.append(el('span', { class: 'tl-head__num', text: String(t.index).padStart(2, '0') }));

      const txt = el('div', { class: 'tl-head__txt' });
      txt.append(
        el('div', { class: 'tl-head__name', text: t.name }),
        el('div', { class: 'tl-head__kind', text: t.kind }),
      );
      h.appendChild(txt);

      const btns = el('div', { class: 'tl-head__btns' });
      const mute = el('button', {
        class: 'tl-toggle is-mute', text: 'M',
        attrs: { 'aria-pressed': String(!!t.mute), title: `Muter ${t.name}`, 'aria-label': `Muter ${t.name}` },
      });
      mute.addEventListener('click', (e) => { e.stopPropagation(); toggleMute(t.id); });
      const solo = el('button', {
        class: 'tl-toggle is-solo', text: 'S',
        attrs: { 'aria-pressed': String(!!t.solo), title: `Solo ${t.name}`, 'aria-label': `Solo ${t.name}` },
      });
      solo.addEventListener('click', (e) => { e.stopPropagation(); toggleSolo(t.id); });
      btns.append(mute, solo);
      h.appendChild(btns);

      h.addEventListener('click', () => select(t.id));
      h.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(t.id); }
      });

      heads.appendChild(h);
      rowRefs.set(t.id, { head: h, mute, solo });
    }
  }

  function renderRows() {
    clear(rows);
    rows.style.width = `${store.state.bars * BAR_W}px`;
    rowRefs.clear();

    for (const t of store.tracks) {
      const row = el('div', { class: 'tl-row', dataset: { id: t.id } });
      const clips = store.state.clips.filter((c) => c.track === t.id);
      for (const clip of clips) {
        row.appendChild(renderClip(clip, t));
      }
      rows.appendChild(row);
    }
    renderHeads();
  }

  function renderClip(clip, track) {
    const node = el('div', {
      class: 'clip',
      dataset: { clip: clip.id },
      attrs: { title: `${clip.label} — glisser pour déplacer` },
    });
    node.style.setProperty('--clip-color', track.color);
    node.style.left = `${clip.start * (BAR_W / SUB)}px`;
    node.style.width = `${(clip.len * BAR_W) / SUB}px`;

    node.append(el('span', { class: 'clip__label', text: clip.label }));

    const wave = el('div', { class: 'clip__wave', attrs: { 'aria-hidden': 'true' } });
    node.appendChild(wave);
    node.append(el('span', { class: 'clip__len', text: `${clip.len / SUB} bars` }));

    const bars = Math.min(28, Math.max(4, Math.round(clip.len / SUB) * 3));
    waveShape(bars, hashSeed(clip.id)).forEach((h) => {
      wave.appendChild(el('span', { attrs: { style: `height:${Math.round(h * 92)}%` } }));
    });

    // Drag horizontal → déplacement en pas de 1/16
    node.draggable = true;
    node.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/alpha-clip', clip.id);
      e.dataTransfer.effectAllowed = 'move';
      node.classList.add('is-selected');
    });
    node.addEventListener('dragend', () => node.classList.remove('is-selected'));
    node.addEventListener('dblclick', () => audio.preview(track.preset));

    return node;
  }

  function render() {
    renderRuler();
    renderRows();
    repaintStats();
  }

  function repaintStats() {
    const s = store.state;
    const chip = head.querySelector('.chip');
    chip.textContent = `${s.bars} Bars / 4-4 Time`;
    tempoVal.textContent = s.bpm.toFixed(1);
    swingRange.value = String(s.swing);
    swingVal.textContent = `${s.swing}%`;
    const voices = head.querySelector('[data-voices]');
    if (voices) voices.textContent = `${s.trackDefs.length} / ${s.trackDefs.length}`;
  }

  // ---------- Playhead ----------
  function setPlayhead(step) {
    const x = (step / SUB) * (BAR_W / SUB);
    playhead.style.left = `${x}px`;
  }

  function setClock(sec) {
    clockVal.textContent = formatClock(sec);
  }

  // ---------- Mutations ----------
  function select(id) {
    store.state.selectedTrackId = id;
    for (const [tid, ref] of rowRefs) ref.head.classList.toggle('is-selected', tid === id);
    store.emit('select', { trackId: id });
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

  function patchRow(id) {
    const ref = rowRefs.get(id);
    const t = store.track(id);
    if (!ref || !t) return;
    ref.mute.setAttribute('aria-pressed', String(!!t.mute));
    ref.solo.setAttribute('aria-pressed', String(!!t.solo));
  }

  // ---------- Glisser-déposer ----------
  for (const node of [heads, rows]) {
    node.addEventListener('dragover', (e) => {
      const types = [...e.dataTransfer.types];
      if (!types.includes('text/alpha-preset') && !types.includes('text/alpha-clip')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = types.includes('text/alpha-clip') ? 'move' : 'copy';
    });
    node.addEventListener('drop', (e) => {
      const preset = e.dataTransfer.getData('text/alpha-preset');
      const clipId = e.dataTransfer.getData('text/alpha-clip');
      e.preventDefault();

      if (preset) { onDropPreset(preset, e); return; }

      if (clipId) {
        const rect = rows.getBoundingClientRect();
        const start = Math.max(0, Math.round((e.clientX - rect.left) / (BAR_W / SUB)));
        const clip = store.state.clips.find((c) => c.id === clipId);
        if (clip) {
          clip.start = start;
          store.save();
          renderRows();
        }
      }
    });
  }

  // ---------- Abonnements ----------
  store.on('track', ({ trackId }) => { if (trackId) patchRow(trackId); });
  store.on('swing', repaintStats);
  store.on('bpm', repaintStats);
  store.on('reset', render);

  render();
  setPlayhead(0);

  return { root, render, repaintStats, setPlayhead, setClock, patchRow, select };
}

function sep() {
  return el('div', { class: 'inspector__sep', attrs: { 'aria-hidden': 'true' } });
}

function mkBtn(iconName, label, onClick) {
  const b = el('button', { class: 'btn', html: `${icon(iconName, { size: 14 })}<span>${label}</span>` });
  b.addEventListener('click', onClick);
  return b;
}
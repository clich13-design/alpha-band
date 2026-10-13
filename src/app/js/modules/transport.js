// =============================================================
// ALPHA-Band — Module Transport
// -------------------------------------------------------------
// Barre de 72px : marque, menus, lecture, tempo, position,
// patterns A/B/C/D, vu-mètres, master, export.
// Posé sur <header data-transport>.
// =============================================================

import { el, clear, formatDb, formatClock, formatPos } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { audio } from '../core/audio.js';

const BPM_MIN = 40;
const BPM_MAX = 240;

export function createTransport(root, store, opts = {}) {
  const view = opts.view ?? 'arrangement';
  const onOpenMixer = opts.onOpenMixer ?? (() => {});
  const onNavigate = opts.onNavigate ?? (() => {});
  const onSave = opts.onSave ?? (() => {});

  clear(root);
  root.className = 'transport';

  // ---------- Marque + menus ----------
  const brand = el('div', { class: 'transport__brand' });
  brand.innerHTML = `
    <div class="brand-mark">${icon('graphic_eq', { size: 18 })}</div>
    <span class="brand-name">ALPHA-Band</span>
    <span class="brand-proj" data-proj></span>
  `;

  const menus = el('nav', { class: 'transport__menus', attrs: { 'aria-label': 'Menus principaux' } });
  const MENU = [
    { id: 'file',  label: 'File' },
    { id: 'edit',  label: 'Edit' },
    { id: 'track', label: 'Track', page: true },
    { id: 'mixer', label: 'Mixer' },
    { id: 'window', label: 'Window' },
  ];
  for (const m of MENU) {
    const a = el('a', {
      class: 'menu-item',
      text: m.label,
      attrs: { href: '#' },
    });
    if (m.page) a.setAttribute('aria-current', 'page');
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (m.id === 'mixer') { onOpenMixer(); return; }
      onNavigate(m.id);
    });
    menus.appendChild(a);
  }

  // ---------- Bloc transport ----------
  const tp = el('div', { class: 'tp', attrs: { role: 'group', 'aria-label': 'Transport' } });

  // Lecture
  const grpPlay = el('div', { class: 'tp__group' });
  const btnStop = mk('tp-btn tp-btn--stop', 'stop', 'Stop', () => opts.onStop?.());
  const btnPlay = mk('tp-btn tp-btn--play', 'play_arrow', 'Lecture / Pause (Espace)', () => opts.onTogglePlay?.());
  const btnRec = mk('tp-btn tp-btn--rec', 'record', 'Enregistrement', () => opts.onToggleRecord?.());
  const btnLoop = mk('tp-btn tp-btn--loop', 'repeat', 'Boucle', () => opts.onToggleLoop?.());
  grpPlay.append(btnStop, btnPlay, btnRec, btnLoop);

  // Tempo
  const tempo = el('div', { class: 'tempo' });
  tempo.innerHTML = `
    <span class="lbl">Tempo</span>
    <div class="tempo__readout">
      <span class="tempo__val" data-bpm-val>0.00</span>
      <span class="tempo__unit">BPM</span>
    </div>
  `;
  const nudge = el('div', { class: 'tempo__nudge' });
  const inc = el('button', { text: '▲', attrs: { title: 'Tempo +1', 'aria-label': 'Augmenter le tempo' } });
  const dec = el('button', { text: '▼', attrs: { title: 'Tempo -1', 'aria-label': 'Diminuer le tempo' } });
  inc.addEventListener('click', () => nudgeBpm(+1));
  dec.addEventListener('click', () => nudgeBpm(-1));
  nudge.append(inc, dec);

  const btnTap = el('button', { class: 'btn btn--tap', text: 'Tap', attrs: { title: 'Tap tempo' } });
  btnTap.addEventListener('click', onTap);
  tempo.append(nudge, btnTap);

  // Position
  const pos = el('div', { class: 'tp-pos' });
  pos.innerHTML = `<span class="lbl">Bar</span><span class="tp-pos__val" data-pos>001.01.00</span>`;

  // Patterns
  const patterns = el('div', { class: 'patterns', attrs: { role: 'group', 'aria-label': 'Patterns' } });
  for (const key of ['A', 'B', 'C', 'D']) {
    const tab = el('button', {
      class: 'patterns__tab',
      text: key,
      attrs: { title: `Pattern ${key}`, 'aria-pressed': String(key === store.state.pattern) },
      dataset: { pattern: key },
    });
    tab.addEventListener('click', () => {
      store.set('pattern', key, 'pattern');
      store.emit('transport:repaint', {});
    });
    patterns.appendChild(tab);
  }

  tp.append(grpPlay, sep(), tempo, sep(), pos, sep(), patterns);

  // ---------- Actions de droite ----------
  const actions = el('div', { class: 'transport__actions' });

  const readouts = el('div', { class: 'transport__readouts' });
  readouts.innerHTML = `
    <div class="tp-readout">
      <div class="tp-readout__k">Memory</div>
      <div class="tp-readout__v" data-mem>42%</div>
    </div>
    <div class="tp-readout">
      <div class="tp-readout__k">Elapsed</div>
      <div class="tp-readout__v" data-elapsed>00:00.00</div>
    </div>
  `;

  const master = el('div', { class: 'tp-master', attrs: { title: 'Volume général' } });
  master.innerHTML = `${icon('volume_up', { size: 14 })}`;
  const masterRange = el('input', {
    class: 'range',
    attrs: { type: 'range', min: '0', max: '100', value: String(Math.round(store.state.masterVolume * 100)), 'aria-label': 'Volume général' },
  });
  const masterVal = el('span', { class: 'tp-master__val', text: formatDb(store.state.masterVolume) });
  masterRange.addEventListener('input', () => {
    const v = masterRange.value / 100;
    store.set('masterVolume', v, 'master');
  });
  master.append(masterRange, masterVal);

  const btnSidebar = el('button', {
    class: 'ibtn',
    html: icon('panel', { size: 18 }),
    attrs: { title: 'Afficher / masquer la bibliothèque', 'aria-label': 'Basculer la bibliothèque' },
  });
  btnSidebar.addEventListener('click', () => opts.onToggleSidebar?.());

  const btnUndo = mk('ibtn', 'undo', 'Annuler', () => opts.onUndo?.());
  const btnRedo = mk('ibtn', 'redo', 'Rétablir', () => opts.onRedo?.());

  const btnSave = el('button', { class: 'btn btn--save', text: 'Save', attrs: { title: 'Enregistrer le projet' } });
  btnSave.addEventListener('click', () => { store.save(); onSave(); });

  const btnExport = el('button', {
    class: 'btn btn--export',
    html: `${icon('download', { size: 14 })}<span>Export</span>`,
    attrs: { title: 'Exporter le mixage (WAV)' },
  });
  btnExport.addEventListener('click', () => opts.onExport?.());

  actions.append(readouts, master, btnSidebar, btnUndo, btnRedo, btnSave, btnExport);

  root.append(brand, menus, tp, actions);

  // ---------- Logique tempo ----------
  let tapTimes = [];

  function nudgeBpm(delta) {
    const next = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(store.state.bpm + delta)));
    store.set('bpm', next, 'bpm');
  }

  function onTap() {
    const now = performance.now();
    tapTimes = tapTimes.filter((t) => now - t < 2400);
    tapTimes.push(now);
    if (tapTimes.length >= 2) {
      const gaps = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const bpm = Math.round(60000 / avg);
      if (bpm >= BPM_MIN && bpm <= BPM_MAX) store.set('bpm', bpm, 'bpm');
    }
  }

  // ---------- Rafraîchissement ----------
  const refs = {
    proj: root.querySelector('[data-proj]'),
    bpm: root.querySelector('[data-bpm-val]'),
    pos: root.querySelector('[data-pos]'),
    mem: root.querySelector('[data-mem]'),
    elapsed: root.querySelector('[data-elapsed]'),
  };

  function repaint() {
    const s = store.state;
    refs.proj.textContent = s.project;
    refs.bpm.textContent = s.bpm.toFixed(2);
    refs.pos.textContent = formatPos(s.step, s.length);

    let active = 0;
    let total = 0;
    for (const key of ['A', 'B', 'C', 'D']) {
      for (const t of s.trackDefs) {
        const row = s.patterns[key][t.id];
        if (!row) continue;
        total += row.length;
        active += row.reduce((a, v) => a + (v ? 1 : 0), 0);
      }
    }
    refs.mem.textContent = `${total ? Math.round((active / total) * 100) : 0}%`;

    for (const tab of patterns.children) {
      tab.setAttribute('aria-pressed', String(tab.dataset.pattern === s.pattern));
    }

    btnPlay.classList.toggle('is-playing', s.playing);
    btnPlay.setAttribute('aria-pressed', String(s.playing));
    btnRec.classList.toggle('is-armed', s.recording);
    btnRec.setAttribute('aria-pressed', String(s.recording));
    btnLoop.classList.toggle('is-active', s.loop);
    btnLoop.setAttribute('aria-pressed', String(s.loop));

    masterRange.value = String(Math.round(s.masterVolume * 100));
    masterVal.textContent = formatDb(s.masterVolume);
  }

  // Position + elapsed sont rafraîchis à chaque pas de lecture.
  store.on('step', repaint);
  store.on('transport:repaint', repaint);
  for (const evt of ['bpm', 'master', 'loop', 'record', 'play', 'state', 'reset', 'pattern']) store.on(evt, repaint);

  repaint();

  return { repaint, root };
}

function sep() {
  return el('div', { class: 'tp__sep', attrs: { 'aria-hidden': 'true' } });
}

function mk(cls, iconName, title, onClick) {
  const b = el('button', { class: cls, html: icon(iconName, { size: 16 }), attrs: { title, 'aria-label': title } });
  b.addEventListener('click', onClick);
  return b;
}

export { audio, formatClock };
// =============================================================
// ALPHA-Band — Module Mixer
// -------------------------------------------------------------
// Deux rendus à partir du même état :
//   createMixerRack()  — rack complet (inserts, pan, fader, master)
//   createMixerMini()  — colonne compacte (colonne droite)
// Les vumètres sont alimentés par l'analyseur Tone.js.
// =============================================================

import { el, clear, formatDb, bindFader, waveShape, hashSeed } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { audio } from '../core/audio.js';

const SCALE = ['+6', '0', '-6', '-12', '-24', '-∞'];

// Vumètres : simulation de repli quand l'audio n'est pas démarré.
let meterPhase = 0;

/** Retourne un niveau 0..1 pour une piste donnée (mode visuel). */
function fakeLevel(track, t) {
  const base = track.volume;
  const wobble = 0.5 + 0.5 * Math.sin(t * 3.1 + hashSeed(track.id) % 7);
  const gate = Math.sin(t * 0.7 + hashSeed(track.id) % 3) > 0.2 ? 1 : 0.12;
  return Math.max(0.04, Math.min(1, base * (0.35 + wobble * 0.65) * gate));
}

// =============================================================
// Rack complet
// =============================================================

export function createMixerRack(root, store, opts = {}) {
  clear(root);
  root.className = 'mixer';

  // ---------- Barre d'état ----------
  const head = el('div', { class: 'rack-head' });
  const titleBox = el('div');
  titleBox.append(
    el('div', { class: 'rack-head__title', text: 'Mixer Rack' }),
    el('div', { class: 'rack-head__sub', text: `${store.tracks.length} pistes actives` }),
  );

  const right = el('div', { class: 'rack-head__right' });
  const filterSeg = el('div', { class: 'seg' });
  for (const f of ['All Strips', 'Audio Only', 'Instruments']) {
    const b = el('button', {
      class: 'seg__item',
      text: f,
      attrs: { 'aria-pressed': String(f === 'All Strips'), style: 'padding:0 10px' },
    });
    b.addEventListener('click', () => {
      for (const o of filterSeg.children) o.setAttribute('aria-pressed', String(o === b));
    });
    filterSeg.appendChild(b);
  }
  right.append(
    el('span', { class: 'lbl', text: 'Meter Scale' }),
    el('span', { class: 'chip', text: 'K-14 RMS' }),
    el('span', { class: 'lbl', text: 'Peak Hold' }),
    el('span', { class: 'chip chip--ok', text: '3.0s' }),
    filterSeg,
  );
  head.append(titleBox, right);

  // ---------- Bandes ----------
  const strips = el('div', { class: 'strips', attrs: { role: 'group', 'aria-label': 'Bandes de mixage' } });
  const stripRefs = new Map();

  for (const t of store.tracks) {
    const strip = el('div', {
      class: 'strip',
      dataset: { id: t.id },
      attrs: { role: 'group', 'aria-label': `Bande ${t.name}` },
    });
    strip.style.setProperty('--track-color', t.color);

    // Entête
    const sHead = el('div', { class: 'strip__head' });
    sHead.append(el('span', { class: 'strip__num', text: String(t.index).padStart(2, '0') }));
    sHead.append(el('div', { class: 'strip__icon', html: icon(catIcon(t.cat), { size: 12 }) }));
    sHead.append(el('div', { class: 'strip__name', text: t.name }));
    const menu = el('button', {
      class: 'ibtn strip__menu',
      html: icon('more_vert', { size: 14 }),
      attrs: { 'aria-label': `Options de ${t.name}`, title: 'Options' },
    });
    sHead.appendChild(menu);
    strip.append(sHead, el('div', { class: 'strip__kind', text: t.kind }));

    // Inserts
    const ins = el('div', { class: 'ins' });
    const insLabel = el('div', { class: 'ins__label' });
    insLabel.append(
      el('span', { class: 'lbl', text: 'Inserts' }),
      el('span', { class: 'lbl', text: `+${4 - t.inserts.length}` }),
    );
    ins.appendChild(insLabel);
    for (const name of t.inserts.slice(0, 4)) {
      ins.appendChild(el('div', {
        class: 'ins__slot',
        text: name,
        attrs: { role: 'button', tabindex: '0', title: `${name} — cliquer pour bypasser` },
      }));
    }
    if (t.inserts.length < 4) {
      ins.appendChild(el('div', { class: 'ins__slot ins__slot--empty', text: '+ Add Slot' }));
    }
    // Bypass des inserts (état visuel uniquement en V1)
    ins.addEventListener('click', (e) => {
      const slot = e.target.closest('.ins__slot');
      if (slot && !slot.classList.contains('ins__slot--empty')) slot.classList.toggle('is-bypass');
    });
    strip.appendChild(ins);

    // Pan
    const panRow = el('div', { class: 'pan-row' });
    panRow.append(el('span', { class: 'lbl', text: 'Pan' }));
    const panVal = el('span', { class: 'pan-val', text: panText(t.pan) });
    panRow.appendChild(panVal);

    const btns = el('div', { class: 'strip__btns' });
    const bMute = mkBtn('is-mute', 'M', 'Mute', !!t.mute, () => toggle(t.id, 'mute'));
    const bSolo = mkBtn('is-solo', 'S', 'Solo', !!t.solo, () => toggle(t.id, 'solo'));
    const bRec = mkBtn('is-rec', 'R', 'Armer l\'enregistrement', false, () => store.emit('mixer:arm', { trackId: t.id }));
    btns.append(bMute, bSolo, bRec);
    panRow.appendChild(btns);
    strip.appendChild(panRow);

    const panRange = el('input', {
      class: 'range',
      attrs: { type: 'range', min: '-100', max: '100', value: String(Math.round((t.pan ?? 0) * 100)), 'aria-label': `Pan ${t.name}` },
      style: 'flex:1',
    });
    panRange.addEventListener('input', () => {
      const v = panRange.value / 100;
      store.setTrack(t.id, { pan: v }, 'track');
      panVal.textContent = panText(v);
      audio.setPan(t.id, v);
    });
    strip.appendChild(panRange);

    // Fader + vumètres
    const faderRow = el('div', { class: 'strip__fader' });
    const faderEl = el('div', { class: 'fader', attrs: { title: `Volume ${t.name}` } });
    faderEl.append(el('div', { class: 'fader__fill' }), el('div', { class: 'fader__cap' }));
    const fader = bindFader(faderEl, {
      value: t.volume,
      label: `Volume ${t.name}`,
      onChange: (v) => {
        store.setTrack(t.id, { volume: v }, 'track');
        dbEl.textContent = formatDb(v);
        audio.setVolume(t.id, v);
      },
    });

    const meters = el('div', { class: 'strip__meters' });
    const mL = el('div', { class: 'meter' });
    mL.append(el('div', { class: 'meter__level' }), el('div', { class: 'meter__peak' }));
    const mR = el('div', { class: 'meter' });
    mR.append(el('div', { class: 'meter__level' }), el('div', { class: 'meter__peak' }));
    meters.append(mL, mR);

    faderRow.append(faderEl, meters);
    strip.appendChild(faderRow);

    // Échelle + lecture
    const scale = el('div', { class: 'strip__scale' });
    for (const s of SCALE) scale.appendChild(el('span', { text: s }));
    strip.appendChild(scale);

    const dbEl = el('div', { class: 'strip__db', text: formatDb(t.volume) });
    strip.appendChild(dbEl);

    strip.addEventListener('click', (e) => {
      if (e.target.closest('.strip__btn') || e.target.closest('.ins__slot') || e.target.closest('.range')) return;
      store.state.selectedTrackId = t.id;
      store.emit('select', { trackId: t.id });
      for (const [tid, ref] of stripRefs) ref.strip.classList.toggle('is-selected', tid === t.id);
    });

    strips.appendChild(strip);
    stripRefs.set(t.id, {
      strip, fader, dbEl, panVal, bMute, bSolo,
      lvlL: mL.querySelector('.meter__level'),
      lvlR: mR.querySelector('.meter__level'),
      peakL: mL.querySelector('.meter__peak'),
      peakR: mR.querySelector('.meter__peak'),
    });
  }

  // ---------- Bus master ----------
  const master = el('div', { class: 'master' });
  const mHead = el('div', { class: 'master__head' });
  mHead.innerHTML = `
    <div class="master__icon" style="color:var(--primary)">${icon('volume_up', { size: 15 })}</div>
    <div class="master__title">Master Bus</div>
    <div class="master__online"><span class="dot dot--live"></span>Online</div>
  `;
  master.appendChild(mHead);
  master.append(el('div', { class: 'rack-head__sub', text: '24-bit / 48k' }));

  const grid = el('dl', { class: 'master__grid' });
  const cells = [
    ['Intég. LUFS', '-14.2', 'is-ok'],
    ['Cible', '-14', ''],
    ['True Peak', '-0.3', 'is-warn'],
    ['Plafond', '-0.1', ''],
  ];
  for (const [k, v, cls] of cells) {
    const cell = el('div', { class: 'master__cell' });
    cell.append(el('dt', { text: k }), el('dd', { class: cls, text: v }));
    grid.appendChild(cell);
  }
  master.appendChild(grid);

  const mFaderRow = el('div', { class: 'master__fader-row' });
  const mFaderEl = el('div', { class: 'fader', attrs: { title: 'Volume master' } });
  mFaderEl.append(el('div', { class: 'fader__fill' }), el('div', { class: 'fader__cap' }));
  const mDb = el('div', { class: 'strip__db', text: formatDb(store.state.masterVolume), style: 'width:64px;align-self:center' });
  const mFader = bindFader(mFaderEl, {
    value: store.state.masterVolume,
    label: 'Volume master',
    onChange: (v) => {
      store.set('masterVolume', v, 'master');
      mDb.textContent = formatDb(v);
      audio.setMaster(v);
    },
  });

  const mMeters = el('div', { class: 'master__meters' });
  const mmL = el('div', { class: 'meter' });
  mmL.append(el('div', { class: 'meter__level' }), el('div', { class: 'meter__peak' }));
  const mmR = el('div', { class: 'meter' });
  mmR.append(el('div', { class: 'meter__level' }), el('div', { class: 'meter__peak' }));
  mMeters.append(mmL, mmR);

  mFaderRow.append(mFaderEl, mDb, mMeters);
  master.appendChild(mFaderRow);

  const aux = el('div', { class: 'master__aux' });
  for (const label of ['Width 100%', 'Mono Sum', 'Stereo', 'Dim (-20dB)', 'Mute All']) {
    const b = el('button', { class: 'btn', text: label, attrs: { 'aria-pressed': label === 'Stereo' } });
    b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
    aux.appendChild(b);
  }
  master.appendChild(aux);
  strips.appendChild(master);

  // ---------- Pied ----------
  const foot = el('div', { class: 'rack-foot' });
  foot.innerHTML = `
    <span class="dot dot--live"></span>
    <span>Moteur audio : <b data-engine>CoreAudio (Low Latency 64 spls / 1.3ms)</b></span>
    <span>Charge DSP : <b data-load>18%</b></span>
    <span>RAM : <b>3.4 GB</b></span>
    <span>Headroom : <b>+2.1 dB</b></span>
  `;
  const footRight = el('div', { class: 'rack-foot__right' });
  const loadBar = el('div', { class: 'rack-foot__load' });
  loadBar.appendChild(el('span', { style: 'width:18%' }));
  footRight.append(el('span', { text: 'Clear Peak Clips' }), loadBar);
  foot.appendChild(footRight);

  root.append(head, strips, foot);

  // ---------- Actions ----------
  function toggle(id, key) {
    const t = store.track(id);
    store.setTrack(id, { [key]: !t[key] }, 'track');
    patch(id);
    audio.syncFlags(store.tracks);
  }

  function patch(id) {
    const ref = stripRefs.get(id);
    const t = store.track(id);
    if (!ref || !t) return;
    ref.bMute.setAttribute('aria-pressed', String(!!t.mute));
    ref.bSolo.setAttribute('aria-pressed', String(!!t.solo));
    ref.strip.classList.toggle('is-muted', !!t.mute);
  }

  // ---------- Boucle de vumètres ----------
  let raf = 0;
  const peaks = new Map();     // peak-hold (remonte vite, descend lentement)
  const levels = new Map();    // ballistique VU (relâchement progressif)
  const footLoad = foot.querySelector('[data-load]');
  const footEngine = foot.querySelector('[data-engine]');

  function tick() {
    const t = performance.now() / 1000;
    meterPhase += 1;
    const real = audio.available ? audio.peak() : 0;

    for (const track of store.tracks) {
      const ref = stripRefs.get(track.id);
      if (!ref) continue;

      const audible = store.hasSolo(track.id) && !track.mute;
      const target = audible ? (audio.available ? real : fakeLevel(track, t)) : 0;

      // Ballistique VU : attaque immédiate, relâchement ~120 ms.
      const prev = levels.get(track.id) ?? 0;
      const level = target > prev ? target : prev * 0.86;
      levels.set(track.id, level);

      const h = Math.round(Math.min(1, level ** 0.6) * 100);
      ref.lvlL.style.height = `${h}%`;
      ref.lvlR.style.height = `${Math.round(h * 0.94)}%`;

      // Peak-hold : monte vite, redescend très lentement (≈3 s).
      const pPrev = peaks.get(track.id) ?? 0;
      const next = target > pPrev ? target : pPrev * 0.995;
      peaks.set(track.id, next);
      ref.peakL.style.bottom = `${Math.min(99, Math.round(next ** 0.6 * 100))}%`;
      ref.peakR.style.bottom = `${Math.min(99, Math.round(next ** 0.6 * 96))}%`;
    }

    const mTarget = audio.available ? Math.min(1, real * 1.1) : 0.42;
    const mPrev = levels.get('__master__') ?? 0;
    const mLevel = mTarget > mPrev ? mTarget : mPrev * 0.86;
    levels.set('__master__', mLevel);
    const mh = Math.round(mLevel * 100);

    mmL.querySelector('.meter__level').style.height = `${mh}%`;
    mmR.querySelector('.meter__level').style.height = `${Math.round(mh * 0.96)}%`;
    mmL.querySelector('.meter__peak').style.bottom = `${Math.min(99, mh)}%`;
    mmR.querySelector('.meter__peak').style.bottom = `${Math.min(99, Math.round(mh * 0.96))}%`;

    if (footLoad) footLoad.textContent = `${Math.round(14 + (audio.available ? audio.load : 0.18) * 40)}%`;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  store.on('track', ({ trackId }) => { if (trackId) patch(trackId); });
  store.on('reset', () => { /* le rack est reconstruit par l'appelant */ });

  return { root, stop: () => cancelAnimationFrame(raf), engineLabel: footEngine };
}

// =============================================================
// Rack compact
// =============================================================

export function createMixerMini(root, store, opts = {}) {
  clear(root);
  root.className = 'mixer-mini';

  const head = el('div', { class: 'mixer-mini__head' });
  head.append(
    el('div', { class: 'mixer-mini__icon', html: icon('tune', { size: 15 }), style: 'color:var(--primary)' }),
    el('div', { class: 'mixer-mini__title', text: 'Mixer' }),
    el('span', { class: 'mixer-mini__count', text: `${store.tracks.length} pistes` }),
  );

  const list = el('div', { class: 'mixer-mini__list' });
  const refs = new Map();

  for (const t of store.tracks) {
    const strip = el('div', {
      class: `mini-strip ${t.id === store.state.selectedTrackId ? 'is-selected' : ''}`,
      dataset: { id: t.id },
    });
    strip.style.setProperty('--track-color', t.color);

    const txt = el('div', { class: 'mini-strip__txt' });
    txt.append(
      el('div', { class: 'mini-strip__name', text: t.name }),
      el('div', { class: 'mini-strip__db', text: formatDb(t.volume) }),
    );

    const faderEl = el('div', { class: 'fader', attrs: { title: `Volume ${t.name}` } });
    faderEl.append(el('div', { class: 'fader__fill' }), el('div', { class: 'fader__cap' }));
    const fader = bindFader(faderEl, {
      value: t.volume,
      label: `Volume ${t.name}`,
      onChange: (v) => {
        store.setTrack(t.id, { volume: v }, 'track');
        dbEl.textContent = formatDb(v);
        audio.setVolume(t.id, v);
      },
    });

    const meters = el('div', { class: 'mini-strip__meters' });
    const mL = el('div', { class: 'meter' });
    mL.append(el('div', { class: 'meter__level' }), el('div', { class: 'meter__peak' }));
    const mR = el('div', { class: 'meter' });
    mR.append(el('div', { class: 'meter__level' }), el('div', { class: 'meter__peak' }));
    meters.append(mL, mR);

    const btns = el('div', { class: 'mini-strip__ms' });
    const bMute = mkBtn('is-mute', 'M', 'Mute', !!t.mute, () => toggle(t.id, 'mute'));
    const bSolo = mkBtn('is-solo', 'S', 'Solo', !!t.solo, () => toggle(t.id, 'solo'));
    btns.append(bMute, bSolo);

    strip.append(txt, faderEl, meters, btns);
    strip.addEventListener('click', (e) => {
      if (e.target.closest('.mini-strip__btn') || e.target.closest('.fader')) return;
      store.state.selectedTrackId = t.id;
      store.emit('select', { trackId: t.id });
      for (const [tid, ref] of refs) ref.strip.classList.toggle('is-selected', tid === t.id);
    });

    list.appendChild(strip);
    refs.set(t.id, {
      strip, fader, dbEl: txt.querySelector('.mini-strip__db'), bMute, bSolo,
      lvlL: mL.querySelector('.meter__level'),
      lvlR: mR.querySelector('.meter__level'),
      peakL: mL.querySelector('.meter__peak'),
      peakR: mR.querySelector('.meter__peak'),
    });
  }

  // Master
  const master = el('div', { class: 'mixer-mini__master' });
  master.innerHTML = `<span class="lbl">Master</span>`;
  const mFaderEl = el('div', { class: 'fader', attrs: { title: 'Volume master' } });
  mFaderEl.append(el('div', { class: 'fader__fill' }), el('div', { class: 'fader__cap' }));
  const mDb = el('span', { class: 'met', text: formatDb(store.state.masterVolume), style: 'font-size:11px;min-width:6ch;text-align:right' });
  const mFader = bindFader(mFaderEl, {
    value: store.state.masterVolume,
    label: 'Volume master',
    onChange: (v) => {
      store.set('masterVolume', v, 'master');
      mDb.textContent = formatDb(v);
      audio.setMaster(v);
    },
  });
  const mMeters = el('div', { class: 'meter', style: 'height:40px' });
  mMeters.append(el('div', { class: 'meter__level' }), el('div', { class: 'meter__peak' }));
  master.append(mFaderEl, mDb, mMeters);

  const foot = el('div', { class: 'mixer-mini__foot' });
  const btnAdd = el('button', {
    class: 'btn',
    html: `${icon('add', { size: 14 })}<span>Ajouter une piste</span>`,
  });
  btnAdd.addEventListener('click', () => opts.onAddTrack?.());
  foot.appendChild(btnAdd);

  root.append(head, list, master, foot);

  function toggle(id, key) {
    const t = store.track(id);
    store.setTrack(id, { [key]: !t[key] }, 'track');
    patch(id);
    audio.syncFlags(store.tracks);
  }

  function patch(id) {
    const ref = refs.get(id);
    const t = store.track(id);
    if (!ref || !t) return;
    ref.bMute.setAttribute('aria-pressed', String(!!t.mute));
    ref.bSolo.setAttribute('aria-pressed', String(!!t.solo));
    ref.strip.classList.toggle('is-muted', !!t.mute);
  }

  let raf = 0;
  const peaks = new Map();
  const levels = new Map();
  function tick() {
    const t = performance.now() / 1000;
    const real = audio.available ? audio.peak() : 0;
    for (const track of store.tracks) {
      const ref = refs.get(track.id);
      if (!ref) continue;
      const audible = store.hasSolo(track.id) && !track.mute;
      const target = audible ? (audio.available ? real : fakeLevel(track, t)) : 0;

      const prev = levels.get(track.id) ?? 0;
      const level = target > prev ? target : prev * 0.86;
      levels.set(track.id, level);

      const h = Math.round(Math.min(1, level ** 0.6) * 100);
      ref.lvlL.style.height = `${h}%`;
      ref.lvlR.style.height = `${Math.round(h * 0.94)}%`;

      const pPrev = peaks.get(track.id) ?? 0;
      const next = target > pPrev ? target : pPrev * 0.995;
      peaks.set(track.id, next);
      ref.peakL.style.bottom = `${Math.min(99, Math.round(next ** 0.6 * 100))}%`;
      ref.peakR.style.bottom = `${Math.min(99, Math.round(next ** 0.6 * 96))}%`;
    }

    const mTarget = audio.available ? Math.min(1, real * 1.1) : 0.42;
    const mPrev = levels.get('__master__') ?? 0;
    const mLevel = mTarget > mPrev ? mTarget : mPrev * 0.86;
    levels.set('__master__', mLevel);
    const mh = Math.round(mLevel * 100);
    mMeters.querySelector('.meter__level').style.height = `${mh}%`;
    mMeters.querySelector('.meter__peak').style.bottom = `${Math.min(99, mh)}%`;
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  store.on('track', ({ trackId }) => { if (trackId) patch(trackId); });

  return { root, patch, stop: () => cancelAnimationFrame(raf) };
}

// ---------- Utils ----------

function mkBtn(cls, label, title, pressed, onClick) {
  const b = el('button', {
    class: `strip__btn ${cls}`.trim(),
    text: label,
    attrs: { 'aria-pressed': String(pressed), title, 'aria-label': title },
  });
  b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  return b;
}

function panText(v) {
  const n = Math.round((v ?? 0) * 100);
  if (n === 0) return 'C';
  return `${n > 0 ? 'R' : 'L'}${String(Math.abs(n)).padStart(2, '0')}`;
}

function catIcon(cat) {
  return { drums: 'album', bass: 'graphic_eq', synth: 'piano', fx: 'auto_awesome' }[cat] ?? 'music_note';
}

export { waveShape };
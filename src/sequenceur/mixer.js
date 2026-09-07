// Mixer compact : faders horizontaux + vu-mètres.
//
// Architecture pensée pour brancher ensuite un AudioNode réel :
// chaque fader pilotera le `.volume.value` du canal Tone.js.
//
// Interactions :
//   - drag sur le slider horizontal → volume 0..1
//   - affichage en dB à droite (approx : 20*log10(v))
//   - vu-mètre simulé (animation JS quand play)

const MIN_DB = -60;
const MAX_DB = 6;

/**
 * Rend un fader.
 * Retourne { el, update } où update(volume, meterLevel) repeint le fader.
 */
export function renderFader(track) {
  const el = document.createElement('div');
  el.className = 'fader';
  el.dataset.cat = track.cat;
  el.dataset.id = track.id;

  // couleur
  const color = document.createElement('div');
  color.className = 'fader__color';
  el.appendChild(color);

  // corps : nom + slider + meter
  const body = document.createElement('div');
  body.className = 'fader__body';

  const name = document.createElement('div');
  name.className = 'fader__name';
  name.textContent = track.name;
  body.appendChild(name);

  const slider = document.createElement('div');
  slider.className = 'fader__slider';
  slider.setAttribute('role', 'slider');
  slider.setAttribute('aria-label', `Volume ${track.name}`);
  slider.setAttribute('aria-valuemin', '0');
  slider.setAttribute('aria-valuemax', '100');
  const fill = document.createElement('div');
  fill.className = 'fader__fill';
  const thumb = document.createElement('div');
  thumb.className = 'fader__thumb';
  slider.append(fill, thumb);

  // Meter (10 segments)
  const meter = document.createElement('div');
  meter.className = 'fader__meter';
  const meterSegs = [];
  for (let i = 0; i < 10; i++) {
    const seg = document.createElement('span');
    meter.appendChild(seg);
    meterSegs.push(seg);
  }

  body.append(slider, meter);
  el.append(body);

  // dB
  const db = document.createElement('div');
  db.className = 'fader__db';
  el.appendChild(db);

  // Drag horizontal
  let dragging = false;
  const setVolume = (clientX) => {
    const rect = slider.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const v = x / rect.width;
    setVolumeValue(v);
    return v;
  };

  const setVolumeValue = (v) => {
    v = Math.max(0, Math.min(1, v));
    track.volume = v;
    fill.style.width = `${v * 100}%`;
    thumb.style.left = `${v * 100}%`;
    slider.setAttribute('aria-valuenow', String(Math.round(v * 100)));
    db.textContent = formatDb(v);
  };

  slider.addEventListener('pointerdown', (e) => {
    dragging = true;
    slider.classList.add('is-dragging');
    slider.setPointerCapture(e.pointerId);
    setVolume(e.clientX);
  });
  slider.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    setVolume(e.clientX);
  });
  slider.addEventListener('pointerup', (e) => {
    dragging = false;
    slider.classList.remove('is-dragging');
    slider.releasePointerCapture(e.pointerId);
  });
  slider.addEventListener('keydown', (e) => {
    let v = track.volume;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = Math.max(0, v - 0.02);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = Math.min(1, v + 0.02);
    else return;
    e.preventDefault();
    setVolumeValue(v);
  });
  slider.tabIndex = 0;

  // Init
  setVolumeValue(track.volume);

  function update(volume, meterLevel = 0) {
    if (!dragging) setVolumeValue(volume);
    // meter : 0..1 → nb de segments actifs
    const lit = Math.round(meterLevel * meterSegs.length);
    meterSegs.forEach((seg, i) => {
      seg.classList.toggle('is-on', i < lit);
      // Les 2 derniers passent en "peak" si niveau > 0.85
      if (i >= 8) seg.classList.toggle('is-peak', i < lit && meterLevel > 0.85);
    });
  }

  return { el, update, setVolumeValue };
}

function formatDb(v) {
  if (v <= 0.001) return '-∞';
  const db = 20 * Math.log10(v);
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return `${clamped >= 0 ? '+' : ''}${clamped.toFixed(1)}`;
}

/**
 * Anime les vu-mètres pendant la lecture.
 *   level = nombre 0..1 (moyenne sur les tracks actifs au pas courant)
 */
export function tickMeters(faders, level) {
  for (const f of faders) f.update(f.track.volume, level);
}
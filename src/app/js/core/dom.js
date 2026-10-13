// =============================================================
// ALPHA-Band — Helpers DOM
// =============================================================

/**
 * Crée un élément.
 * @param {string} tag
 * @param {object} [opt] { class, text, html, attrs, dataset, on }
 */
export function el(tag, opt = {}) {
  const node = document.createElement(tag);
  if (opt.class) node.className = opt.class;
  if (opt.text != null) node.textContent = opt.text;
  if (opt.html != null) node.innerHTML = opt.html;
  if (opt.attrs) for (const [k, v] of Object.entries(opt.attrs)) node.setAttribute(k, v);
  if (opt.dataset) for (const [k, v] of Object.entries(opt.dataset)) node.dataset[k] = v;
  if (opt.on) for (const [k, fn] of Object.entries(opt.on)) node.addEventListener(k, fn);
  return node;
}

/** Vide un conteneur. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Raccourci querySelector. */
export const $ = (sel, root = document) => root.querySelector(sel);
/** Raccourci querySelectorAll (tableau). */
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Crée une chaîne de barres pour un aperçu de forme d'onde.
 * @param {number} n        nombre de barres
 * @param {number} [seed]   graine déterministe
 * @returns {string[]}      hauteurs relatives 0..1
 */
export function waveShape(n, seed = 1) {
  const out = [];
  let s = seed >>> 0 || 1;
  for (let i = 0; i < n; i++) {
    // LCG déterministe : la même graine donne toujours la même forme.
    s = (s * 1664525 + 1013904223) >>> 0;
    const noise = s / 4294967296;
    // Enveloppe : attaque brève, décroissance — aspect « sample ».
    const env = Math.sin((i / n) * Math.PI) ** 0.55;
    out.push(Math.max(0.12, Math.min(1, env * (0.35 + noise * 0.75))));
  }
  return out;
}

/** Retourne une graine stable depuis une chaîne. */
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Applique une hauteur en pourcentage à chaque barre d'un conteneur .wave.
 */
export function renderWave(container, heights) {
  clear(container);
  for (const h of heights) {
    container.appendChild(el('span', { attrs: { style: `height:${Math.round(h * 100)}%` } }));
  }
}

/** Nom court : dB lisible. */
export function formatDb(v, { unit = true, digits = 1 } = {}) {
  if (v <= 0.0001) return unit ? '-inf' : '0';
  const db = 20 * Math.log10(v);
  const s = db > 0 ? '+' : '';
  return `${s}${db.toFixed(digits)}${unit ? ' dB' : ''}`;
}

/** mm:ss.cs */
export function formatClock(sec) {
  const s = Math.max(0, Math.floor(sec));
  const cs = Math.floor((sec - s) * 100);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/** BB.TTT.TTT à partir d'un pas et d'une subdivision. */
export function formatPos(step, stepCount, stepsPerBeat = 4) {
  const beat = Math.floor(step / stepsPerBeat) + 1;
  const tick = (step % stepsPerBeat) + 1;
  const bars = Math.max(1, Math.round(stepCount / stepsPerBeat));
  return `${String(beat % bars || bars).padStart(3, '0')}.${String(tick).padStart(2, '0')}.00`;
}

/**
 * Fader vertical : pointer drag + clavier.
 * @param {HTMLElement} root  .fader
 * @param {object} opt { value, min, max, onChange }
 */
export function bindFader(root, opt = {}) {
  const min = opt.min ?? 0;
  const max = opt.max ?? 1;
  let value = opt.value ?? 0.8;

  const fill = root.querySelector('.fader__fill');
  const cap = root.querySelector('.fader__cap');

  const paint = () => {
    const pct = ((value - min) / (max - min)) * 100;
    if (fill) fill.style.height = `${pct}%`;
    if (cap) cap.style.bottom = `${pct}%`;
    root.setAttribute('aria-valuenow', String(Math.round(value * 100)));
  };

  const set = (v) => {
    value = Math.max(min, Math.min(max, v));
    paint();
    opt.onChange?.(value);
  };

  const fromEvent = (e) => {
    const r = root.getBoundingClientRect();
    set(min + (1 - (e.clientY - r.top) / r.height) * (max - min));
  };

  root.tabIndex = root.tabIndex ?? 0;
  root.setAttribute('role', 'slider');
  root.setAttribute('aria-valuemin', String(Math.round(min * 100)));
  root.setAttribute('aria-valuemax', String(Math.round(max * 100)));
  if (opt.label) root.setAttribute('aria-label', opt.label);

  root.addEventListener('pointerdown', (e) => {
    // setPointerCapture est absent de certains environnements
    // (jsdom, navigateurs anciens) : le drag reste fonctionnel sans.
    try { root.setPointerCapture?.(e.pointerId); } catch { /* noop */ }
    fromEvent(e);
    const move = (ev) => fromEvent(ev);
    const up = () => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', up);
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', up);
  });

  root.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(value + step); e.preventDefault(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(value - step); e.preventDefault(); }
    else if (e.key === 'Home') { set(max); e.preventDefault(); }
    else if (e.key === 'End') { set(min); e.preventDefault(); }
  });

  paint();
  return { set, get: () => value, paint };
}
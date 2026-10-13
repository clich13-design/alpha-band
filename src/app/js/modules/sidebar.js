// =============================================================
// ALPHA-Band — Module Sidebar (bibliothèque)
// -------------------------------------------------------------
// Recherche, filtres, catégories, liste d'instruments avec
// aperçu de forme d'onde. Glisser-déposer vers le séquenceur /
// l'arrangement. Posé sur <aside data-sidebar>.
// =============================================================

import { el, clear, waveShape, hashSeed } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { CATEGORIES, LIBRARY, PALETTE } from '../core/store.js';
import { audio } from '../core/audio.js';

export function createSidebar(root, store, opts = {}) {
  const onAdd = opts.onAdd ?? (() => {});
  const onPreview = opts.onPreview ?? (() => {});

  clear(root);
  root.className = 'sidebar';

  // ---------- En-tête ----------
  const head = el('div', { class: 'sidebar__head' });
  head.innerHTML = `
    <div class="sidebar__icon">${icon('folder_open', { size: 17 })}</div>
    <div class="sidebar__titles">
      <div class="sidebar__title">Library</div>
      <div class="sidebar__sub">Browser</div>
    </div>
  `;
  const btnKitTag = el('button', { class: 'chip', text: 'KIT 08', attrs: { title: 'Kit actif' } });
  head.appendChild(btnKitTag);

  // ---------- Corps ----------
  const body = el('div', { class: 'sidebar__body' });

  // Recherche
  const filters = el('div', { class: 'lib-filters' });
  const search = el('div', { class: 'field lib-search' });
  search.innerHTML = icon('search', { size: 14 });
  const searchInput = el('input', {
    attrs: { type: 'search', placeholder: 'Rechercher un son…', 'aria-label': 'Rechercher un son' },
  });
  search.appendChild(searchInput);

  // Filtres rapides
  const chips = el('div', { class: 'lib-chips' });
  const FILTERS = [
    { id: 'bpm',   label: '120-128 BPM' },
    { id: 'minor', label: 'Minor' },
    { id: 'shot',  label: 'One-Shot' },
    { id: 'mel',   label: 'Melodic' },
  ];
  const active = new Set(['minor']);
  for (const f of FILTERS) {
    const b = el('button', {
      class: 'lib-chip',
      text: f.label,
      attrs: { 'aria-pressed': String(active.has(f.id)) },
    });
    b.addEventListener('click', () => {
      if (active.has(f.id)) active.delete(f.id); else active.add(f.id);
      b.setAttribute('aria-pressed', String(active.has(f.id)));
      paint();
    });
    chips.appendChild(b);
  }

  const btnImport = el('button', {
    class: 'btn btn--import',
    html: `${icon('file_upload', { size: 14 })}<span>Import Sample</span>`,
    attrs: { title: 'Importer un sample (bientôt)' },
  });

  filters.append(search, chips, btnImport);

  // Catégories
  const tabs = el('div', { class: 'lib-tabs', attrs: { role: 'tablist', 'aria-label': 'Catégories' } });
  let category = 'drums';
  for (const c of CATEGORIES) {
    const t = el('button', {
      class: 'seg__item',
      text: c.label,
      attrs: { role: 'tab', 'aria-pressed': String(c.id === category), title: c.label },
      dataset: { cat: c.id },
    });
    t.addEventListener('click', () => {
      category = c.id;
      for (const other of tabs.children) other.setAttribute('aria-pressed', String(other.dataset.cat === category));
      paint();
    });
    tabs.appendChild(t);
  }

  // Liste
  const list = el('div', { class: 'lib-list', attrs: { 'aria-label': 'Instruments disponibles' } });

  // Carte kit
  const kit = el('div', { class: 'lib-kit' });
  kit.innerHTML = `
    <div class="lib-kit__row"><b>Selected Kit</b><span class="ok">Ready</span></div>
    <div class="lib-kit__name">ALPHA Analog 909 Vintage</div>
    <div class="lib-kit__foot">
      <span>44.1kHz · 24-bit</span>
      <button class="lib-kit__swap" type="button">Hot Swap</button>
    </div>
  `;

  body.append(filters, tabs, list, kit);

  // ---------- Pied ----------
  const foot = el('div', { class: 'sidebar__foot' });
  foot.append(
    el('a', { class: 'menu-item', html: `${icon('extension', { size: 14 })}<span>Plugins</span>`, attrs: { href: '#' } }),
    el('a', { class: 'menu-item', html: `${icon('star', { size: 14 })}<span>Favorites</span>`, attrs: { href: '#' } }),
  );

  root.append(head, body, foot);

  // ---------- Rendu ----------
  let query = '';
  searchInput.addEventListener('input', () => { query = searchInput.value.trim().toLowerCase(); paint(); });

  function matches(item) {
    if (category !== 'all' && item.cat !== category) return false;
    if (query && !item.name.toLowerCase().includes(query) && !item.kit.toLowerCase().includes(query)) return false;
    if (active.has('bpm') && (item.bpm < 120 || item.bpm > 128)) return false;
    if (active.has('minor') && item.scale !== 'Minor') return false;
    if (active.has('shot') && item.mode !== 'One-Shot') return false;
    if (active.has('mel') && item.mode === 'One-Shot') return false;
    return true;
  }

  function paint() {
    clear(list);
    const items = LIBRARY.filter(matches);
    if (!items.length) {
      list.appendChild(el('div', { class: 'lib-empty', text: 'Aucun son ne correspond aux filtres.' }));
      return;
    }

    for (const item of items) {
      const idx = LIBRARY.indexOf(item);
      const color = PALETTE[LIBRARY.findIndex((p) => p.cat === item.cat) % PALETTE.length];

      const node = el('div', {
        class: 'lib-item',
        dataset: { preset: item.preset, id: item.id },
        attrs: { role: 'listitem', tabindex: '0', title: `Glisser vers la grille — ${item.name}` },
      });
      node.style.setProperty('--track-color', color);

      const top = el('div', { class: 'lib-item__top' });
      top.appendChild(el('div', { class: 'lib-item__icon', html: icon(catIcon(item.cat), { size: 13 }) }));
      top.appendChild(el('div', { class: 'lib-item__name', text: item.name }));
      top.appendChild(el('span', { class: 'lib-item__count', text: String(12 + (idx % 7)) }));
      node.appendChild(top);

      const wave = el('div', { class: 'wave', attrs: { 'aria-hidden': 'true' } });
      node.appendChild(wave);

      const meta = el('div', { class: 'lib-item__meta' });
      meta.append(
        el('span', { text: `${item.bpm}` }),
        el('span', { class: 'sep' }),
        el('span', { text: item.scale }),
        el('span', { class: 'sep' }),
        el('span', { class: 'tag', text: item.mode }),
      );
      node.appendChild(meta);

      const add = () => onAdd(item);

      node.addEventListener('dblclick', add);
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(); }
      });
      node.addEventListener('pointerdown', () => onPreview(item));
      node.draggable = true;
      node.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/alpha-preset', item.preset);
        e.dataTransfer.effectAllowed = 'copy';
        node.classList.add('is-dragging');
        if (!audio.preview(item.preset)) onPreview(item);
      });
      node.addEventListener('dragend', () => node.classList.remove('is-dragging'));

      list.appendChild(node);
      // Peint la forme d'onde après insertion (évite un reflow par barre).
      waveShape(28, hashSeed(item.id)).forEach((h) => {
        wave.appendChild(el('span', { attrs: { style: `height:${Math.round(h * 100)}%` } }));
      });
    }
  }

  paint();

  return {
    root,
    repaint: paint,
    setCategory(c) {
      category = c;
      for (const t of tabs.children) t.setAttribute('aria-pressed', String(t.dataset.cat === c));
      paint();
    },
  };
}

function catIcon(cat) {
  return CATEGORIES.find((c) => c.id === cat)?.icon ?? 'album';
}
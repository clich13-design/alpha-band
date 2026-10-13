// =============================================================
// ALPHA-Band — Icônes (SVG inline, trait 2px sur grille 24)
// Aucun webfont externe : les icônes voyagent avec le bundle.
// =============================================================

const P = {
  graphic_eq: 'M7 18h2V6H7v12zM3 14h2v-4H3v4zm12-6v2h2v-2h-2zm-6 8h2V4H9v12zm6-10v2h2V10h-2zm0 8h2v-6h-2v6zm4 4h2v-2h-2v2z',
  play_arrow: 'M8 5v14l11-7z',
  pause: 'M7 5h4v14H7zM13 5h4v14h-4z',
  stop: 'M6.5 6.5h11v11h-11z',
  record: 'M12 6a6 6 0 100 12 6 6 0 000-12z',
  repeat: 'M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z',
  metronome: 'M12 2a1 1 0 011 1v11.6l3.7-3.7a1 1 0 011.4 1.4l-5.3 5.3a1 1 0 01-1.4 0l-5.3-5.3a1 1 0 011.4-1.4L11 14.6V3a1 1 0 011-1zM5 20h14v2H5z',
  undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
  redo: 'M18.4 10.6A7.99 7.99 0 0012 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78A8.9 8.9 0 0022 14c0-.68-.06-1.36-.2-2a7.8 7.8 0 00-.4-1.4z',
  download: 'M12 3v10.6l3.7-3.7 1.4 1.4L12 16.3 6.9 11.3l1.4-1.4L11 13.6V3h1zM5 19h14v2H5z',
  add: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
  remove: 'M5 11h14v2H5z',
  music_note: 'M12 3v10.55A4 4 0 1014 17V7h4V3h-6z',
  skip_previous: 'M6 6h2v12H6zm12 0v12l-9-6z',
  skip_next: 'M16 6h2v12h-2zM6 18V6l9 6z',
  fast_rewind: 'M11 18V6l-8.5 6zM20.5 18V6L12 12z',
  fast_forward: 'M13 6v12l8.5-6zM3.5 6v12L12 12z',
  volume_up: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 00-2.5-4v8a4.5 4.5 0 002.5-4zM14 2.2v2.1a7.7 7.7 0 010 15.4v2.1a9.8 9.8 0 000-19.6z',
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  search: 'M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 5L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z',
  tune: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z',
  folder_open: 'M20 6h-8l-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zm0 12H4V8h16v10z',
  file_upload: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5z',
  album: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm0-11a3 3 0 100 6 3 3 0 000-6z',
  piano: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14zM7 15h2v-4H7v4zm3 0h2V7h-2v8zm3 0h2v-6h-2v6zm3 0h2v-4h-2v4z',
  auto_awesome: 'M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z',
  loop: 'M7 7h10v3l4-4-4-4v3H5v6h2zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2z',
  star: 'M12 17.3l6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  extension: 'M20.5 11H19V7a2 2 0 00-2-2h-4V3.5a2.5 2.5 0 00-5 0V5H4a2 2 0 00-2 2v3.8h1.5a1.7 1.7 0 010 3.4H2V17a2 2 0 002 2h3.8v-1.5a1.7 1.7 0 013.4 0V19h4.3a2 2 0 002-2v-4h1.5a2.5 2.5 0 000-5z',
  chevron_left: 'M15.4 7.4L14 6l-6 6 6 6 1.4-1.4L10.8 12z',
  chevron_right: 'M8.6 16.6L10 18l6-6-6-6-1.4 1.4 4.6 4.6z',
  chevron_down: 'M16.6 8.6L18 10l-6 6-6-6 1.4-1.4 4.6 4.6z',
  content_copy: 'M16 1H4a2 2 0 00-2 2v14h2V3h12V1zm3 4H8a2 2 0 00-2 2v14a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2zm0 16H8V7h11v14z',
  content_paste: 'M19 2h-4.18A3 3 0 0012 0a3 3 0 00-2.82 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V4a2 2 0 00-2-2zm-7 0a1 1 0 110 2 1 1 0 010-2zm7 18H5V4h2v3h10V4h2v16z',
  delete_sweep: 'M15 16h4v2h-4zm-2.94-8.81L3 16.25V20h3.75l9.06-9.06-3.75-3.75zm.71-.71l3.75 3.75 1.83-1.83a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83zM8 18v-2h2v2H8zm0-4v-2h2v2H8z',
  queue_music: 'M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18A2.99 2.99 0 0020 17c.83 0 1.5-.67 1.5-1.5S20.83 14 20 14V6h-3z',
  shuffle: 'M10.6 9.2L5.4 4 4 5.4l5.2 5.2 1.4-1.4zM14.5 4l2 2L4 18.6 5.4 20 18 7.4l2 2V4h-5.5zm.3 9.4l-1.4 1.4 3.2 3.2-2 2H20v-5.6l-2 2-3.2-3z',
  more_vert: 'M12 8a2 2 0 110-4 2 2 0 010 4zm0 2a2 2 0 110 4 2 2 0 010-4zm0 6a2 2 0 110 4 2 2 0 010-4z',
  close: 'M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z',
  expand_more: 'M16.6 8.6L18 10l-6 6-6-6 1.4-1.4 4.6 4.6z',
  drag: 'M9 4a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM9 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM9 17a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z',
  panel: 'M3 3h18v18H3V3zm2 2v14h6V5H5z',
  save: 'M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zm-5 16a3 3 0 110-6 3 3 0 010 6zm3-10H5V5h10v4z',
  help: 'M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2zm2.1-7.7l-.9.9c-.7.7-1.2 1.3-1.2 2.8h-2v-.5c0-1.1.4-2.1 1.2-2.8l1.2-1.3a2 2 0 10-3.4-1.4H8a4 4 0 118 0c0 .9-.4 1.7-.9 2.3z',
  notifications: 'M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6v-5a6 6 0 00-5-5.9V4a1 1 0 10-2 0v1.1A6 6 0 006 11v5l-2 2v1h16v-1z',
  settings: 'M12 8a4 4 0 100 8 4 4 0 000-8zm9.4 4a7.6 7.6 0 01-.1 1.2l2 1.6-2 3.4-2.4-1a7.6 7.6 0 01-2 1.2l-.4 2.6h-4l-.4-2.6a7.6 7.6 0 01-2-1.2l-2.4 1-2-3.4 2-1.6a7.6 7.6 0 010-2.4l-2-1.6 2-3.4 2.4 1a7.6 7.6 0 012-1.2L10.5 2h4l.4 2.6a7.6 7.6 0 012 1.2l2.4-1 2 3.4-2 1.6c.1.4.1.8.1 1.2z',
};

/**
 * Retourne le markup SVG d'une icône.
 * @param {string} name  clé de ICONS
 * @param {object} [opt] { size, fill, cls }
 */
export function icon(name, opt = {}) {
  const d = P[name];
  if (!d) {
    console.warn(`[icon] inconnue : ${name}`);
    return '';
  }
  const { size = 18, fill = false, cls = '' } = opt;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" focusable="false"${
    cls ? ` class="${cls}"` : ''
  }><path fill="currentColor" d="${d}"/></svg>`;
}

/** Variante pleine (pastilles d'état, play, record). */
export function iconSolid(name, opt = {}) {
  return icon(name, { ...opt, fill: true });
}

export const ICON_NAMES = Object.keys(P);
// Données : bibliothèque d'instruments/presets.
// Inspiré du DEB ALPHA-Band V2 (22 EF + scope V1 : drums, bass, synth, pad, fx).
// Pour la maquette on reste sur 5 catégories × 5 presets, tous sélectionnés.
//
// Chaque preset porte :
//   - id, name, cat (catégorie pour le filtre et la couleur)
//   - note (note par défaut pour les synthés/bass — pas utilisé en maquette)
//   - icon (2 lettres pour la tuile de bibliothèque)
//   - hint (sous-titre)
//
// L'architecture est pensée pour qu'on puisse brancher plus tard un AudioNode
// réel : chaque preset aura alors un `factory(ctx)` qui rend un objet
// `triggerAttack(n) / triggerRelease(n)`. Pas d'audio ici — visuel uniquement.

export const CATEGORIES = [
  { id: 'all',    label: 'Tout' },
  { id: 'drums',  label: 'Batteries' },
  { id: 'bass',   label: 'Basses' },
  { id: 'synth',  label: 'Synthés' },
  { id: 'pad',    label: 'Pads' },
  { id: 'fx',     label: 'Effets' },
];

export const LIBRARY = [
  // Drums
  { id: 'kick-808',    cat: 'drums', name: 'Kick 808',         hint: 'Basse grosse caisse',  icon: 'K8' },
  { id: 'snare-clap',  cat: 'drums', name: 'Snare & Clap',     hint: 'Rétro rock',           icon: 'SC' },
  { id: 'hat-trance',  cat: 'drums', name: 'Hi-Hat Trance',    hint: 'Ouvert / fermé',       icon: 'HT' },
  { id: 'perc-latin',  cat: 'drums', name: 'Percu latine',     hint: 'Bongos, congas',       icon: 'PL' },
  { id: 'drum-room',   cat: 'drums', name: 'Kit Room',         hint: 'Rock acoustique',      icon: 'DR' },

  // Bass
  { id: 'bass-sub',    cat: 'bass',  name: 'Sub Bass',         hint: 'Profond, sinusoïdal',  icon: 'BS' },
  { id: 'bass-funk',   cat: 'bass',  name: 'Slap Funk',        hint: 'Pincé,Attack court',   icon: 'BF' },
  { id: 'bass-acid',   cat: 'bass',  name: 'Acid 303',         hint: 'Saw résonant',         icon: 'BA' },
  { id: 'bass-reese',  cat: 'bass',  name: 'Reese Dub',        hint: 'Détuné, large',        icon: 'BR' },
  { id: 'bass-wobble', cat: 'bass',  name: 'Wobble',           hint: 'LFO rythmé',           icon: 'BW' },

  // Synths
  { id: 'syn-lead',    cat: 'synth', name: 'Lead Pluck',       hint: 'Saw attack court',     icon: 'SL' },
  { id: 'syn-keys',    cat: 'synth', name: 'Keys Rhodes',      hint: 'Piano électrique',     icon: 'SK' },
  { id: 'syn-arp',     cat: 'synth', name: 'Arp Séquence',     hint: 'Pulse, séquence',      icon: 'SA' },
  { id: 'syn-bell',    cat: 'synth', name: 'Bell FM',          hint: 'FM métallique',        icon: 'SB' },
  { id: 'syn-stab',    cat: 'synth', name: 'Stab House',       hint: 'Syncope court',        icon: 'ST' },

  // Pads
  { id: 'pad-strings', cat: 'pad',   name: 'Strings chauds',   hint: 'Nappe cinématique',    icon: 'PS' },
  { id: 'pad-choir',   cat: 'pad',   name: 'Chœur vocal',      hint: 'Vowel sweep',          icon: 'PC' },
  { id: 'pad-glass',   cat: 'pad',   name: 'Glass Pad',        hint: 'Cristallin, lent',     icon: 'PG' },
  { id: 'pad-ambient', cat: 'pad',   name: 'Ambient Drift',    hint: 'Évolution lente',      icon: 'PA' },
  { id: 'pad-warm',    cat: 'pad',   name: 'Warm Pad',         hint: 'Sawtooh doux',         icon: 'PW' },

  // FX
  { id: 'fx-riser',    cat: 'fx',    name: 'Riser',            hint: 'Montée de tension',    icon: 'FR' },
  { id: 'fx-down',     cat: 'fx',    name: 'Down Sweep',       hint: 'Chute descendante',    icon: 'FD' },
  { id: 'fx-impact',   cat: 'fx',    name: 'Impact Ciné',      hint: 'Frappe grave',         icon: 'FI' },
  { id: 'fx-noise',    cat: 'fx',    name: 'Noise Sweep',      hint: 'Bruit filtré',         icon: 'FN' },
  { id: 'fx-zap',      cat: 'fx',    name: 'Zap',              hint: 'Court, métallique',    icon: 'FZ' },
];

export function filterLibrary(cat) {
  if (cat === 'all') return LIBRARY;
  return LIBRARY.filter(p => p.cat === cat);
}
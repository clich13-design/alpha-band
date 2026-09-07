// Mapping physique des touches → notes.
// Basé sur event.code (KeyA, KeyS, ...) qui est indépendant du layout OS
// (QWERTY, AZERTY, Dvorak, etc.). C'est la position de la touche qui compte.
//
// Row Z (touches noires) : KeyW KeyE   KeyT KeyY KeyU   KeyO KeyP
//                          C#4  D#4    F#4  G#4  A#4    C#5  D#5
// Row A (touches blanches) : KeyA KeyS KeyD KeyF KeyG KeyH KeyJ KeyK KeyL Semicolon
//                            C4   D4   E4   F4   G4   A4   B4   C5   D5   E5
//
// Compatible QWERTY (US) et AZERTY (FR) automatiquement.

const KEY_MAP = {
  // Touches blanches
  KeyA: 'C4', KeyS: 'D4', KeyD: 'E4', KeyF: 'F4',
  KeyG: 'G4', KeyH: 'A4', KeyJ: 'B4', KeyK: 'C5',
  KeyL: 'D5', Semicolon: 'E5',
  // Touches noires
  KeyW: 'C#4', KeyE: 'D#4', KeyT: 'F#4', KeyY: 'G#4',
  KeyU: 'A#4', KeyO: 'C#5', KeyP: 'D#5',
};

const NOTE_ORDER = [
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4',
  'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  'C5', 'C#5', 'D5', 'D#5', 'E5',
];

const BLACK_INDICES = new Set([1, 3, 6, 8, 10, 13, 15]);

/**
 * Construit un clavier visuel (DOM) de 17 notes (C4..E5).
 * @param {(note: string) => void} onPress
 * @param {(note: string) => void} onRelease
 * @returns {{ root: HTMLElement, keyForNote: (n: string) => HTMLElement | null }}
 */
export function buildKeyboard(onPress, onRelease) {
  const root = document.createElement('div');
  root.id = 'keyboard';

  const noteToKey = new Map();

  const PHYSICAL_KEY = {
    'C4': 'A', 'C#4': 'W', 'D4': 'S', 'D#4': 'E',
    'E4': 'D', 'F4': 'F', 'F#4': 'T', 'G4': 'G',
    'G#4': 'Y', 'A4': 'H', 'A#4': 'U', 'B4': 'J',
    'C5': 'K', 'C#5': 'O', 'D5': 'L', 'D#5': 'P',
    'E5': ';',
  };

  for (const note of NOTE_ORDER) {
    const idx = NOTE_ORDER.indexOf(note);
    const isBlack = BLACK_INDICES.has(idx);
    const key = document.createElement('div');
    key.className = `key ${isBlack ? 'black' : 'white'}`;
    key.dataset.note = note;

    // Affichage : note + label physique (ex. "C4 A")
    const noteLabel = document.createElement('div');
    noteLabel.className = 'note-label';
    noteLabel.textContent = note;
    key.appendChild(noteLabel);

    const physLabel = document.createElement('div');
    physLabel.className = 'phys-label';
    physLabel.textContent = PHYSICAL_KEY[note] || '';
    if (!physLabel.textContent) physLabel.style.display = 'none';
    key.appendChild(physLabel);

    const press = (ev) => {
      ev.preventDefault();
      key.classList.add('active');
      onPress(note);
    };
    const release = () => {
      key.classList.remove('active');
      onRelease(note);
    };

    // Souris
    key.addEventListener('mousedown', press);
    key.addEventListener('mouseup', release);
    key.addEventListener('mouseleave', release);

    // Touch
    key.addEventListener('touchstart', press, { passive: false });
    key.addEventListener('touchend', release);

    root.appendChild(key);
    noteToKey.set(note, key);
  }

  return {
    root,
    keyForNote: (n) => noteToKey.get(n) || null,
  };
}

/**
 * Branche les touches clavier physiques → onPress/onRelease.
 * Réutilisable : appelle start() / stop() pour activer/désactiver.
 * Utilise event.code (KeyA, KeyS, ...) pour être indépendant du layout OS.
 */
export function bindComputerKeyboard(onPress, onRelease) {
  const down = new Set();
  const isTextField = (el) =>
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  const handleDown = (ev) => {
    if (isTextField(ev.target)) return;
    const code = ev.code;
    if (!KEY_MAP[code] || down.has(code)) return;
    down.add(code);
    ev.preventDefault();
    onPress(KEY_MAP[code]);
  };

  const handleUp = (ev) => {
    const code = ev.code;
    if (!KEY_MAP[code] || !down.has(code)) return;
    down.delete(code);
    onRelease(KEY_MAP[code]);
  };

  return {
    start() {
      window.addEventListener('keydown', handleDown);
      window.addEventListener('keyup', handleUp);
    },
    stop() {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    },
  };
}

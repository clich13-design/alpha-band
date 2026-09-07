// Mapping QWERTY → notes (1,5 octave au-dessus de C4)
// Modèle: lower row ASDF...JKL = C4..C5, top row QWERTY.. = C#4..D#5
//
// Row 1 (touches noires) : Q W   E   T   Y U   O   [
//                          C#4 D#4 F#4 G#4 A#4 C#5 D#5
// Row 2 (touches blanches) : A S D F G H J K L ;
//                            C4 D4 E4 F4 G4 A4 B4 C5 D5
//
// Source: convention GarageBand/Logic standard.

const KEY_MAP = {
  // Touches blanches (rangée du bas)
  'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4',
  'g': 'G4', 'h': 'A4', 'j': 'B4', 'k': 'C5',
  'l': 'D5', ';': 'E5',
  // Touches noires (rangée du haut)
  'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4',
  'u': 'A#4', 'o': 'C#5', 'p': 'D#5',
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

  for (const note of NOTE_ORDER) {
    const idx = NOTE_ORDER.indexOf(note);
    const isBlack = BLACK_INDICES.has(idx);
    const key = document.createElement('div');
    key.className = `key ${isBlack ? 'black' : 'white'}`;
    key.dataset.note = note;
    key.textContent = isBlack ? '' : note;

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
 */
export function bindComputerKeyboard(onPress, onRelease) {
  const down = new Set();
  const isTextField = (el) =>
    el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

  const handleDown = (ev) => {
    if (isTextField(ev.target)) return;
    const k = ev.key.toLowerCase();
    if (!KEY_MAP[k] || down.has(k)) return;
    down.add(k);
    ev.preventDefault();
    onPress(KEY_MAP[k]);
  };

  const handleUp = (ev) => {
    const k = ev.key.toLowerCase();
    if (!KEY_MAP[k] || !down.has(k)) return;
    down.delete(k);
    onRelease(KEY_MAP[k]);
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

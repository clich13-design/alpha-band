// Bootstrap du POC : audio unlock + clavier visuel + clavier QWERTY.
import { createVoice } from './poc/voice.js';
import { buildKeyboard, bindComputerKeyboard } from './poc/keyboard.js';

const startBtn = document.getElementById('start-btn');
const playSection = document.getElementById('play');
const unlockSection = document.getElementById('unlock');

let voice = null;
let keyboard = null;
let computerKeys = null;

async function start() {
  // 1. Audio unlock (NF-UX-04) — démarre AudioContext sur un geste utilisateur.
  await Tone.start();
  console.log('[POC] Tone.js démarré, AudioContext state =', Tone.getContext().state);

  // 2. Voix synthé ADSR
  voice = createVoice();

  // 3. Clavier visuel
  keyboard = buildKeyboard(
    (note) => voice && voice.noteOn(note),
    (note) => voice && voice.noteOff(note)
  );
  playSection.appendChild(keyboard.root);

  // 4. Clavier physique (QWERTY)
  computerKeys = bindComputerKeyboard(
    (note) => {
      voice && voice.noteOn(note);
      const key = keyboard && keyboard.keyForNote(note);
      if (key) key.classList.add('active');
    },
    (note) => {
      voice && voice.noteOff(note);
      const key = keyboard && keyboard.keyForNote(note);
      if (key) key.classList.remove('active');
    }
  );
  computerKeys.start();

  // 5. Bascule UI
  unlockSection.hidden = true;
  playSection.hidden = false;
}

startBtn.addEventListener('click', start);

// Bootstrap du POC : crée le contexte audio au premier clic, puis branche
// les touches du clavier (souris + touches physiques).
//
// Pourquoi le bouton "Démarrer" ? Chrome/Brave/Firefox bloquent l'audio
// tant que l'utilisateur n'a pas interagi avec la page (cf. NF-UX-04 du DEB).
// Tone.start() doit être appelé dans un gestionnaire d'événement utilisateur.

import { createVoice } from './poc/voice.js';
import { buildKeyboard, bindComputerKeyboard } from './poc/keyboard.js';
// Tone.js v15 utilise des bare module specifiers ("standardized-audio-context",
// "tslib", "automation-events") et des imports sans extension .js.
// Le navigateur ne sait rien résoudre de tout ça en ESM natif.
// Solution jetable : un bundle unique produit par esbuild, qu'on importe
// comme un module local standard. Pour régénérer :
//   ./node_modules/.bin/esbuild --bundle --format=esm --target=es2019 \
//     --outfile=src/vendor/tone-bundle.js \
//     'node_modules/tone/build/esm/index.js'
import * as Tone from './vendor/tone-bundle.js';

const startBtn = document.getElementById('start-btn');
const startOverlay = document.getElementById('unlock');
const playSection = document.getElementById('play');
const status = document.getElementById('status');

let voice = null;
let keyboard = null;

function setStatus(text, active = false, isError = false) {
  status.textContent = text;
  status.classList.toggle('active', active);
  status.classList.toggle('error', isError);
}

async function startAudio() {
  // Tone.start() débloque l'AudioContext. Doit être dans un user gesture.
  await Tone.start();
  voice = createVoice();

  // Clavier visuel
  const kbd = buildKeyboard(
    (n) => {
      voice.triggerAttack(n);
      setStatus(`▶ ${n}`, true);
    },
    (n) => {
      voice.triggerRelease(n);
      setStatus('En attente d\'une note…');
    }
  );
  const keyboardHost = document.getElementById('keyboard');
  keyboardHost.appendChild(kbd.root);

  // Clavier physique (event.code, indépendant du layout OS)
  keyboard = bindComputerKeyboard(
    (n) => {
      voice.triggerAttack(n);
      setStatus(`▶ ${n} (touche)`, true);
    },
    (n) => {
      voice.triggerRelease(n);
      setStatus('En attente d\'une note…');
    }
  );
  keyboard.start();

  startOverlay.style.display = 'none';
  playSection.hidden = false;
  setStatus('Prêt — joue une touche !');
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  startBtn.textContent = 'Démarrage…';
  setStatus('Initialisation de l\'audio…');

  try {
    await startAudio();
  } catch (err) {
    console.error('Audio start failed:', err);
    startBtn.disabled = false;
    startBtn.textContent = 'Réessayer';
    setStatus(`Erreur : ${err.message || err}`, false, true);
  }
});

// Log immédiat pour confirmer que le module a bien chargé
console.log('[POC] Module main.js chargé, en attente du clic Démarrer');
setStatus('Module chargé — clique sur Démarrer');

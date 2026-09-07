// Wrapper mince autour de Tone.js Synth avec enveloppe ADSR.
// Tone.js: MIT (https://github.com/Tonejs/Tone.js/blob/dev/LICENSE.md)
// On importe depuis le bundle local (/vendor/tone-bundle.js) plutôt que
// depuis node_modules — voir commentaire dans main.js pour le rationale.
// Le '/' initial résout depuis l'origine (compatible python -m http.server
// ET GitHub Pages).
import * as Tone from '/vendor/tone-bundle.js';

/**
 * Crée un synthé polyphonique ADSR jouable à la note.
 * @param {object} [opts]
 * @param {number} [opts.attack=0.01]
 * @param {number} [opts.decay=0.2]
 * @param {number} [opts.sustain=0.4]
 * @param {number} [opts.release=0.8]
 * @param {string} [opts.oscillator='sawtooth']
 */
export function createVoice(opts = {}) {
  const {
    attack = 0.01,
    decay = 0.2,
    sustain = 0.4,
    release = 0.8,
    oscillator = 'sawtooth',
  } = opts;

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: oscillator },
    envelope: { attack, decay, sustain, release },
  }).toDestination();
  synth.volume.value = -8; // headroom, évite la saturation

  return {
    triggerAttack(note) {
      synth.triggerAttack(note);
    },
    triggerRelease(note) {
      synth.triggerRelease(note);
    },
    setADSR({ attack, decay, sustain, release }) {
      synth.set({ envelope: { attack, decay, sustain, release } });
    },
    dispose() {
      synth.dispose();
    },
  };
}

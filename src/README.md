# ALPHA-Band — POC + Maquette séquenceur

> **Statut** : Preuves de concept jetables. Le code de ce dossier n'est **pas** destiné à être conservé tel quel pour la V1.
> Il sert à valider des points critiques du DEB et à montrer ce que pourrait donner l'interface.

## Ce qui est disponible

### 1. POC synthé ADSR (`index.html`)

Valide 4 points critiques du DEB avant d'engager la phase 3 :
1. Web Audio API + Tone.js s'installent et tournent
2. La chaîne dev (`python3 -m http.server` → navigateur) marche
3. NF-UX-01 (premier son < 60 s) est faisable
4. Le mapping clavier QWERTY/AZERTY → notes tient la route

### 2. Maquette séquenceur (`sequenceur.html`)

Vue principale d'un DAW pas-à-pas, audio réel :
- 4-5 pistes (Drums 808, Bass, Lead, Pad, etc.) synthétisées via Tone.js
- Grille 16 pas cliquable, lecture/playhead animé
- BPM modifiable, mute/solo, volume par piste
- Bibliothèque d'instruments latérale
- **Visuel** : à enrichir (état actuel = "minimal, juste du texte" selon l'utilisateur)

## Lancer en local

```bash
# Depuis la racine du repo :
npm install              # installe tone + esbuild (devDep)
npm run bundle:tone      # régénère vendor/tone-bundle.js (~870 KB)
npm run serve            # python3 -m http.server 8767 --bind 127.0.0.1
```

Puis ouvrir dans un navigateur moderne :
- POC : `http://127.0.0.1:8767/src/`
- Maquette : `http://127.0.0.1:8767/src/sequenceur.html`

> **Pourquoi le bundle Tone ?** Tone.js v15 dépend de `standardized-audio-context`,
> `automation-events` et `tslib` avec des imports sans extension `.js` et des
> "bare specifiers" (`from "tslib"`). Le navigateur ne sait pas les résoudre en
> ESM natif — on bundle donc tout dans un seul fichier avec esbuild. C'est la
> solution la plus simple pour un POC/Maquette jetable.

> **Pourquoi `/vendor/tone-bundle.js` (chemin absolu) ?** Les imports relatifs
> (`../vendor/...`) ne sont pas résolus correctement par `python3 -m http.server`
> (le navigateur résout l'URL depuis l'origine, pas le système de fichiers).
> Le `/` initial garantit que ça marche en local ET sur GitHub Pages.

## Tester

### POC synthé
Cliquer sur **Démarrer** (pour activer l'audio — règle NF-UX-04), puis jouer avec :
- Le clavier visuel à la souris
- Le clavier physique : `A S D F G H J K L` (touches blanches) et `W E T Y U` (touches noires)

### Maquette séquenceur
Cliquer sur **Démarrer**, puis :
- Cliquer sur des cellules dans la grille pour activer des notes
- Régler le BPM (input nombre, 40-240)
- Cliquer sur le bouton **Play** pour entendre la boucle
- Muter une piste (icône muet) ou solo (icône casque)
- Bouger les faders de volume du mixer

## Limites assumées

- Pas de sauvegarde / chargement (IndexedDB)
- Pas d'export (WAV/MP3)
- Pas d'effets sur les pistes (reverb, delay, EQ)
- Pas d'arrangement (timeline)
- Pas d'annuler / refaire
- 1 voix par piste (pas de polyphonie par pas)
- Pas de tests, pas de CI, pas de build (à part le bundle Tone)
- Strings en dur (pas d'i18n — sera posé en V1)

## Architecture

```
src/
├── index.html             Page POC (synthé ADSR)
├── sequenceur.html        Page maquette (séquenceur)
├── style.css              Styles POC
├── main.js                Bootstrap POC
├── poc/                   Code du POC
│   ├── voice.js           Wrapper Tone.js Synth (ADSR)
│   └── keyboard.js        Clavier visuel + mapping event.code
├── sequenceur/            Code de la maquette
│   ├── sequenceur.js      Orchestration UI
│   ├── audio.js           AudioEngine Tone.js
│   ├── tracks.js          Modèle de pistes
│   ├── mixer.js           UI mixer
│   ├── library.js         Bibliothèque d'instruments
│   └── sequenceur.css     Styles maquette
└── README.md              Ce fichier
```

```
vendor/
└── tone-bundle.js         Tone.js + deps bundlé par esbuild (~870 KB)
```

## Ce que ces POC/maquettes ne valident PAS

- Architecture modulaire V1 (pistes / instruments / séquenceur / mixage séparés)
- 808 granulaire avec kick/snare/hi-hat distincts
- Sampler + import de samples
- Effets (reverb, delay, EQ)
- Arrangement (drag-and-drop patterns)
- Annuler / refaire (20 niveaux)
- Sauvegarde IndexedDB
- Export WAV 16-bit / 44.1 kHz
- i18n FR + EN
- Performance mesurée (NF-PERF)
- Compatibilité GitHub Pages (à tester)

Ces points sont dans le périmètre V1 mais ne sont pas validés par ce POC.

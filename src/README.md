# ALPHA-Band — POC

> **Statut** : Proof of Concept jetable. Le code de ce POC n'est **pas** destiné à être conservé pour la V1.
> Il sert uniquement à valider 4 points critiques du DEB avant d'engager la phase 3 :
> 1. Web Audio API + Tone.js s'installent et tournent
> 2. La chaîne dev (`python3 -m http.server` → navigateur) marche
> 3. NF-UX-01 (premier son < 60 s) est faisable
> 4. Le mapping clavier QWERTY → notes tient la route

## Lancer en local

```bash
# Depuis la racine du repo :
npm install              # installe tone + esbuild (devDep)
npm run bundle:tone      # régénère src/vendor/tone-bundle.js (~870 KB)
npm run serve            # python3 -m http.server 8767 --bind 127.0.0.1
# puis ouvrir http://127.0.0.1:8767/src/ dans un navigateur moderne
```

> Pourquoi le bundle Tone ? Tone.js v15 dépend de `standardized-audio-context`,
> `automation-events` et `tslib` avec des imports sans extension `.js` et des
> "bare specifiers" (`from "tslib"`). Le navigateur ne sait pas les résoudre en
> ESM natif — on bundle donc tout dans un seul fichier avec esbuild. C'est la
> solution la plus simple pour un POC jetable.

Cliquer sur **Démarrer** (pour activer l'audio), puis jouer avec :
- Le clavier visuel à la souris
- Le clavier physique : `A S D F G H J K L` (touches blanches) et `W E T Y U` (touches noires)

## Limites assumées

- Pas de sauvegarde / chargement
- Pas d'export
- Pas d'effets (reverb, delay, EQ)
- Pas de séquenceur
- 1 seul instrument (synthé ADSR)
- Pas de tests, pas de CI, pas de build (à part le bundle Tone)
- Strings en dur (pas d'i18n — sera posé en V1)

## Architecture jetable

```
src/
├── index.html             Page statique
├── style.css              Styles minimaux
├── main.js                Bootstrap (audio unlock + clavier)
├── vendor/
│   └── tone-bundle.js     Tone.js + deps bundlé par esbuild (~870 KB)
└── poc/
    ├── voice.js           Wrapper Tone.js Synth (ADSR)
    └── keyboard.js        Clavier visuel + QWERTY
```

## Ce que ce POC ne teste PAS

- 808, sampler de boucles, bibliothèque
- Mixage (volume, pan, mute)
- Séquenceur pas-à-pas
- Arrangement (timeline)
- Annuler / Refaire
- Sauvegarde IndexedDB
- i18n
- Performance (NF-PERF)
- Compatibilité GitHub Pages
- Import de samples

Ces points sont dans le périmètre V1 mais ne sont pas validés par ce POC.

# ALPHA-Band — POC

> **Statut** : Proof of Concept jetable. Le code de ce POC n'est **pas** destiné à être conservé pour la V1.
> Il sert uniquement à valider 4 points critiques du DEB avant d'engager la phase 3 :
> 1. Web Audio API + Tone.js s'installent et tournent
> 2. La chaîne dev (`python3 -m http.server` → navigateur) marche
> 3. NF-UX-01 (premier son < 60 s) est faisable
> 4. Le mapping clavier QWERTY → notes tient la route

## Lancer en local

```bash
cd src/
python3 -m http.server 8000
# puis ouvrir http://localhost:8000/ dans un navigateur moderne
```

Cliquer sur **Démarrer** (pour activer l'audio), puis jouer avec :
- Le clavier visuel à la souris
- Le clavier physique : `A S D F G H J K L` (touches blanches) et `W E T Y U` (touches noires)

## Limites assumées

- Pas de sauvegarde / chargement
- Pas d'export
- Pas d'effets (reverb, delay, EQ)
- Pas de séquenceur
- 1 seul instrument (synthé ADSR)
- Pas de tests, pas de CI, pas de build
- Strings en dur (pas d'i18n — sera posé en V1)

## Architecture jetable

```
src/
├── index.html        Page statique
├── style.css         Styles minimaux
├── main.js           Bootstrap (audio unlock + clavier)
└── poc/
    ├── voice.js      Wrapper Tone.js Synth (ADSR)
    └── keyboard.js   Clavier visuel + QWERTY
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

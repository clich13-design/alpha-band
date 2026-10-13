# ALPHA-Band — Interface

> **Statut** : V0 de l'interface, codée à partir des maquettes Stitch
> (`docs/diagrams/stitch-*.html|.png`) et du Design System ALPHA-Band.
> Audio réel via Tone.js, ESM natif, zéro étape de build côté navigateur.

## Pages

| Page | Vue | Contenu |
|------|-----|---------|
| `index.html` | **Arrangement** | Timeline de clips, en-têtes de piste, playhead, rack mixer complet (tiroir), inspecteur bas |
| `sequenceur.html` | **Séquenceur** | Grille pas-à-pas 16/32 steps, motifs A/B/C/D, swing, humanize, mixer compact à droite |
| `poc/index.html` | POC synthé ADSR | Preuve de concept jetable conservée (non Touchée) |

Les deux pages partagent **exactement** le même design system, la même barre
de transport et la même bibliothèque latérale.

## Lancer en local

```bash
# Depuis la racine du repo :
npm install              # tone + esbuild
npm run bundle:tone      # régénère vendor/tone-bundle.js (~870 KB)
npm run serve            # python3 -m http.server 8767 --bind 127.0.0.1
```

Puis :

- Arrangement : <http://127.0.0.1:8767/src/index.html>
- Séquenceur : <http://127.0.0.1:8767/src/sequenceur.html>

> **Pourquoi le bundle Tone ?** Tone.js v15 dépend de `standardized-audio-context`,
> `automation-events` et `tslib` avec des imports sans extension `.js` et des
> "bare specifiers" (`from "tslib"`). Le navigateur ne sait pas les résoudre en
> ESM natif — esbuild les aplatit dans un seul fichier.
>
> **Pourquoi `/vendor/tone-bundle.js` (chemin absolu) ?** Les imports relatifs
> (`../vendor/...`) ne sont pas résolus correctement par `python3 -m http.server`.
> Le `/` initial garantit que ça marche en local **et** sur GitHub Pages.

## Design System

### Palette (tokens dans `app/css/tokens.css`)

| Rôle | Token | Valeur |
|------|-------|--------|
| Canvas | `--bg` | `#080e1a` |
| Panneaux, barres | `--surface` | `#0c1428` |
| Contrôles | `--elevated` | `#111d3a` |
| Survol | `--hover` | `#1a2a4a` |
| Creux (pads vides) | `--sunken` | `#05090f` |
| Accent primaire | `--primary` | `#60a5fa` |
| Accent secondaire | `--accent` | `#f472b6` |
| Emerald | `--emerald` | `#34d399` |
| Amber | `--amber` | `#fbbf24` |
| Rose | `--rose` | `#f87171` |

### Typographie

- **JetBrains Mono** (`--font-metric`) — toutes les métriques : BPM, position,
  compteurs de pas, dB, durées. Chiffres tabulaires activés.
- **Inter** (`--font-label`) — labels, titres, corps.

### Zéro bordure

La contrainte « pas de bordure » est tenue **strictement** : aucune propriété
`border-*` dans les feuilles de style. La séparation visuelle passe par :

| Mécanisme | Usage | Variables |
|-----------|-------|-----------|
| Élévation projetée | panneaux posés sur le canvas | `--elev-1` … `--elev-4` |
| Creusement (`inset`) | pads vides, pistes de fader, champs | `--inset-sunken` |
| Relief (`inset`) | contrôles posés | `--inset-raised` |
| Liseré en `box-shadow` | séparateurs d'un pixel | `--seam-*`, `--hair-*` |
| Lueur d'accent | pads actifs, playhead, faders | `--glow-*` |

Les seuls `border: 0` présents sont des réinitialisations du reset global.

## Architecture

```
src/
├── index.html                  Arrangement
├── sequenceur.html             Séquenceur
├── style.css                   Styles du POC synthé (conservé)
├── main.js                     Bootstrap du POC synthé (conservé)
├── poc/
│   ├── index.html              POC synthé ADSR (déplacé depuis src/index.html)
│   ├── voice.js                Wrapper Tone.js Synth (ADSR)
│   └── keyboard.js             Clavier visuel + mapping event.code
├── app/
│   ├── css/
│   │   ├── tokens.css          Design System : couleurs, typo, élévation
│   │   ├── base.css            Reset, primitives (boutons, champs, faders, toast)
│   │   ├── transport.css       Barre de transport 72px
│   │   ├── sidebar.css         Bibliothèque latérale 280px
│   │   ├── arrangement.css     Timeline + inspecteur + tiroir mixer
│   │   ├── mixer.css           Rack complet + rack compact
│   │   └── sequencer.css       Grille pas-à-pas
│   └── js/
│       ├── app.js              Orchestrateur : horloge, clavier, assemblage
│       ├── core/
│       │   ├── store.js        État projet (pub/sub) + persistance localStorage
│       │   ├── audio.js        AudioEngine Tone.js (voix synthétisées)
│       │   ├── dom.js          Helpers (el, faders, ondes, formats)
│       │   └── icons.js        Icônes SVG inline (aucun webfont)
│       └── modules/
│           ├── transport.js    Lecture, tempo, position, patterns, master
│           ├── sidebar.js      Recherche, filtres, bibliothèque, drag & drop
│           ├── sequencer.js    Pads, playhead, mute/solo, outils de motif
│           ├── arrangement.js  Clips, playhead, en-têtes de piste
│           └── mixer.js        Rack complet + rack compact, vumètres
└── README.md                   Ce fichier

vendor/
└── tone-bundle.js              Tone.js + deps bundlé par esbuild (~870 KB)
```

### Contrat des modules

Tous les modules d'interface suivent la même signature : ils reçoivent un
élément racine, le `store` partagé et un objet d'options, montent leur DOM,
et retournent une API minimale.

```js
createTransport(root, store, opts)   → { repaint, root }
createSidebar(root, store, opts)     → { repaint, setCategory, root }
createSequencer(root, store, opts)   → { render, onStep, patchRow, select, … }
createArrangement(root, store, opts) → { render, setPlayhead, setClock, … }
createMixerRack(root, store)         → { stop, root }
createMixerMini(root, store, opts)   → { patch, stop, root }
```

Le `store` est la source unique de vérité : il publie (`on`/`emit`) et persiste
dans `localStorage` sous la clé `alpha-band:project:v1`. Aucune vue ne parle
directement à une autre vue — tout passe par le store.

### Horloge

`app.js` pilote le séquenceur avec un minuteur calé sur le BPM, resynchronisé
sur `Tone.now()` à chaque pas. On n'utilise volontairement pas
`Tone.Transport` : le contrôle reste déterministe et l'interface réagit même
si le contexte audio est indisponible (headless, pas de périphérique → mode
visuel automatique, aucun blocage).

## Raccourcis clavier

| Touche | Action |
|--------|--------|
| `Espace` | Lecture / Pause |
| `Échap` | Stop |
| `←` `→` | Naviguer d'un pas |
| `↑` `↓` | Changer de piste sélectionnée |
| `M` / `S` | Mute / Solo sur la piste sélectionnée |
| `T` | Tap tempo |

Clic droit sur un pad = remplir ou vider toute la colonne.
`Alt` + clic sur un pad = note fantôme.

## Limites assumées (V0)

- Export WAV : stub, pas de rendu hors ligne
- Inserts du mixer : affichage et bypass visuel, pas de chaîne d'effets réelle
- Glisser-déposer des clips : repositionnement horizontal en 1/16, pas de
  redimensionnement ni de découpe
- Pas d'annuler/refaire réel (les boutons sont des stubs)
- i18n : interface en français, non extraite
- Pas de build, pas de CI

## Ce que cette V0 ne valide PAS

- Rendu audio réel (nécessite un navigateur avec Web Audio — validé en local)
- Performance mesurée (NF-PERF)
- Persistance IndexedDB (seul `localStorage` est utilisé)
- i18n FR/EN
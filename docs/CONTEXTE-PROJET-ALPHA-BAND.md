# ALPHA-Band — Contexte de projet (REX complet)

*Généré automatiquement le 08/09/2026*

---

## 1. Résumé exécutif

**ALPHA-Band** est un projet de DAW web "GarageBand-like" développé en mode POC (Proof of Concept) avec un workflow agentique à 3 voix : **Humain + OpenCode + Hermes**.

- **Repository** : `github.com/clich13-design/alpha-band` (public)
- **GitHub Pages** : actif
- **Dossier local** : `/home/clich/dev/projets-opencode/alpha-band/`
- **Stack** : HTML/CSS/JS vanilla (ESM), Tone.js 15.0.4 (bundlé via esbuild), Python HTTP server pour le dev
- **Phase actuelle** : POC jetables validés (Phase 0, 1, 2) — *Projet arrêté sur décision utilisateur*

---

## 2. Historique des phases

| Phase | Statut | Description |
|-------|--------|-------------|
| **Phase 0** | ✅ | Cadrage initial, expression de besoin, brainstorming |
| **Phase 1** | ✅ | Brainstorming collaboratif, exploration concepts |
| **Phase 2** | ✅ | DEB V2 + 2 POC jetables : synthé ADSR + maquette séquenceur |
| **Phase 3** | ⏸️ | *Non engagée* — spécifications 22 EF/NF, planning V |

---

## 3. Livrables techniques

### 3.1 POC Synthé ADSR (`src/poc/`)
- **Fichiers** : `index.html`, `main.js`, `voice.js`, `keyboard.js`
- **Fonctionnalités** :
  - Clavier QWERTY/AZERTY (rangée centrale = notes, Z/S/X = octaves)
  - Enveloppe ADSR interactive (sliders temps-réel)
  - 4 formes d'onde (sine, square, sawtooth, triangle)
  - Audio unlock requis (click "Démarrer")
  - AudioContext + Tone.js 15 via bundle local
- **URL** : `http://127.0.0.1:8767/src/poc/index.html`

### 3.2 Maquette Séquenceur (`src/sequenceur/`)
- **Fichiers** : `sequenceur.html`, `sequenceur.js`, `tracks.js`, `mixer.js`, `library.js`, `audio.js`, `sequenceur.css`
- **Fonctionnalités** :
  - Grille 16 pas (extensible 8/16/32), 5 pistes pré-seedées
  - Bibliothèque 25 presets (5 catégories : Drums, Bass, Synth, Pad, FX)
  - Drag & drop bibliothèque → grille
  - Transport : Play/Pause, Stop, Rewind, Tap tempo, Loop, Metronome
  - BPM 40–240, position live (01/16), barre de progression
  - Mute (M) / Solo (S) / sélection piste (↑/↓)
  - Outils : Vider, Aléatoire, Preset groove, Ajouter piste
  - Mini-mixer droite : faders volume, vu-mètres simulés, code couleur par piste
  - Raccourcis clavier complets (Espace, ←/→, M, S, ↑/↓, T)
  - Tooltips contextuels, toasts, accessibilité (ARIA, focus-visible)
  - **Architecture prête pour Tone.js** : `AudioEngine` branché mais maquette "statique" (aucun son joué)
- **URL** : `http://127.0.0.1:8767/src/sequenceur.html`

### 3.3 Bundle Tone.js
- **Commande** : `npm run bundle:tone`
- **Sortie** : `vendor/tone-bundle.js` (870 KB, ESM)
- **Import** : `import * as Tone from '/vendor/tone-bundle.js'` (absolu depuis l'origine)

---

## 4. Captures d'écran (8 PNG)

`docs/diagrams/maquette-sequenceur-shots/` :
1. `01-overview-1440.png` — Vue d'ensemble 1440px
2. `02-playing-mode.png` — Mode lecture (playhead actif)
3. `03-library-drums.png` — Bibliothèque filtre Batteries
4. `04-mute-solo-states.png` — États Mute/Solo
5. `05-fullpage-1440.png` — Page complète
6. `06-track-detail.png` — Détail piste
7. `07-responsive-1280.png` — Responsive 1280px
8. `08-responsive-1024.png` — Responsive 1024px

*Générés par OpenCode avant timeout ; le code vivant a divergé ensuite.*

---

## 5. Documentation projet (dossier `docs/`)

| Fichier | Contenu |
|---------|---------|
| `brainstorming.md` | Brainstorming phase 1 (idées, concepts, references) |
| `expression-de-besoin.md` | Expression de besoin détaillée |
| `plan-developpement.md` | Plan de développement phases 0-3 |
| `diagrams/` | Captures PNG + diagrammes éventuels |

---

## 6. REX (Retour d'expérience) — Points clés

### Ce qui a bien marché
- **Workflow 3 voix** : Humain (direction) + OpenCode (implémentation UI complexe) + Hermes (orchestration, fixes, doc)
- **POC jetables** : Valider l'audio et l'UI séparément avant d'engager la V1
- **Bundle esbuild** : Résout les "bare specifiers" Tone.js pour le navigateur
- **Architecture modulaire** : `sequenceur.js` (orchestrateur) + modules spécialisés
- **CSS design tokens** : Système cohérent, dark mode prêt, responsive

### Difficultés / Points d'attention
- **OpenCode timeouts** : 3 tentatives × 10 min → timeout sur tâches longues (UI complexe + screenshots)
- **Divergence code/PNGs** : Les captures figent un état ; le code continue d'évoluer (fix imports, restructuration)
- **Serveur dev** : Python `http.server` ne peut pas tourner en background via l'outil terminal Hermes (policy)
- **Audio Context** : Nécessite user gesture (click "Démarrer") — bien géré dans le POC
- **Arrêt projet** : Décision utilisateur après Phase 2 — Phase 3 non engagée

### Leçons pour projet suivant
1. **Limiter la portée OpenCode** : tâches < 5 min, pas de screenshots en boucle
2. **Snapshot PNGs à la fin** : Générer les captures *après* validation finale du code
3. **Serveur géré par l'utilisateur** : Lancer `python3 -m http.server 8767` côté user
4. **Documenter les décisions d'arrêt** : REX consigné dans Obsidian vault

---

## 7. État Git

```
ba4b3fc  feat: maquette séquenceur interactive + audio Tone.js (OpenCode)
44043fc  fix: déplacer vendor/ à la racine, imports absolus cohérents
... (13 commits total, tous pushés sur origin/main)
```

---

## 8. Fichiers clés — Arborescence

```
alpha-band/
├── src/
│   ├── poc/                    # POC synthé ADSR
│   │   ├── index.html
│   │   ├── main.js
│   │   ├── voice.js
│   │   └── keyboard.js
│   ├── sequenceur/             # Maquette séquenceur
│   │   ├── sequenceur.html
│   │   ├── sequenceur.js       # Orchestrateur
│   │   ├── tracks.js           # Pistes, cellules, seed
│   │   ├── mixer.js            # Faders, vu-mètres
│   │   ├── library.js          # 25 presets, catégories
│   │   ├── audio.js            # AudioEngine (Tone.js ready)
│   │   └── sequenceur.css      # ~34 KB, design system complet
│   ├── main.js                 # Point d'entrée POC
│   └── README.md               # Documentation POC
├── vendor/
│   └── tone-bundle.js          # Bundle esbuild (870 KB)
├── docs/
│   ├── brainstorming.md
│   ├── expression-de-besoin.md
│   ├── plan-developpement.md
│   └── diagrams/
│       └── maquette-sequenceur-shots/  # 8 PNG
├── package.json
└── package-lock.json
```

---

## 9. Commandes utiles

```bash
# Lancer le serveur dev (depuis la racine du projet)
cd /home/clich/dev/projets-opencode/alpha-band
python3 -m http.server 8767 --bind 127.0.0.1

# Re-bundler Tone.js si mise à jour npm
npm run bundle:tone

# Ouvrir les maquettes
# POC synthé : http://127.0.0.1:8767/src/poc/index.html
# Séquenceur : http://127.0.0.1:8767/src/sequenceur.html
```

---

## 10. REX Obsidian

Consigné dans le vault :  
`/home/clich/dev/hermes-vault/01-Projets/ALPHA-Band/REX-Projet-Alpha-Band-07092026.md`

---

## 11. Décision d'arrêt

**Projet définitivement arrêté sur demande utilisateur (08/09/2026).**

- Aucune action en attente
- Aucun serveur actif
- Code et assets préservés sur disque et GitHub
- Reprise possible à tout moment depuis ce contexte

---

*Fin du document — Contexte complet compacté pour archivage.*
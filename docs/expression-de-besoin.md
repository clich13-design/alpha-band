# Document d'expression de besoin (DEB) — ALPHA-Band

> **Statut** : V2 — cadrage finalisé le 2026-09-06.
> Nom de produit : **ALPHA-Band**. Nom de code interne : `projet-alpha`.

---

## 1. Contexte et finalité

### 1.1 Contexte

Le projet `projet-alpha` vise à explorer la faisabilité d'une alternative
web au DAW GarageBand (iOS/macOS) en s'appuyant sur un développement
assisté par agent IA (OpenCode). L'objectif n'est pas de concurrencer
les DAW professionnels (REAPER, Bitwig, Ableton Live), mais de valider
qu'un parcours de création musicale **intuitif, web pur, sans
installation** peut être atteint en s'appuyant sur les standards du
navigateur (Web Audio API, Tone.js) et un cycle de développement
rigoureux (plan en V adapté).

### 1.2 Finalité

Permettre à un utilisateur **débutant ou grand public** de :

1. **Entendre un premier son en moins de 60 secondes** sans formation
   ni installation (parcours « premier son »).
2. **Créer un morceau complet** (instruments virtuels, boucles,
   séquenceur, mixage) en moins de 30 minutes.
3. **Manipuler le son** via des contrôles simples (volume, reverb,
   delay, EQ).
4. **Exporter** son morceau en WAV (16 bits / 44,1 kHz stéréo).

### 1.3 Cadrage technique acté

| Décision | Valeur | Source |
|----------|--------|--------|
| Plateforme | **Web uniquement** (navigateur) | Cadrage 2026-09-05 |
| Stack audio | **Web Audio API + Tone.js** | Brainstorming Q1-A |
| Latence | **Non-critère** (pas d'enregistrement temps réel) | Cadrage 2026-09-05 |
| Cible | **Débutants / grand public** | Brainstorming Q2-A |
| Modulaire | **Verticale** (transport, instruments, séquenceur, mixage, export) | Brainstorming Q3-A |
| Validation | **Triple** : exigences + perf + UX | Brainstorming Q4 (A+B+C) |

---

## 2. Utilisateurs cibles et cas d'usage

### 2.1 Persona principal — « Marie, 28 ans, curieuse »

- **Profil** : pas musicienne, utilise Spotify et TikTok, a essayé
  GarageBand sur iPad une fois mais n'a pas poursuivi. Utilise un
  PC portable à la maison (Windows ou macOS, navigateur moderne).
- **Besoin** : créer une boucle ou un jingle personnalisé pour un
  projet perso (vidéo, montage, tonalité de stream).
- **Attente** : résultat audible en moins de 10 minutes, sans
  installation, sans lire une doc.
- **Tolérance** : faible à la friction (pop-ups, étapes techniques,
  jargon audio).
- **Note V2** : la cible V1 est **desktop uniquement** (cf. cadrage
  C1). L'usage mobile est reporté en V2.

### 2.2 Persona secondaire — « Théo, 16 ans, beatmaker amateur »

- **Profil** : utilise BandLab / Soundtrap sur mobile, s'intéresse à la
  MAO.
- **Besoin** : explorer un outil de plus, voir s'il peut compléter son
  setup existant.
- **Attente** : qualité de rendu suffisante pour partager en ligne,
  bibliothèque de boucles correcte.
- **Tolérance** : moyenne — accepte de regarder un tuto si l'outil
  l'intéresse.

### 2.3 Cas d'usage principaux (CU)

| ID | Cas d'usage | Persona | Priorité |
|----|-------------|---------|----------|
| CU-01 | Choisir un instrument et jouer une mélodie au clavier virtuel | Marie | Must |
| CU-02 | Déposer une boucle depuis la bibliothèque sur une piste | Marie | Must |
| CU-03 | Empiler 3-4 pistes (basse + drums + mélodie + pads) | Marie | Must |
| CU-04 | Ajuster le volume et un effet (reverb) sur une piste | Marie | Should |
| CU-05 | Exporter le morceau en WAV ou MP3 | Marie, Théo | Must |
| CU-06 | Sauvegarder / recharger un projet dans le navigateur | Théo | Should |
| CU-07 | Utiliser un séquenceur pas-à-pas pour programmer un rythme | Théo | Should |
| CU-08 | Partager un lien vers le morceau exporté | Théo | Could |
| CU-09 | Export échoue (IndexedDB plein, erreur audio) → message d'erreur clair + action proposée | Marie, Théo | Must |
| CU-10 | Boucle ou sample ne se charge pas → message d'erreur + fallback (boucle ignorée, piste muette) | Marie, Théo | Must |
| CU-11 | Projet corrompu ou schéma obsolète → migration automatique ou message d'erreur + option de réinitialisation | Théo | Should |

---

## 3. Description fonctionnelle

### 3.1 Vue d'ensemble (modules verticaux)

```
┌─────────────────────────────────────────────────────────────┐
│                         UI (présentation)                   │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│Transport │Instruments│Séquenceur│ Mixage   │     Export      │
│ (BPM,    │ (Tone.js │ (step    │ (volume, │  (WAV, MP3)     │
│  play,   │  synths, │  sequen- │  pan,    │                 │
│  stop)   │  samplers)│  cer)    │  effets) │                 │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│              Modèle de morceau (état, persistance)          │
├─────────────────────────────────────────────────────────────┤
│              Moteur audio (Web Audio API + Tone.js)         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Fonctionnalités par module

#### F-TRANSPORT — Transport (Master Clock)

- **F-TRANSPORT-01** : Régler le BPM (60-200, par pas de 1).
- **F-TRANSPORT-02** : Lecture / pause / arrêt.
- **F-TRANSPORT-03** : Retour à zéro.
- **F-TRANSPORT-04** : Affichage du temps courant (mesure:temps:tics).

#### F-INSTR — Instruments virtuels

- **F-INSTR-01** : Clavier visuel (2 octaves minimum) jouable à la
  souris ET au clavier physique (mapping QWERTY → notes).
- **F-INSTR-02** : 3 instruments minimum fournis au lancement :
  synthé simple (sawtooth + enveloppe ADSR), boîte à rythmes 808-style,
  sampler de boucles.
- **F-INSTR-03** : Sélection de l'instrument actif par piste.
- **F-INSTR-04** : Import de samples personnalisés (fichier audio local
  via `<input type="file">`, décodage via `AudioContext.decodeAudioData`,
  formats WAV et MP3 supportés). Le sample importé est assignable au
  sampler comme n'importe quelle boucle de la bibliothèque.
- **F-INSTR-05** : Boîte à rythmes 808 avec sons distincts par pad
  (kick, snare, hi-hat ouvert, hi-hat fermé minimum) et contrôle de
  pitch (±12 demi-tons) et de vélocité (0-127) par pad.
- **F-INSTR-06** : Édition note par note sur le séquenceur du synthé :
  pitch (chromatique, 2 octaves) et vélocité (0-127) par pas.

#### F-SEQ — Séquenceur / Boucles

- **F-SEQ-01** : Glisser-déposer une boucle depuis la bibliothèque vers
  une piste.
- **F-SEQ-02** : Séquenceur pas-à-pas 16 pas pour la boîte à rythmes
  (résolution 1/16, lié au BPM du transport ; 1 pas = 1 double-croche).
- **F-SEQ-03** : Répéter une boucle en boucle (loop on/off).
- **F-SEQ-04** : **Vue arrangement** — blocs réordonnables à la souris
  sur la timeline (type GarageBand) ; chaque bloc représente un pattern
  ou une boucle placée sur une piste ; le réordonnancement est
  drag-and-drop horizontal.
- **F-SEQ-05** : **Annuler / Refaire** (Ctrl+Z / Ctrl+Y) sur toutes
  les actions de l'éditeur (ajout/suppression de piste, réglage de
  volume, déplacement de bloc, activation d'un pas du séquenceur).
  Profondeur minimale : 20 niveaux.

#### F-MIX — Mixage et effets

- **F-MIX-01** : Fader de volume par piste (0-100).
- **F-MIX-02** : Bouton mute par piste.
- **F-MIX-03** : Effet reverb par piste, **3 niveaux chiffrés** (RT60) :
  - `sec` : pas de convolution (bypass)
  - `petit` : RT60 ≈ 0,4 s, pré-delay 10 ms
  - `grand` : RT60 ≈ 2,5 s, pré-delay 30 ms
  Paramètres techniques publics, mesurables par test automatisé.
- **F-MIX-04** : Panoramique stéréo par piste.
- **F-MIX-05** : Effet delay (temps en ms, feedback 0-90 %, mix sec/humide)
  par piste, bypassable.
- **F-MIX-06** : Égaliseur 3 bandes (low / mid / high, gain ±12 dB) par
  piste, bypassable.

#### F-EXPORT — Export

- **F-EXPORT-01** : Export WAV (rendu offline via `OfflineAudioContext`,
  16 bits / 44,1 kHz stéréo).
- **F-EXPORT-02** : _(retiré — MP3 reporté en V2 si besoin ; le WAV est
  le format cible V1 pour préserver NF-PERF-01 startup < 3 s)_
- **F-EXPORT-03** : Téléchargement direct (pas d'upload serveur).

---

## 4. Description non fonctionnelle

### 4.1 Performance

- **NF-PERF-01** : Démarrage de l'application (DOMContentLoaded → 1er
  son jouable) < 3 s sur la **machine de référence** : Chromium 120+,
  4 CPU virtuels, 8 Go RAM, throttling CPU 4×, connexion 4G simulée
  (10 Mbps, 100 ms RTT).
- **NF-PERF-02** : Lecture d'un projet à 8 pistes + 3 effets
  (reverb + delay + EQ) sans dropout échantillonné (`renderedBuffer`
  exempt de NaN/Infinity).
- **NF-PERF-03** : Export WAV d'un morceau de 3 min < 10 s sur la
  machine de référence.

### 4.2 Compatibilité

- **NF-COMPAT-01** : Chrome / Edge / Firefox (2 dernières versions
  majeures).
- **NF-COMPAT-02** : Pas de support IE / Safari < 15.
- **NF-COMPAT-03** : Pas de build natif. Le bundle doit s'ouvrir via
  un serveur statique simple (`python3 -m http.server`,
  `npx serve`). L'ouverture directe en `file://` n'est **pas
  garantie** (CORS sur fetch d'assets audio, restrictions
  `OfflineAudioContext`).
- **NF-COMPAT-04** : Compatible avec un hébergement **GitHub Pages**
  (HTTPS obligatoire, MIME types standards `.html`/`.js`/`.wasm`/`.mp3`/`.wav`,
  pas de service worker en V1, pas de routing serveur — toutes les
  URLs doivent fonctionner en chemin relatif).

### 4.3 Ergonomie et accessibilité

- **NF-UX-01** : Parcours « premier son en 60 secondes » atteignable
  sans aide externe.
- **NF-UX-02** : **i18n** — toutes les chaînes utilisateur sont
  externalisées dans un module `i18n/` avec la fonction `t(key)`.
  V1 livre **le français** ; l'anglais est prêt à activer (fichier
  `en.json` à remplir, ~1 h de travail). Le passage de l'option 2
  (infra posée) à l'option 1 (i18n complet FR + EN livré) ne demande
  pas de refactor du code applicatif.
- **NF-UX-03** : Tooltips explicites sur tous les contrôles audio non
  triviaux (reverb, ADSR).
- **NF-UX-04** : **Audio unlock** — aucun son ne doit être émis avant
  un premier geste utilisateur (clic, touche, touch). L'`AudioContext`
  est créé à l'init mais reste suspendu jusqu'à ce geste ; un
  message d'amorçage invite l'utilisateur à cliquer pour démarrer.

### 4.4 Robustesse et persistance

- **NF-ROB-01** : Sauvegarde automatique du projet dans **IndexedDB**
  toutes les 10 s (quota 10-50 Mo selon navigateur, suffisant pour un
  projet + ses `AudioBuffer` sérialisés).
- **NF-ROB-02** : Récupération du dernier projet à la réouverture
  (avec avertissement dismissable si la dernière sauvegarde date de
  plus de 24 h, basé sur `lastSavedAt` stocké dans le projet).
- **NF-ROB-03** : Le format de sauvegarde est versionné (champ
  `schemaVersion` dans l'objet projet) ; toute migration est
  traitée à l'ouverture.

### 4.5 Sécurité et vie privée

- **NF-SEC-01** : 100 % client-side, aucun upload de projet ou d'audio
  sur serveur tiers.
- **NF-SEC-02** : Aucune dépendance non open-source à l'exécution
  (Tone.js, lamejs, ffmpeg.wasm = OK).

### 4.6 Maintenabilité

- **NF-MAINT-01** : Code structuré selon la modularité verticale
  (transport / instruments / séquenceur / mixage / export).
- **NF-MAINT-02** : Tests unitaires par module (cf. plan en V phase 7).
- **NF-MAINT-03** : Convention Conventional Commits + tags de phase.

---

## 5. Périmètre

### 5.1 Inclus (V1)

- Tout le module F-TRANSPORT, F-INSTR (01-06), F-SEQ (01-05), F-MIX, F-EXPORT.
- 3 instruments : synthé ADSR, boîte à rythmes 808 (pads distincts + pitch/vélocité), sampler de boucles.
- Import de samples personnalisés (WAV + MP3 via `<input type="file">`).
- Vue arrangement drag-and-drop + annuler/refaire (20 niveaux).
- 1 bibliothèque de 20 boucles minimum (royalty-free, à sourcer).
- Export WAV (16 bits / 44,1 kHz stéréo).
- Persistance IndexedDB avec versioning de schéma.
- Gestion des erreurs d'export, de chargement et de migration de projet (CU-09, CU-10, CU-11).

### 5.2 Explicitement exclu (V1) — le « Won't » MoSCoW

- ❌ Enregistrement audio depuis microphone (latence non-critère +
  complexité V1).
- ❌ Support MIDI hardware (pas de WebMIDI en V1).
- ❌ Édition audio (cut/copy/paste sur forme d'onde).
- ❌ Collaboration multi-utilisateurs en temps réel.
- ❌ Cloud storage / partage de projet (uniquement lien vers export).
- ❌ Application mobile native (PWA installable = nice-to-have V2).
- ❌ VST / plugins tiers.

---

## 6. Critères de succès

Le projet est considéré **livrable** lorsque, en phase 8 (validation) :

### Critères fonctionnels (EF couvertes par test)

| ID | Critère | Mesure | EF couvertes |
|----|---------|--------|--------------|
| CS-01 | Parcours « premier son » réussi en < 60 s (sans aide externe) | Test utilisateur sur 3 novices, 100 % doivent y arriver | F-TRANSPORT-02, F-INSTR-01, NF-UX-04 |
| CS-02 | Création d'un morceau à 4 pistes (CU-01+02+03) réussie en < 30 min | Test utilisateur sur 3 novices, ≥ 2/3 doivent y arriver | F-INSTR-02, F-SEQ-01, F-SEQ-03 |
| CS-03 | Export WAV (CU-05) produit un fichier de durée ≥ durée du projet, sample rate 44,1 kHz, 16 bits, stéréo | Vérification automatique via script Node de décodage | F-EXPORT-01, F-EXPORT-03 |
| CS-04 | Aucun **bug bloquant** (définition : empêche la lecture audio ou l'export, ou crash l'onglet) sur 1 h d'utilisation continue par 2 testeurs | Test manuel chronométré | transversal EF |
| CS-05 | **100 % des 22 EF** couvertes par au moins un test automatisé OU un plan de test de validation | Matrice de traçabilité `exigences → tests` | EF-01 à EF-22 |

### Critères non fonctionnels (NF mesurées)

| ID | Critère | Mesure | NF couvertes |
|----|---------|--------|--------------|
| CS-06 | Startup (DOMContentLoaded → 1er son jouable) < 3 s sur machine de référence (Chromium 120, 4 CPU, 8 Go RAM, throttling CPU 4×) | Lighthouse + script Puppeteer | NF-PERF-01 |
| CS-07 | Lecture d'un projet à 8 pistes + 3 effets (reverb + delay + EQ) sans dropout échantillonné (test : `OfflineAudioContext.renderedBuffer` sans NaN) | Script Node avec `web-audio-test-api` | NF-PERF-02 |
| CS-08 | Export WAV d'un morceau de 3 min < 10 s | Script Node de mesure | NF-PERF-03 |
| CS-09 | Compatibilité : le bundle tourne sur Chrome ≥ 110, Edge ≥ 110, Firefox ≥ 110 | Tests manuels + matrice de compatibilité | NF-COMPAT-01, NF-COMPAT-02 |
| CS-10 | Persistance : `lastSavedAt` écrit toutes les 10 s en IndexedDB, projet rechargé identique après refresh | Test E2E Puppeteer | NF-ROB-01, NF-ROB-02, NF-ROB-03 |
| CS-11 | Bundle servable depuis `python3 -m http.server`, `console.error` à 0 après 2 s de chargement | Smoke test CI | NF-COMPAT-03 |
| CS-12 | `git grep` confirme : aucun `console.log`/`debugger` résiduel, aucun TODO/FIXME dans le code mergé | Check pré-merge | NF-MAINT-01, NF-MAINT-02, NF-MAINT-03 |

### Classification des bugs

- **Bloquant** : empêche lecture/export, crash onglet → **bloque la release**
- **Majeur** : fonctionnalité inutilisable mais contournable (ex. EQ sans visualisation de courbe) → bloque release
- **Mineur** : cosmétique, gêne sans bloquer → **ne bloque pas** la release

---

## 7. Ouvertures / suites possibles (V2+)

- PWA installable + support mobile.
- WebMIDI pour contrôleurs physiques.
- Plus d'instruments, plus de boucles.
- Effets supplémentaires (delay, compresseur, distortion).
- Partage via lien (rendu serveur optionnel, pas obligatoire).
- Édition audio de base (trim, fade).

---

## 8. Glossaire

- **DAW** : Digital Audio Workstation (station de travail audio
  numérique).
- **BPM** : Beats Per Minute (tempo).
- **ADSR** : Attack, Decay, Sustain, Release (enveloppe d'un son).
- **Loop** : boucle audio (sample court répété).
- **Step sequencer** : séquenceur pas-à-pas (boîte à rythmes).
- **CI** : Continuous Integration (intégration continue).
- **DEB** : Document d'Expression de Besoin (ce document).

---

## 9. Annexes

- Plan de développement : `docs/plan-developpement.md`
- Brainstorming et décisions : `docs/brainstorming.md`
- Diagrammes : `docs/diagrams/processus_*.{puml,bpmn.xml,png}`

---

## 10. Cadrage V2 (2026-09-06)

Boucle de cadrage supplémentaire, après le DEB V1. Décisions actées :

| # | Question | Décision |
|---|----------|----------|
| C1 | Cible mobile en V1 ? | **Non** — V1 desktop uniquement. Mobile/PWA en V2. |
| C2 | Bibliothèque de boucles | **20 boucles minimum, royalty-free**, sourcées en V1 (licence à documenter dans `LICENSES.md`). |
| C3 | Distribution | **GitHub Pages** (le bundle est statique, hébergé en `gh-pages` ou branche dédiée). |
| C4 | Nom de produit | **ALPHA-Band**. Nom de code interne `projet-alpha` (dossier repo inchangé). |
| C5 | Monétisation | **100 % gratuit**, sans pub, sans tracking, sans compte utilisateur. |
| C6 | i18n | **Option 2** (infra posée dès V1, FR livré, EN prêt à activer). |

### Conséquences sur le DEB

- **Persona Marie** recentré sur desktop (cf. § 2.1 note V2).
- **NF-UX-02** étendu pour spécifier l'infra i18n (cf. § 4.3).
- **NF-COMPAT-04** ajouté en V2 : compatibilité **GitHub Pages** (HTTPS
  obligatoire, MIME types standards, pas de service worker en V1).
- **Périmètre V2 (mobile, marketplace, etc.)** mis à jour dans § 7.

### Identité et licence

- **ALPHA-Band** est un nom de produit. Pas de logo, pas de marque
  déposée en V1. Si le projet mûrit, on traitera l'identité visuelle
  en V2.
- La licence du code source reste à trancher (MIT ? Apache 2.0 ?
  AGPL ?). **Décision prévue en phase 4** (design logiciel), pas
  bloquante pour le DEB.

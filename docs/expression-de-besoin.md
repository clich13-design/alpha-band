# Document d'expression de besoin (DEB) — projet-alpha

> **Statut** : V0 — rédigé par Hermes le 2026-09-06 à partir du cadrage et
> des décisions Q1-Q4 du brainstorming. À soumettre à revue critique
> OpenCode, puis validation humaine.

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

1. **Créer un morceau** multi-pistes (instruments virtuels, boucles,
   séquenceur) en moins de 10 minutes sans formation préalable.
2. **Manipuler le son** via des contrôles simples (volume, effets de
   base : reverb, delay, EQ).
3. **Exporter** son morceau dans un format audio standard (WAV, MP3).

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
  GarageBand sur iPad une fois mais n'a pas poursuivi.
- **Besoin** : créer une boucle ou un jingle personnalisé pour une
  story Instagram ou un projet perso.
- **Attente** : résultat audible en moins de 10 minutes, sans
  installation, sans lire une doc.
- **Tolérance** : faible à la friction (pop-ups, étapes techniques,
  jargon audio).

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

#### F-SEQ — Séquenceur / Boucles

- **F-SEQ-01** : Glisser-déposer une boucle depuis la bibliothèque vers
  une piste.
- **F-SEQ-02** : Séquenceur pas-à-pas 16 pas pour la boîte à rythmes.
- **F-SEQ-03** : Répéter une boucle en boucle (loop on/off).
- **F-SEQ-04** : Réorganiser l'ordre des patterns sur la timeline.

#### F-MIX — Mixage et effets

- **F-MIX-01** : Fader de volume par piste (0-100).
- **F-MIX-02** : Bouton mute par piste.
- **F-MIX-03** : Effet reverb (3 niveaux : sec / petit espace / grande
  salle) par piste.
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
  son jouable) < 3 s sur connexion 4G et machine milieu de gamme.
- **NF-PERF-02** : Lecture d'un projet à 8 pistes + 3 effets sans glitch
  audible (rendu vérifié humainement en phase 8, pas en CI).
- **NF-PERF-03** : Export WAV d'un morceau de 3 min < 10 s.

### 4.2 Compatibilité

- **NF-COMPAT-01** : Chrome / Edge / Firefox (2 dernières versions
  majeures).
- **NF-COMPAT-02** : Pas de support IE / Safari < 15.
- **NF-COMPAT-03** : Pas de build natif (le bundle doit s'ouvrir via un
  serveur statique simple ou en `file://` pour le dev).

### 4.3 Ergonomie et accessibilité

- **NF-UX-01** : Parcours « premier son en 60 secondes » atteignable
  sans aide externe.
- **NF-UX-02** : Interface en français (langue du projet).
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

- Tout le module F-TRANSPORT, F-INSTR, F-SEQ, F-MIX, F-EXPORT.
- 3 instruments : synthé ADSR, boîte à rythmes 808, sampler de boucles.
- 1 bibliothèque de 20 boucles minimum (royalty-free, à sourcer).
- Export WAV (16 bits / 44,1 kHz stéréo).
- Persistance IndexedDB avec versioning de schéma.

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

| ID | Critère | Mesure |
|----|---------|--------|
| CS-01 | Parcours CU-01 + CU-02 + CU-03 + CU-05 réussit en < 10 min par un utilisateur novice (test sur 3 personnes) | Observation chronométrée |
| CS-02 | Aucun bug bloquant sur 1 h d'utilisation continue | Test manuel |
| CS-03 | Toutes les exigences EF couvertes par au moins un test | Matrice de traçabilité |
| CS-04 | Le bundle est servable depuis un simple `python3 -m http.server` | Vérification CI |
| CS-05 | Export WAV + MP3 produit un fichier lisible dans Audacity / VLC | Test manuel |
| CS-06 | Le code passe la CI (tests + lint + build + smoke navigateur) | CI verte |

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

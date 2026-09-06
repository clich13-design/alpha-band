## Brainstorming avec Hermes

*Contexte : projet « Alternative GarageBand avec OpenCode » (DAW multi-pistes,
instruments virtuels, boucles/séquenceur, mixage/effets, export). Chaque question
propose 3 options avec avantages, inconvénients et réserves — sans tranchage final.*

### Question 1 — Quelle stack technique pour un DAW web ou desktop ?

#### Option A — Web Audio API + Tone.js (web pur, navigateur)

**Avantages**
- Aucune installation côté utilisateur : lancement immédiat dans le navigateur, idéal
  pour le prototypage rapide avec OpenCode (déploiement instantané, itérations courtes).
- La Web Audio API est native, à faible latence pour du rendu audio temps réel ;
  Tone.js apporte un haut niveau d'abstraction (Transport, séquenceur, instruments,
  effets) qui accélère le développement.
- Cross-platform universel (Windows, macOS, Linux, mobile) sans compilation native.
- Écosystème riche et évolutif (bibliothèques MIDI, notation, visualisation).

**Inconvénients**
- Latence et fiabilité dépendent du navigateur et du matériel audio de l'utilisateur ;
  gestion des périphériques (interfaces audio, MIDI hardware) limitée.
- Performances sujettes au thread principal et à la gestion du GC ; un gros projet
  multi-pistes peut souffrir de glitches (xruns).
- Export WAV possible, mais MP3/encodage et format projet propriétaire restent à gérer
  manuellement.

**Réserves**
- Convient surtout à un périmètre « boucles + instruments + séquenceur » ; un usage
  professionnel exigeant (latence très faible, gros mixage multipiste temps réel)
  pourrait être hors de portée.

#### Option B — Application desktop via Tauri (Rust + WebView)

**Avantages**
- Coquille native légère (binaire Rust) combinée à une UI web (HTML/CSS/JS) : on garde
  la rapidité de prototypage web majoritairement, via la Web Audio API.
- Taille et empreinte mémoire nettement moindres qu'Electron ; accès aux APIs système
  et fichiers natifs plus simple qu'en navigateur (export fichiers, gestion disque).
- Bonne matrice de compatibilité en distribuant un binaire par OS sans installer de
  runtime lourd.

**Inconvénients**
- Latence audio toujours dépendante de la couche web (WebView) ; l'accès audio bas
  niveau (buffers, dispositifs ASIO/Core Audio) reste contraint, la Web Audio API y
  est exécutée dans la WebView.
- Écologie Rust + WebView plus exigeante en compétences ; le prototypage avec un agent
  (OpenCode) reste possible mais l'outillage Rust est plus verbeux.
- Déploiement / mises à jour à gérer (signature, plateformes), plus lourd qu'un simple
  déploiement web.

**Réserves**
- Bon compromis « web vs natif » pour du cross-platform desktop, mais pas une solution
  audio temps réel de très bas niveau ; à réserver si la cible est desktop avec UI riche.

#### Option C — Desktop natif audio (C++/JUCE, ou Rust/cpal)

**Avantages**
- Contrôle absolu de la chaîne audio et de la latence (buffers gérés à la main,
  intégration des drivers ASIO/Core Audio/WASAPI) — la voie des DAW pro (JUCE est la
  référence pour REAPER, Bitwig).
- Performances maximales temps réel pour un mixage multipiste chargé, sampling, effets
  avancés.
- Pérennité et crédibilité « professionnelle » du rendu audio.

**Inconvénients**
- Prototypage lent et coûteux : compilation native, gestion mémoire/threads temps réel,
  intégration UI native.
- Le développement avec OpenCode est plus laborieux (C++ verbeux, toolchains),
  itérations moins rapides qu'en web.
- Cross-platform difficile (builds par OS, dépendances natives), équipe compétence élevée.

**Réserves**
- Surdimensionné pour une première version « intuitive inspirée de GarageBand » et pour
  le prototypage itératif ; pertinent seulement si la cible est réellement un DAW pro
  haute performance.

---

### Question 2 — Quels besoins utilisateurs prioritaires guideront les fonctionnalités ?

#### Option A — Débutants / grand public (simplicité avant tout)

**Livrer** : un parcours d'entrée guidé, des instruments prêts à l'emploi, une
bibliothèque de boucles, une UI épurée, guidance contextuelle.

**Avantages**
- Aligne le produit sur le modèle GarageBand (simplicité, plaisir immédiat « jouer /
  créer vite »).
- Accès le plus large au marché ; faible coût d'apprentissage.
- Bien adapté à un prototypage itératif rapide (parcours courts, tests d'ergonomie
  simples).

**Inconvénients**
- Risque de limiter tôt les fonctions avancées ; difficulté à couvrir les besoins de
  créateurs confirmés.
- Mesure de la valeur difficile (indicateurs qualitatifs, rétention).

**Réserves**
- Le besoin « être pris en main dès les 10 premières minutes » devient le critère
  central de validation, conditionnant toutes les phases.

#### Option B — Musiciens / producteurs pro et semi-pro (performance & contrôle)

**Livrer** : latence faible, mixage fin, automation, mapping MIDI, export hi-fi,
workflows rapides clavier/souris.

**Avantages**
- Différenciation et qualité perçue ; forte valeur à forte fidélité (latence, stabilité,
  sons).
- Public prêt à adopter un outil technique fiable et à fournir du feedback précis.

**Inconvénients**
- Complexité et coûts de développement élevés ; exigences fonctionnelles denses
  (mixage complet, effets pro, export multi-format).
- Montée en compétence plus longue, besoin de docs avancées.
- Concurrence frontale avec des DAW matures (REAPER, Bitwig, Live).

**Réserves**
- Ce segment « gratuit et performant » est exigeant dans chaque phase de validation
  (tests de latence, de charge, d'automatisation) ; le prototypage avec OpenCode est
  plus contraint.

#### Option C — Création de boucles et de musique électronique (loop-based / step sequencer)

**Livrer** : séquenceur pas-à-pas, librairie de boucles, drum machine, export de
boucles, rapidité de composition — moins axé sur l'enregistrement audio multipiste
classique.

**Avantages**
- Compromis équilibré entre simplicité et « pouvoir » de création ; parcours court,
  plaisir immédiat.
- Périmètre précis qui borne bien le prototypage et les critères de validation
  (boucles, tempo, arrangement).
- Public cible identifiable (beatmakers débutants, producteurs).

**Inconvénients**
- Fonctionnalités d'enregistrement/mixage audio poussées moins couvertes ; portée
  potentiellement trop étroite comme produit final.
- Attractivité dépendante de la qualité et de la taille de la bibliothèque de boucles
  (contenu).

**Réserves**
- À valider aussi comme « porte d'entrée » : ce public pourra ensuite réclamer des
  fonctions professionnelles, ce qui élargit vite le périmètre.

---

### Question 3 — Comment structurer le projet en modules pour faciliter le prototypage avec OpenCode ?

#### Option A — Modularité par domaine vertical (pistes / instruments / séquenceur / mixage)

**Découpage** : un module `transport`, un module `instruments`, un module `sequenceur`,
un module `mixage` (et `export`), chacun avec ses types, actions et tests.

**Avantages**
- Correspond bien au domaine musique : chaque module est compréhensible, testable,
  remplaçable.
- Facilite l'intervention guidée d'OpenCode (interfaces claires entre modules, belles
  frontières de travail par agent).
- Parallélisable et évolutif (on peut étoffer un module sans toucher aux autres).

**Inconvénients**
- Risque de couplages subtils (le séquenceur dépend de l'horloge du transport, le
  mixage des sorties d'instruments) ; il faut définir précisément le contrat de chaque
  interface.
- Des responsabilités « transverses » (état global du morceau, streaming audio) ne
  rentrent dans aucun module.

**Réserves**
- L'identification des interfaces inter-modules (le « contrat ») devient un livrable
  critique des phases de design (4/5) qu'il faut solidifier avant l'implémentation.

#### Option B — Architecture en couches (rendu audio / logique applicative / UI)

**Découpage** : une couche basse « moteur audio » (nodes, buffers), une couche « modèle
applicatif » (documents de morceau, transport, état), une couche « présentation » (UI).

**Avantages**
- Isolation forte rendu vs logique vs interface : le cœur audio est testable sans UI,
  et l'UI peut être prototypée indépendamment.
- Bon terrain pour le prototypage : on peut itérer sur l'UI pendant que le moteur
  évolue, ou inversement (via un mock).
- Favorise une architecture pérenne et maintenable.

**Inconvénients**
- Plus abstrait et plus lourd à mettre en place au début ; le risque de « sur-architecture »
  pour un prototype rapide.
- Cérémonie importante (définition des interfaces entre couches) avant tout code
  fonctionnel.

**Réserves**
- Couplée au fonctionnement temps réel (le cœur audio parle processus vs UI), cette
  clé technique doit être décidée tôt dès les phases 4/5.

#### Option C — Décomposition pilotée par l'IA / prototypage orienté agent (agents par module, tests par module)

**Découpage** : on définit des « workspaces » de prototypage (un par module) où chaque
agent d'OpenCode travaille sur une frontière et des objectifs testables, avec des
contrats de module et des tests de contrat.

**Avantages**
- Tirer parti de la force d'OpenCode : lots de travail autonomes, prototypage accéléré,
  vérification par tests à chaque lot.
- Chaque module a sa « porte d'entrée » (spec + tests), ce qui aligne bien avec le plan
  en V.

**Inconvénients**
- Nécessite une rigueur de documentation (contrats) et d'orchestration des agents ;
  mal cadrée, la structure peut produire des interfaces incohérentes.
- Le « tout par agent » sans supervision produit des résistances et des dysfonctionnements
  à intégrer.

**Réserves**
- Cette option n'est pas exclusive des deux précédentes : elle s'y superpose ; à évaluer
  surtout comme méthode d'orchestration, pas comme architecture.

---

### Question 4 — Quels critères de validation guideront les phases de développement ?

#### Option A — Validation par les exigences et matrice de traçabilité (une exigence = un test)

**Découpage** : chaque exigence EF/ENF reçoit un plan de test (procédure, condition,
résultat attendu), avec une « vérification croisée » (nécessaire, non ambiguë, unique,
testable). Couverture = indicateur, pas fin en soi.

**Avantages**
- Aligne avec le plan de développement (phases 3/7/8, matrice de traçabilité).
- Traçabilité claire, validation de bout en bout objectivable.

**Inconvénients**
- Lourdeur potentielle : rédiger et maintenir l'ensemble des plans de test.
- Sur-unitarisme qui peut donner l'illusion de qualité si la couverture ignore
  l'intégration et la performance.

**Réserves**
- Doit être complétée par des critères non fonctionnels explicites (latence, perf) qui
  ne rentrent pas dans une simple matrice EF.

#### Option B — Validation axée sur la performance et le temps réel (latence, stabilité, charge)

**Découpage** : mesurer la latence audio, le taux de glitches (xruns), la charge
CPU/audio en fonction du nombre de pistes/effets ; déclarer des seuils d'acceptation en
phase de spécification.

**Avantages**
- Critères décisifs pour la nature même d'un DAW (l'expérience dépend de la fluidité).
- Objectivable quantitativement et chiffrable.

**Inconvénients**
- La valeur du temps réel est dépendante du matériel et de la plateforme ; seuils
  difficilement transférables.
- Seul critère de performance, ne dit rien de l'ergonomie ni de l'utilité perçue.

**Réserves**
- À imposer comme série d'ENF dans la phase 3 et à contrôler tôt (dès le prototypage)
  pour éviter les régressions de fond.

#### Option C — Validation centrée utilisateur et ergonomie (parcours, tests d'usage, critères qualitatifs)

**Découpage** : scénarios d'usage issus du DEB, tests de bout en bout sur parcours
(créer un morceau en X minutes, manipuler une boucle), évaluation d'ergonomie avec des
critères observables.

**Avantages**
- Cible directement l'« intuitivité » qui distingue une alternative GarageBand.
- Les résultats qualitatifs riches guident bien les itérations de prototypage.

**Inconvénients**
- Subjectivités, variabilité, coût des sessions de test ; difficile à automatiser dans
  une boucle OpenCode.
- Ne couvre pas à lui seul les risques techniques (performance, robustesse).

**Réserves**
- À croiser avec des seuils quantitatifs des deux options précédentes pour obtenir une
  base de validation solide.

---

### Question 5 — Quelle stratégie de versioning et de collaboration ?

#### Option A — Mono-repo unique avec flux main branché sur CI

Un dépôt unique (`garageband-opencode`) contenant docs + src + tests, branches par
fonctionnalité et PR, CI exécutant les tests unitaires et de validation à chaque merge.

**Avantages**
- Cohérence : les docs (plan en V), le code et les tests vivent ensemble, facilitant la
  traçabilité.
- CI intégrée automatisable (le prototypage par OpenCode peut s'appuyer sur la CI comme
  « garde-fou »).
- Simplifie les retours en arrière entre phases.

**Inconvénients**
- Un seul point de régression : tout passe par le même flux.
- La CI doit être entretenue.

**Réserves**
- Le repo n'est pas aujourd'hui initialisé en git ; il faut décider le mode d'intégration
  (GitHub/GitLab) et les hooks pour les phases du plan.

#### Option B — Branches par phase/feature avec revue et tags de version

Des branches issues de `main` par phase ou par fonctionnalité (ex. `feat/sequenceur`,
`phase-4-design`), revues systématiques et tags de version (`v0.1`, `v0.2`) cohérents
avec les jalons de validation du plan en V.

**Avantages**
- Trace nette de l'avancée par phase/sous-ensemble ; rollout progressif de
  fonctionnalités.
- Facilité de révision/rollback.

**Inconvénients**
- Gestion de drift entre branches si elle devient trop longue ; besoin de discipline de
  merge.

**Réserves**
- À coupler impérativement avec des jalons de validation (chaque tag correspond à un
  jalon, une phase livrée).

#### Option C — Mono-repo + prototypage par agents avec PR automatiques et contrat de tests

On combine mono-repo avec des agents (OpenCode) qui proposent des PR par module, chaque
PR devant passer une CI obligatoire de tests/contrats avant merge.

**Avantages**
- Aligne l'orchestration IA avec la revue de code et la validation (chaque contribution
  est contrôlée par la CI).
- Traçabilité et vérification continue des contrats de modules.

**Inconvénients**
- Dépendance forte à la qualité des contrats et à la rigueur de la CI.
- Nécessite une configuration précise.

**Réserves**
- Prudence sur la sécurité et les permissions des agents ; l'humain doit garder la revue

---

## Q5 — Versioning & collaboration (OpenCode, 2026-09-05)

*Suite du cadrage. Cadrage acté : web pur (Web Audio API + Tone.js), grand
public débutant, modularité verticale, validation triple (exigences + perf +
UX), latence non-critère. Tour OpenCode uniquement — revue Hermes à venir.*

### Question 1 — Stratégie de dépôt

#### Option A — Mono-repo unique (projet-alpha/)

**Avantages**
- Un seul point de vérité : docs, src, tests, traçabilité locale immédiate.
- Un seul `git init`, une seule CI, zéro synchro inter-dépôts ; idéal pour
  un projet modeste piloté par un dev + agent.
- Retours en arrière entre phases (V) naturels : un checkout/revert touche
  tout le contexte.

**Inconvénients**
- Tout est couplé : un commit de doc pollue l'historique du code, et vice
  versa.
- Si le projet grossit, volume et complexité de navigation augmentent.

**Réserves**
- Pertinent tant que le projet reste « prototype éducatif / personnel » ;
  à réévaluer si ajout de collaborateurs externes.

#### Option B — Multi-repo (un par module : transport, instruments, séquenceur, mixage)

**Avantages**
- Isolation maximale : chaque module a son historique, sa CI, ses releases
  indépendantes.
- Force la discipline d'interface (contrats inter-modules définis tôt en
  phase 4/5).
- Évite la pollution croisée docs/code.

**Inconvénients**
- Orchestration lourde : synchro des versions entre repos, tests
  d'intégration cross-repo, gestion des dépendances manuelle.
- Pour un seul dev + agent, la surcharge de maintenance dépasse le
  bénéfice ; risque d'abandon.

**Réserves**
- Justifiable uniquement si le projet atteint une taille significative ou
  si plusieurs équipes co-développent en parallèle.

#### Option C — Repo docs séparé + repo code

**Avantages**
- Séparation nette « spécification » (plan en V, exigences, designs) vs
  implémentation ; chaque repo a sa raison d'être.
- Les docs évoluent librement sans affecter builds ni CI du code.

**Inconvénients**
- Perte de la traçabilité locale : un lien doc↔code doit être maintenu
  manuellement ou via hooks.
- Double maintenance (deux repos, deux CI éventuelles), risque de
  désynchronisation.

**Réserves**
- Justifiable si les documents sont destinés à être publiés ou révisés
  séparément ; sinon, friction supplémentaire sans valeur claire.

### Question 2 — Convention de branching

#### Option A — Trunk-based (tout sur main, branches très courtes)

**Avantages**
- Flux ultra-simple : commit/push/merge fréquent sur main, pas de longues
  branches divergentes.
- Idéal pour un workflow agentic : OpenCode produit des lots courts,
  mergeables rapidement.
- Réduit conflits de merge et dette de branch.

**Inconvénients**
- Pas de branche d'intégration dédiée : régressions vont directement sur
  main.
- CI très fiable requise comme filet de sécurité (tests + lint à chaque
  push).

**Réserves**
- Pertinent si la CI (Q4) couvre tests + lint + build ; sinon, trop
  risqué pour main.

#### Option B — GitFlow adapté (main / develop / feature-*)

**Avantages**
- `main` = historique de validation, `develop` = intégration continue,
  `feature-*` = travail isolé.
- Bonne correspondance avec le plan en V : chaque phase = branche
  `feature/phase-X`.
- Releases propres (tags uniquement sur main).

**Inconvénients**
- Processus plus lourd : merge feature→develop, puis develop→main, deux
  niveaux à gérer.
- Pour un dev seul, complexité organisationnelle disproportionnée.

**Réserves**
- Pertinent si jalons de release clairs et CI peu mature ; `develop`
  sert de zone tampon.

#### Option C — Branches par phase du plan en V (`phase-0-cadrage`, `phase-1-brainstorming`, …)

**Avantages**
- Traçabilité directe avec le plan : chaque branche = une phase, la
  revue de merge = la validation de phase.
- Historique lisible : ordre d'avancement visible immédiatement.
- Tags de version alignés avec les conclusions de phase.

**Inconvénients**
- Contenu doc et code dans la même branche, diffs parfois confus.
- Branches précoces (0-2) contiennent surtout du markdown ; peu de CI
  utile.
- Boucles de retour du V = branches à gérer de manière complexe.

**Réserves**
- À combiner avec mono-repo (1-A) ; ne pas utiliser si modules dans
  repos séparés.

### Question 3 — Politique de PR

#### Option A — PR obligatoire avec 1 reviewer humain

**Avantages**
- Qualité maximale : chaque ligne relue par un humain avant merge.
- Documentation naturelle des décisions (commentaires de PR).

**Inconvénients**
- Projet solo (1 dev + agent) = processus en miroir, friction sans
  bénéfice réel de qualité inter-équipes.
- Ralentit les itérations rapides de prototypage.

**Réserves**
- Pertinent uniquement si collaborateurs humains ; en solo, la revue se
  fait dans la conversation OpenCode.

#### Option B — PR obligatoire avec revue OpenCode + 1 humain

**Avantages**
- Double filet : OpenCode vérifie la conformité technique (tests, lint,
  style) avant validation humaine du fond.
- Bon compromis qualité/vitesse : l'agent absorbe la revue mécanique.

**Inconvénients**
- Humain reste seul décideur ; s'il est souvent absent, PR stagnent.
- Configuration de l'agent-reviewer nécessaire (permissions, accès PR).

**Réserves**
- Pertinent si humain disponible régulièrement ; nécessite critères de
  revue agent bien définis.

#### Option C — Commit direct sur main (pas de PR)

**Avantages**
- Vitesse maximale : pas de friction, idéal pour un workflow solo.
- Chaque push = travail intégré, pas de branches pendantes.

**Inconvénients**
- Aucun filet de sécurité formel : une erreur passe directement sur
  main.
- Historique potentiellement désordonné.

**Réserves**
- Acceptable si et seulement si CI forte (Q4) agit comme garde-fou ;
  à réviser dès qu'un second collaborateur rejoint.

### Question 4 — CI minimale

#### Option A — Tests unitaires uniquement

**Avantages**
- Mise en place rapide : un runner, un script test, c'est prêt.
- Filtre les régressions fonctionnelles de base.

**Inconvénients**
- Ne couvre pas style, build, erreurs de forme ; code fonctionnel mais
  illisible ou non buildable.
- Faible confiance globale dans la qualité du code mergé.

**Réserves**
- Minimum vital ; suffisant pour prototype très précoce, insuffisant dès
  que le code grossit.

#### Option B — Tests + lint + build

**Avantages**
- Triple garde-fou : fonctionnel (tests), forme (lint), constructibilité
  (build) ; couvre les 3 axes principaux de qualité automatisable.
- Build vérifie la production d'un artefact valide (bundle, page
  chargable).
- Coût CI raisonnable (quelques minutes par push).

**Inconvénients**
- Ne couvre pas la qualité audio/UX (rendu sonore, timing).
- Configuration initiale linter + build à ne pas négliger.

**Réserves**
- **Recommandé comme CI minimale pour ce projet** : couvre les risques
  principaux avec effort raisonnable ; rendu audio vérifié humainement ou
  via tests d'intégration en phase 8.

#### Option C — Tests + lint + build + rendu audio automatisé

**Avantages**
- Couverture maximale : vérifie que le code produit bien un son, des
  instruments fonctionnels, un séquenceur qui joue.
- Détection des régressions audio profondes (nodes silence, buffer
  cassé).

**Inconvénients**
- Très complexe : environnement audio headless (Puppeteer + Web Audio
  mock, ou runner avec périphérique audio virtuel).
- Fragile : résultats audio dépendent du matériel, navigateur headless,
  seuils ; faux positifs fréquents.
- Coût de maintenance élevé pour bénéfice incertain à ce stade.

**Réserves**
- Pertinent en phase 8 (validation finale) ou pour tests d'intégration
  spécifiques, pas comme CI quotidienne dans les premières phases.

### Question 5 — Gestion des versions

#### Option A — SemVer strict (`v1.2.3`)

**Avantages**
- Standard reconnu, compris universellement ; outils (npm, Docker, CI)
  l'interprètent nativement.
- Sémantique claire : major = breaking, minor = feature, patch = fix.

**Inconvénients**
- En phase de prototypage (avant v1.0.0), SemVer contraignant : tout
  est `0.x`, signification floue.
- Difficile à appliquer strictement quand le produit change radicalement
  entre phases du V.

**Réserves**
- Pertinent à partir de la phase 6 (implémentation) ou quand une version
  « publishable » existe ; pas adapté aux phases 0-5.

#### Option B — Tags par phase du plan en V (`v0-cadrage`, `v1-brainstorming`, `v2-DEB`, `v3-exigences`, `v4-design-logiciel`, `v5-design-detaille`, `v6-implementation`, `v7-tests-unitaires`, `v8-validation`)

**Avantages**
- Traçabilité parfaite avec le plan : chaque tag = exactement une
  validation de phase.
- Historique lisible par n'importe qui (même sans connaître le projet) :
  ordre et signification explicites.
- Permet de revenir à l'état exact de n'importe quelle phase.

**Inconvénients**
- Pas de sémantique de rupture/version : on ne sait pas si `v5` est
  compatible avec `v4`.
- Ne suit pas les conventions standard (SemVer, CalVer), peut
  surprendre des outils automatisés.

**Réserves**
- **Recommandé pour les phases 0-5** : correspond au workflow du plan
  en V et au mode documentaire du projet ; bascule vers SemVer en
  phase 6+.

#### Option C — Tags par jalon utilisateur (`v0-prototype-jouable`, `v1-beta`, `v2-1.0`)

**Avantages**
- Focalisé valeur utilisateur : chaque tag = état du produit
  « jouable » ou « observable ».
- Communication claire avec utilisateurs potentiels.

**Inconvénients**
- Jalons subjectifs et changeants au fil du prototypage ; risque de
  tags incohérents ou déplacés.
- Ne correspond pas au plan en V (organise par phase de dev, pas par
  jalon utilisateur).

**Réserves**
- Pertinent en phase 8 (validation finale) ou pour démos publiques ;
  pas adapté au suivi interne phases 0-7.

---

## Décisions Q5 (2026-09-06)

| # | Question | Décision | Implémentation |
|---|----------|----------|----------------|
| Q5.1 | Stratégie de dépôt | **A — Mono-repo unique** | `projet-alpha/` = un seul dépôt. `git init` fait le 2026-09-06. |
| Q5.2 | Convention de branching | **D — Trunk-based + branches éphémères par tâche** | `main` toujours vert. Tâches OpenCode sur branches `feat/*`, `fix/*` (vie < 1 jour, squash-merge). **Boucles de retour** = `git revert <commit>` sur main, jamais suppression d'historique. |
| Q5.3 | Politique de PR | **Régime mixte** | Code → PR obligatoire, revue OpenCode (mécanique) + toi (fond). Doc → validation Hermes (cohérence) puis toi (approbation finale). **Pas de validation de phase automatique** : tu valides explicitement. |
| Q5.4 | CI minimale | **B+ (tests + lint + build + smoke navigateur)** | Smoke Puppeteer : charge `dist/index.html`, vérifie 0 `console.error` en 2 s. Audio headless = reporté à la phase 8. |
| Q5.5 | Gestion des versions | **B — Tags par phase** (0-5), puis **SemVer à partir de la phase 6** | Tags `v0-cadrage` … `v8-validation` posés par toi après validation. **Bascule SemVer** = tag `v1.0.0-prototype` à la fin de la phase 6. |

### Convention `git revert` (Q5.2)

Chaque commit sur main doit rester **réversible individuellement** par
`git revert <sha>`. Conséquences :

- Pas de commit « wip » ou « fix typo » cumulé ; squash-merge des branches
  éphémères garantit un commit atomique par tâche.
- Les boucles de retour du plan en V (ex. phase 8 → phase 3) ne se font
  **jamais** par reset/rebase : elles passent par un commit de revert
  documenté dans le message.
- Le format de message de commit recommandé : `<type>(<scope>): <sujet>`
  (Conventional Commits), ex. `feat(transport): horloge BPM maître`.

### Convention de validation des phases (Q5.3)

```
Code :   OpenCode PR ─► OpenCode review ─► humain review (toi) ─► merge
Doc  :   Hermes PR  ─► Hermes review    ─► humain review (toi) ─► merge
Phase :  PR mergée   ─► (tu valides)    ─► tag manuel (toi)       ─► release
```

Pas de tag automatique : le tag reste ton acte explicite de validation.

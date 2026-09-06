# Plan de développement — projet-alpha

Ce document décrit le déroulement complet du projet, de la clarification du besoin
jusqu'à la livraison. Le projet suit un **cycle en V adapté** : les phases de
brainstorming et de prototypage permettent de converger vers un besoin clair avant
toute rédaction formelle, puis chaque livrable est validé avant d'engager la phase
suivante.

---

## Vue d'ensemble

| Phase | Livrable | Porteur | Validation |
| ----- | -------- | ------- | ---------- |
| 0. Cadrage | Périmètre initial + questions ouvertes | Toi + assistant | Accord sur le périmètre |
| 1. Brainstorming | Compte-rendu d'idées, options, choix retenus | Toi + assistant | Choix validés ensemble |
| 2. Prototypage | Document d'expression de besoin (DEB) | Toi + assistant | DEB relu et approuvé |
| 3. Spécification d'exigences | Spécification des exigences + plans de test | Toi + assistant | Exigences approuvées |
| 4. Design logiciel | Spécification de design logiciel | Assistant | Revue avec toi |
| 5. Design détaillé | Spécification de design détaillé | Assistant | Revue avec toi |
| 6. Implémentation | Code source conforme aux designs | Assistant | Relecture de code |
| 7. Tests unitaires | Jeux de tests unitaires + exécution | Assistant | Couverture et 100 % vert |
| 8. Validation | Rapport de tests de validation des exigences | Assistant | Conclusion : exigences satisfaites |

---

## Phase 0 — Cadrage

Avant tout développement, on précise :

- l'objectif général du projet ;
- les utilisateurs cibles ;
- l'environnement prévu (langage, plateforme, nouvelle UI ou CLI, etc.) ;
- les contraintes connues.

**Points à éclaircir ensemble** : nature du logiciel, interactivité, langage/stack
préférés, critères de réussite.

---

## Phase 1 — Brainstorming (itérative)

Sessions structurées entre toi et moi :

1. **Tour d'horizon des idées** : chacun propose des fonctionnalités, des scénarios
   d'usage, des limites.
2. **Questionnement croisé** : on challenge chaque idée (utilité, faisabilité, coût,
   priorité).
3. **Synthèse** : classement MoSCoW (Must / Should / Could / Won't) des fonctionnalités.
4. **Consolidation** : le compte-rendu de brainstorming (nouvelles idées, décisions,
   points abandonnés) alimente la phase suivante.

Cette phase est itérative : on la répète tant que des zones d'ombre subsistent.
Sa conclusion marque la fin des échanges « ouverts » ; la suite devient exécutoire.

---

## Phase 2 — Prototypage → Document d'expression de besoin (DEB)

À partir des résultats du brainstorming, on réalise des maquettes ou prototypes
rapides (parcours utilisateur, écrans, formats de données) pour matérialiser les
idées. Chaque itération de prototypage sert à vérifier un point du besoin.

### Résultat attendu : Document d'expression de besoin

Le DEB, produit de vérification de cette phase, comprend :

- **Contexte et finalité** du projet ;
- **Utilisateurs cibles** et cas d'usage principaux ;
- **Description fonctionnelle** des fonctionnalités attendues (avec le vocabulaire
  retenu lors du brainstorming) ;
- **Description non fonctionnelle** : performance, ergonomie, compatibilité,
  contraintes techniques pressenties ;
- **Périmètre** : ce qui est inclus et ce qui est explicitement exclu (le « Won't ») ;
- **Critères de succès** à partir desquels la validation finale s'appuiera.

### Validation de la phase

Le DEB est relu et approuvé par toi. Toute modification ultérieure reste possible
mais passe par une mise à jour maîtrisée du document.

---

## Phase 3 — Spécification d'exigences

Le DEB est traduit en exigences formelles et vérifiables.

Le document **« Spécification d'exigences »** contient :

- **Exigences fonctionnelles** (EF-xx) : chaque comportement attendu, formulé de
  façon testable (verbe d'action, entrées/sorties, règles).
- **Exigences non fonctionnelles** (ENF-xx) : performance, robustesse, utilisabilité,
  maintenabilité, portabilité, sécurité.
- **Matrice de traçabilité** : chaque exigence est reliée aux éléments du DEB qu'elle
  implémente.
- **Critère d'acceptation** associé à chaque exigence (condition mesurable).

### Plans de test associés

Chaque exigence reçoit un **plan de test de validation** précisant la procédure, les
conditions et le résultat attendu. Ces plans servent directement à la phase 8.

### Validation de la phase

Revue contradictoire (« Vérifications croisées ») : chaque exigence doit être
nécessaire (reliée au DEB), non ambiguë, unique et testable. Approbation par toi.

---

## Phase 4 — Spécification de design logiciel (architecture)

Conception de haut niveau, sans détail d'implémentation :

- décomposition en modules/composants et leurs responsabilités ;
- architecture générale (couches, dépendances entre composants) ;
- choix techniques structurants (langage, bibliothèques, interfaces externes) ;
- stratégies transverses : gestion d'erreurs, entrées/sorties, configuration ;
- correspondance **exigences → composants** (chaque exigence est couverte).

### Validation de la phase

Vérification que l'architecture couvre toutes les exigences ; revue avec toi.

---

## Phase 5 — Spécification de design détaillé

Conception détaillée de chaque composant :

- structure du code (classes, fonctions, modules, fichiers) ;
- signatures, algorithmes et structures de données clés ;
- formats de données et protocoles internes ;
- règles d'utilisation des bibliothèques retenues et conventions de code ;
- cas d'erreur et comportements limites traitées en local.

### Validation de la phase

Revue de conformité ; le design détaillé est la référence pour l'implémentation.

---

## Phase 6 — Implémentation

Rédaction du code conforme aux designs détaillés :

- écriture par composant dans l'ordre défini par la phase 5 ;
- respect des conventions en vigueur (langage retenu, nommage, structure des
  fichiers) ;
- auto-relecture à chaque étage (pas de code « mort », pas de logique laissée en
  suspens, gestion des cas limites) ;
- documentation technique minimale d'accompagnement si nécessaire.

### Validation de la phase

Relecture de code croisée et conformité au design détaillé avant passage aux tests.

---

## Phase 7 — Tests unitaires

Vérification du comportement de chaque unité de code indépendamment du reste :

- un jeu de tests unitaires par module/unité, couvrant les cas nominaux, limites et
  d'erreur ;
- capture des exigences au plus fin (aspects unitaires) ;
- exécution et correction jusqu'à obtenir 100 % de réussite ;
- suivi du taux de couverture comme indicateur, pas comme fin en soi.

### Validation de la phase

Tous les tests unitaires passent ; couverture jugée suffisante pour le périmètre.

---

## Phase 8 — Tests de validation de la spécification d'exigences

Vérification de bout en bout que le produit satisfait la spécification d'exigences
(phase 3) :

- exécution des **plans de test de validation** préparés en phase 3, exigence par
  exigence ;
- tests de bout en bout sur scénarios utilisateurs issus du DEB ;
- objet du rapport : conclusion explicite « exigence couverte / non couverte » avec
  les éventuelles réserves.

### Validation de la phase

**Rapport de validation** : si toutes les exigences (EF et ENF) sont couvertes et
satisfaites, le projet est livrable ; sinon, retour structuré vers la ou les phases
concernées (défaut : phase 5–7 ; besoin manquant ou erroné : phase 1–3).

---

## Boucles de retour

Le flux principal est séquentiel, mais chaque phase peut générer un retour vers une
phase antérieure :

| Défaut constaté en | Retour vers |
| ------------------ | ----------- |
| Phase 8 | 5 (design introuvable) / 3 (exigence à reformuler) / 1–2 (besoin mal couvert) |
| Phase 7 | 5 (logique mal spécifiée) / 6 (bogue d'implémentation) |
| Phase 6 | 5 (conception incomplète) |

Chaque retour est formalisé au fil de l'eau (mise à jour des documents concernés et
de la matrice de traçabilité).

---

## Organisation des livrables

Tous les documents produits vivent dans `docs/` :

| Fichier | Contenu |
| ------- | ------- |
| `docs/brainstorming.md` | Comptes-rendus et décisions des sessions (phase 1) |
| `docs/expression-de-besoin.md` | Document d'expression de besoin (phase 2) |
| `docs/specification-exigences.md` | Exigences EF/ENF + traçabilité (phase 3) |
| `docs/plans-de-validation.md` | Plans de test de validation (phase 3) |
| `docs/design-logiciel.md` | Design logiciel / architecture (phase 4) |
| `docs/design-detaillé.md` | Design détaillé (phase 5) |
| `docs/rapport-validation.md` | Rapport final de validation (phase 8) |

L'implémentation vit dans `src/`, les tests unitaires dans `tests/`.

---

## Risque et méthode de conduite

- **Chaque phase est courte** : on valide avant d'enchaîner, l'effort est concentré
  sur le besoin plutôt que sur la documentation superflue.
- **Langue française** : tous les documents, interfaces et messages utilisateur sont
  rédigés en français.
- **Simplification volontariste** : absence de processus lourds ; ce plan sert de
  boussole aux échanges (brainstorming, choix, révisions), pas de contrainte
  administrative.


---

## Brainstorming

Voir [`brainstorming.md`](brainstorming.md) pour le compte‑rendu de la phase 1.

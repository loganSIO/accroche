# Plan d'action — frontend Accroche

## Contexte

J’ai pris connaissance des documents suivants :
- [README.md](../README.md)
- [docs/modele-donnees-MVP.md](./modele-donnees-MVP.md)
- [docs/architecture-couches-MVP.md](./architecture-couches-MVP.md)
- [docs/archive/plan-frontend-simon-claude.md](./archive/plan-frontend-simon-claude.md)

Le backend est encore en construction, mais le frontend doit commencer en s’appuyant sur les routes déjà écrites et en évitant toute modification du backend sauf si c’est absolument nécessaire.

Le but est de créer un site web ayant les fonctionnalités suivantes :
- une page d’accueil avec une carte sur laquelle l’ensemble des utilisateurs seront visibles
- une possibilité de se connecter ou de s’inscrire
- si l’inscription est choisie, un ensemble de champs devra être rempli selon le modèle métier déjà pensé
- une page permettant aux utilisateurs inscrits de visualiser les personnes qui cherchent un groupe / un membre en fonction de leur profil utilisateur
- une possibilité de prendre contact
- une page pour la messagerie

Le frontend doit respecter les choix techniques déjà documentés dans le projet et les modules existants, sans ajouter de complexité inutile.

## Principes de conception

### 1. Respect du modèle métier

Le front doit refléter la logique métier décrite dans [docs/modele-donnees-MVP.md](./modele-donnees-MVP.md) :
- un utilisateur possède un compte unique
- les profils (musicien, groupe, founding) sont séparés des recherches actives
- les résultats de matching sont calculés côté backend et consommés côté frontend
- le contact est une action humaine distincte du match

Cela implique que le frontend ne doit pas recalculer les scores. Il doit afficher les données déjà servies par le backend, notamment :
- score_global
- sous_scores.instrument
- sous_scores.style
- sous_scores.zone
- sous_scores.disponibilite
- sous_scores.niveau

### 2. Respect de l’architecture du projet

Le projet est construit selon une logique d’architecture hexagonale et de couches, décrite dans [docs/architecture-couches-MVP.md](./architecture-couches-MVP.md).

Les règles à respecter côté frontend :
- ne pas toucher au backend, sauf si vraiment nécessaire
- séparer clairement les responsabilités UI / types / API / pages
- garder le traitement métier côté backend
- exposer des données en frontend de manière lisible et robuste

### 3. Pas de complexité inutile

Le document [docs/archive/plan-frontend-simon-claude.md](./archive/plan-frontend-simon-claude.md) a déjà tranché plusieurs points :
- React + Vite, pas Next.js
- TypeScript
- pas de gestion d’état globale prématurée
- pas de librairie de carte au démarrage si elle n’est pas nécessaire
- pas d’ajout inutile de dépendances

Le frontend doit donc rester simple, fonctionnel et aligné avec la réalité de l’application actuelle.

## Stack technique retenue

Le frontend part déjà sur les technologies suivantes :
- React
- TypeScript
- Vite
- modules déjà présents dans le package frontend

Les dépendances à privilégier :
- React + TypeScript + Vite (déjà installé)
- fetch natif pour les appels API
- un router simple si besoin de plusieurs pages distinctes
- aucune librairie de carte avant validation du besoin métier
- aucune gestion d’état globale tant que le besoin ne justifie pas ce choix

## Objectif métier principal

Accroche est une application de mise en relation entre musiciens et groupes.

Le produit vise à permettre :
- à un musicien de chercher un groupe ou de chercher à monter un groupe
- à un groupe de chercher un musicien pour un poste précis
- à un algorithme de calculer un score de compatibilité en %, visible et explicable
- à l’utilisateur de prendre contact avec un profil qui correspond
- à la discussion de se passer dans un espace dédié de messagerie

La carte publique sert de point d’entrée visuel et de repérage géographique.

## Documentation de référence

Les éléments qui structurent ce plan sont :
- [README.md](../README.md) : vue d’ensemble du produit, stack et API
- [docs/modele-donnees-MVP.md](./modele-donnees-MVP.md) : schéma de données métier
- [docs/architecture-couches-MVP.md](./architecture-couches-MVP.md) : architecture de l’application
- [docs/archive/plan-frontend-simon-claude.md](./archive/plan-frontend-simon-claude.md) : plan d’initialisation frontend recommandé

## Structure du frontend à adopter

On va découper le frontend de manière claire pour éviter le mélange des responsabilités :

```text
src/
├── api/
│   ├── client.ts
│   ├── users.ts
│   ├── matches.ts
│   ├── contacts.ts
│   └── messages.ts
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── AuthModal.tsx
│   ├── map/
│   │   ├── MapPanel.tsx
│   │   └── UserMarker.tsx
│   ├── profile/
│   │   ├── ProfileCard.tsx
│   │   ├── RegisterForm.tsx
│   │   └── LoginForm.tsx
│   ├── matching/
│   │   ├── MatchList.tsx
│   │   └── MatchCard.tsx
│   └── messaging/
│       ├── ConversationList.tsx
│       └── ChatPanel.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── DiscoverPage.tsx
│   └── MessagingPage.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useMatches.ts
│   └── useMessages.ts
├── types/
│   ├── user.ts
│   ├── profile.ts
│   ├── match.ts
│   └── message.ts
├── styles/
│   ├── global.css
│   └── app.css
├── App.tsx
├── main.tsx
└── index.css
```

Cette organisation est cohérente avec le projet et permet de faire évoluer les écrans sans rendre le code ingérable.

## Plan d’action par phases

### Phase 1 — Fondations et architecture du frontend

#### Objectif
Mettre en place les fondations de l’application front : structure, navigation, types et point d’entrée API.

#### Tâches
- créer l’architecture générale de dossiers
- préparer le layout principal du site
- mettre en place la navigation de base
- centraliser les appels HTTP dans un client API
- définir les types TypeScript à partir du modèle métier
- créer les composants de base du site

#### Livrables attendus
- App shell propre
- structure de pages
- types centralisés
- point d’entrée API unique
- base UI stable pour les écrans suivants

#### Points importants
- Réutiliser les modules déjà présents
- Ne pas ajout de gestionnaire de state global trop tôt
- Préparer les types avec le modèle de données existant

### Phase 2 — Page d’accueil + carte + authentification

#### Objectif
Créer la page d’accueil publique avec une carte visible et une zone d’authentification.

#### Éléments à intégrer
- carte visible de la page d’accueil
- marqueurs / points d’intérêt sur la carte pour représenter les profils ou utilisateurs actifs
- bouton “Se connecter”
- bouton “S’inscrire”
- formulaire de connexion
- formulaire d’inscription
- filtres simples sur la carte ou l’écran : ville, instrument, style, type de profil

#### Formulaire d’inscription
Le formulaire d’inscription doit être cohérent avec le modèle de données :
- email
- mot de passe
- ville
- type de profil : musicien / groupe / founding
- champs dynamiques selon le profil

#### Champs dépendant du profil

##### MusicianProfile
- instruments
- styles
- niveau
- disponibilité
- objectif
- bio

##### GroupProfile
- nom du groupe
- styles
- localisation
- description

##### FoundingProfile
- styles
- localisation
- description

#### Points de vigilance
- le frontend doit gérer des formulaires modulaires pour éviter de surcharger l’utilisateur
- la logique de validation doit rester simple mais robuste
- le formulaire doit être préparé pour s’adapter aux endpoints backend déjà existants

#### Livrables attendus
- page d’accueil fonctionnelle
- bouton de connection/inscription visible
- carte sur la home
- formulaire d’inscription complet et cohérent
- formulaire de connexion basique

### Phase 3 — Page de découverte / matching

#### Objectif
Permettre aux utilisateurs inscrits de voir les personnes qui cherchent un groupe / un membre en fonction de leur profil.

#### UX attendue
- un musicien voit les groupes / postes ouverts qui correspondent à ses compétences et à sa zone
- un groupe voit les musiciens susceptibles d’être compatibles avec un poste donné
- chaque résultat affiche au moins :
  - nom / profil
  - score global
  - sous-scores visibles
  - bouton “Prendre contact”

#### Points clés
- le “matching” est affiché selon les résultats du backend
- le frontend n’a pas à recalculer le score, seulement à l’afficher
- l’interface doit expliquer pourquoi le score est élevé ou faible
- les sous-scores doivent être visibles, ce qui correspond au modèle de données déjà pensé

#### Sous-scores à afficher
- instrument
- style
- zone
- disponibilité
- niveau

#### Contrat visuel
Chaque carte de match doit présenter :
- profil concerné
- score global
- sous-scores détaillés
- bouton d’action : prendre contact
- éventuellement un accès au profil détaillé

#### Livrables attendus
- page de découverte fonctionnelle
- liste de profils / groupes compatibles
- affichage explicite des scores
- interaction “prendre contact”

### Phase 4 — Page de messagerie

#### Objectif
Créer un espace pour discuter avec une personne rencontrée via un match ou un contact.

#### Structure attendue
- liste des conversations
- panneau principal de discussion
- possibilité d’envoyer / recevoir un message
- indication d’état des messages

#### Éléments de base
- liste des conversations de l’utilisateur
- ouverture d’une conversation
- affichage des messages
- champ de saisie
- bouton d’envoi

#### Objectif MVP
La messagerie doit être fonctionnelle au niveau UI et structurée pour accueillir un backend plus complet ensuite.

#### Livrables attendus
- page de messagerie connectée à un système de conversations
- interface minimale mais exploitable
- structure prête pour les APIs de messages

### Phase 5 — Validation de l’intégration avec le backend

#### Objectif
Valider que le frontend fonctionne avec les routes backend déjà écrites ou prévues.

#### Tâches
- vérifier que le frontend peut appeler l’API backend
- valider les réponses au format attendu
- gérer correctement les erreurs de requête
- tester les cas vides, erreurs réseau et réponses inattendues
- vérifier que le format de réponse est bien :

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "...",
    "version": "v1"
  }
}
```

- gérer les erreurs au format :

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

#### Points importants
- ne pas modifier le backend sauf si c’est absolument nécessaire
- les erreurs de CORS peuvent apparaître si le backend n’autorise pas les appels depuis le frontend
- si une erreur CORS se produit, il faut signaler précisément qu’il s’agit d’un point backend et non d’un bug frontend

Le document [docs/archive/plan-frontend-simon-claude.md](./archive/plan-frontend-simon-claude.md) le précise déjà : le backend peut nécessiter `app.enableCors()` dans `main.ts` pour accepter les requêtes du frontend sur un autre port.

## Ce qu’on consomme côté backend sans le modifier

Selon [README.md](../README.md), les endpoints déjà fonctionnels ou annoncés comprennent :
- `POST /api/v1/musicians`
- `POST /api/v1/groups`
- `GET /api/v1/musicians/:id/matches`

Le front doit donc prioriser :
- inscription / création de profil
- récupération des matchs
- affichage de la liste des profils compatibles
- préparation des contacts et de la messagerie

## Ce qui ne doit pas être fait pour le moment

Pour rester fidèle au MVP et éviter les erreurs de conception :
- ne pas modifier le backend
- ne pas développer un calcul de score côté frontend
- ne pas ajouter une librairie de carte complexe sans justification
- ne pas ajouter un système de gestion d’état global prématuré
- ne pas s’engager sur des fonctionnalités de paiement, sécurité avancée ou vérification de profil au stade MVP

## Recommandations de dépendances

À ce stade, il est préférable de garder la stack légère :
- React
- TypeScript
- Vite
- fetch natif
- éventuellement `react-router-dom` si la navigation entre pages le justifie
- pas de dépendance supplémentaire tant que l’app n’a pas besoin d’une vraie fonctionnalité demandée par l’UX

Cette ligne directrice est cohérente avec le document [docs/archive/plan-frontend-simon-claude.md](./archive/plan-frontend-simon-claude.md) et le besoin de garder le projet simple et lisible.

## Ordre de mise en œuvre recommandé

1. Créer les fondations de l’application
2. Créer la page d’accueil avec carte et CTA
3. Construire le flow de connexion / inscription
4. Créer les formulaires profils selon le modèle métier
5. Rendre la page de matching fonctionnelle
6. Ajouter l’action “Prendre contact”
7. Créer la page messagerie
8. Valider le flux avec le backend réel
9. Ajuster les styles et la cohérence UX

## Résumé stratégique

Le frontend Accroche doit être pensé comme un espace applicatif centré sur :
- la carte publique
- l’authentification
- la découverte intelligente des profils compatibles
- le contact entre profils
- la messagerie

L’objectif n’est pas de reproduire le backend ni d’implémenter le moteur de scoring en frontend, mais de construire une interface exploitable, cohérente et compatible avec les données et routes déjà prévues.

Les décisions clés à garder en mémoire sont :
- respecter le modèle de données défini
- afficher plutôt que recalculer
- ne pas sur-construire l’architecture
- travailler en plusieurs écrans clairs et fonctionnels
- ne pas toucher au backend tant que le besoin ne le justifie pas

## Conclusion

Le plan d’action frontend consiste à bâtir progressivement un MVP cohérent, centré sur le parcours utilisateur suivant :

- arriver sur la page d’accueil
- voir la carte
- s’inscrire ou se connecter
- consulter les profils compatibles
- prendre contact
- discuter via la messagerie

Ce parcours correspond exactement au produit décrit dans [README.md](../README.md) et au schéma métier dans [docs/modele-donnees-MVP.md](./modele-donnees-MVP.md).

La priorité est donc de construire des écrans utiles, bien structurés et correctement alignés avec les données métier, sans ajouter de complexité inutile ni modifier le backend.

# Frontend — Phase 1 : fondations et architecture

## Objectif

La première phase met en place une base frontend stable pour Accroche, sans
implémenter encore les fonctionnalités complètes de la carte, de
l’authentification ou du matching.

Les objectifs sont :

- structurer le code par responsabilité ;
- disposer d’un app shell avec une navigation de base ;
- centraliser les types métier ;
- centraliser les appels HTTP vers l’API backend ;
- préparer les composants et pages des phases suivantes ;
- conserver une implémentation simple, sans gestion d’état globale ni
  dépendance de routing supplémentaire.

## Stack

- React
- TypeScript
- Vite
- `fetch` natif pour les appels API
- Oxlint pour le lint

## Architecture créée

```text
frontend/src/
├── api/
│   ├── client.ts
│   ├── users.ts
│   ├── matches.ts
│   ├── contacts.ts
│   └── messages.ts
├── components/
│   ├── layout/
│   ├── map/
│   ├── profile/
│   ├── matching/
│   └── messaging/
├── hooks/
│   ├── useAuth.ts
│   ├── useMatches.ts
│   └── useMessages.ts
├── pages/
│   ├── HomePage.tsx
│   ├── DiscoverPage.tsx
│   └── MessagingPage.tsx
├── styles/
│   └── app.css
├── types/
│   ├── user.ts
│   ├── profile.ts
│   ├── match.ts
│   └── message.ts
├── App.tsx
├── index.css
└── main.tsx
```

## App shell et navigation

`App.tsx` constitue le point d’entrée applicatif. Il fournit :

- le layout général de l’application ;
- le header ;
- le footer ;
- le contenu de la page courante ;
- une navigation interne basée sur l’historique du navigateur.

Les routes actuellement préparées sont :

| Route | Page | Rôle |
|---|---|---|
| `/` | `HomePage` | Accueil et emplacement de la carte publique |
| `/discover` | `DiscoverPage` | Base de l’écran de découverte des profils |
| `/messages` | `MessagingPage` | Base de l’espace de messagerie |

Cette navigation volontairement légère évite d’ajouter un routeur avant que le
besoin ne soit confirmé.

## Types métier

Les types TypeScript sont séparés du code d’affichage et regroupés dans
`src/types/`.

Ils couvrent notamment :

- les comptes et zones géographiques ;
- les profils musicien, groupe et founding ;
- les instruments et disponibilités ;
- les matchs et leurs sous-scores ;
- les conversations et messages.

Le frontend ne recalcule pas les scores de compatibilité. Il consomme les
valeurs calculées par le backend :

- `scoreGlobal` ;
- `sousScores.instrument` ;
- `sousScores.style` ;
- `sousScores.zone` ;
- `sousScores.disponibilite` ;
- `sousScores.niveau`.

## Client API

`src/api/client.ts` est le point d’entrée commun pour les requêtes HTTP.

Il fournit :

- une URL backend configurable avec `VITE_API_URL` ;
- l’ajout automatique de `Content-Type: application/json` ;
- la lecture de l’enveloppe API `{ data, meta }` ;
- une erreur `ApiError` contenant le statut HTTP et le message backend.

Les modules spécialisés utilisent ce client :

- `users.ts` : création des profils musicien et groupe ;
- `matches.ts` : récupération des matchs d’un musicien ;
- `contacts.ts` : création d’un contact ;
- `messages.ts` : conversations, messages et envoi de messages.

L’URL par défaut est :

```text
http://localhost:3000/api/v1
```

Elle peut être remplacée dans un fichier `.env` frontend :

```bash
VITE_API_URL=http://localhost:3000/api/v1
```

## Hooks préparatoires

Les hooks fournissent une première couche d’utilisation des données côté
interface :

- `useAuth` expose l’état d’authentification local et la déconnexion ;
- `useMatches` charge les matchs d’un musicien ;
- `useMessages` charge les conversations.

Ils restent volontairement simples et ne reposent pas sur Redux, Zustand ou un
autre gestionnaire d’état global.

## Composants et pages préparatoires

Les composants de layout, carte, profils, matching et messagerie sont en place
pour éviter de mélanger la structure de l’interface avec la logique des pages.

Certains composants affichent encore un emplacement ou un message de
préparation. C’est intentionnel : les détails fonctionnels de la carte et des
formulaires appartiennent à la Phase 2.

## Style et responsive design

Les styles communs sont regroupés dans :

- `src/index.css` pour les règles globales ;
- `src/styles/app.css` pour le shell, la navigation, les pages et les cartes.

Le layout s’adapte aux écrans mobiles avec :

- une navigation qui passe sur une ligne dédiée ;
- une grille de contenu transformée en colonne ;
- des boutons et zones d’action conservant une taille utilisable.

## Validation

Les commandes suivantes ont été exécutées depuis `frontend/` :

```bash
npm run lint
npm run build
```

Résultat :

- lint terminé sans erreur ;
- compilation TypeScript réussie ;
- bundle Vite de production généré avec succès.

## Hors périmètre de la Phase 1

Les éléments suivants sont préparés mais ne sont pas encore implémentés :

- intégration d’une librairie de carte ;
- marqueurs réels et filtres géographiques ;
- formulaires complets de connexion et d’inscription ;
- authentification backend complète ;
- affichage des profils provenant de l’API ;
- calcul ou génération de matchs côté frontend ;
- conversations et messages réellement connectés à l’API.

Ces fonctionnalités pourront être ajoutées dans les phases suivantes sans
modifier la séparation actuelle entre pages, composants, types et API.

# Frontend Accroche — état d’avancement

## Objectif

Le frontend React + TypeScript + Vite doit proposer :

- une carte publique des profils ;
- la création et la connexion à un compte ;
- un profil musicien ;
- un ou plusieurs profils de groupes administrés par le même utilisateur ;
- la recherche d’un groupe à rejoindre ou la création d’un groupe ;
- l’affichage des matchs calculés par le backend ;
- la prise de contact et la messagerie.

Le frontend ne recalcule jamais les scores de compatibilité. Il affiche les
résultats et sous-scores fournis par l’API.

## Phase 1 réalisée : fondations

L’architecture de `frontend/src/` est organisée par responsabilités :

```text
src/
├── api/          client HTTP et modules users, matches, contacts, messages
├── components/   layout, carte, profils, matching, messagerie
├── hooks/        useAuth, useMatches, useMessages
├── pages/        HomePage, DiscoverPage, MessagingPage
├── styles/       styles applicatifs
├── types/        user, profile, match, message
├── App.tsx
└── main.tsx
```

Le shell applicatif comprend un header, un footer et une navigation interne
entre `/`, `/discover` et `/messages`. Aucun gestionnaire d’état global ni
routeur externe n’a été ajouté.

Les types centralisés couvrent notamment `User`, `Zone`, les profils musicien,
groupe et founding, les instruments, les disponibilités, les matchs et les
messages.

`api/client.ts` centralise les requêtes `fetch`, l’URL configurable par
`VITE_API_URL`, l’enveloppe `{ data, meta }` et les erreurs `ApiError`.

## Phase 2 réalisée : accueil et inscription

### Accueil et carte

La page d’accueil contient :

- une présentation du service ;
- des boutons d’action ;
- une carte visuelle sans librairie externe ;
- des marqueurs de profils ;
- des filtres par ville, type de profil, instrument et style.

Les marqueurs sont actuellement des données locales de démonstration. Une route
backend de profils publics sera nécessaire pour afficher des données réelles.

### Authentification

Une modale réutilisable permet d’ouvrir :

- le formulaire de connexion ;
- le formulaire d’inscription ;
- la bascule entre les deux modes ;
- la fermeture de la modale.

Le formulaire de connexion est prêt au niveau UI, mais l’endpoint backend de
login n’existe pas encore.

### Inscription musicien

Le formulaire contient :

- email, mot de passe et ville ;
- statut amateur ou professionnel ;
- instruments prédéfinis ;
- niveau propre à chaque instrument ;
- styles musicaux prédéfinis ;
- objectif ;
- bio.

Les valeurs de niveau disponibles sont `debutant`, `intermediaire`, `avance`
et `expert`. Les données respectent la structure actuelle de
`POST /api/v1/musicians`.

### Inscription groupe

Le formulaire contient :

- nom du groupe ;
- statut association ou professionnel ;
- styles musicaux prédéfinis ;
- description ;
- bouton permettant de saisir plusieurs noms de groupes ;
- carte à puces `Musiciens recherchés`.

La carte à puces permet de sélectionner les postes/instruments recherchés :

- chant ;
- guitare ;
- basse ;
- batterie ;
- clavier ;
- piano ;
- violon ;
- saxophone.

Ces sélections sont prêtes à devenir des `OpenPosition`.

### Objectifs musicien

Le musicien peut cocher :

- rejoindre un groupe (`join_group`) ;
- créer un autre groupe (`found_group`).

## Problème initial et résolution

Le modèle métier indique qu’un compte technique unique doit pouvoir porter
plusieurs profils :

- un profil musicien ;
- un ou plusieurs groupes administrés ;
- éventuellement un profil founding.

Les anciennes routes backend étaient conçues pour créer séparément un profil :

```text
POST /api/v1/musicians
POST /api/v1/groups
GET  /api/v1/musicians/:id/matches
```

Elles ont été supprimées de l’exposition HTTP afin d’éviter de créer plusieurs
comptes pour une même personne. La lecture des matchs reste disponible via
`GET /api/v1/musicians/:id/matches`.

La route composite suivante a été ajoutée et est désormais utilisée par le
formulaire frontend :

```text
POST /api/v1/accounts
```

Elle crée dans une seule transaction :

- un `User` unique ;
- un `MusicianProfile` optionnel ;
- plusieurs `GroupProfile` liés au même utilisateur ;
- les `OpenPosition` correspondant aux musiciens recherchés par chaque groupe.

Le frontend utilise cette route pour l’inscription et ne crée donc plus de
compte séparé pour le musicien et les groupes.

Les limites backend restantes sont :

- pas de route de login ;
- pas de route pour rattacher un profil à un utilisateur existant ;
- pas de route pour les profils publics de la carte ;
- pas de route de création de profil founding.

### Mise à jour post-merge

Le hashage bcrypt des mots de passe (introduit sur `POST /musicians` et
`POST /groups` avant leur suppression) a été rattaché à
`AccountPrismaRepository` lors de la résolution du conflit avec la PR
bcrypt. Un TODO reste dans le code notant l'absence de use case dédié
entre `RegisterAccountController` et le repository — à traiter dans une
PR de suivi, cf. pattern Port/Use case/Repository déjà utilisé côté
musicien et groupe.

### Tests de la route de compte unique

Le comportement de `POST /api/v1/accounts` est couvert par
`register-account.controller.spec.ts`. Les tests vérifient :

- la création d’un seul `User` avec un musicien et plusieurs groupes ;
- le rattachement de tous les groupes au même utilisateur ;
- la création des `OpenPosition` avec l’instrument et le niveau demandés ;
- la création d’un compte avec uniquement des groupes ;
- l’absence de données partielles lorsqu’un email existe déjà.

La route est exécutée dans une transaction Prisma afin qu’une erreur annule
l’ensemble de l’inscription.

## Évolutions backend restantes

La séparation compte/profils est maintenant assurée à l’inscription par
`POST /accounts`. Les
routes d’authentification et de gestion ultérieure restent à ajouter :

```text
POST /api/v1/auth/login
POST /api/v1/users/me/musician-profile
POST /api/v1/users/me/groups
POST /api/v1/users/me/founding-profile
POST /api/v1/groups/:id/open-positions
GET  /api/v1/profiles/public
```

Les noms définitifs des routes restantes doivent être validés dans le contrat
API. `POST /accounts` permet déjà plusieurs `GroupProfile` liés au même `User`
et persiste les `OpenPosition` demandées par chaque groupe.

## Validation

Depuis le dossier `frontend/`, les commandes suivantes passent :

```bash
npm run lint
npm run build
```

La compilation TypeScript et le bundle Vite sont générés avec succès.

Depuis le dossier `backend/`, les validations suivantes passent :

```bash
npm run build
npm run lint
npx vitest run src/presentation/controllers/register-account.controller.spec.ts
npm run test:e2e -- --run test/app.e2e-spec.ts
```

Le test e2e applicatif utilise désormais directement `INestApplication`. Un
import `supertest/types` obsolète a été supprimé, car ce sous-module n’est pas
fourni par la version installée de Supertest.

## Prochaines étapes

1. Ajouter les routes backend d’authentification.
2. Ajouter la gestion ultérieure des profils sur un compte authentifié.
3. Remplacer les marqueurs locaux par les profils publics de l’API.
4. Connecter la découverte, les contacts et la messagerie aux routes réelles.

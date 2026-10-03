# API backend — Accroche

## Vue d'ensemble

Le backend est une application NestJS organisée en couches :

- `domain/` : règles métier pures, notamment le calcul des scores de match ;
- `application/` : cas d'usage et ports ;
- `infrastructure/` : Prisma, PostgreSQL, repositories et sécurité ;
- `presentation/` : contrôleurs, DTO et validation HTTP.

La base PostgreSQL est gérée par Prisma. Les migrations se trouvent dans
`backend/prisma/migrations`.

Toutes les routes sont préfixées par `/api/v1`. Sauf indication contraire,
elles retournent :

```json
{
  "data": {},
  "meta": {
    "timestamp": "2026-09-27T12:00:00.000Z",
    "version": "v1"
  }
}
```

### `GET /health`

Endpoint public de vérification de disponibilité du backend, notamment utilisé
par Render. Il répond sans authentification avec :

```json
{
  "status": "ok"
}
```

Le service doit être configuré dans Render avec `Health Check Path=/health`.

En production, le CORS est limité aux origines déclarées dans `FRONTEND_URL`
ou `FRONTEND_URLS` (liste séparée par des virgules). En développement, les
origines `localhost` restent autorisées.

Les routes protégées attendent :

```http
Authorization: Bearer <accessToken>
```

La validation globale rejette les champs inconnus et les payloads invalides.
Les erreurs HTTP importantes sont `400`, `401`, `403`, `404` et `409`.

## Authentification et comptes

### `POST /accounts`

Crée un compte technique et, facultativement, un profil musicien et plusieurs
profils groupe.

Champs principaux :

```json
{
  "email": "musicien@example.com",
  "password": "mot-de-passe",
  "zone": {
    "latitude": 48.5734,
    "longitude": 7.7521,
    "rayonKm": 30,
    "ville": "Strasbourg"
  },
  "musician": {},
  "groups": []
}
```

La création d'un profil musicien déclenche le calcul des matchs existants.
La création de postes groupe déclenche également le recalcul pour les
musiciens compatibles.

### `POST /auth/login`

Authentifie un compte.

```json
{
  "email": "musicien@example.com",
  "password": "mot-de-passe"
}
```

Retourne `accessToken`, `refreshToken` et `userId`.

### `POST /auth/refresh`

Échange un refresh token contre une nouvelle session. Le refresh token
précédent est révoqué.

### `POST /auth/logout`

Révoque un refresh token.

### `GET /users/me`

Protégée. Retourne les informations techniques non sensibles de l'utilisateur
connecté. Le mot de passe n'est jamais exposé.

## Profils musiciens

Toutes les routes suivantes sont protégées et concernent l'utilisateur courant.

### `GET /users/me/musician-profile`

Retourne le profil musicien courant. Retourne `404` si le profil n'existe pas.

### `POST /users/me/musician-profile`

Crée le profil musicien. Un seul profil musicien est autorisé par compte.

Champs : `musicianName`, `status` (`amateur` ou `pro`), `instruments`,
`styles`, `objective`, `availabilities`, `bio`, `zone` et éventuellement
`showcaseGroups`.

### `PATCH /users/me/musician-profile`

Met à jour partiellement le profil musicien et ses données de zone.

## Profils groupe et postes

### `GET /groups/:id`

Route publique. Retourne une fiche groupe publique et uniquement ses postes
ouverts. Les coordonnées GPS exactes et les données techniques du compte ne
sont pas exposées.

### `PATCH /groups/:id`

Protégée. Met à jour un groupe appartenant à l'utilisateur courant.

### `DELETE /groups/:id`

Protégée. Supprime un groupe appartenant à l'utilisateur courant.

### `POST /users/me/groups`

Protégée. Crée un groupe administré par l'utilisateur courant.

### `GET /users/me/groups`

Protégée. Liste les groupes administrés par l'utilisateur courant.

### `GET /users/me/groups/:groupId/positions`

Protégée. Liste les postes d'un groupe appartenant à l'utilisateur courant.

### `POST /groups/:groupId/positions`

Protégée. Ajoute un poste ouvert à un groupe appartenant à l'utilisateur.
Le payload est :

```json
{
  "instrument": "basse",
  "niveau": "intermediaire"
}
```

La création déclenche le calcul des matchs pour les musiciens compatibles.

### `PATCH /users/me/groups/:groupId/positions/:positionId`

Protégée. Met à jour l'instrument et/ou le niveau d'un poste.

### `DELETE /users/me/groups/:groupId/positions/:positionId`

Protégée. Supprime un poste appartenant au groupe courant.

## Profils publics et carte

### `GET /profiles/public`

Retourne les profils musiciens et groupes publiables pour l'exploration.
La réponse expose une ville, jamais les coordonnées exactes, les emails ou
les mots de passe.

### `GET /profiles/public/musicians/:id`

Retourne la fiche publique détaillée d'un musicien.

### `GET /profiles/public/groups/:id`

Retourne la fiche publique détaillée d'un groupe et ses postes ouverts.

### `GET /musicians/:id`

Alias public de fiche musicien.

### `GET /groups/:id`

Alias public de fiche groupe.

### `GET /map`

Route publique de carte. Retourne des clusters dont le centroïde est arrondi
afin de ne pas publier la position exacte d'un profil.

## Matchs

Le matching utilise uniquement les critères actuellement disponibles :

1. l'instrument est obligatoire ; un instrument incompatible ne produit aucun
   match ;
2. le niveau est comparé uniquement sur l'instrument recherché
   (`debutant=1`, `intermediaire=2`, `avance=3`, `expert=4`) et contribue à
   hauteur de 30 % ;
3. le style mesure la proportion des styles du groupe retrouvés chez le
   musicien et contribue à hauteur de 40 % ;
4. la zone exige que la distance soit comprise dans le rayon du musicien et
   dans celui du groupe, puis contribue à hauteur de 30 % avec une décroissance
   progressive selon la distance.

La formule est donc `niveau * 0,30 + styles * 0,40 + zone * 0,30`. Un score
strictement supérieur à 50 est nécessaire pour qu'un résultat soit persisté
comme match ; un score inférieur ou égal à 50 n'est pas retenu. La
disponibilité, l'objectif, le statut amateur/professionnel et les autres
informations non comparables ne participent pas au calcul du MVP. La liste
retournée pour un musicien est limitée aux cinq meilleurs scores.

### `GET /musicians/:id/matches`

Retourne les matchs calculés pour un musicien, triés par score décroissant.
Chaque match contient son identifiant, le poste et les sous-scores :

```json
{
  "id": "match-id",
  "positionId": "position-id",
  "scoreGlobal": 87,
  "sousScores": {
    "instrument": 100,
    "style": 80,
    "zone": 100,
    "disponibilite": 100,
    "niveau": 100
  },
  "statut": "PROPOSE"
}
```

Un match ne doit jamais être créé côté client. Il est produit par le backend
et les profils appartenant au même compte sont exclus du calcul.

### `GET /positions/:id/matches`

Retourne les matchs calculés pour un poste, triés par score décroissant.

## Contacts et conversations

Toutes les routes de cette section sont protégées.

### `POST /matches/:matchId/contact`

Crée un contact à partir d'un match autorisé et une conversation associée.
Le match passe au statut `CONTACTE`. Une seconde création sur le même match
retourne `409`.

### `POST /profiles/:type/:profileId/contact`

Crée ou réutilise une conversation directe sans exiger de match.

`type` vaut `musician` ou `group`.

Pour un groupe, le participant technique est le compte du musicien
administrateur, mais la conversation conserve le `GroupProfile` afin
d'afficher le nom du groupe.

Un utilisateur ne peut pas contacter son propre profil. Un compte sans profil
musicien ne doit pas utiliser cette action depuis l'interface.

### `GET /users/me/contacts`

Liste les contacts liés à l'utilisateur courant.

### `GET /conversations`

Liste les conversations visibles par l'utilisateur courant. Les conversations
de groupe sont identifiables par `groupProfile`; les conversations directes
avec un musicien n'ont pas cette relation.

Chaque membre contient son `lastReadAt`, utilisé pour déterminer les messages
non lus.

### `GET /conversations/:id/messages`

Retourne les messages dans l'ordre chronologique et marque la conversation
comme lue pour l'utilisateur courant.

### `POST /conversations/:id/messages`

Ajoute un message. Le contenu est obligatoire et limité à 5 000 caractères.
Si un participant avait supprimé la conversation pour lui, l'envoi réactive
automatiquement ce participant dans son flux.

### `DELETE /conversations/:id`

Supprime la conversation uniquement pour l'utilisateur courant. Les messages,
la conversation et la visibilité de l'autre participant sont conservés.

## Modèle de données important

- `User` : compte technique et authentification ;
- `MusicianProfile` : identité et critères du musicien ;
- `GroupProfile` : groupe administré par un compte ;
- `OpenPosition` : recherche publiée par un groupe ;
- `Match` : résultat calculé entre musicien et poste ;
- `Contact` : action humaine issue d'un match ;
- `Conversation` : discussion, éventuellement rattachée à un groupe ;
- `ConversationMember` : participant, suppression locale (`deletedAt`) et
  lecture (`lastReadAt`) ;
- `Message` : contenu d'une conversation.

## Règles métier à préserver

1. Ne jamais exposer les mots de passe, emails ou coordonnées GPS dans les
   fiches publiques.
2. Ne jamais créer ou recalculer un match côté frontend.
3. Vérifier la propriété des groupes et des postes avant toute modification.
4. Vérifier l'appartenance à une conversation avant de lire ou écrire.
5. Une suppression de conversation est locale à un membre.
6. Un message entrant réactive un membre masqué et doit rester non lu.

## Migrations et validation

Depuis le dossier `backend/` :

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm test
npm run lint
```

En développement, `npm run start:dev` démarre l'API. La connexion PostgreSQL
est configurée par `DATABASE_URL` dans l'environnement du backend. Les
migrations doivent être versionnées et appliquées avec Prisma ; il ne faut pas
modifier directement la base de données partagée.

## Exemple de séquence de test

```bash
API=http://localhost:3000/api/v1

# Créer un compte et ouvrir une session
curl -X POST "$API/accounts" \
  -H 'Content-Type: application/json' \
  -d @account.json
curl -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"musicien@example.com","password":"mot-de-passe"}'

# Contacter un profil sans match
curl -X POST "$API/profiles/group/GROUP_ID/contact" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Lire et alimenter la conversation
curl "$API/conversations" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
curl -X POST "$API/conversations/CONVERSATION_ID/messages" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"content":"Bonjour !"}'
```

Les identifiants et tokens de cet exemple sont des placeholders et ne doivent
pas être commités.

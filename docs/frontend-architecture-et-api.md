# Frontend — architecture, API et parcours

## Vue d'ensemble

Le frontend est une application React + TypeScript construite avec Vite.
L'état de navigation est géré dans `App.tsx` et l'authentification dans
`hooks/useAuth.ts`.

Organisation :

```text
frontend/src/
├── api/          appels HTTP et types de payloads
├── components/   composants réutilisables
├── hooks/        logique React partagée
├── pages/        écrans principaux
├── types/        modèles frontend
└── styles/       styles globaux
```

## Client HTTP et session

Le client central est `api/client.ts`.

- `request()` ajoute automatiquement le préfixe API ;
- le token d'accès est envoyé dans `Authorization: Bearer ...` ;
- un `401` tente un renouvellement avec le refresh token ;
- si le renouvellement échoue, la session locale est supprimée ;
- les réponses sont déballées depuis `envelope.data` ;
- `ApiError` conserve le statut HTTP pour adapter l'interface.

Les clés de session sont :

```text
accroche.accessToken
accroche.refreshToken
accroche.userId
```

Ne jamais réintroduire un stockage de compte local ou un fallback
d'authentification frontend.

## Modules d'API

### `api/auth.ts`

Connexion, inscription et déconnexion. La session retournée doit être passée
à `useAuth.signIn`.

### `api/users.ts`

Profil musicien courant :

- `getMusicianProfile()`
- `createMusicianProfile()`
- `updateMusicianProfile()`

Un `404` sur `getMusicianProfile()` signifie que le compte connecté n'a pas
encore rempli son profil musicien.

### `api/groups.ts`

Création et gestion des groupes ainsi que de leurs postes :

- `listUserGroups()`
- `createUserGroup()`
- `updateUserGroup()`
- `deleteUserGroup()`
- `createOpenPosition()`
- `listGroupPositions()`
- `updateGroupPosition()`
- `deleteGroupPosition()`

### `api/publicProfiles.ts`

Exploration publique :

- `listPublicProfiles()`
- `getPublicMusician(id)`
- `getPublicGroup(id)`

Les données publiques peuvent être affichées sans session.

### `api/matches.ts`

`getMatches(musicianId)` lit les matchs calculés par le backend. Le frontend
affiche les résultats, mais ne calcule ni ne crée jamais de match.

### `api/messaging.ts`

- `contactMatch(matchId)` contacte depuis un match ;
- `contactProfile(type, profileId)` contacte un profil sans match ;
- `listContacts()` liste les contacts ;
- `listConversations()` charge le flux de conversations ;
- `listMessages(conversationId)` charge et marque comme lus les messages ;
- `sendMessage(conversationId, content)` envoie un message ;
- `deleteConversation(conversationId)` masque la conversation pour l'utilisateur
  courant.

## Navigation et accès

Les routes frontend principales sont :

- `/`
- `/discover`
- `/messages`
- `/profile`
- `/group-request`

L'onglet **Messagerie** n'est affiché dans le header que si l'utilisateur est
connecté. Une navigation directe vers `/messages` affiche néanmoins un message
demandant la connexion.

Après un contact réussi, l'application navigue vers :

```text
/messages?conversation=<conversationId>
```

La page de messagerie sélectionne alors automatiquement cette conversation.

## Page Découvrir

### Onglet Mes matchs

Pour un utilisateur connecté :

1. le profil musicien courant est chargé ;
2. les matchs sont récupérés avec `getMatches()` ;
3. chaque carte affiche le score et les sous-scores ;
4. **Prendre contact** appelle `contactMatch()` ;
5. la conversation retournée est ouverte immédiatement.

Pour un utilisateur non connecté, une carte floutée affiche :

> Connectez-vous pour accéder à vos matchs !

### Onglet Explorer les profils

Les profils publics restent visibles sans authentification.

- non connecté : `Connectez-vous pour pouvoir prendre contact` ;
- connecté sans profil musicien : `Remplissez votre profil musicien pour pouvoir prendre contact !` ;
- connecté avec profil musicien : bouton **Prendre contact** actif.

Le frontend retire de l'exploration :

- le profil musicien courant ;
- les groupes administrés par l'utilisateur courant.

## Page Messagerie

La page est divisée en deux zones :

- liste des conversations ;
- discussion sélectionnée.

La liste sépare :

- **Groupes** : conversation avec `conversation.groupProfile` ;
- **Musiciens** : conversation directe sans groupe associé.

Le nom présenté est :

1. le nom du groupe si la conversation est rattachée à un groupe ;
2. le nom public du musicien ;
3. une valeur de secours.

L'adresse email ne doit jamais être affichée comme nom de contact.

Chaque conversation propose :

- sélection de la discussion ;
- suppression pour l'utilisateur courant ;
- indicateur **Nouveau** lorsqu'un message entrant est postérieur à
  `lastReadAt`.

Une conversation supprimée réapparaît automatiquement lorsque l'interlocuteur
envoie un nouveau message.

## Discussion et profil

`ChatPanel` gère :

- l'historique des messages ;
- la distinction visuelle entre messages entrants et sortants ;
- les dates au format jour/mois/année, heure et minutes, sans secondes ;
- l'envoi avec une limite de 5 000 caractères ;
- le bouton **Voir le profil**.

Le bouton ouvre une modale :

- profil groupe : nom, ville, description, styles et postes ;
- profil musicien : nom, ville, bio, styles et instruments.

Les fiches sont chargées depuis les endpoints publics individuels et non
depuis des données sensibles du compte.

## Gestion des erreurs UI

Les erreurs doivent être affichées explicitement :

- `401` : proposer de se connecter ;
- `403` : signaler que l'action n'est pas autorisée ;
- `404` : indiquer que le profil ou la conversation n'existe plus ;
- `409` : signaler qu'un contact existe déjà ;
- autres erreurs : message générique explicite, sans faux succès.

Les appels asynchrones doivent gérer les états de chargement, erreur et absence
de données. Une action d'envoi doit désactiver son bouton pendant la requête.

## Règles de maintenance frontend

1. Conserver les types frontend alignés sur les DTO et réponses backend.
2. Utiliser `request()` plutôt que `fetch()` directement dans les pages.
3. Ne jamais stocker de mot de passe ou de données de compte localement.
4. Ne jamais calculer les scores ni créer de matchs côté client.
5. Recharger ou mettre à jour l'état après une création, modification,
   suppression ou réception de message.
6. Ne pas afficher les emails comme identité publique.
7. Respecter les protections d'accès dans l'interface sans les considérer comme
   un remplacement des contrôles backend.

## Développement et validation

Depuis le dossier `frontend/` :

```bash
npm install
npm run build
npm run lint
npm run dev
```

`VITE_API_URL` permet de remplacer l'URL de l'API pendant le développement.
Les appels sont relatifs à cette URL et utilisent le préfixe `/api/v1`.

Avant d'ajouter un écran ou un appel :

1. ajouter ou adapter le type dans `src/types/` ;
2. ajouter l'appel dans le module `src/api/` concerné ;
3. gérer chargement, succès et erreur dans la page ou le hook ;
4. vérifier les états connecté, non connecté et sans profil musicien ;
5. lancer `npm run build` puis `npm run lint`.

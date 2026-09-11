# Fonctionnalités frontend encore locales

## Objet du document

Le frontend permet actuellement de parcourir et tester le parcours utilisateur
sans disposer de toutes les routes backend nécessaires. Certaines fonctionnalités
sont donc simulées avec `localStorage`. Elles devront être remplacées par des
appels API lorsque les routes backend correspondantes seront disponibles.

L'authentification locale est volontairement conservée pour permettre de tester
l'interface dans l'attente des routes d'authentification backend.

## Fonctionnalités déjà prises en charge par le backend

Le frontend peut déjà utiliser les routes suivantes :

| Fonctionnalité | Route |
|---|---|
| Création initiale d'un compte | `POST /api/v1/accounts` |
| Lecture d'un profil musicien | `GET /api/v1/musicians/:id` |
| Lecture des matchs d'un musicien | `GET /api/v1/musicians/:id/matches` |
| Lecture d'un groupe | `GET /api/v1/groups/:id` |
| Création d'un poste pour un groupe existant | `POST /api/v1/groups/:groupId/positions` |
| Lecture des clusters de la carte | `GET /api/v1/map` |
| Lecture des matchs d'un poste | `GET /api/v1/positions/:id/matches` |
| Connexion (authentification) | `POST /api/v1/auth/login` |

Les payloads frontend associés doivent continuer à respecter les DTO backend,
notamment :

```ts
{
  instrument: string;
  niveau: 'debutant' | 'intermediaire' | 'avance' | 'expert';
}
```

## 1. Authentification réelle

### État actuel

L'inscription appelle `POST /api/v1/accounts` lorsque cela est possible, puis
enregistre localement les identifiants nécessaires au test :

- clé `accroche.localAccounts` ;
- clé `accroche.userId` pour la session courante ;
- email et mot de passe conservés localement pour permettre une reconnexion de
  démonstration.

Si l'API renvoie une erreur `400`, le frontend crée un compte local de secours
afin de ne pas bloquer la visualisation de l'application.

Le formulaire de connexion vérifie actuellement ces comptes locaux et ne
contacte pas le backend.

La route `POST /api/v1/auth/login` existe désormais côté backend
(`backend/src/presentation/controllers/auth.controller.ts`, JWT). Reste à
brancher côté frontend : remplacer `authenticateLocalAccount` par l'appel
réel à cette route (cf. étapes ci-dessous). Le refresh, le logout et
`/users/me` restent à créer côté backend.

### À intégrer dans le backend

Compléter l'authentification déjà démarrée avec :

```text
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/users/me
```

La réponse de connexion devra fournir une identité de session exploitable par
le frontend, idéalement un access token court et un mécanisme de renouvellement.
Le mot de passe ne doit jamais être conservé dans `localStorage`.

Une fois ces routes disponibles, il faudra :

1. supprimer le fallback de création locale en cas de `400` ;
2. remplacer `authenticateLocalAccount` par l'appel de login ;
3. stocker uniquement le mécanisme de session validé par le backend ;
4. gérer les expirations et les erreurs `401`.

## 2. Mise à jour du profil musicien

### État actuel

La page `/profile` permet de renseigner localement :

- le nom ou nom de scène du musicien ;
- la ville ;
- la bio ;
- le statut amateur ou professionnel ;
- les instruments joués ;
- le niveau de chaque instrument ;
- les styles musicaux ;
- les groupes auxquels le musicien participe.

Ces données sont stockées dans :

```text
accroche.profileDraft
```

La page affiche également un aperçu de vitrine à partir de ces données locales.

### À intégrer dans le backend

Le modèle Prisma actuel ne contient pas encore de champ `musicianName`.
Il faut donc décider si ce nom correspond :

- à un nouveau champ `displayName` sur `MusicianProfile` ;
- ou à un champ de présentation ajouté dans une évolution du modèle.

Prévoir ensuite des routes authentifiées :

```text
GET   /api/v1/users/me/musician-profile
POST  /api/v1/users/me/musician-profile
PATCH /api/v1/users/me/musician-profile
```

Le payload devra suivre la structure du DTO musicien existant :

```ts
{
  status: 'amateur' | 'pro';
  instruments: Array<{
    instrument: string;
    niveau: 'debutant' | 'intermediaire' | 'avance' | 'expert';
  }>;
  styles: string[];
  objective: Array<'join_group' | 'found_group'>;
  availabilities: Array<{
    jourSemaine: string;
    creneauxJournee: 'matin' | 'apres-midi' | 'soir';
  }>;
  bio?: string;
  zone: {
    latitude: number;
    longitude: number;
    rayonKm: number;
    ville: string;
  };
}
```

La ville doit être persistée via `Zone` et non uniquement comme un champ texte
frontend.

## 3. Groupes rattachés à un utilisateur existant

### État actuel

La section **Mes groupes** permet de saisir localement :

- le nom du groupe ;
- la ville ;
- le poste occupé par le musicien ;
- le statut du groupe ;
- la description.

Ces informations sont enregistrées dans `accroche.profileDraft`.

### À intégrer dans le backend

Le modèle prévoit qu'un `GroupProfile` est rattaché à un `User`. Il faut donc
ajouter une route authentifiée permettant de créer un groupe sans recréer de
compte :

```text
POST /api/v1/users/me/groups
GET  /api/v1/users/me/groups
PATCH /api/v1/groups/:id
DELETE /api/v1/groups/:id
```

Le payload groupe doit respecter la forme actuelle :

```ts
{
  name: string;
  styles: string[];
  status: 'association' | 'professionnel';
  description?: string;
  audioLinks: string[];
  zone: {
    latitude: number;
    longitude: number;
    rayonKm: number;
    ville: string;
  };
}
```

Le poste occupé par le musicien dans un groupe n'est pas actuellement modélisé
par `GroupProfile`. Il faudra décider si cette information nécessite une
nouvelle entité de membre, par exemple :

```text
GroupMembership
- id
- groupProfileId
- musicianProfileId
- instrument
- createdAt
```

Cette information ne doit pas être confondue avec `OpenPosition`, qui décrit un
poste recherché par un groupe.

## 4. Publication d'une demande de groupe

### État actuel

La page `/group-request` enregistre localement une demande dans :

```text
accroche.groupRequests
```

Une demande locale contient :

- le nom du groupe ;
- la ville ;
- la description ;
- les styles ;
- un tableau de postes recherchés ;
- le niveau attendu pour chaque poste.

Les postes utilisent déjà le format backend :

```ts
{
  instrument: string;
  niveau: 'debutant' | 'intermediaire' | 'avance' | 'expert';
}
```

### À intégrer dans le backend

La structure métier distingue correctement :

- `GroupProfile` : identité du groupe ;
- `OpenPosition` : poste recherché par le groupe.

La création complète devrait être orchestrée par une route authentifiée :

```text
POST /api/v1/users/me/groups
```

avec un payload de groupe contenant :

```ts
{
  name: string;
  styles: string[];
  status: 'association' | 'professionnel';
  description?: string;
  audioLinks: string[];
  zone: Zone;
  requestedInstruments: Array<{
    instrument: string;
    niveau: NiveauMusicien;
  }>;
}
```

Le backend doit créer le `GroupProfile`, puis un `OpenPosition` par élément de
`requestedInstruments`. Pour la gestion ultérieure d'un groupe déjà créé,
l'endpoint existant reste adapté :

```text
POST /api/v1/groups/:groupId/positions
```

Cet endpoint reçoit un seul poste par appel :

```ts
{
  instrument: string;
  niveau: NiveauMusicien;
}
```

Il faudra également prévoir :

```text
GET    /api/v1/users/me/groups/:groupId/positions
PATCH  /api/v1/groups/:groupId/positions/:positionId
DELETE /api/v1/groups/:groupId/positions/:positionId
```

Les règles métier doivent vérifier que l'utilisateur connecté administre bien
le groupe ciblé.

## 5. Affichage des demandes publiées

### État actuel

La page profil lit `accroche.groupRequests` et affiche :

- les groupes concernés ;
- leur ville ;
- leur description ;
- leurs styles ;
- les postes et niveaux recherchés.

### À intégrer dans le backend

Ajouter une route authentifiée :

```text
GET /api/v1/users/me/group-requests
```

ou, si les demandes sont représentées directement par les groupes et postes :

```text
GET /api/v1/users/me/groups
GET /api/v1/users/me/groups/:groupId/positions
```

Le frontend devra remplacer la lecture de `localStorage` par ces appels et
gérer les états de chargement, d'erreur et de mise à jour.

## 6. Profils publics et vitrine

### État actuel

L'aperçu public de la page profil est local et n'est visible que dans le
navigateur de l'utilisateur.

La page **Découvrir** et les éléments de vitrine utilisent encore des données
de démonstration.

### À intégrer dans le backend

Prévoir des routes publiques ou authentifiées selon la politique de visibilité :

```text
GET /api/v1/profiles/public
GET /api/v1/musicians/:id
GET /api/v1/groups/:id
```

Les réponses publiques doivent respecter la confidentialité :

- ne pas exposer le mot de passe ;
- ne pas exposer la position GPS exacte ;
- exposer la ville ou une zone agrégée ;
- appliquer les règles de visibilité des profils ;
- distinguer `MusicianProfile`, `GroupProfile`, `FoundingProfile`,
  `OpenPosition` et `Match`.

La carte doit utiliser les clusters retournés par `GET /api/v1/map`, et non
publier les coordonnées exactes de chaque profil.

## 7. Matchs, contacts et messagerie

### État actuel

Le frontend possède des composants d'interface pour les matchs et la
messagerie, mais les anciennes fonctions frontend visant `/contacts` et
`/conversations` ont été retirées car ces routes n'existent pas dans le backend
actuel.

### À intégrer dans le backend

Les matchs sont déjà lisibles avec :

```text
GET /api/v1/musicians/:id/matches
```

Il manque les opérations liées aux contacts :

```text
POST /api/v1/matches/:matchId/contact
GET  /api/v1/users/me/contacts
```

Pour la messagerie, il faudra définir puis implémenter un modèle de
conversation et des routes cohérentes, par exemple :

```text
GET  /api/v1/conversations
GET  /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages
```

Ces routes devront être protégées et vérifier que l'utilisateur appartient à
la conversation.

## 8. Nettoyage frontend à effectuer lors de l'intégration backend

Lorsque les routes seront disponibles :

1. remplacer les lectures et écritures `localStorage` par les modules API ;
2. conserver les types partagés alignés sur les DTO et réponses backend ;
3. supprimer le fallback d'authentification locale ;
4. ajouter la gestion des erreurs `401`, `403`, `404` et `409` ;
5. recharger les profils après chaque création ou modification ;
6. ne jamais recalculer les scores de matching dans le frontend ;
7. ne jamais créer directement de `Match` côté frontend ;
8. ne jamais confondre un profil groupe et un `OpenPosition` ;
9. conserver un tableau de postes pour un groupe, avec un appel unitaire vers
   `POST /groups/:groupId/positions` lorsque cette route est utilisée ;
10. ajouter des tests frontend des payloads envoyés aux routes backend.

## Résumé des données locales actuelles

| Clé `localStorage` | Contenu | Remplacement prévu |
|---|---|---|
| `accroche.localAccounts` | Comptes de démonstration frontend | Authentification backend |
| `accroche.userId` | Session frontend courante | Token/session backend |
| `accroche.profileDraft` | Profil musicien et groupes saisis | API de profil et memberships |
| `accroche.groupRequests` | Demandes de groupes et postes recherchés | GroupProfile + OpenPosition |


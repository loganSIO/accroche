# Fonctionnalités frontend encore locales

## Objet du document

Le frontend utilise désormais le backend pour l'authentification, le profil
musicien et les demandes de groupe. Les fonctionnalités de contacts, de
messagerie et certaines vues de découverte restent à compléter.

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
| Renouvellement de session | `POST /api/v1/auth/refresh` |
| Déconnexion | `POST /api/v1/auth/logout` |
| Lecture de l'utilisateur connecté | `GET /api/v1/users/me` |
| Lecture du profil musicien connecté | `GET /api/v1/users/me/musician-profile` |
| Création du profil musicien connecté | `POST /api/v1/users/me/musician-profile` |
| Mise à jour du profil musicien connecté | `PATCH /api/v1/users/me/musician-profile` |
| Création d'une demande de groupe | `POST /api/v1/users/me/groups` |
| Liste des demandes de groupe de l'utilisateur | `GET /api/v1/users/me/groups` |
| Modification d'une demande de groupe | `PATCH /api/v1/groups/:id` |
| Suppression d'une demande de groupe | `DELETE /api/v1/groups/:id` |

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

L'inscription appelle `POST /api/v1/accounts`, puis se connecte via le backend.
Le frontend conserve uniquement les éléments de session nécessaires :

- `accroche.accessToken` ;
- `accroche.refreshToken` ;
- `accroche.userId`.

Les routes d'authentification sont désormais disponibles côté backend :
`POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`,
`POST /api/v1/auth/logout` et `GET /api/v1/users/me`. La connexion retourne un
JWT d'accès et un refresh token opaque, dont seule l'empreinte est conservée
en base. Le refresh token est renouvelé à chaque appel de refresh et peut être
révoqué lors de la déconnexion.

Le module `localAuth.ts` et la clé `accroche.localAccounts` sont des vestiges
non utilisés par le parcours courant et pourront être supprimés.

### À intégrer dans le backend

Routes d'authentification implémentées :

```text
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/users/me
```

La réponse de connexion devra fournir une identité de session exploitable par
le frontend, idéalement un access token court et un mécanisme de renouvellement.
Le mot de passe ne doit jamais être conservé dans `localStorage`.

Le client renouvelle automatiquement la session après une réponse `401` lorsque
le refresh token est encore valide, puis efface la session si le renouvellement
échoue.

## 2. Mise à jour du profil musicien

### État actuel

La page `/profile` permet de renseigner :

- le nom ou nom de scène du musicien ;
- la ville ;
- la bio ;
- le statut amateur ou professionnel ;
- les instruments joués ;
- le niveau de chaque instrument ;
- les styles musicaux ;
- les groupes auxquels le musicien participe.

Ces données sont persistées par le backend sur le profil musicien. La page
affiche également un aperçu de vitrine à partir de ces données.

### À intégrer dans le backend

Le modèle Prisma contient désormais le champ `musicianName` sur
`MusicianProfile`.
Les routes authentifiées suivantes sont maintenant disponibles :

```text
GET   /api/v1/users/me/musician-profile
POST  /api/v1/users/me/musician-profile
PATCH /api/v1/users/me/musician-profile
```

La création est refusée si le compte possède déjà un profil musicien. La mise
à jour partielle remplace les collections fournies (`instruments`, `styles`,
`availabilities` et `showcaseGroups`) et conserve les autres champs lorsqu'ils
ne sont pas envoyés.

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
  showcaseGroups: Array<{
    name: string;
    city: string;
    position: string;
    status: 'association' | 'professionnel';
    description: string;
  }>;
}
```

La ville doit être persistée via `Zone` et non uniquement comme un champ texte
frontend.

## 3. Groupes rattachés à un utilisateur existant

### État actuel

La section **Mes groupes** permet de saisir :

- le nom du groupe ;
- la ville ;
- le poste occupé par le musicien ;
- le statut du groupe ;
- la description.

Ces informations sont enregistrées avec le `MusicianProfile` en base, dans la
collection dédiée `MusicianShowcaseGroup`.

Ces groupes sont uniquement une vitrine rattachée aux informations publiques
du musicien. Ils ne sont pas des `GroupProfile` publiés, ne sont pas placés sur
la carte et ne génèrent aucun `OpenPosition`, match ou demande active.

### À intégrer dans le backend

Le modèle prévoit qu'un `GroupProfile` est rattaché à un `User`. Pour les
groupes déjà renseignés par un musicien, une collection `MusicianShowcaseGroup`
est rattachée à son `MusicianProfile` et est lue/mise à jour avec les routes
du profil musicien. Les routes de demande active permettent de créer un groupe
sans recréer de compte :

```text
POST /api/v1/users/me/groups
GET  /api/v1/users/me/groups
PATCH /api/v1/groups/:id
DELETE /api/v1/groups/:id
```

Ces routes sont maintenant implémentées. La création et la liste sont limitées
à l'utilisateur authentifié ; la modification et la suppression vérifient que
le groupe appartient bien à cet utilisateur. Le poste occupé est stocké dans
`MusicianShowcaseGroup.position` pour la vitrine et ne doit pas être confondu
avec un `OpenPosition`, qui représente un poste recherché.

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

Le payload de création d'une demande active ajoute obligatoirement
`requestedInstruments`, comme décrit dans la section 4. Ces postes sont des
`OpenPosition` et ne correspondent pas au poste occupé dans la vitrine.

## 4. Publication d'une demande de groupe

### État actuel

La page `/group-request` publie une demande via
`POST /api/v1/users/me/groups`.

Une demande publiée contient :

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

Les groupes saisis dans **Mon profil** restent donc distincts de cette
publication. Seule la page **Créer une demande** crée un `GroupProfile` et ses
`OpenPosition` destinés à la carte et au matching.

La création complète est orchestrée par une route authentifiée :

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

La route crée le `GroupProfile`, sa `Zone` et tous les `OpenPosition` associés
dans une transaction unique. `requestedInstruments` est obligatoire et doit
contenir au moins un poste recherché. Chaque entrée devient un poste `GROUP`
ouvert rattaché au groupe. Les groupes éventuellement renseignés dans le profil
musicien restent des éléments de vitrine et ne créent pas de demande active.

Le backend crée le `GroupProfile`, puis un `OpenPosition` par élément de
`requestedInstruments`. La liste `GET /api/v1/users/me/groups` retourne aussi
les postes associés afin de les afficher dans l'onglet **Mes demandes** de la
page **Mon profil**. Pour la gestion ultérieure d'un groupe déjà créé,
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

Les routes suivantes sont disponibles pour gérer les postes après publication :

```text
GET    /api/v1/users/me/groups/:groupId/positions
PATCH  /api/v1/groups/:groupId/positions/:positionId
DELETE /api/v1/groups/:groupId/positions/:positionId
```

Ces routes sont protégées par authentification et vérifient que l'utilisateur
connecté administre bien le groupe ciblé. La création d'un poste sur un groupe
existant applique la même vérification. Une mise à jour doit fournir au moins
un des champs `instrument` ou `niveau`.

## 5. Affichage des demandes publiées

### État actuel

La page profil appelle `GET /api/v1/users/me/groups` et affiche dans l'onglet
**Mes demandes** :

- les groupes concernés ;
- leur ville ;
- leur description ;
- leurs styles ;
- les postes et niveaux recherchés.

### État

La lecture est branchée sur `GET /api/v1/users/me/groups` et retourne les
postes associés. La route dédiée
`GET /api/v1/users/me/groups/:groupId/positions` permet également de recharger
les postes d'un groupe, et les routes `PATCH`/`DELETE` permettent leur gestion
unitaire après publication.

## 6. Profils publics et vitrine

### État actuel

L'aperçu public de la page profil est affiché localement dans l'interface
connectée. Les données du profil et les groupes de vitrine sont toutefois
persistés en base.

La page **Découvrir** et les éléments de vitrine utilisent encore des données
de démonstration.

### À intégrer dans le backend

Prévoir des routes publiques ou authentifiées selon la politique de visibilité :

```text
GET /api/v1/profiles/public
GET /api/v1/musicians/:id
GET /api/v1/groups/:id
```

Les routes publiques sont maintenant disponibles :

- `GET /api/v1/profiles/public` retourne les profils musiciens et groupes
  publiables ;
- `GET /api/v1/musicians/:id` retourne une fiche musicien publique ;
- `GET /api/v1/groups/:id` retourne une fiche groupe publique.

Les fiches publiques exposent la ville, mais jamais la latitude, la longitude,
les identifiants utilisateur, le mot de passe ou les disponibilités détaillées.
Les postes retournés pour un groupe sont uniquement ses postes ouverts.

Les réponses publiques doivent respecter la confidentialité :

- ne pas exposer le mot de passe ;
- ne pas exposer la position GPS exacte ;
- exposer la ville ou une zone agrégée ;
- appliquer les règles de visibilité des profils ;
- distinguer `MusicianProfile`, `GroupProfile`, `FoundingProfile`,
  `OpenPosition` et `Match`.

La carte utilise les clusters retournés par `GET /api/v1/map`, dont le
centroïde est arrondi à deux décimales, et ne publie pas les coordonnées
exactes de chaque profil.

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

1. supprimer les modules de données de démonstration devenus inutiles
   (`localAuth.ts`) ;
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
| `accroche.localAccounts` | Ancien stockage de comptes, non utilisé par le parcours courant | Supprimer |
| `accroche.userId` | Session frontend courante | Token/session backend |
| `accroche.profileDraft` | Ancien brouillon de profil, non utilisé par le parcours courant | Supprimer |
| `accroche.groupRequests` | Ancien stockage de demandes, non utilisé par le parcours courant | GroupProfile + OpenPosition |

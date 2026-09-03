# Modèle de données — MVP

## Principe directeur

Un musicien et un groupe sont tous deux des **annonceurs** qui publient une ou plusieurs **recherches**. On sépare strictement :
- **qui je suis** (le profil : `MusicianProfile`, `GroupProfile`, `FoundingProfile`)
- **ce que je cherche** (la recherche : `OpenPosition`, ou l'objectif déclaré du musicien)
- **le résultat du calcul** (`Match`)
- **l'action humaine qui en découle** (`Contact`)

Cette séparation est la décision la plus structurante du schéma : elle évite de mélanger des données stables (identité) avec des données qui changent souvent (recherches actives) ou qui sont dérivées (scores), et elle rend chaque brique testable et remplaçable isolément.

## Entités

### `User`
Le compte technique. Un seul type de compte pour tout le monde.
- `id`, `email`, `password_hash`, `created_at`, `city` (ville de rattachement, ex. Strasbourg)

*Pourquoi un seul type de compte* : évite de dupliquer un utilisateur qui serait à la fois musicien et administrateur d'un groupe. Ce qui distingue les rôles, ce sont les profils rattachés, pas le compte.

### `MusicianProfile`
Rattaché à un `User` (1-to-1 dans le MVP, extensible en 1-to-many plus tard sans casser l'existant si un jour un compte gère plusieurs profils).
- `id`, `user_id`
- `instruments` : liste de `{instrument, niveau}` — jamais un champ unique, un musicien joue souvent plusieurs instruments à des niveaux différents
- `styles` : liste de styles musicaux
- `location` : référence à un objet `Zone` (voir plus bas), pas des champs `lat`/`lng` en dur
- `availability` : liste de créneaux structurés (pas de texte libre — nécessaire pour filtrer/scorer dessus)
- `status` : `amateur` | `pro` (déclaratif, sans vérification au MVP)
- `objective` : `join_group` | `found_group` (ou les deux)
- `bio` : texte libre

### `GroupProfile`
Rattaché à un `User` (le créateur/admin du groupe).
- `id`, `user_id`, `name`, `styles`, `location` (référence `Zone`), `status` (`association` | `professionnel`), `description`, `audio_links`

### `OpenPosition`
Un poste recherché, rattaché à un `GroupProfile` **ou** à un `FoundingProfile`. C'est cette entité qui est réellement comparée à un `MusicianProfile`, pas le groupe dans son ensemble.
- `id`, `owner_type` (`group` | `founding`), `owner_id`
- `instrument_recherche`, `niveau_attendu`, `statut` (`ouvert` | `pourvu` | `annulé`)

*Pourquoi séparer `OpenPosition` du profil parent* : un groupe a souvent plusieurs postes ouverts avec des critères différents. Sans cette séparation, il faudrait dupliquer des `GroupProfile` ou stocker des critères multiples dans un seul objet — les deux mènent à une refonte quand le besoin de plusieurs postes simultanés se confirme (et il se confirmera).

### `FoundingProfile` (la version light de "monter un groupe")
Rattaché à un `MusicianProfile` fondateur. Structurellement proche de `GroupProfile` mais distinct sémantiquement : ce n'est pas encore un groupe constitué.
- `id`, `founder_musician_id`, `styles`, `location`, `description`

*Pourquoi un type distinct plutôt qu'un `GroupProfile` à un seul membre* : évite de polluer la notion de "groupe" avec des groupes fantômes, garde la possibilité de traiter différemment ces deux cas dans l'UX ou les statistiques plus tard, sans migration de données a posteriori.

### `Zone`
Objet dédié plutôt que des coordonnées éparpillées dans chaque profil.
- `id`, `latitude`, `longitude`, `rayon_km`, `ville` (ex. Strasbourg)

*Pourquoi un objet séparé* : centralise toute la logique géographique (calcul de distance, clustering carte) en un seul endroit testable, et prépare sans effort le multi-villes ou une future notion de "zones de tournée".

### `Match`
Résultat du calcul de compatibilité entre un `MusicianProfile` et un `OpenPosition`.
- `id`, `musician_id`, `position_id`
- `score_global`
- `sous_scores` : `{instrument, style, zone, disponibilite, niveau}` — stockés séparément, jamais uniquement le total
- `statut` : `proposé` | `contacté` | `ignoré`
- `created_at`

*Pourquoi stocker les sous-scores séparément* : c'est ce qui permet d'afficher "90 % — instrument ✓, style ✓, zone ✓" sans recalculer, et surtout ce qui rendra possible une pondération personnalisable par l'utilisateur plus tard (ré-agréger différemment des sous-scores déjà calculés, plutôt que rejouer tout le matching).

### `Contact`
Trace qu'une mise en relation a réellement eu lieu. Distinct du `Match` : un match est un calcul automatique, un contact est une action humaine.
- `id`, `match_id`, `musician_id`, `initiated_by` (musician ou group), `created_at`

*Pourquoi `musician_id` en plus de `match_id`* : un `Match` relie déjà `musician_id` et `position_id`, donc `musician_id` sur `Contact` est techniquement dérivable par jointure. Il est stocké en accès direct pour éviter cette jointure sur les lectures fréquentes (ex. lister les contacts d'un musicien). Décision d'implémentation actée a posteriori (le schéma l'avait introduit avant que ce document ne le documente) — champ dérivé, pas de nouvelle source de vérité.

## Ce que le schéma anticipe sans le construire

- **Volet intermittence (v2)** : une future entité `WorkSession` (cachet/heure) viendra se rattacher naturellement à `MusicianProfile` en one-to-many, sans toucher à l'existant.
- **Missions ponctuelles rémunérées (v3)** : réutiliserait probablement `OpenPosition` avec un type `owner_type = mission` supplémentaire plutôt qu'une nouvelle entité — à confirmer le moment venu.
- **Pondérations personnalisables** : rendu possible par les sous-scores déjà séparés dans `Match`, sans avoir à les construire maintenant.
- **Multi-villes** : porté par `Zone` comme objet indépendant plutôt que par des champs dupliqués dans chaque profil.

## Ce qui reste volontairement non modélisé au MVP

- Vérification du statut pro (pas de champ `verified` pour l'instant — ajout non-bloquant plus tard, cf. synthèse MVP).
- Toute notion de paiement/abonnement (freemium) — à modéliser séparément lors du choix de stack, car cela touche à des considérations de sécurité et de conformité (paiement) distinctes du cœur métier.

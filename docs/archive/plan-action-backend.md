# Plan d'action — Backend Accroche

## État au [30/08/2026, fin de session]

27 tests verts. Architecture hexagonale à 4 couches (domain/application/infrastructure/presentation) posée et validée par la pratique sur deux ressources complètes.

### Fonctionnel et testé
- Moteur de scoring (`domain/services/calculate-match.service.ts`) — pondérations fixes, sous-scores exposés séparément
- Use case `RecalculateMatchesForMusician` — orchestration testée en mocks + intégration réelle
- `POST /api/v1/musicians` — création de profil musicien (transaction User + Zone + MusicianProfile)
- `GET /api/v1/musicians/:id/matches` — lecture des matchs, triés par score
- `POST /api/v1/groups` — création de profil groupe (même pattern que musicien)

### Le pattern à reproduire pour toute nouvelle ressource
1. Port (interface) dans `application/ports/`
2. Use case avec test (mocks en mémoire) dans `application/use-cases/`
3. Mapper dans `infrastructure/mappers/` (Prisma → entité du domaine)
4. Repository Prisma avec test d'intégration réel (vraie base Postgres) dans `infrastructure/repositories/`
5. DTO avec décorateurs `class-validator` sur **chaque classe imbriquée** (piège rencontré : une classe interne sans décorateur est rejetée par `forbidNonWhitelisted`) dans `presentation/dtos/`
6. Controller avec test e2e dans `presentation/controllers/`
7. Déclarer le controller dans `app.module.ts`

## Workflow Git à partir de maintenant

Plus de push direct sur `master`. Une branche par tâche :
```bash
git checkout -b feature/nom-de-la-tache
# ... travail, commits ...
git push -u origin feature/nom-de-la-tache
# puis Pull Request sur GitHub vers master, relecture, merge
```

## Backlog restant, avec dépendances

### Peut démarrer immédiatement, indépendamment (aucune dépendance bloquante)
- **`GET /api/v1/musicians/:id`** et **`GET /api/v1/groups/:id`** — lecture simple, pattern déjà en place côté repository (`findById` existe déjà des deux côtés), juste le controller à écrire. Rapide (~20 min).
- **`GET /api/v1/map`** — carte publique clusterisée. Peut démarrer dès maintenant avec les données déjà en base (musiciens + groupes ont une `Zone`). Un peu plus technique (logique de clustering), prévoir 1h30.
- **Hashage des mots de passe** (`bcrypt`) — dette technique signalée deux fois pendant la session (`create-musician.controller.ts` et `create-group.controller.ts`), à corriger avant tout déploiement réel. Rapide, isolé, ~30 min.

### Dépend de Groupes (✅ fait) — peut démarrer maintenant
- **`POST /api/v1/groups/:groupId/positions`** (ouvrir un poste) — nécessaire avant de pouvoir tester le matching avec de vraies données de bout en bout. Point de vigilance à traiter ici : la contrainte owner polymorphe (`groupProfileId` XOR `foundingProfileId`) n'est pas garantie par la base, à vérifier explicitement dans le use case de création. ~1h.
- **`PATCH/DELETE /api/v1/positions/:id`** — suite logique de la création de poste. ~45 min.

### Dépend de Postes ouverts
- **Profils fondateurs** (`POST /api/v1/founding-profiles` + `.../positions`) — même pattern que Groupes, en plus simple. ~1h.
- **Brancher le recalcul déclenché** — appeler `RecalculateMatchesForMusician` (déjà écrit et testé) depuis les controllers de création/modification de profil et de poste. C'est le câblage qui rend le matching réellement utilisable en pratique, pas juste testable isolément. ~1h.
- **`GET /api/v1/positions/:id/matches`** — symétrique de l'endpoint déjà fait côté musicien. ~20 min.

### Dépend du recalcul déclenché
- **`POST /api/v1/matches/:matchId/contact`** et **`GET .../contacts`** — nécessite des vrais matchs en base pour être testé de bout en bout. ~1h.

## Frontend

Non démarré. Décision prise de ne pas défricher les choix de setup (librairie de carte, structure du projet) en fin de session fatiguée — à traiter lors d'une session dédiée avec la tête reposée. Les wireframes conceptuels (carte publique, fiche match) existent dans `docs/ecrans-MVP.md`.

## Ce qui reste volontairement non traité (rappel du MVP)

- Volet intermittence (v2)
- Notifications temps réel (mécanisme de recalcul déjà posé pour ça, mais rien de branché)
- Vérification du statut pro (déclaratif pour l'instant, assumé)

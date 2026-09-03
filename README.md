# Accroche

Application de mise en relation musiciens ↔ groupes, avec matching par score de compatibilité. Ville pilote : Strasbourg.

## Le produit, en bref

- Un musicien cherche un groupe (ou veut en monter un), un groupe cherche un musicien pour un poste précis.
- Un algorithme calcule un **score de compatibilité en %**, décomposé en sous-scores visibles (instrument, style, zone, disponibilité, niveau) — jamais une boîte noire.
- Positionnement : là où les sites concurrents (petites annonces classiques) obligent à tout parcourir manuellement, Accroche fait le tri et explique pourquoi.
- Freemium sans mur d'accès : contacts illimités gratuits, le payant ne touche qu'au confort (boost, alertes, stats).

Documentation produit complète : voir `docs/`.

## Stack

| Domaine | Choix | Pourquoi (résumé) |
|---|---|---|
| Backend | NestJS + TypeScript | Typage fort, structure imposée par convention, gros écosystème |
| Base de données | PostgreSQL + PostGIS | Requêtes géographiques natives (zone, distance) |
| ORM | Prisma v6 (**pas v7/v8**, RC orientée cloud non désirée) | Typage strict, migrations lisibles |
| Tests | Vitest | Rapide, intégré par défaut au template NestJS actuel |
| Frontend | React + Vite (TypeScript) | Pas de SSR nécessaire (app derrière connexion, SEO limité à la carte publique) |
| Conteneurisation locale | Docker Compose (Postgres/PostGIS) | Environnement identique entre développeurs |

Détail complet et justifications : `docs/stack-technique-MVP.md`.

## Architecture backend : hexagonale, 4 couches

```
backend/src/
├── domain/           Métier pur (scoring). ZÉRO dépendance à Prisma/NestJS.
├── application/       Use cases + ports (interfaces). Orchestration, aucune règle métier propre.
├── infrastructure/     Implémentations concrètes (repositories Prisma, mappers).
└── presentation/       Controllers NestJS, DTOs de validation.
```

Règle non négociable : le domaine ne doit jamais importer Prisma ou NestJS — c'est ce qui permet de le tester sans base de données.

Détail complet : `docs/architecture-couches-MVP.md`.

## Le pattern à reproduire pour toute nouvelle ressource métier

1. Port (interface) dans `application/ports/`
2. Use case + test (mocks en mémoire) dans `application/use-cases/`
3. Mapper Prisma → domaine dans `infrastructure/mappers/`
4. Repository Prisma + test d'intégration (vraie base Postgres) dans `infrastructure/repositories/`
5. DTO avec décorateurs `class-validator` — **piège connu : chaque classe imbriquée doit avoir ses propres décorateurs**, sinon `ValidationPipe` (avec `forbidNonWhitelisted: true`) rejette les champs même typés correctement en TypeScript
6. Controller + test e2e dans `presentation/controllers/`
7. Déclarer le controller dans `app.module.ts`

Exemples déjà écrits à suivre comme modèle : tout ce qui concerne `musician` et `group` (create + read).

## Modèle de données — logique centrale

Séparation stricte entre :
- **identité** (`MusicianProfile`, `GroupProfile`, `FoundingProfile`)
- **recherche active** (`OpenPosition` — un groupe/fondateur peut avoir plusieurs postes ouverts)
- **résultat de calcul** (`Match` — jamais créé côté client, uniquement par un recalcul interne déclenché ; sous-scores stockés séparément, pas juste le total)
- **action humaine** (`Contact` — distinct du match, pour mesurer le taux de matchs → contact réel)

Schéma complet : `backend/prisma/schema.prisma`. Détail et justifications : `docs/modele-donnees-MVP.md`.

**Point de vigilance non résolu** : `OpenPosition` a deux clés étrangères optionnelles (`groupProfileId`, `foundingProfileId`) — un poste appartient à l'un OU l'autre, jamais les deux. Ce n'est pas garanti par la base ; à vérifier explicitement dans tout use case qui crée un `OpenPosition`.

## API

REST, versionnée (`/api/v1/...`), enveloppe de réponse cohérente partout :
```json
{ "data": {...}, "meta": { "timestamp": "...", "version": "v1" } }
```
Erreurs au format `{ "error": { "code": "...", "message": "..." } }`.

Endpoints déjà fonctionnels :
- `POST /api/v1/musicians`
- `POST /api/v1/groups`
- `GET /api/v1/musicians/:id/matches`

Contrat complet (endpoints prévus, y compris non encore implémentés) : `docs/contrat-API-MVP.md`.

## Démarrage rapide

```bash
git clone https://github.com/loganSIO/accroche.git
cd accroche
docker compose up -d          # lance Postgres/PostGIS

cd backend
cp .env.example .env          # DATABASE_URL déjà pré-remplie pour le docker-compose fourni
npm install
npx prisma generate
npx prisma migrate dev
npm run test                  # doit passer intégralement avant de commencer à coder
npm run start:dev             # backend sur http://localhost:3000

# dans un autre terminal, une fois le frontend initialisé :
cd ../frontend
npm install
npm run dev                   # frontend sur http://localhost:5173
```

Prérequis : Node 22, Docker. Sous Windows, tout tourne dans WSL2 (pas en natif Windows) — voir `docs/` pour le détail si l'environnement n'est pas encore configuré.

## Workflow Git

Pas de push direct sur `master`. Une branche par tâche :
```bash
git checkout -b feature/nom-de-la-tache
# ... travail, commits, tests verts ...
git push -u origin feature/nom-de-la-tache
# Pull Request sur GitHub vers master, relecture, merge
```

## État actuel et backlog

Voir `docs/plan-action-backend.md` (backend) et `docs/plan-frontend-simon.md` (frontend) pour l'état précis, ce qui est fait, testé, et les tâches restantes avec leurs dépendances.

## Décisions volontairement reportées (pas des oublis)

- Volet intermittence (compteur d'heures/cachets) — v2, complexité réglementaire à traiter à part
- Notifications temps réel — le mécanisme de recalcul déclenché existe déjà pour ça, rien de branché
- Vérification du statut pro/amateur — déclaratif pour l'instant, assumé
- Hashage des mots de passe — **à faire avant tout déploiement réel**, pas fait dans le code actuel
- Librairie de carte, gestion d'état frontend — à trancher ensemble, pas unilatéralement

## Routes de gestion de compte — contrat

Deux familles de routes distinctes, à ne pas confondre :

### `POST /api/v1/accounts` — inscription initiale (one-shot)
Crée en une seule transaction un `User` unique avec, au choix :
- un `MusicianProfile` (optionnel)
- un ou plusieurs `GroupProfile`, avec leurs `OpenPosition` associées

Route pensée pour le formulaire d'inscription complet. Remplace les anciennes
routes `POST /musicians` et `POST /groups` (retirées), qui créaient chacune
un `User` séparé — source potentielle de doublons de compte pour une même
personne.

### `POST /api/v1/users/me/*` — ajout ultérieur sur un compte existant
*(à venir — non encore implémenté)*

Chemin prévu pour rattacher un nouveau profil (groupe, founding) à un `User`
déjà créé, sans repasser par l'inscription complète. Ex. : un musicien déjà
inscrit qui décide plus tard de créer un groupe.

- `POST /users/me/groups`
- `POST /users/me/founding-profile`
- `POST /users/me/musician-profile`

**Règle** : `POST /accounts` ne doit jamais être utilisée pour ajouter un
profil à un compte existant — c'est strictement la route d'inscription
initiale.

## Pour une IA qui reprend ce projet

Lire dans l'ordre : ce fichier → `docs/modele-donnees-MVP.md` → `docs/architecture-couches-MVP.md` → un exemple existant complet (ressource `musician` ou `group`, les 6 fichiers du pattern ci-dessus) avant d'écrire quoi que ce soit de nouveau. Toujours lancer `npm run test` avant et après toute modification.

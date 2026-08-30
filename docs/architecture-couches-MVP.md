# Architecture applicative — MVP

## Principe

Quatre couches, dépendance dans un seul sens :

```
Présentation (controllers NestJS)
        ↓
Application (use cases, ports/interfaces)
        ↓
Domaine (métier pur : scoring, règles — zéro dépendance externe)
        ↓
Infrastructure (Postgres, jobs, adapters concrets)
```

Règle non négociable : le **Domaine** n'importe ni Postgres, ni NestJS, ni aucune lib d'infra. C'est ce qui rend le scoring testable en TDD sans base de données ni mock lourd.

## Structure de dossiers (pattern Ports & Adapters / hexagonal)

```
src/
├── domain/              # Entités métier pures + logique de scoring
│   ├── entities/         # MusicianProfile, OpenPosition, Match...
│   └── services/         # calculateMatch(musician, position): MatchResult
├── application/          # Orchestration des cas d'usage
│   ├── ports/             # Interfaces (MusicianRepository, PositionRepository...)
│   └── use-cases/         # RecalculateMatchesForMusician, CreateMusicianProfile...
├── infrastructure/       # Implémentations concrètes
│   ├── repositories/      # PostgresMusicianRepository implements MusicianRepository
│   ├── jobs/               # Système de recalcul déclenché (table de jobs Postgres)
│   └── mappers/            # Entité domaine ↔ modèle DB
└── presentation/         # Controllers, DTOs, validation HTTP
```

Cette structure correspond au pattern documenté dans le repo de référence `Sairyss/domain-driven-hexagon` (DDD + Hexagonal + TDD en TypeScript/NestJS), qui peut servir de squelette de départ.

## Inversion de dépendance : le point technique clé

L'Application définit des interfaces ("ports"), l'Infrastructure les implémente ("adapters"). NestJS gère le branchement via son système d'injection de dépendances — aucune configuration exotique nécessaire.

```typescript
// application/ports/musician.repository.ts
interface MusicianRepository {
  findById(id: string): Promise<MusicianProfile>;
  findCandidatesInZone(zone: Zone): Promise<MusicianProfile[]>;
}

// infrastructure/repositories/musician-postgres.repository.ts
@Injectable()
class PostgresMusicianRepository implements MusicianRepository {
  // implémentation concrète (TypeORM, Prisma, ou Slonik)
}
```

Bénéfice concret : tester un use case ("recalculer les matchs d'un musicien") se fait avec un `MusicianRepository` factice en mémoire, sans conteneur Postgres à monter pour chaque test.

## TDD sur le domaine — point de départ concret

Premier test à écrire, avant toute implémentation du scoring :

```typescript
describe('calculateMatch', () => {
  it('retourne 100% quand instrument, style et zone matchent exactement', () => {
    // arrange / act / assert
  });

  it('expose les sous-scores indépendamment du score global', () => {
    // vérifie l'invariant posé dans le modèle de données :
    // result.sous_scores.instrument doit exister séparément du total
  });

  it('retourne 0% quand l\'instrument recherché ne correspond à aucun instrument du musicien', () => {
    // cas limite avant le cas nominal — esprit TDD
  });
});
```

Méthode recommandée : partir des cas limites (aucun critère ne matche, tous matchent, un seul critère absent) avant les cas nominaux. Ça force à concevoir l'API du domaine (la forme de `MatchResult`, les paramètres de `calculateMatch`) avant l'implémentation.

## Lien avec le recalcul déclenché (Match pré-calculé)

Le use case `RecalculateMatchesForMusician` (couche Application) orchestre : récupérer les postes ouverts compatibles en zone (via le port `PositionRepository`) → appeler `domain/services/calculateMatch` pour chacun → persister les résultats (via le port `MatchRepository`). Ce use case est déclenché par le système de jobs (infrastructure) à chaque modification de profil ou de poste — c'est le point de branchement déjà identifié pour les futures notifications.

## Ressources

- **Repo de référence** (DDD + Hexagonal + TDD + SOLID, exemples TypeScript/NestJS) : https://github.com/Sairyss/domain-driven-hexagon
- **Article pratique sur la structure de dossiers et le testing des use cases sans mocker l'ORM** : https://medium.com/@srachel27/hexagonal-architecture-in-nestjs-stop-mocking-prisma-and-start-designing-for-change-6d1bab989622
- **Exemple minimal fonctionnel (repo GitHub)** : https://github.com/tim-hub/nestjs-hexagonal-example
- **Explication générale du pattern Ports & Adapters** (langage-agnostique, utile pour la théorie) : https://ridakaddir.com/blog/post/nestjs-clean-code-using-hexagonal-architecture

## Ce que cette architecture rend possible sans la reconstruire

- **Changer d'ORM ou de base de données** un jour : seule la couche Infrastructure change, le Domaine et l'Application n'en savent rien.
- **Ajouter les notifications (v2)** : nouveau consommateur branché sur l'événement de recalcul déjà existant.
- **Ajouter le volet intermittence (v2)** : nouvelles entités et use cases dans les mêmes couches, sans toucher au scoring existant.
- **Pondérations personnalisables** : modification localisée dans `domain/services/calculateMatch`, sans propagation dans les autres couches.

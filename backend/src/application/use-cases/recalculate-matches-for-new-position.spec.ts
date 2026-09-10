import { describe, expect, it, vi } from 'vitest';
import { RecalculateMatchesForNewPosition } from './recalculate-matches-for-new-position.js';
import { RecalculateMatchesForMusician } from './recalculate-matches-for-musician.js';
import type { MusicianRepository, CreateMusicianInput } from '../ports/musician.repository.js';
import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';
import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';

describe('RecalculateMatchesForNewPosition', () => {
  it('recalcule les matchs de chaque musicien trouvé dans la zone du poste', async () => {
    const musicianA = { id: 'musician-a' } as MusicianCandidate;
    const musicianB = { id: 'musician-b' } as MusicianCandidate;
    const position = {
      id: 'position-1',
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    } as OpenPositionCandidate;

    const musicianRepository: MusicianRepository = {
      findById: vi.fn(),
      findNearZone: vi.fn().mockResolvedValue([musicianA, musicianB]),
      create: vi.fn(),
    };

    // On mocke RecalculateMatchesForMusician en tant que dépendance,
    // en vérifiant seulement qu'il est appelé pour chaque musicien trouvé —
    // son propre comportement interne est déjà testé ailleurs.
    const recalculateMatchesForMusician = {
      execute: vi.fn(),
    } as unknown as RecalculateMatchesForMusician;

    const useCase = new RecalculateMatchesForNewPosition(musicianRepository, recalculateMatchesForMusician);
    await useCase.execute(position);

    expect(musicianRepository.findNearZone).toHaveBeenCalledWith(position.zone);
    expect(recalculateMatchesForMusician.execute).toHaveBeenCalledTimes(2);
    expect(recalculateMatchesForMusician.execute).toHaveBeenCalledWith('musician-a');
    expect(recalculateMatchesForMusician.execute).toHaveBeenCalledWith('musician-b');
  });

  it("ne fait rien si aucun musicien n'est trouvé dans la zone", async () => {
    const position = {
      id: 'position-1',
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' },
    } as OpenPositionCandidate;

    const musicianRepository: MusicianRepository = {
      findById: vi.fn(),
      findNearZone: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    };
    const recalculateMatchesForMusician = { execute: vi.fn() } as unknown as RecalculateMatchesForMusician;

    const useCase = new RecalculateMatchesForNewPosition(musicianRepository, recalculateMatchesForMusician);
    await useCase.execute(position);

    expect(recalculateMatchesForMusician.execute).not.toHaveBeenCalled();
  });
});
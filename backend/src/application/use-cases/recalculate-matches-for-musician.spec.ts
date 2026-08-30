import { describe, expect, it, vi } from 'vitest';
import { RecalculateMatchesForMusician } from './recalculate-matches-for-musician.js';
import type { MusicianRepository } from '../ports/musician.repository.js';
import type { OpenPositionRepository } from '../ports/open-position.repository.js';
import type { MatchRepository } from '../ports/match.repository.js';
import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';
import type { OpenPositionCandidate } from '../../domain/entities/open-position.entity.js';

const zone = { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' };

function buildMusician(): MusicianCandidate {
  return {
    id: 'musician-1',
    instruments: [{ instrument: 'guitare', niveau: 'avance' }],
    styles: ['rock'],
    zone,
    availabilities: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' }],
    status: 'amateur',
  };
}

function buildPosition(id: string): OpenPositionCandidate {
  return {
    id,
    instrumentRecherche: 'guitare',
    niveauAttendu: 'avance',
    stylesGroupe: ['rock'],
    zone,
  };
}

describe('RecalculateMatchesForMusician', () => {
  it("ne fait rien si le musicien n'existe pas", async () => {
    const musicianRepo: MusicianRepository = { findById: vi.fn().mockResolvedValue(null) };
    const positionRepo: OpenPositionRepository = { findOpenPositionsNearZone: vi.fn() };
    const matchRepo: MatchRepository = { upsert: vi.fn() };

    const useCase = new RecalculateMatchesForMusician(musicianRepo, positionRepo, matchRepo);
    await useCase.execute('musician-inconnu');

    expect(positionRepo.findOpenPositionsNearZone).not.toHaveBeenCalled();
    expect(matchRepo.upsert).not.toHaveBeenCalled();
  });

  it('calcule et persiste un match pour chaque poste ouvert trouvé en zone', async () => {
    const musician = buildMusician();
    const positions = [buildPosition('position-1'), buildPosition('position-2')];

    const musicianRepo: MusicianRepository = { findById: vi.fn().mockResolvedValue(musician) };
    const positionRepo: OpenPositionRepository = {
      findOpenPositionsNearZone: vi.fn().mockResolvedValue(positions),
    };
    const matchRepo: MatchRepository = { upsert: vi.fn().mockResolvedValue(undefined) };

    const useCase = new RecalculateMatchesForMusician(musicianRepo, positionRepo, matchRepo);
    await useCase.execute('musician-1');

    expect(matchRepo.upsert).toHaveBeenCalledTimes(2);
    expect(matchRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ musicianId: 'musician-1', positionId: 'position-1' }),
    );
    expect(matchRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ musicianId: 'musician-1', positionId: 'position-2' }),
    );
  });

  it('recherche les postes dans la zone du musicien récupéré', async () => {
    const musician = buildMusician();
    const musicianRepo: MusicianRepository = { findById: vi.fn().mockResolvedValue(musician) };
    const positionRepo: OpenPositionRepository = {
      findOpenPositionsNearZone: vi.fn().mockResolvedValue([]),
    };
    const matchRepo: MatchRepository = { upsert: vi.fn() };

    const useCase = new RecalculateMatchesForMusician(musicianRepo, positionRepo, matchRepo);
    await useCase.execute('musician-1');

    expect(positionRepo.findOpenPositionsNearZone).toHaveBeenCalledWith(musician.zone);
  });
});
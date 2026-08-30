import { describe, expect, it } from 'vitest';
import { calculateMatch } from './calculate-match.service.js';
import type { MusicianCandidate } from '../entities/musician.entity.js';
import type { OpenPositionCandidate } from '../entities/open-position.entity.js';

// Fixtures construites pour matcher parfaitement par défaut ; chaque test
// dégrade un seul critère à la fois.

const baseZone = { latitude: 48.5734, longitude: 7.7521, rayonKm: 20, ville: 'Strasbourg' };

function buildMusician(overrides: Partial<MusicianCandidate> = {}): MusicianCandidate {
  return {
    id: 'musician-1',
    instruments: [{ instrument: 'guitare', niveau: 'avance' }],
    styles: ['rock', 'indie'],
    zone: { ...baseZone },
    availabilities: [{ jourSemaine: 'mardi', creneauxJournee: 'soir' }],
    status: 'amateur',
    ...overrides,
  };
}

function buildPosition(overrides: Partial<OpenPositionCandidate> = {}): OpenPositionCandidate {
  return {
    id: 'position-1',
    instrumentRecherche: 'guitare',
    niveauAttendu: 'avance',
    stylesGroupe: ['rock', 'indie'],
    zone: { ...baseZone },
    ...overrides,
  };
}

describe('calculateMatch', () => {
  it('retourne un score global de 100 quand tous les critères correspondent exactement', () => {
    const result = calculateMatch(buildMusician(), buildPosition());
    expect(result.scoreGlobal).toBe(100);
  });

  it('expose les sous-scores indépendamment du score global', () => {
    const result = calculateMatch(buildMusician(), buildPosition());
    expect(result.sousScores).toEqual(
      expect.objectContaining({
        instrument: expect.any(Number),
        style: expect.any(Number),
        zone: expect.any(Number),
        disponibilite: expect.any(Number),
        niveau: expect.any(Number),
      }),
    );
  });

  it("retourne un score instrument de 0 quand le musicien ne joue pas l'instrument recherché", () => {
    const musician = buildMusician({ instruments: [{ instrument: 'batterie', niveau: 'avance' }] });
    const result = calculateMatch(musician, buildPosition());
    expect(result.sousScores.instrument).toBe(0);
  });

  it('retourne un score instrument de 100 quand un des instruments du musicien correspond', () => {
    const musician = buildMusician({
      instruments: [
        { instrument: 'basse', niveau: 'intermediaire' },
        { instrument: 'guitare', niveau: 'avance' },
      ],
    });
    const result = calculateMatch(musician, buildPosition());
    expect(result.sousScores.instrument).toBe(100);
  });

  it('retourne un score style de 0 quand aucun style ne se recoupe', () => {
    const musician = buildMusician({ styles: ['jazz', 'funk'] });
    const result = calculateMatch(musician, buildPosition());
    expect(result.sousScores.style).toBe(0);
  });

  it('retourne un score style partiel quand seule une partie des styles se recoupe', () => {
    const musician = buildMusician({ styles: ['rock', 'metal'] });
    const result = calculateMatch(musician, buildPosition({ stylesGroupe: ['rock', 'indie'] }));
    expect(result.sousScores.style).toBeGreaterThan(0);
    expect(result.sousScores.style).toBeLessThan(100);
  });

  it('retourne un score zone de 100 quand le musicien est au même point que le poste', () => {
    const result = calculateMatch(buildMusician(), buildPosition());
    expect(result.sousScores.zone).toBe(100);
  });

  it('retourne un score zone de 0 quand le musicien est hors du rayon du poste', () => {
    const musician = buildMusician({
      zone: { latitude: 43.6047, longitude: 1.4442, rayonKm: 20, ville: 'Toulouse' },
    });
    const result = calculateMatch(musician, buildPosition());
    expect(result.sousScores.zone).toBe(0);
  });

  it('retourne un score niveau maximal quand le niveau du musicien correspond exactement', () => {
    const result = calculateMatch(buildMusician(), buildPosition());
    expect(result.sousScores.niveau).toBe(100);
  });

  it('retourne un score niveau réduit mais non nul quand le niveau est proche sans être identique', () => {
    const musician = buildMusician({ instruments: [{ instrument: 'guitare', niveau: 'intermediaire' }] });
    const result = calculateMatch(musician, buildPosition({ niveauAttendu: 'avance' }));
    expect(result.sousScores.niveau).toBeGreaterThan(0);
    expect(result.sousScores.niveau).toBeLessThan(100);
  });

  it('ne renvoie jamais un score global négatif ou supérieur à 100', () => {
    const musician = buildMusician({
      instruments: [{ instrument: 'batterie', niveau: 'debutant' }],
      styles: ['jazz'],
      zone: { latitude: 43.6047, longitude: 1.4442, rayonKm: 5, ville: 'Toulouse' },
      availabilities: [],
    });
    const result = calculateMatch(musician, buildPosition());
    expect(result.scoreGlobal).toBeGreaterThanOrEqual(0);
    expect(result.scoreGlobal).toBeLessThanOrEqual(100);
  });
});
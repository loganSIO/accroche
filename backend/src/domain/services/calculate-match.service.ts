import type { MusicianCandidate, NiveauMusicien } from '../entities/musician.entity.js';
import type { OpenPositionCandidate } from '../entities/open-position.entity.js';
import type { MatchResult, MatchSubScores } from '../entities/match.entity.js';

// L'instrument et la zone sont des critères d'éligibilité. Les seuls critères
// agrégés sont donc le niveau, les styles et la zone.
export const DEFAULT_WEIGHTS = {
  niveau: 0.3,
  style: 0.4,
  zone: 0.3,
};

export const MINIMUM_MATCH_SCORE = 50;

const NIVEAU_ORDER: NiveauMusicien[] = ['debutant', 'intermediaire', 'avance', 'expert'];

function scoreStyle(musician: MusicianCandidate, position: OpenPositionCandidate): number {
  if (position.stylesGroupe.length === 0) return 100;
  const stylesCommuns = musician.styles.filter((style) => position.stylesGroupe.includes(style));
  return Math.round((stylesCommuns.length / position.stylesGroupe.length) * 100);
}

// Distance à vol d'oiseau (formule de Haversine) — suffisante pour un score
// de proximité au MVP ; PostGIS prendra le relais pour les requêtes de
// clustering de la carte, qui sont un besoin différent (lister, pas scorer).
function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

function scoreZone(
  musician: MusicianCandidate,
  position: OpenPositionCandidate,
): { compatible: boolean; score: number } {
  const distance = distanceKm(musician.zone, position.zone);
  const rayonEffectif = Math.min(musician.zone.rayonKm, position.zone.rayonKm);

  if (distance > musician.zone.rayonKm || distance > position.zone.rayonKm) {
    return { compatible: false, score: 0 };
  }
  if (rayonEffectif === 0) {
    return { compatible: true, score: distance === 0 ? 100 : 0 };
  }
  return {
    compatible: true,
    score: Math.round((1 - distance / rayonEffectif) * 100),
  };
}

function scoreNiveau(musician: MusicianCandidate, position: OpenPositionCandidate): number {
  const niveauMusicien = musician.instruments.find(
    (i) => i.instrument === position.instrumentRecherche,
  )?.niveau;

  if (!niveauMusicien) return 0;

  const ecart = Math.abs(
    NIVEAU_ORDER.indexOf(niveauMusicien) - NIVEAU_ORDER.indexOf(position.niveauAttendu),
  );

  return Math.max(0, 100 - ecart * 30);
}

export function calculateMatch(
  musician: MusicianCandidate,
  position: OpenPositionCandidate,
): MatchResult | null {
  const instrumentCompatible = musician.instruments.some(
    (instrument) => instrument.instrument === position.instrumentRecherche,
  );
  if (!instrumentCompatible) return null;

  const zone = scoreZone(musician, position);
  if (!zone.compatible) return null;

  const sousScores: MatchSubScores = {
    instrument: 100,
    style: scoreStyle(musician, position),
    zone: zone.score,
    // Conservé pour compatibilité avec le schéma/API historique, mais
    // volontairement exclu du calcul tant que le poste n'a pas de créneaux.
    disponibilite: 0,
    niveau: scoreNiveau(musician, position),
  };

  const scoreGlobal = Math.round(
    sousScores.niveau * DEFAULT_WEIGHTS.niveau +
      sousScores.style * DEFAULT_WEIGHTS.style +
      sousScores.zone * DEFAULT_WEIGHTS.zone,
  );

  return {
    scoreGlobal: Math.min(100, Math.max(0, scoreGlobal)),
    sousScores,
  };
}
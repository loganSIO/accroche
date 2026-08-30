import type { MusicianCandidate, NiveauMusicien } from '../entities/musician.entity.js';
import type { OpenPositionCandidate } from '../entities/open-position.entity.js';
import type { MatchResult, MatchSubScores } from '../entities/match.entity.js';

// Pondérations fixes pour le MVP. Exposées comme constante plutôt qu'en dur
// dans le calcul, pour permettre plus tard des pondérations personnalisables
// par utilisateur sans réécrire la logique de sous-scores.
export const DEFAULT_WEIGHTS: MatchSubScores = {
    // Faut ajuster les poids ou la logique de calcul, le métier est pas bon là (batteur 70/30,
    // alors qu'ils cherchent un guitariste)
  instrument: 0.3,
  style: 0.25,
  zone: 0.2,
  disponibilite: 0.15,
  // Niveau a 0.1, wtf ?
  niveau: 0.1,
};

const NIVEAU_ORDER: NiveauMusicien[] = ['debutant', 'intermediaire', 'avance', 'expert'];

function scoreInstrument(musician: MusicianCandidate, position: OpenPositionCandidate): number {
  const joue = musician.instruments.some((i) => i.instrument === position.instrumentRecherche);
  return joue ? 100 : 0;
}

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

function scoreZone(musician: MusicianCandidate, position: OpenPositionCandidate): number {
  const distance = distanceKm(musician.zone, position.zone);
  const rayon = position.zone.rayonKm;

  if (distance >= rayon) return 0;
  return Math.round((1 - distance / rayon) * 100);
}

function scoreDisponibilite(musician: MusicianCandidate): number {
  // Version simple pour le MVP : au moins une disponibilité déclarée = score
  // plein. Affiné plus tard si le poste exprime des créneaux précis.
  return musician.availabilities.length > 0 ? 100 : 0;
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
): MatchResult {
  const sousScores: MatchSubScores = {
    instrument: scoreInstrument(musician, position),
    style: scoreStyle(musician, position),
    zone: scoreZone(musician, position),
    disponibilite: scoreDisponibilite(musician),
    niveau: scoreNiveau(musician, position),
  };

  const scoreGlobal = Math.round(
    sousScores.instrument * DEFAULT_WEIGHTS.instrument +
      sousScores.style * DEFAULT_WEIGHTS.style +
      sousScores.zone * DEFAULT_WEIGHTS.zone +
      sousScores.disponibilite * DEFAULT_WEIGHTS.disponibilite +
      sousScores.niveau * DEFAULT_WEIGHTS.niveau,
  );

  return {
    scoreGlobal: Math.min(100, Math.max(0, scoreGlobal)),
    sousScores,
  };
}
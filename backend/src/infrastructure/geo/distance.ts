// Distance à vol d'oiseau (formule de Haversine). Utilisé par tous les
// repositories qui filtrent des résultats par proximité géographique
// (musiciens, postes ouverts). Centralisé ici pour éviter les divergences
// entre plusieurs copies — cf. l'ancien commentaire dans
// open-position-prisma.repository.ts qui anticipait ce besoin.
export function distanceKm(
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
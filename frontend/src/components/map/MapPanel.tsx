import { useMemo, useState } from 'react';
import { UserMarker } from './UserMarker';

export interface MapProfile { id: string; label: string; city: string; type: 'Musicien' | 'Groupe' | 'Founding'; instrument: string; style: string; }
const profiles: MapProfile[] = [
  { id: '1', label: 'Léa · Batterie', city: 'Strasbourg', type: 'Musicien', instrument: 'Batterie', style: 'Rock' },
  { id: '2', label: 'Les Ondes', city: 'Strasbourg', type: 'Groupe', instrument: 'Guitare', style: 'Indie' },
  { id: '3', label: 'Projet funk', city: 'Schiltigheim', type: 'Founding', instrument: 'Basse', style: 'Funk' },
];

export function MapPanel() {
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [style, setStyle] = useState('');
  const [instrument, setInstrument] = useState('');
  const filteredProfiles = useMemo(() => profiles.filter((profile) =>
    (!city || profile.city === city) && (!type || profile.type === type) && (!style || profile.style === style) && (!instrument || profile.instrument === instrument),
  ), [city, type, style, instrument]);
  return <section className="map-card" aria-label="Carte publique des profils">
    <div className="map-toolbar">
      <label>Ville<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">Toutes</option><option>Strasbourg</option><option>Schiltigheim</option></select></label>
      <label>Profil<select value={type} onChange={(event) => setType(event.target.value)}><option value="">Tous</option><option>Musicien</option><option>Groupe</option><option>Founding</option></select></label>
      <label>Instrument<select value={instrument} onChange={(event) => setInstrument(event.target.value)}><option value="">Tous</option><option>Batterie</option><option>Guitare</option><option>Basse</option></select></label>
      <label>Style<select value={style} onChange={(event) => setStyle(event.target.value)}><option value="">Tous</option><option>Rock</option><option>Indie</option><option>Funk</option></select></label>
    </div>
    <div className="map-surface">{filteredProfiles.map((profile, index) => <span className={`map-marker marker-${index + 1}`} key={profile.id}><UserMarker label={profile.label} city={profile.city} /></span>)}
      {filteredProfiles.length === 0 && <p className="map-empty">Aucun profil pour ces filtres.</p>}
      <span className="map-label">Strasbourg et environs</span>
    </div>
    <p className="map-caption">{filteredProfiles.length} profil{filteredProfiles.length > 1 ? 's' : ''} actif{filteredProfiles.length > 1 ? 's' : ''} visible{filteredProfiles.length > 1 ? 's' : ''}</p>
  </section>;
}

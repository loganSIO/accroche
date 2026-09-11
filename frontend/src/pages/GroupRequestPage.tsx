import { useState } from 'react';
import { CityField } from '../components/profile/CityField';
import type { AppRoute } from '../App';
import type { PositionLevel, RegisterGroupInput } from '../api/users';

const instruments = ['Chant', 'Guitare', 'Basse', 'Batterie', 'Clavier', 'Piano', 'Violon', 'Saxophone'];
const styles = ['Rock', 'Pop', 'Jazz', 'Blues', 'Funk', 'Indie', 'Electro', 'Classique', 'Metal', 'Reggae'];
const MAX_GROUP_DESCRIPTION_LENGTH = 500;
const levels = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

interface PositionDraft { instrument: string; niveau: PositionLevel; }

export function GroupRequestPage({ onNavigate }: { onNavigate: (route: AppRoute) => void }) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [groupStyles, setGroupStyles] = useState<string[]>([]);
  const [positions, setPositions] = useState<PositionDraft[]>([]);
  const [saved, setSaved] = useState(false);

  const addPosition = () => setPositions((current) => [...current, { instrument: instruments[0], niveau: 'debutant' }]);
  const updatePosition = (index: number, update: Partial<PositionDraft>) => setPositions((current) => current.map((position, positionIndex) => positionIndex === index ? { ...position, ...update } : position));
  const toggleStyle = (style: string) => setGroupStyles((current) => current.includes(style) ? current.filter((item) => item !== style) : [...current, style]);

  const save = () => {
    const group: RegisterGroupInput = {
      name,
      styles: groupStyles,
      status: 'association',
      description,
      audioLinks: [],
      requestedInstruments: positions,
    };
    const request = { ...group, city };
    localStorage.setItem('accroche.groupRequests', JSON.stringify([
      ...JSON.parse(localStorage.getItem('accroche.groupRequests') ?? '[]') as unknown[],
      request,
    ]));
    const profile = localStorage.getItem('accroche.profileDraft');
    if (profile) {
      const parsed = JSON.parse(profile) as { groups?: unknown[] };
      localStorage.setItem('accroche.profileDraft', JSON.stringify({ ...parsed, groups: [...(parsed.groups ?? []), { name, city, position: positions[0]?.instrument ?? instruments[0], status: group.status, description }] }));
    }
    setSaved(true);
  };

  return <section>
    <header className="page-heading">
      <span className="eyebrow">Recherche de musiciens</span>
      <h1>Créer une demande pour un groupe</h1>
      <p className="page-intro">Décrivez votre groupe et les postes à pourvoir.</p>
    </header>
    <form className="profile-form request-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
      <fieldset className="surface-card">
        <legend>Le groupe</legend>
        <label>Nom du groupe<input required value={name} onChange={(event) => setName(event.target.value)} /></label>
        <CityField value={city} onChange={setCity} id="group-french-cities" />
        <label>
          Description
          <textarea
            required
            rows={4}
            value={description}
            maxLength={MAX_GROUP_DESCRIPTION_LENGTH}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Présentez votre projet musical..."
          />
          <span className="character-counter">{description.length}/{MAX_GROUP_DESCRIPTION_LENGTH} caractères</span>
        </label>
        <span className="field-label">Styles musicaux</span>
        <div className="choice-grid">{styles.map((style) => <label className="choice" key={style}><input type="checkbox" checked={groupStyles.includes(style)} onChange={() => toggleStyle(style)} />{style}</label>)}</div>
      </fieldset>
      <fieldset className="surface-card">
        <legend>Postes recherchés</legend>
        <p className="form-hint">Ajoutez chaque instrument recherché et le niveau attendu.</p>
        {positions.map((position, index) => <div className="position-row" key={index}>
          <select aria-label={`Instrument recherché ${index + 1}`} value={position.instrument} onChange={(event) => updatePosition(index, { instrument: event.target.value })}>{instruments.map((instrument) => <option value={instrument} key={instrument}>{instrument}</option>)}</select>
          <select aria-label={`Niveau attendu ${index + 1}`} value={position.niveau} onChange={(event) => updatePosition(index, { niveau: event.target.value as PositionLevel })}>{levels.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select>
          <button className="remove-group" type="button" onClick={() => setPositions((current) => current.filter((_, positionIndex) => positionIndex !== index))}>Supprimer</button>
        </div>)}
        <button className="button button-secondary" type="button" onClick={addPosition}>+ Ajouter un poste</button>
      </fieldset>
      <div className="request-actions"><button className="button button-secondary" type="button" onClick={() => onNavigate('/profile')}>Retour au profil</button><button className="button button-primary" type="submit" disabled={!positions.length}>Publier la demande</button></div>
      {saved && <p className="form-notice" role="status">Demande enregistrée sur cet appareil.</p>}
    </form>
  </section>;
}

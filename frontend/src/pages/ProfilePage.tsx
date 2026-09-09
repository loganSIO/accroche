import { useState } from 'react';

const instruments = ['Chant', 'Guitare', 'Basse', 'Batterie', 'Clavier', 'Piano', 'Violon', 'Saxophone'];
const styles = ['Rock', 'Pop', 'Jazz', 'Blues', 'Funk', 'Indie', 'Electro', 'Classique', 'Metal', 'Reggae'];
const levels = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

interface GroupDraft {
  name: string;
  city: string;
  position: string;
  status: 'association' | 'professionnel';
  description: string;
}

interface ProfileDraft {
  musicianName: string;
  city: string;
  instruments: string[];
  instrumentLevels: Record<string, string>;
  styles: string[];
  bio: string;
  groups: GroupDraft[];
}

interface GroupRequest {
  name: string;
  city: string;
  description: string;
  styles: string[];
  positions: Array<{ instrument: string; level: string }>;
}

function readRequests(): GroupRequest[] {
  const stored = localStorage.getItem('accroche.groupRequests');
  if (!stored) return [];
  try {
    const requests = JSON.parse(stored) as unknown;
    return Array.isArray(requests) ? requests as GroupRequest[] : [];
  } catch {
    return [];
  }
}

function levelLabel(value: string) {
  return ({ debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé', expert: 'Expert' } as Record<string, string>)[value] ?? value;
}

function readDraft(): ProfileDraft | null {
  const stored = localStorage.getItem('accroche.profileDraft');
  if (!stored) return null;
  try {
    return JSON.parse(stored) as ProfileDraft;
  } catch {
    return null;
  }
}

export function ProfilePage() {
  const draft = readDraft();
  const requests = readRequests();
  const [musicianName, setMusicianName] = useState(draft?.musicianName ?? '');
  const [city, setCity] = useState(draft?.city ?? '');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>(draft?.instruments ?? []);
  const [instrumentLevels, setInstrumentLevels] = useState<Record<string, string>>(draft?.instrumentLevels ?? {});
  const [selectedStyles, setSelectedStyles] = useState<string[]>(draft?.styles ?? []);
  const [bio, setBio] = useState(draft?.bio ?? '');
  const [groups, setGroups] = useState<GroupDraft[]>(draft?.groups ?? []);
  const [saved, setSaved] = useState(false);

  const addGroup = () => setGroups((current) => [...current, {
    name: '',
    city: '',
    position: instruments[0],
    status: 'association',
    description: '',
  }]);

  const toggleInstrument = (instrument: string) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments((current) => current.filter((item) => item !== instrument));
      setInstrumentLevels((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== instrument)));
      return;
    }
    setSelectedInstruments((current) => [...current, instrument]);
    setInstrumentLevels((current) => ({ ...current, [instrument]: current[instrument] ?? 'debutant' }));
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles((current) => current.includes(style)
      ? current.filter((item) => item !== style)
      : [...current, style]);
  };

  const save = () => {
    localStorage.setItem('accroche.profileDraft', JSON.stringify({
      musicianName,
      city,
      instruments: selectedInstruments,
      instrumentLevels,
      styles: selectedStyles,
      bio,
      groups,
    }));
    setSaved(true);
  };

  return <section>
    <header className="page-heading">
      <span className="eyebrow">Mon profil</span>
      <h1>Votre vitrine de musicien</h1>
      <p className="page-intro">Les autres musiciens et groupes pourront découvrir ces informations.</p>
    </header>
    <div className="profile-layout">
      <form className="profile-form" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <fieldset className="surface-card">
          <legend>Informations publiques</legend>
          <label>Nom de musicien<input value={musicianName} required placeholder="Votre nom ou nom de scène" onChange={(event) => setMusicianName(event.target.value)} /></label>
          <label>Ville<input value={city} required placeholder="Strasbourg" onChange={(event) => setCity(event.target.value)} /></label>
          <label>Bio<textarea rows={4} value={bio} placeholder="Parlez de votre pratique musicale..." onChange={(event) => setBio(event.target.value)} /></label>
          <span className="field-label">Instruments et niveaux</span>
          <p className="form-hint">Un niveau est obligatoire pour chaque instrument sélectionné.</p>
          <div className="instrument-list">{instruments.map((instrument) => <div className="instrument-row" key={instrument}>
            <label className="choice"><input type="checkbox" checked={selectedInstruments.includes(instrument)} onChange={() => toggleInstrument(instrument)} />{instrument}</label>
            {selectedInstruments.includes(instrument) && <select aria-label={`Niveau ${instrument}`} required value={instrumentLevels[instrument] ?? ''} onChange={(event) => setInstrumentLevels((current) => ({ ...current, [instrument]: event.target.value }))}><option value="" disabled>Choisir un niveau</option>{levels.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select>}
          </div>)}</div>
          <span className="field-label">Styles musicaux</span>
          <div className="choice-grid">{styles.map((style) => <label className="choice" key={style}><input type="checkbox" checked={selectedStyles.includes(style)} onChange={() => toggleStyle(style)} />{style}</label>)}</div>
        </fieldset>
        <fieldset className="surface-card">
          <legend>Mes groupes</legend>
          {groups.length === 0 && <p className="form-hint">Vous n'avez pas encore enregistré de groupe.</p>}
          {groups.map((group, index) => <div className="group-profile" key={index}>
            <div className="group-heading"><h3>{group.name || `Groupe ${index + 1}`}</h3><button className="remove-group" type="button" onClick={() => setGroups((current) => current.filter((_, groupIndex) => groupIndex !== index))}>Supprimer</button></div>
            <label>Nom du groupe<input value={group.name} required onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, name: event.target.value } : item))} /></label>
            <div className="form-two-columns">
              <label>Ville<input value={group.city} required onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, city: event.target.value } : item))} /></label>
              <label>Poste occupé<select value={group.position} required onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, position: event.target.value } : item))}>{instruments.map((instrument) => <option value={instrument} key={instrument}>{instrument}</option>)}</select></label>
            </div>
            <label>Statut<select value={group.status} onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, status: event.target.value as GroupDraft['status'] } : item))}><option value="association">Association</option><option value="professionnel">Professionnel</option></select></label>
            <label>Description<textarea rows={2} value={group.description} onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, description: event.target.value } : item))} /></label>
            <p className="form-hint">{group.city || 'Ville à renseigner'} · {group.position} · {group.status === 'professionnel' ? 'Professionnel' : 'Association'}</p>
          </div>)}
          <button className="button button-secondary" type="button" onClick={addGroup}>+ Ajouter un groupe</button>
        </fieldset>
        <button className="button button-primary" type="submit">Enregistrer ma vitrine</button>
        {saved && <p className="form-notice" role="status">Vitrine enregistrée sur cet appareil.</p>}
        <section className="surface-card published-requests">
          <h2>Mes demandes publiées</h2>
          {requests.length === 0 && <p className="form-hint">Vous n'avez pas encore publié de demande pour un groupe.</p>}
          {requests.map((request, index) => <article className="request-card" key={`${request.name}-${index}`}>
            <div className="group-heading"><h3>{request.name}</h3><span className="request-city">{request.city}</span></div>
            <p>{request.description}</p>
            {request.styles.length > 0 && <div className="tag-list">{request.styles.map((style) => <span className="tag" key={style}>{style}</span>)}</div>}
            <h4>Postes recherchés</h4>
            <ul>{request.positions.map((position) => <li key={`${position.instrument}-${position.level}`}>{position.instrument} — {levelLabel(position.level)}</li>)}</ul>
          </article>)}
        </section>
      </form>
      <aside className="profile-showcase surface-card">
        <span className="eyebrow">Aperçu public</span>
        <h2>{musicianName || 'Votre nom de musicien'}</h2>
        <p className="profile-location">{city || 'Ville à renseigner'}</p>
        <p>{bio || 'Votre présentation apparaîtra ici.'}</p>
        <h3>Instruments</h3>
        {selectedInstruments.length ? <ul>{selectedInstruments.map((instrument) => <li key={instrument}>{instrument} — {levels.find((level) => level.value === instrumentLevels[instrument])?.label}</li>)}</ul> : <p className="form-hint">Aucun instrument renseigné.</p>}
        <h3>Styles</h3>
        <div className="tag-list">{selectedStyles.map((style) => <span className="tag" key={style}>{style}</span>)}</div>
      </aside>
    </div>
  </section>;
}

import { useEffect, useState } from 'react';
import { CityField } from '../components/profile/CityField';
import { ApiError } from '../api/client';
import { createMusicianProfile, getMusicianProfile, updateMusicianProfile, type GroupStatus, type MusicianObjective, type PositionLevel } from '../api/users';
import {
  deleteUserGroup,
  listGroupPositions,
  listUserGroups,
  updateGroupPosition,
  updateUserGroup,
  type ManagedOpenPosition,
  type UserGroup,
} from '../api/groups';

const instruments = ['Chant', 'Guitare', 'Basse', 'Batterie', 'Clavier', 'Piano', 'Violon', 'Saxophone'];
const styles = ['Rock', 'Pop', 'Jazz', 'Blues', 'Funk', 'Indie', 'Electro', 'Classique', 'Metal', 'Reggae'];
const MAX_BIO_LENGTH = 500;
const MAX_GROUP_DESCRIPTION_LENGTH = 500;
const levels = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
  { value: 'expert', label: 'Expert' },
];

interface GroupMembershipDraft {
  id?: string;
  name: string;
  city: string;
  position: string;
  status: GroupStatus;
  description: string;
}

export function ProfilePage() {
  const [musicianName, setMusicianName] = useState('');
  const [city, setCity] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [instrumentLevels, setInstrumentLevels] = useState<Record<string, string>>({});
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [groups, setGroups] = useState<GroupMembershipDraft[]>([]);
  const [publishedGroups, setPublishedGroups] = useState<UserGroup[]>([]);
  const [publishedPositions, setPublishedPositions] = useState<Record<string, ManagedOpenPosition[]>>({});
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [requestDraft, setRequestDraft] = useState<UserGroup | null>(null);
  const [requestPositions, setRequestPositions] = useState<ManagedOpenPosition[]>([]);
  const [requestBusy, setRequestBusy] = useState(false);
  const [activeGroupTab, setActiveGroupTab] = useState<'showcase' | 'requests'>('showcase');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, requests] = await Promise.all([
          getMusicianProfile().catch((reason: unknown) => {
            if (reason instanceof ApiError && reason.status === 404) return null;
            throw reason;
          }),
          listUserGroups(),
        ]);
        if (profile) {
          setMusicianName(profile.musicianName);
          setCity(profile.zone.ville);
          setSelectedInstruments(profile.instruments.map((item) => item.instrument));
          setInstrumentLevels(Object.fromEntries(profile.instruments.map((item) => [item.instrument, item.niveau])));
          setSelectedStyles(profile.styles);
          setBio(profile.bio ?? '');
          setGroups(profile.showcaseGroups ?? []);
        }
        setPublishedGroups(requests);
        const positions = await Promise.all(requests.map(async (group) => [group.id, await listGroupPositions(group.id)] as const));
        setPublishedPositions(Object.fromEntries(positions));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Impossible de charger le profil.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const reloadPublishedGroups = async () => {
    const requests = await listUserGroups();
    setPublishedGroups(requests);
    const positions = await Promise.all(requests.map(async (group) => [group.id, await listGroupPositions(group.id)] as const));
    setPublishedPositions(Object.fromEntries(positions));
  };

  const startEditingRequest = (group: UserGroup) => {
    setEditingRequestId(group.id);
    setRequestDraft({ ...group });
    setRequestPositions((publishedPositions[group.id] ?? []).map((position) => ({ ...position })));
  };

  const saveRequest = async () => {
    if (!requestDraft || !editingRequestId) return;
    setRequestBusy(true);
    setError('');
    try {
      await updateUserGroup(editingRequestId, {
        name: requestDraft.name,
        styles: requestDraft.styles,
        status: requestDraft.status,
        description: requestDraft.description,
        zone: requestDraft.zone,
      });
      await Promise.all(requestPositions.map((position) => updateGroupPosition(editingRequestId, position.id, {
        instrument: position.instrument,
        niveau: position.niveau,
      })));
      await reloadPublishedGroups();
      setEditingRequestId(null);
      setRequestDraft(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de modifier la demande.');
    } finally {
      setRequestBusy(false);
    }
  };

  const removeRequest = async (groupId: string) => {
    if (!window.confirm('Supprimer cette demande et ses postes ?')) return;
    setRequestBusy(true);
    setError('');
    try {
      await deleteUserGroup(groupId);
      await reloadPublishedGroups();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de supprimer la demande.');
    } finally {
      setRequestBusy(false);
    }
  };

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

  const save = async () => {
    setError('');
    const input = {
      musicianName,
      status: 'amateur' as const,
      instruments: selectedInstruments.map((instrument) => ({ instrument, niveau: (instrumentLevels[instrument] ?? 'debutant') as PositionLevel })),
      styles: selectedStyles,
      objective: ['join_group'] as MusicianObjective[],
      availabilities: [],
      bio,
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 30, ville: city },
      showcaseGroups: groups,
    };
    try {
      try {
        await updateMusicianProfile(input);
      } catch (reason) {
        if (!(reason instanceof ApiError) || reason.status !== 404) throw reason;
        await createMusicianProfile(input);
      }
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible d’enregistrer le profil.');
    }
  };

  if (loading) return <section><p className="form-hint">Chargement du profil…</p></section>;
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
          <CityField value={city} onChange={setCity} />
          <label>
            Bio
            <textarea
              rows={4}
              value={bio}
              maxLength={MAX_BIO_LENGTH}
              placeholder="Parlez de votre pratique musicale..."
              onChange={(event) => setBio(event.target.value)}
            />
            <span className="character-counter">{bio.length}/{MAX_BIO_LENGTH} caractères</span>
          </label>
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
          <div className="profile-tabs" role="tablist" aria-label="Mes groupes">
            <button type="button" role="tab" aria-selected={activeGroupTab === 'showcase'} className={activeGroupTab === 'showcase' ? 'profile-tab active' : 'profile-tab'} onClick={() => setActiveGroupTab('showcase')}>Ma vitrine</button>
            <button type="button" role="tab" aria-selected={activeGroupTab === 'requests'} className={activeGroupTab === 'requests' ? 'profile-tab active' : 'profile-tab'} onClick={() => setActiveGroupTab('requests')}>Mes demandes</button>
          </div>
          {activeGroupTab === 'showcase' && <>
            {groups.length === 0 && <p className="form-hint">Vous n'avez pas encore enregistré de groupe.</p>}
            {groups.map((group, index) => <div className="group-profile" key={index}>
            <div className="group-heading"><h3>{group.name || `Groupe ${index + 1}`}</h3><button className="remove-group" type="button" onClick={() => setGroups((current) => current.filter((_, groupIndex) => groupIndex !== index))}>Supprimer</button></div>
            <label>Nom du groupe<input value={group.name} required onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, name: event.target.value } : item))} /></label>
            <div className="form-two-columns">
              <CityField
                value={group.city}
                onChange={(value) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, city: value } : item))}
                id={`group-city-${index}`}
              />
              <label>Poste occupé<select value={group.position} required onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, position: event.target.value } : item))}>{instruments.map((instrument) => <option value={instrument} key={instrument}>{instrument}</option>)}</select></label>
            </div>
            <label>Statut<select value={group.status} onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, status: event.target.value as GroupStatus } : item))}><option value="association">Association</option><option value="professionnel">Professionnel</option></select></label>
            <label>
              Description
              <textarea
                rows={2}
                value={group.description}
                maxLength={MAX_GROUP_DESCRIPTION_LENGTH}
                onChange={(event) => setGroups((current) => current.map((item, groupIndex) => groupIndex === index ? { ...item, description: event.target.value } : item))}
              />
              <span className="character-counter">{group.description.length}/{MAX_GROUP_DESCRIPTION_LENGTH} caractères</span>
            </label>
            <p className="form-hint">{group.city || 'Ville à renseigner'} · {group.position} · {group.status === 'professionnel' ? 'Professionnel' : 'Association'}</p>
            </div>)}
            <button className="button button-secondary" type="button" onClick={addGroup}>+ Ajouter un groupe</button>
          </>}
          {activeGroupTab === 'requests' && <>
            {publishedGroups.length === 0 && <p className="form-hint">Vous n'avez pas encore publié de demande.</p>}
            {publishedGroups.map((group) => {
              const isEditing = editingRequestId === group.id && requestDraft;
              const positions = isEditing ? requestPositions : (publishedPositions[group.id] ?? []);
              return <div className="group-profile" key={group.id}>
                {isEditing ? <>
                  <div className="group-heading"><h3>Modifier la demande</h3></div>
                  <label>Nom du groupe<input value={requestDraft.name} onChange={(event) => setRequestDraft({ ...requestDraft, name: event.target.value })} /></label>
                  <label>Ville<input value={requestDraft.zone.ville} onChange={(event) => setRequestDraft({ ...requestDraft, zone: { ...requestDraft.zone, ville: event.target.value } })} /></label>
                  <label>Description<textarea value={requestDraft.description ?? ''} onChange={(event) => setRequestDraft({ ...requestDraft, description: event.target.value })} /></label>
                  <label>Statut<select value={requestDraft.status} onChange={(event) => setRequestDraft({ ...requestDraft, status: event.target.value as GroupStatus })}><option value="association">Association</option><option value="professionnel">Professionnel</option></select></label>
                  <strong>Postes recherchés</strong>
                  {positions.map((position, index) => <div className="position-row" key={position.id}>
                    <input value={position.instrument} onChange={(event) => setRequestPositions((current) => current.map((item, positionIndex) => positionIndex === index ? { ...item, instrument: event.target.value } : item))} />
                    <select value={position.niveau} onChange={(event) => setRequestPositions((current) => current.map((item, positionIndex) => positionIndex === index ? { ...item, niveau: event.target.value as PositionLevel } : item))}>{levels.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select>
                  </div>)}
                  <div className="request-actions"><button className="button button-secondary" type="button" disabled={requestBusy} onClick={() => setEditingRequestId(null)}>Annuler</button><button className="button button-primary" type="button" disabled={requestBusy} onClick={saveRequest}>Enregistrer</button></div>
                </> : <>
                  <div className="group-heading"><h3>{group.name}</h3><span className="group-status">{group.status === 'professionnel' ? 'Professionnel' : 'Association'}</span></div>
                  <p className="form-hint">{group.zone.ville} · {group.description || 'Aucune description'}</p>
                  <strong>Postes recherchés</strong>
                  <ul>{positions.map((position) => <li key={position.id}>{position.instrument} — {levels.find((level) => level.value === position.niveau)?.label ?? position.niveau} ({position.statut})</li>)}</ul>
                  <div className="request-actions"><button className="button button-secondary" type="button" disabled={requestBusy} onClick={() => startEditingRequest(group)}>Modifier</button><button className="remove-group" type="button" disabled={requestBusy} onClick={() => removeRequest(group.id)}>Supprimer la demande</button></div>
                </>}
              </div>;
            })}
          </>}
        </fieldset>
        <button className="button button-primary" type="submit">Enregistrer ma vitrine</button>
        {saved && <p className="form-notice" role="status">Vitrine enregistrée.</p>}
        {error && <p className="form-notice error" role="alert">{error}</p>}
      </form>
      <aside className="profile-showcase surface-card">
        <span className="eyebrow">Aperçu public</span>
        <h2>{musicianName || 'Votre nom de musicien'}</h2>
        <p className="profile-location">{city || 'Ville à renseigner'}</p>
        <p className="profile-bio">{bio || 'Votre présentation apparaîtra ici.'}</p>
        <h3>Instruments</h3>
        {selectedInstruments.length ? <ul>{selectedInstruments.map((instrument) => <li key={instrument}>{instrument} — {levels.find((level) => level.value === instrumentLevels[instrument])?.label}</li>)}</ul> : <p className="form-hint">Aucun instrument renseigné.</p>}
        <h3>Styles</h3>
        <div className="tag-list">{selectedStyles.map((style) => <span className="tag" key={style}>{style}</span>)}</div>
      </aside>
    </div>
  </section>;
}

import { useState, type FormEvent } from 'react';
import { registerAccount, type RegisterAccountInput } from '../../api/users';

const INSTRUMENTS = ['Chant', 'Guitare', 'Basse', 'Batterie', 'Clavier', 'Piano', 'Violon', 'Saxophone'];
const STYLES = ['Rock', 'Pop', 'Jazz', 'Blues', 'Funk', 'Indie', 'Electro', 'Classique', 'Metal', 'Reggae'];
const LEVELS = [{ value: 'debutant', label: 'Débutant' }, { value: 'intermediaire', label: 'Intermédiaire' }, { value: 'avance', label: 'Avancé' }, { value: 'expert', label: 'Expert' }];
type ProfileSelection = 'musician' | 'group';
type GroupDraft = { name: string; status: 'association' | 'professionnel'; styles: string[]; description: string; requestedInstruments: string[]; requestedLevels: Record<string, string> };

const emptyGroup = (): GroupDraft => ({ name: '', status: 'association', styles: [], description: '', requestedInstruments: [], requestedLevels: {} });
const toggle = (values: string[], value: string) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [profiles, setProfiles] = useState<ProfileSelection[]>(['musician']);
  const [groups, setGroups] = useState<GroupDraft[]>([emptyGroup()]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [instrumentLevels, setInstrumentLevels] = useState<Record<string, string>>({});
  const [styles, setStyles] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const updateGroup = (index: number, update: Partial<GroupDraft>) => setGroups((current) => current.map((group, groupIndex) => groupIndex === index ? { ...group, ...update } : group));
  const toggleInstrument = (instrument: string) => {
    setInstruments((current) => toggle(current, instrument));
    setInstrumentLevels((current) => current[instrument] ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== instrument)) : { ...current, [instrument]: 'debutant' });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profiles.length) { setStatus('error'); setMessage('Sélectionnez au moins un profil.'); return; }
    if (profiles.includes('musician') && (!instruments.length || !styles.length)) { setStatus('error'); setMessage('Sélectionnez au moins un instrument et un style pour le profil musicien.'); return; }
    if (profiles.includes('group') && groups.some((group) => !group.name || !group.styles.length || !group.requestedInstruments.length)) { setStatus('error'); setMessage('Complétez le nom, les styles et les musiciens recherchés de chaque groupe.'); return; }
    setStatus('loading'); setMessage('');
    const form = new FormData(event.currentTarget);
    const input: RegisterAccountInput = {
      email: String(form.get('email')), password: String(form.get('password')),
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 30, ville: String(form.get('city')) },
      musician: profiles.includes('musician') ? {
        status: String(form.get('memberStatus')) as 'amateur' | 'pro',
        instruments: instruments.map((instrument) => ({ instrument, niveau: instrumentLevels[instrument] })),
        styles, objective: [form.get('joinGroup') ? 'join_group' : '', form.get('foundGroup') ? 'found_group' : ''].filter(Boolean),
        availabilities: [{ jourSemaine: 'samedi', creneauxJournee: 'soir' }], bio: String(form.get('bio') || ''),
      } : undefined,
      groups: profiles.includes('group') ? groups.map((group) => ({ name: group.name, status: group.status, styles: group.styles, description: group.description, audioLinks: [], requestedInstruments: group.requestedInstruments.map((instrument) => ({ instrument, niveau: group.requestedLevels[instrument] ?? 'debutant' })) })) : [],
    };
    try { await registerAccount(input); setStatus('success'); setMessage('Compte et profils créés avec succès.'); setTimeout(onSuccess, 700); }
    catch (error) { setStatus('error'); setMessage(error instanceof Error ? error.message : 'Impossible de créer le compte.'); }
  };
  return <form className="auth-form" onSubmit={submit}>
    <fieldset><legend>Profils de ce compte</legend><label className="choice"><input type="checkbox" checked={profiles.includes('musician')} onChange={() => setProfiles((current) => current.includes('musician') ? current.filter((item) => item !== 'musician') : [...current, 'musician'])} /> Je suis musicien</label><label className="choice"><input type="checkbox" checked={profiles.includes('group')} onChange={() => setProfiles((current) => current.includes('group') ? current.filter((item) => item !== 'group') : [...current, 'group'])} /> J’administre un ou plusieurs groupes</label><small>Un seul compte peut porter plusieurs profils.</small></fieldset>
    <label>Email<input name="email" type="email" required autoComplete="email" /></label><label>Mot de passe<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label><label>Ville<input name="city" required defaultValue="Strasbourg" /></label>
    {profiles.includes('musician') && <fieldset><legend>Profil musicien</legend><label>Statut<select name="memberStatus"><option value="amateur">Amateur</option><option value="pro">Professionnel</option></select></label><span className="field-label">Instruments et niveaux</span><div className="choice-grid">{INSTRUMENTS.map((instrument) => <div className="choice" key={instrument}><label><input type="checkbox" checked={instruments.includes(instrument)} onChange={() => toggleInstrument(instrument)} />{instrument}</label>{instruments.includes(instrument) && <select aria-label={`Niveau ${instrument}`} value={instrumentLevels[instrument]} onChange={(event) => setInstrumentLevels((current) => ({ ...current, [instrument]: event.target.value }))}>{LEVELS.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select>}</div>)}</div><span className="field-label">Styles musicaux</span><div className="choice-grid">{STYLES.map((style) => <label className="choice" key={style}><input type="checkbox" checked={styles.includes(style)} onChange={() => setStyles((current) => toggle(current, style))} />{style}</label>)}</div><span className="field-label">Ce que je recherche</span><div className="choice-grid"><label className="choice"><input type="checkbox" name="joinGroup" />Rejoindre un groupe</label><label className="choice"><input type="checkbox" name="foundGroup" />Créer un autre groupe</label></div><label>Bio<textarea name="bio" rows={2} /></label></fieldset>}
    {profiles.includes('group') && <fieldset><legend>Groupes administrés</legend>{groups.map((group, index) => <div className="group-profile" key={index}><div className="group-heading"><h3>Groupe {index + 1}</h3>{groups.length > 1 && <button className="remove-group" type="button" onClick={() => setGroups((current) => current.filter((_, groupIndex) => groupIndex !== index))}>Supprimer</button>}</div><label>Nom du groupe<input value={group.name} onChange={(event) => updateGroup(index, { name: event.target.value })} required /></label><label>Statut<select value={group.status} onChange={(event) => updateGroup(index, { status: event.target.value as GroupDraft['status'] })}><option value="association">Association</option><option value="professionnel">Professionnel</option></select></label><span className="field-label">Styles musicaux</span><div className="choice-grid">{STYLES.map((style) => <label className="choice" key={style}><input type="checkbox" checked={group.styles.includes(style)} onChange={() => updateGroup(index, { styles: toggle(group.styles, style) })} />{style}</label>)}</div><span className="field-label">Musiciens recherchés</span><div className="chip-grid">{INSTRUMENTS.map((instrument) => <div className={`chip ${group.requestedInstruments.includes(instrument) ? 'selected' : ''}`} key={instrument}><label><input type="checkbox" checked={group.requestedInstruments.includes(instrument)} onChange={() => updateGroup(index, { requestedInstruments: toggle(group.requestedInstruments, instrument), requestedLevels: { ...group.requestedLevels, [instrument]: group.requestedLevels[instrument] ?? 'debutant' } })} />{instrument}</label>{group.requestedInstruments.includes(instrument) && <select aria-label={`Niveau demandé ${instrument}`} value={group.requestedLevels[instrument]} onChange={(event) => updateGroup(index, { requestedLevels: { ...group.requestedLevels, [instrument]: event.target.value } })}>{LEVELS.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select>}</div>)}</div><label>Description<textarea value={group.description} onChange={(event) => updateGroup(index, { description: event.target.value })} rows={2} /></label></div>)}<button className="button button-secondary" type="button" onClick={() => setGroups((current) => [...current, emptyGroup()])}>+ Ajouter un autre groupe</button></fieldset>}
    <button className="button button-primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Création…' : 'Créer mon compte'}</button>{message && <p className={`form-notice ${status === 'error' ? 'error' : ''}`} role="status">{message}</p>}
  </form>;
}

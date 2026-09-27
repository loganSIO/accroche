import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/client';
import { getMatches } from '../api/matches';
import { listPublicProfiles, type PublicGroupProfile, type PublicMusicianProfile } from '../api/publicProfiles';
import { getMusicianProfile } from '../api/users';
import type { Match } from '../types/match';

type MainTab = 'matches' | 'profiles';
type ProfileTab = 'groups' | 'musicians';
type ProfileSort = 'newest' | 'oldest';

interface DiscoverPageProps {
  isAuthenticated: boolean;
}

export function DiscoverPage({ isAuthenticated }: DiscoverPageProps) {
  const [activeTab, setActiveTab] = useState<MainTab>('matches');
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('groups');
  const [profileSort, setProfileSort] = useState<ProfileSort>('newest');
  const [cityFilter, setCityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [instrumentFilter, setInstrumentFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [musicians, setMusicians] = useState<PublicMusicianProfile[]>([]);
  const [groups, setGroups] = useState<PublicGroupProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(isAuthenticated);
  const [error, setError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profiles = await listPublicProfiles();
        setMusicians(profiles.musicians);
        setGroups(profiles.groups);
      } catch (cause: unknown) {
        setError(cause instanceof ApiError ? cause.message : 'Impossible de charger les profils.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setMatchesLoading(false);
      setMatches([]);
      return;
    }

    const loadMatches = async () => {
      try {
        const profile = await getMusicianProfile();
        setMatches(await getMatches(profile.id));
        setMatchesError(null);
      } catch (cause: unknown) {
        if (cause instanceof ApiError && cause.status === 404) {
          setMatchesError('Créez votre profil musicien pour recevoir des matchs.');
        } else {
          setMatchesError(cause instanceof Error ? cause.message : 'Impossible de charger vos matchs.');
        }
      } finally {
        setMatchesLoading(false);
      }
    };
    void loadMatches();
  }, [isAuthenticated]);

  const cities = useMemo(() => [...new Set([...groups.map((group) => group.city), ...musicians.map((musician) => musician.city)])].sort(), [groups, musicians]);
  const groupInstruments = useMemo(() => [...new Set(groups.flatMap((group) => group.requestedInstruments.map((item) => item.instrument)))].sort(), [groups]);
  const musicianInstruments = useMemo(() => [...new Set(musicians.flatMap((musician) => musician.instruments.map((item) => item.instrument)))].sort(), [musicians]);
  const groupStyles = useMemo(() => [...new Set(groups.flatMap((group) => group.styles))].sort(), [groups]);
  const musicianStyles = useMemo(() => [...new Set(musicians.flatMap((musician) => musician.styles))].sort(), [musicians]);

  const filteredGroups = useMemo(() => groups
    .filter((group) => (!cityFilter || group.city === cityFilter)
      && (!statusFilter || group.status === statusFilter)
      && (!instrumentFilter || group.requestedInstruments.some((item) => item.instrument === instrumentFilter))
      && (!styleFilter || group.styles.includes(styleFilter)))
    .sort((a, b) => profileSort === 'newest'
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt)), [groups, cityFilter, statusFilter, instrumentFilter, styleFilter, profileSort]);

  const filteredMusicians = useMemo(() => musicians
    .filter((musician) => (!cityFilter || musician.city === cityFilter)
      && (!statusFilter || musician.status === statusFilter)
      && (!instrumentFilter || musician.instruments.some((item) => item.instrument === instrumentFilter))
      && (!styleFilter || musician.styles.includes(styleFilter)))
    .sort((a, b) => profileSort === 'newest'
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt)), [musicians, cityFilter, statusFilter, instrumentFilter, styleFilter, profileSort]);

  const resetFilters = () => {
    setCityFilter('');
    setStatusFilter('');
    setInstrumentFilter('');
    setStyleFilter('');
  };

  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">Explorer</span>
        <h1>Découvrez les profils</h1>
        <p className="page-intro">Consultez vos matchs, puis explorez les musiciens et groupes publics.</p>
      </header>

      <section className="surface-card discovery-card">
        <div className="profile-tabs discovery-tabs" role="tablist" aria-label="Découvrir">
          <button type="button" role="tab" aria-selected={activeTab === 'matches'} className={activeTab === 'matches' ? 'profile-tab active' : 'profile-tab'} onClick={() => setActiveTab('matches')}>Mes matchs</button>
          <button type="button" role="tab" aria-selected={activeTab === 'profiles'} className={activeTab === 'profiles' ? 'profile-tab active' : 'profile-tab'} onClick={() => setActiveTab('profiles')}>Explorer les profils</button>
        </div>

        {activeTab === 'matches' && (
          <div className="discovery-panel" aria-live="polite">
            <div className="discovery-heading">
              <div><h2>Vos matchs</h2><p className="form-hint">Les compatibilités calculées à partir de votre profil musicien.</p></div>
              {isAuthenticated && !matchesLoading && !matchesError && <strong>{matches.length} match{matches.length > 1 ? 's' : ''}</strong>}
            </div>
            {!isAuthenticated && <p className="form-hint">Connectez-vous pour consulter vos matchs personnalisés.</p>}
            {matchesLoading && <p className="form-hint">Chargement de vos matchs…</p>}
            {matchesError && <p className="form-notice error" role="alert">{matchesError}</p>}
            {!matchesLoading && !matchesError && isAuthenticated && matches.length === 0 && <p className="form-hint">Aucun match pour le moment.</p>}
            {!matchesLoading && !matchesError && matches.length > 0 && (
              <div className="match-discovery-grid">
                {matches.map((match) => (
                  <article className="public-profile-card" key={match.positionId}>
                    <span className="eyebrow">Poste compatible</span>
                    <h3>{Math.round(match.scoreGlobal)} % de compatibilité</h3>
                    <p>Statut : {match.statut}</p>
                    <div className="tag-list">
                      <span className="tag">Instrument {Math.round(match.sousScores.instrument)} %</span>
                      <span className="tag">Style {Math.round(match.sousScores.style)} %</span>
                      <span className="tag">Zone {Math.round(match.sousScores.zone)} %</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="discovery-panel" aria-live="polite">
            <div className="profile-tabs" role="tablist" aria-label="Type de profil">
              <button type="button" role="tab" aria-selected={activeProfileTab === 'groups'} className={activeProfileTab === 'groups' ? 'profile-tab active' : 'profile-tab'} onClick={() => setActiveProfileTab('groups')}>Groupes ({groups.length})</button>
              <button type="button" role="tab" aria-selected={activeProfileTab === 'musicians'} className={activeProfileTab === 'musicians' ? 'profile-tab active' : 'profile-tab'} onClick={() => setActiveProfileTab('musicians')}>Musiciens ({musicians.length})</button>
            </div>
            {isLoading && <p className="form-hint">Chargement des profils…</p>}
            {error && <p className="form-notice error" role="alert">{error}</p>}
            {!isLoading && !error && (
              <>
                <label className="discovery-sort">Trier par
                  <select value={profileSort} onChange={(event) => setProfileSort(event.target.value as ProfileSort)}>
                    <option value="newest">Plus récente → plus ancienne</option>
                    <option value="oldest">Plus ancienne → plus récente</option>
                  </select>
                </label>
                    <div className="discovery-filters">
                      <label>Ville<select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}><option value="">Toutes les villes</option>{cities.map((city) => <option value={city} key={city}>{city}</option>)}</select></label>
                      <label>Statut<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">Tous les statuts</option>{activeProfileTab === 'groups' ? <><option value="association">Association</option><option value="professionnel">Professionnel</option></> : <><option value="amateur">Amateur</option><option value="pro">Professionnel</option></>}</select></label>
                      <label>{activeProfileTab === 'groups' ? 'Instrument recherché' : 'Instrument joué'}<select value={instrumentFilter} onChange={(event) => setInstrumentFilter(event.target.value)}><option value="">Tous les instruments</option>{(activeProfileTab === 'groups' ? groupInstruments : musicianInstruments).map((instrument) => <option value={instrument} key={instrument}>{instrument}</option>)}</select></label>
                      <label>Style<select value={styleFilter} onChange={(event) => setStyleFilter(event.target.value)}><option value="">Tous les styles</option>{(activeProfileTab === 'groups' ? groupStyles : musicianStyles).map((style) => <option value={style} key={style}>{style}</option>)}</select></label>
                      <button type="button" className="button button-secondary" onClick={resetFilters}>Réinitialiser</button>
                    </div>
                    {activeProfileTab === 'groups' ? <ProfileGroups groups={filteredGroups} /> : <ProfileMusicians musicians={filteredMusicians} />}
                  </>
            )}
          </div>
        )}
      </section>

    </>
  );
}

function ProfileGroups({ groups }: { groups: PublicGroupProfile[] }) {
  if (!groups.length) return <p className="form-hint">Aucun groupe public n’est disponible.</p>;
  return <div className="public-profile-grid">{groups.map((group) => <article className="public-profile-card" key={group.id}><span className="eyebrow">Groupe · {group.city}</span><h3>{group.name}</h3><p>{group.description || 'Aucune présentation renseignée.'}</p><div className="tag-list">{group.styles.map((style) => <span className="tag" key={style}>{style}</span>)}</div><strong>Postes ouverts</strong><p>{group.requestedInstruments.map((item) => `${item.instrument} (${item.niveau})`).join(' · ') || 'Aucun poste ouvert'}</p></article>)}</div>;
}

function ProfileMusicians({ musicians }: { musicians: PublicMusicianProfile[] }) {
  if (!musicians.length) return <p className="form-hint">Aucun musicien public n’est disponible.</p>;
  return <div className="public-profile-grid">{musicians.map((musician) => <article className="public-profile-card" key={musician.id}><span className="eyebrow">Musicien · {musician.city}</span><h3>{musician.musicianName || 'Musicien'}</h3><p>{musician.bio || 'Aucune présentation renseignée.'}</p><div className="tag-list">{musician.styles.map((style) => <span className="tag" key={style}>{style}</span>)}</div><strong>Instruments</strong><p>{musician.instruments.map((item) => `${item.instrument} (${item.niveau})`).join(' · ') || 'Non renseigné'}</p></article>)}</div>;
}

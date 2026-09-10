import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { getMapClusters, type MapCluster } from '../api/map';

export function DiscoverPage() {
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMapClusters()
      .then(setClusters)
      .catch((cause: unknown) => {
        setError(cause instanceof ApiError ? cause.message : 'Impossible de charger les profils.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <header className="page-heading">
        <span className="eyebrow">Explorer</span>
        <h1>Découvrez les profils</h1>
        <p className="page-intro">
          Explorez les zones où des musiciens et des groupes sont déjà présents.
        </p>
      </header>

      <section className="surface-card discovery-card" aria-live="polite">
        <div className="discovery-heading">
          <div>
            <h2>Communautés actives</h2>
            <p className="form-hint">
              Les données actuellement disponibles sont regroupées par ville pour préserver
              la confidentialité des positions.
            </p>
          </div>
          {!isLoading && !error && <strong>{clusters.length} zone{clusters.length > 1 ? 's' : ''}</strong>}
        </div>

        {isLoading && <p className="form-hint">Chargement des zones actives…</p>}
        {error && <p className="form-notice error" role="alert">{error}</p>}
        {!isLoading && !error && clusters.length === 0 && (
          <p className="form-hint">Aucune zone active n’est encore disponible.</p>
        )}
        {!isLoading && !error && clusters.length > 0 && (
          <div className="discovery-grid">
            {clusters.map((cluster) => (
              <article className="discovery-zone" key={cluster.ville}>
                <div className="discovery-zone-heading">
                  <h3>{cluster.ville}</h3>
                  <span className="tag">Zone active</span>
                </div>
                <div className="discovery-counts">
                  <span><strong>{cluster.musicianCount}</strong> musicien{cluster.musicianCount > 1 ? 's' : ''}</span>
                  <span><strong>{cluster.groupCount}</strong> groupe{cluster.groupCount > 1 ? 's' : ''}</span>
                </div>
                <p className="form-hint">
                  Centre de zone : {cluster.latitude.toFixed(2)}, {cluster.longitude.toFixed(2)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="discovery-note" aria-label="Limitation actuelle">
        <strong>À savoir</strong>
        <p>
          Le backend actuel expose les profils individuels uniquement lorsque leur identifiant
          est connu. Il ne fournit pas encore de liste publique permettant d’afficher chaque
          fiche, ses instruments ou ses styles. Cette page utilise donc uniquement la route
          publique <code>GET /api/v1/map</code>, sans inventer de profils.
        </p>
      </section>
    </>
  );
}

import type { AppRoute } from '../App';
import { MapPanel } from '../components/map/MapPanel';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  onAuth: (mode: 'login' | 'register') => void;
  isAuthenticated: boolean;
}

export function HomePage({ onNavigate, onAuth, isAuthenticated }: HomePageProps) {
  return (
    <section className="hero">
      <div>
        <span className="eyebrow">Trouver votre prochaine scène</span>
        <h1>La bonne rencontre musicale commence ici.</h1>
        <p>Accroche met en relation les musiciens et les groupes grâce à des correspondances expliquées.</p>
        <div className="hero-actions">
          <button className="button button-primary" onClick={() => onNavigate('/discover')}>
            Découvrir les profils
          </button>
          {!isAuthenticated && (
            <button className="button button-secondary" onClick={() => onAuth('register')}>
              Créer un compte
            </button>
          )}
        </div>
      </div>
      <MapPanel />
    </section>
  );
}

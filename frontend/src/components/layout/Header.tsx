import type { AppRoute } from '../../App';
interface HeaderProps { currentRoute: AppRoute; onNavigate: (route: AppRoute) => void; onAuth: (mode: 'login' | 'register') => void; }
export function Header({ currentRoute, onNavigate, onAuth }: HeaderProps) {
  const links: Array<{ route: AppRoute; label: string }> = [{ route: '/', label: 'Accueil' }, { route: '/discover', label: 'Découvrir' }, { route: '/messages', label: 'Messagerie' }];
  return <header className="site-header"><div className="header-inner">
    <button className="brand" onClick={() => onNavigate('/')} aria-label="Retour à l'accueil">Accroche</button>
    <nav className="main-nav" aria-label="Navigation principale">{links.map((link) => <button key={link.route} className={`nav-link ${currentRoute === link.route ? 'active' : ''}`} onClick={() => onNavigate(link.route)}>{link.label}</button>)}</nav>
    <div className="header-actions"><button className="button button-secondary" onClick={() => onAuth('login')}>Se connecter</button><button className="button button-primary" onClick={() => onAuth('register')}>S'inscrire</button></div>
  </div></header>;
}

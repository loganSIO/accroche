import { useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { AuthModal } from './components/layout/AuthModal';
import { DiscoverPage } from './pages/DiscoverPage';
import { HomePage } from './pages/HomePage';
import { MessagingPage } from './pages/MessagingPage';
import { ProfilePage } from './pages/ProfilePage';
import { GroupRequestPage } from './pages/GroupRequestPage';
import { useAuth } from './hooks/useAuth';
import './styles/app.css';

export type AppRoute = '/' | '/discover' | '/messages' | '/profile' | '/group-request';

function routeFromLocation(): AppRoute {
  if (window.location.pathname === '/discover') return '/discover';
  if (window.location.pathname === '/messages') return '/messages';
  if (window.location.pathname === '/profile') return '/profile';
  if (window.location.pathname === '/group-request') return '/group-request';
  return '/';
}

function App() {
  const [route, setRoute] = useState<AppRoute>(routeFromLocation);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const auth = useAuth();

  useEffect(() => {
    const handlePopState = () => setRoute(routeFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextRoute: AppRoute) => {
    window.history.pushState({}, '', nextRoute);
    setRoute(nextRoute);
  };

  return (
    <div className="app-shell">
      <Header currentRoute={route} onNavigate={navigate} onAuth={setAuthMode} isAuthenticated={auth.isAuthenticated} onSignOut={auth.signOut} />
      <main className="page-content">
        {route === '/' && <HomePage onNavigate={navigate} onAuth={setAuthMode} isAuthenticated={auth.isAuthenticated} />}
        {route === '/discover' && <DiscoverPage />}
        {route === '/messages' && <MessagingPage />}
        {route === '/profile' && (auth.isAuthenticated ? <ProfilePage /> : <HomePage onNavigate={navigate} onAuth={setAuthMode} isAuthenticated={auth.isAuthenticated} />)}
        {route === '/group-request' && (auth.isAuthenticated ? <GroupRequestPage onNavigate={navigate} /> : <HomePage onNavigate={navigate} onAuth={setAuthMode} isAuthenticated={auth.isAuthenticated} />)}
      </main>
      <Footer />
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={setAuthMode} onAuthenticated={(userId) => { auth.signIn(userId); setAuthMode(null); navigate('/profile'); }} />}
    </div>
  );
}

export default App;

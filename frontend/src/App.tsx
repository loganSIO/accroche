import { useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { AuthModal } from './components/layout/AuthModal';
import { DiscoverPage } from './pages/DiscoverPage';
import { HomePage } from './pages/HomePage';
import { MessagingPage } from './pages/MessagingPage';
import './styles/app.css';

export type AppRoute = '/' | '/discover' | '/messages';

function routeFromLocation(): AppRoute {
  if (window.location.pathname === '/discover') return '/discover';
  if (window.location.pathname === '/messages') return '/messages';
  return '/';
}

function App() {
  const [route, setRoute] = useState<AppRoute>(routeFromLocation);
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);

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
      <Header currentRoute={route} onNavigate={navigate} onAuth={setAuthMode} />
      <main className="page-content">
        {route === '/' && <HomePage onNavigate={navigate} onAuth={setAuthMode} />}
        {route === '/discover' && <DiscoverPage />}
        {route === '/messages' && <MessagingPage />}
      </main>
      <Footer />
      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onModeChange={setAuthMode} />}
    </div>
  );
}

export default App;

import { useEffect, useState } from 'react';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
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
      <Header currentRoute={route} onNavigate={navigate} />
      <main className="page-content">
        {route === '/' && <HomePage onNavigate={navigate} />}
        {route === '/discover' && <DiscoverPage />}
        {route === '/messages' && <MessagingPage />}
      </main>
      <Footer />
    </div>
  );
}

export default App;

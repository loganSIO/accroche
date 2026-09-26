import { LoginForm } from '../profile/LoginForm';
import { RegisterForm } from '../profile/RegisterForm';
import type { AuthSession } from '../../api/client';

interface AuthModalProps { mode: 'login' | 'register'; onClose: () => void; onModeChange: (mode: 'login' | 'register') => void; onAuthenticated: (session: AuthSession) => void; }
export function AuthModal({ mode, onClose, onModeChange, onAuthenticated }: AuthModalProps) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close" onClick={onClose} aria-label="Fermer">×</button>
      <h2 id="auth-title">{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>
      {mode === 'login' ? <LoginForm onAuthenticated={onAuthenticated} /> : <RegisterForm onSuccess={onAuthenticated} />}
      <button className="text-button" onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà inscrit ? Se connecter'}
      </button>
    </section>
  </div>;
}

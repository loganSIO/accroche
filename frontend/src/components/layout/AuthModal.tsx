interface AuthModalProps { mode: 'login' | 'register'; onClose?: () => void; }
export function AuthModal({ mode, onClose }: AuthModalProps) { return <section aria-label={mode === 'login' ? 'Connexion' : 'Inscription'}><h2>{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</h2>{onClose && <button onClick={onClose}>Fermer</button>}</section>; }

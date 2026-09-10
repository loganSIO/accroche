import { useState } from 'react';
import { authenticateLocalAccount } from '../../api/localAuth';

export function LoginForm({ onAuthenticated }: { onAuthenticated: (userId: string) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  return <form className="auth-form" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const userId = authenticateLocalAccount(String(form.get('email')), String(form.get('password')));
    if (!userId) {
      setError('Compte introuvable dans ce navigateur. Créez d’abord un compte depuis ce formulaire.');
      return;
    }
    setSubmitted(true);
    onAuthenticated(userId);
  }}>
    <label>Email<input name="email" type="email" required autoComplete="email" /></label>
    <label>Mot de passe<input name="password" type="password" required minLength={8} autoComplete="current-password" /></label>
    <button className="button button-primary" type="submit">Se connecter</button>
    {submitted && <p className="form-notice">Connexion réussie.</p>}
    {error && <p className="form-notice error" role="alert">{error}</p>}
  </form>;
}

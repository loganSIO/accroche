import { useState } from 'react';
import { login } from '../../api/auth';
import type { AuthSession } from '../../api/client';

export function LoginForm({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  return <form className="auth-form" onSubmit={(event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError('');
    void login(String(form.get('email')), String(form.get('password'))).then((session) => {
      setSubmitted(true);
      onAuthenticated(session);
    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Connexion impossible.'));
  }}>
    <label>Email<input name="email" type="email" required autoComplete="email" /></label>
    <label>Mot de passe<input name="password" type="password" required minLength={8} autoComplete="current-password" /></label>
    <button className="button button-primary" type="submit">Se connecter</button>
    {submitted && <p className="form-notice">Connexion réussie.</p>}
    {error && <p className="form-notice error" role="alert">{error}</p>}
  </form>;
}

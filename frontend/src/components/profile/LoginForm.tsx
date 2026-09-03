import { useState } from 'react';
export function LoginForm() {
  const [submitted, setSubmitted] = useState(false);
  return <form className="auth-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
    <label>Email<input type="email" required autoComplete="email" /></label>
    <label>Mot de passe<input type="password" required minLength={8} autoComplete="current-password" /></label>
    <button className="button button-primary" type="submit">Se connecter</button>
    {submitted && <p className="form-notice">La connexion sera activée dès que l’endpoint d’authentification backend sera disponible.</p>}
  </form>;
}

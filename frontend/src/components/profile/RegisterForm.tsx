import { useState, type FormEvent } from 'react';
import { registerAccount, type RegisterAccountInput } from '../../api/users';
import { login } from '../../api/auth';
import type { AuthSession } from '../../api/client';

export function RegisterForm({ onSuccess }: { onSuccess: (session: AuthSession) => void }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    const form = new FormData(event.currentTarget);
    const input: RegisterAccountInput = {
      email: String(form.get('email')),
      password: String(form.get('password')),
      // The current API still requires a zone although it is no longer part of signup UX.
      zone: { latitude: 48.5734, longitude: 7.7521, rayonKm: 30, ville: 'Strasbourg' },
      groups: [],
    };

    const email = String(form.get('email'));
    const password = String(form.get('password'));
    try {
      await registerAccount(input);
      const session = await login(email, password);
      setStatus('success');
      setMessage('Compte créé. Vous êtes maintenant connecté.');
      setTimeout(() => onSuccess(session), 700);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Impossible de créer le compte.');
    }
  };

  return <form className="auth-form" onSubmit={submit}>
    <p className="form-hint">Votre profil musicien et vos groupes pourront être renseignés après la connexion.</p>
    <label>Email<input name="email" type="email" required autoComplete="email" /></label>
    <label>Mot de passe<input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
    <button className="button button-primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Création…' : 'Créer mon compte'}</button>
    {message && <p className={`form-notice ${status === 'error' ? 'error' : ''}`} role="status">{message}</p>}
  </form>;
}

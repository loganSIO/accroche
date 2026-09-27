import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Message } from '../../types/message';
import type { PublicGroupProfile, PublicMusicianProfile } from '../../api/publicProfiles';

interface ChatPanelProps {
  messages: Message[];
  currentUserId: string;
  isSending: boolean;
  onSend: (content: string) => Promise<void>;
  profile: PublicGroupProfile | PublicMusicianProfile | null;
  onViewProfile: () => void;
}

export function ChatPanel({ messages, currentUserId, isSending, onSend, profile, onViewProfile }: ChatPanelProps) {
  const [content, setContent] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = content.trim();
    if (!value || isSending) return;
    await onSend(value);
    setContent('');
  };
  return <section className="surface-card chat-panel">
    <div className="chat-heading"><h2>Discussion</h2><button type="button" className="button button-secondary" onClick={onViewProfile}>Voir le profil</button></div>
    <div className="message-list" aria-live="polite">
      {!messages.length && <p className="form-hint">Aucun message. Commencez la discussion.</p>}
      {messages.map((message) => <div key={message.id} className={message.senderId === currentUserId ? 'message outgoing' : 'message'}>
        <p>{message.content}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleDateString('fr-FR')} {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
      </div>)}
    </div>
    <form className="message-form" onSubmit={submit}>
      <label htmlFor="message-content">Votre message</label>
      <textarea id="message-content" value={content} maxLength={5000} onChange={(event) => setContent(event.target.value)} placeholder="Écrivez votre message…" />
      <button type="submit" className="button button-primary" disabled={!content.trim() || isSending}>{isSending ? 'Envoi…' : 'Envoyer'}</button>
    </form>
    {profile && <div className="profile-modal-backdrop" role="presentation" onClick={onViewProfile}>
      <article className="profile-modal surface-card" role="dialog" aria-modal="true" aria-label="Profil du contact" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onViewProfile} aria-label="Fermer">×</button>
        <span className="eyebrow">{profile.type === 'group' ? 'Groupe' : 'Musicien'} · {profile.city}</span>
        <h2>{profile.type === 'group' ? profile.name : (profile.musicianName || 'Musicien')}</h2>
        <p>{profile.type === 'group' ? (profile.description || 'Aucune présentation renseignée.') : (profile.bio || 'Aucune présentation renseignée.')}</p>
        <div className="tag-list">{profile.styles.map((style) => <span className="tag" key={style}>{style}</span>)}</div>
        {profile.type === 'group' ? <><strong>Postes ouverts</strong><p>{profile.requestedInstruments.map((item) => `${item.instrument} (${item.niveau})`).join(' · ') || 'Aucun poste ouvert'}</p></> : <><strong>Instruments</strong><p>{profile.instruments.map((item) => `${item.instrument} (${item.niveau})`).join(' · ') || 'Non renseigné'}</p></>}
      </article>
    </div>}
  </section>;
}

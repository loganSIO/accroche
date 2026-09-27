import { useEffect, useState } from 'react';
import { ApiError, readSession } from '../api/client';
import { deleteConversation, listConversations, listMessages, sendMessage } from '../api/messaging';
import { getPublicGroup, getPublicMusician } from '../api/publicProfiles';
import type { PublicGroupProfile, PublicMusicianProfile } from '../api/publicProfiles';
import type { Conversation, Message } from '../types/message';
import { ChatPanel } from '../components/messaging/ChatPanel';
import { ConversationList } from '../components/messaging/ConversationList';

export function MessagingPage({ isAuthenticated }: { isAuthenticated: boolean }) {
  const userId = readSession()?.userId ?? '';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [profile, setProfile] = useState<PublicGroupProfile | PublicMusicianProfile | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const initialConversationId = new URLSearchParams(window.location.search).get('conversation');

  useEffect(() => {
    if (!isAuthenticated) return;
    void listConversations().then((items) => {
      setConversations(items);
      setSelectedId(initialConversationId && items.some((item) => item.id === initialConversationId) ? initialConversationId : items[0]?.id ?? null);
    }).catch((cause: unknown) => setError(cause instanceof ApiError ? cause.message : 'Impossible de charger vos conversations.'));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    void listMessages(selectedId).then((items) => {
      setMessages(items);
      setConversations((current) => current.map((conversation) => conversation.id === selectedId
        ? { ...conversation, members: conversation.members.map((member) => member.userId === userId ? { ...member, lastReadAt: new Date().toISOString() } : member) }
        : conversation));
    }).catch((cause: unknown) => setError(cause instanceof ApiError ? cause.message : 'Impossible de charger les messages.'));
  }, [selectedId]);

  useEffect(() => {
    const conversation = conversations.find((item) => item.id === selectedId);
    if (!conversation) { setProfile(null); setIsProfileOpen(false); return; }
    const participant = conversation.members.find((member) => member.userId !== userId);
    const loadProfile = conversation.groupProfile
      ? getPublicGroup(conversation.groupProfile.id)
      : participant?.user.musicianProfile
        ? getPublicMusician(participant.user.musicianProfile.id)
        : Promise.resolve(null);
    void loadProfile.then(setProfile).catch((cause: unknown) => setError(cause instanceof ApiError ? cause.message : 'Impossible de charger le profil.'));
  }, [conversations, selectedId, userId]);

  const send = async (content: string) => {
    if (!selectedId) return;
    setIsSending(true);
    try {
      const message = await sendMessage(selectedId, content);
      setMessages((current) => [...current, message]);
      setConversations((current) => current.map((conversation) => conversation.id === selectedId ? {
        ...conversation,
        updatedAt: message.createdAt,
        messages: [message],
        members: conversation.members.map((member) => member.userId === userId ? { ...member, lastReadAt: message.createdAt } : member),
      } : conversation));
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : 'Impossible d’envoyer le message.');
    } finally { setIsSending(false); }
  };

  const removeConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
      setConversations(remaining);
      if (selectedId === conversationId) setSelectedId(remaining[0]?.id ?? null);
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : 'Impossible de supprimer la conversation.');
    }
  };

  const groupConversations = conversations.filter((conversation) => conversation.groupProfile);
  const musicianConversations = conversations.filter((conversation) => !conversation.groupProfile);

  return <><header className="page-heading"><span className="eyebrow">Échanges</span><h1>Messagerie</h1><p className="page-intro">Centralisez vos échanges avec les profils qui vous intéressent.</p></header>
    {!isAuthenticated ? <p className="form-notice error">Connectez-vous pour accéder à votre messagerie.</p> : <>{error && <p className="form-notice error" role="alert">{error}</p>}<div className="messaging-layout"><section className="surface-card conversation-list"><h2>Conversations</h2><h3 className="conversation-section-title">Groupes</h3><ConversationList conversations={groupConversations} selectedId={selectedId} currentUserId={userId} onSelect={(id) => { setSelectedId(id); setIsProfileOpen(false); }} onDelete={(id) => void removeConversation(id)} /><h3 className="conversation-section-title">Musiciens</h3><ConversationList conversations={musicianConversations} selectedId={selectedId} currentUserId={userId} onSelect={(id) => { setSelectedId(id); setIsProfileOpen(false); }} onDelete={(id) => void removeConversation(id)} /></section>{selectedId ? <ChatPanel messages={messages} currentUserId={userId} isSending={isSending} onSend={send} profile={isProfileOpen ? profile : null} onViewProfile={() => setIsProfileOpen((open) => !open)} /> : <section className="surface-card chat-panel"><h2>Discussion</h2><p className="form-hint">Sélectionnez une conversation pour commencer.</p></section>}</div></>}
  </>;
}

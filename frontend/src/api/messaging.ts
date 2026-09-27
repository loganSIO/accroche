import { request } from './client';
import type { Contact, Conversation, Message } from '../types/message';

export const contactMatch = (matchId: string) =>
  request<Contact & { conversationId: string }>(`/matches/${encodeURIComponent(matchId)}/contact`, { method: 'POST' });
export const contactProfile = (type: 'musician' | 'group', profileId: string) =>
  request<{ conversationId: string }>(`/profiles/${type}/${encodeURIComponent(profileId)}/contact`, { method: 'POST' });

export const listContacts = () => request<Contact[]>('/users/me/contacts');
export const listConversations = () => request<Conversation[]>('/conversations');
export const deleteConversation = (conversationId: string) =>
  request<{ success: boolean }>(`/conversations/${encodeURIComponent(conversationId)}`, { method: 'DELETE' });
export const listMessages = (conversationId: string) =>
  request<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
export const sendMessage = (conversationId: string, content: string) =>
  request<Message>(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

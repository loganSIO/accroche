import { request } from './client';
import type { Conversation, Message } from '../types/message';
export const getConversations = () => request<Conversation[]>('/conversations');
export const getMessages = (conversationId: string) => request<Message[]>(`/conversations/${encodeURIComponent(conversationId)}/messages`);
export const sendMessage = (conversationId: string, content: string) => request<Message>(`/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', body: JSON.stringify({ content }) });

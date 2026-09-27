export interface ConversationMember {
  userId: string;
  user: { id: string; email: string; musicianProfile?: { id: string; musicianName: string } | null; groupProfiles?: { id: string; name: string }[] };
  lastReadAt: string | null;
}
export interface Conversation {
  id: string;
  groupProfile?: { id: string; name: string } | null;
  updatedAt: string;
  members: ConversationMember[];
  messages: Message[];
}
export interface Message { id: string; conversationId: string; senderId: string; content: string; createdAt: string; }
export interface Contact {
  id: string;
  conversationId: string;
  musician: { id: string; musicianName: string };
  match: { id: string; positionId: string; scoreGlobal: number };
}

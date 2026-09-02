export interface Conversation { id: string; participantName: string; lastMessage?: string; updatedAt: string; }
export interface Message { id: string; conversationId: string; senderId: string; content: string; createdAt: string; }

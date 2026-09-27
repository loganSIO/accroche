import type { Conversation } from '../../types/message';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, currentUserId, onSelect, onDelete }: ConversationListProps) {
  return <section className="surface-card conversation-list">
    <h2>Conversations</h2>
    {!conversations.length && <p className="form-hint">Vos conversations apparaîtront ici.</p>}
    <div className="conversation-items">
      {conversations.map((conversation) => {
        const participant = conversation.members.find((member) => member.userId !== currentUserId)?.user;
        const lastMessage = conversation.messages[0];
        const participantName = conversation.groupProfile?.name || participant?.musicianProfile?.musicianName || participant?.groupProfiles?.[0]?.name || 'Musicien';
        const currentMember = conversation.members.find((member) => member.userId === currentUserId);
        const hasUnreadMessages = Boolean(lastMessage && lastMessage.senderId !== currentUserId && (!currentMember?.lastReadAt || new Date(lastMessage.createdAt) > new Date(currentMember.lastReadAt)));
        return <div className={`${selectedId === conversation.id ? 'conversation-item active' : 'conversation-item'}${hasUnreadMessages ? ' unread' : ''}`} key={conversation.id}>
          <button type="button" className="conversation-select" onClick={() => onSelect(conversation.id)}>
            <strong>{participantName}</strong>
            <span>{lastMessage?.content ?? 'Aucun message'}</span>
          </button>
          {hasUnreadMessages && <span className="unread-indicator" aria-label="Nouveaux messages">Nouveau</span>}
          <button type="button" className="conversation-delete" onClick={() => onDelete(conversation.id)} aria-label={`Supprimer la conversation avec ${participantName}`}>Supprimer</button>
        </div>;
      })}
    </div>
  </section>;
}

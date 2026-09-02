import { ChatPanel } from '../components/messaging/ChatPanel';
import { ConversationList } from '../components/messaging/ConversationList';
export function MessagingPage() { return <><header className="page-heading"><span className="eyebrow">Échanges</span><h1>Messagerie</h1><p className="page-intro">Centralisez vos échanges avec les profils qui vous intéressent.</p></header><div className="page-grid"><ConversationList /><ChatPanel /></div></>; }

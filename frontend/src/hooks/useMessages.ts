import { useEffect, useState } from 'react';
import { getConversations } from '../api/messages';
import type { Conversation } from '../types/message';

export function useMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    getConversations().then(setConversations).catch(setError).finally(() => setIsLoading(false));
  }, []);
  return { conversations, error, isLoading };
}

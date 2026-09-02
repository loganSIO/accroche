import { request } from './client';
export interface Contact { id: string; matchId: string; musicianId: string; initiatedBy: string; createdAt: string; }
export const createContact = (input: Pick<Contact, 'matchId' | 'musicianId' | 'initiatedBy'>) => request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(input) });

import type { MusicianCandidate } from '../../domain/entities/musician.entity.js';

export interface CreateMusicianInput {
  email: string;
  password: string;
  city: string;
  status: 'amateur' | 'pro';
  bio?: string;
  instruments: { instrument: string; niveau: string }[];
  styles: string[];
  availabilities: { jourSemaine: string; creneauxJournee: string }[];
  zone: { latitude: number; longitude: number; rayonKm: number; ville: string };
}

export interface MusicianRepository {
  findById(id: string): Promise<MusicianCandidate | null>;

  // Crée le User, la Zone et le MusicianProfile associés en une seule
  // opération cohérente — le détail transactionnel reste un choix
  // d'implémentation (infrastructure), pas une préoccupation du port.
  create(input: CreateMusicianInput): Promise<MusicianCandidate>;
}
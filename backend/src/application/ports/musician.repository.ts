import type { MusicianCandidate, Zone } from '../../domain/entities/musician.entity.js';

export interface CreateMusicianInput {
  email: string;
  password: string;
  city: string;
  status: 'amateur' | 'pro';
  musicianName?: string;
  bio?: string;
  objective?: string[];
  instruments: { instrument: string; niveau: string }[];
  styles: string[];
  availabilities: { jourSemaine: string; creneauxJournee: string }[];
  zone: { latitude: number; longitude: number; rayonKm: number; ville: string };
  showcaseGroups?: { name: string; city: string; position: string; status: 'association' | 'professionnel'; description: string }[];
}

export interface MusicianRepository {
  findById(id: string): Promise<MusicianCandidate | null>;

  // Musiciens dont la zone recoupe potentiellement celle du poste — même
  // logique de filtrage géographique que findOpenPositionsNearZone côté
  // OpenPositionRepository. Le filtrage précis reste un détail
  // d'implémentation (infrastructure), pas une préoccupation du port.
  findNearZone(zone: Zone): Promise<MusicianCandidate[]>;

  // Crée le User, la Zone et le MusicianProfile associés en une seule
  // opération cohérente — le détail transactionnel reste un choix
  // d'implémentation (infrastructure), pas une préoccupation du port.
  create(input: CreateMusicianInput): Promise<MusicianCandidate>;
}
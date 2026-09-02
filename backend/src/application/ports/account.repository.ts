export interface RegisterAccountInput {
  email: string;
  password: string;
  zone: { latitude: number; longitude: number; rayonKm: number; ville: string };
  musician?: {
    status: 'amateur' | 'pro';
    instruments: { instrument: string; niveau: string }[];
    styles: string[];
    objective: string[];
    availabilities: { jourSemaine: string; creneauxJournee: string }[];
    bio?: string;
  };
  groups: {
    name: string;
    styles: string[];
    status: 'association' | 'professionnel';
    description?: string;
    audioLinks: string[];
    requestedInstruments: { instrument: string; niveau: string }[];
  }[];
}

import type { Match } from '../../types/match';
import { MatchCard } from './MatchCard';
export function MatchList({ matches }: { matches: Match[] }) { return <section><h2>Correspondances</h2>{matches.length === 0 ? <p>Aucune correspondance pour le moment.</p> : matches.map((match) => <MatchCard key={match.id ?? match.positionId} match={match} />)}</section>; }

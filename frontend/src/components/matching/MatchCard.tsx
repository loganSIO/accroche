import type { Match } from '../../types/match';
export function MatchCard({ match }: { match: Match }) { return <article className="surface-card"><strong>{Math.round(match.scoreGlobal)} %</strong><span> — {match.statut}</span></article>; }

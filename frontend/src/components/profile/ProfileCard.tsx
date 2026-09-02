interface ProfileCardProps { name: string; description: string; }
export function ProfileCard({ name, description }: ProfileCardProps) { return <article className="surface-card"><h2>{name}</h2><p>{description}</p></article>; }

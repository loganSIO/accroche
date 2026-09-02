export interface UserMarkerProps { label: string; city: string; }
export function UserMarker({ label, city }: UserMarkerProps) { return <span title={`${label} - ${city}`}>📍 {label}</span>; }

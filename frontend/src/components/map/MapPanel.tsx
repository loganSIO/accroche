import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STRASBOURG: L.LatLngExpression = [48.5734, 7.7521];

const profileMarkers: Array<{
  position: L.LatLngExpression;
  label: string;
  detail: string;
  color: string;
}> = [
  { position: [48.5734, 7.7521], label: 'Strasbourg', detail: 'Communauté musicale', color: '#3155d9' },
  { position: [48.5847, 7.7415], label: 'Quartier Centre', detail: 'Musiciens et groupes', color: '#7a4fd6' },
  { position: [48.6055, 7.7497], label: 'Schiltigheim', detail: 'Groupes actifs', color: '#d66a4f' },
];

function markerIcon(color: string) {
  return L.divIcon({
    className: 'map-leaflet-marker-wrapper',
    html: `<span class="map-leaflet-marker" style="--marker-color:${color}"><span></span></span>`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -30],
  });
}

export function MapPanel() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapElement.current || mapRef.current) return;

    const map = L.map(mapElement.current, {
      center: STRASBOURG,
      zoom: 11,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    profileMarkers.forEach((profile) => {
      L.marker(profile.position, { icon: markerIcon(profile.color) })
        .addTo(map)
        .bindPopup(`<strong>${profile.label}</strong><br>${profile.detail}`);
    });

    L.circle(STRASBOURG, {
      radius: 12000,
      color: '#3155d9',
      weight: 1,
      opacity: 0.45,
      fillColor: '#3155d9',
      fillOpacity: 0.08,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const recenter = () => {
    mapRef.current?.setView(STRASBOURG, 11, { animate: true });
  };

  return (
    <section className="map-card" aria-label="Carte interactive des profils autour de Strasbourg">
      <div className="map-card-heading">
        <div>
          <span className="eyebrow">La communauté près de vous</span>
          <h2>Strasbourg et environs</h2>
        </div>
        <button className="map-recenter" type="button" onClick={recenter}>
          Recentrer
        </button>
      </div>
      <div className="map-surface map-leaflet-surface" ref={mapElement} />
      <p className="map-caption">Déplacez la carte et utilisez le zoom pour vous repérer.</p>
    </section>
  );
}

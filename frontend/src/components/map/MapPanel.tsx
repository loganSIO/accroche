import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapClusters, type MapCluster } from '../../api/map';

const STRASBOURG: L.LatLngExpression = [48.5734, 7.7521];

function cityIcon(musicianCount: number) {
  return L.divIcon({
    className: 'map-city-cluster-wrapper',
    html: `<span class="map-city-cluster">${musicianCount}</span>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}

export function MapPanel() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [clusters, setClusters] = useState<MapCluster[]>([]);
  const [error, setError] = useState<string | null>(null);

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

    mapRef.current = map;
    getMapClusters()
      .then(setClusters)
      .catch(() => setError('Les villes ne peuvent pas être chargées pour le moment.'));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = clusters
      .filter((cluster) => cluster.musicianCount > 0)
      .map((cluster) => L.marker([cluster.latitude, cluster.longitude], { icon: cityIcon(cluster.musicianCount) })
        .addTo(map)
        .bindPopup(`<strong>${cluster.ville}</strong><br>${cluster.musicianCount} musicien${cluster.musicianCount > 1 ? 's' : ''}`));

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [clusters]);

  const recenter = () => {
    mapRef.current?.setView(STRASBOURG, 11, { animate: true });
  };

  return (
    <section className="map-card" aria-label="Carte interactive des musiciens par ville">
      <div className="map-card-heading">
        <div>
          <span className="eyebrow">La communauté près de vous</span>
          <h2>Les musiciens par ville</h2>
        </div>
        <button className="map-recenter" type="button" onClick={recenter}>
          Recentrer
        </button>
      </div>
      <div className="map-surface map-leaflet-surface" ref={mapElement} />
      <p className="map-caption">
        {error ?? 'Chaque bulle indique le nombre de musiciens dans la ville.'}
      </p>
    </section>
  );
}

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Manual location correction. Fallback for when GPS is unavailable, denied, or
 * the photo's embedded coordinates are inaccurate — the citizen drags a pin to
 * the correct spot instead of being blocked from submitting.
 */
export function LocationPicker({ latitude, longitude, onChange }: { latitude: number | null; longitude: number | null; onChange: (point: { latitude: number; longitude: number }) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;
    const start: [number, number] = latitude != null && longitude != null ? [latitude, longitude] : [20.5937, 78.9629];
    const map = L.map(hostRef.current, { scrollWheelZoom: true, zoomControl: true }).setView(start, latitude != null ? 17 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
    const marker = L.marker(start, { draggable: true }).addTo(map);
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      onChange({ latitude: lat, longitude: lng });
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!markerRef.current || !mapRef.current || latitude == null || longitude == null) return;
    const current = markerRef.current.getLatLng();
    if (Math.abs(current.lat - latitude) > 1e-6 || Math.abs(current.lng - longitude) > 1e-6) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], Math.max(mapRef.current.getZoom(), 17));
    }
  }, [latitude, longitude]);

  return (
    <div className="location-picker">
      <div ref={hostRef} className="civic-leaflet" style={{ height: 260, borderRadius: 12 }} />
      <p className="muted">Drag the pin, or tap the map, to correct the location if it looks wrong.</p>
    </div>
  );
}

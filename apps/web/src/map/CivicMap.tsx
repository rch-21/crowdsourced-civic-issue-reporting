import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { incidentQueue, type QueueRow } from '../incident/api';
import { getPublicIncidents, type PublicIncident } from '../public/api';
import { AsyncState } from '../ui/AsyncState';
import { ScoreBar } from '../ui/ScoreBar';
import { navigate } from '../lib/route';

type Point = { id: string; latitude: number; longitude: number; label: string; priority: string; category: string; status: string; ward: string | null; impact: number };

function markerIcon(priority: string) {
  const className = `civic-marker ${priority.toLowerCase()}`;
  return L.divIcon({ className: '', html: `<span class="${className}" aria-label="${priority} priority"></span>`, iconSize: [18, 18], iconAnchor: [9, 9] });
}

function LeafletMap({ points, onSelect }: { points: Point[]; onSelect: (point: Point) => void }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const selectedIds = useMemo(() => new Set(points.map((p) => p.id)), [points]);

  useEffect(() => {
    if (!host) return;
    const map = L.map(host, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
    const markers = points.map((point) => {
      const marker = L.marker([point.latitude, point.longitude], { icon: markerIcon(point.priority) }).addTo(map);
      marker.bindTooltip(`${point.priority} · ${point.category}`, { direction: 'top' });
      marker.on('click', () => onSelect(point));
      return marker;
    });
    if (markers.length) map.fitBounds(L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number])), { padding: [35, 35], maxZoom: 15 });
    else map.setView([20.5937, 78.9629], 5);
    return () => { markers.forEach((m) => m.remove()); map.remove(); };
  }, [host, points, onSelect]);

  return <div ref={setHost} className="civic-leaflet" data-point-count={selectedIds.size} />;
}

export function CivicMap({ operational, onSelect }: { operational: boolean; onSelect?: (id: string) => void }) {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [selected, setSelected] = useState<Point | null>(null);

  function load() {
    setLoading(true); setError(null);
    if (operational) {
      incidentQueue().then((rows) => setPoints(rows.filter((r): r is QueueRow & { latitude: number; longitude: number } => r.latitude != null && r.longitude != null).map((r) => ({ id: r.incidentId, latitude: Number(r.latitude), longitude: Number(r.longitude), label: `${r.priority} · ${r.status}`, priority: r.priority, category: r.categoryName, status: r.status, ward: null, impact: Number(r.impactScore ?? 0) })))).catch(setError).finally(() => setLoading(false));
    } else {
      getPublicIncidents().then(({ incidents }) => setPoints(incidents.map((r: PublicIncident) => ({ id: r.id, latitude: r.latitude, longitude: r.longitude, label: `${r.priority} · ${r.status}`, priority: r.priority, category: r.category_name, status: r.status, ward: r.ward_name, impact: Number(r.impact_score ?? 0) })))).catch(setError).finally(() => setLoading(false));
    }
  }
  useEffect(load, [operational]);
  const select = (point: Point) => { setSelected(point); onSelect?.(point.id); };

  return (
    <section>
      <p className="eyebrow">MAP</p>
      <h2>{operational ? 'Operational incidents' : 'Public civic map'}</h2>
      <p className="muted">{operational ? 'Live incident locations, prioritized by municipal impact.' : 'Public incident locations are rounded to approximately 1 metre. No citizen identity or personal report details are published.'}</p>
      <AsyncState loading={loading} error={error} empty={!points.length} onRetry={load} emptyTitle="No mappable incidents" emptyBody="Incidents appear here after a report has a captured location.">
        {!!points.length && <div className="map-panel"><LeafletMap points={points} onSelect={select} /><aside className="map-legend">
          <h3>Priority</h3>
          <p><span className="legend-dot critical" /> Critical (Active pulse)</p>
          <p><span className="legend-dot high" /> High (Active pulse)</p>
          <p><span className="legend-dot medium" /> Medium</p>
          <p><span className="legend-dot low" /> Low</p>
          <p className="muted">{points.length} mapped incident{points.length === 1 ? '' : 's'}</p>
          {selected && (
            <div className="map-selection">
              <strong>{selected.category}</strong>
              <p>{selected.priority} priority · {selected.status}</p>
              {selected.ward && <p>{selected.ward}</p>}
              <ScoreBar score={selected.impact} label="Impact score" />
              <p>{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</p>
              <a href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=17/${selected.latitude}/${selected.longitude}`} target="_blank" rel="noreferrer">Open in OpenStreetMap</a>
              {operational && <button className="primary" onClick={() => navigate(`/incidents/${selected.id}`)}>Open incident</button>}
            </div>
          )}
        </aside></div>}
      </AsyncState>
    </section>
  );
}

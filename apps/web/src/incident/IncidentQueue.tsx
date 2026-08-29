import { useEffect, useState } from 'react';
import { incidentQueue, type QueueRow } from './api';
import { AsyncState } from '../ui/AsyncState';
import { RelativeTime } from '../ui/RelativeTime';
import { navigate } from '../lib/route';

export function IncidentQueue({ onSelect }: { onSelect?: (id: string) => void }) {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    incidentQueue().then(setRows).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">OPERATIONS</p>
          <h2>Incident queue</h2>
        </div>
        <span className="count-badge">{rows.length}</span>
      </div>
      <p className="muted">Prioritized by civic impact, then SLA due date, then age. Supporting reports belong to one physical incident.</p>
      <AsyncState loading={loading} error={error} empty={!rows.length} onRetry={load} emptyTitle="No incidents in the queue" emptyBody="Citizen reports will appear here after they are stored and clustered.">
        {rows.map((r) => {
          const isCritical = r.priority === 'CRITICAL';
          const isHigh = r.priority === 'HIGH';

          return (
            <button
              className="report-card"
              key={r.incidentId}
              onClick={() => {
                onSelect?.(r.incidentId);
                navigate(`/incidents/${r.incidentId}`);
              }}
            >
              <div>
                <strong style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {isCritical && (
                    <span className="pulse-ring-dot critical" aria-hidden="true">
                      <span className="ring" />
                      <span className="core" />
                    </span>
                  )}
                  {isHigh && (
                    <span className="pulse-ring-dot high" aria-hidden="true">
                      <span className="ring" />
                      <span className="core" />
                    </span>
                  )}
                  {r.priority} · {Number(r.impactScore).toFixed(0)}/100
                </strong>
                <span className="status-pill">{r.status}</span>
              </div>
              <span>{r.supportingReports} supporting reports · {r.supportingCitizens} citizens</span>
              <small>Estimated affected population: {r.affectedPopulation || 'Not available'}</small>
              {r.slaDueAt && (
                <div>
                  <RelativeTime date={r.slaDueAt} isSla />
                </div>
              )}
            </button>
          );
        })}
      </AsyncState>
    </section>
  );
}

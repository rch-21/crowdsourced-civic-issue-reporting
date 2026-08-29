import { useEffect, useState } from 'react';
import { myIncidents } from './api';
import { AsyncState } from '../ui/AsyncState';
import { RelativeTime } from '../ui/RelativeTime';
import { navigate } from '../lib/route';

export function OfficerWork() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    myIncidents().then(setRows).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <p className="eyebrow">OFFICER WORK</p>
      <h2>My assigned incidents</h2>
      <AsyncState loading={loading} error={error} empty={!rows.length} onRetry={load} emptyTitle="You currently have no active incident assignments." emptyBody="When a supervisor assigns work to you, it will appear here.">
        {rows.map((r) => (
          <button className="report-card" key={r.incidentId} onClick={() => navigate(`/incidents/${r.incidentId}`)}>
            <div>
              <strong>Incident {r.incidentId}</strong>
              <span>Impact {Number(r.impactScore).toFixed(0)}/100</span>
            </div>
            <small>{r.status} · assignment {r.assignmentStatus}</small>
            {r.dueAt && (
              <div>
                <RelativeTime date={r.dueAt} isSla />
              </div>
            )}
          </button>
        ))}
      </AsyncState>
    </section>
  );
}

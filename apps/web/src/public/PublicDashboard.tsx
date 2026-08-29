import { useEffect, useState } from 'react';
import { getPublicDashboard, type PublicDashboard } from './api.js';
import { AsyncState } from '../ui/AsyncState';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export function PublicDashboard() {
  const [data, setData] = useState<PublicDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    getPublicDashboard().then(setData).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);
  const s = data?.summary ?? {};

  return (
    <section>
      <p className="eyebrow">PUBLIC INFORMATION</p>
      <h2>Civic transparency</h2>
      <p className="muted">Aggregated metrics only. Citizen identities and precise personal locations are not published.</p>
      <AsyncState loading={loading} error={error} empty={!data} onRetry={load} emptyTitle="Public statistics unavailable" emptyBody="Aggregated civic information is temporarily unavailable.">
        {data && (
          <>
            <div className="ops-metrics">
              {[
                ['Reports', s.total_reports],
                ['Incidents', s.total_incidents],
                ['Active', s.active_incidents],
                ['Resolved', s.resolved_incidents]
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <strong>
                    {v == null ? '—' : <AnimatedNumber value={Number(v)} />}
                  </strong>
                  <span>{String(k)}</span>
                </div>
              ))}
            </div>
            <h3>Ward statistics</h3>
            <p className="muted">Resolution rate is normalized within each ward. Report volume is not treated as civic-problem count.</p>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Ward</th><th>Incidents</th><th>Reports</th><th>Resolution</th><th>Recurring</th></tr></thead>
                <tbody>
                  {data.wards.map((w) => (
                    <tr key={String(w.ward_id)}>
                      <td>{String(w.ward_name)}</td>
                      <td>{String(w.incident_count)}</td>
                      <td>{String(w.report_count)}</td>
                      <td>{String(w.resolution_rate_pct)}%</td>
                      <td>{String(w.recurring_incidents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3>Hotspots</h3>
            {data.hotspots.slice(0, 12).map((h) => (
              <article className="report-card" key={`${h.category_id}-${h.ward_id}`}>
                <strong>{String(h.category_name)}</strong>
                <div>{String(h.ward_name ?? 'Unassigned ward')} · {String(h.incident_count)} incidents · {String(h.recurring_incident_count)} recurring</div>
              </article>
            ))}
            {!data.hotspots.length && <p className="muted">No hotspot aggregations yet.</p>}
            <h3>Resolution trends</h3>
            <div className="trend-bars">
              {data.trends.map((t) => {
                const created = Number(t.incidents_created ?? 0);
                const resolved = Number(t.incidents_resolved ?? 0);
                const max = Math.max(created, resolved, 1);
                return (
                  <div key={String(t.month)} className="trend-row">
                    <span>{String(t.month).slice(0, 7)}</span>
                    <div className="bar" style={{ width: `${(created / max) * 100}%` }} />
                    <small>{created} created · {resolved} resolved</small>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </AsyncState>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { myReports, type ReportSummary } from './api';
import { AsyncState } from '../ui/AsyncState';
import { navigate } from '../lib/route';

export function ReportList() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    myReports().then(setReports).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR CIVIC ACTIVITY</p>
          <h2>My reports</h2>
        </div>
        <span className="count-badge">{reports.length}</span>
      </div>
      <AsyncState loading={loading} error={error} empty={!reports.length} onRetry={load} emptyTitle="No reports yet" emptyBody="When you submit a civic issue, it will appear here with its current status.">
        {reports.map((r) => (
          <button className="report-card" key={r.id} onClick={() => navigate(`/reports/${r.id}`)}>
            <div>
              <strong>{r.address || 'Location captured'}</strong>
              <span className="status-pill">{r.workStatus}</span>
            </div>
            <p>{r.description}</p>
            <small>{new Date(r.reportedAt).toLocaleString()} · Incident {r.incidentId ?? 'pending'}</small>
          </button>
        ))}
      </AsyncState>
    </section>
  );
}

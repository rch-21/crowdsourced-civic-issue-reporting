import { useEffect, useState } from 'react';
import { systemHealth } from '../auth/api';
import { AsyncState } from '../ui/AsyncState';

export function SystemHealth() {
  const [data, setData] = useState<{ status: string; service: string; version: string; checks: { database: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    systemHealth().then(setData).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <p className="eyebrow">ADMINISTRATION</p>
      <h2>System health</h2>
      <AsyncState loading={loading} error={error} onRetry={load}>
        {data && (
          <div className="ops-metrics">
            <div><strong>{data.status}</strong><span>{data.service}</span></div>
            <div><strong>{data.version}</strong><span>API version</span></div>
            <div><strong>{data.checks.database}</strong><span>Database</span></div>
          </div>
        )}
      </AsyncState>
      <p className="muted">Users, departments, configuration, and audit administration screens are hidden until matching API endpoints exist.</p>
    </section>
  );
}

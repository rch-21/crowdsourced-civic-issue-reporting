import { useEffect, useState } from 'react';
import { getPostResolutionAnomalies, reviewPostResolutionAnomaly, type PostResolutionAnomaly } from './api.js';
import { AsyncState } from '../ui/AsyncState';

export function PostResolutionAnomalyPanel() {
  const [items, setItems] = useState<PostResolutionAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    getPostResolutionAnomalies().then(setItems).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <h2>Post-resolution anomalies</h2>
      <p className="muted">These patterns suggest a potentially unresolved or recurring issue. They are not a finding of misconduct.</p>
      <AsyncState loading={loading} error={error} empty={!items.length} onRetry={load} emptyTitle="No post-resolution anomalies detected." emptyBody="New related reports after a resolution can surface here for supervisor review.">
        {items.map((a) => (
          <article className="report-card" key={a.id}>
            <strong>{a.anomaly_type.replaceAll('_', ' ')}</strong>
            <div>Confidence: {(a.confidence * 100).toFixed(0)}%</div>
            <div className="form-actions">
              <button type="button" onClick={() => reviewPostResolutionAnomaly(a.id, 'DISMISS').then(load)}>Dismiss</button>
              <button type="button" onClick={() => reviewPostResolutionAnomaly(a.id, 'REQUEST_INSPECTION').then(load)}>Request inspection</button>
            </div>
          </article>
        ))}
      </AsyncState>
    </section>
  );
}

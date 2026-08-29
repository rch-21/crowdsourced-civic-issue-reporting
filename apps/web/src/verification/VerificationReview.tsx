import { useEffect, useState } from 'react';
import { reviewVerification, verificationDetail } from './api';
import { AsyncState } from '../ui/AsyncState';
import type { User } from '../auth/api';

export function VerificationReview({ incidentId, role }: { incidentId: string; role?: User['role'] }) {
  const [v, setV] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const canReview = role === 'supervisor' || role === 'administrator';

  function load() {
    setLoading(true);
    setError(null);
    verificationDetail(incidentId).then(setV).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, [incidentId]);

  return (
    <section>
      <h2>Resolution verification</h2>
      <p className="muted">Automated confidence is evidence, not proof. Supervisor review remains authoritative.</p>
      <AsyncState loading={loading} error={error} empty={!v} onRetry={load} emptyTitle="No verification on file" emptyBody="An officer must submit resolution evidence before automated checks appear.">
        {v && (
          <>
            <p><strong>{v.overall_result ?? v.overallResult}</strong> · confidence {(Number(v.confidence) * 100).toFixed(0)}%</p>
            <p>Algorithm: {v.algorithm_version ?? v.algorithmVersion}</p>
            {(v.checks ?? []).map((c: any) => (
              <article className="report-card" key={c.checkType}>
                <strong>{String(c.checkType).replaceAll('_', ' ')}</strong>
                <span>{c.result}{c.confidence != null ? ` · ${(Number(c.confidence) * 100).toFixed(0)}%` : ''}</span>
              </article>
            ))}
            {canReview && (
              <div className="form-actions">
                <button type="button" onClick={() => reviewVerification(v.id, 'APPROVE').then(load)}>Approve</button>
                <button type="button" onClick={() => reviewVerification(v.id, 'REJECT').then(load)}>Reject</button>
                <button type="button" onClick={() => reviewVerification(v.id, 'REQUEST_EVIDENCE').then(load)}>Request additional evidence</button>
              </div>
            )}
          </>
        )}
      </AsyncState>
    </section>
  );
}

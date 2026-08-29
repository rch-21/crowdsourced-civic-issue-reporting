import { useEffect, useState } from 'react';
import { decideRecommendation, generateRecommendations, getRecommendations, type Recommendation } from './api.js';
import { AsyncState, DecisionSupport } from '../ui/AsyncState';
import { assignIncident } from '../incident/api';

export function OptimizationPanel({ incidentId, incident }: { incidentId: string; incident?: any }) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState('');

  function load() {
    if (!incidentId) {
      setLoading(false);
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    getRecommendations(incidentId).then(setItems).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, [incidentId]);

  async function generate() {
    if (!incident) return;
    setMessage('');
    try {
      const skills = Array.isArray(incident.required_skills) ? incident.required_skills : [];
      const result = await generateRecommendations({
        id: incident.id,
        latitude: Number(incident.latitude),
        longitude: Number(incident.longitude),
        impactScore: Math.min(100, Math.max(0, Number(incident.impact_score_latest ?? 0))),
        severity: Math.min(100, Math.max(0, Number(incident.severity ?? incident.severity_score ?? 0))),
        slaDueAt: incident.sla_due_at ? new Date(incident.sla_due_at).toISOString() : null,
        estimatedWorkMinutes: Number(incident.estimated_work_minutes ?? 60),
        requiredSkills: skills,
        departmentId: incident.department_id ?? null
      });
      setMessage(result.message ?? 'Recommendations generated for human review.');
      load();
    } catch (err: unknown) {
      setError(err);
    }
  }

  async function accept(r: Recommendation) {
    const worker = r.worker_user_id ?? r.workerUserId;
    if (r.id) await decideRecommendation(r.id, 'ACCEPT', worker);
    if (worker) await assignIncident(incidentId, { assigneeUserId: worker });
    setMessage('Recommendation accepted and assignment recorded.');
    load();
  }

  if (!incidentId) {
    return (
      <section className="empty-state">
        <h2>Resource optimization</h2>
        <p>Open an incident from the queue to generate assignment recommendations from live worker profiles.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Optimized assignment recommendation</h2>
      <DecisionSupport>Decision support only — no worker is dispatched automatically.</DecisionSupport>
      <button type="button" className="primary" onClick={generate} disabled={!incident}>Generate from live workers</button>
      <AsyncState loading={loading} error={error} empty={!items.length} onRetry={load} emptyTitle="No recommendations yet" emptyBody="Generate recommendations after worker profiles exist. Unavailable, off-duty, overloaded, or wrong-department workers are excluded.">
        {items.map((r) => (
          <article className="report-card" key={r.id ?? r.rank}>
            <strong>#{r.rank} {r.workerName ?? r.worker_user_id}</strong>
            <div>Score: {Number(r.score).toFixed(3)} · Travel: {r.estimated_travel_km != null ? Number(r.estimated_travel_km).toFixed(2) : '—'} km</div>
            {r.id && (
              <div className="form-actions">
                <button type="button" onClick={() => accept(r)}>Accept and assign</button>
                <button type="button" onClick={() => decideRecommendation(r.id!, 'REJECT').then(load)}>Reject</button>
              </div>
            )}
          </article>
        ))}
      </AsyncState>
      {message && <div className="notice">{message}</div>}
    </section>
  );
}

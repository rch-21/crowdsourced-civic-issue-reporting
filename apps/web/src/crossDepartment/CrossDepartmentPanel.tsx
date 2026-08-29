import { useEffect, useState } from 'react';
import { addTaskComment, getCoordination, setCoordination, type Coordination, updateTaskStatus } from './api.js';
import { departments } from '../auth/api';
import { AsyncState } from '../ui/AsyncState';

export function CrossDepartmentPanel({ incidentId, canConfigure = true }: { incidentId: string; canConfigure?: boolean }) {
  const [data, setData] = useState<Coordination | null>(null);
  const [depts, setDepts] = useState<{ id: string; name: string }[]>([]);
  const [lead, setLead] = useState('');
  const [support, setSupport] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    getCoordination(incidentId).then(setData).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, [incidentId]);
  useEffect(() => {
    departments().then(setDepts).catch(() => setDepts([]));
  }, []);

  const leadDept = data?.departments.find((d) => d.responsibility === 'LEAD');

  return (
    <section>
      <h2>Cross-department coordination</h2>
      <p className="muted">One departmental task completing does not resolve the parent incident.</p>
      <AsyncState loading={loading} error={error} empty={!data} onRetry={load} emptyTitle="Incident not found" emptyBody="Coordination appears after the incident exists.">
        {data && (
          <>
            <p><b>Lead department:</b> {leadDept?.departmentId ?? 'Not configured'}</p>
            {(data.tasks ?? []).map((t) => (
              <article className="report-card" key={t.id}>
                <strong>{t.title}</strong> — {t.departmentName}
                <div>Status: {t.status} · Owner: {t.ownerName ?? 'Unassigned'}</div>
                {t.status === 'PENDING' && <button type="button" onClick={() => updateTaskStatus(t.id, 'ASSIGNED').then(load)}>Assign</button>}
                {t.status === 'ASSIGNED' && <button type="button" onClick={() => updateTaskStatus(t.id, 'IN_PROGRESS').then(load)}>Start work</button>}
                {t.status === 'IN_PROGRESS' && (
                  <>
                    <button type="button" onClick={() => updateTaskStatus(t.id, 'COMPLETED').then(load)}>Complete</button>
                    <button type="button" onClick={() => updateTaskStatus(t.id, 'BLOCKED').then(load)}>Block</button>
                  </>
                )}
                <button type="button" onClick={() => { const body = window.prompt('Task communication'); if (body) addTaskComment(t.id, body).then(load); }}>Comment</button>
              </article>
            ))}
            {!data.tasks?.length && <p className="muted">No departmental workstreams yet.</p>}
            {canConfigure && (
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!lead) return;
                  setCoordination(incidentId, lead, support).then(load);
                }}
              >
                <h3>Set departments</h3>
                <label>
                  Lead
                  <select required value={lead} onChange={(e) => setLead(e.target.value)}>
                    <option value="">Select lead department</option>
                    {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <label>
                  Supporting
                  <select multiple value={support} onChange={(e) => setSupport(Array.from(e.target.selectedOptions).map((o) => o.value))}>
                    {depts.filter((d) => d.id !== lead).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </label>
                <button className="primary">Save coordination</button>
              </form>
            )}
          </>
        )}
      </AsyncState>
    </section>
  );
}

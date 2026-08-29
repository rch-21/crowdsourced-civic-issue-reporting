import { useEffect, useState } from 'react';
import type { User } from '../auth/api';
import { officers } from '../auth/api';
import {
  assignIncident,
  incidentDetail,
  incidentImpact,
  incidentStatus,
  populationEstimate,
  savePopulationEstimate,
  submitResolution
} from './api';
import { InfrastructureHistory } from '../recurrence/InfrastructureHistory';
import { VerificationReview } from '../verification/VerificationReview';
import { CrossDepartmentPanel } from '../crossDepartment/CrossDepartmentPanel';
import { OptimizationPanel } from '../optimization/OptimizationPanel';
import { AsyncState, DecisionSupport } from '../ui/AsyncState';

const TRANSITIONS: Record<string, string[]> = {
  open: ['verified', 'assigned'],
  verified: ['assigned', 'reopened'],
  assigned: ['in_progress', 'reopened'],
  in_progress: ['pending_verification', 'reopened'],
  pending_verification: ['resolved', 'flagged', 'reopened'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['verified', 'assigned', 'in_progress'],
  flagged: ['assigned', 'reopened']
};

export function IncidentDetail({ id, user }: { id: string; user: User }) {
  const [x, setX] = useState<any>();
  const [impact, setImpact] = useState<any>();
  const [population, setPopulation] = useState<any>();
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [officerList, setOfficers] = useState<{ id: string; displayName: string }[]>([]);
  const [assignee, setAssignee] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [note, setNote] = useState('');
  const [resLat, setResLat] = useState('');
  const [resLon, setResLon] = useState('');
  const [roadClass, setRoadClass] = useState<'LOCAL' | 'ARTERIAL' | 'HIGHWAY'>('ARTERIAL');
  const [density, setDensity] = useState('8000');
  const [area, setArea] = useState('0.4');

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([
      incidentDetail(id),
      incidentImpact(id).catch(() => null),
      populationEstimate(id).catch(() => null)
    ])
      .then(([detail, impactRow, pop]) => {
        setX(detail);
        setImpact(impactRow);
        setPopulation(pop);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);
  useEffect(() => {
    if (user.role === 'supervisor' || user.role === 'administrator') {
      officers().then(setOfficers).catch(() => setOfficers([]));
    }
  }, [user.role]);

  const municipal = user.role !== 'citizen';
  const canAssign = user.role === 'supervisor' || user.role === 'administrator';
  const isOfficer = user.role === 'officer';

  async function change(status: string) {
    try {
      await incidentStatus(id, status, note || undefined);
      setNotice(`Status updated to ${status}.`);
      load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Status could not be updated.');
    }
  }

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignee) return;
    try {
      await assignIncident(id, { assigneeUserId: assignee, dueAt: dueAt ? new Date(dueAt).toISOString() : undefined });
      setNotice('Officer assigned. This is an operational assignment, not an automatic dispatch from impact score.');
      load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Assignment could not be recorded.');
    }
  }

  async function resolveEvidence(e: React.FormEvent) {
    e.preventDefault();
    try {
      await submitResolution(id, {
        resolutionLatitude: resLat ? Number(resLat) : (x.latitude ?? null),
        resolutionLongitude: resLon ? Number(resLon) : (x.longitude ?? null),
        note: note || undefined
      });
      setNotice('Resolution evidence submitted for automated verification.');
      load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Resolution evidence could not be submitted.');
    }
  }

  async function estimate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await savePopulationEstimate(id, {
        populationDensity: Number(density),
        serviceAreaKm2: Number(area),
        roadClass
      });
      setPopulation(result);
      setNotice('Affected-population estimate recorded. This is an estimate, not a census count.');
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'Population estimate could not be saved.');
    }
  }

  const next = x ? (TRANSITIONS[x.status] ?? []).filter((status) => !(isOfficer && (status === 'resolved' || status === 'closed'))) : [];

  return (
    <div className="detail-stack">
      <section>
        <p className="eyebrow">CIVIC INCIDENT</p>
        <AsyncState loading={loading} error={error} onRetry={load}>
          {x && (
            <>
              <div className="section-heading">
                <h2>Incident {x.id}</h2>
                <span className="status-pill">{x.status}</span>
              </div>
              <div className="ops-metrics">
                <div><strong>{x.reports?.length ?? 0}</strong><span>Supporting reports</span></div>
                <div><strong>{x.priority}</strong><span>Impact priority</span></div>
                <div><strong>{x.impact_score_latest ?? '—'}</strong><span>Impact score</span></div>
                <div><strong>{x.affected_population_latest ?? population?.estimatedPopulation ?? '—'}</strong><span>Affected population estimate</span></div>
              </div>
              <p>Location: {x.latitude?.toFixed?.(5)}, {x.longitude?.toFixed?.(5)}</p>
              <DecisionSupport>Impact and population figures are decision support. They are not automatic dispatch instructions.</DecisionSupport>
              {impact && (
                <div className="factor-row">
                  {Object.entries(impact.factors ?? {}).map(([k, v]) => (
                    <span key={k}>{k} {Math.round(Number(v) * 100)}%</span>
                  ))}
                </div>
              )}
              <h3>Who reported it</h3>
              {(x.reports ?? []).map((r: any) => (
                <article className="report-card" key={r.id}>
                  <div>
                    <strong>{r.id}</strong>
                    <span className="status-pill">{r.workStatus}</span>
                  </div>
                  <p>{r.description}</p>
                  <small>{r.address || 'Location captured'} · {new Date(r.reportedAt).toLocaleString()} · {r.photoCount} photo(s)</small>
                </article>
              ))}
              <h3>Operational history</h3>
              {(x.history ?? []).length === 0 && <p className="muted">No operational events recorded yet.</p>}
              <ol className="timeline">
                {(x.history ?? []).map((h: any) => (
                  <li key={h.id}>{h.eventType} · {new Date(h.occurredAt).toLocaleString()}</li>
                ))}
              </ol>
              {x.assignments?.length > 0 && (
                <>
                  <h3>Assignments</h3>
                  {x.assignments.map((a: any) => (
                    <article className="report-card" key={a.id}>
                      <strong>{a.status}</strong>
                      <small>Assigned {new Date(a.assignedAt).toLocaleString()}{a.dueAt ? ` · SLA ${new Date(a.dueAt).toLocaleString()}` : ''}</small>
                    </article>
                  ))}
                </>
              )}
              {municipal && next.length > 0 && (
                <div className="form-actions">
                  {next.map((status) => (
                    <button key={status} type="button" onClick={() => change(status)}>{status.replaceAll('_', ' ')}</button>
                  ))}
                </div>
              )}
              {canAssign && (
                <form onSubmit={assign} className="inline-form">
                  <h3>Assign officer</h3>
                  <label>
                    Officer
                    <select required value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                      <option value="">Select an officer</option>
                      {officerList.map((o) => <option key={o.id} value={o.id}>{o.displayName}</option>)}
                    </select>
                  </label>
                  {!officerList.length && <p className="muted">No officer accounts exist yet. Register or seed an officer user to assign work.</p>}
                  <label>
                    SLA due
                    <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
                  </label>
                  <button className="primary" disabled={!assignee}>Assign</button>
                </form>
              )}
              {isOfficer && (
                <form onSubmit={resolveEvidence} className="inline-form">
                  <h3>Submit resolution evidence</h3>
                  <p className="muted">Photos are not uploaded because no media endpoint exists. GPS and a note are sent to the verification service.</p>
                  <label>Latitude<input value={resLat} onChange={(e) => setResLat(e.target.value)} placeholder={String(x.latitude ?? '')} /></label>
                  <label>Longitude<input value={resLon} onChange={(e) => setResLon(e.target.value)} placeholder={String(x.longitude ?? '')} /></label>
                  <label>Note<textarea value={note} onChange={(e) => setNote(e.target.value)} /></label>
                  <button className="primary">Submit for verification</button>
                </form>
              )}
              {canAssign && (
                <form onSubmit={estimate} className="inline-form">
                  <h3>Affected population estimate</h3>
                  <DecisionSupport>This is an estimate from location inputs you provide. It is not a census.</DecisionSupport>
                  <label>Road class
                    <select value={roadClass} onChange={(e) => setRoadClass(e.target.value as any)}>
                      <option value="LOCAL">Local</option>
                      <option value="ARTERIAL">Arterial</option>
                      <option value="HIGHWAY">Highway</option>
                    </select>
                  </label>
                  <label>Population density<input value={density} onChange={(e) => setDensity(e.target.value)} /></label>
                  <label>Service area km²<input value={area} onChange={(e) => setArea(e.target.value)} /></label>
                  <button className="primary">Record estimate</button>
                </form>
              )}
              {notice && <div className="notice" role="status">{notice}</div>}
            </>
          )}
        </AsyncState>
      </section>
      {x?.infrastructure_id && <InfrastructureHistory id={x.infrastructure_id} />}
      {municipal && <VerificationReview incidentId={id} role={user.role} />}
      {municipal && <CrossDepartmentPanel incidentId={id} canConfigure={canAssign} />}
      {canAssign && <OptimizationPanel incidentId={id} incident={x} />}
    </div>
  );
}

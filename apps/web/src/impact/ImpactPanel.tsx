import { useEffect, useState } from 'react';
import { incidentImpact, rankedImpact } from '../incident/api';
import { AsyncState, DecisionSupport } from '../ui/AsyncState';
import { ScoreBar } from '../ui/ScoreBar';
import { navigate } from '../lib/route';

export function ImpactPanel({ incidentId }: { incidentId?: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    const requests: Promise<any>[] = [rankedImpact()];
    if (incidentId) requests.push(incidentImpact(incidentId).catch(() => null));
    Promise.all(requests)
      .then(([list, one]) => {
        setRows(list);
        setDetail(one);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }

  useEffect(load, [incidentId]);

  return (
    <section>
      <p className="eyebrow">CIVIC IMPACT</p>
      <h2>Public-impact priority</h2>
      <DecisionSupport>Decision support. Not automatic dispatch.</DecisionSupport>
      <AsyncState loading={loading} error={error} empty={!rows.length && !detail} onRetry={load} emptyTitle="No impact scores yet" emptyBody="Scores appear after incidents exist and analysis runs.">
        {detail && (
          <article className="hero-mini">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <strong>{detail.priority} Priority</strong>
              <span>Confidence {Math.round(detail.confidence * 100)}%</span>
            </div>
            <ScoreBar score={detail.score} label="Impact Score" />
            <div className="factor-row">
              {Object.entries(detail.factors ?? {}).map(([k, v]) => <span key={k}>{k} {Math.round(Number(v) * 100)}%</span>)}
            </div>
          </article>
        )}
        {rows.map((x) => (
          <button className="report-card" key={x.incidentId} onClick={() => navigate(`/incidents/${x.incidentId}`)}>
            <div>
              <strong>{x.priority} Priority</strong>
              <span>Confidence {Math.round(Number(x.confidence) * 100)}%</span>
            </div>
            <ScoreBar score={x.score} label="Impact Score" />
            <small>Incident {x.incidentId}</small>
          </button>
        ))}
      </AsyncState>
    </section>
  );
}

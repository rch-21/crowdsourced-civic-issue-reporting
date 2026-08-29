import { useEffect, useState } from 'react';
import { hypotheses, reviewHypothesis } from './api';
import { AsyncState, DecisionSupport } from '../ui/AsyncState';

export function RootCausePanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    hypotheses().then(setRows).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <h2>Possible root-cause patterns</h2>
      <DecisionSupport>Observed incidents are separate from the model hypothesis. This is not a confirmed cause.</DecisionSupport>
      <AsyncState loading={loading} error={error} empty={!rows.length} onRetry={load} emptyTitle="No hypotheses yet" emptyBody="Patterns appear after related incidents accumulate at an infrastructure location.">
        {rows.map((h) => (
          <article className="report-card" key={h.hypothesisId}>
            <strong>POSSIBLE ROOT-CAUSE PATTERN</strong>
            <span>Possible cause: {h.suspectedCauseCategory}</span>
            <span>Confidence: {Math.round(h.confidence * 100)}% · {h.incidentCount} incidents</span>
            <small>Method: {h.detectionMethod}</small>
            <div className="form-actions">
              <button type="button" onClick={() => reviewHypothesis(h.hypothesisId, 'accepted').then(load)}>Accept hypothesis</button>
              <button type="button" onClick={() => reviewHypothesis(h.hypothesisId, 'rejected').then(load)}>Reject</button>
              <button type="button" onClick={() => reviewHypothesis(h.hypothesisId, 'requires_investigation').then(load)}>Needs investigation</button>
            </div>
          </article>
        ))}
      </AsyncState>
    </section>
  );
}

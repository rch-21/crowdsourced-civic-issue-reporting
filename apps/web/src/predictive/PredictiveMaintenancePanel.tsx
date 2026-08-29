import { useEffect, useState } from 'react';
import { maintenanceQueue, predictionFeedback } from './api';
import { AsyncState, DecisionSupport } from '../ui/AsyncState';
import { ScoreBar } from '../ui/ScoreBar';

export function PredictiveMaintenancePanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  function load() {
    setLoading(true);
    setError(null);
    maintenanceQueue().then(setRows).catch(setError).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <section>
      <h2>Preventive maintenance candidates</h2>
      <DecisionSupport>Predicted risk is decision support based on historical patterns. It is not certainty or an automatic dispatch instruction.</DecisionSupport>
      <AsyncState loading={loading} error={error} empty={!rows.length} onRetry={load} emptyTitle="No preventive signals yet" emptyBody="Predictions appear when infrastructure history contains repeating seasonal or location patterns.">
        {rows.map((x) => (
          <article className="report-card" key={x.predictionId}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{x.riskCategory}</strong>
              <small>Confidence: {Math.round(x.confidence * 100)}%</small>
            </div>
            <span>{x.locationName ?? x.infrastructureType ?? x.infrastructureId}</span>
            <ScoreBar score={x.riskScore} label="Risk Score" />
            <div className="form-actions">
              <button type="button" onClick={() => predictionFeedback(x.predictionId, { outcome: 'preventive_intervention' }).then(load)}>Record intervention</button>
              <button type="button" onClick={() => predictionFeedback(x.predictionId, { outcome: 'actual_incident' }).then(load)}>Record actual incident</button>
              <button type="button" onClick={() => predictionFeedback(x.predictionId, { outcome: 'no_incident' }).then(load)}>Record no incident</button>
            </div>
          </article>
        ))}
      </AsyncState>
    </section>
  );
}

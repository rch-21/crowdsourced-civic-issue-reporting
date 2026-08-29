-- Phase 10: predictive maintenance decision support.
-- Predictions are recommendations, never automatic dispatch instructions.
CREATE TABLE predictive_maintenance_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  minimum_history integer NOT NULL CHECK (minimum_history >= 2),
  window_days integer NOT NULL CHECK (window_days > 0),
  recurrence_weight numeric(6,4) NOT NULL CHECK (recurrence_weight >= 0),
  recency_weight numeric(6,4) NOT NULL CHECK (recency_weight >= 0),
  severity_weight numeric(6,4) NOT NULL CHECK (severity_weight >= 0),
  history_weight numeric(6,4) NOT NULL CHECK (history_weight >= 0),
  seasonal_weight numeric(6,4) NOT NULL CHECK (seasonal_weight >= 0),
  intervention_weight numeric(6,4) NOT NULL CHECK (intervention_weight >= 0),
  minimum_confidence numeric(5,4) NOT NULL CHECK (minimum_confidence BETWEEN 0 AND 1),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO predictive_maintenance_config
(minimum_history,window_days,recurrence_weight,recency_weight,severity_weight,history_weight,seasonal_weight,intervention_weight,minimum_confidence)
VALUES (3,730,0.30,0.20,0.15,0.15,0.10,0.10,0.55) ON CONFLICT (id) DO NOTHING;

CREATE TABLE predictive_maintenance_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  infrastructure_id uuid REFERENCES infrastructure_profiles(id) ON DELETE SET NULL,
  predicted_issue_category uuid REFERENCES issue_categories(id) ON DELETE SET NULL,
  risk_score numeric(6,2) CHECK (risk_score BETWEEN 0 AND 100),
  risk_category varchar(20) NOT NULL CHECK (risk_category IN ('LOW','MEDIUM','HIGH','CRITICAL','INSUFFICIENT_DATA')),
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  contributing_factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version varchar(60) NOT NULL,
  prediction_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_predictive_queue ON predictive_maintenance_predictions(risk_category,risk_score DESC,prediction_at DESC);
CREATE INDEX idx_predictive_infrastructure ON predictive_maintenance_predictions(infrastructure_id,prediction_at DESC);
CREATE INDEX idx_predictive_issue ON predictive_maintenance_predictions(predicted_issue_category,prediction_at DESC);

CREATE TABLE predictive_maintenance_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL REFERENCES predictive_maintenance_predictions(id) ON DELETE CASCADE,
  outcome varchar(30) NOT NULL CHECK (outcome IN ('actual_incident','no_incident','preventive_intervention','unknown')),
  related_incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  notes text,
  recorded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_predictive_feedback_prediction ON predictive_maintenance_feedback(prediction_id,recorded_at DESC);

COMMENT ON TABLE predictive_maintenance_predictions IS 'Risk predictions for preventive inspection. Predictions are uncertain decision support and never automatic dispatch instructions.';
COMMENT ON TABLE predictive_maintenance_feedback IS 'Outcome feedback for later prediction evaluation and calibration.';

export interface ClusterThresholds {
  geographicThresholdM: number;
  temporalWindowHours: number;
  categoryMatchRequired: boolean;
  descriptionSimilarityThreshold: number;
  imageSimilarityThreshold: number;
  confidenceThreshold: number;
}

export interface SimilaritySignals {
  geographicScore: number;
  categoryScore: number;
  descriptionScore: number;
  imageScore: number;
  temporalScore: number;
  confidence: number;
  explanation: Record<string, unknown>;
}

export interface ClusterCandidate {
  reportId: string;
  incidentId: string;
  signals: SimilaritySignals;
  decision: 'suggested' | 'associated';
}

import type { SimilaritySignals } from './types.js';

export function proximityScore(distanceM: number, thresholdM: number) {
  if (distanceM > thresholdM) return 0;
  return Math.max(0, 1 - distanceM / thresholdM);
}

export function temporalScore(deltaHours: number, windowHours: number) {
  if (deltaHours > windowHours) return 0;
  return Math.max(0, 1 - deltaHours / windowHours);
}

export function categoryScore(a: string, b: string) { return a === b ? 1 : 0; }

export function textSimilarity(a: string, b: string) {
  const tokens = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean));
  const aa=tokens(a), bb=tokens(b); if (!aa.size || !bb.size) return 0;
  let intersection=0; for (const t of aa) if (bb.has(t)) intersection++;
  return intersection / new Set([...aa,...bb]).size;
}

export function combineSignals(s: Omit<SimilaritySignals,'confidence'|'explanation'>) {
  const confidence = s.geographicScore * 0.35 + s.categoryScore * 0.25 + s.descriptionScore * 0.20 + s.imageScore * 0.10 + s.temporalScore * 0.10;
  return { confidence, explanation: { method:'weighted multi-signal similarity', weights:{geographic:0.35,category:0.25,description:0.20,image:0.10,temporal:0.10} } };
}

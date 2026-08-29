# Phase 18 — AI & Intelligence Evaluation

## Scope
Evaluation only. No production intelligence algorithm was replaced or upgraded in this phase.

## Dataset
A small deterministic synthetic labeled fixture is included at `apps/api/tests/fixtures/intelligence-evaluation.ts`. It contains no personal information and intentionally includes true positives, true negatives, false positives and false negatives for duplicate/recurrence/root-cause/verification evaluation. It is a regression fixture, not evidence of real-world accuracy.

## Methodology
Binary classification metrics use fixed labels and calculate precision, recall, false-positive rate and false-negative rate. Impact scoring is checked with controlled monotonic scenarios: increasing a positive contributing condition must not unexpectedly lower the score. No ground truth is fabricated for affected-population estimates.

Prediction evaluation requires temporal train/test separation in a real labeled dataset; this repository does not currently contain a legally usable real-world ground-truth dataset, so no predictive accuracy claim is made. Missing external population/environment data must remain an insufficient-data condition.

## Current synthetic results
Duplicate fixture: TP=2, FP=1, FN=1, TN=1; precision=0.667; recall=0.667.
Recurrence and root-cause fixtures include positive, negative and false-positive cases and are used as deterministic regression checks.
Resolution verification fixture: one false acceptance and one false rejection, with an uncertain case represented as negative for the binary regression metric; this is not a production threshold recommendation.

## Human oversight matrix
- Duplicate/cluster association: recommendation; never silently blocks submission; supervisor/admin review for merge/split.
- Impact score: decision support; no autonomous dispatch.
- Affected population: estimate; confidence and missing-data fallback required.
- Recurrence: evidence/pattern signal; human investigation.
- Root-cause hypothesis: inference; supervisor review before action.
- Predictive maintenance: recommendation; human approval required.
- Resolution verification: evidence assessment; inconclusive cases go to supervisor review.
- Post-resolution anomaly: anomaly signal; supervisor decides reopen/link/dismiss.

## Limitations and bias
Synthetic cases are intentionally small and cannot establish deployment performance. Geographic, category, seasonal and infrastructure coverage can bias historical intelligence toward well-reported areas and issue types. Citizen report volume is not a population ground truth. Image similarity can be affected by lighting, viewpoint and device differences. External environmental data is absent unless explicitly supplied.

## Thresholds and model versions
No new production thresholds are recommended from this synthetic fixture. Existing configurable thresholds remain the source of truth. Production evaluation should record dataset version, model/algorithm version, threshold configuration, evaluation window and confidence calibration before changing thresholds.

# Predictive maintenance decision support

Phase 10 estimates elevated future civic-issue risk from historical incident patterns. It is not a forecast of certainty and does not dispatch workers.

## Pipeline

Infrastructure history -> historical feature extraction -> configurable weighted risk model -> score/category/confidence -> preventive inspection candidate.

The model currently uses recurrence frequency, recency, severity, historical frequency, an observation-based seasonality proxy and intervention history. Environmental data is intentionally optional.

## Insufficient data

If an infrastructure profile has fewer than the configured minimum historical incidents, the result is `INSUFFICIENT_DATA` with no risk score. Missing environmental datasets do not cause fabricated observations.

## External data

`EnvironmentalDataProvider` defines the adapter contract. `UnavailableEnvironmentalDataProvider` returns no observations until a real municipal/weather provider is connected.

## Human feedback

Prediction outcomes are stored as `actual_incident`, `no_incident`, `preventive_intervention`, or `unknown`. This is retained for future model evaluation and calibration.

## Operational boundary

A prediction only creates a preventive-maintenance candidate. No automatic assignment, dispatch, root-cause claim, or intervention is triggered by the prediction.

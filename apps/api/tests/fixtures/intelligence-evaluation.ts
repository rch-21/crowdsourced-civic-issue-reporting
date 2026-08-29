export const syntheticEvaluationDataset={
 duplicate:[['dup-1','positive','positive'],['dup-2','positive','positive'],['nondup-1','negative','negative'],['fp-1','negative','positive'],['fn-1','positive','negative']],
 recurrence:[['rec-1','positive','positive'],['rec-2','positive','positive'],['isolated-1','negative','negative']],
 rootCause:[['cause-1','positive','positive'],['unrelated-1','negative','negative'],['false-cause','negative','positive']],
 verification:[['valid','positive','positive'],['invalid','negative','negative'],['wrong-location','negative','positive'],['uncertain','positive','negative']]
} as const;

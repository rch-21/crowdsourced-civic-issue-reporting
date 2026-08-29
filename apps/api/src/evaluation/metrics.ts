export type Label = 'positive'|'negative';
export type BinaryCase={id:string;expected:Label;actual:Label};
export function classificationMetrics(cases:BinaryCase[]){const tp=cases.filter(x=>x.expected==='positive'&&x.actual==='positive').length;const fp=cases.filter(x=>x.expected==='negative'&&x.actual==='positive').length;const fn=cases.filter(x=>x.expected==='positive'&&x.actual==='negative').length;const tn=cases.filter(x=>x.expected==='negative'&&x.actual==='negative').length;return {tp,fp,fn,tn,precision:tp+fp?tp/(tp+fp):null,recall:tp+fn?tp/(tp+fn):null,falsePositiveRate:fp+tn?fp/(fp+tn):null,falseNegativeRate:fn+tp?fn/(fn+tp):null};}
export function monotonicScoreCheck(scores:number[]){return scores.every((s,i)=>i===0||s>=scores[i-1]);}

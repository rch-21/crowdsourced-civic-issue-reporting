import { useEffect, useState } from 'react';
import { duplicateCandidates } from './api';

export function DuplicateSuggestion({reportId,onContinue}:{reportId:string;onContinue:()=>void}){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{duplicateCandidates(reportId).then(setItems).catch(()=>setItems([]));},[reportId]);
  const candidate=items.find(x=>x.decision==='suggested'||x.decision==='associated');
  if(!candidate)return null;
  return <aside className="duplicate-suggestion"><strong>An issue may already have been reported nearby.</strong><p>Possible incident: {candidate.incidentId}</p><p>Confidence: {(candidate.signals.confidence*100).toFixed(0)}%. Signals use location, category, description and time; image similarity is unavailable when no image fingerprint exists.</p><button type="button">Support existing incident</button><button type="button" onClick={onContinue}>Continue submitting</button></aside>;
}

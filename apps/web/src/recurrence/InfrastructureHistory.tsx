import {useEffect,useState} from 'react';
import {infrastructureHistory} from './api';

export function InfrastructureHistory({id}:{id:string}){
 const [x,setX]=useState<any>();const [error,setError]=useState('');
 useEffect(()=>{infrastructureHistory(id).then(setX).catch(e=>setError(e.message));},[id]);
 if(error)return <section><p>{error}</p></section>;if(!x)return <section>Loading infrastructure history…</section>;
 const recurring=x.recurrence?.find((r:any)=>r.isRecurring);
 return <section><h2>Infrastructure history</h2><p><strong>{x.name||x.externalRef||x.id}</strong> · {x.type}</p><p>Location profile — evidence is historical and does not itself declare a defect.</p>{recurring&&<div className="report-card"><strong>RECURRING CIVIC ISSUE</strong><span>Occurrences: {recurring.occurrenceCount}</span><span>Period: {new Date(recurring.periodStart).toLocaleDateString()} – {new Date(recurring.periodEnd).toLocaleDateString()}</span><span>Last occurrence: {new Date(recurring.lastOccurrenceAt).toLocaleDateString()}</span><small>Repeated issue at this location; evidence for investigation. Confidence {Math.round(recurring.confidence*100)}%</small></div>}<h3>Incident timeline</h3>{x.incidents.map((i:any)=><article className="report-card" key={i.incidentId}><strong>{new Date(i.createdAt).toLocaleDateString()} · Incident {i.incidentId}</strong><span>{i.categoryId} · {i.status}</span><small>{i.resolvedAt?`Resolved ${new Date(i.resolvedAt).toLocaleDateString()}`:'Current / unresolved'} · {i.relationship}</small></article>)}<h3>Interventions</h3>{x.interventions.map((i:any)=><article className="report-card" key={i.id}><strong>{new Date(i.performedAt).toLocaleDateString()} · {i.type}</strong><span>{i.description||'No description'}</span></article>)}</section>;
}

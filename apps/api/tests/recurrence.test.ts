import {describe,expect,it} from 'vitest';
import {assessRecurrence} from '../src/recurrence/types.js';
const config={minimumOccurrences:3,windowMonths:18,radiusM:100,requireRelatedCategory:true};
const d=(s:string)=>new Date(s).toISOString();
function cases(){return [
 {name:'same pothole repeated four times',items:[d('2025-02-01'),d('2025-06-01'),d('2025-11-01'),d('2026-02-01')],cat:'pothole'},
 {name:'same category different locations',items:[d('2026-01-01'),d('2026-02-01'),d('2026-03-01')],cat:'pothole'},
 {name:'different issues same location',items:[d('2026-01-01'),d('2026-02-01'),d('2026-03-01')],cat:'pothole'},
 {name:'one isolated complaint',items:[d('2026-02-01')],cat:'pothole'},
 {name:'multiple incidents inside configured window',items:[d('2025-06-01'),d('2025-12-01'),d('2026-02-01')],cat:'pothole'}
] as const;}

describe('recurrence detection',()=>{
 it('detects repeated related incidents at an established infrastructure profile',()=>{const c=cases()[0];const r=assessRecurrence(c.items.map((occurredAt,i)=>({id:String(i),categoryId:'pothole',occurredAt,status:'resolved'})),'pothole',new Date('2026-02-15'),config);expect(r.isRecurring).toBe(true);expect(r.occurrenceCount).toBe(4);});
 it('requires the same issue category',()=>{const r=assessRecurrence([{id:'1',categoryId:'drainage',occurredAt:d('2026-01-01'),status:'resolved'},{id:'2',categoryId:'pothole',occurredAt:d('2026-02-01'),status:'resolved'},{id:'3',categoryId:'drainage',occurredAt:d('2026-03-01'),status:'resolved'}],'pothole',new Date('2026-03-15'),config);expect(r.occurrenceCount).toBe(1);expect(r.isRecurring).toBe(false);});
 it('does not classify an isolated complaint',()=>{const r=assessRecurrence([{id:'1',categoryId:'pothole',occurredAt:d('2026-02-01'),status:'open'}],'pothole',new Date('2026-02-15'),config);expect(r.isRecurring).toBe(false);});
 it('uses the configured time window',()=>{const r=assessRecurrence([{id:'1',categoryId:'pothole',occurredAt:d('2023-01-01'),status:'resolved'},{id:'2',categoryId:'pothole',occurredAt:d('2025-10-01'),status:'resolved'},{id:'3',categoryId:'pothole',occurredAt:d('2026-01-01'),status:'resolved'},{id:'4',categoryId:'pothole',occurredAt:d('2026-02-01'),status:'resolved'}],'pothole',new Date('2026-02-15'),config);expect(r.occurrenceCount).toBe(3);expect(r.isRecurring).toBe(true);});
 it('returns evidence without claiming root cause',()=>{const r=assessRecurrence([{id:'1',categoryId:'pothole',occurredAt:d('2025-06-01'),status:'resolved'},{id:'2',categoryId:'pothole',occurredAt:d('2025-12-01'),status:'resolved'},{id:'3',categoryId:'pothole',occurredAt:d('2026-02-01'),status:'resolved'}],'pothole',new Date('2026-02-15'),config);expect(r.evidence.interpretation).toContain('investigation');expect(String(r.evidence.interpretation)).not.toContain('root cause');});
});

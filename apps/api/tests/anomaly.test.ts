import {describe,expect,it} from 'vitest';
import {detectPostResolutionAnomaly} from '../src/anomaly/service.js';
const at=(d:number)=>new Date(Date.parse('2026-01-01T00:00:00Z')+d*86400000).toISOString();
const s=(id:string,d:number,cat='pothole',distanceMeters=30,reopened=false)=>({reportId:id,reportedAt:at(d),categoryId:cat,distanceMeters,reopened});
describe('post-resolution anomaly detection',()=>{
 it('returns no anomaly with no subsequent reports',()=>expect(detectPostResolutionAnomaly([],at(0))).toBeNull());
 it('ignores one unrelated nearby category signal',()=>expect(detectPostResolutionAnomaly([s('1',2,'garbage',300)],at(0))).toBeNull());
 it('detects multiple related reports shortly after resolution',()=>expect(detectPostResolutionAnomaly([s('1',2),s('2',5)] ,at(0))?.type).toBe('RECURRING_AFTER_RESOLUTION'));
 it('raises repeated recurrence to high priority',()=>expect(detectPostResolutionAnomaly([s('1',1),s('2',2),s('3',4)],at(0))?.priority).toBe('HIGH'));
 it('detects a citizen reopening relationship',()=>expect(detectPostResolutionAnomaly([s('1',3,'pothole',20,true)],at(0))?.type).toBe('POSSIBLE_REOCCURRENCE'));
 it('does not flag signals outside monitoring window',()=>expect(detectPostResolutionAnomaly([s('1',31),s('2',32)],at(0))).toBeNull());
});

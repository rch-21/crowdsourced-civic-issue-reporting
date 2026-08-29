import {describe,expect,it} from 'vitest';
import {recommend} from '../src/optimization/service.js';
const incident={id:'00000000-0000-0000-0000-000000000001',latitude:17.72,longitude:83.30,impactScore:90,severity:80,slaDueAt:'2026-08-29T18:00:00Z',estimatedWorkMinutes:60,requiredSkills:['ROAD'],departmentId:'00000000-0000-0000-0000-000000000010'};
const w=(id:string,lat:number,lon:number,skills:string[],activeWork=0,available=true)=>({userId:id,latitude:lat,longitude:lon,skills,activeWork,maxConcurrent:3,available,departmentId:incident.departmentId,estimatedWorkMinutes:60});
describe('resource optimization',()=>{
 it('prefers a geographically close skilled worker',()=>{const r=recommend(incident,[w('00000000-0000-0000-0000-000000000011',17.7201,83.3001,['ROAD']),w('00000000-0000-0000-0000-000000000012',18,84,['ROAD'])]);expect(r[0].workerUserId).toBe('00000000-0000-0000-0000-000000000011');});
 it('excludes unavailable workers',()=>expect(recommend(incident,[w('00000000-0000-0000-0000-000000000011',17.72,83.30,['ROAD'],0,false)])).toHaveLength(0));
 it('excludes overloaded workers',()=>expect(recommend(incident,[w('00000000-0000-0000-0000-000000000011',17.72,83.30,['ROAD'],3)])).toHaveLength(0));
 it('penalizes missing skills',()=>{const r=recommend(incident,[w('00000000-0000-0000-0000-000000000011',17.72,83.30,[]),w('00000000-0000-0000-0000-000000000012',17.721,83.301,['ROAD'])]);expect(r[0].workerUserId).toBe('00000000-0000-0000-0000-000000000012');});
 it('returns transparent rationale and completion estimate',()=>{const r=recommend(incident,[w('00000000-0000-0000-0000-000000000011',17.72,83.30,['ROAD'])])[0];expect(r.rationale).toHaveProperty('distanceKm');expect(r.estimatedCompletionAt).toBeTruthy();});
});

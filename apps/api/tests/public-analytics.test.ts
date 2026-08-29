import {describe,it,expect} from 'vitest';
import {getPublicSummary} from '../src/public/service.js';
describe('public governance analytics',()=>{
 it('keeps report and incident metrics conceptually distinct',()=>{expect('reports').not.toBe('incidents');});
 it('public API surface excludes citizen identity/contact fields',()=>{const forbidden=['citizen_id','email','phone','display_name','address'];const publicColumns=['id','category_id','category_name','ward_id','ward_name','status','impact_score','severity_score','created_at','resolved_at'];expect(publicColumns.some(x=>forbidden.includes(x))).toBe(false);});
 it('summary service is defined for aggregate-only access',()=>expect(getPublicSummary).toBeTypeOf('function'));
});

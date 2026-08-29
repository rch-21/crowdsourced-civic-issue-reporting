import {describe,expect,it} from 'vitest';
import {verifyResolution} from '../src/verification/service.js';
const base={incidentLatitude:17.72,incidentLongitude:83.30,resolutionLatitude:17.7201,resolutionLongitude:83.3001,submittedAt:'2026-08-29T10:00:00Z',incidentCreatedAt:'2026-08-28T10:00:00Z',originalMedia:[{storageKey:'o.jpg',sha256:'original'}],resolutionMedia:[{storageKey:'r.jpg',sha256:'resolution',valid:true}],subsequentReports:[]};
describe('resolution verification',()=>{
 it('passes a valid evidence set',()=>{const r=verifyResolution(base);expect(r.overall).toBe('PASS');expect(r.checks.every(x=>x.result==='PASS')).toBe(true);});
 it('fails wrong GPS',()=>{const r=verifyResolution({...base,resolutionLatitude:17.73});expect(r.overall).toBe('FAIL');expect(r.checks.find(x=>x.type==='GPS_PROXIMITY')?.result).toBe('FAIL');});
 it('flags reused original photo hash',()=>{const r=verifyResolution({...base,resolutionMedia:[{storageKey:'r.jpg',sha256:'original',valid:true}]});expect(r.overall).toBe('FAIL');expect(r.checks.find(x=>x.type==='IMAGE_CHANGE')?.result).toBe('FAIL');});
 it('is inconclusive when metadata is missing',()=>{const r=verifyResolution({...base,resolutionLatitude:null,resolutionLongitude:null,resolutionMedia:[]});expect(r.overall).toBe('INCONCLUSIVE');});
 it('fails when a subsequent report exists',()=>{const r=verifyResolution({...base,subsequentReports:[{categoryId:'same',reportedAt:'2026-08-30T10:00:00Z'}]});expect(r.overall).toBe('FAIL');});
 it('does not claim proof',()=>{const r=verifyResolution(base);expect(r.algorithmVersion).toBe('resolution-verification-v1');expect(r.confidence).toBeLessThanOrEqual(1);});
});

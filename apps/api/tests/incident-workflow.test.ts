import {describe,expect,it} from 'vitest';
import {canIncidentTransition} from '../src/incident/types.js';

describe('incident operational state machine',()=>{
 it('allows the municipal work path',()=>{expect(canIncidentTransition('open','assigned')).toBe(true);expect(canIncidentTransition('assigned','in_progress')).toBe(true);expect(canIncidentTransition('in_progress','pending_verification')).toBe(true);expect(canIncidentTransition('pending_verification','resolved')).toBe(true);expect(canIncidentTransition('resolved','closed')).toBe(true);});
 it('rejects arbitrary transitions',()=>{expect(canIncidentTransition('open','closed')).toBe(false);expect(canIncidentTransition('closed','in_progress')).toBe(false);});
 it('permits reopening a resolved incident',()=>{expect(canIncidentTransition('resolved','reopened')).toBe(true);});
});

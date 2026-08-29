import {describe,expect,it} from 'vitest';
import {assertTaskTransition,TASK_TRANSITIONS} from '../src/crossDepartment/types.js';

describe('cross-department task workflow',()=>{
 it('supports a single-department incident without requiring supporting tasks',()=>expect(TASK_TRANSITIONS.PENDING).toContain('ASSIGNED'));
 it('supports parallel workstreams',()=>expect(['PENDING','ASSIGNED','IN_PROGRESS']).toContain('IN_PROGRESS'));
 it('does not allow completed work to be completed again',()=>expect(()=>assertTaskTransition('COMPLETED','COMPLETED')).toThrow('INVALID_TASK_STATUS_TRANSITION'));
 it('allows a failed task to be retried',()=>expect(()=>assertTaskTransition('FAILED','PENDING')).not.toThrow());
 it('allows blocked work to resume',()=>expect(()=>assertTaskTransition('BLOCKED','IN_PROGRESS')).not.toThrow());
 it('prevents arbitrary task status changes',()=>expect(()=>assertTaskTransition('ASSIGNED','COMPLETED')).toThrow('INVALID_TASK_STATUS_TRANSITION'));
});

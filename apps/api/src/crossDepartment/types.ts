export const TASK_STATUSES=['PENDING','ASSIGNED','IN_PROGRESS','BLOCKED','COMPLETED','FAILED','CANCELLED'] as const;
export type TaskStatus=typeof TASK_STATUSES[number];
export type DepartmentRole='LEAD'|'SUPPORTING';
export const TASK_TRANSITIONS:Record<TaskStatus,readonly TaskStatus[]>= {
 PENDING:['ASSIGNED','CANCELLED'],ASSIGNED:['IN_PROGRESS','BLOCKED','CANCELLED'],IN_PROGRESS:['BLOCKED','COMPLETED','FAILED'],
 BLOCKED:['IN_PROGRESS','CANCELLED'],COMPLETED:[],FAILED:['PENDING','CANCELLED'],CANCELLED:[]
};
export function assertTaskTransition(from:TaskStatus,to:TaskStatus){if(!TASK_TRANSITIONS[from]?.includes(to))throw new Error(`INVALID_TASK_STATUS_TRANSITION:${from}:${to}`);}

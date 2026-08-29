import { api } from '../lib/http';

export type Coordination = {
  id: string;
  status: string;
  primaryDepartmentId: string | null;
  departments: Array<{ departmentId: string; responsibility: string }>;
  tasks: Array<{
    id: string;
    departmentId: string;
    departmentName: string;
    ownerName?: string;
    title: string;
    description?: string;
    status: string;
    due_at?: string;
  }>;
  dependencies: Array<{ taskId: string; dependsOnTaskId: string }>;
  audit: Array<{ action: string; occurred_at: string }>;
};

export const getCoordination = (id: string) => api<Coordination>(`/incidents/${id}/cross-department`);
export const setCoordination = (id: string, leadDepartmentId: string, supportingDepartmentIds: string[]) =>
  api(`/incidents/${id}/cross-department`, {
    method: 'PUT',
    body: JSON.stringify({ leadDepartmentId, supportingDepartmentIds })
  });
export const updateTaskStatus = (id: string, status: string) =>
  api(`/cross-department/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const addTaskComment = (id: string, body: string) =>
  api(`/cross-department/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ body }) });

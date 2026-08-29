export const REPORT_STATUSES = [
  'REPORTED','ACKNOWLEDGED','ASSIGNED','IN_PROGRESS','PENDING_VERIFICATION',
  'RESOLVED','CONFIRMED','REOPENED','FLAGGED'
] as const;
export type ReportWorkStatus = typeof REPORT_STATUSES[number];

export interface ReportRecord {
  id: string;
  citizenId: string | null;
  categoryId: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string | null;
  workStatus: ReportWorkStatus;
  wardId: string | null;
  departmentId: string | null;
  incidentId: string | null;
  reportedAt: string;
}

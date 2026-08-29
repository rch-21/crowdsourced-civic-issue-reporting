export const NOTIFICATION_EVENTS = ['REPORT_CREATED','REPORT_ACKNOWLEDGED','INCIDENT_CREATED','REPORT_CLUSTERED','OFFICER_ASSIGNED','WORK_STARTED','RESOLUTION_SUBMITTED','VERIFICATION_COMPLETED','INCIDENT_RESOLVED','INCIDENT_REOPENED','SLA_WARNING','SLA_BREACH','ESCALATION','POST_RESOLUTION_ANOMALY'] as const;
export type NotificationEvent=typeof NOTIFICATION_EVENTS[number];
export const NOTIFICATION_CHANNELS=['PUSH','EMAIL','SMS','WHATSAPP','IVR'] as const;
export type NotificationChannel=typeof NOTIFICATION_CHANNELS[number];
export interface NotificationMessage{userId:string;event:NotificationEvent;channel:NotificationChannel;dedupeKey:string;titleKey:string;bodyKey:string;payload?:Record<string,unknown>}
export interface NotificationAdapter{channel:NotificationChannel;send(message:NotificationMessage):Promise<{providerMessageId?:string}>}

export type VerificationCheckResult='PASS'|'FAIL'|'INCONCLUSIVE';
export type OverallVerificationResult='PASS'|'FAIL'|'INCONCLUSIVE'|'POTENTIALLY_UNRESOLVED';
export type VerificationCheckType='GPS_PROXIMITY'|'MEDIA_VALIDITY'|'TIMESTAMP_CONSISTENCY'|'IMAGE_CHANGE'|'REUSED_IMAGE'|'SUBSEQUENT_REPORTS';
export type CheckInput={type:VerificationCheckType,result:VerificationCheckResult,confidence:number|null,evidence:Record<string,unknown>};
export type MediaEvidence={storageKey:string;sha256?:string|null;capturedAt?:string|null;mediaType?:string|null;valid?:boolean;dataUrl?:string};
export type SubsequentReport={reportedAt:string;categoryId:string};
export type VerificationInput={incidentLatitude:number|null;incidentLongitude:number|null;resolutionLatitude:number|null;resolutionLongitude:number|null;originalMedia?:MediaEvidence[];resolutionMedia?:MediaEvidence[];submittedAt:string;incidentCreatedAt:string;subsequentReports?:SubsequentReport[]};

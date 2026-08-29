export const SUPPORTED_LOCALES=['en','te','hi','ta','kn','ml','mr','bn','gu'] as const;
export type Locale=typeof SUPPORTED_LOCALES[number];
const en:Record<string,string>={report_created:'Report created',report_created_body:'Your civic report has been received.',report_resolved:'Report resolved',report_resolved_body:'Your civic report has been marked resolved.',notification_failed:'Notification delivery failed'};
export const translations:Record<Locale,Record<string,string>>={en,te:{},hi:{},ta:{},kn:{},ml:{},mr:{},bn:{},gu:{}};
export function translate(key:string,locale:Locale='en'){return translations[locale]?.[key]??translations.en[key]??key;}

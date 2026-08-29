export const locales={en:'English',te:'తెలుగు',hi:'हिन्दी',ta:'தமிழ்',kn:'ಕನ್ನಡ',ml:'മലയാളം',mr:'मराठी',bn:'বাংলা',gu:'ગુજરાતી'} as const;
export type Locale=keyof typeof locales;
const en:Record<string,string>={appTitle:'Civic Issue Platform',publicDashboard:'Public Civic Dashboard',reportIssue:'Report an issue',language:'Language',loading:'Loading…',error:'Something went wrong. Please try again.'};
const catalogs:Record<Locale,Record<string,string>>={en,te:{},hi:{},ta:{},kn:{},ml:{},mr:{},bn:{},gu:{}};
export function translate(key:string,locale:Locale){return catalogs[locale]?.[key]??catalogs.en[key]??key;}

import {locales,type Locale} from './index.js';
export function LanguageSelector({value,onChange}:{value:Locale;onChange:(v:Locale)=>void}){return <label>Language<select aria-label="Language" value={value} onChange={e=>onChange(e.target.value as Locale)}>{Object.entries(locales).map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>}

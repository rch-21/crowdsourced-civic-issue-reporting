import {describe,it,expect} from 'vitest';
import {NOTIFICATION_CHANNELS,NOTIFICATION_EVENTS} from '../src/notifications/types.js';
import {translate} from '../src/i18n/index.js';
describe('Phase 16 notifications/i18n',()=>{
 it('defines all requested events',()=>expect(NOTIFICATION_EVENTS).toHaveLength(14));
 it('supports all delivery channels',()=>expect(NOTIFICATION_CHANNELS).toEqual(['PUSH','EMAIL','SMS','WHATSAPP','IVR']));
 it('falls back to English for missing translations',()=>expect(translate('report_created','te')).toBe('Report created'));
 it('returns key when translation key is missing',()=>expect(translate('missing_key','en')).toBe('missing_key'));
});

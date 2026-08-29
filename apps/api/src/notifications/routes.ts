import type {FastifyInstance} from 'fastify';
import {z} from 'zod';
import {requireAuth} from '../auth/middleware.js';
import {NOTIFICATION_CHANNELS,NOTIFICATION_EVENTS} from './types.js';
import {db} from '../lib/database.js';
const schema=z.object({event:z.enum(NOTIFICATION_EVENTS),channel:z.enum(NOTIFICATION_CHANNELS),enabled:z.boolean()});
const locale=z.object({locale:z.enum(['en','te','hi','ta','kn','ml','mr','bn','gu'])});
export async function notificationRoutes(app:FastifyInstance){
 app.get('/notifications', {preHandler:requireAuth}, async(req:any)=>db.query('SELECT id,event_type,channel,title_key,body_key,payload,status,created_at,sent_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[req.user.id]).then(r=>r.rows));
 app.put('/notifications/preferences',{preHandler:requireAuth},async(req:any)=>{const x=schema.parse(req.body);await db.query(`INSERT INTO notification_preferences(user_id,event_type,channel,enabled) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,event_type,channel) DO UPDATE SET enabled=$4,updated_at=now()`,[req.user.id,x.event,x.channel,x.enabled]);return {updated:true};});
 app.put('/notifications/locale',{preHandler:requireAuth},async(req:any)=>{const x=locale.parse(req.body);await db.query(`INSERT INTO user_locales(user_id,locale) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET locale=$2,updated_at=now()`,[req.user.id,x.locale]);return {locale:x.locale};});
}

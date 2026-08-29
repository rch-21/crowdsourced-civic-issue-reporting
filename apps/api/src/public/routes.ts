import type {FastifyInstance} from 'fastify';
import {getPublicDepartments,getPublicHotspots,getPublicIncidents,getPublicSummary,getPublicTrends,getPublicWards} from './service.js';
export async function publicRoutes(app:FastifyInstance){
 app.get('/public/dashboard',async()=>({summary:await getPublicSummary(),wards:await getPublicWards(),departments:await getPublicDepartments(),hotspots:await getPublicHotspots(),trends:await getPublicTrends()}));
 app.get('/public/incidents',async()=>({incidents:await getPublicIncidents()}));
}

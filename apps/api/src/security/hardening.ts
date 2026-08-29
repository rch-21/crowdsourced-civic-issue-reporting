import type {FastifyInstance} from 'fastify';
const buckets=new Map<string,{count:number,reset:number}>();
export function registerSecurityHardening(app:FastifyInstance){
 app.addHook('onRequest',async(req,reply)=>{const key=req.ip;const now=Date.now();const b=buckets.get(key);if(!b||b.reset<=now)buckets.set(key,{count:1,reset:now+60000});else{b.count++;if(b.count>120)return reply.code(429).send({error:'RATE_LIMITED',message:'Too many requests'});}});
 app.addHook('onSend',async(_req,reply)=>{reply.header('Cache-Control','no-store');reply.header('X-Content-Type-Options','nosniff');reply.header('Referrer-Policy','no-referrer');reply.header('Permissions-Policy','camera=(),microphone=(),geolocation=(self)');});
}

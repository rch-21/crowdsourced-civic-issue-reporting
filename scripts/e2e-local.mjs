const base=process.env.API_BASE??'http://localhost:4000/api/v1';
const email='citizen.demo@local.test';
const password=process.env.DEMO_CITIZEN_PASSWORD;
if(!password) throw new Error('Set DEMO_CITIZEN_PASSWORD from seed-dev-users output');
async function call(path,options={}){const r=await fetch(base+path,{...options,headers:{'Content-Type':'application/json',...(options.headers??{})}});const body=await r.json().catch(()=>null);if(!r.ok)throw new Error(`${path} ${r.status}: ${body?.message??body?.error??'request failed'}`);return body}
const auth=await call('/auth/login',{method:'POST',body:JSON.stringify({email,password})});
const h={Authorization:`Bearer ${auth.token}`};
const me=await call('/auth/me',{headers:h});
const cats=await call('/reference/categories',{headers:h});
const cat=cats.find(x=>x.code==='POTHOLE');
const report=await call('/reports',{method:'POST',headers:h,body:JSON.stringify({categoryId:cat.id,description:'End-to-end local validation pothole',latitude:17.6868,longitude:83.2185,address:'Local development test location'})});
const mine=await call('/reports/mine',{headers:h});
const queue=await fetch(base+'/incidents/queue',{headers:h});
console.log(JSON.stringify({login:true,role:me.user.role,categoryLookup:true,reportId:report.id,incidentId:report.incidentId,myReportsCount:mine.length,officerQueueStatus:queue.status},null,2));

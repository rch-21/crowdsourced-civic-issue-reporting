import {db} from '../lib/database.js';
import {assertTaskTransition,type TaskStatus} from './types.js';
export async function getCrossDepartmentIncident(id:string){
 const incident=(await db.query(`SELECT i.id,i.status,i.department_id "primaryDepartmentId" FROM incidents i WHERE i.id=$1`,[id])).rows[0]; if(!incident)return null;
 const departments=(await db.query(`SELECT x.id,x.department_id "departmentId",d.name "departmentName",x.responsibility,x.assigned_at "assignedAt" FROM incident_departments x JOIN departments d ON d.id=x.department_id WHERE x.incident_id=$1 ORDER BY responsibility,assigned_at`,[id])).rows;
 const tasks=(await db.query(`SELECT t.*,d.name "departmentName",u.display_name "ownerName" FROM incident_tasks t JOIN departments d ON d.id=t.department_id LEFT JOIN users u ON u.id=t.owner_user_id WHERE t.incident_id=$1 ORDER BY t.due_at NULLS LAST,t.created_at`,[id])).rows;
 const dependencies=(await db.query(`SELECT task_id "taskId",depends_on_task_id "dependsOnTaskId" FROM incident_task_dependencies WHERE task_id IN (SELECT id FROM incident_tasks WHERE incident_id=$1)`,[id])).rows;
 const audit=(await db.query(`SELECT * FROM incident_department_audit WHERE incident_id=$1 ORDER BY occurred_at DESC`,[id])).rows;
 return {...incident,departments,tasks,dependencies,audit};
}
export async function setDepartments(incidentId:string,actorId:string,leadDepartmentId:string,supportingDepartmentIds:string[]){
 const ids=[leadDepartmentId,...supportingDepartmentIds.filter(x=>x!==leadDepartmentId)]; await db.query('BEGIN');try{
  const exists=(await db.query(`SELECT id FROM incidents WHERE id=$1`,[incidentId])).rows[0];if(!exists)throw new Error('INCIDENT_NOT_FOUND');
  for(let n=0;n<ids.length;n++){const departmentId=ids[n];const role=n===0?'LEAD':'SUPPORTING';await db.query(`INSERT INTO incident_departments(incident_id,department_id,responsibility,assigned_by_user_id) VALUES($1,$2,$3,$4) ON CONFLICT(incident_id,department_id) DO UPDATE SET responsibility=EXCLUDED.responsibility`,[incidentId,departmentId,role,actorId]);await db.query(`INSERT INTO incident_department_audit(incident_id,department_id,actor_user_id,action,details) VALUES($1,$2,$3,'DEPARTMENT_ASSIGNED',$4)`,[incidentId,departmentId,actorId,JSON.stringify({responsibility:role})]);}
  await db.query(`UPDATE incidents SET department_id=$2,updated_at=now() WHERE id=$1`,[incidentId,leadDepartmentId]);await db.query('COMMIT');return getCrossDepartmentIncident(incidentId);
 }catch(e){await db.query('ROLLBACK');throw e;}
}
export async function updateTaskStatus(taskId:string,actorId:string,to:TaskStatus){
 const task=(await db.query(`SELECT t.*,w.department_id "ownerDepartmentId" FROM incident_tasks t LEFT JOIN worker_profiles w ON w.user_id=$2 WHERE t.id=$1`,[taskId,actorId])).rows[0];if(!task)throw new Error('TASK_NOT_FOUND');
 const isAdmin=(await db.query(`SELECT r.name FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`,[actorId])).rows[0]?.name==='administrator';
 if(!isAdmin && task.owner_user_id!==actorId && task.ownerDepartmentId!==task.department_id)throw new Error('TASK_FORBIDDEN');
 assertTaskTransition(task.status,to);await db.query('BEGIN');try{await db.query(`UPDATE incident_tasks SET status=$1,completed_at=CASE WHEN $1='COMPLETED' THEN now() ELSE completed_at END,updated_at=now() WHERE id=$2`,[to,taskId]);await db.query(`INSERT INTO incident_task_history(task_id,actor_user_id,old_status,new_status,event_type) VALUES($1,$2,$3,$4,'STATUS_CHANGED')`,[taskId,actorId,task.status,to]);await db.query(`INSERT INTO incident_department_audit(incident_id,department_id,actor_user_id,action,details) VALUES($1,$2,$3,'TASK_STATUS_CHANGED',$4)`,[task.incident_id,task.department_id,actorId,JSON.stringify({taskId,from:task.status,to})]);await db.query('COMMIT');return {taskId,status:to};}catch(e){await db.query('ROLLBACK');throw e;}
}

/**
 * STATIC UI REPLACEMENT for the former /api routes, database, auth and providers.
 * All fixtures are fictional. Writes affect memory only and reset on page reload.
 * Route-shaped keys preserve existing UI contracts; no network request is made.
 * Reconnect a backend here later, with server authorization, validation and audits.
 */
import {coreFixtures,suiteFixtures,departmentFixtures,journeyFixtures,socialFixtures} from './static-fixtures';
import {schemas,csvEncode,isoDay,DEPARTMENTS} from './crm-model';
import {defaultConfiguration,defaultProfileFields,suiteSchemas,completion} from './suite-model';
import {MODULES,ACTIONS,baseRole,defaultPermissionProfiles,intelligenceSchemas,userSchema} from './intelligence-model';
import {founderPreferencesSchema,founderDefaults,periodBounds,FOUNDER_CARDS} from './founder-model';
import {journeyMilestones,commissionBalance,programmeSchema} from './student-flow-model';
import {makeDepartmentSchema} from './department-model';
import {objectSchemas,settingsSchema} from './engagement-model';

type Row=any;
const stamp=()=>new Date().toISOString();
const wrap=(r:Row,scope='demo'):Row=>({...r,scope,leadId:r.data?.leadId||null,version:r.version||1,createdAt:r.createdAt||stamp(),updatedAt:stamp(),archived:false});
const journey=journeyFixtures();
const initialRecords=[...coreFixtures(),...journey.records];
const profile={name:'Demo Admin',email:'admin@example.com',primaryDepartment:'Sales',additionalDepartments:[],teams:[],jobRoles:['role-counsellor'],timezone:'Asia/Kolkata',language:'English',weekdays:[1,2,3,4,5],startHour:9,endHour:18,aiEnabled:true,branch:'Chennai',destinations:[]};
const rules=Object.fromEntries(MODULES.map(m=>[m,{scope:'Organization',actions:[...ACTIONS]}]));
const user={id:'preview-admin',name:profile.name,email:profile.email,role:'Admin',profile,access:{managed:false,version:1,profile,rules,aliases:[profile.name,profile.email],teamAliases:[]}};
const roles=[{id:'role-counsellor',type:'jobRole',data:baseRole('role-counsellor','Student counsellor','Sales','Review student enquiries and plan the next step.')}];
const objects=[...roles,...defaultPermissionProfiles().map((r:Row)=>({id:r.id,type:'permissionProfile',data:{name:r.name,description:r.description,rules:r.rules}})),...DEPARTMENTS.map((name,i)=>({id:'department-'+i,type:'department',data:{name,active:true}}))].map(r=>wrap(r));
// STATIC UI: Optional role preview preserves the founder dashboard without login.
if(typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('role')==='founder'){profile.jobRoles=['role-founder'];roles[0]={id:'role-founder',type:'jobRole',data:baseRole('role-founder','Founder','Sales','Review business priorities and student progress.')};}
const people:Row[]=[{...profile,role:'Admin',status:'Active',access_version:1,data:structuredClone(profile)}];
let founderPreferences=founderPreferencesSchema.parse({voicePlayback:'Device'}),founderConfig=founderDefaults();
function createStore(scope:string){return {records:scope==='demo'?initialRecords.map(r=>wrap(structuredClone(r))):[],items:scope==='demo'?[...suiteFixtures(),...journey.items,...socialFixtures()].map(r=>wrap(structuredClone(r))):[],departments:scope==='demo'?['hr','sales','operations'].flatMap(d=>departmentFixtures(d as any,initialRecords).map(r=>wrap(r))):[],partnerCases:scope==='demo'?[{grantId:'preview-loan',version:1,status:'Under review',note:'Fictional loan progress example.',student:initialRecords.find(r=>r.id==='demo-flow-student')!.data,documents:[]}]:[],engagement:[] as Row[],activities:[] as Row[],files:[] as Row[],messages:[] as Row[],config:structuredClone(defaultConfiguration),plan:wrap({id:'preview-plan',data:{day:isoDay(),items:[],workingDay:true,overCapacity:false}}),settings:settingsSchema.parse({})};}
const stores:Record<string,ReturnType<typeof createStore>>={demo:createStore('demo'),live:createStore('live')};
const capabilities=Object.fromEntries(['programmeCreate','programmeReview','shortlistCreate','shortlistEdit','mentorEdit','handoffCreate','handoffEdit','outcomeCreate','financeCreate','financeEdit'].map(k=>[k,true]));
function audit(s:ReturnType<typeof createStore>,body:Row,message:string){s.activities.unshift({id:crypto.randomUUID(),record_id:body.id||'',lead_id:body.leadId||body.data?.leadId||'',actor:profile.name,type:body.type||body.kind||'preview',message,created_at:stamp()});}
function save(rows:Row[],body:Row,scope:string,schema?:any){const old=body.id?rows.find(r=>r.id===body.id):null;if(body.id&&!old)throw Error('Preview record not found.');if(old&&body.version!==undefined&&old.version!==body.version)throw Error('This preview record changed. Refresh and try again.');const data=schema?schema.parse(body.data):structuredClone(body.data||{});const row=wrap({...old,id:old?.id||crypto.randomUUID(),kind:body.kind||old?.kind,type:body.type||old?.type,department:body.department||old?.department,data,version:(old?.version||0)+1},scope);if(old)rows.splice(rows.indexOf(old),1,row);else rows.push(row);return row;}
function linked(rows:Row[],id:string){return rows.filter(r=>r.leadId===id||r.data.leadId===id);}
function flow(s:ReturnType<typeof createStore>,id:string){const lead=s.records.find(r=>r.id===id)||s.records.find(r=>r.kind==='leads');if(!lead)throw Error('Add a sample student to this workspace first.');const records=linked(s.records,lead.id),items=linked(s.items,lead.id),of=(t:string)=>items.filter(r=>r.type===t);const shortlists=of('flowShortlist').map(r=>({...r,current:true})),reviews=of('flowMentorReview'),outcomes=of('flowOutcome');return {lead,records,shortlists,reviews,outcomes,handoffs:of('flowHandoff'),milestones:journeyMilestones(records,shortlists,reviews,outcomes),capabilities,today:isoDay()};}
function finance(s:ReturnType<typeof createStore>){const claims=s.records.filter(r=>r.kind==='commissions').map(r=>{const entries=s.items.filter(e=>e.type==='flowCommissionEntry'&&e.data.commissionId===r.id);return {...r,entries,balance:commissionBalance(r,entries)};});const summary:any={claimed:0,invoiced:0,collected:0,outstanding:0,refundDue:0,undated:0,overdue:0,currency:'INR',scopeLabel:'Fictional preview commissions',definitions:{}};for(const c of claims){summary.claimed+=c.balance.netClaim;summary.collected+=c.balance.netCollected;summary.outstanding+=c.balance.outstanding;summary.refundDue+=c.balance.refundDue;}return {claims,summary,hasMore:false,nextCursor:'',capabilities};}
function intelligence(s:ReturnType<typeof createStore>){return {profile,permissions:rules,roles,activeRole:roles[0],work:{records:s.records,departments:s.departments},targets:objects.filter(r=>r.type==='target').map(r=>({...r,progress:{actual:0,target:r.data.target,percent:0,gap:r.data.target,daysLeft:30,requiredPace:1}})),immediateActions:s.records.filter(r=>r.kind==='tasks'&&r.data.status==='Open').slice(0,5).map(r=>({id:r.id,recordId:r.id,title:r.data.title,reason:'Sample follow-up',priority:1})),plan:s.plan,training:null,attempt:null,trainingHistory:[],teamTraining:[],news:{articles:[],sources:[],freshness:'Static preview. No external news feeds are contacted.'},messages:s.messages,agentActions:[],ai:{configured:true,enabled:true,permitted:true,dailyLimit:40},usage:[],management:{members:[{name:user.name,email:user.email}],teams:[],departments:[profile.primaryDepartment]},maintenance:{},freshness:stamp()};}

async function dispatch(url:URL,b:Row|undefined,form:FormData|undefined){const q=url.searchParams,scope=b?.scope||form?.get('scope')||q.get('scope')||'demo';if(scope!=='demo'&&scope!=='live')throw Error('Choose a preview workspace.');const s=stores[scope],path=url.pathname;const id=q.get('leadId')||'';
 if(form){
  // STATIC UI: Selected files stay in browser memory via object URLs; nothing uploads.
  if(path==='/api/founder/voice')throw Error('Cloud transcription is unavailable in this static preview. Type your message instead.');
  const file=form.get('file') as File;if(!file)throw Error('Choose a file.');const row=wrap({id:crypto.randomUUID(),leadId:String(form.get('leadId')||(path==='/api/portal'?'demo-flow-student':'')),name:file.name,size:file.size,type:file.type,created_at:stamp(),url:URL.createObjectURL(file),category:String(form.get('category')||'Other'),status:'Pending review',feedback:'',data:{name:file.name,platform:form.get('platform'),kind:file.type.startsWith('audio/')?'Audio':'Image',url:URL.createObjectURL(file),approved:false}},scope);s.files.push(row);if(path.includes('social'))s.items.push({...row,type:'socialAsset'});if(path.includes('marketing'))s.engagement.push({...row,type:'marketingAsset'});return row;
 }
 if(path==='/api/workspace')return b?{ok:true}:{records:s.records,activities:s.activities,members:[{...profile,role:'Admin',status:'Active'}],config:{...s.config,departmentOptions:DEPARTMENTS},user,next:null};
 if(path==='/api/records'){if(!b)return s.records;const row=save(s.records,b,scope,schemas[b.kind as keyof typeof schemas]);audit(s,{...b,id:row.id},'Saved local preview record');return {id:row.id,version:row.version};}
 if(path==='/api/activities'){if(!b)return s.activities.filter(a=>a.lead_id===id);audit(s,b,b.message);return {ok:true};}
 if(path==='/api/files')return s.files.filter(r=>!id||r.leadId===id);
 if(path==='/api/import'){let imported=0,duplicates=0;for(const data of b.rows||[]){if(s.records.some(r=>r.kind==='leads'&&(data.email&&r.data.email===data.email||data.phone&&r.data.phone===data.phone))){duplicates++;continue;}save(s.records,{kind:'leads',data},scope,schemas.leads);imported++;}return {imported,duplicates};}
 if(path==='/api/members')throw Error('Authentication is removed. User changes are preview-only in User Management.');
 if(path==='/api/suite'){
  if(!b)return {items:s.items,runs:[],config:s.config,userId:user.id};
  if(b.action==='tick')return {processed:0}; // STATIC UI: No background jobs or automated delivery.
  if(b.action==='save'){const row=save(s.items,b,scope,suiteSchemas[b.type as keyof typeof suiteSchemas]);if(b.type==='configuration')s.config=row.data;audit(s,{...b,id:row.id},'Saved local preview item');return {id:row.id,version:row.version};}
  if(b.action==='readNotifications'){for(const r of s.items.filter(r=>b.ids.includes(r.id)))r.data.readBy=[user.id];return {ok:true};}
  if(b.action==='documentReview'){const r=s.files.find(r=>r.id===b.fileId);if(r)Object.assign(r,{category:b.category,status:b.status,feedback:b.feedback});return {ok:true};}
  if(b.action==='archive'){const r=s.items.find(r=>r.id===b.id);if(r){r.data.active=false;r.data.enabled=false;r.version++;}return {ok:true};}
  if(b.action==='sendPortal'){const r=s.items.find(r=>r.id===b.id);if(r){r.data.status='Sent in portal';r.version++;}return {ok:true};}
  if(b.action==='queueMessages'){const template=s.items.find(r=>r.id===b.templateId);for(const leadId of b.leadIds)save(s.items,{type:'message',data:{...template?.data,leadId,status:'Draft',direction:'Outbound',author:profile.name}},scope);return {created:b.leadIds.length,skipped:0};}
  if(b.action==='feePlan'){for(let i=0;i<b.count;i++)save(s.items,{type:'fee',data:{...b,title:b.title+' · '+(i+1),amount:b.amount/b.count,dueDate:isoDay(new Date(new Date(b.firstDueDate).getTime()+i*b.intervalDays*86400000)),reference:'PREVIEW-'+(i+1)}},scope);return {created:b.count};}
 }
 if(path==='/api/departments'){
  if(!b)return {records:s.departments.filter(r=>r.department===q.get('department')&&!r.archived),events:s.activities,next:null};
  if(b.action==='initialize')return {ok:true};
  if(b.action==='save'){const r=save(s.departments,b,scope,makeDepartmentSchema(b.type));audit(s,{...b,id:r.id},'Saved local department record');return {id:r.id,version:r.version};}
  if(b.action==='archive'||b.action==='restore'){const r=s.departments.find(r=>r.id===b.id);if(r){r.archived=b.action==='archive';r.version++;}return {ok:true};}
 }
 if(path==='/api/intelligence'){
  if(!b)return intelligence(s);
  if(b.action==='askAgent'){const row=wrap({id:crypto.randomUUID(),data:{status:'Completed',message:b.message,question:b.message,answer:{briefing:'Static preview response: review the student’s preferences, agree the next action, and record a follow-up. This text is a local sample; no AI service was contacted.',draft:{body:'Hello, let’s review your study preferences and agree on the next step.'},sources:[],references:[],interpretation:[],recommendations:[],uncertainties:[],nextActions:[]},roleId:roles[0].id}},scope);s.messages.push(row);return row;}
  if(b.action==='savePlan'){s.plan.data.items=b.items;s.plan.version++;return {ok:true};}
  if(b.action==='refreshPlan'){s.plan.version++;return {ok:true};}
  if(b.action==='saveTarget'){const r=save(objects,{...b,type:'target'},scope,intelligenceSchemas.target);return {id:r.id};}
  if(b.action==='refreshNews')return {ok:true};
 }
 if(path==='/api/founder'){
  if(b){if(b.action==='savePreferences')founderPreferences=founderPreferencesSchema.parse(b.data);else if(b.action==='saveConfig')founderConfig=founderDefaults(b.data);else throw Error('This founder action is unavailable in the static preview.');return {ok:true};}
  const counts:any={newLeads:s.records.filter(r=>r.kind==='leads').length,booked:s.records.filter(r=>r.kind==='sessions').length,submitted:s.records.filter(r=>r.kind==='applications').length,enrollments:s.records.filter(r=>r.kind==='leads'&&r.data.stage==='Enrolled').length,revenue:finance(s).summary.claimed,collections:finance(s).summary.collected};
  return {settings:{preferences:founderPreferences,preferencesVersion:1,config:founderConfig,configVersion:1,canConfigure:true},period:{...periodBounds(q.get('period')||'month',profile.timezone),label:'Static preview',through:isoDay(),timezone:profile.timezone},evaluatedAt:stamp(),alerts:[],metrics:FOUNDER_CARDS.map(id=>({id,label:({newLeads:'New leads',booked:'Mentor sessions',submitted:'Applications',enrollments:'Enrollments',revenue:'Commission claims',collections:'Collections'} as any)[id]||id,value:counts[id]||0,previous:null,unit:['revenue','collections'].includes(id)?'INR':'count',snapshot:true,references:[],definition:'Fictional local preview data'})),briefing:[{id:'preview',title:'Fictional workspace overview',text:'Review the sample pipeline and follow-ups. All values come from local UI fixtures.',references:[]}],work:{records:s.records,departments:s.departments,suite:s.items},financialPosition:finance(s).summary,targets:[],members:people,news:{sources:[]},coverage:{mayBePartial:false,note:'Local preview'},diagnostics:{providers:[],lastSuccess:stamp()},references:[]};
 }
 if(path==='/api/people'){
  if(b?.action==='saveUser'){const data=userSchema.parse(b.data),old=people.find(p=>p.email===data.email);if(old){old.data=data;old.name=data.name;old.status=data.status;old.access_version++;}else people.push({name:data.name,email:data.email,role:data.baseRole,status:data.status,access_version:1,data});return {ok:true};}
  if(!b)return {actor:{email:user.email,canOrgConfigure:true,canPrivileged:true},users:people,members:[{...profile,role:'Admin',status:'Active',version:1,data:profile}],objects,events:[],accessLogs:[],audit:s.activities,logs:[],invitations:[],usage:[],memberships:[],credentials:[]};
  if(b.action==='save'){const r=save(objects,b,scope,intelligenceSchemas[b.type]);return {id:r.id};}
  throw Error('Account invitations and access changes are unavailable in the UI preview.');
 }
 if(path==='/api/student-flow'){
  const mode=q.get('mode'),leadId=b?.data?.leadId||b?.leadId||id;
  if(!b){if(mode==='catalogue')return {items:s.items.filter(r=>r.type==='flowProgramme'),hasMore:false,nextCursor:'',capabilities,today:isoDay()};if(mode==='finance')return finance(s);if(mode==='references')return {applications:linked(s.records,id).filter(r=>r.kind==='applications'),opportunities:linked(s.departments,id).filter(r=>r.type==='salesOpportunity')};if(mode==='mentor')return {sessions:s.records.filter(r=>r.kind==='sessions'),reviews:s.items.filter(r=>r.type==='flowMentorReview'),handoffs:s.items.filter(r=>r.type==='flowHandoff'),capabilities};return flow(s,id);}
  const types:any={programme:'flowProgramme',shortlist:'flowShortlist',handoff:'flowHandoff',mentorReview:'flowMentorReview',outcome:'flowOutcome',commissionEntry:'flowCommissionEntry'};
  if(types[b.action]){const r=save(s.items,{...b,id:b.id,type:types[b.action]},scope,b.action==='programme'?programmeSchema:undefined);audit(s,{...b,id:r.id},'Saved local student journey item');return {id:r.id,version:r.version};}
  const row=s.items.find(r=>r.id===b.id);if(!row)throw Error('Preview item not found.');if(b.action==='shareShortlist'){row.data.shared=true;row.data.sharedAt=stamp();}else if(b.action==='shortlistDecision'){row.data.decision=b.decision;row.data.decisionComment=b.comment;}else if(b.action==='handleHandoff')row.data.status=b.operation==='Complete'?'Completed':b.operation==='Accept'?'Accepted':'Returned';else if(b.action==='convertShortlist'){const p=row.data.programme||row.data.snapshot||{};const application=save(s.records,{kind:'applications',data:{leadId:row.leadId,university:p.university||'Sample university',program:p.name||'Sample programme',country:p.country||'United Kingdom',intake:p.intake||'September 2027',owner:profile.name,stage:'Preparing'}},scope);row.data.applicationId=application.id;row.version++;return {applicationId:application.id};}else throw Error('This action is unavailable in the static preview.');row.version++;return {id:row.id};
 }
 if(path==='/api/portal'){
  const f=flow(s,id||'demo-flow-student'),lead=f.lead,items=linked(s.items,lead.id),of=(type:string)=>items.filter(r=>r.type===type);const existing=of('profile')[0];
  if(!b)return {mode:q.get('mode')==='partner'?'partner':'student',preview:true,canEdit:true,leadId:lead.id,student:lead.data,lead,fields:defaultProfileFields,profile:{id:existing?.id,version:existing?.version,values:existing?.data.values||{},status:existing?.data.status||'Draft',feedback:''},completion:completion(existing?.data,[...defaultProfileFields]),requiredDocuments:s.config.requiredDocuments,documents:s.files.filter(r=>r.leadId===lead.id),applications:f.records.filter(r=>r.kind==='applications').map(r=>r.data),services:f.records.filter(r=>r.kind==='services').map(r=>r.data),fees:of('fee').map(r=>({...r,...r.data,paid:0})),learning:[],messages:of('message').map(r=>({...r,...r.data})),shortlists:f.shortlists.map(r=>({...r.data,id:r.id,version:r.version,current:r.current})),cases:s.partnerCases,outcomes:f.outcomes.map(r=>r.data),partner:{name:'Sample loan partner',status:'In review'},requests:[]};
  if(b.action==='partnerStatus'){const row=s.partnerCases.find(r=>r.grantId===b.grantId);if(row){row.status=b.status;row.note=b.note;row.version++;}return {ok:true};}
  if(b.action==='message'){const r=save(s.items,{type:'message',data:{leadId:lead.id,body:b.body,channel:'Portal',author:lead.data.name,direction:'Inbound',status:'Received in portal'}},scope);return {id:r.id};}
  if(b.action==='shortlistDecision'){const r=s.items.find(r=>r.id===b.id);if(r){r.data.decision=b.decision;r.version++;}return {ok:true};}
  const r=save(s.items,{id:existing?.id,version:existing?.version,type:'profile',data:{leadId:lead.id,values:b.values||{},status:b.submit?'Submitted':'Draft'}},scope);return {id:r.id};
 }
 if(path==='/api/engagement'){
  if(!b)return {items:s.engagement,jobs:[],events:[],counts:[],campaignVariants:[],campaignSignals:[],metrics:[],campaignCounts:[],costs:[],settings:s.settings,integrations:[],marketingChannels:Object.fromEntries(['email','whatsapp','call','sms','voice'].map(c=>[c,{state:'Static preview',capabilities:{},voices:[],templates:[],optOut:{}}])),limits:{items:2000,jobs:500,events:300}};
  if(b.action==='save'){const r=save(s.engagement,b,scope,objectSchemas[b.type]);return {id:r.id};}
  if(b.action==='audience')return {eligible:s.records.filter(r=>r.kind==='leads').map(r=>({id:r.id,...r.data})),excluded:[],counts:{eligible:s.records.filter(r=>r.kind==='leads').length},providerRequirements:[]};
  if(b.action==='draftMarketing')return {subject:'Your next study abroad step',body:'Static sample: book a mentor session to explore your study options.',variants:[]};
  throw Error('Static preview: external delivery, provider setup and background jobs are disabled.');
 }
 if(path==='/api/founder/speech')throw Error('Cloud speech is unavailable in this UI preview. Choose a device voice.');
 if(path==='/api/marketing/assets')throw Error('Static preview: cloud speech generation is unavailable. Choose a local audio file.');
 throw Error('This action is unavailable in the static UI preview.');
}

// STATIC UI: Response-compatible local adapter, explicitly imported at former fetch sites.
export async function staticFetch(input:string,init:RequestInit={}):Promise<Response>{
 if(init.signal?.aborted)throw new DOMException('Aborted','AbortError');
 const url=new URL(input,'http://preview.local');
 try{const form=init.body instanceof FormData?init.body:undefined;const body=typeof init.body==='string'?JSON.parse(init.body):undefined;
  if(url.pathname==='/api/export'){const scope=body?.scope==='live'?'live':'demo',s=stores[scope],rows=(body.source==='departments'?s.departments:body.source==='engagement'?[]:body.source==='suite'?s.items:s.records).filter(r=>(!body.kind||r.kind===body.kind||r.type===body.kind)&&(!body.ids?.length||body.ids.includes(r.id)));const keys=[...new Set(rows.flatMap(r=>Object.keys(r.data)))];return new Response(csvEncode([keys,...rows.map(r=>keys.map(k=>typeof r.data[k]==='object'?JSON.stringify(r.data[k]):r.data[k]??''))]),{headers:{'Content-Type':'text/csv'}});}
  const result=await dispatch(url,body,form);if(result===undefined)throw Error('This action is unavailable in the static UI preview.');return Response.json(result);
 }catch(e:any){return Response.json({error:e.message||'Preview action could not complete.'},{status:400});}
}
export function staticDownload(path:string){
 const u=new URL(path,'http://preview.local'),s=stores[u.searchParams.get('scope')==='live'?'live':'demo'],id=u.searchParams.get('id')||u.searchParams.get('download');const file=s.files.find(f=>f.id===id);const a=document.createElement('a');if(file){a.href=file.url;a.download=file.name;}else {a.href=URL.createObjectURL(new Blob(['Student ID · fictional UI preview\nThis is a sample download. No backend or student documents are connected.'],{type:'text/plain'}));a.download='student-id-preview.txt';setTimeout(()=>URL.revokeObjectURL(a.href),1000);}a.click();
}

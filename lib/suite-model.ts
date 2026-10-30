import {z} from 'zod';
import {socialSchemas} from './social-model';
import {STAGES,DEPARTMENTS,COUNTRIES} from './crm-model';

const text=z.string().trim().max(500), required=text.min(1), note=z.string().trim().max(10000).default('');
const amount=z.coerce.number().finite().min(0).max(1000000000).refine(v=>Math.abs(v*100-Math.round(v*100))<0.0001,'Use no more than two decimal places');
const date=z.string().refine(v=>!v||/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v)),'Enter a valid date').default('');
const url=z.string().max(2000).refine(v=>!v||/^https:\/\//i.test(v),'Use an https:// address').default('');
export const channels=['Email','SMS','WhatsApp','Portal'] as const;
export const operators=['equals','not equals','contains','greater than','less than','on or after','on or before','is empty','is not empty'] as const;
export const conditionSchema=z.object({field:required,operator:z.enum(operators),value:text.default('')});
export type Condition=z.infer<typeof conditionSchema>;
export type SuiteItem={id:string;type:string;leadId:string|null;data:any;version:number;createdAt:string;updatedAt:string};
export const defaultProfileFields=[
 {key:'dateOfBirth',label:'Date of birth',section:'Personal',type:'date',required:true},
 {key:'address',label:'Residential address',section:'Personal',type:'textarea',required:true},
 {key:'nationality',label:'Nationality',section:'Personal',type:'text',required:true},
 {key:'parentName',label:'Parent / guardian name',section:'Family',type:'text',required:true},
 {key:'parentPhone',label:'Parent / guardian phone',section:'Family',type:'text',required:true},
 {key:'qualification',label:'Highest qualification',section:'Academics',type:'text',required:true},
 {key:'institution',label:'School / university',section:'Academics',type:'text',required:true},
 {key:'graduationYear',label:'Graduation year',section:'Academics',type:'number',required:true},
 {key:'grade',label:'Grade / percentage / GPA',section:'Academics',type:'text',required:true},
 {key:'exam',label:'Language / international exam',section:'Exams',type:'select',options:['Not taken','IELTS','TOEFL','PTE','Duolingo','GRE','GMAT','Other'],required:true},
 {key:'examScore',label:'Exam score',section:'Exams',type:'text',required:false},
 {key:'workExperience',label:'Work experience',section:'Academics',type:'textarea',required:false},
] as const;
export const defaultConfiguration={
 leadStages:[...STAGES], applicationStages:['Draft','Documents pending','Submitted','Conditional offer','Unconditional offer','Deposit paid','Visa filed','Visa approved','Enrolled','Rejected'],
 subStages:{'Contacted':['Callback requested','Counselling in progress'],'Nurture':['Future intake','Needs more time'],'Closed lost':['Not interested','Wrong number','Applied elsewhere','Budget constraints']},
 scoring:{repeat:5,connectedCall:3,completedSession:8,application:10,enrolled:15,optOut:-20,bounce:-5,opened:2,replied:5},
 requiredDocuments:['Passport','Transcripts','Statement of purpose','Recommendation letters','Test score'],
 dashboardWidgets:['funnel','productivity','attribution','communication','hourly','completion'],
};
const match=z.enum(['All','Any']).default('All');
const criteria=z.array(conditionSchema).max(20).default([]);
const actionSchema=z.object({type:z.enum(['Create task','Notify owner','Prepare message','Assign course']),title:text.default(''),days:z.coerce.number().int().min(0).max(365).default(1),templateId:text.default(''),courseId:text.default('')});
export const suiteSchemas={
 ...socialSchemas,
 field:z.object({name:required,key:z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,47}$/,'Use letters, numbers and underscores; start with a letter'),entity:z.enum(['Lead','Application']),section:text.default('Additional details'),type:z.enum(['text','textarea','number','date','select','checkbox']),options:z.array(text).max(50).default([]),required:z.boolean().default(false),studentVisible:z.boolean().default(true),active:z.boolean().default(true)}),
 view:z.object({name:required,ownerId:text.default(''),visibility:z.enum(['Private','Team']).default('Private'),columns:z.array(text).min(1).max(30),match,criteria}),
 assignment:z.object({name:required,enabled:z.boolean().default(true),priority:z.coerce.number().int().min(1).max(100).default(10),match,criteria,strategy:z.enum(['Round robin','First owner']).default('Round robin'),owners:z.array(required).min(1).max(50),department:z.enum(DEPARTMENTS).default('Sales')}),
 workflow:z.object({name:required,enabled:z.boolean().default(false),event:z.enum(['Lead created','Lead updated','Application updated','Scheduled','Recurring']),match,criteria,actions:z.array(actionSchema).min(1).max(6),scheduledAt:z.string().default(''),intervalDays:z.coerce.number().int().min(1).max(365).default(15)}).superRefine((v,c)=>{if(['Scheduled','Recurring'].includes(v.event)&&isNaN(Date.parse(v.scheduledAt)))c.addIssue({code:'custom',path:['scheduledAt'],message:'Choose the first run date and time'});}),
 template:z.object({name:required,channel:z.enum(channels),purpose:z.enum(['Service','Marketing']).default('Service'),subject:text.default(''),body:note.refine(Boolean,'Enter a message'),providerReference:text.default('')}),
 enquiry:z.object({leadId:required,source:required,campaign:text.default(''),utmSource:text.default(''),utmMedium:text.default(''),utmCampaign:text.default(''),notes:note}),
 call:z.object({leadId:required,owner:required,direction:z.enum(['Inbound','Outbound']),outcome:z.enum(['Connected','No answer','Busy','Wrong number','Voicemail']),durationSeconds:z.coerce.number().int().min(0).max(86400).default(0),calledAt:z.string().refine(v=>!isNaN(Date.parse(v)),'Choose a time'),recordingUrl:url,notes:note}),
 message:z.object({leadId:required,channel:z.enum(channels),purpose:z.enum(['Service','Marketing']).default('Service'),subject:text.default(''),body:note.refine(Boolean,'Enter a message'),status:z.enum(['Draft','Needs connection','Sent in portal','External draft opened','Received in portal']).default('Draft'),author:text.default(''),direction:z.enum(['Inbound','Outbound']).default('Outbound'),templateId:text.default(''),delivery:z.enum(['Not tracked','Reported sent','Reported delivered','Reported opened','Reported replied','Reported bounced','Reported failed']).default('Not tracked')}),
 fee:z.object({leadId:required,title:required,amount:amount.refine(v=>v>0,'Amount must be greater than zero'),taxPercent:z.coerce.number().min(0).max(100).default(0),dueDate:date.refine(Boolean,'Choose a due date'),expiresOn:date,reference:text.default(''),paymentUrl:url,notes:note}),
 receipt:z.object({leadId:required,feeId:required,amount:amount.refine(v=>v>0,'Amount must be greater than zero'),paidOn:date.refine(Boolean,'Choose a payment date'),method:z.enum(['Bank transfer','UPI','Cash','Card','Other']),reference:required,notes:note}),
 profile:z.object({leadId:required,values:z.record(z.union([z.string().max(10000),z.number().finite(),z.boolean()])).default({}),status:z.enum(['Draft','Submitted','Changes requested','Verified']).default('Draft'),feedback:note}),
 course:z.object({name:required,url,description:note,category:z.enum(['Pre-departure','Language preparation','Career readiness','Other']).default('Pre-departure'),active:z.boolean().default(true)}),
 learning:z.object({leadId:required,courseId:required,status:z.enum(['Assigned','Started','Completed']).default('Assigned'),dueDate:date,notes:note}),
 partner:z.object({leadId:required,serviceId:required,email:z.string().email().transform(v=>v.toLowerCase()),documentIds:z.array(required).max(100).default([]),status:z.enum(['Active','Revoked']).default('Active'),consentConfirmed:z.literal(true,{errorMap:()=>({message:'Confirm permission to share the selected documents'})}),notes:note}),
 notification:z.object({leadId:text.default(''),title:required,body:note,owner:text.default('All'),readBy:z.array(text).default([])}),
 configuration:z.object({leadStages:z.array(required).min(2).max(30),applicationStages:z.array(required).min(2).max(30),subStages:z.record(z.array(text).max(40)),scoring:z.object({repeat:z.coerce.number().min(-100).max(100),connectedCall:z.coerce.number().min(-100).max(100),completedSession:z.coerce.number().min(-100).max(100),application:z.coerce.number().min(-100).max(100),enrolled:z.coerce.number().min(-100).max(100),optOut:z.coerce.number().min(-100).max(100),bounce:z.coerce.number().min(-100).max(100),opened:z.coerce.number().min(-100).max(100),replied:z.coerce.number().min(-100).max(100)}),requiredDocuments:z.array(required).max(25),dashboardWidgets:z.array(z.enum(['funnel','productivity','attribution','communication','hourly','completion'])).min(1)}).superRefine((v,c)=>{for(const k of ['leadStages','applicationStages'] as const)if(new Set(v[k]).size!==v[k].length)c.addIssue({code:'custom',path:[k],message:'Remove duplicate stages'});}),
};
export type SuiteType=keyof typeof suiteSchemas;
export function matchConditions(data:any,conditions:Condition[],mode='All'){
 const test=(c:Condition)=>{const raw=c.field.startsWith('custom.')?data.custom?.[c.field.slice(7)]:data[c.field];const value=String(raw??'').toLowerCase(),wanted=c.value.toLowerCase();switch(c.operator){case'equals':return value===wanted;case'not equals':return value!==wanted;case'contains':return value.includes(wanted);case'greater than':return raw!==''&&raw!=null&&Number.isFinite(Number(raw))&&Number(raw)>Number(c.value);case'less than':return raw!==''&&raw!=null&&Number.isFinite(Number(raw))&&Number(raw)<Number(c.value);case'on or after':return !!value&&value>=wanted;case'on or before':return !!value&&value<=wanted;case'is empty':return raw==null||raw==='';case'is not empty':return raw!=null&&raw!=='';}return false;};
 return !conditions.length||(mode==='Any'?conditions.some(test):conditions.every(test));
}
export function renderTemplate(body:string,lead:any){const values:any={name:lead.name,country:lead.country,intake:lead.intake,course:lead.course,owner:lead.owner,stage:lead.stage,company:'Student ID'};return body.replace(/\{\{\s*(\w+)\s*\}\}/g,(m,k)=>values[k]??m);}
export function moneyCents(n:number){return Math.round(Number(n)*100);}
export function feeTotal(f:any){return Math.round(moneyCents(f.amount)*(1+f.taxPercent/100))/100;}
export function splitInstalments(total:number,count:number){const cents=moneyCents(total),base=Math.floor(cents/count);return Array.from({length:count},(_,i)=>(base+(i<cents%count?1:0))/100);}
export function profileFields(items:SuiteItem[]){return [...defaultProfileFields.map(f=>({...f,studentVisible:true,active:true})),...items.filter(x=>x.type==='field'&&x.data.entity==='Application'&&x.data.active).map(x=>({key:x.data.key,label:x.data.name,...x.data}))] as any[];}
export function completion(profile:any,fields:any[]){const requiredFields=fields.filter(x=>x.required&&x.active!==false);const completed=requiredFields.filter(f=>{const v=profile?.values?.[f.key];return v!==undefined&&v!==null&&v!==''&&(f.type!=='checkbox'||v===true);}).length;return {completed,total:requiredFields.length,percent:requiredFields.length?Math.round(completed/requiredFields.length*100):100};}
export function leadSignals(lead:any,items:SuiteItem[],records:any[],config:any=defaultConfiguration){
 const calls=items.filter(x=>x.type==='call'&&x.leadId===lead.id),enquiries=items.filter(x=>x.type==='enquiry'&&x.leadId===lead.id);const messages=items.filter(x=>x.type==='message'&&x.leadId===lead.id);const s=config.scoring;const repeats=enquiries.length;const parts=[['Repeat enquiries',repeats*s.repeat],['Connected calls',calls.filter(x=>x.data.outcome==='Connected').length*s.connectedCall],['Completed mentoring',records.filter(x=>x.kind==='sessions'&&x.data.leadId===lead.id&&x.data.status==='Completed').length*s.completedSession],['Applications',records.filter(x=>x.kind==='applications'&&x.data.leadId===lead.id).length*s.application],['Enrolment',lead.data.stage==='Enrolled'?s.enrolled:0],['Opt-out',lead.data.consent==='Opted out'?s.optOut:0],['Reported email bounces',messages.filter(x=>x.data.delivery==='Reported bounced').length*s.bounce],['Reported opens',messages.filter(x=>x.data.delivery==='Reported opened').length*s.opened],['Reported replies',messages.filter(x=>x.data.delivery==='Reported replied').length*s.replied]] as [string,number][];
 return {score:parts.reduce((n,x)=>n+x[1],0),parts,calls:calls.length,duration:calls.reduce((n,x)=>n+x.data.durationSeconds,0),enquiries:repeats+1,pst:repeats===0?'P':repeats===1?'S':'T',touched:!!lead.data.touchedAt||calls.length>0||lead.data.stage!=='New enquiry',lastActivity:lead.updatedAt};
}
export const filterFields=['name','email','phone','city','country','language','intake','course','stage','subStage','department','owner','source','priority','consent','pool','verification','utmSource','utmMedium','utmCampaign','adGroup','device','gender','score','enquiries','touched','createdAt','updatedAt','budget'];
export const leadColumns=['name','email','phone','country','intake','course','stage','subStage','owner','department','source','priority','score','pst','enquiries','touched','calls','duration','verification','language','utmSource','utmCampaign','createdAt'];
export const columnLabels:Record<string,string>={name:'Student',email:'Email',phone:'Phone',country:'Destination',intake:'Intake',course:'Course',stage:'Stage',subStage:'Substage',owner:'Owner',department:'Department',source:'Source',priority:'Priority',score:'Score',pst:'P/S/T',enquiries:'Enquiries',touched:'Contacted',calls:'Calls',duration:'Call seconds',verification:'Verification',language:'Language',utmSource:'UTM source',utmCampaign:'UTM campaign',createdAt:'Created'};

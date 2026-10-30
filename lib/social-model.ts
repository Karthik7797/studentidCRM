import {z} from 'zod';

export const platformIds=['instagram','tiktok','youtube','pinterest','snapchat','x','linkedin','threads','reddit','facebook'] as const;
export type PlatformId=typeof platformIds[number];
export const platforms: {id:PlatformId;name:string;category:'Visual Media'|'Text Media';description:string;color:string;formats:string[]}[]=[
 {id:'instagram',name:'Instagram',category:'Visual Media',description:'Reels, stories & carousels',color:'#E1306C',formats:['Reel','Carousel','Story','Post']},
 {id:'tiktok',name:'TikTok',category:'Visual Media',description:'Short-form video',color:'#171717',formats:['Video','Photo post']},
 {id:'youtube',name:'YouTube',category:'Visual Media',description:'Videos & Shorts',color:'#FF0033',formats:['Video','Short','Community post']},
 {id:'pinterest',name:'Pinterest',category:'Visual Media',description:'Pins & inspiration',color:'#E60023',formats:['Pin','Video pin']},
 {id:'snapchat',name:'Snapchat',category:'Visual Media',description:'Stories & Spotlight',color:'#171717',formats:['Story','Spotlight']},
 {id:'x',name:'X (Twitter)',category:'Text Media',description:'Posts & conversations',color:'#171717',formats:['Post','Thread','Video']},
 {id:'linkedin',name:'LinkedIn',category:'Text Media',description:'Insights & professional stories',color:'#0A66C2',formats:['Post','Document','Video','Article']},
 {id:'threads',name:'Threads',category:'Text Media',description:'Ideas & discussions',color:'#171717',formats:['Post','Thread']},
 {id:'reddit',name:'Reddit',category:'Text Media',description:'Communities & conversations',color:'#FF4500',formats:['Text post','Link post','Image post']},
 {id:'facebook',name:'Facebook',category:'Text Media',description:'Community, posts & Reels',color:'#0866FF',formats:['Post','Reel','Story','Video']},
];
export const getPlatform=(id:string)=>platforms.find(p=>p.id===id);
export const platformFromPath=(path:string)=>getPlatform(path.match(/^\/marketing\/([^/]+)\/?$/)?.[1]||'')?.id||'';
export const socialHref=(id:string,scope:string)=>`/marketing/${id}?workspace=${scope}`;
const text=z.string().trim().max(500), required=text.min(1);
const amount=z.coerce.number().finite().min(0).max(1e9).refine(v=>Math.abs(v*100-Math.round(v*100))<.0001,'Use at most two decimal places');
const count=z.coerce.number().int().min(0).max(1e12);
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!isNaN(Date.parse(v))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v,'Choose a valid date');
const https=z.string().max(2000).refine(v=>{if(!v)return true;try{return new URL(v).protocol==='https:';}catch{return false;}},'Use a valid https:// URL').default('');
export const socialSchemas={
 socialPost:z.object({platform:z.enum(platformIds),title:required,format:required,caption:z.string().trim().max(10000).default(''),hashtags:z.array(z.string().max(80)).max(30).default([]),prompt:z.string().max(4000).default(''),mediaIds:z.array(z.string().uuid()).max(6).default([]),status:z.enum(['Draft','Scheduled','Published']).default('Draft'),scheduledAt:z.string().default(''),autoPublish:z.boolean().default(false),publishedUrl:https}).superRefine((v,c)=>{
  if(!getPlatform(v.platform)?.formats.includes(v.format))c.addIssue({code:'custom',path:['format'],message:'Choose a format for this platform'});
  if(v.status!=='Draft'&&(!v.scheduledAt||isNaN(Date.parse(v.scheduledAt))))c.addIssue({code:'custom',path:['scheduledAt'],message:'Choose a valid date and time'});
  if(v.status==='Published'&&!v.publishedUrl)c.addIssue({code:'custom',path:['publishedUrl'],message:'Add the published post URL to record a manual publication'});
  if(v.status==='Scheduled'&&!v.caption&&!v.mediaIds.length)c.addIssue({code:'custom',path:['caption'],message:'Add a caption or media before scheduling'});
 }),
 socialRevenue:z.object({platform:z.enum(platformIds),title:required,category:z.enum(['Direct monetization','Sponsorship','Affiliate']),amount,date:day,status:z.enum(['Received','Expected']).default('Received'),url:https,clicks:count.default(0),conversions:count.default(0)}),
 socialAd:z.object({platform:z.enum(platformIds),title:required,date:day,spend:amount,impressions:count,clicks:count,ageGroup:z.enum(['18–24','25–34','35–44','45+','Unspecified']).default('Unspecified'),audience:required,status:z.enum(['Active','Paused','Completed']).default('Active')}).refine(v=>v.clicks<=v.impressions,{path:['clicks'],message:'Clicks cannot exceed impressions for this daily record'}),
};
export type SocialPost=z.infer<typeof socialSchemas.socialPost>;
export function istDay(date=new Date()){return new Date(date.getTime()+19800000).toISOString().slice(0,10);}
export function toISTFields(value:string){const dt=new Date(value);if(!value||isNaN(dt.getTime()))return {date:istDay(),time:'10:00'};const s=new Date(dt.getTime()+19800000).toISOString();return {date:s.slice(0,10),time:s.slice(11,16)};}
export function adMetrics(rows:{spend:number;clicks:number;impressions:number}[]){const totals=rows.reduce((a,r)=>({spend:a.spend+r.spend,clicks:a.clicks+r.clicks,impressions:a.impressions+r.impressions}),{spend:0,clicks:0,impressions:0});return {...totals,cpc:totals.clicks?totals.spend/totals.clicks:null,ctr:totals.impressions?totals.clicks/totals.impressions*100:null};}
export function suggestHashtags(topic:string){const known=[['uk','#StudyInUK'],['canada','#StudyInCanada'],['australia','#StudyInAustralia'],['germany','#StudyInGermany'],['scholarship','#Scholarships'],['career','#CareerGuidance'],['mentor','#MentorSessions'],['visa','#StudentVisa'],['ireland','#StudyInIreland'],['university','#UniversityLife']];const lower=topic.toLowerCase();return [...new Set(['#StudentID','#StudyAbroad',...known.filter(([word])=>lower.includes(word)).map(([,tag])=>tag),'#InternationalStudents'])].slice(0,8);}

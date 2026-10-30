import {loadPreviewModule} from './load-preview.mjs';
import assert from 'node:assert/strict';

try {
 const {staticFetch}=await import(loadPreviewModule('lib/static-data.ts'));
 const call=async(path,body)=>{const r=await staticFetch(path,body?{method:'POST',body:JSON.stringify(body)}:{});const d=await r.json();assert.equal(r.ok,true,JSON.stringify(d));return d;};
 const demo=await call('/api/workspace?scope=demo');assert.ok(demo.records.length>50);
 assert.equal((await call('/api/workspace?scope=live')).records.length,0);
 const lead=demo.records.find(r=>r.kind==='leads');const updated=await call('/api/records',{scope:'demo',id:lead.id,version:lead.version,kind:'leads',data:{...lead.data,name:'Local preview edit'}});
 assert.equal(updated.version,lead.version+1);
 assert.equal((await call('/api/workspace?scope=live')).records.length,0);
 const conflict=await staticFetch('/api/records',{method:'POST',body:JSON.stringify({scope:'demo',id:lead.id,version:lead.version,kind:'leads',data:lead.data})});assert.equal(conflict.status,400);
 for(const path of ['/api/suite?scope=demo','/api/intelligence?scope=demo','/api/people','/api/departments?scope=demo&department=hr','/api/student-flow?scope=demo&leadId=demo-flow-student','/api/student-flow?scope=demo&mode=finance','/api/portal?scope=demo','/api/engagement?scope=demo'])await call(path);
 const portal=await call('/api/portal?scope=demo');assert.equal(typeof portal.completion.percent,'number');assert.ok(portal.shortlists.every(r=>r.snapshot&&r.id));
 const people=await call('/api/people');assert.ok(people.actor.canOrgConfigure);assert.ok(people.users.every(u=>u.data));
 assert.ok(people.objects.filter(o=>o.type==='permissionProfile').every(o=>o.data?.name&&o.data?.rules));
 const founder=await call('/api/founder?scope=demo');assert.ok(founder.settings.preferences.cards.length);assert.ok(founder.metrics.length);
 const ai=await call('/api/intelligence',{scope:'demo',action:'askAgent',message:'What next?'});assert.match(ai.data.answer.briefing,/Static preview/);
 const noDelivery=await staticFetch('/api/engagement',{method:'POST',body:JSON.stringify({scope:'demo',action:'queueCampaign'})});assert.equal(noDelivery.status,400);
 console.log('Static UI checks passed: fixtures, scope isolation, local edits, stale versions, workspace contracts, sample AI, disabled delivery.');
}finally{}

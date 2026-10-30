// STATIC UI: API/backend calls are replaced by the local preview data adapter.
import {staticFetch} from '@/lib/static-data';
'use client';
import React,{createContext,useContext,useEffect,useState,useCallback,useRef} from 'react';
import {toast} from 'sonner';
import {defaultConfiguration,type SuiteItem} from '@/lib/suite-model';
export async function suiteApi(path:string,body?:any){const r=await staticFetch(path,{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});const value:any=await r.json();if(!r.ok)throw Error(value.error||'Could not complete this action.');return value;}
const Context=createContext<any>(null);
export function useSuite(){return useContext(Context);}
export function SuiteProvider({scope,records,user,refresh,children}:any){const [data,setData]=useState<any>({items:[],runs:[],config:defaultConfiguration,userId:''}),[loading,setLoading]=useState(true),[error,setError]=useState('');const request=useRef(0);const role=user.role;const load=useCallback(async()=>{const id=++request.current;try{const d=await suiteApi('/api/suite?scope='+scope);if(request.current===id){setData(d);setError('');setLoading(false);}return d;}catch(e:any){if(request.current===id){setError(e.message);setLoading(false);}throw e;}},[scope]);
 useEffect(()=>{setLoading(true);setData({items:[],runs:[],config:defaultConfiguration,userId:''});load().catch(()=>{});return()=>{request.current++;};},[load,user.role,records]);
 useEffect(()=>{if(!['Admin','Staff','Marketing'].includes(role))return;let active=true;const tick=async()=>{if(document.hidden)return;try{await suiteApi('/api/suite',{scope,action:'tick'});if(active){await load();await refresh();}}catch{}};const timer=setInterval(tick,60000);return()=>{active=false;clearInterval(timer);};},[scope,role,load,refresh]);
 const mutate=async(body:any)=>{const result=await suiteApi('/api/suite',{...body,scope});const refreshed=await Promise.allSettled([load(),refresh()]);if(refreshed.some(r=>r.status==='rejected'))toast.warning('Saved successfully. Some workspace data could not refresh; refresh before making another change.');return result;};
 const save=async(type:string,values:any,record?:SuiteItem)=>mutate({action:'save',type,data:values,...(record?{id:record.id,version:record.version}:{})});
 const value={...data,scope,records,user,loading,error,load,mutate,save,refresh,canEdit:['Admin','Staff','Marketing'].includes(role),canUsePool:['Admin','Marketing'].includes(role)};
 return <Context.Provider value={value}>{error&&<div role="alert" className="suite-callout">Operations features could not load: {error}<button className="btn" onClick={()=>load().catch(()=>{})}>Retry</button></div>}{children}</Context.Provider>;
}

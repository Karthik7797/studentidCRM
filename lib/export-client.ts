// STATIC UI: API/backend calls are replaced by the local preview data adapter.
import {staticFetch} from '@/lib/static-data';
import {toast} from 'sonner';
export async function exportRecords(scope:string,source:string,kind:string,ids:string[],filename:string){try{const r=await staticFetch('/api/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({scope,source,kind,ids})});if(!r.ok){const d:any=await r.json();throw Error(d.error||'Export unavailable.');}const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast.success('Local preview records exported');}catch(e:any){toast.error(e.message);}}

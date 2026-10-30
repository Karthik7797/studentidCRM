import {useEffect} from 'react';
import {animate,stagger,useReducedMotion} from 'motion/react';

export function useWorkspaceMotion(view:string,ready=true){
  const reducedMotion=useReducedMotion();
  useEffect(()=>{window.scrollTo({top:0,left:0,behavior:'instant'});},[view]);
  useEffect(()=>{
    if(reducedMotion||!ready)return;
    const heading=document.querySelector('#workspace-content .page-heading');
    if(!heading)return;
    const parts=Array.from(heading.children);
    const playback=animate(parts,{opacity:[.6,1],y:[5,0]},{duration:.24,delay:stagger(.035),ease:[.22,1,.36,1]});
    return ()=>{playback.stop();parts.forEach(part=>{(part as HTMLElement).style.removeProperty('opacity');(part as HTMLElement).style.removeProperty('transform');});};
  },[view,ready,reducedMotion]);
}

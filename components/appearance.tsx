'use client';

import {useId,useSyncExternalStore,type ReactNode} from 'react';
import {ThemeProvider,useTheme} from 'next-themes';
import {Moon,Sun} from 'lucide-react';
import {Toaster} from 'sonner';
import {Switch} from '@/components/ui/switch';

const subscribeToHydration=()=>()=>{};
const clientSnapshot=()=>true;
const serverSnapshot=()=>false;

export function AppearanceProvider({children}:{children:ReactNode}){
  return <ThemeProvider attribute="class" storageKey="student-id-appearance" defaultTheme="light" enableSystem={false} disableTransitionOnChange>{children}</ThemeProvider>;
}

export function AppearanceSwitch(){
  const {resolvedTheme,setTheme}=useTheme();
  const ready=useSyncExternalStore(subscribeToHydration,clientSnapshot,serverSnapshot);
  const id=useId();
  const dark=ready&&resolvedTheme==='dark';
  return <div className="appearance-control">
    <label htmlFor={id} title="Dim the ambient background and darken the panels">
      {dark?<Moon size={16} aria-hidden="true"/>:<Sun size={16} aria-hidden="true"/>}
      <span>Dim lights</span>
    </label>
    <Switch id={id} aria-label="Dim ambient lighting" checked={dark} disabled={!ready} onCheckedChange={checked=>setTheme(checked?'dark':'light')}/>
  </div>;
}

export function AppearanceToaster(){
  const {resolvedTheme}=useTheme();
  return <Toaster theme={resolvedTheme==='dark'?'dark':'light'} position="bottom-right" richColors closeButton/>;
}

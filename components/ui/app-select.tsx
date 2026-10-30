import * as React from 'react';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from './select';

// Keeps existing field handlers and form names while sharing one accessible menu.
export function AppSelect({children,value,defaultValue,onChange,disabled,required,name,...props}:React.ComponentProps<'select'>){
  const options:{value:string;label:React.ReactNode;disabled:boolean}[]=[];
  function collect(nodes:React.ReactNode){React.Children.forEach(nodes,node=>{
    if(!React.isValidElement(node))return;
    const item=node as React.ReactElement<{value?:string|number;children?:React.ReactNode;disabled?:boolean}>;
    if(item.type==='option')options.push({value:String(item.props.value??item.props.children??''),label:item.props.children,disabled:!!item.props.disabled});
    else if(item.props.children)collect(item.props.children);
  });}
  collect(children);
  const encode=(v:unknown)=>String(v??'')||'__sid_empty__';
  return <Select value={value===undefined?undefined:encode(value)} defaultValue={defaultValue===undefined?undefined:encode(defaultValue)} disabled={disabled} required={required} name={name} onValueChange={next=>{
    const target={value:next==='__sid_empty__'?'':next,name:name||''};
    onChange?.({target,currentTarget:target} as React.ChangeEvent<HTMLSelectElement>);
  }}><SelectTrigger id={props.id} aria-label={props['aria-label']} aria-labelledby={props['aria-labelledby']} aria-describedby={props['aria-describedby']} aria-invalid={props['aria-invalid']} className={'app-select '+(props.className||'')} style={props.style}><SelectValue placeholder="Choose an option"/></SelectTrigger><SelectContent position="popper" align="start">{options.map((option,index)=><SelectItem key={option.value+':'+index} value={encode(option.value)} disabled={option.disabled}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

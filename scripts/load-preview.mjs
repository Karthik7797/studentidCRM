import fs from 'node:fs';
import ts from 'typescript';
import path from 'node:path';
const cache=new Map();
export function loadPreviewModule(file){const full=path.resolve(file);if(cache.has(full))return cache.get(full);let source=fs.readFileSync(full,'utf8').replace(/from ['"](\.[^'"]+)['"]/g,(_,name)=>'from '+JSON.stringify(loadPreviewModule(path.resolve(path.dirname(full),name+'.ts'))));source=source.replace(/from ['"]zod['"]/g,'from '+JSON.stringify(import.meta.resolve('zod')));const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;const url='data:text/javascript;base64,'+Buffer.from(js).toString('base64');cache.set(full,url);return url;}

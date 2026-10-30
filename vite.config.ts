import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath,URL} from 'node:url';
// STATIC UI: Standard Vite SPA replaces the Cloudflare Worker and server runtime.
export default defineConfig({build:{outDir:'ui-dist'},plugins:[react()],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},server:{host:'127.0.0.1'},preview:{host:'127.0.0.1'}});

# Student ID CRM UI

Standalone React + TypeScript + Vite frontend. Existing CRM screens use fictional local data. No backend, authentication, database, cloud storage, or external service credentials are required.

## Run

Use Node 22.13 or newer and pnpm (or prefix commands with corepack).

- pnpm install
- pnpm dev ? local development
- pnpm build ? type check and production build in ui-dist/
- pnpm start ? preview the production build on http://127.0.0.1:8787
- pnpm verify ? static data integration checks
- pnpm exec tsc --noEmit ? type check

## Screens

CRM: /; departments: /sales, /operations, /hr; marketing: /marketing and /marketing/instagram (other existing platform paths also work).
Student portal: /portal?scope=demo. Partner portal: /portal?scope=demo&mode=partner.
Founder dashboard: /?role=founder. The default dashboard previews a counsellor with admin controls.
The demo workspace contains fictional fixtures. The UI's Live workspace is an independent, initially empty local preview; it does not connect to a live system.

## Static replacements and future integration

lib/static-fixtures.ts contains fictional records and examples for the existing screens. lib/static-data.ts supplies their UI contracts, local edits, file object URLs, CSV exports and canned assistant replies. Every former network call explicitly imports staticFetch; route-shaped strings are local lookup keys, not deployed API endpoints. Comments beginning STATIC UI identify the replacements.

Edits and selected files stay in browser memory and reset on reload. External delivery, cloud AI/speech, background jobs, authentication and account invitations are unavailable. Ordinary external website links still open when clicked. Fonts, images and the brand mark are bundled locally.

To reconnect services later, replace the local adapter with a real client and implement server authorization, validated writes, scope isolation, version checks, audits and secure document storage. Client preview roles are display fixtures and provide no security boundary.

Static hosting must serve index.html for non-asset routes so refreshing a department or portal URL works.

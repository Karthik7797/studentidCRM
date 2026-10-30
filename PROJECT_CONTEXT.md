# Student ID CRM: UI-only project context

Read this first. Source is authoritative. This project is now a standalone Vite SPA; the earlier Cloudflare/D1/R2 application has been removed.

## Routing and source map

- index.html -> app/main.tsx -> CRM or Portal. Vite serves the browser app; static hosts need SPA fallback to index.html.
- app/crm.tsx owns staff navigation, CRM forms, filters and dashboards. Department, marketing and portal paths remain available.
- app/portal/portal-client.tsx owns student and partner UI. Default scope is demo.
- app/suite-context.tsx supplies shared UI state. All previous data calls explicitly use staticFetch from lib/static-data.ts; no fetch override or API server exists.
- lib/static-fixtures.ts creates fictional sample records, departmental examples, programme journeys and social content.
- lib/static-data.ts replaces API/auth/database/provider operations with in-memory UI contracts. STATIC UI comments document each replaced boundary. Unsupported provider actions report preview feedback.
- lib/*-model.ts retain browser-safe types, validation, calculations and constants used by the screens.
- components/, hooks/, vendor/ and public/ retain only UI dependencies and assets. app/orbit.css loads last.
- components/ui/app-select.tsx adapts option-based fields to the shared Radix Select. hooks/use-workspace-motion.ts handles short navigation feedback and scroll reset; the entry point supplies MotionConfig with system reduced-motion support. Sidebar navigation folds below 1024px.

## Preview semantics

Demo fixtures and the initially empty Live-labelled preview have separate stores. Both are local and reset on browser reload; no production data or authentication is connected. Local saves validate applicable schemas, check stale versions and append local activity. File selections use object URLs and are never uploaded. Assistant answers are canned samples. External delivery, cloud speech and background processing do not run.

The founder layout can be previewed at /?role=founder; portal at /portal?scope=demo. Preview roles are fictional display state. Reintroducing a backend requires server authorization and the original scope, validation, version and audit guarantees.

## Validation

pnpm exec tsc --noEmit; node scripts/verify-static-ui.mjs; pnpm build. The verifier checks fixtures, scope isolation, local edits, stale versions, workspace contracts, canned AI and disabled delivery. Production output is ui-dist/.

Update this map and knowledge-graph.json after architecture changes. Do not add credentials or student documents to context artifacts.

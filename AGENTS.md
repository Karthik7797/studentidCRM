# Student ID CRM: AI entry point

Read `PROJECT_CONTEXT.md` first. It is the compact, source-checked map of this project. For a targeted task, follow its file routing table, then read only the relevant source and tests. `knowledge-graph.json` contains a portable module graph for tools that can ingest JSON.

Source code is authoritative. `README.md` and the feature documents describe behavior and historical releases, but some navigation and integration descriptions are older than the source export. Do not infer that a configured provider is live.

Core rules: preserve `demo`/`live` scope isolation; enforce authorization on the server; validate writes; keep version checks and audit/event writes; never place credentials or student documents in context artifacts. Add database changes as new migrations in `drizzle/`, without editing published migrations.

After a material architecture change, update `PROJECT_CONTEXT.md` and `knowledge-graph.json`. Run `pnpm exec tsc --noEmit` and the relevant `scripts/verify-*.mjs` check for changed business logic.

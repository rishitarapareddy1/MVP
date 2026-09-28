# Student Project Matching (MVP)

A managed matching service: businesses submit small scoped projects, students prove skills via
assessments, and an admin matches them. Full spec:
[student_project_marketplace_v1_architecture.md](student_project_marketplace_v1_architecture.md).

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in Supabase values
npm run dev                  # http://localhost:3000
```

## Scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Dev server                      |
| `npm test`          | Unit tests (Vitest)             |
| `npm run typecheck` | `tsc --noEmit`                  |
| `npm run lint`      | ESLint                          |
| `npm run format`    | Prettier (with Tailwind sorting) |

## Layout

```
app/                 Routes (App Router)
components/ui/       shadcn/ui components
lib/supabase/        client.ts (browser), server.ts (RSC/actions), admin.ts (service role, server-only)
lib/db/              All database access lives here
lib/validation/      Zod schemas shared by client and server
lib/matching/        Pure scoring + shortlist (Phase 4)
lib/projects/        Status transitions (Phase 2)
lib/format.ts        Money (cents) and America/Chicago date display
lib/result.ts        ActionResult type for server actions
supabase/migrations/ SQL migrations (Phase 1)
```

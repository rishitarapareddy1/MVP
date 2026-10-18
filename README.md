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
| `npm run test:db`   | Database access-rule suite (PGlite, never touches the live DB) |
| `npm run test:e2e`  | Browser smoke tests (Playwright; desktop + phone) |
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

## Deployment

- **App:** Vercel, auto-deploys every push to `main`. Live at https://mvp123-blond.vercel.app
- **Env vars on Vercel:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`, `ALLOWED_STUDENT_EMAIL_DOMAINS`
- **Database:** Supabase project `ikjlyhirletanedflmhw` (shared by local dev and production).
  Apply new migrations with `npm run db:push`, then `npm run db:types`.
- **Auth:** login codes are emailed through custom SMTP (set in the Supabase dashboard). If the
  domain changes, update `site_url` / `additional_redirect_urls` in `supabase/config.toml` and push
  only those settings (see git history for the minimal-config approach).

## Testing

- **Unit tests** (`npm test`): matching score, status rules, metrics, validation, email templates.
- **Database access rules** (`npm run test:db`): rebuilds the schema from `supabase/migrations` +
  `seed.sql` in an in-memory Postgres and checks who can read/write what (RLS, storage policies,
  offer race rules, retake rules, feedback tokens). Run it after every migration.
- **Browser smoke tests** (`npm run test:e2e`): every main page loads (signed out, admin, student),
  guards redirect, no sideways scrolling on phones. Read-only. Point it at production with
  `E2E_BASE_URL=https://mvp123-blond.vercel.app npm run test:e2e`.
  First run: `npx playwright install chromium`.

## Operations

- **Daily job** (`/api/cron/daily`, Vercel Cron, 14:00 UTC): keeps Supabase from auto-pausing and
  expires overdue offers. Protected by `CRON_SECRET`.
- **Error alerts**: unexpected server errors are emailed to `ADMIN_EMAILS` (or `ALERT_EMAILS`) from
  production only, at most once per error per 15 minutes.
- **If the site can't reach the database** (`ENOTFOUND` / `fetch failed` in logs): check whether
  Supabase paused the project and click Restore in the dashboard.


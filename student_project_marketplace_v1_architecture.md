# MVP Spec: Student Project Matching Service

> **For Claude Code:** Read this entire file before writing any code. Build one phase at a time, in order. At the end of each phase, stop, summarize what you built, list anything you were unsure about, and wait for my confirmation before starting the next phase. Do not add dependencies beyond those listed without asking. Prefer simple, readable code over clever abstractions. I am learning this codebase as we go, so add brief comments explaining non-obvious decisions.

---

## 1. What we're building

A **managed matching service**, not an open marketplace.

- **Businesses** submit small, bounded projects (2–10 hours, $50–$500): competitor research, data cleanup, lead lists, market research, spreadsheet work, basic visualizations.
- **Students** (UIUC to start) create a profile and prove skills through short **assessments**, not resumes.
- **An admin (me)** reviews each request, scopes it, and uses a ranked shortlist to pick up to 3 qualified students. Those students get an **offer** they can accept or decline.
- Students **never browse or apply to projects**. This is deliberate: it prevents the "200 applicants per posting" problem.
- We track **outcomes** (repeat work, referrals, interviews, hires) so we can later test whether project work leads to real hiring.

The MVP is **admin-heavy on purpose**. Automation comes later, after we learn what works manually.

### Core principles
1. Manual first, automate later. The admin makes every matching decision; the system only recommends.
2. Every match score must be **explainable** (show the point breakdown, never a bare number).
3. Keep it small. If a feature isn't needed to run 20 real projects, it's out of scope.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router), TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Database + Auth + Storage | Supabase (Postgres, Supabase Auth, Supabase Storage) |
| Validation | Zod |
| Email (Phase 6) | Resend |
| Testing | Vitest (unit tests for matching logic at minimum) |
| Deploy | Vercel |

Use Server Components and Server Actions by default. Use client components only where interactivity requires it.

### Environment variables (`.env.local`, also create `.env.example`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never expose to client
ADMIN_EMAILS=                   # comma-separated list of admin emails
ALLOWED_STUDENT_EMAIL_DOMAINS=illinois.edu
RESEND_API_KEY=                 # Phase 6
```

---

## 3. Users and roles

| Role | How they get in | What they can do |
|---|---|---|
| **Business** | No account in MVP. Submits a public intake form. | Submit a project request. Later: leave feedback via a unique link. |
| **Student** | Magic-link login, restricted to `ALLOWED_STUDENT_EMAIL_DOMAINS`. | Build profile, take assessments, view and respond to offers, view their assigned projects, submit deliverables. |
| **Admin** | Magic-link login; email must be in `ADMIN_EMAILS`. | Everything: review requests, scope projects, grade assessments, run matching, send offers, update statuses, record payments and outcomes. |

Role is stored in `profiles.role`. Admin status is also checked server-side against `ADMIN_EMAILS` on every admin route.

---

## 4. Data model

Create these as Supabase SQL migrations in `supabase/migrations/`. Use `uuid` primary keys (`gen_random_uuid()`), `created_at`/`updated_at` timestamps on every table, and Postgres enums where listed.

### Enums
```sql
create type user_role as enum ('student', 'admin');
create type project_category as enum (
  'market_research', 'competitor_analysis', 'data_cleanup',
  'data_analysis', 'lead_research', 'spreadsheet_work',
  'presentation', 'website_qa', 'social_media_analysis', 'other'
);
create type project_status as enum (
  'submitted',    -- business filled out intake form
  'scoping',      -- admin is clarifying scope/price with business
  'matching',     -- scoped, admin is selecting students
  'offered',      -- offers sent, waiting on responses
  'assigned',     -- a student accepted
  'in_progress',
  'delivered',    -- student submitted deliverable
  'approved',     -- business accepted the work
  'paid',         -- student has been paid
  'closed',       -- feedback + outcomes recorded
  'cancelled'
);
create type offer_status as enum ('pending', 'accepted', 'declined', 'expired', 'withdrawn');
create type assessment_status as enum ('submitted', 'passed', 'failed');
create type outcome_type as enum (
  'repeat_project', 'referral', 'internship_interview', 'job_interview',
  'internship_offer', 'job_offer', 'listed_on_resume', 'other'
);
```

### Tables

**profiles** (1:1 with `auth.users`)
- `id` uuid PK, references `auth.users(id)`
- `role` user_role, default `'student'`
- `email` text, `full_name` text

**students**
- `id` uuid PK, references `profiles(id)`
- `major` text, `graduation_year` int
- `bio` text (short, max 500 chars)
- `skills` text[] (normalized lowercase tags, e.g. `{'excel','sql','python'}`)
- `interested_categories` project_category[]
- `hours_per_week` int (availability)
- `is_available` boolean, default true
- `portfolio_links` text[]
- `resume_path` text, nullable (Supabase Storage)
- `is_active` boolean, default true (admin can deactivate)

**businesses**
- `id` uuid PK
- `name` text, `website` text, `industry` text
- `contact_name` text, `contact_email` text, `contact_phone` text
- `source` text (how they found us, e.g. "linkedin", "warm intro", "walk-in"; needed for outreach tracking)
- `notes` text (admin only)

**projects**
- `id` uuid PK
- `business_id` references `businesses`
- `title` text
- `raw_request` text (what the business originally wrote, never edited)
- `scoped_description` text (admin-written, clear deliverable)
- `deliverable` text (exactly what gets handed over, e.g. "1-page PDF comparing 5 competitors on price, features, target customer")
- `category` project_category
- `required_skills` text[], `preferred_skills` text[]
- `estimated_hours` int
- `budget_cents` int (what business pays)
- `student_pay_cents` int (what student receives)
- `deadline` date
- `is_starter` boolean (starter projects favor students with little/no experience)
- `status` project_status, default `'submitted'`
- `assigned_student_id` references `students`, nullable
- `feedback_token` text unique (random, for the business's feedback link)

**assessments** (templates, created by admin)
- `id` uuid PK
- `category` project_category
- `title` text, `instructions` text (markdown)
- `resource_path` text (e.g. a messy CSV in Storage), nullable
- `time_limit_minutes` int
- `rubric` jsonb (e.g. `[{ "criterion": "accuracy", "max": 40 }, ...]`)
- `pass_threshold` int (0–100)
- `is_active` boolean

**assessment_submissions**
- `id` uuid PK
- `assessment_id`, `student_id`
- `submission_path` text or `submission_url` text
- `rubric_scores` jsonb, `total_score` int (0–100), nullable until graded
- `status` assessment_status
- `grader_notes` text
- `graded_at` timestamptz
- Unique constraint: one active submission per (student, assessment). Allow a retake only after 30 days (enforce in app logic).

**offers**
- `id` uuid PK
- `project_id`, `student_id`
- `status` offer_status
- `match_score` int, `match_breakdown` jsonb (snapshot of scoring at time of offer)
- `admin_note` text (optional personal note to student)
- `expires_at` timestamptz (default 48 hours after creation)
- `responded_at` timestamptz
- Unique (project_id, student_id)

**deliverables**
- `id` uuid PK
- `project_id`, `student_id`
- `file_path` text and/or `url` text, `note` text
- `submitted_at` timestamptz

**feedback**
- `id` uuid PK
- `project_id`
- `rating` int (1–5), `quality_notes` text
- `would_hire_again` boolean
- `interested_in_internship_or_job` boolean (key hiring-outcome signal)
- `submitted_at` timestamptz

**payments**
- `id` uuid PK
- `project_id`
- `direction` text check in (`'business_to_us'`, `'us_to_student'`)
- `amount_cents` int, `method` text (e.g. "stripe_invoice", "venmo", "zelle")
- `paid_at` timestamptz, `reference` text
- MVP: payments are made outside the app and **recorded manually** here.

**outcomes**
- `id` uuid PK
- `student_id`, `project_id` (nullable), `business_id` (nullable)
- `type` outcome_type, `notes` text, `occurred_at` date

**activity_log**
- `id`, `actor_id`, `entity_type`, `entity_id`, `action` text, `metadata` jsonb
- Write a row whenever a project status changes, an offer is sent/answered, or an assessment is graded.

### Row Level Security
Enable RLS on every table. Rules:
- Students can read/update **only their own** `students` row, submissions, offers, deliverables, and projects where they're assigned.
- Students can read `assessments` where `is_active = true`.
- Students **cannot** read `businesses`, `payments`, `feedback`, admin `notes`, or `budget_cents`. Build views or select specific columns so this data never reaches student pages.
- Admins can read/write everything (check `profiles.role = 'admin'`).
- The public intake form and feedback form insert through **server actions using the service role key**, with Zod validation and a honeypot field for spam. They never write from the client.

---

## 5. Matching algorithm

Location: `lib/matching/score.ts`. Pure function, no database calls inside it, fully unit-tested.

```ts
type MatchInput = { project: Project; student: StudentWithStats };
type MatchResult = {
  eligible: boolean;
  ineligibleReasons: string[];
  score: number;              // 0–100, clamped
  breakdown: { label: string; points: number }[];
};
```

`StudentWithStats` includes: passed assessments (category + score), completed project count overall and per category, average feedback rating, count of currently active projects, and IDs of projects they've already declined.

### Hard filters (if any fail, `eligible = false` and list the reasons)
- Student `is_active` and `is_available`
- Student has a **passed** assessment in the project's category (admin can override manually in the UI)
- Student has not already received an offer for this project
- Student has fewer than 2 active projects (`assigned` or `in_progress`)

### Scoring (additive, each component shown in the breakdown)
| Component | Points |
|---|---|
| Assessment score in category | `round(score / 100 * 30)`, max 30 |
| Required skills matched | +8 each, max 24 |
| Preferred skills matched | +3 each, max 9 |
| Completed projects in same category | +4 each, max 12 |
| Average rating (if ≥1 rated project) | `(avg - 3) * 5`, range −10 to +10 |
| Availability: `hours_per_week` ≥ `estimated_hours` / weeks until deadline | +10 |
| Starter project and student has 0–1 completed projects | +10 |
| Student listed category in `interested_categories` | +5 |

Clamp the final score to 0–100. Skill matching is case-insensitive exact tag match for MVP (no fuzzy/AI matching yet).

### Required unit tests
- Missing assessment makes the student ineligible, with a reason
- Breakdown points sum to the final score (before clamping)
- A zero-experience student gets the starter bonus on starter projects, and not on normal ones
- Score clamps at 0 and 100
- Skill matching is case-insensitive

### Shortlist
`getShortlist(projectId)` in `lib/matching/shortlist.ts` loads eligible students, scores them, sorts by score descending, and returns the top 10 with breakdowns. The admin picks **at most 3** to receive offers (enforce this limit server-side).

---

## 6. Pages and routes

```
app/
  page.tsx                          # Landing: two CTAs ("I have a project" / "I'm a student")
  (public)/
    request/page.tsx                # Business intake form
    request/thanks/page.tsx
    feedback/[token]/page.tsx       # Business leaves feedback via unique link
  (auth)/
    login/page.tsx                  # Magic link; reject non-allowed domains for students
    auth/callback/route.ts
  student/
    layout.tsx                      # Requires student role
    page.tsx                        # Dashboard: pending offers, active projects, profile completeness
    profile/page.tsx                # Edit profile, skills, availability, links, resume upload
    assessments/page.tsx            # List available assessments + own status
    assessments/[id]/page.tsx       # Instructions, resource download, submit
    offers/[id]/page.tsx            # Project details (no business budget), accept/decline
    projects/[id]/page.tsx          # Scope, deadline, submit deliverable
  admin/
    layout.tsx                      # Requires admin
    page.tsx                        # Overview: counts by project status, pending grading, expiring offers
    projects/page.tsx               # Table filtered by status
    projects/[id]/page.tsx          # Scope editor, status controls, shortlist + send offers, payments, outcomes
    students/page.tsx               # Table: skills, assessments, completed projects, avg rating
    students/[id]/page.tsx          # Full profile, history, record outcome
    assessments/page.tsx            # Create/edit templates
    submissions/page.tsx            # Grading queue with rubric form
    metrics/page.tsx                # See section 8
```

### Business intake form fields
Business name, website, contact name, email, phone (optional), "Describe the task in your own words" (textarea), category (select, with "not sure"), rough budget range (select: <$100, $100–250, $250–500, $500+), desired deadline, "How did you hear about us?" Keep it under 2 minutes to complete.

---

## 7. Core flows

### A. Business request → assigned student
1. Business submits the intake form. This creates `businesses` (or matches an existing one by email) and a `projects` row with status `submitted`.
2. Admin opens the project and moves it to `scoping`. Admin talks to the business off-platform, then fills in `scoped_description`, `deliverable`, skills, hours, pricing, deadline, and `is_starter`.
3. Admin moves it to `matching` and sees the shortlist with score breakdowns.
4. Admin selects up to 3 students, optionally adds a personal note, and sends offers. Status becomes `offered`.
5. **The first student to accept gets the project.** Other pending offers are automatically marked `withdrawn` and those students see "This project has been filled." Status becomes `assigned`, and `assigned_student_id` is set.
6. If all offers are declined or expire, the project returns to `matching`.

Offer acceptance must be **transactional**. Use a Postgres function (RPC) that locks the project row, so two students can't both win the same project.

### B. Delivery → payment → close
1. Student marks the project started (`in_progress`) and later uploads a deliverable (`delivered`).
2. Admin reviews it and sends it to the business off-platform, then marks `approved`.
3. Admin records both payments in the `payments` table, then marks `paid`.
4. Admin sends the business its feedback link (`/feedback/[token]`). On submission, the project moves to `closed`.
5. If feedback says `interested_in_internship_or_job = true`, flag it on the admin dashboard for follow-up.

### C. Student onboarding
Sign up, then complete profile, then take at least one assessment, then admin grades it, then the student becomes matchable in that category. The student dashboard shows a checklist of these steps.

### Status transitions
Define allowed transitions in one place (`lib/projects/transitions.ts`) and validate every status change server-side. Log each change to `activity_log`.

---

## 8. Metrics page (admin)

These are the whole point of the MVP. Each is a simple query displayed as a number or small table:

- **Demand:** project requests per week, request → paid conversion rate, average budget, requests by `source`
- **Repeat business:** % of businesses with 2+ projects (**the single most important number**)
- **Student supply:** signups, % who completed an assessment, assessment pass rate by category
- **Offers:** acceptance rate, median time to accept, % of projects filled on the first round of offers
- **Quality:** average rating, % of deliverables approved without rework, `would_hire_again` rate
- **Hiring signal:** count of each `outcome_type`, and the % of students with any outcome beyond the project itself

---

## 9. Build phases

Stop after each phase for my review.

**Phase 0: Setup**
Next.js + TypeScript + Tailwind + shadcn/ui, Supabase client (server and browser helpers), `.env.example`, folder structure, ESLint/Prettier, Vitest configured. A landing page placeholder.
*Done when:* `npm run dev` works and tests run.

**Phase 1: Schema + auth**
All migrations, enums, RLS policies, and a `profiles` row auto-created on signup (via trigger). Magic-link login, domain restriction for students, admin detection, protected layouts. Seed script (`supabase/seed.sql`) with 1 admin, 8 students, 4 businesses, 6 projects across different statuses, and 3 assessments.
*Done when:* I can log in as a student and as an admin and see the correct protected areas.

**Phase 2: Public intake + admin project management**
Business intake form, admin projects table, project detail page with scope editor and status transitions.
*Done when:* A submitted request shows up in admin and I can scope it and move it through statuses.

**Phase 3: Student profiles + assessments**
Student profile editing, resume upload, assessment list/detail/submission, admin grading queue with rubric scoring.
*Done when:* A student can submit an assessment and I can grade it pass or fail.

**Phase 4: Matching + offers**
Scoring function with unit tests, shortlist UI showing breakdowns, send offers (max 3), student offer page, transactional accept, auto-withdraw, expiry handling (check on page load for MVP, no cron job needed).
*Done when:* Tests pass and a project goes from `matching` to `assigned` end to end.

**Phase 5: Delivery, payments, feedback, outcomes**
Deliverable upload, payment recording, business feedback page via token, outcome recording on the student detail page.
*Done when:* A project can reach `closed` with feedback recorded.

**Phase 6: Metrics + email notifications**
Metrics page. Resend emails for: new offer (to student), offer accepted (to admin), feedback link (admin-triggered send to business).
*Done when:* All metrics render from seed data and emails send in dev.

**Phase 7: Polish + deploy**
Loading/empty/error states, mobile responsiveness on student pages, deploy to Vercel, production Supabase project, and a basic privacy policy page.

---

## 10. Explicitly out of scope for MVP

Do not build these, even if they seem natural:
- In-app payments or Stripe Connect (record payments manually)
- In-app messaging/chat (use email)
- Business accounts or logins
- Students browsing or applying to projects
- AI/LLM matching, resume parsing, or semantic skill matching
- Job board scraping or external listing aggregation
- Public student profiles or portfolio pages
- Reviews of businesses by students
- Multiple universities
- Native mobile apps

---

## 11. Conventions

- All database access goes through `lib/db/*` modules. No inline Supabase queries in components.
- Validate all form input with Zod schemas in `lib/validation/*`, shared between client and server.
- Money is always stored in **cents** as integers. Format only at display time.
- Dates are stored in UTC and displayed in America/Chicago.
- Never send `budget_cents`, business contact info, or admin notes to student-facing pages.
- Use server actions for mutations. Return typed `{ ok: true, data } | { ok: false, error }` results.
- Each phase ends with: passing tests, no TypeScript errors (`tsc --noEmit`), and a short summary of what was built.
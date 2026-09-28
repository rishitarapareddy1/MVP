-- Seed data for development: 1 admin, 8 students, 4 businesses, 6 projects
-- across statuses, 3 assessments, plus the offers/submissions/payments/etc.
-- needed for those statuses to make sense.
--
-- Run on a fresh database (after migrations). Seeded students use @example.com
-- (a reserved domain), so they are data only: nobody can log in as them and no
-- real inbox receives mail. To test the student side, log in with your own
-- allowed email.

-- ----------------------------------------------------------------------------
-- Helper: create an auth user (the on_auth_user_created trigger then creates
-- the matching profiles row). pg_temp functions disappear after this session.
-- ----------------------------------------------------------------------------
create function pg_temp.seed_user(p_id uuid, p_email text, p_full_name text)
returns void
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    -- GoTrue expects these to be '' rather than NULL.
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated',
    p_email, '', now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', p_full_name),
    now(), now(), '', '', '', ''
  )
  -- The admin may already exist if they logged in before seeding.
  on conflict do nothing;

  -- Only add an identity if the user row above was actually inserted.
  if found then
    insert into auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), p_id::text, p_id,
      jsonb_build_object('sub', p_id::text, 'email', p_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Admin
-- ----------------------------------------------------------------------------
select pg_temp.seed_user('a0000000-0000-0000-0000-000000000001', 'rishi9@illinois.edu', 'Rishi (Admin)');
update public.profiles set role = 'admin' where email = 'rishi9@illinois.edu';

-- ----------------------------------------------------------------------------
-- Students (ids 5000...01 through 5000...08)
-- ----------------------------------------------------------------------------
select pg_temp.seed_user('50000000-0000-0000-0000-000000000001', 'maya.patel@example.com', 'Maya Patel');
select pg_temp.seed_user('50000000-0000-0000-0000-000000000002', 'jordan.lee@example.com', 'Jordan Lee');
select pg_temp.seed_user('50000000-0000-0000-0000-000000000003', 'sofia.garcia@example.com', 'Sofia Garcia');
select pg_temp.seed_user('50000000-0000-0000-0000-000000000004', 'ethan.kim@example.com', 'Ethan Kim');
select pg_temp.seed_user('50000000-0000-0000-0000-000000000005', 'priya.shah@example.com', 'Priya Shah');
select pg_temp.seed_user('50000000-0000-0000-0000-000000000006', 'marcus.brown@example.com', 'Marcus Brown');
select pg_temp.seed_user('50000000-0000-0000-0000-000000000007', 'aisha.okafor@example.com', 'Aisha Okafor');
select pg_temp.seed_user('50000000-0000-0000-0000-000000000008', 'liam.chen@example.com', 'Liam Chen');

insert into public.students
  (id, major, graduation_year, bio, skills, interested_categories, hours_per_week, is_available, portfolio_links, is_active)
values
  ('50000000-0000-0000-0000-000000000001', 'Statistics', 2027,
   'Stats major who loves turning messy spreadsheets into clean ones.',
   '{excel,sql,python,data cleaning}', '{data_cleanup,data_analysis}', 10, true,
   '{https://github.com/example-maya}', true),
  ('50000000-0000-0000-0000-000000000002', 'Business Administration', 2026,
   'Marketing concentration, did competitor research for a campus startup.',
   '{market research,excel,powerpoint}', '{competitor_analysis,market_research,presentation}', 8, true,
   '{}', true),
  ('50000000-0000-0000-0000-000000000003', 'Information Sciences', 2027,
   'Interested in data viz and dashboards.',
   '{tableau,excel,data visualization,sql}', '{data_analysis,spreadsheet_work}', 6, true,
   '{https://example.com/sofia-portfolio}', true),
  ('50000000-0000-0000-0000-000000000004', 'Computer Science', 2028,
   'Freshman, no client work yet but eager to start.',
   '{python,excel}', '{data_cleanup,lead_research}', 12, true,
   '{}', true),
  ('50000000-0000-0000-0000-000000000005', 'Economics', 2026,
   'Econ senior with research assistant experience.',
   '{excel,stata,market research,google sheets}', '{market_research,competitor_analysis}', 5, true,
   '{}', true),
  ('50000000-0000-0000-0000-000000000006', 'Marketing', 2027,
   'Runs social accounts for two RSOs.',
   '{social media,canva,google sheets}', '{social_media_analysis,lead_research}', 8, false,
   '{}', true),
  ('50000000-0000-0000-0000-000000000007', 'Accountancy', 2026,
   'Detail-oriented, big fan of pivot tables.',
   '{excel,google sheets,data cleaning}', '{spreadsheet_work,data_cleanup}', 10, true,
   '{}', true),
  ('50000000-0000-0000-0000-000000000008', 'Undeclared', 2028,
   'Deactivated by admin (missed a deadline).',
   '{excel}', '{lead_research}', 4, true,
   '{}', false);

-- ----------------------------------------------------------------------------
-- Assessments (ids a5500000...01-03)
-- ----------------------------------------------------------------------------
insert into public.assessments
  (id, category, title, instructions, time_limit_minutes, rubric, pass_threshold, is_active)
values
  ('a5500000-0000-0000-0000-000000000001', 'data_cleanup', 'Clean a messy customer list',
   E'Download the CSV. Remove duplicates, standardize phone numbers and state names, and flag rows with missing emails.\n\nSubmit the cleaned file plus a 3-sentence summary of what you changed.',
   60, '[{"criterion":"accuracy","max":50},{"criterion":"consistency","max":30},{"criterion":"summary","max":20}]',
   70, true),
  ('a5500000-0000-0000-0000-000000000002', 'competitor_analysis', 'Compare 3 coffee shops in Champaign',
   E'Pick 3 coffee shops in Champaign-Urbana. Build a 1-page comparison of price, menu, hours and target customer.\n\nSubmit a PDF or Google Doc link.',
   90, '[{"criterion":"research depth","max":40},{"criterion":"clarity","max":35},{"criterion":"insight","max":25}]',
   70, true),
  ('a5500000-0000-0000-0000-000000000003', 'lead_research', 'Build a 20-row lead list',
   E'Find 20 local dental offices with name, website, phone, and a named contact where available.\n\nSubmit a Google Sheet link.',
   60, '[{"criterion":"accuracy","max":50},{"criterion":"completeness","max":30},{"criterion":"formatting","max":20}]',
   65, true);

insert into public.assessment_submissions
  (assessment_id, student_id, submission_url, rubric_scores, total_score, status, grader_notes, graded_at)
values
  -- Maya: passed data cleanup
  ('a5500000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'https://example.com/maya-cleanup',
   '{"accuracy":46,"consistency":28,"summary":18}', 92, 'passed', 'Excellent.', now() - interval '30 days'),
  -- Jordan: passed competitor analysis
  ('a5500000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'https://example.com/jordan-coffee',
   '{"research depth":34,"clarity":30,"insight":20}', 84, 'passed', null, now() - interval '25 days'),
  -- Sofia: passed data cleanup
  ('a5500000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'https://example.com/sofia-cleanup',
   '{"accuracy":40,"consistency":22,"summary":16}', 78, 'passed', null, now() - interval '20 days'),
  -- Ethan: passed lead research, failed data cleanup
  ('a5500000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004', 'https://example.com/ethan-leads',
   '{"accuracy":40,"completeness":24,"formatting":14}', 78, 'passed', null, now() - interval '10 days'),
  ('a5500000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'https://example.com/ethan-cleanup',
   '{"accuracy":25,"consistency":15,"summary":10}', 50, 'failed', 'Duplicates missed. Can retake in 30 days.', now() - interval '12 days'),
  -- Priya: passed competitor analysis
  ('a5500000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000005', 'https://example.com/priya-coffee',
   '{"research depth":38,"clarity":32,"insight":22}', 92, 'passed', null, now() - interval '15 days'),
  -- Aisha: passed data cleanup
  ('a5500000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000007', 'https://example.com/aisha-cleanup',
   '{"accuracy":44,"consistency":27,"summary":15}', 86, 'passed', null, now() - interval '8 days');

-- Ungraded submissions, so the grading queue isn't empty.
insert into public.assessment_submissions (assessment_id, student_id, submission_url, status)
values
  ('a5500000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000006', 'https://example.com/marcus-leads', 'submitted'),
  ('a5500000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000003', 'https://example.com/sofia-coffee', 'submitted');

-- ----------------------------------------------------------------------------
-- Businesses (ids b0000000...01-04)
-- ----------------------------------------------------------------------------
insert into public.businesses (id, name, website, industry, contact_name, contact_email, contact_phone, source, notes)
values
  ('b0000000-0000-0000-0000-000000000001', 'Green Street Bakery', 'https://example.com/greenstreet', 'Food & beverage',
   'Dana Whitfield', 'dana@greenstreet.example.com', '217-555-0101', 'walk-in', 'Owner is very responsive.'),
  ('b0000000-0000-0000-0000-000000000002', 'Prairie Dental Group', 'https://example.com/prairiedental', 'Healthcare',
   'Sam Ortiz', 'sam@prairiedental.example.com', null, 'warm intro', null),
  ('b0000000-0000-0000-0000-000000000003', 'Illini Bike Co.', 'https://example.com/illinibike', 'Retail',
   'Chris Novak', 'chris@illinibike.example.com', '217-555-0133', 'linkedin', 'Might need ongoing inventory work.'),
  ('b0000000-0000-0000-0000-000000000004', 'Northside Realty', 'https://example.com/northside', 'Real estate',
   'Pat Morgan', 'pat@northside.example.com', null, 'linkedin', null);

-- ----------------------------------------------------------------------------
-- Projects (ids c0000000...01-06), one per interesting status
-- ----------------------------------------------------------------------------
insert into public.projects
  (id, business_id, title, raw_request, scoped_description, deliverable, category,
   required_skills, preferred_skills, estimated_hours, budget_cents, student_pay_cents,
   deadline, is_starter, status, assigned_student_id)
values
  -- 1. submitted: fresh intake, nothing scoped yet
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004',
   'Lead list request',
   'We want a list of people who might be selling their house soon in north Champaign.',
   null, null, 'lead_research', '{}', '{}', null, null, null,
   null, false, 'submitted', null),

  -- 2. scoping: admin is talking to the business
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003',
   'Inventory spreadsheet cleanup',
   'Our inventory spreadsheet is a mess, can someone fix it?',
   'Consolidate 3 inventory tabs into one sheet with consistent SKUs and categories.', null,
   'spreadsheet_work', '{excel}', '{google sheets}', 6, 25000, 18000,
   current_date + 21, false, 'scoping', null),

  -- 3. matching: fully scoped, ready for a shortlist
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002',
   'Patient mailing list cleanup',
   'We have an old patient mailing list with lots of duplicates.',
   'Deduplicate and standardize a 2,000-row mailing list export. Flag rows missing addresses.',
   'Cleaned CSV plus a short summary of changes and counts.',
   'data_cleanup', '{excel,data cleaning}', '{python}', 5, 20000, 15000,
   current_date + 14, true, 'matching', null),

  -- 4. offered: offers out to two students
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'Competitor pricing snapshot',
   'How do our prices compare to other bakeries nearby?',
   'Compare pricing and best-sellers for 5 bakeries within 3 miles.',
   '1-page PDF comparing 5 competitors on price, top items, hours and target customer.',
   'competitor_analysis', '{market research}', '{excel,powerpoint}', 4, 15000, 11000,
   current_date + 10, false, 'offered', null),

  -- 5. in_progress: Maya is working on it
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
   'Sales data summary',
   'Can someone summarize last year''s sales by month and category?',
   'Summarize 12 months of POS exports into a monthly/category pivot with 3 charts.',
   'Excel workbook with pivot table and 3 charts.',
   'data_analysis', '{excel}', '{data visualization}', 8, 40000, 30000,
   current_date + 7, false, 'in_progress', '50000000-0000-0000-0000-000000000001'),

  -- 6. closed: full lifecycle done (delivered, paid, feedback in)
  ('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001',
   'Customer email list cleanup',
   'Our email list from the POS has duplicates and typos.',
   'Clean and deduplicate a 900-row customer email export.',
   'Cleaned CSV with a summary tab.',
   'data_cleanup', '{excel,data cleaning}', '{}', 3, 10000, 7500,
   current_date - 20, true, 'closed', '50000000-0000-0000-0000-000000000007');

-- ----------------------------------------------------------------------------
-- Offers
-- ----------------------------------------------------------------------------
insert into public.offers (project_id, student_id, status, match_score, match_breakdown, admin_note, expires_at, responded_at)
values
  -- Project 4 (offered): two pending
  ('c0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'pending', 60,
   '[{"label":"Assessment score (84)","points":25},{"label":"Required skills matched (1)","points":8},{"label":"Preferred skills matched (2)","points":6},{"label":"Availability","points":10},{"label":"Interested in category","points":5}]',
   'Your coffee shop assessment was great, this is a similar project.', now() + interval '36 hours', null),
  ('c0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000005', 'pending', 55,
   '[{"label":"Assessment score (92)","points":28},{"label":"Required skills matched (1)","points":8},{"label":"Preferred skills matched (1)","points":3},{"label":"Availability","points":10},{"label":"Interested in category","points":5}]',
   null, now() + interval '36 hours', null),
  -- Project 5 (in_progress): Maya accepted
  ('c0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000001', 'accepted', 52,
   '[{"label":"Required skills matched (1)","points":8},{"label":"Availability","points":10}]',
   null, now() - interval '3 days', now() - interval '4 days'),
  -- Project 6 (closed): Aisha accepted, Sofia's offer was withdrawn
  ('c0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000007', 'accepted', 71,
   '[{"label":"Assessment score (86)","points":26},{"label":"Required skills matched (2)","points":16},{"label":"Availability","points":10},{"label":"Starter bonus","points":10},{"label":"Interested in category","points":5}]',
   null, now() - interval '38 days', now() - interval '39 days'),
  ('c0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000003', 'withdrawn', 58,
   '[{"label":"Assessment score (78)","points":23},{"label":"Required skills matched (1)","points":8},{"label":"Availability","points":10}]',
   null, now() - interval '38 days', null);

-- ----------------------------------------------------------------------------
-- Closed project: deliverable, payments, feedback, outcome
-- ----------------------------------------------------------------------------
insert into public.deliverables (project_id, student_id, url, note, submitted_at)
values ('c0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000007',
        'https://example.com/aisha-deliverable', 'Removed 112 duplicates, fixed 37 typos.', now() - interval '30 days');

insert into public.payments (project_id, direction, amount_cents, method, paid_at, reference)
values
  ('c0000000-0000-0000-0000-000000000006', 'business_to_us', 10000, 'stripe_invoice', now() - interval '27 days', 'INV-0001'),
  ('c0000000-0000-0000-0000-000000000006', 'us_to_student', 7500, 'zelle', now() - interval '26 days', null);

insert into public.feedback (project_id, rating, quality_notes, would_hire_again, interested_in_internship_or_job, submitted_at)
values ('c0000000-0000-0000-0000-000000000006', 5, 'Fast and thorough.', true, true, now() - interval '25 days');

insert into public.outcomes (student_id, project_id, business_id, type, notes, occurred_at)
values ('50000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000006',
        'b0000000-0000-0000-0000-000000000001', 'repeat_project', 'Bakery asked for Aisha again.', current_date - 10);

-- ----------------------------------------------------------------------------
-- A few activity log rows
-- ----------------------------------------------------------------------------
insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
select p.id, 'project', 'c0000000-0000-0000-0000-000000000006', 'status_changed',
       '{"from":"paid","to":"closed"}'::jsonb
from public.profiles p where p.email = 'rishi9@illinois.edu';

insert into public.activity_log (actor_id, entity_type, entity_id, action, metadata)
select p.id, 'project', 'c0000000-0000-0000-0000-000000000004', 'offers_sent',
       '{"student_count":2}'::jsonb
from public.profiles p where p.email = 'rishi9@illinois.edu';

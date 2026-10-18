-- Starter assessments for the new tech categories. Admins can edit or
-- deactivate them in Admin -> Assessments. Fixed ids + "on conflict do
-- nothing" make this safe to run more than once.

insert into public.assessments
  (id, category, title, instructions, time_limit_minutes, rubric, pass_threshold, is_active)
values
  ('a5500000-0000-0000-0000-000000000004', 'web_development',
   'Build a one-page site for a local business',
   E'Build a responsive one-page website for a made-up local coffee shop: a header, a short "about" section, opening hours, a menu with at least 6 items, and a contact section.\n\nIt must look good on a phone and a laptop. Use any tools you like (plain HTML/CSS, a framework, or a site builder).\n\nSubmit a link to the live page plus a link to the code or project (e.g. GitHub), and 2-3 sentences on the choices you made.',
   120,
   '[{"criterion":"works and is responsive","max":40},{"criterion":"clean, readable code or setup","max":30},{"criterion":"design and polish","max":20},{"criterion":"explanation","max":10}]',
   70, true),
  ('a5500000-0000-0000-0000-000000000005', 'software_development',
   'Write a script to clean and summarize a sales export',
   E'Download the starter CSV of sales orders (or create your own with 50+ rows if none is attached). Write a script in any language that:\n\n1. Removes duplicate orders and rows with missing totals.\n2. Standardizes dates to YYYY-MM-DD.\n3. Prints total revenue per month and the top 5 customers by revenue.\n\nSubmit a link to the code (e.g. GitHub or a Gist) with a short README explaining how to run it, plus the output it produced.',
   120,
   '[{"criterion":"correct results","max":40},{"criterion":"code quality","max":30},{"criterion":"handles messy data","max":20},{"criterion":"README","max":10}]',
   70, true)
on conflict (id) do nothing;

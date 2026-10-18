-- Tech contract work: two new project categories, each with a starter
-- assessment so students can qualify for them.
--
-- Postgres can't use a newly added enum value in the same transaction that
-- adds it, so the assessments below go in a separate migration.

alter type public.project_category add value if not exists 'web_development';
alter type public.project_category add value if not exists 'software_development';

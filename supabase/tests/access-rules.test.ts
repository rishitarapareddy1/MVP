/**
 * Database access-rule suite.
 *
 * Builds the real schema (every migration + seed.sql) in PGlite, an
 * in-memory Postgres, with small stand-ins for what Supabase provides
 * (roles, auth.uid(), auth.users, storage tables). Then it acts as different
 * users and checks what each can read and write.
 *
 * Tests in this file run in order and share one database, so later tests
 * build on earlier state (e.g. an offer accepted above is "filled" below).
 * Run with `npm run test:db`. It never touches the live database.
 */
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const SUPABASE_DIR = join(__dirname, "..");
const db = new PGlite();

// Seed ids (see supabase/seed.sql).
const ADMIN = "a0000000-0000-0000-0000-000000000001";
const MAYA = "50000000-0000-0000-0000-000000000001"; // in progress on P5
const JORDAN = "50000000-0000-0000-0000-000000000002"; // pending offer on P4
const SOFIA = "50000000-0000-0000-0000-000000000003";
const ETHAN = "50000000-0000-0000-0000-000000000004"; // failed data cleanup recently
const PRIYA = "50000000-0000-0000-0000-000000000005"; // pending offer on P4
const AISHA = "50000000-0000-0000-0000-000000000007";
const P = (n: number) => `c0000000-0000-0000-0000-00000000000${n}`;
const A_CLEANUP = "a5500000-0000-0000-0000-000000000001";
const A_LEADS = "a5500000-0000-0000-0000-000000000003";

type Result = { rows: Record<string, unknown>[] } | { error: string };

/** Run SQL as a user (sub = their id) under a Postgres role, like Supabase does. */
async function as(
  sub: string | null,
  role: "authenticated" | "anon" | "service_role",
  sql: string,
): Promise<Result> {
  await db.exec(
    `set role ${role}; select set_config('request.jwt.claims', '${JSON.stringify({ sub: sub ?? "" })}', false);`,
  );
  try {
    return { rows: (await db.query<Record<string, unknown>>(sql)).rows };
  } catch (e) {
    return { error: (e as Error).message };
  } finally {
    // Clear the identity too, so setup statements below never run "as" someone.
    await db.exec("reset role; select set_config('request.jwt.claims', '{}', false);");
  }
}
const rows = (r: Result) => ("rows" in r ? r.rows : []);
const failed = (r: Result) => "error" in r;
/** First column of the first row (e.g. a function's return value). */
const value = (r: Result) => ("rows" in r && r.rows[0] ? Object.values(r.rows[0])[0] : undefined);
const count = async (sub: string | null, sql: string) =>
  Number(rows(await as(sub, "authenticated", sql))[0]?.n ?? -1);
const offerId = async (project: string, student: string) =>
  (
    await db.query<{ id: string }>(
      `select id from offers where project_id='${project}' and student_id='${student}'`,
    )
  ).rows[0]?.id;
const statusOf = async (project: string) =>
  (await db.query<{ status: string }>(`select status from projects where id='${project}'`)).rows[0]
    ?.status;

beforeAll(async () => {
  // Stand-ins for what Supabase provides.
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    grant usage on schema auth to anon, authenticated, service_role;
    create table auth.users (
      instance_id uuid, id uuid primary key, aud text, role text, email text unique, encrypted_password text,
      email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb,
      created_at timestamptz, updated_at timestamptz, confirmation_token text, recovery_token text,
      email_change_token_new text, email_change text);
    create table auth.identities (id uuid primary key, provider_id text, user_id uuid references auth.users,
      identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz,
      unique (provider_id, provider));
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid $$;
    create schema storage;
    grant usage on schema storage to anon, authenticated, service_role;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text, owner uuid);
    alter table storage.objects enable row level security;
    grant all on storage.objects to anon, authenticated, service_role;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  `);
  const migrations = readdirSync(join(SUPABASE_DIR, "migrations"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of migrations)
    await db.exec(readFileSync(join(SUPABASE_DIR, "migrations", f), "utf8"));
  await db.exec(readFileSync(join(SUPABASE_DIR, "seed.sql"), "utf8"));
});

describe("seed", () => {
  it("loads the expected demo data", async () => {
    const r = (
      await db.query<Record<string, number>>(`select
        (select count(*)::int from profiles where role='admin') admins,
        (select count(*)::int from students) students,
        (select count(*)::int from projects) projects,
        (select count(*)::int from assessments) assessments`)
    ).rows[0];
    expect(r).toEqual({ admins: 1, students: 8, projects: 6, assessments: 3 });
  });
});

describe("what students can see", () => {
  it("no direct access to projects, businesses, payments or feedback", async () => {
    for (const t of ["projects", "businesses", "payments", "feedback"]) {
      expect(await count(JORDAN, `select count(*) n from ${t}`)).toBe(0);
    }
  });

  it("the student_projects view shows only offered/assigned projects, without the budget", async () => {
    expect(
      rows(await as(JORDAN, "authenticated", "select id from student_projects")).map((r) => r.id),
    ).toEqual([P(4)]);
    expect(
      rows(await as(MAYA, "authenticated", "select id from student_projects")).map((r) => r.id),
    ).toEqual([P(5)]);
    expect(
      failed(await as(JORDAN, "authenticated", "select budget_cents from student_projects")),
    ).toBe(true);
  });

  it("only their own profile, student row and offers", async () => {
    expect(await count(JORDAN, "select count(*) n from profiles")).toBe(1);
    expect(await count(JORDAN, "select count(*) n from students")).toBe(1);
    expect(await count(JORDAN, "select count(*) n from offers")).toBe(1);
  });

  it("active assessments are visible to students", async () => {
    expect(await count(JORDAN, "select count(*) n from assessments")).toBe(3);
  });

  it("admins see everything", async () => {
    expect(await count(ADMIN, "select count(*) n from projects")).toBe(6);
    expect(await count(ADMIN, "select count(*) n from businesses")).toBe(4);
  });

  it("anonymous visitors see nothing and can't write", async () => {
    expect(rows(await as(null, "anon", "select count(*)::int n from projects"))[0].n).toBe(0);
    expect(failed(await as(null, "anon", "select * from student_projects"))).toBe(true);
    expect(
      failed(
        await as(
          null,
          "anon",
          "insert into businesses (name, contact_name, contact_email) values ('x','x','x@x')",
        ),
      ),
    ).toBe(true);
  });
});

describe("protected columns", () => {
  it("students can edit their profile but not their role, active flag or verification", async () => {
    expect(
      failed(
        await as(JORDAN, "authenticated", `update profiles set role='admin' where id='${JORDAN}'`),
      ),
    ).toBe(true);
    expect(
      failed(
        await as(
          JORDAN,
          "authenticated",
          `update students set is_active=false where id='${JORDAN}'`,
        ),
      ),
    ).toBe(true);
    expect(
      failed(
        await as(
          JORDAN,
          "authenticated",
          `update students set university_email='j@illinois.edu', university_email_verified_at=now() where id='${JORDAN}'`,
        ),
      ),
    ).toBe(true);
    expect(
      rows(
        await as(
          JORDAN,
          "authenticated",
          `update students set bio='hi' where id='${JORDAN}' returning id`,
        ),
      ),
    ).toHaveLength(1);
  });

  it("students can't edit another student", async () => {
    expect(
      rows(
        await as(
          JORDAN,
          "authenticated",
          `update students set bio='x' where id='${MAYA}' returning id`,
        ),
      ),
    ).toHaveLength(0);
  });

  it("one university email can verify only one account", async () => {
    expect(
      failed(
        await as(
          null,
          "service_role",
          `update students set university_email='m@illinois.edu', university_email_verified_at=now() where id='${MAYA}'`,
        ),
      ),
    ).toBe(false);
    expect(
      failed(
        await as(
          null,
          "service_role",
          `update students set university_email='M@Illinois.edu', university_email_verified_at=now() where id='${SOFIA}'`,
        ),
      ),
    ).toBe(true);
  });

  it("verification codes are invisible to every browser user, admins included", async () => {
    await db.exec(
      `insert into email_verification_codes (student_id, email, code_hash, expires_at) values ('${JORDAN}', 'j@illinois.edu', 'x', now() + interval '15 minutes')`,
    );
    for (const who of [JORDAN, ADMIN]) {
      const r = await as(who, "authenticated", "select * from email_verification_codes");
      expect(failed(r) || rows(r).length === 0).toBe(true);
    }
  });
});

describe("assessment submissions", () => {
  const submit = (who: string, assessment: string, extra = "") =>
    as(
      who,
      "authenticated",
      `insert into assessment_submissions (assessment_id, student_id, submission_url${extra ? ", status, total_score" : ""}) values ('${assessment}','${who}','https://x'${extra}) returning id`,
    );

  it("a student can submit, but only one ungraded submission at a time", async () => {
    expect(rows(await submit(JORDAN, A_CLEANUP))).toHaveLength(1);
    expect(failed(await submit(JORDAN, A_CLEANUP))).toBe(true);
  });

  it("students can't grade themselves or submit as someone else", async () => {
    expect(failed(await submit(JORDAN, A_LEADS, ", 'passed', 100"))).toBe(true);
    expect(
      failed(
        await as(
          JORDAN,
          "authenticated",
          `insert into assessment_submissions (assessment_id, student_id, submission_url) values ('${A_LEADS}','${MAYA}','https://x')`,
        ),
      ),
    ).toBe(true);
  });

  it("no resubmitting a passed assessment; retakes only 30 days after failing", async () => {
    expect(failed(await submit(MAYA, A_CLEANUP))).toBe(true);
    expect(failed(await submit(ETHAN, A_CLEANUP))).toBe(true);
    await db.exec(
      `update assessment_submissions set graded_at = now() - interval '31 days' where student_id='${ETHAN}' and status='failed'`,
    );
    expect(rows(await submit(ETHAN, A_CLEANUP))).toHaveLength(1);
  });

  it("grading is logged, and only admins can grade", async () => {
    expect(
      rows(
        await as(
          JORDAN,
          "authenticated",
          `update assessment_submissions set status='passed', total_score=100 where student_id='${JORDAN}' returning id`,
        ),
      ),
    ).toHaveLength(0);
    const g = rows(
      await as(
        ADMIN,
        "authenticated",
        `update assessment_submissions set status='passed', total_score=80, rubric_scores='{}', graded_at=now() where student_id='${ETHAN}' and status='submitted' returning id`,
      ),
    );
    expect(g).toHaveLength(1);
    const log = rows(
      await as(
        ADMIN,
        "authenticated",
        `select action, actor_id from activity_log where entity_id='${g[0].id}'`,
      ),
    );
    expect(log).toEqual([{ action: "graded", actor_id: ADMIN }]);
  });
});

describe("storage", () => {
  const upload = (who: string, bucket: string, name: string) =>
    as(
      who,
      "authenticated",
      `insert into storage.objects (bucket_id, name) values ('${bucket}', '${name}') returning id`,
    );

  it("students upload only into their own folder", async () => {
    expect(rows(await upload(JORDAN, "resumes", `${JORDAN}/r.pdf`))).toHaveLength(1);
    expect(failed(await upload(JORDAN, "resumes", `${MAYA}/r.pdf`))).toBe(true);
    expect(failed(await upload(JORDAN, "assessment-resources", "x.csv"))).toBe(true);
  });

  it("students can't delete a submitted file, and see only their own files", async () => {
    await db.exec(
      `insert into storage.objects (bucket_id, name) values ('submissions', '${MAYA}/a/f.csv'), ('assessment-resources', 'a/messy.csv')`,
    );
    expect(
      rows(
        await as(
          MAYA,
          "authenticated",
          "delete from storage.objects where bucket_id='submissions' returning id",
        ),
      ),
    ).toHaveLength(0);
    expect(
      await count(JORDAN, "select count(*) n from storage.objects where bucket_id='submissions'"),
    ).toBe(0);
    expect(
      await count(
        JORDAN,
        "select count(*) n from storage.objects where bucket_id='assessment-resources'",
      ),
    ).toBe(1);
  });

  it("deliverable files only go into a project the student is assigned to", async () => {
    expect(rows(await upload(MAYA, "deliverables", `${MAYA}/${P(5)}/final.pdf`))).toHaveLength(1);
    expect(failed(await upload(MAYA, "deliverables", `${MAYA}/${P(4)}/x.pdf`))).toBe(true);
    const bad = await upload(MAYA, "deliverables", `${MAYA}/not-a-uuid/x.pdf`);
    expect(failed(bad) && !("error" in bad && /invalid input syntax/.test(bad.error))).toBe(true);
  });
});

describe("offers", () => {
  const fn = async (who: string, sql: string) => value(await as(who, "authenticated", sql));
  const offers = (ids: string[], score = 50) =>
    JSON.stringify(
      ids.map((id) => ({
        student_id: id,
        match_score: score,
        match_breakdown: [],
        admin_note: null,
      })),
    );

  it("the first student to accept wins; the other offer is withdrawn", async () => {
    expect(await fn(JORDAN, `select accept_offer('${await offerId(P(4), JORDAN)}')`)).toBe(
      "accepted",
    );
    expect(await fn(PRIYA, `select accept_offer('${await offerId(P(4), PRIYA)}')`)).toBe("filled");
    expect(await statusOf(P(4))).toBe("assigned");
    expect(
      (await db.query(`select status from offers where id='${await offerId(P(4), PRIYA)}'`))
        .rows[0],
    ).toEqual({ status: "withdrawn" });
  });

  it("students can't accept someone else's offer or send offers", async () => {
    expect(await fn(PRIYA, `select accept_offer('${await offerId(P(4), JORDAN)}')`)).toBe(
      "not_found",
    );
    expect(
      failed(
        await as(JORDAN, "authenticated", `select send_offers('${P(3)}', '${offers([MAYA])}')`),
      ),
    ).toBe(true);
  });

  it("at most 3 offers at once, and only while matching", async () => {
    const r = await as(
      ADMIN,
      "authenticated",
      `select send_offers('${P(3)}', '${offers([MAYA, AISHA, SOFIA, PRIYA])}')`,
    );
    expect("error" in r && /At most 3/.test(r.error)).toBe(true);
    expect(
      failed(
        await as(ADMIN, "authenticated", `select send_offers('${P(1)}', '${offers([MAYA])}')`),
      ),
    ).toBe(true);
  });

  it("declines return the project to matching once nobody is left", async () => {
    expect(await fn(ADMIN, `select send_offers('${P(3)}', '${offers([MAYA, AISHA], 60)}')`)).toBe(
      2,
    );
    expect(await statusOf(P(3))).toBe("offered");
    expect(await fn(MAYA, `select decline_offer('${await offerId(P(3), MAYA)}')`)).toBe("declined");
    expect(await statusOf(P(3))).toBe("offered");
    expect(await fn(AISHA, `select decline_offer('${await offerId(P(3), AISHA)}')`)).toBe(
      "declined",
    );
    expect(await statusOf(P(3))).toBe("matching");
  });

  it("expired offers can't be accepted and send the project back to matching", async () => {
    await fn(ADMIN, `select send_offers('${P(3)}', '${offers([SOFIA])}')`);
    await db.exec(
      `update offers set expires_at = now() - interval '1 minute' where project_id='${P(3)}' and student_id='${SOFIA}'`,
    );
    expect(await fn(SOFIA, `select accept_offer('${await offerId(P(3), SOFIA)}')`)).toBe("expired");
    expect(await statusOf(P(3))).toBe("matching");
  });

  it("cancelling a project withdraws its pending offers", async () => {
    await fn(ADMIN, `select send_offers('${P(3)}', '${offers([ETHAN])}')`);
    await as(ADMIN, "authenticated", `update projects set status='cancelled' where id='${P(3)}'`);
    expect(await fn(ETHAN, `select accept_offer('${await offerId(P(3), ETHAN)}')`)).toBe("filled");
  });

  it("a student with 2 active projects can't accept a third", async () => {
    await db.exec(
      `update projects set status='assigned', assigned_student_id='${MAYA}' where id='${P(2)}'; update projects set status='matching' where id='${P(1)}'`,
    );
    await fn(ADMIN, `select send_offers('${P(1)}', '${offers([MAYA])}')`);
    expect(await fn(MAYA, `select accept_offer('${await offerId(P(1), MAYA)}')`)).toBe(
      "too_many_projects",
    );
  });

  it("anonymous visitors can't call offer functions", async () => {
    expect(
      failed(await as(null, "anon", `select accept_offer('${await offerId(P(1), MAYA)}')`)),
    ).toBe(true);
  });
});

describe("delivery and feedback", () => {
  const fn = async (who: string, sql: string) => value(await as(who, "authenticated", sql));

  it("students can't insert deliverables directly", async () => {
    expect(
      failed(
        await as(
          MAYA,
          "authenticated",
          `insert into deliverables (project_id, student_id, url) values ('${P(5)}','${MAYA}','https://d')`,
        ),
      ),
    ).toBe(true);
  });

  it("only the assigned student delivers, once, with a safe link or own file", async () => {
    expect(
      await fn(JORDAN, `select submit_deliverable('${P(5)}', null, 'https://x.com', 'n')`),
    ).toBe("not_found");
    expect(
      await fn(
        MAYA,
        `select submit_deliverable('${P(5)}', null, 'https://drive.example.com/x', 'done')`,
      ),
    ).toBe("delivered");
    expect(await statusOf(P(5))).toBe("delivered");
    expect(
      await fn(MAYA, `select submit_deliverable('${P(5)}', null, 'https://x.com', null)`),
    ).toBe("wrong_status");
  });

  it("start_project and deliverable validation", async () => {
    expect(await fn(JORDAN, `select start_project('${P(2)}')`)).toBe("not_found");
    expect(await fn(MAYA, `select start_project('${P(2)}')`)).toBe("started");
    expect(await fn(MAYA, `select start_project('${P(2)}')`)).toBe("wrong_status");
    expect(
      await fn(MAYA, `select submit_deliverable('${P(2)}', '${JORDAN}/${P(2)}/x.pdf', null, null)`),
    ).toBe("bad_path");
    expect(
      await fn(MAYA, `select submit_deliverable('${P(2)}', null, 'javascript:alert(1)', null)`),
    ).toBe("bad_url");
    expect(await fn(MAYA, `select submit_deliverable('${P(2)}', null, null, 'note')`)).toBe(
      "missing",
    );
  });

  it("feedback goes only through the server, only once, and only after paid", async () => {
    const token = (
      await db.query<{ t: string }>(`select feedback_token t from projects where id='${P(5)}'`)
    ).rows[0].t;
    const sql = `select submit_feedback('${token}', 5, 'Great', true, true)`;
    expect(failed(await as(ADMIN, "authenticated", sql))).toBe(true);
    expect(failed(await as(null, "anon", sql))).toBe(true);
    expect(value(await as(null, "service_role", sql))).toBe("not_ready");
    await db.exec(`update projects set status='paid' where id='${P(5)}'`);
    expect(value(await as(null, "service_role", sql))).toBe("submitted");
    expect(await statusOf(P(5))).toBe("closed");
    expect(value(await as(null, "service_role", sql))).toBe("already_submitted");
  });
});

describe("activity log", () => {
  it("records status changes with the acting admin", async () => {
    const changed = rows(
      await as(
        ADMIN,
        "authenticated",
        `update projects set status='cancelled' where id='${P(1)}' returning id`,
      ),
    );
    expect(changed).toHaveLength(1);
    const r = rows(
      await as(
        ADMIN,
        "authenticated",
        `select actor_id from activity_log where entity_id='${P(1)}' and action='status_changed' and metadata->>'to' = 'cancelled'`,
      ),
    );
    expect(r).toEqual([{ actor_id: ADMIN }]);
  });

  it("records projects created by the public form with no actor", async () => {
    const r = rows(
      await as(
        null,
        "service_role",
        `insert into projects (business_id, title, raw_request) values ('b0000000-0000-0000-0000-000000000001','t','r') returning id`,
      ),
    );
    const log = rows(
      await as(
        ADMIN,
        "authenticated",
        `select actor_id, action from activity_log where entity_id='${r[0].id}'`,
      ),
    );
    expect(log).toEqual([{ actor_id: null, action: "created" }]);
  });
});

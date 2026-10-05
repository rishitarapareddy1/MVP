import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = { title: "Privacy" };

// Plain-language privacy page. It describes what the app actually stores and
// who can see it (enforced by the database's access rules). Update it if the
// data you collect changes.
const UPDATED = "October 5, 2026";

export default function PrivacyPage() {
  const email = (
    <a href={`mailto:${BRAND.contactEmail}`} className="text-primary hover:underline">
      {BRAND.contactEmail}
    </a>
  );

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Privacy</h1>
        <p className="text-muted-foreground text-sm">Last updated {UPDATED}</p>
        <p className="text-muted-foreground">
          {BRAND.name} connects small businesses with university students for short projects. This
          page explains what we collect, why, and who can see it.
        </p>
      </div>

      <Section title="What we collect">
        <p>
          <strong>From businesses:</strong> your business name and website, a contact name, email
          and (optionally) phone number, how you heard about us, and what you tell us about your
          project. After a project, any feedback you leave.
        </p>
        <p>
          <strong>From students:</strong> your login email, name, major, graduation year, skills,
          interests, weekly availability, short bio and portfolio links, plus anything you upload
          (resume, assessment work, project deliverables). If you sign in with a personal email, we
          also store the university email you verify.
        </p>
        <p>
          <strong>Payments:</strong> payments happen outside this site. We only keep a record of the
          amount, method and date.
        </p>
      </Section>

      <Section title="How we use it">
        <ul className="list-disc space-y-1 pl-5">
          <li>To scope projects, match them to students, and run them to completion.</li>
          <li>To check that students are enrolled (university email verification).</li>
          <li>To email you about your project or account, including one-time login codes.</li>
          <li>
            To understand how well the service works (for example, how often businesses come back).
          </li>
        </ul>
        <p>We don&apos;t sell your information or use it for advertising.</p>
      </Section>

      <Section title="Who can see it">
        <ul className="list-disc space-y-1 pl-5">
          <li>Our admin team can see everything, to run the service.</li>
          <li>
            Students see a project&apos;s description, deliverable, deadline and pay. They never see
            a business&apos;s contact details or budget.
          </li>
          <li>
            Businesses see the work delivered for their project and the student&apos;s first name on
            the feedback form.
          </li>
          <li>Students can only see their own profile, submissions, offers and projects.</li>
        </ul>
      </Section>

      <Section title="Where it's stored">
        <p>
          Data and files are stored with our database and hosting providers (Supabase and Vercel).
          Uploaded files are private and only shared through short-lived links. Emails are sent
          through our email provider.
        </p>
      </Section>

      <Section title="Your choices">
        <p>
          You can update your student profile at any time. To get a copy of your data, or to have
          your account and data deleted, email {email}.
        </p>
      </Section>

      <Section title="Contact">
        <p>Questions about this page? Email {email}.</p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 text-sm leading-relaxed">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

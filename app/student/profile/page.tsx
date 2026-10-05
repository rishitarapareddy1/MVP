import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { getOwnStudent } from "@/lib/db/students";
import { isUniversityEmail } from "@/lib/students/verification";
import { ProfileForm } from "./profile-form";
import { ResumeUpload } from "./resume-upload";
import { UniversityEmailCard } from "./university-email-card";

export default async function StudentProfilePage() {
  const me = await requireStudent();
  const student = await getOwnStudent(me.id);
  const resumeUrl = student.resume_path
    ? await signedUrl(BUCKETS.resumes, student.resume_path)
    : null;
  const verifiedVia = isUniversityEmail(me.email)
    ? "login"
    : student.university_email_verified_at
      ? "code"
      : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Your profile"
        description="Businesses never see this page. We use it to match you to projects."
      />
      <Card>
        <CardHeader>
          <CardTitle>University email</CardTitle>
        </CardHeader>
        <CardContent>
          <UniversityEmailCard verifiedEmail={student.university_email} verifiedVia={verifiedVia} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm student={student} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
        </CardHeader>
        <CardContent>
          <ResumeUpload studentId={me.id} currentUrl={resumeUrl} />
        </CardContent>
      </Card>
    </div>
  );
}

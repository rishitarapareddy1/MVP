import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStudent } from "@/lib/auth/session";
import { BUCKETS, signedUrl } from "@/lib/db/storage";
import { getOwnStudent } from "@/lib/db/students";
import { ProfileForm } from "./profile-form";
import { ResumeUpload } from "./resume-upload";

export default async function StudentProfilePage() {
  const me = await requireStudent();
  const student = await getOwnStudent(me.id);
  const resumeUrl = student.resume_path
    ? await signedUrl(BUCKETS.resumes, student.resume_path)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Your profile</h1>
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

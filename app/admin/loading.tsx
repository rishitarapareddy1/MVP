import { PageSkeleton } from "@/components/page-skeleton";

// Shown inside the admin shell while a page loads, so navigation feels instant.
export default function Loading() {
  return <PageSkeleton />;
}

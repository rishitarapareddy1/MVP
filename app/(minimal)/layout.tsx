import { PublicShell } from "@/components/shell/public-shell";

// Pages for people who arrive with a specific job to do (business feedback):
// logo only, no marketing links.
export default function MinimalLayout({ children }: LayoutProps<"/">) {
  return <PublicShell minimal>{children}</PublicShell>;
}

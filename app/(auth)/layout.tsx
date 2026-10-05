import { PublicShell } from "@/components/shell/public-shell";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <PublicShell minimal>{children}</PublicShell>;
}

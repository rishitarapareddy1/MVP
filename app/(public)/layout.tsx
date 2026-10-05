import { PublicShell } from "@/components/shell/public-shell";

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <PublicShell>{children}</PublicShell>;
}

import {
  BarChart3,
  Code2,
  Globe,
  LineChart,
  Megaphone,
  Presentation,
  Search,
  Shapes,
  Table2,
  Terminal,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import type { ProjectCategory } from "@/lib/db/types";
import { cn } from "@/lib/utils";

/** One icon per project category, used on assessment and project cards. */
export const CATEGORY_ICONS: Record<ProjectCategory, LucideIcon> = {
  market_research: Search,
  competitor_analysis: BarChart3,
  data_cleanup: Wand2,
  data_analysis: LineChart,
  lead_research: Users,
  spreadsheet_work: Table2,
  presentation: Presentation,
  website_qa: Globe,
  social_media_analysis: Megaphone,
  web_development: Code2,
  software_development: Terminal,
  other: Shapes,
};

export function CategoryIcon({
  category,
  className,
  tone = "soft",
}: {
  category: ProjectCategory;
  className?: string;
  /** soft = orange tint (on light cards), solid = orange fill (on ink). */
  tone?: "soft" | "solid";
}) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-xl",
        tone === "soft" ? "bg-brand-soft text-brand-foreground" : "bg-brand text-brand-foreground",
        className,
      )}
      aria-hidden
    >
      <Icon className="size-5" />
    </span>
  );
}

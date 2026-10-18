import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Logo: an ink tile with an orange "match" dot, plus the product name.
 *  onDark: an orange tile with an ink line, for use on ink backgrounds. */
export function BrandMark({
  href = "/",
  className,
  showName = true,
  onDark = false,
}: {
  href?: string;
  className?: string;
  showName?: boolean;
  onDark?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold", className)}>
      <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden>
        <rect width="24" height="24" rx="6" className={onDark ? "fill-brand" : "fill-ink"} />
        <path
          d="M6.5 15.5 10 9l3.5 6.5L17 9"
          fill="none"
          className={onDark ? "stroke-ink" : "stroke-white"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="9" r="2.4" className={onDark ? "fill-ink" : "fill-brand"} />
      </svg>
      {showName && <span className="tracking-tight whitespace-nowrap">{BRAND.name}</span>}
    </Link>
  );
}

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Logo: a navy tile with an amber "match" dot, plus the product name. */
export function BrandMark({
  href = "/",
  className,
  showName = true,
}: {
  href?: string;
  className?: string;
  showName?: boolean;
}) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold", className)}>
      <svg viewBox="0 0 24 24" className="size-7 shrink-0" aria-hidden>
        <rect width="24" height="24" rx="6" className="fill-primary" />
        <path
          d="M6.5 15.5 10 9l3.5 6.5L17 9"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17" cy="9" r="2.4" className="fill-brand" />
      </svg>
      {showName && <span className="tracking-tight whitespace-nowrap">{BRAND.name}</span>}
    </Link>
  );
}

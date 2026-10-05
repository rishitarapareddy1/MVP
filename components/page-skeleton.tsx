/** Placeholder shown while a page's data loads (used by loading.tsx files). */
export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <div className="bg-muted h-7 w-56 rounded-md" />
        <div className="bg-muted h-4 w-80 max-w-full rounded-md" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-card flex flex-col gap-3 rounded-xl border p-5">
          <div className="bg-muted h-4 w-40 rounded-md" />
          <div className="bg-muted h-3 w-full rounded-md" />
          <div className="bg-muted h-3 w-2/3 rounded-md" />
        </div>
      ))}
    </div>
  );
}

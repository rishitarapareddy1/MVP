import * as React from "react";
import { cn } from "cn";

// A plain <select> styled like <Input>. Native selects work with FormData,
// are accessible by default and behave well on phones.
function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 bg-card h-10 w-full min-w-0 rounded-lg border px-2.5 py-1 text-base outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };

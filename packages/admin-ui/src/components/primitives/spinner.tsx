import * as React from "react";
import { cn } from "lib/utils";
import { Loader2Icon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<typeof Loader2Icon>) {
  return (
    <Loader2Icon role="status" aria-label="Loading" className={cn("tw:size-4 tw:animate-spin", className)} {...props} />
  );
}

export { Spinner };

import * as React from "react";

import { cn } from "lib/utils";

function Card({ className, size = "default", ...props }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "tw:group/card tw:flex tw:flex-col tw:gap-4 tw:overflow-hidden tw:rounded-xl tw:bg-card tw:py-4 tw:text-sm tw:text-card-foreground tw:ring-1 tw:ring-foreground/10 tw:has-data-[slot=card-footer]:pb-0 tw:has-[>img:first-child]:pt-0 tw:data-[size=sm]:gap-3 tw:data-[size=sm]:py-3 tw:data-[size=sm]:has-data-[slot=card-footer]:pb-0 tw:*:[img:first-child]:rounded-t-xl tw:*:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  );
}

/**
 * An interactive card rendered as a `<button>` element.
 *
 * Use this when the entire card surface should be clickable (e.g.
 * navigation cards, selection tiles). It provides:
 * - `role="button"` semantics (native `<button>`)
 * - Keyboard activation (Enter / Space)
 * - Focus-visible ring
 * - Hover lift + ring highlight
 *
 * Accepts all the same children as `Card` (`CardHeader`, `CardContent`, …).
 */
function ClickableCard({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"button"> & { size?: "default" | "sm" }) {
  return (
    <button
      data-slot="card"
      data-size={size}
      className={cn(
        /* base card styles */
        "tw:group/card tw:flex tw:w-full tw:flex-col tw:gap-4 tw:overflow-hidden tw:rounded-xl tw:bg-card tw:py-4 tw:text-left tw:text-sm tw:text-card-foreground tw:ring-1 tw:ring-foreground/10 tw:has-data-[slot=card-footer]:pb-0 tw:has-[>img:first-child]:pt-0 tw:data-[size=sm]:gap-3 tw:data-[size=sm]:py-3 tw:data-[size=sm]:has-data-[slot=card-footer]:pb-0 tw:*:[img:first-child]:rounded-t-xl tw:*:[img:last-child]:rounded-b-xl",
        /* interactive styles */
        "tw:cursor-pointer tw:outline-none tw:transition-all tw:duration-200",
        "tw:hover:ring-2 tw:hover:ring-primary/50 tw:hover:shadow-lg tw:hover:shadow-primary/5 tw:hover:-translate-y-0.5",
        "tw:focus-visible:ring-2 tw:focus-visible:ring-ring tw:focus-visible:ring-offset-2 tw:focus-visible:ring-offset-background",
        "tw:active:translate-y-0 tw:active:shadow-sm",
        "tw:disabled:pointer-events-none tw:disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "tw:group/card-header tw:@container/card-header tw:grid tw:auto-rows-min tw:items-start tw:gap-1 tw:rounded-t-xl tw:px-4 tw:group-data-[size=sm]/card:px-3 tw:has-data-[slot=card-action]:grid-cols-[1fr_auto] tw:has-data-[slot=card-description]:grid-rows-[auto_auto] tw:[.border-b]:pb-4 tw:group-data-[size=sm]/card:[.border-b]:pb-3",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("tw:text-base tw:leading-snug tw:font-medium tw:group-data-[size=sm]/card:text-sm", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-description" className={cn("tw:text-sm tw:text-muted-foreground", className)} {...props} />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("tw:col-start-2 tw:row-span-2 tw:row-start-1 tw:self-start tw:justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("tw:px-4 tw:group-data-[size=sm]/card:px-3", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "tw:flex tw:items-center tw:rounded-b-xl tw:border-t tw:bg-muted/50 tw:p-4 tw:group-data-[size=sm]/card:p-3",
        className
      )}
      {...props}
    />
  );
}

export { Card, ClickableCard, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };

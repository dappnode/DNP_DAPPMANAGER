import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "radix-ui";

import { cn } from "lib/utils";
import { Button } from "components/primitives/button";

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "tw-base tw:fixed tw:inset-0 tw:z-50 tw:bg-black/10 tw:duration-100 tw:supports-backdrop-filter:backdrop-blur-xs tw:data-[state=open]:animate-in tw:data-[state=open]:fade-in-0 tw:data-[state=closed]:animate-out tw:data-[state=closed]:fade-out-0",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: "default" | "sm";
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "tw-base tw:group/alert-dialog-content tw:fixed tw:top-1/2 tw:left-1/2 tw:z-50 tw:grid tw:w-full tw:-translate-x-1/2 tw:-translate-y-1/2 tw:gap-4 tw:rounded-xl tw:bg-background tw:p-4 tw:ring-1 tw:ring-foreground/10 tw:duration-100 tw:outline-none tw:data-[size=default]:max-w-xs tw:data-[size=sm]:max-w-xs tw:data-[size=default]:sm:max-w-sm tw:data-[state=open]:animate-in tw:data-[state=open]:fade-in-0 tw:data-[state=open]:zoom-in-95 tw:data-[state=closed]:animate-out tw:data-[state=closed]:fade-out-0 tw:data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "tw:grid tw:grid-rows-[auto_1fr] tw:place-items-center tw:gap-1.5 tw:text-center tw:has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] tw:has-data-[slot=alert-dialog-media]:gap-x-4 tw:sm:group-data-[size=default]/alert-dialog-content:place-items-start tw:sm:group-data-[size=default]/alert-dialog-content:text-left tw:sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "tw:-mx-4 tw:-mb-4 tw:flex tw:flex-col-reverse tw:gap-2 tw:rounded-b-xl tw:border-t tw:bg-muted/50 tw:p-4 tw:group-data-[size=sm]/alert-dialog-content:grid tw:group-data-[size=sm]/alert-dialog-content:grid-cols-2 tw:sm:flex-row tw:sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "tw:mb-2 tw:inline-flex tw:size-10 tw:items-center tw:justify-center tw:rounded-md tw:bg-muted tw:sm:group-data-[size=default]/alert-dialog-content:row-span-2 tw:*:[svg:not([class*=size-])]:size-6",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "tw:text-base tw:font-medium tw:sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "tw:text-sm tw:text-balance tw:text-muted-foreground tw:md:text-pretty tw:*:[a]:underline tw:*:[a]:underline-offset-3 tw:*:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(className)} {...props} />
    </Button>
  );
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(className)} {...props} />
    </Button>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger
};

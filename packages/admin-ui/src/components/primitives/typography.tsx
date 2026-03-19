import * as React from "react";
import { cn } from "lib/utils";

function TypographyH1({ className, ...props }: React.ComponentProps<"h1">) {
  return (
    <h1
      data-slot="typography-h1"
      className={cn(
        "tw:scroll-m-20 tw:text-4xl tw:font-extrabold tw:tracking-tight tw:text-foreground lg:tw:text-5xl",
        className
      )}
      {...props}
    />
  );
}

function TypographyH2({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="typography-h2"
      className={cn(
        "tw:scroll-m-20 tw:border-b tw:pb-2 tw:text-3xl tw:font-semibold tw:tracking-tight tw:text-foreground tw:first:mt-0",
        className
      )}
      {...props}
    />
  );
}

function TypographyH3({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="typography-h3"
      className={cn("tw:scroll-m-20 tw:text-2xl tw:font-semibold tw:tracking-tight tw:text-foreground", className)}
      {...props}
    />
  );
}

function TypographyH4({ className, ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="typography-h4"
      className={cn("tw:scroll-m-20 tw:text-xl tw:font-semibold tw:tracking-tight tw:text-foreground", className)}
      {...props}
    />
  );
}

function TypographyP({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="typography-p"
      className={cn("tw:leading-7 tw:text-foreground tw:[&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  );
}

function TypographyBlockquote({ className, ...props }: React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      data-slot="typography-blockquote"
      className={cn("tw:mt-6 tw:border-l-2 tw:pl-6 tw:italic tw:text-muted-foreground", className)}
      {...props}
    />
  );
}

function TypographyInlineCode({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      data-slot="typography-inline-code"
      className={cn(
        "tw:relative tw:rounded tw:bg-muted tw:px-[0.3rem] tw:py-[0.2rem] tw:font-mono tw:text-sm tw:font-semibold",
        className
      )}
      {...props}
    />
  );
}

function TypographyLead({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="typography-lead" className={cn("tw:text-xl tw:text-muted-foreground", className)} {...props} />;
}

function TypographyLarge({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="typography-large"
      className={cn("tw:text-lg tw:font-semibold tw:text-foreground", className)}
      {...props}
    />
  );
}

function TypographySmall({ className, ...props }: React.ComponentProps<"small">) {
  return (
    <small
      data-slot="typography-small"
      className={cn("tw:text-sm tw:font-medium tw:leading-none", className)}
      {...props}
    />
  );
}

function TypographyMuted({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="typography-muted" className={cn("tw:text-sm tw:text-muted-foreground", className)} {...props} />;
}

export {
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographyBlockquote,
  TypographyInlineCode,
  TypographyLead,
  TypographyLarge,
  TypographySmall,
  TypographyMuted
};

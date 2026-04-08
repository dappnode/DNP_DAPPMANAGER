import * as React from "react";
import { cn } from "lib/utils";
import { TypographyH3, TypographyMuted } from "components/primitives/typography";

/**
 * Page-level container that applies the standard page padding and
 * vertical rhythm. Use this as the outermost wrapper inside every
 * route component rendered within `AiLayout`.
 *
 * ```tsx
 * <PageContainer>
 *   <PageHeader title="Packages" description="Manage your packages." />
 *   <MyContent />
 * </PageContainer>
 * ```
 */
function PageContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-container"
      className={cn("tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y", className)}
      {...props}
    />
  );
}

/**
 * Standardised page header with a title and optional description.
 *
 * Renders a semantic `<header>` element containing:
 * - A `<PageTitle>` (TypographyH3) for the page heading
 * - An optional `<PageDescription>` (TypographyMuted) paragraph
 *
 * Supports both the shorthand props API and composition:
 *
 * ```tsx
 * // Shorthand
 * <PageHeader title="Store" description="Browse AI packages." />
 *
 * // Composed (for custom content)
 * <PageHeader>
 *   <PageTitle>Store</PageTitle>
 *   <PageDescription>Browse AI packages.</PageDescription>
 *   <Button>Custom action</Button>
 * </PageHeader>
 * ```
 */
function PageHeader({
  className,
  title,
  description,
  children,
  ...props
}: React.ComponentProps<"header"> & {
  /** Shorthand: renders a `<PageTitle>` with this text. */
  title?: React.ReactNode;
  /** Shorthand: renders a `<PageDescription>` below the title. */
  description?: React.ReactNode;
}) {
  return (
    <header data-slot="page-header" className={cn("tw:flex tw:flex-col", className)} {...props}>
      {title && <PageTitle>{title}</PageTitle>}
      {description && <PageDescription>{description}</PageDescription>}
      {children}
    </header>
  );
}

/**
 * The main heading for a page — wraps `TypographyH3` to ensure
 * consistent page-level heading style across all routes.
 */
function PageTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <TypographyH3 data-slot="page-title" className={className} {...props} />;
}

/**
 * A muted description paragraph that sits below `<PageTitle>`.
 * Wraps `TypographyMuted` and adds the standard `header-gap`
 * spacing token and max-width constraint.
 */
function PageDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <TypographyMuted
      data-slot="page-description"
      className={cn("tw:mt-header-gap tw:max-w-2xl", className)}
      {...props}
    />
  );
}

export { PageContainer, PageHeader, PageTitle, PageDescription };

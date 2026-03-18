import React from "react";
import { DecorativeBackground } from "./DecorativeBackground";

/**
 * Base layout wrapper for all new pages in `pages-new/`.
 *
 * Provides:
 * - `.tw-base` scoped reset (box-sizing, font, etc.)
 * - `tw:bg-background` + `tw:min-h-screen`
 * - Optional decorative gradient-orb background
 * - `tw:overflow-hidden` to clip orbs that bleed outside the viewport
 *
 * Usage:
 * ```tsx
 * <NewPageLayout>
 *   <MyPageContent />
 * </NewPageLayout>
 *
 * // Without decorative background:
 * <NewPageLayout decorativeBackground={false}>
 *   <PlainContent />
 * </NewPageLayout>
 * ```
 */
export function NewPageLayout({
  children,
  decorativeBackground = true,
  className
}: {
  children: React.ReactNode;
  /** Show the gradient-orb decorative background. Defaults to `true`. */
  decorativeBackground?: boolean;
  /** Extra classes merged onto the outer wrapper. */
  className?: string;
}) {
  return (
    <div
      className={[
        "tw-base tw:relative tw:flex tw:flex-col tw:min-h-screen tw:bg-background tw:overflow-hidden",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {decorativeBackground && <DecorativeBackground />}

      {/* Content sits above the decorative layer */}
      <div className="tw:relative tw:z-10 tw:flex tw:flex-1 tw:flex-col">{children}</div>
    </div>
  );
}

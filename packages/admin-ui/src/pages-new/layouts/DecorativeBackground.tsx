import React from "react";

/**
 * Decorative background layer with gradient orbs and dot-grid overlay.
 *
 * Designed to sit behind page content as an absolute-positioned layer.
 * Used by `NewPageLayout` to provide a consistent visual feel across
 * all new pages in `pages-new/`.
 *
 * Orb opacities are reduced in dark mode so the colours blend into the
 * dark background without overwhelming the UI.
 *
 * This component is purely presentational — it renders no interactive
 * elements and is hidden from assistive technology.
 */
export function DecorativeBackground() {
  return (
    <div className="tw:pointer-events-none tw:absolute tw:inset-0 tw:overflow-hidden" aria-hidden>
      {/* Orb — top-left (purple) */}
      <div className="tw:absolute tw:-top-40 tw:-left-40 tw:size-[600px] tw:rounded-full tw:opacity-20 tw:dark:opacity-10 tw:blur-3xl tw:bg-dn-purple" />
      {/* Orb — top-right (orange) */}
      <div className="tw:absolute tw:-top-24 tw:-right-32 tw:size-[400px] tw:rounded-full tw:opacity-15 tw:dark:opacity-8 tw:blur-3xl tw:bg-dn-orange" />
      {/* Orb — bottom-left (blue) */}
      <div className="tw:absolute tw:-bottom-32 tw:-left-20 tw:size-[450px] tw:rounded-full tw:opacity-12 tw:dark:opacity-8 tw:blur-3xl tw:bg-dn-blue" />
      {/* Orb — bottom-right (pink) */}
      <div className="tw:absolute tw:-bottom-40 tw:-right-40 tw:size-[550px] tw:rounded-full tw:opacity-15 tw:dark:opacity-8 tw:blur-3xl tw:bg-dn-pink" />
      {/* Subtle dot-grid overlay */}
      <div
        className="tw:absolute tw:inset-0 tw:opacity-[0.03] tw:dark:opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />
    </div>
  );
}

import React from "react";

/**
 * New home page using Tailwind v4 + shadcn/ui.
 * This replaces the legacy dashboard as the root route.
 */
export function NewHomePage() {
  return (
    <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[50vh]">
      <div className="tw:text-center">
        <h1 className="tw:text-3xl tw:font-bold tw:mb-4">Welcome to DAppNode</h1>
        <p className="tw:text-lg tw:text-red-600">New UI — powered by Tailwind + shadcn</p>
      </div>
    </div>
  );
}

import React from "react";
import { Routes, Route } from "react-router-dom";
import { Button } from "components/ui/button";

/**
 * Layout for the /ai/* routes using Tailwind v4 + shadcn/ui.
 */
function AiHome() {
  return (
    <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[50vh]">
      <div className="tw:text-center">
        <h1 className="tw:text-3xl tw:font-bold tw:mb-4">AI</h1>
        <p className="tw:text-lg tw:text-muted-foreground tw:mb-8">AI-powered features — coming soon</p>

        <div className="tw:flex tw:flex-col tw:gap-6 tw:items-center">
          {/* All variants */}
          <div className="tw:flex tw:flex-wrap tw:gap-3 tw:justify-center">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>

          {/* Size variants */}
          <div className="tw:flex tw:flex-wrap tw:gap-3 tw:items-center tw:justify-center">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>

          {/* Disabled state */}
          <div className="tw:flex tw:flex-wrap tw:gap-3 tw:justify-center">
            <Button disabled>Disabled Default</Button>
            <Button variant="outline" disabled>
              Disabled Outline
            </Button>
            <Button variant="destructive" disabled>
              Disabled Destructive
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiLayout() {
  return (
    <Routes>
      <Route index element={<AiHome />} />
    </Routes>
  );
}

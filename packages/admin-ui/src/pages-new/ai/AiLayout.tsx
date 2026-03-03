import React from "react";
import { Routes, Route } from "react-router-dom";

/**
 * Layout for the /ai/* routes using Tailwind v4 + shadcn/ui.
 */
function AiHome() {
  return (
    <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[50vh]">
      <div className="tw:text-center">
        <h1 className="tw:text-3xl tw:font-bold tw:mb-4">AI</h1>
        <p className="tw:text-lg tw:text-gray-600">AI-powered features — coming soon</p>
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

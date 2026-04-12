import React from "react";
import { Separator } from "components/primitives/separator";
import { SystemUpdateSection } from "./SystemUpdateSection";
import { AutoUpdatesSection } from "./AutoUpdatesSection";

export function UpdatesTab() {
  return (
    <div className="tw:space-y-6">
      <SystemUpdateSection />
      <Separator />
      <AutoUpdatesSection />
    </div>
  );
}

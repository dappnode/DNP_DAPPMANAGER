import React from "react";
import { Separator } from "components/primitives/separator";
import { AutoDiagnoseSection } from "./AutoDiagnoseSection";
import { ReportSection } from "./ReportSection";
import { ActivitySection } from "./ActivitySection";

export function InfoTab() {
  return (
    <div className="tw:space-y-6">
      <AutoDiagnoseSection />
      <Separator />
      <ReportSection />
      <Separator />
      <ActivitySection />
    </div>
  );
}

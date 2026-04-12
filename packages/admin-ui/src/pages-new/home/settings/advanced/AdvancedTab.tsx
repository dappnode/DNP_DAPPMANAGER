import React from "react";
import { Separator } from "components/primitives/separator";
import { VolumesSection } from "./VolumesSection";
import { ContentProviderSection } from "./ContentProviderSection";
import { TrustedKeysSection } from "./TrustedKeysSection";
import { ClearCacheSection } from "./ClearCacheSection";
import { ClearMainDbSection } from "./ClearMainDbSection";

export function AdvancedTab() {
  return (
    <div className="tw:space-y-6">
      <VolumesSection />
      <Separator />
      <ContentProviderSection />
      <Separator />
      <TrustedKeysSection />
      <Separator />
      <ClearCacheSection />
      <Separator />
      <ClearMainDbSection />
    </div>
  );
}

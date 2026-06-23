import React from "react";
import { Separator } from "components/primitives/separator";
import { ChangePasswordSection } from "./ChangePasswordSection";
import { ChangeDappnodeNameSection } from "./ChangeDappnodeNameSection";

export function ProfileTab() {
  return (
    <div className="tw:space-y-6">
      <ChangePasswordSection />
      <Separator />
      <ChangeDappnodeNameSection />
    </div>
  );
}

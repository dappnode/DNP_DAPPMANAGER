import React from "react";
import { Separator } from "components/primitives/separator";
import { IpfsClientSection } from "./IpfsClientSection";
import { IpfsPeersSection } from "./IpfsPeersSection";

export function IpfsTab() {
  return (
    <div className="tw:space-y-6">
      <IpfsClientSection />
      <Separator />
      <IpfsPeersSection />
    </div>
  );
}

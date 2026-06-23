import React from "react";
import { Separator } from "components/primitives/separator";
import { WifiStatusSection } from "./WifiStatusSection";
import { WifiCredentialsSection } from "./WifiCredentialsSection";
import { LocalNetworkProxySection } from "./LocalNetworkProxySection";

export function WifiTab() {
  return (
    <div className="tw:space-y-6">
      <WifiStatusSection />
      <Separator />
      <WifiCredentialsSection />
      <Separator />
      <LocalNetworkProxySection />
    </div>
  );
}

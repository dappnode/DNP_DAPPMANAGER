import React from "react";
import WifiCredentials from "./WifiCredentials";
import WifiStatus from "./WifiStatus";

export default function WifiHome() {
  return (
    <div className="section-spacing">
      <WifiStatus />
      <WifiCredentials />
    </div>
  );
}

import React from "react";
// Own module
import { title } from "../data";
// Components
import Title from "components/Title";
import WifiService from "./WifiService";
import WifiCredentials from "./WifiCredentials";

export default function WifiHome() {
  return (
    <>
      <Title title={title} />
      <p>
        Connect to your dappnode through the wifi hostpot exposed by your
        dappnode.
      </p>
      <WifiService />
      <WifiCredentials />
    </>
  );
}

// Brief introduction
// Allow to change restart policy?
// Show wifi status (if no running show why)
// Show wifi creds and settings (setupwizard)
// Allow to change wifi credentials
// Add default dappnode wifi hostpot credentials somewhere
// Add explanation of: internalIP === externalIP

// issue stop avahi daemon (it exposes UI in internal network port 80)
